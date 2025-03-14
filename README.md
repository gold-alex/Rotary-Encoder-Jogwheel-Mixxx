# Arduino JogWheel for Mixxx

This setup turns an Arduino Leonardo (or any Arduino board recognized as a USB MIDI device) into a DJ jogwheel controller for Mixxx, using a rotary encoder.

## Hardware Requirements

- **Arduino Leonardo** (or another Arduino board with native USB support, such as Micro or Pro Micro)
- **Rotary encoder** (we used EN16-H20AF15 - [DigiKey link](https://www.digikey.com/en/products/detail/tt-electronics-bi/EN16-H20AF15/2408777))
- **Connecting wires**
- **Optional:** Enclosure for the controller

## Overview

The system consists of three main components:
- **Arduino Code:** Reads rotary encoder movements and sends them as MIDI CC messages
- **Mixxx Mapping XML:** Maps the MIDI messages to Mixxx controls
- **JavaScript Handler:** Processes the jog wheel movements for precise control

## Wiring

Connect the rotary encoder to the Arduino as follows:
- Encoder pin A → Arduino digital pin 2
- Encoder pin B → Arduino digital pin 3
- Encoder common/ground → Arduino GND

## Installation Instructions

### 1. Upload Arduino Code
- Install the Arduino IDE from [arduino.cc](https://www.arduino.cc/)
- Install the MIDIUSB library:
  - In Arduino IDE: Tools → Manage Libraries → Search for "MIDIUSB" → Install
- Connect your Arduino to your computer
- Open `arduino_code_jogwheel.cpp` in the Arduino IDE
- Select your board type (e.g., Arduino Leonardo)
- Upload the code to your Arduino

### 2. Install Mixxx Mapping Files
- Download the Mixxx mapping files:
  - `Arduino_JogWheel.midi.xml`
  - `Arduino_JogWheel_v3.js`
- Place these files in your Mixxx controllers directory:
   - `Settings>Controllers>Open User Mapping Folder`
- Launch Mixxx
- Go to Preferences → Controllers
- Select "Arduino JogWheel Controller" from the list
- Click "Enable" and then "OK"

## Usage

Once installed and configured:
- Connect your Arduino to your computer via USB
- Launch Mixxx
- The jog wheel should automatically be detected and work with Mixxx

### Functionality
- **When track is playing:** Rotate the jog wheel to temporarily speed up or slow down the track (like scratching on vinyl)
- **When track is paused:** Rotate the jog wheel for precise cueing and scrubbing
  - Slow movements provide fine control
  - Fast movements scale dynamically for quicker navigation

## Customization

### Changing MIDI Channel
If you want to use multiple controllers or change the MIDI channel:
- In `arduino_code_jogwheel.cpp`, modify the `MIDI_CHANNEL` constant (1-16)
- Update the corresponding `<status>` value in the XML mapping file:
  - Channel 1: 0xB0
  - Channel 2: 0xB1
  - And so on...

### Adjusting Sensitivity
To change the jog wheel sensitivity:
- In `Arduino_JogWheel_v3.js`, adjust these constants:
  - `JogWheel.TICKS_PER_REV`: Higher values make rotation less sensitive
  - `JogWheel.SCRUB_SCALING`: Lower values make scrubbing more precise

## Troubleshooting

- **No response from jog wheel:**
  - Ensure Arduino is properly connected and recognized as a MIDI device
  - Check that the controller is enabled in Mixxx preferences
  - Verify encoder wiring connections
- **Erratic movement:**
  - Try adding debounce capacitors (0.1μF) between encoder pins and ground
  - Adjust the encoder reading code in the Arduino sketch
- **Wrong direction:**
  - Swap the encoder A and B pin connections, or
  - Modify the Arduino code to invert the direction logic

## Advanced Features

The JavaScript handler includes:
- Dynamic scaling based on rotation speed
- Different behavior for playing vs. paused tracks
- Simulated vinyl inertia when scratching

## License

This project is open source and free to use, modify, and distribute.