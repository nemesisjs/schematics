/**
 * @nemesis-js/schematics - Controller schematic
 *
 * Generates `src/<kebab>/<kebab>.controller.ts` and optionally
 * `src/<kebab>/<kebab>.controller.spec.ts`, then registers the
 * controller in the nearest parent `*.module.ts`.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ifElse, moduleUpdateRule, templateRule } from '../../engine/rule';
import type { Rule, SchematicContext } from '../../engine/rule';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filesDir = join(__dirname, 'files');

export default function controllerFactory(ctx: SchematicContext): Rule[] {
  const { kebabName, pascalName, targetDir, templateVars, options } = ctx;
  const noSpec = Boolean(options['noSpec']);
  const srcDir = join('src', kebabName);

  return [
    // ── Generated files ────────────────────────────────────────────────────
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

    // ── Module registration ────────────────────────────────────────────────
    // Walk up from src/<kebab>/ → find nearest *.module.ts → add to controllers[]
    moduleUpdateRule(
      join(targetDir, 'src', kebabName),
      `${pascalName}Controller`,
      `./${kebabName}.controller`,
      'controller',
    ),
  ];
}
