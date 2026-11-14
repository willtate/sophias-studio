/* Sophia's Studio – gentle synthesized sound effects (Web Audio only, works offline).
 *
 * window.Sound API:
 *   Sound.unlock()                 call from a user gesture (also auto-installed on document)
 *   Sound.play(name[, x])          one-shots: tap tool color fill stamp sticker undo clear save
 *                                  sparkle page magic letter (x = 0..1 picks letter pitch)
 *   Sound.brushStart(tool)         pencil crayon marker spray eraser glitter neon
 *   Sound.brushMove(speed)         speed ~ canvas px per ms (0 still, ~1 normal, 3+ fast)
 *   Sound.brushEnd()
 *   Sound.muted / Sound.setMuted(bool)   persisted in localStorage 'studio-muted'
 *
 * ES5 only; every call is a silent no-op if Web Audio is missing or not yet unlocked.
 */
(function () {
  'use strict';

  var AC = window.AudioContext || window.webkitAudioContext;
  var MASTER = 0.35;
  var MAX_VOICES = 6;

  var ctx = null, out = null;
  var voices = 0;
  var brush = null, stillTimer = null;
  var muted = false;
  try { muted = window.localStorage.getItem('studio-muted') === '1'; } catch (e) {}

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function noop() {}

  // ---------- shared building blocks ----------

  // Master chain: gain -> soft lowpass (no harsh highs) -> gentle limiter -> speakers.
  function buildOut(c) {
    var g = c.createGain();
    g.gain.value = muted ? 0 : MASTER;
    var lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 9000; lp.Q.value = 0.5;
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 6;
    comp.attack.value = 0.003; comp.release.value = 0.15;
    g.connect(lp); lp.connect(comp); comp.connect(c.destination);
    return g;
  }

  // Noise buffers are made once per context and reused.
  function buffers(c) {
    if (c._sndBufs) return c._sndBufs;
    var n = Math.floor(c.sampleRate * 2), i;
    var white = c.createBuffer(1, n, c.sampleRate), w = white.getChannelData(0);
    var brown = c.createBuffer(1, n, c.sampleRate), b = brown.getChannelData(0);
    var grain = c.createBuffer(1, n, c.sampleRate), gr = grain.getChannelData(0);
    var last = 0, amp = 0, left = 0;
    for (i = 0; i < n; i++) {
      var r = Math.random() * 2 - 1;
      w[i] = r;
      last = (last + 0.02 * r) / 1.02; b[i] = last * 3.5;
      // "grain": noise with a rough, randomly stepping amplitude = scratchy texture
      if (left-- <= 0) { left = 60 + Math.floor(Math.random() * 400); amp = Math.pow(Math.random(), 2); }
      gr[i] = r * amp;
    }
    // smooth the loop seam so looping noise never clicks
    var fade = 256;
    for (i = 0; i < fade; i++) {
      var k = i / fade;
      w[i] *= k; b[i] *= k; gr[i] *= k;
      w[n - 1 - i] *= k; b[n - 1 - i] *= k; gr[n - 1 - i] *= k;
    }
    c._sndBufs = { white: white, brown: brown, grain: grain };
    return c._sndBufs;
  }

  function cleanup(nodes) {
    return function () {
      for (var i = 0; i < nodes.length; i++) { try { nodes[i].disconnect(); } catch (e) {} }
    };
  }

  // Simple oscillator voice. o: {type, f, f2, glide, a, d, g, delay}
  function tone(c, dest, t, o) {
    t += o.delay || 0;
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glide || o.d));
    var a = o.a || 0.005, end = t + a + o.d;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.g, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(end + 0.02);
    osc.onended = cleanup([osc, g]);
    return osc;
  }

  // Filtered noise burst. o: {buf, ft, f, f2, q, a, d, g, delay}
  function noise(c, dest, t, o) {
    t += o.delay || 0;
    var src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buffers(c)[o.buf || 'white'];
    f.type = o.ft || 'bandpass';
    f.frequency.setValueAtTime(o.f, t);
    var a = o.a || 0.005, end = t + a + o.d;
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, end);
    f.Q.value = o.q || 1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.g, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t, rnd(0, 1.2)); src.stop(end + 0.02);
    src.onended = cleanup([src, f, g]);
  }

  // C-major pentatonic, two octaves from C5: always sounds nice in any order.
  var PENTA = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5, 1568, 1760];

  function chime(c, dest, t, f, g, d, delay) {
    tone(c, dest, t, { f: f, a: 0.004, d: d, g: g, delay: delay });
    tone(c, dest, t, { f: f * 2.01, a: 0.003, d: d * 0.35, g: g * 0.18, delay: delay });
  }

  // ---------- one-shot sounds: each returns its length in seconds ----------
  var SYNTH = {
    tap: function (c, o, t) {
      tone(c, o, t, { type: 'triangle', f: 720, f2: 480, d: 0.06, g: 0.45 });
      return 0.08;
    },
    tool: function (c, o, t) { // little wooden block
      tone(c, o, t, { f: 640, f2: 600, a: 0.002, d: 0.09, g: 0.45 });
      tone(c, o, t, { f: 1720, a: 0.001, d: 0.03, g: 0.12 });
      noise(c, o, t, { ft: 'bandpass', f: 1300, q: 3, a: 0.001, d: 0.015, g: 0.35 });
      return 0.11;
    },
    color: function (c, o, t) { // bubbly blip
      var k = rnd(0.88, 1.15);
      tone(c, o, t, { f: 380 * k, f2: 900 * k, glide: 0.07, a: 0.006, d: 0.1, g: 0.5 });
      tone(c, o, t, { f: 760 * k, f2: 1500 * k, glide: 0.05, a: 0.004, d: 0.05, g: 0.08, delay: 0.035 });
      return 0.15;
    },
    fill: function (c, o, t) { // liquid bloop + sploosh
      tone(c, o, t, { f: 170, f2: 480, glide: 0.1, a: 0.008, d: 0.2, g: 0.5 });
      tone(c, o, t, { f: 300, f2: 760, glide: 0.07, a: 0.006, d: 0.11, g: 0.22, delay: 0.09 });
      tone(c, o, t, { f: 420, f2: 1000, glide: 0.06, a: 0.005, d: 0.08, g: 0.12, delay: 0.17 });
      noise(c, o, t, { buf: 'white', ft: 'lowpass', f: 2200, f2: 280, q: 2, a: 0.02, d: 0.33, g: 0.45 });
      return 0.38;
    },
    stamp: function (c, o, t) { // bouncy boing + pop
      var osc = tone(c, o, t, { f: 210, f2: 330, glide: 0.35, a: 0.006, d: 0.38, g: 0.42 });
      var lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 15;
      lg.gain.setValueAtTime(55, t);
      lg.gain.exponentialRampToValueAtTime(1, t + 0.38);
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t); lfo.stop(t + 0.42);
      lfo.onended = cleanup([lfo, lg]);
      noise(c, o, t, { ft: 'bandpass', f: 1400, q: 1.5, a: 0.001, d: 0.04, g: 0.55 });
      tone(c, o, t, { f: 620, f2: 200, a: 0.001, d: 0.05, g: 0.2 });
      return 0.44;
    },
    sticker: function (c, o, t) { // paper peel ... slap
      noise(c, o, t, { ft: 'bandpass', f: 2600, f2: 1300, q: 1.2, a: 0.1, d: 0.03, g: 0.4 });
      noise(c, o, t, { buf: 'grain', ft: 'highpass', f: 1800, q: 0.7, a: 0.09, d: 0.03, g: 0.25 });
      noise(c, o, t, { ft: 'lowpass', f: 900, q: 0.8, a: 0.002, d: 0.06, g: 0.7, delay: 0.15 });
      tone(c, o, t, { f: 170, f2: 80, a: 0.002, d: 0.08, g: 0.35, delay: 0.15 });
      return 0.26;
    },
    undo: function (c, o, t) { // reverse whoosh
      noise(c, o, t, { ft: 'bandpass', f: 500, f2: 2400, q: 1.3, a: 0.16, d: 0.04, g: 0.6 });
      tone(c, o, t, { type: 'triangle', f: 330, f2: 560, glide: 0.18, a: 0.15, d: 0.04, g: 0.1 });
      return 0.22;
    },
    clear: function (c, o, t) { // crumple, then whoosh down
      for (var i = 0; i < 7; i++) {
        noise(c, o, t, { buf: 'grain', ft: 'bandpass', f: rnd(1200, 3200), q: 2, a: 0.002, d: 0.035, g: 0.5, delay: rnd(0, 0.24) });
      }
      noise(c, o, t, { ft: 'bandpass', f: 2200, f2: 240, q: 1.1, a: 0.06, d: 0.5, g: 0.55, delay: 0.12 });
      tone(c, o, t, { f: 480, f2: 170, a: 0.05, d: 0.4, g: 0.1, delay: 0.15 });
      return 0.7;
    },
    save: function (c, o, t) { // soft shutter + sparkle chime
      noise(c, o, t, { ft: 'bandpass', f: 1800, q: 2, a: 0.001, d: 0.025, g: 0.6 });
      tone(c, o, t, { f: 300, f2: 180, a: 0.001, d: 0.03, g: 0.2 });
      noise(c, o, t, { ft: 'bandpass', f: 1400, q: 2, a: 0.001, d: 0.03, g: 0.5, delay: 0.075 });
      var notes = [1046.5, 1318.5, 1568, 2093];
      for (var i = 0; i < notes.length; i++) chime(c, o, t, notes[i], 0.16, 0.35, 0.16 + i * 0.06);
      return 0.75;
    },
    sparkle: function (c, o, t) { // twinkly glissando
      var start = Math.floor(rnd(3, 6));
      for (var i = 0; i < 6; i++) {
        var f = PENTA[start + i] || PENTA[PENTA.length - 1] * 1.12;
        chime(c, o, t, f * 1, 0.11, 0.2, i * 0.035 + rnd(0, 0.01));
      }
      return 0.45;
    },
    page: function (c, o, t) { // soft page flip + chime
      noise(c, o, t, { ft: 'bandpass', f: 900, f2: 2600, q: 0.9, a: 0.09, d: 0.12, g: 0.4 });
      chime(c, o, t, 784, 0.16, 0.4, 0.13);
      chime(c, o, t, 1174.7, 0.11, 0.4, 0.19);
      return 0.62;
    },
    magic: function (c, o, t) { // rising chime arpeggio with a soft shimmer
      var notes = [523.3, 659.3, 784, 1046.5, 1318.5];
      for (var i = 0; i < notes.length; i++) chime(c, o, t, notes[i], 0.15, 0.45, i * 0.07);
      noise(c, o, t, { ft: 'bandpass', f: 3000, f2: 5000, q: 2, a: 0.2, d: 0.3, g: 0.12 });
      return 0.8;
    },
    letter: function (c, o, t, x) { // soft xylophone note
      var p = typeof x === 'number' && isFinite(x) ? clamp(x, 0, 1) : Math.random();
      var f = PENTA[Math.round(p * (PENTA.length - 1))];
      tone(c, o, t, { f: f, a: 0.002, d: 0.35, g: 0.48 });
      tone(c, o, t, { f: f * 3.0, a: 0.001, d: 0.05, g: 0.05 });
      noise(c, o, t, { ft: 'bandpass', f: f * 2, q: 4, a: 0.001, d: 0.01, g: 0.15 });
      return 0.37;
    }
  };

  // ---------- continuous brush sounds ----------
  // filters: [type, freq when slow, freq when fast, Q]
  var BRUSHES = {
    crayon:  { buf: 'grain', vol: 0.75, filters: [['highpass', 700, 1100, 0.5], ['lowpass', 2200, 4200, 0.8]] },
    pencil:  { buf: 'grain', vol: 0.45, filters: [['highpass', 2200, 3000, 0.5], ['lowpass', 4500, 6500, 0.7]] },
    marker:  { buf: 'white', vol: 0.6,  filters: [['bandpass', 800, 1300, 2.5]], squeak: true },
    spray:   { buf: 'white', vol: 0.32, filters: [['highpass', 1800, 2400, 0.6], ['lowpass', 5000, 7000, 0.6]], floor: 0.45 },
    eraser:  { buf: 'brown', vol: 0.7,  filters: [['lowpass', 300, 800, 2]] },
    glitter: { buf: 'white', vol: 0.16, filters: [['highpass', 3500, 4200, 0.6], ['lowpass', 6500, 8000, 0.6]], pings: true },
    neon:    { buf: null,    vol: 0.22, filters: [['lowpass', 450, 1200, 3]], hum: true }
  };

  function Brush(c, dest, tool) {
    var p = BRUSHES[tool], t = c.currentTime, i;
    this.c = c; this.p = p; this.dest = dest; this.lastPing = 0; this.dead = false;
    this.nodes = []; this.srcs = []; this.filters = [];
    var g = this.g = c.createGain();
    g.gain.value = 0;
    g.connect(dest);
    var chainIn = g;
    for (i = p.filters.length - 1; i >= 0; i--) {
      var spec = p.filters[i], f = c.createBiquadFilter();
      f.type = spec[0]; f.frequency.value = spec[1]; f.Q.value = spec[3];
      f.connect(chainIn); chainIn = f;
      this.filters.unshift(f); this.nodes.push(f);
    }
    if (p.buf) {
      var src = c.createBufferSource();
      src.buffer = buffers(c)[p.buf]; src.loop = true;
      src.connect(chainIn); src.start(t, rnd(0, 1.5));
      this.srcs.push(src);
    }
    if (p.hum) { // two slightly detuned saws = soft electric hum, plus a faint buzz
      for (i = 0; i < 2; i++) {
        var o = c.createOscillator();
        o.type = 'sawtooth'; o.frequency.value = i ? 110.6 : 110;
        o.connect(chainIn); o.start(t); this.srcs.push(o);
      }
      var bz = c.createBufferSource(), bf = c.createBiquadFilter(), bg = c.createGain();
      bz.buffer = buffers(c).white; bz.loop = true;
      bf.type = 'bandpass'; bf.frequency.value = 2500; bf.Q.value = 3; bg.gain.value = 0.08;
      bz.connect(bf); bf.connect(bg); bg.connect(g); bz.start(t);
      this.srcs.push(bz); this.nodes.push(bf, bg);
    }
    if (p.squeak) { // faint felt squeak riding on the stroke speed
      var sq = c.createOscillator(), sg = this.sq = c.createGain();
      sq.type = 'triangle'; sq.frequency.value = 900;
      sg.gain.value = 0;
      sq.connect(sg); sg.connect(dest); sq.start(t);
      this.sqOsc = sq; this.srcs.push(sq); this.nodes.push(sg);
    }
  }

  // level 0..1 at audio time t (smoothed, never jumps)
  Brush.prototype.set = function (level, t) {
    if (this.dead) return;
    var p = this.p, i;
    var tc = level > this.level ? 0.04 : 0.07;
    this.level = level;
    var floor = p.floor || 0;
    this.g.gain.setTargetAtTime(p.vol * (floor + (1 - floor) * level), t, tc);
    for (i = 0; i < this.filters.length; i++) {
      var s = p.filters[i];
      this.filters[i].frequency.setTargetAtTime(s[1] + (s[2] - s[1]) * level, t, 0.06);
    }
    if (this.sq) {
      this.sq.gain.setTargetAtTime(0.035 * level * level, t, 0.06);
      this.sqOsc.frequency.setTargetAtTime(850 + 350 * level + rnd(-40, 40), t, 0.05);
    }
    if (p.pings && level > 0.15 && t - this.lastPing > 0.07 && Math.random() < 0.55 * level) {
      this.lastPing = t;
      chime(this.c, this.dest, t, PENTA[5 + Math.floor(Math.random() * 5)] * 1.5, 0.07, 0.12, 0);
    }
  };
  Brush.prototype.level = 0;

  Brush.prototype.stop = function (t) {
    if (this.dead) return;
    this.dead = true;
    this.g.gain.setTargetAtTime(0, t, 0.05);
    if (this.sq) this.sq.gain.setTargetAtTime(0, t, 0.03);
    var all = this.srcs.concat(this.nodes, [this.g]);
    for (var i = 0; i < this.srcs.length; i++) this.srcs[i].stop(t + 0.45);
    this.srcs[0].onended = cleanup(all);
  };

  // ---------- context / unlock ----------
  function ready() { return !!(ctx && out); }

  function unlock() {
    if (!AC) return;
    try {
      if (!ctx) {
        ctx = new AC();
        out = buildOut(ctx);
        buffers(ctx);
      }
      if (ctx.state !== 'running' && ctx.resume) {
        var pr = ctx.resume();
        if (pr && pr.then) pr.then(noop, noop);
      }
      if (!ctx._sndPrimed || ctx.state !== 'running') {
        ctx._sndPrimed = true;
        var b = ctx.createBufferSource();
        b.buffer = ctx.createBuffer(1, 1, 22050);
        b.connect(ctx.destination);
        b.start(0);
        b.onended = cleanup([b]);
      }
    } catch (e) {}
  }

  // Auto-unlock on gestures (capture phase, so it runs before the app's own handlers).
  // Listeners stay installed but return immediately once audio is running, so iOS
  // interruptions (calls, app switching) recover on the next tap.
  function onGesture() {
    if (ctx && ctx.state === 'running') return;
    unlock();
  }
  try {
    var evs = ['pointerup', 'touchend', 'click', 'keydown'];
    for (var ei = 0; ei < evs.length; ei++) document.addEventListener(evs[ei], onGesture, true);
  } catch (e) {}

  function play(name, x) {
    try {
      if (muted || !ready() || ctx.state !== 'running') return;
      var fn = SYNTH[name];
      if (!fn || voices >= MAX_VOICES) return;
      voices++;
      var dur = fn(ctx, out, ctx.currentTime + 0.005, x);
      setTimeout(function () { voices--; }, (dur || 0.5) * 1000 + 60);
    } catch (e) {}
  }

  function brushEnd() {
    try {
      clearTimeout(stillTimer);
      if (brush) { brush.stop(ctx.currentTime); brush = null; }
    } catch (e) { brush = null; }
  }

  function brushStart(tool) {
    try {
      brushEnd();
      if (muted || !ready() || ctx.state !== 'running' || !BRUSHES[tool]) return;
      brush = new Brush(ctx, out, tool);
      brush.set(0, ctx.currentTime);
    } catch (e) { brush = null; }
  }

  function brushMove(speed) {
    try {
      if (!brush) return;
      var s = +speed;
      if (!(s > 0)) s = 0;
      var level = Math.min(1, Math.pow(s / 2, 0.7));
      brush.set(level, ctx.currentTime);
      // pointermove stops firing when the finger rests: fade to silence on our own
      clearTimeout(stillTimer);
      stillTimer = setTimeout(function () {
        try { if (brush) brush.set(0, ctx.currentTime); } catch (e) {}
      }, 90);
    } catch (e) {}
  }

  function setMuted(m) {
    muted = !!m;
    try { window.localStorage.setItem('studio-muted', muted ? '1' : '0'); } catch (e) {}
    try {
      if (muted) brushEnd();
      if (ready()) out.gain.setTargetAtTime(muted ? 0 : MASTER, ctx.currentTime, 0.03);
    } catch (e) {}
  }

  // ---------- background music ----------
  // A quiet music-box lullaby in 3/4, written for this app. It's scheduled a little ahead
  // of time on the audio clock, pauses while the app is put away, and dips while the
  // voice is talking. Every second time round the tune is played softer and rounder,
  // and there's a short rest between rounds so it never feels like it's nagging.
  var musicOn = true;
  try { musicOn = window.localStorage.getItem('studio-music') !== '0'; } catch (e) {}
  var MUSIC_VOL = 0.42, BEAT = 0.72; // 83 beats a minute
  var musicBus = null, musicTimer = null, musicNext = 0, musicStep = 0, musicRound = 0;

  // Chords for each bar: [bass, chord notes for beats 2 and 3] (MIDI numbers).
  var CH = {
    C: [48, [60, 64, 67]], Am: [45, [60, 64, 69]], F: [41, [60, 65, 69]], G: [43, [59, 62, 67]],
    Em: [40, [59, 64, 67]], Dm: [38, [62, 65, 69]]
  };
  // 16 bars: chord, then melody notes as [midi, beat, length in beats].
  var TUNE = [
    ['C',  [[76, 0, 1], [79, 1, 1], [84, 2, 1]]],
    ['Am', [[83, 0, 2], [81, 2, 1]]],
    ['F',  [[81, 0, 1], [77, 1, 1], [81, 2, 1]]],
    ['G',  [[79, 0, 3]]],
    ['C',  [[76, 0, 1], [79, 1, 1], [84, 2, 1]]],
    ['Em', [[83, 0, 1], [86, 1, 1], [83, 2, 1]]],
    ['F',  [[81, 0, 1], [79, 1, 1], [77, 2, 1]]],
    ['C',  [[76, 0, 2], [72, 2, 1]]],
    ['F',  [[81, 0, 1], [84, 1, 1], [81, 2, 1]]],
    ['C',  [[79, 0, 2], [76, 2, 1]]],
    ['Dm', [[77, 0, 1], [81, 1, 1], [86, 2, 1]]],
    ['G',  [[84, 0, 2], [83, 2, 1]]],
    ['Am', [[84, 0, 1], [83, 1, 1], [81, 2, 1]]],
    ['F',  [[81, 0, 1], [79, 1, 1], [77, 2, 1]]],
    ['G',  [[74, 0, 1], [79, 1, 1], [83, 2, 1]]],
    ['C',  [[84, 0, 3]]]
  ];
  var REST_BARS = 3;

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // Music box: a sine with a quiet bright overtone and a quick, ringing decay.
  function box(t, m, g, len) {
    var f = hz(m), d = Math.max(0.5, len * BEAT * 1.6);
    tone(ctx, musicBus, t, { f: f, a: 0.004, d: d, g: g });
    tone(ctx, musicBus, t, { f: f * 3, a: 0.002, d: d * 0.18, g: g * 0.12 });
  }
  // Soft round voice for the gentler rounds.
  function flute(t, m, g, len) {
    tone(ctx, musicBus, t, { f: hz(m), a: 0.08, d: len * BEAT * 1.1, g: g });
  }

  function scheduleBar(t, bar, round) {
    var b = TUNE[bar], ch = CH[b[0]], soft = round % 2 === 1, i, n;
    // oom-pah-pah: low note on beat 1, the chord softly on beats 2 and 3
    tone(ctx, musicBus, t, { type: 'triangle', f: hz(ch[0]), a: 0.02, d: BEAT * 2.4, g: 0.16 });
    for (var beat = 1; beat < 3; beat++) {
      for (i = 0; i < ch[1].length; i++) box(t + beat * BEAT + i * 0.012, ch[1][i], 0.035, 0.6);
    }
    for (i = 0; i < b[1].length; i++) {
      n = b[1][i];
      var at = t + n[1] * BEAT + rnd(-0.008, 0.008);
      if (soft) flute(at, n[0] - 12, 0.1, n[2]);
      else box(at, n[0], 0.13, n[2]);
    }
    if (bar === TUNE.length - 1) { // little sparkle to finish
      for (i = 0; i < 4; i++) box(t + BEAT * 1.5 + i * 0.09, [84, 88, 91, 96][i], 0.04, 0.5);
    }
  }

  function musicTick() {
    try {
      if (!musicOn || !ready() || ctx.state !== 'running' || document.hidden) { musicNext = 0; return; }
      var now = ctx.currentTime;
      ensureBus();
      // speak over the music: dip it while the voice is talking
      var talking = window.speechSynthesis && speechSynthesis.speaking;
      musicBus.gain.setTargetAtTime(MUSIC_VOL * (talking ? 0.3 : 1), now, talking ? 0.08 : 0.6);
      if (!musicNext || musicNext < now) { musicNext = now + 0.25; } // (re)start cleanly
      while (musicNext < now + 1.2) {
        var steps = TUNE.length + REST_BARS;
        if (musicStep < TUNE.length) scheduleBar(musicNext, musicStep, musicRound);
        musicNext += BEAT * 3;
        musicStep++;
        if (musicStep >= steps) { musicStep = 0; musicRound++; }
      }
    } catch (e) {}
  }

  function ensureBus() {
    if (musicBus) return;
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    var lp = ctx.createBiquadFilter(); // far away and soft: no sparkly highs
    lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 0.3;
    musicBus.connect(lp); lp.connect(out);
  }

  function startMusic() {
    if (!musicTimer) musicTimer = setInterval(musicTick, 250);
    musicTick();
  }

  function setMusic(on) {
    musicOn = !!on;
    try { window.localStorage.setItem('studio-music', musicOn ? '1' : '0'); } catch (e) {}
    if (musicOn) { musicStep = 0; musicNext = 0; startMusic(); }
    else {
      clearInterval(musicTimer); musicTimer = null; musicNext = 0;
      try { if (musicBus) musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.15); } catch (e) {}
      // notes already scheduled are faded out with the bus, then a fresh bus is made next time
      var old = musicBus; musicBus = null;
      setTimeout(function () { try { old && old.disconnect(); } catch (e) {} }, 1500);
    }
  }

  // The first tap anywhere unlocks audio; start the music as soon as it's allowed.
  try {
    document.addEventListener('pointerup', function () { if (musicOn && !musicTimer) setTimeout(startMusic, 50); }, true);
  } catch (e) {}

  var Sound = {
    unlock: unlock,
    setMusic: setMusic,
    play: play,
    brushStart: brushStart,
    brushMove: brushMove,
    brushEnd: brushEnd,
    setMuted: setMuted
  };
  try {
    Object.defineProperty(Sound, 'muted', { get: function () { return muted; }, enumerable: true });
    Object.defineProperty(Sound, 'music', { get: function () { return musicOn; }, enumerable: true });
  } catch (e) { Sound.muted = muted; }

  window.Sound = Sound;
})();
