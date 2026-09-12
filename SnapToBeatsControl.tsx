import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, SlidersHorizontal, Sparkles, Activity, Check, 
  Flame, RefreshCw, X
} from 'lucide-react';
import { AudioBeatDrop, SnapToBeatsOptions, SnapResult } from './beatDetection';
import { ScenePrompt } from './App';

interface SnapToBeatsControlProps {
  audioIntensityData: number[] | null;
  audioDuration: number;
  storyboard: ScenePrompt[] | null;
  detectedPeaks: AudioBeatDrop[];
  isAnalyzing?: boolean;
  onExecuteSnap: (options: SnapToBeatsOptions) => void;
  onReanalyze?: () => void;
  showBeatMarkers: boolean;
  onToggleBeatMarkers: (show: boolean) => void;
  sensitivity: number;
  onSensitivityChange: (val: number) => void;
  pacingMode: 'snap_existing' | 'distribute_drops' | 'dynamic_flow';
  onPacingModeChange: (mode: 'snap_existing' | 'distribute_drops' | 'dynamic_flow') => void;
  minSceneDuration: number;
  onMinSceneDurationChange: (val: number) => void;
  fitAudioDuration: boolean;
  onFitAudioDurationChange: (fit: boolean) => void;
  lastSnapStats?: SnapResult['stats'] | null;
}

export const SnapToBeatsControl: React.FC<SnapToBeatsControlProps> = ({
  audioIntensityData,
  audioDuration,
  storyboard,
  detectedPeaks,
  isAnalyzing = false,
  onExecuteSnap,
  onReanalyze,
  showBeatMarkers,
  onToggleBeatMarkers,
  sensitivity,
  onSensitivityChange,
  pacingMode,
  onPacingModeChange,
  minSceneDuration,
  onMinSceneDurationChange,
  fitAudioDuration,
  onFitAudioDurationChange,
  lastSnapStats
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [justSnapped, setJustSnapped] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const majorDropsCount = detectedPeaks.filter(p => p.isDrop).length;
  const hasAudio = !!audioIntensityData && audioIntensityData.length > 0;
  const hasStoryboard = !!storyboard && storyboard.length > 0;
  const canSnap = hasAudio && hasStoryboard && !isAnalyzing;

  const handleSnapClick = () => {
    if (!canSnap) return;
    onExecuteSnap({
      mode: pacingMode,
      minSceneDuration,
      fitAudioDuration,
      sensitivity
    });
    setJustSnapped(true);
    setTimeout(() => setJustSnapped(false), 2000);
  };

  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      <div className="inline-flex rounded-lg shadow-sm border border-cyan-500/30 overflow-hidden bg-gradient-to-r from-[#0d1f2d] to-[#0a1520]">
        {/* Main Action Button */}
        <button
          id="snap-to-beats-btn"
          onClick={handleSnapClick}
          disabled={!canSnap}
          title={
            !hasAudio 
              ? 'Upload an audio file to analyze beats and drops' 
              : !hasStoryboard 
                ? 'Generate or add storyboard scenes first' 
                : 'Automatically adjust scene durations to match audio peak drops'
          }
          className={`px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            justSnapped 
              ? 'bg-emerald-600 text-white font-bold' 
              : canSnap
                ? 'text-cyan-300 hover:text-white hover:bg-cyan-500/20 active:scale-95'
                : 'text-gray-500 opacity-50 cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? (
            <RefreshCw size={13} className="animate-spin text-cyan-400" />
          ) : justSnapped ? (
            <Check size={13} className="text-white" />
          ) : (
            <Zap size={13} className={canSnap ? 'text-amber-400 fill-amber-400' : 'text-gray-500'} />
          )}

          <span className="whitespace-nowrap">
            {justSnapped ? 'Snapped to Beats!' : 'Snap to Beats'}
          </span>

          {hasAudio && detectedPeaks.length > 0 && !justSnapped && (
            <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              {majorDropsCount > 0 ? `${majorDropsCount} drops` : `${detectedPeaks.length} peaks`}
            </span>
          )}
        </button>

        {/* Settings Toggle Dropdown Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={!hasAudio}
          className={`px-1.5 py-1.5 border-l border-cyan-500/20 hover:bg-cyan-500/20 transition-colors ${
            showMenu ? 'bg-cyan-500/30 text-white' : 'text-cyan-400 hover:text-white'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          title="Beat Snapping Settings & Pacing Options"
        >
          <SlidersHorizontal size={12} />
        </button>
      </div>

      {/* Floating Settings Dropdown Panel */}
      {showMenu && (
        <div 
          className="absolute right-0 top-full mt-2 w-80 bg-[#141920] border border-cyan-500/30 rounded-xl shadow-2xl z-50 p-3.5 backdrop-blur-lg animate-in fade-in zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-cyan-400" />
              <span className="text-xs font-bold text-gray-200">Beat & Drop Snapping Engine</span>
            </div>
            <button 
              onClick={() => setShowMenu(false)} 
              className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-white/10"
            >
              <X size={13} />
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Quick Stats Banner */}
            <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-2 flex items-center justify-between text-[11px]">
              <div>
                <div className="text-gray-400">Detected Peaks</div>
                <div className="font-mono font-bold text-cyan-300">
                  {detectedPeaks.length} <span className="text-gray-500 font-normal">({majorDropsCount} major drops)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400">Audio • Storyboard</div>
                <div className="font-mono font-bold text-amber-300">
                  {audioDuration > 0 ? `${Math.round(audioDuration)}s` : 'Track'} • {storyboard ? Math.max(0, storyboard.length - 1) : 0} cuts
                </div>
              </div>
            </div>

            {/* Pacing Mode Selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Alignment Strategy
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onPacingModeChange('snap_existing')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    pacingMode === 'snap_existing'
                      ? 'bg-cyan-950/70 border-cyan-400/60 text-cyan-200'
                      : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-[11px] flex items-center gap-1">
                    <Sparkles size={11} className="text-cyan-400" /> Snap Existing
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                    Shifts existing cuts to closest audio peak drops
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onPacingModeChange('distribute_drops')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    pacingMode === 'distribute_drops'
                      ? 'bg-amber-950/70 border-amber-400/60 text-amber-200'
                      : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-[11px] flex items-center gap-1">
                    <Flame size={11} className="text-amber-400" /> Drop Priority
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                    Distributes cuts across highest energy drops
                  </div>
                </button>
              </div>
            </div>

            {/* Minimum Scene Duration Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Minimum Scene Duration
                </label>
                <span className="font-mono text-cyan-300 font-bold text-[11px]">
                  {minSceneDuration}s
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.5"
                value={minSceneDuration}
                onChange={e => onMinSceneDurationChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
                <span>1.0s (Fast cuts)</span>
                <span>2.5s (Cinematic)</span>
                <span>4.0s (Long take)</span>
              </div>
            </div>

            {/* Peak Detection Sensitivity Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Detection Sensitivity
                </label>
                <span className="font-mono text-cyan-300 font-bold text-[11px]">
                  {sensitivity}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                step="5"
                value={sensitivity}
                onChange={e => onSensitivityChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
                <span>Major Drops Only</span>
                <span>Every Percussion Hit</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-gray-300">Fit entire audio track length</span>
                <input
                  type="checkbox"
                  checked={fitAudioDuration}
                  onChange={e => onFitAudioDurationChange(e.target.checked)}
                  className="accent-cyan-400 w-3.5 h-3.5 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-gray-300">Show peak drop markers on waveform</span>
                <input
                  type="checkbox"
                  checked={showBeatMarkers}
                  onChange={e => onToggleBeatMarkers(e.target.checked)}
                  className="accent-cyan-400 w-3.5 h-3.5 rounded"
                />
              </label>
            </div>

            {/* Reanalyze Action */}
            {onReanalyze && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onReanalyze();
                  }}
                  className="w-full py-1.5 text-[10px] text-gray-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 rounded bg-black/30 border border-white/5 hover:border-cyan-500/30 transition-colors"
                >
                  <RefreshCw size={11} className={isAnalyzing ? 'animate-spin text-cyan-400' : ''} />
                  Re-analyze Audio Frequency Peaks
                </button>
              </div>
            )}

            {/* Execution Button in Popover */}
            <button
              type="button"
              onClick={() => {
                handleSnapClick();
                setShowMenu(false);
              }}
              disabled={!canSnap}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
            >
              <Zap size={13} className="fill-current text-amber-300" />
              Apply Beat Snapping to Storyboard
            </button>

            {lastSnapStats && (
              <div className="text-[9px] text-center text-gray-400 font-mono">
                Last snap: {lastSnapStats.snappedCutsCount} cuts aligned • avg {lastSnapStats.avgDuration}s
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Visual Beat Markers Overlay component for the Audio Player Seeker/Waveform
 */
export const BeatMarkersOverlay: React.FC<{
  detectedPeaks: AudioBeatDrop[];
  audioDuration: number;
  showMarkers: boolean;
}> = ({ detectedPeaks, audioDuration, showMarkers }) => {
  if (!showMarkers || !detectedPeaks || detectedPeaks.length === 0 || audioDuration <= 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
      {detectedPeaks.map((peak) => {
        const leftPercent = Math.min(100, Math.max(0, (peak.time / audioDuration) * 100));
        return (
          <div
            key={`${peak.index}-${peak.time}`}
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${leftPercent}%` }}
            title={`${peak.isDrop ? '⚡ Major Drop' : '• Beat Peak'} at ${peak.time}s (Intensity: ${peak.intensity})`}
          >
            {/* Top marker notch */}
            <div 
              className={`w-1.5 h-1.5 -translate-x-1/2 rounded-full ${
                peak.isDrop 
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] ring-1 ring-amber-300' 
                  : 'bg-cyan-400/80 shadow-[0_0_4px_rgba(34,211,238,0.5)]'
              }`}
            />
            {/* Vertical tick guideline */}
            <div 
              className={`w-[1px] flex-1 ${
                peak.isDrop 
                  ? 'bg-amber-400/50 shadow-[0_0_4px_rgba(251,191,36,0.5)]' 
                  : 'bg-cyan-500/25'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};

/**
 * Static Waveform Background Component rendering the entire audioIntensityData track
 */
export const AudioIntensityWaveform: React.FC<{
  audioIntensityData: number[];
  uiThemeColor?: string;
}> = ({ audioIntensityData }) => {
  if (!audioIntensityData || audioIntensityData.length === 0) return null;

  // Downsample to max 160 visual bars for clean rendering across standard display widths
  const targetBars = 140;
  const step = Math.max(1, Math.floor(audioIntensityData.length / targetBars));
  const bars: number[] = [];

  for (let i = 0; i < audioIntensityData.length; i += step) {
    let max = 0;
    for (let j = i; j < Math.min(i + step, audioIntensityData.length); j++) {
      if (audioIntensityData[j] > max) max = audioIntensityData[j];
    }
    bars.push(max);
  }

  return (
    <div className="absolute inset-0 flex items-end justify-between gap-[1px] px-1 pointer-events-none opacity-40">
      {bars.map((val, idx) => {
        const heightPct = Math.max(8, Math.round((val / 255) * 88));
        const isHighEnergy = val > 180;
        return (
          <div
            key={idx}
            style={{ height: `${heightPct}%` }}
            className={`flex-1 rounded-t-[1px] transition-all duration-300 ${
              isHighEnergy 
                ? 'bg-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.4)]' 
                : 'bg-white/30'
            }`}
          />
        );
      })}
    </div>
  );
};
