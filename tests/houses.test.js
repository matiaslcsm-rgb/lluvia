// Houses you can walk into: floor plans made from each footprint (js/interiors.js, data/houses.js).

function rectHouse(w, d) { return [[0, 0], [w, 0], [w, d], [0, d]]; }

// A plan's shape in a few words, to compare houses.
function signature(plan) {
  return plan.layout + ':' + plan.rooms.filter(function (r) { return r.cells; }).map(function (r) { return r.type[0] + Math.round(r.cells / 10); }).join('');
}

test('casas por dentro: la misma casa sale igual, y entre vecinas casi no se repiten', function () {
  var L = Lluvia, pts = rectHouse(9, 16), up = [0, -1];
  assert.strictEqual(signature(L.housePlan(pts, up, 7)), signature(L.housePlan(pts, up, 7)), 'la misma casa cambió');
  var seen = new Set(), layouts = new Set();
  for (var i = 0; i < 60; i++) {
    var p = L.housePlan(rectHouse(7 + (i % 5), 12 + (i % 7)), up, i + 1);
    seen.add(signature(p)); layouts.add(p.layout);
  }
  assert.ok(seen.size >= 45, 'muchas casas iguales: ' + seen.size + ' distintas de 60');
  assert.ok(layouts.size >= 4, 'pocas distribuciones: ' + Array.from(layouts).join(', '));
});

test('casas por dentro: todos los cuartos se alcanzan desde la puerta de calle, que mira a la calle', function () {
  var L = Lluvia, OUT = L.housePlan.OUT;
  var shapes = [rectHouse(6, 9), rectHouse(8, 14), rectHouse(10, 20), rectHouse(12, 12), rectHouse(5, 18),
    [[0, 0], [12, 0], [12, 7], [6, 7], [6, 15], [0, 15]]]; // an L
  shapes.forEach(function (pts, si) {
    for (var seed = 1; seed <= 25; seed++) {
      var p = L.housePlan(pts, [0, -1], seed * 31 + si);
      assert.ok(p.reachable, 'un cuarto sin puerta (forma ' + si + ', semilla ' + seed + ', ' + p.layout + ')');
      var front = p.exits.filter(function (e) { return e.side < 0; })[0];
      assert.ok(front, 'sin puerta de calle (forma ' + si + ', ' + p.layout + ')');
      // The street is up (y < 0 on the map): the front door is on the side closest to it.
      var q = L.housePoint(p, front.x, front.y);
      assert.ok(q[1] < 1.2, 'la puerta no da a la calle: y = ' + q[1].toFixed(1) + ' (forma ' + si + ')');
      // No room cell lies outside the footprint.
      for (var c = 0; c < p.lab.length; c++) {
        if (p.lab[c] < 0) continue;
        var m = L.housePoint(p, c % p.W + 0.5, Math.floor(c / p.W) + 0.5), inside = false;
        for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          if ((pts[i][1] > m[1]) !== (pts[j][1] > m[1]) && m[0] < (pts[j][0] - pts[i][0]) * (m[1] - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0]) inside = !inside;
        }
        assert.ok(inside, 'un cuarto se sale de la casa');
      }
      assert.ok(p.lab.some(function (v) { return v === OUT; }) || si < 5, 'la L tiene que dejar celdas afuera');
    }
  });
});

test('casas por dentro: más metros, más dormitorios; y los dormitorios tienen tamaño de dormitorio', function () {
  var L = Lluvia, avg = function (w, d) {
    var n = 0;
    for (var s = 1; s <= 30; s++) n += L.housePlan(rectHouse(w, d), [0, -1], s).bedrooms;
    return n / 30;
  };
  var small = avg(6, 7), mid = avg(8, 11), big = avg(10, 15);
  assert.ok(small < mid && mid < big, 'dormitorios: ' + small.toFixed(1) + ', ' + mid.toFixed(1) + ', ' + big.toFixed(1));
  for (var s = 1; s <= 40; s++) {
    var p = L.housePlan(rectHouse(9, 15), [0, -1], s);
    p.rooms.forEach(function (r) {
      if (r.type === 'dormitorio' && r.cells) assert.ok(r.cells * 0.25 >= 5.5, 'dormitorio de ' + (r.cells * 0.25) + ' m² (' + p.layout + ')');
    });
  }
});

test('casas de San Miguel: se entra por la puerta, adentro se camina y las paredes no se atraviesan', function () {
  var L = Lluvia, city = L.cityHome(1), s = city.scale, M = city.map, start = city.start, found = 0, tried = 0;
  for (var i = 0; i < M.buildings.length && found < 30 && tried < 8000; i++) {
    var f = M.buildings[i][0], x = f[0] * M.unit * s, y = f[1] * M.unit * s;
    if (Math.abs(x - start.x) > 400 * s || Math.abs(y - start.y) > 400 * s) continue;
    tried++;
    var p = L.cityHouse(city, i);
    if (!p || !p.exitsPx.length) continue;
    found++;
    // The front doorway is open.
    var door = p.exitsPx[0];
    assert.ok(L.cityWalkable(city, door.x, door.y), 'la puerta de la casa ' + i + ' está tapada');
    // From outside the front door, walking only (cell by cell, where a body fits), you reach every room.
    var c = city.cell, xs = p.outline.map(function (q) { return q[0]; }), ys = p.outline.map(function (q) { return q[1]; });
    var bx0 = Math.floor((Math.min.apply(null, xs) - 3 * s) / c), bx1 = Math.floor((Math.max.apply(null, xs) + 3 * s) / c);
    var by0 = Math.floor((Math.min.apply(null, ys) - 3 * s) / c), by1 = Math.floor((Math.max.apply(null, ys) + 3 * s) / c), bw = bx1 - bx0 + 1;
    var ok = function (cx, cy) { return cx >= bx0 && cx <= bx1 && cy >= by0 && cy <= by1 && L.cityFits(city, (cx + 0.5) * c, (cy + 0.5) * c, L.data.city.body); };
    var out = { x: door.x + door.nx * 0.8 * s, y: door.y + door.ny * 0.8 * s }; // 80 cm out of the door
    var startCell = [Math.floor(out.x / c), Math.floor(out.y / c)], seenCells = new Uint8Array(bw * (by1 - by0 + 1)), queue = [startCell];
    assert.ok(ok(startCell[0], startCell[1]), 'frente a la puerta de la casa ' + i + ' no se puede estar');
    seenCells[(startCell[1] - by0) * bw + startCell[0] - bx0] = 1;
    while (queue.length) {
      var cur = queue.pop();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) {
        var nx = cur[0] + dd[0], ny = cur[1] + dd[1], key = (ny - by0) * bw + nx - bx0;
        if (ok(nx, ny) && !seenCells[key]) { seenCells[key] = 1; queue.push([nx, ny]); }
      });
    }
    // Every room is reached, with room to stand in it (on a turned house the walls take a good part of a small one).
    p.rooms.forEach(function (r, ri) {
      if (r.cells < 16) return;
      var reached = 0;
      for (var k = 0; k < p.lab.length; k++) {
        if (p.lab[k] !== ri) continue;
        var m = L.housePoint(p, k % p.W + 0.5, Math.floor(k / p.W) + 0.5), mx = Math.floor(m[0] * s / c), my = Math.floor(m[1] * s / c);
        if (mx >= bx0 && mx <= bx1 && my >= by0 && my <= by1 && seenCells[(my - by0) * bw + mx - bx0]) reached++;
      }
      assert.ok(reached >= 3, 'desde la vereda se llega a ' + reached + ' de ' + r.cells + ' celdas del ' + r.type + ' de la casa ' + i + ' (' + p.layout + ')');
    });
    // An inside wall can't be crossed: a body walking straight across its middle, from 60 cm on one side to 60 cm
    // on the other, doesn't fit somewhere on the way.
    p.wallsPx.forEach(function (w) {
      var len = Math.hypot(w[2] - w[0], w[3] - w[1]);
      if (len < 2 * s) return;
      var mx = (w[0] + w[2]) / 2, my = (w[1] + w[3]) / 2, nx = -(w[3] - w[1]) / len, ny = (w[2] - w[0]) / len, hit = false;
      for (var t = -0.6; t <= 0.6 && !hit; t += 0.05) if (!L.cityFits(city, mx + nx * t * s, my + ny * t * s, L.data.city.body)) hit = true;
      assert.ok(hit, 'una pared de la casa ' + i + ' se cruza');
    });
  }
  assert.ok(found >= 6, 'pocas casas con interior cerca de la plaza: ' + found);
});
