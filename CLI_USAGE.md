# Velolink CLI Usage

## Quick Start

Run the CLI application to scan and connect to serial ports:

```bash
npm run cli
```

## What it does

1. **Scans for available serial ports** - Lists all detected serial ports on your system
2. **Interactive port selection** - Use arrow keys to select the port you want to connect to
3. **Configurable baud rate** - Option to use custom baud rate (default: 9600)
4. **Real-time data display** - Shows incoming data with timestamps
5. **Graceful exit** - Press Ctrl+C to close the connection safely

## Example Output

```
🔌 Velolink Serial Port CLI
===========================

🔍 Scanning for available serial ports...
✅ Found 3 serial port(s)

? Select a serial port to connect: (Use arrow keys)
❯ COM3 (Arduino Uno) - Arduino LLC
  COM4 (USB Serial Port) - FTDI
  COM7 (Bluetooth Serial Port)

📍 Selected port: COM3

? Do you want to use a custom baud rate? (default: 9600) (y/N)

Connecting to COM3 at 9600 baud...
✅ Port opened successfully!
📡 Listening for data... (Press Ctrl+C to exit)

[14:30:25] Received: Hello from Arduino!
[14:30:26] Received: Sensor reading: 123
[14:30:27] Received: Temperature: 25.4°C
```

## Features

- ✅ Cross-platform support (Windows, macOS, Linux)
- ✅ Auto-detection of serial ports
- ✅ Interactive port selection with descriptions
- ✅ Configurable baud rates
- ✅ Real-time data monitoring
- ✅ Clean exit handling
- ✅ Error handling and recovery

## Arduino Integration

This CLI works perfectly with the Arduino HC-05 Bluetooth module setup. Simply:

1. Connect your HC-05 to your computer via USB or pair via Bluetooth
2. Run the CLI: `npm run cli`
3. Select the HC-05 port (usually shows as "Bluetooth Serial Port")
4. Start receiving data from your Arduino!

## Troubleshooting

- **No ports found**: Check your Arduino/HC-05 connection
- **Permission denied**: On Linux/macOS, you might need to add your user to the `dialout` group
- **Port busy**: Make sure no other applications are using the serial port
