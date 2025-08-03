const ks = require('node-key-sender');
const robot = require('robotjs');

class KeySimulator {
    constructor() {
        this.isEnabled = true;
        this.useRobot = true; // Toggle between node-key-sender and robotjswwwwwwwwwwwwwwwwwwww
        console.log('⌨️  Key Simulator initialized');
        console.log('🎮  Use setGameMode(true) for better game compatibility');
    }

    async sendKey(key) {
        if (!this.isEnabled) {
            console.log('⌨️  Key simulation is disabled');
            return;
        }

        try {
            console.log(`⌨️  Simulating key: ${key} (using ${this.useRobot ? 'robotjs' : 'node-key-sender'})`);
            
            if (this.useRobot) {
                // Convert key names for robotjs
                const robotKey = this.convertKeyForRobot(key);
                robot.keyTap(robotKey);
            } else {
                await ks.sendKey(key);
            }
            return true;
        } catch (error) {
            console.error(`❌ Failed to send key '${key}':`, error.message);
            return false;
        }
    }

    async sendKeys(keys) {
        if (!this.isEnabled) {
            console.log('⌨️  Key simulation is disabled');
            return;
        }

        try {
            console.log(`⌨️  Simulating keys: ${keys.join(', ')} (using ${this.useRobot ? 'robotjs' : 'node-key-sender'})`);
            
            if (this.useRobot) {
                for (const key of keys) {
                    const robotKey = this.convertKeyForRobot(key);
                    robot.keyTap(robotKey);
                    await this.delay(10);
                }
            } else {
                for (const key of keys) {
                    await ks.sendKey(key);
                    await this.delay(10); // Small delay between keys
                }
            }
            return true;
        } catch (error) {
            console.error(`❌ Failed to send keys:`, error.message);
            return false;
        }
    }

    async sendText(text) {
        if (!this.isEnabled) {
            console.log('⌨️  Key simulation is disabled');
            return;
        }

        try {
            console.log(`⌨️  Typing text: "${text}" (using ${this.useRobot ? 'robotjs' : 'node-key-sender'})`);
            
            if (this.useRobot) {
                robot.typeString(text);
            } else {
                await ks.sendText(text);
            }
            return true;
        } catch (error) {
            console.error(`❌ Failed to send text:`, error.message);
            return false;
        }
    }

    async sendCombination(keys) {
        if (!this.isEnabled) {
            console.log('⌨️  Key simulation is disabled');
            return;
        }

        try {
            console.log(`⌨️  Sending key combination: ${keys.join(' + ')} (using ${this.useRobot ? 'robotjs' : 'node-key-sender'})`);
            
            if (this.useRobot) {
                // Convert keys for robotjs
                const robotKeys = keys.map(key => this.convertKeyForRobot(key));
                const modifiers = [];
                let mainKey = robotKeys[robotKeys.length - 1];
                
                // Extract modifiers
                for (let i = 0; i < robotKeys.length - 1; i++) {
                    if (['control', 'alt', 'shift', 'cmd'].includes(robotKeys[i])) {
                        modifiers.push(robotKeys[i]);
                    }
                }
                
                robot.keyTap(mainKey, modifiers);
            } else {
                await ks.sendCombination(keys);
            }
            return true;
        } catch (error) {
            console.error(`❌ Failed to send key combination:`, error.message);
            return false;
        }
    }

    // Predefined key actions for common scenarios
    async performAction(action, ...params) {
        switch (action.toLowerCase()) {
            case 'space':
                return await this.sendKey('space');
            
            case 'enter':
                return await this.sendKey('enter');
            
            case 'tab':
                return await this.sendKey('tab');
            
            case 'arrow_up':
                return await this.sendKey('up');
            
            case 'arrow_down':
                return await this.sendKey('down');
            
            case 'arrow_left':
                return await this.sendKey('left');
            
            case 'arrow_right':
                return await this.sendKey('right');
            
            case 'ctrl_c':
                return await this.sendCombination(['ctrl', 'c']);
            
            case 'ctrl_v':
                return await this.sendCombination(['ctrl', 'v']);
            
            case 'alt_tab':
                return await this.sendCombination(['alt', 'tab']);
            
            case 'volume_up':
                return await this.sendKey('audio_vol_up');
            
            case 'volume_down':
                return await this.sendKey('audio_vol_down');
            
            case 'volume_mute':
                return await this.sendKey('audio_mute');
            
            case 'media_play_pause':
                return await this.sendKey('audio_play');
            
            case 'media_next':
                return await this.sendKey('audio_next');
            
            case 'media_prev':
                return await this.sendKey('audio_prev');
            
            case 'type_text':
                return await this.sendText(params[0] || '');
            
            case 'f_key':
                const fNum = params[0] || 1;
                return await this.sendKey(`f${fNum}`);
            
            // Game-specific actions
            case 'mouse_click': {
                const [x, y, button] = params;
                return await this.mouseClick(x || 0, y || 0, button || 'left');
            }
            
            case 'key_down':
                return await this.keyDown(params[0] || 'space');
            
            case 'key_up':
                return await this.keyUp(params[0] || 'space');
                
            default:
                console.log(`⚠️  Unknown action: ${action}`);
                return false;
        }
    }

    enable() {
        this.isEnabled = true;
        console.log('✅ Key simulation enabled');
    }

    disable() {
        this.isEnabled = false;
        console.log('🔇 Key simulation disabled');
    }

    // Toggle between node-key-sender and robotjs
    setGameMode(enabled) {
        this.useRobot = enabled;
        console.log(`🎮 Game mode ${enabled ? 'enabled' : 'disabled'} (using ${enabled ? 'robotjs' : 'node-key-sender'})`);
    }

    // Convert key names from node-key-sender format to robotjs format
    convertKeyForRobot(key) {
        const keyMap = {
            // Basic keys
            'space': 'space',
            'enter': 'enter',
            'tab': 'tab',
            'escape': 'escape',
            'backspace': 'backspace',
            'delete': 'delete',
            
            // Arrow keys
            'up': 'up',
            'down': 'down',
            'left': 'left',
            'right': 'right',
            
            // Modifiers
            'ctrl': 'control',
            'alt': 'alt',
            'shift': 'shift',
            
            // Function keys
            'f1': 'f1', 'f2': 'f2', 'f3': 'f3', 'f4': 'f4',
            'f5': 'f5', 'f6': 'f6', 'f7': 'f7', 'f8': 'f8',
            'f9': 'f9', 'f10': 'f10', 'f11': 'f11', 'f12': 'f12',
            
            // Media keys (robotjs doesn't support these directly)
            'audio_vol_up': 'audio_vol_up',
            'audio_vol_down': 'audio_vol_down',
            'audio_mute': 'audio_mute',
            'audio_play': 'audio_play',
            'audio_next': 'audio_next',
            'audio_prev': 'audio_prev'
        };
        
        return keyMap[key.toLowerCase()] || key.toLowerCase();
    }

    // Advanced game input methods
    async mouseClick(x, y, button = 'left') {
        if (!this.isEnabled || !this.useRobot) {
            console.log('⌨️  Mouse simulation requires game mode to be enabled');
            return false;
        }

        try {
            console.log(`🖱️  Mouse click at (${x}, ${y}) with ${button} button`);
            robot.moveMouse(x, y);
            robot.mouseClick(button);
            return true;
        } catch (error) {
            console.error(`❌ Failed to perform mouse click:`, error.message);
            return false;
        }
    }

    async keyDown(key) {
        if (!this.isEnabled || !this.useRobot) {
            console.log('⌨️  Key down requires game mode to be enabled');
            return false;
        }

        try {
            const robotKey = this.convertKeyForRobot(key);
            console.log(`⌨️  Key down: ${key}`);
            robot.keyToggle(robotKey, 'down');
            return true;
        } catch (error) {
            console.error(`❌ Failed to perform key down:`, error.message);
            return false;
        }
    }

    async keyUp(key) {
        if (!this.isEnabled || !this.useRobot) {
            console.log('⌨️  Key up requires game mode to be enabled');
            return false;
        }

        try {
            const robotKey = this.convertKeyForRobot(key);
            console.log(`⌨️  Key up: ${key}`);
            robot.keyToggle(robotKey, 'up');
            return true;
        } catch (error) {
            console.error(`❌ Failed to perform key up:`, error.message);
            return false;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get list of available actions
    getAvailableActions() {
        const baseActions = [
            'space', 'enter', 'tab',
            'arrow_up', 'arrow_down', 'arrow_left', 'arrow_right',
            'ctrl_c', 'ctrl_v', 'alt_tab',
            'volume_up', 'volume_down', 'volume_mute',
            'media_play_pause', 'media_next', 'media_prev',
            'type_text', 'f_key'
        ];

        if (this.useRobot) {
            baseActions.push('mouse_click', 'key_down', 'key_up');
        }

        return baseActions;
    }

    // Get current mode status
    getStatus() {
        return {
            enabled: this.isEnabled,
            gameMode: this.useRobot,
            library: this.useRobot ? 'robotjs' : 'node-key-sender'
        };
    }
}

module.exports = KeySimulator;
