/**
 * @nemesis-js/schematics - Resource schematic
 *
 * Generates a full CRUD feature module:
 *   src/<kebab>/
 *     <kebab>.module.ts
 *     <kebab>.controller.ts   (POST / GET / GET:id / PUT:id / DELETE:id)
 *     <kebab>.controller.spec.ts
 *     <kebab>.service.ts      (in-memory Map store, ready to swap for a DB)
 *     <kebab>.service.spec.ts
 *     dto/
 *       create-<kebab>.dto.ts
 *       update-<kebab>.dto.ts
 *
 * Then imports the new module into the nearest parent `*.module.ts`.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ifElse, moduleUpdateRule, templateRule } from '../../engine/rule';
import type { Rule, SchematicContext } from '../../engine/rule';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filesDir = join(__dirname, 'files');

export default function resourceFactory(ctx: SchematicContext): Rule[] {
  const { kebabName, pascalName, targetDir, templateVars, options } = ctx;
  const noSpec = Boolean(options['noSpec']);
  const srcDir = join('src', kebabName);

  return [
    // ── DTOs (generated first so the controller/service can import them) ───
    templateRule(
      join(filesDir, 'dto', 'create-__kebabName__.dto.ts.ejs'),
      `${srcDir}/dto/create-${kebabName}.dto.ts`,
      templateVars,
    ),
    templateRule(
      join(filesDir, 'dto', 'update-__kebabName__.dto.ts.ejs'),
      `${srcDir}/dto/update-${kebabName}.dto.ts`,
      templateVars,
    ),

    // ── Module ─────────────────────────────────────────────────────────────
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
    moduleUpdateRule(
      join(targetDir, 'src', kebabName),
      `${pascalName}Module`,
      `src/${kebabName}/${kebabName}.module`,
      'import',
    ),
  ];
}
