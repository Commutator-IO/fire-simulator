import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { FORMULES, OPTIONS_KATEX } from './formules';
import { MATHML } from './formules.mathml';
import { TEXTES } from './textes';
import { LANGUES } from './i18n';

/**
 * The formulas are rendered ahead of time by `npm run formules`, so KaTeX never
 * reaches the browser. The price of that is a file that can fall out of step
 * with its source; these tests are what makes that impossible to miss.
 */

describe('formulas', () => {
  it('compiles every one of them', () => {
    for (const f of FORMULES) {
      expect(() => katex.renderToString(f.tex, OPTIONS_KATEX)).not.toThrow();
    }
  });

  // The one that matters: editing a formula without re-running the generator
  // would otherwise ship the old rendering, silently.
  it('has a generated file in step with the source', () => {
    for (const f of FORMULES) {
      expect(
        MATHML[f.tex],
        `« npm run formules » n’a pas été relancé après avoir modifié : ${f.tex}`,
      ).toBe(katex.renderToString(f.tex, OPTIONS_KATEX));
    }
  });

  it('has generated nothing that is no longer used', () => {
    expect(Object.keys(MATHML).sort()).toEqual(FORMULES.map((f) => f.tex).sort());
  });

  it('produces MathML, and no stylesheet-dependent markup', () => {
    for (const rendu of Object.values(MATHML)) {
      expect(rendu).toContain('<math');
      // KaTeX's own layout markup would drag in the stylesheet and the twenty
      // font faces the project deliberately does without.
      expect(rendu).not.toContain('katex-html');
    }
  });

  it('names a wording that exists in every language', () => {
    for (const f of FORMULES) {
      for (const langue of LANGUES) {
        expect(TEXTES[langue].sources[f.terme]).toBeTruthy();
        if (f.note) expect(TEXTES[langue].sources[f.note]).toBeTruthy();
      }
    }
  });

  it('carries the symbols the notes explain', () => {
    const tout = FORMULES.map((f) => f.tex).join(' ');
    // X the capital, Z the withdrawal, Y the return, α the tax, i inflation,
    // D the target spending: the six letters the method section defines.
    for (const symbole of ['X', 'Z', 'Y', String.raw`\alpha`, 'i', 'D']) {
      expect(tout).toContain(symbole);
    }
  });

  it('leaves no duplicate, each formula being keyed by its source', () => {
    const tex = FORMULES.map((f) => f.tex);
    expect(new Set(tex).size).toBe(tex.length);
  });
});
