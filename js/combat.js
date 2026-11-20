// Hits, gold drops and item effects that trigger on hit or on kill.
// Item effects can trigger other item effects (a chain lightning that burns, that explodes...), up to
// MAX_PROC_DEPTH links, so a lucky hit cascades but never loops forever.
(function (L) {
  'use strict';

  L.MAX_PROC_DEPTH = 3;

  // Live enemies whose body touches the circle. Returns a new array, so it is safe inside nested effects.
  L.nearby = function (g, x, y, r) {
    var q = [], out = [];
    g.grid.query(x, y, r + L.MAX_ENEMY_RADIUS, q);
    for (var i = 0; i < q.length; i++) {
      var e = q[i], rr = r + e.r, dx = e.x - x, dy = e.y - y;
      if (!e.dead && dx * dx + dy * dy < rr * rr) out.push(e);
    }
    return out;
  };

  // A hit from one of your abilities: applies your damage bonus and critical chance.
  // `proc` (0 to 1) scales the chance of on-hit item effects.
  L.hit = function (g, e, amount, proc) {
    if (e.dead) return;
    var s = g.player.stats, dmg = amount * s.damageMul;
    if (s.crit > 0 && g.rng() < s.crit) dmg *= 2;
    L.applyHit(g, e, dmg, proc, 0);
  };

  // Final damage (bonuses already in). Item effects call this directly with depth + 1.
  L.applyHit = function (g, e, dmg, proc, depth) {
    if (e.dead) return;
    e.hp -= dmg;
    e.flash = 0.1;
    var killed = e.hp <= 0;
    if (killed) { e.dead = true; g.kills++; enemyKilled(g, e); }
    if (depth >= L.MAX_PROC_DEPTH) return;
    var p = g.player, i, it;
    if (proc > 0) {
      for (i = 0; i < p.onHit.length; i++) {
        it = p.onHit[i];
        if (g.rng() < it.chance * proc) ON_HIT[it.def.effect](g, e, dmg, it.params, proc, depth);
      }
    }
    if (killed) {
      for (i = 0; i < p.onKill.length; i++) {
        it = p.onKill[i];
        ON_KILL[it.def.effect](g, e, dmg, it.params, depth);
      }
    }
  };

  function enemyKilled(g, e) {
    var t = e.type, h = L.data.horde;
    if (t.gold && g.rng() < t.goldChance) {
      g.gold += Math.round(t.gold * Math.pow(1 + h.goldGrowth, L.difficulty(g) - 1));
    }
    if (t.boss) {
      if (g.boss === e) g.boss = null;
      L.dropChest(g, e.x, e.y, 'boss');
      L.toast(g, 'Cayó el ' + t.name + ': dejó un cofre gratis', '#ffd27a');
    }
  }

  function byDistanceFrom(e) {
    return function (a, b) {
      return ((a.x - e.x) * (a.x - e.x) + (a.y - e.y) * (a.y - e.y)) - ((b.x - e.x) * (b.x - e.x) + (b.y - e.y) * (b.y - e.y));
    };
  }

  var ON_HIT = {
    // A bolt jumps from the enemy hit to the closest others.
    chain: function (g, e, dmg, p, proc, depth) {
      var list = L.nearby(g, e.x, e.y, p.range).filter(function (t) { return t !== e; });
      list.sort(byDistanceFrom(e));
      list = list.slice(0, p.targets);
      if (!list.length) return;
      g.effects.push({ kind: 'chain', x: e.x, y: e.y, pts: list.map(function (t) { return { x: t.x, y: t.y }; }), ttl: 0.2, max: 0.2, color: '#9ad0ff' });
      for (var i = 0; i < list.length; i++) L.applyHit(g, list[i], dmg * p.mult, 0.3, depth + 1);
    },
    // Sets the enemy on fire: the damage is spread over `duration` seconds and stacks with more burns.
    burn: function (g, e, dmg, p) {
      if (e.dead) return;
      e.burnDps += dmg * p.mult / p.duration;
      e.burnTtl = p.duration;
    },
    // Weak hits already trigger it less often (chance × proc), so the amount is not reduced again.
    heal: function (g, e, dmg, p) {
      var pl = g.player;
      pl.hp = Math.min(pl.stats.maxHp, pl.hp + p.amount);
    },
    // The same hit lands again (and can trigger effects again, one link deeper).
    repeat: function (g, e, dmg, p, proc, depth) {
      L.applyHit(g, e, dmg, proc, depth + 1);
    },
    bigStrike: function (g, e, dmg, p, proc, depth) {
      var list = L.nearby(g, e.x, e.y, p.radius);
      g.effects.push({ kind: 'bolt', x: e.x, y: e.y, r: p.radius, ttl: 0.35, max: 0.35, color: '#ffe066' });
      for (var i = 0; i < list.length; i++) L.applyHit(g, list[i], dmg * p.mult, 0, depth + 1);
    }
  };

  var ON_KILL = {
    // The dead enemy blows up for a share of the killing hit. (Not of its own health: that let one kill
    // wipe the whole horde in a chain, whatever the clock said.)
    explode: function (g, e, dmg, p, depth) {
      var list = L.nearby(g, e.x, e.y, p.radius);
      g.effects.push({ kind: 'ring', x: e.x, y: e.y, r: p.radius, ttl: 0.25, max: 0.25, color: '#ff9a3d' });
      for (var i = 0; i < list.length; i++) L.applyHit(g, list[i], dmg * p.mult, 0, depth + 1);
    }
  };

  L.ON_HIT = ON_HIT;
  L.ON_KILL = ON_KILL;
})(this.Lluvia = this.Lluvia || {});
