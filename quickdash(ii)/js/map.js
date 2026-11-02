/**
 * GameMap - Expanded Lively Looping Garden Arena (1,700px width)
 * Features:
 * - Seamless horizontal wraparound across multi-pass repeating world
 * - Rich layered garden aesthetic inspired by Multiplayer Quick Tag:
 *     Layer 1: Daytime park sky, soft drifting clouds, warm sunbeams, distant rolling hills
 *     Layer 2: Midground apple & cherry blossom trees, garden picket fences, stone birdbaths, lanterns
 *     Layer 3: Playable garden terrain: Organic grass mounds with hanging ivy, wood pergolas, stone ledges
 *     Layer 4: Bouncy spotted giant toadstools with animated recoil
 *     Layer 5: Living ambient motion: Swaying grass blades, swaying hanging vines, drifting petals & pollen
 */
class GameMap {
  constructor() {
    this.width = 1700; // Original 1,700px old garden map width
    this.height = 850;

    this.platforms = [];
    this.waypoints = [];
    this.shieldSpawnPoints = [];
    this.clouds = [];
    this.bgTrees = [];
    this.midTrees = [];
    this.bushes = [];
    this.decorations = [];
    this.petals = [];

    this.buildCompactMap();
    this.initDecorations();

    this.timer = 0;
  }

  buildCompactMap() {
    // 1. Sky Ceiling ONLY (y = 0..40) - NO BOTTOM BRICK GROUND PLATFORM
    this.platforms.push(
      { x: 0, y: 0, w: this.width, h: 40, type: 'solid', style: 'ceiling' }
    );

    // 2. Lower Floating Tier (y = 635): Flanking terraces & wide central lawn stage
    this.platforms.push(
      { x: 60, y: 635, w: 340, h: 26, type: 'oneway', style: 'wood_bridge' },        // West garden terrace
      { x: 580, y: 635, w: 540, h: 28, type: 'oneway', style: 'grass_mound' },       // Central lawn stage (Primary hub)
      { x: 1300, y: 635, w: 340, h: 26, type: 'oneway', style: 'wood_bridge' }       // East garden terrace
    );

    // 3. Mid Floating Tier (y = 490): Staggered stepping bridges & twin central stone plinths
    this.platforms.push(
      { x: 220, y: 490, w: 280, h: 24, type: 'oneway', style: 'wood_bridge' },       // West mid stepping bridge
      { x: 640, y: 490, w: 160, h: 24, type: 'oneway', style: 'stone_ledge' },       // Center-West stone plinth
      { x: 900, y: 490, w: 160, h: 24, type: 'oneway', style: 'stone_ledge' },       // Center-East stone plinth
      { x: 1200, y: 490, w: 280, h: 24, type: 'oneway', style: 'wood_bridge' }       // East mid stepping bridge
    );

    // 4. Upper Floating Tier (y = 350): High arbor walkways & grand central canopy bridge
    this.platforms.push(
      { x: 80, y: 350, w: 340, h: 24, type: 'oneway', style: 'wood_bridge' },        // West high arbor
      { x: 540, y: 350, w: 620, h: 26, type: 'oneway', style: 'grass_mound' },       // Grand central high walkway
      { x: 1280, y: 350, w: 340, h: 24, type: 'oneway', style: 'wood_bridge' }       // East high arbor
    );

    // 5. Summit Floating Tier (y = 210): Treetop lookout perches & central Gazebo crown
    this.platforms.push(
      { x: 260, y: 210, w: 220, h: 24, type: 'oneway', style: 'treetop_perch' },     // West summit lookout
      { x: 720, y: 200, w: 260, h: 24, type: 'oneway', style: 'stone_ledge' },        // Center Gazebo stone crown
      { x: 1220, y: 210, w: 220, h: 24, type: 'oneway', style: 'treetop_perch' }     // East summit lookout
    );

    // 6. Loop Boundary Bridges (Connecting left and right edges for seamless wraparound running)
    this.platforms.push(
      { x: 0, y: 490, w: 120, h: 22, type: 'oneway', style: 'wood_bridge' },
      { x: 1580, y: 490, w: 120, h: 22, type: 'oneway', style: 'wood_bridge' },
      { x: 0, y: 350, w: 120, h: 22, type: 'oneway', style: 'wood_bridge' },
      { x: 1580, y: 350, w: 120, h: 22, type: 'oneway', style: 'wood_bridge' }
    );

    // 7. AI Waypoints strictly on the floating platforms
    this.waypoints = [
      { x: 230, y: 615 },
      { x: 850, y: 615 },
      { x: 1470, y: 615 },
      { x: 360, y: 470 },
      { x: 720, y: 470 },
      { x: 980, y: 470 },
      { x: 1340, y: 470 },
      { x: 250, y: 330 },
      { x: 850, y: 330 },
      { x: 1450, y: 330 },
      { x: 850, y: 180 }
    ];

    // 8. Reachable shield drop locations on floating platforms
    this.shieldSpawnPoints = [
      { x: 850, y: 550 },   // Main lawn stage center
      { x: 230, y: 550 },   // West lower terrace
      { x: 1470, y: 550 },  // East lower terrace
      { x: 360, y: 410 },   // West mid stepping bridge
      { x: 1340, y: 410 },  // East mid stepping bridge
      { x: 720, y: 410 },   // Center-west stone plinth
      { x: 980, y: 410 },   // Center-east stone plinth
      { x: 250, y: 270 },   // West high arbor
      { x: 850, y: 270 },   // Grand central high walkway
      { x: 1450, y: 270 },  // East high arbor
      { x: 850, y: 130 }    // Summit Gazebo apex
    ];

    // Spawn points sized for 1.3x characters (height = 42) on floating platforms
    this.spawnPoints = {
      player: { x: 850, y: 593 },             // Centered on main lawn stage (y = 635 - 42)
      knifeChaser: { x: 220, y: 593 },        // West terrace (y = 635 - 42)
      archer: { x: 1450, y: 593 },            // East terrace (y = 635 - 42)
      ghostAttractor: { x: 850, y: 308 },     // High central walkway (y = 350 - 42)
      ghost: { x: 1300, y: 200 }              // Upper East perch
    };
  }

  initDecorations() {
    // 1. Drifting cumulus garden clouds (5 soft clouds across 1,700px)
    const cloudConfigs = [
      { x: 100, y: 75, w: 160, h: 42, speed: 16, alpha: 0.55 },
      { x: 480, y: 130, w: 200, h: 48, speed: 13, alpha: 0.48 },
      { x: 860, y: 80, w: 150, h: 38, speed: 18, alpha: 0.58 },
      { x: 1220, y: 125, w: 190, h: 46, speed: 14, alpha: 0.50 },
      { x: 1540, y: 90, w: 160, h: 40, speed: 17, alpha: 0.54 }
    ];
    for (const c of cloudConfigs) {
      this.clouds.push(c);
    }

    // 2. Background Distant Trees - Minimal (only 3 soft silhouettes for open visibility)
    const bgXs = [320, 850, 1380];
    for (let i = 0; i < bgXs.length; i++) {
      this.bgTrees.push({
        x: bgXs[i],
        y: 850,
        height: 220,
        canopyWidth: 120,
        hue: 125,
        type: 'round'
      });
    }

    // 3. Midground Trees - Only 3 clean green oak trees (NO pink blossom trees, NO flowers, NO visual clutter)
    const midXs = [260, 850, 1440];
    for (let i = 0; i < midXs.length; i++) {
      this.midTrees.push({
        x: midXs[i],
        y: 850,
        height: 240,
        width: 90,
        type: 'oak',
        fruitColor: null,
        swayOffset: i * 2.0
      });
    }

    // 4. ZERO flowers, ZERO petals, ZERO decorative clutter, ZERO fences
    this.bushes = [];
    this.decorations = [];
    this.petals = [];
  }

  update(dt) {
    this.timer += dt;

    // Clouds drift with seamless loop
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > this.width + 120) {
        c.x = -180;
      }
    }
  }

  resolveEntity(entity, dt) {
    const prevBottom = entity.prevY !== undefined ? entity.prevY + entity.height : entity.y + entity.height;
    let onGround = false;

    // Check entity both in original coordinate and wrapped coordinate if spanning boundary
    const xOffsets = [0];
    if (entity.x + entity.width > this.width) xOffsets.push(-this.width);
    if (entity.x < 0) xOffsets.push(this.width);

    // Check Platforms
    for (const p of this.platforms) {
      if (p.type === 'oneway') {
        if (entity.vy >= 0 && !entity.isDroppingDown) {
          for (const xOff of xOffsets) {
            const ex = entity.x + xOff;
            // For platforms touching boundary, allow edge crossing without 2px margin inset
            const leftMargin = (p.x === 0) ? -50 : 2;
            const rightMargin = (p.x + p.w >= this.width) ? 50 : 2;
            if (ex + entity.width > p.x + leftMargin && ex < p.x + p.w - rightMargin) {
              const currBottom = entity.y + entity.height;
              const maxDrop = Math.max(16, entity.vy * dt + 6);
              if (currBottom >= p.y && prevBottom <= p.y + 10 && currBottom <= p.y + maxDrop) {
                entity.y = p.y - entity.height;
                entity.vy = 0;
                onGround = true;
                break;
              }
            }
          }
        }
      } else if (p.type === 'solid') {
        if (p.style === 'ground') {
          if (entity.y + entity.height >= p.y && entity.vy >= 0) {
            entity.y = p.y - entity.height;
            entity.vy = 0;
            onGround = true;
          }
        } else if (p.style === 'ceiling') {
          if (entity.y <= p.y + p.h && entity.vy < 0) {
            entity.y = p.y + p.h;
            entity.vy = 0;
          }
        }
      }
    }

    entity.grounded = onGround;
    return onGround;
  }

  // Draw full lively garden arena across all visible copies for seamless looping
  draw(ctx, camera, minCopy, maxCopy) {
    const mapW = this.width;
    const halfVisibleW = (camera.viewportWidth / camera.zoom) / 2 + 100;
    const viewLeft = camera.x - halfVisibleW;
    const viewRight = camera.x + halfVisibleW;

    const cMin = minCopy !== undefined ? minCopy : Math.floor(viewLeft / mapW);
    const cMax = maxCopy !== undefined ? maxCopy : Math.floor(viewRight / mapW);

    // 1. Daytime Garden Park Sky Gradient across the entire visible span (Fully covers 9:16 mobile portrait & landscape)
    const halfVisibleH = (camera.viewportHeight / camera.zoom) / 2 + 120;
    const viewTop = Math.min(-600, camera.y - halfVisibleH);
    const viewBottom = Math.max(this.height + 600, camera.y + halfVisibleH);
    const totalH = viewBottom - viewTop;

    const skyGrad = ctx.createLinearGradient(0, viewTop, 0, this.height);
    skyGrad.addColorStop(0, '#0284c7');    // Clear azure zenith
    skyGrad.addColorStop(0.35, '#38bdf8'); // Vivid clear azure
    skyGrad.addColorStop(0.65, '#7dd3fc');
    skyGrad.addColorStop(0.85, '#bae6fd'); // Soft park horizon
    skyGrad.addColorStop(1, '#dcfce7');    // Warm ambient garden grass reflection
    ctx.fillStyle = skyGrad;
    ctx.fillRect(viewLeft - 100, viewTop, (viewRight - viewLeft) + 200, totalH);

    // 2. Soft Park Sunbeams (Warm ambient diagonal rays)
    ctx.save();
    ctx.fillStyle = 'rgba(254, 240, 138, 0.05)';
    for (let b = -3; b <= 5; b++) {
      const beamX = b * 420 + ((this.timer * 6) % 420);
      ctx.beginPath();
      ctx.moveTo(beamX, 0);
      ctx.lineTo(beamX + 180, 0);
      ctx.lineTo(beamX - 110, this.height);
      ctx.lineTo(beamX - 290, this.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 3. Drifting Fluffy Garden Clouds
    ctx.save();
    for (let k = cMin; k <= cMax; k++) {
      for (const c of this.clouds) {
        const cx = k * mapW + c.x;
        ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`;
        ctx.beginPath();
        ctx.ellipse(cx, c.y, c.w * 0.45, c.h * 0.45, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - c.w * 0.25, c.y + 4, c.w * 0.32, c.h * 0.38, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + c.w * 0.25, c.y + 3, c.w * 0.34, c.h * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 4. Render Repeating World Copies (Multi-pass continuous world rendering)
    for (let k = cMin; k <= cMax; k++) {
      ctx.save();
      ctx.translate(k * mapW, 0);

      // --- LAYER A: Distant Rolling Hills (Far Parallax & Depth) ---
      // Strictly periodic harmonic curves ensuring 100% zero-cliff seam across x = 0 <-> 1700
      const k1 = (4 * Math.PI) / mapW;
      ctx.fillStyle = 'rgba(134, 239, 172, 0.32)';
      ctx.beginPath();
      ctx.moveTo(0, 780);
      for (let hx = 0; hx <= mapW; hx += 25) {
        const hy = 510 + Math.sin(hx * k1) * 65;
        ctx.lineTo(hx, hy);
      }
      ctx.lineTo(mapW, 780);
      ctx.closePath();
      ctx.fill();

      // Mid-distance Lush Meadow Hills
      const k2 = (6 * Math.PI) / mapW;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, 780);
      for (let hx = 0; hx <= mapW; hx += 25) {
        const hy = 570 + Math.sin(hx * k2) * 45;
        ctx.lineTo(hx, hy);
      }
      ctx.lineTo(mapW, 780);
      ctx.closePath();
      ctx.fill();

      // --- LAYER B: Background Distant Trees (Dual-side Toroidal Wrapping) ---
      for (const t of this.bgTrees) {
        const xPositions = [t.x];
        if (t.x < 110) xPositions.push(t.x + mapW);
        if (t.x > mapW - 110) xPositions.push(t.x - mapW);

        for (const tx of xPositions) {
          ctx.fillStyle = '#78350f';
          ctx.fillRect(tx - 7, t.y - t.height, 14, t.height);

          // Soft canopy
          ctx.fillStyle = `hsl(${t.hue}, 48%, 38%)`;
          ctx.beginPath();
          ctx.arc(tx, t.y - t.height - 18, t.canopyWidth * 0.45, 0, Math.PI * 2);
          ctx.arc(tx - 22, t.y - t.height - 8, t.canopyWidth * 0.35, 0, Math.PI * 2);
          ctx.arc(tx + 22, t.y - t.height - 8, t.canopyWidth * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- LAYER D: Midground Park Trees (Dual-side Toroidal Wrapping & Sway) ---
      for (const mt of this.midTrees) {
        const xPositions = [mt.x];
        if (mt.x < 120) xPositions.push(mt.x + mapW);
        if (mt.x > mapW - 120) xPositions.push(mt.x - mapW);

        for (const tx of xPositions) {
          const sway = Math.sin(this.timer * 2.2 + mt.swayOffset) * 4;

          // Tree Trunk
          ctx.fillStyle = '#854d0e';
          ctx.beginPath();
          ctx.moveTo(tx - 8, mt.y);
          ctx.lineTo(tx - 5, mt.y - mt.height);
          ctx.lineTo(tx + 5, mt.y - mt.height);
          ctx.lineTo(tx + 8, mt.y);
          ctx.closePath();
          ctx.fill();

          // Branches with sway
          ctx.save();
          ctx.translate(tx, mt.y - mt.height);
          ctx.rotate(sway * 0.02);

          // Simple clean garden green oak canopy (NO flowers, NO fruits)
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(0, -24, mt.width * 0.58, 0, Math.PI * 2);
          ctx.arc(-26, -12, mt.width * 0.44, 0, Math.PI * 2);
          ctx.arc(26, -12, mt.width * 0.44, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(-8, -32, mt.width * 0.38, 0, Math.PI * 2);
          ctx.arc(12, -30, mt.width * 0.38, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      // --- LAYER E: Garden Ornaments (Dual-side Toroidal Wrapping) ---
      for (const dec of this.decorations) {
        const xPositions = [dec.x];
        if (dec.x < 50) xPositions.push(dec.x + mapW);
        if (dec.x > mapW - 50) xPositions.push(dec.x - mapW);

        for (const dx of xPositions) {
          if (dec.type === 'bench') {
            // Wooden park bench
            ctx.fillStyle = '#b45309';
            ctx.fillRect(dx - 22, dec.y - 18, 44, 5); // seat
            ctx.fillRect(dx - 20, dec.y - 32, 40, 10); // backrest
            ctx.fillStyle = '#451a03';
            ctx.fillRect(dx - 18, dec.y - 13, 4, 13); // legs
            ctx.fillRect(dx + 14, dec.y - 13, 4, 13);
          } else if (dec.type === 'birdbath') {
            // Carved stone birdbath
            ctx.fillStyle = '#64748b';
            ctx.fillRect(dx - 4, dec.y - 30, 8, 30);
            ctx.fillRect(dx - 12, dec.y - 4, 24, 4);
            ctx.beginPath();
            ctx.ellipse(dx, dec.y - 32, 18, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Clear water
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.ellipse(dx, dec.y - 33, 14, 4, 0, 0, Math.PI * 2);
            ctx.fill();
          } else if (dec.type === 'lantern') {
            // Classical stone park lantern
            ctx.fillStyle = '#334155';
            ctx.fillRect(dx - 3, dec.y - 65, 6, 65);
            ctx.fillRect(dx - 9, dec.y - 74, 18, 4);
            // Warm glowing core
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(dx - 6, dec.y - 70, 12, 10);
            ctx.fillStyle = 'rgba(254, 240, 138, 0.28)';
            ctx.beginPath();
            ctx.arc(dx, dec.y - 65, 24, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // --- LAYER F: Flowering Bushes & Boxwood Shrubs (Dual-side Toroidal Wrapping) ---
      for (const b of this.bushes) {
        const xPositions = [b.x];
        if (b.x < 60) xPositions.push(b.x + mapW);
        if (b.x > mapW - 60) xPositions.push(b.x - mapW);

        for (const bx of xPositions) {
          // Clean green garden shrub (NO flowers)
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.ellipse(bx, b.y - b.h * 0.45, b.w * 0.5, b.h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- LAYER G: Playable Garden Platforms (Organic, Layered & Natural) ---
      for (const p of this.platforms) {
        if (p.style === 'wood_bridge' || p.style === 'treetop_perch') {
          // Crafted Garden Pergola / Boardwalk
          ctx.save();
          // Frame beam
          const woodGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
          woodGrad.addColorStop(0, '#92400e');
          woodGrad.addColorStop(1, '#451a03');
          ctx.fillStyle = woodGrad;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(p.x, p.y + 4, p.w, p.h - 4, 4);
          else ctx.rect(p.x, p.y + 4, p.w, p.h - 4);
          ctx.fill();

          // Planks
          ctx.fillStyle = '#b45309';
          const plankW = 20;
          for (let px = p.x; px < p.x + p.w; px += plankW) {
            ctx.fillRect(px + 1, p.y, Math.min(plankW - 2, p.x + p.w - px), 5);
          }

          // Carved end post finials (only at true outer ends, NOT at loop boundary seam)
          ctx.fillStyle = '#78350f';
          if (p.x > 0) {
            ctx.fillRect(p.x - 2, p.y - 6, 6, p.h + 6);
            ctx.beginPath();
            ctx.arc(p.x + 1, p.y - 7, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          if (p.x + p.w < mapW) {
            ctx.fillRect(p.x + p.w - 4, p.y - 6, 6, p.h + 6);
            ctx.beginPath();
            ctx.arc(p.x + p.w - 1, p.y - 7, 4, 0, Math.PI * 2);
            ctx.fill();
          }

          // Hanging Climbing Ivy with Breeze Sway
          ctx.fillStyle = '#22c55e';
          for (let ix = p.x + 16; ix < p.x + p.w - 16; ix += 32) {
            const vineSway = Math.sin(this.timer * 2.2 + ix * 0.04) * 3.5;
            ctx.beginPath();
            ctx.moveTo(ix, p.y + p.h);
            ctx.quadraticCurveTo(ix + vineSway, p.y + p.h + 8, ix + vineSway * 1.4, p.y + p.h + 16);
            ctx.lineTo(ix + 6, p.y + p.h);
            ctx.fill();
          }

          ctx.restore();
        } else if (p.style === 'stone_ledge') {
          // Weathered Ancient Garden Stone Terrace
          ctx.save();
          const sGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
          sGrad.addColorStop(0, '#64748b');
          sGrad.addColorStop(0.6, '#475569');
          sGrad.addColorStop(1, '#1e293b');
          ctx.fillStyle = sGrad;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(p.x, p.y, p.w, p.h, 6);
          else ctx.rect(p.x, p.y, p.w, p.h);
          ctx.fill();

          // Stone masonry mortar grooves
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;
          for (let sx = p.x + 36; sx < p.x + p.w - 10; sx += 44) {
            ctx.beginPath();
            ctx.moveTo(sx, p.y + 4);
            ctx.lineTo(sx, p.y + p.h - 2);
            ctx.stroke();
          }

          // Top Moss Trim
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(p.x + 2, p.y, p.w - 4, 4);
          for (let mx = p.x + 6; mx < p.x + p.w - 8; mx += 14) {
            ctx.beginPath();
            ctx.arc(mx, p.y + 4, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        } else if (p.style === 'grass_mound') {
          // Natural Elevated Grass-Topped Earth Mound
          ctx.save();

          // Earthen underbody with organic rounded contour
          const earthGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h + 6);
          earthGrad.addColorStop(0, '#78350f');
          earthGrad.addColorStop(0.4, '#59270b');
          earthGrad.addColorStop(1, '#2e1005');
          ctx.fillStyle = earthGrad;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(p.x, p.y + 6, p.w, p.h, [0, 0, 10, 10]);
          else ctx.rect(p.x, p.y + 6, p.w, p.h);
          ctx.fill();

          // Exposed smooth river pebbles in earth
          ctx.fillStyle = '#94a3b8';
          for (let rx = p.x + 24; rx < p.x + p.w - 20; rx += 48) {
            ctx.beginPath();
            ctx.ellipse(rx, p.y + p.h - 4, 4, 2.5, 0.2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Lush Grass Crown
          const grassGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 10);
          grassGrad.addColorStop(0, '#4ade80');
          grassGrad.addColorStop(1, '#16a34a');
          ctx.fillStyle = grassGrad;
          ctx.fillRect(p.x - 2, p.y, p.w + 4, 9);

          // Animated swaying grass tufts
          ctx.fillStyle = '#22c55e';
          for (let tx = p.x + 4; tx < p.x + p.w - 4; tx += 12) {
            const sway = Math.sin(this.timer * 2.8 + tx * 0.05) * 2;
            ctx.beginPath();
            ctx.moveTo(tx, p.y);
            ctx.lineTo(tx + 3 + sway, p.y - 5);
            ctx.lineTo(tx + 6, p.y);
            ctx.fill();
          }

          // Hanging Ivy Tendrils with Breeze Sway
          ctx.fillStyle = '#16a34a';
          for (let ix = p.x + 18; ix < p.x + p.w - 18; ix += 36) {
            const ivySway = Math.sin(this.timer * 2.0 + ix * 0.03) * 3;
            ctx.beginPath();
            ctx.moveTo(ix, p.y + 8);
            ctx.quadraticCurveTo(ix + ivySway, p.y + 18, ix + ivySway * 1.5, p.y + 26);
            ctx.lineTo(ix + 6, p.y + 8);
            ctx.fill();
          }

          // Clean grass mound (NO flowers)

          ctx.restore();
        }
      }

      // --- LAYER H: Drifting Flower Petals & Pollen Particles ---
      for (const petal of this.petals) {
        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate(petal.rot);
        ctx.fillStyle = petal.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, petal.size, petal.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }
  }
}

window.GameMap = GameMap;
