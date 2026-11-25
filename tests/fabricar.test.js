// Crafting and the molotov (js/craft.js, data/craft.js).

test('fabricar: vendas con trapos, puños vendados, botella rota; balas solo en un taller; molotov que prende fuego', function () {
  var L = Lluvia, R = L.data.craft.recipes, city = L.cityHome(1);
  var g = L.createGame({ seed: 4, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var sp = L.cityFree(city, city.start.x, city.start.y), p = g.player, r = function (id) { return L.findById(R, id); };
  p.x = sp.x; p.y = sp.y;
  R.forEach(function (rc) {
    Object.keys(rc.need).forEach(function (key) { key.split('|').forEach(function (k) { assert.ok(L.data.loot.items[k], rc.id + ' usa algo que no existe: ' + k); }); });
    var m = rc.make[0];
    assert.ok(m.indexOf('w:') === 0 ? L.findById(L.data.melee.weapons, m.slice(2)) : L.data.loot.items[m], rc.id + ' hace algo que no existe');
  });
  assert.ok(L.craftBlock(g, r('venda')), 'hace una venda sin trapos');
  L.wear(g, 'rinonera'); // the pockets hold the pistol and the bullets
  L.packAdd(g, 'trapos', 3);
  assert.ok(L.craft(g, r('venda')));
  assert.strictEqual(L.packCount(g, 'vendas'), 1); assert.strictEqual(L.packCount(g, 'trapos'), 1);
  assert.ok(L.craft(g, r('vendados')));
  assert.strictEqual(L.mainDef(p).id, 'vendados', 'los puños vendados no quedan en la mano');
  L.packAdd(g, 'chatarra', 4);
  assert.ok(/taller/.test(L.craftBlock(g, r('balas')) || ''), 'hace balas lejos de un taller');
  // Molotov: botella, trapo y nafta; G lo tira y prende fuego a lo que está ahí.
  L.packAdd(g, 'botella', 1);
  assert.strictEqual(L.packAdd(g, 'nafta', 1), 1, 'un bidón de nafta entra en una riñonera');
  L.wear(g, 'mochila'); L.packAdd(g, 'nafta', 1);
  assert.ok(L.craft(g, r('molotov')));
  var z = L.spawnEnemy(g, 'rastrero', p.x + Math.cos(g.player.aim || 0) * 3 * city.scale, p.y + Math.sin(g.player.aim || 0) * 3 * city.scale);
  z.floor = 0;
  assert.ok(L.throwMolotov(g, z.x, z.y), 'no se tira');
  for (var i = 0; i < 30; i++) L.updateFire(g, 1 / 30, {});
  assert.ok(g.fires.length === 1 || L.sightRay(city, p, p.x, p.y, Math.atan2(z.y - p.y, z.x - p.x), 3 * city.scale) < 3 * city.scale, 'no se prende el fuego');
  if (g.fires.length && Math.hypot(g.fires[0].x - z.x, g.fires[0].y - z.y) < g.fires[0].r) assert.ok(z.burnTtl > 0, 'el fuego no quema al zombi');
  assert.strictEqual(L.packCount(g, 'molotov'), 0);
});
