// Bakes a city downloaded from OpenStreetMap into a data file the game loads without internet.
// Usage: node tools/bake-city.js <streets.json> <buildings.json|-> <out.js> <id> "<name>" <lat> <lon> <meters> <startLat> <startLon>
//   streets.json / buildings.json: Overpass answers (out geom). The square is `meters` wide around (lat, lon).
// Coordinates are kept in meters from the square's corner, rounded to whole meters, to keep the file small.
'use strict';
const fs = require('fs');
const [streetsFile, bldFile, outFile, id, name, lat0, lon0, metersArg, sLat, sLon] = process.argv.slice(2);
const lat = +lat0, lon = +lon0, meters = +metersArg;
const kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 110540;
const toM = (g) => [Math.round((g.lon - lon) * kx + meters / 2), Math.round((lat - g.lat) * ky + meters / 2)];
const flat = (geom) => {
  const out = [];
  geom.forEach((g) => { const p = toM(g); if (out.length >= 2 && out[out.length - 2] === p[0] && out[out.length - 1] === p[1]) return; out.push(p[0], p[1]); });
  return out;
};
const inside = (f) => { for (let i = 0; i < f.length; i += 2) if (f[i] > -200 && f[i] < meters + 200 && f[i + 1] > -200 && f[i + 1] < meters + 200) return true; return false; };

const OPEN = { leisure: ['park', 'garden', 'playground', 'pitch', 'common', 'recreation_ground'], place: ['square'], landuse: ['grass', 'recreation_ground', 'village_green'] };
const roads = [], parks = [], buildings = [];
JSON.parse(fs.readFileSync(streetsFile, 'utf8')).elements.forEach((el) => {
  if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) return;
  const t = el.tags || {}, f = flat(el.geometry);
  if (!inside(f)) return;
  for (const k in OPEN) if (t[k] && OPEN[k].includes(t[k])) { if (f.length >= 6) parks.push([t[k], t.name || '', f]); return; }
  if (t.highway === 'pedestrian' && t.area === 'yes') { if (f.length >= 6) parks.push(['plaza', t.name || '', f]); return; }
  if (t.highway) roads.push([t.highway, t.name || '', f]);
});
if (bldFile && bldFile !== '-') {
  JSON.parse(fs.readFileSync(bldFile, 'utf8')).elements.forEach((el) => {
    if (el.type !== 'way' || !el.geometry || el.geometry.length < 4) return;
    const f = flat(el.geometry);
    if (inside(f)) buildings.push(f);
  });
}
const start = sLat ? toM({ lat: +sLat, lon: +sLon }) : [meters / 2, meters / 2];
const data = { id, name, lat, lon, meters, start, roads, parks, buildings };
const header = '// ' + name + ', baked from OpenStreetMap (© OpenStreetMap contributors, ODbL) by tools/bake-city.js.\n' +
  '// Meters from the corner of a ' + meters + ' m square. roads: [type, name, [x, y, ...]], parks: [kind, name, [x, y, ...]].\n';
fs.writeFileSync(outFile, header + '(function (L) {\n  L.data = L.data || {};\n  L.data.cities = L.data.cities || {};\n  L.data.cities[' +
  JSON.stringify(id) + '] = ' + JSON.stringify(data) + ';\n})(this.Lluvia = this.Lluvia || {});\n');
console.log(outFile, (fs.statSync(outFile).size / 1024).toFixed(0) + ' KB', 'roads', roads.length, 'parks', parks.length, 'buildings', buildings.length);
