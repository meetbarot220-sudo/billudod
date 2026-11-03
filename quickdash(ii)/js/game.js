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
    this.botsDefeated = 0;

    // UI Cache references
    this.hudElement = document.getElementById('hud');
    this.livesContainer = null;
    this.scoreText = document.getElementById('score-text');
    this.scoreWrapper = document.getElementById('score-display-wrapper');
    this.timerDisplay = document.getElementById('timer-display');
    this.shieldIndicator = document.getElementById('shield-indicator');

    this.startPromptOverlay = document.getElementById('start-prompt-overlay');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.touchControls = document.getElementById('mobile-controls');

    // Shield Item System (Random drops, max 1 active, 1 free hit protection)
    this.shieldPickup = null;
    this.shieldSpawnTimer = 8.0;
    this.magicalWall = null;

    this.initEntities();
    this.camera.snapTo(this.player);
    this.updateHUD();
  }

  initEntities() {
    this.player.reset(this.map.spawnPoints.player.x, this.map.spawnPoints.player.y);

    // Generate distinct, randomized, well-distributed enemy spawns far from player
    const enemySpawns = (this.map && this.map.generateAllEnemySpawns)
      ? this.map.generateAllEnemySpawns(this.player)
      : this.map.spawnPoints;

    // Update map spawnPoints with the new safe random coordinates
    if (this.map && this.map.spawnPoints) {
      if (enemySpawns.knifeChaser) this.map.spawnPoints.knifeChaser = enemySpawns.knifeChaser;
      if (enemySpawns.archer) this.map.spawnPoints.archer = enemySpawns.archer;
      if (enemySpawns.ghostAttractor) this.map.spawnPoints.ghostAttractor = enemySpawns.ghostAttractor;
      if (enemySpawns.ghost) this.map.spawnPoints.ghost = enemySpawns.ghost;
    }

    // Three Unique Bots ONLY: Knife, Archer, Ghost Attractor (with Wall spell ability)
    this.bots = [
      new KnifeChaser(enemySpawns.knifeChaser.x, enemySpawns.knifeChaser.y),
      new ArcherBot(enemySpawns.archer.x, enemySpawns.archer.y),
      new GhostAttractorBot(enemySpawns.ghostAttractor.x, enemySpawns.ghostAttractor.y)
    ];

    this.magicalWall = null;

    // Single active spectral hazard ghost (manipulated by Ghost Attractor)
    this.ghosts = [
      new Ghost(enemySpawns.ghost.x, enemySpawns.ghost.y)
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
      if (x === undefined || y === undefined) {
        const sp = (this.map && this.map.getSafeGhostSpawn)
          ? this.map.getSafeGhostSpawn(this.player, this.ghosts)
          : (this.map && this.map.spawnPoints && this.map.spawnPoints.ghost) || { x: 1380, y: 240 };
        x = sp.x;
        y = sp.y;
      }
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

    // Enable HUD
    if (this.hudElement) this.hudElement.style.display = 'flex';

    // Show mobile controls on touch devices in portrait
    if (this.touchControls) {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isMobile = isPortrait || (isTouch && window.innerWidth <= 900);
      if (isMobile) {
        this.touchControls.style.removeProperty('display');
      } else {
        this.touchControls.style.display = 'none';
      }
    }

    if (window.soundManager) {
      soundManager.init();
      soundManager.startMusic();
    }

    this.updateHUD();
  }

  pauseGame() { /* Pause menu removed */ }
  resumeGame() { /* Pause menu removed */ }
  // Trigger Victory: Timer reached 0 with score > 0
  triggerVictory() {
    if (this.state !== 'PLAYING') return;
    this.state = 'VICTORY';

    // Lock exact final survival score
    const finalScore = Math.max(0, Math.round(this.score));
    this.score = finalScore;
    this.player.score = finalScore;
    this.roundTimeRemaining = 0;

    // Hide normal gameplay HUD and mobile touch buttons so round is clearly ended
    if (this.hudElement) this.hudElement.style.display = 'none';
    if (this.touchControls) this.touchControls.style.display = 'none';

    // Populate Result Screen UI
    const resTitle = document.getElementById('result-title');
    const resSubtitle = document.getElementById('result-subtitle');
    const finalTimeEl = document.getElementById('final-survival-time');
    const finalScoreEl = document.getElementById('final-score');

    if (resTitle) {
      resTitle.textContent = 'YOU WIN!';
      resTitle.style.color = '#22c55e';
    }
    if (resSubtitle) {
      resSubtitle.textContent = 'Survived the full 60 seconds!';
      resSubtitle.style.color = '#86efac';
    }
    if (finalTimeEl) finalTimeEl.textContent = '60s';
    if (finalScoreEl) {
      finalScoreEl.textContent = finalScore.toLocaleString();
      finalScoreEl.style.color = '#38bdf8';
    }

    // Show result overlay screen
    if (this.gameOverScreen) this.gameOverScreen.style.display = 'flex';

    if (window.soundManager && soundManager.playRoundWin) {
      soundManager.playRoundWin();
    }
  }

  // Trigger Game Over: Survival Score reached 0
  triggerGameOver(reasonSubtitle = null) {
    if (this.state !== 'PLAYING') return;
    this.state = 'GAME_OVER';

    // Score is the sole survival metric; clamp to 0
    const finalScore = Math.max(0, Math.round(this.player.score));
    this.score = finalScore;
    this.player.score = finalScore;
    this.player.isDead = true;

    // Hide normal gameplay HUD and mobile touch buttons
    if (this.hudElement) this.hudElement.style.display = 'none';
    if (this.touchControls) this.touchControls.style.display = 'none';

    // Populate Result Screen UI (Final Score and Time Survived only)
    const resTitle = document.getElementById('result-title');
    const resSubtitle = document.getElementById('result-subtitle');
    const finalTimeEl = document.getElementById('final-survival-time');
    const finalScoreEl = document.getElementById('final-score');

    if (resTitle) {
      resTitle.textContent = 'GAME OVER';
      resTitle.style.color = '#ef4444';
    }
    if (resSubtitle) {
      if (reasonSubtitle) {
        resSubtitle.textContent = reasonSubtitle;
      } else {
        resSubtitle.textContent = 'Survival Score Depleted (0 / 10,000)!';
      }
      resSubtitle.style.color = '#fca5a5';
    }
    if (finalTimeEl) finalTimeEl.textContent = `${Math.floor(this.survivalTime)}s`;
    if (finalScoreEl) {
      finalScoreEl.textContent = finalScore.toLocaleString();
      finalScoreEl.style.color = '#ef4444';
    }

    // Show result overlay screen
    if (this.gameOverScreen) this.gameOverScreen.style.display = 'flex';

    if (window.soundManager) {
      soundManager.playPlayerDeath();
    }
  }

  // Backwards compatibility aliases
  roundComplete() { this.triggerVictory(); }
  gameOver() { this.triggerGameOver(); }

  update(dt, input) {
    // Always update ambient map & particle visuals so background never freezes
    if (this.map) this.map.update(dt);
    if (this.particleSystem) this.particleSystem.update(dt);
    if (this.camera && this.player) this.camera.follow(this.player, dt);

    if (this.state !== 'PLAYING') return;

    // 1. Check LOSE Condition IMMEDIATELY: Score reaches 0
    if (this.score <= 0 || this.player.score <= 0 || this.player.isDead) {
      this.triggerGameOver();
      return;
    }

    // 2. 60-Second Countdown Timer & Survival Time
    this.roundTimeRemaining -= dt;
    this.survivalTime += dt;
    this.score = this.player.score;

    // Check WIN Condition: Timer reaches 0 with score > 0
    if (this.roundTimeRemaining <= 0) {
      this.roundTimeRemaining = 0;
      this.triggerVictory();
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

    // Re-check LOSE condition right after player updates
    if (this.player.score <= 0 || this.player.isDead) {
      this.triggerGameOver();
      return;
    }

    // 3. Update Bots (Immortal hunters - cannot be damaged or killed)
    for (const bot of this.bots) {
      try {
        if (bot instanceof GhostAttractorBot || bot.typeName === 'Ghost Attractor') {
          bot.update(dt, this.player, this.map, this.ghosts, this);
        } else {
          bot.update(dt, this.player, this.map);
        }
      } catch (botErr) {
        console.error('Bot update error caught:', botErr);
      }

      // Safeguard: validate coordinates so bot cannot silently disappear
      if (isNaN(bot.x) || isNaN(bot.y) || !isFinite(bot.x) || !isFinite(bot.y) || bot.y > this.map.height + 50) {
        const otherBots = this.bots.filter(b => b !== bot);
        const sp = (this.map && this.map.getSafeBotSpawn)
          ? this.map.getSafeBotSpawn(this.player, otherBots)
          : ((this.map && this.map.spawnPoints && this.map.spawnPoints[bot.spawnKey]) || { x: 230, y: 593 });
        bot.x = sp.x;
        bot.y = sp.y;
        bot.prevX = sp.x;
        bot.prevY = sp.y;
        bot.vx = 0;
        bot.vy = 0;
        bot.grounded = true;
      }
    }

    // 3.5 Update Magical Wall (Temporary 3s obstacle, blocks only 1 jump route)
    if (this.magicalWall) {
      this.magicalWall.update(dt);
      if (!this.magicalWall.active) {
        this.magicalWall = null;
      } else {
        // Resolve solid collision with player
        const mw = this.map.width;
        let dx = (this.player.x + this.player.width / 2) - this.magicalWall.x;
        if (dx > mw / 2) dx -= mw;
        if (dx < -mw / 2) dx += mw;

        const halfP = this.player.width / 2;
        const halfW = this.magicalWall.w / 2;
        const minDist = halfP + halfW;

        const wallTop = this.magicalWall.y;
        const wallBottom = this.magicalWall.y + this.magicalWall.h;
        // Localized barrier: Collides ONLY if player is vertically within this single 145px jump route!
        // If player is on the open route above or below, they pass freely with zero collision!
        const playerTop = this.player.y;
        const playerBottom = this.player.y + this.player.height;
        const isVerticallyInWall = (playerBottom > wallTop) && (playerTop < wallBottom);

        if (Math.abs(dx) < minDist && isVerticallyInWall) {
          if (dx >= 0) {
            this.player.x = ((this.magicalWall.x + minDist - halfP) % mw + mw) % mw;
            if (this.player.vx < 0) this.player.vx = 0;
          } else {
            this.player.x = ((this.magicalWall.x - minDist - halfP) % mw + mw) % mw;
            if (this.player.vx > 0) this.player.vx = 0;
          }
          if (this.player.isDashing) {
            this.player.isDashing = false;
            if (window.soundManager) soundManager.playShieldBreak();
            if (window.particleSystem) {
              particleSystem.createShieldBreakEffect(this.player.x + halfP, this.player.y + this.player.height / 2);
            }
          }
        }
      }
    }

    // 4. Update Ghosts (smooth movement, contact damage)
    for (const ghost of this.ghosts) {
      try {
        ghost.update(dt, this.player, this.map);
      } catch (ghostErr) {
        console.error('Ghost update error caught:', ghostErr);
      }

      if (isNaN(ghost.x) || isNaN(ghost.y) || !isFinite(ghost.x) || !isFinite(ghost.y) || ghost.y > this.map.height) {
        const sp = (this.map && this.map.getSafeGhostSpawn)
          ? this.map.getSafeGhostSpawn(this.player, this.ghosts.filter(g => g !== ghost))
          : ((this.map && this.map.spawnPoints && this.map.spawnPoints.ghost) || { x: 1380, y: 240 });
        ghost.x = sp.x;
        ghost.y = sp.y;
        ghost.vx = 0;
        ghost.vy = 0;
      }
    }

    // Re-check LOSE condition right after bot/ghost interactions
    if (this.player.score <= 0 || this.player.isDead) {
      this.triggerGameOver();
      return;
    }

    // 5. Update HUD during active round
    this.updateHUD();
  }

  updateHUD() {


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

    const minCopy = Math.floor(viewLeft / mapW) - 1;
    const maxCopy = Math.floor(viewRight / mapW) + 1;

    // 1. Garden Map & Platforms (continuous repeating world across visible horizontal copies)
    this.map.draw(this.ctx, this.camera, minCopy, maxCopy);

    // 2. Entities rendered across visible world copies for seamless horizontal wraparound
    for (let k = minCopy; k <= maxCopy; k++) {
      this.ctx.save();
      this.ctx.translate(k * mapW, 0);

      // Magical Wall (active 5-second obstacle barrier)
      if (this.magicalWall && this.magicalWall.active) {
        this.magicalWall.draw(this.ctx);
      }

      // Shield Pickup
      if (this.shieldPickup && this.shieldPickup.active) {
        this.shieldPickup.draw(this.ctx);
      }

      // Ghosts
      for (const ghost of this.ghosts) {
        if (ghost && ghost.active) {
          try { ghost.draw(this.ctx); } catch (e) { console.error('Ghost draw error:', e); }
        }
      }

      // Bots
      for (const bot of this.bots) {
        if (bot) {
          try { bot.draw(this.ctx); } catch (e) { console.error('Bot draw error:', e); }
        }
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
