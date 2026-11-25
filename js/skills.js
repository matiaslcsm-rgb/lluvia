// Skills (data/skills.js): experience from using them, 10 levels each. And aiming with them: the spread of your
// shots, which closes while you aim, and the zombies' heads, which only a bullet through them kills.
(function (L) {
  'use strict';

  function D() { return L.data.skills; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  L.skillOf = function (p, id) {
    var sk = p.skills || (p.skills = {});
    return sk[id] || (sk[id] = { level: 0, xp: 0 });
  };
  L.skillLevel = function (p, id) { return L.skillOf(p, id).level; };

  // Adds experience; a level up shows on screen. Returns true if it went up.
  L.gainSkill = function (g, id, xp) {
    var p = g.player, sk = L.skillOf(p, id), K = D(), up = false;
    if (sk.level >= K.levels) return false;
    sk.xp += xp;
    while (sk.level < K.levels && sk.xp >= K.need[sk.level]) {
      sk.xp -= K.need[sk.level]; sk.level++; up = true;
    }
    if (sk.level >= K.levels) sk.xp = 0;
    if (up) { L.toast(g, K.list[id].name + ' sube a ' + sk.level + '.', '#d9cfa6'); L.emit(g, 'skill', p.x, p.y, { id: id, level: sk.level }); }
    return up;
  };

  // ---- Aiming ----
  // Each frame: the extra spread goes toward where it should be: closing slowly while you aim standing still (faster
  // and smaller the better your aim), opening while you walk, the hip spread otherwise.
  L.updateAim = function (g, dt, input, moving) {
    var p = g.player, A = D().aim, t = L.skillLevel(p, 'punteria') / D().levels;
    var aimed = lerp(A.aimed[0], A.aimed[1], t), settle = lerp(A.settle[0], A.settle[1], t);
    p.aiming = !!(input && input.aiming);
    var want = p.aiming && !moving ? aimed : moving ? A.walk : A.hip;
    if (p.spread === undefined) p.spread = A.hip;
    if (p.spread > want) p.spread = Math.max(want, p.spread - (A.walk - aimed) / settle * dt);
    else p.spread = Math.min(want, p.spread + (A.walk - aimed) / 0.25 * dt);
  };

  // A zombie's head: in front of its middle, the way it faces (as drawn, js/view/art.js).
  L.headOf = function (e, tx, ty) {
    var a = e.face !== undefined ? e.face : Math.atan2(ty - e.y, tx - e.x);
    return { x: e.x + Math.cos(a) * e.r * 0.25, y: e.y + Math.sin(a) * e.r * 0.25, r: e.r * 0.48 };
  };

  // Did a bullet going from (ax, ay) to (bx, by) this frame pass through e's head? Your aim makes heads bigger for
  // your bullets.
  L.headHit = function (g, e, pr, ax, ay) {
    var h = L.headOf(e, g.player.x, g.player.y), A = D().aim, t = L.skillLevel(g.player, 'punteria') / D().levels;
    var dx = pr.x - ax, dy = pr.y - ay, k = L.clamp(((h.x - ax) * dx + (h.y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(ax + dx * k - h.x, ay + dy * k - h.y) <= h.r * lerp(A.head[0], A.head[1], t) + pr.r;
  };
})(this.Lluvia = this.Lluvia || {});
