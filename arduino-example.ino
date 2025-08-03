/*
  Velolink Arduino Controller
  
  This Arduino sketch demonstrates how to send commands to the Velolink Client Desktop
  application via HC-05 Bluetooth module.
  
  Hardware Setup:
  - HC-05 VCC -> Arduino 5V
  - HC-05 GND -> Arduino GND
  - HC-05 TX -> Arduino Pin 2 (RX)
  - HC-05 RX -> Arduino Pin 3 (TX)
  - Buttons on pins 4, 5, 6
  - Potentiometer on A0
  - Light sensor (LDR) on A1
  
  Author: Velolink Project
  Date: 2025
*/

#include <SoftwareSerial.h>

// HC-05 Bluetooth module connections
SoftwareSerial bluetooth(2, 3); // RX, TX

// Input pins
const int BUTTON_1 = 4;
const int BUTTON_2 = 5;
const int BUTTON_3 = 6;
const int POT_PIN = A0;
const int LIGHT_SENSOR_PIN = A1;

// Button states
bool button1State = false;
bool button2State = false;
bool button3State = false;
bool lastButton1State = false;
bool lastButton2State = false;
bool lastButton3State = false;

// Sensor values
int potValue = 0;
int lightValue = 0;
int lastPotValue = 0;
int lastLightValue = 0;

// Timing
unsigned long lastSensorRead = 0;
unsigned long lastHeartbeat = 0;
const unsigned long SENSOR_INTERVAL = 100;  // Read sensors every 100ms
const unsigned long HEARTBEAT_INTERVAL = 5000; // Send heartbeat every 5 seconds

void setup() {
  // Initialize serial communications
  Serial.begin(9600);
  bluetooth.begin(9600);
  
  // Initialize input pins
  pinMode(BUTTON_1, INPUT_PULLUP);
  pinMode(BUTTON_2, INPUT_PULLUP);
  pinMode(BUTTON_3, INPUT_PULLUP);
  
  // Send startup message
  Serial.println("Velolink Arduino Controller Starting...");
  bluetooth.println("HELLO");
  
  delay(1000);
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read button states
  readButtons();
  
  // Read sensors periodically
  if (currentTime - lastSensorRead >= SENSOR_INTERVAL) {
    readSensors();
    lastSensorRead = currentTime;
  }
  
  // Send heartbeat periodically
  if (currentTime - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    bluetooth.println("HEARTBEAT");
    Serial.println("Heartbeat sent");
    lastHeartbeat = currentTime;
  }
  
  // Check for incoming commands from desktop app
  if (bluetooth.available()) {
    String command = bluetooth.readString();
    command.trim();
    Serial.println("Received: " + command);
    handleCommand(command);
  }
  
  delay(10); // Small delay to prevent overwhelming the system
}

void readButtons() {
  // Read current button states
  button1State = !digitalRead(BUTTON_1); // Inverted because of INPUT_PULLUP
  button2State = !digitalRead(BUTTON_2);
  button3State = !digitalRead(BUTTON_3);
  
  // Check for button state changes
  if (button1State != lastButton1State) {
    String command = "BTN1:" + String(button1State ? "ON" : "OFF");
    bluetooth.println(command);
    Serial.println("Sent: " + command);
    lastButton1State = button1State;
  }
  
  if (button2State != lastButton2State) {
    String command = "BTN2:" + String(button2State ? "ON" : "OFF");
    bluetooth.println(command);
    Serial.println("Sent: " + command);
    lastButton2State = button2State;
  }
  
  if (button3State != lastButton3State) {
    String command = "BTN3:" + String(button3State ? "ON" : "OFF");
    bluetooth.println(command);
    Serial.println("Sent: " + command);
    lastButton3State = button3State;
  }
}

void readSensors() {
  // Read analog sensors
  potValue = analogRead(POT_PIN);
  lightValue = analogRead(LIGHT_SENSOR_PIN);
  
  // Send potentiometer value if it changed significantly
  if (abs(potValue - lastPotValue) > 10) {
    String command = "A0:" + String(potValue);
    bluetooth.println(command);
    Serial.println("Sent: " + command);
    lastPotValue = potValue;
  }
  
  // Send light sensor value if it changed significantly
  if (abs(lightValue - lastLightValue) > 20) {
    String command = "A1:" + String(lightValue);
    bluetooth.println(command);
    Serial.println("Sent: " + command);
    lastLightValue = lightValue;
  }
}

void handleCommand(String command) {
  // Handle commands received from the desktop application
  if (command == "STATUS") {
    bluetooth.println("ONLINE");
  }
  else if (command == "LED_ON") {
    digitalWrite(LED_BUILTIN, HIGH);
    bluetooth.println("LED_ON_OK");
  }
  else if (command == "LED_OFF") {
    digitalWrite(LED_BUILTIN, LOW);
    bluetooth.println("LED_OFF_OK");
  }
  else if (command == "SENSOR_DATA") {
    // Send current sensor readings
    bluetooth.println("A0:" + String(analogRead(POT_PIN)));
    bluetooth.println("A1:" + String(analogRead(LIGHT_SENSOR_PIN)));
  }
  else {
    bluetooth.println("UNKNOWN_CMD");
  }
}

// Example scenario functions
void sendMediaCommand() {
  if (button1State) {
    bluetooth.println("PLAY");
  }
}

void sendVolumeControl() {
  int volume = map(potValue, 0, 1023, 0, 100);
  static int lastVolume = -1;
  
  if (abs(volume - lastVolume) > 5) {
    if (volume > lastVolume) {
      bluetooth.println("VOL_UP");
    } else {
      bluetooth.println("VOL_DOWN");
    }
    lastVolume = volume;
  }
}

void sendLightBasedCommands() {
  static bool wasLightOn = false;
  bool isLightOn = lightValue > 500;
  
  if (isLightOn && !wasLightOn) {
    bluetooth.println("LIGHT_ON");
    wasLightOn = true;
  } else if (!isLightOn && wasLightOn) {
    bluetooth.println("LIGHT_OFF");
    wasLightOn = false;
  }
}
