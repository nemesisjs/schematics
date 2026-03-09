/**
 * @nemesis-js/schematics - Pipe schematic
 *
 * Generates `src/<kebab>/<kebab>.pipe.ts` and optionally
 * `src/<kebab>/<kebab>.pipe.spec.ts`.
 *
 * Pipes are not auto-registered in any module — they are applied
 * at the route or parameter level via `@UsePipes()`.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ifElse, templateRule } from '../../engine/rule';
import type { Rule, SchematicContext } from '../../engine/rule';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filesDir = join(__dirname, 'files');

export default function pipeFactory(ctx: SchematicContext): Rule[] {
  const { kebabName, templateVars, options } = ctx;
  const noSpec = Boolean(options['noSpec']);
  const srcDir = join('src', kebabName);

  return [
    templateRule(
      join(filesDir, '__kebabName__.pipe.ts.ejs'),
      `${srcDir}/${kebabName}.pipe.ts`,
      templateVars,
    ),
    ifElse(
      !noSpec,
      templateRule(
        join(filesDir, '__kebabName__.pipe.spec.ts.ejs'),
        `${srcDir}/${kebabName}.pipe.spec.ts`,
        templateVars,
      ),
    ),
  ];
}
