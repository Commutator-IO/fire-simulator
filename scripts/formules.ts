import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import katex from 'katex';
import { FORMULES, OPTIONS_KATEX } from '../src/lib/formules.ts';

/**
 * Renders the formulas once, at authoring time, into a committed module.
 *
 * The formulas never change while the page is open, so there is no reason to
 * ship a LaTeX parser to every visitor: KaTeX stays a development dependency
 * and only its output travels. LaTeX remains the source — `formules.ts` is
 * still where a formula is written and read.
 *
 * Forgetting to re-run this after editing a formula is caught by
 * `formules.test.ts`, which recompiles the list and compares.
 *
 *     npm run formules
 */

const destination = fileURLToPath(new URL('../src/lib/formules.mathml.ts', import.meta.url));

const entrees = FORMULES.map(
  (f) => `  ${JSON.stringify(f.tex)}:\n    ${JSON.stringify(katex.renderToString(f.tex, OPTIONS_KATEX))},`,
).join('\n');

writeFileSync(
  destination,
  `// Généré par \`npm run formules\` à partir de formules.ts — ne pas modifier
// à la main. Le LaTeX reste la source ; ceci n'en est que le rendu, figé pour
// éviter d'embarquer KaTeX dans le navigateur.

export const MATHML: Record<string, string> = {
${entrees}
};
`,
);

console.log(`${FORMULES.length} formules rendues dans ${destination}`);
