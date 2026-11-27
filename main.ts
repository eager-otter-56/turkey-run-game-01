// Gobble Run! — hand-in program for the make.fun turkey-run-game-01 bounty.
// Node 22, standard library only. Copies the static game in game/ and the
// maker's screenshots in screenshots/ into the output directory, then writes
// dossier.json with the vendored make.fun library so the judge receives the
// exact summary the gate recomputes. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

const shotsSource = join(repoRoot, 'screenshots');
const shotsTarget = join(outputDir, 'screenshots');
mkdirSync(shotsTarget, { recursive: true });
if (existsSync(shotsSource)) {
  cpSync(shotsSource, shotsTarget, { recursive: true });
}

// Caps mirror the gate: at most 4 screenshots of 256 KiB each, at most 993
// entries and 48 MiB under game/, paths of at most 1000 bytes, and a dossier
// text budget of 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
