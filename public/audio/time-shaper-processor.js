/**
 * AudioWorklet processor for real-time audio analysis
 */

class TimeShaperProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    this.bufferSize = 2048;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.frameCount = 0;
    
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'start-analysis':
        this.startAnalysis(data);
        break;
      case 'stop-analysis':
        this.stopAnalysis();
        break;
      case 'set-parameters':
        this.setParameters(data);
        break;
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (input.length > 0) {
      const inputChannel = input[0];
      const outputChannel = output[0];
      
      // Copy input to output (passthrough)
      outputChannel.set(inputChannel);
      
      // Process audio for analysis
      this.processAudioData(inputChannel);
    }
    
    return true;
  }

  processAudioData(audioData) {
    for (let i = 0; i < audioData.length; i++) {
      this.buffer[this.bufferIndex] = audioData[i];
      this.bufferIndex++;
      
      if (this.bufferIndex >= this.bufferSize) {
        this.analyzeBuffer();
        this.bufferIndex = 0;
      }
    }
    
    this.frameCount++;
  }

  analyzeBuffer() {
    const features = this.extractFeatures(this.buffer);
    
    this.port.postMessage({
      type: 'features',
      data: {
        features,
        timestamp: this.frameCount * this.bufferSize / sampleRate
      }
    });
  }

  extractFeatures(buffer) {
    return {
      rms: this.computeRMS(buffer),
      zcr: this.computeZeroCrossingRate(buffer),
      spectralCentroid: this.computeSpectralCentroid(buffer),
      spectralFlux: this.computeSpectralFlux(buffer)
    };
  }

  computeRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  computeZeroCrossingRate(buffer) {
    let crossings = 0;
    for (let i = 1; i < buffer.length; i++) {
      if ((buffer[i] >= 0) !== (buffer[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / buffer.length;
  }

  computeSpectralCentroid(buffer) {
    const spectrum = this.computeMagnitudeSpectrum(buffer);
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < spectrum.length; i++) {
      numerator += i * spectrum[i];
      denominator += spectrum[i];
    }
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  computeSpectralFlux(buffer) {
    const spectrum = this.computeMagnitudeSpectrum(buffer);
    
    if (!this.prevSpectrum) {
      this.prevSpectrum = spectrum;
      return 0;
    }
    
    let flux = 0;
    for (let i = 0; i < spectrum.length; i++) {
      const diff = spectrum[i] - this.prevSpectrum[i];
      if (diff > 0) {
        flux += diff;
      }
    }
    
    this.prevSpectrum = spectrum;
    return flux / spectrum.length;
  }

  computeMagnitudeSpectrum(buffer) {
    // Simplified FFT implementation for magnitude spectrum
    const N = buffer.length;
    const spectrum = new Float32Array(N / 2);
    
    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += buffer[n] * Math.cos(angle);
        imag += buffer[n] * Math.sin(angle);
      }
      
      spectrum[k] = Math.sqrt(real * real + imag * imag);
    }
    
    return spectrum;
  }

  startAnalysis(parameters) {
    this.analysisActive = true;
    this.port.postMessage({
      type: 'analysis-started',
      data: { parameters }
    });
  }

  stopAnalysis() {
    this.analysisActive = false;
    this.port.postMessage({
      type: 'analysis-stopped'
    });
  }

  setParameters(parameters) {
    Object.assign(this, parameters);
  }
}

registerProcessor('time-shaper-processor', TimeShaperProcessor);