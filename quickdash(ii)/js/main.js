/**
 * Main Application Bootstrap & UI Event Wiring
 * Features:
 * - 9:16 Mobile Portrait Responsive Viewport & High-DPI Canvas scaling
 * - Dual Desktop & Ergonomic Mobile Touch Controls
 * - Immediate Press Any Key (Desktop) / Tap Anywhere (Mobile) Start Trigger
 * - Guaranteed Resilient Game Loop with Safe Delta-Time & Error Containment
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

  // 1. Responsive Canvas Resizing with High-DPI support & 9:16 Portrait Adaptation
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    game.camera.resize(width, height);
    updateDeviceView();
  }

  // 2. Touch & Device Detection: ONLY show mobile controls on actual mobile portrait screens
  function updateDeviceView() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isMobile = isPortrait || (isTouch && window.innerWidth <= 900);

    inputManager.touchControlsActive = isMobile;

    const touchOverlay = document.getElementById('mobile-controls');
    if (touchOverlay) {
      const showControls = isMobile && (game.state === 'READY' || game.state === 'PLAYING');
      touchOverlay.style.display = showControls ? 'block' : 'none';
    }

    document.body.classList.toggle('is-mobile-portrait', isMobile);
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 150);
  });
  resizeCanvas();

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
    updateDeviceView();
  }

  // Desktop: ANY keyboard key starts the game immediately
  window.addEventListener('keydown', (e) => {
    if (game.state === 'READY') {
      triggerGameStart();
    }
  }, { capture: true });

  // Mobile / Pointer: Tap anywhere starts the game immediately
  window.addEventListener('pointerdown', (e) => {
    if (game.state === 'READY') {
      triggerGameStart();
    }
  });

  // Prevent mobile browser pull-to-refresh and window scrolling
  window.addEventListener('touchmove', (e) => {
    if (e.target.closest('#mobile-controls') || e.target.closest('#game-canvas')) {
      e.preventDefault();
    }
  }, { passive: false });

  // HUD & Modal Buttons
  const pauseBtn = document.getElementById('btn-pause-hud');
  const resumeBtn = document.getElementById('btn-resume');
  const restartPauseBtn = document.getElementById('btn-restart-pause');
// Result screen has no buttons (clean ending screen)

  if (pauseBtn) {
    pauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      game.pauseGame();
    });
  }

  if (resumeBtn) {
    resumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      game.resumeGame();
      updateDeviceView();
    });
  }

  if (restartPauseBtn) {
    restartPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      soundManager.playClick();
      game.startRound();
      updateDeviceView();
    });
  }



  // 4. Mobile Touch Button Events: LEFT, RIGHT, JUMP, DASH
  const touchButtons = [
    { id: 'touch-left', action: 'left' },
    { id: 'touch-right', action: 'right' },
    { id: 'touch-jump', action: 'jump' },
    { id: 'touch-dash', action: 'dash' }
  ];

  touchButtons.forEach(({ id, action }) => {
    const el = document.getElementById(id);
    if (!el) return;

    let isDown = false;

    const startHandler = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (isDown) return;
      isDown = true;

      try {
        if (e && e.pointerId && el.setPointerCapture) {
          el.setPointerCapture(e.pointerId);
        }
      } catch (err) {}

      if (game.state === 'READY') {
        triggerGameStart();
      }
      try {
        if (window.soundManager) soundManager.init();
      } catch (err) {}

      inputManager.setTouchAction(action, true);
      el.classList.add('active');
    };

    const endHandler = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!isDown) return;
      isDown = false;

      try {
        if (e && e.pointerId && el.releasePointerCapture) {
          el.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}

      inputManager.setTouchAction(action, false);
      el.classList.remove('active');
    };

    // Pointer Events with Pointer Capture (resilient multi-touch and holding)
    el.addEventListener('pointerdown', startHandler, { passive: false });
    el.addEventListener('pointerup', endHandler, { passive: false });
    el.addEventListener('pointercancel', endHandler, { passive: false });
    el.addEventListener('pointerleave', (e) => {
      if (!el.hasPointerCapture || !el.hasPointerCapture(e.pointerId)) {
        endHandler(e);
      }
    }, { passive: false });

    // Touch events for fallback mobile compatibility
    el.addEventListener('touchstart', startHandler, { passive: false });
    el.addEventListener('touchend', endHandler, { passive: false });
    el.addEventListener('touchcancel', endHandler, { passive: false });

    // Prevent context menu (long press callout)
    el.addEventListener('contextmenu', (e) => e.preventDefault());
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
    const rawDt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Strict delta-time clamping: minimum 0.001s, maximum 0.05s (prevents teleporting or freeze)
    const dt = Math.max(0.001, Math.min(0.05, isNaN(rawDt) ? 1 / 60 : rawDt));

    // 3. Exception-isolated Game Tick & Render
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

    try {
      if (window.game) {
        game.render();
      }
    } catch (renderErr) {
      console.error('Runtime render error contained:', renderErr);
    }
  }

  // 6. Launch the bulletproof game loop
  requestAnimationFrame(gameLoop);
});
