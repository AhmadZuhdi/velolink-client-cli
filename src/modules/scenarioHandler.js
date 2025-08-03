class ScenarioHandler {
    constructor(keySimulator) {
        this.keySimulator = keySimulator;
        this.scenarios = new Map();
        this.isProcessing = false;
        this.currentGameMode = 'default';
        this.gameModes = new Map();
        this.dataProcessingEnabled = false; // User must enable processing
        this.pendingData = [];
        this.maxPendingData = 50; // Limit pending data buffer
        
        // Initialize default scenarios and game modes
        this.setupDefaultScenarios();
        this.setupGameModes();
        console.log('🎬 Scenario Handler initialized with default scenarios');
        console.log('⏸️ Data processing is DISABLED by default - use menu to enable');
    }

    setupDefaultScenarios() {
        // Media control scenarios
        this.addScenario('PLAY', () => this.keySimulator.performAction('media_play_pause'));
        this.addScenario('PAUSE', () => this.keySimulator.performAction('media_play_pause'));
        this.addScenario('NEXT', () => this.keySimulator.performAction('media_next'));
        this.addScenario('PREV', () => this.keySimulator.performAction('media_prev'));
        
        // Volume control
        this.addScenario('VOL_UP', () => this.keySimulator.performAction('volume_up'));
        this.addScenario('VOL_DOWN', () => this.keySimulator.performAction('volume_down'));
        this.addScenario('MUTE', () => this.keySimulator.performAction('volume_mute'));
        
        // Navigation
        this.addScenario('UP', () => this.keySimulator.performAction('arrow_up'));
        this.addScenario('DOWN', () => this.keySimulator.performAction('arrow_down'));
        this.addScenario('LEFT', () => this.keySimulator.performAction('arrow_left'));
        this.addScenario('RIGHT', () => this.keySimulator.performAction('arrow_right'));
        
        // Common actions
        this.addScenario('SPACE', () => this.keySimulator.performAction('space'));
        this.addScenario('ENTER', () => this.keySimulator.performAction('enter'));
        this.addScenario('TAB', () => this.keySimulator.performAction('tab'));
        this.addScenario('ALT_TAB', () => this.keySimulator.performAction('alt_tab'));
        
        // Function keys
        this.addScenario('F1', () => this.keySimulator.performAction('f_key', 1));
        this.addScenario('F2', () => this.keySimulator.performAction('f_key', 2));
        this.addScenario('F3', () => this.keySimulator.performAction('f_key', 3));
        this.addScenario('F4', () => this.keySimulator.performAction('f_key', 4));
        this.addScenario('F5', () => this.keySimulator.performAction('f_key', 5));
        
        // Custom scenarios for Arduino sensor data
        this.addScenario('BUTTON_1', () => this.keySimulator.performAction('space'));
        this.addScenario('BUTTON_2', () => this.keySimulator.performAction('enter'));
        this.addScenario('SENSOR_HIGH', () => this.keySimulator.performAction('volume_up'));
        this.addScenario('SENSOR_LOW', () => this.keySimulator.performAction('volume_down'));
        
        // Complex scenarios
        this.addScenario('SHUTDOWN', async () => {
            await this.keySimulator.sendCombination(['ctrl', 'alt', 'delete']);
        });
        
        this.addScenario('SCREENSHOT', async () => {
            await this.keySimulator.sendCombination(['win', 'shift', 's']);
        });
        
        // Pattern-based scenarios
        this.addScenario('HELLO', () => this.keySimulator.performAction('type_text', 'Hello from Arduino!'));
        
        console.log(`📝 Loaded ${this.scenarios.size} default scenarios`);
    }

    setupGameModes() {
        // Racing Game Mode
        this.gameModes.set('racing', {
            name: 'Racing Game',
            description: 'Optimized for racing games like Need for Speed, Forza, etc.',
            scenarios: {
                'BTN1:ON': 'space',           // Accelerate
                'BTN2:ON': 'shift',           // Brake
                'BTN3:ON': 'ctrl',            // Handbrake
                'LEFT': 'left',               // Steer left
                'RIGHT': 'right',             // Steer right
                'UP': 'w',                    // Alternative accelerate
                'DOWN': 's',                  // Alternative brake
                'SPACE': 'r',                 // Reset car
                'RPM:': 'handleRacingRPM'     // Handle RPM for gear shifting
            }
        });

        // FPS Game Mode
        this.gameModes.set('fps', {
            name: 'FPS Shooter',
            description: 'For first-person shooters like Counter-Strike, Valorant, etc.',
            scenarios: {
                'BTN1:ON': 'space',           // Jump
                'BTN2:ON': 'click',           // Shoot
                'BTN3:ON': 'r',               // Reload
                'LEFT': 'a',                  // Move left
                'RIGHT': 'd',                 // Move right
                'UP': 'w',                    // Move forward
                'DOWN': 's',                  // Move backward
                'SPACE': 'shift',             // Sprint
                'ENTER': 'ctrl'               // Crouch
            }
        });

        // Media Control Mode
        this.gameModes.set('media', {
            name: 'Media Control',
            description: 'Control music, videos, and media applications',
            scenarios: {
                'BTN1:ON': 'media_play_pause',
                'BTN2:ON': 'media_next',
                'BTN3:ON': 'media_prev',
                'UP': 'volume_up',
                'DOWN': 'volume_down',
                'LEFT': 'media_prev',
                'RIGHT': 'media_next',
                'SPACE': 'media_play_pause',
                'ENTER': 'volume_mute'
            }
        });

        // Flight Simulator Mode
        this.gameModes.set('flight', {
            name: 'Flight Simulator',
            description: 'For flight simulation games',
            scenarios: {
                'BTN1:ON': 'space',           // Landing gear
                'BTN2:ON': 'f',               // Flaps
                'BTN3:ON': 'b',               // Brakes
                'LEFT': 'a',                  // Roll left
                'RIGHT': 'd',                 // Roll right
                'UP': 's',                    // Pitch down
                'DOWN': 'w',                  // Pitch up
                'SPACE': 'enter',             // Engine start
                'RPM:': 'handleFlightRPM'     // Handle RPM for throttle
            }
        });

        // Presentation Mode
        this.gameModes.set('presentation', {
            name: 'Presentation Control',
            description: 'Control PowerPoint or other presentation software',
            scenarios: {
                'BTN1:ON': 'right',           // Next slide
                'BTN2:ON': 'left',            // Previous slide
                'BTN3:ON': 'escape',          // Exit presentation
                'LEFT': 'left',               // Previous slide
                'RIGHT': 'right',             // Next slide
                'UP': 'home',                 // First slide
                'DOWN': 'end',                // Last slide
                'SPACE': 'right',             // Next slide
                'ENTER': 'f5'                 // Start presentation
            }
        });

        console.log(`🎮 Loaded ${this.gameModes.size} game modes`);
    }

    addScenario(trigger, action, description = '') {
        this.scenarios.set(trigger.toUpperCase(), {
            action: action,
            description: description,
            lastTriggered: null,
            triggerCount: 0
        });
    }

    removeScenario(trigger) {
        return this.scenarios.delete(trigger.toUpperCase());
    }

    setGameMode(mode) {
        if (!this.gameModes.has(mode)) {
            console.log(`❌ Game mode '${mode}' not found`);
            return false;
        }

        this.currentGameMode = mode;
        
        // Enable robotjs for better game compatibility
        this.keySimulator.setGameMode(true);
        
        console.log(`🎮 Game mode set to: ${this.gameModes.get(mode).name}`);
        console.log(`📋 ${this.gameModes.get(mode).description}`);
        console.log(`🔧 Using robotjs for better game input compatibility`);
        return true;
    }

    getCurrentGameMode() {
        return {
            mode: this.currentGameMode,
            name: this.gameModes.get(this.currentGameMode)?.name || 'Default',
            description: this.gameModes.get(this.currentGameMode)?.description || 'Standard mode'
        };
    }

    setDefaultMode() {
        this.currentGameMode = 'default';
        
        // Disable robotjs for standard applications compatibility
        this.keySimulator.setGameMode(false);
        
        console.log('🔄 Game mode set to: Default');
        console.log('📋 Standard scenarios for general applications');
        console.log('🔧 Using node-key-sender for standard input compatibility');
        return true;
    }

    listGameModes() {
        console.log('\n🎮 Available Game Modes:');
        console.log('0. Default (Standard scenarios)');
        
        let index = 1;
        for (const [key, mode] of this.gameModes.entries()) {
            console.log(`${index}. ${mode.name} - ${mode.description}`);
            index++;
        }
        console.log('');
        
        return Array.from(this.gameModes.keys());
    }

    selectGameModeByIndex(index) {
        const modes = Array.from(this.gameModes.keys());
        
        if (index === 0) {
            this.currentGameMode = 'default';
            console.log('🎮 Game mode set to: Default');
            return true;
        }
        
        if (index < 1 || index > modes.length) {
            console.log(`❌ Invalid game mode index. Choose 0-${modes.length}`);
            return false;
        }
        
        const selectedMode = modes[index - 1];
        return this.setGameMode(selectedMode);
    }

    enableDataProcessing() {
        this.dataProcessingEnabled = true;
        console.log('✅ Data processing ENABLED - Arduino commands will trigger actions');
        
        // Process any pending data
        if (this.pendingData.length > 0) {
            console.log(`📦 Processing ${this.pendingData.length} pending commands...`);
            const dataToProcess = [...this.pendingData];
            this.pendingData = [];
            
            // Process pending data with small delays
            dataToProcess.forEach((data, index) => {
                setTimeout(() => {
                    this.processDataInternal(data);
                }, index * 100);
            });
        }
    }

    disableDataProcessing() {
        this.dataProcessingEnabled = false;
        console.log('⏸️ Data processing DISABLED - Arduino commands will be buffered');
    }

    toggleDataProcessing() {
        if (this.dataProcessingEnabled) {
            this.disableDataProcessing();
        } else {
            this.enableDataProcessing();
        }
        return this.dataProcessingEnabled;
    }

    getDataProcessingStatus() {
        return {
            enabled: this.dataProcessingEnabled,
            pendingDataCount: this.pendingData.length,
            currentGameMode: this.getCurrentGameMode()
        };
    }

    clearPendingData() {
        const count = this.pendingData.length;
        this.pendingData = [];
        console.log(`🗑️ Cleared ${count} pending commands`);
        return count;
    }

    async processData(data) {
        const cleanData = data.toString().trim();
        
        // Check if data processing is enabled
        if (!this.dataProcessingEnabled) {
            return;
        }

        return this.processDataInternal(cleanData);
    }

    async processDataInternal(data) {
        if (this.isProcessing) {
            // console.log('⏳ Already processing a scenario, skipping...');
            // return;
        }

        try {
            this.isProcessing = true;
            const cleanData = data.toString().trim().toUpperCase();
            
            // console.log(`🔍 Processing data: "${cleanData}"`);

            // First check if current game mode has a specific scenario for this data
            if (this.currentGameMode !== 'default' && this.gameModes.has(this.currentGameMode)) {
                const gameMode = this.gameModes.get(this.currentGameMode);
                
                if (gameMode.scenarios[cleanData]) {
                    await this.executeGameModeAction(cleanData, gameMode.scenarios[cleanData]);
                    return;
                }

                // Check for pattern matches in game mode
                const gameModeMatch = await this.checkGameModePatterns(cleanData, gameMode);
                if (gameModeMatch) {
                    return;
                }
            }

            // Fall back to default scenarios
            // Check for exact match first
            if (this.scenarios.has(cleanData)) {
                await this.executeScenario(cleanData);
                return;
            }

            // Check for pattern matches
            await this.checkPatterns(cleanData);

        } catch (error) {
            console.error('❌ Error processing data:', error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    async executeGameModeAction(trigger, action) {
        try {
            console.log(`🎮 [${this.currentGameMode.toUpperCase()}] Executing: ${trigger} -> ${action}`);
            
            if (typeof action === 'string') {
                if (action.startsWith('handle')) {
                    // Special handler function
                    if (action === 'handleRacingRPM') {
                        await this.handleRacingRPM(trigger);
                    } else if (action === 'handleFlightRPM') {
                        await this.handleFlightRPM(trigger);
                    }
                } else {
                    // Direct key action
                    await this.keySimulator.performAction(action);
                }
            } else if (typeof action === 'function') {
                await action();
            }
            
        } catch (error) {
            console.error(`❌ Error executing game mode action "${trigger}":`, error.message);
        }
    }

    async checkGameModePatterns(data, gameMode) {
        // Check for RPM patterns in game modes
        if (data.startsWith('RPM:')) {
            if (gameMode.scenarios['RPM:']) {
                await this.executeGameModeAction(data, gameMode.scenarios['RPM:']);
                return true;
            }
        }

        // Check for button patterns
        const buttonMatch = data.match(/^BTN(\d+):(ON|OFF)$/);
        if (buttonMatch) {
            const trigger = `BTN${buttonMatch[1]}:${buttonMatch[2]}`;
            if (gameMode.scenarios[trigger]) {
                await this.executeGameModeAction(trigger, gameMode.scenarios[trigger]);
                return true;
            }
        }

        return false;
    }

    async checkPatterns(data) {
        // Check for numeric values (sensor readings)
        const numMatch = data.match(/^(\d+)$/);
        if (numMatch) {
            const value = parseInt(numMatch[1]);
            await this.handleNumericValue(value);
            return;
        }

        // Check for temperature patterns
        const tempMatch = data.match(/^TEMP:(\d+)$/);
        if (tempMatch) {
            const temp = parseInt(tempMatch[1]);
            await this.handleTemperature(temp);
            return;
        }

        // Check for button patterns
        const buttonMatch = data.match(/^BTN(\d+):(ON|OFF)$/);
        if (buttonMatch) {
            const buttonNum = buttonMatch[1];
            const state = buttonMatch[2];
            await this.handleButton(buttonNum, state);
            return;
        }

        // Check for analog sensor patterns
        const analogMatch = data.match(/^A(\d+):(\d+)$/);
        if (analogMatch) {
            const pin = analogMatch[1];
            const value = parseInt(analogMatch[2]);
            await this.handleAnalogSensor(pin, value);
            return;
        }

        // Check for RPM patterns
        const rpmMatch = data.startsWith('RPM:');
        if (rpmMatch) {
            const rpmValue = data;
            await this.handleRPM(rpmValue);
            return;
        }

        console.log(`⚠️  No scenario found for: "${data}"`);
    }

    async executeScenario(trigger) {
        const scenario = this.scenarios.get(trigger);
        if (!scenario) return;

        try {
            console.log(`🎬 Executing scenario: ${trigger}`);
            
            scenario.lastTriggered = new Date();
            scenario.triggerCount++;

            if (typeof scenario.action === 'function') {
                await scenario.action();
                console.log(`✅ Scenario "${trigger}" executed successfully`);
            } else {
                console.log(`❌ Invalid action for scenario: ${trigger}`);
            }

        } catch (error) {
            console.error(`❌ Error executing scenario "${trigger}":`, error.message);
        }
    }

    async handleNumericValue(value) {
        console.log(`🔢 Handling numeric value: ${value}`);
        
        if (value < 100) {
            await this.keySimulator.performAction('volume_down');
        } else if (value > 900) {
            await this.keySimulator.performAction('volume_up');
        } else if (value >= 400 && value <= 600) {
            await this.keySimulator.performAction('space');
        }
    }

    async handleTemperature(temp) {
        console.log(`🌡️  Handling temperature: ${temp}°C`);
        
        if (temp > 30) {
            await this.keySimulator.performAction('type_text', `Hot! ${temp}°C`);
        } else if (temp < 10) {
            await this.keySimulator.performAction('type_text', `Cold! ${temp}°C`);
        }
    }

    async handleButton(buttonNum, state) {
        console.log(`🔘 Button ${buttonNum} is ${state}`);
        
        if (state === 'ON') {
            switch (buttonNum) {
                case '1':
                    await this.keySimulator.performAction('space');
                    break;
                case '2':
                    await this.keySimulator.performAction('enter');
                    break;
                case '3':
                    await this.keySimulator.performAction('media_play_pause');
                    break;
                default:
                    await this.keySimulator.performAction('f_key', parseInt(buttonNum));
            }
        }
    }

    async handleAnalogSensor(pin, value) {
        console.log(`📊 Analog pin A${pin}: ${value}`);
        
        // Map analog values to different actions based on pin
        switch (pin) {
            case '0': // Potentiometer for volume
                if (value < 200) {
                    await this.keySimulator.performAction('volume_down');
                } else if (value > 800) {
                    await this.keySimulator.performAction('volume_up');
                }
                break;
                
            case '1': // Light sensor
                if (value < 100) {
                    await this.keySimulator.performAction('type_text', 'Dark');
                } else if (value > 900) {
                    await this.keySimulator.performAction('type_text', 'Bright');
                }
                break;
        }
    }

    async handleRPM(rpmValue) {
        const [label, value] = rpmValue.split(':');
        const [raw, filtered] = value.split(',');
        console.log(`🔄 RPM Value is (Raw: ${raw}, Filtered: ${filtered})`);
    }

    async handleRacingRPM(rpmData) {
        const [ , value] = rpmData.split(':');
        const [raw, filtered] = value.split(',');
        const rpmValue = parseFloat(filtered);
        
        console.log(`🏎️ Racing RPM: ${rpmValue}`);
        
        // Gear shifting logic for racing games
        if (rpmValue > 0) {
            await this.keySimulator.sendKey('w'); // Accelerate
        }
    }

    async handleFlightRPM(rpmData) {
        const [label, value] = rpmData.split(':');
        const [raw, filtered] = value.split(',');
        const rpmValue = parseInt(filtered || raw);
        
        console.log(`✈️ Flight RPM: ${rpmValue}`);
        
        // Throttle control for flight simulator
        if (rpmValue > 7000) {
            await this.keySimulator.sendKey('shift+f1');  // Full throttle
            console.log('🔥 Full throttle!');
        } else if (rpmValue < 3000) {
            await this.keySimulator.sendKey('f1');        // Reduce throttle
            console.log('🔽 Throttle down');
        }
    }

    // Utility methods
    listScenarios() {
        console.log('📋 Available scenarios:');
        for (const [trigger, scenario] of this.scenarios.entries()) {
            console.log(`   ${trigger} - ${scenario.description || 'No description'} (triggered ${scenario.triggerCount} times)`);
        }
    }

    getScenarioStats() {
        const stats = {};
        for (const [trigger, scenario] of this.scenarios.entries()) {
            stats[trigger] = {
                triggerCount: scenario.triggerCount,
                lastTriggered: scenario.lastTriggered
            };
        }
        return stats;
    }

    clearStats() {
        for (const scenario of this.scenarios.values()) {
            scenario.triggerCount = 0;
            scenario.lastTriggered = null;
        }
        console.log('📊 Scenario statistics cleared');
    }
}

module.exports = ScenarioHandler;
