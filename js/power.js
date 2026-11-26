// Electricity (data/power.js). L.hasPower(plan): does the building still have it. Switches: one per room, beside a
// door of that room (made once per plan and floor). g.lights: { 'building:floor:room': true } for the rooms you lit;
// with power, a lit room is lit at night (js/clock.js lightAt, js/view/night.js).
(function (L) {
  'use strict';

  function D() { return L.data.power; }
  L.hasPower = function (plan) {
    if (!plan) return false;
    var h = Math.abs(Math.sin((plan.index + 7) * 12.9898) * 43758.5453) % 1;
    return h < D().share;
  };

  // The switches of a floor: [{ room, x, y (px) }].
  L.planSwitches = function (plan, fl) {
    plan._switches = plan._switches || {};
    if (plan._switches[fl]) return plan._switches[fl];
    var level = L.planLevel(plan, fl), out = [], done = {}, s = plan.scale, W = plan.W;
    if (!level || !level.lab) return (plan._switches[fl] = out);
    var segs = (level.doors || []).slice();
    if (!fl) plan.exits.forEach(function (e) { segs.push(e.seg); });
    segs.forEach(function (g) {
      var dx = g[2] - g[0], dy = g[3] - g[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
      var mx = (g[0] + g[2]) / 2, my = (g[1] + g[3]) / 2;
      [1, -1].forEach(function (side) {
        var cx = Math.floor(mx + nx * side * 0.5), cy = Math.floor(my + ny * side * 0.5);
        if (cx < 0 || cy < 0 || cx >= W || cy >= plan.D) return;
        var room = level.lab[cy * W + cx];
        if (room === undefined || room < 0 || done[room]) return;
        // Beside the frame, on the wall, inside the room.
        var sx = mx + nx * side * 0.3 + ux * (len / 2 + 0.3), sy = my + ny * side * 0.3 + uy * (len / 2 + 0.3);
        var kx = Math.floor(sx), ky = Math.floor(sy);
        if (kx < 0 || ky < 0 || kx >= W || ky >= plan.D || level.lab[ky * W + kx] !== room) { sx = mx + nx * side * 0.3; sy = my + ny * side * 0.3; }
        done[room] = true;
        var q = L.housePoint(plan, sx, sy);
        out.push({ room: room, x: q[0] * s, y: q[1] * s, cx: sx, cy: sy });
      });
    });
    return (plan._switches[fl] = out);
  };
  function key(plan, fl, room) { return plan.index + ':' + fl + ':' + room; }
  L.roomLit = function (g, plan, fl, room) { return !!(g.lights && g.lights[key(plan, fl, room)]) && L.hasPower(plan); };
  // The room a spot is in, on a floor of a plan: its index or -1.
  L.roomAt = function (plan, fl, x, y) {
    var level = L.planLevel(plan, fl), f = plan.frame, s = plan.scale;
    if (!level || !level.lab) return -1;
    var px = x / s - f.ox, py = y / s - f.oy, u = (px * f.ux + py * f.uy) / plan.cell, v = (px * f.vx + py * f.vy) / plan.cell;
    var cx = Math.floor(u), cy = Math.floor(v);
    if (cx < 0 || cy < 0 || cx >= plan.W || cy >= plan.D) return -1;
    var r = level.lab[cy * plan.W + cx];
    return r === undefined ? -1 : r;
  };
  // Is the spot in a room with the light on?
  L.litRoomAt = function (g, x, y, fl) {
    if (!g.lights || !g.city) return false;
    var plan = fl ? g.player.house : L.cityHouseAt(g.city, x, y);
    if (!plan || !L.hasPower(plan)) return false;
    return L.roomLit(g, plan, fl || 0, L.roomAt(plan, fl || 0, x, y));
  };

  // The switch within reach in the building you are in, on your floor: { plan, fl, sw, d } or null.
  L.switchTarget = function (g) {
    var p = g.player, city = g.city;
    if (!city || !city.map || !g.refuge) return null;
    var fl = p.floor || 0, plan = fl ? p.house : L.cityHouseAt(city, p.x, p.y);
    if (!plan) return null;
    var reach = D().reach * city.scale + p.r, best = null;
    L.planSwitches(plan, fl).forEach(function (sw) {
      var d = Math.hypot(sw.x - p.x, sw.y - p.y), da = Math.atan2(sw.y - p.y, sw.x - p.x) - (p.aim || 0);
      da = Math.atan2(Math.sin(da), Math.cos(da));
      // You flip the one you look at (it sits beside a door: else E would never open that door).
      if (d < reach && (d < 0.35 * city.scale || Math.abs(da) < 0.7) && (!best || d < best.d)) best = { plan: plan, fl: fl, sw: sw, d: d };
    });
    return best;
  };
  // Flips it: with power the room lights up (or goes dark); without, nothing happens.
  L.flipSwitch = function (g, T) {
    var k = key(T.plan, T.fl, T.sw.room), p = g.player;
    g.lights = g.lights || {};
    if (g.lights[k]) delete g.lights[k]; else g.lights[k] = true;
    L.emit(g, 'click', T.sw.x, T.sw.y);
    if (L.makeNoise) L.makeNoise(g, p.x, p.y, D().noise, p.floor || 0, p);
    if (!L.hasPower(T.plan)) L.toast(g, 'Clic. Nada: en este edificio no hay luz.', '#8d8672');
    else L.toast(g, g.lights[k] ? 'Prendiste la luz.' : 'Apagaste la luz.', '#e8dcb8');
    return !!g.lights[k];
  };
})(this.Lluvia = this.Lluvia || {});
