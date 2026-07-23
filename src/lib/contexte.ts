import { createContext, useContext } from 'react';
import { LANGUE_PAR_DEFAUT, type Langue, type Traduit } from './i18n';
import { formats, type Formats } from './format';
import { TEXTES, type Dictionnaire } from './textes';

/**
 * The interface language, shared with the whole tree.
 *
 * A context rather than a prop threaded through eight components: the language
 * is read almost everywhere and set in exactly one place, which is precisely
 * the shape a context is for.
 */
export const ContexteLangue = createContext<Langue>(LANGUE_PAR_DEFAUT);

export const useLangue = (): Langue => useContext(ContexteLangue);

/** The whole dictionary in the current language. */
export const useTextes = (): Dictionnaire => TEXTES[useLangue()];

/** Number formatters bound to the current language. */
export const useFormats = (): Formats => formats(useLangue());

/** Picks the right wording out of a translated piece of data. */
export function useTraduire(): (t: Traduit) => string {
  const langue = useLangue();
  return (t) => t[langue];
}
