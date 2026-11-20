// Horde enemies and how the horde grows. `from` is the minute a type starts appearing; `weight` how often.
// `dps` is the damage per second they do while touching you. Numbers are provisional.
(function (L) {
  'use strict';

  L.data.enemies = [
    { id: 'rastrero', name: 'Rastrero', hp: 10, speed: 70, dps: 10, radius: 12, xp: 1, color: '#b04a5a', from: 0, weight: 6 },
    { id: 'veloz', name: 'Veloz', hp: 6, speed: 135, dps: 6, radius: 9, xp: 1, color: '#d98a3a', from: 1, weight: 3 },
    { id: 'bruto', name: 'Bruto', hp: 70, speed: 45, dps: 18, radius: 22, xp: 5, color: '#7a4ab0', from: 2.5, weight: 1 }
  ];

  L.data.horde = {
    arena: 2400,          // side of the square arena, in pixels
    spawnBase: 1.2,       // enemies per second at minute 0
    spawnPerMinute: 0.9,  // extra enemies per second for each minute
    hpPerMinute: 0.3,     // +30% enemy health per minute
    dpsPerMinute: 0.1,    // +10% enemy damage per minute
    maxAlive: 450,
    xpBase: 5,            // experience for level 2
    xpStep: 8,            // each next level asks this much more
    maxGems: 400
  };
})(this.Lluvia = this.Lluvia || {});
