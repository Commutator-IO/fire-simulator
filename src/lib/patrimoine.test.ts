import { describe, expect, it } from 'vitest';
import {
  ACTIFS,
  compositionParDefaut,
  estRenseignee,
  BORNES_LIGNE,
  CATEGORIES,
  actif,
  actifsDe,
  ailleurs,
  bilan,
  bornerComposition,
  proportions,
  impositionRecomposee,
  compositionVide,
  coutDetention,
  distribution,
  impotFortuneImmobiliere,
  locatif,
  rendementEffectif,
  type CleActif,
  type Ligne,
} from './patrimoine';
import { PAYS } from './pays';
import { LANGUES } from './i18n';

/** A composition holding only the lines named, everything else at zero. */
const avec = (
  montants: Partial<Record<CleActif, number>>,
  sur: Partial<Record<CleActif, Partial<Ligne>>> = {},
): Ligne[] =>
  compositionVide().map((l) => ({
    ...l,
    montant: montants[l.cle] ?? 0,
    ...(sur[l.cle] ?? {}),
  }));

// ---------------------------------------------------------------------------

describe('catalogue', () => {
  it('gives every asset a unique key', () => {
    const cles = ACTIFS.map((a) => a.cle);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it('gives every country a list of its own', () => {
    for (const p of PAYS) expect(actifsDe(p.cle).length).toBeGreaterThan(5);
    expect(actifsDe('france').map((a) => a.cle)).not.toContain('nisa');
    expect(actifsDe('japon').map((a) => a.cle)).not.toContain('pea');
  });

  it('covers the same ground in both countries', () => {
    for (const p of PAYS) {
      const categories = new Set(actifsDe(p.cle).map((a) => a.categorie));
      // Cash, equities, property and debt exist wherever one lives.
      for (const attendue of ['liquide', 'actions', 'immobilier', 'dettes']) {
        expect(categories).toContain(attendue);
      }
    }
  });

  it('names and explains every asset in each language', () => {
    for (const a of ACTIFS) {
      for (const langue of LANGUES) {
        expect(a.libelle[langue]).not.toBe('');
        expect(a.note[langue].length).toBeGreaterThan(20);
      }
    }
  });

  it('sorts every asset into a known category, debts alone bearing a minus', () => {
    for (const a of ACTIFS) {
      expect(CATEGORIES).toContain(a.categorie);
      expect(a.signe === -1).toBe(a.categorie === 'dettes');
    }
  });

  it('excludes what pays nothing out: a roof, its loan, an unsold company', () => {
    for (const p of PAYS) {
      const exclus = actifsDe(p.cle).filter((a) => !a.productif);
      // Chaque pays exclut au moins son logement et le crédit qui le finance.
      expect(exclus.map((a) => a.categorie)).toContain('immobilier');
      expect(exclus.map((a) => a.categorie)).toContain('dettes');
      for (const a of exclus) {
        expect(['immobilier', 'dettes', 'entreprise']).toContain(a.categorie);
      }
    }
    // Une société non vendue ne verse rien ; sa réserve, elle, est mobilisable.
    expect(actif('titresSasu')!.productif).toBe(false);
    expect(actif('reserveSasu')!.productif).toBe(true);
  });

  it('lets a shareholder loan out untaxed, and a reserve at the flat rate', () => {
    // Rembourser un compte courant d'associé n'est pas un revenu.
    expect(actif('compteCourantSasu')!.impositionRetrait).toBe(0);
    expect(actif('reserveSasu')!.impositionRetrait).toBeCloseTo(0.3, 6);
    // L'IS passe sur le rendement laissé dans la société, chaque année.
    expect(actif('reserveSasu')!.prelevementsAnnuels).toBeCloseTo(0.25, 6);
  });

  it('taxes a distribution once, not every year', () => {
    const d = distribution(60_000, 0.3);
    expect(d.impot).toBeCloseTo(18_000, 6);
    expect(d.net).toBeCloseTo(42_000, 6);
    // Un montant négatif ne crée pas un crédit d'impôt.
    expect(distribution(-5_000, 0.3)).toEqual({ brut: 0, impot: 0, net: 0 });
  });

  it('puts a property tax only where no rent absorbs it', () => {
    for (const a of ACTIFS.filter((x) => x.tauxTaxeFonciere !== undefined)) {
      // A let property carries its own tax inside its running costs.
      expect(a.revenus).toBeUndefined();
      expect(a.productif).toBe(false);
    }
  });

  it('has no asset for an unknown key', () => {
    // @ts-expect-error deliberately invalid key, of the kind the URL can supply
    expect(actif('yacht')).toBeUndefined();
  });
});

describe('an empty statement', () => {
  it('reports nothing rather than dividing by zero', () => {
    const b = bilan(compositionVide(), 'france');
    expect(b.brut).toBe(0);
    expect(b.net).toBe(0);
    expect(b.productif).toBe(0);
    expect(b.rendementRecompose).toBe(0);
    expect(b.gainsAnnuels).toBe(0);
    expect(b.renseigne).toBe(false);
    expect(b.parCategorie).toEqual([]);
  });

  it('starts each line at its product’s own rates', () => {
    for (const l of compositionVide()) {
      const a = actif(l.cle)!;
      expect(l.rendement).toBe(a.rendementParDefaut);
      expect(l.impositionRevenus).toBe(a.impositionParDefaut ?? 0);
    }
  });
});

describe('the blended return', () => {
  it('is the plain weighted average of a portfolio without debt', () => {
    const b = bilan(
      avec(
        { livretA: 25_000, pea: 75_000 },
        { livretA: { rendement: 0.02 }, pea: { rendement: 0.06 } },
      ),
      'france',
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
      avec(
        { compteTitres: 500_000, credits: 200_000 },
        { compteTitres: { rendement: 0.05 }, credits: { rendement: 0.03 } },
      ),
      'france',
    );
    expect(b.net).toBe(300_000);
    expect(b.gainsAnnuels).toBeCloseTo(19_000, 6);
    expect(b.rendementRecompose).toBeCloseTo(19_000 / 300_000, 10);
    expect(b.rendementRecompose).toBeGreaterThan(0.05);
  });

  it('counts only the lines of the country in force', () => {
    const melange = avec({ pea: 100_000, nisa: 400_000 });
    expect(bilan(melange, 'france').brut).toBe(100_000);
    expect(bilan(melange, 'japon').brut).toBe(400_000);
    // Mesuré contre l'exemple d'ouverture, pas contre zéro : sinon il
    // annoncerait ses propres valeurs de départ comme une saisie.
    expect(ailleurs(melange, 'france')).toBe(400_000);
    expect(ailleurs(melange, 'japon')).toBe(100_000);
    expect(ailleurs(compositionParDefaut(), 'france')).toBe(0);
    expect(ailleurs(compositionParDefaut(), 'japon')).toBe(0);
  });

  it('reports nothing when the debts swallow the assets', () => {
    const b = bilan(avec({ pea: 50_000, credits: 80_000 }), 'france');
    expect(b.net).toBe(-30_000);
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
      credits: 0,
    },
    { pea: { rendement: 0.07 } },
  );

  it('counts in net worth', () => {
    const b = bilan(composition, 'france');
    expect(b.brut).toBe(600_000);
    expect(b.dettes).toBe(250_000);
    expect(b.net).toBe(350_000);
  });

  it('is left out of what funds the withdrawals, along with its loan', () => {
    expect(bilan(composition, 'france').productif).toBe(200_000);
  });

  it('does not drag the blended return towards zero', () => {
    expect(bilan(composition, 'france').rendementRecompose).toBeCloseTo(0.07, 10);
  });

  it('leaves the productive capital untouched when the house is paid off', () => {
    const paye = bilan(avec({ pea: 200_000, residencePrincipale: 400_000 }), 'france');
    expect(paye.productif).toBe(bilan(composition, 'france').productif);
  });

  it('exists in both countries', () => {
    for (const p of PAYS) {
      expect(actifsDe(p.cle).some((a) => a.tauxTaxeFonciere !== undefined)).toBe(true);
    }
  });
});

describe('a let property', () => {
  const bien = (sur: Partial<Ligne>) =>
    avec({ immobilierLocatif: 250_000 }, { immobilierLocatif: sur });

  it('earns its rent less its costs less the tax on the difference', () => {
    const ligne = bien({ loyer: 12_000, charges: 3_000, impositionRevenus: 0.3 })[
      compositionVide().findIndex((l) => l.cle === 'immobilierLocatif')
    ];
    const l = locatif(ligne);
    expect(l.revenuFoncier).toBe(9_000);
    expect(l.impots).toBeCloseTo(2_700, 6);
    expect(l.net).toBeCloseTo(6_300, 6);
    // 6 300 € sur 250 000 € : bien loin des 4,8 % du loyer brut.
    expect(l.rendement).toBeCloseTo(0.0252, 10);
  });

  it('feeds that computed rate into the blend, not the typed one', () => {
    const composition = bien({ loyer: 12_000, charges: 3_000, impositionRevenus: 0.3, rendement: 0.19 });
    const b = bilan(composition, 'france');
    expect(b.rendementRecompose).toBeCloseTo(0.0252, 10);
    expect(rendementEffectif(composition.find((l) => l.cle === 'immobilierLocatif')!)).toBeCloseTo(
      0.0252,
      10,
    );
  });

  it('is not taxed on a loss', () => {
    const ligne = bien({ loyer: 4_000, charges: 9_000, impositionRevenus: 0.3 }).find(
      (l) => l.cle === 'immobilierLocatif',
    )!;
    const l = locatif(ligne);
    expect(l.revenuFoncier).toBe(-5_000);
    expect(l.impots).toBe(0);
    expect(l.net).toBe(-5_000);
    expect(l.rendement).toBeLessThan(0);
  });

  it('yields nothing rather than dividing by zero without a value', () => {
    const ligne = avec({}, { immobilierLocatif: { loyer: 12_000 } }).find(
      (l) => l.cle === 'immobilierLocatif',
    )!;
    expect(locatif(ligne).rendement).toBe(0);
  });

  it('exists in both countries, with its own tax rate', () => {
    for (const p of PAYS) {
      const locatifs = actifsDe(p.cle).filter((a) => a.revenus);
      expect(locatifs).toHaveLength(1);
      expect(locatifs[0].impositionParDefaut).toBeGreaterThan(0);
    }
  });
});

describe('the wealth tax on property', () => {
  it('is owed only above the threshold', () => {
    expect(impotFortuneImmobiliere(1_299_999)).toBe(0);
    expect(impotFortuneImmobiliere(1_300_000)).toBeGreaterThan(0);
  });

  // The subtlety everyone misses: once you cross €1.3m the bill is computed
  // from €800k, not from the threshold.
  it('counts from €800,000 once the threshold is crossed', () => {
    // 500 000 à 0,5 % = 2 500, plus 0 dans la tranche suivante, moins la décote.
    const decote = 17_500 - 0.0125 * 1_300_000;
    expect(impotFortuneImmobiliere(1_300_000)).toBeCloseTo(2_500 - decote, 6);
  });

  it('applies each bracket to its own slice', () => {
    // 500 000 à 0,5 % + 1 270 000 à 0,7 % = 2 500 + 8 890, décote épuisée.
    expect(impotFortuneImmobiliere(2_570_000)).toBeCloseTo(11_390, 6);
  });

  it('rises with the base, always', () => {
    let precedent = -1;
    for (const assiette of [0, 1_300_000, 2_000_000, 5_000_000, 12_000_000]) {
      const du = impotFortuneImmobiliere(assiette);
      expect(du).toBeGreaterThanOrEqual(precedent);
      precedent = du;
    }
  });
});

describe('what holding it costs', () => {
  it('charges the property tax of the home, and only of the home', () => {
    const c = coutDetention(
      avec({ residencePrincipale: 300_000, immobilierLocatif: 200_000 }),
      'france',
      0.3,
    );
    expect(c.taxeFonciere).toBeCloseTo(300_000 * 0.007, 6);
  });

  it('leaves out the wealth tax below the threshold', () => {
    const c = coutDetention(avec({ residencePrincipale: 300_000 }), 'france', 0.3);
    expect(c.impotFortune).toBe(0);
  });

  it('counts the home for seventy per cent of its value', () => {
    // 2 M€ de résidence : l'assiette n'est que de 1,4 M€.
    const c = coutDetention(avec({ residencePrincipale: 2_000_000 }), 'france', 0.3);
    expect(c.impotFortune).toBeCloseTo(impotFortuneImmobiliere(1_400_000), 6);
  });

  it('deducts the property loans from the base', () => {
    const sans = coutDetention(avec({ immobilierLocatif: 2_000_000 }), 'france', 0.3);
    const avecDette = coutDetention(
      avec({ immobilierLocatif: 2_000_000, credits: 900_000 }),
      'france',
      0.3,
    );
    expect(avecDette.impotFortune).toBeLessThan(sans.impotFortune);
  });

  it('knows Japan has no wealth tax on property', () => {
    const c = coutDetention(avec({ residenceJp: 5_000_000 }), 'japon', 0.20315);
    expect(c.impotFortune).toBe(0);
    expect(c.taxeFonciere).toBeGreaterThan(0);
  });

  it('turns the bill into the income it takes to pay it', () => {
    const c = coutDetention(avec({ residencePrincipale: 400_000 }), 'france', 0.25);
    // 2 800 € à régler, une fois le quart du retrait parti en impôt.
    expect(c.total).toBeCloseTo(2_800, 6);
    expect(c.revenuMinimum).toBeCloseTo(2_800 / 0.75, 6);
  });

  it('reports nothing to pay on an empty statement', () => {
    const c = coutDetention(compositionVide(), 'france', 0.3);
    expect(c.total).toBe(0);
    expect(c.revenuMinimum).toBe(0);
    expect(c.partDuPatrimoine).toBe(0);
  });
});

describe('bounding', () => {
  it('clamps amounts and rates, the URL not being trusted input', () => {
    const b = bornerComposition([
      { cle: 'pea', montant: -5_000, rendement: 3, loyer: 0, charges: 0, impositionRevenus: 0 },
      {
        cle: 'immobilierLocatif',
        montant: 1e12,
        rendement: 0,
        loyer: -9,
        charges: 1e12,
        impositionRevenus: 9,
      },
    ]);
    const trouve = (cle: CleActif) => b.find((l) => l.cle === cle)!;
    expect(trouve('pea').montant).toBe(BORNES_LIGNE.montant.min);
    expect(trouve('pea').rendement).toBe(BORNES_LIGNE.rendement.max);
    expect(trouve('immobilierLocatif').montant).toBe(BORNES_LIGNE.montant.max);
    expect(trouve('immobilierLocatif').loyer).toBe(BORNES_LIGNE.loyer.min);
    expect(trouve('immobilierLocatif').charges).toBe(BORNES_LIGNE.loyer.max);
    expect(trouve('immobilierLocatif').impositionRevenus).toBe(
      BORNES_LIGNE.impositionRevenus.max,
    );
  });

  it('returns one line per asset of every country, in the catalogue’s order', () => {
    expect(bornerComposition([]).map((l) => l.cle)).toEqual(ACTIFS.map((a) => a.cle));
  });

  it('drops a line that names no known asset', () => {
    const b = bornerComposition([
      // @ts-expect-error deliberately invalid key
      { cle: 'yacht', montant: 90_000, rendement: 0.01, loyer: 0, charges: 0, impositionRevenus: 0 },
      { cle: 'pea', montant: 10_000, rendement: 0.07, loyer: 0, charges: 0, impositionRevenus: 0 },
    ]);
    expect(b.reduce((s, l) => s + l.montant, 0)).toBe(10_000);
  });

  it('never produces NaN, whatever it is handed', () => {
    const b = bilan(
      [
        {
          cle: 'pea',
          montant: Number.NaN,
          rendement: Number.POSITIVE_INFINITY,
          loyer: Number.NaN,
          charges: Number.NaN,
          impositionRevenus: Number.NaN,
        },
      ],
      'france',
    );
    for (const v of [b.brut, b.dettes, b.net, b.productif, b.rendementRecompose, b.gainsAnnuels]) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe('purity', () => {
  it('leaves the composition it is handed untouched', () => {
    const lignes = avec({ pea: 100_000 });
    const copie = lignes.map((l) => ({ ...l }));
    bilan(lignes, 'france');
    coutDetention(lignes, 'france', 0.3);
    expect(lignes).toEqual(copie);
  });
});

describe('the statement it opens on', () => {
  it('is filled in for both countries, not blank', () => {
    expect(estRenseignee(compositionParDefaut())).toBe(true);
    for (const p of PAYS) {
      expect(bilan(compositionParDefaut(), p.cle).renseigne).toBe(true);
    }
  });

  it('describes a household one could actually be', () => {
    for (const p of PAYS) {
      const b = bilan(compositionParDefaut(), p.cle);
      // Diversified, geared, and returning something between a savings account
      // and an all-equity portfolio.
      expect(b.parCategorie.length).toBeGreaterThanOrEqual(4);
      expect(b.dettes).toBeGreaterThan(0);
      expect(b.rendementRecompose).toBeGreaterThan(0.02);
      expect(b.rendementRecompose).toBeLessThan(0.07);
    }
  });

  it('lets the let flat show a rent rather than a bare value', () => {
    for (const p of PAYS) {
      const loue = compositionParDefaut().find(
        (l) => actif(l.cle)?.pays === p.cle && actif(l.cle)?.revenus,
      )!;
      expect(loue.loyer).toBeGreaterThan(0);
      expect(locatif(loue).rendement).toBeGreaterThan(0);
    }
  });

  it('is emptied by clearing, and stays empty', () => {
    expect(estRenseignee(compositionVide())).toBe(false);
  });
});

describe('the share held by the bank and the taxman', () => {
  const vue = (lignes: Ligne[], pays: 'france' | 'japon' = 'france') =>
    proportions(lignes, pays, coutDetention(lignes, pays, 0.3));

  it('splits the gross assets between you and the bank', () => {
    const v = vue(avec({ residencePrincipale: 400_000, creditResidence: 150_000 }));
    expect(v.brut).toBeCloseTo(400_000, 6);
    expect(v.dettes).toBeCloseTo(150_000, 6);
    expect(v.net).toBeCloseTo(250_000, 6);
    expect(v.net + v.dettes).toBeCloseTo(v.brut, 6);
    expect(v.partDettes).toBeCloseTo(0.375, 6);
  });

  it('splits the year between what is left, the interest and the taxes', () => {
    const v = vue(compositionParDefaut());
    expect(v.reste + v.interets + v.impotsDetention).toBeCloseTo(v.revenusBruts, 6);
    expect(v.partInterets + v.partImpots).toBeLessThan(1);
  });

  it('counts a rent as return, and a home as none', () => {
    const bailleur = avec(
      { immobilierLocatif: 250_000 },
      { immobilierLocatif: { loyer: 12_000, charges: 3_000, impositionRevenus: 0.3 } },
    );
    // 12 000 − 3 000 = 9 000, moins 30 % d'impôt : 6 300 € nets.
    expect(vue(bailleur).revenusBruts).toBeCloseTo(6_300, 6);
    // Une résidence principale ne produit rien : elle épargne un loyer.
    expect(vue(avec({ residencePrincipale: 400_000 })).revenusBruts).toBe(0);
  });

  it('charges the loan its interest, and nothing else', () => {
    const v = vue(
      avec(
        { pea: 200_000, creditResidence: 100_000 },
        { pea: { rendement: 0.06 }, creditResidence: { rendement: 0.03 } },
      ),
    );
    expect(v.revenusBruts).toBeCloseTo(12_000, 6);
    expect(v.interets).toBeCloseTo(3_000, 6);
    expect(v.reste).toBeCloseTo(9_000, 6);
  });

  it('holds the withdrawal tax out of it', () => {
    // Seule la détention est comptée : changer l'impôt sur les retraits ne
    // touche ni la taxe foncière ni l'IFI.
    const lignes = compositionParDefaut();
    const bas = proportions(lignes, 'france', coutDetention(lignes, 'france', 0.1));
    const haut = proportions(lignes, 'france', coutDetention(lignes, 'france', 0.5));
    expect(bas.impotsDetention).toBeCloseTo(haut.impotsDetention, 6);
  });

  it('knows Japan taxes the roof but not the fortune', () => {
    expect(vue(avec({ residenceJp: 400_000 }), 'japon').impotsDetention).toBeGreaterThan(0);
  });

  it('produces finite figures, and no share, on an empty statement', () => {
    const v = vue(compositionVide());
    for (const x of [v.brut, v.net, v.dettes, v.revenusBruts, v.reste]) {
      expect(Number.isFinite(x)).toBe(true);
    }
    expect(v.partDettes).toBe(0);
    expect(v.partImpots).toBe(0);
  });
});

describe('the blended tax on withdrawals', () => {
  it('weighs each envelope by what it holds', () => {
    // Moitié PEA à 18,6 %, moitié compte-titres à 31,4 %.
    const b = impositionRecomposee(avec({ pea: 100_000, compteTitres: 100_000 }), 'france');
    expect(b).toBeCloseTo((0.186 + 0.314) / 2, 10);
  });

  it('matches no single regime, which is the point', () => {
    const compose = impositionRecomposee(compositionParDefaut(), 'france');
    for (const regime of [0.314, 0.186, 0.247]) {
      expect(Math.abs(compose - regime)).toBeGreaterThan(5e-6);
    }
  });

  it('is nil for a portfolio of tax-free accounts', () => {
    expect(impositionRecomposee(avec({ livretA: 30_000, lep: 10_000 }), 'france')).toBe(0);
    expect(impositionRecomposee(avec({ nisa: 200_000 }), 'japon')).toBe(0);
  });

  it('leaves out a let property, already stated net of its own tax', () => {
    const avecBien = impositionRecomposee(
      avec({ pea: 100_000, immobilierLocatif: 100_000 }),
      'france',
    );
    expect(avecBien).toBeCloseTo(0.186 / 2, 10);
  });

  it('reports nothing rather than dividing by zero', () => {
    expect(impositionRecomposee(compositionVide(), 'france')).toBe(0);
  });
});
