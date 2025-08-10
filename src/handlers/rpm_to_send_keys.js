import robot from 'robotjs';

const parseRpmData = (data) => {
    const [, rpmValue] = data.split(':');
    const [raw, filtered] = rpmValue.trim().split(',');
    const rpm = Math.min(parseFloat(raw), parseFloat(filtered));

    if (rpm > 25) {
        new Array(Math.round(rpm / 25)).fill('w').forEach(key => robot.keyTap(key));
    }
}

export { parseRpmData }