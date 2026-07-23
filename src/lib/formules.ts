import type { Dictionnaire } from './textes';

/**
 * The formulas of the model, written in LaTeX.
 *
 * They live here rather than inside the component for two reasons: they are the
 * one part of the "method" section that does not change with the language — a
 * formula reads the same everywhere — and keeping them in a list lets a test
 * check that every one of them still compiles.
 *
 * `terme` and `note` point into the dictionary, so the compiler refuses a
 * formula whose wording has been renamed or removed.
 */
export type Formule = {
  terme: keyof Dictionnaire['sources'];
  note?: keyof Dictionnaire['sources'];
  tex: string;
};

export const FORMULES: Formule[] = [
  { terme: 'fRetrait', note: 'fRetraitNote', tex: String.raw`R = X \times Z` },
  { terme: 'fImpots', note: 'fImpotsNote', tex: String.raw`T = R \times \alpha` },
  { terme: 'fNet', tex: String.raw`R_{\mathrm{net}} = X \times Z \times (1 - \alpha)` },
  { terme: 'fPreserve', note: 'fPreserveNote', tex: String.raw`Z \leqslant Y` },
  { terme: 'fReel', note: 'fReelNote', tex: String.raw`Z \leqslant Y - i` },
  {
    terme: 'fRetraitIndexe',
    note: 'fRetraitIndexeNote',
    tex: String.raw`R_n = X_0 \times Z \times (1 + i)^{\,n-1}`,
  },
  {
    terme: 'fProjection',
    tex: String.raw`C_n = C_{n-1} \times (1 + Y) - R_n`,
  },
  {
    terme: 'fCible',
    tex: String.raw`X = \frac{D}{Z \times (1 - \alpha)}`,
  },
];
