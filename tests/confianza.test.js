// Trust and hitting survivors (stage 71, the user's answer 5, 2026-11-25): each one trusts you on its own and has
// ties with the others; hitting somebody costs their trust, the trust of whoever saw it (more if they were close to
// them) and the Catedral's; killing them makes them get up as one of them.

function peopleGame(seed) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: seed, city: city, explore: true, noSpawn: true, night: true, refuge: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  return g;
}
// Two people living in the Catedral next to you (made by hand, as if you had sent them).
function twoInRefuge(g) {
  var L = Lluvia, p = g.player, s = g.city.scale, out = [];
  L.peopleScan(g);
  for (var i = 0; i < 2; i++) {
    g.peopleN = (g.peopleN || 0) + 1;
    var at = L.cityFree(g.city, p.x + (1.2 + i * 1.5) * s, p.y);
    var q = { id: g.peopleN, name: i ? 'Raúl' : 'Marta', coat: '#6a5a48', x: at.x, y: at.y, floor: 0, house: g.refuge.house, door: null, street: false,
      want: ['comida', 2], give: ['balas', 10], done: false, line: 0, dirX: -1, dirY: 0, still: 1, r: p.r, hp: 30, trust: 60, ties: {}, mode: 'refuge', walk: { t: 99, dx: 0, dy: 0 } };
    g.people.push(q); out.push(q);
  }
  return out;
}

test('confianza: ayudar sube la confianza de esa persona; pegarle la baja, también la de quien lo ve y la de la Catedral', function () {
  var L = Lluvia, g = peopleGame(111), p = g.player, T = L.data.survivors.trust;
  var two = twoInRefuge(g), marta = two[0], raul = two[1];
  L.packAdd(g, 'comida', 2);
  assert.ok(L.giveTo(g, marta));
  assert.strictEqual(marta.trust, 60 + T.helped);
  // A blow aimed at Marta, with Raúl right there.
  p.aim = Math.atan2(marta.y - p.y, marta.x - p.x);
  var rep = g.rep.catedral, before = raul.trust;
  L.swing(g);
  assert.ok(marta.hp < 30, 'el golpe no le llegó');
  assert.strictEqual(marta.trust, 60 + T.helped + T.hit);
  assert.ok(raul.trust < before, 'Raúl lo vio y no le importa');
  assert.ok(g.rep.catedral < rep, 'la Catedral no se entera');
  assert.ok(L.trustWord(marta).length > 0);
  // More blows in the same fight: the Catedral counts it once.
  var rep2 = g.rep.catedral;
  L.hurtPerson(g, marta, 1); L.hurtPerson(g, marta, 1);
  assert.strictEqual(g.rep.catedral, rep2, 'cada golpe de la misma pelea vuelve a bajar');
});

test('confianza: los que viven juntos se encariñan; si le pegás a uno, al otro le duele más', function () {
  var L = Lluvia, g = peopleGame(112), p = g.player, T = L.data.survivors.trust;
  var two = twoInRefuge(g), marta = two[0], raul = two[1];
  for (var d = 0; d < 4; d++) { g.time += 24 * L.data.clock.hour; L.update(g, 1 / 30, {}); }
  assert.ok(raul.ties[marta.id] >= 3 * T.together, 'no se encariñan');
  marta.x = p.x + 1.2 * g.city.scale; marta.y = p.y; raul.x = p.x + 2.7 * g.city.scale; raul.y = p.y;
  var before = raul.trust;
  L.hurtPerson(g, marta, 5);
  assert.ok(before - raul.trust > -T.saw, 'el cariño no pesa');
});

test('confianza: con poca confianza no te habla ni te sigue; el que te sigue se va si le pegás', function () {
  var L = Lluvia, g = peopleGame(113), two = twoInRefuge(g), marta = two[0];
  marta.trust = 10;
  assert.ok(L.refuses(marta));
  assert.ok(L.personActions(g, marta).length === 0, 'te sigue igual');
  L.packAdd(g, 'comida', 2);
  assert.ok(!L.giveTo(g, marta), 'acepta cosas igual');
  assert.ok(/[Aa]lejate|[Aa]ndate|acerques/.test(L.personText(g, marta)));
  var raul = two[1];
  L.followMe(g, raul);
  L.hurtPerson(g, raul, 5);
  assert.notStrictEqual(raul.mode, 'follow', 'te sigue después de pegarle');
});

test('confianza: si lo matás queda en el piso y al rato se levanta como uno de ellos; una bala también le pega', function () {
  var L = Lluvia, g = peopleGame(114), p = g.player, s = g.city.scale, two = twoInRefuge(g), marta = two[0], raul = two[1];
  // A bullet at Marta.
  g.projectiles.push({ x: marta.x - 0.5 * s, y: marta.y, vx: 900, vy: 0, r: 3, damage: 40, pierce: 0, hit: [], life: 1, bullet: true, ox: p.x, oy: p.y, floor: 0 });
  L.update(g, 1 / 30, {});
  assert.ok(marta.dead, 'la bala no la mató');
  var n0 = g.enemies.length;
  for (var t = 0; t < L.data.survivors.turn + 1; t += 1 / 30) { L.update(g, 1 / 30, {}); p.hp = p.stats.maxHp; }
  assert.ok(g.enemies.length > n0, 'no se levantó');
  assert.ok(g.people.indexOf(marta) < 0, 'el cuerpo sigue ahí');
  assert.ok(raul.trust < 60, 'Raúl lo vio y no le importa');
});
