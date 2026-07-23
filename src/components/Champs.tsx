import { useEffect, useId, useState } from 'react';
import { useFormats } from '../lib/contexte';
import {
  POSITION_MAX,
  POSITION_MIN,
  positionDeValeur,
  valeurDePosition,
} from '../lib/echelle';

// ---------------------------------------------------------------------------
// Shared numeric entry
// ---------------------------------------------------------------------------

type OptionsSaisie = {
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
function useChampNumerique(
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

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------

type CurseurProps = {
  label: string;
  valeur: number;
  min: number;
  max: number;
  pas: number;
  onChange: (v: number) => void;
  /** Renders the current value, to the right of the label. */
  rendu: (v: number) => string;
  /**
   * Turns that value into an editable field, in the same unit as the slider.
   * The specification asks for numeric fields doubled with sliders; rather than
   * two controls side by side, the displayed value *is* the field.
   */
  saisie?: { suffixe: string; decimales?: number };
  /** Tick marks shown under the track. */
  reperes?: { valeur: number; label: string }[];
  hint?: string;
  /** Hides the header row when the field above already names the value. */
  labelMasque?: boolean;
};

export function Curseur({
  label,
  valeur,
  min,
  max,
  pas,
  onChange,
  rendu,
  saisie,
  reperes = [],
  hint,
  labelMasque = false,
}: CurseurProps) {
  const id = useId();
  const idSaisie = useId();
  const progression = max > min ? ((valeur - min) / (max - min)) * 100 : 0;

  const champ = useChampNumerique(
    valeur,
    { min, max, decimales: saisie?.decimales ?? 0 },
    onChange,
  );

  return (
    <div>
      {labelMasque ? (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      ) : (
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <label htmlFor={saisie ? idSaisie : id} className="text-sm font-medium text-ink-700">
            {label}
          </label>
          {saisie ? (
            <span className="flex items-baseline gap-1 rounded-lg border border-transparent px-1.5 py-0.5 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100">
              <input
                id={idSaisie}
                inputMode="decimal"
                autoComplete="off"
                value={champ.brouillon}
                onChange={(e) => champ.saisir(e.target.value)}
                onBlur={champ.quitter}
                // Sized on its content: a rate needs four characters, an amount
                // needs ten, and a fixed width would leave a hole in the layout.
                size={Math.max(2, champ.brouillon.length)}
                className="tabular w-auto bg-transparent text-right text-xl font-semibold text-ink-900 outline-none sm:text-2xl"
              />
              <span className="text-base text-ink-400">{saisie.suffixe}</span>
            </span>
          ) : (
            <output
              htmlFor={id}
              className="tabular text-xl font-semibold text-ink-900 sm:text-2xl"
            >
              {rendu(valeur)}
            </output>
          )}
        </div>
      )}

      <input
        id={id}
        type="range"
        className="brand-range"
        min={min}
        max={max}
        step={pas}
        value={valeur}
        // Without this the browser restores the field value on reload and it
        // diverges from the React state.
        autoComplete="off"
        aria-label={labelMasque || saisie ? label : undefined}
        onChange={(e) => onChange(Number(e.target.value))}
        // Scrolling the page over the slider must not change its value: the
        // wheel is neutralised by dropping focus and letting the event pass.
        onWheel={(e) => e.currentTarget.blur()}
        style={{
          ['--range-track' as string]: `linear-gradient(to right, var(--color-brand-500) ${progression}%, var(--color-ink-200) ${progression}%)`,
        }}
      />

      {reperes.length > 0 && (
        <div className="relative mt-1 h-9">
          {reperes.map((r) => {
            const position = ((r.valeur - min) / (max - min)) * 100;
            if (position < 0 || position > 100) return null;
            // A tick at either end would be cut off by the edge of the field if
            // it stayed centred on its value.
            const bord = position <= 3 ? 'debut' : position >= 97 ? 'fin' : 'centre';
            return (
              <button
                key={`${r.valeur}-${r.label}`}
                type="button"
                onClick={() => onChange(r.valeur)}
                className={[
                  'absolute top-0 whitespace-nowrap rounded px-1 py-0.5 text-[11px] text-ink-400 transition hover:text-brand-600',
                  bord === 'debut' ? '' : bord === 'fin' ? '-translate-x-full' : '-translate-x-1/2',
                ].join(' ')}
                style={{ left: `${position}%` }}
              >
                <span
                  className={[
                    'mb-1 block h-1.5 w-px bg-ink-300',
                    bord === 'debut' ? 'mr-auto' : bord === 'fin' ? 'ml-auto' : 'mx-auto',
                  ].join(' ')}
                />
                {r.label}
              </button>
            );
          })}
        </div>
      )}

      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Logarithmic slider
// ---------------------------------------------------------------------------

type CurseurLogProps = {
  label: string;
  /** In euros: the logarithmic position stays an implementation detail. */
  valeur: number;
  onChange: (v: number) => void;
  reperes?: { valeur: number; label: string }[];
};

/**
 * Capital slider, on a logarithmic scale.
 *
 * A hundred thousand euros and ten million are both plausible answers here, and
 * a linear track would squeeze every realistic plan into its first centimetre.
 * The amount itself is entered in the field above, hence the bare track.
 */
export function CurseurLog({ label, valeur, onChange, reperes = [] }: CurseurLogProps) {
  return (
    <Curseur
      label={label}
      valeur={positionDeValeur(valeur)}
      min={POSITION_MIN}
      max={POSITION_MAX}
      pas={1}
      onChange={(p) => onChange(valeurDePosition(p))}
      rendu={() => ''}
      labelMasque
      reperes={reperes.map((r) => ({ ...r, valeur: positionDeValeur(r.valeur) }))}
    />
  );
}

// ---------------------------------------------------------------------------
// Amount input
// ---------------------------------------------------------------------------

type MontantProps = {
  label: string;
  valeur: number;
  onChange: (v: number) => void;
  suffixe?: string;
  hint?: string;
  min?: number;
  max?: number;
  decimales?: number;
  /**
   * Shown greyed out when the field is empty. Declaring one also makes the
   * field optional: zero is then rendered as an empty field rather than as a
   * "0" the user has to erase before typing.
   */
  placeholder?: string;
};

export function Montant({
  label,
  valeur,
  onChange,
  suffixe = '€',
  hint,
  min = 0,
  max = 100_000_000,
  decimales = 0,
  placeholder,
}: MontantProps) {
  const id = useId();
  const champ = useChampNumerique(
    valeur,
    { min, max, decimales, videSiZero: placeholder !== undefined },
    onChange,
  );

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="flex items-center rounded-xl border border-ink-200 bg-white transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          className="tabular w-full rounded-xl bg-transparent px-3.5 py-2.5 text-base font-semibold text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-300"
          value={champ.brouillon}
          onChange={(e) => champ.saisir(e.target.value)}
          onBlur={champ.quitter}
        />
        <span className="shrink-0 pr-3.5 text-sm text-ink-400">{suffixe}</span>
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Segmented control
// ---------------------------------------------------------------------------

type SegmentProps<T extends string | number | boolean> = {
  label?: string;
  valeur: T;
  options: { valeur: T; label: string }[];
  onChange: (v: T) => void;
  hint?: string;
};

export function Segments<T extends string | number | boolean>({
  label,
  valeur,
  options,
  onChange,
  hint,
}: SegmentProps<T>) {
  return (
    <div>
      {label && <span className="field-label">{label}</span>}
      <div className="flex rounded-xl border border-ink-200 bg-ink-100/60 p-1">
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <button
              key={String(o.valeur)}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(o.valeur)}
              className={[
                'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                actif
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-800',
              ].join(' ')}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
