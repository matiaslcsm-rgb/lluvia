// Seventh season: the city (real streets from OpenStreetMap, or invented), walls and chasing along the streets.

// A tiny piece of OpenStreetMap: two crossing streets and a plaza, around (0, 0).
function tinyOSM() {
  var m = 1 / 111320; // about one meter in degrees near the equator
  function way(tags, pts) { return { type: 'way', tags: tags, geometry: pts.map(function (p) { return { lat: -p[1] * m, lon: p[0] * m }; }) }; }
  var els = [
    way({ highway: 'residential', name: 'Belgrano' }, [[-450, 0], [450, 0]]),
    way({ highway: 'residential', name: 'Sarmiento' }, [[0, -450], [0, 450]]),
    way({ highway: 'primary', name: 'Avenida' }, [[-450, -200], [450, -200]]),
    way({ highway: 'residential' }, [[-200, -450], [-200, 450]]),
    way({ highway: 'residential' }, [[200, -450], [200, 450]]),
    way({ highway: 'footway' }, [[-100, 100], [100, 100]]), // left out
    way({ leisure: "park", name: "Plaza" }, [[3, 3], [150, 3], [150, 150], [3, 150]]),
    way({ building: 'yes' }, [[-150, 30], [-60, 30], [-60, 120], [-150, 120]])
  ];
  return { elements: els };
}

test('ciudad de OpenStreetMap: calles, plazas y patios se caminan; los edificios y las casas son sólidos', function () {
  var L = Lluvia, c = L.cityFromOSM(tinyOSM(), 0, 0, 'Prueba'), s = L.data.city.scale, mid = c.size / 2;
  assert.ok(c, 'no armó la ciudad');
  assert.strictEqual(c.roads.length, 5, 'el sendero peatonal no se deja afuera');
  assert.ok(L.cityWalkable(c, mid, mid), 'la esquina no se camina');
  assert.ok(L.cityWalkable(c, mid + 100 * s, mid + 100 * s), 'la plaza no se camina');
  assert.ok(!L.cityWalkable(c, mid - 105 * s, mid + 75 * s), 'el edificio se camina');
  assert.strictEqual(c.buildings.length, 1);
  assert.ok(c.houses.length > 10, 'no llenó las manzanas de casas: ' + c.houses.length);
  // Every house is solid and none sits on a street.
  c.houses.forEach(function (h) {
    var cx = (h.pts[0][0] + h.pts[2][0]) / 2, cy = (h.pts[0][1] + h.pts[2][1]) / 2;
    assert.ok(!L.cityWalkable(c, cx, cy), 'una casa se camina');
    assert.ok(!c.street[Math.floor(cy / c.cell) * c.cols + Math.floor(cx / c.cell)], 'una casa sobre la calle');
  });
  assert.strictEqual(L.cityFromOSM({ elements: [] }, 0, 0), null, 'sin calles tiene que fallar');
});

test('en la ciudad no atravesás paredes y los bichos te buscan por las calles', function () {
  var L = Lluvia, c = L.cityProcedural(11);
  var g = L.createGame({ seed: 4, characterId: 'roca', city: c, noSpawn: true }), p = g.player;
  var fr = L.cityFree(c, c.size / 2, c.size / 2);
  p.x = fr.x; p.y = fr.y;
  // Walk in one direction for a long time: you never end inside a wall.
  for (var i = 0; i < 300; i++) {
    L.update(g, 1 / 30, { x: 1, y: 0.3 });
    assert.ok(L.cityFits(c, p.x, p.y, L.data.city.body - 1), 'quedó dentro de una pared en ' + Math.round(p.x) + ',' + Math.round(p.y));
  }
  // A creature far away along the streets reaches you without crossing walls.
  p.hp = p.stats.maxHp = 1e9;
  var e = L.spawnEnemy(g, 'rastrero', p.x + 700, p.y + 700);
  e.hp = e.maxHp = 1e9; e.speed = 200;
  assert.ok(L.cityWalkable(c, e.x, e.y), 'nació en una pared');
  var start = Math.hypot(e.x - p.x, e.y - p.y);
  for (i = 0; i < 600 && Math.hypot(e.x - p.x, e.y - p.y) > 40; i++) {
    L.update(g, 1 / 30, {});
    assert.ok(L.cityWalkable(c, e.x, e.y), 'el bicho atravesó una pared');
  }
  assert.ok(Math.hypot(e.x - p.x, e.y - p.y) < Math.min(80, start), 'no te alcanzó: quedó a ' + Math.round(Math.hypot(e.x - p.x, e.y - p.y)) + ' de ' + Math.round(start) + ' en ' + Math.round(e.x) + ',' + Math.round(e.y) + ' (vos ' + Math.round(p.x) + ',' + Math.round(p.y) + ')');
  // Chests land on a street.
  var ch = L.dropChest(g, 5, 5, 'normal');
  assert.ok(L.cityWalkable(c, ch.x, ch.y), 'el cofre cayó en una pared');
});

test('San Miguel viene adentro del juego: arranca en la plaza y se camina', function () {
  var L = Lluvia, c = L.cityHome(1);
  assert.strictEqual(c.name, 'San Miguel');
  assert.ok(c.roads.length > 1000, 'pocas calles: ' + c.roads.length);
  var fr = L.cityFree(c, c.start.x, c.start.y);
  assert.ok(Math.hypot(fr.x - c.start.x, fr.y - c.start.y) < 120, 'la plaza quedó lejos de una calle');
  var g = L.createGame({ seed: 2, characterId: 'brasa', city: c });
  g.player.x = fr.x; g.player.y = fr.y;
  for (var i = 0; i < 120; i++) L.update(g, 1 / 30, { x: 0.5, y: -1 });
  assert.ok(L.cityWalkable(c, g.player.x, g.player.y));
  assert.ok(g.enemies.every(function (e) { return L.cityWalkable(c, e.x, e.y); }), 'un bicho en una pared');
});
