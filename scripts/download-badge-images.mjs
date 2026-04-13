/**
 * download-badge-images.mjs
 *
 * Downloads a Twemoji PNG for every badge and saves it to
 * public/images/badges/{badge_id}.png
 *
 * Sources tried in order:
 *   1. cdnjs Twemoji 14.0.2 (72×72)
 *   2. Same URL without the variation-selector suffix (-fe0f / -fe0e)
 *   3. Noto Color Emoji 72px PNG from the GitHub repo
 *
 * Usage:
 *   node scripts/download-badge-images.mjs
 */

import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
import { get as httpsGet } from 'https';
import { get as httpGet  } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = join(__dirname, '..', 'public', 'images', 'badges');

mkdirSync(OUT_DIR, { recursive: true });

// ─── Badge → emoji mapping ────────────────────────────────────────────────────
const BADGES = [
  // Toy Story
  { id: 'badge_woody',           emoji: '🤠' },
  { id: 'badge_buzz',            emoji: '🚀' },
  { id: 'badge_alien',           emoji: '👽' },
  { id: 'badge_forky',           emoji: '🍴' },
  { id: 'badge_bo_peep',         emoji: '🐑' },
  { id: 'badge_buzz_helmet',     emoji: '🛡️' },
  { id: 'badge_andy_footprint',  emoji: '👟' },
  { id: 'badge_rocket_ship',     emoji: '🛸' },
  // Monsters Inc
  { id: 'badge_sulley',          emoji: '🐾' },
  { id: 'badge_mike',            emoji: '👁️' },   // use eye instead of green circle
  { id: 'badge_boo',             emoji: '🩷' },
  { id: 'badge_scare_door',      emoji: '🚪' },
  { id: 'badge_one_eye_symbol',  emoji: '👁️' },
  { id: 'badge_mu_emblem',       emoji: '🎓' },
  { id: 'badge_scream_canister', emoji: '⚡' },
  { id: 'badge_sulley_tail',     emoji: '🦎' },
  // Finding Nemo
  { id: 'badge_nemo',            emoji: '🐠' },
  { id: 'badge_marlin',          emoji: '🐡' },
  { id: 'badge_dory',            emoji: '🐟' },
  { id: 'badge_gill',            emoji: '🦈' },
  { id: 'badge_crush',           emoji: '🐢' },
  { id: 'badge_whale_speak',     emoji: '🐋' },
  { id: 'badge_coral_reef',      emoji: '🪸' },
  // Incredibles
  { id: 'badge_mr_incredible',   emoji: '💪' },
  { id: 'badge_elastigirl',      emoji: '✨' },
  { id: 'badge_violet',          emoji: '🫧' },
  { id: 'badge_dash',            emoji: '💨' },
  { id: 'badge_jack_jack',       emoji: '🔥' },
  { id: 'badge_incredibles_logo',emoji: '🦸' },
  { id: 'badge_frozone_symbol',  emoji: '❄️' },
  { id: 'badge_super_car',       emoji: '🏎️' },
  // Cars
  { id: 'badge_mcqueen',         emoji: '⚡' },
  { id: 'badge_mater',           emoji: '🔧' },
  { id: 'badge_sally',           emoji: '🩵' },
  { id: 'badge_doc_hudson',      emoji: '🏁' },
  { id: 'badge_piston_cup',      emoji: '🏆' },
  { id: 'badge_95',              emoji: '🏅' },
  { id: 'badge_radiator_springs',emoji: '🛣️' },
  // Ratatouille
  { id: 'badge_remy',            emoji: '🐀' },
  { id: 'badge_linguini',        emoji: '👨‍🍳' },
  { id: 'badge_chef_hat',        emoji: '🍳' },
  { id: 'badge_french_dish',     emoji: '🍽️' },
  { id: 'badge_eiffel_tower',    emoji: '🗼' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert an emoji string to a hex code-point string (e.g. '1f920' or '1f468-200d-1f373') */
function emojiToHex(emoji) {
  const hex = [];
  for (const ch of emoji) {
    hex.push(ch.codePointAt(0).toString(16));
  }
  return hex.join('-');
}

/** Strip variation-selector suffixes (-fe0f, -fe0e) from the end of a codepoint string */
function stripVariation(code) {
  return code.replace(/(?:-fe0[ef])+$/i, '');
}

/** Build CDN URL list to try in priority order */
function buildUrls(emoji) {
  const full = emojiToHex(emoji);
  const bare = stripVariation(full);

  const TWEMOJI = 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72';
  const NOTO_BASE = 'https://raw.githubusercontent.com/googlefonts/noto-emoji/main/png/72';

  // Noto uses underscore separator and 'emoji_u' prefix
  const notoCode = full.split('-').join('_');
  const notoBare = bare.split('-').join('_');

  const urls = [];

  // 1. Twemoji with full code (including fe0f / fe0e / 200d)
  urls.push(`${TWEMOJI}/${full}.png`);

  // 2. Twemoji without variation selector at the end
  if (bare !== full) urls.push(`${TWEMOJI}/${bare}.png`);

  // 3. Noto Emoji with full code
  urls.push(`${NOTO_BASE}/emoji_u${notoCode}.png`);

  // 4. Noto Emoji without variation selector
  if (notoBare !== notoCode) urls.push(`${NOTO_BASE}/emoji_u${notoBare}.png`);

  return urls;
}

/** Download a URL to a file. Returns true on success, false on 404/error. */
function downloadTo(url, destPath) {
  return new Promise((resolve) => {
    const get = url.startsWith('https') ? httpsGet : httpGet;

    get(url, { timeout: 10_000 }, (res) => {
      // Follow redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        downloadTo(res.headers.location, destPath).then(resolve);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        resolve(false);
        return;
      }

      const out = createWriteStream(destPath);
      pipeline(res, out)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    }).on('error', () => resolve(false))
      .on('timeout', function () { this.destroy(); resolve(false); });
  });
}

/** Try each URL in order until one succeeds. Returns true if any succeeded. */
async function tryDownload(urls, destPath) {
  for (const url of urls) {
    const ok = await downloadTo(url, destPath);
    if (ok) return { ok: true, url };
  }
  return { ok: false };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
let ok = 0, failed = 0;

for (const badge of BADGES) {
  const destPath = join(OUT_DIR, `${badge.id}.png`);

  // Skip if already downloaded
  if (existsSync(destPath)) {
    console.log(`  skip  ${badge.id}.png (already exists)`);
    ok++;
    continue;
  }

  const urls  = buildUrls(badge.emoji);
  const result = await tryDownload(urls, destPath);

  if (result.ok) {
    console.log(`✓  ${badge.id}.png  ← ${result.url}`);
    ok++;
  } else {
    console.warn(`✗  ${badge.id}.png  — all ${urls.length} URLs failed`);
    console.warn(`   Tried: ${urls.join('\n         ')}`);
    failed++;
  }
}

console.log(`\nDone: ${ok} ok, ${failed} failed`);
if (failed > 0) process.exit(1);
