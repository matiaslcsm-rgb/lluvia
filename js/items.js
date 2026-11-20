// Items (stacking) and the chests that sell them.
(function (L) {
  'use strict';

  L.findItem = function (id) { return L.findById(L.data.items, id); };

  // Effect numbers for `n` copies: base plus perStack for every copy after the first.
  L.itemParams = function (def, n) {
    var out = {}, k;
    for (k in def.base) out[k] = def.base[k] + ((def.perStack && def.perStack[k]) || 0) * (n - 1);
    return out;
  };

  L.itemChance = function (def, n) {
    return Math.min(0.95, def.chance + (def.chancePerStack || 0) * (n - 1));
  };

  // Called by recalcStats: adds stat items to `m` and rebuilds the on-hit / on-kill lists.
  L.applyItemMods = function (g, m) {
    var p = g.player;
    p.onHit = []; p.onKill = [];
    p.itemOrder.forEach(function (id) {
      var def = L.findItem(id), n = p.items[id];
      if (def.kind === 'stat') m[def.stat] += def.perStack * n;
      else if (def.kind === 'onHit') p.onHit.push({ def: def, n: n, chance: L.itemChance(def, n), params: L.itemParams(def, n) });
      else if (def.kind === 'onKill') p.onKill.push({ def: def, n: n, params: L.itemParams(def, n) });
    });
  };

  L.addItem = function (g, id) {
    var p = g.player;
    if (!p.items[id]) { p.items[id] = 0; p.itemOrder.push(id); }
    p.items[id]++;
    L.recalcStats(g);
  };

  L.rollItem = function (g, weights) {
    var total = 0, r, rarity = null;
    for (r in weights) total += weights[r];
    var roll = g.rng() * total;
    for (r in weights) { roll -= weights[r]; if (roll < 0) { rarity = r; break; } }
    if (!rarity) rarity = Object.keys(weights)[0];
    var pool = L.data.items.filter(function (it) { return it.rarity === rarity; });
    return g.rng.pick(pool);
  };

  // ---- Chests ----

  L.chestCost = function (g) {
    var c = L.data.chests;
    return Math.round(c.base * Math.pow(1 + c.growth, L.difficulty(g) - 1));
  };

  L.dropChest = function (g, x, y, kind) {
    var chest = { x: L.clamp(x, 30, g.arena - 30), y: L.clamp(y, 30, g.arena - 30), r: 16, kind: kind || 'normal' };
    g.chests.push(chest);
    return chest;
  };

  // Keeps `count` normal chests around the arena, never right on top of the player.
  L.fillChests = function (g) {
    var c = L.data.chests, normal = 0, p = g.player;
    g.chests.forEach(function (ch) { if (ch.kind === 'normal') normal++; });
    for (var tries = 0; normal < c.count && tries < 50; tries++) {
      var x = 100 + g.rng() * (g.arena - 200), y = 100 + g.rng() * (g.arena - 200);
      if ((x - p.x) * (x - p.x) + (y - p.y) * (y - p.y) < 300 * 300) continue;
      L.dropChest(g, x, y, 'normal');
      normal++;
    }
  };

  // Walking into a chest opens it if you can pay (the boss chest is free).
  L.updateChests = function (g) {
    var p = g.player, opened = false;
    for (var i = g.chests.length - 1; i >= 0; i--) {
      var ch = g.chests[i], rr = ch.r + p.r;
      if ((ch.x - p.x) * (ch.x - p.x) + (ch.y - p.y) * (ch.y - p.y) >= rr * rr) continue;
      var cost = ch.kind === 'boss' ? 0 : L.chestCost(g);
      if (g.gold < cost) continue;
      g.gold -= cost;
      g.chests.splice(i, 1);
      var item = L.rollItem(g, ch.kind === 'boss' ? L.data.chests.bossWeights : L.data.chests.weights);
      L.addItem(g, item.id);
      var copies = p.items[item.id];
      L.toast(g, item.name + (copies > 1 ? ' ×' + copies : '') + ': ' + item.desc, L.data.rarities[item.rarity].color);
      opened = true;
    }
    if (opened && g.spawning) L.fillChests(g);
  };
})(this.Lluvia = this.Lluvia || {});
