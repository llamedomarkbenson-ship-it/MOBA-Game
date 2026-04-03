const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== PLAYER =====
const player = {
  x: 100,
  y: canvas.height / 2,
  size: 20,
  color: "cyan",
  hp: 100,
  maxHp: 100,
  gold: 0,
  alive: true
};

// ===== ENEMY =====
const enemy = {
  x: canvas.width - 100,
  y: canvas.height / 2,
  size: 20,
  color: "red",
  hp: 100,
  maxHp: 100,
  alive: true
};

// ===== JOYSTICK =====
let joystick = {
  active: false,
  x: 0,
  y: 0,
  dx: 0,
  dy: 0
};

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  joystick.active = true;
  joystick.x = t.clientX;
  joystick.y = t.clientY;
});

canvas.addEventListener("touchmove", e => {
  if (!joystick.active) return;

  const t = e.touches[0];
  joystick.dx = t.clientX - joystick.x;
  joystick.dy = t.clientY - joystick.y;
});

canvas.addEventListener("touchend", () => {
  joystick.active = false;
  joystick.dx = 0;
  joystick.dy = 0;
});

// ===== KEYBOARD =====
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ===== MINIONS =====
let minions = [];

setInterval(() => {
  minions.push({ x: 100, y: canvas.height/2, hp: 30, team: "blue" });
  minions.push({ x: canvas.width-100, y: canvas.height/2, hp: 30, team: "red" });
}, 3000);

// ===== MOVEMENT =====
function movePlayer() {
  if (!player.alive) return;

  // keyboard
  if (keys["w"]) player.y -= 4;
  if (keys["s"]) player.y += 4;
  if (keys["a"]) player.x -= 4;
  if (keys["d"]) player.x += 4;

  // joystick
  player.x += joystick.dx * 0.05;
  player.y += joystick.dy * 0.05;
}

// ===== ENEMY AI =====
function moveEnemy() {
  if (!enemy.alive) return;

  if (enemy.x > player.x) enemy.x -= 1;
  if (enemy.x < player.x) enemy.x += 1;
  if (enemy.y > player.y) enemy.y -= 1;
  if (enemy.y < player.y) enemy.y += 1;
}

// ===== ATTACK =====
function attack() {
  if (!player.alive || !enemy.alive) return;

  const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
  if (dist < 50) enemy.hp -= 1;
}

// ===== SKILL =====
function castSkill() {
  if (!player.alive || !enemy.alive) return;

  const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
  if (dist < 120) enemy.hp -= 5;
}

// ===== MINIONS =====
function updateMinions() {
  minions.forEach(m => {
    m.x += m.team === "blue" ? 1 : -1;

    minions.forEach(other => {
      if (m !== other && m.team !== other.team) {
        if (Math.hypot(m.x - other.x, m.y - other.y) < 20) {
          other.hp -= 0.2;
        }
      }
    });
  });

  minions = minions.filter(m => m.hp > 0);
}

// ===== DEATH & RESPAWN =====
function checkDeath() {
  if (player.hp <= 0 && player.alive) {
    player.alive = false;
    setTimeout(() => {
      player.hp = player.maxHp;
      player.x = 100;
      player.y = canvas.height / 2;
      player.alive = true;
    }, 3000);
  }

  if (enemy.hp <= 0 && enemy.alive) {
    enemy.alive = false;
    player.gold += 20;

    setTimeout(() => {
      enemy.hp = enemy.maxHp;
      enemy.x = canvas.width - 100;
      enemy.y = canvas.height / 2;
      enemy.alive = true;
    }, 3000);
  }
}

// ===== DRAW =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  if (player.alive) {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
  }

  // Enemy
  if (enemy.alive) {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
  }

  // Minions
  minions.forEach(m => {
    ctx.fillStyle = m.team === "blue" ? "lightblue" : "pink";
    ctx.fillRect(m.x, m.y, 10, 10);
  });

  // HP bars
  ctx.fillStyle = "green";
  ctx.fillRect(player.x, player.y - 10, player.hp, 5);
  ctx.fillRect(enemy.x, enemy.y - 10, enemy.hp, 5);

  // Joystick visual
  if (joystick.active) {
    ctx.beginPath();
    ctx.arc(joystick.x, joystick.y, 30, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(joystick.x + joystick.dx, joystick.y + joystick.dy, 15, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }

  // UI
  ctx.fillStyle = "white";
  ctx.fillText("Gold: " + player.gold, 20, 20);
  ctx.fillText("Tap = Move | Q = Skill", 20, 40);

  if (!player.alive) {
    ctx.fillText("You Died! Respawning...", canvas.width/2 - 80, canvas.height/2);
  }
}

// ===== LOOP =====
function gameLoop() {
  movePlayer();
  moveEnemy();
  updateMinions();
  checkDeath();

  if (keys[" "]) attack();
  if (keys["q"]) castSkill();

  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
