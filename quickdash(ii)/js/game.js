/**
 * GameController - Main Game State Machine, 60-Second Timer & Rules
 */
class GameController {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Systems
    this.camera = new Camera(canvas);
    this.map = new GameMap();
    this.camera.setWorldBounds(0, 0, this.map.width, this.map.height);

    this.particleSystem = new ParticleSystem();
    window.particleSystem = this.particleSystem;

    // Entities
    this.player = new Player(this.map.spawnPoints.player.x, this.map.spawnPoints.player.y);
    this.bots = [];
    this.ghosts = [];

    // Game States: 'READY', 'PLAYING', 'PAUSED', 'ROUND_COMPLETE', 'GAMEOVER'
    this.state = 'READY';
    this.roundDuration = 60.0;
    this.roundTimeRemaining = 60.0;

    // Scoring & Stats
    this.survivalTime = 0;
    this.score = 10000;
    this.highScore = parseInt(localStorage.getItem('quickdash_highscore') || '0', 10);
    this.botsDefeated = 0;

    // UI Cache references
    this.hudElement = document.getElementById('hud');
    this.livesContainer = document.getElementById('lives-display');
    this.scoreText = document.getElementById('score-text');
    this.scoreWrapper = document.getElementById('score-display-wrapper');
    this.timerDisplay = document.getElementById('timer-display');
    this.shieldIndicator = document.getElementById('shield-indicator');

    this.startPromptOverlay = document.getElementById('start-prompt-overlay');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.pauseModal = document.getElementById('pause-modal');
    this.touchControls = document.getElementById('mobile-controls');

    // Shield Item System (Random drops, max 1 active, 1 free hit protection)
    this.shieldPickup = null;
    this.shieldSpawnTimer = 8.0;

    this.initEntities();
    this.camera.snapTo(this.player);
    this.updateHUD();
  }

  initEntities() {
    this.player.reset(this.map.spawnPoints.player.x, this.map.spawnPoints.player.y);

    // Three Unique Bots
    this.bots = [
      new KnifeChaser(this.map.spawnPoints.knifeChaser.x, this.map.spawnPoints.knifeChaser.y),
      new ArcherBot(this.map.spawnPoints.archer.x, this.map.spawnPoints.archer.y),
      new GhostAttractorBot(this.map.spawnPoints.ghostAttractor.x, this.map.spawnPoints.ghostAttractor.y)
    ];

    // Single active spectral hazard ghost (manipulated by Ghost Attractor)
    this.ghosts = [
      new Ghost(this.map.spawnPoints.ghost.x, this.map.spawnPoints.ghost.y)
    ];

    this.shieldPickup = null;
    this.shieldSpawnTimer = 8.0 + Math.random() * 4.0;

    this.roundTimeRemaining = this.roundDuration;
    this.survivalTime = 0;
    this.score = 10000;
    this.botsDefeated = 0;
    this.particleSystem.reset();
  }

  spawnGhost(x, y) {
    if (this.ghosts.length < 2) {
      this.ghosts.push(new Ghost(x, y));
    }
  }

  // Random shield spawn on safe, reachable platform waypoints
  spawnShield() {
    if (this.player.hasShield) return;
    if (this.shieldPickup && this.shieldPickup.active) return;

    const spawnPoints = this.map.shieldSpawnPoints || this.map.waypoints;
    if (!spawnPoints || spawnPoints.length === 0) return;

    const mapW = this.map.width;
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    // Filter points to ensure shield doesn't spawn directly on the player (at least 180px away)
    const validPoints = spawnPoints.filter(pt => {
      let dx = pt.x - playerCenterX;
      if (dx > mapW / 2) dx -= mapW;
      if (dx < -mapW / 2) dx += mapW;
      const dy = pt.y - playerCenterY;
      return Math.hypot(dx, dy) >= 180;
    });

    const pool = validPoints.length > 0 ? validPoints : spawnPoints;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    this.shieldPickup = new ShieldPickup(chosen.x, chosen.y);
    if (window.particleSystem) {
      particleSystem.createShieldCollectEffect(chosen.x, chosen.y);
    }
  }

  // Start the 60-second round immediately upon "TOUCH TO PLAY"
  startRound() {
    this.initEntities();
    this.camera.snapTo(this.player);
    this.state = 'PLAYING';

    if (this.startPromptOverlay) this.startPromptOverlay.style.display = 'none';
    if (this.gameOverScreen) this.gameOverScreen.style.display = 'none';
    if (this.pauseModal) this.pauseModal.style.display = 'none';

    // Enable HUD
    if (this.hudElement) this.hudElement.style.display = 'flex';

    // Show mobile controls on touch devices
    if (this.touchControls) {
      const isMobile = window.innerWidth <= 800 && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
      const isTouchEnabled = window.inputManager && window.inputManager.touchControlsActive;
      this.touchControls.style.display = (isMobile || isTouchEnabled) ? 'block' : 'none';
    }

    if (window.soundManager) {
      soundManager.init();
      soundManager.startMusic();
    }

    this.updateHUD();
  }

  pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      if (this.pauseModal) this.pauseModal.style.display = 'flex';
      if (window.soundManager) soundManager.playClick();
    }
  }

  resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      if (this.pauseModal) this.pauseModal.style.display = 'none';
      if (window.soundManager) soundManager.playClick();
    }
  }

  // Round finishes when 60-second timer reaches 0
  roundComplete() {
    this.state = 'ROUND_COMPLETE';
    // Survival score preserved
    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      localStorage.setItem('quickdash_highscore', this.highScore.toString());
    }

    if (this.touchControls) this.touchControls.style.display = 'none';

    const resTitle = document.getElementById('result-title');
    const resSubtitle = document.getElementById('result-subtitle');
    const finalTimeEl = document.getElementById('final-survival-time');
    const finalScoreEl = document.getElementById('final-score');
    const finalHighEl = document.getElementById('final-highscore');
    const finalBotsEl = document.getElementById('final-bots');

    if (resTitle) {
      resTitle.textContent = 'ROUND COMPLETE!';
      resTitle.style.color = '#22c55e';
    }
    if (resSubtitle) resSubtitle.textContent = 'Survived the full 60 seconds!';
    if (finalTimeEl) finalTimeEl.textContent = '60s';
    if (finalScoreEl) finalScoreEl.textContent = Math.floor(this.score).toString();
    if (finalHighEl) finalHighEl.textContent = this.highScore.toString();

    if (this.gameOverScreen) this.gameOverScreen.style.display = 'flex';
    if (window.soundManager) soundManager.playRoundWin ? soundManager.playRoundWin() : soundManager.playJump();
  }

  // Player loses all 3 lives
  gameOver() {
    this.state = 'GAMEOVER';
    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      localStorage.setItem('quickdash_highscore', this.highScore.toString());
    }

    if (this.touchControls) this.touchControls.style.display = 'none';

    const resTitle = document.getElementById('result-title');
    const resSubtitle = document.getElementById('result-subtitle');
    const finalTimeEl = document.getElementById('final-survival-time');
    const finalScoreEl = document.getElementById('final-score');
    const finalHighEl = document.getElementById('final-highscore');

    if (resTitle) {
      resTitle.textContent = 'GAME OVER';
      resTitle.style.color = '#ef4444';
    }
    if (resSubtitle) {

      if (this.score <= 0) {

        resSubtitle.textContent = 'Survival Score Depleted (0 / 10,000)!';

      } else {

        resSubtitle.textContent = 'All 3 lives lost!';

      }

    }
    if (finalTimeEl) finalTimeEl.textContent = `${Math.floor(this.survivalTime)}s`;
    if (finalScoreEl) finalScoreEl.textContent = Math.floor(this.score).toString();
    if (finalHighEl) finalHighEl.textContent = this.highScore.toString();

    if (this.gameOverScreen) this.gameOverScreen.style.display = 'flex';
  }

  update(dt, input) {
    if (input && input.actions && input.actions.pauseJustPressed) {
      if (this.state === 'PLAYING') {
        this.pauseGame();
      } else if (this.state === 'PAUSED') {
        this.resumeGame();
      }
    }

    // Always update ambient map & particle visuals so background never freezes
    if (this.map) this.map.update(dt);
    if (this.particleSystem) this.particleSystem.update(dt);
    if (this.camera && this.player) this.camera.follow(this.player, dt);

    if (this.state !== 'PLAYING') return;

    // 1. 60-Second Countdown Timer
    this.roundTimeRemaining -= dt;
    this.survivalTime += dt;
    // Score only decreases when taking damage
    this.score = this.player.score;

    if (this.roundTimeRemaining <= 0) {
      this.roundTimeRemaining = 0;
      this.updateHUD();
      this.roundComplete();
      return;
    }

    // 1.5 Shield Spawning & Update: 1 active shield in world or on player, never stacks
    if (!this.player.hasShield && (!this.shieldPickup || !this.shieldPickup.active)) {
      this.shieldSpawnTimer -= dt;
      if (this.shieldSpawnTimer <= 0) {
        this.spawnShield();
        this.shieldSpawnTimer = 13.0 + Math.random() * 7.0;
      }
    }

    if (this.shieldPickup && this.shieldPickup.active) {
      this.shieldPickup.update(dt, this.player, this.map);
    }

    // 2. Update Player (pass input and map in correct order)
    this.player.update(dt, input, this.map);

    // 3. Update Bots (Immortal hunters - cannot be damaged or killed)
    for (const bot of this.bots) {
      if (bot instanceof GhostAttractorBot) {
        bot.update(dt, this.player, this.map, this.ghosts, this);
      } else {
        bot.update(dt, this.player, this.map);
      }
    }

    // 4. Update Ghosts (smooth movement, contact damage, NO lasers)
    for (const ghost of this.ghosts) {
      ghost.update(dt, this.player, this.map);
    }

    // 5. Check Player Death (Score <= 0 or all 3 lives lost)
    if ((this.player.isDead || this.score <= 0 || this.player.lives <= 0) && this.state === 'PLAYING') {
      this.score = Math.max(0, this.score);
      this.player.score = this.score;
      this.state = 'DYING';
      setTimeout(() => {
        this.gameOver();
      }, 700);
    }

    // 7. Update HUD
    this.updateHUD();
  }

  updateHUD() {
    // 1. Lives: ♥ ♥ ♥
    if (this.livesContainer) {
      let heartsHtml = '';
      for (let i = 0; i < this.player.maxLives; i++) {
        heartsHtml += (i < this.player.lives)
          ? '<span class="heart full">♥</span>'
          : '<span class="heart empty">♥</span>';
      }
      this.livesContainer.innerHTML = heartsHtml;
    }

    // 2. Survival Score Display: 10,000
    if (this.scoreText) {
      const displayScore = Math.max(0, Math.round(this.score));
      this.scoreText.textContent = displayScore.toLocaleString();
    }
    if (this.scoreWrapper) {
      if (this.score <= 3000) {
        this.scoreWrapper.classList.add('low');
      } else {
        this.scoreWrapper.classList.remove('low');
      }
    }

    // 3. Dash Cooldown Indicator
    const dashFill = document.getElementById('dash-fill');
    const dashInd = document.getElementById('dash-indicator');
    if (dashFill && dashInd) {
      if (this.player.dashCooldownTimer <= 0) {
        dashFill.style.width = '100%';
        dashInd.classList.add('ready');
        dashInd.classList.remove('cooldown');
      } else {
        const pct = Math.max(0, Math.min(100, Math.round((1 - this.player.dashCooldownTimer / this.player.dashCooldown) * 100)));
        dashFill.style.width = pct + '%';
        dashInd.classList.remove('ready');
        dashInd.classList.add('cooldown');
      }
    }

    // 4. Shield Indicator
    if (this.shieldIndicator) {
      this.shieldIndicator.style.display = this.player.hasShield ? 'inline-flex' : 'none';
    }

    // 5. 60-Second Countdown Timer: 60 → 59 → ... → 0
    if (this.timerDisplay) {
      this.timerDisplay.textContent = Math.ceil(this.roundTimeRemaining);
    }
  }

  render() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = true;

    // Camera transform begins
    this.camera.begin(this.ctx);

    const mapW = this.map.width;
    const halfVisibleW = (this.camera.viewportWidth / this.camera.zoom) / 2 + 100;
    const viewLeft = this.camera.x - halfVisibleW;
    const viewRight = this.camera.x + halfVisibleW;

    const minCopy = Math.floor(viewLeft / mapW);
    const maxCopy = Math.floor(viewRight / mapW);

    // 1. Garden Map & Platforms (continuous repeating world across visible horizontal copies)
    this.map.draw(this.ctx, this.camera, minCopy, maxCopy);

    // 2. Entities rendered across visible world copies for seamless horizontal wraparound
    for (let k = minCopy; k <= maxCopy; k++) {
      this.ctx.save();
      this.ctx.translate(k * mapW, 0);

      // Shield Pickup
      if (this.shieldPickup && this.shieldPickup.active) {
        this.shieldPickup.draw(this.ctx);
      }

      // Ghosts
      for (const ghost of this.ghosts) {
        ghost.draw(this.ctx);
      }

      // Bots
      for (const bot of this.bots) {
        bot.draw(this.ctx);
      }

      // Player
      this.player.draw(this.ctx);

      // Particles
      this.particleSystem.draw(this.ctx);

      this.ctx.restore();
    }

    // Camera transform ends
    this.camera.end(this.ctx);
  }
}

window.GameController = GameController;
