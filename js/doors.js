// Doors (data/doors.js). A door's state lives in its opening's entry in g.barricades (js/barricade.js): door:
// 'open' | 'closed' | 'broken', locked, dhp (what it has left). Without an entry, the door is as the house left it
// (always the same doors), but only in the real game (city._doors, set with the refuge): the other modes and the
// old tests have no doors.
(function (L) {
  'use strict';

  function D() { return L.data.doors; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  L.isDoor = function (o) { return o.kind === 'door' || o.kind === 'inner'; };

  // { closed, locked, broken } of the door in opening `o`, from its entry `b` (or nothing) and `doors` (the real game).
  L.doorStateOf = function (b, o, doors) {
    if (!L.isDoor(o)) return null;
    if (b && b.door === 'broken') return { closed: false, locked: false, broken: true };
    if (b && b.door) return { closed: b.door === 'closed', locked: b.door === 'closed' && !!b.locked, broken: false };
    if (!doors) return { closed: false, locked: false, broken: false };
    var K = o.kind === 'door' ? D().street : D().inner, closed = hash(o.key) < K.closed;
    return { closed: closed, locked: closed && hash(o.key + ':l') < K.locked, broken: false };
  };
  L.doorState = function (g, o) { return L.doorStateOf(g.barricades && g.barricades[o.key], o, g.city && g.city._doors); };
  function set(g, o, door, locked) {
    var b = g.barricades[o.key] || (g.barricades[o.key] = { planks: 0, hp: 0, furn: -1, fhp: 0, broken: false, glass: L.data.barricade.glassHp });
    b.door = door; b.locked = !!locked;
    if (b.dhp === undefined) b.dhp = D().hp;
  }
  L.setDoor = function (g, o, door, locked) { set(g, o, door, locked); L.forgetHouse(g, o.plan.index); };

  function tool(g) {
    var p = g.player, h = p.hands || {}, have = function (id) { return L.packCount(g, 'w:' + id) > 0 || (h.r && h.r.id === 'w:' + id) || (h.l && h.l.id === 'w:' + id); };
    for (var i = 0; i < D().tools.length; i++) if (have(D().tools[i])) return D().tools[i];
    return null;
  }
  L.doorTool = tool;

  // What a door lets you do now (js/barricade.js puts it in the target): tapE / tapX (a press) and holdX (forcing):
  // each { act, label }; need: what is missing to force it.
  L.doorActions = function (g, o, inside) {
    var st = L.doorState(g, o), b = g.barricades[o.key] || {};
    if (!st || st.broken || b.planks > 0 || b.furn >= 0) return {};
    var A = {};
    if (!st.closed) A.tapE = { act: 'close', label: 'cerrar la puerta' };
    else if (!st.locked) { A.tapE = { act: 'open', label: 'abrir la puerta' }; if (inside) A.tapX = { act: 'lock', label: 'trabarla con llave' }; }
    else if (inside) { A.tapE = { act: 'locked', label: 'está trabada' }; A.tapX = { act: 'unlock', label: 'destrabarla' }; }
    else {
      A.tapE = { act: 'locked', label: 'está cerrada con llave' };
      if (tool(g)) A.holdX = { act: 'force', label: 'forzarla (' + L.meleeDef(tool(g)).name.toLowerCase() + ')' };
      else A.need = 'Cerrada con llave: forzala con una barra o un destornillador, o rompela a golpes';
    }
    return A;
  };
  L.doDoor = function (g, o, act) {
    var p = g.player;
    if (act === 'close') { L.setDoor(g, o, 'closed', false); L.emit(g, 'door', o.x, o.y); }
    else if (act === 'open') { L.setDoor(g, o, 'open', false); L.emit(g, 'door', o.x, o.y); if (!L.cityFits(g.city, p.x, p.y, Math.min(p.r, L.data.city.body)) && L.unstick) L.unstick(g); }
    else if (act === 'lock') { L.setDoor(g, o, 'closed', true); L.toast(g, 'Trabaste la puerta.', '#c9a46a'); }
    else if (act === 'unlock') { L.setDoor(g, o, 'closed', false); L.toast(g, 'Destrabaste la puerta.', '#c9a46a'); }
    else if (act === 'locked') { L.toast(g, 'Está cerrada con llave.', '#8d8672'); L.emit(g, 'bang', o.x, o.y); }
    else if (act === 'force') {
      L.setDoor(g, o, 'open', false);
      L.toast(g, 'Forzaste la cerradura.', '#c9a46a'); L.emit(g, 'break', o.x, o.y);
      if (L.makeNoise) L.makeNoise(g, o.x, o.y, D().noise, 0, p);
    }
  };

  // A blow on a closed door (yours or a zombie's): it breaks at 0. True if it broke.
  L.hitDoor = function (g, o, dmg, who) {
    var st = L.doorState(g, o);
    if (!st || !st.closed) return false;
    var b = g.barricades[o.key];
    if (!b || !b.door) { set(g, o, 'closed', st.locked); b = g.barricades[o.key]; }
    if (b.dhp === undefined) b.dhp = D().hp;
    b.dhp -= dmg;
    if (b.dhp > 0) return false;
    b.door = 'broken'; b.locked = false;
    L.emit(g, 'break', o.x, o.y);
    if (L.makeNoise) L.makeNoise(g, o.x, o.y, D().breakNoise, 0, who || g.player);
    if (!who) L.toast(g, 'Rompiste la puerta.', '#c9a46a');
    L.forgetHouse(g, o.plan.index);
    return true;
  };

  // The closed door in front of you within `reach` meters, for a blow: the opening or null.
  L.doorInFront = function (g, reach) {
    var p = g.player, city = g.city;
    if (!city || !city.map || (p.floor || 0) !== 0 || !g.barricades) return null;
    var aim = p.aim || 0, x = p.x + Math.cos(aim) * reach * 0.6 * city.scale, y = p.y + Math.sin(aim) * reach * 0.6 * city.scale, best = null, bd = reach * city.scale + p.r;
    var far = reach * city.scale + p.r + 0.6 * city.scale; // just past the door, to find the house it belongs to
    [L.cityHouseAt(city, p.x, p.y), L.cityHouseAt(city, x, y), L.cityHouseAt(city, p.x + Math.cos(aim) * far, p.y + Math.sin(aim) * far)].forEach(function (plan) {
      if (!plan) return;
      L.planOpenings(plan).forEach(function (o) {
        var st = L.doorState(g, o);
        if (!st || !st.closed) return;
        var d = Math.hypot(o.x - x, o.y - y);
        if (d < bd) { bd = d; best = o; }
      });
    });
    return best;
  };
})(this.Lluvia = this.Lluvia || {});
