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

    hide: function () { overlay.classList.add('hidden'); overlay.classList.remove('sunny'); overlay.innerHTML = ''; L.ui.current = null; },

    // A short message in the corner (sound on/off and the like).
    flash: function (text) {
      if (!flashEl) { flashEl = el('div', 'flash'); document.body.appendChild(flashEl); }
      flashEl.textContent = text;
      flashEl.style.opacity = '1';
      clearTimeout(flashTimer);
      flashTimer = setTimeout(function () { flashEl.style.opacity = '0'; }, 1600);
    },

    // The start screen of San Miguel (the old character select of the rain game is gone from the menu).
    title: function (onStart) {
      show([el('h1', null, 'LLUVIA'),
        el('p', 'tagline', 'San Miguel. Un día el sol empezó a brillar amarillo y la gente se volvió loca.'),
        button('Empezar', onStart),
        el('p', 'hint', 'WASD: moverte · Shift: correr · Mouse: disparar · clic derecho: apuntar · R: recargar · 1: pistola · 2: arma de mano'),
        el('p', 'hint', 'A mano: cada botón una mano; los dos juntos, empujar'),
        el('p', 'hint', 'E: revisar muebles · H: venda · F: linterna · Tab: fabricar · G: molotov'),
        el('p', 'hint', 'P: pausa · M: sonido · Enter: empezar')]);
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

    // Your inventory (js/loot.js): your hands, your pockets and each bag, with what is in every slot. A click uses
    // it (a bandage heals, a weapon goes to your hand); the ✕ throws it away.
    inventory: function (g, onClose) {
      var p = g.player, Dl = L.data.loot, wrap = el('div', 'inv');
      var hands = el('div', 'invbox');
      hands.appendChild(el('div', 'invtitle', 'En las manos'));
      hands.appendChild(el('div', 'invline', (p.gun ? p.gun.def.name + ' · ' + p.gun.ammo + ' en el cargador' : 'Sin arma de fuego')));
      var md = L.meleeDef(p.melee.id);
      hands.appendChild(el('div', 'invline', md.name + (md.dur ? ' · ' + Math.round(p.melee.dur / md.dur * 100) + '% de vida' : '')));
      wrap.appendChild(hands);
      g.pack.places.forEach(function (pl) {
        var spec = Dl.containers[pl.id], box = el('div', 'invbox');
        box.appendChild(el('div', 'invtitle', spec.name + ' · ' + pl.slots.length + '/' + spec.slots + (spec.big ? '' : ' · solo cosas chicas')));
        pl.slots.forEach(function (sl, i) {
          var row = el('div', 'invrow'), wd = sl.id.indexOf('w:') === 0 ? L.meleeDef(sl.id.slice(2)) : null;
          var name = wd ? wd.name + (wd.dur ? ' (' + Math.round(sl.dur / wd.dur * 100) + '%)' : '') : L.lootText([[sl.id, sl.n]]);
          var use = button(name, function () { if (L.packUse(g, pl, i)) L.ui.inventory(g, onClose); }, 'btn slot');
          var drop = button('✕', function () { L.packDrop(g, pl, i); L.ui.inventory(g, onClose); }, 'btn ghost small');
          drop.title = 'Tirar';
          row.appendChild(use); row.appendChild(drop);
          box.appendChild(row);
        });
        for (var k = pl.slots.length; k < spec.slots; k++) box.appendChild(el('div', 'invempty', '—'));
        wrap.appendChild(box);
      });
      show([el('h2', null, 'Inventario'), wrap, button('Cerrar (I)', onClose, 'btn ghost'),
        el('p', 'hint', 'Clic en algo para usarlo (una venda cura, un arma va a la mano) · ✕ para tirarlo · Las cosas grandes van en un bolso o una mochila')]);
      L.ui.current = 'inventory';
    },

    // What you can make (js/craft.js): one line per recipe with what it needs; the ones you can't make say why.
    craft: function (g, onClose) {
      var list = el('div', 'craft');
      L.data.craft.recipes.forEach(function (r, i) {
        var why = L.craftBlock(g, r), need = L.lootText(Object.keys(r.need).map(function (k) { return [k, r.need[k]]; }));
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
        ['E', 'revisar muebles'], ['H', 'venda'], ['F', 'linterna'], ['I', 'inventario'], ['Tab', 'fabricar'], ['G', 'molotov'], ['M', 'sonido']].forEach(function (k) {
        var r = el('div', 'keyrow'); r.appendChild(el('span', 'kbd', k[0])); r.appendChild(el('span', null, k[1])); keys.appendChild(r);
      });
      show([el('h2', null, 'Pausa'), button('Seguir', onResume), vol, opts, keys, el('p', 'hint', 'M: sonido ' + (L.sound.muted() ? 'apagado' : 'prendido'))]);
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
