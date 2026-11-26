// How a game moves on (stage 74, the user's answer 6, 2026-11-25): triggers fire once: a first goal, the radio
// after the first night (the Escuela appears with its leader), visiting it, clues found in furniture (3 reveal the
// Sanatorio), the horde night of day 5, and a warning when the Catedral stops trusting you. The journal keeps it.

function storyGame(seed) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: seed, city: city, explore: true, noSpawn: true, night: true, refuge: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  return g;
}
function storyDays(g, n) { var L = Lluvia; for (var i = 0; i < n * 4; i++) { g.time += 6 * L.data.clock.hour; L.update(g, 1 / 30, {}); g.player.hp = g.player.stats.maxHp; } }

test('historia: arranca con un objetivo; después de la primera noche la radio avisa de la Escuela y aparece su encargada', function () {
  var L = Lluvia, g = storyGame(171);
  L.update(g, 1 / 30, {});
  assert.ok(L.journal(g).goals.length === 1, 'no hay un primer objetivo');
  storyDays(g, 1.25);
  var kn = g.story.known.escuela;
  assert.ok(kn, 'la Escuela no apareció');
  var leader = g.people.filter(function (q) { return q.mode === 'leader' && q.refuge === 'escuela'; })[0];
  assert.ok(leader, 'no hay nadie a cargo en la Escuela');
  assert.ok(L.cityHouseAt(g.city, leader.x, leader.y) === L.cityHouse(g.city, kn.house), 'la encargada no está adentro');
  assert.ok(/Escuela/.test(L.journal(g).goals[0]));
  // Walking in fires its trigger; helping it raises its trust and gives what it promised.
  var p = g.player; p.x = kn.x; p.y = kn.y; p.floor = 0; p.house = null;
  L.update(g, 1 / 30, {});
  assert.ok(g.story.fired.escuela, 'entrar a la Escuela no dispara nada');
  L.wear(g, 'mochila'); L.packAdd(g, leader.want[0], leader.want[1]);
  var rep = g.rep.escuela, had = L.packCount(g, leader.give[0]);
  assert.ok(L.giveTo(g, leader));
  assert.ok(g.rep.escuela > rep, 'la Escuela no confía más');
  assert.ok(L.packCount(g, leader.give[0]) + (g.ground || []).filter(function (it) { return it.slot.id === leader.give[0]; }).reduce(function (a, it) { return a + it.slot.n; }, 0) - had >= leader.give[1], 'no te dio lo prometido');
  assert.strictEqual(L.personActions(g, leader).length, 0, 'la encargada se va con vos');
});

test('historia: las pistas salen de los muebles, se anotan en el diario y con tres aparece el Sanatorio', function () {
  var L = Lluvia, g = storyGame(172);
  L.update(g, 1 / 30, {});
  var rng = g.rng; g.rng = function () { return 0.01; };
  try { for (var i = 0; i < 3; i++) assert.ok(L.rollClue(g) !== null, 'no salió la pista ' + (i + 1)); } finally { g.rng = rng; }
  assert.strictEqual(L.journal(g).clues.length, 3);
  L.update(g, 1 / 30, {});
  assert.ok(g.story.known.sanatorio, 'con tres pistas no aparece el Sanatorio');
});

test('historia: el día 5 la noche del latido trae muchos más zombis; si la Catedral desconfía, te avisa; se guarda', function () {
  var L = Lluvia, g = storyGame(173);
  storyDays(g, 4.1);
  assert.ok(g.story.fired.latido, 'el día 5 no pasa nada');
  for (var i = 0; i < L.debug.groups.length; i++) L.debug.groups[i].actions.forEach(function (a) { if (a.label === 'Noche (23 h)') a.run(g); });
  assert.ok(L.storyMul(g) > 1, 'la noche del latido no trae más zombis');
  g.rep.catedral = 10; L.update(g, 1 / 30, {});
  assert.ok(g.story.fired.echado, 'no avisa que la Catedral desconfía');
  var data = JSON.parse(JSON.stringify(L.saveGame(g)));
  var h = storyGame(173); L.applySave(h, data);
  assert.ok(h.story.fired.latido && h.story.known.escuela, 'no se guardó');
});
