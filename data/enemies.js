// The Anegados: creatures the rain brings out of the puddles (see docs/LORE.md).
// `from` is the minute a type starts appearing; `weight` how often (0 = never from the normal horde: bosses,
// pieces of a splitter). `dps` is the damage per second while touching you. `gold` drops with chance `goldChance`.
// `shape` is how it is drawn. Special behaviours:
//   ranged: keeps its distance and spits mud      { range, keep, every, speed, damage }
//   splits: on death it breaks into smaller ones   { into, count }
//   bomb:   runs at you, lights a fuse and blows up { trigger, fuse, radius, damage }
//   pull:   sucks you toward it while you are near  { radius, strength (px/s at its center), max (all together) }
//   summon: keeps its distance and calls creatures  { every, type, count, keep }
//   slam:   stops, shows a ring, then hits the floor { every, windup, radius, damage, reach (starts it when this close) }
// `mini`: a champion of the Mad God (minijefe), between bosses; leaves an elite chest.
// `phase`: at `at` of its health a boss changes for the rest of the fight { at, text, speed (×), every (× time
//   between attacks), count (shots per fan), summon { type, count } once }
// Numbers are provisional; the bench (tools/bench.js) decides them.
(function (L) {
  'use strict';

  L.data.enemies = [
    { id: 'rastrero', name: 'Anegado', shape: 'blob', hp: 10, speed: 70, dps: 10, radius: 12, xp: 1, gold: 1, goldChance: 0.3, color: '#b04a5a', from: 0, weight: 6 },
    { id: 'veloz', name: 'Salpicón', shape: 'tri', hp: 6, speed: 135, dps: 6, radius: 9, xp: 1, gold: 1, goldChance: 0.3, color: '#d98a3a', from: 1, weight: 3 },
    { id: 'escupidor', name: 'Escupelodo', shape: 'spitter', hp: 16, speed: 60, dps: 6, radius: 13, xp: 2, gold: 1, goldChance: 0.5, color: '#7a9a3a', from: 4, weight: 1.2,
      ranged: { range: 340, keep: 250, every: 2.4, speed: 240, damage: 7 } },
    { id: 'divisor', name: 'Charco madre', shape: 'splitter', hp: 40, speed: 55, dps: 10, radius: 18, xp: 2, gold: 2, goldChance: 0.5, color: '#c9b04a', from: 5, weight: 1,
      splits: { into: 'gotita', count: 3 } },
    { id: 'gotita', name: 'Gotita', shape: 'droplet', hp: 6, speed: 125, dps: 5, radius: 8, xp: 1, gold: 0, goldChance: 0, color: '#e8d36a', from: 0, weight: 0 },
    { id: 'tronador', name: 'Tronador', shape: 'bomber', hp: 14, speed: 115, dps: 0, radius: 12, xp: 2, gold: 1, goldChance: 0.5, color: '#d0503a', from: 8, weight: 1,
      bomb: { trigger: 70, fuse: 0.7, radius: 95, damage: 30 } },
    { id: 'cazador', name: 'Correntada', shape: 'arrow', hp: 25, speed: 165, dps: 12, radius: 11, xp: 2, gold: 2, goldChance: 0.4, color: '#3fb6a8', from: 7, weight: 1 },
    // A drain that sucks you in: you can walk out, but it drags you into the horde.
    { id: 'sumidero', name: 'Sumidero', shape: 'swirl', hp: 35, speed: 50, dps: 8, radius: 16, xp: 3, gold: 2, goldChance: 0.6, color: '#4a6a9a', from: 9, weight: 0.8,
      pull: { radius: 260, strength: 80, max: 120 } },
    { id: 'bruto', name: 'Ahogón', shape: 'square', hp: 70, speed: 45, dps: 18, radius: 22, xp: 5, gold: 3, goldChance: 1, color: '#7a4ab0', from: 2.5, weight: 1 },
    { id: 'coloso', name: 'Coloso del Diluvio', article: 'el', shape: 'boss', hp: 700, speed: 62, dps: 30, radius: 40, xp: 40, gold: 30, goldChance: 1, color: '#d4344f', from: 0, weight: 0, boss: true,
      phase: { at: 0.5, text: 'se enfurece y llama a su manada', speed: 1.35, summon: { type: 'rastrero', count: 8 } } },
    // Hangs back and fires fans of hail you have to slip through.
    { id: 'reina', name: 'Reina del Granizo', article: 'la', shape: 'queen', hp: 800, speed: 50, dps: 20, radius: 36, xp: 45, gold: 35, goldChance: 1, color: '#bfe6ff', from: 0, weight: 0, boss: true,
      ranged: { range: 520, keep: 300, every: 2.6, speed: 250, damage: 7, count: 5, spread: 0.9 },
      phase: { at: 0.5, text: 'desata la tormenta: abanicos más grandes y seguidos', count: 9, every: 0.7 } },
    // Champions of the Mad God (minijefes): one every 3 minutes, halfway between bosses.
    { id: 'verdugo', name: 'Verdugo del Dios', article: 'el', shape: 'arrow', hp: 260, speed: 70, dps: 20, radius: 24, xp: 20, gold: 12, goldChance: 1, color: '#c23b3b', from: 0, weight: 0, boss: true, mini: true,
      charge: { every: 3.5, windup: 0.7, dash: 0.6, speed: 520 } },
    { id: 'nigromante', name: 'Nigromante del Dios', article: 'el', shape: 'spitter', hp: 200, speed: 60, dps: 10, radius: 22, xp: 20, gold: 12, goldChance: 1, color: '#8a4ad0', from: 0, weight: 0, boss: true, mini: true,
      summon: { every: 5, type: 'rastrero', count: 5, keep: 280 } },
    { id: 'golem', name: 'Gólem del Coliseo', article: 'el', shape: 'square', hp: 380, speed: 45, dps: 22, radius: 28, xp: 20, gold: 12, goldChance: 1, color: '#8a8f9e', from: 0, weight: 0, boss: true, mini: true,
      slam: { every: 4, windup: 1, radius: 150, damage: 26, reach: 200 } },
    // Crouches (you see it coming), then charges in a straight line at great speed.
    { id: 'leviatan', name: 'Leviatán del desagüe', article: 'el', shape: 'leviathan', hp: 1100, speed: 55, dps: 24, radius: 38, xp: 50, gold: 40, goldChance: 1, color: '#2f7f86', from: 0, weight: 0, boss: true,
      charge: { every: 4.5, windup: 0.9, dash: 0.75, speed: 540 },
      phase: { at: 0.5, text: 'embiste sin parar', every: 0.55, speed: 1.2 } },
    // Titans of the Mad God. The Hydra splits into three spitting heads when it falls.
    { id: 'hidra', name: 'Hidra del Coliseo', article: 'la', shape: 'hydra', hp: 1000, speed: 52, dps: 26, radius: 40, xp: 50, gold: 40, goldChance: 1, color: '#3f9a5a', from: 0, weight: 0, boss: true,
      splits: { into: 'cabeza', count: 3 },
      phase: { at: 0.5, text: 'se retuerce: le crecen cabezas', speed: 1.3, summon: { type: 'cabeza', count: 2 } } },
    { id: 'cabeza', name: 'Cabeza de Hidra', shape: 'spitter', hp: 120, speed: 80, dps: 12, radius: 16, xp: 5, gold: 5, goldChance: 1, color: '#5fc07a', from: 0, weight: 0,
      ranged: { range: 380, keep: 220, every: 2, speed: 250, damage: 7 } },
    // The last titan: fans of fire, and at half health it calls the Verdugo.
    { id: 'avatar', name: 'Avatar del Dios Loco', article: 'el', shape: 'avatar', hp: 1500, speed: 55, dps: 28, radius: 44, xp: 70, gold: 60, goldChance: 1, color: '#ff7a2f', from: 0, weight: 0, boss: true,
      ranged: { range: 560, keep: 320, every: 2.2, speed: 260, damage: 8, count: 7, spread: 1.2 },
      phase: { at: 0.5, text: 'se ríe: el Dios en persona baja a la arena', count: 11, every: 0.7, summon: { type: 'verdugo', count: 1 } } }
  ];

  L.data.horde = {
    arena: 2400,          // side of the square arena (your barrio), in pixels
    spawnBase: 1.2,       // enemies per second at difficulty 1
    spawnPerLevel: 0.9,   // extra enemies per second for each difficulty step
    hpGrowth: 0.21,       // enemy health ×1.21 per step (compounding, so items that snowball still get caught)
    lateStart: 8,         // from this step on (minute 8), enemy health also grows by lateGrowth per step, so
    lateGrowth: 0.5,      // whoever got too strong still gets caught and matches end around 20-25 minutes
    speedPerLevel: 0.03,  // +3% enemy speed per step...
    speedMax: 0.6,        // ...up to +60%
    dpsPerLevel: 0.3,     // +30% enemy damage per step (also mud and explosions)
    goldGrowth: 0.1,      // gold per kill ×1.1 per step (less than chests: more kills make up the rest)
    maxAlive: 450,
    xpBase: 5,            // experience for level 2
    xpStep: 8,            // each next level asks this much more
    maxGems: 400,
    bossFirst: 150,       // first boss at 2:30
    bossEvery: 180,       // then every 3 minutes
    bosses: ['coloso', 'reina', 'leviatan', 'hidra', 'avatar'], // one after the other, then around again
    miniFirst: 240,       // first champion of the Mad God at 4:00, then every bossEvery (halfway between bosses)
    minis: ['verdugo', 'nigromante', 'golem'],
    lives: 3,             // lives per player
    respawnTime: 5,       // seconds down after losing a life
    respawnInvuln: 2,     // seconds of invulnerability after coming back
    respawnClear: 450,    // enemies this close are removed when you come back (bosses stay)
    // Elites: a stronger, golden version of any normal creature. More gold, sometimes a free chest.
    eliteFrom: 6,         // minute they start
    eliteChance: 0.015,   // chance per spawned creature at eliteFrom...
    elitePerMinute: 0.003, // ...plus this per minute after
    elite: { hp: 6, size: 1.35, dps: 1.5, xp: 4, gold: 2, chestChance: 0.08 },
    // Storm events: every minute from 1:15, the horde does something special (see L.data.waves).
    waveFirst: 165,
    waveEvery: 60
  };

  // Storm events, announced on screen. `count` grows by `perStep` for each difficulty step.
  L.data.waves = [
    { id: 'cerco', name: '¡Cerco!', desc: 'Te rodean por todos lados: abrite paso.', type: 'rastrero', count: 14, perStep: 2, pattern: 'ring', from: 0 },
    { id: 'estampida', name: '¡Estampida!', desc: 'Una fila de Salpicones cruza el barrio.', type: 'veloz', count: 14, perStep: 2, pattern: 'line', from: 1 },
    { id: 'tormenta', name: '¡Tormenta eléctrica!', desc: 'Llueven Tronadores.', type: 'tronador', count: 5, perStep: 1, pattern: 'scatter', from: 8 },
    { id: 'marea', name: '¡Marea!', desc: 'Durante 10 segundos salen el triple de Anegados.', pattern: 'surge', seconds: 10, mult: 3, from: 0 },
    { id: 'lodo', name: '¡Lluvia de lodo!', desc: 'Llega una banda de Escupelodos.', type: 'escupidor', count: 5, perStep: 1, pattern: 'scatter', from: 5 }
  ];
})(this.Lluvia = this.Lluvia || {});

// Sending Anegados (js/send.js): pay gold to drop a pack on the rival who is ahead.
(function (L) {
  'use strict';
  L.data.send = {
    cost: 60,            // gold at difficulty 1, grows like chest prices
    growth: 0.25,
    cooldown: 30,        // seconds between sends, per player
    pack: ['rastrero', 'rastrero', 'veloz', 'veloz', 'bruto', 'escupidor'],
    elites: 1,           // how many of the pack come golden
    perStep: 0.5,        // extra creatures per difficulty step
    botEvery: 8,         // a bot thinks about sending this often (seconds)
    botChance: 0.35,     // ...and sends with this chance when it can afford it twice over
    botFrom: 540         // bots don't send before 9:00 (earlier, it piled onto the hardest stretch)
  };

  // Forecast: one per match, the same for all eight arenas. It bends the horde and gives everyone a small bonus.
  // `weight` is how often it comes up; the multipliers stack with Tormenta eterna and the Pactos.
  L.data.forecasts = [
    { id: 'llovizna', name: 'Llovizna', desc: 'Un día como cualquiera en Aguaverde.', color: '#9fc3e6', weight: 4 },
    { id: 'chaparron', name: 'Chaparrón', desc: 'Más bichos y un poco más duros, pero dejan más oro.', color: '#5fb0ff', weight: 2,
      spawnMul: 1.2, hordeHp: 1.15, stats: { goldMul: 0.1 } },
    { id: 'granizada', name: 'Granizada', desc: 'La horda pega más fuerte, pero vos también.', color: '#d8eeff', weight: 2,
      hordeDps: 1.35, stats: { damageMul: 0.1 } },
    { id: 'neblina', name: 'Neblina', desc: 'Salen más y pegan más, pero son más frágiles.', color: '#b8c0c8', weight: 2,
      spawnMul: 1.2, hordeHp: 0.9, hordeDps: 1.15 },
    { id: 'ventarron', name: 'Ventarrón', desc: 'Todos corren más rápido; la horda aguanta más.', color: '#9fe0c0', weight: 2,
      hordeHp: 1.2, stats: { speedMul: 0.1 } },
    { id: 'arcoiris', name: 'Arcoíris', desc: 'Los cofres salen más baratos, pero la horda aguanta un poco más.', color: '#ffd86a', weight: 1,
      chestMul: 0.85, hordeHp: 1.1 }
  ];

  // Weighted pick from its own rng, so it doesn't change the rest of the match's dice.
  L.pickForecast = function (seed) {
    var list = L.data.forecasts, total = 0, rng = L.makeRng((seed ^ 0x2545f491) >>> 0 || 1);
    list.forEach(function (f) { total += f.weight; });
    var r = rng() * total;
    for (var i = 0; i < list.length; i++) { r -= list[i].weight; if (r < 0) return list[i].id; }
    return list[0].id;
  };
})(this.Lluvia = this.Lluvia || {});
