import { ECART_SCENARIO } from '../lib/fire';
import { FORMULES } from '../lib/formules';
import { Latex } from './Latex';
import { useFormats, useTextes } from '../lib/contexte';
import type { Dictionnaire } from '../lib/textes';
import { DEPOT, LIEN_ISSUES, lienNouvelleIssue } from '../lib/depot';

/**
 * Method and sources.
 *
 * Only the addresses live here; the wording of each source sits in the
 * dictionary, keyed by the same identifier, so a translated page never falls
 * back to a French paragraph halfway down.
 */
const LIENS: { cle: keyof Dictionnaire['sources']['liste']; url: string; hote: string }[] = [
  {
    cle: 'bengen',
    url: 'https://obj.portfolioconstructionforum.edu.au/articles_perspectives/Determining-withdrawal-rates-using-historical-data.pdf',
    hote: 'portfolioconstructionforum.edu.au',
  },
  {
    cle: 'pfau',
    url: 'https://www.financialplanningassociation.org/sites/default/files/2021-10/DEC10%20JFP%20Pfau%20PDF.pdf',
    hote: 'financialplanningassociation.org',
  },
  {
    cle: 'pfu',
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2613',
    hote: 'service-public.gouv.fr',
  },
  {
    cle: 'pea',
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F22449',
    hote: 'service-public.gouv.fr',
  },
  {
    cle: 'assuranceVie',
    url: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F22414',
    hote: 'service-public.gouv.fr',
  },
  {
    cle: 'nta',
    url: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1463.htm',
    hote: 'nta.go.jp',
  },
  { cle: 'nisa', url: 'https://www.fsa.go.jp/policy/nisa2/', hote: 'fsa.go.jp' },
  {
    cle: 'epargneReglementee',
    url: 'https://presse.economie.gouv.fr/epargne-reglementee-le-livret-a-passe-a-17-et-le-lep-se-maintient-a-25-a-compter-du-1er-aout-2026/',
    hote: 'economie.gouv.fr',
  },
  {
    cle: 'bce',
    url: 'https://www.ecb.europa.eu/mopo/strategy/strategy-review/html/price-stability-objective.fr.html',
    hote: 'ecb.europa.eu',
  },
  { cle: 'boj', url: 'https://www.boj.or.jp/en/mopo/outline/target.htm', hote: 'boj.or.jp' },
];

export function Sources({ lienSimulation }: { lienSimulation: string }) {
  const t = useTextes();
  const { pct } = useFormats();

  return (
    <section id="methode" className="border-t border-ink-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
          {t.sources.titre}
        </h2>
        <p className="mt-2 max-w-3xl leading-relaxed text-ink-500">{t.sources.intro}</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <h3 className="text-base font-semibold text-ink-900">
              {t.sources.formulesTitre}
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              {FORMULES.map((f) => (
                <Formule
                  key={f.tex}
                  terme={t.sources[f.terme] as string}
                  tex={f.tex}
                  note={f.note ? (t.sources[f.note] as string) : undefined}
                />
              ))}
            </dl>
            <p className="mt-5 text-xs leading-relaxed text-ink-500">
              {t.sources.scenariosNote(pct(ECART_SCENARIO, 0))}
            </p>
          </div>

          <div className="card p-6 sm:p-8">
            <h3 className="text-base font-semibold text-ink-900">
              {t.sources.limitesTitre}
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-500">
              <Limite titre={t.sources.limiteVolatiliteFort}>
                {t.sources.limiteVolatilite}
              </Limite>
              <Limite titre={t.sources.limiteFiscaliteFort}>
                {t.sources.limiteFiscalite}
              </Limite>
              <Limite titre={t.sources.limitePaysFort}>{t.sources.limitePays}</Limite>
              <Limite titre={t.sources.limiteRevenusFort}>
                {t.sources.limiteRevenus}
              </Limite>
              <Limite titre={t.sources.limiteResidenceFort}>
                {t.sources.limiteResidence}
              </Limite>
            </ul>
          </div>
        </div>

        <ul className="mt-10">
          {LIENS.map(({ cle, url, hote }) => (
            <li key={cle} className="border-b border-ink-200/70 py-5 last:border-0">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-ink-900 transition hover:text-brand-700"
              >
                {t.sources.liste[cle].titre}
                <span className="ml-2 text-xs font-normal text-ink-400">{hote} ↗</span>
              </a>
              <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-500">
                {t.sources.liste[cle].detail}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a
            href={lienNouvelleIssue(lienSimulation)}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand-600 transition hover:text-brand-700"
          >
            {t.sources.signaler}
          </a>
          <a
            href={LIEN_ISSUES}
            target="_blank"
            rel="noreferrer"
            className="text-ink-500 transition hover:text-ink-900"
          >
            {t.sources.discussions}
          </a>
          <a
            href={DEPOT}
            target="_blank"
            rel="noreferrer"
            className="text-ink-500 transition hover:text-ink-900"
          >
            {t.sources.code}
          </a>
        </div>
      </div>
    </section>
  );
}

function Formule({
  terme,
  tex,
  note,
}: {
  terme: string;
  tex: string;
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-ink-500">{terme}</dt>
      <dd className="text-ink-900">
        <Latex tex={tex} />
        {note && <span className="ml-2 text-xs text-ink-400">({note})</span>}
      </dd>
    </div>
  );
}

function Limite({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <li>
      <strong className="font-semibold text-ink-800">{titre}</strong> {children}
    </li>
  );
}
