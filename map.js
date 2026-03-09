const WorldMap = (() => {
  const WORLD_W = 3200;
  const WORLD_H = 1600;
  const TILE = 64;

  const camera = { x: 0, y: 0, w: 0, h: 0 };

  const zones = [
    { x: 0,          y: 0,          w: 420,  h: WORLD_H, label: 'SAFE ZONE',   color: '#0d2a16', border: '#2dc653' },
    { x: WORLD_W-420, y: 0,         w: 420,  h: WORLD_H, label: 'GOAL',         color: '#0d1a2a', border: '#2979ff' },
  ];

  const platforms = [];
  const decorations = [];

  const buildWorld = () => {
    platforms.length = 0;
    decorations.length = 0;

    for (let i = 0; i < Math.ceil(WORLD_W / TILE) + 1; i++) {
      platforms.push({ x: i * TILE, y: WORLD_H - TILE, w: TILE, h: TILE, type: 'ground' });
    }

    const pillarPositions = [500, 700, 950, 1200, 1450, 1700, 1950, 2200, 2500, 2750];
    pillarPositions.forEach(px => {
      for (let row = 0; row < 5; row++) {
        platforms.push({ x: px, y: WORLD_H - TILE * (2 + row), w: TILE, h: TILE, type: 'pillar' });
      }
      decorations.push({ type: 'lantern', x: px + TILE / 2, y: WORLD_H - TILE * 7 });
    });

    const ledges = [
      { x: 620,  y: WORLD_H - TILE * 4,  w: TILE * 3 },
      { x: 1050, y: WORLD_H - TILE * 5,  w: TILE * 3 },
      { x: 1320, y: WORLD_H - TILE * 3,  w: TILE * 4 },
      { x: 1600, y: WORLD_H - TILE * 6,  w: TILE * 3 },
      { x: 1820, y: WORLD_H - TILE * 4,  w: TILE * 4 },
      { x: 2080, y: WORLD_H - TILE * 5,  w: TILE * 3 },
      { x: 2360, y: WORLD_H - TILE * 3,  w: TILE * 4 },
      { x: 2600, y: WORLD_H - TILE * 5,  w: TILE * 3 },
    ];
    ledges.forEach(l => {
      for (let s = 0; s < Math.ceil(l.w / TILE); s++) {
        platforms.push({ x: l.x + s * TILE, y: l.y, w: TILE, h: TILE, type: 'ledge' });
      }
    });

    for (let t = 0; t < 30; t++) {
      decorations.push({
        type: 'bamboo',
        x: 450 + Math.random() * (WORLD_W - 900),
        y: WORLD_H - TILE - 20 - Math.random() * 60,
        h: 40 + Math.random() * 80,
      });
    }
  };

  const updateCamera = (playerX, playerY, viewW, viewH) => {
    camera.w = viewW;
    camera.h = viewH;
    camera.x = playerX - viewW / 2;
    camera.y = playerY - viewH / 2;
    camera.x = Math.max(0, Math.min(camera.x, WORLD_W - viewW));
    camera.y = Math.max(0, Math.min(camera.y, WORLD_H - viewH));
  };

  const drawBackground = (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, camera.h);
    grad.addColorStop(0, '#080810');
    grad.addColorStop(0.5, '#0c0c1a');
    grad.addColorStop(1, '#050510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, camera.w, camera.h);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    for (let i = 0; i < 60; i++) {
      const sx = (i * 379) % WORLD_W;
      const sy = 40 + (i * 137) % (WORLD_H * 0.45);
      const r = 0.6 + (i % 5) * 0.3;
      const alpha = 0.2 + (i % 4) * 0.15;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,220,${alpha})`;
      ctx.fill();
    }

    zones.forEach(z => {
      ctx.fillStyle = z.color;
      ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = z.border;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(z.x + 1, z.y + 1, z.w - 2, z.h - 2);
      ctx.setLineDash([]);
      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = z.border;
      ctx.globalAlpha = 0.7;
      ctx.textAlign = 'center';
      ctx.fillText(z.label, z.x + z.w / 2, 30);
      ctx.restore();
    });

    decorations.forEach(d => {
      if (d.type === 'lantern') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(d.x - 10, d.y, 20, 28);
        ctx.fillStyle = '#c0392b';
        ctx.fill();
        ctx.fillStyle = 'rgba(255,160,30,0.55)';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y + 14, 22, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8b1a1a';
        ctx.lineWidth = 1;
        ctx.strokeRect(d.x - 10, d.y, 20, 28);
        ctx.restore();
      }
      if (d.type === 'bamboo') {
        ctx.strokeStyle = '#1a4a1a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y - d.h);
        ctx.stroke();
        for (let s = 0; s < d.h; s += 18) {
          ctx.strokeStyle = '#0d2e0d';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(d.x - 3, d.y - s);
          ctx.lineTo(d.x + 3, d.y - s);
          ctx.stroke();
        }
      }
    });

    platforms.forEach(p => {
      if (p.type === 'ground') {
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#22223a';
        ctx.fillRect(p.x, p.y, p.w, 4);
      } else if (p.type === 'pillar') {
        ctx.fillStyle = '#222233';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#2a2a44';
        ctx.fillRect(p.x + 2, p.y, 4, p.h);
        ctx.fillRect(p.x + p.w - 6, p.y, 4, p.h);
      } else if (p.type === 'ledge') {
        ctx.fillStyle = '#1e1e30';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#2c2c48';
        ctx.fillRect(p.x, p.y, p.w, 4);
      }
    });

    ctx.restore();
  };

  const toScreen = (wx, wy) => ({ x: wx - camera.x, y: wy - camera.y });

  const clampToWorld = (entity) => {
    if (entity.x < 0) entity.x = 0;
    if (entity.x + entity.w > WORLD_W) entity.x = WORLD_W - entity.w;
    if (entity.y < 0) entity.y = 0;
    if (entity.y + entity.h > WORLD_H) entity.y = WORLD_H - entity.h;
  };

  return {
    WORLD_W, WORLD_H, TILE,
    camera, zones, platforms,
    buildWorld, updateCamera, drawBackground, toScreen, clampToWorld,
  };
})();
