/* Coloring page line art. All pages share a 1600x1200 canvas.
   Shapes are drawn as closed outlines so the paint bucket can fill them. */
(function () {
  'use strict';

  var W = 1600, H = 1200;

  function r(n) { return Math.round(n * 10) / 10; }

  function circle(cx, cy, rad, filled) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + rad + '"' + (filled ? ' fill="#222"' : '') + '/>';
  }
  function ellipse(cx, cy, rx, ry, filled) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"' + (filled ? ' fill="#222"' : '') + '/>';
  }
  function path(d, filled) {
    return '<path d="' + d + '"' + (filled ? ' fill="#222"' : '') + '/>';
  }
  function rect(x, y, w, h, rx) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (rx ? ' rx="' + rx + '"' : '') + '/>';
  }
  function star(cx, cy, R, rr, rot) {
    var pts = [], a0 = (rot || 0) - Math.PI / 2;
    for (var i = 0; i < 10; i++) {
      var rad = i % 2 ? (rr || R * 0.45) : R;
      var a = a0 + i * Math.PI / 5;
      pts.push(r(cx + rad * Math.cos(a)) + ' ' + r(cy + rad * Math.sin(a)));
    }
    return path('M' + pts.join(' L') + ' Z');
  }
  function heart(cx, cy, s) {
    return path('M' + cx + ' ' + r(cy + s * 0.9) +
      ' C' + r(cx - s * 1.4) + ' ' + r(cy + s * 0.1) + ' ' + r(cx - s * 0.9) + ' ' + r(cy - s * 0.9) + ' ' + cx + ' ' + r(cy - s * 0.35) +
      ' C' + r(cx + s * 0.9) + ' ' + r(cy - s * 0.9) + ' ' + r(cx + s * 1.4) + ' ' + r(cy + s * 0.1) + ' ' + cx + ' ' + r(cy + s * 0.9) + ' Z');
  }
  function cloud(x, y, w) {
    return path('M' + x + ' ' + y +
      ' A' + r(w * 0.2) + ' ' + r(w * 0.2) + ' 0 0 1 ' + r(x + w * 0.3) + ' ' + r(y - w * 0.18) +
      ' A' + r(w * 0.24) + ' ' + r(w * 0.24) + ' 0 0 1 ' + r(x + w * 0.72) + ' ' + r(y - w * 0.2) +
      ' A' + r(w * 0.18) + ' ' + r(w * 0.18) + ' 0 0 1 ' + r(x + w) + ' ' + y + ' Z');
  }
  function sun(cx, cy, rad) {
    var s = circle(cx, cy, rad);
    for (var i = 0; i < 10; i++) {
      var a = i * Math.PI / 5;
      s += path('M' + r(cx + (rad + 25) * Math.cos(a)) + ' ' + r(cy + (rad + 25) * Math.sin(a)) +
        ' L' + r(cx + (rad + 70) * Math.cos(a)) + ' ' + r(cy + (rad + 70) * Math.sin(a)));
    }
    return s;
  }
  // Flower: centre circle with teardrop petals that start and end on its rim.
  function flower(cx, cy, rc, len, n) {
    n = n || 5;
    var s = circle(cx, cy, rc), d = 0.34;
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n;
      var p1x = cx + rc * Math.cos(a - d), p1y = cy + rc * Math.sin(a - d);
      var p2x = cx + rc * Math.cos(a + d), p2y = cy + rc * Math.sin(a + d);
      var tx = cx + (rc + len) * Math.cos(a), ty = cy + (rc + len) * Math.sin(a);
      var c1x = cx + (rc + len * 0.75) * Math.cos(a - d * 2), c1y = cy + (rc + len * 0.75) * Math.sin(a - d * 2);
      var c2x = cx + (rc + len * 0.75) * Math.cos(a + d * 2), c2y = cy + (rc + len * 0.75) * Math.sin(a + d * 2);
      s += path('M' + r(p1x) + ' ' + r(p1y) + ' Q' + r(c1x) + ' ' + r(c1y) + ' ' + r(tx) + ' ' + r(ty) +
        ' Q' + r(c2x) + ' ' + r(c2y) + ' ' + r(p2x) + ' ' + r(p2y));
    }
    return s;
  }
  function stemFlower(cx, cy, groundY, rc, len) {
    var s = flower(cx, cy, rc, len);
    s += path('M' + cx + ' ' + (cy + rc) + ' L' + cx + ' ' + groundY);
    var ly = cy + rc + (groundY - cy - rc) * 0.55;
    s += path('M' + cx + ' ' + r(ly) + ' Q' + (cx + 45) + ' ' + r(ly - 45) + ' ' + (cx + 95) + ' ' + r(ly - 25) +
      ' Q' + (cx + 50) + ' ' + r(ly + 10) + ' ' + cx + ' ' + r(ly));
    return s;
  }

  var PAGES = [
    {
      id: 'cat', name: 'Kitty',
      art: function () {
        return [
          circle(800, 430, 190),
          path('M666 296 L640 120 L751 246'),
          path('M934 296 L960 120 L849 246'),
          ellipse(730, 410, 30, 42), ellipse(870, 410, 30, 42),
          circle(736, 420, 14, true), circle(876, 420, 14, true),
          path('M778 478 L822 478 L800 504 Z', true),
          path('M800 504 Q800 540 768 546 M800 504 Q800 540 832 546'),
          path('M700 488 L560 466 M700 510 L560 522 M900 488 L1040 466 M900 510 L1040 522'),
          ellipse(800, 850, 260, 230),
          path('M1058 880 C1250 950 1300 740 1200 640 C1170 610 1125 630 1150 662 C1230 760 1190 900 1035 950'),
          path('M720 1076 L720 960 M880 1076 L880 960'),
          ellipse(800, 760, 120, 90),
          path('M160 1080 L1440 1080'),
          // ball of yarn with a loose thread running to the cat's paw
          circle(330, 990, 90),
          path('M262 930 Q330 990 290 1066 M300 912 Q400 980 352 1076 M250 990 Q330 950 410 1010'),
          path('M420 995 Q560 1050 690 1062'),
          // a little mouse hole in the wall
          path('M1220 1080 L1220 980 A70 70 0 0 1 1360 980 L1360 1080')
        ].join('');
      }
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
          flower(180, 1060, 40, 70), flower(1420, 1060, 40, 70),
          star(200, 200, 50), star(1400, 200, 50)
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
          path('M1340 160 A120 120 0 1 0 1340 400 A95 95 0 1 1 1340 160 Z'),
          star(200, 800, 45), star(1200, 600, 40), star(1400, 900, 55), star(450, 1050, 35),
          star(1100, 1080, 30), star(560, 150, 30), star(1050, 220, 35)
        ].join('');
      }
    },
    {
      id: 'dino', name: 'Dino',
      art: function () {
        return [
          ellipse(800, 750, 300, 170),
          path('M960 606 C1000 450 1020 300 1100 260 C1180 220 1260 250 1250 300 C1240 340 1170 340 1130 352 C1080 380 1080 500 1070 672'),
          circle(1192, 282, 12, true),
          path('M1205 320 Q1225 330 1240 318'),
          path('M520 690 C400 650 250 700 120 820 C300 780 420 800 530 820'),
          path('M600 877 L600 1000 L680 1000 L680 906'),
          path('M900 910 L900 1000 L980 1000 L980 886'),
          circle(700, 720, 40), circle(860, 690, 30), circle(800, 800, 34), circle(620, 790, 22),
          path('M0 1000 L1600 1000'),
          path('M1250 1000 L1380 700 L1470 700 L1600 1000'),
          path('M1380 700 Q1400 740 1425 705 Q1445 745 1470 700'),
          cloud(1300, 560, 200),
          sun(220, 200, 85),
          path('M300 1000 L300 900 Q260 860 300 820 Q340 860 300 900')
        ].join('');
      }
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
          path('M720 600 L740 590 M840 580 L860 595 M770 630 L790 640 M880 630 L895 615 M760 450 L780 445 M840 430 L855 445 M800 470 L812 488'),
          star(300, 300, 70), star(1300, 300, 70), star(250, 850, 50), star(1350, 850, 50),
          heart(450, 560, 50), heart(1150, 560, 50)
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
    {
      id: 'blank', name: 'Blank page',
      art: function () { return ''; }
    }
  ];

  function svgFor(page) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<g fill="none" stroke="#222" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">' +
      page.art() + '</g></svg>';
  }

  PAGES.forEach(function (p) {
    p.svg = svgFor(p);
    p.svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(p.svg);
  });

  window.ColorPages = { list: PAGES, W: W, H: H };
})();
