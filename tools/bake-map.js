// Bakes the San Miguel map from everything downloaded to tools/raw/ (see tools/fetch/ and docs/MAPA.md):
//   the boundary of the Partido de San Miguel (OpenStreetMap), which clips everything else;
//   OpenStreetMap streets, plazas and parks; Overture buildings (OpenStreetMap + Google + Microsoft footprints),
//   places, land use, water and the railway; SRTM terrain heights.
// Each building gets a kind, floors, roof and basement: from the data when it has them, estimated when not
// (marked `est`). Interiors, stairs and roofs you can walk on are generated from this later, in the game.
// The area is the rectangle in tools/fetch/area.json (tools/fetch/frame.js), with (0, 0) at its north-west corner.
// Usage: node tools/bake-map.js            → writes data/map-sanmiguel.js
'use strict';
const fs = require('fs'), path = require('path');
const RAW = path.join(__dirname, 'raw'), OUT = path.join(__dirname, '..', 'data', 'map-sanmiguel.js');
const F = require('./fetch/frame.js');
const { lat0, lon0, w: W, h: H, toM } = F, plaza = F.area.plaza, Q = 2; // coordinates in half meters
const q = (v) => Math.round(v * Q);

// ---- Reading ----
function csv(file) {
  const text = fs.readFileSync(path.join(RAW, file), 'utf8'), rows = [];
  let row = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; } else cell += ch; }
    else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift();
  return rows.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
// WKT → list of rings (outer rings only) in meters.
function rings(wkt) {
  const out = [];
  const body = wkt.replace(/^[A-Z]+\s*/, '');
  if (/^POINT/.test(wkt)) { const m = body.match(/\(([-\d.]+)\s+([-\d.]+)\)/); return m ? [[toM(+m[1], +m[2])]] : []; }
  if (/^(LINESTRING|MULTILINESTRING)/.test(wkt)) {
    body.split(/\)\s*,\s*\(/).forEach((part) => out.push(part.replace(/[()]/g, '').split(',').map((p) => { const [x, y] = p.trim().split(/\s+/); return toM(+x, +y); })));
    return out;
  }
  // POLYGON ((outer), (hole)) or MULTIPOLYGON (((outer), (hole)), ((outer)))
  const polys = /^MULTIPOLYGON/.test(wkt) ? body.slice(1, -1).split(/\)\)\s*,\s*\(\(/) : [body];
  polys.forEach((pg) => {
    const outer = pg.replace(/^\(+/, '').split(/\)\s*,\s*\(/)[0].replace(/[()]/g, '');
    out.push(outer.split(',').map((p) => { const [x, y] = p.trim().split(/\s+/); return toM(+x, +y); }));
  });
  return out;
}
// Drops points that barely change the shape (Douglas-Peucker, tolerance in meters).
function simplify(pts, tol) {
  if (pts.length < 5) return pts;
  const keep = new Array(pts.length).fill(false); keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let best = -1, bd = tol;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = pts[i], [x1, y1] = pts[a], [x2, y2] = pts[b], dx = x2 - x1, dy = y2 - y1;
      const d = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / (Math.hypot(dx, dy) || 1);
      if (d > bd) { bd = d; best = i; }
    }
    if (best > 0) { keep[best] = true; stack.push([a, best], [best, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// A closed ring (first point = last) is simplified in two halves, split at the point farthest from the start.
function simplifyRing(ring, tol) {
  let far = 0, fd = -1;
  ring.forEach((p, i) => { const d = Math.hypot(p[0] - ring[0][0], p[1] - ring[0][1]); if (d > fd) { fd = d; far = i; } });
  return simplify(ring.slice(0, far + 1), tol).concat(simplify(ring.slice(far), tol).slice(1, -1));
}
const flat = (pts) => { const f = []; pts.forEach((p) => f.push(q(p[0]), q(p[1]))); return f; };
const area = (pts) => { let s = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) s += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(s / 2); };
const inside = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
// The boundary of the partido: its outer ways joined into one ring.
const border = (() => {
  const rel = JSON.parse(fs.readFileSync(path.join(RAW, 'sm-boundary.json'), 'utf8')).elements.find((e) => e.id === F.area.boundary);
  const segs = rel.members.filter((m) => m.type === 'way' && m.role === 'outer' && m.geometry).map((m) => m.geometry.map((g) => toM(g.lon, g.lat)));
  let ring = segs.shift();
  while (segs.length) {
    const e = ring[ring.length - 1], near = (p) => Math.hypot(p[0] - e[0], p[1] - e[1]) < 1;
    const i = segs.findIndex((s) => near(s[0]) || near(s[s.length - 1]));
    if (i < 0) throw new Error('the boundary does not close');
    const s = segs.splice(i, 1)[0];
    ring = ring.concat((near(s[0]) ? s : s.reverse()).slice(1));
  }
  return ring;
})();
// Kept: what is inside the partido or within MARGIN meters of its edge (drawn beyond the edge, never walked).
// A 10 m mask of the rectangle makes the test quick.
const MARGIN = 60, MC = 10, mcols = Math.ceil(W / MC), mrows = Math.ceil(H / MC), mask = new Uint8Array(mcols * mrows);
(() => {
  const inner = new Uint8Array(mcols * mrows);
  for (let j = 0; j < mrows; j++) for (let i = 0; i < mcols; i++) if (inside(border, (i + 0.5) * MC, (j + 0.5) * MC)) inner[j * mcols + i] = 1;
  const r = Math.ceil(MARGIN / MC);
  for (let j = 0; j < mrows; j++) for (let i = 0; i < mcols; i++) {
    if (!inner[j * mcols + i]) continue;
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      const a = i + di, b = j + dj;
      if (a >= 0 && b >= 0 && a < mcols && b < mrows && di * di + dj * dj <= r * r) mask[b * mcols + a] = 1;
    }
  }
})();
const kept = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[Math.floor(y / MC) * mcols + Math.floor(x / MC)] === 1;
const inSquare = (pts) => pts.some(([x, y]) => kept(x, y));
// Same answer every time for the same building: a hash of its id.
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

// ---- Kinds, floors, roofs, basements ----
const KINDS = ['casa', 'galpon', 'negocio', 'edificio', 'escuela', 'iglesia', 'salud', 'estacion', 'industria', 'garage', 'oficina', 'publico'];
const ROOFS = ['terraza', 'tejas', 'chapa'];
const SRCS = { 'OpenStreetMap': 0, 'Google Open Buildings': 1, 'Microsoft ML Buildings': 2 };
function kindFrom(cls, cat, a) {
  const s = (cls || '') + ' ' + (cat || '');
  if (/school|college|university|kindergarten|preschool/.test(s)) return 'escuela';
  if (/church|worship|religious|cathedral|chapel/.test(s)) return 'iglesia';
  if (/hospital|clinic|medical|health|doctor|dentist|pharmacy/.test(s)) return 'salud';
  if (/train_station|station|transportation/.test(s)) return 'estacion';
  if (/industrial|factory|warehouse|manufactur/.test(s)) return 'industria';
  if (/apartments|residential_building/.test(s)) return 'edificio';
  if (/office|bank|government|civic|townhall|police|fire/.test(s)) return /office|bank/.test(s) ? 'oficina' : 'publico';
  if (/garage|parking|carport/.test(s)) return 'garage';
  if (/retail|commercial|shop|store|restaurant|cafe|bar|supermarket|mall|food|service|hotel/.test(s)) return 'negocio';
  if (/shed|roof|hut|cabin/.test(s) || a < 30) return 'galpon';
  if (a > 1500) return 'industria';
  return 'casa';
}

const dem = JSON.parse(fs.readFileSync(path.join(RAW, 'sm-dem.json'), 'utf8'));
const [px, py] = toM(plaza.lon, plaza.lat);

// Places: named spots (shops, schools, churches...).
const places = csv('sm-places.csv').map((p) => { const r = rings(p.wkt)[0]; return r && r[0] ? { name: p.name, cat: p.cat, x: r[0][0], y: r[0][1] } : null; })
  .filter((p) => p && kept(p.x, p.y));

// Buildings.
const osmTags = {}; // OpenStreetMap tags by rounded centroid (Overture keeps the shape, not all the tags)
JSON.parse(fs.readFileSync(path.join(RAW, 'sm-bld.json'), 'utf8')).elements.forEach((el) => {
  if (!el.geometry) return;
  const pts = el.geometry.map((g) => toM(g.lon, g.lat)), cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  osmTags[Math.round(cx / 3) + ',' + Math.round(cy / 3)] = el.tags || {};
});
const B = [];
csv('sm-overture.csv').forEach((r) => {
  rings(r.wkt).forEach((ring, part) => {
    if (ring.length < 4 || !inSquare(ring)) return;
    const pts = simplify(ring.slice(0, -1), 0.35), a = area(pts);
    if (pts.length < 3 || a < 6) return;
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    B.push({ id: r.id + ':' + part, pts, a, cx, cy, cls: r.class || r.subtype || '', floors: +r.num_floors || 0, under: +r.num_floors_underground || 0,
      roof: r.roof_shape || '', src: SRCS[r.src] !== undefined ? SRCS[r.src] : 1, tags: osmTags[Math.round(cx / 3) + ',' + Math.round(cy / 3)] });
  });
});
// Which building each place is in (a coarse grid makes it quick).
const G = 40, grid = new Map();
B.forEach((b, i) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  b.pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
  for (let gx = Math.floor(x0 / G); gx <= Math.floor(x1 / G); gx++) for (let gy = Math.floor(y0 / G); gy <= Math.floor(y1 / G); gy++) {
    const k = gx + ',' + gy; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i);
  }
});
places.forEach((p, pi) => {
  const cand = grid.get(Math.floor(p.x / G) + ',' + Math.floor(p.y / G)) || [];
  for (const i of cand) if (inside(B[i].pts, p.x, p.y)) { p.b = i; if (!B[i].place) B[i].place = pi; break; }
});
let estimated = 0;
B.forEach((b) => {
  const t = b.tags || {}, place = b.place !== undefined ? places[b.place] : null, h = hash(b.id);
  b.kind = kindFrom(b.cls + ' ' + (t.building || '') + ' ' + (t.amenity || '') + ' ' + (t.shop ? 'shop' : ''), place && place.cat, b.a);
  const dist = Math.hypot(b.cx - px, b.cy - py);
  let floors = +t['building:levels'] || b.floors, est = !floors;
  if (!floors) {
    if (b.kind === 'galpon' || b.kind === 'garage' || b.kind === 'industria' || b.kind === 'iglesia' || b.kind === 'estacion') floors = 1;
    else if (b.kind === 'edificio') floors = 4 + Math.floor(h * 7);
    else if (b.kind === 'escuela' || b.kind === 'salud' || b.kind === 'publico' || b.kind === 'oficina') floors = 2 + (h < 0.3 ? 1 : 0);
    // Downtown, some mid-size lots are apartment buildings.
    else if (dist < 550 && b.a > 120 && b.a < 1500 && h < 0.16) { floors = 3 + Math.floor(hash(b.id + 'f') * 7); b.kind = 'edificio'; }
    else floors = h < 0.62 ? 1 : 2;
  }
  if (floors >= 3 && b.kind === 'casa') b.kind = 'edificio';
  b.floors = Math.min(30, floors);
  let roof = /flat/.test(b.roof) ? 'terraza' : /gabled|hipped|pyramidal|skillion/.test(b.roof) ? 'tejas' : '';
  if (!roof) roof = b.kind === 'industria' || b.kind === 'galpon' || b.kind === 'garage' || b.kind === 'estacion' ? 'chapa'
    : b.kind === 'casa' ? (hash(b.id + 'r') < 0.62 ? 'terraza' : 'tejas') : b.kind === 'iglesia' ? 'tejas' : 'terraza';
  b.roofK = roof;
  b.basement = b.under > 0 ? 1 : (est || !b.under) && hash(b.id + 's') < ({ edificio: 0.5, negocio: dist < 700 ? 0.25 : 0.08, casa: 0.06, publico: 0.3, oficina: 0.3 }[b.kind] || 0) ? 1 : 0;
  b.est = est ? 1 : 0;
  if (est) estimated++;
});

// Terrain: SRTM heights, smoothed once (SRTM sees roofs and trees too), in decimeters.
const NX = dem.nx, NY = dem.ny, z = dem.z.map((v) => (v === null ? 25 : Math.max(0, v))), zs = [];
for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
  let s = 0, c = 0;
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b2 = j + dj; if (a >= 0 && b2 >= 0 && a < NX && b2 < NY) { s += z[b2 * NX + a]; c++; } }
  zs.push(Math.round(s / c * 10));
}

// Streets, plazas and parks from OpenStreetMap (as in tools/bake-city.js).
const OPEN = { leisure: ['park', 'garden', 'playground', 'pitch', 'common', 'recreation_ground'], place: ['square'], landuse: ['grass', 'recreation_ground', 'village_green'] };
const roads = [], parks = [];
JSON.parse(fs.readFileSync(path.join(RAW, 'sm-streets.json'), 'utf8')).elements.forEach((el) => {
  if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) return;
  const t = el.tags || {}, pts = el.geometry.map((g) => toM(g.lon, g.lat));
  if (!inSquare(pts)) return;
  for (const k in OPEN) if (t[k] && OPEN[k].includes(t[k])) { if (pts.length >= 3) parks.push([t[k], t.name || '', flat(pts)]); return; }
  if (t.highway === 'pedestrian' && t.area === 'yes') { if (pts.length >= 3) parks.push(['plaza', t.name || '', flat(pts)]); return; }
  if (t.highway) roads.push([t.highway, t.name || '', flat(pts)]);
});
const layer = (file, keep) => csv(file).flatMap((r) => rings(r.wkt).filter((p) => p.length > 1 && inSquare(p)).map((p) => [r.class || r.subtype || '', r.name || '', flat(p)])).filter(keep || (() => true));

const map = {
  id: 'sanmiguel', name: 'San Miguel', lat: lat0, lon: lon0, w: W, h: H, unit: 1 / Q, start: flat([[px, py]]),
  // The edge of the partido: you can't walk past it, and what lies beyond is dark.
  border: flat(simplifyRing(border, 2)),
  terrain: { nx: NX, ny: NY, step: dem.step, dm: zs, source: dem.source },
  roads, parks,
  landuse: layer('sm-landuse.csv'),
  water: layer('sm-water.csv'),
  rail: layer('sm-rail.csv'),
  kinds: KINDS, roofs: ROOFS,
  // buildings: one row per building: [footprint (x, y, ...), kind, floors, roof, basement, estimated, source, place or -1]
  buildings: B.map((b) => [flat(b.pts), KINDS.indexOf(b.kind), b.floors, ROOFS.indexOf(b.roofK), b.basement, b.est, b.src, b.place !== undefined ? b.place : -1]),
  places: places.map((p) => [p.name, p.cat, q(p.x), q(p.y), p.b !== undefined ? p.b : -1])
};
const header = '// San Miguel, baked by tools/bake-map.js (see docs/MAPA.md).\n// Data: © OpenStreetMap contributors (ODbL); Overture Maps Foundation (ODbL; footprints from Google Open Buildings,\n' +
  '// CC BY 4.0, and Microsoft ML Building Footprints, ODbL); terrain: SRTM (NASA) via OpenTopoData. Units: half meters.\n';
fs.writeFileSync(OUT, header + '(function (L) {\n  L.data = L.data || {};\n  L.data.maps = L.data.maps || {};\n  L.data.maps.sanmiguel = ' + JSON.stringify(map) + ';\n})(this.Lluvia = this.Lluvia || {});\n');
const kc = {}; B.forEach((b) => { kc[b.kind] = (kc[b.kind] || 0) + 1; });
const fc = {}; B.forEach((b) => { const k = b.floors > 5 ? '6+' : b.floors; fc[k] = (fc[k] || 0) + 1; });
console.log(path.relative(process.cwd(), OUT), (fs.statSync(OUT).size / 1048576).toFixed(1) + ' MB');
console.log('edificios', B.length, '(estimados', estimated + ')', 'lugares', places.length, 'en edificios', places.filter((p) => p.b !== undefined).length);
console.log('tipos', JSON.stringify(kc));
console.log('pisos', JSON.stringify(fc), 'con sótano', B.filter((b) => b.basement).length);
console.log('calles', roads.length, 'plazas', parks.length, 'uso del suelo', map.landuse.length, 'agua', map.water.length, 'tren', map.rail.length,
  'terreno', Math.min(...zs) / 10, '-', Math.max(...zs) / 10, 'm');
