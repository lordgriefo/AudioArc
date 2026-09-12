import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Sparkles, Wand2, Check, RefreshCw, 
  Copy, CheckCircle2, Film, Search, 
  CheckSquare, Square, ShieldCheck, Loader2,
  Sliders, Eye, Clapperboard,
  RotateCcw, SlidersHorizontal, Palette, StopCircle,
  Camera, Zap
} from 'lucide-react';
import { ScenePrompt } from './App';

export interface StyleRefinerPreset {
  id: string;
  name: string;
  category: 'noir' | 'vintage' | 'scifi' | 'arthouse' | 'moody';
  badge: string;
  description: string;
  directive: string;
  previewColor: string;
  keywords: string[];
}

export const CINEMATIC_STYLE_PRESETS: StyleRefinerPreset[] = [
  {
    id: 'film-noir',
    name: 'Dark Film Noir',
    category: 'noir',
    badge: 'Classic 1940s',
    description: 'High-contrast monochrome chiaroscuro, heavy Venetian blind shadow patterns, wet asphalt, rain-slicked city streets, and smoky tension.',
    directive: 'Transform into a dark film noir aesthetic: stark black and white chiaroscuro lighting, deep hard-edged shadows, dramatic Venetian blind light slicing across the frame, wet reflective surfaces, cigarette smoke haze, 1940s crime thriller atmosphere, high-contrast 35mm Tri-X film grain.',
    previewColor: '#1c1c1c',
    keywords: ['chiaroscuro', 'hard shadows', 'Venetian blind light', 'monochrome', 'rain-slicked', 'smoke haze', 'Tri-X 35mm']
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neo-Tokyo',
    category: 'scifi',
    badge: 'Sci-Fi Dystopia',
    description: 'Vibrant neon cyan, violet and hot magenta illumination against deep dystopian shadows, torrential rain, and volumetric reflections.',
    directive: 'Transform into a cyberpunk neo-Tokyo aesthetic: intense neon cyan and hot magenta backlighting, torrential rain with glistening puddles reflecting holographic signs, dense atmospheric smog, horizontal anamorphic blue lens flares, high-tech dystopian urban mood.',
    previewColor: '#06b6d4',
    keywords: ['neon illumination', 'anamorphic flare', 'rain reflections', 'volumetric smog', 'cyan and magenta', 'dystopian']
  },
  {
    id: 'vintage-16mm',
    name: '16mm Vintage Kodachrome',
    category: 'vintage',
    badge: '70s Cinema',
    description: 'Warm, organic 16mm celluloid film grain, rich saturated reds and golds, soft highlight halation, and nostalgic indie texture.',
    directive: 'Transform into an authentic 1970s 16mm celluloid aesthetic: rich Kodak Kodachrome color profile with saturated warm amber, golden ochre, and deep crimson, organic film grain, soft warm halation blooming around high-contrast light sources, gentle vignette, nostalgic documentary feel.',
    previewColor: '#d97706',
    keywords: ['16mm celluloid', 'Kodachrome', 'warm halation', 'organic film grain', 'amber glow', 'indie cinema']
  },
  {
    id: 'fincher-thriller',
    name: 'Fincher Industrial Thriller',
    category: 'moody',
    badge: 'Cold Suspense',
    description: 'David Fincher inspired cold olive-green and teal color grading, clinical fluorescent lighting, and low-key atmospheric tension.',
    directive: 'Transform into a David Fincher psychological thriller aesthetic: low-key clinical lighting with sickly olive-green and muted teal undertones, sterile fluorescent rim lights, deep muted blacks, razor-sharp textural contrast, suffocating suspenseful atmosphere.',
    previewColor: '#0f766e',
    keywords: ['olive-green tint', 'clinical fluorescent', 'low-key lighting', 'subdued teal', 'tense atmosphere', 'razor contrast']
  },
  {
    id: 'wes-anderson',
    name: 'Wes Anderson Pastel Symmetry',
    category: 'arthouse',
    badge: 'Whimsical Arthouse',
    description: 'Meticulous centered composition, soft pastel color palette of mustard yellow, powder blue and dusty pink with shadowless lighting.',
    directive: 'Transform into a signature Wes Anderson aesthetic: strict centered symmetrical framing, charming whimsical pastel color palette dominated by mustard yellow, soft dusty pink, and powder blue, diffused softbox lighting with virtually no harsh shadows, meticulous storybook framing.',
    previewColor: '#f59e0b',
    keywords: ['symmetrical framing', 'pastel color palette', 'mustard yellow', 'powder blue', 'diffused light', 'storybook charm']
  },
  {
    id: 'golden-hour-35mm',
    name: 'Dreamy 35mm Golden Hour',
    category: 'vintage',
    badge: 'Warm Ethereal',
    description: 'Luminous honey-gold sunlight, dreamy optical lens flares, warm edge rim lighting, and ethereal romantic haze.',
    directive: 'Transform into an ethereal golden hour 35mm aesthetic: radiant low-angle sunset illumination, luminous honeyed golden backlight creating glowing hair rim light, soft circular optical lens flares, warm atmospheric sun dust haze, shallow depth of field with creamy bokeh.',
    previewColor: '#f97316',
    keywords: ['golden hour', 'sun flare', 'backlight rim', 'honeyed warmth', 'shallow depth of field', 'creamy bokeh']
  },
  {
    id: 'blade-runner-sandstorm',
    name: 'Dystopian Amber Dust',
    category: 'scifi',
    badge: 'Villeneuve Scale',
    description: 'Denis Villeneuve brutalist sci-fi mood, dense monochromatic terracotta haze, silhouette figures, and atmospheric dust particulate.',
    directive: 'Transform into a Denis Villeneuve Blade Runner 2049 desert aesthetic: monochromatic deep terracotta and amber dust haze, stark silhouette figures backlit through dense particulate atmosphere, immense minimalist brutalist architecture, oppressive atmospheric scale.',
    previewColor: '#b45309',
    keywords: ['terracotta haze', 'monochromatic amber', 'dust particulate', 'silhouette figures', 'brutalist scale']
  },
  {
    id: 'gothic-candlelight',
    name: 'Gothic Baroque Candlelight',
    category: 'moody',
    badge: 'Rembrandt Chiaroscuro',
    description: 'Barry Lyndon inspired natural flickering beeswax candlelight, deep velvety black shadows, and painterly oil-painting warmth.',
    directive: 'Transform into an opulent Gothic Baroque aesthetic: authentic flickering candlelight key lighting with warm amber glows falling off rapidly into deep velvety shadows, rich oil-painting texture with burgundy and deep brass accents, painterly Rembrandt chiaroscuro.',
    previewColor: '#78350f',
    keywords: ['candlelight illumination', 'Rembrandt lighting', 'velvety shadows', 'painterly texture', 'amber glow']
  },
  {
    id: 'bleach-bypass-90s',
    name: '90s Bleach Bypass Grit',
    category: 'noir',
    badge: 'Industrial Grunge',
    description: 'Silver retention bleach bypass chemical processing, harsh silver specular highlights, desaturated gritty contrast, and raw documentary realism.',
    directive: 'Transform into a 1990s bleach bypass film processing aesthetic: high silver retention creating harsh silver specular highlights, crushed deep blacks, desaturated muted color palette with pale skin tones, raw industrial grit, high textural contrast.',
    previewColor: '#52525b',
    keywords: ['bleach bypass', 'silver retention', 'crushed blacks', 'desaturated tones', 'harsh contrast', 'industrial grit']
  },
  {
    id: 'technicolor-dream',
    name: 'Surrealist Technicolor Wash',
    category: 'arthouse',
    badge: 'Hypnotic Color',
    description: 'Hyper-saturated monochrome color washes (emerald, crimson, or cobalt), dramatic theatrical spotlighting, and dreamlike arthouse glamour.',
    directive: 'Transform into an arthouse surrealist Technicolor aesthetic: hyper-saturated monochromatic color wash with intense single-hue gel lighting, dramatic theatrical spotlights carving out subjects, dreamlike surreal mood, high-fashion editorial styling.',
    previewColor: '#ec4899',
    keywords: ['hyper-saturated', 'colored gel lighting', 'theatrical spotlight', 'surreal mood', 'editorial styling']
  }
];

export interface RefinedSceneResult {
  sceneId: string;
  sceneIndex: number;
  originalImagePrompt: string;
  refinedImagePrompt: string;
  originalVideoPrompt?: string;
  refinedVideoPrompt?: string;
  status: 'pending' | 'refining' | 'completed' | 'error';
  errorMessage?: string;
}

interface AIStyleRefinerModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyboard: ScenePrompt[] | null;
  onApplyRefinements: (updatedStoryboard: ScenePrompt[], actionMessage: string) => void;
  onRequestAIGeneration?: (prompt: string, isJson: boolean) => Promise<string>;
  isAiConfigured?: boolean;
}

export const AIStyleRefinerModal: React.FC<AIStyleRefinerModalProps> = ({
  isOpen,
  onClose,
  storyboard,
  onApplyRefinements,
  onRequestAIGeneration,
  isAiConfigured = true
}) => {
  if (!isOpen || !storyboard || storyboard.length === 0) return null;

  // Selected scenes for batch refinement
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(() => {
    // Default to scenes currently selected in storyboard, or all scenes if none are selected
    const currentlySelected = storyboard.filter(s => s.isSelected).map(s => s.id);
    if (currentlySelected.length > 0) {
      return new Set(currentlySelected);
    }
    return new Set(storyboard.map(s => s.id));
  });

  // Category filter for presets
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Preset & Custom Directive
  const [activePresetId, setActivePresetId] = useState<string>('film-noir');
  const [customDirective, setCustomDirective] = useState<string>(CINEMATIC_STYLE_PRESETS[0].directive);

  // Advanced Options
  const [harmonizeVideoPrompts, setHarmonizeVideoPrompts] = useState<boolean>(true);
  const [markForRegeneration, setMarkForRegeneration] = useState<boolean>(false);
  const [refinementMode, setRefinementMode] = useState<'ai_deep' | 'smart_append'>('ai_deep');

  // Execution & Preview State
  const [activeView, setActiveView] = useState<'config' | 'preview'>('config');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<{ current: number; total: number; stage: string }>({
    current: 0,
    total: 0,
    stage: ''
  });
  const [refinedResults, setRefinedResults] = useState<Record<string, RefinedSceneResult>>({});
  const [copiedSceneId, setCopiedSceneId] = useState<string | null>(null);
  const stopRequestedRef = useRef<boolean>(false);

  // Sync selected scenes if storyboard changes while modal is open
  useEffect(() => {
    if (storyboard && storyboard.length > 0 && selectedSceneIds.size === 0) {
      const currentlySelected = storyboard.filter(s => s.isSelected).map(s => s.id);
      if (currentlySelected.length > 0) {
        setSelectedSceneIds(new Set(currentlySelected));
      } else {
        setSelectedSceneIds(new Set(storyboard.map(s => s.id)));
      }
    }
  }, [storyboard]);

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

  // Select/Deselect handlers
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

  const handleDeselectAll = () => {
    setSelectedSceneIds(new Set());
  };

  const handleSelectGroup = (groupName: string) => {
    const idsInGroup = storyboard
      .filter(s => (s.groupName || 'Ungrouped') === groupName)
      .map(s => s.id);
    setSelectedSceneIds(new Set(idsInGroup));
  };

  // Distinct groups in current storyboard
  const sequenceGroups = useMemo(() => {
    const groups = new Set<string>();
    storyboard.forEach(s => {
      if (s.groupName) groups.add(s.groupName);
    });
    return Array.from(groups);
  }, [storyboard]);

  // Filtered Presets
  const filteredPresets = useMemo(() => {
    return CINEMATIC_STYLE_PRESETS.filter(preset => {
      const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || 
        preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Apply a preset to directive
  const handleSelectPreset = (preset: StyleRefinerPreset) => {
    setActivePresetId(preset.id);
    setCustomDirective(preset.directive);
  };

  // Quick smart append algorithm (instant without LLM)
  const generateInstantAppendPrompt = (originalPrompt: string, directiveText: string, keywords: string[]): string => {
    const cleanOriginal = originalPrompt.trim().replace(/[.,;]+$/, '');
    const cleanKeywords = keywords.join(', ');
    return `${cleanOriginal}. Cinematic Style Refinement: ${directiveText.split(':')[1]?.trim() || directiveText}. Visual tags: ${cleanKeywords}.`;
  };

  // Run AI Refinement
  const handleExecuteRefine = async () => {
    if (selectedSceneIds.size === 0) return;
    if (!customDirective.trim()) return;

    const selectedScenes = storyboard
      .map((scene, index) => ({ scene, index }))
      .filter(({ scene }) => selectedSceneIds.has(scene.id));

    if (selectedScenes.length === 0) return;

    setIsProcessing(true);
    stopRequestedRef.current = false;
    setActiveView('preview');

    // Initialize pending results
    const initialMap: Record<string, RefinedSceneResult> = {};
    selectedScenes.forEach(({ scene, index }) => {
      initialMap[scene.id] = {
        sceneId: scene.id,
        sceneIndex: index,
        originalImagePrompt: scene.imagePrompt,
        refinedImagePrompt: scene.imagePrompt,
        originalVideoPrompt: scene.videoPrompts?.[0] || scene.soraPrompt || '',
        refinedVideoPrompt: scene.videoPrompts?.[0] || scene.soraPrompt || '',
        status: 'pending'
      };
    });
    setRefinedResults(initialMap);

    const activePreset = CINEMATIC_STYLE_PRESETS.find(p => p.id === activePresetId);
    const keywords = activePreset?.keywords || ['cinematic lighting', 'cohesive color grading', 'atmospheric texture'];

    if (refinementMode === 'smart_append' || !onRequestAIGeneration || !isAiConfigured) {
      // Instant execution mode
      const updated = { ...initialMap };
      selectedScenes.forEach(({ scene }) => {
        const refinedImage = generateInstantAppendPrompt(scene.imagePrompt, customDirective, keywords);
        const refinedVideo = scene.videoPrompts?.[0] 
          ? `${scene.videoPrompts[0].trim().replace(/[.,;]+$/, '')}, maintaining ${activePreset?.name || 'cinematic'} lighting and color grade`
          : undefined;

        updated[scene.id] = {
          ...updated[scene.id],
          refinedImagePrompt: refinedImage,
          refinedVideoPrompt: refinedVideo,
          status: 'completed'
        };
      });
      setRefinedResults(updated);
      setIsProcessing(false);
      return;
    }

    // AI Deep Harmonization: Process in cohesive intelligent batches or sequential prompts
    try {
      const total = selectedScenes.length;
      let completed = 0;

      // Group scenes for unified multi-scene contextual refinement so the AI maintains perfect visual cohesion
      // Process in small batches of up to 4 scenes to ensure token reliability & cohesion
      const batchSize = 3;
      const batches: typeof selectedScenes[] = [];
      for (let i = 0; i < selectedScenes.length; i += batchSize) {
        batches.push(selectedScenes.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        if (stopRequestedRef.current) break;

        setProcessProgress({
          current: completed,
          total,
          stage: `Harmonizing scenes ${batch.map(b => b.index + 1).join(', ')} of ${total}...`
        });

        // Mark batch as refining
        setRefinedResults(prev => {
          const next = { ...prev };
          batch.forEach(b => {
            if (next[b.scene.id]) next[b.scene.id].status = 'refining';
          });
          return next;
        });

        const prompt = `You are a master cinematic film director, director of photography, and lighting gaffer.
Your task is to apply a UNIFIED, COHESIVE CINEMATIC FILTER to the following group of scenes from a music video storyboard.

CINEMATIC FILTER DIRECTIVE:
"${customDirective}"

REQUIREMENTS:
1. Rewrite each scene's Image Prompt to strictly embody the cinematic filter (lighting, color palette, camera lens, atmospheric texture, film stock).
2. PRESERVE the core subjects, characters, environment, actions, and narrative beat of each scene. Do NOT replace what is happening; transform HOW IT LOOKS cinematographically.
3. Ensure absolute stylistic consistency across all scenes in this sequence (matching color temperatures, identical film stock texture, consistent lighting philosophy).
${harmonizeVideoPrompts ? '4. Also provide a synchronized, refined video prompt with camera movement matching the aesthetic.' : ''}

SCENES TO REFINE:
${batch.map(b => `---
SCENE_ID: ${b.scene.id}
Scene #${b.index + 1} [${b.scene.groupName || 'Sequence'}]
Lyric: "${b.scene.lyric || 'Instrumental'}"
Original Image Prompt: "${b.scene.imagePrompt}"
Original Video Prompt: "${b.scene.videoPrompts?.[0] || b.scene.soraPrompt || ''}"
---`).join('\n')}

OUTPUT FORMAT:
Return strictly a valid JSON array of objects with keys:
- "sceneId": string (exact match to SCENE_ID)
- "refinedImagePrompt": string (the complete, cinema-grade expanded image prompt incorporating the filter)
- "refinedVideoPrompt": string (optional camera movement & motion prompt)

Output strictly the raw JSON array.`;

        try {
          const responseText = await onRequestAIGeneration(prompt, true);
          let parsed: Array<{ sceneId: string; refinedImagePrompt: string; refinedVideoPrompt?: string }> = [];

          try {
            const clean = responseText.replace(/```(json)?/g, '').replace(/```/g, '').trim();
            const jsonStart = clean.indexOf('[');
            const jsonEnd = clean.lastIndexOf(']');
            if (jsonStart !== -1 && jsonEnd !== -1) {
              parsed = JSON.parse(clean.substring(jsonStart, jsonEnd + 1));
            } else {
              parsed = JSON.parse(clean);
            }
          } catch (jsonErr) {
            console.warn("JSON parse fallback for batch refinement:", jsonErr);
          }

          setRefinedResults(prev => {
            const next = { ...prev };
            batch.forEach(b => {
              const matched = parsed.find(p => p.sceneId === b.scene.id);
              if (matched && matched.refinedImagePrompt) {
                next[b.scene.id] = {
                  ...next[b.scene.id],
                  refinedImagePrompt: matched.refinedImagePrompt.trim(),
                  refinedVideoPrompt: matched.refinedVideoPrompt?.trim() || next[b.scene.id].refinedVideoPrompt,
                  status: 'completed'
                };
              } else {
                // Fallback to smart append if individual parse missed
                next[b.scene.id] = {
                  ...next[b.scene.id],
                  refinedImagePrompt: generateInstantAppendPrompt(b.scene.imagePrompt, customDirective, keywords),
                  status: 'completed'
                };
              }
            });
            return next;
          });

          completed += batch.length;
        } catch (err: any) {
          console.error("Batch refinement error:", err);
          // Fallback batch to instant append
          setRefinedResults(prev => {
            const next = { ...prev };
            batch.forEach(b => {
              next[b.scene.id] = {
                ...next[b.scene.id],
                refinedImagePrompt: generateInstantAppendPrompt(b.scene.imagePrompt, customDirective, keywords),
                status: 'completed',
                errorMessage: 'Applied smart fallback format'
              };
            });
            return next;
          });
          completed += batch.length;
        }
      }
    } finally {
      setIsProcessing(false);
      setProcessProgress({ current: 0, total: 0, stage: '' });
    }
  };

  // Re-run refinement on a single scene
  const handleRegenerateSingleScene = async (sceneId: string) => {
    const sceneIndex = storyboard.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;
    const scene = storyboard[sceneIndex];

    setRefinedResults(prev => ({
      ...prev,
      [sceneId]: {
        ...prev[sceneId],
        status: 'refining'
      }
    }));

    const activePreset = CINEMATIC_STYLE_PRESETS.find(p => p.id === activePresetId);
    const keywords = activePreset?.keywords || ['cinematic lighting', 'cohesive color grading'];

    if (!onRequestAIGeneration || !isAiConfigured) {
      setRefinedResults(prev => ({
        ...prev,
        [sceneId]: {
          ...prev[sceneId],
          refinedImagePrompt: generateInstantAppendPrompt(scene.imagePrompt, customDirective, keywords),
          status: 'completed'
        }
      }));
      return;
    }

    try {
      const prompt = `You are an elite cinematic lighting gaffer and film director.
Refine this single scene prompt to embody this CINEMATIC FILTER:
"${customDirective}"

Scene Details:
Lyric: "${scene.lyric || 'Instrumental'}"
Original Prompt: "${scene.imagePrompt}"

Output strictly a single revised cinema-grade prompt without quotes or intro.`;

      const res = await onRequestAIGeneration(prompt, false);
      const cleaned = res.trim().replace(/^["']|["']$/g, '');

      setRefinedResults(prev => ({
        ...prev,
        [sceneId]: {
          ...prev[sceneId],
          refinedImagePrompt: cleaned || prev[sceneId].refinedImagePrompt,
          status: 'completed'
        }
      }));
    } catch (e: any) {
      setRefinedResults(prev => ({
        ...prev,
        [sceneId]: {
          ...prev[sceneId],
          refinedImagePrompt: generateInstantAppendPrompt(scene.imagePrompt, customDirective, keywords),
          status: 'completed',
          errorMessage: 'Used smart fallback'
        }
      }));
    }
  };

  // Apply changes to storyboard
  const handleApplyToStoryboard = () => {
    const updatedStoryboard = storyboard.map(scene => {
      const refined = refinedResults[scene.id];
      if (refined && refined.status === 'completed') {
        const nextScene = { ...scene, imagePrompt: refined.refinedImagePrompt };
        if (harmonizeVideoPrompts && refined.refinedVideoPrompt) {
          const currentVideos = [...(scene.videoPrompts || [])];
          if (currentVideos.length > 0) {
            currentVideos[0] = refined.refinedVideoPrompt;
          } else {
            currentVideos.push(refined.refinedVideoPrompt);
          }
          nextScene.videoPrompts = currentVideos;
        }
        if (markForRegeneration) {
          // Flag that user wants new image generated
          delete nextScene.generatedImage;
        }
        return nextScene;
      }
      return scene;
    });

    const activePreset = CINEMATIC_STYLE_PRESETS.find(p => p.id === activePresetId);
    const filterName = activePreset?.name || 'Custom Cinematic Filter';
    const count = Object.values(refinedResults).filter(r => r.status === 'completed').length;

    onApplyRefinements(
      updatedStoryboard, 
      `Applied '${filterName}' to ${count} scene prompt${count === 1 ? '' : 's'}!`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-center items-center p-3 sm:p-6 animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-[#121212] border border-amber-500/30 rounded-2xl w-full max-w-6xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-amber-950/30 via-black to-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white leading-tight brand-font">AI Style Refiner</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Cohesive Filter
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Apply a unified cinematic lighting scheme, film stock, and aesthetic filter across selected scene prompts simultaneously.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => setActiveView('config')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeView === 'config' ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                1. Configure Filter
              </button>
              <button
                onClick={() => setActiveView('preview')}
                disabled={Object.keys(refinedResults).length === 0}
                className={`px-3 py-1 rounded text-xs font-bold transition-all disabled:opacity-30 ${activeView === 'preview' ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                2. Review Diffs ({Object.keys(refinedResults).length})
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-2"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
          {activeView === 'config' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Scene Selector & Scope (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#181818] border border-white/10 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clapperboard size={16} className="text-amber-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Target Scenes ({selectedSceneIds.size}/{storyboard.length})
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={handleSelectAll} 
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 uppercase"
                      >
                        All
                      </button>
                      <button 
                        onClick={handleDeselectAll} 
                        className="text-[10px] font-bold text-gray-400 hover:text-white px-2 py-0.5 bg-white/5 rounded border border-white/10 uppercase"
                      >
                        None
                      </button>
                    </div>
                  </div>

                  {/* Sequence Group Quick Filter */}
                  {sequenceGroups.length > 0 && (
                    <div className="mb-3 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Groups:</span>
                      {sequenceGroups.map(group => (
                        <button
                          key={group}
                          onClick={() => handleSelectGroup(group)}
                          className="text-[10px] px-2 py-0.5 bg-blue-900/20 text-blue-300 hover:bg-blue-900/40 rounded border border-blue-500/30 transition-colors"
                        >
                          {group}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Scrollable Scene Checklist */}
                  <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {storyboard.map((scene, idx) => {
                      const isChecked = selectedSceneIds.has(scene.id);
                      return (
                        <div
                          key={scene.id}
                          onClick={() => handleToggleScene(scene.id)}
                          className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                            isChecked 
                              ? 'bg-amber-950/20 border-amber-500/40 text-white' 
                              : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <div className="shrink-0 text-amber-400">
                            {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-gray-600" />}
                          </div>

                          {/* Thumbnail */}
                          <div className="w-12 h-9 bg-black/60 rounded overflow-hidden border border-white/10 shrink-0 flex items-center justify-center relative">
                            {scene.generatedImage ? (
                              <img src={scene.generatedImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Camera size={14} className="text-gray-600" />
                            )}
                            <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono bg-black/80 px-0.5 rounded text-gray-300">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-gray-200">Scene {idx + 1}</span>
                              {scene.groupName && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-white/5 text-gray-400 rounded border border-white/10 uppercase">
                                  {scene.groupName}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate italic">
                              "{scene.lyric || scene.description || scene.imagePrompt.substring(0, 40)}"
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scope & Execution Options */}
                <div className="bg-[#181818] border border-white/10 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Sliders size={14} className="text-amber-400" />
                    Refinement Mode & Settings
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRefinementMode('ai_deep')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        refinementMode === 'ai_deep' 
                          ? 'bg-amber-950/40 border-amber-500/50 text-white' 
                          : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-0.5">
                        <Wand2 size={13} />
                        <span>AI Harmonize</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight">
                        Deep context rewrite preserving action & character while unifying style.
                      </p>
                    </button>

                    <button
                      onClick={() => setRefinementMode('smart_append')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        refinementMode === 'smart_append' 
                          ? 'bg-amber-950/40 border-amber-500/50 text-white' 
                          : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-0.5">
                        <Zap size={13} />
                        <span>Instant Filter</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight">
                        Zero-latency smart keyword infusion appended across all prompts.
                      </p>
                    </button>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 select-none">
                      <input
                        type="checkbox"
                        checked={harmonizeVideoPrompts}
                        onChange={e => setHarmonizeVideoPrompts(e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      <span>Harmonize motion & video prompts (Veo / Sora)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 select-none">
                      <input
                        type="checkbox"
                        checked={markForRegeneration}
                        onChange={e => setMarkForRegeneration(e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      <span>Clear existing preview image to prompt re-render</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Filter Directives & Presets Library (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Directive Textarea */}
                <div className="bg-[#181818] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Palette size={14} className="text-amber-400" />
                      Cinematic Directive (Natural Language Filter)
                    </label>
                    <span className="text-[10px] text-gray-400">
                      Edit or choose a preset below
                    </span>
                  </div>

                  <textarea
                    value={customDirective}
                    onChange={e => setCustomDirective(e.target.value)}
                    placeholder="e.g., 'Make all selected scenes dark film noir with harsh Venetian blind shadows, wet asphalt reflections, and high-contrast 35mm Tri-X monochrome film grain...'"
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-gray-200 outline-none focus:border-amber-500/50 transition-colors h-28 resize-none font-mono leading-relaxed"
                  />

                  {/* Active Preset Keywords */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Key Elements:</span>
                    {CINEMATIC_STYLE_PRESETS.find(p => p.id === activePresetId)?.keywords.map(kw => (
                      <span key={kw} className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preset Filters Library */}
                <div className="bg-[#181818] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={14} className="text-amber-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">Cinematic Filter Presets</h4>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {(['all', 'noir', 'vintage', 'scifi', 'arthouse', 'moody'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`text-[10px] px-2 py-0.5 rounded-full capitalize transition-colors ${
                            selectedCategory === cat 
                              ? 'bg-amber-500 text-black font-bold' 
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search filter */}
                  <div className="relative mb-3">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search filters by keyword (e.g. noir, grain, neon, 16mm, Wes Anderson)..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-500/40"
                    />
                  </div>

                  {/* Presets Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {filteredPresets.map(preset => {
                      const isSelected = activePresetId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between relative group ${
                            isSelected 
                              ? 'bg-amber-950/30 border-amber-500/60 shadow-md ring-1 ring-amber-500/30' 
                              : 'bg-black/40 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                                {preset.name}
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10 uppercase">
                                {preset.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 line-clamp-2 leading-snug">
                              {preset.description}
                            </p>
                          </div>

                          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                              {isSelected ? '✓ Loaded into filter' : 'Click to load'}
                            </span>
                            <div 
                              className="w-3 h-3 rounded-full border border-white/20" 
                              style={{ backgroundColor: preset.previewColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleExecuteRefine}
                    disabled={selectedSceneIds.size === 0 || !customDirective.trim() || isProcessing}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Harmonizing {selectedSceneIds.size} Scenes...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>
                          Refine {selectedSceneIds.size} Selected Scene{selectedSceneIds.size === 1 ? '' : 's'} with Cohesive Style
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Review Diffs View */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Prompt Refinement Comparison ({Object.values(refinedResults).filter(r => r.status === 'completed').length}/{Object.keys(refinedResults).length} Completed)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isProcessing && (
                    <button
                      onClick={() => { stopRequestedRef.current = true; }}
                      className="px-3 py-1 bg-red-900/40 text-red-300 border border-red-500/50 rounded-lg text-xs font-bold hover:bg-red-900/60 flex items-center gap-1.5"
                    >
                      <StopCircle size={14} />
                      Stop AI
                    </button>
                  )}
                  <button
                    onClick={() => setActiveView('config')}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-lg border border-white/10 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    Adjust Filter & Re-run
                  </button>
                </div>
              </div>

              {/* Progress Banner */}
              {isProcessing && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                  <Loader2 size={16} className="animate-spin text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-300">{processProgress.stage || 'Refining prompts...'}</p>
                    <p className="text-[10px] text-gray-400">Balancing visual descriptors, lighting keys, and narrative preservation.</p>
                  </div>
                </div>
              )}

              {/* Diffs List */}
              <div className="space-y-4">
                {Object.values(refinedResults).map(res => {
                  const scene = storyboard[res.sceneIndex];
                  return (
                    <div 
                      key={res.sceneId} 
                      className="bg-[#181818] border border-white/10 rounded-xl p-4 shadow-sm space-y-3"
                    >
                      {/* Scene Header */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold font-mono bg-white/5 px-2 py-0.5 rounded text-amber-300 border border-amber-500/20">
                            Scene {res.sceneIndex + 1}
                          </span>
                          {scene?.groupName && (
                            <span className="text-[10px] font-bold text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded uppercase">
                              {scene.groupName}
                            </span>
                          )}
                          <span className="text-xs italic text-gray-400 truncate max-w-md">
                            "{scene?.lyric || 'Instrumental beat'}"
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRegenerateSingleScene(res.sceneId)}
                            disabled={res.status === 'refining'}
                            className="text-[10px] px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded border border-white/10 flex items-center gap-1 transition-colors"
                            title="Regenerate this scene prompt"
                          >
                            <RefreshCw size={10} className={res.status === 'refining' ? 'animate-spin' : ''} />
                            Retry Scene
                          </button>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(res.refinedImagePrompt);
                              setCopiedSceneId(res.sceneId);
                              setTimeout(() => setCopiedSceneId(null), 2000);
                            }}
                            className="text-[10px] px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded border border-white/10 flex items-center gap-1 transition-colors"
                          >
                            {copiedSceneId === res.sceneId ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                            {copiedSceneId === res.sceneId ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      {/* Side by Side Diff Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Original */}
                        <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                              Original Image Prompt
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 font-mono leading-relaxed select-text">
                            {res.originalImagePrompt}
                          </p>
                        </div>

                        {/* Refined (Editable) */}
                        <div className="bg-amber-950/10 border border-amber-500/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                              <Sparkles size={11} />
                              Refined Image Prompt (Click to edit)
                            </span>
                            {res.status === 'completed' && (
                              <span className="text-[9px] text-green-400 font-bold flex items-center gap-0.5">
                                <CheckCircle2 size={10} /> Ready
                              </span>
                            )}
                          </div>
                          <textarea
                            value={res.refinedImagePrompt}
                            onChange={e => {
                              const val = e.target.value;
                              setRefinedResults(prev => ({
                                ...prev,
                                [res.sceneId]: {
                                  ...prev[res.sceneId],
                                  refinedImagePrompt: val
                                }
                              }));
                            }}
                            className="w-full bg-black/40 border border-amber-500/20 rounded p-2 text-xs text-gray-200 font-mono leading-relaxed outline-none focus:border-amber-500/60 h-24 resize-none transition-colors"
                          />
                        </div>
                      </div>

                      {/* Video Prompt Harmonization if enabled */}
                      {harmonizeVideoPrompts && res.refinedVideoPrompt && (
                        <div className="bg-black/20 border border-white/5 rounded-lg p-2.5 flex items-center gap-2">
                          <Film size={13} className="text-purple-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] uppercase font-bold text-purple-400 mr-2">Harmonized Motion:</span>
                            <span className="text-xs text-gray-300 font-mono">{res.refinedVideoPrompt}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/60 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Full undo history supported. Original prompts are preserved in project history.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl border border-white/10 transition-colors"
            >
              Cancel
            </button>

            {activeView === 'config' ? (
              <button
                onClick={handleExecuteRefine}
                disabled={selectedSceneIds.size === 0 || !customDirective.trim() || isProcessing}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-900/40 transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                <Sparkles size={14} />
                <span>Refine Prompts ({selectedSceneIds.size} Scenes)</span>
              </button>
            ) : (
              <button
                onClick={handleApplyToStoryboard}
                disabled={Object.keys(refinedResults).length === 0}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/40 transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                <Check size={14} />
                <span>
                  Apply to {Object.values(refinedResults).filter(r => r.status === 'completed').length} Scenes
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
