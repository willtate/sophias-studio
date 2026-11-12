/* Paint bucket flood fill.
   Regions are bounded by the line art (mask) and by paint of a different colour. */
(function () {
  'use strict';

  // lineMask: Uint8Array, 1 where the line art is drawn.
  // img: ImageData of the paint layer (modified in place).
  // colorFn(x, y) -> [r, g, b]
  // linesOnly: the region is the whole shape between the outlines, whatever paint is
  // already in it (what a child expects on a coloring page). Otherwise the region is
  // bounded by paint of a different colour too (blank page).
  function floodFill(img, lineMask, sx, sy, colorFn, tolerance, linesOnly) {
    var W = img.width, H = img.height, d = img.data;
    tolerance = tolerance == null ? 48 : tolerance;
    if (linesOnly) tolerance = 1e9;
    sx = Math.round(sx); sy = Math.round(sy);
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) return false;

    // If the tap landed on a line, nudge to the nearest open pixel.
    if (lineMask[sy * W + sx]) {
      var found = false;
      for (var rad = 1; rad <= 10 && !found; rad++) {
        for (var dy = -rad; dy <= rad && !found; dy++) {
          for (var dx = -rad; dx <= rad && !found; dx++) {
            var nx = sx + dx, ny = sy + dy;
            if (nx >= 0 && ny >= 0 && nx < W && ny < H && !lineMask[ny * W + nx]) {
              sx = nx; sy = ny; found = true;
            }
          }
        }
      }
      if (!found) return false;
    }

    var si = (sy * W + sx) * 4;
    var tr = d[si], tg = d[si + 1], tb = d[si + 2];
    var filled = new Uint8Array(W * H);

    function match(p) {
      if (filled[p] || lineMask[p]) return false;
      var i = p * 4;
      return Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) <= tolerance;
    }

    // Scanline fill.
    var stack = [sx, sy];
    while (stack.length) {
      var y = stack.pop(), x = stack.pop();
      var p = y * W + x;
      while (x > 0 && match(p - 1)) { x--; p--; }
      var up = false, down = false;
      while (x < W && match(p)) {
        filled[p] = 1;
        if (y > 0) {
          if (match(p - W)) { if (!up) { stack.push(x, y - 1); up = true; } } else up = false;
        }
        if (y < H - 1) {
          if (match(p + W)) { if (!down) { stack.push(x, y + 1); down = true; } } else down = false;
        }
        x++; p++;
      }
    }

    // Grow 2px into line pixels and soft edges so no white halo is left
    // next to the outlines or crayon edges.
    for (var pass = 0; pass < (linesOnly ? 3 : 2); pass++) {
      var grow = [];
      for (var yy = 1; yy < H - 1; yy++) {
        var row = yy * W;
        for (var xx = 1; xx < W - 1; xx++) {
          var q = row + xx;
          if (filled[q]) continue;
          if (filled[q - 1] || filled[q + 1] || filled[q - W] || filled[q + W]) {
            if (lineMask[q]) { grow.push(q); continue; }
            var k = q * 4;
            if (!linesOnly && Math.abs(d[k] - tr) + Math.abs(d[k + 1] - tg) + Math.abs(d[k + 2] - tb) <= 200) grow.push(q);
          }
        }
      }
      for (var g = 0; g < grow.length; g++) filled[grow[g]] = 1;
    }

    // Returns the changed area {x, y, w, h}, or null if nothing was filled.
    var n = W * H, any = false, x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (var j = 0; j < n; j++) {
      if (!filled[j]) continue;
      any = true;
      var px = j % W, py = (j / W) | 0;
      if (px < x0) x0 = px; if (px > x1) x1 = px;
      if (py < y0) y0 = py; if (py > y1) y1 = py;
      var c = colorFn(px, py);
      var o = j * 4;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    return any ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : null;
  }

  function buildLineMask(lineCtx, W, H) {
    var data = lineCtx.getImageData(0, 0, W, H).data;
    var mask = new Uint8Array(W * H);
    for (var i = 0, p = 3; i < mask.length; i++, p += 4) {
      if (data[p] > 90) mask[i] = 1;
    }
    return mask;
  }

  window.ColorFill = { floodFill: floodFill, buildLineMask: buildLineMask };
})();
