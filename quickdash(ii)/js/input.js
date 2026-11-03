/**
 * InputManager - Unified, Platform-Independent Input System
 * Decouples game logic from hardware events (Keyboard, Mouse, Touch, Gamepad).
 * Supports remapping, touch buttons, and gamepads.
 */
class InputManager {
  constructor() {
    // Canonical actions state
    this.actions = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,       // pressed continuously
      jumpJustPressed: false, // triggered once per press
      dash: false,
      dashJustPressed: false,
      attack: false,
      attackJustPressed: false,
    };

    // Keyboard bindings map (Action -> array of code keys)
    this.keyBindings = {
      left: ['KeyA', 'ArrowLeft'],
      right: ['KeyD', 'ArrowRight'],
      up: ['KeyW', 'ArrowUp'],
      down: ['KeyS', 'ArrowDown'],
      jump: ['Space', 'KeyW', 'ArrowUp'],
      dash: ['ShiftLeft', 'ShiftRight', 'KeyK', 'KeyJ', 'KeyF', 'KeyZ'],
      attack: ['KeyJ', 'KeyF', 'KeyZ'],
    };

    // Raw key states
    this.keysDown = new Set();
    this.keysJustPressed = new Set();

    // Mobile Virtual Touch Controls state
    this.touchControlsActive = false;
    this.touchStates = {
      left: false,
      right: false,
      jump: false,
      dash: false,
      attack: false
    };

    // Gamepad state
    this.gamepadConnected = false;
    this.prevGamepadButtons = [];

    // Pointer / Mouse state for attacks or UI
    this.mouse = {
      x: 0,
      y: 0,
      down: false,
      clicked: false
    };

    this.setupKeyboardListeners();
    this.setupMouseListeners();
    this.setupGamepadListeners();
    this.detectTouchDevice();
  }

  detectTouchDevice() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.touchControlsActive = isTouch;
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling on space/arrows during game
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keysDown.has(e.code)) {
        this.keysJustPressed.add(e.code);
      }
      this.keysDown.add(e.code);

    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keysDown.clear();
      this.keysJustPressed.clear();
      this.resetActions();
    });
  }

  setupMouseListeners() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.down = true;
        this.mouse.clicked = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.down = false;
      }
    });
  }

  setupGamepadListeners() {
    window.addEventListener('gamepadconnected', () => {
      this.gamepadConnected = true;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadConnected = false;
    });
  }

  // Mobile Touch API for UI overlay
  setTouchAction(action, isPressed) {
    if (this.touchStates.hasOwnProperty(action)) {
      if (isPressed && !this.touchStates[action]) {
        if (action === 'jump') this.actions.jumpJustPressed = true;
        if (action === 'dash') this.actions.dashJustPressed = true;
        if (action === 'attack') this.actions.attackJustPressed = true;
      }
      this.touchStates[action] = isPressed;
    }
  }



  // Remap helper
  remapKey(action, oldKey, newKey) {
    if (!this.keyBindings[action]) return false;
    const idx = this.keyBindings[action].indexOf(oldKey);
    if (idx !== -1) {
      this.keyBindings[action][idx] = newKey;
    } else {
      this.keyBindings[action].push(newKey);
    }
    return true;
  }

  // Poll input once per frame before game update
  update() {
    // 1. Check Keyboard
    const isActionDown = (action) => {
      const keys = this.keyBindings[action] || [];
      return keys.some(k => this.keysDown.has(k));
    };

    const isActionJustPressed = (action) => {
      const keys = this.keyBindings[action] || [];
      return keys.some(k => this.keysJustPressed.has(k));
    };

    let left = isActionDown('left') || this.touchStates.left;
    let right = isActionDown('right') || this.touchStates.right;
    let up = isActionDown('up');
    let down = isActionDown('down');
    let jump = isActionDown('jump') || this.touchStates.jump;
    let dash = isActionDown('dash') || this.touchStates.dash;
    let attack = isActionDown('attack') || this.touchStates.attack;

    let jumpJustPressed = isActionJustPressed('jump') || this.actions.jumpJustPressed;
    let dashJustPressed = isActionJustPressed('dash') || this.actions.dashJustPressed;
    let attackJustPressed = isActionJustPressed('attack') || this.actions.attackJustPressed || this.mouse.clicked;

    // 2. Poll Gamepad if available
    if (navigator.getGamepads) {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (gp && gp.connected) {
        // Left stick & D-pad
        const axisX = gp.axes[0];
        const axisY = gp.axes[1];
        if (axisX < -0.3 || (gp.buttons[14] && gp.buttons[14].pressed)) left = true;
        if (axisX > 0.3 || (gp.buttons[15] && gp.buttons[15].pressed)) right = true;
        if (axisY < -0.4 || (gp.buttons[12] && gp.buttons[12].pressed)) up = true;
        if (axisY > 0.4 || (gp.buttons[13] && gp.buttons[13].pressed)) down = true;

        // Button A (0) = Jump
        if (gp.buttons[0] && gp.buttons[0].pressed) {
          jump = true;
          if (!this.prevGamepadButtons[0]) jumpJustPressed = true;
        }

        // Button X (2) or B (1) = Dash
        if ((gp.buttons[1] && gp.buttons[1].pressed) || (gp.buttons[2] && gp.buttons[2].pressed)) {
          dash = true;
          if (!this.prevGamepadButtons[1] && !this.prevGamepadButtons[2]) dashJustPressed = true;
        }

        // Button Y (3) or Trigger (7) = Attack
        if ((gp.buttons[3] && gp.buttons[3].pressed) || (gp.buttons[7] && gp.buttons[7].pressed)) {
          attack = true;
          if (!this.prevGamepadButtons[3] && !this.prevGamepadButtons[7]) attackJustPressed = true;
        }


        // Cache button states
        this.prevGamepadButtons = gp.buttons.map(b => b.pressed);
      }
    }

    // Assign to canonical action state
    this.actions.left = left;
    this.actions.right = right;
    this.actions.up = up;
    this.actions.down = down;
    this.actions.jump = jump;
    this.actions.jumpJustPressed = jumpJustPressed;
    this.actions.dash = dash;
    this.actions.dashJustPressed = dashJustPressed;
    this.actions.attack = attack;
    this.actions.attackJustPressed = attackJustPressed;
  }

  // Clear single-frame triggers after game loop tick
  postUpdate() {
    this.keysJustPressed.clear();
    this.actions.jumpJustPressed = false;
    this.actions.dashJustPressed = false;
    this.actions.attackJustPressed = false;
    this.mouse.clicked = false;
  }

  resetActions() {
    for (const key in this.actions) {
      this.actions[key] = false;
    }
    for (const key in this.touchStates) {
      this.touchStates[key] = false;
    }
  }
}

window.inputManager = new InputManager();
