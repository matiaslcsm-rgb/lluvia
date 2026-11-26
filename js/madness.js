// The survivors' madness (data/madness.js, stage 72). q.sanity goes down with what they see and how they live, and
// up when they are looked after. Low, they hallucinate; lower, they do things, by where they are: in the Catedral
// they pull planks off its windows; outside they scream at night and bring zombies; walking with you, alone with
// you, they turn on you (q.hostile); in a trance, the creatures near them are sent at you.
(function (L) {
  'use strict';

  function D() { return L.data.madness; }
  L.sanityOf = function (q) { return q.sanity === undefined ? 70 : q.sanity; };
  // `g` (optional): somebody going odd weighs on the zone they are in (js/morale.js).
  L.changeSanity = function (q, dv, g) {
    var was = L.isOdd(q);
    q.sanity = Math.max(0, Math.min(100, L.sanityOf(q) + dv));
    if (g && !was && L.isOdd(q) && L.moraleEvent) L.moraleEvent(g, q.x, q.y, 'odd');
  };
  L.isOdd = function (q) { return L.sanityOf(q) < D().odd; };
  L.newSanity = function (rng) { var S = D().start; return S[0] + Math.floor(rng() * (S[1] - S[0] + 1)); };

  // A new day (js/people.js calls it before the Catedral's new needs): how each one lived yesterday.
  L.madnessDay = function (g) {
    var M = D().daily;
    (g.people || []).forEach(function (q) {
      if (q.dead || q.hostile) return;
      if (q.mode === 'refuge') L.changeSanity(q, q.done ? M.refugeFed : M.refugeHungry, g);
      else if (q.mode === 'follow') L.changeSanity(q, M.follow, g);
      else if (q.mode !== 'travel') L.changeSanity(q, M.alone, g);
    });
  };

  // Giving them what calms them.
  L.canCalm = function (g, q) { var c = D().calm; return L.isOdd(q) && !q.hostile && L.packCount(g, c.item[0]) >= c.item[1]; };
  L.calm = function (g, q) {
    if (!L.canCalm(g, q)) return false;
    var c = D().calm;
    L.packTake(g, c.item[0], c.item[1]);
    L.changeSanity(q, c.gain, g);
    if (L.moraleEvent) L.moraleEvent(g, q.x, q.y, 'calm');
    q.plot = false;
    q.say = D().lines.calm;
    return true;
  };

  // In the Catedral: a plank off one of its windows.
  function sabotage(g, q) {
    var plan = L.refugePlan(g), B = L.data.barricade;
    if (!plan || !g.barricades || !L.planOpenings) return false;
    var nailed = L.planOpenings(plan).filter(function (o) { var b = g.barricades[o.key]; return o.kind === 'window' && b && b.planks > 0; });
    if (!nailed.length) return false;
    var o = nailed[Math.floor(g.rng() * nailed.length)], b = g.barricades[o.key];
    b.planks--; b.hp = Math.min(b.hp, b.planks * B.plankHp);
    L.useBarricades(g);
    q.sabotaged = (q.sabotaged || 0) + 1;
    L.toast(g, D().lines.sabotage, '#b08ad0');
    return true;
  }
  // Turning on you.
  function turn(g, q) {
    q.hostile = true; q.mode = null; q.street = false; q.hitT = 0.5;
    if (L.moraleEvent) L.moraleEvent(g, q.x, q.y, 'turned');
    L.toast(g, q.name + ': «' + D().lines.betray + '»', '#d05a5a');
  }
  function othersNear(g, q, m) {
    var s = g.city.scale;
    return g.people.some(function (o) { return o !== q && !o.dead && !o.hostile && o.mode !== 'travel' && Math.hypot(o.x - q.x, o.y - q.y) < m * s; });
  }
  // Coming at you and hitting you.
  function attack(g, q, dt) {
    var B = D().betray, p = g.player, s = g.city.scale, d = Math.hypot(p.x - q.x, p.y - q.y) || 1;
    q.dirX = (p.x - q.x) / d; q.dirY = (p.y - q.y) / d;
    if ((q.floor || 0) !== (p.floor || 0)) { q.still = 1; return; }
    if (d > q.r + p.r + 0.15 * s) {
      var v = p.stats.speed * B.speed * dt, out = {};
      L.cityMove(g.city, q.x, q.y, q.x + q.dirX * v, q.y + q.dirY * v, Math.min(q.r, L.data.city.body), out);
      q.x = out.x; q.y = out.y; q.still = 0;
    } else q.still = 1;
    q.hitT = Math.max(0, (q.hitT || 0) - dt);
    if (q.hitT <= 0 && d <= q.r + p.r + 0.4 * s && p.invuln <= 0) {
      q.hitT = B.every;
      var dmg = B.dmg * (1 - p.stats.armor);
      p.hp -= dmg; p.hurt = 0.15;
      if (L.takeWound) L.takeWound(g, dmg, { type: { attack: { k: 0.6, c: 0.4 } } });
      L.emit(g, 'blow', p.x, p.y);
    }
  }

  // Each frame (js/people.js calls it): screams, plots, the trance, and the ones who turned on you.
  L.updateMadness = function (g, dt) {
    var M = D(), p = g.player, s = g.city.scale, k = L.clockOf(g), dark = k.light < 0.5;
    var hour = Math.floor((g.time + (g.slept || 0)) / L.data.clock.hour / M.every);
    var roll = g.madHour !== hour;
    g.madHour = hour;
    g.people.forEach(function (q) {
      if (q.dead || q.mode === 'travel') return;
      if (q.hostile) { attack(g, q, dt); return; }
      var sane = L.sanityOf(q);
      if (sane >= M.act) return;
      // Every game hour, a chance to do something.
      if (roll && g.rng() < M.chance) {
        if (q.mode === 'refuge') sabotage(g, q);
        else if (q.mode === 'follow') q.plot = true; // waits until it is alone with you
      }
      if (q.plot && q.mode === 'follow' && !othersNear(g, q, M.betray.alone)) turn(g, q);
      // Outside at night: screams that bring them.
      if (dark && q.mode !== 'refuge' && q.mode !== 'follow') {
        q.screamT = (q.screamT || 0) - dt;
        if (q.screamT <= 0) { q.screamT = M.scream.every; if (L.makeNoise) L.makeNoise(g, q.x, q.y, M.scream.meters, q.floor || 0, q); L.emit(g, 'groan', q.x, q.y); }
      }
      // In a trance: the creatures near them come for you.
      if (sane < M.trance && (q.floor || 0) === (p.floor || 0) && Math.hypot(p.x - q.x, p.y - q.y) < M.control.reach * s) {
        q.trT = (q.trT || 0) - dt;
        if (q.trT <= 0) {
          q.trT = 2;
          g.enemies.forEach(function (e) {
            if (e.dead || e.face === undefined || (e.floor || 0) !== (q.floor || 0) || Math.hypot(e.x - q.x, e.y - q.y) > M.control.range * s) return;
            e.mind = 'investigate'; e.goX = p.x; e.goY = p.y; e.linger = 3; e.controlled = true;
          });
          if (!q.tranceSeen) { q.tranceSeen = true; L.toast(g, q.name + ': ' + M.lines.trance, '#b08ad0'); }
        }
      }
    });
  };
})(this.Lluvia = this.Lluvia || {});
