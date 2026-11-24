// Shrines in your barrio: optional risks you choose to take.
//  - Santuario del Trueno: touch it to start a 20 s challenge (elites come for you). Survive it without losing a
//    life and it leaves a boss chest.
//  - Pozo de los deseos: costs a quarter of your gold; heads you get double back, tails you lose it.
//  - Mercader errante: sells you one of 3 items for gold (a chest lets luck pick; he lets you choose).
//  - Lluvia de oro: a golden cloud drifts across; under it you earn gold, but the horde comes faster.
//  - Encargos del barrio: small timed tasks (hunt, stay untouched, open chests) with a reward if you make it.
// Only the watched arena has them (the bots don't use them), so they don't change the rivals' balance.
(function (L) {
  'use strict';

  L.data.shrines = {
    first: 180,          // first one at 3:00
    every: 150,          // then one every 2:30, alternating kinds
    life: 60,            // it disappears if you don't touch it in this time
    challenge: { seconds: 20, elites: 3, perStep: 0.5 },
    well: { share: 0.25, min: 10 },
    // Golden cloud: gold per second under it grows with the clock like gold per kill.
    cloud: { first: 300, every: 240, seconds: 18, speed: 60, radius: 120, gold: 6, spawnMul: 1.8 },
    // Prices are the current chest cost times this; the odds are better than a chest's.
    merchant: { offers: 3, weights: { comun: 55, raro: 38, legendario: 5, maldito: 2 },
      price: { comun: 1.6, raro: 3.2, legendario: 9, maldito: 2.5 } },
    // Errands start on their own between shrines; failing one costs nothing.
    errand: { first: 90, every: 150,
      kinds: {
        caza: { seconds: 30, base: 20, perStep: 6, reward: 'chest' },
        intacto: { seconds: 12, reward: 'gold', gold: 2 },
        cofres: { seconds: 45, count: 2, reward: 'gold', gold: 1.5 }
      },
      order: ['caza', 'intacto', 'cofres'] }
  };

  L.updateShrines = function (g, dt) {
    if (!g.events) return; // only where someone is watching
    var S = L.data.shrines, p = g.player;
    g.shrines = g.shrines || [];
    if (g.nextShrine === undefined) g.nextShrine = S.first;
    if (g.time >= g.nextShrine) {
      g.nextShrine += S.every;
      g.shrineCount = (g.shrineCount || 0) + 1;
      var kind = ['mercader', 'trueno', 'pozo'][g.shrineCount % 3];
      var a = g.rng() * Math.PI * 2, d = 380 + g.rng() * 200;
      var sh = { kind: kind, x: L.clamp(p.x + Math.cos(a) * d, 60, g.arena - 60), y: L.clamp(p.y + Math.sin(a) * d, 60, g.arena - 60), r: 22, life: S.life, active: false };
      if (g.city && !L.cityWalkable(g.city, sh.x, sh.y)) { var fr = L.cityFree(g.city, sh.x, sh.y); sh.x = fr.x; sh.y = fr.y; }
      g.shrines.push(sh);
      L.toast(g, { trueno: 'Apareció un Santuario del Trueno: tocalo si te animás a un desafío.',
        pozo: 'Apareció un Pozo de los deseos: tocalo para jugarte un cuarto de tu oro.',
        mercader: 'Llegó el Mercader errante: tocalo para ver qué vende.' }[kind], '#c9b8ff');
    }
    updateCloud(g, dt);
    updateErrand(g, dt);
    for (var i = g.shrines.length - 1; i >= 0; i--) {
      var s = g.shrines[i];
      if (s.active) {
        s.timer -= dt;
        if (g.lives < s.lives) { // lost a life during the challenge: failed
          g.shrines.splice(i, 1);
          L.toast(g, 'Fallaste el desafío del Trueno.', '#ff9a7a');
        } else if (s.timer <= 0) {
          g.shrines.splice(i, 1);
          L.dropChest(g, s.x, s.y, 'boss');
          L.toast(g, '¡Superaste el desafío! El Trueno te dejó un cofre.', '#ffd27a');
          L.emit(g, 'level', s.x, s.y);
        }
        continue;
      }
      s.life -= dt;
      if (s.life <= 0) { g.shrines.splice(i, 1); continue; }
      var rr = s.r + p.r;
      if ((s.x - p.x) * (s.x - p.x) + (s.y - p.y) * (s.y - p.y) >= rr * rr) continue;
      if (s.kind === 'trueno') startChallenge(g, s);
      else if (s.kind === 'mercader') { if (g.choice) continue; openShop(g); g.shrines.splice(i, 1); }
      else { useWell(g, s); g.shrines.splice(i, 1); }
    }
  };

  function startChallenge(g, s) {
    var C = L.data.shrines.challenge, step = L.difficulty(g) - 1, p = g.player;
    s.active = true;
    s.timer = C.seconds;
    s.lives = g.lives;
    var n = Math.round(C.elites + C.perStep * step);
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, types = ['rastrero', 'bruto', 'veloz', 'escupidor'];
      L.makeElite(L.spawnEnemy(g, types[i % types.length], p.x + Math.cos(a) * 420, p.y + Math.sin(a) * 420));
    }
    L.toast(g, '¡Desafío del Trueno! Aguantá ' + C.seconds + ' segundos sin perder una vida.', '#c9b8ff');
    L.emit(g, 'boss', s.x, s.y);
  }

  function updateCloud(g, dt) {
    var C = L.data.shrines.cloud, p = g.player;
    if (g.nextCloud === undefined) g.nextCloud = C.first;
    if (!g.cloud && g.time >= g.nextCloud) {
      g.nextCloud += C.every;
      var a = g.rng() * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
      g.cloud = { x: p.x - dx * 400, y: p.y - dy * 400, dx: dx, dy: dy, r: C.radius, life: C.seconds, earned: 0 };
      L.toast(g, '¡Lluvia de oro! Quedate debajo de la nube dorada... si la horda te deja.', '#ffd27a');
    }
    var c = g.cloud;
    g.underCloud = false;
    if (!c) return;
    c.life -= dt;
    c.x = L.clamp(c.x + c.dx * C.speed * dt, 0, g.arena);
    c.y = L.clamp(c.y + c.dy * C.speed * dt, 0, g.arena);
    if (c.life <= 0) {
      if (c.earned > 0) L.toast(g, 'La nube dorada se fue. Juntaste ' + Math.floor(c.earned) + ' de oro.', '#ffd27a');
      g.cloud = null;
      return;
    }
    if (g.respawn > 0 || (c.x - p.x) * (c.x - p.x) + (c.y - p.y) * (c.y - p.y) > c.r * c.r) return;
    g.underCloud = true;
    var rate = C.gold * Math.pow(1 + L.data.horde.goldGrowth, L.difficulty(g) - 1) * (1 + (p.stats.goldMul || 0));
    g.goldAcc = (g.goldAcc || 0) + rate * dt;
    var whole = Math.floor(g.goldAcc);
    if (whole > 0) { g.gold += whole; c.earned += whole; g.goldAcc -= whole; }
  }
  L.updateCloud = updateCloud;

  // The merchant's offers go on the choice screen (the game waits while it is open), plus a way out.
  function openShop(g) {
    var M = L.data.shrines.merchant, base = L.chestCost(g), offers = [], seen = {};
    for (var tries = 0; offers.length < M.offers && tries < 20; tries++) {
      var it = L.rollItem(g, M.weights);
      if (seen[it.id]) continue;
      seen[it.id] = true;
      var rar = L.data.rarities[it.rarity], price = Math.round(base * M.price[it.rarity]);
      offers.push({ type: 'buy', shop: true, id: it.id, price: price, name: it.name, color: rar.color,
        tag: rar.name + ' · ' + price + ' oro', desc: it.desc || '' });
    }
    offers.push({ type: 'leave', shop: true, id: 'leave', name: 'Seguir de largo', color: '#5d6070', tag: 'No comprar', desc: 'El Mercader se va a otro barrio.' });
    g.choice = offers;
  }
  L.openShop = openShop;

  // ---- Encargos del barrio ----
  function startErrand(g, kind) {
    var E = L.data.shrines.errand, k = E.kinds[kind], step = L.difficulty(g) - 1;
    var e = { kind: kind, timer: k.seconds, seconds: k.seconds };
    if (kind === 'caza') { e.goal = Math.round(k.base + k.perStep * step); e.from = g.kills; e.text = 'Cazá ' + e.goal + ' enemigos'; }
    else if (kind === 'intacto') e.text = 'Que no te toquen';
    else { e.goal = k.count; e.from = g.chestsOpened || 0; e.text = 'Abrí ' + e.goal + ' cofres'; }
    g.errand = e;
    L.toast(g, 'Encargo del barrio: ' + e.text + ' en ' + k.seconds + ' segundos.', '#9fe0c0');
    return e;
  }
  L.startErrand = startErrand;

  function errandProgress(g, e) {
    if (e.kind === 'caza') return g.kills - e.from;
    if (e.kind === 'cofres') return (g.chestsOpened || 0) - e.from;
    return 0;
  }
  L.errandProgress = errandProgress;

  function updateErrand(g, dt) {
    var E = L.data.shrines.errand;
    if (g.nextErrand === undefined) g.nextErrand = E.first;
    if (!g.errand && g.time >= g.nextErrand) {
      g.nextErrand += E.every;
      g.errandCount = (g.errandCount || 0) + 1;
      startErrand(g, E.order[(g.errandCount - 1) % E.order.length]);
    }
    var e = g.errand;
    if (!e) return;
    e.timer -= dt;
    var k = E.kinds[e.kind];
    if (e.kind === 'intacto' && e.timer < e.seconds - 0.3 && g.player.hurt > 0) return failErrand(g, 'Te tocaron: encargo perdido.');
    var done = e.kind === 'intacto' ? e.timer <= 0 : errandProgress(g, e) >= e.goal;
    if (done) {
      var p = g.player;
      if (k.reward === 'chest') { L.dropChest(g, p.x + 40, p.y, 'boss'); L.toast(g, '¡Encargo cumplido! Te dejaron un cofre al lado.', '#ffd27a'); }
      else { var gold = Math.round(L.chestCost(g) * k.gold); g.gold += gold; L.toast(g, '¡Encargo cumplido! +' + gold + ' oro', '#ffd27a'); }
      L.emit(g, 'level', p.x, p.y);
      g.errandsDone = (g.errandsDone || 0) + 1;
      g.errand = null;
    } else if (e.timer <= 0) failErrand(g, 'Se acabó el tiempo del encargo.');
  }
  L.updateErrand = updateErrand;

  function failErrand(g, text) { g.errand = null; L.toast(g, text, '#9a9db0'); }

  function useWell(g, s) {
    var W = L.data.shrines.well, bet = Math.max(W.min, Math.floor(g.gold * W.share));
    if (g.gold < bet) { L.toast(g, 'El Pozo pide al menos ' + bet + ' de oro.', '#9a9db0'); s.life = 0; return; }
    if (g.rng() < 0.5) { g.gold += bet; L.toast(g, '¡El Pozo te devolvió el doble! +' + bet + ' oro', '#6fdc6a'); L.emit(g, 'chest', s.x, s.y, { rarity: 'raro', name: '+' + bet + ' oro' }); }
    else { g.gold -= bet; L.toast(g, 'El Pozo se quedó con ' + bet + ' de oro.', '#ff9a7a'); }
  }
})(this.Lluvia = this.Lluvia || {});
