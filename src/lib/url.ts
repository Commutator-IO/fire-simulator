import { BORNES, DEFAUTS, type Hypotheses, type ModeRetrait } from './fire';
import { estClePays } from './pays';
import { estLangue, type Langue } from './i18n';
import {
  ACTIFS,
  BORNES_LIGNE,
  actif,
  bornerComposition,
  estRenseignee,
  type Ligne,
} from './patrimoine';

/**
 * Serialisation of a simulation into the URL.
 *
 * The site is fully static, so the URL is the only place to store shareable
 * state. State goes in the query string rather than the fragment, the latter
 * being already used by the in-page navigation anchors (#sources).
 *
 * Three principles:
 *  - only parameters that differ from the defaults are written, so links stay
 *    short and a future change of default value is not frozen into links that
 *    have already been shared;
 *  - rates travel as percentage points ("rendement=5"), because a shared link
 *    is also read by humans;
 *  - everything read back is clamped to the same bounds as the fields, the URL
 *    being untrusted input.
 */

/** Explicit keys: a link to a life plan benefits from being readable. */
const CLES = {
  patrimoine: 'patrimoine',
  rendement: 'rendement',
  retrait: 'retrait',
  impots: 'impots',
  depenses: 'depenses',
  inflation: 'inflation',
  horizon: 'horizon',
  duree: 'duree',
  mode: 'mode',
  pays: 'pays',
  langue: 'lang',
  vue: 'vue',
  videPatrimoine: 'vide',
} as const;

/**
 * The tabs, and which one the link opens on.
 *
 * The statement comes first, and is therefore the default: it answers the two
 * questions the withdrawal plan opens on, so starting there is starting at the
 * beginning. `bourse` and `locatif` are announced but not yet built. Held in
 * the address like everything else.
 */
export type Vue = 'patrimoine' | 'fire' | 'bourse' | 'locatif';

const VUES: readonly Vue[] = ['patrimoine', 'fire', 'bourse', 'locatif'];

/**
 * Holdings travel one parameter per line — `?pea=200000&scpi=40000` — rather
 * than packed into a single string. Colons and commas come back percent-encoded
 * and would turn a readable address into a smear; and a rate is written only
 * when it differs from the product's own, so a plain statement stays short.
 */
const SUFFIXE_TAUX = '-taux';
const SUFFIXE_LOYER = '-loyer';
const SUFFIXE_CHARGES = '-charges';
const SUFFIXE_IMPOTS = '-impots';

/**
 * Decimals kept on a rate travelling through the URL.
 *
 * Three, not two: the Japanese 20,315 % has to come back exactly as it left,
 * otherwise the link reopens on a rate that no longer matches any tax regime
 * and the interface calls it "personnalisé".
 */
const DECIMALES_TAUX = 3;

export function nombre(
  brut: string | null,
  defaut: number,
  min: number,
  max: number,
  decimales = 0,
): number {
  if (brut === null || brut.trim() === '') return defaut;
  const valeur = Number(brut);
  if (!Number.isFinite(valeur)) return defaut;
  const borne = Math.min(max, Math.max(min, valeur));
  const facteur = 10 ** decimales;
  return Math.round(borne * facteur) / facteur;
}

/** Display rounding, to keep stray decimals out of the URL. */
export const arrondi = (v: number, decimales = 0) => {
  const facteur = 10 ** decimales;
  return Math.round(v * facteur) / facteur;
};

/** A rate stored as a fraction, written as percentage points. */
const enPoints = (v: number) => arrondi(v * 100, DECIMALES_TAUX);

/**
 * Builds the query string representing the state, including only what differs
 * from the defaults. Returns an empty string when everything is default.
 */
/** Everything that travels alongside the withdrawal plan. */
export type Contexte = {
  /**
   * Written only when the visitor picked a language themselves, like every
   * other parameter left at its default: a link shared by someone who never
   * touched the switcher stays short and opens on the default language.
   */
  langue?: Langue | null;
  composition?: Ligne[];
  vue?: Vue;
};

export function encoderEtat(
  etat: Hypotheses,
  { langue = null, composition, vue }: Contexte = {},
  defauts: Hypotheses = DEFAUTS,
): string {
  const params = new URLSearchParams();
  const ajouter = (cle: string, valeur: number | string, defaut: number | string) => {
    if (valeur === defaut) return;
    params.set(cle, String(valeur));
  };

  ajouter(CLES.patrimoine, arrondi(etat.patrimoine), arrondi(defauts.patrimoine));
  ajouter(CLES.rendement, enPoints(etat.rendement), enPoints(defauts.rendement));
  ajouter(CLES.retrait, enPoints(etat.retrait), enPoints(defauts.retrait));
  ajouter(CLES.impots, enPoints(etat.imposition), enPoints(defauts.imposition));
  ajouter(CLES.depenses, arrondi(etat.depensesCibles), arrondi(defauts.depensesCibles));
  ajouter(CLES.inflation, enPoints(etat.inflation), enPoints(defauts.inflation));
  ajouter(CLES.horizon, arrondi(etat.horizon), arrondi(defauts.horizon));
  ajouter(CLES.duree, arrondi(etat.dureeExigee), arrondi(defauts.dureeExigee));
  ajouter(CLES.mode, etat.modeRetrait, defauts.modeRetrait);
  ajouter(CLES.pays, etat.pays, defauts.pays);
  if (langue !== null) params.set(CLES.langue, langue);
  if (vue !== undefined && vue !== 'patrimoine') params.set(CLES.vue, vue);

  // Sans marqueur, une adresse sans avoir ne se distinguerait pas d'une
  // première visite, et l'exemple reviendrait au rechargement.
  if (composition !== undefined && !estRenseignee(composition)) {
    params.set(CLES.videPatrimoine, '1');
  }

  for (const ligne of composition ?? []) {
    const a = actif(ligne.cle);
    if (a === undefined || ligne.montant <= 0) continue;
    params.set(ligne.cle, String(arrondi(ligne.montant)));

    if (a.revenus) {
      // A rented flat carries its rent rather than a rate: the rate is the
      // result, not an input.
      if (ligne.loyer > 0) params.set(`${ligne.cle}${SUFFIXE_LOYER}`, String(arrondi(ligne.loyer)));
      if (ligne.charges > 0)
        params.set(`${ligne.cle}${SUFFIXE_CHARGES}`, String(arrondi(ligne.charges)));
      if (enPoints(ligne.impositionRevenus) !== enPoints(a.impositionParDefaut ?? 0)) {
        params.set(
          `${ligne.cle}${SUFFIXE_IMPOTS}`,
          String(enPoints(ligne.impositionRevenus)),
        );
      }
      continue;
    }

    if (enPoints(ligne.rendement) !== enPoints(a.rendementParDefaut)) {
      params.set(`${ligne.cle}${SUFFIXE_TAUX}`, String(enPoints(ligne.rendement)));
    }
  }

  const chaine = params.toString();
  return chaine === '' ? '' : `?${chaine}`;
}

/** The view the URL asks for; the statement unless it names a known other. */
export function decoderVue(recherche: string): Vue {
  const demandee = new URLSearchParams(recherche).get(CLES.vue);
  return VUES.find((v) => v === demandee) ?? 'patrimoine';
}

/** Reads a set of holdings back, clamping every amount and every rate. */
/**
 * Holdings read back from the address, or null when it carries none — a first
 * visit, on which the interface opens on its example instead.
 */
export function decoderComposition(recherche: string): Ligne[] | null {
  const p = new URLSearchParams(recherche);
  const vide = p.get(CLES.videPatrimoine) === '1';
  if (!vide && !ACTIFS.some((a) => p.has(a.cle))) return null;
  const taux = (cle: string, defaut: number, max: number, min = 0) =>
    nombre(p.get(cle), defaut * 100, min * 100, max * 100, DECIMALES_TAUX) / 100;

  return bornerComposition(
    ACTIFS.map((a) => ({
      cle: a.cle,
      montant: nombre(p.get(a.cle), 0, BORNES_LIGNE.montant.min, BORNES_LIGNE.montant.max),
      rendement: taux(
        `${a.cle}${SUFFIXE_TAUX}`,
        a.rendementParDefaut,
        BORNES_LIGNE.rendement.max,
        BORNES_LIGNE.rendement.min,
      ),
      loyer: nombre(
        p.get(`${a.cle}${SUFFIXE_LOYER}`),
        0,
        BORNES_LIGNE.loyer.min,
        BORNES_LIGNE.loyer.max,
      ),
      charges: nombre(
        p.get(`${a.cle}${SUFFIXE_CHARGES}`),
        0,
        BORNES_LIGNE.loyer.min,
        BORNES_LIGNE.loyer.max,
      ),
      impositionRevenus: taux(
        `${a.cle}${SUFFIXE_IMPOTS}`,
        a.impositionParDefaut ?? 0,
        BORNES_LIGNE.impositionRevenus.max,
      ),
    })),
  );
}

/** The language asked for by the URL, or null when it says nothing. */
export function decoderLangue(recherche: string): Langue | null {
  const lue = new URLSearchParams(recherche).get(CLES.langue);
  return estLangue(lue) ? lue : null;
}

/** Reads a state back from a query string, clamping every value. */
export function decoderEtat(recherche: string, defauts: Hypotheses = DEFAUTS): Hypotheses {
  const p = new URLSearchParams(recherche);

  // Rates are read in points then divided, so the bounds are expressed in the
  // unit the URL actually carries.
  const taux = (cle: string, defaut: number, min: number, max: number) =>
    nombre(p.get(cle), defaut * 100, min * 100, max * 100, DECIMALES_TAUX) / 100;

  const mode = p.get(CLES.mode);
  const paysLu = p.get(CLES.pays);

  return {
    patrimoine: nombre(
      p.get(CLES.patrimoine),
      defauts.patrimoine,
      BORNES.patrimoine.min,
      BORNES.patrimoine.max,
    ),
    rendement: taux(
      CLES.rendement,
      defauts.rendement,
      BORNES.rendement.min,
      BORNES.rendement.max,
    ),
    retrait: taux(CLES.retrait, defauts.retrait, BORNES.retrait.min, BORNES.retrait.max),
    imposition: taux(
      CLES.impots,
      defauts.imposition,
      BORNES.imposition.min,
      BORNES.imposition.max,
    ),
    depensesCibles: nombre(
      p.get(CLES.depenses),
      defauts.depensesCibles,
      BORNES.depensesCibles.min,
      BORNES.depensesCibles.max,
    ),
    inflation: taux(
      CLES.inflation,
      defauts.inflation,
      BORNES.inflation.min,
      BORNES.inflation.max,
    ),
    horizon: nombre(
      p.get(CLES.horizon),
      defauts.horizon,
      BORNES.horizon.min,
      BORNES.horizon.max,
    ),
    dureeExigee: nombre(
      p.get(CLES.duree),
      defauts.dureeExigee,
      BORNES.dureeExigee.min,
      BORNES.dureeExigee.max,
    ),
    modeRetrait: (mode === 'indexe' || mode === 'proportionnel'
      ? mode
      : defauts.modeRetrait) as ModeRetrait,
    pays: estClePays(paysLu) ? paysLu : defauts.pays,
  };
}

/** Absolute URL to share, keeping the current path. */
export function lienPartage(etat: Hypotheses, contexte: Contexte = {}): string {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${encoderEtat(etat, contexte)}`;
}
