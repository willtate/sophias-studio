/* Space pages. */
(function () {
  'use strict';
  var A = window.Art;
  var r = A.r, circle = A.circle, ellipse = A.ellipse, path = A.path, rect = A.rect, star = A.star,
    mirror = A.mirror;

  // Point on a circle, angle in degrees (y points down, so 90 is straight down).
  function pt(cx, cy, R, deg) {
    var a = deg * Math.PI / 180;
    return r(cx + R * Math.cos(a)) + ' ' + r(cy + R * Math.sin(a));
  }
  function rot(svg, deg, cx, cy) {
    return '<g transform="rotate(' + deg + ' ' + cx + ' ' + cy + ')">' + svg + '</g>';
  }

  // Planet with a ring band (two ellipses). The back of the ring hides behind the planet,
  // the front crosses over it; every arc starts and ends exactly on another outline.
  function ringed(cx, cy, R, deg, extra) {
    var a1 = R * 1.75, b1 = R * 0.55, a2 = R * 1.4, b2 = R * 0.28;
    function hit(a, b) {
      var y = Math.sqrt((1 - R * R / (a * a)) / (1 / (b * b) - 1 / (a * a)));
      return { x: Math.sqrt(R * R - y * y), y: y };
    }
    var h1 = hit(a1, b1), h2 = hit(a2, b2);
    var X = function (v) { return r(cx + v); }, Y = function (v) { return r(cy + v); };
    var s = [
      // outer and inner ring edges, everything except the part hidden behind the planet
      path('M' + X(-h1.x) + ' ' + Y(-h1.y) + ' A' + r(a1) + ' ' + r(b1) + ' 0 1 0 ' + X(h1.x) + ' ' + Y(-h1.y)),
      path('M' + X(-h2.x) + ' ' + Y(-h2.y) + ' A' + r(a2) + ' ' + r(b2) + ' 0 1 0 ' + X(h2.x) + ' ' + Y(-h2.y)),
      // planet above the front band, and the bit peeking out below it
      path('M' + X(-h2.x) + ' ' + Y(h2.y) + ' A' + R + ' ' + R + ' 0 1 1 ' + X(h2.x) + ' ' + Y(h2.y)),
      path('M' + X(h1.x) + ' ' + Y(h1.y) + ' A' + R + ' ' + R + ' 0 0 1 ' + X(-h1.x) + ' ' + Y(h1.y)),
      extra || ''
    ].join('');
    return rot(s, deg, cx, cy);
  }

  // Small planet with a single-line ring (for little background planets).
  function ringlet(cx, cy, R, deg) {
    var a = R * 1.75, b = R * 0.42;
    var y = Math.sqrt((1 - R * R / (a * a)) / (1 / (b * b) - 1 / (a * a))), x = Math.sqrt(R * R - y * y);
    return rot(circle(cx, cy, R) +
      path('M' + r(cx - x) + ' ' + r(cy - y) + ' A' + r(a) + ' ' + r(b) + ' 0 1 0 ' + r(cx + x) + ' ' + r(cy - y)), deg, cx, cy);
  }
  function bez(p0, p1, p2, p3, t) {
    var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  }
  function xy(p) { return r(p[0]) + ' ' + r(p[1]); }

  // Crescent moon opening to the right; h = half height.
  function crescent(x, y, h) {
    var r2 = r(h * 1.6);
    return path('M' + x + ' ' + (y - h) + ' A' + h + ' ' + h + ' 0 0 0 ' + x + ' ' + (y + h) +
      ' A' + r2 + ' ' + r2 + ' 0 0 1 ' + x + ' ' + (y - h) + ' Z');
  }

  // Big friendly eyes: white eye plus a filled pupil looking slightly to one side.
  function eye(x, y, rx, ry, px) {
    return ellipse(x, y, rx, ry) + circle(r(x + (px || 0)), r(y + ry * 0.2), r(rx * 0.45), true);
  }

  /* ---------- Astronaut ---------- */
  A.page('space', 'space-astronaut', 'Astronaut', function () {
    var hx = 800, hy = 420, HR = 230;
    // left half (ear, arm, leg) gets mirrored for the right side
    var half = [
      // helmet ear piece: both ends on the helmet circle
      path('M' + pt(hx, hy, HR, 200) + ' L536 352 Q518 420 536 488 L' + pt(hx, hy, HR, 160)),
      // arm reaching up and out, ending on the glove circle
      circle(410, 600, 62),
      path('M600 770 Q520 735 ' + pt(410, 600, 62, -5)),
      path('M600 862 Q480 830 ' + pt(410, 600, 62, 78)),
      // leg and boot
      path('M640 940 L640 1030 M750 940 L750 1030'),
      path('M620 1030 L755 1030 Q775 1030 775 1055 L775 1085 Q775 1110 750 1110 L580 1110 Q555 1110 555 1080 Q555 1030 620 1030 Z')
    ].join('');
    var astro = [
      circle(hx, hy, HR),
      // visor with a fringe of hair and a happy face
      ellipse(800, 430, 165, 145),
      path('M662.4 350 Q700 392 740 360 Q780 392 820 360 Q860 392 937.6 350'),
      eye(745, 432, 30, 38, 6), eye(855, 432, 30, 38, 6),
      path('M752 500 Q800 545 848 500'),
      circle(700, 495, 18), circle(900, 495, 18),
      // antenna
      path('M800 190 L800 132'), circle(800, 110, 22),
      // suit body, closed against the helmet
      path('M' + pt(hx, hy, HR, 60) + ' C990 650 1000 700 1000 760 L1000 900 Q1000 940 960 940 L640 940 Q600 940 600 900 L600 760 C600 700 610 650 ' + pt(hx, hy, HR, 120)),
      rect(735, 745, 130, 95, 22), circle(772, 792, 18), circle(828, 792, 18),
      half, mirror(half)
    ].join('');
    return [
      rot(astro, -8, 800, 650),
      star(180, 190, 52), star(1420, 200, 46), star(560, 90, 30, null, 0.3),
      star(1120, 110, 34, null, -0.2), star(190, 960, 42, null, 0.2),
      ringlet(1370, 980, 85, -14),
      crescent(1500, 560, 70)
    ].join('');
  });

  /* ---------- Alien in a flying saucer ---------- */
  A.page('space', 'space-alien', 'Alien Saucer', function () {
    var HX = 800, HY = 390, HR = 135;
    function sy(x) { return 780 - 130 * Math.sqrt(1 - Math.pow((x - 800) / 460, 2)); } // saucer top
    var b0 = [660, sy(660)], b1 = [660, 575], b2 = [700, 535], hp = pt(HX, HY, HR, 116).split(' ').map(Number);
    var lo = bez(b0, b1, b2, hp, 0.22), up = bez(b0, b1, b2, hp, 0.68);
    var hx = 505, hy = 395, hr = 60; // hand
    var arm = [
      // body side, from the saucer top up to the head
      path('M' + xy(b0) + ' C660 575 700 535 ' + xy(hp)),
      // waving arm ending on a round mitten hand with a thumb
      circle(hx, hy, hr),
      path('M' + xy(up) + ' Q625 480 ' + pt(hx, hy, hr, -15)),
      path('M' + xy(lo) + ' Q590 560 ' + pt(hx, hy, hr, 70)),
      path('M' + pt(hx, hy, hr, -78) + ' C' + pt(hx, hy, hr + 60, -72) + ' ' + pt(hx, hy, hr + 60, -32) + ' ' + pt(hx, hy, hr, -26)),
      path('M' + pt(hx, hy, hr, -105) + ' L' + pt(hx, hy, hr - 26, -105) + ' M' + pt(hx, hy, hr, -135) + ' L' + pt(hx, hy, hr - 26, -135)),
      // antenna with a bobble
      circle(712, 172, 26),
      path('M' + pt(HX, HY, HR, -112) + ' Q735 230 ' + pt(712, 172, 26, 75))
    ].join('');
    return [
      // saucer
      ellipse(800, 780, 460, 130),
      path('M340 780 C500 850 1100 850 1260 780'),
      path('M540 887.3 C570 990 1030 990 1060 887.3'),
      circle(600, 862, 22), circle(800, 872, 24), circle(1000, 862, 22),
      // alien
      circle(HX, HY, HR),
      eye(750, 375, 40, 50, 4), eye(850, 375, 40, 50, 4),
      path('M745 445 Q800 495 855 445'),
      circle(700, 440, 16), circle(900, 440, 16),
      ellipse(800, 600, 50, 34),
      arm, mirror(arm),
      // sky
      crescent(250, 200, 95),
      ringlet(1370, 240, 75, 12),
      star(240, 620, 40, null, 0.2), star(1380, 560, 46, null, -0.2),
      star(220, 1060, 36), star(1400, 1050, 44, null, 0.3), star(560, 110, 30), star(1060, 110, 32, null, 0.4)
    ].join('');
  });

  /* ---------- Planets and a comet ---------- */
  A.page('space', 'space-planets', 'Planets', function () {
    function at(x, y, svg) { return '<g transform="translate(' + x + ' ' + y + ')">' + svg + '</g>'; }
    function face(s) {
      return eye(-0.34 * s, -0.36 * s, 0.17 * s, 0.21 * s, 0.02 * s) + eye(0.34 * s, -0.36 * s, 0.17 * s, 0.21 * s, 0.02 * s) +
        path('M' + r(-0.22 * s) + ' ' + r(-0.06 * s) + ' Q0 ' + r(0.12 * s) + ' ' + r(0.22 * s) + ' ' + r(-0.06 * s));
    }
    var cx = 1200, cy = 220, cr = 66; // comet head
    return [
      // little cratered planet
      circle(250, 820, 150),
      at(250, 860, face(150)),
      circle(180, 920, 24), circle(330, 720, 20), circle(330, 925, 16),
      // big ringed planet
      ringed(800, 600, 225, -12, at(800, 600, face(225))),
      // small ringed planet
      ringed(1355, 860, 125, 14, at(1355, 860, face(125))),
      // comet: round head with a wavy two-stripe tail
      circle(cx, cy, cr),
      path('M' + pt(cx, cy, cr, -100) + ' Q980 110 760 75 Q800 140 730 190 Q800 240 760 305 Q980 290 ' + pt(cx, cy, cr, 105)),
      path('M' + pt(cx, cy, cr, 182) + ' Q960 200 730 190'),
      // a few stars
      star(170, 190, 50), star(470, 330, 32, null, 0.3), star(1470, 470, 44, null, -0.2),
      star(560, 1080, 36, null, 0.2), star(1000, 1060, 40), star(1490, 1110, 30, null, 0.3)
    ].join('');
  });

  /* ---------- Moon rover ---------- */
  A.page('space', 'space-rover', 'Moon Rover', function () {
    var wheels = [560, 800, 1040].map(function (x) {
      return circle(x, 795, 85) + circle(x, 795, 32) + circle(x, 795, 8, true);
    }).join('');
    var HX = 800, HY = 480, HR = 88;
    var rover = [
      wheels,
      path('M420 640 Q420 600 460 600 L1140 600 Q1180 600 1180 640 L1180 720 L1140 720 ' +
        'A125 125 0 0 0 940 720 L900 720 A125 125 0 0 0 700 720 L660 720 A125 125 0 0 0 460 720 L420 720 Z'),
      circle(1134, 650, 22), circle(470, 650, 18),
      // glass canopy with a little astronaut inside
      path('M560 600 A240 240 0 0 1 1040 600'),
      circle(HX, HY, HR),
      ellipse(HX, HY + 6, 64, 52),
      eye(776, 482, 12, 15, 1), eye(824, 482, 12, 15, 1),
      path('M782 515 Q800 530 818 515'),
      path('M690 600 C690 560 712 540 ' + pt(HX, HY, HR, 140)),
      path('M910 600 C910 560 888 540 ' + pt(HX, HY, HR, 40)),
      // radio dish
      path('M1070 470 Q1130 545 1190 470 Z'),
      path('M1130 600 L1130 507')
    ].join('');
    return [
      // moon ground with craters
      path('M20 850 C150 830 200 880 300 880 L1300 880 C1400 880 1450 830 1580 850 L1580 1180 L20 1180 Z'),
      ellipse(230, 1020, 130, 42), ellipse(1360, 1060, 150, 46), ellipse(780, 1110, 95, 30),
      '<g transform="translate(800 880) scale(1.2) translate(-800 -880)">' + rover + '</g>',
      // Earth in the sky
      circle(1330, 200, 125),
      path('M1260 140 Q1300 108 1332 148 Q1322 194 1280 202 Q1238 184 1260 140 Z'),
      path('M1350 235 Q1395 216 1415 250 Q1398 292 1355 286 Q1326 264 1350 235 Z'),
      // stars
      star(160, 170, 48), star(500, 130, 34, null, 0.3), star(960, 120, 40, null, -0.2),
      star(170, 560, 38, null, 0.2), star(1480, 560, 44)
    ].join('');
  });

  /* ---------- Space cat in a tiny rocket ---------- */
  A.page('space', 'space-cat', 'Space Cat', function () {
    var dx = 800, dy = 380, DR = 190; // glass dome
    var hx = 800, hy = 400, HR = 100; // cat head
    var half = [
      // ear
      path('M' + pt(hx, hy, HR, 205) + ' L705 268 L' + pt(hx, hy, HR, 247)),
      path('M' + pt(hx, hy, HR, 218) + ' L722 300 L' + pt(hx, hy, HR, 238)),
      // whiskers
      path('M690 418 L640 408 M690 442 L642 452'),
      // shoulder from the dome bottom up to the head
      path('M' + pt(dx, dy, DR, 115) + ' C722 515 735 495 ' + pt(hx, hy, HR, 120)),
      // fin and nozzle side
      path('M614.7 752 Q520 800 515 965 L640 860')
    ].join('');
    var rocket = [
      circle(dx, dy, DR),
      path('M' + pt(dx, dy, DR, 30) + ' C1000 600 1000 750 960 860 L640 860 C600 750 600 600 ' + pt(dx, dy, DR, 150)),
      circle(800, 705, 58), circle(800, 705, 34),
      circle(hx, hy, HR),
      eye(765, 395, 22, 28, 3), eye(835, 395, 22, 28, 3),
      path('M788 432 L812 432 L800 446 Z', true),
      path('M800 446 Q800 466 780 470 M800 446 Q800 466 820 470'),
      half, mirror(half),
      // nozzle and flames
      path('M700 860 L680 920 L920 920 L900 860'),
      path('M700 920 Q720 1040 800 1110 Q880 1040 900 920'),
      path('M748 920 Q762 990 800 1030 Q838 990 852 920')
    ].join('');
    return [
      rot(rocket, 14, 800, 650),
      star(200, 200, 50), star(1380, 170, 44, null, 0.3), star(250, 900, 42, null, -0.2),
      star(1150, 1060, 36), star(520, 1080, 30, null, 0.4),
      ringlet(1330, 700, 90, -16),
      crescent(260, 520, 70)
    ].join('');
  });
})();
