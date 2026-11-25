// Eating and drinking (js/needs.js), as the user asked (2026-11-25, answer 13): water every 6 hours and food every
// 12 (hours of the game's clock). If you carry food or water you have it by yourself when it's time. Going a day
// without eating does nothing; after that the unease grows. Nervous (zombies after you, or just hurt), your blood
// pressure may drop and you faint; the longer without eating and drinking, the likelier.
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.needs = {
    drink: { every: 6, grace: 6, span: 12, item: 'agua' },   // hours between drinks; hours over before the unease;
    eat: { every: 12, grace: 12, span: 24, item: 'comida' },  // hours it takes to grow by one step
    unease: { max: 3 },                                       // how bad it gets (each step adds up)
    // Fainting: a chance per second while nervous, times how bad the unease is; it lasts `time` s; nervous means a
    // zombie after you within `near` m, or hurt in the last `hurt` s.
    faint: { chance: 0.012, time: 4, near: 12, hurt: 3 }
  };
})(this.Lluvia = this.Lluvia || {});
