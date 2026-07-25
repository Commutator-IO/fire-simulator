import { ACTIFS } from './patrimoine';

/**
 * Shortens the query string carried in the address bar and in shared links.
 *
 * A statement can name a dozen holdings, each with its own rate, so the raw
 * link runs long: keys like `residencePrincipale` or `immobilierLocatif-charges`
 * dwarf the numbers they carry. Two savings, both reversible:
 *  - long keys become short aliases (`patrimoine` → `p`, `assuranceVie` → `av`…);
 *  - the four line suffixes shrink too (`-taux` → `-t`, `-loyer` → `-l`…),
 *    handled structurally so a new holding never needs a new suffix entry.
 *
 * `minifier` is applied when a link is written (address bar, share button);
 * `etendre` restores full keys when a link is read, and leaves already-long
 * keys untouched — so links made before this existed still open. localStorage
 * keeps the full, readable form; only the URL is minified.
 *
 * Values are numbers and a handful of alphabetic tokens (`indexe`, `france`,
 * `synthese`…), none of which carry `&`, `=` or `#`, so they are rebuilt as-is
 * without re-encoding.
 */

/**
 * Full scalar key → short alias, hand-assigned so they stay stable: a shared
 * minified link must keep opening even after the holdings list grows. The model
 * letters guide the choice — Y for the return, Z for the withdrawal, α for tax.
 */
const SCALAIRES: Record<string, string> = {
  patrimoine: 'p',
  rendement: 'y',
  retrait: 'z',
  impots: 'i',
  depenses: 'd',
  inflation: 'f',
  horizon: 'h',
  duree: 'u',
  mode: 'm',
  pays: 'c',
  vue: 'v',
  lang: 'l',
  vide: 'x',
};

/**
 * Holding key → short alias. Two letters, one per holding, unique across both
 * countries since a link only ever carries one country's lines but the table
 * serves both.
 */
const ACTIFS_COURT: Record<string, string> = {
  // France
  livretA: 'la',
  lep: 'lp',
  liquidites: 'lq',
  fondsEuros: 'fe',
  uniteCompte: 'uc',
  per: 'pr',
  pea: 'pe',
  compteTitres: 'ct',
  scpi: 'sc',
  immobilierLocatif: 'il',
  reserveSasu: 'rs',
  compteCourantSasu: 'cc',
  titresSasu: 'ts',
  residencePrincipale: 'rp',
  autres: 'au',
  creditResidence: 'cr',
  credits: 'cd',
  // Japon
  futsuYokin: 'fy',
  teikiYokin: 'ty',
  nisa: 'ni',
  tokutei: 'tk',
  ideco: 'id',
  jreit: 'jr',
  locatifJp: 'lj',
  residenceJp: 'rj',
  creditResidenceJp: 'cj',
  autresJp: 'aj',
  creditsJp: 'dj',
};

/** Line suffix → short alias. The leading dash is kept as the join marker. */
const SUFFIXES_COURT: Record<string, string> = {
  '-taux': '-t',
  '-loyer': '-l',
  '-charges': '-c',
  '-impots': '-m',
};

const VERS_COURT: Record<string, string> = { ...SCALAIRES, ...ACTIFS_COURT };
const VERS_LONG: Record<string, string> = inverser(VERS_COURT);
const SUFFIXES_LONG: Record<string, string> = inverser(SUFFIXES_COURT);

function inverser(table: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(table).map(([long, court]) => [court, long]));
}

/**
 * Rewrites every key of a query string through a base table and a suffix table.
 *
 * A holding key never contains a dash, so the first dash — when there is one —
 * is the boundary with its suffix: `scpi-loyer` splits into a base and `-loyer`,
 * each translated on its own. Unknown keys and suffixes pass through, which is
 * what makes the round trip faithful and old long-key links still readable.
 */
function transformer(
  requete: string,
  base: Record<string, string>,
  suffixes: Record<string, string>,
): string {
  if (!requete || requete === '?') return '';
  const p = new URLSearchParams(requete);
  const parts: string[] = [];
  for (const [cle, valeur] of p) {
    const tiret = cle.indexOf('-');
    const rendu =
      tiret === -1
        ? (base[cle] ?? cle)
        : (base[cle.slice(0, tiret)] ?? cle.slice(0, tiret)) +
          (suffixes[cle.slice(tiret)] ?? cle.slice(tiret));
    parts.push(`${rendu}=${valeur}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

/** Full keys → short aliases. */
export function minifier(requete: string): string {
  return transformer(requete, VERS_COURT, SUFFIXES_COURT);
}

/** Short aliases → full keys; long keys pass through unchanged. */
export function etendre(requete: string): string {
  return transformer(requete, VERS_LONG, SUFFIXES_LONG);
}

/** The current address-bar query, expanded to full keys (empty off-browser). */
export function rechercheCourante(): string {
  return typeof window === 'undefined' ? '' : etendre(window.location.search);
}

/** Every holding carries an alias — guards against a new one slipping through. */
export function actifsSansAlias(): string[] {
  return ACTIFS.map((a) => a.cle).filter((cle) => !(cle in ACTIFS_COURT));
}
