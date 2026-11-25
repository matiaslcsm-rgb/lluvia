// Saving (stage 61, the user's answer 4 b): lying down in a bed saves; loading brings everything back.

test('guardar: al acostarte en una cama se guarda; al seguir vuelve todo como estaba', function () {
  var L = Lluvia, city = L.cityHome(1), store = {}, realBed = L.bedNear;
  L.store = { setItem: function (k, v) { store[k] = v; }, getItem: function (k) { return store[k] || null; } };
  try {
    var opts = { seed: 71, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 };
    var g = L.createGame(opts), p = g.player, s = city.scale;
    g.spawning = false;
    var sp = L.cityFree(city, city.start.x + 10 * s, city.start.y);
    p.x = sp.x; p.y = sp.y;
    // Things to remember: a bag and supplies, a long weapon, a wound, the clock, a searched piece, the gun's upgrade.
    L.wear(g, 'mochila'); L.packAdd(g, 'agua', 3); L.holdWeapon(g, 'barra');
    L.addWound(g, 'k'); p.energy = 40; p.xp = 7; p.level = 3;
    L.skillOf(p, 'punteria').level = 2;
    p.gun.level = 2;
    g.time = 5000; g.slept = 1234; g.kills = 9;
    g.searched.add('casa:0:1'); g.leftover.set('casa:0:1', [{ id: 'trapos', n: 1 }]);
    L.addPassive(g, L.data.passives[0].id);
    // Sleeping on the floor doesn't save; in a bed it does.
    L.bedNear = function () { return null; };
    L.sleep(g); L.wake(g);
    assert.strictEqual(store[L.SAVE_KEY], undefined, 'en el piso se guarda');
    L.bedNear = function () { return { t: 'cama' }; };
    p.energy = 40;
    assert.ok(L.sleep(g));
    assert.ok(store[L.SAVE_KEY], 'en la cama no se guarda');
    assert.ok(g.toasts.some(function (t) { return /Partida guardada/.test(t.text); }), 'no avisa que se guardó');
    var bedX = p.x, bedY = p.y;
    // Later, the browser was closed: a new game, and Continuar.
    var g2 = L.createGame(opts), p2 = g2.player;
    assert.ok(L.applySave(g2, L.readSave()), 'no carga');
    assert.ok(Math.hypot(p2.x - bedX, p2.y - bedY) < 1, 'no volvés a la cama');
    assert.ok(!p2.asleep, 'volvés dormido');
    assert.strictEqual(L.packCount(g2, 'agua'), 3, 'perdiste el agua');
    assert.ok(g2.pack.places.some(function (pl) { return pl.id === 'mochila'; }), 'perdiste la mochila');
    assert.strictEqual(L.mainDef(p2).id, 'barra', 'perdiste la barra');
    assert.ok(p2.hands.l === p2.hands.r, 'la barra dejó de ser una sola cosa en las dos manos');
    assert.strictEqual(p2.wounds.length, 1, 'perdiste la herida');
    assert.strictEqual(p2.energy, 40);
    assert.ok(p2.level === 3 && p2.xp === 7, 'perdiste el nivel');
    assert.strictEqual(L.skillLevel(p2, 'punteria'), 2, 'perdiste la puntería');
    assert.strictEqual(p2.gun.level, 2, 'perdiste la mejora de la pistola');
    assert.strictEqual(p2.passives.length, 1, 'perdiste la pasiva');
    assert.ok(g2.time === 5000 && g2.slept === 1234 && g2.kills === 9, 'perdiste la hora');
    assert.ok(g2.searched.has('casa:0:1') && g2.leftover.get('casa:0:1')[0].id === 'trapos', 'perdiste los muebles revisados');
    assert.deepStrictEqual(p2.bed, p.bed, 'perdiste dónde dormiste');
    // It plays on.
    for (var i = 0; i < 30; i++) L.update(g2, 1 / 30, {});
    assert.ok(!g2.over);
  } finally {
    delete L.store; L.bedNear = realBed;
  }
});

test('guardar: acostado en una casa (arriba o abajo), la casa vuelve a ser la misma al seguir', function () {
  var L = Lluvia, city = L.cityHome(1), plan = null;
  for (var i = 0; i < city.map.buildings.length && !plan; i++) { var pl = L.cityHouse(city, i); if (pl && pl.upper) plan = pl; }
  assert.ok(plan, 'no hay una casa de dos pisos');
  L.planOpenings(plan); // the barricades' openings point back to the plan
  var g = L.createGame({ seed: 141, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  var p = g.player;
  p.house = plan; p.floor = 1; p.z = 1; p.bed = { x: p.x, y: p.y, floor: 1, house: plan };
  var data = JSON.parse(JSON.stringify(L.saveGame(g)));
  var g2 = L.createGame({ seed: 141, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  L.applySave(g2, data);
  assert.strictEqual(g2.player.house, plan, 'la casa donde estabas no es la misma');
  assert.strictEqual(g2.player.bed.house, plan, 'la casa de tu cama no es la misma');
});
