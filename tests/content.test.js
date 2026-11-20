// Stage 6: ultis, fusions, new characters, abilities and items.

function cGame(charId, opts) {
  var o = { seed: 90, characterId: charId || 'brasa', viewW: 1280, viewH: 720, noSpawn: true };
  for (var k in opts) o[k] = opts[k];
  var g = Lluvia.createGame(o);
  g.player.abilities.length = 0; // only what the test adds
  return g;
}

function ready(g) { g.player.ulti.cd = 0; }

function ring(g, n, r, type) {
  var p = g.player, out = [];
  for (var i = 0; i < n; i++) {
    var a = i / n * Math.PI * 2;
    var e = Lluvia.spawnEnemy(g, type || 'bruto', p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
    e.hp = e.maxHp = 1e6;
    out.push(e);
  }
  Lluvia.update(g, 1 / 60, {}); // builds the grid
  return out;
}

test('los datos están completos: personajes, ultis y fusiones apuntan a cosas que existen', function () {
  var D = Lluvia.data;
  assert.strictEqual(D.characters.length, 5);
  D.characters.forEach(function (c) {
    assert.ok(Lluvia.findAbility(c.start), c.id + ': falta ' + c.start);
    assert.ok(Lluvia.findUlti(c.ulti), c.id + ': falta la ulti ' + c.ulti);
  });
  D.fusions.forEach(function (f) {
    assert.ok(Lluvia.findAbility(f.ability) && !Lluvia.findAbility(f.ability).fused, f.ability);
    assert.ok(Lluvia.findItem(f.item), f.item);
    assert.ok(Lluvia.findAbility(f.into).fused, f.into);
  });
  D.abilities.filter(function (a) { return !a.fused; }).forEach(function (a) {
    assert.ok(D.fusions.some(function (f) { return f.ability === a.id; }), a.id + ' no tiene fusión');
  });
});

test('la ulti arranca a media carga y no se puede tirar dos veces seguidas', function () {
  var g = cGame('brasa'), p = g.player;
  assert.ok(Math.abs(p.ulti.cd - p.ulti.def.cooldown / 2) < 1e-9);
  assert.ok(!Lluvia.castUlti(g, p.x + 100, p.y));
  ready(g);
  assert.ok(Lluvia.castUlti(g, p.x + 100, p.y));
  assert.ok(!Lluvia.castUlti(g, p.x + 100, p.y));
  Lluvia.update(g, p.ulti.def.cooldown + 0.1, {});
  assert.ok(Lluvia.ultiReady(p));
});

test('Lluvia de fuego daña donde apuntás y no del otro lado', function () {
  var g = cGame('brasa'), p = g.player;
  var there = Lluvia.spawnEnemy(g, 'bruto', p.x + 300, p.y), away = Lluvia.spawnEnemy(g, 'bruto', p.x - 300, p.y);
  there.hp = there.maxHp = away.hp = away.maxHp = 1e6;
  Lluvia.update(g, 1 / 60, {});
  ready(g);
  for (var i = 0; i < 3; i++) { ready(g); Lluvia.castUlti(g, there.x, there.y); }
  assert.ok(there.hp < there.maxHp, 'no le pegó');
  assert.strictEqual(away.hp, away.maxHp);
});

test('Terremoto y Raíces dejan quietos a los enemigos', function () {
  ['roca', 'musgo'].forEach(function (id) {
    var g = cGame(id), list = ring(g, 6, 150, 'rastrero');
    ready(g);
    assert.ok(Lluvia.castUlti(g, 0, 0));
    var before = list.map(function (e) { return [e.x, e.y]; });
    Lluvia.update(g, 1, {});
    list.forEach(function (e, i) {
      assert.ok(Math.abs(e.x - before[i][0]) < 1e-6 && Math.abs(e.y - before[i][1]) < 1e-6, id + ': un enemigo se movió');
    });
  });
});

test('Raíces te cura un 30% de la vida', function () {
  var g = cGame('musgo'), p = g.player;
  p.hp = 10;
  ready(g);
  Lluvia.castUlti(g, p.x, p.y);
  assert.ok(Math.abs(p.hp - (10 + p.stats.maxHp * 0.3)) < 1e-9);
});

test('Corte te lleva hasta donde apuntás y corta lo que cruzás', function () {
  var g = cGame('filo'), p = g.player, x0 = p.x;
  var mid = Lluvia.spawnEnemy(g, 'bruto', p.x + 200, p.y);
  mid.hp = mid.maxHp = 1e6;
  Lluvia.update(g, 1 / 60, {});
  ready(g);
  Lluvia.castUlti(g, p.x + 1000, p.y);
  assert.ok(Math.abs(p.x - (x0 + Lluvia.findUlti('corte').stats.distance)) < 1);
  assert.ok(mid.hp < mid.maxHp, 'no lo cortó');
  assert.ok(p.invuln > 0);
});

test('Haz pega en línea recta hasta lejos', function () {
  var g = cGame('ceniza'), p = g.player;
  var far = Lluvia.spawnEnemy(g, 'bruto', p.x, p.y - 800), side = Lluvia.spawnEnemy(g, 'bruto', p.x + 300, p.y - 400);
  far.hp = far.maxHp = side.hp = side.maxHp = 1e6;
  Lluvia.update(g, 1 / 60, {});
  ready(g);
  Lluvia.castUlti(g, p.x, p.y - 100);
  assert.ok(far.hp < far.maxHp);
  assert.strictEqual(side.hp, side.maxHp);
});

test('la ulti también se tira en un duelo y le pega al otro', function () {
  var m = Lluvia.createMatch({ seed: 91, characterId: 'ceniza', humanBot: true }), a = m.players[0], b = m.players[1];
  var d = Lluvia.createDuel(m, a, b, Lluvia.findById(Lluvia.data.duelRules, 'gigantes'));
  a.game.player.ulti.cd = 0;
  var foe = d.fighters[1], hp = foe.hp;
  assert.ok(Lluvia.castDuelUlti(d, 0, foe.x, foe.y));
  assert.ok(foe.hp < hp);
});

test('la IA tira la ulti cuando la rodean', function () {
  var g = cGame('roca'), bot = Lluvia.makeBot(1, 0.9);
  ring(g, 20, 120, 'rastrero');
  ready(g);
  assert.ok(Lluvia.botUlti(g, bot));
  assert.ok(!Lluvia.ultiReady(g.player));
});

test('la fusión aparece con la habilidad al máximo y su ítem, y la reemplaza', function () {
  var g = cGame('brasa'), p = g.player;
  Lluvia.addAbility(g, 'chispa');
  p.abilities[0].level = 5;
  assert.strictEqual(Lluvia.fusionsReady(g).length, 0, 'apareció sin el ítem');
  Lluvia.addItem(g, 'eco');
  assert.strictEqual(Lluvia.fusionsReady(g).length, 1);
  p.xp = 1e3;
  Lluvia.update(g, 1 / 60, {});
  assert.strictEqual(g.choice[0].type, 'fusion', 'la fusión no vino primera');
  Lluvia.choose(g, 0);
  assert.strictEqual(p.abilities.length, 1);
  assert.strictEqual(p.abilities[0].id, 'enjambre');
  assert.ok(p.abilities[0].stats.damage > Lluvia.abilityStats(Lluvia.findAbility('chispa'), 5).damage);
});

test('las fusiones nunca salen como habilidad nueva', function () {
  for (var s = 1; s <= 30; s++) {
    var g = cGame('brasa', { seed: s });
    Lluvia.addAbility(g, 'chispa');
    g.choice = Lluvia.makeChoices(g);
    g.choice.forEach(function (o) {
      if (o.type === 'newAbility') assert.ok(!Lluvia.findAbility(o.id).fused, o.id);
    });
  }
});

test('Escarcha deja lentos a los enemigos: avanzan la mitad', function () {
  var g = cGame('brasa'), p = g.player;
  var e = Lluvia.spawnEnemy(g, 'rastrero', p.x + 100, p.y), free = Lluvia.spawnEnemy(g, 'rastrero', p.x - 600, p.y);
  e.hp = e.maxHp = free.hp = free.maxHp = 1e6;
  Lluvia.addAbility(g, 'escarcha');
  Lluvia.update(g, 1 / 60, {});
  assert.ok(e.slow > 0, 'no quedó lento');
  var x0 = e.x, f0 = free.x;
  Lluvia.update(g, 0.5, {});
  var slowMoved = Math.abs(e.x - x0), freeMoved = Math.abs(free.x - f0);
  assert.ok(Math.abs(slowMoved / freeMoved - 0.5) < 0.1, 'avanzó ' + slowMoved + ' contra ' + freeMoved);
});

test('la Lupa agranda el área de las habilidades', function () {
  var g = cGame('roca'), p = g.player;
  Lluvia.addAbility(g, 'temblor');
  var r = Lluvia.findAbility('temblor').base.radius;
  var e = Lluvia.spawnEnemy(g, 'bruto', p.x + r + 30, p.y);
  e.hp = e.maxHp = 1e6; e.speed = 0;
  Lluvia.update(g, 1 / 60, {});
  assert.strictEqual(e.hp, e.maxHp, 'le pegó sin la Lupa');
  for (var i = 0; i < 3; i++) Lluvia.addItem(g, 'lupa');
  p.abilities[0].timer = 0;
  Lluvia.update(g, 1 / 60, {});
  assert.ok(e.hp < e.maxHp, 'con 3 lupas no llegó');
});

test('el Escudo baja el daño que recibís de la horda', function () {
  function taken(shields) {
    var g = cGame('roca'), p = g.player;
    for (var i = 0; i < shields; i++) Lluvia.addItem(g, 'escudo');
    var e = Lluvia.spawnEnemy(g, 'bruto', p.x, p.y);
    e.speed = 0;
    var hp = p.hp;
    Lluvia.update(g, 1, {});
    return hp - p.hp;
  }
  var none = taken(0), three = taken(3);
  assert.ok(three < none * 0.8, 'sin escudo ' + none + ', con 3 ' + three);
});

test('el Trébol da una opción más al subir de nivel', function () {
  var g = cGame('brasa'), p = g.player;
  Lluvia.addAbility(g, 'chispa');
  Lluvia.addItem(g, 'trebol');
  p.xp = 1e3;
  Lluvia.update(g, 1 / 60, {});
  assert.strictEqual(g.choice.length, 4);
});

test('el Fénix te salva una vez de perder una vida, y se gasta', function () {
  var g = cGame('roca'), p = g.player;
  Lluvia.addItem(g, 'fenix');
  var e = Lluvia.spawnEnemy(g, 'bruto', p.x, p.y);
  e.speed = 0; e.dps = 1e6;
  Lluvia.update(g, 1 / 30, {});
  assert.strictEqual(g.lives, 3);
  assert.ok(p.hp > 0);
  assert.ok(!p.items.fenix);
  assert.strictEqual(p.itemOrder.indexOf('fenix'), -1);
  p.invuln = 0;
  Lluvia.update(g, 1 / 30, {});
  assert.strictEqual(g.lives, 2, 'te salvó dos veces');
});
