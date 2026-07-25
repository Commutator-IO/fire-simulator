import { useEffect, useState, type ReactNode } from 'react';
import { useFormats, useTextes, useTraduire } from '../lib/contexte';
import { BoutonPartage } from './BoutonPartage';
import type { Hypotheses, Niveau, Projection, Resultat } from '../lib/fire';
import { pays as paysDe } from '../lib/pays';
import { COULEURS_CATEGORIES, type Bilan } from '../lib/patrimoine';

/**
 * The two working tabs, gathered into one printable document.
 *
 * Same principle as the SASU simulator's synthèse: a deck of panels that reads
 * as a single exercise end to end, a carousel on screen and one panel per page
 * in print. Nothing is computed here that the other tabs do not already show —
 * this is a presenter, handed the figures the app has to hand, so the summary
 * and the tabs can never disagree.
 */

type Props = {
  h: Hypotheses;
  r: Resultat;
  /** Central scenario, the plan as stated. */
  projection: Projection;
  niveau: Niveau;
  /** Bilan of the current holdings, or an empty one when none are entered. */
  bilan: Bilan;
  impositionRecomposee: number;
  /** Whether the plan's figures still trace back to the holdings above. */
  dejaApplique: boolean;
  lien: string;
};

/** Colour the verdict chip the same way the banner does, level not nominal. */
const CHIP: Record<Niveau, string> = {
  preserve: 'bg-jade-100 text-jade-800',
  suffisant: 'bg-brand-100 text-brand-800',
  insuffisant: 'bg-brique-100 text-brique-800',
  'sans-patrimoine': 'bg-ink-100 text-ink-600',
};

export function Synthese({
  h,
  r,
  projection,
  niveau,
  bilan,
  impositionRecomposee,
  dejaApplique,
  lien,
}: Props) {
  const t = useTextes();
  const tr = useTraduire();
  const { eur, pct } = useFormats();
  const s = t.synthese;

  const badge = {
    preserve: t.verdict.badgePreserve,
    suffisant: t.verdict.badgeSuffisant,
    insuffisant: t.verdict.badgeInsuffisant,
    'sans-patrimoine': t.verdict.badgePasEncore,
  }[niveau];

  const slides = [
    <Couverture
      key="couverture"
      eyebrow={s.couvertureEyebrow(tr(paysDe(h.pays).libelle))}
      badge={badge}
      chip={CHIP[niveau]}
      chiffres={[
        { label: s.labelPatrimoine, valeur: eur(h.patrimoine) },
        { label: s.labelRendement, valeur: pct(h.rendement, 1) },
        { label: s.labelRetrait, valeur: pct(h.retrait, 1) },
        { label: s.labelRevenuMois, valeur: eur(r.revenuNetMensuel), accent: true },
      ]}
    />,
    <Patrimoine
      key="patrimoine"
      bilan={bilan}
      impositionRecomposee={impositionRecomposee}
      dejaApplique={dejaApplique}
      h={h}
    />,
    <Revenu key="revenu" h={h} r={r} />,
    <ProjectionVolet key="projection" h={h} projection={projection} niveau={niveau} />,
    <Repartition key="repartition" h={h} r={r} niveau={niveau} />,
  ];

  const nb = slides.length;
  const [index, setIndex] = useState(0);
  const aller = (n: number) => setIndex(Math.min(nb - 1, Math.max(0, n)));

  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(nb - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', clavier);
    return () => window.removeEventListener('keydown', clavier);
  }, [nb]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14 print:max-w-none print:p-0">
      {/* Barre d'outils — jamais imprimée. */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {s.barreTitre}
          </h1>
          <p className="mt-1 text-sm text-ink-500">{s.barreSoustitre}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {s.imprimer}
        </button>
      </div>

      {/* La pile. À l'écran seul le volet actif s'affiche ; l'impression les
          révèle tous, un par page. */}
      <div className="print:space-y-0">
        {slides.map((slide, i) => (
          <div key={i} className={i === index ? 'block' : 'hidden print:block'}>
            <Cadre numero={i + 1} total={nb} actif={i === index} marque={s.marque}>
              {slide}
            </Cadre>
          </div>
        ))}
      </div>

      {/* Contrôles du carrousel — jamais imprimés. */}
      <div className="mt-6 flex items-center justify-between gap-4 print:hidden">
        <button
          type="button"
          onClick={() => aller(index - 1)}
          disabled={index === 0}
          className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition enabled:hover:border-brand-400 enabled:hover:text-brand-700 disabled:opacity-40"
        >
          ← {s.precedent}
        </button>

        <div className="flex items-center gap-2" role="tablist" aria-label={s.voletsAria}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={s.volet(i + 1)}
              onClick={() => setIndex(i)}
              className={[
                'h-2.5 rounded-full transition-all',
                i === index ? 'w-6 bg-brand-600' : 'w-2.5 bg-ink-300 hover:bg-ink-400',
              ].join(' ')}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => aller(index + 1)}
          disabled={index === nb - 1}
          className="rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition enabled:hover:border-brand-400 enabled:hover:text-brand-700 disabled:opacity-40"
        >
          {s.suivant} →
        </button>
      </div>

      <div className="mt-6 print:hidden">
        <BoutonPartage lien={lien} />
      </div>
    </main>
  );
}

/** Cadre uniforme d'un volet : un bandeau courant, un corps qui remplit. */
function Cadre({
  numero,
  total,
  actif,
  marque,
  children,
}: {
  numero: number;
  total: number;
  actif: boolean;
  marque: string;
  children: ReactNode;
}) {
  return (
    <section
      className="slide card flex min-h-[70vh] flex-col p-6 sm:p-10 print:min-h-[172mm]"
      aria-hidden={actif === false}
    >
      <div className="flex items-center justify-between border-b border-ink-100 pb-3">
        <span className="text-sm font-semibold text-brand-600">{marque}</span>
        <span className="tabular text-xs text-ink-400">
          {numero} / {total}
        </span>
      </div>
      <div className="mt-6 flex flex-1 flex-col justify-center">{children}</div>
    </section>
  );
}

function Titre({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-5 text-xl font-semibold tracking-tight text-ink-900">{children}</h2>
  );
}

function Chiffre({
  label,
  valeur,
  accent = false,
}: {
  label: string;
  valeur: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd
        className={[
          'tabular mt-1 text-xl font-semibold tracking-tight sm:text-2xl',
          accent ? 'text-brand-700' : 'text-ink-900',
        ].join(' ')}
      >
        {valeur}
      </dd>
    </div>
  );
}

// --------------------------------------------------------------------- Volets

function Couverture({
  eyebrow,
  badge,
  chip,
  chiffres,
}: {
  eyebrow: string;
  badge: string;
  chip: string;
  chiffres: { label: string; valeur: string; accent?: boolean }[];
}) {
  const t = useTextes();
  const s = t.synthese;
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.15em] text-brand-600">
          {eyebrow}
        </p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${chip}`}
        >
          {badge}
        </span>
      </div>
      <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl">
        {s.couvertureTitre}
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 sm:text-lg">
        {s.couvertureIntro}
      </p>
      <ul className="mt-5 grid max-w-2xl gap-x-8 gap-y-2 text-sm leading-relaxed text-ink-500 sm:grid-cols-2">
        {s.couvertureListe.map((ligne, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-brand-500">{i + 1}.</span> {ligne}
          </li>
        ))}
      </ul>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-400">
        {s.couvertureNote}
      </p>

      <dl className="mt-auto grid grid-cols-2 gap-x-8 gap-y-5 border-t border-ink-100 pt-8 sm:grid-cols-4">
        {chiffres.map((c) => (
          <Chiffre key={c.label} label={c.label} valeur={c.valeur} accent={c.accent} />
        ))}
      </dl>
    </div>
  );
}

function Patrimoine({
  bilan,
  impositionRecomposee,
  dejaApplique,
  h,
}: {
  bilan: Bilan;
  impositionRecomposee: number;
  dejaApplique: boolean;
  h: Hypotheses;
}) {
  const t = useTextes();
  const { eur, pct, tauxPct } = useFormats();
  const s = t.synthese;

  if (!bilan.renseigne) {
    return (
      <div className="flex h-full flex-col justify-center">
        <Titre>{s.patrimoineTitre}</Titre>
        <p className="max-w-2xl text-base leading-relaxed text-ink-500">
          {s.patrimoineVide}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Titre>{s.patrimoineTitre}</Titre>
      <p className="max-w-3xl text-sm leading-relaxed text-ink-500">
        {s.patrimoineIntro(eur(bilan.productif), pct(bilan.rendementRecompose, 1))}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
        <Chiffre label={s.labelBrut} valeur={eur(bilan.brut)} />
        <Chiffre label={s.labelDettes} valeur={eur(bilan.dettes)} />
        <Chiffre label={s.labelNet} valeur={eur(bilan.net)} />
        <Chiffre label={s.labelProductif} valeur={eur(bilan.productif)} accent />
      </dl>

      <div className="mt-auto space-y-3 pt-8">
        {bilan.parCategorie.map((part) => (
          <div key={part.categorie}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-ink-600">{t.patrimoine.categorie[part.categorie]}</span>
              <span className="tabular shrink-0 font-semibold text-ink-900">
                {eur(part.montant)}{' '}
                <span className="font-normal text-ink-400">({pct(part.part, 0)})</span>
              </span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full"
                style={{
                  width: `${Math.min(100, part.part * 100)}%`,
                  backgroundColor: COULEURS_CATEGORIES[part.categorie],
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 border-t border-ink-100 pt-4 text-sm text-ink-500">
        {s.labelImpositionRecomposee} :{' '}
        <strong className="font-semibold text-ink-900">{tauxPct(impositionRecomposee)}</strong>
        {!dejaApplique && (
          <span className="mt-2 block text-xs leading-relaxed text-ink-400">
            {s.patrimoineEcart(eur(h.patrimoine), pct(h.rendement, 1), tauxPct(h.imposition))}
          </span>
        )}
      </p>
    </div>
  );
}

function Revenu({ h, r }: { h: Hypotheses; r: Resultat }) {
  const t = useTextes();
  const { eur, pct, points, eurSigne, tauxPct } = useFormats();
  const s = t.synthese;
  return (
    <div className="flex h-full flex-col">
      <Titre>{s.revenuTitre}</Titre>
      <p className="max-w-3xl text-sm leading-relaxed text-ink-500">
        {s.revenuIntro(pct(h.retrait, 1), eur(h.patrimoine))}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
        <Chiffre label={s.labelRetraitBrut} valeur={eur(r.retraitBrut)} />
        <Chiffre label={`${s.labelImpots} (${tauxPct(h.imposition)})`} valeur={eur(r.impots)} />
        <Chiffre label={s.labelRevenuAn} valeur={eur(r.revenuNetAnnuel)} />
        <Chiffre label={t.synthese.labelRevenuMois} valeur={eur(r.revenuNetMensuel)} accent />
      </dl>

      <p className="mt-auto pt-8 text-sm leading-relaxed text-ink-500">
        {s.revenuMarge(points(r.marge), eurSigne(r.variationCapital))}
      </p>
    </div>
  );
}

function ProjectionVolet({
  h,
  projection,
  niveau,
}: {
  h: Hypotheses;
  projection: Projection;
  niveau: Niveau;
}) {
  const t = useTextes();
  const { eur } = useFormats();
  const s = t.synthese;

  const epuisement = projection.anneeEpuisement ?? projection.anneesTenues + 1;
  const phrase = {
    'sans-patrimoine': s.projectionSans,
    preserve: s.projectionPreserve(eur(projection.capitalFinal)),
    suffisant: s.projectionSuffisant(projection.anneesTenues, h.dureeExigee, epuisement),
    insuffisant: s.projectionInsuffisant(projection.anneesTenues, h.dureeExigee, epuisement),
  }[niveau];

  return (
    <div className="flex h-full flex-col">
      <Titre>{s.projectionTitre(h.horizon)}</Titre>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
        <Chiffre
          label={s.labelAnneesTenues}
          valeur={`${projection.anneesTenues} ${s.ans}`}
        />
        <Chiffre label={s.labelDureeVoulue} valeur={`${h.dureeExigee} ${s.ans}`} />
        <Chiffre label={s.labelCapitalCourant} valeur={eur(projection.capitalFinal)} accent />
        <Chiffre label={s.labelCapitalReel} valeur={eur(projection.capitalFinalReel)} />
      </dl>

      <p className="mt-auto pt-8 text-sm leading-relaxed text-ink-500">{phrase}</p>
    </div>
  );
}

function Repartition({
  h,
  r,
  niveau,
}: {
  h: Hypotheses;
  r: Resultat;
  niveau: Niveau;
}) {
  const t = useTextes();
  const { eur, pct, points } = useFormats();
  const s = t.synthese;

  const brut = r.retraitBrut;
  const parts = [
    { label: s.partNet, montant: r.revenuNetAnnuel, poche: true },
    { label: s.partImpots, montant: r.impots, poche: false },
  ];
  const couvert = (r.ecartDepenses ?? 0) >= 0;

  return (
    <div className="flex h-full flex-col">
      <Titre>{s.repartitionTitre}</Titre>
      <p className="max-w-3xl text-sm leading-relaxed text-ink-500">
        {s.repartitionIntro(eur(brut))}
      </p>

      <div className="mt-6 flex-1 space-y-4">
        {parts.map((part) => {
          const p = brut > 0 ? part.montant / brut : 0;
          return (
            <div key={part.label}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className={part.poche ? 'font-semibold text-ink-900' : 'text-ink-600'}>
                  {part.label}
                </span>
                <span className="tabular shrink-0 font-semibold text-ink-900">
                  {eur(part.montant)}{' '}
                  <span className="font-normal text-ink-400">({pct(p, 0)})</span>
                </span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-ink-100">
                <div
                  className={part.poche ? 'h-full bg-brand-500' : 'h-full bg-ink-300'}
                  style={{ width: `${Math.min(100, p * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-sm leading-relaxed text-ink-500">
        {s.repartitionNote(
          eur(r.revenuNetAnnuel),
          pct(brut > 0 ? r.revenuNetAnnuel / brut : 0, 0),
        )}
      </p>

      {niveau !== 'sans-patrimoine' && h.retrait > 0 && !r.preserveEnReel && (
        <p className="mt-3 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
          <strong className="font-semibold text-ink-900">{s.reelFort}</strong>{' '}
          {s.reelCorps(points(-r.margeReelle))}
        </p>
      )}

      {r.ecartDepenses !== null && (
        <p className="mt-3 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
          <strong className="font-semibold text-ink-900">
            {couvert ? s.trainCouvertFort : s.trainManqueFort}
          </strong>{' '}
          {s.trainCorps(
            eur(Math.abs(r.ecartDepenses) / 12),
            eur(h.depensesCibles / 12),
            couvert,
          )}
        </p>
      )}
    </div>
  );
}
