import React, { useState, useMemo } from 'react';
import { 
  Film, Sparkles, Plus, SlidersHorizontal, BookOpen, Layers
} from 'lucide-react';
import { ScenePrompt, VisualReference } from './App';
import { MultiTrackProject, TimelineClip } from './multiTrackTypes';
import { AnimaticPreviewWindow } from './AnimaticPreviewWindow';
import { MultiTrackTimeline } from './MultiTrackTimeline';
import { AudioBeatDrop } from './beatDetection';
import { TransitionPresetsSidebar } from './TransitionPresetsSidebar';

interface MultiTrackStudioViewProps {
  storyboard: ScenePrompt[];
  onStoryboardChange: (updated: ScenePrompt[]) => void;
  project: MultiTrackProject;
  onProjectChange: (updated: MultiTrackProject) => void;
  audioUrl: string | null;
  audioDuration: number;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onJumpToScene: (index: number) => void;
  audioIntensityData: number[] | null;
  detectedBeatDrops: AudioBeatDrop[];
  visualRefs?: VisualReference[];
  onOpenExportAnimatic: () => void;
  onNotification?: (msg: string) => void;
  previewMode: 'docked' | 'floating' | 'fullscreen';
  onPreviewModeChange: (mode: 'docked' | 'floating' | 'fullscreen') => void;
}

export const MultiTrackStudioView: React.FC<MultiTrackStudioViewProps> = ({
  storyboard,
  onStoryboardChange,
  project,
  onProjectChange,
  audioUrl,
  audioDuration,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  onJumpToScene,
  audioIntensityData,
  detectedBeatDrops,
  visualRefs,
  onOpenExportAnimatic,
  onNotification,
  previewMode,
  onPreviewModeChange
}) => {
  const [sidebarTab, setSidebarTab] = useState<'transitions' | 'layers' | 'guide'>('transitions');

  // Compute active scene index from currentTime
  const activeSceneIndex = useMemo(() => {
    let accum = 0;
    for (let i = 0; i < storyboard.length; i++) {
      const dur = storyboard[i].duration || 4;
      if (currentTime >= accum && currentTime < accum + dur) {
        return i;
      }
      accum += dur;
    }
    return Math.max(0, storyboard.length - 1);
  }, [currentTime, storyboard]);

  // Quick preset additions
  const handleAddPresetClip = (presetType: 'title' | 'cinemascope' | 'grain' | 'impact' | 'broll') => {
    let newClip: TimelineClip;

    switch (presetType) {
      case 'title':
        newClip = {
          id: `clip-title-${Date.now()}`,
          trackId: 'track-v3-titles',
          name: 'Chapter Card Title',
          startTime: currentTime,
          duration: 3.5,
          type: 'text',
          text: 'ACT I: THE AWAKENING',
          textRole: 'title',
          textPosition: 'center',
          textColor: '#fef08a',
          textBg: true,
          fontSize: 28,
          color: '#ec4899',
          opacity: 1
        };
        break;
      case 'cinemascope':
        newClip = {
          id: `clip-scope-${Date.now()}`,
          trackId: 'track-v4-filter',
          name: '2.39:1 Scope Matte',
          startTime: currentTime,
          duration: 10,
          type: 'filter',
          letterboxAspect: '2.39:1',
          filterName: 'Anamorphic Letterbox',
          color: '#f59e0b',
          opacity: 1
        };
        break;
      case 'grain':
        newClip = {
          id: `clip-grain-${Date.now()}`,
          trackId: 'track-v4-filter',
          name: '35mm Film Warmth',
          startTime: currentTime,
          duration: 8,
          type: 'filter',
          filterStyle: 'sepia(0.25) contrast(1.1) saturate(1.15)',
          filterName: '35mm Film Warmth',
          color: '#d97706',
          opacity: 1
        };
        break;
      case 'broll':
        const refImg = visualRefs?.find(r => r.image)?.image;
        newClip = {
          id: `clip-broll-${Date.now()}`,
          trackId: 'track-v2-cutaway',
          name: 'Visual Motif Cutaway',
          startTime: currentTime,
          duration: 3,
          type: 'image',
          mediaUrl: refImg || undefined,
          opacity: 0.9,
          blendMode: 'normal',
          pipPosition: 'top-right',
          scale: 0.35,
          color: '#8b5cf6'
        };
        break;
      case 'impact':
        newClip = {
          id: `clip-sfx-${Date.now()}`,
          trackId: 'track-a3-sfx',
          name: 'Sub-Bass Impact Hit',
          startTime: currentTime,
          duration: 2,
          type: 'audio',
          audioVolume: 1,
          color: '#eab308',
          opacity: 1
        };
        break;
    }

    onProjectChange({
      ...project,
      clips: [...project.clips, newClip]
    });
    onNotification?.(`Added "${newClip.name}" to timeline at playhead!`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Split Section: Animatic Preview (Left) + Presets & Composition Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Live Compositor Animatic Preview */}
        <div className="lg:col-span-8">
          <AnimaticPreviewWindow 
            storyboard={storyboard}
            tracks={project.tracks}
            clips={project.clips}
            currentTime={currentTime}
            totalDuration={audioDuration || 30}
            isPlaying={isPlaying}
            onTogglePlay={onTogglePlay}
            onSeek={onSeek}
            onJumpToScene={onJumpToScene}
            mode={previewMode}
            onModeChange={onPreviewModeChange}
            onCloseFloating={() => onPreviewModeChange('docked')}
            onOpenExportAnimatic={onOpenExportAnimatic}
            aspectRatio={project.aspectRatio}
            onAspectRatioChange={(ratio) => onProjectChange({ ...project, aspectRatio: ratio })}
          />
        </div>

        {/* Right Column: Transition Presets & Layer Composition Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          {/* Sidebar Top Nav Tabs */}
          <div className="flex items-center gap-1 bg-[#121217] p-1 border border-white/10 rounded-xl">
            <button
              onClick={() => setSidebarTab('transitions')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${sidebarTab === 'transitions' ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              <SlidersHorizontal size={13} className={sidebarTab === 'transitions' ? 'text-white' : 'text-cyan-400'} />
              <span>Transitions</span>
              <span className="text-[9px] px-1 py-0.2 bg-white/20 text-white rounded font-mono uppercase">New</span>
            </button>

            <button
              onClick={() => setSidebarTab('layers')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${sidebarTab === 'layers' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              <Layers size={13} className={sidebarTab === 'layers' ? 'text-white' : 'text-purple-400'} />
              <span>Layer Presets</span>
            </button>

            <button
              onClick={() => setSidebarTab('guide')}
              className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${sidebarTab === 'guide' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              title="Compositor Guide"
            >
              <BookOpen size={13} />
            </button>
          </div>

          {/* Active Tab Content */}
          {sidebarTab === 'transitions' && (
            <TransitionPresetsSidebar 
              storyboard={storyboard}
              onStoryboardChange={onStoryboardChange}
              activeSceneIndex={activeSceneIndex}
              onJumpToScene={onJumpToScene}
              onNotification={onNotification}
            />
          )}

          {sidebarTab === 'layers' && (
            <div className="bg-[#121217] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" />
                <span>Layer Composition Presets</span>
              </h4>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Inject narrative overlay layers at the playhead to composite complex animatic sequences:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                <button 
                  onClick={() => handleAddPresetClip('title')}
                  className="p-2 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pink-400" />
                      + Chapter Title Card
                    </div>
                    <div className="text-[10px] text-pink-200/60 mt-0.5">V3 Track • Center dramatic headline</div>
                  </div>
                  <Plus size={14} className="text-pink-400 group-hover:scale-125 transition-transform" />
                </button>

                <button 
                  onClick={() => handleAddPresetClip('broll')}
                  className="p-2 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      + B-Roll / PIP Cutaway
                    </div>
                    <div className="text-[10px] text-purple-200/60 mt-0.5">V2 Track • Top-right motif overlay</div>
                  </div>
                  <Plus size={14} className="text-purple-400 group-hover:scale-125 transition-transform" />
                </button>

                <button 
                  onClick={() => handleAddPresetClip('cinemascope')}
                  className="p-2 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      + 2.39:1 Scope Letterbox
                    </div>
                    <div className="text-[10px] text-amber-200/60 mt-0.5">V4 Track • Anamorphic black matte</div>
                  </div>
                  <Plus size={14} className="text-amber-400 group-hover:scale-125 transition-transform" />
                </button>

                <button 
                  onClick={() => handleAddPresetClip('grain')}
                  className="p-2 bg-yellow-950/40 hover:bg-yellow-900/60 border border-yellow-500/30 rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      + 35mm Film Warmth Look
                    </div>
                    <div className="text-[10px] text-yellow-200/60 mt-0.5">V4 Track • Vintage Kodak tone curve</div>
                  </div>
                  <Plus size={14} className="text-yellow-400 group-hover:scale-125 transition-transform" />
                </button>

                <button 
                  onClick={() => handleAddPresetClip('impact')}
                  className="p-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      + Audio SFX Impact Cue
                    </div>
                    <div className="text-[10px] text-emerald-200/60 mt-0.5">A3 Track • Sub-bass cinematic hit</div>
                  </div>
                  <Plus size={14} className="text-emerald-400 group-hover:scale-125 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {sidebarTab === 'guide' && (
            <div className="bg-[#121217] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Film size={14} className="text-blue-400" />
                <span>Real-Time Compositor Tips</span>
              </h4>
              <ul className="text-[11px] text-gray-400 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Transition Timing:</strong> Apply transition presets (like "3s smooth fade" or "0.5s sharp cut") to automatically pace visual cuts between scenes.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Multi-Layer Composite:</strong> V4 filter overlays on V3 titles, which overlay on V2 cutaways, which composite over V1 storyboard frames.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Floating Window:</strong> Click the move icon on the preview window to undock it into a floating Picture-in-Picture window while working anywhere in the app!</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Full-Width Section: Multi-Track NLE Timeline */}
      <MultiTrackTimeline 
        project={project}
        onProjectChange={onProjectChange}
        storyboard={storyboard}
        onStoryboardChange={onStoryboardChange}
        audioUrl={audioUrl}
        audioDuration={audioDuration}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onSeek={onSeek}
        audioIntensityData={audioIntensityData}
        detectedBeatDrops={detectedBeatDrops}
        visualRefs={visualRefs}
        onNotification={onNotification}
      />
    </div>
  );
};
