// Game engine for one arena: player, horde, abilities, projectiles and experience.
// Pure logic, no DOM, so tests and simulated games can run it in Node.
(function (L) {
  'use strict';

  var TAU = Math.PI * 2;
  var MAX_ENEMY_RADIUS = 22; // widest enemy; grid queries pad by this much
  var STEP = 1 / 30;         // longest simulation step

  L.MAX_LEVEL = 5;
  L.ABILITY_SLOTS = 5;
  L.PASSIVE_SLOTS = 4;

  L.findAbility = function (id) { return L.findById(L.data.abilities, id); };
  L.findPassive = function (id) { return L.findById(L.data.passives, id); };
  L.findEnemy = function (id) { return L.findById(L.data.enemies, id); };

  // Stats of an ability at a level: base plus every perLevel step up to it.
  L.abilityStats = function (def, level) {
    var s = {}, k;
    for (k in def.base) s[k] = def.base[k];
    for (var i = 0; i < level - 1 && i < def.perLevel.length; i++) {
      var d = def.perLevel[i];
      for (k in d) s[k] = (s[k] || 0) + d[k];
    }
    return s;
  };

  L.xpToNext = function (level) {
    var h = L.data.horde;
    return h.xpBase + h.xpStep * (level - 1);
  };

  // opts: { seed, characterId, viewW, viewH, noSpawn }
  L.createGame = function (opts) {
    opts = opts || {};
    var arena = L.data.horde.arena;
    var ch = L.findById(L.data.characters, opts.characterId) || L.data.characters[0];
    var g = {
      seed: opts.seed || 1,
      rng: L.makeRng(opts.seed || 1),
      time: 0,
      over: false,
      choice: null,        // the 3 options on screen after a level up, or null
      pendingLevels: 0,
      spawning: !opts.noSpawn,
      spawnAcc: 0,
      arena: arena,
      view: { w: opts.viewW || 1280, h: opts.viewH || 720 },
      player: {
        x: arena / 2, y: arena / 2, r: 14, char: ch,
        hp: 0, level: 1, xp: 0, abilities: [], passives: [], stats: {}, hurt: 0
      },
      enemies: [], projectiles: [], gems: [], effects: [],
      kills: 0, nextId: 1,
      grid: new L.Grid(64),
      _q: []               // reused query buffer
    };
    L.addAbility(g, ch.start);
    recalcStats(g);
    g.player.hp = g.player.stats.maxHp;
    return g;
  };

  // ---- Player stats, abilities and passives ----

  function recalcStats(g) {
    var p = g.player, b = p.char.stats;
    var m = { speedMul: 0, maxHpAdd: 0, pickupMul: 0, cooldownMul: 0, damageMul: 0, regenAdd: 0 };
    p.passives.forEach(function (ps) { m[ps.def.stat] += ps.def.perLevel * ps.level; });
    var oldMax = p.stats.maxHp;
    p.stats = {
      speed: b.speed * (1 + m.speedMul),
      maxHp: b.maxHp + m.maxHpAdd,
      pickup: b.pickup * (1 + m.pickupMul),
      cooldownMul: Math.max(0.4, 1 + m.cooldownMul),
      damageMul: 1 + m.damageMul,
      regen: b.regen + m.regenAdd
    };
    if (oldMax !== undefined && p.stats.maxHp > oldMax) p.hp += p.stats.maxHp - oldMax;
  }
  L.recalcStats = recalcStats;

  L.addAbility = function (g, id) {
    var def = L.findAbility(id);
    g.player.abilities.push({ id: id, def: def, level: 1, stats: L.abilityStats(def, 1), timer: 0, angle: 0, hits: new Map(), blades: [] });
  };

  L.levelUpAbility = function (g, id) {
    var a = L.findById(g.player.abilities, id);
    a.level = Math.min(L.MAX_LEVEL, a.level + 1);
    a.stats = L.abilityStats(a.def, a.level);
  };

  L.addPassive = function (g, id) {
    g.player.passives.push({ id: id, def: L.findPassive(id), level: 1 });
    recalcStats(g);
  };

  L.levelUpPassive = function (g, id) {
    var ps = L.findById(g.player.passives, id);
    ps.level = Math.min(L.MAX_LEVEL, ps.level + 1);
    recalcStats(g);
  };

  // ---- Main loop ----

  // input: { x, y } between -1 and 1. Nothing moves while a level-up choice is open or the game is over.
  L.update = function (g, dt, input) {
    while (dt > 1e-9 && !g.over && !g.choice) {
      var step = Math.min(dt, STEP);
      tick(g, step, input || { x: 0, y: 0 });
      dt -= step;
    }
  };

  function tick(g, dt, input) {
    var p = g.player;
    g.time += dt;
    movePlayer(g, dt, input);
    if (g.spawning) spawn(g, dt);
    buildGrid(g);
    moveEnemies(g, dt);
    if (p.hp <= 0) { p.hp = 0; g.over = true; return; }
    updateAbilities(g, dt);
    updateProjectiles(g, dt);
    removeDead(g);
    updateGems(g, dt);
    updateEffects(g, dt);
    p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.regen * dt);
    if (p.hurt > 0) p.hurt -= dt;
    checkLevel(g);
  }

  function movePlayer(g, dt, input) {
    var p = g.player, x = input.x || 0, y = input.y || 0;
    var len = Math.sqrt(x * x + y * y);
    if (len > 1) { x /= len; y /= len; }
    p.x = L.clamp(p.x + x * p.stats.speed * dt, p.r, g.arena - p.r);
    p.y = L.clamp(p.y + y * p.stats.speed * dt, p.r, g.arena - p.r);
  }

  // ---- Horde ----

  function spawn(g, dt) {
    var h = L.data.horde, minute = g.time / 60;
    g.spawnAcc += (h.spawnBase + h.spawnPerMinute * minute) * dt;
    while (g.spawnAcc >= 1) {
      g.spawnAcc -= 1;
      if (g.enemies.length >= h.maxAlive) continue;
      var a = g.rng() * TAU;
      var ring = Math.sqrt(g.view.w * g.view.w + g.view.h * g.view.h) / 2 + 40;
      L.spawnEnemy(g, pickType(g, minute), g.player.x + Math.cos(a) * ring, g.player.y + Math.sin(a) * ring);
    }
  }

  function pickType(g, minute) {
    var list = L.data.enemies, total = 0, i;
    for (i = 0; i < list.length; i++) if (list[i].from <= minute) total += list[i].weight;
    var roll = g.rng() * total;
    for (i = 0; i < list.length; i++) {
      if (list[i].from > minute) continue;
      roll -= list[i].weight;
      if (roll < 0) return list[i].id;
    }
    return list[0].id;
  }

  // Enemies get tougher with the clock: health and damage scale with the minute they appear.
  L.spawnEnemy = function (g, typeId, x, y) {
    var t = L.findEnemy(typeId), h = L.data.horde, minute = g.time / 60;
    var hp = t.hp * (1 + h.hpPerMinute * minute);
    var e = {
      id: g.nextId++, type: t,
      x: L.clamp(x, t.radius, g.arena - t.radius), y: L.clamp(y, t.radius, g.arena - t.radius),
      r: t.radius, speed: t.speed, hp: hp, maxHp: hp,
      dps: t.dps * (1 + h.dpsPerMinute * minute), xp: t.xp, dead: false, flash: 0
    };
    g.enemies.push(e);
    return e;
  };

  function buildGrid(g) {
    g.grid.clear();
    for (var i = 0; i < g.enemies.length; i++) g.grid.insert(g.enemies[i]);
  }

  function moveEnemies(g, dt) {
    var p = g.player, q = g._q;
    for (var i = 0; i < g.enemies.length; i++) {
      var e = g.enemies[i];
      var dx = p.x - e.x, dy = p.y - e.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var vx = dx / d * e.speed, vy = dy / d * e.speed;
      // Push away from overlapping neighbours so the horde spreads out instead of stacking.
      q.length = 0;
      g.grid.query(e.x, e.y, e.r + MAX_ENEMY_RADIUS, q);
      var sx = 0, sy = 0;
      for (var j = 0; j < q.length; j++) {
        var o = q[j];
        if (o === e) continue;
        var ox = e.x - o.x, oy = e.y - o.y, rr = e.r + o.r, d2 = ox * ox + oy * oy;
        if (d2 < rr * rr && d2 > 1e-4) {
          var od = Math.sqrt(d2), push = (rr - od) / rr;
          sx += ox / od * push; sy += oy / od * push;
        }
      }
      e.x = L.clamp(e.x + (vx + sx * e.speed * 1.5) * dt, e.r, g.arena - e.r);
      e.y = L.clamp(e.y + (vy + sy * e.speed * 1.5) * dt, e.r, g.arena - e.r);
      if (e.flash > 0) e.flash -= dt;
      if (d < e.r + p.r) { p.hp -= e.dps * dt; p.hurt = 0.15; }
    }
  }

  L.damageEnemy = function (g, e, amount) {
    if (e.dead) return;
    e.hp -= amount * g.player.stats.damageMul;
    e.flash = 0.1;
    if (e.hp <= 0) { e.dead = true; g.kills++; }
  };

  function areaDamage(g, x, y, r, dmg) {
    var q = g._q;
    q.length = 0;
    g.grid.query(x, y, r + MAX_ENEMY_RADIUS, q);
    for (var i = 0; i < q.length; i++) {
      var e = q[i], rr = r + e.r, dx = e.x - x, dy = e.y - y;
      if (!e.dead && dx * dx + dy * dy < rr * rr) L.damageEnemy(g, e, dmg);
    }
  }

  function nearestEnemy(g, range) {
    var p = g.player, best = null, bestD = range * range;
    for (var i = 0; i < g.enemies.length; i++) {
      var e = g.enemies[i];
      if (e.dead) continue;
      var dx = e.x - p.x, dy = e.y - p.y, d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; best = e; }
    }
    return best;
  }

  function removeDead(g) {
    var h = L.data.horde, n = 0;
    for (var i = 0; i < g.enemies.length; i++) {
      var e = g.enemies[i];
      if (!e.dead) { g.enemies[n++] = e; continue; }
      if (g.gems.length < h.maxGems) g.gems.push({ x: e.x, y: e.y, v: e.xp, magnet: false });
      else g.gems[g.rng.int(g.gems.length)].v += e.xp; // too many on the floor: merge into an existing one
    }
    g.enemies.length = n;
  }

  // ---- Abilities (one function per piece) ----

  function updateAbilities(g, dt) {
    var abilities = g.player.abilities;
    for (var i = 0; i < abilities.length; i++) {
      var a = abilities[i];
      PIECES[a.def.kind](g, a, dt);
    }
  }

  function cooldown(g, s) { return Math.max(0.1, s.cooldown * g.player.stats.cooldownMul); }

  var PIECES = {
    // Shoots at the nearest enemy; extra projectiles fan out.
    projectile: function (g, a, dt) {
      var s = a.stats, p = g.player;
      a.timer -= dt;
      if (a.timer > 0) return;
      var t = nearestEnemy(g, s.range);
      if (!t) { a.timer = 0; return; }
      a.timer = cooldown(g, s);
      var base = Math.atan2(t.y - p.y, t.x - p.x);
      for (var i = 0; i < s.count; i++) {
        var ang = base + (i - (s.count - 1) / 2) * 0.18;
        g.projectiles.push({
          x: p.x, y: p.y, vx: Math.cos(ang) * s.speed, vy: Math.sin(ang) * s.speed, r: s.radius,
          damage: s.damage, pierce: s.pierce, life: s.range / s.speed + 0.2, hit: [], color: a.def.color, dead: false
        });
      }
    },

    // Hits everything around you every few seconds.
    nova: function (g, a, dt) {
      var s = a.stats, p = g.player;
      a.timer -= dt;
      if (a.timer > 0) return;
      a.timer = cooldown(g, s);
      areaDamage(g, p.x, p.y, s.radius, s.damage);
      g.effects.push({ kind: 'ring', x: p.x, y: p.y, r: s.radius, ttl: 0.3, max: 0.3, color: a.def.color });
    },

    // Blades spinning around you; each enemy can be hit once every `hitEvery` seconds.
    orbit: function (g, a, dt) {
      var s = a.stats, p = g.player, q = g._q;
      a.angle = (a.angle + s.spin * dt) % TAU;
      a.blades.length = s.count;
      if (a.hits.size > 3000) a.hits.clear();
      for (var b = 0; b < s.count; b++) {
        var ang = a.angle + b * TAU / s.count;
        var bx = p.x + Math.cos(ang) * s.radius, by = p.y + Math.sin(ang) * s.radius;
        a.blades[b] = { x: bx, y: by };
        q.length = 0;
        g.grid.query(bx, by, s.size + MAX_ENEMY_RADIUS, q);
        for (var i = 0; i < q.length; i++) {
          var e = q[i];
          if (e.dead) continue;
          var rr = s.size + e.r, dx = e.x - bx, dy = e.y - by;
          if (dx * dx + dy * dy >= rr * rr) continue;
          var last = a.hits.get(e.id);
          if (last !== undefined && g.time - last < s.hitEvery) continue;
          a.hits.set(e.id, g.time);
          L.damageEnemy(g, e, s.damage);
        }
      }
    },

    // Constant damage to everyone inside the cloud, applied in ticks.
    aura: function (g, a, dt) {
      var s = a.stats, p = g.player;
      a.timer -= dt;
      if (a.timer > 0) return;
      a.timer += s.tick;
      areaDamage(g, p.x, p.y, s.radius, s.dps * s.tick);
    },

    // Bolts on random enemies within range, each hitting a small area.
    strike: function (g, a, dt) {
      var s = a.stats, p = g.player, q = g._q;
      a.timer -= dt;
      if (a.timer > 0) return;
      q.length = 0;
      g.grid.query(p.x, p.y, s.range, q);
      var targets = [];
      for (var i = 0; i < q.length; i++) {
        var e = q[i], dx = e.x - p.x, dy = e.y - p.y;
        if (!e.dead && dx * dx + dy * dy < s.range * s.range) targets.push(e);
      }
      if (!targets.length) { a.timer = 0; return; }
      a.timer = cooldown(g, s);
      for (var n = 0; n < s.count && targets.length; n++) {
        var t = targets.splice(g.rng.int(targets.length), 1)[0];
        areaDamage(g, t.x, t.y, s.splash, s.damage);
        g.effects.push({ kind: 'bolt', x: t.x, y: t.y, r: s.splash, ttl: 0.25, max: 0.25, color: a.def.color });
      }
    }
  };
  L.PIECES = PIECES;

  function updateProjectiles(g, dt) {
    var q = g._q, n = 0;
    for (var i = 0; i < g.projectiles.length; i++) {
      var pr = g.projectiles[i];
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
      if (pr.life <= 0 || pr.x < 0 || pr.y < 0 || pr.x > g.arena || pr.y > g.arena) pr.dead = true;
      if (!pr.dead) {
        q.length = 0;
        g.grid.query(pr.x, pr.y, pr.r + MAX_ENEMY_RADIUS, q);
        for (var j = 0; j < q.length; j++) {
          var e = q[j];
          if (e.dead || pr.hit.indexOf(e.id) !== -1) continue;
          var rr = pr.r + e.r, dx = e.x - pr.x, dy = e.y - pr.y;
          if (dx * dx + dy * dy >= rr * rr) continue;
          L.damageEnemy(g, e, pr.damage);
          pr.hit.push(e.id);
          if (pr.pierce <= 0) { pr.dead = true; break; }
          pr.pierce--;
        }
      }
      if (!pr.dead) g.projectiles[n++] = pr;
    }
    g.projectiles.length = n;
  }

  // ---- Experience ----

  function updateGems(g, dt) {
    var p = g.player, pick2 = p.stats.pickup * p.stats.pickup, n = 0;
    for (var i = 0; i < g.gems.length; i++) {
      var gem = g.gems[i];
      var dx = p.x - gem.x, dy = p.y - gem.y, d2 = dx * dx + dy * dy;
      if (d2 < pick2) gem.magnet = true;
      if (gem.magnet) {
        var d = Math.sqrt(d2) || 1;
        if (d < p.r + 8) { p.xp += gem.v; continue; }
        var sp = Math.min(d / dt, 520);
        gem.x += dx / d * sp * dt; gem.y += dy / d * sp * dt;
      }
      g.gems[n++] = gem;
    }
    g.gems.length = n;
  }

  function updateEffects(g, dt) {
    var n = 0;
    for (var i = 0; i < g.effects.length; i++) {
      var fx = g.effects[i];
      fx.ttl -= dt;
      if (fx.ttl > 0) g.effects[n++] = fx;
    }
    g.effects.length = n;
  }

  function checkLevel(g) {
    var p = g.player;
    while (p.xp >= L.xpToNext(p.level)) {
      p.xp -= L.xpToNext(p.level);
      p.level++;
      g.pendingLevels++;
    }
    if (g.pendingLevels > 0 && !g.choice) g.choice = L.makeChoices(g);
  }
})(this.Lluvia = this.Lluvia || {});
