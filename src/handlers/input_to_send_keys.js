import robot from 'robotjs';

export function sendKeysForInput(input) {

    const [, value] = input.split(':');

    try {
        robot.keyTap(value.toLowerCase().trim());
    } catch (error) {
        console.error('Error sending keys:', error);
    }
}