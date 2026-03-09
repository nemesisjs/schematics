/**
 * @nemesis-js/schematics - Guard schematic
 *
 * Generates `src/<kebab>/<kebab>.guard.ts` and optionally
 * `src/<kebab>/<kebab>.guard.spec.ts`.
 *
 * Guards are not auto-registered in any module — they are applied
 * at the route level via `@UseGuards()`.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ifElse, templateRule } from '../../engine/rule';
import type { Rule, SchematicContext } from '../../engine/rule';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filesDir = join(__dirname, 'files');

export default function guardFactory(ctx: SchematicContext): Rule[] {
  const { kebabName, templateVars, options } = ctx;
  const noSpec = Boolean(options['noSpec']);
  const srcDir = join('src', kebabName);

  return [
    templateRule(
      join(filesDir, '__kebabName__.guard.ts.ejs'),
      `${srcDir}/${kebabName}.guard.ts`,
      templateVars,
    ),
    ifElse(
      !noSpec,
      templateRule(
        join(filesDir, '__kebabName__.guard.spec.ts.ejs'),
        `${srcDir}/${kebabName}.guard.spec.ts`,
        templateVars,
      ),
    ),
  ];
}
