//  V3. Precise slow scrubbing + fast scrubbing when track not playing 
var JogWheel = {};  // Namespace for jog wheel logic

// Configuration constants
JogWheel.TICKS_PER_REV   = 128;       // Effective ticks per revolution for scratch mode
JogWheel.VINYL_RPM       = 33 + 1/3;    // Simulated vinyl speed (33⅓ RPM)
JogWheel.ALPHA           = 1.0/8.0;     // Scratch filter alpha (controls inertia)
JogWheel.BETA            = JogWheel.ALPHA / 32.0;  // Scratch filter beta (damping)
JogWheel.MAX_SCALING     = 5;           // Maximum dynamic scaling multiplier
JogWheel.SCRUB_SCALING   = 0.001;       // Lower scaling factor for scrubbing when paused (for precise control)

// State tracking arrays (index: deck number; decks 1 and 2 are used)
JogWheel.scratchActive = [false, false, false];
JogWheel.releaseTimer  = [null, null, null];
JogWheel.lastTickTime  = [0, 0, 0];  // Timestamp of last tick for each deck
JogWheel.tickCount     = [0, 0, 0];  // Count of ticks in a short time window

/**
 * Jog wheel rotation handler with improved scrubbing precision when not playing.
 *
 * @param {number} channel - MIDI channel (1 for deck 1, 2 for deck 2)
 * @param {number} control - MIDI CC number (e.g., 0x10)
 * @param {number} value   - MIDI value (0-127; Arduino sends 1 for +1 tick, 127 for -1 tick)
 * @param {number} status  - MIDI status byte (e.g., 0xB0 for channel 1)
 * @param {string} group   - Mixxx group (e.g., "[Channel1]" or "[Channel2]")
 */
JogWheel.turn = function(channel, control, value, status, group) {
    var deck = (group === "[Channel2]") ? 2 : 1;

    // Convert MIDI value to a signed relative movement.
    // Values above 64 represent negative movement (e.g., 127 becomes -1).
    var movement = (value > 64) ? (value - 128) : value;

    // Time tracking for dynamic scaling
    var currentTime = Date.now();
    var timeDiff = currentTime - JogWheel.lastTickTime[deck];

    // Reset tick count if too much time has passed
    if (timeDiff > 150) {
        JogWheel.tickCount[deck] = 0;
    }
    JogWheel.tickCount[deck]++;
    JogWheel.lastTickTime[deck] = currentTime;

    // Calculate a dynamic scaling factor based on the tick rate.
    // For fast spins, speedFactor increases; for slow spins, it stays near 1.
    var speedFactor = Math.min(1 + JogWheel.tickCount[deck] / 10, JogWheel.MAX_SCALING);

    // Check whether the deck is playing (Mixxx "play" property is 1 when playing)
    var isPlaying = (engine.getValue("[Channel" + deck + "]", "play") == 1);

    if (isPlaying) {
        // When playing, use scratch mode for realistic vinyl behavior.
        if (!JogWheel.scratchActive[deck]) {
            engine.scratchEnable(deck, JogWheel.TICKS_PER_REV, JogWheel.VINYL_RPM, JogWheel.ALPHA, JogWheel.BETA);
            JogWheel.scratchActive[deck] = true;
        }
        // Apply full dynamic scaling for scratching.
        engine.scratchTick(deck, movement * speedFactor);

        // Reset the release timer for scratch mode.
        if (JogWheel.releaseTimer[deck] !== null) {
            engine.stopTimer(JogWheel.releaseTimer[deck]);
            JogWheel.releaseTimer[deck] = null;
        }
        JogWheel.releaseTimer[deck] = engine.beginTimer(50, function() {
            engine.scratchDisable(deck);
            JogWheel.scratchActive[deck] = false;
            JogWheel.releaseTimer[deck] = null;
        }, true);
    } else {
        // When not playing, adjust the track position directly for scrubbing.
        // For fine control, apply dynamic scaling only when ticks are abundant.
        // For slow movements (tickCount <= 3), use a fixed scaling factor.
        var effectiveScaling = (JogWheel.tickCount[deck] > 3) ? speedFactor : 1;
        var adjustedMovement = movement * effectiveScaling;
        var pos = engine.getValue("[Channel" + deck + "]", "playposition");
        pos += (adjustedMovement * JogWheel.SCRUB_SCALING);
        // Clamp the play position between 0 and 1.
        if (pos < 0) pos = 0;
        if (pos > 1) pos = 1;
        engine.setValue("[Channel" + deck + "]", "playposition", pos);
    }
};
