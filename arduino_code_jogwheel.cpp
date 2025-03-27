/********************************************************************
 *  JogWheel.ino
 *  Uses:
 *    - Paul Stoffregen's Encoder library for mechanical encoder
 *    - Native USB MIDI (MIDIUSB.h) on Arduino Leonardo/ATmega32U4
 *
 *  Wiring (with hardware RC debounce):
 *    - EN16 encoder A -> 2.2kΩ -> pin 2; 0.1µF from pin 2 to GND
 *    - EN16 encoder B -> 2.2kΩ -> pin 3; 0.1µF from pin 3 to GND
 *    - EN16 Common    -> Arduino GND
 ********************************************************************/

#include <MIDIUSB.h>     // Native USB MIDI for ATmega32U4
#include <Encoder.h>     // Paul Stoffregen's Encoder library

// Create an Encoder object: pinA, pinB
Encoder jogWheel(2, 3);

// Track the last known position from the library
long lastPosition = 0;

// MIDI settings
const byte MIDI_CHANNEL = 1;  // 1..16 => 0xB0 + (channel-1)
const byte JOG_CC       = 0x10; // CC #16 decimal

//------------------------------------------------------------------
// Send a MIDI Control Change event: +1 or -1 relative tick
//------------------------------------------------------------------
void sendJogMidi(int8_t relValue) {
  // 0x0B = USB MIDI "Control Change"
  // 0xB0 | ((MIDI_CHANNEL-1) & 0x0F) => 0xB0 for channel 1
  midiEventPacket_t event = {
    0x0B, 
    (uint8_t)(0xB0 | ((MIDI_CHANNEL - 1) & 0x0F)),
    JOG_CC,
    (uint8_t)relValue
  };
  MidiUSB.sendMIDI(event);
}

//------------------------------------------------------------------
// Setup
//------------------------------------------------------------------
void setup() {
  // Pin modes with internal pullups
  pinMode(2, INPUT_PULLUP);
  pinMode(3, INPUT_PULLUP);

  // Optional: reset encoder reading to 0
  jogWheel.write(0);
  lastPosition = 0;

  // (No attachInterrupt needed because the Encoder library does that under the hood)
}

//------------------------------------------------------------------
// Loop
//------------------------------------------------------------------
void loop() {
  long newPosition = jogWheel.read();
  long delta = newPosition - lastPosition;

  if (delta != 0) {
    if (delta > 0) {
      // For each positive step, send 0x01
      for (long i = 0; i < delta; i++) {
        sendJogMidi(0x01);
      }
    } else {
      // For each negative step, send 0x7F (127 => -1 in 7-bit two's complement)
      for (long i = 0; i > delta; i--) {
        sendJogMidi(0x7F);
      }
    }
    lastPosition = newPosition;
    MidiUSB.flush();  // Ensure messages go out immediately
  }
}
