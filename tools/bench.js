// The bench: plays many whole matches with 8 bots in parallel and summarizes how they went.
// Used to tune numbers with data instead of by eye.
//
// Usage:
//   node tools/bench.js [matches=24] [--set path=value ...] [--json]
// Examples:
//   node tools/bench.js 48
//   node tools/bench.js 48 --set duels.every=100 --set horde.hpGrowth=0.2
//   node tools/bench.js 24 --set characters.filo.stats.maxHp=100
// A path walks L.data; inside a list, a step picks the entry with that id (characters.filo, abilities.chispa...).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const MAX_MINUTES = 45; // a match still going at this point counts as unfinished

function loadEngine() {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const context = vm.createContext({});
  for (const s of [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !s.startsWith('js/view/'))) {
    vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), context, { filename: s });
  }
  return context.Lluvia;
}

// Sets L.data.<path> = value. Steps into lists by id.
function applySet(L, spec) {
  const eq = spec.indexOf('=');
  const keys = spec.slice(0, eq).split('.');
  let value = spec.slice(eq + 1);
  value = value === 'true' ? true : value === 'false' ? false : isNaN(Number(value)) ? value : Number(value);
  let obj = L.data;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = Array.isArray(obj) ? obj.find((x) => x.id === keys[i]) : obj[keys[i]];
    if (obj === undefined) throw new Error('No existe ' + keys.slice(0, i + 1).join('.'));
  }
  const last = keys[keys.length - 1];
  if (!(last in obj)) throw new Error('No existe ' + spec.slice(0, eq));
  obj[last] = value;
}

// One whole match. Records when each life was lost and why (horde or duel).
function playMatch(L, seed) {
  const m = L.createMatch({ seed, humanBot: true });
  const lives = m.players.map((pl) => pl.game.lives);
  const losses = [];
  const outAt = {};
  let lastDuel = null;
  const duels = [];
  while (!m.over && m.time < MAX_MINUTES * 60) {
    L.updateMatch(m, 1 / 30, {});
    const duelLoser = m.lastDuel && m.lastDuel !== lastDuel ? m.lastDuel.loser : null;
    if (m.lastDuel && m.lastDuel !== lastDuel) {
      lastDuel = m.lastDuel;
      duels.push({ time: lastDuel.time, timeout: lastDuel.timeout, rule: lastDuel.rule.id });
    }
    m.players.forEach((pl, i) => {
      const now = pl.game.lives;
      for (let k = now; k < lives[i]; k++) losses.push({ t: m.time, cause: pl === duelLoser ? 'duel' : 'horde' });
      lives[i] = now;
      if (pl.out && !(i in outAt)) outAt[i] = m.time;
    });
  }
  return {
    seed,
    length: m.time,
    finished: m.over,
    players: m.players.map((pl, i) => {
      const p = pl.game.player;
      return {
        char: p.char.id, place: pl.place || 1, outAt: outAt[i], level: p.level,
        items: p.itemOrder.reduce((n, id) => n + p.items[id], 0),
        fusions: p.abilities.filter((a) => a.def.fused).length
      };
    }),
    losses,
    duels
  };
}

if (!isMainThread) {
  const L = loadEngine();
  workerData.sets.forEach((s) => applySet(L, s));
  for (const seed of workerData.seeds) parentPort.postMessage(playMatch(L, seed));
  return;
}

// ---- Main thread: split the seeds among workers, then summarize ----

const args = process.argv.slice(2);
const sets = [];
let matches = 24, json = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--set') sets.push(args[++i]);
  else if (args[i] === '--json') json = true;
  else matches = Number(args[i]) || matches;
}
applySetCheck();

function applySetCheck() {
  const L = loadEngine();
  sets.forEach((s) => applySet(L, s)); // fails early on a typo
}

const threads = Math.max(1, Math.min(os.cpus().length - 1, matches));
const results = [];
const started = Date.now();
let running = threads;
for (let w = 0; w < threads; w++) {
  const seeds = [];
  for (let s = 1 + w; s <= matches; s += threads) seeds.push(s);
  const worker = new Worker(__filename, { workerData: { seeds, sets } });
  worker.on('message', (r) => { results.push(r); if (!json) process.stderr.write('.'); });
  worker.on('error', (e) => { console.error(e); process.exit(1); });
  worker.on('exit', () => { if (--running === 0) report(); });
}

function quantile(list, q) {
  const s = list.slice().sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
}
const clock = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0) + '%';

function summarize(rs) {
  const lengths = rs.map((r) => r.length);
  const buckets = [0, 5, 10, 15, 20, 25, 30, 40, 60, MAX_MINUTES];
  const lossRows = [];
  for (let b = 0; b < buckets.length - 1; b++) {
    const inB = (x) => x.t >= buckets[b] * 60 && x.t < buckets[b + 1] * 60;
    const all = rs.flatMap((r) => r.losses.filter(inB));
    if (!all.length) continue;
    lossRows.push({ from: buckets[b], to: buckets[b + 1], horde: all.filter((x) => x.cause === 'horde').length, duel: all.filter((x) => x.cause === 'duel').length });
  }
  const chars = {};
  rs.forEach((r) => r.players.forEach((p) => {
    const c = chars[p.char] || (chars[p.char] = { played: 0, wins: 0, placeSum: 0 });
    c.played++; c.placeSum += p.place; if (p.place === 1) c.wins++;
  }));
  const duels = rs.flatMap((r) => r.duels);
  const winners = rs.map((r) => r.players.find((p) => p.place === 1)).filter(Boolean);
  return {
    matches: rs.length,
    unfinished: rs.filter((r) => !r.finished).length,
    length: { median: quantile(lengths, 0.5), p10: quantile(lengths, 0.1), p90: quantile(lengths, 0.9) },
    losses: lossRows,
    chars,
    duels: { count: duels.length, avgTime: duels.reduce((a, d) => a + d.time, 0) / (duels.length || 1), timeouts: duels.filter((d) => d.timeout).length },
    winners: { items: quantile(winners.map((w) => w.items), 0.5), level: quantile(winners.map((w) => w.level), 0.5), fusions: winners.reduce((a, w) => a + w.fusions, 0) / (winners.length || 1) }
  };
}

function report() {
  const s = summarize(results);
  if (json) { console.log(JSON.stringify(s)); return; }
  const secs = ((Date.now() - started) / 1000).toFixed(0);
  console.log(`\n\n${s.matches} partidas en ${secs} s` + (sets.length ? ` con: ${sets.join(', ')}` : '') + (s.unfinished ? ` (${s.unfinished} sin terminar a los ${MAX_MINUTES} min)` : ''));
  console.log(`\nLargo de la partida: mediana ${clock(s.length.median)}, el 80% entre ${clock(s.length.p10)} y ${clock(s.length.p90)}`);
  console.log('\nVidas perdidas (por partida, promedio):');
  s.losses.forEach((r) => console.log(`  min ${String(r.from).padStart(2)}-${String(r.to).padEnd(2)}  horda ${(r.horde / s.matches).toFixed(1).padStart(4)}   duelo ${(r.duel / s.matches).toFixed(1).padStart(4)}`));
  console.log('\nPersonajes:');
  Object.keys(s.chars).sort().forEach((k) => {
    const c = s.chars[k];
    console.log(`  ${k.padEnd(7)} jugado ${String(c.played).padStart(3)}   gana ${pct(c.wins, c.played).padStart(4)} (lo justo: 13%)   puesto promedio ${(c.placeSum / c.played).toFixed(1)}`);
  });
  console.log(`\nDuelos: ${s.duels.count}, duran ${s.duels.avgTime.toFixed(1)} s de promedio, ${pct(s.duels.timeouts, s.duels.count)} por tiempo`);
  console.log(`Ganadores: nivel ${s.winners.level}, ${s.winners.items} ítems, ${s.winners.fusions.toFixed(1)} fusiones (medianas/promedio)`);
}

module.exports = { summarize };
