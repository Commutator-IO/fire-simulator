import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { FORMULES } from './formules';
import { TEXTES } from './textes';
import { LANGUES } from './i18n';

/**
 * The formulas are rendered with `throwOnError` off, so a typo would show up
 * as a red blob on the page rather than as a failure. These tests compile the
 * same list strictly, which is where a typo is supposed to be caught.
 */

describe('formulas', () => {
  it('compiles every one of them', () => {
    for (const f of FORMULES) {
      expect(() =>
        katex.renderToString(f.tex, { output: 'mathml', throwOnError: true, strict: 'error' }),
      ).not.toThrow();
    }
  });

  it('produces MathML, and no stylesheet-dependent markup', () => {
    for (const f of FORMULES) {
      const rendu = katex.renderToString(f.tex, { output: 'mathml', throwOnError: true });
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
