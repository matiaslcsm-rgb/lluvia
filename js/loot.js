// Gathering (data/loot.js): searching furniture, the backpack, bandages, and bullets taken from the backpack.
// A piece is searched once per game: g.searched holds "building:floor:piece". What a piece has is seeded by its
// place, so the same wardrobe always holds the same; what doesn't fit in the backpack stays in it for later.
(function (L) {
  'use strict';

  function D() { return L.data.loot; }

  // ---- The backpack ----
  L.makePack = function (g) {
    g.pack = { slots: [], size: D().slots };
    g.searched = new Set();
    g.leftover = new Map();
    if (D().startAmmo) L.packAdd(g, 'balas', D().startAmmo);
    return g.pack;
  };

  // Puts n of an item in the backpack: first on top of slots of the same item, then in empty slots. Returns how
  // many didn't fit.
  L.packAdd = function (g, id, n) {
    var P = g.pack, stack = D().items[id].stack;
    P.slots.forEach(function (sl) { if (n > 0 && sl.id === id && sl.n < stack) { var k = Math.min(n, stack - sl.n); sl.n += k; n -= k; } });
    while (n > 0 && P.slots.length < P.size) { var k = Math.min(n, stack); P.slots.push({ id: id, n: k }); n -= k; }
    return n;
  };
  L.packCount = function (g, id) { return g.pack ? g.pack.slots.reduce(function (a, sl) { return a + (sl.id === id ? sl.n : 0); }, 0) : 0; };
  // Takes up to n of an item, from the last slots first. Returns how many it took.
  L.packTake = function (g, id, n) {
    var P = g.pack, took = 0;
    for (var i = P.slots.length - 1; i >= 0 && took < n; i--) {
      var sl = P.slots[i];
      if (sl.id !== id) continue;
      var k = Math.min(sl.n, n - took);
      sl.n -= k; took += k;
      if (!sl.n) P.slots.splice(i, 1);
    }
    return took;
  };

  // "2 trapos, 1 venda"
  L.lootText = function (list) {
    return list.map(function (q) { var nm = D().items[q[0]].name; return q[1] + ' ' + (q[1] === 1 ? nm[0] : nm[1]); }).join(', ');
  };

  // ---- Searching ----
  // What a piece holds: rolled from its place (building, floor, piece), so it is always the same.
  L.lootOf = function (plan, f, k, t) {
    var table = D().pieces[t];
    if (!table) return [];
    var seed = ((plan.index + 1) * 73856093) ^ ((f + 7) * 19349663) ^ ((k + 1) * 83492791), rng = L.makeRng((seed >>> 0) || 1), out = [];
    table.forEach(function (row) {
      if (rng() < row[1]) out.push([row[0], row[2] + Math.floor(rng() * (row[3] - row[2] + 1))]);
      else rng();
    });
    return out;
  };

  // The nearest piece you can search, on your floor, within reach: { plan, f, k, t, key } or null.
  L.searchTarget = function (g) {
    var p = g.player, city = g.city, f = p.floor || 0;
    var plan = f && p.house ? p.house : L.cityHouseAt && L.cityHouseAt(city, p.x, p.y);
    if (!plan) return null;
    var lv = L.planLevel(plan, f);
    if (!lv || !lv.solidPx) return null;
    var reach = D().reach * city.scale + p.r, best = null, bd = Infinity;
    lv.solidPx.forEach(function (o, k) {
      var t = lv.furniture[k].t, key = plan.index + ':' + f + ':' + k;
      if (!D().pieces[t] || g.searched.has(key) && !g.leftover.has(key)) return;
      var dx = p.x - o.x, dy = p.y - o.y, a = dx * o.ax + dy * o.ay, b = dx * o.fx + dy * o.fy;
      var d = Math.hypot(a - L.clamp(a, -o.hw, o.hw), b - L.clamp(b, -o.hd, o.hd));
      if (d < reach && d < bd) { bd = d; best = { plan: plan, f: f, k: k, t: t, key: key }; }
    });
    return best;
  };

  // Each frame: holding E (input.use) next to a piece searches it; H (input.heal) uses a bandage.
  L.updateLoot = function (g, dt, input) {
    if (!g.pack) return;
    var p = g.player;
    var tg = L.searchTarget(g);
    g.lootTarget = tg;
    if (input && input.use && tg && !g.respawn) {
      if (!g.search || g.search.key !== tg.key) g.search = { key: tg.key, t: 0 };
      g.search.t += dt;
      if (L.makeNoise && Math.floor(g.search.t * 2) !== Math.floor((g.search.t - dt) * 2)) L.makeNoise(g, p.x, p.y, L.data.senses.noise.search, p.floor, p);
      if (g.search.t >= D().search) {
        var list = g.leftover.has(tg.key) ? g.leftover.get(tg.key) : L.lootOf(tg.plan, tg.f, tg.k, tg.t), got = [], left = [];
        list.forEach(function (q) {
          var rest = L.packAdd(g, q[0], q[1]);
          if (q[1] - rest > 0) got.push([q[0], q[1] - rest]);
          if (rest > 0) left.push([q[0], rest]);
        });
        g.searched.add(tg.key);
        if (left.length) g.leftover.set(tg.key, left); else g.leftover.delete(tg.key);
        var name = tg.t;
        L.toast(g, got.length ? 'Encontraste: ' + L.lootText(got) + (left.length ? '. No entra todo en la mochila.' : '.') :
          left.length ? 'La mochila está llena.' : 'No hay nada.', got.length ? '#d9cfa6' : '#8d8672');
        L.emit(g, 'loot', p.x, p.y, { piece: name, got: got });
        g.search = null;
      }
    } else g.search = null;
    // A bandage.
    if (input && input.heal && !g.healHeld && p.hp < p.stats.maxHp && L.packTake(g, 'vendas', 1)) {
      p.hp = Math.min(p.stats.maxHp, p.hp + D().heal);
      L.toast(g, 'Te vendaste.', '#e8e2d6');
    }
    g.healHeld = !!(input && input.heal);
  };

  // ---- Bullets from the backpack ----
  // When a reload ends: fill the magazine from the backpack, as far as there are bullets.
  L.reloadFromPack = function (g, gun) {
    var need = L.gunMag(gun) - gun.ammo;
    gun.ammo += L.packTake(g, 'balas', need);
  };
})(this.Lluvia = this.Lluvia || {});
