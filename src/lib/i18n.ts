/**
 * Languages the interface speaks.
 *
 * Two, chosen for what the tool does rather than for coverage: French because
 * the simulator was written for a French audience, English because it is the
 * language of the FIRE community.
 *
 * The language is a display concern only. It never touches the engine: no
 * calculation, no rate and no default depends on it. Country of residence and
 * language are deliberately kept apart, since living in Japan and reading in
 * English is an entirely ordinary combination.
 *
 * Adding a language means adding it here and to `textes.ts`, where the French
 * entry defines the type — a missing key is then a build error rather than a
 * stray French sentence.
 */

export const LANGUES = ['fr', 'en'] as const;

export type Langue = (typeof LANGUES)[number];

export const LANGUE_PAR_DEFAUT: Langue = 'fr';

/** A string in each language. Used for data that carries its own wording. */
export type Traduit = Record<Langue, string>;

/** Native name of each language, as shown in the switcher. */
export const NOMS_LANGUES: Record<Langue, string> = {
  fr: 'Français',
  en: 'English',
};

/** Short form for the header, where space is tight. */
export const CODES_LANGUES: Record<Langue, string> = {
  fr: 'FR',
  en: 'EN',
};

/** BCP 47 tags, for `Intl` and for the `lang` attribute of the document. */
export const ETIQUETTES_LANGUES: Record<Langue, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
};

export function estLangue(valeur: unknown): valeur is Langue {
  return LANGUES.includes(valeur as Langue);
}

/**
 * The language the visitor's browser asks for, when the URL says nothing.
 *
 * Only the primary subtag is compared: `fr-CA` and `fr-BE` both land on French.
 * Anything unknown falls back rather than guessing.
 */
export function langueDuNavigateur(): Langue {
  if (typeof navigator === 'undefined') return LANGUE_PAR_DEFAUT;
  for (const demandee of navigator.languages ?? [navigator.language]) {
    const base = demandee?.split('-')[0]?.toLowerCase();
    if (estLangue(base)) return base;
  }
  return LANGUE_PAR_DEFAUT;
}
