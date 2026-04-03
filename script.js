const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== LOAD IMAGES =====
const playerImg = new Image();
playerImg.src = "https://i.imgur.com/1bX5QH6.png";

const enemyImg = new Image();
enemyImg.src = "https://i.imgur.com/3fJ1P3b.png";

const blueMinionImg = new Image();
blueMinionImg.src = "https://i.imgur.com/6XWwY4t.png";

const redMinionImg = new Image();
redMinionImg.src = "https://i.imgur.com/dXh9f0k.png";

// ===== PLAYER & ENEMY =====
const player = { x: 100, y: canvas.height/2, size: 40, hp: 100, maxHp: 100, gold: 0, alive: true, speed: 4, target: null };
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

// ===== MOUSE MOVEMENT =====
canvas.addEventListener("mousedown", e => {
  player.target = { x: e.clientX, y: e.clientY };
});

// ===== SKILL SYSTEM =====
const skills = {
  Q: { dmg: 10, range: 100, cooldown: 2000, lastCast: 0, color: "cyan" },
  W: { dmg: 15, range: 120, cooldown: 3000, lastCast: 0, color: "yellow" },
  E: { dmg: 5, passive: true, color: "purple" },
  R: { dmg: 30, range: 200, cooldown: 8000, lastCast: 0, color: "red" }
};

let skillEffects = [];

// ===== CAST SKILL =====
function castSkill(key){
  const skill = skills[key];
  const dist = Math.hypot(player.x-enemy.x, player.y-enemy.y);
  if(dist <= skill.range && enemy.alive){
    enemy.hp -= skill.dmg;
    skillEffects.push({ x: enemy.x, y: enemy.y, color: skill.color, radius: 10, maxRadius: 50 });
  }
}

// ===== HANDLE KEYS =====
document.addEventListener("keydown", e => {
  const now = Date.now();
  const key = e.key.toUpperCase();
  if(skills[key]){
    if(skills[key].passive) return; 
    if(now - skills[key].lastCast >= skills[key].cooldown){
      castSkill(key);
      skills[key].lastCast = now;
    }
  }
});

// ===== PLAYER MOVEMENT =====
function movePlayer() {
  if (!player.alive || !player.target) return;
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
  const dist = Math.hypot(player.x-enemy.x, player.y-enemy.y);
  if(dist>60){
    enemy.x += (player.x-enemy.x)*0.01;
    enemy.y += (player.y-enemy.y)*0.01;
  } else { player.hp -= 0.3; }
}

// ===== MINIONS =====
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

  // Draw minions
  minions.forEach(m=>{
    ctx.drawImage(m.team==="blue"?blueMinionImg:redMinionImg, m.x-5, m.y-5, 10, 10);
  });

  // Draw towers
  towers.forEach(t=>{
    ctx.fillStyle = t.team==="blue"?"blue":"red";
    ctx.fillRect(t.x-10,t.y-30,20,60);
  });

  // Draw HP bars
  ctx.fillStyle="green";
  ctx.fillRect(player.x-20,player.y-30,player.hp*0.4,5);
  ctx.fillRect(enemy.x-20,enemy.y-30,enemy.hp*0.4,5);

  // Draw skill effects (expanding circles)
  skillEffects.forEach((s,i)=>{
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.radius,0,Math.PI*2);
    ctx.fillStyle = s.color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
    s.radius += 2;
    if(s.radius >= s.maxRadius) skillEffects.splice(i,1);
  });

  // Draw player gold
  ctx.fillStyle="white";
  ctx.fillText("Gold: "+player.gold,20,20);

  if(!player.alive) ctx.fillText("You Died! Respawning...",canvas.width/2-80,canvas.height/2);

  // Draw skill cooldowns on HUD
  const hudX = 20; const hudY = canvas.height - 90;
  ["Q","W","E","R"].forEach((key,i)=>{
    const skill = skills[key];
    ctx.fillStyle = skill.color;
    ctx.fillRect(hudX + i*80, hudY, 60, 60);
    ctx.fillStyle = "white";
    ctx.fillText(key, hudX + i*80 + 22, hudY + 35);

    // Cooldown overlay
    const now = Date.now();
    if(skill.cooldown && now - skill.lastCast < skill.cooldown){
      const ratio = (now - skill.lastCast) / skill.cooldown;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(hudX + i*80, hudY, 60, 60*(1-ratio));
    }
  });
}

// ===== GAME LOOP =====
function gameLoop(){
  movePlayer(); moveEnemy(); updateMinions(); towerLogic(); checkDeath();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
