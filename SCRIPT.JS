// THIS IS JS OF POWER FULL MODE - CLEAN CODE ,DIBUG FREE,REMOVE LET CONST VAR ERROR
"use strict";

// SOUND
const flipSound = document.getElementById("s_flip");
const matchSound = document.getElementById("s_match");
const wrongSound = document.getElementById("s_wrong");
const winSound = document.getElementById("s_win");

// SCREEN ELEMENTS
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


// VARIABLES
let score = 0;
let timer = 0;
let remainingTime = 0;
// THIS IS STORE THE SETINTERVAL ID AND SAVE DUPLICATE TIME
let interval = null; 
let matchedCount = 0;
// STORE THE CURRENTLY FLIP CARD AND MAX 2 CARD STORE
let selected = [];
// USER WHICH LEVEL PLAY
let currentLevel = null;

// STORE THE ON OFF BOTTON   
let isPaused = false;     
// IF WRONG CARD FLIP THEN LOCK THE INPUT
let isInputLocked = false; 

// LEVEL CARD COUNTS
const levelConfig = {
    easy: 16,
    medium: 36,
    hard: 64
};
// LEVEL TIMER
const timerConfig = {
    easy: 60,
    medium: 90,
    hard: 120
};

// START
startBtn.onclick = () => {
    // IN CSS HIDEEN -> DISPLAY NONE
    startScreen.classList.add("hidden");
    // REMOVE THE HIDDEN CLASS
    // SHOW THE LEVEL SCREEN
    levelScreen.classList.remove("hidden");
};

// SELECT LEVEL
// SELECT ALL LEVEL USE FOR EACH LOOP AND ALL BOOTON ADD EVENT
document.querySelectorAll(".level").forEach(btn => {
    btn.onclick = () => startGame(btn.dataset.level);
});

// START GAME FUNCTION
function startGame(level) {
    // USER CHOSE LEVEL
    currentLevel = level;

    remainingTime = timerConfig[level];
    // TIMER SET = LEVEL

    resetGame();

    // LEVEL SCREEN HIDE 
    levelScreen.classList.add("hidden");
    // GAME SCREEN SHOW
    gameScreen.classList.remove("hidden");

    // CREATE THE BOARD GRID
    createBoard(levelConfig[level]);
    // START TIMER
    startTimer();
}


// RESET GAME
function resetGame() {
    score = 0;
    matchedCount = 0;
    // TWO FLIP CARD OF ARRAY EMPTY
    selected = [];
    isPaused = false;
    // MISMATCH LOCK /TIME OVER/WIN LOCK
    isInputLocked = false;

    // OLDER TIME DEL
    clearInterval(interval);

    // SHOW TIMER
    timer = remainingTime;
    // UPDATE UI SCORE
    scoreEl.textContent = score;
    // UPDATE UI TIME
    timeEl.textContent = timer;
    // SHOW HOW MANY CARDS HAVE BEEN SUCCESFULLY MATCHED SO FAR
    matchesEl.textContent = matchedCount;

    // CLEAN OLDER CARD
    board.innerHTML = "";
    // LEVEL COMP ->TIME OVER MSG HIDE
    message.classList.add("hidden");

    // RESET THE PAUSE BOTTON
    pauseBtn.textContent = "Pause";
}
// CREATE BOARDS
function createBoard(total) {
    // REMOVE THE BEFORE CLASS LEVEL
    board.classList.remove("easy", "medium", "hard");
    // ADD NEW LEVEL
    board.classList.add(currentLevel);

    // STORE THE CARD VALUE
    let arr = [];

    // USING LOOP DIV BY 2 BEACAUSE MATCH PAIR CARD
    for (let i = 1; i <= total / 2; i++) {
        arr.push(i, i);
    }

    // PAIR THE RANDOM POSITION FIX
    arr = shuffle(arr);

// SET THE NO OF THE COLUMNS
    let cols = Math.sqrt(total);
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    arr.forEach(value => {
        const card = document.createElement("div");
        // CREATE NEW DIV CARD
        card.className = "card";
        // SET THE MATCHING CARD VALUE
        card.dataset.value = value;

        // THIS STRUCTURE BASE ON CSS FLIP ANIMATION
        // CREATE THE CARD FRONT AND BAC
        card.innerHTML = `
            <div class="inner">
                <div class="front">?</div>
                <div class="back">${value}</div>
            </div>
            
        `;

        // IF CARD FLIP BUT INPUT LOCKED HONE PR CARD NOT FLIP
        card.onclick = () => {
            if (!isInputLocked) flipCard(card);
        };

        // ALL CARD ARRANGE IN GRID
        // ADD TWO CARD IN BOARD
        board.appendChild(card);
    });
    
    
}

// fFLIP CARD
function flipCard(card) {
    // IF GAME PAUSE CARD NOT FLIP
    if (isPaused) return;  
    // IF WRONG MATCHH THEN 600MS LETTER THEN FLIP BLOCK
    if (isInputLocked) return; 
    // STOP TWO TIME FLIP CARD
    if (card.classList.contains("flipped")) return;
    // ONE TIME TWO CARD FLIP
    if (selected.length === 2) return;

    // START SOUND
    flipSound.play();
    // CSS 3D ROTATE
    card.classList.add("flipped");
    // AFTER FLIP THE ADD EMPTY ARRAY
    selected.push(card);

    // IF TWO CARD FLIP THE CHECK MATCH RUN
    if (selected.length === 2) checkMatch();
}

// CHECK MATCH
function checkMatch() {
    const [c1, c2] = selected;

    // FIRST CARD MATCH THEN NEXT CARD FLIP
    isInputLocked = true;

    
    // MATCH CASES-
    if (c1.dataset.value === c2.dataset.value) {
        matchSound.play();

        score += 10;
        matchedCount += 2;
// UI UPDATE
        scoreEl.textContent = score;
        matchesEl.textContent = matchedCount;
// EMPTY ARRAY THEN CARD FLIP
        selected = [];
        isInputLocked = false;

        
        // WIN CONDITION
        if (matchedCount === levelConfig[currentLevel]) {
            winSound.play();
            clearInterval(interval);
            isInputLocked = true;
            message.textContent = "🎉 Level Complete!";
            message.classList.remove("hidden");
        }

    } else {
        // WRONG CASE(MISMATCH)
        wrongSound.play();
        setTimeout(() => {
            c1.classList.remove("flipped");
            c2.classList.remove("flipped");
            selected = [];
            isInputLocked = false;
            // 600 MS AFTER CARD FLIP
        }, 600);
    }
}

// TIMER
// OLDER TIME BAND
function startTimer() {
    clearInterval(interval);

    // FUN RUN IN EACH SECOND
    // AFTER PAUSE THEN TIMER STOP
    interval = setInterval(() => {
        if (isPaused) return;

        // TIME = TIME-1
        remainingTime--;
        // UPDATE SCREEN TIME
        timeEl.textContent = remainingTime;


// TIME OVER CASE
        if (remainingTime <= 0) {
            clearInterval(interval);
            isInputLocked = true;
            message.textContent = "⏳ Time Over!";
            message.classList.remove("hidden");
        }
    }, 1000);

}
// SHUFFLE
//    Shuffle = swapping array elements from the end to the beginning with random positions so the entire deck gets perfectly mixed.
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
// BUTTONS
// PAUSE BTN
pauseBtn.onclick = () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "Resume" : "Pause";

    if (!isPaused) startTimer();
};
// RESTART BTN
restartBtn.onclick = () => {
    remainingTime = timerConfig[currentLevel];
    startGame(currentLevel);
};
// BACK BTN
backBtn.onclick = () => {
    clearInterval(interval);
    gameScreen.classList.add("hidden");
    levelScreen.classList.remove("hidden");
    message.classList.add("hidden");
};


