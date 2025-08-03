const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const EventEmitter = require('events');

class ConfigManager extends EventEmitter {
    constructor(configPath = 'config.json', examplePath = 'config.example.json') {
        super();
        this.configPath = path.resolve(configPath);
        this.examplePath = path.resolve(examplePath);
        this.config = {};
        this.defaultConfig = {};
        this.isWatching = false;
        this.watcher = null;
        
        console.log('⚙️  Config Manager initialized');
        console.log(`📁 Config file: ${this.configPath}`);
        console.log(`📋 Example file: ${this.examplePath}`);
    }

    async initialize() {
        try {
            // Load default config from example
            await this.loadDefaultConfig();
            
            // Load or create user config
            await this.loadConfig();
            
            // Start watching for changes
            this.startWatching();
            
            console.log('✅ Configuration system initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize configuration:', error.message);
            return false;
        }
    }

    async loadDefaultConfig() {
        try {
            if (fsSync.existsSync(this.examplePath)) {
                const data = await fs.readFile(this.examplePath, 'utf8');
                this.defaultConfig = JSON.parse(data);
                console.log('📋 Default configuration loaded from example file');
            } else {
                // Fallback default config if example doesn't exist
                this.defaultConfig = this.getBuiltInDefaults();
                console.log('⚠️  Example config not found, using built-in defaults');
            }
        } catch (error) {
            console.error('❌ Failed to load default config:', error.message);
            this.defaultConfig = this.getBuiltInDefaults();
        }
    }

    async loadConfig() {
        try {
            if (fsSync.existsSync(this.configPath)) {
                const data = await fs.readFile(this.configPath, 'utf8');
                const userConfig = JSON.parse(data);
                
                // Merge with defaults to ensure all properties exist
                this.config = this.mergeConfigs(this.defaultConfig, userConfig);
                console.log('📁 User configuration loaded successfully');
                console.log(`🔧 Config contains: ${Object.keys(this.config).join(', ')}`);
            } else {
                // Create config from defaults
                console.log('📝 No existing config found, creating from defaults...');
                this.config = { ...this.defaultConfig };
                await this.saveConfig();
            }
            
            this.emit('loaded', this.config);
        } catch (error) {
            console.error('❌ Failed to load config:', error.message);
            this.config = { ...this.defaultConfig };
            this.emit('error', error);
        }
    }

    async saveConfig() {
        try {
            const configData = JSON.stringify(this.config, null, 2);
            await fs.writeFile(this.configPath, configData, 'utf8');
            console.log('💾 Configuration saved successfully');
            this.emit('saved', this.config);
            return true;
        } catch (error) {
            console.error('❌ Failed to save config:', error.message);
            this.emit('error', error);
            return false;
        }
    }

    startWatching() {
        if (this.isWatching) {
            return;
        }

        try {
            this.watcher = fsSync.watch(this.configPath, { persistent: false }, (eventType, filename) => {
                if (eventType === 'change' && filename) {
                    console.log('👀 Config file changed, reloading...');
                    this.debounceReload();
                }
            });
            
            this.isWatching = true;
            console.log('👀 Started watching config file for changes');
        } catch (error) {
            console.warn('⚠️  Could not start file watching:', error.message);
        }
    }

    stopWatching() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
            this.isWatching = false;
            console.log('🛑 Stopped watching config file');
        }
    }

    debounceReload() {
        // Debounce rapid file changes
        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
        }
        
        this.reloadTimeout = setTimeout(async () => {
            try {
                const oldConfig = { ...this.config };
                await this.loadConfig();
                
                // Check what changed
                const changes = this.getConfigChanges(oldConfig, this.config);
                if (changes.length > 0) {
                    console.log('🔄 Configuration changes detected:');
                    changes.forEach(change => {
                        console.log(`  • ${change.path}: ${change.oldValue} → ${change.newValue}`);
                    });
                    this.emit('changed', this.config, changes);
                }
            } catch (error) {
                console.error('❌ Failed to reload config:', error.message);
            }
        }, 500); // Wait 500ms for file operations to complete
    }

    // Configuration getters and setters
    get(path, defaultValue = undefined) {
        return this.getNestedValue(this.config, path, defaultValue);
    }

    set(path, value) {
        this.setNestedValue(this.config, path, value);
        return this.saveConfig();
    }

    async update(updates) {
        const oldConfig = { ...this.config };
        
        // Apply updates
        Object.keys(updates).forEach(key => {
            if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
                this.config[key] = { ...this.config[key], ...updates[key] };
            } else {
                this.config[key] = updates[key];
            }
        });

        const success = await this.saveConfig();
        if (success) {
            const changes = this.getConfigChanges(oldConfig, this.config);
            this.emit('changed', this.config, changes);
        }
        return success;
    }

    // Utility methods
    getNestedValue(obj, path, defaultValue) {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }

    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    mergeConfigs(defaultConfig, userConfig) {
        const merged = { ...defaultConfig };
        
        Object.keys(userConfig).forEach(key => {
            if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key]) && userConfig[key] !== null) {
                merged[key] = { ...defaultConfig[key], ...userConfig[key] };
            } else {
                merged[key] = userConfig[key];
            }
        });
        
        return merged;
    }

    getConfigChanges(oldConfig, newConfig) {
        const changes = [];
        
        const compareObjects = (old, current, path = '') => {
            const allKeys = new Set([...Object.keys(old || {}), ...Object.keys(current || {})]);
            
            allKeys.forEach(key => {
                const currentPath = path ? `${path}.${key}` : key;
                const oldValue = old?.[key];
                const newValue = current?.[key];
                
                if (typeof oldValue === 'object' && typeof newValue === 'object' && 
                    !Array.isArray(oldValue) && !Array.isArray(newValue) &&
                    oldValue !== null && newValue !== null) {
                    compareObjects(oldValue, newValue, currentPath);
                } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                    changes.push({
                        path: currentPath,
                        oldValue: JSON.stringify(oldValue),
                        newValue: JSON.stringify(newValue)
                    });
                }
            });
        };
        
        compareObjects(oldConfig, newConfig);
        return changes;
    }

    getBuiltInDefaults() {
        return {
            bluetooth: {
                autoConnect: true,
                baudRate: 9600,
                timeout: 5000,
                preferredPorts: ["COM", "tty.HC-05", "/dev/rfcomm"]
            },
            keySimulation: {
                enabled: true,
                gameMode: false,
                delayBetweenKeys: 10,
                enabledActions: [
                    "media_controls",
                    "volume_controls", 
                    "navigation",
                    "function_keys",
                    "text_input"
                ]
            },
            scenarios: {
                enableLogging: true,
                cooldownMs: 100,
                gameMode: "default",
                dataProcessingEnabled: false,
                customMappings: {}
            },
            logging: {
                level: "info",
                enableConsoleOutput: true,
                enableFileOutput: false,
                logFile: "logs/velolink.log"
            }
        };
    }

    // Public API methods
    getConfig() {
        return { ...this.config };
    }

    getBluetoothConfig() {
        return this.get('bluetooth', {});
    }

    getKeySimulationConfig() {
        return this.get('keySimulation', {});
    }

    getScenariosConfig() {
        return this.get('scenarios', {});
    }

    getLoggingConfig() {
        return this.get('logging', {});
    }

    async setBluetoothConfig(config) {
        return this.update({ bluetooth: config });
    }

    async setKeySimulationConfig(config) {
        return this.update({ keySimulation: config });
    }

    async setScenariosConfig(config) {
        return this.update({ scenarios: config });
    }

    async setGameMode(mode) {
        return this.set('scenarios.gameMode', mode);
    }

    async setDataProcessingEnabled(enabled) {
        return this.set('scenarios.dataProcessingEnabled', enabled);
    }

    async setKeySimulationGameMode(enabled) {
        return this.set('keySimulation.gameMode', enabled);
    }

    // Cleanup
    destroy() {
        this.stopWatching();
        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
        }
        console.log('🧹 Config Manager destroyed');
    }
}

module.exports = ConfigManager;
