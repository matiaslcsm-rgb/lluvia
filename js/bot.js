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
    return { x: fx, y: fy };
  };

  // Prefers upgrading what it has and filling ability slots early; a low-skill bot often picks at random.
  L.botChoose = function (g, bot) {
    var opts = g.choice, p = g.player;
    if (bot.rng() > bot.skill) return L.choose(g, bot.rng.int(opts.length));
    var best = 0, bestScore = -Infinity;
    opts.forEach(function (o, i) {
      var s = { upAbility: 3, newAbility: p.abilities.length < 3 ? 2.5 : 1, upPassive: 1.5, newPassive: 1.2, heal: 1 }[o.type];
      s += bot.rng() * 0.5;
      if (s > bestScore) { bestScore = s; best = i; }
    });
    return L.choose(g, best);
  };
})(this.Lluvia = this.Lluvia || {});
