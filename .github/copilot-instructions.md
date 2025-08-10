<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Velolink Client Desktop - Copilot Instructions

This is a Node.js desktop application for communicating with Arduino via Bluetooth (HC-05) and simulating keyboard inputs based on received data scenarios.
## Key Dependencies
- `serialport` - For Arduino communication via HC-05 Bluetooth module
- `node-key-sender` - For keyboard input simulation
- `nodemon` - Development hot reloading

## Arduino Communication Protocol
- The application expects string commands from Arduino via HC-05

## Code Guidelines
- Use async/await for all asynchronous operations
- Include proper error handling with try/catch blocks
- Keep scenarios modular and easily configurable