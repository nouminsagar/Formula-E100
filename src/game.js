(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const gameHud = document.getElementById("gameHud");
  const speedHud = document.getElementById("speedHud");
  const scoreHud = document.getElementById("scoreHud");
  const sugarcaneHud = document.getElementById("sugarcaneHud");
  const jumpHud = document.getElementById("jumpHud");
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
    },
    hard: {
      id: "hard",
      laneCount: 4,
      laneDirections: ["sameDirection", "sameDirection", "oncoming", "oncoming"],
      trafficSpawnDelayMultiplier: 1,
      maxActiveTraffic: 4,
      crossingSpawnDelayMultiplier: 1,
    },
    realism: {
      id: "realism",
      laneCount: 2,
      laneDirections: ["sameDirection", "oncoming"],
      trafficSpawnDelayMultiplier: 0.65,
      maxActiveTraffic: 6,
      crossingSpawnDelayMultiplier: 1,
    },
  };
  const UPGRADE_THRESHOLDS = [0, 10, 20, 30];
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
  const SUGARCANE_SAFETY_SCALE = 1.30;
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
  const DIRT_PATCH_CONFIG = {
    maxActiveZones: 3,
    spawnDelayRange: {
      min: 2.5,
      max: 5,
    },
    retryDelay: 0.5,
    spawnDistance: 1,
    removeDistance: -0.14,
    lengthRange: {
      min: 0.26,
      max: 0.51,
    },
    allLaneChance: 0.2,
  };
  const STANDING_COW_CONFIG = {
    maxActive: 1,
    spawnDelayRange: {
      min: 5,
      max: 8,
    },
    retryDelay: 0.75,
    spawnDistance: 0.86,
    removeDistance: -0.12,
    trafficDistanceGap: 0.16,
    trafficPositionGap: 0.14,
    sugarcaneDistanceGap: 0.14,
    sugarcanePositionGap: 0.14,
    crossingDistanceGap: 0.16,
    crossingPositionGap: 0.18,
    playerDistanceGap: 0.34,
  };
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
  const TRAFFIC_WEAVE_CONFIG = {
    enabledDifficulties: {
      hard: true,
      realism: true,
    },
    decisionInterval: {
      min: 0.8,
      max: 1.8,
    },
    initialDelay: {
      min: 0.4,
      max: 0.8,
    },
    realismLaneOffsetLimit: 0.25,
    dirtRoadOffsetLimit: 0.25,
    realismDirtRoadGapRatio: 0.035,
    dirtRoadWidthRelativeToTarmacLane: 1,
    lateralSpeeds: {
      car: 0.32,
      rickshaw: 0.42,
      truck: 0.22,
    },
    collisionHalfWidth: {
      car: 0.05,
      rickshaw: 0.035,
      truck: 0.07,
    },
    laneChangeDepthGap: 0.18,
    laneChangePositionGap: 0.15,
  };
  const JUMP_STATES = {
    grounded: "grounded",
    ascending: "ascending",
    peak: "peak",
    descending: "descending",
  };
  const JUMP_CONFIG = {
    sugarcanesPerCharge: 25,
    ascentDuration: 0.55,
    peakDuration: 0.15,
    descentDuration: 0.55,
    peakScreenRatio: 0.12,
    steeringEnabledWhileAirborne: false,
    obstacleCollisionEnabledWhileAirborne: false,
    sugarcaneCollectionEnabledWhileAirborne: false,
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
    playerEffectiveSurface: PLAYER_SURFACES.tarmac,
    playerOnDirtPatch: false,
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
    standingCows: [],
    standingCowSpawnTimer: STANDING_COW_CONFIG.spawnDelayRange.max,
    nextStandingCowId: 1,
    dirtPatches: [],
    dirtPatchSpawnTimer: DIRT_PATCH_CONFIG.spawnDelayRange.max,
    nextDirtPatchId: 1,
    sugarcanes: [],
    sugarcaneSpawnAccumulator: 0,
    distanceMetres: 0,
    sugarcaneCount: 0,
    jumpChargesUsed: 0,
    jumpState: JUMP_STATES.grounded,
    jumpElapsed: 0,
    jumpArcAmount: 0,
    playerJumpLockedX: null,
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

  function moveTowards(current, target, maxDelta) {
    if (Math.abs(target - current) <= maxDelta) {
      return target;
    }

    return current + Math.sign(target - current) * maxDelta;
  }

  function randomInBounds(bounds) {
    return bounds.left + Math.random() * (bounds.right - bounds.left);
  }

  function tierNumber(tier) {
    const id = tier && tier.id ? tier.id : "tier1";

    return Number(id.replace("tier", "")) || 1;
  }

  function earnedJumpCharges() {
    return Math.floor(state.sugarcaneCount / JUMP_CONFIG.sugarcanesPerCharge);
  }

  function availableJumpCharges() {
    return Math.max(0, earnedJumpCharges() - state.jumpChargesUsed);
  }

  function playerIsAirborne() {
    return state.jumpState !== JUMP_STATES.grounded;
  }

  function resetJumpState() {
    state.jumpChargesUsed = 0;
    state.jumpState = JUMP_STATES.grounded;
    state.jumpElapsed = 0;
    state.jumpArcAmount = 0;
    state.playerJumpLockedX = null;
  }

  function easeOutCubic(amount) {
    return 1 - Math.pow(1 - clamp(amount, 0, 1), 3);
  }

  function easeInCubic(amount) {
    const clamped = clamp(amount, 0, 1);

    return clamped * clamped * clamped;
  }

  function beginJump() {
    if (playerIsAirborne() || availableJumpCharges() <= 0) {
      return false;
    }

    state.jumpChargesUsed += 1;
    state.jumpState = JUMP_STATES.ascending;
    state.jumpElapsed = 0;
    state.jumpArcAmount = 0;
    state.playerJumpLockedX = state.playerX;
    state.playerSteeringPose = 0;
    state.dirtDriftCurrent = 0;
    state.dirtDriftTarget = 0;

    return true;
  }

  function updateJump(deltaSeconds) {
    if (!playerIsAirborne()) {
      state.jumpArcAmount = 0;
      return;
    }

    state.jumpElapsed += deltaSeconds;

    const ascentEnd = JUMP_CONFIG.ascentDuration;
    const peakEnd = ascentEnd + JUMP_CONFIG.peakDuration;
    const totalDuration = peakEnd + JUMP_CONFIG.descentDuration;

    if (state.jumpElapsed < ascentEnd) {
      state.jumpState = JUMP_STATES.ascending;
      state.jumpArcAmount = easeOutCubic(state.jumpElapsed / JUMP_CONFIG.ascentDuration);
    } else if (state.jumpElapsed < peakEnd) {
      state.jumpState = JUMP_STATES.peak;
      state.jumpArcAmount = 1;
    } else if (state.jumpElapsed < totalDuration) {
      state.jumpState = JUMP_STATES.descending;
      state.jumpArcAmount = 1 - easeInCubic((state.jumpElapsed - peakEnd) / JUMP_CONFIG.descentDuration);
    } else {
      state.jumpState = JUMP_STATES.grounded;
      state.jumpElapsed = 0;
      state.jumpArcAmount = 0;
      state.playerJumpLockedX = null;
      updatePlayerSurface();
    }
  }

  function playerIsOnDirt() {
    return state.playerEffectiveSurface === "dirt";
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
    state.playerEffectiveSurface = PLAYER_SURFACES.tarmac;
    state.playerOnDirtPatch = false;
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

    state.playerOnDirtPatch = playerOverlapsDirtPatch();
    state.playerEffectiveSurface = (
      state.playerSurface === PLAYER_SURFACES.leftDirt ||
      state.playerSurface === PLAYER_SURFACES.rightDirt ||
      state.playerOnDirtPatch
    ) ? "dirt" : PLAYER_SURFACES.tarmac;
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

  function resetDirtPatches() {
    state.dirtPatches = [];
    state.dirtPatchSpawnTimer = randomInRange(DIRT_PATCH_CONFIG.spawnDelayRange);
    state.nextDirtPatchId = 1;
    state.playerOnDirtPatch = false;
  }

  function dirtPatchLaneMask(laneCount) {
    const mask = new Array(laneCount).fill(false);

    if (Math.random() < DIRT_PATCH_CONFIG.allLaneChance) {
      return mask.map(function () {
        return true;
      });
    }

    while (!mask.some(Boolean)) {
      for (let lane = 0; lane < laneCount; lane += 1) {
        mask[lane] = Math.random() < 0.5;
      }
    }

    return mask;
  }

  function spawnDirtPatch() {
    const difficulty = currentDifficulty();

    if (state.dirtPatches.length >= DIRT_PATCH_CONFIG.maxActiveZones) {
      return;
    }

    state.dirtPatches.push({
      id: state.nextDirtPatchId,
      distance: DIRT_PATCH_CONFIG.spawnDistance,
      length: randomInRange(DIRT_PATCH_CONFIG.lengthRange),
      laneMask: dirtPatchLaneMask(difficulty.laneCount),
      seed: Math.floor(Math.random() * 1000000),
      active: true,
    });
    state.nextDirtPatchId += 1;
    state.dirtPatchSpawnTimer = randomInRange(DIRT_PATCH_CONFIG.spawnDelayRange);
  }

  function updateDirtPatches(deltaSeconds) {
    state.dirtPatchSpawnTimer -= deltaSeconds;

    if (
      state.dirtPatchSpawnTimer <= 0 &&
      state.dirtPatches.length < DIRT_PATCH_CONFIG.maxActiveZones
    ) {
      spawnDirtPatch();
    } else if (state.dirtPatchSpawnTimer <= 0) {
      state.dirtPatchSpawnTimer = DIRT_PATCH_CONFIG.retryDelay;
    }

    state.dirtPatches.forEach(function (patch) {
      patch.distance -= kmhToWorldUnits(state.speed) * deltaSeconds;
      patch.active = patch.distance + patch.length >= DIRT_PATCH_CONFIG.removeDistance;
    });

    state.dirtPatches = state.dirtPatches.filter(function (patch) {
      return patch.distance + patch.length >= DIRT_PATCH_CONFIG.removeDistance;
    });
  }

  function playerOverlapsDirtPatch() {
    const difficulty = currentDifficulty();
    const playerDistance = 1 - window.RacingRender.playerDepth;

    if (state.playerX < 0 || state.playerX > 1) {
      return false;
    }

    const lane = Math.min(
      difficulty.laneCount - 1,
      Math.max(0, Math.floor(state.playerX * difficulty.laneCount))
    );

    return state.dirtPatches.some(function (patch) {
      return (
        patch.distance <= playerDistance &&
        patch.distance + patch.length >= playerDistance &&
        patch.laneMask[lane] === true
      );
    });
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

  function clearTransientRunState() {
    state.traffic = [];
    resetDirtTraffic();
    resetDirtPatches();
    resetStandingCows();
    state.crossingObstacle = null;
    state.sugarcanes = [];
    resetDirtDrivingState();
    resetJumpState();
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
    clearTransientRunState();
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
    clearTransientRunState();
    hideMenuScreens();
    gameHud.hidden = true;
    gameOverMessage.hidden = true;
    instructionsScreen.hidden = false;
  }

  function showDifficultySelection() {
    state.screen = SCREEN.difficulty;
    state.difficulty = null;
    state.gameOver = false;
    clearTransientRunState();
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
    state.jumpState = JUMP_STATES.grounded;
    state.jumpElapsed = 0;
    state.jumpArcAmount = 0;
    state.playerJumpLockedX = null;
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
    resetDirtPatches();
    state.crossingObstacle = null;
    state.crossingSpawnTimer = crossingSpawnDelay();
    resetStandingCows();
    state.sugarcanes = [];
    state.sugarcaneSpawnAccumulator = 0;
    state.distanceMetres = 0;
    state.sugarcaneCount = 0;
    resetJumpState();
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

  function laneCenterRatio(lane, laneCount) {
    return (lane + 0.5) / Math.max(1, laneCount);
  }

  function trafficLogicalX(traffic) {
    if (Number.isFinite(traffic.logicalX)) {
      return traffic.logicalX;
    }

    return trafficPosition(traffic);
  }

  function trafficWeavingEnabled(difficulty) {
    return !!(difficulty && TRAFFIC_WEAVE_CONFIG.enabledDifficulties[difficulty.id]);
  }

  function trafficHalfWidthMargin(traffic) {
    return TRAFFIC_WEAVE_CONFIG.collisionHalfWidth[traffic.type] || TRAFFIC_WEAVE_CONFIG.collisionHalfWidth.car;
  }

  function hardLegalLanesForTraffic(traffic) {
    return traffic.direction === "oncoming" ? [2, 3] : [0, 1];
  }

  function hardTrafficLaneChangeIsSafe(traffic, targetLane) {
    const difficulty = currentDifficulty();
    const targetX = laneCenterRatio(targetLane, difficulty.laneCount);

    return state.traffic.every(function (other) {
      if (other === traffic) {
        return true;
      }

      const depthGap = Math.abs(other.depth - traffic.depth);
      const targetGap = Math.abs((Number.isFinite(other.weaveTargetX) ? other.weaveTargetX : trafficLogicalX(other)) - targetX);

      return depthGap >= TRAFFIC_WEAVE_CONFIG.laneChangeDepthGap || targetGap >= TRAFFIC_WEAVE_CONFIG.laneChangePositionGap;
    });
  }

  function laneWeaveBounds(lane, laneCount, traffic, offsetLimit) {
    const laneWidth = 1 / Math.max(1, laneCount);
    const center = laneCenterRatio(lane, laneCount);
    const halfRange = laneWidth * offsetLimit;
    const margin = Math.min(laneWidth * 0.4, trafficHalfWidthMargin(traffic));

    return {
      left: Math.max(lane * laneWidth + margin, center - halfRange),
      right: Math.min((lane + 1) * laneWidth - margin, center + halfRange),
    };
  }

  function trafficCurrentLane(traffic) {
    return Number.isInteger(traffic.currentLaneIndex) ? traffic.currentLaneIndex : traffic.lane;
  }

  function trafficRegionBounds(traffic) {
    const difficulty = currentDifficulty();
    const margin = trafficHalfWidthMargin(traffic);

    if (!traffic.weaveEnabled) {
      const fixedX = trafficLogicalX(traffic);
      return { left: fixedX, right: fixedX };
    }

    if (traffic.isDirtTraffic) {
      const laneWidth = 1 / Math.max(1, difficulty.laneCount);
      const dirtWidth = laneWidth * TRAFFIC_WEAVE_CONFIG.dirtRoadWidthRelativeToTarmacLane;
      const center = traffic.side === "left"
        ? -TRAFFIC_WEAVE_CONFIG.realismDirtRoadGapRatio - dirtWidth * 0.5
        : 1 + TRAFFIC_WEAVE_CONFIG.realismDirtRoadGapRatio + dirtWidth * 0.5;
      const halfRange = dirtWidth * TRAFFIC_WEAVE_CONFIG.dirtRoadOffsetLimit;
      const usableMargin = Math.min(dirtWidth * 0.4, margin);

      return {
        left: center - halfRange + usableMargin,
        right: center + halfRange - usableMargin,
      };
    }

    if (difficulty.id === "hard") {
      const legalLanes = hardLegalLanesForTraffic(traffic);
      const laneWidth = 1 / difficulty.laneCount;
      const left = legalLanes[0] * laneWidth + margin;
      const right = (legalLanes[legalLanes.length - 1] + 1) * laneWidth - margin;

      return { left: left, right: right };
    }

    return laneWeaveBounds(traffic.lane, difficulty.laneCount, traffic, TRAFFIC_WEAVE_CONFIG.realismLaneOffsetLimit);
  }

  function chooseWithinLaneTarget(traffic, lane) {
    const difficulty = currentDifficulty();
    const bounds = laneWeaveBounds(lane, difficulty.laneCount, traffic, difficulty.id === "realism" ? TRAFFIC_WEAVE_CONFIG.realismLaneOffsetLimit : 0.42);

    return randomInBounds(bounds);
  }

  function chooseTrafficWeaveTarget(traffic) {
    const difficulty = currentDifficulty();
    const actionRoll = Math.random();
    let targetX = Number.isFinite(traffic.weaveTargetX) ? traffic.weaveTargetX : trafficLogicalX(traffic);
    let targetLane = trafficCurrentLane(traffic);
    let bounds;

    if (actionRoll < 0.2) {
      traffic.weaveTimer = randomInRange(TRAFFIC_WEAVE_CONFIG.decisionInterval);
      return;
    }

    if (traffic.isDirtTraffic) {
      bounds = trafficRegionBounds(traffic);
      targetX = actionRoll < 0.55
        ? randomInBounds(bounds)
        : (Math.random() < 0.5 ? bounds.left : bounds.right);
      traffic.weaveTargetX = clamp(targetX, bounds.left, bounds.right);
      traffic.weaveTimer = randomInRange(TRAFFIC_WEAVE_CONFIG.decisionInterval);
      return;
    }

    if (actionRoll < 0.55) {
      targetX = chooseWithinLaneTarget(traffic, targetLane);
    } else if (difficulty.id === "hard") {
      const legalLanes = hardLegalLanesForTraffic(traffic);
      const otherLane = legalLanes.find(function (lane) {
        return lane !== targetLane;
      });

      if (otherLane !== undefined && Math.random() < 0.55 && hardTrafficLaneChangeIsSafe(traffic, otherLane)) {
        targetLane = otherLane;
        targetX = chooseWithinLaneTarget(traffic, targetLane);
      } else {
        const bounds = trafficRegionBounds(traffic);
        targetX = Math.random() < 0.5 ? bounds.left : bounds.right;
      }
    } else {
      const bounds = trafficRegionBounds(traffic);
      targetX = Math.random() < 0.5 ? bounds.left : bounds.right;
    }

    traffic.currentLaneIndex = targetLane;
    traffic.targetLaneIndex = targetLane;
    traffic.weaveTargetX = clamp(targetX, trafficRegionBounds(traffic).left, trafficRegionBounds(traffic).right);
    traffic.weaveTimer = randomInRange(TRAFFIC_WEAVE_CONFIG.decisionInterval);
  }

  function initializeTrafficWeave(traffic, isDirtTraffic) {
    const difficulty = currentDifficulty();
    const enabled = trafficWeavingEnabled(difficulty);
    const initialX = isDirtTraffic
      ? dirtTrafficPosition(traffic)
      : laneCenterRatio(traffic.lane, difficulty.laneCount);

    traffic.logicalX = initialX;
    traffic.weaveEnabled = enabled;
    traffic.isDirtTraffic = !!isDirtTraffic;
    traffic.currentLaneIndex = traffic.lane;
    traffic.targetLaneIndex = traffic.lane;
    traffic.weaveCurrentOffset = 0;
    traffic.weaveTargetX = initialX;
    traffic.weaveTimer = enabled ? randomInRange(TRAFFIC_WEAVE_CONFIG.initialDelay) : Infinity;
    traffic.weaveDuration = 0;
    traffic.weaveCooldown = 0;

    const bounds = trafficRegionBounds(traffic);
    traffic.allowedCorridorLeft = bounds.left;
    traffic.allowedCorridorRight = bounds.right;
  }

  function updateTrafficWeave(traffic, deltaSeconds) {
    if (!traffic.weaveEnabled) {
      traffic.logicalX = trafficLogicalX(traffic);
      return;
    }

    const bounds = trafficRegionBounds(traffic);
    const speed = TRAFFIC_WEAVE_CONFIG.lateralSpeeds[traffic.type] || TRAFFIC_WEAVE_CONFIG.lateralSpeeds.car;

    traffic.allowedCorridorLeft = bounds.left;
    traffic.allowedCorridorRight = bounds.right;
    traffic.weaveTimer -= deltaSeconds;

    if (traffic.weaveTimer <= 0) {
      chooseTrafficWeaveTarget(traffic);
    }

    traffic.weaveTargetX = clamp(traffic.weaveTargetX, bounds.left, bounds.right);
    traffic.logicalX = moveTowards(trafficLogicalX(traffic), traffic.weaveTargetX, speed * deltaSeconds);
    traffic.logicalX = clamp(traffic.logicalX, bounds.left, bounds.right);
    traffic.weaveCurrentOffset = traffic.isDirtTraffic
      ? traffic.logicalX - ((bounds.left + bounds.right) * 0.5)
      : traffic.logicalX - laneCenterRatio(trafficCurrentLane(traffic), currentDifficulty().laneCount);
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
    let traffic;

    if (lane === null) {
      state.trafficSpawnTimer = TRAFFIC_RETRY_DELAY;
      return;
    }

    traffic = {
      lane: lane,
      direction: difficulty.laneDirections[lane],
      type: TRAFFIC_TYPES[Math.floor(Math.random() * TRAFFIC_TYPES.length)],
      animationPhase: Math.random() * 10,
      collidable: true,
      distance: TRAFFIC_SPAWN_DISTANCE,
      depth: 0,
    };
    initializeTrafficWeave(traffic, false);
    state.traffic.push(traffic);

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
      updateTrafficWeave(traffic, deltaSeconds);

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
    let traffic;

    if (!dirtTrafficLaneIsSafe(side)) {
      state.dirtTrafficSpawnTimers[side] = DIRT_TRAFFIC_CONFIG.retryDelay;
      return;
    }

    traffic = {
      side: side,
      direction: Math.random() < DIRT_TRAFFIC_CONFIG.sameDirectionProbability ? "sameDirection" : "oncoming",
      type: TRAFFIC_TYPES[Math.floor(Math.random() * TRAFFIC_TYPES.length)],
      animationPhase: Math.random() * 10,
      collidable: true,
      distance: TRAFFIC_SPAWN_DISTANCE,
      depth: 0,
    };
    initializeTrafficWeave(traffic, true);
    state.dirtTraffic[side].push(traffic);

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
      updateTrafficWeave(traffic, deltaSeconds);

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

  function standingCowSpawnDelay() {
    return randomInRange(STANDING_COW_CONFIG.spawnDelayRange);
  }

  function resetStandingCows() {
    state.standingCows = [];
    state.standingCowSpawnTimer = standingCowSpawnDelay();
    state.nextStandingCowId = 1;
  }

  function standingCowSpawnPosition() {
    const difficulty = currentDifficulty();
    const bounds = window.RacingRender.standingCowXBounds
      ? window.RacingRender.standingCowXBounds(canvas, state, STANDING_COW_CONFIG.spawnDistance)
      : { min: 0.08, max: 0.92 };

    if (difficulty.id === "realism") {
      return bounds.min + Math.random() * (bounds.max - bounds.min);
    }

    const lane = Math.floor(Math.random() * difficulty.laneCount);
    const laneWidth = 1 / difficulty.laneCount;
    const laneCenter = (lane + 0.5) / difficulty.laneCount;
    const jitter = (Math.random() - 0.5) * laneWidth * 0.45;

    return clamp(laneCenter + jitter, bounds.min, bounds.max);
  }

  function dirtTrafficPosition(traffic) {
    if (Number.isFinite(traffic.logicalX)) {
      return traffic.logicalX;
    }

    const dirtWidth = TRAFFIC_WEAVE_CONFIG.dirtRoadWidthRelativeToTarmacLane / Math.max(1, currentDifficulty().laneCount);

    return traffic.side === "left"
      ? -TRAFFIC_WEAVE_CONFIG.realismDirtRoadGapRatio - dirtWidth * 0.5
      : 1 + TRAFFIC_WEAVE_CONFIG.realismDirtRoadGapRatio + dirtWidth * 0.5;
  }

  function standingCowSpawnIsSafe(position) {
    const spawnDistance = STANDING_COW_CONFIG.spawnDistance;
    const playerDistance = 1 - window.RacingRender.playerDepth;
    const nearPlayer = Math.abs(spawnDistance - playerDistance) < STANDING_COW_CONFIG.playerDistanceGap &&
      Math.abs(position - state.playerX) < STANDING_COW_CONFIG.crossingPositionGap;
    const hitsTraffic = state.traffic.some(function (traffic) {
      return (
        Math.abs(traffic.distance - spawnDistance) < STANDING_COW_CONFIG.trafficDistanceGap &&
        Math.abs(trafficPosition(traffic) - position) < STANDING_COW_CONFIG.trafficPositionGap
      );
    });
    const hitsDirtTraffic = allDirtTraffic().some(function (traffic) {
      return (
        Math.abs(traffic.distance - spawnDistance) < STANDING_COW_CONFIG.trafficDistanceGap &&
        Math.abs(dirtTrafficPosition(traffic) - position) < STANDING_COW_CONFIG.trafficPositionGap
      );
    });
    const hitsCrossingObstacle = state.crossingObstacle && (
      Math.abs(state.crossingObstacle.distance - spawnDistance) < STANDING_COW_CONFIG.crossingDistanceGap &&
      Math.abs(state.crossingObstacle.crossing - position) < STANDING_COW_CONFIG.crossingPositionGap
    );
    const hitsSugarcane = state.sugarcanes.some(function (sugarcane) {
      return (
        Math.abs(sugarcane.distance - spawnDistance) < STANDING_COW_CONFIG.sugarcaneDistanceGap &&
        Math.abs(sugarcane.position - position) < STANDING_COW_CONFIG.sugarcanePositionGap
      );
    });
    const obscuredByDirtPatch = state.dirtPatches.some(function (patch) {
      const difficulty = currentDifficulty();
      const lane = Math.min(difficulty.laneCount - 1, Math.max(0, Math.floor(position * difficulty.laneCount)));

      return (
        position >= 0 &&
        position <= 1 &&
        patch.distance <= spawnDistance &&
        patch.distance + patch.length >= spawnDistance &&
        patch.laneMask[lane] === true
      );
    });

    return !nearPlayer && !hitsTraffic && !hitsDirtTraffic && !hitsCrossingObstacle && !hitsSugarcane && !obscuredByDirtPatch;
  }

  function spawnStandingCow() {
    const position = standingCowSpawnPosition();

    if (!standingCowSpawnIsSafe(position)) {
      state.standingCowSpawnTimer = STANDING_COW_CONFIG.retryDelay;
      return;
    }

    state.standingCows.push({
      id: state.nextStandingCowId,
      position: position,
      facing: Math.random() < 0.5 ? "left" : "right",
      animationTime: Math.random() * 10,
      collidable: true,
      distance: STANDING_COW_CONFIG.spawnDistance,
      depth: 1 - STANDING_COW_CONFIG.spawnDistance / TRAFFIC_SPAWN_DISTANCE,
    });
    state.nextStandingCowId += 1;
    state.standingCowSpawnTimer = standingCowSpawnDelay();
  }

  function updateStandingCows(deltaSeconds) {
    if (state.standingCows.length < STANDING_COW_CONFIG.maxActive) {
      state.standingCowSpawnTimer -= deltaSeconds;

      if (state.standingCowSpawnTimer <= 0) {
        spawnStandingCow();
      }
    }

    state.standingCows.forEach(function (cow) {
      cow.distance -= kmhToWorldUnits(state.speed) * deltaSeconds;
      cow.depth = clamp(1 - cow.distance / TRAFFIC_SPAWN_DISTANCE, 0.03, 1.12);
      cow.animationTime += deltaSeconds;

      if (cow.depth > window.RacingRender.playerDepth) {
        cow.collidable = false;
      }
    });

    state.standingCows = state.standingCows.filter(function (cow) {
      return cow.distance >= STANDING_COW_CONFIG.removeDistance && cow.depth <= window.RacingRender.playerDepth + PASSED_DEPTH_MARGIN;
    });

    if (state.standingCows.length >= STANDING_COW_CONFIG.maxActive) {
      state.standingCowSpawnTimer = standingCowSpawnDelay();
    }
  }

  function trafficPosition(traffic) {
    const difficulty = currentDifficulty();
    if (Number.isFinite(traffic.logicalX)) {
      return traffic.logicalX;
    }

    return (traffic.lane + 0.5) / difficulty.laneCount;
  }

  function sugarcaneSpawnIsSafe(position) {
    const hitsTraffic = state.traffic.some(function (traffic) {
      return (
        Math.abs(traffic.distance - SUGARCANE_SPAWN_DISTANCE) < SUGARCANE_TRAFFIC_DISTANCE_GAP * SUGARCANE_SAFETY_SCALE &&
        Math.abs(trafficPosition(traffic) - position) < SUGARCANE_POSITION_GAP * SUGARCANE_SAFETY_SCALE
      );
    });
    const hitsCrossingObstacle = state.crossingObstacle && (
      Math.abs(state.crossingObstacle.distance - SUGARCANE_SPAWN_DISTANCE) < SUGARCANE_CROSSING_DISTANCE_GAP * SUGARCANE_SAFETY_SCALE &&
      Math.abs(state.crossingObstacle.crossing - position) < SUGARCANE_POSITION_GAP * SUGARCANE_SAFETY_SCALE
    );
    const hitsStandingCow = state.standingCows.some(function (cow) {
      return (
        Math.abs(cow.distance - SUGARCANE_SPAWN_DISTANCE) < SUGARCANE_CROSSING_DISTANCE_GAP * SUGARCANE_SAFETY_SCALE &&
        Math.abs(cow.position - position) < SUGARCANE_POSITION_GAP * SUGARCANE_SAFETY_SCALE
      );
    });
    const hitsPlayer = (
      Math.abs((1 - window.RacingRender.playerDepth) - SUGARCANE_SPAWN_DISTANCE) < SUGARCANE_CROSSING_DISTANCE_GAP * SUGARCANE_SAFETY_SCALE &&
      Math.abs(state.playerX - position) < SUGARCANE_POSITION_GAP * SUGARCANE_SAFETY_SCALE
    );
    const hitsSugarcane = state.sugarcanes.some(function (sugarcane) {
      return (
        Math.abs(sugarcane.distance - SUGARCANE_SPAWN_DISTANCE) < SUGARCANE_SELF_DISTANCE_GAP * SUGARCANE_SAFETY_SCALE &&
        Math.abs(sugarcane.position - position) < SUGARCANE_SELF_POSITION_GAP * SUGARCANE_SAFETY_SCALE
      );
    });

    return !hitsTraffic && !hitsCrossingObstacle && !hitsStandingCow && !hitsPlayer && !hitsSugarcane;
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

    if (!braking && state.playerEffectiveSurface === PLAYER_SURFACES.tarmac && state.speed >= state.playerTier.maxSpeed - FULL_SPEED_TOLERANCE) {
      state.fullSpeedScore += state.playerTier.fullSpeedPointsPerSecond * deltaSeconds;
    }

    state.liveScore = calculateLiveScore();
  }

  function determinePlayerTier(sugarcaneCount) {
    let tier = PLAYER_TIERS[0];

    PLAYER_TIERS.forEach(function (candidate, index) {
      if (sugarcaneCount >= UPGRADE_THRESHOLDS[index]) {
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
    jumpHud.textContent = "Jumps: " + availableJumpCharges();
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
    if (playerIsAirborne()) {
      return;
    }

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
    const hitStandingCow = bounds.standingCows && bounds.standingCows.some(function (cowBounds, index) {
      const cow = state.standingCows[index];
      const depthDifference = playerDepth - cow.depth;
      const cowIsWithinCollisionApproach = depthDifference >= 0 && depthDifference <= TRAFFIC_COLLISION_DEPTH_TOLERANCE;

      return cow.collidable !== false && cowIsWithinCollisionApproach && horizontalOverlap(bounds.player, cowBounds);
    });
    const hitCrossingObstacle = visibleBounds.crossingObstacle && rectanglesOverlap(visibleBounds.player, visibleBounds.crossingObstacle);

    if (hitTraffic || hitDirtTraffic || hitStandingCow || hitCrossingObstacle) {
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
    if (playerIsAirborne()) {
      return;
    }

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
      input.consumeJump();
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
      input.consumeJump();
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
      input.consumeJump();
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
      input.consumeJump();
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

    if (input.consumeJump()) {
      beginJump();
    }

    state.restartWasDown = restartIsDown;
    const braking = input.braking();
    updateDirtPatches(deltaSeconds);
    updatePlayerSurface();
    const surfaceMaxSpeed = currentSurfaceMaxSpeed();
    const targetSpeed = braking ? Math.min(BRAKE_SPEED, surfaceMaxSpeed) : surfaceMaxSpeed;
    const speedChange = targetSpeed > state.speed ? ACCELERATION : (playerIsOnDirt() ? DIRT_DECELERATION : BRAKE_DECELERATION);
    const airborne = playerIsAirborne();
    const direction = airborne ? 0 : (input.steerRight() ? 1 : 0) - (input.steerLeft() ? 1 : 0);
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
    const steeringMultiplier = !airborne && playerIsOnDirt() ? dirtSteeringMultiplier() : 1;
    const dirtDrift = airborne ? 0 : updateDirtDrift(deltaSeconds, surfaceMaxSpeed);

    if (airborne && state.playerJumpLockedX !== null) {
      state.playerX = clamp(state.playerJumpLockedX, playerXBounds.min, playerXBounds.max);
    } else {
      state.playerX = clamp(
        state.playerX + direction * STEERING_SPEED * steeringMultiplier * deltaSeconds + dirtDrift,
        playerXBounds.min,
        playerXBounds.max
      );
    }
    updatePlayerSurface();

    updateDecelerationState(deltaSeconds, previousSpeedKmh);
    state.roadScroll += worldVisualSpeed(state.speed) * deltaSeconds;
    updateTraffic(deltaSeconds);
    updateDirtTraffic(deltaSeconds);
    removeOvertakenTraffic();
    updateCrossingObstacle(deltaSeconds);
    updateStandingCows(deltaSeconds);
    updateSugarcane(deltaSeconds);
    updateJump(deltaSeconds);
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
