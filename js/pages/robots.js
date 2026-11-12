/* Robots: six friendly robots (boxy waver, robot dog, rocket flyer, gardener, chef, family). */
(function () {
  'use strict';
  var A = window.Art;
  var r = A.r, circle = A.circle, ellipse = A.ellipse, path = A.path, rect = A.rect, star = A.star,
    heart = A.heart, cloud = A.cloud, sun = A.sun, flower = A.flower, stemFlower = A.stemFlower;

  function pt(x, y) { return r(x) + ' ' + r(y); }

  // Where a ray from point e in direction -u first meets a clip shape.
  // clip: {line: [x1, y1, x2, y2]} or {circle: [cx, cy, rad]}
  function backHit(ex, ey, ux, uy, clip) {
    var dx = -ux, dy = -uy;
    if (clip.line) {
      var L = clip.line, qx = L[2] - L[0], qy = L[3] - L[1];
      var den = dx * qy - dy * qx;
      var t = ((L[0] - ex) * qy - (L[1] - ey) * qx) / den;
      return [ex + dx * t, ey + dy * t];
    }
    var C = clip.circle, fx = ex - C[0], fy = ey - C[1];
    var b = fx * dx + fy * dy, c = fx * fx + fy * fy - C[2] * C[2];
    var t2 = -b - Math.sqrt(b * b - c);
    return [ex + dx * t2, ey + dy * t2];
  }

  // An arm: two parallel lines from a body outline (clip) to a round hand at (hx, hy).
  // (sx, sy) is roughly the shoulder; w is the half-width of the arm.
  function arm(clip, sx, sy, hx, hy, hr, w) {
    var len = Math.hypot(hx - sx, hy - sy), ux = (hx - sx) / len, uy = (hy - sy) / len;
    var nx = -uy, ny = ux, a = Math.sqrt(hr * hr - w * w);
    var mx = hx - ux * a, my = hy - uy * a, s = '';
    [1, -1].forEach(function (k) {
      var ex = mx + nx * w * k, ey = my + ny * w * k;
      var b = backHit(ex, ey, ux, uy, clip);
      s += path('M' + pt(b[0], b[1]) + ' L' + pt(ex, ey));
    });
    return s + circle(hx, hy, hr);
  }

  // Two friendly eyes with pupils looking slightly toward (lx, ly) offset.
  function eyes(x1, x2, y, er, lx, ly) {
    var pr = Math.round(er * 0.45);
    lx = lx || 0; ly = ly || 4;
    return circle(x1, y, er) + circle(x2, y, er) +
      circle(x1 + lx, y + ly, pr, true) + circle(x2 + lx, y + ly, pr, true);
  }

  // Antenna standing on a point, with a ball tip.
  function antenna(x, y, len, br) {
    return path('M' + x + ' ' + y + ' L' + x + ' ' + (y - len)) + circle(x, y - len - br, br);
  }

  // A leg as a U shape hanging from a straight bottom edge at y0, with a foot line.
  function leg(x, y0, w, y1) {
    var rr = w / 2;
    return path('M' + x + ' ' + y0 + ' L' + x + ' ' + (y1 - rr) +
      ' A' + rr + ' ' + rr + ' 0 0 0 ' + (x + w) + ' ' + (y1 - rr) + ' L' + (x + w) + ' ' + y0) +
      path('M' + x + ' ' + (y1 - rr - 20) + ' L' + (x + w) + ' ' + (y1 - rr - 20));
  }

  function drop(x, y, s) {
    return path('M' + pt(x, y - s) + ' C' + pt(x + s * 0.9, y + s * 0.1) + ' ' + pt(x + s * 0.75, y + s) + ' ' + pt(x, y + s) +
      ' C' + pt(x - s * 0.75, y + s) + ' ' + pt(x - s * 0.9, y + s * 0.1) + ' ' + pt(x, y - s) + ' Z');
  }

  // Ear bump on a vertical head edge at x, between y1 and y2, bulging by dx (negative = left).
  function ear(x, y1, y2, dx) {
    return path('M' + x + ' ' + y1 + ' C' + (x + dx) + ' ' + y1 + ' ' + (x + dx) + ' ' + y2 + ' ' + x + ' ' + y2);
  }

  /* 1. Boxy robot waving, heart on its chest */
  A.page('robots', 'robots-hello', 'Hello Robot', function () {
    return [
      path('M140 1080 L1460 1080'),
      // head
      rect(620, 250, 360, 250, 50),
      antenna(800, 250, 70, 28),
      ear(620, 320, 430, -60), ear(980, 320, 430, 60),
      eyes(725, 875, 360, 50, 4, 6),
      path('M740 435 Q800 485 860 435'),
      // neck + body
      rect(765, 500, 70, 60),
      rect(600, 560, 400, 360, 40),
      heart(800, 700, 80),
      circle(710, 850, 24), circle(800, 850, 24), circle(890, 850, 24),
      // arms
      arm({ line: [1000, 0, 1000, 1] }, 1000, 700, 1180, 410, 60, 42),
      arm({ line: [600, 0, 600, 1] }, 600, 680, 470, 860, 52, 38),
      path('M1270 350 Q1300 410 1270 470'), path('M1310 320 Q1355 410 1310 500'),
      // legs
      rect(650, 920, 90, 100), rect(860, 920, 90, 100),
      rect(615, 1020, 160, 60, 28), rect(825, 1020, 160, 60, 28),
      // potted flower
      rect(200, 910, 180, 50, 12),
      path('M220 960 L245 1080 L335 1080 L360 960'),
      stemFlower(290, 730, 910, 38, 60),
      // toy blocks
      rect(1180, 960, 120, 120), rect(1300, 960, 120, 120), rect(1240, 840, 120, 120),
      star(1240, 1022, 40), circle(1360, 1020, 34), heart(1300, 900, 32)
    ].join('');
  });

  /* 2. Robot dog with a bone */
  A.page('robots', 'robots-dog', 'Robo Pup', function () {
    var floor = 1060;
    return [
      path('M100 ' + floor + ' L1500 ' + floor),
      // body
      rect(380, 600, 700, 280, 70),
      rect(490, 670, 290, 150, 30),
      circle(885, 735, 50), path('M885 735 L913 707'),
      circle(1010, 700, 20), circle(1010, 770, 20),
      // tail with a ball tip
      path('M380 690 Q300 680 295 600'), circle(295, 570, 30),
      // neck + head
      rect(925, 560, 80, 40),
      rect(860, 300, 360, 260, 60),
      antenna(1040, 300, 60, 26),
      path('M860 370 C775 360 755 500 800 535 C830 560 860 525 860 490'),
      path('M1220 370 C1305 360 1325 500 1280 535 C1250 560 1220 525 1220 490'),
      eyes(980, 1100, 415, 46, 6, 6),
      ellipse(1040, 482, 26, 17, true),
      path('M990 508 Q1015 538 1040 508 Q1065 538 1090 508'),
      // legs
      leg(450, 880, 100, floor), leg(590, 880, 100, floor), leg(770, 880, 100, floor), leg(905, 880, 100, floor),
      // bone
      '<g transform="translate(20 14)">' +
        path('M1265 962 L1400 962 A28 28 0 1 1 1432 990 A28 28 0 1 1 1400 1018 L1265 1018 A28 28 0 1 1 1233 990 A28 28 0 1 1 1265 962 Z') + '</g>',
      // food bowl
      '<g transform="translate(-30 20)">' +
        path('M150 960 L370 960 L340 1040 L180 1040 Z') + path('M160 935 Q260 880 360 935') +
        path('M150 960 L160 935 M370 960 L360 935') + '</g>'
    ].join('');
  });

  /* 3. Round robot flying on rocket feet */
  A.page('robots', 'robots-rocket', 'Zoom Bot', function () {
    var cx = 800, cy = 490, R = 250, C = { circle: [cx, cy, R] };
    function onC(deg, d) {
      var a = deg * Math.PI / 180;
      return [cx + (R + (d || 0)) * Math.cos(a), cy + (R + (d || 0)) * Math.sin(a)];
    }
    function ant(deg) {
      var p = onC(deg), q = onC(deg, 60), b = onC(deg, 86);
      return path('M' + pt(p[0], p[1]) + ' L' + pt(q[0], q[1])) + circle(r(b[0]), r(b[1]), 26);
    }
    function ys(x) { return r(cy + Math.sqrt(R * R - (x - cx) * (x - cx))); }
    function foot(x0) {
      var a = x0 + 35, b = x0 + 95;
      return path('M' + a + ' ' + ys(a) + ' L' + a + ' 800 M' + b + ' ' + ys(b) + ' L' + b + ' 800') +
        rect(x0, 800, 130, 140, 32) + path('M' + x0 + ' 870 L' + (x0 + 130) + ' 870') +
        path('M' + (x0 + 32) + ' 940 C' + (x0 + 15) + ' 1000 ' + (x0 + 50) + ' 1040 ' + (x0 + 65) + ' 1110 C' +
          (x0 + 80) + ' 1040 ' + (x0 + 115) + ' 1000 ' + (x0 + 98) + ' 940');
    }
    var l1 = onC(160), l2 = onC(200), r1 = onC(-20), r2 = onC(20), sR = onC(-38), sL = onC(-142);
    var bot = [
      circle(cx, cy, R),
      ant(-103), ant(-77),
      path('M' + pt(l2[0], l2[1]) + ' C470 ' + r(l2[1]) + ' 470 ' + r(l1[1]) + ' ' + pt(l1[0], l1[1])),
      path('M' + pt(r1[0], r1[1]) + ' C1130 ' + r(r1[1]) + ' 1130 ' + r(r2[1]) + ' ' + pt(r2[0], r2[1])),
      rect(645, 350, 310, 200, 50),
      eyes(740, 860, 440, 44, 4, -6),
      path('M755 497 Q800 532 845 497'),
      circle(800, 640, 42), path('M800 640 L800 610'),
      circle(705, 630, 20), circle(895, 630, 20),
      arm(C, sR[0], sR[1], 1170, 180, 58, 40),
      arm(C, sL[0], sL[1], 430, 180, 58, 40),
      foot(650), foot(820)
    ].join('');
    return [
      cloud(60, 1000, 330), cloud(1210, 1100, 330), cloud(1230, 560, 260), cloud(110, 520, 220),
      '<g transform="rotate(-5 800 600)">' + bot + '</g>'
    ].join('');
  });

  /* 4. Tall robot watering a flower */
  A.page('robots', 'robots-garden', 'Garden Bot', function () {
    return [
      path('M120 1000 L1480 1000'),
      sun(1390, 180, 70),
      // head
      rect(520, 170, 240, 200, 50),
      antenna(640, 170, 60, 25),
      ear(520, 220, 320, -55), ear(760, 220, 320, 55),
      eyes(590, 690, 265, 40, 8, 4),
      path('M600 320 Q640 352 680 320'),
      // neck + body
      rect(605, 370, 70, 50),
      rect(500, 420, 280, 420, 50),
      rect(550, 470, 180, 130, 25), heart(640, 532, 34),
      circle(590, 690, 40), path('M590 690 L612 668'),
      circle(690, 690, 40), path('M690 690 L668 668'),
      circle(590, 785, 18), circle(640, 785, 18), circle(690, 785, 18),
      // tread base
      rect(600, 840, 80, 50),
      rect(470, 890, 340, 110, 55),
      circle(540, 945, 32), circle(640, 945, 32), circle(740, 945, 32),
      // arms
      arm({ line: [500, 0, 500, 1] }, 500, 540, 415, 740, 48, 34),
      arm({ line: [780, 0, 780, 1] }, 780, 600, 914.3, 627, 48, 34),
      // watering can
      path('M950 540 L1170 540 L1145 710 L975 710 Z'),
      path('M990 540 Q1060 420 1130 540'),
      path('M1165.6 570 L1265 462 M1156.8 630 L1292 486'),
      path('M1265 462 L1282 425 L1330 474 L1292 486'),
      drop(1335, 535, 20), drop(1375, 585, 20), drop(1415, 530, 20),
      // flower
      stemFlower(1375, 785, 1000, 50, 85)
    ].join('');
  });

  /* 5. Robot chef with a big pot */
  A.page('robots', 'robots-chef', 'Chef Bot', function () {
    // ladle handle from the hand to the pot rim
    var hx = 1110, hy = 610, hr = 46, tx = 1060, ty = 760;
    var dl = Math.hypot(tx - hx, ty - hy), ex = (tx - hx) / dl, ey = (ty - hy) / dl;
    var lx = hx + ex * hr, ly = hy + ey * hr, ux = hx - ex * hr, uy = hy - ey * hr;
    var bx = hx - ex * (hr + 40), by = hy - ey * (hr + 40), kx = hx - ex * (hr + 58), ky = hy - ey * (hr + 58);
    return [
      path('M100 1040 L1500 1040'),
      // chef hat
      rect(690, 190, 220, 60),
      path('M690 190 C590 180 600 50 710 75 C730 10 870 10 890 75 C1000 50 1010 180 910 190'),
      // head
      rect(620, 250, 360, 240, 60),
      ear(620, 320, 420, -55), ear(980, 320, 420, 55),
      eyes(740, 860, 355, 42, 0, 6),
      path('M740 420 Q800 480 860 420 Z'),
      // neck + body (hidden behind the pot)
      rect(765, 490, 70, 50),
      path('M600 760 L600 590 Q600 540 650 540 L950 540 Q1000 540 1000 590 L1000 760'),
      path('M690 760 L690 620 Q690 600 710 600 L890 600 Q910 600 910 620 L910 760'),
      heart(800, 680, 34),
      // arms
      arm({ line: [600, 0, 600, 1] }, 600, 650, 500, 714, 46, 32),
      arm({ line: [1000, 0, 1000, 1] }, 1000, 650, hx, hy, hr, 32),
      path('M' + pt(lx, ly) + ' L' + tx + ' ' + ty),
      path('M' + pt(ux, uy) + ' L' + pt(bx, by)), circle(r(kx), r(ky), 18),
      // pot
      rect(420, 760, 760, 60, 30),
      path('M470 820 L495 1000 Q500 1040 545 1040 L1055 1040 Q1100 1040 1105 1000 L1130 820'),
      path('M' + pt(470 + 25 * 80 / 180, 900) + ' L' + pt(1130 - 25 * 80 / 180, 900)),
      heart(800, 968, 40),
      // tomato + bowl on the counter
      circle(1340, 980, 60),
      path('M1319.5 923.6 L1340 885 L1360.5 923.6'),
      path('M180 960 L400 960 Q400 1040 290 1040 Q180 1040 180 960 Z')
    ].join('');
  });

  /* 6. Robot family of three */
  A.page('robots', 'robots-family', 'Robot Family', function () {
    var floor = 1060;
    // shared hands
    var h1x = 628, h1y = 720, h2x = 985, h2y = 720, hr = 44;
    // mom's dress-like body edges
    var mL = [1110, 500, 1040, 880], mR = [1250, 500, 1320, 880];
    var kc = 800, kb = [690, 730, 910, 930];
    return [
      path('M100 ' + floor + ' L1500 ' + floor),
      cloud(620, 300, 260),
      // DAD: tall and boxy
      rect(300, 230, 240, 190, 45),
      antenna(420, 230, 60, 26),
      eyes(375, 465, 315, 36, 0, 5),
      path('M385 370 Q420 395 455 370'),
      rect(385, 420, 70, 40),
      rect(280, 460, 280, 370, 45),
      rect(330, 510, 180, 110, 25),
      circle(370, 700, 30), circle(470, 700, 30),
      leg(320, 830, 80, floor), leg(440, 830, 80, floor),
      arm({ line: [280, 0, 280, 1] }, 280, 610, 170, 400, 50, 36),
      arm({ line: [560, 0, 560, 1] }, 560, 600, h1x, h1y, hr, 32),
      // KID: small round head on one wheel
      circle(kc, 630, 100),
      antenna(kc, 530, 45, 22),
      eyes(762, 838, 625, 32, 0, 4),
      path('M770 672 Q800 694 830 672'),
      rect(kb[0], kb[1], kb[2] - kb[0], kb[3] - kb[1], 60),
      star(800, 830, 55),
      circle(kc, 995, 65), circle(kc, 995, 24),
      arm({ line: [690, 0, 690, 1] }, 690, 820, h1x, h1y, hr, 28),
      arm({ line: [910, 0, 910, 1] }, 910, 820, h2x, h2y, hr, 28),
      // MOM: bell body, bow on her head
      rect(1090, 300, 180, 160, 50),
      eyes(1140, 1220, 380, 32, 0, 4),
      path('M1150 420 Q1180 442 1210 420'),
      circle(1180, 278, 22),
      bow(1180, 278, 22),
      rect(1150, 460, 60, 40),
      path('M1110 500 L1250 500 L1320 880 Q1325 910 1295 910 L1065 910 Q1035 910 1040 880 Z'),
      heart(1180, 640, 45),
      circle(1130, 800, 20), circle(1180, 800, 20), circle(1230, 800, 20),
      leg(1100, 910, 70, floor), leg(1190, 910, 70, floor),
      arm({ line: mL }, 1090, 590, h2x, h2y, hr, 32),
      arm({ line: mR }, 1265, 590, 1380, 780, 48, 34)
    ].join('');
  });

  function bow(cx, cy, cr) {
    function p(deg) { var a = deg * Math.PI / 180; return pt(cx + cr * Math.cos(a), cy + cr * Math.sin(a)); }
    return path('M' + p(200) + ' L' + (cx - 95) + ' ' + (cy - 45) + ' L' + (cx - 85) + ' ' + (cy + 12) + ' L' + p(165)) +
      path('M' + p(-20) + ' L' + (cx + 95) + ' ' + (cy - 45) + ' L' + (cx + 85) + ' ' + (cy + 12) + ' L' + p(15));
  }
})();
