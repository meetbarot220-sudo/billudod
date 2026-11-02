/**
 * ShieldPickup - Collectible Shield Item
 * Protects player from exactly ONE damaging attack (Bot hit, Arrow, or Ghost contact).
 * Does not stack. Disappears upon taking 1 hit.
 */
class ShieldPickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.active = true;
    this.timer = Math.random() * 6;
    this.hoverOffset = 0;
    this.pulse = 0;
    this.life = 35.0; // Despawns after 35s if not collected
  }

  update(dt, player, map) {
    if (!this.active) return;
    this.timer += dt;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    // Smooth hover bobbing and breathing pulse
    this.hoverOffset = Math.sin(this.timer * 3.6) * 6;
    this.pulse = Math.sin(this.timer * 4.8) * 0.5 + 0.5;

    // Check collision with player across toroidal wrap
    const mapW = (map && map.width) || 1700;
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    let dx = this.x - playerCenterX;
    if (dx > mapW / 2) dx -= mapW;
    if (dx < -mapW / 2) dx += mapW;
    const dy = (this.y + this.hoverOffset) - playerCenterY;
    const dist = Math.hypot(dx, dy);

    // Player collects shield (cannot stack if player already has shield)
    if (dist < (this.radius + 16) && !player.isDead && !player.hasShield) {
      this.active = false;
      player.hasShield = true;
      if (window.soundManager) soundManager.playShieldCollect();
      if (window.particleSystem) {
        particleSystem.createShieldCollectEffect(this.x, this.y + this.hoverOffset);
      }
    }
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    const curY = this.y + this.hoverOffset;
    ctx.translate(this.x, curY);

    // 1. Soft glowing energy aura
    const glowRad = this.radius + 8 + this.pulse * 5;
    const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, glowRad);
    auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
    auraGrad.addColorStop(0.55, 'rgba(14, 165, 233, 0.22)');
    auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, glowRad, 0, Math.PI * 2);
    ctx.fill();

    // 2. Protective Crystal Orb Body
    const orbGrad = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
    orbGrad.addColorStop(0, '#f0f9ff');
    orbGrad.addColorStop(0.4, '#38bdf8');
    orbGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle glass reflection rim
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 1, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Golden Shield Emblem
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(8, -6);
    ctx.lineTo(6, 3);
    ctx.lineTo(0, 9);
    ctx.lineTo(-6, 3);
    ctx.lineTo(-8, -6);
    ctx.closePath();
    ctx.fill();

    // Inner shield highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-2.5, -2.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Orbiting Energy Sparks
    const sparkAngle = this.timer * 4.2;
    const sparkDist = this.radius + 4;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(Math.cos(sparkAngle) * sparkDist, Math.sin(sparkAngle) * sparkDist, 2.4, 0, Math.PI * 2);
    ctx.arc(Math.cos(sparkAngle + Math.PI) * sparkDist, Math.sin(sparkAngle + Math.PI) * sparkDist, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.ShieldPickup = ShieldPickup;
