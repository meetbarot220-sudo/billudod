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
    this.width = 52;
    this.height = 64;
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
    this.attackRange = 85;
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
        if (dist < 56 && Math.abs(dy) < 40 && !player.isDashing) {
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
  }

  draw(ctx) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(this.facing * 2, 2);

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
  }

  draw(ctx) {
    for (const arrow of this.arrows) {
      arrow.draw(ctx);
    }

    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(this.facing * 2, 2);

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
// BOT 3 — GHOST ATTRACTOR (Mystic Violet Cat)
// ----------------------------------------------------
class GhostAttractorBot extends BaseBot {
  constructor(x, y) {
    super(x, y, 'Ghost Attractor');
    this.speed = 225;
    this.state = 'PATROL';
    this.attractInterval = 2.3;
    this.attractTimer = 1.0;
    this.tetherAlpha = 0;
    this.targetGhost = null;
    this.currentWaypointIndex = 0;
  }

  update(dt, player, map, ghosts, game) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.animTime += dt;
    this.stateTimer += dt;
    if (this.jumpCooldown > 0) this.jumpCooldown -= dt;

    if (this.tetherAlpha > 0) {
      this.tetherAlpha -= dt * 2;
    }

    this.tailAngle = Math.sin(this.animTime * 9) * 0.35;

    let dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    if (dx > map.width / 2) dx -= map.width;
    if (dx < -map.width / 2) dx += map.width;
    this.facing = dx >= 0 ? 1 : -1;

    // Waypoint patrol
    const wp = map.waypoints[this.currentWaypointIndex];
    if (wp) {
      let wpDistX = wp.x - this.x;
      if (wpDistX > map.width / 2) wpDistX -= map.width;
      if (wpDistX < -map.width / 2) wpDistX += map.width;
      if (Math.abs(wpDistX) > 20) {
        this.vx = (wpDistX > 0 ? 1 : -1) * this.speed;
      } else {
        this.vx *= 0.7;
        if (Math.random() < 0.02) {
          this.currentWaypointIndex = Math.floor(Math.random() * map.waypoints.length);
        }
      }

      if (this.grounded && this.jumpCooldown <= 0 && wp.y < this.y - 36) {
        this.vy = -600;
        this.grounded = false;
        this.jumpCooldown = 1.2;
      }
    }

    // Ghost Attraction cycle:
    // If no ghost exists, summons one into the garden!
    // If a ghost exists, redirects and empowers it toward the player!
    this.attractTimer -= dt;
    if (this.attractTimer <= 0) {
      this.attractTimer = this.attractInterval;

      if (ghosts.length === 0 && game) {
        // Summon a ghost into the garden near the attractor
        game.spawnGhost(this.x + (this.facing > 0 ? 60 : -60), this.y - 40);
        this.tetherAlpha = 1.0;
        if (window.soundManager) soundManager.playGhostAttract();
      } else if (ghosts.length > 0) {
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
  }

  draw(ctx) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(this.facing * 2, 2);

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

    // Body (Mystic Violet)
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

    // Floating Crystal Orb
    const orbFloat = Math.sin(this.animTime * 5) * 4;
    ctx.save();
    ctx.translate(12, -halfH + 12 + orbFloat);

    const orbGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 6);
    orbGrad.addColorStop(0, '#f5d0fe');
    orbGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(232, 121, 249, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 8 + Math.sin(this.animTime * 8) * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }
}

window.KnifeChaser = KnifeChaser;
window.ArcherBot = ArcherBot;
window.GhostAttractorBot = GhostAttractorBot;
