/* Garden & bugs: a snail with mushrooms, a ladybug family. */
(function () {
  'use strict';
  var A = window.Art;
  var r = A.r, circle = A.circle, ellipse = A.ellipse, path = A.path, sun = A.sun, cloud = A.cloud,
    flower = A.flower, place = A.place;

  function onC(cx, cy, R, deg) {
    var a = deg * Math.PI / 180;
    return [r(cx + R * Math.cos(a)), r(cy + R * Math.sin(a))];
  }
  function bz(p0, p1, p2, p3, t) {
    var u = 1 - t;
    return [r(u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]),
      r(u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1])];
  }
  function P(p) { return p[0] + ' ' + p[1]; }
  function eye(x, y, rx, ry) {
    return ellipse(x, y, rx, ry) + circle(x, r(y + ry * 0.12), Math.round(rx * 0.5), true);
  }

  // ---- Snail ----
  // Leaf top edge: quadratic (120,960) -> (800,840) -> (1480,960); x runs linearly with t.
  function leafTop(x) {
    var t = (x - 120) / 1360;
    return r(960 - 240 * t * (1 - t));
  }

  A.page('garden', 'garden-snail', 'Snail', function () {
    var sx = 800, sy = 640, sR = 205;
    // spiral of half circles along y = sy, ending on the shell rim
    var xs = [810, 870, 750, 920, 690, sx + sR], spiral = 'M' + xs[0] + ' ' + sy;
    for (var i = 1; i < xs.length; i++) {
      var rad = Math.abs(xs[i] - xs[i - 1]) / 2;
      spiral += ' A' + rad + ' ' + rad + ' 0 0 1 ' + xs[i] + ' ' + sy;
    }
    var tailEnd = onC(sx, sy, sR, 125), neck = onC(sx, sy, sR, 35);
    var H = [[1130, 540], [1210, 520], [1265, 585], [1255, 665]];
    var body = path('M440 ' + leafTop(440) + ' Q590 895 ' + P(tailEnd)) +
      path('M' + P(neck) + ' C1040 720 1060 560 ' + P(H[0]) + ' C' + P(H[1]) + ' ' + P(H[2]) + ' ' + P(H[3]) +
        ' C1245 760 1255 860 1295 ' + leafTop(1295));
    // eye stalks from the top of the head to round eyes
    var stalks = '';
    [[0.08, 1110, 395], [0.5, 1250, 400]].forEach(function (s) {
      var p = bz(H[0], H[1], H[2], H[3], s[0]);
      var ex = s[1], ey = s[2], er = 40;
      var dx = p[0] - ex, dy = p[1] - ey, d = Math.sqrt(dx * dx + dy * dy);
      stalks += path('M' + P(p) + ' L' + r(ex + er * dx / d) + ' ' + r(ey + er * dy / d)) +
        circle(ex, ey, er) + circle(ex, ey + 6, 18, true);
    });
    function mushroom(x, capY, w, h, stemW) {
      var s = path('M' + (x - w / 2) + ' ' + capY + ' C' + (x - w / 2) + ' ' + (capY - h) + ' ' + (x + w / 2) + ' ' + (capY - h) +
        ' ' + (x + w / 2) + ' ' + capY + ' Z');
      var l = x - stemW / 2, rr = x + stemW / 2;
      s += path('M' + l + ' ' + capY + ' Q' + (l - 12) + ' ' + r((capY + leafTop(l)) / 2) + ' ' + l + ' ' + leafTop(l));
      s += path('M' + rr + ' ' + capY + ' Q' + (rr + 12) + ' ' + r((capY + leafTop(rr)) / 2) + ' ' + rr + ' ' + leafTop(rr));
      return s;
    }
    return [
      // the big leaf
      path('M120 960 Q800 840 1480 960 Q800 1180 120 960 Z'),
      path('M120 960 Q800 1010 1480 960'),
      path('M420 985 L480 1030 M640 995 L700 1045 M880 998 L940 1045 M1110 992 L1170 1030'),
      path('M1480 960 Q1530 980 1560 1030'),
      sun(1430, 170, 70), cloud(110, 250, 260),
      // shell and body
      circle(sx, sy, sR),
      path(spiral),
      body,
      stalks,
      path('M1185 615 Q1215 645 1245 618'),
      // mushrooms
      mushroom(300, 650, 280, 230, 90),
      circle(235, 600, 22), circle(305, 562, 26), circle(370, 605, 20),
      mushroom(1400, 820, 150, 130, 54),
      circle(1370, 790, 14), circle(1425, 780, 16)
    ].join('');
  });

  // ---- Ladybugs ----
  // One ladybug drawn around (0,0) facing up, radius R; place() moves and turns it.
  function ladybug(R, kid) {
    var s = circle(0, 0, R);
    var hl = [r(-0.5 * R), r(-0.866 * R)], hrp = [r(0.5 * R), r(-0.866 * R)];
    s += path('M' + P(hl) + ' A' + r(0.55 * R) + ' ' + r(0.55 * R) + ' 0 1 1 ' + P(hrp));
    s += path('M0 ' + (-R) + ' L0 ' + R);
    var spots = kid ? [[-0.48, -0.25, 0.25], [-0.42, 0.5, 0.2]] :
      [[-0.48, -0.4, 0.19], [-0.6, 0.22, 0.16], [-0.3, 0.62, 0.15]];
    spots.forEach(function (p) {
      s += circle(r(p[0] * R), r(p[1] * R), r(p[2] * R)) + circle(r(-p[0] * R), r(p[1] * R), r(p[2] * R));
    });
    // face on the head
    var hc = -1.095 * R;
    if (kid) {
      s += circle(r(-0.2 * R), r(-1.36 * R), r(0.09 * R), true) + circle(r(0.2 * R), r(-1.36 * R), r(0.09 * R), true);
    } else {
      s += eye(r(-0.22 * R), r(-1.38 * R), r(0.12 * R), r(0.14 * R)) + eye(r(0.22 * R), r(-1.38 * R), r(0.12 * R), r(0.14 * R));
    }
    s += path('M' + r(-0.12 * R) + ' ' + r(-1.2 * R) + ' Q0 ' + r(-1.1 * R) + ' ' + r(0.12 * R) + ' ' + r(-1.2 * R));
    // antennae with round tips
    [-1, 1].forEach(function (k) {
      var a = (k < 0 ? -115 : -65) * Math.PI / 180;
      var st = [r(0.55 * R * Math.cos(a)), r(hc + 0.55 * R * Math.sin(a))];
      var tc = [k * 0.5 * R, -2.0 * R], tr = Math.max(14, 0.09 * R), cp = [k * 0.3 * R, -1.85 * R];
      var dx = cp[0] - tc[0], dy = cp[1] - tc[1], d = Math.sqrt(dx * dx + dy * dy);
      s += path('M' + P(st) + ' Q' + r(cp[0]) + ' ' + r(cp[1]) + ' ' + r(tc[0] + tr * dx / d) + ' ' + r(tc[1] + tr * dy / d));
      s += circle(r(tc[0]), r(tc[1]), r(tr), true);
    });
    return s;
  }

  A.page('garden', 'garden-ladybugs', 'Ladybug family', function () {
    var base = [200, 1080], tip = [1500, 100], mc = [860, 620], mR = 210;
    function toward(p) {
      var dx = p[0] - mc[0], dy = p[1] - mc[1], d = Math.sqrt(dx * dx + dy * dy);
      return [r(mc[0] + mR * dx / d), r(mc[1] + mR * dy / d)];
    }
    var m1 = toward(base), m2 = toward(tip);
    // veins branching off the midrib (free ends, they don't split the leaf)
    var veins = '';
    [0.3, 0.62].forEach(function (t) {
      var x = r(base[0] + (m1[0] - base[0]) * t), y = r(base[1] + (m1[1] - base[1]) * t);
      if (t < 0.5) veins += path('M' + x + ' ' + y + ' Q' + (x - 20) + ' ' + (y - 80) + ' ' + (x - 50) + ' ' + (y - 140));
      veins += path('M' + x + ' ' + y + ' Q' + (x + 80) + ' ' + (y + 10) + ' ' + (x + 150) + ' ' + (y + 40));
    });
    [0.35, 0.7].forEach(function (t) {
      var x = r(m2[0] + (tip[0] - m2[0]) * t), y = r(m2[1] + (tip[1] - m2[1]) * t);
      veins += path('M' + x + ' ' + y + ' Q' + (x + 8) + ' ' + (y + 60) + ' ' + (x + 30) + ' ' + (y + 105));
      veins += path('M' + x + ' ' + y + ' Q' + (x - 50) + ' ' + (y - 20) + ' ' + (x - 110) + ' ' + (y - 40));
    });
    return [
      // big leaf: stem end bottom-left, pointy tip top-right
      path('M' + P(base) + ' C40 700 260 150 900 110 C1150 95 1350 120 ' + P(tip) +
        ' C1480 400 1450 700 1200 900 C950 1100 500 1150 ' + P(base) + ' Z'),
      path('M' + P(base) + ' Q160 1130 110 1160'),
      path('M' + P(base) + ' L' + P(m1) + ' M' + P(m2) + ' L' + P(tip)),
      veins,
      place(ladybug(mR), mc[0], mc[1], 1, 0),
      place(ladybug(100, true), 440, 680, 1, -12),
      place(ladybug(100, true), 1210, 700, 1, 14),
      sun(120, 120, 50),
      flower(1440, 1060, 40, 65)
    ].join('');
  });
})();
