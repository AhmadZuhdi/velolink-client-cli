const BluetoothManager = require('./modules/bluetoothManager');
const KeySimulator = require('./modules/keySimulator');
const ScenarioHandler = require('./modules/scenarioHandler');
const ConfigManager = require('./modules/configManager');
const PortTester = require('./utils/portTester');
const { select, confirm, input } = require('@inquirer/prompts');

class VelolinkClient {
    constructor() {
        this.configManager = new ConfigManager();
        this.bluetoothManager = new BluetoothManager();
        this.keySimulator = new KeySimulator();
        this.scenarioHandler = new ScenarioHandler(this.keySimulator);
        this.portTester = new PortTester();
        
        this.isConnected = false;
        this.port = null;
    }

    async initialize() {
        console.log('🚀 Initializing Velolink Client...');
        
        try {
            // Initialize configuration manager first
            const configInitialized = await this.configManager.initialize();
            if (!configInitialized) {
                console.warn('⚠️  Configuration system failed to initialize, using defaults');
            }
            
            // Apply configuration to components
            await this.applyConfiguration();
            
            // Set up event handlers
            this.setupEventHandlers();
            
            // Set up config change handlers
            this.setupConfigHandlers();
            
            console.log('✅ Velolink Client initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize:', error.message);
        }
    }

    async selectPortManually() {
        try {
            const ports = await this.bluetoothManager.selectPortInteractive();
            
            if (!ports || ports.length === 0) {
                console.log('❌ No ports available');
                return false;
            }

            // For programmatic selection, you can use connectByIndex
            // Example: await this.bluetoothManager.connectByIndex(0);
            
            // Or use the interactive prompt
            await this.bluetoothManager.connectWithPrompt();
            return true;
            
        } catch (error) {
            console.error('❌ Manual port selection failed:', error.message);
            return false;
        }
    }

    setupEventHandlers() {
        // Handle incoming data from Arduino
        this.bluetoothManager.on('data', (data) => {
            this.scenarioHandler.processData(data);
        });

        // Handle connection events
        this.bluetoothManager.on('connected', async (portPath) => {
            this.isConnected = true;
            console.log('🔗 Connected to HC-05 at:', portPath);
            
            // Save last connected port to config
            await this.configManager.set('bluetooth.lastConnectedPort', portPath);
            
            // Show game mode selection after connection
            setTimeout(async () => {
                // Then show data processing control
                setTimeout(async () => {
                    await this.showDataProcessingPrompt();
                }, 1000);
            }, 1000);
        });

        this.bluetoothManager.on('disconnected', () => {
            this.isConnected = false;
            console.log('🔌 Disconnected from HC-05');
        });

        this.bluetoothManager.on('error', (error) => {
            console.error('❌ Bluetooth error:', error.message);
        });
    }

    setupConfigHandlers() {
        // Handle configuration changes
        this.configManager.on('changed', async (config, changes) => {
            console.log('⚙️  Configuration updated, applying changes...');
            await this.applyConfiguration();
        });

        this.configManager.on('error', (error) => {
            console.error('❌ Configuration error:', error.message);
        });
    }

    async applyConfiguration() {
        try {
            const config = this.configManager.getConfig();
            
            // Apply key simulation settings
            const keySimConfig = config.keySimulation || {};
            if (keySimConfig.gameMode !== undefined) {
                this.keySimulator.setGameMode(keySimConfig.gameMode);
            }
            if (keySimConfig.enabled !== undefined && !keySimConfig.enabled) {
                this.keySimulator.disable();
            } else {
                this.keySimulator.enable();
            }
            
            // Apply scenario settings
            const scenarioConfig = config.scenarios || {};
            if (scenarioConfig.gameMode && scenarioConfig.gameMode !== 'default') {
                this.scenarioHandler.setGameMode(scenarioConfig.gameMode);
            }
            if (scenarioConfig.dataProcessingEnabled !== undefined) {
                if (scenarioConfig.dataProcessingEnabled) {
                    this.scenarioHandler.enableDataProcessing();
                } else {
                    this.scenarioHandler.disableDataProcessing();
                }
            }
            
            // Apply bluetooth settings would go here if needed
            // const bluetoothConfig = config.bluetooth || {};
            
            console.log('✅ Configuration applied successfully');
        } catch (error) {
            console.error('❌ Failed to apply configuration:', error.message);
        }
    }

    async showMainMenu() {
        let running = true;
        
        while (running) {
            try {
                const processingStatus = this.scenarioHandler.getDataProcessingStatus();
                const statusIcon = processingStatus.enabled ? '✅' : '⏸️';
                
                // Get last connection info for quick start option
                const config = this.configManager.getConfig();
                const lastPort = config.bluetooth?.lastConnectedPort;
                const lastGameMode = config.scenarios?.gameMode || 'default';
                
                const choices = [];
                
                // Add quick start option if we have previous connection info
                if (lastPort && lastGameMode) {
                    const gameModeDisplay = lastGameMode === 'default' ? 'Default' : 
                        this.scenarioHandler.gameModes.get(lastGameMode)?.name || lastGameMode;
                    choices.push({
                        name: `🚀 Quick Start (${lastPort} + ${gameModeDisplay})`,
                        value: 'quick_start'
                    });
                }
                
                choices.push(
                    { name: '📋 List available ports', value: 'list_ports' },
                    { name: '🔌 Connect to port manually', value: 'connect_manual' },
                    { name: '🎮 Change game mode', value: 'game_mode' },
                    { name: `${statusIcon} ${processingStatus.enabled ? ' Disable' : ' Enable'} data processing`, value: 'toggle_processing' },
                    { name: '⚙️  Configuration settings', value: 'config_menu' },
                    { name: '📊 Show connection status', value: 'status' },
                    { name: '🔌 Disconnect', value: 'disconnect' },
                    { name: '❌ Exit', value: 'exit' }
                );

                if (processingStatus.pendingDataCount > 0) {
                    console.log(`\n📥 ${processingStatus.pendingDataCount} commands waiting to be processed`);
                }

                const choice = await select({
                    message: '🎯 Velolink Client - Choose an action:',
                    choices: choices,
                    pageSize: 12
                });

                await this.handleMenuChoice(choice);

                running = false;

            } catch (error) {
                if (error.name === 'ExitPromptError') {
                    console.log('\n👋 Goodbye!');
                    this.configManager.destroy();
                    await this.bluetoothManager.disconnect();
                    process.exit(0);
                } else {
                    console.error('❌ Menu error:', error.message);
                }
            }
        }
    }

    async handleMenuChoice(choice) {
        switch (choice) {
            case 'quick_start':
                await this.quickStart();
                break;
            case 'list_ports':
                await this.bluetoothManager.listPorts();
                await this.showMainMenu();
                break;
            case 'connect_manual':
                await this.selectPortManually();
                break;
            case 'auto_connect':
                await this.bluetoothManager.autoConnect();
                break;
            case 'test_ports':
                await this.portTester.testAllPorts();
                await this.showMainMenu();
                break;
            case 'game_mode':
                await this.showGameModeSelection();
                await this.showMainMenu();
                break;
            case 'toggle_processing':
                this.toggleDataProcessing();
                await this.showMainMenu();
                break;
            case 'config_menu':
                await this.showConfigMenu();
                await this.showMainMenu();
                break;
            case 'show_pending':
                this.showPendingData();
                await this.showMainMenu();
                break;
            case 'clear_pending':
                this.clearPendingData();
                await this.showMainMenu();
                break;
            case 'test_data':
                await this.sendTestData();
                await this.showMainMenu();
                break;
            case 'status':
                this.showConnectionStatus();
                await this.showMainMenu();
                break;
            case 'disconnect':
                await this.bluetoothManager.disconnect();
                break;
            case 'exit':
                console.log('👋 Goodbye!');
                this.configManager.destroy();
                await this.bluetoothManager.disconnect();
                process.exit(0);
                break;
            default:
                console.log('❌ Unknown choice');
        }
    }

    async quickStart() {
        try {
            console.log('\n🚀 QUICK START MODE');
            console.log('===================');
            
            const config = this.configManager.getConfig();
            const lastPort = config.bluetooth?.lastConnectedPort;
            const lastGameMode = config.scenarios?.gameMode || 'default';
            
            if (!lastPort) {
                console.log('❌ No previous connection found. Use manual connection first.');
                return;
            }
            
            console.log(`📡 Connecting to last port: ${lastPort}`);
            console.log(`🎮 Setting game mode: ${lastGameMode}`);
            
            // Step 1: Connect to the last port
            const baudRate = config.bluetooth?.baudRate || 9600;
            
            try {
                await this.bluetoothManager.connect(lastPort, baudRate);
                
                // Wait a moment for connection to establish
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (!this.isConnected) {
                    console.log(`❌ Failed to connect to ${lastPort}`);
                    console.log('💡 Device might not be available or port changed');
                    console.log('💡 Try manual connection or check device');
                    return;
                }
                
                console.log(`✅ Successfully connected to ${lastPort}`);
                
            } catch (error) {
                console.log(`❌ Connection failed: ${error.message}`);
                console.log('💡 Try manual connection instead');
                return;
            }
            
            // Step 2: Set the last game mode
            if (lastGameMode !== 'default') {
                const gameModeSet = this.scenarioHandler.setGameMode(lastGameMode);
                if (gameModeSet) {
                    const currentMode = this.scenarioHandler.getCurrentGameMode();
                    console.log(`✅ Game mode restored: ${currentMode.name}`);
                } else {
                    console.log(`⚠️  Game mode '${lastGameMode}' not found, using default`);
                }
            }
            
            // Step 3: Enable data processing based on config
            const dataProcessingEnabled = config.scenarios?.dataProcessingEnabled;
            if (dataProcessingEnabled) {
                this.scenarioHandler.enableDataProcessing();
                console.log('✅ Data processing enabled (from config)');
            } else {
                console.log('⏸️  Data processing disabled (from config)');
                console.log('💡 Use menu to enable data processing if needed');
            }
            
            // Step 4: Apply key simulation settings
            const keySimConfig = config.keySimulation;
            if (keySimConfig?.gameMode) {
                this.keySimulator.setGameMode(true);
                console.log('🎮 Game mode enabled for key simulation');
            }
            
            console.log('\n🎯 Quick Start Complete!');
            console.log('========================');
            console.log('✅ Connected to device');
            console.log('✅ Game mode restored');
            console.log('✅ Settings applied');
            console.log('\n📡 Ready to receive Arduino commands!');
            console.log('💡 Tip: Send commands from your Arduino to test the setup');
            
            // Show current mode help after a short delay
            setTimeout(() => {
                console.log('\n');
                this.showGameModeHelp();
            }, 2000);
            
        } catch (error) {
            console.error('❌ Quick start failed:', error.message);
            console.log('💡 Try manual connection instead');
        }
    }

    async sendTestData() {
        if (!this.isConnected) {
            console.log('❌ Not connected to any device');
            return;
        }

        try {
            console.log('📤 Sending test data to Arduino...');
            await this.bluetoothManager.sendData('TEST_FROM_PC');
            console.log('✅ Test data sent successfully');
        } catch (error) {
            console.error('❌ Failed to send test data:', error.message);
        }
    }

    showConnectionStatus() {
        console.log('\n=== Connection Status ===');
        console.log(`Connected: ${this.isConnected ? '✅ Yes' : '❌ No'}`);
        
        if (this.isConnected) {
            console.log(`Port: ${this.bluetoothManager.getCurrentPort()}`);
        }
        
        const currentMode = this.scenarioHandler.getCurrentGameMode();
        const processingStatus = this.scenarioHandler.getDataProcessingStatus();
        
        console.log(`Game Mode: 🎮 ${currentMode.name}`);
        console.log(`Description: ${currentMode.description}`);
        console.log(`Data Processing: ${processingStatus.enabled ? '✅ Enabled' : '⏸️ Disabled'}`);
        
        if (processingStatus.pendingDataCount > 0) {
            console.log(`Pending Commands: 📥 ${processingStatus.pendingDataCount}`);
        }
        
        console.log('========================');
    }

    async showGameModeSelection() {
        try {
            console.log('\n🎮 GAME MODE SELECTION 🎮');
            console.log('===========================');
            console.log('Choose a game mode for optimal Arduino control:');
            
            const gameModes = this.scenarioHandler.listGameModes();
            
            // Create choices for inquirer
            const choices = [
                { name: '🎯 Default (Standard scenarios)', value: 0 },
                ...gameModes.map((mode, index) => {
                    const gameMode = this.scenarioHandler.gameModes.get(mode);
                    return {
                        name: `🎮 ${gameMode.name} - ${gameMode.description}`,
                        value: index + 1
                    };
                })
            ];

            const selection = await select({
                message: 'Select game mode:',
                choices: choices,
                pageSize: 8
            });

            const success = this.scenarioHandler.selectGameModeByIndex(selection);
            
            if (success) {
                const currentMode = this.scenarioHandler.getCurrentGameMode();
                console.log(`\n✅ Game mode activated: ${currentMode.name}`);
                console.log(`📋 ${currentMode.description}`);
                
                // Save game mode to config
                await this.configManager.setGameMode(currentMode.mode);
                
                console.log('\n🎯 Ready to receive Arduino commands!');
                console.log('📡 Send data from your Arduino to trigger actions...');
                
                // Show some example commands for the selected mode
                this.showGameModeHelp();
            }

        } catch (error) {
            if (error.name === 'ExitPromptError') {
                console.log('🚫 Game mode selection cancelled');
                return;
            }
            console.error('❌ Error in game mode selection:', error.message);
        }
    }

    async showGameModeHelp() {
        const currentMode = this.scenarioHandler.getCurrentGameMode();
        
        console.log('\n💡 Example Arduino Commands:');
        console.log('============================');
        
        switch (currentMode.mode) {
            case 'racing':
                console.log('BTN1:ON     -> Accelerate');
                console.log('BTN2:ON     -> Brake');
                console.log('LEFT/RIGHT  -> Steer');
                console.log('RPM:5000,4800 -> Gear control');
                break;
                
            case 'fps':
                console.log('BTN1:ON     -> Jump');
                console.log('BTN2:ON     -> Shoot');
                console.log('UP/DOWN     -> Move forward/back');
                console.log('LEFT/RIGHT  -> Strafe left/right');
                break;
                
            case 'media':
                console.log('BTN1:ON     -> Play/Pause');
                console.log('BTN2:ON     -> Next track');
                console.log('UP/DOWN     -> Volume up/down');
                break;
                
            case 'flight':
                console.log('BTN1:ON     -> Landing gear');
                console.log('UP/DOWN     -> Pitch control');
                console.log('LEFT/RIGHT  -> Roll control');
                console.log('RPM:6000,5800 -> Throttle control');
                break;
                
            case 'presentation':
                console.log('BTN1:ON     -> Next slide');
                console.log('BTN2:ON     -> Previous slide');
                console.log('LEFT/RIGHT  -> Navigate slides');
                break;
                
            default:
                console.log('PLAY/PAUSE  -> Media controls');
                console.log('BTN1:ON     -> Space key');
                console.log('UP/DOWN     -> Arrow keys');
                console.log('A0:512      -> Analog sensor');
        }
        console.log('============================\n');
    }

    toggleDataProcessing() {
        const newStatus = this.scenarioHandler.toggleDataProcessing();
        console.log(`\n🔄 Data processing is now: ${newStatus ? '✅ ENABLED' : '⏸️ DISABLED'}`);
        
        if (newStatus) {
            console.log('🎮 Arduino commands will now trigger key actions');
        } else {
            console.log('📥 Arduino commands will be buffered until enabled');
        }
        
        // Save the state to config
        this.configManager.setDataProcessingEnabled(newStatus);
    }

    async showConfigMenu() {
        let inConfigMenu = true;
        
        while (inConfigMenu) {
            try {
                const choice = await select({
                    message: '⚙️  Configuration Settings:',
                    choices: [
                        { name: '🎮 Key Simulation Settings', value: 'key_simulation' },
                        { name: '📡 Bluetooth Settings', value: 'bluetooth' },
                        { name: '🎯 Scenario Settings', value: 'scenarios' },
                        { name: '📝 Logging Settings', value: 'logging' },
                        { name: '📄 Show Current Config', value: 'show_config' },
                        { name: '🔄 Reload Config', value: 'reload_config' },
                        { name: '↩️  Back to Main Menu', value: 'back' }
                    ],
                    pageSize: 10
                });

                switch (choice) {
                    case 'key_simulation':
                        await this.configureKeySimulation();
                        break;
                    case 'bluetooth':
                        await this.configureBluetooth();
                        break;
                    case 'scenarios':
                        await this.configureScenarios();
                        break;
                    case 'logging':
                        await this.configureLogging();
                        break;
                    case 'show_config':
                        this.showCurrentConfig();
                        break;
                    case 'reload_config':
                        await this.reloadConfig();
                        break;
                    case 'back':
                        inConfigMenu = false;
                        break;
                }
            } catch (error) {
                if (error.name === 'ExitPromptError') {
                    inConfigMenu = false;
                } else {
                    console.error('❌ Config menu error:', error.message);
                }
            }
        }
    }

    async configureKeySimulation() {
        try {
            const keySimConfig = this.configManager.getKeySimulationConfig();
            
            const choices = [
                { name: `Key Simulation: ${keySimConfig.enabled ? '✅ Enabled' : '❌ Disabled'}`, value: 'toggle_enabled' },
                { name: `Game Mode: ${keySimConfig.gameMode ? '🎮 Enabled' : '📝 Disabled'}`, value: 'toggle_game_mode' },
                { name: `Delay Between Keys: ${keySimConfig.delayBetweenKeys || 10}ms`, value: 'set_delay' },
                { name: '↩️  Back', value: 'back' }
            ];

            const choice = await select({
                message: '🎮 Key Simulation Settings:',
                choices: choices
            });

            switch (choice) {
                case 'toggle_enabled':
                    await this.configManager.setKeySimulationConfig({
                        ...keySimConfig,
                        enabled: !keySimConfig.enabled
                    });
                    console.log(`🎮 Key simulation ${!keySimConfig.enabled ? 'enabled' : 'disabled'}`);
                    break;
                    
                case 'toggle_game_mode':
                    await this.configManager.setKeySimulationGameMode(!keySimConfig.gameMode);
                    console.log(`🎮 Game mode ${!keySimConfig.gameMode ? 'enabled' : 'disabled'}`);
                    break;
                    
                case 'set_delay': {
                    const delayInput = await input({
                        message: 'Enter delay between keys (ms):',
                        default: String(keySimConfig.delayBetweenKeys || 10),
                        validate: (value) => {
                            const num = parseInt(value);
                            return !isNaN(num) && num >= 0 && num <= 1000 ? true : 'Please enter a number between 0 and 1000';
                        }
                    });
                    
                    await this.configManager.setKeySimulationConfig({
                        ...keySimConfig,
                        delayBetweenKeys: parseInt(delayInput)
                    });
                    console.log(`⏱️  Delay set to ${delayInput}ms`);
                    break;
                }
                    
                case 'back':
                    return;
            }
        } catch (error) {
            if (error.name !== 'ExitPromptError') {
                console.error('❌ Key simulation config error:', error.message);
            }
        }
    }

    async configureBluetooth() {
        try {
            const bluetoothConfig = this.configManager.getBluetoothConfig();
            
            const choices = [
                { name: `Auto Connect: ${bluetoothConfig.autoConnect ? '✅ Enabled' : '❌ Disabled'}`, value: 'toggle_auto_connect' },
                { name: `Baud Rate: ${bluetoothConfig.baudRate || 9600}`, value: 'set_baud_rate' },
                { name: `Timeout: ${bluetoothConfig.timeout || 5000}ms`, value: 'set_timeout' },
                { name: '↩️  Back', value: 'back' }
            ];

            const choice = await select({
                message: '📡 Bluetooth Settings:',
                choices: choices
            });

            switch (choice) {
                case 'toggle_auto_connect':
                    await this.configManager.setBluetoothConfig({
                        ...bluetoothConfig,
                        autoConnect: !bluetoothConfig.autoConnect
                    });
                    console.log(`📡 Auto connect ${!bluetoothConfig.autoConnect ? 'enabled' : 'disabled'}`);
                    break;
                    
                case 'set_baud_rate': {
                    const baudRates = ['9600', '19200', '38400', '57600', '115200'];
                    const baudChoice = await select({
                        message: 'Select baud rate:',
                        choices: baudRates.map(rate => ({ name: rate, value: rate }))
                    });
                    
                    await this.configManager.setBluetoothConfig({
                        ...bluetoothConfig,
                        baudRate: parseInt(baudChoice)
                    });
                    console.log(`📡 Baud rate set to ${baudChoice}`);
                    break;
                }
                    
                case 'set_timeout': {
                    const timeoutInput = await input({
                        message: 'Enter connection timeout (ms):',
                        default: String(bluetoothConfig.timeout || 5000),
                        validate: (value) => {
                            const num = parseInt(value);
                            return !isNaN(num) && num >= 1000 && num <= 30000 ? true : 'Please enter a number between 1000 and 30000';
                        }
                    });
                    
                    await this.configManager.setBluetoothConfig({
                        ...bluetoothConfig,
                        timeout: parseInt(timeoutInput)
                    });
                    console.log(`⏱️  Timeout set to ${timeoutInput}ms`);
                    break;
                }
                    
                case 'back':
                    return;
            }
        } catch (error) {
            if (error.name !== 'ExitPromptError') {
                console.error('❌ Bluetooth config error:', error.message);
            }
        }
    }

    async configureScenarios() {
        try {
            const scenarioConfig = this.configManager.getScenariosConfig();
            const currentMode = this.scenarioHandler.getCurrentGameMode();
            
            const choices = [
                { name: `Current Game Mode: ${currentMode.name}`, value: 'change_game_mode' },
                { name: `Data Processing: ${scenarioConfig.dataProcessingEnabled ? '✅ Enabled' : '❌ Disabled'}`, value: 'toggle_data_processing' },
                { name: `Cooldown: ${scenarioConfig.cooldownMs || 100}ms`, value: 'set_cooldown' },
                { name: `Logging: ${scenarioConfig.enableLogging ? '✅ Enabled' : '❌ Disabled'}`, value: 'toggle_logging' },
                { name: '↩️  Back', value: 'back' }
            ];

            const choice = await select({
                message: '🎯 Scenario Settings:',
                choices: choices
            });

            switch (choice) {
                case 'change_game_mode':
                    await this.showGameModeSelection();
                    break;
                    
                case 'toggle_data_processing':
                    await this.configManager.setDataProcessingEnabled(!scenarioConfig.dataProcessingEnabled);
                    console.log(`🎯 Data processing ${!scenarioConfig.dataProcessingEnabled ? 'enabled' : 'disabled'}`);
                    break;
                    
                case 'set_cooldown': {
                    const cooldownInput = await input({
                        message: 'Enter scenario cooldown (ms):',
                        default: String(scenarioConfig.cooldownMs || 100),
                        validate: (value) => {
                            const num = parseInt(value);
                            return !isNaN(num) && num >= 0 && num <= 5000 ? true : 'Please enter a number between 0 and 5000';
                        }
                    });
                    
                    await this.configManager.setScenariosConfig({
                        ...scenarioConfig,
                        cooldownMs: parseInt(cooldownInput)
                    });
                    console.log(`⏱️  Cooldown set to ${cooldownInput}ms`);
                    break;
                }
                    
                case 'toggle_logging':
                    await this.configManager.setScenariosConfig({
                        ...scenarioConfig,
                        enableLogging: !scenarioConfig.enableLogging
                    });
                    console.log(`📝 Scenario logging ${!scenarioConfig.enableLogging ? 'enabled' : 'disabled'}`);
                    break;
                    
                case 'back':
                    return;
            }
        } catch (error) {
            if (error.name !== 'ExitPromptError') {
                console.error('❌ Scenario config error:', error.message);
            }
        }
    }

    async configureLogging() {
        try {
            const loggingConfig = this.configManager.getLoggingConfig();
            
            const choices = [
                { name: `Console Output: ${loggingConfig.enableConsoleOutput ? '✅ Enabled' : '❌ Disabled'}`, value: 'toggle_console' },
                { name: `File Output: ${loggingConfig.enableFileOutput ? '✅ Enabled' : '❌ Disabled'}`, value: 'toggle_file' },
                { name: `Log Level: ${loggingConfig.level || 'info'}`, value: 'set_level' },
                { name: `Log File: ${loggingConfig.logFile || 'logs/velolink.log'}`, value: 'set_file' },
                { name: '↩️  Back', value: 'back' }
            ];

            const choice = await select({
                message: '📝 Logging Settings:',
                choices: choices
            });

            switch (choice) {
                case 'toggle_console':
                    await this.configManager.update({
                        logging: {
                            ...loggingConfig,
                            enableConsoleOutput: !loggingConfig.enableConsoleOutput
                        }
                    });
                    console.log(`📺 Console logging ${!loggingConfig.enableConsoleOutput ? 'enabled' : 'disabled'}`);
                    break;
                    
                case 'toggle_file':
                    await this.configManager.update({
                        logging: {
                            ...loggingConfig,
                            enableFileOutput: !loggingConfig.enableFileOutput
                        }
                    });
                    console.log(`📄 File logging ${!loggingConfig.enableFileOutput ? 'enabled' : 'disabled'}`);
                    break;
                    
                case 'set_level': {
                    const levelChoice = await select({
                        message: 'Select log level:',
                        choices: [
                            { name: 'Debug (most verbose)', value: 'debug' },
                            { name: 'Info (default)', value: 'info' },
                            { name: 'Warning', value: 'warn' },
                            { name: 'Error (least verbose)', value: 'error' }
                        ]
                    });
                    
                    await this.configManager.update({
                        logging: {
                            ...loggingConfig,
                            level: levelChoice
                        }
                    });
                    console.log(`📊 Log level set to ${levelChoice}`);
                    break;
                }
                    
                case 'set_file': {
                    const fileInput = await input({
                        message: 'Enter log file path:',
                        default: loggingConfig.logFile || 'logs/velolink.log'
                    });
                    
                    await this.configManager.update({
                        logging: {
                            ...loggingConfig,
                            logFile: fileInput
                        }
                    });
                    console.log(`📄 Log file set to ${fileInput}`);
                    break;
                }
                    
                case 'back':
                    return;
            }
        } catch (error) {
            if (error.name !== 'ExitPromptError') {
                console.error('❌ Logging config error:', error.message);
            }
        }
    }

    showCurrentConfig() {
        const config = this.configManager.getConfig();
        
        console.log('\n⚙️  Current Configuration');
        console.log('========================');
        console.log(JSON.stringify(config, null, 2));
        console.log('========================\n');
    }

    async reloadConfig() {
        try {
            await this.configManager.loadConfig();
            await this.applyConfiguration();
            console.log('✅ Configuration reloaded successfully');
        } catch (error) {
            console.error('❌ Failed to reload configuration:', error.message);
        }
    }

    showPendingData() {
        const status = this.scenarioHandler.getDataProcessingStatus();
        
        console.log('\n📥 Pending Data Status');
        console.log('======================');
        console.log(`Processing: ${status.enabled ? '✅ Enabled' : '⏸️ Disabled'}`);
        console.log(`Pending commands: ${status.pendingDataCount}`);
        console.log(`Current game mode: ${status.currentGameMode.name}`);
        
        if (status.pendingDataCount > 0) {
            console.log('\n💡 Enable data processing to execute buffered commands');
        }
        console.log('======================\n');
    }

    clearPendingData() {
        const count = this.scenarioHandler.clearPendingData();
        console.log(`\n🗑️ Cleared ${count} pending commands\n`);
    }

    async showDataProcessingPrompt() {
        try {
            console.log('\n⚠️ DATA PROCESSING CONTROL ⚠️');
            console.log('==============================');
            console.log('Data processing is currently DISABLED.');
            console.log('Enable it to allow Arduino commands to trigger key actions.');
            
            const choice = await select({
                message: 'Choose data processing option:',
                choices: [
                    { name: '✅ Enable now', value: 'enable' },
                    { name: '⏸️ Keep disabled (use menu later)', value: 'disabled' },
                    { name: '📚 Show help', value: 'help' }
                ]
            });

            switch (choice) {
                case 'enable':
                    this.scenarioHandler.enableDataProcessing();
                    console.log('✅ Data processing enabled! Arduino commands will now work.');
                    break;
                case 'disabled':
                    console.log('⏸️ Data processing remains disabled. Use menu to enable later.');
                    break;
                case 'help':
                    this.showDataProcessingHelp();
                    break;
            }

        } catch (error) {
            if (error.name === 'ExitPromptError') {
                console.log('⏸️ Data processing remains disabled.');
                return;
            }
            console.error('❌ Error in data processing prompt:', error.message);
        }
    }

    showDataProcessingHelp() {
        console.log('\n📚 Data Processing Help');
        console.log('=======================');
        console.log('🎯 Purpose: Control when Arduino commands trigger keyboard actions');
        console.log('');
        console.log('✅ ENABLED:');
        console.log('  - Arduino commands immediately trigger key presses');
        console.log('  - Perfect for active gaming/control');
        console.log('  - Real-time response');
        console.log('');
        console.log('⏸️ DISABLED:');
        console.log('  - Arduino commands are buffered (stored)');
        console.log('  - No accidental key presses');
        console.log('  - Safe for setup and testing');
        console.log('');
        console.log('💡 Tips:');
        console.log('  - Start with DISABLED for safety');
        console.log('  - Enable when ready to play/use');
        console.log('  - Use menu option 6 to toggle anytime');
        console.log('=======================\n');
    }

    async sendCommand(command) {
        if (!this.isConnected) {
            console.log('❌ Not connected to HC-05');
            return;
        }

        try {
            await this.bluetoothManager.sendData(command);
            console.log('📤 Sent to Arduino:', command);
        } catch (error) {
            console.error('❌ Failed to send command:', error.message);
        }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            port: this.bluetoothManager.getCurrentPort()
        };
    }
}

// Application entry point
async function main() {
    console.log('🎯 Starting Velolink Client Desktop Application');
    console.log('=' .repeat(50));
    
    const client = new VelolinkClient();
    await client.initialize();
    
    // Show interactive menu
    await client.showMainMenu();
}

// Run the application
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Application crashed:', error);
        process.exit(1);
    });
}

module.exports = VelolinkClient;
