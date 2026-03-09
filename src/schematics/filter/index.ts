/**
 * @nemesis-js/schematics - Filter schematic
 *
 * Generates `src/<kebab>/<kebab>.filter.ts` and optionally
 * `src/<kebab>/<kebab>.filter.spec.ts`.
 *
 * Filters are not auto-registered in any module — they are applied
 * at the route or app level via `@UseFilters()`.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ifElse, templateRule } from '../../engine/rule';
import type { Rule, SchematicContext } from '../../engine/rule';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filesDir = join(__dirname, 'files');

export default function filterFactory(ctx: SchematicContext): Rule[] {
  const { kebabName, templateVars, options } = ctx;
  const noSpec = Boolean(options['noSpec']);
  const srcDir = join('src', kebabName);

  return [
    templateRule(
      join(filesDir, '__kebabName__.filter.ts.mustache'),
      `${srcDir}/${kebabName}.filter.ts`,
      templateVars,
    ),
    ifElse(
      !noSpec,
      templateRule(
        join(filesDir, '__kebabName__.filter.spec.ts.mustache'),
        `${srcDir}/${kebabName}.filter.spec.ts`,
        templateVars,
      ),
    ),
  ];
}
