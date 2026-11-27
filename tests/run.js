// Runs every tests/*.test.js against the engine scripts listed in index.html (except the browser-only js/view/).
// The map tests use the small test map (tests/fixtures/map-prueba.js, a cut of San Miguel made by
// tools/make-test-map.js) instead of the whole partido, so they take seconds.
// Usage: node tests/run.js
//   ONLY=text node tests/run.js   just the tests whose name has that text
//   REAL=1 node tests/run.js      with the real map of the whole partido (slow)
//   CLASICO=1 node tests/run.js   also the tests of the old game (tests/clasico/: duels, bets, 8 players...)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { performance } = require('perf_hooks');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const real = !!process.env.REAL;
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1].split('?')[0]).filter((s) => !s.startsWith('js/view/') && !s.startsWith('lib/')) // no screen, no 3D library
  .map((s) => (s === 'data/map-sanmiguel.js' && !real ? 'tests/fixtures/map-prueba.js' : s));

const tests = [];
const context = vm.createContext({ console, performance, assert, test: (name, fn) => tests.push([name, fn]) });
for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), context, { filename: s });
if (!real) vm.runInContext("Lluvia.data.city.home = 'prueba';", context);
const dirs = [''].concat(process.env.CLASICO ? ['clasico'] : []);
for (const d of dirs) {
  for (const f of fs.readdirSync(path.join(__dirname, d)).filter((f) => f.endsWith('.test.js')).sort()) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, d, f), 'utf8'), context, { filename: path.join('tests', d, f) });
  }
}

let failed = 0;
const only = process.env.ONLY;
let ran = 0;
for (const [name, fn] of tests) {
  if (only && !name.includes(only)) continue;
  ran++;
  try {
    fn();
    console.log('ok    ' + name);
  } catch (e) {
    failed++;
    console.log('FALLA ' + name + '\n      ' + (e && e.message) + (process.env.STACK && e && e.stack ? String.fromCharCode(10) + e.stack : ''));
  }
}
console.log(`\n${ran - failed} de ${ran} pruebas pasaron`);
process.exit(failed ? 1 : 0);
