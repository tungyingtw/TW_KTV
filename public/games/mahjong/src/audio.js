(function () {
  const SOUND_FILES = {
    draw: "assets/audio/ui/draw.ogg",
    discard: "assets/audio/ui/discard.ogg",
    chi: "assets/audio/ui/meld.ogg",
    pong: "assets/audio/ui/meld.ogg",
    kong: "assets/audio/ui/meld.ogg",
    flower: "assets/audio/ui/meld.ogg",
    meld: "assets/audio/ui/meld.ogg",
    pass: "assets/audio/ui/pass.ogg",
    toggle: "assets/audio/ui/toggle.ogg",
    bigwin: "assets/audio/ui/win.ogg",
    robKong: "assets/audio/ui/win.ogg",
    kongDrawWin: "assets/audio/ui/win.ogg",
    win: "assets/audio/ui/win.ogg",
    select: "assets/audio/ui/select.ogg"
  };

  const SOUND_PROFILES = {
    draw: [{ sound: "draw", volume: 0.34, rate: 1.05 }],
    discard: [{ sound: "discard", volume: 0.4, rate: 0.92 }],
    select: [{ sound: "select", volume: 0.28, rate: 1.08 }],
    pass: [{ sound: "pass", volume: 0.26, rate: 0.86 }],
    toggle: [{ sound: "toggle", volume: 0.32, rate: 1 }],
    chi: [{ sound: "meld", volume: 0.42, rate: 1.08 }],
    pong: [{ sound: "meld", volume: 0.5, rate: 0.96 }, { sound: "discard", volume: 0.18, rate: 1.14 }],
    kong: [{ sound: "meld", volume: 0.62, rate: 0.82 }, { sound: "discard", volume: 0.24, rate: 0.72 }],
    flower: [{ sound: "meld", volume: 0.36, rate: 1.24 }, { sound: "select", volume: 0.18, rate: 1.35 }],
    meld: [{ sound: "meld", volume: 0.42, rate: 1 }],
    win: [{ sound: "win", volume: 0.58, rate: 1 }],
    bigwin: [{ sound: "win", volume: 0.72, rate: 0.94 }, { sound: "meld", volume: 0.26, rate: 1.16 }],
    robKong: [{ sound: "win", volume: 0.7, rate: 0.9 }, { sound: "kong", volume: 0.26, rate: 0.82 }],
    kongDrawWin: [{ sound: "win", volume: 0.76, rate: 0.98 }, { sound: "meld", volume: 0.3, rate: 0.78 }]
  };

  const SOUND_SEQUENCES = {
    draw: [[440, 0.035]],
    discard: [[240, 0.045]],
    chi: [[430, 0.04, 0, 0.055, "triangle"], [570, 0.05, 0.035, 0.052, "triangle"], [650, 0.04, 0.08, 0.04, "sine"]],
    pong: [[540, 0.05, 0, 0.066, "square"], [390, 0.07, 0.04, 0.06, "triangle"], [520, 0.045, 0.11, 0.045, "sine"]],
    kong: [[260, 0.065, 0, 0.07, "square"], [410, 0.08, 0.045, 0.07, "triangle"], [680, 0.09, 0.115, 0.058, "sawtooth"], [880, 0.08, 0.205, 0.044, "sine"]],
    flower: [[520, 0.045, 0, 0.048, "triangle"], [700, 0.06, 0.05, 0.052, "sine"], [930, 0.08, 0.12, 0.045, "triangle"]],
    meld: [[520, 0.06]],
    pass: [[300, 0.04]],
    toggle: [[520, 0.05]],
    win: [[620, 0.08, 0, 0.068, "triangle"], [790, 0.1, 0.06, 0.066, "triangle"], [980, 0.13, 0.15, 0.058, "sine"], [1240, 0.18, 0.28, 0.044, "sine"]],
    robKong: [[380, 0.08, 0, 0.07, "square"], [660, 0.11, 0.06, 0.07, "triangle"], [960, 0.13, 0.16, 0.058, "sawtooth"], [1320, 0.18, 0.32, 0.046, "sine"]],
    kongDrawWin: [[420, 0.09, 0, 0.076, "square"], [720, 0.12, 0.075, 0.074, "triangle"], [1040, 0.15, 0.18, 0.064, "sawtooth"], [1420, 0.2, 0.34, 0.05, "sine"], [1660, 0.18, 0.5, 0.044, "sine"]],
    bigwin: [[520, 0.09, 0, 0.074, "triangle"], [760, 0.11, 0.08, 0.072, "triangle"], [980, 0.13, 0.18, 0.066, "sawtooth"], [1280, 0.18, 0.34, 0.052, "sine"], [1520, 0.2, 0.5, 0.044, "sine"]],
    select: [[360, 0.025]]
  };

  function ensureContext(state) {
    if (!state.audioContext) state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return state.audioContext;
  }

  function play(type, state) {
    if (!state.soundEnabled || !state.audioUnlocked) return;
    const sequence = SOUND_SEQUENCES[type] || SOUND_SEQUENCES.toggle;
    if (playAudioProfile(SOUND_PROFILES[type] || [{ sound: type }], state, sequence)) return;
    playToneSequence(sequence, state);
  }

  function playAudioProfile(profile, state, fallbackSequence) {
    let played = false;
    profile.forEach((layer, index) => {
      if (playAudioFile(layer, state, index === 0 ? fallbackSequence : null)) played = true;
    });
    return played;
  }

  function playAudioFile(layer, state, fallbackSequence) {
    const config = typeof layer === "string" ? { sound: layer } : layer;
    const src = SOUND_FILES[config.sound];
    if (!src) return false;
    try {
      state.audioBuffers[config.sound] = state.audioBuffers[config.sound] || new Audio(src);
      const audio = state.audioBuffers[config.sound].cloneNode();
      audio.volume = config.volume ?? 0.38;
      audio.playbackRate = config.rate ?? 1;
      const result = audio.play();
      if (result?.catch && fallbackSequence) result.catch(() => playToneSequence(fallbackSequence, state));
      return true;
    } catch {
      return false;
    }
  }

  function playToneSequence(sequence, state) {
    if (!Array.isArray(sequence)) return;
    sequence.forEach(([frequency, duration, delay = 0, volume = 0.05, wave = "sine"]) => setTimeout(() => playTone(frequency, duration, state, volume, wave), delay * 1000));
  }

  function playTone(frequency, duration, state, volume = 0.05, wave = "sine") {
    if (!state.soundEnabled) return;
    const context = ensureContext(state);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.stop(context.currentTime + duration);
  }

  window.MahjongAudio = { ensureContext, play, files: SOUND_FILES, profiles: SOUND_PROFILES, sequences: SOUND_SEQUENCES };
})();
