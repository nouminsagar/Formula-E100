(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const gameHud = document.getElementById("gameHud");
  const speedHud = document.getElementById("speedHud");
  const scoreHud = document.getElementById("scoreHud");
  const sugarcaneHud = document.getElementById("sugarcaneHud");
  const gameOverMessage = document.getElementById("gameOverMessage");
  const finalScoreMessage = document.getElementById("finalScoreMessage");
  const introScreen = document.getElementById("introScreen");
  const instructionsScreen = document.getElementById("instructionsScreen");
  const difficultyScreen = document.getElementById("difficultyScreen");
  const introOptionButtons = Array.prototype.slice.call(document.querySelectorAll("[data-intro-option]"));
  const difficultyOptionButtons = Array.prototype.slice.call(document.querySelectorAll("[data-difficulty]"));
  const instructionsBackButton = document.getElementById("instructionsBackButton");

  const BRAKE_SPEED = 30;
  const SCREEN = {
    intro: "intro",
    instructions: "instructions",
    difficulty: "difficulty",
    gameplay: "gameplay",
    gameOver: "gameOver",
  };
  const DIFFICULTIES = {
    easy: {
      id: "easy",
      laneCount: 4,
      laneDirections: ["sameDirection", "sameDirection", "sameDirection", "sameDirection"],
      trafficSpawnDelayMultiplier: 1.75,
      maxActiveTraffic: 2,
      crossingSpawnDelayMultiplier: 2,
      upgradeThresholds: [0, 10, 20, 30],
    },
    hard: {
      id: "hard",
      laneCount: 3,
      laneDirections: ["sameDirection", "sameDirection", "oncoming"],
      trafficSpawnDelayMultiplier: 1,
      maxActiveTraffic: 4,
      crossingSpawnDelayMultiplier: 1,
      upgradeThresholds: [0, 10, 30, 50],
    },
    realism: {
      id: "realism",
      laneCount: 2,
      laneDirections: ["sameDirection", "oncoming"],
      trafficSpawnDelayMultiplier: 0.65,
      maxActiveTraffic: 6,
      crossingSpawnDelayMultiplier: 1,
      upgradeThresholds: [0, 10, 60, 160],
    },
  };
  const PLAYER_TIERS = [
    {
      id: "tier1",
      maxSpeed: 80,
      fullSpeedPointsPerSecond: 2,
      sugarcaneFrequencyMultiplier: 2,
    },
    {
      id: "tier2",
      maxSpeed: 100,
      fullSpeedPointsPerSecond: 3,
      sugarcaneFrequencyMultiplier: 4,
    },
    {
      id: "tier3",
      maxSpeed: 150,
      fullSpeedPointsPerSecond: 5,
      sugarcaneFrequencyMultiplier: 8,
    },
    {
      id: "tier4",
      maxSpeed: 250,
      fullSpeedPointsPerSecond: 8,
      sugarcaneFrequencyMultiplier: 16,
    },
  ];
  const OBJECT_WORLD_UNITS_PER_KMH_SECOND = 0.004;
  const MOVEMENT_CONFIG = {
    adjustedTrafficSpeedKmh: 90,
    oncomingTierMultipliers: {
      tier1: 1.25,
      tier2: 1.5,
      tier3: 1.8,
      tier4: 2.16,
    },
    visualSpeedCurve: {
      maxReferenceSpeedKmh: 250,
      minWorldSpeed: 0,
      maxWorldSpeed: 25.7,
      exponent: 0.65,
    },
    trafficSpeedReferenceKmh: 200,
    parallax: {
      road: 1,
      nearShoulder: 0.95,
      nearRoadside: 0.9,
      midRoadside: 0.65,
      farFields: 0.35,
      horizon: 0.08,
    },
    sameDirectionTraffic: {
      referenceTrafficSpeedKmh: 90,
      minApproachRate: 0.09,
      maxApproachRate: 0.55,
      exponent: 1,
    },
    oncomingTraffic: {
      referenceTrafficSpeedKmh: 90,
      minClosingRate: 0.14,
      maxClosingRate: 0.86,
      exponent: 1,
    },
    deceleration: {
      epsilon: 0.05,
      exitDelay: 0.12,
      sameDirectionFactor: 0.3,
      oncomingMinFactor: 0.9,
      returnBlend: 0.15,
    },
  };
  const TRAFFIC_SPAWN_DELAY_RANGE = {
    min: 1.05,
    max: 1.05,
  };
  const TRAFFIC_RETRY_DELAY = 0.35;
  const TRAFFIC_SPAWN_DISTANCE = 1;
  const TRAFFIC_REMOVE_DISTANCE = -0.14;
  const TRAFFIC_SAME_LANE_GAP = 0.28;
  const TRAFFIC_ANY_LANE_GAP = 0.08;
  const TRAFFIC_TYPES = ["car", "rickshaw", "truck"];
  const DIRT_TRAFFIC_CONFIG = {
    maxPerSide: 2,
    spawnDelayRange: {
      min: 2,
      max: 3.5,
    },
    retryDelay: 0.45,
    sameDirectionProbability: 0.5,
    sameDirectionSpeedMultiplier: 0.8,
    oncomingSpeedMultiplier: 0.85,
  };
  const CROSSING_TYPES = ["human", "cow"];
  const CROSSING_SPAWN_DELAY = 4.2;
  const CROSSING_RETRY_DELAY = 0.45;
  const CROSSING_SPAWN_DISTANCE = 0.86;
  const CROSSING_REMOVE_DISTANCE = -0.12;
  const CROSSING_TRAFFIC_DEPTH_GAP = 0.12;
  const CROSSING_PROFILES = {
    human: {
      durationRange: {
        min: 1.25,
        max: 1.75,
      },
      laneWidth: 0.18,
    },
    cow: {
      durationRange: {
        min: 1.75,
        max: 2.35,
      },
      laneWidth: 0.34,
    },
  };
  const MAX_CROSSING_START_PROGRESS = 0.5;
  const MAX_ACTIVE_SUGARCANES = 20;
  const MAX_SUGARCANE_SPAWN_ATTEMPTS_PER_UPDATE = 12;
  const SUGARCANE_SPAWN_INTERVALS = {
    tier1: 1,
    tier2: 0.5,
    tier3: 0.25,
    tier4: 0.125,
  };
  const SUGARCANE_SPAWN_DISTANCE = 0.82;
  const SUGARCANE_REMOVE_DISTANCE = -0.12;
  const SUGARCANE_TRAFFIC_DISTANCE_GAP = 0.16;
  const SUGARCANE_CROSSING_DISTANCE_GAP = 0.12;
  const SUGARCANE_POSITION_GAP = 0.16;
  const SUGARCANE_SELF_DISTANCE_GAP = 0.08;
  const SUGARCANE_SELF_POSITION_GAP = 0.1;
  const SUGARCANE_SCORE_VALUE = 100;
  const FULL_SPEED_TOLERANCE = 0.05;
  const TRAFFIC_COLLISION_DEPTH_TOLERANCE = 0.055;
  const PASSED_DEPTH_MARGIN = 0.07;
  const ACCELERATION = 36;
  const BRAKE_DECELERATION = 72;
  const DIRT_DECELERATION = 72;
  const STEERING_SPEED = 0.85;
  const PLAYER_STEERING_POSES_PER_SECOND = 10;
  const PLAYER_SURFACES = {
    tarmac: "tarmac",
    leftDirt: "leftDirt",
    rightDirt: "rightDirt",
  };
  const DIRT_SPEED_MULTIPLIERS = {
    1: 0.60,
    2: 0.70,
    3: 0.80,
    4: 0.90,
  };
  const DIRT_STEERING_MULTIPLIERS = {
    1: 0.65,
    2: 0.72,
    3: 0.80,
    4: 0.88,
  };
  const DIRT_DRIFT_STRENGTHS = {
    1: 1.00,
    2: 0.82,
    3: 0.64,
    4: 0.46,
  };
  const DIRT_DRIFT_CONFIG = {
    maxPlayerXPerSecond: 0.45,
    targetInterval: {
      min: 0.40,
      max: 0.80,
    },
    transition: {
      min: 0.15,
      max: 0.25,
    },
    surfaceFadeSeconds: 0.20,
  };

  const state = {
    screen: SCREEN.intro,
    speed: 0,
    playerX: 0.5,
    playerTier: PLAYER_TIERS[0],
    playerAnimationTime: 0,
    playerSteeringPose: 0,
    playerSteeringPoseTimer: 0,
    playerBrakingVisual: false,
    playerSurface: PLAYER_SURFACES.tarmac,
    dirtEffectAmount: 0,
    dirtDriftTarget: 0,
    dirtDriftCurrent: 0,
    dirtDriftStart: 0,
    dirtDriftTargetTimer: 0,
    dirtDriftBlendTimer: 0,
    dirtDriftBlendDuration: DIRT_DRIFT_CONFIG.transition.min,
    difficulty: null,
    roadScroll: 0,
    traffic: [],
    trafficSpawnTimer: TRAFFIC_SPAWN_DELAY_RANGE.max,
    dirtTraffic: {
      left: [],
      right: [],
    },
    dirtTrafficSpawnTimers: {
      left: DIRT_TRAFFIC_CONFIG.spawnDelayRange.max,
      right: DIRT_TRAFFIC_CONFIG.spawnDelayRange.max,
    },
    crossingObstacle: null,
    crossingSpawnTimer: CROSSING_SPAWN_DELAY,
    sugarcanes: [],
    sugarcaneSpawnAccumulator: 0,
    distanceMetres: 0,
    sugarcaneCount: 0,
    fullSpeedScore: 0,
    liveScore: 0,
    finalScore: 0,
    introSelectionIndex: 0,
    previousPlayerSpeedKmh: 0,
    isPlayerDecelerating: false,
    decelerationStableTimer: 0,
    previousPositiveSameDirectionApproach: 0,
    decelReferenceSameDirectionApproach: 0,
    decelReferenceOncomingBaseClosing: 0,
    decelerationReturnTimer: 0,
    returnBlendSameDirectionStart: 0,
    returnBlendOncomingStart: 0,
    gameOver: false,
    debugHitboxes: false,
    restartWasDown: false,
    lastTime: performance.now(),
  };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * scale));
    canvas.height = Math.max(1, Math.floor(rect.height * scale));
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function currentDifficulty() {
    return state.difficulty || DIFFICULTIES.easy;
  }

  function trafficSpawnDelay() {
    const range = TRAFFIC_SPAWN_DELAY_RANGE;
    const baseDelay = range.min + Math.random() * (range.max - range.min);

    return baseDelay * currentDifficulty().trafficSpawnDelayMultiplier;
  }

  function crossingSpawnDelay() {
    return CROSSING_SPAWN_DELAY * currentDifficulty().crossingSpawnDelayMultiplier;
  }

  function sugarcaneSpawnDelay() {
    return SUGARCANE_SPAWN_INTERVALS[state.playerTier.id] || SUGARCANE_SPAWN_INTERVALS.tier1;
  }

  function oncomingTierMultiplier() {
    return MOVEMENT_CONFIG.oncomingTierMultipliers[state.playerTier.id] || MOVEMENT_CONFIG.oncomingTierMultipliers.tier1;
  }

  function kmhToWorldUnits(speedKmh) {
    return speedKmh * OBJECT_WORLD_UNITS_PER_KMH_SECOND;
  }

  function speedCurveRate(speedKmh, curve) {
    if (speedKmh <= 0) {
      return 0;
    }

    const normalizedSpeed = clamp(speedKmh / curve.maxReferenceSpeedKmh, 0, 1);

    return curve.minWorldSpeed + (curve.maxWorldSpeed - curve.minWorldSpeed) * Math.pow(normalizedSpeed, curve.exponent);
  }

  function worldVisualSpeed(speedKmh) {
    return speedCurveRate(speedKmh, MOVEMENT_CONFIG.visualSpeedCurve) * MOVEMENT_CONFIG.parallax.road;
  }

  function sameDirectionArcadeApproach(speedKmh) {
    const curve = MOVEMENT_CONFIG.sameDirectionTraffic;
    const normalizedSpeed = clamp(speedKmh / MOVEMENT_CONFIG.trafficSpeedReferenceKmh, 0, 1);
    const trafficCalibration = MOVEMENT_CONFIG.adjustedTrafficSpeedKmh / curve.referenceTrafficSpeedKmh;

    return (curve.minApproachRate + (curve.maxApproachRate - curve.minApproachRate) * Math.pow(normalizedSpeed, curve.exponent)) * trafficCalibration;
  }

  function oncomingArcadeBaseClosing(speedKmh) {
    const curve = MOVEMENT_CONFIG.oncomingTraffic;
    const normalizedSpeed = clamp(speedKmh / MOVEMENT_CONFIG.trafficSpeedReferenceKmh, 0, 1);
    const trafficCalibration = MOVEMENT_CONFIG.adjustedTrafficSpeedKmh / curve.referenceTrafficSpeedKmh;

    return (
      (curve.minClosingRate + (curve.maxClosingRate - curve.minClosingRate) * Math.pow(normalizedSpeed, curve.exponent)) *
      trafficCalibration
    );
  }

  function oncomingArcadeClosing(speedKmh) {
    return oncomingArcadeBaseClosing(speedKmh) * oncomingTierMultiplier();
  }

  function normalTrafficRelativeWorldSpeed(direction) {
    return direction === "oncoming" ? oncomingArcadeClosing(state.speed) : sameDirectionArcadeApproach(state.speed);
  }

  function decelerationSameDirectionApproach() {
    return state.decelReferenceSameDirectionApproach * MOVEMENT_CONFIG.deceleration.sameDirectionFactor;
  }

  function decelerationOncomingClosing() {
    return state.decelReferenceOncomingBaseClosing *
      oncomingTierMultiplier() *
      MOVEMENT_CONFIG.deceleration.oncomingMinFactor;
  }

  function currentDecelerationSameDirectionSpeed() {
    return Math.max(
      normalTrafficRelativeWorldSpeed("sameDirection"),
      decelerationSameDirectionApproach(),
      MOVEMENT_CONFIG.sameDirectionTraffic.minApproachRate
    );
  }

  function currentDecelerationOncomingSpeed() {
    return Math.max(
      normalTrafficRelativeWorldSpeed("oncoming"),
      decelerationOncomingClosing()
    );
  }

  function effectiveTrafficRelativeWorldSpeed(direction) {
    const normalSpeed = normalTrafficRelativeWorldSpeed(direction);

    if (state.isPlayerDecelerating) {
      return direction === "oncoming"
        ? currentDecelerationOncomingSpeed()
        : currentDecelerationSameDirectionSpeed();
    }

    if (state.decelerationReturnTimer > 0) {
      const blendAmount = 1 - state.decelerationReturnTimer / MOVEMENT_CONFIG.deceleration.returnBlend;
      const startSpeed = direction === "oncoming" ? state.returnBlendOncomingStart : state.returnBlendSameDirectionStart;

      return lerp(startSpeed, normalSpeed, clamp(blendAmount, 0, 1));
    }

    return normalSpeed;
  }

  function captureDecelerationReferences(previousSpeedKmh) {
    const normalSameDirectionApproach = sameDirectionArcadeApproach(previousSpeedKmh);
    const positiveSameDirectionReference = Math.max(
      state.previousPositiveSameDirectionApproach,
      normalSameDirectionApproach
    );

    state.decelReferenceSameDirectionApproach = positiveSameDirectionReference > 0
      ? positiveSameDirectionReference
      : MOVEMENT_CONFIG.sameDirectionTraffic.minApproachRate;
    state.decelReferenceOncomingBaseClosing = oncomingArcadeBaseClosing(previousSpeedKmh);
  }

  function beginDecelerationReturnBlend() {
    state.returnBlendSameDirectionStart = currentDecelerationSameDirectionSpeed();
    state.returnBlendOncomingStart = currentDecelerationOncomingSpeed();
    state.decelerationReturnTimer = MOVEMENT_CONFIG.deceleration.returnBlend;
  }

  function updateDecelerationState(deltaSeconds, previousSpeedKmh) {
    const speedDelta = state.speed - previousSpeedKmh;
    const isLosingSpeed = speedDelta < -MOVEMENT_CONFIG.deceleration.epsilon;
    const previousSameDirectionApproach = sameDirectionArcadeApproach(previousSpeedKmh);

    if (previousSameDirectionApproach > 0) {
      state.previousPositiveSameDirectionApproach = previousSameDirectionApproach;
    }

    if (isLosingSpeed) {
      if (!state.isPlayerDecelerating) {
        captureDecelerationReferences(previousSpeedKmh);
      }

      state.isPlayerDecelerating = true;
      state.decelerationStableTimer = 0;
      state.decelerationReturnTimer = 0;
      state.previousPlayerSpeedKmh = state.speed;
      return;
    }

    if (state.isPlayerDecelerating) {
      state.decelerationStableTimer += deltaSeconds;

      if (state.decelerationStableTimer >= MOVEMENT_CONFIG.deceleration.exitDelay) {
        beginDecelerationReturnBlend();
        state.isPlayerDecelerating = false;
        state.decelerationStableTimer = 0;
        state.decelReferenceSameDirectionApproach = 0;
        state.decelReferenceOncomingBaseClosing = 0;
      }
    } else if (state.decelerationReturnTimer > 0) {
      state.decelerationReturnTimer = Math.max(0, state.decelerationReturnTimer - deltaSeconds);
    }

    state.previousPlayerSpeedKmh = state.speed;
  }

  function maxActiveTraffic() {
    return currentDifficulty().maxActiveTraffic;
  }

  function randomInRange(range) {
    return range.min + Math.random() * (range.max - range.min);
  }

  function tierNumber(tier) {
    const id = tier && tier.id ? tier.id : "tier1";

    return Number(id.replace("tier", "")) || 1;
  }

  function playerIsOnDirt() {
    return state.playerSurface === PLAYER_SURFACES.leftDirt || state.playerSurface === PLAYER_SURFACES.rightDirt;
  }

  function dirtSpeedMultiplier() {
    return DIRT_SPEED_MULTIPLIERS[tierNumber(state.playerTier)] || DIRT_SPEED_MULTIPLIERS[1];
  }

  function dirtSteeringMultiplier() {
    return DIRT_STEERING_MULTIPLIERS[tierNumber(state.playerTier)] || DIRT_STEERING_MULTIPLIERS[1];
  }

  function dirtDriftStrength() {
    return DIRT_DRIFT_STRENGTHS[tierNumber(state.playerTier)] || DIRT_DRIFT_STRENGTHS[1];
  }

  function currentSurfaceMaxSpeed() {
    return playerIsOnDirt()
      ? state.playerTier.maxSpeed * dirtSpeedMultiplier()
      : state.playerTier.maxSpeed;
  }

  function resetDirtDrivingState() {
    state.playerSurface = PLAYER_SURFACES.tarmac;
    state.dirtEffectAmount = 0;
    state.dirtDriftTarget = 0;
    state.dirtDriftCurrent = 0;
    state.dirtDriftStart = 0;
    state.dirtDriftTargetTimer = 0;
    state.dirtDriftBlendTimer = 0;
    state.dirtDriftBlendDuration = DIRT_DRIFT_CONFIG.transition.min;
  }

  function updatePlayerSurface() {
    if (window.RacingRender.playerSurface) {
      state.playerSurface = window.RacingRender.playerSurface(canvas, state, state.playerSurface);
    } else {
      state.playerSurface = PLAYER_SURFACES.tarmac;
    }
  }

  function chooseDirtDriftTarget() {
    state.dirtDriftStart = state.dirtDriftCurrent;
    state.dirtDriftTarget = -1 + Math.random() * 2;
    state.dirtDriftBlendDuration = randomInRange(DIRT_DRIFT_CONFIG.transition);
    state.dirtDriftBlendTimer = state.dirtDriftBlendDuration;
    state.dirtDriftTargetTimer = randomInRange(DIRT_DRIFT_CONFIG.targetInterval);
  }

  function updateDirtDrift(deltaSeconds, surfaceMaxSpeed) {
    const onDirt = playerIsOnDirt();
    const fadeStep = deltaSeconds / DIRT_DRIFT_CONFIG.surfaceFadeSeconds;

    if (onDirt) {
      state.dirtEffectAmount = clamp(state.dirtEffectAmount + fadeStep, 0, 1);
      state.dirtDriftTargetTimer -= deltaSeconds;

      if (state.dirtDriftTargetTimer <= 0) {
        chooseDirtDriftTarget();
      }

      if (state.dirtDriftBlendTimer > 0) {
        state.dirtDriftBlendTimer = Math.max(0, state.dirtDriftBlendTimer - deltaSeconds);
        state.dirtDriftCurrent = lerp(
          state.dirtDriftStart,
          state.dirtDriftTarget,
          1 - state.dirtDriftBlendTimer / state.dirtDriftBlendDuration
        );
      } else {
        state.dirtDriftCurrent = state.dirtDriftTarget;
      }
    } else {
      state.dirtEffectAmount = clamp(state.dirtEffectAmount - fadeStep, 0, 1);
      state.dirtDriftTarget = 0;
      state.dirtDriftTargetTimer = 0;
      state.dirtDriftBlendTimer = 0;
      state.dirtDriftCurrent = lerp(state.dirtDriftCurrent, 0, clamp(fadeStep, 0, 1));
    }

    const speedRatio = surfaceMaxSpeed > 0 ? clamp(state.speed / surfaceMaxSpeed, 0, 1) : 0;

    return state.dirtDriftCurrent *
      dirtDriftStrength() *
      speedRatio *
      DIRT_DRIFT_CONFIG.maxPlayerXPerSecond *
      state.dirtEffectAmount *
      deltaSeconds;
  }

  function dirtTrafficSpawnDelay() {
    return randomInRange(DIRT_TRAFFIC_CONFIG.spawnDelayRange);
  }

  function allDirtTraffic() {
    return state.dirtTraffic.left.concat(state.dirtTraffic.right);
  }

  function resetDirtTraffic() {
    state.dirtTraffic = {
      left: [],
      right: [],
    };
    state.dirtTrafficSpawnTimers = {
      left: dirtTrafficSpawnDelay(),
      right: dirtTrafficSpawnDelay(),
    };
  }

  function updateIntroSelection() {
    introOptionButtons.forEach(function (button, index) {
      button.classList.toggle("is-selected", index === state.introSelectionIndex);
    });
  }

  function hideMenuScreens() {
    introScreen.hidden = true;
    instructionsScreen.hidden = true;
    difficultyScreen.hidden = true;
  }

  function showIntro() {
    state.screen = SCREEN.intro;
    state.difficulty = null;
    state.gameOver = false;
    resetDirtDrivingState();
    state.introSelectionIndex = clamp(state.introSelectionIndex, 0, introOptionButtons.length - 1);
    hideMenuScreens();
    gameHud.hidden = true;
    gameOverMessage.hidden = true;
    introScreen.hidden = false;
    updateIntroSelection();
  }

  function showInstructions() {
    state.screen = SCREEN.instructions;
    state.difficulty = null;
    state.gameOver = false;
    resetDirtDrivingState();
    hideMenuScreens();
    gameHud.hidden = true;
    gameOverMessage.hidden = true;
    instructionsScreen.hidden = false;
  }

  function showDifficultySelection() {
    state.screen = SCREEN.difficulty;
    state.difficulty = null;
    state.gameOver = false;
    resetDirtDrivingState();
    hideMenuScreens();
    gameHud.hidden = true;
    gameOverMessage.hidden = true;
    difficultyScreen.hidden = false;
  }

  function showGameplay() {
    state.screen = SCREEN.gameplay;
    hideMenuScreens();
    gameHud.hidden = false;
    gameOverMessage.hidden = true;
  }

  function showGameOver() {
    state.screen = SCREEN.gameOver;
    state.gameOver = true;
    state.finalScore = state.liveScore;
    finalScoreMessage.textContent = "Final score: " + state.finalScore;
    gameHud.hidden = true;
    gameOverMessage.hidden = false;
  }

  function activateIntroSelection() {
    const button = introOptionButtons[state.introSelectionIndex];
    const option = button ? button.getAttribute("data-intro-option") : "play";

    if (option === "instructions") {
      showInstructions();
    } else {
      showDifficultySelection();
    }
  }

  function resetRun() {
    state.speed = 0;
    state.playerX = 0.5;
    state.playerTier = PLAYER_TIERS[0];
    state.playerAnimationTime = 0;
    state.playerSteeringPose = 0;
    state.playerSteeringPoseTimer = 0;
    state.playerBrakingVisual = false;
    resetDirtDrivingState();
    state.roadScroll = 0;
    state.traffic = [];
    state.trafficSpawnTimer = trafficSpawnDelay();
    resetDirtTraffic();
    state.crossingObstacle = null;
    state.crossingSpawnTimer = crossingSpawnDelay();
    state.sugarcanes = [];
    state.sugarcaneSpawnAccumulator = 0;
    state.distanceMetres = 0;
    state.sugarcaneCount = 0;
    state.fullSpeedScore = 0;
    state.liveScore = 0;
    state.finalScore = 0;
    state.previousPlayerSpeedKmh = 0;
    state.isPlayerDecelerating = false;
    state.decelerationStableTimer = 0;
    state.previousPositiveSameDirectionApproach = 0;
    state.decelReferenceSameDirectionApproach = 0;
    state.decelReferenceOncomingBaseClosing = 0;
    state.decelerationReturnTimer = 0;
    state.returnBlendSameDirectionStart = 0;
    state.returnBlendOncomingStart = 0;
    state.gameOver = false;
    state.debugHitboxes = false;
    state.restartWasDown = false;
    state.lastTime = performance.now();
    showGameplay();
    finalScoreMessage.textContent = "Final score: 0";
    updateHud();
  }

  function startDifficulty(difficultyId) {
    state.difficulty = DIFFICULTIES[difficultyId];
    resetRun();
  }

  introOptionButtons.forEach(function (button, index) {
    button.addEventListener("click", function () {
      state.introSelectionIndex = index;
      updateIntroSelection();
      activateIntroSelection();
      window.RacingInput.clearMenuRequests();
      window.RacingInput.clearDifficultyRequests();
    });
  });

  difficultyOptionButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const difficultyId = button.getAttribute("data-difficulty");

      if (DIFFICULTIES[difficultyId]) {
        startDifficulty(difficultyId);
        window.RacingInput.clearMenuRequests();
        window.RacingInput.clearDifficultyRequests();
      }
    });
  });

  instructionsBackButton.addEventListener("click", function () {
    showIntro();
    window.RacingInput.clearMenuRequests();
    window.RacingInput.clearDifficultyRequests();
  });

  function laneIsSafeForSpawn(lane) {
    return state.traffic.every(function (traffic) {
      const distanceGap = Math.abs(TRAFFIC_SPAWN_DISTANCE - traffic.distance);

      return (
        distanceGap >= TRAFFIC_ANY_LANE_GAP &&
        (traffic.lane !== lane || distanceGap >= TRAFFIC_SAME_LANE_GAP)
      );
    });
  }

  function chooseTrafficLane() {
    const safeLanes = [];
    const difficulty = currentDifficulty();

    for (let lane = 0; lane < difficulty.laneCount; lane += 1) {
      if (laneIsSafeForSpawn(lane)) {
        safeLanes.push(lane);
      }
    }

    if (safeLanes.length === 0) {
      return null;
    }

    return safeLanes[Math.floor(Math.random() * safeLanes.length)];
  }

  function spawnTraffic() {
    const difficulty = currentDifficulty();
    const lane = chooseTrafficLane();

    if (lane === null) {
      state.trafficSpawnTimer = TRAFFIC_RETRY_DELAY;
      return;
    }

    state.traffic.push({
      lane: lane,
      direction: difficulty.laneDirections[lane],
      type: TRAFFIC_TYPES[Math.floor(Math.random() * TRAFFIC_TYPES.length)],
      animationPhase: Math.random() * 10,
      collidable: true,
      distance: TRAFFIC_SPAWN_DISTANCE,
      depth: 0,
    });

    state.trafficSpawnTimer = trafficSpawnDelay();
  }

  function updateTraffic(deltaSeconds) {
    if (state.traffic.length < maxActiveTraffic()) {
      state.trafficSpawnTimer -= deltaSeconds;

      if (state.trafficSpawnTimer <= 0) {
        spawnTraffic();
      }
    }

    state.traffic.forEach(function (traffic) {
      const relativeWorldSpeed = effectiveTrafficRelativeWorldSpeed(traffic.direction);

      traffic.distance -= relativeWorldSpeed * deltaSeconds;
      traffic.distance = Math.min(TRAFFIC_SPAWN_DISTANCE, traffic.distance);
      traffic.depth = clamp(1 - traffic.distance / TRAFFIC_SPAWN_DISTANCE, 0.03, 1.12);

      if (traffic.depth > window.RacingRender.playerDepth) {
        traffic.collidable = false;
      }
    });

    state.traffic = state.traffic.filter(function (traffic) {
      return traffic.distance >= TRAFFIC_REMOVE_DISTANCE;
    });

    if (state.traffic.length >= maxActiveTraffic()) {
      state.trafficSpawnTimer = trafficSpawnDelay();
    }
  }

  function dirtTrafficLaneIsSafe(side) {
    const ownSideIsSafe = state.dirtTraffic[side].every(function (traffic) {
      return Math.abs(TRAFFIC_SPAWN_DISTANCE - traffic.distance) >= TRAFFIC_SAME_LANE_GAP;
    });
    const otherDirtTrafficIsSafe = allDirtTraffic().every(function (traffic) {
      return Math.abs(TRAFFIC_SPAWN_DISTANCE - traffic.distance) >= TRAFFIC_ANY_LANE_GAP;
    });
    const tarmacTrafficIsSafe = state.traffic.every(function (traffic) {
      return Math.abs(TRAFFIC_SPAWN_DISTANCE - traffic.distance) >= TRAFFIC_ANY_LANE_GAP;
    });

    return ownSideIsSafe && otherDirtTrafficIsSafe && tarmacTrafficIsSafe;
  }

  function spawnDirtTraffic(side) {
    if (!dirtTrafficLaneIsSafe(side)) {
      state.dirtTrafficSpawnTimers[side] = DIRT_TRAFFIC_CONFIG.retryDelay;
      return;
    }

    state.dirtTraffic[side].push({
      side: side,
      direction: Math.random() < DIRT_TRAFFIC_CONFIG.sameDirectionProbability ? "sameDirection" : "oncoming",
      type: TRAFFIC_TYPES[Math.floor(Math.random() * TRAFFIC_TYPES.length)],
      animationPhase: Math.random() * 10,
      collidable: true,
      distance: TRAFFIC_SPAWN_DISTANCE,
      depth: 0,
    });

    state.dirtTrafficSpawnTimers[side] = dirtTrafficSpawnDelay();
  }

  function updateDirtTrafficSide(deltaSeconds, side) {
    const vehicles = state.dirtTraffic[side];

    if (vehicles.length < DIRT_TRAFFIC_CONFIG.maxPerSide) {
      state.dirtTrafficSpawnTimers[side] -= deltaSeconds;

      if (state.dirtTrafficSpawnTimers[side] <= 0) {
        spawnDirtTraffic(side);
      }
    }

    vehicles.forEach(function (traffic) {
      const speedMultiplier = traffic.direction === "oncoming"
        ? DIRT_TRAFFIC_CONFIG.oncomingSpeedMultiplier
        : DIRT_TRAFFIC_CONFIG.sameDirectionSpeedMultiplier;
      const relativeWorldSpeed = effectiveTrafficRelativeWorldSpeed(traffic.direction) * speedMultiplier;

      traffic.distance -= relativeWorldSpeed * deltaSeconds;
      traffic.distance = Math.min(TRAFFIC_SPAWN_DISTANCE, traffic.distance);
      traffic.depth = clamp(1 - traffic.distance / TRAFFIC_SPAWN_DISTANCE, 0.03, 1.12);

      if (traffic.depth > window.RacingRender.playerDepth) {
        traffic.collidable = false;
      }
    });

    state.dirtTraffic[side] = vehicles.filter(function (traffic) {
      return traffic.distance >= TRAFFIC_REMOVE_DISTANCE;
    });

    if (state.dirtTraffic[side].length >= DIRT_TRAFFIC_CONFIG.maxPerSide) {
      state.dirtTrafficSpawnTimers[side] = dirtTrafficSpawnDelay();
    }
  }

  function updateDirtTraffic(deltaSeconds) {
    if (currentDifficulty().id !== "realism") {
      if (state.dirtTraffic.left.length > 0 || state.dirtTraffic.right.length > 0) {
        resetDirtTraffic();
      }

      return;
    }

    updateDirtTrafficSide(deltaSeconds, "left");
    updateDirtTrafficSide(deltaSeconds, "right");
  }

  function crossingSpawnIsSafe(type) {
    const difficulty = currentDifficulty();
    const profile = CROSSING_PROFILES[type] || CROSSING_PROFILES.human;
    const nearbyTraffic = state.traffic.filter(function (traffic) {
      return Math.abs(traffic.distance - CROSSING_SPAWN_DISTANCE) < CROSSING_TRAFFIC_DEPTH_GAP;
    });
    const blockedLanes = new Set(nearbyTraffic.map(function (traffic) {
      return traffic.lane;
    }));
    const maxBlockedLanes = difficulty.laneCount - (profile.laneWidth > 0.3 ? 2 : 1);

    return nearbyTraffic.length === 0 || blockedLanes.size < maxBlockedLanes;
  }

  function spawnCrossingObstacle() {
    const type = CROSSING_TYPES[Math.floor(Math.random() * CROSSING_TYPES.length)];

    if (!crossingSpawnIsSafe(type)) {
      state.crossingSpawnTimer = CROSSING_RETRY_DELAY;
      return;
    }

    const startsLeft = Math.random() < 0.5;
    const profile = CROSSING_PROFILES[type] || CROSSING_PROFILES.human;
    const crossingStart = startsLeft ? -0.08 : 1.08;
    const crossingEnd = startsLeft ? 1.08 : -0.08;
    const startingProgress = Math.random() * MAX_CROSSING_START_PROGRESS;

    state.crossingObstacle = {
      type: type,
      crossing: lerp(crossingStart, crossingEnd, startingProgress),
      crossingStart: crossingStart,
      crossingEnd: crossingEnd,
      crossingProgress: startingProgress,
      fullCrossingDuration: randomInRange(profile.durationRange),
      direction: startsLeft ? 1 : -1,
      animationTime: 0,
      distance: CROSSING_SPAWN_DISTANCE,
      depth: 1 - CROSSING_SPAWN_DISTANCE / TRAFFIC_SPAWN_DISTANCE,
    };
    state.crossingSpawnTimer = crossingSpawnDelay();
  }

  function updateCrossingObstacle(deltaSeconds) {
    if (!state.crossingObstacle) {
      state.crossingSpawnTimer -= deltaSeconds;

      if (state.crossingSpawnTimer <= 0) {
        spawnCrossingObstacle();
      }

      return;
    }

    state.crossingObstacle.distance -= kmhToWorldUnits(state.speed) * deltaSeconds;
    state.crossingObstacle.depth = clamp(1 - state.crossingObstacle.distance / TRAFFIC_SPAWN_DISTANCE, 0.03, 1.12);
    state.crossingObstacle.crossingProgress += deltaSeconds / state.crossingObstacle.fullCrossingDuration;
    state.crossingObstacle.crossing = lerp(
      state.crossingObstacle.crossingStart,
      state.crossingObstacle.crossingEnd,
      state.crossingObstacle.crossingProgress
    );
    state.crossingObstacle.animationTime += deltaSeconds;

    if (
      state.crossingObstacle.distance < CROSSING_REMOVE_DISTANCE ||
      state.crossingObstacle.crossingProgress >= 1
    ) {
      state.crossingObstacle = null;
      state.crossingSpawnTimer = crossingSpawnDelay();
    }
  }

  function trafficPosition(traffic) {
    const difficulty = currentDifficulty();
    return (traffic.lane + 0.5) / difficulty.laneCount;
  }

  function sugarcaneSpawnIsSafe(position) {
    const hitsTraffic = state.traffic.some(function (traffic) {
      return (
        Math.abs(traffic.distance - SUGARCANE_SPAWN_DISTANCE) < SUGARCANE_TRAFFIC_DISTANCE_GAP &&
        Math.abs(trafficPosition(traffic) - position) < SUGARCANE_POSITION_GAP
      );
    });
    const hitsCrossingObstacle = state.crossingObstacle && (
      Math.abs(state.crossingObstacle.distance - SUGARCANE_SPAWN_DISTANCE) < SUGARCANE_CROSSING_DISTANCE_GAP &&
      Math.abs(state.crossingObstacle.crossing - position) < SUGARCANE_POSITION_GAP
    );
    const hitsSugarcane = state.sugarcanes.some(function (sugarcane) {
      return (
        Math.abs(sugarcane.distance - SUGARCANE_SPAWN_DISTANCE) < SUGARCANE_SELF_DISTANCE_GAP &&
        Math.abs(sugarcane.position - position) < SUGARCANE_SELF_POSITION_GAP
      );
    });

    return !hitsTraffic && !hitsCrossingObstacle && !hitsSugarcane;
  }

  function spawnSugarcane() {
    const position = 0.16 + Math.random() * 0.68;

    if (!sugarcaneSpawnIsSafe(position)) {
      return false;
    }

    state.sugarcanes.push({
      position: position,
      distance: SUGARCANE_SPAWN_DISTANCE,
      depth: 1 - SUGARCANE_SPAWN_DISTANCE / TRAFFIC_SPAWN_DISTANCE,
    });

    return true;
  }

  function updateSugarcane(deltaSeconds) {
    const interval = sugarcaneSpawnDelay();
    let attempts = 0;

    state.sugarcaneSpawnAccumulator += deltaSeconds;

    if (state.sugarcanes.length >= MAX_ACTIVE_SUGARCANES) {
      state.sugarcaneSpawnAccumulator = Math.min(state.sugarcaneSpawnAccumulator, interval);
    }

    while (
      state.sugarcaneSpawnAccumulator >= interval &&
      state.sugarcanes.length < MAX_ACTIVE_SUGARCANES &&
      attempts < MAX_SUGARCANE_SPAWN_ATTEMPTS_PER_UPDATE
    ) {
      spawnSugarcane();
      state.sugarcaneSpawnAccumulator -= interval;
      attempts += 1;
    }

    if (attempts === MAX_SUGARCANE_SPAWN_ATTEMPTS_PER_UPDATE) {
      state.sugarcaneSpawnAccumulator = Math.min(state.sugarcaneSpawnAccumulator, interval);
    }

    state.sugarcanes.forEach(function (sugarcane) {
      sugarcane.distance -= kmhToWorldUnits(state.speed) * deltaSeconds;
      sugarcane.depth = clamp(1 - sugarcane.distance / TRAFFIC_SPAWN_DISTANCE, 0.03, 1.12);
    });

    state.sugarcanes = state.sugarcanes.filter(function (sugarcane) {
      return sugarcane.distance >= SUGARCANE_REMOVE_DISTANCE;
    });
  }

  function calculateLiveScore() {
    return Math.floor(
      state.distanceMetres +
      state.sugarcaneCount * SUGARCANE_SCORE_VALUE +
      state.fullSpeedScore
    );
  }

  function updateScore(deltaSeconds, braking) {
    state.distanceMetres += (state.speed / 3.6) * deltaSeconds;

    if (!braking && state.playerSurface === PLAYER_SURFACES.tarmac && state.speed >= state.playerTier.maxSpeed - FULL_SPEED_TOLERANCE) {
      state.fullSpeedScore += state.playerTier.fullSpeedPointsPerSecond * deltaSeconds;
    }

    state.liveScore = calculateLiveScore();
  }

  function determinePlayerTier(sugarcaneCount) {
    let tier = PLAYER_TIERS[0];

    PLAYER_TIERS.forEach(function (candidate, index) {
      if (sugarcaneCount >= currentDifficulty().upgradeThresholds[index]) {
        tier = candidate;
      }
    });

    return tier;
  }

  function updatePlayerTier() {
    const nextTier = determinePlayerTier(state.sugarcaneCount);

    state.playerTier = nextTier;
    state.sugarcaneSpawnAccumulator = Math.min(state.sugarcaneSpawnAccumulator, sugarcaneSpawnDelay());
  }

  function updateHud() {
    speedHud.textContent = "Speed: " + Math.round(state.speed) + " km/h";
    scoreHud.textContent = "Score: " + state.liveScore;
    sugarcaneHud.textContent = "Sugarcane: " + state.sugarcaneCount;
  }

  function updatePlayerVisualState(deltaSeconds, direction, braking) {
    const poseInterval = 1 / PLAYER_STEERING_POSES_PER_SECOND;

    state.playerAnimationTime += deltaSeconds;
    state.playerSteeringPoseTimer += deltaSeconds;
    state.playerBrakingVisual = braking;

    if (state.playerSteeringPoseTimer >= poseInterval) {
      state.playerSteeringPose = direction;
      state.playerSteeringPoseTimer %= poseInterval;
    }
  }

  function rectanglesOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  function horizontalOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x;
  }

  function checkCollision() {
    const bounds = window.RacingRender.getBounds(canvas, state);
    const visibleBounds = window.RacingRender.getVisibleBounds(canvas, state);
    const playerDepth = window.RacingRender.playerDepth;
    const hitTraffic = bounds.traffic.some(function (trafficBounds, index) {
      const traffic = state.traffic[index];
      const depthDifference = playerDepth - traffic.depth;
      const trafficIsWithinCollisionApproach = depthDifference >= 0 && depthDifference <= TRAFFIC_COLLISION_DEPTH_TOLERANCE;

      return traffic.collidable !== false && trafficIsWithinCollisionApproach && horizontalOverlap(bounds.player, trafficBounds);
    });
    const dirtTraffic = allDirtTraffic();
    const hitDirtTraffic = bounds.dirtTraffic && bounds.dirtTraffic.some(function (trafficBounds, index) {
      const traffic = dirtTraffic[index];
      const depthDifference = playerDepth - traffic.depth;
      const trafficIsWithinCollisionApproach = depthDifference >= 0 && depthDifference <= TRAFFIC_COLLISION_DEPTH_TOLERANCE;

      return traffic.collidable !== false && trafficIsWithinCollisionApproach && horizontalOverlap(bounds.player, trafficBounds);
    });
    const hitCrossingObstacle = visibleBounds.crossingObstacle && rectanglesOverlap(visibleBounds.player, visibleBounds.crossingObstacle);

    if (hitTraffic || hitDirtTraffic || hitCrossingObstacle) {
      showGameOver();
    }
  }

  function removeOvertakenTraffic() {
    const passedDepth = window.RacingRender.playerDepth + PASSED_DEPTH_MARGIN;

    state.traffic = state.traffic.filter(function (traffic) {
      return traffic.depth <= passedDepth;
    });
  }

  function checkSugarcaneCollection() {
    const bounds = window.RacingRender.getVisibleBounds(canvas, state);
    const remainingSugarcanes = [];

    bounds.sugarcanes.forEach(function (sugarcaneBounds, index) {
      if (!rectanglesOverlap(bounds.player, sugarcaneBounds)) {
        remainingSugarcanes.push(state.sugarcanes[index]);
        return;
      }

      state.sugarcaneCount += 1;
      updatePlayerTier();
      state.liveScore = calculateLiveScore();
    });

    state.sugarcanes = remainingSugarcanes;
  }

  function update(deltaSeconds) {
    const input = window.RacingInput;
    const restartIsDown = input.restart();

    if (state.screen === SCREEN.intro) {
      input.clearDifficultyRequests();
      input.consumeSelection();
      input.consumeBack();
      input.consumeRestart();
      input.consumeDebugToggle();

      if (input.consumeMenuUp()) {
        state.introSelectionIndex = (state.introSelectionIndex + introOptionButtons.length - 1) % introOptionButtons.length;
        updateIntroSelection();
      }

      if (input.consumeMenuDown()) {
        state.introSelectionIndex = (state.introSelectionIndex + 1) % introOptionButtons.length;
        updateIntroSelection();
      }

      if (input.consumeMenuActivate()) {
        activateIntroSelection();
        input.clearMenuRequests();
        input.clearDifficultyRequests();
      }

      return;
    }

    if (state.screen === SCREEN.instructions) {
      input.clearDifficultyRequests();
      input.consumeRestart();
      input.consumeDebugToggle();
      input.consumeMenuUp();
      input.consumeMenuDown();
      input.consumeMenuActivate();

      if (input.consumeBack()) {
        showIntro();
        input.clearMenuRequests();
        input.clearDifficultyRequests();
      }

      return;
    }

    if (state.screen === SCREEN.difficulty) {
      const selectedDifficulty = input.consumeDifficulty();
      input.consumeRestart();
      input.consumeDebugToggle();
      input.consumeMenuUp();
      input.consumeMenuDown();
      input.consumeMenuActivate();

      if (selectedDifficulty) {
        startDifficulty(selectedDifficulty);
        input.clearMenuRequests();
      } else if (input.consumeBack()) {
        showIntro();
        input.clearDifficultyRequests();
      }

      return;
    }

    if (state.screen === SCREEN.gameOver) {
      input.consumeDifficulty();
      input.consumeDebugToggle();
      input.consumeMenuUp();
      input.consumeMenuDown();
      input.consumeMenuActivate();
      const selectionRequested = input.consumeSelection();
      input.consumeBack();

      if (input.consumeRestart() || (restartIsDown && !state.restartWasDown)) {
        resetRun();
        input.clearMenuRequests();
      } else if (selectionRequested) {
        showDifficultySelection();
        input.clearDifficultyRequests();
      }

      state.restartWasDown = restartIsDown;
      return;
    }

    input.consumeDifficulty();
    input.consumeSelection();
    input.consumeBack();
    input.consumeMenuUp();
    input.consumeMenuDown();
    input.consumeMenuActivate();

    if (input.consumeDebugToggle()) {
      state.debugHitboxes = !state.debugHitboxes;
    }

    state.restartWasDown = restartIsDown;
    const braking = input.braking();
    updatePlayerSurface();
    const surfaceMaxSpeed = currentSurfaceMaxSpeed();
    const targetSpeed = braking ? Math.min(BRAKE_SPEED, surfaceMaxSpeed) : surfaceMaxSpeed;
    const speedChange = targetSpeed > state.speed ? ACCELERATION : (playerIsOnDirt() ? DIRT_DECELERATION : BRAKE_DECELERATION);
    const direction = (input.steerRight() ? 1 : 0) - (input.steerLeft() ? 1 : 0);
    const previousSpeedKmh = state.speed;

    updatePlayerVisualState(deltaSeconds, direction, braking);

    if (state.speed < targetSpeed) {
      state.speed = Math.min(targetSpeed, state.speed + speedChange * deltaSeconds);
    } else if (state.speed > targetSpeed) {
      state.speed = Math.max(targetSpeed, state.speed - speedChange * deltaSeconds);
    }

    const playerXBounds = window.RacingRender.playerXBounds
      ? window.RacingRender.playerXBounds(canvas, state)
      : { min: 0.08, max: 0.92 };
    const steeringMultiplier = playerIsOnDirt() ? dirtSteeringMultiplier() : 1;
    const dirtDrift = updateDirtDrift(deltaSeconds, surfaceMaxSpeed);

    state.playerX = clamp(
      state.playerX + direction * STEERING_SPEED * steeringMultiplier * deltaSeconds + dirtDrift,
      playerXBounds.min,
      playerXBounds.max
    );
    updatePlayerSurface();

    updateDecelerationState(deltaSeconds, previousSpeedKmh);
    state.roadScroll += worldVisualSpeed(state.speed) * deltaSeconds;
    updateTraffic(deltaSeconds);
    updateDirtTraffic(deltaSeconds);
    removeOvertakenTraffic();
    updateCrossingObstacle(deltaSeconds);
    updateSugarcane(deltaSeconds);
    checkSugarcaneCollection();
    updateScore(deltaSeconds, braking);
    checkCollision();
  }

  function frame(now) {
    const deltaSeconds = Math.min(0.05, (now - state.lastTime) / 1000);
    state.lastTime = now;

    update(deltaSeconds);
    window.RacingRender.render(ctx, state);
    updateHud();

    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  showIntro();
  requestAnimationFrame(frame);
})();
