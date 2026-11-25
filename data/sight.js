// What you see (js/sight.js), after Darkwood (docs/DARKWOOD.md): a cone toward where you aim, a small circle all
// around you, and walls that hide what is behind them. Outside, the city stays in half-light and the creatures
// can't be seen. Lengths in meters.
(function (L) {
  'use strict';
  L.data = L.data || {};
  L.data.sight = {
    cone: 100,         // degrees: how wide the cone in front of you is
    range: 38,         // how far you see in the cone (about the screen's edge)
    near: 2.5,         // all around you, even behind: what you feel close
    rays: 240,         // rays around the whole circle to find the edge of what you see (more in the cone)
    shade: 0.62,       // how dark the half-light outside what you see is (0 none, 1 black)
    soft: 5,           // px of blur on the edge of what you see
    // Furniture that hides what is behind it (the rest is low: you see over it, like over a car).
    tall: ['ropero', 'estante', 'heladera', 'gondola', 'maquina', 'archivero', 'motor', 'tanque']
  };
})(this.Lluvia = this.Lluvia || {});
