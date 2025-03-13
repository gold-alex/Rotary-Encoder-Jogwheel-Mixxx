/*
  Rotary Encoder (3-pin, pins facing up) to USB MIDI Example

  Encoder Pins (Viewed from front, with shaft facing you, pins at the top):
    Left Pin: A (CLK)
    Middle Pin: GND (Common)
    Right Pin: B (DT)

  Connections:
    - Encoder A (left)  -> Arduino Digital Pin 2
    - Encoder GND (mid) -> Arduino GND
    - Encoder B (right) -> Arduino Digital Pin 3

  This code reads a mechanical rotary encoder and sends USB MIDI CC messages.
*/

#include <MIDIUSB.h>  // Make sure this library is installed

// === PIN DEFINITIONS ===
#define PIN_ENCODER_A 2
#define PIN_ENCODER_B 3

// === GLOBAL VARIABLES ===
int8_t lastEncoderState = 0;  // Tracks previous reading of A/B
int encoderValue = 64;        // Start at a middle CC value (range 0-127)
int lastSentValue = 64;       // Last value sent to the MIDI host

// Which MIDI CC do you want to send? (e.g., #7 is Volume, #10 is Pan, etc.)
const uint8_t midiCCNumber = 7;

// MIDI channel we’re sending on (0-15 in code, corresponds to Ch 1-16 in software)
const uint8_t midiChannel = 0;  // 0 => MIDI Channel 1

void setup() {
  // Use internal pull-up resistors
  pinMode(PIN_ENCODER_A, INPUT_PULLUP);
  pinMode(PIN_ENCODER_B, INPUT_PULLUP);

  // Initialize the encoder state
  lastEncoderState = readEncoderState();
}

void loop() {
  int8_t newState = readEncoderState();

  if (newState != lastEncoderState) {
    // Check direction by combining old and new states into a 4-bit pattern
    int direction = 0;
    int8_t combined = (lastEncoderState << 2) | newState;

    switch (combined) {
      case 0b0001:
      case 0b0111:
      case 0b1110:
      case 0b1000:
        direction = +1;  // Clockwise
        break;
      case 0b0010:
      case 0b0100:
      case 0b1101:
      case 0b1011:
        direction = -1;  // Counterclockwise
        break;
      default:
        // No valid transition
        break;
    }

    // Update encoderValue within the 0–127 range
    encoderValue += direction;
    if (encoderValue > 127) encoderValue = 127;
    if (encoderValue < 0) encoderValue = 0;

    if (encoderValue != lastSentValue) {
      sendControlChange(midiCCNumber, encoderValue, midiChannel);
      MidiUSB.flush();
      lastSentValue = encoderValue;
    }

    lastEncoderState = newState;
  }

  // Short delay to reduce mechanical noise (tweak as needed)
  delay(1);
}

// Reads the two encoder pins (A=bit1, B=bit0) and returns a 2-bit number (0-3)
int8_t readEncoderState() {
  int bitA = (digitalRead(PIN_ENCODER_A) == HIGH) ? 1 : 0;
  int bitB = (digitalRead(PIN_ENCODER_B) == HIGH) ? 1 : 0;
  return (bitA << 1) | bitB;
}

// Sends a Control Change message via USB MIDI
void sendControlChange(byte control, byte value, byte channel) {
  midiEventPacket_t event = { 0x0B, (byte)(0xB0 | channel), control, value };
  MidiUSB.sendMIDI(event);
}
