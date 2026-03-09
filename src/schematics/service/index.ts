/**
 * @nemesis-js/schematics - Service schematic
 *
 * Generates `src/<kebab>/<kebab>.service.ts` and optionally
 * `src/<kebab>/<kebab>.service.spec.ts`, then registers the
 * service as a provider in the nearest parent `*.module.ts`.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ifElse, moduleUpdateRule, templateRule } from '../../engine/rule';
import type { Rule, SchematicContext } from '../../engine/rule';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filesDir = join(__dirname, 'files');

export default function serviceFactory(ctx: SchematicContext): Rule[] {
  const { kebabName, pascalName, targetDir, templateVars, options } = ctx;
  const noSpec = Boolean(options['noSpec']);
  const srcDir = join('src', kebabName);

  return [
    // ── Generated files ────────────────────────────────────────────────────
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

    // ── Module registration ────────────────────────────────────────────────
    // Walk up from src/<kebab>/ → find nearest *.module.ts → add to providers[]
    moduleUpdateRule(
      join(targetDir, 'src', kebabName),
      `${pascalName}Service`,
      `./${kebabName}.service`,
      'provider',
    ),
  ];
}
