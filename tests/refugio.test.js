// The refuge (stage 68, the user's answers 3 and 6, 2026-11-25): you start inside the Catedral with its windows
// nailed; zombies never appear inside; knocked out you wake up there and they trust you less (more if they saw it).

function refugeGame(seed) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: seed, city: city, explore: true, noSpawn: true, night: true, refuge: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  return g;
}

test('refugio: arrancás adentro de la catedral, con las ventanas trabadas, la puerta libre y con qué trabarla', function () {
  var L = Lluvia, g = refugeGame(71), p = g.player, plan = L.refugePlan(g);
  assert.ok(g.refuge && plan, 'no hay refugio');
  assert.strictEqual(L.cityHouseAt(g.city, p.x, p.y), plan, 'no arrancás adentro');
  var ops = L.planOpenings(plan), wins = ops.filter(function (o) { return o.kind === 'window'; });
  assert.ok(wins.length > 0 && wins.every(function (o) { return L.openingShut(g, o); }), 'hay ventanas sin trabar');
  assert.ok(ops.some(function (o) { return o.kind === 'door' && !L.openingShut(g, o); }), 'no hay puerta para salir');
  assert.ok(L.packCount(g, 'tablas') >= 1 && L.packCount(g, 'clavos') >= 2, 'no tenés tablas y clavos');
  assert.strictEqual(g.rep.catedral, L.data.refuge.rep.start);
  // Without the option (the tests, the old modes) nothing changes.
  var h = L.createGame({ seed: 71, city: g.city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  assert.ok(!h.refuge);
});

test('refugio: los zombis nunca aparecen adentro', function () {
  var L = Lluvia, g = refugeGame(72), p = g.player, bad = 0, made = 0, spawn = L.spawnEnemy;
  L.spawnEnemy = function (g2, t, x, y) { made++; if (L.inRefuge(g, x, y)) bad++; return spawn.apply(L, arguments); };
  try {
    g.spawning = true;
    L.debug.groups[2].actions[3].run(g); // night
    for (var t = 0; t < 60; t += 1 / 15) { L.update(g, 1 / 15, {}); p.hp = p.stats.maxHp; }
  } finally { L.spawnEnemy = spawn; }
  assert.ok(made > 0, 'no apareció ningún zombi');
  assert.strictEqual(bad, 0, bad + ' zombis aparecieron adentro');
});

test('refugio: noqueado te despertás en la catedral y te tienen menos confianza; más si te vieron caer cerca', function () {
  var L = Lluvia, g = refugeGame(73), p = g.player, s = g.city.scale, R = L.data.refuge.rep;
  g.spawning = false;
  var far = L.cityFree(g.city, g.refuge.x + 150 * s, g.refuge.y);
  p.x = far.x; p.y = far.y; p.hp = -1;
  L.update(g, 1 / 30, {});
  assert.ok(Math.hypot(p.x - g.refuge.x, p.y - g.refuge.y) < 1, 'no te despertás en el refugio');
  assert.strictEqual(g.rep.catedral, R.start - R.knocked);
  var near = L.cityFree(g.city, g.refuge.x + 10 * s, g.refuge.y);
  p.x = near.x; p.y = near.y; p.hp = -1; p.invuln = 0;
  L.update(g, 1 / 30, {});
  assert.strictEqual(g.rep.catedral, R.start - 2 * R.knocked - R.seen, 'que te vean caer no baja más');
  // A day goes by without falling, then another: trust comes back a little.
  var K = L.data.clock, before = g.rep.catedral;
  g.time += 24 * K.hour; L.update(g, 1 / 30, {});
  g.time += 24 * K.hour; L.update(g, 1 / 30, {});
  assert.strictEqual(g.rep.catedral, before + R.heal, 'un día limpio no devuelve confianza');
  assert.ok(L.repWord(g.rep.catedral).length > 0);
});

test('refugio: guardar y seguir mantiene el refugio y la confianza', function () {
  var L = Lluvia, g = refugeGame(74);
  g.rep.catedral = 40;
  var data = JSON.parse(JSON.stringify(L.saveGame(g)));
  var h = L.createGame({ seed: 74, city: g.city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  L.applySave(h, data);
  assert.strictEqual(h.refuge.house, g.refuge.house);
  assert.strictEqual(h.rep.catedral, 40);
  assert.ok(L.inRefuge(h, h.refuge.x, h.refuge.y));
});
