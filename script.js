const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== LOAD IMAGES =====
const playerImg = new Image();
playerImg.src = "https://i.imgur.com/1bX5QH6.png";

const enemyImg = new Image();
enemyImg.src = "https://i.imgur.com/3fJ1P3b.png";

// ===== PLAYER & ENEMY =====
const player = { x: 100, y: canvas.height / 2, size: 40, hp: 100, maxHp: 100, alive: true, speed: 4, target: null };
const enemy = { x: canvas.width - 100, y: canvas.height / 2, size: 40, hp: 100, maxHp: 100, alive: true };

// ===== MOUSE EVENTS =====
// Right-click to move the hero
canvas.addEventListener("mousedown", e => {
  if (e.button === 2) { // Right-click for movement
    player.target = { x: e.clientX, y: e.clientY };
  }
  // Left-click to cast skill or select hero
  if (e.button === 0) {
    // If near the enemy, cast a skill or attack
    if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 60) {
      attackEnemy();
    }
  }
});

// ===== MOVE PLAYER TOWARD TARGET =====
function movePlayer() {
  if (!player.target) return;

  const dx = player.target.x - player.x;
  const dy = player.target.y - player.y;
  const dist = Math.hypot(dx, dy);

  if (dist < player.speed) {
    player.x = player.target.x;
    player.y = player.target.y;
    player.target = null;
  } else {
    player.x += (dx / dist) * player.speed;
    player.y += (dy / dist) * player.speed;
  }
}

// ===== ENEMY AI =====
function moveEnemy() {
  if (!enemy.alive) return;
  const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
  if (dist > 60) {
    enemy.x += (player.x - enemy.x) * 0.01;
    enemy.y += (player.y - enemy.y) * 0.01;
  } else {
    player.hp -= 0.3;
  }
}

// ===== ATTACK FUNCTION =====
function attackEnemy() {
  if (enemy.alive && Math.hypot(player.x - enemy.x, player.y - enemy.y) < 60) {
    enemy.hp -= 5;  // Deal damage to enemy
  }
}

// ===== SKILL SYSTEM (QWER) =====
const skills = {
  Q: { dmg: 10, range: 100, cooldown: 2000, lastCast: 0, color: "cyan" },
  W: { dmg: 15, range: 120, cooldown: 3000, lastCast: 0, color: "yellow" },
  E: { dmg: 5, passive: true, color: "purple" },
  R: { dmg: 30, range: 200, cooldown: 8000, lastCast: 0, color: "red" }
};

let skillEffects = [];

// ===== CAST SKILL =====
function castSkill(key) {
  const skill = skills[key];
  const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
  if (dist <= skill.range && enemy.alive) {
    enemy.hp -= skill.dmg;
    skillEffects.push({ x: enemy.x, y: enemy.y, color: skill.color, radius: 10, maxRadius: 50 });
  }
}

// ===== HANDLE KEYS (QWER Skills) =====
document.addEventListener("keydown", e => {
  const now = Date.now();
  const key = e.key.toUpperCase();
  if (skills[key]) {
    if (skills[key].passive) return;
    if (now - skills[key].lastCast >= skills[key].cooldown) {
      castSkill(key);
      skills[key].lastCast = now;
    }
  }
});

// ===== MINIONS & GAME LOGIC =====
function updateMinions() {
  // Handle minion logic here if required (you can add minions in the future)
}

// ===== DRAW GAME STATE =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw player and enemy
  if (player.alive) ctx.drawImage(playerImg, player.x - 20, player.y - 20, 40, 40);
  if (enemy.alive) ctx.drawImage(enemyImg, enemy.x - 20, enemy.y - 20, 40, 40);

  // Draw skill effects (expanding circles)
  skillEffects.forEach((s, i) => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
    s.radius += 2;
    if (s.radius >= s.maxRadius) skillEffects.splice(i, 1);
  });

  // Draw HP bars
  ctx.fillStyle = "green";
  ctx.fillRect(player.x - 20, player.y - 30, player.hp * 0.4, 5);
  ctx.fillRect(enemy.x - 20, enemy.y - 30, enemy.hp * 0.4, 5);

  // Draw skill cooldowns on HUD
  const hudX = 20;
  const hudY = canvas.height - 90;
  ["Q", "W", "E", "R"].forEach((key, i) => {
    const skill = skills[key];
    ctx.fillStyle = skill.color;
    ctx.fillRect(hudX + i * 80, hudY, 60, 60);
    ctx.fillStyle = "white";
    ctx.fillText(key, hudX + i * 80 + 22, hudY + 35);

    // Cooldown overlay
    const now = Date.now();
    if (skill.cooldown && now - skill.lastCast < skill.cooldown) {
      const ratio = (now - skill.lastCast) / skill.cooldown;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(hudX + i * 80, hudY, 60, 60 * (1 - ratio));
    }
  });
}

// ===== GAME LOOP =====
function gameLoop() {
  movePlayer();
  moveEnemy();
  updateMinions();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
