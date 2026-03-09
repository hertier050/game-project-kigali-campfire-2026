const Game = (() => {
  let canvas   = null;
  let ctx      = null;
  let rafId    = null;
  let lastTime = 0;
  let running  = false;
  let paused   = false;

  const FIXED_STEP = 1000 / 60;

  const resize = () => {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const init = () => {
    canvas = document.getElementById('game-canvas');
    ctx    = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    Input.init();

    WorldMap.buildWorld();

    UI.init();

    bindMenuButtons();
  };

  const bindMenuButtons = () => {
    document.getElementById('btn-start').addEventListener('click', () => startGame());
    document.getElementById('btn-replay').addEventListener('click', () => startGame());
    document.getElementById('btn-retry').addEventListener('click', () => startGame());
  };

  const startGame = () => {
    Player.reset();
    Enemies.reset();
    Missions.reset();

    UI.showScreen('screen-game');

    lastTime = performance.now();
    running  = true;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  };

  const stopGame = () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  const loop = (timestamp) => {
    if (!running) return;

    const elapsed = timestamp - lastTime;
    lastTime = timestamp;

    const dt = Math.min(elapsed, 64) / FIXED_STEP;

    update(dt);
    draw();
    checkEndConditions();

    rafId = requestAnimationFrame(loop);
  };

  const update = (dt) => {
    Player.update();

    Enemies.checkPlayerAttack(Player.state);
    Enemies.update(Player.state);

    WorldMap.updateCamera(
      Player.getCenterX(),
      Player.getCenterY(),
      canvas.width,
      canvas.height
    );

    Missions.update(dt / 60);

    UI.updateHUD();
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    WorldMap.drawBackground(ctx);

    Enemies.draw(ctx);
    Player.draw(ctx);

    drawHealthIcons(ctx);

    UI.drawMinimap();
  };

  const drawHealthIcons = (ctx) => {
    const hp  = Player.state.hp;
    const max = Player.MAX_HP;
    const startX = canvas.width / 2 - (max * 22) / 2;
    const y = canvas.height - 28;

    for (let i = 0; i < max; i++) {
      ctx.font = '16px serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.globalAlpha = i < hp ? 1 : 0.22;
      ctx.fillText('❤', startX + i * 22, y);
      ctx.globalAlpha = 1;
    }
  };

  const checkEndConditions = () => {
    if (!running) return;

    if (!Player.state.alive) {
      stopGame();
      setTimeout(() => UI.showScreen('screen-gameover'), 800);
      return;
    }

    if (Missions.isComplete()) {
      stopGame();
      setTimeout(() => UI.showScreen('screen-victory'), 1200);
    }
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
