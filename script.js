const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player
const player = {
  x: 100,
  y: canvas.height / 2,
  size: 20,
  color: "cyan",
  hp: 100
};

// Enemy
const enemy = {
  x: canvas.width - 100,
  y: canvas.height / 2,
  size: 20,
  color: "red",
  hp: 100
};

// Controls
const keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Movement
function movePlayer() {
  if (keys["w"]) player.y -= 4;
  if (keys["s"]) player.y += 4;
  if (keys["a"]) player.x -= 4;
  if (keys["d"]) player.x += 4;
}

// Attack
function attack() {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 50) {
    enemy.hp -= 1;
  }
}

// Enemy AI (simple follow)
function moveEnemy() {
  if (enemy.x > player.x) enemy.x -= 1;
  if (enemy.x < player.x) enemy.x += 1;
  if (enemy.y > player.y) enemy.y -= 1;
  if (enemy.y < player.y) enemy.y += 1;
}

// Draw
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // Enemy
  ctx.fillStyle = enemy.color;
  ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

  // HP bars
  ctx.fillStyle = "green";
  ctx.fillRect(player.x, player.y - 10, player.hp, 5);
  ctx.fillRect(enemy.x, enemy.y - 10, enemy.hp, 5);
}

// Game loop
function gameLoop() {
  movePlayer();
  moveEnemy();

  if (keys[" "]) attack();

  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
