import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Contrast, Sparkles, Check, 
  Copy, CheckSquare, Square, Loader2,
  Sliders, Eye, 
  SlidersHorizontal, StopCircle,
  Zap, Sun, Layers, ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { ScenePrompt } from './App';

export interface ContrastProfile {
  id: string;
  name: string;
  badge: string;
  description: string;
  lightingDirective: string;
  depthDirective: string;
  keywords: string[];
  previewAccent: string;
}

export const CONTRAST_PROFILES: ContrastProfile[] = [
  {
    id: 'chiaroscuro',
    name: 'Cinematic Chiaroscuro',
    badge: 'Stark 8:1 Ratio',
    description: 'Dramatic Caravaggio & Rembrandt lighting with deep velvety black shadows, hard directional key light, and high tonal tension.',
    lightingDirective: 'dramatic chiaroscuro lighting, stark 8:1 key-to-fill lighting ratio, deep velvety true blacks, hard directional illumination slicing across subject contours, Rembrandt facial shadow triangles, moody low-key negative fill',
    depthDirective: 'strong foreground shadow framing, high tonal separation between subject and pitch-black background, deep three-dimensional spatial sculpting',
    keywords: ['dramatic chiaroscuro', '8:1 lighting ratio', 'deep velvety blacks', 'hard directional key light', 'Rembrandt illumination', 'negative fill'],
    previewAccent: '#f59e0b'
  },
  {
    id: 'volumetric-godrays',
    name: 'Volumetric Rays & Depth',
    badge: '3D Spatial Rays',
    description: 'Pronounced atmospheric light shafts piercing through haze, distinct foreground-midground-background planes, and spatial occlusion.',
    lightingDirective: 'dense volumetric light shafts, piercing atmospheric god rays breaking through subtle haze, luminous specular dust motes catching beam highlights, strong directional sunbeams',
    depthDirective: 'pronounced foreground-midground-background depth separation, atmospheric aerial perspective with receding tonal falloff, foreground occlusion framing, immense dimensional depth',
    keywords: ['volumetric god rays', 'atmospheric light shafts', 'foreground-midground-background separation', 'aerial perspective', 'dimensional spatial depth'],
    previewAccent: '#06b6d4'
  },
  {
    id: 'hdr-specular',
    name: 'HDR Dynamic Drama',
    badge: 'Specular & Blacks',
    description: 'Piercing specular highlights, glinting edge reflections, deep uncrushed blacks, and high micro-contrast textural punch.',
    lightingDirective: 'wide dynamic range HDR, piercing specular highlights, glinting catchlights on eyes and edges, deep rich black levels with clean shadow roll-off, crisp tactile lighting',
    depthDirective: 'razor-sharp edge separation, micro-contrast pop between lit subject and dark environment, deep spatial relief, steep tonal falloff',
    keywords: ['wide dynamic range HDR', 'piercing specular highlights', 'deep rich black levels', 'micro-contrast punch', 'crisp edge separation'],
    previewAccent: '#ec4899'
  },
  {
    id: 'backlit-rim',
    name: 'Backlit Silhouette & Halo',
    badge: 'Luminous Rim',
    description: 'Powerful rear backlight casting a razor-sharp luminous halo rim around subject edges, setting silhouette figures against glowing atmosphere.',
    lightingDirective: 'powerful blinding backlight illumination, luminous razor-sharp specular rim lighting tracing hair and shoulders, glowing edge halo, dramatic silhouette contours against radiant background',
    depthDirective: 'extreme separation between glowing distant background and dark foreground subjects, steep dimensional rim gradient, optical light wrapping',
    keywords: ['luminous rim lighting', 'powerful backlight', 'silhouette contours', 'glowing edge halo', 'steep dimensional gradient'],
    previewAccent: '#8b5cf6'
  },
  {
    id: 'neo-noir-reflections',
    name: 'Neo-Noir Wet Reflections',
    badge: 'Glistening Noir',
    description: 'High-contrast night aesthetics with rain-slicked specular reflections, isolated pools of tungsten/neon light, and deep shadow envelopment.',
    lightingDirective: 'glistening wet reflective surfaces, isolated high-intensity light pools carving through pitch-black surroundings, hard shadow cutoffs, deep atmospheric noir gloom',
    depthDirective: 'reflective mirror puddles creating vertical spatial depth, deep layered city silhouettes, dark negative space framing illuminated subject',
    keywords: ['glistening wet reflections', 'isolated light pools', 'pitch-black negative fill', 'hard shadow cutoffs', 'vertical reflection depth'],
    previewAccent: '#10b981'
  },
  {
    id: 'anamorphic-bokeh',
    name: 'Anamorphic Dimensional Bokeh',
    badge: 'Shallow 3D Bokeh',
    description: 'Ultra-shallow depth of field, creamy elliptical anamorphic bokeh, horizontal streak flares, and razor-sharp focal subject isolation.',
    lightingDirective: 'cinematic anamorphic lighting, horizontal streak lens flares, localized high-key keylight on focal subject with rapid falloff into darkness',
    depthDirective: 'ultra-shallow depth of field, steep focal plane isolation, creamy dimensional foreground and background circular bokeh blur, three-dimensional subject pop',
    keywords: ['anamorphic depth of field', 'creamy dimensional bokeh', 'steep focal plane isolation', 'horizontal streak flare', 'subject 3D pop'],
    previewAccent: '#3b82f6'
  }
];

export interface BoostedSceneResult {
  sceneId: string;
  sceneIndex: number;
  originalImagePrompt: string;
  boostedImagePrompt: string;
  originalVideoPrompt?: string;
  boostedVideoPrompt?: string;
  originalContrastScore: 'flat' | 'moderate' | 'high';
  removedFlatTerms: string[];
  addedKeywords: string[];
  status: 'pending' | 'boosting' | 'completed' | 'error';
  errorMessage?: string;
}

// Flat / washed out words to detect and optionally clean
const FLAT_TERMS_REGEX = /\b(flat lighting|washed out|low contrast|soft diffused ambient light|even ambient light|evenly lit|overcast flat light|no shadows|shadowless|softbox diffused|dull lighting|pale flat lighting|flat textures?)\b/gi;

interface AIContrastBoosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyboard: ScenePrompt[] | null;
  onApplyBoost: (updatedStoryboard: ScenePrompt[], actionMessage: string) => void;
  onRequestAIGeneration?: (prompt: string, isJson: boolean) => Promise<string>;
  isAiConfigured?: boolean;
  initialFocusSceneIndex?: number | null;
}

export const AIContrastBoosterModal: React.FC<AIContrastBoosterModalProps> = ({
  isOpen,
  onClose,
  storyboard,
  onApplyBoost,
  onRequestAIGeneration,
  isAiConfigured = true,
  initialFocusSceneIndex = null
}) => {
  if (!isOpen || !storyboard || storyboard.length === 0) return null;

  // Selected scenes for batch contrast boosting
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(() => {
    if (initialFocusSceneIndex !== null && storyboard[initialFocusSceneIndex]) {
      return new Set([storyboard[initialFocusSceneIndex].id]);
    }
    const currentlySelected = storyboard.filter(s => s.isSelected).map(s => s.id);
    if (currentlySelected.length > 0) {
      return new Set(currentlySelected);
    }
    return new Set(storyboard.map(s => s.id));
  });

  // Active Contrast Profile
  const [selectedProfileId, setSelectedProfileId] = useState<string>('chiaroscuro');
  
  // Boost Intensity: 25% (Subtle), 50% (Balanced), 75% (Dramatic), 100% (Extreme)
  const [intensity, setIntensity] = useState<number>(50);

  // Depth and Contrast Levers
  const [enableDepthSeparation, setEnableDepthSeparation] = useState<boolean>(true);
  const [enableSpecularRims, setEnableSpecularRims] = useState<boolean>(true);
  const [enableAtmosphericVolumetrics, setEnableAtmosphericVolumetrics] = useState<boolean>(true);
  const [stripFlatPhrases, setStripFlatPhrases] = useState<boolean>(true);
  const [boostVideoPrompts, setBoostVideoPrompts] = useState<boolean>(false);

  // Processing mode: AI Contextual vs Instant Algorithmic
  const [boostEngine, setBoostEngine] = useState<'ai' | 'instant'>('ai');

  // UI Views: Config vs Preview/Diff
  const [activeView, setActiveView] = useState<'config' | 'preview'>('config');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<{ current: number; total: number; stage: string }>({
    current: 0,
    total: 0,
    stage: ''
  });
  const [boostedResults, setBoostedResults] = useState<Record<string, BoostedSceneResult>>({});
  const [copiedSceneId, setCopiedSceneId] = useState<string | null>(null);
  const stopRequestedRef = useRef<boolean>(false);

  // Active profile object
  const activeProfile = useMemo(() => {
    return CONTRAST_PROFILES.find(p => p.id === selectedProfileId) || CONTRAST_PROFILES[0];
  }, [selectedProfileId]);

  // Analyze contrast levels across all scenes
  const sceneAnalysis = useMemo(() => {
    const analysisMap: Record<string, { score: 'flat' | 'moderate' | 'high'; flatMatches: string[]; depthFound: boolean }> = {};
    storyboard.forEach(scene => {
      const prompt = (scene.imagePrompt || '').toLowerCase();
      const flatMatches = (scene.imagePrompt || '').match(FLAT_TERMS_REGEX) || [];
      const hasHighContrastKeywords = /chiaroscuro|deep shadow|true black|rim light|specular|volumetric|stark light|high contrast/i.test(prompt);
      const hasDepthKeywords = /foreground|background|bokeh|depth of field|atmospheric|distance|layers?/i.test(prompt);

      let score: 'flat' | 'moderate' | 'high' = 'moderate';
      if (flatMatches.length > 0 || (!hasHighContrastKeywords && !hasDepthKeywords)) {
        score = 'flat';
      } else if (hasHighContrastKeywords && hasDepthKeywords) {
        score = 'high';
      }
      analysisMap[scene.id] = { score, flatMatches: Array.from(new Set(flatMatches.map(m => m.toLowerCase()))), depthFound: hasDepthKeywords };
    });
    return analysisMap;
  }, [storyboard]);

  // Count how many selected scenes have flat/low contrast
  const selectedFlatCount = useMemo(() => {
    return Array.from(selectedSceneIds).filter(id => sceneAnalysis[id]?.score === 'flat').length;
  }, [selectedSceneIds, sceneAnalysis]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isProcessing]);

  // Toggle single scene
  const handleToggleScene = (id: string) => {
    setSelectedSceneIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedSceneIds(new Set(storyboard.map(s => s.id)));
  };

  const handleSelectFlatOnly = () => {
    const flatIds = storyboard.filter(s => sceneAnalysis[s.id]?.score === 'flat').map(s => s.id);
    setSelectedSceneIds(new Set(flatIds.length > 0 ? flatIds : storyboard.map(s => s.id)));
  };

  const handleDeselectAll = () => {
    setSelectedSceneIds(new Set());
  };

  // Helper: Algorithmic Instant Contrast Booster
  const generateInstantBoost = (
    originalPrompt: string, 
    profile: ContrastProfile, 
    intVal: number,
    stripFlat: boolean
  ): { boosted: string; removed: string[]; added: string[] } => {
    let cleanPrompt = originalPrompt;
    const removed: string[] = [];

    if (stripFlat) {
      const matches = cleanPrompt.match(FLAT_TERMS_REGEX);
      if (matches) {
        matches.forEach(m => {
          if (!removed.includes(m)) removed.push(m);
        });
        cleanPrompt = cleanPrompt.replace(FLAT_TERMS_REGEX, '').replace(/,\s*,/g, ',').trim();
      }
    }

    const added: string[] = [];
    const elements: string[] = [];

    // Lighting contrast
    if (intVal >= 75) {
      elements.push(profile.lightingDirective);
      added.push(...profile.keywords);
    } else if (intVal >= 50) {
      elements.push(profile.keywords.slice(0, 4).join(', '));
      added.push(...profile.keywords.slice(0, 4));
    } else {
      elements.push(profile.keywords.slice(0, 2).join(', '));
      added.push(...profile.keywords.slice(0, 2));
    }

    // Depth elements
    if (enableDepthSeparation) {
      if (intVal >= 75) {
        elements.push(profile.depthDirective);
      } else {
        elements.push('layered foreground-to-background spatial depth');
      }
      added.push('spatial depth separation');
    }

    if (enableSpecularRims) {
      elements.push('luminous specular rim lighting on subject edges');
      added.push('specular rim lighting');
    }

    if (enableAtmosphericVolumetrics && (profile.id === 'volumetric-godrays' || intVal >= 50)) {
      elements.push('subtle atmospheric depth particles and light shaft falloff');
      added.push('atmospheric volumetrics');
    }

    // Clean formatting and join
    const boostAddition = elements.filter(Boolean).join(', ');
    const finalPrompt = cleanPrompt.endsWith('.') 
      ? `${cleanPrompt} ${boostAddition}.` 
      : `${cleanPrompt}, ${boostAddition}`;

    return {
      boosted: finalPrompt,
      removed,
      added: Array.from(new Set(added))
    };
  };

  // Execute the Contrast Boosting Process
  const handleRunContrastBoost = async () => {
    if (selectedSceneIds.size === 0) return;
    setIsProcessing(true);
    stopRequestedRef.current = false;
    setActiveView('preview');

    const targetScenes = storyboard.filter(s => selectedSceneIds.has(s.id));
    const initialResults: Record<string, BoostedSceneResult> = {};

    targetScenes.forEach((scene) => {
      initialResults[scene.id] = {
        sceneId: scene.id,
        sceneIndex: storyboard.findIndex(s => s.id === scene.id),
        originalImagePrompt: scene.imagePrompt || '',
        boostedImagePrompt: '',
        originalVideoPrompt: scene.soraPrompt || scene.videoPrompts?.[0] || '',
        boostedVideoPrompt: '',
        originalContrastScore: sceneAnalysis[scene.id]?.score || 'moderate',
        removedFlatTerms: [],
        addedKeywords: [],
        status: 'pending'
      };
    });

    setBoostedResults(initialResults);

    // If using instant algorithmic mode or AI generation is not available
    if (boostEngine === 'instant' || !onRequestAIGeneration || !isAiConfigured) {
      targetScenes.forEach(scene => {
        const boostData = generateInstantBoost(
          scene.imagePrompt || '', 
          activeProfile, 
          intensity, 
          stripFlatPhrases
        );

        let boostedVid: string | undefined = undefined;
        if (boostVideoPrompts && (scene.soraPrompt || scene.videoPrompts?.[0])) {
          const originalVid = scene.soraPrompt || scene.videoPrompts?.[0] || '';
          const vidBoost = generateInstantBoost(originalVid, activeProfile, intensity, stripFlatPhrases);
          boostedVid = vidBoost.boosted;
        }

        initialResults[scene.id] = {
          ...initialResults[scene.id],
          boostedImagePrompt: boostData.boosted,
          boostedVideoPrompt: boostedVid,
          removedFlatTerms: boostData.removed,
          addedKeywords: boostData.added,
          status: 'completed'
        };
      });

      setBoostedResults({ ...initialResults });
      setIsProcessing(false);
      return;
    }

    // AI Deep Contextual Boost: Batch queries through active LLM
    try {
      const total = targetScenes.length;
      for (let i = 0; i < total; i++) {
        if (stopRequestedRef.current) break;

        const scene = targetScenes[i];
        const sceneIdx = storyboard.findIndex(s => s.id === scene.id);

        setProcessProgress({
          current: i + 1,
          total,
          stage: `Analyzing & boosting contrast for Scene #${sceneIdx + 1}...`
        });

        setBoostedResults(prev => ({
          ...prev,
          [scene.id]: {
            ...prev[scene.id],
            status: 'boosting'
          }
        }));

        const intensityLabel = intensity >= 75 ? 'Extreme dramatic chiaroscuro' : intensity >= 50 ? 'Strong cinematic contrast' : 'Balanced natural depth';

        const promptForAI = `You are a world-class cinematic lighting director and prompt engineer.
Analyze this scene from a music video storyboard and rewrite the image prompt to maximize dramatic visual contrast, depth, and specular dimensionality.

Current Scene #${sceneIdx + 1}:
Description: ${scene.description || 'Cinematic shot'}
Lyrics: "${scene.lyric || 'N/A'}"
Original Image Prompt: "${scene.imagePrompt || ''}"

Style & Contrast Directive:
- Profile: "${activeProfile.name}"
- Lighting Directive: "${activeProfile.lightingDirective}"
- Depth Directive: "${activeProfile.depthDirective}"
- Intensity Level: ${intensity}% (${intensityLabel})
${stripFlatPhrases ? '- CRITICAL: Remove all flat, washed-out, or diffused lighting phrases like "flat lighting", "soft ambient lighting", or "overcast even light".' : ''}
${enableSpecularRims ? '- Add crisp specular rim lighting and edge catchlights to carve characters/subjects out of the background.' : ''}
${enableDepthSeparation ? '- Emphasize clear layered planes: foreground framing, subject midground, and receding atmospheric background falloff.' : ''}
${enableAtmosphericVolumetrics ? '- Add atmospheric depth cues (e.g. volumetric dust motes, light rays, subtle haze) where appropriate.' : ''}
- PRESERVE: Keep all core subjects, character appearances, wardrobe, and action intact. Do not alter the narrative.

Return ONLY a JSON object in this exact format:
{
  "boostedImagePrompt": "the revised prompt with dramatic contrast and visual depth",
  "removedFlatTerms": ["list of flat or washed out words removed"],
  "addedKeywords": ["key contrast and depth phrases added"]
}`;

        try {
          const responseText = await onRequestAIGeneration(promptForAI, true);
          let parsed: any = null;
          try {
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(cleanJson);
          } catch {
            // Fallback to instant algorithm if JSON parse fails
            const fallback = generateInstantBoost(scene.imagePrompt || '', activeProfile, intensity, stripFlatPhrases);
            parsed = {
              boostedImagePrompt: fallback.boosted,
              removedFlatTerms: fallback.removed,
              addedKeywords: fallback.added
            };
          }

          let boostedVid: string | undefined = undefined;
          if (boostVideoPrompts && (scene.soraPrompt || scene.videoPrompts?.[0])) {
            const originalVid = scene.soraPrompt || scene.videoPrompts?.[0] || '';
            const vidFallback = generateInstantBoost(originalVid, activeProfile, intensity, stripFlatPhrases);
            boostedVid = vidFallback.boosted;
          }

          setBoostedResults(prev => ({
            ...prev,
            [scene.id]: {
              ...prev[scene.id],
              boostedImagePrompt: parsed.boostedImagePrompt || parsed.boosted_prompt || scene.imagePrompt,
              boostedVideoPrompt: boostedVid,
              removedFlatTerms: parsed.removedFlatTerms || [],
              addedKeywords: parsed.addedKeywords || activeProfile.keywords.slice(0, 3),
              status: 'completed'
            }
          }));
        } catch {
          // On API error, gracefully fall back to algorithmic boost
          const fallback = generateInstantBoost(scene.imagePrompt || '', activeProfile, intensity, stripFlatPhrases);
          setBoostedResults(prev => ({
            ...prev,
            [scene.id]: {
              ...prev[scene.id],
              boostedImagePrompt: fallback.boosted,
              removedFlatTerms: fallback.removed,
              addedKeywords: fallback.added,
              status: 'completed'
            }
          }));
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply Results to Storyboard
  const handleApplyToStoryboard = () => {
    const updated = storyboard.map(scene => {
      const result = boostedResults[scene.id];
      if (result && result.status === 'completed' && result.boostedImagePrompt) {
        const updatedScene: ScenePrompt = {
          ...scene,
          imagePrompt: result.boostedImagePrompt
        };

        if (boostVideoPrompts && result.boostedVideoPrompt) {
          if (updatedScene.soraPrompt) updatedScene.soraPrompt = result.boostedVideoPrompt;
          if (updatedScene.videoPrompts && updatedScene.videoPrompts.length > 0) {
            updatedScene.videoPrompts = updatedScene.videoPrompts.map((vp, i) => i === 0 ? result.boostedVideoPrompt! : vp);
          }
        }
        return updatedScene;
      }
      return scene;
    });

    const count = Object.values(boostedResults).filter(r => r.status === 'completed').length;
    onApplyBoost(
      updated, 
      `AI Contrast Booster: Enhanced dramatic contrast & visual depth across ${count} scene(s)!`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[102] bg-black/80 backdrop-blur-md flex justify-center items-center p-3 lg:p-6 animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-[#0f0f11] border border-indigo-500/30 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-black/60 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
              <Contrast size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  AI Contrast Booster
                </h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Visual Depth Engine
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Analyze scene prompts and automatically inject chiaroscuro lighting, deep shadows, specular highlights, and dimensional spatial depth.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="bg-black/60 p-1 rounded-xl border border-white/10 flex items-center text-xs">
              <button
                onClick={() => setActiveView('config')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${activeView === 'config' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                <Sliders size={13} />
                <span>Configure</span>
              </button>
              <button
                onClick={() => setActiveView('preview')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${activeView === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                <Eye size={13} />
                <span>Preview & Diff</span>
                {Object.keys(boostedResults).length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors ml-2"
              title="Close Contrast Booster (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeView === 'config' ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* LEFT COLUMN: SCENE SELECTION & ANALYSIS (4 COLS) */}
              <div className="lg:col-span-4 border-r border-white/10 bg-black/30 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} className="text-indigo-400" />
                      Target Scenes ({selectedSceneIds.size}/{storyboard.length})
                    </span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button onClick={handleSelectAll} className="text-indigo-400 hover:text-indigo-300 font-medium">All</button>
                      <span className="text-gray-600">•</span>
                      <button onClick={handleSelectFlatOnly} className="text-amber-400 hover:text-amber-300 font-medium" title="Select scenes detected with flat or low contrast">
                        Flat Only ({selectedFlatCount})
                      </button>
                      <span className="text-gray-600">•</span>
                      <button onClick={handleDeselectAll} className="text-gray-500 hover:text-gray-300 font-medium">None</button>
                    </div>
                  </div>

                  {selectedFlatCount > 0 && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2 mt-2">
                      <AlertTriangle size={13} className="shrink-0 text-amber-400" />
                      <span>{selectedFlatCount} scene(s) have low contrast or flat lighting keywords.</span>
                    </div>
                  )}
                </div>

                {/* SCENE LIST */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {storyboard.map((scene, idx) => {
                    const isSelected = selectedSceneIds.has(scene.id);
                    const analysis = sceneAnalysis[scene.id];
                    return (
                      <div
                        key={scene.id}
                        onClick={() => handleToggleScene(scene.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/20 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isSelected ? 'text-indigo-400' : 'text-gray-500'}`}>
                              {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                            </span>
                            <span className="text-xs font-bold text-white font-mono">
                              Scene #{idx + 1}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({scene.duration}s)
                            </span>
                          </div>

                          {/* Contrast Assessment Badge */}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            analysis?.score === 'flat'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : analysis?.score === 'high'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {analysis?.score === 'flat' ? 'Low / Flat' : analysis?.score === 'high' ? 'High Contrast' : 'Moderate'}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                          {scene.imagePrompt || scene.description || 'No prompt set'}
                        </p>

                        {analysis?.flatMatches && analysis.flatMatches.length > 0 && (
                          <div className="text-[10px] text-amber-400/90 flex items-center gap-1 font-mono">
                            <span className="text-amber-500/60">Flagged:</span>
                            <span className="truncate">{analysis.flatMatches.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: CONTRAST PROFILES & PARAMETERS (8 COLS) */}
              <div className="lg:col-span-8 flex flex-col overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* 1. SELECT CONTRAST PROFILE */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sun size={14} className="text-indigo-400" />
                      1. Contrast & Lighting Profile
                    </label>
                    <span className="text-[11px] text-gray-500">Choose the cinematic lighting model</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {CONTRAST_PROFILES.map(profile => {
                      const isActive = selectedProfileId === profile.id;
                      return (
                        <div
                          key={profile.id}
                          onClick={() => setSelectedProfileId(profile.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isActive
                              ? 'bg-indigo-900/30 border-indigo-400 shadow-md ring-1 ring-indigo-400/50'
                              : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-white tracking-wide">
                                {profile.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-white/10 text-gray-300">
                                {profile.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed mb-2">
                              {profile.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-white/5">
                            {profile.keywords.slice(0, 2).map((kw, i) => (
                              <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/20">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. INTENSITY SLIDER */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-indigo-400" />
                      2. Boost Intensity: <span className="text-indigo-400 font-mono font-bold text-sm">{intensity}%</span>
                    </label>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {intensity <= 25 ? 'Subtle Elevation' : intensity <= 50 ? 'Balanced Cinematic (Recommended)' : intensity <= 75 ? 'Dramatic Shadows & Highlights' : 'Extreme Chiaroscuro Dynamic Range'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="15"
                    max="100"
                    step="5"
                    value={intensity}
                    onChange={e => setIntensity(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                  />

                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>15% (Subtle)</span>
                    <span>50% (Balanced)</span>
                    <span>75% (Dramatic)</span>
                    <span>100% (Maximum)</span>
                  </div>
                </div>

                {/* 3. DEPTH LEVERS & OPTIONS */}
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Eye size={14} className="text-indigo-400" />
                    3. Visual Depth Levers & Keyword Cleaners
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-start gap-3 cursor-pointer select-none hover:border-white/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={enableDepthSeparation}
                        onChange={e => setEnableDepthSeparation(e.target.checked)}
                        className="mt-0.5 accent-indigo-500 rounded"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">Spatial Plane Separation</div>
                        <p className="text-[11px] text-gray-400 mt-0.5">Injects layered foreground framing, distinct midground focal subject, and receding background falloff.</p>
                      </div>
                    </label>

                    <label className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-start gap-3 cursor-pointer select-none hover:border-white/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={enableSpecularRims}
                        onChange={e => setEnableSpecularRims(e.target.checked)}
                        className="mt-0.5 accent-indigo-500 rounded"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">Specular Rim Light & Halos</div>
                        <p className="text-[11px] text-gray-400 mt-0.5">Carves edges with luminous hair catchlights and specular halos to pull figures from deep shadows.</p>
                      </div>
                    </label>

                    <label className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-start gap-3 cursor-pointer select-none hover:border-white/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={enableAtmosphericVolumetrics}
                        onChange={e => setEnableAtmosphericVolumetrics(e.target.checked)}
                        className="mt-0.5 accent-indigo-500 rounded"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">Atmospheric Volumetrics</div>
                        <p className="text-[11px] text-gray-400 mt-0.5">Adds air density cues: volumetric rays, dust motes in light shafts, and cinematic mist.</p>
                      </div>
                    </label>

                    <label className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-start gap-3 cursor-pointer select-none hover:border-white/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={stripFlatPhrases}
                        onChange={e => setStripFlatPhrases(e.target.checked)}
                        className="mt-0.5 accent-indigo-500 rounded"
                      />
                      <div>
                        <div className="text-xs font-bold text-amber-300">Cleanse Flat / Washed Out Words</div>
                        <p className="text-[11px] text-gray-400 mt-0.5">Removes conflicting phrases like "flat lighting", "soft ambient diffused", and "overcast even light".</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 4. ENGINE & VIDEO OPTIONS */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/20 to-purple-950/20 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                      <Zap size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Engine Mode:</span>
                        <div className="inline-flex bg-black/50 p-0.5 rounded-lg border border-white/10">
                          <button
                            onClick={() => setBoostEngine('ai')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${boostEngine === 'ai' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                          >
                            AI Deep Context
                          </button>
                          <button
                            onClick={() => setBoostEngine('instant')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${boostEngine === 'instant' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                          >
                            Instant Algorithmic
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {boostEngine === 'ai' ? 'AI analyzes scene narrative to intelligently rewrite contrast & depth.' : 'Instant zero-latency keyword injection with flat-phrase purging.'}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={boostVideoPrompts}
                      onChange={e => setBoostVideoPrompts(e.target.checked)}
                      className="accent-indigo-500 rounded"
                    />
                    <span>Also Boost Video Prompts</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW & DIFF VIEW */
            <div className="flex-1 flex flex-col overflow-hidden p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye size={16} className="text-indigo-400" />
                    Contrast Boosted Preview ({Object.keys(boostedResults).length} Scenes)
                  </h4>
                  <span className="text-xs text-gray-400">
                    Review side-by-side prompt changes before applying.
                  </span>
                </div>

                {isProcessing && (
                  <button
                    onClick={() => { stopRequestedRef.current = true; }}
                    className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <StopCircle size={14} />
                    <span>Stop Generation</span>
                  </button>
                )}
              </div>

              {/* LIVE PROGRESS STATUS */}
              {isProcessing && (
                <div className="mb-4 p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl flex items-center gap-3 animate-pulse">
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                  <div className="text-xs text-indigo-200">
                    <span className="font-bold">{processProgress.stage}</span> ({processProgress.current}/{processProgress.total})
                  </div>
                </div>
              )}

              {/* DIFF RESULTS LIST */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                {Object.keys(boostedResults).length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-gray-500 space-y-3">
                    <Contrast size={36} className="text-indigo-400/50 animate-pulse" />
                    <p className="text-sm text-gray-400">No previews generated yet.</p>
                    <button
                      onClick={handleRunContrastBoost}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      <span>Run Contrast Booster Now</span>
                    </button>
                  </div>
                ) : (
                  Object.values(boostedResults).map(res => {
                    return (
                      <div
                        key={res.sceneId}
                        className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">
                              Scene #{res.sceneIndex + 1}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                              res.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : res.status === 'boosting'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {res.status === 'completed' ? 'Boosted' : res.status === 'boosting' ? 'Processing...' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {res.removedFlatTerms.length > 0 && (
                              <span className="text-[10px] text-red-400 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded">
                                Purged {res.removedFlatTerms.length} flat phrase(s)
                              </span>
                            )}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(res.boostedImagePrompt);
                                setCopiedSceneId(res.sceneId);
                                setTimeout(() => setCopiedSceneId(null), 2000);
                              }}
                              className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                              title="Copy boosted prompt"
                            >
                              {copiedSceneId === res.sceneId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* BEFORE & AFTER DIFF */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* ORIGINAL */}
                          <div className="p-3 bg-black/50 rounded-lg border border-white/5 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Original Prompt</div>
                            <p className="text-gray-400 line-clamp-4 leading-relaxed font-mono text-[11px]">
                              {res.originalImagePrompt}
                            </p>
                          </div>

                          {/* BOOSTED */}
                          <div className="p-3 bg-indigo-950/20 rounded-lg border border-indigo-500/30 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center justify-between">
                              <span>Contrast Boosted Prompt</span>
                              <span className="text-emerald-400 font-mono text-[9px]">+Visual Depth</span>
                            </div>
                            <p className="text-gray-200 line-clamp-4 leading-relaxed font-mono text-[11px]">
                              {res.boostedImagePrompt || (res.status === 'boosting' ? 'Generating enhanced prompt...' : 'Awaiting boost')}
                            </p>
                          </div>
                        </div>

                        {/* ADDED KEYWORDS BADGES */}
                        {res.addedKeywords && res.addedKeywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Injected Depth:</span>
                            {res.addedKeywords.map((kw, i) => (
                              <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                                + {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Contrast size={14} className="text-indigo-400" />
            <span>Targeting <strong className="text-white">{selectedSceneIds.size}</strong> scene(s) with <strong className="text-indigo-300">{activeProfile.name}</strong> ({intensity}% intensity)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            {activeView === 'config' ? (
              <button
                onClick={handleRunContrastBoost}
                disabled={selectedSceneIds.size === 0 || isProcessing}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>Boost Contrast ({selectedSceneIds.size} Scenes)</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleApplyToStoryboard}
                disabled={Object.values(boostedResults).filter(r => r.status === 'completed').length === 0 || isProcessing}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Check size={14} />
                <span>Apply to Storyboard ({Object.values(boostedResults).filter(r => r.status === 'completed').length} Scenes)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
