// Guns: aim, shoot, reload. The human aims with the mouse (input.aimX/aimY in world pixels, input.fire);
// the bots get input.autoAim and shoot at the nearest creature in range.
(function (L) {
  'use strict';

  L.giveGun = function (g, id) {
    var def = L.findById(L.data.guns, id) || L.data.guns[0], old = g.player.gun;
    g.player.gun = { def: def, level: old && old.def === def ? old.level : 0, ammo: 0, reload: 0, cd: 0 };
    g.player.gun.ammo = L.gunMag(g.player.gun);
    return g.player.gun;
  };

  L.gunMag = function (gun) { return Math.round(gun.def.mag * (1 + L.data.gunScaling.upgradeMag * gun.level)); };

  L.gunDamage = function (g, gun) {
    var S = L.data.gunScaling, p = g.player;
    return gun.def.damage * (1 + S.perLevel * (p.level - 1)) * (1 + S.perUpgrade * gun.level) * p.stats.damageMul;
  };

  // Starts reloading (R, or by itself when the magazine runs out).
  L.reloadGun = function (g) {
    var gun = g.player.gun;
    if (!gun || gun.reload > 0 || gun.ammo >= L.gunMag(gun)) return false;
    // With a backpack (js/loot.js) the bullets come from it: none left, no reload.
    if (g.pack && !L.packCount(g, 'balas')) {
      if (!(g.noAmmoAt > g.time - 4)) { g.noAmmoAt = g.time; L.toast(g, 'Sin balas: revisá los muebles de las casas.', '#c26a4a'); }
      return false;
    }
    gun.reload = gun.def.reload * Math.max(0.4, g.player.stats.cooldownMul);
    return true;
  };

  function nearest(g, range) {
    var p = g.player, best = null, bd = range * range;
    for (var i = 0; i < g.enemies.length; i++) {
      var e = g.enemies[i], dx = e.x - p.x, dy = e.y - p.y, d = dx * dx + dy * dy;
      if (!e.dead && d < bd) { bd = d; best = e; }
    }
    return best;
  }

  L.updateGun = function (g, dt, input) {
    var p = g.player, gun = p.gun;
    if (!gun) return;
    // You face where you aim, and see that way (js/sight.js).
    if (input.aimX !== undefined && (input.aimX !== p.x || input.aimY !== p.y)) {
      p.aim = Math.atan2(input.aimY - p.y, input.aimX - p.x);
      p.dirX = Math.cos(p.aim); p.dirY = Math.sin(p.aim);
    }
    if (gun.cd > 0) gun.cd -= dt;
    if (gun.reload > 0) {
      gun.reload -= dt;
      if (gun.reload <= 0) { gun.reload = 0; if (g.pack) L.reloadFromPack(g, gun); else gun.ammo = L.gunMag(gun); }
      return;
    }
    if (input.reload) { L.reloadGun(g); return; }
    var tx, ty, def = gun.def;
    if (input.autoAim) {
      var t = nearest(g, def.range * 0.95);
      if (!t) return;
      tx = t.x; ty = t.y;
    } else {
      if (!input.fire || input.aimX === undefined) return;
      tx = input.aimX; ty = input.aimY;
    }
    // Shots fired this frame (a fast gun can fire more than once per frame).
    var dmg = L.gunDamage(g, gun), base = Math.atan2(ty - p.y, tx - p.x);
    while (gun.cd <= 0 && gun.ammo > 0) {
      gun.cd += 1 / def.rate;
      gun.ammo--;
      for (var i = 0; i < def.pellets; i++) {
        var ang = base + (g.rng() - 0.5) * def.spread, sp = def.speed * (def.flame ? 0.8 + g.rng() * 0.4 : 1);
        g.projectiles.push({ x: p.x + Math.cos(base) * p.r, y: p.y + Math.sin(base) * p.r, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          r: def.size, proc: def.flame ? 0.1 : 0.4, damage: dmg, pierce: def.pierce, life: def.range / sp, hit: [], color: def.color,
          dead: false, bullet: true, flame: !!def.flame });
      }
      p.dirX = Math.cos(base); p.dirY = Math.sin(base);
      if (!def.flame || gun.ammo % 4 === 0) L.emit(g, 'shot', p.x, p.y);
      if (L.makeNoise) L.makeNoise(g, p.x, p.y, L.data.senses.noise.shot, p.floor, p); // heard far (js/senses.js)
    }
    if (gun.cd < 0) gun.cd = 0;
    if (gun.ammo <= 0) L.reloadGun(g);
  };

  // The Armería: buy a gun (the price is in chests) or improve the one you carry.
  L.gunPrice = function (g, def) { return Math.round(L.chestCost(g) * def.price); };
  L.upgradePrice = function (g, gun) { return Math.round(L.chestCost(g) * (1.5 + gun.level * 0.75)); };
})(this.Lluvia = this.Lluvia || {});
