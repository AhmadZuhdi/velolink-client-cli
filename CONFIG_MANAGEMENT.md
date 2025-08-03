# Configuration Management System

The Velolink Client now includes a comprehensive configuration management system that automatically saves and loads settings.

## 🔧 **Features**

### **Automatic Configuration**
- ✅ **Auto-creates** `config.json` from `config.example.json` on first run
- ✅ **Live reloading** - Changes to `config.json` are automatically detected and applied
- ✅ **Settings persistence** - All changes made through the UI are automatically saved
- ✅ **Configuration validation** - Merges user settings with defaults to ensure completeness

### **Configurable Settings**

#### **🎮 Key Simulation**
- `enabled` - Enable/disable key simulation
- `gameMode` - Use robotjs for better game compatibility
- `delayBetweenKeys` - Timing between key presses (ms)

#### **📡 Bluetooth**
- `autoConnect` - Automatically connect to HC-05 on startup
- `baudRate` - Serial communication speed (9600, 19200, etc.)
- `timeout` - Connection timeout in milliseconds
- `lastConnectedPort` - Remembers last successful connection

#### **🎯 Scenarios**
- `gameMode` - Current active game mode (racing, fps, media, etc.)
- `dataProcessingEnabled` - Enable/disable Arduino command processing
- `cooldownMs` - Minimum time between scenario executions
- `enableLogging` - Log scenario activities

#### **📝 Logging**
- `level` - Log verbosity (debug, info, warn, error)
- `enableConsoleOutput` - Show logs in console
- `enableFileOutput` - Write logs to file
- `logFile` - Path to log file

## 📁 **Configuration Files**

### **config.example.json**
Template configuration with default values. Never edited by the application.

### **config.json** 
Your actual configuration file. Created automatically and updated when settings change.

**🚨 Important**: `config.json` is automatically added to `.gitignore` to prevent sharing sensitive port/device information.

## 🎯 **Using the Configuration System**

### **Through the Menu Interface**
1. Select "⚙️ Configuration settings" from the main menu
2. Choose the category you want to configure
3. Make your changes using the interactive prompts
4. Settings are automatically saved to `config.json`

### **Manual Configuration**
You can also edit `config.json` directly:

```json
{
  "bluetooth": {
    "autoConnect": true,
    "baudRate": 9600,
    "timeout": 5000,
    "lastConnectedPort": "COM3"
  },
  "keySimulation": {
    "enabled": true,
    "gameMode": true,
    "delayBetweenKeys": 10
  },
  "scenarios": {
    "gameMode": "fps",
    "dataProcessingEnabled": true,
    "cooldownMs": 100,
    "enableLogging": true
  },
  "logging": {
    "level": "info",
    "enableConsoleOutput": true,
    "enableFileOutput": false,
    "logFile": "logs/velolink.log"
  }
}
```

**💡 Tip**: The application will automatically reload and apply changes when you save the file.

## 🔄 **How Settings Are Applied**

### **On Startup**
1. Configuration manager loads default values from `config.example.json`
2. Loads user settings from `config.json` (creates if doesn't exist)
3. Merges user settings with defaults
4. Applies configuration to all components
5. Starts watching `config.json` for changes

### **During Runtime**
1. Settings changed through the menu are immediately saved
2. Manual file edits are detected within 500ms
3. Configuration is automatically reloaded and applied
4. Components receive the updated settings

### **On Exit**
1. File watching is stopped
2. Configuration manager is properly cleaned up

## 📋 **Configuration Categories**

### **🎮 Key Simulation Settings**
Configure how keyboard/mouse inputs are handled:
- Toggle key simulation on/off
- Enable game mode (robotjs vs node-key-sender)
- Set timing delays between inputs

### **📡 Bluetooth Settings**
Configure Arduino/HC-05 connection:
- Auto-connect behavior
- Communication speed (baud rate)
- Connection timeouts
- Remember last connected device

### **🎯 Scenario Settings**
Configure how Arduino commands are processed:
- Set active game mode (racing, fps, media, etc.)
- Enable/disable command processing
- Set cooldown periods
- Enable scenario logging

### **📝 Logging Settings**
Configure application logging:
- Set log verbosity level
- Enable/disable console output
- Enable/disable file logging
- Set log file location

## 🛡️ **Configuration Safety**

### **Validation**
- User settings are merged with defaults to ensure all required properties exist
- Invalid values are rejected with helpful error messages
- Settings that could break the application are validated

### **Backup & Recovery**
- `config.example.json` serves as a backup of default settings
- If `config.json` becomes corrupted, delete it and restart the app to regenerate
- Manual "Reload Config" option available in the settings menu

### **Security**
- Configuration files may contain sensitive information (port names, device IDs)
- `config.json` is automatically excluded from version control
- No passwords or sensitive credentials are stored

## 🔧 **Troubleshooting**

### **Configuration Not Loading**
```bash
❌ Failed to initialize configuration
```
**Solution**: Check that `config.example.json` exists and is valid JSON.

### **Settings Not Saving**
```bash
❌ Failed to save config
```
**Solution**: Check file permissions in the project directory.

### **Settings Not Applying**
```bash
❌ Failed to apply configuration
```
**Solution**: Check the configuration menu for specific component errors.

### **File Watching Not Working**
```bash
⚠️ Could not start file watching
```
**Solution**: This is non-critical. Manual reload still works through the settings menu.

## 💡 **Pro Tips**

1. **Game Mode Configuration**: Enable game mode in key simulation settings for better game compatibility
2. **Performance Tuning**: Adjust `cooldownMs` if Arduino commands are too rapid
3. **Debugging**: Enable logging and increase verbosity to troubleshoot issues
4. **Device Memory**: The app remembers your last connected port and auto-connects
5. **Backup Settings**: Copy your `config.json` to save your preferred settings

## 🔄 **Migration from Previous Versions**

If upgrading from a version without configuration management:
1. Your existing behavior is preserved through defaults
2. Settings you change will now be remembered
3. No manual migration required

The configuration system enhances the existing functionality without breaking changes!
