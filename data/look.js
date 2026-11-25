// How the city looks on screen (js/view/look.js), after Darkwood's mood (docs/DARKWOOD.md): washed-out, dirty
// colors with the sick yellow of the Sun, film grain and dark corners. Only the world gets it; the HUD stays clean.
// Every amount goes from 0 (none) to 1 (all).
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.look = {
    desaturate: 0.5,          // how much color the world loses
    tint: '#c8a93c',          // the Sun's sick yellow, laid softly over everything
    tintAmount: 0.35,
    grime: '#d2cab8',         // a dirty, slightly dark wash (multiplied over the world)
    grimeAmount: 0.8,
    grain: { amount: 0.13, size: 160, fps: 18 },  // film grain: strength, size of its tile in px, changes per second
    vignette: { amount: 0.6, inner: 0.35, outer: 0.85 }, // dark corners: strength, where it starts and ends (of half the screen's diagonal)
    // The quiet HUD: small, in muted colors, in the corners.
    hud: { text: '#cfc6a8', dim: '#8d8672', life: '#9e3b3b', xp: '#8a8f62', ammo: '#d9cfa6', low: '#c26a4a' }
  };
})(this.Lluvia = this.Lluvia || {});
