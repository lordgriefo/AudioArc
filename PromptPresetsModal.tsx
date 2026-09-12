import React, { useState, useMemo, useRef } from 'react';
import { 
  PromptPreset, 
  PRESET_CATEGORIES, 
  exportPresetsToJson, 
  importPresetsFromJson 
} from './promptPresets';
import { ScenePrompt } from './App';
import { 
  X, Search, Plus, Sparkles, Copy, Check, SlidersHorizontal, 
  Trash2, Edit3, Download, Upload, Video, Clapperboard,
  CheckCheck, Eye, EyeOff, Camera,
  CornerDownRight, Tag, BookmarkPlus
} from 'lucide-react';

interface PromptPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: PromptPreset[];
  onSavePreset: (preset: PromptPreset) => void;
  onDeletePreset: (presetId: string) => void;
  onImportPresets: (imported: PromptPreset[]) => void;
  storyboard: ScenePrompt[] | null;
  targetSceneIndex?: number | null;
  selectedSceneIndices?: number[];
  onApplyPresetToScene: (sceneIndex: number, preset: PromptPreset, applyMode?: 'full' | 'imageOnly' | 'videoOnly') => void;
  onApplyPresetToSelected: (preset: PromptPreset, applyMode?: 'full' | 'imageOnly' | 'videoOnly') => void;
  onInsertPresetAsScene: (preset: PromptPreset) => void;
  initialNewPresetData?: Partial<PromptPreset> | null;
}

export const PromptPresetsModal: React.FC<PromptPresetsModalProps> = ({
  isOpen,
  onClose,
  presets,
  onSavePreset,
  onDeletePreset,
  onImportPresets,
  storyboard,
  targetSceneIndex,
  selectedSceneIndices = [],
  onApplyPresetToScene,
  onApplyPresetToSelected,
  onInsertPresetAsScene,
  initialNewPresetData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterType, setFilterType] = useState<'all' | 'builtin' | 'custom'>('all');
  const [activeTab, setActiveTab] = useState<'library' | 'editor'>('library');
  const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingPreset, setEditingPreset] = useState<PromptPreset | null>(null);
  const [selectedTargetScene, setSelectedTargetScene] = useState<number>(
    targetSceneIndex !== undefined && targetSceneIndex !== null ? targetSceneIndex : 0
  );
  const [applyMode, setApplyMode] = useState<'full' | 'imageOnly' | 'videoOnly'>('full');

  // Form State for creating/editing preset
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Cinematic');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImagePrompt, setFormImagePrompt] = useState('');
  const [formVideoPrompts, setFormVideoPrompts] = useState<string[]>(['', '', '']);
  const [formSoraPrompt, setFormSoraPrompt] = useState('');
  const [formCameraMovement, setFormCameraMovement] = useState('Dolly In');
  const [formTransitionIn, setFormTransitionIn] = useState('fade');
  const [formTransitionOut, setFormTransitionOut] = useState('dissolve');
  const [formTags, setFormTags] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // When initialNewPresetData is supplied (e.g., from scene card "Save as Preset")
  React.useEffect(() => {
    if (initialNewPresetData) {
      setEditingPreset(null);
      setFormName(initialNewPresetData.name || '');
      setFormCategory(initialNewPresetData.category || 'Cinematic');
      setFormDescription(initialNewPresetData.description || '');
      setFormImagePrompt(initialNewPresetData.imagePrompt || '');
      setFormVideoPrompts(
        initialNewPresetData.videoPrompts && initialNewPresetData.videoPrompts.length > 0 
          ? initialNewPresetData.videoPrompts 
          : ['', '', '']
      );
      setFormSoraPrompt(initialNewPresetData.soraPrompt || '');
      setFormCameraMovement(initialNewPresetData.cameraMovement || 'Dolly In');
      setFormTransitionIn(initialNewPresetData.transitionIn || 'fade');
      setFormTransitionOut(initialNewPresetData.transitionOut || 'dissolve');
      setFormTags(initialNewPresetData.tags ? initialNewPresetData.tags.join(', ') : '');
      setActiveTab('editor');
    }
  }, [initialNewPresetData]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenCreateForm = () => {
    setEditingPreset(null);
    setFormName('');
    setFormCategory('Cinematic');
    setFormCustomCategory('');
    setFormDescription('');
    setFormImagePrompt('');
    setFormVideoPrompts(['', '', '']);
    setFormSoraPrompt('');
    setFormCameraMovement('Dolly In');
    setFormTransitionIn('fade');
    setFormTransitionOut('dissolve');
    setFormTags('Cinematic, 35mm');
    setFormError(null);
    setActiveTab('editor');
  };

  const handleOpenEditForm = (preset: PromptPreset) => {
    setEditingPreset(preset);
    setFormName(preset.name);
    if (PRESET_CATEGORIES.includes(preset.category as any)) {
      setFormCategory(preset.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('Custom');
      setFormCustomCategory(preset.category);
    }
    setFormDescription(preset.description || '');
    setFormImagePrompt(preset.imagePrompt || '');
    setFormVideoPrompts(preset.videoPrompts && preset.videoPrompts.length > 0 ? [...preset.videoPrompts] : ['', '', '']);
    setFormSoraPrompt(preset.soraPrompt || '');
    setFormCameraMovement(preset.cameraMovement || 'Dolly In');
    setFormTransitionIn(preset.transitionIn || 'fade');
    setFormTransitionOut(preset.transitionOut || 'dissolve');
    setFormTags(preset.tags ? preset.tags.join(', ') : '');
    setFormError(null);
    setActiveTab('editor');
  };

  const handleDuplicatePreset = (preset: PromptPreset) => {
    setEditingPreset(null);
    setFormName(`${preset.name} (Remix)`);
    setFormCategory(preset.category);
    setFormCustomCategory('');
    setFormDescription(preset.description || '');
    setFormImagePrompt(preset.imagePrompt || '');
    setFormVideoPrompts(preset.videoPrompts ? [...preset.videoPrompts] : ['', '', '']);
    setFormSoraPrompt(preset.soraPrompt || '');
    setFormCameraMovement(preset.cameraMovement || 'Dolly In');
    setFormTransitionIn(preset.transitionIn || 'fade');
    setFormTransitionOut(preset.transitionOut || 'dissolve');
    setFormTags(preset.tags ? preset.tags.join(', ') : '');
    setFormError(null);
    setActiveTab('editor');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Please enter a preset title');
      return;
    }
    if (!formImagePrompt.trim() && !formSoraPrompt.trim()) {
      setFormError('Please enter at least an image prompt or video prompt');
      return;
    }

    const finalCategory = formCategory === 'Custom' && formCustomCategory.trim() 
      ? formCustomCategory.trim() 
      : formCategory;

    const parsedTags = formTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newPreset: PromptPreset = {
      id: editingPreset ? editingPreset.id : `preset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: formName.trim(),
      category: finalCategory,
      description: formDescription.trim(),
      imagePrompt: formImagePrompt.trim(),
      videoPrompts: formVideoPrompts.map(v => v.trim()),
      soraPrompt: formSoraPrompt.trim() || formImagePrompt.trim(),
      cameraMovement: formCameraMovement,
      transitionIn: formTransitionIn,
      transitionOut: formTransitionOut,
      tags: parsedTags,
      isBuiltIn: false,
      createdAt: editingPreset ? editingPreset.createdAt : new Date().toISOString()
    };

    onSavePreset(newPreset);
    setActiveTab('library');
    setEditingPreset(null);
  };

  const handleExportJson = () => {
    const json = exportPresetsToJson(presets);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AudioArc_Prompt_Presets_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const imported = importPresetsFromJson(content);
        onImportPresets(imported);
      } catch (err: any) {
        alert(`Failed to import presets: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter presets
  const filteredPresets = useMemo(() => {
    return presets.filter(preset => {
      // Type filter
      if (filterType === 'builtin' && !preset.isBuiltIn) return false;
      if (filterType === 'custom' && preset.isBuiltIn) return false;

      // Category filter
      if (selectedCategory !== 'All' && preset.category !== selectedCategory) {
        if (selectedCategory === 'Custom' && preset.isBuiltIn) return false;
        if (selectedCategory !== 'Custom' && preset.category !== selectedCategory) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = preset.name.toLowerCase().includes(q);
        const matchesCategory = preset.category.toLowerCase().includes(q);
        const matchesDesc = (preset.description || '').toLowerCase().includes(q);
        const matchesImg = (preset.imagePrompt || '').toLowerCase().includes(q);
        const matchesSora = (preset.soraPrompt || '').toLowerCase().includes(q);
        const matchesCamera = (preset.cameraMovement || '').toLowerCase().includes(q);
        const matchesTags = preset.tags && preset.tags.some(t => t.toLowerCase().includes(q));
        return matchesName || matchesCategory || matchesDesc || matchesImg || matchesSora || matchesCamera || matchesTags;
      }

      return true;
    });
  }, [presets, filterType, selectedCategory, searchQuery]);

  const customPresetCount = presets.filter(p => !p.isBuiltIn).length;
  const builtinPresetCount = presets.filter(p => p.isBuiltIn).length;
  const hasSelectedScenes = selectedSceneIndices.length > 0;

  return (
    <div 
      className="fixed inset-0 z-[105] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#121212] border border-white/15 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#181818] to-[#121212] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <SlidersHorizontal size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-wide brand-font">Storyboard Prompt Presets</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/30">
                  {presets.length} Presets
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Save, categorize, and cross-apply professional visual and motion prompt configurations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'library' && (
              <>
                <button
                  onClick={handleExportJson}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-semibold border border-white/10 transition-colors"
                  title="Export Presets JSON"
                >
                  <Download size={14} /> Export
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".json" 
                  onChange={handleImportJson} 
                  className="hidden" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-semibold border border-white/10 transition-colors"
                  title="Import Presets JSON"
                >
                  <Upload size={14} /> Import
                </button>
                <button
                  onClick={handleOpenCreateForm}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-900/40 transition-all hover:scale-[1.02]"
                >
                  <Plus size={15} /> New Preset
                </button>
              </>
            )}

            {activeTab === 'editor' && (
              <button
                onClick={() => setActiveTab('library')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Back to Library
              </button>
            )}

            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'library' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Toolbar: Search + Category Filter + Source Filter */}
            <div className="p-4 border-b border-white/10 bg-[#161616] flex flex-col gap-3 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search presets by keyword, aesthetic, camera movement, or tag..."
                    className="w-full bg-black/50 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Source Filter (All / Builtin / Custom) */}
                <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${filterType === 'all' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    All ({presets.length})
                  </button>
                  <button
                    onClick={() => setFilterType('builtin')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${filterType === 'builtin' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    Built-In ({builtinPresetCount})
                  </button>
                  <button
                    onClick={() => setFilterType('custom')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${filterType === 'custom' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                  >
                    Custom ({customPresetCount})
                  </button>
                </div>

                {/* Target Scene & Mode Selector */}
                {storyboard && storyboard.length > 0 && (
                  <div className="flex items-center gap-2 bg-purple-950/20 px-3 py-1.5 rounded-xl border border-purple-500/30 shrink-0">
                    <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                      <Clapperboard size={13} className="text-purple-400" /> Target:
                    </span>
                    <select
                      value={selectedTargetScene}
                      onChange={e => setSelectedTargetScene(parseInt(e.target.value))}
                      className="bg-black/60 border border-purple-500/40 rounded-lg px-2 py-0.5 text-xs text-white font-medium outline-none focus:border-purple-400"
                    >
                      {storyboard.map((s, idx) => (
                        <option key={s.id || idx} value={idx}>
                          Scene {idx + 1} ({s.startTime || `${idx * 4}s`})
                        </option>
                      ))}
                    </select>

                    <div className="h-4 w-px bg-purple-500/30 mx-1"></div>

                    <select
                      value={applyMode}
                      onChange={e => setApplyMode(e.target.value as any)}
                      className="bg-black/60 border border-purple-500/40 rounded-lg px-2 py-0.5 text-xs text-purple-200 font-medium outline-none focus:border-purple-400"
                    >
                      <option value="full">Apply All Prompts & Camera</option>
                      <option value="imageOnly">Image Prompt Only</option>
                      <option value="videoOnly">Video & Sora Prompts Only</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-1">
                {PRESET_CATEGORIES.map(cat => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                        isActive
                          ? 'bg-purple-900/40 text-purple-200 border-purple-500/50 shadow-sm shadow-purple-500/20'
                          : 'bg-black/30 text-gray-400 border-white/10 hover:border-white/20 hover:text-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Scenes Banner (if any selected) */}
            {hasSelectedScenes && (
              <div className="bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-blue-950/40 px-6 py-2.5 border-b border-purple-500/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <CheckCheck size={16} className="text-purple-400" />
                  <span className="text-xs font-bold text-white">
                    {selectedSceneIndices.length} Storyboard Scene{selectedSceneIndices.length > 1 ? 's' : ''} Selected
                  </span>
                  <span className="text-[11px] text-gray-400">
                    — You can batch-apply any preset style to all selected scenes at once.
                  </span>
                </div>
              </div>
            )}

            {/* Presets Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[#0e0e0e]">
              {filteredPresets.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                  <SlidersHorizontal size={36} className="text-gray-600 mb-3" />
                  <h4 className="text-base font-bold text-gray-300">No Presets Found</h4>
                  <p className="text-xs text-gray-500 max-w-sm mt-1">
                    No prompt presets match your search query or selected category.
                  </p>
                  <button
                    onClick={handleOpenCreateForm}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
                  >
                    + Create First Preset
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {filteredPresets.map(preset => {
                    const isExpanded = expandedPresetId === preset.id;

                    return (
                      <div
                        key={preset.id}
                        className="bg-[#161616] border border-white/10 hover:border-purple-500/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-purple-950/10 group"
                      >
                        <div>
                          {/* Top Card Info */}
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                                  {preset.name}
                                </h4>
                                {preset.isBuiltIn ? (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300 border border-blue-500/30">
                                    Official
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-900/30 text-emerald-300 border border-emerald-500/30">
                                    Custom
                                  </span>
                                )}
                                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                                  {preset.category}
                                </span>
                              </div>
                              {preset.description && (
                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                  {preset.description}
                                </p>
                              )}
                            </div>

                            {/* Preset Options (Remix, Edit, Delete) */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleDuplicatePreset(preset)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-purple-300 hover:bg-white/5 transition-colors"
                                title="Duplicate / Remix Preset"
                              >
                                <Copy size={15} />
                              </button>
                              {!preset.isBuiltIn && (
                                <>
                                  <button
                                    onClick={() => handleOpenEditForm(preset)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-300 hover:bg-white/5 transition-colors"
                                    title="Edit Preset"
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                  <button
                                    onClick={() => onDeletePreset(preset.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                                    title="Delete Preset"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Attribute Badges (Camera Movement, Transitions, Tags) */}
                          <div className="flex items-center gap-2 flex-wrap mb-3.5 text-[10px]">
                            {preset.cameraMovement && preset.cameraMovement !== 'none' && (
                              <span className="bg-cyan-950/40 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/30 flex items-center gap-1 font-mono font-medium">
                                <Camera size={11} className="text-cyan-400" />
                                {preset.cameraMovement}
                              </span>
                            )}
                            {preset.transitionIn && preset.transitionIn !== 'none' && (
                              <span className="bg-indigo-950/40 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30 font-mono font-medium">
                                In: {preset.transitionIn}
                              </span>
                            )}
                            {preset.tags && preset.tags.map(tag => (
                              <span key={tag} className="bg-white/5 text-gray-400 px-2 py-0.5 rounded-md border border-white/5">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {/* Image Prompt Box */}
                          <div className="bg-black/40 border border-white/10 rounded-xl p-3 mb-3 relative group/box">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1">
                                <Sparkles size={11} /> Image Generation Prompt
                              </span>
                              <button
                                onClick={() => handleCopy(preset.imagePrompt, `img-${preset.id}`)}
                                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                {copiedKey === `img-${preset.id}` ? (
                                  <>
                                    <Check size={11} className="text-emerald-400" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} /> Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-gray-300 font-mono leading-relaxed line-clamp-3">
                              {preset.imagePrompt}
                            </p>
                          </div>

                          {/* Expandable Motion Prompts */}
                          {isExpanded && (
                            <div className="space-y-3 mb-3 animate-in fade-in duration-200">
                              {/* Sora / Video Master Prompt */}
                              {preset.soraPrompt && (
                                <div className="bg-black/40 border border-orange-500/20 rounded-xl p-3 relative">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400 flex items-center gap-1">
                                      <Video size={11} /> Sora / Master Video Prompt
                                    </span>
                                    <button
                                      onClick={() => handleCopy(preset.soraPrompt, `sora-${preset.id}`)}
                                      className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                      {copiedKey === `sora-${preset.id}` ? (
                                        <>
                                          <Check size={11} className="text-emerald-400" /> Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={11} /> Copy
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <p className="text-xs text-orange-200/90 font-mono leading-relaxed">
                                    {preset.soraPrompt}
                                  </p>
                                </div>
                              )}

                              {/* Video Prompt Variations */}
                              {preset.videoPrompts && preset.videoPrompts.some(v => v.trim()) && (
                                <div className="bg-black/30 border border-white/5 rounded-xl p-3 space-y-2">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">
                                    Video Variations (Subtle / Dynamic / Stylistic)
                                  </span>
                                  {preset.videoPrompts.map((vp, vIdx) => {
                                    if (!vp) return null;
                                    const labels = ['Subtle', 'Dynamic', 'Stylistic'];
                                    return (
                                      <div key={vIdx} className="text-xs bg-white/5 p-2 rounded-lg border border-white/5 flex items-start justify-between gap-2">
                                        <div>
                                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                                            {labels[vIdx] || `Variation ${vIdx + 1}`}
                                          </span>
                                          <p className="text-gray-300 font-mono text-[11px]">{vp}</p>
                                        </div>
                                        <button
                                          onClick={() => handleCopy(vp, `vp-${preset.id}-${vIdx}`)}
                                          className="text-gray-400 hover:text-white p-1 shrink-0"
                                        >
                                          {copiedKey === `vp-${preset.id}-${vIdx}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Toggle expand/collapse button */}
                          <button
                            onClick={() => setExpandedPresetId(isExpanded ? null : preset.id)}
                            className="text-[11px] text-gray-400 hover:text-purple-300 flex items-center gap-1 mb-3 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <EyeOff size={12} /> Hide Motion Prompts & Variations
                              </>
                            ) : (
                              <>
                                <Eye size={12} /> View Motion Prompts & Variations
                              </>
                            )}
                          </button>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Apply to Active Scene */}
                            {storyboard && storyboard.length > 0 && (
                              <button
                                onClick={() => {
                                  onApplyPresetToScene(selectedTargetScene, preset, applyMode);
                                  onClose();
                                }}
                                className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                title={`Apply to Scene ${selectedTargetScene + 1}`}
                              >
                                <CornerDownRight size={13} />
                                Apply to Scene {selectedTargetScene + 1}
                              </button>
                            )}

                            {/* Batch Apply to Selected Scenes */}
                            {hasSelectedScenes && (
                              <button
                                onClick={() => {
                                  onApplyPresetToSelected(preset, applyMode);
                                  onClose();
                                }}
                                className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                              >
                                <CheckCheck size={13} />
                                Apply to Selected ({selectedSceneIndices.length})
                              </button>
                            )}
                          </div>

                          {/* Insert as New Scene */}
                          <button
                            onClick={() => {
                              onInsertPresetAsScene(preset);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                            title="Add a brand new scene with this preset to the storyboard"
                          >
                            <Plus size={13} />
                            + Insert Scene
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Preset Editor / Creator Tab */
          <form onSubmit={handleSaveForm} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-5 bg-[#121212]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookmarkPlus size={18} className="text-purple-400" />
                  {editingPreset ? `Edit Preset: ${editingPreset.name}` : 'Create New Storyboard Preset'}
                </h4>
                <span className="text-xs text-gray-400">
                  Configure visual styling, motion prompts, and camera movements for reuse
                </span>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-900/30 border border-red-500/40 text-red-200 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Preset Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g., Cyberpunk Rain Anamorphic, 70s Kodachrome Roadtrip"
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-sm text-white outline-none focus:border-purple-500/60 font-medium"
                  >
                    {PRESET_CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formCategory === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Custom Category Name
                  </label>
                  <input
                    type="text"
                    value={formCustomCategory}
                    onChange={e => setFormCustomCategory(e.target.value)}
                    placeholder="e.g., My Commercial Project, Music Video Aesthetics"
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/60"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Preset Description / Aesthetic Summary
                </label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Briefly describe the visual mood, lighting, color palette, and cinematic references..."
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500/60 resize-y min-h-[60px]"
                  rows={2}
                />
              </div>

              {/* Image Generation Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-400" /> Image Generation Prompt *
                  </label>
                  <span className="text-[10px] text-gray-500">
                    Formula for generating keyframe stills in Gemini / Imagen / OpenRouter
                  </span>
                </div>
                <textarea
                  value={formImagePrompt}
                  onChange={e => setFormImagePrompt(e.target.value)}
                  placeholder="e.g., Cinematic 35mm film still, neo-noir street drenched in rain, glowing cyan and amber neon signs, anamorphic lens flare, shallow depth of field, Kodak Vision3 500T..."
                  className="w-full bg-black/50 border border-purple-500/30 rounded-xl p-3 text-xs font-mono text-gray-200 placeholder-gray-500 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 resize-y min-h-[90px] custom-scrollbar"
                  rows={3}
                  required
                />
              </div>

              {/* Sora / Master Video Prompt */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
                    <Video size={14} className="text-orange-400" /> Sora / Master Motion Video Prompt
                  </label>
                  <span className="text-[10px] text-gray-500">
                    Describes continuous motion, camera physics, and environmental dynamics
                  </span>
                </div>
                <textarea
                  value={formSoraPrompt}
                  onChange={e => setFormSoraPrompt(e.target.value)}
                  placeholder="e.g., Cinematic continuous camera push-in through rain-drenched neon metropolis. Wet asphalt mirrors vibrant signs as raindrops fall in slow motion..."
                  className="w-full bg-black/50 border border-orange-500/30 rounded-xl p-3 text-xs font-mono text-orange-100 placeholder-gray-500 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 resize-y min-h-[75px] custom-scrollbar"
                  rows={2}
                />
              </div>

              {/* Camera Movement & Transitions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1.5 flex items-center gap-1">
                    <Camera size={13} className="text-cyan-400" /> Camera Movement
                  </label>
                  <select
                    value={formCameraMovement}
                    onChange={e => setFormCameraMovement(e.target.value)}
                    className="w-full bg-black/60 border border-cyan-500/30 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400 font-medium"
                  >
                    <option value="none">Auto / Unspecified</option>
                    <optgroup label="Dolly & Push">
                      <option value="Dolly In">Dolly In (Push In)</option>
                      <option value="Dolly Out">Dolly Out (Pull Out)</option>
                    </optgroup>
                    <optgroup label="Pan & Tilt">
                      <option value="Pan Left">Pan Left</option>
                      <option value="Pan Right">Pan Right</option>
                      <option value="Tilt Up">Tilt Up</option>
                      <option value="Tilt Down">Tilt Down</option>
                    </optgroup>
                    <optgroup label="Crane & Pedestal">
                      <option value="Crane Up">Crane Up (Jib Ascend)</option>
                      <option value="Crane Down">Crane Down (Jib Descend)</option>
                    </optgroup>
                    <optgroup label="Tracking & Orbit">
                      <option value="Tracking Left">Tracking Shot Left</option>
                      <option value="Tracking Right">Tracking Shot Right</option>
                      <option value="360-Degree Arc">360° Arc / Orbit</option>
                    </optgroup>
                    <optgroup label="Dynamic & Lens">
                      <option value="Dolly Zoom">Dolly Zoom (Vertigo)</option>
                      <option value="Whip Pan">Whip Pan</option>
                      <option value="Dynamic Handheld">Dynamic Handheld</option>
                      <option value="FPV Drone Flythrough">FPV Drone Flythrough</option>
                      <option value="Zoom In">Zoom In</option>
                      <option value="Zoom Out">Zoom Out</option>
                      <option value="Static Lock-Off">Static Lock-Off</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Transition In
                  </label>
                  <select
                    value={formTransitionIn}
                    onChange={e => setFormTransitionIn(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-400 font-medium"
                  >
                    <option value="none">None</option>
                    <option value="fade">Fade</option>
                    <option value="slide-left">Slide Left</option>
                    <option value="slide-right">Slide Right</option>
                    <option value="zoom-in">Zoom In</option>
                    <option value="dissolve">Dissolve</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Transition Out
                  </label>
                  <select
                    value={formTransitionOut}
                    onChange={e => setFormTransitionOut(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-400 font-medium"
                  >
                    <option value="none">None</option>
                    <option value="fade">Fade</option>
                    <option value="slide-left">Slide Left</option>
                    <option value="slide-right">Slide Right</option>
                    <option value="zoom-out">Zoom Out</option>
                    <option value="dissolve">Dissolve</option>
                  </select>
                </div>
              </div>

              {/* Video Variations */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                  Video Variations (Optional: Subtle, Dynamic, Stylistic)
                </label>
                {['Subtle Motion', 'Dynamic Action', 'Stylistic / Experimental'].map((label, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-36 text-[11px] font-bold text-gray-400 shrink-0">
                      {label}:
                    </span>
                    <input
                      type="text"
                      value={formVideoPrompts[idx] || ''}
                      onChange={e => {
                        const copy = [...formVideoPrompts];
                        copy[idx] = e.target.value;
                        setFormVideoPrompts(copy);
                      }}
                      placeholder={`Prompt variation ${idx + 1}...`}
                      className="flex-1 bg-black/50 border border-white/15 rounded-lg p-2 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500/50"
                    />
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <Tag size={13} className="text-purple-400" /> Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  placeholder="e.g., Neo-Noir, Rain, 35mm, Anamorphic, Moody"
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            {/* Editor Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#161616] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all hover:scale-[1.02]"
              >
                {editingPreset ? 'Update Preset' : 'Save to Preset Library'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
