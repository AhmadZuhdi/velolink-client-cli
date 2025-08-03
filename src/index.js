const BluetoothManager = require('./modules/bluetoothManager');
const KeySimulator = require('./modules/keySimulator');
const ScenarioHandler = require('./modules/scenarioHandler');
const PortTester = require('./utils/portTester');
const { select, confirm, input } = require('@inquirer/prompts');

class VelolinkClient {
    constructor() {
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
            // Set up event handlers
            this.setupEventHandlers();
            
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
            // console.log('📡 Received from Arduino:', data);
            this.scenarioHandler.processData(data);
        });

        // Handle connection events
        this.bluetoothManager.on('connected', async (portPath) => {
            this.isConnected = true;
            console.log('🔗 Connected to HC-05 at:', portPath);
            
            // Show game mode selection after connection
            setTimeout(async () => {
                await this.showGameModeSelection();
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

    async showMainMenu() {
        let running = true;
        
        while (running) {
            try {
                const processingStatus = this.scenarioHandler.getDataProcessingStatus();
                const statusIcon = processingStatus.enabled ? '✅' : '⏸️';
                
                const choices = [
                    { name: '📋 List available ports', value: 'list_ports' },
                    { name: '🔌 Connect to port manually', value: 'connect_manual' },
                    { name: '🎯 Auto-connect to HC-05', value: 'auto_connect' },
                    { name: '🎮 Change game mode', value: 'game_mode' },
                    { name: `${statusIcon} ${processingStatus.enabled ? ' Disable' : ' Enable'} data processing`, value: 'toggle_processing' },
                    { name: '📊 Show connection status', value: 'status' },
                    { name: '🔌 Disconnect', value: 'disconnect' },
                    { name: '❌ Exit', value: 'exit' }
                ];

                if (processingStatus.pendingDataCount > 0) {
                    console.log(`\n📥 ${processingStatus.pendingDataCount} commands waiting to be processed`);
                }

                const choice = await select({
                    message: '🎯 Velolink Client - Choose an action:',
                    choices: choices,
                    pageSize: 12
                });

                await this.handleMenuChoice(choice);
                
                if (choice === 'exit') {
                    running = false;
                }

            } catch (error) {
                if (error.name === 'ExitPromptError') {
                    console.log('\n👋 Goodbye!');
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
            case 'list_ports':
                await this.bluetoothManager.listPorts();
                break;
            case 'connect_manual':
                await this.selectPortManually();
                break;
            case 'auto_connect':
                await this.bluetoothManager.autoConnect();
                break;
            case 'test_ports':
                await this.portTester.testAllPorts();
                break;
            case 'game_mode':
                await this.showGameModeSelection();
                break;
            case 'toggle_processing':
                this.toggleDataProcessing();
                break;
            case 'show_pending':
                this.showPendingData();
                break;
            case 'clear_pending':
                this.clearPendingData();
                break;
            case 'test_data':
                await this.sendTestData();
                break;
            case 'status':
                this.showConnectionStatus();
                break;
            case 'disconnect':
                await this.bluetoothManager.disconnect();
                break;
            case 'exit':
                console.log('👋 Goodbye!');
                await this.bluetoothManager.disconnect();
                process.exit(0);
                break;
            default:
                console.log('❌ Unknown choice');
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
