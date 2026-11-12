#!/usr/bin/env node
/* Render coloring pages to PNG so the line art can be checked by eye (macOS).
   Usage: node tools/render.js <outDir> [categoryId]
   Writes <outDir>/png/<category>-<id>.png (one per page) and <outDir>/sheet-<category|all>.png. */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
global.window = {};
require(path.join(root, 'js/art-kit.js'));
for (const f of fs.readdirSync(path.join(root, 'js/pages')).sort()) {
  if (f.endsWith('.js')) require(path.join(root, 'js/pages', f));
}
window.Art.finalize();
const out = path.resolve(process.argv[2] || 'render-out');
const only = process.argv[3];
const svgDir = path.join(out, 'svg'), pngDir = path.join(out, 'png');
fs.mkdirSync(svgDir, { recursive: true }); fs.mkdirSync(pngDir, { recursive: true });
const files = [];
for (const p of window.ColorPages.list) {
  if (!p.category || (only && p.category !== only)) continue;
  // QuickLook thumbnails are square, so pad the 4:3 page into a square with a frame.
  const sq = p.svg
    .replace(/width="1600" height="1200" viewBox="0 0 1600 1200">/,
      'width="1600" height="1600" viewBox="0 -200 1600 1600"><rect x="0" y="-200" width="1600" height="1600" fill="#fff"/>' +
      '<rect x="4" y="4" width="1592" height="1192" fill="none" stroke="#ccc" stroke-width="8"/>');
  const f = path.join(svgDir, `${p.category}-${p.id}.svg`);
  fs.writeFileSync(f, sq);
  files.push(f);
}
if (files.length) {
  execFileSync('qlmanage', ['-t', '-s', '800', '-o', pngDir, ...files], { stdio: 'ignore' });
  const pngs = files.map(f => path.join(pngDir, path.basename(f) + '.png')).filter(fs.existsSync);
  const sheet = path.join(out, `sheet-${only || 'all'}.png`);
  execFileSync('magick', ['montage', ...pngs, '-crop', '800x600+0+100', '+repage', '-tile', '3x', '-geometry', '533x400+6+6',
    sheet]);
  console.log('sheet: ' + sheet);
}
console.log(`rendered ${files.length} pages\n` +
  window.ColorPages.categories.map(c => `${c.id}:${c.pages.length}`).join(' '));
