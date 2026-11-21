// Stage 7: the balance the bench settled on. These are guard rails, not exact numbers: if a change moves the game
// far from what the bench measured, a test says so. (The bench itself: node tools/bench.js.)

test('la horda se endurece más rápido desde el minuto 10', function () {
  var h = Lluvia.data.horde;
  var before = Lluvia.enemyHpScale(h.lateStart) / Lluvia.enemyHpScale(h.lateStart - 1);
  var after = Lluvia.enemyHpScale(h.lateStart + 1) / Lluvia.enemyHpScale(h.lateStart);
  assert.ok(Math.abs(before - (1 + h.hpGrowth)) < 1e-9);
  assert.ok(Math.abs(after - (1 + h.hpGrowth) * (1 + h.lateGrowth)) < 1e-9);
});

test('el Cazador llega después del minuto 5', function () {
  assert.ok(Lluvia.findEnemy('cazador').from > 5);
});

test('tres partidas simuladas terminan entre los 12 y los 40 minutos', function () {
  [1, 2, 3].forEach(function (seed) {
    var m = Lluvia.createMatch({ seed: seed, humanBot: true });
    while (!m.over && m.time < 40 * 60) Lluvia.updateMatch(m, 1 / 30, {});
    assert.ok(m.over, 'la partida ' + seed + ' seguía a los 40 minutos');
    assert.ok(m.time > 12 * 60, 'la partida ' + seed + ' terminó a los ' + (m.time / 60).toFixed(1) + ' minutos');
  });
});
