(function () {
  'use strict';

  var W = ColorPages.W, H = ColorPages.H;

  // Curated palette: even saturation/value steps, no near-duplicates.
  var COLORS = [
    '#E8473B', // red
    '#F7932E', // orange
    '#F9D648', // yellow
    '#6BBF4E', // green
    '#1FA99A', // teal
    '#2E9BE0', // sky
    '#5867D6', // blue-violet
    '#F28CB8', // pink
    '#9C6644', // brown
    '#34405A', // navy (our "black")
    '#FFFFFF', // white
    'rainbow'
  ];

  var TOOLS = {
    pencil: { sizes: [6, 11, 18] },
    crayon: { sizes: [16, 28, 44] },
    marker: { sizes: [20, 38, 64] },
    spray:  { sizes: [45, 75, 115] },
    bucket: { sizes: null },
    stamp:  { sizes: null },
    eraser: { sizes: [26, 54, 100] }
  };
  var STAMPS = ['star', 'heart', 'flower', 'dot'];
  var STAMP_PATHS = {
    star: 'M20 3 L25 15 L38 15 L27.5 23 L31.5 36 L20 28 L8.5 36 L12.5 23 L2 15 L15 15 Z',
    heart: 'M20 36 C2 24 4 6 20 13 C36 6 38 24 20 36 Z',
    dot: 'M20 5 A15 15 0 1 1 19.99 5 Z'
  };

  var state = {
    page: null,
    tool: 'crayon',
    color: '#E8473B',
    sizes: { pencil: 1, crayon: 1, marker: 1, spray: 1, eraser: 1 },
    stamp: 'star',
    hue: 0,
    penSeen: false
  };

  // ---------- DOM ----------
  var $ = function (s) { return document.querySelector(s); };
  var home = $('#home'), studio = $('#studio'), grid = $('#grid');
  var stage = $('#stage'), board = $('#board');
  var paint = $('#paint'), lineImg = $('#lines');
  var pctx = paint.getContext('2d');
  paint.width = W; paint.height = H;

  // Offscreen helpers
  function makeCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var lineCanvas = makeCanvas(W, H), lctx = lineCanvas.getContext('2d');
  var strokeCv = makeCanvas(W, H), sctx = strokeCv.getContext('2d'); // solid stroke, current gesture
  var tmpCv = makeCanvas(256, 256), tctx = tmpCv.getContext('2d');
  var lineMask = null;

  // ---------- Paper grain (fixed to the page, so crayon looks like crayon) ----------
  function makeGrain(lo, hi, holes, clump) {
    var s = 256, small = makeCanvas(s / clump, s / clump), sx = small.getContext('2d');
    var img = sx.createImageData(small.width, small.height), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = Math.random() < holes ? lo * Math.random() : lo + (hi - lo) * Math.random();
      d[i] = d[i + 1] = d[i + 2] = 0; d[i + 3] = Math.round(v * 255);
    }
    sx.putImageData(img, 0, 0);
    var big = makeCanvas(s, s), bx = big.getContext('2d');
    bx.imageSmoothingEnabled = true;
    bx.drawImage(small, 0, 0, s, s);
    // add fine speckle on top of the clumps
    var fine = bx.getImageData(0, 0, s, s), fd = fine.data;
    for (var j = 3; j < fd.length; j += 4) {
      var r = Math.random();
      // occasional bright flecks where the "paper tooth" pokes through
      fd[j] = r < 0.06 ? fd[j] * 0.35 : Math.max(0, Math.min(255, fd[j] + (r - 0.5) * 40));
    }
    bx.putImageData(fine, 0, 0);
    return big;
  }
  var GRAIN = {
    crayon: makeGrain(0.7, 1.0, 0.1, 3),
    pencil: makeGrain(0.55, 0.95, 0.18, 2)
  };
  var BRUSH = {
    pencil: { grain: 'pencil', alpha: 0.95 },
    crayon: { grain: 'crayon', alpha: 1 },
    marker: { grain: null, alpha: 0.82 }
  };

  // ---------- Prevent iOS zoom / callouts ----------
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { e.preventDefault(); });
  });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  var lastTouchEnd = 0;
  document.addEventListener('touchend', function (e) {
    var now = Date.now();
    if (now - lastTouchEnd < 350) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  // ---------- Gallery ----------
  // Home shows a shelf of groups (Animals, Space, ...); tapping one shows its pages.
  var galleryCat = null;
  var thumbUrls = [];

  function pageCard(p) {
    var b = document.createElement('button');
    b.className = 'card';
    b.setAttribute('aria-label', p.name);
    b.innerHTML = '<div class="thumb"><img class="saved" alt=""><img class="art" alt="" src="' + p.svgUrl + '"></div>';
    b.addEventListener('click', function () { openPage(p); });
    ArtStore.get(p.id).then(function (blob) {
      if (blob) {
        var im = b.querySelector('.saved');
        var u = URL.createObjectURL(blob);
        thumbUrls.push(u);
        im.src = u;
        im.style.visibility = 'visible';
      }
    });
    return b;
  }

  function buildGallery() {
    thumbUrls.forEach(function (u) { URL.revokeObjectURL(u); });
    thumbUrls = [];
    grid.innerHTML = '';
    var cat = galleryCat && ColorPages.categories.filter(function (c) { return c.id === galleryCat; })[0];
    home.classList.toggle('in-cat', !!cat);
    $('#back').hidden = !cat;
    if (cat) {
      var crgb = hexToRgb(cat.color);
      var light = crgb[0] * 0.299 + crgb[1] * 0.587 + crgb[2] * 0.114 > 170;
      home.style.setProperty('--cat', light ? '#34405A' : cat.color);
      $('#catName').textContent = cat.name;
      grid.className = 'grid pages';
      cat.pages.forEach(function (p) { grid.appendChild(pageCard(p)); });
      home.scrollTop = 0;
      return;
    }
    $('#catName').textContent = '';
    grid.className = 'grid shelf';

    var blank = document.createElement('button');
    blank.className = 'shelf-card blank';
    blank.setAttribute('aria-label', 'Blank page');
    blank.innerHTML = '<div class="cover"><svg viewBox="0 0 64 64"><path d="M32 16 V48 M16 32 H48" stroke="#34405A" stroke-width="6" stroke-linecap="round"/></svg></div><span>Draw</span>';
    blank.addEventListener('click', function () { openPage(ColorPages.blank); });
    grid.appendChild(blank);

    ColorPages.categories.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'shelf-card';
      b.style.setProperty('--cat', c.color);
      var rgb = hexToRgb(c.color);
      if (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 170) b.classList.add('light');
      b.setAttribute('aria-label', c.name);
      var covers = c.pages.slice(0, 3).map(function (p, i) {
        return '<img class="c' + i + '" alt="" src="' + p.svgUrl + '">';
      }).join('');
      b.innerHTML = '<div class="cover">' + covers + '</div><span>' + c.name + '</span>';
      b.addEventListener('click', function () { galleryCat = c.id; buildGallery(); });
      grid.appendChild(b);
    });
  }

  // ---------- Palette & tools ----------
  function buildPalette() {
    var pal = $('#swatches');
    COLORS.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'swatch' + (c === 'rainbow' ? ' rainbow' : '') + (c === '#FFFFFF' ? ' white' : '');
      if (c !== 'rainbow') b.style.background = c;
      b.dataset.color = c;
      b.setAttribute('aria-label', c === 'rainbow' ? 'rainbow' : 'colour ' + c);
      b.addEventListener('click', function () { setColor(c); });
      pal.appendChild(b);
    });
  }

  function setColor(c) {
    state.color = c;
    if (state.tool === 'eraser') setTool('crayon');
    document.querySelectorAll('.swatch').forEach(function (s) {
      s.classList.toggle('active', s.dataset.color === c);
    });
    var tint = c === 'rainbow' ? '#F28CB8' : (c === '#FFFFFF' ? '#E9E4DA' : c);
    document.documentElement.style.setProperty('--current', tint);
    studio.classList.toggle('rainbow-on', c === 'rainbow');
  }

  // Tapping the tool you already hold cycles its size (or stamp shape).
  function setTool(t) {
    if (t === state.tool) {
      if (t === 'stamp') {
        state.stamp = STAMPS[(STAMPS.indexOf(state.stamp) + 1) % STAMPS.length];
      } else if (TOOLS[t].sizes) {
        state.sizes[t] = (state.sizes[t] + 1) % 3;
      }
      bounce(document.querySelector('.tool[data-tool="' + t + '"]'));
    }
    state.tool = t;
    document.querySelectorAll('.tool').forEach(function (b) {
      var on = b.dataset.tool === t;
      b.classList.toggle('active', on);
      var sz = b.querySelector('.size');
      if (sz) sz.dataset.size = state.sizes[b.dataset.tool];
    });
    var st = document.querySelector('.tool[data-tool="stamp"] .stamp-shape');
    st.innerHTML = stampSvg(state.stamp);
  }

  function bounce(el) {
    if (!el) return;
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
  }

  function stampSvg(s) {
    if (s === 'flower') {
      return '<svg viewBox="0 0 40 40"><g class="fillc"><circle cx="20" cy="9" r="7"/><circle cx="31" cy="17" r="7"/><circle cx="27" cy="30" r="7"/><circle cx="13" cy="30" r="7"/><circle cx="9" cy="17" r="7"/></g><circle cx="20" cy="20" r="6" fill="#F9D648"/></svg>';
    }
    return '<svg viewBox="0 0 40 40"><path class="fillc" d="' + STAMP_PATHS[s] + '"/></svg>';
  }

  // ---------- Colour helpers ----------
  function hexToRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; };
    var a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  function strokeColor() {
    if (state.color === 'rainbow') return 'hsl(' + Math.round(state.hue) + ',80%,58%)';
    return state.color;
  }

  // ---------- Undo ----------
  var undoStack = [];
  var MAX_UNDO = 8;
  function snapshot() {
    var c = makeCanvas(W, H);
    c.getContext('2d').drawImage(paint, 0, 0);
    return c;
  }
  function pushUndo(c) {
    undoStack.push(c || snapshot());
    if (undoStack.length > MAX_UNDO) {
      var old = undoStack.shift();
      old.width = old.height = 1; // release memory on iOS
    }
    $('#undo').disabled = false;
  }
  function undo() {
    var c = undoStack.pop();
    if (!c) return;
    pctx.globalCompositeOperation = 'source-over';
    pctx.globalAlpha = 1;
    pctx.drawImage(c, 0, 0);
    c.width = c.height = 1;
    $('#undo').disabled = undoStack.length === 0;
    scheduleSave();
  }

  // ---------- Page open/close ----------
  function clearPaint() {
    pctx.globalCompositeOperation = 'source-over';
    pctx.globalAlpha = 1;
    pctx.fillStyle = '#FFFFFF';
    pctx.fillRect(0, 0, W, H);
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var im = new Image();
      im.onload = function () { resolve(im); };
      im.onerror = reject;
      im.src = src;
    });
  }

  function openPage(p) {
    state.page = p;
    galleryCat = p.category;
    undoStack.forEach(function (c) { c.width = c.height = 1; });
    undoStack = [];
    $('#undo').disabled = true;
    clearPaint();
    lineImg.src = p.svgUrl;
    lctx.clearRect(0, 0, W, H);
    lineMask = null;
    home.hidden = true;
    studio.hidden = false;
    fitBoard();

    loadImage(p.svgUrl).then(function (im) {
      lctx.drawImage(im, 0, 0, W, H);
      lineMask = ColorFill.buildLineMask(lctx, W, H);
    }).catch(function () { lineMask = new Uint8Array(W * H); });

    ArtStore.get(p.id).then(function (blob) {
      if (!blob || state.page !== p) return;
      var url = URL.createObjectURL(blob);
      loadImage(url).then(function (im) {
        if (state.page === p) pctx.drawImage(im, 0, 0, W, H);
        URL.revokeObjectURL(url);
      });
    });
  }

  function goHome() {
    saveNow().then(function () {
      studio.hidden = true;
      home.hidden = false;
      state.page = null;
      buildGallery();
    });
  }

  // ---------- Saving ----------
  var saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 800);
  }
  function saveNow() {
    clearTimeout(saveTimer);
    var p = state.page;
    if (!p) return Promise.resolve();
    return new Promise(function (resolve) {
      paint.toBlob(function (blob) {
        if (!blob) return resolve();
        ArtStore.put(p.id, blob).then(resolve, resolve);
      }, 'image/jpeg', 0.92);
    });
  }

  function exportImage() {
    var c = makeCanvas(W, H);
    var x = c.getContext('2d');
    x.drawImage(paint, 0, 0);
    x.drawImage(lineCanvas, 0, 0);
    c.toBlob(function (blob) {
      if (!blob) return;
      var name = 'my-' + (state.page ? state.page.id : 'picture') + '.png';
      var file = null;
      try { file = new File([blob], name, { type: 'image/png' }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file] }).catch(function () {});
      } else {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      }
      c.width = c.height = 1;
    }, 'image/png');
    flash();
  }
  function flash() {
    var f = $('#flash');
    f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  }

  // ---------- Layout ----------
  function fitBoard() {
    var r = stage.getBoundingClientRect();
    var aw = r.width, ah = r.height;
    var w = Math.min(aw, ah * W / H);
    board.style.width = Math.floor(w) + 'px';
    board.style.height = Math.floor(w * H / W) + 'px';
  }
  window.addEventListener('resize', function () { if (!studio.hidden) fitBoard(); });
  window.addEventListener('orientationchange', function () { setTimeout(fitBoard, 250); });

  // ---------- Drawing ----------
  var active = null;
  var sprayTimer = null;

  function toCanvas(e) {
    var r = board.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  function size() {
    var s = TOOLS[state.tool].sizes;
    return s ? s[state.sizes[state.tool]] : 0;
  }

  function onDown(e) {
    if (active) return;
    if (e.pointerType === 'pen') state.penSeen = true;
    // Once an Apple Pencil is used, ignore fingers/palm on the page.
    if (state.penSeen && e.pointerType === 'touch') return;
    e.preventDefault();
    try { board.setPointerCapture(e.pointerId); } catch (err) {}
    var pt = toCanvas(e);
    active = { id: e.pointerId, x: pt.x, y: pt.y, mx: pt.x, my: pt.y, lastStampX: -9999, lastStampY: -9999, t: Date.now(), w: null };

    var t = state.tool;
    if (t === 'bucket') {
      doFill(pt.x, pt.y);
      active = null;
      return;
    }
    if (BRUSH[t]) {
      active.base = snapshot();
      pushUndo(snapshot());
      sctx.clearRect(0, 0, W, H);
      brushTo(pt.x, pt.y, e.pressure, true);
    } else {
      pushUndo();
      if (t === 'spray') {
        spray(pt.x, pt.y);
        sprayTimer = setInterval(function () { if (active) spray(active.x, active.y); }, 30);
      } else if (t === 'stamp') {
        stampAt(pt.x, pt.y);
      } else if (t === 'eraser') {
        eraseTo(pt.x, pt.y, true);
      }
    }
  }

  function onMove(e) {
    if (!active || e.pointerId !== active.id) return;
    e.preventDefault();
    var events = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    if (!events.length) events = [e];
    for (var i = 0; i < events.length; i++) {
      var pt = toCanvas(events[i]);
      var t = state.tool;
      if (BRUSH[t]) brushTo(pt.x, pt.y, events[i].pressure, false);
      else if (t === 'eraser') eraseTo(pt.x, pt.y, false);
      else if (t === 'spray') spray(pt.x, pt.y, 0.35);
      else if (t === 'stamp') {
        if (Math.hypot(pt.x - active.lastStampX, pt.y - active.lastStampY) > 120) stampAt(pt.x, pt.y);
      }
      advanceHue(Math.hypot(pt.x - active.x, pt.y - active.y));
      active.x = pt.x; active.y = pt.y;
    }
  }

  function onUp(e) {
    if (!active || e.pointerId !== active.id) return;
    clearInterval(sprayTimer);
    if (BRUSH[state.tool]) {
      // finish the tail of the smoothed curve
      brushTo(active.x, active.y, null, false, true);
      if (active.base) { active.base.width = active.base.height = 1; }
    }
    active = null;
    scheduleSave();
  }

  function advanceHue(dist) { state.hue = (state.hue + dist * 0.25) % 360; }

  // Width: pencil pressure if available, otherwise a gentle speed taper for fingers.
  function brushWidth(pressure) {
    var base = size();
    if (state.penSeen && pressure) return base * (0.45 + pressure * 1.1);
    var now = Date.now(), dt = Math.max(1, now - active.t);
    var speed = Math.hypot(active.x - active.mx, active.y - active.my) / dt;
    active.t = now;
    var target = base * Math.max(0.75, 1.08 - speed * 0.06);
    active.w = active.w == null ? target : active.w + (target - active.w) * 0.3;
    return active.w;
  }

  // Smoothed brush: quadratic curves through midpoints, drawn solid into the stroke
  // canvas, then composited onto the page through the paper grain for the dirty area only.
  function brushTo(x, y, pressure, first, finish) {
    var b = BRUSH[state.tool];
    var w = finish ? (active.w || size()) : brushWidth(pressure);
    sctx.lineCap = 'round'; sctx.lineJoin = 'round';
    sctx.strokeStyle = strokeColor();
    sctx.lineWidth = w;
    var x0, y0, cx, cy, x1, y1;
    if (first) {
      x0 = x; y0 = y; cx = x; cy = y; x1 = x + 0.01; y1 = y;
    } else if (finish) {
      x0 = active.endX != null ? active.endX : x; y0 = active.endY != null ? active.endY : y;
      cx = (x0 + x) / 2; cy = (y0 + y) / 2; x1 = x; y1 = y;
    } else {
      // previous point = active.x/y; previous midpoint = active.mx/my (stored as last end)
      x0 = active.endX != null ? active.endX : active.x; y0 = active.endY != null ? active.endY : active.y;
      cx = active.x; cy = active.y;
      x1 = (active.x + x) / 2; y1 = (active.y + y) / 2;
    }
    sctx.beginPath(); sctx.moveTo(x0, y0); sctx.quadraticCurveTo(cx, cy, x1, y1); sctx.stroke();
    active.endX = x1; active.endY = y1;
    active.mx = active.x; active.my = active.y;

    var pad = w / 2 + 4;
    var bx = Math.floor(Math.max(0, Math.min(x0, cx, x1) - pad));
    var by = Math.floor(Math.max(0, Math.min(y0, cy, y1) - pad));
    var bw = Math.ceil(Math.min(W, Math.max(x0, cx, x1) + pad)) - bx;
    var bh = Math.ceil(Math.min(H, Math.max(y0, cy, y1) + pad)) - by;
    if (bw <= 0 || bh <= 0) return;
    composite(bx, by, bw, bh, b);
  }

  function composite(bx, by, bw, bh, b) {
    if (tmpCv.width < bw || tmpCv.height < bh) {
      tmpCv.width = Math.max(tmpCv.width, bw); tmpCv.height = Math.max(tmpCv.height, bh);
    }
    tctx.globalCompositeOperation = 'source-over';
    tctx.clearRect(0, 0, bw, bh);
    tctx.drawImage(strokeCv, bx, by, bw, bh, 0, 0, bw, bh);
    if (b.grain) {
      tctx.globalCompositeOperation = 'destination-in';
      tctx.save();
      tctx.translate(-bx, -by);
      tctx.fillStyle = tctx.createPattern(GRAIN[b.grain], 'repeat');
      tctx.fillRect(bx, by, bw, bh);
      tctx.restore();
      tctx.globalCompositeOperation = 'source-over';
    }
    pctx.globalCompositeOperation = 'source-over';
    pctx.globalAlpha = 1;
    pctx.drawImage(active.base, bx, by, bw, bh, bx, by, bw, bh);
    pctx.globalAlpha = b.alpha;
    pctx.drawImage(tmpCv, 0, 0, bw, bh, bx, by, bw, bh);
    pctx.globalAlpha = 1;
  }

  function eraseTo(x, y, first) {
    pctx.globalCompositeOperation = 'source-over';
    pctx.globalAlpha = 1;
    pctx.strokeStyle = '#FFFFFF';
    pctx.lineWidth = size();
    pctx.lineCap = 'round'; pctx.lineJoin = 'round';
    pctx.beginPath();
    pctx.moveTo(first ? x : active.x, first ? y : active.y);
    pctx.lineTo(x + (first ? 0.01 : 0), y);
    pctx.stroke();
  }

  function spray(x, y, amount) {
    var rad = size();
    var n = Math.round(rad * 1.6 * (amount || 1));
    pctx.globalCompositeOperation = 'source-over';
    pctx.fillStyle = strokeColor();
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var rr = rad * (Math.random() + Math.random()) / 2 * (Math.random() < 0.5 ? 1 : Math.random());
      pctx.globalAlpha = 0.55 + Math.random() * 0.45;
      var d = 2 + Math.random() * 2.5;
      pctx.beginPath();
      pctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, d / 2, 0, Math.PI * 2);
      pctx.fill();
    }
    pctx.globalAlpha = 1;
    if (state.color === 'rainbow') advanceHue(3);
  }

  function stampAt(x, y) {
    active.lastStampX = x; active.lastStampY = y;
    var s = 90;
    pctx.save();
    pctx.globalCompositeOperation = 'source-over';
    pctx.globalAlpha = 1;
    pctx.translate(x, y);
    pctx.rotate((Math.random() - 0.5) * 0.5);
    pctx.fillStyle = strokeColor();
    var sc = s / 20 * (0.85 + Math.random() * 0.3);
    pctx.scale(sc, sc);
    pctx.translate(-20, -20);
    if (state.stamp === 'flower') {
      [[20, 9], [31, 17], [27, 30], [13, 30], [9, 17]].forEach(function (c) {
        pctx.beginPath(); pctx.arc(c[0], c[1], 7, 0, Math.PI * 2); pctx.fill();
      });
      pctx.fillStyle = state.color === '#F9D648' ? '#F7932E' : '#F9D648';
      pctx.beginPath(); pctx.arc(20, 20, 6, 0, Math.PI * 2); pctx.fill();
    } else {
      pctx.fill(new Path2D(STAMP_PATHS[state.stamp]));
    }
    pctx.restore();
    if (state.color === 'rainbow') advanceHue(40);
  }

  function doFill(x, y) {
    if (!lineMask) return;
    pushUndo();
    var img = pctx.getImageData(0, 0, W, H);
    var colorFn;
    if (state.color === 'rainbow') {
      var base = state.hue;
      colorFn = function (px, py) { return hslToRgb((base + (px + py) * 0.18) % 360, 80, 62); };
      advanceHue(60);
    } else {
      var rgb = hexToRgb(state.color);
      colorFn = function () { return rgb; };
    }
    if (ColorFill.floodFill(img, lineMask, x, y, colorFn, 60)) {
      pctx.putImageData(img, 0, 0);
      scheduleSave();
    } else {
      undoStack.pop();
    }
  }

  board.addEventListener('pointerdown', onDown);
  board.addEventListener('pointermove', onMove);
  board.addEventListener('pointerup', onUp);
  board.addEventListener('pointercancel', onUp);
  board.addEventListener('lostpointercapture', onUp);

  // ---------- Buttons ----------
  document.querySelectorAll('.tool').forEach(function (b) {
    b.addEventListener('click', function () { setTool(b.dataset.tool); });
  });
  $('#homeBtn').addEventListener('click', goHome);
  $('#back').addEventListener('click', function () { galleryCat = null; buildGallery(); });
  $('#undo').addEventListener('click', undo);
  $('#save').addEventListener('click', function () { saveNow(); exportImage(); });

  // Hold-to-clear so a stray tap doesn't wipe the picture.
  (function () {
    var btn = $('#clear'), timer = null;
    function start(e) {
      e.preventDefault();
      btn.classList.add('holding');
      timer = setTimeout(function () {
        btn.classList.remove('holding');
        pushUndo();
        clearPaint();
        scheduleSave();
      }, 1200);
    }
    function stop() { clearTimeout(timer); btn.classList.remove('holding'); }
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
  })();

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') saveNow();
  });

  // ---------- Boot ----------
  buildPalette();
  buildGallery();
  state.tool = null;
  setTool('crayon');
  setColor(state.color);

  // Offline support when hosted; skipped on localhost so edits show up immediately.
  var devHost = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !devHost) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  // Exposed for automated checks.
  window.__studio = { state: state, openPage: openPage, setTool: setTool, setColor: setColor, doFill: doFill };
})();
