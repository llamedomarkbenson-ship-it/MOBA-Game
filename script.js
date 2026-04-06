const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== IMAGES =====
const playerImg = new Image();
playerImg.src = "https://i.imgur.com/1bX5QH6.png";

const enemyImg = new Image();
enemyImg.src = "https://i.imgur.com/3fJ1P3b.png";

// ===== SOUNDS =====
const sounds = {
  attack: new Audio("https://www.soundjay.com/mechanical/sounds/mechanical-clonk-1.mp3"),
  hit: new Audio("https://www.soundjay.com/button/sounds/button-16.mp3"),
  death: new Audio("https://www.soundjay.com/misc/sounds/fail-buzzer-02.mp3"),
  heal: new Audio("https://www.soundjay.com/button/sounds/button-3.mp3"),
  speed: new Audio("https://www.soundjay.com/button/sounds/button-09.mp3"),
  ultimate: new Audio("https://www.soundjay.com/button/sounds/button-10.mp3"),
  bgm: new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")
};

sounds.bgm.loop = true;
sounds.bgm.volume = 0.3;

// Start music on first key press
document.addEventListener("keydown", () => {
  sounds.bgm.play().catch(() => {});
}, { once: true });

function playSound(sound) {
  const s = sound.cloneNode();
  s.volume = 0.4;
  s.play();
}

// ===== PLAYER =====
const player = {
  x: 100,
  y: canvas.height / 2,
  hp: 100,
  maxHp: 100,
  speed: 5,
  baseSpeed: 5,
  alive: true
};

// ===== GAME STATE =====
let enemies = [];
let projectiles = [];
let lootItems = [];

let wave = 1;
let score = 0;
let gold = 0;
let waveTextTimer = 0;
let gameOver = false;

let skillLevel = 1;

// ===== INPUT =====
let keys = {};

document.addEventListener("keydown", e => {
  const key = e.key;

  keys[key] = true;

  if (key === "w" || key === "W") castW();
  if (key === "e" || key === "E") castE();
  if (key === "r" || key === "R") castR();
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;
});

// ===== MOVEMENT (ARROW KEYS) =====
function movePlayer() {
  let dx = 0;
  let dy = 0;

  if (keys["ArrowUp"]) dy -= 1;
  if (keys["ArrowDown"]) dy += 1;
  if (keys["ArrowLeft"]) dx -= 1;
  if (keys["ArrowRight"]) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const dist = Math.hypot(dx, dy);
    dx /= dist;
    dy /= dist;

    player.x += dx * player.speed;
    player.y += dy * player.speed;
  }
}

// ===== AUTO TARGET =====
function getNearestEnemy() {
  let nearest = null;
  let minDist = Infinity;

  enemies.forEach(enemy => {
    if (!enemy.alive) return;

    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  });

  return nearest;
}

// ===== SKILLS =====
function castW() {
  player.speed = 8;
  playSound(sounds.speed);
  setTimeout(() => player.speed = player.baseSpeed, 2000);
}

function castE() {
  player.hp = Math.min(player.maxHp, player.hp + 20);
  playSound(sounds.heal);
}

function castR() {
  enemies.forEach(e => e.stunned = true);
  playSound(sounds.ultimate);
  setTimeout(() => enemies.forEach(e => e.stunned = false), 3000);
}

// ===== Q ATTACK =====
let lastAttackTime = 0;

function castQ() {
  const now = Date.now();

  const attackSpeed = 120 - (skillLevel * 10);
  const damage = 10 + (skillLevel * 5);

  if (now - lastAttackTime < attackSpeed) return;
  lastAttackTime = now;

  const target = getNearestEnemy();
  if (!target) return;

  projectiles.push({
    x: player.x,
    y: player.y,
    target: target,
    speed: 6,
    dmg: damage
  });

  playSound(sounds.attack);
}

// ===== WAVE =====
function spawnWave() {
  enemies = [];

  const isBossWave = wave % 5 === 0;
  const count = isBossWave ? 1 : wave + 2;

  for (let i = 0; i < count; i++) {
    enemies.push({
      x: canvas.width - 100 - (i % 5) * 60,
      y: 100 + Math.floor(i / 5) * 80,
      hp: isBossWave ? 500 : 80 + wave * 20,
      maxHp: isBossWave ? 500 : 80 + wave * 20,
      alive: true,
      stunned: false,
      isBoss: isBossWave
    });
  }

  waveTextTimer = 120;
}

// ===== WAVE CHECK =====
function checkWaveClear() {
  const aliveEnemies = enemies.filter(e => e.alive);

  if (aliveEnemies.length === 0 && enemies.length > 0) {
    wave++;
    enemies = [];

    setTimeout(() => spawnWave(), 1000);
  }
}

// ===== LOOT =====
function checkLootPickup() {
  lootItems.forEach((loot, i) => {
    const dist = Math.hypot(player.x - loot.x, player.y - loot.y);

    if (dist < 30) {
      if (loot.type === "skill") skillLevel++;
      lootItems.splice(i, 1);
    }
  });
}

// ===== ENEMIES =====
function moveEnemies() {
  enemies.forEach(enemy => {
    if (!enemy.alive || enemy.stunned) return;

    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    if (dist > 50) {
      enemy.x += (player.x - enemy.x) * 0.01;
      enemy.y += (player.y - enemy.y) * 0.01;
    } else {
      player.hp -= 0.2;

      if (player.hp <= 0) {
        player.hp = 0;
        gameOver = true;
      }
    }
  });
}

// ===== PROJECTILES =====
function updateProjectiles() {
  projectiles.forEach((p, i) => {
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const dist = Math.hypot(dx, dy);

    p.x += (dx / dist) * p.speed;
    p.y += (dy / dist) * p.speed;

    if (dist < 10) {
      if (p.target.alive) {
        p.target.hp -= p.dmg;
        playSound(sounds.hit);

        if (p.target.hp <= 0) {
          p.target.alive = false;
          score += p.target.isBoss ? 100 : 10;
          gold += p.target.isBoss ? 50 : 5;

          if (p.target.isBoss) {
            lootItems.push({ x: p.target.x, y: p.target.y, type: "skill" });
          }

          playSound(sounds.death);
        }
      }
      projectiles.splice(i, 1);
    }
  });
}

// ===== DRAW =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(playerImg, player.x - 20, player.y - 20, 40, 40);

  enemies.forEach(enemy => {
    if (enemy.alive) {
      ctx.drawImage(enemyImg, enemy.x - 20, enemy.y - 20, 40, 40);
      ctx.fillStyle = "green";
      ctx.fillRect(enemy.x - 20, enemy.y - 30, enemy.hp * 0.4, 5);
    }
  });

  projectiles.forEach(p => {
    ctx.fillStyle = "cyan";
    ctx.fillRect(p.x, p.y, 6, 6);
  });

  lootItems.forEach(loot => {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(loot.x, loot.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "green";
  ctx.fillRect(player.x - 20, player.y - 30, player.hp * 0.4, 5);

  ctx.fillStyle = "white";
  ctx.textAlign = "right";
  ctx.fillText("Score: " + score, canvas.width - 20, 30);
  ctx.fillText("Wave: " + wave, canvas.width - 20, 60);
  ctx.fillText("Gold: " + gold, canvas.width - 20, 90);
  ctx.fillText("Skill Lv: " + skillLevel, canvas.width - 20, 120);
  ctx.textAlign = "left";

  if (waveTextTimer > 0) {
    ctx.fillStyle = "red";
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.fillText(wave % 5 === 0 ? "BOSS WAVE" : "WAVE " + wave, canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
    waveTextTimer--;
  }
}

// ===== GAME LOOP =====
function gameLoop() {
  if (gameOver) return;

  movePlayer();
  moveEnemies();

  if (keys["q"] || keys["Q"]) {
    castQ();
  }

  updateProjectiles();
  checkWaveClear();
  checkLootPickup();

  draw();

  requestAnimationFrame(gameLoop);
}

// ===== START =====
spawnWave();
gameLoop();
