import { BaseService } from './BaseService';
import type { AudioAnalysis, AudioSegment, AudioMood, AudioStructure } from '../types';

export class AudioEngine extends BaseService {
  private audioContext?: AudioContext;
  private workletNode?: AudioWorkletNode;
  private analyser?: AnalyserNode;
  private processingQueue: Array<{ buffer: AudioBuffer; resolve: Function; reject: Function }> = [];
  private isProcessing = false;
  private workletModuleLoaded = false;

  constructor() {
    super({ name: 'AudioEngine', autoStart: false });
  }

  protected async doInit(): Promise<void> {
    try {
      // Create AudioContext
      this.audioContext = new AudioContext();
      
      // Create analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      
      // Load AudioWorklet module during initialization
      try {
        await this.audioContext.audioWorklet.addModule('/audio/time-shaper-processor.js');
        this.workletModuleLoaded = true;
      } catch (error) {
        console.warn('AudioWorklet module loading failed during init, will retry on start:', error);
      }
      
      this.emit('audio-context-ready');
    } catch (error) {
      throw new Error(`Failed to initialize AudioEngine: ${error}`);
    }
  }

  protected async doStart(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Retry loading AudioWorklet module if it failed during init
    if (!this.workletModuleLoaded && this.audioContext) {
      try {
        await this.audioContext.audioWorklet.addModule('/audio/time-shaper-processor.js');
        this.workletModuleLoaded = true;
      } catch (error) {
        throw new Error(`Failed to load AudioWorklet module: ${error}`);
      }
    }

    // Create worklet node after AudioContext is running and module is loaded
    if (this.workletModuleLoaded && this.audioContext && !this.workletNode) {
      try {
        this.workletNode = new AudioWorkletNode(this.audioContext, 'time-shaper-processor');
        
        // Set up message handling
        this.workletNode.port.onmessage = this.handleWorkletMessage.bind(this);
      } catch (error) {
        throw new Error(`Failed to create AudioWorkletNode: ${error}`);
      }
    }

    this.emit('audio-engine-started');
  }

  protected async doStop(): Promise<void> {
    if (this.audioContext?.state === 'running') {
      await this.audioContext.suspend();
    }
    this.emit('audio-engine-stopped');
  }

  protected async doDestroy(): Promise<void> {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = undefined;
    }
    if (this.analyser) {
      this.analyser.disconnect();
    }
    if (this.audioContext) {
      await this.audioContext.close();
    }
    this.processingQueue = [];
    this.workletModuleLoaded = false;
  }

  private handleWorkletMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'analysis-complete':
        this.emit('analysis-complete', data);
        break;
      case 'processing-progress':
        this.emit('processing-progress', data);
        break;
      case 'error':
        this.emit('error', data);
        break;
    }
  }

  async analyzeAudio(audioBuffer: AudioBuffer): Promise<AudioAnalysis> {
    if (!this.audioContext || !this.workletNode) {
      throw new Error('AudioEngine not initialized or started');
    }

    return new Promise((resolve, reject) => {
      this.processingQueue.push({ buffer: audioBuffer, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const { buffer, resolve, reject } = this.processingQueue.shift()!;

    try {
      const analysis = await this.performAnalysis(buffer);
      resolve(analysis);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      if (this.processingQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  private async performAnalysis(audioBuffer: AudioBuffer): Promise<AudioAnalysis> {
    this.emit('analysis-started', { duration: audioBuffer.duration });

    const [bpmData, energyData, moodData, structureData] = await Promise.all([
      this.detectTempo(audioBuffer),
      this.analyzeEnergy(audioBuffer),
      this.analyzeMood(audioBuffer),
      this.analyzeStructure(audioBuffer)
    ]);

    const analysis: AudioAnalysis = {
      bpm: bpmData.bpm,
      confidence: bpmData.confidence,
      energy: energyData.energy,
      segments: energyData.segments,
      mood: moodData,
      structure: structureData
    };

    this.emit('analysis-complete', analysis);
    return analysis;
  }

  private async detectTempo(audioBuffer: AudioBuffer): Promise<{ bpm: number; confidence: number }> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Onset detection using spectral flux
    const onsets = this.detectOnsets(channelData, sampleRate);
    
    // Tempo estimation using autocorrelation
    const tempoData = this.estimateTempo(onsets, sampleRate);
    
    return tempoData;
  }

  private detectOnsets(audioData: Float32Array, sampleRate: number): number[] {
    const windowSize = 1024;
    const hopSize = 512;
    const onsets: number[] = [];
    
    let prevSpectrum: Float32Array | null = null;
    
    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const spectrum = this.computeSpectrum(window);
      
      if (prevSpectrum) {
        const flux = this.computeSpectralFlux(spectrum, prevSpectrum);
        if (flux > 0.1) { // Threshold for onset detection
          onsets.push(i / sampleRate);
        }
      }
      
      prevSpectrum = spectrum;
    }
    
    return onsets;
  }

  private computeSpectrum(window: Float32Array): Float32Array {
    // Simple magnitude spectrum computation
    const real = new Float32Array(window.length);
    const imag = new Float32Array(window.length);
    
    // Copy window data
    real.set(window);
    
    // Apply window function (Hanning)
    for (let i = 0; i < real.length; i++) {
      const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / (real.length - 1)));
      real[i] *= windowValue;
    }
    
    // Compute FFT (simplified - in real implementation use proper FFT)
    const spectrum = new Float32Array(real.length / 2);
    for (let i = 0; i < spectrum.length; i++) {
      spectrum[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    }
    
    return spectrum;
  }

  private computeSpectralFlux(current: Float32Array, previous: Float32Array): number {
    let flux = 0;
    for (let i = 0; i < current.length; i++) {
      const diff = current[i] - previous[i];
      if (diff > 0) {
        flux += diff;
      }
    }
    return flux / current.length;
  }

  private estimateTempo(onsets: number[], sampleRate: number): { bpm: number; confidence: number } {
    if (onsets.length < 4) {
      return { bpm: 120, confidence: 0 };
    }

    // Calculate inter-onset intervals
    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }

    // Find most common interval using histogram
    const histogram = new Map<number, number>();
    const resolution = 0.01; // 10ms resolution

    intervals.forEach(interval => {
      const bucket = Math.round(interval / resolution) * resolution;
      histogram.set(bucket, (histogram.get(bucket) || 0) + 1);
    });

    // Find peak in histogram
    let maxCount = 0;
    let bestInterval = 0.5; // Default to 120 BPM

    histogram.forEach((count, interval) => {
      if (count > maxCount && interval > 0.2 && interval < 2.0) { // 30-300 BPM range
        maxCount = count;
        bestInterval = interval;
      }
    });

    const bpm = 60 / bestInterval;
    const confidence = maxCount / intervals.length;

    return { bpm: Math.round(bpm), confidence };
  }

  private async analyzeEnergy(audioBuffer: AudioBuffer): Promise<{ energy: number[]; segments: AudioSegment[] }> {
    const channelData = audioBuffer.getChannelData(0);
    const windowSize = audioBuffer.sampleRate * 0.1; // 100ms windows
    const hopSize = windowSize / 2;
    
    const energy: number[] = [];
    const segments: AudioSegment[] = [];
    
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize);
      
      // Calculate RMS energy
      let rms = 0;
      for (let j = 0; j < window.length; j++) {
        rms += window[j] * window[j];
      }
      rms = Math.sqrt(rms / window.length);
      
      energy.push(rms);
      
      // Create segment
      segments.push({
        start: i / audioBuffer.sampleRate,
        end: (i + windowSize) / audioBuffer.sampleRate,
        energy: rms,
        features: {
          rms,
          spectralCentroid: this.computeSpectralCentroid(window),
          spectralRolloff: this.computeSpectralRolloff(window),
          mfcc: this.computeMFCC(window)
        }
      });
    }
    
    return { energy, segments };
  }

  private computeSpectralCentroid(window: Float32Array): number {
    const spectrum = this.computeSpectrum(window);
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < spectrum.length; i++) {
      numerator += i * spectrum[i];
      denominator += spectrum[i];
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  private computeSpectralRolloff(window: Float32Array): number {
    const spectrum = this.computeSpectrum(window);
    const totalEnergy = spectrum.reduce((sum, val) => sum + val, 0);
    const threshold = totalEnergy * 0.85;
    
    let cumulativeEnergy = 0;
    for (let i = 0; i < spectrum.length; i++) {
      cumulativeEnergy += spectrum[i];
      if (cumulativeEnergy >= threshold) {
        return i / spectrum.length;
      }
    }
    
    return 1;
  }

  private computeMFCC(window: Float32Array): number[] {
    // Simplified MFCC computation (return placeholder values)
    return new Array(13).fill(0).map(() => Math.random() - 0.5);
  }

  private async analyzeMood(audioBuffer: AudioBuffer): Promise<AudioMood> {
    // Simplified mood analysis based on spectral features
    const channelData = audioBuffer.getChannelData(0);
    
    // Calculate average brightness (spectral centroid)
    let totalBrightness = 0;
    let totalEnergy = 0;
    const windowSize = audioBuffer.sampleRate * 0.5; // 500ms windows
    
    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      const window = channelData.slice(i, i + windowSize);
      const brightness = this.computeSpectralCentroid(window);
      const energy = this.computeRMS(window);
      
      totalBrightness += brightness * energy;
      totalEnergy += energy;
    }
    
    const avgBrightness = totalEnergy > 0 ? totalBrightness / totalEnergy : 0.5;
    const avgEnergy = totalEnergy / (channelData.length / windowSize);
    
    // Map to valence and arousal
    const valence = Math.min(1, Math.max(0, avgBrightness));
    const arousal = Math.min(1, Math.max(0, avgEnergy * 10));
    
    // Determine category
    let category: AudioMood['category'];
    if (valence > 0.6 && arousal > 0.6) category = 'happy';
    else if (valence < 0.4 && arousal < 0.4) category = 'sad';
    else if (arousal > 0.7) category = 'energetic';
    else if (arousal < 0.3) category = 'calm';
    else if (valence < 0.4) category = 'dramatic';
    else category = 'peaceful';
    
    return { valence, arousal, category };
  }

  private computeRMS(window: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < window.length; i++) {
      sum += window[i] * window[i];
    }
    return Math.sqrt(sum / window.length);
  }

  private async analyzeStructure(audioBuffer: AudioBuffer): Promise<AudioStructure> {
    // Simplified structure analysis
    const duration = audioBuffer.duration;
    
    // Basic structure estimation based on typical song structure
    const structure: AudioStructure = {
      verses: [],
    };
    
    if (duration > 30) {
      structure.intro = { start: 0, end: Math.min(15, duration * 0.1) };
    }
    
    if (duration > 60) {
      structure.verses.push({ start: structure.intro?.end || 0, end: duration * 0.4 });
      structure.chorus = { start: duration * 0.4, end: duration * 0.6 };
      structure.verses.push({ start: duration * 0.6, end: duration * 0.8 });
    }
    
    if (duration > 45) {
      structure.outro = { start: duration * 0.9, end: duration };
    }
    
    return structure;
  }

  // Public utility methods
  async loadAudioFile(file: File): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioEngine not initialized');
    }

    const arrayBuffer = await file.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  createBufferSource(buffer: AudioBuffer): AudioBufferSourceNode {
    if (!this.audioContext) {
      throw new Error('AudioEngine not initialized');
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext || null;
  }
}