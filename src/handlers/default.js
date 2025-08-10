const parseDefaultData = (data) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Received: ${data.trim()}`);
}

export { parseDefaultData }
