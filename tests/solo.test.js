// Solo mode (user's decision, 2026-11-23): one player, zombies, only a Glock aimed with the mouse.

test('modo solo: un jugador, sin duelos, termina cuando perdés las vidas', function () {
  var L = Lluvia, m = L.createMatch({ seed: 3, characterId: 'roca', solo: true, gunsOnly: true, gun: 'glock' }), g = m.human.game;
  assert.strictEqual(m.players.length, 1);
  assert.strictEqual(g.player.abilities.length, 0, 'arrancó con habilidad');
  assert.strictEqual(g.player.ulti, null, 'tiene ulti');
  assert.strictEqual(g.player.gun.def.id, 'glock');
  for (var i = 0; i < 60; i++) L.updateMatch(m, 1 / 30, {});
  assert.ok(!m.over && !m.betting && !m.duel, 'se armó un duelo o terminó solo');
  g.lives = 1; g.player.hp = -1; g.player.invuln = 0; g.player.items = {};
  L.updateMatch(m, 1 / 30, {});
  assert.ok(m.over, 'no terminó al perder la última vida');
});

test('la Glock dispara hacia donde apuntás, gasta balas, recarga y mata', function () {
  var L = Lluvia, g = L.createGame({ seed: 5, characterId: 'brasa', gunsOnly: true, gun: 'glock', noSpawn: true }), p = g.player, gun = p.gun;
  var e = L.spawnEnemy(g, 'rastrero', p.x + 300, p.y);
  var aim = { x: 0, y: 0, fire: true, aimX: p.x + 300, aimY: p.y };
  L.update(g, 0.05, aim);
  assert.ok(gun.ammo < 17, 'no disparó');
  assert.ok(g.projectiles.some(function (b) { return b.bullet && b.vx > 0; }), 'la bala no va hacia la derecha');
  for (var i = 0; i < 30 && !e.dead; i++) L.update(g, 0.05, aim);
  assert.ok(e.dead || g.enemies.indexOf(e) < 0, 'no lo mató');
  // Empty the magazine: it reloads by itself and comes back full.
  gun.ammo = 1; gun.cd = 0;
  L.update(g, 0.02, { x: 0, y: 0, fire: true, aimX: p.x - 100, aimY: p.y });
  assert.ok(gun.reload > 0, 'no empezó a recargar');
  L.update(g, 2, {});
  assert.strictEqual(gun.ammo, L.gunMag(gun));
  // Without the button, it doesn't shoot.
  var before = gun.ammo;
  L.update(g, 0.3, { x: 0, y: 0, fire: false, aimX: p.x + 100, aimY: p.y });
  assert.strictEqual(gun.ammo, before);
});

test('al subir de nivel con solo la Glock no aparecen habilidades, sí mejorar el arma', function () {
  var L = Lluvia, g = L.createGame({ seed: 8, characterId: 'filo', gunsOnly: true, gun: 'glock', noSpawn: true }), seen = {};
  for (var i = 0; i < 40; i++) L.makeChoices(g).forEach(function (o) { seen[o.type] = 1; });
  assert.ok(!seen.newAbility && !seen.upAbility, 'ofreció habilidades');
  assert.ok(seen.upGun, 'no ofreció mejorar la Glock');
  g.choice = [{ type: 'upGun' }]; g.pendingLevels = 1;
  L.choose(g, 0);
  assert.strictEqual(g.player.gun.level, 1);
});

test('en la ciudad las balas chocan contra las paredes', function () {
  var L = Lluvia, c = L.cityProcedural(4), g = L.createGame({ seed: 2, characterId: 'roca', city: c, gunsOnly: true, gun: 'glock', noSpawn: true });
  var fr = L.cityFree(c, c.size / 2, c.size / 2); g.player.x = fr.x; g.player.y = fr.y;
  for (var a = 0; a < 16; a++) {
    var ang = a / 16 * Math.PI * 2;
    L.update(g, 0.25, { x: 0, y: 0, fire: true, aimX: fr.x + Math.cos(ang) * 500, aimY: fr.y + Math.sin(ang) * 500 });
  }
  for (var i = 0; i < 40; i++) L.update(g, 0.05, {});
  // Every bullet still flying is on a street.
  assert.ok(g.projectiles.every(function (b) { return L.cityWalkable(c, b.x, b.y); }));
});
