export class AudioBus {
  constructor() {
    this.ctx = null;
  }

  unlock() {
    if (this.ctx) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    if (ctx.state === "suspended") ctx.resume();
  }

  tone(freq, dur = 0.12, type = "sine", gain = 0.08) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur);
  }

  tick() {
    this.tone(880, 0.05, "square", 0.05);
  }

  boom() {
    this.tone(90, 0.45, "sawtooth", 0.16);
    this.tone(48, 0.6, "sine", 0.12);
  }

  chime() {
    this.tone(523, 0.12, "triangle", 0.07);
    this.tone(784, 0.18, "triangle", 0.06);
  }

  whoosh() {
    this.tone(220, 0.28, "sawtooth", 0.04);
  }
}
