import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Check, 
  Search, 
  Layers, 
  Camera, 
  Sun, 
  Palette, 
  Zap, 
  Flame, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Copy, 
  Sliders,
  CheckCircle2,
  Info
} from 'lucide-react';
import { 
  PromptTag, 
  SMART_PROMPT_TAGS, 
  analyzeSceneForSuggestions, 
  toggleTagInPrompt, 
  autoEnhancePromptBundle 
} from './smartPromptEngine';

export type PromptTargetType = 'image' | 'sora' | 'video0' | 'video1' | 'video2' | 'all';

interface SmartPromptSuggestionsProps {
  scene: any;
  sceneIndex: number;
  onUpdateScene: (newScene: any) => void;
  onRequestAISuggestions?: (sceneIndex: number) => void;
  isAiGenerating?: boolean;
  customAiTags?: PromptTag[];
}

export const SmartPromptSuggestions: React.FC<SmartPromptSuggestionsProps> = ({
  scene,
  sceneIndex,
  onUpdateScene,
  onRequestAISuggestions,
  isAiGenerating = false,
  customAiTags = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('contextual');
  const [targetPrompt, setTargetPrompt] = useState<PromptTargetType>('image');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Helper to get active text from chosen target
  const getTargetPromptText = (target: PromptTargetType): string => {
    switch (target) {
      case 'image':
        return scene.imagePrompt || '';
      case 'sora':
        return scene.soraPrompt || scene.videoPrompts?.[1] || '';
      case 'video0':
        return scene.videoPrompts?.[0] || '';
      case 'video1':
        return scene.videoPrompts?.[1] || '';
      case 'video2':
        return scene.videoPrompts?.[2] || '';
      case 'all':
        return scene.imagePrompt || '';
      default:
        return scene.imagePrompt || '';
    }
  };

  // Helper to update chosen target
  const updateTargetPromptText = (target: PromptTargetType, newText: string) => {
    const updated = { ...scene };
    if (!updated.videoPrompts) {
      updated.videoPrompts = ['', '', ''];
    }

    if (target === 'image') {
      updated.imagePrompt = newText;
    } else if (target === 'sora') {
      updated.soraPrompt = newText;
    } else if (target === 'video0') {
      updated.videoPrompts[0] = newText;
    } else if (target === 'video1') {
      updated.videoPrompts[1] = newText;
    } else if (target === 'video2') {
      updated.videoPrompts[2] = newText;
    } else if (target === 'all') {
      updated.imagePrompt = newText;
      updated.soraPrompt = newText;
      updated.videoPrompts[0] = newText;
      updated.videoPrompts[1] = newText;
      updated.videoPrompts[2] = newText;
    }

    onUpdateScene(updated);
  };

  // Analyze current scene for recommendations
  const activePromptText = getTargetPromptText(targetPrompt);
  const analysis = useMemo(() => {
    return analyzeSceneForSuggestions(
      scene.description || '',
      scene.lyric || '',
      activePromptText
    );
  }, [scene.description, scene.lyric, activePromptText]);

  // Combine built-in tags with any custom AI generated tags
  const combinedContextualTags = useMemo(() => {
    const aiTags = customAiTags || [];
    const list = [...aiTags, ...analysis.contextualTags];
    // deduplicate by id/label
    const seen = new Set<string>();
    return list.filter(item => {
      const key = item.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [customAiTags, analysis.contextualTags]);

  // Filter tags based on category & search query
  const displayedTags = useMemo(() => {
    let list: PromptTag[] = [];

    if (selectedCategory === 'contextual') {
      list = combinedContextualTags;
    } else if (selectedCategory === 'all') {
      list = [...(customAiTags || []), ...SMART_PROMPT_TAGS];
    } else if (selectedCategory === 'ai') {
      list = customAiTags || [];
    } else {
      list = SMART_PROMPT_TAGS.filter(t => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.label.toLowerCase().includes(q) || 
        t.tagText.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) ||
        t.keywords?.some(k => k.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedCategory, combinedContextualTags, customAiTags, searchQuery]);

  // Handle clicking a tag
  const handleTagClick = (tag: PromptTag) => {
    if (targetPrompt === 'all') {
      // Toggle in all fields
      const resImg = toggleTagInPrompt(scene.imagePrompt || '', tag);
      const resSora = toggleTagInPrompt(scene.soraPrompt || '', tag);
      const v0 = toggleTagInPrompt(scene.videoPrompts?.[0] || '', tag);
      const v1 = toggleTagInPrompt(scene.videoPrompts?.[1] || '', tag);
      const v2 = toggleTagInPrompt(scene.videoPrompts?.[2] || '', tag);

      const updated = { ...scene };
      updated.imagePrompt = resImg.newPrompt;
      updated.soraPrompt = resSora.newPrompt;
      if (!updated.videoPrompts) updated.videoPrompts = ['', '', ''];
      updated.videoPrompts[0] = v0.newPrompt;
      updated.videoPrompts[1] = v1.newPrompt;
      updated.videoPrompts[2] = v2.newPrompt;

      onUpdateScene(updated);
      setLastActionMessage(resImg.added ? `Added "${tag.label}" to all prompts` : `Removed "${tag.label}" from all prompts`);
    } else {
      const current = getTargetPromptText(targetPrompt);
      const res = toggleTagInPrompt(current, tag);
      updateTargetPromptText(targetPrompt, res.newPrompt);
      setLastActionMessage(res.added ? `Added "${tag.label}"` : `Removed "${tag.label}"`);
    }

    setTimeout(() => setLastActionMessage(null), 3000);
  };

  // Handle Auto-Enhance Button
  const handleAutoEnhance = () => {
    const current = getTargetPromptText(targetPrompt);
    const enhanced = autoEnhancePromptBundle(current, combinedContextualTags);
    updateTargetPromptText(targetPrompt, enhanced);
    setLastActionMessage(`Auto-enhanced ${targetPrompt} prompt with cinematic stack!`);
    setTimeout(() => setLastActionMessage(null), 3500);
  };

  // Handle copy prompt
  const handleCopyPrompt = () => {
    const text = getTargetPromptText(targetPrompt);
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  // Check if a tag is active in current target prompt
  const isTagInPrompt = (tag: PromptTag) => {
    const current = getTargetPromptText(targetPrompt).toLowerCase();
    return current.includes(tag.label.toLowerCase()) || current.includes(tag.tagText.toLowerCase().slice(0, 25));
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    contextual: <Sparkles size={12} className="text-amber-400" />,
    ai: <Wand2 size={12} className="text-purple-400" />,
    lighting: <Sun size={12} className="text-yellow-400" />,
    camera: <Camera size={12} className="text-blue-400" />,
    color: <Palette size={12} className="text-pink-400" />,
    motion: <Zap size={12} className="text-cyan-400" />,
    aesthetic: <Flame size={12} className="text-orange-400" />,
    all: <Layers size={12} className="text-gray-400" />
  };

  const getTargetBadgeLabel = (t: PromptTargetType) => {
    switch (t) {
      case 'image': return 'Image Prompt';
      case 'sora': return 'Sora/Master';
      case 'video0': return 'Subtle Video';
      case 'video1': return 'Dynamic Video';
      case 'video2': return 'Stylistic Video';
      case 'all': return 'All Prompts';
    }
  };

  return (
    <div className="mt-3 bg-gradient-to-r from-purple-950/20 via-black/40 to-blue-950/20 border border-purple-500/20 rounded-lg overflow-hidden transition-all duration-200" onClick={(e) => e.stopPropagation()}>
      {/* Header Bar */}
      <div 
        className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-purple-900/40 border border-purple-500/40 text-purple-300">
            <Sparkles size={13} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-200 tracking-wide">Smart Prompt Suggestions</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full font-semibold">
                {combinedContextualTags.length} matches
              </span>
              {customAiTags && customAiTags.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full font-semibold">
                  + {customAiTags.length} AI tags
                </span>
              )}
            </div>
            {!isOpen && (
              <div className="text-[10px] text-gray-400 truncate max-w-md mt-0.5">
                Targeting: <span className="text-purple-300 font-medium">{getTargetBadgeLabel(targetPrompt)}</span> • Click to add visual style, lighting, & camera tags
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Auto-Enhance Button directly on header when collapsed */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAutoEnhance();
            }}
            className="text-[10px] px-2 py-1 bg-purple-900/50 hover:bg-purple-800/70 border border-purple-400/40 text-purple-200 rounded font-semibold flex items-center gap-1 transition-all shadow-sm"
            title="Auto-enhance prompt with 3-4 top matched cinematic tags"
          >
            <Wand2 size={10} />
            <span>Auto-Enhance</span>
          </button>

          <div className="text-gray-400 hover:text-gray-200 p-1">
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* Expanded Suggestion Panel */}
      {isOpen && (
        <div className="p-3 border-t border-white/5 space-y-3 bg-black/40">
          {/* Top Controls: Target Selector & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
            {/* Target Selector */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-gray-400 font-medium mr-1 flex items-center gap-1">
                <Sliders size={11} className="text-gray-500" /> Target:
              </span>
              {(['image', 'sora', 'video0', 'video1', 'video2', 'all'] as PromptTargetType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTargetPrompt(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    targetPrompt === t
                      ? 'bg-purple-600 text-white shadow-sm border border-purple-400/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 border border-white/5'
                  }`}
                >
                  {getTargetBadgeLabel(t)}
                </button>
              ))}
            </div>

            {/* AI Generator & Copy Buttons */}
            <div className="flex items-center gap-2">
              {onRequestAISuggestions && (
                <button
                  onClick={() => onRequestAISuggestions(sceneIndex)}
                  disabled={isAiGenerating}
                  className="px-2.5 py-1 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm border border-purple-400/30"
                  title="Generate deep bespoke AI tags tailored to this specific scene description"
                >
                  {isAiGenerating ? (
                    <RefreshCw size={11} className="animate-spin text-purple-200" />
                  ) : (
                    <Sparkles size={11} className="text-amber-300" />
                  )}
                  <span>{isAiGenerating ? 'Generating...' : 'AI Deep Tags'}</span>
                </button>
              )}

              <button
                onClick={handleCopyPrompt}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded text-[10px] font-medium flex items-center gap-1 border border-white/10 transition-colors"
                title="Copy current prompt text to clipboard"
              >
                {copiedNotification ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{copiedNotification ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Action Notification Toast */}
          {lastActionMessage && (
            <div className="px-2.5 py-1 bg-purple-900/40 border border-purple-500/40 rounded text-[11px] text-purple-200 flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 size={12} className="text-purple-300" />
              <span>{lastActionMessage}</span>
            </div>
          )}

          {/* Category Tabs & Search */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1">
              {[
                { key: 'contextual', label: 'Recommended', count: combinedContextualTags.length },
                ...(customAiTags && customAiTags.length > 0 ? [{ key: 'ai', label: 'AI Generated', count: customAiTags.length }] : []),
                { key: 'lighting', label: 'Lighting', count: analysis.categoryCounts.lighting },
                { key: 'camera', label: 'Camera', count: analysis.categoryCounts.camera },
                { key: 'color', label: 'Color/Stock', count: analysis.categoryCounts.color },
                { key: 'motion', label: 'Motion', count: analysis.categoryCounts.motion },
                { key: 'aesthetic', label: 'Aesthetic', count: analysis.categoryCounts.aesthetic },
                { key: 'all', label: 'All', count: SMART_PROMPT_TAGS.length },
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 transition-all ${
                    selectedCategory === cat.key
                      ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                      : 'bg-black/40 text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-white/5'
                  }`}
                >
                  {categoryIcons[cat.key]}
                  <span>{cat.label}</span>
                  <span className="text-[9px] opacity-70">({cat.count})</span>
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-44">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter keywords..."
                className="w-full bg-black/60 border border-white/10 rounded-full pl-6 pr-2 py-0.5 text-[10px] text-gray-300 placeholder-gray-600 outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Tag Grid / Chips */}
          <div className="max-h-52 overflow-y-auto custom-scrollbar pr-1">
            {displayedTags.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                No suggestion tags match your search or filter.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {displayedTags.map((tag) => {
                  const active = isTagInPrompt(tag);
                  return (
                    <button
                      key={tag.id || tag.label}
                      onClick={() => handleTagClick(tag)}
                      title={`${tag.description}\n\nPrompt snippet:\n"${tag.tagText}"`}
                      className={`group relative text-left px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
                        active
                          ? 'bg-purple-900/60 text-purple-100 border-purple-400 shadow-sm ring-1 ring-purple-400/40'
                          : 'bg-white/[0.04] text-gray-300 hover:bg-white/10 hover:text-white border-white/10 hover:border-purple-500/40'
                      }`}
                    >
                      <span className="shrink-0">{categoryIcons[tag.category] || <Sparkles size={11} />}</span>
                      <span className="tracking-tight">{tag.label}</span>
                      {active ? (
                        <Check size={11} className="text-purple-300 shrink-0 ml-0.5" />
                      ) : (
                        <span className="text-[9px] text-gray-500 group-hover:text-purple-300 transition-colors ml-0.5 opacity-0 group-hover:opacity-100">+</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Guide / Status */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
            <div className="flex items-center gap-1">
              <Info size={11} className="text-gray-500" />
              <span>Click a tag to toggle it in the <strong className="text-gray-400 font-semibold">{getTargetBadgeLabel(targetPrompt)}</strong>. Hover to preview exact wording.</span>
            </div>
            <button
              onClick={() => {
                const current = getTargetPromptText(targetPrompt);
                updateTargetPromptText(targetPrompt, current.trim());
              }}
              className="text-gray-500 hover:text-gray-300 underline"
            >
              Clean Spacing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
