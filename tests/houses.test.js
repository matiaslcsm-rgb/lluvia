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

test('escaleras: las casas de dos pisos tienen escalera (en el living, la cocina o un hall) y un piso de arriba con sus cuartos', function () {
  var L = Lluvia, withStair = 0, total = 0;
  for (var seed = 1; seed <= 40; seed++) {
    var p = L.housePlan(rectHouse(8 + (seed % 3), 12 + (seed % 4)), [0, -1], seed, { floors: 2 });
    total++;
    if (!p.stair) continue;
    withStair++;
    var st = p.stair;
    // Every cell under the stair belongs to the main room.
    for (var y = st.y0; y < st.y1; y++) for (var x = st.x0; x < st.x1; x++) assert.strictEqual(p.lab[y * p.W + x], st.room, 'la escalera pisa otro cuarto');
    var room = p.rooms[st.room];
    assert.ok(room.grown || /living|ambiente|cocina/.test(room.type), 'la escalera está en: ' + room.type);
    var up = p.upper;
    assert.ok(up.reachable, 'arriba hay un cuarto sin puerta (semilla ' + seed + ')');
    assert.ok(up.rooms.some(function (r) { return r.type === 'dormitorio' && r.cells; }), 'arriba no hay dormitorio');
    // The top of the stair lands in the upstairs corridor.
    var tx = st.axis === 'y' ? Math.floor((st.x0 + st.x1) / 2) : (st.up > 0 ? st.x1 - 1 : st.x0), ty = st.axis === 'y' ? (st.up > 0 ? st.y1 - 1 : st.y0) : Math.floor((st.y0 + st.y1) / 2);
    assert.strictEqual(up.rooms[up.lab[ty * up.W + tx]].type, 'pasillo', 'la escalera no llega al pasillo de arriba');
    assert.ok(L.stairT(st, tx + 0.5, ty + 0.5) > 0.8, 'la punta de arriba no es la de arriba');
  }
  assert.ok(withStair >= total * 0.8, 'pocas casas de dos pisos con escalera: ' + withStair + ' de ' + total);
  assert.ok(!L.housePlan(rectHouse(9, 14), [0, -1], 3, { floors: 1 }).stair, 'una casa de un piso con escalera');
});

test('escaleras de San Miguel: se suben caminando, arriba se llega a cada cuarto y por el costado no se entra', function () {
  var L = Lluvia, city = L.cityHome(1), s = city.scale, M = city.map, start = city.start, found = 0;
  for (var i = 0; i < M.buildings.length && found < 12; i++) {
    var f = M.buildings[i][0], bx = f[0] * M.unit * s, by = f[1] * M.unit * s;
    if (Math.abs(bx - start.x) > 600 * s || Math.abs(by - start.y) > 600 * s) continue;
    var p = L.cityHouse(city, i);
    if (!p || !p.upper) continue;
    found++;
    // The foot can be reached walking from the room around it (a search over the walk grid, from the room's
    // middle-most free spot near the foot).
    var st0 = p.stair, cell = city.cell, mid = st0.axis === 'y' ? (st0.x0 + st0.x1) / 2 : (st0.y0 + st0.y1) / 2;
    var along = function (t) { var a = st0.up > 0 ? t : 1 - t; return st0.axis === 'y' ? L.housePoint(p, mid, st0.y0 + (st0.y1 - st0.y0) * a) : L.housePoint(p, st0.x0 + (st0.x1 - st0.x0) * a, mid); };
    var first = along(0.08), fromRoom = null, best = Infinity;
    for (var rc = 0; rc < p.lab.length; rc++) {
      if (p.lab[rc] !== st0.room || L.stairT(st0, rc % p.W + 0.5, Math.floor(rc / p.W) + 0.5) !== null) continue;
      var rm = L.housePoint(p, rc % p.W + 0.5, Math.floor(rc / p.W) + 0.5), rx = rm[0] * s, ry = rm[1] * s, rd = Math.hypot(rx - p.footPx[0], ry - p.footPx[1]);
      if (rd > 0.6 * s && rd < best && L.cityFits(city, rx, ry, L.data.city.body)) { best = rd; fromRoom = { x: rx, y: ry }; }
    }
    assert.ok(fromRoom, 'en la casa ' + i + ' no hay lugar libre en el cuarto de la escalera');
    var c0 = [Math.floor(fromRoom.x / cell), Math.floor(fromRoom.y / cell)];
    var visited = new Set([c0.join()]), todo = [c0], got = null;
    while (todo.length && !got && visited.size < 4000) {
      var cc = todo.shift(), cq = L.housePlanPoint(p, (cc[0] + 0.5) * cell, (cc[1] + 0.5) * cell), ct = L.stairT(st0, cq[0], cq[1]);
      if (ct !== null && ct < 0.35) { got = cc; break; } // on the lower part of the stair
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) {
        var nn = [cc[0] + dd[0], cc[1] + dd[1]], key = nn.join();
        if (!visited.has(key) && L.cityFits(city, (nn[0] + 0.5) * cell, (nn[1] + 0.5) * cell, L.data.city.body)) { visited.add(key); todo.push(nn); }
      });
    }
    assert.ok(got, 'en la casa ' + i + ' no se llega caminando al pie de la escalera');
    // From there, walking up the stair: you pass halfway and end upstairs, all the way up.
    var ent = { x: (got[0] + 0.5) * cell, y: (got[1] + 0.5) * cell, floor: 0, z: 0 }, out = {}, sawMiddle = false;
    for (var k = 0; k < 400 && !(ent.floor === 1 && ent.z === 1); k++) {
      var dx = p.topPx[0] - ent.x, dy = p.topPx[1] - ent.y, d = Math.hypot(dx, dy) || 1, step = Math.min(d, 6);
      L.cityLevelMove(city, ent, ent.x + dx / d * step, ent.y + dy / d * step, 14, out);
      ent.x = out.x; ent.y = out.y;
      if (ent.z > 0.3 && ent.z < 0.7) sawMiddle = true;
    }
    assert.ok(sawMiddle, 'en la casa ' + i + ' no se pasa por la mitad de la escalera');
    assert.strictEqual(ent.floor, 1, 'en la casa ' + i + ' la escalera no lleva arriba (z ' + ent.z + ')');
    // From the top, walking upstairs, every room is reached (a grid of spots 25 cm apart).
    var c = 0.25 * s, xs = p.outline.map(function (q) { return q[0]; }), ys = p.outline.map(function (q) { return q[1]; });
    var x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys), nx = Math.ceil((Math.max.apply(null, xs) - x0) / c), ny = Math.ceil((Math.max.apply(null, ys) - y0) / c);
    var fits = function (gx, gy) { return gx >= 0 && gy >= 0 && gx < nx && gy < ny && L.cityUpperFits(p, x0 + (gx + 0.5) * c, y0 + (gy + 0.5) * c, L.data.city.body); };
    var seen = new Uint8Array(nx * ny), g0 = [Math.floor((ent.x - x0) / c), Math.floor((ent.y - y0) / c)], queue = [g0];
    assert.ok(fits(g0[0], g0[1]), 'arriba de la escalera de la casa ' + i + ' no hay lugar');
    seen[g0[1] * nx + g0[0]] = 1;
    while (queue.length) {
      var cur = queue.pop();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) {
        var gx = cur[0] + dd[0], gy = cur[1] + dd[1];
        if (fits(gx, gy) && !seen[gy * nx + gx]) { seen[gy * nx + gx] = 1; queue.push([gx, gy]); }
      });
    }
    p.upper.rooms.forEach(function (r, ri) {
      if (r.cells < 16) return;
      var reached = false;
      for (var cc = 0; cc < p.upper.lab.length && !reached; cc++) {
        if (p.upper.lab[cc] !== ri) continue;
        var m = L.housePoint(p, cc % p.W + 0.5, Math.floor(cc / p.W) + 0.5), gx = Math.floor((m[0] * s - x0) / c), gy = Math.floor((m[1] * s - y0) / c);
        if (gx >= 0 && gy >= 0 && gx < nx && gy < ny && seen[gy * nx + gx]) reached = true;
      }
      assert.ok(reached, 'arriba no se llega al ' + r.type + ' de la casa ' + i);
    });
    // On the ground floor, from beside the middle of the stair, walking into it from the side doesn't get you on it.
    var st = p.stair, midT = st.axis === 'y' ? [st.x0 - 1.2, (st.y0 + st.y1) / 2, st.x1 + 1.2, (st.y0 + st.y1) / 2] : [(st.x0 + st.x1) / 2, st.y0 - 1.2, (st.x0 + st.x1) / 2, st.y1 + 1.2];
    [[midT[0], midT[1], midT[2], midT[3]], [midT[2], midT[3], midT[0], midT[1]]].forEach(function (pair) {
      var a = L.housePoint(p, pair[0], pair[1]), b = L.housePoint(p, pair[2], pair[3]), side = { x: a[0] * s, y: a[1] * s, floor: 0, z: 0 };
      if (!L.cityFits(city, side.x, side.y, L.data.city.body)) return; // the wall side
      for (var k2 = 0; k2 < 60; k2++) {
        var ddx = b[0] * s - side.x, ddy = b[1] * s - side.y, dd = Math.hypot(ddx, ddy) || 1;
        L.cityLevelMove(city, side, side.x + ddx / dd * 5, side.y + ddy / dd * 5, 14, out);
        side.x = out.x; side.y = out.y;
        assert.ok(!(side.z > 0.2), 'en la casa ' + i + ' se entra a la escalera por el costado');
      }
    });
  }
  assert.ok(found >= 8, 'pocas casas con escalera cerca de la plaza: ' + found);
});

test('escaleras: las paredes de un piso no frenan en el otro', function () {
  var L = Lluvia, city = L.cityHome(1), s = city.scale, M = city.map, start = city.start, checked = 0;
  for (var i = 0; i < M.buildings.length && checked < 5; i++) {
    var f = M.buildings[i][0], bx = f[0] * M.unit * s, by = f[1] * M.unit * s;
    if (Math.abs(bx - start.x) > 600 * s || Math.abs(by - start.y) > 600 * s) continue;
    var p = L.cityHouse(city, i);
    if (!p || !p.upper) continue;
    // A spot on a ground-floor wall that is in the middle of a room upstairs: closed below, open above.
    p.wallsPx.forEach(function (w) {
      var mx = (w[0] + w[2]) / 2, my = (w[1] + w[3]) / 2;
      if (L.cityWalkable(city, mx, my) || !L.cityUpperFits(p, mx, my, L.data.city.body)) return;
      assert.ok(L.cityLevelOpen(city, 1, p, mx, my) && !L.cityLevelOpen(city, 0, p, mx, my), 'los pisos se mezclan en la casa ' + i);
      checked++;
    });
  }
  assert.ok(checked >= 3, 'no se encontraron paredes de abajo bajo cuartos de arriba: ' + checked);
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

test('edificios: palier con escalera en U, departamentos en cada piso, terraza arriba y sótano abajo', function () {
  var L = Lluvia, made = 0;
  for (var seed = 1; seed <= 20; seed++) {
    var floors = 3 + (seed % 6), bottom = seed % 2 === 0 ? -1 : 0;
    var p = L.buildingPlan(rectHouse(11 + (seed % 6), 20 + (seed % 9)), [0, -1], seed, { floors: floors, roof: 'terraza', basement: bottom < 0 });
    if (!p) continue;
    made++;
    assert.strictEqual(p.top, floors, 'la terraza no está arriba de todo');
    assert.strictEqual(p.bottom, bottom, 'el sótano');
    // A flight from every floor to the next, alternating the two lanes.
    for (var f = bottom; f < floors; f++) {
      var st = L.stairToward(p, f, f + 1);
      assert.ok(st, 'sin escalera del piso ' + f + ' al ' + (f + 1));
      assert.strictEqual(st.lane, ((f % 2) + 2) % 2, 'los tramos no se alternan');
      assert.strictEqual(L.stairToward(p, f + 1, f), st, 'para bajar no se usa la misma');
    }
    // Every floor: every room reached from the palier (or the hall); the street door on the hall.
    for (f = bottom; f <= floors; f++) assert.ok(L.planLevel(p, f) && L.planLevel(p, f).reachable, 'un cuarto sin puerta en el piso ' + f + ' (semilla ' + seed + ')');
    assert.ok(p.exits.some(function (e) { return e.side < 0 && p.rooms[e.room].type === 'hall'; }), 'la puerta de calle no da al hall');
    var up = p.levels[1], baths = up.rooms.filter(function (r) { return r.type === 'bano' && r.cells; }).length;
    assert.ok(baths >= 2, 'un piso con ' + baths + ' baños: tiene que tener al menos dos departamentos');
    assert.strictEqual(p.levels[floors].open, 'terraza');
    if (bottom < 0) assert.strictEqual(p.levels[-1].open, 'sotano');
    // The floors repeat (the same apartments), each with its own railings.
    if (floors >= 3) { assert.strictEqual(p.levels[1].lab, p.levels[2].lab); assert.notStrictEqual(p.levels[1].walls, p.levels[2].walls); }
  }
  assert.ok(made >= 15, 'pocos edificios armados: ' + made + ' de 20');
});

test('casas con terraza y sótano: se sube a la terraza y se baja al sótano', function () {
  var L = Lluvia, roofs = 0, cellars = 0;
  for (var seed = 1; seed <= 30; seed++) {
    var floors = 1 + (seed % 2), p = L.housePlan(rectHouse(9 + (seed % 3), 14 + (seed % 5)), [0, -1], seed, { floors: floors, roof: 'terraza', basement: true });
    if (L.stairToward(p, floors - 1, floors) && p.levels[floors] && p.levels[floors].open === 'terraza') roofs++;
    if (L.stairToward(p, 0, -1) && p.levels[-1]) cellars++;
    // Stairs never overlap.
    p.stairs.forEach(function (a, i) {
      p.stairs.forEach(function (b, j) {
        if (j > i) assert.ok(a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0, 'dos escaleras encimadas en la casa ' + seed);
      });
    });
  }
  assert.ok(roofs >= 18, 'pocas casas llegan a la terraza: ' + roofs + ' de 30');
  assert.ok(cellars >= 18, 'pocas casas bajan al sótano: ' + cellars + ' de 30');
});

// Walks `ent` on its floor of building `p` to (tx, ty) px, along a path found over spots where a body fits: the
// walk grid's cells on the ground floor, spots 25 cm apart on the others. False if it can't get there.
function walkTo(L, city, p, ent, tx, ty) {
  var s = city.scale, f = ent.floor || 0, c = f ? 0.25 * s : city.cell, body = L.data.city.body, level = L.planLevel(p, f);
  var xs = p.outline.map(function (q) { return q[0]; }), ys = p.outline.map(function (q) { return q[1]; });
  var x0 = Math.floor((Math.min.apply(null, xs) - 3 * s) / c) * c, y0 = Math.floor((Math.min.apply(null, ys) - 3 * s) / c) * c;
  var nx = Math.ceil((Math.max.apply(null, xs) + 3 * s - x0) / c), ny = Math.ceil((Math.max.apply(null, ys) + 3 * s - y0) / c);
  var fits = function (gx, gy) {
    if (gx < 0 || gy < 0 || gx >= nx || gy >= ny) return false;
    var x = x0 + (gx + 0.5) * c, y = y0 + (gy + 0.5) * c;
    return f ? L.cityUpperFits(p, x, y, body, level) : L.cityFits(city, x, y, body);
  };
  var g = function (x, y) { return [Math.floor((x - x0) / c), Math.floor((y - y0) / c)]; };
  var a = g(ent.x, ent.y), b = g(tx, ty), from = new Int32Array(nx * ny).fill(-1), q = [a[1] * nx + a[0]], best = q[0], bestD = Infinity;
  from[q[0]] = q[0];
  for (var h = 0; h < q.length; h++) {
    var k = q[h], kx = k % nx, ky = Math.floor(k / nx), d = Math.hypot(kx - b[0], ky - b[1]);
    if (d < bestD) { bestD = d; best = k; }
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) {
      var mx = kx + dd[0], my = ky + dd[1], m = my * nx + mx;
      if (fits(mx, my) && from[m] < 0) { from[m] = k; q.push(m); }
    });
  }
  if (bestD * c > 0.75 * s) return false;
  var path = [];
  for (k = best; k !== from[k]; k = from[k]) path.unshift(k);
  var out = {};
  path.forEach(function (k) { L.cityLevelMove(city, ent, x0 + (k % nx + 0.5) * c, y0 + (Math.floor(k / nx) + 0.5) * c, body, out); ent.x = out.x; ent.y = out.y; });
  return true;
}

// Walks straight to (tx, ty) px in short steps.
function walkStraight(L, city, ent, tx, ty) {
  var out = {};
  for (var k = 0; k < 400; k++) {
    var dx = tx - ent.x, dy = ty - ent.y, d = Math.hypot(dx, dy);
    if (d < 1) break;
    var step = Math.min(d, 4);
    L.cityLevelMove(city, ent, ent.x + dx / d * step, ent.y + dy / d * step, L.data.city.body, out);
    ent.x = out.x; ent.y = out.y;
  }
}

test('edificios de San Miguel: desde la vereda se sube caminando hasta la terraza, se baja al sótano y en el primer piso se llega a cada departamento', function () {
  var L = Lluvia, city = L.cityHome(1), M = city.map, s = city.scale, found = 0;
  for (var i = 0; i < M.buildings.length && found < 5; i++) {
    if (M.kinds[M.buildings[i][1]] !== 'edificio') continue;
    var p = L.cityHouse(city, i);
    if (!p || !p.exitsPx.length) continue;
    found++;
    var door = p.exitsPx[0], ent = { x: door.x + door.nx * 0.8 * s, y: door.y + door.ny * 0.8 * s, floor: 0, z: 0 };
    for (var f = 0; f < p.top; f++) {
      var st = L.stairToward(p, f, f + 1);
      assert.ok(walkTo(L, city, p, ent, st.footPx[0], st.footPx[1]), 'en el edificio ' + i + ' no se llega al pie de la escalera del piso ' + f);
      walkStraight(L, city, ent, st.topPx[0], st.topPx[1]);
      assert.strictEqual(ent.floor, f + 1, 'en el edificio ' + i + ' la escalera del piso ' + f + ' no sube (z ' + ent.z + ')');
      if (f + 1 !== 1) continue;
      // Floor 1: every apartment's rooms can be reached from the stair.
      var lv = p.levels[1];
      lv.rooms.forEach(function (r, ri) {
        if (r.cells < 16) return;
        var m = null;
        for (var k = 0; k < lv.lab.length && !m; k++) if (lv.lab[k] === ri) {
          var w = L.housePoint(p, k % p.W + 0.5, Math.floor(k / p.W) + 0.5);
          if (L.cityUpperFits(p, w[0] * s, w[1] * s, L.data.city.body, lv)) m = w;
        }
        if (!m) return;
        var probe = { x: ent.x, y: ent.y, floor: 1, z: 1, house: p };
        assert.ok(walkTo(L, city, p, probe, m[0] * s, m[1] * s), 'en el edificio ' + i + ' no se llega al ' + r.type + ' del primer piso');
      });
    }
    for (f = p.top; f > p.bottom; f--) {
      st = L.stairToward(p, f, f - 1);
      assert.ok(walkTo(L, city, p, ent, st.topPx[0], st.topPx[1]), 'en el edificio ' + i + ' no se llega a la escalera para bajar del piso ' + f);
      walkStraight(L, city, ent, st.footPx[0], st.footPx[1]);
      assert.strictEqual(ent.floor, f - 1, 'en el edificio ' + i + ' no se baja del piso ' + f);
    }
  }
  assert.ok(found >= 4, 'pocos edificios con interior: ' + found);
});

test('otros edificios: galpón, negocio con depósito y baño, fábrica con oficina, iglesia con sacristía, escuela con aulas', function () {
  var L = Lluvia, H = L.data.houses, types = function (p) { return p.rooms.filter(function (r) { return r.cells; }).map(function (r) { return r.type; }); };
  var shed = L.housePlan(rectHouse(4, 5), [0, -1], 3, { layout: 'shed', spec: H.special.galpon });
  assert.deepStrictEqual(types(shed), ['galpon']);
  assert.ok(shed.exits.length && shed.reachable, 'el galpón sin puerta');
  for (var seed = 1; seed <= 10; seed++) {
    var shop = L.housePlan(rectHouse(8, 18), [0, -1], seed, { layout: 'shop', spec: H.special.negocio });
    ['local', 'deposito', 'bano'].forEach(function (t) { assert.ok(types(shop).indexOf(t) >= 0, 'el negocio sin ' + t); });
    assert.ok(shop.reachable && shop.exits.some(function (e) { return e.side < 0 && shop.rooms[e.room].type === 'local'; }), 'al negocio no se entra por el local');
    var shop2 = L.housePlan(rectHouse(9, 18), [0, -1], seed, { layout: 'shop', spec: H.special.negocio, floors: 2 });
    if (shop2.upper) assert.ok(types(shop2.upper).indexOf('dormitorio') >= 0, 'arriba del negocio no hay vivienda');
  }
  var fab = L.housePlan(rectHouse(30, 50), [0, -1], 5, { layout: 'nave', spec: H.special.industria });
  ['nave', 'oficina', 'bano'].forEach(function (t) { assert.ok(types(fab).indexOf(t) >= 0, 'la fábrica sin ' + t); });
  var church = L.housePlan(rectHouse(14, 30), [0, -1], 5, { layout: 'nave', spec: H.special.iglesia });
  assert.deepStrictEqual(types(church).sort(), ['sacristia', 'templo']);
  assert.ok(fab.reachable && church.reachable);
  var school = L.buildingPlan(rectHouse(30, 40), [0, -1], 4, { floors: 3, roof: 'terraza', fill: H.building.kinds.escuela });
  var aulas = school.levels[1].rooms.filter(function (r) { return r.type === 'aula' && r.cells; }).length;
  assert.ok(aulas >= 6, 'la escuela tiene ' + aulas + ' aulas por piso');
  for (var f = 0; f <= school.top; f++) assert.ok(L.planLevel(school, f).reachable, 'en la escuela un aula sin puerta en el piso ' + f);
});

test('otros edificios de San Miguel: se entra y se llega a cada cuarto en galpones, negocios, fábricas, iglesias, escuelas, salud y oficinas', function () {
  var L = Lluvia, city = L.cityHome(1), M = city.map, s = city.scale, kinds = ['galpon', 'negocio', 'industria', 'iglesia', 'escuela', 'salud', 'oficina'];
  kinds.forEach(function (kind) {
    var found = 0, seen = 0;
    for (var i = 0; i < M.buildings.length && found < 3; i++) {
      if (M.kinds[M.buildings[i][1]] !== kind) continue;
      seen++;
      var p = L.cityHouse(city, i);
      if (!p || !p.exitsPx.length) continue;
      found++;
      var door = p.exitsPx[0], start = { x: door.x + door.nx * 0.8 * s, y: door.y + door.ny * 0.8 * s, floor: 0, z: 0 };
      p.rooms.forEach(function (r, ri) {
        if (r.cells < 16) return;
        var m = null;
        for (var k = 0; k < p.lab.length && !m; k++) if (p.lab[k] === ri) {
          var w = L.housePoint(p, k % p.W + 0.5, Math.floor(k / p.W) + 0.5);
          if (L.cityFits(city, w[0] * s, w[1] * s, L.data.city.body)) m = w;
        }
        if (!m) return;
        var ent = { x: start.x, y: start.y, floor: 0, z: 0 };
        assert.ok(walkTo(L, city, p, ent, m[0] * s, m[1] * s), 'en ' + kind + ' ' + i + ' no se llega al ' + r.type);
      });
    }
    assert.ok(found >= Math.min(3, seen) - 1, 'pocos ' + kind + ' con interior: ' + found + ' de ' + seen + ' mirados');
  });
});
