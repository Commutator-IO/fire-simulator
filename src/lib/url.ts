import { BORNES, DEFAUTS, type Hypotheses, type ModeRetrait } from './fire';
import { estClePays } from './pays';
import { estLangue, type Langue } from './i18n';

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
} as const;

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
export function encoderEtat(
  etat: Hypotheses,
  /**
   * Written only when the visitor picked a language themselves, like every
   * other parameter left at its default: a link shared by someone who never
   * touched the switcher stays short and opens on the default language.
   */
  langue: Langue | null = null,
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

  const chaine = params.toString();
  return chaine === '' ? '' : `?${chaine}`;
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
export function lienPartage(etat: Hypotheses, langue: Langue | null = null): string {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${encoderEtat(etat, langue)}`;
}
