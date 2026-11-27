// Stamps a version on every script and stylesheet in index.html (src="js/x.js?v=STAMP"), so a browser never mixes
// old copies it kept with new ones after a push (the user, 2026-11-27: "no me carga"). Run before pushing:
//   node tools/version.js
'use strict';
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); // yyyymmddhhmm
const html = fs.readFileSync(file, 'utf8')
  .replace(/(<script src="[^"?]+)(\?v=[^"]*)?"/g, '$1?v=' + stamp + '"')
  .replace(/(<link rel="stylesheet" href="[^"?]+)(\?v=[^"]*)?"/g, '$1?v=' + stamp + '"');
fs.writeFileSync(file, html);
console.log('Versión ' + stamp + ' puesta en index.html.');
