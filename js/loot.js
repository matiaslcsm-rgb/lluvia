// Gathering (data/loot.js): searching furniture, the backpack, bandages, and bullets taken from the backpack.
// A piece is searched once per game: g.searched holds "building:floor:piece". What a piece has is seeded by its
// place, so the same wardrobe always holds the same; what doesn't fit in the backpack stays in it for later.
(function (L) {
  'use strict';

  function D() { return L.data.loot; }

  // ---- What you carry ----
  // As the user asked after playing (docs/CUERPO.md, section 4), like Project Zomboid:
  //   p.hands { l, r }: what is in each hand (a slot or null). A two-hand thing (a long weapon) is the same slot in
  //     both. The gun takes both hands too, but it is not kept here: p.hand === 'gun' means it is out, and what you
  //     had in your hands waits aside until you put it away (the user's conflict rule).
  //   g.pack.places: your 2 pockets (small things: the Glock, a stone, a knife) and each bag you wear. Food and
  //     water go only in a bag (the user: "siempre van a la mochila"); without a bag, in an empty hand.
  // A slot holds one kind of thing up to its stack ({ id, n }), one hand weapon ({ id: 'w:...', n: 1, dur }), or
  // the gun ({ id: 'gun' }: it keeps its pocket while it is out).
  L.makePack = function (g) {
    g.pack = { places: [] };
    g.searched = new Set();
    g.leftover = new Map();
    g.ground = [];
    D().wearing.forEach(function (k) { L.wear(g, k); });
    if (g.player.gun) g.pack.places[0].slots.push({ id: 'gun', n: 1 });
    if (D().startAmmo) L.packAdd(g, 'balas', D().startAmmo);
    return g.pack;
  };

  // Puts on a bag of kind k, if you don't wear one of that kind yet. Returns true if you put it on.
  L.wear = function (g, k) {
    if (g.pack.places.some(function (pl) { return pl.id === k; })) return false;
    g.pack.places.push({ id: k, slots: [] });
    return true;
  };

  function isWeapon(id) { return id.indexOf('w:') === 0; }
  function isCloth(id) { return id.indexOf('r:') === 0; } // a garment (js/clothes.js)
  function isBig(id) { return id === 'gun' ? false : isWeapon(id) ? L.meleeDef(id.slice(2)).skill === 'media' : isCloth(id) ? !!L.clothDef(id).big : !!D().items[id].big; }
  function isSupply(id) { return D().supplies.indexOf(id) >= 0; }
  // Two hands: long weapons (the gun too, but it lives apart: p.hand === 'gun').
  function twoHands(id) { return isWeapon(id) && L.meleeDef(id.slice(2)).skill === 'media'; }
  function room(pl) { return D().containers[pl.id].slots - pl.slots.length; }
  function takes(pl, id) {
    var C = D().containers[pl.id];
    if (id === 'gun' || isSupply(id) && !C.supplies) return false;
    return room(pl) > 0 && (!isBig(id) || C.big);
  }
  L.packBig = isBig;
  L.twoHands = twoHands;
  function hands(g) { var p = g.player; return p.hands || (p.hands = { l: null, r: null }); }
  // The slots in your hands, each once (a two-hand thing is one).
  function handSlots(g) { var h = hands(g), out = []; if (h.r) out.push(h.r); if (h.l && h.l !== h.r) out.push(h.l); return out; }
  L.handSlots = handSlots;

  // Puts n of an item where it goes: on top of slots of the same thing (in your hands too), then in a free slot of
  // a place that takes it; food and water, if no bag takes them, in an empty hand. Returns how many didn't fit.
  L.packAdd = function (g, id, n) {
    var stack = D().items[id].stack;
    var top = function (sl) { if (n > 0 && sl.id === id && sl.n < stack) { var k = Math.min(n, stack - sl.n); sl.n += k; n -= k; } };
    handSlots(g).forEach(top);
    g.pack.places.forEach(function (pl) { pl.slots.forEach(top); });
    g.pack.places.forEach(function (pl) { while (n > 0 && takes(pl, id)) { var k = Math.min(n, stack); pl.slots.push({ id: id, n: k }); n -= k; } });
    if (n > 0 && isSupply(id)) {
      var h = hands(g);
      ['r', 'l'].forEach(function (s) { if (n > 0 && !h[s]) { var k = Math.min(n, stack); h[s] = { id: id, n: k }; n -= k; } });
    }
    return n;
  };
  // A hand weapon into a free slot that takes it. Returns true if it fit.
  L.packAddWeapon = function (g, wid, dur) {
    var id = 'w:' + wid, pl = g.pack.places.filter(function (q) { return takes(q, id); })[0];
    if (!pl) return false;
    pl.slots.push({ id: id, n: 1, dur: dur });
    return true;
  };
  // A slot as it is (a weapon or a garment) into a free slot that takes it, or a stack on top of others. True if it
  // all fit.
  L.packAddSlot = function (g, sl) {
    if (isWeapon(sl.id) || isCloth(sl.id)) {
      var pl = g.pack.places.filter(function (q) { return takes(q, sl.id); })[0];
      if (!pl) return false;
      pl.slots.push(sl);
      return true;
    }
    var rest = L.packAdd(g, sl.id, sl.n);
    if (rest) sl.n = rest;
    return !rest;
  };
  // Any slot (a weapon, a garment or a stack) back into the places. Returns what didn't fit (a slot) or null.
  function stash(g, sl) {
    if (isWeapon(sl.id) || isCloth(sl.id)) return L.packAddSlot(g, sl) ? null : sl;
    var rest = L.packAdd(g, sl.id, sl.n);
    return rest ? { id: sl.id, n: rest } : null;
  }
  L.packCount = function (g, id) {
    if (!g.pack) return 0;
    var all = handSlots(g);
    g.pack.places.forEach(function (pl) { all = all.concat(pl.slots); });
    return all.reduce(function (a, sl) { return a + (sl.id === id ? sl.n : 0); }, 0);
  };
  // Takes up to n of an item: from your hands first, then from the last places and slots. Returns how many.
  L.packTake = function (g, id, n) {
    var took = 0, P = g.pack.places, h = hands(g);
    ['l', 'r'].forEach(function (s) {
      var sl = h[s];
      if (!sl || sl.id !== id || took >= n) return;
      var k = Math.min(sl.n, n - took); sl.n -= k; took += k;
      if (!sl.n) { if (h.l === sl) h.l = null; if (h.r === sl) h.r = null; }
    });
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
  // Every hand weapon in your pockets and bags: [{ place, i }].
  L.packWeapons = function (g) {
    var out = [];
    g.pack.places.forEach(function (pl) { pl.slots.forEach(function (sl, i) { if (isWeapon(sl.id)) out.push({ place: pl, i: i }); }); });
    return out;
  };
  // What everything you carry weighs, in kg: every slot, your hands, the bags and the gun.
  function weaponKg(id) { var w = L.meleeDef(id); return w.kg !== undefined ? w.kg : L.data.melee.kgBySkill[w.skill]; }
  function slotKg(sl) { return sl.id === 'gun' ? 0 : isWeapon(sl.id) ? weaponKg(sl.id.slice(2)) : isCloth(sl.id) ? L.clothDef(sl.id).kg : D().items[sl.id].kg * sl.n; }
  L.packWeight = function (g) {
    if (!g.pack) return 0;
    var p = g.player, kg = 0;
    g.pack.places.forEach(function (pl) {
      kg += D().containers[pl.id].kg;
      pl.slots.forEach(function (sl) { kg += slotKg(sl); });
    });
    handSlots(g).forEach(function (sl) { kg += slotKg(sl); });
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
  // How long the food and water you carry last you, in hours of the game (the user: the backpack shows them as
  // the time they last you, not as loose cans).
  L.suppliesTime = function (g) {
    var N = L.data.needs;
    return { agua: L.packCount(g, N.drink.item) * N.drink.every, comida: L.packCount(g, N.eat.item) * N.eat.every };
  };

  // ---- Your hands ----
  // A weapon into your hands: a long one takes both, a short one the right hand (or `side`). What was there goes
  // to your pockets or bags; if it doesn't fit, to the floor.
  L.holdWeapon = function (g, wid, dur, side) {
    var sl = { id: 'w:' + wid, n: 1, dur: dur === undefined ? L.meleeDef(wid).dur : dur };
    putInHands(g, sl, side || 'r');
    g.player.hand = 'melee';
    return sl;
  };
  function putInHands(g, sl, side) {
    var h = hands(g), out;
    if (twoHands(sl.id)) { out = handSlots(g); h.l = h.r = null; }
    else if (h[side] && twoHands(h[side].id)) { out = [h[side]]; h.l = h.r = null; }
    else { out = h[side] ? [h[side]] : []; h[side] = null; }
    out.forEach(function (o) {
      var rest = stash(g, o);
      if (rest) { L.dropToGround(g, rest); L.toast(g, 'No te entra: ' + slotName(rest) + ' queda en el piso.', '#8d8672'); }
    });
    if (twoHands(sl.id)) { h.l = h.r = sl; } else h[side] = sl;
  }
  L.putInHands = putInHands;
  // What a hand hits with: its weapon, your fist if it is empty, or null if it holds something else.
  L.handDef = function (p, side) {
    var sl = p.hands && p.hands[side];
    if (!sl) return L.meleeDef('pinas');
    return isWeapon(sl.id) ? L.meleeDef(sl.id.slice(2)) : null;
  };
  // The hand that leads: the one with a weapon (the right first), else the right.
  L.mainSide = function (p) {
    var h = p.hands || {};
    if (h.r && isWeapon(h.r.id)) return 'r';
    if (h.l && isWeapon(h.l.id)) return 'l';
    return 'r';
  };
  L.mainDef = function (p) { return L.handDef(p, L.mainSide(p)) || L.meleeDef('pinas'); };
  L.mainSlot = function (p) { return p.hands ? p.hands[L.mainSide(p)] : null; };

  // ---- What you can do with a thing (the right click menu, docs/CUERPO.md section 3) ----
  // `ref`: { pl, i } (a pocket or a bag) or { hand: 'l' | 'r' }. Returns [{ label, run }]: the first one is what a
  // plain click does. Each run returns true if something changed.
  function slotOf(g, ref) { return ref.hand ? hands(g)[ref.hand] : ref.pl.slots[ref.i]; }
  function takeOut(g, ref) {
    var sl = slotOf(g, ref);
    if (ref.hand) { var h = hands(g); if (h.l === sl) h.l = null; if (h.r === sl) h.r = null; } else ref.pl.slots.splice(ref.i, 1);
    return sl;
  }
  function putBack(g, ref, sl) {
    if (!ref.hand) { ref.pl.slots.splice(ref.i, 0, sl); return; }
    var h = hands(g);
    if (twoHands(sl.id)) h.l = h.r = sl; else h[ref.hand] = sl;
  }
  function slotName(sl) {
    if (sl.id === 'gun') return 'pistola';
    if (isWeapon(sl.id)) { var wd = L.meleeDef(sl.id.slice(2)); return wd.name + (wd.dur ? ' (' + Math.round(sl.dur / wd.dur * 100) + '%)' : ''); }
    if (isCloth(sl.id)) return L.clothName(sl);
    return L.lootText([[sl.id, sl.n]]);
  }
  L.slotName = slotName;
  L.slotActions = function (g, ref) {
    var sl = slotOf(g, ref), p = g.player, out = [], N = L.data.needs;
    if (!sl) return out;
    var add = function (label, run) { out.push({ label: label, run: run }); };
    if (sl.id === 'gun') {
      add(p.hand === 'gun' ? 'Guardarla (2)' : 'Sacarla (1)', function () { p.hand = p.hand === 'gun' ? 'melee' : 'gun'; return true; });
      return out;
    }
    // Clothes: put it on (what you had there goes where this was, or where it fits).
    if (isCloth(sl.id) && p.clothes) add('Ponerte', function () {
      var on = takeOut(g, ref), old = L.putOn(g, on);
      if (old && !L.packAddSlot(g, old)) { L.dropToGround(g, old); L.toast(g, 'No te entra: ' + slotName(old) + ' queda en el piso.', '#8d8672'); }
      return true;
    });
    // Things you use.
    if (sl.id === N.drink.item) add('Tomar', function () { return L.consume(g, 'drink'); });
    if (sl.id === N.eat.item) add('Comer', function () { return L.consume(g, 'eat'); });
    if (L.itemActions) L.itemActions(g, sl, add); // bandages and the medical things (js/health.js)
    else if (sl.id === 'vendas') add('Vendarte', function () { return L.useBandage(g); });
    if (ref.hand) {
      if (isWeapon(sl.id) && p.hand !== 'melee') add('Usarla', function () { p.hand = 'melee'; return true; });
      add('Guardar', function () {
        var rest = stash(g, takeOut(g, ref));
        if (rest) { putBack(g, ref, rest); L.toast(g, 'No te entra: no hay lugar.', '#8d8672'); return false; }
        return true;
      });
    } else if (isWeapon(sl.id)) {
      if (twoHands(sl.id)) add('A las dos manos', function () { putInHands(g, takeOut(g, ref), 'r'); p.hand = 'melee'; return true; });
      else {
        add('A la mano derecha', function () { putInHands(g, takeOut(g, ref), 'r'); p.hand = 'melee'; return true; });
        add('A la mano izquierda', function () { putInHands(g, takeOut(g, ref), 'l'); p.hand = 'melee'; return true; });
      }
    } else {
      add('Llevar en la mano', function () { var h = hands(g); putInHands(g, takeOut(g, ref), !h.r ? 'r' : !h.l ? 'l' : 'r'); return true; });
    }
    add('Tirar', function () { L.dropToGround(g, takeOut(g, ref)); L.emit(g, 'drop', p.x, p.y); return true; });
    return out;
  };

  // A click on the inventory screen uses (the first action); ✕ throws away.
  L.packUse = function (g, pl, i) { var a = L.slotActions(g, { pl: pl, i: i })[0]; return a ? a.run() : false; };
  L.packDrop = function (g, pl, i) { var a = L.slotActions(g, { pl: pl, i: i }).filter(function (x) { return x.label === 'Tirar'; })[0]; return a ? a.run() : false; };

  // A bandage (H, or from the inventory): life back. js/health.js replaces it with the wounds.
  L.useBandage = function (g) {
    var p = g.player;
    if (p.hp >= p.stats.maxHp || !L.packTake(g, 'vendas', 1)) return false;
    p.hp = Math.min(p.stats.maxHp, p.hp + D().heal);
    L.toast(g, 'Te vendaste.', '#e8e2d6');
    return true;
  };

  // ---- Things on the floor ----
  // g.ground: [{ x, y, floor, slot }]. What you throw away stays where you are, a little scattered; E picks it up.
  L.dropToGround = function (g, sl, x, y, floor) {
    var p = g.player, s = g.city ? g.city.scale : 50, a = g.rng() * Math.PI * 2, d = (0.5 + g.rng() * 0.3) * s; // just past your feet, where you see it
    if (!g.ground) g.ground = [];
    g.ground.push({ x: (x === undefined ? p.x : x) + Math.cos(a) * d, y: (y === undefined ? p.y : y) + Math.sin(a) * d, floor: floor === undefined ? p.floor || 0 : floor, slot: sl });
  };
  // The nearest thing on the floor within reach, on your floor: its index or -1.
  L.groundTarget = function (g) {
    var p = g.player, s = g.city ? g.city.scale : 50, reach = D().reach * s + p.r, best = -1, bd = Infinity;
    (g.ground || []).forEach(function (it, i) {
      if ((it.floor || 0) !== (p.floor || 0)) return;
      var d = Math.hypot(it.x - p.x, it.y - p.y);
      if (d < reach && d < bd) { bd = d; best = i; }
    });
    return best;
  };
  // Picks up the thing i from the floor: a weapon to your hands if they are empty, else where it fits; a stack as
  // far as it fits (the rest stays). Returns true if you took something.
  L.pickUp = function (g, i) {
    var it = g.ground[i], sl = it.slot, p = g.player, name = slotName(sl);
    if (isCloth(sl.id)) {
      if (!L.giveCloth(g, sl)) { L.toast(g, 'No te entra: ' + name + '.', '#8d8672'); return false; }
      g.ground.splice(i, 1);
    } else if (isWeapon(sl.id)) {
      var h = hands(g);
      if (!h.l && !h.r) { putInHands(g, sl, 'r'); if (p.hand !== 'gun') p.hand = 'melee'; }
      else if (!L.packAddWeapon(g, sl.id.slice(2), sl.dur)) { L.toast(g, 'No te entra: ' + name + '.', '#8d8672'); return false; }
      g.ground.splice(i, 1);
    } else {
      var rest = L.packAdd(g, sl.id, sl.n);
      if (rest === sl.n) { L.toast(g, 'No te entra: ' + name + '.', '#8d8672'); return false; }
      if (rest) sl.n = rest; else g.ground.splice(i, 1);
    }
    L.toast(g, 'Juntaste: ' + name + '.', '#d9cfa6');
    L.emit(g, 'loot', p.x, p.y, { piece: 'piso', got: [] });
    return true;
  };

  // "2 trapos, 1 venda"
  L.lootText = function (list) {
    return list.map(function (q) {
      if (q[0].indexOf('w:') === 0) return L.meleeDef(q[0].slice(2)).name.toLowerCase(); // a hand weapon
      if (q[0].indexOf('r:') === 0) return L.clothDef(q[0]).name.toLowerCase(); // a garment
      if (q[0].indexOf('c:') === 0) return 'una ' + D().containers[q[0].slice(2)].name.toLowerCase(); // a bag
      if (q[0] === 'i:') return 'algo raro'; // a special object (its name shows apart)
      var nm = D().items[q[0]].name; return q[1] + ' ' + (q[1] === 1 ? nm[0] : nm[1]);
    }).join(', ');
  };

  // ---- Searching ----
  // What a piece holds: rolled from its place (building, floor, piece), so it is always the same.
  // Is this building a pharmacy? Some of the shops, always the same ones.
  L.isPharmacy = function (plan) {
    if (!plan || plan.layout !== 'shop') return false;
    var h = ((plan.index + 11) * 2654435761) >>> 0;
    return (h % 1000) / 1000 < D().pharmacy;
  };
  L.lootOf = function (plan, f, k, t) {
    var table = L.isPharmacy(plan) && D().pharmacyPieces[t] || D().pieces[t];
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
    var empties = L.packCount(g, 'botella') > 0;
    lv.solidPx.forEach(function (o, k) {
      var t = lv.furniture[k].t, key = plan.index + ':' + f + ':' + k;
      // A sink already searched: with empty bottles, E fills them (the user: refill at a tap).
      var fill = empties && D().sinks.indexOf(t) >= 0 && g.searched.has(key) && !g.leftover.has(key);
      if (!fill && (!D().pieces[t] || g.searched.has(key) && !g.leftover.has(key))) return;
      var dx = p.x - o.x, dy = p.y - o.y, a = dx * o.ax + dy * o.ay, b = dx * o.fx + dy * o.fy;
      var d = Math.hypot(a - L.clamp(a, -o.hw, o.hw), b - L.clamp(b, -o.hd, o.hd));
      if (d < reach && d < bd) { bd = d; best = { plan: plan, f: f, k: k, t: t, key: key, fill: fill }; }
    });
    return best;
  };

  // Each frame: holding E (input.use) next to a piece searches it; H (input.heal) uses a bandage.
  L.updateLoot = function (g, dt, input) {
    if (!g.pack) return;
    var p = g.player;
    // Your body within reach comes first (js/death.js), then something on the floor: E (a press, not held).
    var bi = L.bodyTarget ? L.bodyTarget(g) : -1;
    g.bodyTarget = bi;
    if (bi >= 0) {
      g.lootTarget = null; g.search = null; g.groundTarget = -1;
      if (input && input.use && !g.useHeld) L.lootBody(g, bi);
      g.useHeld = !!(input && input.use);
      useBandageKey(g, input);
      return;
    }
    var gi = L.groundTarget(g);
    g.groundTarget = gi;
    if (gi >= 0) {
      g.lootTarget = null; g.search = null;
      if (input && input.use && !g.useHeld) L.pickUp(g, gi);
      g.useHeld = !!(input && input.use);
      useBandageKey(g, input);
      return;
    }
    g.useHeld = !!(input && input.use);
    var tg = L.searchTarget(g);
    g.lootTarget = tg;
    if (input && input.use && tg && !g.respawn) {
      if (!g.search || g.search.key !== tg.key) { g.search = { key: tg.key, t: 0 }; L.emit(g, 'rummage', p.x, p.y); }
      g.search.t += dt;
      if (L.makeNoise && Math.floor(g.search.t * 2) !== Math.floor((g.search.t - dt) * 2)) L.makeNoise(g, p.x, p.y, L.data.senses.noise.search, p.floor, p);
      if (g.search.t >= D().search && tg.fill) {
        var n = L.packTake(g, 'botella', 99), left2 = L.packAdd(g, 'agua', n);
        if (left2) L.packAdd(g, 'botella', left2);
        L.toast(g, n - left2 ? 'Llenaste ' + (n - left2) + (n - left2 === 1 ? ' botella' : ' botellas') + ' de agua.' : 'No te entra más agua.', '#7fb3c9');
        L.emit(g, 'craft', p.x, p.y);
        g.search = null;
      } else if (g.search.t >= D().search) {
        var list = g.leftover.has(tg.key) ? g.leftover.get(tg.key) : L.lootOf(tg.plan, tg.f, tg.k, tg.t), got = [], left = [];
        list.forEach(function (q) {
          var rest = q[0].indexOf('w:') === 0 ? (L.giveMelee(g, q[0].slice(2)) ? 0 : 1) :
            q[0].indexOf('c:') === 0 ? (L.wear(g, q[0].slice(2)) ? 0 : 1) :
            q[0].indexOf('r:') === 0 ? (L.foundCloth(g, L.newCloth(q[0].slice(2))), 0) :
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
    useBandageKey(g, input);
  };
  // H: a bandage (js/health.js decides what it does with the wounds).
  function useBandageKey(g, input) {
    if (input && input.heal && !g.healHeld) (L.quickBandage || L.useBandage)(g);
    g.healHeld = !!(input && input.heal);
  }

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
