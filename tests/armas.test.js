// Hand weapons (js/melee.js, data/melee.js).

function meleeGame() {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: 9, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var sp = L.cityFree(city, city.start.x, city.start.y);
  g.player.x = sp.x; g.player.y = sp.y; g.player.aim = 0;
  return g;
}

test('armas de mano: datos completos; matar a piñas cuesta mucho, con un hacha uno o dos golpes; la habilidad ayuda', function () {
  var L = Lluvia, M = L.data.melee, S = L.data.skills.list, g = meleeGame();
  M.weapons.forEach(function (w) {
    var sum = (w.mix.c || 0) + (w.mix.k || 0) + (w.mix.p || 0);
    assert.ok(Math.abs(sum - 1) < 0.01, w.id + ': su daño no suma 100%');
    assert.ok(S[w.skill], w.id + ': habilidad que no existe');
  });
  Object.keys(L.data.loot.pieces).forEach(function (t) {
    L.data.loot.pieces[t].forEach(function (row) { if (row[0].indexOf('w:') === 0) assert.ok(L.findById(M.weapons, row[0].slice(2)), t + ' da un arma que no existe: ' + row[0]); });
  });
  var z = L.spawnEnemy(g, 'rastrero', 0, 0), hits = function (id) { return Math.ceil(z.maxHp / L.meleeDamage(g, L.meleeDef(id), z)); };
  assert.ok(hits('pinas') >= 10, 'a piñas se mata en ' + hits('pinas'));
  assert.ok(hits('hacha') <= 2, 'con un hacha se mata en ' + hits('hacha'));
  var before = hits('pinas');
  L.gainSkill(g, 'mano', 99999);
  assert.ok(hits('pinas') < before, 'con experiencia a mano no pega más fuerte');
});

test('armas de mano: el golpe pega adelante y no atrás, gasta aire, el arma se gasta y se rompe; 1 y 2 cambian de mano', function () {
  var L = Lluvia, g = meleeGame(), p = g.player, s = g.city.scale;
  assert.strictEqual(L.mainDef(p).id, 'pinas'); assert.strictEqual(p.hand, 'gun');
  L.updateMelee(g, 0.016, { slot2: true }); L.updateMelee(g, 0.016, {});
  assert.strictEqual(p.hand, 'melee', '2 no saca el arma de mano');
  var front = L.spawnEnemy(g, 'rastrero', p.x + 0.6 * s, p.y), back = L.spawnEnemy(g, 'rastrero', p.x - 0.6 * s, p.y);
  front.floor = back.floor = 0;
  var hp = front.hp, air = p.air;
  assert.strictEqual(L.swing(g), front, 'no le pega al de adelante');
  assert.ok(front.hp < hp && back.hp === back.maxHp, 'le pegó al de atrás');
  assert.ok(p.air < air, 'pegar no gasta aire');
  // A fragile one breaks.
  L.holdWeapon(g, 'palita', 2);
  L.swing(g); p.swingCd = 0; L.swing(g);
  assert.strictEqual(L.mainDef(p).id, 'pinas', 'la palita no se rompe');
  // A found weapon goes to the hand (only fists) or the backpack; 2 again swaps them.
  assert.ok(L.giveMelee(g, 'barra'));
  assert.strictEqual(L.mainDef(p).id, 'barra');
  assert.ok(p.hands.l === p.hands.r, 'la barra no ocupa las dos manos');
  assert.ok(!L.giveMelee(g, 'hacha'), 'un hacha entra en un bolsillo');
  L.wear(g, 'mochila');
  assert.ok(L.giveMelee(g, 'hacha'));
  var carried = function (id) { return L.packWeapons(g).some(function (w) { return w.place.slots[w.i].id === id; }); };
  assert.ok(carried('w:hacha'), 'la segunda arma no va a la mochila');
  L.updateMelee(g, 0.016, { slot2: true }); L.updateMelee(g, 0.016, {});
  assert.strictEqual(L.mainDef(p).id, 'hacha', '2 no cambia de arma');
  assert.ok(carried('w:barra'), 'la barra no vuelve a la mochila');
  L.updateMelee(g, 0.016, { slot1: true });
  assert.strictEqual(p.hand, 'gun', '1 no vuelve a la pistola');
});

test('correr gasta aire; a mano cada botón es una mano y los dos juntos empujan', function () {
  var L = Lluvia, g = meleeGame(), p = g.player, s = g.city.scale;
  p.hand = 'melee';
  // Running: faster than walking, and it costs air.
  var x0r = p.x, air0 = p.air;
  for (var i = 0; i < 15; i++) L.update(g, 1 / 30, { x: 1, y: 0 });
  var walk = p.x - x0r; p.x = x0r;
  for (i = 0; i < 15; i++) L.update(g, 1 / 30, { x: 1, y: 0, run: true });
  assert.ok(p.x - x0r > walk * 1.3 || walk < 1, 'correr no es más rápido');
  assert.ok(p.air < air0, 'correr no gasta aire');
  p.x = x0r; p.air = L.data.melee.air.max;
  var air = p.air;
  // Two hands: left then right, each with its own pace.
  var z = L.spawnEnemy(g, 'rastrero', p.x + 0.6 * s, p.y); z.floor = 0;
  g.time = 1;
  L.updateMelee(g, 0.016, { fire: true }); g.time += 0.2; L.updateMelee(g, 0.016, { fire: true });
  assert.ok(z.hp < z.maxHp, 'la mano izquierda no pega');
  var hp = z.hp; g.time += 0.05;
  L.updateMelee(g, 0.016, { aiming: true }); g.time += 0.2; L.updateMelee(g, 0.016, { aiming: true });
  assert.ok(z.hp < hp, 'la mano derecha no pega mientras la izquierda descansa');
  assert.ok(p.air < air, 'pegar no gasta aire');
  // Both at once: a shove, no damage.
  L.updateMelee(g, 0.016, {}); g.time += 1;
  hp = z.hp; var x0 = z.x;
  L.updateMelee(g, 0.016, { fire: true, aiming: true });
  assert.ok(z.x > x0 + 0.3 * s, 'los dos botones no empujan');
  assert.strictEqual(z.hp, hp, 'empujar lastima');
});
