// The test menu (F2): shortcuts so the user can try each new thing in seconds instead of looking for it all over
// San Miguel (the user's answer 2 a, 2026-11-25). Groups of actions; each one does something to the game and says
// what it did. The screen (js/view/ui.js) shows them as buttons.
(function (L) {
  'use strict';

  function hour(g, h) {
    var K = L.data.clock, k = L.clockOf(g), total = K.start + g.time / K.hour, want = (k.day - 1) * 24 + h;
    if (want < total) want += 24; // forward, to the next time it is that hour
    g.time = (want - K.start) * K.hour;
  }
  function weather(g, id) {
    var W = L.data.weather.kinds[id];
    g.weather = { id: id, prev: id, left: W.hours[1], blend: 1, rise: 0, flashT: 0, nextFlash: 10 };
  }
  function give(g, list) {
    var got = [];
    list.forEach(function (q) {
      var id = q[0], n = q[1] || 1, left = 0;
      if (id.indexOf('w:') === 0) left = L.giveMelee(g, id.slice(2)) ? 0 : 1;
      else if (id.indexOf('c:') === 0) left = L.wear(g, id.slice(2)) ? 0 : 1;
      else if (id.indexOf('r:') === 0) { var old = L.putOn(g, L.newCloth(id.slice(2))); if (old) L.dropToGround(g, old); }
      else left = L.packAdd(g, id, n);
      if (left && id.indexOf('c:') !== 0) L.dropToGround(g, { id: id, n: left }); // a bag you already wear: nothing to drop
      got.push(id);
    });
    return got.length;
  }
  function go(g, x, y) {
    var p = g.player, fr = L.cityFree(g.city, x, y);
    p.x = fr.x; p.y = fr.y; p.floor = 0; p.z = 0; p.house = null; p.stairOn = null;
    g.enemies.forEach(function (e) { if (Math.hypot(e.x - p.x, e.y - p.y) < 15 * g.city.scale) { e.dead = true; e.gone = true; } });
  }
  // The nearest house with a door you can reach; `two`: with an upstairs.
  function house(g, two) {
    var city = g.city, p = g.player, best = null, bd = Infinity, s = city.scale, R = 400 * s;
    city.map.buildings.forEach(function (b, i) {
      var x = b[0][0] * city.k, y = b[0][1] * city.k, d = Math.hypot(x - p.x, y - p.y);
      if (d > R || d >= bd) return;
      var plan = L.cityHouse(city, i);
      if (!plan || !plan.exitsPx.length || (two && !plan.upper) || L.cityHouseAt(city, p.x, p.y) === plan) return;
      bd = d; best = plan;
    });
    return best;
  }
  function inside(g, plan) {
    var e = plan.exitsPx[0], p = g.player, s = g.city.scale;
    go(g, e.x - e.nx * 1.2 * s, e.y - e.ny * 1.2 * s);
    if (L.cityHouseAt(g.city, p.x, p.y) !== plan) go(g, e.x + e.nx * 1 * s, e.y + e.ny * 1 * s);
  }

  L.debug = {
    groups: [
      { name: 'Moverte', actions: [
        { label: 'Destrabarme', run: function (g) { return L.unstick(g) ? 'Listo, te saqué de la pared.' : 'No encontré un lugar libre cerca.'; } },
        { label: 'Al refugio', run: function (g) { if (!g.refuge) return 'Esta partida no tiene refugio.'; go(g, g.refuge.x, g.refuge.y); return 'Estás en ' + g.refuge.name + '.'; } },
        { label: 'A un sobreviviente', run: function (g) {
          if (!g.refuge || !L.peopleScan) return 'Esta partida no tiene sobrevivientes.';
          L.peopleScan(g, 600);
          var p = g.player, q = (g.people || []).filter(function (x) { return x.house !== null && !x.done; }).sort(function (a, b) { return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y); })[0];
          if (!q) return 'No encontré a nadie cerca.';
          var plan = L.cityHouse(g.city, q.house), e = plan.exitsPx[0];
          go(g, e.x + e.nx * 1.3 * g.city.scale, e.y + e.ny * 1.3 * g.city.scale);
          return 'Estás en la puerta de la casa de ' + q.name + '.';
        } },
        { label: 'A la plaza', run: function (g) { go(g, g.city.start.x, g.city.start.y); return 'Estás en la plaza.'; } },
        { label: 'A una casa cerca', run: function (g) { var h = house(g); if (!h) return 'No hay casas cerca.'; inside(g, h); return 'Estás adentro de una casa.'; } },
        { label: 'A una casa de dos pisos', run: function (g) { var h = house(g, true); if (!h) return 'No hay casas de dos pisos cerca.'; inside(g, h); return 'Estás en una casa con escalera.'; } },
        { label: 'A la barrera negra', run: function (g) {
          var n = L.barrierNear(g.city, g.player.x, g.player.y);
          if (!n) return 'Este mapa no tiene barrera.';
          go(g, n.x + n.nx * 12 * g.city.scale, n.y + n.ny * 12 * g.city.scale); g.barrierAcc = 0; return 'Estás cerca de la barrera.';
        } }
      ] },
      { name: 'Darte cosas', actions: [
        { label: 'Para trabar puertas', run: function (g) { give(g, [['c:mochila'], ['w:martillo'], ['tablas', 6], ['clavos', 20]]); return 'Mochila, martillo, 6 tablas y 20 clavos.'; } },
        { label: 'Comida y agua', run: function (g) { give(g, [['comida', 4], ['agua', 4]]); return '4 comidas y 4 aguas.'; } },
        { label: 'Curarte', run: function (g) { give(g, [['vendas', 4], ['alcohol', 2], ['antibiotico', 1], ['paracetamol', 2]]); return 'Vendas, alcohol, antibiótico y paracetamol.'; } },
        { label: 'Ropa de abrigo', run: function (g) { give(g, [['r:camperon'], ['r:gorro'], ['r:guantesLana'], ['r:mediasLana']]); return 'Te pusiste camperón, gorro, guantes y medias de lana.'; } },
        { label: 'Armas y balas', run: function (g) { give(g, [['w:barra'], ['balas', 60], ['molotov', 2]]); return 'Una barra, 60 balas y 2 molotovs.'; } }
      ] },
      { name: 'Hora', actions: [
        { label: 'Mañana (8 h)', run: function (g) { hour(g, 8); return 'Son las 8.'; } },
        { label: 'Mediodía (13 h)', run: function (g) { hour(g, 13); return 'Son las 13.'; } },
        { label: 'Atardecer (18 h)', run: function (g) { hour(g, 18); return 'Son las 18.'; } },
        { label: 'Noche (23 h)', run: function (g) { hour(g, 23); return 'Son las 23.'; } }
      ] },
      { name: 'Clima', actions: [['despejado', 'Despejado'], ['lluvia', 'Lluvia negra'], ['tormenta', 'Tormenta'], ['niebla', 'Niebla'], ['frio', 'Frío'], ['calor', 'Calor']].map(function (w) {
        return { label: w[1], run: function (g) { weather(g, w[0]); return 'Ahora: ' + w[1].toLowerCase() + '.'; } }; // data/ loads after this file
      }) },
      { name: 'Vos', actions: [
        { label: 'Invencible sí/no', run: function (g) { g.god = !g.god; return g.god ? 'Invencible: no te pasa nada.' : 'Ya no sos invencible.'; } },
        { label: 'Curarme todo', run: function (g) {
          var p = g.player;
          if (L.makeHealth) L.makeHealth(g);
          p.hp = p.stats.maxHp; p.fed = 0; p.watered = 0; p.unease = 0; p.air = L.data.melee.air.max; p.faint = 0;
          if (p.energy !== undefined) p.energy = p.energyMax = L.data.rest.max;
          return 'Vida, heridas, hambre, sed, aire y sueño, todo bien.';
        } },
        { label: 'Volver loco al más cercano', run: function (g) {
          var p = g.player, q = (g.people || []).filter(function (x) { return !x.dead && !x.hostile; }).sort(function (a, b) { return Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y); })[0];
          if (!q) return 'No hay nadie cerca.';
          q.sanity = 5; return q.name + ' perdió la cabeza.';
        } },
        { label: 'Sacar los zombis de cerca', run: function (g) {
          var p = g.player, n = 0;
          g.enemies.forEach(function (e) { if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < 40 * g.city.scale) { e.dead = true; e.gone = true; n++; } });
          return n ? 'Saqué ' + n + (n === 1 ? ' zombi.' : ' zombis.') : 'No había zombis cerca.';
        } },
        { label: 'Ver todo el mapa', run: function (g) {
          var X = g.explored;
          if (!X) return 'No hay mapa.';
          X.grid.fill(1); X.count = X.grid.length; X.all = true;
          return 'El mapa quedó destapado (las casas por dentro no).';
        } }
      ] }
    ],
    // Where you are, to tell Claude when something goes wrong ("me quedé trabado acá").
    where: function (g) {
      var p = g.player, s = g.city ? g.city.scale : 1, k = L.clockOf(g);
      var h = p.floor ? p.house : g.city && L.cityHouseAt ? L.cityHouseAt(g.city, p.x, p.y) : null;
      return 'x ' + (p.x / s).toFixed(1) + ', y ' + (p.y / s).toFixed(1) + ', piso ' + (p.floor || 0) + (h ? ', casa ' + h.index : ', en la calle') +
        ', día ' + k.day + ' ' + k.hh + ':' + (k.mm < 10 ? '0' : '') + k.mm;
    }
  };

  // Every frame: invincible keeps you whole.
  L.updateDebug = function (g) {
    if (!g.god) return;
    var p = g.player;
    p.invuln = Math.max(p.invuln || 0, 0.5); p.hp = p.stats.maxHp;
    if (p.wounds) { p.wounds.length = 0; p.capLost = 0; p.infection = null; } // no wounds, nothing taken off your life (js/health.js)
    p.fed = 0; p.watered = 0; p.unease = 0; p.faint = 0; // hours since you ate and drank (js/needs.js)
  };
})(this.Lluvia = this.Lluvia || {});
