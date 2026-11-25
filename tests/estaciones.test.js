// The seasons (stage 59): 7 days each, from autumn; the day's length and the weather change with them.

test('estaciones: 7 días cada una; el día dura más en verano; el frío no viene en verano', function () {
  var L = Lluvia, S = L.data.seasons, K = L.data.clock, day = 24 * K.hour;
  var at = function (d, h) { return L.clockAt(((d - 1) * 24 + h - K.start) * K.hour); };
  assert.strictEqual(at(1, 12).season.id, S.order[0]);
  assert.strictEqual(at(S.days, 12).season.id, S.order[0]);
  assert.strictEqual(at(S.days + 1, 12).season.id, S.order[1]);
  assert.strictEqual(at(4 * S.days + 1, 12).season.id, S.order[0], 'no vuelve a empezar');
  var vDay = 3 * S.days + 1, iDay = S.days + 1;
  assert.strictEqual(at(vDay, 12).season.id, 'verano');
  assert.ok(at(vDay, 19).light > 0.5 && at(iDay, 19).light === 0, 'en verano no oscurece más tarde que en invierno');
  assert.ok(at(iDay, 7).light < at(vDay, 7).light, 'en invierno no amanece más tarde');
  // The weather: in summer no cold, in winter no heat.
  var g = L.createGame({ seed: 71, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.time = (vDay - 1) * day;
  assert.strictEqual(L.weatherWeight(g, 'frio'), 0, 'en verano puede venir el frío');
  assert.ok(L.weatherWeight(g, 'calor') > L.data.weather.kinds.calor.weight, 'en verano el calor no es más probable');
  g.time = (iDay - 1) * day;
  assert.strictEqual(L.weatherWeight(g, 'calor'), 0);
});
