// Aim and headshots (js/skills.js, data/skills.js).

test('puntería: sube con tiros a la cabeza en 10 niveles; apuntar quieto cierra la mira, caminar la abre', function () {
  var L = Lluvia, K = L.data.skills, city = L.cityHome(1);
  var g = L.createGame({ seed: 5, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  var p = g.player;
  assert.strictEqual(L.skillLevel(p, 'punteria'), 0);
  for (var i = 0; i < K.need[0] / K.list.punteria.headshot; i++) L.gainSkill(g, 'punteria', K.list.punteria.headshot);
  assert.strictEqual(L.skillLevel(p, 'punteria'), 1, 'no sube con tiros a la cabeza');
  L.gainSkill(g, 'punteria', 99999);
  assert.strictEqual(L.skillLevel(p, 'punteria'), K.levels, 'pasa del nivel 10');
  // The sight.
  p.skills = {};
  for (i = 0; i < 120; i++) L.updateAim(g, 1 / 30, {}, false);
  var hip = p.spread;
  for (i = 0; i < 120; i++) L.updateAim(g, 1 / 30, { aiming: true }, false);
  var aimed0 = p.spread;
  assert.ok(aimed0 < hip, 'apuntar no cierra la mira');
  for (i = 0; i < 60; i++) L.updateAim(g, 1 / 30, {}, true);
  assert.ok(p.spread > hip, 'caminar no abre la mira');
  L.gainSkill(g, 'punteria', 99999);
  for (i = 0; i < 120; i++) L.updateAim(g, 1 / 30, { aiming: true }, false);
  assert.ok(p.spread < aimed0, 'con más puntería la mira no se cierra más');
});

test('tiro a la cabeza: la bala tiene que pasar por la cabeza; la puntería la agranda', function () {
  var L = Lluvia, g = { player: { x: 0, y: 0, skills: {} } };
  var e = { x: 100, y: 0, r: 12, face: Math.PI }; // facing you: the head is on your side
  var h = L.headOf(e);
  assert.ok(h.x < e.x, 'la cabeza no está del lado hacia donde mira');
  var shot = function (y) { return L.headHit(g, e, { x: 110, y: y, r: 3.5 }, 60, y); };
  assert.ok(shot(0), 'un tiro al medio de la cabeza no pega');
  assert.ok(!shot(11), 'un tiro al hombro pega en la cabeza');
  var edge = h.r + 3.5 + 1.5;
  assert.ok(!shot(edge), 'pega rozando de más');
  g.player.skills = { punteria: { level: 10, xp: 0 } };
  assert.ok(shot(edge), 'con puntería 10 la cabeza no es más grande para tus balas');
});
