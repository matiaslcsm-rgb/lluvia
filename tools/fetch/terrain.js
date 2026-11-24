// Downloads a grid of elevations (SRTM 30 m, OpenTopoData) over the map's rectangle (tools/fetch/frame.js), one
// point every `terrainStep` meters, 100 points per call, about 1 call per second (the free limit is 1000 a day).
const fs = require('fs'), F = require('./frame.js');
const step = F.area.terrainStep, nx = Math.ceil(F.w / step), ny = Math.ceil(F.h / step), pts = [];
for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) pts.push(F.toLatLon((i + 0.5) * step, (j + 0.5) * step));
const out = new Array(pts.length).fill(null);
(async () => {
  for (let k = 0; k < pts.length; k += 100) {
    const chunk = pts.slice(k, k + 100), q = chunk.map((p) => p[0].toFixed(6) + ',' + p[1].toFixed(6)).join('|');
    for (let tries = 0; tries < 6; tries++) {
      try {
        const r = await fetch('https://api.opentopodata.org/v1/srtm30m?locations=' + q, { headers: { 'User-Agent': 'lluvia-map-tool' } });
        const j = await r.json();
        if (j.status !== 'OK') throw new Error(j.error || j.status);
        j.results.forEach((res, i) => { out[k + i] = res.elevation; });
        break;
      } catch (e) { await new Promise((res) => setTimeout(res, 2500 * (tries + 1))); }
    }
    if ((k / 100) % 50 === 0) console.log(k / 100, 'de', Math.ceil(pts.length / 100), 'pedidos');
    await new Promise((res) => setTimeout(res, 1100));
  }
  fs.writeFileSync('tools/raw/sm-dem.json', JSON.stringify({ nx, ny, step, source: 'SRTM 30m via OpenTopoData', z: out }));
  const v = out.filter((x) => x !== null);
  console.log('listo', v.length, 'de', out.length, 'min', Math.min(...v), 'max', Math.max(...v));
})();
