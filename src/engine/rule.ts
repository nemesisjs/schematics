/**
 * @nemesis-js/schematics - Rule system
 *
 * A Rule is a pure function: (Tree, Context) → Tree.
 * Rules are composed via chainRules() and executed by SchematicEngine.
 *
 * Built-in rule factories:
 *   templateRule()     — render a Mustache template → stage file in Tree
 *   moduleUpdateRule() — inject import + array entry into a .module.ts file
 *   ifElse()           — conditional rule branching
 *   chainRules()       — compose multiple rules into one
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import ejs from 'ejs';
import type { SchematicContext } from './context';
export type { SchematicContext } from './context';
import { Tree } from './tree';
import { addDeclarationToModule } from '../utils/ast';

// ── Core type ─────────────────────────────────────────────────────────────────

export type Rule = (tree: Tree, ctx: SchematicContext) => Tree | Promise<Tree>;

// ── Execution helpers ─────────────────────────────────────────────────────────

/** Execute a sequence of rules, threading the same Tree through each one. */
export async function executeRules(
  rules: Rule[],
  tree: Tree,
  ctx: SchematicContext,
): Promise<Tree> {
  let t = tree;
  for (const rule of rules) {
    t = await Promise.resolve(rule(t, ctx));
  }
  return t;
}

// ── Rule factories ────────────────────────────────────────────────────────────

/**
 * Render a Mustache template file and stage the result in the Tree.
 *
 * @param templatePath  Absolute path to the .mustache source file.
 * @param targetPath    Relative path (from project root) where the file is written.
 * @param vars          Variables passed to mustache.render().
 */
export function templateRule(
  templatePath: string,
  targetPath: string,
  vars: Record<string, unknown>,
): Rule {
  return async (tree: Tree): Promise<Tree> => {
    const source = await readFile(templatePath, 'utf8');
    // Use <%- %> tags (unescaped) — safe for code generation, matches NestJS style
    const content = ejs.render(source, vars, { escape: String });
    return tree.create(targetPath, content);
  };
}

/**
 * Render all *.ejs files in a directory into the Tree.
 * File names are processed:
 *   - Strip ".ejs" suffix.
 *   - Replace `__kebabName__` with the actual kebab name.
 *   - Leading-dot names are stored as-is (e.g. "gitignore" → ".gitignore").
 *
 * @param filesDir      Absolute path to the directory containing *.ejs files.
 * @param targetDir     Relative path (from project root) where files are written.
 * @param vars          Template variables.
 */
export function templateDirRule(
  filesDir: string,
  targetDir: string,
  vars: Record<string, unknown>,
): Rule {
  return async (tree: Tree): Promise<Tree> => {
    const entries = await readDirRecursive(filesDir);

    for (const entry of entries) {
      const source = await readFile(entry.fullPath, 'utf8');
      const content = ejs.render(source, vars, { escape: String });

      // e.g. "__kebabName__.controller.ts.ejs" → "user.controller.ts"
      const relName = entry.relPath
        .replace(/\.ejs$/, '')
        .replace(/__kebabName__/g, vars['kebabName'] as string);

      // dot-file convention: "gitignore" → ".gitignore"
      const finalName = relName.replace(
        /(^|\/)(?!\.)(gitignore|prettierrc|prettierignore|eslintignore|env)$/,
        '$1.$2',
      );

      tree.create(join(targetDir, finalName), content);
    }

    return tree;
  };
}

/**
 * Find the nearest *.module.ts file walking up from `startDir` and inject
 * an import statement + array entry into its @Module decorator.
 *
 * @param startDir    Directory to start searching from (usually the generated file's dir).
 * @param className   The class name to add (e.g. 'UserController').
 * @param importFrom  The import path relative to the module file (e.g. './user/user.controller').
 * @param arrayType   Which @Module array to update: 'controller' | 'provider' | 'import'.
 */
export function moduleUpdateRule(
  startDir: string,
  className: string,
  importFrom: string,
  arrayType: 'controller' | 'provider' | 'import',
): Rule {
  return async (tree: Tree, _ctx: SchematicContext): Promise<Tree> => {
    // Locate the nearest module file on disk (it may not be staged in Tree yet)
    const modulePath = await findNearestModule(startDir);
    if (!modulePath) return tree; // no parent module found — skip silently

    // Read from Tree if already staged (e.g. module schematic just created it),
    // otherwise read from disk.
    let content: string;
    const relModulePath = modulePath.replace(process.cwd() + '/', '');

    if (tree.exists(relModulePath)) {
      content = tree.read(relModulePath)!;
    } else {
      content = await readFile(modulePath, 'utf8');
      tree.upsert(relModulePath, content);
    }

    const updated = addDeclarationToModule(content, className, importFrom, arrayType);
    return tree.update(relModulePath, () => updated);
  };
}

/**
 * Conditional rule — run `thenRule` when `condition` is true, else `elseRule`.
 */
export function ifElse(
  condition: boolean | ((ctx: SchematicContext) => boolean),
  thenRule: Rule,
  elseRule?: Rule,
): Rule {
  return (tree: Tree, ctx: SchematicContext): Tree | Promise<Tree> => {
    const result = typeof condition === 'function' ? condition(ctx) : condition;
    if (result) return thenRule(tree, ctx);
    if (elseRule) return elseRule(tree, ctx);
    return tree;
  };
}

/**
 * Compose multiple rules into a single Rule that runs them sequentially.
 */
export function chainRules(...rules: Rule[]): Rule {
  return (tree: Tree, ctx: SchematicContext): Promise<Tree> =>
    executeRules(rules, tree, ctx);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

interface DirEntry {
  fullPath: string;
  /** Path relative to the root filesDir */
  relPath: string;
}

async function readDirRecursive(dir: string, base = dir): Promise<DirEntry[]> {
  const { readdir, stat } = await import('fs/promises');
  const names = await readdir(dir);
  const results: DirEntry[] = [];

  for (const name of names) {
    const full = join(dir, name);
    const s = await stat(full);

    if (s.isDirectory()) {
      results.push(...(await readDirRecursive(full, base)));
    } else {
      results.push({ fullPath: full, relPath: full.slice(base.length + 1) });
    }
  }

  return results;
}

async function findNearestModule(startDir: string): Promise<string | null> {
  const { readdir } = await import('fs/promises');
  const { dirname: up } = await import('path');
  const root = process.cwd();

  let dir = startDir;

  while (dir.startsWith(root) && dir !== up(root)) {
    try {
      const names = await readdir(dir);
      const mod = names.find((n) => n.endsWith('.module.ts') && !n.includes('.spec.'));
      if (mod) return join(dir, mod);
    } catch {
      // directory may not exist on disk yet — keep walking up
    }
    const parent = up(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}
