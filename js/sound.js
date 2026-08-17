export class SoundManager {
  constructor() {
    this.ctx = null;
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play footstep matching voxel material type
  playStep(materialType) {
    this.initContext();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (materialType === 'grass' || materialType === 'sand') {
      // Noise burst for crunchy steps
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = materialType === 'grass' ? 350 : 850;
      filter.Q.value = 1.2;
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(time);
      noise.stop(time + 0.08);
    } else if (materialType === 'stone') {
      // Higher pitched short click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, time);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
      
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      
      osc.start(time);
      osc.stop(time + 0.05);
    } else {
      // Wood or default: low thud
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, time);
      osc.frequency.exponentialRampToValueAtTime(60, time + 0.07);
      
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
      
      osc.start(time);
      osc.stop(time + 0.07);
    }
  }

  playPlace() {
    this.playStep('wood');
  }

  playBreak() {
    this.initContext();
    if (!this.ctx) return;
    const time = this.ctx.currentTime;

    // Pitch sweep thud
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(200, time);
    osc1.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    
    gain1.gain.setValueAtTime(0.12, time);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    
    osc1.start(time);
    osc1.stop(time + 0.15);

    // High frequency crunch noise
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(time);
    noise.stop(time + 0.06);
  }

  playHit() {
    this.initContext();
    if (!this.ctx) return;
    const time = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);
    
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  playEat() {
    this.initContext();
    if (!this.ctx) return;
    const time = this.ctx.currentTime;

    // Synthesize three rapid crunching bites
    for (let i = 0; i < 3; i++) {
      const crunchTime = time + i * 0.15;
      
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400 + Math.random() * 200;
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06, crunchTime);
      gain.gain.exponentialRampToValueAtTime(0.001, crunchTime + 0.05);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      noise.start(crunchTime);
      noise.stop(crunchTime + 0.05);
    }
  }

  playShoot() {
    this.initContext();
    if (!this.ctx) return;
    const time = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(200, time + 0.2);
    
    gain.gain.setValueAtTime(0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.2);
  }
}
