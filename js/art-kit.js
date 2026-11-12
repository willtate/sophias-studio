/* Art kit: drawing helpers + page registry shared by every category file in js/pages/.
   Every page is line art on a 1600x1200 canvas, 14px rounded ink strokes, no fills
   (except tiny solid details like pupils). Shapes must be CLOSED so the bucket can fill them. */
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

  // Mirror a chunk of art left-right around the page centre (for symmetric subjects).
  function mirror(svg) { return '<g transform="matrix(-1 0 0 1 ' + W + ' 0)">' + svg + '</g>'; }
  // Place a chunk of art: move to (x,y), scale s, rotate deg.
  function place(svg, x, y, s, deg) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (deg || 0) + ') scale(' + (s || 1) + ')">' + svg + '</g>';
  }

  var categories = [], pages = [];

  function category(id, name, color) {
    categories.push({ id: id, name: name, color: color, pages: [] });
  }
  function page(catId, id, name, art) {
    var cat = categories.filter(function (c) { return c.id === catId; })[0];
    if (!cat) throw new Error('Unknown category ' + catId);
    var p = { id: id, name: name, category: catId, art: art };
    cat.pages.push(p);
    pages.push(p);
    return p;
  }

  function svgFor(p) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<g fill="none" stroke="#222" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">' +
      p.art() + '</g></svg>';
  }

  // Called once after all category files have loaded.
  function finalize() {
    pages.forEach(function (p) {
      p.svg = svgFor(p);
      p.svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(p.svg);
      // Optional gallery picture that differs from the page's line art (scratch pages).
      if (p.thumb) p.thumbUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(p.thumb());
    });
    var blank = { id: 'blank', name: 'Blank page', category: null, art: function () { return ''; } };
    blank.svg = svgFor(blank);
    blank.svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(blank.svg);
    window.ColorPages = {
      W: W, H: H,
      categories: categories.filter(function (c) { return c.pages.length; }),
      list: pages.concat([blank]),
      blank: blank
    };
  }

  window.Art = {
    W: W, H: H, r: r,
    circle: circle, ellipse: ellipse, path: path, rect: rect, star: star, heart: heart,
    cloud: cloud, sun: sun, flower: flower, stemFlower: stemFlower, mirror: mirror, place: place,
    category: category, page: page, svgFor: svgFor, finalize: finalize
  };

  // Categories, in the order they appear in the gallery.
  category('letters', 'Letters & Words', '#EF6F6C');
  category('scratch', 'Scratch Art', '#34405A');
  category('animals', 'Animals', '#F7932E');
  category('fairy', 'Fairy Tales', '#F28CB8');
  category('vehicles', 'Vehicles', '#E8473B');
  category('robots', 'Robots', '#1FA99A');
  category('space', 'Space', '#5867D6');
  category('monsters', 'Silly Monsters', '#6BBF4E');
  category('sea', 'Under the Sea', '#2E9BE0');
  category('garden', 'Garden & Bugs', '#F9D648');
  category('treats', 'Yummy Treats', '#9C6644');
})();
