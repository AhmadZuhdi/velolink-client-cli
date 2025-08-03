// Game Input Testing Example
// This script demonstrates how to use the KeySimulator for games

const KeySimulator = require('../modules/keySimulator');

async function testGameInputs() {
    const keySimulator = new KeySimulator();
    
    console.log('🎮 Testing Game Input Methods...\n');
    
    // Enable game mode (uses robotjs instead of node-key-sender)
    keySimulator.setGameMode(true);
    
    console.log('📊 Current Status:', keySimulator.getStatus());
    
    // Wait a bit before starting
    await delay(2000);
    console.log('🚀 Starting tests in 3 seconds...');
    await delay(1000);
    console.log('⏰ 2...');
    await delay(1000);
    console.log('⏰ 1...');
    await delay(1000);
    
    try {
        // Test basic key presses
        console.log('\n🔤 Testing basic keys...');
        await keySimulator.sendKey('w'); // Move forward in most games
        await delay(500);
        await keySimulator.sendKey('a'); // Move left
        await delay(500);
        await keySimulator.sendKey('s'); // Move backward
        await delay(500);
        await keySimulator.sendKey('d'); // Move right
        await delay(500);
        
        // Test key combinations
        console.log('\n🔗 Testing key combinations...');
        await keySimulator.sendCombination(['ctrl', 'shift']); // Common game combo
        await delay(500);
        
        // Test holding keys (useful for movement in games)
        console.log('\n⬇️ Testing key hold and release...');
        await keySimulator.keyDown('w'); // Hold W to move forward
        await delay(1000); // Hold for 1 second
        await keySimulator.keyUp('w'); // Release W
        await delay(500);
        
        // Test mouse clicks (if game requires mouse input)
        console.log('\n🖱️ Testing mouse input...');
        // Click at center of screen (adjust coordinates for your screen resolution)
        await keySimulator.mouseClick(960, 540, 'left');
        await delay(500);
        
        // Test function keys (common in games)
        console.log('\n⚡ Testing function keys...');
        await keySimulator.sendKey('f1'); // Often used for help or inventory
        await delay(500);
        await keySimulator.sendKey('escape'); // Menu/cancel
        await delay(500);
        
        // Test using the performAction method
        console.log('\n🎯 Testing predefined actions...');
        await keySimulator.performAction('space'); // Jump in many games
        await delay(500);
        await keySimulator.performAction('key_down', 'shift'); // Hold shift (run/sneak)
        await delay(1000);
        await keySimulator.performAction('key_up', 'shift'); // Release shift
        
        console.log('\n✅ All tests completed successfully!');
        console.log('\n💡 Tips for game compatibility:');
        console.log('   • Make sure the game window is active/focused');
        console.log('   • Some games block all programmatic input (anti-cheat)');
        console.log('   • Try running as administrator if needed');
        console.log('   • Adjust timing delays if inputs seem too fast');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

async function testWithDifferentMethods() {
    const keySimulator = new KeySimulator();
    
    console.log('\n🔄 Comparing input methods...\n');
    
    // Test with node-key-sender (default)
    console.log('📝 Testing with node-key-sender...');
    keySimulator.setGameMode(false);
    await keySimulator.sendKey('1');
    await delay(1000);
    
    // Test with robotjs (game mode)
    console.log('🎮 Testing with robotjs (game mode)...');
    keySimulator.setGameMode(true);
    await keySimulator.sendKey('2');
    await delay(1000);
    
    console.log('✅ Method comparison complete!');
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Export functions for use in other scripts
module.exports = {
    testGameInputs,
    testWithDifferentMethods
};

// Run tests if this script is executed directly
if (require.main === module) {
    console.log('🎮 Game Input Test Suite');
    console.log('========================\n');
    
    testGameInputs()
        .then(() => testWithDifferentMethods())
        .then(() => {
            console.log('\n🏁 All tests finished!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Test suite failed:', error);
            process.exit(1);
        });
}
