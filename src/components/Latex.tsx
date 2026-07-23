import { MATHML } from '../lib/formules.mathml';

/**
 * A formula, written in LaTeX in `formules.ts` and rendered ahead of time.
 *
 * Nothing parses LaTeX here: the MathML was produced once by `npm run formules`
 * and committed, so the page carries neither a parser nor a stylesheet nor a
 * font. The markup is injected because that is what a pre-rendered element is,
 * and it is safe for a reason worth stating: every expression comes from a
 * literal in the repository, never from anything a visitor typed, and it was
 * generated with KaTeX's `trust` option off.
 *
 * KaTeX emits MathML that assistive technology reads out loud on its own, so
 * there is no `aria-label` to add — one would have it announced twice.
 */
export function Latex({ tex }: { tex: string }) {
  const rendu = MATHML[tex];

  // A formula missing from the generated file means someone edited the LaTeX
  // without re-running the generator. The unit test says so plainly; here we
  // simply fall back to the source rather than showing a hole.
  if (rendu === undefined) return <span className="tabular">{tex}</span>;

  return <span dangerouslySetInnerHTML={{ __html: rendu }} />;
}
