import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Zap, Trash2, Check, SlidersHorizontal, X
} from 'lucide-react';
import { ScenePrompt } from './App';
import { 
  TransitionPreset, 
  loadTransitionPresets, 
  saveCustomTransitionPreset, 
  deleteCustomTransitionPreset, 
  applyTransitionPresetToScenes 
} from './transitionPresets';

interface TransitionPresetsSidebarProps {
  storyboard: ScenePrompt[];
  onStoryboardChange: (updated: ScenePrompt[]) => void;
  activeSceneIndex: number;
  onJumpToScene: (index: number) => void;
  onNotification?: (msg: string) => void;
}

export const TransitionPresetsSidebar: React.FC<TransitionPresetsSidebarProps> = ({
  storyboard,
  onStoryboardChange,
  activeSceneIndex,
  onJumpToScene,
  onNotification
}) => {
  const [presets, setPresets] = useState<TransitionPreset[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [recentlyAppliedId, setRecentlyAppliedId] = useState<string | null>(null);

  // Form state for creating custom preset
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDuration, setFormDuration] = useState(1.0);
  const [formTransitionIn, setFormTransitionIn] = useState('fade');
  const [formTransitionOut, setFormTransitionOut] = useState('fade');
  const [formCategory, setFormCategory] = useState<'cinematic' | 'fast-paced' | 'dramatic' | 'experimental' | 'custom'>('custom');

  useEffect(() => {
    setPresets(loadTransitionPresets());
  }, []);

  const selectedScenes = storyboard.filter(s => s.isSelected);
  const hasSelection = selectedScenes.length > 0;
  const currentScene = storyboard[activeSceneIndex] || storyboard[0];

  const handleApplyPreset = (preset: TransitionPreset, target: 'selected' | 'current' | 'all') => {
    const { updatedStoryboard, affectedCount } = applyTransitionPresetToScenes(
      storyboard,
      preset,
      target,
      activeSceneIndex
    );

    onStoryboardChange(updatedStoryboard);
    setRecentlyAppliedId(preset.id);
    setTimeout(() => setRecentlyAppliedId(null), 2000);

    const targetDesc = target === 'all' 
      ? `all ${affectedCount} scenes` 
      : target === 'selected' 
        ? `${affectedCount} selected scene${affectedCount > 1 ? 's' : ''}` 
        : `Scene ${activeSceneIndex + 1}`;

    onNotification?.(`Applied "${preset.name}" (${preset.duration}s ${preset.transitionIn}/${preset.transitionOut}) to ${targetDesc}!`);
  };

  const handleSaveCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newPreset = saveCustomTransitionPreset({
      name: formName.trim(),
      description: formDescription.trim() || `${formDuration}s custom ${formTransitionIn} in / ${formTransitionOut} out`,
      duration: Math.max(0.1, Number(formDuration.toFixed(2))),
      transitionIn: formTransitionIn,
      transitionOut: formTransitionOut,
      category: formCategory,
      color: '#ec4899'
    });

    setPresets(loadTransitionPresets());
    setShowCreateForm(false);
    setFormName('');
    setFormDescription('');
    onNotification?.(`Saved new preset: "${newPreset.name}"!`);
  };

  const handleDeletePreset = (id: string, name: string) => {
    deleteCustomTransitionPreset(id);
    setPresets(loadTransitionPresets());
    onNotification?.(`Deleted preset "${name}"`);
  };

  const filteredPresets = presets.filter(p => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transitionIn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transitionOut.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'All Presets' },
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'fast-paced', label: 'Fast-Paced' },
    { id: 'dramatic', label: 'Dramatic' },
    { id: 'custom', label: 'Custom' }
  ];

  return (
    <div className="bg-[#121217] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
            <SlidersHorizontal size={14} className="text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Transition Presets
            </h4>
            <span className="text-[10px] text-gray-400">
              Apply timing & visual cuts to storyboard
            </span>
          </div>
        </div>

        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${showCreateForm ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm' : 'bg-white/5 border-white/10 text-cyan-300 hover:bg-white/10'}`}
        >
          {showCreateForm ? <X size={12}/> : <Plus size={12}/>}
          <span>{showCreateForm ? 'Close' : 'New Preset'}</span>
        </button>
      </div>

      {/* Target Application Indicator Pill */}
      <div className={`p-2 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 ${hasSelection ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200' : 'bg-white/[0.03] border-white/10 text-gray-300'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${hasSelection ? 'bg-cyan-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className="truncate text-[11px]">
            {hasSelection ? (
              <strong>Target: {selectedScenes.length} Selected Scene{selectedScenes.length > 1 ? 's' : ''}</strong>
            ) : (
              <span>Target: <button type="button" onClick={() => onJumpToScene(activeSceneIndex)} className="font-bold underline text-cyan-300 hover:text-white" title="Jump to this scene">Scene {activeSceneIndex + 1}</button> (at Playhead)</span>
            )}
          </span>
        </div>

        {hasSelection ? (
          <button 
            onClick={() => {
              const updated = storyboard.map(s => ({ ...s, isSelected: false }));
              onStoryboardChange(updated);
            }}
            className="text-[10px] text-cyan-400 hover:text-white underline shrink-0 px-1"
          >
            Clear
          </button>
        ) : (
          <span className="text-[10px] font-mono text-gray-400 shrink-0">
            Current: {currentScene?.transitionIn || 'cut'}/{currentScene?.transitionOut || 'cut'}
          </span>
        )}
      </div>

      {/* Create Custom Preset Form */}
      {showCreateForm && (
        <form onSubmit={handleSaveCustomPreset} className="bg-black/40 border border-cyan-500/30 rounded-xl p-3 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-cyan-400" />
              <span>Create Transition Preset</span>
            </span>
            <button 
              type="button" 
              onClick={() => setShowCreateForm(false)} 
              className="text-gray-400 hover:text-white"
            >
              <X size={12}/>
            </button>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Preset Name</label>
            <input 
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g. 2.5s Cinematic Dissolve"
              className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Duration Slider + Quick Pills */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-1">
              <span className="uppercase">Transition Duration</span>
              <span className="text-cyan-400 font-mono text-xs">{formDuration.toFixed(1)}s</span>
            </div>
            <input 
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={formDuration}
              onChange={e => setFormDuration(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {[0.3, 0.5, 0.8, 1.0, 1.5, 2.0, 3.0].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setFormDuration(val)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${formDuration === val ? 'bg-cyan-500 text-black font-bold' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  {val}s
                </button>
              ))}
            </div>
          </div>

          {/* Effects Selection */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Transition In</label>
              <select 
                value={formTransitionIn}
                onChange={e => setFormTransitionIn(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-lg p-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="none">None (Hard Cut)</option>
                <option value="fade">Fade</option>
                <option value="dissolve">Dissolve</option>
                <option value="zoom-in">Zoom In</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
                <option value="glitch">Glitch</option>
                <option value="flash-white">Flash White</option>
                <option value="cross-blur">Cross Blur</option>
                <option value="whip-pan">Whip Pan</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Transition Out</label>
              <select 
                value={formTransitionOut}
                onChange={e => setFormTransitionOut(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-lg p-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="none">None (Hard Cut)</option>
                <option value="fade">Fade</option>
                <option value="dissolve">Dissolve</option>
                <option value="zoom-out">Zoom Out</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
                <option value="dip-to-black">Dip to Black</option>
                <option value="glitch">Glitch</option>
                <option value="flash-white">Flash White</option>
                <option value="cross-blur">Cross Blur</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category</label>
            <select 
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as any)}
              className="w-full bg-black/60 border border-white/15 rounded-lg p-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="cinematic">Cinematic</option>
              <option value="fast-paced">Fast-Paced</option>
              <option value="dramatic">Dramatic</option>
              <option value="experimental">Experimental</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Plus size={13}/>
            <span>Save Custom Preset</span>
          </button>
        </form>
      )}

      {/* Category Pills & Search */}
      <div className="space-y-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <input 
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search transitions (e.g. fade, cut, whip)..."
          className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Presets List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredPresets.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-xs">
            No transition presets found matching your filter.
          </div>
        ) : (
          filteredPresets.map(preset => {
            const isRecentlyApplied = recentlyAppliedId === preset.id;

            return (
              <div 
                key={preset.id}
                className={`p-2.5 rounded-xl border transition-all group ${isRecentlyApplied ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/20' : 'bg-[#181820]/80 hover:bg-[#1e1e28] border-white/10'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {preset.name}
                      </span>
                      <span className="px-1.5 py-0.2 bg-white/10 text-cyan-300 font-mono text-[9px] rounded font-bold">
                        {preset.duration}s
                      </span>
                      {preset.isBuiltin && (
                        <span className="text-[8px] uppercase tracking-wider text-gray-500 font-mono">
                          Built-in
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  {!preset.isBuiltin && (
                    <button 
                      onClick={() => handleDeletePreset(preset.id, preset.name)}
                      className="text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Custom Preset"
                    >
                      <Trash2 size={12}/>
                    </button>
                  )}
                </div>

                {/* Effect Specs & Preview Bar */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 border-t border-white/5 pt-1.5">
                  <div className="flex items-center gap-2 font-mono text-[9px]">
                    <span className="text-gray-400">IN: <strong className="text-gray-200">{preset.transitionIn.toUpperCase()}</strong></span>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-400">OUT: <strong className="text-gray-200">{preset.transitionOut.toUpperCase()}</strong></span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleApplyPreset(preset, hasSelection ? 'selected' : 'current')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${isRecentlyApplied ? 'bg-green-600 text-white' : 'bg-cyan-600/80 hover:bg-cyan-500 text-white shadow-sm'}`}
                      title={hasSelection ? `Apply to ${selectedScenes.length} selected scenes` : `Apply to Scene ${activeSceneIndex + 1}`}
                    >
                      {isRecentlyApplied ? <Check size={10} /> : <Zap size={10} />}
                      <span>{hasSelection ? `Apply (${selectedScenes.length})` : 'Apply'}</span>
                    </button>

                    <button
                      onClick={() => handleApplyPreset(preset, 'all')}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
                      title="Apply transition to all scenes in project"
                    >
                      All
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
