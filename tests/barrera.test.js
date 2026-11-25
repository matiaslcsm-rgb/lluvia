// The black barrier (data/barrier.js, the user's answer 2 a): the border is a wall nobody crosses; near it there are
// more zombies, and some come out of it.

function barrierGame(x, y) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: 111, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  var sp = L.cityFree(city, x, y);
  g.player.x = sp.x; g.player.y = sp.y;
  g.enemies.length = 0;
  return g;
}

test('barrera: está en el borde, no se cruza, avisa la primera vez y se guarda que la viste', function () {
  var L = Lluvia, B = L.data.barrier, city = L.cityHome(1), s = city.scale;
  var q = city.border[0], r = city.border[1];
  // A spot on the street near the middle of the first stretch of the border.
  var mx = (q[0] + r[0]) / 2, my = (q[1] + r[1]) / 2, n0 = L.barrierNear(city, mx, my);
  var g = barrierGame(mx + n0.nx * 15 * s, my + n0.ny * 15 * s), p = g.player;
  var n = L.barrierNear(city, p.x, p.y);
  assert.ok(n.d < 40 * s, 'la barrera no está cerca: ' + n.d / s + ' m');
  assert.ok(!L.cityWalkable(city, n.x - n.nx * 2 * s, n.y - n.ny * 2 * s), 'del otro lado de la barrera se camina');
  assert.ok(L.cityWalkable(city, p.x, p.y));
  g.toasts = []; var toasts = 0, real = L.toast;
  L.toast = function (gg, text) { if (text === B.text) toasts++; };
  try {
    L.updateBarrier(g, 1); g.barrierAcc = 0; L.updateBarrier(g, 1);
  } finally { L.toast = real; }
  assert.strictEqual(toasts, 1, 'no avisa una sola vez: ' + toasts);
  var g2 = barrierGame(city.start.x, city.start.y);
  L.applySave(g2, JSON.parse(JSON.stringify(L.saveGame(g))));
  assert.strictEqual(g2.barrierSeen, true, 'se olvida que la viste');
});

test('barrera: cerca hay muchos más zombis y algunos salen de ella; lejos, como siempre', function () {
  var L = Lluvia, B = L.data.barrier, city = L.cityHome(1), s = city.scale;
  var q = city.border[0], r = city.border[1], mx = (q[0] + r[0]) / 2, my = (q[1] + r[1]) / 2, n0 = L.barrierNear(city, mx, my);
  var run = function (g) {
    g.time = 13 * L.data.clock.hour; // the same hour for both
    L.updateBarrier(g, 1);
    var made = 0, out = 0;
    for (var i = 0; i < 600; i++) {
      var before = g.enemies.length;
      L.spawnByClock(g, 0.5);
      g.enemies.slice(before).forEach(function (e) {
        made++;
        if (e.fromBarrier) {
          out++;
          assert.ok(L.cityWalkable(city, e.x, e.y), 'sale de la barrera a un lugar donde no se camina');
          assert.ok(L.barrierNear(city, e.x, e.y).d < (B.out + 15) * s, 'sale lejos de la barrera');
        }
      });
      g.enemies.forEach(function (e) { if (e.dead) return; e.dead = true; }); // keep room for more
      g.enemies.length = 0;
    }
    return { made: made, out: out, mul: L.barrierMul(g) };
  };
  var near = run(barrierGame(mx + n0.nx * 10 * s, my + n0.ny * 10 * s));
  var far = run(barrierGame(city.start.x, city.start.y));
  assert.ok(near.mul > 2 && far.mul === 1, 'el multiplicador no cambia: ' + near.mul + ' / ' + far.mul);
  assert.ok(near.made > far.made * 1.8, 'cerca no hay más: ' + near.made + ' / ' + far.made);
  assert.ok(near.out > near.made * 0.2, 'casi ninguno sale de la barrera: ' + near.out + ' de ' + near.made);
  assert.strictEqual(far.out, 0, 'lejos salen de la barrera');
});
