// Shrines in your barrio: optional risks you choose to take.
//  - Santuario del Trueno: touch it to start a 20 s challenge (elites come for you). Survive it without losing a
//    life and it leaves a boss chest.
//  - Pozo de los deseos: costs a quarter of your gold; heads you get double back, tails you lose it.
// Only the watched arena has them (the bots don't use them), so they don't change the rivals' balance.
(function (L) {
  'use strict';

  L.data.shrines = {
    first: 180,          // first one at 3:00
    every: 150,          // then one every 2:30, alternating kinds
    life: 60,            // it disappears if you don't touch it in this time
    challenge: { seconds: 20, elites: 3, perStep: 0.5 },
    well: { share: 0.25, min: 10 }
  };

  L.updateShrines = function (g, dt) {
    if (!g.events) return; // only where someone is watching
    var S = L.data.shrines, p = g.player;
    g.shrines = g.shrines || [];
    if (g.nextShrine === undefined) g.nextShrine = S.first;
    if (g.time >= g.nextShrine) {
      g.nextShrine += S.every;
      g.shrineCount = (g.shrineCount || 0) + 1;
      var kind = g.shrineCount % 2 ? 'trueno' : 'pozo';
      var a = g.rng() * Math.PI * 2, d = 380 + g.rng() * 200;
      g.shrines.push({ kind: kind, x: L.clamp(p.x + Math.cos(a) * d, 60, g.arena - 60), y: L.clamp(p.y + Math.sin(a) * d, 60, g.arena - 60), r: 22, life: S.life, active: false });
      L.toast(g, kind === 'trueno' ? 'Apareció un Santuario del Trueno: tocalo si te animás a un desafío.' : 'Apareció un Pozo de los deseos: tocalo para jugarte un cuarto de tu oro.', '#c9b8ff');
    }
    for (var i = g.shrines.length - 1; i >= 0; i--) {
      var s = g.shrines[i];
      if (s.active) {
        s.timer -= dt;
        if (g.lives < s.lives) { // lost a life during the challenge: failed
          g.shrines.splice(i, 1);
          L.toast(g, 'Fallaste el desafío del Trueno.', '#ff9a7a');
        } else if (s.timer <= 0) {
          g.shrines.splice(i, 1);
          L.dropChest(g, s.x, s.y, 'boss');
          L.toast(g, '¡Superaste el desafío! El Trueno te dejó un cofre.', '#ffd27a');
          L.emit(g, 'level', s.x, s.y);
        }
        continue;
      }
      s.life -= dt;
      if (s.life <= 0) { g.shrines.splice(i, 1); continue; }
      var rr = s.r + p.r;
      if ((s.x - p.x) * (s.x - p.x) + (s.y - p.y) * (s.y - p.y) >= rr * rr) continue;
      if (s.kind === 'trueno') startChallenge(g, s);
      else { useWell(g, s); g.shrines.splice(i, 1); }
    }
  };

  function startChallenge(g, s) {
    var C = L.data.shrines.challenge, step = L.difficulty(g) - 1, p = g.player;
    s.active = true;
    s.timer = C.seconds;
    s.lives = g.lives;
    var n = Math.round(C.elites + C.perStep * step);
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, types = ['rastrero', 'bruto', 'veloz', 'escupidor'];
      L.makeElite(L.spawnEnemy(g, types[i % types.length], p.x + Math.cos(a) * 420, p.y + Math.sin(a) * 420));
    }
    L.toast(g, '¡Desafío del Trueno! Aguantá ' + C.seconds + ' segundos sin perder una vida.', '#c9b8ff');
    L.emit(g, 'boss', s.x, s.y);
  }

  function useWell(g, s) {
    var W = L.data.shrines.well, bet = Math.max(W.min, Math.floor(g.gold * W.share));
    if (g.gold < bet) { L.toast(g, 'El Pozo pide al menos ' + bet + ' de oro.', '#9a9db0'); s.life = 0; return; }
    if (g.rng() < 0.5) { g.gold += bet; L.toast(g, '¡El Pozo te devolvió el doble! +' + bet + ' oro', '#6fdc6a'); L.emit(g, 'chest', s.x, s.y, { rarity: 'raro', name: '+' + bet + ' oro' }); }
    else { g.gold -= bet; L.toast(g, 'El Pozo se quedó con ' + bet + ' de oro.', '#ff9a7a'); }
  }
})(this.Lluvia = this.Lluvia || {});
