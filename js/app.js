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

  // Three sizes per tool; tapping the tool you already hold cycles them.
  var TOOLS = {
    pencil:  { sizes: [6, 11, 18] },
    crayon:  { sizes: [16, 28, 44] },
    marker:  { sizes: [20, 38, 64] },
    glitter: { sizes: [18, 32, 54] },
    neon:    { sizes: [12, 22, 36] },
    spray:   { sizes: [45, 75, 115] },
    bucket:  { sizes: null },
    stamp:   { sizes: [70, 110, 160] },
    sticker: { sizes: null },
    text:    { sizes: [70, 110, 170] },
    eraser:  { sizes: [26, 54, 100] }
  };
  var STAMPS = ['star', 'heart', 'flower', 'dot'];

  // Emoji for stamps and stickers. All are Emoji 11 or older so they render on iPadOS 15.
  var EMOJI = [
    '🦄', '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐧', '🐤', '🦋', '🐞',
    '🐝', '🐢', '🐬', '🐳', '🐙', '🦀', '🐠', '🦕', '🌈', '⭐', '🌟', '✨', '☀️', '🌙', '☁️', '❄️',
    '🌸', '🌻', '🌷', '🍀', '🍄', '🌵', '🍓', '🍒', '🍉', '🍎', '🍌', '🍩', '🍪', '🧁', '🍭', '🍦',
    '🍕', '🎂', '😀', '😍', '🥰', '😎', '🤩', '😜', '🥳', '😴', '❤️', '🧡', '💛', '💚', '💙', '💜',
    '🎈', '🎀', '👑', '💎', '🚀', '🚗', '🚂', '✈️', '⚽', '🎵'
  ];

  // Talking stickers: the word for each sticker, shown underneath and read aloud.
  var STICKER_WORDS = {
    '🦄': 'unicorn', '🐶': 'dog', '🐱': 'cat', '🐰': 'bunny', '🦊': 'fox', '🐻': 'bear', '🐼': 'panda', '🐨': 'koala',
    '🐯': 'tiger', '🦁': 'lion', '🐸': 'frog', '🐵': 'monkey', '🐧': 'penguin', '🐤': 'chick', '🦋': 'butterfly', '🐞': 'ladybug',
    '🐝': 'bee', '🐢': 'turtle', '🐬': 'dolphin', '🐳': 'whale', '🐙': 'octopus', '🦀': 'crab', '🐠': 'fish', '🦕': 'dinosaur',
    '🌈': 'rainbow', '⭐': 'star', '🌟': 'star', '✨': 'sparkle', '☀️': 'sun', '🌙': 'moon', '☁️': 'cloud', '❄️': 'snow',
    '🌸': 'flower', '🌻': 'sunflower', '🌷': 'tulip', '🍀': 'clover', '🍄': 'mushroom', '🌵': 'cactus', '🍓': 'strawberry',
    '🍒': 'cherry', '🍉': 'melon', '🍎': 'apple', '🍌': 'banana', '🍩': 'donut', '🍪': 'cookie', '🧁': 'cupcake',
    '🍭': 'lollipop', '🍦': 'ice cream', '🍕': 'pizza', '🎂': 'cake', '😀': 'happy', '😍': 'love', '🥰': 'hug', '😎': 'cool',
    '🤩': 'wow', '😜': 'silly', '🥳': 'party', '😴': 'sleepy', '❤️': 'red', '🧡': 'orange', '💛': 'yellow', '💚': 'green',
    '💙': 'blue', '💜': 'purple', '🎈': 'balloon', '🎀': 'bow', '👑': 'crown', '💎': 'gem', '🚀': 'rocket', '🚗': 'car',
    '🚂': 'train', '✈️': 'plane', '⚽': 'ball', '🎵': 'music'
  };
  var CHILD_NAME = (window.Art && Art.childName) || 'Me';
  var NAME_STICKER = 'name';
  var stickerWords = true;
  try { stickerWords = localStorage.getItem('studio-sticker-words') !== 'off'; } catch (e) {}

  // "More colours": 11 hues in 5 shades, then skin tones and greys.
  var MORE_COLORS = (function () {
    var hues = [2, 26, 46, 88, 130, 170, 200, 222, 255, 285, 330];
    var shades = [[90, 86], [80, 72], [72, 58], [70, 44], [60, 30]];
    var out = [];
    shades.forEach(function (sl) {
      hues.forEach(function (h) {
        var rgb = hslToRgb(h, sl[0], sl[1]);
        out.push('#' + rgb.map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase());
      });
    });
    return out.concat(['#FDE3CF', '#F6C9A6', '#E0A878', '#B97A50', '#7A4E2D', '#4A2F1D',
      '#D9D6CF', '#A9A49B', '#6E6A63', '#3A3733', '#111111']);
  })();
  var STAMP_PATHS = {
    star: 'M20 3 L25 15 L38 15 L27.5 23 L31.5 36 L20 28 L8.5 36 L12.5 23 L2 15 L15 15 Z',
    heart: 'M20 36 C2 24 4 6 20 13 C36 6 38 24 20 36 Z',
    dot: 'M20 5 A15 15 0 1 1 19.99 5 Z'
  };
  var FONT = 'ui-rounded, "SF Pro Rounded", -apple-system, "Helvetica Neue", sans-serif';
  var EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  var state = {
    page: null,
    tool: 'crayon',
    color: '#E8473B',
    sizes: { pencil: 1, crayon: 1, marker: 1, glitter: 1, neon: 1, spray: 1, eraser: 1, stamp: 1, text: 1 },
    stamp: 'star',
    sticker: '🦄',
    hue: 0,
    penSeen: false,
    mirror: 0,          // 0 off, 1 left/right, 2 four ways
    textStyle: 'solid'  // or 'hollow' (letters to colour in)
  };
  var booting = true;
  var replaying = false;

  // ---------- Seeded random, so "watch it again" redraws spray and glitter the same way ----------
  var seed = 1;
  function rnd() {
    seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // ---------- DOM ----------
  var $ = function (s) { return document.querySelector(s); };
  var home = $('#home'), studio = $('#studio'), grid = $('#grid');
  var stage = $('#stage'), board = $('#board'), objLayer = $('#objects');
  var paint = $('#paint'), lineImg = $('#lines');
  var pctx = paint.getContext('2d');
  paint.width = W; paint.height = H;

  function makeCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function release(c) { if (c) { c.width = c.height = 1; } }
  var lineCanvas = makeCanvas(W, H), lctx = lineCanvas.getContext('2d');
  var strokeCv = makeCanvas(W, H), sctx = strokeCv.getContext('2d'); // solid stroke, current gesture
  var glowA = null, glowB = null; // neon glow layers, made on first use
  var tmpCv = makeCanvas(256, 256), tctx = tmpCv.getContext('2d');
  var lineMask = null;

  function snd(name, arg) { if (window.Sound) { try { Sound.play(name, arg); } catch (e) {} } }

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
    var fine = bx.getImageData(0, 0, s, s), fd = fine.data;
    for (var j = 3; j < fd.length; j += 4) {
      var r = Math.random();
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
    pencil:  { grain: 'pencil', alpha: 0.95 },
    crayon:  { grain: 'crayon', alpha: 1 },
    marker:  { grain: null, alpha: 0.82 },
    glitter: { grain: null, alpha: 1, glitter: true },
    neon:    { grain: null, alpha: 1, neon: true }
  };

  // Glitter: the colour flecked with lighter, darker and white specks.
  var glitterCache = {};
  function glitterPattern(col) {
    var key = col;
    if (glitterCache[key]) return glitterCache[key];
    var rgb = colorRgb(col);
    var s = 48, c = makeCanvas(s, s), x = c.getContext('2d');
    x.fillStyle = rgbStr(rgb); x.fillRect(0, 0, s, s);
    var lite = mix(rgb, [255, 255, 255], 0.5), dark = mix(rgb, [0, 0, 0], 0.22);
    for (var i = 0; i < 170; i++) {
      var r = Math.random();
      x.fillStyle = r < 0.4 ? rgbStr(lite) : r < 0.75 ? rgbStr(dark) : 'rgba(255,255,255,.95)';
      var d = 1 + Math.random() * 2;
      x.fillRect(Math.random() * s, Math.random() * s, d, d);
    }
    glitterCache[key] = sctx.createPattern(c, 'repeat');
    return glitterCache[key];
  }

  // ---------- Prevent iOS zoom / callouts ----------
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { e.preventDefault(); });
  });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // ---------- My Pictures (blank drawings and photo pages) ----------
  var mine = [];            // [{ id, kind: 'blank' | 'photo', created }]
  var linesUrl = {};        // photo page id -> object URL of its outline PNG
  function saveMine() { return ArtStore.put('__mine', JSON.stringify(mine)); }
  function loadMine() {
    return ArtStore.get('__mine').then(function (v) {
      if (v) { try { mine = JSON.parse(v); } catch (e) { mine = []; } return; }
      // First run with this version: keep the old single "Draw" page if it has a drawing.
      return ArtStore.get('blank').then(function (b) {
        mine = b ? [{ id: 'blank', kind: 'blank', created: 0 }] : [];
        return saveMine();
      });
    });
  }
  function pageFor(m) {
    if (m.kind === 'photo') {
      return { id: m.id, name: 'My photo page', category: 'mine', mine: true, svgUrl: linesUrl[m.id] || ColorPages.blank.svgUrl };
    }
    return { id: m.id, name: 'My drawing', category: 'mine', mine: true, fillByColor: true, svgUrl: ColorPages.blank.svgUrl };
  }
  function linesFor(m) {
    if (m.kind !== 'photo' || linesUrl[m.id]) return Promise.resolve();
    return ArtStore.get(m.id + '::lines').then(function (b) { if (b) linesUrl[m.id] = URL.createObjectURL(b); });
  }

  // ---------- Gallery ----------
  // Home shows a shelf of groups (My Pictures, Animals, Space, ...); tapping one shows its pages.
  var galleryCat = null;
  var thumbUrls = [];

  function pageCard(p) {
    var b = document.createElement('button');
    b.className = 'card';
    b.setAttribute('aria-label', p.name);
    b.innerHTML = '<div class="thumb"><img class="saved" alt=""><img class="art" alt="" src="' + (p.thumbUrl || p.svgUrl) + '"></div>';
    b.addEventListener('click', function () { openPage(p); });
    ArtStore.get(p.id).then(function (blob) {
      if (blob) {
        var im = b.querySelector('.saved');
        var u = URL.createObjectURL(blob);
        thumbUrls.push(u);
        im.src = u;
        im.style.visibility = 'visible';
        if (p.thumbUrl) b.querySelector('.art').style.visibility = 'hidden';
      }
    });
    return b;
  }

  function setHeader(name, color) {
    home.classList.toggle('in-cat', !!name);
    $('#back').hidden = !name;
    $('#catName').textContent = name || '';
    if (color) {
      var crgb = hexToRgb(color);
      var light = crgb[0] * 0.299 + crgb[1] * 0.587 + crgb[2] * 0.114 > 170;
      home.style.setProperty('--cat', light ? '#34405A' : color);
    }
  }

  function buildGallery() {
    thumbUrls.forEach(function (u) { URL.revokeObjectURL(u); });
    thumbUrls = [];
    grid.innerHTML = '';
    if (galleryCat === 'mine') return buildMine();
    var cat = galleryCat && ColorPages.categories.filter(function (c) { return c.id === galleryCat; })[0];
    if (cat) {
      setHeader(cat.name, cat.color);
      grid.className = 'grid pages';
      cat.pages.forEach(function (p) { grid.appendChild(pageCard(p)); });
      home.scrollTop = 0;
      return;
    }
    setHeader(null);
    grid.className = 'grid shelf';

    var my = document.createElement('button');
    my.className = 'shelf-card blank';
    my.setAttribute('aria-label', 'My pictures');
    my.innerHTML = '<div class="cover"><svg viewBox="0 0 64 64"><path d="M32 16 V48 M16 32 H48" stroke="#34405A" stroke-width="6" stroke-linecap="round"/></svg></div><span>My Pictures</span>';
    my.addEventListener('click', function () { snd('tap'); galleryCat = 'mine'; buildGallery(); });
    grid.appendChild(my);

    ColorPages.categories.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'shelf-card';
      b.style.setProperty('--cat', c.color);
      var rgb = hexToRgb(c.color);
      if (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 170) b.classList.add('light');
      b.setAttribute('aria-label', c.name);
      var covers = c.pages.slice(0, 3).map(function (p, i) {
        return '<img class="c' + i + '" alt="" src="' + (p.thumbUrl || p.svgUrl) + '">';
      }).join('');
      b.innerHTML = '<div class="cover">' + covers + '</div><span>' + c.name + '</span>';
      b.addEventListener('click', function () { snd('tap'); galleryCat = c.id; buildGallery(); });
      grid.appendChild(b);
    });
  }

  function buildMine() {
    setHeader('My Pictures', '#34405A');
    grid.className = 'grid pages';
    var add = document.createElement('button');
    add.className = 'card make';
    add.setAttribute('aria-label', 'New drawing');
    add.innerHTML = '<svg viewBox="0 0 64 64"><path d="M32 14 V50 M14 32 H50" stroke="#34405A" stroke-width="7" stroke-linecap="round"/></svg><span>New</span>';
    add.addEventListener('click', function () {
      var p = pageFor({ id: 'mine-' + Date.now(), kind: 'blank' });
      p.unsaved = true;
      openPage(p);
    });
    grid.appendChild(add);

    var ph = document.createElement('button');
    ph.className = 'card make';
    ph.setAttribute('aria-label', 'Make a page from a photo');
    ph.innerHTML = '<svg viewBox="0 0 64 64"><path d="M8 20 H20 L25 12 H39 L44 20 H56 V52 H8 Z" fill="#F9D648" stroke="#34405A" stroke-width="4" stroke-linejoin="round"/><circle cx="32" cy="35" r="10" fill="#fff" stroke="#34405A" stroke-width="4"/></svg><span>Photo</span>';
    ph.addEventListener('click', function () { snd('tap'); $('#photoInput').click(); });
    grid.appendChild(ph);

    mine.slice().sort(function (a, b) { return b.created - a.created; }).forEach(function (m) {
      var wrap = document.createElement('div');
      wrap.style.position = 'relative';
      linesFor(m).then(function () {
        var card = pageCard(pageFor(m));
        wrap.appendChild(card);
        card.appendChild(deleteButton(m));
      });
      grid.appendChild(wrap);
    });
    home.scrollTop = 0;
  }

  // Hold the bin for a moment to throw a picture away (a tap does nothing).
  function deleteButton(m) {
    var d = document.createElement('span');
    d.className = 'del';
    d.setAttribute('role', 'button');
    d.setAttribute('aria-label', 'Hold to throw away');
    d.innerHTML = '<svg viewBox="0 0 48 48"><path d="M14 16 H34 L32 39 H16 Z M11 11 H37 V15 H11 Z M20 7 H28 V11 H20 Z"/></svg><span class="ring"></span>';
    var timer = null;
    function stop() { clearTimeout(timer); d.classList.remove('holding'); }
    d.addEventListener('click', function (e) { e.stopPropagation(); });
    d.addEventListener('pointerdown', function (e) {
      e.stopPropagation(); e.preventDefault();
      d.classList.add('holding');
      timer = setTimeout(function () {
        stop();
        snd('clear');
        mine = mine.filter(function (x) { return x.id !== m.id; });
        saveMine();
        [m.id, m.id + '::log', m.id + '::base', m.id + '::lines'].forEach(function (k) { ArtStore.remove(k); });
        if (linesUrl[m.id]) { URL.revokeObjectURL(linesUrl[m.id]); delete linesUrl[m.id]; }
        buildGallery();
      }, 1200);
    });
    d.addEventListener('pointerup', stop);
    d.addEventListener('pointerleave', stop);
    d.addEventListener('pointercancel', stop);
    return d;
  }

  // Photo -> colouring page
  $('#photoInput').addEventListener('change', function () {
    var file = this.files && this.files[0];
    this.value = '';
    if (!file || !window.PhotoPage) return;
    var busy = $('#busy');
    busy.hidden = false;
    setTimeout(function () {
      PhotoPage.fromFile(file).then(function (res) {
        var blob = dataUrlToBlob(res.dataUrl);
        var m = { id: 'photo-' + Date.now(), kind: 'photo', created: Date.now() };
        return ArtStore.put(m.id + '::lines', blob).then(function () {
          linesUrl[m.id] = URL.createObjectURL(blob);
          mine.push(m);
          return saveMine();
        }).then(function () {
          busy.hidden = true;
          openPage(pageFor(m));
        });
      }).catch(function () { busy.hidden = true; });
    }, 60);
  });
  function dataUrlToBlob(u) {
    var parts = u.split(','), bin = atob(parts[1]), n = bin.length, arr = new Uint8Array(n);
    for (var i = 0; i < n; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: (parts[0].match(/:(.*?);/) || [])[1] || 'image/png' });
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
      b.addEventListener('click', function () { setColor(c); snd('color'); });
      pal.appendChild(b);
    });
    var more = document.createElement('button');
    more.id = 'moreColors';
    more.className = 'swatch more';
    more.setAttribute('aria-label', 'More colours');
    more.innerHTML = '<span class="dots"><i></i><i></i><i></i><i></i></span>';
    more.addEventListener('click', function () { snd('tap'); openColorPicker(); });
    pal.appendChild(more);
  }

  // ---------- Popovers ----------
  var popLayer = null;
  function closePopover() {
    if (popLayer) { popLayer.remove(); popLayer = null; }
  }
  // side: 'left' of the anchor (colours) or 'right' of it (stamps)
  function openPopover(anchor, content, side) {
    closePopover();
    popLayer = document.createElement('div');
    popLayer.className = 'pop-layer';
    var pop = document.createElement('div');
    pop.className = 'popover ' + side;
    pop.appendChild(content);
    popLayer.appendChild(pop);
    popLayer.addEventListener('pointerdown', function (e) { if (e.target === popLayer) { e.preventDefault(); closePopover(); } });
    document.body.appendChild(popLayer);
    var a = anchor.getBoundingClientRect(), p = pop.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var top, left;
    if (vh > vw && side === 'right') { // portrait: tools are on top, open below
      top = a.bottom + 12; left = a.left + a.width / 2 - p.width / 2;
    } else if (vh > vw && side === 'left') { // portrait: colours are at the bottom, open above
      top = a.top - p.height - 12; left = a.left + a.width / 2 - p.width / 2;
    } else {
      top = a.top + a.height / 2 - p.height / 2;
      left = side === 'left' ? a.left - p.width - 16 : a.right + 16;
    }
    top = Math.max(12, Math.min(vh - p.height - 12, top));
    left = Math.max(12, Math.min(vw - p.width - 12, left));
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
    pop.classList.add('anim'); // animate only after measuring at full size
  }

  function openColorPicker() {
    var box = document.createElement('div');
    box.className = 'color-grid';
    MORE_COLORS.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'swatch mini' + (c === state.color ? ' active' : '');
      b.style.background = c;
      b.setAttribute('aria-label', 'colour ' + c);
      b.addEventListener('click', function () { setColor(c); snd('color'); closePopover(); });
      box.appendChild(b);
    });
    openPopover($('#moreColors'), box, 'left');
  }

  function openStampPicker() {
    var box = document.createElement('div');
    box.className = 'stamp-picker';
    var sizes = document.createElement('div');
    sizes.className = 'stamp-row';
    [0, 1, 2].forEach(function (i) {
      var b = document.createElement('button');
      b.className = 'pick size-pick' + (state.sizes.stamp === i ? ' active' : '');
      b.innerHTML = '<span style="width:' + (12 + i * 10) + 'px;height:' + (12 + i * 10) + 'px"></span>';
      b.setAttribute('aria-label', ['small', 'medium', 'big'][i]);
      b.addEventListener('click', function () {
        state.sizes.stamp = i;
        snd('tap');
        sizes.querySelectorAll('.size-pick').forEach(function (x, j) { x.classList.toggle('active', j === i); });
      });
      sizes.appendChild(b);
    });
    STAMPS.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'pick shape-pick' + (state.stamp === s ? ' active' : '');
      b.innerHTML = stampSvg(s);
      b.setAttribute('aria-label', s);
      b.addEventListener('click', function () { chooseStamp(s); });
      sizes.appendChild(b);
    });
    box.appendChild(sizes);
    box.appendChild(emojiGrid(function (em) { return state.stamp === 'emoji:' + em; },
      function (em) { chooseStamp('emoji:' + em); }));
    openPopover(document.querySelector('.tool[data-tool="stamp"]'), box, 'right');
  }

  function openStickerPicker() {
    var box = document.createElement('div');
    box.className = 'stamp-picker';
    var top = document.createElement('div');
    top.className = 'picker-top';
    var nameBtn = document.createElement('button');
    nameBtn.className = 'pick name-pick' + (state.sticker === NAME_STICKER ? ' active' : '');
    nameBtn.innerHTML = '<span class="emoji">✍️</span> ' + CHILD_NAME;
    nameBtn.addEventListener('click', function () {
      state.sticker = NAME_STICKER;
      renderStickerIcon();
      closePopover();
      commitFloater();
      placeSticker(W * 0.72, H * 0.86);
    });
    var wordsBtn = document.createElement('button');
    wordsBtn.className = 'pick words-pick' + (stickerWords ? ' active' : '');
    wordsBtn.setAttribute('aria-label', 'Show words under stickers');
    wordsBtn.innerHTML = '<span class="emoji">🐱</span><b>cat</b>';
    wordsBtn.addEventListener('click', function () {
      stickerWords = !stickerWords;
      try { localStorage.setItem('studio-sticker-words', stickerWords ? 'on' : 'off'); } catch (e) {}
      wordsBtn.classList.toggle('active', stickerWords);
      snd('tap');
      if (stickerWords) say('words on');
    });
    top.appendChild(nameBtn);
    top.appendChild(wordsBtn);
    box.appendChild(top);
    box.appendChild(emojiGrid(function (em) { return state.sticker === em; }, function (em) {
      state.sticker = em;
      renderStickerIcon();
      closePopover();
      commitFloater();
      // Put the new sticker in the middle; she can drag, pinch and twist it.
      placeSticker(W / 2 + (rnd() - 0.5) * 200, H / 2 + (rnd() - 0.5) * 140);
    }));
    openPopover(document.querySelector('.tool[data-tool="sticker"]'), box, 'right');
  }

  function emojiGrid(isActive, onPick) {
    var g = document.createElement('div');
    g.className = 'emoji-grid';
    EMOJI.forEach(function (em) {
      var b = document.createElement('button');
      b.className = 'pick emoji' + (isActive(em) ? ' active' : '');
      b.textContent = em;
      b.addEventListener('click', function () { onPick(em); });
      g.appendChild(b);
    });
    return g;
  }

  function chooseStamp(s) {
    state.stamp = s;
    snd('tap');
    renderStampIcon();
    closePopover();
  }

  function renderStampIcon() {
    var st = document.querySelector('.tool[data-tool="stamp"] .stamp-shape');
    if (state.stamp.indexOf('emoji:') === 0) {
      st.innerHTML = '<span class="emoji-icon">' + state.stamp.slice(6) + '</span>';
    } else {
      st.innerHTML = stampSvg(state.stamp);
    }
  }
  function renderStickerIcon() {
    document.querySelector('.tool[data-tool="sticker"] .sticker-face').textContent = state.sticker === NAME_STICKER ? '✍️' : state.sticker;
  }

  function setColor(c) {
    state.color = c;
    if (state.tool === 'eraser') setTool('crayon');
    var custom = COLORS.indexOf(c) < 0;
    document.querySelectorAll('#swatches .swatch').forEach(function (s) {
      s.classList.toggle('active', s.dataset.color === c);
    });
    var more = $('#moreColors');
    if (more) {
      more.classList.toggle('active', custom);
      more.classList.toggle('custom', custom);
      more.style.background = custom ? c : '';
    }
    var tint = c === 'rainbow' ? '#F28CB8' : (c === '#FFFFFF' ? '#E9E4DA' : c);
    document.documentElement.style.setProperty('--current', tint);
    studio.classList.toggle('rainbow-on', c === 'rainbow');
    if (floater && floater.kind === 'text') { floater.color = c; floater.hue = state.hue; renderFloater(); }
  }

  // Tapping the tool you already hold cycles its size (stamps and stickers open their picker).
  function setTool(t) {
    if (t !== state.tool) commitFloater();
    var same = t === state.tool;
    if (t === 'stamp' && state.tool !== null) openStampPicker();
    else if (t === 'sticker' && state.tool !== null) openStickerPicker();
    else if (same && TOOLS[t].sizes) {
      state.sizes[t] = (state.sizes[t] + 1) % 3;
      if (floater && floater.kind === 'text') { floater.size = TOOLS.text.sizes[state.sizes.text]; renderFloater(); }
      showSizeBubble(t);
    }
    if (!booting) snd('tool');
    bounce(document.querySelector('.tool[data-tool="' + t + '"]'));
    state.tool = t;
    document.querySelectorAll('.tool').forEach(function (b) {
      var on = b.dataset.tool === t;
      b.classList.toggle('active', on);
      var sz = b.querySelector('.size');
      if (sz) sz.dataset.size = state.sizes[b.dataset.tool];
    });
    renderStampIcon();
    // The letters tool starts a word straight away, with the keyboard open.
    if (t === 'text' && !same && !booting && state.page && !floater) startText(W / 2, H * 0.3);
  }

  function bounce(el) {
    if (!el) return;
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
  }

  // Shows the new size for a moment next to the tool.
  var bubbleTimer = null;
  function showSizeBubble(t) {
    var el = $('#sizeBubble'), tool = document.querySelector('.tool[data-tool="' + t + '"]');
    if (!tool) return;
    var k = board.clientWidth / W || 0.6;
    var px = TOOLS[t].sizes[state.sizes[t]] * k;
    if (t === 'text') el.innerHTML = '<span class="aa" style="font-size:' + Math.round(px * 0.8) + 'px">Aa</span>';
    else el.innerHTML = '<i style="width:' + Math.max(6, Math.min(110, px)) + 'px;height:' + Math.max(6, Math.min(110, px)) + 'px"></i>';
    var r = tool.getBoundingClientRect(), portrait = window.innerHeight > window.innerWidth;
    el.style.left = (portrait ? r.left + r.width / 2 - 65 : r.right + 18) + 'px';
    el.style.top = (portrait ? r.bottom + 16 : r.top + r.height / 2 - 65) + 'px';
    el.hidden = false;
    el.classList.remove('fade');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () {
      el.classList.add('fade');
      bubbleTimer = setTimeout(function () { el.hidden = true; }, 300);
    }, 900);
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
  function colorRgb(c) {
    if (c.charAt(0) === '#') return hexToRgb(c);
    var m = c.match(/hsl\((\d+)/);
    return m ? hslToRgb(+m[1], 80, 58) : [0, 0, 0];
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgbStr(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  // On scratch pages every pen shows the hidden picture: a pattern lined up with the page.
  // ctxName says which canvas the colour is for ('s' stroke layer, 'p' the page).
  var scratchPat = null;
  function strokeColor(ctxName) {
    if (scratchPat) return scratchPat[ctxName || 's'];
    if (state.color === 'rainbow') return 'hsl(' + Math.round(state.hue) + ',80%,58%)';
    return state.color;
  }

  // ---------- History: undo / redo, and the action log used by "watch it again" ----------
  // Undo keeps only the changed part of the page, so many steps fit in memory.
  var undoStack = [], redoStack = [];
  var MAX_UNDO = 30;
  var log = { base: false, actions: [] };

  function snapshot() {
    var c = makeCanvas(W, H);
    c.getContext('2d').drawImage(paint, 0, 0);
    return c;
  }
  function clipRect(r) {
    if (!r) return null;
    var x = Math.max(0, Math.floor(r.x0)), y = Math.max(0, Math.floor(r.y0));
    var x1 = Math.min(W, Math.ceil(r.x1)), y1 = Math.min(H, Math.ceil(r.y1));
    if (x1 <= x || y1 <= y) return null;
    return { x: x, y: y, w: x1 - x, h: y1 - y };
  }
  function crop(src, r) {
    var c = makeCanvas(r.w, r.h);
    c.getContext('2d').drawImage(src, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    return c;
  }
  function pushHistory(before, rect, action) {
    undoStack.push({ x: rect.x, y: rect.y, cv: crop(before, rect), action: action });
    if (undoStack.length > MAX_UNDO) release(undoStack.shift().cv);
    redoStack.forEach(function (r) { release(r.before); release(r.after); });
    redoStack = [];
    log.actions.push(action);
    refreshButtons();
  }
  function undo() {
    commitFloater();
    var e = undoStack.pop();
    if (!e) return;
    snd('undo');
    var after = crop(paint, { x: e.x, y: e.y, w: e.cv.width, h: e.cv.height });
    resetCtx();
    pctx.clearRect(e.x, e.y, e.cv.width, e.cv.height);
    pctx.drawImage(e.cv, e.x, e.y);
    var i = log.actions.lastIndexOf(e.action);
    if (i >= 0) log.actions.splice(i, 1);
    redoStack.push({ x: e.x, y: e.y, before: e.cv, after: after, action: e.action });
    refreshButtons();
    scheduleSave();
  }
  function redo() {
    var r = redoStack.pop();
    if (!r) return;
    snd('undo');
    resetCtx();
    pctx.clearRect(r.x, r.y, r.after.width, r.after.height);
    pctx.drawImage(r.after, r.x, r.y);
    release(r.after);
    undoStack.push({ x: r.x, y: r.y, cv: r.before, action: r.action });
    log.actions.push(r.action);
    refreshButtons();
    scheduleSave();
  }
  function clearHistory() {
    undoStack.forEach(function (e) { release(e.cv); });
    redoStack.forEach(function (r) { release(r.before); release(r.after); });
    undoStack = []; redoStack = [];
  }
  function refreshButtons() {
    $('#undo').disabled = undoStack.length === 0;
    $('#redo').disabled = redoStack.length === 0;
    $('#replay').disabled = log.actions.length === 0;
  }
  function resetCtx() {
    pctx.globalCompositeOperation = 'source-over';
    pctx.globalAlpha = 1;
  }

  // ---------- Page open/close ----------
  function paperColor() { return state.page && state.page.scratch ? ScratchArt.COAT : '#FFFFFF'; }
  function clearPaint() {
    resetCtx();
    pctx.fillStyle = paperColor();
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

  var openedAt = 0;
  function openPage(p) {
    snd('page');
    state.page = p;
    openedAt = Date.now();
    scratchPat = null;
    if (p.scratch && window.ScratchArt) {
      var hidden = ScratchArt.make(p.scratch, W, H);
      scratchPat = { s: sctx.createPattern(hidden, 'no-repeat'), p: pctx.createPattern(hidden, 'no-repeat') };
    }
    studio.classList.toggle('scratch', !!p.scratch);
    studio.classList.toggle('trace', !!p.trace);
    var hiddenTools = p.scratch ? ['glitter', 'neon', 'bucket', 'text'] : p.trace ? ['bucket'] : [];
    if (hiddenTools.indexOf(state.tool) >= 0) setTool('crayon');
    trace = p.trace ? { done: [], gdone: [], ready: false } : null;
    if (p.trace) say(spoken(p.trace.intro));
    galleryCat = p.category;
    clearHistory();
    log = { base: false, actions: [] };
    refreshButtons();
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

    Promise.all([ArtStore.get(p.id), ArtStore.get(p.id + '::log')]).then(function (res) {
      if (state.page !== p) return;
      var blob = res[0], saved = null;
      try { saved = res[1] ? JSON.parse(res[1]) : null; } catch (e) {}
      if (saved && saved.actions) log = saved;
      else if (blob) {
        // A picture from before "watch it again" existed: replay starts from it.
        log = { base: true, actions: [] };
        ArtStore.put(p.id + '::base', blob);
      }
      refreshButtons();
      if (!blob) { if (trace) trace.ready = true; return; }
      var url = URL.createObjectURL(blob);
      loadImage(url).then(function (im) {
        if (state.page === p) {
          resetCtx(); pctx.drawImage(im, 0, 0, W, H);
          if (trace) { checkTrace(false); trace.ready = true; }
        }
        URL.revokeObjectURL(url);
      });
    });
  }

  function goHome() {
    snd('tap');
    commitFloater();
    saveNow().then(function () {
      studio.hidden = true;
      home.hidden = false;
      state.page = null;
      clearHistory();
      buildGallery();
      if (window.__applyUpdateIfReady) window.__applyUpdateIfReady();
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
    if (!p || replaying) return Promise.resolve();
    if (p.unsaved) {
      if (!log.actions.length) return Promise.resolve(); // an untouched new page isn't kept
      p.unsaved = false;
      mine.push({ id: p.id, kind: 'blank', created: Date.now() });
      saveMine();
    }
    var logJson = JSON.stringify(log);
    return new Promise(function (resolve) {
      paint.toBlob(function (blob) {
        if (!blob) return resolve();
        Promise.all([ArtStore.put(p.id, blob), ArtStore.put(p.id + '::log', logJson)]).then(resolve, resolve);
      }, 'image/jpeg', 0.92);
    });
  }

  function exportImage() {
    commitFloater();
    var c = makeCanvas(W, H);
    var x = c.getContext('2d');
    x.drawImage(paint, 0, 0);
    x.drawImage(lineCanvas, 0, 0);
    var native = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.studio;
    if (native) {
      // Inside the iPad app: hand the picture to the native share sheet (Save Image, AirDrop, Print...).
      var r = document.getElementById('save').getBoundingClientRect();
      native.postMessage({ type: 'share', image: c.toDataURL('image/png'),
        rect: { x: r.left, y: r.top, w: r.width, h: r.height } });
      release(c);
      flash();
      return;
    }
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
      release(c);
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
    renderFloater();
  }
  window.addEventListener('resize', function () { if (!studio.hidden) fitBoard(); });
  window.addEventListener('orientationchange', function () { setTimeout(fitBoard, 250); });

  // ---------- Mirror ----------
  function mirrorsOf(x, y) {
    var out = [[x, y]];
    if (state.mirror >= 1) out.push([W - x, y]);
    if (state.mirror === 2) { out.push([x, H - y]); out.push([W - x, H - y]); }
    return out;
  }
  // Maps a point through mirror number i (0 = as drawn).
  function mp(i, x, y) {
    if (i === 1) return [W - x, y];
    if (i === 2) return [x, H - y];
    if (i === 3) return [W - x, H - y];
    return [x, y];
  }
  function mirrorCount() { return state.mirror === 2 ? 4 : state.mirror === 1 ? 2 : 1; }
  function setMirror(m) {
    state.mirror = m;
    var b = $('#mirror');
    b.dataset.mode = m;
    b.querySelector('.badge').textContent = m === 2 ? '4' : '2';
    var g = $('#guides');
    g.hidden = m === 0;
    g.classList.toggle('quad', m === 2);
  }

  // ---------- Drawing ----------
  // Every stroke is recorded as a list of small drawing calls so it can be replayed exactly.
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
  function newActive(x, y) {
    return { x: x, y: y, mx: x, my: y, lastStampX: -9999, lastStampY: -9999, t: Date.now(), w: null, endX: null, endY: null, dirty: null };
  }
  function dirty(x, y, w, h) {
    var d = active.dirty;
    if (!d) active.dirty = { x0: x, y0: y, x1: x + w, y1: y + h };
    else {
      if (x < d.x0) d.x0 = x; if (y < d.y0) d.y0 = y;
      if (x + w > d.x1) d.x1 = x + w; if (y + h > d.y1) d.y1 = y + h;
    }
  }
  function r1(v) { return Math.round(v * 10) / 10; }

  // Run one drawing call and (when drawing live) record it.
  function op(name, args) {
    if (active.action && !replaying) active.action.calls.push([name].concat(args.map(r1)));
    run(name, args);
  }
  function run(name, a) {
    if (name === 'b') { brushTo(a[0], a[1], a[2], a[3]); if (a[3] !== 2) { active.x = a[0]; active.y = a[1]; } }
    else if (name === 'e') { eraseTo(a[0], a[1], a[2]); active.x = a[0]; active.y = a[1]; }
    else if (name === 's') spray(a[0], a[1], a[2]);
    else if (name === 't') stampAt(a[0], a[1]);
    else if (name === 'h') advanceHue(a[0]);
  }

  function beginStroke() {
    active.before = snapshot();
    if (BRUSH[state.tool]) {
      active.base = active.before;
      sctx.clearRect(0, 0, W, H);
      if (BRUSH[state.tool].neon) {
        if (!glowA) { glowA = makeCanvas(W, H); glowB = makeCanvas(W, H); }
        glowA.getContext('2d').clearRect(0, 0, W, H);
        glowB.getContext('2d').clearRect(0, 0, W, H);
      }
    }
  }
  function endStroke() {
    var r = clipRect(active.dirty);
    if (r && !replaying) pushHistory(active.before, r, active.action);
    release(active.before);
    active.before = active.base = null;
  }

  function onDown(e) {
    if (replaying) return;
    if (state.tool === 'sticker' || state.tool === 'text') return objDown(e);
    if (active) return;
    // The finger that opened the page can land on it a moment later; don't let it leave a mark.
    if (Date.now() - openedAt < 400) return;
    if (e.pointerType === 'pen') state.penSeen = true;
    // Once an Apple Pencil is used, ignore fingers/palm on the page.
    if (state.penSeen && e.pointerType === 'touch') return;
    e.preventDefault();
    try { board.setPointerCapture(e.pointerId); } catch (err) {}
    var pt = toCanvas(e);
    var t = state.tool;
    if (t === 'bucket') { doFill(pt.x, pt.y); return; }

    seed = (Math.random() * 2147483647) | 0;
    active = newActive(pt.x, pt.y);
    active.id = e.pointerId;
    active.lastT = e.timeStamp;
    active.action = { t: 'stroke', tool: t, color: state.color, size: state.sizes[t], stamp: state.stamp,
      mirror: state.mirror, hue: r1(state.hue), seed: seed, calls: [] };
    beginStroke();
    if (window.Sound) Sound.brushStart(t);
    if (BRUSH[t]) {
      op('b', [pt.x, pt.y, brushWidth(e.pressure), 1]);
    } else if (t === 'spray') {
      op('s', [pt.x, pt.y, 1]);
      sprayTimer = setInterval(function () { if (active) op('s', [active.x, active.y, 1]); }, 30);
    } else if (t === 'stamp') {
      op('t', [pt.x, pt.y]);
      snd('stamp');
    } else if (t === 'eraser') {
      op('e', [pt.x, pt.y, 1]);
    }
  }

  function onMove(e) {
    if (objPtrs[e.pointerId]) return objMove(e);
    if (!active || e.pointerId !== active.id) return;
    e.preventDefault();
    var events = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    if (!events.length) events = [e];
    var t = state.tool, moved = 0;
    for (var i = 0; i < events.length; i++) {
      var pt = toCanvas(events[i]);
      var dist = Math.hypot(pt.x - active.x, pt.y - active.y);
      moved += dist;
      if (BRUSH[t]) op('b', [pt.x, pt.y, brushWidth(events[i].pressure), 0]);
      else if (t === 'eraser') op('e', [pt.x, pt.y, 0]);
      else {
        if (t === 'spray') op('s', [pt.x, pt.y, 0.35]);
        else if (t === 'stamp' && Math.hypot(pt.x - active.lastStampX, pt.y - active.lastStampY) > size() * 1.1) {
          op('t', [pt.x, pt.y]);
          snd('stamp');
        }
        active.x = pt.x; active.y = pt.y;
      }
      op('h', [dist]);
    }
    var dt = Math.max(1, e.timeStamp - (active.lastT || e.timeStamp - 16));
    active.lastT = e.timeStamp;
    if (window.Sound) Sound.brushMove(moved * board.clientWidth / W / dt);
  }

  function onUp(e) {
    if (objPtrs[e.pointerId]) return objUp(e);
    if (!active || e.pointerId !== active.id) return;
    clearInterval(sprayTimer);
    if (window.Sound) Sound.brushEnd();
    if (BRUSH[state.tool]) {
      // finish the tail of the smoothed curve
      op('b', [active.x, active.y, active.w || size(), 2]);
    }
    endStroke();
    active = null;
    scheduleSave();
    if (trace && trace.ready) checkTrace(true);
  }

  // ---------- Tracing letters ----------
  // A letter counts as traced when most of its dots have colour on or right next to them.
  var trace = null;
  // Turns "{A} is for apple" into separate phrases, ["A", "is for apple"], so the voice says
  // the letter's name on its own (inside a sentence it reads "A" as "uh" and "ay" as "eye").
  function spoken(t) {
    return t.split(/(\{.\})/).filter(function (part) { return part.trim(); }).map(function (part) {
      var m = /^\{(.)\}$/.exec(part);
      return m ? LETTER_NAMES[m[1].toUpperCase()] || m[1] : part.trim();
    });
  }
  function checkTrace(celebrate) {
    var tr = state.page && state.page.trace;
    if (!tr || !trace) return;
    var x0 = W, y0 = H, x1 = 0, y1 = 0, R = 14;
    tr.items.forEach(function (it) {
      it.pts.forEach(function (q) {
        x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]);
      });
    });
    x0 = Math.max(0, Math.floor(x0 - R)); y0 = Math.max(0, Math.floor(y0 - R));
    x1 = Math.min(W - 1, Math.ceil(x1 + R)); y1 = Math.min(H - 1, Math.ceil(y1 + R));
    var bw = x1 - x0 + 1, img = pctx.getImageData(x0, y0, bw, y1 - y0 + 1).data;
    var paper = hexToRgb(paperColor()), offs = [[0, 0], [R, 0], [-R, 0], [0, R], [0, -R], [10, 10], [-10, 10], [10, -10], [-10, -10]];
    function inked(px, py) {
      for (var k = 0; k < offs.length; k++) {
        var xx = Math.round(px + offs[k][0]) - x0, yy = Math.round(py + offs[k][1]) - y0;
        if (xx < 0 || yy < 0 || xx >= bw || yy > y1 - y0) continue;
        var i = (yy * bw + xx) * 4;
        if (Math.abs(img[i] - paper[0]) + Math.abs(img[i + 1] - paper[1]) + Math.abs(img[i + 2] - paper[2]) > 60) return true;
      }
      return false;
    }
    var newly = [];
    tr.items.forEach(function (it, n) {
      if (trace.done[n]) return;
      var hit = 0;
      it.pts.forEach(function (q) { if (inked(q[0], q[1])) hit++; });
      if (hit / it.pts.length >= 0.75) { trace.done[n] = true; newly.push(it); }
    });
    var groups = [];
    tr.groups.forEach(function (g, n) {
      if (trace.gdone[n]) return;
      if (g.items.every(function (i) { return trace.done[i]; })) { trace.gdone[n] = true; groups.push(g); }
    });
    if (!celebrate) return;
    newly.forEach(function (it) { burst(it.cx, it.cy, 5); });
    if (newly.length) { snd('sparkle'); say(spoken('{' + newly[newly.length - 1].say + '}')); }
    groups.forEach(function (g, gi) {
      setTimeout(function () {
        if (!state.page || state.page.trace !== tr) return;
        snd('magic');
        say(spoken(g.say));
        burst(g.at[0], g.at[1], 9);
        if (g.sticker) {
          commitFloater();
          floater = { kind: 'sticker', text: g.sticker, word: stickerWords ? g.word : '', x: g.at[0], y: g.at[1],
            size: g.size || 180, rot: (rnd() - 0.5) * 0.3 };
          makeFloaterEl();
        }
      }, 900 + gi * 1500);
    });
  }
  // A little shower of sparkles over the page.
  function burst(x, y, n) {
    var k = board.clientWidth / W;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      s.className = 'burst';
      s.textContent = i % 3 === 0 ? '⭐' : '✨';
      var a = (i / n) * 6.283 + Math.random() * 0.6, d = 60 + Math.random() * 80;
      s.style.left = (x * k) + 'px'; s.style.top = (y * k) + 'px';
      s.style.setProperty('--dx', (Math.cos(a) * d) + 'px');
      s.style.setProperty('--dy', (Math.sin(a) * d) + 'px');
      objLayer.appendChild(s);
      setTimeout(function (el) { return function () { el.remove(); }; }(s), 1100);
    }
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
  // canvas, then composited onto the page (through the paper grain) for the dirty area only.
  // flag: 1 = first point, 2 = finish the tail, 0 = normal.
  function brushTo(x, y, w, flag) {
    var b = BRUSH[state.tool];
    var first = flag === 1, finish = flag === 2;
    if (!finish) active.w = w;
    var x0, y0, cx, cy, x1, y1;
    if (first) {
      x0 = x; y0 = y; cx = x; cy = y; x1 = x + 0.01; y1 = y;
    } else if (finish) {
      x0 = active.endX != null ? active.endX : x; y0 = active.endY != null ? active.endY : y;
      cx = (x0 + x) / 2; cy = (y0 + y) / 2; x1 = x; y1 = y;
    } else {
      x0 = active.endX != null ? active.endX : active.x; y0 = active.endY != null ? active.endY : active.y;
      cx = active.x; cy = active.y;
      x1 = (active.x + x) / 2; y1 = (active.y + y) / 2;
    }
    active.endX = x1; active.endY = y1;
    active.mx = active.x; active.my = active.y;
    var col = strokeColor('s');
    var n = mirrorCount();
    for (var i = 0; i < n; i++) {
      var p0 = mp(i, x0, y0), pc = mp(i, cx, cy), p1 = mp(i, x1, y1);
      drawSeg(b, p0, pc, p1, w, col);
      var pad = (b.neon ? w * 1.4 : b.glitter ? w * 0.9 : w / 2) + 4;
      var bx = Math.floor(Math.max(0, Math.min(p0[0], pc[0], p1[0]) - pad));
      var by = Math.floor(Math.max(0, Math.min(p0[1], pc[1], p1[1]) - pad));
      var bw = Math.ceil(Math.min(W, Math.max(p0[0], pc[0], p1[0]) + pad)) - bx;
      var bh = Math.ceil(Math.min(H, Math.max(p0[1], pc[1], p1[1]) + pad)) - by;
      if (bw > 0 && bh > 0) { composite(bx, by, bw, bh, b); dirty(bx, by, bw, bh); }
    }
  }

  function curve(ctx, p0, pc, p1, w, style) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = style; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(pc[0], pc[1], p1[0], p1[1]); ctx.stroke();
  }

  function drawSeg(b, p0, pc, p1, w, col) {
    if (b.neon) {
      // Glow layers are drawn solid and blended softly later, so overlaps don't make beads.
      var rgb = colorRgb(col);
      curve(glowA.getContext('2d'), p0, pc, p1, w * 2.8, col);
      curve(glowB.getContext('2d'), p0, pc, p1, w * 1.7, col);
      curve(sctx, p0, pc, p1, w * 0.85, rgbStr(mix(rgb, [255, 255, 255], 0.35)));
      curve(sctx, p0, pc, p1, w * 0.35, rgbStr(mix(rgb, [255, 255, 255], 0.85)));
      return;
    }
    if (b.glitter) {
      var key = state.color === 'rainbow' ? 'hsl(' + (Math.round(state.hue / 20) * 20) + ',80%,58%)' : col;
      curve(sctx, p0, pc, p1, w, glitterPattern(key));
      // A twinkle every so often
      if (rnd() < 0.22) {
        var r = w * (0.2 + rnd() * 0.25), a = rnd() * 6.28, d = rnd() * w * 0.45;
        twinkle(sctx, p1[0] + Math.cos(a) * d, p1[1] + Math.sin(a) * d, r);
      }
      return;
    }
    curve(sctx, p0, pc, p1, w, col);
  }

  function twinkle(ctx, x, y, r) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
    ctx.restore();
  }

  function composite(bx, by, bw, bh, b) {
    resetCtx();
    pctx.drawImage(active.base, bx, by, bw, bh, bx, by, bw, bh);
    if (b.neon) {
      pctx.globalAlpha = 0.16;
      pctx.drawImage(glowA, bx, by, bw, bh, bx, by, bw, bh);
      pctx.globalAlpha = 0.32;
      pctx.drawImage(glowB, bx, by, bw, bh, bx, by, bw, bh);
      pctx.globalAlpha = 1;
      pctx.drawImage(strokeCv, bx, by, bw, bh, bx, by, bw, bh);
      return;
    }
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
    pctx.globalAlpha = b.alpha;
    pctx.drawImage(tmpCv, 0, 0, bw, bh, bx, by, bw, bh);
    pctx.globalAlpha = 1;
  }

  function eraseTo(x, y, first) {
    resetCtx();
    var s = size();
    pctx.strokeStyle = paperColor();
    pctx.lineWidth = s;
    pctx.lineCap = 'round'; pctx.lineJoin = 'round';
    for (var i = 0, n = mirrorCount(); i < n; i++) {
      var a = mp(i, first ? x : active.x, first ? y : active.y), b = mp(i, x, y);
      pctx.beginPath();
      pctx.moveTo(a[0], a[1]);
      pctx.lineTo(b[0] + (first ? 0.01 : 0), b[1]);
      pctx.stroke();
      dirty(Math.min(a[0], b[0]) - s, Math.min(a[1], b[1]) - s, Math.abs(a[0] - b[0]) + 2 * s, Math.abs(a[1] - b[1]) + 2 * s);
    }
  }

  function spray(x, y, amount) {
    var rad = size();
    var n = Math.round(rad * 1.6 * (amount || 1));
    resetCtx();
    pctx.fillStyle = strokeColor('p');
    var pts = mirrorsOf(x, y);
    for (var i = 0; i < n; i++) {
      var a = rnd() * Math.PI * 2;
      var rr = rad * (rnd() + rnd()) / 2 * (rnd() < 0.5 ? 1 : rnd());
      var alpha = 0.55 + rnd() * 0.45;
      var d = 2 + rnd() * 2.5;
      for (var k = 0; k < pts.length; k++) {
        var sx = k === 1 || k === 3 ? -1 : 1, sy = k >= 2 ? -1 : 1;
        pctx.globalAlpha = alpha;
        pctx.beginPath();
        pctx.arc(pts[k][0] + Math.cos(a) * rr * sx, pts[k][1] + Math.sin(a) * rr * sy, d / 2, 0, Math.PI * 2);
        pctx.fill();
      }
    }
    pctx.globalAlpha = 1;
    pts.forEach(function (p) { dirty(p[0] - rad - 4, p[1] - rad - 4, rad * 2 + 8, rad * 2 + 8); });
    if (state.color === 'rainbow') advanceHue(3);
  }

  function stampAt(x, y) {
    active.lastStampX = x; active.lastStampY = y;
    var rot = (rnd() - 0.5) * 0.5, jitter = 0.85 + rnd() * 0.3, ej = 0.9 + rnd() * 0.2;
    var col = strokeColor('p');
    var pts = mirrorsOf(x, y);
    var sz = size();
    for (var k = 0; k < pts.length; k++) {
      var px = pts[k][0], py = pts[k][1];
      pctx.save();
      resetCtx();
      pctx.translate(px, py);
      pctx.rotate(k === 1 || k === 2 ? -rot : rot);
      if (state.stamp.indexOf('emoji:') === 0) {
        pctx.font = Math.round(sz * ej) + 'px ' + EMOJI_FONT;
        pctx.textAlign = 'center';
        pctx.textBaseline = 'middle';
        pctx.fillText(state.stamp.slice(6), 0, sz * 0.05);
      } else {
        pctx.fillStyle = col;
        var sc = sz / 2 / 20 * jitter;
        pctx.scale(sc, sc);
        pctx.translate(-20, -20);
        // Keep the hidden scratch picture lined up with the page, whatever the stamp's turn and size.
        if (scratchPat && col.setTransform && pctx.getTransform) col.setTransform(pctx.getTransform().inverse());
        if (state.stamp === 'flower') {
          [[20, 9], [31, 17], [27, 30], [13, 30], [9, 17]].forEach(function (c) {
            pctx.beginPath(); pctx.arc(c[0], c[1], 7, 0, Math.PI * 2); pctx.fill();
          });
          if (!scratchPat) pctx.fillStyle = state.color === '#F9D648' ? '#F7932E' : '#F9D648';
          pctx.beginPath(); pctx.arc(20, 20, 6, 0, Math.PI * 2); pctx.fill();
        } else {
          pctx.fill(new Path2D(STAMP_PATHS[state.stamp]));
        }
      }
      pctx.restore();
      if (scratchPat && col.setTransform && window.DOMMatrix) col.setTransform(new DOMMatrix());
      dirty(px - sz, py - sz, sz * 2, sz * 2);
    }
    if (state.color === 'rainbow') advanceHue(40);
  }

  function doFill(x, y) {
    if (!lineMask) return;
    var action = { t: 'fill', x: r1(x), y: r1(y), color: state.color, hue: r1(state.hue), mirror: state.mirror };
    if (runFill(action, true)) { snd('fill'); scheduleSave(); }
  }
  function runFill(a, record) {
    var before = record ? snapshot() : null;
    var img = pctx.getImageData(0, 0, W, H);
    var colorFn;
    state.hue = a.hue;
    if (a.color === 'rainbow') {
      var base = a.hue;
      colorFn = function (px, py) { return hslToRgb((base + (px + py) * 0.18) % 360, 80, 62); };
      advanceHue(60);
    } else {
      var rgb = hexToRgb(a.color);
      colorFn = function () { return rgb; };
    }
    var linesOnly = !(state.page && state.page.fillByColor);
    var saveMirror = state.mirror;
    state.mirror = a.mirror;
    var box = null;
    mirrorsOf(a.x, a.y).forEach(function (p) {
      var r = ColorFill.floodFill(img, lineMask, p[0], p[1], colorFn, 60, linesOnly);
      if (r) box = box ? { x0: Math.min(box.x0, r.x), y0: Math.min(box.y0, r.y), x1: Math.max(box.x1, r.x + r.w), y1: Math.max(box.y1, r.y + r.h) }
                       : { x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h };
    });
    state.mirror = saveMirror;
    if (box) {
      pctx.putImageData(img, 0, 0);
      if (record) pushHistory(before, clipRect(box), a);
    }
    release(before);
    return !!box;
  }

  board.addEventListener('pointerdown', onDown);
  board.addEventListener('pointermove', onMove);
  board.addEventListener('pointerup', onUp);
  board.addEventListener('pointercancel', onUp);
  board.addEventListener('lostpointercapture', function (e) { if (active && e.pointerId === active.id) onUp(e); });

  // ---------- Stickers and words you can move ----------
  // A floater sits above the page until it's stuck down: drag to move, pinch to resize and twist.
  var floater = null;   // { kind, text, x, y, size, rot, color, hue, style, el }
  var objPtrs = {};     // pointerId -> { x, y } in screen pixels
  var gesture = null;

  function placeSticker(x, y) {
    if (state.sticker === NAME_STICKER) {
      // Her name, to sign a picture with.
      floater = { kind: 'text', text: CHILD_NAME, x: x, y: y, size: 110, rot: (rnd() - 0.5) * 0.15,
        color: state.color === '#FFFFFF' ? 'rainbow' : state.color, hue: state.hue, style: 'solid' };
      makeFloaterEl();
      snd('sticker');
      say(CHILD_NAME);
      return;
    }
    var word = stickerWords ? STICKER_WORDS[state.sticker] || '' : '';
    floater = { kind: 'sticker', text: state.sticker, word: word, x: x, y: y, size: 190, rot: (rnd() - 0.5) * 0.3 };
    makeFloaterEl();
    snd('sticker');
    if (word) say(word);
  }
  function startText(x, y) {
    floater = { kind: 'text', text: '', x: x, y: y, size: TOOLS.text.sizes[state.sizes.text], rot: 0,
      color: state.color, hue: state.hue, style: state.textStyle };
    makeFloaterEl();
    openKeyboard();
  }

  function makeFloaterEl() {
    var el = document.createElement('div');
    el.className = 'floater';
    el.innerHTML = '<span class="content"></span>' +
      '<button class="obj-btn obj-x" aria-label="Remove"><svg viewBox="0 0 48 48"><path d="M14 14 L34 34 M34 14 L14 34" stroke="#34405A" stroke-width="6" stroke-linecap="round"/></svg></button>' +
      '<button class="obj-btn obj-ok" aria-label="Stick it down"><svg viewBox="0 0 48 48"><path d="M10 25 L20 35 L39 13" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
    if (floater.kind === 'sticker' && floater.word) {
      var wd = document.createElement('button');
      wd.className = 'obj-word';
      wd.textContent = floater.word;
      wd.setAttribute('aria-label', 'Say ' + floater.word);
      wd.addEventListener('pointerdown', function (e) {
        e.stopPropagation(); e.preventDefault();
        pressAnim(wd);
        say(floater ? floater.word : wd.textContent);
      });
      el.appendChild(wd);
    }
    el.querySelector('.obj-x').addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); removeFloater(); });
    el.querySelector('.obj-ok').addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); commitFloater(); });
    objLayer.appendChild(el);
    floater.el = el;
    renderFloater();
  }

  function renderFloater() {
    if (!floater || !floater.el) return;
    var k = board.clientWidth / W;
    var el = floater.el, c = el.querySelector('.content');
    el.style.transform = 'translate(' + (floater.x * k) + 'px,' + (floater.y * k) + 'px) translate(-50%,-50%) rotate(' + floater.rot + 'rad)';
    c.style.fontSize = (floater.size * k) + 'px';
    if (floater.kind === 'sticker') {
      c.className = 'content emoji';
      c.textContent = floater.text;
      var wd = el.querySelector('.obj-word');
      if (wd) wd.style.fontSize = (floater.size * 0.26 * k) + 'px';
      return;
    }
    c.className = 'content' + (floater.style === 'hollow' ? ' hollow' : '') + (floater.text ? '' : ' empty');
    if (floater.color === 'rainbow' && floater.style !== 'hollow') {
      c.innerHTML = '';
      for (var i = 0; i < floater.text.length; i++) {
        var s = document.createElement('span');
        s.textContent = floater.text.charAt(i);
        s.style.color = 'hsl(' + Math.round((floater.hue + i * 35) % 360) + ',80%,58%)';
        c.appendChild(s);
      }
    } else {
      c.textContent = floater.text;
      c.style.color = floater.color === '#FFFFFF' ? '#FFFFFF' : floater.color;
      c.style.webkitTextStroke = floater.color === '#FFFFFF' && floater.style !== 'hollow' ? '.04em #34405A' : '';
    }
  }

  function removeFloater() {
    if (!floater) return;
    if (floater.el) floater.el.remove();
    floater = null;
    objPtrs = {}; gesture = null;
    closeKeyboard();
  }

  // Stick the floater onto the page (and into undo and the replay log).
  function commitFloater() {
    if (!floater) return;
    var f = floater;
    removeFloater();
    if (f.kind === 'text' && !f.text.trim()) return;
    var o = { kind: f.kind, text: f.text, x: r1(f.x), y: r1(f.y), size: r1(f.size), rot: Math.round(f.rot * 1000) / 1000,
      color: f.color, hue: r1(f.hue || 0), style: f.style };
    if (f.word) o.word = f.word;
    var before = snapshot();
    var rect = drawObject(pctx, o);
    var r = clipRect(rect);
    if (r) pushHistory(before, r, { t: 'obj', o: o });
    release(before);
    snd(f.kind === 'sticker' ? 'sticker' : 'stamp');
    scheduleSave();
  }

  // Draws a sticker or word; returns the area it covers.
  function drawObject(ctx, o) {
    ctx.save();
    resetCtx();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.rot);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var w, h = o.size * 1.2;
    if (o.kind === 'sticker') {
      ctx.font = Math.round(o.size) + 'px ' + EMOJI_FONT;
      w = ctx.measureText(o.text).width;
      ctx.fillText(o.text, 0, o.size * 0.05);
      if (o.word) {
        // The sticker's word underneath, in a little white label.
        var ws = Math.round(o.size * 0.26);
        ctx.font = '800 ' + ws + 'px ' + FONT;
        var tw = ctx.measureText(o.word).width, py = o.size * 0.62 + ws * 0.55;
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        roundRect(ctx, -tw / 2 - ws * 0.35, py - ws * 0.68, tw + ws * 0.7, ws * 1.36, ws * 0.45);
        ctx.fill();
        ctx.fillStyle = '#34405A';
        ctx.fillText(o.word, 0, py);
        w = Math.max(w, tw + ws);
        h = (py + ws) * 2;
      }
    } else {
      ctx.font = '800 ' + Math.round(o.size) + 'px ' + FONT;
      ctx.lineJoin = 'round';
      w = ctx.measureText(o.text).width;
      if (o.style === 'hollow') {
        ctx.lineWidth = o.size * 0.08;
        ctx.strokeStyle = '#34405A';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeText(o.text, 0, 0);
        ctx.fillText(o.text, 0, 0);
      } else if (o.color === 'rainbow') {
        ctx.textAlign = 'left';
        var x = -w / 2;
        for (var i = 0; i < o.text.length; i++) {
          var ch = o.text.charAt(i);
          ctx.fillStyle = 'hsl(' + Math.round((o.hue + i * 35) % 360) + ',80%,58%)';
          ctx.fillText(ch, x, 0);
          x += ctx.measureText(ch).width;
        }
      } else {
        if (o.color === '#FFFFFF') { ctx.lineWidth = o.size * 0.08; ctx.strokeStyle = '#34405A'; ctx.strokeText(o.text, 0, 0); }
        ctx.fillStyle = o.color;
        ctx.fillText(o.text, 0, 0);
      }
    }
    ctx.restore();
    var rad = Math.hypot(w, h) / 2 + o.size * 0.15;
    return { x0: o.x - rad, y0: o.y - rad, x1: o.x + rad, y1: o.y + rad };
  }

  function roundRect(ctx, x, y, w, h, rr) {
    ctx.beginPath();
    ctx.moveTo(x + rr, y); ctx.lineTo(x + w - rr, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr); ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr); ctx.quadraticCurveTo(x, y, x + rr, y); ctx.closePath();
  }

  function floaterHit(e) {
    if (!floater || !floater.el) return false;
    var r = floater.el.querySelector('.content').getBoundingClientRect();
    var m = 24;
    return e.clientX > r.left - m && e.clientX < r.right + m && e.clientY > r.top - m && e.clientY < r.bottom + m;
  }

  function objDown(e) {
    e.preventDefault();
    if (Date.now() - openedAt < 400) return;
    try { board.setPointerCapture(e.pointerId); } catch (err) {}
    objPtrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(objPtrs);
    if (ids.length === 1) {
      if (floater && floaterHit(e)) { startGesture(); return; }
      // Tapped somewhere else: stick the old one down and start a new one here.
      commitFloater();
      objPtrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var pt = toCanvas(e);
      if (state.tool === 'sticker') placeSticker(pt.x, pt.y);
      else startText(pt.x, pt.y);
      startGesture();
    } else if (floater) {
      startGesture();
    }
  }
  function startGesture() {
    if (!floater) { gesture = null; return; }
    var ids = Object.keys(objPtrs);
    var a = objPtrs[ids[0]], b = ids.length > 1 ? objPtrs[ids[1]] : null;
    gesture = { fx: floater.x, fy: floater.y, size: floater.size, rot: floater.rot,
      cx: b ? (a.x + b.x) / 2 : a.x, cy: b ? (a.y + b.y) / 2 : a.y,
      d: b ? Math.hypot(b.x - a.x, b.y - a.y) : 0, ang: b ? Math.atan2(b.y - a.y, b.x - a.x) : 0 };
  }
  function objMove(e) {
    e.preventDefault();
    objPtrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (!floater || !gesture) return;
    var ids = Object.keys(objPtrs);
    var a = objPtrs[ids[0]], b = ids.length > 1 ? objPtrs[ids[1]] : null;
    var k = W / board.clientWidth;
    var cx = b ? (a.x + b.x) / 2 : a.x, cy = b ? (a.y + b.y) / 2 : a.y;
    floater.x = Math.max(0, Math.min(W, gesture.fx + (cx - gesture.cx) * k));
    floater.y = Math.max(0, Math.min(H, gesture.fy + (cy - gesture.cy) * k));
    if (b && gesture.d > 0) {
      floater.size = Math.max(40, Math.min(700, gesture.size * Math.hypot(b.x - a.x, b.y - a.y) / gesture.d));
      floater.rot = gesture.rot + Math.atan2(b.y - a.y, b.x - a.x) - gesture.ang;
    }
    renderFloater();
  }
  function objUp(e) {
    delete objPtrs[e.pointerId];
    startGesture();
  }

  // ---------- Letters keyboard ----------
  var kbd = $('#kbd');
  var kbdMode = 'upper'; // 'upper' | 'lower' | 'nums'
  var LETTER_NAMES = { A: 'A', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'eff', G: 'jee', H: 'aitch', I: 'eye', J: 'jay',
    K: 'kay', L: 'ell', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'are', S: 'ess', T: 'tee', U: 'you', V: 'vee',
    W: 'double you', X: 'ex', Y: 'why', Z: 'zee' };

  function buildKeys() {
    var box = kbd.querySelector('.kbd-keys');
    box.innerHTML = '';
    var rows = kbdMode === 'nums'
      ? ['1234567890', '!?.,\'-+=', '♥★☺♪☀✿']
      : ['ABCDEFGHI', 'JKLMNOPQR', 'STUVWXYZ'];
    rows.forEach(function (row) {
      var r = document.createElement('div');
      r.className = 'kbd-row';
      row.split('').forEach(function (ch) {
        var label = kbdMode === 'lower' ? ch.toLowerCase() : ch;
        var b = document.createElement('button');
        b.className = 'key' + ('AEIOU'.indexOf(ch) >= 0 ? ' vowel' : '');
        b.textContent = label;
        b.addEventListener('pointerdown', function (e) { e.preventDefault(); typeChar(label, b); });
        r.appendChild(b);
      });
      box.appendChild(r);
    });
    kbd.querySelector('[data-act="case"]').textContent = kbdMode === 'lower' ? 'ABC' : 'abc';
    kbd.querySelector('[data-act="nums"]').textContent = kbdMode === 'nums' ? 'ABC' : '123';
    kbd.querySelectorAll('.key.style').forEach(function (b) { b.classList.toggle('on', b.dataset.act === state.textStyle); });
  }

  function typeChar(ch, keyEl) {
    if (!floater || floater.kind !== 'text') return;
    if (floater.text.length >= 24) return;
    floater.text += ch;
    renderFloater();
    pressAnim(keyEl);
    snd('letter', (floater.text.length - 1) % 10 / 9);
    var up = ch.toUpperCase();
    if (LETTER_NAMES[up]) say(LETTER_NAMES[up]);
    else if (/[0-9]/.test(ch)) say(ch);
  }
  function pressAnim(el) { if (!el) return; el.classList.add('down'); setTimeout(function () { el.classList.remove('down'); }, 120); }

  kbd.querySelectorAll('.kbd-row.bottom .key').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      pressAnim(b);
      var act = b.dataset.act;
      if (act === 'case') { kbdMode = kbdMode === 'lower' ? 'upper' : 'lower'; buildKeys(); snd('tap'); }
      else if (act === 'nums') { kbdMode = kbdMode === 'nums' ? 'upper' : 'nums'; buildKeys(); snd('tap'); }
      else if (act === 'solid' || act === 'hollow') {
        state.textStyle = act;
        if (floater && floater.kind === 'text') { floater.style = act; renderFloater(); }
        buildKeys(); snd('tap');
      }
      else if (act === 'space') { if (floater && floater.text && floater.text.slice(-1) !== ' ') { floater.text += ' '; renderFloater(); snd('tap'); } }
      else if (act === 'back') { if (floater && floater.text) { floater.text = floater.text.slice(0, -1); renderFloater(); snd('undo'); } }
      else if (act === 'say') { if (floater && floater.text.trim()) say(floater.text.toLowerCase()); }
      else if (act === 'done') { commitFloater(); }
    });
  });

  function openKeyboard() {
    kbdMode = kbdMode === 'nums' ? 'upper' : kbdMode;
    buildKeys();
    kbd.hidden = false;
    // Keep the word above the keyboard.
    requestAnimationFrame(function () {
      if (!floater) return;
      var kr = kbd.getBoundingClientRect(), br = board.getBoundingClientRect();
      var k = br.width / W;
      var sy = br.top + floater.y * k + floater.size * k * 0.7;
      if (sy > kr.top - 10) {
        floater.y = Math.max(floater.size * 0.6, (kr.top - 10 - br.top) / k - floater.size * 0.7);
        renderFloater();
      }
    });
  }
  function closeKeyboard() { kbd.hidden = true; }

  // Reads letters and words aloud with the iPad's built-in voice (works offline).
  function say(text) {
    if (!window.speechSynthesis || (window.Sound && Sound.muted)) return;
    try {
      speechSynthesis.cancel();
      // A list is spoken as separate phrases, one after another.
      [].concat(text).forEach(function (part) {
        var u = new SpeechSynthesisUtterance(part);
        u.lang = 'en-US'; u.rate = 0.85; u.pitch = 1.15;
        speechSynthesis.speak(u);
      });
    } catch (e) {}
  }

  // ---------- Watch it again ----------
  var replayRun = null;
  function startReplay() {
    commitFloater();
    if (!log.actions.length || replaying) return;
    var start = 0, fromBase = log.base;
    for (var i = log.actions.length - 1; i >= 0; i--) {
      if (log.actions[i].t === 'clear') { start = i + 1; fromBase = false; break; }
    }
    var acts = log.actions.slice(start);
    replaying = true;
    snd('magic');
    studio.classList.add('replaying');
    $('#replayBar').hidden = false;
    var saved = snapshot();
    var keep = { tool: state.tool, color: state.color, sizes: JSON.parse(JSON.stringify(state.sizes)), stamp: state.stamp, mirror: state.mirror, hue: state.hue };
    var total = 0;
    acts.forEach(function (a) { total += a.t === 'stroke' ? a.calls.length : 30; });
    var perFrame = Math.max(3, Math.ceil(total / (60 * 12))); // at most about 12 seconds
    var ai = 0, ci = 0, wait = 0, stopped = false;

    function finish() {
      if (stopped) return;
      stopped = true;
      if (active) { release(active.before); active = null; }
      resetCtx();
      pctx.drawImage(saved, 0, 0);
      release(saved);
      state.tool = keep.tool; state.color = keep.color; state.sizes = keep.sizes; state.stamp = keep.stamp; state.hue = keep.hue;
      setMirror(keep.mirror);
      replaying = false;
      studio.classList.remove('replaying');
      $('#replayBar').hidden = true;
      replayRun = null;
    }
    replayRun = finish;

    function step() {
      if (stopped) return;
      if (wait > 0) { wait--; return requestAnimationFrame(step); }
      var budget = perFrame;
      while (budget > 0 && ai < acts.length) {
        var a = acts[ai];
        if (a.t === 'stroke') {
          if (ci === 0) {
            state.tool = a.tool; state.color = a.color; state.sizes[a.tool] = a.size; state.stamp = a.stamp;
            state.mirror = a.mirror; state.hue = a.hue; seed = a.seed;
            var c0 = a.calls[0] || ['b', 0, 0];
            active = newActive(c0[1], c0[2]);
            beginStroke();
          }
          while (budget > 0 && ci < a.calls.length) {
            var c = a.calls[ci++];
            run(c[0], c.slice(1));
            budget--;
          }
          if (ci >= a.calls.length) { endStroke(); active = null; ai++; ci = 0; }
        } else {
          if (a.t === 'fill') { runFill(a, false); snd('fill'); }
          else if (a.t === 'obj') { drawObject(pctx, a.o); snd(a.o.kind === 'sticker' ? 'sticker' : 'stamp'); }
          else if (a.t === 'clear') clearPaint();
          ai++;
          wait = 12;
          break;
        }
      }
      if (ai >= acts.length) { setTimeout(finish, 900); return; }
      requestAnimationFrame(step);
    }

    clearPaint();
    var go = function () { requestAnimationFrame(step); };
    if (fromBase && state.page) {
      ArtStore.get(state.page.id + '::base').then(function (b) {
        if (!b) return go();
        var u = URL.createObjectURL(b);
        loadImage(u).then(function (im) { if (!stopped) pctx.drawImage(im, 0, 0, W, H); URL.revokeObjectURL(u); go(); }, go);
      }, go);
    } else {
      setTimeout(go, 300);
    }
  }

  // ---------- Buttons ----------
  document.querySelectorAll('.tool').forEach(function (b) {
    b.addEventListener('click', function () { setTool(b.dataset.tool); });
  });
  $('#homeBtn').addEventListener('click', goHome);
  $('#back').addEventListener('click', function () { snd('tap'); galleryCat = null; buildGallery(); });
  $('#undo').addEventListener('click', undo);
  $('#redo').addEventListener('click', redo);
  $('#mirror').addEventListener('click', function () {
    setMirror((state.mirror + 1) % 3);
    snd(state.mirror ? 'magic' : 'tap');
  });
  $('#replay').addEventListener('click', startReplay);
  $('#replayStop').addEventListener('click', function () { if (replayRun) replayRun(); });

  // Hold a button for a moment to use it; a tap just wiggles it.
  function holdButton(btn, ms, done) {
    var timer = null, fired = false;
    function start(e) {
      e.preventDefault();
      fired = false;
      btn.classList.add('holding');
      timer = setTimeout(function () { fired = true; btn.classList.remove('holding'); done(); }, ms);
    }
    function stop() {
      clearTimeout(timer);
      if (btn.classList.contains('holding') && !fired) {
        btn.classList.remove('wiggle'); void btn.offsetWidth; btn.classList.add('wiggle');
      }
      btn.classList.remove('holding');
    }
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
  }
  holdButton($('#save'), 700, function () { snd('save'); saveNow(); exportImage(); });
  holdButton($('#clear'), 1200, function () {
    commitFloater();
    var before = snapshot();
    clearPaint();
    pushHistory(before, { x: 0, y: 0, w: W, h: H }, { t: 'clear' });
    release(before);
    snd('clear');
    scheduleSave();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') saveNow();
  });

  // ---------- Background music ----------
  function showMusic() {
    var on = window.Sound && Sound.music;
    ['#musicHome', '#musicStudio'].forEach(function (id) { $(id).classList.toggle('is-off', !on); });
  }
  ['#musicHome', '#musicStudio'].forEach(function (id) {
    $(id).addEventListener('click', function () {
      if (!window.Sound) return;
      Sound.setMusic(!Sound.music);
      snd('tap');
      showMusic();
    });
  });
  showMusic();

  // ---------- Boot ----------
  buildPalette();
  loadMine().then(buildGallery, buildGallery);
  state.tool = null;
  setTool('crayon');
  setColor(state.color);
  renderStickerIcon();
  setMirror(0);
  booting = false;

  // Offline support when hosted; skipped on localhost so edits show up immediately.
  var devHost = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if ('serviceWorker' in navigator && window.isSecureContext && !devHost) {
    setupUpdates();
  }

  // ---------- Auto-update ----------
  // On launch (and whenever the app comes back to the front) ask the server for version.json.
  // Offline or no answer: carry on with the cached copy. Newer: download it in the background,
  // then switch over when it won't interrupt her: right away on the home screen, otherwise
  // when she goes back home or the app is put away (her drawing is saved first).
  function setupUpdates() {
    var sw = navigator.serviceWorker;
    var hadController = !!sw.controller;
    var reg = null, updateReady = false, reloading = false, lastCheck = 0;

    sw.register('sw.js').then(function (r) { reg = r; checkForUpdate(); }).catch(function () {});

    sw.addEventListener('controllerchange', function () {
      if (!hadController) { hadController = true; return; } // first install, nothing to swap
      updateReady = true;
      applyIfSafe();
    });

    function localVersion() {
      return caches.keys().then(function (keys) { return keys[0] || null; });
    }
    function remoteVersion() {
      return new Promise(function (resolve) {
        var t = setTimeout(function () { resolve(null); }, 6000);
        fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) {
          return r.ok ? r.json() : null;
        }).then(function (j) { clearTimeout(t); resolve(j && j.version); }, function () { clearTimeout(t); resolve(null); });
      });
    }
    function checkForUpdate() {
      if (!reg || updateReady || navigator.onLine === false) return;
      if (Date.now() - lastCheck < 60000) return;
      lastCheck = Date.now();
      Promise.all([localVersion(), remoteVersion()]).then(function (v) {
        if (v[0] && v[1] && v[0] !== v[1]) reg.update().catch(function () {});
      });
    }
    function applyIfSafe(hidden) {
      if (!updateReady || reloading) return;
      var busy = $('#busy');
      if (!busy.hidden) return; // a photo page is being made
      if (hidden) { reloading = true; saveNow().then(function () { location.reload(); }); return; }
      if (!home.hidden && studio.hidden) {
        reloading = true;
        busy.querySelector('p').textContent = 'New things are here!';
        busy.hidden = false;
        snd('magic');
        setTimeout(function () { location.reload(); }, 1200);
      }
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') checkForUpdate();
      else applyIfSafe(true);
    });
    window.addEventListener('online', checkForUpdate);
    window.__applyUpdateIfReady = applyIfSafe;
  }

  // Exposed for automated checks.
  window.__studio = { state: state, openPage: openPage, setTool: setTool, setColor: setColor, doFill: doFill,
    log: function () { return log; }, undo: undo, redo: redo, startReplay: startReplay, setMirror: setMirror,
    commitFloater: commitFloater, typeChar: typeChar, pageFor: pageFor, mine: function () { return mine; } };
})();
