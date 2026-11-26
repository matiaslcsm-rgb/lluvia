// The survivors' madness (stage 72, the user's answer 4, 2026-11-25): their sanity goes down with what they see and
// how they live; low, they hallucinate; lower, they sabotage the Catedral, scream and bring zombies, turn on you
// when alone with you, or send the creatures at you. Paracetamol calms them.

function madGame(seed) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: seed, city: city, explore: true, noSpawn: true, night: true, refuge: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  L.peopleScan(g);
  return g;
}
function madPerson(g, name, mode, dx) {
  var L = Lluvia, p = g.player, s = g.city.scale, at = L.cityFree(g.city, p.x + (dx || 1.5) * s, p.y);
  g.peopleN = (g.peopleN || 0) + 1;
  var q = { id: g.peopleN, name: name, coat: '#6a5a48', x: at.x, y: at.y, floor: 0, house: mode === 'refuge' ? g.refuge.house : null, door: null, street: false,
    want: ['comida', 2], give: ['balas', 10], done: false, line: 0, dirX: -1, dirY: 0, still: 1, r: p.r, hp: 30, trust: 60, ties: {}, sanity: 70,
    mode: mode, walk: { t: 99, dx: 0, dy: 0 } };
  g.people.push(q);
  return q;
}
function madHours(g, n, each) { var L = Lluvia; for (var i = 0; i < n; i++) { g.time += L.data.clock.hour; L.update(g, 1 / 30, {}); if (each) each(); } }

test('locura: ver morir a alguien la baja mucho; en la Catedral, comer la sube y pasar hambre la baja', function () {
  var L = Lluvia, g = madGame(121), M = L.data.madness;
  var a = madPerson(g, 'Marta', 'refuge', 1.2), b = madPerson(g, 'Raúl', 'refuge', 2.7);
  L.hurtPerson(g, a, 100);
  assert.strictEqual(b.sanity, 70 + M.sawDeath, 'ver morir a Marta no le afecta');
  b.sanity = 50; b.done = false;
  L.update(g, 1 / 30, {});
  g.time += 24 * L.data.clock.hour; L.update(g, 1 / 30, {});
  assert.strictEqual(b.sanity, 50 + M.daily.refugeHungry, 'pasar hambre no le afecta');
  b.done = true;
  g.time += 24 * L.data.clock.hour; L.update(g, 1 / 30, {});
  assert.strictEqual(b.sanity, 50 + M.daily.refugeHungry + M.daily.refugeFed, 'comer no le hace bien');
});

test('locura: rara/o alucina; con paracetamol se calma', function () {
  var L = Lluvia, g = madGame(122), q = madPerson(g, 'Norma', 'refuge');
  q.sanity = 25;
  assert.ok(L.isOdd(q));
  assert.ok(L.data.madness.lines.odd.some(function (t) { return L.personText(g, q).indexOf(t) === 0; }), 'no alucina');
  assert.ok(!L.personActions(g, q).some(function (a) { return /Calmarlo/.test(a.label); }), 'se calma sin remedios');
  L.wear(g, 'mochila'); L.packAdd(g, 'paracetamol', 2);
  var act = L.personActions(g, q).filter(function (a) { return /Calmarlo/.test(a.label); })[0];
  assert.ok(act && act.run(), 'no se puede calmar');
  assert.ok(!L.isOdd(q) && L.packCount(g, 'paracetamol') === 0);
});

test('locura: en la Catedral, una persona loca saca tablas de las ventanas', function () {
  var L = Lluvia, g = madGame(123), q = madPerson(g, 'Walter', 'refuge');
  q.sanity = 5;
  var count = function () { return Object.keys(g.barricades).reduce(function (a, k) { return a + (k.indexOf(g.refuge.house + ':w:') === 0 ? g.barricades[k].planks : 0); }, 0); };
  var before = count();
  madHours(g, 30);
  assert.ok(count() < before, 'no sacó ninguna tabla');
  assert.ok(q.sabotaged > 0);
});

test('locura: el que te acompaña, loco y a solas con vos, te ataca; defenderte no te cuesta la confianza', function () {
  var L = Lluvia, g = madGame(124), p = g.player, q = madPerson(g, 'Claudio', 'follow');
  // Alone: nobody else around.
  g.people = g.people.filter(function (x) { return x === q; });
  q.sanity = 5;
  madHours(g, 30, function () { p.hp = p.stats.maxHp; });
  assert.ok(q.hostile, 'no se dio vuelta');
  var hp0 = p.hp = p.stats.maxHp; p.invuln = 0;
  for (var t = 0; t < 3; t += 1 / 30) L.update(g, 1 / 30, {});
  assert.ok(p.hp < hp0, 'no te pega');
  assert.ok(L.talkTarget(g) !== q, 'le podés hablar como si nada');
  var rep = g.rep.catedral;
  L.hurtPerson(g, q, 100);
  assert.ok(q.dead);
  assert.strictEqual(g.rep.catedral, rep, 'defenderte baja la confianza de la Catedral');
});

test('locura: afuera, de noche, grita y atrae zombis; en trance, los zombis cerca de él van hacia vos', function () {
  var L = Lluvia, g = madGame(125), p = g.player, s = g.city.scale, q = madPerson(g, 'Mirta', undefined, 6);
  q.sanity = 5;
  var noises = 0, mk = L.makeNoise;
  L.makeNoise = function (g2, x, y, m, f, who) { if (who === q) noises++; return mk.apply(L, arguments); };
  try {
    var night = null;
    for (var i = 0; i < L.debug.groups.length; i++) L.debug.groups[i].actions.forEach(function (a) { if (a.label === 'Noche (23 h)') night = a; });
    night.run(g);
    var z = L.spawnEnemy(g, 'rastrero', q.x + 3 * s, q.y); z.floor = 0; z.face = 0; z.mind = 'wander';
    for (var t = 0; t < 3; t += 1 / 30) { L.update(g, 1 / 30, {}); p.hp = p.stats.maxHp; }
  } finally { L.makeNoise = mk; }
  assert.ok(noises > 0, 'no grita');
  assert.ok(z.controlled, 'el zombi no le hace caso');
});
