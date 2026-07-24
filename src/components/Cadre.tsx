import { DEPOT, LIEN_ISSUES } from '../lib/depot';
import { useTextes } from '../lib/contexte';
import { CODES_LANGUES, LANGUES, NOMS_LANGUES, type Langue } from '../lib/i18n';
import type { Vue } from '../lib/url';

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
  vue,
  onVue,
}: {
  langue: Langue;
  onLangue: (l: Langue) => void;
  vue: Vue;
  onVue: (v: Vue) => void;
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

        <Onglets vue={vue} onVue={onVue} />

        <a
          href="#methode"
          className="shrink-0 text-sm text-ink-500 transition hover:text-ink-900"
        >
          {t.entete.methode}
        </a>

        <ChoixLangue langue={langue} onLangue={onLangue} etiquette={t.entete.choixLangue} />
      </div>

      {/* The notice has to be on every view, and the tabs have taken the row
          it used to share. A thin strip keeps it in sight without competing. */}
      <p className="border-t border-ink-200/70 bg-ink-50/60 px-5 py-1.5 text-center text-[11px] leading-relaxed text-ink-400">
        {t.entete.avertissementDebut}{' '}
        <strong className="font-medium text-ink-500">{t.entete.avertissementFort}</strong>
      </p>
    </header>
  );
}

/**
 * The two simulators.
 *
 * Tabs rather than two pages: the second exists to answer the first one's
 * opening questions, and one hands its figures to the other. Keeping them in
 * the same page makes that handover a click instead of a reload.
 */
function Onglets({ vue, onVue }: { vue: Vue; onVue: (v: Vue) => void }) {
  const t = useTextes();
  const onglets: { cle: Vue; label: string }[] = [
    { cle: 'fire', label: t.onglets.fire },
    { cle: 'patrimoine', label: t.onglets.patrimoine },
  ];

  return (
    <nav
      aria-label={t.onglets.aria}
      className="flex flex-1 flex-wrap items-center gap-1"
    >
      {onglets.map((o) => {
        const actif = o.cle === vue;
        return (
          <button
            key={o.cle}
            type="button"
            aria-current={actif ? 'page' : undefined}
            onClick={() => onVue(o.cle)}
            className={[
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              actif
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900',
            ].join(' ')}
          >
            {o.label}
          </button>
        );
      })}
    </nav>
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
