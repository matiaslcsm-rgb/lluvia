// Survivors (stage 69, the user's answers 2 c and 3, 2026-11-25): some locked in their houses with the door nailed,
// some on the streets by day; you talk to them, they ask for something and give something back.

function peopleGame(seed) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: seed, city: city, explore: true, noSpawn: true, night: true, refuge: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  return g;
}
function action(label) {
  var L = Lluvia;
  for (var i = 0; i < L.debug.groups.length; i++) for (var j = 0; j < L.debug.groups[i].actions.length; j++) if (L.debug.groups[i].actions[j].label === label) return L.debug.groups[i].actions[j];
}

test('sobrevivientes: algunas casas tienen a alguien adentro, con la puerta trabada; siempre las mismas', function () {
  var L = Lluvia, g = peopleGame(91), h = peopleGame(92);
  L.peopleScan(g, 600); L.peopleScan(h, 600);
  var inHouses = g.people.filter(function (q) { return q.house !== null; });
  assert.ok(inHouses.length > 0, 'nadie en ninguna casa');
  inHouses.forEach(function (q) {
    var plan = L.cityHouse(g.city, q.house);
    assert.strictEqual(L.cityHouseAt(g.city, q.x, q.y), plan, q.name + ' no está adentro de su casa');
    var o = L.planOpenings(plan).filter(function (x) { return x.key === q.door; })[0];
    assert.ok(o && L.openingShut(g, o), 'la puerta de ' + q.name + ' no está trabada');
  });
  var a = inHouses.map(function (q) { return q.house + q.name; }).sort().join(), b = h.people.filter(function (q) { return q.house !== null; }).map(function (q) { return q.house + q.name; }).sort().join();
  assert.strictEqual(a, b, 'cambian de una partida a otra');
  assert.ok(!g.people.some(function (q) { return q.house === g.refuge.house; }), 'hay un vecino en la Catedral');
});

test('sobrevivientes: golpeás la puerta, te piden algo, se lo das y te dan lo suyo; la Catedral te ve mejor', function () {
  var L = Lluvia, g = peopleGame(93), p = g.player;
  assert.ok(/puerta/.test(action('A un sobreviviente').run(g)), 'no hay a quién visitar');
  L.update(g, 1 / 30, {});
  var q = g.talkTarget;
  assert.ok(q, 'en la puerta no podés hablar');
  L.update(g, 1 / 30, { use: true });
  assert.strictEqual(g.talking, q, 'E no abre la charla');
  assert.ok(!g.barWork, 'E también clava una tabla');
  assert.ok(L.personText(g, q).indexOf(L.lootText([q.want])) >= 0, 'no dice qué necesita');
  L.stopTalking(g);
  // Without what they want, nothing.
  ['comida', 'agua', 'vendas', 'tablas', 'clavos', 'antibiotico', 'paracetamol', 'alcohol', 'trapos', 'balas'].forEach(function (id) { L.packTake(g, id, 999); });
  if (q.want[0].indexOf('w:') === 0) { p.hands = { l: null, r: null }; }
  assert.ok(!L.canGive(g, q) && !L.giveTo(g, q));
  // With it.
  L.wear(g, 'mochila');
  if (q.want[0].indexOf('w:') === 0) L.giveMelee(g, q.want[0].slice(2)); else L.packAdd(g, q.want[0], q.want[1]);
  var rep = g.rep.catedral, gid = q.give[0], had = gid.indexOf('w:') === 0 || gid.indexOf('r:') === 0 ? 0 : L.packCount(g, gid) + (g.ground || []).filter(function (it) { return it.slot.id === gid; }).reduce(function (a, it) { return a + it.slot.n; }, 0);
  assert.ok(L.giveTo(g, q), 'no se lo podés dar');
  assert.ok(q.done);
  if (gid.indexOf('w:') !== 0 && gid.indexOf('r:') !== 0) {
    var now = L.packCount(g, gid) + (g.ground || []).filter(function (it) { return it.slot.id === gid; }).reduce(function (a, it) { return a + it.slot.n; }, 0);
    assert.strictEqual(now - had, q.give[1], 'no te dio lo que prometió');
  }
  assert.strictEqual(g.rep.catedral, Math.min(100, rep + L.data.survivors.rep));
  assert.ok(!L.giveTo(g, q), 'te da dos veces');
});

test('sobrevivientes: de día aparece gente en la calle, fuera de tu vista; de noche no; si te alejás se van', function () {
  var L = Lluvia, g = peopleGame(94), p = g.player, s = g.city.scale, S = L.data.survivors.street;
  action('A la plaza').run(g);
  action('Mediodía (13 h)').run(g);
  g.peopleT = S.every;
  L.update(g, 1 / 30, {});
  var st = g.people.filter(function (q) { return q.street; });
  assert.ok(st.length === 1, 'no apareció nadie en la calle');
  var q = st[0], d = Math.hypot(q.x - p.x, q.y - p.y) / s;
  assert.ok(d > S.near * 0.8 && !L.cityHouseAt(g.city, q.x, q.y), 'apareció pegado o adentro de una casa');
  var x0 = q.x, y0 = q.y;
  for (var t = 0; t < 10; t += 1 / 30) L.update(g, 1 / 30, {});
  assert.ok(Math.hypot(q.x - x0, q.y - y0) > 0, 'no camina');
  assert.ok(L.cityFits(g.city, q.x, q.y, L.data.city.body), 'se metió en una pared');
  // Night: nobody new.
  action('Noche (23 h)').run(g);
  g.people = g.people.filter(function (x) { return !x.street; });
  g.peopleT = S.every;
  L.update(g, 1 / 30, {});
  assert.ok(!g.people.some(function (x) { return x.street; }), 'de noche aparece gente');
  // Far away, the ones on the street leave.
  action('Mediodía (13 h)').run(g);
  g.peopleT = S.every; L.update(g, 1 / 30, {});
  var far = L.cityFree(g.city, p.x + (S.leave + 30) * s, p.y);
  p.x = far.x; p.y = far.y; g.peopleT = 0;
  L.update(g, 1 / 30, {});
  assert.ok(!g.people.some(function (x) { return x.street; }), 'la gente de la calle no se va');
});

test('sobrevivientes: guardar y seguir mantiene a la gente y lo que ya hiciste', function () {
  var L = Lluvia, g = peopleGame(95);
  L.peopleScan(g, 600);
  g.people[0].done = true;
  var data = JSON.parse(JSON.stringify(L.saveGame(g)));
  var h = peopleGame(95); L.applySave(h, data);
  assert.strictEqual(h.people.length, g.people.length);
  assert.ok(h.people[0].done);
  var before = h.people.length; L.peopleScan(h, 600);
  assert.strictEqual(h.people.length, before, 'al seguir aparecen vecinos repetidos');
});
