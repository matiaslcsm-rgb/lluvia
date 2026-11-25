// Health (stage 57, docs/CUERPO.md section 5): wounds, the life cap, bleeding, kits, infection and antibiotic,
// paracetamol, recovering asleep.

function healthGame() {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: 51, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false;
  var sp = L.cityFree(city, city.start.x, city.start.y);
  g.player.x = sp.x; g.player.y = sp.y; g.player.aim = 0;
  L.wear(g, 'mochila');
  return g;
}
function hours(g, h) { var L = Lluvia; L.updateHealth(g, 0, h * L.data.clock.hour); }

test('heridas: cortes y puntazos sangran y bajan la vida máxima; el golpe frena; venda, kit y paracetamol', function () {
  var L = Lluvia, H = L.data.health, g = healthGame(), p = g.player, full = p.stats.maxHp;
  L.addWound(g, 'k');
  assert.ok(Math.abs(L.lifeCap(g) - full * (1 - H.kinds.k.cap)) < 0.01, 'un corte no baja la vida máxima');
  assert.strictEqual(L.bleeding(p).length, 1);
  var cap = L.lifeCap(g); hours(g, 2);
  assert.ok(L.lifeCap(g) < cap - 1, 'sangrar no sigue bajando la vida máxima');
  assert.ok(p.hp <= L.lifeCap(g) + 1e-9, 'la vida pasa el tope');
  // A bandage stops it at once.
  L.packAdd(g, 'vendas', 1);
  assert.ok(L.quickBandage(g));
  assert.strictEqual(L.bleeding(p).length, 0, 'la venda no para el sangrado');
  cap = L.lifeCap(g); hours(g, 2);
  assert.strictEqual(L.lifeCap(g), cap, 'vendado sigue bajando');
  // A blow slows; paracetamol takes it away.
  L.addWound(g, 'c');
  assert.ok(p.bluntSlow > 0 && L.bleeding(p).length === 0, 'el golpe sangra o no frena');
  L.packAdd(g, 'paracetamol', 2);
  assert.ok(L.takeParacetamol(g)); hours(g, 0.01);
  assert.strictEqual(p.bluntSlow, 0, 'el paracetamol no alivia el golpe');
  // A kit: stops every bleeding and freezes the cap, then wears off and the wound bleeds again.
  L.addWound(g, 'p'); L.addWound(g, 'k');
  L.packAdd(g, 'kitCasero', 1);
  assert.ok(L.applyKit(g, 'kitCasero'));
  cap = L.lifeCap(g); hours(g, 20);
  assert.strictEqual(L.lifeCap(g), cap, 'con el kit la vida máxima baja');
  hours(g, 5);
  assert.ok(L.bleeding(p).length === 2 && p.kitT === 0, 'al terminar el kit casero (1 día) las heridas no vuelven a sangrar');
});

test('fabricar el kit casero; la farmacia y el botiquín; los zombis dejan heridas', function () {
  var L = Lluvia, g = healthGame(), p = g.player;
  var r = L.data.craft.recipes.filter(function (x) { return x.id === 'kitCasero'; })[0];
  assert.ok(L.craftBlock(g, r), 'se hace sin nada');
  L.packAdd(g, 'trapos', 1); L.packAdd(g, 'sanitizante', 1);
  assert.ok(L.craft(g, r), 'trapo y sanitizante no hacen un kit');
  assert.strictEqual(L.packCount(g, 'kitCasero'), 1);
  // Some shops are pharmacies, always the same, with their own tables.
  var shops = 0, pharm = 0;
  for (var i = 0; i < 400; i++) { var plan = { layout: 'shop', index: i }; shops++; if (L.isPharmacy(plan)) pharm++; }
  assert.ok(pharm > shops * 0.05 && pharm < shops * 0.3, 'farmacias: ' + pharm + ' de ' + shops);
  assert.ok(!L.isPharmacy({ layout: 'shed', index: 3 }));
  // The botiquín.
  L.packAdd(g, 'botiquin', 1);
  assert.ok(L.openBotiquin(g));
  assert.strictEqual(L.packCount(g, 'antibiotico') + g.ground.filter(function (q) { return q.slot.id === 'antibiotico'; }).reduce(function (a, q) { return a + q.slot.n; }, 0), 16);
  // A zombie's blows leave wounds.
  var z = L.spawnEnemy(g, 'rastrero', p.x + 5, p.y); z.floor = 0;
  L.takeWound(g, L.data.health.every * 3, z);
  assert.ok(p.wounds.length >= 3, 'los golpes no dejan heridas');
});

test('infección: aparece horas después; desinfectar la evita; antibiótico en 4 dosis que se toman solas; fiebre sin tratar', function () {
  var L = Lluvia, H = L.data.health, g = healthGame(), p = g.player;
  // Disinfected and kit: very unlikely; with a rag: likely. Many tries.
  var count = function (prep) {
    var n = 0;
    for (var i = 0; i < 200; i++) { var g2 = healthGame(); g2.rng = L.makeRng(1000 + i); prep(g2); L.updateHealth(g2, 0, (H.incub + 0.1) * L.data.clock.hour); if (g2.player.infection) n++; }
    return n;
  };
  var rag = count(function (g2) { L.addWound(g2, 'p'); L.packAdd(g2, 'trapos', 1); L.bandage(g2, 'trapos'); });
  var clean = count(function (g2) { L.addWound(g2, 'p'); L.packAdd(g2, 'alcohol', 1); L.disinfect(g2, 'alcohol'); L.packAdd(g2, 'kitFarmacia', 1); L.applyKit(g2, 'kitFarmacia'); });
  assert.ok(rag > clean * 4, 'desinfectar no baja la infección: trapo ' + rag + ', limpio ' + clean);
  // Infected: the first dose by hand, the rest by themselves every 8 h.
  L.addWound(g, 'k'); p.wounds[0].rolled = true;
  g.rng = function () { return 0.5; };
  p.infection = null;
  L.packAdd(g, 'antibiotico', 8); L.packAdd(g, 'agua', 5);
  assert.ok(!L.takeAntibiotic(g, false), 'toma antibiótico sin infección');
  g.player.infection = { h: 0, doses: 0, need: 4, next: 0, started: false, fever: false };
  assert.ok(L.takeAntibiotic(g, false));
  assert.strictEqual(p.infection.doses, 1);
  hours(g, 8.1); assert.strictEqual(p.infection.doses, 2, 'la segunda dosis no se toma sola');
  hours(g, 8.1); hours(g, 8.1);
  assert.strictEqual(p.infection, null, 'después de 4 dosis sigue infectado');
  // Untreated: fever after a day.
  p.infection = { h: 0, doses: 0, need: 4, next: 0, started: false, fever: false };
  p.energy = 100; p.fed = 20; p.capLost = 0.1; p.wounds = []; // hungry: no defenses; nothing bleeding
  var cap = L.lifeCap(g);
  hours(g, H.fever + 2);
  assert.ok(p.infection.fever, 'sin tratar no da fiebre');
  assert.ok(L.lifeCap(g) < cap, 'la fiebre no baja la vida máxima');
  // No water when it is time: an urgent warning, and it tries again.
  p.infection = { h: 0, doses: 1, need: 4, next: 0, started: true, fever: false };
  while (L.packCount(g, 'agua')) L.packTake(g, 'agua', 1);
  g.toasts = []; hours(g, 0.1);
  assert.ok(g.toasts.some(function (t) { return /no tenés agua/.test(t.text); }), 'no avisa que falta agua');
});

test('recuperarse: sin infección, con paracetamol, comido y tomado, durmiendo se recupera la vida máxima', function () {
  var L = Lluvia, H = L.data.health, g = healthGame(), p = g.player;
  L.addWound(g, 'k'); L.addWound(g, 'c'); p.wounds.forEach(function (w) { w.rolled = true; });
  L.packAdd(g, 'vendas', 1); L.bandage(g, 'vendas');
  assert.ok(p.capLost > 0);
  p.asleep = { bed: true, slept: 0 };
  hours(g, 4);
  assert.ok(!p.recovering && p.capLost > 0, 'se recupera sin paracetamol');
  L.packAdd(g, 'paracetamol', 1); L.takeParacetamol(g);
  p.fed = 0; p.watered = 0;
  for (var i = 0; i < 24; i++) { p.fed = 0; p.watered = 0; hours(g, 1); }
  assert.strictEqual(p.capLost, 0, 'un día durmiendo no te deja como nuevo: ' + p.capLost);
  assert.strictEqual(L.lifeCap(g), p.stats.maxHp);
  // Infected, no recovering.
  L.addWound(g, 'k'); p.wounds[0].rolled = true; L.packAdd(g, 'vendas', 1); L.bandage(g, 'vendas');
  p.infection = { h: 0, doses: 0, need: 4, next: 0, started: false, fever: false };
  L.packAdd(g, 'paracetamol', 1); L.takeParacetamol(g);
  var lost = p.capLost; hours(g, 3);
  assert.ok(p.capLost >= lost, 'infectado se recupera');
});
