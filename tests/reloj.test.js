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

test('zombis con el reloj: pocos de día, muchos de noche, más cada noche, y de día los de lejos se van', function () {
  var L = Lluvia, K = L.data.clock, N = L.data.mode.nights, city = L.cityHome(1);
  var g = L.createGame({ seed: 7, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  var sp = L.cityFree(city, city.start.x, city.start.y);
  g.player.x = sp.x; g.player.y = sp.y;
  var at = function (day, h) { return ((day - 1) * 24 + h - K.start) * K.hour; };
  var fill = function () { for (var i = 0; i < 600; i++) L.spawnByClock(g, 0.5); return g.enemies.length; };
  assert.ok(g.spawning && g.night, 'con el reloj no salen zombis');
  g.time = at(1, 12);
  var noon = fill();
  assert.ok(noon > 0 && noon <= N.day.alive, 'al mediodía hay ' + noon);
  g.time = at(2, 0);
  var night1 = fill();
  assert.ok(night1 >= N.dark.alive * 0.9 && night1 > noon * 2, 'a la medianoche hay ' + night1);
  var lvl1 = L.difficulty(g);
  g.time = at(3, 0);
  var night2 = fill();
  assert.ok(night2 > night1, 'la segunda noche no hay más zombis: ' + night2 + ' contra ' + night1);
  assert.ok(L.difficulty(g) > lvl1, 'la segunda noche no son más fuertes');
  // Morning: the far ones leave, one at a time, leaving nothing behind.
  g.time = at(3, 11);
  var gems = g.gems.length;
  g.enemies.forEach(function (e, i) { e.x = g.player.x + 4000 + i; e.y = g.player.y; });
  for (var i = 0; i < 400; i++) { L.spawnByClock(g, 0.5); g.enemies = g.enemies.filter(function (e) { return !e.dead; }); }
  assert.ok(g.enemies.length <= Math.round(N.day.alive * (1 + N.perNight * 2)), 'de día no se van: quedan ' + g.enemies.length);
  assert.strictEqual(g.gems.length, gems, 'los que se van dejan experiencia');
  assert.strictEqual(L.nightOf(L.clockAt(at(1, 10))), 0); assert.strictEqual(L.nightOf(L.clockAt(at(1, 22))), 1); assert.strictEqual(L.nightOf(L.clockAt(at(2, 3))), 1);
});
