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

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  L.ui = {
    current: null,

    hide: function () { overlay.classList.add('hidden'); overlay.innerHTML = ''; L.ui.current = null; },

    // A short message in the corner (sound on/off and the like).
    flash: function (text) {
      if (!flashEl) { flashEl = el('div', 'flash'); document.body.appendChild(flashEl); }
      flashEl.textContent = text;
      flashEl.style.opacity = '1';
      clearTimeout(flashTimer);
      flashTimer = setTimeout(function () { flashEl.style.opacity = '0'; }, 1600);
    },

    characterSelect: function (onPick) {
      var cards = el('div', 'cards');
      L.data.characters.forEach(function (c, i) {
        cards.appendChild(card(String(i + 1), c, function () { onPick(c.id); }, L.data.lore.bios[c.id]));
      });
      var row = el('div', 'row');
      row.appendChild(button('Cuaderno (' + L.profile.coins + ' ☀)', function () { L.ui.notebook(onPick); }, 'btn'));
      row.appendChild(button('Partida del día', function () { L.ui.daily(onPick); }, 'btn'));
      row.appendChild(button('La historia', function () { L.ui.story(onPick); }, 'btn ghost'));
      row.appendChild(button('Cómo se juega', function () { L.ui.howTo(onPick); }, 'btn ghost'));
      row.appendChild(button('Volver a ver los consejos', function () { L.tips.reset(); L.ui.flash('Los consejos van a aparecer de nuevo'); }, 'btn ghost'));
      show([el('h1', null, 'LLUVIA'), el('p', 'tagline', L.data.lore.tagline), el('p', null, 'Elegí tu Paraguas'), cards, row,
        el('p', 'hint', 'WASD o flechas para moverte · Espacio: ulti hacia el mouse · Q / E: apostar · P: pausa · M: sonido')]);
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
        el('h3', null, 'Mejoras'), shop, el('h3', null, 'Logros'), ach, rec, button('Volver', function () { L.ui.characterSelect(onPick); })]);
      L.ui.current = 'notebook';
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
        ['El Juicio', 'Cada 2 minutos el Trueno elige a dos Paraguas para un duelo bajo una Ley del Cielo. El que pierde, pierde una vida. Los demás apuestan con Q y E.'],
        ['Ganar', 'Tenés 3 vidas. Las perdés cayendo en la horda o perdiendo un Juicio. Cuando quedan dos, pelean hasta el final. El último en pie gana el Sol.']
      ].forEach(function (r) { box.appendChild(el('h3', null, r[0])); box.appendChild(el('p', null, r[1])); });
      show([el('h2', null, 'Cómo se juega'), box, button('Volver', function () { L.ui.characterSelect(onPick); })]);
      L.ui.current = 'howto';
    },

    choice: function (options, onPick) {
      var cards = el('div', 'cards');
      options.forEach(function (o, i) { cards.appendChild(card(String(i + 1), o, function () { onPick(i); })); });
      var nodes = [el('h2', null, '¡Subiste de nivel!'), cards];
      if (options.some(function (o) { return o.type === 'fusion'; })) nodes.splice(1, 0, el('p', 'tagline', '¡Hay una fusión disponible! Convierte tu habilidad en una versión mucho más fuerte.'));
      show(nodes);
      L.ui.current = 'choice';
    },

    pause: function (onResume) {
      var vol = el('div', 'row');
      var label = el('span', 'volume', 'Volumen ' + Math.round(L.sound.volume() * 100) + '%');
      vol.appendChild(button('−', function () { L.sound.setVolume(L.sound.volume() - 0.1); label.textContent = 'Volumen ' + Math.round(L.sound.volume() * 100) + '%'; }, 'btn small'));
      vol.appendChild(label);
      vol.appendChild(button('+', function () { L.sound.setVolume(L.sound.volume() + 0.1); label.textContent = 'Volumen ' + Math.round(L.sound.volume() * 100) + '%'; }, 'btn small'));
      show([el('h2', null, 'Pausa'), button('Seguir', onResume), vol, el('p', 'hint', 'M: sonido ' + (L.sound.muted() ? 'apagado' : 'prendido'))]);
      L.ui.current = 'pause';
    },

    // End of the match for you: you won, or you ran out of lives.
    // reward: what the Cuaderno gave you this match ({ coins, unlocked }), if any.
    result: function (m, onRestart, reward) {
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
      var nodes = [el('h2', null, title), el('p', 'tagline', pick(won ? L.data.lore.winLines : L.data.lore.loseLines)), stats];
      if (reward) {
        nodes.push(el('p', 'coins', '+' + reward.coins + ' Monedas del Sol (tenés ' + L.profile.coins + ')'));
        reward.unlocked.forEach(function (a) { nodes.push(el('p', 'achnew', '¡Logro! ' + a.name + ' — ' + a.desc + ' (+' + a.coins + ' ☀)')); });
        if (reward.dailyRecord) nodes.push(el('p', 'achnew', '¡Nuevo récord en la partida del día!'));
      }
      nodes.push(button('Jugar de nuevo', onRestart), el('p', 'hint', 'Enter para volver a empezar · gastá tus monedas en el Cuaderno'));
      show(nodes);
      L.ui.current = 'over';
    }
  };
})(this.Lluvia = this.Lluvia || {});
