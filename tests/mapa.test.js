// The map remembers (stage 64, the user's answer 8): what you see is marked; the rest stays unknown; it is saved.

test('mapa: lo que ves queda marcado, lo demás no; caminar destapa más; se guarda', function () {
  var L = Lluvia, city = L.cityHome(1), s = city.scale;
  var g = L.createGame({ seed: 101, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var p = g.player, sp = L.cityFree(city, city.start.x, city.start.y);
  p.x = sp.x; p.y = sp.y;
  assert.strictEqual(g.explored.count, 0, 'arranca sabiendo algo');
  L.updateExplored(g, 1);
  var reach = L.sightReach(g);
  assert.ok(L.isExplored(g, p.x, p.y), 'donde estás no queda marcado');
  assert.ok(L.isExplored(g, p.x + reach * 0.8, p.y), 'lo que ves no queda marcado');
  assert.ok(!L.isExplored(g, p.x + reach + 40 * s, p.y), 'lo que no ves queda marcado');
  // Walking uncovers more.
  var seen = g.explored.count, far = L.cityFree(city, sp.x, sp.y + 80 * s);
  p.x = far.x; p.y = far.y;
  L.updateExplored(g, 1);
  assert.ok(g.explored.count > seen, 'caminar no destapa más');
  assert.ok(L.isExplored(g, sp.x, sp.y), 'se olvida de donde estuviste');
  // Saved and loaded.
  var g2 = L.createGame({ seed: 101, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  L.applySave(g2, JSON.parse(JSON.stringify(L.saveGame(g))));
  assert.strictEqual(g2.explored.count, g.explored.count, 'al seguir la partida el mapa se olvida');
  assert.ok(L.isExplored(g2, sp.x, sp.y) && !L.isExplored(g2, sp.x + reach + 40 * s, sp.y));
  assert.deepStrictEqual(Array.from(g2.explored.grid), Array.from(g.explored.grid));
});

test('mapa: adentro de una casa se ve solo lo que alumbra tu vista; girando se descubre más; se guarda', function () {
  var L = Lluvia, city = L.cityHome(1), M = city.map, s = city.scale, found = null;
  var g = L.createGame({ seed: 102, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var p = g.player;
  // A big enough house, standing in the middle of one of its rooms.
  for (var i = 0; i < M.buildings.length && !found; i++) {
    var plan = L.cityHouse(city, i);
    if (!plan || plan.W * plan.D < 120) continue;
    plan.rooms.forEach(function (r) {
      if (found || r.cells < 12) return;
      var q = L.housePoint(plan, r.cx, r.cy), x = q[0] * s, y = q[1] * s;
      if (L.cityFits(city, x, y, L.data.city.body) && L.cityHouseAt(city, x, y) === plan) found = { plan: plan, x: x, y: y };
    });
  }
  assert.ok(found, 'no hay una casa donde pararse');
  p.x = found.x; p.y = found.y; p.floor = 0; p.house = null; p.aim = 0;
  g.time = 3 * L.data.clock.hour; // daytime: light enough
  var key = found.plan.index + ':0', rooms = 0;
  for (var c = 0; c < found.plan.lab.length; c++) if (found.plan.lab[c] >= 0) rooms++;
  L.updateExplored(g, 1);
  var mem = g.explored.inside[key], seen = function () { var n = 0; mem.forEach(function (v) { n += v; }); return n; };
  assert.ok(mem && seen() > 0, 'adentro no se descubre nada');
  var first = seen();
  assert.ok(first < rooms, 'se ve la casa entera de golpe');
  // Turning around uncovers more; what you saw stays.
  [Math.PI / 2, Math.PI, -Math.PI / 2].forEach(function (a) { p.aim = a; g.explored.acc = 0; L.updateExplored(g, 1); });
  assert.ok(seen() > first, 'girando no se descubre más');
  // Saved and loaded.
  var g2 = L.createGame({ seed: 102, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  L.applySave(g2, JSON.parse(JSON.stringify(L.saveGame(g))));
  assert.deepStrictEqual(Array.from(g2.explored.inside[key]), Array.from(mem), 'al seguir se olvida lo de adentro');
});
