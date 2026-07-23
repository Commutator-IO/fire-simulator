import { useFormats, useTextes } from '../lib/contexte';
import type { Hypotheses, Resultat } from '../lib/fire';

/**
 * The answer to the question the tool exists for, as one dominant banner.
 *
 * Three things are said, in decreasing order of importance: is the capital
 * preserved, how much that leaves per month, and whether it covers the life the
 * user actually wants. The colour split is reserved for the first one — the
 * only genuinely binary statement of the three — and it never carries the
 * meaning alone: the banner always spells out the answer in words.
 */

type Props = {
  h: Hypotheses;
  r: Resultat;
  /** Depletion year of the central scenario, when the plan breaks. */
  anneeEpuisement: number | null;
};

const HABILLAGE = {
  preserve: {
    fond: 'bg-jade-700',
    accent: 'text-jade-100',
    puce: 'bg-jade-600 text-white',
  },
  limite: {
    fond: 'bg-jade-800',
    accent: 'text-jade-100',
    puce: 'bg-jade-700 text-white',
  },
  entame: {
    fond: 'bg-brique-700',
    accent: 'text-brique-100',
    puce: 'bg-brique-600 text-white',
  },
  'sans-patrimoine': {
    fond: 'bg-ink-700',
    accent: 'text-ink-300',
    puce: 'bg-ink-600 text-white',
  },
} as const;

export function Verdict({ h, r, anneeEpuisement }: Props) {
  const t = useTextes();
  const { eur, points } = useFormats();
  const style = HABILLAGE[r.verdict];

  const badge = {
    preserve: t.verdict.badgeOui,
    limite: t.verdict.badgeOuiJuste,
    entame: t.verdict.badgeNon,
    'sans-patrimoine': t.verdict.badgePasEncore,
  }[r.verdict];

  const sousTitre = {
    preserve: t.verdict.sousTitrePreserve,
    limite: t.verdict.sousTitrePreserve,
    entame: t.verdict.sousTitreEntame,
    'sans-patrimoine': t.verdict.sousTitreSans,
  }[r.verdict];

  const corps = () => {
    switch (r.verdict) {
      case 'sans-patrimoine':
        return t.verdict.corpsSans;
      case 'preserve':
        return h.retrait === 0
          ? t.verdict.corpsSansRetrait
          : t.verdict.corpsPreserve(eur(r.variationCapital), points(r.marge));
      case 'limite':
        return t.verdict.corpsLimite;
      case 'entame':
        return `${t.verdict.corpsEntame(eur(-r.variationCapital))} ${
          anneeEpuisement !== null
            ? t.verdict.epuiseEn(anneeEpuisement)
            : t.verdict.pasEpuise
        }`;
    }
  };

  const couvert = (r.ecartDepenses ?? 0) >= 0;

  return (
    <div className={`${style.fond} px-6 py-7 text-white sm:px-8`}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span
          className={`${style.puce} rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide`}
        >
          {badge}
        </span>
        <p className={`text-sm ${style.accent}`}>{sousTitre}</p>
      </div>

      <p className={`mt-6 text-sm ${style.accent}`}>{t.verdict.revenuLabel}</p>
      <p className="tabular mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
        {eur(r.revenuNetMensuel)}
        <span className={`ml-2 align-baseline text-base font-normal ${style.accent}`}>
          {t.verdict.parMois}
        </span>
      </p>
      <p className={`mt-1.5 text-sm ${style.accent}`}>
        {t.verdict.soitParAn(eur(r.revenuNetAnnuel))}
      </p>

      <p className="mt-6 border-t border-white/20 pt-5 text-sm leading-relaxed">
        {corps()}
      </p>

      {/* The real-terms caveat is what turns a comfortable "yes" into a slow
          erosion, so it sits inside the banner rather than in a footnote. */}
      {r.verdict !== 'sans-patrimoine' && h.retrait > 0 && !r.preserveEnReel && (
        <p className="mt-3 rounded-xl bg-black/15 px-4 py-3 text-xs leading-relaxed">
          <strong className="font-semibold">{t.verdict.reelFort}</strong>{' '}
          {t.verdict.reelCorps(points(-r.margeReelle))}
        </p>
      )}

      {r.ecartDepenses !== null && (
        <p className="mt-3 rounded-xl bg-black/15 px-4 py-3 text-xs leading-relaxed">
          <strong className="font-semibold">
            {couvert ? t.verdict.trainCouvertFort : t.verdict.trainManqueFort}
          </strong>{' '}
          {t.verdict.trainCorps(
            eur(Math.abs(r.ecartDepenses) / 12),
            eur(h.depensesCibles / 12),
            couvert,
          )}
        </p>
      )}
    </div>
  );
}
