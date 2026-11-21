// The Anegados: creatures the rain brings out of the puddles (see docs/LORE.md).
// `from` is the minute a type starts appearing; `weight` how often (0 = never from the normal horde: bosses,
// pieces of a splitter). `dps` is the damage per second while touching you. `gold` drops with chance `goldChance`.
// `shape` is how it is drawn. Special behaviours:
//   ranged: keeps its distance and spits mud      { range, keep, every, speed, damage }
//   splits: on death it breaks into smaller ones   { into, count }
//   bomb:   runs at you, lights a fuse and blows up { trigger, fuse, radius, damage }
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
    { id: 'bruto', name: 'Ahogón', shape: 'square', hp: 70, speed: 45, dps: 18, radius: 22, xp: 5, gold: 3, goldChance: 1, color: '#7a4ab0', from: 2.5, weight: 1 },
    { id: 'coloso', name: 'Coloso del Diluvio', article: 'el', shape: 'boss', hp: 700, speed: 62, dps: 30, radius: 40, xp: 40, gold: 30, goldChance: 1, color: '#d4344f', from: 0, weight: 0, boss: true },
    // Hangs back and fires fans of hail you have to slip through.
    { id: 'reina', name: 'Reina del Granizo', article: 'la', shape: 'queen', hp: 800, speed: 50, dps: 20, radius: 36, xp: 45, gold: 35, goldChance: 1, color: '#bfe6ff', from: 0, weight: 0, boss: true,
      ranged: { range: 520, keep: 300, every: 2.6, speed: 250, damage: 7, count: 5, spread: 0.9 } },
    // Crouches (you see it coming), then charges in a straight line at great speed.
    { id: 'leviatan', name: 'Leviatán del desagüe', article: 'el', shape: 'leviathan', hp: 1100, speed: 55, dps: 24, radius: 38, xp: 50, gold: 40, goldChance: 1, color: '#2f7f86', from: 0, weight: 0, boss: true,
      charge: { every: 4.5, windup: 0.9, dash: 0.75, speed: 540 } }
  ];

  L.data.horde = {
    arena: 2400,          // side of the square arena (your barrio), in pixels
    spawnBase: 1.2,       // enemies per second at difficulty 1
    spawnPerLevel: 0.9,   // extra enemies per second for each difficulty step
    hpGrowth: 0.22,       // enemy health ×1.22 per step (compounding, so items that snowball still get caught)
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
    bosses: ['coloso', 'reina', 'leviatan'], // one after the other, then around again
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
})(this.Lluvia = this.Lluvia || {});
