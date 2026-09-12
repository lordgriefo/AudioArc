import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Eye, EyeOff, Volume2, VolumeX, Lock, Unlock, 
  Trash2, Copy, Scissors, ZoomIn, ZoomOut, Magnet, 
  Zap, Film, Layers, Type, Palette, Music, Mic, 
  Play, Pause, RefreshCw, X
} from 'lucide-react';
import { ScenePrompt, VisualReference } from './App';
import { 
  TimelineTrack, 
  TimelineClip, 
  MultiTrackProject, 
  TrackType, 
  BlendMode
} from './multiTrackTypes';
import { 
  formatTimecode, 
  snapTimeToGrid, 
  syncTimelineV1ToStoryboard 
} from './multiTrackEngine';
import { AudioBeatDrop } from './beatDetection';

interface MultiTrackTimelineProps {
  project: MultiTrackProject;
  onProjectChange: (updatedProject: MultiTrackProject) => void;
  storyboard: ScenePrompt[];
  onStoryboardChange: (updatedStoryboard: ScenePrompt[]) => void;
  audioUrl: string | null;
  audioDuration: number;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  audioIntensityData: number[] | null;
  detectedBeatDrops: AudioBeatDrop[];
  visualRefs?: VisualReference[];
  onNotification?: (msg: string) => void;
}

export const MultiTrackTimeline: React.FC<MultiTrackTimelineProps> = ({
  project,
  onProjectChange,
  storyboard,
  onStoryboardChange,
  audioUrl,
  audioDuration,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  audioIntensityData,
  detectedBeatDrops,
  visualRefs,
  onNotification
}) => {
  const { tracks, clips, zoom, snapToGrid, snapGridSeconds, snapToBeats } = project;

  // Selected clip for inspector
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  
  // Dragging / Resizing state
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [resizingClipId, setResizingClipId] = useState<string | null>(null);
  const dragStartInfo = useRef<{ initialX: number; initialStartTime: number; initialDuration: number } | null>(null);

  // Ruler scrubbing state
  const isScrubbingRuler = useRef(false);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  // Total timeline duration
  const totalTimelineDuration = useMemo(() => {
    const maxClipEnd = clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
    const sbTotal = storyboard.reduce((sum, s) => sum + (s.duration || 4), 0);
    return Math.max(audioDuration || 0, maxClipEnd, sbTotal, 30);
  }, [clips, storyboard, audioDuration]);

  const timelinePixelWidth = totalTimelineDuration * zoom;

  // Auto-scroll timeline to follow playhead when playing
  useEffect(() => {
    if (!isPlaying || !timelineScrollRef.current) return;
    const playheadPx = currentTime * zoom;
    const scrollContainer = timelineScrollRef.current;
    const containerWidth = scrollContainer.clientWidth;
    const currentScroll = scrollContainer.scrollLeft;

    if (playheadPx > currentScroll + containerWidth - 100 || playheadPx < currentScroll) {
      scrollContainer.scrollLeft = Math.max(0, playheadPx - 80);
    }
  }, [currentTime, isPlaying, zoom]);

  // Selected Clip object
  const selectedClip = useMemo(() => {
    return clips.find(c => c.id === selectedClipId) || null;
  }, [clips, selectedClipId]);

  // Track manipulation handlers
  const handleToggleTrackVisibility = (trackId: string) => {
    const updated = tracks.map(t => t.id === trackId ? { ...t, isVisible: !t.isVisible } : t);
    onProjectChange({ ...project, tracks: updated });
  };

  const handleToggleTrackMute = (trackId: string) => {
    const updated = tracks.map(t => t.id === trackId ? { ...t, isMuted: !t.isMuted } : t);
    onProjectChange({ ...project, tracks: updated });
  };

  const handleToggleTrackSolo = (trackId: string) => {
    const updated = tracks.map(t => t.id === trackId ? { ...t, isSolo: !t.isSolo } : t);
    onProjectChange({ ...project, tracks: updated });
  };

  const handleToggleTrackLock = (trackId: string) => {
    const updated = tracks.map(t => t.id === trackId ? { ...t, isLocked: !t.isLocked } : t);
    onProjectChange({ ...project, tracks: updated });
  };

  const handleTrackOpacityChange = (trackId: string, opacity: number) => {
    const updated = tracks.map(t => t.id === trackId ? { ...t, opacity } : t);
    onProjectChange({ ...project, tracks: updated });
  };

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    const updated = tracks.map(t => t.id === trackId ? { ...t, volume } : t);
    onProjectChange({ ...project, tracks: updated });
  };

  // Zoom controls
  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(16, Math.min(160, newZoom));
    onProjectChange({ ...project, zoom: clamped });
  };

  // Sync V1 to Storyboard
  const handleSyncV1ToStoryboard = () => {
    const updatedStoryboard = syncTimelineV1ToStoryboard(clips, storyboard);
    onStoryboardChange(updatedStoryboard);
    onNotification?.('Storyboard scene durations synced with V1 timeline cuts!');
  };

  // Ruler Scrubbing
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isScrubbingRuler.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetTime = Math.max(0, Math.min(totalTimelineDuration, clickX / zoom));
    const snapped = snapToGrid ? snapTimeToGrid(targetTime, snapGridSeconds, detectedBeatDrops, snapToBeats) : targetTime;
    onSeek(snapped);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbingRuler.current && timelineScrollRef.current) {
        const rect = timelineScrollRef.current.getBoundingClientRect();
        const scrollLeft = timelineScrollRef.current.scrollLeft;
        const clickX = (e.clientX - rect.left) + scrollLeft;
        const targetTime = Math.max(0, Math.min(totalTimelineDuration, clickX / zoom));
        const snapped = snapToGrid ? snapTimeToGrid(targetTime, snapGridSeconds, detectedBeatDrops, snapToBeats) : targetTime;
        onSeek(snapped);
      }

      // Clip move dragging
      if (draggingClipId && dragStartInfo.current) {
        const deltaPx = e.clientX - dragStartInfo.current.initialX;
        const deltaTime = deltaPx / zoom;
        let newStartTime = Math.max(0, dragStartInfo.current.initialStartTime + deltaTime);
        if (snapToGrid) {
          newStartTime = snapTimeToGrid(newStartTime, snapGridSeconds, detectedBeatDrops, snapToBeats);
        }

        const updatedClips = clips.map(c => {
          if (c.id === draggingClipId) {
            return { ...c, startTime: Math.round(newStartTime * 100) / 100 };
          }
          return c;
        });
        onProjectChange({ ...project, clips: updatedClips });
      }

      // Clip duration resizing
      if (resizingClipId && dragStartInfo.current) {
        const deltaPx = e.clientX - dragStartInfo.current.initialX;
        const deltaTime = deltaPx / zoom;
        let newDuration = Math.max(0.5, dragStartInfo.current.initialDuration + deltaTime);
        if (snapToGrid) {
          newDuration = Math.max(0.5, Math.round(newDuration / snapGridSeconds) * snapGridSeconds);
        }

        const updatedClips = clips.map(c => {
          if (c.id === resizingClipId) {
            return { ...c, duration: Math.round(newDuration * 100) / 100 };
          }
          return c;
        });
        onProjectChange({ ...project, clips: updatedClips });
      }
    };

    const handleMouseUp = () => {
      if (isScrubbingRuler.current) {
        isScrubbingRuler.current = false;
      }
      if (draggingClipId || resizingClipId) {
        setDraggingClipId(null);
        setResizingClipId(null);
        dragStartInfo.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingClipId, resizingClipId, zoom, clips, project, totalTimelineDuration, onProjectChange, onSeek, snapToGrid, snapGridSeconds, snapToBeats, detectedBeatDrops]);

  // Clip Click & Selection
  const handleClipMouseDown = (e: React.MouseEvent, clip: TimelineClip) => {
    e.stopPropagation();
    setSelectedClipId(clip.id);

    const track = tracks.find(t => t.id === clip.trackId);
    if (track?.isLocked || clip.isLocked) return;

    setDraggingClipId(clip.id);
    dragStartInfo.current = {
      initialX: e.clientX,
      initialStartTime: clip.startTime,
      initialDuration: clip.duration
    };
  };

  const handleResizeHandleMouseDown = (e: React.MouseEvent, clip: TimelineClip) => {
    e.stopPropagation();
    const track = tracks.find(t => t.id === clip.trackId);
    if (track?.isLocked || clip.isLocked) return;

    setResizingClipId(clip.id);
    dragStartInfo.current = {
      initialX: e.clientX,
      initialStartTime: clip.startTime,
      initialDuration: clip.duration
    };
  };

  // Split Clip at Playhead
  const handleSplitClipAtPlayhead = () => {
    if (!selectedClip) return;
    if (currentTime <= selectedClip.startTime || currentTime >= selectedClip.startTime + selectedClip.duration) {
      onNotification?.('Playhead must be positioned inside the selected clip to split.');
      return;
    }

    const firstDuration = currentTime - selectedClip.startTime;
    const secondDuration = selectedClip.duration - firstDuration;

    const firstHalf: TimelineClip = {
      ...selectedClip,
      duration: Math.round(firstDuration * 100) / 100
    };

    const secondHalf: TimelineClip = {
      ...selectedClip,
      id: `clip-split-${Date.now()}`,
      name: `${selectedClip.name} (Part 2)`,
      startTime: Math.round(currentTime * 100) / 100,
      duration: Math.round(secondDuration * 100) / 100
    };

    const updatedClips = clips.flatMap(c => c.id === selectedClip.id ? [firstHalf, secondHalf] : [c]);
    onProjectChange({ ...project, clips: updatedClips });
    setSelectedClipId(secondHalf.id);
    onNotification?.(`Split clip at ${formatTimecode(currentTime, 'compact')}`);
  };

  // Duplicate Clip
  const handleDuplicateClip = () => {
    if (!selectedClip) return;
    const newClip: TimelineClip = {
      ...selectedClip,
      id: `clip-dup-${Date.now()}`,
      name: `${selectedClip.name} (Copy)`,
      startTime: Math.round((selectedClip.startTime + selectedClip.duration + 0.5) * 100) / 100
    };
    onProjectChange({ ...project, clips: [...clips, newClip] });
    setSelectedClipId(newClip.id);
    onNotification?.('Clip duplicated on track!');
  };

  // Delete Clip
  const handleDeleteClip = () => {
    if (!selectedClip) return;
    if (selectedClip.trackId === 'track-v1-main') {
      onNotification?.('Primary storyboard clips are linked to storyboard scenes. Durations can be trimmed instead.');
    }
    const updatedClips = clips.filter(c => c.id !== selectedClip.id);
    onProjectChange({ ...project, clips: updatedClips });
    setSelectedClipId(null);
    onNotification?.('Clip removed from timeline.');
  };

  // Add a new clip to selected track
  const handleAddClipToTrack = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    let newClip: TimelineClip;

    if (track.role === 'titles') {
      newClip = {
        id: `clip-title-${Date.now()}`,
        trackId,
        name: 'Scene Title Overlay',
        startTime: currentTime,
        duration: 3,
        type: 'text',
        text: 'CINEMATIC SCENE TITLE',
        textRole: 'title',
        textPosition: 'center',
        textColor: '#ffffff',
        textBg: true,
        fontSize: 24,
        color: '#db2777',
        opacity: 1
      };
    } else if (track.role === 'cutaway') {
      const firstRefImg = visualRefs?.find(r => r.image)?.image;
      newClip = {
        id: `clip-cutaway-${Date.now()}`,
        trackId,
        name: 'B-Roll Cutaway',
        startTime: currentTime,
        duration: 2.5,
        type: 'image',
        mediaUrl: firstRefImg || undefined,
        opacity: 0.85,
        blendMode: 'normal',
        pipPosition: 'top-right',
        scale: 0.35,
        color: '#7c3aed'
      };
    } else if (track.role === 'filter') {
      newClip = {
        id: `clip-filter-${Date.now()}`,
        trackId,
        name: 'Warm Retro Film Look',
        startTime: currentTime,
        duration: 5,
        type: 'filter',
        filterStyle: 'sepia(0.35) contrast(1.15) brightness(0.95)',
        filterName: 'Vintage Kodak Emulation',
        color: '#d97706',
        opacity: 1
      };
    } else {
      newClip = {
        id: `clip-cue-${Date.now()}`,
        trackId,
        name: 'Audio SFX Impact',
        startTime: currentTime,
        duration: 2,
        type: 'audio',
        audioVolume: 1,
        color: '#eab308',
        opacity: 1
      };
    }

    onProjectChange({ ...project, clips: [...clips, newClip] });
    setSelectedClipId(newClip.id);
    onNotification?.(`Added clip to ${track.name}`);
  };

  // Add a new track
  const handleAddNewTrack = (type: TrackType) => {
    const id = `track-${type}-${Date.now()}`;
    const newTrack: TimelineTrack = {
      id,
      name: type === 'visual' ? `V${tracks.filter(t => t.type === 'visual').length + 1}: Custom Overlay` : `A${tracks.filter(t => t.type === 'audio').length + 1}: Custom Audio`,
      type,
      role: type === 'visual' ? 'cutaway' : 'sfx',
      order: tracks.length,
      height: 52,
      color: type === 'visual' ? '#8b5cf6' : '#10b981',
      isMuted: false,
      isSolo: false,
      isLocked: false,
      isVisible: true,
      volume: 1,
      opacity: 1,
      iconName: type === 'visual' ? 'Layers' : 'Volume2'
    };
    onProjectChange({ ...project, tracks: [...tracks, newTrack] });
    onNotification?.(`Created new ${type} track!`);
  };

  // Ruler tick marks calculation
  const rulerTicks = useMemo(() => {
    const ticks: { time: number; label: string; isMajor: boolean }[] = [];
    const step = zoom >= 60 ? 1 : zoom >= 30 ? 2 : 5;
    for (let t = 0; t <= totalTimelineDuration + 10; t += step) {
      ticks.push({
        time: t,
        label: formatTimecode(t, 'compact'),
        isMajor: t % (step * 2) === 0
      });
    }
    return ticks;
  }, [totalTimelineDuration, zoom]);

  // Track icon helper
  const getTrackIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film': return <Film size={13} className="text-blue-400" />;
      case 'Layers': return <Layers size={13} className="text-purple-400" />;
      case 'Type': return <Type size={13} className="text-pink-400" />;
      case 'Palette': return <Palette size={13} className="text-amber-400" />;
      case 'Music': return <Music size={13} className="text-cyan-400" />;
      case 'Mic': return <Mic size={13} className="text-emerald-400" />;
      default: return <Volume2 size={13} className="text-yellow-400" />;
    }
  };

  return (
    <div className="w-full bg-[#0e0e12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col select-none">
      {/* 1. Timeline Top Bar (Toolbar, Zoom, Snapping, Actions) */}
      <div className="px-4 py-3 bg-black/70 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
        {/* Left: Section Title & Sync Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Multi-Track Storyboard Timeline
            </h3>
          </div>
          
          <button 
            onClick={handleSyncV1ToStoryboard}
            className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-500/40 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 shadow-sm"
            title="Sync trimmed V1 timeline scene durations back to Storyboard"
          >
            <RefreshCw size={11} />
            <span>Sync to Storyboard</span>
          </button>

          {/* Quick Play/Pause & Audio Status */}
          <button
            onClick={onTogglePlay}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 transition-all ${isPlaying ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30'}`}
            title="Play / Pause Timeline Scrubber"
          >
            {isPlaying ? <Pause size={11} /> : <Play size={11} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {audioUrl && (
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1" title="Audio track synced">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Audio Track Active
            </span>
          )}
        </div>

        {/* Center: Editing Actions (Split, Duplicate, Delete) */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
          <button 
            onClick={handleSplitClipAtPlayhead}
            disabled={!selectedClip}
            className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white disabled:opacity-30 transition-colors"
            title="Split Selected Clip at Playhead (Scissors)"
          >
            <Scissors size={13} />
          </button>
          <button 
            onClick={handleDuplicateClip}
            disabled={!selectedClip}
            className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white disabled:opacity-30 transition-colors"
            title="Duplicate Selected Clip"
          >
            <Copy size={13} />
          </button>
          <button 
            onClick={handleDeleteClip}
            disabled={!selectedClip}
            className="p-1.5 hover:bg-red-500/20 rounded text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors"
            title="Delete Selected Clip"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Right: Zoom & Snapping Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Snapping toggles */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            <button 
              onClick={() => onProjectChange({ ...project, snapToGrid: !snapToGrid })}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${snapToGrid ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300' : 'text-gray-400 hover:text-white'}`}
              title="Snap clips to grid increments"
            >
              <Magnet size={11} />
              <span>Grid ({snapGridSeconds}s)</span>
            </button>
            <button 
              onClick={() => onProjectChange({ ...project, snapToBeats: !snapToBeats })}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${snapToBeats ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300' : 'text-gray-400 hover:text-white'}`}
              title="Snap cuts to detected audio beat drops"
            >
              <Zap size={11} />
              <span>Beats</span>
            </button>
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-1.5 text-gray-400">
            <button 
              onClick={() => handleZoomChange(zoom - 10)}
              className="p-1 hover:bg-white/10 rounded text-gray-300"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <input 
              type="range" 
              min={16} 
              max={140} 
              step={4}
              value={zoom}
              onChange={(e) => handleZoomChange(parseInt(e.target.value))}
              className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title={`Zoom: ${zoom}px/sec`}
            />
            <button 
              onClick={() => handleZoomChange(zoom + 10)}
              className="p-1 hover:bg-white/10 rounded text-gray-300"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Add Track Menu */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => handleAddNewTrack('visual')}
              className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-500/30 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
              title="Add a new Visual Layer Track"
            >
              <Plus size={10} />
              <span>+ V-Track</span>
            </button>
            <button 
              onClick={() => handleAddNewTrack('audio')}
              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-1"
              title="Add a new Audio Track"
            >
              <Plus size={10} />
              <span>+ A-Track</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Timeline Body: Left Track Headers + Right Scrollable Lanes */}
      <div className="flex w-full overflow-hidden relative">
        {/* LEFT COLUMN: Track Headers */}
        <div className="w-56 shrink-0 bg-[#121217] border-r border-white/10 flex flex-col z-20 shadow-lg">
          {/* Top ruler placeholder header */}
          <div className="h-8 bg-black/80 border-b border-white/10 px-3 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>TRACK CONTROLS</span>
            <span>M / S / L</span>
          </div>

          {/* Track Headers Stack */}
          <div className="flex flex-col">
            {tracks.map((track) => (
              <div 
                key={track.id}
                className="border-b border-white/5 px-2.5 py-1.5 flex flex-col justify-between hover:bg-white/[0.02] transition-colors relative group"
                style={{ height: `${track.height || 54}px` }}
              >
                {/* Left vertical color accent bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1" 
                  style={{ backgroundColor: track.color }}
                />

                {/* Track Title and Role */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {getTrackIcon(track.iconName)}
                    <span className="text-[11px] font-bold text-gray-200 truncate" title={track.name}>
                      {track.name}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleAddClipToTrack(track.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded text-gray-400 hover:text-white text-[9px] transition-opacity"
                    title={`Add clip to ${track.name}`}
                  >
                    <Plus size={11} />
                  </button>
                </div>

                {/* Track Control Buttons (Mute, Solo, Lock, Visibility, Slider) */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  <div className="flex items-center gap-1">
                    {/* Visibility or Mute */}
                    {track.type === 'visual' ? (
                      <button 
                        onClick={() => handleToggleTrackVisibility(track.id)}
                        className={`p-1 rounded text-[9px] ${track.isVisible ? 'text-gray-400 hover:text-white' : 'text-red-400 bg-red-950/40'}`}
                        title={track.isVisible ? 'Hide Track' : 'Show Track'}
                      >
                        {track.isVisible ? <Eye size={11} /> : <EyeOff size={11} />}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleToggleTrackMute(track.id)}
                        className={`p-1 rounded text-[9px] ${track.isMuted ? 'text-red-400 bg-red-950/40' : 'text-gray-400 hover:text-white'}`}
                        title={track.isMuted ? 'Unmute Track' : 'Mute Track'}
                      >
                        {track.isMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                      </button>
                    )}

                    {/* Solo */}
                    <button 
                      onClick={() => handleToggleTrackSolo(track.id)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition-colors ${track.isSolo ? 'bg-amber-500 text-black font-extrabold' : 'text-gray-500 hover:text-gray-300'}`}
                      title="Solo Track"
                    >
                      S
                    </button>

                    {/* Lock */}
                    <button 
                      onClick={() => handleToggleTrackLock(track.id)}
                      className={`p-1 rounded text-[9px] ${track.isLocked ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
                      title={track.isLocked ? 'Unlock Track' : 'Lock Track'}
                    >
                      {track.isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                    </button>
                  </div>

                  {/* Level Slider */}
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] text-gray-500 font-mono">
                      {track.type === 'visual' ? `${Math.round(track.opacity * 100)}%` : `${Math.round(track.volume * 100)}%`}
                    </span>
                    <input 
                      type="range" 
                      min={0} 
                      max={1} 
                      step={0.05}
                      value={track.type === 'visual' ? track.opacity : track.volume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (track.type === 'visual') handleTrackOpacityChange(track.id, val);
                        else handleTrackVolumeChange(track.id, val);
                      }}
                      className="w-12 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Scrollable Ruler & Track Lanes Canvas */}
        <div 
          ref={timelineScrollRef}
          className="flex-1 overflow-x-auto custom-scrollbar relative bg-[#09090c]"
          style={{ minHeight: '360px' }}
        >
          {/* Inner Content Area sized by timelinePixelWidth */}
          <div 
            className="relative"
            style={{ width: `${Math.max(800, timelinePixelWidth)}px` }}
          >
            {/* Top Ruler Header */}
            <div 
              onMouseDown={handleRulerMouseDown}
              className="h-8 bg-black/90 border-b border-white/10 relative cursor-pointer select-none"
            >
              {/* Ruler ticks */}
              {rulerTicks.map((tick) => (
                <div 
                  key={tick.time}
                  className="absolute top-0 bottom-0 flex flex-col justify-end pointer-events-none"
                  style={{ left: `${tick.time * zoom}px` }}
                >
                  <span className={`text-[9px] font-mono pl-1 ${tick.isMajor ? 'text-gray-300 font-bold' : 'text-gray-600'}`}>
                    {tick.label}
                  </span>
                  <div className={`w-px ${tick.isMajor ? 'h-3 bg-white/40' : 'h-1.5 bg-white/15'}`} />
                </div>
              ))}

              {/* Detected Audio Beat Markers on Ruler */}
              {detectedBeatDrops.map((drop, idx) => (
                <div 
                  key={idx}
                  className="absolute top-0 bottom-0 flex flex-col items-center pointer-events-none"
                  style={{ left: `${drop.time * zoom}px` }}
                  title={`Beat Drop: ${drop.time.toFixed(2)}s`}
                >
                  <Zap size={9} className="text-amber-400 fill-amber-400" />
                  <div className="w-px h-full bg-amber-500/30" />
                </div>
              ))}
            </div>

            {/* Track Lanes */}
            <div className="flex flex-col relative">
              {tracks.map((track) => {
                const trackClips = clips.filter(c => c.trackId === track.id);

                return (
                  <div 
                    key={track.id}
                    className="border-b border-white/5 relative group hover:bg-white/[0.01] transition-colors"
                    style={{ height: `${track.height || 54}px` }}
                  >
                    {/* Subtle grid lines */}
                    {rulerTicks.filter(t => t.isMajor).map(t => (
                      <div 
                        key={t.time}
                        className="absolute top-0 bottom-0 w-px bg-white/[0.03] pointer-events-none"
                        style={{ left: `${t.time * zoom}px` }}
                      />
                    ))}

                    {/* Master Audio Track Waveform Display */}
                    {track.id === 'track-a1-music' && audioIntensityData && audioIntensityData.length > 0 && (
                      <div className="absolute inset-x-0 inset-y-1 opacity-40 pointer-events-none flex items-center overflow-hidden">
                        {audioIntensityData.map((val, idx) => {
                          const pxPos = (idx * 0.1) * zoom;
                          if (pxPos > timelinePixelWidth) return null;
                          const heightPct = Math.min(100, Math.max(8, (val / 255) * 100));
                          return (
                            <div 
                              key={idx}
                              className="w-1 bg-cyan-400 rounded-sm mx-[0.5px]"
                              style={{ 
                                height: `${heightPct}%`,
                                left: `${pxPos}px`,
                                position: 'absolute'
                              }}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Track Clips */}
                    {trackClips.map((clip) => {
                      const isSelected = clip.id === selectedClipId;
                      const clipLeft = clip.startTime * zoom;
                      const clipWidth = Math.max(16, clip.duration * zoom);

                      return (
                        <div 
                          key={clip.id}
                          onMouseDown={(e) => handleClipMouseDown(e, clip)}
                          className={`absolute top-1 bottom-1 rounded-lg border flex items-center overflow-hidden cursor-move transition-shadow ${
                            isSelected 
                              ? 'ring-2 ring-white border-white shadow-xl z-10' 
                              : 'border-white/20 hover:border-white/40 shadow-sm'
                          }`}
                          style={{
                            left: `${clipLeft}px`,
                            width: `${clipWidth}px`,
                            backgroundColor: `${clip.color}33`, // 20% opacity bg
                            borderColor: clip.color
                          }}
                        >
                          {/* Left Color Indicator Bar */}
                          <div 
                            className="w-1.5 h-full shrink-0" 
                            style={{ backgroundColor: clip.color }} 
                          />

                          {/* Clip Thumbnail or Content Preview */}
                          {clip.mediaUrl && (
                            <img 
                              src={clip.mediaUrl} 
                              alt={clip.name}
                              className="w-12 h-full object-cover shrink-0 opacity-80 pointer-events-none"
                            />
                          )}

                          {/* Clip Label */}
                          <div className="px-2 py-0.5 overflow-hidden flex-1 flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-white truncate leading-tight">
                              {clip.name}
                            </span>
                            <span className="text-[8px] font-mono text-gray-300/80 truncate">
                              {clip.duration.toFixed(1)}s • {formatTimecode(clip.startTime, 'compact')}
                            </span>
                          </div>

                          {/* Right Resize Handle */}
                          {!track.isLocked && !clip.isLocked && (
                            <div 
                              onMouseDown={(e) => handleResizeHandleMouseDown(e, clip)}
                              className="w-2.5 h-full cursor-ew-resize hover:bg-white/40 transition-colors shrink-0 flex items-center justify-center group/handle"
                              title="Drag to trim duration"
                            >
                              <div className="w-0.5 h-4 bg-white/40 group-hover/handle:bg-white rounded" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* REAL-TIME PLAYHEAD SCRUBBER (Red / Cyan vertical indicator) */}
              <div 
                className="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center"
                style={{ 
                  left: `${currentTime * zoom}px`,
                  transition: isPlaying ? 'none' : 'left 0.05s ease-out'
                }}
              >
                {/* Top playhead handle */}
                <div className="w-3.5 h-3.5 bg-cyan-400 rotate-45 -mt-1.5 shadow-lg shadow-cyan-400/50 flex items-center justify-center">
                  <div className="w-1 h-1 bg-black rounded-full" />
                </div>
                {/* Vertical playhead line */}
                <div className="w-0.5 flex-1 bg-gradient-to-b from-cyan-400 via-cyan-400 to-transparent shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Clip Inspector Drawer / Details Panel (Shows when a clip is selected) */}
      {selectedClip && (
        <div className="p-3 bg-black/90 border-t border-white/10 flex items-center justify-between flex-wrap gap-3 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedClip.color }} 
            />
            <div>
              <span className="text-xs font-bold text-white">
                {selectedClip.name}
              </span>
              <span className="text-[10px] text-gray-400 font-mono ml-2">
                Start: {formatTimecode(selectedClip.startTime, 'compact')} | Duration: {selectedClip.duration.toFixed(1)}s
              </span>
            </div>
          </div>

          {/* Quick Inspector Parameters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Opacity slider */}
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <span className="text-[10px] uppercase font-bold text-gray-500">Opacity:</span>
              <input 
                type="range" 
                min={0} 
                max={1} 
                step={0.05}
                value={selectedClip.opacity ?? 1}
                onChange={(e) => {
                  const updated = clips.map(c => c.id === selectedClip.id ? { ...c, opacity: parseFloat(e.target.value) } : c);
                  onProjectChange({ ...project, clips: updated });
                }}
                className="w-16 h-1 bg-gray-700 rounded appearance-none accent-cyan-400"
              />
              <span className="text-[10px] font-mono text-gray-400">
                {Math.round((selectedClip.opacity ?? 1) * 100)}%
              </span>
            </div>

            {/* Blend mode (for cutaways/overlays) */}
            {selectedClip.type === 'image' && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-gray-500">Blend:</span>
                <select 
                  value={selectedClip.blendMode || 'normal'}
                  onChange={(e) => {
                    const updated = clips.map(c => c.id === selectedClip.id ? { ...c, blendMode: e.target.value as BlendMode } : c);
                    onProjectChange({ ...project, clips: updated });
                  }}
                  className="bg-black/60 border border-white/15 rounded px-2 py-0.5 text-[10px] text-gray-300 outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="screen">Screen</option>
                  <option value="multiply">Multiply</option>
                  <option value="overlay">Overlay</option>
                  <option value="lighten">Lighten</option>
                </select>
              </div>
            )}

            {/* PIP position (for cutaway clips) */}
            {selectedClip.trackId === 'track-v2-cutaway' && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-gray-500">PIP Pos:</span>
                <select 
                  value={selectedClip.pipPosition || 'top-right'}
                  onChange={(e) => {
                    const updated = clips.map(c => c.id === selectedClip.id ? { ...c, pipPosition: e.target.value as any } : c);
                    onProjectChange({ ...project, clips: updated });
                  }}
                  className="bg-black/60 border border-white/15 rounded px-2 py-0.5 text-[10px] text-gray-300 outline-none"
                >
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="center">Center</option>
                  <option value="full">Full Screen</option>
                </select>
              </div>
            )}

            {/* Text input (for titles / subtitles) */}
            {selectedClip.type === 'text' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-500">Text:</span>
                <input 
                  type="text" 
                  value={selectedClip.text || ''}
                  onChange={(e) => {
                    const updated = clips.map(c => c.id === selectedClip.id ? { ...c, text: e.target.value } : c);
                    onProjectChange({ ...project, clips: updated });
                  }}
                  className="bg-black/50 border border-white/15 rounded px-2 py-0.5 text-xs text-gray-200 outline-none w-48"
                  placeholder="Overlay text..."
                />
              </div>
            )}

            {/* Close Inspector */}
            <button 
              onClick={() => setSelectedClipId(null)}
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
