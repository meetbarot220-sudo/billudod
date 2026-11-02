/**
 * Arrow - Projectile fired by Archer Bot
 */
class Arrow {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 16;
    this.height = 6;
    this.gravity = 260; // Gentle ballistic arc
    this.active = true;
    this.life = 4.0;
    this.stuck = false;
    this.angle = Math.atan2(vy, vx);
  }

  update(dt, map) {
    if (this.stuck) {
      this.life -= dt;
      if (this.life <= 0) this.active = false;
      return;
    }

    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    this.mapWidth = map.width;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Seamless continuous horizontal wraparound
    if (this.x >= map.width) this.x -= map.width;
    else if (this.x < 0) this.x += map.width;

    this.angle = Math.atan2(this.vy, this.vx);

    // Particle trail
    if (window.particleSystem && Math.random() < 0.45) {
      particleSystem.createArrowTrail(this.x, this.y);
    }

    // Check collision against map solid platforms
    for (const p of map.platforms) {
      if (
        p.type === 'solid' &&
        this.x >= p.x && this.x <= p.x + p.w &&
        this.y >= p.y && this.y <= p.y + p.h
      ) {
        this.stuck = true;
        this.life = 0.8; // Stick into surface briefly then fade
        if (window.soundManager) soundManager.playArrowHit();
        if (window.particleSystem) {
          particleSystem.emit({
            x: this.x,
            y: this.y,
            count: 4,
            speed: 50,
            color: '#f59e0b',
            life: 0.2
          });
        }
        break;
      }
    }
  }

  checkHitPlayer(player, map) {
    if (this.stuck || !this.active || player.isDead || player.isInvulnerable || player.isDashing) return false;

    const mapW = (map && map.width) || this.mapWidth || 1700;
    let arrowDx = this.x - (player.x + player.width / 2);
    if (arrowDx > mapW / 2) arrowDx -= mapW;
    if (arrowDx < -mapW / 2) arrowDx += mapW;
    const virtualArrowX = (player.x + player.width / 2) + arrowDx;

    // AABB overlap
    if (
      virtualArrowX >= player.x &&
      virtualArrowX <= player.x + player.width &&
      this.y >= player.y &&
      this.y <= player.y + player.height
    ) {
      this.active = false;
      player.takeDamage(800, this.x, false);
      if (window.soundManager) soundManager.playArrowHit();
      return true;
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(1, 1);

    if (this.stuck) {
      ctx.globalAlpha = Math.max(0, this.life / 0.8);
    }

    // Arrow shaft
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();

    // Arrow arrowhead
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(8, -3);
    ctx.lineTo(14, 0);
    ctx.lineTo(8, 3);
    ctx.closePath();
    ctx.fill();

    // Arrow fletching feathers
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-14, -3);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-14, 3);
    ctx.closePath();
    ctx.fill();

    // Subtle glow
    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.beginPath();
    ctx.arc(10, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.Arrow = Arrow;
