/**
 * @nemesis-js/schematics - AST utilities
 *
 * Pure string-transformation helpers for modifying TypeScript source files.
 * No file I/O here — the Tree handles reading and writing.
 */

type ModuleArrayType = 'controller' | 'provider' | 'import';

const ARRAY_NAME: Record<ModuleArrayType, string> = {
  controller: 'controllers',
  provider: 'providers',
  import: 'imports',
};

/**
 * Inject an import statement and a class reference into a `@Module` decorator
 * inside the given source `content` string.
 *
 * @param content     The full source code of the module file.
 * @param className   The class name to add (e.g. 'UserController').
 * @param importPath  The module-relative import path (e.g. './user/user.controller').
 * @param type        Which `@Module` array to update.
 * @returns           The modified source code.
 */
export function addDeclarationToModule(
  content: string,
  className: string,
  importPath: string,
  type: ModuleArrayType,
): string {
  // ── 1. Add import statement after the last existing import ──────────────────
  const importStatement = `import { ${className} } from '${importPath}';\n`;

  const importMatches = Array.from(content.matchAll(/^import.*from.*$/gm));
  if (importMatches.length > 0) {
    const lastMatch = importMatches[importMatches.length - 1];
    const insertPos = (lastMatch.index ?? 0) + lastMatch[0].length;
    content =
      content.slice(0, insertPos) + '\n' + importStatement + content.slice(insertPos);
    // Collapse triple-or-more blank lines that might appear after insertion
    content = content.replace(/\n{3,}/g, '\n\n');
  } else {
    content = importStatement + '\n' + content;
  }

  // ── 2. Append className to the correct @Module array ───────────────────────
  const arrayName = ARRAY_NAME[type];
  const arrayRegex = new RegExp(`(${arrayName}\\s*:\\s*\\[)([^\\]]*)(\\])`);

  if (arrayRegex.test(content)) {
    content = content.replace(arrayRegex, (match, prefix, items, suffix) => {
      // Already registered — skip
      if (items.includes(className)) return match;

      const trimmed = items.trim();
      if (trimmed.length === 0) {
        return `${prefix}${className}${suffix}`;
      } else if (trimmed.endsWith(',')) {
        return `${prefix}${items} ${className},${suffix}`;
      } else {
        return `${prefix}${items}, ${className}${suffix}`;
      }
    });
  } else {
    // Array missing from @Module decorator — inject it
    const moduleDecoratorRegex = /@Module\s*\(\s*\{/;
    if (moduleDecoratorRegex.test(content)) {
      content = content.replace(
        moduleDecoratorRegex,
        `@Module({\n  ${arrayName}: [${className}],`,
      );
    }
  }

  return content;
}
