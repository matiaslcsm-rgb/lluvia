// Gathering (data/loot.js): searching furniture, the backpack, bandages, and bullets taken from the backpack.
// A piece is searched once per game: g.searched holds "building:floor:piece". What a piece has is seeded by its
// place, so the same wardrobe always holds the same; what doesn't fit in the backpack stays in it for later.
(function (L) {
  'use strict';

  function D() { return L.data.loot; }

  // ---- What you carry ----
  // g.pack.places: your pockets and each bag you wear, in order ({ id: 'bolsillos' | 'rinonera' | ..., slots }).
  // A slot holds one kind of thing up to its stack ({ id, n }), or one hand weapon ({ id: 'w:...', n: 1, dur }).
  L.makePack = function (g) {
    g.pack = { places: [] };
    g.searched = new Set();
    g.leftover = new Map();
    D().wearing.forEach(function (k) { L.wear(g, k); });
    if (D().startAmmo) L.packAdd(g, 'balas', D().startAmmo);
    return g.pack;
  };

  // Puts on a bag of kind k, if you don't wear one of that kind yet. Returns true if you put it on.
  L.wear = function (g, k) {
    if (g.pack.places.some(function (pl) { return pl.id === k; })) return false;
    g.pack.places.push({ id: k, slots: [] });
    return true;
  };

  function isBig(id) { return id.indexOf('w:') === 0 ? L.meleeDef(id.slice(2)).skill === 'media' : !!D().items[id].big; }
  function room(pl) { return D().containers[pl.id].slots - pl.slots.length; }
  function takes(pl, id) { return room(pl) > 0 && (!isBig(id) || D().containers[pl.id].big); }
  L.packBig = isBig;

  // Puts n of an item where it goes: first on top of slots of the same thing, then in a free slot of a place that
  // takes it (small things fit anywhere; big ones only in a bolso or a mochila). Returns how many didn't fit.
  L.packAdd = function (g, id, n) {
    var stack = D().items[id].stack;
    g.pack.places.forEach(function (pl) { pl.slots.forEach(function (sl) { if (n > 0 && sl.id === id && sl.n < stack) { var k = Math.min(n, stack - sl.n); sl.n += k; n -= k; } }); });
    g.pack.places.forEach(function (pl) { while (n > 0 && takes(pl, id)) { var k = Math.min(n, stack); pl.slots.push({ id: id, n: k }); n -= k; } });
    return n;
  };
  // A hand weapon into a free slot that takes it. Returns true if it fit.
  L.packAddWeapon = function (g, wid, dur) {
    var id = 'w:' + wid, pl = g.pack.places.filter(function (q) { return takes(q, id); })[0];
    if (!pl) return false;
    pl.slots.push({ id: id, n: 1, dur: dur });
    return true;
  };
  L.packCount = function (g, id) {
    if (!g.pack) return 0;
    return g.pack.places.reduce(function (a, pl) { return a + pl.slots.reduce(function (b, sl) { return b + (sl.id === id ? sl.n : 0); }, 0); }, 0);
  };
  // Takes up to n of an item, from the last places and slots first. Returns how many it took.
  L.packTake = function (g, id, n) {
    var took = 0, P = g.pack.places;
    for (var j = P.length - 1; j >= 0 && took < n; j--) {
      var S = P[j].slots;
      for (var i = S.length - 1; i >= 0 && took < n; i--) {
        if (S[i].id !== id) continue;
        var k = Math.min(S[i].n, n - took);
        S[i].n -= k; took += k;
        if (!S[i].n) S.splice(i, 1);
      }
    }
    return took;
  };
  // Every hand weapon you carry: [{ place, i }].
  L.packWeapons = function (g) {
    var out = [];
    g.pack.places.forEach(function (pl) { pl.slots.forEach(function (sl, i) { if (sl.id.indexOf('w:') === 0) out.push({ place: pl, i: i }); }); });
    return out;
  };
  // What everything you carry weighs, in kg: what is in every slot, the bags, the weapon in your hand and the gun.
  function weaponKg(id) { var w = L.meleeDef(id); return w.kg !== undefined ? w.kg : L.data.melee.kgBySkill[w.skill]; }
  L.packWeight = function (g) {
    if (!g.pack) return 0;
    var p = g.player, kg = 0;
    g.pack.places.forEach(function (pl) {
      kg += D().containers[pl.id].kg;
      pl.slots.forEach(function (sl) { kg += sl.id.indexOf('w:') === 0 ? weaponKg(sl.id.slice(2)) : D().items[sl.id].kg * sl.n; });
    });
    if (p.melee && p.melee.id !== 'pinas') kg += weaponKg(p.melee.id);
    if (p.gun) kg += D().carry.gun;
    return kg;
  };
  // How much past what you carry easily (0 if within it), in kg.
  L.packOver = function (g) { return Math.max(0, L.packWeight(g) - D().carry.cap); };
  // How much what you wear and what you carry slow you down (0 none): bags in the way, and above all the weight.
  L.packSlow = function (g) {
    if (!g.pack) return 0;
    var C = D().carry, bags = g.pack.places.reduce(function (a, pl) { return a + D().containers[pl.id].slow; }, 0);
    return Math.min(C.maxSlow, bags + L.packOver(g) * C.slowPerKg);
  };
  // Throws away what is in a slot.
  L.packDrop = function (g, pl, i) { pl.slots.splice(i, 1); };
  // Uses what is in a slot (the inventory screen): a bandage heals; a hand weapon goes to your hand.
  L.packUse = function (g, pl, i) {
    var sl = pl.slots[i], p = g.player;
    if (!sl) return false;
    if (sl.id === 'vendas') {
      if (p.hp >= p.stats.maxHp) return false;
      L.packTake(g, 'vendas', 1); p.hp = Math.min(p.stats.maxHp, p.hp + D().heal);
      L.toast(g, 'Te vendaste.', '#e8e2d6');
      return true;
    }
    if (sl.id === 'comida' || sl.id === 'agua') return L.consume(g, sl.id === 'comida' ? 'eat' : 'drink');
    if (sl.id.indexOf('w:') === 0) {
      var was = p.melee;
      p.melee = { id: sl.id.slice(2), dur: sl.dur };
      pl.slots.splice(i, 1);
      if (was && was.id !== 'pinas' && !L.packAddWeapon(g, was.id, was.dur)) { pl.slots.push({ id: 'w:' + was.id, n: 1, dur: was.dur }); }
      p.hand = 'melee';
      return true;
    }
    return false;
  };

  // "2 trapos, 1 venda"
  L.lootText = function (list) {
    return list.map(function (q) {
      if (q[0].indexOf('w:') === 0) return L.meleeDef(q[0].slice(2)).name.toLowerCase(); // a hand weapon
      if (q[0].indexOf('c:') === 0) return 'una ' + D().containers[q[0].slice(2)].name.toLowerCase(); // a bag
      if (q[0] === 'i:') return 'algo raro'; // a special object (its name shows apart)
      var nm = D().items[q[0]].name; return q[1] + ' ' + (q[1] === 1 ? nm[0] : nm[1]);
    }).join(', ');
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
      if (!g.search || g.search.key !== tg.key) { g.search = { key: tg.key, t: 0 }; L.emit(g, 'rummage', p.x, p.y); }
      g.search.t += dt;
      if (L.makeNoise && Math.floor(g.search.t * 2) !== Math.floor((g.search.t - dt) * 2)) L.makeNoise(g, p.x, p.y, L.data.senses.noise.search, p.floor, p);
      if (g.search.t >= D().search) {
        var list = g.leftover.has(tg.key) ? g.leftover.get(tg.key) : L.lootOf(tg.plan, tg.f, tg.k, tg.t), got = [], left = [];
        list.forEach(function (q) {
          var rest = q[0].indexOf('w:') === 0 ? (L.giveMelee(g, q[0].slice(2)) ? 0 : 1) :
            q[0].indexOf('c:') === 0 ? (L.wear(g, q[0].slice(2)) ? 0 : 1) :
            q[0] === 'i:' ? (foundItem(g), 0) : L.packAdd(g, q[0], q[1]);
          if (q[1] - rest > 0) got.push([q[0], q[1] - rest]);
          if (rest > 0) left.push([q[0], rest]);
        });
        g.searched.add(tg.key);
        if (left.length) g.leftover.set(tg.key, left); else g.leftover.delete(tg.key);
        var name = tg.t;
        L.toast(g, got.length ? 'Encontraste: ' + L.lootText(got) + (left.length ? '. No te entra todo: queda en el mueble.' : '.') :
          left.length ? 'No te entra nada más.' : 'No hay nada.', got.length ? '#d9cfa6' : '#8d8672');
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

  // One of the special objects (data/items.js): it is yours at once and stacks with the ones you have.
  function foundItem(g) {
    var it = L.rollItem(g, D().rarity);
    L.addItem(g, it.id);
    L.toast(g, 'Encontraste algo raro: ' + it.name + '. ' + it.desc, L.data.rarities[it.rarity].color);
  }

  // ---- Bullets from the backpack ----
  // When a reload ends: fill the magazine from the backpack, as far as there are bullets.
  L.reloadFromPack = function (g, gun) {
    var need = L.gunMag(gun) - gun.ammo;
    gun.ammo += L.packTake(g, 'balas', need);
  };
})(this.Lluvia = this.Lluvia || {});
