import katex from 'katex';

/**
 * A formula, written in LaTeX and rendered by KaTeX.
 *
 * The markup is injected rather than built as elements because that is the only
 * interface KaTeX offers, and it is safe here for a reason worth stating: every
 * expression on the page is a literal written in `formules.ts`, never anything
 * a visitor typed. `trust` stays off all the same, so even an edited formula
 * could not smuggle in a link or a class of its own.
 *
 * KaTeX emits the visual markup *and* a MathML twin, the first hidden from
 * assistive technology and the second read out loud. Hence no `aria-label`:
 * adding one would have a screen reader announce the formula twice.
 */

// The formulas are a fixed, short list; parsing each of them once is enough.
const rendus = new Map<string, string>();

function rendre(tex: string): string {
  const connu = rendus.get(tex);
  if (connu !== undefined) return connu;
  const html = katex.renderToString(tex, {
    // MathML rather than KaTeX's own markup: browsers render it natively, so
    // the page carries no stylesheet and none of the twenty font faces KaTeX
    // ships. For eight short formulas that trade is not close.
    output: 'mathml',
    displayMode: false,
    // A malformed formula shows up in red rather than taking the page down
    // with it. The unit test compiles the same list in strict mode, so a typo
    // is caught long before anyone sees red.
    throwOnError: false,
    trust: false,
  });
  rendus.set(tex, html);
  return html;
}

export function Latex({ tex }: { tex: string }) {
  return <span dangerouslySetInnerHTML={{ __html: rendre(tex) }} />;
}
