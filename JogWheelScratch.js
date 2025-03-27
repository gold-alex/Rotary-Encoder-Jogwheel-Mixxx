/*******************************************************************
 * JogWheelScratch.js
 * 
 * Goals:
 *  - Extremely fine scrubbing (no big jumps when paused).
 *  - Less forward drift when rocking back & forth in scratch mode.
 *  - Lower sensitivity (you must rotate the encoder more to move).
 *******************************************************************/
var JogWheel = {};

// 1) Increase TICKS_PER_REV from 96 -> 192
//    This halves scratch sensitivity again.
JogWheel.TICKS_PER_REV   = 96;

// 2) "Heavier" vinyl & more damping to reduce drifting
//    ALPHA = 1/16 => bigger inertia (less easy to keep spinning), 
//    BETA  = ALPHA / 64 => more damping (stops creeping).
JogWheel.VINYL_RPM       = 33 + 1/3;
JogWheel.ALPHA           = 1.0 / 16.0;
JogWheel.BETA            = JogWheel.ALPHA / 64.0;

// 3) If you truly want zero "fast spin" boost, keep MAX_SCALING=1.
//    If you want a slight boost at quick spins, try 2 or 3.
JogWheel.MAX_SCALING     = 1.25;

// 4) Very fine scrubbing: 0.0001 is smaller than 0.0003.
//    This means slow movements produce extremely tiny position changes.
JogWheel.SCRUB_SCALING   = 0.0001;

// Internal states
JogWheel.scratchActive   = [false, false, false];
JogWheel.releaseTimer    = [null, null, null];
JogWheel.lastTickTime    = [0, 0, 0];
JogWheel.tickCount       = [0, 0, 0];

/**
 * Called whenever Mixxx gets a relative MIDI tick for your jog:
 *   channel=1 => deck1, channel=2 => deck2
 *   value=1 => +1 step, 127 => -1 step
 */
JogWheel.turn = function(channel, control, value, status, group) {
    var deck = (group === "[Channel2]") ? 2 : 1;

    // Convert 0..127 to signed movement
    var movement = (value > 64) ? (value - 128) : value;

    // Time-based spin detection
    var now = Date.now();
    var timeDiff = now - JogWheel.lastTickTime[deck];
    if (timeDiff > 150) {
        JogWheel.tickCount[deck] = 0;
    }
    JogWheel.tickCount[deck]++;
    JogWheel.lastTickTime[deck] = now;

    // The speedFactor won't exceed 1 if MAX_SCALING=1.
    // If you want *some* speed ramp, set MAX_SCALING=2 or 3 or so.
    var speedFactor = Math.min(1 + JogWheel.tickCount[deck] / 10, JogWheel.MAX_SCALING);

    var isPlaying = (engine.getValue("[Channel" + deck + "]", "play") === 1);

    if (isPlaying) {
        // -------------------------------------------------
        // SCRATCH MODE
        // -------------------------------------------------
        if (!JogWheel.scratchActive[deck]) {
            engine.scratchEnable(deck,
                                 JogWheel.TICKS_PER_REV,
                                 JogWheel.VINYL_RPM,
                                 JogWheel.ALPHA,
                                 JogWheel.BETA);
            JogWheel.scratchActive[deck] = true;
        }
        // Movement is scaled by speedFactor (often =1 if MAX_SCALING=1).
        engine.scratchTick(deck, movement * speedFactor);

        // Release timer to turn off scratching after 50ms idle
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
        // -------------------------------------------------
        // SCRUB MODE (paused)
        // -------------------------------------------------
        // If turning slowly, effectiveScaling=1 => super fine movement.
        // If user spins quickly (tickCount>3), we apply speedFactor for a slight faster move.
        var effectiveScaling = (JogWheel.tickCount[deck] > 3) ? speedFactor : 1;

        var pos = engine.getValue("[Channel" + deck + "]", "playposition");
        pos += (movement * effectiveScaling * JogWheel.SCRUB_SCALING);

        // Clamp 0..1
        if (pos < 0) pos = 0;
        if (pos > 1) pos = 1;
        engine.setValue("[Channel" + deck + "]", "playposition", pos);
    }
};
