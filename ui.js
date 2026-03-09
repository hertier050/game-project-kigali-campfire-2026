const UI = (() => {
  const MINIMAP_SIZE = 130;
  const MINIMAP_MARGIN = 14;

  let minimapCanvas = null;
  let minimapCtx = null;

  const elMissionTitle    = () => document.getElementById('mission-title');
  const elMissionDesc     = () => document.getElementById('mission-desc');
  const elMissionProgress = () => document.getElementById('mission-progress');
  const elPanicLabel      = () => document.getElementById('panic-label');
  const elPanicTimer      = () => document.getElementById('panic-timer');

  const init = () => {
    minimapCanvas = document.getElementById('minimap-canvas');
    minimapCanvas.width  = MINIMAP_SIZE;
    minimapCanvas.height = MINIMAP_SIZE;
    minimapCtx = minimapCanvas.getContext('2d');
  };

  const updateHUD = () => {
    const m = Missions.current();

    if (!m && !Missions.isComplete()) return;

    if (m) {
      elMissionTitle().textContent    = `MISSION ${m.id} OF 4`;
      elMissionDesc().textContent     = m.description;
      elMissionProgress().textContent = m.progressText ? m.progressText() : '';
    } else if (Missions.isComplete()) {
      elMissionTitle().textContent    = 'ALL MISSIONS COMPLETE';
      elMissionDesc().textContent     = 'Shadow Redemption achieved.';
      elMissionProgress().textContent = '';
    }

    if (Missions.isPanic()) {
      elPanicLabel().className = 'panic-visible';
      elPanicTimer().className = 'panic-visible';
      const t = Math.ceil(Missions.getPanicTime());
      elPanicTimer().textContent = t;
      if (t <= 10) {
        elPanicTimer().classList.add('critical');
      } else {
        elPanicTimer().classList.remove('critical');
      }
    } else {
      elPanicLabel().className = 'panic-hidden';
      elPanicTimer().className = 'panic-hidden';
    }
  };

  const drawMinimap = () => {
    if (!minimapCtx) return;

    const ctx = minimapCtx;
    const sz  = MINIMAP_SIZE;
    const r   = sz / 2;
    const ww  = WorldMap.WORLD_W;
    const wh  = WorldMap.WORLD_H;

    ctx.clearRect(0, 0, sz, sz);

    ctx.save();
    ctx.beginPath();
    ctx.arc(r, r, r - 1, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#08080f';
    ctx.fillRect(0, 0, sz, sz);

    const toMM = (wx, wy) => ({
      x: (wx / ww) * sz,
      y: (wy / wh) * sz,
    });

    const safeRight = toMM(0, 0);
    const safeW = (420 / ww) * sz;
    ctx.fillStyle = 'rgba(45,198,83,0.18)';
    ctx.fillRect(0, 0, safeW, sz);

    const goalLeft = toMM(ww - 420, 0);
    const goalW = (420 / ww) * sz;
    ctx.fillStyle = 'rgba(41,121,255,0.18)';
    ctx.fillRect(goalLeft.x, 0, goalW, sz);

    const camPos = toMM(WorldMap.camera.x, WorldMap.camera.y);
    const camW   = (WorldMap.camera.w / ww) * sz;
    const camH   = (WorldMap.camera.h / wh) * sz;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(camPos.x, camPos.y, camW, camH);

    Enemies.getLiving().forEach(e => {
      const mp = toMM(e.x + e.w / 2, e.y + e.h / 2);
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.arc(mp.x, mp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const ps = Player.state;
    const pp = toMM(ps.x + ps.w / 2, ps.y + ps.h / 2);
    ctx.fillStyle = '#f4b942';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    ctx.beginPath();
    ctx.arc(r, r, r - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(244,185,66,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const drawOverlay = (ctx, viewW, viewH) => {
    if (Missions.isJustCompleted()) {
      const prev = Missions.current();
      if (!prev) return;
    }
  };

  const drawCompletionBanner = (ctx, viewW, viewH, text) => {
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#1a1a0a';
    ctx.fillRect(viewW / 2 - 220, viewH * 0.38, 440, 60);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#f4b942';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, viewW / 2, viewH * 0.38 + 30);
    ctx.restore();
  };

  const showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  };

  return {
    init, updateHUD, drawMinimap, drawOverlay, drawCompletionBanner, showScreen,
    MINIMAP_SIZE, MINIMAP_MARGIN,
  };
})();
