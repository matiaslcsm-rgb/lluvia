// How a game moves on (data/story.js, stage 74). g.story: { fired: { id: true }, goals: [text], clues: [index],
// known: { refuge id: { house, x, y } }, horde: day of the horde night or 0 }. The other refuges' trust lives in
// g.rep next to the Catedral's; their leaders are people (js/people.js) with mode 'leader'.
(function (L) {
  'use strict';

  function D() { return L.data.story; }
  function S(g) { return g.story || (g.story = { fired: {}, goals: [], clues: [], known: {}, horde: 0 }); }

  // The building of a refuge: by its name on the map, else the nearest place of its kinds to the Catedral.
  function findRefuge(g, R) {
    var city = g.city, places = city.map.places || [], best = null, bd = Infinity;
    places.forEach(function (q) {
      if (q[4] < 0) return;
      var named = q[0] === R.building, kind = R.kinds.indexOf(q[1]) >= 0;
      if (!named && !kind) return;
      var x = q[2] * city.k, y = q[3] * city.k, d = named ? -1 : Math.hypot(x - g.refuge.x, y - g.refuge.y);
      if (d < bd && q[4] !== g.refuge.house) { bd = d; best = q; }
    });
    if (!best) return null;
    var plan = L.cityHouse(city, best[4]);
    if (!plan || !plan.exitsPx.length) return null;
    var e = plan.exitsPx[0], s = city.scale;
    for (var m = 3; m >= 1; m--) { var fr = L.cityFree(city, e.x - e.nx * m * s, e.y - e.ny * m * s); if (L.cityHouseAt(city, fr.x, fr.y) === plan) return { plan: plan, x: fr.x, y: fr.y }; }
    return null;
  }

  // A refuge shows up on your map, with its leader inside and its doors open.
  L.revealRefuge = function (g, id) {
    var st = S(g), R = D().refuges[id];
    if (!R || st.known[id] || !g.refuge) return false;
    var at = findRefuge(g, R);
    if (!at) return false;
    st.known[id] = { house: at.plan.index, x: at.x, y: at.y, name: R.name };
    g.rep = g.rep || {}; if (g.rep[id] === undefined) g.rep[id] = R.start;
    if (g.barricades && L.planOpenings) L.planOpenings(at.plan).forEach(function (o) { if (L.isDoor && L.isDoor(o)) L.setDoor(g, o, 'open', false); });
    g.people = g.people || [];
    g.peopleN = (g.peopleN || 0) + 1;
    g.people.push({ id: g.peopleN, name: R.leader, coat: '#3f5560', x: at.x, y: at.y, floor: 0, house: at.plan.index, door: null, street: false,
      want: R.want, give: R.give, done: false, line: 0, dirX: 1, dirY: 0, still: 1, r: g.player.r, hp: 40, trust: 50, ties: {}, sanity: 85,
      mode: 'leader', refuge: id });
    return true;
  };
  L.refugeName = function (g, id) { return id === 'catedral' ? (g.refuge && g.refuge.name) : (D().refuges[id] || {}).name; };

  // A clue, when you search a piece (js/loot.js calls it once per piece): sometimes one you haven't found.
  L.rollClue = function (g) {
    if (!g.refuge) return null;
    var st = S(g), C = D().clues;
    if (st.clues.length >= C.list.length || g.rng() >= C.chance) return null;
    var left = C.list.map(function (t, i) { return i; }).filter(function (i) { return st.clues.indexOf(i) < 0; });
    var i = left[Math.floor(g.rng() * left.length)];
    st.clues.push(i);
    L.toast(g, C.list[i], '#c9b88a');
    L.toast(g, 'Lo anotaste en el diario (J).', '#8d8672');
    return i;
  };

  function fire(g, T) {
    var st = S(g), then = T.then;
    st.fired[T.id] = true;
    if (then.reveal) L.revealRefuge(g, then.reveal);
    if (then.horde) st.horde = L.clockOf(g).day;
    if (then.goal) st.goals.unshift(then.goal);
    if (then.text) L.toast(g, then.text, '#e8c66a');
  }
  // Each frame: the triggers whose time came.
  L.updateStory = function (g) {
    if (!g.refuge) return;
    var st = S(g), k = L.clockOf(g), p = g.player;
    D().triggers.forEach(function (T) {
      if (st.fired[T.id]) return;
      var w = T.when, ok = false;
      if (w.day !== undefined) ok = k.day >= w.day;
      else if (w.night !== undefined) ok = k.day > w.night && k.light > 0.5; // the morning after
      else if (w.clues !== undefined) ok = st.clues.length >= w.clues;
      else if (w.visit) { var kn = st.known[w.visit]; ok = !!kn && L.cityHouseAt(g.city, p.x, p.y) === L.cityHouse(g.city, kn.house); }
      else if (w.repBelow !== undefined) ok = g.rep && g.rep.catedral < w.repBelow;
      if (ok) fire(g, T);
    });
  };
  // The horde night: more zombies (js/game.js multiplies the spawning by this).
  L.storyMul = function (g) {
    var st = g.story;
    if (!st || !st.horde) return 1;
    var k = L.clockOf(g);
    return (k.day === st.horde && k.light < 0.5) || (k.day === st.horde + 1 && k.hh < 6) ? D().hordeMul : 1;
  };

  // The journal (J): goals, refuges and clues, as lines.
  L.journal = function (g) {
    var st = S(g), out = { goals: st.goals.slice(0, 4), refuges: [], clues: st.clues.map(function (i) { return D().clues.list[i]; }) };
    if (g.refuge) out.refuges.push({ name: g.refuge.name, word: L.repWord(g.rep.catedral) });
    Object.keys(st.known).forEach(function (id) { out.refuges.push({ name: st.known[id].name, word: L.repWord(g.rep[id]) }); });
    return out;
  };
})(this.Lluvia = this.Lluvia || {});
