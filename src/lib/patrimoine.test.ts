import { describe, expect, it } from 'vitest';
import {
  ACTIFS,
  BORNES_LIGNE,
  CATEGORIES,
  actif,
  bilan,
  bornerComposition,
  compositionVide,
  type CleActif,
  type Ligne,
} from './patrimoine';
import { LANGUES } from './i18n';

/** A composition holding only the lines named, everything else at zero. */
const avec = (montants: Partial<Record<CleActif, number>>, taux: Partial<Record<CleActif, number>> = {}): Ligne[] =>
  compositionVide().map((l) => ({
    ...l,
    montant: montants[l.cle] ?? 0,
    rendement: taux[l.cle] ?? l.rendement,
  }));

// ---------------------------------------------------------------------------

describe('catalogue', () => {
  it('gives every asset a unique key', () => {
    const cles = ACTIFS.map((a) => a.cle);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it('sorts every asset into a known category', () => {
    for (const a of ACTIFS) expect(CATEGORIES).toContain(a.categorie);
  });

  it('names and explains every asset in each language', () => {
    for (const a of ACTIFS) {
      for (const langue of LANGUES) {
        expect(a.libelle[langue]).not.toBe('');
        expect(a.note[langue].length).toBeGreaterThan(20);
      }
    }
  });

  it('keeps default rates within the bounds of the field', () => {
    for (const a of ACTIFS) {
      expect(a.rendementParDefaut).toBeGreaterThanOrEqual(BORNES_LIGNE.rendement.min);
      expect(a.rendementParDefaut).toBeLessThanOrEqual(BORNES_LIGNE.rendement.max);
    }
  });

  it('marks debts, and only debts, with a minus sign', () => {
    for (const a of ACTIFS) {
      expect(a.signe === -1).toBe(a.categorie === 'dettes');
    }
  });

  it('excludes the home and its loan together, and nothing else', () => {
    const exclus = ACTIFS.filter((a) => !a.productif).map((a) => a.cle);
    expect(exclus).toEqual(['residencePrincipale', 'creditResidence']);
  });

  it('falls back to a real asset for an unknown key', () => {
    // @ts-expect-error deliberately invalid key, of the kind the URL can supply
    expect(ACTIFS).toContain(actif('yacht'));
  });
});

describe('an empty statement', () => {
  it('reports nothing rather than dividing by zero', () => {
    const b = bilan(compositionVide());
    expect(b.brut).toBe(0);
    expect(b.net).toBe(0);
    expect(b.productif).toBe(0);
    expect(b.rendementRecompose).toBe(0);
    expect(b.gainsAnnuels).toBe(0);
    expect(b.renseigne).toBe(false);
    expect(b.parCategorie).toEqual([]);
  });

  it('starts each line at its product’s own rate', () => {
    for (const l of compositionVide()) {
      expect(l.rendement).toBe(actif(l.cle).rendementParDefaut);
    }
  });
});

describe('the blended return', () => {
  it('is the plain weighted average of a portfolio without debt', () => {
    const b = bilan(
      avec({ livretA: 25_000, pea: 75_000 }, { livretA: 0.02, pea: 0.06 }),
    );
    expect(b.brut).toBe(100_000);
    // A quarter at 2 %, three quarters at 6 %.
    expect(b.rendementRecompose).toBeCloseTo(0.05, 10);
    expect(b.gainsAnnuels).toBeCloseTo(5_000, 6);
  });

  // The point of treating a loan as a negative asset: the leverage comes out
  // right on its own, with no special case.
  it('rises with leverage, a debt being a negative return', () => {
    const b = bilan(
      avec({ compteTitres: 500_000, autresCredits: 200_000 }, { compteTitres: 0.05, autresCredits: 0.03 }),
    );
    expect(b.brut).toBe(500_000);
    expect(b.dettes).toBe(200_000);
    expect(b.net).toBe(300_000);
    expect(b.productif).toBe(300_000);
    // 25 000 € de gains moins 6 000 € d'intérêts, sur 300 000 €.
    expect(b.gainsAnnuels).toBeCloseTo(19_000, 6);
    expect(b.rendementRecompose).toBeCloseTo(19_000 / 300_000, 10);
    expect(b.rendementRecompose).toBeGreaterThan(0.05);
  });

  it('is unmoved by a line left at zero, whatever rate it carries', () => {
    const sans = bilan(avec({ pea: 100_000 }, { pea: 0.07 }));
    const avecVide = bilan(avec({ pea: 100_000, scpi: 0 }, { pea: 0.07, scpi: 0.2 }));
    expect(avecVide.rendementRecompose).toBeCloseTo(sans.rendementRecompose, 10);
  });

  it('stays between the best and the worst line', () => {
    const b = bilan(
      avec(
        { livretA: 10_000, fondsEuros: 40_000, pea: 50_000 },
        { livretA: 0.017, fondsEuros: 0.025, pea: 0.07 },
      ),
    );
    expect(b.rendementRecompose).toBeGreaterThanOrEqual(0.017);
    expect(b.rendementRecompose).toBeLessThanOrEqual(0.07);
  });

  it('reports nothing when the debts swallow the assets', () => {
    const b = bilan(avec({ pea: 50_000, autresCredits: 80_000 }));
    expect(b.net).toBe(-30_000);
    expect(b.productif).toBe(-30_000);
    // A household that owes more than it owns has a debt to repay, not a
    // return to report.
    expect(b.rendementRecompose).toBe(0);
    expect(b.gainsAnnuels).toBe(0);
  });
});

describe('the main residence', () => {
  const composition = avec(
    {
      pea: 200_000,
      residencePrincipale: 400_000,
      creditResidence: 250_000,
      immobilierLocatif: 150_000,
    },
    { pea: 0.07, immobilierLocatif: 0.035, creditResidence: 0.02 },
  );

  it('counts in net worth', () => {
    const b = bilan(composition);
    expect(b.brut).toBe(750_000);
    expect(b.dettes).toBe(250_000);
    expect(b.net).toBe(500_000);
  });

  it('is left out of what funds the withdrawals, along with its loan', () => {
    const b = bilan(composition);
    expect(b.productif).toBe(350_000);
  });

  it('does not drag the blended return towards zero', () => {
    const b = bilan(composition);
    // 200 000 à 7 % et 150 000 à 3,5 %, la maison n'entrant pas au calcul.
    expect(b.rendementRecompose).toBeCloseTo(
      (200_000 * 0.07 + 150_000 * 0.035) / 350_000,
      10,
    );
  });

  it('leaves the productive capital untouched when the house is paid off', () => {
    const paye = bilan(avec({ pea: 200_000, residencePrincipale: 400_000 }));
    const emprunte = bilan(
      avec({ pea: 200_000, residencePrincipale: 400_000, creditResidence: 250_000 }),
    );
    expect(paye.productif).toBe(emprunte.productif);
    expect(paye.net - emprunte.net).toBe(250_000);
  });
});

describe('the split by category', () => {
  it('shares out the gross assets, and skips what is empty', () => {
    const b = bilan(avec({ livretA: 20_000, pea: 60_000, scpi: 20_000 }));
    expect(b.parCategorie.map((c) => c.categorie)).toEqual([
      'liquide',
      'actions',
      'immobilier',
    ]);
    expect(b.parCategorie.reduce((s, c) => s + c.part, 0)).toBeCloseTo(1, 10);
  });

  it('shows the debts as their own share rather than hiding them', () => {
    const b = bilan(avec({ pea: 100_000, autresCredits: 30_000 }));
    const dettes = b.parCategorie.find((c) => c.categorie === 'dettes');
    expect(dettes?.montant).toBe(30_000);
  });
});

describe('bounding', () => {
  it('clamps amounts and rates, the URL not being trusted input', () => {
    const b = bornerComposition([
      { cle: 'pea', montant: -5_000, rendement: 3 },
      { cle: 'livretA', montant: 1e12, rendement: -4 },
    ]);
    const trouve = (cle: CleActif) => b.find((l) => l.cle === cle)!;
    expect(trouve('pea').montant).toBe(BORNES_LIGNE.montant.min);
    expect(trouve('pea').rendement).toBe(BORNES_LIGNE.rendement.max);
    expect(trouve('livretA').montant).toBe(BORNES_LIGNE.montant.max);
    expect(trouve('livretA').rendement).toBe(BORNES_LIGNE.rendement.min);
  });

  it('returns one line per asset, in the catalogue’s order', () => {
    expect(bornerComposition([{ cle: 'scpi', montant: 1, rendement: 0.04 }])).toHaveLength(
      ACTIFS.length,
    );
    expect(bornerComposition([]).map((l) => l.cle)).toEqual(ACTIFS.map((a) => a.cle));
  });

  it('drops a line that names no known asset', () => {
    const b = bornerComposition([
      // @ts-expect-error deliberately invalid key
      { cle: 'yacht', montant: 90_000, rendement: 0.01 },
      { cle: 'pea', montant: 10_000, rendement: 0.07 },
    ]);
    expect(b.reduce((s, l) => s + l.montant, 0)).toBe(10_000);
  });

  it('never produces NaN, whatever it is handed', () => {
    const b = bilan([
      { cle: 'pea', montant: Number.NaN, rendement: Number.POSITIVE_INFINITY },
      { cle: 'autresCredits', montant: -Infinity, rendement: Number.NaN },
    ]);
    for (const valeur of [b.brut, b.dettes, b.net, b.productif, b.rendementRecompose, b.gainsAnnuels]) {
      expect(Number.isFinite(valeur)).toBe(true);
    }
  });
});

describe('purity', () => {
  it('leaves the composition it is handed untouched', () => {
    const lignes = avec({ pea: 100_000 });
    const copie = lignes.map((l) => ({ ...l }));
    bilan(lignes);
    expect(lignes).toEqual(copie);
  });
});
