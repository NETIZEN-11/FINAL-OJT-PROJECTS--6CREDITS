"use strict";

// ----------------------------------
// SOUND
// ----------------------------------
const flipSound = document.getElementById("s_flip");
const matchSound = document.getElementById("s_match");
const wrongSound = document.getElementById("s_wrong");
const winSound = document.getElementById("s_win");

// ----------------------------------
// SCREEN ELEMENTS
// ----------------------------------
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const levelScreen = document.getElementById("levelScreen");
const gameScreen = document.getElementById("gameScreen");

const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const matchesEl = document.getElementById("matches");

const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const backBtn = document.getElementById("backBtn");
const message = document.getElementById("message");

// ----------------------------------
// VARIABLES
// ----------------------------------
let score = 0;
let timer = 0;            // current tick value used by startTimer() (mirrors remainingTime)
let remainingTime = 0;    // NEW: canonical remaining seconds (do not mutate timerConfig)
let interval = null;
let matchedCount = 0;
let selected = [];
let currentLevel = null;
let isPaused = false;

// LEVEL CARD COUNTS
const levelConfig = {
    easy: 16,     // 4x4
    medium: 36,   // 6x6
    hard: 64      // 8x8
};

// LEVEL TIMERS (static defaults — DO NOT MUTATE)
const timerConfig = {
    easy: 60,
    medium: 90,
    hard: 120
};

// ----------------------------------
// START
// ----------------------------------
startBtn.onclick = () => {
    startScreen.classList.add("hidden");
    levelScreen.classList.remove("hidden");
};

// ----------------------------------
// LEVEL SELECT
// ----------------------------------
document.querySelectorAll(".level").forEach(btn => {
    btn.onclick = () => startGame(btn.dataset.level);
});

// ----------------------------------
// START GAME
// ----------------------------------
function startGame(level) {
    currentLevel = level;
    // Initialize remainingTime fresh from the static config (important for restart)
    remainingTime = timerConfig[level];

    resetGame();

    levelScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    let total = levelConfig[level];

    createBoard(total);
    startTimer();
}

// ----------------------------------
// RESET GAME
// ----------------------------------
function resetGame() {
    score = 0;
    matchedCount = 0;
    selected = [];
    isPaused = false;

    // If remainingTime has been set (by startGame), use it; otherwise default to config.
    timer = remainingTime || timerConfig[currentLevel];

    scoreEl.textContent = score;
    timeEl.textContent = timer;
    matchesEl.textContent = matchedCount;

    board.innerHTML = "";
    message.classList.add("hidden");

    clearInterval(interval);
}

// ----------------------------------
// CREATE BOARD
// ----------------------------------
function createBoard(total) {
    // Remove any previous level class to avoid stacking classes
    board.classList.remove("easy", "medium", "hard");
    board.classList.add(currentLevel);

    let arr = [];

    // Perfect pairs
    for (let i = 1; i <= total / 2; i++) {
        arr.push(i, i);
    }

    arr = shuffle(arr);

    // GRID SIZE
    let cols;
    if (total === 16) cols = 4;      // 4×4
    else if (total === 36) cols = 6; // 6×6
    else if (total === 64) cols = 8; // 8×8
    else cols = Math.round(Math.sqrt(total));

    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    arr.forEach(value => {
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.value = value;

        card.innerHTML = `
            <div class="inner">
                <div class="front">?</div>
                <div class="back">${value}</div>
            </div>
        `;

        card.onclick = () => flipCard(card);
        board.appendChild(card);
    });
}

// ----------------------------------
// FLIP CARD
// ----------------------------------
function flipCard(card) {
    if (isPaused) return;
    if (card.classList.contains("flipped")) return;
    if (selected.length === 2) return;

    flipSound.play();
    card.classList.add("flipped");
    selected.push(card);

    if (selected.length === 2) checkMatch();
}

// ----------------------------------
// CHECK MATCH
// ----------------------------------
function checkMatch() {
    const [c1, c2] = selected;

    if (!c1 || !c2) {
        // safety guard
        selected = [];
        return;
    }

    if (c1.dataset.value === c2.dataset.value) {
        matchSound.play();
        score += 10;
        matchedCount += 2;

        scoreEl.textContent = score;
        matchesEl.textContent = matchedCount;

        selected = [];

        if (matchedCount === levelConfig[currentLevel]) {
            winSound.play();
            message.textContent = "🎉 Level Complete!";
            message.classList.remove("hidden");
            clearInterval(interval);
        }

    } else {
        wrongSound.play();
        // temporarily block flipping more cards while waiting
        isPaused = true;
        setTimeout(() => {
            c1.classList.remove("flipped");
            c2.classList.remove("flipped");
            selected = [];
            isPaused = false;
        }, 600);
    }
}

// ----------------------------------
// TIMER
// ----------------------------------
function startTimer() {
    // Use the canonical remainingTime value (which is set at startGame or on pause)
    // Make sure any existing interval is cleared first
    clearInterval(interval);

    // sync timer variable for immediate display
    timer = remainingTime;
    timeEl.textContent = timer;

    interval = setInterval(() => {
        // if paused, don't decrement (guard)
        if (isPaused) return;

        // Decrement both canonical and display variable
        remainingTime = remainingTime - 1;
        timer = remainingTime;

        timeEl.textContent = timer;

        if (timer <= 0) {
            clearInterval(interval);
            message.textContent = "⏳ Time Over!";
            message.classList.remove("hidden");
            // Optionally disable further clicks by setting isPaused true
            isPaused = true;
        }
    }, 1000);
}

// ----------------------------------
// SHUFFLE (Fisher-Yates)
// ----------------------------------
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ----------------------------------
// BUTTONS
// ----------------------------------
pauseBtn.onclick = () => {
    // Toggle paused state for game interactions
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "Resume" : "Pause";

    if (isPaused) {
        // On pausing: stop the interval and keep remainingTime intact
        clearInterval(interval);
        // remainingTime already holds current time (startTimer updates it every tick),
        // so we don't mutate timerConfig anymore.
    } else {
        // On resuming: restart the interval using remainingTime
        startTimer();
    }
};

restartBtn.onclick = () => {
    // Restart should begin fresh with the original configured time
    // startGame will reassign remainingTime = timerConfig[level]
    startGame(currentLevel);
};

backBtn.onclick = () => {
    gameScreen.classList.add("hidden");
    levelScreen.classList.remove("hidden");
    clearInterval(interval);
    // reset UI message if any
    message.classList.add("hidden");
};
