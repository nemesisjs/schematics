/**
 * @nemesis-js/schematics - Application schematic
 *
 * Scaffolds a complete NemesisJS project directory with:
 *   - package.json, tsconfig.json, bunfig.toml
 *   - .gitignore, .prettierrc, .prettierignore, eslint.config.mjs
 *   - src/main.ts, src/app.module.ts, src/app.controller.ts, src/app.service.ts
 *   - tests/app.test.ts (skipped with --no-test)
 *
 * All files land in `<cwd>/<kebab-name>/`.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ifElse, templateRule } from '../../engine/rule';
import type { Rule, SchematicContext } from '../../engine/rule';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filesDir = join(__dirname, 'files');

export default function applicationFactory(ctx: SchematicContext): Rule[] {
  const { kebabName, templateVars, options } = ctx;
  const noTest = Boolean(options['noTest']);

  // All files are placed inside a new `<kebabName>/` subdirectory
  const base = kebabName;

  return [
    // ── Config files (root of the new project) ────────────────────────────
    templateRule(join(filesDir, 'package.json.ejs'),    `${base}/package.json`,       templateVars),
    templateRule(join(filesDir, 'tsconfig.json.ejs'),   `${base}/tsconfig.json`,      templateVars),
    templateRule(join(filesDir, 'bunfig.toml.ejs'),     `${base}/bunfig.toml`,        templateVars),
    templateRule(join(filesDir, 'gitignore.ejs'),       `${base}/.gitignore`,         templateVars),
    templateRule(join(filesDir, 'eslint.config.mjs.ejs'), `${base}/eslint.config.mjs`, templateVars),
    templateRule(join(filesDir, 'prettierrc.ejs'),      `${base}/.prettierrc`,        templateVars),
    templateRule(join(filesDir, 'prettierignore.ejs'),  `${base}/.prettierignore`,    templateVars),
    templateRule(join(filesDir, 'README.md.ejs'),       `${base}/README.md`,          templateVars),

    // ── Source files ───────────────────────────────────────────────────────
    templateRule(join(filesDir, 'src', 'main.ts.ejs'),           `${base}/src/main.ts`,           templateVars),
    templateRule(join(filesDir, 'src', 'app.module.ts.ejs'),     `${base}/src/app.module.ts`,     templateVars),
    templateRule(join(filesDir, 'src', 'app.controller.ts.ejs'), `${base}/src/app.controller.ts`, templateVars),
    templateRule(join(filesDir, 'src', 'app.service.ts.ejs'),    `${base}/src/app.service.ts`,    templateVars),

    // ── Tests (optional) ───────────────────────────────────────────────────
    ifElse(
      !noTest,
      templateRule(join(filesDir, 'tests', 'app.test.ts.ejs'), `${base}/tests/app.test.ts`, templateVars),
    ),
  ];
}
