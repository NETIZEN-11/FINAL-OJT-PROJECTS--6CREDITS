"use strict";

// ===== AUDIO MODULE =====
const AudioModule = (() => {
  const sounds = {
    flip: document.getElementById("s_flip"),
    match: document.getElementById("s_match"),
    wrong: document.getElementById("s_wrong"),
    win: document.getElementById("s_win")
  };
  let isMuted = false;

  return {
    play: (name) => {
      if (isMuted) return;
      const s = sounds[name];
      if (s && typeof s.play === 'function') {
        try { s.currentTime = 0; s.play(); } catch (e) { /* ignore play errors */ }
      }
    },
    toggleMute: () => { isMuted = !isMuted; return isMuted; },
    isMuted: () => isMuted
  };
})();

// ===== STORAGE MODULE =====
const StorageModule = (() => {
  const KEY = 'memoryGameHighScore';
  return {
    getHighScore: () => parseInt(localStorage.getItem(KEY) || '0', 10),
    setHighScore: (v) => { localStorage.setItem(KEY, String(v)); }
  };
})();

// ===== UI MODULE =====
const UIModule = (() => {
  const elements = {
    startScreen: document.getElementById('startScreen'),
    levelScreen: document.getElementById('levelScreen'),
    gameScreen: document.getElementById('gameScreen'),
    startBtn: document.getElementById('startBtn'),
    board: document.getElementById('board'),
    score: document.getElementById('score'),
    time: document.getElementById('time'),
    matches: document.getElementById('matches'),
    levelDisplay: document.getElementById('levelDisplay'),
    message: document.getElementById('message'),
    highScore: document.getElementById('highScore'),
    soundToggle: document.getElementById('soundToggle'),
    soundToggleStart: document.getElementById('soundToggleStart'),
    pauseBtn: document.getElementById('pauseBtn'),
    restartBtn: document.getElementById('restartBtn'),
    backBtn: document.getElementById('backBtn')
  };

  return {
    showScreen: (name) => {
      ['startScreen','levelScreen','gameScreen'].forEach(k => elements[k].classList.add('hidden'));
      if (name === 'start') elements.startScreen.classList.remove('hidden');
      if (name === 'level') elements.levelScreen.classList.remove('hidden');
      if (name === 'game') elements.gameScreen.classList.remove('hidden');
    },
    clearBoard: () => { elements.board.innerHTML = ''; },
    appendCard: (card) => elements.board.appendChild(card),
    setGridCols: (cols) => { elements.board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`; },
    setBoardClass: (lvl) => { elements.board.classList.remove('easy','medium','hard'); elements.board.classList.add(lvl); },
    updateStats: (score, time, matches) => { if (elements.score) elements.score.textContent = score; if (elements.time) elements.time.textContent = time; if (elements.matches) elements.matches.textContent = matches; },
    setLevelDisplay: (lvl) => { if (elements.levelDisplay) elements.levelDisplay.textContent = lvl.charAt(0).toUpperCase()+lvl.slice(1); },
    setMessage: (text) => { if (elements.message) { elements.message.textContent = text; elements.message.classList.remove('hidden'); } },
    hideMessage: () => { if (elements.message) elements.message.classList.add('hidden'); },
    updateHighScore: () => { if (elements.highScore) elements.highScore.textContent = StorageModule.getHighScore(); },
    get: () => elements
  };
})();

// ===== GAME STATE =====
const GameState = (() => {
  let state = {
    level: null,
    totalCards: 0,
    remainingTime: 0,
    score: 0,
    matched: 0,
    selected: [],
    isPaused: false,
    timerId: null
  };

  return {
    get: (k) => state[k],
    set: (k,v) => { state[k]=v; },
    resetForLevel: (level, cards, time) => {
      state.level = level; state.totalCards = cards; state.remainingTime = time; state.score = 0; state.matched = 0; state.selected = []; state.isPaused = false; if (state.timerId) clearInterval(state.timerId); state.timerId = null;
    }
  };
})();

// ===== CONFIG =====
const CONFIG = {
  easy: {cards:16, time:60},
  medium: {cards:36, time:120},
  hard: {cards:64, time:150}
};

// ===== GAME ENGINE =====
const GameEngine = (() => {
  const shuffle = (a) => { for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };

  const createBoard = (level) => {
    const cfg = CONFIG[level];
    GameState.resetForLevel(level, cfg.cards, cfg.time);
    UIModule.clearBoard();
    UIModule.setGridCols(Math.sqrt(cfg.cards));
    UIModule.setBoardClass(level);

    // build pairs
    const arr = [];
    for (let i=1;i<=cfg.cards/2;i++){ arr.push(i); arr.push(i); }
    shuffle(arr);

    arr.forEach(v => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.value = v;
      card.innerHTML = `<div class="inner"><div class="front">🎮</div><div class="back">${v}</div></div>`;
      card.addEventListener('click', () => onCardClick(card));
      UIModule.appendCard(card);
    });

    // init UI stats and progress
    UIModule.updateStats(0, cfg.time, 0);
    ProgressModule.start(cfg.time);
  };

  const onCardClick = (card) => {
    if (GameState.get('isPaused')) return;
    const selected = GameState.get('selected');
    if (!card || card.classList.contains('flipped')) return;
    if (selected.length === 2) return;

    AudioModule.play('flip');
    card.classList.add('flipped');
    selected.push(card);
    GameState.set('selected', selected);

    if (selected.length === 2) {
      checkMatch();
    }
  };

  const checkMatch = () => {
    const [c1,c2] = GameState.get('selected');
    GameState.set('isPaused', true);
    if (c1.dataset.value === c2.dataset.value) {
      AudioModule.play('match');
      // mark matched
      c1.classList.add('matched'); c2.classList.add('matched');
      GameState.set('score', GameState.get('score') + 10);
      GameState.set('matched', GameState.get('matched') + 2);
      GameState.set('selected', []);
      GameState.set('isPaused', false);
      UIModule.updateStats(GameState.get('score'), GameState.get('remainingTime'), GameState.get('matched'));

      if (GameState.get('matched') === GameState.get('totalCards')) {
        // level complete
        clearTimer();
        AudioModule.play('win');
        StorageModule.setHighScore(Math.max(StorageModule.getHighScore(), GameState.get('score')));
        UIModule.updateHighScore();
        ModalModule.showCongrats(GameState.get('score'), `Level complete! Score: ${GameState.get('score')}`);
      }
    } else {
      AudioModule.play('wrong');
      setTimeout(() => {
        c1.classList.remove('flipped'); c2.classList.remove('flipped');
        GameState.set('selected', []);
        GameState.set('isPaused', false);
      }, 600);
    }
  };

  const startTimer = () => {
    clearTimer();
    const tick = () => {
      if (GameState.get('isPaused')) return;
      const rem = GameState.get('remainingTime') - 1;
      GameState.set('remainingTime', rem);
      UIModule.updateStats(GameState.get('score'), rem, GameState.get('matched'));
      ProgressModule.update(rem);
      if (rem <= 0) {
        clearTimer();
        GameState.set('isPaused', true);
        ModalModule.showCongrats(GameState.get('score'), `Time over! Score: ${GameState.get('score')}`);
      }
    };
    const id = setInterval(tick, 1000);
    GameState.set('timerId', id);
  };

  const clearTimer = () => { const id = GameState.get('timerId'); if (id) clearInterval(id); GameState.set('timerId', null); };

  const pause = () => { GameState.set('isPaused', !GameState.get('isPaused')); };

  return { createBoard, startTimer, pause, clearTimer };
})();

// ===== ADDITIONAL MODULES =====
// Progress module
const ProgressModule = (() => {
  const el = document.getElementById('timeProgress');
  let total = 0;
  return {
    start: (secs) => { total = secs; if (el) el.style.width = '100%'; },
    update: (remaining) => { if (!el || !total) return; const pct = Math.max(0, Math.min(100, Math.round((remaining/total)*100))); el.style.width = pct + '%'; }
  };
})();

// Modal module
const ModalModule = (() => {
  const congrats = document.getElementById('congratsModal');
  const congratsMessage = document.getElementById('congratsMessage');
  const settings = document.getElementById('settingsModal');

  return {
    showCongrats: (score, msg) => { if (congratsMessage) congratsMessage.textContent = msg || `Score: ${score}`; if (congrats) congrats.classList.remove('hidden'); },
    hideCongrats: () => { if (congrats) congrats.classList.add('hidden'); },
    showSettings: () => { if (settings) settings.classList.remove('hidden'); },
    hideSettings: () => { if (settings) settings.classList.add('hidden'); }
  };
})();

// Settings module
const SettingsModule = (() => {
  const cardBackSelect = document.getElementById('cardBackSelect');
  const soundBtn = document.getElementById('settingsSound');
  const themeBtn = document.getElementById('settingsTheme');

  const init = () => {
    if (cardBackSelect) cardBackSelect.onchange = () => { document.querySelectorAll('.front').forEach(f => f.textContent = cardBackSelect.value); };
    if (soundBtn) soundBtn.onclick = () => { AudioModule.toggleMute(); soundBtn.textContent = AudioModule.isMuted() ? '🔇' : '🔊'; document.querySelectorAll('#soundToggle, #soundToggleStart').forEach(b=>{ if(b) b.textContent = AudioModule.isMuted() ? '🔇' : '🔊'; }); };
    if (themeBtn) themeBtn.onclick = () => { document.body.classList.toggle('alt-theme'); themeBtn.textContent = document.body.classList.contains('alt-theme') ? '☀️' : '🌙'; };
    const close = document.getElementById('settingsClose'); if (close) close.onclick = () => ModalModule.hideSettings();
  };
  return { init };
})();

// Notification (toast)
const NotificationModule = (() => {
  const show = (text, time = 2000) => {
    const t = document.createElement('div'); t.className = 'toast-msg'; t.textContent = text; document.body.appendChild(t);
    setTimeout(()=> t.classList.add('show'), 10);
    setTimeout(()=> { t.classList.remove('show'); setTimeout(()=> t.remove(),300); }, time);
  };
  return { show };
})();

// ===== BOOT / EVENTS =====
document.addEventListener('DOMContentLoaded', () => {
  // wire buttons
  document.querySelectorAll('.level').forEach(b => b.addEventListener('click', (e)=>{ const lvl = b.dataset.level; GameEngine.createBoard(lvl); GameEngine.startTimer(); UIModule.showScreen('game'); UIModule.setLevelDisplay(lvl); }));
  const start = document.getElementById('startBtn'); if (start) start.addEventListener('click', ()=> UIModule.showScreen('level'));
  const pause = document.getElementById('pauseBtn'); if (pause) pause.addEventListener('click', ()=> { GameEngine.pause(); pause.textContent = GameState.get('isPaused') ? '⏯ Resume' : '⏸ Pause'; });
  const restart = document.getElementById('restartBtn'); if (restart) restart.addEventListener('click', ()=> { const lvl = GameState.get('level') || 'easy'; GameEngine.createBoard(lvl); GameEngine.startTimer(); });
  const back = document.getElementById('backBtn'); if (back) back.addEventListener('click', ()=> { GameEngine.clearTimer(); UIModule.showScreen('level'); });

  const backFromLevel = document.getElementById('backFromLevel'); if (backFromLevel) backFromLevel.addEventListener('click', ()=> { UIModule.showScreen('start'); });

  // sound toggles
  document.querySelectorAll('#soundToggle,#soundToggleStart').forEach(btn => { if (btn) btn.addEventListener('click', ()=> { AudioModule.toggleMute(); btn.textContent = AudioModule.isMuted() ? '🔇' : '🔊'; }); });

  // modal buttons
  const modalRestart = document.getElementById('modalRestart'); if (modalRestart) modalRestart.addEventListener('click', ()=>{ ModalModule.hideCongrats(); const lvl = GameState.get('level') || 'easy'; GameEngine.createBoard(lvl); GameEngine.startTimer(); });
  const modalBack = document.getElementById('modalBack'); if (modalBack) modalBack.addEventListener('click', ()=>{ ModalModule.hideCongrats(); UIModule.showScreen('level'); });

  // level display opens settings
  const lvlDisp = document.getElementById('levelDisplay'); if (lvlDisp) lvlDisp.addEventListener('click', ()=> ModalModule.showSettings());

  SettingsModule.init();
  UIModule.updateHighScore();
  UIModule.showScreen('start');
});


