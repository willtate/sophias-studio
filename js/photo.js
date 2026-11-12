/* Photo -> coloring page.
   Turns a photo into bold black outlines (#222) on a transparent 1600x1200 layer, in the
   same style as the built-in pages: thick rounded lines, big closed regions, no specks.

   Pipeline (all heavy work at a small working size, 480x360):
     1. draw the photo (contain-fit, centred) into the working canvas
     2. convert to a luminance + opponent-colour space, edge-preserving smoothing
     2b. thin dark lines (pen strokes, cartoon outlines) are detected and kept as ink
     3. k-means into a few tone/colour clusters (deterministic seeding)
     4. mode filter so cluster edges are smooth and specks vanish
     5. connected regions; regions with too little fillable area are merged into the
        most similar neighbour; soft gradient borders are joined (repeated until stable)
     6. distance field to the region borders, upscaled to 1600x1200 and thresholded
        into ~14px antialiased strokes, plus a rounded frame so every region is closed.

   API: PhotoPage.fromFile(file) / PhotoPage.fromImage(imgOrCanvas)
        -> Promise<{ dataUrl, width: 1600, height: 1200 }>
   ES5 only (iPadOS 15 Safari / WKWebView). */
(function () {
  'use strict';

  var OUT_W = 1600, OUT_H = 1200;
  var WW = 480, WH = 360;              // working resolution (same 4:3 aspect as the page)
  var S = OUT_W / WW;                  // working px -> output px
  var MARGIN = 34;                     // output px between the canvas edge and the frame centre
  var HALF_LINE = 7;                   // output px, half the stroke width (14px like the pages)
  var FRAME_R = 46;                    // output px, frame corner radius
  var K = 6;                           // tone/colour clusters
  var MIN_FILL_FRAC = 0.002;           // a region needs this much fillable area (of the photo)
  var MAX_REGIONS = 60;                // never more regions than this
  var SOFT_EDGE = 9;                   // borders with less contrast than this are a gradient
  var INK_CONTRAST = 55;               // a small region this much darker than around it is ink
  var INK_MIN = 30;                    // ...if it has at least this many working pixels
  var INK_DARK = 95;                   // ...and darker than this (0-255 luminance)
  var INK_VALLEY = 38;                 // a pen line is this much darker than both sides
  var INK_DENSITY = 0.13;              // more line pixels than this nearby = texture
  var INK_ID = -2;
  var INK = [34, 34, 34];

  if (typeof window !== 'undefined' && window.ColorPages && window.ColorPages.W) {
    OUT_W = window.ColorPages.W; OUT_H = window.ColorPages.H; S = OUT_W / WW;
  }

  // ---------- layout ----------

  // Photo rectangle (output px) for an image of size iw x ih, contain-fitted inside the frame.
  function layout(iw, ih) {
    var inset = MARGIN;
    var bw = OUT_W - 2 * inset, bh = OUT_H - 2 * inset;
    var sc = Math.min(bw / iw, bh / ih);
    var pw = iw * sc, ph = ih * sc;
    return { x: (OUT_W - pw) / 2, y: (OUT_H - ph) / 2, w: pw, h: ph };
  }

  // Signed distance (output px) to a rounded rectangle; negative inside.
  function sdRoundRect(px, py, R, rad) {
    var cx = R.x + R.w / 2, cy = R.y + R.h / 2;
    var qx = Math.abs(px - cx) - (R.w / 2 - rad);
    var qy = Math.abs(py - cy) - (R.h / 2 - rad);
    var ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0;
    var inside = Math.min(Math.max(qx, qy), 0);
    return Math.sqrt(ox * ox + oy * oy) + inside - rad;
  }

  // ---------- image loading ----------

  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  // Draw the source into the working canvas, downscaling in halving steps so large
  // camera photos do not alias. Returns { data: Uint8ClampedArray, rect (output px) }.
  function sample(src) {
    var iw = src.naturalWidth || src.videoWidth || src.width;
    var ih = src.naturalHeight || src.videoHeight || src.height;
    if (!iw || !ih) throw new Error('PhotoPage: image has no size');
    var R = layout(iw, ih);
    // target size in working pixels
    var tw = Math.max(1, Math.round(R.w / S)), th = Math.max(1, Math.round(R.h / S));
    var cur = src, cw = iw, ch = ih;
    while (cw > tw * 2.5 || ch > th * 2.5) {
      var nw = Math.max(tw, Math.round(cw / 2)), nh = Math.max(th, Math.round(ch / 2));
      // First step from a huge photo: go straight to a moderate size to save memory.
      if (cur === src && (nw > 2048 || nh > 2048)) {
        var f = Math.min(2048 / nw, 2048 / nh);
        nw = Math.round(nw * f); nh = Math.round(nh * f);
      }
      var tmp = makeCanvas(nw, nh);
      var tc = tmp.getContext('2d');
      tc.imageSmoothingEnabled = true;
      if ('imageSmoothingQuality' in tc) tc.imageSmoothingQuality = 'high';
      tc.drawImage(cur, 0, 0, cw, ch, 0, 0, nw, nh);
      cur = tmp; cw = nw; ch = nh;
    }
    var work = makeCanvas(WW, WH);
    var wc = work.getContext('2d');
    wc.fillStyle = '#fff';
    wc.fillRect(0, 0, WW, WH);
    wc.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in wc) wc.imageSmoothingQuality = 'high';
    wc.drawImage(cur, 0, 0, cw, ch, R.x / S, R.y / S, R.w / S, R.h / S);
    return { data: wc.getImageData(0, 0, WW, WH).data, rect: R };
  }

  // ---------- core (pure, typed arrays only) ----------

  // inside mask: working pixels whose centre lies inside the frame (minus the stroke).
  function insideMask(R) {
    var m = new Uint8Array(WW * WH);
    for (var y = 0; y < WH; y++) {
      for (var x = 0; x < WW; x++) {
        if (sdRoundRect((x + 0.5) * S, (y + 0.5) * S, R, FRAME_R) < -HALF_LINE * 0.5) m[y * WW + x] = 1;
      }
    }
    return m;
  }

  // RGB -> 3 float channels: luminance and two opponent colour axes (rough Lab).
  function toFeatures(rgba, n) {
    var L = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n);
    for (var i = 0, p = 0; i < n; i++, p += 4) {
      var r = rgba[p], g = rgba[p + 1], b = rgba[p + 2];
      L[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      A[i] = (r - g) * 0.5;
      B[i] = ((r + g) * 0.5 - b) * 0.5;
    }
    return [L, A, B];
  }

  // Cheap bilateral filter (5x5), applied to all channels with range weight from all channels.
  function bilateral(ch, inside, passes, sigmaR) {
    var n = WW * WH, L = ch[0], A = ch[1], Bc = ch[2];
    var oL = new Float32Array(n), oA = new Float32Array(n), oB = new Float32Array(n);
    var rangeLUT = new Float32Array(1024);
    for (var i = 0; i < 1024; i++) rangeLUT[i] = Math.exp(-(i * i) / (2 * sigmaR * sigmaR));
    var sw = new Float32Array(25), dxs = new Int32Array(25), dys = new Int32Array(25), k = 0;
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) {
        sw[k] = Math.exp(-(dx * dx + dy * dy) / (2 * 1.6 * 1.6)); dxs[k] = dx; dys[k] = dy; k++;
      }
    }
    for (var pass = 0; pass < passes; pass++) {
      for (var y = 0; y < WH; y++) {
        for (var x = 0; x < WW; x++) {
          var p = y * WW + x;
          if (!inside[p]) { oL[p] = L[p]; oA[p] = A[p]; oB[p] = Bc[p]; continue; }
          var l0 = L[p], a0 = A[p], b0 = Bc[p];
          var ws = 0, sl = 0, sa = 0, sb = 0;
          for (k = 0; k < 25; k++) {
            var xx = x + dxs[k], yy = y + dys[k];
            if (xx < 0 || yy < 0 || xx >= WW || yy >= WH) continue;
            var q = yy * WW + xx;
            if (!inside[q]) continue;
            var dl = L[q] - l0, da = A[q] - a0, db = Bc[q] - b0;
            var dist = Math.abs(dl) + 0.7 * (Math.abs(da) + Math.abs(db));
            var di = dist > 1023 ? 1023 : dist | 0;
            var w = sw[k] * rangeLUT[di];
            ws += w; sl += w * L[q]; sa += w * A[q]; sb += w * Bc[q];
          }
          oL[p] = sl / ws; oA[p] = sa / ws; oB[p] = sb / ws;
        }
      }
      var t;
      t = L; L = oL; oL = t;
      t = A; A = oA; oA = t;
      t = Bc; Bc = oB; oB = t;
    }
    return [L, A, Bc];
  }

  // k-means on the inside pixels; deterministic farthest-point seeding.
  function kmeans(ch, inside, k) {
    var n = WW * WH, L = ch[0], A = ch[1], Bc = ch[2];
    var CW = 1.1; // colour weight relative to luminance
    // subsample
    var idx = [];
    for (var i = 0; i < n; i += 3) if (inside[i]) idx.push(i);
    var m = idx.length;
    if (!m) return new Int8Array(n);
    var sL = new Float32Array(m), sA = new Float32Array(m), sB = new Float32Array(m);
    for (i = 0; i < m; i++) { sL[i] = L[idx[i]]; sA[i] = A[idx[i]] * CW; sB[i] = Bc[idx[i]] * CW; }
    var cL = new Float32Array(k), cA = new Float32Array(k), cB = new Float32Array(k);
    // seed 1: mean
    var mL = 0, mA = 0, mB = 0;
    for (i = 0; i < m; i++) { mL += sL[i]; mA += sA[i]; mB += sB[i]; }
    cL[0] = mL / m; cA[0] = mA / m; cB[0] = mB / m;
    var best = new Float32Array(m);
    for (i = 0; i < m; i++) best[i] = 1e30;
    var nc = 1;
    while (nc < k) {
      var far = -1, fi = 0;
      for (i = 0; i < m; i++) {
        var dl = sL[i] - cL[nc - 1], da = sA[i] - cA[nc - 1], db = sB[i] - cB[nc - 1];
        var d = dl * dl + da * da + db * db;
        if (d < best[i]) best[i] = d;
        if (best[i] > far) { far = best[i]; fi = i; }
      }
      if (far < 64) break; // image has fewer distinct tones than k
      cL[nc] = sL[fi]; cA[nc] = sA[fi]; cB[nc] = sB[fi]; nc++;
    }
    k = nc;
    var asg = new Int8Array(m);
    var tL = new Float64Array(k), tA = new Float64Array(k), tB = new Float64Array(k), cnt = new Int32Array(k);
    for (var it = 0; it < 10; it++) {
      for (var c = 0; c < k; c++) { tL[c] = 0; tA[c] = 0; tB[c] = 0; cnt[c] = 0; }
      for (i = 0; i < m; i++) {
        var bd = 1e30, bc = 0;
        for (c = 0; c < k; c++) {
          var el = sL[i] - cL[c], ea = sA[i] - cA[c], eb = sB[i] - cB[c];
          var e = el * el + ea * ea + eb * eb;
          if (e < bd) { bd = e; bc = c; }
        }
        asg[i] = bc; tL[bc] += sL[i]; tA[bc] += sA[i]; tB[bc] += sB[i]; cnt[bc]++;
      }
      for (c = 0; c < k; c++) {
        if (cnt[c]) { cL[c] = tL[c] / cnt[c]; cA[c] = tA[c] / cnt[c]; cB[c] = tB[c] / cnt[c]; }
      }
    }
    // assign every pixel
    var lab = new Int8Array(n);
    for (i = 0; i < n; i++) {
      if (!inside[i]) { lab[i] = -1; continue; }
      var l = L[i], a = A[i] * CW, b = Bc[i] * CW, bd2 = 1e30, bc2 = 0;
      for (c = 0; c < k; c++) {
        var fl = l - cL[c], fa = a - cA[c], fb = b - cB[c];
        var f = fl * fl + fa * fa + fb * fb;
        if (f < bd2) { bd2 = f; bc2 = c; }
      }
      lab[i] = bc2;
    }
    return lab;
  }

  // Thin dark lines (pen strokes of a photographed drawing, outlines of a cartoon, dark
  // creases): pixels clearly darker than the pixels a few steps away on both sides along
  // some direction. Specks are dropped, the rest is thinned to a 1px skeleton so the final
  // stroke has the usual width. Returns Uint8Array skeleton mask.
  function detectInk(L, inside) {
    var n = WW * WH, cand = new Uint8Array(n);
    var DX = [1, 0, 1, 1], DY = [0, 1, 1, -1];
    for (var y = 3; y < WH - 3; y++) {
      for (var x = 3; x < WW - 3; x++) {
        var p = y * WW + x, l = L[p];
        if (!inside[p] || l > INK_DARK + 40) continue;
        var best = 0;
        for (var d = 0; d < 4; d++) {
          for (var k = 2; k <= 3; k++) {
            var o = (DY[d] * WW + DX[d]) * k;
            var a = L[p - o], b = L[p + o];
            var v = (a < b ? a : b) - l;
            if (v > best) best = v;
          }
        }
        if (best > INK_VALLEY) cand[p] = 1;
      }
    }
    dropSpecks(cand, INK_MIN);
    thin(cand);
    // Dense tangles of little lines are texture (fur, seeds, gravel), not drawing: drop them.
    var R = 7, lim = INK_DENSITY * (2 * R + 1) * (2 * R + 1);
    var integ = new Int32Array((WW + 1) * (WH + 1)), W1 = WW + 1;
    for (y = 0; y < WH; y++) {
      var run = 0;
      for (x = 0; x < WW; x++) {
        run += cand[y * WW + x];
        integ[(y + 1) * W1 + x + 1] = integ[y * W1 + x + 1] + run;
      }
    }
    var kill = [];
    for (y = 0; y < WH; y++) {
      for (x = 0; x < WW; x++) {
        if (!cand[y * WW + x]) continue;
        var x0 = x - R < 0 ? 0 : x - R, x1 = x + R + 1 > WW ? WW : x + R + 1;
        var y0 = y - R < 0 ? 0 : y - R, y1 = y + R + 1 > WH ? WH : y + R + 1;
        var cnt = integ[y1 * W1 + x1] - integ[y0 * W1 + x1] - integ[y1 * W1 + x0] + integ[y0 * W1 + x0];
        if (cnt > lim) kill.push(y * WW + x);
      }
    }
    for (var i = 0; i < kill.length; i++) cand[kill[i]] = 0;
    dropSpecks(cand, 12);
    return cand;
  }

  // Remove 8-connected components of m smaller than minSize pixels, in place.
  function dropSpecks(m, minSize) {
    var n = WW * WH, seen = new Uint8Array(n), stack = new Int32Array(n), list = new Int32Array(n);
    for (var i = 0; i < n; i++) {
      if (!m[i] || seen[i]) continue;
      var sp = 0, ln = 0;
      stack[sp++] = i; seen[i] = 1;
      while (sp) {
        var q = stack[--sp];
        list[ln++] = q;
        var qx = q % WW, qy = (q / WW) | 0;
        for (var dy = -1; dy <= 1; dy++) {
          var yy = qy + dy; if (yy < 0 || yy >= WH) continue;
          for (var dx = -1; dx <= 1; dx++) {
            var xx = qx + dx; if (xx < 0 || xx >= WW) continue;
            var r = yy * WW + xx;
            if (m[r] && !seen[r]) { seen[r] = 1; stack[sp++] = r; }
          }
        }
      }
      if (ln < minSize) for (var j = 0; j < ln; j++) m[list[j]] = 0;
    }
  }

  // Zhang-Suen thinning, in place.
  function thin(m) {
    var del = [], changed = true, iter = 0;
    while (changed && iter < 12) {
      changed = false; iter++;
      for (var step = 0; step < 2; step++) {
        del.length = 0;
        for (var y = 1; y < WH - 1; y++) {
          for (var x = 1; x < WW - 1; x++) {
            var p = y * WW + x;
            if (!m[p]) continue;
            var p2 = m[p - WW], p3 = m[p - WW + 1], p4 = m[p + 1], p5 = m[p + WW + 1],
              p6 = m[p + WW], p7 = m[p + WW - 1], p8 = m[p - 1], p9 = m[p - WW - 1];
            var b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
            if (b < 2 || b > 6) continue;
            var a = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) +
              (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2);
            if (a !== 1) continue;
            if (step === 0) { if (p2 * p4 * p6 || p4 * p6 * p8) continue; }
            else { if (p2 * p4 * p8 || p2 * p6 * p8) continue; }
            del.push(p);
          }
        }
        for (var i = 0; i < del.length; i++) m[del[i]] = 0;
        if (del.length) changed = true;
      }
    }
  }

  // Majority (mode) filter on small label sets, radius rad.
  function modeFilter(lab, inside, rad, passes) {
    var n = WW * WH, out = new Int8Array(n), hist = new Int32Array(16);
    for (var pass = 0; pass < passes; pass++) {
      for (var y = 0; y < WH; y++) {
        for (var x = 0; x < WW; x++) {
          var p = y * WW + x;
          if (!inside[p]) { out[p] = -1; continue; }
          if (lab[p] === INK_ID) { out[p] = INK_ID; continue; }
          for (var h = 0; h < 16; h++) hist[h] = 0;
          var y0 = y - rad < 0 ? 0 : y - rad, y1 = y + rad >= WH ? WH - 1 : y + rad;
          var x0 = x - rad < 0 ? 0 : x - rad, x1 = x + rad >= WW ? WW - 1 : x + rad;
          for (var yy = y0; yy <= y1; yy++) {
            var row = yy * WW;
            for (var xx = x0; xx <= x1; xx++) {
              var v = lab[row + xx];
              if (v >= 0) hist[v]++;
            }
          }
          var bv = lab[p], bc = hist[bv];
          for (h = 0; h < 16; h++) if (hist[h] > bc) { bc = hist[h]; bv = h; }
          out[p] = bv;
        }
      }
      var t = lab; lab = out; out = t;
    }
    return lab;
  }

  // 4-connected components of equal labels. Returns { comp: Int32Array (-1 outside), count }.
  function components(lab, inside) {
    var n = WW * WH, comp = new Int32Array(n), stack = new Int32Array(n);
    for (var i = 0; i < n; i++) comp[i] = -1;
    var count = 0;
    for (i = 0; i < n; i++) {
      if (!inside[i] || comp[i] >= 0) continue;
      if (lab[i] === INK_ID) { comp[i] = INK_ID; continue; }
      var v = lab[i], sp = 0;
      stack[sp++] = i; comp[i] = count;
      while (sp) {
        var p = stack[--sp], x = p % WW;
        if (x > 0 && comp[p - 1] < 0 && inside[p - 1] && lab[p - 1] === v) { comp[p - 1] = count; stack[sp++] = p - 1; }
        if (x < WW - 1 && comp[p + 1] < 0 && inside[p + 1] && lab[p + 1] === v) { comp[p + 1] = count; stack[sp++] = p + 1; }
        if (p >= WW && comp[p - WW] < 0 && inside[p - WW] && lab[p - WW] === v) { comp[p - WW] = count; stack[sp++] = p - WW; }
        if (p < n - WW && comp[p + WW] < 0 && inside[p + WW] && lab[p + WW] === v) { comp[p + WW] = count; stack[sp++] = p + WW; }
      }
      count++;
    }
    return { comp: comp, count: count };
  }

  // Mark pixels on either side of a region border.
  function borders(comp, edge) {
    var n = WW * WH;
    for (var i = 0; i < n; i++) edge[i] = 0;
    for (var y = 0; y < WH; y++) {
      for (var x = 0; x < WW; x++) {
        var p = y * WW + x, c = comp[p];
        if (c < 0) { if (c === INK_ID) edge[p] = 1; continue; }
        if (x < WW - 1) { var r = comp[p + 1]; if (r >= 0 && r !== c) { edge[p] = 1; edge[p + 1] = 1; } }
        if (y < WH - 1) { var d = comp[p + WW]; if (d >= 0 && d !== c) { edge[p] = 1; edge[p + WW] = 1; } }
      }
    }
  }

  // Exact Euclidean distance transform (Felzenszwalb & Huttenlocher) to pixels with seed=1.
  // Returns distances (not squared) as Float32Array.
  var INF = 1e20;
  function edt1d(f, d, v, z, len) {
    var k = 0, q, s;
    v[0] = 0; z[0] = -INF; z[1] = INF;
    for (q = 1; q < len; q++) {
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) {
        k--;
        s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (q = 0; q < len; q++) {
      while (z[k + 1] < q) k++;
      var dq = q - v[k];
      d[q] = dq * dq + f[v[k]];
    }
  }
  function distanceField(seed) {
    var n = WW * WH, g = new Float32Array(n), mx = Math.max(WW, WH);
    var f = new Float64Array(mx), d = new Float64Array(mx), v = new Int32Array(mx), z = new Float64Array(mx + 1);
    var x, y;
    for (var i = 0; i < n; i++) g[i] = seed[i] ? 0 : INF;
    for (x = 0; x < WW; x++) {
      for (y = 0; y < WH; y++) f[y] = g[y * WW + x];
      edt1d(f, d, v, z, WH);
      for (y = 0; y < WH; y++) g[y * WW + x] = d[y];
    }
    for (y = 0; y < WH; y++) {
      var row = y * WW;
      for (x = 0; x < WW; x++) f[x] = g[row + x];
      edt1d(f, d, v, z, WW);
      for (x = 0; x < WW; x++) g[row + x] = Math.sqrt(d[x]);
    }
    return g;
  }

  // Region clean-up, repeated until stable:
  //  - small dark regions (pen strokes in a photographed drawing, pupils, dark cracks) become
  //    ink (comp = INK_ID) so they stay as lines instead of vanishing;
  //  - neighbouring regions split by a soft gradient (low contrast along their shared border,
  //    e.g. uneven lighting on paper or a wall) are joined;
  //  - regions with too little fillable (not covered by ink) area are merged into the
  //    neighbour with the most similar colour, weighted by shared border length.
  // ch: smoothed feature channels, used for region colours and border contrast.
  function mergeRegions(comp, count, ch, insideArea) {
    var n = WW * WH, edge = new Uint8Array(n), dist;
    var L = ch[0], A = ch[1], Bc = ch[2];
    var lineR = HALF_LINE / S - 0.5;                    // working px, see render()
    var minFill = Math.max(40, insideArea * MIN_FILL_FRAC);
    var parent = new Int32Array(count), i, c, key, s, t;
    for (i = 0; i < count; i++) parent[i] = i;
    var fill = new Int32Array(count), size = new Int32Array(count);
    var mL = new Float64Array(count), mA = new Float64Array(count), mB = new Float64Array(count);
    var nbL = new Float64Array(count), nbW = new Float64Array(count);
    var isSmall = new Uint8Array(count), busy = new Uint8Array(count), toInk = new Uint8Array(count);
    var bestN = new Int32Array(count), bestS = new Float64Array(count);

    for (var round = 0; round < 40; round++) {
      borders(comp, edge);
      dist = distanceField(edge);
      for (c = 0; c < count; c++) { fill[c] = 0; size[c] = 0; mL[c] = 0; mA[c] = 0; mB[c] = 0; }
      for (i = 0; i < n; i++) {
        c = comp[i];
        if (c < 0) continue;
        size[c]++; mL[c] += L[i]; mA[c] += A[i]; mB[c] += Bc[i];
        if (dist[i] > lineR + 1.2) fill[c]++;
      }
      var live = [];
      for (c = 0; c < count; c++) {
        if (!size[c]) continue;
        live.push(c); mL[c] /= size[c]; mA[c] /= size[c]; mB[c] /= size[c];
      }
      live.sort(function (a, b) { return fill[a] - fill[b]; });
      var excess = live.length - MAX_REGIONS;
      for (i = 0; i < live.length; i++) {
        c = live[i];
        isSmall[c] = (fill[c] < minFill || i < excess) ? 1 : 0;
      }
      // Pair statistics along borders: length and summed contrast across the border
      // (measured two pixels apart so a smooth gradient reads as low contrast).
      var pairLen = {}, pairCon = {};
      for (var y = 0; y < WH; y++) {
        for (var x = 0; x < WW; x++) {
          var p = y * WW + x, a = comp[p], nb, q0, q1, con;
          if (a < 0 || !edge[p]) continue;
          if (x < WW - 1) {
            nb = comp[p + 1];
            if (nb >= 0 && nb !== a) {
              key = a < nb ? a * count + nb : nb * count + a;
              q0 = x > 0 ? p - 1 : p; q1 = x < WW - 2 ? p + 2 : p + 1;
              con = Math.abs(L[q0] - L[q1]) + 0.7 * (Math.abs(A[q0] - A[q1]) + Math.abs(Bc[q0] - Bc[q1]));
              pairLen[key] = (pairLen[key] || 0) + 1; pairCon[key] = (pairCon[key] || 0) + con;
            }
          }
          if (y < WH - 1) {
            nb = comp[p + WW];
            if (nb >= 0 && nb !== a) {
              key = a < nb ? a * count + nb : nb * count + a;
              q0 = y > 0 ? p - WW : p; q1 = y < WH - 2 ? p + 2 * WW : p + WW;
              con = Math.abs(L[q0] - L[q1]) + 0.7 * (Math.abs(A[q0] - A[q1]) + Math.abs(Bc[q0] - Bc[q1]));
              pairLen[key] = (pairLen[key] || 0) + 1; pairCon[key] = (pairCon[key] || 0) + con;
            }
          }
        }
      }
      for (i = 0; i < count; i++) { bestN[i] = -1; bestS[i] = 0; busy[i] = 0; nbL[i] = 0; nbW[i] = 0; toInk[i] = 0; }
      var soft = [];
      for (key in pairLen) {
        if (!pairLen.hasOwnProperty(key)) continue;
        var kk = +key, len = pairLen[key];
        s = (kk / count) | 0; t = kk - s * count;
        var meanCon = pairCon[key] / len;
        nbL[s] += mL[t] * len; nbW[s] += len;
        nbL[t] += mL[s] * len; nbW[t] += len;
        if (meanCon < SOFT_EDGE && len >= 6) soft.push(kk, meanCon);
        var dl = mL[s] - mL[t], da = mA[s] - mA[t], db = mB[s] - mB[t];
        var score = len / (8 + Math.sqrt(dl * dl + da * da + db * db));
        if (isSmall[s] && score > bestS[s]) { bestS[s] = score; bestN[s] = t; }
        if (isSmall[t] && score > bestS[t]) { bestS[t] = score; bestN[t] = s; }
      }
      var changed = 0;
      // 1. small dark regions -> ink
      for (i = 0; i < live.length; i++) {
        c = live[i];
        if (!isSmall[c] || i < excess || !nbW[c] || size[c] < INK_MIN) continue;
        var around = nbL[c] / nbW[c];
        var thin = fill[c] < 0.1 * size[c], blob = size[c] < 0.8 * minFill;
        if (mL[c] < INK_DARK && mL[c] < around - INK_CONTRAST && (thin || blob)) { toInk[c] = 1; busy[c] = 1; changed++; }
      }
      // 2. soft (gradient) borders, lowest contrast first
      var order = [];
      for (i = 0; i < soft.length; i += 2) order.push(i);
      order.sort(function (u, v) { return soft[u + 1] - soft[v + 1]; });
      for (i = 0; i < order.length; i++) {
        var k2 = soft[order[i]];
        s = (k2 / count) | 0; t = k2 - s * count;
        if (busy[s] || busy[t]) continue;
        if (size[s] < size[t]) { parent[s] = t; } else { parent[t] = s; }
        busy[s] = 1; busy[t] = 1; changed++;
      }
      // 3. small regions, smallest first. A region that absorbed or was absorbed this round
      // is left alone until the next round, so merges do not chain into one huge blob.
      for (i = 0; i < live.length; i++) {
        var sm = live[i], tg = bestN[sm];
        if (!isSmall[sm] || tg < 0 || busy[sm] || busy[tg] || toInk[tg]) continue;
        parent[sm] = tg; busy[sm] = 1; busy[tg] = 1; changed++;
      }
      if (!changed) break;
      for (i = 0; i < n; i++) {
        c = comp[i];
        if (c < 0) continue;
        if (toInk[c]) { comp[i] = INK_ID; continue; }
        comp[i] = find(parent, c);
      }
    }
    return count;
  }
  function find(parent, a) {
    while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; }
    return a;
  }

  // Majority filter on the final region map so outlines follow smooth curves. Only pixels
  // near a border can change, so the distance field is used to skip the rest.
  function smoothRegions(comp, count, rad, passes) {
    var n = WW * WH, edge = new Uint8Array(n), out = new Int32Array(n);
    var hist = new Int32Array(count), touched = new Int32Array((2 * rad + 1) * (2 * rad + 1));
    var r2 = rad * rad + rad;
    for (var pass = 0; pass < passes; pass++) {
      borders(comp, edge);
      var dist = distanceField(edge);
      for (var y = 0; y < WH; y++) {
        for (var x = 0; x < WW; x++) {
          var p = y * WW + x, c = comp[p];
          out[p] = c;
          if (c < 0 || dist[p] > rad) continue;
          var nt = 0, bv = c, bc = 0;
          for (var dy = -rad; dy <= rad; dy++) {
            var yy = y + dy; if (yy < 0 || yy >= WH) continue;
            for (var dx = -rad; dx <= rad; dx++) {
              if (dx * dx + dy * dy > r2) continue;
              var xx = x + dx; if (xx < 0 || xx >= WW) continue;
              var v = comp[yy * WW + xx];
              if (v < 0) continue;
              if (!hist[v]) touched[nt++] = v;
              hist[v]++;
            }
          }
          bc = hist[c];
          for (var t = 0; t < nt; t++) {
            var tv = touched[t];
            if (hist[tv] > bc) { bc = hist[tv]; bv = tv; }
            hist[tv] = 0;
          }
          out[p] = bv;
        }
      }
      var tmp = comp; comp = out; out = tmp;
    }
    return comp;
  }

  // Small 3x3 blur of the distance field so the strokes come out smooth after upscaling.
  function smoothField(g) {
    var o = new Float32Array(g.length);
    for (var y = 0; y < WH; y++) {
      for (var x = 0; x < WW; x++) {
        var s = 0, w = 0;
        for (var dy = -1; dy <= 1; dy++) {
          var yy = y + dy; if (yy < 0 || yy >= WH) continue;
          for (var dx = -1; dx <= 1; dx++) {
            var xx = x + dx; if (xx < 0 || xx >= WW) continue;
            var ww = (dx === 0 ? 2 : 1) * (dy === 0 ? 2 : 1);
            s += g[yy * WW + xx] * ww; w += ww;
          }
        }
        o[y * WW + x] = s / w;
      }
    }
    return o;
  }

  // Render the final 1600x1200 RGBA (ink with alpha) from the working distance field.
  function render(dist, R, out) {
    var hw = HALF_LINE, inv = 1 / S;
    var frameR = FRAME_R;
    for (var Y = 0; Y < OUT_H; Y++) {
      var v = (Y + 0.5) * inv - 0.5;
      var y0 = Math.floor(v); var fy = v - y0;
      if (y0 < 0) { y0 = 0; fy = 0; }
      if (y0 >= WH - 1) { y0 = WH - 2; fy = 1; }
      var r0 = y0 * WW, r1 = r0 + WW;
      for (var X = 0; X < OUT_W; X++) {
        var o = (Y * OUT_W + X) * 4;
        var sd = sdRoundRect(X + 0.5, Y + 0.5, R, frameR);
        // frame stroke centred on the rounded rect
        var aF = hw + 0.5 - Math.abs(sd);
        var a = aF;
        if (sd < 0) {
          var u = (X + 0.5) * inv - 0.5;
          var x0 = Math.floor(u); var fx = u - x0;
          if (x0 < 0) { x0 = 0; fx = 0; }
          if (x0 >= WW - 1) { x0 = WW - 2; fx = 1; }
          var d = (dist[r0 + x0] * (1 - fx) + dist[r0 + x0 + 1] * fx) * (1 - fy) +
            (dist[r1 + x0] * (1 - fx) + dist[r1 + x0 + 1] * fx) * fy;
          // marked pixels sit 0.5 working px from the true border
          var aL = hw + 0.5 - (d + 0.5) * S;
          if (aL > a) a = aL;
        }
        if (a <= 0) { out[o + 3] = 0; continue; }
        out[o] = INK[0]; out[o + 1] = INK[1]; out[o + 2] = INK[2];
        out[o + 3] = a >= 1 ? 255 : (a * 255) | 0;
      }
    }
  }

  // Full pipeline on working RGBA. Returns { lines: Uint8ClampedArray RGBA OUT_W x OUT_H, regions }.
  function process(rgba, R) {
    var n = WW * WH;
    var inside = insideMask(R), insideArea = 0;
    for (var i = 0; i < n; i++) insideArea += inside[i];
    var ch = toFeatures(rgba, n);
    ch = bilateral(ch, inside, 3, 18);
    var ink = detectInk(ch[0], inside);
    var lab = kmeans(ch, inside, K);
    for (i = 0; i < n; i++) if (ink[i]) lab[i] = INK_ID;
    lab = modeFilter(lab, inside, 2, 2);
    lab = modeFilter(lab, inside, 3, 1);
    var cc = components(lab, inside);
    mergeRegions(cc.comp, cc.count, ch, insideArea);
    var comp = smoothRegions(cc.comp, cc.count, 3, 2);
    var edge = new Uint8Array(n);
    borders(comp, edge);
    // Blur the distance field for smooth strokes, but never more than 0.5px above the raw
    // distance, so every border pixel keeps solid ink and regions stay closed.
    var raw = distanceField(edge);
    var dist = smoothField(smoothField(smoothField(raw)));
    for (i = 0; i < n; i++) if (dist[i] > raw[i] + 0.5) dist[i] = raw[i] + 0.5;
    var out = new Uint8ClampedArray(OUT_W * OUT_H * 4);
    render(dist, R, out);
    var seen = {}, regions = 0;
    for (i = 0; i < n; i++) { var c = comp[i]; if (c >= 0 && !seen[c]) { seen[c] = 1; regions++; } }
    return { lines: out, regions: regions };
  }

  // ---------- public API ----------

  function convert(src) {
    var smp = sample(src);
    var res = process(smp.data, smp.rect);
    var canvas = makeCanvas(OUT_W, OUT_H);
    var ctx = canvas.getContext('2d');
    var img = ctx.createImageData(OUT_W, OUT_H);
    img.data.set(res.lines);
    ctx.putImageData(img, 0, 0);
    var url = canvas.toDataURL('image/png');
    canvas.width = canvas.height = 1; // release memory early on iOS
    return { dataUrl: url, width: OUT_W, height: OUT_H, regions: res.regions };
  }

  function fromImage(img) {
    return new Promise(function (resolve, reject) {
      // Let the UI paint a "working" state before the synchronous crunch.
      setTimeout(function () {
        try { resolve(convert(img)); } catch (e) { reject(e); }
      }, 30);
    });
  }

  function fromFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file) { reject(new Error('PhotoPage: no file')); return; }
      var URL_ = window.URL || window.webkitURL;
      var url = URL_.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        fromImage(img).then(function (r) { URL_.revokeObjectURL(url); resolve(r); },
          function (e) { URL_.revokeObjectURL(url); reject(e); });
      };
      img.onerror = function () {
        URL_.revokeObjectURL(url);
        reject(new Error('PhotoPage: could not read that picture'));
      };
      img.src = url;
    });
  }

  window.PhotoPage = {
    version: 'photo-1',
    fromFile: fromFile,
    fromImage: fromImage,
    // exposed for testing
    _process: process,
    _layout: layout,
    _work: { W: WW, H: WH }
  };
})();
