// What you see (js/sight.js), on the test map.

function sightSetup() {
  var L = Lluvia, city = L.cityHome(1), s = city.scale;
  return { L: L, city: city, s: s, M: city.map };
}

test('vista: el cono hacia donde apuntás llega lejos, atrás solo lo que tenés pegado', function () {
  var o = sightSetup(), L = o.L, city = o.city, s = o.s;
  var sp = L.cityFree(city, city.start.x, city.start.y), me = { x: sp.x, y: sp.y, floor: 0 };
  // The longest open way from the start: aim along it.
  var best = 0, aim = 0;
  for (var a = 0; a < 64; a++) { var ang = a / 64 * Math.PI * 2, d = L.sightRay(city, me, me.x, me.y, ang, 40 * s); if (d > best) { best = d; aim = ang; } }
  assert.ok(best > 8 * s, 'desde la plaza no se ve ni 8 m: ' + (best / s).toFixed(1));
  var at = function (ang, m) { return [me.x + Math.cos(ang) * m * s, me.y + Math.sin(ang) * m * s]; };
  var ahead = at(aim, 7), behind = at(aim + Math.PI, 7), close = at(aim + Math.PI, 1.5);
  assert.ok(L.canSee(city, me, aim, ahead[0], ahead[1], 0), 'no se ve lo de adelante');
  assert.ok(!L.canSee(city, me, aim + Math.PI, ahead[0], ahead[1], 0), 'se ve lo que está a la espalda');
  assert.ok(L.canSee(city, me, aim, close[0], close[1], 0) || L.sightRay(city, me, me.x, me.y, aim + Math.PI, 1.5 * s) < 1.5 * s, 'no se siente lo que está pegado atrás');
  assert.ok(!L.canSee(city, me, aim, behind[0], behind[1], 0), 'se ve lejos a la espalda');
  assert.ok(!L.canSee(city, me, aim, ahead[0], ahead[1], 1), 'se ve otro piso');
  var poly = L.sightPolygon(city, me, aim);
  assert.ok(poly.length >= L.data.sight.rays - 2, 'el borde de lo que se ve tiene pocos puntos');
});

test('vista: las paredes tapan, las ventanas y las barandas dejan ver, por encima de una cama se ve y un ropero tapa', function () {
  var o = sightSetup(), L = o.L, city = o.city, s = o.s, M = o.M, body = L.data.city.body;
  var walls = [0, 0], wins = [0, 0], beds = [0, 0], tall = [0, 0];
  var look = function (from, to) { return L.canSee(city, { x: from[0], y: from[1], floor: 0 }, Math.atan2(to[1] - from[1], to[0] - from[0]), to[0], to[1], 0); };
  for (var i = 0; i < M.buildings.length && (walls[1] < 40 || wins[1] < 40 || beds[1] < 30); i++) {
    var p = L.cityHouse(city, i);
    if (!p) continue;
    // An inside wall: from one side you don't see the other.
    var rails = (p.railsPx || []).map(String); // stair railings are low: you see over them
    p.wallsPx.forEach(function (w) {
      if (rails.indexOf(String(w)) >= 0) return;
      var len = Math.hypot(w[2] - w[0], w[3] - w[1]);
      if (len < 1.5 * s) return;
      var nx = -(w[3] - w[1]) / len, ny = (w[2] - w[0]) / len, mx = (w[0] + w[2]) / 2, my = (w[1] + w[3]) / 2;
      var a = [mx + nx * 0.7 * s, my + ny * 0.7 * s], b = [mx - nx * 0.7 * s, my - ny * 0.7 * s];
      if (!L.cityFits(city, a[0], a[1], body) || !L.cityFits(city, b[0], b[1], body)) return;
      walls[1]++; if (!look(a, b)) walls[0]++;
    });
    // A window: from 1 m inside, 2 m out is in sight.
    var cx = 0, cy = 0;
    p.outline.forEach(function (q) { cx += q[0]; cy += q[1]; });
    cx /= p.outline.length; cy /= p.outline.length;
    p.windows.forEach(function (w) {
      var ax = w[0] * s, ay = w[1] * s, bx = w[2] * s, by = w[3] * s, len = Math.hypot(bx - ax, by - ay), mx = (ax + bx) / 2, my = (ay + by) / 2;
      var nx = -(by - ay) / len, ny = (bx - ax) / len;
      if (nx * (cx - mx) + ny * (cy - my) > 0) { nx = -nx; ny = -ny; } // outward
      var a = [mx - nx * 1 * s, my - ny * 1 * s], b = [mx + nx * 2 * s, my + ny * 2 * s];
      if (!L.cityFits(city, a[0], a[1], body) || L.citySightCell(city, Math.floor(b[0] / city.cell), Math.floor(b[1] / city.cell)) !== 1) return;
      wins[1]++; if (look(a, b)) wins[0]++;
    });
    // Over a bed, across it; through a wardrobe, along the wall.
    p.furniture.forEach(function (q, k) {
      var sp = p.solidPx[k], off = sp.hw + 0.45 * s;
      var a = [sp.x + sp.ax * off, sp.y + sp.ay * off], b = [sp.x - sp.ax * off, sp.y - sp.ay * off];
      if (!L.cityFits(city, a[0], a[1], body) || !L.cityFits(city, b[0], b[1], body)) return;
      if (q.t === 'cama') { beds[1]++; if (look(a, b)) beds[0]++; }
      if (q.t === 'ropero' || q.t === 'estante') { tall[1]++; if (!look(a, b)) tall[0]++; }
    });
  }
  assert.ok(walls[1] >= 20 && walls[0] >= walls[1] * 0.95, 'las paredes no tapan: ' + walls[0] + ' de ' + walls[1]);
  assert.ok(wins[1] >= 20 && wins[0] >= wins[1] * 0.8, 'por las ventanas no se ve: ' + wins[0] + ' de ' + wins[1]);
  assert.ok(beds[1] >= 10 && beds[0] >= beds[1] * 0.8, 'una cama tapa la vista: ' + beds[0] + ' de ' + beds[1]);
  assert.ok(tall[1] < 5 || tall[0] >= tall[1] * 0.9, 'un ropero o un estante no tapa: ' + tall[0] + ' de ' + tall[1]);
});

test('vista: en un piso de arriba las paredes de ese piso tapan', function () {
  var o = sightSetup(), L = o.L, city = o.city, s = o.s, M = o.M, n = [0, 0];
  for (var i = 0; i < M.buildings.length && n[1] < 30; i++) {
    var p = L.cityHouse(city, i), lv = p && L.planLevel(p, 1);
    if (!lv || lv.open) continue;
    var rails = (lv.railsPx || []).map(String);
    lv.wallsPx.forEach(function (w) {
      if (rails.indexOf(String(w)) >= 0) return;
      var len = Math.hypot(w[2] - w[0], w[3] - w[1]);
      if (len < 1.5 * s) return;
      var nx = -(w[3] - w[1]) / len, ny = (w[2] - w[0]) / len, mx = (w[0] + w[2]) / 2, my = (w[1] + w[3]) / 2;
      var a = [mx + nx * 0.7 * s, my + ny * 0.7 * s], b = [mx - nx * 0.7 * s, my - ny * 0.7 * s];
      if (!L.cityUpperFits(p, a[0], a[1], L.data.city.body, lv) || !L.cityUpperFits(p, b[0], b[1], L.data.city.body, lv)) return;
      var me = { x: a[0], y: a[1], floor: 1, house: p };
      n[1]++; if (!L.canSee(city, me, Math.atan2(b[1] - a[1], b[0] - a[0]), b[0], b[1], 1)) n[0]++;
    });
  }
  assert.ok(n[1] >= 10 && n[0] >= n[1] * 0.95, 'arriba las paredes no tapan: ' + n[0] + ' de ' + n[1]);
});
