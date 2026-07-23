import { useState } from 'react';
import { useFormats, useTextes } from '../lib/contexte';
import type { Hypotheses, Projection, Resultat } from '../lib/fire';

function Ligne({
  label,
  montant,
  fort = false,
  negatif = false,
  note,
}: {
  label: string;
  montant: number;
  fort?: boolean;
  negatif?: boolean;
  note?: string;
}) {
  const { eur } = useFormats();
  return (
    <div
      className={[
        'flex items-baseline justify-between gap-4 py-2',
        fort ? 'border-t border-ink-200 pt-3 font-semibold text-ink-900' : 'text-ink-600',
      ].join(' ')}
    >
      <span className="text-sm">
        {label}
        {note && <span className="ml-1.5 text-xs text-ink-400">{note}</span>}
      </span>
      <span
        className={[
          'tabular shrink-0 text-sm',
          fort ? 'text-base' : '',
          negatif ? 'text-ink-500' : '',
        ].join(' ')}
      >
        {negatif ? `− ${eur(Math.abs(montant))}` : eur(montant)}
      </span>
    </div>
  );
}

function Bloc({
  titre,
  sousTitre,
  children,
}: {
  titre: string;
  sousTitre?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6">
      <h3 className="text-base font-semibold text-ink-900">{titre}</h3>
      {sousTitre && <p className="mt-0.5 mb-3 text-sm text-ink-400">{sousTitre}</p>}
      <div className={sousTitre ? '' : 'mt-3'}>{children}</div>
    </section>
  );
}

export function Detail({
  h,
  r,
  projection,
}: {
  h: Hypotheses;
  r: Resultat;
  projection: Projection;
}) {
  const t = useTextes();
  const { eur, eurSigne, pct, tauxPct } = useFormats();
  const [tableauOuvert, setTableauOuvert] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Bloc titre={t.detail.revenuTitre} sousTitre={t.detail.revenuSous}>
        <Ligne label={t.detail.patrimoineNet} montant={h.patrimoine} />
        <Ligne
          label={t.detail.retraitBrut}
          note={t.detail.duPatrimoine(pct(h.retrait, 1))}
          montant={r.retraitBrut}
        />
        <Ligne
          label={t.detail.impots}
          note={tauxPct(h.imposition)}
          montant={r.impots}
          negatif
        />
        <Ligne label={t.detail.revenuNetAnnuel} montant={r.revenuNetAnnuel} fort />
        <Ligne label={t.detail.revenuNetMensuel} montant={r.revenuNetMensuel} />
      </Bloc>

      <Bloc titre={t.detail.capitalTitre} sousTitre={t.detail.capitalSous}>
        <Ligne
          label={t.detail.rendementGenere}
          note={t.detail.duPatrimoine(pct(h.rendement, 1))}
          montant={r.rendementGenere}
        />
        <Ligne label={t.detail.retraitBrut} montant={r.retraitBrut} negatif />
        <div className="flex items-baseline justify-between gap-4 border-t border-ink-200 py-2 pt-3 font-semibold text-ink-900">
          <span className="text-sm">{t.detail.variationCapital}</span>
          <span
            className={[
              'tabular shrink-0 text-base',
              r.variationCapital >= 0 ? 'text-jade-600' : 'text-brique-600',
            ].join(' ')}
          >
            {eurSigne(r.variationCapital)}
          </span>
        </div>
        <p className="mt-3 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
          {t.detail.note}
        </p>
      </Bloc>

      {/* min-w-0: without it the grid item sizes itself on the table's minimum
          width, and the whole page scrolls sideways instead of the table. */}
      <div className="min-w-0 lg:col-span-2">
        <button
          type="button"
          onClick={() => setTableauOuvert((v) => !v)}
          className="text-sm font-medium text-brand-600 transition hover:text-brand-700"
          aria-expanded={tableauOuvert}
        >
          {tableauOuvert ? t.detail.masquerTableau : t.detail.afficherTableau}
        </button>

        {tableauOuvert && (
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <caption className="sr-only">{t.detail.caption}</caption>
              <thead>
                <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th scope="col" className="px-4 py-3 font-medium">
                    {t.detail.colAnnee}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    {t.detail.colCapitalDebut}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    {t.detail.colRendement}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    {t.detail.colRetraitBrut}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    {t.detail.colImpots}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    {t.detail.colRevenuNet}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    {t.detail.colCapitalFin}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    {t.detail.colReel}
                  </th>
                </tr>
              </thead>
              <tbody className="tabular">
                {projection.annees.map((a) => (
                  <tr
                    key={a.annee}
                    className={[
                      'border-b border-ink-100 last:border-0',
                      projection.anneeEpuisement !== null &&
                      a.annee >= projection.anneeEpuisement
                        ? 'bg-brique-50 text-brique-800'
                        : 'text-ink-600',
                    ].join(' ')}
                  >
                    <th scope="row" className="px-4 py-2 text-left font-medium text-ink-900">
                      {a.annee}
                    </th>
                    <td className="px-4 py-2 text-right">{eur(a.capitalDebut)}</td>
                    <td className="px-4 py-2 text-right">{eurSigne(a.rendement)}</td>
                    <td className="px-4 py-2 text-right">{eur(a.retraitBrut)}</td>
                    <td className="px-4 py-2 text-right">{eur(a.impots)}</td>
                    <td className="px-4 py-2 text-right font-medium text-ink-900">
                      {eur(a.retraitNet)}
                    </td>
                    <td className="px-4 py-2 text-right">{eur(a.capitalFin)}</td>
                    <td className="px-4 py-2 text-right text-ink-400">
                      {eur(a.capitalFinReel)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
