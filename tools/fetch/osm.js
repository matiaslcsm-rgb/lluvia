// Downloads from OpenStreetMap (Overpass) everything tools/bake-map.js needs, over the area in area.json:
// the partido's boundary, the streets with plazas and parks, and the buildings (for their tags).
// Usage: node tools/fetch/osm.js
'use strict';
const { execFileSync } = require('child_process'), path = require('path');
const A = require('./area.json'), bb = [A.south, A.west, A.north, A.east].join(',');
const jobs = [
  ['tools/raw/sm-boundary.json', `[out:json][timeout:90];relation(${A.boundary});out geom;`],
  ['tools/raw/sm-streets.json', `[out:json][timeout:200];(way["highway"](${bb});way["leisure"~"park|garden|playground|pitch|common|recreation_ground"](${bb});` +
    `way["place"="square"](${bb});way["landuse"~"grass|recreation_ground|village_green"](${bb}););out geom qt;`],
  ['tools/raw/sm-bld.json', `[out:json][timeout:200];way["building"](${bb});out geom qt;`]
];
for (const [out, query] of jobs) execFileSync(process.execPath, [path.join(__dirname, 'overpass.js'), out, query], { stdio: 'inherit' });
