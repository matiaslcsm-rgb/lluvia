// Getting stuck in a wall (the user, 2026-11-25: "me quedé trabado en una pared"): if you try to walk and no way is
// open, the game gets you out to the nearest spot where you fit.

test('trabado: metido en una pared, al intentar caminar te saca al lugar libre más cercano', function () {
  var L = Lluvia, city = L.cityHome(1), s = city.scale, spot = null;
  var g = L.createGame({ seed: 131, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var p = g.player, rng = L.makeRng(7);
  // A spot just inside a wall, where no way out is open.
  for (var n = 0; n < 5000 && !spot; n++) {
    p.x = city.start.x + (rng() - 0.5) * 200 * s; p.y = city.start.y + (rng() - 0.5) * 200 * s; p.floor = 0; p.house = null;
    if (L.cityFits(city, p.x, p.y, L.data.city.body) || L.canMove(g)) continue;
    var fr = L.cityFree(city, p.x, p.y);
    if (Math.hypot(fr.x - p.x, fr.y - p.y) < 2 * s) spot = { x: p.x, y: p.y };
  }
  assert.ok(spot, 'no hay un lugar donde trabarse');
  p.x = spot.x; p.y = spot.y;
  assert.ok(!L.canMove(g), 'adentro del ropero te podés mover');
  for (var t = 0; t < 1.5; t += 1 / 30) { g.enemies.length = 0; L.update(g, 1 / 30, { x: 1, y: 0 }); };
  assert.ok(L.cityFits(city, p.x, p.y, L.data.city.body), 'seguís trabado');
  assert.ok(Math.hypot(p.x - spot.x, p.y - spot.y) < 4 * s, 'te sacó muy lejos');
  // Pressing against a plain wall is not being stuck.
  var fr = L.cityFree(city, city.start.x, city.start.y);
  p.x = fr.x; p.y = fr.y;
  assert.ok(L.canMove(g));
});
