// Sound synthesized with the Web Audio API: no audio files. Effects plus a soft rain in the background.
// The browser only lets sound start after a key press or click, so everything waits for the first one.
// M mutes and unmutes (remembered in this browser).
(function (L) {
  'use strict';
  var ac = null, master = null, rainGain = null, muted = false, last = {}, volume = 0.5, amp = 1, rainLevel = 1;
  var out = null, src = null; // where this sound goes (a panner to its side, or the master); where it comes from
  try {
    muted = localStorage.getItem('lluvia.muted') === '1';
    var v = parseFloat(localStorage.getItem('lluvia.volume'));
    if (v >= 0 && v <= 1) volume = v;
  } catch (e) { /* storage blocked: defaults */ }

  function start() {
    if (ac) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : volume;
    master.connect(ac.destination);
    out = master;
    startRain();
  }

  // Soft rain: looping noise through a low-pass filter.
  function startRain() {
    var len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = ac.createBufferSource();
    src.buffer = buf; src.loop = true;
    var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    rainGain = ac.createGain(); rainGain.gain.value = 0.07 * rainLevel;
    src.connect(lp); lp.connect(rainGain); rainGain.connect(master);
    src.start();
  }

  function tone(type, f0, f1, dur, vol, delay) {
    var t = ac.currentTime + (delay || 0);
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol * amp, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.02);
  }

  // A burst of noise through a filter (low-pass by default; `type` 'bandpass' or 'highpass' for other textures).
  function noise(dur, vol, freq, delay, type) {
    var t = ac.currentTime + (delay || 0);
    var len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; f.type = type || 'lowpass'; f.frequency.value = freq; g.gain.value = vol * amp;
    src.connect(f); f.connect(g); g.connect(out);
    src.start(t);
  }

  function notes(list, type, step, vol) {
    list.forEach(function (f, i) { tone(type, f, f, step * 1.6, vol, i * step); });
  }

  // name -> [minimum gap in seconds, how it sounds]
  var SOUNDS = {
    shot: [0.07, function () { tone('square', 900, 500, 0.05, 0.03); }],
    kill: [0.035, function () { tone('sine', 320 + Math.random() * 80, 110, 0.07, 0.07); }],
    gem: [0.04, function () { tone('triangle', 1300 + Math.random() * 300, 1600, 0.04, 0.04); }],
    level: [0.2, function () { notes([523, 659, 784, 1047], 'triangle', 0.07, 0.12); }],
    chest: [0.1, function () { notes([660, 880, 1100], 'square', 0.05, 0.06); }],
    legendary: [0.2, function () { notes([784, 988, 1175, 1568, 1976], 'triangle', 0.06, 0.12); }],
    elite: [0.1, function () { notes([440, 660], 'square', 0.05, 0.07); }],
    ulti: [0.2, function () { noise(0.5, 0.3, 1800); tone('sawtooth', 160, 50, 0.5, 0.15); }],
    boom: [0.08, function () { noise(0.3, 0.25, 700); }],
    spit: [0.12, function () { noise(0.08, 0.06, 2500); }],
    lifeLost: [0.3, function () { tone('sawtooth', 420, 70, 0.6, 0.15); }],
    boss: [0.5, function () { tone('sawtooth', 110, 110, 0.5, 0.15); tone('sawtooth', 82, 82, 0.7, 0.15, 0.45); }],
    bossDown: [0.5, function () { noise(0.8, 0.3, 900); notes([392, 523, 659, 784], 'triangle', 0.09, 0.12); }],
    duel: [0.5, function () { notes([392, 392, 523, 659], 'sawtooth', 0.12, 0.09); }],
    bet: [0.06, function () { tone('sine', 1800, 1800, 0.06, 0.06); tone('sine', 2400, 2400, 0.08, 0.05, 0.05); }],
    win: [1, function () { notes([523, 659, 784, 1047, 784, 1047, 1319], 'triangle', 0.11, 0.13); }],
    lose: [1, function () { notes([392, 330, 262, 196], 'triangle', 0.16, 0.12); }],
    click: [0.05, function () { tone('sine', 700, 900, 0.04, 0.05); }],
    // The city (Darkwood + Zomboid): the gun, bullets, steps, zombies, blows.
    gun: [0.06, function () { noise(0.14, 0.45, 2600); noise(0.3, 0.25, 500, 0.01); tone('square', 160, 50, 0.12, 0.08); }],
    reload: [0.3, function () { noise(0.03, 0.18, 4000, 0, 'highpass'); noise(0.04, 0.22, 3000, 0.28, 'highpass'); tone('square', 900, 700, 0.03, 0.03, 0.3); }],
    empty: [0.25, function () { noise(0.02, 0.16, 5000, 0, 'highpass'); }],
    bodyhit: [0.05, function () { noise(0.08, 0.22, 450); tone('sine', 120, 70, 0.08, 0.08); }],
    headshot: [0.05, function () { noise(0.1, 0.3, 900); noise(0.05, 0.15, 3000, 0.02, 'bandpass'); tone('sine', 90, 40, 0.12, 0.12); }],
    step: [0.18, function () { noise(0.05, 0.08, 600); }],
    zstep: [0.12, function () { noise(0.12, 0.06, 380); noise(0.08, 0.035, 900, 0.07, 'bandpass'); }],
    groan: [0.6, function () {
      var f = 70 + Math.random() * 40;
      tone('sawtooth', f, f * 0.7, 0.9, 0.05); tone('sawtooth', f * 1.5, f * 1.1, 0.7, 0.025, 0.1); noise(0.6, 0.04, 400);
    }],
    swing: [0.08, function () { noise(0.16, 0.12, 1200, 0, 'bandpass'); }],
    blow: [0.06, function () { noise(0.07, 0.3, 350); tone('sine', 140, 60, 0.09, 0.1); }],
    shove: [0.2, function () { noise(0.12, 0.18, 300); }],
    break: [0.2, function () { noise(0.2, 0.3, 2000, 0, 'highpass'); noise(0.15, 0.2, 600, 0.03); }],
    rummage: [0.35, function () { for (var i = 0; i < 4; i++) noise(0.05, 0.06, 1500 + Math.random() * 1500, i * 0.08, 'bandpass'); }],
    craft: [0.2, function () { noise(0.05, 0.15, 800); noise(0.05, 0.15, 1200, 0.12); }],
    glass: [0.1, function () { noise(0.25, 0.35, 4500, 0, 'highpass'); noise(0.6, 0.2, 600, 0.05); }],
    skill: [0.3, function () { notes([392, 523], 'triangle', 0.09, 0.07); }],
    thunder: [1, function () { noise(0.15, 0.5, 3000, 0, 'highpass'); noise(2.5, 0.45, 160, 0.1); noise(1.8, 0.3, 90, 0.5); }]
  };

  L.sound = {
    // `k`: how loud this time (0-1, for something far away). `pan`: from which side (-1 left, 1 right).
    // In the city, a sound set with `from` is heard from where it happened (js/senses.js L.soundPlace, stage 63):
    // quieter the farther, louder on its side, muffled behind a wall.
    play: function (name, k, pan) {
      if (!ac || muted) return;
      var s = SOUNDS[name], now = ac.currentTime, g = L.currentGame && L.currentGame();
      if (!s) return;
      k = k === undefined ? 1 : k;
      if (src && g && g.night && g.player && L.soundPlace) {
        var sp = L.soundPlace(g, src.x, src.y);
        k *= sp.vol; pan = sp.pan;
        if (k < 0.02) return;
      }
      if (last[name] && now - last[name] < s[0]) return;
      last[name] = now;
      amp = Math.max(0, Math.min(1, k));
      if (pan && ac.createStereoPanner) { out = ac.createStereoPanner(); out.pan.value = pan; out.connect(master); }
      s[1]();
      amp = 1; out = master;
    },
    // Where the next sounds come from (world px), or null for "here" (menus, your own things).
    from: function (x, y) { src = x === null || x === undefined ? null : { x: x, y: y }; },
    // How much rain is heard (0 none, 1 the old soft rain). The city has no rain until the weather comes.
    rain: function (level) { rainLevel = level; if (rainGain) rainGain.gain.value = 0.07 * level; },
    toggle: function () {
      muted = !muted;
      try { localStorage.setItem('lluvia.muted', muted ? '1' : '0'); } catch (e) { /* not saved, fine */ }
      if (master) master.gain.value = muted ? 0 : volume;
      return muted;
    },
    volume: function () { return volume; },
    setVolume: function (v) {
      volume = Math.max(0, Math.min(1, Math.round(v * 10) / 10));
      try { localStorage.setItem('lluvia.volume', String(volume)); } catch (e) { /* not saved */ }
      if (master && !muted) master.gain.value = volume;
      return volume;
    },
    muted: function () { return muted; }
  };

  addEventListener('keydown', start);
  addEventListener('pointerdown', start);
})(this.Lluvia = this.Lluvia || {});
