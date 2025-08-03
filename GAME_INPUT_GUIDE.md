# Game Input Compatibility Guide

## Problem
The default `node-key-sender` library works great for applications like VS Code, browsers, and standard desktop apps, but often fails with games because:

1. **Games use DirectInput/Raw Input**: Many games bypass the standard Windows input system
2. **Anti-cheat systems**: Games may detect and block programmatic inputs
3. **Input validation**: Games may ignore inputs that don't come from physical devices

## Solution
The KeySimulator now supports **dual input methods**:

### 1. node-key-sender (Default Mode)
- ✅ Perfect for: VS Code, browsers, text editors, media players
- ❌ Often fails with: Games, especially modern ones with anti-cheat

### 2. robotjs (Game Mode)
- ✅ Better compatibility with: Most games, direct system-level input
- ✅ Additional features: Mouse control, key hold/release
- ❌ Slightly higher system overhead

## How to Use

### Enable Game Mode
```javascript
const keySimulator = new KeySimulator();

// Enable game mode for better game compatibility
keySimulator.setGameMode(true);

// Or use the scenario handler which automatically enables it
scenarioHandler.setGameMode('fps'); // Automatically enables robotjs
```

### Switch Back to Default Mode
```javascript
// For standard applications
keySimulator.setGameMode(false);

// Or through scenario handler
scenarioHandler.setDefaultMode(); // Automatically disables robotjs
```

### New Game-Specific Features

#### Hold and Release Keys
```javascript
// Hold W to move forward
await keySimulator.keyDown('w');
await delay(2000); // Move for 2 seconds
await keySimulator.keyUp('w');
```

#### Mouse Control
```javascript
// Click at specific coordinates
await keySimulator.mouseClick(960, 540, 'left');
```

#### Advanced Actions
```javascript
// Use the performAction method
await keySimulator.performAction('key_down', 'shift'); // Hold shift
await keySimulator.performAction('key_up', 'shift');   // Release shift
await keySimulator.performAction('mouse_click', 100, 200, 'right');
```

## Testing Your Setup

Run the test script to verify compatibility:

```bash
npm run test-game-input
```

Or manually test:
```javascript
const keySimulator = require('./src/modules/keySimulator');
const ks = new KeySimulator();

// Test with your game
ks.setGameMode(true);
await ks.sendKey('space'); // Should work in most games
```

## Game Mode Presets

The ScenarioHandler includes pre-configured game modes:

### Racing Games
```javascript
scenarioHandler.setGameMode('racing');
// BTN1:ON -> Space (accelerate)
// BTN2:ON -> Shift (brake)
// LEFT/RIGHT -> steering
```

### FPS Games
```javascript
scenarioHandler.setGameMode('fps');
// BTN1:ON -> Space (jump)
// BTN2:ON -> Click (shoot)
// WASD movement
```

## Troubleshooting

### Game Still Not Responding?
1. **Make sure the game window is active** - Click on the game before testing
2. **Run as Administrator** - Some games require elevated privileges
3. **Check anti-cheat** - Some games block ALL programmatic input
4. **Adjust timing** - Some games need slower input timing:
   ```javascript
   await keySimulator.sendKey('w');
   await delay(100); // Add longer delays
   await keySimulator.sendKey('s');
   ```

### Verify Input Method
```javascript
console.log(keySimulator.getStatus());
// Should show: { enabled: true, gameMode: true, library: 'robotjs' }
```

### Test Both Methods
```javascript
// Test with standard method
keySimulator.setGameMode(false);
await keySimulator.sendKey('1');

// Test with game method
keySimulator.setGameMode(true);
await keySimulator.sendKey('2');
```

## Arduino Integration Examples

### Example 1: Racing Game Controller
```arduino
// Arduino code
if (digitalRead(BUTTON_1) == HIGH) {
    Serial.println("BTN1:ON");  // Accelerate
} else {
    Serial.println("BTN1:OFF");
}

int steering = analogRead(A0);
if (steering > 600) {
    Serial.println("RIGHT");    // Steer right
} else if (steering < 400) {
    Serial.println("LEFT");     // Steer left
}
```

### Example 2: FPS Game Controller
```arduino
// Arduino code
if (digitalRead(JUMP_BUTTON) == HIGH) {
    Serial.println("BTN1:ON");  // Jump
}

if (digitalRead(SHOOT_BUTTON) == HIGH) {
    Serial.println("BTN2:ON");  // Shoot
}

// Joystick for movement
int x = analogRead(JOY_X);
int y = analogRead(JOY_Y);

if (x > 600) Serial.println("RIGHT");
if (x < 400) Serial.println("LEFT");
if (y > 600) Serial.println("UP");
if (y < 400) Serial.println("DOWN");
```

## Tips for Success

1. **Start with simple games** - Test with offline single-player games first
2. **Use the test script** - Always verify your setup before connecting Arduino
3. **Monitor console output** - Check which input method is being used
4. **Adjust for your game** - Different games may need different key mappings
5. **Consider timing** - Some games are sensitive to input timing

## Common Game Compatibility

### ✅ Usually Works
- Indie games
- Older games (pre-2015)
- Single-player games
- Browser games
- Emulated games

### ⚠️ May Work with Game Mode
- Steam games (some)
- Unity/Unreal games
- Racing simulators
- Strategy games

### ❌ Likely Blocked
- Competitive online games (Valorant, CS:GO, League of Legends)
- Games with strong anti-cheat (BattlEye, EasyAntiCheat)
- Some AAA multiplayer games

Remember: Always respect game Terms of Service and only use automation for personal, offline gaming experiences!
