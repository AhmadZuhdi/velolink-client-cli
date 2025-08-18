// --- Bluetooth (HC-05) using hardware serial pins 0,1 ---
// Note: Cannot use Serial Monitor when using pins 0,1 for HC-05
// All output goes through Bluetooth only
// --- Configuration ---
const int IR_SENSOR_PIN = 2; // Digital pin 2 or 3 for external interrupts on Uno

// button
const int LEFT_BTN_PIN = 13;
const int RIGHT_BTN_PIN = 12;

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
// PULSE_COUNT: Incremented by the ISR for every pulse detected.
volatile unsigned long PULSE_COUNT = 0;

// --- Global Variables for RPM Calculation and Filtering ---
float CURRENT_RPM = 0.0;
float RPM_READINGS[FILTER_SIZE];
int FILTER_INDEX = 0;
float SUM_RPM_READINGS = 0.0;
bool FILTER_INITIALIZED = false;

// --- ISR: Handles the pulse detection ---
// This function MUST be as fast and lean as possible.
// Only increment the counter.
void handlePulse() {
  PULSE_COUNT++;
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
    RPM_READINGS[i] = 0.0;
  }
}

// --- Main Loop ---
void loop() {
  bool stop = buttonDetection();

  if (stop) {
    delay(100);
    // return;  
  }

  calculateRpm();
}

bool buttonDetection() {
  // Read the state of the button pin.
  // It will be HIGH when the button is pressed and LOW when it's not.

  // Check if the button is pressed (state is HIGH) and hasn't been pressed before.
  if (digitalRead(LEFT_BTN_PIN) == HIGH) {
    // If the button is pressed for the first time, print a message.
    Serial.println("INPUT:A");
    return true;
  }

  // Check if the right button is pressed (state is HIGH) and hasn't been pressed before.
  if (digitalRead(RIGHT_BTN_PIN) == HIGH) {
    // If the button is pressed for the first time, print a message.
    Serial.println("INPUT:D");
    return true;
  }

  return false;
}

void calculateRpm() {
  static unsigned long LAST_MEASUREMENT_TIME = 0;
  static unsigned long LAST_PULSE_COUNT_SNAPSHOT = 0; // To store PULSE_COUNT from previous interval

  // Check if it's time to calculate RPM
  if (millis() - LAST_MEASUREMENT_TIME >= MEASUREMENT_WINDOW_MS) {
    LAST_MEASUREMENT_TIME = millis();

    unsigned long CURRENT_PULSE_COUNT = 0;
    
    // --- Critical Section: Safely read and reset volatile variables ---
    noInterrupts(); // Temporarily disable interrupts
    CURRENT_PULSE_COUNT = PULSE_COUNT; // Read the current total pulse count
    PULSE_COUNT = 0;                 // Reset the counter for the next interval
    interrupts();   // Re-enable interrupts
    // --- End Critical Section ---

    // Calculate pulses detected in the *last* measurement window
    // (This works because PULSE_COUNT was reset to 0 at the start of the current window)
    unsigned long PULSES_IN_WINDOW = CURRENT_PULSE_COUNT; 

    // Calculate RPM based on pulses in the measurement window
    // RPM = (pulses / PULSES_PER_REVOLUTION) / (MEASUREMENT_WINDOW_MS / 1000.0 seconds) * 60 seconds/minute
    float CALCULATED_RPM = (float)PULSES_IN_WINDOW / PULSES_PER_REVOLUTION;
    CALCULATED_RPM /= (MEASUREMENT_WINDOW_MS / 1000.0); // Convert ms to seconds for division
    CALCULATED_RPM *= 60.0; // Convert revolutions per second to revolutions per minute

    // --- Moving Average Filter ---
    // Subtract the oldest reading from the sum
    SUM_RPM_READINGS -= RPM_READINGS[FILTER_INDEX]; 
    // Add the new reading to the array
    RPM_READINGS[FILTER_INDEX] = CALCULATED_RPM;
    // Add the new reading to the sum
    SUM_RPM_READINGS += RPM_READINGS[FILTER_INDEX];
    // Move to the next index, wrap around if at the end
    FILTER_INDEX = (FILTER_INDEX + 1) % FILTER_SIZE;

    // Calculate the current filtered RPM
    if (!FILTER_INITIALIZED && FILTER_INDEX == FILTER_SIZE - 1 && SUM_RPM_READINGS > 0) {
        // This ensures the filter is filled at least once for a true average
        FILTER_INITIALIZED = true;
    }

    if (FILTER_INITIALIZED) {
        CURRENT_RPM = SUM_RPM_READINGS / FILTER_SIZE;
    } else {
        // Before the filter is fully populated, just use the raw calculated RPM
        CURRENT_RPM = CALCULATED_RPM; 
    }

    // --- Display RPM via Bluetooth only ---
    Serial.print("RPM:");
    Serial.print(CALCULATED_RPM, 2); // Print with 2 decimal places
    Serial.print(",");
    Serial.println(CURRENT_RPM, 2);
  }
}