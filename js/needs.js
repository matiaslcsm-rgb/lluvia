// Eating and drinking (data/needs.js). The player keeps how many hours of the game it has been since it last ate
// (p.fed) and drank (p.watered). When it's time and there is food or water in what you carry, you have it. Past a
// day without food (half a day without water) the unease grows; nervous, you may faint.
(function (L) {
  'use strict';

  function D() { return L.data.needs; }

  L.makeNeeds = function (g) { var p = g.player; p.fed = 0; p.watered = 0; p.unease = 0; p.faint = 0; };

  // Has one now (from the inventory screen too). kind: 'eat' or 'drink'. Returns true if there was something.
  L.consume = function (g, kind) {
    var p = g.player, N = D()[kind];
    if (!L.packTake(g, N.item, 1)) return false;
    if (kind === 'eat') p.fed = 0; else p.watered = 0;
    L.toast(g, kind === 'eat' ? 'Comiste una lata.' : 'Tomaste agua.', '#cfc6a8');
    if (kind === 'drink') L.packAdd(g, 'botella', 1); // the empty bottle stays, if it fits
    return true;
  };

  // How bad the unease is now (0 none, up to unease.max).
  L.uneaseOf = function (p) {
    var N = D(), u = Math.max(0, (p.fed - N.eat.every - N.eat.grace) / N.eat.span) + Math.max(0, (p.watered - N.drink.every - N.drink.grace) / N.drink.span);
    return Math.min(N.unease.max, u);
  };

  // Nervous: a zombie after you nearby, or you were just hurt.
  function nervous(g) {
    var p = g.player, F = D().faint, near = F.near * g.city.scale;
    if (g.time - (p.hurtAt || -99) < F.hurt) return true;
    return g.enemies.some(function (e) { return !e.dead && e.mind === 'chase' && Math.hypot(e.x - p.x, e.y - p.y) < near; });
  }

  L.updateNeeds = function (g, dt) {
    var p = g.player, N = D(), hours = dt / L.data.clock.hour;
    if (p.fed === undefined) L.makeNeeds(g);
    if (p.hurt > 0 && !p.wasHurt) p.hurtAt = g.time;
    p.wasHurt = p.hurt > 0;
    p.fed += hours * (L.wx ? L.wx(g, 'hunger') : 1); p.watered += hours * (L.wx ? L.wx(g, 'thirst') : 1); // heat and cold
    if (p.watered >= N.drink.every) L.consume(g, 'drink');
    if (p.fed >= N.eat.every) L.consume(g, 'eat');
    var u = L.uneaseOf(p);
    if (u > 0 && p.unease === 0 || Math.floor(u) > Math.floor(p.unease)) L.toast(g, p.fed > p.watered + 6 ? 'Tenés hambre: te sentís mal.' : 'Tenés sed: te sentís mal.', '#c26a4a');
    p.unease = u;
    if (p.faint > 0) { p.faint -= dt; return; }
    if (u > 0 && nervous(g) && g.rng() < N.faint.chance * u * dt) {
      p.faint = N.faint.time;
      L.toast(g, 'Te bajó la presión: te desmayaste.', '#c26a4a');
      L.emit(g, 'faint', p.x, p.y);
    }
  };
})(this.Lluvia = this.Lluvia || {});
