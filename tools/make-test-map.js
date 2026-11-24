// Makes the small test map (tests/fixtures/map-prueba.js) from the real one (data/map-sanmiguel.js), so the tests
// of the map run in seconds instead of building the whole partido every time.
// It is a cut of the real San Miguel: the center around the plaza, 600 m a side, plus small lots copied from
// elsewhere (each building with 25 m around it) for every kind that the center has few of: factories, offices,
// schools, churches, garages... Everything keeps its real shape; the lots are set in a row east of the center.
// The border goes around the center and the row, so part of the rectangle is outside it, as in the real map.
// Usage: node tools/make-test-map.js   (run it again after re-baking the real map)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { Lluvia: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data/map-sanmiguel.js'), 'utf8'), ctx);
const M = ctx.Lluvia.data.maps.sanmiguel, U = 1 / M.unit; // map units per meter

const MAIN = 600 * U, LOT_PAD = 25 * U, GAP = 10 * U, NEED = 6;
const KINDS = ['edificio', 'escuela', 'salud', 'oficina', 'publico', 'industria', 'iglesia', 'garage', 'negocio', 'galpon', 'estacion'];

const boxOf = (f) => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (let i = 0; i + 1 < f.length; i += 2) { x0 = Math.min(x0, f[i]); x1 = Math.max(x1, f[i]); y0 = Math.min(y0, f[i + 1]); y1 = Math.max(y1, f[i + 1]); } return [x0, y0, x1, y1]; };
const within = (b, w) => b[0] >= w.x0 && b[1] >= w.y0 && b[2] <= w.x1 && b[3] <= w.y1;

// Windows of the real map that go into the test map: { x0, y0, x1, y1 } (real units) and where they land (ox, oy).
const sx = M.start[0], sy = M.start[1];
const main = { x0: sx - MAIN / 2, y0: sy - MAIN / 2, x1: sx + MAIN / 2, y1: sy + MAIN / 2, ox: 0, oy: 0 };
const windows = [main];
const inMain = new Set();
M.buildings.forEach((b, i) => { if (within(boxOf(b[0]), main)) inMain.add(i); });

// Lots: for each kind with fewer than NEED in the center, the first ones of that kind elsewhere (spread over the
// map: one every few of them), with an edificio of every kind of roof and basement among them.
const lots = [];
KINDS.forEach((kind) => {
  const k = M.kinds.indexOf(kind);
  let have = 0;
  inMain.forEach((i) => { if (M.buildings[i][1] === k) have++; });
  const all = [];
  M.buildings.forEach((b, i) => { if (b[1] === k && !inMain.has(i)) all.push(i); });
  const want = Math.max(0, NEED - have), step = Math.max(1, Math.floor(all.length / (want + 1)));
  for (let j = 0, n = 0; j < all.length && n < want; j += step, n++) lots.push(all[j]);
  console.log(kind.padEnd(10), 'en el centro', String(have).padStart(4), '| lotes', Math.min(want, all.length));
});
// Shelf-pack the lots in rows east of the center, up to the center's height.
let cx = MAIN + GAP, cy = 0, rowH = 0, right = MAIN;
lots.forEach((i) => {
  const b = boxOf(M.buildings[i][0]), w = b[2] - b[0] + 2 * LOT_PAD, h = b[3] - b[1] + 2 * LOT_PAD;
  if (cy + h > MAIN && rowH) { cx = right + GAP; cy = 0; rowH = 0; }
  windows.push({ x0: b[0] - LOT_PAD, y0: b[1] - LOT_PAD, x1: b[2] + LOT_PAD, y1: b[3] + LOT_PAD, ox: cx, oy: cy, lot: i });
  rowH = Math.max(rowH, w);
  right = Math.max(right, cx + w);
  cy += h + GAP;
});
const W = Math.ceil(right + GAP), H = Math.ceil(MAIN * 1.35); // a strip below the center stays outside the border

const move = (w, f) => f.map((v, j) => Math.round(j % 2 ? v - w.y0 + w.oy : v - w.x0 + w.ox));

// Clips a polyline to a window (Liang-Barsky per segment), giving the pieces inside.
function clipLine(f, w) {
  const out = [];
  let cur = null;
  for (let i = 0; i + 3 < f.length; i += 2) {
    let ax = f[i], ay = f[i + 1], bx = f[i + 2], by = f[i + 3], t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay, ok = true;
    [[-dx, ax - w.x0], [dx, w.x1 - ax], [-dy, ay - w.y0], [dy, w.y1 - ay]].forEach(([p, q]) => {
      if (!ok) return;
      if (p === 0) { if (q < 0) ok = false; return; }
      const r = q / p;
      if (p < 0) { if (r > t1) ok = false; else if (r > t0) t0 = r; } else { if (r < t0) ok = false; else if (r < t1) t1 = r; }
    });
    if (!ok) { cur = null; continue; }
    const p0 = [ax + dx * t0, ay + dy * t0], p1 = [ax + dx * t1, ay + dy * t1];
    if (!cur || t0 > 0) { cur = [p0[0], p0[1]]; out.push(cur); }
    cur.push(p1[0], p1[1]);
    if (t1 < 1) cur = null;
  }
  return out.filter((c) => c.length >= 4);
}
// Clips a polygon to a window (Sutherland-Hodgman).
function clipPoly(f, w) {
  let pts = [];
  for (let i = 0; i + 1 < f.length; i += 2) pts.push([f[i], f[i + 1]]);
  const edges = [[(p) => p[0] >= w.x0, (a, b) => [w.x0, a[1] + (b[1] - a[1]) * (w.x0 - a[0]) / (b[0] - a[0])]],
    [(p) => p[0] <= w.x1, (a, b) => [w.x1, a[1] + (b[1] - a[1]) * (w.x1 - a[0]) / (b[0] - a[0])]],
    [(p) => p[1] >= w.y0, (a, b) => [a[0] + (b[0] - a[0]) * (w.y0 - a[1]) / (b[1] - a[1]), w.y0]],
    [(p) => p[1] <= w.y1, (a, b) => [a[0] + (b[0] - a[0]) * (w.y1 - a[1]) / (b[1] - a[1]), w.y1]]];
  edges.forEach(([inside, cut]) => {
    const out = [];
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      if (inside(q)) { if (!inside(p)) out.push(cut(p, q)); out.push(q); } else if (inside(p)) out.push(cut(p, q));
    });
    pts = out;
  });
  return pts.length >= 3 ? [].concat(...pts) : null;
}

const T = { buildings: [], roads: [], parks: [], landuse: [], water: [], rail: [], places: [] }, newIndex = new Map();
windows.forEach((w) => {
  M.buildings.forEach((b, i) => {
    if (w.lot === undefined ? !inMain.has(i) : !within(boxOf(b[0]), w)) return;
    if (w.lot !== undefined && inMain.has(i)) return;
    newIndex.set(i + ':' + windows.indexOf(w), T.buildings.length);
    T.buildings.push([move(w, b[0])].concat(b.slice(1)));
  });
  M.roads.forEach((r) => clipLine(r[2], w).forEach((f) => T.roads.push([r[0], r[1], move(w, f)])));
  M.rail.forEach((r) => clipLine(r[2], w).forEach((f) => T.rail.push([r[0], r[1], move(w, f)])));
  M.water.forEach((r) => clipLine(r[2], w).forEach((f) => T.water.push([r[0], r[1], move(w, f)])));
  ['parks', 'landuse'].forEach((key) => M[key].forEach((r) => { const f = clipPoly(r[2], w); if (f) T[key].push([r[0], r[1], move(w, f)]); }));
  M.places.forEach((pl) => {
    if (pl[2] < w.x0 || pl[2] > w.x1 || pl[3] < w.y0 || pl[3] > w.y1) return;
    const bi = pl[4] >= 0 ? newIndex.get(pl[4] + ':' + windows.indexOf(w)) : -1;
    T.places.push([pl[0], pl[1], Math.round(pl[2] - w.x0 + w.ox), Math.round(pl[3] - w.y0 + w.oy), bi === undefined ? -1 : bi]);
  });
});

// Terrain: each point of the grid takes the real height of the spot it comes from.
const RT = M.terrain, step = RT.step, nx = Math.ceil(W / step), ny = Math.ceil(H / step), dm = [];
const realZ = (x, y) => { const i = Math.max(0, Math.min(RT.nx - 1, Math.floor(x / step))), j = Math.max(0, Math.min(RT.ny - 1, Math.floor(y / step))); return RT.dm[j * RT.nx + i]; };
for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
  const x = (i + 0.5) * step, y = (j + 0.5) * step;
  const w = windows.find((q) => x >= q.ox && y >= q.oy && x <= q.ox + (q.x1 - q.x0) && y <= q.oy + (q.y1 - q.y0)) || main;
  dm.push(realZ(x - w.ox + w.x0, y - w.oy + w.y0));
}

const map = {
  id: 'prueba', name: 'San Miguel', test: true, lat: M.lat, lon: M.lon, w: W, h: H, unit: M.unit,
  start: [Math.round(sx - main.x0), Math.round(sy - main.y0)],
  border: [0, 0, W, 0, W, MAIN, MAIN, MAIN, MAIN * 1.2, MAIN * 1.3, 0, MAIN * 1.3].map(Math.round),
  terrain: { nx, ny, step, dm, source: RT.source },
  roads: T.roads, parks: T.parks, landuse: T.landuse, water: T.water, rail: T.rail,
  kinds: M.kinds, roofs: M.roofs, buildings: T.buildings, places: T.places
};
const out = path.join(root, 'tests/fixtures/map-prueba.js');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, '// Test map, made by tools/make-test-map.js from data/map-sanmiguel.js (same data and credits: ' +
  '© OpenStreetMap contributors, Overture Maps Foundation, SRTM). A cut of San Miguel for fast tests.\n' +
  '(function (L) {\n  L.data = L.data || {};\n  L.data.maps = L.data.maps || {};\n  L.data.maps.prueba = ' + JSON.stringify(map) + ';\n})(this.Lluvia = this.Lluvia || {});\n');
console.log('\n' + T.buildings.length + ' edificios, ' + T.roads.length + ' calles, ' + (windows.length - 1) + ' lotes; ' +
  Math.round(W * M.unit) + ' × ' + Math.round(H * M.unit) + ' m; ' + Math.round(fs.statSync(out).size / 1024) + ' KB');
