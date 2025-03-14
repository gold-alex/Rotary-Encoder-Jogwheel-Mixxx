// In this example I am using an Arduino Leonardo
#include "MIDIUSB.h"  // Arduino MIDI USB library (Please be wary THIS WILL NOT WORK on Arduino MEGA or boards not supporting native USB support for MIDI)

// Encoder pin assignments
const uint8_t ENC_PIN_A = 2;
const uint8_t ENC_PIN_B = 3;

// MIDI settings for jog wheel
const byte MIDI_CHANNEL = 1;       // MIDI channel (1-16) for this jog wheel
const byte JOG_CC        = 0x10;   // MIDI CC number for jog wheel movement

// Volatile variables changed inside ISR
volatile int encoderDelta = 0;     // Accumulated encoder movement since last MIDI send
volatile uint8_t lastState = 0;    // Last encoder state (pins A and B)

// Interrupt Service Routine for encoder pin changes
void encoderISR() {
  // Read current state of both pins (bit0 = pin B, bit1 = pin A)
  uint8_t currentState = (digitalRead(ENC_PIN_A) << 1) | digitalRead(ENC_PIN_B);
  uint8_t stateTransition = (lastState << 2) | currentState;
  // Determine direction by looking at valid state transitions (Gray code sequence)
  switch (stateTransition) {
    case 0b0001: case 0b0111: case 0b1110: case 0b1000:
      // Clockwise rotation
      encoderDelta++;
      break;
    case 0b0010: case 0b0100: case 0b1101: case 0b1011:
      // Counter-clockwise rotation
      encoderDelta--;
      break;
    default:
      // Invalid transition (possibly due to bounce), ignore
      break;
  }
  lastState = currentState;
}

// Helper function to send a MIDI Control Change message
void sendJogMidi(int8_t relValue) {
  // Construct MIDI event (0x0B = ControlChange message, 0xB0 | (MIDI_CHANNEL-1) = status byte)
  midiEventPacket_t event = {0x0B, (uint8_t)(0xB0 | ((MIDI_CHANNEL-1) & 0x0F)), JOG_CC, (uint8_t)relValue};
  MidiUSB.sendMIDI(event);
}

void setup() {
  // Configure encoder pins as inputs with pullups (assuming encoder common to GND)
  pinMode(ENC_PIN_A, INPUT_PULLUP);
  pinMode(ENC_PIN_B, INPUT_PULLUP);
  // Initialize lastState to current pin state to avoid spurious movement at startup
  lastState = (digitalRead(ENC_PIN_A) << 1) | digitalRead(ENC_PIN_B);
  // Attach interrupts to both encoder channels on any change
  attachInterrupt(digitalPinToInterrupt(ENC_PIN_A), encoderISR, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENC_PIN_B), encoderISR, CHANGE);
}

void loop() {
  // Check if encoder moved since last loop iteration
  noInterrupts();               // Temporarily disable interrupts to safely read shared data
  int delta = encoderDelta;
  encoderDelta = 0;             // Reset the delta counter
  interrupts();                 // Re-enable interrupts

  if (delta != 0) {
    // Send one or more MIDI messages corresponding to the movement
    if (delta > 0) {
      // For positive delta, send one increment per tick
      for (int i = 0; i < delta; ++i) {
        sendJogMidi(0x01);      // 0x01 (1) = one tick clockwise
      }
    } else if (delta < 0) {
      // For negative delta, send one decrement per tick
      for (int i = 0; i > delta; --i) {
        sendJogMidi(0x7F);      // 0x7F (127) = one tick counter-clockwise (two's complement -1)
      }
    }
    MidiUSB.flush();  // Flush MIDI output to ensure messages are sent immediately
  }
}
