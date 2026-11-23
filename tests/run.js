// Runs every tests/*.test.js against the engine scripts listed in index.html (except the browser-only js/view/).
// Usage: node tests/run.js   (ONLY=text node tests/run.js runs just the tests whose name has that text)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { performance } = require('perf_hooks');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !s.startsWith('js/view/'));

const tests = [];
const context = vm.createContext({ console, performance, assert, test: (name, fn) => tests.push([name, fn]) });
for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), context, { filename: s });
for (const f of fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.js')).sort()) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), context, { filename: 'tests/' + f });
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
    console.log('FALLA ' + name + '\n      ' + (e && e.message));
  }
}
console.log(`\n${ran - failed} de ${ran} pruebas pasaron`);
process.exit(failed ? 1 : 0);
