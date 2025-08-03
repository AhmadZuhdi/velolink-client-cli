# Velolink Client Desktop

A Node.js desktop application that connects to Arduino via Bluetooth (HC-05) and simulates keyboard inputs based on received data scenarios.

## 🚀 Features

- **Bluetooth Communication**: Connect to Arduino HC-05 module automatically
- **Key Simulation**: Simulate keyboard inputs, key combinations, and text typing
- **Scenario Handling**: Process Arduino data and trigger appropriate keyboard actions
- **Real-time Monitoring**: Live connection status and data logging
- **Extensible Architecture**: Easy to add new scenarios and key mappings

## 📋 Requirements

- Node.js (v14 or higher)
- Windows/macOS/Linux
- Arduino with HC-05 Bluetooth module
- Paired HC-05 module with your computer

## 🔧 Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

## 🎮 Usage

### Start the Application
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### Arduino Setup
Your Arduino should send string commands via HC-05. Example Arduino code:

```cpp
void setup() {
  Serial.begin(9600); // HC-05 default baud rate
}

void loop() {
  // Send different commands based on your sensors/buttons
  Serial.println("PLAY");     // Play/Pause media
  delay(1000);
  
  Serial.println("VOL_UP");   // Volume up
  delay(1000);
  
  Serial.println("BTN1:ON");  // Button press
  delay(1000);
}
```

## 📡 Supported Commands

### Media Controls
- `PLAY` / `PAUSE` - Play/pause media
- `NEXT` - Next track
- `PREV` - Previous track
- `VOL_UP` - Volume up
- `VOL_DOWN` - Volume down
- `MUTE` - Toggle mute

### Navigation
- `UP`, `DOWN`, `LEFT`, `RIGHT` - Arrow keys
- `SPACE` - Space bar
- `ENTER` - Enter key
- `TAB` - Tab key
- `ALT_TAB` - Alt+Tab combination

### Function Keys
- `F1` to `F5` - Function keys

### Sensor Patterns
- `BTN1:ON` / `BTN1:OFF` - Button states
- `TEMP:25` - Temperature value
- `A0:512` - Analog sensor reading
- `123` - Numeric values (threshold-based actions)

### Special Actions
- `HELLO` - Types "Hello from Arduino!"
- `SCREENSHOT` - Takes a screenshot (Win+Shift+S)

## 🔧 Configuration

### Adding Custom Scenarios
Edit `src/modules/scenarioHandler.js` to add new scenarios:

```javascript
// Add in setupDefaultScenarios() method
this.addScenario('CUSTOM_CMD', () => this.keySimulator.performAction('space'));
```

### Custom Key Actions
Edit `src/modules/keySimulator.js` to add new key actions:

```javascript
// Add in performAction() method
case 'custom_action':
    return await this.sendCombination(['ctrl', 'shift', 'n']);
```

## 🏗️ Project Structure

```
src/
├── index.js                    # Main application entry point
└── modules/
    ├── bluetoothManager.js     # Bluetooth/Serial communication
    ├── keySimulator.js         # Keyboard input simulation
    └── scenarioHandler.js      # Data processing and scenarios
```

## 🐛 Troubleshooting

### Can't Connect to HC-05
1. Ensure HC-05 is paired with your computer
2. Check if the HC-05 appears in Device Manager (Windows) or System Preferences (macOS)
3. Try manually specifying the COM port in the code
4. Verify baud rate (default: 9600)

### Key Simulation Not Working
1. Run the application as administrator (Windows)
2. Check if antivirus is blocking the application
3. Ensure `node-key-sender` installed correctly

### No Serial Ports Found
1. Install appropriate drivers for your Bluetooth adapter
2. Restart the application
3. Check system's Bluetooth settings

## 🔒 Security Note

This application simulates keyboard inputs, which some antivirus software may flag as suspicious. Add the application to your antivirus whitelist if needed.

## 📝 Development

### Available Scripts
- `npm start` - Run the application
- `npm run dev` - Run with auto-reload (nodemon)
- `npm test` - Run tests (not implemented yet)

### Adding New Features
1. Bluetooth operations → `bluetoothManager.js`
2. Key simulation → `keySimulator.js`
3. Data processing → `scenarioHandler.js`

## 📄 License

ISC License

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
