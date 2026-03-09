/**
 * @nemesis-js/schematics - SchematicEngine
 *
 * The main entry point for running schematics.
 *
 * Usage:
 *   const engine = new SchematicEngine('/path/to/collection.json');
 *   const result = await engine.run('controller', 'User', { noSpec: false });
 *
 * What it does:
 *   1. Load collection.json and resolve the schematic by name or alias.
 *   2. Build SchematicContext with all naming variants + user options.
 *   3. Dynamically import the factory function.
 *   4. Invoke factory(context) → Rule[].
 *   5. Thread a fresh Tree through all rules.
 *   6. Commit the Tree to disk (writes files).
 *   7. Return SchematicResult with the list of files and operations.
 */

import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { toPascalCase, toKebabCase, toCamelCase } from '../utils/naming';
import { Tree } from './tree';
import { executeRules } from './rule';
import type { SchematicContext } from './context';
import type { Rule } from './rule';
import type { FileOperation } from './tree';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CollectionEntry {
  description?: string;
  factory: string;
  aliases?: string[];
}

interface Collection {
  name: string;
  version: string;
  schematics: Record<string, CollectionEntry>;
}

export interface SchematicResult {
  /** Schematic that was run (canonical name) */
  schematicName: string;
  /** Relative paths of every file written to disk */
  filesCreated: string[];
  /** Ordered CREATE/UPDATE log — used for CLI display */
  operations: FileOperation[];
}

// ── SchematicEngine ───────────────────────────────────────────────────────────

export class SchematicEngine {
  private readonly collectionDir: string;
  private collection: Collection | null = null;

  /**
   * @param collectionPath  Absolute path to a `collection.json` file.
   */
  constructor(private readonly collectionPath: string) {
    this.collectionDir = dirname(collectionPath);
  }

  /**
   * Run a schematic by name (or alias) for the given entity name.
   *
   * @param name        Schematic name or alias (e.g. 'co', 'controller').
   * @param entityName  The thing being generated (e.g. 'User', 'my-feature').
   * @param options     User-supplied flags ({ noSpec: true, noTest: false, ... }).
   */
  async run(
    name: string,
    entityName: string,
    options: Record<string, unknown> = {},
  ): Promise<SchematicResult> {
    const collection = await this.loadCollection();

    // Resolve alias → canonical name
    const canonicalName = this.resolveSchematic(collection, name);
    const entry = collection.schematics[canonicalName]!;

    // Build context
    const kebabName = toKebabCase(entityName);
    const pascalName = toPascalCase(entityName);
    const camelName = toCamelCase(entityName);

    const ctx: SchematicContext = {
      schematicName: canonicalName,
      pascalName,
      kebabName,
      camelName,
      targetDir: process.cwd(),
      options,
      templateVars: {
        pascalName,
        kebabName,
        camelName,
        // Convenience lower-case alias used by some templates
        name: kebabName,
        ...options,
      },
    };

    // Load and invoke factory
    const factory = await this.loadFactory(entry.factory);
    const rules: Rule[] = await Promise.resolve(factory(ctx));

    // Execute rules against a fresh Tree
    const tree = new Tree();
    const finalTree = await executeRules(Array.isArray(rules) ? rules : [rules], tree, ctx);

    // Commit to disk
    const filesCreated = await finalTree.commit(ctx.targetDir);

    return {
      schematicName: canonicalName,
      filesCreated,
      operations: finalTree.getOperations(),
    };
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private async loadCollection(): Promise<Collection> {
    if (this.collection) return this.collection;
    const raw = await readFile(this.collectionPath, 'utf8');
    this.collection = JSON.parse(raw) as Collection;
    return this.collection;
  }

  private resolveSchematic(collection: Collection, name: string): string {
    // Direct name match
    if (collection.schematics[name]) return name;

    // Alias match
    for (const [canonical, entry] of Object.entries(collection.schematics)) {
      if (entry.aliases?.includes(name)) return canonical;
    }

    const available = Object.keys(collection.schematics).join(', ');
    throw new Error(
      `Unknown schematic: "${name}"\nAvailable schematics: ${available}`,
    );
  }

  private async loadFactory(
    factoryPath: string,
  ): Promise<(ctx: SchematicContext) => Rule[] | Promise<Rule[]>> {
    // Resolve factory path relative to collection.json directory
    const absPath = resolve(this.collectionDir, factoryPath);

    // Dynamic import — Bun handles .ts natively
    const mod = (await import(absPath)) as Record<string, unknown>;

    // Convention: the factory is the default export
    const factory = mod['default'] ?? mod['factory'];

    if (typeof factory !== 'function') {
      throw new Error(
        `Invalid schematic factory at "${absPath}".\n` +
          `Expected a default export function, got: ${typeof factory}`,
      );
    }

    return factory as (ctx: SchematicContext) => Rule[] | Promise<Rule[]>;
  }
}
