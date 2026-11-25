// Hands, pockets and the backpack; throwing things on the floor and the right click menu (stages 55 and 56,
// docs/CUERPO.md sections 3 and 4).

function handsGame() {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: 41, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var sp = L.cityFree(city, city.start.x, city.start.y);
  g.player.x = sp.x; g.player.y = sp.y; g.player.aim = 0;
  return g;
}

test('manos y bolsillos: 2 bolsillos chicos; la comida y el agua van a la mochila y se ven como tiempo', function () {
  var L = Lluvia, g = handsGame(), p = g.player, N = L.data.needs;
  assert.strictEqual(L.data.loot.containers.bolsillos.slots, 2);
  assert.ok(!p.hands.l && !p.hands.r, 'arranca con algo en las manos');
  // No bag: water goes to an empty hand, one per hand, never to the pockets.
  g.pack.places[0].slots = [];
  assert.strictEqual(L.packAdd(g, 'agua', 1), 0);
  assert.ok(g.pack.places[0].slots.length === 0 && p.hands.r && p.hands.r.id === 'agua', 'el agua no va a la mano sin mochila');
  L.packTake(g, 'agua', 1);
  assert.ok(!p.hands.r, 'tomar el agua de la mano no la vacía');
  // With a backpack: there, and shown as the time it lasts.
  L.wear(g, 'mochila');
  L.packAdd(g, 'agua', 3); L.packAdd(g, 'comida', 2);
  assert.ok(!p.hands.r && !p.hands.l, 'con mochila el agua va a la mano');
  var st = L.suppliesTime(g);
  assert.strictEqual(st.agua, 3 * N.drink.every); assert.strictEqual(st.comida, 2 * N.eat.every);
  // Full: nothing more goes in.
  var pl = g.pack.places[1];
  while (pl.slots.length < L.data.loot.containers.mochila.slots) pl.slots.push({ id: 'clavos', n: 30 });
  g.pack.places[0].slots = [{ id: 'gun', n: 1 }, { id: 'balas', n: 34 }];
  p.hands.l = p.hands.r = { id: 'w:barra', n: 1, dur: 10 };
  assert.strictEqual(L.packAdd(g, 'agua', 2), 2, 'con todo lleno entra agua');
});

test('dos manos: un arma corta en cada mano, una larga ocupa las dos; la pistola deja lo demás a un lado', function () {
  var L = Lluvia, g = handsGame(), p = g.player, s = g.city.scale;
  L.wear(g, 'mochila');
  L.holdWeapon(g, 'cuchillo', undefined, 'r'); L.holdWeapon(g, 'martillo', undefined, 'l');
  assert.strictEqual(L.handDef(p, 'r').id, 'cuchillo'); assert.strictEqual(L.handDef(p, 'l').id, 'martillo');
  // Each button, its hand.
  var z = L.spawnEnemy(g, 'rastrero', p.x + 0.6 * s, p.y); z.floor = 0; z.hp = z.maxHp = 1000;
  L.swing(g, 'left');
  assert.strictEqual(p.hands.r.dur, L.meleeDef('cuchillo').dur - 1, 'el clic izquierdo no usa la mano derecha');
  L.swing(g, 'right');
  assert.strictEqual(p.hands.l.dur, L.meleeDef('martillo').dur - 1, 'el clic derecho no usa la mano izquierda');
  // A long one takes both: the two short ones go to the backpack.
  L.holdWeapon(g, 'pala');
  assert.ok(p.hands.l === p.hands.r && L.handDef(p, 'l').id === 'pala', 'la pala no ocupa las dos manos');
  assert.ok(L.packWeapons(g).length === 2, 'lo que tenías en las manos no se guarda');
  // The gun out: the hands wait aside and come back as they were.
  L.updateMelee(g, 0.016, { slot1: true }); L.updateMelee(g, 0.016, {});
  assert.strictEqual(p.hand, 'gun');
  assert.strictEqual(L.handDef(p, 'r').id, 'pala', 'sacar la pistola tira lo que tenías');
  L.updateMelee(g, 0.016, { slot2: true }); L.updateMelee(g, 0.016, {});
  assert.strictEqual(p.hand, 'melee'); assert.strictEqual(L.mainDef(p).id, 'pala');
  // Holding water, that hand doesn't hit.
  g.player.hands = { l: null, r: { id: 'agua', n: 1 } };
  assert.strictEqual(L.handDef(p, 'r'), null);
  assert.strictEqual(L.swing(g, 'left'), null, 'pega con una botella de agua');
});

test('tirar al piso, juntar con E y el menú de clic derecho según la cosa', function () {
  var L = Lluvia, g = handsGame(), p = g.player;
  L.wear(g, 'mochila'); L.packAdd(g, 'agua', 1);
  var pl = g.pack.places[1], i = pl.slots.findIndex(function (sl) { return sl.id === 'agua'; });
  var labels = L.slotActions(g, { pl: pl, i: i }).map(function (a) { return a.label; });
  assert.deepStrictEqual(labels, ['Tomar', 'Llevar en la mano', 'Tirar'], 'el agua tiene otras opciones: ' + labels);
  // The pistol can't be thrown away (it goes with the level-up upgrades).
  assert.ok(L.slotActions(g, { pl: g.pack.places[0], i: 0 }).every(function (a) { return a.label !== 'Tirar'; }));
  // Throw the water away: it stays on the floor, next to you.
  L.slotActions(g, { pl: pl, i: i }).filter(function (a) { return a.label === 'Tirar'; })[0].run();
  assert.strictEqual(L.packCount(g, 'agua'), 0);
  assert.strictEqual(g.ground.length, 1);
  assert.ok(Math.hypot(g.ground[0].x - p.x, g.ground[0].y - p.y) < g.city.scale, 'cae lejos');
  // E picks it up again.
  L.updateLoot(g, 0.016, {});
  assert.ok(g.groundTarget === 0, 'no se ve lo que hay en el piso');
  L.updateLoot(g, 0.016, { use: true });
  assert.strictEqual(L.packCount(g, 'agua'), 1, 'E no lo junta');
  assert.strictEqual(g.ground.length, 0);
  // A weapon: to a hand, from the hand to the backpack.
  L.packAddWeapon(g, 'cuchillo', 40);
  var k = pl.slots.findIndex(function (sl) { return sl.id === 'w:cuchillo'; });
  L.slotActions(g, { pl: pl, i: k }).filter(function (a) { return a.label === 'A la mano izquierda'; })[0].run();
  assert.strictEqual(L.handDef(p, 'l').id, 'cuchillo');
  L.slotActions(g, { hand: 'l' }).filter(function (a) { return a.label === 'Guardar'; })[0].run();
  assert.ok(!p.hands.l && L.packWeapons(g).length === 1, 'guardar no lo devuelve a la mochila');
  // Far away it doesn't pick up.
  L.dropToGround(g, { id: 'trapos', n: 2 }, p.x + 20 * g.city.scale, p.y);
  L.updateLoot(g, 0.016, {}); g.useHeld = false; L.updateLoot(g, 0.016, { use: true });
  assert.strictEqual(g.ground.length, 1, 'junta de lejos');
});
