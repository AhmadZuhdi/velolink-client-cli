const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const EventEmitter = require('events');
const { select, confirm } = require('@inquirer/prompts');

class BluetoothManager extends EventEmitter {
    constructor() {
        super();
        this.port = null;
        this.parser = null;
        this.isConnected = false;
        this.currentPortPath = null;
    }

    async listPorts() {
        try {
            const ports = await SerialPort.list();
            console.log('📋 Available serial ports:');
            
            if (ports.length === 0) {
                console.log('   No serial ports found');
                return [];
            }

            ports.forEach((port, index) => {
                console.log(`   ${index + 1}. ${port.path} - ${port.manufacturer || 'Unknown'}`);
                if (port.friendlyName) {
                    console.log(`      Name: ${port.friendlyName}`);
                }
            });

            return ports;
        } catch (error) {
            console.error('❌ Error listing ports:', error.message);
            return [];
        }
    }

    async selectPortInteractive() {
        const ports = await this.listPorts();
        
        if (ports.length === 0) {
            console.log('❌ No serial ports available for connection');
            return null;
        }

        console.log('\n🔍 Available ports for connection:');
        
        // Return ports array for external selection (e.g., from main app)
        return ports;
    }

    async connectByIndex(portIndex, baudRate = 9600) {
        const ports = await this.listPorts();
        
        if (portIndex < 0 || portIndex >= ports.length) {
            throw new Error(`Invalid port index. Available ports: 0-${ports.length - 1}`);
        }

        const selectedPort = ports[portIndex];
        console.log(`👆 Selected port: ${selectedPort.path}`);
        await this.connect(selectedPort.path, baudRate);
        return selectedPort;
    }

    async autoConnect() {
        const ports = await this.listPorts();
        
        // Look for common HC-05 identifiers
        const hc05Port = ports.find(port => 
            port.friendlyName?.toLowerCase().includes('hc-05') ||
            port.friendlyName?.toLowerCase().includes('bluetooth')
        );

        if (hc05Port) {
            console.log(`🎯 Found potential HC-05 port: ${hc05Port.path}`);
            await this.connect(hc05Port.path);
            return hc05Port;
        } else {
            console.log('⚠️  No HC-05 module detected automatically');
            console.log('💡 Use selectPortInteractive() to choose manually');
            return null;
        }
    }

    async connectWithPrompt() {
        try {
            const ports = await this.selectPortInteractive();
            
            if (!ports || ports.length === 0) {
                return null;
            }

            // Create choices for inquirer
            const choices = [
                { name: '❌ Cancel connection', value: -1 },
                ...ports.map((port, index) => ({
                    name: `${port.path} - ${port.manufacturer || 'Unknown'}${port.friendlyName ? ` (${port.friendlyName})` : ''}`,
                    value: index
                }))
            ];

            const selection = await select({
                message: '🔌 Select a port to connect to:',
                choices: choices,
                pageSize: 10
            });
            
            if (selection === -1) {
                console.log('🚫 Connection cancelled');
                return null;
            }

            // Connect to selected port
            return await this.connectByIndex(selection);

        } catch (error) {
            if (error.name === 'ExitPromptError') {
                console.log('🚫 Connection cancelled by user');
                return null;
            }
            throw error;
        }
    }

    async connect(portPath, baudRate = 9600) {
        try {
            if (this.isConnected) {
                console.log('⚠️  Already connected to a port');
                return;
            }

            console.log(`🔌 Connecting to ${portPath} at ${baudRate} baud...`);

            this.port = new SerialPort({
                path: portPath,
                baudRate: baudRate,
                autoOpen: false
            });

            // Set up data parser
            this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

            // Event handlers
            this.port.on('open', () => {
                this.isConnected = true;
                this.currentPortPath = portPath;
                console.log(`✅ Connected to ${portPath}`);
                this.emit('connected', portPath);
            });

            this.port.on('close', () => {
                this.isConnected = false;
                this.currentPortPath = null;
                console.log('🔌 Port closed');
                this.emit('disconnected');
            });

            this.port.on('error', (error) => {
                console.error(`❌ Port error: ${error.message}`);
                this.emit('error', error);
            });

            this.parser.on('data', (data) => {
                const cleanData = data.trim();
                if (cleanData) {
                    this.emit('data', cleanData);
                }
            });

            // Open the port
            await new Promise((resolve, reject) => {
                this.port.open((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });

        } catch (error) {
            console.error(`❌ Failed to connect to ${portPath}:`, error.message);
            throw error;
        }
    }

    async sendData(data) {
        if (!this.isConnected || !this.port) {
            throw new Error('Not connected to any port');
        }

        return new Promise((resolve, reject) => {
            this.port.write(data + '\n', (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    async disconnect() {
        if (this.port && this.isConnected) {
            try {
                await new Promise((resolve) => {
                    this.port.close(() => {
                        resolve();
                    });
                });
                console.log('👋 Disconnected from HC-05');
            } catch (error) {
                console.error('❌ Error during disconnect:', error.message);
            }
        }
    }

    getCurrentPort() {
        return this.currentPortPath;
    }

    isPortConnected() {
        return this.isConnected;
    }
}

module.exports = BluetoothManager;
