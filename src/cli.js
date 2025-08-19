#!/usr/bin/env node

import { SerialPort } from 'serialport';
import { select, confirm, number } from '@inquirer/prompts';
import { ReadlineParser } from '@serialport/parser-readline';
import {parseRpmData} from './handlers/rpm_to_send_keys.js';
import {sendKeysForInput} from './handlers/input_to_send_keys.js';
import {parseDefaultData} from './handlers/default.js';

let diameter = 700; // Default diameter in mm

/**
 * List all available serial ports
 */
async function listSerialPorts() {
    try {
        const ports = await SerialPort.list();
        return ports.filter(port => port.path); // Filter out ports without a path
    } catch (error) {
        console.error('Error listing serial ports:', error.message);
        return [];
    }
}

/**
 * Format port information for display
 */
function formatPortChoice(port) {
    let name = port.path;
    if (port.friendlyName && port.friendlyName !== port.path) {
        name += ` (${port.friendlyName})`;
    }
    if (port.manufacturer) {
        name += ` - ${port.manufacturer}`;
    }
    return {
        name,
        value: port.path,
        description: `VID: ${port.vendorId || 'N/A'}, PID: ${port.productId || 'N/A'}`
    };
}

/**
 * Setup port event handlers
 */
function setupPortHandlers(port, parser) {
    // Handle incoming data
    parser.on('data', (data) => {
        
        if (data.startsWith('RPM:')) {
            parseRpmData(data, diameter);
            return; // Skip default handler for RPM data
        }

        const inputMatches = [
            'INPUT:',
            'PRESS:',
            'RELEASE:'
        ]

        if (inputMatches.some(prefix => data.startsWith(prefix))) {
            sendKeysForInput(data);
            return; // Skip default handler for INPUT data
        }

        parseDefaultData(data); // Default handler for unrecognized data
    });

    // Handle port errors
    port.on('error', (error) => {
        console.error('❌ Port error:', error.message);
    });

    // Handle port close
    port.on('close', () => {
        console.log('🔌 Port closed');
    });

    // Handle process termination
    process.on('SIGINT', () => {
        console.log('\n👋 Closing connection...');
        port.close(() => {
            process.exit(0);
        });
    });
}

/**
 * Connect to selected serial port and read data
 */
async function connectToPort(portPath, baudRate = 9600) {
    return new Promise((resolve, reject) => {
        console.log(`\nConnecting to ${portPath} at ${baudRate} baud...`);
        
        const port = new SerialPort({
            path: portPath,
            baudRate: baudRate,
            autoOpen: false
        });

        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

        port.open((error) => {
            if (error) {
                console.error('Failed to open port:', error.message);
                reject(error);
                return;
            }

            console.log('✅ Port opened successfully!');
            console.log('📡 Listening for data... (Press Ctrl+C to exit)\n');

            setupPortHandlers(port, parser);
            resolve(port);
        });
    });
}

/**
 * Main CLI application
 */
async function main() {
    console.log('🔌 Velolink Serial Port CLI');
    console.log('===========================\n');

    try {

        console.log('Input your diameter in mm (default: 700):');
        diameter = await number({
            message: 'Enter diameter:',
            default: 700,
            validate: (value) => {
                const num = parseInt(value);
                if (isNaN(num) || num <= 0) {
                    return 'Please enter a valid positive number';
                }
                return true;
            }
        });

        // List available ports
        console.log('🔍 Scanning for available serial ports...');
        const ports = await listSerialPorts();

        if (ports.length === 0) {
            console.log('❌ No serial ports found. Please check your connections.');
            return;
        }

        console.log(`✅ Found ${ports.length} serial port(s)\n`);

        // Format ports for selection
        const portChoices = ports.map(formatPortChoice);

        // Let user select a port
        const selectedPort = await select({
            message: 'Select a serial port to connect:',
            choices: portChoices,
            pageSize: 10
        });

        console.log(`\n📍 Selected port: ${selectedPort}`);

        // Ask for baud rate (optional, default to 9600)
        const customBaudRate = await confirm({
            message: 'Do you want to use a custom baud rate? (default: 9600)',
            default: false
        });

        let baudRate = 9600;
        if (customBaudRate) {
            const { input } = await import('@inquirer/prompts');
            const baudRateInput = await input({
                message: 'Enter baud rate:',
                default: '9600',
                validate: (value) => {
                    const num = parseInt(value);
                    if (isNaN(num) || num <= 0) {
                        return 'Please enter a valid positive number';
                    }
                    return true;
                }
            });
            baudRate = parseInt(baudRateInput);
        }

        // Connect to the selected port
        await connectToPort(selectedPort, baudRate);

    } catch (error) {
        if (error.name === 'ExitPromptError') {
            console.log('\n👋 Goodbye!');
        } else {
            console.error('❌ Application error:', error.message);
        }
        process.exit(1);
    }
}

import { fileURLToPath } from 'url';
import { dirname, parse } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run the CLI if this file is executed directly
if (process.argv[1] === __filename) {
    main().catch(console.error);
}

export { main, listSerialPorts, connectToPort };
