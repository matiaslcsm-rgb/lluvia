// What the zombies notice and what they do about it (data/senses.js). Noises are made during a frame (a shot, your
// steps, a search, a groan) and heard in the next. Each zombie is in one state:
//   wander: walks slowly with no aim, now and then stands still;
//   investigate: goes to where it heard something, looks around a while, then wanders again;
//   chase: it sees you and comes; if it loses you for a while it goes to where it last saw you (investigate there).
(function (L) {
  'use strict';

  function S() { return L.data.senses; }
  var TAU = Math.PI * 2;

  // A noise of radius `m` meters at (x, y) px on a floor.
  L.makeNoise = function (g, x, y, m, floor, who) {
    if (!g.night) return;
    (g.noises || (g.noises = [])).push({ x: x, y: y, r: m * g.city.scale, floor: floor || 0, who: who || null });
  };

  // The noises of this frame become last frame's: zombies hear those.
  L.swapNoises = function (g) { g.heard = g.noises || []; g.noises = []; };

  function hears(g, e, n) {
    if ((e.floor || 0) !== n.floor || n.who === e) return false;
    var light = L.clockOf(g).light, r = n.r * (1 + (S().hearing.night - 1) * (1 - light));
    var d = Math.hypot(n.x - e.x, n.y - e.y);
    if (d > r) return false;
    // A wall in between: half as far.
    if (d > r * S().hearing.wall && L.sightRay(g.city, e, e.x, e.y, Math.atan2(n.y - e.y, n.x - e.x), d) < d - g.city.cell) return false;
    return true;
  }

  // Does zombie e see you? In its cone, close enough for the light, nothing in between, same floor.
  function seesPlayer(g, e) {
    var p = g.player, s = g.city.scale, K = S().sight;
    if ((e.floor || 0) !== (p.floor || 0) || g.respawn > 0) return false;
    var light = L.clockOf(g).light, range = (K.night + (K.day - K.night) * light) * s;
    if (p.flashlight && p.flashlight.on) range = Math.max(range, K.lit * s);
    if (L.wx) range *= L.wx(g, 'zsight'); // fog and storm (js/weather.js)
    var dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
    if (d > range) return false;
    if (d > e.r + p.r + 0.6 * s) {
      var diff = Math.abs(((Math.atan2(dy, dx) - e.face) % TAU + 3 * Math.PI) % TAU - Math.PI);
      if (diff > K.cone * Math.PI / 360) return false;
    }
    return L.sightRay(g.city, e, e.x, e.y, Math.atan2(dy, dx), d) >= d - g.city.cell;
  }
  L.zombieSees = seesPlayer;

  // Works out where zombie e goes this frame. Returns into `out`: { x, y } the point it heads for, `mul` (share of
  // its speed), `chase` (true: toward you, by the streets).
  L.zombieThink = function (g, e, dt, out) {
    var K = S(), p = g.player, s = g.city.scale;
    if (e.face === undefined) { e.face = g.rng() * TAU; e.mind = 'wander'; e.turn = 0; e.look = g.rng() * K.look; }
    // Looks, every so often (not every frame: a city of zombies would be slow).
    e.look -= dt;
    if (e.look <= 0) {
      e.look = K.look;
      if (seesPlayer(g, e)) {
        if (e.mind !== 'chase') e.groan = 0;
        e.mind = 'chase'; e.lostT = 0; e.lastX = p.x; e.lastY = p.y;
      } else if (e.mind === 'chase') {
        e.lostT += K.look;
        if (e.lostT >= K.chase.lose) { e.mind = 'investigate'; e.goX = e.lastX; e.goY = e.lastY; e.linger = K.chase.search; }
      }
      // Heard something (and not already after you): goes to see.
      if (e.mind !== 'chase' && g.heard) for (var i = 0; i < g.heard.length; i++) {
        var n = g.heard[i];
        if (hears(g, e, n)) { e.mind = 'investigate'; e.goX = n.x + (g.rng() - 0.5) * 2 * s; e.goY = n.y + (g.rng() - 0.5) * 2 * s; e.linger = K.investigate.linger; break; }
      }
    }
    if (e.mind === 'chase') {
      // Groans now and then: the ones nearby hear it and come too.
      e.groan -= dt;
      if (e.groan <= 0) { e.groan = K.chase.groanEvery * (0.7 + g.rng() * 0.6); L.makeNoise(g, e.x, e.y, K.noise.groan, e.floor, e); L.emit(g, 'groan', e.x, e.y); }
      out.x = p.x; out.y = p.y; out.mul = 1; out.chase = true;
      return out;
    }
    out.chase = false;
    if (e.mind === 'investigate') {
      var dx = e.goX - e.x, dy = e.goY - e.y;
      if (Math.hypot(dx, dy) > 1.2 * s) { out.x = e.goX; out.y = e.goY; out.mul = K.investigate.speed; return out; }
      // There: looks around, then goes back to wandering.
      e.linger -= dt;
      if (e.linger <= 0) e.mind = 'wander';
      else { e.turn -= dt; if (e.turn <= 0) { e.turn = 1 + g.rng() * 1.5; e.face += (g.rng() - 0.5) * 2.5; } out.x = e.x; out.y = e.y; out.mul = 0; return out; }
    }
    // Wandering: a heading for a few seconds, sometimes standing still.
    e.turn -= dt;
    if (e.turn <= 0 || e.blocked) {
      e.turn = K.wander.turn[0] + g.rng() * (K.wander.turn[1] - K.wander.turn[0]);
      e.face += (g.rng() - 0.5) * (e.blocked ? Math.PI * 1.6 : 2);
      e.idle = g.rng() < K.wander.stop;
      e.blocked = false;
    }
    out.x = e.x + Math.cos(e.face) * 100; out.y = e.y + Math.sin(e.face) * 100; out.mul = e.idle ? 0 : K.wander.speed;
    return out;
  };
})(this.Lluvia = this.Lluvia || {});
