// The AI that plays an arena: dodges, goes for chests it can pay and picks level-up options.
// `skill` (0 to 1) makes it dodge from farther away, wander less and choose better.
// The same bot plays the 7 rivals and the simulated games.
(function (L) {
  'use strict';

  var TAU = Math.PI * 2;

  L.makeBot = function (seed, skill) {
    var rng = L.makeRng(seed);
    return {
      rng: rng,
      skill: skill,
      flee: 110 + 130 * skill,       // starts running from enemies this close
      chestPull: 0.4 + 0.6 * skill,  // how much it cares about chests
      wobble: rng() * TAU,           // its own wandering pattern
      noise: (1 - skill) * 0.9       // how sloppy its movement is
    };
  };

  L.botInput = function (g, bot) {
    var p = g.player, fx = 0, fy = 0, flee = bot.flee, flee2 = flee * flee, i;
    for (i = 0; i < g.enemies.length; i++) {
      var e = g.enemies[i], dx = p.x - e.x, dy = p.y - e.y, d2 = dx * dx + dy * dy;
      if (d2 < flee2) {
        var d = Math.sqrt(d2) || 1, w = (flee - d) / flee * (e.type.boss ? 3 : 1);
        fx += dx / d * w; fy += dy / d * w;
      }
    }
    // Mud flying at it counts as a threat too.
    for (i = 0; i < g.enemyShots.length; i++) {
      var s = g.enemyShots[i], sx = p.x - s.x, sy = p.y - s.y, s2 = sx * sx + sy * sy;
      if (s2 < 120 * 120) { var sd = Math.sqrt(s2) || 1; fx += sx / sd * 1.5; fy += sy / sd * 1.5; }
    }
    var cost = L.chestCost(g), best = null, bestD = Infinity;
    for (i = 0; i < g.chests.length; i++) {
      var c = g.chests[i];
      if (c.kind !== 'boss' && g.gold < cost) continue;
      var cd = (c.x - p.x) * (c.x - p.x) + (c.y - p.y) * (c.y - p.y);
      if (cd < bestD) { bestD = cd; best = c; }
    }
    if (best) {
      var bd = Math.sqrt(bestD) || 1;
      fx += (best.x - p.x) / bd * bot.chestPull;
      fy += (best.y - p.y) / bd * bot.chestPull;
    } else {
      var a = g.time * 0.5 + bot.wobble;
      fx += Math.cos(a) * 0.4; fy += Math.sin(a) * 0.4;
    }
    var m = 150;
    if (p.x < m) fx += 1;
    if (p.y < m) fy += 1;
    if (p.x > g.arena - m) fx -= 1;
    if (p.y > g.arena - m) fy -= 1;
    if (bot.noise > 0) {
      var na = bot.rng() * TAU;
      fx += Math.cos(na) * bot.noise; fy += Math.sin(na) * bot.noise;
    }
    if (g.city && (fx || fy)) {
      // In the streets: of 16 directions, take the open one closest to where it wants to go.
      var want = Math.atan2(fy, fx), bestA = want, bestS = -Infinity, look = 60;
      for (var k = 0; k < 16; k++) {
        var a2 = want + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * TAU / 16;
        if (!L.cityFits(g.city, p.x + Math.cos(a2) * look, p.y + Math.sin(a2) * look, L.data.city.body)) continue;
        var score = Math.cos(a2 - want);
        if (score > bestS) { bestS = score; bestA = a2; }
      }
      var len = Math.sqrt(fx * fx + fy * fy);
      fx = Math.cos(bestA) * len; fy = Math.sin(bestA) * len;
    }
    return { x: fx, y: fy, autoAim: true };
  };

  // Ulti in the horde: when a crowd (or the boss) is close, aimed at the middle of it.
  L.botUlti = function (g, bot) {
    var p = g.player;
    if (!L.ultiReady(p) || g.respawn > 0) return false;
    var near = L.nearby(g, p.x, p.y, 280);
    var boss = near.filter(function (e) { return e.type.boss; })[0];
    if (!boss && near.length < 14) return false;
    var x = 0, y = 0;
    if (boss) { x = boss.x; y = boss.y; } else { near.forEach(function (e) { x += e.x; y += e.y; }); x /= near.length; y /= near.length; }
    return L.castUlti(g, x, y);
  };

  // Ulti in a duel: as soon as the other one is in reach.
  L.botDuelUlti = function (d, i) {
    var me = d.fighters[i], foe = d.fighters[1 - i];
    if (!L.ultiReady(me)) return false;
    var dist = Math.sqrt((foe.x - me.x) * (foe.x - me.x) + (foe.y - me.y) * (foe.y - me.y));
    var reach = { meteors: 550, quake: 300, dash: 360, beam: 850, roots: 320, pull: 420, shrapnel: 400, flash: 650 }[me.ulti.def.kind];
    return dist < reach && L.castDuelUlti(d, i, foe.x, foe.y);
  };

  // Prefers upgrading what it has and filling ability slots early; a low-skill bot often picks at random.
  L.botChoose = function (g, bot) {
    var opts = g.choice, p = g.player;
    if (bot.rng() > bot.skill) return L.choose(g, bot.rng.int(opts.length));
    var best = 0, bestScore = -Infinity;
    opts.forEach(function (o, i) {
      var s = { fusion: 10, upAbility: 3, newAbility: p.abilities.length < 3 ? 2.5 : 1, upPassive: 1.5, newPassive: 1.2, heal: 1 }[o.type];
      s += bot.rng() * 0.5;
      if (s > bestScore) { bestScore = s; best = i; }
    });
    return L.choose(g, best);
  };
})(this.Lluvia = this.Lluvia || {});
