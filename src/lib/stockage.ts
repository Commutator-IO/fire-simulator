import { bornerComposition, estRenseignee, type Ligne } from './patrimoine';

/**
 * Keeping a statement between visits.
 *
 * The address remains the source of truth — it is what gets shared, and it wins
 * whenever it carries something. This is only for coming back without a link:
 * a statement takes a few minutes to fill in, and losing it to a closed tab is
 * a poor reward for the effort.
 *
 * Nothing leaves the browser. The store is versioned so that a release which
 * changes the shape of a line discards what it can no longer read, rather than
 * feeding the interface a half-understood object — and the interface offers a
 * reset for the day something goes wrong anyway.
 */

const CLE = 'fire-simulator.patrimoine';

/**
 * Bump this whenever the shape of a line changes. Anything stored under an
 * older number is dropped on sight.
 */
const VERSION = 1;

type Enregistrement = { version: number; lignes: Ligne[] };

export function charger(): Ligne[] | null {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut === null) return null;

    const lu = JSON.parse(brut) as Partial<Enregistrement>;
    if (lu.version !== VERSION || !Array.isArray(lu.lignes)) {
      oublier();
      return null;
    }
    return bornerComposition(lu.lignes);
  } catch {
    // Private browsing, a full quota, a corrupted entry: none of it is worth
    // taking the page down for.
    return null;
  }
}

export function enregistrer(lignes: Ligne[]): void {
  try {
    if (!estRenseignee(lignes)) {
      oublier();
      return;
    }
    const enregistrement: Enregistrement = { version: VERSION, lignes };
    localStorage.setItem(CLE, JSON.stringify(enregistrement));
  } catch {
    // Saving is a convenience; failing at it must stay invisible.
  }
}

export function oublier(): void {
  try {
    localStorage.removeItem(CLE);
  } catch {
    // Nothing to do, and nothing worth saying.
  }
}
