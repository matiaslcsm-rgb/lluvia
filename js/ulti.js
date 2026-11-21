// Ultis: cast with Space toward a point. They work on a game or on a duel view the same way (see duel.js).
(function (L) {
  'use strict';

  L.findUlti = function (id) { return L.findById(L.data.ultis, id); };

  L.ultiReady = function (p) { return !!p.ulti && p.ulti.cd <= 0; };

  function scaled(p, def) {
    var k = 1 + 0.12 * (p.level - 1), s = {};
    for (var key in def.stats) s[key] = def.stats[key];
    s.damage = def.stats.damage * k;
    return s;
  }

  // Enemies whose body is within `w` of the segment (x1,y1)-(x2,y2). Also used by the sweep piece.
  var alongSegment = L.alongSegment = function (g, x1, y1, x2, y2, w) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) || 1;
    return L.nearby(g, mx, my, len / 2 + w).filter(function (e) {
      var t = L.clamp(((e.x - x1) * (x2 - x1) + (e.y - y1) * (y2 - y1)) / (len * len), 0, 1);
      var px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t;
      var rr = w + e.r;
      return (e.x - px) * (e.x - px) + (e.y - py) * (e.y - py) < rr * rr;
    });
  };

  function stun(e, t) { e.stun = Math.max(e.stun || 0, t); }

  // Point at most `max` away from the player in the aimed direction.
  function aimPoint(p, x, y, max) {
    var dx = x - p.x, dy = y - p.y, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1) { dx = 1; dy = 0; d = 1; }
    var k = Math.min(1, max / d);
    return { x: p.x + dx * k, y: p.y + dy * k, ux: dx / d, uy: dy / d };
  }

  var KINDS = {
    meteors: function (g, p, s, def, x, y) {
      var c = aimPoint(p, x, y, s.range);
      for (var i = 0; i < s.count; i++) {
        var a = g.rng() * Math.PI * 2, r = Math.sqrt(g.rng()) * s.spread;
        var mx = c.x + Math.cos(a) * r, my = c.y + Math.sin(a) * r;
        L.nearby(g, mx, my, s.splash).forEach(function (e) { L.hit(g, e, s.damage, 0.5); });
        g.effects.push({ kind: 'bolt', x: mx, y: my, r: s.splash, ttl: 0.45, max: 0.45, color: def.color });
      }
    },
    quake: function (g, p, s, def) {
      L.nearby(g, p.x, p.y, s.radius).forEach(function (e) { L.hit(g, e, s.damage, 1); stun(e, s.stun); });
      g.effects.push({ kind: 'ring', x: p.x, y: p.y, r: s.radius, ttl: 0.5, max: 0.5, color: def.color });
    },
    dash: function (g, p, s, def, x, y) {
      var to = aimPoint(p, x, y, s.distance);
      to.x = L.clamp(to.x, p.r, g.arena - p.r);
      to.y = L.clamp(to.y, p.r, g.arena - p.r);
      alongSegment(g, p.x, p.y, to.x, to.y, s.width).forEach(function (e) { L.hit(g, e, s.damage, 1); });
      g.effects.push({ kind: 'line', x: p.x, y: p.y, x2: to.x, y2: to.y, w: s.width, ttl: 0.3, max: 0.3, color: def.color });
      p.x = to.x; p.y = to.y;
      p.invuln = Math.max(p.invuln || 0, 0.5);
    },
    beam: function (g, p, s, def, x, y) {
      var to = aimPoint(p, x, y, s.length);
      var ex = p.x + to.ux * s.length, ey = p.y + to.uy * s.length;
      alongSegment(g, p.x, p.y, ex, ey, s.width).forEach(function (e) { L.hit(g, e, s.damage, 1); });
      g.effects.push({ kind: 'line', x: p.x, y: p.y, x2: ex, y2: ey, w: s.width, ttl: 0.4, max: 0.4, color: def.color });
    },
    roots: function (g, p, s, def) {
      L.nearby(g, p.x, p.y, s.radius).forEach(function (e) { L.hit(g, e, s.damage, 0.5); stun(e, s.stun); });
      p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * s.heal);
      g.effects.push({ kind: 'ring', x: p.x, y: p.y, r: s.radius, ttl: 0.6, max: 0.6, color: def.color });
    }
  };
  // Resaca: everyone near you is dragged to the aimed point, hit and stunned.
  KINDS.pull = function (g, p, s, def, x, y) {
    var c = aimPoint(p, x, y, s.range);
    L.nearby(g, p.x, p.y, s.radius).forEach(function (e) {
      if (!e.type.boss) { var a = g.rng() * Math.PI * 2, r = g.rng() * 40; e.x = c.x + Math.cos(a) * r; e.y = c.y + Math.sin(a) * r; }
      L.hit(g, e, s.damage, 1);
      stun(e, s.stun);
    });
    g.effects.push({ kind: 'ring', x: c.x, y: c.y, r: 90, ttl: 0.5, max: 0.5, color: def.color });
    g.effects.push({ kind: 'line', x: p.x, y: p.y, x2: c.x, y2: c.y, w: 12, ttl: 0.3, max: 0.3, color: def.color });
  };

  // Chatarra: a ring of piercing shrapnel.
  KINDS.shrapnel = function (g, p, s, def) {
    for (var i = 0; i < s.count; i++) {
      var a = i / s.count * Math.PI * 2;
      g.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, r: 7, proc: 0.5,
        damage: s.damage, pierce: s.pierce, life: s.range / s.speed, hit: [], color: def.color, dead: false });
    }
    g.effects.push({ kind: 'ring', x: p.x, y: p.y, r: 60, ttl: 0.3, max: 0.3, color: def.color });
  };

  // Destello: a blinding light that stuns everything in sight.
  KINDS.flash = function (g, p, s, def) {
    L.nearby(g, p.x, p.y, s.radius).forEach(function (e) { L.hit(g, e, s.damage, 0.5); stun(e, s.stun); });
    g.effects.push({ kind: 'ring', x: p.x, y: p.y, r: s.radius, ttl: 0.6, max: 0.6, color: def.color });
  };

  L.ULTI_KINDS = KINDS;

  // Casts the player's ulti toward (x, y) if it is ready. Returns true if it went off.
  // `g` can be a game or a duel view: both have player, enemies, grid, effects, rng and arena.
  L.castUlti = function (g, x, y) {
    var p = g.player;
    if (!L.ultiReady(p) || g.respawn > 0) return false;
    var def = p.ulti.def;
    KINDS[def.kind](g, p, scaled(p, def), def, x, y);
    p.ulti.cd = def.cooldown * p.stats.cooldownMul;
    L.emit(g, 'ulti', p.x, p.y, def);
    return true;
  };

  L.tickUlti = function (p, dt) { if (p.ulti && p.ulti.cd > 0) p.ulti.cd -= dt; };
})(this.Lluvia = this.Lluvia || {});
