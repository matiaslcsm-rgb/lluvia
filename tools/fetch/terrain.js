// Downloads a grid of elevations (SRTM 30 m, OpenTopoData) over the San Miguel square, 100 points per call, 1 call per second.
const N = 80, lat0 = -34.5368, lon0 = -58.71875, meters = 4750, fs = require('fs');
const kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110540, pts = [];
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
  const x = (i + 0.5) / N * meters - meters / 2, y = (j + 0.5) / N * meters - meters / 2;
  pts.push([lat0 - y / ky, lon0 + x / kx]);
}
const out = new Array(pts.length).fill(null);
(async () => {
  for (let k = 0; k < pts.length; k += 100) {
    const chunk = pts.slice(k, k + 100), q = chunk.map((p) => p[0].toFixed(6) + ',' + p[1].toFixed(6)).join('|');
    for (let tries = 0; tries < 4; tries++) {
      try {
        const r = await fetch('https://api.opentopodata.org/v1/srtm30m?locations=' + q, { headers: { 'User-Agent': 'lluvia-map-tool' } });
        const j = await r.json();
        if (j.status !== 'OK') throw new Error(j.error || j.status);
        j.results.forEach((res, i) => { out[k + i] = res.elevation; });
        break;
      } catch (e) { await new Promise((res) => setTimeout(res, 2500)); }
    }
    process.stdout.write('.');
    await new Promise((res) => setTimeout(res, 1100));
  }
  fs.writeFileSync('tools/raw/sm-dem.json', JSON.stringify({ n: N, meters, lat0, lon0, source: 'SRTM 30m via OpenTopoData', z: out }));
  const v = out.filter((x) => x !== null);
  console.log('\nlisto', v.length, 'de', out.length, 'min', Math.min(...v), 'max', Math.max(...v));
})();
