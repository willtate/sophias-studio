/* Yummy Treats pages: cupcake, birthday cake, donut stack, pizza, candy jar. */
(function () {
  'use strict';
  var A = window.Art;
  var r = A.r, circle = A.circle, ellipse = A.ellipse, path = A.path, rect = A.rect, heart = A.heart;

  function pt(x, y) { return r(x) + ' ' + r(y); }
  function mx(x) { return 1600 - x; }

  // Frosting drips: scallops hanging from (x0,y) to (x1,y), alternating long and short.
  function drip(x0, x1, y, n, dLong, dShort) {
    var w = (x1 - x0) / n, d = 'M' + pt(x0, y);
    for (var i = 0; i < n; i++) {
      var dep = i % 2 ? dShort : dLong;
      d += ' Q' + pt(x0 + w * (i + 0.5), y + dep * 2) + ' ' + pt(x0 + w * (i + 1), y);
    }
    return path(d);
  }

  // Short sprinkle stroke centred on (x,y) at angle deg.
  function sprinkle(x, y, deg, len) {
    var a = deg * Math.PI / 180, h = (len || 28) / 2;
    return path('M' + pt(x - h * Math.cos(a), y - h * Math.sin(a)) + ' L' + pt(x + h * Math.cos(a), y + h * Math.sin(a)));
  }

  /* ---- ellipse geometry, for shapes that tuck behind each other ---- */
  function E(cx, cy, rx, ry) { return { cx: cx, cy: cy, rx: rx, ry: ry }; }
  function ePt(e, t) { return [e.cx + e.rx * Math.cos(t), e.cy + e.ry * Math.sin(t)]; }
  function inside(e, p) { var u = (p[0] - e.cx) / e.rx, v = (p[1] - e.cy) / e.ry; return u * u + v * v < 1; }
  // Polyline path of the part of ellipse e that is NOT covered by any ellipse in covers.
  // Endpoints are found by bisection so they land exactly on the covering outline.
  function visibleArc(e, covers) {
    function hidden(t) { var p = ePt(e, t); return covers.some(function (c) { return inside(c, p); }); }
    var N = 720, out = '', run = null, i, t;
    // start the scan at a hidden point so runs don't wrap
    var t0 = 0;
    for (i = 0; i < N; i++) { if (hidden(i / N * 2 * Math.PI)) { t0 = i / N * 2 * Math.PI; break; } }
    function edge(a, b) { // a,b straddle the visibility boundary
      var ha = hidden(a);
      for (var k = 0; k < 40; k++) { var m = (a + b) / 2; if (hidden(m) === ha) a = m; else b = m; }
      return (a + b) / 2;
    }
    var prev = t0;
    for (i = 1; i <= N; i++) {
      t = t0 + i / N * 2 * Math.PI;
      var h = hidden(t), hp = hidden(prev);
      if (hp && !h) { var s = edge(prev, t); run = 'M' + pt.apply(null, ePt(e, s)); }
      if (!h && run !== null) run += ' L' + pt.apply(null, ePt(e, t));
      if (!hp && h && run !== null) { var en = edge(prev, t); out += run + ' L' + pt.apply(null, ePt(e, en)); run = null; }
      prev = t;
    }
    return path(out);
  }

  /* ---------------- Cupcake ---------------- */
  A.page('treats', 'treats-cupcake', 'Cupcake', function () {
    // frosting swirl: right half listed, left half mirrored
    var R = [[1140, 680], [1200, 680, 1180, 560, 1075, 560], [1135, 560, 1105, 450, 1000, 450],
      [1060, 450, 1030, 345, 915, 345], [975, 345, 945, 240, 800, 240]];
    var d = 'M' + pt(mx(1140), 680) + ' L' + pt(1140, 680);
    for (var i = 1; i < R.length; i++) d += ' C' + R[i].map(function (v, j) { return r(v); }).join(' ');
    for (i = R.length - 1; i >= 1; i--) {
      var c = R[i], from = R[i - 1];
      var endX = from.length === 2 ? from[0] : from[4], endY = from.length === 2 ? from[1] : from[5];
      d += ' C' + pt(mx(c[2]), c[3]) + ' ' + pt(mx(c[0]), c[1]) + ' ' + pt(mx(endX), endY);
    }
    d += ' Z';
    var pleats = '';
    [1, 2, 6, 7].forEach(function (k) {
      var f = k / 8;
      pleats += path('M' + pt(500 + 600 * f, 680) + ' L' + pt(560 + 480 * f, 1000));
    });
    return [
      path('M380 1000 L1220 1000 L1150 1060 L450 1060 Z'),
      path('M60 1060 L1540 1060'),
      path('M500 680 L560 1000 L1040 1000 L1100 680 Z'),
      pleats,
      path(d),
      path('M' + pt(mx(1075), 560) + ' Q800 640 1075 560'),
      path('M' + pt(mx(1000), 450) + ' Q800 525 1000 450'),
      path('M' + pt(mx(915), 345) + ' Q800 400 915 345'),
      circle(800, 180, 60),
      path('M800 120 Q805 70 860 40'),
      path('M768 160 Q776 142 794 138'),
      // face
      ellipse(740, 800, 15, 21, true), ellipse(860, 800, 15, 21, true),
      path('M765 858 Q800 892 835 858'),
      circle(712, 868, 20), circle(888, 868, 20)
    ].join('');
  });

  /* ---------------- Birthday cake ---------------- */
  A.page('treats', 'treats-cake', 'Birthday Cake', function () {
    function layer(x0, x1, yTop, yBot) {
      return path('M' + x0 + ' ' + yBot + ' L' + x0 + ' ' + (yTop + 26) + ' Q' + x0 + ' ' + yTop + ' ' + (x0 + 26) + ' ' + yTop +
        ' L' + (x1 - 26) + ' ' + yTop + ' Q' + x1 + ' ' + yTop + ' ' + x1 + ' ' + (yTop + 26) + ' L' + x1 + ' ' + yBot);
    }
    var s = [
      path('M220 1040 L1380 1040 L1320 1090 L280 1090 Z'),
      path('M40 1090 L1560 1090'),
      layer(300, 1300, 780, 1040), drip(300, 1300, 815, 8, 70, 40),
      layer(430, 1170, 580, 780), drip(430, 1170, 615, 6, 60, 35),
      layer(560, 1040, 410, 580), drip(560, 1040, 445, 4, 55, 32)
    ];
    for (var i = 0; i < 6; i++) s.push(heart(425 + i * 150, 966, 40));
    for (i = 0; i < 6; i++) s.push(circle(500 + i * 120, 732, 16));
    for (i = 0; i < 5; i++) {
      var cx = 620 + i * 90, x0 = cx - 25, x1 = cx + 25, top = 280;
      s.push(path('M' + x0 + ' 410 L' + x0 + ' ' + top + ' L' + x1 + ' ' + top + ' L' + x1 + ' 410'));
      s.push(path('M' + x0 + ' ' + (top + 78) + ' L' + x1 + ' ' + (top + 50)));
      s.push(path('M' + cx + ' ' + top + ' L' + cx + ' ' + (top - 18)));
      var yb = top - 18;
      s.push(path('M' + cx + ' ' + yb + ' C' + (cx + 32) + ' ' + yb + ' ' + (cx + 24) + ' ' + (yb - 42) + ' ' + cx + ' ' + (yb - 74) +
        ' C' + (cx - 24) + ' ' + (yb - 42) + ' ' + (cx - 32) + ' ' + yb + ' ' + cx + ' ' + yb + ' Z'));
    }
    return s.join('');
  });

  /* ---------------- Donut stack ---------------- */
  A.page('treats', 'treats-donuts', 'Donut Tower', function () {
    var rx = 380, ry = 165;
    var d1 = E(830, 400, rx, ry), d2 = E(775, 615, rx, ry), d3 = E(805, 830, rx, ry);
    var plate = E(800, 955, 540, 90);
    // icing edge: drips between two points on the donut outline, a little below its middle
    function icing(e, n) {
      var y = e.cy + 30, half = e.rx * Math.sqrt(1 - Math.pow(30 / e.ry, 2));
      var x0 = e.cx - half, w = 2 * half / n, d = 'M' + pt(x0, y);
      for (var i = 0; i < n; i++) {
        var xm = x0 + w * (i + 0.5), u = (xm - e.cx) / e.rx, sN = 1 - u * u;
        var dep = (i % 2 ? 48 : 80) * sN, xa = x0 + w * i;
        d += ' C' + pt(xa + w * 0.05, y + dep * 1.33) + ' ' + pt(xa + w * 0.95, y + dep * 1.33) + ' ' + pt(xa + w, y);
      }
      return path(d);
    }
    var sp = [
      [650, 330, 30], [740, 282, -20], [930, 282, 25], [1010, 330, -35], [640, 405, -10], [1020, 405, 15], [560, 360, 70], [1100, 360, -70],
      [520, 560, 35], [1030, 580, -30], [470, 610, -60], [1080, 625, 60],
      [560, 780, 25], [1060, 800, -25], [510, 830, -50], [1110, 835, 55]
    ];
    var s = [
      visibleArc(plate, [d3]),
      path('M40 955 L' + (800 - 540) + ' 955'), path('M' + (800 + 540) + ' 955 L1560 955'),
      visibleArc(d3, [d2]), icing(d3, 5),
      visibleArc(d2, [d1]), icing(d2, 5),
      ellipse(d1.cx, d1.cy, rx, ry), icing(d1, 5),
      ellipse(d1.cx, d1.cy - 60, 95, 34)
    ];
    sp.forEach(function (p) { s.push(sprinkle(p[0], p[1], p[2])); });
    return s.join('');
  });

  /* ---------------- Pizza ---------------- */
  A.page('treats', 'treats-pizza', 'Pizza Party', function () {
    var cx = 800, cy = 600, Rb = 520, Ro = 465;
    var hy = 44, hx = cx + Math.sqrt(Rb * Rb - hy * hy);
    var s = [
      circle(cx, cy, Rb),
      path('M' + pt(hx, cy - hy) + ' L1500 ' + (cy - hy) + ' A44 44 0 0 1 1500 ' + (cy + hy) + ' L' + pt(hx, cy + hy)),
      circle(1500, cy, 14),
      circle(cx, cy, Ro), cheeseEdge()
    ];
    function cheeseEdge() {
      var d = '';
      for (var i = 0; i < 360; i += 2) {
        var t = i * Math.PI / 180, rr = 412 + 10 * Math.cos(18 * t);
        d += (i ? ' L' : 'M') + pt(cx + rr * Math.cos(t), cy + rr * Math.sin(t));
      }
      return path(d + ' Z');
    }
    for (var k = 0; k < 6; k++) {
      var a = (k * 60 - 90) * Math.PI / 180;
      s.push(path('M' + cx + ' ' + cy + ' L' + pt(cx + Ro * Math.cos(a), cy + Ro * Math.sin(a))));
      var m = a + Math.PI / 6;
      var px = cx + 210 * Math.cos(m), py = cy + 210 * Math.sin(m);
      s.push(circle(r(px), r(py), 58));
      if (k % 2 === 0) {
        // basil leaf lying along the crust
        var lx = cx + 335 * Math.cos(m), ly = cy + 335 * Math.sin(m), deg = m * 180 / Math.PI + 90;
        s.push(A.place(path('M-66 0 C-30 -46 30 -46 66 0 C30 46 -30 46 -66 0 Z') + path('M-40 0 L42 0'), r(lx), r(ly), 1, r(deg)));
      } else {
        [-0.17, 0.17].forEach(function (o) {
          var ox = cx + 335 * Math.cos(m + o), oy = cy + 335 * Math.sin(m + o);
          s.push(circle(r(ox), r(oy), 28), circle(r(ox), r(oy), 9, true));
        });
      }
    }
    return s.join('');
  });

  /* ---------------- Candy jar ---------------- */
  A.page('treats', 'treats-candy-jar', 'Candy Jar', function () {
    function wrapped(cx, cy, deg) {
      var k = 1.2, bx = 55 * k, by = 40 * k, t = 0.45, ex = bx * Math.cos(t), ey = by * Math.sin(t);
      var sx = 18 * k, sy = by * Math.sqrt(1 - sx * sx / (bx * bx)), fx = 112 * k, fy = 36 * k, qx = 100 * k, qs = 32 * k;
      var g = ellipse(0, 0, r(bx), r(by)) +
        path('M' + pt(-ex, -ey) + ' L' + pt(-fx, -fy) + ' Q' + pt(-qx, 0) + ' ' + pt(-fx, fy) + ' L' + pt(-ex, ey)) +
        path('M' + pt(ex, -ey) + ' L' + pt(fx, -fy) + ' Q' + pt(qx, 0) + ' ' + pt(fx, fy) + ' L' + pt(ex, ey)) +
        path('M' + pt(-sx, -sy) + ' Q' + pt(-qs, 0) + ' ' + pt(-sx, sy) + ' M' + pt(sx, -sy) + ' Q' + pt(qs, 0) + ' ' + pt(sx, sy));
      return A.place(g, cx, cy, 1, deg || 0);
    }
    function mint(cx, cy, rad) {
      var g = circle(cx, cy, rad);
      for (var i = 0; i < 6; i++) {
        var a = i * Math.PI / 3, c = a - 0.7;
        g += path('M' + cx + ' ' + cy + ' Q' + pt(cx + rad * 0.6 * Math.cos(c), cy + rad * 0.6 * Math.sin(c)) + ' ' +
          pt(cx + rad * Math.cos(a), cy + rad * Math.sin(a)));
      }
      return g;
    }
    function lolly(cx, cy, rad, sx) {
      var dx = sx - cx, dy = 380 - cy, L = Math.sqrt(dx * dx + dy * dy);
      return mint(cx, cy, rad) + path('M' + pt(cx + rad * dx / L, cy + rad * dy / L) + ' L' + sx + ' 380');
    }
    return [
      path('M60 1040 L1540 1040'),
      lolly(560, 245, 100, 670), lolly(800, 150, 108, 800), lolly(1040, 245, 100, 930),
      rect(560, 380, 480, 60, 22),
      path('M590 440 L590 470 C590 520 400 520 400 640 L400 980 Q400 1040 460 1040 L1140 1040 Q1200 1040 1200 980 ' +
        'L1200 640 C1200 520 1010 520 1010 470 L1010 440'),
      wrapped(620, 630, -8), mint(860, 622, 60), mint(1090, 640, 60),
      mint(520, 795, 62), wrapped(785, 790, 10), mint(1045, 795, 62),
      wrapped(600, 945, 4), mint(858, 950, 55), mint(1080, 945, 58)
    ].join('');
  });
})();
