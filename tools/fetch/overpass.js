// Asks the Overpass servers (OpenStreetMap) and saves the JSON answer, trying each server a few times.
// Usage: node tools/fetch/overpass.js <out.json> "<query>"
'use strict';
const fs = require('fs');
const SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const [out, query] = process.argv.slice(2);
(async () => {
  for (let round = 0; round < 3; round++) {
    for (const url of SERVERS) {
      try {
        const r = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(query),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'lluvia-map-tool' }, signal: AbortSignal.timeout(240000) });
        const text = await r.text();
        if (!r.ok || text[0] !== '{') throw new Error(r.status + ' ' + text.slice(0, 80).replace(/\s+/g, ' '));
        const j = JSON.parse(text);
        if (j.remark && /error|timed out/i.test(j.remark)) throw new Error(j.remark);
        fs.writeFileSync(out, text);
        console.log(out, (j.elements || []).length, 'elementos,', (text.length / 1e6).toFixed(1), 'MB, de', url);
        return;
      } catch (e) { console.log('falló', url, e.message); }
    }
    await new Promise((res) => setTimeout(res, 10000));
  }
  process.exit(1);
})();
