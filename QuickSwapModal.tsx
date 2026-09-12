import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, ArrowLeftRight, User, UserPlus, Sparkles, Upload, 
  Check, AlertCircle, Loader2, RefreshCw, 
  SlidersHorizontal, Info, Layers, CheckSquare, Square, Film
} from 'lucide-react';
import { VisualReference, ScenePrompt } from './App';

export interface QuickSwapConfig {
  sourceRefId: string;
  swapMode: 'existing' | 'new' | 'update_current';
  targetRefId?: string;
  newCharacterData?: {
    name: string;
    description: string;
    image: string;
  };
  selectedSceneIds: string[];
  updateSceneText: boolean;
  smartAiAdaptation: boolean;
  updateLinkedIds: boolean;
  clearGeneratedImages: boolean;
  regenerateWav2Lip: boolean;
}

interface QuickSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  visualRefs: VisualReference[];
  storyboard: ScenePrompt[] | null;
  initialSourceRefId?: string | null;
  onExecuteSwap: (config: QuickSwapConfig) => Promise<void> | void;
  onAutoDescribeCharacter?: (name: string) => Promise<string>;
  isAiConfigured?: boolean;
}

export const QuickSwapModal: React.FC<QuickSwapModalProps> = ({
  isOpen,
  onClose,
  visualRefs,
  storyboard,
  initialSourceRefId,
  onExecuteSwap,
  onAutoDescribeCharacter,
  isAiConfigured = true
}) => {
  // Source reference state
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  
  // Swap mode: 'existing' | 'new' | 'update_current'
  const [swapMode, setSwapMode] = useState<'existing' | 'new' | 'update_current'>('new');
  
  // Existing reference selection
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  
  // New character form state
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [newCharImage, setNewCharImage] = useState('');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
  
  // Update Options
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  const [updateSceneText, setUpdateSceneText] = useState(true);
  const [smartAiAdaptation, setSmartAiAdaptation] = useState(false);
  const [updateLinkedIds, setUpdateLinkedIds] = useState(true);
  const [clearGeneratedImages, setClearGeneratedImages] = useState(false);
  const [regenerateWav2Lip] = useState(true);
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Initialize or reset source ID when modal opens or initialSourceRefId changes
  useEffect(() => {
    if (isOpen) {
      const validSourceId = initialSourceRefId && visualRefs.some(r => r.id === initialSourceRefId)
        ? initialSourceRefId
        : visualRefs.length > 0
        ? visualRefs[0].id
        : '';
      
      setSelectedSourceId(validSourceId);
      
      // Select first available other reference for 'existing' mode if possible
      const otherRefs = visualRefs.filter(r => r.id !== validSourceId);
      if (otherRefs.length > 0) {
        setSelectedTargetId(otherRefs[0].id);
      } else {
        setSelectedTargetId('');
        if (swapMode === 'existing') {
          setSwapMode('new');
        }
      }

      // Reset new character form
      setNewCharName('');
      setNewCharDesc('');
      setNewCharImage('');
      setBioError(null);
      setExecutionError(null);
      setIsExecuting(false);
    }
  }, [isOpen, initialSourceRefId, visualRefs]);

  // Current source reference object
  const currentSourceRef = useMemo(() => {
    return visualRefs.find(r => r.id === selectedSourceId) || null;
  }, [visualRefs, selectedSourceId]);

  // Calculate linked scenes for the selected source reference
  const linkedScenes = useMemo(() => {
    if (!storyboard || !selectedSourceId) return [];
    return storyboard
      .map((scene, idx) => ({ scene, sceneIndex: idx }))
      .filter(({ scene }) => {
        const isIdLinked = scene.linkedRefIds?.includes(selectedSourceId);
        const nameMentioned = currentSourceRef?.name 
          ? (scene.imagePrompt?.toLowerCase().includes(currentSourceRef.name.toLowerCase()) ||
             scene.soraPrompt?.toLowerCase().includes(currentSourceRef.name.toLowerCase()) ||
             scene.description?.toLowerCase().includes(currentSourceRef.name.toLowerCase()))
          : false;
        return isIdLinked || nameMentioned;
      });
  }, [storyboard, selectedSourceId, currentSourceRef]);

  // When source changes or modal opens, pre-select all linked scenes
  useEffect(() => {
    if (linkedScenes.length > 0) {
      setSelectedSceneIds(linkedScenes.map(item => item.scene.id));
    } else {
      setSelectedSceneIds([]);
    }
  }, [linkedScenes]);

  // Populate update_current form when switching to update_current mode
  useEffect(() => {
    if (swapMode === 'update_current' && currentSourceRef) {
      setNewCharName(currentSourceRef.name);
      setNewCharDesc(currentSourceRef.description);
      setNewCharImage(currentSourceRef.image || '');
    }
  }, [swapMode, currentSourceRef]);

  if (!isOpen) return null;

  const handleSelectAllScenes = () => {
    setSelectedSceneIds(linkedScenes.map(item => item.scene.id));
  };

  const handleDeselectAllScenes = () => {
    setSelectedSceneIds([]);
  };

  const toggleSceneSelection = (sceneId: string) => {
    setSelectedSceneIds(prev => 
      prev.includes(sceneId) 
        ? prev.filter(id => id !== sceneId) 
        : [...prev, sceneId]
    );
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setBioError("Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewCharImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAutoBio = async () => {
    if (!newCharName.trim()) {
      setBioError("Enter a character name first before generating bio.");
      return;
    }
    if (!onAutoDescribeCharacter) {
      setBioError("AI description is unavailable in this configuration.");
      return;
    }
    setBioError(null);
    setIsGeneratingBio(true);
    try {
      const generated = await onAutoDescribeCharacter(newCharName.trim());
      if (generated) {
        setNewCharDesc(generated);
      }
    } catch (err: any) {
      setBioError(err?.message || "Failed to generate character bio.");
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleConfirmSwap = async () => {
    setExecutionError(null);

    if (!selectedSourceId) {
      setExecutionError("Please select a source character to replace.");
      return;
    }

    if (swapMode === 'existing') {
      if (!selectedTargetId) {
        setExecutionError("Please select a target character reference.");
        return;
      }
      if (selectedTargetId === selectedSourceId) {
        setExecutionError("Target character must be different from the source character.");
        return;
      }
    } else {
      if (!newCharName.trim()) {
        setExecutionError("Please enter a name for the new character.");
        return;
      }
      if (!newCharDesc.trim()) {
        setExecutionError("Please enter a visual description for the character.");
        return;
      }
    }

    setIsExecuting(true);
    try {
      await onExecuteSwap({
        sourceRefId: selectedSourceId,
        swapMode,
        targetRefId: swapMode === 'existing' ? selectedTargetId : undefined,
        newCharacterData: swapMode !== 'existing' ? {
          name: newCharName.trim(),
          description: newCharDesc.trim(),
          image: newCharImage
        } : undefined,
        selectedSceneIds,
        updateSceneText,
        smartAiAdaptation,
        updateLinkedIds,
        clearGeneratedImages,
        regenerateWav2Lip
      });
      onClose();
    } catch (err: any) {
      console.error("Quick Swap Execution Failed:", err);
      setExecutionError(err?.message || "Failed to execute Quick Swap. Please check your inputs.");
    } finally {
      setIsExecuting(false);
    }
  };

  const otherRefs = visualRefs.filter(r => r.id !== selectedSourceId);

  return (
    <div 
      className="fixed inset-0 z-[105] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#121212] border border-teal-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-teal-950/40 via-black to-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Quick Swap Character Reference
                <span className="text-[10px] px-2 py-0.5 bg-teal-900/60 text-teal-300 rounded-full border border-teal-500/30 font-mono uppercase tracking-wider">
                  Continuity Engine
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Replace an existing character reference and automatically propagate visual descriptions across linked storyboard scenes.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {executionError && (
            <div className="p-3.5 bg-red-950/60 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 text-xs">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <span>{executionError}</span>
            </div>
          )}

          {visualRefs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500 space-y-3">
              <User size={48} className="opacity-30" />
              <h3 className="text-base font-bold text-gray-300">No Visual References Found</h3>
              <p className="text-xs text-gray-500 max-w-md">
                You haven't created any character references yet. Create your first character reference to start using the Quick Swap feature.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Source Character & Linked Scenes (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#181818] border border-white/10 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} className="text-teal-400" />
                      Current Character to Replace
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">Source</span>
                  </div>

                  {/* Character Selector Dropdown */}
                  <div>
                    <select
                      value={selectedSourceId}
                      onChange={(e) => setSelectedSourceId(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal-500 transition-colors"
                    >
                      {visualRefs.map(ref => (
                        <option key={ref.id} value={ref.id}>
                          {ref.name || 'Unnamed Character'} {ref.image ? '(Photo)' : '(Text-only)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Source Card Preview */}
                  {currentSourceRef && (
                    <div className="bg-black/40 border border-white/10 rounded-lg p-3 flex gap-3 items-start">
                      <div className="w-16 h-16 shrink-0 bg-black/60 rounded-md border border-white/10 overflow-hidden flex items-center justify-center">
                        {currentSourceRef.image ? (
                          <img 
                            src={currentSourceRef.image} 
                            alt={currentSourceRef.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <User size={24} className="text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-white truncate">
                          {currentSourceRef.name}
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-3 mt-1 leading-relaxed">
                          {currentSourceRef.description || 'No visual description provided.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Linked Storyboard Scenes Container */}
                <div className="bg-[#181818] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Film size={14} className="text-blue-400" />
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Linked Scenes ({linkedScenes.length})
                      </span>
                    </div>
                    {linkedScenes.length > 0 && (
                      <div className="flex items-center gap-2 text-[10px]">
                        <button 
                          onClick={handleSelectAllScenes}
                          className="text-teal-400 hover:text-teal-300 font-medium"
                        >
                          All
                        </button>
                        <span className="text-gray-600">|</span>
                        <button 
                          onClick={handleDeselectAllScenes}
                          className="text-gray-400 hover:text-gray-300 font-medium"
                        >
                          None
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400">
                    Select which storyboard scenes will receive the updated character visual description:
                  </p>

                  {linkedScenes.length === 0 ? (
                    <div className="p-4 bg-black/30 border border-white/5 rounded-lg text-center text-gray-500 text-xs">
                      No storyboard scenes are currently linked to or mention this character. The character reference in your library will still be updated.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {linkedScenes.map(({ scene, sceneIndex }) => {
                        const isSelected = selectedSceneIds.includes(scene.id);
                        return (
                          <div 
                            key={scene.id}
                            onClick={() => toggleSceneSelection(scene.id)}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                              isSelected 
                                ? 'bg-teal-950/30 border-teal-500/40 text-gray-200' 
                                : 'bg-black/20 border-white/5 text-gray-500 hover:border-white/20'
                            }`}
                          >
                            <button className="mt-0.5 text-teal-400 shrink-0">
                              {isSelected ? <CheckSquare size={14} /> : <Square size={14} className="text-gray-600" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-[11px] text-teal-300">
                                  Scene {sceneIndex + 1}
                                </span>
                                <span className="text-[9px] font-mono text-gray-500">
                                  {scene.startTime || '00:00'} - {scene.endTime || '00:04'}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-300 italic truncate mt-0.5">
                                "{scene.lyric || 'Instrumental beat'}"
                              </p>
                              <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                                {scene.imagePrompt}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Replacement Character & Settings (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Replacement Mode Tabs */}
                <div className="bg-[#181818] border border-white/10 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-teal-400" />
                      Replacement Target
                    </label>
                    <span className="text-[10px] text-teal-400 font-mono">Step 2</span>
                  </div>

                  {/* Mode Selector Buttons */}
                  <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setSwapMode('new')}
                      className={`py-2 px-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        swapMode === 'new'
                          ? 'bg-teal-600 text-white shadow'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <UserPlus size={13} />
                      <span>New Character</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSwapMode('existing')}
                      disabled={otherRefs.length === 0}
                      className={`py-2 px-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed ${
                        swapMode === 'existing'
                          ? 'bg-teal-600 text-white shadow'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Layers size={13} />
                      <span>From Library ({otherRefs.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSwapMode('update_current')}
                      className={`py-2 px-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        swapMode === 'update_current'
                          ? 'bg-teal-600 text-white shadow'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <RefreshCw size={13} />
                      <span>Update In-Place</span>
                    </button>
                  </div>

                  {/* Tab 1: Swap With Existing Reference */}
                  {swapMode === 'existing' && (
                    <div className="space-y-3 pt-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase">
                        Select Replacement Character
                      </label>
                      
                      {otherRefs.length === 0 ? (
                        <div className="p-4 bg-black/30 rounded-lg text-center text-xs text-gray-500">
                          No other characters exist in your library. Please use "New Character" mode.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                          {otherRefs.map(ref => {
                            const isSelected = selectedTargetId === ref.id;
                            return (
                              <div
                                key={ref.id}
                                onClick={() => setSelectedTargetId(ref.id)}
                                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                                  isSelected 
                                    ? 'bg-teal-950/40 border-teal-500 text-white shadow-md' 
                                    : 'bg-black/30 border-white/10 hover:border-white/20 text-gray-300'
                                }`}
                              >
                                <div className="w-12 h-12 shrink-0 bg-black rounded-md overflow-hidden border border-white/10 flex items-center justify-center">
                                  {ref.image ? (
                                    <img src={ref.image} alt={ref.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <User size={18} className="text-gray-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-xs truncate flex items-center justify-between">
                                    <span>{ref.name}</span>
                                    {isSelected && <Check size={12} className="text-teal-400" />}
                                  </div>
                                  <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                                    {ref.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2 & Tab 3: Create New Character / Update Current */}
                  {(swapMode === 'new' || swapMode === 'update_current') && (
                    <div className="space-y-3.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                          {swapMode === 'new' ? 'New Character Name' : 'Character Name'}
                        </label>
                        <input
                          type="text"
                          value={newCharName}
                          onChange={e => setNewCharName(e.target.value)}
                          placeholder="e.g. Detective Marcus, Elena Vance, Cyber Specialist"
                          className="w-full bg-black/60 border border-white/15 rounded-lg p-2 text-xs text-white outline-none focus:border-teal-500 transition-colors"
                        />
                      </div>

                      {/* Image Upload Area */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                          Reference Photo (Optional)
                        </label>
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={handleImageDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all flex items-center justify-center gap-3 ${
                            dragOver 
                              ? 'border-teal-400 bg-teal-950/30' 
                              : 'border-white/15 bg-black/30 hover:border-white/30 hover:bg-black/50'
                          }`}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            accept="image/*" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0]);
                              }
                            }} 
                            className="hidden" 
                          />
                          {newCharImage ? (
                            <div className="flex items-center gap-3 w-full">
                              <img 
                                src={newCharImage} 
                                alt="Preview" 
                                className="w-12 h-12 object-cover rounded border border-white/20" 
                              />
                              <div className="text-left flex-1 min-w-0">
                                <p className="text-xs font-bold text-teal-300 truncate">Image Attached</p>
                                <p className="text-[10px] text-gray-400">Click or drop new file to replace</p>
                              </div>
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setNewCharImage(''); }}
                                className="text-[10px] text-red-400 hover:text-red-300 p-1"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                              <Upload size={16} className="text-teal-400" />
                              <span>Drop reference photo or click to browse</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description & Auto-Bio */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-gray-400 uppercase">
                            Visual Description & Key Traits
                          </label>
                          {onAutoDescribeCharacter && (
                            <button
                              type="button"
                              onClick={handleAutoBio}
                              disabled={isGeneratingBio || !newCharName.trim()}
                              className="text-[10px] text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 disabled:opacity-40 transition-colors"
                            >
                              {isGeneratingBio ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <Sparkles size={11} />
                              )}
                              <span>Generate Bio with AI</span>
                            </button>
                          )}
                        </div>
                        <textarea
                          value={newCharDesc}
                          onChange={e => setNewCharDesc(e.target.value)}
                          placeholder="Detailed visual description: age, face, hairstyle, clothing style, distinctive features (e.g. 'Mid-30s man with rugged stubble, slicked-back dark hair, wearing a worn leather trench coat and amber goggles')..."
                          className="w-full bg-black/60 border border-white/15 rounded-lg p-2.5 text-xs text-white outline-none focus:border-teal-500 transition-colors h-24 resize-none custom-scrollbar"
                        />
                        {bioError && (
                          <p className="text-[10px] text-red-400 mt-1">{bioError}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Propagation & Update Settings */}
                <div className="bg-[#181818] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-teal-400" />
                      Scene Update Behavior
                    </label>
                    <span className="text-[10px] text-teal-400 font-mono">Step 3</span>
                  </div>

                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={updateSceneText}
                        onChange={e => setUpdateSceneText(e.target.checked)}
                        className="accent-teal-500 w-3.5 h-3.5 rounded"
                      />
                      <div>
                        <span className="font-semibold text-white">Update Text & Visual Descriptions</span>
                        <p className="text-[10px] text-gray-400">
                          Replaces character name and inserts new visual description into image and video prompts.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={updateLinkedIds}
                        onChange={e => setUpdateLinkedIds(e.target.checked)}
                        className="accent-teal-500 w-3.5 h-3.5 rounded"
                      />
                      <div>
                        <span className="font-semibold text-white">Update Linked Reference ID</span>
                        <p className="text-[10px] text-gray-400">
                          Re-links scene metadata to the new character in your casting library.
                        </p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2.5 text-xs text-gray-300 ${!isAiConfigured ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        disabled={!isAiConfigured}
                        checked={smartAiAdaptation && isAiConfigured}
                        onChange={e => setSmartAiAdaptation(e.target.checked)}
                        className="accent-teal-500 w-3.5 h-3.5 rounded"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">AI Contextual Prompt Adaptation</span>
                          <span className="text-[9px] bg-purple-950/60 text-purple-300 border border-purple-500/30 px-1 rounded">Smart</span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {isAiConfigured 
                            ? "Uses AI to seamlessly integrate the new character's traits while preserving camera shots, lighting, and pacing."
                            : "Configure an AI Provider in settings to enable contextual AI prompt rewrites."}
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={clearGeneratedImages}
                        onChange={e => setClearGeneratedImages(e.target.checked)}
                        className="accent-teal-500 w-3.5 h-3.5 rounded"
                      />
                      <div>
                        <span className="font-semibold text-white">Invalidate Old Scene Preview Images</span>
                        <p className="text-[10px] text-gray-400">
                          Clears previously generated images on linked scenes to signify that fresh previews should be generated with the new character.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#0c0c0c] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Info size={14} className="text-teal-400" />
            <span>
              {selectedSceneIds.length} scene(s) selected for automatic update
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmSwap}
              disabled={isExecuting || visualRefs.length === 0}
              className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-900/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Swapping Character...</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight size={14} />
                  <span>Execute Quick Swap ({selectedSceneIds.length} Scenes)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
