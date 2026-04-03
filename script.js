const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== IMAGES =====
const playerImg = new Image();
playerImg.src = "https://i.imgur.com/1bX5QH6.png";

const enemyImg = new Image();
enemyImg.src = "https://i.imgur.com/3fJ1P3b.png";

// ===== PLAYER =====
const player = {
  x: 100,
  y: canvas.height/2,
  hp: 100,
  maxHp: 100,
  speed: 3,
  baseSpeed: 3,
  alive: true,
  target: null,
  targetEnemy: null,
  buffed: false
};

const enemy = {
  x: canvas.width - 100,
  y: canvas.height/2,
  hp: 100,
  alive: true
};

// ===== ARRAYS =====
let projectiles = [];
let effects = [];

// ===== CLICK SYSTEM =====
canvas.addEventListener("mousedown", e => {
  const mx = e.clientX;
  const my = e.clientY;

  const distToEnemy = Math.hypot(mx - enemy.x, my - enemy.y);

  if (distToEnemy < 40) {
    // TARGET ENEMY
    player.targetEnemy = enemy;
  } else {
    // MOVE
    player.target = { x: mx, y: my };
    player.targetEnemy = null;
  }
});

// ===== MOVE PLAYER =====
function movePlayer() {
  if (!player.target) return;

  const dx = player.target.x - player.x;
  const dy = player.target.y - player.y;
  const dist = Math.hypot(dx, dy);

  if (dist < player.speed) {
    player.target = null;
  } else {
    player.x += (dx / dist) * player.speed;
    player.y += (dy / dist) * player.speed;
  }
}

// ===== AUTO ATTACK =====
function autoAttack() {
  if (!player.targetEnemy || !enemy.alive) return;

  const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

  if (dist < 120) {
    enemy.hp -= 0.2;
  }
}

// ===== ENEMY AI =====
function moveEnemy() {
  if (!enemy.alive) return;

  const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

  if (dist > 50) {
    enemy.x += (player.x - enemy.x) * 0.01;
    enemy.y += (player.y - enemy.y) * 0.01;
  } else {
    player.hp -= 0.2;
  }
}

// ===== SKILLS =====
let cooldowns = { Q:0, W:0, E:0, R:0 };

document.addEventListener("keydown", e => {
  const key = e.key.toUpperCase();
  const now = Date.now();

  if (key === "Q" && now > cooldowns.Q) {
    castQ();
    cooldowns.Q = now + 2000;
  }

  if (key === "W" && now > cooldowns.W) {
    castW();
    cooldowns.W = now + 5000;
  }

  if (key === "E" && now > cooldowns.E) {
    castE();
    cooldowns.E = now + 4000;
  }

  if (key === "R" && now > cooldowns.R) {
    castR();
    cooldowns.R = now + 10000;
  }
});

// ===== Q: ARROW =====
function castQ(){
  if (!player.targetEnemy) return;

  const dmg = player.buffed ? 20 : 10;

  projectiles.push({
    x: player.x,
    y: player.y,
    target: player.targetEnemy,
    speed: 6,
    dmg: dmg
  });
}

// ===== W: SPEED BUFF =====
function castW(){
  player.speed = player.buffed ? 7 : 5;

  effects.push({
    x: player.x,
    y: player.y,
    type: "speed",
    timer: 60
  });

  setTimeout(() => {
    player.speed = player.baseSpeed;
  }, 2000);
}

// ===== E: HEAL =====
function castE(){
  const heal = player.buffed ? 40 : 20;

  player.hp = Math.min(player.maxHp, player.hp + heal);

  effects.push({
    x: player.x,
    y: player.y,
    type: "heal",
    timer: 60
  });
}

// ===== R: ULTIMATE =====
function castR(){
  player.buffed = true;

  effects.push({
    x: player.x,
    y: player.y,
    type: "ultimate",
    timer: 120
  });

  setTimeout(() => {
    player.buffed = false;
  }, 5000);
}

// ===== PROJECTILES =====
function updateProjectiles(){
  projectiles.forEach((p,i)=>{
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const dist = Math.hypot(dx, dy);

    p.x += (dx/dist) * p.speed;
    p.y += (dy/dist) * p.speed;

    if(dist < 10){
      enemy.hp -= p.dmg;
      projectiles.splice(i,1);
    }
  });
}

// ===== DRAW =====
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Player
  ctx.drawImage(playerImg, player.x-20, player.y-20, 40, 40);

  // Enemy
  if(enemy.alive){
    ctx.drawImage(enemyImg, enemy.x-20, enemy.y-20, 40, 40);
  }

  // Target circle
  if(player.targetEnemy){
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, 30, 0, Math.PI*2);
    ctx.strokeStyle = "red";
    ctx.stroke();
  }

  // Projectiles
  projectiles.forEach(p=>{
    ctx.fillStyle="cyan";
    ctx.fillRect(p.x, p.y, 6, 6);
  });

  // Effects
  effects.forEach((e,i)=>{
    ctx.beginPath();
    ctx.arc(e.x, e.y, 30, 0, Math.PI*2);

    if(e.type==="heal") ctx.fillStyle="green";
    if(e.type==="speed") ctx.fillStyle="yellow";
    if(e.type==="ultimate") ctx.fillStyle="purple";

    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;

    e.timer--;
    if(e.timer<=0) effects.splice(i,1);
  });

  // HP bars
  ctx.fillStyle="green";
  ctx.fillRect(player.x-20, player.y-30, player.hp*0.4,5);
  ctx.fillRect(enemy.x-20, enemy.y-30, enemy.hp*0.4,5);

  // UI
  ctx.fillStyle="white";
  ctx.fillText("Q: Arrow | W: Speed | E: Heal | R: Ultimate", 20, 20);
}

// ===== GAME LOOP =====
function gameLoop(){
  movePlayer();
  moveEnemy();
  autoAttack();
  updateProjectiles();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
