// Horde enemies and how the horde grows. `from` is the minute a type starts appearing; `weight` how often
// (0 = never spawned by the horde, like the boss). `dps` is the damage per second while touching you.
// `gold` drops with chance `goldChance`. Numbers are provisional.
(function (L) {
  'use strict';

  L.data.enemies = [
    { id: 'rastrero', name: 'Rastrero', hp: 10, speed: 70, dps: 10, radius: 12, xp: 1, gold: 1, goldChance: 0.3, color: '#b04a5a', from: 0, weight: 6 },
    { id: 'veloz', name: 'Veloz', hp: 6, speed: 135, dps: 6, radius: 9, xp: 1, gold: 1, goldChance: 0.3, color: '#d98a3a', from: 1, weight: 3 },
    { id: 'cazador', name: 'Cazador', hp: 25, speed: 165, dps: 12, radius: 11, xp: 2, gold: 2, goldChance: 0.4, color: '#3fb6a8', from: 5, weight: 1 },
    { id: 'bruto', name: 'Bruto', hp: 70, speed: 45, dps: 18, radius: 22, xp: 5, gold: 3, goldChance: 1, color: '#7a4ab0', from: 2.5, weight: 1 },
    { id: 'coloso', name: 'Coloso', hp: 700, speed: 62, dps: 30, radius: 40, xp: 40, gold: 30, goldChance: 1, color: '#d4344f', from: 0, weight: 0, boss: true }
  ];

  L.data.horde = {
    arena: 2400,          // side of the square arena, in pixels
    spawnBase: 1.2,       // enemies per second at difficulty 1
    spawnPerLevel: 0.9,   // extra enemies per second for each difficulty step
    hpGrowth: 0.22,       // enemy health ×1.22 per step (compounding, so items that snowball still get caught)
    speedPerLevel: 0.03,  // +3% enemy speed per step...
    speedMax: 0.6,        // ...up to +60%
    dpsPerLevel: 0.15,    // +15% enemy damage per step
    goldGrowth: 0.1,      // gold per kill ×1.1 per step (less than chests: more kills make up the rest)
    maxAlive: 450,
    xpBase: 5,            // experience for level 2
    xpStep: 8,            // each next level asks this much more
    maxGems: 400,
    bossFirst: 150,       // first boss at 2:30
    bossEvery: 180,       // then every 3 minutes
    boss: 'coloso',
    lives: 3,             // lives per player
    respawnTime: 5,       // seconds down after losing a life
    respawnInvuln: 2,     // seconds of invulnerability after coming back
    respawnClear: 450     // enemies this close are removed when you come back (bosses stay)
  };
})(this.Lluvia = this.Lluvia || {});
