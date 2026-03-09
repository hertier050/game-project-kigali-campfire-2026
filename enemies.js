const Enemies = (() => {
  const ENEMY_TYPES = {
    grunt: {
      w: 26, h: 40, speed: 1.2, hp: 2, damage: 1,
      detectRange: 260, attackRange: 30, attackCooldown: 90,
      color: '#8b1a22', accentColor: '#c0392b', xpValue: 10,
    },
    heavy: {
      w: 34, h: 48, speed: 0.7, hp: 5, damage: 2,
      detectRange: 200, attackRange: 36, attackCooldown: 120,
      color: '#1a1a8b', accentColor: '#2979ff', xpValue: 25,
    },
    scout: {
      w: 22, h: 36, speed: 2.2, hp: 1, damage: 1,
      detectRange: 340, attackRange: 28, attackCooldown: 70,
      color: '#1a5a2a', accentColor: '#2dc653', xpValue: 15,
    },
  };

  let enemies = [];
  let deathParticles = [];
  let totalDefeated = 0;

  const spawnList = [
    { type: 'grunt',  x: 820,  y: 0 },
    { type: 'scout',  x: 1050, y: 0 },
    { type: 'heavy',  x: 1280, y: 0 },
    { type: 'grunt',  x: 1500, y: 0 },
    { type: 'scout',  x: 1720, y: 0 },
    { type: 'grunt',  x: 1950, y: 0 },
    { type: 'heavy',  x: 2200, y: 0 },
    { type: 'scout',  x: 2450, y: 0 },
    { type: 'grunt',  x: 2650, y: 0 },
    { type: 'heavy',  x: 2850, y: 0 },
  ];

  const makeEnemy = (def) => {
    const t = ENEMY_TYPES[def.type];
    const groundY = WorldMap.WORLD_H - WorldMap.TILE - t.h;
    return {
      id: Math.random().toString(36).slice(2),
      type: def.type,
      x: def.x,
      y: groundY,
      w: t.w,
      h: t.h,
      vx: 0,
      vy: 0,
      hp: t.hp,
      maxHp: t.hp,
      speed: t.speed,
      damage: t.damage,
      detectRange: t.detectRange,
      attackRange: t.attackRange,
      attackCooldown: t.attackCooldown,
      attackTimer: 0,
      color: t.color,
      accentColor: t.accentColor,
      facingRight: false,
      onGround: false,
      alive: true,
      alertTimer: 0,
      patrolDir: 1,
      patrolTimer: 0,
      hitFlash: 0,
      bobTick: 0,
    };
  };

  const reset = () => {
    enemies = spawnList.map(makeEnemy);
    deathParticles = [];
    totalDefeated = 0;
  };

  const resolveEnemyGround = (e) => {
    e.onGround = false;
    for (const p of WorldMap.platforms) {
      if (
        e.x < p.x + p.w &&
        e.x + e.w > p.x &&
        e.y < p.y + p.h &&
        e.y + e.h > p.y
      ) {
        const overlapTop = (e.y + e.h) - p.y;
        const overlapBottom = (p.y + p.h) - e.y;
        if (overlapTop < overlapBottom && overlapTop < 20) {
          e.y = p.y - e.h;
          e.vy = 0;
          e.onGround = true;
        }
      }
    }
  };

  const spawnDeathParticles = (e) => {
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14;
      const speed = 1.8 + Math.random() * 3.5;
      deathParticles.push({
        x: e.x + e.w / 2,
        y: e.y + e.h / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        color: e.accentColor,
        size: 2 + Math.random() * 4,
      });
    }
  };

  const update = (playerState) => {
    const px = playerState.x + playerState.w / 2;
    const py = playerState.y + playerState.h / 2;

    enemies.forEach(e => {
      if (!e.alive) return;

      e.vy += 0.55;
      if (e.vy > 18) e.vy = 18;

      e.bobTick++;
      if (e.hitFlash > 0) e.hitFlash--;

      const dx = px - (e.x + e.w / 2);
      const dist = Math.abs(dx);

      if (dist < e.detectRange) {
        e.alertTimer = 40;
        const dir = dx > 0 ? 1 : -1;
        e.facingRight = dir > 0;
        e.vx = dir * e.speed;

        if (dist < e.attackRange + e.w / 2) {
          e.vx = 0;
          if (e.attackTimer <= 0) {
            e.attackTimer = e.attackCooldown;
            if (playerState.alive) {
              const hit = Player.takeDamage(e.damage);
              if (hit) {
                const flash = document.createElement('div');
                flash.className = 'damage-flash';
                document.body.appendChild(flash);
                setTimeout(() => flash.remove(), 400);
              }
            }
          }
        }
      } else {
        e.patrolTimer++;
        if (e.patrolTimer > 120) {
          e.patrolDir *= -1;
          e.patrolTimer = 0;
        }
        e.vx = e.patrolDir * e.speed * 0.4;
        e.facingRight = e.patrolDir > 0;
      }

      if (e.alertTimer > 0) e.alertTimer--;
      if (e.attackTimer > 0) e.attackTimer--;

      e.x += e.vx;
      e.y += e.vy;

      resolveEnemyGround(e);
      WorldMap.clampToWorld(e);
    });

    for (let i = deathParticles.length - 1; i >= 0; i--) {
      const p = deathParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.life -= 0.035;
      if (p.life <= 0) deathParticles.splice(i, 1);
    }
  };

  const drawEnemy = (ctx, e) => {
    const sx = e.x - WorldMap.camera.x;
    const sy = e.y - WorldMap.camera.y;

    if (e.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx, sy, e.w, e.h);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(sx + e.w / 2, sy + e.h / 2);
    if (!e.facingRight) ctx.scale(-1, 1);

    const hw = e.w / 2;
    const hh = e.h / 2;

    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.roundRect(-hw * 0.7, -hh * 0.18, hw * 1.4, hh * 1.18, 3);
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(0, -hh * 0.62, hw * 0.55, hw * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = e.accentColor;
    ctx.fillRect(-hw * 0.7, -hh * 0.22, hw * 1.4, 3);

    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.ellipse(hw * 0.28, -hh * 0.62, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const legSwing = Math.sin(e.bobTick * 0.22) * 4;
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(-hw * 0.44, hh * 0.38, hw * 0.36, hh * 0.6);
    ctx.fillRect(hw * 0.08, hh * 0.38, hw * 0.36, hh * 0.6);

    if (e.type === 'heavy') {
      ctx.strokeStyle = e.accentColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.55, -hh * 0.1);
      ctx.lineTo(-hw * 1.1, hh * 0.3);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hw * 0.35, -hh * 0.1);
      ctx.lineTo(hw * 0.9, hh * 0.22);
      ctx.stroke();
    }

    if (e.alertTimer > 0) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -hh - 4);
    }

    ctx.restore();

    const barW = e.w + 6;
    const barH = 3;
    const barX = sx - 3;
    const barY = sy - 8;
    ctx.fillStyle = '#2a0a0a';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#2dc653' : e.hp / e.maxHp > 0.25 ? '#f4b942' : '#e63946';
    ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
  };

  const draw = (ctx) => {
    deathParticles.forEach(p => {
      const s = WorldMap.toScreen(p.x, p.y);
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    enemies.forEach(e => {
      if (e.alive) drawEnemy(ctx, e);
    });
  };

  const checkPlayerAttack = (playerState) => {
    if (!playerState.attackJustFired) return;
    const box = Player.getAttackBox();
    let hitCount = 0;
    enemies.forEach(e => {
      if (!e.alive) return;
      if (
        box.x < e.x + e.w &&
        box.x + box.w > e.x &&
        box.y < e.y + e.h &&
        box.y + box.h > e.y
      ) {
        e.hp -= 1;
        e.hitFlash = 8;
        hitCount++;
        if (e.hp <= 0) {
          e.alive = false;
          totalDefeated++;
          spawnDeathParticles(e);
        }
      }
    });
  };

  const getLiving = () => enemies.filter(e => e.alive);
  const getDefeated = () => totalDefeated;

  return { reset, update, draw, checkPlayerAttack, getLiving, getDefeated };
})();
