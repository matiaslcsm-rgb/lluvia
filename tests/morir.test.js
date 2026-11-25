// Dying (stage 58, docs/CUERPO.md section 6): you wake up where you last slept, whole; your body stays with your
// things and you can get them back. The game goes on.

test('morir: te despertás donde dormiste, entero; tu cuerpo queda con tus cosas y las recuperás con E', function () {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: 61, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var p = g.player, s = city.scale, sp = L.cityFree(city, city.start.x, city.start.y);
  p.x = sp.x; p.y = sp.y;
  // Sleep here a moment: this is where you'll wake up.
  L.sleep(g); L.wake(g);
  var bed = { x: p.x, y: p.y };
  // Walk away with a backpack, water and a weapon, hurt.
  var far = L.cityFree(city, sp.x + 30 * s, sp.y);
  p.x = far.x; p.y = far.y;
  L.wear(g, 'mochila'); L.packAdd(g, 'agua', 2); L.holdWeapon(g, 'martillo');
  L.addWound(g, 'k');
  p.hp = -1;
  L.update(g, 1 / 30, {});
  assert.ok(!g.over, 'morir termina la partida');
  assert.ok(Math.hypot(p.x - bed.x, p.y - bed.y) < 1, 'no te despertás donde dormiste');
  assert.strictEqual(p.hp, p.stats.maxHp, 'no volvés con la vida llena');
  assert.ok(p.capLost === 0 && p.wounds.length === 0, 'volvés con las heridas');
  assert.strictEqual(L.packCount(g, 'agua'), 0, 'te quedás con lo que llevabas');
  assert.ok(g.pack.places.length === 1 && g.pack.places[0].slots[0].id === 'gun', 'la pistola no se queda con vos');
  assert.strictEqual(g.bodies.length, 1);
  assert.ok(Math.hypot(g.bodies[0].x - far.x, g.bodies[0].y - far.y) < 1, 'el cuerpo no queda donde moriste');
  // Go back to the body: E takes everything back.
  p.x = g.bodies[0].x + 0.5 * s; p.y = g.bodies[0].y;
  L.updateLoot(g, 0.016, {});
  assert.strictEqual(g.bodyTarget, 0, 'al lado del cuerpo no se ve');
  L.updateLoot(g, 0.016, { use: true });
  assert.strictEqual(L.packCount(g, 'agua'), 2, 'no recuperás el agua');
  assert.strictEqual(L.mainDef(p).id, 'martillo', 'no recuperás el martillo');
  assert.ok(g.pack.places.some(function (pl) { return pl.id === 'mochila'; }), 'no te ponés la mochila de nuevo');
  assert.strictEqual(g.bodies.length, 0, 'el cuerpo vacío queda');
});
