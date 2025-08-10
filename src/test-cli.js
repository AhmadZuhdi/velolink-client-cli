#!/usr/bin/env node

import { listSerialPorts } from './cli.js';

/**
 * Test script to demonstrate the CLI functionality
 */
async function testCLI() {
    console.log('🧪 Testing Velolink CLI functionality\n');

    try {
        // Test port listing
        console.log('📋 Testing port listing...');
        const ports = await listSerialPorts();
        
        if (ports.length === 0) {
            console.log('ℹ️  No serial ports found (this is normal if no devices are connected)');
        } else {
            console.log(`✅ Found ${ports.length} serial port(s):`);
            
            ports.forEach((port, index) => {
                console.log(`   ${index + 1}. ${port.path}`);
                if (port.friendlyName) {
                    console.log(`      Name: ${port.friendlyName}`);
                }
                if (port.manufacturer) {
                    console.log(`      Manufacturer: ${port.manufacturer}`);
                }
                if (port.vendorId) {
                    console.log(`      VID: ${port.vendorId}, PID: ${port.productId}`);
                }
                console.log('');
            });
        }

        console.log('✅ CLI test completed successfully!');
        console.log('\n💡 To run the interactive CLI, use: npm run cli');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testCLI();
