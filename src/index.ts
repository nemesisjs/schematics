/**
 * @nemesis-js/schematics
 *
 * Public API — everything the CLI (and external integrations) need.
 */

// Engine
export { SchematicEngine } from './engine/schematic-engine';
export type { SchematicResult } from './engine/schematic-engine';

// Tree
export { Tree } from './engine/tree';
export type { FileEntry, FileOperation, OperationType } from './engine/tree';

// Rules
export { executeRules, templateRule, templateDirRule, moduleUpdateRule, ifElse, chainRules } from './engine/rule';
export type { Rule } from './engine/rule';

// Context
export type { SchematicContext } from './engine/context';

// Utilities
export { toPascalCase, toKebabCase, toCamelCase } from './utils/naming';
export { addDeclarationToModule } from './utils/ast';
