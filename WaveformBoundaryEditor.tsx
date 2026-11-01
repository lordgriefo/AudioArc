import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Zap, Magnet, RotateCcw, Maximize2, Minimize2, Sparkles, Flame,
  Play, Pause, SkipBack, SkipForward, Clock, Info, Check, Scissors
} from 'lucide-react';
import { AudioBeatDrop } from './beatDetection';
import { ScenePrompt } from './App';
import { BeatMarkersOverlay, AudioIntensityWaveform } from './SnapToBeatsControl';

export interface WaveformBoundaryEditorProps {
  audioIntensityData: number[] | null;
  frequencyData: Uint8Array | null;
  audioDuration: number;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onPrevScene: () => void;
  onNextScene: () => void;
  storyboard: ScenePrompt[] | null;
  detectedPeaks: AudioBeatDrop[];
  showBeatMarkers: boolean;
  onToggleBeatMarkers: (show: boolean) => void;
  enableVisualSnapping: boolean;
  onToggleVisualSnapping: (enabled: boolean) => void;
  currentPlaybackIndex: number;
  onSeek: (seconds: number) => void;
  onJumpToScene: (index: number) => void;
  onUpdateSceneDurations: (newScenes: ScenePrompt[], affectedIndexes: number[]) => void;
  onResetSceneBoundaries: () => void;
  canResetBoundaries: boolean;
  hasManualModifications: boolean;
  onOpenBeatSegmentation?: () => void;
  uiThemeColor?: string;
  formatTime: (seconds: number) => string;
}

export const WaveformBoundaryEditor: React.FC<WaveformBoundaryEditorProps> = ({
  audioIntensityData,
  frequencyData,
  audioDuration,
  currentTime,
  isPlaying,
  onTogglePlayback,
  onPrevScene,
  onNextScene,
  storyboard,
  detectedPeaks,
  showBeatMarkers,
  onToggleBeatMarkers,
  enableVisualSnapping,
  onToggleVisualSnapping,
  currentPlaybackIndex,
  onSeek,
  onJumpToScene,
  onUpdateSceneDurations,
  onResetSceneBoundaries,
  canResetBoundaries,
  hasManualModifications,
  onOpenBeatSegmentation,
  uiThemeColor = 'from-blue-600 to-indigo-700',
  formatTime
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [justReset, setJustReset] = useState(false);

  // Dragging state
  const [draggingBoundaryIdx, setDraggingBoundaryIdx] = useState<number | null>(null);
  const [dragCurrentTime, setDragCurrentTime] = useState<number | null>(null);
  const [snappedPeak, setSnappedPeak] = useState<AudioBeatDrop | null>(null);
  const [dragPreviewScenes, setDragPreviewScenes] = useState<ScenePrompt[] | null>(null);

  const minSceneDuration = 0.5; // minimum allowed duration in seconds for any scene

  // Convert clientX to audio seconds
  const clientXToSeconds = useCallback((clientX: number): number => {
    if (!containerRef.current || audioDuration <= 0) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = relativeX / rect.width;
    return Math.max(0, Math.min(ratio * audioDuration, audioDuration));
  }, [audioDuration]);

  // Find magnetic snap peak if visual snapping is enabled
  const findSnapPeak = useCallback((targetTime: number): AudioBeatDrop | null => {
    if (!enableVisualSnapping || !detectedPeaks || detectedPeaks.length === 0) return null;
    const snapThresholdSeconds = 0.35; // Magnetism threshold window in seconds

    let closestPeak: AudioBeatDrop | null = null;
    let closestDist = Infinity;

    for (const peak of detectedPeaks) {
      const dist = Math.abs(peak.time - targetTime);
      if (dist <= snapThresholdSeconds && dist < closestDist) {
        closestDist = dist;
        closestPeak = peak;
      }
    }
    return closestPeak;
  }, [enableVisualSnapping, detectedPeaks]);

  // Start dragging a boundary handle
  const handleBoundaryDragStart = useCallback((idx: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!storyboard || idx < 0 || idx >= storyboard.length - 1 || audioDuration <= 0) return;

    setDraggingBoundaryIdx(idx);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const initialTime = clientXToSeconds(clientX);
    setDragCurrentTime(initialTime);
    setDragPreviewScenes([...storyboard]);

    const activeSnap = findSnapPeak(initialTime);
    setSnappedPeak(activeSnap);
  }, [storyboard, audioDuration, clientXToSeconds, findSnapPeak]);

  // Global mouse/touch move and up listeners for fluid dragging
  useEffect(() => {
    if (draggingBoundaryIdx === null || !storyboard || !containerRef.current) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault(); // Prevent scrolling on touch screens during drag
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const rawTime = clientXToSeconds(clientX);

      const idx = draggingBoundaryIdx;
      // Calculate start time of scene `idx` and end time of scene `idx + 1`
      let leftSceneStartTime = 0;
      for (let i = 0; i < idx; i++) {
        leftSceneStartTime += (storyboard[i].duration || 4);
      }
      const pairTotalDuration = (storyboard[idx].duration || 4) + (storyboard[idx + 1].duration || 4);
      const rightSceneEndTime = leftSceneStartTime + pairTotalDuration;

      // Constrain rawTime so neither scene is smaller than minSceneDuration
      const minCutTime = leftSceneStartTime + minSceneDuration;
      const maxCutTime = rightSceneEndTime - minSceneDuration;
      let effectiveTime = Math.max(minCutTime, Math.min(rawTime, maxCutTime));

      // Apply magnetic snapping to beat peak drops if enabled
      let activeSnap = null;
      if (enableVisualSnapping) {
        const candidateSnap = findSnapPeak(effectiveTime);
        if (candidateSnap && candidateSnap.time >= minCutTime && candidateSnap.time <= maxCutTime) {
          effectiveTime = candidateSnap.time;
          activeSnap = candidateSnap;
        }
      }

      // Round to 0.1s precision
      effectiveTime = Math.round(effectiveTime * 10) / 10;

      const newLeftDuration = Math.max(minSceneDuration, Math.round((effectiveTime - leftSceneStartTime) * 10) / 10);
      const newRightDuration = Math.max(minSceneDuration, Math.round((pairTotalDuration - newLeftDuration) * 10) / 10);

      // Create live preview
      const preview = storyboard.map((s, i) => {
        if (i === idx) return { ...s, duration: newLeftDuration };
        if (i === idx + 1) return { ...s, duration: newRightDuration };
        return { ...s };
      });

      setDragCurrentTime(effectiveTime);
      setSnappedPeak(activeSnap);
      setDragPreviewScenes(preview);
    };

    const handlePointerUp = () => {
      if (dragPreviewScenes && draggingBoundaryIdx !== null) {
        onUpdateSceneDurations(dragPreviewScenes, [draggingBoundaryIdx, draggingBoundaryIdx + 1]);
      }
      setDraggingBoundaryIdx(null);
      setDragCurrentTime(null);
      setSnappedPeak(null);
      setDragPreviewScenes(null);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchcancel', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [
    draggingBoundaryIdx, 
    storyboard, 
    clientXToSeconds, 
    enableVisualSnapping, 
    findSnapPeak, 
    dragPreviewScenes, 
    onUpdateSceneDurations
  ]);

  // Double click / double tap a boundary handle to snap to closest peak
  const handleDoubleClickBoundary = useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!storyboard || idx < 0 || idx >= storyboard.length - 1 || detectedPeaks.length === 0) return;

    let leftSceneStartTime = 0;
    for (let i = 0; i < idx; i++) {
      leftSceneStartTime += (storyboard[i].duration || 4);
    }
    const pairTotalDuration = (storyboard[idx].duration || 4) + (storyboard[idx + 1].duration || 4);
    const rightSceneEndTime = leftSceneStartTime + pairTotalDuration;
    const currentCutTime = leftSceneStartTime + (storyboard[idx].duration || 4);

    const minCutTime = leftSceneStartTime + minSceneDuration;
    const maxCutTime = rightSceneEndTime - minSceneDuration;

    // Find nearest peak within valid boundaries
    let nearestPeak: AudioBeatDrop | null = null;
    let minDiff = Infinity;

    for (const peak of detectedPeaks) {
      if (peak.time >= minCutTime && peak.time <= maxCutTime) {
        const diff = Math.abs(peak.time - currentCutTime);
        if (diff < minDiff) {
          minDiff = diff;
          nearestPeak = peak;
        }
      }
    }

    if (nearestPeak) {
      const newLeftDuration = Math.round((nearestPeak.time - leftSceneStartTime) * 10) / 10;
      const newRightDuration = Math.round((pairTotalDuration - newLeftDuration) * 10) / 10;

      const updated = storyboard.map((s, i) => {
        if (i === idx) return { ...s, duration: newLeftDuration };
        if (i === idx + 1) return { ...s, duration: newRightDuration };
        return { ...s };
      });
      onUpdateSceneDurations(updated, [idx, idx + 1]);
    }
  }, [storyboard, detectedPeaks, onUpdateSceneDurations]);

  const displayedStoryboard = dragPreviewScenes || storyboard;

  // Calculate live cumulative boundary positions for rendering
  const activeBoundaryPositions = React.useMemo(() => {
    if (!displayedStoryboard || displayedStoryboard.length <= 1 || audioDuration <= 0) return [];
    let acc = 0;
    return displayedStoryboard.slice(0, -1).map((scene, i) => {
      acc += (scene.duration || 4);
      const pct = Math.min(100, Math.max(0, (acc / audioDuration) * 100));
      return { index: i, time: acc, percent: pct };
    });
  }, [displayedStoryboard, audioDuration]);

  // Handle direct click on waveform for playback seeking (only when not dragging boundary)
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingBoundaryIdx !== null) return;
    const seconds = clientXToSeconds(e.clientX);
    onSeek(seconds);
  };

  const handleResetClick = () => {
    if (!canResetBoundaries) return;
    onResetSceneBoundaries();
    setJustReset(true);
    setTimeout(() => setJustReset(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Waveform Editor Control Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        {/* Left: Playback controls & Time */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button 
            type="button"
            onClick={onPrevScene} 
            disabled={currentPlaybackIndex === 0} 
            className="p-1.5 sm:p-2 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30 active:scale-95"
            title="Previous Scene (Skip Back)"
          > 
            <SkipBack size={13} /> 
          </button>

          <button 
            type="button"
            onClick={onTogglePlayback} 
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-transform active:scale-90 shadow-md"
            title={isPlaying ? "Pause Playback" : "Play Storyboard Audio"}
          >
            {isPlaying ? <Pause size={13} fill="currentColor"/> : <Play size={13} fill="currentColor" className="ml-0.5"/>}
          </button>

          <button 
            type="button"
            onClick={onNextScene} 
            disabled={!storyboard || currentPlaybackIndex >= storyboard.length - 1} 
            className="p-1.5 sm:p-2 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30 active:scale-95"
            title="Next Scene (Skip Forward)"
          > 
            <SkipForward size={13} /> 
          </button>

          <div className="text-[10px] sm:text-xs text-gray-400 font-mono ml-1 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
            <Clock size={11} className="text-cyan-400" />
            <span className="text-white font-semibold">{formatTime(currentTime)}</span>
            <span className="text-gray-500">/</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>

        {/* Right: Waveform Editor Toolbar Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Visual Snapping Quick Toggle */}
          <button
            type="button"
            onClick={() => onToggleVisualSnapping(!enableVisualSnapping)}
            title={
              enableVisualSnapping
                ? "Visual Snapping is ACTIVE: Dragged boundaries magnetically lock to audio peak drops. Click to disable for freehand placement."
                : "Visual Snapping is OFF: Dragged boundaries move freely without snapping to peaks. Click to enable magnetic snapping."
            }
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition-all ${
              enableVisualSnapping
                ? 'bg-cyan-950/70 border-cyan-400/60 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                : 'bg-black/40 border-white/10 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Magnet size={11} className={enableVisualSnapping ? "text-cyan-400 fill-cyan-400/20" : "text-gray-500"} />
            <span className="hidden sm:inline">Snap:</span>
            <span className={enableVisualSnapping ? "text-cyan-200 font-bold" : "text-gray-400"}>
              {enableVisualSnapping ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Reset Scene Boundaries Button */}
          <button
            id="reset-scene-boundaries-btn"
            type="button"
            onClick={handleResetClick}
            disabled={!canResetBoundaries}
            title={
              canResetBoundaries
                ? "Reset Scene Boundaries: Revert all manual cut adjustments to their last known detected state by the beat algorithm"
                : "No detected beat state to revert to (run 'Snap to Beats' first)"
            }
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all duration-200 ${
              justReset
                ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                : hasManualModifications && canResetBoundaries
                  ? 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/60 shadow-[0_0_8px_rgba(251,191,36,0.2)] active:scale-95'
                  : canResetBoundaries
                    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                    : 'bg-black/20 border-white/5 text-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            {justReset ? (
              <Check size={11} className="text-white" />
            ) : (
              <RotateCcw size={11} className={hasManualModifications ? "text-amber-400 animate-spin-once" : "text-gray-400"} />
            )}
            <span className="whitespace-nowrap">
              {justReset ? 'Reset!' : 'Reset Boundaries'}
            </span>
            {hasManualModifications && !justReset && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Manual drag modifications applied" />
            )}
          </button>

          {/* Beat-Driven Scene Segmentation Tool */}
          {onOpenBeatSegmentation && (
            <button
              id="beat-scene-segmentation-btn"
              type="button"
              onClick={onOpenBeatSegmentation}
              disabled={!storyboard || storyboard.length === 0}
              title="Beat-Driven Scene Segmentation: Automatically split long scenes at audio intensity shifts"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/90 hover:to-blue-900/90 text-cyan-200 hover:text-white transition-all shadow-[0_0_8px_rgba(34,211,238,0.15)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Scissors size={11} className="text-cyan-400 transform -rotate-45" />
              <span className="whitespace-nowrap">Beat Split</span>
            </button>
          )}

          {/* Toggle Beat Markers Visually */}
          <button
            type="button"
            onClick={() => onToggleBeatMarkers(!showBeatMarkers)}
            title={showBeatMarkers ? "Hide peak drop markers on waveform" : "Show peak drop markers on waveform"}
            className={`p-1.5 rounded-md border text-[10px] transition-colors ${
              showBeatMarkers
                ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300'
                : 'bg-black/40 border-white/10 text-gray-500 hover:text-gray-300'
            }`}
          >
            <Sparkles size={12} className={showBeatMarkers ? "text-cyan-400" : ""} />
          </button>

          {/* Expand / Minimize Waveform Height for Precision Mobile & Desktop Editing */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse waveform height" : "Expand waveform height for surgical boundary editing"}
            className="p-1.5 rounded-md bg-black/40 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Main Interactive Waveform & Scene Boundary Canvas */}
      <div 
        ref={containerRef}
        onClick={handleWaveformClick}
        className={`relative ${
          isExpanded ? 'h-28 sm:h-32' : 'h-16 sm:h-20'
        } bg-[#080d14] rounded-xl overflow-hidden border border-cyan-500/20 select-none cursor-pointer transition-all duration-200 group/waveform shadow-inner`}
      >
        {/* Waveform intensity visualizer */}
        {audioIntensityData && (
          <AudioIntensityWaveform audioIntensityData={audioIntensityData} uiThemeColor={uiThemeColor} />
        )}

        {/* Live dynamic frequency spectrum */}
        {frequencyData && (
          <div className="absolute inset-0 flex items-end justify-center gap-[1px] opacity-15 pointer-events-none">
            {Array.from({ length: 96 }).map((_, i) => (
              <div 
                key={i} 
                className="w-full bg-gradient-to-t from-cyan-500 to-amber-400" 
                style={{ 
                  height: `${(frequencyData[i] / 255) * 85}%`, 
                  opacity: `${0.3 + (frequencyData[i] / 255) * 0.7}` 
                }}
              />
            ))}
          </div>
        )}

        {/* Beat & Drop peak markers overlay */}
        <BeatMarkersOverlay
          detectedPeaks={detectedPeaks}
          audioDuration={audioDuration}
          showMarkers={showBeatMarkers}
        />

        {/* Storyboard Scene Segments Layout */}
        {displayedStoryboard && audioDuration > 0 && (
          <div className="absolute inset-0 flex pointer-events-none z-10">
            {displayedStoryboard.map((scene, i) => {
              const widthPct = Math.min(100, Math.max(0, ((scene.duration || 4) / audioDuration) * 100));
              const isActive = currentPlaybackIndex === i;
              const isBeingResized = draggingBoundaryIdx === i || draggingBoundaryIdx === i - 1;

              return (
                <div
                  key={scene.id || i}
                  style={{ width: `${widthPct}%` }}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onJumpToScene(i); 
                  }}
                  className={`h-full border-r border-white/20 transition-all pointer-events-auto relative flex flex-col justify-between p-1 overflow-hidden ${
                    isActive 
                      ? 'bg-cyan-500/20 shadow-[inset_0_0_12px_rgba(34,211,238,0.25)]' 
                      : isBeingResized
                        ? 'bg-amber-500/15'
                        : i % 2 === 0 
                          ? 'bg-white/5 hover:bg-white/12' 
                          : 'bg-white/[0.02] hover:bg-white/10'
                  }`}
                  title={`Scene ${i + 1}: "${scene.lyric || 'Untitled'}" (${(scene.duration || 4).toFixed(1)}s)`}
                >
                  {/* Top Bar: Scene number & Duration */}
                  <div className="flex items-center justify-between text-[9px] font-mono leading-none gap-1">
                    <span className={`px-1 py-0.5 rounded font-bold ${
                      isActive ? 'bg-cyan-400 text-black' : 'text-gray-300 bg-black/40'
                    }`}>
                      #{i + 1}
                    </span>
                    <span className={`font-semibold text-[8px] ${
                      isBeingResized ? 'text-amber-300 font-bold' : 'text-gray-400'
                    }`}>
                      {(scene.duration || 4).toFixed(1)}s
                    </span>
                  </div>

                  {/* Lyric Snippet on expanded or hover */}
                  {scene.lyric && (
                    <div className="text-[8px] text-gray-400 truncate opacity-60 hover:opacity-100 transition-opacity">
                      {scene.lyric}
                    </div>
                  )}

                  {/* Scene Progress indicator if active */}
                  {isActive && (
                    <div className="h-0.5 w-full bg-cyan-400/80 rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Interactive Draggable Scene Boundary Handles */}
        {displayedStoryboard && displayedStoryboard.length > 1 && audioDuration > 0 && (
          <div className="absolute inset-0 pointer-events-none z-25 overflow-visible">
            {activeBoundaryPositions.map(({ index: boundaryIdx, percent }) => {
              const isDraggingThis = draggingBoundaryIdx === boundaryIdx;

              return (
                <div
                  key={`handle-${boundaryIdx}`}
                  style={{ left: `${percent}%` }}
                  className="absolute top-0 bottom-0 pointer-events-auto"
                >
                  {/* Expanded invisible hit target for comfortable mouse and touch dragging */}
                  <div
                    onMouseDown={(e) => handleBoundaryDragStart(boundaryIdx, e)}
                    onTouchStart={(e) => handleBoundaryDragStart(boundaryIdx, e)}
                    onDoubleClick={(e) => handleDoubleClickBoundary(boundaryIdx, e)}
                    className="absolute -left-3.5 right-0 w-7 top-0 bottom-0 cursor-col-resize flex items-center justify-center group/handle z-30 touch-none"
                    title={`Drag boundary between Scene ${boundaryIdx + 1} & ${boundaryIdx + 2}. Double-click to auto-snap to nearest peak.`}
                  >
                    {/* Visual Vertical Cut Line */}
                    <div className={`w-[2px] h-full transition-all duration-150 ${
                      isDraggingThis
                        ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)] w-[3px]'
                        : 'bg-white/40 group-hover/handle:bg-cyan-400 group-hover/handle:shadow-[0_0_6px_rgba(34,211,238,0.7)] group-hover/handle:w-[2px]'
                    }`} />

                    {/* Top Diamond Grabber */}
                    <div className={`absolute top-0 w-3 h-3 -translate-y-1 rotate-45 border transition-all ${
                      isDraggingThis
                        ? 'bg-amber-400 border-white shadow-[0_0_8px_rgba(251,191,36,0.9)] scale-125'
                        : 'bg-[#141920] border-cyan-400/70 group-hover/handle:bg-cyan-400 group-hover/handle:scale-110'
                    }`} />

                    {/* Center Grip Pill (Easy mobile tap indicator) */}
                    <div className={`absolute top-1/2 -translate-y-1/2 w-2 h-5 rounded-full border transition-all ${
                      isDraggingThis
                        ? 'bg-amber-400 border-white shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                        : 'bg-black/80 border-white/30 group-hover/handle:border-cyan-400 group-hover/handle:bg-cyan-950'
                    }`} />

                    {/* Bottom Grip Marker */}
                    <div className={`absolute bottom-0 w-2.5 h-1.5 rounded-t-sm transition-all ${
                      isDraggingThis ? 'bg-amber-400' : 'bg-white/30 group-hover/handle:bg-cyan-400'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Dragging Floating Tooltip & Magnetic Snap Guideline */}
        {draggingBoundaryIdx !== null && dragCurrentTime !== null && (
          <div 
            className="absolute top-0 bottom-0 pointer-events-none z-40 transition-none"
            style={{ left: `${Math.min(100, Math.max(0, (dragCurrentTime / audioDuration) * 100))}%` }}
          >
            {/* Magnetic snap guideline */}
            <div className={`w-0.5 h-full ${
              snappedPeak?.isDrop 
                ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)]' 
                : snappedPeak 
                  ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]' 
                  : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]'
            }`} />

            {/* Floating HUD Bubble */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#0b131e] border border-cyan-400/80 rounded-lg p-2 shadow-2xl text-[10px] text-white whitespace-nowrap z-50 flex flex-col gap-1 items-center animate-in fade-in duration-75">
              <div className="flex items-center gap-2 font-mono font-bold">
                <span className="text-gray-400">Cut at</span>
                <span className="text-cyan-300 text-xs">{formatTime(dragCurrentTime)}</span>
                <span className="text-gray-400 font-normal">({dragCurrentTime.toFixed(1)}s)</span>
              </div>

              {dragPreviewScenes && (
                <div className="flex items-center gap-2 text-[9px] text-gray-300">
                  <span className="text-amber-300 font-semibold">
                    Scene #{draggingBoundaryIdx + 1}: {(dragPreviewScenes[draggingBoundaryIdx].duration || 0).toFixed(1)}s
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-blue-300 font-semibold">
                    Scene #{draggingBoundaryIdx + 2}: {(dragPreviewScenes[draggingBoundaryIdx + 1].duration || 0).toFixed(1)}s
                  </span>
                </div>
              )}

              {snappedPeak ? (
                <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  snappedPeak.isDrop 
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.3)]' 
                    : 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                }`}>
                  {snappedPeak.isDrop ? (
                    <Flame size={10} className="text-amber-400" />
                  ) : (
                    <Zap size={10} className="text-cyan-400" />
                  )}
                  <span>
                    {snappedPeak.isDrop ? '⚡ Snapped to Major Drop' : '• Snapped to Beat Peak'} ({snappedPeak.time}s)
                  </span>
                </div>
              ) : enableVisualSnapping ? (
                <div className="text-[8px] text-gray-400">
                  Move close to a beat peak to snap
                </div>
              ) : (
                <div className="text-[8px] text-gray-400 font-mono">
                  Freehand drag (Visual snapping OFF)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Red Playhead Seeker Guideline */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-35 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
          style={{ left: `${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%` }}
        >
          {/* Seeker head triangle */}
          <div className="w-2.5 h-2.5 -translate-x-[4px] bg-red-500 rotate-45 shadow-sm" />
        </div>
      </div>

      {/* Helpful Hint bar */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
        <div className="flex items-center gap-1.5">
          <Info size={11} className="text-cyan-400 shrink-0" />
          <span>
            Drag boundary handles on the waveform to retime cuts.
            {enableVisualSnapping ? ' Magnetic snapping to beat drops is ON.' : ' Freehand mode is active.'}
          </span>
        </div>
        {hasManualModifications && (
          <span className="text-amber-400/90 font-mono text-[9px] hidden sm:inline">
            Custom scene cuts active
          </span>
        )}
      </div>
    </div>
  );
};
