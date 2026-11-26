// Hand weapons (data/melee.js): what you hold, a blow in front of you, the damage by kind and skill, wear, air.
// Two hands (js/loot.js, p.hands): the left button hits with the right hand, the right button with the left hand;
// an empty hand is a fist (it never breaks), a hand holding something else (water, a can) doesn't hit. A long weapon
// takes both hands: the left button hits and the right one readies the blow. 1 takes the gun out (both hands: what
// you held waits aside), 2 puts it away; 2 again takes the next weapon you carry.
(function (L) {
  'use strict';

  function D() { return L.data.melee; }
  L.meleeDef = function (id) { return L.findById(D().weapons, id) || D().weapons[0]; };

  L.makeHands = function (g) {
    var p = g.player;
    p.hands = p.hands || { l: null, r: null };
    p.air = D().air.max; p.airRest = 0; p.swingCd = 0; p.swingT = 0;
    p.hand = p.gun ? 'gun' : 'melee';
  };

  // A weapon found: into your hands if both are empty, else into a pocket or bag (a slot of its own).
  // Returns false if there is no room.
  L.giveMelee = function (g, id, dur) {
    var p = g.player, def = L.meleeDef(id), h = p.hands || {};
    if (dur === undefined) dur = def.dur;
    if (!h.l && !h.r) { L.putInHands(g, { id: 'w:' + id, n: 1, dur: dur }, 'r'); return true; }
    return L.packAddWeapon(g, id, dur);
  };

  // 1: the gun. 2: the hand weapon; pressed again with one in hand, swaps it for the next weapon in the backpack.
  function switchHand(g, input) {
    var p = g.player;
    if (input.slot1 && !g.slotHeld && p.gun) p.hand = 'gun';
    if (input.slot2 && !g.slotHeld) {
      if (p.hand !== 'melee') p.hand = 'melee';
      else {
        var ws = L.packWeapons(g);
        if (ws.length) {
          var sl = ws[0].place.slots.splice(ws[0].i, 1)[0];
          L.putInHands(g, sl, 'r'); // the one you held goes where it fits
          L.toast(g, 'En la mano: ' + L.mainDef(p).name + '.', '#cfc6a8');
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

  // A blow. `hand` is the mouse button ('left', the default: your right hand; 'right': your left hand). Each hand
  // has its own pace, so hitting with both in turn is faster. Returns the zombie hit, or null.
  function sideOf(p, hand) {
    var h = p.hands || {};
    if (h.l && h.l === h.r) return 'r'; // a two-hand weapon
    return hand === 'right' ? 'l' : 'r';
  }
  L.swing = function (g, hand) {
    var p = g.player, A = D().air, side = sideOf(p, hand), def = L.handDef(p, side), n = L.data.skills.levels;
    if (!def) return null; // that hand holds something else
    var held = p.hands && p.hands[side];
    var t = L.skillLevel(p, def.skill) / n, tc = L.skillLevel(p, 'cuerpo') / n;
    var time = 1 / (def.speed * (1 + 0.4 * t)) * (p.air < A.low ? A.slow : 1) * (1 + (p.bluntSlow || 0)); // hard blows slow you (js/health.js)
    // A readied blow (right button held with a long weapon) hurts more and drops more.
    var ready = p.ready || 0; p.ready = 0;
    if (hand === 'right') p.swingCdR = time; else p.swingCd = time;
    p.swingT = time; p.swingMax = time; p.punchHand = hand || 'left';
    p.air = Math.max(0, p.air - def.air * (1 - 0.5 * tc)); p.airRest = A.rest;
    if (L.makeNoise) L.makeNoise(g, p.x, p.y, def.noise, p.floor, p);
    L.emit(g, 'swing', p.x, p.y, { weapon: def.id });
    var e = target(g, def);
    // Somebody (js/people.js) in front, closer than the zombie: the blow is for them.
    var who = g.people && L.personInFront ? L.personInFront(g, def.reach, D().arc * Math.PI / 360) : null;
    if (who && (!e || who.d < Math.hypot(e.x - p.x, e.y - p.y))) {
      L.hurtPerson(g, who.q, def.dmg * (1 + 0.8 * t) * (1 + D().readyDmg * ready));
      L.emit(g, 'blow', who.q.x, who.q.y);
      return null;
    }
    if (!e) return null;
    var dmg = L.meleeDamage(g, def, e) * (1 + D().readyDmg * ready), K = L.data.skills.list;
    L.applyHit(g, e, dmg, 0, 0);
    L.emit(g, 'blow', e.x, e.y);
    if (e.dead) { L.gainSkill(g, def.skill, K[def.skill].kill); L.gainSkill(g, 'cuerpo', K.cuerpo.kill); }
    else {
      L.gainSkill(g, def.skill, K[def.skill].hit); L.gainSkill(g, 'cuerpo', K.cuerpo.hit);
      if (g.rng() < def.knock * (1 + 0.5 * t) * (1 + D().readyKnock * ready)) { e.stun = Math.max(e.stun || 0, 2); e.downT = 2; }
      else e.stun = Math.max(e.stun || 0, 0.35); // it flinches
      if (e.face !== undefined) { e.mind = 'chase'; e.lostT = 0; e.lastX = p.x; e.lastY = p.y; }
    }
    // Bare hands hurt.
    if (def.hurt && g.rng() < def.hurt * (1 - t)) {
      p.hp -= D().hurtLife; p.hurt = 0.2;
      if (!(g.hurtToastAt > g.time - 5)) { g.hurtToastAt = g.time; L.toast(g, 'Te lastimaste las manos.', '#c26a4a'); }
    }
    // Wear: a fragile thing breaks soon.
    if (def.dur && held) {
      held.dur--;
      if (held.dur <= 0) {
        L.toast(g, 'Se rompió: ' + def.name + '.', '#c26a4a'); L.emit(g, 'break', p.x, p.y);
        if (p.hands.l === held) p.hands.l = null;
        if (p.hands.r === held) p.hands.r = null;
      }
    }
    return e;
  };

  // A shove (both buttons): the zombies in front go back and stop a moment, some fall; it does no damage.
  L.shove = function (g) {
    var p = g.player, P = D().push, s = g.city ? g.city.scale : 50, aim = p.aim !== undefined ? p.aim : Math.atan2(p.dirY || 0, p.dirX || 1);
    var tc = L.skillLevel(p, 'cuerpo') / L.data.skills.levels, hit = 0, mv = {};
    p.pushCd = P.every; p.swingT = 0.25; p.swingMax = 0.25; p.punchHand = 'both';
    p.air = Math.max(0, p.air - P.air * (1 - 0.5 * tc)); p.airRest = D().air.rest;
    if (L.makeNoise) L.makeNoise(g, p.x, p.y, P.noise, p.floor, p);
    g.enemies.forEach(function (e) {
      if (e.dead || (e.floor || 0) !== (p.floor || 0)) return;
      var dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
      if (d > P.reach * s + e.r + p.r) return;
      var diff = Math.abs(((Math.atan2(dy, dx) - aim) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
      if (diff > D().arc * Math.PI / 360 && d > e.r + p.r) return;
      var nx = e.x + dx / d * P.back * s, ny = e.y + dy / d * P.back * s;
      if (g.city) { L.cityLevelMove(g.city, e, nx, ny, 4, mv); nx = mv.x; ny = mv.y; }
      e.x = nx; e.y = ny;
      e.stun = Math.max(e.stun || 0, P.stun);
      if (g.rng() < P.knock * (1 + tc)) { e.stun = Math.max(e.stun, 2); e.downT = 2; }
      hit++;
    });
    L.emit(g, 'shove', p.x, p.y, { hit: hit });
    if (hit) L.gainSkill(g, 'cuerpo', L.data.skills.list.cuerpo.hit);
    return hit;
  };

  // Each frame: switching hands, your air, and a blow if you click with the hand weapon out. With fists the left
  // button is one hand and the right the other; both at once shove (with any hand weapon).
  L.updateMelee = function (g, dt, input) {
    var p = g.player, A = D().air, P = D().push;
    input = input || {};
    if (!p.hands) L.makeHands(g);
    switchHand(g, input);
    if (p.swingCd > 0) p.swingCd -= dt;
    if (p.swingCdR > 0) p.swingCdR -= dt;
    if (p.pushCd > 0) p.pushCd -= dt;
    if (p.swingT > 0) p.swingT -= dt;
    var tired = L.energyAir ? L.energyAir(p) : 1; // low on energy: less air, back slower (js/rest.js)
    if (p.airRest > 0) p.airRest -= dt; else p.air = Math.min(A.max * tired, p.air + A.regen * tired * (L.wx ? L.wx(g, 'air') : 1) * (L.tempMul ? L.tempMul(g, 'air') : 1) * dt); // heat, or too warm clothes: slower
    if (p.air > A.max * tired) p.air = A.max * tired;
    if (p.hand !== 'melee' || g.respawn || p.faint > 0) return;
    // When each button went down (to tell both-at-once from one after the other).
    if (input.fire && !p.heldL) p.downL = g.time;
    if (input.aiming && !p.heldR) p.downR = g.time;
    p.heldL = !!input.fire; p.heldR = !!input.aiming;
    var both = input.fire && input.aiming && Math.abs((p.downL || 0) - (p.downR || 0)) <= P.both;
    if (both) { if (!(p.pushCd > 0)) L.shove(g); return; }
    var two = p.hands && p.hands.l && p.hands.l === p.hands.r;
    // A long weapon: holding the right button readies the blow (the user's answer 5).
    if (two) { if (input.aiming && !input.fire) p.ready = Math.min(1, (p.ready || 0) + dt / D().ready); }
    else p.ready = 0;
    p.readying = !!two && !!input.aiming && !input.fire;
    if (input.fire && !(p.swingCd > 0) && g.time - (p.downL || 0) > P.both) L.swing(g, 'left');
    if (!two && input.aiming && !(p.swingCdR > 0) && g.time - (p.downR || 0) > P.both) L.swing(g, 'right');
  };
})(this.Lluvia = this.Lluvia || {});
