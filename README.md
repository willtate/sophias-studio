# Sophia's Studio

An ad-free, upsell-free coloring app for iPad. Built as an installable web app (PWA) so it runs on
**iPadOS 15 and up**, works offline once installed, and needs no App Store.

## What's in it

- **54 coloring pages in 9 groups**: Animals, Fairy Tales, Vehicles, Robots, Space, Silly Monsters, Under the Sea,
  Garden & Bugs, Yummy Treats. Plus a blank **Draw** page for free drawing.
- **Tools**: pencil, crayon, marker, spray paint, paint bucket, stamps (star/heart/flower/dot), eraser.
- **11 curated colours** plus a **rainbow** colour that works with every tool. The bucket fills a rainbow gradient.
- Tap the tool you're holding to change its size (or stamp shape). Undo (8 steps). Hold the bin (under the colours) for about a second to start over, so a stray tap can't wipe a picture.
- Every page **saves automatically** on the device, and the gallery shows progress.
- The yellow camera button opens the iPad share sheet, so the picture can be saved to Photos.
- **Apple Pencil**: pressure-sensitive pencil and crayon. Once the Pencil is used, finger and palm touches on the page are ignored.
- No network calls, no tracking, no accounts.

## Run it locally

```bash
python3 -m http.server 8737 --directory color-studio
```

Then open `http://<your-mac's-name>.local:8737` on the iPad (same Wi-Fi). For offline use and a
proper full-screen home-screen app it must be served over **HTTPS**: any static host works
(GitHub Pages, Netlify, Cloudflare Pages). Then in Safari tap **Share → Add to Home Screen**.

When you ship changes, bump `VERSION` in `sw.js` so installed copies update.

## Native app later

Xcode is not installed on this Mac yet. To publish it as a native app (or install it with a free
Apple ID), wrap this folder in a `WKWebView` app targeting iOS 15. The code avoids APIs newer than
Safari 15 (no OffscreenCanvas, no `Array.at`, no `structuredClone`).

## Layout

| File | Purpose |
|---|---|
| `index.html`, `css/app.css` | UI: gallery, then studio with tools on the left and colours on the right (portrait: tools on top, colours at the bottom) |
| `js/art-kit.js` | Drawing helpers, the list of groups, and the page registry |
| `js/pages/*.js` | One file per group of line-art pages, drawn as SVG with closed outlines so the bucket fills cleanly |
| `tools/render.js` | `node tools/render.js <outDir> [group]` renders pages to PNG contact sheets for checking (macOS) |
| `js/fill.js` | Scanline flood fill bounded by line art and existing paint, with 2px edge growth so no white halos are left |
| `js/app.js` | Gallery, tools, input, undo, autosave, export |
| `js/store.js` | IndexedDB storage for saved pictures |
| `sw.js`, `manifest.webmanifest` | Offline cache and home-screen install |

## Improving it with the gauntlet loop

See [GAUNTLET.md](GAUNTLET.md). The `gauntlet-loop` skill (CC BY 4.0, RoboNuggets) is installed in
`.claude/skills/`.
