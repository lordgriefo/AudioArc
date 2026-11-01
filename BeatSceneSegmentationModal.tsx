import React, { useState, useMemo } from 'react';
import { 
  Scissors, Zap, Sparkles, SlidersHorizontal, X, 
  Flame, Film, Video, ArrowRight,
  ChevronDown, ChevronUp, Info, Clock
} from 'lucide-react';
import { ScenePrompt } from './App';
import { 
  AudioBeatDrop, 
  BeatSegmentationOptions, 
  previewBeatSegmentation, 
  segmentStoryboardByBeats,
  BeatSegmentationResult
} from './beatDetection';

interface BeatSceneSegmentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyboard: ScenePrompt[] | null;
  audioIntensityData: number[] | null;
  audioDuration: number;
  detectedPeaks: AudioBeatDrop[];
  onApplySegmentation: (result: BeatSegmentationResult) => void;
}

export const BeatSceneSegmentationModal: React.FC<BeatSceneSegmentationModalProps> = ({
  isOpen,
  onClose,
  storyboard,
  audioIntensityData,
  audioDuration,
  detectedPeaks,
  onApplySegmentation
}) => {
  const [minSceneDurationToSplit, setMinSceneDurationToSplit] = useState<number>(4.0);
  const [minSubClipDuration, setMinSubClipDuration] = useState<number>(1.5);
  const [sensitivity, setSensitivity] = useState<number>(50);
  const [cameraPacingVariation, setCameraPacingVariation] = useState<BeatSegmentationOptions['cameraPacingVariation']>('dynamic_kinetic');
  const [maxSplitsPerScene, setMaxSplitsPerScene] = useState<number>(1);
  const [onlySelectedScenes, setOnlySelectedScenes] = useState<boolean>(false);
  const [showUnsplitScenes, setShowUnsplitScenes] = useState<boolean>(false);

  const selectedScenesCount = useMemo(() => {
    return storyboard ? storyboard.filter(s => s.isSelected).length : 0;
  }, [storyboard]);

  const segmentationOptions: BeatSegmentationOptions = useMemo(() => ({
    minSceneDurationToSplit,
    minSubClipDuration,
    sensitivity,
    cameraPacingVariation,
    maxSplitsPerScene,
    onlySelectedScenes: onlySelectedScenes && selectedScenesCount > 0
  }), [
    minSceneDurationToSplit, 
    minSubClipDuration, 
    sensitivity, 
    cameraPacingVariation, 
    maxSplitsPerScene, 
    onlySelectedScenes, 
    selectedScenesCount
  ]);

  // Compute live preview of segmentation
  const previewItems = useMemo(() => {
    if (!storyboard || storyboard.length === 0) return [];
    return previewBeatSegmentation(
      storyboard,
      audioIntensityData,
      audioDuration,
      detectedPeaks,
      segmentationOptions
    );
  }, [storyboard, audioIntensityData, audioDuration, detectedPeaks, segmentationOptions]);

  const splitScenes = useMemo(() => {
    return previewItems.filter(p => p.willSplit);
  }, [previewItems]);

  const unsplitScenes = useMemo(() => {
    return previewItems.filter(p => !p.willSplit);
  }, [previewItems]);

  const totalNewClips = useMemo(() => {
    return splitScenes.reduce((acc, curr) => acc + (curr.resultingSubClips.length - 1), 0);
  }, [splitScenes]);

  const projectedTotalScenes = (storyboard?.length || 0) + totalNewClips;

  if (!isOpen) return null;

  const handleExecute = () => {
    if (!storyboard || storyboard.length === 0) return;
    const result = segmentStoryboardByBeats(
      storyboard,
      audioIntensityData,
      audioDuration,
      detectedPeaks,
      segmentationOptions
    );
    onApplySegmentation(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0e141d] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden text-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#121926]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-900/40">
              <Scissors size={20} className="transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white brand-font tracking-wide">
                  Beat-Driven Scene Segmentation
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-semibold">
                  Rhythmic Pacing Engine
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Automatically splits long takes into shorter rhythmic clips when significant audio intensity shifts occur.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Current Scenes</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">
                {storyboard?.length || 0}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Original storyboard</div>
            </div>

            <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3">
              <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">Eligible to Split</div>
              <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
                {splitScenes.length} <span className="text-xs font-normal text-cyan-400">scenes</span>
              </div>
              <div className="text-[10px] text-cyan-400/80 mt-0.5">Intensity shifts matched</div>
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3">
              <div className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">New Clips Added</div>
              <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                +{totalNewClips} <span className="text-xs font-normal text-amber-400">cuts</span>
              </div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">Total: {projectedTotalScenes} clips</div>
            </div>

            <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3">
              <div className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">Detected Audio Peaks</div>
              <div className="text-lg font-bold font-mono text-blue-300 mt-0.5">
                {detectedPeaks.length}
              </div>
              <div className="text-[10px] text-blue-400/80 mt-0.5">
                {detectedPeaks.filter(p => p.isDrop).length} major drops
              </div>
            </div>
          </div>

          {/* Configuration Settings */}
          <div className="bg-[#131a24] border border-white/10 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <SlidersHorizontal size={14} className="text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Segmentation Parameters & Pacing Choreography
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Minimum Scene Duration Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-medium">Minimum Scene Duration to Split</span>
                  <span className="font-mono text-cyan-300 font-bold">{minSceneDurationToSplit.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="8.0"
                  step="0.5"
                  value={minSceneDurationToSplit}
                  onChange={e => setMinSceneDurationToSplit(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] text-gray-500">
                  <span>3.0s (Split shorter scenes)</span>
                  <span>5.0s (Standard)</span>
                  <span>8.0s (Long takes only)</span>
                </div>
              </div>

              {/* Minimum Sub-Clip Duration Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-medium">Minimum Sub-Clip Duration</span>
                  <span className="font-mono text-cyan-300 font-bold">{minSubClipDuration.toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.5"
                  value={minSubClipDuration}
                  onChange={e => setMinSubClipDuration(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] text-gray-500">
                  <span>1.0s (Fast MTV-style cuts)</span>
                  <span>1.5s (Balanced)</span>
                  <span>3.0s (Gentle pacing)</span>
                </div>
              </div>

              {/* Intensity Shift Sensitivity */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-medium">Shift Detection Sensitivity</span>
                  <span className="font-mono text-cyan-300 font-bold">{sensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  step="5"
                  value={sensitivity}
                  onChange={e => setSensitivity(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[9px] text-gray-500">
                  <span>Major Drops Only (20%)</span>
                  <span>Every Dynamic Surge (90%)</span>
                </div>
              </div>

              {/* Max Splits Per Scene */}
              <div className="space-y-1.5">
                <label className="block text-xs text-gray-300 font-medium">
                  Max Splits Per Scene
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMaxSplitsPerScene(1)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      maxSplitsPerScene === 1
                        ? 'bg-cyan-950/70 border-cyan-400/70 text-cyan-200'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold">1 Split (2 Clips)</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">Cuts on single peak drop</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaxSplitsPerScene(2)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      maxSplitsPerScene === 2
                        ? 'bg-cyan-950/70 border-cyan-400/70 text-cyan-200'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-bold">2 Splits (3 Clips)</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">Buildup, drop & aftermath</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Camera Choreography Strategy */}
            <div className="pt-2 border-t border-white/5">
              <label className="block text-xs text-gray-300 font-medium mb-1.5">
                Camera Movement & Framing Strategy for Split Clips
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCameraPacingVariation('dynamic_kinetic')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    cameraPacingVariation === 'dynamic_kinetic'
                      ? 'bg-cyan-950/80 border-cyan-400/70 text-cyan-200 shadow-sm'
                      : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Video size={13} className="text-cyan-400" />
                    <span>Dynamic Kinetic</span>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1 leading-snug">
                    Tracking master shot followed by a sudden push-in crash zoom on the beat drop.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCameraPacingVariation('angle_alternation')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    cameraPacingVariation === 'angle_alternation'
                      ? 'bg-purple-950/80 border-purple-400/70 text-purple-200 shadow-sm'
                      : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Film size={13} className="text-purple-400" />
                    <span>Angle Alternation</span>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1 leading-snug">
                    Alternates wide panoramic shot with dramatic medium close-up of the performer.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCameraPacingVariation('whip_pan_action')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    cameraPacingVariation === 'whip_pan_action'
                      ? 'bg-amber-950/80 border-amber-400/70 text-amber-200 shadow-sm'
                      : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Zap size={13} className="text-amber-400" />
                    <span>Whip Pan & Action</span>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1 leading-snug">
                    Smooth dolly track transitioning into a high-speed whip pan cut on energy surge.
                  </div>
                </button>
              </div>
            </div>

            {/* Scope toggle */}
            {selectedScenesCount > 0 && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-300">
                  Target selected scenes only ({selectedScenesCount} scenes selected)
                </span>
                <input
                  type="checkbox"
                  checked={onlySelectedScenes}
                  onChange={e => setOnlySelectedScenes(e.target.checked)}
                  className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Live Preview List of Split Scenes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors size={14} className="text-cyan-400" />
                  <span>Scenes to be Segmented ({splitScenes.length})</span>
                </h3>
              </div>

              {unsplitScenes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowUnsplitScenes(!showUnsplitScenes)}
                  className="text-[11px] text-gray-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <span>{unsplitScenes.length} scenes kept intact</span>
                  {showUnsplitScenes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>

            {splitScenes.length === 0 ? (
              <div className="bg-black/30 border border-white/10 rounded-xl p-8 text-center text-gray-400 space-y-2">
                <Info size={24} className="mx-auto text-gray-500" />
                <p className="text-xs font-semibold text-gray-300">
                  No scenes meet the current split criteria.
                </p>
                <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                  Try lowering the Minimum Scene Duration to Split slider (e.g. to 3.0s) or increasing Shift Detection Sensitivity to detect more audio drops.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {splitScenes.map((item) => (
                  <div
                    key={item.originalSceneId}
                    className="bg-[#111722] border border-cyan-500/30 rounded-xl p-3.5 space-y-2.5 hover:border-cyan-500/50 transition-all shadow-sm"
                  >
                    {/* Scene Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                          Scene #{item.originalSceneIndex + 1}
                        </span>
                        <span className="text-xs text-white font-medium truncate max-w-sm">
                          &ldquo;{item.originalLyric || 'Untitled scene'}&rdquo;
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-gray-400">Original:</span>
                        <span className="text-amber-300 font-bold">{item.duration.toFixed(1)}s</span>
                        <ArrowRight size={12} className="text-gray-500" />
                        <span className="text-emerald-300 font-bold">
                          {item.resultingSubClips.length} clips
                        </span>
                      </div>
                    </div>

                    {/* Detected Intensity Shift Points */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        Triggers:
                      </span>
                      {item.shiftPoints.map((sp, sIdx) => (
                        <span
                          key={sIdx}
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                            sp.isDrop
                              ? 'bg-amber-950/60 border-amber-400/50 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                              : 'bg-cyan-950/60 border-cyan-400/40 text-cyan-300'
                          }`}
                        >
                          {sp.isDrop ? <Flame size={10} className="text-amber-400" /> : <Zap size={10} className="text-cyan-400" />}
                          <span>{sp.description}</span>
                        </span>
                      ))}
                    </div>

                    {/* Resulting Sub-Clips Breakdown Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                      {item.resultingSubClips.map((sub, subIdx) => (
                        <div
                          key={subIdx}
                          className="bg-black/50 border border-white/10 rounded-lg p-2.5 flex flex-col justify-between gap-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-cyan-300">{sub.label}</span>
                            <span className="font-mono text-gray-300 bg-white/10 px-1.5 py-0.2 rounded text-[10px]">
                              {sub.duration.toFixed(1)}s
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                            <Clock size={10} className="text-gray-500" />
                            <span>{sub.startTime} &rarr; {sub.endTime}</span>
                          </div>

                          {sub.cameraMovement && (
                            <div className="text-[9px] text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-500/20 truncate mt-0.5">
                              🎥 {sub.cameraMovement}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collapsible Unsplit Scenes */}
            {showUnsplitScenes && unsplitScenes.length > 0 && (
              <div className="pt-2 space-y-1.5 border-t border-white/10">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold px-1">
                  Scenes Remaining Intact
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {unsplitScenes.map(item => (
                    <div
                      key={item.originalSceneId}
                      className="bg-black/20 border border-white/5 rounded-lg p-2 flex items-center justify-between text-xs text-gray-400"
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono text-gray-400 mr-1.5">#{item.originalSceneIndex + 1}</span>
                        <span>{item.originalLyric || 'Scene'}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono shrink-0">
                        {item.duration.toFixed(1)}s • {item.reason || 'No shift'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/10 bg-[#121926]/90 flex-wrap gap-2">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-400" />
            <span>Full Undo (Ctrl+Z) supported after applying segmentation.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecute}
              disabled={splitScenes.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Scissors size={14} className="transform -rotate-45" />
              <span>
                {splitScenes.length > 0 
                  ? `Segment ${splitScenes.length} Scenes into ${splitScenes.length + totalNewClips} Clips`
                  : 'No Scenes to Segment'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
