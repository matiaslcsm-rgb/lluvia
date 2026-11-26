// Electricity (the user, 2026-11-26): some buildings have power; each room has a light switch by its door; with
// power, flipping it lights the room (it counts as lit at night); without, nothing happens.

function lightGame(seed) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: seed, city: city, explore: true, noSpawn: true, night: true, refuge: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  return g;
}
// A house with (or without) power and a switch on its ground floor; the player standing at it, looking at it.
function atSwitch(g, power) {
  var L = Lluvia, city = g.city, s = city.scale, p = g.player;
  for (var i = 0; i < city.map.buildings.length; i++) {
    var plan = L.cityHouse(city, i);
    if (!plan || !plan.exitsPx.length || L.hasPower(plan) !== power) continue;
    var sws = L.planSwitches(plan, 0);
    for (var j = 0; j < sws.length; j++) {
      var sw = sws[j];
      for (var a = 0; a < 8; a++) {
        var x = sw.x + Math.cos(a * Math.PI / 4) * 0.45 * s, y = sw.y + Math.sin(a * Math.PI / 4) * 0.45 * s;
        if (L.cityHouseAt(city, x, y) !== plan || !L.cityFits(city, x, y, L.data.city.body)) continue;
        p.x = x; p.y = y; p.floor = 0; p.house = null; p.aim = Math.atan2(sw.y - y, sw.x - x);
        var T = L.switchTarget(g);
        if (T && T.sw === sw) return T;
      }
    }
  }
  return null;
}

test('luz: cada sala tiene su interruptor; con luz, prenderlo ilumina la sala de noche; apagarlo la vuelve oscura', function () {
  var L = Lluvia, g = lightGame(161), T = atSwitch(g, true);
  assert.ok(T, 'no hay un interruptor en una casa con luz');
  for (var i = 0; i < L.debug.groups.length; i++) L.debug.groups[i].actions.forEach(function (a) { if (a.label === 'Noche (23 h)') a.run(g); });
  var p = g.player, before = L.lightAt(g, p.x, p.y, 0);
  L.update(g, 1 / 30, { aimX: T.sw.x, aimY: T.sw.y });
  L.update(g, 1 / 30, { use: true, aimX: T.sw.x, aimY: T.sw.y }); L.update(g, 1 / 30, { aimX: T.sw.x, aimY: T.sw.y });
  assert.ok(L.roomLit(g, T.plan, 0, T.sw.room), 'E no prendió la luz');
  if (L.roomAt(T.plan, 0, p.x, p.y) === T.sw.room) assert.strictEqual(L.lightAt(g, p.x, p.y, 0), 1, 'la sala prendida no está iluminada');
  L.update(g, 1 / 30, { use: true, aimX: T.sw.x, aimY: T.sw.y }); L.update(g, 1 / 30, { aimX: T.sw.x, aimY: T.sw.y });
  assert.ok(!L.roomLit(g, T.plan, 0, T.sw.room), 'E no apagó la luz');
  assert.ok(L.lightAt(g, p.x, p.y, 0) <= Math.max(before, 0.81), 'apagada sigue iluminada');
});

test('luz: sin electricidad el interruptor no hace nada; las casas con la luz encendida son solo las que tienen electricidad', function () {
  var L = Lluvia, g = lightGame(162), T = atSwitch(g, false);
  assert.ok(T, 'no hay un interruptor en una casa sin luz');
  L.flipSwitch(g, T);
  assert.ok(!L.roomLit(g, T.plan, 0, T.sw.room), 'sin luz se prendió');
  assert.ok(/no hay luz/.test(g.toasts[g.toasts.length - 1].text));
  var city = g.city, bad = 0;
  for (var i = 0; i < 400; i++) { var plan = L.cityHouse(city, i); if (plan && L.houseLit(plan) && !L.hasPower(plan)) bad++; }
  assert.strictEqual(bad, 0, 'casas con la luz prendida sin electricidad');
});

test('luz: las luces prendidas se guardan', function () {
  var L = Lluvia, g = lightGame(163), T = atSwitch(g, true);
  L.flipSwitch(g, T);
  var data = JSON.parse(JSON.stringify(L.saveGame(g)));
  var h = lightGame(163); L.applySave(h, data);
  assert.ok(L.roomLit(h, L.cityHouse(h.city, T.plan.index), 0, T.sw.room));
});
