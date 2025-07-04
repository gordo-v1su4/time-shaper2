import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AppState, ProjectState, UIState, UserPreferences, ProcessingStatus, NarrativeArchetype } from '../types';

interface AppStore extends AppState {
  // Project actions
  setAudioTrack: (track: any) => void;
  addVideoClips: (clips: any[]) => void;
  removeVideoClip: (clipId: string) => void;
  setSelectedNarrative: (narrative: NarrativeArchetype) => void;
  setProcessingStatus: (status: ProcessingStatus) => void;
  updateProjectData: (data: Partial<ProjectState>) => void;
  
  // UI actions
  setCurrentView: (view: UIState['currentView']) => void;
  setProcessing: (isProcessing: boolean) => void;
  setSelectedClips: (clipIds: string[]) => void;
  setTimelinePosition: (position: number) => void;
  setZoomLevel: (level: number) => void;
  togglePreview: () => void;
  setModalState: (modal: UIState['modalState']) => void;
  
  // Preference actions
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  
  // Utility actions
  resetProject: () => void;
  loadProject: (project: ProjectState) => void;
}

const initialProject: ProjectState = {
  id: '',
  videoClips: [],
  status: 'idle',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const initialUI: UIState = {
  currentView: 'upload',
  isProcessing: false,
  selectedClips: [],
  timelinePosition: 0,
  zoomLevel: 1,
  showPreview: false,
  modalState: null,
};

const initialPreferences: UserPreferences = {
  theme: 'dark',
  autoSave: true,
  renderQuality: 'high',
  notifications: true,
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    project: initialProject,
    ui: initialUI,
    preferences: initialPreferences,

    // Project actions
    setAudioTrack: (track) =>
      set((state) => ({
        project: {
          ...state.project,
          audioTrack: track,
          updatedAt: new Date(),
        },
      })),

    addVideoClips: (clips) =>
      set((state) => ({
        project: {
          ...state.project,
          videoClips: [...state.project.videoClips, ...clips],
          updatedAt: new Date(),
        },
      })),

    removeVideoClip: (clipId) =>
      set((state) => ({
        project: {
          ...state.project,
          videoClips: state.project.videoClips.filter((clip) => clip.id !== clipId),
          updatedAt: new Date(),
        },
      })),

    setSelectedNarrative: (narrative) =>
      set((state) => ({
        project: {
          ...state.project,
          selectedNarrative: narrative,
          updatedAt: new Date(),
        },
      })),

    setProcessingStatus: (status) =>
      set((state) => ({
        project: {
          ...state.project,
          status,
          updatedAt: new Date(),
        },
      })),

    updateProjectData: (data) =>
      set((state) => ({
        project: {
          ...state.project,
          ...data,
          updatedAt: new Date(),
        },
      })),

    // UI actions
    setCurrentView: (currentView) =>
      set((state) => ({
        ui: {
          ...state.ui,
          currentView,
        },
      })),

    setProcessing: (isProcessing) =>
      set((state) => ({
        ui: {
          ...state.ui,
          isProcessing,
        },
      })),

    setSelectedClips: (selectedClips) =>
      set((state) => ({
        ui: {
          ...state.ui,
          selectedClips,
        },
      })),

    setTimelinePosition: (timelinePosition) =>
      set((state) => ({
        ui: {
          ...state.ui,
          timelinePosition,
        },
      })),

    setZoomLevel: (zoomLevel) =>
      set((state) => ({
        ui: {
          ...state.ui,
          zoomLevel,
        },
      })),

    togglePreview: () =>
      set((state) => ({
        ui: {
          ...state.ui,
          showPreview: !state.ui.showPreview,
        },
      })),

    setModalState: (modalState) =>
      set((state) => ({
        ui: {
          ...state.ui,
          modalState,
        },
      })),

    // Preference actions
    updatePreferences: (prefs) =>
      set((state) => ({
        preferences: {
          ...state.preferences,
          ...prefs,
        },
      })),

    // Utility actions
    resetProject: () =>
      set({
        project: {
          ...initialProject,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ui: initialUI,
      }),

    loadProject: (project) =>
      set({
        project,
        ui: initialUI,
      }),
  }))
);

// Selectors for commonly used state
export const useProject = () => useAppStore((state) => state.project);
export const useUI = () => useAppStore((state) => state.ui);
export const usePreferences = () => useAppStore((state) => state.preferences);
export const useProcessingStatus = () => useAppStore((state) => state.project.status);
export const useCurrentView = () => useAppStore((state) => state.ui.currentView);