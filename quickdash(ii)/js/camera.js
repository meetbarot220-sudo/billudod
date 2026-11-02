/**
 * Camera - Responsive Follow Camera with 9:16 Mobile Portrait & Landscape Support
 * Features:
 * - Frames 9:16 mobile portrait screens perfectly with zero distortion or black borders
 * - Adapts to 1080x1920, 720x1280, 1080x2160 and modern phone viewports
 * - Smooth exponential follow on player's center with seamless toroidal horizontal wrapping
 * - Keeps player, nearby platforms, and enemies completely visible and readable
 */
class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 850;
    this.y = 450;
    this.targetX = 850;
    this.targetY = 450;

    this.lerpSpeed = 0.095;
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

    const isPortrait = this.viewportWidth < this.viewportHeight;

    if (isPortrait) {
      // 9:16 Mobile Portrait Viewport
      // Target visible world width of 600px ensures platforms, player, and hazards fit comfortably
      // Target visible world height of 1066px (exact 9:16) frames ground through upper platforms
      const targetW = 600;
      const targetH = 1066;

      const scaleX = this.viewportWidth / targetW;
      const scaleY = this.viewportHeight / targetH;
      let computedZoom = Math.min(scaleX, scaleY);

      // Clamp zoom to safe readable bounds
      this.zoom = Math.max(0.40, Math.min(1.2, computedZoom));
    } else {
      // Landscape (Desktop, laptop, tablet):
      const targetH = 880;
      const targetW = 1700;

      const scaleX = this.viewportWidth / targetW;
      const scaleY = this.viewportHeight / targetH;
      let computedZoom = Math.min(scaleX, scaleY);
      this.zoom = Math.max(0.55, Math.min(1.15, computedZoom));
    }
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

    const isPortrait = this.viewportWidth < this.viewportHeight;

    if (isPortrait) {
      // In 9:16 portrait, visible world height is ~1066px
      // Ground is at y = 780, platforms go to y = 210
      // Clamping target Y between 400 and 520 keeps ground visible above touch controls and summit accessible
      const clampedTargetY = Math.max(400, Math.min(520, targetCenterY));
      this.y += (clampedTargetY - this.y) * factor;
    } else {
      // Vertical framing for landscape: clamp camera Y so ground and upper platforms stay in view
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
    }

    if (!isFinite(this.x)) this.x = targetCenterX || 850;
    if (!isFinite(this.y)) this.y = targetCenterY || 450;
  }

  snapTo(target) {
    if (!target) return;
    const mapW = this.worldBounds.maxX;
    const targetCenterX = target.x + (target.width ? target.width / 2 : 0);
    const targetCenterY = target.y + (target.height ? target.height / 2 : 0);

    this.x = ((targetCenterX % mapW) + mapW) % mapW;

    const isPortrait = this.viewportWidth < this.viewportHeight;
    if (isPortrait) {
      this.y = Math.max(400, Math.min(520, targetCenterY));
    } else {
      const halfVisibleH = (this.viewportHeight / this.zoom) / 2;
      const minY = this.worldBounds.minY + halfVisibleH;
      const maxY = this.worldBounds.maxY - halfVisibleH;
      if (maxY > minY) {
        this.y = Math.max(minY, Math.min(maxY, targetCenterY));
      } else {
        this.y = (this.worldBounds.minY + this.worldBounds.maxY) / 2;
      }
    }
  }

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
