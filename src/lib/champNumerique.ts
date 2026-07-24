import { useEffect, useState } from 'react';
import { useFormats } from './contexte';

export type OptionsSaisie = {
  min: number;
  max: number;
  /** Decimals allowed; 0 for a whole-euro amount. */
  decimales?: number;
  /** For optional fields: zero is "not filled in", and shows the placeholder. */
  videSiZero?: boolean;
};

/**
 * The typing logic behind every numeric field.
 *
 * Two things it has to get right, and neither is obvious:
 *  - a local draft, so clearing the field does not make a zero appear under the
 *    user's fingers, and so an entry in progress ("1,", "−") is left alone;
 *  - an out-of-bounds value is clamped rather than refused, because refusing a
 *    keystroke silently is how a field ends up feeling broken. The bounds are
 *    spelled out in the hint under each field.
 */
export function useChampNumerique(
  valeur: number,
  { min, max, decimales = 0, videSiZero = false }: OptionsSaisie,
  onChange: (v: number) => void,
) {
  const signeAutorise = min < 0;
  const { etiquette, separateurDecimal, num } = useFormats();

  const formater = (v: number) =>
    videSiZero && v === 0
      ? ''
      : decimales === 0
        ? num(v)
        : v.toLocaleString(etiquette, {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimales,
          });

  // Both decimal marks are accepted whatever the language: a French keyboard
  // types a comma, an English one a full stop, and neither should be refused
  // because the interface happens to be in the other language.
  const analyser = (saisie: string) => {
    const negatif = signeAutorise && /^\s*[-−]/.test(saisie);
    const chiffres =
      decimales === 0
        ? saisie.replace(/[^\d]/g, '')
        : saisie.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const nettoye = `${negatif && chiffres !== '' ? '-' : ''}${chiffres}`;
    return { negatif, chiffres, valeur: Number(nettoye || 0) };
  };

  const [brouillon, setBrouillon] = useState(() => formater(valeur));

  useEffect(() => {
    if (analyser(brouillon).valeur !== valeur) setBrouillon(formater(valeur));
    // Only resynchronise when the upstream value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeur]);

  return {
    brouillon,
    saisir: (saisie: string) => {
      const { negatif, chiffres, valeur: v } = analyser(saisie);
      const signe = negatif ? '−' : '';
      setBrouillon(
        decimales === 0
          ? // A euro amount reads better with its separators, including while
            // being typed.
            chiffres === ''
            ? signe
            : signe + formater(Number(chiffres))
          : signe + chiffres.replace('.', separateurDecimal),
      );
      onChange(Math.min(max, Math.max(min, v)));
    },
    quitter: () => setBrouillon(formater(valeur)),
  };
}
