import React from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Sun, Coffee, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { narrativeArchetypes } from '../data/narratives';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';
import type { NarrativeArchetype } from '../types';

interface NarrativeSelectionProps {
  onNarrativeSelect: (narrative: NarrativeArchetype) => void;
}

const iconMap = {
  CloudRain,
  Sun,
  Coffee,
};

export const NarrativeSelection: React.FC<NarrativeSelectionProps> = ({
  onNarrativeSelect,
}) => {
  const { project } = useAppStore();
  const [selectedNarrative, setSelectedNarrative] = React.useState<string | null>(null);
  const [recommendedId, setRecommendedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Simple recommendation logic based on audio analysis if available
    if (project.audioTrack?.analysis) {
      const { mood } = project.audioTrack.analysis;
      if (mood.valence > 0.6 && mood.arousal > 0.6) {
        setRecommendedId('happy');
      } else if (mood.valence < 0.4 && mood.arousal > 0.5) {
        setRecommendedId('tragic');
      } else {
        setRecommendedId('slice-of-life');
      }
    }
  }, [project.audioTrack?.analysis]);

  const handleSelect = (narrative: NarrativeArchetype) => {
    setSelectedNarrative(narrative.id);
    onNarrativeSelect(narrative);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h2 className="text-3xl font-bold text-neutral-100">
            Choose Your Story
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Select a narrative archetype that will guide how your AI creates your music video. 
            Each style emphasizes different emotions and visual techniques.
          </p>
        </motion.div>

        {recommendedId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 border border-primary-500/30 rounded-full text-primary-300"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">
              AI recommends: {narrativeArchetypes.find(n => n.id === recommendedId)?.title}
            </span>
          </motion.div>
        )}
      </div>

      {/* Narrative Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {narrativeArchetypes.map((narrative, index) => {
          const IconComponent = iconMap[narrative.icon as keyof typeof iconMap];
          const isSelected = selectedNarrative === narrative.id;
          const isRecommended = recommendedId === narrative.id;

          return (
            <motion.div
              key={narrative.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  'relative overflow-hidden cursor-pointer transition-all duration-300 group',
                  isSelected && 'ring-2 ring-primary-500 bg-primary-500/10',
                  isRecommended && !isSelected && 'ring-1 ring-primary-400/50',
                  'hover:shadow-2xl hover:scale-105'
                )}
                onClick={() => handleSelect(narrative)}
              >
                {isRecommended && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
                    Recommended
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${narrative.color}20`, color: narrative.color }}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{narrative.title}</CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Description */}
                  <p className="text-neutral-400 leading-relaxed">
                    {narrative.description}
                  </p>

                  {/* Emotional Arc Visualization */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-neutral-300">Emotional Journey</h4>
                    <div className="h-12 bg-neutral-800 rounded-lg p-2 overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 100 20">
                        <path
                          d={`M 0 ${20 - narrative.emotionalArc.points[0].energy * 15} ${narrative.emotionalArc.points
                            .map((point, i) => `L ${point.time * 100} ${20 - point.energy * 15}`)
                            .join(' ')}`}
                          stroke={narrative.color}
                          strokeWidth="2"
                          fill="none"
                          opacity="0.8"
                        />
                        <path
                          d={`M 0 ${20 - narrative.emotionalArc.points[0].energy * 15} ${narrative.emotionalArc.points
                            .map((point, i) => `L ${point.time * 100} ${20 - point.energy * 15}`)
                            .join(' ')} L 100 20 L 0 20 Z`}
                          fill={narrative.color}
                          opacity="0.2"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Visual Style Indicators */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-neutral-300">Visual Style</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-neutral-400">Motion:</span>
                        <div className="flex">
                          <span 
                            className="px-2 py-1 rounded text-white font-medium"
                            style={{ backgroundColor: narrative.color }}
                          >
                            {narrative.visualRequirements.preferredMotion}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-neutral-400">Colors:</span>
                        <div className="flex">
                          <span 
                            className="px-2 py-1 rounded text-white font-medium"
                            style={{ backgroundColor: narrative.color }}
                          >
                            {narrative.visualRequirements.preferredColors}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-neutral-400">Brightness:</span>
                        <div className="flex">
                          <span 
                            className="px-2 py-1 rounded text-white font-medium"
                            style={{ backgroundColor: narrative.color }}
                          >
                            {narrative.visualRequirements.preferredBrightness}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-neutral-400">Variety:</span>
                        <div className="flex">
                          <span 
                            className="px-2 py-1 rounded text-white font-medium"
                            style={{ backgroundColor: narrative.color }}
                          >
                            {Math.round(narrative.visualRequirements.variety * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Select Button */}
                  <Button
                    variant={isSelected ? 'primary' : 'secondary'}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(narrative);
                    }}
                  >
                    {isSelected ? (
                      <>
                        Selected
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      'Select This Style'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Information Panel */}
      <Card variant="glass">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-neutral-200 mb-4">How Narrative Selection Works</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-neutral-400">
            <div className="space-y-2">
              <h4 className="font-medium text-neutral-300">AI Analysis</h4>
              <p>
                Our AI analyzes your audio's tempo, energy, and mood to recommend 
                the most fitting narrative style for your content.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-neutral-300">Visual Matching</h4>
              <p>
                Each narrative guides how videos are selected and sequenced based on 
                motion, color, brightness, and emotional progression.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-neutral-300">Creative Control</h4>
              <p>
                You maintain full creative control while the AI handles the technical 
                complexity of timing and visual storytelling.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};