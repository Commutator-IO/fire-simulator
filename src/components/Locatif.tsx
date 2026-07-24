import { useFormats, useTextes } from '../lib/contexte';
import { AVenir } from './AVenir';

/**
 * A manager for a rental-property portfolio.
 *
 * Not built yet — this tab states the intent and shows the shape of the screen
 * to come. The figures below are an illustration, chosen to add up so the net
 * yield is checkable, never a live account.
 */

type Bien = {
  nom: string;
  /** Purchase value of the property. */
  valeur: number;
  /** Rent collected over the year. */
  loyer: number;
  /** Everything the year costs: tax, charges, management, vacancy. */
  charges: number;
  /** Outstanding loan against it. */
  credit: number;
  /** Yearly loan repayment. */
  annuite: number;
};

const BIENS: Bien[] = [
  { nom: 'Studio Lyon 7e', valeur: 165_000, loyer: 9_600, charges: 2_400, credit: 90_000, annuite: 6_000 },
  { nom: 'T2 Nantes', valeur: 210_000, loyer: 11_400, charges: 3_100, credit: 140_000, annuite: 8_400 },
  { nom: 'Parking Paris 15e', valeur: 32_000, loyer: 2_040, charges: 360, credit: 0, annuite: 0 },
];

export function Locatif() {
  const t = useTextes();
  const { eur, eurSigne, tauxPct } = useFormats();

  const lignes = BIENS.map((b) => {
    const net = b.loyer - b.charges;
    const cashflow = net - b.annuite;
    return { ...b, net, cashflow, rendement: b.valeur > 0 ? net / b.valeur : 0 };
  });
  const loyer = lignes.reduce((s, l) => s + l.loyer, 0);
  const net = lignes.reduce((s, l) => s + l.net, 0);
  const cashflow = lignes.reduce((s, l) => s + l.cashflow, 0);
  const valeur = lignes.reduce((s, l) => s + l.valeur, 0);

  const apercu = (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-400">
              <th className="px-4 py-3 text-left font-medium">{t.locatif.colBien}</th>
              <th className="px-4 py-3 text-right font-medium">{t.locatif.colLoyer}</th>
              <th className="px-4 py-3 text-right font-medium">{t.locatif.colCharges}</th>
              <th className="px-4 py-3 text-right font-medium">{t.locatif.colNet}</th>
              <th className="px-4 py-3 text-right font-medium">{t.locatif.colRendement}</th>
              <th className="px-4 py-3 text-right font-medium">{t.locatif.colCashflow}</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.nom} className="border-b border-ink-100 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-800">{l.nom}</td>
                <td className="tabular px-4 py-3 text-right text-ink-600">{eur(l.loyer)}</td>
                <td className="tabular px-4 py-3 text-right text-ink-600">− {eur(l.charges)}</td>
                <td className="tabular px-4 py-3 text-right text-ink-800">{eur(l.net)}</td>
                <td className="tabular px-4 py-3 text-right text-ink-600">{tauxPct(l.rendement)}</td>
                <td
                  className={`tabular px-4 py-3 text-right font-medium ${
                    l.cashflow >= 0 ? 'text-jade-600' : 'text-brique-600'
                  }`}
                >
                  {eurSigne(l.cashflow)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink-200 bg-ink-50 font-semibold text-ink-900">
              <td className="px-4 py-3">{t.locatif.total}</td>
              <td className="tabular px-4 py-3 text-right">{eur(loyer)}</td>
              <td className="px-4 py-3" />
              <td className="tabular px-4 py-3 text-right">{eur(net)}</td>
              <td className="tabular px-4 py-3 text-right">{tauxPct(valeur > 0 ? net / valeur : 0)}</td>
              <td
                className={`tabular px-4 py-3 text-right ${
                  cashflow >= 0 ? 'text-jade-600' : 'text-brique-600'
                }`}
              >
                {eurSigne(cashflow)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  return (
    <AVenir
      titre={t.locatif.titre}
      intro={t.locatif.intro}
      promesses={t.locatif.promesses}
      apercu={apercu}
    />
  );
}
