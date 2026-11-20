// Plays whole matches with 8 bots (you included) and prints how they went. Seed of the start of the bench (stage 7).
// Usage: node tools/simulate.js [matches=4] [maxMinutes=25]
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const context = vm.createContext({});
for (const s of [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !s.startsWith('js/view/'))) {
  vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), context, { filename: s });
}
const L = context.Lluvia;

const matches = Number(process.argv[2]) || 4;
const maxTime = (Number(process.argv[3]) || 25) * 60;
const clock = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');

for (let seed = 1; seed <= matches; seed++) {
  const m = L.createMatch({ seed, humanBot: true });
  const outAt = {};
  while (!m.over && m.time < maxTime) {
    L.updateMatch(m, 1 / 30, {});
    m.players.forEach((pl) => { if (pl.out && !(pl.name in outAt)) outAt[pl.name] = m.time; });
  }
  const end = m.winner ? 'ganó ' + m.winner.name + ' a los ' + clock(m.time) : 'sin ganador a los ' + clock(m.time);
  console.log(`Partida ${seed}: ${end}`);
  for (const pl of L.standings(m)) {
    const g = pl.game;
    const items = g.player.itemOrder.reduce((n, id) => n + g.player.items[id], 0);
    const state = pl.out ? `${pl.place}.º (afuera a los ${clock(outAt[pl.name])})` : `en pie, ${g.lives} vidas`;
    console.log(`  ${pl.name.padEnd(10)} ${g.player.char.name.padEnd(6)} ${state.padEnd(28)} nivel ${String(g.player.level).padStart(2)}  ${String(g.kills).padStart(5)} bajas  ${String(items).padStart(3)} ítems`);
  }
}
