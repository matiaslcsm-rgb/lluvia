// Dying (docs/CUERPO.md section 6), as the user decided after playing: you wake up where you last slept (p.bed,
// js/rest.js), whole again; your body stays where you fell, with everything you carried, and you can go and get it.
// The game is not lost (for now; it will be polished later). You keep the pistol: it goes with the level-up upgrades
// (the user's point 1: the old level system stays for now). g.bodies: [{ x, y, floor, places, hands }].
(function (L) {
  'use strict';

  L.dieAndWake = function (g) {
    var p = g.player, h = L.data.horde;
    // The body, with what you carried (all but the pistol).
    var places = g.pack.places.map(function (pl) { return { id: pl.id, slots: pl.slots.filter(function (sl) { return sl.id !== 'gun'; }) }; });
    var hands = L.handSlots(g).slice();
    var any = hands.length || places.some(function (pl) { return pl.slots.length || pl.id !== 'bolsillos'; });
    if (any) (g.bodies || (g.bodies = [])).push({ x: p.x, y: p.y, floor: p.floor || 0, house: p.house || null, places: places, hands: hands });
    g.deaths++;
    L.emit(g, 'lifeLost', p.x, p.y);
    // You: only your pockets with the pistol, empty hands.
    g.pack.places = [{ id: 'bolsillos', slots: p.gun ? [{ id: 'gun', n: 1 }] : [] }];
    p.hands = { l: null, r: null };
    p.hand = p.gun ? 'gun' : 'melee';
    // Where you last slept, or where the game started.
    var bed = p.bed, at = bed || (g.city && g.city.start ? L.cityFree(g.city, g.city.start.x, g.city.start.y) : { x: p.x, y: p.y });
    p.x = at.x; p.y = at.y; p.floor = bed ? bed.floor : 0; p.house = bed ? bed.house : null;
    // Whole again: life, wounds, energy, hunger and thirst.
    if (L.makeHealth) L.makeHealth(g);
    p.hp = p.stats.maxHp;
    if (p.energy !== undefined) { p.energy = L.data.rest.max; p.energyMax = L.data.rest.max; p.asleep = null; }
    p.fed = 0; p.watered = 0; p.unease = 0; p.faint = 0;
    p.invuln = h.respawnInvuln;
    // Room to breathe: no zombie right next to you.
    var r2 = Math.pow(h.respawnClear, 2);
    g.enemies = g.enemies.filter(function (e) { return e.type.boss || Math.pow(e.x - p.x, 2) + Math.pow(e.y - p.y, 2) > r2; });
    g.projectiles.length = 0; g.enemyShots.length = 0;
    L.toast(g, any ? 'Moriste. Te despertaste ' + (bed ? 'donde dormiste por última vez' : 'donde empezaste') + '. Tu cuerpo quedó donde caíste, con tus cosas.' :
      'Moriste. Te despertaste ' + (bed ? 'donde dormiste por última vez.' : 'donde empezaste.'), '#c26a4a');
  };

  // The nearest body of yours within reach, on your floor: its index or -1.
  L.bodyTarget = function (g) {
    var p = g.player, s = g.city ? g.city.scale : 50, reach = (L.data.loot.reach + 0.4) * s + p.r, best = -1, bd = Infinity;
    (g.bodies || []).forEach(function (b, i) {
      if ((b.floor || 0) !== (p.floor || 0)) return;
      var d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d < reach && d < bd) { bd = d; best = i; }
    });
    return best;
  };

  // E on your body: you put its bags back on and take everything that fits; the rest stays on it.
  L.lootBody = function (g, i) {
    var b = g.bodies[i], p = g.player, took = 0, left = 0;
    b.places.forEach(function (pl) { if (pl.id !== 'bolsillos') L.wear(g, pl.id); });
    var all = b.hands.slice();
    b.places.forEach(function (pl) { all = all.concat(pl.slots); });
    var rest = [];
    all.forEach(function (sl) {
      if (sl.id.indexOf('w:') === 0) {
        var h = p.hands;
        if (!h.l && !h.r) { L.putInHands(g, sl, 'r'); took++; }
        else if (L.packAddWeapon(g, sl.id.slice(2), sl.dur)) took++;
        else { rest.push(sl); left++; }
      } else {
        var n = L.packAdd(g, sl.id, sl.n);
        if (n < sl.n) took++;
        if (n) { rest.push({ id: sl.id, n: n }); left++; }
      }
    });
    if (rest.length) { b.hands = []; b.places = [{ id: 'bolsillos', slots: rest }]; } else g.bodies.splice(i, 1);
    L.toast(g, took ? 'Recuperaste tus cosas' + (left ? ': no te entra todo, lo demás queda en el cuerpo.' : '.') : 'No te entra nada más.', '#d9cfa6');
    L.emit(g, 'loot', p.x, p.y, { piece: 'cuerpo', got: [] });
    return took > 0;
  };
})(this.Lluvia = this.Lluvia || {});
