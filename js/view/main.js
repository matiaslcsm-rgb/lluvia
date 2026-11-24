// Boots the game in the browser: canvas size, frame loop, menus and keys.
(function (L) {
  'use strict';
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var match = null, paused = false, last = 0, reward = null;

  // Your Cuaderno, kept in this browser.
  L.profile = L.newProfile();
  try {
    var saved = JSON.parse(localStorage.getItem('lluvia.profile') || 'null');
    if (saved) { var base = L.newProfile(); for (var k in base) if (saved[k] !== undefined) base[k] = saved[k]; L.profile = base; }
  } catch (e) { /* storage blocked or broken: start a fresh notebook */ }
  L.saveProfile = function () { try { localStorage.setItem('lluvia.profile', JSON.stringify(L.profile)); } catch (e) { /* not saved */ } };

  function game() { return match && match.human.game; }

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    if (match) { game().view.w = canvas.width; game().view.h = canvas.height; }
  }

  var daily = false;
  // After picking a character: pick where you start on the map, download the streets, then play.
  // The daily match plays an invented city from the day's seed, so it is the same for everyone.
  function start(characterId, isDaily) {
    daily = !!isDaily;
    var seed = daily ? L.dailySeed(new Date()) : (Date.now() >>> 0) || 1;
    if (daily) { begin(characterId, seed, L.cityProcedural(seed), null); return; }
    L.ui.mapPick(function (place) {
      L.ui.loading(place ? 'Bajando las calles de ' + (place.name || 'ese lugar') + '...' : 'Inventando una ciudad...');
      L.loadCity(place, seed, function (city, msg) { begin(characterId, seed, city, msg); });
    }, menu);
  }

  function begin(characterId, seed, city, msg) {
    L.fx.clear();
    match = L.createMatch({ seed: seed, characterId: characterId, viewW: canvas.width, viewH: canvas.height, profile: L.profile, storm: !daily && !!L.ui.storm && L.isUnlocked(L.profile, 'tormenta'),
      pacts: daily ? [] : (L.ui.pacts || []).filter(function (id) { return L.isUnlocked(L.profile, id); }), city: city });
    var g = game(), fr = L.cityFree(city, city.size / 2, city.size / 2);
    g.player.x = fr.x; g.player.y = fr.y;
    if (msg) L.toast(g, msg, '#ff9a7a');
    if (city.name) L.toast(g, 'Arrancás en ' + city.name + '. El Sol Amarillo volvió loca a la gente: no te dejes agarrar.', '#ffd23f');
    reward = null;
    paused = false;
    L.ui.hide();
  }

  function pick(i) {
    if (match && L.choose(game(), i)) L.ui.hide();
  }

  function togglePause() {
    if (!match || match.over || game().choice) return;
    paused = !paused;
    if (paused) L.ui.pause(togglePause); else L.ui.hide();
  }

  // Space: your ulti toward the mouse, in your arena or in the duel.
  function ulti() {
    var mouse = L.input.mouse;
    if (match.duel && match.human.inDuel) {
      var v = L.duelView, i = match.duel.players.indexOf(match.human);
      if (v) L.castDuelUlti(match.duel, i, (mouse.x - v.ox) / v.scale, (mouse.y - v.oy) / v.scale);
      return;
    }
    var g = game();
    if (g.choice || match.final) return;
    // The camera keeps you in the middle of the screen.
    L.castUlti(g, g.player.x - canvas.width / 2 + mouse.x, g.player.y - canvas.height / 2 + mouse.y);
  }

  // Q / E: bet a slice of your limit on the first or second fighter.
  function bet(side) {
    var mine = match.betting.byPlayer[match.human.index];
    if (!mine) return;
    if (L.placeBet(match, match.human, side, Math.max(1, Math.floor(mine.cap * L.data.bets.pressShare))) || mine.side === side) L.sound.play('bet');
  }

  function menu() { match = null; L.ui.characterSelect(start); }
  function endless() { if (L.startEndless(match)) { seen.over = false; L.ui.hide(); } }

  addEventListener('keydown', function (e) {
    var n = /^(Digit|Numpad)[1-8]$/.test(e.code) ? Number(e.code.slice(-1)) - 1 : undefined;
    if (L.ui.current === 'select' && n !== undefined && L.data.characters[n] && L.isUnlocked(L.profile, L.data.characters[n].id)) start(L.data.characters[n].id);
    else if (L.ui.current === 'daily' && n !== undefined && L.data.characters[n]) start(L.data.characters[n].id, true);
    else if (L.ui.current === 'choice' && n !== undefined) pick(n);
    else if (L.ui.current === 'over' && e.code === 'Enter') menu();
    else if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
    else if ((e.code === 'KeyQ' || e.code === 'KeyE') && match && match.betting && !paused) bet(e.code === 'KeyQ' ? 0 : 1);
    else if (e.code === 'KeyR' && match && !paused) send();
    else if (e.code === 'Space' && match && !paused && !match.over) { e.preventDefault(); ulti(); }
    else if (e.code === 'KeyM') L.ui.flash(L.sound.toggle() ? 'Sonido apagado (M)' : 'Sonido prendido (M)');
  });

  // Sounds for what happens in the match itself (duels, bets, the end), comparing with the last frame.
  var seen = { duel: null, betting: null, over: false };
  function matchSounds() {
    if (match.duel && match.duel !== seen.duel) L.sound.play('duel');
    if (match.over && !seen.over) L.sound.play(match.winner === match.human ? 'win' : 'lose');
    seen.duel = match.duel; seen.over = match.over;
  }

  // Gamepad: Start pauses, A casts the ulti the way you walk (or picks), LB/RB bet, D-pad moves between options.
  var padPick = 0;
  function gamepad() {
    L.input.padPresses().forEach(function (b) {
      if (b === 'start' && match && !match.over) togglePause();
      else if (L.ui.current) {
        // Any menu: the D-pad moves between its buttons and A presses the one in focus.
        var items = [].slice.call(document.querySelectorAll('#overlay button:not([disabled])'));
        if (!items.length) return;
        var cur = items.indexOf(document.activeElement);
        if (b === 'left' || b === 'up') padPick = cur < 0 ? 0 : (cur + items.length - 1) % items.length;
        else if (b === 'right' || b === 'down') padPick = cur < 0 ? 0 : (cur + 1) % items.length;
        else if (b === 'a') { if (cur >= 0) items[cur].click(); else items[0].focus(); return; }
        else return;
        items[padPick].focus();
      } else if (match && !paused && !match.over) {
        if (b === 'a') padUlti();
        else if ((b === 'lb' || b === 'rb') && match.betting) bet(b === 'lb' ? 0 : 1);
        else if (b === 'y') send();
      }
    });
  }

  function send() {
    if (L.sendAnegados(match, match.human)) L.sound.play('bet');
    else L.ui.flash('Mandar Anegados: ' + L.cantSend(match, match.human));
  }

  function padUlti() {
    var v = L.input.vector();
    if (match.duel && match.human.inDuel) {
      var i = match.duel.players.indexOf(match.human), f = match.duel.fighters[i], foe = match.duel.fighters[1 - i];
      L.castDuelUlti(match.duel, i, foe.x, foe.y); // on a gamepad, the duel ulti aims at the other one
      return;
    }
    var g = game(), p = g.player, dx = v.x || p.dirX, dy = v.y || p.dirY;
    if (!g.choice && !match.final) L.castUlti(g, p.x + dx * 300, p.y + dy * 300);
  }

  // Touch taps: on the betting panel they bet on that side; anywhere else they cast the ulti toward that point.
  L.input.onTap = function (x, y) {
    if (!match || paused || match.over) return;
    var W = canvas.width, H = canvas.height;
    if (match.betting && match.betting.byPlayer[match.human.index] && y > H - 150 && y < H - 54) { bet(x < W / 2 ? 0 : 1); return; }
    var sb = L.sendBadgeRect;
    if (sb && x >= sb.x && x <= sb.x + sb.w && y >= sb.y && y <= sb.y + sb.h) { send(); return; }
    var mouse = L.input.mouse;
    mouse.x = x; mouse.y = y;
    ulti();
  };

  function frame(t) {
    var dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    gamepad();
    L.frameDt = paused ? 0 : dt;
    if (match && !paused) {
      L.updateMatch(match, dt, L.input.vector());
      L.fx.consume(game().events);
      if (match.duel && match.duel.events) L.fx.consume(match.duel.events);
      matchSounds();
      L.tips.check(match);
      var g = game();
      if (!match.over && g.choice && L.ui.current !== 'choice') L.ui.choice(g.choice, pick, g);
      if (match.over && L.ui.current !== 'over') {
        if (!reward) {
          reward = L.settleMatch(L.profile, match);
          if (daily) reward.dailyRecord = L.recordDaily(L.profile, L.dailyKey(new Date()), match.human.place || 1, game().kills);
          L.saveProfile();
        }
        if (match.endless && !match.endless.settled) { L.settleEndless(L.profile, match); L.saveProfile(); }
        L.ui.result(match, menu, reward, endless);
      }
    }
    if (match && match.duel && match.human.inDuel) L.renderDuel(match.duel, ctx, canvas.width, canvas.height, match.duel.players.indexOf(match.human));
    else L.render(game(), ctx, canvas.width, canvas.height, match);
    if (match && !match.over) L.tips.draw(ctx, canvas.width, paused ? 0 : dt);
    requestAnimationFrame(frame);
  }

  addEventListener('resize', resize);
  resize();
  menu();
  requestAnimationFrame(function (t) { last = t; frame(t); });
})(this.Lluvia = this.Lluvia || {});
