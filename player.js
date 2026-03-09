const Player = (() => {
  const SPEED = 3.8;
  const JUMP_VEL = -13;
  const GRAVITY = 0.55;
  const ATTACK_RANGE = 72;
  const ATTACK_DURATION = 18;
  const ATTACK_COOLDOWN = 22;
  const INVULN_DURATION = 60;
  const MAX_HP = 5;
  const IFRAME_BLINK = 6;

  const state = {
    x: 160,
    y: 400,
    w: 28,
    h: 44,
    vx: 0,
    vy: 0,
    onGround: false,
    facingRight: true,
    hp: MAX_HP,
    attacking: false,
    attackTimer: 0,
    attackCooldown: 0,
    attackJustFired: false,
    invulnTimer: 0,
    alive: true,
    runFrame: 0,
    runTick: 0,
    trail: [],
  };

  const reset = () => {
    state.x = 160;
    state.y = WorldMap.WORLD_H - WorldMap.TILE * 2 - state.h;
    state.vx = 0;
    state.vy = 0;
    state.onGround = false;
    state.facingRight = true;
    state.hp = MAX_HP;
    state.attacking = false;
    state.attackTimer = 0;
    state.attackCooldown = 0;
    state.attackJustFired = false;
    state.invulnTimer = 0;
    state.alive = true;
    state.runFrame = 0;
    state.runTick = 0;
    state.trail.length = 0;
  };

  const resolveCollisions = () => {
    const platforms = WorldMap.platforms;
    state.onGround = false;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (
        state.x < p.x + p.w &&
        state.x + state.w > p.x &&
        state.y < p.y + p.h &&
        state.y + state.h > p.y
      ) {
        const overlapLeft   = (state.x + state.w) - p.x;
        const overlapRight  = (p.x + p.w) - state.x;
        const overlapTop    = (state.y + state.h) - p.y;
        const overlapBottom = (p.y + p.h) - state.y;
        const minH = Math.min(overlapLeft, overlapRight);
        const minV = Math.min(overlapTop, overlapBottom);
        if (minV < minH) {
          if (overlapTop < overlapBottom) {
            state.y = p.y - state.h;
            if (state.vy > 0) state.vy = 0;
            state.onGround = true;
          } else {
            state.y = p.y + p.h;
            if (state.vy < 0) state.vy = 0;
          }
        } else {
          if (overlapLeft < overlapRight) {
            state.x = p.x - state.w;
          } else {
            state.x = p.x + p.w;
          }
          state.vx = 0;
        }
      }
    }
  };

  const update = () => {
    if (!state.alive) return;

    state.attackJustFired = false;

    if (state.attackCooldown > 0) state.attackCooldown--;
    if (state.invulnTimer > 0) state.invulnTimer--;

    const moveLeft  = Input.isDown('KeyA') || Input.isDown('ArrowLeft');
    const moveRight = Input.isDown('KeyD') || Input.isDown('ArrowRight');
    const jump      = Input.isDown('KeyW') || Input.isDown('ArrowUp') || Input.isDown('Space');
    const attack    = Input.isDown('KeyF');

    if (moveLeft)  { state.vx = -SPEED; state.facingRight = false; }
    else if (moveRight) { state.vx = SPEED; state.facingRight = true; }
    else state.vx *= 0.72;

    if (jump && state.onGround) state.vy = JUMP_VEL;

    state.vy += GRAVITY;
    if (state.vy > 18) state.vy = 18;

    state.x += state.vx;
    state.y += state.vy;

    resolveCollisions();
    WorldMap.clampToWorld(state);

    if (attack && state.attackCooldown === 0) {
      state.attacking = true;
      state.attackTimer = ATTACK_DURATION;
      state.attackCooldown = ATTACK_COOLDOWN;
      state.attackJustFired = true;
    }

    if (state.attacking) {
      state.attackTimer--;
      if (state.attackTimer <= 0) state.attacking = false;
    }

    state.runTick++;
    if (state.runTick % 8 === 0 && Math.abs(state.vx) > 0.5) {
      state.runFrame = (state.runFrame + 1) % 4;
    }

    state.trail.unshift({ x: state.x + state.w / 2, y: state.y + state.h / 2 });
    if (state.trail.length > 8) state.trail.pop();
  };

  const drawShadowNinja = (ctx, x, y, w, h, facing, attacking, invuln, tick) => {
    const blink = invuln > 0 && Math.floor(invuln / IFRAME_BLINK) % 2 === 0;
    if (blink) return;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    if (!facing) ctx.scale(-1, 1);

    const sw = w;
    const sh = h;
    const hh = sh / 2;

    ctx.fillStyle = '#111118';
    ctx.beginPath();
    ctx.roundRect(-sw * 0.35, -hh * 0.18, sw * 0.7, sh * 0.55, 4);
    ctx.fill();

    ctx.fillStyle = '#1a1a28';
    ctx.beginPath();
    ctx.ellipse(0, -hh * 0.52, sw * 0.28, sw * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.rect(-sw * 0.35, -hh * 0.22, sw * 0.7, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(-sw * 0.02, -hh * 0.82, sw * 0.04, hh * 0.38);
    ctx.fill();

    const legSwing = Math.sin(tick * 0.25) * 5;
    ctx.fillStyle = '#0d0d18';
    ctx.fillRect(-sw * 0.22, hh * 0.34, sw * 0.18, sh * 0.32);
    ctx.save();
    ctx.translate(-sw * 0.13, hh * 0.66);
    ctx.rotate((legSwing * Math.PI) / 180);
    ctx.fillRect(-5, 0, 10, sh * 0.15);
    ctx.restore();

    ctx.fillRect(sw * 0.04, hh * 0.34, sw * 0.18, sh * 0.32);
    ctx.save();
    ctx.translate(sw * 0.13, hh * 0.66);
    ctx.rotate((-legSwing * Math.PI) / 180);
    ctx.fillRect(-5, 0, 10, sh * 0.15);
    ctx.restore();

    if (attacking) {
      ctx.strokeStyle = '#e6c620';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.save();
      ctx.rotate(-0.3);
      ctx.beginPath();
      ctx.moveTo(sw * 0.2, -hh * 0.1);
      ctx.lineTo(sw * 0.95, -hh * 0.35);
      ctx.stroke();
      ctx.fillStyle = '#e6c620';
      ctx.beginPath();
      ctx.ellipse(sw * 0.95, -hh * 0.35, 4, 2, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.5;
      const slashGrad = ctx.createRadialGradient(sw * 0.6, -hh * 0.2, 0, sw * 0.6, -hh * 0.2, sw * 0.7);
      slashGrad.addColorStop(0, 'rgba(230,198,32,0.6)');
      slashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = slashGrad;
      ctx.beginPath();
      ctx.arc(sw * 0.6, -hh * 0.2, sw * 0.7, -1.2, 0.6);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.strokeStyle = '#888899';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sw * 0.2, -hh * 0.1);
      ctx.lineTo(sw * 0.52, hh * 0.22);
      ctx.stroke();
    }

    ctx.restore();
  };

  const draw = (ctx) => {
    if (!state.alive) return;

    const sx = state.x - WorldMap.camera.x;
    const sy = state.y - WorldMap.camera.y;

    for (let i = 1; i < state.trail.length; i++) {
      const t = state.trail[i];
      const alpha = (1 - i / state.trail.length) * 0.18;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#4040c0';
      ctx.beginPath();
      ctx.ellipse(
        t.x - WorldMap.camera.x,
        t.y - WorldMap.camera.y,
        state.w * 0.35 * (1 - i / state.trail.length),
        state.h * 0.25 * (1 - i / state.trail.length),
        0, 0, Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }

    if (state.attacking) {
      const dir = state.facingRight ? 1 : -1;
      const cx = sx + state.w / 2 + dir * ATTACK_RANGE * 0.5;
      const cy = sy + state.h * 0.4;
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#e6c620';
      ctx.beginPath();
      ctx.ellipse(cx, cy, ATTACK_RANGE * 0.75, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawShadowNinja(ctx, sx, sy, state.w, state.h, state.facingRight, state.attacking, state.invulnTimer, state.runTick);

    const hpBarW = state.w + 8;
    const hpBarH = 4;
    const hpX = sx - 4;
    const hpY = sy - 10;
    ctx.fillStyle = '#2a0a0a';
    ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
    ctx.fillStyle = '#e63946';
    ctx.fillRect(hpX, hpY, hpBarW * (state.hp / MAX_HP), hpBarH);
  };

  const takeDamage = (amount) => {
    if (!state.alive || state.invulnTimer > 0) return false;
    state.hp -= amount;
    state.invulnTimer = INVULN_DURATION;
    if (state.hp <= 0) {
      state.hp = 0;
      state.alive = false;
    }
    return true;
  };

  const getAttackBox = () => {
    const dir = state.facingRight ? 1 : -1;
    return {
      x: state.facingRight ? state.x + state.w : state.x - ATTACK_RANGE,
      y: state.y,
      w: ATTACK_RANGE,
      h: state.h,
    };
  };

  const getCenterX = () => state.x + state.w / 2;
  const getCenterY = () => state.y + state.h / 2;

  return {
    state, reset, update, draw, takeDamage, getAttackBox,
    getCenterX, getCenterY,
    ATTACK_RANGE, MAX_HP,
  };
})();
