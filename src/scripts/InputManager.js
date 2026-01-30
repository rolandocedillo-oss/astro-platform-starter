/*
  Input Manager
  Version: 0.2.0
  Last Updated: 2026-01-28
  Changelog:
  - 0.2.0: Added documentation comments and preserved input mapping.
*/
export class InputManager {
  constructor() {
    this.keys = {};
    this.gamepadIndex = null;

    // Keyboard listeners for movement/attack actions.
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);

    // Track the first connected gamepad.
    window.addEventListener("gamepadconnected", (e) => {
      console.log("Gamepad connected:", e.gamepad.id);
      this.gamepadIndex = e.gamepad.index;
    });
  }

  getState() {
    // Add 'bomb' and 'shield' to the default state.
    const state = { x: 0, y: 0, attack: false, dash: false, bomb: false, shield: false }; 

    // 1) Keyboard input (WASD + arrows + actions).
    if (this.keys['KeyW'] || this.keys['ArrowUp']) state.y -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) state.y += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) state.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) state.x += 1;
    if (this.keys['Space']) state.attack = true;     // Sword/Bow
    if (this.keys['ShiftLeft']) state.dash = true;   // Dodge
    if (this.keys['KeyE']) state.bomb = true;        // Bomb
    if (this.keys['KeyQ']) state.shield = true;      // Shield

    // 2) Gamepad input (overwrites keyboard if used).
    const gp = this.gamepadIndex !== null ? navigator.getGamepads()[this.gamepadIndex] : null;
    if (gp) {
      // Deadzone check to prevent drift.
      if (Math.abs(gp.axes[0]) > 0.1) state.x = gp.axes[0];
      if (Math.abs(gp.axes[1]) > 0.1) state.y = gp.axes[1];
      
      // Button 0 is usually 'A' or 'X' on controllers.
      if (gp.buttons[0].pressed) state.attack = true; // Button A (Xbox) / X (PS)
      if (gp.buttons[1].pressed) state.dash = true;   // Button B (Xbox) / Circle (PS)
      if (gp.buttons[2].pressed) state.bomb = true;   // Button C (Xbox) / Square (PS)
      if (gp.buttons[3].pressed) state.shield = true; // Button D (Xbox) / Triangle (PS)
    }

    // Normalize vector to prevent faster diagonal movement.
    if (state.x !== 0 || state.y !== 0) {
      const length = Math.sqrt(state.x * state.x + state.y * state.y);
      if (length > 1) {
        state.x /= length;
        state.y /= length;
      }
    }

    return state;
  }
}
