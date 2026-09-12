/**
 * Multi-Track Storyboard Engine
 * Handles timeline synchronization, clip layering, dynamic frame compositing,
 * and audio-visual synchronization for real-time animatic preview.
 */

import { ScenePrompt, VisualReference } from './App';
import { 
  TimelineTrack, 
  TimelineClip, 
  MultiTrackProject, 
  ActiveFrameComposition 
} from './multiTrackTypes';
import { AudioBeatDrop } from './beatDetection';

/**
 * Creates the standard default multi-track structure
 */
export function createDefaultTracks(): TimelineTrack[] {
  return [
    {
      id: 'track-v4-filter',
      name: 'V4: Cinematic Filter & LUT',
      type: 'visual',
      role: 'filter',
      order: 0,
      height: 44,
      color: '#f59e0b', // amber
      isMuted: false,
      isSolo: false,
      isLocked: false,
      isVisible: true,
      volume: 1,
      opacity: 1,
      iconName: 'Palette'
    },
    {
      id: 'track-v3-titles',
      name: 'V3: Titles & Lyrics',
      type: 'visual',
      role: 'titles',
      order: 1,
      height: 48,
      color: '#ec4899', // pink
      isMuted: false,
      isSolo: false,
      isLocked: false,
      isVisible: true,
      volume: 1,
      opacity: 1,
      iconName: 'Type'
    },
    {
      id: 'track-v2-cutaway',
      name: 'V2: B-Roll & Cutaways',
      type: 'visual',
      role: 'cutaway',
      order: 2,
      height: 56,
      color: '#8b5cf6', // purple
      isMuted: false,
      isSolo: false,
      isLocked: false,
      isVisible: true,
      volume: 1,
      opacity: 1,
      iconName: 'Layers'
    },
    {
      id: 'track-v1-main',
      name: 'V1: Primary Storyboard',
      type: 'visual',
      role: 'main',
      order: 3,
      height: 72,
      color: '#3b82f6', // blue
      isMuted: false,
      isSolo: false,
      isLocked: false,
      isVisible: true,
      volume: 1,
      opacity: 1,
      iconName: 'Film'
    },
    {
      id: 'track-a1-music',
      name: 'A1: Master Music Track',
      type: 'audio',
      role: 'music',
      order: 4,
      height: 60,
      color: '#06b6d4', // cyan
      isMuted: false,
      isSolo: false,
      isLocked: false,
      isVisible: true,
      volume: 1,
      opacity: 1,
      iconName: 'Music'
    },
    {
      id: 'track-a2-vo',
      name: 'A2: Voiceover & Dialogue',
      type: 'audio',
      role: 'voiceover',
      order: 5,
      height: 50,
      color: '#10b981', // emerald
      isMuted: false,
      isSolo: false,
      isLocked: false,
      isVisible: true,
      volume: 0.9,
      opacity: 1,
      iconName: 'Mic'
    },
    {
      id: 'track-a3-sfx',
      name: 'A3: SFX & Foley Cues',
      type: 'audio',
      role: 'sfx',
      order: 6,
      height: 46,
      color: '#eab308', // yellow
      isMuted: false,
      isSolo: false,
      isLocked: false,
      isVisible: true,
      volume: 0.8,
      opacity: 1,
      iconName: 'Volume2'
    }
  ];
}

/**
 * Generates an initial multi-track project populated from the storyboard scenes and audio
 */
export function buildMultiTrackFromStoryboard(
  storyboard: ScenePrompt[],
  audioUrl: string | null,
  audioDuration: number,
  visualRefs?: VisualReference[],
  existingClips?: TimelineClip[]
): MultiTrackProject {
  const tracks = createDefaultTracks();
  const clips: TimelineClip[] = [];

  let accumulatedTime = 0;

  // 1. Build V1 Primary Visual clips & V3 Lyric Subtitle clips from storyboard scenes
  storyboard.forEach((scene, index) => {
    const duration = Math.max(1, scene.duration || 4);
    const sceneStartTime = accumulatedTime;

    // V1: Primary Visual Clip
    clips.push({
      id: `clip-v1-${scene.id || index}`,
      trackId: 'track-v1-main',
      sceneId: scene.id,
      name: `Shot ${index + 1}: ${scene.description ? scene.description.slice(0, 30) : 'Scene ' + (index + 1)}`,
      startTime: sceneStartTime,
      duration: duration,
      type: scene.videoUrl ? 'video' : 'image',
      mediaUrl: scene.videoUrl || scene.generatedImage || undefined,
      promptSnippet: scene.imagePrompt,
      opacity: 1,
      color: '#2563eb', // Blue-600
      scale: 1,
      isLocked: false
    });

    // V3: Lyric Subtitle Clip (if lyric exists)
    if (scene.lyric && scene.lyric.trim().length > 0) {
      clips.push({
        id: `clip-v3-lyric-${scene.id || index}`,
        trackId: 'track-v3-titles',
        sceneId: scene.id,
        name: `Lyric: "${scene.lyric.slice(0, 24)}..."`,
        startTime: sceneStartTime,
        duration: duration,
        type: 'text',
        text: scene.lyric,
        textRole: 'lyrics',
        textPosition: 'bottom',
        textColor: '#ffffff',
        textBg: true,
        fontSize: 16,
        color: '#db2777', // Pink-600
        opacity: 0.95
      });
    }

    // A2: Voiceover / Narration Clip (if voiceover enabled or text provided)
    if (scene.isVoiceoverEnabled || (scene.voiceoverText && scene.voiceoverText.trim().length > 0)) {
      clips.push({
        id: `clip-a2-vo-${scene.id || index}`,
        trackId: 'track-a2-vo',
        sceneId: scene.id,
        name: `V.O. Shot ${index + 1}`,
        startTime: sceneStartTime + 0.3,
        duration: Math.max(1.5, duration - 0.6),
        type: 'audio',
        text: scene.voiceoverText || scene.lyric,
        audioVolume: 1,
        color: '#059669', // Emerald-600
        opacity: 1
      });
    }

    // V2: Optional B-Roll / Reference Cutaway (if visual references are linked)
    if (visualRefs && scene.linkedRefIds && scene.linkedRefIds.length > 0) {
      const linkedRef = visualRefs.find(r => scene.linkedRefIds?.includes(r.id));
      if (linkedRef && linkedRef.image) {
        clips.push({
          id: `clip-v2-cutaway-${scene.id || index}`,
          trackId: 'track-v2-cutaway',
          sceneId: scene.id,
          name: `Cutaway: ${linkedRef.name}`,
          startTime: sceneStartTime + (duration * 0.4),
          duration: Math.min(2.5, duration * 0.5),
          type: 'image',
          mediaUrl: linkedRef.image,
          opacity: 0.9,
          blendMode: 'normal',
          pipPosition: 'top-right',
          scale: 0.35,
          color: '#7c3aed' // Purple-600
        });
      }
    }

    accumulatedTime += duration;
  });

  const totalDuration = Math.max(accumulatedTime, audioDuration || accumulatedTime || 30);

  // 2. Build A1 Master Audio Clip
  clips.push({
    id: 'clip-a1-master-music',
    trackId: 'track-a1-music',
    name: 'Master Audio Track',
    startTime: 0,
    duration: totalDuration,
    type: 'audio',
    audioUrl: audioUrl || undefined,
    audioVolume: 1,
    color: '#0891b2', // Cyan-600
    opacity: 1,
    isLocked: true
  });

  // 3. Add default V4 Cinematic Letterbox & Film LUT clip spanning entire project
  clips.push({
    id: 'clip-v4-master-grade',
    trackId: 'track-v4-filter',
    name: '2.39:1 Scope & 35mm Grain',
    startTime: 0,
    duration: totalDuration,
    type: 'filter',
    filterName: 'Cinematic Anamorphic Scope',
    letterboxAspect: '2.39:1',
    filterStyle: 'contrast(1.08) saturate(1.05)',
    color: '#d97706', // Amber-600
    opacity: 1,
    isLocked: false
  });

  // Preserve any custom user-added clips from existingClips that aren't V1/V3 defaults
  if (existingClips && existingClips.length > 0) {
    const customClips = existingClips.filter(c => 
      !c.id.startsWith('clip-v1-') && 
      !c.id.startsWith('clip-v3-lyric-') && 
      c.id !== 'clip-a1-master-music' &&
      c.id !== 'clip-v4-master-grade'
    );
    clips.push(...customClips);
  }

  return {
    version: 1,
    tracks,
    clips,
    zoom: 48, // 48 pixels per second
    snapToGrid: true,
    snapGridSeconds: 0.5,
    snapToBeats: true,
    aspectRatio: '16:9',
    letterboxEnabled: true,
    subtitlesEnabled: true,
    timecodeBurnIn: true,
    safeGuidesEnabled: false
  };
}

/**
 * Computes the real-time active composite frame at a given timestamp
 */
export function computeActiveComposition(
  timestamp: number,
  tracks: TimelineTrack[],
  clips: TimelineClip[],
  storyboard: ScenePrompt[]
): ActiveFrameComposition {
  // Track visibility / solo map
  const hasSolo = tracks.some(t => t.isSolo);
  const activeTrackMap = new Map<string, TimelineTrack>();

  tracks.forEach(track => {
    if (hasSolo) {
      if (track.isSolo && track.isVisible) {
        activeTrackMap.set(track.id, track);
      }
    } else {
      if (track.isVisible && !track.isMuted) {
        activeTrackMap.set(track.id, track);
      }
    }
  });

  // Find active clips across tracks at timestamp
  const activeClips = clips.filter(clip => {
    if (!activeTrackMap.has(clip.trackId)) return false;
    return timestamp >= clip.startTime && timestamp < (clip.startTime + clip.duration);
  });

  // Categorize by track role
  let mainVisualClip: TimelineClip | undefined;
  const cutawayClips: TimelineClip[] = [];
  const textClips: TimelineClip[] = [];
  const filterClips: TimelineClip[] = [];
  const audioClips: TimelineClip[] = [];

  activeClips.forEach(clip => {
    const track = activeTrackMap.get(clip.trackId);
    if (!track) return;

    if (track.role === 'main') {
      mainVisualClip = clip;
    } else if (track.role === 'cutaway') {
      cutawayClips.push(clip);
    } else if (track.role === 'titles') {
      textClips.push(clip);
    } else if (track.role === 'filter') {
      filterClips.push(clip);
    } else if (track.type === 'audio') {
      audioClips.push(clip);
    }
  });

  // Determine current active scene index from storyboard durations
  let activeSceneIndex = 0;
  let accumTime = 0;
  for (let i = 0; i < storyboard.length; i++) {
    const d = storyboard[i].duration || 4;
    if (timestamp >= accumTime && timestamp < accumTime + d) {
      activeSceneIndex = i;
      break;
    }
    accumTime += d;
    if (i === storyboard.length - 1) {
      activeSceneIndex = i;
    }
  }

  const currentScene = storyboard[activeSceneIndex];

  // Combined CSS filters from filter clips
  const filterStrings = filterClips.map(f => f.filterStyle).filter(Boolean);
  const combinedFilterCss = filterStrings.length > 0 ? filterStrings.join(' ') : 'none';

  // Subtitle / Lyric text
  const activeSubtitle = textClips.find(t => t.textRole === 'lyrics' || t.textRole === 'lower-third');
  const activeVo = textClips.find(t => t.textRole === 'voiceover-caption');

  return {
    timestamp,
    activeSceneIndex,
    currentScene,
    mainVisualClip,
    cutawayClips,
    textClips,
    filterClips,
    audioClips,
    combinedFilterCss,
    activeSubtitleText: activeSubtitle?.text || currentScene?.lyric || undefined,
    activeVoiceoverText: activeVo?.text || (currentScene?.isVoiceoverEnabled ? currentScene.voiceoverText : undefined)
  };
}

/**
 * Formats time in SMPTE-style timecode: MM:SS.MS or HH:MM:SS:FF
 */
export function formatTimecode(seconds: number, format: 'compact' | 'smpte' = 'compact'): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  
  const totalMs = Math.floor(seconds * 1000);
  const mins = Math.floor(totalMs / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = Math.floor((totalMs % 1000) / 10); // 2-digit 10ms
  const frames = Math.floor((seconds % 1) * 24); // 24fps frames

  if (format === 'smpte') {
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours.toString().padStart(2, '0')}:${remainMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

/**
 * Snaps a target time to grid increments and optional beat drops
 */
export function snapTimeToGrid(
  rawTime: number,
  snapGridSeconds: number,
  beatDrops?: AudioBeatDrop[],
  snapToBeats = true,
  snapThresholdSeconds = 0.25
): number {
  let bestTime = Math.round(rawTime / snapGridSeconds) * snapGridSeconds;

  if (snapToBeats && beatDrops && beatDrops.length > 0) {
    for (const drop of beatDrops) {
      if (Math.abs(drop.time - rawTime) <= snapThresholdSeconds) {
        return Math.round(drop.time * 100) / 100;
      }
    }
  }

  return Math.max(0, Math.round(bestTime * 100) / 100);
}

/**
 * Syncs V1 clip durations back to the storyboard scene prompt list
 */
export function syncTimelineV1ToStoryboard(
  clips: TimelineClip[],
  currentStoryboard: ScenePrompt[]
): ScenePrompt[] {
  // Sort V1 clips by startTime
  const v1Clips = clips
    .filter(c => c.trackId === 'track-v1-main')
    .sort((a, b) => a.startTime - b.startTime);

  if (v1Clips.length === 0) return currentStoryboard;

  let currentAccumTime = 0;

  return currentStoryboard.map((scene, idx) => {
    const matchedClip = v1Clips.find(c => c.sceneId === scene.id) || v1Clips[idx];
    const newDuration = matchedClip ? Math.max(0.5, Math.round(matchedClip.duration * 10) / 10) : scene.duration;
    
    const startStr = formatTimecode(currentAccumTime, 'compact');
    currentAccumTime += newDuration;
    const endStr = formatTimecode(currentAccumTime, 'compact');

    return {
      ...scene,
      duration: newDuration,
      startTime: startStr,
      endTime: endStr
    };
  });
}
