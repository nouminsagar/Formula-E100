(function () {
  "use strict";

  const ROAD_TOP_WIDTH = 96;
  const ROAD_BOTTOM_WIDTH_RATIO = 0.82;
  const REALISM_TARMAC_WIDTH_MULTIPLIER = 0.60;
  const DIRT_ROAD_WIDTH_RELATIVE_TO_TARMAC_LANE = 1.00;
  const DIRT_ROAD_GAP_RATIO = 0.035;
  const TIER_2_RENDER_SCALE = 1.20;
  const TIER_3_RENDER_SCALE = 1.20;
  const TIER_4_WIDTH_MULTIPLIER = 1.18;
  const TIER_4_HEIGHT_MULTIPLIER = 0.78;
  const SUGARCANE_RENDER_SCALE = 1.30;
  const HORIZON_RATIO = 0.29;
  const SEGMENT_COUNT = 26;
  const PLAYER_DEPTH = 0.88;
  const REALISM_SURFACE_HYSTERESIS_LANE_RATIO = 0.04;
  const TAPRI_SOURCE_CROP = {
    x: 2,
    y: 0,
    width: 803,
    height: 609,
  };
  const TAPRI_RENDER_LANE_WIDTH_RATIO = 1.05;
  const TAPRI_COLLISION_RATIO = {
    width: 0.88,
    height: 0.66,
  };
  const STANDING_COW_COLLISION_RATIO = {
    width: 0.72,
    height: 0.68,
  };
  const STANDING_COW_IDLE_POSES_PER_SECOND = 2;
  const STANDING_COW_IDLE_POSES = [
    { verticalOffsetRatio: 0, rotationDegrees: -0.2 },
    { verticalOffsetRatio: -0.005, rotationDegrees: 0.2 },
    { verticalOffsetRatio: 0, rotationDegrees: 0.2 },
    { verticalOffsetRatio: -0.003, rotationDegrees: -0.2 },
  ];
  const PLAYER_PROFILES = {
    tier1: {
      widthRatio: 0.1,
      heightRatio: 1.45,
      minWidth: 42,
      bodyColor: "#d74336",
      markColor: "#f2d15e",
      trimColor: "#20242c",
    },
    tier2: {
      widthRatio: 0.105,
      heightRatio: 1.34,
      minWidth: 44,
      bodyColor: "#1f9d75",
      markColor: "#f7f3e8",
      trimColor: "#20242c",
    },
    tier3: {
      widthRatio: 0.115,
      heightRatio: 1.24,
      minWidth: 48,
      bodyColor: "#f08a31",
      markColor: "#20242c",
      trimColor: "#f7f3e8",
    },
    tier4: {
      widthRatio: 0.12,
      heightRatio: 1.12,
      minWidth: 52,
      bodyColor: "#f7f3e8",
      markColor: "#7c4d9f",
      trimColor: "#20242c",
    },
  };
  const TRAFFIC_PROFILES = {
    car: {
      widthRatio: 0.16,
      heightRatio: 1.55,
      minWidth: 8,
      bodyColor: "#2f68c9",
      markColor: "#d7edf8",
      trimColor: "#20242c",
    },
    rickshaw: {
      widthRatio: 0.12,
      heightRatio: 1.45,
      minWidth: 7,
      bodyColor: "#d9a127",
      markColor: "#2d5f38",
      trimColor: "#f7f3e8",
    },
    truck: {
      widthRatio: 0.2,
      heightRatio: 1.78,
      minWidth: 10,
      bodyColor: "#7c4d9f",
      markColor: "#c7b5df",
      trimColor: "#20242c",
    },
  };
  const CROSSING_PROFILES = {
    human: {
      widthRatio: 0.045,
      heightRatio: 2.6,
      minWidth: 5,
      bodyColor: "#ef4ec8",
      markColor: "#f7f3e8",
    },
    cow: {
      widthRatio: 0.12,
      heightRatio: 0.92,
      minWidth: 10,
      bodyColor: "#73c75b",
      markColor: "#73c75b",
    },
  };
  const SUGARCANE_PROFILE = {
    widthRatio: 0.055,
    heightRatio: 2.25,
    minWidth: 7,
    bodyColor: "#b8d83f",
  };
  const TRAFFIC_CAR_RENDER_SCALE = 0.82;
  const PLAYER_COLLISION_RATIO = {
    width: 0.62,
    height: 0.68,
  };
  const TRAFFIC_COLLISION_RATIOS = {
    car: {
      width: 0.62,
      height: 0.66,
    },
    rickshaw: {
      width: 0.58,
      height: 0.68,
    },
    truck: {
      width: 0.68,
      height: 0.74,
    },
  };
  const HUMAN_CUTOUT_POSES = [
    {
      verticalOffsetRatio: 0,
      rotationDegrees: -2.5,
    },
    {
      verticalOffsetRatio: -0.04,
      rotationDegrees: 2.5,
    },
    {
      verticalOffsetRatio: 0,
      rotationDegrees: -1.5,
    },
    {
      verticalOffsetRatio: -0.02,
      rotationDegrees: 1.5,
    },
  ];
  const COW_CUTOUT_POSES = [
    {
      verticalOffsetRatio: 0,
      rotationDegrees: -1,
    },
    {
      verticalOffsetRatio: -0.02,
      rotationDegrees: 1,
    },
    {
      verticalOffsetRatio: 0,
      rotationDegrees: -0.5,
    },
    {
      verticalOffsetRatio: -0.01,
      rotationDegrees: 0.5,
    },
  ];
  const HUMAN_CUTOUT_POSES_PER_SECOND = 7;
  const COW_CUTOUT_POSES_PER_SECOND = 4;
  const PLAYER_SUSPENSION_POSES = [
    {
      verticalOffsetRatio: 0,
      rotationDegrees: -0.4,
    },
    {
      verticalOffsetRatio: -0.012,
      rotationDegrees: 0.4,
    },
    {
      verticalOffsetRatio: 0,
      rotationDegrees: -0.2,
    },
    {
      verticalOffsetRatio: -0.006,
      rotationDegrees: 0.2,
    },
  ];
  const TRAFFIC_CUTOUT_ANIMATION = {
    car: {
      posesPerSecond: 5,
      poses: [
        {
          verticalOffsetRatio: 0,
          rotationDegrees: -0.5,
        },
        {
          verticalOffsetRatio: -0.01,
          rotationDegrees: 0.5,
        },
        {
          verticalOffsetRatio: 0,
          rotationDegrees: -0.25,
        },
        {
          verticalOffsetRatio: -0.005,
          rotationDegrees: 0.25,
        },
      ],
    },
    rickshaw: {
      posesPerSecond: 6,
      poses: [
        {
          verticalOffsetRatio: 0,
          rotationDegrees: -1.5,
        },
        {
          verticalOffsetRatio: -0.018,
          rotationDegrees: 1.5,
        },
        {
          verticalOffsetRatio: 0,
          rotationDegrees: -0.8,
        },
        {
          verticalOffsetRatio: -0.01,
          rotationDegrees: 0.8,
        },
      ],
    },
    truck: {
      posesPerSecond: 3,
      poses: [
        {
          verticalOffsetRatio: 0,
          rotationDegrees: -0.25,
        },
        {
          verticalOffsetRatio: -0.005,
          rotationDegrees: 0.25,
        },
        {
          verticalOffsetRatio: 0,
          rotationDegrees: -0.15,
        },
        {
          verticalOffsetRatio: -0.0025,
          rotationDegrees: 0.15,
        },
      ],
    },
  };
  const PLAYER_MIN_SUSPENSION_POSES_PER_SECOND = 3;
  const PLAYER_MAX_SUSPENSION_POSES_PER_SECOND = 7;
  const PLAYER_STEERING_ROTATION_DEGREES = 3;
  const PLAYER_STEERING_SHIFT_RATIO = 0.015;
  const PLAYER_BRAKING_RATE_MULTIPLIER = 0.5;
  const PLAYER_BRAKING_VERTICAL_OFFSET_RATIO = 0.006;
  const PLAYER_BRAKING_ROTATION_DEGREES = 1;
  const JUMP_PEAK_SCREEN_RATIO = 0.12;
  const JUMP_HUD_SAFE_BOTTOM_RATIO = 0.24;
  const JUMP_HUD_SAFE_MARGIN = 12;
  const ENVIRONMENT_SECTION_TYPES = [
    "dryField",
    "greenCrop",
    "settlement",
    "utilityPoles",
    "boundaryWall",
  ];
  const ROAD_COLORS = {
    asphaltA: "#2f3030",
    asphaltB: "#383736",
    worn: "#45423d",
    patch: "#252626",
    crack: "#1d1d1d",
    dust: "#9a7650",
    edgeLine: "#ded8c6",
    laneLine: "#d8d2c0",
    wornLaneLine: "#aaa58f",
    yellowLine: "#d6ad45",
    shoulderA: "#b98245",
    shoulderB: "#a56f3d",
    shoulderDust: "#c99b62",
    dirtRoadA: "#a96f36",
    dirtRoadB: "#946231",
    dirtRut: "#744c2d",
    dirtEdge: "#c49258",
    patchDirt: "#a9773d",
    patchDirtDark: "#76502d",
    patchDirtLight: "#bd8951",
  };
  const TERRAIN_COLORS = {
    dryA: "#b99657",
    dryB: "#c7a365",
    cropA: "#637f42",
    cropB: "#78974d",
    soilA: "#8d603f",
    soilB: "#775037",
    irrigation: "#6f8a87",
    wall: "#d7c9ad",
    wallBlue: "#8fb0ba",
    treeA: "#3f6c3c",
    treeB: "#527f43",
    treeC: "#6c8c46",
    trunk: "#745034",
    buildingCream: "#d8c4a1",
    buildingBlue: "#80a9ad",
    buildingPink: "#c48d87",
    buildingRoof: "#8c6b52",
    pole: "#746a5b",
    wire: "#5f625f",
    marker: "#ded2b6",
    markerTop: "#9e4b38",
    barrierBlack: "#242424",
    barrierYellow: "#c7a13c",
  };
  const SPRITE_PATH = "assets/sprites/";
  const SPRITE_SOURCES = {
    player: {
      tier1: "player-tier-1-rear.png",
      tier2: "player-tier-2-rear.png",
      tier3: "player-tier-3-rear.png",
      tier4: "player-tier-4-rear.png",
    },
    traffic: {
      car: {
        sameDirection: "traffic-car-rear.png",
        oncoming: "traffic-car-front.png",
      },
      rickshaw: {
        sameDirection: "rickshaw-rear.png",
        oncoming: "rickshaw-front.png",
      },
      truck: {
        sameDirection: "truck-rear.png",
        oncoming: "truck-front.png",
      },
    },
    crossing: {
      human: {
        left: "human-left.png",
        right: "human-right.png",
      },
      cow: {
        left: "cow-left.png",
        right: "cow-right.png",
      },
    },
    sugarcane: "sugarcane.png",
    tapri: "tapri.png",
  };
  const sprites = {};

  function preloadSprite(name, filename) {
    const image = new Image();
    const sprite = {
      image: image,
      loaded: false,
      failed: false,
    };

    image.onload = function () {
      sprite.loaded = true;
    };
    image.onerror = function () {
      sprite.failed = true;
    };
    image.src = SPRITE_PATH + filename;
    sprites[name] = sprite;
  }

  function preloadSprites() {
    Object.keys(SPRITE_SOURCES.player).forEach(function (tierId) {
      preloadSprite("player." + tierId, SPRITE_SOURCES.player[tierId]);
    });

    Object.keys(SPRITE_SOURCES.traffic).forEach(function (type) {
      preloadSprite("traffic." + type + ".sameDirection", SPRITE_SOURCES.traffic[type].sameDirection);
      preloadSprite("traffic." + type + ".oncoming", SPRITE_SOURCES.traffic[type].oncoming);
    });

    Object.keys(SPRITE_SOURCES.crossing).forEach(function (type) {
      preloadSprite("crossing." + type + ".left", SPRITE_SOURCES.crossing[type].left);
      preloadSprite("crossing." + type + ".right", SPRITE_SOURCES.crossing[type].right);
    });

    preloadSprite("sugarcane", SPRITE_SOURCES.sugarcane);
    preloadSprite("tapri", SPRITE_SOURCES.tapri);
  }

  function spriteIsReady(sprite) {
    return sprite && sprite.loaded && !sprite.failed;
  }

  function drawSprite(ctx, sprite, bounds) {
    if (!spriteIsReady(sprite)) {
      return false;
    }

    ctx.drawImage(sprite.image, bounds.x, bounds.y, bounds.width, bounds.height);
    return true;
  }

  function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  function spriteAspectRatio(sprite) {
    if (!spriteIsReady(sprite) || sprite.image.naturalWidth === 0) {
      return null;
    }

    return sprite.image.naturalHeight / sprite.image.naturalWidth;
  }

  function bottomCenteredBounds(bounds, widthRatio, heightRatio) {
    const hitWidth = bounds.width * widthRatio;
    const hitHeight = bounds.height * heightRatio;

    return {
      x: bounds.x + (bounds.width - hitWidth) * 0.5,
      y: bounds.y + bounds.height - hitHeight,
      width: hitWidth,
      height: hitHeight,
    };
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function steppedPose(animationTime, posesPerSecond, poses) {
    const poseIndex = Math.floor(animationTime * posesPerSecond) % poses.length;

    return poses[poseIndex];
  }

  function realismTarmacWidthMultiplier(difficulty) {
    return difficulty && difficulty.id === "realism" ? REALISM_TARMAC_WIDTH_MULTIPLIER : 1;
  }

  function roadAtDepth(width, height, depth, difficulty) {
    const horizonY = height * HORIZON_RATIO;
    const eased = depth * depth;
    const roadWidth = lerp(
      ROAD_TOP_WIDTH * realismTarmacWidthMultiplier(difficulty),
      width * ROAD_BOTTOM_WIDTH_RATIO * realismTarmacWidthMultiplier(difficulty),
      eased
    );
    const centerX = width * 0.5;
    const y = lerp(horizonY, height, eased);

    return {
      left: centerX - roadWidth * 0.5,
      right: centerX + roadWidth * 0.5,
      y: y,
      width: roadWidth,
    };
  }

  function rounded(value) {
    return Math.round(value);
  }

  function drawPolygon(ctx, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(function (point, index) {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.closePath();
    ctx.fill();
  }

  function deterministicRandom(index, salt) {
    const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;

    return value - Math.floor(value);
  }

  function sectionType(segmentIndex) {
    const sectionIndex = Math.floor(segmentIndex / 5);
    const randomIndex = Math.floor(deterministicRandom(sectionIndex, 3) * ENVIRONMENT_SECTION_TYPES.length);

    return ENVIRONMENT_SECTION_TYPES[randomIndex];
  }

  function firstVisibleRoadSegment(scroll) {
    return Math.floor(scroll);
  }

  function segmentDepth(segmentIndex, scroll) {
    return 1 - (segmentIndex - scroll) / SEGMENT_COUNT;
  }

  function clampedSegmentDepth(segmentIndex, scroll) {
    return clamp(segmentDepth(segmentIndex, scroll), 0, 1);
  }

  function roadStripDepths(segmentIndex, scroll) {
    return {
      nearDepth: clampedSegmentDepth(segmentIndex, scroll),
      farDepth: clampedSegmentDepth(segmentIndex + 1, scroll),
    };
  }

  function roadStripBounds(width, height, segmentIndex, scroll, difficulty) {
    const depths = roadStripDepths(segmentIndex, scroll);
    const near = roadAtDepth(width, height, depths.nearDepth, difficulty);
    const far = roadAtDepth(width, height, depths.farDepth, difficulty);

    return {
      near: near,
      far: far,
      centerNear: width * 0.5,
      centerFar: width * 0.5,
    };
  }

  function roadEdgePoint(width, height, depth, side, offsetRatio, difficulty) {
    const road = roadAtDepth(width, height, clamp(depth, 0, 1), difficulty);
    const direction = side === "left" ? -1 : 1;
    const x = side === "left" ? road.left : road.right;

    return {
      x: x + road.width * offsetRatio * direction,
      y: road.y,
      road: road,
    };
  }

  function drawSegmentSide(ctx, width, height, nearDepth, farDepth, side, innerOffset, outerOffset, color, difficulty) {
    const nearInner = roadEdgePoint(width, height, nearDepth, side, innerOffset, difficulty);
    const nearOuter = roadEdgePoint(width, height, nearDepth, side, outerOffset, difficulty);
    const farOuter = roadEdgePoint(width, height, farDepth, side, outerOffset, difficulty);
    const farInner = roadEdgePoint(width, height, farDepth, side, innerOffset, difficulty);

    drawPolygon(ctx, [farInner, farOuter, nearOuter, nearInner], color);
  }

  function laneBoundaryPoint(width, height, depth, laneRatio, insetRatio, difficulty) {
    const road = roadAtDepth(width, height, clamp(depth, 0, 1), difficulty);
    const x = lerp(road.left, road.right, laneRatio);

    return {
      x: x + road.width * insetRatio,
      y: road.y,
    };
  }

  function drawProjectedLaneMark(ctx, width, height, nearDepth, farDepth, laneRatio, thicknessRatio, color, difficulty) {
    const nearRoad = roadAtDepth(width, height, clamp(nearDepth, 0, 1), difficulty);
    const farRoad = roadAtDepth(width, height, clamp(farDepth, 0, 1), difficulty);
    const nearThickness = nearRoad.width * thicknessRatio;
    const farThickness = farRoad.width * thicknessRatio;

    drawPolygon(ctx, [
      laneBoundaryPoint(width, height, farDepth, laneRatio, -farThickness / farRoad.width, difficulty),
      laneBoundaryPoint(width, height, farDepth, laneRatio, farThickness / farRoad.width, difficulty),
      laneBoundaryPoint(width, height, nearDepth, laneRatio, nearThickness / nearRoad.width, difficulty),
      laneBoundaryPoint(width, height, nearDepth, laneRatio, -nearThickness / nearRoad.width, difficulty),
    ], color);
  }

  function drawRect(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(1, width), Math.max(1, height));
  }

  function decorativeAnchor(width, height, depth, side, offsetRatio, difficulty) {
    const edge = roadEdgePoint(width, height, depth, side, offsetRatio + realismRoadsideOffsetRatio(difficulty), difficulty);
    const road = edge.road;

    return {
      x: edge.x,
      y: edge.y,
      scale: road.width / (width * ROAD_BOTTOM_WIDTH_RATIO),
      roadWidth: road.width,
    };
  }

  function laneCenterAtDepth(width, height, laneIndex, depth, laneCount, difficulty) {
    const road = roadAtDepth(width, height, depth, difficulty);
    return lerp(road.left, road.right, (laneIndex + 0.5) / laneCount);
  }

  function roadRatioCenterAtDepth(width, height, depth, ratio, difficulty) {
    const road = roadAtDepth(width, height, depth, difficulty);

    return lerp(road.left, road.right, ratio);
  }

  function trafficCenterRatio(traffic, laneCount) {
    if (traffic && Number.isFinite(traffic.logicalX)) {
      return traffic.logicalX;
    }

    return (traffic.lane + 0.5) / laneCount;
  }

  function playerProfile(tier) {
    return PLAYER_PROFILES[tier && tier.id] || PLAYER_PROFILES.tier1;
  }

  function playerRenderMultipliers(tier) {
    if (tier && tier.id === "tier2") {
      return { width: TIER_2_RENDER_SCALE, height: TIER_2_RENDER_SCALE };
    }

    if (tier && tier.id === "tier3") {
      return { width: TIER_3_RENDER_SCALE, height: TIER_3_RENDER_SCALE };
    }

    if (tier && tier.id === "tier4") {
      return { width: TIER_4_WIDTH_MULTIPLIER, height: TIER_4_HEIGHT_MULTIPLIER };
    }

    return { width: 1, height: 1 };
  }

  function playerJumpVerticalOffset(height, state, bounds) {
    if (!state || !state.jumpArcAmount) {
      return 0;
    }

    const normalBottomY = bounds.y + bounds.height;
    const hudSafeBottomY = height * JUMP_HUD_SAFE_BOTTOM_RATIO + JUMP_HUD_SAFE_MARGIN;
    const peakAnchorY = Math.max(height * JUMP_PEAK_SCREEN_RATIO, hudSafeBottomY);

    return (peakAnchorY - normalBottomY) * state.jumpArcAmount;
  }

  function playerBounds(width, height, playerX, tier, difficulty, state) {
    const road = roadAtDepth(width, height, PLAYER_DEPTH, difficulty);
    const profile = playerProfile(tier);
    const multipliers = playerRenderMultipliers(tier);
    const baseCarWidth = Math.max(profile.minWidth, road.width * profile.widthRatio);
    const baseCarHeight = baseCarWidth * profile.heightRatio;
    const carWidth = baseCarWidth * multipliers.width;
    const carHeight = baseCarHeight * multipliers.height;
    const x = lerp(road.left, road.right, playerX);
    const baseCenterY = height * 0.79;
    const baseBottomY = baseCenterY + baseCarHeight * 0.5;

    const bounds = {
      x: x - carWidth * 0.5,
      y: baseBottomY - carHeight,
      width: carWidth,
      height: carHeight,
    };

    bounds.y += playerJumpVerticalOffset(height, state, bounds);

    return bounds;
  }

  function trafficSpriteBounds(width, height, traffic, centerX, difficulty) {
    const depth = traffic.depth;
    const road = roadAtDepth(width, height, depth, difficulty);
    const profile = TRAFFIC_PROFILES[traffic.type] || TRAFFIC_PROFILES.car;
    const direction = traffic.direction === "oncoming" ? "oncoming" : "sameDirection";
    const sprite = sprites["traffic.car." + direction];
    const carWidth = Math.max(profile.minWidth, road.width * profile.widthRatio) * (traffic.type === "car" ? TRAFFIC_CAR_RENDER_SCALE : 1);
    const carHeight = carWidth * (traffic.type === "car" ? spriteAspectRatio(sprite) || profile.heightRatio : profile.heightRatio);
    const y = road.y;

    return {
      x: centerX - carWidth * 0.5,
      y: y - carHeight,
      width: carWidth,
      height: carHeight,
    };
  }

  function trafficBounds(width, height, traffic, laneCount, difficulty) {
    return trafficSpriteBounds(
      width,
      height,
      traffic,
      roadRatioCenterAtDepth(width, height, traffic.depth, trafficCenterRatio(traffic, laneCount), difficulty),
      difficulty
    );
  }

  function dirtRoadAtDepth(width, height, depth, side, difficulty) {
    const road = roadAtDepth(width, height, depth, difficulty);
    const laneWidth = road.width / Math.max(1, difficulty ? difficulty.laneCount : 2);
    const dirtWidth = laneWidth * DIRT_ROAD_WIDTH_RELATIVE_TO_TARMAC_LANE;
    const gap = road.width * DIRT_ROAD_GAP_RATIO;

    if (side === "left") {
      const right = road.left - gap;

      return {
        left: right - dirtWidth,
        right: right,
        y: road.y,
        width: dirtWidth,
      };
    }

    const left = road.right + gap;

    return {
      left: left,
      right: left + dirtWidth,
      y: road.y,
      width: dirtWidth,
    };
  }

  function realismDirtOuterOffsetRatio(difficulty) {
    if (!difficulty || difficulty.id !== "realism") {
      return 0;
    }

    return DIRT_ROAD_GAP_RATIO + DIRT_ROAD_WIDTH_RELATIVE_TO_TARMAC_LANE / Math.max(1, difficulty.laneCount);
  }

  function realismRoadsideOffsetRatio(difficulty) {
    return realismDirtOuterOffsetRatio(difficulty) + (difficulty && difficulty.id === "realism" ? 0.08 : 0);
  }

  function drivingCorridorAtDepth(width, height, depth, difficulty) {
    const road = roadAtDepth(width, height, depth, difficulty);

    if (!difficulty || difficulty.id !== "realism") {
      return {
        left: road.left,
        right: road.right,
        width: road.width,
        road: road,
        leftDirt: null,
        rightDirt: null,
      };
    }

    const leftDirt = dirtRoadAtDepth(width, height, depth, "left", difficulty);
    const rightDirt = dirtRoadAtDepth(width, height, depth, "right", difficulty);

    return {
      left: leftDirt.left,
      right: rightDirt.right,
      width: rightDirt.right - leftDirt.left,
      road: road,
      leftDirt: leftDirt,
      rightDirt: rightDirt,
    };
  }

  function tapriRoadEdge(width, height, tapri, difficulty) {
    const depth = tapri.depth;

    if (difficulty && difficulty.id === "realism") {
      const dirtRoad = dirtRoadAtDepth(width, height, depth, tapri.side, difficulty);

      return {
        edgeX: tapri.side === "left" ? dirtRoad.left : dirtRoad.right,
        roadWidth: roadAtDepth(width, height, depth, difficulty).width,
        laneWidth: roadAtDepth(width, height, depth, difficulty).width / Math.max(1, difficulty.laneCount),
        y: dirtRoad.y,
      };
    }

    const road = roadAtDepth(width, height, depth, difficulty);

    return {
      edgeX: tapri.side === "left" ? road.left : road.right,
      roadWidth: road.width,
      laneWidth: road.width / Math.max(1, difficulty ? difficulty.laneCount : 4),
      y: road.y,
    };
  }

  function tapriBounds(width, height, tapri, difficulty) {
    const edge = tapriRoadEdge(width, height, tapri, difficulty);
    const tapriWidth = edge.laneWidth * TAPRI_RENDER_LANE_WIDTH_RATIO * (tapri.scale || 1);
    const tapriHeight = tapriWidth * (TAPRI_SOURCE_CROP.height / TAPRI_SOURCE_CROP.width);
    const hitWidth = tapriWidth * TAPRI_COLLISION_RATIO.width;
    const intrusion = hitWidth * (tapri.intrusion || 0.32);
    let hitX;

    if (tapri.side === "left") {
      hitX = edge.edgeX + intrusion - hitWidth;
    } else {
      hitX = edge.edgeX - intrusion;
    }

    return {
      x: hitX - (tapriWidth - hitWidth) * 0.5,
      y: edge.y - tapriHeight,
      width: tapriWidth,
      height: tapriHeight,
    };
  }

  function tapriCollisionBounds(width, height, tapri, difficulty) {
    return bottomCenteredBounds(
      tapriBounds(width, height, tapri, difficulty),
      TAPRI_COLLISION_RATIO.width,
      TAPRI_COLLISION_RATIO.height
    );
  }

  function dirtTrafficBounds(width, height, traffic, difficulty) {
    const dirtRoad = dirtRoadAtDepth(width, height, traffic.depth, traffic.side, difficulty);
    const centerX = Number.isFinite(traffic.logicalX)
      ? roadRatioCenterAtDepth(width, height, traffic.depth, traffic.logicalX, difficulty)
      : (dirtRoad.left + dirtRoad.right) * 0.5;

    return trafficSpriteBounds(width, height, traffic, centerX, difficulty);
  }

  function dirtTrafficCollisionBounds(width, height, traffic, difficulty) {
    const bounds = dirtTrafficBounds(width, height, traffic, difficulty);
    const ratios = TRAFFIC_COLLISION_RATIOS[traffic.type] || TRAFFIC_COLLISION_RATIOS.car;

    return bottomCenteredBounds(bounds, ratios.width, ratios.height);
  }

  function drawDirtRoadStrip(ctx, width, height, nearDepth, farDepth, side, color, difficulty) {
    const near = dirtRoadAtDepth(width, height, nearDepth, side, difficulty);
    const far = dirtRoadAtDepth(width, height, farDepth, side, difficulty);

    drawPolygon(ctx, [
      { x: far.left, y: far.y },
      { x: far.right, y: far.y },
      { x: near.right, y: near.y },
      { x: near.left, y: near.y },
    ], color);
  }

  function drawDirtRoadRuts(ctx, width, height, nearDepth, farDepth, side, difficulty) {
    const rutOffsets = [0.34, 0.66];

    rutOffsets.forEach(function (rutOffset) {
      const near = dirtRoadAtDepth(width, height, nearDepth, side, difficulty);
      const far = dirtRoadAtDepth(width, height, farDepth, side, difficulty);
      const nearThickness = near.width * 0.035;
      const farThickness = far.width * 0.035;

      drawPolygon(ctx, [
        { x: lerp(far.left, far.right, rutOffset) - farThickness, y: far.y },
        { x: lerp(far.left, far.right, rutOffset) + farThickness, y: far.y },
        { x: lerp(near.left, near.right, rutOffset) + nearThickness, y: near.y },
        { x: lerp(near.left, near.right, rutOffset) - nearThickness, y: near.y },
      ], ROAD_COLORS.dirtRut);
    });
  }

  function drawDirtRoadEdges(ctx, width, height, nearDepth, farDepth, side, difficulty) {
    const near = dirtRoadAtDepth(width, height, nearDepth, side, difficulty);
    const far = dirtRoadAtDepth(width, height, farDepth, side, difficulty);
    const thicknessNear = near.width * 0.045;
    const thicknessFar = far.width * 0.045;

    drawPolygon(ctx, [
      { x: far.left - thicknessFar, y: far.y },
      { x: far.left + thicknessFar, y: far.y },
      { x: near.left + thicknessNear, y: near.y },
      { x: near.left - thicknessNear, y: near.y },
    ], ROAD_COLORS.dirtEdge);
    drawPolygon(ctx, [
      { x: far.right - thicknessFar, y: far.y },
      { x: far.right + thicknessFar, y: far.y },
      { x: near.right + thicknessNear, y: near.y },
      { x: near.right - thicknessNear, y: near.y },
    ], ROAD_COLORS.dirtEdge);
  }

  function drawRealismDirtRoads(ctx, width, height, scroll, difficulty) {
    if (!difficulty || difficulty.id !== "realism") {
      return;
    }

    const firstSegment = firstVisibleRoadSegment(scroll);

    for (let offset = SEGMENT_COUNT - 1; offset >= 0; offset -= 1) {
      const segmentIndex = firstSegment + offset;
      const depths = roadStripDepths(segmentIndex, scroll);
      const color = segmentIndex % 2 === 0 ? ROAD_COLORS.dirtRoadA : ROAD_COLORS.dirtRoadB;

      ["left", "right"].forEach(function (side) {
        drawDirtRoadStrip(ctx, width, height, depths.nearDepth, depths.farDepth, side, color, difficulty);
        drawDirtRoadRuts(ctx, width, height, depths.nearDepth, depths.farDepth, side, difficulty);
        if (segmentIndex % 3 === 0) {
          drawDirtRoadEdges(ctx, width, height, depths.nearDepth, depths.farDepth, side, difficulty);
        }
      });
    }
  }

  function playerCollisionBounds(width, height, playerX, tier, difficulty) {
    return bottomCenteredBounds(playerBounds(width, height, playerX, tier, difficulty), PLAYER_COLLISION_RATIO.width, PLAYER_COLLISION_RATIO.height);
  }

  function trafficCollisionBounds(width, height, traffic, laneCount, difficulty) {
    const bounds = trafficBounds(width, height, traffic, laneCount, difficulty);
    const ratios = TRAFFIC_COLLISION_RATIOS[traffic.type] || TRAFFIC_COLLISION_RATIOS.car;

    return bottomCenteredBounds(bounds, ratios.width, ratios.height);
  }

  function crossingObstacleBounds(width, height, obstacle, difficulty) {
    const depth = obstacle.depth;
    const road = roadAtDepth(width, height, depth, difficulty);
    const profile = CROSSING_PROFILES[obstacle.type] || CROSSING_PROFILES.human;
    const obstacleWidth = Math.max(profile.minWidth, road.width * profile.widthRatio);
    const obstacleHeight = obstacleWidth * profile.heightRatio;
    const centerX = lerp(road.left, road.right, obstacle.crossing);
    const y = road.y;

    return {
      x: centerX - obstacleWidth * 0.5,
      y: y - obstacleHeight,
      width: obstacleWidth,
      height: obstacleHeight,
    };
  }

  function standingCowBounds(width, height, cow, difficulty) {
    const depth = cow.depth;
    const road = roadAtDepth(width, height, depth, difficulty);
    const profile = CROSSING_PROFILES.cow;
    const cowWidth = Math.max(profile.minWidth, road.width * profile.widthRatio);
    const cowHeight = cowWidth * profile.heightRatio;
    const centerX = lerp(road.left, road.right, cow.position);
    const y = road.y;

    return {
      x: centerX - cowWidth * 0.5,
      y: y - cowHeight,
      width: cowWidth,
      height: cowHeight,
    };
  }

  function standingCowCollisionBounds(width, height, cow, difficulty) {
    return bottomCenteredBounds(
      standingCowBounds(width, height, cow, difficulty),
      STANDING_COW_COLLISION_RATIO.width,
      STANDING_COW_COLLISION_RATIO.height
    );
  }

  function sugarcaneBounds(width, height, sugarcane, difficulty) {
    const depth = sugarcane.depth;
    const road = roadAtDepth(width, height, depth, difficulty);
    const baseSugarcaneWidth = Math.max(SUGARCANE_PROFILE.minWidth, road.width * SUGARCANE_PROFILE.widthRatio);
    const baseSugarcaneHeight = baseSugarcaneWidth * SUGARCANE_PROFILE.heightRatio;
    const sugarcaneWidth = baseSugarcaneWidth * SUGARCANE_RENDER_SCALE;
    const sugarcaneHeight = baseSugarcaneHeight * SUGARCANE_RENDER_SCALE;
    const centerX = lerp(road.left, road.right, sugarcane.position);
    const y = road.y;

    return {
      x: centerX - sugarcaneWidth * 0.5,
      y: y - sugarcaneHeight,
      width: sugarcaneWidth,
      height: sugarcaneHeight,
    };
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    words.forEach(function (word) {
      const testLine = line ? line + " " + word : word;

      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });

    if (line) {
      lines.push(line);
    }

    return lines;
  }

  function drawBackground(ctx, width, height) {
    const horizonY = height * HORIZON_RATIO;

    drawRect(ctx, 0, 0, width, horizonY * 0.36, "#8eb8c8");
    drawRect(ctx, 0, horizonY * 0.36, width, horizonY * 0.33, "#aac8d0");
    drawRect(ctx, 0, horizonY * 0.69, width, horizonY * 0.31, "#d7c7a6");

    drawCloud(ctx, width * 0.12, horizonY * 0.28, 46, "#c8d6d4");
    drawCloud(ctx, width * 0.74, horizonY * 0.2, 38, "#cfdbd7");
  }

  function drawGroundBase(ctx, width, height) {
    const horizonY = height * HORIZON_RATIO;
    const groundStartY = horizonY - 1;

    drawRect(ctx, 0, groundStartY, width, height - groundStartY, TERRAIN_COLORS.dryA);
  }

  function drawCloud(ctx, x, y, size, color) {
    drawRect(ctx, x, y + size * 0.25, size, size * 0.18, color);
    drawRect(ctx, x + size * 0.2, y, size * 0.42, size * 0.25, color);
    drawRect(ctx, x + size * 0.55, y + size * 0.12, size * 0.34, size * 0.22, color);
  }

  function drawHorizon(ctx, width, height) {
    const horizonY = height * HORIZON_RATIO;

    drawPolygon(ctx, [
      { x: 0, y: horizonY + 20 },
      { x: width * 0.16, y: horizonY + 8 },
      { x: width * 0.36, y: horizonY + 18 },
      { x: width * 0.58, y: horizonY + 7 },
      { x: width * 0.82, y: horizonY + 17 },
      { x: width, y: horizonY + 9 },
      { x: width, y: horizonY + 46 },
      { x: 0, y: horizonY + 46 },
    ], "#b2a978");

    drawRect(ctx, width * 0.08, horizonY + 18, width * 0.06, 13, "#9aa083");
    drawRect(ctx, width * 0.28, horizonY + 15, width * 0.045, 16, "#c9b692");
    drawRect(ctx, width * 0.53, horizonY + 13, width * 0.055, 18, "#b9b090");
    drawRect(ctx, width * 0.76, horizonY + 16, width * 0.05, 15, "#cfb69a");
    drawRect(ctx, width * 0.61, horizonY + 5, 4, 27, "#7c766a");
    drawRect(ctx, width * 0.595, horizonY + 3, 33, 6, "#817766");
    drawRect(ctx, width * 0.91, horizonY + 9, 3, 24, "#77766a");
    drawRect(ctx, width * 0.897, horizonY + 8, 29, 5, "#7e7a70");
  }

  function drawTerrain(ctx, width, height, scroll, difficulty) {
    const firstSegment = firstVisibleRoadSegment(scroll);
    const innerOffset = difficulty && difficulty.id === "realism" ? realismRoadsideOffsetRatio(difficulty) + 0.07 : 0.07;
    const outerOffset = difficulty && difficulty.id === "realism" ? innerOffset + 1.73 : 1.8;

    for (let offset = SEGMENT_COUNT - 1; offset >= 0; offset -= 1) {
      const segmentIndex = firstSegment + offset;
      const depths = roadStripDepths(segmentIndex, scroll);
      const type = sectionType(segmentIndex);
      const baseColor = terrainBaseColor(type, segmentIndex);

      drawSegmentSide(ctx, width, height, depths.nearDepth, depths.farDepth, "left", innerOffset, outerOffset, baseColor, difficulty);
      drawSegmentSide(ctx, width, height, depths.nearDepth, depths.farDepth, "right", innerOffset, outerOffset, baseColor, difficulty);
      drawFieldPatch(ctx, width, height, depths.nearDepth, depths.farDepth, segmentIndex, type, difficulty);
    }
  }

  function terrainBaseColor(type, segmentIndex) {
    if (type === "greenCrop") {
      return segmentIndex % 2 === 0 ? TERRAIN_COLORS.cropA : TERRAIN_COLORS.cropB;
    }

    if (type === "settlement" || type === "boundaryWall") {
      return segmentIndex % 2 === 0 ? TERRAIN_COLORS.soilA : TERRAIN_COLORS.dryA;
    }

    if (type === "utilityPoles") {
      return segmentIndex % 2 === 0 ? TERRAIN_COLORS.dryB : TERRAIN_COLORS.soilB;
    }

    return segmentIndex % 2 === 0 ? TERRAIN_COLORS.dryA : TERRAIN_COLORS.dryB;
  }

  function drawFieldPatch(ctx, width, height, nearDepth, farDepth, segmentIndex, type, difficulty) {
    const color = type === "greenCrop" ? TERRAIN_COLORS.cropB : TERRAIN_COLORS.soilA;
    const stripColor = type === "greenCrop" ? TERRAIN_COLORS.irrigation : TERRAIN_COLORS.dryB;
    const side = deterministicRandom(segmentIndex, 12) > 0.5 ? "left" : "right";
    const inner = realismRoadsideOffsetRatio(difficulty) + 0.22 + deterministicRandom(segmentIndex, 14) * 0.22;

    drawSegmentSide(ctx, width, height, nearDepth, farDepth, side, inner, inner + 0.16, color, difficulty);

    if (segmentIndex % 3 === 0) {
      drawSegmentSide(ctx, width, height, nearDepth, farDepth, side, inner + 0.19, inner + 0.22, stripColor, difficulty);
    }
  }

  function drawRoad(ctx, width, height, scroll, state) {
    const difficulty = state.difficulty;
    const laneCount = difficulty ? difficulty.laneCount : 4;
    const firstSegment = firstVisibleRoadSegment(scroll);

    drawTerrain(ctx, width, height, scroll, difficulty);
    drawShoulders(ctx, width, height, difficulty);
    drawRealismDirtRoads(ctx, width, height, scroll, difficulty);
    for (let offset = SEGMENT_COUNT - 1; offset >= 0; offset -= 1) {
      const segmentIndex = firstSegment + offset;
      const depths = roadStripDepths(segmentIndex, scroll);
      const near = roadAtDepth(width, height, depths.nearDepth, difficulty);
      const far = roadAtDepth(width, height, depths.farDepth, difficulty);

      ctx.beginPath();
      ctx.moveTo(far.left, far.y);
      ctx.lineTo(far.right, far.y);
      ctx.lineTo(near.right, near.y);
      ctx.lineTo(near.left, near.y);
      ctx.closePath();
      ctx.fillStyle = segmentIndex % 2 === 0 ? ROAD_COLORS.asphaltA : ROAD_COLORS.asphaltB;
      ctx.fill();

      drawRoadSurfaceDetails(ctx, width, height, depths.nearDepth, depths.farDepth, segmentIndex, difficulty);
    }

    drawDirtPatches(ctx, width, height, state);
    drawRoadEdges(ctx, width, height, difficulty);
    drawLaneLines(ctx, width, height, scroll, difficulty);
    drawRoadsideDecorations(ctx, width, height, scroll, difficulty);
  }

  function drawShoulders(ctx, width, height, difficulty) {
    const farDepth = 0;
    const nearDepth = 1;

    drawSegmentSide(ctx, width, height, nearDepth, farDepth, "left", 0, 0.095, ROAD_COLORS.shoulderA, difficulty);
    drawSegmentSide(ctx, width, height, nearDepth, farDepth, "right", 0, 0.095, ROAD_COLORS.shoulderA, difficulty);
    drawSegmentSide(ctx, width, height, nearDepth, farDepth, "left", 0, 0.018, ROAD_COLORS.shoulderDust, difficulty);
    drawSegmentSide(ctx, width, height, nearDepth, farDepth, "right", 0, 0.018, ROAD_COLORS.shoulderDust, difficulty);
  }

  function drawRoadSurfaceDetails(ctx, width, height, nearDepth, farDepth, segmentIndex, difficulty) {
    const variant = Math.floor(deterministicRandom(segmentIndex, 21) * 5);
    const near = roadAtDepth(width, height, nearDepth, difficulty);
    const far = roadAtDepth(width, height, farDepth, difficulty);
    const centerOffset = (deterministicRandom(segmentIndex, 22) - 0.5) * 0.34;

    if (variant === 0 || variant === 3) {
      drawPolygon(ctx, [
        { x: lerp(far.left, far.right, 0.5 + centerOffset), y: far.y },
        { x: lerp(far.left, far.right, 0.62 + centerOffset), y: far.y },
        { x: lerp(near.left, near.right, 0.62 + centerOffset), y: near.y },
        { x: lerp(near.left, near.right, 0.5 + centerOffset), y: near.y },
      ], variant === 0 ? ROAD_COLORS.patch : ROAD_COLORS.worn);
    }

    if (variant === 1 || variant === 4) {
      const crackRatio = 0.36 + deterministicRandom(segmentIndex, 24) * 0.28;

      drawProjectedLaneMark(ctx, width, height, nearDepth + 0.006, farDepth - 0.006, crackRatio, 0.0025, ROAD_COLORS.crack, difficulty);
    }

    drawSegmentSide(ctx, width, height, nearDepth, farDepth, "left", -0.03, 0, ROAD_COLORS.dust, difficulty);
    drawSegmentSide(ctx, width, height, nearDepth, farDepth, "right", -0.03, 0, ROAD_COLORS.dust, difficulty);
  }

  function dirtPatchLanePoint(width, height, depth, laneRatio, laneJitter, difficulty) {
    const road = roadAtDepth(width, height, clamp(depth, 0, 1), difficulty);

    return {
      x: lerp(road.left, road.right, laneRatio) + road.width * laneJitter,
      y: road.y,
    };
  }

  function drawDirtPatchLane(ctx, width, height, patch, lane, laneCount, nearDepth, farDepth, difficulty) {
    const leftRatio = lane / laneCount;
    const rightRatio = (lane + 1) / laneCount;
    const seed = patch.seed + lane * 17;
    const nearLeftJitter = (deterministicRandom(seed, 101) - 0.5) * 0.012;
    const nearRightJitter = (deterministicRandom(seed, 102) - 0.5) * 0.012;
    const farLeftJitter = (deterministicRandom(seed, 103) - 0.5) * 0.01;
    const farRightJitter = (deterministicRandom(seed, 104) - 0.5) * 0.01;
    const color = deterministicRandom(seed, 105) > 0.35 ? ROAD_COLORS.patchDirt : ROAD_COLORS.patchDirtLight;

    drawPolygon(ctx, [
      dirtPatchLanePoint(width, height, farDepth, leftRatio, farLeftJitter, difficulty),
      dirtPatchLanePoint(width, height, farDepth, rightRatio, farRightJitter, difficulty),
      dirtPatchLanePoint(width, height, nearDepth, rightRatio, nearRightJitter, difficulty),
      dirtPatchLanePoint(width, height, nearDepth, leftRatio, nearLeftJitter, difficulty),
    ], color);

    if (deterministicRandom(seed, 106) > 0.2) {
      const rutA = lerp(leftRatio, rightRatio, 0.32);
      const rutB = lerp(leftRatio, rightRatio, 0.68);
      drawProjectedLaneMark(ctx, width, height, nearDepth, farDepth, rutA, 0.0025, ROAD_COLORS.patchDirtDark, difficulty);
      drawProjectedLaneMark(ctx, width, height, nearDepth, farDepth, rutB, 0.0025, ROAD_COLORS.patchDirtDark, difficulty);
    }

    if (deterministicRandom(seed, 107) > 0.55) {
      const compactRatio = lerp(leftRatio, rightRatio, 0.5 + (deterministicRandom(seed, 108) - 0.5) * 0.35);
      drawProjectedLaneMark(ctx, width, height, nearDepth + 0.01, farDepth - 0.01, compactRatio, 0.018, ROAD_COLORS.patchDirtDark, difficulty);
    }
  }

  function drawDirtPatches(ctx, width, height, state) {
    const difficulty = state.difficulty;
    const laneCount = difficulty ? difficulty.laneCount : 4;

    if (!state.dirtPatches || state.dirtPatches.length === 0) {
      return;
    }

    state.dirtPatches.forEach(function (patch) {
      const nearDepth = clamp(1 - patch.distance, 0, 1);
      const farDepth = clamp(1 - (patch.distance + patch.length), 0, 1);

      if (nearDepth <= 0 || farDepth >= 1 || nearDepth <= farDepth) {
        return;
      }

      patch.laneMask.forEach(function (covered, lane) {
        if (covered) {
          drawDirtPatchLane(ctx, width, height, patch, lane, laneCount, nearDepth, farDepth, difficulty);
        }
      });
    });
  }

  function drawRoadEdges(ctx, width, height, difficulty) {
    drawProjectedLaneMark(ctx, width, height, 1, 0, 0.015, 0.003, ROAD_COLORS.edgeLine, difficulty);
    drawProjectedLaneMark(ctx, width, height, 1, 0, 0.985, 0.003, ROAD_COLORS.edgeLine, difficulty);
  }

  function drawLaneLines(ctx, width, height, scroll, difficulty) {
    const laneCount = difficulty ? difficulty.laneCount : 4;
    const laneDirections = difficulty ? difficulty.laneDirections : [];
    const firstSegment = firstVisibleRoadSegment(scroll);

    for (let lane = 1; lane < laneCount; lane += 1) {
      for (let offset = 0; offset < SEGMENT_COUNT; offset += 1) {
        const segmentIndex = firstSegment + offset;
        if (segmentIndex % 2 !== 0) {
          continue;
        }

        const wear = Math.floor(deterministicRandom(segmentIndex + lane * 41, 31) * 4);
        const startTrim = wear === 1 ? 0.08 : 0;
        const endTrim = wear === 2 ? 0.1 : 0;
        const nearDepth = clamp(1 - (segmentIndex + 0.12 + startTrim - scroll) / SEGMENT_COUNT, 0, 1);
        const farDepth = clamp(1 - (segmentIndex + 0.78 - endTrim - scroll) / SEGMENT_COUNT, 0, 1);
        const laneRatio = lane / laneCount;
        const isDirectionalDivider = laneDirections[lane - 1] === "sameDirection" && laneDirections[lane] === "oncoming";
        const color = isDirectionalDivider ? ROAD_COLORS.yellowLine : (wear === 3 ? ROAD_COLORS.wornLaneLine : ROAD_COLORS.laneLine);
        const thickness = isDirectionalDivider ? 0.005 : 0.004;

        drawProjectedLaneMark(ctx, width, height, nearDepth, farDepth, laneRatio, thickness, color, difficulty);

        if (wear === 2 && !isDirectionalDivider) {
          const missingNear = clamp(1 - (segmentIndex + 0.42 - scroll) / SEGMENT_COUNT, 0, 1);
          const missingFar = clamp(1 - (segmentIndex + 0.54 - scroll) / SEGMENT_COUNT, 0, 1);

          drawProjectedLaneMark(ctx, width, height, missingNear, missingFar, laneRatio, thickness * 1.15, segmentIndex % 2 === 0 ? ROAD_COLORS.asphaltA : ROAD_COLORS.asphaltB, difficulty);
        }
      }
    }
  }

  function drawRoadsideDecorations(ctx, width, height, scroll, difficulty) {
    const firstSegment = firstVisibleRoadSegment(scroll);

    for (let offset = SEGMENT_COUNT - 1; offset >= 0; offset -= 1) {
      const segmentIndex = firstSegment + offset;
      const depth = clamp(1 - (segmentIndex + 0.48 - scroll) / SEGMENT_COUNT, 0, 1);
      const type = sectionType(segmentIndex);

      drawRoadsideObject(ctx, width, height, depth, segmentIndex, type, "left", difficulty);
      drawRoadsideObject(ctx, width, height, depth, segmentIndex, type, "right", difficulty);
    }
  }

  function drawRoadsideObject(ctx, width, height, depth, segmentIndex, type, side, difficulty) {
    const sideSalt = side === "left" ? 0 : 97;
    const chance = deterministicRandom(segmentIndex, sideSalt + 41);

    if (type === "utilityPoles") {
      if (segmentIndex % 2 === (side === "left" ? 0 : 1)) {
        drawUtilityPole(ctx, width, height, depth, side, segmentIndex, difficulty);
      }
      if (chance > 0.72) {
        drawBushCluster(ctx, width, height, depth, side, segmentIndex, difficulty);
      }
      return;
    }

    if (type === "greenCrop") {
      if (chance > 0.45) {
        drawTree(ctx, width, height, depth, side, segmentIndex, difficulty);
      } else if (segmentIndex % 4 === 0) {
        drawMilestone(ctx, width, height, depth, side, difficulty);
      }
      return;
    }

    if (type === "settlement") {
      if (chance > 0.58 && depth < 0.82) {
        drawBuilding(ctx, width, height, depth, side, segmentIndex, difficulty);
      } else if (segmentIndex % 3 === 0) {
        drawBarrier(ctx, width, height, depth, side, segmentIndex, difficulty);
      }
      return;
    }

    if (type === "boundaryWall") {
      if (segmentIndex % 2 === 0) {
        drawLowWall(ctx, width, height, depth, side, segmentIndex, difficulty);
      } else if (chance > 0.72) {
        drawTree(ctx, width, height, depth, side, segmentIndex, difficulty);
      }
      return;
    }

    if (chance > 0.66) {
      drawBarrier(ctx, width, height, depth, side, segmentIndex, difficulty);
    } else if (chance < 0.18) {
      drawMilestone(ctx, width, height, depth, side, difficulty);
    }
  }

  function drawBarrier(ctx, width, height, depth, side, segmentIndex, difficulty) {
    const anchor = decorativeAnchor(width, height, depth, side, 0.16, difficulty);
    const blockWidth = Math.max(3, anchor.roadWidth * 0.035);
    const blockHeight = Math.max(3, anchor.roadWidth * 0.018);
    const blocks = 2 + Math.floor(deterministicRandom(segmentIndex, 51) * 3);
    const direction = side === "left" ? -1 : 1;

    for (let block = 0; block < blocks; block += 1) {
      const x = anchor.x + direction * block * blockWidth * 1.1;
      const color = block % 2 === 0 ? TERRAIN_COLORS.barrierYellow : TERRAIN_COLORS.barrierBlack;

      drawRect(ctx, x - blockWidth * 0.5, anchor.y - blockHeight, blockWidth, blockHeight, color);
    }
  }

  function drawMilestone(ctx, width, height, depth, side, difficulty) {
    const anchor = decorativeAnchor(width, height, depth, side, 0.19, difficulty);
    const markerWidth = Math.max(4, anchor.roadWidth * 0.025);
    const markerHeight = Math.max(8, anchor.roadWidth * 0.055);

    drawPolygon(ctx, [
      { x: anchor.x - markerWidth * 0.5, y: anchor.y },
      { x: anchor.x + markerWidth * 0.5, y: anchor.y },
      { x: anchor.x + markerWidth * 0.42, y: anchor.y - markerHeight * 0.75 },
      { x: anchor.x, y: anchor.y - markerHeight },
      { x: anchor.x - markerWidth * 0.42, y: anchor.y - markerHeight * 0.75 },
    ], TERRAIN_COLORS.marker);
    drawRect(ctx, anchor.x - markerWidth * 0.34, anchor.y - markerHeight * 0.8, markerWidth * 0.68, markerHeight * 0.18, TERRAIN_COLORS.markerTop);
    drawRect(ctx, anchor.x - 1, anchor.y - markerHeight * 0.45, 2, 2, "#4b4038");
  }

  function drawUtilityPole(ctx, width, height, depth, side, segmentIndex, difficulty) {
    const anchor = decorativeAnchor(width, height, depth, side, 0.34 + deterministicRandom(segmentIndex, 61) * 0.08, difficulty);
    const poleWidth = Math.max(2, anchor.roadWidth * 0.009);
    const poleHeight = Math.max(24, anchor.roadWidth * 0.22);
    const crossbarWidth = poleWidth * 8;

    drawRect(ctx, anchor.x - poleWidth * 0.5, anchor.y - poleHeight, poleWidth, poleHeight, TERRAIN_COLORS.pole);
    drawRect(ctx, anchor.x - crossbarWidth * 0.5, anchor.y - poleHeight * 0.82, crossbarWidth, Math.max(1, poleWidth), TERRAIN_COLORS.pole);

    if (depth < 0.75) {
      const nextAnchor = decorativeAnchor(width, height, Math.min(depth + 1 / SEGMENT_COUNT, 1), side, 0.34, difficulty);
      const wireY = anchor.y - poleHeight * 0.8;
      const nextWireY = nextAnchor.y - poleHeight * 0.7;

      ctx.save();
      ctx.strokeStyle = TERRAIN_COLORS.wire;
      ctx.lineWidth = Math.max(1, rounded(poleWidth * 0.45));
      ctx.beginPath();
      ctx.moveTo(rounded(anchor.x), rounded(wireY));
      ctx.lineTo(rounded(nextAnchor.x), rounded(nextWireY));
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTree(ctx, width, height, depth, side, segmentIndex, difficulty) {
    const isPalm = deterministicRandom(segmentIndex, side === "left" ? 71 : 73) > 0.68;
    const anchor = decorativeAnchor(width, height, depth, side, isPalm ? 0.44 : 0.28, difficulty);
    const treeWidth = Math.max(8, anchor.roadWidth * (isPalm ? 0.08 : 0.12));
    const treeHeight = Math.max(18, anchor.roadWidth * (isPalm ? 0.28 : 0.18));

    drawRect(ctx, anchor.x - treeWidth * 0.08, anchor.y - treeHeight * 0.72, treeWidth * 0.16, treeHeight * 0.72, TERRAIN_COLORS.trunk);

    if (isPalm) {
      drawPolygon(ctx, [
        { x: anchor.x, y: anchor.y - treeHeight },
        { x: anchor.x - treeWidth * 0.58, y: anchor.y - treeHeight * 0.74 },
        { x: anchor.x - treeWidth * 0.18, y: anchor.y - treeHeight * 0.7 },
        { x: anchor.x - treeWidth * 0.4, y: anchor.y - treeHeight * 0.48 },
        { x: anchor.x, y: anchor.y - treeHeight * 0.64 },
        { x: anchor.x + treeWidth * 0.42, y: anchor.y - treeHeight * 0.48 },
        { x: anchor.x + treeWidth * 0.18, y: anchor.y - treeHeight * 0.7 },
        { x: anchor.x + treeWidth * 0.58, y: anchor.y - treeHeight * 0.74 },
      ], TERRAIN_COLORS.treeB);
    } else {
      drawRect(ctx, anchor.x - treeWidth * 0.45, anchor.y - treeHeight, treeWidth * 0.9, treeHeight * 0.32, TERRAIN_COLORS.treeA);
      drawRect(ctx, anchor.x - treeWidth * 0.58, anchor.y - treeHeight * 0.78, treeWidth * 1.16, treeHeight * 0.32, TERRAIN_COLORS.treeB);
      drawRect(ctx, anchor.x - treeWidth * 0.34, anchor.y - treeHeight * 0.58, treeWidth * 0.68, treeHeight * 0.24, TERRAIN_COLORS.treeC);
    }
  }

  function drawBushCluster(ctx, width, height, depth, side, segmentIndex, difficulty) {
    const anchor = decorativeAnchor(width, height, depth, side, 0.2 + deterministicRandom(segmentIndex, 81) * 0.08, difficulty);
    const bushWidth = Math.max(8, anchor.roadWidth * 0.08);
    const bushHeight = Math.max(4, anchor.roadWidth * 0.035);

    drawRect(ctx, anchor.x - bushWidth * 0.5, anchor.y - bushHeight, bushWidth * 0.5, bushHeight, TERRAIN_COLORS.treeA);
    drawRect(ctx, anchor.x - bushWidth * 0.05, anchor.y - bushHeight * 1.35, bushWidth * 0.58, bushHeight * 1.35, TERRAIN_COLORS.treeB);
  }

  function drawBuilding(ctx, width, height, depth, side, segmentIndex, difficulty) {
    const anchor = decorativeAnchor(width, height, depth, side, 0.54 + deterministicRandom(segmentIndex, 91) * 0.1, difficulty);
    const buildingWidth = Math.max(14, anchor.roadWidth * 0.16);
    const buildingHeight = Math.max(10, anchor.roadWidth * 0.11);
    const colors = [TERRAIN_COLORS.buildingCream, TERRAIN_COLORS.buildingBlue, TERRAIN_COLORS.buildingPink];
    const color = colors[Math.floor(deterministicRandom(segmentIndex, 92) * colors.length)];

    drawRect(ctx, anchor.x - buildingWidth * 0.5, anchor.y - buildingHeight, buildingWidth, buildingHeight, color);
    drawRect(ctx, anchor.x - buildingWidth * 0.55, anchor.y - buildingHeight * 1.16, buildingWidth * 1.1, buildingHeight * 0.18, TERRAIN_COLORS.buildingRoof);
    drawRect(ctx, anchor.x + buildingWidth * 0.18, anchor.y - buildingHeight * 1.42, buildingWidth * 0.18, buildingHeight * 0.26, "#6f7d7d");
    drawRect(ctx, anchor.x + buildingWidth * 0.08, anchor.y - buildingHeight * 1.5, buildingWidth * 0.38, buildingHeight * 0.12, "#586968");
    drawRect(ctx, anchor.x - buildingWidth * 0.32, anchor.y - buildingHeight * 0.56, buildingWidth * 0.16, buildingHeight * 0.2, "#5f6b6b");
  }

  function drawLowWall(ctx, width, height, depth, side, segmentIndex, difficulty) {
    const anchor = decorativeAnchor(width, height, depth, side, 0.24, difficulty);
    const wallWidth = Math.max(20, anchor.roadWidth * 0.22);
    const wallHeight = Math.max(4, anchor.roadWidth * 0.035);
    const direction = side === "left" ? -1 : 1;
    const x = anchor.x + direction * wallWidth * 0.28;

    drawRect(ctx, x - wallWidth * 0.5, anchor.y - wallHeight, wallWidth, wallHeight, segmentIndex % 4 === 0 ? TERRAIN_COLORS.wallBlue : TERRAIN_COLORS.wall);
    drawRect(ctx, x - wallWidth * 0.5, anchor.y - wallHeight, wallWidth, Math.max(1, wallHeight * 0.22), "#ede0c6");
    drawRect(ctx, x - wallWidth * 0.48, anchor.y - wallHeight * 0.82, wallWidth * 0.12, wallHeight * 0.64, TERRAIN_COLORS.barrierYellow);
    drawRect(ctx, x + wallWidth * 0.36, anchor.y - wallHeight * 0.82, wallWidth * 0.12, wallHeight * 0.64, TERRAIN_COLORS.barrierBlack);
  }

  function drawPlaceholderCar(ctx, width, height, playerX, tier, difficulty) {
    const profile = playerProfile(tier);
    const bounds = playerBounds(width, height, playerX, tier, difficulty);
    const carWidth = bounds.width;
    const carHeight = bounds.height;
    const x = bounds.x + carWidth * 0.5;
    const y = bounds.y + carHeight * 0.5;

    ctx.fillStyle = profile.bodyColor;
    ctx.fillRect(bounds.x, bounds.y, carWidth, carHeight);

    ctx.fillStyle = profile.markColor;
    ctx.fillRect(x - carWidth * 0.36, y - carHeight * 0.42, carWidth * 0.22, carHeight * 0.15);
    ctx.fillRect(x + carWidth * 0.14, y - carHeight * 0.42, carWidth * 0.22, carHeight * 0.15);

    ctx.fillStyle = profile.trimColor;
    ctx.fillRect(x - carWidth * 0.34, y + carHeight * 0.35, carWidth * 0.68, carHeight * 0.12);
  }

  function playerVehiclePose(state, bounds) {
    const tier = state.playerTier || {};
    const speedRatio = tier.maxSpeed ? clamp(state.speed / tier.maxSpeed, 0, 1) : 0;
    let posesPerSecond = lerp(
      PLAYER_MIN_SUSPENSION_POSES_PER_SECOND,
      PLAYER_MAX_SUSPENSION_POSES_PER_SECOND,
      speedRatio
    );

    if (state.playerBrakingVisual) {
      posesPerSecond *= PLAYER_BRAKING_RATE_MULTIPLIER;
    }

    const suspensionPose = steppedPose(state.playerAnimationTime || 0, posesPerSecond, PLAYER_SUSPENSION_POSES);
    const steeringPose = state.playerSteeringPose || 0;

    return {
      horizontalOffset: bounds.width * PLAYER_STEERING_SHIFT_RATIO * steeringPose,
      verticalOffset: bounds.height * (
        suspensionPose.verticalOffsetRatio +
        (state.playerBrakingVisual ? PLAYER_BRAKING_VERTICAL_OFFSET_RATIO : 0)
      ),
      rotationDegrees:
        suspensionPose.rotationDegrees +
        steeringPose * PLAYER_STEERING_ROTATION_DEGREES +
        (state.playerBrakingVisual ? PLAYER_BRAKING_ROTATION_DEGREES : 0),
    };
  }

  function trafficVehiclePose(traffic) {
    const animation = TRAFFIC_CUTOUT_ANIMATION[traffic.type] || TRAFFIC_CUTOUT_ANIMATION.car;

    return steppedPose(
      (traffic.animationTime || 0) + (traffic.animationPhase || 0),
      animation.posesPerSecond,
      animation.poses
    );
  }

  function drawVehicleSprite(ctx, sprite, bounds, pose, fallbackDraw) {
    const centerX = bounds.x + bounds.width * 0.5;
    const bottomY = bounds.y + bounds.height;

    ctx.save();
    ctx.translate(centerX, bottomY);
    ctx.translate(pose.horizontalOffset || 0, pose.verticalOffset || 0);
    ctx.rotate(degreesToRadians(pose.rotationDegrees || 0));

    if (spriteIsReady(sprite)) {
      ctx.drawImage(sprite.image, -bounds.width * 0.5, -bounds.height, bounds.width, bounds.height);
    } else {
      fallbackDraw(ctx, {
        x: -bounds.width * 0.5,
        y: -bounds.height,
        width: bounds.width,
        height: bounds.height,
      });
    }

    ctx.restore();
  }

  function drawPlaceholderPlayerBounds(ctx, bounds, tier) {
    const profile = playerProfile(tier);
    const carWidth = bounds.width;
    const carHeight = bounds.height;
    const x = bounds.x + carWidth * 0.5;
    const y = bounds.y + carHeight * 0.5;

    ctx.fillStyle = profile.bodyColor;
    ctx.fillRect(bounds.x, bounds.y, carWidth, carHeight);

    ctx.fillStyle = profile.markColor;
    ctx.fillRect(x - carWidth * 0.36, y - carHeight * 0.42, carWidth * 0.22, carHeight * 0.15);
    ctx.fillRect(x + carWidth * 0.14, y - carHeight * 0.42, carWidth * 0.22, carHeight * 0.15);

    ctx.fillStyle = profile.trimColor;
    ctx.fillRect(x - carWidth * 0.34, y + carHeight * 0.35, carWidth * 0.68, carHeight * 0.12);
  }

  function drawCar(ctx, width, height, state) {
    const playerX = state.playerX;
    const tier = state.playerTier;
    const tierId = tier && tier.id ? tier.id : "tier1";
    const bounds = playerBounds(width, height, playerX, tier, state.difficulty, state);
    const pose = playerVehiclePose(state, bounds);

    drawVehicleSprite(ctx, sprites["player." + tierId], bounds, pose, function (context, fallbackBounds) {
      drawPlaceholderPlayerBounds(context, fallbackBounds, tier);
    });
  }

  function drawPlaceholderTrafficCar(ctx, width, height, traffic, laneCount, difficulty) {
    if (!traffic) {
      return;
    }

    const bounds = trafficBounds(width, height, traffic, laneCount, difficulty);
    const profile = TRAFFIC_PROFILES[traffic.type] || TRAFFIC_PROFILES.car;
    const carWidth = bounds.width;
    const carHeight = bounds.height;
    const x = bounds.x + carWidth * 0.5;

    ctx.fillStyle = profile.bodyColor;
    ctx.fillRect(bounds.x, bounds.y, carWidth, carHeight);

    ctx.fillStyle = profile.markColor;
    ctx.fillRect(bounds.x + carWidth * 0.22, bounds.y + carHeight * 0.18, carWidth * 0.56, carHeight * 0.22);

    ctx.fillStyle = profile.trimColor;
    ctx.fillRect(x - carWidth * 0.34, bounds.y + carHeight * 0.72, carWidth * 0.68, carHeight * 0.12);
  }

  function drawPlaceholderTrafficBounds(ctx, bounds, traffic) {
    const profile = TRAFFIC_PROFILES[traffic.type] || TRAFFIC_PROFILES.car;
    const carWidth = bounds.width;
    const carHeight = bounds.height;
    const x = bounds.x + carWidth * 0.5;

    ctx.fillStyle = profile.bodyColor;
    ctx.fillRect(bounds.x, bounds.y, carWidth, carHeight);

    ctx.fillStyle = profile.markColor;
    ctx.fillRect(bounds.x + carWidth * 0.22, bounds.y + carHeight * 0.18, carWidth * 0.56, carHeight * 0.22);

    ctx.fillStyle = profile.trimColor;
    ctx.fillRect(x - carWidth * 0.34, bounds.y + carHeight * 0.72, carWidth * 0.68, carHeight * 0.12);
  }

  function drawTrafficCar(ctx, width, height, traffic, laneCount, animationTime, difficulty, isDirtTraffic) {
    if (!traffic) {
      return;
    }

    const type = TRAFFIC_PROFILES[traffic.type] ? traffic.type : "car";
    const direction = traffic.direction === "oncoming" ? "oncoming" : "sameDirection";
    const bounds = isDirtTraffic
      ? dirtTrafficBounds(width, height, traffic, difficulty)
      : trafficBounds(width, height, traffic, laneCount, difficulty);
    const pose = trafficVehiclePose({
      type: type,
      animationTime: animationTime,
      animationPhase: traffic.animationPhase,
    });

    drawVehicleSprite(ctx, sprites["traffic." + type + "." + direction], bounds, pose, function (context, fallbackBounds) {
      drawPlaceholderTrafficBounds(context, fallbackBounds, traffic);
    });
  }

  function drawHuman(ctx, bounds) {
    const headSize = bounds.width * 0.9;
    const centerX = bounds.x + bounds.width * 0.5;

    ctx.fillStyle = CROSSING_PROFILES.human.bodyColor;
    ctx.fillRect(bounds.x, bounds.y + headSize * 0.9, bounds.width, bounds.height - headSize * 0.9);

    ctx.fillStyle = CROSSING_PROFILES.human.markColor;
    ctx.beginPath();
    ctx.arc(centerX, bounds.y + headSize * 0.45, headSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCow(ctx, bounds) {
    const profile = CROSSING_PROFILES.cow;

    ctx.fillStyle = profile.bodyColor;
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  function cutoutPose(obstacle) {
    const isCow = obstacle.type === "cow";
    const poses = isCow ? COW_CUTOUT_POSES : HUMAN_CUTOUT_POSES;
    const posesPerSecond = isCow ? COW_CUTOUT_POSES_PER_SECOND : HUMAN_CUTOUT_POSES_PER_SECOND;
    const poseIndex = Math.floor((obstacle.animationTime || 0) * posesPerSecond) % poses.length;

    return poses[poseIndex];
  }

  function drawCutoutSprite(ctx, sprite, bounds, pose, fallbackDraw) {
    const centerX = bounds.x + bounds.width * 0.5;
    const bottomY = bounds.y + bounds.height;
    const verticalOffset = bounds.height * pose.verticalOffsetRatio;

    ctx.save();
    ctx.translate(centerX, bottomY);
    ctx.rotate(degreesToRadians(pose.rotationDegrees));
    ctx.translate(0, verticalOffset);

    if (spriteIsReady(sprite)) {
      ctx.drawImage(sprite.image, -bounds.width * 0.5, -bounds.height, bounds.width, bounds.height);
    } else {
      fallbackDraw(ctx, {
        x: -bounds.width * 0.5,
        y: -bounds.height,
        width: bounds.width,
        height: bounds.height,
      });
    }

    ctx.restore();
  }

  function drawCrossingObstacle(ctx, width, height, obstacle, difficulty) {
    if (!obstacle) {
      return;
    }

    const bounds = crossingObstacleBounds(width, height, obstacle, difficulty);
    const pose = cutoutPose(obstacle);

    if (obstacle.type === "cow") {
      drawCutoutSprite(ctx, sprites["crossing.cow." + (obstacle.direction < 0 ? "left" : "right")], bounds, pose, drawCow);
    } else {
      drawCutoutSprite(ctx, sprites["crossing.human." + (obstacle.direction < 0 ? "left" : "right")], bounds, pose, drawHuman);
    }
  }

  function standingCowPose(cow) {
    return steppedPose(cow.animationTime || 0, STANDING_COW_IDLE_POSES_PER_SECOND, STANDING_COW_IDLE_POSES);
  }

  function drawStandingCow(ctx, width, height, cow, difficulty) {
    if (!cow) {
      return;
    }

    const bounds = standingCowBounds(width, height, cow, difficulty);
    const pose = standingCowPose(cow);
    const sprite = sprites["crossing.cow." + (cow.facing === "left" ? "left" : "right")];

    drawCutoutSprite(ctx, sprite, bounds, pose, drawCow);
  }

  function drawSugarcane(ctx, width, height, sugarcane, difficulty) {
    if (!sugarcane) {
      return;
    }

    const bounds = sugarcaneBounds(width, height, sugarcane, difficulty);

    if (!drawSprite(ctx, sprites.sugarcane, bounds)) {
      ctx.fillStyle = SUGARCANE_PROFILE.bodyColor;
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }

  function drawTapri(ctx, width, height, tapri, difficulty) {
    if (!tapri) {
      return;
    }

    const bounds = tapriBounds(width, height, tapri, difficulty);
    const sprite = sprites.tapri;

    if (!spriteIsReady(sprite)) {
      ctx.fillStyle = "#a45117";
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.fillStyle = "#2a160c";
      ctx.fillRect(bounds.x + bounds.width * 0.1, bounds.y + bounds.height * 0.25, bounds.width * 0.8, bounds.height * 0.42);
      return;
    }

    ctx.save();
    if (tapri.mirrored) {
      ctx.translate(bounds.x + bounds.width, bounds.y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        sprite.image,
        TAPRI_SOURCE_CROP.x,
        TAPRI_SOURCE_CROP.y,
        TAPRI_SOURCE_CROP.width,
        TAPRI_SOURCE_CROP.height,
        0,
        0,
        bounds.width,
        bounds.height
      );
    } else {
      ctx.drawImage(
        sprite.image,
        TAPRI_SOURCE_CROP.x,
        TAPRI_SOURCE_CROP.y,
        TAPRI_SOURCE_CROP.width,
        TAPRI_SOURCE_CROP.height,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height
      );
    }
    ctx.restore();
  }

  function drawSpeechBubble(ctx, width, height, state) {
    const bubble = state.humanMessage;

    if (!bubble || bubble.timer <= 0 || !bubble.text) {
      return;
    }

    const player = playerBounds(width, height, state.playerX, state.playerTier, state.difficulty, state);
    const maxTextWidth = Math.min(260, width * 0.34);
    const lineHeight = 16;
    const paddingX = 10;
    const paddingY = 8;

    ctx.save();
    ctx.font = "700 13px 'Courier New', 'Lucida Console', monospace";
    const lines = wrapText(ctx, bubble.text, maxTextWidth);
    const textWidth = Math.max.apply(null, lines.map(function (line) {
      return ctx.measureText(line).width;
    }));
    const bubbleWidth = textWidth + paddingX * 2;
    const bubbleHeight = lines.length * lineHeight + paddingY * 2;
    const hudAvoidY = 18 + 120;
    let x = player.x + player.width * 0.5 - bubbleWidth * 0.5;
    let y = player.y - bubbleHeight - 18;

    x = clamp(x, 10, width - bubbleWidth - 10);
    y = clamp(y, hudAvoidY, height - bubbleHeight - 10);

    ctx.fillStyle = "rgba(247, 243, 232, 0.96)";
    ctx.strokeStyle = "#20242c";
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, bubbleWidth, bubbleHeight);
    ctx.strokeRect(x, y, bubbleWidth, bubbleHeight);

    const pointerX = clamp(player.x + player.width * 0.5, x + 16, x + bubbleWidth - 16);
    ctx.beginPath();
    ctx.moveTo(pointerX - 8, y + bubbleHeight - 1);
    ctx.lineTo(pointerX + 8, y + bubbleHeight - 1);
    ctx.lineTo(pointerX, y + bubbleHeight + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#20242c";
    lines.forEach(function (line, index) {
      ctx.fillText(line, x + paddingX, y + paddingY + lineHeight * (index + 0.78));
    });
    ctx.restore();
  }

  function drawDebugRect(ctx, bounds, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.restore();
  }

  function drawDebugHitboxes(ctx, width, height, state, laneCount) {
    if (!state.debugHitboxes) {
      return;
    }

    const playerDepthRoad = roadAtDepth(width, height, PLAYER_DEPTH, state.difficulty);

    ctx.save();
    ctx.strokeStyle = "#70f5ff";
    ctx.fillStyle = "#70f5ff";
    ctx.font = "12px Arial, Helvetica, sans-serif";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(playerDepthRoad.left, playerDepthRoad.y);
    ctx.lineTo(playerDepthRoad.right, playerDepthRoad.y);
    ctx.stroke();
    ctx.fillText("player depth " + PLAYER_DEPTH.toFixed(2), playerDepthRoad.left + 6, playerDepthRoad.y - 6);
    ctx.restore();

    drawDebugRect(ctx, playerCollisionBounds(width, height, state.playerX, state.playerTier, state.difficulty), "#fffb4d");
    state.traffic.forEach(function (traffic) {
      const bounds = trafficCollisionBounds(width, height, traffic, laneCount, state.difficulty);

      drawDebugRect(ctx, bounds, "#ff4d4d");

      ctx.save();
      ctx.fillStyle = "#fffb4d";
      ctx.font = "12px Arial, Helvetica, sans-serif";
      ctx.fillText(traffic.depth.toFixed(3), bounds.x, bounds.y - 4);
      ctx.restore();
    });
    state.tapris.forEach(function (tapri) {
      drawDebugRect(ctx, tapriCollisionBounds(width, height, tapri, state.difficulty), "#ff9c2a");
    });
  }

  preloadSprites();

  function resetCanvasTransform(ctx) {
    const canvas = ctx.canvas;
    const scaleX = canvas.clientWidth ? canvas.width / canvas.clientWidth : 1;
    const scaleY = canvas.clientHeight ? canvas.height / canvas.clientHeight : scaleX;

    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  }

  function drawGroundAndRoad(ctx, width, height, scroll, state) {
    const difficulty = state.difficulty;
    const horizonY = height * HORIZON_RATIO;
    const groundStartY = horizonY - 1;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, groundStartY, width, height - groundStartY);
    ctx.clip();
    drawGroundBase(ctx, width, height);
    drawHorizon(ctx, width, height);
    drawRoad(ctx, width, height, scroll, state);
    ctx.restore();
  }

  window.RacingRender = {
    playerDepth: PLAYER_DEPTH,
    carMargin: function (width, height, difficulty) {
      return Math.max(42, roadAtDepth(width, height, PLAYER_DEPTH, difficulty).width * 0.1) * 0.5;
    },
    playerXBounds: function (canvas, state) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const difficulty = state.difficulty;
      const corridor = drivingCorridorAtDepth(width, height, PLAYER_DEPTH, difficulty);
      const road = corridor.road;
      const playerHitbox = playerCollisionBounds(width, height, 0.5, state.playerTier, difficulty);
      const halfPlayerHitboxRatio = playerHitbox.width * 0.5 / road.width;

      return {
        min: (corridor.left - road.left) / road.width + halfPlayerHitboxRatio,
        max: (corridor.right - road.left) / road.width - halfPlayerHitboxRatio,
      };
    },
    playerSurface: function (canvas, state, currentSurface) {
      const difficulty = state.difficulty;

      if (!difficulty || difficulty.id !== "realism") {
        return "tarmac";
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const road = roadAtDepth(width, height, PLAYER_DEPTH, difficulty);
      const centerX = lerp(road.left, road.right, state.playerX);
      const laneWidth = road.width / Math.max(1, difficulty.laneCount);
      const hysteresis = laneWidth * REALISM_SURFACE_HYSTERESIS_LANE_RATIO;
      const surface = currentSurface || "tarmac";

      if (surface === "leftDirt") {
        return centerX >= road.left + hysteresis ? "tarmac" : "leftDirt";
      }

      if (surface === "rightDirt") {
        return centerX <= road.right - hysteresis ? "tarmac" : "rightDirt";
      }

      if (centerX < road.left - hysteresis) {
        return "leftDirt";
      }

      if (centerX > road.right + hysteresis) {
        return "rightDirt";
      }

      return "tarmac";
    },
    drivingCorridor: function (canvas, state) {
      return drivingCorridorAtDepth(canvas.clientWidth, canvas.clientHeight, PLAYER_DEPTH, state.difficulty);
    },
    standingCowXBounds: function (canvas, state, distance) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const depth = clamp(1 - distance, 0.03, 1.12);
      const difficulty = state.difficulty;
      const corridor = drivingCorridorAtDepth(width, height, depth, difficulty);
      const road = corridor.road;
      const profile = CROSSING_PROFILES.cow;
      const cowWidth = Math.max(profile.minWidth, road.width * profile.widthRatio);
      const halfCowRatio = cowWidth * 0.5 / road.width;

      return {
        min: (corridor.left - road.left) / road.width + halfCowRatio,
        max: (corridor.right - road.left) / road.width - halfCowRatio,
      };
    },
    getBounds: function (canvas, state) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const laneCount = state.difficulty ? state.difficulty.laneCount : 4;
      const dirtTraffic = [];

      if (state.difficulty && state.difficulty.id === "realism" && state.dirtTraffic) {
        ["left", "right"].forEach(function (side) {
          state.dirtTraffic[side].forEach(function (traffic) {
            dirtTraffic.push(dirtTrafficCollisionBounds(width, height, traffic, state.difficulty));
          });
        });
      }

      return {
        player: playerCollisionBounds(width, height, state.playerX, state.playerTier, state.difficulty),
        traffic: state.traffic.map(function (traffic) {
          return trafficCollisionBounds(width, height, traffic, laneCount, state.difficulty);
        }),
        dirtTraffic: dirtTraffic,
        crossingObstacle: state.crossingObstacle ? crossingObstacleBounds(width, height, state.crossingObstacle, state.difficulty) : null,
        standingCows: state.standingCows.map(function (cow) {
          return standingCowCollisionBounds(width, height, cow, state.difficulty);
        }),
        sugarcanes: state.sugarcanes.map(function (sugarcane) {
          return sugarcaneBounds(width, height, sugarcane, state.difficulty);
        }),
        tapris: state.tapris.map(function (tapri) {
          return tapriCollisionBounds(width, height, tapri, state.difficulty);
        }),
      };
    },
    getVisibleBounds: function (canvas, state) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const laneCount = state.difficulty ? state.difficulty.laneCount : 4;

      return {
        player: playerBounds(width, height, state.playerX, state.playerTier, state.difficulty, state),
        traffic: state.traffic.map(function (traffic) {
          return trafficBounds(width, height, traffic, laneCount, state.difficulty);
        }),
        crossingObstacle: state.crossingObstacle ? crossingObstacleBounds(width, height, state.crossingObstacle, state.difficulty) : null,
        standingCows: state.standingCows.map(function (cow) {
          return standingCowBounds(width, height, cow, state.difficulty);
        }),
        sugarcanes: state.sugarcanes.map(function (sugarcane) {
          return sugarcaneBounds(width, height, sugarcane, state.difficulty);
        }),
        tapris: state.tapris.map(function (tapri) {
          return tapriBounds(width, height, tapri, state.difficulty);
        }),
      };
    },
    render: function (ctx, state) {
      const width = ctx.canvas.clientWidth;
      const height = ctx.canvas.clientHeight;
      const laneCount = state.difficulty ? state.difficulty.laneCount : 4;
      const renderItems = state.traffic.map(function (traffic) {
        return {
          type: "traffic",
          depth: traffic.depth,
          value: traffic,
        };
      });

      if (state.difficulty && state.difficulty.id === "realism" && state.dirtTraffic) {
        ["left", "right"].forEach(function (side) {
          state.dirtTraffic[side].forEach(function (traffic) {
            renderItems.push({
              type: "dirtTraffic",
              depth: traffic.depth,
              value: traffic,
            });
          });
        });
      }

      state.sugarcanes.forEach(function (sugarcane) {
        renderItems.push({
          type: "sugarcane",
          depth: sugarcane.depth,
          value: sugarcane,
        });
      });

      if (state.crossingObstacle) {
        renderItems.push({
          type: "crossingObstacle",
          depth: state.crossingObstacle.depth,
          value: state.crossingObstacle,
        });
      }

      state.standingCows.forEach(function (cow) {
        renderItems.push({
          type: "standingCow",
          depth: cow.depth,
          value: cow,
        });
      });

      state.tapris.forEach(function (tapri) {
        renderItems.push({
          type: "tapri",
          depth: tapri.depth,
          value: tapri,
        });
      });

      renderItems.push({
        type: "player",
        depth: state.jumpArcAmount > 0 ? 2 : PLAYER_DEPTH,
      });

      renderItems.sort(function (a, b) {
        return a.depth - b.depth;
      });

      resetCanvasTransform(ctx);
      ctx.imageSmoothingEnabled = false;
      drawBackground(ctx, width, height);
      drawGroundAndRoad(ctx, width, height, state.roadScroll, state);
      renderItems.forEach(function (item) {
        if (item.type === "traffic") {
          drawTrafficCar(ctx, width, height, item.value, laneCount, state.playerAnimationTime || 0, state.difficulty, false);
        } else if (item.type === "dirtTraffic") {
          drawTrafficCar(ctx, width, height, item.value, laneCount, state.playerAnimationTime || 0, state.difficulty, true);
        } else if (item.type === "sugarcane") {
          drawSugarcane(ctx, width, height, item.value, state.difficulty);
        } else if (item.type === "crossingObstacle") {
          drawCrossingObstacle(ctx, width, height, item.value, state.difficulty);
        } else if (item.type === "standingCow") {
          drawStandingCow(ctx, width, height, item.value, state.difficulty);
        } else if (item.type === "tapri") {
          drawTapri(ctx, width, height, item.value, state.difficulty);
        } else if (item.type === "player") {
          drawCar(ctx, width, height, state);
        }
      });
      drawSpeechBubble(ctx, width, height, state);
      drawDebugHitboxes(ctx, width, height, state, laneCount);
    },
  };
})();
