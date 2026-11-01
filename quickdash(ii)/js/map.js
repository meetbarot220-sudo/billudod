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
    this.width = 1700; // 21.4% larger than previous (15-25% target)
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
    // 1. Vertical boundaries ONLY (Ground & Ceiling) - NO HARD SIDE WALLS (Looping World)
    this.platforms.push(
      { x: 0, y: 780, w: this.width, h: 70, type: 'solid', style: 'ground' },
      { x: 0, y: 0, w: this.width, h: 40, type: 'solid', style: 'ceiling' }
    );

    // 2. Ground level stone steps / mounds (stepping ramp stones matching reference)
    this.platforms.push(
      { x: 100, y: 730, w: 160, h: 50, type: 'oneway', style: 'earth_block' },
      { x: 760, y: 730, w: 180, h: 50, type: 'oneway', style: 'earth_block' },
      { x: 1440, y: 730, w: 160, h: 50, type: 'oneway', style: 'earth_block' }
    );

    // 3. Lower Tier (y = 635): Flanking terraces & wide central lawn stage
    this.platforms.push(
      { x: 60, y: 635, w: 340, h: 26, type: 'oneway', style: 'wood_bridge' },        // West garden terrace
      { x: 580, y: 635, w: 540, h: 28, type: 'oneway', style: 'grass_mound' },       // Central lawn stage (Primary hub)
      { x: 1300, y: 635, w: 340, h: 26, type: 'oneway', style: 'wood_bridge' }       // East garden terrace
    );

    // 4. Mid Tier (y = 490): Staggered stepping bridges & twin central stone plinths
    this.platforms.push(
      { x: 220, y: 490, w: 280, h: 24, type: 'oneway', style: 'wood_bridge' },       // West mid stepping bridge
      { x: 640, y: 490, w: 160, h: 24, type: 'oneway', style: 'stone_ledge' },       // Center-West stone plinth
      { x: 900, y: 490, w: 160, h: 24, type: 'oneway', style: 'stone_ledge' },       // Center-East stone plinth
      { x: 1200, y: 490, w: 280, h: 24, type: 'oneway', style: 'wood_bridge' }       // East mid stepping bridge
    );

    // 5. Upper Tier (y = 350): High arbor walkways & grand central canopy bridge
    this.platforms.push(
      { x: 80, y: 350, w: 340, h: 24, type: 'oneway', style: 'wood_bridge' },        // West high arbor
      { x: 540, y: 350, w: 620, h: 26, type: 'oneway', style: 'grass_mound' },       // Grand central high walkway
      { x: 1280, y: 350, w: 340, h: 24, type: 'oneway', style: 'wood_bridge' }       // East high arbor
    );

    // 6. Summit Tier (y = 210): Treetop lookout perches & central Gazebo crown
    this.platforms.push(
      { x: 260, y: 210, w: 220, h: 24, type: 'oneway', style: 'treetop_perch' },     // West summit lookout
      { x: 720, y: 200, w: 260, h: 24, type: 'oneway', style: 'stone_ledge' },        // Center Gazebo stone crown
      { x: 1220, y: 210, w: 220, h: 24, type: 'oneway', style: 'treetop_perch' }     // East summit lookout
    );

    // 7. Loop Boundary Bridges (Connecting left and right edges for seamless wraparound running)
    this.platforms.push(
      { x: 0, y: 490, w: 120, h: 22, type: 'oneway', style: 'wood_bridge' },
      { x: 1580, y: 490, w: 120, h: 22, type: 'oneway', style: 'wood_bridge' },
      { x: 0, y: 350, w: 120, h: 22, type: 'oneway', style: 'wood_bridge' },
      { x: 1580, y: 350, w: 120, h: 22, type: 'oneway', style: 'wood_bridge' }
    );

    // 8. AI Waypoints across the reference arena
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

    // 9. Valid reachable shield drop locations across tiers
    this.shieldSpawnPoints = [
      { x: 850, y: 605 },   // Main lawn stage center
      { x: 230, y: 605 },   // West lower terrace
      { x: 1470, y: 605 },  // East lower terrace
      { x: 360, y: 460 },   // West mid stepping bridge
      { x: 1340, y: 460 },  // East mid stepping bridge
      { x: 720, y: 460 },   // Center-west stone plinth
      { x: 980, y: 460 },   // Center-east stone plinth
      { x: 250, y: 320 },   // West high arbor
      { x: 850, y: 320 },   // Grand central high walkway
      { x: 1450, y: 320 },  // East high arbor
      { x: 850, y: 170 }    // Summit Gazebo apex
    ];

    // Spawn points matching reference starting positions
    this.spawnPoints = {
      player: { x: 850, y: 570 },             // Centered on main lawn stage
      knifeChaser: { x: 440, y: 570 },        // Approaching from West terrace
      archer: { x: 1260, y: 570 },            // Guarding East terrace
      ghostAttractor: { x: 850, y: 285 },     // On high central walkway
      ghost: { x: 1420, y: 220 }              // Upper East perch
    };
  }

  initDecorations() {
    // 1. Drifting cumulus garden clouds
    for (let i = 0; i < 7; i++) {
      this.clouds.push({
        x: (i * (this.width / 7)) + Math.random() * 80,
        y: 60 + Math.random() * 110,
        w: 120 + Math.random() * 90,
        h: 36 + Math.random() * 20,
        speed: 12 + Math.random() * 14,
        alpha: 0.55 + Math.random() * 0.25
      });
    }

    // 2. Background Distant Trees (Back foliage layer)
    for (let x = 40; x < this.width; x += 150) {
      this.bgTrees.push({
        x: x + Math.random() * 40,
        y: 780,
        height: 190 + Math.random() * 60,
        canopyWidth: 100 + Math.random() * 45,
        hue: 115 + Math.random() * 30,
        type: Math.random() < 0.4 ? 'round' : 'layered'
      });
    }

    // 3. Midground Trees (Apple trees, cherry blossoms, leafy oaks)
    const treeTypes = ['apple', 'cherry', 'oak', 'willow'];
    for (let x = 80; x < this.width; x += 220) {
      this.midTrees.push({
        x: x + Math.random() * 30,
        y: 780,
        height: 160 + Math.random() * 40,
        width: 80 + Math.random() * 30,
        type: treeTypes[Math.floor(Math.random() * treeTypes.length)],
        fruitColor: Math.random() < 0.5 ? '#ef4444' : '#ec4899',
        swayOffset: Math.random() * Math.PI * 2
      });
    }

    // 4. Garden Bushes & Flowering Shrubs
    for (let x = 20; x < this.width; x += 75) {
      this.bushes.push({
        x: x + Math.random() * 20,
        y: 780,
        w: 36 + Math.random() * 28,
        h: 22 + Math.random() * 16,
        color: Math.random() < 0.6 ? '#16a34a' : '#15803d',
        flowerColor: ['#f43f5e', '#ec4899', '#fef08a', '#38bdf8', '#ffffff'][Math.floor(Math.random() * 5)]
      });
    }

    // 5. Garden Ornaments (Picket fences, stone birdbaths, wooden park benches, glowing lanterns)
    for (let x = 120; x < this.width; x += 420) {
      this.decorations.push({
        type: 'bench',
        x: x,
        y: 780
      });
    }

    for (let x = 280; x < this.width; x += 520) {
      this.decorations.push({
        type: 'birdbath',
        x: x,
        y: 780
      });
    }

    for (let x = 160; x < this.width; x += 380) {
      this.decorations.push({
        type: 'lantern',
        x: x,
        y: 780
      });
    }

    // 6. Ambient Drifting Petals & Pollen Motes
    for (let i = 0; i < 45; i++) {
      this.petals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: 24 + Math.random() * 32,
        vy: 18 + Math.random() * 22,
        size: 3 + Math.random() * 3.5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: 1 + Math.random() * 3,
        color: Math.random() < 0.55 ? '#fbcfe8' : (Math.random() < 0.75 ? '#fed7aa' : '#fef08a'),
        swayPhase: Math.random() * Math.PI * 2
      });
    }
  }

  update(dt) {
    this.timer += dt;

    // Clouds drift with wrap
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > this.width + 100) c.x = -150;
    }

    // Drifting flower petals & pollen
    for (const petal of this.petals) {
      petal.x += petal.vx * dt;
      petal.y += (petal.vy + Math.sin(this.timer * 2.5 + petal.swayPhase) * 14) * dt;
      petal.rot += petal.rotSpeed * dt;

      // Wrap petals horizontally & reset vertically
      if (petal.x >= this.width) petal.x -= this.width;
      if (petal.y > this.height - 70) petal.y = 30 + Math.random() * 50;
    }
  }

  // AABB resolution supporting reliable platform landings & head-clear jumps
  resolveEntity(entity, dt) {
    const prevBottom = entity.prevY !== undefined ? entity.prevY + entity.height : entity.y + entity.height;
    let onGround = false;

    // Check Platforms
    for (const p of this.platforms) {
      if (p.type === 'oneway') {
        if (
          entity.vy >= 0 &&
          !entity.isDroppingDown &&
          entity.x + entity.width > p.x + 2 &&
          entity.x < p.x + p.w - 2
        ) {
          const currBottom = entity.y + entity.height;
          const maxDrop = Math.max(16, entity.vy * dt + 6);
          if (currBottom >= p.y && prevBottom <= p.y + 10 && currBottom <= p.y + maxDrop) {
            entity.y = p.y - entity.height;
            entity.vy = 0;
            onGround = true;
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

    // 1. Daytime Garden Park Sky Gradient across the entire visible span
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#38bdf8');   // Vivid clear azure
    skyGrad.addColorStop(0.35, '#7dd3fc');
    skyGrad.addColorStop(0.7, '#bae6fd');  // Soft park horizon
    skyGrad.addColorStop(1, '#dcfce7');    // Warm ambient garden grass reflection
    ctx.fillStyle = skyGrad;
    ctx.fillRect(viewLeft - 100, 0, (viewRight - viewLeft) + 200, this.height);

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
      // Distant Misty Ridge
      ctx.fillStyle = 'rgba(134, 239, 172, 0.32)';
      ctx.beginPath();
      ctx.moveTo(0, 780);
      for (let hx = 0; hx <= mapW; hx += 160) {
        const hy = 510 + Math.sin(hx * 0.0035 + 1.2) * 65;
        ctx.quadraticCurveTo(hx - 80, hy - 25, hx, hy);
      }
      ctx.lineTo(mapW, 780);
      ctx.closePath();
      ctx.fill();

      // Mid-distance Lush Meadow Hills
      ctx.fillStyle = 'rgba(74, 222, 128, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, 780);
      for (let hx = 0; hx <= mapW; hx += 140) {
        const hy = 570 + Math.sin(hx * 0.0055 + 0.4) * 45;
        ctx.quadraticCurveTo(hx - 70, hy - 20, hx, hy);
      }
      ctx.lineTo(mapW, 780);
      ctx.closePath();
      ctx.fill();

      // --- LAYER B: Background Distant Trees ---
      for (const t of this.bgTrees) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(t.x - 7, t.y - t.height, 14, t.height);

        // Soft canopy
        ctx.fillStyle = `hsl(${t.hue}, 48%, 38%)`;
        ctx.beginPath();
        ctx.arc(t.x, t.y - t.height - 18, t.canopyWidth * 0.45, 0, Math.PI * 2);
        ctx.arc(t.x - 22, t.y - t.height - 8, t.canopyWidth * 0.35, 0, Math.PI * 2);
        ctx.arc(t.x + 22, t.y - t.height - 8, t.canopyWidth * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- LAYER C: Wooden Garden Picket Fences ---
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      for (let fx = 0; fx <= mapW; fx += 28) {
        ctx.fillRect(fx, 742, 9, 40);
        ctx.strokeRect(fx, 742, 9, 40);
        ctx.beginPath();
        ctx.moveTo(fx, 742);
        ctx.lineTo(fx + 4.5, 734);
        ctx.lineTo(fx + 9, 742);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillRect(0, 750, mapW, 5);
      ctx.fillRect(0, 764, mapW, 5);

      // --- LAYER D: Midground Park Trees (Swaying Branches, Fruit & Blossoms) ---
      for (const mt of this.midTrees) {
        const sway = Math.sin(this.timer * 2.2 + mt.swayOffset) * 4;

        // Tree Trunk
        ctx.fillStyle = '#854d0e';
        ctx.beginPath();
        ctx.moveTo(mt.x - 8, mt.y);
        ctx.lineTo(mt.x - 5, mt.y - mt.height);
        ctx.lineTo(mt.x + 5, mt.y - mt.height);
        ctx.lineTo(mt.x + 8, mt.y);
        ctx.closePath();
        ctx.fill();

        // Branches with sway
        ctx.save();
        ctx.translate(mt.x, mt.y - mt.height);
        ctx.rotate(sway * 0.02);

        if (mt.type === 'cherry') {
          // Flowering cherry blossom
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(0, -20, mt.width * 0.55, 0, Math.PI * 2);
          ctx.arc(-24, -10, mt.width * 0.42, 0, Math.PI * 2);
          ctx.arc(24, -10, mt.width * 0.42, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fbcfe8';
          ctx.beginPath();
          ctx.arc(-10, -24, mt.width * 0.35, 0, Math.PI * 2);
          ctx.arc(12, -22, mt.width * 0.35, 0, Math.PI * 2);
          ctx.fill();
        } else if (mt.type === 'apple') {
          // Lush apple tree
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(0, -22, mt.width * 0.52, 0, Math.PI * 2);
          ctx.arc(-26, -10, mt.width * 0.44, 0, Math.PI * 2);
          ctx.arc(26, -10, mt.width * 0.44, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(0, -30, mt.width * 0.38, 0, Math.PI * 2);
          ctx.fill();

          // Red apples
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(-14, -18, 4, 0, Math.PI * 2);
          ctx.arc(16, -15, 4, 0, Math.PI * 2);
          ctx.arc(-2, -32, 4, 0, Math.PI * 2);
          ctx.arc(24, -26, 3.5, 0, Math.PI * 2);
          ctx.arc(-22, -8, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (mt.type === 'willow') {
          // Elegant weeping willow
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.ellipse(0, -20, mt.width * 0.6, 38, 0, 0, Math.PI * 2);
          ctx.fill();

          // Hanging drooping fronds
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          for (let w = -32; w <= 32; w += 10) {
            ctx.beginPath();
            ctx.moveTo(w, -10);
            ctx.quadraticCurveTo(w + sway * 1.5, 12, w + sway * 2.2, 28);
            ctx.stroke();
          }
        } else {
          // Great Garden Oak
          ctx.fillStyle = '#166534';
          ctx.beginPath();
          ctx.arc(0, -24, mt.width * 0.58, 0, Math.PI * 2);
          ctx.arc(-30, -12, mt.width * 0.44, 0, Math.PI * 2);
          ctx.arc(30, -12, mt.width * 0.44, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(-10, -32, mt.width * 0.4, 0, Math.PI * 2);
          ctx.arc(14, -30, mt.width * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // --- LAYER E: Garden Ornaments (Benches, Birdbaths, Lanterns) ---
      for (const dec of this.decorations) {
        if (dec.type === 'bench') {
          // Wooden park bench
          ctx.fillStyle = '#b45309';
          ctx.fillRect(dec.x - 22, dec.y - 18, 44, 5); // seat
          ctx.fillRect(dec.x - 20, dec.y - 32, 40, 10); // backrest
          ctx.fillStyle = '#451a03';
          ctx.fillRect(dec.x - 18, dec.y - 13, 4, 13); // legs
          ctx.fillRect(dec.x + 14, dec.y - 13, 4, 13);
        } else if (dec.type === 'birdbath') {
          // Carved stone birdbath
          ctx.fillStyle = '#64748b';
          ctx.fillRect(dec.x - 4, dec.y - 30, 8, 30);
          ctx.fillRect(dec.x - 12, dec.y - 4, 24, 4);
          ctx.beginPath();
          ctx.ellipse(dec.x, dec.y - 32, 18, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          // Clear water
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(dec.x, dec.y - 33, 14, 4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (dec.type === 'lantern') {
          // Classical stone park lantern
          ctx.fillStyle = '#334155';
          ctx.fillRect(dec.x - 3, dec.y - 65, 6, 65);
          ctx.fillRect(dec.x - 9, dec.y - 74, 18, 4);
          // Warm glowing core
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(dec.x - 6, dec.y - 70, 12, 10);
          ctx.fillStyle = 'rgba(254, 240, 138, 0.28)';
          ctx.beginPath();
          ctx.arc(dec.x, dec.y - 65, 24, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- LAYER F: Flowering Bushes & Boxwood Shrubs ---
      for (const b of this.bushes) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y - b.h * 0.45, b.w * 0.5, b.h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Little flower blossoms
        ctx.fillStyle = b.flowerColor;
        ctx.beginPath();
        ctx.arc(b.x - b.w * 0.22, b.y - b.h * 0.6, 2.5, 0, Math.PI * 2);
        ctx.arc(b.x + b.w * 0.2, b.y - b.h * 0.55, 2.5, 0, Math.PI * 2);
        ctx.arc(b.x, b.y - b.h * 0.75, 2.5, 0, Math.PI * 2);
        ctx.arc(b.x - b.w * 0.1, b.y - b.h * 0.35, 2, 0, Math.PI * 2);
        ctx.fill();
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

          // Carved end post finials
          ctx.fillStyle = '#78350f';
          ctx.fillRect(p.x - 2, p.y - 6, 6, p.h + 6);
          ctx.fillRect(p.x + p.w - 4, p.y - 6, 6, p.h + 6);
          ctx.beginPath();
          ctx.arc(p.x + 1, p.y - 7, 4, 0, Math.PI * 2);
          ctx.arc(p.x + p.w - 1, p.y - 7, 4, 0, Math.PI * 2);
          ctx.fill();

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

          // Wildflower blossoms
          for (let fx = p.x + 20; fx < p.x + p.w - 20; fx += 55) {
            ctx.fillStyle = (fx % 110 === 0) ? '#fef08a' : '#fbcfe8';
            ctx.beginPath();
            ctx.arc(fx, p.y - 3, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        } else {
          // GROUND FLOOR (Main Garden Turf)
          ctx.save();
          // Rich loamy subsoil
          const groundGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
          groundGrad.addColorStop(0, '#78350f');
          groundGrad.addColorStop(0.35, '#59270b');
          groundGrad.addColorStop(1, '#2e1005');
          ctx.fillStyle = groundGrad;
          ctx.fillRect(p.x, p.y + 8, p.w, p.h - 8);

          // Lush emerald turf
          const turfGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + 10);
          turfGrad.addColorStop(0, '#4ade80');
          turfGrad.addColorStop(1, '#15803d');
          ctx.fillStyle = turfGrad;
          ctx.fillRect(p.x, p.y, p.w, 10);

          // Animated swaying blades
          ctx.fillStyle = '#22c55e';
          for (let gx = p.x + 2; gx < p.x + p.w; gx += 10) {
            const gSway = Math.sin(this.timer * 3.0 + gx * 0.04) * 2.5;
            ctx.beginPath();
            ctx.moveTo(gx, p.y);
            ctx.lineTo(gx + 2.5 + gSway, p.y - 5);
            ctx.lineTo(gx + 5, p.y);
            ctx.fill();
          }

          // Field wildflowers
          for (let fx = p.x + 25; fx < p.x + p.w; fx += 45) {
            ctx.fillStyle = (fx % 90 === 0) ? '#fef08a' : (fx % 135 === 0 ? '#38bdf8' : '#ffffff');
            ctx.beginPath();
            ctx.arc(fx, p.y - 3, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

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
