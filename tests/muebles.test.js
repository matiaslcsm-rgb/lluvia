// Furniture, doors and windows (js/furnish.js), on the test map.

function pieceBox(q, cs) {
  var w = q.w / cs / 2, d = q.d / cs / 2, hx = q.face[0] ? d : w, hy = q.face[0] ? w : d;
  return [q.cx - hx, q.cy - hy, q.cx + hx, q.cy + hy];
}

test('muebles: cada cuarto con lo suyo, adentro de su cuarto, sin pisarse, lejos de puertas y escaleras', function () {
  var L = Lluvia, city = L.cityHome(1), M = city.map, need = { dormitorio: 'cama', bano: 'inodoro', cocina: 'mesada', aula: 'pupitre' };
  var rooms = {}, have = {}, plans = 0;
  for (var i = 0; i < M.buildings.length; i++) {
    var p = L.cityHouse(city, i);
    if (!p) continue;
    plans++;
    var cs = p.cell, floors = [0].concat(Object.keys(p.levels).map(Number));
    floors.forEach(function (f) {
      var lv = L.planLevel(p, f), boxes = lv.furniture.map(function (q) { return pieceBox(q, cs); });
      lv.furniture.forEach(function (q, a) {
        var b = boxes[a], e = 0.02;
        // Its corners in its own room.
        [[b[0] + e, b[1] + e], [b[2] - e, b[1] + e], [b[0] + e, b[3] - e], [b[2] - e, b[3] - e]].forEach(function (c) {
          assert.strictEqual(lv.lab[Math.floor(c[1]) * p.W + Math.floor(c[0])], q.room, 'en ' + i + ' piso ' + f + ' ' + q.t + ' se sale de su ' + lv.rooms[q.room].type);
        });
        for (var o = a + 1; o < boxes.length; o++) {
          var c = boxes[o];
          assert.ok(b[2] <= c[0] + e || c[2] <= b[0] + e || b[3] <= c[1] + e || c[3] <= b[1] + e, 'en ' + i + ' ' + q.t + ' pisa ' + lv.furniture[o].t);
        }
        // Not in a doorway's swing (the door's own length out from it) nor on a stair.
        (lv.doors || []).concat(f ? [] : p.exits.map(function (x) { return x.seg; })).forEach(function (g) {
          var r = L.data.houses.door / cs - 0.5, d = g[0] === g[2] ? [g[0] - r, Math.min(g[1], g[3]), g[0] + r, Math.max(g[1], g[3])] : [Math.min(g[0], g[2]), g[1] - r, Math.max(g[0], g[2]), g[1] + r];
          assert.ok(b[2] <= d[0] + e || d[2] <= b[0] + e || b[3] <= d[1] + e || d[3] <= b[1] + e, 'en ' + i + ' ' + q.t + ' tapa una puerta');
        });
        p.stairs.forEach(function (st) {
          if (st.from !== f && st.from + 1 !== f) return;
          assert.ok(b[2] <= st.x0 + e || st.x1 <= b[0] + e || b[3] <= st.y0 + e || st.y1 <= b[1] + e, 'en ' + i + ' ' + q.t + ' sobre la escalera');
        });
      });
      lv.rooms.forEach(function (r, k) {
        if (r.cells < 60 || !need[r.type]) return; // 15 m²: smaller leftovers may have no room for it
        rooms[r.type] = (rooms[r.type] || 0) + 1;
        if (lv.furniture.some(function (q) { return q.room === k && q.t === need[r.type]; })) have[r.type] = (have[r.type] || 0) + 1;
        // Rows all look the same way.
        var faces = {};
        lv.furniture.forEach(function (q) { if (q.room === k && q.t === 'pupitre') faces[q.face] = 1; });
        assert.ok(Object.keys(faces).length <= 1, 'en ' + i + ' los pupitres miran para distintos lados');
      });
    });
  }
  assert.ok(plans > 300, 'pocos edificios con interior: ' + plans);
  Object.keys(need).forEach(function (t) {
    assert.ok(rooms[t] > 0, 'no hay ningún ' + t);
    assert.ok(have[t] >= rooms[t] * 0.9, 'sin ' + need[t] + ': ' + (rooms[t] - (have[t] || 0)) + ' de ' + rooms[t] + ' ' + t);
  });
});

test('ventanas: sobre la pared de afuera, no en la terraza ni contra otro edificio', function () {
  var L = Lluvia, city = L.cityHome(1), M = city.map, s = city.scale, total = 0;
  var segDist = function (x, y, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y);
  };
  for (var i = 0; i < M.buildings.length; i++) {
    var p = L.cityHouse(city, i);
    if (!p) continue;
    var pts = p.outline.map(function (q) { return [q[0] / s, q[1] / s]; });
    var onOutline = function (x, y) { for (var k = 0; k < pts.length; k++) if (segDist(x, y, pts[k], pts[(k + 1) % pts.length]) < 0.02) return true; return false; };
    [0].concat(Object.keys(p.levels).map(Number)).forEach(function (f) {
      var lv = L.planLevel(p, f);
      if (lv.open === 'terraza') assert.strictEqual(lv.windows.length, 0, 'ventanas en la terraza de ' + i);
      lv.windows.forEach(function (w) {
        total++;
        assert.ok(onOutline(w[0], w[1]) && onOutline(w[2], w[3]), 'en ' + i + ' una ventana fuera de la pared');
        assert.ok(Math.hypot(w[2] - w[0], w[3] - w[1]) >= 0.5, 'en ' + i + ' una ventana muy chica');
      });
    });
  }
  assert.ok(total > 1000, 'pocas ventanas: ' + total);
});
