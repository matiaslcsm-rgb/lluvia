// Sound synthesized with the Web Audio API: no audio files. Effects plus a soft rain in the background.
// The browser only lets sound start after a key press or click, so everything waits for the first one.
// M mutes and unmutes (remembered in this browser).
(function (L) {
  'use strict';
  var ac = null, master = null, rainGain = null, muted = false, last = {};
  try { muted = localStorage.getItem('lluvia.muted') === '1'; } catch (e) { /* storage blocked: start unmuted */ }

  function start() {
    if (ac) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ac.destination);
    startRain();
  }

  // Soft rain: looping noise through a low-pass filter.
  function startRain() {
    var len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = ac.createBufferSource();
    src.buffer = buf; src.loop = true;
    var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    rainGain = ac.createGain(); rainGain.gain.value = 0.07;
    src.connect(lp); lp.connect(rainGain); rainGain.connect(master);
    src.start();
  }

  function tone(type, f0, f1, dur, vol, delay) {
    var t = ac.currentTime + (delay || 0);
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, freq, delay) {
    var t = ac.currentTime + (delay || 0);
    var len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
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
    click: [0.05, function () { tone('sine', 700, 900, 0.04, 0.05); }]
  };

  L.sound = {
    play: function (name) {
      if (!ac || muted) return;
      var s = SOUNDS[name], now = ac.currentTime;
      if (!s || (last[name] && now - last[name] < s[0])) return;
      last[name] = now;
      s[1]();
    },
    toggle: function () {
      muted = !muted;
      try { localStorage.setItem('lluvia.muted', muted ? '1' : '0'); } catch (e) { /* not saved, fine */ }
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    muted: function () { return muted; }
  };

  addEventListener('keydown', start);
  addEventListener('pointerdown', start);
})(this.Lluvia = this.Lluvia || {});
