// Menus over the canvas: title and character select, the story, how to play, level-up choice, pause, result.
(function (L) {
  'use strict';
  var overlay = document.getElementById('overlay');
  var flashEl = null, flashTimer = 0;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function card(key, item, onClick, extra) {
    var b = el('button', 'card');
    var dot = el('div', 'dot'); dot.style.background = item.color;
    b.appendChild(dot);
    if (key) b.appendChild(el('div', 'key', 'Tecla ' + key));
    if (item.tag) b.appendChild(el('div', 'tag', item.tag));
    b.appendChild(el('div', 'name', item.name));
    b.appendChild(el('div', 'desc', item.desc));
    if (extra) b.appendChild(el('div', 'bio', extra));
    b.addEventListener('click', function () { L.sound.play('click'); onClick(); });
    return b;
  }

  function button(text, onClick, cls) {
    var b = el('button', cls || 'btn', text);
    b.addEventListener('click', function () { L.sound.play('click'); onClick(); });
    return b;
  }

  function show(nodes) {
    overlay.innerHTML = '';
    nodes.forEach(function (n) { overlay.appendChild(n); });
    overlay.classList.remove('hidden');
  }

  function lockText(u) {
    var a = L.findById(L.data.meta.achievements, u.achievement);
    return 'Se abre con el logro «' + a.name + '» (' + a.desc.toLowerCase().replace(/\.$/, '') + ')' + (u.cost ? ' o por ' + u.cost + ' ☀ en el Cuaderno.' : '.');
  }

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  L.ui = {
    current: null,

    hide: function () { var cm = document.querySelector('.ctxmenu'); if (cm) cm.remove(); overlay.classList.add('hidden'); overlay.classList.remove('sunny'); overlay.innerHTML = ''; L.ui.current = null; },

    // A short message in the corner (sound on/off and the like).
    flash: function (text) {
      if (!flashEl) { flashEl = el('div', 'flash'); document.body.appendChild(flashEl); }
      flashEl.textContent = text;
      flashEl.style.opacity = '1';
      clearTimeout(flashTimer);
      flashTimer = setTimeout(function () { flashEl.style.opacity = '0'; }, 1600);
    },

    // The start screen of San Miguel (the old character select of the rain game is gone from the menu).
    title: function (onStart, onContinue) {
      show([el('h1', null, 'SOL LOCO'),
        el('p', 'tagline', 'San Miguel. La tormenta de lluvia negra se fue, pero ya no hay estrellas, una barrera negra rodea la ciudad y de ella salen ellos.'),
        onContinue ? button('Continuar', onContinue) : null,
        button(onContinue ? 'Empezar de nuevo' : 'Empezar', onStart),
        onContinue ? el('p', 'hint', 'La partida se guarda cuando te acostás en una cama. Empezar de nuevo la borra la próxima vez que dormís en una.') : null,
        el('p', 'hint', 'WASD: moverte · Shift: correr · Mouse: disparar · clic derecho: apuntar · R: recargar · 1: pistola · 2: arma de mano'),
        el('p', 'hint', 'A mano: cada botón una mano; los dos juntos, empujar · Espacio: cubrirte'),
        el('p', 'hint', 'E: revisar muebles o juntar · H: venda · Z: dormir · K: estado · F: linterna · Tab: fabricar · G: molotov'),
        el('p', 'hint', 'M: mapa · P: pausa · O: sonido · F2: menú de pruebas · Enter: ' + (onContinue ? 'continuar' : 'empezar'))].filter(Boolean));
      L.ui.current = 'title';
    },

    characterSelect: function (onPick) {
      var cards = el('div', 'cards');
      L.data.characters.forEach(function (c, i) {
        if (L.isUnlocked(L.profile, c.id)) {
          var mr = L.masteryRank(L.profile, c.id), stars = mr.index ? new Array(mr.index + 1).join('★') + ' ' : '';
          var shown = Object.create(c);
          shown.tag = stars + mr.rank.name + (mr.next ? ' · ' + mr.points + '/' + mr.next.at : '');
          var cb = card(String(i + 1), shown, function () { onPick(c.id); }, L.data.lore.bios[c.id]);
          if (mr.rank.color) cb.style.borderColor = mr.rank.color;
          cards.appendChild(cb);
          return;
        }
        var b = card(null, { color: '#3a3d4a', name: '🔒 ' + c.name, desc: lockText(L.unlockFor(c.id)) }, function () { L.ui.notebook(onPick); });
        b.classList.add('locked');
        cards.appendChild(b);
      });
      var row = el('div', 'row');
      if (L.isUnlocked(L.profile, 'tormenta')) {
        var mode = button(L.ui.storm ? 'Modo: Tormenta eterna ⚡' : 'Modo: Normal', function () { L.ui.storm = !L.ui.storm; L.ui.characterSelect(onPick); }, L.ui.storm ? 'btn storm' : 'btn ghost');
        row.appendChild(mode);
      }
      var on = (L.ui.pacts || []).length;
      row.appendChild(button('Pactos' + (on ? ' (' + on + ')' : ''), function () { L.ui.pactsScreen(onPick); }, on ? 'btn storm' : 'btn ghost'));
      row.appendChild(button('Cuaderno (' + L.profile.coins + ' ☀)', function () { L.ui.notebook(onPick); }, 'btn'));
      row.appendChild(button('Partida del día', function () { L.ui.daily(onPick); }, 'btn'));
      row.appendChild(button('La historia', function () { L.ui.story(onPick); }, 'btn ghost'));
      row.appendChild(button('Cómo se juega', function () { L.ui.howTo(onPick); }, 'btn ghost'));
      row.appendChild(button('Volver a ver los consejos', function () { L.tips.reset(); L.ui.flash('Los consejos van a aparecer de nuevo'); }, 'btn ghost'));
      show([el('h1', null, 'LLUVIA'), el('p', 'tagline', L.data.lore.tagline), el('p', null, 'Elegí tu Paraguas'), cards, row,
        el('p', 'hint', 'WASD o flechas para moverte · Espacio: ulti hacia el mouse · R: mandar Anegados · Q / E: apostar · P: pausa · M: sonido'),
        el('p', 'hint', 'Con joystick: palanca para moverte · A: ulti · Y: mandar Anegados · LB / RB: apostar · Start: pausa'),
        el('p', 'hint', 'En pantalla táctil: arrastrá un dedo para moverte · tocá con otro para la ulti · tocá un lado del panel para apostar')]);
      L.ui.current = 'select';
    },

    // The Cuaderno del Paraguas: spend Sun coins on permanent upgrades, see your achievements and records.
    notebook: function (onPick) {
      var P = L.profile, M = L.data.meta;
      var shop = el('div', 'shop');
      M.upgrades.forEach(function (def) {
        var lvl = L.upgradeLevel(P, def.id), maxed = lvl >= def.max, cost = L.upgradeCost(P, def);
        var row = el('div', 'shoprow');
        var info = el('div', null);
        info.appendChild(el('b', null, def.name + '  ' + lvl + '/' + def.max));
        info.appendChild(el('div', 'desc', def.desc));
        row.appendChild(info);
        var b = button(maxed ? 'Completo' : cost + ' ☀', function () {
          if (L.buyUpgrade(P, def.id)) { L.saveProfile(); L.sound.play('chest'); L.ui.notebook(onPick); }
        }, 'btn small');
        if (maxed || P.coins < cost) b.disabled = true;
        row.appendChild(b);
        shop.appendChild(row);
      });
      var opens = el('div', 'shop');
      M.unlocks.forEach(function (u) {
        var open = L.isUnlocked(P, u.id), c = u.kind === 'char' ? L.findById(L.data.characters, u.id) : null;
        var row = el('div', 'shoprow'), info = el('div', null);
        var pact = u.kind === 'pact' ? L.findById(M.pacts, u.id) : null;
        info.appendChild(el('b', null, (open ? '✓ ' : '🔒 ') + (c ? c.name + ' (Paraguas)' : pact ? u.name + ' (Pacto)' : u.name + ' (modo difícil)')));
        info.appendChild(el('div', 'desc', open ? (c ? c.desc : pact ? pact.desc : 'Horda más dura y rivales más hábiles. Monedas dobles.') : lockText(u)));
        row.appendChild(info);
        if (!open && u.cost) {
          var b = button(u.cost + ' ☀', function () { if (L.buyUnlock(P, u.id)) { L.saveProfile(); L.sound.play('chest'); L.ui.notebook(onPick); } }, 'btn small');
          if (P.coins < u.cost) b.disabled = true;
          row.appendChild(b);
        }
        opens.appendChild(row);
      });
      var ach = el('div', 'achs');
      M.achievements.forEach(function (a) {
        var got = !!P.achievements[a.id], it = el('div', 'ach' + (got ? ' got' : ''));
        it.appendChild(el('b', null, (got ? '✓ ' : '') + a.name + ' · ' + a.coins + ' ☀'));
        it.appendChild(el('div', 'desc', a.desc));
        ach.appendChild(it);
      });
      var s = P.stats;
      var rec = el('p', 'hint', 'Partidas: ' + s.matches + ' · Ganadas: ' + s.wins + ' · Mejor puesto: ' + (s.bestPlace > 8 ? '—' : s.bestPlace + '.º') + ' · Bajas en total: ' + s.kills);
      show([el('h2', null, 'Cuaderno del Paraguas'), el('p', 'tagline', 'Tenés ' + P.coins + ' Monedas del Sol. Las mejoras son para siempre y solo para vos.'),
        el('h3', null, 'Mejoras'), shop, el('h3', null, 'Desbloqueos'), opens, el('h3', null, 'Logros'), ach, rec, button('Volver', function () { L.ui.characterSelect(onPick); })]);
      L.ui.current = 'notebook';
    },

    // Pactos del Cielo: twists for the next match. Each one turned on pays more coins.
    pactsScreen: function (onPick) {
      var M = L.data.meta, list = el('div', 'shop');
      L.ui.pacts = (L.ui.pacts || []).filter(function (id) { return L.isUnlocked(L.profile, id); });
      M.pacts.forEach(function (p) {
        var open = L.isUnlocked(L.profile, p.id), on = L.ui.pacts.indexOf(p.id) !== -1;
        var row = el('div', 'shoprow'), info = el('div', null);
        info.appendChild(el('b', null, (open ? '' : '🔒 ') + p.name));
        info.appendChild(el('div', 'desc', open ? p.desc : lockText(L.unlockFor(p.id))));
        row.appendChild(info);
        var b = button(on ? 'Activado' : 'Activar', function () {
          if (on) L.ui.pacts.splice(L.ui.pacts.indexOf(p.id), 1); else L.ui.pacts.push(p.id);
          L.ui.pactsScreen(onPick);
        }, on ? 'btn small storm' : 'btn small');
        if (!open) b.disabled = true;
        row.appendChild(b);
        list.appendChild(row);
      });
      show([el('h2', null, 'Pactos del Cielo'), el('p', 'tagline', 'Torcé las reglas de la próxima partida. Cada pacto activo da +' + Math.round(M.pactCoinBonus * 100) + '% de Monedas del Sol. No valen en la Partida del día.'),
        list, button('Volver', function () { L.ui.characterSelect(onPick); })]);
      L.ui.current = 'pacts';
    },

    // Daily match: same seed for everyone today. Pick your Paraguas; your best result today is kept.
    daily: function (onPick) {
      var best = (L.profile.daily || {})[L.dailyKey(new Date())];
      var cards = el('div', 'cards');
      L.data.characters.forEach(function (c, i) {
        cards.appendChild(card(String(i + 1), c, function () { onPick(c.id, true); }));
      });
      show([el('h2', null, 'Partida del día'), el('p', 'tagline', 'Hoy todos juegan la misma partida: los mismos rivales y la misma horda.'),
        el('p', null, best ? 'Tu mejor resultado de hoy: ' + best.place + '.º con ' + best.kills + ' bajas' : 'Todavía no la jugaste hoy.'),
        cards, button('Volver', function () { L.ui.characterSelect(onPick); }, 'btn ghost')]);
      L.ui.current = 'daily';
    },

    story: function (onPick) {
      var box = el('div', 'text');
      L.data.lore.intro.forEach(function (par) { box.appendChild(el('p', null, par)); });
      box.appendChild(el('p', 'muted', L.data.lore.rivals));
      show([el('h2', null, 'Aguaverde, bajo el Diluvio'), box, button('Volver', function () { L.ui.characterSelect(onPick); })]);
      L.ui.current = 'story';
    },

    howTo: function (onPick) {
      var box = el('div', 'text');
      [
        ['Tu barrio', 'Cada Paraguas defiende su barrio de la horda. Tus ataques salen solos: vos te movés, esquivás y juntás los cristales de experiencia.'],
        ['Crecer', 'Al subir de nivel elegís una mejora: habilidades nuevas, subir las que tenés o pasivas. Con una habilidad al nivel 5 y su ítem justo aparece una fusión.'],
        ['Oro y cofres', 'Los Anegados dejan oro. Con oro abrís los cofres del barrio: cada ítem se apila sin tope y algunos encadenan efectos.'],
        ['El reloj', 'Cada minuto la horda se endurece y hay un evento de tormenta. Desde el minuto 10 aprieta mucho más: hay que crecer más rápido que el reloj.'],
        ['Mandar Anegados', 'Con la R (o Y en el joystick) pagás oro y le mandás una tanda de criaturas con una élite al que va primero. Sirve para frenar al que se escapa; los rivales también lo hacen.'],
        ['El Juicio', 'Cada 2 minutos el Trueno elige a dos Paraguas para un duelo bajo una Ley del Cielo. El que pierde, pierde una vida. Los demás apuestan con Q y E.'],
        ['Ganar', 'Tenés 3 vidas. Las perdés cayendo en la horda o perdiendo un Juicio. Cuando quedan dos, pelean hasta el final. El último en pie gana el Sol.']
      ].forEach(function (r) { box.appendChild(el('h3', null, r[0])); box.appendChild(el('p', null, r[1])); });
      show([el('h2', null, 'Cómo se juega'), box, button('Volver', function () { L.ui.characterSelect(onPick); })]);
      L.ui.current = 'howto';
    },

    choice: function (options, onPick, g) {
      var cards = el('div', 'cards');
      options.forEach(function (o, i) { cards.appendChild(card(String(i + 1), o, function () { onPick(i); })); });
      var shop = options[0] && options[0].shop;
      var nodes = shop ? [el('h2', null, 'El Mercader errante'), el('p', 'tagline', 'Elegí uno. Tenés ' + Math.floor(g ? g.gold : 0) + ' de oro.'), cards]
        : [el('h2', null, '¡Subiste de nivel!'), cards];
      if (options.some(function (o) { return o.type === 'fusion'; })) nodes.splice(1, 0, el('p', 'tagline', '¡Hay una fusión disponible! Convierte tu habilidad en una versión mucho más fuerte.'));
      show(nodes);
      L.ui.current = 'choice';
    },

    // Your inventory (js/loot.js): your two hands, your pockets and each bag, with what is in every slot. A click
    // does the first thing it can (drink the water, take a weapon to your hand); the right click opens the menu of
    // everything it can do (docs/CUERPO.md section 3: "si es agua: Tomar, Equipar o Tirar").
    inventory: function (g, onClose) {
      var p = g.player, Dl = L.data.loot, wrap = el('div', 'inv'), h = p.hands || {};
      var again = function () { L.ui.inventory(g, onClose); };
      var row = function (box, ref, sl, acts) {
        var r = el('div', 'invrow');
        acts = acts || L.slotActions(g, ref);
        var use = button(L.slotName(sl), function () { if (acts[0] && acts[0].run()) again(); }, 'btn slot');
        use.title = 'Clic: ' + (acts[0] ? acts[0].label.toLowerCase() : '—') + ' · Clic derecho: más opciones';
        use.addEventListener('contextmenu', function (ev) { ev.preventDefault(); menu(ev, acts); });
        r.appendChild(use);
        box.appendChild(r);
      };
      var menu = function (ev, acts) {
        var old = document.querySelector('.ctxmenu'); if (old) old.remove();
        var m = el('div', 'ctxmenu');
        acts.forEach(function (a) { m.appendChild(button(a.label, function () { m.remove(); a.run(); again(); }, 'btn ghost small')); });
        m.appendChild(button('Cancelar', function () { m.remove(); }, 'btn ghost small'));
        m.style.left = Math.min(ev.clientX, window.innerWidth - 180) + 'px'; m.style.top = Math.min(ev.clientY, window.innerHeight - 40 * (acts.length + 1)) + 'px';
        document.body.appendChild(m);
      };
      // Your hands.
      var hb = el('div', 'invbox');
      hb.appendChild(el('div', 'invtitle', 'Manos' + (p.hand === 'gun' ? ' · con la pistola (lo demás espera)' : '')));
      if (h.l && h.l === h.r) { hb.appendChild(el('div', 'invline', 'Las dos manos:')); row(hb, { hand: 'r' }, h.r); }
      else ['r', 'l'].forEach(function (s) {
        hb.appendChild(el('div', 'invline', s === 'r' ? 'Derecha (clic izq.):' : 'Izquierda (clic der.):'));
        if (h[s]) row(hb, { hand: s }, h[s]); else hb.appendChild(el('div', 'invempty', 'Puño'));
      });
      if (p.gun) hb.appendChild(el('div', 'invline', p.gun.def.name + ' · ' + p.gun.ammo + ' en el cargador'));
      wrap.appendChild(hb);
      // What you wear (js/clothes.js).
      if (p.clothes) {
        var CD = L.data.clothes, cb = el('div', 'invbox'), tmp = L.bodyTemp(g);
        cb.appendChild(el('div', 'invtitle', 'Ropa · abriga ' + L.warmth(g).toFixed(1) + ' de ' + L.warmNeed(g).toFixed(1) + ' que hace falta'));
        CD.slots.forEach(function (s) {
          cb.appendChild(el('div', 'invline', CD.slotNames[s] + ':'));
          if (p.clothes[s]) row(cb, null, p.clothes[s], L.clothActions(g, s)); else cb.appendChild(el('div', 'invempty', '—'));
        });
        if (L.warmText[tmp.state]) cb.appendChild(el('div', 'invline', L.warmText[tmp.state]));
        wrap.appendChild(cb);
      }
      // Pockets and bags.
      var st = L.suppliesTime(g);
      g.pack.places.forEach(function (pl) {
        var spec = Dl.containers[pl.id], box = el('div', 'invbox');
        box.appendChild(el('div', 'invtitle', spec.name + ' · ' + pl.slots.length + '/' + spec.slots + (spec.big ? '' : ' · solo cosas chicas')));
        if (spec.supplies && pl === g.pack.places.filter(function (q) { return Dl.containers[q.id].supplies; })[0])
          box.appendChild(el('div', 'invline', 'Agua para ' + st.agua + ' h · comida para ' + st.comida + ' h'));
        pl.slots.forEach(function (sl, i) { row(box, { pl: pl, i: i }, sl); });
        for (var k = pl.slots.length; k < spec.slots; k++) box.appendChild(el('div', 'invempty', '—'));
        wrap.appendChild(box);
      });
      var kg = L.packWeight(g), cap = Dl.carry.cap;
      var cm0 = document.querySelector('.ctxmenu'); if (cm0) cm0.remove();
      show([el('h2', null, 'Inventario'), el('p', kg > cap ? 'warn' : null, 'Peso: ' + kg.toFixed(1) + ' de ' + cap + ' kg' + (kg > cap ? ' · vas pesado: caminás más lento y te cansás más' : '')),
        wrap, button('Cerrar (I)', onClose, 'btn ghost'),
        el('p', 'hint', 'Clic: lo primero que se puede hacer · Clic derecho: todas las opciones (tomar, llevar en la mano, tirar...) · Lo que tirás queda en el piso y se junta con E · La comida y el agua van en una mochila o bolso · La ropa: clic derecho, Ponerte; la que encontrás y no te ponés queda en el piso')]);
      L.ui.current = 'inventory';
    },

    // Talking to a survivor (js/people.js): what they say, and giving them what they asked for.
    talk: function (g, onClose) {
      var q = g.talking;
      if (!q) return;
      var again = function () { L.ui.talk(g, onClose); }, nodes = [el('h2', null, q.name), el('p', 'talkline', '«' + L.personText(g, q) + '»')];
      var row = el('div', 'talkbtns');
      if (!q.done && !q.say && q.mode !== 'follow' && q.mode !== 'wait' && !L.refuses(q)) {
        var can = L.canGive(g, q);
        var give = button(can ? 'Darle ' + L.lootText([q.want]) : 'No tenés ' + L.lootText([q.want]), function () { if (L.giveTo(g, q)) again(); }, can ? 'btn' : 'btn ghost');
        give.disabled = !can;
        row.appendChild(give);
      }
      L.personActions(g, q).forEach(function (a) { row.appendChild(button(a.label, function () { a.run(); again(); }, 'btn')); });
      row.appendChild(button('Chau (E)', onClose, 'btn ghost'));
      nodes.push(row);
      nodes.push(el('p', 'hint', q.name + ' ' + L.trustWord(q) + (L.isOdd && L.isOdd(q) ? ', y está rara/o: habla sola/o (se calmaría con ' + L.lootText([L.data.madness.calm.item]) + ')' : '') + '.' + (g.refuge && g.rep ? ' En ' + g.refuge.name + ' ' + L.repWord(g.rep.catedral) + '. Lo que hacés se sabe.' : '')));
      show(nodes);
      L.ui.current = 'talk';
    },

    // A piece of furniture you searched (js/loot.js; the user: "como Project Zomboid"): on the left what it holds,
    // on the right what you carry. A click on its things takes them; a click on yours leaves them in the piece.
    piece: function (g, onClose) {
      var o = g.openPiece, p = g.player, Dl = L.data.loot, wrap = el('div', 'inv'), h = p.hands || {};
      if (!o) return;
      var again = function () { L.ui.piece(g, onClose); };
      var pb = el('div', 'invbox piecebox');
      pb.appendChild(el('div', 'invtitle', o.name + (o.slots.length ? ' · ' + o.slots.length + (o.slots.length === 1 ? ' cosa' : ' cosas') : '')));
      if (!o.slots.length) pb.appendChild(el('div', 'invempty', 'No hay nada.'));
      o.slots.forEach(function (sl, i) {
        var b = button(L.pieceSlotName(sl), function () { L.takeFromPiece(g, i); again(); }, 'btn slot');
        b.title = 'Clic: llevártelo';
        pb.appendChild(b);
      });
      if (o.slots.length > 1) pb.appendChild(button('Tomar todo', function () { L.takeAllFromPiece(g); again(); }, 'btn small'));
      wrap.appendChild(pb);
      var mine = function (box, ref, sl) {
        if (sl.id === 'gun') { box.appendChild(el('div', 'invline', 'Pistola (no se deja)')); return; }
        var b = button(L.slotName(sl), function () { L.putInPiece(g, ref); again(); }, 'btn slot ghost');
        b.title = 'Clic: dejarlo en ' + o.name.toLowerCase();
        box.appendChild(b);
      };
      var hb = el('div', 'invbox');
      hb.appendChild(el('div', 'invtitle', 'Manos'));
      if (h.r) mine(hb, { hand: 'r' }, h.r);
      if (h.l && h.l !== h.r) mine(hb, { hand: 'l' }, h.l);
      if (!h.r && !h.l) hb.appendChild(el('div', 'invempty', 'Vacías'));
      wrap.appendChild(hb);
      g.pack.places.forEach(function (pl) {
        var spec = Dl.containers[pl.id], box = el('div', 'invbox');
        box.appendChild(el('div', 'invtitle', spec.name + ' · ' + pl.slots.length + '/' + spec.slots));
        pl.slots.forEach(function (sl, i) { mine(box, { pl: pl, i: i }, sl); });
        for (var k = pl.slots.length; k < spec.slots; k++) box.appendChild(el('div', 'invempty', '—'));
        wrap.appendChild(box);
      });
      var kg = L.packWeight(g), cap = Dl.carry.cap;
      show([el('h2', null, o.name), el('p', kg > cap ? 'warn' : null, 'Peso: ' + kg.toFixed(1) + ' de ' + cap + ' kg'),
        wrap, button('Cerrar (E)', onClose, 'btn ghost'),
        el('p', 'hint', 'Clic en lo del mueble: te lo llevás · Clic en lo tuyo: lo dejás en el mueble · Lo que dejás queda guardado ahí')]);
      L.ui.current = 'piece';
    },

    // The big map (M, js/explored.js): everything you have seen of the city. The wheel zooms, dragging moves it.
    bigMap: function (g, onClose) {
      var X = g.explored, p = g.player, city = g.city;
      var cv = el('canvas', 'bigmap');
      cv.width = Math.max(320, Math.floor(window.innerWidth * 0.86)); cv.height = Math.max(240, Math.floor(window.innerHeight * 0.62));
      var view = { cx: p.x, cy: p.y, k: cv.height / (700 * city.scale) }; // 700 m from top to bottom
      // One draw per frame at most, however fast the wheel turns or the mouse drags.
      var queued = false, draw = function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; L.drawBigMap(cv, g, view); }); };
      cv.addEventListener('wheel', function (ev) {
        ev.preventDefault();
        view.k = Math.max(cv.height / city.size / 1.2, Math.min(cv.height / (60 * city.scale), view.k * (ev.deltaY < 0 ? 1.25 : 0.8)));
        draw();
      });
      var drag = null;
      cv.addEventListener('pointerdown', function (ev) { drag = { x: ev.clientX, y: ev.clientY, cx: view.cx, cy: view.cy }; cv.setPointerCapture(ev.pointerId); });
      cv.addEventListener('pointermove', function (ev) { if (!drag) return; view.cx = drag.cx - (ev.clientX - drag.x) / view.k; view.cy = drag.cy - (ev.clientY - drag.y) / view.k; draw(); });
      cv.addEventListener('pointerup', function () { drag = null; });
      var share = X ? X.count / (X.cols * X.rows) : 0;
      show([el('h2', null, 'Mapa'), el('p', null, 'Recorriste el ' + (share * 100).toFixed(share < 0.01 ? 2 : 1) + '% de ' + (city.name || 'la ciudad') + '. Solo se ve lo que ya viste.'),
        cv, button('Cerrar (M)', onClose, 'btn ghost'), el('p', 'hint', 'Rueda del mouse: acercar y alejar · Arrastrar: mover el mapa')]);
      draw();
      L.ui.current = 'map';
    },

    // The test menu (F2, js/debug.js): a button per shortcut, grouped; what it did shows at the top. Where you are, to
    // tell Claude when something goes wrong.
    debug: function (g, onClose) {
      var msg = el('p', 'debugmsg', 'Atajos para probar. Lo que tocás pasa enseguida.'), where = el('p', 'hint', 'Dónde estás: ' + L.debug.where(g));
      var wrap = el('div', 'debug');
      L.debug.groups.forEach(function (gr) {
        var box = el('div', 'debuggroup');
        box.appendChild(el('div', 'invtitle', gr.name));
        gr.actions.forEach(function (a) {
          box.appendChild(button(a.label, function () { msg.textContent = a.run(g) || 'Listo.'; where.textContent = 'Dónde estás: ' + L.debug.where(g); }, 'btn small'));
        });
        wrap.appendChild(box);
      });
      show([el('h2', null, 'Menú de pruebas'), msg, wrap, where, button('Cerrar (F2)', onClose, 'btn ghost'),
        el('p', 'hint', 'Si algo anda mal, copiá la línea de "Dónde estás" y pasásela a Claude.')]);
      L.ui.current = 'debug';
    },

    // Your body (js/health.js, docs/CUERPO.md section 5): your wounds, what you have and what slows you down, and a
    // button for each treatment you carry.
    status: function (g, onClose) {
      var p = g.player, H = L.data.health, N = L.data.needs, again = function () { L.ui.status(g, onClose); };
      var box = el('div', 'invbox wide'), list = [];
      var cap = L.lifeCap(g);
      box.appendChild(el('div', 'invtitle', 'Vida ' + Math.ceil(p.hp) + ' de ' + Math.round(cap) + (p.capLost > 0 ? ' (las heridas te sacaron ' + Math.round(p.stats.maxHp - cap) + ' de ' + p.stats.maxHp + ')' : '')));
      (p.wounds || []).forEach(function (w) {
        var K = H.kinds[w.kind], bits = [K.name];
        if (w.bleed) bits.push(w.band === 'kit' ? 'con el kit' : w.band ? 'vendada' + (w.band === 'trapo' ? ' con un trapo' : '') : 'sangra');
        if (w.dis) bits.push('desinfectada');
        if (w.kind === 'c') bits.push(w.eased ? 'aliviado' : 'te frena');
        bits.push('hace ' + Math.floor(w.age) + ' h');
        list.push(bits.join(' · '));
      });
      if (!list.length) list.push('Sin heridas.');
      list.forEach(function (t) { box.appendChild(el('div', 'invline', t)); });
      var st = [];
      if (p.infection) st.push(p.infection.fever ? 'Fiebre: la infección avanza (perdés vida y energía, te podés desmayar).' :
        p.infection.started ? 'Infección en tratamiento: dosis ' + p.infection.doses + '/' + p.infection.need + ', la próxima en ' + Math.max(0, Math.ceil(p.infection.next)) + ' h.' :
        'Infección: tomá antibiótico (con agua). Sin tratar, en unas horas viene la fiebre.');
      if (L.bleeding(p).length) st.push('Sangrando: perdés vida máxima hasta que te vendes o te pongas un kit.');
      if (p.kitT > 0) st.push('Kit de primeros auxilios: ' + Math.ceil(p.kitT) + ' h más sin perder vida.');
      if (p.bluntSlow > 0) st.push('Golpeado: te movés y pegás ' + Math.round(p.bluntSlow * 100) + '% más lento (el paracetamol lo alivia).');
      if (p.paraT > 0) st.push('Paracetamol: ' + Math.ceil(p.paraT) + ' h.');
      if (p.watered >= N.drink.every) st.push('Tenés sed.');
      if (p.fed >= N.eat.every) st.push('Tenés hambre.');
      if (p.energy !== undefined && p.energy < L.data.rest.sightLow) st.push('Tenés sueño: ves menos lejos.');
      if (L.defenses(g)) st.push('Defensas altas: es más difícil infectarte.');
      if (p.clothes) {
        var bt = L.bodyTemp(g), wetN = L.data.clothes.slots.filter(function (s) { return p.clothes[s] && p.clothes[s].wet > 0.15; }).length;
        st.push('Ropa: abriga ' + L.warmth(g).toFixed(1) + ' y hace falta ' + L.warmNeed(g).toFixed(1) + '. ' + (L.warmText[bt.state] || 'Estás bien abrigado.'));
        if (wetN) st.push('Tenés ' + wetN + (wetN === 1 ? ' prenda mojada' : ' prendas mojadas') + ': abriga menos. Se seca bajo techo.');
      }
      if (p.capLost > 0) {
        var miss = [];
        if (p.infection) miss.push('curar la infección');
        if (L.bleeding(p).length) miss.push('parar el sangrado');
        if (!(p.paraT > 0)) miss.push('tomar paracetamol');
        if (p.fed >= N.eat.every || p.watered >= N.drink.every) miss.push('comer y tomar agua');
        st.push(miss.length ? 'Para recuperarte falta: ' + miss.join(', ') + '; y después dormir.' : 'Listo para recuperarte: dormí (Z). Un día de sueño te deja como nuevo.');
      }
      var sb = el('div', 'invbox wide');
      sb.appendChild(el('div', 'invtitle', 'Estado'));
      (st.length ? st : ['Estás bien.']).forEach(function (t) { sb.appendChild(el('div', 'invline', t)); });
      // Treatments you carry.
      var tb = el('div', 'invbox wide');
      tb.appendChild(el('div', 'invtitle', 'Lo que podés usar'));
      var any = false;
      ['kitFarmacia', 'kitCasero', 'vendas', 'curitas', 'trapos', 'alcohol', 'sanitizante', 'paracetamol', 'antibiotico', 'botiquin'].forEach(function (id) {
        if (!L.packCount(g, id)) return;
        var acts = [];
        L.itemActions(g, { id: id, n: 1 }, function (label, run) { acts.push({ label: label, run: run }); });
        acts.forEach(function (a) {
          any = true;
          tb.appendChild(button(a.label + ': ' + L.lootText([[id, L.packCount(g, id)]]), function () { a.run(); again(); }, 'btn slot'));
        });
      });
      if (!any) tb.appendChild(el('div', 'invline', 'Nada que te sirva ahora.'));
      var inv = el('div', 'inv'); inv.appendChild(box); inv.appendChild(sb); inv.appendChild(tb);
      show([el('h2', null, 'Estado'), inv, button('Cerrar (K)', onClose, 'btn ghost')]);
      L.ui.current = 'status';
    },

    // What you can make (js/craft.js): one line per recipe with what it needs; the ones you can't make say why.
    craft: function (g, onClose) {
      var list = el('div', 'craft');
      L.data.craft.recipes.forEach(function (r, i) {
        var why = L.craftBlock(g, r), need = L.needText(r.need);
        var b = button((i + 1) + '. ' + r.name + ' — ' + need + (r.at ? ' (en un taller)' : '') + (why ? ' · ' + why : ''), function () {
          if (L.craft(g, r)) L.ui.craft(g, onClose); else L.ui.flash(L.craftBlock(g, r) || 'No hay lugar en la mochila');
        }, why ? 'btn ghost' : 'btn');
        list.appendChild(b);
      });
      L.ui.craftPick = function (n) { var r = L.data.craft.recipes[n]; if (r && L.craft(g, r)) L.ui.craft(g, onClose); };
      show([el('h2', null, 'Fabricar'), list, button('Cerrar (Tab)', onClose, 'btn ghost'),
        el('p', 'hint', 'Con el número o un clic. Lo simple se hace en cualquier lado; lo demás, al lado de un taller.')]);
      L.ui.current = 'craft';
    },

    // The pause, with the keys of the game.
    pause: function (onResume) {
      var vol = el('div', 'row');
      var label = el('span', 'volume', 'Volumen ' + Math.round(L.sound.volume() * 100) + '%');
      vol.appendChild(button('−', function () { L.sound.setVolume(L.sound.volume() - 0.1); label.textContent = 'Volumen ' + Math.round(L.sound.volume() * 100) + '%'; }, 'btn small'));
      vol.appendChild(label);
      vol.appendChild(button('+', function () { L.sound.setVolume(L.sound.volume() + 0.1); label.textContent = 'Volumen ' + Math.round(L.sound.volume() * 100) + '%'; }, 'btn small'));
      var opts = el('div', 'row');
      opts.appendChild(button('Temblor de pantalla: ' + (L.options.shake ? 'sí' : 'no'), function () { L.options.shake = !L.options.shake; L.saveOptions(); L.ui.pause(onResume); }, 'btn small'));
      opts.appendChild(button('Letra grande: ' + (L.options.big ? 'sí' : 'no'), function () { L.options.big = !L.options.big; L.saveOptions(); L.ui.pause(onResume); }, 'btn small'));
      var keys = el('div', 'keys');
      [['WASD', 'moverte'], ['Shift', 'correr'], ['Mouse', 'disparar o pegar'], ['Clic derecho', 'apuntar (a mano: la otra mano)'], ['Los dos botones', 'empujar'], ['R', 'recargar'], ['1 / 2', 'pistola / arma de mano'],
        ['Espacio', 'cubrirte'], ['E', 'revisar muebles, juntar del piso o recuperar tu cuerpo (o llenar botellas en una pileta)'], ['H', 'venda'], ['Z', 'dormir (mejor en una cama) o despertarte'], ['K', 'estado: heridas y remedios'], ['F', 'linterna'], ['I', 'inventario'], ['Tab', 'fabricar'], ['G', 'molotov'], ['M', 'mapa: lo que ya recorriste'], ['O', 'sonido']].forEach(function (k) {
        var r = el('div', 'keyrow'); r.appendChild(el('span', 'kbd', k[0])); r.appendChild(el('span', null, k[1])); keys.appendChild(r);
      });
      show([el('h2', null, 'Pausa'), button('Seguir', onResume), vol, opts, keys, el('p', 'hint', 'O: sonido ' + (L.sound.muted() ? 'apagado' : 'prendido'))]);
      L.ui.current = 'pause';
    },

    // End of the match for you: you won, or you ran out of lives.
    // reward: what the Cuaderno gave you this match ({ coins, unlocked }), if any.
    result: function (m, onRestart, reward, onEndless) {
      var me = m.human, g = me.game;
      var mm = Math.floor(g.time / 60), s = Math.floor(g.time % 60);
      var won = m.winner === me;
      var title = won ? '¡Ganaste el Sol!' : 'Quedaste ' + me.place + '.º de 8';
      var stats = el('div', 'stats');
      [['Aguantaste', mm + ':' + (s < 10 ? '0' : '') + s], ['Nivel', g.player.level], ['Bajas', g.kills],
        ['Ítems', g.player.itemOrder.reduce(function (n, id) { return n + g.player.items[id]; }, 0)],
        ['Duelos', me.duels],
        ['Siguen en pie', L.alivePlayers(m).map(function (pl) { return pl.name; }).join(', ') || 'nadie']].forEach(function (r) {
        stats.appendChild(el('div', null, r[0])); stats.appendChild(el('b', null, String(r[1])));
      });
      var nodes = [el('h2', null, title), el('p', 'tagline', pick(won ? L.data.lore.winLines : L.data.lore.loseLines))];
      if (won) { nodes.unshift(el('div', 'sun')); nodes.push(el('p', 'sunday', L.data.lore.sunDays[g.player.char.id] || '')); }
      nodes.push(stats);
      if (reward) {
        nodes.push(el('p', 'coins', '+' + reward.coins + ' Monedas del Sol (tenés ' + L.profile.coins + ')'));
        (reward.opened || []).forEach(function (u) { nodes.push(el('p', 'achnew', '¡Desbloqueaste ' + (u.kind === 'char' ? 'a ' + L.findById(L.data.characters, u.id).name : (u.kind === 'pact' ? 'el Pacto ' : 'el modo ') + u.name) + '!')); });
        reward.unlocked.forEach(function (a) { nodes.push(el('p', 'achnew', '¡Logro! ' + a.name + ' — ' + a.desc + ' (+' + a.coins + ' ☀)')); });
        if (reward.rankUp) nodes.push(el('p', 'achnew', g.player.char.name + ' subió de rango: ' + reward.rankUp.name + '.'));
        if (reward.dailyRecord) nodes.push(el('p', 'achnew', '¡Nuevo récord en la partida del día!'));
      }
      var en = m.endless, clockOf = function (t) { t = Math.floor(t); return Math.floor(t / 60) + ':' + (t % 60 < 10 ? '0' : '') + t % 60; };
      if (en && en.settled) {
        nodes.push(el('p', 'achnew', 'Aguante: ' + clockOf(en.survived) + (en.settled.record ? ' — ¡récord nuevo!' : ' (récord: ' + clockOf(en.settled.best) + ')') + (en.settled.coins ? ' · +' + en.settled.coins + ' ☀' : '')));
      } else if (won && onEndless) {
        var best = L.profile.endlessBest;
        nodes.push(button('Seguir aguantando' + (best ? ' (récord ' + clockOf(best) + ')' : ''), onEndless, 'btn storm'));
      }
      nodes.push(button('Jugar de nuevo', onRestart), el('p', 'hint', 'Enter para volver a empezar · gastá tus monedas en el Cuaderno'));
      show(nodes);
      overlay.classList.toggle('sunny', won);
      L.ui.current = 'over';
    }
  };
})(this.Lluvia = this.Lluvia || {});
