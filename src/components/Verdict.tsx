import { useFormats, useTextes } from '../lib/contexte';
import type { Hypotheses, Niveau, Projection, Resultat } from '../lib/fire';

/**
 * The answer to the question the tool exists for, as one dominant banner.
 *
 * Three things are said, in decreasing order of importance: how well the plan
 * holds, how much that leaves per month, and whether it covers the life the
 * user actually wants.
 *
 * The colour comes from the level, not from the nominal verdict, because "the
 * capital runs out" is not one situation but two: running out after the years
 * the user asked for is a plan, running out before them is a failure. Green,
 * orange and red say which, and never alone — the banner always spells the
 * answer out in words.
 */

type Props = {
  h: Hypotheses;
  r: Resultat;
  niveau: Niveau;
  /** Central scenario, which is the one the verdict is pronounced on. */
  projection: Projection;
};

const HABILLAGE: Record<Niveau, { fond: string; accent: string; puce: string }> = {
  preserve: {
    fond: 'bg-jade-700',
    accent: 'text-jade-100',
    puce: 'bg-jade-600 text-white',
  },
  suffisant: {
    fond: 'bg-brand-700',
    accent: 'text-brand-100',
    puce: 'bg-brand-600 text-white',
  },
  insuffisant: {
    fond: 'bg-brique-700',
    accent: 'text-brique-100',
    puce: 'bg-brique-600 text-white',
  },
  'sans-patrimoine': {
    fond: 'bg-ink-700',
    accent: 'text-ink-300',
    puce: 'bg-ink-600 text-white',
  },
};

export function Verdict({ h, r, niveau, projection }: Props) {
  const t = useTextes();
  const { eur, points } = useFormats();
  const style = HABILLAGE[niveau];

  const badge = {
    preserve: t.verdict.badgePreserve,
    suffisant: t.verdict.badgeSuffisant,
    insuffisant: t.verdict.badgeInsuffisant,
    'sans-patrimoine': t.verdict.badgePasEncore,
  }[niveau];

  const sousTitre = {
    preserve: t.verdict.sousTitrePreserve,
    suffisant: t.verdict.sousTitreSuffisant(h.dureeExigee),
    insuffisant: t.verdict.sousTitreInsuffisant(h.dureeExigee),
    'sans-patrimoine': t.verdict.sousTitreSans,
  }[niveau];

  const corps = () => {
    const epuisement = projection.anneeEpuisement;
    switch (niveau) {
      case 'sans-patrimoine':
        return t.verdict.corpsSans;
      case 'preserve':
        // Nothing runs out over the horizon, but the capital may still be
        // shrinking — the nominal verdict is what tells the two apart.
        if (h.retrait === 0) return t.verdict.corpsSansRetrait;
        if (r.verdict === 'entame')
          return t.verdict.corpsDeclinSansFin(eur(-r.variationCapital));
        if (r.verdict === 'limite') return t.verdict.corpsLimite;
        return t.verdict.corpsPreserve(eur(r.variationCapital), points(r.marge));
      case 'suffisant':
        return t.verdict.corpsSuffisant(
          projection.anneesTenues,
          h.dureeExigee,
          epuisement ?? projection.anneesTenues + 1,
        );
      case 'insuffisant':
        return t.verdict.corpsInsuffisant(
          projection.anneesTenues,
          h.dureeExigee,
          epuisement ?? projection.anneesTenues + 1,
        );
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
      {niveau !== 'sans-patrimoine' && h.retrait > 0 && !r.preserveEnReel && (
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
