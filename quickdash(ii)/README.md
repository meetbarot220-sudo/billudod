# Quick Dash: Garden Tag Arena 🌸🐾🏃

A platform-independent 2D arcade survival and tag game closely inspired by the visual style, garden environment, character proportions, and fast-paced movement feel of **Multiplayer Quick Tag** (*Cat Tag* by monoinyo), featuring 100% original art, character designs, procedural audio synthesis, and visual effects.

---

## 🎮 Core Gameplay Systems

### 1. Instant Play: "TOUCH TO PLAY"
- No traditional bulky start menus.
- The garden park and characters are rendered immediately on screen.
- A clean, centered **TOUCH TO PLAY** prompt initiates the match.
- Touching/clicking it immediately starts the 60-second round.

### 2. 60-Second Round Countdown
- Each round lasts exactly **60 seconds**.
- HUD displays real-time countdown: **60 → 59 → 58 → ... → 0**.
- Reaching 0 safely completes the round with a survival bonus!

### 3. Player Health (100 HP) & 3 Lives
- **Player Stats**: **3 Lives (`♥ ♥ ♥`) + 100 HP per life**.
- **Normal Bot Attacks** (Knife Chaser, Archer Arrows):
  - Each hit removes **-33 HP** with hit sparks and knockback.
  - Progression: **100 HP → 67 HP → 34 HP → 0 HP**.
  - On reaching 0 HP: player loses **1 life**, HP resets to 100, and player receives an invulnerability cooldown to reposition safely.
- **Ghost Contact**:
  - Deals **immediate 1-life loss** (bypasses the HP bar).
  - Resets HP to 100 for the next life.
  - Invulnerability cooldown prevents multi-hits in the same instant.
- **Game Over**: Occurs only when all 3 lives are lost.

### 4. Zero Ghost Lasers
- Ghosts interact purely through physical spectral contact and steering.
- Absolutely no lasers, distance beams, or ranged ghost attacks.
- Bot 3 (Ghost Attractor) channels its magic to redirect the ghost's path toward the player without any laser lines.

---

## 🕹️ Controls

### Desktop Keyboard & Mouse
- **A / D (or Left / Right Arrows)**: Move Left / Right
- **Space / W**: Jump. Tap again while airborne for Double Jump (full 360° flip)
- **Shift / K**: Dash (short speed burst with cooldown bar)
- **S + Space**: Drop down through wooden bridges
- **J / F / Left Click**: Attack / Strike
- **Esc / P**: Pause / Resume

### Mobile & Tablet Touch
- Ergonomic on-screen thumb buttons (Left, Right, Jump, Dash, Strike).
- Automatically hidden on desktop and visible on touch devices.
- Non-overlapping responsive HUD.

---

## 🚀 How to Run

Open [index.html](file:///c:/Users/meet2/OneDrive/Documents/Project%20x💀/quickdash(ii)/index.html) directly in any modern browser, or serve with Python:
```bash
python -m http.server 8000
```
and visit `http://localhost:8000`.
