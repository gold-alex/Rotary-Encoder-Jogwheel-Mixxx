// MyController-scripts.js

// Declare the controller object; the functionprefix in the XML must match "MyController".
var MyController = {};

// Initialization function called when Mixxx loads the mapping.
MyController.init = function(id, debugging) {
    console.log("MyController mapping loaded with id: " + id + " debugging: " + debugging);
};

// Shutdown function called when the mapping is disabled or Mixxx shuts down.
MyController.shutdown = function() {
    console.log("MyController mapping shutting down.");
};

/**
 * MyController.jog handles incoming MIDI messages from the jog encoder.
 *
 * Our Arduino sends a value of 65 (0x41) for one step clockwise and 63 (0x3F) for one step counterclockwise.
 * This produces a raw value of (value - 64): +1 for clockwise and -1 for counterclockwise.
 *
 * To invert the direction, we multiply by -1.
 * To boost the sensitivity (if clockwise is working only half as well), we multiply by 2.
 *
 * Adjust the multiplier as needed.
 */
MyController.jog = function(channel, control, value, status, group) {
    var raw = value - 64;           // raw movement: +1 for 65, -1 for 63
    var sensitivity = 2;            // change this factor to adjust how strong the jog turns are
    var movement = -raw * sensitivity;  // invert direction and apply sensitivity scaling
    console.log("MyController.jog on " + group +
                ": channel=" + channel +
                ", control=0x" + control.toString(16) +
                ", value=0x" + value.toString(16) +
                " (raw=" + raw + ", movement=" + movement + ")");
    engine.setValue(group, "jog", movement);
};
