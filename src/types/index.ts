/**
 * Core type definitions for Web TimeShaper
 */

// Media File Types
export interface MediaFile {
  id: string;
  fileHandle: File;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface AudioTrack extends MediaFile {
  duration: number;
  audioBuffer?: AudioBuffer;
  analysis?: AudioAnalysis;
  type: 'audio';
}

export interface VideoClip extends MediaFile {
  duration: number;
  width: number;
  height: number;
  frameRate?: number;
  analysis?: VideoAnalysis;
  thumbnails?: string[];
  type: 'video';
}

// Analysis Types
export interface AudioAnalysis {
  bpm: number;
  confidence: number;
  energy: number[];
  segments: AudioSegment[];
  mood: AudioMood;
  structure: AudioStructure;
}

export interface AudioSegment {
  start: number;
  end: number;
  energy: number;
  features: {
    rms: number;
    spectralCentroid: number;
    spectralRolloff: number;
    mfcc: number[];
  };
}

export interface AudioMood {
  valence: number; // 0-1 (sad to happy)
  arousal: number; // 0-1 (calm to energetic)
  category: 'happy' | 'sad' | 'energetic' | 'calm' | 'dramatic' | 'peaceful';
}

export interface AudioStructure {
  intro?: { start: number; end: number };
  verses: { start: number; end: number }[];
  chorus?: { start: number; end: number };
  bridge?: { start: number; end: number };
  outro?: { start: number; end: number };
}

export interface VideoAnalysis {
  motion: MotionAnalysis;
  color: ColorAnalysis;
  brightness: BrightnessAnalysis;
  scenes: SceneAnalysis[];
  quality: QualityAnalysis;
}

export interface MotionAnalysis {
  intensity: number; // 0-1
  direction: 'static' | 'horizontal' | 'vertical' | 'mixed';
  consistency: number; // 0-1
  classification: 'static' | 'low' | 'medium' | 'high';
}

export interface ColorAnalysis {
  dominantColors: string[];
  temperature: number; // 0-1 (cool to warm)
  saturation: number; // 0-1
  mood: 'warm' | 'cool' | 'vibrant' | 'muted';
}

export interface BrightnessAnalysis {
  average: number; // 0-1
  consistency: number; // 0-1
  classification: 'dark' | 'normal' | 'bright';
}

export interface SceneAnalysis {
  start: number;
  end: number;
  type: 'indoor' | 'outdoor' | 'close-up' | 'wide' | 'medium';
  confidence: number;
}

export interface QualityAnalysis {
  sharpness: number; // 0-1
  stability: number; // 0-1
  noise: number; // 0-1
  overall: number; // 0-1
}

// Narrative Types
export interface NarrativeArchetype {
  id: string;
  title: string;
  description: string;
  emotionalArc: EmotionalArc;
  visualRequirements: VisualRequirements;
  structure: NarrativeStructure;
  icon: string;
  color: string;
}

export interface EmotionalArc {
  start: number; // 0-1 (low to high energy)
  peak: number;
  resolution: number;
  points: { time: number; energy: number }[];
}

export interface VisualRequirements {
  preferredMotion: 'static' | 'low' | 'medium' | 'high';
  preferredColors: 'warm' | 'cool' | 'vibrant' | 'muted';
  preferredBrightness: 'dark' | 'normal' | 'bright';
  variety: number; // 0-1 (consistent to varied)
}

export interface NarrativeStructure {
  intro: { duration: number; requirements: string[] };
  development: { duration: number; requirements: string[] };
  climax: { duration: number; requirements: string[] };
  resolution: { duration: number; requirements: string[] };
}

// Project State Types
export interface ProjectState {
  id: string;
  audioTrack?: AudioTrack;
  videoClips: VideoClip[];
  selectedNarrative?: NarrativeArchetype;
  generatedVideo?: GeneratedVideo;
  status: ProcessingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedVideo {
  id: string;
  duration: number;
  clips: VideoClipUsage[];
  audioSync: AudioSyncPoint[];
  renderSettings: RenderSettings;
  preview?: string;
  final?: Blob;
}

export interface VideoClipUsage {
  clipId: string;
  startTime: number;
  endTime: number;
  clipStart: number;
  clipEnd: number;
  effects?: VideoEffect[];
}

export interface AudioSyncPoint {
  time: number;
  beat: number;
  energy: number;
}

export interface VideoEffect {
  type: 'fade' | 'cut' | 'zoom' | 'pan' | 'color';
  parameters: Record<string, number | string>;
}

export interface RenderSettings {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  format: 'mp4' | 'webm';
  quality: 'low' | 'medium' | 'high';
}

// UI State Types
export interface UIState {
  currentView: 'upload' | 'narrative' | 'timeline' | 'storyboard' | 'effects' | 'export';
  isProcessing: boolean;
  selectedClips: string[];
  timelinePosition: number;
  zoomLevel: number;
  showPreview: boolean;
  modalState: ModalState | null;
}

export interface ModalState {
  type: 'preview' | 'settings' | 'export' | 'error' | 'confirm';
  data?: any;
}

export type ProcessingStatus = 
  | 'idle'
  | 'uploading'
  | 'analyzing-audio'
  | 'analyzing-video'
  | 'generating'
  | 'rendering'
  | 'complete'
  | 'error';

// App State
export interface AppState {
  project: ProjectState;
  ui: UIState;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  autoSave: boolean;
  renderQuality: 'low' | 'medium' | 'high';
  notifications: boolean;
}

// Event Types
export interface MediaUploadEvent {
  type: 'audio' | 'video';
  files: File[];
}

export interface AnalysisProgressEvent {
  stage: 'audio' | 'video';
  progress: number;
  message: string;
}

export interface RenderProgressEvent {
  progress: number;
  stage: 'preparing' | 'processing' | 'encoding' | 'finalizing';
  eta?: number;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}