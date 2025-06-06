const characterSprites = {
  warrior: new Image(),
  mage: new Image(),
  healer: new Image(),
  tank: new Image()
};

characterSprites.warrior.src = './personagens/warrior_centered.png';
characterSprites.mage.src = './personagens/wizard_centered.png';
characterSprites.healer.src = './personagens/healer_centered.png';
characterSprites.tank.src = './personagens/tank_centered.png';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const keys = {};
let player = null;
const allies = [];
const enemies = [];
let projectiles = [];
let explosions = [];
let gameOver = false;
let aiming = false;
let mouseX = 0;
let mouseY = 0;

// ====== NOVO: Limites do mapa ======
const mapBounds = {
  xMin: 20,
  yMin: 20,
  xMax: canvas.width - 50,
  yMax: canvas.height - 50
};

// ====== CLASSES ======

class Explosion {
  constructor(x, y, radius = 60) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.life = 15;
  }
  update() {
    this.life--;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(255, 0, 255, ${this.life / 15})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  isAlive() {
    return this.life > 0;
  }
}

class Projectile {
  constructor(x, y, angle, team, type, source) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 6;
    this.team = team;
    this.type = type;
    this.source = source;
    this.radius = 6;
  }

  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    ctx.beginPath();
    ctx.fillStyle = this.team === 'ally' ? 'yellow' : 'orange';
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    const targets = this.type === 'healer' 
  ? (this.team === 'ally' ? allies : enemies) // curandeiro mira aliados do próprio time
  : (this.team === 'ally' ? enemies : allies); // outros personagens atacam inimigos
    for (let target of targets) {
  // Impede que o projétil do curandeiro acerte ele mesmo
  if (target === this.source) continue;

  const dist = Math.hypot(this.x - (target.x + 15), this.y - (target.y + 15));
  if (dist < this.radius + 15) {
    if (this.type === 'healer') {
      if (target.team === this.team) {
        target.hp = Math.min(target.maxHp, target.hp + 30); // cura aliados
      } else {
        target.hp -= 18; // dano a inimigos, caso haja (ex: curandeiro ofensivo)
      }
    } else if (this.type === 'mage') {
      targets.forEach(unit => {
        const d = Math.hypot(unit.x - this.x, unit.y - this.y);
        if (d < 60) unit.hp -= 30;
      });
      explosions.push(new Explosion(this.x, this.y));
    } else {
      let dmg = this.type === 'warrior' ? 37 : 23;
      if (this.team === 'enemy') dmg += 10;
      target.hp -= dmg;
    }
    this.remove = true;
    return;
  }
}

    if (this.x < 0 || this.y < 0 || this.x > canvas.width || this.y > canvas.height) {
      this.remove = true;
    }
  }
}

class Character {
  constructor(x, y, type, isPlayer = false, team = 'ally') {
  this.x = x;
  this.y = y;
  this.type = type;
  this.team = team;
  this.isPlayer = isPlayer;

  const baseSpeeds = {
    warrior: 3.0,
    mage: 2.8,
    healer: 2.5,
    tank: 4 // ← aumentamos a velocidade do tanque
  };
  this.speed = baseSpeeds[type];

  this.color = { warrior: 'red', mage: 'blue', healer: 'green', tank: 'gray' }[type];
  this.skillCooldown = 0;
  this.hp = 230;
  this.maxHp = 230;
}

  draw() {
    const sprite = characterSprites[this.type];
    if (sprite.complete) {
      ctx.drawImage(sprite, this.x, this.y, 80, 80);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, 30, 30);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(this.isPlayer ? 'Você' : this.type, this.x - 5, this.y - 35);

    ctx.strokeStyle = '#fff';
    ctx.strokeRect(this.x, this.y - 10, 30, 6);
    ctx.fillStyle = this.team === 'ally' ? 'lime' : 'red';
    ctx.fillRect(this.x, this.y - 10, (30 * this.hp) / this.maxHp, 6);

    if (this.isPlayer) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText(this.skillCooldown > 0 ? `Skill: ${this.skillCooldown}` : aiming ? 'Clique para lançar!' : 'Skill pronta!', this.x - 5, this.y - 50);
    }
  }

  update() {
    this.isPlayer ? this.move() : this.smartAI();
    this.draw();
    if (this.skillCooldown > 0) this.skillCooldown--;
    if (this.type === 'tank') {
  if (this.isPlayer && keys[' ']) {
    this.areaTouchDamage();
  } else if (!this.isPlayer) {
    // Se IA estiver perto de inimigos, cause dano
    const targetList = this.team === 'ally' ? enemies : allies;
    const closeEnemy = targetList.find(t => Math.hypot((this.x + 15) - (t.x + 15), (this.y + 15) - (t.y + 15)) < 35);
    if (closeEnemy) this.areaTouchDamage();
    if (closeEnemy) this.areaTouchDamage();
  }
}
  }

  // ======= ALTERADO: movimentação respeita limites =======
  move() {
    if (keys['w'] && this.y > mapBounds.yMin) this.y -= this.speed;
    if (keys['s'] && this.y + 30 < mapBounds.yMax) this.y += this.speed;
    if (keys['a'] && this.x > mapBounds.xMin) this.x -= this.speed;
    if (keys['d'] && this.x + 30 < mapBounds.xMax) this.x += this.speed;
  }

  smartAI() {
    let friends = this.team === 'ally' ? allies : enemies;
    let targets = this.team === 'ally' ? enemies : allies;

    // NOVO: tanque IA vai direto para o inimigo e usa dano corpo a corpo apenas
  if (this.type === 'tank' && !this.isPlayer) {
    // Achar inimigo mais próximo
    let target = targets.reduce((closest, curr) => {
      const d = Math.hypot(curr.x - this.x, curr.y - this.y);
      return !closest || d < closest.dist ? { dist: d, unit: curr } : closest;
    }, null)?.unit;

    if (!target) return;

    // Mover na direção do inimigo
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 35) {
      this.x += this.speed * dx / dist;
      this.y += this.speed * dy / dist;
    } else {
      // Quando perto, usar dano corpo a corpo
      this.areaTouchDamage();
    }

    // Manter tanque dentro dos limites do mapa
    this.x = Math.max(mapBounds.xMin, Math.min(this.x, mapBounds.xMax - 30));
    this.y = Math.max(mapBounds.yMin, Math.min(this.y, mapBounds.yMax - 30));

    return; // Sai do método para não executar o resto da IA
  }

    if (this.type === 'healer') {
      let lowHpAlly = friends.filter(a => a.hp < a.maxHp * 0.8).sort((a, b) => (a === player ? -1 : 1))[0];
      if (lowHpAlly && this.skillCooldown === 0) {
        this.useSkill(lowHpAlly.x + 15, lowHpAlly.y + 15, lowHpAlly);
        return;
      }
    }

    // Desviar de projéteis
    let danger = projectiles.find(p => p.team !== this.team && Math.hypot(this.x - p.x, this.y - p.y) < 60);
    if (danger) {
      let perpAngle = Math.atan2(danger.y - this.y, danger.x - this.x) + Math.PI / 2;
      this.x += Math.cos(perpAngle) * this.speed;
      this.y += Math.sin(perpAngle) * this.speed;
    }

    let target = targets.reduce((closest, curr) => {
      const d = Math.hypot(curr.x - this.x, curr.y - this.y);
      return !closest || d < closest.dist ? { dist: d, unit: curr } : closest;
    }, null)?.unit;

    if (!target) return;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const typeDistances = { warrior: 80, mage: 180, healer: 100, tank: 60 };
    const desiredDistance = typeDistances[this.type] ?? 100;

    if (dist > desiredDistance + 10) {
      this.x += this.speed * dx / dist;
      this.y += this.speed * dy / dist;
    } else if (dist < desiredDistance - 10 && this.type !== 'tank') {
      this.x -= this.speed * dx / dist;
      this.y -= this.speed * dy / dist;
      // Se o mago estiver perto da borda, ataca direto em vez de tentar recuar
const nearBorder = this.x < mapBounds.xMin + 30 || this.x > mapBounds.xMax - 60 ||
                   this.y < mapBounds.yMin + 30 || this.y > mapBounds.yMax - 60;

if (this.type === 'mage' && nearBorder && this.skillCooldown === 0) {
  this.useSkill(target.x + 15, target.y + 15, target);
  return;
}
    } else if (this.skillCooldown === 0 && Math.random() < 0.9) {
      // Previsão de movimento
      const tx = target.x + 15;
      const ty = target.y + 15;
      const dx2 = tx - (this.x + 15);
      const dy2 = ty - (this.y + 15);
      const dist2 = Math.hypot(dx2, dy2);
      const projSpeed = 6;
      let predictedX = tx;
      let predictedY = ty;

      if (dist2 > 0.01) {
          predictedX = tx + (target.speed * dx2 / dist2) * (dist2 / projSpeed);
          predictedY = ty + (target.speed * dy2 / dist2) * (dist2 / projSpeed);
        }

// Reduzir precisão da IA inimiga
if (this.team === 'enemy') {
  const accuracyFactor = 0.75;
  predictedX += (Math.random() - 0.5) * 30 * (1 - accuracyFactor);
  predictedY += (Math.random() - 0.5) * 30 * (1 - accuracyFactor);
}

      this.useSkill(predictedX, predictedY, target);
    }

    this.x = Math.max(mapBounds.xMin, Math.min(this.x, mapBounds.xMax - 30));
    this.y = Math.max(mapBounds.yMin, Math.min(this.y, mapBounds.yMax - 30));
  }

  useSkill(targetX, targetY, targetUnit = null) {
  if (this.skillCooldown > 0) return;
  this.skillCooldown = this.team === 'enemy' ? 60 : 80;

  if (targetUnit) {
    const projSpeed = 6;
    const tx = targetUnit.x + 15;
    const ty = targetUnit.y + 15;
    const dx = tx - (this.x + 15);
    const dy = ty - (this.y + 15);
    const dist = Math.hypot(dx, dy);

    // Proteção contra divisão por zero ou alvos muito próximos
    if (dist > 0.01) {
      const predictedX = tx + (targetUnit.speed * dx / dist) * (dist / projSpeed);
      const predictedY = ty + (targetUnit.speed * dy / dist) * (dist / projSpeed);
      targetX = predictedX;
      targetY = predictedY;
    } else {
      targetX = tx;
      targetY = ty;
    }
  }

  const angle = Math.atan2(targetY - (this.y + 15), targetX - (this.x + 15));
  projectiles.push(new Projectile(this.x + 15, this.y + 15, angle, this.team, this.type, this));
}


  areaTouchDamage() {
  const targetList = this.team === 'ally' ? enemies : allies;
  targetList.forEach(t => {
    const dist = Math.hypot((this.x + 15) - (t.x + 15), (this.y + 15) - (t.y + 15));
    if (dist < 35) t.hp -= 0.4;
  });
}
}

// ====== FUNÇÕES DO JOGO ======

function randomPos(isEnemy) {
  const margin = 50;
  return {
    x: Math.random() * (canvas.width / 2 - margin) + (isEnemy ? canvas.width / 2 : 0),
    y: Math.random() * (canvas.height - margin)
  };
}

function selectCharacter(type) {
  document.getElementById('characterSelect').style.display = 'none';
  document.getElementById('message').innerText = '';
  const playerPos = randomPos(false);
  player = new Character(playerPos.x, playerPos.y, type, true);
  allies.push(player);
  const types = ['warrior', 'mage', 'healer', 'tank'];

  // Adiciona os 3 aliados restantes (sem repetir a classe do jogador)
  types.filter(t => t !== type).forEach(t => {
    const { x, y } = randomPos(false);
    allies.push(new Character(x, y, t));
  });

  // Adiciona 1 de cada tipo para os inimigos
  types.forEach(t => {
    const { x, y } = randomPos(true);
    enemies.push(new Character(x, y, t, false, 'enemy'));
  });
  gameLoop();
}

function gameLoop() {
  if (gameOver) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#333';
  ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);

  if (aiming && player) {
    ctx.save();
    ctx.strokeStyle = 'yellow';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(player.x + 15, player.y + 15);
    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();
    ctx.restore();
  }

  [...allies, ...enemies].forEach(c => c.update());
  projectiles.forEach(p => p.update());
  explosions.forEach(e => e.update());

  projectiles = projectiles.filter(p => !p.remove);
  explosions = explosions.filter(e => e.isAlive());

  removeDeadCharacters();
  checkWinCondition();

  if (!gameOver) requestAnimationFrame(gameLoop);
}

function removeDeadCharacters() {
  for (let arr of [allies, enemies]) {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].hp <= 0) arr.splice(i, 1);
    }
  }
}

function checkWinCondition() {
  if (allies.length === 0) endGame('DERROTA');
  else if (enemies.length === 0) endGame('VITÓRIA');
}

function resetGame() {
  // Limpa todas as variáveis do jogo
  allies.length = 0;
  enemies.length = 0;
  projectiles.length = 0;
  explosions.length = 0;
  player = null;
  gameOver = false;
  aiming = false;

  // Esconde elementos do final do jogo
  document.getElementById('message').innerText = '';
  document.getElementById('restartBtn').style.display = 'none';

  // Exibe a tela de seleção de personagem
  document.getElementById('characterSelect').style.display = 'block';
}

function endGame(message) {
  gameOver = true;
  document.getElementById('message').innerText = message;
    setTimeout(() => {
    resetGame();
  }, 3000); // espera 3 segundos antes de resetar
}

document.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ' && player && player.type !== 'tank' && player.skillCooldown === 0) aiming = true;
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', () => {
  if (aiming && player) {
    player.useSkill(mouseX, mouseY);
    aiming = false;
  }
});