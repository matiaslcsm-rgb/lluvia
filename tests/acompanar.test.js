// Sending survivors to the Catedral or walking with them (stage 70, the user's answer 3, 2026-11-25): once you
// helped somebody you can send them to the refuge (they get there after a while and live there, asking for
// something every morning) or have them come with you (they keep up and hit zombies next to them).

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
function helped(g) {
  var L = Lluvia;
  action('A un sobreviviente').run(g);
  L.update(g, 1 / 30, {});
  var q = g.talkTarget;
  L.wear(g, 'mochila');
  if (q.want[0].indexOf('w:') === 0) L.giveMelee(g, q.want[0].slice(2)); else L.packAdd(g, q.want[0], q.want[1]);
  assert.strictEqual(L.personActions(g, q).length, 0, 'antes de ayudarlo ya te sigue');
  L.giveTo(g, q);
  return q;
}

test('acompañar: lo mandás a la Catedral, llega después de un rato y vive ahí; cada mañana pide algo', function () {
  var L = Lluvia, g = peopleGame(101), q = helped(g), s = g.city.scale;
  var send = L.personActions(g, q).filter(function (a) { return /Mandarlo/.test(a.label); })[0];
  assert.ok(send && send.run(), 'no se lo puede mandar');
  assert.strictEqual(q.mode, 'travel');
  L.stopTalking(g);
  L.update(g, 1 / 30, {});
  assert.notStrictEqual(g.talkTarget, q, 'en camino se puede hablar con él');
  var trip = q.travel;
  for (var t = 0; t < trip + 1 && q.mode === 'travel'; t += 0.5) L.update(g, 0.5, {});
  assert.strictEqual(q.mode, 'refuge', 'no llegó');
  assert.ok(L.inRefuge(g, q.x, q.y), 'no está adentro de la Catedral');
  assert.ok(q.want && !q.done, 'no pide nada');
  // You give the refuge what it needs: trust goes up, nothing comes back.
  L.packAdd(g, q.want[0], q.want[1]);
  var rep = g.rep.catedral;
  assert.ok(L.giveTo(g, q));
  assert.ok(g.rep.catedral > rep, 'rep ' + rep + ' -> ' + g.rep.catedral + ' trust ' + q.trust);
  // Next morning, a new need.
  g.time += 24 * L.data.clock.hour; L.update(g, 1 / 30, {});
  assert.ok(!q.done, 'a la mañana no pide de nuevo');
  // Living there it walks around, always inside.
  for (var k = 0; k < 20 * 30; k++) L.update(g, 1 / 30, {});
  assert.ok(L.inRefuge(g, q.x, q.y), 'se salió de la Catedral');
});

test('acompañar: te sigue de cerca, sale de su casa, te alcanza si te alejás y le pega a un zombi', function () {
  var L = Lluvia, g = peopleGame(102), q = helped(g), p = g.player, s = g.city.scale, F = L.data.survivors.follow;
  var go = L.personActions(g, q).filter(function (a) { return /acompañe/.test(a.label); })[0];
  assert.ok(go && go.run());
  L.stopTalking(g);
  assert.ok(!L.cityHouseAt(g.city, q.x, q.y) || L.cityHouseAt(g.city, q.x, q.y) === L.cityHouseAt(g.city, p.x, p.y), 'quedó encerrado en su casa');
  assert.ok(Math.hypot(q.x - p.x, q.y - p.y) < 3 * s);
  // Walk away down the street: it keeps close.
  action('A la plaza').run(g);
  for (var t = 0; t < 3; t += 1 / 30) L.update(g, 1 / 30, {});
  assert.ok(Math.hypot(q.x - p.x, q.y - p.y) < F.catch * s, 'no te alcanzó');
  var d0 = Math.hypot(q.x - p.x, q.y - p.y);
  for (var t2 = 0; t2 < 2; t2 += 1 / 30) L.update(g, 1 / 30, { x: 1, y: 0 });
  assert.ok(Math.hypot(q.x - p.x, q.y - p.y) < Math.max(d0, F.keep * s) + 4 * s, 'se queda atrás');
  assert.ok(L.cityFits(g.city, q.x, q.y, L.data.city.body) || q.floor, 'se metió en una pared');
  // A zombie next to it.
  var z = L.spawnEnemy(g, 'rastrero', q.x + 0.8 * s, q.y); z.floor = 0; z.hp = 100; z.maxHp = 100;
  for (var t3 = 0; t3 < 1.5; t3 += 1 / 30) { L.update(g, 1 / 30, {}); p.hp = p.stats.maxHp; }
  assert.ok(z.hp < 100, 'no le pega al zombi');
  // Walking with you it doesn't take E away: looking elsewhere you talk to nobody; looking at it, to it.
  p.aim = Math.atan2(q.y - p.y, q.x - p.x) + Math.PI;
  assert.ok(L.talkTarget(g) !== q, 'el que te sigue te tapa la E');
  p.aim = Math.atan2(q.y - p.y, q.x - p.x);
  if (Math.hypot(q.x - p.x, q.y - p.y) < (L.data.survivors.talk * s + p.r)) assert.strictEqual(L.talkTarget(g), q, 'mirándolo no le podés hablar');
  // Wait here: it stays.
  L.waitHere(g, q);
  var x0 = q.x, y0 = q.y;
  for (var t4 = 0; t4 < 2; t4 += 1 / 30) L.update(g, 1 / 30, { x: -1, y: 0 });
  assert.ok(Math.hypot(q.x - x0, q.y - y0) < 0.01, 'no espera');
  assert.ok(/acompañe/.test(L.personActions(g, q)[0].label));
});

test('acompañar: guardar y seguir mantiene a los que viven en la Catedral y a los que te siguen', function () {
  var L = Lluvia, g = peopleGame(103), q = helped(g);
  L.followMe(g, q);
  var data = JSON.parse(JSON.stringify(L.saveGame(g)));
  var h = peopleGame(103); L.applySave(h, data);
  var q2 = h.people.filter(function (x) { return x.id === q.id; })[0];
  assert.strictEqual(q2.mode, 'follow');
  for (var t = 0; t < 1; t += 1 / 30) L.update(h, 1 / 30, {});
  assert.ok(Math.hypot(q2.x - h.player.x, q2.y - h.player.y) < L.data.survivors.follow.catch * h.city.scale);
});

test('acompañar (revisión): la gente que no mirás no te saca la E; el viaje a la Catedral sigue mientras dormís', function () {
  var L = Lluvia, g = peopleGame(104), q = helped(g), p = g.player, s = g.city.scale;
  // Somebody right next to you, behind your back: E stays for the furniture and the doors.
  L.waitHere(g, q) || (q.mode = 'wait');
  q.house = null; q.door = null; q.x = p.x + 1 * s; q.y = p.y;
  p.aim = Math.PI;
  L.update(g, 1 / 30, {});
  assert.ok(g.talkTarget !== q, 'alguien a tu espalda te tapa la E');
  p.aim = 0;
  L.update(g, 1 / 30, {});
  assert.strictEqual(g.talkTarget, q, 'mirándolo no le hablás');
  // Sent off, then you sleep: the hours you sleep count for the trip.
  L.sendToRefuge(g, q); L.stopTalking(g);
  var trip = q.travel;
  p.energy = 10; L.sleep(g);
  var real = 0;
  while (q.mode === 'travel' && real < trip / 4) { L.update(g, 0.25, {}); real += 0.25; }
  assert.strictEqual(q.mode, 'refuge', 'durmiendo no llega: tardó lo mismo que despierto');
});
