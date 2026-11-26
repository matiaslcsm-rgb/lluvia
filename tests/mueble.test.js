// The window of a piece of furniture (the user, 2026-11-25: "que se abra un submenú cuando se revisan los muebles,
// así puedo mover lo que me interese, algo similar al Project Zomboid"): searching opens it instead of taking
// everything; you take one thing, all of it, or leave yours there, and it stays.

function pieceGame(seed) {
  var L = Lluvia, city = L.cityHome(1);
  var g = L.createGame({ seed: seed, city: city, explore: true, noSpawn: true, night: true, gunsOnly: true, gun: 'glock', viewW: 1280, viewH: 720 });
  g.spawning = false; g.lootMenu = true;
  L.wear(g, 'mochila');
  return g;
}
// A piece near the start that holds at least `n` things, with the player standing next to it.
function besidePiece(g, n) {
  var L = Lluvia, city = g.city, s = city.scale, p = g.player;
  for (var i = 0; i < city.map.buildings.length; i++) {
    var plan = L.cityHouse(city, i);
    if (!plan || !plan.exitsPx.length) continue;
    var lv = L.planLevel(plan, 0);
    for (var k = 0; k < lv.solidPx.length; k++) {
      var t = lv.furniture[k].t;
      if (!L.data.loot.pieces[t] || L.lootOf(plan, 0, k, t).length < n) continue;
      var o = lv.solidPx[k];
      for (var side = 0; side < 4; side++) {
        var ax = [o.fx, -o.fx, o.ax, -o.ax][side], ay = [o.fy, -o.fy, o.ay, -o.ay][side], d = (side < 2 ? o.hd : o.hw) + p.r + 0.1 * s;
        p.x = o.x + ax * d; p.y = o.y + ay * d; p.floor = 0; p.house = null;
        if (L.cityHouseAt(city, p.x, p.y) !== plan || !L.cityFits(city, p.x, p.y, L.data.city.body)) continue;
        var tg = L.searchTarget(g);
        if (tg && tg.k === k) return tg;
      }
    }
  }
  return null;
}

test('mueble: revisar abre la ventana del mueble y no te llevás nada solo', function () {
  var L = Lluvia, g = pieceGame(81), tg = besidePiece(g, 2);
  assert.ok(tg, 'no hay un mueble con cosas');
  var before = JSON.stringify(g.pack.places);
  for (var t = 0; t < L.data.loot.search + 0.2; t += 1 / 30) L.updateLoot(g, 1 / 30, { use: true });
  assert.ok(g.openPiece, 'no se abrió la ventana');
  assert.strictEqual(g.openPiece.key, tg.key);
  assert.ok(g.openPiece.slots.length >= 2, 'el mueble no muestra lo que tiene');
  assert.strictEqual(JSON.stringify(g.pack.places), before, 'te llevaste cosas sin elegir');
  assert.ok(L.pieceName(tg.t).length > 0);
});

test('mueble: sacás una cosa, dejás una tuya, y al volver a abrirlo sigue ahí sin esperar', function () {
  var L = Lluvia, g = pieceGame(82), tg = besidePiece(g, 2);
  L.openPiece(g, tg);
  var n0 = g.openPiece.slots.length, first = g.openPiece.slots[0];
  assert.ok(L.takeFromPiece(g, 0) || true);
  assert.ok(g.openPiece.slots.length < n0 || g.openPiece.slots[0] !== first, 'no se sacó nada');
  // Leave water there.
  L.packAdd(g, 'agua', 2);
  var mochila = g.pack.places.filter(function (pl) { return pl.id === 'mochila'; })[0], i = mochila.slots.map(function (sl) { return sl.id; }).indexOf('agua');
  assert.ok(L.putInPiece(g, { pl: mochila, i: i }), 'no se puede dejar');
  assert.strictEqual(L.packCount(g, 'agua'), 0);
  var left = g.openPiece.slots.length;
  L.closePiece(g);
  assert.ok(!g.openPiece);
  // Closed with E: the E still held does not open it again.
  L.updateLoot(g, 1 / 30, { use: true });
  assert.ok(!g.openPiece, 'cerrar con E lo vuelve a abrir');
  // A press of E opens it again at once, with what you left.
  L.updateLoot(g, 1 / 30, {});
  L.updateLoot(g, 1 / 30, { use: true });
  assert.ok(g.openPiece, 'no se vuelve a abrir');
  assert.strictEqual(g.openPiece.slots.length, left);
  assert.ok(g.openPiece.slots.some(function (sl) { return sl.id === 'agua' && sl.n === 2; }), 'el agua no quedó en el mueble');
  // Take all: everything that fits comes with you; the pistol never goes in.
  L.takeAllFromPiece(g);
  assert.strictEqual(L.packCount(g, 'agua'), 2, 'tomar todo no trae el agua');
  var pockets = g.pack.places.filter(function (pl) { return pl.id === 'bolsillos'; })[0], gi = pockets.slots.map(function (sl) { return sl.id; }).indexOf('gun');
  if (gi >= 0) assert.ok(!L.putInPiece(g, { pl: pockets, i: gi }), 'la pistola se puede dejar');
  // Saved and loaded, the piece keeps what it holds.
  L.closePiece(g);
  var data = JSON.parse(JSON.stringify(L.saveGame(g)));
  var h = pieceGame(82); L.applySave(h, data);
  assert.deepStrictEqual(JSON.stringify(L.pieceSlots(h, tg)), JSON.stringify(L.pieceSlots(g, tg)));
});

test('mueble: sin la ventana (modos viejos y pruebas) revisar sigue llevándose todo', function () {
  var L = Lluvia, g = pieceGame(83); g.lootMenu = false;
  var tg = besidePiece(g, 1);
  for (var t = 0; t < L.data.loot.search + 0.2; t += 1 / 30) L.updateLoot(g, 1 / 30, { use: true });
  assert.ok(!g.openPiece);
  assert.ok(g.searched.has(tg.key));
});
