import { DEPOT, LIEN_ISSUES } from '../lib/depot';
import { useTextes } from '../lib/contexte';
import { CODES_LANGUES, LANGUES, NOMS_LANGUES, type Langue } from '../lib/i18n';

/**
 * Header and footer of the tool.
 *
 * The header carries the "not financial advice" notice. The specification asks
 * for it on every view; the header being sticky, it is the one place where that
 * is true without repeating the sentence in each section.
 */

export function Entete({
  langue,
  onLangue,
}: {
  langue: Langue;
  onLangue: (l: Langue) => void;
}) {
  const t = useTextes();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5">
        {/* Relative, like the built assets: the site lives just as happily at
            the root of a domain as under /<repo>/ on GitHub Pages. */}
        <a href="./" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            F
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink-900">
            FIRE <span className="text-brand-600">simulator</span>
          </span>
        </a>

        <p className="order-3 w-full text-xs leading-relaxed text-ink-400 sm:order-none sm:w-auto sm:flex-1">
          {t.entete.avertissementDebut}{' '}
          <strong className="font-medium text-ink-500">
            {t.entete.avertissementFort}
          </strong>
        </p>

        <a
          href="#methode"
          className="shrink-0 text-sm text-ink-500 transition hover:text-ink-900"
        >
          {t.entete.methode}
        </a>

        <ChoixLangue langue={langue} onLangue={onLangue} etiquette={t.entete.choixLangue} />
      </div>
    </header>
  );
}

/**
 * Language switcher.
 *
 * Each language is written in its own name, never translated and never behind a
 * flag: a flag stands for a country, and the reader here is choosing a language.
 */
function ChoixLangue({
  langue,
  onLangue,
  etiquette,
}: {
  langue: Langue;
  onLangue: (l: Langue) => void;
  etiquette: string;
}) {
  return (
    <div
      role="group"
      aria-label={etiquette}
      className="flex shrink-0 gap-0.5 rounded-lg border border-ink-200 bg-ink-100/60 p-0.5"
    >
      {LANGUES.map((l) => {
        const actif = l === langue;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={actif}
            title={NOMS_LANGUES[l]}
            onClick={() => onLangue(l)}
            className={[
              'rounded px-2 py-1 text-xs font-medium transition',
              actif ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800',
            ].join(' ')}
          >
            {CODES_LANGUES[l]}
          </button>
        );
      })}
    </div>
  );
}

export function Pied() {
  const t = useTextes();

  return (
    <footer className="border-t border-ink-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-ink-400">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <p>{t.pied.resume}</p>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            <a
              href={LIEN_ISSUES}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-ink-900"
            >
              {t.pied.signaler}
            </a>
            <a
              href={DEPOT}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-ink-900"
            >
              {t.pied.code}
            </a>
          </p>
        </div>
        <p className="mt-4 max-w-3xl leading-relaxed">{t.pied.mention}</p>
      </div>
    </footer>
  );
}
