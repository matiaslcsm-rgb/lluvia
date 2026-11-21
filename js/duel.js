// A duel: two players fight with their whole kit in a small arena, under one crazy rule.
//
// Each fighter is a light copy of its player (same abilities, stats and items) with its own position and a
// separate duel health pool, so the duel never touches your health in the horde. The abilities engine runs
// once per side on a "view" where the only enemy is the other fighter.
(function (L) {
  'use strict';

  var LAVA_DPS = 0.08; // share of duel health per second you lose standing in the lava
  var LAVA_MIN = 110;  // the lava stops closing at this radius

  function difficultyStep(m) { return Math.floor(m.time / 60); }

  // Duel health grows with the clock exactly like enemy health, so duels last about the same all match long.
  L.duelPool = function (m, player, rule) {
    var h = L.data.horde, d = L.data.duels;
    return player.stats.maxHp * d.hpMul * Math.pow(1 + h.hpGrowth, difficultyStep(m)) * (rule.poolMul || 1);
  };

  function makeFighter(m, pl, rule, x, y, id) {
    var p = pl.game.player;
    var f = Object.create(p);           // reads abilities, items, char... from the real player
    var pool = L.duelPool(m, p, rule);
    f.stats = Object.create(p.stats);   // same stats, but the health cap is the duel pool
    f.stats.maxHp = pool;
    f.stats.speed = p.stats.speed * (rule.speedMul || 1);
    f.x = x; f.y = y;
    f.r = p.r * (rule.sizeMul || 1);
    f.hp = pool; f.maxHp = pool;
    f.id = id; f.dead = false; f.flash = 0; f.hurt = 0; f.invuln = 0;
    f.still = 0; f.rush = 0;
    f.burnDps = 0; f.burnTtl = 0; f.xp = 0; f.speed = 0; f.dps = 0; f.stun = 0; f.slow = 0;
    f.type = { name: pl.name, gold: 0, goldChance: 0, boss: false, color: p.char.color };
    f.owner = pl;
    // Ranged kits keep their distance; melee kits (orbit, aura, nova) close in. Used by the duel bot.
    f.prefRange = p.abilities.some(function (a) { return a.def.kind === 'projectile' || a.def.kind === 'strike'; }) ? 260 : 60;
    return f;
  }

  // What the abilities engine sees for one side.
  function makeView(d, me, foe) {
    return {
      player: me, enemies: [foe], projectiles: [], effects: d.effects, toasts: [], chests: [],
      grid: new L.Grid(64), maxR: foe.r, rng: d.rng, time: 0, gold: 0, kills: 0, boss: null,
      arena: d.size, bounce: !!d.rule.bounce, _q: [], events: d.events,
      rangeMul: d.rule.rangeMul || 1, kindMul: d.rule.kindMul || null
    };
  }

  // a, b: match players. rule: one of L.data.duelRules (random if omitted).
  L.createDuel = function (m, a, b, rule) {
    var size = L.data.duels.arena;
    rule = rule || m.rng.pick(L.data.duelRules);
    if (L.pactValue(m.pacts, 'mixRules', false)) {
      // Juicio caótico: a second rule on top (its numbers win where both set one).
      var other = m.rng.pick(L.data.duelRules.filter(function (r) { return r.id !== rule.id; })), mixed = {};
      [rule, other].forEach(function (r) { for (var k in r) mixed[k] = r[k]; });
      mixed.id = rule.id + '+' + other.id; mixed.name = rule.name + ' + ' + other.name; mixed.desc = rule.desc + ' ' + other.desc;
      rule = mixed;
    }
    var d = { time: 0, over: false, winner: null, loser: null, timeout: false, size: size, rule: rule, effects: [], rng: m.rng,
      events: (a.game.events || b.game.events) ? [] : null };
    d.players = [a, b];
    d.fighters = [makeFighter(m, a, rule, size * 0.2, size / 2, -1), makeFighter(m, b, rule, size * 0.8, size / 2, -2)];
    d.views = [makeView(d, d.fighters[0], d.fighters[1]), makeView(d, d.fighters[1], d.fighters[0])];
    d.lava = size * 0.75;
    d.creeps = [];
    d.nextCreep = rule.creeps ? 1.5 : Infinity;
    d.creepId = -10;
    d.bots = [a.bot ? L.makeBot(m.rng.int(1e9), a.bot.skill) : null, b.bot ? L.makeBot(m.rng.int(1e9), b.bot.skill) : null];
    [a, b].forEach(function (pl) { pl.game.player.abilities.forEach(function (ab) { ab.timer = 0; ab.hits.clear(); ab.turrets = []; }); });
    return d;
  };

  // Bot movement in a duel: hold its preferred distance, circle around the foe, stay out of the lava.
  L.botDuelInput = function (d, i) {
    var me = d.fighters[i], foe = d.fighters[1 - i], bot = d.bots[i];
    var dx = foe.x - me.x, dy = foe.y - me.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / dist, uy = dy / dist;
    var radial = L.clamp((dist - me.prefRange) / 120, -1, 1);
    var side = Math.sin(d.time * 0.9 + (bot ? bot.wobble : i * 3)) > 0 ? 1 : -1;
    var x = ux * radial - uy * side * 0.7, y = uy * radial + ux * side * 0.7;
    var c = d.size / 2, cx = c - me.x, cy = c - me.y, cd = Math.sqrt(cx * cx + cy * cy) || 1;
    if (d.rule.shrink && cd > d.lava - 60) { x += cx / cd * 2; y += cy / cd * 2; }
    if (bot && bot.noise) { var a = bot.rng() * Math.PI * 2; x += Math.cos(a) * bot.noise * 0.5; y += Math.sin(a) * bot.noise * 0.5; }
    return { x: x, y: y };
  };

  function move(d, f, input, dt) {
    if (f.stun > 0) { f.stun -= dt; input = {}; }
    var x = input.x || 0, y = input.y || 0, len = Math.sqrt(x * x + y * y);
    if (len > 1) { x /= len; y /= len; }
    L.updateStance(f, len > 0.2, dt);
    var speed = f.stats.speed * (f.slow > 0 ? 0.5 : 1);
    if (f.slow > 0) f.slow -= dt;
    var wx = 0, wy = 0;
    if (d.rule.wind) { var wa = d.time * 0.35; wx = Math.cos(wa) * d.rule.wind; wy = Math.sin(wa) * d.rule.wind; }
    f.x = L.clamp(f.x + (x * speed + wx) * dt, f.r, d.size - f.r);
    f.y = L.clamp(f.y + (y * speed + wy) * dt, f.r, d.size - f.r);
  }

  // The view's grid holds the other fighter, where it stands now, and the duel's creeps if there are any.
  function refreshView(v, foe, creeps) {
    v.grid.clear();
    v.grid.insert(foe);
    v.maxR = foe.r;
    v.enemies.length = 1;
    if (!creeps) return;
    for (var i = 0; i < creeps.length; i++) if (!creeps[i].dead) { v.grid.insert(creeps[i]); v.enemies.push(creeps[i]); if (creeps[i].r > v.maxR) v.maxR = creeps[i].r; }
  }

  // Anegados en el Juicio: creeps sized to the duel (their health and bite are shares of the fighters' pool).
  function spawnCreeps(d) {
    var C = d.rule.creeps, F = d.fighters, pool = (F[0].maxHp + F[1].maxHp) / 2, alive = 0, i;
    for (i = 0; i < d.creeps.length; i++) if (!d.creeps[i].dead) alive++;
    for (i = 0; i < C.count && alive < C.max; i++, alive++) {
      var t = L.findEnemy(C.types[d.rng.int(C.types.length)]), side = d.rng.int(4), along = d.rng() * d.size;
      var x = side === 0 ? t.radius : side === 1 ? d.size - t.radius : along, y = side < 2 ? along : side === 2 ? t.radius : d.size - t.radius;
      d.creeps.push({ id: d.creepId--, type: { name: t.name, color: t.color, shape: t.shape, gold: 0, goldChance: 0 }, speed: t.speed, x: x, y: y, r: t.radius,
        hp: pool * C.hp, maxHp: pool * C.hp, dps: pool * C.dps, dead: false, flash: 0, burnDps: 0, burnTtl: 0, stun: 0, slow: 0, credited: false });
    }
  }

  function moveCreeps(d, dt) {
    var F = d.fighters, V = d.views;
    for (var i = 0; i < d.creeps.length; i++) {
      var c = d.creeps[i];
      if (c.dead) continue;
      if (c.flash > 0) c.flash -= dt;
      if (c.burnTtl > 0) { c.burnTtl -= dt; c.hp -= c.burnDps * dt; if (c.hp <= 0) c.dead = true; if (c.burnTtl <= 0) c.burnDps = 0; }
      if (c.stun > 0) { c.stun -= dt; continue; }
      var d0 = (F[0].x - c.x) * (F[0].x - c.x) + (F[0].y - c.y) * (F[0].y - c.y);
      var d1 = (F[1].x - c.x) * (F[1].x - c.x) + (F[1].y - c.y) * (F[1].y - c.y);
      var j = d0 <= d1 ? 0 : 1, f = F[j], dx = f.x - c.x, dy = f.y - c.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var sp = c.speed * (c.slow > 0 ? 0.5 : 1);
      if (c.slow > 0) c.slow -= dt;
      if (dist > f.r + c.r) { c.x += dx / dist * sp * dt; c.y += dy / dist * sp * dt; }
      else if (!(f.invuln > 0)) L.applyHit(V[1 - j], f, c.dps * dt, 0, L.MAX_PROC_DEPTH);
    }
  }

  // Creeps that fell this tick heal whoever brought them down (credited to the side whose turn just ran).
  function creditCreeps(d, i) {
    var f = d.fighters[i], C = d.rule.creeps;
    for (var k = 0; k < d.creeps.length; k++) {
      var c = d.creeps[k];
      if (c.dead && !c.credited) { c.credited = true; if (!f.dead) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * C.heal); L.emit(d.views[i], 'kill', c.x, c.y, c); }
    }
  }

  // Your ulti in a duel: aimed in duel-arena coordinates.
  L.castDuelUlti = function (d, i, x, y) {
    if (d.over) return false;
    refreshView(d.views[i], d.fighters[1 - i], d.creeps);
    return L.castUlti(d.views[i], x, y);
  };

  function tick(d, dt, inputs) {
    d.time += dt;
    var F = d.fighters, V = d.views, i;
    for (i = 0; i < 2; i++) move(d, F[i], inputs[i], dt);
    if (d.rule.creeps) {
      if (d.time >= d.nextCreep) { d.nextCreep += d.rule.creeps.every; spawnCreeps(d); }
      moveCreeps(d, dt);
      creditCreeps(d, d.rng.int(2)); // burns that finished a creep: a coin flip, it doesn't matter much
    }
    for (i = 0; i < 2; i++) { V[i].time = d.time; V[i].procs = L.PROC_BUDGET; refreshView(V[i], F[1 - i], d.creeps); }
    var before = [F[0].hp, F[1].hp];
    for (i = 0; i < 2; i++) {
      var shots = V[i].projectiles.length;
      L.runAbilities(V[i], dt);
      if (d.rule.creeps) creditCreeps(d, i);
      if (d.rule.bounce) for (var s = shots; s < V[i].projectiles.length; s++) if (!V[i].projectiles[s].long) { V[i].projectiles[s].life *= 3; V[i].projectiles[s].long = true; }
    }
    for (i = 0; i < 2; i++) {
      var f = F[i];
      if (f.burnTtl > 0) { f.burnTtl -= dt; L.applyHit(V[1 - i], f, f.burnDps * dt, 0, 0); if (f.burnTtl <= 0) f.burnDps = 0; }
      if (f.flash > 0) f.flash -= dt;
      if (f.invuln > 0) f.invuln -= dt;
      L.tickUlti(f, dt);
    }
    if (d.rule.lifesteal) {
      for (i = 0; i < 2; i++) {
        var dealt = Math.max(0, before[1 - i] - F[1 - i].hp);
        if (!F[i].dead) F[i].hp = Math.min(F[i].maxHp, F[i].hp + dealt * d.rule.lifesteal);
      }
    }
    if (d.rule.shrink) {
      d.lava = Math.max(LAVA_MIN, d.size * 0.75 - (d.size * 0.75 - LAVA_MIN) * d.time / (L.data.duels.maxTime * 0.75));
      var c = d.size / 2;
      for (i = 0; i < 2; i++) {
        var fl = F[i], ld = Math.sqrt((fl.x - c) * (fl.x - c) + (fl.y - c) * (fl.y - c));
        if (ld > d.lava && !fl.dead) L.applyHit(V[1 - i], fl, fl.maxHp * LAVA_DPS * dt, 0, 0);
      }
    }
    if (d.creeps.length > 20) d.creeps = d.creeps.filter(function (c) { return !c.dead; });
    for (i = d.effects.length - 1; i >= 0; i--) { d.effects[i].ttl -= dt; if (d.effects[i].ttl <= 0) d.effects.splice(i, 1); }
    for (i = 0; i < 2; i++) if (F[i].hp <= 0) F[i].dead = true;

    if (F[0].dead || F[1].dead) {
      // Both falling in the same instant: the one with less overkill wins.
      var w = F[0].dead && F[1].dead ? (F[0].hp >= F[1].hp ? 0 : 1) : (F[0].dead ? 1 : 0);
      finish(d, w, false);
    } else if (d.time >= L.data.duels.maxTime) {
      var fa = F[0].hp / F[0].maxHp, fb = F[1].hp / F[1].maxHp;
      finish(d, fa === fb ? d.rng.int(2) : (fa > fb ? 0 : 1), true);
    }
  }

  function finish(d, w, timeout) {
    d.over = true;
    d.timeout = timeout;
    d.winner = d.players[w];
    d.loser = d.players[1 - w];
  }

  // humanInput: your movement if you are one of the two (null otherwise). Bots move themselves.
  L.updateDuel = function (d, dt, humanInput) {
    var scaled = dt * (d.rule.timeScale || 1);
    while (scaled > 1e-9 && !d.over) {
      var step = Math.min(scaled, 1 / 30);
      var inputs = d.players.map(function (pl, i) {
        if (pl.bot || !humanInput) { L.botDuelUlti(d, i); return L.botDuelInput(d, i); }
        return humanInput;
      });
      tick(d, step, inputs);
      scaled -= step;
    }
  };
})(this.Lluvia = this.Lluvia || {});
