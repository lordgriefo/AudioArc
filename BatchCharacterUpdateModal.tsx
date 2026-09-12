import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, UserCheck, Users, Sparkles, Wand2, CheckSquare, Square, 
  Layers, Check, AlertCircle, 
  Loader2, ShieldCheck, Film, Image as ImageIcon, 
  Video, StopCircle, Sliders, CheckCircle2, Mic
} from 'lucide-react';
import { VisualReference, ScenePrompt } from './App';

export interface BatchCharacterUpdateConfig {
  targetMode: 'existing' | 'custom';
  sourceRefId?: string;
  characterName: string;
  characterDescription: string;
  previousDescription?: string;
  selectedSceneIds: string[];
  adaptImagePrompts: boolean;
  adaptVideoPrompts: boolean;
  adaptSoraPrompts: boolean;
  adaptSceneDescription: boolean;
  adaptVoiceoverLipSync: boolean;
  preservationStyle: 'strict' | 'environmental';
  syncWithLibrary: boolean;
  linkRefToScenes: boolean;
  clearGeneratedImages: boolean;
}

export interface BatchCharacterProgress {
  current: number;
  total: number;
  currentSceneNumber: number;
  currentSceneLyric: string;
  originalImagePrompt?: string;
  adaptedImagePrompt?: string;
  status: 'processing' | 'completed' | 'failed' | 'stopped';
  successCount: number;
  failedCount: number;
}

interface BatchCharacterUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  visualRefs: VisualReference[];
  storyboard: ScenePrompt[] | null;
  initialSelectedRefId?: string | null;
  onExecuteBatchUpdate: (
    config: BatchCharacterUpdateConfig,
    onProgress: (progress: BatchCharacterProgress) => void,
    shouldStop: () => boolean
  ) => Promise<{ success: number; failed: number }>;
  onAutoDescribeCharacter?: (name: string, seed?: string) => Promise<string>;
  isAiConfigured?: boolean;
}

export const BatchCharacterUpdateModal: React.FC<BatchCharacterUpdateModalProps> = ({
  isOpen,
  onClose,
  visualRefs,
  storyboard,
  initialSelectedRefId,
  onExecuteBatchUpdate,
  onAutoDescribeCharacter,
  isAiConfigured = true
}) => {
  // Target Mode: 'existing' or 'custom'
  const [targetMode, setTargetMode] = useState<'existing' | 'custom'>('existing');
  const [selectedSourceRefId, setSelectedSourceRefId] = useState<string>('');
  
  // Character Details
  const [charName, setCharName] = useState<string>('');
  const [charDesc, setCharDesc] = useState<string>('');
  const [previousDesc, setPreviousDesc] = useState<string>('');
  
  // AI Bio Generation State
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  // Scene Selection State
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  const [sceneFilter, setSceneFilter] = useState<'all' | 'selected_only' | 'linked_only'>('all');

  // AI Adaptation Targets & Settings
  const [adaptImagePrompts, setAdaptImagePrompts] = useState(true);
  const [adaptVideoPrompts, setAdaptVideoPrompts] = useState(true);
  const [adaptSoraPrompts, setAdaptSoraPrompts] = useState(true);
  const [adaptSceneDescription, setAdaptSceneDescription] = useState(true);
  const [adaptVoiceoverLipSync, setAdaptVoiceoverLipSync] = useState(false);
  const [preservationStyle, setPreservationStyle] = useState<'strict' | 'environmental'>('strict');
  const [syncWithLibrary, setSyncWithLibrary] = useState(true);
  const [linkRefToScenes, setLinkRefToScenes] = useState(true);
  const [clearGeneratedImages, setClearGeneratedImages] = useState(false);

  // Execution & Progress State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [progressState, setProgressState] = useState<BatchCharacterProgress | null>(null);
  const [completedSummary, setCompletedSummary] = useState<{ success: number; failed: number } | null>(null);
  const stopRequestedRef = useRef(false);

  // Initialize modal state when opened
  useEffect(() => {
    if (!isOpen) {
      setIsExecuting(false);
      setProgressState(null);
      setCompletedSummary(null);
      setExecutionError(null);
      return;
    }

    // Determine initial scenes to select (if any scenes are currently checked in storyboard, use them)
    if (storyboard && storyboard.length > 0) {
      const activeSelected = storyboard.filter(s => s.isSelected).map(s => s.id);
      if (activeSelected.length > 0) {
        setSelectedSceneIds(activeSelected);
        setSceneFilter('selected_only');
      } else {
        setSelectedSceneIds(storyboard.map(s => s.id));
        setSceneFilter('all');
      }
    }

    // Determine initial character reference
    if (visualRefs.length > 0) {
      const validRef = (initialSelectedRefId && visualRefs.find(r => r.id === initialSelectedRefId)) 
        || visualRefs[0];
      setSelectedSourceRefId(validRef.id);
      setTargetMode('existing');
      setCharName(validRef.name);
      setCharDesc(validRef.description);
      setPreviousDesc(validRef.description);
    } else {
      setTargetMode('custom');
      setSelectedSourceRefId('');
      setCharName('Protagonist');
      setCharDesc('');
      setPreviousDesc('');
    }
  }, [isOpen, initialSelectedRefId, visualRefs, storyboard]);

  // When changing existing character dropdown
  const handleSelectExistingRef = (refId: string) => {
    setSelectedSourceRefId(refId);
    const found = visualRefs.find(r => r.id === refId);
    if (found) {
      setCharName(found.name);
      setCharDesc(found.description);
      setPreviousDesc(found.description);
    }
  };

  // AI Bio Generator handler
  const handleGenerateBio = async () => {
    if (!charName.trim()) {
      setBioError("Please enter a character name or role first (e.g. 'Lead Vocalist', 'Cyberpunk Hacker').");
      return;
    }
    if (!onAutoDescribeCharacter) {
      setBioError("AI description service is not available.");
      return;
    }

    setBioError(null);
    setIsGeneratingBio(true);
    try {
      const bio = await onAutoDescribeCharacter(charName.trim(), charDesc.trim());
      if (bio && bio.trim()) {
        setCharDesc(bio.trim());
      }
    } catch (err: any) {
      setBioError(err?.message || "Failed to generate character bio with AI.");
    } finally {
      setIsGeneratingBio(false);
    }
  };

  // Scene Selection Helpers
  const allScenes = storyboard || [];
  const filteredScenes = useMemo(() => {
    if (!storyboard) return [];
    if (sceneFilter === 'selected_only') {
      const originallySelected = storyboard.filter(s => s.isSelected).map(s => s.id);
      return originallySelected.length > 0 
        ? storyboard.filter(s => originallySelected.includes(s.id))
        : storyboard;
    }
    if (sceneFilter === 'linked_only' && selectedSourceRefId) {
      return storyboard.filter(s => s.linkedRefIds?.includes(selectedSourceRefId));
    }
    return storyboard;
  }, [storyboard, sceneFilter, selectedSourceRefId]);

  const toggleSceneSelection = (sceneId: string) => {
    setSelectedSceneIds(prev => 
      prev.includes(sceneId) 
        ? prev.filter(id => id !== sceneId)
        : [...prev, sceneId]
    );
  };

  const selectAllFiltered = () => {
    const idsToAdd = filteredScenes.map(s => s.id);
    setSelectedSceneIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const deselectAllFiltered = () => {
    const idsToRemove = new Set(filteredScenes.map(s => s.id));
    setSelectedSceneIds(prev => prev.filter(id => !idsToRemove.has(id)));
  };

  // Start Batch Execution
  const handleStartUpdate = async () => {
    setExecutionError(null);
    setCompletedSummary(null);

    if (selectedSceneIds.length === 0) {
      setExecutionError("Please select at least 1 scene to update.");
      return;
    }

    if (!charName.trim()) {
      setExecutionError("Please specify a character name.");
      return;
    }

    if (!charDesc.trim()) {
      setExecutionError("Please provide a visual description for the character.");
      return;
    }

    if (!adaptImagePrompts && !adaptVideoPrompts && !adaptSoraPrompts && !adaptSceneDescription && !adaptVoiceoverLipSync) {
      setExecutionError("Please select at least one prompt field to adapt (e.g. Image Prompts).");
      return;
    }

    setIsExecuting(true);
    stopRequestedRef.current = false;

    const config: BatchCharacterUpdateConfig = {
      targetMode,
      sourceRefId: targetMode === 'existing' ? selectedSourceRefId : undefined,
      characterName: charName.trim(),
      characterDescription: charDesc.trim(),
      previousDescription: previousDesc.trim(),
      selectedSceneIds,
      adaptImagePrompts,
      adaptVideoPrompts,
      adaptSoraPrompts,
      adaptSceneDescription,
      adaptVoiceoverLipSync,
      preservationStyle,
      syncWithLibrary,
      linkRefToScenes,
      clearGeneratedImages
    };

    try {
      const summary = await onExecuteBatchUpdate(
        config,
        (progress) => {
          setProgressState(progress);
        },
        () => stopRequestedRef.current
      );

      setCompletedSummary(summary);
      setProgressState(prev => prev ? { ...prev, status: 'completed' } : null);
    } catch (err: any) {
      console.error("Batch Character Update Error:", err);
      setExecutionError(err?.message || "An unexpected error occurred during character adaptation.");
      setProgressState(prev => prev ? { ...prev, status: 'failed' } : null);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStopExecution = () => {
    stopRequestedRef.current = true;
    if (progressState) {
      setProgressState(prev => prev ? { ...prev, status: 'stopped' } : null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[105] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        className="bg-[#121214] border border-cyan-500/30 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)] max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#161619] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Update Character Descriptions
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  AI Multi-Scene
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Simultaneously update character traits and styling across all selected storyboard scenes with cinematic structure preservation.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isExecuting}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors disabled:opacity-30"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
          {/* Execution / Progress View */}
          {isExecuting || completedSummary ? (
            <div className="space-y-6 py-2 animate-in fade-in">
              {/* Progress Card */}
              <div className="p-5 rounded-xl bg-[#18181c] border border-cyan-500/30 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {isExecuting ? (
                      <Loader2 size={20} className="animate-spin text-cyan-400" />
                    ) : completedSummary && completedSummary.failed === 0 ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={20} className="text-amber-400" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {isExecuting 
                          ? `Adapting Scenes to "${charName}"...` 
                          : completedSummary && completedSummary.failed === 0
                          ? `Successfully Adapted ${completedSummary.success} Scene${completedSummary.success === 1 ? '' : 's'}!`
                          : `Completed with ${completedSummary?.failed || 0} Issue${completedSummary?.failed === 1 ? '' : 's'}`
                        }
                      </h4>
                      <p className="text-xs text-gray-400">
                        {progressState 
                          ? `Scene ${progressState.current} of ${progressState.total} (${Math.round((progressState.current / Math.max(1, progressState.total)) * 100)}%)` 
                          : 'Preparing AI models and context...'}
                      </p>
                    </div>
                  </div>

                  {isExecuting && (
                    <button
                      onClick={handleStopExecution}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 text-xs font-bold transition-colors"
                    >
                      <StopCircle size={14} /> Stop
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-black/50 h-2.5 rounded-full overflow-hidden border border-white/5 mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-300 relative"
                    style={{ 
                      width: `${progressState ? (progressState.current / Math.max(1, progressState.total)) * 100 : 5}%` 
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>

                {/* Status Stats */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/5 font-mono">
                  <div>Success: <span className="text-emerald-400 font-bold">{progressState?.successCount || 0}</span></div>
                  <div>Failed: <span className="text-rose-400 font-bold">{progressState?.failedCount || 0}</span></div>
                  <div>Target Character: <span className="text-cyan-300 font-bold">{charName}</span></div>
                </div>
              </div>

              {/* Live Before / After Diff Preview */}
              {progressState?.originalImagePrompt && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Film size={13} className="text-cyan-400" />
                      Scene #{progressState.currentSceneNumber} Active Adaptation
                    </span>
                    <span className="text-[11px] text-gray-400 italic truncate max-w-xs">
                      "{progressState.currentSceneLyric}"
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Previous Image Prompt</div>
                      <p className="text-gray-300 text-[11px] leading-relaxed line-clamp-4">
                        {progressState.originalImagePrompt}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-xs">
                      <div className="text-[10px] font-bold text-cyan-300 uppercase mb-1 flex items-center gap-1">
                        <Sparkles size={10} /> AI Adapted Prompt
                      </div>
                      <p className="text-cyan-100 text-[11px] leading-relaxed line-clamp-4">
                        {progressState.adaptedImagePrompt || 'Synthesizing character features into lighting and shot framing...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Completion Actions */}
              {completedSummary && (
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsExecuting(false);
                      setCompletedSummary(null);
                      setProgressState(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                  >
                    Adjust Settings & Run Again
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow-lg shadow-cyan-600/30 flex items-center gap-1.5"
                  >
                    <Check size={14} /> Done Viewing Storyboard
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Top Configuration Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Column: Character Selection & Description (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-4 rounded-xl bg-[#18181c] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                        <Users size={14} className="text-cyan-400" />
                        1. Target Character Profile
                      </label>
                      
                      {visualRefs.length > 0 && (
                        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMode('existing');
                              if (visualRefs.length > 0) {
                                handleSelectExistingRef(selectedSourceRefId || visualRefs[0].id);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                              targetMode === 'existing' 
                                ? 'bg-cyan-600 text-white' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            Existing Cast ({visualRefs.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMode('custom');
                            }}
                            className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                              targetMode === 'custom' 
                                ? 'bg-cyan-600 text-white' 
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            New / Custom
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Existing Cast Selection Dropdown / Selector */}
                    {targetMode === 'existing' && visualRefs.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] text-gray-400">Select Cast Reference to update & adapt:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {visualRefs.map(ref => {
                            const isSelected = ref.id === selectedSourceRefId;
                            const linkedCount = allScenes.filter(s => s.linkedRefIds?.includes(ref.id)).length;
                            return (
                              <button
                                key={ref.id}
                                type="button"
                                onClick={() => handleSelectExistingRef(ref.id)}
                                className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                                  isSelected 
                                    ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/40' 
                                    : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/5'
                                }`}
                              >
                                {ref.image ? (
                                  <img 
                                    src={ref.image} 
                                    alt={ref.name} 
                                    className="w-9 h-9 rounded-md object-cover border border-white/10 shrink-0" 
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                                    {ref.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-white truncate">{ref.name}</div>
                                  <div className="text-[10px] text-gray-400 truncate">
                                    {linkedCount} linked scene{linkedCount === 1 ? '' : 's'}
                                  </div>
                                </div>
                                {isSelected && <Check size={14} className="text-cyan-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Character Name Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase">
                        Character Name / Role Identifier
                      </label>
                      <input
                        type="text"
                        value={charName}
                        onChange={e => setCharName(e.target.value)}
                        placeholder="e.g. 'Elena', 'The Lead Singer', 'Cyberpunk Detective'"
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500/50"
                      />
                    </div>

                    {/* Character Visual Description Textarea + AI Bio Enhancer */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-gray-400 uppercase">
                          Visual Appearance & Clothing Description
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateBio}
                          disabled={isGeneratingBio || !charName.trim() || !isAiConfigured}
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-40 flex items-center gap-1 transition-colors"
                          title="Use AI to generate or enhance rich physical and stylistic details"
                        >
                          {isGeneratingBio ? (
                            <Loader2 size={11} className="animate-spin text-cyan-400" />
                          ) : (
                            <Sparkles size={11} className="text-amber-400" />
                          )}
                          AI Enhance Bio
                        </button>
                      </div>

                      <textarea
                        value={charDesc}
                        onChange={e => setCharDesc(e.target.value)}
                        placeholder="Describe exact physical features, ethnicity/age, hairstyle and color, eye details, costume textures, signature accessories, and visual aesthetic..."
                        rows={4}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
                      />

                      {bioError && (
                        <div className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                          <AlertCircle size={11} /> {bioError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: AI Adaptation Controls & Prompt Targets (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-xl bg-[#18181c] border border-white/10 space-y-4">
                    <label className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                      <Sliders size={14} className="text-cyan-400" />
                      2. AI Adaptation Settings
                    </label>

                    {/* Preservation Style Strategy */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-gray-400 uppercase">
                        Cinematography Strategy
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPreservationStyle('strict')}
                          className={`p-2.5 rounded-lg border text-left transition-all ${
                            preservationStyle === 'strict'
                              ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                              : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          <div className="text-[11px] font-bold flex items-center gap-1">
                            <ShieldCheck size={12} className="text-cyan-400" />
                            Strict Structure
                          </div>
                          <div className="text-[9px] text-gray-400 mt-1 leading-tight">
                            Locks exact camera lens, angle, lighting setup & lyric beat.
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreservationStyle('environmental')}
                          className={`p-2.5 rounded-lg border text-left transition-all ${
                            preservationStyle === 'environmental'
                              ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                              : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          <div className="text-[11px] font-bold flex items-center gap-1">
                            <Sparkles size={12} className="text-amber-400" />
                            Adaptive Lighting
                          </div>
                          <div className="text-[9px] text-gray-400 mt-1 leading-tight">
                            Synthesizes character textures into scene shadows & colors.
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Target Prompt Fields */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-gray-400 uppercase">
                        Target Prompt Fields to Adapt
                      </div>
                      <div className="space-y-1.5 bg-black/30 p-2.5 rounded-lg border border-white/5">
                        <label className="flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={adaptImagePrompts}
                            onChange={e => setAdaptImagePrompts(e.target.checked)}
                            className="rounded accent-cyan-500"
                          />
                          <ImageIcon size={13} className="text-blue-400" />
                          <span>Image Prompts (Midjourney / Flux)</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={adaptVideoPrompts}
                            onChange={e => setAdaptVideoPrompts(e.target.checked)}
                            className="rounded accent-cyan-500"
                          />
                          <Video size={13} className="text-emerald-400" />
                          <span>Video Prompts (3 Motion Variations)</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={adaptSoraPrompts}
                            onChange={e => setAdaptSoraPrompts(e.target.checked)}
                            className="rounded accent-cyan-500"
                          />
                          <Film size={13} className="text-orange-400" />
                          <span>Cinematic Sora Prompts</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={adaptSceneDescription}
                            onChange={e => setAdaptSceneDescription(e.target.checked)}
                            className="rounded accent-cyan-500"
                          />
                          <Wand2 size={13} className="text-purple-400" />
                          <span>Visual Beat & Scene Narrative</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={adaptVoiceoverLipSync}
                            onChange={e => setAdaptVoiceoverLipSync(e.target.checked)}
                            className="rounded accent-cyan-500"
                          />
                          <Mic size={13} className="text-pink-400" />
                          <span>Voiceover & Lip-Sync Dialogues</span>
                        </label>
                      </div>
                    </div>

                    {/* Sync and Link options */}
                    <div className="space-y-1.5 pt-1 border-t border-white/5">
                      <label className="flex items-center gap-2 text-[11px] text-gray-300 hover:text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={syncWithLibrary}
                          onChange={e => setSyncWithLibrary(e.target.checked)}
                          className="rounded accent-cyan-500"
                        />
                        <span>Update/Save character in Cast Reference Library</span>
                      </label>

                      <label className="flex items-center gap-2 text-[11px] text-gray-300 hover:text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={linkRefToScenes}
                          onChange={e => setLinkRefToScenes(e.target.checked)}
                          className="rounded accent-cyan-500"
                        />
                        <span>Link character tag to all selected scenes</span>
                      </label>

                      <label className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-gray-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={clearGeneratedImages}
                          onChange={e => setClearGeneratedImages(e.target.checked)}
                          className="rounded accent-cyan-500"
                        />
                        <span>Reset existing preview images for re-generation</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Scene Selector & Multi-Scene Matrix */}
              <div className="p-4 rounded-xl bg-[#18181c] border border-white/10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                      <Layers size={14} className="text-cyan-400" />
                      3. Target Scenes ({selectedSceneIds.length} of {allScenes.length} Selected)
                    </label>
                  </div>

                  {/* Filter tabs & quick select buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setSceneFilter('all')}
                        className={`px-2 py-0.5 rounded font-bold transition-colors ${
                          sceneFilter === 'all' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        All ({allScenes.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSceneFilter('selected_only')}
                        className={`px-2 py-0.5 rounded font-bold transition-colors ${
                          sceneFilter === 'selected_only' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Checked ({allScenes.filter(s => s.isSelected).length})
                      </button>
                      {selectedSourceRefId && (
                        <button
                          type="button"
                          onClick={() => setSceneFilter('linked_only')}
                          className={`px-2 py-0.5 rounded font-bold transition-colors ${
                            sceneFilter === 'linked_only' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Linked ({allScenes.filter(s => s.linkedRefIds?.includes(selectedSourceRefId)).length})
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={selectAllFiltered}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 font-bold transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllFiltered}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 font-bold transition-colors"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scene Grid Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar p-1">
                  {filteredScenes.map((scene) => {
                    const originalIdx = allScenes.findIndex(s => s.id === scene.id);
                    const isSelected = selectedSceneIds.includes(scene.id);
                    const isLinked = selectedSourceRefId && scene.linkedRefIds?.includes(selectedSourceRefId);

                    return (
                      <div
                        key={scene.id}
                        onClick={() => toggleSceneSelection(scene.id)}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/50 shadow-sm ring-1 ring-cyan-500/30'
                            : 'bg-black/40 border-white/10 hover:border-white/20 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-cyan-300">
                                #{originalIdx + 1}
                              </span>
                              <span className="text-[9px] text-gray-500">
                                {scene.duration}s
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {isLinked && (
                                <span className="text-[8px] bg-teal-900/40 text-teal-300 px-1 py-0.2 rounded border border-teal-500/30">
                                  Linked
                                </span>
                              )}
                              {isSelected ? (
                                <CheckSquare size={13} className="text-cyan-400" />
                              ) : (
                                <Square size={13} className="text-gray-600 group-hover:text-gray-400" />
                              )}
                            </div>
                          </div>

                          <div className="text-[11px] font-medium text-gray-200 line-clamp-1 italic mb-1">
                            "{scene.lyric || 'Instrumental'}"
                          </div>

                          <div className="text-[9px] text-gray-400 line-clamp-2 leading-relaxed">
                            {scene.imagePrompt || scene.description || 'No prompt set'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Error Banner */}
              {executionError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-400" />
                  <span>{executionError}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="text-xs text-gray-400">
                  Ready to adapt <strong className="text-cyan-300">{selectedSceneIds.length} scenes</strong> to <strong className="text-white">"{charName}"</strong>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleStartUpdate}
                    disabled={selectedSceneIds.length === 0 || !charName.trim() || !charDesc.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-600/30 disabled:opacity-40 flex items-center gap-2"
                  >
                    <Wand2 size={14} />
                    <span>Adapt {selectedSceneIds.length} Scene{selectedSceneIds.length === 1 ? '' : 's'} with AI</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
