// The collective conscience (data/morale.js, stage 73). g.morale: { 'cx,cy': morale } only for the zones where
// something happened (the rest are at `base`). Low morale brings more zombies, wears the sanity of the people
// living there, and at night voices and shadows (g.omens, drawn by js/view/render.js).
(function (L) {
  'use strict';

  function D() { return L.data.morale; }
  function key(g, x, y) { var c = D().cell * g.city.scale; return Math.floor(x / c) + ',' + Math.floor(y / c); }
  L.moraleKey = key;
  L.moraleAt = function (g, x, y) {
    if (!g.morale || !g.city) return D().base;
    var v = g.morale[key(g, x, y)];
    return v === undefined ? D().base : v;
  };
  L.moraleChange = function (g, x, y, dv) {
    if (!g.city || !dv || !g.refuge) return; // only the real game keeps it
    g.morale = g.morale || {};
    var k = key(g, x, y), v = L.moraleAt(g, x, y);
    g.morale[k] = Math.max(0, Math.min(100, v + dv));
  };
  L.moraleEvent = function (g, x, y, what) { L.moraleChange(g, x, y, D().events[what]); };
  L.moraleWord = function (v) { var M = D(); return v < M.cursed ? M.words.cursed : v < M.low ? M.words.low : M.words.calm; };
  // How much lower than `low` (0: not low at all, 1: morale 0).
  function depth(v) { return Math.max(0, (D().low - v) / D().low); }
  L.moraleDepth = function (g, x, y) { return depth(L.moraleAt(g, x, y)); };
  // More zombies where you are (js/game.js multiplies the spawning by this).
  L.moraleMul = function (g) { return g.morale ? 1 + (D().zombies - 1) * depth(L.moraleAt(g, g.player.x, g.player.y)) : 1; };

  // A new day (js/people.js): zones drift back toward `base`; the people in low zones lose sanity.
  L.moraleDay = function (g) {
    var M = D();
    Object.keys(g.morale || {}).forEach(function (k) {
      var v = g.morale[k], d = M.base - v;
      v += Math.sign(d) * Math.min(Math.abs(d), M.drift);
      if (Math.abs(v - M.base) < 0.01) delete g.morale[k]; else g.morale[k] = v;
    });
    (g.people || []).forEach(function (q) {
      if (q.dead || q.hostile || q.mode === 'travel' || !L.changeSanity) return;
      var dp = L.moraleDepth(g, q.x, q.y);
      if (dp > 0) L.changeSanity(q, -M.sanity * dp, g);
    });
  };

  // Each frame: at night in a low zone, now and then a voice or a shadow.
  L.updateMorale = function (g, dt) {
    if (!g.morale || !g.refuge) return;
    var M = D(), p = g.player, dp = L.moraleDepth(g, p.x, p.y), dark = L.clockOf(g).light < 0.5;
    g.omens = (g.omens || []).filter(function (o) { o.t -= dt; return o.t > 0; });
    if (!dark || dp <= 0) return;
    g.omenT = (g.omenT === undefined ? M.omens.every : g.omenT) - dt * (0.5 + dp);
    if (g.omenT > 0) return;
    g.omenT = M.omens.every * (0.6 + g.rng() * 0.8);
    g.omenN = (g.omenN || 0) + 1; // how many so far
    var s = g.city.scale, a = g.rng() * Math.PI * 2, d = (6 + g.rng() * 6) * s;
    if (g.rng() < 0.5) {
      L.toast(g, M.omens.voices[Math.floor(g.rng() * M.omens.voices.length)], '#b08ad0');
      L.emit(g, 'groan', p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    } else g.omens.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, t: 2.5, max: 2.5, a: a });
  };
})(this.Lluvia = this.Lluvia || {});
