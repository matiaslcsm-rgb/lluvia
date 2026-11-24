// The map's frame, from tools/fetch/area.json: a rectangle in meters with (0, 0) at its north-west corner.
// Shared by tools/fetch/terrain.js and tools/bake-map.js so every layer lines up.
'use strict';
const A = require('./area.json');
const lat0 = (A.south + A.north) / 2, lon0 = (A.west + A.east) / 2;
const kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110540;
const w = Math.round((A.east - A.west) * kx), h = Math.round((A.north - A.south) * ky);
module.exports = {
  area: A, lat0, lon0, kx, ky, w, h,
  toM: (lon, lat) => [(lon - lon0) * kx + w / 2, (lat0 - lat) * ky + h / 2],
  toLatLon: (x, y) => [lat0 - (y - h / 2) / ky, lon0 + (x - w / 2) / kx]
};
