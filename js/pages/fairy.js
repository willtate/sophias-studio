/* Fairy Tales pages: castle, baby dragon, unicorn, princess, mermaid, candy house. */
(function () {
  'use strict';
  var A = window.Art;
  var r = A.r, circle = A.circle, ellipse = A.ellipse, path = A.path, rect = A.rect, star = A.star,
    heart = A.heart, cloud = A.cloud, sun = A.sun, stemFlower = A.stemFlower,
    mirror = A.mirror, place = A.place;

  // ---- geometry helpers (angles in degrees, 0 = right, 90 = down) ----
  function P(p) { return r(p[0]) + ' ' + r(p[1]); }
  function onC(cx, cy, rad, deg) {
    var a = deg * Math.PI / 180;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  }
  function onE(cx, cy, rx, ry, deg) {
    var a = deg * Math.PI / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function cub(seg, t) {
    var u = 1 - t, p0 = seg[0], p1 = seg[1], p2 = seg[2], p3 = seg[3];
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  }
  function quad(p0, p1, p2, t) {
    var u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  }
  function C(seg) { return ' C' + P(seg[1]) + ' ' + P(seg[2]) + ' ' + P(seg[3]); }
  // Where a straight limb of width w, aimed from `from` at circle (c, rad), meets that circle's rim.
  function rimPoints(from, c, rad, w) {
    var dx = c[0] - from[0], dy = c[1] - from[1], L = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / L, uy = dy / L, nx = -uy, ny = ux, h = w / 2, a = Math.sqrt(rad * rad - h * h);
    return [[c[0] - ux * a + nx * h, c[1] - uy * a + ny * h], [c[0] - ux * a - nx * h, c[1] - uy * a - ny * h]];
  }
  // Wavy line of bumps through the given x joints at height y (depth > 0 hangs down).
  function bumps(xs, y, depth) {
    var s = 'M' + xs[0] + ' ' + y;
    for (var i = 1; i < xs.length; i++) s += ' Q' + r((xs[i - 1] + xs[i]) / 2) + ' ' + (y + depth) + ' ' + xs[i] + ' ' + y;
    return s;
  }
  function grass(x, y) {
    return path('M' + (x - 22) + ' ' + y + ' Q' + (x - 18) + ' ' + (y - 30) + ' ' + (x - 30) + ' ' + (y - 50) +
      ' M' + x + ' ' + y + ' L' + x + ' ' + (y - 55) + ' M' + (x + 22) + ' ' + y + ' Q' + (x + 18) + ' ' + (y - 30) + ' ' + (x + 30) + ' ' + (y - 50));
  }

  // ---------------------------------------------------------------- castle
  A.page('fairy', 'fairy-castle', 'Castle', function () {
    var side = [
      path('M340 1050 L340 480 M500 480 L500 560'),
      path('M320 480 L420 250 L520 480 Z'),
      path('M420 250 L420 165'), path('M420 165 L495 187 L420 210 Z'),
      path('M395 720 L395 650 A25 25 0 0 1 445 650 L445 720 Z'),
      path('M395 900 L395 850 A25 25 0 0 1 445 850 L445 900 Z'),
      path('M570 800 L570 715 A35 35 0 0 1 640 715 L640 800 Z'),
      // bush and flower beside the tower
      path('M50 1050 A70 70 0 0 1 190 1050'),
      stemFlower(262, 925, 1050, 20, 34)
    ].join('');
    return [
      path('M20 1050 L1580 1050'),
      // main wall with battlements and the tall middle tower
      path('M500 1050 L500 560 L560 560 L560 600 L620 600 L620 560 L680 560 L680 330' +
        ' M920 330 L920 560 L980 560 L980 600 L1040 600 L1040 560 L1100 560 L1100 1050'),
      path('M680 600 L920 600'),
      path('M660 330 L800 110 L940 330 Z'),
      path('M800 110 L800 32'), path('M800 32 L885 55 L800 78 Z'),
      path('M765 520 L765 450 A35 35 0 0 1 835 450 L835 520 Z'),
      side, mirror(side),
      // door
      path('M720 1050 L720 900 A80 80 0 0 1 880 900 L880 1050 M800 820 L800 1050'),
      circle(778, 950, 9, true), circle(822, 950, 9, true),
      heart(800, 735, 34),
      // path to the door
      path('M720 1050 Q690 1120 620 1180 M880 1050 Q910 1120 980 1180'),
      sun(170, 170, 65),
      cloud(530, 175, 170), cloud(1310, 330, 210)
    ].join('');
  });

  // ---------------------------------------------------------------- baby dragon
  A.page('fairy', 'fairy-dragon', 'Baby Dragon', function () {
    var hc = [800, 380], hr = 205;               // head circle
    var bc = [800, 745], brx = 240, bry = 230;   // body ellipse
    var H = function (d) { return onC(hc[0], hc[1], hr, d); };
    var B = function (d) { return onE(bc[0], bc[1], brx, bry, d); };
    var hl = H(130), hr2 = H(50);                // body arc starts and ends on the head circle
    var bec = [800, 790], berx = 140, bery = 135, stripes = '';
    [715, 770, 825, 880].forEach(function (y) {
      var dx = berx * Math.sqrt(1 - Math.pow((y - bec[1]) / bery, 2));
      stripes += 'M' + r(bec[0] - dx) + ' ' + y + ' L' + r(bec[0] + dx) + ' ' + y + ' ';
    });
    var h = [
      // horn
      path('M' + P(H(240)) + ' Q675 150 690 105 Q735 140 ' + P(H(255))),
      // spiky ear frill
      path('M' + P(H(200)) + ' Q560 322 518 300 Q552 282 535 250 Q585 258 592 228 Q618 248 ' + P(H(222))),
      // eye
      ellipse(730, 370, 46, 56), circle(740, 382, 22, true),
      // wing (behind the body, both ends on the body outline)
      path('M' + P(B(228)) + ' C560 520 490 470 430 440 Q455 510 415 560 Q480 560 470 615 Q520 610 ' + P(B(198))),
      // foot with toes
      path('M' + P(B(100)) + ' C760 1030 640 1045 600 1000 C575 970 590 935 ' + P(B(132))),
      path('M640 1000 L655 980 M690 1012 L700 990')
    ].join('');
    var tailA = B(15), tailB = B(45);
    return [
      path('M20 1040 L1580 1040'),
      circle(hc[0], hc[1], hr),
      path('M' + P(hl) + ' A' + brx + ' ' + bry + ' 0 1 0 ' + P(hr2)),
      h, mirror(h),
      // little spike on top of the head
      path('M' + P(H(263)) + ' Q792 150 800 118 Q808 150 ' + P(H(277))),
      // snout, nostrils, smile, cheeks
      ellipse(800, 480, 95, 58),
      circle(770, 460, 9, true), circle(830, 460, 9, true),
      path('M752 495 Q800 530 848 495'),
      circle(650, 470, 22), circle(950, 470, 22),
      // belly
      ellipse(bec[0], bec[1], berx, bery),
      path(stripes),
      // tail with a spade tip
      path('M' + P(tailA) + ' C1150 800 1230 820 1280 720 M' + P(tailB) + ' C1180 920 1300 880 1320 740'),
      path('M1280 720 C1230 700 1250 620 1340 610 C1350 680 1360 720 1320 740 Q1300 725 1280 720 Z'),
      // hatched egg shell
      path('M150 930 L185 895 L220 932 L255 892 L290 930 L325 896 L360 930 C360 1000 320 1040 255 1040 C190 1040 150 1000 150 930 Z'),
      circle(215, 985, 18), circle(300, 990, 14),
      // scenery
      cloud(160, 260, 230), cloud(1250, 230, 250),
      stemFlower(1460, 900, 1040, 24, 42), grass(470, 1040), grass(1120, 1040)
    ].join('');
  });

  // ---------------------------------------------------------------- unicorn
  A.page('fairy', 'fairy-unicorn', 'Unicorn', function () {
    // t on a cubic segment where x(t) = x (segment must be monotonic in x)
    function atX(seg, x) {
      var lo = 0, hi = 1, up = seg[3][0] > seg[0][0];
      for (var i = 0; i < 50; i++) {
        var m = (lo + hi) / 2;
        if ((cub(seg, m)[0] < x) === up) lo = m; else hi = m;
      }
      return cub(seg, (lo + hi) / 2);
    }
    // big round head (facing left), a loop of cubic segments
    var S = [
      [[540, 230], [640, 225], [725, 290], [720, 390]],
      [[720, 390], [715, 470], [660, 530], [580, 540]],
      [[580, 540], [500, 550], [400, 555], [350, 515]],
      [[350, 515], [300, 475], [310, 395], [370, 370]],
      [[370, 370], [420, 345], [440, 240], [540, 230]]
    ];
    var hs = function (i, t) { return cub(S[i], t); };
    // one continuous outline: neck -> back -> rump -> belly -> chest -> neck, both ends on the head
    var n0 = hs(1, 0.2), n5 = hs(2, 0.05);
    var N = [
      [n0, [750, 520], [800, 562], [900, 565]],
      [[900, 565], [1060, 565], [1225, 590], [1230, 720]],
      [[1230, 720], [1235, 820], [1200, 860], [1160, 865]],
      [[1160, 865], [1000, 900], [790, 900], [620, 860]],
      [[620, 860], [560, 840], [550, 720], [570, 640]],
      [[570, 640], [580, 590], [572, 562], n5]
    ];
    var nb = function (i, t) { return cub(N[i], t); };
    var body = 'M' + P(n0) + N.map(C).join('');
    // short stubby legs with rounded hoof caps
    var legs = '';
    [640, 785, 930, 1070].forEach(function (x) {
      var w = 82, t1 = atX(N[3], x), t2 = atX(N[3], x + w);
      var bx1 = x - 6, bx2 = x + w + 6, hy = 990;
      var k1 = (hy - t1[1]) / (1030 - t1[1]), k2 = (hy - t2[1]) / (1030 - t2[1]);
      var h1 = lerp(t1, [bx1, 1030], k1), h2 = lerp(t2, [bx2, 1030], k2);
      legs += path('M' + P(t1) + ' L' + bx1 + ' 1030 M' + P(t2) + ' L' + bx2 + ' 1030');
      legs += path('M' + P(h1) + ' Q' + r((h1[0] + h2[0]) / 2) + ' 955 ' + P(h2));
    });
    // horn on the forehead, striped
    var hb1 = hs(4, 0.55), hb2 = hs(4, 0.85), tip = [405, 95];
    // mane: three swoopy locks from the top of the head down onto the back
    var mA = hs(0, 0.5), mE = nb(1, 0.1);
    var mane = path('M' + P(mA) + ' C730 180 830 200 815 305 C900 300 925 370 885 425' +
      ' C960 430 985 500 945 545 C990 555 1000 575 ' + P(mE));
    var maneLines = path('M815 305 Q760 330 ' + P(hs(0, 0.92)) + ' M885 425 Q820 420 ' + P(nb(0, 0.3)) +
      ' M945 545 Q900 520 ' + P(nb(0, 0.75)));
    // tail: three locks off the rump
    var tA = nb(1, 0.72), tB = nb(2, 0.45);
    var tail = path('M' + P(tA) + ' C1290 560 1400 570 1405 660 C1460 690 1460 770 1415 800' +
      ' C1450 850 1420 910 1350 905 C1300 880 1265 850 ' + P(tB));
    var tailLines = path('M1405 660 Q1330 660 ' + P(nb(1, 0.95)) + ' M1415 800 Q1340 790 ' + P(nb(2, 0.2)));
    return [
      path('M20 1030 L1580 1030'),
      path(body), legs,
      path('M' + P(S[0][0]) + S.map(C).join('') + ' Z'),
      mane, maneLines, tail, tailLines,
      // horn
      path('M' + P(hb1) + ' L' + P(tip) + ' L' + P(hb2)),
      path('M' + P(lerp(hb1, tip, 0.3)) + ' L' + P(lerp(hb2, tip, 0.3)) +
        ' M' + P(lerp(hb1, tip, 0.6)) + ' L' + P(lerp(hb2, tip, 0.6))),
      // forelock curl
      path('M' + P(hs(4, 0.93)) + ' C495 270 505 320 540 318 C565 300 575 270 ' + P(hs(0, 0.13))),
      // ear
      path('M' + P(hs(0, 0.24)) + ' Q610 160 640 118 Q672 180 ' + P(hs(0, 0.43))),
      path('M632 228 Q636 190 640 160'),
      // face: big eye with lashes, nostril, smile, rosy cheek
      ellipse(595, 400, 36, 48), circle(587, 411, 18, true),
      path('M585 352 L575 328 M607 354 L612 330 M626 364 L642 344'),
      circle(378, 450, 9, true),
      path('M398 492 Q430 512 466 496'),
      circle(528, 470, 24),
      // scenery
      sun(1420, 170, 70),
      cloud(110, 230, 220), cloud(900, 220, 230),
      star(250, 150, 30), star(255, 330, 22),
      stemFlower(200, 880, 1030, 28, 48), stemFlower(1500, 920, 1030, 22, 38),
      grass(500, 1030), grass(1300, 1030)
    ].join('');
  });
  // ---------------------------------------------------------------- princess
  A.page('fairy', 'fairy-princess', 'Princess', function () {
    var hc = [800, 290], hr = 115;
    var H = function (d) { return onC(hc[0], hc[1], hr, d); };
    var neckY = function (x) { return hc[1] + Math.sqrt(hr * hr - Math.pow(x - hc[0], 2)); };
    var bl = function (y) { return 740 + 15 * (y - 450) / 150; };   // bodice left edge
    // skirt edges (left), mirrored for the right
    var L = [[755, 600], [680, 700], [470, 880], [430, 1060]];
    var R = L.map(function (p) { return [1600 - p[0], p[1]]; });
    var hemX = [430, 553, 677, 800, 923, 1047, 1170], hem = '';
    for (var i = 1; i < hemX.length; i++) hem += ' Q' + r((hemX[i - 1] + hemX[i]) / 2) + ' 1115 ' + hemX[i] + ' 1060';
    function tier(t, depth) {
      var a = cub(L, t), b = cub(R, t), n = 5, s = 'M' + P(a);
      for (var k = 1; k <= n; k++) {
        var x0 = a[0] + (b[0] - a[0]) * (k - 1) / n, x1 = a[0] + (b[0] - a[0]) * k / n;
        s += ' Q' + r((x0 + x1) / 2) + ' ' + r(a[1] + depth) + ' ' + r(x1) + ' ' + r(a[1]);
      }
      return path(s);
    }
    // puffy sleeve: an arc of a circle that starts and ends on the bodice edge
    var pc = [705, 520], pr = 52, hits = [];
    for (var y = 440; y <= 600; y += 0.05) {
      var dx = bl(y) - pc[0], dy = y - pc[1];
      if (Math.abs(Math.sqrt(dx * dx + dy * dy) - pr) < 0.05) hits.push([bl(y), y]);
    }
    var sleeve = path('M' + P(hits[0]) + ' A' + pr + ' ' + pr + ' 0 1 0 ' + P(hits[hits.length - 1]));
    var lhand = [605, 680], rhand = [1010, 410], hR = 32;
    var rpc = [1600 - pc[0], pc[1]];
    function arm(c, hand) {
      var a = rimPoints(hand, c, pr, 50), b = rimPoints(c, hand, hR, 50);
      return path('M' + P(a[0]) + ' L' + P(b[1]) + ' M' + P(a[1]) + ' L' + P(b[0])) + circle(hand[0], hand[1], hR);
    }
    var wandStar = [1085, 215];
    var hairL = 'M778 420 Q705 432 655 402 C608 370 598 280 640 222 C672 182 705 172 735 168';
    return [
      // face, bangs and hair (the crown sits on top of the hair)
      path('M' + P(H(200)) + ' A' + hr + ' ' + hr + ' 0 1 0 ' + P(H(340))),
      path('M' + P(H(200)) + ' Q720 305 760 258 Q800 305 840 258 Q880 305 ' + P(H(340))),
      path(hairL), mirror(path(hairL)),
      path('M735 168 L712 85 L765 128 L800 55 L835 128 L888 85 L865 168 Z'),
      circle(800, 132, 13),
      circle(760, 315, 12, true), circle(840, 315, 12, true),
      path('M772 352 Q800 376 828 352'),
      circle(733, 350, 15), circle(867, 350, 15),
      // neck and bodice
      path('M778 ' + r(neckY(778)) + ' L778 450 M822 ' + r(neckY(822)) + ' L822 450'),
      path('M740 450 L860 450 L845 600 L755 600 Z'),
      heart(800, 522, 28),
      sleeve, mirror(sleeve),
      arm(pc, lhand), arm(rpc, rhand),
      // wand
      path('M' + P(onC(rhand[0], rhand[1], hR, -50)) + ' L' + P([wandStar[0] - 4, wandStar[1] + 34])),
      star(wandStar[0], wandStar[1], 72, 32, 0.12),
      star(1240, 140, 26), star(1250, 330, 20),
      // big dress
      path('M' + P(L[0]) + C(L) + hem + ' C' + P(R[2]) + ' ' + P(R[1]) + ' ' + P(R[0])),
      tier(0.42, 45), tier(0.72, 45),
      heart(800, 880, 30), heart(640, 1010, 26), heart(960, 1010, 26), heart(800, 1010, 26),
      // scenery
      stemFlower(200, 900, 1100, 30, 50), stemFlower(1400, 900, 1100, 30, 50),
      path('M20 1100 L330 1100 M1270 1100 L1580 1100'),
      cloud(140, 260, 240)
    ].join('');
  });

  // ---------------------------------------------------------------- mermaid
  A.page('fairy', 'fairy-mermaid', 'Mermaid', function () {
    var hc = [720, 280], hr = 125;
    var H = function (d) { return onC(hc[0], hc[1], hr, d); };
    var neckY = function (x) { return hc[1] + Math.sqrt(hr * hr - Math.pow(x - hc[0], 2)); };
    // shoulder line and torso sides are quadratics with exact lookups
    var shY = function (x) { var t = (x - 620) / 200; return 450 - 60 * t * (1 - t); };
    var TL = [[620, 450], [610, 545], [660, 640]], TR = [[820, 450], [830, 545], [780, 640]];
    var tl = function (y) { return quad(TL[0], TL[1], TL[2], (y - 450) / 190); };
    var tr = function (y) { return quad(TR[0], TR[1], TR[2], (y - 450) / 190); };
    // tail edges
    var lo1 = [[660, 640], [645, 770], [820, 815], [1000, 775]], lo2 = [[1000, 775], [1070, 760], [1120, 725], [1150, 685]];
    var up1 = [[780, 640], [805, 700], [900, 712], [985, 692]], up2 = [[985, 692], [1050, 676], [1100, 645], [1125, 612]];
    function band(a, b) {
      return path('M' + P(a) + ' Q' + r((a[0] + b[0]) / 2 + 22) + ' ' + r((a[1] + b[1]) / 2) + ' ' + P(b));
    }
    var rockL = cub(lo1, 0.32), rockR = cub(lo2, 0.25);
    var waveXs = [20, 115, 210, 305, 400, 488, 576, 664, 752, 840, 928, 1016, 1104, 1180, 1260, 1340, 1420, 1500, 1580];
    // waving arm: from the shoulder line and torso side out to the hand
    var hand = [930, 335], hR = 34;
    var a1 = [805, shY(805)], a2 = tr(518);
    var e = rimPoints([812, 485], hand, hR, 50);
    return [
      // face, bangs, long hair
      path('M' + P(H(200)) + ' A' + hr + ' ' + hr + ' 0 1 0 ' + P(H(340))),
      path('M' + P(H(200)) + ' Q630 292 670 245 Q720 298 770 245 Q810 292 ' + P(H(340))),
      path('M' + P(tl(600)) + ' Q590 668 550 632 Q505 662 495 602 C482 520 538 468 543 400 C548 330 538 232 600 182' +
        ' C640 152 690 145 720 145 C790 145 880 170 893 250 C902 300 870 330 ' + P(H(25))),
      star(812, 200, 24, 11, 0.2),
      circle(675, 310, 13, true), circle(765, 310, 13, true),
      path('M692 352 Q720 376 748 352'),
      circle(643, 345, 15), circle(797, 345, 15),
      // neck and torso
      path('M690 ' + r(neckY(690)) + ' L690 ' + r(shY(690)) + ' M750 ' + r(neckY(750)) + ' L750 ' + r(shY(750))),
      path('M620 450 Q720 390 820 450'),
      path('M620 450 Q610 545 660 640 L780 640 Q830 545 820 450'),
      path('M' + P(tl(498)) + ' Q720 520 ' + P(tr(498)) + ' M' + P(tl(548)) + ' Q720 572 ' + P(tr(548))),
      // waving arm
      path('M' + P(a1) + ' L' + P(e[1]) + ' M' + P(a2) + ' L' + P(e[0])), circle(hand[0], hand[1], hR),
      // tail and fin
      path('M' + P(lo1[0]) + C(lo1) + C(lo2) + ' M' + P(up1[0]) + C(up1) + C(up2)),
      path('M1125 612 C1140 520 1220 470 1300 455 C1270 520 1275 560 1235 600 C1300 600 1350 640 1365 700 C1280 720 1210 712 1150 685 Q1150 645 1125 612'),
      band(cub(up1, 0.45), cub(lo1, 0.55)), band(cub(up1, 0.85), cub(lo1, 0.9)), band(cub(up2, 0.45), cub(lo2, 0.45)),
      // rock (its top is hidden behind the tail)
      path('M400 1050 C410 880 520 760 ' + P(rockL)),
      path('M' + P(rockR) + ' C1150 800 1250 900 1260 1050'),
      circle(560, 960, 22), circle(980, 930, 18), circle(1120, 990, 24), path('M760 900 Q800 880 830 905'),
      // sea
      path(bumps(waveXs, 1050, -40)),
      path('M150 1130 Q190 1105 230 1130 M600 1150 Q640 1125 680 1150 M1350 1140 Q1390 1115 1430 1140'),
      path('M900 1110 C940 1070 1010 1070 1040 1110 C1010 1150 940 1150 900 1110 Z'),
      path('M1040 1110 L1080 1085 L1080 1135 Z'), circle(935, 1103, 8, true),
      // sky
      sun(1420, 170, 70), cloud(130, 240, 230),
      path('M440 150 Q470 120 500 150 Q530 120 560 150'),
      path('M1060 260 Q1085 235 1110 260 Q1135 235 1160 260')
    ].join('');
  });

  // ---------------------------------------------------------------- candy house
  A.page('fairy', 'fairy-candy-house', 'Candy House', function () {
    var drips = bumps([400, 470, 560, 650, 740, 860, 950, 1040, 1130, 1200], 580, 70);
    var cane = [
      path('M630 1040 L630 880 A30 30 0 0 0 570 880 L570 900 L530 900 L530 880 A70 70 0 0 1 670 880 L670 1040'),
      path('M630 1000 L670 975 M630 945 L670 920 M553 860 L585 878 M600 812 L605 848'),
      circle(600, 705, 55),
      path('M545 705 L655 705 M600 650 L600 760'),
      // gumdrop by the path
      path('M330 1040 L330 1010 A45 45 0 0 1 420 1010 L420 1040')
    ].join('');
    var gb = path('M-21 -104.7 L-100 -92 A30 30 0 0 0 -98 -32 L-45 -38 L-78 68 A30 30 0 0 0 -22 92 L0 50 L22 92 A30 30 0 0 0 78 68 L45 -38 L98 -32 A30 30 0 0 0 100 -92 L21 -104.7') +
      circle(0, -150, 50) + circle(-18, -158, 7, true) + circle(18, -158, 7, true) + path('M-18 -132 Q0 -118 18 -132') +
      circle(0, -60, 8, true) + circle(0, -20, 8, true) + circle(0, 20, 8, true);
    return [
      path('M20 1040 L1580 1040'),
      // roof with icing drips and candy buttons
      path('M400 580 L800 220 L1200 580'),
      path(drips),
      circle(800, 340, 34), circle(655, 480, 34), circle(945, 480, 34), circle(800, 470, 30),
      // chimney
      path('M1000 400 L1000 300 M1070 300 L1070 463'), rect(985, 262, 100, 38, 10),
      path('M1000 360 L1070 330'),
      // walls
      path('M470 580 L470 1040 M1130 580 L1130 1040'),
      // door
      path('M720 1040 L720 860 A80 80 0 0 1 880 860 L880 1040'), circle(850, 960, 10, true),
      heart(800, 890, 26),
      cane, mirror(cane),
      // lollipop and gingerbread friend
      circle(200, 690, 85), path('M200 775 L200 1040'),
      path('M200 690 m-10 0 a10 10 0 1 1 20 0 a25 25 0 1 1 -45 0 a40 40 0 1 1 75 0'),
      place(gb, 1400, 922, 1, 0),
      cloud(110, 230, 220), cloud(1250, 180, 240)
    ].join('');
  });
})();
