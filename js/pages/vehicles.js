/* Vehicles: fire truck, train, airplane, digger, sailboat, hot air balloon. */
(function () {
  'use strict';
  var A = window.Art;
  var r = A.r, circle = A.circle, ellipse = A.ellipse, path = A.path, rect = A.rect,
    cloud = A.cloud, sun = A.sun;

  function pt(p) { return r(p[0]) + ' ' + r(p[1]); }

  // Chunky wheel: tyre + hub + tiny solid axle.
  function wheel(cx, cy, R) {
    return circle(cx, cy, R) + circle(cx, cy, Math.round(R * 0.45)) + circle(cx, cy, Math.max(8, Math.round(R * 0.1)), true);
  }

  // Wheel arch: a flat bottom edge at y that dips around a wheel (cx, cy, R) so the body
  // outline follows the tyre exactly. Returns the path pieces " L.. A.. ".
  function arch(cx, cy, R, y) {
    var dx = Math.sqrt(R * R - (cy - y) * (cy - y));
    var large = y > cy ? 1 : 0;
    return ' L' + r(cx - dx) + ' ' + y + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + r(cx + dx) + ' ' + y;
  }

  function archRev(cx, cy, R, y) {
    var dx = Math.sqrt(R * R - (cy - y) * (cy - y));
    var large = y > cy ? 1 : 0;
    return ' L' + r(cx + dx) + ' ' + y + ' A' + R + ' ' + R + ' 0 ' + large + ' 0 ' + r(cx - dx) + ' ' + y;
  }

  // Point on a quadratic bezier.
  function qAt(p0, c, p2, t) {
    var u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p2[1]];
  }
  // Point on a cubic bezier.
  function cAt(p0, c1, c2, p3, t) {
    var u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]];
  }
  // Find t in [0,1] where f(t) hits target, by bisection (f monotone on the range).
  function solve(f, target, lo, hi) {
    lo = lo || 0; hi = hi === undefined ? 1 : hi;
    var flo = f(lo) - target;
    for (var i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2, fm = f(mid) - target;
      if ((fm < 0) === (flo < 0)) { lo = mid; flo = fm; } else { hi = mid; }
    }
    return (lo + hi) / 2;
  }
  // Quadratic curve through p0 and p2 that passes through m at t=0.5.
  function qThrough(p0, m, p2) {
    var c = [2 * m[0] - (p0[0] + p2[0]) / 2, 2 * m[1] - (p0[1] + p2[1]) / 2];
    return path('M' + pt(p0) + ' Q' + pt(c) + ' ' + pt(p2));
  }

  // Straight band (arm) of width w from centre P to centre Q, whose two edges end exactly
  // on a circle of radius rq around Q, and start on circle rp around P (or, if rp is a
  // number x-line spec {x: X}, on the vertical line x = X).
  function band(P, Q, w, startOn, rq) {
    var dx = Q[0] - P[0], dy = Q[1] - P[1], L = Math.sqrt(dx * dx + dy * dy);
    var u = [dx / L, dy / L], n = [-u[1], u[0]], h = w / 2;
    var out = '';
    [-1, 1].forEach(function (s) {
      var o = [n[0] * h * s, n[1] * h * s];
      var a;
      if (startOn.x !== undefined) {
        var k = (startOn.x - (P[0] + o[0])) / u[0];
        a = [startOn.x, P[1] + o[1] + u[1] * k];
      } else {
        var back = Math.sqrt(startOn.r * startOn.r - h * h);
        a = [P[0] + o[0] + u[0] * back, P[1] + o[1] + u[1] * back];
      }
      var fwd = Math.sqrt(rq * rq - h * h);
      var b = [Q[0] + o[0] - u[0] * fwd, Q[1] + o[1] - u[1] * fwd];
      out += path('M' + pt(a) + ' L' + pt(b));
    });
    return out;
  }

  // ---------------------------------------------------------------- Fire truck
  A.page('vehicles', 'vehicles-firetruck', 'Fire Truck', function () {
    var G = 1000, R = 110, wy = G - R, rearX = 470, frontX = 1180;
    var s = [];
    s.push(path('M40 ' + G + ' L1560 ' + G));
    // rear body with wheel arch
    s.push(path('M1020 620 L290 620 Q260 620 260 650 L260 850 Q260 880 290 880' + arch(rearX, wy, R, 880) + ' L1020 880'));
    // cab
    s.push(path('M1020 880 L1020 520 Q1020 480 1060 480 L1230 480 Q1260 480 1274 510 L1330 630 Q1340 652 1340 690 L1340 880' +
      archRev(frontX, wy, R, 880) + ' L1020 880'));
    s.push(wheel(rearX, wy, R), wheel(frontX, wy, R));
    // cab window with a happy face
    s.push(path('M1070 530 L1212 530 L1266 650 L1070 650 Z'));
    s.push(ellipse(1120, 585, 11, 17, true), ellipse(1180, 585, 11, 17, true));
    s.push(path('M1122 620 Q1150 642 1178 620'));
    s.push(path('M1060 720 L1110 720'));
    // headlight and bumper on the nose
    s.push(path('M1340 712 A30 30 0 0 1 1340 772'));
    s.push(path('M1340 820 L1370 820 Q1390 820 1390 840 L1390 860 Q1390 880 1370 880 L1340 880'));
    // siren light on the roof
    s.push(path('M1110 480 A40 40 0 0 1 1190 480'));
    s.push(path('M1100 420 L1080 400 M1150 400 L1150 370 M1200 420 L1220 400'));
    // lockers on the side
    s.push(rect(300, 655, 200, 90, 16), rect(540, 655, 200, 90, 16), rect(780, 655, 200, 90, 16));
    s.push(circle(400, 700, 9, true), circle(640, 700, 9, true), circle(880, 700, 9, true));
    // turntable and ladder (angled up and back), rails start on the turntable top
    s.push(path('M800 620 L800 585 Q800 560 825 560 L955 560 Q980 560 980 585 L980 620'));
    var c30 = Math.cos(Math.PI / 6), s30 = Math.sin(Math.PI / 6);
    var u = [-c30, -s30], nd = [-s30, c30], W = 76;
    var R0 = [960, 560], L0 = [960 - W / s30, 560], len = 660;
    var Rend = [R0[0] + u[0] * len, R0[1] + u[1] * len];
    var Lend = [Rend[0] + nd[0] * W, Rend[1] + nd[1] * W];
    s.push(path('M' + pt(R0) + ' L' + pt(Rend) + ' A' + (W / 2) + ' ' + (W / 2) + ' 0 0 0 ' + pt(Lend) + ' L' + pt(L0)));
    var t0 = W * c30 / s30; // rail-parameter where the lower rail leaves the turntable
    for (var t = t0 + 90; t < len - 30; t += 95) {
      var a = [R0[0] + u[0] * t, R0[1] + u[1] * t];
      s.push(path('M' + pt(a) + ' L' + pt([a[0] + nd[0] * W, a[1] + nd[1] * W])));
    }
    // fire hydrant
    s.push(path('M120 ' + G + ' L120 900 L200 900 L200 ' + G));
    s.push(path('M108 900 L108 885 Q108 875 118 875 L202 875 Q212 875 212 885 L212 900 Z'));
    s.push(path('M126 875 A34 34 0 0 1 194 875'));
    s.push(path('M120 925 L96 925 L96 965 L120 965 M200 925 L224 925 L224 965 L200 965'));
    // sky
    s.push(sun(1430, 190, 62));
    s.push(cloud(70, 220, 250), cloud(640, 260, 240));
    return s.join('');
  });

  // ---------------------------------------------------------------- Train
  A.page('vehicles', 'vehicles-train', 'Choo-choo Train', function () {
    var G = 1000, s = [];
    // rail and sleepers
    s.push(path('M30 ' + G + ' L1570 ' + G));
    for (var x = 60; x < 1540; x += 120) s.push(path('M' + x + ' ' + G + ' L' + x + ' 1045 L' + (x + 60) + ' 1045 L' + (x + 60) + ' ' + G));

    // carriages: wheels tangent to the body bottom and the rail
    var cr = 60, body = 880;
    [70, 540].forEach(function (x) {
      var w = 400;
      s.push(path('M' + (x - 14) + ' 650 L' + (x - 14) + ' 625 Q' + (x - 14) + ' 590 ' + (x + 20) + ' 590 L' + (x + w - 20) + ' 590 Q' +
        (x + w + 14) + ' 590 ' + (x + w + 14) + ' 625 L' + (x + w + 14) + ' 650 Z'));
      s.push(path('M' + x + ' 650 L' + x + ' ' + body + ' L' + (x + w) + ' ' + body + ' L' + (x + w) + ' 650'));
      s.push(rect(x + 45, 690, 130, 110, 22), rect(x + 225, 690, 130, 110, 22));
      s.push(wheel(x + 95, body + cr, cr), wheel(x + w - 95, body + cr, cr));
    });
    // couplings
    s.push(path('M470 850 L540 850'), path('M940 850 L1000 850'));

    // engine
    var eb = 840, er = 80;
    s.push(path('M975 540 L975 512 Q975 488 999 488 L1201 488 Q1225 488 1225 512 L1225 540 Z'));
    s.push(path('M1000 540 L1000 ' + eb + ' L1450 ' + eb + ' L1450 672 Q1450 640 1418 640 L1200 640'));
    s.push(path('M1200 540 L1200 ' + eb));
    s.push(rect(1045, 580, 115, 110, 22));
    // boiler dome and chimney
    s.push(path('M1235 640 A42 42 0 0 1 1319 640'));
    s.push(path('M1350 640 L1350 570 L1322 500 L1446 500 L1418 570 L1418 640'));
    s.push(path('M1350 570 L1418 570'));
    // headlamp and cow-catcher
    s.push(path('M1450 690 A28 28 0 0 1 1450 746'));
    s.push(path('M1450 ' + eb + ' L1492 ' + eb + ' L1536 980 L1450 980 Z'));
    // boiler band and cute face on the boiler
    s.push(ellipse(1300, 720, 10, 15, true), ellipse(1360, 720, 10, 15, true));
    s.push(path('M1302 760 Q1330 784 1358 760'));
    s.push(wheel(1100, eb + er, er), wheel(1320, eb + er, er));
    // steam puffs drifting back
    s.push(circle(1392, 418, 48), circle(1286, 326, 58), circle(1146, 240, 68));
    s.push(sun(180, 180, 66));
    s.push(cloud(380, 300, 250), cloud(1350, 160, 190));
    return s.join('');
  });

  // ---------------------------------------------------------------- Airplane
  A.page('vehicles', 'vehicles-airplane', 'Airplane', function () {
    var s = [];
    // fuselage with the near wing as part of its outline
    var lead = function (y) { return 900 - 180 * (y - 600) / 300; };
    var trail = function (y) { return 660 - 40 * (y - 600) / 300; };
    s.push(path('M1280 460 C1440 460 1440 700 1280 700 L' + lead(700) + ' 700 L' + lead(900) + ' 900 Q670 935 ' +
      trail(900) + ' 900 L' + r(trail(700)) + ' 700 L470 700 Q340 700 280 560 L250 460 Z'));
    // wing root line inside the fuselage
    s.push(path('M' + lead(700) + ' 700 L900 600 L660 600 L' + r(trail(700)) + ' 700'));
    // tail fin, ends on the fuselage top
    s.push(path('M250 460 L196 236 Q190 210 216 210 L290 210 Q312 210 324 228 L470 460'));
    // windows
    for (var x = 520; x <= 1120; x += 100) s.push(circle(x, 530, 30));
    s.push(path('M1225 500 L1318 500 Q1345 506 1352 562 L1225 562 Z'));
    s.push(path('M1280 628 Q1315 650 1350 626'));
    // propeller: spinner on the nose, two blades from its tip
    var nose = function (t) { return cAt([1280, 460], [1440, 460], [1440, 700], [1280, 700], t); };
    var tTop = solve(function (t) { return nose(t)[1]; }, 545, 0, 0.5);
    var top = nose(tTop), bot = [top[0], 615];
    s.push(path('M' + pt(top) + ' Q1462 580 ' + pt(bot)));
    var tip = qAt(top, [1462, 580], bot, 0.5);
    s.push(path('M' + pt(tip) + ' C1426 520 1418 420 1450 408 C1484 420 1474 520 ' + pt(tip)));
    s.push(path('M' + pt(tip) + ' C1426 640 1418 740 1450 752 C1484 740 1474 640 ' + pt(tip)));
    // whoosh lines behind the tail
    s.push(path('M60 520 L180 520 M90 600 L220 600 M60 680 L200 680'));
    // clouds
    s.push(cloud(70, 1010, 420), cloud(1010, 1080, 430), cloud(1110, 300, 300), cloud(520, 230, 280));
    return s.join('');
  });

  // ---------------------------------------------------------------- Digger
  A.page('vehicles', 'vehicles-digger', 'Digger', function () {
    var G = 1000, s = [];
    s.push(path('M30 ' + G + ' L1570 ' + G));
    // caterpillar track
    var tr = 85, ty = G - tr;
    s.push(path('M385 ' + (G - 2 * tr) + ' L815 ' + (G - 2 * tr) + ' A' + tr + ' ' + tr + ' 0 0 1 815 ' + G +
      ' L385 ' + G + ' A' + tr + ' ' + tr + ' 0 0 1 385 ' + (G - 2 * tr) + ' Z'));
    [385, 530, 670, 815].forEach(function (x) { s.push(circle(x, ty, 45), circle(x, ty, 11, true)); });
    // body and cab
    var top = G - 2 * tr; // 830
    s.push(path('M260 ' + top + ' L260 730 Q260 690 300 690 L820 690 Q860 690 860 730 L860 ' + top + ' Z'));
    s.push(path('M520 690 L520 470 Q520 430 560 430 L760 430 Q800 430 800 470 L800 690'));
    s.push(rect(560, 470, 200, 170, 26));
    s.push(ellipse(625, 535, 12, 18, true), ellipse(695, 535, 12, 18, true));
    s.push(path('M625 580 Q660 606 695 580'));
    // exhaust pipe
    s.push(path('M330 690 L330 600 L378 600 L378 690'));
    s.push(path('M322 600 L322 580 L386 580 L386 600'));
    // stripe on the body
    s.push(path('M260 770 L860 770'));
    // boom, elbow, stick, bucket
    var E = [1130, 320], er = 52, B = [1330, 690], br = 42;
    s.push(circle(E[0], E[1], er), circle(E[0], E[1], 12, true));
    s.push(band([800, 590], E, 84, { x: 800 }, er));
    s.push(band(E, B, 70, { r: er }, br));
    s.push(circle(B[0], B[1], br), circle(B[0], B[1], 11, true));
    // bucket: starts and ends on the pivot circle, teeth on the open edge
    var a1 = 25 * Math.PI / 180, a2 = 150 * Math.PI / 180;
    var p1 = [B[0] + br * Math.cos(a1), B[1] + br * Math.sin(a1)];
    var p2 = [B[0] + br * Math.cos(a2), B[1] + br * Math.sin(a2)];
    s.push(path('M' + pt(p1) + ' C1440 770 1430 920 1310 920 L1298 948 L1282 920 L1266 948 L1250 920 L1234 948 L1222 920 L' + pt(p2)));
    // dirt pile with pebbles
    s.push(path('M1360 ' + G + ' Q1470 800 1575 ' + G));
    s.push(circle(1440, 955, 16), circle(1500, 925, 13), circle(1515, 975, 10, true), circle(1470, 985, 8, true));
    s.push(sun(190, 180, 66));
    s.push(cloud(1250, 210, 260), cloud(560, 230, 230));
    return s.join('');
  });

  // ---------------------------------------------------------------- Sailboat
  A.page('vehicles', 'vehicles-sailboat', 'Sailboat', function () {
    var s = [], wl = 860;
    // hull
    var hl = function (y) { return 360 + 120 * (y - 760) / 140; };
    var hr = function (y) { return 1240 - 120 * (y - 760) / 140; };
    s.push(path('M360 760 L1240 760 L1120 900 Q1102 920 1076 920 L524 920 Q498 920 480 900 Z'));
    s.push(circle(620, 815, 26), circle(740, 815, 26), circle(860, 815, 26), circle(980, 815, 26));
    // mast and flag
    s.push(path('M800 760 L800 110'));
    s.push(path('M800 110 L900 140 L800 170'));
    // main sail with a stripe
    var mA = [800, 200], mC = [600, 450], mB = [440, 720];
    s.push(path('M' + pt(mA) + ' Q' + pt(mC) + ' ' + pt(mB) + ' L800 720'));
    var tm = solve(function (t) { return qAt(mA, mC, mB, t)[1]; }, 500);
    s.push(path('M' + pt(qAt(mA, mC, mB, tm)) + ' L800 500'));
    // jib with a stripe
    var jA = [800, 250], jC = [1000, 480], jB = [1150, 720];
    s.push(path('M' + pt(jA) + ' Q' + pt(jC) + ' ' + pt(jB) + ' L800 720'));
    var tj = solve(function (t) { return qAt(jA, jC, jB, t)[1]; }, 540);
    s.push(path('M' + pt(qAt(jA, jC, jB, tj)) + ' L800 540'));
    // water line meeting the hull sides exactly
    function wave(x0, x1, y, n, amp) {
      var step = (x1 - x0) / n, d = 'M' + r(x0) + ' ' + y + ' Q' + r(x0 + step / 2) + ' ' + (y - amp) + ' ' + r(x0 + step) + ' ' + y;
      for (var i = 2; i <= n; i++) d += ' T' + r(x0 + step * i) + ' ' + y;
      return path(d);
    }
    s.push(wave(20, hl(wl), wl, 3, 36));
    s.push(wave(hr(wl), 1580, wl, 3, 36));
    s.push(wave(20, 1580, 990, 8, 36));
    s.push(wave(20, 1580, 1110, 8, 36));
    // sky
    s.push(sun(1400, 210, 66));
    s.push(cloud(90, 260, 270), cloud(1010, 140, 200));
    s.push(path('M260 470 Q290 440 320 470 Q350 440 380 470'));
    s.push(path('M1250 470 Q1275 445 1300 470 Q1325 445 1350 470'));
    return s.join('');
  });

  // ---------------------------------------------------------------- Hot air balloon
  A.page('vehicles', 'vehicles-balloon', 'Hot Air Balloon', function () {
    var s = [], cx = 800, cy = 420, R = 360;
    var L0 = [cx - R, cy], R0 = [cx + R, cy];
    var rc1 = [1160, 560], rc2 = [1020, 680], rEnd = [920, 760];
    var lc1 = [580, 680], lc2 = [440, 560], lEnd = [680, 760];
    s.push(path('M' + pt(L0) + ' A' + R + ' ' + R + ' 0 0 1 ' + pt(R0) + ' C' + pt(rc1) + ' ' + pt(rc2) + ' ' + pt(rEnd) +
      ' L' + pt(lEnd) + ' C' + pt(lc1) + ' ' + pt(lc2) + ' ' + pt(L0)));
    // crown cap
    var ang = 35 * Math.PI / 180;
    var cL = [cx - R * Math.sin(ang), cy - R * Math.cos(ang)], cR = [cx + R * Math.sin(ang), cy - R * Math.cos(ang)];
    var capC = [cx, cL[1] + 60];
    s.push(path('M' + pt(cL) + ' Q' + pt(capC) + ' ' + pt(cR)));
    // band near the bottom, ends on the side curves
    var by = 630;
    var tr = solve(function (t) { return cAt(R0, rc1, rc2, rEnd, t)[1]; }, by);
    var tl = solve(function (t) { return cAt(lEnd, lc1, lc2, L0, t)[1]; }, by, 0, 1);
    var bR = cAt(R0, rc1, rc2, rEnd, tr), bL = cAt(lEnd, lc1, lc2, L0, tl);
    var bC = [cx, by + 50];
    s.push(path('M' + pt(bL) + ' Q' + pt(bC) + ' ' + pt(bR)));
    // gores: from the crown curve to the band, bowing outwards
    [[0.161, 0.3, -255], [0.355, 0.42, -105], [0.645, 0.58, 105], [0.839, 0.7, 255]].forEach(function (g) {
      var a = qAt(cL, capC, cR, g[0]), b = qAt(bL, bC, bR, g[1]);
      s.push(qThrough(a, [cx + g[2], 400], b));
    });
    // ropes from the envelope to the basket rim
    s.push(path('M700 760 L688 920 M900 760 L912 920'));
    // passenger peeking over the rim
    s.push(path('M750 920 A55 55 0 1 1 850 920'));
    s.push(circle(780, 888, 8, true), circle(820, 888, 8, true));
    s.push(path('M783 906 Q800 920 817 906'));
    // basket
    s.push(rect(660, 920, 280, 48, 14));
    s.push(path('M680 968 L698 1085 Q700 1098 714 1098 L886 1098 Q900 1098 902 1085 L920 968'));
    s.push(path('M753 968 L756 1098 M847 968 L844 1098'));
    // scene
    s.push(path('M20 1140 Q400 1070 800 1140 T1580 1140'));
    s.push(sun(175, 170, 62));
    s.push(cloud(60, 560, 300), cloud(1240, 640, 300), cloud(1220, 200, 220));
    s.push(path('M260 420 Q285 395 310 420 Q335 395 360 420'));
    return s.join('');
  });
})();
