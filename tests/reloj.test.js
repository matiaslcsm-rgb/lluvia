// The clock of the day and the lights (js/clock.js, data/clock.js).

test('reloj: 12 horas duran 40 minutos, día y noche con amanecer y atardecer', function () {
  var L = Lluvia, K = L.data.clock, at = function (h) { return L.clockAt((h - K.start) * K.hour); };
  assert.strictEqual(K.hour * 12, 40 * 60, '12 horas no duran 40 minutos');
  var c0 = L.clockAt(0);
  assert.strictEqual(c0.day, 1); assert.strictEqual(c0.hh, K.start);
  var later = L.clockAt(40 * 60);
  assert.strictEqual(later.hh, (K.start + 12) % 24, 'a los 40 minutos no pasaron 12 horas');
  assert.strictEqual(L.clockAt((24 - K.start) * K.hour + 1).day, 2, 'a medianoche no empieza el día 2');
  assert.strictEqual(at(12).light, 1); assert.strictEqual(at(12).phase, 'dia');
  assert.strictEqual(at(0.5 + 24).light, 0); assert.strictEqual(at(23).phase, 'noche');
  assert.strictEqual(at(K.sunset).phase, 'atardecer'); assert.strictEqual(at(K.sunrise + 24).phase, 'amanecer');
  // The light goes down through dusk without jumps, and back up at dawn.
  for (var h = K.sunset - 1, prev = 1; h <= K.sunset + 1; h += 0.05) {
    var l = L.daylight(h);
    assert.ok(l <= prev + 1e-9 && prev - l < 0.1, 'el atardecer salta: ' + h.toFixed(2));
    prev = l;
  }
  assert.ok(L.daylight(K.sunrise) > 0.3 && L.daylight(K.sunrise) < 0.7, 'el amanecer no está a mitad de luz');
});

test('reloj: la linterna se prende con F, gasta batería y de noche marca hasta dónde se ve', function () {
  var L = Lluvia, K = L.data.clock, city = L.cityHome(1), s = city.scale;
  var g = { time: 0, city: city, player: {} };
  L.updateClock(g, 0.016, { light: true });
  assert.ok(g.player.flashlight.on, 'F no prende la linterna');
  L.updateClock(g, 0.016, { light: true });
  assert.ok(g.player.flashlight.on, 'dejar apretada F la apaga');
  L.updateClock(g, K.hour * 2, {});
  assert.ok(g.player.flashlight.battery < 1, 'la linterna no gasta');
  var day = L.sightReach(g);
  g.time = (24 - K.start) * K.hour; // midnight
  var lit = L.sightReach(g);
  L.updateClock(g, 0.016, { light: true }); L.updateClock(g, 0.016, {});
  assert.ok(!g.player.flashlight.on, 'F no la apaga');
  var dark = L.sightReach(g);
  assert.ok(Math.abs(day - L.data.sight.range * s) < 1, 'de día no se ve hasta el borde');
  assert.ok(Math.abs(lit - K.flashlight.range * s) < 1 && Math.abs(dark - K.moon * s) < 1 && dark < lit && lit < day, 'de noche: ' + [day, lit, dark]);
  L.updateClock(g, K.hour * 3, {});
  assert.ok(g.player.flashlight.battery > 0.2, 'apagada no se carga');
});

test('reloj: faroles en las veredas, algunos rotos, y luz debajo de ellos', function () {
  var L = Lluvia, K = L.data.clock, city = L.cityHome(1), s = city.scale, lamps = L.cityLamps(city).list;
  assert.ok(lamps.length > 100, 'pocos faroles: ' + lamps.length);
  var onStreet = 0;
  lamps.forEach(function (l) { if (L.citySightCell(city, Math.floor(l.x / city.cell), Math.floor(l.y / city.cell))) onStreet++; });
  assert.ok(onStreet >= lamps.length * 0.85, 'faroles adentro de edificios: ' + (lamps.length - onStreet));
  var g = { city: city }, l0 = lamps[0];
  assert.ok(L.lightAt(g, l0.x, l0.y, 0) > 0.9, 'debajo de un farol no hay luz');
  assert.strictEqual(L.lightAt(g, l0.x, l0.y, 1), 0, 'la luz de un farol llega a un piso de arriba');
});

test('zombis con el reloj: los mismos de día y de noche, nacen lejos y fuera de tu vista, los de muy lejos se van', function () {
  var L = Lluvia, K = L.data.clock, N = L.data.mode.nights, city = L.cityHome(1), s = city.scale;
  var g = L.createGame({ seed: 7, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  var sp = L.cityFree(city, city.start.x, city.start.y), p = g.player;
  p.x = sp.x; p.y = sp.y;
  var at = function (day, h) { return ((day - 1) * 24 + h - K.start) * K.hour; };
  var fill = function () { for (var i = 0; i < 600; i++) L.spawnByClock(g, 0.5); return g.enemies.filter(function (e) { return !e.dead; }).length; };
  assert.ok(g.spawning && g.night, 'con el reloj no salen zombis');
  g.time = at(1, 12);
  var noon = fill();
  g.enemies = []; g.time = at(2, 0);
  var night = fill();
  assert.ok(noon > 0 && Math.abs(noon - night) <= 2, 'de día ' + noon + ' y de noche ' + night);
  g.enemies.forEach(function (e) {
    assert.strictEqual(e.type.id, N.type, 'salió un zombi que no es normal');
    assert.ok(Math.hypot(e.x - p.x, e.y - p.y) >= N.near * 0.8 * s, 'nació demasiado cerca');
  });
  g.enemies.forEach(function (e, i) { e.x = p.x + (N.recycle + 5) * s + i; e.y = p.y; e.mind = 'wander'; });
  L.spawnByClock(g, 0.01);
  assert.ok(g.enemies.every(function (e) { return e.dead && e.gone; }), 'los de muy lejos no se van');
  assert.strictEqual(L.nightOf(L.clockAt(at(1, 10))), 0); assert.strictEqual(L.nightOf(L.clockAt(at(1, 22))), 1); assert.strictEqual(L.nightOf(L.clockAt(at(2, 3))), 1);
});
