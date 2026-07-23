import { useFormats, useTextes, useTraduire } from '../lib/contexte';
import { patrimoineRequis, simuler, type Hypotheses } from '../lib/fire';
import { PAYS, regimeCorrespondant, type ClePays, type Regime } from '../lib/pays';

/**
 * The same plan, seen from each country of residence.
 *
 * Everything else on the page is held constant — capital, return, withdrawal
 * rate — and only the tax regime moves. What the table shows is therefore the
 * cost of residence alone, which is the one question a comparison across
 * countries can honestly answer.
 */
export function Comparaison({
  h,
  onRegime,
}: {
  h: Hypotheses;
  onRegime: (pays: ClePays, regime: Regime) => void;
}) {
  const t = useTextes();
  const tr = useTraduire();
  const { eur, eurSigne, tauxPct } = useFormats();

  const courant = simuler(h);
  const actif = regimeCorrespondant(h.pays, h.imposition);
  const avecObjectif = h.depensesCibles > 0;

  const revenuDe = (regime: Regime) =>
    simuler({ ...h, imposition: regime.imposition }).revenuNetAnnuel;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <caption className="sr-only">{t.comparaison.caption}</caption>
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
              <th scope="col" className="px-5 py-3 font-medium">
                {t.comparaison.colEnveloppe}
              </th>
              <th scope="col" className="px-5 py-3 text-right font-medium">
                {t.comparaison.colImposition}
              </th>
              <th scope="col" className="px-5 py-3 text-right font-medium">
                {t.comparaison.colRevenuAnnuel}
              </th>
              <th scope="col" className="px-5 py-3 text-right font-medium">
                {t.comparaison.colParMois}
              </th>
              <th scope="col" className="px-5 py-3 text-right font-medium">
                {avecObjectif
                  ? t.comparaison.colPatrimoineNecessaire
                  : t.comparaison.colEcartMensuel}
              </th>
            </tr>
          </thead>

          {PAYS.map((p) => (
            <tbody key={p.cle}>
              <tr className="border-b border-ink-100 bg-ink-50">
                <th
                  scope="colgroup"
                  colSpan={5}
                  className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500"
                >
                  {tr(p.libelle)}
                </th>
              </tr>
              {p.regimes.map((regime) => {
                const revenu = revenuDe(regime);
                const ecart = revenu - courant.revenuNetAnnuel;
                const requis = patrimoineRequis(
                  h.depensesCibles,
                  h.retrait,
                  regime.imposition,
                );
                const estActif = actif?.cle === regime.cle;
                return (
                  <tr
                    key={regime.cle}
                    className={[
                      'border-b border-ink-100 transition last:border-0',
                      estActif ? 'bg-brand-50' : 'hover:bg-ink-50',
                    ].join(' ')}
                  >
                    <th scope="row" className="px-5 py-3 text-left font-normal">
                      <button
                        type="button"
                        onClick={() => onRegime(p.cle, regime)}
                        className="text-left"
                      >
                        <span
                          className={[
                            'font-semibold',
                            estActif ? 'text-brand-700' : 'text-ink-900',
                          ].join(' ')}
                        >
                          {tr(regime.libelle)}
                        </span>
                        {estActif && (
                          <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                            {t.comparaison.votreSituation}
                          </span>
                        )}
                        <span className="mt-0.5 block max-w-md text-xs leading-relaxed text-ink-500">
                          {tr(regime.composition)}
                        </span>
                      </button>
                    </th>
                    <td className="tabular px-5 py-3 text-right align-top text-ink-600">
                      {tauxPct(regime.imposition)}
                    </td>
                    <td className="tabular px-5 py-3 text-right align-top font-semibold text-ink-900">
                      {eur(revenu)}
                    </td>
                    <td className="tabular px-5 py-3 text-right align-top text-ink-600">
                      {eur(revenu / 12)}
                    </td>
                    <td className="tabular px-5 py-3 text-right align-top">
                      {avecObjectif ? (
                        <span className="text-ink-600">
                          {requis === null ? '—' : eur(requis)}
                        </span>
                      ) : (
                        <span
                          className={
                            Math.abs(ecart) < 1
                              ? 'text-ink-300'
                              : ecart > 0
                                ? 'text-jade-600'
                                : 'text-brique-600'
                          }
                        >
                          {Math.abs(ecart) < 1 ? '—' : eurSigne(ecart / 12)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>

      <p className="border-t border-ink-200/70 bg-ink-50 px-5 py-4 text-xs leading-relaxed text-ink-500">
        {t.comparaison.note}
      </p>
    </div>
  );
}
