/* Under the Sea: octopus, whale, sea turtle, crab, seahorse & jellyfish. */
(function () {
  'use strict';
  var A = window.Art;
  var r = A.r, circle = A.circle, ellipse = A.ellipse, path = A.path, star = A.star, mirror = A.mirror;

  // ---- curve toolkit: outlines are lists of cubic segments [p0, c1, c2, p3] ----
  function pt(p) { return r(p[0]) + ' ' + r(p[1]); }
  // Smooth Catmull-Rom curve through points.
  function cr(pts, closed) {
    var n = pts.length, segs = [], m = closed ? n : n - 1;
    function g(i) { return closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; }
    for (var i = 0; i < m; i++) {
      var p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      segs.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
        [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
    }
    return segs;
  }
  function dOf(segs, closed) {
    var s = 'M' + pt(segs[0][0]);
    segs.forEach(function (g) { s += ' C' + pt(g[1]) + ' ' + pt(g[2]) + ' ' + pt(g[3]); });
    return s + (closed ? ' Z' : '');
  }
  function bz(g, t) {
    var u = 1 - t;
    return [u * u * u * g[0][0] + 3 * u * u * t * g[1][0] + 3 * u * t * t * g[2][0] + t * t * t * g[3][0],
      u * u * u * g[0][1] + 3 * u * u * t * g[1][1] + 3 * u * t * t * g[2][1] + t * t * t * g[3][1]];
  }
  // Point where segment a->b first crosses the outline (closest to a).
  function hit(segs, a, b) {
    var best = null, bestS = 2;
    segs.forEach(function (g) {
      var prev = bz(g, 0);
      for (var i = 1; i <= 200; i++) {
        var cur = bz(g, i / 200);
        var dx = b[0] - a[0], dy = b[1] - a[1], ex = cur[0] - prev[0], ey = cur[1] - prev[1];
        var den = dx * ey - dy * ex;
        if (Math.abs(den) > 1e-9) {
          var s = ((prev[0] - a[0]) * ey - (prev[1] - a[1]) * ex) / den;
          var u = ((prev[0] - a[0]) * dy - (prev[1] - a[1]) * dx) / den;
          if (s >= 0 && s <= 1 && u >= 0 && u <= 1 && s < bestS) { bestS = s; best = [a[0] + s * dx, a[1] + s * dy]; }
        }
        prev = cur;
      }
    });
    if (!best) throw new Error('no hit ' + a + ' -> ' + b);
    return best;
  }
  // Ellipse as 4 cubic segments (for hit tests).
  function ellSegs(cx, cy, rx, ry) {
    var k = 0.5523, segs = [];
    var q = [[cx + rx, cy], [cx, cy + ry], [cx - rx, cy], [cx, cy - ry]];
    var tx = [[0, 1], [-1, 0], [0, -1], [1, 0]];
    for (var i = 0; i < 4; i++) {
      var p0 = q[i], p3 = q[(i + 1) % 4], t0 = tx[i], t1 = tx[(i + 1) % 4];
      segs.push([p0, [p0[0] + t0[0] * k * rx, p0[1] + t0[1] * k * ry],
        [p3[0] - t1[0] * k * rx, p3[1] - t1[1] * k * ry], p3]);
    }
    return segs;
  }
  function onEll(cx, cy, rx, ry, deg) {
    var a = deg * Math.PI / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  }
  // Two side lines of a tapered band along a centreline.
  function sides(cl, w0, w1) {
    var n = cl.length, L = [], R = [];
    for (var i = 0; i < n; i++) {
      var a = cl[Math.max(0, i - 1)], b = cl[Math.min(n - 1, i + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      var nx = -dy / len, ny = dx / len, w = (w0 + (w1 - w0) * i / (n - 1)) / 2;
      L.push([cl[i][0] + nx * w, cl[i][1] + ny * w]);
      R.push([cl[i][0] - nx * w, cl[i][1] - ny * w]);
    }
    return { L: L, R: R };
  }
  // A tapered limb with a rounded tip whose root ends land exactly on rootA / rootB.
  function limb(cl, w0, w1, rootA, rootB) {
    var s = sides(cl, w0, w1), n = cl.length;
    var e = cl[n - 1], p = cl[n - 2], dl = Math.hypot(e[0] - p[0], e[1] - p[1]);
    var tip = [e[0] + (e[0] - p[0]) / dl * w1 / 2, e[1] + (e[1] - p[1]) / dl * w1 / 2];
    var L = s.L.slice(), R = s.R.slice();
    if (rootA) {
      var dA = Math.hypot(rootA[0] - L[0][0], rootA[1] - L[0][1]), dB = Math.hypot(rootA[0] - R[0][0], rootA[1] - R[0][1]);
      if (dB < dA) { var t = L; L = R; R = t; }
      L[0] = rootA; R[0] = rootB;
    }
    return path(dOf(cr(L.concat([tip], R.reverse()), false), false));
  }
  // Wavy sea floor across the full width; returns its path and a height function.
  // sym: mirror-symmetric about the page centre (for mirrored subjects).
  function floor(y0, amp, sym) {
    var n = sym ? 3 : 4, w = 1600 / n, d = 'M0 ' + y0;
    function sg(k) { return k % 2 ? 1 : -1; }
    for (var i = 0; i < n; i++) d += ' Q' + r(i * w + w / 2) + ' ' + (y0 + sg(i) * 2 * amp) + ' ' + r(i * w + w) + ' ' + y0;
    return {
      d: path(d),
      y: function (x) {
        var k = Math.min(n - 1, Math.floor(x / w)), t = (x - k * w) / w;
        return y0 + sg(k) * 2 * amp * 2 * t * (1 - t);
      }
    };
  }
  // Wavy line from a to b (same-ish y), bumps of about `per` px, ends exactly on a and b.
  function wave(a, b, amp, per) {
    var n = Math.max(1, Math.round(Math.abs(b[0] - a[0]) / per)), s = 'M' + pt(a);
    for (var i = 0; i < n; i++) {
      var x0 = a[0] + (b[0] - a[0]) * i / n, x1 = a[0] + (b[0] - a[0]) * (i + 1) / n;
      var y0 = a[1] + (b[1] - a[1]) * i / n, y1 = a[1] + (b[1] - a[1]) * (i + 1) / n;
      s += ' Q' + r((x0 + x1) / 2) + ' ' + r((y0 + y1) / 2 - amp * 2) + ' ' + r(x1) + ' ' + r(y1);
    }
    return path(s);
  }
  // Seaweed blade growing from the floor.
  function seaweed(fl, x, h, w, sway) {
    var cl = [], base = fl.y(x);
    for (var i = 0; i <= 6; i++) {
      cl.push([x + sway * Math.sin(i * 1.1), base - h * i / 6]);
    }
    return limb(cl, w, 14, [x - w / 2, fl.y(x - w / 2)], [x + w / 2, fl.y(x + w / 2)]);
  }
  // Scallop shell sitting in the sand (base at x,y).
  function shell(x, y, s) {
    var L = [x - 0.45 * s, y - 0.7 * s], R = [x + 0.45 * s, y - 0.7 * s], C = [x, y - 1.35 * s];
    function q(t) {
      var u = 1 - t;
      return [u * u * L[0] + 2 * u * t * C[0] + t * t * R[0], u * u * L[1] + 2 * u * t * C[1] + t * t * R[1]];
    }
    var b1 = [x - 0.13 * s, y], b2 = [x + 0.13 * s, y];
    return path('M' + pt(b1) + ' L' + pt(L) + ' Q' + pt(C) + ' ' + pt(R) + ' L' + pt(b2) + ' Z') +
      path('M' + r(x - 0.05 * s) + ' ' + y + ' L' + pt(q(1 / 3)) + ' M' + r(x + 0.05 * s) + ' ' + y + ' L' + pt(q(2 / 3)));
  }
  function eye(x, y, rr, px, py) {
    return circle(x, y, rr) + circle(x + (px || 0), y + (py || 0), Math.round(rr * 0.45), true);
  }
  function bubbles(list) { return list.map(function (b) { return circle(b[0], b[1], b[2]); }).join(''); }

  // ---------------------------------------------------------------- octopus
  A.page('sea', 'sea-octopus', 'Octopus', function () {
    var cx = 800, cy = 420, rx = 300, ry = 270;
    function rimY(x) { return cy + ry * Math.sqrt(1 - Math.pow((x - cx) / rx, 2)); }
    function root(x) { return [x, rimY(x)]; }
    var half = [
      // three tentacles on the left (mirrored for the right)
      limb([[583, 600], [520, 700], [420, 775], [320, 795], [245, 755], [240, 685]], 92, 52, root(540), root(627)),
      limb([[670, 660], [632, 790], [565, 895], [485, 950], [420, 925]], 90, 50, root(627), root(713)),
      limb([[756, 684], [742, 810], [705, 925], [645, 995], [578, 1005]], 90, 48, root(713), root(800)),
      // face (one side)
      ellipse(700, 410, 52, 62), circle(712, 425, 25, true),
      circle(640, 520, 30)
    ].join('');
    var fl = floor(1100, 14);
    return [
      ellipse(cx, cy, rx, ry),
      half, mirror(half),
      path('M740 530 Q800 585 860 530'),
      // spots on the head
      circle(800, 250, 34), circle(690, 270, 22), circle(910, 270, 22),
      fl.d,
      seaweed(fl, 120, 330, 70, 26), seaweed(fl, 1470, 300, 70, 22), seaweed(fl, 1300, 200, 56, -20),
      shell(240, 1170, 110),
      star(1180, 1140, 42, 22, 0.25),
      bubbles([[1250, 260, 40], [1330, 170, 26], [1260, 110, 18], [340, 300, 30], [270, 210, 18]])
    ].join('');
  });

  // ---------------------------------------------------------------- whale
  A.page('sea', 'sea-whale', 'Whale', function () {
    var body = cr([[1250, 590], [1120, 680], [950, 750], [750, 780], [550, 765], [390, 705], [290, 600],
      [280, 480], [350, 385], [480, 320], [660, 300], [850, 320], [1020, 390], [1140, 460], [1230, 500]], false);
    var tail = [
      [[1230, 500], [1265, 440], [1255, 370], [1225, 300]],
      [[1225, 300], [1305, 315], [1365, 360], [1385, 415]],
      [[1385, 415], [1430, 355], [1490, 320], [1565, 320]],
      [[1565, 320], [1530, 420], [1430, 500], [1340, 540]],
      [[1340, 540], [1300, 560], [1275, 575], [1250, 590]]
    ];
    var segs = body.concat(tail);
    var wl = 650;
    var wlL = hit(segs, [0, wl], [600, wl]), wlR = hit(segs, [1600, wl], [1000, wl]);
    // water spout standing on the head
    var sx = 615, top = 205, cw = 60;
    var b1 = hit(segs, [sx - cw, 150], [sx - cw, 420]), b2 = hit(segs, [sx + cw, 150], [sx + cw, 420]);
    var jet = [[sx - cw / 2, top], [sx - 45, top - 62], [sx - 100, top - 105], [sx - 170, top - 102], [sx - 218, top - 62], [sx - 230, top - 5]];
    var jetR = jet.map(function (p) { return [2 * sx - p[0], p[1]]; });
    var spout = path('M' + pt(b1) + ' L' + (sx - cw) + ' ' + top) + path('M' + pt(b2) + ' L' + (sx + cw) + ' ' + top) +
      limb(jet, cw, 36, [sx - cw, top], [sx, top]) + limb(jetR, cw, 36, [sx, top], [sx + cw, top]);
    // belly line and flipper
    var bl1 = hit(segs, [480, 610], [200, 610]), bl2 = hit(segs, [1050, 600], [1050, 900]);
    var f1 = hit(segs, [640, 700], [640, 900]), f2 = hit(segs, [770, 700], [770, 900]);
    return [
      path(dOf(segs, true)),
      spout,
      circle(385, 268, 18), circle(845, 268, 18), circle(340, 175, 14), circle(890, 175, 14), circle(615, 48, 16),
      path('M' + pt(bl1) + ' Q680 730 ' + pt(bl2)),
      path('M' + pt(f1) + ' C620 820 560 880 520 930 C640 940 740 880 ' + pt(f2)),
      eye(440, 470, 40, 8, 6),
      path('M335 565 Q395 615 465 585'),
      circle(510, 545, 26),
      wave([0, wl], wlL, 12, 110), wave(wlR, [1600, wl], 12, 110),
      wave([60, 820], [330, 820], 10, 90), wave([1150, 860], [1450, 860], 10, 100), wave([900, 1040], [1200, 1040], 10, 100),
      A.sun(170, 170, 62),
      A.cloud(980, 190, 240),
      bubbles([[300, 980, 34], [380, 1090, 22], [1400, 1060, 30], [1470, 980, 18]])
    ].join('');
  });

  // ---------------------------------------------------------------- sea turtle
  A.page('sea', 'sea-turtle', 'Sea turtle', function () {
    var cx = 840, cy = 620, rx = 370, ry = 330;
    var shellSegs = ellSegs(cx, cy, rx, ry);
    var x0 = cx - rx, x1 = cx + rx, pc = 760;            // belly curve control y
    function bel(t) {
      var u = 1 - t;
      return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * cy + 2 * u * t * pc + t * t * cy];
    }
    // shell top half + bottom line
    var dome = 'M' + x0 + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 0 1 ' + x1 + ' ' + cy + ' Z';
    // shell plates: hexagon + rays
    var hx = cx, hy = 470, hr = 105, hex = [], s = '';
    for (var i = 0; i < 6; i++) hex.push([hx + hr * Math.cos(i * Math.PI / 3), hy + hr * Math.sin(i * Math.PI / 3)]);
    [0, 3, 4, 5].forEach(function (i) {
      var v = hex[i], dx = v[0] - hx, dy = v[1] - hy;
      var e = hit(shellSegs, v, [v[0] + dx * 6, v[1] + dy * 6]);
      s += 'M' + pt(v) + ' L' + pt(e) + ' ';
    });
    [1, 2].forEach(function (i) {
      var v = hex[i], dx = v[0] - hx, dy = v[1] - hy, k = (cy - v[1]) / dy;
      s += 'M' + pt(v) + ' L' + pt([v[0] + dx * k, cy]) + ' ';
    });
    // head + neck: from shell rim to belly curve
    var n1 = hit(shellSegs, [600, 570], [300, 570]), n2 = bel(0.12);
    var head = cr([n1, [415, 505], [320, 415], [200, 425], [145, 530], [190, 645], [330, 705], n2], false);
    // flippers hang from the belly curve
    var fa = bel(0.22), fb = bel(0.40), ba = bel(0.66), bb = bel(0.82);
    var t1 = hit(shellSegs, [1100, 585], [1400, 585]), t2 = bel(0.97);
    var fl = floor(1100, 14);
    return [
      '<g transform="translate(800 640) scale(1.08) translate(-760 -640)">',
      path(dome),
      path('M' + x0 + ' ' + cy + ' Q' + cx + ' ' + pc + ' ' + x1 + ' ' + cy),
      path(s + 'M' + hex.map(pt).join(' L') + ' Z'),
      path(dOf(head, false)),
      path('M' + pt(fa) + ' C' + r(fa[0] - 40) + ' ' + 800 + ' 470 880 360 940 C480 980 650 880 ' + pt(fb)),
      path('M' + pt(ba) + ' C1080 840 1150 900 1230 920 C1240 860 1180 760 ' + pt(bb)),
      path('M' + pt(t1) + ' Q1260 620 1290 660 Q1240 670 ' + pt(t2)),
      eye(275, 515, 44, -8, 4),
      path('M200 600 Q245 640 300 615'),
      circle(350, 595, 24),
      '</g>',
      fl.d,
      seaweed(fl, 110, 360, 70, -24), seaweed(fl, 260, 220, 56, 20), seaweed(fl, 1470, 320, 70, -26),
      shell(1250, 1175, 100),
      star(560, 1150, 40, 20, 0.1),
      bubbles([[120, 330, 30], [90, 230, 20], [150, 150, 14], [1350, 230, 34], [1440, 150, 22]])
    ].join('');
  });

  // ---------------------------------------------------------------- crab
  A.page('sea', 'sea-crab', 'Crab', function () {
    var cx = 800, cy = 690, rx = 310, ry = 185;
    var fl = floor(975, 12, true);
    function E(deg) { return onEll(cx, cy, rx, ry, deg); }
    function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
    var half = [];
    // claw: circle with a notch, opening upward
    var kx = 330, ky = 360, kr = 125, op = -95, ow = 30;
    var oa = (op + ow) * Math.PI / 180, ob = (op - ow) * Math.PI / 180;
    var pa = [kx + kr * Math.cos(oa), ky + kr * Math.sin(oa)], pb = [kx + kr * Math.cos(ob), ky + kr * Math.sin(ob)];
    half.push(path('M' + r(kx + 10) + ' ' + r(ky - 5) + ' L' + pt(pa) + ' A' + kr + ' ' + kr + ' 0 1 1 ' + pt(pb) + ' Z'));
    // arm from body to claw
    var r1 = E(200), r2 = E(224);
    var ang = 62, dl = 22;
    var c1 = [kx + kr * Math.cos((ang - dl) * Math.PI / 180), ky + kr * Math.sin((ang - dl) * Math.PI / 180)];
    var c2 = [kx + kr * Math.cos((ang + dl) * Math.PI / 180), ky + kr * Math.sin((ang + dl) * Math.PI / 180)];
    half.push(path('M' + pt(r2) + ' Q505 480 ' + pt(c1)));
    half.push(path('M' + pt(r1) + ' Q430 590 ' + pt(c2)));
    // legs
    [[134, 150, 470], [158, 173, 335], [180, 194, 200]].forEach(function (L, i) {
            var tx = L[2], ty = fl.y(tx);
      var up = E(L[1]), lo = E(L[0]);
      half.push(path('M' + pt(up) + ' C' + r(up[0] - 120 - 25 * i) + ' ' + r(up[1] - 50 - 15 * i) + ' ' + (tx - 25) + ' ' + r(ty - 230) + ' ' + tx + ' ' + r(ty) +
        ' C' + (tx + 35) + ' ' + r(ty - 170) + ' ' + r(lo[0] - 80 - 20 * i) + ' ' + r(lo[1] - 20 - 15 * i) + ' ' + pt(lo)));
    });
    // eye stalk + eye
    var ex = 690, ey = 320, er = 66;
    var s1 = [ex + er * Math.cos(100 * Math.PI / 180), ey + er * Math.sin(100 * Math.PI / 180)];
    var s2 = [ex + er * Math.cos(62 * Math.PI / 180), ey + er * Math.sin(62 * Math.PI / 180)];
    var bodySegs = ellSegs(cx, cy, rx, ry);
    var g1 = hit(bodySegs, [695, 400], [695, 600]), g2 = hit(bodySegs, [745, 400], [745, 600]);
    half.push(path('M' + pt(s1) + ' Q' + r(s1[0] + 10) + ' ' + r(s1[1] + 60) + ' ' + pt(g1)));
    half.push(path('M' + pt(s2) + ' Q' + r(s2[0] + 6) + ' ' + r(s2[1] + 60) + ' ' + pt(g2)));
    half.push(eye(ex, ey, er, 10, 8));
    half.push(circle(640, 720, 34));
    return [
      ellipse(cx, cy, rx, ry),
      half.join(''), mirror(half.join('')),
      path('M730 750 Q800 810 870 750'),
      circle(800, 580, 26), circle(720, 610, 16), circle(880, 610, 16),
      fl.d,
      shell(260, 1140, 120), shell(1330, 1150, 100),
      star(800, 1110, 50, 26, 0.15),
      ellipse(560, 1120, 40, 22), ellipse(1060, 1130, 34, 20),
      bubbles([[150, 220, 34], [230, 120, 20], [1450, 200, 38], [1370, 100, 22], [1500, 520, 18]])
    ].join('');
  });

  // ---------------------------------------------------------------- seahorse + jellyfish
  A.page('sea', 'sea-seahorse', 'Seahorse & jelly', function () {
    // seahorse facing right; tail curls forward under the belly
    var front = [[560, 205], [650, 210], [715, 250], [765, 302], [830, 300], [868, 312], [880, 345], [866, 378],
      [810, 382], [745, 395], [705, 445], [710, 510], [750, 590], [775, 690], [750, 790]];
    var tcx = 690, tcy = 975, tcl = [[625, 815], [605, 885]];
    for (var a = 185; a >= -75; a -= 20) {
      var rad = 95 - 45 * (185 - a) / 260, th = a * Math.PI / 180;
      tcl.push([tcx + rad * Math.cos(th), tcy + rad * Math.sin(th)]);
    }
    var tail = sides(tcl, 116, 34);
    var n = tcl.length, te = tcl[n - 1], tp = tcl[n - 2], tdl = Math.hypot(te[0] - tp[0], te[1] - tp[1]);
    var tip = [te[0] + (te[0] - tp[0]) / tdl * 18, te[1] + (te[1] - tp[1]) / tdl * 18];
    var back = [[490, 740], [470, 620], [500, 500], [520, 420], [490, 340], [500, 260]];
    // the tail curls forward, so its front side is the inside of the curl
    var pts = front.concat(tail.R, [tip], tail.L.slice().reverse(), back);
    var segs = cr(pts, true);
    // belly stripes
    var stripes = '';
    [[560, 540], [585, 640], [600, 740]].forEach(function (s) {
      var p1 = hit(segs, [s[0], s[1]], [s[0] - 300, s[1] + 30]), p2 = hit(segs, [s[0], s[1]], [s[0] + 300, s[1] - 30]);
      stripes += path('M' + pt(p1) + ' Q' + r((p1[0] + p2[0]) / 2) + ' ' + r((p1[1] + p2[1]) / 2 + 25) + ' ' + pt(p2));
    });
    // back fin
    var fn1 = hit(segs, [600, 470], [300, 470]), fn2 = hit(segs, [600, 640], [300, 640]);
    var finSeg = [[fn1, [fn1[0] - 70, fn1[1] - 20], [370, 520], [370, 555]], [[370, 555], [370, 590], [fn2[0] - 70, fn2[1] + 20], fn2]];
    var fin = path(dOf(finSeg, false));
    [520, 590].forEach(function (y) {
      var a = hit(segs, [600, y], [300, y]), b = hit(finSeg, a, [a[0] - 300, a[1] + (y - 555) * 0.6]);
      fin += path('M' + pt(a) + ' L' + pt(b));
    });
    // little crown
    var cr1 = hit(segs, [580, 320], [580, 100]), cr2 = hit(segs, [650, 320], [650, 100]);
    var crown = path('M' + pt(cr1) + ' C570 150 600 135 612 170 C625 130 662 140 ' + pt(cr2));
    // jellyfish
    var jx = 1250, jy = 490, jw = 230;
    var scal = '', xs = [];
    for (var i = 0; i <= 4; i++) xs.push(jx + jw - i * jw / 2);
    for (i = 0; i < 4; i++) scal += ' Q' + r((xs[i] + xs[i + 1]) / 2) + ' ' + (jy + 60) + ' ' + r(xs[i + 1]) + ' ' + jy;
    var bell = path('M' + (jx - jw) + ' ' + jy + ' C' + (jx - jw) + ' ' + (jy - 300) + ' ' + (jx + jw) + ' ' + (jy - 300) + ' ' + (jx + jw) + ' ' + jy + scal);
    var tents = '';
    for (i = 0; i < 4; i++) {
      var tx = (xs[i] + xs[i + 1]) / 2, ty = jy + 30;
      var d = 'M' + r(tx) + ' ' + ty, yy = ty, sgn = i % 2 ? 1 : -1;
      for (var k = 0; k < 4; k++) {
        d += ' Q' + r(tx + sgn * 34) + ' ' + (yy + 45) + ' ' + r(tx) + ' ' + (yy + 90);
        yy += 90; sgn = -sgn;
      }
      tents += path(d);
    }
    var fl = floor(1120, 12);
    return [
      '<g transform="translate(640 1050) scale(1.12) translate(-640 -1050)">',
      path(dOf(segs, true)),
      stripes, fin, crown,
      eye(700, 285, 38, 8, 2),
      circle(660, 350, 22),
      path('M748 352 Q775 372 805 355'),
      '</g>',
      bell, tents,
      eye(1172, 410, 38, 4, 6), eye(1328, 410, 38, 4, 6),
      path('M1215 448 Q1250 476 1285 448'),
      circle(1100, 452, 20), circle(1400, 452, 20),
      fl.d,
      seaweed(fl, 110, 420, 74, -26), seaweed(fl, 265, 260, 60, 22), seaweed(fl, 1505, 270, 66, 18),
      shell(1150, 1185, 90),
      star(950, 1160, 36, 18, 0.2),
      bubbles([[1000, 190, 30], [1060, 110, 20], [990, 55, 14], [1500, 180, 26]])
    ].join('');
  });
})();
