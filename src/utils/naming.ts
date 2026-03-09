/**
 * @nemesis-js/schematics - Naming utilities
 *
 * Converts arbitrary strings into the naming conventions used by schematics.
 */

/** Convert a string to PascalCase — used for class names. */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

/** Convert a string to kebab-case — used for file names and URL paths. */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/** Convert a string to camelCase — used for variable and property names. */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
