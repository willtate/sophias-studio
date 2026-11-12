/* Animals: puppy, bunny, elephant, lion. */
(function () {
  'use strict';
  var A = window.Art;
  var r = A.r, circle = A.circle, ellipse = A.ellipse, path = A.path, sun = A.sun, cloud = A.cloud,
    mirror = A.mirror;

  // Point on a circle at angle deg (0 = right, 90 = down).
  function onC(cx, cy, R, deg) {
    var a = deg * Math.PI / 180;
    return [r(cx + R * Math.cos(a)), r(cy + R * Math.sin(a))];
  }
  // Point on a cubic bezier.
  function bz(p0, p1, p2, p3, t) {
    var u = 1 - t;
    return [r(u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]),
      r(u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1])];
  }
  function P(p) { return p[0] + ' ' + p[1]; }

  // Friendly eye: white oval with a filled pupil looking slightly inward.
  function eye(x, y, rx, ry, px) {
    return ellipse(x, y, rx, ry) + circle(x + (px || 0), y + ry * 0.12, Math.round(rx * 0.5), true);
  }

  // Sitting body hanging from a head circle: side curves, two front legs, two back paws.
  // Returns {svg, L:[p0..p3], R:[p0..p3]} so callers can attach tails.
  function sittingBody(cx, hy, hr, gy, startDeg, w) {
    var s = onC(cx, hy, hr, 180 - startDeg), e = onC(cx, hy, hr, startDeg);
    var L = [s, [cx - w * 1.05, s[1] + 110], [cx - w * 1.1, gy - 70], [cx - w * 0.68, gy]];
    var R = [[cx + w * 0.68, gy], [cx + w * 1.1, gy - 70], [cx + w * 1.05, e[1] + 110], e];
    var svg = path('M' + P(L[0]) + ' C' + P(L[1]) + ' ' + P(L[2]) + ' ' + P(L[3]) +
      ' L' + P(R[0]) + ' C' + P(R[1]) + ' ' + P(R[2]) + ' ' + P(R[3]));
    // front legs (share the centre line)
    var lw = 88, lt = gy - 190;
    svg += path('M' + (cx - lw) + ' ' + gy + ' L' + (cx - lw) + ' ' + (lt + lw / 2) +
      ' A' + lw / 2 + ' ' + lw / 2 + ' 0 0 1 ' + cx + ' ' + (lt + lw / 2) + ' L' + cx + ' ' + gy);
    svg += path('M' + cx + ' ' + (lt + lw / 2) + ' A' + lw / 2 + ' ' + lw / 2 + ' 0 0 1 ' + (cx + lw) + ' ' + (lt + lw / 2) +
      ' L' + (cx + lw) + ' ' + gy);
    // toes
    [cx - lw * 0.66, cx - lw * 0.33, cx + lw * 0.33, cx + lw * 0.66].forEach(function (x) {
      svg += path('M' + r(x) + ' ' + gy + ' L' + r(x) + ' ' + (gy - 26));
    });
    // back paws poking out on each side
    var bp = bz(L[0], L[1], L[2], L[3], 0.8);
    var back = path('M' + P(bp) + ' C' + r(cx - w * 1.25) + ' ' + r(bp[1] - 10) + ' ' + r(cx - w * 1.5) + ' ' + (gy - 40) +
      ' ' + r(cx - w * 1.38) + ' ' + gy) +
      path('M' + r(cx - w * 1.2) + ' ' + gy + ' L' + r(cx - w * 1.2) + ' ' + (gy - 24) +
        ' M' + r(cx - w * 1.03) + ' ' + gy + ' L' + r(cx - w * 1.03) + ' ' + (gy - 24));
    svg += back + mirrorAbout(back, cx);
    return { svg: svg, L: L, R: R };
  }
  function mirrorAbout(svg, cx) {
    return '<g transform="matrix(-1 0 0 1 ' + (2 * cx) + ' 0)">' + svg + '</g>';
  }

  A.page('animals', 'animals-puppy', 'Puppy', function () {
    var cx = 800, hy = 400, hr = 205, gy = 1080;
    var body = sittingBody(cx, hy, hr, gy, 58, 230);
    // floppy ears hanging from the head
    var e1 = onC(cx, hy, hr, 205), e2 = onC(cx, hy, hr, 160);
    var ear = path('M' + P(e1) + ' C' + (e1[0] - 120) + ' ' + (e1[1] - 60) + ' ' + (cx - 330) + ' ' + (hy + 10) +
      ' ' + (cx - 300) + ' ' + (hy + 150) + ' C' + (cx - 280) + ' ' + (hy + 250) + ' ' + (e2[0] - 30) + ' ' + (e2[1] + 60) +
      ' ' + P(e2));
    // wagging tail on the right side
    var t1 = bz(body.R[0], body.R[1], body.R[2], body.R[3], 0.3),
      t2 = bz(body.R[0], body.R[1], body.R[2], body.R[3], 0.48);
    var tail = path('M' + P(t1) + ' C' + (t1[0] + 110) + ' ' + (t1[1] + 10) + ' 1220 820 1235 690' +
      ' C1245 610 1160 600 1150 680 C1140 740 1110 780 ' + P(t2));
    // a bone and a ball
    var bone = path('M250 990 L370 990 A24 24 0 1 1 388 1020 A24 24 0 1 1 370 1050 L250 1050' +
      ' A24 24 0 1 1 232 1020 A24 24 0 1 1 250 990 Z');
    // collar under the chin with a round tag
    var c1 = bz(body.L[0], body.L[1], body.L[2], body.L[3], 0.13),
      c2 = bz(body.R[0], body.R[1], body.R[2], body.R[3], 0.87);
    var collar = path('M' + P(c1) + ' Q' + cx + ' 700 ' + P(c2)) + circle(cx, 672, 30);
    return [
      path('M60 ' + gy + ' L1540 ' + gy),
      sun(190, 180, 80), cloud(1120, 210, 300),
      circle(cx, hy, hr),
      ear, mirrorAbout(ear, cx),
      eye(722, 348, 34, 42, 4), eye(878, 348, 34, 42, -4),
      ellipse(cx, 488, 108, 88),
      path('M772 440 Q800 428 828 440 Q834 464 800 478 Q766 464 772 440 Z', true),
      path('M800 478 L800 498 M800 498 Q775 526 748 506 M800 498 Q825 526 852 506'),
      // little tongue hanging below the smile
      path('M771.9 514.3 C765 575 835 575 828.1 514.3 M800 526 L800 548'),
      body.svg,
      tail,
      collar,
      bone,
      circle(1300, 1000, 80),
      path('M1220 1000 Q1300 1040 1380 1000')
    ].join('');
  });

  A.page('animals', 'animals-bunny', 'Bunny', function () {
    var cx = 800, hy = 470, hr = 190, gy = 1080;
    var a = onC(cx, hy, hr, 236), b = onC(cx, hy, hr, 264);
    var ia = onC(cx, hy, hr, 242), ib = onC(cx, hy, hr, 258);
    var earL = path('M' + P(a) + ' C' + (a[0] - 90) + ' 180 ' + (a[0] - 70) + ' 30 ' + (a[0] - 10) + ' 30' +
      ' C' + (a[0] + 60) + ' 30 ' + (b[0] + 20) + ' 180 ' + P(b)) +
      path('M' + P(ia) + ' C' + (ia[0] - 60) + ' 200 ' + (ia[0] - 50) + ' 100 ' + (ia[0] - 15) + ' 100' +
        ' C' + (ia[0] + 25) + ' 100 ' + (ib[0] + 10) + ' 200 ' + P(ib));
    // big hind feet, and the body curve lands on top of each foot
    var F = [[530, gy], [530, 940], [745, 940], [745, gy]];
    var fp = bz(F[0], F[1], F[2], F[3], 0.42);
    var s = onC(cx, hy, hr, 118);
    var half = path('M' + P(s) + ' C' + (cx - 270) + ' ' + r(s[1] + 90) + ' ' + (cx - 280) + ' ' + (gy - 170) + ' ' + P(fp)) +
      path('M' + P(F[0]) + ' C' + P(F[1]) + ' ' + P(F[2]) + ' ' + P(F[3])) +
      path('M600 ' + gy + ' L600 ' + (gy - 30) + ' M650 ' + gy + ' L650 ' + (gy - 34) + ' M700 ' + gy + ' L700 ' + (gy - 30));
    // carrot lying in the grass
    var carrot = path('M1200 965 L1470 1080 L1200 1080 Q1160 1022.5 1200 965 Z') +
      path('M1250 1015 L1272 1024 M1320 1058 L1345 1062') +
      path('M1180 1022.5 C1130 1000 1100 950 1110 900 C1160 925 1185 970 1180 1022.5') +
      path('M1180 1022.5 C1120 1030 1070 1010 1040 975 C1095 965 1150 985 1180 1022.5');
    return [
      path('M60 ' + gy + ' L1540 ' + gy),
      sun(1380, 190, 80), cloud(150, 260, 300),
      circle(cx, hy, hr),
      earL, mirror(earL),
      eye(728, 460, 32, 40, 4), eye(872, 460, 32, 40, -4),
      path('M780 526 Q800 518 820 526 Q818 546 800 554 Q782 546 780 526 Z', true),
      path('M800 554 L800 574 M800 574 Q778 600 756 582 M800 574 Q822 600 844 582'),
      // buck teeth hanging from the smile
      path('M781 587 L781 616 L819 616 L819 587 M800 590 L800 616'),
      path('M716 540 L616 524 M716 560 L620 572 M884 540 L984 524 M884 560 L980 572'),
      half, mirror(half),
      ellipse(cx, 845, 118, 130),
      carrot,
      // grass tufts
      path('M120 1080 Q130 1030 150 1010 Q155 1050 160 1080 M160 1080 Q175 1020 200 1000 Q200 1050 196 1080'),
      path('M380 1080 Q390 1040 405 1020 Q410 1055 415 1080')
    ].join('');
  });

  A.page('animals', 'animals-elephant', 'Elephant', function () {
    var cx = 800, hy = 420, hr = 195, gy = 1080;
    var e1 = onC(cx, hy, hr, 205), e2 = onC(cx, hy, hr, 140);
    var i1 = onC(cx, hy, hr, 196), i2 = onC(cx, hy, hr, 150);
    var ear = path('M' + P(e1) + ' C' + (e1[0] - 100) + ' 170 300 210 300 410' +
      ' C300 600 ' + (e2[0] - 160) + ' 660 ' + P(e2)) +
      path('M' + P(i1) + ' C' + (i1[0] - 90) + ' 260 380 270 380 410' +
      ' C380 540 ' + (i2[0] - 110) + ' 580 ' + P(i2));
    var body = path('M' + P(e2) + ' C560 640 520 800 540 900 L540 ' + gy + ' L690 ' + gy +
      ' C690 940 910 940 910 ' + gy + ' L1060 ' + gy +
      ' L1060 900 C1080 800 1040 640 ' + P(onC(cx, hy, hr, 40)));
    var t1 = onC(cx, hy, hr, 100), t2 = onC(cx, hy, hr, 80);
    var trunk = path('M' + P(t1) + ' C' + (t1[0] - 4) + ' 720 770 870 885 870' +
      ' C955 870 990 820 990 760 A36 36 0 0 0 918 760' +
      ' C918 785 905 798 882 798 C845 798 ' + t2[0] + ' 760 ' + P(t2)) +
      path('M776 680 Q800 690 822 680 M780 735 Q805 745 828 732');
    var nails = '';
    [565, 615, 935, 985].forEach(function (x) {
      nails += path('M' + x + ' ' + gy + ' A25 25 0 0 1 ' + (x + 50) + ' ' + gy);
    });
    return [
      path('M60 ' + gy + ' L1540 ' + gy),
      sun(1440, 160, 65), cloud(90, 190, 250),
      circle(cx, hy, hr),
      ear, mirrorAbout(ear, cx),
      eye(728, 390, 30, 38, 4), eye(872, 390, 30, 38, -4),
      path('M690 470 Q700 500 730 500 M910 470 Q900 500 870 500'),
      trunk,
      body,
      nails,
      // tuft of hair
      path('M790 226 Q770 180 740 190 M800 225 Q800 170 820 160 M812 226 Q840 190 860 205'),
      A.stemFlower(300, 900, gy, 30, 50), A.stemFlower(1310, 920, gy, 28, 46)
    ].join('');
  });

  A.page('animals', 'animals-lion', 'Lion', function () {
    var cx = 800, hy = 430, fr = 175, gy = 1080, R = 270, n = 14;
    var mane = '', pts = [];
    for (var i = 0; i < n; i++) pts.push(onC(cx, hy, R, -90 + i * 360 / n + 180 / n));
    var chord = 2 * R * Math.sin(Math.PI / n);
    var d = 'M' + P(pts[0]);
    for (i = 1; i <= n; i++) d += ' A' + r(chord * 0.55) + ' ' + r(chord * 0.55) + ' 0 0 1 ' + P(pts[i % n]);
    mane = path(d + ' Z');
    var body = sittingBody(cx, hy, R, gy, -90 + 180 / n + 5 * 360 / n, 245);
    // ears inside the mane
    var a = onC(cx, hy, fr, 222), b = onC(cx, hy, fr, 252);
    var ear = path('M' + P(a) + ' C' + (a[0] - 40) + ' ' + (a[1] - 90) + ' ' + (b[0] - 30) + ' ' + (b[1] - 110) + ' ' + P(b));
    var t1 = bz(body.R[0], body.R[1], body.R[2], body.R[3], 0.2),
      t2 = bz(body.R[0], body.R[1], body.R[2], body.R[3], 0.36);
    var tip1 = [1225, 680], tip2 = [1295, 680];
    var tail = path('M' + P(t1) + ' C' + (t1[0] + 170) + ' ' + t1[1] + ' 1320 880 ' + P(tip2)) +
      path('M' + P(t2) + ' C' + (t2[0] + 90) + ' ' + (t2[1] - 10) + ' 1225 830 ' + P(tip1)) +
      path('M' + P(tip1) + ' C1160 660 1170 570 1265 520 C1330 570 1350 650 ' + P(tip2)) +
      path('M' + P(tip1) + ' Q1260 708 ' + P(tip2)) + path('M1250 640 Q1255 600 1268 575');
    return [
      path('M60 ' + gy + ' L1540 ' + gy),
      sun(190, 170, 80), cloud(1150, 180, 280),
      mane,
      circle(cx, hy, fr),
      ear, mirrorAbout(ear, cx),
      eye(735, 410, 30, 38, 4), eye(865, 410, 30, 38, -4),
      path('M770 470 Q800 458 830 470 Q828 494 800 506 Q772 494 770 470 Z', true),
      path('M800 506 L800 528 M800 528 Q774 560 744 538 M800 528 Q826 560 856 538'),
      circle(715, 500, 5, true), circle(700, 525, 5, true), circle(885, 500, 5, true), circle(900, 525, 5, true),
      body.svg,
      tail,
      // grass
      path('M150 1080 Q160 1030 180 1010 Q185 1050 190 1080 M190 1080 Q205 1020 230 1000 Q230 1050 226 1080'),
      path('M1380 1080 Q1390 1030 1410 1010 Q1415 1050 1420 1080 M1420 1080 Q1435 1020 1460 1000 Q1460 1050 1456 1080')
    ].join('');
  });
})();
