import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Play, Pause, RotateCcw, Maximize2, Minimize2, 
  Camera, Film, ChevronLeft, ChevronRight, 
  Type, Clock, Shield, Move, X
} from 'lucide-react';
import { ScenePrompt } from './App';
import { 
  TimelineTrack, 
  TimelineClip 
} from './multiTrackTypes';
import { 
  computeActiveComposition, 
  formatTimecode 
} from './multiTrackEngine';

interface AnimaticPreviewWindowProps {
  storyboard: ScenePrompt[];
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onJumpToScene: (index: number) => void;
  // Modes: 'docked' | 'floating' | 'fullscreen'
  mode?: 'docked' | 'floating' | 'fullscreen';
  onModeChange?: (mode: 'docked' | 'floating' | 'fullscreen') => void;
  onCloseFloating?: () => void;
  onOpenExportAnimatic?: () => void;
  aspectRatio?: '16:9' | '9:16' | '2.39:1' | '4:3' | '1:1';
  onAspectRatioChange?: (ratio: '16:9' | '9:16' | '2.39:1' | '4:3' | '1:1') => void;
}

export const AnimaticPreviewWindow: React.FC<AnimaticPreviewWindowProps> = ({
  storyboard,
  tracks,
  clips,
  currentTime,
  totalDuration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onJumpToScene,
  mode = 'docked',
  onModeChange,
  onCloseFloating,
  onOpenExportAnimatic,
  aspectRatio = '16:9',
  onAspectRatioChange
}) => {
  // HUD toggles
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showTimecodeBurnIn, setShowTimecodeBurnIn] = useState(true);
  const [showSafeGuides, setShowSafeGuides] = useState(false);
  const [enableLetterbox] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [snapshotFeedback, setSnapshotFeedback] = useState<string | null>(null);

  // Floating window position state
  const [floatingPos, setFloatingPos] = useState({ x: 24, y: 80 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active composite frame computation
  const composition = useMemo(() => {
    return computeActiveComposition(currentTime, tracks, clips, storyboard);
  }, [currentTime, tracks, clips, storyboard]);

  const activeScene = composition.currentScene;
  const activeSceneIndex = composition.activeSceneIndex;

  // Aspect ratio styling mapping
  const aspectStyleMap = {
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16] max-h-[600px]',
    '2.39:1': 'aspect-[2.39/1]',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square'
  };

  // Capture Still Frame Snapshot
  const handleCaptureSnapshot = () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      // Find active image or render placeholder
      const imgElement = container.querySelector('img.animatic-primary-frame') as HTMLImageElement | null;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 1920;
      const height = aspectRatio === '2.39:1' ? 803 : aspectRatio === '9:16' ? 3413 : 1080;
      canvas.width = width;
      canvas.height = height;

      // Draw background
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      const drawOverlaysAndDownload = () => {
        // Draw subtitle text if enabled
        if (showSubtitles && composition.activeSubtitleText) {
          ctx.font = 'bold 36px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
          ctx.shadowBlur = 8;
          ctx.fillText(composition.activeSubtitleText, width / 2, height - 120);
        }

        // Draw timecode burn-in if enabled
        if (showTimecodeBurnIn) {
          ctx.font = '24px monospace';
          ctx.fillStyle = '#fbbf24';
          ctx.textAlign = 'left';
          ctx.fillText(`TC: ${formatTimecode(currentTime, 'smpte')}`, 60, 60);
          ctx.textAlign = 'right';
          ctx.fillText(`SCENE ${(activeSceneIndex + 1).toString().padStart(2, '0')}`, width - 60, 60);
        }

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `animatic-still-scene-${activeSceneIndex + 1}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        setSnapshotFeedback('Still captured!');
        setTimeout(() => setSnapshotFeedback(null), 2500);
      };

      if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
        ctx.drawImage(imgElement, 0, 0, width, height);
        drawOverlaysAndDownload();
      } else {
        // Draw elegant slate card
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SCENE ${activeSceneIndex + 1}`, width / 2, height / 2 - 40);
        ctx.font = '28px sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(activeScene?.imagePrompt?.slice(0, 80) || 'Pre-visualization Animatic Frame', width / 2, height / 2 + 30);
        drawOverlaysAndDownload();
      }
    } catch (err) {
      console.error('Failed to capture still frame:', err);
      setSnapshotFeedback('Capture failed');
      setTimeout(() => setSnapshotFeedback(null), 2500);
    }
  };

  // Keyboard shortcut listener for spacebar playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(totalDuration, currentTime + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onSeek, currentTime, totalDuration]);

  // Floating drag handlers
  const handleDragStart = (e: React.MouseEvent) => {
    if (mode !== 'floating') return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - floatingPos.x,
      y: e.clientY - floatingPos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setFloatingPos({
        x: Math.max(10, Math.min(window.innerWidth - 440, e.clientX - dragStartRef.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 300, e.clientY - dragStartRef.current.y))
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Primary image or video source
  const primaryMediaUrl = composition.mainVisualClip?.mediaUrl || activeScene?.generatedImage || activeScene?.videoUrl;
  const isVideo = activeScene?.videoUrl || composition.mainVisualClip?.type === 'video';

  // Primary content
  const previewContent = (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-black flex items-center justify-center select-none ${aspectStyleMap[aspectRatio]} ${mode === 'fullscreen' ? 'h-full max-h-[85vh]' : ''}`}
      style={{
        filter: composition.combinedFilterCss !== 'none' ? composition.combinedFilterCss : undefined
      }}
    >
      {/* V1: Primary Layer */}
      {primaryMediaUrl ? (
        isVideo ? (
          <video 
            src={primaryMediaUrl} 
            className="w-full h-full object-contain animatic-primary-frame"
            autoPlay={isPlaying}
            muted
            loop
          />
        ) : (
          <img 
            src={primaryMediaUrl} 
            alt={activeScene?.description || `Scene ${activeSceneIndex + 1}`}
            className="w-full h-full object-contain animatic-primary-frame transition-opacity duration-200"
          />
        )
      ) : (
        /* Stylized Storyboard Animatic Slate Placeholder */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-gray-950 via-[#0e131f] to-gray-900 border border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/5">
            <Film size={32} className="text-blue-400" />
          </div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-blue-400 font-bold mb-1">
            Scene {(activeSceneIndex + 1).toString().padStart(2, '0')} Animatic Slate
          </span>
          <h4 className="text-base font-bold text-white max-w-md line-clamp-1 mb-2">
            {activeScene?.description || `Shot ${activeSceneIndex + 1}`}
          </h4>
          <p className="text-xs text-gray-400 max-w-lg line-clamp-2 italic px-4 font-serif">
            "{activeScene?.imagePrompt || 'Visual prompt generated for this shot'}"
          </p>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 font-mono">
            <span>DURATION: {activeScene?.duration || 4}s</span>
            <span>•</span>
            <span>TC: {formatTimecode(currentTime, 'compact')}</span>
          </div>
        </div>
      )}

      {/* V2: Layered B-Roll / Picture-in-Picture Cutaways */}
      {composition.cutawayClips.map((cutaway) => {
        if (!cutaway.mediaUrl) return null;
        const posClass = cutaway.pipPosition === 'top-left' ? 'top-4 left-4' :
                         cutaway.pipPosition === 'bottom-left' ? 'bottom-16 left-4' :
                         cutaway.pipPosition === 'bottom-right' ? 'bottom-16 right-4' :
                         cutaway.pipPosition === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                         cutaway.pipPosition === 'full' ? 'inset-0' : 'top-4 right-4';

        return (
          <div 
            key={cutaway.id}
            className={`absolute z-20 overflow-hidden rounded-lg shadow-2xl border border-white/20 transition-all ${posClass}`}
            style={{
              width: cutaway.pipPosition === 'full' ? '100%' : `${Math.round((cutaway.scale || 0.35) * 100)}%`,
              opacity: cutaway.opacity ?? 0.9,
              mixBlendMode: cutaway.blendMode || 'normal'
            }}
          >
            <div className="bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm border-b border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              {cutaway.name}
            </div>
            <img 
              src={cutaway.mediaUrl} 
              alt={cutaway.name}
              className="w-full aspect-video object-cover"
            />
          </div>
        );
      })}

      {/* V4: Anamorphic Letterbox Bars (Cinematic 2.39:1 scope overlay) */}
      {enableLetterbox && aspectRatio === '2.39:1' && (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between">
          <div className="w-full bg-black h-[12%]" />
          <div className="w-full bg-black h-[12%]" />
        </div>
      )}

      {/* Action & Title Safe Guides (90% / 80%) */}
      {showSafeGuides && (
        <div className="absolute inset-0 pointer-events-none z-35 flex items-center justify-center">
          {/* 90% Action Safe */}
          <div className="w-[90%] h-[90%] border border-cyan-400/40 relative">
            <span className="absolute top-1 left-1 text-[8px] font-mono text-cyan-400/70">ACTION SAFE 90%</span>
          </div>
          {/* 80% Title Safe */}
          <div className="w-[80%] h-[80%] border border-amber-400/40 relative">
            <span className="absolute top-1 left-1 text-[8px] font-mono text-amber-400/70">TITLE SAFE 80%</span>
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-cyan-400/50" />
              <div className="absolute top-1/2 left-0 -translate-y-1/2 h-px w-full bg-cyan-400/50" />
            </div>
          </div>
        </div>
      )}

      {/* V3: Live Dynamic Subtitle / Lyric Overlay */}
      {showSubtitles && composition.activeSubtitleText && (
        <div className="absolute bottom-6 inset-x-8 z-40 flex justify-center text-center pointer-events-none">
          <div className="bg-black/75 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 max-w-2xl shadow-2xl animate-in fade-in duration-200">
            <p className="text-white text-sm sm:text-base font-medium tracking-wide drop-shadow-md">
              {composition.activeSubtitleText}
            </p>
            {composition.activeVoiceoverText && composition.activeVoiceoverText !== composition.activeSubtitleText && (
              <p className="text-emerald-300 text-xs mt-1 font-mono italic">
                🎙 V.O.: "{composition.activeVoiceoverText}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* HUD: Timecode & Shot Burn-In */}
      {showTimecodeBurnIn && (
        <div className="absolute top-3 inset-x-4 z-40 flex justify-between items-start pointer-events-none">
          <div className="bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10 flex items-center gap-2 font-mono text-[10px]">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="font-bold text-amber-400 tracking-wider">
              {formatTimecode(currentTime, 'smpte')}
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-300">24.0 FPS</span>
          </div>

          <div className="bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10 flex items-center gap-2 text-[10px] font-mono">
            <span className="text-cyan-400 font-bold">
              SCENE {(activeSceneIndex + 1).toString().padStart(2, '0')}/{storyboard.length.toString().padStart(2, '0')}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-300">
              {activeScene?.duration || 4}s
            </span>
          </div>
        </div>
      )}

      {/* Snapshot Toast Feedback */}
      {snapshotFeedback && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl shadow-2xl border border-emerald-400 text-xs flex items-center gap-2 animate-in zoom-in-90 duration-150">
          <Camera size={14} />
          <span>{snapshotFeedback}</span>
        </div>
      )}
    </div>
  );

  // If floating mode, wrap with floating draggable card
  if (mode === 'floating') {
    return (
      <div 
        className="fixed z-50 w-96 shadow-2xl rounded-2xl overflow-hidden border border-cyan-500/40 bg-[#121214] flex flex-col animate-in fade-in"
        style={{ left: `${floatingPos.x}px`, top: `${floatingPos.y}px` }}
      >
        {/* Floating Header */}
        <div 
          onMouseDown={handleDragStart}
          className="bg-black/80 border-b border-white/10 px-3 py-2 flex items-center justify-between cursor-move select-none"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Film size={13} className="text-cyan-400" />
            <span>Animatic Real-Time Preview</span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onModeChange?.('docked')} 
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
              title="Dock into Studio"
            >
              <Minimize2 size={12} />
            </button>
            <button 
              onClick={() => onModeChange?.('fullscreen')} 
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
              title="Maximize Fullscreen"
            >
              <Maximize2 size={12} />
            </button>
            <button 
              onClick={onCloseFloating} 
              className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
              title="Close Floating Window"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* Video Frame */}
        {previewContent}

        {/* Floating Mini Transport Bar */}
        <div className="bg-black/90 p-2.5 border-t border-white/10 space-y-2">
          {/* Progress Slider */}
          <div className="flex items-center gap-2">
            <input 
              type="range" 
              min={0} 
              max={totalDuration || 1} 
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => onJumpToScene(Math.max(0, activeSceneIndex - 1))}
                disabled={activeSceneIndex === 0}
                className="p-1 hover:bg-white/10 rounded text-gray-300 disabled:opacity-30"
                title="Previous Scene"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={onTogglePlay} 
                className={`p-1.5 rounded-full ${isPlaying ? 'bg-amber-500 text-black' : 'bg-cyan-500 text-black'} font-bold hover:scale-105 transition-transform`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} fill="currentColor" />}
              </button>
              <button 
                onClick={() => onJumpToScene(Math.min(storyboard.length - 1, activeSceneIndex + 1))}
                disabled={activeSceneIndex >= storyboard.length - 1}
                className="p-1 hover:bg-white/10 rounded text-gray-300 disabled:opacity-30"
                title="Next Scene"
              >
                <ChevronRight size={14} />
              </button>
              <span className="text-[10px] font-mono text-gray-400 ml-1">
                {formatTimecode(currentTime, 'compact')}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={handleCaptureSnapshot} 
                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                title="Capture Still Frame"
              >
                <Camera size={13} />
              </button>
              <button 
                onClick={() => setShowSubtitles(!showSubtitles)} 
                className={`p-1 rounded text-[10px] font-bold ${showSubtitles ? 'text-cyan-400' : 'text-gray-600'}`}
                title="Toggle Subtitles"
              >
                <Type size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If fullscreen mode
  if (mode === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-[120] bg-black flex flex-col animate-in fade-in">
        {/* Fullscreen Top Bar */}
        <div className="bg-black/80 border-b border-white/10 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film size={18} className="text-cyan-400" />
            <span className="font-bold text-white text-sm tracking-wide">
              Director's Animatic Cut Preview
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
              Scene {activeSceneIndex + 1} of {storyboard.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCaptureSnapshot}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Camera size={14} />
              <span>Snapshot</span>
            </button>
            <button 
              onClick={() => onModeChange?.('docked')} 
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
              title="Exit Fullscreen"
            >
              <Minimize2 size={18} />
            </button>
          </div>
        </div>

        {/* Video viewport */}
        <div className="flex-1 flex items-center justify-center p-6 bg-[#08080a]">
          {previewContent}
        </div>

        {/* Fullscreen Transport Bar */}
        <div className="bg-black/90 border-t border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <span className="text-xs font-mono text-cyan-400 font-bold w-16 text-right">
              {formatTimecode(currentTime, 'compact')}
            </span>
            <input 
              type="range" 
              min={0} 
              max={totalDuration || 1} 
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs font-mono text-gray-400 w-16">
              {formatTimecode(totalDuration, 'compact')}
            </span>
          </div>

          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onSeek(0)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-300"
                title="Rewind to Beginning"
              >
                <RotateCcw size={16} />
              </button>
              <button 
                onClick={() => onJumpToScene(Math.max(0, activeSceneIndex - 1))}
                disabled={activeSceneIndex === 0}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-300 disabled:opacity-30"
                title="Previous Scene"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={onTogglePlay} 
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-transform active:scale-95"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                <span>{isPlaying ? 'Pause' : 'Play Animatic'}</span>
              </button>
              <button 
                onClick={() => onJumpToScene(Math.min(storyboard.length - 1, activeSceneIndex + 1))}
                disabled={activeSceneIndex >= storyboard.length - 1}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-300 disabled:opacity-30"
                title="Next Scene"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Aspect Ratio Selector */}
              <select 
                value={aspectRatio}
                onChange={(e) => onAspectRatioChange?.(e.target.value as any)}
                className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-gray-200 outline-none"
              >
                <option value="16:9">16:9 Widescreen</option>
                <option value="2.39:1">2.39:1 Scope</option>
                <option value="9:16">9:16 Vertical</option>
                <option value="4:3">4:3 Academy</option>
                <option value="1:1">1:1 Square</option>
              </select>

              <button 
                onClick={() => setShowSubtitles(!showSubtitles)} 
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${showSubtitles ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
              >
                <Type size={13} />
                <span>Lyrics</span>
              </button>

              <button 
                onClick={() => setShowTimecodeBurnIn(!showTimecodeBurnIn)} 
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${showTimecodeBurnIn ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
              >
                <Clock size={13} />
                <span>Timecode</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Docked Mode (used inside MultiTrack view or top of storyboard)
  return (
    <div className="w-full bg-[#101014] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Controls Header */}
      <div className="px-4 py-2.5 bg-black/60 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>Animatic Compositor Preview</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
            Shot {activeSceneIndex + 1}/{storyboard.length}
          </span>
        </div>

        {/* View Mode & Window Controls */}
        <div className="flex items-center gap-1.5">
          {/* Aspect Ratio */}
          <select 
            value={aspectRatio} 
            onChange={(e) => onAspectRatioChange?.(e.target.value as any)}
            className="bg-black/60 border border-white/15 rounded-md px-2 py-1 text-[11px] text-gray-300 outline-none focus:border-cyan-500"
            title="Preview Aspect Ratio"
          >
            <option value="16:9">16:9 Widescreen</option>
            <option value="2.39:1">2.39:1 Cinemascope</option>
            <option value="9:16">9:16 Vertical (Reels/Shorts)</option>
            <option value="4:3">4:3 Vintage</option>
            <option value="1:1">1:1 Square</option>
          </select>

          {/* Subtitle toggle */}
          <button 
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`p-1.5 rounded border transition-colors ${showSubtitles ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300' : 'bg-black/30 border-white/10 text-gray-500 hover:text-gray-300'}`}
            title="Toggle Subtitle / Lyric Overlay"
          >
            <Type size={13} />
          </button>

          {/* Timecode toggle */}
          <button 
            onClick={() => setShowTimecodeBurnIn(!showTimecodeBurnIn)}
            className={`p-1.5 rounded border transition-colors ${showTimecodeBurnIn ? 'bg-amber-950/60 border-amber-500/40 text-amber-300' : 'bg-black/30 border-white/10 text-gray-500 hover:text-gray-300'}`}
            title="Toggle SMPTE Timecode Burn-In"
          >
            <Clock size={13} />
          </button>

          {/* Safe Guides */}
          <button 
            onClick={() => setShowSafeGuides(!showSafeGuides)}
            className={`p-1.5 rounded border transition-colors ${showSafeGuides ? 'bg-purple-950/60 border-purple-500/40 text-purple-300' : 'bg-black/30 border-white/10 text-gray-500 hover:text-gray-300'}`}
            title="Toggle 90%/80% Title Safe Guides"
          >
            <Shield size={13} />
          </button>

          {/* Snapshot Button */}
          <button 
            onClick={handleCaptureSnapshot}
            className="p-1.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Capture Still Frame Snapshot (PNG)"
          >
            <Camera size={13} />
          </button>

          {/* Float / Picture in Picture */}
          <button 
            onClick={() => onModeChange?.('floating')}
            className="p-1.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Pop-out into Floating Window"
          >
            <Move size={13} />
          </button>

          {/* Fullscreen */}
          <button 
            onClick={() => onModeChange?.('fullscreen')}
            className="p-1.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Fullscreen Director Mode"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Canvas / Frame Viewport */}
      {previewContent}

      {/* Bottom Transport Controls Bar */}
      <div className="p-3 bg-black/80 border-t border-white/10 space-y-2">
        {/* Scrubber Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-cyan-400 font-bold min-w-[48px]">
            {formatTimecode(currentTime, 'compact')}
          </span>
          <div className="relative flex-1 flex items-center">
            <input 
              type="range" 
              min={0} 
              max={totalDuration || 1} 
              step={0.05}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
          <span className="text-[11px] font-mono text-gray-400 min-w-[48px] text-right">
            {formatTimecode(totalDuration, 'compact')}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          {/* Playback Buttons */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => onSeek(0)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Rewind to Start (Home)"
            >
              <RotateCcw size={14} />
            </button>
            <button 
              onClick={() => onJumpToScene(Math.max(0, activeSceneIndex - 1))}
              disabled={activeSceneIndex === 0}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-25 transition-colors"
              title="Previous Scene (Left Arrow)"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={onTogglePlay} 
              className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95 ${isPlaying ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-cyan-500 hover:bg-cyan-400 text-black'}`}
              title="Play / Pause Animatic (Spacebar)"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
              <span>{isPlaying ? 'Pause' : 'Play Animatic'}</span>
            </button>
            <button 
              onClick={() => onJumpToScene(Math.min(storyboard.length - 1, activeSceneIndex + 1))}
              disabled={activeSceneIndex >= storyboard.length - 1}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-25 transition-colors"
              title="Next Scene (Right Arrow)"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Info & Export Shortcut */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : playbackSpeed === 2 ? 0.5 : 1;
                setPlaybackSpeed(nextSpeed);
              }}
              className="text-[11px] text-gray-400 hover:text-cyan-300 font-mono hidden md:inline px-2 py-0.5 rounded bg-white/5 border border-white/10"
              title="Click to cycle playback speed (0.5x, 1x, 1.5x, 2x)"
            >
              Speed: {playbackSpeed}x
            </button>
            {onOpenExportAnimatic && (
              <button 
                onClick={onOpenExportAnimatic}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Export Animatic Video Recording"
              >
                <Film size={12} />
                <span>Export Video</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
