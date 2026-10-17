import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Renders the share card, `scripts/og.html`, into `public/og.png`.
 *
 * Slack, LinkedIn and the messaging apps read the Open Graph tags of
 * `index.html` and display the image they name. They do not run the app's
 * JavaScript and do not accept SVG, hence a PNG drawn once, at authoring time,
 * and committed — like the formulas, the card only changes when its copy does.
 *
 * A headless Chrome takes the screenshot at exactly 1200 × 630. Set `CHROME` to
 * its binary; otherwise the usual macOS installs and Playwright's cache are
 * tried.
 *
 *     npm run og
 */

const source = fileURLToPath(new URL('./og.html', import.meta.url));
const destination = fileURLToPath(new URL('../public/og.png', import.meta.url));

function trouverChrome(): string {
  if (process.env.CHROME) return process.env.CHROME;
  const candidats = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ];
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  if (existsSync(cache)) {
    for (const dossier of readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
      candidats.push(
        join(
          cache,
          dossier,
          'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        ),
      );
    }
  }
  const trouve = candidats.find((c) => existsSync(c));
  if (!trouve) throw new Error('og: no Chrome found — set CHROME to its binary');
  return trouve;
}

execFileSync(
  trouverChrome(),
  [
    '--headless',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
    // Leaves time for the web font to arrive before the shot.
    '--virtual-time-budget=5000',
    `--screenshot=${destination}`,
    `file://${source}`,
  ],
  { stdio: 'inherit' },
);

console.log(`Carte de partage rendue dans ${destination}`);
