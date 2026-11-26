// The test menu (F2, js/debug.js, the user's answer 2 a): every shortcut runs and does what it says.

test('menú de pruebas: cada atajo anda; la hora, el clima, las cosas, ir a una casa e invencible', function () {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: 151, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var sp = L.cityFree(city, city.start.x, city.start.y); g.player.x = sp.x; g.player.y = sp.y;
  var find = function (label) {
    for (var i = 0; i < L.debug.groups.length; i++) for (var j = 0; j < L.debug.groups[i].actions.length; j++) if (L.debug.groups[i].actions[j].label === label) return L.debug.groups[i].actions[j];
    throw new Error('no está ' + label);
  };
  // Every one runs and says something.
  L.debug.groups.forEach(function (gr) { gr.actions.forEach(function (a) { var r = a.run(g); assert.ok(typeof r === 'string' && r.length, a.label + ' no dice nada'); }); });
  find('Noche (23 h)').run(g);
  assert.strictEqual(L.clockOf(g).hh, 23);
  find('Lluvia negra').run(g);
  assert.strictEqual(g.weather.id, 'lluvia');
  // What doesn't fit in the backpack stays on the floor.
  var count = function (id) { return L.packCount(g, id) + g.ground.reduce(function (a, it) { return a + (it.slot.id === id ? it.slot.n : 0); }, 0); };
  var before = count('tablas');
  find('Para trabar puertas').run(g);
  assert.ok(count('tablas') >= before + 6 && count('w:martillo') > 0, 'no te dio las cosas');
  find('A una casa cerca').run(g);
  assert.ok(L.cityHouseAt(city, g.player.x, g.player.y), 'no quedaste adentro de una casa');
  assert.ok(/casa \d+/.test(L.debug.where(g)), 'dónde estás no dice la casa');
  // Invincible: a blow does nothing.
  g.god = true;
  L.update(g, 0.1, {});
  var hp = g.player.hp;
  L.takeWound(g, L.data.health.every * 3, null); L.update(g, 0.1, {});
  assert.strictEqual(g.player.hp, hp, 'invencible perdés vida');
});

test('pruebas: correr rápido y balas infinitas', function () {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: 141, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var act = function (label) { for (var i = 0; i < L.debug.groups.length; i++) for (var j = 0; j < L.debug.groups[i].actions.length; j++) if (L.debug.groups[i].actions[j].label === label) return L.debug.groups[i].actions[j]; };
  var p = g.player, fr = L.cityFree(city, city.start.x, city.start.y);
  var walk = function () { p.x = fr.x; p.y = fr.y; var x0 = p.x, y0 = p.y; for (var t = 0; t < 0.5; t += 1 / 30) L.update(g, 1 / 30, { x: 1, y: 0 }); return Math.hypot(p.x - x0, p.y - y0); };
  var slow = walk();
  act('Correr rápido sí/no').run(g);
  assert.ok(walk() > slow * 1.8, 'no corre más rápido');
  act('Balas infinitas sí/no').run(g);
  var mag = L.gunMag(p.gun);
  p.hand = 'gun'; var shots = 0; g.events = [];
  for (var t = 0; t < 8; t += 1 / 30) { g.events.length = 0; L.update(g, 1 / 30, { fire: true, aimX: p.x + 500, aimY: p.y }); shots += g.events.filter(function (e) { return e.type === 'shot'; }).length; }
  assert.ok(shots > L.gunMag(p.gun), 'no disparó más que un cargador (' + shots + ')');
  assert.strictEqual(p.gun.ammo, mag, 'el cargador se vacía');
});
