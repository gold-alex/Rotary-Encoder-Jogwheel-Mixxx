//  V1. - static fast scrub
var JogWheel = {};  // Namespace for our jog wheel functions and state

// Configuration constants for scratch behavior
JogWheel.TICKS_PER_REV = 128;       // Effective ticks per revolution (using 128 for finer resolution)
JogWheel.VINYL_RPM    = 33 + 1/3;    // Simulated vinyl rotation speed (33⅓ RPM standard)
JogWheel.ALPHA        = 1.0/8.0;     // Scratch filter alpha (controls inertia)
JogWheel.BETA         = JogWheel.ALPHA / 32.0;  // Scratch filter beta (provides braking)

// State tracking for each deck (index 1 for deck 1, index 2 for deck 2)
JogWheel.scratchActive = [false, false, false];  // Scratch mode flag per deck
JogWheel.releaseTimer  = [null, null, null];       // Timer for releasing scratch mode

/**
 * Jog wheel rotation handler.
 * This function is called by Mixxx whenever a jog wheel MIDI CC message is received.
 *
 * @param {number} channel - MIDI channel (1 for deck 1, 2 for deck 2)
 * @param {number} control - MIDI CC number (e.g., 0x10)
 * @param {number} value   - MIDI value (0-127; our Arduino sends 1 for +1 tick, 127 for -1 tick)
 * @param {number} status  - MIDI status byte (e.g., 0xB0 for channel 1)
 * @param {string} group   - Mixxx group, such as "[Channel1]" or "[Channel2]"
 */
JogWheel.turn = function(channel, control, value, status, group) {
    // Determine which deck based on the group string
    var deck = 1;
    if (group === "[Channel2]") {
        deck = 2;
    }

    // Convert the 7-bit MIDI value to a signed relative movement.
    // Our Arduino sends 1 for +1 tick, and 127 (0x7F) represents -1 tick.
    var movement;
    if (value > 64) {
        // For values 65-127: convert to negative (e.g., 127 becomes -1)
        movement = value - 128;
    } else {
        // For values 0-64: these are positive movements (e.g., 1 becomes +1)
        movement = value;
    }

    // If scratch mode is not active on this deck, enable it.
    if (!JogWheel.scratchActive[deck]) {
        engine.scratchEnable(deck, JogWheel.TICKS_PER_REV, JogWheel.VINYL_RPM, JogWheel.ALPHA, JogWheel.BETA);
        JogWheel.scratchActive[deck] = true;
    }

    // Pass the movement to Mixxx's scratch engine.
    engine.scratchTick(deck, movement);

    // Cancel any pending release timer since new movement has been detected.
    if (JogWheel.releaseTimer[deck] !== null) {
        engine.stopTimer(JogWheel.releaseTimer[deck]);
        JogWheel.releaseTimer[deck] = null;
    }

    // Start a one-shot timer to disable scratch mode after 50ms of inactivity.
    JogWheel.releaseTimer[deck] = engine.beginTimer(50, function() {
        engine.scratchDisable(deck);
        JogWheel.scratchActive[deck] = false;
        JogWheel.releaseTimer[deck] = null;
    }, true);
};