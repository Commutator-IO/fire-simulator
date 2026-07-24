import type { ReactNode } from 'react';
import { useTextes } from '../lib/contexte';
import { Avertissement } from './Cadre';

/**
 * A tab that is announced but not yet built.
 *
 * Shown rather than hidden on purpose: naming what is coming is a promise the
 * roadmap can be held to, and it lets someone judge whether the tool is going
 * where they need before investing time in it. The illustration below the fold
 * is inert — figures spelled out to show the shape of the answer, never dressed
 * up as a live one.
 */
export function AVenir({
  titre,
  intro,
  promesses,
  apercu,
}: {
  titre: string;
  intro: string;
  /** What the tab will do, once built. */
  promesses: { titre: string; corps: string }[];
  /** An inert illustration of the eventual screen. */
  apercu: ReactNode;
}) {
  const t = useTextes();

  return (
    <main>
      <section className="border-b border-ink-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 pt-12 pb-12 sm:pt-18 sm:pb-16">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-500">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {t.aVenir.badge}
          </p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            {titre}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-500">
            {intro}
          </p>
          <div className="mt-6 max-w-2xl">
            <Avertissement />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
          {t.aVenir.prevuTitre}
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {promesses.map((p) => (
            <div key={p.titre} className="card p-6">
              <h3 className="font-semibold text-ink-900">{p.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{p.corps}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
              {t.aVenir.apercuTitre}
            </h2>
            <p className="text-sm font-medium text-ink-400">{t.aVenir.apercuTag}</p>
          </div>
          {/* Grisé et non interactif : c'est une maquette, et rien ici ne doit
              pouvoir passer pour un chiffre vrai. */}
          <div
            className="mt-8 select-none opacity-60"
            aria-hidden="true"
            inert
          >
            {apercu}
          </div>
        </div>
      </section>
    </main>
  );
}
