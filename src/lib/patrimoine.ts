import type { Traduit } from './i18n';

/**
 * What a French household actually owns, and what each part earns.
 *
 * The FIRE simulator asks for two numbers most people cannot answer off the top
 * of their head: how much capital they have, and what it returns. Nobody holds
 * a single blended portfolio — they hold a Livret A, a PEA, a life insurance
 * policy, a flat with a mortgage on it. This module turns that list into the
 * two numbers, and is deliberately the only place that knows the difference
 * between them.
 *
 * Two distinctions carry the whole model:
 *
 *  - **A debt is an asset with a minus sign**, and its interest rate is a
 *    negative return. That is not a trick: it is what leverage is, and writing
 *    it that way makes the blended return come out right without a special
 *    case. €500k of assets at 5 % against €200k of debt at 3 % leaves €300k
 *    earning €22k, that is 7,33 % — which is exactly what the weighted average
 *    gives.
 *  - **Owning a home is not an income**, so the main residence and the loan
 *    against it sit outside the capital that funds withdrawals. They stay in
 *    the net worth statement, because they are real wealth; they simply do not
 *    pay for the groceries.
 */

export type CategorieActif =
  | 'liquide'
  | 'assurance'
  | 'actions'
  | 'immobilier'
  | 'autre'
  | 'dettes';

export type CleActif =
  | 'livretA'
  | 'lep'
  | 'liquidites'
  | 'fondsEuros'
  | 'uniteCompte'
  | 'per'
  | 'pea'
  | 'compteTitres'
  | 'scpi'
  | 'immobilierLocatif'
  | 'residencePrincipale'
  | 'autres'
  | 'creditResidence'
  | 'autresCredits';

export type Actif = {
  cle: CleActif;
  categorie: CategorieActif;
  /** −1 for a debt: the amount is entered positive and counts against you. */
  signe: 1 | -1;
  /**
   * Does the line pay for withdrawals? A main residence does not — it lowers
   * what you spend, it does not hand you an income — and neither, therefore,
   * does the loan attached to it: excluding one without the other would make
   * the capital appear smaller than it is.
   */
  productif: boolean;
  /** A starting hypothesis, editable line by line. */
  rendementParDefaut: number;
  /** Statutory ceiling, when the product has one. */
  plafond?: number;
  libelle: Traduit;
  note: Traduit;
};

export const ACTIFS: Actif[] = [
  {
    cle: 'livretA',
    categorie: 'liquide',
    signe: 1,
    productif: true,
    // Taux fixé par arrêté, 1,7 % au 1ᵉʳ août 2026.
    rendementParDefaut: 0.017,
    plafond: 22_950 + 12_000,
    libelle: { fr: 'Livret A et LDDS', en: 'Livret A and LDDS' },
    note: {
      fr: 'Taux réglementé, net d’impôt. Plafonds cumulés de 22 950 € et 12 000 €.',
      en: 'Regulated rate, free of tax. Combined ceilings of €22,950 and €12,000.',
    },
  },
  {
    cle: 'lep',
    categorie: 'liquide',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.025,
    plafond: 10_000,
    libelle: { fr: 'Livret d’épargne populaire', en: 'Livret d’épargne populaire' },
    note: {
      fr: 'Sous condition de revenus. Taux réglementé, net d’impôt, plafond de 10 000 €.',
      en: 'Means-tested. Regulated rate, free of tax, ceiling of €10,000.',
    },
  },
  {
    cle: 'liquidites',
    categorie: 'liquide',
    signe: 1,
    productif: true,
    rendementParDefaut: 0,
    libelle: { fr: 'Comptes courants et liquidités', en: 'Current accounts and cash' },
    note: {
      fr: 'Ce qui dort sans rien rapporter. En garder est raisonnable ; en garder trop coûte le rendement de tout le reste.',
      en: 'What sits there earning nothing. Some is sensible; too much costs you the return on everything else.',
    },
  },
  {
    cle: 'fondsEuros',
    categorie: 'assurance',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.025,
    libelle: { fr: 'Assurance-vie — fonds euros', en: 'Life insurance — euro fund' },
    note: {
      fr: 'Capital garanti, rendement de l’ordre de 2,5 % ces dernières années.',
      en: 'Capital guaranteed, returning around 2.5% in recent years.',
    },
  },
  {
    cle: 'uniteCompte',
    categorie: 'assurance',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.06,
    libelle: { fr: 'Assurance-vie — unités de compte', en: 'Life insurance — unit-linked' },
    note: {
      fr: 'Actions, obligations ou immobilier logés dans le contrat, sans garantie du capital.',
      en: 'Equities, bonds or property held inside the policy, with no capital guarantee.',
    },
  },
  {
    cle: 'per',
    categorie: 'assurance',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.04,
    libelle: { fr: 'Plan d’épargne retraite', en: 'Retirement savings plan (PER)' },
    note: {
      fr: 'Bloqué jusqu’à la retraite, sauf accident de la vie et achat de la résidence principale. La sortie est imposée.',
      en: 'Locked until retirement, barring hardship and buying a first home. The exit is taxed.',
    },
  },
  {
    cle: 'pea',
    categorie: 'actions',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.07,
    plafond: 150_000,
    libelle: { fr: 'PEA', en: 'PEA equity savings plan' },
    note: {
      fr: 'Actions européennes. Versements plafonnés à 150 000 €, gains exonérés d’impôt sur le revenu après cinq ans.',
      en: 'European equities. Contributions capped at €150,000, gains free of income tax after five years.',
    },
  },
  {
    cle: 'compteTitres',
    categorie: 'actions',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.07,
    libelle: { fr: 'Compte-titres', en: 'Taxable brokerage account' },
    note: {
      fr: 'Sans plafond ni contrainte géographique, mais imposé à la flat tax.',
      en: 'No ceiling and no geographic constraint, but taxed at the flat rate.',
    },
  },
  {
    cle: 'scpi',
    categorie: 'immobilier',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.045,
    libelle: { fr: 'SCPI', en: 'Property investment trusts (SCPI)' },
    note: {
      fr: 'Immobilier locatif sans les locataires. Frais d’entrée élevés et revente parfois lente.',
      en: 'Rental property without the tenants. High entry fees, and selling can be slow.',
    },
  },
  {
    cle: 'immobilierLocatif',
    categorie: 'immobilier',
    signe: 1,
    productif: true,
    rendementParDefaut: 0.035,
    libelle: { fr: 'Immobilier locatif', en: 'Rental property' },
    note: {
      fr: 'Valeur du bien. Le rendement s’entend net de charges, de taxe foncière et de vacance — comptez nettement moins que le loyer brut.',
      en: 'The value of the property. The return is net of running costs, property tax and vacancy — reckon on markedly less than the headline rent.',
    },
  },
  {
    cle: 'residencePrincipale',
    categorie: 'immobilier',
    signe: 1,
    productif: false,
    rendementParDefaut: 0,
    libelle: { fr: 'Résidence principale', en: 'Main residence' },
    note: {
      fr: 'Compte dans votre patrimoine, pas dans ce qui finance vos retraits : elle réduit vos dépenses, elle ne verse pas de revenu. Sa valorisation ne se touche qu’en vendant.',
      en: 'Part of your net worth, not of what funds your withdrawals: it lowers your spending, it pays you nothing. Its appreciation is only reachable by selling.',
    },
  },
  {
    cle: 'autres',
    categorie: 'autre',
    signe: 1,
    productif: true,
    rendementParDefaut: 0,
    libelle: { fr: 'Autres actifs', en: 'Other assets' },
    note: {
      fr: 'Or, cryptomonnaies, parts de société, œuvres… À vous d’en fixer le rendement attendu.',
      en: 'Gold, crypto, shares in a business, art… the expected return is yours to set.',
    },
  },
  {
    cle: 'creditResidence',
    categorie: 'dettes',
    signe: -1,
    productif: false,
    rendementParDefaut: 0.03,
    libelle: {
      fr: 'Crédit de la résidence principale',
      en: 'Mortgage on the main residence',
    },
    note: {
      fr: 'Capital restant dû, et le taux du prêt. Il sort du patrimoine productif avec le logement qu’il finance : les exclure séparément fausserait le total.',
      en: 'Outstanding capital, and the rate of the loan. It leaves the productive capital along with the home it paid for: excluding one without the other would skew the total.',
    },
  },
  {
    cle: 'autresCredits',
    categorie: 'dettes',
    signe: -1,
    productif: true,
    rendementParDefaut: 0.03,
    libelle: { fr: 'Autres crédits', en: 'Other loans' },
    note: {
      fr: 'Crédit locatif, consommation, prêt étudiant. Capital restant dû et taux : un emprunt est un actif au signe inversé, et son taux un rendement négatif.',
      en: 'Buy-to-let, consumer credit, student loan. Outstanding capital and rate: a loan is an asset with a minus sign, and its rate a negative return.',
    },
  },
];

export const CATEGORIES: CategorieActif[] = [
  'liquide',
  'assurance',
  'actions',
  'immobilier',
  'autre',
  'dettes',
];

/** Colour of each category, wherever the split is drawn. */
export const COULEURS_CATEGORIES: Record<CategorieActif, string> = {
  liquide: 'var(--color-azur-500)',
  assurance: 'var(--color-jade-500)',
  actions: 'var(--color-brand-500)',
  immobilier: 'var(--color-brand-800)',
  autre: 'var(--color-ink-400)',
  dettes: 'var(--color-brique-500)',
};

export function actif(cle: CleActif): Actif {
  return ACTIFS.find((a) => a.cle === cle) ?? ACTIFS[0];
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export type Ligne = { cle: CleActif; montant: number; rendement: number };

/** Amounts and rates share the bounds of the simulator they feed. */
export const BORNES_LIGNE = {
  montant: { min: 0, max: 100_000_000 },
  rendement: { min: -0.1, max: 0.2 },
} as const;

const borne = (v: number, { min, max }: { min: number; max: number }) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;

/** A composition with every line at zero, at each product's default rate. */
export function compositionVide(): Ligne[] {
  return ACTIFS.map((a) => ({
    cle: a.cle,
    montant: 0,
    rendement: a.rendementParDefaut,
  }));
}

/**
 * Clamps a composition and puts it back in a known shape: one line per asset,
 * in the catalogue's order, whatever the URL happened to carry.
 */
export function bornerComposition(lignes: Ligne[]): Ligne[] {
  return ACTIFS.map((a) => {
    const lue = lignes.find((l) => l.cle === a.cle);
    return {
      cle: a.cle,
      montant: borne(lue?.montant ?? 0, BORNES_LIGNE.montant),
      rendement: borne(lue?.rendement ?? a.rendementParDefaut, BORNES_LIGNE.rendement),
    };
  });
}

export type PartCategorie = {
  categorie: CategorieActif;
  montant: number;
  /** Share of the gross assets, debts excluded from the denominator. */
  part: number;
};

export type Bilan = {
  /** Everything owned, debts aside. */
  brut: number;
  /** Everything owed. */
  dettes: number;
  /** Net worth: what you would be left with after selling and repaying. */
  net: number;
  /**
   * The part that funds withdrawals — net worth less the main residence and
   * the loan against it. This is what the FIRE simulator calls X.
   */
  productif: number;
  /** The blended return of the productive part. This is what it calls Y. */
  rendementRecompose: number;
  /** What the productive part earns in a year, at that blended rate. */
  gainsAnnuels: number;
  parCategorie: PartCategorie[];
  /** True once anything at all has been entered. */
  renseigne: boolean;
};

/**
 * Turns a list of holdings into the two numbers the FIRE simulator needs.
 *
 * The blended return is a weighted average, the weights being the signed
 * amounts — which is what makes a debt lower it rather than merely shrink the
 * capital. When the productive part is nil or negative the rate is reported as
 * zero rather than as the division it would otherwise be: a household that owes
 * more than it owns has no return to speak of, only a debt to repay.
 */
export function bilan(lignes: Ligne[]): Bilan {
  const bornees = bornerComposition(lignes);
  const avec = (l: Ligne) => actif(l.cle);

  const brut = bornees
    .filter((l) => avec(l).signe === 1)
    .reduce((somme, l) => somme + l.montant, 0);
  const dettes = bornees
    .filter((l) => avec(l).signe === -1)
    .reduce((somme, l) => somme + l.montant, 0);

  const productives = bornees.filter((l) => avec(l).productif);
  const productif = productives.reduce(
    (somme, l) => somme + avec(l).signe * l.montant,
    0,
  );
  const gains = productives.reduce(
    (somme, l) => somme + avec(l).signe * l.montant * l.rendement,
    0,
  );

  const parCategorie = CATEGORIES.map((categorie) => {
    const montant = bornees
      .filter((l) => avec(l).categorie === categorie)
      .reduce((somme, l) => somme + l.montant, 0);
    return { categorie, montant, part: brut > 0 ? montant / brut : 0 };
  }).filter((c) => c.montant > 0);

  const rendementRecompose = productif > 0 ? gains / productif : 0;

  return {
    brut,
    dettes,
    net: brut - dettes,
    productif,
    rendementRecompose,
    gainsAnnuels: productif > 0 ? gains : 0,
    parCategorie,
    renseigne: brut > 0 || dettes > 0,
  };
}
