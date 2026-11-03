/**
 * Player - Agile Garden Cat Runner matching Multiplayer Quick Tag character style & scale
 * Features: Run, Jump, Double-Jump, Dash, Platform Drop, Attack Scratch, Ears & Tail physics
 */
class Player {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.width = 34; // 1.3x character size (scaled from 26)
    this.height = 42; // 1.3x character size (scaled from 32)

    // Movement physics
    this.vx = 0;
    this.vy = 0;
    this.maxSpeed = 340;
    this.accel = 2200;
    this.friction = 1800;
    this.gravity = 1400;

    // Jump state (Reliable states: GROUND -> JUMP 1 -> AIR -> JUMP 2 -> AIR -> LAND)
    this.jumpPower = -660;
    this.doubleJumpPower = -630;
    this.grounded = false;
    this.jumpsLeft = 2; // Jump 1 + Double Jump
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isDroppingDown = false;
    this.dropDownTimer = 0;

    // Dash state (Defensive Escape Ability: Invulnerable during dash)
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 0.20;
    this.dashSpeed = 820;
    this.dashCooldown = 0.85;
    this.dashCooldownTimer = 0;
    this.dashDirection = 1;
    this.wrappedThisFrame = false;
    this.hasFallenOffMap = false;

    // Shield state (Protects from exactly ONE damaging hit)
    this.hasShield = false;

    // Attack state (Cosmetic visual only - does NOT damage bots)
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.18;
    this.attackCooldown = 0.38;
    this.attackCooldownTimer = 0;
    this.attackHitbox = null;

    // Survival Score (10,000 Score survival system - score is the only survival metric)
    this.maxScore = 10000;
    this.score = 10000;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 1.2;
    this.isDead = false;

    // Visuals & Animation
    this.facing = 1; // 1 = right, -1 = left
    this.animTime = 0;
    this.flipAngle = 0;
    this.squashX = 1;
    this.squashY = 1;
    this.afterImages = [];
    this.footstepTimer = 0;
    this.blinkTimer = 2.0;
    this.isBlinking = false;
    this.tailAngle = 0;
  }

  reset(x, y) {
    this.x = x !== undefined ? x : this.startX;
    this.y = y !== undefined ? y : this.startY;
    this.prevX = this.x;
    this.prevY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.maxScore = 10000;
    this.score = 10000;
    this.isDead = false;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.isDashing = false;
    this.dashCooldownTimer = 0;
    this.isAttacking = false;
    this.attackCooldownTimer = 0;
    this.grounded = false;
    this.jumpsLeft = 2;
    this.flipAngle = 0;
    this.afterImages = [];
    this.wrappedThisFrame = false;
    this.hasShield = false;
    this.hasFallenOffMap = false;
  }

  takeDamage(amount = 1000, fromSourceX = null, isGhostContact = false) {
    // IMMUNITY DURING DASH: Player cannot be damaged or lose score/life while dashing!
    if (this.isInvulnerable || this.isDead || this.isDashing) return false;

    // SHIELD PROTECTION: Absorbs exactly ONE damaging hit (Bot hit, Arrow, or Ghost contact)
    if (this.hasShield) {
      this.hasShield = false;
      this.isInvulnerable = true;
      this.invulnerableTimer = 0.50; // Safe grace window to avoid multi-hit on exact frame
      if (window.soundManager) soundManager.playShieldBreak();
      if (window.particleSystem) {
        particleSystem.createShieldBreakEffect(this.x + this.width / 2, this.y + this.height / 2);
      }

      // Gentle knockback away from hazard
      this.vy = -220;
      if (fromSourceX !== null) {
        let kdx = fromSourceX - (this.x + this.width / 2);
        const mw = (window.game && window.game.map && window.game.map.width) || 1700;
        if (kdx > mw / 2) kdx -= mw;
        if (kdx < -mw / 2) kdx += mw;
        this.vx = (kdx > 0 ? -1 : 1) * 240;
      } else {
        this.vx = -this.facing * 220;
      }
      return false; // Absorbed! 0 SCORE lost.
    }

    // Deduct damage from score for EVERY damaging event (never bypassed)
    const damageAmount = isGhostContact ? 1000 : (amount || 1000);
    this.score = Math.max(0, this.score - damageAmount);

    if (isGhostContact) {
      // Ghost Contact: 1,000 score damage
      this.isInvulnerable = true;
      this.invulnerableTimer = 1.6; // Safe cooldown to prevent multi-hits
    } else {
      // Normal Bot Attack (Knife / Arrow): reduces SCORE
      this.isInvulnerable = true;
      this.invulnerableTimer = 0.9; // i-frame cooldown
    }

    // Sync score with Game and HUD
    if (window.game) {
      window.game.score = this.score;
      if (window.game.updateHUD) window.game.updateHUD();
    }

    // Check if score depleted -> immediate death (score is the sole survival metric)
    if (this.score <= 0) {
      this.score = 0;
      this.isDead = true;
      if (window.soundManager) soundManager.playPlayerDeath();
      if (window.particleSystem) {
        particleSystem.createDeathExplosion(this.x + this.width / 2, this.y + this.height / 2, '#38bdf8');
      }
      if (window.game) window.game.triggerGameOver();
    } else {
      if (window.soundManager) soundManager.playDamage();
      if (window.particleSystem) {
        particleSystem.createHitSparks(this.x + this.width / 2, this.y + this.height / 2, '#ef4444');
      }
    }

    // Knockback
    this.vy = -320;
    if (fromSourceX !== null) {
      let kdx = fromSourceX - (this.x + this.width / 2);
      const mw = (window.game && window.game.map && window.game.map.width) || 1700;
      if (kdx > mw / 2) kdx -= mw;
      if (kdx < -mw / 2) kdx += mw;
      this.vx = (kdx > 0 ? -1 : 1) * 300;
    } else {
      this.vx = -this.facing * 260;
    }

    return true;
  }

  triggerAttack() {
    if (this.attackCooldownTimer > 0 || this.isDashing || this.isDead) return;

    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.attackCooldownTimer = this.attackCooldown;

    if (window.soundManager) soundManager.playAttack();

    this.attackHitbox = {
      x: this.facing > 0 ? this.x + this.width - 6 : this.x - 42,
      y: this.y - 6,
      w: 80,
      h: this.height + 16
    };

    if (window.particleSystem) {
      particleSystem.emit({
        x: this.facing > 0 ? this.x + this.width + 10 : this.x - 10,
        y: this.y + this.height / 2,
        count: 5,
        speed: 120,
        color: '#67e8f9',
        type: 'spark'
      });
    }
  }

  update(dt, arg1, arg2) {
    let input = arg1;
    let map = arg2;
    if (arg1 && arg1.platforms) {
      map = arg1;
      input = arg2;
    }
    if (!input) input = { left: false, right: false, up: false, down: false, jump: false, jumpJustPressed: false, dash: false, dashJustPressed: false, attack: false, attackJustPressed: false };
    if (!map) map = (window.game && window.game.map) ? window.game.map : { width: 1700, height: 850, resolveEntity: () => false };
    const acts = (input && input.actions) ? input.actions : input;
    this.prevX = this.x;
    this.prevY = this.y;

    if (this.isDead) {
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;
      this.flipAngle += dt * 8;
      return;
    }

    this.animTime += dt;

    // Tail waving inertia
    this.tailAngle = Math.sin(this.animTime * 10) * 0.35 + (this.vx / this.maxSpeed) * 0.4;

    // Blink timer
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = !this.isBlinking;
      this.blinkTimer = this.isBlinking ? 0.12 : (2 + Math.random() * 3);
    }

    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= dt;

    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    if (this.isDroppingDown) {
      this.dropDownTimer -= dt;
      if (this.dropDownTimer <= 0) this.isDroppingDown = false;
    }

    // 1. Dash
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.vx = this.dashDirection * this.dashSpeed;
      this.vy = 0;

      if (Math.random() < 0.65) {
        this.afterImages.push({
          x: this.x,
          y: this.y,
          facing: this.facing,
          alpha: 0.6,
          color: '#38bdf8'
        });
      }

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx *= 0.4;
      }
    } else {
      // Dash Trigger
      if (acts.dashJustPressed && this.dashCooldownTimer <= 0) {
        let dir = this.facing;
        if (acts.left) dir = -1;
        if (acts.right) dir = 1;

        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldownTimer = this.dashCooldown;
        this.dashDirection = dir;
        this.facing = dir;
        this.squashX = 1.35;
        this.squashY = 0.72;

        if (window.soundManager) soundManager.playDash();
        if (window.particleSystem) {
          particleSystem.createDashTrail(this.x + this.width / 2, this.y + this.height / 2, dir);
        }
      }

      // Attack Trigger
      if (acts.attackJustPressed) {
        this.triggerAttack();
      }

      // Horizontal Run
      let moveDir = 0;
      if (acts.left) moveDir -= 1;
      if (acts.right) moveDir += 1;

      if (moveDir !== 0) {
        this.facing = moveDir;
        this.vx += moveDir * this.accel * dt;
        if (Math.abs(this.vx) > this.maxSpeed) {
          this.vx = moveDir * this.maxSpeed;
        }

        if (this.grounded) {
          this.footstepTimer += dt;
          if (this.footstepTimer > 0.18) {
            this.footstepTimer = 0;
            if (window.soundManager) soundManager.playFootstep();
          }
        }
      } else {
        if (this.vx > 0) {
          this.vx = Math.max(0, this.vx - this.friction * dt);
        } else if (this.vx < 0) {
          this.vx = Math.min(0, this.vx + this.friction * dt);
        }
      }

      // Jump & Double Jump state machine
      if (this.grounded) {
        this.coyoteTimer = 0.15;
        this.jumpsLeft = 2; // Jump 1 + Double Jump available immediately upon grounding
        this.flipAngle = 0;
      } else {
        this.coyoteTimer -= dt;
      }

      if (acts.jumpJustPressed) {
        this.jumpBufferTimer = 0.12;
      } else {
        this.jumpBufferTimer -= dt;
      }

      if (acts.down && acts.jumpJustPressed && this.grounded) {
        this.isDroppingDown = true;
        this.dropDownTimer = 0.22;
        this.y += 4;
        this.grounded = false;
        this.jumpsLeft = 1;
        this.jumpBufferTimer = 0;
      } else if (this.jumpBufferTimer > 0 && (this.grounded || this.coyoteTimer > 0)) {
        // First Jump (Jump 1)
        this.vy = this.jumpPower;
        this.grounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.jumpsLeft = 1;
        this.squashX = 0.78;
        this.squashY = 1.32;

        if (window.soundManager) soundManager.playJump();
        if (window.particleSystem) {
          particleSystem.createJumpDust(this.x + this.width / 2, this.y + this.height);
        }
      } else if (acts.jumpJustPressed && !this.grounded && this.jumpsLeft > 0) {
        // Double Jump (Jump 2)
        this.vy = this.doubleJumpPower;
        this.jumpsLeft = 0;
        this.jumpBufferTimer = 0;
        this.flipAngle = 0.05;

        if (window.soundManager) soundManager.playDoubleJump();
        if (window.particleSystem) {
          particleSystem.emit({
            x: this.x + this.width / 2,
            y: this.y + this.height,
            count: 6,
            angle: -Math.PI / 2,
            spread: 1.4,
            speed: 120,
            color: '#67e8f9',
            type: 'spark'
          });
        }
      }

      // Variable jump height cutoff
      if (!acts.jump && this.vy < -260) {
        this.vy = -260;
      }

      if (acts.down && !this.grounded) {
        this.vy += 800 * dt;
      }

      this.vy += this.gravity * dt;
      if (this.vy > 900) this.vy = 900;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const wasGrounded = this.grounded;
    map.resolveEntity(this, dt);

    // Seamless continuous horizontal world wraparound
    if (this.x >= map.width) {
      this.x -= map.width;
      this.prevX -= map.width;
      for (const img of this.afterImages) img.x -= map.width;
    } else if (this.x < 0) {
      this.x += map.width;
      this.prevX += map.width;
      for (const img of this.afterImages) img.x += map.width;
    }

    if (this.y < 42) { this.y = 42; this.vy = 0; }

    // Falling completely below the bottom boundary of the playable map -> immediate GAME OVER
    if (this.y >= map.height) {
      this.isDead = true;
      this.vx = 0;
      this.grounded = false;

      if (window.soundManager) soundManager.playPlayerDeath();
      if (window.particleSystem) {
        particleSystem.createDeathExplosion(this.x + this.width / 2, this.y, '#38bdf8');
      }

      if (window.game) {
        window.game.triggerGameOver('Fell out of the playable map!');
      }
      return;
    }

    if (!wasGrounded && this.grounded) {
      this.jumpsLeft = 2; // Jump 1 + Double Jump restored upon landing
      this.coyoteTimer = 0.15;
      this.squashX = 1.25;
      this.squashY = 0.8;
      if (window.particleSystem) {
        particleSystem.createJumpDust(this.x + this.width / 2, this.y + this.height);
      }
    }

    this.squashX += (1 - this.squashX) * 0.2;
    this.squashY += (1 - this.squashY) * 0.2;

    if (this.flipAngle > 0) {
      this.flipAngle += dt * 18;
      if (this.flipAngle >= Math.PI * 2) {
        this.flipAngle = 0;
      }
    }

    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.attackHitbox = null;
      } else {
        this.attackHitbox = {
          x: this.facing > 0 ? this.x + this.width - 2 : this.x - 24,
          y: this.y - 2,
          w: 32,
          h: this.height + 4
        };
      }
    }

    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      this.afterImages[i].alpha -= dt * 3.5;
      if (this.afterImages[i].alpha <= 0) {
        this.afterImages.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Dash ghost after-images
    for (const ghost of this.afterImages) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ghost.alpha);
      ctx.fillStyle = ghost.color;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(ghost.x, ghost.y, this.width, this.height, 8);
      else ctx.rect(ghost.x, ghost.y, this.width, this.height);
      ctx.fill();
      ctx.restore();
    }

    // Invulnerability flicker
    if (this.isInvulnerable && Math.floor(this.invulnerableTimer * 20) % 2 === 0) {
      return;
    }

    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.translate(centerX, centerY);
    if (this.flipAngle > 0) {
      ctx.rotate(this.facing > 0 ? this.flipAngle : -this.flipAngle);
    }
    ctx.scale(this.facing * this.squashX * 1.3, this.squashY * 1.3); // 1.3x render scale

    const baseW = 26;
    const baseH = 32;
    const halfW = 13;
    const halfH = 16;

    // Soft ground shadow
    if (this.grounded) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, halfH + 2, halfW * 0.9, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fluffy Cat Tail behind
    ctx.save();
    ctx.translate(-halfW + 4, halfH - 8);
    ctx.rotate(this.tailAngle);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-10, -6, -14, -14);
    ctx.stroke();
    // White tail tip
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-11, -11);
    ctx.lineTo(-14, -14);
    ctx.stroke();
    ctx.restore();

    // Cat Paws / Running cycle
    const isRunning = Math.abs(this.vx) > 30 && this.grounded;
    const paw1 = isRunning ? Math.sin(this.animTime * 18) * 5 : 0;
    const paw2 = isRunning ? -Math.sin(this.animTime * 18) * 5 : 0;

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(-6 + paw2 * 0.4, halfH - 4 + Math.max(0, -paw2), 4, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(3 + paw1 * 0.4, halfH - 4 + Math.max(0, paw1), 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute Cat Body (Sky Blue with gradient)
    const bodyGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    bodyGrad.addColorStop(0, '#38bdf8');
    bodyGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-halfW, -halfH + 4, baseW, baseH - 8, 9);
    else ctx.rect(-halfW, -halfH + 4, baseW, baseH - 8);
    ctx.fill();

    // White Chest & Belly Fur
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(1, 2, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cat Ears on top
    // Back Ear
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(-halfW + 4, -halfH + 5);
    ctx.lineTo(-halfW + 8, -halfH - 7);
    ctx.lineTo(-halfW + 13, -halfH + 4);
    ctx.closePath();
    ctx.fill();
    // Front Ear
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(halfW - 13, -halfH + 4);
    ctx.lineTo(halfW - 8, -halfH - 7);
    ctx.lineTo(halfW - 3, -halfH + 5);
    ctx.closePath();
    ctx.fill();
    // Pink inner ear
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(halfW - 11, -halfH + 3);
    ctx.lineTo(halfW - 8, -halfH - 4);
    ctx.lineTo(halfW - 5, -halfH + 4);
    ctx.closePath();
    ctx.fill();

    // Expressive Eyes
    const eyeLookY = this.vy < -80 ? -2 : (this.vy > 80 ? 2 : 0);
    const eyeLookX = 2;

    // Eye whites
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(halfW - 8 + eyeLookX, -halfH + 11 + eyeLookY, 4, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(halfW - 16 + eyeLookX, -halfH + 11 + eyeLookY, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!this.isBlinking) {
      // Pupils
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(halfW - 7 + eyeLookX, -halfH + 11 + eyeLookY, 2.5, 0, Math.PI * 2);
      ctx.arc(halfW - 15 + eyeLookX, -halfH + 11 + eyeLookY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Eye glints
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(halfW - 6 + eyeLookX, -halfH + 10 + eyeLookY, 1, 0, Math.PI * 2);
      ctx.arc(halfW - 14 + eyeLookX, -halfH + 10 + eyeLookY, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(halfW - 12 + eyeLookX, -halfH + 11 + eyeLookY);
      ctx.lineTo(halfW - 4 + eyeLookX, -halfH + 11 + eyeLookY);
      ctx.moveTo(halfW - 20 + eyeLookX, -halfH + 11 + eyeLookY);
      ctx.lineTo(halfW - 12 + eyeLookX, -halfH + 11 + eyeLookY);
      ctx.stroke();
    }

    // Cute pink nose
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(halfW - 3, -halfH + 14);
    ctx.lineTo(halfW, -halfH + 16);
    ctx.lineTo(halfW - 6, -halfH + 16);
    ctx.closePath();
    ctx.fill();

    // Cute whiskers
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(halfW - 2, -halfH + 15);
    ctx.lineTo(halfW + 6, -halfH + 13);
    ctx.moveTo(halfW - 2, -halfH + 16);
    ctx.lineTo(halfW + 6, -halfH + 18);
    ctx.stroke();

    // Attack Slash Arc FX
    if (this.isAttacking) {
      const slashProgress = 1 - (this.attackTimer / this.attackDuration);
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#67e8f9';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const startAngle = -0.8 + slashProgress * 0.4;
      const endAngle = 0.8 + slashProgress * 0.4;
      ctx.arc(12, 0, 32, startAngle, endAngle);
      ctx.stroke();
      ctx.restore();
    }

    // Active Protective Shield Bubble (Clean, Translucent, Does not obstruct)
    if (this.hasShield) {
      ctx.save();
      const shieldPulse = Math.sin(this.animTime * 6.5) * 2;
      const shieldRad = Math.max(halfW, halfH) + 6 + shieldPulse;

      // Soft translucent energy gradient
      const bubbleGrad = ctx.createRadialGradient(0, 0, shieldRad * 0.4, 0, 0, shieldRad);
      bubbleGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      bubbleGrad.addColorStop(0.7, 'rgba(14, 165, 233, 0.22)');
      bubbleGrad.addColorStop(1, 'rgba(56, 189, 248, 0.6)');
      ctx.fillStyle = bubbleGrad;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRad, 0, Math.PI * 2);
      ctx.fill();

      // Outer shimmering dashed border
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -this.animTime * 22;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRad, 0, Math.PI * 2);
      ctx.stroke();

      // Shimmering Golden Orbital Energy Sparks
      const orbAngle = this.animTime * 4.0;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(Math.cos(orbAngle) * (shieldRad + 1), Math.sin(orbAngle) * (shieldRad + 1), 2.5, 0, Math.PI * 2);
      ctx.arc(Math.cos(orbAngle + Math.PI) * (shieldRad + 1), Math.sin(orbAngle + Math.PI) * (shieldRad + 1), 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();

    // Dash Cooldown Pip Indicator under player feet
    if (this.dashCooldownTimer > 0) {
      ctx.save();
      const cdRatio = 1 - (this.dashCooldownTimer / this.dashCooldown);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(this.x + 4, this.y + this.height + 6, this.width - 8, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(this.x + 2, this.y + this.height + 6, (this.width - 4) * cdRatio, 3);
      ctx.restore();
    }
  }
}

window.Player = Player;
