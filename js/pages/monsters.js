/* Silly Monsters: six friendly, not-scary monsters. */
(function () {
  'use strict';
  var A = window.Art;
  var r = A.r, circle = A.circle, ellipse = A.ellipse, path = A.path, rect = A.rect,
    stemFlower = A.stemFlower, cloud = A.cloud, sun = A.sun, mirror = A.mirror, place = A.place;

  // ---- geometry helpers (so open paths land exactly on other outlines) ----
  function pt(p) { return r(p[0]) + ' ' + r(p[1]); }
  function onE(cx, cy, rx, ry, deg) {
    var a = deg * Math.PI / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  }
  function bz(p0, p1, p2, p3, t) {
    var u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  }
  function qz(p0, p1, p2, t) {
    var u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  }
  function cub(a) { return 'C' + pt(a[1]) + ' ' + pt(a[2]) + ' ' + pt(a[3]); }
  // A rounded lobe (arm, foot, horn, ear) whose two base points sit on an outline.
  function lobe(p1, p2, tip, w, k) {
    k = k === undefined ? 0.5 : k;
    var mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
    var dx = tip[0] - mx, dy = tip[1] - my;
    var ux = p1[0] - p2[0], uy = p1[1] - p2[1], ul = Math.sqrt(ux * ux + uy * uy);
    ux /= ul; uy /= ul;
    return path('M' + pt(p1) +
      ' C' + pt([p1[0] + dx * k, p1[1] + dy * k]) + ' ' + pt([tip[0] + ux * w, tip[1] + uy * w]) + ' ' + pt(tip) +
      ' C' + pt([tip[0] - ux * w, tip[1] - uy * w]) + ' ' + pt([p2[0] + dx * k, p2[1] + dy * k]) + ' ' + pt(p2));
  }
  // Fuzzy outline: a ring of outward bumps; vertex k sits at angle a0 + k*360/n on radius R.
  function fuzz(cx, cy, R, n, a0) {
    var v = function (k) { return onE(cx, cy, R, R, a0 + k * 360 / n); };
    var chord = 2 * R * Math.sin(Math.PI / n), rad = r(chord * 0.58);
    var d = 'M' + pt(v(0));
    for (var k = 1; k <= n; k++) d += ' A' + rad + ' ' + rad + ' 0 0 1 ' + pt(v(k % n));
    return { svg: path(d + ' Z'), v: v };
  }
  function mirrorAt(svg, cx) { return '<g transform="matrix(-1 0 0 1 ' + (2 * cx) + ' 0)">' + svg + '</g>'; }
  // A noodle arm of even thickness along cubic c, starting on the body and ending on a hand circle.
  function tube(c, hw, hc, hr) {
    var sides = [[], []], done = [false, false];
    for (var i = 0; i <= 120; i++) {
      var t = i / 120, u = 1 - t;
      var P = bz(c[0], c[1], c[2], c[3], t);
      var dx = 3 * u * u * (c[1][0] - c[0][0]) + 6 * u * t * (c[2][0] - c[1][0]) + 3 * t * t * (c[3][0] - c[2][0]);
      var dy = 3 * u * u * (c[1][1] - c[0][1]) + 6 * u * t * (c[2][1] - c[1][1]) + 3 * t * t * (c[3][1] - c[2][1]);
      var l = Math.sqrt(dx * dx + dy * dy), nx = -dy / l, ny = dx / l;
      [1, -1].forEach(function (sg, j) {
        if (done[j]) return;
        var q = [P[0] + sg * nx * hw, P[1] + sg * ny * hw], s = sides[j];
        var inside = Math.pow(q[0] - hc[0], 2) + Math.pow(q[1] - hc[1], 2) < hr * hr;
        if (inside && s.length) {
          var a = s[s.length - 1], lo = 0, hi = 1;
          for (var k = 0; k < 30; k++) {
            var m = (lo + hi) / 2, x = a[0] + (q[0] - a[0]) * m, y = a[1] + (q[1] - a[1]) * m;
            if (Math.pow(x - hc[0], 2) + Math.pow(y - hc[1], 2) < hr * hr) hi = m; else lo = m;
          }
          s.push([a[0] + (q[0] - a[0]) * hi, a[1] + (q[1] - a[1]) * hi]);
          done[j] = true;
        } else s.push(q);
      });
    }
    return sides.map(function (s) { return path('M' + s.map(pt).join(' L')); }).join('') + circle(hc[0], hc[1], hr);
  }
  function eye(cx, cy, rad, px, py) {
    return circle(cx, cy, rad) + circle(cx + (px || 0), cy + (py || 0), r(rad * 0.42), true);
  }
  // An outlined music note, centred on its head.
  function note(x, y, s) {
    return place(ellipse(0, 0, 34, 26) + path('M34 0 L34 -120 Q70 -100 80 -60'), x, y, s || 1, -15);
  }

  // 1. One-eyed fuzzball with tiny horns
  A.page('monsters', 'monsters-fuzzball', 'Fuzzy Fuzzball', function () {
    var cx = 800, cy = 600, R = 330;
    var f = fuzz(cx, cy, R, 30, -84);
    var v = function (deg) { return f.v((deg + 84) / 12); };
    var hornL = lobe(v(-120), v(-108), onE(cx, cy, R + 125, R + 125, -112), 26, 0.6);
    var footL = lobe(v(120), v(96), [640, 1055], 85, 0.6);
    var armL = lobe(v(192), v(168), [330, 500], 60, 0.6);
    var q1 = [[990, 690], [960, 870], [800, 870]], q2 = [[800, 870], [640, 870], [610, 690]];
    return [
      f.svg,
      hornL, mirror(hornL),
      footL, mirror(footL),
      armL, mirror(armL),
      eye(800, 500, 135, 18, 12),
      path('M690 330 Q800 290 910 330'),
      path('M610 690 L990 690 Q960 870 800 870 Q640 870 610 690 Z'),
      path('M765 690 L765 718 A35 35 0 0 0 835 718 L835 690'),
      path('M' + pt(qz(q1[0], q1[1], q1[2], 0.72)) + ' Q800 735 ' + pt(qz(q2[0], q2[1], q2[2], 0.28))),
      path('M800 805 L800 842'),
      path('M120 1060 L1480 1060'),
      stemFlower(230, 820, 1060, 34, 60),
      stemFlower(1370, 860, 1060, 30, 52),
      cloud(140, 230, 230), cloud(1230, 200, 240)
    ].join('');
  });

  // 2. Three-eyed polka-dot blob with a balloon
  A.page('monsters', 'monsters-blob', 'Dotty Blob', function () {
    var L = [[450, 1040], [390, 700], [490, 250], [800, 250]];
    var Rr = [[800, 250], [1110, 250], [1210, 700], [1150, 1040]];
    var bottom = '';
    for (var x = 1150; x > 450; x -= 116.7) bottom += ' Q' + r(x - 58.3) + ' 1110 ' + r(x - 116.7) + ' 1040';
    var hand = [300, 480];
    var armL = lobe(bz(L[0], L[1], L[2], L[3], 0.52), bz(L[0], L[1], L[2], L[3], 0.38), hand, 55, 0.6);
    var armR = lobe(bz(Rr[0], Rr[1], Rr[2], Rr[3], 0.48), bz(Rr[0], Rr[1], Rr[2], Rr[3], 0.62), [1310, 470], 55, 0.6);
    return [
      path('M' + pt(L[0]) + ' ' + cub(L) + ' ' + cub(Rr) + bottom + ' Z'),
      armL, armR,
      eye(625, 520, 72, 10, -14), eye(800, 410, 84, 0, -16), eye(975, 520, 72, -10, -14),
      path('M610 660 L990 660 C985 880 615 880 610 660 Z'),
      path('M690 660 L690 698 A33 33 0 0 0 756 698 L756 660'),
      path('M844 660 L844 698 A33 33 0 0 0 910 698 L910 660'),
      path('M' + pt(bz([990, 660], [985, 880], [615, 880], [610, 660], 0.3)) + ' Q800 745 ' +
        pt(bz([990, 660], [985, 880], [615, 880], [610, 660], 0.7))),
      path('M800 795 L800 818'),
      circle(540, 875, 48), circle(690, 970, 36), circle(890, 970, 40), circle(1060, 875, 48),
      circle(515, 690, 32), circle(1085, 690, 32), circle(690, 305, 26), circle(910, 305, 26),
      // balloon on a string
      ellipse(250, 240, 115, 140),
      path('M250 380 L225 420 L275 420 Z'),
      path('M250 420 Q230 500 ' + pt(hand)),
      path('M120 1040 L450 1040 M1150 1040 L1480 1040')
    ].join('');
  });

  // 3. Tall noodle-armed monster with a goofy tongue
  A.page('monsters', 'monsters-noodle', 'Noodle Arms', function () {
    var x1 = 600, x2 = 1000, top = 160, bot = 1020, rad = 200;
    var ct = [800, top + rad], cb = [800, bot - rad];
    var body = path('M' + x1 + ' ' + (bot - rad) + ' L' + x1 + ' ' + (top + rad) +
      ' A' + rad + ' ' + rad + ' 0 0 1 ' + x2 + ' ' + (top + rad) + ' L' + x2 + ' ' + (bot - rad) +
      ' A' + rad + ' ' + rad + ' 0 0 1 ' + x1 + ' ' + (bot - rad) + ' Z');
    var horn = lobe(onE(ct[0], ct[1], rad, rad, -142), onE(ct[0], ct[1], rad, rad, -120), [610, 110], 22, 0.5);
    var leg = lobe(onE(cb[0], cb[1], rad, rad, 135), onE(cb[0], cb[1], rad, rad, 105), [690, 1100], 60, 0.8);
    var q1 = [[920, 520], [920, 640], [800, 640]], q2 = [[800, 640], [680, 640], [680, 520]];
    var t1 = qz(q1[0], q1[1], q1[2], 0.65), t2 = qz(q2[0], q2[1], q2[2], 0.12);
    function stripe(y) {
      var dx = Math.sqrt(rad * rad - Math.pow(y - cb[1], 2));
      return path('M' + r(800 - dx) + ' ' + y + ' Q800 ' + (y + 30) + ' ' + r(800 + dx) + ' ' + y);
    }
    return [
      body, horn, mirror(horn), leg, mirror(leg),
      eye(715, 390, 60, 12, 8), eye(885, 375, 76, -14, 10),
      path('M680 520 L920 520 Q920 640 800 640 Q680 640 680 520 Z'),
      path('M770 520 L770 552 A30 30 0 0 0 830 552 L830 520'),
      path('M' + pt(t1) + ' C905 740 890 800 840 800 C790 800 770 740 ' + pt(t2)),
      path('M820 646 L825 720'),
      stripe(850), stripe(920),
      tube([[600, 620], [470, 620], [500, 380], [300, 330]], 30, [300, 330], 62),
      tube([[1000, 620], [1150, 620], [1120, 800], [1320, 740]], 30, [1320, 740], 62),
      path('M80 1100 L1520 1100'),
      sun(1350, 220, 80),
      path('M240 1100 Q250 1040 220 1010 M260 1100 Q270 1030 300 1010'),
      path('M1340 1100 Q1350 1040 1320 1010 M1360 1100 Q1370 1030 1400 1010')
    ].join('');
  });

  // 4. A monster peeking out from under the bed, hugging a teddy
  A.page('monsters', 'monsters-underbed', 'Under the Bed', function () {
    var L = [[430, 1110], [430, 760], [590, 540], [800, 540]];
    var Rr = [[800, 540], [1010, 540], [1170, 760], [1170, 1110]];
    var b = function (t) { return bz(L[0], L[1], L[2], L[3], t); };
    var horn = lobe(b(0.72), b(0.86), [590, 480], 20, 0.5);
    var hc = [800, 925], hr = 82;
    var h = function (deg) { return onE(hc[0], hc[1], hr, hr, deg); };
    var ear = lobe(h(-150), h(-112), [722, 850], 26, 0.7);
    var tb = [h(150), [680, 1040], [690, 1110], [740, 1110]];
    var arm = lobe(b(0.2), b(0.1), bz(tb[0], tb[1], tb[2], tb[3], 0.38), 62, 0.4);
    var s1 = [[285, 1110], [280, 1066], [310, 1056], [345, 1058]], s2 = [[345, 1058], [385, 1061], [403, 1088], [400, 1110]];
    var slipper = path('M' + pt(s1[0]) + ' ' + cub(s1) + ' ' + cub(s2)) +
      path('M' + pt(bz(s1[0], s1[1], s1[2], s1[3], 0.55)) + ' Q340 1092 ' + pt(bz(s2[0], s2[1], s2[2], s2[3], 0.4)));
    return [
      // bed
      path('M90 1110 L90 260 A80 80 0 0 1 250 260 L250 1110'),
      path('M1350 1110 L1350 330 A80 80 0 0 1 1510 330 L1510 1110'),
      path('M250 340 L1350 340 M250 420 L1350 420 M250 480 L1350 480'),
      path('M275 340 C255 270 300 245 380 250 C460 255 490 280 470 340'),
      path('M560 340 Q590 380 570 420'),
      // window with a moon
      rect(620, 60, 360, 210, 20), path('M800 60 L800 270'),
      path('M760 110 A62 62 0 1 0 760 220 A90 90 0 0 1 760 110 Z'), A.star(890, 168, 48, 22),
      // monster
      path('M' + pt(L[0]) + ' ' + cub(L) + ' ' + cub(Rr)),
      horn, mirror(horn),
      eye(700, 662, 62, 12, 14), eye(900, 662, 62, -12, 14),
      path('M725 750 L875 750 Q870 815 800 815 Q730 815 725 750 Z'),
      path('M775 750 L775 768 A25 25 0 0 0 825 768 L825 750'),
      circle(560, 800, 34), circle(1040, 800, 34),
      arm, mirror(arm),
      // teddy
      circle(hc[0], hc[1], hr), ear, mirror(ear),
      path('M' + pt(h(150)) + ' C680 1040 690 1110 740 1110 L860 1110 C910 1110 920 1040 ' + pt(h(30))),
      circle(772, 905, 8, true), circle(828, 905, 8, true),
      ellipse(800, 948, 34, 26), ellipse(800, 940, 11, 8, true),
      path('M40 1110 L1560 1110'),
      slipper, mirror(slipper)
    ].join('');
  });

  // 5. Chubby monster with tiny bat wings, eating a cupcake
  A.page('monsters', 'monsters-cupcake', 'Cupcake Muncher', function () {
    var cx = 800, cy = 650, rx = 340, ry = 380;
    var p = function (deg) { return onE(cx, cy, rx, ry, deg); };
    var wing = path('M' + pt(p(216)) + ' C500 360 430 320 360 330 Q395 362 392 402 Q432 400 445 445 Q462 470 ' +
      pt(p(196)));
    var foot = lobe(p(122), p(100), [680, 1095], 75, 0.8);
    var arm = lobe(p(180), p(165), [709.8, 859], 48, 0.55);
    var tuft = lobe(p(-104), p(-96), [740, 225], 18, 0.6) + lobe(p(-94), p(-86), [800, 210], 18, 0.6) +
      lobe(p(-84), p(-76), [860, 225], 18, 0.6);
    return [
      ellipse(cx, cy, rx, ry),
      wing, mirror(wing), foot, mirror(foot), tuft,
      eye(690, 460, 72, 18, 24), eye(910, 460, 72, -6, 26),
      path('M700 560 L900 560 Q900 660 800 660 Q700 660 700 560 Z'),
      path('M770 560 L770 585 A30 30 0 0 0 830 585 L830 560'),
      path('M735 640 Q800 600 865 640'),
      // cupcake with a bite out of it
      path('M675 810 C645 770 680 735 725 742 C730 705 790 690 822 715 A24 24 0 0 0 862 742 A22 22 0 0 0 902 765 C935 775 935 800 925 810 Z'),
      path('M700 810 L728 950 L872 950 L900 810'),
      path('M752 810 L766 950 M800 810 L800 950 M848 810 L834 950'),
      path('M715 770 L735 782 M770 735 L788 745 M790 770 L812 765 M860 780 L878 792'),
      arm, mirror(arm),
      circle(945, 650, 9, true), circle(970, 700, 7, true),
      circle(565, 590, 30), circle(1035, 590, 30),
      path('M80 1095 L1520 1095'),
      // a plate with one more cupcake
      path('M1220 1095 L1240 1065 L1460 1065 L1480 1095'),
      path('M1290 1065 L1270 975 L1430 975 L1410 1065'),
      path('M1260 975 C1240 935 1280 905 1310 910 C1320 865 1380 865 1390 910 C1420 905 1460 935 1440 975 Z'),
      path('M1335 975 L1340 1065 M1385 975 L1375 1065')
    ].join('');
  });

  // 6. Monster band: a drummer and a horn player
  A.page('monsters', 'monsters-band', 'Monster Band', function () {
    // drummer
    var D = [[270, 500], [270, 230], [730, 230], [730, 500]];
    var d = function (t) { return bz(D[0], D[1], D[2], D[3], t); };
    var hornD = lobe(d(0.2), d(0.33), [300, 190], 30, 0.5);
    var armD = lobe([270, 590], [270, 670], [130, 460], 45, 0.6);
    var stick = path('M130 460 L205 300') + circle(217, 274, 28);
    // horn player
    var tc = [1120, 750], tR = 265, y0 = 810, th = 28;
    var e1 = [tc[0] + Math.sqrt(tR * tR - Math.pow(y0 - th - tc[1], 2)), y0 - th];
    var e2 = [tc[0] + Math.sqrt(tR * tR - Math.pow(y0 + th - tc[1], 2)), y0 + th];
    var mc = [1170, y0], mr = 42, mx = mc[0] + Math.sqrt(mr * mr - th * th);
    function stalk(ex) {
      var s = '', ey = 350, er = 62;
      [ex - 26, ex + 26].forEach(function (x) {
        var yb = tc[1] - Math.sqrt(tR * tR - Math.pow(x - tc[0], 2));
        var ye = ey + Math.sqrt(er * er - Math.pow(x - ex, 2));
        s += path('M' + r(x) + ' ' + r(yb) + ' L' + r(x) + ' ' + r(ye));
      });
      return s + eye(ex, ey, er, 0, 12);
    }
    var t = function (deg) { return onE(tc[0], tc[1], tR, tR, deg); };
    var footT = lobe(t(125), t(100), [1020, 1100], 60, 0.8);
    var footT2 = lobe(t(80), t(55), [1240, 1100], 60, 0.8);
    return [
      // drummer body: its bottom is hidden by the floor and the big drum in front
      path('M270 1100 L' + pt(D[0]) + ' ' + cub(D) + ' L730 1100'),
      hornD, mirrorAt(hornD, 500),
      eye(420, 420, 56, 8, 12), eye(580, 420, 56, -8, 12),
      path('M395 515 L605 515 Q605 620 500 620 Q395 620 395 515 Z'),
      path('M446 515 L446 545 A24 24 0 0 0 494 545 L494 515 M506 515 L506 545 A24 24 0 0 0 554 545 L554 515'),
      path('M270 680 Q500 720 730 680'),
      armD, stick, mirrorAt(armD, 500), mirrorAt(stick, 500),
      // drum
      circle(500, 930, 170), circle(500, 930, 112),
      path('M445 930 L500 875 L555 930 L500 985 Z'),
      // horn player body, opening where the horn passes through
      path('M' + pt(e1) + ' A' + tR + ' ' + tR + ' 0 1 0 ' + pt(e2)),
      stalk(1030), stalk(1210),
      footT, footT2,
      circle(mc[0], mc[1], mr),
      circle(1060, 770, 36),
      path('M' + r(mx) + ' ' + (y0 - th) + ' L1430 ' + (y0 - th) + ' L1520 710'),
      path('M' + r(mx) + ' ' + (y0 + th) + ' L1430 ' + (y0 + th) + ' L1520 910'),
      ellipse(1520, 810, 30, 100),
      path('M1245 782 L1245 748 L1280 748 L1280 782 M1300 782 L1300 748 L1335 748 L1335 782'),
      ellipse(1275, 873, 45, 35),
      circle(950, 860, 34), circle(1040, 960, 30), circle(1160, 950, 34), circle(1000, 620, 26),
      note(1390, 280, 0.9), note(1460, 560, 0.75),
      path('M40 1100 L1560 1100')
    ].join('');
  });
})();
