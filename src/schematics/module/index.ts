/**
 * @nemesis-js/schematics - Module schematic
 *
 * Generates a self-contained feature module:
 *   src/<kebab>/
 *     <kebab>.module.ts       (controller + service pre-wired in @Module)
 *     <kebab>.controller.ts
 *     <kebab>.controller.spec.ts
 *     <kebab>.service.ts
 *     <kebab>.service.spec.ts
 *
 * Then imports the new module into the nearest parent `*.module.ts`.
 * The controller and service templates already reference each other, so
 * no additional module-registration step is needed for them.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ifElse, moduleUpdateRule, templateRule } from '../../engine/rule';
import type { Rule, SchematicContext } from '../../engine/rule';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filesDir = join(__dirname, 'files');

export default function moduleFactory(ctx: SchematicContext): Rule[] {
  const { kebabName, pascalName, targetDir, templateVars, options } = ctx;
  const noSpec = Boolean(options['noSpec']);
  const srcDir = join('src', kebabName);

  return [
    // ── Module file ────────────────────────────────────────────────────────
    templateRule(
      join(filesDir, '__kebabName__.module.ts.ejs'),
      `${srcDir}/${kebabName}.module.ts`,
      templateVars,
    ),

    // ── Controller ─────────────────────────────────────────────────────────
    templateRule(
      join(filesDir, '__kebabName__.controller.ts.ejs'),
      `${srcDir}/${kebabName}.controller.ts`,
      templateVars,
    ),
    ifElse(
      !noSpec,
      templateRule(
        join(filesDir, '__kebabName__.controller.spec.ts.ejs'),
        `${srcDir}/${kebabName}.controller.spec.ts`,
        templateVars,
      ),
    ),

    // ── Service ────────────────────────────────────────────────────────────
    templateRule(
      join(filesDir, '__kebabName__.service.ts.ejs'),
      `${srcDir}/${kebabName}.service.ts`,
      templateVars,
    ),
    ifElse(
      !noSpec,
      templateRule(
        join(filesDir, '__kebabName__.service.spec.ts.ejs'),
        `${srcDir}/${kebabName}.service.spec.ts`,
        templateVars,
      ),
    ),

    // ── Import this module into the nearest parent module ──────────────────
    // findNearestModule starts at src/<kebab>/ on disk — the new module
    // isn't on disk yet, so the search naturally walks up to the parent dir.
    moduleUpdateRule(
      join(targetDir, 'src', kebabName),
      `${pascalName}Module`,
      `./${kebabName}/${kebabName}.module`,
      'import',
    ),
  ];
}
