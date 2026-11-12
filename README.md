# Sophia's Studio

An ad-free, upsell-free coloring app for iPad. Built as an installable web app (PWA) so it runs on
**iPadOS 15 and up**, works offline once installed, and needs no App Store.

## What's in it

- **54 coloring pages in 9 groups**: Animals, Fairy Tales, Vehicles, Robots, Space, Silly Monsters, Under the Sea,
  Garden & Bugs, Yummy Treats. Plus a blank **Draw** page for free drawing.
- **Letters & Words**: trace-the-letter pages for A to Z (capital and small letter, numbered green start dots and
  arrows for stroke order). Each letter is said aloud when it's traced; finishing both says "A is for apple" and
  pops a matching sticker. The first page traces her name (set `NAME` in `js/pages/letters.js`).
- **Scratch Art**: four black pages (rainbow, galaxy, gold, candy) where every pen scratches away the black.
- **Talking stickers**: stickers show their word underneath ("cat") and say it; tap the word to hear it again.
  The sticker picker has a ✍️ name sticker for signing pictures, and a 🐱 cat button to turn the words off.
- **Tools**: pencil, crayon, marker, glitter, neon, spray paint, paint bucket, stamps, stickers, letters, eraser.
- **Paint bucket** fills the whole shape between the outlines, even over crayon already in it (on the blank page it fills by colour instead).
- **Stamps**: tap the stamp tool to pick a size, a shape in the current colour (star, heart, flower, dot) or one of 74 emoji.
- **11 curated colours** plus a **rainbow** colour that works with every tool (the bucket fills a rainbow gradient).
  The dotted swatch under the rainbow opens **66 more colours**: 11 hues in 5 shades, skin tones and greys.
- Tap the tool you're holding to change its size (or stamp shape). Undo (30 steps) and redo. Hold the bin (under the colours) for about a second to start over, so a stray tap can't wipe a picture.
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

## Hosted version (Home Screen app)

Live at https://little-color-studio.netlify.app (Netlify project `little-color-studio`). It isn't
listed anywhere and tells search engines not to index it. Only the app's own files are uploaded.

On the iPad, open it in Safari, then Share > Add to Home Screen. The first visit saves the whole app
for offline use. Drawings stay on the iPad.

To publish changes: bump `VERSION` in `sw.js`, run `tools/build-web.sh`, then deploy `dist/` to the
Netlify project. The build writes `version.json` from that `VERSION`. Each time the app opens or comes back
to the front it asks the server for `version.json`; if the server has a newer version it downloads it in the
background and switches over when it won't interrupt anything: straight away on the home screen ("New things
are here!"), otherwise when she goes back home or the app is put away (the drawing is saved first). Offline,
or if the server doesn't answer within 6 seconds, it just keeps using the copy it has. The native app is
not affected: it uses the files built into it.

## iPad app

`ios/SophiasStudio.xcodeproj` is a native iPad app (iPadOS 15 and later) that runs the same web code
offline from inside the app. A build step copies `index.html`, `css/`, `js/` and `icons/` into the app,
so edit the web files as usual and rebuild.

To put it on an iPad:

1. Open `ios/SophiasStudio.xcodeproj` in Xcode.
2. Select the **SophiasStudio** target, then **Signing & Capabilities**, and pick your Team
   (a free Apple ID works). If Xcode says the bundle ID is taken, change `local.sophia.studio` to
   something of your own.
3. Plug in the iPad (turn on Developer Mode on it when asked), choose it as the run destination and press Run.

With a free Apple ID the app stops opening after 7 days and needs another Run from Xcode. A paid
developer account gives a year and allows TestFlight.

What the app adds over the web version: no Safari bars, no status bar, edge swipes need a second
swipe so drawing near the edge doesn't leave the app, and the save button opens the iPad share sheet
(Save Image goes to Photos). Drawings are kept in the app's own storage.

Simulator build from the command line:

```bash
cd ios && xcodebuild -project SophiasStudio.xcodeproj -scheme SophiasStudio -destination 'platform=iOS Simulator,name=iPad (A16)' -derivedDataPath build build
```

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
| `ios/` | Native iPad wrapper: Swift `WKWebView` app that serves the web files from the bundle at `studio://app/` |

## Improving it with the gauntlet loop

See [GAUNTLET.md](GAUNTLET.md). The `gauntlet-loop` skill (CC BY 4.0, RoboNuggets) is installed in
`.claude/skills/`.
