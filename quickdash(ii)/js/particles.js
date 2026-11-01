/**
 * ParticleSystem - Lightweight, High-Performance Particle Emitter & Renderer
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 300;
  }

  reset() {
    this.particles = [];
  }

  emit(config) {
    const count = config.count || 1;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift(); // Drop oldest particle
      }

      const angle = (config.angle !== undefined)
        ? config.angle + (Math.random() - 0.5) * (config.spread || 0)
        : Math.random() * Math.PI * 2;

      const speed = config.speed !== undefined
        ? config.speed + (Math.random() - 0.5) * (config.speedVariance || 0)
        : 50 + Math.random() * 100;

      this.particles.push({
        x: config.x + (Math.random() - 0.5) * (config.radius || 0),
        y: config.y + (Math.random() - 0.5) * (config.radius || 0),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: config.gravity !== undefined ? config.gravity : 200,
        drag: config.drag || 0.96,
        life: 0,
        maxLife: config.life || 0.4 + Math.random() * 0.3,
        size: config.size || 4 + Math.random() * 3,
        endSize: config.endSize !== undefined ? config.endSize : 0.5,
        color: config.color || '#ffffff',
        fadeAlpha: config.fadeAlpha !== undefined ? config.fadeAlpha : true,
        type: config.type || 'circle' // 'circle', 'spark', 'ring'
      });
    }
  }

  // Preset effects
  createJumpDust(x, y) {
    this.emit({
      x, y,
      count: 7,
      angle: -Math.PI / 2,
      spread: Math.PI * 0.8,
      speed: 80,
      speedVariance: 40,
      gravity: 300,
      life: 0.25,
      size: 4,
      endSize: 1,
      color: 'rgba(230, 240, 255, 0.7)'
    });
  }

  createDashTrail(x, y, dirX) {
    this.emit({
      x, y,
      count: 6,
      angle: dirX > 0 ? Math.PI : 0,
      spread: 0.5,
      speed: 120,
      speedVariance: 60,
      gravity: 0,
      drag: 0.9,
      life: 0.22,
      size: 6,
      endSize: 1,
      color: 'rgba(56, 189, 248, 0.8)'
    });
  }

  createHitSparks(x, y, color = '#f59e0b') {
    this.emit({
      x, y,
      count: 14,
      angle: -Math.PI / 2,
      spread: Math.PI * 2,
      speed: 220,
      speedVariance: 100,
      gravity: 450,
      life: 0.35,
      size: 4.5,
      endSize: 0.5,
      color: color,
      type: 'spark'
    });
  }

  createDeathExplosion(x, y, color = '#ef4444') {
    this.emit({
      x, y,
      count: 28,
      angle: -Math.PI / 2,
      spread: Math.PI * 2,
      speed: 280,
      speedVariance: 140,
      gravity: 350,
      life: 0.6,
      size: 7,
      endSize: 1,
      color: color,
      type: 'circle'
    });
  }

  createGhostMotes(x, y) {
    if (Math.random() > 0.4) return;
    this.emit({
      x, y,
      count: 1,
      angle: -Math.PI / 2,
      spread: 1.2,
      speed: 30,
      speedVariance: 15,
      gravity: -50, // Float upward
      life: 0.5,
      size: 3.5,
      endSize: 0.5,
      color: 'rgba(168, 85, 247, 0.6)'
    });
  }

  createArrowTrail(x, y) {
    this.emit({
      x, y,
      count: 1,
      angle: 0,
      speed: 0,
      gravity: 0,
      life: 0.15,
      size: 2.5,
      endSize: 0.5,
      color: 'rgba(251, 191, 36, 0.7)'
    });
  }

  // --- Shield Visual Effects ---
  createShieldCollectEffect(x, y) {
    // Shimmering cyan & golden sparkle burst
    this.emit({
      x, y,
      count: 18,
      angle: -Math.PI / 2,
      spread: Math.PI * 2,
      speed: 160,
      speedVariance: 80,
      gravity: 80,
      drag: 0.94,
      life: 0.55,
      size: 5,
      endSize: 0.5,
      color: '#38bdf8',
      type: 'spark'
    });
    this.emit({
      x, y,
      count: 10,
      angle: -Math.PI / 2,
      spread: Math.PI * 2,
      speed: 120,
      speedVariance: 50,
      gravity: 60,
      drag: 0.92,
      life: 0.45,
      size: 4,
      endSize: 0.5,
      color: '#fef08a',
      type: 'circle'
    });
  }

  createShieldBreakEffect(x, y) {
    // Violent crystal shatter shockwave
    this.emit({
      x, y,
      count: 22,
      angle: -Math.PI / 2,
      spread: Math.PI * 2,
      speed: 260,
      speedVariance: 120,
      gravity: 300,
      drag: 0.93,
      life: 0.45,
      size: 5.5,
      endSize: 0.5,
      color: '#7dd3fc',
      type: 'spark'
    });
    this.emit({
      x, y,
      count: 12,
      angle: -Math.PI / 2,
      spread: Math.PI * 2,
      speed: 180,
      speedVariance: 80,
      gravity: 150,
      drag: 0.9,
      life: 0.35,
      size: 6,
      endSize: 0.5,
      color: '#ffffff',
      type: 'circle'
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Continuous horizontal world wrap
      if (window.game && window.game.map) {
        const mw = window.game.map.width;
        if (p.x >= mw) p.x -= mw;
        else if (p.x < 0) p.x += mw;
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      const alpha = p.fadeAlpha ? (1 - progress) : 1;
      const currentSize = p.size + (p.endSize - p.size) * progress;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;

      if (p.type === 'spark') {
        ctx.translate(p.x, p.y);
        const rot = Math.atan2(p.vy, p.vx);
        ctx.rotate(rot);
        ctx.fillRect(-currentSize * 1.5, -currentSize * 0.5, currentSize * 3, currentSize);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, currentSize), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

window.ParticleSystem = ParticleSystem;
