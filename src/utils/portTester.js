const BluetoothManager = require('../modules/bluetoothManager');

class PortTester {
    constructor() {
        this.bluetoothManager = new BluetoothManager();
    }

    async testAllPorts(baudRate = 9600) {
        console.log('🔍 Testing all available ports...');
        
        const ports = await this.bluetoothManager.listPorts();
        
        if (ports.length === 0) {
            console.log('❌ No ports available to test');
            return [];
        }

        const results = [];

        for (let i = 0; i < ports.length; i++) {
            const port = ports[i];
            console.log(`\n📍 Testing port ${i + 1}/${ports.length}: ${port.path}`);
            
            try {
                await this.bluetoothManager.connect(port.path, baudRate);
                
                // Wait a moment for connection to stabilize
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (this.bluetoothManager.isPortConnected()) {
                    console.log(`✅ ${port.path} - Connection successful`);
                    results.push({
                        index: i,
                        port: port,
                        status: 'success',
                        message: 'Connected successfully'
                    });
                } else {
                    console.log(`❌ ${port.path} - Connection failed`);
                    results.push({
                        index: i,
                        port: port,
                        status: 'failed',
                        message: 'Connection failed'
                    });
                }
                
                await this.bluetoothManager.disconnect();
                
            } catch (error) {
                console.log(`❌ ${port.path} - Error: ${error.message}`);
                results.push({
                    index: i,
                    port: port,
                    status: 'error',
                    message: error.message
                });
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n📊 Test Results Summary:');
        results.forEach(result => {
            const status = result.status === 'success' ? '✅' : '❌';
            console.log(`   ${status} ${result.port.path} - ${result.message}`);
        });

        return results;
    }

    async quickTest(portIndex, baudRate = 9600) {
        const ports = await this.bluetoothManager.listPorts();
        
        if (portIndex < 0 || portIndex >= ports.length) {
            throw new Error(`Invalid port index. Available: 0-${ports.length - 1}`);
        }

        const port = ports[portIndex];
        console.log(`🔍 Quick testing port: ${port.path}`);
        
        try {
            await this.bluetoothManager.connect(port.path, baudRate);
            
            // Test data exchange
            const testData = 'PING';
            console.log(`📤 Sending test data: ${testData}`);
            await this.bluetoothManager.sendData(testData);
            
            console.log('✅ Quick test completed successfully');
            return true;
            
        } catch (error) {
            console.log(`❌ Quick test failed: ${error.message}`);
            return false;
        } finally {
            await this.bluetoothManager.disconnect();
        }
    }
}

module.exports = PortTester;
