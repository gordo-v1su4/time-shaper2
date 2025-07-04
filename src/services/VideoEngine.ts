import { BaseService } from './BaseService';
import type { VideoAnalysis, MotionAnalysis, ColorAnalysis, BrightnessAnalysis, SceneAnalysis, QualityAnalysis } from '../types';

export class VideoEngine extends BaseService {
  private processingQueue: Array<{ file: File; resolve: Function; reject: Function }> = [];
  private isProcessing = false;
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;

  constructor() {
    super({ name: 'VideoEngine', autoStart: true });
  }

  protected async doInit(): Promise<void> {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    // Check for WebCodecs support
    if ('VideoDecoder' in window) {
      this.emit('webcodecs-available');
    } else {
      this.emit('webcodecs-fallback');
    }
  }

  protected async doStart(): Promise<void> {
    this.emit('video-engine-started');
  }

  protected async doStop(): Promise<void> {
    this.processingQueue = [];
    this.isProcessing = false;
    this.emit('video-engine-stopped');
  }

  protected async doDestroy(): Promise<void> {
    if (this.canvas) {
      this.canvas.remove();
    }
    this.processingQueue = [];
  }

  async analyzeVideo(file: File): Promise<VideoAnalysis> {
    return new Promise((resolve, reject) => {
      this.processingQueue.push({ file, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const { file, resolve, reject } = this.processingQueue.shift()!;

    try {
      const analysis = await this.performVideoAnalysis(file);
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

  private async performVideoAnalysis(file: File): Promise<VideoAnalysis> {
    this.emit('analysis-started', { fileName: file.name, size: file.size });

    const video = await this.loadVideo(file);
    const frames = await this.extractFrames(video, 30); // Extract 30 frames for analysis

    const [motion, color, brightness, scenes, quality] = await Promise.all([
      this.analyzeMotion(frames),
      this.analyzeColor(frames),
      this.analyzeBrightness(frames),
      this.analyzeScenes(frames, video.duration),
      this.analyzeQuality(frames)
    ]);

    const analysis: VideoAnalysis = {
      motion,
      color,
      brightness,
      scenes,
      quality
    };

    this.emit('analysis-complete', analysis);
    return analysis;
  }

  private async loadVideo(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';

      video.onloadedmetadata = () => {
        resolve(video);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  private async extractFrames(video: HTMLVideoElement, frameCount: number): Promise<ImageData[]> {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized');
    }

    const frames: ImageData[] = [];
    const duration = video.duration;
    const interval = duration / frameCount;

    this.canvas.width = Math.min(video.videoWidth, 640);
    this.canvas.height = Math.min(video.videoHeight, 480);

    for (let i = 0; i < frameCount; i++) {
      const time = i * interval;
      
      await new Promise<void>((resolve) => {
        video.currentTime = time;
        video.onseeked = () => {
          this.ctx!.drawImage(video, 0, 0, this.canvas!.width, this.canvas!.height);
          const imageData = this.ctx!.getImageData(0, 0, this.canvas!.width, this.canvas!.height);
          frames.push(imageData);
          resolve();
        };
      });

      this.emit('frame-extracted', { frame: i + 1, total: frameCount });
    }

    URL.revokeObjectURL(video.src);
    return frames;
  }

  private async analyzeMotion(frames: ImageData[]): Promise<MotionAnalysis> {
    if (frames.length < 2) {
      return {
        intensity: 0,
        direction: 'static',
        consistency: 1,
        classification: 'static'
      };
    }

    let totalMotion = 0;
    let horizontalMotion = 0;
    let verticalMotion = 0;
    const motionValues: number[] = [];

    for (let i = 1; i < frames.length; i++) {
      const motion = this.computeFrameDifference(frames[i - 1], frames[i]);
      const vectors = this.computeOpticalFlow(frames[i - 1], frames[i]);
      
      totalMotion += motion.intensity;
      horizontalMotion += Math.abs(vectors.horizontal);
      verticalMotion += Math.abs(vectors.vertical);
      motionValues.push(motion.intensity);
    }

    const avgMotion = totalMotion / (frames.length - 1);
    const avgHorizontal = horizontalMotion / (frames.length - 1);
    const avgVertical = verticalMotion / (frames.length - 1);

    // Determine dominant direction
    let direction: MotionAnalysis['direction'];
    if (avgMotion < 0.1) {
      direction = 'static';
    } else if (avgHorizontal > avgVertical * 1.5) {
      direction = 'horizontal';
    } else if (avgVertical > avgHorizontal * 1.5) {
      direction = 'vertical';
    } else {
      direction = 'mixed';
    }

    // Calculate consistency (inverse of variance)
    const variance = this.computeVariance(motionValues);
    const consistency = Math.max(0, 1 - variance);

    // Classify motion intensity
    let classification: MotionAnalysis['classification'];
    if (avgMotion < 0.1) classification = 'static';
    else if (avgMotion < 0.3) classification = 'low';
    else if (avgMotion < 0.6) classification = 'medium';
    else classification = 'high';

    return {
      intensity: avgMotion,
      direction,
      consistency,
      classification
    };
  }

  private computeFrameDifference(frame1: ImageData, frame2: ImageData): { intensity: number } {
    const data1 = frame1.data;
    const data2 = frame2.data;
    let totalDiff = 0;
    let pixelCount = 0;

    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
      const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];
      
      const diff = Math.sqrt(
        Math.pow(r2 - r1, 2) + 
        Math.pow(g2 - g1, 2) + 
        Math.pow(b2 - b1, 2)
      ) / (255 * Math.sqrt(3));
      
      totalDiff += diff;
      pixelCount++;
    }

    return { intensity: totalDiff / pixelCount };
  }

  private computeOpticalFlow(frame1: ImageData, frame2: ImageData): { horizontal: number; vertical: number } {
    // Simplified optical flow using block matching
    const blockSize = 16;
    const searchRadius = 8;
    const width = frame1.width;
    const height = frame1.height;
    
    let totalHorizontal = 0;
    let totalVertical = 0;
    let blockCount = 0;

    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        const vector = this.findBestMatch(frame1, frame2, x, y, blockSize, searchRadius);
        totalHorizontal += vector.dx;
        totalVertical += vector.dy;
        blockCount++;
      }
    }

    return {
      horizontal: blockCount > 0 ? totalHorizontal / blockCount : 0,
      vertical: blockCount > 0 ? totalVertical / blockCount : 0
    };
  }

  private findBestMatch(
    frame1: ImageData, 
    frame2: ImageData, 
    x: number, 
    y: number, 
    blockSize: number, 
    searchRadius: number
  ): { dx: number; dy: number } {
    let bestDx = 0;
    let bestDy = 0;
    let bestError = Infinity;

    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const error = this.computeBlockError(frame1, frame2, x, y, x + dx, y + dy, blockSize);
        if (error < bestError) {
          bestError = error;
          bestDx = dx;
          bestDy = dy;
        }
      }
    }

    return { dx: bestDx, dy: bestDy };
  }

  private computeBlockError(
    frame1: ImageData, 
    frame2: ImageData, 
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number, 
    blockSize: number
  ): number {
    const width = frame1.width;
    let error = 0;
    let pixelCount = 0;

    for (let dy = 0; dy < blockSize; dy++) {
      for (let dx = 0; dx < blockSize; dx++) {
        const idx1 = ((y1 + dy) * width + (x1 + dx)) * 4;
        const idx2 = ((y2 + dy) * width + (x2 + dx)) * 4;
        
        if (idx1 >= 0 && idx1 < frame1.data.length && idx2 >= 0 && idx2 < frame2.data.length) {
          const r1 = frame1.data[idx1], g1 = frame1.data[idx1 + 1], b1 = frame1.data[idx1 + 2];
          const r2 = frame2.data[idx2], g2 = frame2.data[idx2 + 1], b2 = frame2.data[idx2 + 2];
          
          error += Math.abs(r2 - r1) + Math.abs(g2 - g1) + Math.abs(b2 - b1);
          pixelCount++;
        }
      }
    }

    return pixelCount > 0 ? error / (pixelCount * 255 * 3) : 1;
  }

  private async analyzeColor(frames: ImageData[]): Promise<ColorAnalysis> {
    const allColors: { r: number; g: number; b: number; count: number }[] = [];
    let totalTemperature = 0;
    let totalSaturation = 0;

    frames.forEach(frame => {
      const colors = this.extractDominantColors(frame, 5);
      allColors.push(...colors);
      
      const temp = this.computeColorTemperature(colors);
      const sat = this.computeSaturation(colors);
      
      totalTemperature += temp;
      totalSaturation += sat;
    });

    const avgTemperature = totalTemperature / frames.length;
    const avgSaturation = totalSaturation / frames.length;

    // Cluster colors to find dominant ones
    const dominantColors = this.clusterColors(allColors, 3);

    // Determine mood
    let mood: ColorAnalysis['mood'];
    if (avgTemperature > 0.6 && avgSaturation > 0.6) mood = 'warm';
    else if (avgTemperature < 0.4 && avgSaturation > 0.6) mood = 'cool';
    else if (avgSaturation > 0.7) mood = 'vibrant';
    else mood = 'muted';

    return {
      dominantColors: dominantColors.map(c => `rgb(${c.r},${c.g},${c.b})`),
      temperature: avgTemperature,
      saturation: avgSaturation,
      mood
    };
  }

  private extractDominantColors(frame: ImageData, count: number): { r: number; g: number; b: number; count: number }[] {
    const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>();
    const data = frame.data;
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = Math.floor(data[i] / 32) * 32;
      const g = Math.floor(data[i + 1] / 32) * 32;
      const b = Math.floor(data[i + 2] / 32) * 32;
      
      const key = `${r},${g},${b}`;
      if (colorMap.has(key)) {
        colorMap.get(key)!.count++;
      } else {
        colorMap.set(key, { r, g, b, count: 1 });
      }
    }
    
    return Array.from(colorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, count);
  }

  private computeColorTemperature(colors: { r: number; g: number; b: number; count: number }[]): number {
    let totalWeight = 0;
    let weightedTemp = 0;
    
    colors.forEach(color => {
      // Simple temperature estimation: warm colors have more red, cool colors have more blue
      const temp = (color.r - color.b + 255) / 510; // Normalize to 0-1
      weightedTemp += temp * color.count;
      totalWeight += color.count;
    });
    
    return totalWeight > 0 ? weightedTemp / totalWeight : 0.5;
  }

  private computeSaturation(colors: { r: number; g: number; b: number; count: number }[]): number {
    let totalWeight = 0;
    let weightedSat = 0;
    
    colors.forEach(color => {
      const max = Math.max(color.r, color.g, color.b);
      const min = Math.min(color.r, color.g, color.b);
      const sat = max > 0 ? (max - min) / max : 0;
      
      weightedSat += sat * color.count;
      totalWeight += color.count;
    });
    
    return totalWeight > 0 ? weightedSat / totalWeight : 0;
  }

  private clusterColors(colors: { r: number; g: number; b: number; count: number }[], k: number): { r: number; g: number; b: number; count: number }[] {
    // Simple k-means clustering for color quantization
    if (colors.length <= k) return colors;
    
    // Initialize centroids
    const centroids = colors.slice(0, k);
    
    // Iterate to find optimal centroids
    for (let iter = 0; iter < 10; iter++) {
      const clusters: { r: number; g: number; b: number; count: number }[][] = Array(k).fill(null).map(() => []);
      
      // Assign colors to nearest centroid
      colors.forEach(color => {
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        
        centroids.forEach((centroid, index) => {
          const distance = this.colorDistance(color, centroid);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });
        
        clusters[nearestIndex].push(color);
      });
      
      // Update centroids
      clusters.forEach((cluster, index) => {
        if (cluster.length > 0) {
          let totalR = 0, totalG = 0, totalB = 0, totalCount = 0;
          cluster.forEach(color => {
            totalR += color.r * color.count;
            totalG += color.g * color.count;
            totalB += color.b * color.count;
            totalCount += color.count;
          });
          
          centroids[index] = {
            r: Math.round(totalR / totalCount),
            g: Math.round(totalG / totalCount),
            b: Math.round(totalB / totalCount),
            count: totalCount
          };
        }
      });
    }
    
    return centroids;
  }

  private colorDistance(color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number {
    return Math.sqrt(
      Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
    );
  }

  private async analyzeBrightness(frames: ImageData[]): Promise<BrightnessAnalysis> {
    const brightnessValues: number[] = [];
    
    frames.forEach(frame => {
      const brightness = this.computeFrameBrightness(frame);
      brightnessValues.push(brightness);
    });
    
    const average = brightnessValues.reduce((sum, val) => sum + val, 0) / brightnessValues.length;
    const variance = this.computeVariance(brightnessValues);
    const consistency = Math.max(0, 1 - variance);
    
    let classification: BrightnessAnalysis['classification'];
    if (average < 0.3) classification = 'dark';
    else if (average > 0.7) classification = 'bright';
    else classification = 'normal';
    
    return {
      average,
      consistency,
      classification
    };
  }

  private computeFrameBrightness(frame: ImageData): number {
    const data = frame.data;
    let totalBrightness = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Use luminance formula
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      totalBrightness += brightness;
      pixelCount++;
    }
    
    return totalBrightness / pixelCount;
  }

  private async analyzeScenes(frames: ImageData[], duration: number): Promise<SceneAnalysis[]> {
    const scenes: SceneAnalysis[] = [];
    const frameInterval = duration / frames.length;
    
    let currentSceneStart = 0;
    const threshold = 0.3; // Scene change threshold
    
    for (let i = 1; i < frames.length; i++) {
      const difference = this.computeFrameDifference(frames[i - 1], frames[i]);
      
      if (difference.intensity > threshold) {
        // Scene change detected
        const sceneEnd = i * frameInterval;
        const sceneType = this.classifyScene(frames[i - 1]);
        
        scenes.push({
          start: currentSceneStart,
          end: sceneEnd,
          type: sceneType.type,
          confidence: sceneType.confidence
        });
        
        currentSceneStart = sceneEnd;
      }
    }
    
    // Add final scene
    if (currentSceneStart < duration) {
      const sceneType = this.classifyScene(frames[frames.length - 1]);
      scenes.push({
        start: currentSceneStart,
        end: duration,
        type: sceneType.type,
        confidence: sceneType.confidence
      });
    }
    
    return scenes;
  }

  private classifyScene(frame: ImageData): { type: SceneAnalysis['type']; confidence: number } {
    const brightness = this.computeFrameBrightness(frame);
    const colors = this.extractDominantColors(frame, 3);
    const edgeCount = this.computeEdgeCount(frame);
    
    // Simple heuristic-based classification
    let type: SceneAnalysis['type'];
    let confidence = 0.5;
    
    if (brightness > 0.6 && colors.some(c => c.g > c.r && c.g > c.b)) {
      type = 'outdoor';
      confidence = 0.7;
    } else if (brightness < 0.4 || edgeCount > 0.3) {
      type = 'indoor';
      confidence = 0.6;
    } else if (edgeCount < 0.1) {
      type = 'close-up';
      confidence = 0.8;
    } else if (edgeCount > 0.4) {
      type = 'wide';
      confidence = 0.7;
    } else {
      type = 'medium';
      confidence = 0.5;
    }
    
    return { type, confidence };
  }

  private computeEdgeCount(frame: ImageData): number {
    const data = frame.data;
    const width = frame.width;
    const height = frame.height;
    let edgeCount = 0;
    let totalPixels = 0;
    
    // Simple edge detection using gradient magnitude
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        const gx = (data[idx + 4] - data[idx - 4]) / 2; // Horizontal gradient
        const gy = (data[idx + width * 4] - data[idx - width * 4]) / 2; // Vertical gradient
        
        const magnitude = Math.sqrt(gx * gx + gy * gy) / 255;
        
        if (magnitude > 0.1) { // Edge threshold
          edgeCount++;
        }
        totalPixels++;
      }
    }
    
    return totalPixels > 0 ? edgeCount / totalPixels : 0;
  }

  private async analyzeQuality(frames: ImageData[]): Promise<QualityAnalysis> {
    let totalSharpness = 0;
    let totalStability = 0;
    let totalNoise = 0;
    
    frames.forEach((frame, index) => {
      const sharpness = this.computeSharpness(frame);
      const noise = this.computeNoise(frame);
      
      totalSharpness += sharpness;
      totalNoise += noise;
      
      if (index > 0) {
        const stability = this.computeStability(frames[index - 1], frame);
        totalStability += stability;
      }
    });
    
    const avgSharpness = totalSharpness / frames.length;
    const avgStability = frames.length > 1 ? totalStability / (frames.length - 1) : 1;
    const avgNoise = totalNoise / frames.length;
    
    // Overall quality is combination of factors
    const overall = (avgSharpness + avgStability + (1 - avgNoise)) / 3;
    
    return {
      sharpness: avgSharpness,
      stability: avgStability,
      noise: avgNoise,
      overall
    };
  }

  private computeSharpness(frame: ImageData): number {
    // Use Laplacian operator for sharpness measurement
    const data = frame.data;
    const width = frame.width;
    const height = frame.height;
    let sharpness = 0;
    let count = 0;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Convert to grayscale
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const top = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
        const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
        const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        
        // Laplacian
        const laplacian = Math.abs(4 * center - top - bottom - left - right) / 255;
        sharpness += laplacian;
        count++;
      }
    }
    
    return count > 0 ? sharpness / count : 0;
  }

  private computeStability(frame1: ImageData, frame2: ImageData): number {
    const motion = this.computeFrameDifference(frame1, frame2);
    return Math.max(0, 1 - motion.intensity * 2); // Invert motion to get stability
  }

  private computeNoise(frame: ImageData): number {
    // Estimate noise using high-frequency content
    const data = frame.data;
    const width = frame.width;
    const height = frame.height;
    let noise = 0;
    let count = 0;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // High-pass filter
        const center = data[idx];
        const surrounding = (
          data[idx - 4] + data[idx + 4] + 
          data[idx - width * 4] + data[idx + width * 4]
        ) / 4;
        
        const highFreq = Math.abs(center - surrounding) / 255;
        noise += highFreq;
        count++;
      }
    }
    
    return count > 0 ? noise / count : 0;
  }

  private computeVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  // Public utility methods
  async extractThumbnails(file: File, count: number = 5): Promise<string[]> {
    const video = await this.loadVideo(file);
    const thumbnails: string[] = [];
    const duration = video.duration;
    const interval = duration / count;

    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized');
    }

    this.canvas.width = 160;
    this.canvas.height = 90;

    for (let i = 0; i < count; i++) {
      const time = i * interval;
      
      await new Promise<void>((resolve) => {
        video.currentTime = time;
        video.onseeked = () => {
          this.ctx!.drawImage(video, 0, 0, this.canvas!.width, this.canvas!.height);
          const thumbnail = this.canvas!.toDataURL('image/jpeg', 0.8);
          thumbnails.push(thumbnail);
          resolve();
        };
      });
    }

    URL.revokeObjectURL(video.src);
    return thumbnails;
  }

  async getVideoMetadata(file: File): Promise<{ width: number; height: number; duration: number; frameRate?: number }> {
    const video = await this.loadVideo(file);
    
    const metadata = {
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
      frameRate: undefined as number | undefined
    };

    URL.revokeObjectURL(video.src);
    return metadata;
  }
}