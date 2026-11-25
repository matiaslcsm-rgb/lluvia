// Hand weapons (data/melee.js): what you hold, a blow in front of you, the damage by kind and skill, wear, air.
// You carry a gun and a hand weapon; 1 takes the gun, 2 the hand weapon (again: the next one in the backpack).
// Without anything else you have your fists, which never break.
(function (L) {
  'use strict';

  function D() { return L.data.melee; }
  L.meleeDef = function (id) { return L.findById(D().weapons, id) || D().weapons[0]; };

  L.makeHands = function (g) {
    var p = g.player;
    p.melee = { id: 'pinas', dur: 0 };
    p.air = D().air.max; p.airRest = 0; p.swingCd = 0; p.swingT = 0;
    p.hand = p.gun ? 'gun' : 'melee';
  };

  // A weapon found: into your hand if you only have your fists, else into the backpack (a slot of its own).
  // Returns false if there is no room.
  L.giveMelee = function (g, id, dur) {
    var p = g.player, def = L.meleeDef(id);
    if (dur === undefined) dur = def.dur;
    if (p.melee.id === 'pinas') { p.melee = { id: id, dur: dur }; return true; }
    if (g.pack.slots.length >= g.pack.size) return false;
    g.pack.slots.push({ id: 'w:' + id, n: 1, dur: dur });
    return true;
  };

  // 1: the gun. 2: the hand weapon; pressed again with one in hand, swaps it for the next weapon in the backpack.
  function switchHand(g, input) {
    var p = g.player;
    if (input.slot1 && !g.slotHeld && p.gun) p.hand = 'gun';
    if (input.slot2 && !g.slotHeld) {
      if (p.hand !== 'melee') p.hand = 'melee';
      else {
        var i = g.pack.slots.findIndex(function (sl) { return sl.id.indexOf('w:') === 0; });
        if (i >= 0) {
          var sl = g.pack.slots[i], was = p.melee;
          p.melee = { id: sl.id.slice(2), dur: sl.dur };
          if (was.id === 'pinas') g.pack.slots.splice(i, 1);
          else g.pack.slots[i] = { id: 'w:' + was.id, n: 1, dur: was.dur };
          L.toast(g, 'En la mano: ' + L.meleeDef(p.melee.id).name + '.', '#cfc6a8');
        }
      }
    }
    g.slotHeld = !!(input.slot1 || input.slot2);
  }

  // How much a blow of `def` hurts zombie e: its mix of kinds against what the zombie resists.
  function kindMul(def, e) {
    var res = e.type.resist || {}, m = def.mix, out = 0;
    ['c', 'k', 'p'].forEach(function (k) { if (m[k]) out += m[k] * (res[k] === undefined ? 1 : res[k]); });
    return out;
  }
  L.meleeKindMul = kindMul;

  // The damage of a blow with `def` on e, with your skills (data/skills.js).
  L.meleeDamage = function (g, def, e) {
    var p = g.player, n = L.data.skills.levels, t = L.skillLevel(p, def.skill) / n, tc = L.skillLevel(p, 'cuerpo') / n;
    return def.dmg * kindMul(def, e) * (1 + 0.8 * t) * (1 + 0.2 * tc) * (e.downT > 0 ? D().downBonus : 1);
  };

  // The closest zombie in front of you within reach, on your floor.
  function target(g, def) {
    var p = g.player, s = g.city ? g.city.scale : 50, aim = p.aim !== undefined ? p.aim : Math.atan2(p.dirY || 0, p.dirX || 1);
    var half = D().arc * Math.PI / 360, best = null, bd = Infinity;
    g.enemies.forEach(function (e) {
      if (e.dead || (e.floor || 0) !== (p.floor || 0)) return;
      var dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
      if (d > def.reach * s + e.r + p.r) return;
      var diff = Math.abs(((Math.atan2(dy, dx) - aim) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
      if (diff > half && d > e.r + p.r) return;
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }

  L.swing = function (g) {
    var p = g.player, A = D().air, def = L.meleeDef(p.melee.id), n = L.data.skills.levels;
    var t = L.skillLevel(p, def.skill) / n, tc = L.skillLevel(p, 'cuerpo') / n;
    var time = 1 / (def.speed * (1 + 0.4 * t)) * (p.air < A.low ? A.slow : 1);
    p.swingCd = time; p.swingT = time; p.swingMax = time;
    p.air = Math.max(0, p.air - def.air * (1 - 0.5 * tc)); p.airRest = A.rest;
    if (L.makeNoise) L.makeNoise(g, p.x, p.y, def.noise, p.floor, p);
    L.emit(g, 'swing', p.x, p.y, { weapon: def.id });
    var e = target(g, def);
    if (!e) return null;
    var dmg = L.meleeDamage(g, def, e), K = L.data.skills.list;
    L.applyHit(g, e, dmg, 0, 0);
    if (e.dead) { L.gainSkill(g, def.skill, K[def.skill].kill); L.gainSkill(g, 'cuerpo', K.cuerpo.kill); }
    else {
      L.gainSkill(g, def.skill, K[def.skill].hit); L.gainSkill(g, 'cuerpo', K.cuerpo.hit);
      if (g.rng() < def.knock * (1 + 0.5 * t)) { e.stun = Math.max(e.stun || 0, 2); e.downT = 2; }
      else e.stun = Math.max(e.stun || 0, 0.35); // it flinches
      if (e.face !== undefined) { e.mind = 'chase'; e.lostT = 0; e.lastX = p.x; e.lastY = p.y; }
    }
    // Bare hands hurt.
    if (def.hurt && g.rng() < def.hurt * (1 - t)) {
      p.hp -= D().hurtLife; p.hurt = 0.2;
      if (!(g.hurtToastAt > g.time - 5)) { g.hurtToastAt = g.time; L.toast(g, 'Te lastimaste las manos.', '#c26a4a'); }
    }
    // Wear: a fragile thing breaks soon.
    if (def.dur) {
      p.melee.dur--;
      if (p.melee.dur <= 0) { L.toast(g, 'Se rompió: ' + def.name + '.', '#c26a4a'); p.melee = { id: 'pinas', dur: 0 }; }
    }
    return e;
  };

  // Each frame: switching hands, your air, and a blow if you click with the hand weapon out.
  L.updateMelee = function (g, dt, input) {
    var p = g.player, A = D().air;
    if (!p.melee) L.makeHands(g);
    switchHand(g, input || {});
    if (p.swingCd > 0) p.swingCd -= dt;
    if (p.swingT > 0) p.swingT -= dt;
    if (p.airRest > 0) p.airRest -= dt; else p.air = Math.min(A.max, p.air + A.regen * dt);
    if (p.hand === 'melee' && input && input.fire && p.swingCd <= 0 && !g.respawn) L.swing(g);
  };
})(this.Lluvia = this.Lluvia || {});
