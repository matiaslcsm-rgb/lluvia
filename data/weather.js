// The weather (js/weather.js, js/view/weather.js), as planned in docs/DARKWOOD.md (section 5) with the story's sky
// (docs/LORE.md): white clouds, the yellow-violet sun behind them, and **black rain**. It changes by itself every
// few hours of the game; each kind changes the game, not only the look. The seasons (not decided yet) will change
// how likely each one is; for now the chances are these.
//   weight: how likely it comes next   hours: how long it lasts [shortest, longest]
//   Effects (1 = no change): sight (how far you see), zsight (how far zombies see), steps (how far your steps are
//   heard), air (how fast your air comes back), run (air running costs), thirst / hunger (how fast they come),
//   dark (how much darker the day gets, 0-1), cold (life lost per hour of the game outdoors at night), rain (how hard
//   it rains, 0-1: the black drops, the sound, the water that floods the low ground)
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.weather = {
    start: 'nublado',
    blend: 0.5,          // hours a change takes
    kinds: {
      despejado: { name: 'Despejado', weight: 28, hours: [3, 7] },
      nublado: { name: 'Nublado', weight: 24, hours: [2, 6], dark: 0.12 },
      lluvia: { name: 'Lluvia negra', weight: 18, hours: [2, 5], dark: 0.22, sight: 0.85, steps: 0.6, rain: 0.6 },
      tormenta: { name: 'Tormenta', weight: 7, hours: [1, 3], dark: 0.35, sight: 0.75, zsight: 0.8, steps: 0.4, rain: 1 },
      niebla: { name: 'Niebla', weight: 12, hours: [2, 5], sight: 0.45, zsight: 0.5, dark: 0.08 },
      calor: { name: 'Calor', weight: 7, hours: [3, 6], air: 0.7, run: 1.3, thirst: 1.5 },
      frio: { name: 'Frío', weight: 4, hours: [3, 7], hunger: 1.3, cold: 4 }
    },
    // The water on the low ground: while it rains it rises `rise` m per hour (times how hard it rains), up to `max` m
    // over the lowest point of the map; without rain it goes down `fall` m per hour. Wading slows you down `slowPerM`
    // per meter of depth, up to `maxSlow`.
    flood: { rise: 0.6, fall: 0.25, max: 3, slowPerM: 0.7, maxSlow: 0.6 },
    // Lightning in a storm: one every `every` s [shortest, longest]; it lights everything for `flash` s.
    lightning: { every: [7, 18], flash: 0.3 }
  };
})(this.Lluvia = this.Lluvia || {});
