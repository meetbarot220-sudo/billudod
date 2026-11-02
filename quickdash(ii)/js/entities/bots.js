/**
 * Bots Module - Three Unique Enemy Bots matching Multiplayer Quick Tag Character Style
 * 1. KnifeChaser: Crimson rogue cat that aggressively pursues and slashes with a knife
 * 2. Archer: Forest ranger cat that kites away and fires predictive arrows
 * 3. GhostAttractor: Mystic violet cat that channels ethereal tether beams to summon ghosts
 *
 * Clean visual presentation: NO floating overhead health bars (clean HUD like reference).
 * Each bot takes 3 hits to defeat with clear hurt flash, knockback, and hit sparks.
 */

class BaseBot {
  constructor(x, y, typeName) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.width = 34; // 1.3x bot size (scaled from 26)
    this.height = 42; // 1.3x bot size (scaled from 32)
    this.typeName = typeName;

    // Physics
    this.vx = 0;
    this.vy = 0;
    this.gravity = 1400;
    this.grounded = false;
    this.facing = 1;

    // Bots are immortal hunters: NO HP, NO death, cannot be killed
    this.isDead = false;

    // State machine
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.animTime = Math.random() * 5;
    this.jumpCooldown = 0;
    this.tailAngle = 0;
  }

  takeDamage(amount = 1, fromSourceX = null) {
    // Bots CANNOT be damaged or killed!
    return false;
  }
}

// ----------------------------------------------------
// BOT 1 — KNIFE CHASER (Crimson Rogue Cat)
// ----------------------------------------------------
class KnifeChaser extends BaseBot {
  constructor(x, y) {
    super(x, y, 'Knife Chaser');
    this.speed = 320;
    this.windupDuration = 0.16;
    this.attackDuration = 0.18;
    this.attackCooldown = 0.30;
    this.attackRange = 60;
    this.state = 'CHASE';
  }

  update(dt, player, map) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.animTime += dt;
    this.stateTimer += dt;
    if (this.jumpCooldown > 0) this.jumpCooldown -= dt;

    this.tailAngle = Math.sin(this.animTime * 16) * 0.5;

    let dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    if (dx > map.width / 2) dx -= map.width;
    if (dx < -map.width / 2) dx += map.width;
    const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
    const dist = Math.hypot(dx, dy);

    this.facing = dx >= 0 ? 1 : -1;

    switch (this.state) {
      case 'CHASE':
        this.vx = this.facing * this.speed;

        if (this.grounded && this.jumpCooldown <= 0) {
          const needsJumpUp = dy < -26 && Math.abs(dx) < 320;
          if (needsJumpUp || (Math.abs(dx) > 80 && Math.random() < 0.045)) {
            this.vy = -630;
            this.grounded = false;
            this.jumpCooldown = 0.55;
            if (window.soundManager) soundManager.playJump();
          }
        }

        if (dist <= this.attackRange && Math.abs(dy) < 65) {
          this.state = 'WINDUP';
          this.stateTimer = 0;
          this.vx *= 0.3;
        }
        break;

      case 'WINDUP':
        this.vx *= 0.8;
        if (this.stateTimer >= this.windupDuration) {
          this.state = 'ATTACK';
          this.stateTimer = 0;
          this.vx = this.facing * 440; // Relentless lunge
          if (window.soundManager) soundManager.playKnifeAttack();
        }
        break;

      case 'ATTACK':
        // Player cannot be damaged while in DASH state!
        if (dist < 44 && Math.abs(dy) < 34 && !player.isDashing) {
          player.takeDamage(1000, this.x, false);
        }

        if (this.stateTimer >= this.attackDuration) {
          this.state = 'COOLDOWN';
          this.stateTimer = 0;
        }
        break;

      case 'COOLDOWN':
        this.vx *= 0.8;
        if (this.stateTimer >= this.attackCooldown) {
          this.state = 'CHASE';
          this.stateTimer = 0;
        }
        break;
    }

    this.vy += this.gravity * dt;
    if (this.vy > 900) this.vy = 900;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    map.resolveEntity(this, dt);

    // Seamless continuous horizontal world wraparound
    if (this.x >= map.width) {
      this.x -= map.width;
      this.prevX -= map.width;
    } else if (this.x < 0) {
      this.x += map.width;
      this.prevX += map.width;
    }

    // Vertical wraparound through open bottom (emerges from top sky)
    if (this.y > map.height) {
      this.y = 45;
      this.prevY = 45;
      this.grounded = false;
      this.vy = Math.min(this.vy, 350);
    }
  }

  draw(ctx) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(this.facing * 1.3, 1.3); // 1.3x render scale

    const baseW = 26;
    const baseH = 32;
    const halfW = 13;
    const halfH = 16;

    // Ground shadow
    if (this.grounded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, halfH + 2, halfW * 0.9, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cat Tail
    ctx.save();
    ctx.translate(-halfW + 4, halfH - 8);
    ctx.rotate(this.tailAngle);
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-10, -6, -14, -14);
    ctx.stroke();
    ctx.restore();

    // Cat Paws
    const isRunning = Math.abs(this.vx) > 30 && this.grounded;
    const paw1 = isRunning ? Math.sin(this.animTime * 18) * 5 : 0;
    const paw2 = isRunning ? -Math.sin(this.animTime * 18) * 5 : 0;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(-6 + paw2 * 0.4, halfH - 4 + Math.max(0, -paw2), 4, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(3 + paw1 * 0.4, halfH - 4 + Math.max(0, paw1), 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Crimson Rogue)
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-halfW, -halfH + 4, baseW, baseH - 8, 9);
    else ctx.rect(-halfW, -halfH + 4, baseW, baseH - 8);
    ctx.fill();

    // Bandit Headband
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-halfW, -halfH + 2, baseW, 4);

    // Cat Ears
    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.moveTo(-halfW + 4, -halfH + 5);
    ctx.lineTo(-halfW + 8, -halfH - 7);
    ctx.lineTo(-halfW + 13, -halfH + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(halfW - 13, -halfH + 4);
    ctx.lineTo(halfW - 8, -halfH - 7);
    ctx.lineTo(halfW - 3, -halfH + 5);
    ctx.closePath();
    ctx.fill();

    // Menacing Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(halfW - 6, -halfH + 11, 3.5, 0, Math.PI * 2);
    ctx.arc(halfW - 14, -halfH + 11, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(halfW - 5, -halfH + 11, 2, 0, Math.PI * 2);
    ctx.arc(halfW - 13, -halfH + 11, 2, 0, Math.PI * 2);
    ctx.fill();

    // Knife Arm & Dagger
    ctx.save();
    if (this.state === 'WINDUP') {
      ctx.translate(-2, -halfH + 16);
      ctx.rotate(-0.9);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.beginPath();
      ctx.arc(14, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.state === 'ATTACK') {
      ctx.translate(14, -halfH + 16);
      ctx.rotate(0.3);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24, -0.6, 0.6);
      ctx.stroke();
    } else {
      ctx.translate(6, -halfH + 16);
      ctx.rotate(0.15);
    }

    // Dagger
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(2, -2.5);
    ctx.lineTo(16, 0);
    ctx.lineTo(2, 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2, -2, 4, 4);

    ctx.restore();
    ctx.restore();
  }
}

// ----------------------------------------------------
// BOT 2 — ARCHER (Forest Ranger Cat)
// ----------------------------------------------------
class ArcherBot extends BaseBot {
  constructor(x, y) {
    super(x, y, 'Archer');
    this.speed = 250;
    this.minDistance = 200;
    this.maxDistance = 460;
    this.aimDuration = 0.26;
    this.shotCooldown = 0.95;
    this.arrows = [];
    this.aimAngle = 0;
    this.state = 'POSITION';
  }

  update(dt, player, map) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.animTime += dt;
    this.stateTimer += dt;
    if (this.jumpCooldown > 0) this.jumpCooldown -= dt;

    // Update active arrows
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arrow = this.arrows[i];
      arrow.update(dt, map);
      arrow.checkHitPlayer(player, map);
      if (!arrow.active) {
        this.arrows.splice(i, 1);
      }
    }

    this.tailAngle = Math.sin(this.animTime * 12) * 0.38;

    let dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    if (dx > map.width / 2) dx -= map.width;
    if (dx < -map.width / 2) dx += map.width;
    const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
    const dist = Math.hypot(dx, dy);

    this.facing = dx >= 0 ? 1 : -1;

    // High accuracy predictive aiming: leads the player's movement and dash trajectory
    const arrowSpeed = 640;
    const timeToTarget = dist / arrowSpeed;
    const targetRelX = dx + (player.vx || 0) * timeToTarget * 1.05;
    const targetRelY = dy + (player.vy || 0) * timeToTarget * 0.75;
    this.aimAngle = Math.atan2(targetRelY, targetRelX);

    switch (this.state) {
      case 'POSITION':
        if (dist < this.minDistance) {
          this.vx = -this.facing * this.speed;
          if (this.grounded && this.jumpCooldown <= 0 && Math.random() < 0.06) {
            this.vy = -600;
            this.grounded = false;
            this.jumpCooldown = 0.75;
          }
        } else if (dist > this.maxDistance) {
          this.vx = this.facing * this.speed;
        } else {
          this.vx *= 0.6;
          if (this.stateTimer >= 0.12) {
            this.state = 'AIM';
            this.stateTimer = 0;
          }
        }
        break;

      case 'AIM':
        this.vx *= 0.5;
        if (dist < 100) {
          this.state = 'RETREAT';
          this.stateTimer = 0;
          break;
        }

        if (this.stateTimer >= this.aimDuration) {
          this.state = 'SHOOT';
          this.stateTimer = 0;

          const arrowVx = Math.cos(this.aimAngle) * arrowSpeed;
          const arrowVy = Math.sin(this.aimAngle) * arrowSpeed - 15;

          const arrow = new Arrow(
            this.x + this.width / 2 + Math.cos(this.aimAngle) * 18,
            this.y + this.height / 2 + Math.sin(this.aimAngle) * 18,
            arrowVx,
            arrowVy
          );
          this.arrows.push(arrow);

          if (window.soundManager) soundManager.playBowShoot();
        }
        break;

      case 'SHOOT':
        if (this.stateTimer >= 0.10) {
          this.state = 'COOLDOWN';
          this.stateTimer = 0;
        }
        break;

      case 'COOLDOWN':
        if (dist < this.minDistance) {
          this.vx = -this.facing * (this.speed * 0.7);
        } else {
          this.vx *= 0.8;
        }

        if (this.stateTimer >= this.shotCooldown) {
          this.state = 'POSITION';
          this.stateTimer = 0;
        }
        break;

      case 'RETREAT':
        this.vx = -this.facing * (this.speed * 1.1);
        if (this.grounded && this.jumpCooldown <= 0) {
          this.vy = -520;
          this.grounded = false;
          this.jumpCooldown = 1.0;
        }
        if (this.stateTimer >= 0.6 || dist >= this.minDistance) {
          this.state = 'POSITION';
          this.stateTimer = 0;
        }
        break;
    }

    this.vy += this.gravity * dt;
    if (this.vy > 900) this.vy = 900;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    map.resolveEntity(this, dt);

    // Seamless continuous horizontal world wraparound
    if (this.x >= map.width) {
      this.x -= map.width;
      this.prevX -= map.width;
    } else if (this.x < 0) {
      this.x += map.width;
      this.prevX += map.width;
    }

    // Vertical wraparound through open bottom (emerges from top sky)
    if (this.y > map.height) {
      this.y = 45;
      this.prevY = 45;
      this.grounded = false;
      this.vy = Math.min(this.vy, 350);
    }
  }

  draw(ctx) {
    for (const arrow of this.arrows) {
      arrow.draw(ctx);
    }

    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(this.facing * 1.3, 1.3); // 1.3x render scale

    const baseW = 26;
    const baseH = 32;
    const halfW = 13;
    const halfH = 16;

    if (this.grounded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, halfH + 2, halfW * 0.9, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cat Tail
    ctx.save();
    ctx.translate(-halfW + 4, halfH - 8);
    ctx.rotate(this.tailAngle);
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-10, -6, -14, -14);
    ctx.stroke();
    ctx.restore();

    // Paws
    const isRunning = Math.abs(this.vx) > 30 && this.grounded;
    const paw1 = isRunning ? Math.sin(this.animTime * 18) * 5 : 0;
    const paw2 = isRunning ? -Math.sin(this.animTime * 18) * 5 : 0;
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.ellipse(-6 + paw2 * 0.4, halfH - 4 + Math.max(0, -paw2), 4, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(3 + paw1 * 0.4, halfH - 4 + Math.max(0, paw1), 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Forest Ranger Green)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-halfW, -halfH + 4, baseW, baseH - 8, 9);
    else ctx.rect(-halfW, -halfH + 4, baseW, baseH - 8);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.moveTo(-halfW + 4, -halfH + 5);
    ctx.lineTo(-halfW + 8, -halfH - 7);
    ctx.lineTo(-halfW + 13, -halfH + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(halfW - 13, -halfH + 4);
    ctx.lineTo(halfW - 8, -halfH - 7);
    ctx.lineTo(halfW - 3, -halfH + 5);
    ctx.closePath();
    ctx.fill();

    // Ranger Cap
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.ellipse(0, -halfH + 4, halfW, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(halfW - 6, -halfH + 11, 3.5, 0, Math.PI * 2);
    ctx.arc(halfW - 14, -halfH + 11, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(halfW - 5, -halfH + 11, 2, 0, Math.PI * 2);
    ctx.arc(halfW - 13, -halfH + 11, 2, 0, Math.PI * 2);
    ctx.fill();

    // Bow & String
    ctx.save();
    ctx.translate(6, -halfH + 16);

    const isAiming = this.state === 'AIM';
    const pull = isAiming ? Math.min(8, (this.stateTimer / this.aimDuration) * 8) : 0;

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 14, -1.1, 1.1);
    ctx.stroke();

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const tipTopX = Math.cos(-1.1) * 14;
    const tipTopY = Math.sin(-1.1) * 14;
    const tipBotX = Math.cos(1.1) * 14;
    const tipBotY = Math.sin(1.1) * 14;

    ctx.moveTo(tipTopX, tipTopY);
    ctx.lineTo(-pull, 0);
    ctx.lineTo(tipBotX, tipBotY);
    ctx.stroke();

    if (isAiming) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-pull, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }
}

// ----------------------------------------------------
// BOT 3 — PURPLE WAND BOT / GHOST ATTRACTOR (Mystic Violet Cat)
// Dual role:
// 1. Ghost Attraction: Summons and tethers spectral ghosts toward the player.
// 2. Magical Wall Ability: Every 5-second cycle, charges with visible wand buildup -> materializes a 3-second localized barrier that blocks ONLY ONE jump route, leaving the other route completely open!
// ----------------------------------------------------
class GhostAttractorBot extends BaseBot {
  constructor(x, y) {
    super(x, y, 'Ghost Attractor');
    this.speed = 225;

    // AI Waypoint navigation
    this.currentWaypointIndex = 0;

    // Ghost attraction mechanics
    this.attractInterval = 3.2;
    this.attractTimer = 1.0;
    this.tetherAlpha = 0;
    this.targetGhost = null;

    // Wall Attack Cycle State Machine
    // Every 5-second cycle: CHARGE (5.0s visible wand warning) -> WALL_ACTIVE (strictly 3.0s barrier) -> COOLDOWN (2.0s) -> repeat
    this.wallState = 'CHARGE'; // Begin charging for early battle excitement
    this.wallChargeDuration = 5.0;   // 5.0s full visible warning & charging buildup
    this.wallDuration = 3.0;         // Strictly 3.0s wall active duration
    this.wallCooldownDuration = 2.0; // Rest before next 5s attack cycle
    this.wallStateTimer = 0;
    this.chargeSoundTimer = 0;

    // Targeted jump route geometry (blocks ONLY ONE jump route!)
    this.targetX = x + 180;
    this.targetY = 490;
    this.targetH = 145; // Height of one jump route
    this.targetLocked = false;
  }

  update(dt, player, map, ghosts, game) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.animTime += dt;
    this.stateTimer += dt;
    this.wallStateTimer += dt;
    if (this.jumpCooldown > 0) this.jumpCooldown -= dt;

    if (this.tetherAlpha > 0) {
      this.tetherAlpha -= dt * 2;
    }

    this.tailAngle = Math.sin(this.animTime * 9) * 0.35;

    const mw = map.width;
    let dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    if (dx > mw / 2) dx -= mw;
    if (dx < -mw / 2) dx += mw;
    this.facing = dx >= 0 ? 1 : -1;

    // 1. Waypoint Platform Traversal AI across 1700px garden map
    const waypoints = map.waypoints && map.waypoints.length > 0
      ? map.waypoints
      : [{ x: 360, y: 470 }, { x: 850, y: 470 }, { x: 1340, y: 470 }];
    const wp = waypoints[this.currentWaypointIndex % waypoints.length];
    let wpDx = wp.x - (this.x + this.width / 2);
    if (wpDx > mw / 2) wpDx -= mw;
    if (wpDx < -mw / 2) wpDx += mw;

    if (Math.abs(wpDx) > 20) {
      this.vx = (wpDx > 0 ? 1 : -1) * this.speed * (this.wallState === 'CHARGE' ? 0.5 : 0.85);
    } else {
      this.vx *= 0.7;
      if (Math.random() < 0.02) {
        this.currentWaypointIndex = Math.floor(Math.random() * waypoints.length);
      }
    }

    if (this.grounded && this.jumpCooldown <= 0 && wp.y < this.y - 36) {
      this.vy = -600;
      this.grounded = false;
      this.jumpCooldown = 1.2;
    }

    // 2. Ghost Attraction Cycle (Summons & lures ghosts towards player)
    this.attractTimer -= dt;
    if (this.attractTimer <= 0) {
      this.attractTimer = this.attractInterval;

      if (ghosts && ghosts.length === 0 && game) {
        game.spawnGhost(this.x + (this.facing > 0 ? 60 : -60), this.y - 40);
        this.tetherAlpha = 1.0;
        if (window.soundManager) soundManager.playGhostAttract();
      } else if (ghosts && ghosts.length > 0) {
        this.targetGhost = ghosts[0];
        if (this.targetGhost) {
          this.targetGhost.attractTowards(player, this);
          this.tetherAlpha = 1.0;
          if (window.soundManager) soundManager.playGhostAttract();

          if (window.particleSystem) {
            particleSystem.emit({
              x: this.x + this.width / 2,
              y: this.y + this.height / 2,
              count: 8,
              speed: 130,
              color: '#c084fc',
              type: 'circle'
            });
          }
        }
      }
    }

    // 3. Wall Attack System: Every 5 seconds begins wall attack
    switch (this.wallState) {
      case 'COOLDOWN':
        if (this.wallStateTimer >= this.wallCooldownDuration) {
          // Begin 5-second CHARGING WARNING phase
          this.wallState = 'CHARGE';
          this.wallStateTimer = 0;
          this.chargeSoundTimer = 0;
          this.targetLocked = false;
          if (window.soundManager) soundManager.playMagicCharge();
        }
        break;

      case 'CHARGE':
        // Pulse charging audio cue every 1.25s
        this.chargeSoundTimer += dt;
        if (this.chargeSoundTimer >= 1.25 && this.wallStateTimer < this.wallChargeDuration - 0.5) {
          this.chargeSoundTimer = 0;
          if (window.soundManager) soundManager.playMagicCharge();
        }

        // Target ONE jump route ahead of the player:
        // Analyzes player's current vertical tier and direction to block exactly ONE jump/route,
        // leaving the alternate route (underneath, above, or around) completely open!
        if (!this.targetLocked) {
          const moveDir = (player.vx !== 0 ? Math.sign(player.vx) : player.facing);
          let proposedX = player.x + (player.width / 2) + moveDir * 180;
          this.targetX = ((proposedX % mw) + mw) % mw;

          // Never spawn directly on player: ensure at least 130px distance
          let distFromPlayer = Math.abs(this.targetX - (player.x + player.width / 2));
          if (distFromPlayer < 120) {
            this.targetX = (( (player.x + player.width / 2 + moveDir * 160) % mw ) + mw) % mw;
          }

          // Choose jump route height based on player tier:
          // Localized height h = 145px (spans ONLY between two tiers, NOT whole screen)
          if (player.y >= 610) {
            // Player near ground (y = 780): Block jump route up to Lower tier (y = 635 .. 780)
            this.targetY = 635;
            this.targetH = 145;
          } else if (player.y >= 460) {
            // Player at Lower tier (y = 635): Block jump route up to Mid tier (y = 490 .. 635)
            // Route below (down to ground) and above remain completely open!
            this.targetY = 490;
            this.targetH = 145;
          } else if (player.y >= 320) {
            // Player at Mid tier (y = 490): Block jump route up to Upper tier (y = 350 .. 490)
            // Route below (lower tier/ground) remains completely open!
            this.targetY = 350;
            this.targetH = 140;
          } else {
            // Player at Upper tier (y = 350): Block jump route up to Summit (y = 210 .. 350)
            this.targetY = 210;
            this.targetH = 140;
          }

          // Lock the target position for the final 1.5 seconds of charging
          if (this.wallStateTimer >= this.wallChargeDuration - 1.5) {
            this.targetLocked = true;
          }
        }

        // Visible magical particles gathering into the wand crystal orb
        if (window.particleSystem && Math.random() < 0.65) {
          const wandX = this.x + (this.facing > 0 ? this.width + 12 : -12);
          const wandY = this.y + 10;
          particleSystem.emit({
            x: wandX + (Math.random() - 0.5) * 26,
            y: wandY + (Math.random() - 0.5) * 26,
            count: 2,
            speed: 60,
            color: '#e879f9',
            type: 'spark'
          });
        }

        // When 5 seconds of charging finishes: MATERIALIZE 3-SECOND WALL
        if (this.wallStateTimer >= this.wallChargeDuration) {
          this.wallState = 'WALL_ACTIVE';
          this.wallStateTimer = 0;

          if (game) {
            game.magicalWall = new MagicalWall(this.targetX, this.targetY, this.targetH, mw, this.wallDuration);
          }
          if (window.soundManager) soundManager.playWallSpawn();

          // Particle flash along the localized wall bounds
          if (window.particleSystem) {
            for (let py = this.targetY; py <= this.targetY + this.targetH; py += 30) {
              particleSystem.emit({
                x: this.targetX,
                y: py,
                count: 3,
                speed: 100,
                color: '#f0abfc',
                type: 'spark'
              });
            }
          }
        }
        break;

      case 'WALL_ACTIVE':
        // Wall is active for STRICTLY 3.0 SECONDS
        if (this.wallStateTimer >= this.wallDuration) {
          this.wallState = 'COOLDOWN';
          this.wallStateTimer = 0;
          if (game && game.magicalWall) {
            game.magicalWall = null;
          }
          if (window.soundManager) soundManager.playWallFade();
        }
        break;
    }

    // 4. Physics and Seamless Horizontal Wraparound
    this.vy += this.gravity * dt;
    if (this.vy > 900) this.vy = 900;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    map.resolveEntity(this, dt);

    if (this.x >= map.width) {
      this.x -= map.width;
      this.prevX -= map.width;
    } else if (this.x < 0) {
      this.x += map.width;
      this.prevX += map.width;
    }

    // Vertical wraparound through open bottom (emerges from top sky)
    if (this.y > map.height) {
      this.y = 45;
      this.prevY = 45;
      this.grounded = false;
      this.vy = Math.min(this.vy, 350);
    }
  }

  // Draw Warning Outline at Target Jump Route during the 5s Charging Phase
  drawWarningColumn(ctx) {
    ctx.save();
    const chargePct = Math.min(1.0, this.wallStateTimer / this.wallChargeDuration);
    const pulse = Math.sin(this.animTime * (8 + chargePct * 12)) * 0.2 + 0.8;
    const alpha = (0.28 + chargePct * 0.58) * pulse;

    const wallW = 32;
    const left = this.targetX - wallW / 2;
    const top = this.targetY;
    const h = this.targetH; // Localized height of ONE jump route

    // 1. Translucent glowing purple warning block
    ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.35})`;
    ctx.fillRect(left - 8, top, wallW + 16, h);

    // 2. Denser core beam
    ctx.fillStyle = `rgba(232, 121, 249, ${alpha * 0.7})`;
    ctx.fillRect(left, top, wallW, h);

    // 3. Dashed luminous warning borders
    ctx.strokeStyle = `rgba(250, 232, 255, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(left, top, wallW, h);
    ctx.setLineDash([]);

    // 4. Warning symbol & countdown timer
    const remaining = Math.max(0, this.wallChargeDuration - this.wallStateTimer).toFixed(1);
    ctx.fillStyle = '#f0abfc';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚡ WALL: ${remaining}s`, this.targetX, top - 12);

    // 5. Open Route Guidance Indicators:
    // Shows user that Route A is targeted, but the other route is completely open!
    ctx.fillStyle = 'rgba(74, 222, 128, 0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('▲ BLOCKED JUMP ▲', this.targetX, top + h / 2);
    ctx.fillText('▼ OPEN ROUTE ▼', this.targetX, top + h + 18);

    ctx.restore();
  }

  draw(ctx) {
    // 1. Draw Charging Warning at targeted jump route during 5s CHARGE phase
    if (this.wallState === 'CHARGE') {
      this.drawWarningColumn(ctx);
    }

    // 2. Draw Ethereal Tether Beam to Ghost
    if (this.tetherAlpha > 0 && this.targetGhost) {
      ctx.save();
      ctx.strokeStyle = `rgba(192, 132, 252, ${this.tetherAlpha * 0.75})`;
      ctx.lineWidth = 3.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
      ctx.lineTo(this.targetGhost.x + this.targetGhost.width / 2, this.targetGhost.y + this.targetGhost.height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(this.facing * 1.3, 1.3); // 1.3x render scale

    const baseW = 26;
    const baseH = 32;
    const halfW = 13;
    const halfH = 16;

    // Ground shadow
    if (this.grounded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, halfH + 2, halfW * 0.9, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cat Tail
    ctx.save();
    ctx.translate(-halfW + 4, halfH - 8);
    ctx.rotate(this.tailAngle);
    ctx.strokeStyle = '#6d28d9';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-10, -6, -14, -14);
    ctx.stroke();
    ctx.restore();

    // Paws
    const isRunning = Math.abs(this.vx) > 30 && this.grounded;
    const paw1 = isRunning ? Math.sin(this.animTime * 18) * 5 : 0;
    const paw2 = isRunning ? -Math.sin(this.animTime * 18) * 5 : 0;
    ctx.fillStyle = '#2e1065';
    ctx.beginPath();
    ctx.ellipse(-6 + paw2 * 0.4, halfH - 4 + Math.max(0, -paw2), 4, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(3 + paw1 * 0.4, halfH - 4 + Math.max(0, paw1), 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Mystic Violet Cat)
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-halfW, -halfH + 4, baseW, baseH - 8, 9);
    else ctx.rect(-halfW, -halfH + 4, baseW, baseH - 8);
    ctx.fill();

    // Sorcerer Cap
    ctx.fillStyle = '#6d28d9';
    ctx.beginPath();
    ctx.moveTo(-halfW + 2, -halfH + 4);
    ctx.lineTo(0, -halfH - 10);
    ctx.lineTo(halfW - 2, -halfH + 4);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(halfW - 6, -halfH + 11, 3.5, 0, Math.PI * 2);
    ctx.arc(halfW - 14, -halfH + 11, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.arc(halfW - 5, -halfH + 11, 2, 0, Math.PI * 2);
    ctx.arc(halfW - 13, -halfH + 11, 2, 0, Math.PI * 2);
    ctx.fill();

    // ----------------------------------------------------
    // CLEARLY VISIBLE MAGICAL WAND IN FRONT PAW
    // ----------------------------------------------------
    ctx.save();
    const isCharging = this.wallState === 'CHARGE';
    const wandAngle = isCharging ? -0.85 + Math.sin(this.animTime * 14) * 0.08 : 0.35;
    ctx.translate(halfW - 2, -halfH + 14);
    ctx.rotate(wandAngle);

    // Wand shaft (Polished mahogany)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, -2, 18, 4);

    // Gold ferrule band
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(14, -2.5, 3, 5);

    // Glowing Amethyst Crystal Orb on Wand Tip
    const chargePct = isCharging ? Math.min(1.0, this.wallStateTimer / this.wallChargeDuration) : 0;
    const gemGlow = isCharging ? (0.65 + 0.35 * Math.sin(this.animTime * 18)) : 0.35;
    const gemSize = isCharging ? (5 + chargePct * 3.5) : 4.8;

    // Pulsing radial aura
    const wandGlow = ctx.createRadialGradient(20, 0, 1, 20, 0, gemSize * 2.2);
    wandGlow.addColorStop(0, `rgba(245, 208, 254, ${gemGlow})`);
    wandGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = wandGlow;
    ctx.beginPath();
    ctx.arc(20, 0, gemSize * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Amethyst gem
    ctx.fillStyle = isCharging ? '#ffffff' : '#e879f9';
    ctx.beginPath();
    ctx.arc(20, 0, gemSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(19, -1, gemSize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // restore wand

    ctx.restore(); // restore bot
  }
}

// ----------------------------------------------------
// MAGICAL WALL (Blocks ONLY ONE Jump Route, Duration: 3.0s)
// Localized crystalline barrier (w = 32, h = 140..145)
// Spans only between two platform tiers, leaving alternate routes wide open!
// ----------------------------------------------------
class MagicalWall {
  constructor(x, y, h, mapWidth, duration = 3.0) {
    this.x = x;
    this.y = y;        // Top of the targeted jump route
    this.w = 32;
    this.h = h || 145; // Localized height of ONE jump route (NOT full screen!)
    this.mapWidth = mapWidth || 1700;
    this.duration = duration; // Strictly 3.0 seconds
    this.timer = 0;
    this.active = true;
    this.alpha = 0;
  }

  update(dt) {
    this.timer += dt;
    if (this.timer < 0.2) {
      this.alpha = this.timer / 0.2;
    } else if (this.timer > this.duration - 0.3) {
      this.alpha = Math.max(0, (this.duration - this.timer) / 0.3);
    } else {
      this.alpha = 1.0;
    }

    if (this.timer >= this.duration) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active || this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;

    const left = this.x - this.w / 2;
    const top = this.y;
    const pulse = Math.sin(this.timer * 9) * 0.15 + 0.85;

    // 1. Localized purple glow aura
    ctx.fillStyle = `rgba(168, 85, 247, ${0.30 * pulse})`;
    ctx.fillRect(left - 12, top - 4, this.w + 24, this.h + 8);

    // 2. Main crystalline barrier column
    const grad = ctx.createLinearGradient(left, 0, left + this.w, 0);
    grad.addColorStop(0, 'rgba(126, 34, 206, 0.88)');
    grad.addColorStop(0.2, 'rgba(168, 85, 247, 0.95)');
    grad.addColorStop(0.5, 'rgba(250, 232, 255, 0.98)');
    grad.addColorStop(0.8, 'rgba(168, 85, 247, 0.95)');
    grad.addColorStop(1, 'rgba(126, 34, 206, 0.88)');
    ctx.fillStyle = grad;
    if (ctx.roundRect) ctx.roundRect(left, top, this.w, this.h, 6);
    else ctx.fillRect(left, top, this.w, this.h);

    // 3. Luminous neon amethyst border
    ctx.strokeStyle = `rgba(240, 171, 252, ${0.95 * pulse})`;
    ctx.lineWidth = 3;
    if (ctx.roundRect) ctx.roundRect(left, top, this.w, this.h, 6);
    else ctx.strokeRect(left, top, this.w, this.h);

    // 4. Vertical core energy spine
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, top + 8);
    ctx.lineTo(this.x, top + this.h - 8);
    ctx.stroke();

    // 5. Pulsating runes
    for (let ry = top + 25; ry < top + this.h - 10; ry += 35) {
      const runeP = Math.sin(this.timer * 7 + ry * 0.05);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, ry + runeP * 3, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f0abfc';
      ctx.beginPath();
      ctx.moveTo(this.x - 6, ry + runeP * 3);
      ctx.lineTo(this.x, ry + runeP * 3 - 6);
      ctx.lineTo(this.x + 6, ry + runeP * 3);
      ctx.lineTo(this.x, ry + runeP * 3 + 6);
      ctx.closePath();
      ctx.fill();
    }

    // 6. Top and bottom barrier nodes
    ctx.fillStyle = '#f5d0fe';
    ctx.beginPath();
    ctx.arc(this.x, top + 6, 6, 0, Math.PI * 2);
    ctx.arc(this.x, top + this.h - 6, 6, 0, Math.PI * 2);
    ctx.fill();

    // 7. Alternate Route Label (Visible confirmation that other routes are open!)
    ctx.fillStyle = 'rgba(245, 208, 254, 0.85)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▼ OPEN ROUTE ▼', this.x, top + this.h + 16);

    ctx.restore();
  }
}

// Exactly 3 Bots + MagicalWall exported
window.KnifeChaser = KnifeChaser;
window.ArcherBot = ArcherBot;
window.GhostAttractorBot = GhostAttractorBot;
window.MagicalWall = MagicalWall;
