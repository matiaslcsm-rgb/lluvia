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
