// The refuge (data/refuge.js, stage 68): the game starts inside the Catedral de San Miguel with its windows nailed
// shut and its door open (you go out and come back through it). Zombies never appear inside it. If you are knocked
// out with no bed of your own you wake up there. g.refuge: { name, house (building number), x, y };
// g.rep: how much each refuge trusts you, { catedral: 0..100 }.
(function (L) {
  'use strict';

  function D() { return L.data.refuge; }

  // The refuge's plan, or null.
  L.refugePlan = function (g) { return g.refuge && g.city ? L.cityHouse(g.city, g.refuge.house) : null; };
  L.inRefuge = function (g, x, y) { var plan = L.refugePlan(g); return !!plan && L.cityHouseAt(g.city, x, y) === plan; };

  // Puts you inside the refuge, nails its windows and gives you the kit. False if the map has no such building.
  L.makeRefuge = function (g) {
    var city = g.city, H = D().home, s = city.scale;
    var place = (city.map.places || []).find(function (q) { return q[0] === H.building && q[4] >= 0; });
    var plan = place && L.cityHouse(city, place[4]);
    if (!plan || !plan.exitsPx.length) return false;
    // A spot inside, a few meters in from the door.
    var e = plan.exitsPx[0], at = null;
    for (var m = 4; m >= 1 && !at; m--) {
      var fr = L.cityFree(city, e.x - e.nx * m * s, e.y - e.ny * m * s);
      if (L.cityHouseAt(city, fr.x, fr.y) === plan) at = fr;
    }
    if (!at) return false;
    g.refuge = { id: 'catedral', name: H.name, house: plan.index, x: at.x, y: at.y };
    g.rep = g.rep || {}; g.rep.catedral = D().rep.start;
    // The windows, nailed shut (the door stays open: it is your way out).
    var B = L.data.barricade;
    if (g.barricades && L.planOpenings) {
      L.planOpenings(plan).forEach(function (o) {
        if (o.kind !== 'window') return;
        g.barricades[o.key] = { planks: B.planks.window, hp: B.planks.window * B.plankHp, furn: -1, fhp: 0, broken: false, glass: B.glassHp };
      });
      L.useBarricades(g);
    }
    var p = g.player;
    p.x = at.x; p.y = at.y; p.floor = 0; p.z = 0; p.house = null;
    D().kit.forEach(function (q) {
      var id = q[0], left = id.indexOf('w:') === 0 ? (L.giveMelee(g, id.slice(2)) ? 0 : 1) : id.indexOf('c:') === 0 ? (L.wear(g, id.slice(2)) ? 0 : 1) : L.packAdd(g, id, q[1] || 1);
      if (left && id.indexOf('c:') === 0) return;
      if (left) L.dropToGround(g, { id: q[0], n: left });
    });
    g.repDay = 1;
    D().intro.forEach(function (t) { L.toast(g, t, '#d9cfa6'); });
    return true;
  };

  // How they see you there, in words.
  L.repWord = function (v) {
    var lv = D().levels;
    for (var i = 0; i < lv.length; i++) if (v >= lv[i][0]) return lv[i][1];
    return lv[lv.length - 1][1];
  };
  L.repChange = function (g, id, dv, why) {
    if (!g.rep || g.rep[id] === undefined || !dv) return;
    var before = L.repWord(g.rep[id]);
    g.rep[id] = Math.max(0, Math.min(100, g.rep[id] + dv));
    var now = L.repWord(g.rep[id]);
    if (why) L.toast(g, why + (now !== before ? ' En ' + g.refuge.name + ' ahora ' + now + '.' : ''), dv < 0 ? '#c26a4a' : '#9fc3a0');
  };

  // Knocked out (js/death.js calls this where you fell, before waking up): the refuge trusts you less, and more if
  // it happened near it, where they saw you.
  L.repKnocked = function (g, x, y) {
    if (!g.refuge || !g.rep) return;
    g.repKnockedDay = L.clockOf(g).day;
    var R = D().rep, s = g.city.scale, near = Math.hypot(x - g.refuge.x, y - g.refuge.y) < R.seenRange * s;
    L.repChange(g, 'catedral', -(R.knocked + (near ? R.seen : 0)), near ? 'Te vieron caer cerca del refugio.' : 'Se enteraron de que te noquearon.');
  };

  // Every new day without being knocked out, a little trust comes back.
  L.updateRefuge = function (g) {
    if (!g.refuge || !g.rep) return;
    var day = L.clockOf(g).day;
    if (day <= (g.repDay || 1)) return;
    var clean = (g.repKnockedDay || 0) < day - 1;
    g.repDay = day;
    if (clean && g.rep.catedral < 100) L.repChange(g, 'catedral', D().rep.heal, 'Un día más sin caer: en ' + g.refuge.name + ' te ven mejor.');
  };
})(this.Lluvia = this.Lluvia || {});
