// The clock of the day (js/clock.js), as the user decided (docs/DARKWOOD.md, section 5): 12 hours of the game
// last 40 minutes, so a whole day lasts 1 hour 20 minutes. Hours of the game, lengths in meters.
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.clock = {
    hour: 200,            // real seconds per hour of the game (12 hours in 40 minutes)
    start: 9,             // the hour you start at
    sunrise: 6,           // the sun comes up (each season moves it: data/seasons.js)
    sunset: 18,           // and goes down
    twilight: 1.2,        // hours that dawn and dusk last, half before and half after
    // How the city looks at each moment, over the colors of data/look.js.
    night: { color: '#060a16', dark: 0.86 },      // how dark the darkest night gets (0 none, 1 black)
    dusk: { color: '#d8713a', amount: 0.32 },     // the orange of the sunset
    dawn: { color: '#e6a273', amount: 0.24 },     // the pink-orange of the sunrise
    moon: 5,              // meters you make things out at night with no light at all
    // Your flashlight: F turns it on and off. It winds up by itself while off ("a dínamo"): no batteries yet.
    flashlight: { range: 17, battery: 1, drain: 0.12, recharge: 0.08 }, // range in m; battery per hour of the game
    // Street lamps along the streets, one every `every` m on alternate sides; `working` of them still light up.
    lamps: { every: 36, radius: 9, working: 0.45, minRoad: 5, color: '#ffcf8a' },
    houses: { lit: 0.3 }  // of the houses you can walk into, how many still have the lights on at night
  };
})(this.Lluvia = this.Lluvia || {});
