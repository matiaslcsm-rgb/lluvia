// The seasons (js/clock.js, js/weather.js), as the user decided (2026-11-25, answer 7): the 4 seasons, 7 days each.
// They change how long the day and the night last and which weather is likelier. The game starts in autumn (my
// call: the lore's rain fits it). Later a clothing system will make the cold and the heat matter more (noted in
// docs/CUERPO.md).
//   sunrise / sunset: hours of the game's clock   weather: how much likelier each kind is (1: as in data/weather.js)
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.seasons = {
    days: 7,
    order: ['otono', 'invierno', 'primavera', 'verano'], // starting with the first one
    kinds: {
      verano: { name: 'Verano', sunrise: 5.5, sunset: 19.5, weather: { calor: 3, tormenta: 2, frio: 0, niebla: 0.5 } },
      otono: { name: 'Otoño', sunrise: 6.5, sunset: 18, weather: { lluvia: 1.5, niebla: 1.5, calor: 0.4 } },
      invierno: { name: 'Invierno', sunrise: 7.5, sunset: 17.5, weather: { frio: 4, niebla: 1.5, calor: 0, tormenta: 0.5 } },
      primavera: { name: 'Primavera', sunrise: 6.5, sunset: 19, weather: { lluvia: 1.3, tormenta: 1.3, frio: 0.4 } }
    }
  };
})(this.Lluvia = this.Lluvia || {});
