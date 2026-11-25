// Energy and sleep (data/rest.js). p.energy goes down with the hours awake; Z sleeps (in a bed if there is one at
// hand, else on the floor) and the clock runs fast until the bar is full, you press Z again, or something wakes you.
// Having eaten and drunk when you lie down, you wake with double the bar, and it goes down slower.
// Where you last slept is kept (p.bed): that is where you wake up after dying (stage 58).
(function (L) {
  'use strict';

  function D() { return L.data.rest; }

  L.makeRest = function (g) { var p = g.player; p.energy = D().max; p.energyMax = D().max; p.asleep = null; p.fedSleep = false; p.bed = null; };

  // The bed you can lie on, on your floor and within reach: the piece's center { x, y } or null.
  L.bedNear = function (g) {
    var p = g.player, city = g.city, f = p.floor || 0;
    if (!city || !L.planLevel) return null;
    var plan = f && p.house ? p.house : L.cityHouseAt && L.cityHouseAt(city, p.x, p.y);
    if (!plan) return null;
    var lv = L.planLevel(plan, f);
    if (!lv || !lv.solidPx) return null;
    var reach = D().reach * city.scale + p.r, best = null, bd = Infinity;
    lv.solidPx.forEach(function (o, k) {
      if (lv.furniture[k].t !== 'cama') return;
      var dx = p.x - o.x, dy = p.y - o.y, a = dx * o.ax + dy * o.ay, b = dx * o.fx + dy * o.fy;
      var d = Math.hypot(a - L.clamp(a, -o.hw, o.hw), b - L.clamp(b, -o.hd, o.hd));
      if (d < reach && d < bd) { bd = d; best = { x: o.x, y: o.y }; }
    });
    return best;
  };

  // Well fed: you ate and drank on time (data/needs.js).
  function wellFed(p) { var N = L.data.needs; return p.fed < N.eat.every && p.watered < N.drink.every; }

  // Lies down. Returns false if you can't now (a zombie after you, fainted).
  L.sleep = function (g) {
    var p = g.player;
    if (p.asleep || p.faint > 0) return false;
    if (danger(g)) { L.toast(g, 'No podés dormir con zombis cerca.', '#c26a4a'); return false; }
    // Not sleepy and nothing to heal: you can't sleep yet.
    if (p.energy >= D().max - 1 && !(p.capLost > 0)) { L.toast(g, 'No tenés sueño todavía.', '#8d8672'); return false; }
    var bed = L.bedNear(g);
    p.asleep = { bed: !!bed, slept: 0 };
    p.fedSleep = wellFed(p);
    p.bed = { x: p.x, y: p.y, floor: p.floor || 0, house: p.house || null };
    L.toast(g, bed ? 'Te acostaste en la cama.' : 'Te acostaste en el piso: se descansa peor.', '#b9ad86');
    return true;
  };

  L.wake = function (g, why) {
    var p = g.player, s = p.asleep;
    if (!s) return;
    p.asleep = null;
    // Slept well fed until the bar filled: it doubles (the user's "se duplica y tarda mucho más en agotarse").
    if (p.fedSleep && p.energy >= D().max - 0.5 && s.slept >= D().minSleep) { p.energyMax = D().fedMax; p.energy = D().fedMax; }
    L.toast(g, (why || 'Te despertaste.') + (p.energyMax > D().max ? ' Dormiste bien comido: tenés energía de sobra.' : ''), '#b9ad86');
    L.emit(g, 'wake', p.x, p.y);
  };

  // A zombie after you nearby, or one right next to you.
  function danger(g) {
    var p = g.player, s = g.city ? g.city.scale : 50, R = D();
    return g.enemies.some(function (e) {
      if (e.dead || (e.floor || 0) !== (p.floor || 0)) return false;
      var d = Math.hypot(e.x - p.x, e.y - p.y);
      return d < R.near * s || e.mind === 'chase' && d < R.wake * s;
    });
  }

  // How much the energy leaves of your air (1: all; less when low).
  L.energyAir = function (p) {
    var R = D();
    if (p.energy === undefined || p.energy >= R.airLow) return 1;
    return R.airMin + (1 - R.airMin) * Math.max(0, p.energy) / R.airLow;
  };
  // How far you see by the energy (1: as usual).
  L.energySight = function (p) {
    var R = D();
    if (p.energy === undefined || p.energy >= R.sightLow) return 1;
    return R.sightMin + (1 - R.sightMin) * Math.max(0, p.energy) / R.sightLow;
  };

  // How many times faster the clock runs now (asleep: `rate`).
  L.timeRate = function (g) { return g.player.asleep ? D().rate : 1; };

  // Each frame. `dt` real seconds, `gdt` seconds of the game's clock (more while asleep). Z sleeps or wakes.
  L.updateRest = function (g, dt, gdt, input) {
    var p = g.player, R = D(), hours = gdt / L.data.clock.hour;
    if (p.energy === undefined) L.makeRest(g);
    if (input && input.sleep && !g.sleepHeld) { if (p.asleep) L.wake(g); else L.sleep(g); }
    g.sleepHeld = !!(input && input.sleep);
    if (p.asleep) {
      var cap = R.max; // asleep it fills up to a full bar; the doubling comes when you wake
      p.energy = Math.min(cap, p.energy + (p.asleep.bed ? R.bed : R.floor) * hours);
      p.asleep.slept += hours;
      if (p.hurt > 0) L.wake(g, 'Te despertó un golpe.');
      else if (danger(g)) L.wake(g, 'Te despertó un ruido: hay zombis cerca.');
      else if (p.energy >= cap && !p.recovering) L.wake(g, 'Te despertaste descansado.'); // healing, you sleep on (js/health.js)
    } else {
      var drain = R.perHour * (p.running ? R.runMul : 1) * (p.energy > R.max ? R.fedDrain : 1);
      var was = p.energy;
      p.energy = Math.max(0, p.energy - drain * hours);
      if (p.energy <= R.max) p.energyMax = R.max;
      if (was >= R.sightLow && p.energy < R.sightLow) L.toast(g, 'Tenés sueño: ves menos lejos. Dormí (Z).', '#c26a4a');
      if (was >= 8 && p.energy < 8) L.toast(g, 'Te caés de sueño.', '#c26a4a');
    }
    p.sightMul = L.energySight(p);
  };
})(this.Lluvia = this.Lluvia || {});
