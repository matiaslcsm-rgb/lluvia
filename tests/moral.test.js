// The collective conscience (stage 73, the user's answer 5, 2026-11-25): each zone of the city has a morale, moved
// by what happens there; low morale brings more zombies, wears people's sanity, and at night voices and shadows.

function moraleGame(seed) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: seed, city: city, explore: true, noSpawn: true, night: true, refuge: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  L.peopleScan(g);
  return g;
}
function moralePerson(g, name, dx) {
  var L = Lluvia, p = g.player, s = g.city.scale, at = L.cityFree(g.city, p.x + (dx || 1.5) * s, p.y);
  g.peopleN = (g.peopleN || 0) + 1;
  var q = { id: g.peopleN, name: name, coat: '#6a5a48', x: at.x, y: at.y, floor: 0, house: null, door: null, street: false,
    want: ['comida', 2], give: ['balas', 10], done: false, line: 0, dirX: -1, dirY: 0, still: 1, r: p.r, hp: 30, trust: 60, ties: {}, sanity: 70,
    mode: 'wait', walk: { t: 99, dx: 0, dy: 0 } };
  g.people.push(q);
  return q;
}

test('moral: matar a alguien la baja mucho en esa zona y no en otra; ayudar la sube; con los días vuelve sola', function () {
  var L = Lluvia, g = moraleGame(131), p = g.player, s = g.city.scale, M = L.data.morale;
  var q = moralePerson(g, 'Hugo');
  assert.strictEqual(L.moraleAt(g, p.x, p.y), M.base);
  L.hurtPerson(g, q, 100);
  var here = L.moraleAt(g, q.x, q.y);
  assert.ok(here <= M.base + M.events.kill, 'matar no baja la moral');
  assert.strictEqual(L.moraleAt(g, q.x + 3 * M.cell * s, q.y), M.base, 'bajó en otra zona');
  var r = moralePerson(g, 'Estela', 2);
  r.mode = 'refuge'; L.packAdd(g, 'comida', 2); L.wear(g, 'mochila'); L.packAdd(g, 'comida', 2);
  L.giveTo(g, r);
  assert.ok(L.moraleAt(g, r.x, r.y) > here, 'ayudar no la sube');
  var v0 = L.moraleAt(g, r.x, r.y);
  L.update(g, 1 / 30, {});
  g.time += 24 * L.data.clock.hour; L.update(g, 1 / 30, {});
  assert.ok(L.moraleAt(g, r.x, r.y) > v0, 'con los días no vuelve');
});

test('moral: en una zona baja hay más zombis, la gente enloquece más rápido y de noche pasan cosas raras', function () {
  var L = Lluvia, g = moraleGame(132), p = g.player, M = L.data.morale;
  var q = moralePerson(g, 'Omar');
  L.moraleChange(g, p.x, p.y, -M.base);
  assert.ok(Math.abs(L.moraleMul(g) - M.zombies) < 1e-9, 'no hay más zombis');
  assert.strictEqual(L.moraleWord(L.moraleAt(g, p.x, p.y)), M.words.cursed);
  L.update(g, 1 / 30, {});
  var s0 = q.sanity;
  g.time += 24 * L.data.clock.hour; L.update(g, 1 / 30, {});
  assert.ok(s0 - q.sanity > -L.data.madness.daily.alone, 'la zona no le afecta');
  // Night: voices or shadows.
  for (var i = 0; i < L.debug.groups.length; i++) L.debug.groups[i].actions.forEach(function (a) { if (a.label === 'Noche (23 h)') a.run(g); });
  for (var t = 0; t < 120; t += 1 / 10) { L.update(g, 1 / 10, {}); p.hp = p.stats.maxHp; }
  assert.ok(g.omenN > 0, 'de noche no pasa nada raro');
});

test('moral: se guarda con la partida', function () {
  var L = Lluvia, g = moraleGame(133), p = g.player;
  L.moraleChange(g, p.x, p.y, -30);
  var data = JSON.parse(JSON.stringify(L.saveGame(g)));
  var h = moraleGame(133); L.applySave(h, data);
  assert.strictEqual(L.moraleAt(h, p.x, p.y), L.moraleAt(g, p.x, p.y));
});
