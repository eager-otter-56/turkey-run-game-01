// Gobble Run! — procedural WebAudio sounds. No audio files: every
// gobble, flap and thud is synthesised, so the game stays fully offline.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freqFrom, freqTo, seconds, type, gainPeak, when = 0) {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + seconds);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
    gobble() { // the turkey's battle cry: three warbling chirps
      tone(620, 340, 0.09, 'square', 0.05);
      tone(700, 380, 0.09, 'square', 0.05, 0.1);
      tone(760, 420, 0.13, 'square', 0.06, 0.2);
    },
    flap() { tone(300, 620, 0.12, 'triangle', 0.07); },
    cornPop() { tone(880, 1320, 0.09, 'sine', 0.09); },
    stumble() {
      tone(160, 60, 0.22, 'sawtooth', 0.12);
      tone(90, 45, 0.3, 'square', 0.08, 0.03);
    },
    farmerShout() { tone(220, 140, 0.28, 'sawtooth', 0.07); },
    caught() {
      tone(520, 90, 0.7, 'sawtooth', 0.12);
      tone(392, 65, 0.9, 'triangle', 0.1, 0.12);
    },
    escaped() { // a little rising fanfare over the fence
      tone(523, 523, 0.14, 'triangle', 0.1);
      tone(659, 659, 0.14, 'triangle', 0.1, 0.13);
      tone(784, 784, 0.14, 'triangle', 0.1, 0.26);
      tone(1046, 1046, 0.3, 'triangle', 0.12, 0.39);
    },
  };
}
