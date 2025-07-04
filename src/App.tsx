import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Video, Sparkles, Cpu, Download, Upload } from 'lucide-react';
import { MediaUpload } from './components/MediaUpload';
import { NarrativeSelection } from './components/NarrativeSelection';
import { Button } from './components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';
import { useAppStore, useCurrentView, useProcessingStatus } from './store';
import { AudioEngine } from './services/AudioEngine';
import { VideoEngine } from './services/VideoEngine';
import type { AudioTrack, VideoClip, NarrativeArchetype } from './types';

// Initialize services
const audioEngine = new AudioEngine();
const videoEngine = new VideoEngine();

function App() {
  const { 
    project, 
    setCurrentView, 
    setAudioTrack, 
    addVideoClips, 
    setSelectedNarrative,
    setProcessingStatus 
  } = useAppStore();
  
  const currentView = useCurrentView();
  const processingStatus = useProcessingStatus();

  useEffect(() => {
    // Initialize services (but don't start them yet)
    audioEngine.init().catch(console.error);
    videoEngine.init().catch(console.error);

    return () => {
      audioEngine.destroy().catch(console.error);
      videoEngine.destroy().catch(console.error);
    };
  }, []);

  const handleAudioUpload = async (file: File) => {
    try {
      setProcessingStatus('analyzing-audio');
      
      // Start the audio engine on user interaction
      await audioEngine.start();
      
      const audioBuffer = await audioEngine.loadAudioFile(file);
      const analysis = await audioEngine.analyzeAudio(audioBuffer);
      
      const audioTrack: AudioTrack = {
        id: crypto.randomUUID(),
        fileHandle: file,
        name: file.name,
        type: 'audio',
        size: file.size,
        url: URL.createObjectURL(file),
        duration: audioBuffer.duration,
        audioBuffer,
        analysis
      };
      
      setAudioTrack(audioTrack);
      setProcessingStatus('idle');
    } catch (error) {
      console.error('Audio upload failed:', error);
      setProcessingStatus('error');
    }
  };

  const handleVideoUpload = async (files: File[]) => {
    try {
      setProcessingStatus('analyzing-video');
      
      const videoClips: VideoClip[] = [];
      
      for (const file of files) {
        const metadata = await videoEngine.getVideoMetadata(file);
        const analysis = await videoEngine.analyzeVideo(file);
        const thumbnails = await videoEngine.extractThumbnails(file, 5);
        
        const videoClip: VideoClip = {
          id: crypto.randomUUID(),
          fileHandle: file,
          name: file.name,
          type: 'video',
          size: file.size,
          url: URL.createObjectURL(file),
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          frameRate: metadata.frameRate,
          analysis,
          thumbnails
        };
        
        videoClips.push(videoClip);
      }
      
      addVideoClips(videoClips);
      setProcessingStatus('idle');
    } catch (error) {
      console.error('Video upload failed:', error);
      setProcessingStatus('error');
    }
  };

  const handleNarrativeSelect = (narrative: NarrativeArchetype) => {
    setSelectedNarrative(narrative);
    setCurrentView('timeline');
  };

  const canProceed = () => {
    switch (currentView) {
      case 'upload':
        return project.audioTrack && project.videoClips.length > 0;
      case 'narrative':
        return project.selectedNarrative;
      default:
        return true;
    }
  };

  const getNextView = () => {
    switch (currentView) {
      case 'upload':
        return 'narrative';
      case 'narrative':
        return 'timeline';
      default:
        return currentView;
    }
  };

  const handleNext = () => {
    const nextView = getNextView();
    setCurrentView(nextView);
  };

  const renderProcessingStatus = () => {
    if (processingStatus === 'idle') return null;

    const statusMessages = {
      'uploading': 'Uploading files...',
      'analyzing-audio': 'Analyzing audio content...',
      'analyzing-video': 'Analyzing video content...',
      'generating': 'Generating your music video...',
      'rendering': 'Rendering final video...',
      'complete': 'Complete!',
      'error': 'An error occurred'
    };

    const statusIcons = {
      'uploading': Upload,
      'analyzing-audio': Music,
      'analyzing-video': Video,
      'generating': Sparkles,
      'rendering': Cpu,
      'complete': Download,
      'error': '⚠️'
    };

    const IconComponent = statusIcons[processingStatus];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Card className="min-w-64">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {typeof IconComponent === 'string' ? (
                <span className="text-2xl">{IconComponent}</span>
              ) : (
                <IconComponent className="h-5 w-5 text-primary-500 animate-pulse" />
              )}
              <div>
                <p className="font-medium text-neutral-200">
                  {statusMessages[processingStatus]}
                </p>
                {processingStatus !== 'error' && processingStatus !== 'complete' && (
                  <p className="text-xs text-neutral-400 mt-1">
                    This may take a few moments...
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-100">Web TimeShaper</h1>
                <p className="text-sm text-neutral-400">AI Music Video Generator</p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {['upload', 'narrative', 'timeline'].map((step, index) => (
                  <React.Fragment key={step}>
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        currentView === step 
                          ? 'bg-primary-500 text-white' 
                          : index < ['upload', 'narrative', 'timeline'].indexOf(currentView)
                          ? 'bg-primary-500/30 text-primary-300'
                          : 'bg-neutral-700 text-neutral-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    {index < 2 && (
                      <div 
                        className={`w-8 h-0.5 transition-colors ${
                          index < ['upload', 'narrative', 'timeline'].indexOf(currentView)
                            ? 'bg-primary-500/30'
                            : 'bg-neutral-700'
                        }`} 
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold text-neutral-100">
                    Upload Your Media
                  </h2>
                  <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                    Start by uploading your audio track and video clips. Our AI will analyze 
                    them to create the perfect music video.
                  </p>
                </div>
                
                <MediaUpload 
                  onAudioUpload={handleAudioUpload}
                  onVideoUpload={handleVideoUpload}
                />

                {canProceed() && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                  >
                    <Button size="lg" onClick={handleNext}>
                      Continue to Narrative Selection
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {currentView === 'narrative' && (
            <motion.div
              key="narrative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <NarrativeSelection onNarrativeSelect={handleNarrativeSelect} />
            </motion.div>
          )}

          {currentView === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold text-neutral-100 mb-4">
                  Timeline View
                </h2>
                <p className="text-lg text-neutral-400">
                  Timeline and advanced editing features coming soon...
                </p>
              </div>

              {project.selectedNarrative && (
                <Card className="max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle>Selected Narrative: {project.selectedNarrative.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-400">{project.selectedNarrative.description}</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Processing Status */}
      {renderProcessingStatus()}
    </div>
  );
}

export default App;