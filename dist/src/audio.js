(function () {
  "use strict";

  const AUDIO_CONFIG = {
    musicGain: 0.35,
    gameOverMusicGain: 0.055,
    engineGain: 0,
    sugarcanePickupGain: 0,
    dirtGain: 0.16,
    windGain: 0.16,
    sfxGain: 0.50,
    collisionGain: 0.65,
    hornGain: 0.35,
    maxVoices: 12,
    hornCooldownRange: {
      min: 3,
      max: 5,
    },
    muteStorageKey: "formulaE100Muted",
  };
  AUDIO_CONFIG.engineGain = AUDIO_CONFIG.musicGain * 0.10;
  AUDIO_CONFIG.sugarcanePickupGain = AUDIO_CONFIG.musicGain * 0.10;

  const MUSIC_PATH = "assets/audio/gameplay-music.mp3";
  const ENGINE_MIN_HZ = 50;
  const ENGINE_MAX_HZ = 100;
  const ENGINE_HARMONIC_MAX_HZ = 200;
  const ENGINE_FILTER_CUTOFF_HZ = 240;
  const oneShotCooldowns = {
    sugarcane: 0.06,
    humanImpact: 0.2,
    cowCollision: 0.3,
    menuMove: 0.08,
  };

  let audioContext = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let collisionGain = null;
  let engineGain = null;
  let dirtGain = null;
  let windGain = null;
  let hornGain = null;
  let compressor = null;
  let musicElement = null;
  let musicSourceNode = null;
  let engineOscillator = null;
  let engineHarmonic = null;
  let engineFilter = null;
  let dirtSource = null;
  let windSource = null;
  let brakeSource = null;
  let brakeGain = null;
  let initialized = false;
  let unlocked = false;
  let muted = readMutePreference();
  let currentScreen = "intro";
  let activeVoices = 0;
  let hornCooldown = 0;
  const eventCooldownUntil = {};

  function readMutePreference() {
    try {
      return sessionStorage.getItem(AUDIO_CONFIG.muteStorageKey) === "1";
    } catch {
      return false;
    }
  }

  function writeMutePreference() {
    try {
      sessionStorage.setItem(AUDIO_CONFIG.muteStorageKey, muted ? "1" : "0");
    } catch {
      // Session storage can be unavailable in some browser privacy modes.
    }
  }

  function randomInRange(range) {
    return range.min + Math.random() * (range.max - range.min);
  }

  function createNoiseBuffer(durationSeconds) {
    const sampleRate = audioContext.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * durationSeconds));
    const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < frameCount; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  function connectGain(parent, gainValue) {
    const gain = audioContext.createGain();

    gain.gain.value = gainValue;
    gain.connect(parent);
    return gain;
  }

  function initialize() {
    if (initialized) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      initialized = true;
      return;
    }

    audioContext = new AudioContextClass();
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 20;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    compressor.connect(audioContext.destination);

    masterGain = connectGain(compressor, muted ? 0 : 0.82);
    musicGain = connectGain(masterGain, 0);
    sfxGain = connectGain(masterGain, AUDIO_CONFIG.sfxGain);
    collisionGain = connectGain(masterGain, AUDIO_CONFIG.collisionGain);
    engineGain = connectGain(masterGain, 0);
    dirtGain = connectGain(masterGain, 0);
    windGain = connectGain(masterGain, 0);
    hornGain = connectGain(masterGain, AUDIO_CONFIG.hornGain);
    brakeGain = connectGain(masterGain, 0);

    musicElement = new Audio(MUSIC_PATH);
    musicElement.loop = true;
    musicElement.preload = "auto";
    musicSourceNode = audioContext.createMediaElementSource(musicElement);
    musicSourceNode.connect(musicGain);

    createContinuousLayers();
    initialized = true;
  }

  function createContinuousLayers() {
    engineOscillator = audioContext.createOscillator();
    const fundamentalGain = audioContext.createGain();
    engineOscillator.type = "sine";
    engineOscillator.frequency.value = ENGINE_MIN_HZ;
    fundamentalGain.gain.value = 0.75;

    engineFilter = audioContext.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = ENGINE_FILTER_CUTOFF_HZ;
    engineFilter.Q.value = 0.45;

    engineOscillator.connect(fundamentalGain);
    fundamentalGain.connect(engineFilter);
    engineOscillator.start();

    engineHarmonic = audioContext.createOscillator();
    const harmonicGain = audioContext.createGain();
    engineHarmonic.type = "triangle";
    engineHarmonic.frequency.value = ENGINE_MIN_HZ * 2;
    harmonicGain.gain.value = 0.15;
    engineHarmonic.connect(harmonicGain);
    harmonicGain.connect(engineFilter);
    engineHarmonic.start();
    engineFilter.connect(engineGain);

    dirtSource = audioContext.createBufferSource();
    const dirtFilter = audioContext.createBiquadFilter();
    dirtFilter.type = "bandpass";
    dirtFilter.frequency.value = 180;
    dirtFilter.Q.value = 0.7;
    dirtSource.buffer = createNoiseBuffer(1.1);
    dirtSource.loop = true;
    dirtSource.connect(dirtFilter);
    dirtFilter.connect(dirtGain);
    dirtSource.start();

    windSource = audioContext.createBufferSource();
    const windFilter = audioContext.createBiquadFilter();
    windFilter.type = "highpass";
    windFilter.frequency.value = 900;
    windSource.buffer = createNoiseBuffer(1.7);
    windSource.loop = true;
    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windSource.start();

    brakeSource = audioContext.createBufferSource();
    const brakeFilter = audioContext.createBiquadFilter();
    brakeFilter.type = "bandpass";
    brakeFilter.frequency.value = 1200;
    brakeFilter.Q.value = 1.8;
    brakeSource.buffer = createNoiseBuffer(0.38);
    brakeSource.loop = true;
    brakeSource.connect(brakeFilter);
    brakeFilter.connect(brakeGain);
    brakeSource.start();
  }

  function unlock() {
    initialize();
    if (!audioContext) {
      return Promise.resolve(false);
    }

    return audioContext.resume().then(function () {
      unlocked = true;
      return true;
    }).catch(function () {
      return false;
    });
  }

  function setGain(gainNode, value, seconds) {
    if (!gainNode || !audioContext) {
      return;
    }

    gainNode.gain.cancelScheduledValues(audioContext.currentTime);
    gainNode.gain.setTargetAtTime(value, audioContext.currentTime, Math.max(0.01, seconds || 0.05));
  }

  function setMute(nextMuted) {
    muted = !!nextMuted;
    writeMutePreference();
    initialize();
    setGain(masterGain, muted ? 0 : 0.82, 0.04);
  }

  function toggleMute() {
    setMute(!muted);
    play("menuConfirm");
    return muted;
  }

  function playMusic(resetTrack) {
    initialize();
    if (!musicElement || muted || !unlocked) {
      return;
    }

    if (resetTrack) {
      try {
        musicElement.currentTime = 0;
      } catch {
        // Some browsers can reject currentTime before metadata is ready.
      }
    }

    musicElement.play().catch(function () {
      // Audio unlock can fail without affecting gameplay.
    });
    setGain(musicGain, AUDIO_CONFIG.musicGain, 0.2);
  }

  function fadeMusic(target, seconds, stopAfterFade) {
    if (!musicElement || !musicGain) {
      return;
    }

    setGain(musicGain, muted ? 0 : target, seconds);
    if (stopAfterFade) {
      window.setTimeout(function () {
        if (currentScreen !== "gameplay" && currentScreen !== "gameOver") {
          musicElement.pause();
          try {
            musicElement.currentTime = 0;
          } catch {
            // Ignore metadata timing issues.
          }
        }
      }, Math.max(0, seconds * 1000 + 60));
    }
  }

  function setScreen(screen, options) {
    currentScreen = screen;
    initialize();
    if (!audioContext) {
      return;
    }

    if (screen === "gameplay") {
      playMusic(options && options.restartTrack);
    } else if (screen === "gameOver") {
      fadeMusic(AUDIO_CONFIG.gameOverMusicGain, 0.25, false);
      setGain(engineGain, 0, 0.18);
      setGain(dirtGain, 0, 0.16);
      setGain(windGain, 0, 0.16);
      setGain(brakeGain, 0, 0.08);
    } else {
      fadeMusic(0, 0.5, true);
      setGain(engineGain, 0, 0.18);
      setGain(dirtGain, 0, 0.16);
      setGain(windGain, 0, 0.16);
      setGain(brakeGain, 0, 0.08);
    }
  }

  function canPlayOneShot(name) {
    if (!audioContext || muted || !unlocked || activeVoices >= AUDIO_CONFIG.maxVoices) {
      return false;
    }

    const cooldown = oneShotCooldowns[name] || 0;
    if (cooldown && eventCooldownUntil[name] && eventCooldownUntil[name] > audioContext.currentTime) {
      return false;
    }

    if (cooldown) {
      eventCooldownUntil[name] = audioContext.currentTime + cooldown;
    }

    return true;
  }

  function finishVoiceAt(node, stopAt) {
    activeVoices += 1;
    node.onended = function () {
      activeVoices = Math.max(0, activeVoices - 1);
    };
    node.stop(stopAt);
  }

  function tone(destination, type, startHz, endHz, startGain, duration) {
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type || "square";
    oscillator.frequency.setValueAtTime(startHz, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endHz), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, startGain), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(now);
    finishVoiceAt(oscillator, now + duration + 0.02);
  }

  function noiseBurst(destination, gainValue, duration, filterType, frequency) {
    const now = audioContext.currentTime;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    source.buffer = createNoiseBuffer(duration);
    filter.type = filterType || "bandpass";
    filter.frequency.value = frequency || 700;
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(now);
    finishVoiceAt(source, now + duration + 0.02);
  }

  function arpeggio(notes, destination, gainValue, duration) {
    notes.forEach(function (note, index) {
      window.setTimeout(function () {
        if (audioContext && !muted) {
          tone(destination, "square", note, note * 1.12, gainValue, duration);
        }
      }, index * duration * 650);
    });
  }

  function playHorn(type) {
    if (hornCooldown > 0 || !canPlayOneShot("horn")) {
      return;
    }

    hornCooldown = randomInRange(AUDIO_CONFIG.hornCooldownRange);
    if (type === "truck") {
      tone(hornGain, "sawtooth", 150, 130, 0.18, 0.28);
      return;
    }

    if (type === "rickshaw") {
      arpeggio([520, 600], hornGain, 0.12, 0.10);
      return;
    }

    arpeggio([330, 420], hornGain, 0.14, 0.09);
  }

  function play(name, detail) {
    initialize();
    if (!canPlayOneShot(name)) {
      return;
    }

    if (name === "sugarcane") {
      tone(sfxGain, "sine", 90, 135, AUDIO_CONFIG.sugarcanePickupGain, 0.12);
      tone(sfxGain, "triangle", 170, 160, AUDIO_CONFIG.sugarcanePickupGain * 0.22, 0.10);
    } else if (name === "tierUp") {
      arpeggio([440, 660, 880], sfxGain, 0.14, 0.09);
    } else if (name === "jumpCharge") {
      arpeggio([780, 1180], sfxGain, 0.13, 0.11);
    } else if (name === "jumpTakeoff") {
      tone(collisionGain, "triangle", 180, 760, 0.20, 0.22);
    } else if (name === "jumpLand") {
      tone(collisionGain, "sine", 120, 55, 0.22, 0.12);
      noiseBurst(collisionGain, 0.08, 0.08, "lowpass", 420);
    } else if (name === "vehicleCollision") {
      tone(collisionGain, "sawtooth", 150, 60, 0.24, 0.20);
      noiseBurst(collisionGain, 0.16, 0.16, "lowpass", 520);
    } else if (name === "tapriCollision") {
      tone(collisionGain, "square", 260, 95, 0.22, 0.13);
      noiseBurst(collisionGain, 0.18, 0.11, "bandpass", 980);
    } else if (name === "humanImpact") {
      tone(collisionGain, "triangle", 280, 520, 0.18, 0.11);
      tone(collisionGain, "sine", 520, 280, 0.12, 0.16);
    } else if (name === "cowCollision") {
      tone(collisionGain, "sawtooth", 130, 55, 0.25, 0.18);
      window.setTimeout(function () {
        if (audioContext && !muted) {
          tone(collisionGain, "triangle", 95, 80, 0.12, 0.16);
        }
      }, 90);
    } else if (name === "closePass") {
      noiseBurst(sfxGain, 0.12, 0.16, "highpass", 1250);
    } else if (name === "menuMove") {
      tone(sfxGain, "square", 420, 500, 0.07, 0.045);
    } else if (name === "menuConfirm") {
      tone(sfxGain, "square", 520, 820, 0.09, 0.08);
    } else if (name === "menuBack") {
      tone(sfxGain, "square", 420, 260, 0.09, 0.08);
    } else if (name === "highScore") {
      arpeggio([660, 880, 1320], sfxGain, 0.15, 0.10);
    } else if (name === "initialChange") {
      tone(sfxGain, "square", 360, 460, 0.06, 0.05);
    } else if (name === "initialSubmit") {
      arpeggio([520, 720], sfxGain, 0.12, 0.08);
    } else if (name === "horn") {
      playHorn(detail && detail.type);
    }
  }

  function update(state, detail) {
    if (!initialized || !audioContext || muted) {
      return;
    }

    const maxSpeed = state.playerTier && state.playerTier.maxSpeed ? state.playerTier.maxSpeed : 80;
    const speedRatio = Math.max(0, Math.min(1, state.speed / maxSpeed));
    const maxGameRatio = Math.max(0, Math.min(1, state.speed / 250));
    const gameplay = state.screen === "gameplay";
    const airborne = detail && detail.airborne;
    const braking = detail && detail.braking;
    const onDirt = state.playerEffectiveSurface === "dirt" && !airborne;
    const windAmount = Math.max(0, (maxGameRatio - 0.45) / 0.55);

    hornCooldown = Math.max(0, hornCooldown - (detail && detail.deltaSeconds ? detail.deltaSeconds : 0));

    if (!gameplay) {
      setGain(engineGain, 0, 0.12);
      setGain(dirtGain, 0, 0.12);
      setGain(windGain, 0, 0.12);
      setGain(brakeGain, 0, 0.05);
      return;
    }

    const engineFundamental = ENGINE_MIN_HZ + (ENGINE_MAX_HZ - ENGINE_MIN_HZ) * speedRatio;
    engineOscillator.frequency.setTargetAtTime(engineFundamental, audioContext.currentTime, 0.10);
    engineHarmonic.frequency.setTargetAtTime(Math.min(ENGINE_HARMONIC_MAX_HZ, engineFundamental * 2), audioContext.currentTime, 0.10);
    setGain(engineGain, AUDIO_CONFIG.engineGain * (0.35 + speedRatio * 0.65), 0.10);
    setGain(dirtGain, onDirt ? AUDIO_CONFIG.dirtGain * (0.4 + speedRatio * 0.6) : 0, 0.08);
    setGain(windGain, AUDIO_CONFIG.windGain * windAmount * 0.9, 0.12);
    setGain(brakeGain, braking && state.speed > 20 && !airborne ? 0.09 : 0, 0.04);
  }

  document.addEventListener("visibilitychange", function () {
    if (!initialized || !audioContext) {
      return;
    }

    if (document.hidden) {
      setGain(masterGain, 0, 0.08);
      if (musicElement) {
        musicElement.pause();
      }
    } else {
      setGain(masterGain, muted ? 0 : 0.82, 0.08);
      if (currentScreen === "gameplay" && unlocked && musicElement) {
        musicElement.play().catch(function () {});
      }
    }
  });

  window.RacingAudio = {
    unlock: unlock,
    setScreen: setScreen,
    play: play,
    update: update,
    toggleMute: toggleMute,
    isMuted: function () {
      return muted;
    },
  };
})();
