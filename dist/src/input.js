(function () {
  "use strict";

  const activeKeys = new Set();
  let restartRequested = false;
  let easyRequested = false;
  let hardRequested = false;
  let realismRequested = false;
  let selectionRequested = false;
  let menuUpRequested = false;
  let menuDownRequested = false;
  let menuActivateRequested = false;
  let backRequested = false;
  let debugToggleRequested = false;
  const handledKeys = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Backspace",
    "Digit1",
    "Digit2",
    "Digit3",
    "Enter",
    "Escape",
    "KeyA",
    "KeyD",
    "KeyH",
    "KeyR",
    "KeyS",
    "KeyW",
    "Space",
  ]);

  function setKey(event, isDown) {
    if (!handledKeys.has(event.code)) {
      return;
    }

    event.preventDefault();

    if (isDown) {
      activeKeys.add(event.code);

      if (event.repeat) {
        return;
      }

      if (event.code === "KeyR") {
        restartRequested = true;
      } else if (event.code === "Digit1") {
        easyRequested = true;
      } else if (event.code === "Digit2") {
        hardRequested = true;
      } else if (event.code === "Digit3") {
        realismRequested = true;
      } else if (event.code === "Escape") {
        selectionRequested = true;
        backRequested = true;
      } else if (event.code === "KeyH") {
        debugToggleRequested = true;
      } else if (event.code === "ArrowUp" || event.code === "KeyW") {
        menuUpRequested = true;
      } else if (event.code === "ArrowDown" || event.code === "KeyS") {
        menuDownRequested = true;
      } else if (event.code === "Enter" || event.code === "Space") {
        menuActivateRequested = true;
      } else if (event.code === "Backspace") {
        backRequested = true;
      }
    } else {
      activeKeys.delete(event.code);
    }
  }

  window.addEventListener("keydown", function (event) {
    setKey(event, true);
  });

  window.addEventListener("keyup", function (event) {
    setKey(event, false);
  });

  window.RacingInput = {
    steerLeft: function () {
      return activeKeys.has("ArrowLeft") || activeKeys.has("KeyA");
    },
    steerRight: function () {
      return activeKeys.has("ArrowRight") || activeKeys.has("KeyD");
    },
    braking: function () {
      return activeKeys.has("ArrowDown") || activeKeys.has("KeyS");
    },
    restart: function () {
      return activeKeys.has("KeyR");
    },
    consumeRestart: function () {
      const requested = restartRequested;
      restartRequested = false;
      return requested;
    },
    consumeDifficulty: function () {
      if (easyRequested) {
        easyRequested = false;
        hardRequested = false;
        realismRequested = false;
        return "easy";
      }

      if (hardRequested) {
        hardRequested = false;
        realismRequested = false;
        return "hard";
      }

      if (realismRequested) {
        realismRequested = false;
        return "realism";
      }

      return null;
    },
    consumeSelection: function () {
      const requested = selectionRequested;
      selectionRequested = false;
      return requested;
    },
    consumeMenuUp: function () {
      const requested = menuUpRequested;
      menuUpRequested = false;
      return requested;
    },
    consumeMenuDown: function () {
      const requested = menuDownRequested;
      menuDownRequested = false;
      return requested;
    },
    consumeMenuActivate: function () {
      const requested = menuActivateRequested;
      menuActivateRequested = false;
      return requested;
    },
    consumeBack: function () {
      const requested = backRequested;
      backRequested = false;
      selectionRequested = false;
      return requested;
    },
    clearMenuRequests: function () {
      menuUpRequested = false;
      menuDownRequested = false;
      menuActivateRequested = false;
      backRequested = false;
      selectionRequested = false;
    },
    clearDifficultyRequests: function () {
      easyRequested = false;
      hardRequested = false;
      realismRequested = false;
    },
    consumeDebugToggle: function () {
      const requested = debugToggleRequested;
      debugToggleRequested = false;
      return requested;
    },
  };
})();
