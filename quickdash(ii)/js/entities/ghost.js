/**
 * Ghost - Lethal Spectral Hazard
 * Summoned and redirected by Bot 3 (Ghost Attractor).
 * 1-Hit damage, smooth floating spectral physics, warning danger aura.
 * Strictly bounded by the world arena boundaries (ZERO wrapping, ZERO phasing).
 */
class Ghost {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 60;
    this.vy = (Math.random() - 0.5) * 60;
    this.radius = 16;
    this.width = 32;
    this.height = 36;

    this.baseSpeed = 210;
    this.chaseSpeed = 285;
    this.attractedSpeed = 330;
    this.currentSpeed = this.baseSpeed;

    this.timer = Math.random() * 10;
    this.isAttracted = false;
    this.attractTimer = 0;
    this.attractorSource = null;
    this.warnSoundTimer = 0;
    this.active = true;
  }

  attractTowards(target, attractor) {
    this.isAttracted = true;
    this.attractTimer = 3.0; // Energized for 3 seconds
    this.attractorSource = attractor;
  }

  update(dt, player, map) {
    if (!this.active) return;

    this.timer += dt;
    this.warnSoundTimer -= dt;

    if (this.attractTimer > 0) {
      this.attractTimer -= dt;
      if (this.attractTimer <= 0) {
        this.isAttracted = false;
        this.attractorSource = null;
      }
    }

    this.mapWidth = map.width;
    let dx = (player.x + player.width / 2) - (this.x + this.radius);
    if (dx > map.width / 2) dx -= map.width;
    if (dx < -map.width / 2) dx += map.width;
    const dy = (player.y + player.height / 2) - (this.y + this.radius);
    const dist = Math.hypot(dx, dy);

    // Audio warning when ghost approaches player (< 220px)
    if (dist < 220 && this.warnSoundTimer <= 0) {
      this.warnSoundTimer = 1.2;
      if (window.soundManager) soundManager.playGhostSound();
    }

    if (this.isAttracted || dist < 300) {
      // Homing steering towards player with relentless pressure
      this.currentSpeed = this.isAttracted ? this.attractedSpeed : this.chaseSpeed;
      if (dist > 1) {
        const steerX = (dx / dist) * this.currentSpeed;
        const steerY = (dy / dist) * this.currentSpeed;
        this.vx += (steerX - this.vx) * 0.11;
        this.vy += (steerY - this.vy) * 0.11;
      }
    } else {
      // Gentle floating patrol with sinusoidal wave
      this.currentSpeed = this.baseSpeed * 0.65;
      const wanderAngle = Math.sin(this.timer * 1.4) * Math.PI;
      this.vx += (Math.cos(wanderAngle) * this.currentSpeed - this.vx) * 0.03;
      this.vy += (Math.sin(this.timer * 2.0) * 35 - this.vy) * 0.04;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Seamless continuous horizontal wraparound
    if (this.x >= map.width) this.x -= map.width;
    else if (this.x < 0) this.x += map.width;
    if (this.y > map.height) this.y = 45;
    if (this.y < 35) this.y = 35;

    // Vertical boundary clamping (Ceiling & Ground)
    const minY = 42 + this.radius;
    const maxY = 760 - this.radius;

    if (this.y < minY) {
      this.y = minY;
      this.vy = Math.abs(this.vy) * 0.7;
    } else if (this.y > maxY) {
      this.y = maxY;
      this.vy = -Math.abs(this.vy) * 0.7;
    }

    // Particle motes
    if (window.particleSystem) {
      particleSystem.createGhostMotes(this.x + this.radius, this.y + this.height);
    }

    // Check hit player
    this.checkHitPlayer(player, map);
  }

  checkHitPlayer(player, map) {
    // IMMUNITY: Player cannot be hit or lose lives during dash!
    if (player.isDead || player.isInvulnerable || player.isDashing) return;

    const mapW = (map && map.width) || this.mapWidth || 1700;
    let centerDx = (this.x + this.radius) - (player.x + player.width / 2);
    if (centerDx > mapW / 2) centerDx -= mapW;
    if (centerDx < -mapW / 2) centerDx += mapW;
    const ghostVirtualX = (player.x + player.width / 2) + centerDx;

    const closestX = Math.max(player.x, Math.min(ghostVirtualX, player.x + player.width));
    const closestY = Math.max(player.y, Math.min(this.y + this.radius, player.y + player.height));

    const distX = ghostVirtualX - closestX;
    const distY = (this.y + this.radius) - closestY;
    const distanceSq = (distX * distX) + (distY * distY);

    if (distanceSq < (this.radius * this.radius)) {
      // Lethal ghost contact: immediately removes 1 life (bypasses HP)
      player.takeDamage(0, this.x, true);

      // Deflect backward
      this.vx = -distX * 8;
      this.vy = -distY * 8;

      if (window.soundManager) soundManager.playGhostSound();
    }
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    const centerX = this.x + this.radius;
    const centerY = this.y + this.radius;

    // Pulsing danger warning aura
    const auraRadius = this.radius * (this.isAttracted ? 2.2 : 1.6);
    const auraGrad = ctx.createRadialGradient(
      centerX, centerY, this.radius * 0.3,
      centerX, centerY, auraRadius
    );

    if (this.isAttracted) {
      auraGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      auraGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    } else {
      auraGrad.addColorStop(0, 'rgba(192, 132, 252, 0.35)');
      auraGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
    }

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // Floating Ghost Body (Normal cute translucent spectral sheet)
    const bodyGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    if (this.isAttracted) {
      bodyGrad.addColorStop(0, 'rgba(254, 226, 226, 0.95)');
      bodyGrad.addColorStop(1, 'rgba(248, 113, 113, 0.7)');
    } else {
      bodyGrad.addColorStop(0, 'rgba(248, 250, 252, 0.94)');
      bodyGrad.addColorStop(1, 'rgba(224, 231, 255, 0.72)');
    }

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 2, this.radius, Math.PI, 0);

    // Wavy ghost skirt bottom
    const w1 = Math.sin(this.timer * 9) * 4;
    const w2 = Math.cos(this.timer * 9) * 4;
    const w3 = Math.sin(this.timer * 9 + 2) * 4;

    ctx.lineTo(this.x + this.width, this.y + this.height - 6 + w1);
    ctx.quadraticCurveTo(this.x + this.width * 0.75, this.y + this.height + w2, this.x + this.width * 0.5, this.y + this.height - 6);
    ctx.quadraticCurveTo(this.x + this.width * 0.25, this.y + this.height + w3, this.x, this.y + this.height - 6 + w1);
    ctx.closePath();
    ctx.fill();

    // Dark Spooky Eyes
    ctx.fillStyle = this.isAttracted ? '#dc2626' : '#1e1b4b';
    const eyeOffsetX = (this.vx > 0 ? 3 : -3);
    ctx.beginPath();
    ctx.arc(centerX - 5 + eyeOffsetX, centerY - 4, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 5 + eyeOffsetX, centerY - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX - 4 + eyeOffsetX, centerY - 5, 1, 0, Math.PI * 2);
    ctx.arc(centerX + 6 + eyeOffsetX, centerY - 5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Warning marker if attracted
    if (this.isAttracted) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', centerX, this.y - 4);
    }

    ctx.restore();
  }
}

window.Ghost = Ghost;