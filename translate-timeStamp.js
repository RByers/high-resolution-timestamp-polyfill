// The MIT License (MIT)
// Copyright (c) 2016 Majid Valipour

// Browsers (and the DOM spec) are in the process of moving the event timestamp
// from being a DOMTimeStamp (mostly relative to Date.now()) to being a
// DOMHighResTimeStamp (always relative to performance.now()).

// A simple utility function that translates an Event.timeStamp to a
// DOMHighResTimeStamp that can be compare with performance.now(). This becomes
// a no-op for browsers that provide high resolution event timestamp.
//
// Usage example:
// var latency = performance.now() - getHighResTimeStamp(event);
getHighResTimeStamp = (function() {
  var dateNowAtLoad = Date.now();
  // The offset value to system startup clock that is being used by Firefox as
  // timebase for all input events.
  var systemStartupClockOffset;

  // Optimization: Check if this browser is already using DOMHighResTimeStamp
  // for event timestamp and return a no-op function in that case.
  var testTimeStamp = !!window.CustomEvent ? new CustomEvent('test').timeStamp : document.createEvent('KeyboardEvent').timeStamp;
  if (testTimeStamp <= performance.now())
    return function(event) {
      return event.timeStamp;
    };

  function getTimebaseOffset(event) {
    if (event.timeStamp >= dateNowAtLoad) {
      // Timestamp uses Unix epoch timebase
      return -performance.timing.navigationStart;
    } else {
      var now = performance.now();
      if (event.timeStamp <= now) {
        // Timestamp is high resolution
        return 0;
      } else {
        // Timestamp uses system startup timebase which is specific to Firefox.
        // Firefox uses two timebases for event timestamps:
        //   1. System startup used for all input events.
        //   2. Unix epoch for all user script constructed events.
        // (1) is handled here but (2) is handled above.

        // Compute system startup clock offset which is the difference between
        // current time in high resolution clock vs system startup clock. We use
        // the passed in event timestamp as an approximation of the current time
        // in the system startup clock.
        return systemStartupClockOffset || (systemStartupClockOffset = Math.round(now - event.timeStamp));
      }
    }
  }

  return function(event) {
    // Some events in Firefox have timeStamp of 0. For these generate a
    // timeStamp.
    if (!event.timeStamp)
      return event.__polyfilled_timestamp || (this.__polyfilled_timestamp = performance.now());

    return event.timeStamp + getTimebaseOffset(event);
  }
})();