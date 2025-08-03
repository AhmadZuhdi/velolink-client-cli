# Quick Start Feature

The Velolink Client now includes a **Quick Start** option that automatically connects to your last used device and applies your previous settings.

## 🚀 **What is Quick Start?**

Quick Start is a one-click solution that:
- ✅ **Connects** to your last connected port (e.g., COM7)
- ✅ **Restores** your last game mode (e.g., Racing Game)
- ✅ **Applies** your saved key simulation settings
- ✅ **Enables** data processing if it was previously enabled

## 📋 **How to Use Quick Start**

### **When Quick Start Appears**
The Quick Start option appears at the top of the main menu when:
1. You have previously connected to a device
2. You have saved configuration settings

**Example menu display:**
```
🚀 Quick Start (COM7 + Racing Game)
📋 List available ports
🔌 Connect to port manually
...
```

### **Using Quick Start**
1. **Start the application**: `npm start`
2. **Select Quick Start**: Choose the first option that shows your last port and game mode
3. **Wait for connection**: The app will automatically:
   - Connect to your last port
   - Set your last game mode
   - Apply your key simulation settings
   - Enable data processing (if previously enabled)
4. **Start using**: Send commands from your Arduino!

## ⚙️ **What Gets Restored**

### **Connection Settings**
- **Port**: Last successfully connected port (e.g., COM7, /dev/ttyUSB0)
- **Baud Rate**: Your configured communication speed
- **Timeout**: Connection timeout settings

### **Game Mode**
- **Last Mode**: Your previously selected game mode (racing, fps, media, etc.)
- **Key Mappings**: All scenario mappings for that game mode
- **Input Method**: robotjs vs node-key-sender preference

### **Processing Settings**
- **Data Processing**: Enabled/disabled state from last session
- **Key Simulation**: Game mode on/off preference
- **Timing**: Cooldown and delay settings

## 🔧 **Configuration Behind Quick Start**

Quick Start reads from your `config.json` file:

```json
{
  "bluetooth": {
    "lastConnectedPort": "COM7",
    "baudRate": 9600,
    "timeout": 5000
  },
  "scenarios": {
    "gameMode": "racing",
    "dataProcessingEnabled": true
  },
  "keySimulation": {
    "gameMode": true,
    "enabled": true
  }
}
```

## 🛠️ **Troubleshooting Quick Start**

### **Quick Start Option Missing**
**Problem**: Quick Start doesn't appear in the menu
**Solution**: 
- Connect to a device manually first
- Check that `config.json` has `lastConnectedPort`

### **Connection Failed**
**Problem**: Quick Start says "Failed to connect to COM7"
**Solutions**:
- Check that your Arduino/HC-05 is powered on
- Verify the device is still on the same port
- Try manual connection to see available ports
- Device might be on a different port now

### **Wrong Game Mode**
**Problem**: Quick Start loads the wrong game mode
**Solution**: 
- Use "🎮 Change game mode" to set your preferred mode
- The new mode will be saved for next Quick Start

### **Data Processing Issues**
**Problem**: Arduino commands not working after Quick Start
**Solutions**:
- Check if data processing is enabled (shown in Quick Start output)
- Use "⏸️ Enable data processing" if needed
- Verify your Arduino is sending the expected commands

## 💡 **Pro Tips**

### **First-Time Setup**
1. **Manual Connection**: Connect manually the first time to establish port
2. **Configure Mode**: Set your preferred game mode
3. **Test Commands**: Verify Arduino commands work
4. **Enable Processing**: Turn on data processing
5. **Use Quick Start**: Next time, use Quick Start for instant setup

### **Multiple Devices**
- Quick Start remembers the **last** connected device
- If you switch between different Arduino setups, you might need manual connection
- Consider using different configurations for different projects

### **Development Workflow**
- **Development**: Keep data processing disabled during Arduino code development
- **Testing**: Use Quick Start with data processing enabled for quick testing
- **Gaming**: Quick Start is perfect for gaming sessions

## 🔄 **How Quick Start Updates**

### **Automatic Updates**
Every time you:
- Connect to a new port → `lastConnectedPort` updates
- Change game mode → `gameMode` updates  
- Toggle data processing → `dataProcessingEnabled` updates
- Modify key simulation → `keySimulation.gameMode` updates

### **Manual Reset**
To reset Quick Start preferences:
1. Delete or edit `config.json`
2. Or use "🔄 Reload Config" in Configuration settings
3. Or connect to a different device manually

## 📊 **Quick Start Output Example**

```
🚀 QUICK START MODE
===================
📡 Connecting to last port: COM7
🎮 Setting game mode: racing
✅ Successfully connected to COM7
✅ Game mode restored: Racing Game
✅ Data processing enabled (from config)
🎮 Game mode enabled for key simulation

🎯 Quick Start Complete!
========================
✅ Connected to device
✅ Game mode restored  
✅ Settings applied

📡 Ready to receive Arduino commands!
💡 Tip: Send commands from your Arduino to test the setup

💡 Example Arduino Commands:
============================
BTN1:ON     -> Accelerate
BTN2:ON     -> Brake
LEFT/RIGHT  -> Steer
RPM:5000,4800 -> Gear control
============================
```

Quick Start makes it easy to jump right back into your project without reconfiguring everything each time! 🚀
