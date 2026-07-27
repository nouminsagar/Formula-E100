(function () {
  "use strict";

  const PREVIOUS_MUSIC_GAIN = 0.35;
  const MUSIC_VOLUME_MULTIPLIER = 6.0;
  const MUSIC_GAIN = PREVIOUS_MUSIC_GAIN * MUSIC_VOLUME_MULTIPLIER;
  const GAME_OVER_MUSIC_GAIN = MUSIC_GAIN * 0.70;
  const MUSIC_PATH = "assets/audio/gameplay-music.mp3";
  const MUTE_STORAGE_KEY = "formulaE100Muted";
  const MASTER_GAIN = 1;

  let audioContext = null;
  let masterGain = null;
  let musicGain = null;
  let limiter = null;
  let musicElement = null;
  let musicSourceNode = null;
  let initialized = false;
  let unlocked = false;
  let muted = readMutePreference();
  let currentScreen = "intro";

  function readMutePreference() {
    try {
      return sessionStorage.getItem(MUTE_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }

  function writeMutePreference() {
    try {
      sessionStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
    } catch {
      // Session storage can be unavailable in some browser privacy modes.
    }
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
    masterGain = audioContext.createGain();
    masterGain.gain.value = muted ? 0 : MASTER_GAIN;
    masterGain.connect(audioContext.destination);

    limiter = audioContext.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.20;
    limiter.connect(masterGain);

    musicGain = audioContext.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(limiter);

    musicElement = new Audio(MUSIC_PATH);
    musicElement.loop = true;
    musicElement.preload = "auto";
    musicSourceNode = audioContext.createMediaElementSource(musicElement);
    musicSourceNode.connect(musicGain);

    initialized = true;
  }

  function unlock() {
    initialize();
    if (!audioContext) {
      return Promise.resolve(false);
    }

    unlocked = true;
    return audioContext.resume().then(function () {
      return true;
    }).catch(function () {
      unlocked = false;
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
    setGain(masterGain, muted ? 0 : MASTER_GAIN, 0.04);
  }

  function toggleMute() {
    setMute(!muted);
    if (!muted && currentScreen === "gameplay") {
      playMusic(false);
    }
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
    setGain(musicGain, MUSIC_GAIN, 0.25);
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
      fadeMusic(GAME_OVER_MUSIC_GAIN, 0.25, false);
    } else {
      fadeMusic(0, 0.6, true);
    }
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
      setGain(masterGain, muted ? 0 : MASTER_GAIN, 0.08);
      if ((currentScreen === "gameplay" || currentScreen === "gameOver") && unlocked && !muted && musicElement) {
        musicElement.play().catch(function () {});
      }
    }
  });

  window.RacingAudio = {
    unlock: unlock,
    setScreen: setScreen,
    toggleMute: toggleMute,
    isMuted: function () {
      return muted;
    },
  };
})();
