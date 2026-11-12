/* Scratch Art: the page starts covered in black and every pen scratches it away
   to show a hidden picture underneath. ScratchArt.make() paints that hidden layer
   (always the same for a page, so saved pictures and "watch it again" line up). */
(function () {
  'use strict';
  var A = window.Art;

  var COAT = '#1E1B26';
  var DESIGNS = [
    { id: 'rainbow', name: 'Rainbow', stops: ['#FF5A5A', '#FF9F43', '#FFE14D', '#5EDB6A', '#36C9C6', '#4D8DFF', '#9B6BFF', '#FF6FB5'] },
    { id: 'galaxy', name: 'Galaxy', stops: ['#7A5CFF', '#FF6FD8', '#5BE7FF', '#B98CFF'] },
    { id: 'gold', name: 'Gold', stops: ['#C98A1E', '#FFE7A0', '#E2A93B', '#FFF6D2', '#B87818'] },
    { id: 'candy', name: 'Candy', stops: ['#FFB3D1', '#B8F0FF', '#FFF0A8', '#C9B8FF', '#B9F5C8'] }
  ];

  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function twinkle(x, cx, cy, R) {
    x.beginPath();
    x.moveTo(cx, cy - R); x.quadraticCurveTo(cx, cy, cx + R, cy); x.quadraticCurveTo(cx, cy, cx, cy + R);
    x.quadraticCurveTo(cx, cy, cx - R, cy); x.quadraticCurveTo(cx, cy, cx, cy - R);
    x.fill();
  }
  function blob(x, cx, cy, R, col, a) {
    var g = x.createRadialGradient(cx, cy, 0, cx, cy, R);
    var n = parseInt(col.slice(1), 16), rgb = (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
    g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    x.globalAlpha = a; x.fillStyle = g; x.fillRect(cx - R, cy - R, R * 2, R * 2); x.globalAlpha = 1;
  }

  var cache = {};
  function make(id, W, H) {
    if (cache[id]) return cache[id];
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d'), rnd = rng(id.length * 7919 + id.charCodeAt(0)), i, g;
    var d = DESIGNS.filter(function (q) { return q.id === id; })[0] || DESIGNS[0];

    if (id === 'rainbow') {
      // Diagonal rainbow bands, twice across the page.
      g = x.createLinearGradient(0, 0, W, H);
      var n = d.stops.length * 2;
      for (i = 0; i <= n; i++) g.addColorStop(i / n, d.stops[i % d.stops.length]);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(255,255,255,.85)';
      for (i = 0; i < 160; i++) twinkle(x, rnd() * W, rnd() * H, 4 + rnd() * 10);
    } else if (id === 'galaxy') {
      g = x.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#3C2CA8'); g.addColorStop(0.5, '#7030C0'); g.addColorStop(1, '#2058B8');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (i = 0; i < 22; i++) blob(x, rnd() * W, rnd() * H, 180 + rnd() * 320, d.stops[i % d.stops.length], 0.8);
      x.fillStyle = '#FFFFFF';
      for (i = 0; i < 1400; i++) {
        x.globalAlpha = 0.5 + rnd() * 0.5;
        x.beginPath(); x.arc(rnd() * W, rnd() * H, rnd() < 0.9 ? 1 + rnd() * 1.6 : 2.5 + rnd() * 2, 0, 6.283); x.fill();
      }
      x.globalAlpha = 1;
      for (i = 0; i < 40; i++) twinkle(x, rnd() * W, rnd() * H, 8 + rnd() * 16);
    } else if (id === 'gold') {
      // Shiny metal: many soft diagonal bands of light and dark gold.
      g = x.createLinearGradient(0, 0, W * 0.6, H);
      for (i = 0; i <= 14; i++) g.addColorStop(i / 14, d.stops[i % d.stops.length]);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (i = 0; i < 30; i++) blob(x, rnd() * W, rnd() * H, 120 + rnd() * 200, '#FFF8DC', 0.35);
      x.fillStyle = '#FFFFFF';
      for (i = 0; i < 120; i++) twinkle(x, rnd() * W, rnd() * H, 5 + rnd() * 14);
    } else {
      // Candy: pastel clouds with confetti.
      x.fillStyle = '#FFE3F0'; x.fillRect(0, 0, W, H);
      for (i = 0; i < 26; i++) blob(x, rnd() * W, rnd() * H, 200 + rnd() * 260, d.stops[i % d.stops.length], 0.9);
      var conf = ['#FF5A8A', '#FFB020', '#3DC9A0', '#5B8CFF', '#B06BFF', '#FF6B4A'];
      for (i = 0; i < 420; i++) {
        x.fillStyle = conf[i % conf.length];
        x.save();
        x.translate(rnd() * W, rnd() * H);
        x.rotate(rnd() * 6.283);
        if (rnd() < 0.5) { x.beginPath(); x.arc(0, 0, 5 + rnd() * 6, 0, 6.283); x.fill(); }
        else x.fillRect(-10, -4, 20, 8);
        x.restore();
      }
    }
    cache[id] = c;
    return c;
  }

  // Gallery picture: black card with a scratched squiggle and star showing the colours.
  function thumb(d) {
    var stops = d.stops.map(function (col, i) {
      return '<stop offset="' + (i / (d.stops.length - 1)).toFixed(3) + '" stop-color="' + col + '"/>';
    }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' + stops + '</linearGradient></defs>' +
      '<rect width="1600" height="1200" fill="' + COAT + '"/>' +
      '<g fill="none" stroke="url(#g)" stroke-linecap="round" stroke-linejoin="round">' +
      '<path stroke-width="70" d="M180 860 C320 520 520 1040 700 700 C860 400 1040 980 1220 640 C1320 450 1400 520 1440 380"/>' +
      '<path stroke-width="44" d="M300 300 C420 200 560 360 680 260"/></g>' +
      '<path fill="url(#g)" d="M1180 170 L1225 290 L1352 292 L1252 370 L1290 492 L1180 420 L1070 492 L1108 370 L1008 292 L1135 290 Z"/>' +
      '</svg>';
  }

  DESIGNS.forEach(function (d) {
    var p = A.page('scratch', 'scratch-' + d.id, d.name, function () { return ''; });
    p.scratch = d.id;
    p.thumb = function () { return thumb(d); };
  });

  window.ScratchArt = { make: make, COAT: COAT };
})();
