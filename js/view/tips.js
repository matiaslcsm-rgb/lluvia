// The tutorial: tips that show up by themselves the first time something happens (you can move, you can pay a
// chest, your ulti is ready, a duel is coming...). Each one shows once; the browser remembers which you saw.
(function (L) {
  'use strict';
  var seen = {}, queue = [], current = null, KEY = 'lluvia.tips';
  try { seen = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { seen = {}; }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch (e) { /* not saved, fine */ } }

  var TEXT = {
    move: 'Te movés con WASD o las flechas. Tus ataques salen solos: vos esquivá a los Anegados.',
    gems: 'Los cristales celestes son experiencia: pasá por encima para juntarlos y subir de nivel.',
    chest: 'Ya te alcanza el oro para un cofre: seguí las flechas doradas del borde y tocalo para abrirlo.',
    ulti: 'Tu ulti está lista: apuntá con el mouse y apretá Espacio.',
    bets: 'Se viene un Juicio entre otros dos Paraguas. Apostá con Q (al primero) o E (al segundo). La primera apuesta suma una gratis.',
    myDuel: '¡El Trueno te eligió para el Juicio! Peleás con todo lo que tenés. El que pierde, pierde una vida.',
    boss: 'Llegó un jefe (los hay de tres clases y van rotando). Si lo bajás deja un cofre gratis con algo raro o legendario. La Reina dispara abanicos de granizo; el Leviatán avisa con una línea roja antes de embestir.',
    life: 'Perdiste una vida y la mitad del oro. Sin vidas quedás afuera: el último en pie gana.',
    wave: 'Evento de tormenta: cada minuto la horda hace algo especial. Leé el aviso y movete.',
    elite: 'Los Anegados con brillo dorado son élites: más duros, pero dejan mucho oro y a veces un cofre.',
    final: 'Quedan dos: se terminan las hordas y el Juicio sigue hasta que uno se quede sin vidas.'
  };

  L.tips = {
    show: function (id) {
      if (seen[id] || !TEXT[id] || queue.indexOf(id) !== -1 || (current && current.id === id)) return;
      seen[id] = true; save();
      queue.push(id);
    },
    reset: function () { seen = {}; save(); },

    // Looks at the match and raises the tips that apply. Called every frame.
    check: function (m) {
      if (!m || m.over) return;
      var me = m.human, g = me.game, p = g.player;
      if (g.time > 0.5) L.tips.show('move');
      if (g.gems.length && g.time > 6) L.tips.show('gems');
      if (g.gold >= L.chestCost(g) && !me.inDuel) L.tips.show('chest');
      if (L.ultiReady(p) && g.time > 3) L.tips.show('ulti');
      if (m.betting && m.betting.byPlayer[me.index]) L.tips.show('bets');
      if (me.inDuel) L.tips.show('myDuel');
      if (g.boss) L.tips.show('boss');
      if (g.lives < L.data.horde.lives) L.tips.show('life');
      if (g.lastWave) L.tips.show('wave');
      if (m.final) L.tips.show('final');
      if (!seen.elite) {
        for (var i = 0; i < g.enemies.length; i++) {
          var e = g.enemies[i];
          if (e.elite && Math.abs(e.x - p.x) < 500 && Math.abs(e.y - p.y) < 350) { L.tips.show('elite'); break; }
        }
      }
    },

    // Draws the current tip at the top, under the HUD. dt: real seconds since last frame.
    draw: function (ctx, W, dt) {
      if (!current && queue.length) current = { id: queue.shift(), life: 7 };
      if (!current) return;
      current.life -= dt;
      if (current.life <= 0) { current = null; return; }
      var text = TEXT[current.id], w = Math.min(640, W - 40), x = (W - w) / 2, y = 120;
      ctx.font = '600 15px system-ui, sans-serif';
      var lines = wrap(ctx, text, w - 40);
      var h = 34 + lines.length * 20;
      ctx.globalAlpha = Math.min(1, current.life * 2);
      ctx.fillStyle = 'rgba(16, 30, 48, 0.92)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#9fd8ff';
      ctx.textAlign = 'left';
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.fillText('CONSEJO', x + 20, y + 20);
      ctx.fillStyle = '#e8f4ff';
      ctx.font = '600 15px system-ui, sans-serif';
      lines.forEach(function (ln, i) { ctx.fillText(ln, x + 20, y + 42 + i * 20); });
      ctx.globalAlpha = 1;
    }
  };

  function wrap(ctx, text, max) {
    var words = text.split(' '), lines = [], line = '';
    words.forEach(function (wd) {
      var test = line ? line + ' ' + wd : wd;
      if (ctx.measureText(test).width > max && line) { lines.push(line); line = wd; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }
})(this.Lluvia = this.Lluvia || {});
