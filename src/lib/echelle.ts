/**
 * Logarithmic scale for the capital slider.
 *
 * The amount to be entered spans from a few thousand euros to a hundred
 * million: on a linear slider, the whole realistic range of a FIRE plan would
 * be crushed into the first two pixels. A logarithmic scale gives the same
 * relative precision everywhere — one notch always moves the amount by about
 * the same percentage.
 *
 * The slider therefore carries an integer position, and this module owns the
 * conversion in both directions. Position 0 is reserved for "nothing at all":
 * zero has no logarithm, and it is a case the simulator must handle.
 */

export const POSITION_MIN = 0;
export const POSITION_MAX = 200;

const VALEUR_MIN = 10_000;
export const VALEUR_MAX = 100_000_000;

const DECADES = Math.log(VALEUR_MAX / VALEUR_MIN);

/** One notch of the slider, as a fraction of the amount. */
const ECART_CRAN = Math.exp(DECADES / (POSITION_MAX - 1)) - 1;

/**
 * Rounds to an amount one can read out loud — 520 000 € rather than 523 456 €.
 *
 * The step is chosen relative to the amount, on the usual 1 / 2 / 5 ladder, and
 * always finer than one notch of the slider. Rounding to a fixed number of
 * significant digits would look tidier but would merge neighbouring notches at
 * the bottom of each decade, where the slider would then appear stuck.
 */
export function arrondiLisible(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 0;
  const cible = v * ECART_CRAN * 0.6;
  const magnitude = 10 ** Math.floor(Math.log10(cible));
  const normalise = cible / magnitude;
  const pas = (normalise >= 5 ? 5 : normalise >= 2 ? 2 : 1) * magnitude;
  return Math.round(v / pas) * pas;
}

export function valeurDePosition(position: number): number {
  if (!Number.isFinite(position) || position <= POSITION_MIN) return 0;
  const p = Math.min(POSITION_MAX, position);
  const valeur = VALEUR_MIN * Math.exp((DECADES * (p - 1)) / (POSITION_MAX - 1));
  // The top of the scale must land exactly on the bound, not on a rounding of
  // it, otherwise the field and the slider disagree at the maximum.
  return p >= POSITION_MAX ? VALEUR_MAX : arrondiLisible(valeur);
}

export function positionDeValeur(valeur: number): number {
  if (!Number.isFinite(valeur) || valeur < VALEUR_MIN) return POSITION_MIN;
  if (valeur >= VALEUR_MAX) return POSITION_MAX;
  const position =
    1 + ((POSITION_MAX - 1) * Math.log(valeur / VALEUR_MIN)) / DECADES;
  return Math.round(position);
}
