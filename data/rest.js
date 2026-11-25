// Energy and sleep (js/rest.js), as the user asked after playing (2026-11-25, docs/CUERPO.md section 2): the
// energy goes down with the hours awake; sleeping gives it back, and having slept well fed it doubles and goes down
// slower. Without sleep you see less far; low on energy your air (running, blows) comes back slower and lasts less.
// Later the sanity will hang from this (not yet).
//   Hours are hours of the game's clock (data/clock.js).
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.rest = {
    max: 100,             // a full bar
    fedMax: 200,          // after sleeping well fed: double (the user's "se duplica")
    perHour: 6,           // energy lost per hour awake (from full to nothing in ~16 hours)
    runMul: 2,            // running, it goes down this many times faster
    fedDrain: 0.55,       // after sleeping well fed it goes down at this rate, while the bar is over `max`
    // Sleeping (Z): energy back per hour of sleep, in a bed or on the floor (you rest worse; the user didn't say:
    // my call). Asleep, the clock goes `rate` times faster. A zombie after you within `wake` m, or one within
    // `near` m, or getting hurt wakes you up.
    bed: 14, floor: 7, rate: 60, wake: 14, near: 5, reach: 1.2,
    minSleep: 3,          // hours you must sleep for the well-fed doubling
    // Low on energy: under `airLow` your air comes back slower and lasts less (down to `airMin` of what it was at
    // 0); under `sightLow` you see less far (down to `sightMin` of how far at 0).
    airLow: 50, airMin: 0.4,
    sightLow: 30, sightMin: 0.55
  };
})(this.Lluvia = this.Lluvia || {});
