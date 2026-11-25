// Gathering (js/loot.js, data/loot.js): the backpack, searching furniture, bandages and bullets from the backpack.

function lootGame() {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: 3, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false; // no zombies in these tests
  return g;
}

test('inventario: bolsillos y riñonera al empezar; lo grande va en bolso o mochila; apila y se llena', function () {
  var L = Lluvia, D = L.data.loot, g = lootGame();
  assert.deepStrictEqual(g.pack.places.map(function (pl) { return pl.id; }), D.wearing, 'no arranca con bolsillos y riñonera');
  assert.strictEqual(L.packCount(g, 'balas'), D.startAmmo, 'no arranca con las balas de más');
  Object.keys(D.pieces).forEach(function (t) { D.pieces[t].forEach(function (row) {
    var id = row[0];
    assert.ok(id.indexOf('w:') === 0 || id.indexOf('c:') === 0 && D.containers[id.slice(2)] || D.items[id], t + ' da algo que no existe: ' + id);
  }); });
  assert.strictEqual(L.packAdd(g, 'trapos', 12), 0);
  var trapos = 0;
  g.pack.places.forEach(function (pl) { pl.slots.forEach(function (sl) { if (sl.id === 'trapos') trapos++; }); });
  assert.strictEqual(trapos, 2, '12 trapos no ocupan 2 casilleros');
  assert.strictEqual(L.packAdd(g, 'tablas', 2), 2, 'una tabla entra en un bolsillo');
  assert.ok(!L.wear(g, 'rinonera'), 'se pone dos riñoneras');
  assert.ok(L.wear(g, 'mochila'));
  assert.strictEqual(L.packAdd(g, 'tablas', 2), 0, 'en la mochila no entran tablas');
  var rest = L.packAdd(g, 'clavos', 10000);
  var total = g.pack.places.reduce(function (a, pl) { return a + pl.slots.length; }, 0);
  assert.ok(rest > 0 && total === D.containers.bolsillos.slots + D.containers.rinonera.slots + D.containers.mochila.slots, 'no se llena');
  assert.strictEqual(L.packTake(g, 'trapos', 11), 11);
  assert.strictEqual(L.packCount(g, 'trapos'), 1);
  assert.strictEqual(L.packTake(g, 'vendas', 1), 0, 'saca lo que no hay');
  assert.ok(L.wear(g, 'bolso') && L.packSlow(g) > 0, 'el bolso no molesta al caminar');
});

test('revisar muebles: con E al lado de un ropero, una sola vez, siempre lo mismo', function () {
  var L = Lluvia, D = L.data.loot, g = lootGame(), city = g.city, s = city.scale, M = city.map, p = g.player, found = null;
  for (var i = 0; i < M.buildings.length && !found; i++) {
    var plan = L.cityHouse(city, i);
    if (!plan) continue;
    plan.furniture.forEach(function (q, k) {
      if (found || q.t !== 'ropero') return;
      var o = plan.solidPx[k], x = o.x + o.fx * (o.hd + 0.45 * s), y = o.y + o.fy * (o.hd + 0.45 * s);
      if (L.cityFits(city, x, y, L.data.city.body) && L.cityHouseAt(city, x, y) === plan) found = { plan: plan, k: k, x: x, y: y };
    });
  }
  assert.ok(found, 'no hay un ropero al que acercarse');
  p.x = found.x; p.y = found.y; p.floor = 0;
  var tg = L.searchTarget(g);
  assert.ok(tg && tg.k === found.k && tg.t === 'ropero', 'al lado del ropero no se puede revisar');
  var expect = L.lootOf(found.plan, 0, found.k, 'ropero');
  assert.deepStrictEqual(L.lootOf(found.plan, 0, found.k, 'ropero'), expect, 'el mismo ropero cambia lo que tiene');
  var before = {};
  Object.keys(D.items).forEach(function (id) { before[id] = L.packCount(g, id); });
  L.updateLoot(g, D.search / 2, { use: true });
  assert.ok(!g.searched.has(tg.key), 'se revisa al instante');
  L.updateLoot(g, D.search, { use: true });
  assert.ok(g.searched.has(tg.key), 'manteniendo E no se revisa');
  expect.forEach(function (q) { assert.strictEqual(L.packCount(g, q[0]), before[q[0]] + q[1], 'no se guardó ' + q[0]); });
  assert.ok(!L.searchTarget(g) || L.searchTarget(g).key !== tg.key, 'se puede revisar dos veces');
  // Soltar E corta la búsqueda.
  g.searched.clear();
  L.updateLoot(g, D.search / 2, { use: true }); L.updateLoot(g, 0.016, {}); L.updateLoot(g, D.search / 2, { use: true });
  assert.ok(!g.searched.has(tg.key), 'soltar E no corta la búsqueda');
});

test('lo que no entra queda en el mueble; vendas curan; las balas salen de la mochila', function () {
  var L = Lluvia, D = L.data.loot, g = lootGame(), p = g.player;
  // A full backpack: what a piece holds stays in it.
  g.pack.places.forEach(function (pl) { pl.slots = []; for (var i = 0; i < D.containers[pl.id].slots; i++) pl.slots.push({ id: 'clavos', n: D.items.clavos.stack }); });
  var plan = { index: 5 }, k = 0, t = null, list = null;
  var things = function (l) { return l && l.some(function (q) { return q[0].indexOf('w:') !== 0; }); }; // weapons go to the hand
  for (k = 0; k < 200 && !things(list); k++) { t = 'ropero'; list = L.lootOf(plan, 0, k, t); }
  g.lootTarget = null;
  var key = '5:0:' + (k - 1);
  var orig = L.searchTarget;
  L.searchTarget = function () { return { plan: plan, f: 0, k: k - 1, t: t, key: key }; };
  try {
    L.updateLoot(g, D.search + 0.01, { use: true });
    assert.ok(g.leftover.has(key), 'lo que no entra se pierde');
  } finally { L.searchTarget = orig; }
  // Bandages.
  g.pack.places.forEach(function (pl) { pl.slots = []; });
  g.pack.places[0].slots = [{ id: 'vendas', n: 1 }];
  p.hp = 10;
  L.updateLoot(g, 0.016, { heal: true });
  assert.strictEqual(p.hp, 10 + D.heal, 'la venda no cura');
  assert.strictEqual(L.packCount(g, 'vendas'), 0);
  // Bullets: a reload fills only as far as the backpack has.
  var gun = p.gun;
  g.pack.places[0].slots = [{ id: 'balas', n: 5 }];
  gun.ammo = 0;
  assert.ok(L.reloadGun(g), 'no recarga con balas en la mochila');
  L.updateGun(g, gun.reload + 0.01, {});
  assert.strictEqual(gun.ammo, 5, 'recargó balas que no tenía');
  assert.strictEqual(L.packCount(g, 'balas'), 0);
  gun.ammo = 0;
  assert.ok(!L.reloadGun(g), 'recarga sin balas');
});
