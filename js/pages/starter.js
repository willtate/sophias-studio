/* The original v1 pages, now filed into categories. */
(function () {
  'use strict';
  var A = window.Art;
  var r = A.r, circle = A.circle, ellipse = A.ellipse, path = A.path, rect = A.rect, star = A.star,
    heart = A.heart, cloud = A.cloud, sun = A.sun, flower = A.flower, stemFlower = A.stemFlower;

  // ---- geometry helpers for the redrawn kitty and dino (angles in degrees, 0 = right, 90 = down) ----
  function P(p) { return r(p[0]) + ' ' + r(p[1]); }
  function onE(cx, cy, rx, ry, deg) {
    var a = deg * Math.PI / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  }
  function cub(seg, t) {
    var u = 1 - t, p0 = seg[0], p1 = seg[1], p2 = seg[2], p3 = seg[3];
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  }
  function C(seg) { return ' C' + P(seg[1]) + ' ' + P(seg[2]) + ' ' + P(seg[3]); }
  // Elliptical arc from angle a0 to a1 (a1 > a0 runs clockwise on screen).
  function arcE(cx, cy, rx, ry, a0, a1, move) {
    var p0 = onE(cx, cy, rx, ry, a0), p1 = onE(cx, cy, rx, ry, a1);
    return (move === false ? '' : 'M' + P(p0)) + ' A' + rx + ' ' + ry + ' 0 ' + (Math.abs(a1 - a0) > 180 ? 1 : 0) +
      ' ' + (a1 > a0 ? 1 : 0) + ' ' + P(p1);
  }
  // y on the lower half of an ellipse at x.
  function lowY(cx, cy, rx, ry, x) { return cy + ry * Math.sqrt(1 - Math.pow((x - cx) / rx, 2)); }
  function mirrorAbout(svg, cx) { return '<g transform="matrix(-1 0 0 1 ' + (2 * cx) + ' 0)">' + svg + '</g>'; }
  function grass(x, y) {
    return path('M' + (x - 22) + ' ' + y + ' Q' + (x - 18) + ' ' + (y - 30) + ' ' + (x - 30) + ' ' + (y - 50) +
      ' M' + x + ' ' + y + ' L' + x + ' ' + (y - 55) + ' M' + (x + 22) + ' ' + y + ' Q' + (x + 18) + ' ' + (y - 30) + ' ' + (x + 30) + ' ' + (y - 50));
  }

  // ---------------------------------------------------------------- kitty
  function kitty() {
    var cx = 800, hy = 420, hrx = 205, hry = 180, gy = 1000, fy = 1090, w = 240;
    var H = function (d) { return onE(cx, hy, hrx, hry, d); };
    var HS = function (d, k) { return onE(cx, hy, hrx * k, hry * k, d); };
    // fluffy cheek tufts between two head angles (a0 < a1)
    function tufts(a0, a1, n) {
      var s = '', step = (a1 - a0) / n;
      for (var i = 0; i < n; i++) {
        var b = a0 + i * step, e = b + step, tip = HS(b + step * 0.7, 1.2);
        s += ' Q' + P(HS(b + step * 0.25, 1.1)) + ' ' + P(tip) + ' Q' + P(HS(b + step * 0.95, 1.06)) + ' ' + P(H(e));
      }
      return s;
    }
    var head = 'M' + P(H(40)) + arcE(cx, hy, hrx, hry, 40, 140, false) + tufts(140, 175, 2) +
      arcE(cx, hy, hrx, hry, 175, 365, false) + tufts(5, 40, 2) + ' Z';
    // ear with inner ear (left; mirrored for the right)
    var e1 = H(203), e2 = H(242), tip = [cx - 175, hy - 255];
    var ear = path('M' + P(e1) + ' C' + r(e1[0] - 15) + ' ' + r(e1[1] - 90) + ' ' + r(tip[0] - 25) + ' ' + r(tip[1] + 40) + ' ' + P(tip) +
      ' C' + r(tip[0] + 35) + ' ' + r(tip[1] + 5) + ' ' + r(e2[0] - 40) + ' ' + r(e2[1] - 50) + ' ' + P(e2));
    var i1 = H(211), i2 = H(234), itip = [tip[0] + 22, tip[1] + 62];
    ear += path('M' + P(i1) + ' Q' + r(i1[0] - 5) + ' ' + r(i1[1] - 70) + ' ' + P(itip) + ' Q' + r(i2[0] - 30) + ' ' + r(i2[1] - 40) + ' ' + P(i2));
    // sitting body hanging from the head
    var s = H(122);
    var L = [s, [cx - w * 1.05, s[1] + 110], [cx - w * 1.12, gy - 80], [cx - w * 0.66, gy]];
    var R = L.map(function (p) { return [2 * cx - p[0], p[1]]; }).reverse();
    var body = path('M' + P(L[0]) + C(L) + ' L' + P(R[0]) + C(R));
    // front legs sharing the centre line, with toe lines
    var lw = 86, lt = gy - 200;
    var legs = path('M' + (cx - lw) + ' ' + gy + ' L' + (cx - lw) + ' ' + (lt + lw / 2) +
      ' A' + lw / 2 + ' ' + lw / 2 + ' 0 0 1 ' + cx + ' ' + (lt + lw / 2) + ' L' + cx + ' ' + gy +
      ' M' + cx + ' ' + (lt + lw / 2) + ' A' + lw / 2 + ' ' + lw / 2 + ' 0 0 1 ' + (cx + lw) + ' ' + (lt + lw / 2) +
      ' L' + (cx + lw) + ' ' + gy);
    [cx - lw * 0.66, cx - lw * 0.33, cx + lw * 0.33, cx + lw * 0.66].forEach(function (x) {
      legs += path('M' + r(x) + ' ' + gy + ' L' + r(x) + ' ' + (gy - 26));
    });
    // back paws poking out on each side
    var bp = cub(L, 0.8);
    var back = path('M' + P(bp) + ' C' + r(cx - w * 1.28) + ' ' + r(bp[1] - 10) + ' ' + r(cx - w * 1.52) + ' ' + (gy - 40) +
      ' ' + r(cx - w * 1.4) + ' ' + gy) +
      path('M' + r(cx - w * 1.22) + ' ' + gy + ' L' + r(cx - w * 1.22) + ' ' + (gy - 24) +
        ' M' + r(cx - w * 1.05) + ' ' + gy + ' L' + r(cx - w * 1.05) + ' ' + (gy - 24));
    // fluffy chest bib hanging under the chin
    var b0 = H(116), b1 = H(64);
    var bib = path('M' + P(b0) + ' Q' + r(b0[0] - 30) + ' 640 ' + r(cx - 75) + ' 662 Q' + r(cx - 75) + ' 712 ' + r(cx - 35) + ' 715' +
      ' Q' + cx + ' 765 ' + r(cx + 35) + ' 715 Q' + r(cx + 75) + ' 712 ' + r(cx + 75) + ' 662 Q' + r(b1[0] + 30) + ' 640 ' + P(b1));
    // bushy tail curling up on the right, with two stripes
    var t1 = cub(R, 0.28), t2 = cub(R, 0.5);
    var TA = [t1, [t1[0] + 130, t1[1] + 5], [1250, 880], [1262, 730]],
      TB = [[1262, 730], [1270, 610], [1150, 600], [1145, 700]],
      TC = [[1145, 700], [1140, 770], [1110, 800], t2];
    var tail = path('M' + P(t1) + C(TA) + C(TB) + C(TC));
    function band(a, b, bulge) {
      return path('M' + P(a) + ' Q' + r((a[0] + b[0]) / 2) + ' ' + r((a[1] + b[1]) / 2 + bulge) + ' ' + P(b));
    }
    var stripes = band(cub(TA, 0.55), cub(TC, 0.62), 12) + band(cub(TA, 0.88), cub(TC, 0.12), 10);
    // forehead stripes
    var fore = [255, 270, 285].map(function (a, i) {
      var p = H(a), q = HS(a, i === 1 ? 0.7 : 0.76);
      return path('M' + P(p) + ' L' + P(q));
    }).join('');
    // cushion the kitty sits on (its bottom is the floor), with a wavy trim
    var CU = [[430, fy], [385, 1070], [390, gy + 4], [470, gy]];
    var CUR = CU.map(function (p) { return [1600 - p[0], p[1]]; });
    function atY(seg, y) {
      var lo = 0, hi = 1, down = seg[3][1] > seg[0][1];
      for (var k = 0; k < 50; k++) { var m = (lo + hi) / 2; if ((cub(seg, m)[1] < y) === down) lo = m; else hi = m; }
      return cub(seg, (lo + hi) / 2);
    }
    var tl = atY(CU, 1045), tr = atY(CUR, 1045), trim = 'M' + P(tl), nW = 9;
    for (var k = 1; k <= nW; k++) {
      var x0 = tl[0] + (tr[0] - tl[0]) * (k - 1) / nW, x1 = tl[0] + (tr[0] - tl[0]) * k / nW;
      trim += ' Q' + r((x0 + x1) / 2) + ' 1072 ' + r(x1) + ' 1045';
    }
    var cushion = path('M' + P(CU[0]) + C(CU) + ' L' + P(CUR[3]) + ' C' + P(CUR[2]) + ' ' + P(CUR[1]) + ' ' + P(CUR[0])) + path(trim);
    // ball of yarn on the floor
    var yc = [215, 1010], yr = 92, yx = Math.sqrt(yr * yr - Math.pow(fy - yc[1], 2));
    var Y = function (d) { return onE(yc[0], yc[1], yr, yr, d); };
    // a wrap of yarn: curve between two rim points, bowed by (dx, dy)
    var wrap = function (a0, a1, dx, dy) {
      var p = Y(a0), q = Y(a1);
      return 'M' + P(p) + ' Q' + r((p[0] + q[0]) / 2 + dx) + ' ' + r((p[1] + q[1]) / 2 + dy) + ' ' + P(q);
    };
    var yarn = path('M' + r(yc[0] - yx) + ' ' + fy + ' A' + yr + ' ' + yr + ' 0 1 1 ' + r(yc[0] + yx) + ' ' + fy) +
      path(wrap(205, 335, 0, 22) + ' ' + wrap(165, 15, 0, 22) + ' M' + P(Y(250)) + ' Q' + (yc[0] + 45) + ' ' + yc[1] + ' ' + (yc[0] - 20) + ' ' + fy);
    // mouse hole in the wall with a little mouse peeking out
    var mc = [1395, 1048], mr = 46, mx = Math.sqrt(mr * mr - Math.pow(fy - mc[1], 2));
    var mEar = function (a0, a1) {
      return path('M' + P(onE(mc[0], mc[1], mr, mr, a0)) + ' A26 26 0 1 1 ' + P(onE(mc[0], mc[1], mr, mr, a1)));
    };
    var hole = path('M1300 ' + fy + ' L1300 980 A95 95 0 0 1 1490 980 L1490 ' + fy) +
      path('M' + r(mc[0] - mx) + ' ' + fy + ' A' + mr + ' ' + mr + ' 0 1 1 ' + r(mc[0] + mx) + ' ' + fy) +
      mEar(200, 245) + mEar(295, 340) +
      circle(mc[0] - 16, mc[1] - 6, 7, true) + circle(mc[0] + 16, mc[1] - 6, 7, true) + circle(mc[0], mc[1] + 14, 8, true);
    // window with curtains-free panes, and a framed fish picture
    var win = rect(150, 150, 320, 270, 18) + path('M310 150 L310 420 M150 285 L470 285') +
      path('M130 420 L490 420 L490 455 L130 455 Z');
    var fc = [1330, 285];
    var frame = rect(1170, 175, 320, 220, 14) +
      ellipse(fc[0], fc[1], 85, 50) +
      path('M' + P(onE(fc[0], fc[1], 85, 50, 160)) + ' L1215 235 L1215 335 L' + P(onE(fc[0], fc[1], 85, 50, 200)) + ' Z') +
      circle(fc[0] + 45, fc[1] - 10, 9, true) + path('M' + (fc[0] - 5) + ' ' + (fc[1] - 45) + ' Q' + (fc[0] + 20) + ' ' + fc[1] + ' ' + (fc[0] - 5) + ' ' + (fc[1] + 45));
    return [
      path('M40 ' + fy + ' L1560 ' + fy),
      win, frame,
      path(head), ear, mirrorAbout(ear, cx), fore,
      // face
      ellipse(728, 410, 40, 50), circle(732, 420, 21, true),
      ellipse(872, 410, 40, 50), circle(868, 420, 21, true),
      path('M780 470 Q800 462 820 470 Q818 488 800 494 Q782 488 780 470 Z', true),
      path('M800 494 L800 506 M800 506 Q776 532 752 512 M800 506 Q824 532 848 512'),
      circle(702, 530, 20), circle(898, 530, 20),
      path('M738 468 L648 450 M738 486 L650 490 M862 468 L952 450 M862 486 L950 490'),
      body, bib, legs, back, mirrorAbout(back, cx), tail, stripes,
      cushion, yarn, hole
    ].join('');
  }

  // ---------------------------------------------------------------- dino
  function dino() {
    var bc = [700, 790], brx = 330, bry = 195, gy = 1060;
    var B = function (d) { return onE(bc[0], bc[1], brx, bry, d); };
    var hc = [1170, 330], hrx = 165, hry = 128;
    var Hd = function (d) { return onE(hc[0], hc[1], hrx, hry, d); };
    var yB = function (x) { return lowY(bc[0], bc[1], brx, bry, x); };
    // body outline: top arc from tail to neck, bottom arc from neck back to tail
    var body = arcE(bc[0], bc[1], brx, bry, 192, 294) + arcE(bc[0], bc[1], brx, bry, 350, 520);
    // long chunky neck up to the head
    var nb = B(294), nf = B(350), hb = Hd(168), hf = Hd(104);
    var neck = path('M' + P(nb) + ' C' + r(nb[0] + 60) + ' ' + r(nb[1] - 50) + ' ' + r(hb[0] - 60) + ' ' + r(hb[1] + 110) + ' ' + P(hb) +
      ' M' + P(nf) + ' C' + r(nf[0] + 30) + ' ' + r(nf[1] - 90) + ' ' + r(hf[0] - 5) + ' ' + r(hf[1] + 110) + ' ' + P(hf));
    // tail sweeping left with a rounded tip
    var ta = B(192), tb = B(160);
    var tail = path('M' + P(ta) + ' C' + r(ta[0] - 110) + ' ' + r(ta[1] - 20) + ' 200 650 135 585' +
      ' C105 560 80 590 100 620 C150 700 250 800 ' + P(tb));
    // back plates: each starts and ends on the body's top arc
    var plates = '';
    [[205, 7, 62], [225, 8, 84], [246, 8, 98], [267, 8, 92], [285, 7, 72]].forEach(function (pl) {
      var a = pl[0], p1 = B(a - pl[1]), p2 = B(a + pl[1]), m = B(a), rad = a * Math.PI / 180;
      var nx = bry * Math.cos(rad), ny = brx * Math.sin(rad), nl = Math.sqrt(nx * nx + ny * ny);
      nx /= nl; ny /= nl;
      var tx = -ny, ty = nx, h = pl[2], wd = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
      var ap = [m[0] + nx * h, m[1] + ny * h];
      plates += path('M' + P(p1) + ' C' + P([p1[0] + nx * h * 0.55 - tx * wd * 0.35, p1[1] + ny * h * 0.55 - ty * wd * 0.35]) + ' ' +
        P([ap[0] - tx * wd * 0.3, ap[1] - ty * wd * 0.3]) + ' ' + P(ap) +
        ' C' + P([ap[0] + tx * wd * 0.3, ap[1] + ty * wd * 0.3]) + ' ' +
        P([p2[0] + nx * h * 0.55 + tx * wd * 0.35, p2[1] + ny * h * 0.55 + ty * wd * 0.35]) + ' ' + P(p2));
    });
    // stubby legs: a near leg plus a far leg peeking out beside it, toes on the ground
    function side(x, flare) {
      var y0 = yB(x);
      return 'M' + x + ' ' + r(y0) + ' Q' + x + ' ' + r(gy - 30) + ' ' + (x + flare) + ' ' + gy;
    }
    function leg(x1, x2, farX) {
      var s = path(side(x1, -16) + ' ' + side(x2, 16) + ' ' + side(farX, farX < x1 ? -16 : 16));
      var q = (x2 - x1 + 32) / 3;
      s += path('M' + r(x1 - 16 + q) + ' ' + gy + ' L' + r(x1 - 16 + q) + ' ' + (gy - 28) +
        ' M' + r(x2 + 16 - q) + ' ' + gy + ' L' + r(x2 + 16 - q) + ' ' + (gy - 28));
      return s;
    }
    // volcano with lava and smoke puffs
    var volcano = path('M1170 ' + gy + ' L1300 790 Q1345 770 1390 790 L1520 ' + gy) +
      path('M1271.1 850 Q1300 900 1320 860 Q1345 910 1365 858 Q1390 900 1418.9 850') +
      circle(1350, 715, 34) + circle(1400, 640, 26) + circle(1450, 580, 18);
    // egg in the grass
    var ec = [255, 985], erx = 72, ery = 92, ex = erx * Math.sqrt(1 - Math.pow((gy - ec[1]) / ery, 2));
    var egg = path('M' + r(ec[0] - ex) + ' ' + gy + ' A' + erx + ' ' + ery + ' 0 1 1 ' + r(ec[0] + ex) + ' ' + gy) +
      circle(232, 955, 20) + circle(282, 1008, 17);
    return [
      path('M40 ' + gy + ' L1560 ' + gy),
      sun(200, 175, 70), cloud(520, 230, 260), cloud(1350, 160, 190),
      path(body), neck, tail, plates,
      leg(490, 615, 440), leg(800, 925, 975),
      ellipse(hc[0], hc[1], hrx, hry),
      // face: big eye, nostril, smile, rosy cheek
      ellipse(1170, 295, 38, 48), circle(1178, 306, 20, true),
      path('M1160 242 L1154 220 M1182 245 L1190 223 M1202 257 L1216 240'),
      ellipse(1295, 300, 8, 11, true),
      path('M1210 385 Q1262 412 1305 370'),
      circle(1120, 372, 22),
      // spots
      circle(610, 740, 50), circle(785, 690, 36), circle(465, 810, 34), circle(885, 780, 32), circle(725, 870, 28),
      volcano, egg,
      grass(1090, gy), grass(90, gy)
    ].join('');
  }

  var PAGES = [
    {
      id: 'cat', name: 'Kitty', art: kitty
    },
    {
      id: 'fish', name: 'Fishy',
      art: function () {
        return [
          path('M400 600 C500 380 900 380 1050 600 C900 820 500 820 400 600 Z'),
          path('M1050 600 L1250 450 L1250 750 Z'),
          circle(530, 560, 38), circle(538, 566, 16, true),
          path('M556 461 Q640 300 785 442'),
          path('M592 750 Q660 880 746 763'),
          path('M683 436 Q725 600 683 764'),
          path('M877 467 Q915 600 877 733'),
          path('M430 625 Q452 648 478 632'),
          circle(300, 380, 42), circle(240, 250, 26), circle(320, 150, 18),
          circle(1380, 280, 52), circle(1470, 150, 30),
          path('M0 1100 Q400 1040 800 1100 T1600 1100'),
          path('M150 1092 C100 1000 220 930 160 800 C250 920 150 1010 230 1080'),
          path('M1420 1080 C1380 990 1500 920 1440 790 C1530 910 1430 1000 1500 1080'),
          star(1150, 1150, 48, 22, 0.2),
          path('M500 1150 Q540 1110 580 1150 Q620 1110 660 1150'),
          // little fish
          path('M1100 950 C1150 890 1250 890 1290 950 C1250 1010 1150 1010 1100 950 Z'),
          path('M1290 950 L1350 910 L1350 990 Z'),
          circle(1145, 940, 10, true)
        ].join('');
      }
    },
    {
      id: 'house', name: 'House',
      art: function () {
        return [
          path('M0 1000 L1600 1000'),
          rect(500, 560, 600, 440),
          path('M460 560 L800 250 L1140 560 Z'),
          path('M1000 432 L1000 320 L1070 320 L1070 496'),
          rect(730, 780, 140, 220, 8),
          circle(845, 895, 10, true),
          rect(570, 640, 120, 120), path('M630 640 L630 760 M570 700 L690 700'),
          rect(910, 640, 120, 120), path('M970 640 L970 760 M910 700 L1030 700'),
          circle(800, 430, 45),
          sun(190, 190, 85),
          cloud(560, 190, 260), cloud(1100, 150, 220),
          path('M1300 1000 L1300 797 M1360 1000 L1360 797'),
          circle(1330, 650, 150),
          circle(1280, 600, 18), circle(1380, 640, 18), circle(1320, 720, 18),
          stemFlower(140, 830, 1000, 32, 55),
          stemFlower(300, 860, 1000, 28, 48),
          path('M730 1000 L640 1200 M870 1000 L960 1200')
        ].join('');
      }
    },
    {
      id: 'garden', name: 'Flowers',
      art: function () {
        return [
          path('M0 1020 Q400 980 800 1020 T1600 1020'),
          stemFlower(250, 560, 1015, 60, 110),
          stemFlower(620, 420, 1000, 75, 135),
          stemFlower(1000, 520, 1003, 65, 120),
          stemFlower(1360, 600, 1018, 55, 100),
          sun(1430, 160, 80),
          cloud(160, 170, 240),
          // ladybug
          ellipse(820, 1110, 70, 50), path('M820 1060 L820 1160'),
          circle(760, 1100, 28),
          circle(845, 1095, 10, true), circle(800, 1125, 10, true),
          // bee
          ellipse(840, 220, 70, 48),
          path('M820 174 L820 266 M860 176 L860 264'),
          ellipse(810, 160, 32, 22), ellipse(870, 160, 32, 22),
          circle(780, 210, 8, true),
          path('M910 220 L940 220')
        ].join('');
      }
    },
    {
      id: 'butterfly', name: 'Butterfly',
      art: function () {
        var wing = [
          path('M768 500 C450 120 180 380 420 560 C520 640 680 625 765 610'),
          path('M765 620 C600 680 420 760 470 900 C520 1020 700 930 770 720'),
          circle(500, 430, 55), circle(640, 520, 30), circle(560, 820, 45), heart(680, 760, 26)
        ].join('');
        return [
          ellipse(800, 600, 35, 230),
          circle(800, 325, 45),
          path('M785 283 Q760 200 700 170'), circle(690, 160, 14),
          path('M815 283 Q840 200 900 170'), circle(910, 160, 14),
          circle(785, 318, 7, true), circle(815, 318, 7, true),
          wing,
          '<g transform="matrix(-1 0 0 1 1600 0)">' + wing + '</g>',
          flower(180, 1060, 40, 70), flower(1420, 1060, 40, 70)
        ].join('');
      }
    },
    {
      id: 'rocket', name: 'Rocket',
      art: function () {
        return [
          path('M800 150 C950 300 960 600 920 800 L680 800 C640 600 650 300 800 150 Z'),
          circle(800, 450, 72), circle(800, 450, 48),
          path('M663 670 L540 880 L680 800'),
          path('M937 670 L1060 880 L920 800'),
          path('M700 800 Q720 950 800 1060 Q880 950 900 800'),
          path('M750 800 Q770 900 800 960 Q830 900 850 800'),
          path('M712 270 L888 270'),
          circle(300, 350, 110), ellipse(300, 350, 190, 45),
          path('M1340 160 A120 120 0 1 0 1340 400 A160 160 0 0 1 1340 160 Z'),
          star(200, 800, 45), star(1200, 600, 40), star(1400, 900, 55), star(450, 1050, 35),
          star(1100, 1080, 30), star(560, 150, 30), star(1050, 220, 35)
        ].join('');
      }
    },
    {
      id: 'dino', name: 'Dino', art: dino
    },
    {
      id: 'icecream', name: 'Ice cream',
      art: function () {
        return [
          path('M650 650 L800 1100 L950 650 Z'),
          path('M683 750 L917 750 M717 850 L883 850 M750 950 L850 950'),
          path('M650 650 A155 155 0 1 1 950 650'),
          path('M680 513 A125 125 0 1 1 920 513'),
          circle(800, 320, 35),
          path('M800 285 Q810 230 850 210'),
          // cute face on the big scoop, sprinkles on the top one
          circle(760, 585, 13, true), circle(840, 585, 13, true),
          path('M775 615 Q800 638 825 615'),
          path('M752 405 L768 396 M828 388 L842 402 M792 425 L806 434 M865 425 L878 414 M800 380 L812 372'),
          // table line and a few drips on the cone side
          path('M380 1110 L1220 1110'),
          circle(1060, 1060, 50), path('M1060 1010 Q1080 960 1110 950')
        ].join('');
      }
    },
    {
      id: 'rainbow', name: 'Rainbow',
      art: function () {
        var s = path('M0 960 L1600 960');
        [620, 540, 460, 380, 300].forEach(function (rad) {
          s += path('M' + (800 - rad) + ' 960 A' + rad + ' ' + rad + ' 0 0 1 ' + (800 + rad) + ' 960');
        });
        return s + [
          cloud(80, 560, 300), cloud(1240, 520, 300),
          sun(1430, 150, 75),
          heart(800, 820, 70),
          stemFlower(120, 1040, 1200, 30, 50), stemFlower(1480, 1040, 1200, 30, 50),
          stemFlower(560, 1080, 1200, 26, 44), stemFlower(1040, 1080, 1200, 26, 44)
        ].join('');
      }
    },
  ];

  var where = { cat: 'animals', dino: 'animals', fish: 'sea', house: 'garden', garden: 'garden',
    butterfly: 'garden', rocket: 'space', icecream: 'treats', rainbow: 'garden' };
  PAGES.forEach(function (p) { A.page(where[p.id], p.id, p.name, p.art); });
})();
