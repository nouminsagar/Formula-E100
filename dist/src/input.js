(function () {
  "use strict";

  const activeKeys = new Set();
  const logicalInput = {
    left: false,
    right: false,
    brake: false,
    jumpPressed: false,
  };
  const touchActions = {
    left: new Set(),
    right: new Set(),
    brake: new Set(),
  };
  const touchButtons = {};
  const pointerActions = new Map();
  let restartRequested = false;
  let easyRequested = false;
  let hardRequested = false;
  let realismRequested = false;
  let selectionRequested = false;
  let menuUpRequested = false;
  let menuDownRequested = false;
  let menuActivateRequested = false;
  let backRequested = false;
  let jumpRequested = false;
  let touchJumpRequested = false;
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
        if (event.code === "Space") {
          jumpRequested = true;
        }
      } else if (event.code === "Backspace") {
        backRequested = true;
      }
    } else {
      activeKeys.delete(event.code);
    }

    updateLogicalInput();
  }

  function updateLogicalInput() {
    logicalInput.left = activeKeys.has("ArrowLeft") || activeKeys.has("KeyA") || touchActions.left.size > 0;
    logicalInput.right = activeKeys.has("ArrowRight") || activeKeys.has("KeyD") || touchActions.right.size > 0;
    logicalInput.brake = activeKeys.has("ArrowDown") || activeKeys.has("KeyS") || touchActions.brake.size > 0;
    logicalInput.jumpPressed = jumpRequested || touchJumpRequested;
  }

  window.addEventListener("keydown", function (event) {
    setKey(event, true);
  });

  window.addEventListener("keyup", function (event) {
    setKey(event, false);
  });

  function setButtonPressed(action, isPressed) {
    const button = touchButtons[action];

    if (button) {
      button.classList.toggle("is-pressed", isPressed);
    }

    updateLogicalInput();
  }

  function refreshTouchButtonStates() {
    setButtonPressed("left", touchActions.left.size > 0);
    setButtonPressed("right", touchActions.right.size > 0);
    setButtonPressed("brake", touchActions.brake.size > 0);
  }

  function releasePointer(pointerId) {
    const action = pointerActions.get(pointerId);

    if (!action) {
      return;
    }

    pointerActions.delete(pointerId);

    if (touchActions[action]) {
      touchActions[action].delete(pointerId);
    }

    refreshTouchButtonStates();
  }

  function clearTouchInputs() {
    touchActions.left.clear();
    touchActions.right.clear();
    touchActions.brake.clear();
    pointerActions.clear();
    touchJumpRequested = false;
    refreshTouchButtonStates();
    setButtonPressed("jump", false);
    updateLogicalInput();
  }

  function setupTouchControls() {
    const buttons = Array.prototype.slice.call(document.querySelectorAll("[data-touch-action]"));

    buttons.forEach(function (button) {
      const action = button.getAttribute("data-touch-action");

      touchButtons[action] = button;

      button.addEventListener("pointerdown", function (event) {
        event.preventDefault();

        if (button.setPointerCapture) {
          try {
            button.setPointerCapture(event.pointerId);
          } catch (error) {
            // Synthetic or interrupted pointer events may not be capturable.
          }
        }

        if (action === "jump") {
          if (button.getAttribute("aria-disabled") !== "true") {
            touchJumpRequested = true;
            setButtonPressed("jump", true);
            updateLogicalInput();
          }
          return;
        }

        if (touchActions[action]) {
          pointerActions.set(event.pointerId, action);
          touchActions[action].add(event.pointerId);
          refreshTouchButtonStates();
          updateLogicalInput();
        }
      });

      ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (eventName) {
        button.addEventListener(eventName, function (event) {
          event.preventDefault();

          if (action === "jump") {
            setButtonPressed("jump", false);
          }

          releasePointer(event.pointerId);
        });
      });
    });
  }

  window.addEventListener("blur", clearTouchInputs);
  window.addEventListener("orientationchange", clearTouchInputs);
  window.addEventListener("resize", clearTouchInputs);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      clearTouchInputs();
    }
  });

  setupTouchControls();

  window.RacingInput = {
    steerLeft: function () {
      updateLogicalInput();
      return logicalInput.left;
    },
    steerRight: function () {
      updateLogicalInput();
      return logicalInput.right;
    },
    braking: function () {
      updateLogicalInput();
      return logicalInput.brake;
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
    consumeJump: function () {
      const requested = jumpRequested || touchJumpRequested;
      jumpRequested = false;
      touchJumpRequested = false;
      updateLogicalInput();
      return requested;
    },
    clearMenuRequests: function () {
      menuUpRequested = false;
      menuDownRequested = false;
      menuActivateRequested = false;
      jumpRequested = false;
      touchJumpRequested = false;
      backRequested = false;
      selectionRequested = false;
      updateLogicalInput();
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
    clearTouchInputs: clearTouchInputs,
  };
})();
