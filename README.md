# DIY Rotary Encoder Jog Wheel for Mixxx

A custom-built jog wheel controller for Mixxx DJ software using an Arduino Leonardo/ATmega32U4 board. This project provides precise vinyl-style control for both scratching and track positioning.

## Features

- Native USB MIDI communication
- Hardware debounced rotary encoder input
- Dual deck support (Channel 1 & 2)
- Configurable sensitivity and behavior
- Smooth vinyl emulation with adjustable inertia
- Fine-grained scrubbing control when paused

## Hardware Requirements

- Arduino Leonardo or compatible ATmega32U4 board
- Mechanical rotary encoder (EN16 or similar)
- 2x 2.2kΩ resistors
- 2x 0.1µF capacitors
- USB cable

## Wiring Diagram

```
Arduino Leonardo/ATmega32U4
--------------------------
Pin 2 (with 2.2kΩ) -> Encoder A
Pin 3 (with 2.2kΩ) -> Encoder B
GND              -> Encoder Common
```

Each encoder pin should have:
- A 2.2kΩ resistor in series
- A 0.1µF capacitor to ground for hardware debouncing

## Software Components

### 1. Arduino Code (`arduino_code_jogwheel.cpp`)
- Uses Paul Stoffregen's Encoder library
- Implements native USB MIDI communication
- Sends relative encoder movements as MIDI Control Change messages
- Channel 1: CC #16 (0x10) for Deck 1
- Channel 2: CC #16 (0x10) for Deck 2

### 2. Mixxx Mapping (`Mapping.midi.xml`)
- Defines the controller mapping for Mixxx
- Maps MIDI messages to deck controls
- Supports both channels for dual deck operation

### 3. Mixxx Script (`JogWheelScratch.js`)
- Implements vinyl emulation and scratching behavior
- Features:
  - Configurable ticks per revolution (default: 96)
  - Adjustable vinyl RPM (default: 33.33)
  - Fine-tuned inertia and damping
  - Speed-based movement scaling
  - Ultra-fine scrubbing control

## Configuration

The behavior can be customized by adjusting these parameters in `JogWheelScratch.js`:

```javascript
JogWheel.TICKS_PER_REV   = 96;    // Encoder resolution
JogWheel.VINYL_RPM       = 33 + 1/3;  // Vinyl speed
JogWheel.ALPHA           = 1.0 / 16.0;  // Inertia
JogWheel.BETA            = JogWheel.ALPHA / 64.0;  // Damping
JogWheel.MAX_SCALING     = 1.25;  // Speed boost limit
JogWheel.SCRUB_SCALING   = 0.0001;  // Scrubbing sensitivity
```

## Installation

1. Install the required Arduino libraries:
   - MIDIUSB
   - Encoder (by Paul Stoffregen)

2. Upload the Arduino code to your board

3. Copy the mapping and script files to your Mixxx controllers directory:
   - `Mapping.midi.xml` → `controllers/`
   - `JogWheelScratch.js` → `controllers/`

4. Enable the controller in Mixxx preferences

## Usage

- When a deck is playing: The jog wheel acts as a vinyl platter for scratching
- When a deck is paused: The jog wheel provides fine-grained track positioning
- The controller supports two decks independently (Channel 1 & 2)

## Troubleshooting

If you experience issues:
1. Verify the encoder wiring and debouncing components
2. Check that the Arduino is recognized as a MIDI device
3. Ensure the mapping and script files are in the correct Mixxx directories
4. Verify the MIDI channel settings match between Arduino and Mixxx

## License

This project is open source and available under the MIT License.
