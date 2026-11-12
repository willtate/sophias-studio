# Gauntlet progress

Bar: **Pok Pok** (iPad drawing toy screen, from its App Store screenshots).
Method: I build; a separate critic with fresh context gets two unlabeled screenshots (ours and Pok Pok's)
and must pick the one a 5-year-old would rather use, then name the single biggest gap.

| Round | Winner | Biggest gap named | What changed |
|---|---|---|---|
| 1 | Pok Pok | Too much chrome: 20 swatches, 7 tools, 3 sizes and 5 buttons crowd the page | v1 baseline |
| 2 | **Ours** (labels swapped to avoid position bias) | Winner's remaining gap: home/undo/save were tiny grey glyphs a non-reader won't find |  Removed top bar and size row (tap the held tool to cycle size); paper-grain crayon/pencil with smoothing; 12-colour curated palette in one column; one icon family; flat controls; cleaner cat art. Plus: pages grouped into categories (requested) |
| 2b | (fix) | | Home and save are 58px round buttons (save in yellow); undo sits under the tool rail; hold-to-clear bin moved under the colours, away from save |

## Requested features
- Groups of pages (done): Animals, Fairy Tales, Vehicles, Robots, Space, Silly Monsters, Under the Sea, Garden & Bugs, Yummy Treats (6 pages each) plus a blank "Draw" page. Each group was drawn by its own agent, checked with `node tools/render.js`, then reviewed. The unicorn was sent back for a redraw.
