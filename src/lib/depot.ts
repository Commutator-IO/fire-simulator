/**
 * Links back to the source repository.
 *
 * A report is only actionable if it carries the exact simulation — a verdict
 * that looks wrong almost always depends on the four parameters behind it —
 * hence the prefilled body.
 */

export const DEPOT = 'https://github.com/Commutator-IO/fire-simulator';

export const LIEN_ISSUES = `${DEPOT}/issues`;

/**
 * URL of a new issue, prefilled with a template. `lienSimulation` is the
 * shareable link of the simulation being viewed, so the report reproduces
 * without the reporter having to describe their inputs.
 */
export function lienNouvelleIssue(lienSimulation?: string): string {
  const corps = [
    "### Ce que j'observe",
    '',
    '',
    '',
    '### Ce que j’attendais',
    '',
    '',
    '',
    ...(lienSimulation ? ['### Simulation concernée', '', lienSimulation, ''] : []),
    '### Source',
    '',
    'Si une hypothèse ou une formule est en cause, merci d’indiquer la',
    'référence sur laquelle vous vous appuyez.',
  ].join('\n');

  const params = new URLSearchParams({ title: '', body: corps });
  return `${DEPOT}/issues/new?${params.toString()}`;
}
