/* Letters & Words: trace-the-letter pages (A to Z) and a page for tracing her name.
   Letters are drawn as dotted centre lines with numbered green start dots and arrows,
   in the order children are taught to form them. page.trace tells the app which
   points to check, what to say as each letter is finished, and which sticker to pop. */
(function () {
  'use strict';
  var A = window.Art;
  var r = A.r;

  var NAME = 'Sophia';
  A.childName = NAME;

  // Glyphs on a grid: top line y=0, middle line y=50, baseline y=100, descender y=140.
  // Each stroke is a path using only absolute M, L, H, V, C.
  var BOWL = 'M72 60 C62 46 26 48 26 75 C26 102 64 104 72 86';
  var HUMP = 'M28 70 C34 46 72 44 72 70 V100';
  var G = {
    A: ['M50 0 L14 100', 'M50 0 L86 100', 'M28 62 H72'],
    B: ['M22 0 V100', 'M22 0 H54 C80 0 80 48 54 48 H22', 'M22 48 H58 C88 48 88 100 58 100 H22'],
    C: ['M80 20 C68 -4 18 -6 16 50 C16 106 70 106 82 80'],
    D: ['M22 0 V100', 'M22 0 H44 C96 0 96 100 44 100 H22'],
    E: ['M26 0 V100', 'M26 0 H78', 'M26 50 H70', 'M26 100 H78'],
    F: ['M26 0 V100', 'M26 0 H78', 'M26 50 H70'],
    G: ['M80 20 C68 -4 18 -6 16 50 C16 106 70 108 82 80 V58 H56'],
    H: ['M20 0 V100', 'M80 0 V100', 'M20 50 H80'],
    I: ['M50 0 V100', 'M28 0 H72', 'M28 100 H72'],
    J: ['M66 0 V70 C66 108 20 108 16 78'],
    K: ['M24 0 V100', 'M78 0 L24 60', 'M42 40 L80 100'],
    L: ['M26 0 V100 H78'],
    M: ['M14 100 V0', 'M14 0 L50 72 L86 0 V100'],
    N: ['M20 100 V0', 'M20 0 L80 100 V0'],
    O: ['M50 0 C8 0 8 100 50 100 C92 100 92 0 50 0'],
    P: ['M22 0 V100', 'M22 0 H54 C84 0 84 52 54 52 H22'],
    Q: ['M50 0 C8 0 8 100 50 100 C92 100 92 0 50 0', 'M58 70 L86 104'],
    R: ['M22 0 V100', 'M22 0 H54 C84 0 84 52 54 52 H22', 'M50 52 L82 100'],
    S: ['M78 16 C66 -4 22 -4 22 24 C22 50 78 46 78 74 C78 104 30 106 18 84'],
    T: ['M50 0 V100', 'M16 0 H84'],
    U: ['M20 0 V64 C20 108 80 108 80 64 V0'],
    V: ['M14 0 L50 100 L86 0'],
    W: ['M6 0 L28 100 L50 30 L72 100 L94 0'],
    X: ['M20 0 L80 100', 'M80 0 L20 100'],
    Y: ['M18 0 L50 50', 'M82 0 L50 50 V100'],
    Z: ['M18 0 H82 L18 100 H82'],
    a: [BOWL, 'M72 50 V100'],
    b: ['M28 0 V100', 'M28 74 C34 44 74 44 74 75 C74 104 34 104 28 82'],
    c: ['M72 60 C62 46 26 48 26 75 C26 102 62 104 72 92'],
    d: [BOWL, 'M72 0 V100'],
    e: ['M28 75 H72 C72 52 54 48 48 50 C30 52 26 66 26 75 C26 102 62 104 72 92'],
    f: ['M68 10 C60 -2 40 -2 40 22 V100', 'M22 52 H62'],
    g: [BOWL, 'M72 50 V122 C72 146 34 146 26 128'],
    h: ['M28 0 V100', HUMP],
    i: ['M50 50 V100', 'M50 28'],
    j: ['M56 50 V122 C56 146 24 146 18 128', 'M56 28'],
    k: ['M28 0 V100', 'M70 50 L28 80', 'M42 72 L72 100'],
    l: ['M50 0 V100'],
    m: ['M16 50 V100', 'M16 68 C20 48 50 46 50 66 V100', 'M50 66 C54 46 84 48 84 68 V100'],
    n: ['M28 50 V100', HUMP],
    o: ['M50 50 C20 50 20 100 50 100 C80 100 80 50 50 50'],
    p: ['M28 50 V140', 'M28 74 C34 44 74 44 74 75 C74 104 34 104 28 82'],
    q: [BOWL, 'M72 50 V140'],
    r: ['M32 50 V100', 'M32 72 C38 50 58 46 72 54'],
    s: ['M70 56 C62 46 32 46 32 62 C32 76 70 72 70 87 C70 104 34 104 28 92'],
    t: ['M48 12 V90 C48 102 60 102 68 96', 'M30 50 H68'],
    u: ['M28 50 V78 C28 104 72 104 72 78', 'M72 50 V100'],
    v: ['M24 50 L50 100 L76 50'],
    w: ['M10 50 L30 100 L50 62 L70 100 L90 50'],
    x: ['M26 50 L74 100', 'M74 50 L26 100'],
    y: ['M26 50 L50 100', 'M74 50 L36 140'],
    z: ['M26 50 H74 L26 100 H74']
  };

  // "A is for apple": word, sticker, and which letter of the word to colour.
  var WORDS = {
    A: ['apple', '🍎'], B: ['bear', '🐻'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['egg', '🥚'], F: ['fish', '🐟'],
    G: ['grapes', '🍇'], H: ['horse', '🐴'], I: ['ice cream', '🍦'], J: ['juice', '🧃'], K: ['kite', '🪁'],
    L: ['lion', '🦁'], M: ['moon', '🌙'], N: ['nose', '👃'], O: ['owl', '🦉'], P: ['pig', '🐷'], Q: ['queen', '👸'],
    R: ['rainbow', '🌈'], S: ['sun', '☀️'], T: ['tree', '🌳'], U: ['umbrella', '☂️'], V: ['violin', '🎻'],
    W: ['whale', '🐳'], X: ['fox', '🦊'], Y: ['yo-yo', '🪀'], Z: ['zebra', '🦓']
  };

  // ---- Path sampling ----
  function flatten(d) {
    var t = d.match(/[MLHVC]|-?\d*\.?\d+/g), i = 0, cmd = '', x = 0, y = 0, pts = [];
    function num() { return parseFloat(t[i++]); }
    while (i < t.length) {
      if (/[MLHVC]/.test(t[i])) cmd = t[i++];
      if (cmd === 'M') { x = num(); y = num(); pts.push([x, y]); cmd = 'L'; }
      else if (cmd === 'L') { x = num(); y = num(); pts.push([x, y]); }
      else if (cmd === 'H') { x = num(); pts.push([x, y]); }
      else if (cmd === 'V') { y = num(); pts.push([x, y]); }
      else if (cmd === 'C') {
        var x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
        for (var k = 1; k <= 24; k++) {
          var s = k / 24, u = 1 - s;
          pts.push([u * u * u * x + 3 * u * u * s * x1 + 3 * u * s * s * x2 + s * s * s * x3,
            u * u * u * y + 3 * u * u * s * y1 + 3 * u * s * s * y2 + s * s * s * y3]);
        }
        x = x3; y = y3;
      }
    }
    return pts;
  }
  // Evenly spaced points along a polyline (always includes both ends).
  function resample(pts, gap) {
    if (pts.length < 2) return pts.slice();
    var out = [pts[0]], need = gap, total = 0, i, segs = [];
    for (i = 1; i < pts.length; i++) {
      var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segs.push(l); total += l;
    }
    var n = Math.max(1, Math.round(total / gap)), step = total / n, acc = 0, si = 0, into = 0;
    for (var k = 1; k < n; k++) {
      var target = k * step;
      while (acc + segs[si] < target) { acc += segs[si]; si++; }
      var f = (target - acc) / (segs[si] || 1);
      out.push([pts[si][0] + (pts[si + 1][0] - pts[si][0]) * f, pts[si][1] + (pts[si + 1][1] - pts[si][1]) * f]);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  // Unit-space bounds of a glyph, for spacing letters.
  function bounds(ch) {
    var x0 = 1e9, x1 = -1e9;
    G[ch].forEach(function (d) { flatten(d).forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }); });
    return [x0, x1];
  }

  var INK = '#34405A', DOT = '#A39C90', GO = '#6BBF4E';

  // Draws one row of letters. Returns { svg, items } where items hold the points to check.
  // opts: { chars, s (px per unit), top, cx, numbers, faint, gapU }
  function row(opts) {
    var s = opts.s, gapU = opts.gapU || 34;
    var widths = opts.chars.map(function (ch) { var b = bounds(ch); return b[1] - b[0]; });
    var totalU = widths.reduce(function (a, b) { return a + b; }, 0) + gapU * (opts.chars.length - 1);
    var x = opts.cx - totalU * s / 2;
    var svg = '', items = [];
    var dotR = opts.faint ? 6 : Math.max(7, s * 1.5), dotGap = opts.faint ? 24 : Math.max(26, s * 6);
    var badges = '', BR = Math.min(24, Math.max(15, s * 4.6)), BS = BR / 24;
    opts.chars.forEach(function (ch, ci) {
      var b = bounds(ch), ox = x - b[0] * s;
      var item = { say: ch, pts: [], cx: 0, cy: 0 };
      var sumX = 0, sumY = 0, nPts = 0;
      var starts = [];
      G[ch].forEach(function (d, si) {
        var raw = flatten(d).map(function (p) { return [ox + p[0] * s, opts.top + p[1] * s]; });
        var pts = raw.length > 1 ? resample(raw, dotGap) : raw;
        pts.forEach(function (p, pi) {
          var big = raw.length === 1;
          svg += '<circle cx="' + r(p[0]) + '" cy="' + r(p[1]) + '" r="' + r(big ? dotR * 2 : dotR) + '" fill="' + DOT + '"' + (opts.faint ? ' fill-opacity=".55"' : '') + '/>';
          item.pts.push([r(p[0]), r(p[1])]);
          sumX += p[0]; sumY += p[1]; nPts++;
        });
        if (opts.numbers) {
          // Start badge, pushed clear of any earlier badge it would sit on.
          var at = raw[0].slice();
          starts.forEach(function (q) {
            var dx = at[0] - q[0], dy = at[1] - q[1], dd = Math.hypot(dx, dy);
            if (dd < BR * 2 + 4) {
              if (dd < 1) {
                // Same start as an earlier stroke: move along this stroke instead.
                var nx = raw[Math.min(raw.length - 1, 3)];
                dx = nx[0] - at[0]; dy = nx[1] - at[1]; dd = Math.hypot(dx, dy) || 1;
              }
              at = [q[0] + dx / dd * (BR * 2 + 4), q[1] + dy / dd * (BR * 2 + 4)];
            }
          });
          starts.push(at);
          badges += '<circle cx="' + r(at[0]) + '" cy="' + r(at[1]) + '" r="' + r(BR) + '" fill="' + GO + '" stroke="#fff" stroke-width="' + r(4 * BS) + '"/>' +
            '<text x="' + r(at[0]) + '" y="' + r(at[1] + 10 * BS) + '" text-anchor="middle" font-size="' + r(29 * BS) + '" font-weight="800" fill="#fff" stroke="none" ' +
            'font-family="ui-rounded, -apple-system, Helvetica, Arial, sans-serif">' + (si + 1) + '</text>';
          // Arrow showing which way to go, a little way along the stroke.
          if (raw.length > 1) {
            var dense = resample(raw, 4 * BS), j = Math.min(dense.length - 1, 20);
            while (j < dense.length - 1 && Math.hypot(dense[j][0] - at[0], dense[j][1] - at[1]) < BR * 2.4) j++;
            if (j >= 12 && j < dense.length - 4) {
              var p0 = dense[j - 3], p1 = dense[j];
              var a = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), L = 17 * BS;
              var tip = [p1[0] + Math.cos(a) * 6 * BS, p1[1] + Math.sin(a) * 6 * BS];
              badges += '<path d="M' + r(tip[0] - Math.cos(a - 0.6) * L) + ' ' + r(tip[1] - Math.sin(a - 0.6) * L) +
                ' L' + r(tip[0]) + ' ' + r(tip[1]) + ' L' + r(tip[0] - Math.cos(a + 0.6) * L) + ' ' + r(tip[1] - Math.sin(a + 0.6) * L) +
                '" fill="none" stroke="' + GO + '" stroke-width="' + r(9 * BS) + '" stroke-linecap="round" stroke-linejoin="round"/>';
            }
          }
        }
      });
      item.cx = r(sumX / nPts); item.cy = r(sumY / nPts);
      items.push(item);
      x += (widths[ci] + gapU) * s;
    });
    // Writing lines: top, dashed middle, baseline.
    var x0 = 90, x1 = A.W - 90, t = opts.top;
    var lines = '<g stroke="#BFD7EA" stroke-width="4" fill="none">' +
      '<path d="M' + x0 + ' ' + t + ' H' + x1 + '"/>' +
      '<path d="M' + x0 + ' ' + r(t + 50 * s) + ' H' + x1 + '" stroke-dasharray="18 16"/>' +
      '<path d="M' + x0 + ' ' + r(t + 100 * s) + ' H' + x1 + '" stroke="#8FB8DA" stroke-width="5"/></g>';
    return { svg: lines + '<g stroke="none">' + svg + '</g>' + badges, items: items };
  }

  function wordSvg(word, hi, cx, cy, size) {
    var idx = word.toLowerCase().indexOf(hi.toLowerCase());
    var spans = word.split('').map(function (ch, i) {
      return '<tspan' + (i === idx ? ' fill="#E8473B"' : '') + '>' + ch + '</tspan>';
    }).join('');
    return '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" font-size="' + size + '" font-weight="800" fill="' + INK + '" stroke="none" ' +
      'font-family="ui-rounded, &quot;SF Pro Rounded&quot;, -apple-system, Helvetica, Arial, sans-serif">' + spans + '</text>';
  }

  // ---- Her name ----
  (function () {
    var chars = NAME.split('');
    var top1 = row({ chars: chars, s: 2.8, top: 120, cx: A.W / 2, numbers: true });
    var top2 = row({ chars: chars, s: 2.8, top: 650, cx: A.W / 2, numbers: false, faint: true });
    var p = A.page('letters', 'name', NAME, function () { return top1.svg + top2.svg; });
    var n = chars.length;
    p.trace = {
      intro: 'Let\'s write ' + NAME,
      items: top1.items.concat(top2.items),
      groups: [
        { items: range(0, n), say: NAME + '! You wrote your name!', sticker: '👑', word: '', at: [A.W - 105, 300] },
        { items: range(n, 2 * n), say: NAME + '! Again! Super writing!', sticker: '🌟', word: '', at: [A.W - 105, 830] }
      ]
    };
  })();

  function range(a, b) { var o = []; for (var i = a; i < b; i++) o.push(i); return o; }

  // ---- A to Z ----
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (L) {
    var l = L.toLowerCase(), w = WORDS[L];
    var rw = row({ chars: [L, l], s: 5.2, top: 90, cx: A.W / 2, numbers: true, gapU: 90 });
    var fs = 120, estW = w[0].length * fs * 0.58;
    var wordY = 1070;
    var p = A.page('letters', 'trace-' + L, L + ' ' + l, function () {
      return rw.svg + wordSvg(w[0], L === 'X' ? 'x' : L, A.W / 2 + 70, wordY, fs);
    });
    p.trace = {
      intro: '{' + L + '}',
      items: rw.items,
      groups: [{ items: [0, 1], say: '{' + L + '} ' + (L === 'X' ? 'is in' : 'is for') + ' ' + w[0], sticker: w[1], word: w[0],
        at: [r(A.W / 2 + 70 - estW / 2 - 120), wordY - 42] }]
    };
  });
})();
