import { AudioSettings, AudioAnalysis, AudioDeviceInfo } from '../types';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | AudioNode | null = null;

  // Demo Synth Generator
  private demoTimer: number | null = null;

  // Data Buffers
  private frequencyData: Uint8Array = new Uint8Array(512);
  private timeDomainData: Uint8Array = new Uint8Array(512);

  // Smoothed Audio Energy Values
  private smoothedBass = 0;
  private smoothedMid = 0;
  private smoothedTreble = 0;
  private smoothedOverall = 0;

  // Status
  public status: 'idle' | 'capturing' | 'silent' | 'denied' | 'unavailable' = 'idle';
  public currentDeviceLabel = 'Audio disconnected';
  public errorMessage: string | null = null;

  private onStatusChangeCallback?: () => void;

  public setOnStatusChangeListener(callback: () => void) {
    this.onStatusChangeCallback = callback;
  }

  private notifyStatusChange() {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback();
    }
  }

  /**
   * Enumerate available microphone devices (ideal for Mobile & Desktop)
   */
  public async getAudioDevices(): Promise<AudioDeviceInfo[]> {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.enumerateDevices
    ) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');

      return audioInputs.map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `Microphone ${index + 1}`,
      }));
    } catch (err) {
      console.warn('Error enumerating audio devices:', err);
      return [];
    }
  }

  /**
   * Ensure AudioContext is instantiated and running.
   */
  public async ensureContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.audioContext = new AudioCtx();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.audioContext;
  }

  /**
   * Start microphone input capture via getUserMedia (Great for Mobile Web & Desktop Room Mic)
   */
  public async startMicAudio(settings: AudioSettings): Promise<boolean> {
    try {
      const ctx = await this.ensureContext();
      this.stop();

      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = settings.fftSize || 1024;
      this.analyser.smoothingTimeConstant = Math.min(
        0.95,
        Math.max(0.1, settings.smoothing)
      );

      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = settings.isMuted ? 0 : settings.gain;

      const binCount = this.analyser.frequencyBinCount;
      this.frequencyData = new Uint8Array(binCount);
      this.timeDomainData = new Uint8Array(binCount);

      const constraints: MediaStreamConstraints = {
        audio: settings.deviceId && settings.deviceId !== 'default'
          ? { deviceId: { exact: settings.deviceId } }
          : true,
      };

      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        const track = this.mediaStream.getAudioTracks()[0];
        if (track) {
          this.currentDeviceLabel = track.label || 'Microphone Connected';
          track.onended = () => {
            this.stop();
            this.notifyStatusChange();
          };
        }

        const source = ctx.createMediaStreamSource(this.mediaStream);
        this.sourceNode = source;

        source.connect(this.gainNode);
        this.gainNode.connect(this.analyser);

        this.status = 'capturing';
        this.errorMessage = null;
        this.notifyStatusChange();
        return true;
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          this.status = 'denied';
          this.errorMessage = 'Microphone permission was denied by browser or user.';
        } else {
          this.status = 'unavailable';
          this.errorMessage = `Microphone capture failed: ${error.message}`;
        }
        this.notifyStatusChange();
        return false;
      }
    } catch (err: unknown) {
      const error = err as Error;
      this.status = 'unavailable';
      this.errorMessage = `Audio setup error: ${error.message}`;
      this.notifyStatusChange();
      return false;
    }
  }

  /**
   * Start screen capture audio using getDisplayMedia and extracting ONLY the audio track.
   */
  public async startScreenAudio(settings: AudioSettings): Promise<boolean> {
    try {
      const ctx = await this.ensureContext();
      this.stop();

      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = settings.fftSize || 1024;
      this.analyser.smoothingTimeConstant = Math.min(
        0.95,
        Math.max(0.1, settings.smoothing)
      );

      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = settings.isMuted ? 0 : settings.gain;

      const binCount = this.analyser.frequencyBinCount;
      this.frequencyData = new Uint8Array(binCount);
      this.timeDomainData = new Uint8Array(binCount);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getDisplayMedia
      ) {
        this.status = 'unavailable';
        this.errorMessage =
          'Screen audio capture is not supported on this mobile browser. Please switch to Microphone mode below!';
        this.notifyStatusChange();
        return false;
      }

      let rawStream: MediaStream;
      try {
        rawStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } catch (err: unknown) {
        const error = err as Error;
        if (
          error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError' ||
          error.name === 'AbortError'
        ) {
          this.status = 'idle';
          this.currentDeviceLabel = 'Screen share cancelled';
          this.errorMessage =
            'Screen sharing was cancelled. Click "Share Screen Audio" when ready.';
        } else {
          this.status = 'unavailable';
          this.errorMessage = `Screen capture failed: ${error.message || 'Unknown error'}`;
        }
        this.notifyStatusChange();
        return false;
      }

      // Check for audio tracks
      const audioTracks = rawStream.getAudioTracks();

      // STOP ALL VIDEO TRACKS IMMEDIATELY - We ONLY want audio
      rawStream.getVideoTracks().forEach((vt) => vt.stop());

      if (audioTracks.length === 0) {
        rawStream.getTracks().forEach((t) => t.stop());

        this.status = 'unavailable';
        this.currentDeviceLabel = 'Audio not shared';
        this.errorMessage =
          "Audio sharing is required. Please share your screen/window/tab again and enable 'Share audio'.";
        this.notifyStatusChange();
        return false;
      }

      const audioTrack = audioTracks[0];

      audioTrack.onended = () => {
        this.stop();
        this.status = 'idle';
        this.currentDeviceLabel = 'Screen audio disconnected';
        this.errorMessage = null;
        this.notifyStatusChange();
      };

      const audioStream = new MediaStream([audioTrack]);
      this.mediaStream = audioStream;

      const source = ctx.createMediaStreamSource(audioStream);
      this.sourceNode = source;

      source.connect(this.gainNode);
      this.gainNode.connect(this.analyser);

      this.status = 'capturing';
      this.currentDeviceLabel = audioTrack.label || 'Screen Audio Connected';
      this.errorMessage = null;
      this.notifyStatusChange();
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      this.status = 'unavailable';
      this.errorMessage = `Audio setup failed: ${error.message}`;
      this.notifyStatusChange();
      return false;
    }
  }

  /**
   * Initialize audio processing chain with given settings.
   */
  public async initAudio(settings: AudioSettings): Promise<boolean> {
    if (settings.mode === 'demo_synth') {
      const ctx = await this.ensureContext();
      this.stop();

      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = settings.fftSize || 1024;
      this.analyser.smoothingTimeConstant = Math.min(
        0.95,
        Math.max(0.1, settings.smoothing)
      );

      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = settings.isMuted ? 0 : settings.gain;

      const binCount = this.analyser.frequencyBinCount;
      this.frequencyData = new Uint8Array(binCount);
      this.timeDomainData = new Uint8Array(binCount);

      this.startDemoSynth(ctx);
      this.status = 'capturing';
      this.currentDeviceLabel = 'Built-in Audio Synth Demo';
      this.errorMessage = null;
      this.notifyStatusChange();
      return true;
    }

    if (settings.mode === 'mic') {
      if (this.status === 'capturing' && this.mediaStream) {
        this.updateSettings(settings);
        return true;
      }
      return await this.startMicAudio(settings);
    }

    if (settings.mode === 'screen_audio') {
      if (
        this.status === 'capturing' &&
        this.mediaStream &&
        this.mediaStream.getAudioTracks().length > 0
      ) {
        this.updateSettings(settings);
        return true;
      }
      this.status = 'idle';
      this.currentDeviceLabel = 'Screen audio disconnected';
      this.notifyStatusChange();
      return false;
    }

    return false;
  }

  /**
   * Start built-in audio synth generator with kick, snare, sub-bass, and lead chord synth.
   */
  private startDemoSynth(ctx: AudioContext) {
    if (!this.analyser || !this.gainNode) return;

    const synthMasterGain = ctx.createGain();
    synthMasterGain.gain.value = 0.5;
    synthMasterGain.connect(this.gainNode);
    this.gainNode.connect(this.analyser);

    let step = 0;
    const bpm = 118;
    const stepMs = (60 / bpm / 4) * 1000;

    const playStep = () => {
      if (!this.audioContext || this.audioContext.state !== 'running') return;

      const now = ctx.currentTime;

      // Kick drum
      if (step % 4 === 0) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.frequency.setValueAtTime(150, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
        kickGain.gain.setValueAtTime(1.0, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        kickOsc.connect(kickGain);
        kickGain.connect(synthMasterGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.2);
      }

      // Snare / clap
      if (step % 8 === 4) {
        const snareOsc = ctx.createOscillator();
        const snareGain = ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(220, now);
        snareGain.gain.setValueAtTime(0.6, now);
        snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        snareOsc.connect(snareGain);
        snareGain.connect(synthMasterGain);
        snareOsc.start(now);
        snareOsc.stop(now + 0.16);
      }

      // Synth chords
      const chordNotes = [220, 261.63, 329.63, 392.0, 440, 523.25];
      const chordFreq = chordNotes[(step * 2) % chordNotes.length];

      const leadOsc = ctx.createOscillator();
      const leadGain = ctx.createGain();
      leadOsc.type = step % 2 === 0 ? 'sawtooth' : 'sine';
      leadOsc.frequency.setValueAtTime(chordFreq, now);
      leadGain.gain.setValueAtTime(0.25, now);
      leadGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      leadOsc.connect(leadGain);
      leadGain.connect(synthMasterGain);
      leadOsc.start(now);
      leadOsc.stop(now + 0.15);

      step = (step + 1) % 16;
    };

    playStep();
    this.demoTimer = window.setInterval(playStep, stepMs);
  }

  /**
   * Stop all active audio streams and synth timers.
   */
  public stop() {
    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }

    this.status = 'idle';
  }

  /**
   * Update gain / smoothing settings.
   */
  public updateSettings(settings: AudioSettings) {
    if (this.analyser) {
      if (settings.fftSize && this.analyser.fftSize !== settings.fftSize) {
        this.analyser.fftSize = settings.fftSize;
        const binCount = this.analyser.frequencyBinCount;
        this.frequencyData = new Uint8Array(binCount);
        this.timeDomainData = new Uint8Array(binCount);
      }
      if (typeof settings.smoothing === 'number') {
        this.analyser.smoothingTimeConstant = Math.min(
          0.95,
          Math.max(0.1, settings.smoothing)
        );
      }
    }

    if (this.gainNode) {
      this.gainNode.gain.value = settings.isMuted ? 0 : settings.gain;
    }
  }

  /**
   * Analyze current frame data and calculate Bass, Mid, Treble and Overall energy.
   */
  public analyze(settings: AudioSettings): AudioAnalysis {
    if (!this.analyser) {
      return {
        bass: 0,
        mid: 0,
        treble: 0,
        overallEnergy: 0,
        peakFreq: 0,
        avgFreq: 0,
        rawFrequencyData: this.frequencyData,
        rawTimeDomainData: this.timeDomainData,
        isAudioActive: false,
      };
    }

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    const binCount = this.analyser.frequencyBinCount;
    const sampleRate = this.audioContext ? this.audioContext.sampleRate : 44100;
    const nyquist = sampleRate / 2;
    const hzPerBin = nyquist / binCount;

    let bassSum = 0;
    let bassCount = 0;
    let midSum = 0;
    let midCount = 0;
    let trebleSum = 0;
    let trebleCount = 0;
    let totalSum = 0;

    let peakValue = 0;
    let peakBin = 0;

    for (let i = 0; i < binCount; i++) {
      const val = this.frequencyData[i];
      const freq = i * hzPerBin;
      totalSum += val;

      if (val > peakValue) {
        peakValue = val;
        peakBin = i;
      }

      if (freq >= 20 && freq <= 250) {
        bassSum += val;
        bassCount++;
      } else if (freq > 250 && freq <= 4000) {
        midSum += val;
        midCount++;
      } else if (freq > 4000) {
        trebleSum += val;
        trebleCount++;
      }
    }

    const rawBass = (bassCount > 0 ? bassSum / bassCount : 0) / 255;
    const rawMid = (midCount > 0 ? midSum / midCount : 0) / 255;
    const rawTreble = (trebleCount > 0 ? trebleSum / trebleCount : 0) / 255;
    const rawOverall = totalSum / binCount / 255;

    // Apply sensitivity scaling
    const sens = settings.sensitivity || 1.0;
    const scaledBass = Math.min(1.0, rawBass * (settings.bassSens || 1.0) * sens);
    const scaledMid = Math.min(1.0, rawMid * (settings.midSens || 1.0) * sens);
    const scaledTreble = Math.min(1.0, rawTreble * (settings.trebleSens || 1.0) * sens);
    const scaledOverall = Math.min(1.0, rawOverall * sens);

    // Smooth exponentially to reduce jitter
    const smoothFactor = 0.25;
    this.smoothedBass += (scaledBass - this.smoothedBass) * smoothFactor;
    this.smoothedMid += (scaledMid - this.smoothedMid) * smoothFactor;
    this.smoothedTreble += (scaledTreble - this.smoothedTreble) * smoothFactor;
    this.smoothedOverall += (scaledOverall - this.smoothedOverall) * smoothFactor;

    const isAudioActive = this.smoothedOverall > 0.01;

    return {
      bass: this.smoothedBass,
      mid: this.smoothedMid,
      treble: this.smoothedTreble,
      overallEnergy: this.smoothedOverall,
      peakFreq: Math.round(peakBin * hzPerBin),
      avgFreq: Math.round((totalSum / binCount) * (nyquist / 255)),
      rawFrequencyData: this.frequencyData,
      rawTimeDomainData: this.timeDomainData,
      isAudioActive,
    };
  }

  public destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
