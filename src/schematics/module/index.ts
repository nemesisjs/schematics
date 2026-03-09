/**
 * @nemesis-js/schematics - Module schematic
 *
 * Two modes controlled by `options.withFiles`:
 *
 *   withFiles: true  (default)  → full feature module:
 *     src/<kebab>/
 *       <kebab>.module.ts         (controller + service pre-wired in @Module)
 *       <kebab>.controller.ts
 *       <kebab>.controller.spec.ts
 *       <kebab>.service.ts
 *       <kebab>.service.spec.ts
 *
 *   withFiles: false → bare module only:
 *     src/<kebab>/
 *       <kebab>.module.ts         (empty @Module — no controller / service)
 *
 * In both modes the new module is imported into the nearest parent `*.module.ts`.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ifElse, moduleUpdateRule, templateRule } from '../../engine/rule';
import type { Rule, SchematicContext } from '../../engine/rule';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filesDir = join(__dirname, 'files');

export default function moduleFactory(ctx: SchematicContext): Rule[] {
  const { kebabName, pascalName, targetDir, templateVars, options } = ctx;
  const noSpec    = Boolean(options['noSpec']);
  const withFiles = options['withFiles'] !== false; // default: true
  const srcDir    = join('src', kebabName);

  // Choose the right module template:
  //   full  → __kebabName__.module.ts.ejs        (has controller + service in @Module)
  //   bare  → __kebabName__.module.bare.ts.ejs   (empty @Module)
  const moduleTpl = withFiles
    ? join(filesDir, '__kebabName__.module.ts.ejs')
    : join(filesDir, '__kebabName__.module.bare.ts.ejs');

  return [
    // ── Module file ────────────────────────────────────────────────────────
    templateRule(moduleTpl, `${srcDir}/${kebabName}.module.ts`, templateVars),

    // ── Controller (only when withFiles) ───────────────────────────────────
    ifElse(
      withFiles,
      templateRule(
        join(filesDir, '__kebabName__.controller.ts.ejs'),
        `${srcDir}/${kebabName}.controller.ts`,
        templateVars,
      ),
    ),
    ifElse(
      withFiles && !noSpec,
      templateRule(
        join(filesDir, '__kebabName__.controller.spec.ts.ejs'),
        `${srcDir}/${kebabName}.controller.spec.ts`,
        templateVars,
      ),
    ),

    // ── Service (only when withFiles) ──────────────────────────────────────
    ifElse(
      withFiles,
      templateRule(
        join(filesDir, '__kebabName__.service.ts.ejs'),
        `${srcDir}/${kebabName}.service.ts`,
        templateVars,
      ),
    ),
    ifElse(
      withFiles && !noSpec,
      templateRule(
        join(filesDir, '__kebabName__.service.spec.ts.ejs'),
        `${srcDir}/${kebabName}.service.spec.ts`,
        templateVars,
      ),
    ),

    // ── Import this module into the nearest parent module ──────────────────
    // findNearestModule walks up from src/<kebab>/ — since the new module
    // isn't on disk yet, the search naturally finds the parent module.
    moduleUpdateRule(
      join(targetDir, 'src', kebabName),
      `${pascalName}Module`,
      `src/${kebabName}/${kebabName}.module`,
      'import',
    ),
  ];
}
