// Game engine for one arena: player, horde, abilities, projectiles, experience and the difficulty clock.
// Pure logic, no DOM, so tests and simulated games can run it in Node.
// Hits and item effects live in combat.js; items and chests in items.js.
(function (L) {
  'use strict';

  var TAU = Math.PI * 2;
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

  // The difficulty clock: one step every minute, the same for everyone. Starts at 1.
  L.difficulty = function (g) { return 1 + Math.floor(g.time / 60); };

  // opts: { seed, characterId, viewW, viewH, noSpawn, lives, listen } — listen: keep events for screen and sound
  L.createGame = function (opts) {
    opts = opts || {};
    var h = L.data.horde;
    var ch = L.findById(L.data.characters, opts.characterId) || L.data.characters[0];
    var g = {
      seed: opts.seed || 1,
      rng: L.makeRng(opts.seed || 1),
      time: 0,
      over: false,         // true once every life is gone
      lives: opts.lives || L.data.horde.lives,
      deaths: 0,
      respawn: 0,          // seconds left before coming back after losing a life
      choice: null,        // the 3 options on screen after a level up, or null
      pendingLevels: 0,
      spawning: !opts.noSpawn,
      spawnAcc: 0,
      nextBoss: h.bossFirst,
      boss: null,
      nextWave: h.waveFirst, // next storm event
      lastWave: null,
      surge: 0,              // seconds left of a "marea" storm event (more spawns)
      enemyShots: [],        // mud the Escupelodos spit at you
      arena: h.arena,
      view: { w: opts.viewW || 1280, h: opts.viewH || 720 },
      player: {
        x: h.arena / 2, y: h.arena / 2, r: 14, char: ch,
        hp: 0, level: 1, xp: 0, abilities: [], passives: [], stats: {}, hurt: 0, invuln: 0, dirX: 1, dirY: 0,
        items: {}, itemOrder: [], onHit: [], onKill: []
      },
      gold: 0,
      enemies: [], projectiles: [], gems: [], effects: [], chests: [], toasts: [],
      kills: 0, nextId: 1,
      events: opts.listen ? [] : null,
      hordeHp: opts.storm ? L.data.meta.storm.hpMul : 1,   // Tormenta eterna
      hordeDps: opts.storm ? L.data.meta.storm.dpsMul : 1,
      grid: new L.Grid(64),
      maxR: 0,             // widest live enemy this tick; grid queries pad by it so big ones are never missed
      _q: []               // reused query buffer for the top-level loops (never re-entered)
    };
    L.addAbility(g, ch.start);
    var ulti = L.findUlti(ch.ulti);
    g.player.ulti = { def: ulti, cd: ulti.cooldown / 2 }; // the first one is ready halfway through its cooldown
    recalcStats(g);
    g.player.hp = g.player.stats.maxHp;
    if (g.spawning) L.fillChests(g);
    return g;
  };

  L.toast = function (g, text, color) {
    g.toasts.push({ text: text, color: color || '#e8e8ee', ttl: 3 });
    if (g.toasts.length > 4) g.toasts.shift();
  };

  // ---- Player stats: character + passives + items ----

  function recalcStats(g) {
    var p = g.player, b = p.char.stats;
    var m = { speedMul: 0, maxHpAdd: 0, pickupMul: 0, cooldownMul: 0, damageMul: 0, regenAdd: 0,
      cooldownHyper: 0, crit: 0, extraProjectiles: 0, areaMul: 0, armorHyper: 0, extraChoices: 0,
      stillRegen: 0, goldMul: 0, stillDamage: 0, rushDamage: 0 };
    p.passives.forEach(function (ps) { m[ps.def.stat] += ps.def.perLevel * ps.level; });
    L.applyItemMods(g, m);
    var meta = g.meta || {}; // your Cuaderno upgrades (js/meta.js); none for the rivals
    var oldMax = p.stats.maxHp;
    p.stats = {
      speed: b.speed * (1 + m.speedMul + (meta.speedMul || 0)),
      maxHp: (b.maxHp + m.maxHpAdd) * (1 + (meta.maxHpMul || 0)),
      pickup: b.pickup * (1 + m.pickupMul + (meta.pickupMul || 0)),
      // Passives subtract linearly (floor 40%); items divide, so each copy helps a bit less.
      cooldownMul: Math.max(0.4, 1 + m.cooldownMul + (meta.cooldownMul || 0)) / (1 + m.cooldownHyper),
      damageMul: 1 + m.damageMul + (meta.damageMul || 0),
      regen: b.regen + m.regenAdd,
      crit: Math.min(1, m.crit),
      extraProjectiles: m.extraProjectiles,
      area: 1 + m.areaMul,
      armor: 1 - 1 / (1 + m.armorHyper),   // share of damage you don't take; each copy helps a bit less
      extraChoices: m.extraChoices,
      stillRegen: m.stillRegen, goldMul: m.goldMul, stillDamage: m.stillDamage, rushDamage: m.rushDamage
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
  // Returns the time it could not play (because a choice opened or the game ended), 0 otherwise.
  L.update = function (g, dt, input) {
    while (dt > 1e-9 && !g.over && !g.choice) {
      var step = Math.min(dt, STEP);
      tick(g, step, input || { x: 0, y: 0 });
      dt -= step;
    }
    return dt > 1e-9 ? dt : 0;
  };

  // Losing all health costs a life and half your gold. With lives left you come back after a few seconds.
  function loseLife(g) {
    var p = g.player, h = L.data.horde;
    if (p.items.fenix > 0) {
      // The Phoenix burns instead of you: back on your feet right there, with half your health.
      p.items.fenix--;
      if (!p.items.fenix) { delete p.items.fenix; p.itemOrder.splice(p.itemOrder.indexOf('fenix'), 1); recalcStats(g); }
      p.hp = p.stats.maxHp / 2;
      p.invuln = h.respawnInvuln;
      L.toast(g, 'El Fénix te salvó: no perdiste la vida', '#ff5a5a');
      L.emit(g, 'fenix', p.x, p.y);
      return;
    }
    p.hp = 0;
    g.lives--;
    g.deaths++;
    L.emit(g, 'lifeLost', p.x, p.y);
    if (g.lives <= 0) { g.over = true; return; }
    g.gold = Math.floor(g.gold / 2);
    g.respawn = h.respawnTime;
    g.projectiles.length = 0;
    g.enemyShots.length = 0;
  }

  // Back in the arena: full health, a moment of invulnerability and room to breathe.
  function revive(g) {
    var p = g.player, h = L.data.horde, r2 = h.respawnClear * h.respawnClear;
    p.hp = p.stats.maxHp;
    g.enemyShots.length = 0;
    p.invuln = h.respawnInvuln;
    g.enemies = g.enemies.filter(function (e) {
      return e.type.boss || (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y) > r2;
    });
    L.toast(g, 'Volviste. Te ' + (g.lives === 1 ? 'queda 1 vida' : 'quedan ' + g.lives + ' vidas'), '#ff6b81');
  }

  function tick(g, dt, input) {
    var p = g.player;
    g.time += dt;
    g.procs = L.PROC_BUDGET;
    if (g.respawn > 0) {
      // While you are down the clock and the horde keep going, but nothing touches you.
      g.respawn -= dt;
      if (g.spawning) { spawn(g, dt); spawnBoss(g); spawnWave(g); }
      updateTimed(g.effects, dt);
      updateTimed(g.toasts, dt);
      if (g.respawn <= 0) { g.respawn = 0; revive(g); }
      return;
    }
    if (p.invuln > 0) p.invuln -= dt;
    L.tickUlti(p, dt);
    movePlayer(g, dt, input);
    if (g.spawning) { spawn(g, dt); spawnBoss(g); spawnWave(g); }
    buildGrid(g);
    moveEnemies(g, dt);
    updateEnemyShots(g, dt);
    if (p.hp <= 0) { loseLife(g); return; }
    updateAbilities(g, dt);
    updateProjectiles(g, dt);
    removeDead(g);
    updateGems(g, dt);
    L.updateChests(g);
    L.updateShrines(g, dt);
    updateTimed(g.effects, dt);
    updateTimed(g.toasts, dt);
    p.hp = Math.min(p.stats.maxHp, p.hp + (p.stats.regen + p.stats.stillRegen * (p.still || 0)) * dt);
    if (p.hurt > 0) p.hurt -= dt;
    checkLevel(g);
  }

  // Stance for the Ancla / Raíz / Racha items: `still` fills in 1.5 s standing and drains fast when you move;
  // `rush` fills in 3 s moving and drops to nothing when you stop.
  L.updateStance = function (p, moving, dt) {
    if (moving) { p.still = Math.max(0, (p.still || 0) - dt * 3); p.rush = Math.min(1, (p.rush || 0) + dt / 3); }
    else { p.still = Math.min(1, (p.still || 0) + dt / 1.5); p.rush = 0; }
  };

  function movePlayer(g, dt, input) {
    var p = g.player, x = input.x || 0, y = input.y || 0;
    var len = Math.sqrt(x * x + y * y);
    if (len > 1) { x /= len; y /= len; }
    if (x || y) { p.dirX = x; p.dirY = y; } // the way you face, for drawing
    L.updateStance(p, len > 0.2, dt);
    p.x = L.clamp(p.x + x * p.stats.speed * dt, p.r, g.arena - p.r);
    p.y = L.clamp(p.y + y * p.stats.speed * dt, p.r, g.arena - p.r);
  }

  // ---- Horde ----

  function ringPoint(g) {
    var a = g.rng() * TAU;
    var ring = Math.sqrt(g.view.w * g.view.w + g.view.h * g.view.h) / 2 + 40;
    return { x: g.player.x + Math.cos(a) * ring, y: g.player.y + Math.sin(a) * ring };
  }

  function spawn(g, dt) {
    var h = L.data.horde, step = L.difficulty(g) - 1, minute = g.time / 60;
    var mult = 1;
    if (g.surge > 0) { g.surge -= dt; mult = g.surgeMult || 1; }
    g.spawnAcc += (h.spawnBase + h.spawnPerLevel * step) * mult * dt;
    var eliteChance = minute < h.eliteFrom ? 0 : h.eliteChance + h.elitePerMinute * (minute - h.eliteFrom);
    while (g.spawnAcc >= 1) {
      g.spawnAcc -= 1;
      if (g.enemies.length >= h.maxAlive) continue;
      var pt = ringPoint(g);
      var e = L.spawnEnemy(g, pickType(g, minute), pt.x, pt.y);
      if (g.rng() < eliteChance) L.makeElite(e);
    }
  }

  // A golden, tougher version of a creature: more health, size, damage, experience and gold.
  L.makeElite = function (e) {
    var el = L.data.horde.elite;
    e.elite = true;
    e.hp *= el.hp; e.maxHp *= el.hp;
    e.r *= el.size; e.dps *= el.dps; e.xp *= el.xp;
    return e;
  };

  // Storm events: every minute something special happens, announced on screen. Never the same twice in a row.
  function spawnWave(g) {
    if (g.time < g.nextWave) return;
    var h = L.data.horde, minute = g.time / 60, step = L.difficulty(g) - 1;
    g.nextWave += h.waveEvery;
    var pool = L.data.waves.filter(function (w) { return w.from <= minute && w.id !== g.lastWave; });
    if (!pool.length) return;
    var w = g.rng.pick(pool), p = g.player;
    g.lastWave = w.id;
    L.toast(g, w.name + ' ' + w.desc, '#9fd8ff');
    L.emit(g, 'wave', p.x, p.y, w);
    if (w.pattern === 'surge') { g.surge = w.seconds; g.surgeMult = w.mult; return; }
    var n = Math.min(w.count + w.perStep * step, L.data.horde.maxAlive - g.enemies.length);
    var ring = Math.sqrt(g.view.w * g.view.w + g.view.h * g.view.h) / 2 + 40, a0 = g.rng() * TAU;
    for (var i = 0; i < n; i++) {
      var x, y;
      if (w.pattern === 'ring') { var a = a0 + i / n * TAU; x = p.x + Math.cos(a) * ring * 0.75; y = p.y + Math.sin(a) * ring * 0.75; }
      else if (w.pattern === 'line') {
        // A column coming from one side, across your path.
        var side = Math.cos(a0), off = (i - n / 2) * 34;
        x = p.x + (side > 0 ? ring : -ring) + (g.rng() - 0.5) * 30; y = p.y + off;
      } else { var b = g.rng() * TAU; x = p.x + Math.cos(b) * ring; y = p.y + Math.sin(b) * ring; }
      L.spawnEnemy(g, w.type, x, y);
    }
  }

  function spawnBoss(g) {
    if (g.time < g.nextBoss) return;
    var h = L.data.horde, pt = ringPoint(g);
    g.nextBoss += h.bossEvery;
    g.bossCount = (g.bossCount || 0) + 1;
    g.boss = L.spawnEnemy(g, h.bosses[(g.bossCount - 1) % h.bosses.length], pt.x, pt.y);
    var bt = g.boss.type;
    L.emit(g, 'boss', pt.x, pt.y);
    L.toast(g, '¡Llegó ' + bt.article + ' ' + bt.name + '!', '#ff5a5a');
  }

  function pickType(g, minute) {
    var list = L.data.enemies, total = 0, i;
    for (i = 0; i < list.length; i++) if (list[i].weight > 0 && list[i].from <= minute) total += list[i].weight;
    var roll = g.rng() * total;
    for (i = 0; i < list.length; i++) {
      if (!(list[i].weight > 0) || list[i].from > minute) continue;
      roll -= list[i].weight;
      if (roll < 0) return list[i].id;
    }
    return list[0].id;
  }

  // How much tougher enemies are at a difficulty step: compounding growth, plus a late squeeze.
  L.enemyHpScale = function (step) {
    var h = L.data.horde;
    return Math.pow(1 + h.hpGrowth, step) * Math.pow(1 + h.lateGrowth, Math.max(0, step - h.lateStart));
  };

  // Enemies get tougher with the clock: health and damage scale with the difficulty step they appear in.
  L.spawnEnemy = function (g, typeId, x, y) {
    var t = L.findEnemy(typeId), h = L.data.horde, step = L.difficulty(g) - 1;
    var hp = t.hp * L.enemyHpScale(step) * (g.hordeHp || 1);
    var e = {
      id: g.nextId++, type: t,
      x: L.clamp(x, t.radius, g.arena - t.radius), y: L.clamp(y, t.radius, g.arena - t.radius),
      r: t.radius, speed: t.speed * (1 + Math.min(h.speedMax, h.speedPerLevel * step)), hp: hp, maxHp: hp,
      dps: t.dps * (1 + h.dpsPerLevel * step) * (g.hordeDps || 1), xp: t.xp, dead: false, flash: 0,
      burnDps: 0, burnTtl: 0, stun: 0, slow: 0,
      cd: t.ranged ? t.ranged.every * (0.3 + g.rng() * 0.7) : t.charge ? t.charge.every : 0, // first attack at a random moment
      fuse: 0
    };
    g.enemies.push(e);
    return e;
  };

  function buildGrid(g) {
    var maxR = 0;
    g.grid.clear();
    for (var i = 0; i < g.enemies.length; i++) {
      var e = g.enemies[i];
      g.grid.insert(e);
      if (e.r > maxR) maxR = e.r;
    }
    g.maxR = maxR;
  }

  function moveEnemies(g, dt) {
    var p = g.player, q = g._q;
    for (var i = 0; i < g.enemies.length; i++) {
      var e = g.enemies[i];
      if (e.dead) continue;
      var dx = p.x - e.x, dy = p.y - e.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      // Stunned enemies stand still; slowed ones move at half speed.
      var sp = e.stun > 0 ? 0 : e.slow > 0 ? e.speed * 0.5 : e.speed;
      if (e.stun > 0) e.stun -= dt;
      if (e.slow > 0) e.slow -= dt;
      var t = e.type;
      if (t.ranged && e.stun <= 0) {
        // Keeps its distance (backs off if you get close) and spits mud when you are in range.
        var rg = t.ranged;
        if (d < rg.keep) sp = -sp * 0.6; else if (d < rg.keep + 40) sp = 0;
        e.cd -= dt;
        if (e.cd <= 0 && d < rg.range) {
          e.cd = rg.every;
          var dmg = rg.damage * (1 + L.data.horde.dpsPerLevel * (L.difficulty(g) - 1)) * (g.hordeDps || 1) * (e.elite ? L.data.horde.elite.dps : 1);
          // One shot, or a fan of `count` spread over `spread` radians (the Reina del Granizo).
          var n = rg.count || 1, base = Math.atan2(dy, dx), hail = !!rg.count;
          for (var k = 0; k < n; k++) {
            var a = base + (n > 1 ? (k / (n - 1) - 0.5) * rg.spread : 0);
            g.enemyShots.push({ x: e.x, y: e.y, vx: Math.cos(a) * rg.speed, vy: Math.sin(a) * rg.speed, r: hail ? 7 : 6, damage: dmg, life: rg.range / rg.speed + 0.5, hail: hail });
          }
          L.emit(g, 'spit', e.x, e.y);
        }
      } else if (t.charge && e.stun <= 0) {
        // Walk, crouch (windup, standing still so you can see it coming), then a straight charge.
        var ch = t.charge;
        e.cd -= dt;
        if (e.mode === 'wind') {
          sp = 0;
          if (e.cd <= 0) { e.mode = 'dash'; e.cd = ch.dash; e.dashX = dx / d; e.dashY = dy / d; }
        } else if (e.mode === 'dash') {
          e.x = L.clamp(e.x + e.dashX * ch.speed * dt, e.r, g.arena - e.r);
          e.y = L.clamp(e.y + e.dashY * ch.speed * dt, e.r, g.arena - e.r);
          sp = 0;
          if (e.cd <= 0) { e.mode = null; e.cd = ch.every; }
        } else if (e.cd <= 0 && d < 600) { e.mode = 'wind'; e.cd = ch.windup; L.emit(g, 'boss', e.x, e.y); }
      } else if (t.bomb) {
        // Runs at you; close enough, it stops and lights the fuse.
        if (e.fuse <= 0 && d < t.bomb.trigger) e.fuse = t.bomb.fuse;
        if (e.fuse > 0) {
          sp = 0;
          e.fuse -= dt;
          if (e.fuse <= 0) { L.explodeBomb(g, e, true); continue; }
        }
      }
      var vx = dx / d * sp, vy = dy / d * sp;
      // Push away from overlapping neighbours so the horde spreads out instead of stacking.
      q.length = 0;
      g.grid.query(e.x, e.y, e.r + g.maxR, q);
      var sx = 0, sy = 0;
      for (var j = 0; j < q.length; j++) {
        var o = q[j];
        if (o === e) continue;
        var ox = e.x - o.x, oy = e.y - o.y, rr = e.r + o.r, d2 = ox * ox + oy * oy;
        if (d2 < rr * rr && d2 > 1e-4) {
          var od = Math.sqrt(d2), push = (rr - od) / rr;
          // Big enemies shove small ones aside but barely get pushed themselves.
          var w = o.r / (e.r + o.r) * 2;
          sx += ox / od * push * w; sy += oy / od * push * w;
        }
      }
      var push = Math.abs(sp) * 1.5;
      e.x = L.clamp(e.x + (vx + sx * push) * dt, e.r, g.arena - e.r);
      e.y = L.clamp(e.y + (vy + sy * push) * dt, e.r, g.arena - e.r);
      if (e.flash > 0) e.flash -= dt;
      if (d < e.r + p.r && p.invuln <= 0) { p.hp -= e.dps * dt * (1 - p.stats.armor); p.hurt = 0.15; }
      if (e.burnTtl > 0) {
        e.burnTtl -= dt;
        L.applyHit(g, e, e.burnDps * dt, 0, 0);
        if (e.burnTtl <= 0) e.burnDps = 0;
      }
    }
  }

  // Mud from the Escupelodos: flies straight, hurts you on contact (Escudo helps, invulnerability blocks it).
  function updateEnemyShots(g, dt) {
    var p = g.player, n = 0;
    for (var i = 0; i < g.enemyShots.length; i++) {
      var s = g.enemyShots[i];
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if (s.life <= 0) continue;
      var rr = s.r + p.r;
      if ((s.x - p.x) * (s.x - p.x) + (s.y - p.y) * (s.y - p.y) < rr * rr) {
        if (p.invuln <= 0) { p.hp -= s.damage * (1 - p.stats.armor); p.hurt = 0.15; }
        continue;
      }
      g.enemyShots[n++] = s;
    }
    g.enemyShots.length = n;
  }

  // A Tronador blowing up. If its fuse ran out next to you it hurts you; if you killed it first, only the
  // creatures around it get hurt (so a lucky kill sets off a chain).
  L.explodeBomb = function (g, e, hurtsPlayer) {
    var b = e.type.bomb, p = g.player, scale = (1 + L.data.horde.dpsPerLevel * (L.difficulty(g) - 1)) * (g.hordeDps || 1);
    if (!e.dead) { e.dead = true; }
    if (hurtsPlayer && p.invuln <= 0) {
      var rr = b.radius + p.r;
      if ((p.x - e.x) * (p.x - e.x) + (p.y - e.y) * (p.y - e.y) < rr * rr) { p.hp -= b.damage * scale * (1 - p.stats.armor); p.hurt = 0.2; }
    }
    var around = L.nearby(g, e.x, e.y, b.radius);
    for (var i = 0; i < around.length; i++) if (around[i] !== e) L.applyHit(g, around[i], around[i].maxHp * 0.6, 0, 1);
    g.effects.push({ kind: 'ring', x: e.x, y: e.y, r: b.radius, ttl: 0.35, max: 0.35, color: '#ffb347' });
    L.emit(g, 'explode', e.x, e.y);
  };

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

  // Duel rule "Cuerpo a cuerpo": damage depends on the kind of ability. 1 everywhere else.
  function kindMul(g, a) { return g.kindMul ? (g.kindMul[a.def.kind] || 1) : 1; }

  function hitArea(g, a, x, y, r, dmg, slow) {
    dmg *= kindMul(g, a);
    var list = L.nearby(g, x, y, r);
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      L.hit(g, e, dmg, a.def.proc);
      if (slow && !e.dead) e.slow = Math.max(e.slow || 0, slow);
    }
  }

  var PIECES = {
    // Shoots at the nearest enemy; extra projectiles fan out.
    projectile: function (g, a, dt) {
      var s = a.stats, p = g.player;
      a.timer -= dt;
      if (a.timer > 0) return;
      var t = nearestEnemy(g, s.range * (g.rangeMul || 1));
      if (!t) { a.timer = 0; return; }
      a.timer = cooldown(g, s);
      var base = Math.atan2(t.y - p.y, t.x - p.x), count = s.count + p.stats.extraProjectiles;
      L.emit(g, 'shot', p.x, p.y);
      for (var i = 0; i < count; i++) {
        var ang = base + (i - (count - 1) / 2) * 0.18;
        g.projectiles.push({
          x: p.x, y: p.y, vx: Math.cos(ang) * s.speed, vy: Math.sin(ang) * s.speed, r: s.radius, proc: a.def.proc,
          damage: s.damage * kindMul(g, a), pierce: s.pierce, life: s.range * (g.rangeMul || 1) / s.speed + 0.2, hit: [], color: a.def.color, dead: false,
          boomerang: !!a.def.boomerang, back: false
        });
      }
    },

    // Hits everything around you every few seconds.
    nova: function (g, a, dt) {
      var s = a.stats, p = g.player;
      a.timer -= dt;
      if (a.timer > 0) return;
      a.timer = cooldown(g, s);
      var r = s.radius * p.stats.area;
      hitArea(g, a, p.x, p.y, r, s.damage, s.slow);
      g.effects.push({ kind: 'ring', x: p.x, y: p.y, r: r, ttl: 0.3, max: 0.3, color: a.def.color });
    },

    // Blades spinning around you; each enemy can be hit once every `hitEvery` seconds.
    orbit: function (g, a, dt) {
      var s = a.stats, p = g.player, q = g._q, area = p.stats.area;
      var size = s.size * area, radius = s.radius * area;
      a.angle = (a.angle + s.spin * dt) % TAU;
      a.blades.length = s.count;
      a.bladeSize = size;
      if (a.hits.size > 3000) a.hits.clear();
      for (var b = 0; b < s.count; b++) {
        var ang = a.angle + b * TAU / s.count;
        var bx = p.x + Math.cos(ang) * radius, by = p.y + Math.sin(ang) * radius;
        a.blades[b] = { x: bx, y: by };
        q.length = 0;
        g.grid.query(bx, by, size + g.maxR, q);
        for (var i = 0; i < q.length; i++) {
          var e = q[i];
          if (e.dead) continue;
          var rr = size + e.r, dx = e.x - bx, dy = e.y - by;
          if (dx * dx + dy * dy >= rr * rr) continue;
          var last = a.hits.get(e.id);
          if (last !== undefined && g.time - last < s.hitEvery) continue;
          a.hits.set(e.id, g.time);
          L.hit(g, e, s.damage * kindMul(g, a), a.def.proc);
        }
      }
    },

    // Constant damage to everyone inside the cloud, applied in ticks.
    aura: function (g, a, dt) {
      var s = a.stats, p = g.player;
      a.timer -= dt;
      if (a.timer > 0) return;
      a.timer += s.tick;
      hitArea(g, a, p.x, p.y, s.radius * p.stats.area, s.dps * s.tick);
    },

    // Bolts on random enemies within range, each hitting a small area.
    strike: function (g, a, dt) {
      var s = a.stats, p = g.player;
      a.timer -= dt;
      if (a.timer > 0) return;
      var targets = L.nearby(g, p.x, p.y, s.range * (g.rangeMul || 1));
      if (!targets.length) { a.timer = 0; return; }
      a.timer = cooldown(g, s);
      for (var n = 0; n < s.count && targets.length; n++) {
        var t = targets.splice(g.rng.int(targets.length), 1)[0];
        var splash = s.splash * p.stats.area;
        hitArea(g, a, t.x, t.y, splash, s.damage);
        g.effects.push({ kind: 'bolt', x: t.x, y: t.y, r: splash, ttl: 0.25, max: 0.25, color: a.def.color });
      }
    }
  };
  // Plants a turret where you stand; each turret shoots the nearest enemy until it runs out.
  PIECES.turret = function (g, a, dt) {
    var s = a.stats, p = g.player;
    a.turrets = a.turrets || [];
    a.timer -= dt;
    if (a.timer <= 0) {
      a.timer = cooldown(g, s);
      if (a.turrets.length >= s.max) a.turrets.shift();
      a.turrets.push({ x: p.x, y: p.y, life: s.life, cd: 0 });
    }
    for (var i = a.turrets.length - 1; i >= 0; i--) {
      var t = a.turrets[i];
      t.life -= dt; t.cd -= dt;
      if (t.life <= 0) { a.turrets.splice(i, 1); continue; }
      if (t.cd > 0) continue;
      var near = L.nearby(g, t.x, t.y, s.range * (g.rangeMul || 1)), best = null, bd = Infinity;
      for (var k = 0; k < near.length; k++) {
        var e = near[k], d2 = (e.x - t.x) * (e.x - t.x) + (e.y - t.y) * (e.y - t.y);
        if (d2 < bd) { bd = d2; best = e; }
      }
      if (!best) continue;
      t.cd = s.fireEvery;
      var d = Math.sqrt(bd) || 1;
      g.projectiles.push({ x: t.x, y: t.y, vx: (best.x - t.x) / d * s.speed, vy: (best.y - t.y) / d * s.speed, r: 5, proc: a.def.proc,
        damage: s.damage * kindMul(g, a), pierce: 0, life: s.range / s.speed + 0.2, hit: [], color: a.def.color, dead: false });
    }
  };

  // Beams of light turning around you; each enemy can be burned once every `hitEvery` seconds.
  PIECES.sweep = function (g, a, dt) {
    var s = a.stats, p = g.player, area = p.stats.area;
    a.angle = (a.angle + s.spin * dt) % TAU;
    a.beams = a.beams || [];
    a.beams.length = s.count;
    if (a.hits.size > 3000) a.hits.clear();
    var len = s.length * area * (g.rangeMul || 1), w = s.width * area;
    for (var b = 0; b < s.count; b++) {
      var ang = a.angle + b * TAU / s.count, ex = p.x + Math.cos(ang) * len, ey = p.y + Math.sin(ang) * len;
      a.beams[b] = { x2: ex, y2: ey, w: w };
      var list = L.alongSegment(g, p.x, p.y, ex, ey, w);
      for (var i = 0; i < list.length; i++) {
        var e = list[i], last = a.hits.get(e.id);
        if (last !== undefined && g.time - last < s.hitEvery) continue;
        a.hits.set(e.id, g.time);
        L.hit(g, e, s.damage * kindMul(g, a), a.def.proc);
      }
    }
  };

  L.PIECES = PIECES;

  // Runs the player's abilities and their projectiles against g.enemies. The duel uses it with a "view" in
  // which the only enemy is the other fighter.
  L.runAbilities = function (g, dt) {
    updateAbilities(g, dt);
    updateProjectiles(g, dt);
  };

  function updateProjectiles(g, dt) {
    var q = g._q, n = 0;
    for (var i = 0; i < g.projectiles.length; i++) {
      var pr = g.projectiles[i];
      if (pr.boomerang) {
        // Goes out for its whole range, then turns around and chases you back; it can hit again on the way back.
        if (!pr.back && pr.life <= 0.2) { pr.back = true; pr.hit.length = 0; pr.life = 3; }
        if (pr.back) {
          var bp = g.player, bx = bp.x - pr.x, by = bp.y - pr.y, bd = Math.sqrt(bx * bx + by * by) || 1;
          var bs = Math.sqrt(pr.vx * pr.vx + pr.vy * pr.vy) * 1.1;
          pr.vx = bx / bd * bs; pr.vy = by / bd * bs;
          if (bd < bp.r + pr.r) pr.life = 0;
        }
      }
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
      if (g.bounce) {
        // Duel rule: projectiles bounce off the walls instead of leaving.
        if (pr.x < 0 || pr.x > g.arena) { pr.vx = -pr.vx; pr.x = L.clamp(pr.x, 0, g.arena); pr.hit.length = 0; }
        if (pr.y < 0 || pr.y > g.arena) { pr.vy = -pr.vy; pr.y = L.clamp(pr.y, 0, g.arena); pr.hit.length = 0; }
      }
      if (pr.life <= 0 || pr.x < 0 || pr.y < 0 || pr.x > g.arena || pr.y > g.arena) pr.dead = true;
      if (!pr.dead) {
        q.length = 0;
        g.grid.query(pr.x, pr.y, pr.r + g.maxR, q);
        for (var j = 0; j < q.length; j++) {
          var e = q[j];
          if (e.dead || pr.hit.indexOf(e.id) !== -1) continue;
          var rr = pr.r + e.r, dx = e.x - pr.x, dy = e.y - pr.y;
          if (dx * dx + dy * dy >= rr * rr) continue;
          pr.hit.push(e.id);
          L.hit(g, e, pr.damage, pr.proc);
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
        if (d < p.r + 8) { p.xp += gem.v; L.emit(g, 'gem', gem.x, gem.y); continue; }
        var sp = Math.min(d / dt, 520);
        gem.x += dx / d * sp * dt; gem.y += dy / d * sp * dt;
      }
      g.gems[n++] = gem;
    }
    g.gems.length = n;
  }

  function updateTimed(list, dt) {
    var n = 0;
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      it.ttl -= dt;
      if (it.ttl > 0) list[n++] = it;
    }
    list.length = n;
  }

  function checkLevel(g) {
    var p = g.player;
    while (p.xp >= L.xpToNext(p.level)) {
      p.xp -= L.xpToNext(p.level);
      p.level++;
      g.pendingLevels++;
      L.emit(g, 'level', p.x, p.y);
    }
    if (g.pendingLevels > 0 && !g.choice) g.choice = L.makeChoices(g);
  }
})(this.Lluvia = this.Lluvia || {});
