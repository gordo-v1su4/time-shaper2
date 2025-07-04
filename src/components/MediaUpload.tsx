import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Music, Video, X, Play, Pause, FileAudio, FileVideo } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';

interface MediaUploadProps {
  onAudioUpload: (file: File) => void;
  onVideoUpload: (files: File[]) => void;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onAudioUpload,
  onVideoUpload,
}) => {
  const { project, setProcessingStatus } = useAppStore();
  const [dragOver, setDragOver] = useState<'audio' | 'video' | null>(null);
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent, type: 'audio' | 'video') => {
    e.preventDefault();
    setDragOver(type);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'audio' | 'video') => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (type === 'audio' && files.length > 0) {
      const audioFile = files.find(file => file.type.startsWith('audio/'));
      if (audioFile) {
        onAudioUpload(audioFile);
      }
    } else if (type === 'video') {
      const videoFiles = files.filter(file => file.type.startsWith('video/'));
      if (videoFiles.length > 0) {
        onVideoUpload(videoFiles);
      }
    }
  }, [onAudioUpload, onVideoUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'video') => {
    const files = Array.from(e.target.files || []);
    if (type === 'audio' && files.length > 0) {
      onAudioUpload(files[0]);
    } else if (type === 'video' && files.length > 0) {
      onVideoUpload(files);
    }
  }, [onAudioUpload, onVideoUpload]);

  const handleAudioPreview = useCallback(() => {
    if (!project.audioTrack) return;

    if (audioPreview) {
      if (isPlaying) {
        audioPreview.pause();
        setIsPlaying(false);
      } else {
        audioPreview.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(project.audioTrack.url);
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      setAudioPreview(audio);
      audio.play();
      setIsPlaying(true);
    }
  }, [project.audioTrack, audioPreview, isPlaying]);

  const removeAudioTrack = useCallback(() => {
    if (audioPreview) {
      audioPreview.pause();
      setAudioPreview(null);
      setIsPlaying(false);
    }
    useAppStore.getState().updateProjectData({ audioTrack: undefined });
  }, [audioPreview]);

  const removeVideoClip = useCallback((clipId: string) => {
    useAppStore.getState().removeVideoClip(clipId);
  }, []);

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Audio Upload Section */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary-500" />
            Audio Track
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!project.audioTrack ? (
            <motion.div
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
                dragOver === 'audio' 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : 'border-neutral-700 hover:border-neutral-600'
              )}
              onDragOver={(e) => handleDragOver(e, 'audio')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'audio')}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-neutral-800">
                  <Upload className="h-8 w-8 text-neutral-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-neutral-200">
                    Drop your audio file here
                  </p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Supports MP3, WAV, M4A files
                  </p>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileSelect(e, 'audio')}
                  className="hidden"
                  id="audio-upload"
                />
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById('audio-upload')?.click()}
                >
                  Choose File
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-lg"
            >
              <div className="p-2 rounded bg-primary-500/20">
                <FileAudio className="h-6 w-6 text-primary-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-neutral-200">{project.audioTrack.name}</h4>
                <div className="flex items-center gap-4 text-sm text-neutral-400 mt-1">
                  <span>{formatFileSize(project.audioTrack.size)}</span>
                  {project.audioTrack.duration && (
                    <span>{formatDuration(project.audioTrack.duration)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAudioPreview}
                  className="p-2"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeAudioTrack}
                  className="p-2 text-error-500 hover:text-error-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Video Upload Section */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-secondary-500" />
            Video Clips ({project.videoClips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-6',
              dragOver === 'video' 
                ? 'border-secondary-500 bg-secondary-500/10' 
                : 'border-neutral-700 hover:border-neutral-600'
            )}
            onDragOver={(e) => handleDragOver(e, 'video')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'video')}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-neutral-800">
                <Upload className="h-8 w-8 text-neutral-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-neutral-200">
                  Drop your video files here
                </p>
                <p className="text-sm text-neutral-400 mt-1">
                  Supports MP4, MOV, AVI files
                </p>
              </div>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => handleFileSelect(e, 'video')}
                className="hidden"
                id="video-upload"
              />
              <Button
                variant="secondary"
                onClick={() => document.getElementById('video-upload')?.click()}
              >
                Choose Files
              </Button>
            </div>
          </motion.div>

          {/* Video Files List */}
          <AnimatePresence>
            {project.videoClips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {project.videoClips.map((clip, index) => (
                  <motion.div
                    key={clip.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-lg"
                  >
                    <div className="p-2 rounded bg-secondary-500/20">
                      <FileVideo className="h-6 w-6 text-secondary-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-200">{clip.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-neutral-400 mt-1">
                        <span>{formatFileSize(clip.size)}</span>
                        {clip.duration && (
                          <span>{formatDuration(clip.duration)}</span>
                        )}
                        {clip.width && clip.height && (
                          <span>{clip.width} × {clip.height}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVideoClip(clip.id)}
                      className="p-2 text-error-500 hover:text-error-400"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Upload Instructions */}
      <Card variant="glass">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-neutral-200 mb-3">Upload Guidelines</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-neutral-400">
            <div>
              <h4 className="font-medium text-neutral-300 mb-2">Audio Requirements</h4>
              <ul className="space-y-1">
                <li>• Single audio track only</li>
                <li>• MP3, WAV, or M4A format</li>
                <li>• Maximum 100MB file size</li>
                <li>• Minimum 30 seconds duration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-neutral-300 mb-2">Video Requirements</h4>
              <ul className="space-y-1">
                <li>• Multiple video files supported</li>
                <li>• MP4, MOV, or AVI format</li>
                <li>• Maximum 500MB per file</li>
                <li>• 1080p or higher recommended</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};