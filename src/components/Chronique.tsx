import { useMemo, useRef, useState } from 'react';
import { useFormats, useTextes } from '../lib/contexte';
import type { AnneeDetention } from '../lib/patrimoine';

/**
 * What becomes of a portfolio, year after year, and why.
 *
 * A single line showing net worth rising would say nothing about the forces
 * underneath it. Here the identity is drawn instead:
 *
 *     net(n) = net(0) + compounding + rents − interest − holding taxes
 *
 * so the two things that build the capital are stacked above the starting line
 * and the two that eat it hang below the total they would otherwise have
 * reached. The gap between the two boundaries is the whole cost of owning.
 */

const L = 64;
const R = 16;
const T = 16;
const B = 34;
const W = 720;
const H = 300;

function pasLisible(brut: number): number {
  if (brut <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(brut));
  const normalise = brut / magnitude;
  const palier = [1, 2, 2.5, 5, 10].find((p) => normalise <= p) ?? 10;
  return palier * magnitude;
}

type Couche = {
  cle: string;
  libelle: string;
  couleur: string;
  /** Height of the band, year by year. */
  hauteurs: number[];
  montants: number[];
};

export function Chronique({ annees }: { annees: AnneeDetention[] }) {
  const t = useTextes();
  const { eur, eurCompact, pct } = useFormats();
  const svgRef = useRef<SVGSVGElement>(null);
  const [survol, setSurvol] = useState<number | null>(null);

  const horizon = annees.length;
  const netInitial = annees[0]?.netInitial ?? 0;

  // Empilé du bas vers le haut : le capital de départ, ce qu'il a produit,
  // puis ce que la banque et le fisc ont repris sur ce total.
  const couches: Couche[] = useMemo(() => {
    const constante = (v: number) => annees.map(() => v);
    return [
      {
        cle: 'depart',
        libelle: t.chronique.depart,
        couleur: 'var(--color-ink-200)',
        hauteurs: constante(Math.max(0, netInitial)),
        montants: constante(netInitial),
      },
      {
        cle: 'gains',
        libelle: t.chronique.gains,
        couleur: 'var(--color-brand-400)',
        hauteurs: annees.map((a) => a.gainsCumules),
        montants: annees.map((a) => a.gainsCumules),
      },
      {
        cle: 'loyers',
        libelle: t.chronique.loyers,
        couleur: 'var(--color-brand-700)',
        hauteurs: annees.map((a) => a.loyersCumules),
        montants: annees.map((a) => a.loyersCumules),
      },
      {
        cle: 'interets',
        libelle: t.chronique.interets,
        couleur: 'var(--color-brique-200)',
        hauteurs: annees.map((a) => -a.interetsCumules),
        montants: annees.map((a) => -a.interetsCumules),
      },
      {
        cle: 'impots',
        libelle: t.chronique.impots,
        couleur: 'var(--color-brique-500)',
        hauteurs: annees.map((a) => -a.impotsCumules),
        montants: annees.map((a) => -a.impotsCumules),
      },
    ];
  }, [annees, netInitial, t]);

  const { x, y, aires, chemin, graduationsY, graduationsX } = useMemo(() => {
    // Le sommet de l'empilement positif, avant que les sorties ne le rabotent.
    const sommets = annees.map(
      (a) => Math.max(0, netInitial) + a.gainsCumules + a.loyersCumules,
    );
    const maxBrut = Math.max(1, ...sommets);
    const pasY = pasLisible(maxBrut / 4);
    const maxY = Math.ceil(maxBrut / pasY) * pasY;

    const x = (annee: number) => L + (annee / Math.max(1, horizon)) * (W - L - R);
    const y = (v: number) => T + (1 - v / maxY) * (H - T - B);

    /** Ribbon between two boundaries, drawn out along one and back along the other. */
    const ruban = (bas: number[], haut: number[]) => {
      const aller = haut
        .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
        .join(' ');
      const retour = bas
        .map((v, i) => ({ v, i }))
        .reverse()
        .map(({ v, i }) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`)
        .join(' ');
      return `${aller} ${retour} Z`;
    };

    // L'année 0 est le point de départ : rien n'a encore été gagné ni payé.
    const avecDepart = (valeurs: number[], depart: number) => [depart, ...valeurs];

    const aires: { cle: string; couleur: string; d: string }[] = [];
    let plancher = avecDepart(
      annees.map(() => 0),
      0,
    );
    for (const couche of couches) {
      const plafond = plancher.map(
        (v, i) => v + avecDepart(couche.hauteurs, couche.cle === 'depart' ? netInitial : 0)[i],
      );
      aires.push({ cle: couche.cle, couleur: couche.couleur, d: ruban(plancher, plafond) });
      plancher = plafond;
    }

    // `plancher` porte maintenant le patrimoine net : c'est la courbe à tracer.
    const chemin = plancher
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
      .join(' ');

    const graduationsY: number[] = [];
    for (let v = 0; v <= maxY + 1; v += pasY) graduationsY.push(v);

    const pasX = Math.max(1, pasLisible(horizon / 5));
    const graduationsX: number[] = [];
    for (let v = 0; v <= horizon; v += pasX) graduationsX.push(Math.round(v));

    return { x, y, aires, chemin, graduationsY, graduationsX };
  }, [annees, couches, netInitial, horizon]);

  const anneeSurvolee = survol ?? horizon;
  const courante = annees[anneeSurvolee - 1] ?? annees.at(-1)!;

  const anneeDepuisX = (clientX: number): number => {
    const svg = svgRef.current;
    if (!svg) return horizon;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.min(
      horizon,
      Math.max(1, Math.round(((ratio * W - L) / (W - L - R)) * horizon)),
    );
  };

  return (
    <figure className="m-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={t.chronique.aria(horizon)}
        onMouseMove={(e) => setSurvol(anneeDepuisX(e.clientX))}
        onMouseLeave={() => setSurvol(null)}
      >
        {graduationsY.map((v) => (
          <g key={v}>
            <line
              x1={L}
              x2={W - R}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-ink-200)"
              strokeDasharray="3 4"
            />
            <text
              x={L - 10}
              y={y(v) + 4}
              textAnchor="end"
              className="tabular"
              fontSize="11"
              fill="var(--color-ink-400)"
            >
              {eurCompact(v)}
            </text>
          </g>
        ))}

        {graduationsX.map((v, i) => (
          <text
            key={v}
            x={x(v)}
            y={H - B + 20}
            textAnchor={i === 0 ? 'start' : 'middle'}
            className="tabular"
            fontSize="11"
            fill="var(--color-ink-400)"
          >
            {v === 0 ? t.projection.aujourdhui : t.projection.an(v)}
          </text>
        ))}

        {aires.map((a) => (
          <path key={a.cle} d={a.d} fill={a.couleur} opacity="0.9" />
        ))}

        <path
          d={chemin}
          fill="none"
          stroke="var(--color-ink-900)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <line
          x1={x(anneeSurvolee)}
          x2={x(anneeSurvolee)}
          y1={T}
          y2={H - B}
          stroke="var(--color-ink-400)"
          strokeWidth="1"
        />
        <circle
          cx={x(anneeSurvolee)}
          cy={y(courante.patrimoineNet)}
          r="6"
          fill="var(--color-ink-900)"
          stroke="#fff"
          strokeWidth="2.5"
        />
      </svg>

      <figcaption className="mt-3 space-y-2 text-xs text-ink-500">
        <p className="font-medium text-ink-700">
          {t.projection.survolAnnee(anneeSurvolee)} —{' '}
          {t.chronique.survol(
            eur(courante.patrimoineNet),
            eur(courante.gainsCumules + courante.loyersCumules),
            eur(courante.interetsCumules + courante.impotsCumules),
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 shrink-0 rounded-full bg-ink-900" />
            {t.chronique.net}
          </span>
          {couches.map((c) => (
            <span key={`legende-${c.cle}`} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: c.couleur }}
              />
              {c.libelle}
              <span className="tabular text-ink-400">
                {eur(c.montants[anneeSurvolee - 1] ?? 0)}
              </span>
            </span>
          ))}
        </p>
        {courante.detteRestante > 0 && (
          <p>
            {t.chronique.detteRestante(
              eur(courante.detteRestante),
              pct(
                courante.patrimoineNet > 0
                  ? courante.detteRestante / courante.patrimoineNet
                  : 0,
                0,
              ),
            )}
          </p>
        )}
      </figcaption>
    </figure>
  );
}
