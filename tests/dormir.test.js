// Energy and sleep (stage 54, docs/CUERPO.md section 2).

function restGame() {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: 31, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var sp = L.cityFree(city, city.start.x, city.start.y);
  g.player.x = sp.x; g.player.y = sp.y; g.player.aim = 0;
  return g;
}

test('energía: baja despierto; sin dormir ves menos y te queda menos aire', function () {
  var L = Lluvia, R = L.data.rest, hour = L.data.clock.hour, g = restGame(), p = g.player;
  assert.strictEqual(p.energy, R.max);
  L.updateRest(g, hour, hour, {});
  assert.ok(Math.abs(p.energy - (R.max - R.perHour)) < 0.01, 'una hora despierto deja ' + p.energy);
  assert.strictEqual(L.energySight(p), 1);
  p.energy = 0;
  L.updateRest(g, 0.1, 0.1, {});
  assert.ok(p.sightMul < 0.6, 'sin energía se ve igual: ' + p.sightMul);
  var full = L.sightReach(g); p.sightMul = 1; assert.ok(full < L.sightReach(g), 'el cono no se achica');
  assert.ok(L.energyAir(p) < 0.5, 'sin energía el aire no baja');
});

test('dormir: Z, el reloj corre, te despertás descansado; bien comido la energía se duplica; un zombi te despierta', function () {
  var L = Lluvia, R = L.data.rest, g = restGame(), p = g.player;
  p.energy = 20;
  var k0 = L.clockOf(g).hour + L.clockOf(g).day * 24;
  L.update(g, 1 / 30, { sleep: true });
  assert.ok(p.asleep, 'Z no te acuesta');
  assert.ok(p.bed, 'no se guarda dónde dormiste');
  // Ate and drank on time: well fed.
  for (var i = 0; i < 30 * 60 && p.asleep; i++) L.update(g, 1 / 30, {});
  assert.ok(!p.asleep, 'no se despierta nunca');
  var k1 = L.clockOf(g).hour + L.clockOf(g).day * 24;
  assert.ok(k1 - k0 > 4, 'dormir no hace pasar las horas: ' + (k1 - k0).toFixed(1));
  assert.strictEqual(p.energy, R.fedMax, 'bien comido la barra no se duplica');
  var e = p.energy; L.updateRest(g, 0, L.data.clock.hour, {});
  assert.ok(e - p.energy < R.perHour, 'con la barra doble no baja más despacio');
  // Hungry: it doesn't double. And a zombie next to you wakes you.
  p.energy = 20; p.energyMax = R.max; p.fed = 20;
  L.update(g, 1 / 30, { sleep: true }); L.update(g, 1 / 30, {});
  assert.ok(p.asleep);
  L.spawnEnemy(g, 'rastrero', p.x + 30, p.y);
  L.update(g, 1 / 30, {});
  assert.ok(!p.asleep, 'un zombi al lado no te despierta');
  assert.ok(p.energy <= R.max);
  assert.ok(!L.sleep(g), 'se puede dormir con un zombi al lado');
});
