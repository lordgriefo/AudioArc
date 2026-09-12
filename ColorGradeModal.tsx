import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Palette, Sparkles, Check, Undo, Wand2, RefreshCw, 
  Copy, CheckCircle2, 
  Film, Flame, Search, 
  CheckSquare, Square, Info, ShieldCheck, Loader2
} from 'lucide-react';
import { ScenePrompt } from './App';
import { 
  ColorGradeProfile, 
  ColorGradingRecommendation, 
  ProjectStyleAnalysis, 
  CINEMATIC_COLOR_PROFILES, 
  applyColorGradeToPrompt, 
  recommendColorGradeForScene,
  buildAIColorGradingPrompt 
} from './colorGradingEngine';

interface ColorGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyboard: ScenePrompt[] | null;
  selectedStyle: { id?: string; name: string; prompt?: string; desc?: string };
  selectedInfluences: any[];
  narrative?: string;
  onApplyPromptUpdate: (updatedStoryboard: ScenePrompt[], actionDescription: string) => void;
  onRequestAIGeneration?: (prompt: string, isJson: boolean) => Promise<string>;
  initialFocusSceneIndex?: number | null;
  isAiConfigured?: boolean;
}

export const ColorGradeModal: React.FC<ColorGradeModalProps> = ({
  isOpen,
  onClose,
  storyboard,
  selectedStyle,
  selectedInfluences,
  narrative,
  onApplyPromptUpdate,
  onRequestAIGeneration,
  initialFocusSceneIndex,
  isAiConfigured = true,
}) => {
  if (!isOpen || !storyboard || storyboard.length === 0) return null;

  // Active view tab: 'recommendations' | 'profiles-library'
  const [activeTab, setActiveTab] = useState<'recommendations' | 'profiles-library'>('recommendations');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());

  // Analysis and recommendations state
  const [recommendations, setRecommendations] = useState<Record<string, ColorGradingRecommendation>>({});
  const [projectAnalysis, setProjectAnalysis] = useState<ProjectStyleAnalysis | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  
  // History cache for instant Undo within modal
  const [originalPromptsCache, setOriginalPromptsCache] = useState<Record<string, string>>({});
  const [appliedSceneIds, setAppliedSceneIds] = useState<Set<string>>(new Set());
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Initialize algorithmic recommendations and cache original prompts
  useEffect(() => {
    if (!storyboard || storyboard.length === 0) return;

    const initialCache: Record<string, string> = {};
    const initialRecs: Record<string, ColorGradingRecommendation> = {};
    const initiallyApplied = new Set<string>();

    storyboard.forEach((scene, idx) => {
      initialCache[scene.id] = scene.imagePrompt;
      const rec = recommendColorGradeForScene(
        scene, 
        selectedStyle?.name || 'Cinematic', 
        selectedInfluences || [], 
        idx, 
        storyboard.length
      );
      initialRecs[scene.id] = rec;
      if (scene.imagePrompt.toLowerCase().includes('color grading:') || scene.imagePrompt.toLowerCase().includes('color grade:')) {
        initiallyApplied.add(scene.id);
      }
    });

    setOriginalPromptsCache(initialCache);
    setRecommendations(initialRecs);
    setAppliedSceneIds(initiallyApplied);

    // Provide default initial project analysis if not already set
    if (!projectAnalysis) {
      setProjectAnalysis({
        overallStyleName: selectedStyle?.name || 'Cinematic Modern',
        dominantMood: 'Cinematic Narrative Cohesion with Balanced Dynamic Lighting',
        primaryEmulation: CINEMATIC_COLOR_PROFILES[0].name,
        lightingPhilosophy: 'Contrast-driven key lights with atmospheric shadow tints to support each scene\'s emotional rhythm.',
        aestheticAdvice: 'Inject color grading clauses at the end of prompt descriptions to lock in tonal harmony without distorting character morphology.',
        globalPalette: CINEMATIC_COLOR_PROFILES[0].swatches,
        analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    // If a specific scene was targeted, focus on that scene, otherwise select all
    if (initialFocusSceneIndex !== null && initialFocusSceneIndex !== undefined && storyboard[initialFocusSceneIndex]) {
      setSelectedSceneIds(new Set([storyboard[initialFocusSceneIndex].id]));
    } else {
      setSelectedSceneIds(new Set(storyboard.map(s => s.id)));
    }
  }, [storyboard, selectedStyle, selectedInfluences, initialFocusSceneIndex]);

  // Run Deep AI Analysis using active AI connection
  const handleRunAIAnalysis = async () => {
    if (!storyboard || storyboard.length === 0) return;
    if (!onRequestAIGeneration) {
      handleRunInstantAnalysis();
      return;
    }

    setIsAnalyzingAI(true);
    setAnalysisProgress('Formulating prompt for Master DI Colorist AI...');

    try {
      const prompt = buildAIColorGradingPrompt(
        selectedStyle?.name || 'Cinematic',
        narrative || '',
        (selectedInfluences || []).map(i => i.name || String(i)),
        storyboard
      );

      setAnalysisProgress('Analyzing visual style, scene pacing, and lighting arcs...');
      const rawResponse = await onRequestAIGeneration(prompt, true);

      setAnalysisProgress('Parsing chromatic grading recommendations...');
      let parsedData: any = null;

      try {
        // Strip codeblocks if any
        const cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleanedJson);
      } catch (parseErr) {
        console.warn("Direct JSON parse failed, extracting via regex...", parseErr);
        const match = rawResponse.match(/\{[\s\S]*\}/);
        if (match) {
          parsedData = JSON.parse(match[0]);
        }
      }

      if (parsedData && parsedData.recommendations && Array.isArray(parsedData.recommendations)) {
        // Update Project Analysis
        if (parsedData.projectAnalysis) {
          setProjectAnalysis({
            overallStyleName: parsedData.projectAnalysis.overallStyleName || selectedStyle?.name || 'Cinematic',
            dominantMood: parsedData.projectAnalysis.dominantMood || 'Harmonic Cinematic Narrative',
            primaryEmulation: parsedData.projectAnalysis.primaryEmulation || 'Kodak Vision3 500T',
            lightingPhilosophy: parsedData.projectAnalysis.lightingPhilosophy || 'Motivated lighting with high shadow separation.',
            aestheticAdvice: parsedData.projectAnalysis.aestheticAdvice || 'Seamless additive prompt directives.',
            globalPalette: parsedData.projectAnalysis.globalPalette && parsedData.projectAnalysis.globalPalette.length > 0 
              ? parsedData.projectAnalysis.globalPalette 
              : CINEMATIC_COLOR_PROFILES[0].swatches,
            analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }

        // Map recommendations onto storyboard scenes
        const updatedRecs = { ...recommendations };
        parsedData.recommendations.forEach((recItem: any, idx: number) => {
          const targetScene = storyboard.find(s => s.id === recItem.sceneId) || storyboard[idx];
          if (!targetScene) return;

          const matchedProfile = CINEMATIC_COLOR_PROFILES.find(p => 
            p.name.toLowerCase().includes((recItem.filterName || '').toLowerCase()) ||
            (recItem.filterName || '').toLowerCase().includes(p.name.toLowerCase())
          ) || CINEMATIC_COLOR_PROFILES[0];

          const clause = recItem.colorGradingClause || matchedProfile.promptDirective;
          const updatedPrompt = applyColorGradeToPrompt(targetScene.imagePrompt, clause);

          updatedRecs[targetScene.id] = {
            sceneId: targetScene.id,
            sceneIndex: idx,
            sceneLyric: targetScene.lyric || 'Scene',
            filterId: matchedProfile.id,
            filterName: recItem.filterName || matchedProfile.name,
            category: recItem.category || matchedProfile.category,
            swatches: recItem.swatches && recItem.swatches.length > 0 ? recItem.swatches : matchedProfile.swatches,
            lightingSetup: recItem.lightingSetup || matchedProfile.lightingNote,
            colorTemperature: recItem.colorTemperature || matchedProfile.colorTemperature,
            contrastProfile: recItem.contrastProfile || matchedProfile.contrast,
            rationale: recItem.rationale || `Artistically paired with ${selectedStyle?.name} for narrative visual impact.`,
            colorGradingClause: clause,
            originalImagePrompt: originalPromptsCache[targetScene.id] || targetScene.imagePrompt,
            recommendedImagePrompt: updatedPrompt,
            isApplied: appliedSceneIds.has(targetScene.id)
          };
        });

        setRecommendations(updatedRecs);
        setAnalysisProgress('AI Color Grading complete!');
      } else {
        throw new Error("Invalid format returned by AI colorist model.");
      }
    } catch (err: any) {
      console.error("AI Color Grading failed, falling back to algorithmic engine:", err);
      handleRunInstantAnalysis();
    } finally {
      setIsAnalyzingAI(false);
      setTimeout(() => setAnalysisProgress(''), 3000);
    }
  };

  // Instant algorithmic analysis (guaranteed instant offline fallback)
  const handleRunInstantAnalysis = () => {
    if (!storyboard) return;
    const updatedRecs: Record<string, ColorGradingRecommendation> = {};
    storyboard.forEach((scene, idx) => {
      updatedRecs[scene.id] = recommendColorGradeForScene(
        scene, 
        selectedStyle?.name || 'Cinematic', 
        selectedInfluences || [], 
        idx, 
        storyboard.length
      );
    });
    setRecommendations(updatedRecs);
    setAnalysisProgress('Applied intelligent cinematography color grading rules.');
    setTimeout(() => setAnalysisProgress(''), 2500);
  };

  // Apply recommendation to a single scene
  const handleApplySingleScene = (sceneId: string) => {
    const rec = recommendations[sceneId];
    if (!rec || !storyboard) return;

    const newStoryboard = storyboard.map(s => {
      if (s.id === sceneId) {
        return {
          ...s,
          imagePrompt: rec.recommendedImagePrompt
        };
      }
      return s;
    });

    onApplyPromptUpdate(newStoryboard, `Applied ${rec.filterName} color grading to Scene ${rec.sceneIndex + 1}`);
    setAppliedSceneIds(prev => new Set([...prev, sceneId]));
  };

  // Revert a single scene back to its original prompt
  const handleRevertSingleScene = (sceneId: string) => {
    const original = originalPromptsCache[sceneId];
    if (!original || !storyboard) return;

    const newStoryboard = storyboard.map(s => {
      if (s.id === sceneId) {
        return {
          ...s,
          imagePrompt: original
        };
      }
      return s;
    });

    onApplyPromptUpdate(newStoryboard, `Reverted Scene image prompt`);
    setAppliedSceneIds(prev => {
      const next = new Set(prev);
      next.delete(sceneId);
      return next;
    });
  };

  // Batch apply all recommendations to all scenes
  const handleApplyAllRecommendations = () => {
    if (!storyboard) return;

    const newStoryboard = storyboard.map(s => {
      const rec = recommendations[s.id];
      if (rec) {
        return {
          ...s,
          imagePrompt: rec.recommendedImagePrompt
        };
      }
      return s;
    });

    onApplyPromptUpdate(newStoryboard, `Applied AI color grading filter recommendations to all ${storyboard.length} scenes`);
    setAppliedSceneIds(new Set(storyboard.map(s => s.id)));
  };

  // Batch apply recommendations only to checked scenes
  const handleApplySelectedScenes = () => {
    if (!storyboard || selectedSceneIds.size === 0) return;

    const newStoryboard = storyboard.map(s => {
      if (selectedSceneIds.has(s.id)) {
        const rec = recommendations[s.id];
        if (rec) {
          return {
            ...s,
            imagePrompt: rec.recommendedImagePrompt
          };
        }
      }
      return s;
    });

    onApplyPromptUpdate(newStoryboard, `Applied color grading recommendations to ${selectedSceneIds.size} selected scenes`);
    setAppliedSceneIds(prev => new Set([...prev, ...Array.from(selectedSceneIds)]));
  };

  // Revert all scenes to original image prompts
  const handleRevertAllScenes = () => {
    if (!storyboard) return;

    const newStoryboard = storyboard.map(s => {
      const orig = originalPromptsCache[s.id];
      if (orig) {
        return {
          ...s,
          imagePrompt: orig
        };
      }
      return s;
    });

    onApplyPromptUpdate(newStoryboard, `Reverted all scenes to original image prompts`);
    setAppliedSceneIds(new Set());
  };

  // Override a scene's recommended profile with a user-selected profile
  const handleSelectProfileForScene = (sceneId: string, profile: ColorGradeProfile) => {
    const scene = storyboard.find(s => s.id === sceneId);
    if (!scene) return;

    const updatedPrompt = applyColorGradeToPrompt(originalPromptsCache[sceneId] || scene.imagePrompt, profile.promptDirective);

    setRecommendations(prev => ({
      ...prev,
      [sceneId]: {
        ...prev[sceneId],
        filterId: profile.id,
        filterName: profile.name,
        category: profile.category,
        swatches: profile.swatches,
        lightingSetup: profile.lightingNote,
        colorTemperature: profile.colorTemperature,
        contrastProfile: profile.contrast,
        rationale: `Custom selected profile: ${profile.description}`,
        colorGradingClause: profile.promptDirective,
        recommendedImagePrompt: updatedPrompt
      }
    }));
  };

  // Apply a specific master profile to ALL scenes at once
  const handleApplyMasterProfileToAll = (profile: ColorGradeProfile) => {
    if (!storyboard) return;

    const updatedRecs = { ...recommendations };
    const newStoryboard = storyboard.map(s => {
      const origPrompt = originalPromptsCache[s.id] || s.imagePrompt;
      const updatedPrompt = applyColorGradeToPrompt(origPrompt, profile.promptDirective);

      if (updatedRecs[s.id]) {
        updatedRecs[s.id] = {
          ...updatedRecs[s.id],
          filterId: profile.id,
          filterName: profile.name,
          category: profile.category,
          swatches: profile.swatches,
          lightingSetup: profile.lightingNote,
          colorTemperature: profile.colorTemperature,
          contrastProfile: profile.contrast,
          colorGradingClause: profile.promptDirective,
          recommendedImagePrompt: updatedPrompt
        };
      }

      return {
        ...s,
        imagePrompt: updatedPrompt
      };
    });

    setRecommendations(updatedRecs);
    onApplyPromptUpdate(newStoryboard, `Applied ${profile.name} to all ${storyboard.length} scenes`);
    setAppliedSceneIds(new Set(storyboard.map(s => s.id)));
  };

  // Copy text helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Toggle selection
  const handleToggleSelectScene = (sceneId: string) => {
    setSelectedSceneIds(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedSceneIds.size === storyboard.length) {
      setSelectedSceneIds(new Set());
    } else {
      setSelectedSceneIds(new Set(storyboard.map(s => s.id)));
    }
  };

  // Filtered scenes list
  const filteredScenes = useMemo(() => {
    return storyboard.filter((scene, idx) => {
      const rec = recommendations[scene.id];
      const matchesSearch = 
        !searchQuery || 
        (scene.lyric && scene.lyric.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (scene.imagePrompt && scene.imagePrompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (rec && rec.filterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        `scene ${idx + 1}`.includes(searchQuery.toLowerCase());

      const matchesCategory = 
        categoryFilter === 'all' ||
        (rec && rec.category === categoryFilter);

      return matchesSearch && matchesCategory;
    });
  }, [storyboard, recommendations, searchQuery, categoryFilter]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div 
        className="bg-[#12141a] border border-white/10 rounded-2xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-950/20 via-blue-950/20 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-inner">
              <Palette size={22} className="text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  Storyboard Color Grading & Filter Studio
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/30">
                  Visual Style Analyzer
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Analyze overarching visual style and generate color grading filter recommendations for each scene's image prompt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Global Action & Sub-Navigation Bar */}
        <div className="px-5 py-3 border-b border-white/5 bg-[#161820] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'recommendations' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wand2 size={13} />
              Scene Recommendations ({storyboard.length})
            </button>
            <button
              onClick={() => setActiveTab('profiles-library')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'profiles-library' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Film size={13} />
              Film Stocks & LUT Library ({CINEMATIC_COLOR_PROFILES.length})
            </button>
          </div>

          {/* AI Analysis and Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRunAIAnalysis}
              disabled={isAnalyzingAI || !isAiConfigured}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              title={!isAiConfigured ? "Configure an AI Provider in Settings to run deep AI analysis" : "Run deep contextual AI analysis of storyboard narrative and style"}
            >
              {isAnalyzingAI ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Analyzing Style...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-yellow-300" />
                  <span>AI Analyze Visual Style</span>
                </>
              )}
            </button>

            <button
              onClick={handleRunInstantAnalysis}
              disabled={isAnalyzingAI}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-medium border border-white/10 transition-colors flex items-center gap-1.5"
              title="Quick re-calculate using cinematography color matching rules"
            >
              <RefreshCw size={12} />
              <span>Instant Recs</span>
            </button>

            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block"></div>

            <button
              onClick={handleApplyAllRecommendations}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              title="Upgrade all scene image prompts with recommended color grades"
            >
              <CheckCircle2 size={13} />
              <span>Apply to All Scenes ({storyboard.length})</span>
            </button>

            {selectedSceneIds.size > 0 && selectedSceneIds.size < storyboard.length && (
              <button
                onClick={handleApplySelectedScenes}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Apply to Selected ({selectedSceneIds.size})</span>
              </button>
            )}

            {appliedSceneIds.size > 0 && (
              <button
                onClick={handleRevertAllScenes}
                className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                title="Revert all scenes to original image prompts"
              >
                <Undo size={12} />
                <span>Revert All</span>
              </button>
            )}
          </div>
        </div>

        {/* Status / Feedback Banner */}
        {analysisProgress && (
          <div className="bg-purple-950/40 border-b border-purple-500/30 px-5 py-2 text-xs text-purple-200 flex items-center gap-2 flex-shrink-0">
            <Loader2 size={12} className="animate-spin text-purple-400" />
            <span>{analysisProgress}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          {/* Project Visual Style Analysis Summary Banner */}
          {projectAnalysis && (
            <div className="bg-[#181a24] border border-purple-500/20 rounded-xl p-4 sm:p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start relative z-10">
                <div className="lg:col-span-8 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-500/30">
                      Active Visual Style
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {projectAnalysis.overallStyleName}
                    </h3>
                    <span className="text-xs text-gray-500">|</span>
                    <span className="text-xs text-purple-300 font-medium">
                      Primary Look: {projectAnalysis.primaryEmulation}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    <strong className="text-purple-300">Dominant Mood & Tone:</strong> {projectAnalysis.dominantMood}
                  </p>

                  <p className="text-xs text-gray-400 leading-relaxed">
                    <strong className="text-gray-300">Lighting Philosophy:</strong> {projectAnalysis.lightingPhilosophy}
                  </p>

                  {projectAnalysis.aestheticAdvice && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-950/20 border border-amber-500/20 rounded-lg p-2 flex items-start gap-1.5 mt-1">
                      <Info size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{projectAnalysis.aestheticAdvice}</span>
                    </div>
                  )}
                </div>

                {/* Global Swatches */}
                <div className="lg:col-span-4 bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between h-full">
                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center justify-between">
                    <span>Harmonic Project Palette</span>
                    <span className="text-[9px] text-gray-500 font-mono">4-Point Grading</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {projectAnalysis.globalPalette.map((swatch, sIdx) => (
                      <div 
                        key={sIdx} 
                        className="group flex flex-col items-center gap-1 cursor-pointer"
                        onClick={() => handleCopy(swatch.hex, `Palette Hex ${swatch.hex}`)}
                        title={`Click to copy: ${swatch.name} (${swatch.hex})`}
                      >
                        <div 
                          className="w-full h-10 rounded-lg border border-white/10 shadow-inner group-hover:scale-105 transition-transform relative"
                          style={{ backgroundColor: swatch.hex }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 text-[9px] text-white font-mono rounded-lg transition-opacity">
                            <Copy size={10} />
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-400 truncate max-w-full">
                          {swatch.hex}
                        </span>
                        <span className="text-[8px] text-gray-500 uppercase tracking-tight">
                          {swatch.role}
                        </span>
                      </div>
                    ))}
                  </div>

                  {copySuccess && (
                    <div className="text-[10px] text-green-400 text-center mt-1 font-mono animate-in fade-in">
                      Copied {copySuccess}!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: SCENE RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {/* Filter and Selection Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161820] p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleToggleSelectAll}
                    className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white font-medium"
                  >
                    {selectedSceneIds.size === storyboard.length ? (
                      <CheckSquare size={14} className="text-purple-400" />
                    ) : (
                      <Square size={14} className="text-gray-500" />
                    )}
                    <span>Select All ({selectedSceneIds.size}/{storyboard.length})</span>
                  </button>

                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search lyric, prompt, or filter look..."
                      className="bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-gray-200 outline-none focus:border-purple-500/50 w-48 sm:w-64 placeholder-gray-600"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-gray-500 mr-1">Look:</span>
                    {['all', 'film-stock', 'blockbuster', 'vintage', 'noir', 'neon', 'moody', 'arthouse'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`text-[10px] px-2 py-0.5 rounded-full capitalize transition-colors ${
                          categoryFilter === cat 
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40 font-bold' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  Showing <strong className="text-white">{filteredScenes.length}</strong> of {storyboard.length} scenes
                </div>
              </div>

              {/* Scenes Cards Grid */}
              <div className="space-y-4">
                {filteredScenes.map((scene) => {
                  const sceneIndex = storyboard.findIndex(s => s.id === scene.id);
                  const rec = recommendations[scene.id];
                  const isApplied = appliedSceneIds.has(scene.id);
                  const isChecked = selectedSceneIds.has(scene.id);

                  if (!rec) return null;

                  return (
                    <div 
                      key={scene.id}
                      className={`bg-[#171922] border rounded-xl p-4 transition-all ${
                        isApplied 
                          ? 'border-emerald-500/30 shadow-sm shadow-emerald-500/5' 
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Left Side: Scene info, Swatches, Rationale */}
                        <div className="flex-1 space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelectScene(scene.id)}
                                className="accent-purple-500 rounded cursor-pointer"
                              />
                              <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                                SCENE {sceneIndex + 1}
                              </span>
                              <span className="text-[11px] text-gray-400 font-mono">
                                {scene.startTime || '0:00'} - {scene.endTime || '0:04'} ({scene.duration}s)
                              </span>
                              {scene.groupName && (
                                <span className="text-[10px] bg-white/5 text-gray-300 px-1.5 py-0.5 rounded">
                                  {scene.groupName}
                                </span>
                              )}
                            </div>

                            {/* Status Pill */}
                            <div className="flex items-center gap-2">
                              {isApplied ? (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check size={10} /> Grade Applied to Prompt
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 bg-black/40 border border-white/10 px-2 py-0.5 rounded-full">
                                  Ready to Apply
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Lyric Quote */}
                          <div className="text-xs text-gray-300 italic border-l-2 border-purple-500/40 pl-2 py-0.5">
                            "{scene.lyric || 'Instrumental Sequence'}"
                          </div>

                          {/* Recommended Filter Badge & Category */}
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-[10px] uppercase font-bold text-gray-400">
                              Recommended Look:
                            </span>
                            <span className="text-xs font-bold text-white bg-purple-900/40 border border-purple-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                              <Flame size={12} className="text-amber-400" />
                              {rec.filterName}
                            </span>
                            <span className="text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                              {rec.lightingSetup}
                            </span>
                          </div>

                          {/* Swatches & Artistic Rationale */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-black/30 p-2.5 rounded-lg border border-white/5">
                            <div className="sm:col-span-4 flex items-center gap-1.5">
                              {rec.swatches.map((swatch, sIdx) => (
                                <div key={sIdx} className="flex-1 flex flex-col items-center gap-0.5" title={`${swatch.name} (${swatch.hex})`}>
                                  <div 
                                    className="w-full h-6 rounded border border-white/10 shadow-sm"
                                    style={{ backgroundColor: swatch.hex }}
                                  />
                                  <span className="text-[8px] font-mono text-gray-400 truncate max-w-full">
                                    {swatch.hex}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="sm:col-span-8 text-[11px] text-gray-300 leading-snug">
                              <span className="text-purple-300 font-medium">Colorist Rationale: </span>
                              {rec.rationale}
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Quick Action & Profile Switcher */}
                        <div className="lg:w-48 flex flex-col gap-2 flex-shrink-0 pt-1">
                          {isApplied ? (
                            <button
                              onClick={() => handleRevertSingleScene(scene.id)}
                              className="w-full py-1.5 px-3 bg-red-950/30 hover:bg-red-900/50 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                              title="Revert to original prompt before grade was applied"
                            >
                              <Undo size={12} />
                              Revert Scene Prompt
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApplySingleScene(scene.id)}
                              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                            >
                              <Check size={13} />
                              Apply to Scene {sceneIndex + 1}
                            </button>
                          )}

                          {/* Quick Preset Override Dropdown */}
                          <div className="relative">
                            <label className="text-[9px] uppercase font-bold text-gray-500 block mb-0.5">
                              Override Look:
                            </label>
                            <select
                              value={rec.filterId}
                              onChange={(e) => {
                                const matched = CINEMATIC_COLOR_PROFILES.find(p => p.id === e.target.value);
                                if (matched) handleSelectProfileForScene(scene.id, matched);
                              }}
                              className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 outline-none hover:border-white/20 focus:border-purple-500/50"
                            >
                              {CINEMATIC_COLOR_PROFILES.map(prof => (
                                <option key={prof.id} value={prof.id}>
                                  {prof.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Prompt Diff / Comparison Accordion */}
                      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[9px] uppercase font-bold text-gray-500 mb-1 flex items-center justify-between">
                            <span>Current / Original Prompt</span>
                            <span className="text-[9px] text-gray-600 font-mono">{scene.imagePrompt.length} chars</span>
                          </div>
                          <div className="text-xs text-gray-400 bg-black/40 border border-white/5 rounded-lg p-2.5 max-h-24 overflow-y-auto custom-scrollbar font-mono leading-relaxed">
                            {originalPromptsCache[scene.id] || scene.imagePrompt}
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] uppercase font-bold text-purple-400 mb-1 flex items-center justify-between">
                            <span>Upgraded Prompt (With Color Grade)</span>
                            <button
                              onClick={() => handleCopy(rec.recommendedImagePrompt, `Scene ${sceneIndex + 1} Prompt`)}
                              className="text-[9px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono lowercase"
                            >
                              <Copy size={9} /> copy
                            </button>
                          </div>
                          <div className="text-xs text-gray-200 bg-purple-950/10 border border-purple-500/20 rounded-lg p-2.5 max-h-24 overflow-y-auto custom-scrollbar font-mono leading-relaxed">
                            <span>{originalPromptsCache[scene.id] || scene.imagePrompt}. </span>
                            <mark className="bg-purple-900/60 text-purple-200 px-1 py-0.5 rounded border border-purple-500/40">
                              {rec.colorGradingClause}
                            </mark>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FILM STOCKS & PROFILES LIBRARY */}
          {activeTab === 'profiles-library' && (
            <div className="space-y-4">
              <div className="bg-[#161820] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Curated Cinematic LUTs & Film Stocks
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Preview color chemistry, color temperature, dynamic range, and one-click apply across your storyboard.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CINEMATIC_COLOR_PROFILES.map((profile) => (
                  <div 
                    key={profile.id}
                    className="bg-[#171922] border border-white/10 hover:border-purple-500/40 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                            {profile.name}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
                            {profile.badge}
                          </span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
                          {profile.category}
                        </span>
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed">
                        {profile.description}
                      </p>

                      {/* Swatches Bar */}
                      <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-2 rounded-lg border border-white/5">
                        {profile.swatches.map((swatch, sIdx) => (
                          <div key={sIdx} className="flex flex-col items-center gap-0.5">
                            <div 
                              className="w-full h-7 rounded border border-white/10 shadow-inner"
                              style={{ backgroundColor: swatch.hex }}
                            />
                            <span className="text-[9px] font-mono text-gray-400">
                              {swatch.hex}
                            </span>
                            <span className="text-[8px] text-gray-500 uppercase">
                              {swatch.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1 text-[11px] text-gray-400 bg-black/20 p-2 rounded border border-white/5">
                        <div>
                          <strong className="text-gray-300">Color Temp: </strong> {profile.colorTemperature}
                        </div>
                        <div>
                          <strong className="text-gray-300">Contrast: </strong> {profile.contrast}
                        </div>
                        <div>
                          <strong className="text-gray-300">Grain / Texture: </strong> {profile.grain}
                        </div>
                      </div>

                      {/* Prompt Directive */}
                      <div className="text-[10px] text-purple-200/90 font-mono bg-purple-950/20 border border-purple-500/20 rounded p-2">
                        {profile.promptDirective}
                      </div>
                    </div>

                    {/* Master Action Button */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCopy(profile.promptDirective, profile.name)}
                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                      >
                        <Copy size={11} /> Copy Directive
                      </button>

                      <button
                        onClick={() => handleApplyMasterProfileToAll(profile)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                        title="Apply this exact color grade to every scene in the project"
                      >
                        <Wand2 size={12} />
                        Apply Look to All Scenes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#14161f] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Non-destructive updates with full Undo / Redo support (Ctrl+Z).</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
