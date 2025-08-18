// --- Bluetooth (HC-05) using hardware serial pins 0,1 ---
// Note: Cannot use Serial Monitor when using pins 0,1 for HC-05
// All output goes through Bluetooth only
// --- Configuration ---
const int IR_SENSOR_PIN = 2; // Digital pin 2 or 3 for external interrupts on Uno

// button
const int LEFT_BTN_PIN = 13;
const int RIGHT_BTN_PIN = 12;
bool leftButtonPressed = false; // Track if button was already pressed
bool rightButtonPressed = false; // Track if button was already pressed

// Set the number of pulses your sensor generates for ONE complete revolution.
// If you put 4 reflective strips, set this to 4.
const float PULSES_PER_REVOLUTION = 8.0; 

// Measurement window in milliseconds. This is how often the RPM is calculated.
// A shorter window means faster updates but potentially more jitter if pulses_per_revolution is low.
// A longer window means smoother readings but slower response.
const unsigned long MEASUREMENT_WINDOW_MS = 250; // Calculate RPM every 250 milliseconds

// Moving average filter size. A larger size gives more stable readings but
// slower response to actual RPM changes. Adjust based on your application.
const int FILTER_SIZE = 10; 

// --- Volatile Variables (shared between ISR and main loop) ---
// pulseCount: Incremented by the ISR for every pulse detected.
volatile unsigned long pulseCount = 0;

// --- Global Variables for RPM Calculation and Filtering ---
float currentRPM = 0.0;
float rpmReadings[FILTER_SIZE];
int filterIndex = 0;
float sumRpmReadings = 0.0;
bool filterInitialized = false;

// --- ISR: Handles the pulse detection ---
// This function MUST be as fast and lean as possible.
// Only increment the counter.
void handlePulse() {
  pulseCount++;
}

// --- Setup Function ---
void setup() {
  Serial.begin(9600); // HC-05 baud rate - this now goes to HC-05 on pins 0,1
  Serial.println("Arduino RPM Calculator - Bluetooth Output");
  Serial.println("---------------------------------------");

  pinMode(IR_SENSOR_PIN, INPUT_PULLUP); // Use internal pull-up resistor
  // pinMode(9, OUTPUT);
  // digitalWrite(9, HIGH);

  // Attach interrupt to the IR sensor pin.
  attachInterrupt(digitalPinToInterrupt(IR_SENSOR_PIN), handlePulse, FALLING); 

  pinMode(LEFT_BTN_PIN, INPUT);
  pinMode(RIGHT_BTN_PIN, INPUT);

  // Initialize filter array with zeros
  for (int i = 0; i < FILTER_SIZE; i++) {
    rpmReadings[i] = 0.0;
  }
}

// --- Main Loop ---
void loop() {
  calculateRpm();
  buttonDetection();
}

void buttonDetection() {
  // Read the state of the button pin.
  // It will be HIGH when the button is pressed and LOW when it's not.

  // Check if the button is pressed (state is HIGH) and hasn't been pressed before.
  if (digitalRead(LEFT_BTN_PIN) == HIGH && !leftButtonPressed) {
    leftButtonPressed = true; // Mark as pressed to prevent future prints
    // If the button is pressed for the first time, print a message.
    Serial.println("INPUT:A");
  } else if (digitalRead(LEFT_BTN_PIN) == LOW) {
    leftButtonPressed = false; // Reset the pressed state when button is released
  }

  // Check if the right button is pressed (state is HIGH) and hasn't been pressed before.
  if (digitalRead(RIGHT_BTN_PIN) == HIGH && !rightButtonPressed) {
    rightButtonPressed = true; // Mark as pressed to prevent future prints
    // If the button is pressed for the first time, print a message.
    Serial.println("INPUT:D");
  } else if (digitalRead(RIGHT_BTN_PIN) == LOW) {
    rightButtonPressed = false; // Reset the pressed state when button is released
  }
}

void calculateRpm() {
  static unsigned long lastMeasurementTime = 0;
  static unsigned long lastPulseCountSnapshot = 0; // To store pulseCount from previous interval

  // Check if it's time to calculate RPM
  if (millis() - lastMeasurementTime >= MEASUREMENT_WINDOW_MS) {
    lastMeasurementTime = millis();

    unsigned long currentPulseCount = 0;
    
    // --- Critical Section: Safely read and reset volatile variables ---
    noInterrupts(); // Temporarily disable interrupts
    currentPulseCount = pulseCount; // Read the current total pulse count
    pulseCount = 0;                 // Reset the counter for the next interval
    interrupts();   // Re-enable interrupts
    // --- End Critical Section ---

    // Calculate pulses detected in the *last* measurement window
    // (This works because pulseCount was reset to 0 at the start of the current window)
    unsigned long pulsesInWindow = currentPulseCount; 

    // Calculate RPM based on pulses in the measurement window
    // RPM = (pulses / PULSES_PER_REVOLUTION) / (MEASUREMENT_WINDOW_MS / 1000.0 seconds) * 60 seconds/minute
    float calculatedRPM = (float)pulsesInWindow / PULSES_PER_REVOLUTION;
    calculatedRPM /= (MEASUREMENT_WINDOW_MS / 1000.0); // Convert ms to seconds for division
    calculatedRPM *= 60.0; // Convert revolutions per second to revolutions per minute

    // --- Moving Average Filter ---
    // Subtract the oldest reading from the sum
    sumRpmReadings -= rpmReadings[filterIndex]; 
    // Add the new reading to the array
    rpmReadings[filterIndex] = calculatedRPM;
    // Add the new reading to the sum
    sumRpmReadings += rpmReadings[filterIndex];
    // Move to the next index, wrap around if at the end
    filterIndex = (filterIndex + 1) % FILTER_SIZE;

    // Calculate the current filtered RPM
    if (!filterInitialized && filterIndex == FILTER_SIZE - 1 && sumRpmReadings > 0) {
        // This ensures the filter is filled at least once for a true average
        filterInitialized = true;
    }

    if (filterInitialized) {
        currentRPM = sumRpmReadings / FILTER_SIZE;
    } else {
        // Before the filter is fully populated, just use the raw calculated RPM
        currentRPM = calculatedRPM; 
    }

    // --- Display RPM via Bluetooth only ---
    Serial.print("RPM:");
    Serial.print(calculatedRPM, 2); // Print with 2 decimal places
    Serial.print(",");
    Serial.println(currentRPM, 2);
  }
}