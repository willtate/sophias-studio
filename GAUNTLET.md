# Gauntlet loop for Sophia's Studio

The gauntlet loop improves the app by comparing it, blind, against a real best-in-class reference
and looping until a harsh critic picks ours. v1 is built and working, so the loop polishes it from
here.

## Pick a bar

The loop only works if the bar is a real, fetchable thing. Candidates:

- **A) Pok Pok** (ad-free kids' app, Apple Design Award winner). Bar for feel, charm and how
  obvious everything is to a 5-year-old who can't read. Screenshots and trailer are on its App Store page.
- **B) Crayola Create & Play.** Bar for tool realism: how the crayon, marker and spray actually look on the page.
- **C) Lake: Coloring Books.** Bar for line art quality and fill behaviour. Adult-focused, so it's a harder bar for the art.

Measurable half, for any of them: bucket fill under 100 ms on an iPad, a stroke never lags the
finger, works on iPadOS 15 Safari, zero network requests.

## Prompt (bar A filled in)

Paste this into a fresh Claude Code session opened in `color-studio/`:

```
Improve Sophia's Studio, the iPad coloring web app in this folder, for a 5-year-old who can't read yet. Keep it ad-free, offline, and working on iPadOS 15 Safari.

The bar is Pok Pok on iPad. Pull its App Store screenshots and trailer frames and compare against those directly, not against a description of them. The measurable half: bucket fill under 100 ms at iPad resolution, strokes that never trail the finger, zero network requests.

Break this into the smallest pieces that can be improved and judged on their own - tool icons, how each tool's mark looks on the page, the colour palette, the coloring pages' art, the gallery, sounds and feedback, portrait layout. For each piece, fan out a builder and a separate critic with fresh context. The critic screenshots ours at iPad size in the browser, puts it next to Pok Pok blind with the labels stripped, says which one a 5-year-old would rather use, and names the single biggest remaining gap. Then it goes back to the builder.

The critic should be a harsh critic. Praise is not useful. If ours does not win, it keeps going.

/loop on each piece until the critic picks ours blind. Do not stop before that.

Keep a live progress page updating as the work evolves so I can watch it.

Fan out subagents and ultracode.
```

Note: this runs many agents for a long time and uses a lot of tokens. Stop it whenever the result is good enough.
