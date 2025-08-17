import robot from 'robotjs';
import fs from 'fs';
import path from 'path';

// Speed and distance tracking
class SpeedDistanceTracker {
    constructor() {
        this.rpmReadings = [];
        this.totalDistance = 0;
        this.currentSpeed = 0;
        this.lastCalculationTime = Date.now();
        this.sessionStartTime = Date.now();
        
        // Advanced metrics
        this.maxSpeed = 0;
        this.speedReadings = [];
        this.speedTimeIntervals = {}; // Track time spent in speed intervals
        this.lastSpeedInterval = null;
        this.lastIntervalTime = Date.now();
        
        // Initialize speed intervals (0-10, 10-20, 20-30, etc. km/h)
        for (let i = 0; i <= 100; i += 10) {
            this.speedTimeIntervals[`${i}-${i + 10}km/h`] = 0;
        }
        
        // Calculate speed and distance every second
        setInterval(() => this.calculateSpeedAndDistance(), 1000);
        
        // Setup graceful shutdown handlers
        this.setupExitHandlers();
    }
    
    addRpmReading(rpm, diameter) {
        const timestamp = Date.now();
        this.rpmReadings.push({ rpm, diameter, timestamp });
        
        // Keep only readings from the last second
        const oneSecondAgo = timestamp - 1000;
        this.rpmReadings = this.rpmReadings.filter(reading => reading.timestamp > oneSecondAgo);
    }
    
    calculateSpeedAndDistance() {
        if (this.rpmReadings.length === 0) {
            this.currentSpeed = 0;
            this.updateSpeedInterval(0);
            return;
        }
        
        // Calculate average RPM from readings in the last second
        const avgRpm = this.rpmReadings.reduce((sum, reading) => sum + reading.rpm, 0) / this.rpmReadings.length;
        const diameterMm = this.rpmReadings[this.rpmReadings.length - 1].diameter; // Use latest diameter in mm
        
        // Convert diameter from mm to meters
        const diameterM = diameterMm / 1000;
        
        // Calculate wheel circumference (diameter in meters)
        const circumference = Math.PI * diameterM;
        
        // Convert RPM to speed (m/s)
        // RPM * circumference / 60 = meters per second
        this.currentSpeed = (avgRpm * circumference) / 60;
        const speedKmh = this.currentSpeed * 3.6;
        
        // Track max speed
        if (speedKmh > this.maxSpeed) {
            this.maxSpeed = speedKmh;
        }
        
        // Add speed reading for average calculation
        this.speedReadings.push(speedKmh);
        
        // Update speed interval tracking
        this.updateSpeedInterval(speedKmh);
        
        // Calculate distance traveled in the last second
        const distanceThisSecond = this.currentSpeed; // speed in m/s * 1 second
        this.totalDistance += distanceThisSecond;
        
        console.log(`RPM: ${avgRpm.toFixed(1)} | Speed: ${this.currentSpeed.toFixed(2)} m/s (${speedKmh.toFixed(2)} km/h) | Distance: ${this.totalDistance.toFixed(2)} m`);
    }
    
    
    updateSpeedInterval(speedKmh) {
        const currentTime = Date.now();
        const intervalDuration = currentTime - this.lastIntervalTime;
        
        // Add time to previous interval if it exists
        if (this.lastSpeedInterval !== null) {
            this.speedTimeIntervals[this.lastSpeedInterval] += intervalDuration;
        }
        
        // Determine current speed interval
        let currentInterval = null;
        for (let i = 0; i <= 100; i += 10) {
            if (speedKmh >= i && speedKmh < i + 10) {
                currentInterval = `${i}-${i + 10}km/h`;
                break;
            }
        }
        
        if (speedKmh >= 110) {
            currentInterval = '100+km/h';
            if (!this.speedTimeIntervals[currentInterval]) {
                this.speedTimeIntervals[currentInterval] = 0;
            }
        }
        
        this.lastSpeedInterval = currentInterval;
        this.lastIntervalTime = currentTime;
    }
    
    getAverageSpeed() {
        if (this.speedReadings.length === 0) return 0;
        return this.speedReadings.reduce((sum, speed) => sum + speed, 0) / this.speedReadings.length;
    }
    
    getSessionDuration() {
        return (Date.now() - this.sessionStartTime) / 1000; // in seconds
    }
    
    generateSessionReport() {
        const sessionDuration = this.getSessionDuration();
        const avgSpeed = this.getAverageSpeed();
        
        // Convert speed intervals from ms to minutes
        const speedIntervalsMinutes = {};
        Object.entries(this.speedTimeIntervals).forEach(([interval, timeMs]) => {
            speedIntervalsMinutes[interval] = (timeMs / 1000 / 60).toFixed(2); // minutes
        });
        
        return {
            sessionInfo: {
                startTime: new Date(this.sessionStartTime).toISOString(),
                endTime: new Date().toISOString(),
                duration: `${Math.floor(sessionDuration / 60)}m ${Math.floor(sessionDuration % 60)}s`,
                durationSeconds: sessionDuration
            },
            speedMetrics: {
                maxSpeed: `${this.maxSpeed.toFixed(2)} km/h`,
                avgSpeed: `${avgSpeed.toFixed(2)} km/h`,
                speedIntervalsMinutes: speedIntervalsMinutes
            },
            distanceMetrics: {
                totalDistance: `${this.totalDistance.toFixed(2)} m`,
                totalDistanceKm: `${(this.totalDistance / 1000).toFixed(3)} km`
            },
            additionalData: {
                totalSpeedReadings: this.speedReadings.length,
                avgDistancePerReading: this.speedReadings.length > 0 ? `${(this.totalDistance / this.speedReadings.length).toFixed(2)} m` : '0 m'
            }
        };
    }
    
    saveSessionReport() {
        try {
            const report = this.generateSessionReport();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `velolink-session-${timestamp}.json`;
            const filepath = path.join(process.cwd(), filename);
            
            fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
            console.log(`\n📊 Session report saved to: ${filename}`);
            console.log(`📈 Max Speed: ${report.speedMetrics.maxSpeed}`);
            console.log(`📈 Avg Speed: ${report.speedMetrics.avgSpeed}`);
            console.log(`📏 Total Distance: ${report.distanceMetrics.totalDistanceKm}`);
            console.log(`⏱️  Session Duration: ${report.sessionInfo.duration}`);
        } catch (error) {
            console.error('Error saving session report:', error);
        }
    }
    
    setupExitHandlers() {
        const gracefulShutdown = () => {
            console.log('\n🛑 Shutting down Velolink Client...');
            this.saveSessionReport();
            process.exit(0);
        };
        
        // Handle different exit signals
        process.on('SIGINT', gracefulShutdown);  // Ctrl+C
        process.on('SIGTERM', gracefulShutdown); // Termination signal
        process.on('exit', () => this.saveSessionReport()); // Process exit
    }

    getSpeed() {
        return this.currentSpeed; // m/s
    }
    
    getSpeedKmh() {
        return this.currentSpeed * 3.6; // km/h
    }
    
    getTotalDistance() {
        return this.totalDistance; // meters
    }
    
    reset() {
        this.totalDistance = 0;
        this.rpmReadings = [];
        this.currentSpeed = 0;
        this.maxSpeed = 0;
        this.speedReadings = [];
        this.speedTimeIntervals = {};
        this.sessionStartTime = Date.now();
        
        // Reinitialize speed intervals
        for (let i = 0; i <= 100; i += 10) {
            this.speedTimeIntervals[`${i}-${i + 10}km/h`] = 0;
        }
    }
}

// Initialize speed tracker
const speedTracker = new SpeedDistanceTracker();

const parseRpmData = (data, diameter) => {
    const rpm = parseRpm(data);
    
    // Add RPM reading to speed tracker
    speedTracker.addRpmReading(rpm, diameter);
    
    sendKeysForRpm(rpm);
}

const parseRpm = (data) => {
    const [, rpmValue] = data.split(':');
    const [raw, filtered] = rpmValue.trim().split(',');
    const rpm = Math.min(parseFloat(raw), parseFloat(filtered));

    return rpm;
};

const sendKeysForRpm = (rpm) => {
    if (isNaN(rpm)) {
        console.error('Invalid RPM value:', rpm);
        return;
    }

    if (rpm > 25) {
        new Array(Math.round(rpm / 50))
            .fill(null)
            .forEach(() => {
                // TODO: enable later 
                robot.keyTap('w');
            });
    }
}

export { parseRpmData, speedTracker }