/**
 * Keeping a whole session between visits.
 *
 * The address remains the source of truth — it is what gets shared, and it wins
 * whenever it carries something. This is only for coming back without a link:
 * a plan takes a few minutes to fill in — a patrimoine spread over a dozen
 * lines, a withdrawal rate, a horizon, a country — and losing all of it to a
 * closed tab is a poor reward for the effort.
 *
 * What is stored is the very query string the tool already produces, in its
 * full readable form: the existing encoder writes it and the existing decoders
 * read it back, each clamping its own values, so nothing here needs its own
 * schema or version guard. A holding whose key a later release no longer knows
 * is simply ignored on read, the same as an unknown URL parameter — line by
 * line, rather than dropping the whole store.
 *
 * Nothing leaves the browser.
 */

const CLE = 'fire-simulator.etat';

/** The query string last saved, or empty — off-browser, or on a first visit. */
export function litEtat(): string {
  try {
    return localStorage.getItem(CLE) ?? '';
  } catch {
    // Private browsing, a disabled store: fall back to the defaults.
    return '';
  }
}

/** Saves the current encoding, or clears the slot when there is nothing to keep. */
export function ecritEtat(requete: string): void {
  try {
    if (requete) localStorage.setItem(CLE, requete);
    else localStorage.removeItem(CLE);
  } catch {
    // Saving is a convenience; failing at it must stay invisible.
  }
}

/** Drops the saved session, for the day something goes wrong — or a fresh start. */
export function oublier(): void {
  ecritEtat('');
}
