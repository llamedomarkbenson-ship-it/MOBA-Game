const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== LOAD HERO & MINION IMAGES =====
const playerImg = new Image();
playerImg.src = "https://i.imgur.com/1bX5QH6.png";

const enemyImg = new Image();
enemyImg.src = "https://i.imgur.com/3fJ1P3b.png";

const blueMinionImg = new Image();
blueMinionImg.src = "https://i.imgur.com/6XWwY4t.png";

const redMinionImg = new Image();
redMinionImg.src = "https://i.imgur.com/dXh9f0k.png";

// ===== PLAYER & ENEMY =====
const player = { x: 100, y: canvas.height/2, size: 40, hp: 100, maxHp: 100, gold: 0, alive: true };
const enemy  = { x: canvas.width-100, y: canvas.height/2, size: 40, hp: 100, maxHp: 100, alive: true };

// ===== TOWERS =====
const towers = [
  { x: 80, y: canvas.height/2, team: "blue", hp: 200 },
  { x: canvas.width-80, y: canvas.height/2, team: "red", hp: 200 }
];

// ===== MINIONS =====
let minions = [];
setInterval(() => {
  minions.push({ x: 120, y: canvas.height/2, hp: 30, team: "blue" });
  minions.push({ x: canvas.width-120, y: canvas.height/2, hp: 30, team: "red" });
}, 2500);

// ===== JOYSTICK =====
let joystick = { active:false, x:0, y:0, dx:0, dy:0 };
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
  joystick.dx = joystick.dy = 0;
});

// ===== KEYBOARD =====
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// ===== ATTACK BUTTON =====
const attackBtn = document.getElementById("attackBtn");
attackBtn.addEventListener("touchstart", attack);
attackBtn.addEventListener("mousedown", attack);

// ===== MOVEMENT =====
function movePlayer() {
  if (!player.alive) return;
  if (keys["w"]) player.y -= 4;
  if (keys["s"]) player.y += 4;
  if (keys["a"]) player.x -= 4;
  if (keys["d"]) player.x += 4;
  player.x += joystick.dx * 0.05;
  player.y += joystick.dy * 0.05;
}

// ===== ENEMY AI =====
function moveEnemy() {
  if (!enemy.alive) return;
  const dist = Math.hypot(player.x-enemy.x, player.y-enemy.y);
  if(dist>60){
    enemy.x += (player.x-enemy.x)*0.01;
    enemy.y += (player.y-enemy.y)*0.01;
  } else { player.hp -= 0.3; }
}

// ===== ATTACK =====
function attack(){
  if(!player.alive) return;
  if(enemy.alive && Math.hypot(player.x-enemy.x, player.y-enemy.y)<60) enemy.hp -= 2;
  minions.forEach(m=>{
    if(m.team==="red" && Math.hypot(player.x-m.x, player.y-m.y)<50) m.hp -= 3;
  });
}

// ===== MINIONS LOGIC =====
function updateMinions(){
  minions.forEach(m=>{
    m.x += m.team==="blue"?1:-1;
    minions.forEach(o=>{
      if(m!==o && m.team!==o.team && Math.abs(m.x-o.x)<15) o.hp-=0.5;
    });
    if(m.team==="blue" && enemy.alive && Math.abs(m.x-enemy.x)<20) enemy.hp-=0.2;
    if(m.team==="red" && player.alive && Math.abs(m.x-player.x)<20) player.hp-=0.2;
  });
  minions = minions.filter(m=>m.hp>0);
}

// ===== TOWER LOGIC =====
function towerLogic(){
  towers.forEach(t=>{
    minions.forEach(m=>{ if(m.team!==t.team && Math.abs(t.x-m.x)<120) m.hp-=0.8; });
    if(t.team==="blue" && enemy.alive && Math.abs(t.x-enemy.x)<120) enemy.hp-=0.5;
    if(t.team==="red" && player.alive && Math.abs(t.x-player.x)<120) player.hp-=0.5;
  });
}

// ===== DEATH & RESPAWN =====
function checkDeath(){
  if(player.hp<=0 && player.alive){
    player.alive=false;
    setTimeout(()=>{player.hp=player.maxHp; player.x=100; player.y=canvas.height/2; player.alive=true;},3000);
  }
  if(enemy.hp<=0 && enemy.alive){
    enemy.alive=false;
    player.gold+=20;
    setTimeout(()=>{enemy.hp=enemy.maxHp; enemy.x=canvas.width-100; enemy.y=canvas.height/2; enemy.alive=true;},3000);
  }
}

// ===== DRAW =====
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw heroes
  if(player.alive) ctx.drawImage(playerImg, player.x-20, player.y-20, 40, 40);
  if(enemy.alive) ctx.drawImage(enemyImg, enemy.x-20, enemy.y-20, 40, 40);

  // Minions
  minions.forEach(m=>{
    ctx.drawImage(m.team==="blue"?blueMinionImg:redMinionImg, m.x-5, m.y-5, 10, 10);
  });

  // Towers
  towers.forEach(t=>{
    ctx.fillStyle = t.team==="blue"?"blue":"red";
    ctx.fillRect(t.x-10,t.y-30,20,60);
  });

  // HP bars
  ctx.fillStyle="green";
  ctx.fillRect(player.x-20,player.y-30,player.hp*0.4,5);
  ctx.fillRect(enemy.x-20,enemy.y-30,enemy.hp*0.4,5);

  // Joystick visual
  if(joystick.active){
    ctx.beginPath(); ctx.arc(joystick.x,joystick.y,30,0,Math.PI*2); ctx.strokeStyle="white"; ctx.stroke();
    ctx.beginPath(); ctx.arc(joystick.x+joystick.dx,joystick.y+joystick.dy,15,0,Math.PI*2); ctx.fillStyle="white"; ctx.fill();
  }

  ctx.fillStyle="white";
  ctx.fillText("Gold: "+player.gold,20,20);
  if(!player.alive) ctx.fillText("You Died! Respawning...",canvas.width/2-80,canvas.height/2);
}

// ===== GAME LOOP =====
function gameLoop(){
  movePlayer(); moveEnemy(); updateMinions(); towerLogic(); checkDeath();
  if(keys[" "]) attack();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
