/**
 * @nemesis-js/schematics - SchematicContext
 *
 * Carries all naming variants and user options through the rule pipeline.
 * Built once by SchematicEngine.run() and passed to every Rule.
 */

export interface SchematicContext {
  /** The canonical schematic name (e.g. 'controller', 'application') */
  schematicName: string;

  /** Entity name in PascalCase — used for class names (e.g. 'UserController') */
  pascalName: string;

  /** Entity name in kebab-case — used for file names and route paths (e.g. 'user') */
  kebabName: string;

  /** Entity name in camelCase — used for variable names (e.g. 'userService') */
  camelName: string;

  /** Absolute path to the directory where files will be written */
  targetDir: string;

  /**
   * User-supplied options passed via CLI flags.
   * Common keys: noSpec (boolean), noTest (boolean)
   */
  options: Record<string, unknown>;

  /**
   * Pre-built variable bag passed directly to Mustache.render().
   * Includes all naming variants plus all options fields.
   */
  templateVars: Record<string, unknown>;
}
