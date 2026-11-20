// Menus drawn over the canvas: character select, level-up choice, pause and game over.
(function (L) {
  'use strict';
  var overlay = document.getElementById('overlay');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function card(key, item, onClick) {
    var b = el('button', 'card');
    var dot = el('div', 'dot'); dot.style.background = item.color;
    b.appendChild(dot);
    if (key) b.appendChild(el('div', 'key', 'Tecla ' + key));
    if (item.tag) b.appendChild(el('div', 'tag', item.tag));
    b.appendChild(el('div', 'name', item.name));
    b.appendChild(el('div', 'desc', item.desc));
    b.addEventListener('click', onClick);
    return b;
  }

  function show(nodes) {
    overlay.innerHTML = '';
    nodes.forEach(function (n) { overlay.appendChild(n); });
    overlay.classList.remove('hidden');
  }

  L.ui = {
    current: null,

    hide: function () { overlay.classList.add('hidden'); overlay.innerHTML = ''; L.ui.current = null; },

    characterSelect: function (onPick) {
      var cards = el('div', 'cards');
      L.data.characters.forEach(function (c, i) {
        cards.appendChild(card(String(i + 1), c, function () { onPick(c.id); }));
      });
      show([el('h1', null, 'LLUVIA'), el('p', null, 'Elegí con quién arrancar'), cards,
        el('p', 'hint', 'Te movés con WASD o las flechas. Los ataques salen solos. Q y E para apostar en los duelos. P o Esc para pausar.')]);
      L.ui.current = 'select';
    },

    choice: function (options, onPick) {
      var cards = el('div', 'cards');
      options.forEach(function (o, i) { cards.appendChild(card(String(i + 1), o, function () { onPick(i); })); });
      show([el('h2', null, '¡Subiste de nivel!'), cards]);
      L.ui.current = 'choice';
    },

    pause: function (onResume) {
      var b = el('button', 'btn', 'Seguir');
      b.addEventListener('click', onResume);
      show([el('h2', null, 'Pausa'), b]);
      L.ui.current = 'pause';
    },

    // End of the match for you: you won, or you ran out of lives.
    result: function (m, onRestart) {
      var me = m.human, g = me.game;
      var mm = Math.floor(g.time / 60), s = Math.floor(g.time % 60);
      var won = m.winner === me;
      var title = won ? '¡Ganaste! Quedaste último en pie' : 'Quedaste ' + me.place + '.º de 8';
      var stats = el('div', 'stats');
      [['Aguantaste', mm + ':' + (s < 10 ? '0' : '') + s], ['Nivel', g.player.level], ['Bajas', g.kills],
        ['Ítems', g.player.itemOrder.reduce(function (n, id) { return n + g.player.items[id]; }, 0)],
        ['Siguen en pie', L.alivePlayers(m).map(function (pl) { return pl.name; }).join(', ') || 'nadie']].forEach(function (r) {
        stats.appendChild(el('div', null, r[0])); stats.appendChild(el('b', null, String(r[1])));
      });
      var b = el('button', 'btn', 'Jugar de nuevo');
      b.addEventListener('click', onRestart);
      show([el('h2', null, title), stats, b, el('p', 'hint', 'Enter para volver a empezar')]);
      L.ui.current = 'over';
    }
  };
})(this.Lluvia = this.Lluvia || {});
