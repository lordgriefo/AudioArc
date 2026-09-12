/**
 * Types and interfaces for the Multi-Track Storyboard & Animatic Compositor
 */

import { ScenePrompt } from './App';

export type TrackType = 'visual' | 'audio';
export type VisualTrackRole = 'main' | 'cutaway' | 'titles' | 'filter';
export type AudioTrackRole = 'music' | 'voiceover' | 'sfx';

export type ClipType = 'image' | 'video' | 'text' | 'audio' | 'filter';

export type BlendMode = 'normal' | 'screen' | 'multiply' | 'overlay' | 'lighten' | 'darken';

export interface TimelineClip {
  id: string;
  trackId: string;
  sceneId?: string; // Optional linkage to a ScenePrompt in storyboard
  name: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  type: ClipType;
  // Visual Media
  mediaUrl?: string; // Image or Video URL
  promptSnippet?: string;
  // Overlays & Picture-in-Picture
  opacity?: number; // 0 to 1 (default: 1)
  blendMode?: BlendMode;
  pipPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'full';
  scale?: number; // 0.1 to 1.5 (default: 1)
  // Text / Titles / Subtitles
  text?: string;
  textRole?: 'lyrics' | 'title' | 'lower-third' | 'voiceover-caption';
  textPosition?: 'bottom' | 'center' | 'top' | 'lower-third';
  textColor?: string;
  textBg?: boolean;
  fontSize?: number; // in px or scale
  // Audio
  audioVolume?: number; // 0 to 1
  isMuted?: boolean;
  audioUrl?: string;
  // Color Grade & Filter
  filterStyle?: string; // CSS filter e.g. "sepia(0.4) contrast(1.15)"
  filterName?: string;
  letterboxAspect?: '16:9' | '9:16' | '2.39:1' | '4:3' | '1:1';
  // Clip styling in timeline
  color: string;
  isLocked?: boolean;
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  role: VisualTrackRole | AudioTrackRole;
  order: number;
  height?: number; // px (e.g. 52, 64)
  color: string;
  isMuted: boolean;
  isSolo: boolean;
  isLocked: boolean;
  isVisible: boolean;
  volume: number; // 0 to 1 (for audio)
  opacity: number; // 0 to 1 (for visual)
  iconName: string;
}

export interface MultiTrackProject {
  version: number;
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  zoom: number; // Pixels per second (e.g. 20 to 160)
  snapToGrid: boolean;
  snapGridSeconds: number; // 0.25, 0.5, 1.0, 2.0
  snapToBeats: boolean;
  aspectRatio: '16:9' | '9:16' | '2.39:1' | '4:3' | '1:1';
  letterboxEnabled: boolean;
  subtitlesEnabled: boolean;
  timecodeBurnIn: boolean;
  safeGuidesEnabled: boolean;
}

export interface ActiveFrameComposition {
  timestamp: number;
  activeSceneIndex: number;
  currentScene?: ScenePrompt;
  // Layered active clips at this instant:
  mainVisualClip?: TimelineClip;
  cutawayClips: TimelineClip[];
  textClips: TimelineClip[];
  filterClips: TimelineClip[];
  audioClips: TimelineClip[];
  // Composite styles
  combinedFilterCss: string;
  activeSubtitleText?: string;
  activeVoiceoverText?: string;
}
