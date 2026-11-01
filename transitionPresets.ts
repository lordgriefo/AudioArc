import { ScenePrompt } from './App';

export interface TransitionPreset {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  transitionIn: string; // 'none' | 'fade' | 'dissolve' | 'zoom-in' | 'slide-left' | 'slide-right' | 'glitch' | 'flash-white' | 'dip-to-black' | 'cross-blur' | 'whip-pan'
  transitionOut: string;
  category: 'cinematic' | 'fast-paced' | 'dramatic' | 'experimental' | 'custom';
  color: string;
  isBuiltin?: boolean;
  createdAt?: number;
}

export const BUILTIN_TRANSITION_PRESETS: TransitionPreset[] = [
  {
    id: 'preset-3s-smooth-fade',
    name: '3s Smooth Fade',
    description: 'Slow, atmospheric fade for emotional pacing, mood development, or opening/closing scenes.',
    duration: 3.0,
    transitionIn: 'fade',
    transitionOut: 'fade',
    category: 'cinematic',
    color: '#06b6d4', // cyan
    isBuiltin: true
  },
  {
    id: 'preset-05s-sharp-cut',
    name: '0.5s Sharp Cut',
    description: 'Crisp, punchy instantaneous cut for high-energy music videos, action beats, and rapid rhythm.',
    duration: 0.5,
    transitionIn: 'none',
    transitionOut: 'none',
    category: 'fast-paced',
    color: '#f43f5e', // rose
    isBuiltin: true
  },
  {
    id: 'preset-15s-dream-dissolve',
    name: '1.5s Dream Dissolve',
    description: 'Soft lyrical cross-dissolve seamlessly blending visual motifs across narrative phrases.',
    duration: 1.5,
    transitionIn: 'dissolve',
    transitionOut: 'dissolve',
    category: 'cinematic',
    color: '#a855f7', // purple
    isBuiltin: true
  },
  {
    id: 'preset-08s-whip-pan',
    name: '0.8s High-Speed Whip Pan',
    description: 'Rapid kinetic camera motion whipping through horizontal space into the next composition.',
    duration: 0.8,
    transitionIn: 'slide-left',
    transitionOut: 'slide-right',
    category: 'fast-paced',
    color: '#f59e0b', // amber
    isBuiltin: true
  },
  {
    id: 'preset-12s-dip-black',
    name: '1.2s Dramatic Dip to Black',
    description: 'Theatrical cinematic fade to total blackness, emphasizing verse or chapter transitions.',
    duration: 1.2,
    transitionIn: 'fade',
    transitionOut: 'dip-to-black',
    category: 'dramatic',
    color: '#6366f1', // indigo
    isBuiltin: true
  },
  {
    id: 'preset-03s-strobe-flash',
    name: '0.3s Strobe White Flash',
    description: 'Blinding white optical flash accentuating heavy snare hits, explosive bass drops, or sudden revelations.',
    duration: 0.3,
    transitionIn: 'flash-white',
    transitionOut: 'flash-white',
    category: 'fast-paced',
    color: '#ec4899', // pink
    isBuiltin: true
  },
  {
    id: 'preset-20s-zoom-rush',
    name: '2.0s Cinematic Zoom Rush',
    description: 'Immersive focal push pulling the audience deep into the emotional core of the shot.',
    duration: 2.0,
    transitionIn: 'zoom-in',
    transitionOut: 'fade',
    category: 'dramatic',
    color: '#10b981', // emerald
    isBuiltin: true
  },
  {
    id: 'preset-06s-cyber-glitch',
    name: '0.6s Cyber Glitch Shift',
    description: 'Digital chromatic glitch disruption tailored for electronic beats and futuristic narratives.',
    duration: 0.6,
    transitionIn: 'glitch',
    transitionOut: 'glitch',
    category: 'experimental',
    color: '#14b8a6', // teal
    isBuiltin: true
  },
  {
    id: 'preset-10s-cross-blur',
    name: '1.0s Cross-Blur Defocus',
    description: 'Dreamy optical lens blur transition smoothly fading between memory sequences or reflective moments.',
    duration: 1.0,
    transitionIn: 'cross-blur',
    transitionOut: 'cross-blur',
    category: 'cinematic',
    color: '#3b82f6', // blue
    isBuiltin: true
  }
];

const STORAGE_KEY = 'audioarc_transition_presets_custom';

export function loadTransitionPresets(): TransitionPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return BUILTIN_TRANSITION_PRESETS;
    const custom: TransitionPreset[] = JSON.parse(raw);
    return [...BUILTIN_TRANSITION_PRESETS, ...custom];
  } catch (err) {
    console.error('Failed to parse custom transition presets:', err);
    return BUILTIN_TRANSITION_PRESETS;
  }
}

export function saveCustomTransitionPreset(
  preset: Omit<TransitionPreset, 'id' | 'isBuiltin' | 'createdAt'>
): TransitionPreset {
  const newPreset: TransitionPreset = {
    ...preset,
    id: `custom-trans-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    isBuiltin: false,
    createdAt: Date.now()
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: TransitionPreset[] = raw ? JSON.parse(raw) : [];
    existing.unshift(newPreset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save custom transition preset:', err);
  }

  return newPreset;
}

export function deleteCustomTransitionPreset(id: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const existing: TransitionPreset[] = JSON.parse(raw);
    const filtered = existing.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete custom transition preset:', err);
  }
}

export function applyTransitionPresetToScenes(
  storyboard: ScenePrompt[],
  preset: TransitionPreset,
  targetMode: 'selected' | 'current' | 'all',
  activeSceneIndex: number = 0
): { updatedStoryboard: ScenePrompt[]; affectedCount: number } {
  let affectedCount = 0;
  const updatedStoryboard = storyboard.map((scene, idx) => {
    let shouldApply = false;

    if (targetMode === 'selected') {
      shouldApply = !!scene.isSelected;
    } else if (targetMode === 'current') {
      shouldApply = idx === activeSceneIndex;
    } else if (targetMode === 'all') {
      shouldApply = true;
    }

    if (!shouldApply) return scene;

    affectedCount++;
    return {
      ...scene,
      transitionIn: preset.transitionIn,
      transitionOut: preset.transitionOut,
      transitionDuration: preset.duration
    };
  });

  return { updatedStoryboard, affectedCount };
}
