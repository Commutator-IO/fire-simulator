import { useFormats, useTextes } from '../lib/contexte';
import type { Proportions as Vue } from '../lib/patrimoine';

/**
 * Where you stand today, in two bars.
 *
 * Not one bar but two, because a debt and a tax bill are not the same kind of
 * thing: €150,000 owed to a bank is a stock, €2,450 of property tax is a flow.
 * Laid side by side on a single scale the tax would be an invisible sliver, and
 * the comparison would say nothing. So the balance sheet is weighed against
 * itself, and the year against itself.
 */

type Part = { cle: string; libelle: string; couleur: string; montant: number };

function Barre({
  titre,
  total,
  libelleTotal,
  parts,
}: {
  titre: string;
  total: number;
  libelleTotal: string;
  parts: Part[];
}) {
  const { eur, pct } = useFormats();
  // Les parts remplissent la barre même quand elles dépassent le total : si les
  // intérêts et les impôts mangent plus que le patrimoine ne produit, la barre
  // le montre pleine plutôt que de déborder en silence.
  const echelle = Math.max(
    1,
    parts.reduce((somme, p) => somme + Math.max(0, p.montant), 0),
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-medium text-ink-900">{titre}</h3>
        <p className="text-sm text-ink-500">
          <span className="tabular font-medium text-ink-900">{eur(total)}</span>{' '}
          {libelleTotal}
        </p>
      </div>

      <div className="mt-3 flex h-8 gap-0.5 overflow-hidden rounded-lg">
        {parts.map((p) => (
          <div
            key={p.cle}
            className="min-w-0.5 first:rounded-l-lg last:rounded-r-lg"
            style={{
              width: `${((Math.max(0, p.montant) / echelle) * 100).toFixed(2)}%`,
              backgroundColor: p.couleur,
            }}
            title={`${p.libelle} — ${eur(p.montant)}`}
          />
        ))}
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        {parts.map((p) => (
          <div key={`legende-${p.cle}`} className="flex items-baseline gap-2">
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 self-start rounded-sm"
              style={{ backgroundColor: p.couleur }}
            />
            <div>
              <dt className="text-sm text-ink-600">{p.libelle}</dt>
              <dd className="tabular text-sm font-medium text-ink-900">
                {eur(p.montant)}
                <span className="ml-1.5 font-normal text-ink-400">
                  {pct(total > 0 ? p.montant / total : 0, 1)}
                </span>
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Proportions({ vue }: { vue: Vue }) {
  const t = useTextes();

  return (
    <div className="grid gap-10 sm:gap-12">
      <Barre
        titre={t.proportions.bilan}
        total={vue.brut}
        libelleTotal={t.proportions.brut}
        parts={[
          {
            cle: 'net',
            libelle: t.proportions.net,
            couleur: 'var(--color-ink-900)',
            montant: vue.net,
          },
          {
            cle: 'dettes',
            libelle: t.proportions.dettes,
            couleur: 'var(--color-brique-500)',
            montant: vue.dettes,
          },
        ]}
      />

      <Barre
        titre={t.proportions.annee}
        total={vue.revenusBruts}
        libelleTotal={t.proportions.revenusBruts}
        parts={[
          {
            cle: 'reste',
            libelle: t.proportions.reste,
            couleur: 'var(--color-brand-500)',
            montant: vue.reste,
          },
          {
            cle: 'interets',
            libelle: t.proportions.interets,
            couleur: 'var(--color-brique-200)',
            montant: vue.interets,
          },
          {
            cle: 'impots',
            libelle: t.proportions.impots,
            couleur: 'var(--color-brique-500)',
            montant: vue.impotsDetention,
          },
        ]}
      />
    </div>
  );
}
