import type { NarrativeArchetype } from '../types';

export const narrativeArchetypes: NarrativeArchetype[] = [
  {
    id: 'tragic',
    title: 'Tragic',
    description: 'A melancholic journey with dramatic emotional depth, building tension toward a powerful climax before resolving in contemplation.',
    icon: 'CloudRain',
    color: '#7C3AED', // Purple
    emotionalArc: {
      start: 0.3,
      peak: 0.9,
      resolution: 0.2,
      points: [
        { time: 0, energy: 0.3 },
        { time: 0.2, energy: 0.4 },
        { time: 0.4, energy: 0.6 },
        { time: 0.6, energy: 0.8 },
        { time: 0.8, energy: 0.9 },
        { time: 1, energy: 0.2 }
      ]
    },
    visualRequirements: {
      preferredMotion: 'low',
      preferredColors: 'cool',
      preferredBrightness: 'dark',
      variety: 0.6
    },
    structure: {
      intro: {
        duration: 0.15,
        requirements: ['low energy', 'dark mood', 'slow motion']
      },
      development: {
        duration: 0.45,
        requirements: ['gradual buildup', 'increasing tension', 'varied motion']
      },
      climax: {
        duration: 0.25,
        requirements: ['high energy', 'dramatic visuals', 'peak emotion']
      },
      resolution: {
        duration: 0.15,
        requirements: ['fade to calm', 'contemplative', 'low energy']
      }
    }
  },
  {
    id: 'happy',
    title: 'Happy',
    description: 'An uplifting and energetic story that celebrates joy and positivity, with bright visuals and dynamic movement throughout.',
    icon: 'Sun',
    color: '#F59E0B', // Amber
    emotionalArc: {
      start: 0.6,
      peak: 0.9,
      resolution: 0.8,
      points: [
        { time: 0, energy: 0.6 },
        { time: 0.2, energy: 0.7 },
        { time: 0.4, energy: 0.8 },
        { time: 0.6, energy: 0.9 },
        { time: 0.8, energy: 0.9 },
        { time: 1, energy: 0.8 }
      ]
    },
    visualRequirements: {
      preferredMotion: 'high',
      preferredColors: 'warm',
      preferredBrightness: 'bright',
      variety: 0.8
    },
    structure: {
      intro: {
        duration: 0.1,
        requirements: ['bright visuals', 'upbeat start', 'medium energy']
      },
      development: {
        duration: 0.4,
        requirements: ['increasing joy', 'dynamic movement', 'colorful']
      },
      climax: {
        duration: 0.35,
        requirements: ['peak happiness', 'maximum energy', 'celebration']
      },
      resolution: {
        duration: 0.15,
        requirements: ['sustained joy', 'satisfying conclusion', 'warm finale']
      }
    }
  },
  {
    id: 'slice-of-life',
    title: 'Slice of Life',
    description: 'A realistic and relatable narrative that captures authentic moments with natural pacing and genuine emotion.',
    icon: 'Coffee',
    color: '#10B981', // Emerald
    emotionalArc: {
      start: 0.5,
      peak: 0.7,
      resolution: 0.6,
      points: [
        { time: 0, energy: 0.5 },
        { time: 0.25, energy: 0.4 },
        { time: 0.5, energy: 0.6 },
        { time: 0.75, energy: 0.7 },
        { time: 1, energy: 0.6 }
      ]
    },
    visualRequirements: {
      preferredMotion: 'medium',
      preferredColors: 'muted',
      preferredBrightness: 'normal',
      variety: 0.9
    },
    structure: {
      intro: {
        duration: 0.2,
        requirements: ['natural setting', 'everyday moments', 'authentic feel']
      },
      development: {
        duration: 0.5,
        requirements: ['variety of scenes', 'human connection', 'real emotions']
      },
      climax: {
        duration: 0.2,
        requirements: ['meaningful moment', 'emotional peak', 'genuine connection']
      },
      resolution: {
        duration: 0.1,
        requirements: ['peaceful ending', 'reflection', 'life continues']
      }
    }
  }
];

export const getNarrativeById = (id: string): NarrativeArchetype | undefined => {
  return narrativeArchetypes.find(narrative => narrative.id === id);
};

export const recommendNarrative = (audioMood: any, videoFeatures: any): NarrativeArchetype => {
  // Simple recommendation logic based on audio and video characteristics
  const { valence, arousal } = audioMood;
  const avgBrightness = videoFeatures.brightness?.average || 0.5;
  const avgMotion = videoFeatures.motion?.intensity || 0.5;

  // Happy narrative for high valence and arousal
  if (valence > 0.6 && arousal > 0.6) {
    return narrativeArchetypes[1]; // Happy
  }
  
  // Tragic narrative for low valence and high arousal
  if (valence < 0.4 && arousal > 0.5) {
    return narrativeArchetypes[0]; // Tragic
  }
  
  // Slice of life for everything else
  return narrativeArchetypes[2]; // Slice of Life
};