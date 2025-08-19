import robot from 'robotjs';

export function sendKeysForInput(input) {

    const [command, value] = input.split(':');

    try {
        switch (command) {
            case 'INPUT':
                robot.keyTap(value.trim());
                break;
            case 'PRESS':
                robot.keyToggle(value.trim(), 'down');
                break;
            case 'RELEASE':
                robot.keyToggle(value.trim(), 'up');
                break;
            default:
                console.warn(`Unknown command: ${command}`);
        }
    } catch (error) {
        console.error('Error sending keys:', error);
    }
}