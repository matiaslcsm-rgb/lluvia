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
  L.difficulty = function (g) {
    // With the clock of the day (L.data.mode.night): a step for the dark, and `level` more for every night gone.
    if (g.night && L.clockOf) return 1 + L.data.mode.nights.level * Math.max(0, L.nightOf(L.clockOf(g)) - 1);
    return 1 + Math.floor(g.time * (g.pace || 1) / 60);
  };

  // opts: { seed, characterId, viewW, viewH, noSpawn, explore, lives, listen } — listen: keep events for screen and sound;
  // explore: only the map (no horde, shrines or errands; the screen hides the clock)
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
      spawning: !opts.noSpawn || !!opts.night,
      night: !!opts.night,   // the zombies follow the clock of the day (L.data.mode.night)
      explore: !!opts.explore,
      spawnAcc: 0,
      nextBoss: h.bossFirst,
      boss: null,
      nextWave: h.waveFirst, // next storm event
      lastWave: null,
      surge: 0,              // seconds left of a "marea" storm event (more spawns)
      enemyShots: [],        // mud the Escupelodos spit at you
      arena: opts.city ? opts.city.size : h.arena,
      city: opts.city || null,  // the streets you play in (js/city.js), or null for the open square
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
      hordeHp: (opts.storm ? L.data.meta.storm.hpMul : 1) * L.pactValue(opts.pacts, 'hordeHp', 1),   // Tormenta eterna, Pactos
      spawnMul: L.pactValue(opts.pacts, 'spawnMul', 1),
      pactHp: L.pactValue(opts.pacts, 'playerHp', 1),
      chestMul: L.pactValue(opts.pacts, 'chestMul', 1),
      hordeDps: opts.storm ? L.data.meta.storm.dpsMul : 1,
      forecast: opts.forecast ? L.findById(L.data.forecasts, opts.forecast) : null, // the match's weather
      grid: new L.Grid(64),
      maxR: 0,             // widest live enemy this tick; grid queries pad by it so big ones are never missed
      _q: []               // reused query buffer for the top-level loops (never re-entered)
    };
    var fc = g.forecast;
    if (fc) {
      g.hordeHp *= fc.hordeHp || 1; g.hordeDps *= fc.hordeDps || 1;
      g.spawnMul *= fc.spawnMul || 1; g.chestMul *= fc.chestMul || 1;
      g.toasts.push({ text: 'Pronóstico: ' + fc.name + '. ' + fc.desc, color: fc.color, ttl: 8 });
    }
    g.gunsOnly = !!opts.gunsOnly;
    if (g.gunsOnly) {
      // Only a gun: no automatic ability, no ulti, and a horde that builds up slowly (data/guns.js, L.data.mode).
      g.player.ulti = null;
      var mh = L.data.mode.horde;
      g.pace = mh.pace; g.hordeHp *= mh.hpMul; g.hordeDps *= mh.dpsMul; g.spawnMul *= mh.spawnMul;
      g.nextBoss = mh.bossFirst; g.nextMini = mh.miniFirst; g.nextWave = mh.waveFirst;
    } else {
      L.addAbility(g, ch.start);
      var ulti = L.findUlti(ch.ulti);
      g.player.ulti = { def: ulti, cd: ulti.cooldown / 2 }; // the first one is ready halfway through its cooldown
    }
    recalcStats(g);
    if (opts.gun) L.giveGun(g, opts.gun);
    if (opts.night && L.makePack) L.makePack(g); // a backpack, and bullets come from it (js/loot.js)
    if (opts.night && L.makeHands) L.makeHands(g); // fists and hand weapons (js/melee.js)
    if (opts.night && L.makeNeeds) L.makeNeeds(g); // eating and drinking (js/needs.js)
    if (opts.night && L.makeWeather) L.makeWeather(g); // the weather (js/weather.js)
    if (opts.night && L.makeRest) L.makeRest(g); // energy and sleep (js/rest.js)
    if (opts.night) g.lives = 1;                   // one life, as in Project Zomboid (the user's answer 10)
    g.player.hp = g.player.stats.maxHp;
    // In a city you start at its starting spot (the plaza), so the first chests land around you, not in a corner.
    if (g.city && g.city.start) { var fr = L.cityFree(g.city, g.city.start.x, g.city.start.y); g.player.x = fr.x; g.player.y = fr.y; }
    if (g.spawning && !g.explore) L.fillChests(g); // no chests while exploring the map (they come back with "juntar", stage 48)
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
      stillRegen: 0, goldMul: 0, stillDamage: 0, rushDamage: 0, maxHpMul: 0 };
    p.passives.forEach(function (ps) { m[ps.def.stat] += ps.def.perLevel * ps.level; });
    L.applyItemMods(g, m);
    var fs = g.forecast && g.forecast.stats;
    if (fs) for (var k in fs) m[k] += fs[k];
    var meta = g.meta || {}; // your Cuaderno upgrades (js/meta.js); none for the rivals
    var oldMax = p.stats.maxHp;
    p.stats = {
      speed: b.speed * (1 + m.speedMul + (meta.speedMul || 0)),
      maxHp: (b.maxHp + m.maxHpAdd) * Math.max(0.2, 1 + (meta.maxHpMul || 0) + m.maxHpMul) * (g.pactHp || 1),
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
    p.hp = Math.min(p.hp, p.stats.maxHp);
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
      if (g.night) spawnByClock(g, dt);
      else if (g.spawning) { spawn(g, dt); spawnBoss(g); spawnMini(g); spawnWave(g); }
      updateTimed(g.effects, dt);
      updateTimed(g.toasts, dt);
      if (g.respawn <= 0) { g.respawn = 0; revive(g); }
      return;
    }
    if (p.invuln > 0) p.invuln -= dt;
    L.tickUlti(p, dt);
    // Asleep (js/rest.js): the clock runs fast (gdt: seconds of the game's clock) and you do nothing but wake up.
    var gdt = dt;
    if (g.night && L.updateRest) {
      L.updateRest(g, dt, dt * L.timeRate(g), input);
      if (p.asleep) { gdt = dt * L.timeRate(g); g.slept = (g.slept || 0) + gdt - dt; input = {}; }
    }
    movePlayer(g, dt, input);
    if (g.city && L.updateClock) L.updateClock(g, gdt, input); // the flashlight (js/clock.js)
    if (g.pack) L.updateLoot(g, dt, input);                    // searching furniture, bandages (js/loot.js)
    if (g.night && L.updateMelee) L.updateMelee(g, dt, input);  // hand weapons, air (js/melee.js)
    if (g.night && L.updateFire) L.updateFire(g, dt, input);    // molotovs and their fire (js/craft.js)
    if (g.night && L.updateNeeds) L.updateNeeds(g, gdt);        // eating, drinking, fainting (js/needs.js)
    if (g.night && L.updateWeather) L.updateWeather(g, gdt);     // rain, storm, fog, heat, cold, flooding (js/weather.js)
    if (g.night) spawnByClock(g, dt);
    else if (g.spawning) { spawn(g, dt); spawnBoss(g); spawnMini(g); spawnWave(g); }
    buildGrid(g);
    moveEnemies(g, dt);
    updateEnemyShots(g, dt);
    if (p.hp <= 0) { loseLife(g); return; }
    updateAbilities(g, dt);
    if (p.gun) L.updateGun(g, dt, input);
    updateProjectiles(g, dt);
    removeDead(g);
    updateGems(g, dt);
    L.updateChests(g);
    if (!g.explore) L.updateShrines(g, dt);
    updateTimed(g.effects, dt);
    updateTimed(g.toasts, dt);
    var regen = p.stats.regen + p.stats.stillRegen * (p.still || 0);
    p.hp = Math.min(p.stats.maxHp, regen >= 0 || p.hp <= 1 ? p.hp + Math.max(0, regen) * dt : Math.max(1, p.hp + regen * dt)); // a drain never kills
    if (p.hurt > 0) p.hurt -= dt;
    checkLevel(g);
  }

  // Stance for the Ancla / Raíz / Racha items: `still` fills in 1.5 s standing and drains fast when you move;
  // `rush` fills in 3 s moving and drops to nothing when you stop.
  L.updateStance = function (p, moving, dt) {
    if (moving) { p.still = Math.max(0, (p.still || 0) - dt * 3); p.rush = Math.min(1, (p.rush || 0) + dt / 3); }
    else { p.still = Math.min(1, (p.still || 0) + dt / 1.5); p.rush = 0; }
  };

  // Moves the player by (dx, dy), against the city walls if there is a city (on the floor you are on: stairs
  // take you up and down as you walk them, js/interiors.js).
  function stepPlayer(g, dx, dy) {
    var p = g.player;
    if (g.city) { var o = L.cityLevelMove(g.city, p, p.x + dx, p.y + dy, p.r, g._mv || (g._mv = {})); p.x = o.x; p.y = o.y; return; }
    p.x = L.clamp(p.x + dx, p.r, g.arena - p.r);
    p.y = L.clamp(p.y + dy, p.r, g.arena - p.r);
  }
  L.stepPlayer = stepPlayer;

  function movePlayer(g, dt, input) {
    var p = g.player, x = input.x || 0, y = input.y || 0;
    // Fainted (js/needs.js): you can't move.
    if (p.faint > 0) { x = 0; y = 0; }
    // Readying a blow with a long weapon (right button): half speed.
    if (p.readying) { x *= 0.5; y *= 0.5; }
    // Covering yourself (Space): slower, and it needs air (js/melee.js).
    p.blocking = !!(g.night && input.block && p.air > L.data.melee.air.low && !(p.faint > 0));
    if (p.blocking) { x *= L.data.melee.block.slow; y *= L.data.melee.block.slow; }
    // Aiming (right button) you stand still; the sight closes (js/skills.js).
    if (g.night && p.gun && L.updateAim && p.hand !== 'melee') { if (input.aiming) { x = 0; y = 0; } L.updateAim(g, dt, input, !!(x || y)); }
    // Running (Shift): faster, but it costs air and makes more noise (js/melee.js, data/melee.js run).
    var run = 1;
    if (g.night && input.run && (x || y) && p.air > L.data.melee.air.low && !input.aiming) {
      run = L.data.melee.run.mul; p.running = true;
      // Heavy, running costs more air (js/loot.js, weight).
      p.air = Math.max(0, p.air - L.data.melee.run.cost * (1 + 0.15 * L.packOver(g)) * L.wx(g, 'run') * dt); p.airRest = L.data.melee.air.rest;
    } else p.running = false;
    var len = Math.sqrt(x * x + y * y);
    if (len > 1) { x /= len; y /= len; }
    if ((x || y) && !(p.gun && input.aimX !== undefined)) { p.dirX = x; p.dirY = y; } // the way you face (with a gun: where you aim)
    // Your steps make a little noise (js/senses.js).
    if (g.night && (x || y)) {
      g.stepT = (g.stepT || 0) - dt;
      if (g.stepT <= 0) { g.stepT = 0.5; L.makeNoise(g, p.x, p.y, (p.running ? L.data.senses.noise.run : L.data.senses.noise.walk) * L.wx(g, 'steps'), p.floor, p); }
    }
    L.updateStance(p, len > 0.2, dt);
    var slow = (g.pack ? 1 - L.packSlow(g) : 1) * run; // a bolso in your hand gets in the way (js/loot.js)
    if (g.weather) slow *= 1 - L.floodSlow(g, p.x, p.y);  // wading in flood water (js/weather.js)
    stepPlayer(g, x * p.stats.speed * slow * dt, y * p.stats.speed * slow * dt);
  }

  // ---- Horde ----

  function ringPoint(g) {
    var a = g.rng() * TAU;
    var ring = Math.sqrt(g.view.w * g.view.w + g.view.h * g.view.h) / 2 + 40;
    var pt = { x: g.player.x + Math.cos(a) * ring, y: g.player.y + Math.sin(a) * ring };
    if (g.city) {
      // In a city the point is moved onto a street; try a few angles until that street is still off screen.
      for (var k = 0; k < 8; k++) {
        var fr = L.cityWalkable(g.city, pt.x, pt.y) ? pt : L.cityFree(g.city, pt.x, pt.y);
        var dx = fr.x - g.player.x, dy = fr.y - g.player.y;
        if (dx * dx + dy * dy > ring * ring * 0.7) return fr;
        a = g.rng() * TAU; ring *= 1.1;
        pt = { x: g.player.x + Math.cos(a) * ring, y: g.player.y + Math.sin(a) * ring };
      }
    }
    return pt;
  }

  function spawn(g, dt) {
    var h = L.data.horde, step = L.difficulty(g) - 1, minute = g.time / 60;
    var mult = 1;
    if (g.surge > 0) { g.surge -= dt; mult = g.surgeMult || 1; }
    g.spawnAcc += (h.spawnBase + h.spawnPerLevel * step) * mult * (g.spawnMul || 1) * (g.underCloud ? L.data.shrines.cloud.spawnMul : 1) * dt;
    var eliteChance = minute < h.eliteFrom ? 0 : h.eliteChance + h.elitePerMinute * (minute - h.eliteFrom);
    while (g.spawnAcc >= 1) {
      g.spawnAcc -= 1;
      if (g.enemies.length >= h.maxAlive) continue;
      var pt = ringPoint(g);
      var e = L.spawnEnemy(g, pickType(g, minute), pt.x, pt.y);
      if (g.rng() < eliteChance) L.makeElite(e);
    }
  }

  // Zombies by the clock of the day (L.data.mode.nights): few by day, many at night, more every night. By day the
  // ones far away that you don't see go off, until there are no more than the day's.
  function spawnByClock(g, dt) {
    var N = L.data.mode.nights, h = L.data.horde, k = L.clockOf(g), dark = 1 - k.light, n = Math.max(1, L.nightOf(k));
    var grow = 1 + N.perNight * (n - 1), rate = (N.day.rate + (N.dark.rate - N.day.rate) * dark) * grow;
    var alive = Math.round((N.day.alive + (N.dark.alive - N.day.alive) * dark) * grow);
    g.spawnAcc += rate * dt;
    var p0 = g.player, s = g.city.scale;
    while (g.spawnAcc >= 1) {
      g.spawnAcc -= 1;
      if (g.enemies.length >= Math.min(alive, h.maxAlive)) continue;
      // Somewhere on a street between `near` and `far` meters, where you don't see it.
      for (var tries = 0; tries < 6; tries++) {
        var a = g.rng() * TAU, r0 = (N.near + g.rng() * (N.far - N.near)) * s;
        var pt = L.cityFree(g.city, p0.x + Math.cos(a) * r0, p0.y + Math.sin(a) * r0);
        if (Math.hypot(pt.x - p0.x, pt.y - p0.y) < N.near * 0.8 * s) continue;
        if (L.canSee && L.canSee(g.city, p0, p0.aim || 0, pt.x, pt.y, 0)) continue;
        var z = L.spawnEnemy(g, N.type || pickType(g, g.time / 60), pt.x, pt.y);
        z.floor = 0;
        break;
      }
    }
    // The ones that are far and not after you go away: the city keeps its zombies around you.
    g.enemies.forEach(function (e) {
      if (!e.dead && e.mind !== 'chase' && Math.hypot(e.x - p0.x, e.y - p0.y) > N.recycle * s) { e.dead = true; e.gone = true; }
    });
    // By day, the extra ones leave: the farthest one you don't see, every so often.
    g.leaveAcc = (g.leaveAcc || 0) + dt;
    if (dark < 0.2 && g.enemies.length > alive && g.leaveAcc >= N.leaveEvery) {
      g.leaveAcc = 0;
      var p = g.player, far = N.leave * g.city.scale, best = null, bd = far;
      g.enemies.forEach(function (e) {
        var d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d > bd && !e.type.boss) { bd = d; best = e; }
      });
      if (best) { best.dead = true; best.gone = true; }
    }
  }
  L.spawnByClock = spawnByClock;

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

  // Champions of the Mad God: halfway between bosses. They take the health bar only if no boss has it.
  function spawnMini(g) {
    var h = L.data.horde;
    if (g.nextMini === undefined) g.nextMini = h.miniFirst;
    if (g.time < g.nextMini) return;
    var pt = ringPoint(g);
    g.nextMini += h.bossEvery;
    g.miniCount = (g.miniCount || 0) + 1;
    var e = L.spawnEnemy(g, h.minis[(g.miniCount - 1) % h.minis.length], pt.x, pt.y);
    if (!g.boss || g.boss.dead) g.boss = e;
    L.emit(g, 'boss', pt.x, pt.y);
    L.toast(g, '¡Cuidado! Se acerca ' + e.type.article + ' ' + e.type.name + '.', '#ff8a5a');
  }
  L.spawnMini = spawnMini;

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
      cd: t.ranged ? t.ranged.every * (0.3 + g.rng() * 0.7) : t.charge ? t.charge.every : t.summon ? t.summon.every * 0.4 : t.slam ? t.slam.every * 0.5 : 0, // first attack at a random moment
      fuse: 0
    };
    if (g.city && !L.cityWalkable(g.city, e.x, e.y)) { var fr = L.cityFree(g.city, e.x, e.y); e.x = fr.x; e.y = fr.y; }
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

  // Half health: the boss changes for the rest of the fight (faster, more shots, calls help).
  function enterPhase(g, e) {
    var ph = e.type.phase;
    e.phased = true;
    if (ph.speed) e.speed *= ph.speed;
    if (ph.summon) {
      for (var i = 0; i < ph.summon.count; i++) {
        var a = i / ph.summon.count * Math.PI * 2;
        L.spawnEnemy(g, ph.summon.type, e.x + Math.cos(a) * (e.r + 30), e.y + Math.sin(a) * (e.r + 30));
      }
    }
    L.emit(g, 'boss', e.x, e.y);
    var art = e.type.article || '';
    L.toast(g, '¡' + art.charAt(0).toUpperCase() + art.slice(1) + ' ' + e.type.name + ' ' + ph.text + '!', '#ff5a5a');
  }

  function moveEnemies(g, dt) {
    var p = g.player, q = g._q, pullX = 0, pullY = 0, pullMax = 0, city = g.city, dir = g._dir || (g._dir = {}), mv = g._emv || (g._emv = {});
    var brain = g._brain || (g._brain = {});
    if (g.night) L.swapNoises(g); // last frame's noises are heard now (js/senses.js)
    // You upstairs (or in the basement): the creatures on the ground floor head for the stair that leads to you.
    var pf = p.floor || 0, go = city && pf ? L.stairToward(p.house, 0, pf) : null, gp = go ? (pf > 0 ? go.footPx : go.topPx) : null;
    if (city && !(g.flowT > 0)) { L.cityFlow(city, gp ? gp[0] : p.x, gp ? gp[1] : p.y); g.flowT = L.data.city.flowEvery; }
    if (city) g.flowT -= dt;
    for (var i = 0; i < g.enemies.length; i++) {
      var e = g.enemies[i];
      if (e.dead) continue;
      var dx = p.x - e.x, dy = p.y - e.y, ef = e.floor || 0;
      // On another floor it goes for the stair toward yours: up it from the foot, or down it from the top.
      if (city && ef !== pf) {
        var st = L.stairToward(ef ? e.house : p.house, ef, pf);
        if (st && st.footPx) {
          var upw = pf > ef, wa = upw ? st.footPx : st.topPx, wb = upw ? st.topPx : st.footPx;
          var wp = e.stairOn === st || Math.hypot(wa[0] - e.x, wa[1] - e.y) < 30 ? wb : wa;
          dx = wp[0] - e.x; dy = wp[1] - e.y;
        }
      }
      // A plain zombie with the clock of the day thinks for itself: wanders, investigates noises, chases you only when
      // it sees you (js/senses.js).
      var tt = e.type, thinks = g.night && city && !tt.boss && !tt.ranged && !tt.charge && !tt.summon && !tt.slam && !tt.bomb && !tt.pull, mul = 1, noFlow = false;
      if (thinks) {
        L.zombieThink(g, e, dt, brain);
        mul = brain.mul;
        if (!brain.chase) { dx = brain.x - e.x; dy = brain.y - e.y; noFlow = true; }
      }
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      // Stunned enemies stand still; slowed ones move at half speed.
      var sp = (e.stun > 0 ? 0 : e.slow > 0 ? e.speed * 0.5 : e.speed) * mul;
      if (thinks && g.weather && g.weather.rise > 0) sp *= 1 - L.floodSlow(g, e.x, e.y); // wading too
      if (e.stun > 0) e.stun -= dt;
      if (e.downT > 0) e.downT -= dt; // on the floor (drawn lying, js/view/render.js)
      if (e.slow > 0) e.slow -= dt;
      var t = e.type;
      if (t.phase && !e.phased && e.hp < e.maxHp * t.phase.at) enterPhase(g, e);
      var ph = e.phased ? t.phase : null;
      if (t.pull && e.stun <= 0 && d < t.pull.radius) {
        // Stronger the closer you are; added up over every Sumidero and capped below.
        var f = t.pull.strength * (1 - d / t.pull.radius);
        pullX -= dx / d * f; pullY -= dy / d * f;
        pullMax = Math.max(pullMax, t.pull.max);
      }
      if (t.ranged && e.stun <= 0) {
        // Keeps its distance (backs off if you get close) and spits mud when you are in range.
        var rg = t.ranged;
        if (d < rg.keep) sp = -sp * 0.6; else if (d < rg.keep + 40) sp = 0;
        e.cd -= dt;
        if (e.cd <= 0 && d < rg.range) {
          e.cd = rg.every * (ph && ph.every || 1);
          var dmg = rg.damage * (1 + L.data.horde.dpsPerLevel * (L.difficulty(g) - 1)) * (g.hordeDps || 1) * (e.elite ? L.data.horde.elite.dps : 1);
          // One shot, or a fan of `count` spread over `spread` radians (the Reina del Granizo).
          var n = (ph && ph.count) || rg.count || 1, base = Math.atan2(dy, dx), hail = !!rg.count;
          for (var k = 0; k < n; k++) {
            var a = base + (n > 1 ? (k / (n - 1) - 0.5) * rg.spread : 0);
            g.enemyShots.push({ x: e.x, y: e.y, vx: Math.cos(a) * rg.speed, vy: Math.sin(a) * rg.speed, r: hail ? 7 : 6, damage: dmg, life: rg.range / rg.speed + 0.5, hail: hail, floor: e.floor || 0 });
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
          var nx2 = L.clamp(e.x + e.dashX * ch.speed * dt, e.r, g.arena - e.r), ny2 = L.clamp(e.y + e.dashY * ch.speed * dt, e.r, g.arena - e.r);
          if (city && !L.cityWalkable(city, nx2, ny2)) e.cd = 0; // hit a wall: the charge ends
          else { e.x = nx2; e.y = ny2; }
          sp = 0;
          if (e.cd <= 0) { e.mode = null; e.cd = ch.every * (ph && ph.every || 1); }
        } else if (e.cd <= 0 && d < 600) { e.mode = 'wind'; e.cd = ch.windup; L.emit(g, 'boss', e.x, e.y); }
      } else if (t.summon && e.stun <= 0) {
        // Hangs back and calls a pack of creatures around itself.
        var su = t.summon;
        if (d < su.keep) sp = -sp * 0.6; else if (d < su.keep + 40) sp = 0;
        e.cd -= dt;
        if (e.cd <= 0) {
          e.cd = su.every;
          for (var k2 = 0; k2 < su.count; k2++) {
            var a2 = k2 / su.count * Math.PI * 2;
            L.spawnEnemy(g, su.type, e.x + Math.cos(a2) * (e.r + 20), e.y + Math.sin(a2) * (e.r + 20));
          }
          L.emit(g, 'split', e.x, e.y);
        }
      } else if (t.slam && e.stun <= 0) {
        // Walks up, stops and shows a ring (windup), then hits the floor: everything inside the ring gets hurt.
        var sl = t.slam;
        e.cd -= dt;
        if (e.mode === 'slam') {
          sp = 0;
          if (e.cd <= 0) {
            e.mode = null; e.cd = sl.every;
            var sx2 = p.x - e.x, sy2 = p.y - e.y;
            if (sx2 * sx2 + sy2 * sy2 < (sl.radius + p.r) * (sl.radius + p.r) && p.invuln <= 0) {
              p.hp -= sl.damage * (1 + L.data.horde.dpsPerLevel * (L.difficulty(g) - 1)) * (g.hordeDps || 1) * (1 - p.stats.armor);
              p.hurt = 0.25;
            }
            L.emit(g, 'explode', e.x, e.y);
          }
        } else if (e.cd <= 0 && d < sl.reach) { e.mode = 'slam'; e.cd = sl.windup; }
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
      // In the city they go around the blocks, along the streets, until they are close (the flow field is on the
      // ground floor: not for one on a stair or upstairs).
      if (city && d > 60 && !e.z && !noFlow && L.cityDir(city, e.x, e.y, dir)) { vx = dir.x * sp; vy = dir.y * sp; }
      if (thinks && (vx || vy)) e.face = Math.atan2(vy, vx); // it looks where it walks
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
      var ex = L.clamp(e.x + (vx + sx * push) * dt, e.r, g.arena - e.r), ey = L.clamp(e.y + (vy + sy * push) * dt, e.r, g.arena - e.r);
      if (city) { L.cityLevelMove(city, e, ex, ey, 4, mv); ex = mv.x; ey = mv.y; }
      // A wanderer that walks into a wall turns away.
      if (thinks && sp > 0 && Math.hypot(ex - e.x, ey - e.y) < sp * dt * 0.2) e.blocked = true;
      e.x = ex; e.y = ey;
      if (e.flash > 0) e.flash -= dt;
      var touch = Math.hypot(p.x - e.x, p.y - e.y);
      if (touch < e.r + p.r && (e.floor || 0) === pf && p.invuln <= 0) {
        var bite = e.dps * dt * (1 - p.stats.armor);
        // Covering yourself stops part of a blow from the front, paid with air (js/melee.js, data/melee.js block).
        if (p.blocking) {
          var B = L.data.melee.block, aimB = p.aim !== undefined ? p.aim : Math.atan2(p.dirY || 0, p.dirX || 1);
          var diffB = Math.abs(((Math.atan2(e.y - p.y, e.x - p.x) - aimB) % TAU + 3 * Math.PI) % TAU - Math.PI);
          if (diffB < B.arc * Math.PI / 360) {
            var kind = p.hand === 'melee' && p.melee ? L.meleeDef(p.melee.id).skill : 'gun', stop = bite * B[kind];
            bite -= stop; p.air = Math.max(0, p.air - stop * B.air); p.airRest = L.data.melee.air.rest;
          }
        }
        p.hp -= bite; p.hurt = 0.15;
      }
      if (e.burnTtl > 0) {
        e.burnTtl -= dt;
        L.applyHit(g, e, e.burnDps * dt, 0, 0);
        if (e.burnTtl <= 0) e.burnDps = 0;
      }
    }
    // The Sumideros' pull moves you (not while you are invulnerable, so coming back is safe).
    var pull = Math.sqrt(pullX * pullX + pullY * pullY);
    g.pulled = pull > 1 && p.invuln <= 0 ? pull : 0;
    if (g.pulled) {
      var k = Math.min(1, pullMax / pull);
      stepPlayer(g, pullX * k * dt, pullY * k * dt);
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
      if ((s.floor || 0) === (p.floor || 0) && (s.x - p.x) * (s.x - p.x) + (s.y - p.y) * (s.y - p.y) < rr * rr) {
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
      if (e.gone) continue; // walked off (by day, js/game.js spawnByClock): leaves nothing
      // With the clock of the day experience isn't picked up: killing gives it (the user's answer 9).
      if (g.night) { g.player.xp += e.xp; continue; }
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
      else if (g.city) {
        // Walls stop bullets, those of the floor it was shot on (yours: the player shoots them all).
        if (pr.floor === undefined) { pr.floor = g.player.floor || 0; pr.house = g.player.house; }
        if (!L.cityLevelOpen(g.city, pr.floor, pr.house, pr.x, pr.y)) pr.dead = true;
      }
      if (!pr.dead) {
        q.length = 0;
        g.grid.query(pr.x, pr.y, pr.r + g.maxR, q);
        for (var j = 0; j < q.length; j++) {
          var e = q[j];
          if (e.dead || pr.hit.indexOf(e.id) !== -1 || (g.city && (e.floor || 0) !== (pr.floor || 0))) continue;
          var rr = pr.r + e.r, dx = e.x - pr.x, dy = e.y - pr.y;
          if (dx * dx + dy * dy >= rr * rr) continue;
          pr.hit.push(e.id);
          // A plain zombie that thinks (js/senses.js) only dies from a bullet through its head; one in the body stops
          // it a second and may drop it or make it reel (docs/ZOMBOID.md, answers 10 and 12).
          if (g.night && pr.bullet && e.face !== undefined) bodyOrHead(g, e, pr, dt);
          else L.hit(g, e, pr.damage, pr.proc);
          if (pr.pierce <= 0) { pr.dead = true; break; }
          pr.pierce--;
        }
      }
      if (!pr.dead) g.projectiles[n++] = pr;
    }
    g.projectiles.length = n;
  }

  function bodyOrHead(g, e, pr, dt) {
    if (L.headHit(g, e, pr, pr.x - pr.vx * dt, pr.y - pr.vy * dt)) {
      L.applyHit(g, e, e.hp + 1, 0, 0);
      L.gainSkill(g, 'punteria', L.data.skills.list.punteria.headshot);
      L.emit(g, 'headshot', e.x, e.y);
      return;
    }
    var close = 1 - L.clamp(Math.hypot(e.x - pr.ox, e.y - pr.oy) / (pr.range || 600), 0, 1);
    e.flash = 0.1;
    e.stun = Math.max(e.stun || 0, 1);
    if (g.rng() < pr.knock * (0.5 + close)) { e.stun = Math.max(e.stun, 2.5); e.downT = 2.5; }
    else if (g.rng() < pr.stagger) e.slow = Math.max(e.slow || 0, 1.5);
    // It knows where the shot came from now.
    e.mind = 'investigate'; e.goX = pr.ox; e.goY = pr.oy; e.linger = 4; e.look = 0;
    L.gainSkill(g, 'punteria', L.data.skills.list.punteria.body);
    L.emit(g, 'bodyhit', e.x, e.y);
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
