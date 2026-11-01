/**
 * Camera - Wide Readable 2D Follow Camera with Seamless Horizontal Wraparound
 * Engineered for 16-bit Pixel-Art presentation:
 * - Frames the entire arena height with crisp pixel readability
 * - Smooth exponential follow on player's center
 * - No camera shake (rock-solid readable action)
 * - Seamless modular horizontal looping across map width
 */
class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 850;
    this.y = 440;
    this.targetX = 850;
    this.targetY = 440;

    this.lerpSpeed = 0.09;
    this.baseWidth = 1600;
    this.baseHeight = 900;
    this.zoom = 1.0;

    this.worldBounds = {
      minX: 0,
      minY: 0,
      maxX: 1700,
      maxY: 850
    };

    this.viewportWidth = 1200;
    this.viewportHeight = 675;

    this.shakeDuration = 0;
    this.shakeIntensity = 0;
  }

  setWorldBounds(minX, minY, maxX, maxY) {
    this.worldBounds.minX = minX;
    this.worldBounds.minY = minY;
    this.worldBounds.maxX = maxX;
    this.worldBounds.maxY = maxY;
  }

  resize(cssWidth, cssHeight) {
    this.viewportWidth = cssWidth || window.innerWidth;
    this.viewportHeight = cssHeight || window.innerHeight;

    // Wide, clear arena framing: entire vertical arena height is visible comfortably
    const targetH = 880;
    const targetW = 1600;

    const scaleX = this.viewportWidth / targetW;
    const scaleY = this.viewportHeight / targetH;

    let computedZoom = Math.min(scaleX, scaleY);

    if (this.viewportWidth < this.viewportHeight) {
      // Mobile portrait mode: width is narrower, comfortably show ~900px span
      computedZoom = Math.max(0.42, Math.min(0.80, this.viewportWidth / 900));
    } else {
      // Landscape (Desktop, laptop, tablet, mobile landscape):
      computedZoom = Math.max(0.55, Math.min(1.15, computedZoom));
    }

    this.zoom = computedZoom;
  }

  // Smooth follow supporting seamless horizontal world wrapping
  follow(target, deltaTime = 1 / 60) {
    if (!target) return;

    const mapW = this.worldBounds.maxX || 1700;
    const targetCenterX = target.x + (target.width ? target.width / 2 : 0);
    const targetCenterY = target.y + (target.height ? target.height / 2 : 0);

    // Shortest-distance toroidal delta across the repeating world in X
    let dx = targetCenterX - this.x;
    if (dx > mapW / 2) dx -= mapW;
    if (dx < -mapW / 2) dx += mapW;

    const dtSafe = Math.max(0.001, Math.min(0.1, (typeof deltaTime === 'number' && !isNaN(deltaTime)) ? deltaTime : 1 / 60));
    const factor = 1 - Math.pow(1 - this.lerpSpeed, dtSafe * 60);
    this.x += dx * factor;

    // Keep camera x continuously normalized within [0, mapW)
    this.x = ((this.x % mapW) + mapW) % mapW;

    // Vertical framing: clamp camera Y so ground and upper platforms stay in view
    const halfVisibleH = (this.viewportHeight / (this.zoom || 1)) / 2;
    const minY = this.worldBounds.minY + halfVisibleH;
    const maxY = this.worldBounds.maxY - halfVisibleH;

    if (maxY > minY) {
      const targetY = Math.max(minY, Math.min(maxY, targetCenterY));
      this.y += (targetY - this.y) * factor;
    } else {
      // Arena height fits within viewport: center camera vertically on map
      this.y = (this.worldBounds.minY + this.worldBounds.maxY) / 2;
    }

    if (!isFinite(this.x)) this.x = targetCenterX || 850;
    if (!isFinite(this.y)) this.y = targetCenterY || 440;

    // No camera shake (rock-solid readable action)
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
  }

  snapTo(target) {
    if (!target) return;
    const mapW = this.worldBounds.maxX;
    const targetCenterX = target.x + (target.width ? target.width / 2 : 0);
    const targetCenterY = target.y + (target.height ? target.height / 2 : 0);

    this.x = ((targetCenterX % mapW) + mapW) % mapW;

    const halfVisibleH = (this.viewportHeight / this.zoom) / 2;
    const minY = this.worldBounds.minY + halfVisibleH;
    const maxY = this.worldBounds.maxY - halfVisibleH;
    if (maxY > minY) {
      this.y = Math.max(minY, Math.min(maxY, targetCenterY));
    } else {
      this.y = (this.worldBounds.minY + this.worldBounds.maxY) / 2;
    }
  }

  // Camera shake is disabled for clean pixel-art readability
  shake(intensity = 0, duration = 0) {
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
  }

  begin(ctx) {
    ctx.save();

    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  }

  end(ctx) {
    ctx.restore();
  }

  screenToWorld(sx, sy) {
    const centerX = this.viewportWidth / 2;
    const centerY = this.viewportHeight / 2;
    const wx = (sx - centerX) / this.zoom + this.x;
    const wy = (sy - centerY) / this.zoom + this.y;
    return { x: wx, y: wy };
  }
}

window.Camera = Camera;
