(function () {
  'use strict';

  var W = ColorPages.W, H = ColorPages.H;

  var COLORS = [
    '#FF3B30', '#FF9500', '#FFD60A', '#A4E05F', '#34C759', '#30C9C1',
    '#5AC8FA', '#007AFF', '#8E5CF7', '#C86BFA', '#FF6FB5', '#FFB3D9',
    '#FFD9B8', '#E0A96D', '#8B5A2B', '#8E8E93', '#1C1C1E', '#FFFFFF', 'rainbow'
  ];

  var TOOLS = {
    pencil: { sizes: [5, 10, 16] },
    crayon: { sizes: [12, 22, 34] },
    marker: { sizes: [18, 34, 60] },
    spray:  { sizes: [40, 70, 110] },
    bucket: { sizes: null },
    eraser: { sizes: [24, 50, 100] },
    stamp:  { sizes: [50, 85, 130] }
  };
  var STAMPS = ['star', 'heart', 'flower', 'dot'];

  var state = {
    page: null,
    tool: 'marker',
    color: '#FF3B30',
    sizeIdx: 1,
    stamp: 'star',
    hue: 0,
    penSeen: false
  };

  // ---------- DOM ----------
  var $ = function (s) { return document.querySelector(s); };
  var home = $('#home'), studio = $('#studio'), grid = $('#grid');
  var stage = $('#stage'), board = $('#board');
  var paint = $('#paint'), strokeCv = $('#stroke'), lineImg = $('#lines');
  var pctx = paint.getContext('2d');
  var sctx = strokeCv.getContext('2d');
  var lineCanvas = document.createElement('canvas');
  lineCanvas.width = W; lineCanvas.height = H;
  var lctx = lineCanvas.getContext('2d');
  var lineMask = null;

  [paint, strokeCv].forEach(function (c) { c.width = W; c.height = H; });

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
  function buildGallery() {
    grid.innerHTML = '';
    ColorPages.list.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'card';
      b.setAttribute('aria-label', p.name);
      b.innerHTML = '<div class="thumb"><img class="saved" alt=""><img class="art" alt="" src="' + p.svgUrl + '"></div>';
      b.addEventListener('click', function () { openPage(p); });
      grid.appendChild(b);
      ArtStore.get(p.id).then(function (blob) {
        if (blob) {
          var im = b.querySelector('.saved');
          im.src = URL.createObjectURL(blob);
          im.style.visibility = 'visible';
        }
      });
    });
  }

  // ---------- Palette & tools ----------
  function buildPalette() {
    var pal = $('#palette');
    COLORS.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'swatch' + (c === 'rainbow' ? ' rainbow' : '');
      if (c !== 'rainbow') b.style.background = c;
      if (c === '#FFFFFF') b.classList.add('white');
      b.dataset.color = c;
      b.setAttribute('aria-label', c === 'rainbow' ? 'rainbow' : 'colour ' + c);
      b.addEventListener('click', function () { setColor(c); });
      pal.appendChild(b);
    });
  }

  function setColor(c) {
    state.color = c;
    if (state.tool === 'eraser') setTool('marker');
    document.querySelectorAll('.swatch').forEach(function (s) {
      s.classList.toggle('active', s.dataset.color === c);
    });
    updateToolTint();
  }

  function setTool(t) {
    state.tool = t;
    document.querySelectorAll('.tool').forEach(function (b) {
      b.classList.toggle('active', b.dataset.tool === t);
    });
    renderOptions();
  }

  function updateToolTint() {
    var c = state.color === 'rainbow' ? 'conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)' : state.color;
    document.documentElement.style.setProperty('--current', state.color === 'rainbow' ? '#ff6fb5' : state.color);
    var chip = $('#currentChip');
    chip.style.background = c;
  }

  function renderOptions() {
    var opts = $('#options');
    opts.innerHTML = '';
    var tool = TOOLS[state.tool];
    if (state.tool === 'stamp') {
      STAMPS.forEach(function (s) {
        var b = document.createElement('button');
        b.className = 'opt stamp-opt' + (state.stamp === s ? ' active' : '');
        b.innerHTML = stampIcon(s);
        b.addEventListener('click', function () { state.stamp = s; renderOptions(); });
        opts.appendChild(b);
      });
    }
    if (tool.sizes) {
      tool.sizes.forEach(function (sz, i) {
        var b = document.createElement('button');
        b.className = 'opt size-opt' + (state.sizeIdx === i ? ' active' : '');
        var dot = 10 + i * 12;
        b.innerHTML = '<span style="width:' + dot + 'px;height:' + dot + 'px"></span>';
        b.addEventListener('click', function () { state.sizeIdx = i; renderOptions(); });
        opts.appendChild(b);
      });
    }
  }

  function stampIcon(s) {
    var m = {
      star: '<svg viewBox="0 0 40 40"><path d="M20 3 L25 15 L38 15 L27.5 23 L31.5 36 L20 28 L8.5 36 L12.5 23 L2 15 L15 15 Z"/></svg>',
      heart: '<svg viewBox="0 0 40 40"><path d="M20 36 C2 24 4 6 20 13 C36 6 38 24 20 36 Z"/></svg>',
      flower: '<svg viewBox="0 0 40 40"><circle cx="20" cy="9" r="7"/><circle cx="31" cy="17" r="7"/><circle cx="27" cy="30" r="7"/><circle cx="13" cy="30" r="7"/><circle cx="9" cy="17" r="7"/><circle cx="20" cy="20" r="6" fill="#FFD60A"/></svg>',
      dot: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15"/></svg>'
    };
    return m[s];
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
    if (state.color === 'rainbow') return 'hsl(' + Math.round(state.hue) + ',95%,55%)';
    return state.color;
  }

  // ---------- Undo ----------
  var undoStack = [];
  var MAX_UNDO = 8;
  function pushUndo() {
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    c.getContext('2d').drawImage(paint, 0, 0);
    undoStack.push(c);
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
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
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
  }

  // ---------- Layout ----------
  function fitBoard() {
    var r = stage.getBoundingClientRect();
    var pad = 8;
    var aw = r.width - pad * 2, ah = r.height - pad * 2;
    var w = Math.min(aw, ah * W / H);
    board.style.width = Math.floor(w) + 'px';
    board.style.height = Math.floor(w * H / W) + 'px';
  }
  window.addEventListener('resize', function () { if (!studio.hidden) fitBoard(); });
  window.addEventListener('orientationchange', function () { setTimeout(fitBoard, 250); });

  // ---------- Drawing ----------
  var active = null; // { id, x, y, ... }
  var sprayTimer = null;

  function toCanvas(e) {
    var r = board.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  }
  function size() {
    var s = TOOLS[state.tool].sizes;
    return s ? s[state.sizeIdx] : 0;
  }

  function onDown(e) {
    if (active) return;
    if (e.pointerType === 'pen') state.penSeen = true;
    // Once an Apple Pencil is used, ignore fingers/palm on the page.
    if (state.penSeen && e.pointerType === 'touch') return;
    e.preventDefault();
    try { board.setPointerCapture(e.pointerId); } catch (err) {}
    var pt = toCanvas(e);
    active = { id: e.pointerId, x: pt.x, y: pt.y, lastStampX: -9999, lastStampY: -9999, pressure: e.pressure };

    var t = state.tool;
    if (t === 'bucket') {
      doFill(pt.x, pt.y);
      active = null;
      return;
    }
    pushUndo();
    if (t === 'marker') {
      sctx.clearRect(0, 0, W, H);
      strokeCv.style.opacity = 0.85;
      markerSegment(pt.x, pt.y, pt.x, pt.y);
    } else if (t === 'spray') {
      spray(pt.x, pt.y);
      sprayTimer = setInterval(function () { if (active) spray(active.x, active.y); }, 30);
    } else if (t === 'stamp') {
      stampAt(pt.x, pt.y);
    } else {
      segment(pt.x, pt.y, pt.x, pt.y, e.pressure);
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
      if (t === 'marker') markerSegment(active.x, active.y, pt.x, pt.y);
      else if (t === 'spray') { /* timer handles it */ spray(pt.x, pt.y, 0.4); }
      else if (t === 'stamp') {
        var gap = size() * 1.3;
        if (Math.hypot(pt.x - active.lastStampX, pt.y - active.lastStampY) > gap) stampAt(pt.x, pt.y);
      }
      else segment(active.x, active.y, pt.x, pt.y, events[i].pressure);
      advanceHue(Math.hypot(pt.x - active.x, pt.y - active.y));
      active.x = pt.x; active.y = pt.y;
    }
  }

  function onUp(e) {
    if (!active || e.pointerId !== active.id) return;
    clearInterval(sprayTimer);
    if (state.tool === 'marker') {
      pctx.globalAlpha = 0.85;
      pctx.drawImage(strokeCv, 0, 0);
      pctx.globalAlpha = 1;
      sctx.clearRect(0, 0, W, H);
    }
    active = null;
    scheduleSave();
  }

  function advanceHue(dist) { state.hue = (state.hue + dist * 0.25) % 360; }

  function pressureScale(p) {
    if (!state.penSeen || !p) return 1;
    return 0.5 + p * 1.0;
  }

  function segment(x0, y0, x1, y1, pressure) {
    var t = state.tool;
    if (t === 'pencil') {
      pctx.globalCompositeOperation = 'source-over';
      pctx.globalAlpha = 0.92;
      pctx.strokeStyle = strokeColor();
      pctx.lineWidth = size() * pressureScale(pressure);
      pctx.lineCap = 'round'; pctx.lineJoin = 'round';
      pctx.beginPath(); pctx.moveTo(x0, y0); pctx.lineTo(x1, y1); pctx.stroke();
      // a little graphite grain
      pctx.globalAlpha = 0.25;
      pctx.fillStyle = '#FFFFFF';
      var n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3) + 1;
      for (var i = 0; i < n; i++) {
        var f = i / n, w = size() * 0.5;
        pctx.fillRect(x0 + (x1 - x0) * f + (Math.random() - 0.5) * w * 2, y0 + (y1 - y0) * f + (Math.random() - 0.5) * w * 2, 1.5, 1.5);
      }
      pctx.globalAlpha = 1;
    } else if (t === 'crayon') {
      pctx.globalCompositeOperation = 'source-over';
      pctx.fillStyle = strokeColor();
      var rad = size() * pressureScale(pressure) / 2;
      var dist = Math.hypot(x1 - x0, y1 - y0);
      var steps = Math.max(1, Math.ceil(dist / 2));
      var dots = Math.ceil(rad * 1.2);
      for (var s = 0; s <= steps; s++) {
        var cx = x0 + (x1 - x0) * s / steps, cy = y0 + (y1 - y0) * s / steps;
        for (var k = 0; k < dots; k++) {
          var a = Math.random() * Math.PI * 2, rr = Math.random() * rad;
          pctx.globalAlpha = 0.35 + Math.random() * 0.4;
          var d = 1.5 + Math.random() * 2;
          pctx.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, d, d);
        }
      }
      pctx.globalAlpha = 1;
    } else if (t === 'eraser') {
      pctx.globalCompositeOperation = 'source-over';
      pctx.globalAlpha = 1;
      pctx.strokeStyle = '#FFFFFF';
      pctx.lineWidth = size();
      pctx.lineCap = 'round'; pctx.lineJoin = 'round';
      pctx.beginPath(); pctx.moveTo(x0, y0); pctx.lineTo(x1, y1); pctx.stroke();
    }
  }

  function markerSegment(x0, y0, x1, y1) {
    sctx.strokeStyle = strokeColor();
    sctx.lineWidth = size();
    sctx.lineCap = 'round'; sctx.lineJoin = 'round';
    sctx.beginPath(); sctx.moveTo(x0, y0); sctx.lineTo(x1 + 0.01, y1); sctx.stroke();
  }

  function spray(x, y, amount) {
    var rad = size();
    var n = Math.round(rad * 1.6 * (amount || 1));
    pctx.globalCompositeOperation = 'source-over';
    for (var i = 0; i < n; i++) {
      // gaussian-ish distribution: denser in the middle
      var a = Math.random() * Math.PI * 2;
      var rr = rad * (Math.random() + Math.random()) / 2 * (Math.random() < 0.5 ? 1 : Math.random());
      pctx.globalAlpha = 0.55 + Math.random() * 0.45;
      pctx.fillStyle = strokeColor();
      var d = 2 + Math.random() * 2.5;
      pctx.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr, d, d);
    }
    pctx.globalAlpha = 1;
    if (state.color === 'rainbow') advanceHue(3);
  }

  function stampAt(x, y) {
    active.lastStampX = x; active.lastStampY = y;
    var s = size();
    pctx.save();
    pctx.globalCompositeOperation = 'source-over';
    pctx.globalAlpha = 1;
    pctx.translate(x, y);
    pctx.rotate((Math.random() - 0.5) * 0.5);
    pctx.fillStyle = strokeColor();
    var sc = s / 20;
    pctx.scale(sc, sc);
    pctx.translate(-20, -20);
    if (state.stamp === 'star') {
      pctx.fill(new Path2D('M20 3 L25 15 L38 15 L27.5 23 L31.5 36 L20 28 L8.5 36 L12.5 23 L2 15 L15 15 Z'));
    } else if (state.stamp === 'heart') {
      pctx.fill(new Path2D('M20 36 C2 24 4 6 20 13 C36 6 38 24 20 36 Z'));
    } else if (state.stamp === 'flower') {
      [[20, 9], [31, 17], [27, 30], [13, 30], [9, 17]].forEach(function (c) {
        pctx.beginPath(); pctx.arc(c[0], c[1], 7, 0, Math.PI * 2); pctx.fill();
      });
      pctx.fillStyle = state.color === '#FFD60A' ? '#FF9500' : '#FFD60A';
      pctx.beginPath(); pctx.arc(20, 20, 6, 0, Math.PI * 2); pctx.fill();
    } else {
      pctx.beginPath(); pctx.arc(20, 20, 15, 0, Math.PI * 2); pctx.fill();
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
      colorFn = function (px, py) { return hslToRgb((base + (px + py) * 0.18) % 360, 95, 60); };
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
  setTool(state.tool);
  setColor(state.color);

  // Offline support when hosted; skipped on localhost so edits show up immediately.
  var devHost = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !devHost) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  // Exposed for automated checks.
  window.__studio = { state: state, openPage: openPage, setTool: setTool, setColor: setColor, doFill: doFill };
})();
