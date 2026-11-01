/**
 * Main Application Bootstrap & UI Event Wiring
 */

// Canvas roundRect polyfill for older browsers / webviews
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    if (!radii) radii = 0;
    if (typeof radii === 'number') radii = [radii, radii, radii, radii];
    const r = radii[0] || 0;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const game = new GameController(canvas);
  window.game = game;

  // 1. Responsive Canvas Resizing with High-DPI support
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    game.camera.resize(width, height);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // 2. Touch detection: ONLY show mobile controls on actual mobile/tablet screens
  const isMobileScreen = window.innerWidth <= 800 && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
  inputManager.touchControlsActive = isMobileScreen;
  const touchOverlay = document.getElementById('mobile-controls');
  if (touchOverlay) {
    touchOverlay.style.display = isMobileScreen ? 'block' : 'none';
  }

  // 3. Start Game Trigger: PRESS ANY KEY (Desktop) or TAP ANYWHERE (Mobile)
  const startPromptOverlay = document.getElementById('start-prompt-overlay');

  function triggerGameStart() {
    if (game.state !== 'READY') return;
    try {
      soundManager.init();
      soundManager.playClick();
    } catch (e) {
      console.warn('SoundManager init warning:', e);
    }
    game.startRound();
    if (startPromptOverlay) {
      startPromptOverlay.style.display = 'none';
    }
  }

  // Desktop: ANY keyboard key starts the game immediately without requiring a second key press
  window.addEventListener('keydown', (e) => {
    if (game.state === 'READY') {
      triggerGameStart();
      // DO NOT stop propagation: the keydown continues to inputManager
      // so if player pressed 'A', 'D', 'W', or 'Space', the player immediately moves/jumps on frame 1!
    }
  }, { capture: true });

  // Mobile / Pointer: Tap anywhere starts the game immediately
  window.addEventListener('pointerdown', (e) => {
    if (game.state === 'READY') {
      triggerGameStart();
    }
  });

  const pauseBtn = document.getElementById('btn-pause-hud');
  const resumeBtn = document.getElementById('btn-resume');
  const restartPauseBtn = document.getElementById('btn-restart-pause');
  const restartGameOverBtn = document.getElementById('btn-restart-gameover');

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      game.pauseGame();
    });
  }

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      game.resumeGame();
    });
  }

  if (restartPauseBtn) {
    restartPauseBtn.addEventListener('click', () => {
      soundManager.playClick();
      game.startRound();
    });
  }

  if (restartGameOverBtn) {
    restartGameOverBtn.addEventListener('click', () => {
      soundManager.playClick();
      game.startRound();
    });
  }

  // 4. Mobile Touch Button Events
  const touchButtons = [
    { id: 'touch-left', action: 'left' },
    { id: 'touch-right', action: 'right' },
    { id: 'touch-jump', action: 'jump' },
    { id: 'touch-dash', action: 'dash' },
    { id: 'touch-attack', action: 'attack' }
  ];

  touchButtons.forEach(({ id, action }) => {
    const el = document.getElementById(id);
    if (!el) return;

    const startHandler = (e) => {
      e.preventDefault();
      soundManager.init();
      inputManager.setTouchAction(action, true);
      el.classList.add('active');
    };

    const endHandler = (e) => {
      e.preventDefault();
      inputManager.setTouchAction(action, false);
      el.classList.remove('active');
    };

    el.addEventListener('touchstart', startHandler, { passive: false });
    el.addEventListener('touchend', endHandler, { passive: false });
    el.addEventListener('touchcancel', endHandler, { passive: false });
    el.addEventListener('mousedown', startHandler);
    el.addEventListener('mouseup', endHandler);
    el.addEventListener('mouseleave', endHandler);
  });

  // 5. Guaranteed Resilient Game Loop with Safe Delta-Time & Error Containment
  let lastTime = performance.now();

  function gameLoop(currentTime) {
    // 1. Immediately request the next frame so the loop NEVER dies
    requestAnimationFrame(gameLoop);

    // 2. Safe Delta-Time calculation (protects against NaN, negative, or huge tab-switch lag)
    if (typeof currentTime !== 'number' || isNaN(currentTime)) {
      currentTime = performance.now();
    }
    let dt = (currentTime - lastTime) / 1000;
    if (isNaN(dt) || dt <= 0 || dt > 0.1) {
      dt = 1 / 60;
    }
    lastTime = currentTime;

    // 3. Safe Input & Update Step
    try {
      if (window.inputManager) {
        inputManager.update();
      }
      if (window.game) {
        game.update(dt, window.inputManager);
      }
      if (window.inputManager) {
        inputManager.postUpdate();
      }
    } catch (updateErr) {
      console.error('Runtime update error contained:', updateErr);
    }

    // 4. Safe Render Step
    try {
      if (window.game) {
        game.render();
      }
    } catch (renderErr) {
      console.error('Runtime render error contained:', renderErr);
    }
  }

  requestAnimationFrame(gameLoop);
});
