<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Velolink Client Desktop - Copilot Instructions

This is a Node.js desktop application for communicating with Arduino via Bluetooth (HC-05) and simulating keyboard inputs based on received data scenarios.

## Project Structure
- `src/index.js` - Main application entry point
- `src/modules/bluetoothManager.js` - Handles Bluetooth/serial communication with HC-05
- `src/modules/keySimulator.js` - Manages keyboard input simulation
- `src/modules/scenarioHandler.js` - Processes Arduino data and triggers appropriate actions

## Key Dependencies
- `serialport` - For Arduino communication via HC-05 Bluetooth module
- `node-key-sender` - For keyboard input simulation
- `nodemon` - Development hot reloading

## Arduino Communication Protocol
- The application expects string commands from Arduino via HC-05
- Supported data formats:
  - Simple commands: `PLAY`, `PAUSE`, `VOL_UP`, `VOL_DOWN`, etc.
  - Button states: `BTN1:ON`, `BTN2:OFF`
  - Sensor values: `TEMP:25`, `A0:512`
  - Numeric values: `123` (triggers threshold-based actions)

## Code Guidelines
- Use async/await for all asynchronous operations
- Include proper error handling with try/catch blocks
- Add descriptive console logging with emojis for better UX
- Follow the event-driven pattern for Bluetooth communication
- Keep scenarios modular and easily configurable

## When adding new features:
- Bluetooth operations should go in `bluetoothManager.js`
- Key simulation functions should go in `keySimulator.js`
- Data processing and scenario logic should go in `scenarioHandler.js`
- Always test Arduino connectivity before implementing complex scenarios
