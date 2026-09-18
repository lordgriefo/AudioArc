

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Clapperboard, Music, Video, Sparkles, Save, History, Settings, 
  Trash2, X, ChevronDown, ChevronRight, ChevronLeft, Copy, Play, Pause, Download, 
  Image as ImageIcon, Film, Wand2, MonitorPlay, Zap, Share2, 
  RotateCcw, Search, Plus, Bookmark, Check, Edit3, List, FileText,
  Grid, Clock, Monitor, StopCircle, RefreshCw, Loader2, Monitor as MonitorIcon,
  ShieldCheck, AlertCircle, CopyPlus, FolderOpen,
  Terminal, Pencil, AlertTriangle, ScrollText,
  Undo, Redo, ArrowUp, ArrowDown, CreditCard, ExternalLink, HelpCircle, Upload, Volume2, Smile, Palette, Layers,
  Maximize2, Link as LinkIcon, Paperclip, Printer, User, Cloud, SkipBack, SkipForward,
  FileJson, FileArchive, VideoIcon, UserPlus, Cpu, BookOpen, Mic, Coffee, Key,
  SlidersHorizontal, BookmarkPlus, ArrowLeftRight, UserCheck, Tag, Compass, Bot, LayoutGrid, Merge, Contrast,
  Eye, EyeOff
} from 'lucide-react';
import JSZip from 'jszip';
import * as idb from 'idb-keyval';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { VISUAL_STYLES, RESOURCES, INFLUENCE_CATEGORIES, VARIATION_OPTIONS, AI_MODELS, AI_MODEL_LABELS, CINEMATIC_CAMERA_MOVEMENTS } from './influences';
import { SmartPromptSuggestions } from './SmartPromptSuggestions';
import { PromptTag } from './smartPromptEngine';
import { PromptPresetsModal } from './PromptPresetsModal';
import { 
  PromptPreset, 
  BUILTIN_PROMPT_PRESETS, 
  loadPromptPresets, 
  saveCustomPresetsToStorage 
} from './promptPresets';
import { QuickSwapModal, QuickSwapConfig } from './QuickSwapModal';
import { 
  BatchCharacterUpdateModal, 
  BatchCharacterUpdateConfig, 
  BatchCharacterProgress 
} from './BatchCharacterUpdateModal';
import { 
  AudioBeatDrop, 
  detectAudioPeakDrops, 
  snapScenesToBeats, 
  extractIntensityFromAudioBuffer, 
  SnapToBeatsOptions, 
  SnapResult 
} from './beatDetection';
import { 
  SnapToBeatsControl, 
  BeatMarkersOverlay, 
  AudioIntensityWaveform 
} from './SnapToBeatsControl';
import { ColorGradeModal } from './ColorGradeModal';
import { HeaderConnectionStatus } from './HeaderConnectionStatus';
import { MultiTrackStudioView } from './MultiTrackStudioView';
import { AnimaticPreviewWindow } from './AnimaticPreviewWindow';
import { MultiTrackProject } from './multiTrackTypes';
import { buildMultiTrackFromStoryboard } from './multiTrackEngine';
import { AIStyleRefinerModal } from './AIStyleRefinerModal';
import { AIContrastBoosterModal } from './AIContrastBoosterModal';

// --- Error Boundary ---
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-8">
          <AlertTriangle size={48} className="text-red-500 mb-4"/>
          <h1 className="text-2xl font-bold brand-font mb-2">Something went wrong.</h1>
          <p className="text-gray-400 mb-6 text-center">The application has encountered an unexpected error.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors">Reload App</button>
          <details className="mt-4 text-xs text-gray-600 mono-font w-full max-w-xl">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 p-2 bg-gray-900 rounded whitespace-pre-wrap text-left">
              {this.state.error?.toString()}
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}


// --- Interfaces ---
export interface ScenePrompt {
  id: string; 
  lyric: string;
  description?: string;
  imagePrompt: string;
  videoPrompts: string[]; // [Subtle, Dynamic, Stylistic]
  soraPrompt: string;
  duration: number;
  startTime?: string;
  endTime?: string;
  generatedImage?: string;
  imageFilename?: string; // Used for zip export/import
  videoStatus?: 'idle' | 'generating' | 'completed' | 'error';
  videoUrl?: string;
  variations?: string[];
  notes?: string;
  groupName?: string;
  isExpanded?: boolean;
  isSelected?: boolean;
  linkedRefIds?: string[];
  transitionIn?: string;
  transitionOut?: string;
  cameraMovement?: string;
  isLipSyncEnabled?: boolean;
  lipSyncPrompt?: string;
  isVoiceoverEnabled?: boolean;
  voiceoverText?: string;
}

interface HistoryItem {
  id: string;
  date: string;
  lyrics: string;
  narrative: string;
  styleId: string;
  influences: string;
  storyboard: ScenePrompt[];
}

interface CustomInfluence {
  id: string;
  name: string;
  desc: string;
}

export interface VisualReference {
  id: string;
  name: string;
  description: string;
  image: string; // base64. Empty string for text-only refs.
  analyzing: boolean;
}

interface OpenRouterModel {
  id: string;
  name: string;
  isFree: boolean;
}

interface Beat {
    lyric: string;
    beat?: string;
    duration?: number;
    groupName?: string;
}

interface BatchGenState {
    generating: boolean;
    current: number;
    total: number;
    success: number;
    failures: number;
}


const LOADING_MESSAGES = [
    "Scouting locations...",
    "Adjusting camera focus...",
    "Director is reviewing the script...",
    "Setting up the dolly track...",
    "Waiting for the gaffer...",
    "Testing pyrotechnics...",
    "Polishing the anamorphic lenses...",
    "The DP is framing the shot...",
    "Reviewing dailies...",
    "Syncing audio...",
    "Calling 'Action!'...",
    "That's a wrap on scene one!",
];

const VIDEO_LOADING_MESSAGES = [
    "Director is reviewing the script...",
    "Cinematographer is setting up the shot...",
    "Lighting crew is adjusting the key lights...",
    "Rendering Scene: Frame 1 of 240...",
    "The dolly grip is preparing the track...",
    "Sound team is checking levels...",
    "Visual effects artists are adding magic...",
    "Colorist is grading the footage...",
    "Waiting for the dailies to be processed...",
    "This is taking a moment, but great art needs time!",
    "Finalizing the edit...",
];


// --- Utilities ---
const normalizeKeys = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(normalizeKeys);
  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      const newKey = key.replace(/([-_][a-z])/g, (group: string) => group.toUpperCase().replace('-', '').replace('_', '')).replace(/^[A-Z]/, (c: string) => c.toLowerCase());
      if (newKey === 'videoPrompt') newObj['videoPrompts'] = normalizeKeys(obj[key]);
      else if (newKey === 'image_prompt') newObj['imagePrompt'] = normalizeKeys(obj[key]);
      else newObj[newKey] = normalizeKeys(obj[key]);
    }
    if (!newObj.videoPrompts) newObj.videoPrompts = []; 
    if (newObj.videoPrompts && !Array.isArray(newObj.videoPrompts)) newObj.videoPrompts = [newObj.videoPrompts];
    return newObj;
  }
  return obj;
};

const cleanJSON = (text: string): string => {
    if (!text) return "[]";
    const jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
    let potentialJson = jsonMatch ? jsonMatch[2] : text;
    potentialJson = potentialJson.trim();

    const firstBracket = potentialJson.search(/[[{]/);
    if (firstBracket === -1) {
        return "[]";
    }

    let extractedJson = potentialJson.substring(firstBracket);

    try {
        const parsed = JSON.parse(extractedJson);
        if (Array.isArray(parsed)) {
            return extractedJson;
        }
        if (typeof parsed === 'object' && parsed !== null) {
            return `[${extractedJson}]`;
        }
        return "[]";
    } catch (e) {
        const lastBracket = Math.max(extractedJson.lastIndexOf(']'), extractedJson.lastIndexOf('}'));
        if (lastBracket > -1) {
            let fixedJson = extractedJson.substring(0, lastBracket + 1);
            try {
                const parsed = JSON.parse(fixedJson);
                if (Array.isArray(parsed)) {
                    return fixedJson;
                }
                 if (typeof parsed === 'object' && parsed !== null) {
                    return `[${fixedJson}]`;
                }
                return "[]";
            } catch (e2) {
                console.error("Failed to parse JSON after repair attempt:", e2, {original: text});
                return "[]";
            }
        }
        console.error("Failed to parse JSON:", e, {original: text});
        return "[]";
    }
};

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const recalcTimeline = (scenes: ScenePrompt[]): ScenePrompt[] => {
    let currentTime = 0;
    return scenes.map(scene => {
        const start = formatTime(currentTime);
        currentTime += (scene.duration || 4);
        const end = formatTime(currentTime);
        return { ...scene, duration: scene.duration || 4, startTime: start, endTime: end };
    });
};

const formatLrcTimestamp = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "[00:00.00]";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const hundredths = Math.min(99, Math.floor(Math.round((seconds % 1) * 100)));
  return `[${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}]`;
};

const generateLrcContent = (
  scenes: ScenePrompt[] | null | undefined,
  rawLyrics?: string,
  projectName?: string,
  audioDuration?: number | null
): string => {
  const title = (projectName || '').trim() || 'AudioArc Music Video';
  const headerLines: string[] = [
    `[ti:${title}]`,
    `[ar:AudioArc AI Director]`,
    `[al:AudioArc Visualizer Soundtrack]`,
    `[by:AudioArc AI Filmmaking Assistant]`,
    `[re:AudioArc]`
  ];

  const totalSec = audioDuration || (scenes && scenes.length > 0 ? scenes.reduce((acc, s) => acc + (s.duration || 4), 0) : 0);
  if (totalSec > 0) {
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    headerLines.push(`[length:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}]`);
  }
  headerLines.push('');

  const lrcRows: string[] = [];

  if (scenes && scenes.length > 0) {
    let currentTime = 0;
    scenes.forEach((scene) => {
      const sceneStart = currentTime;
      const duration = scene.duration || 4;
      currentTime += duration;

      const rawLyric = (scene.lyric || '').trim();
      if (rawLyric) {
        const subLines = rawLyric.split(/\r?\n|\s*\/\s*/).map(l => l.trim()).filter(Boolean);
        if (subLines.length === 1) {
          lrcRows.push(`${formatLrcTimestamp(sceneStart)} ${subLines[0]}`);
        } else if (subLines.length > 1) {
          const step = duration / subLines.length;
          subLines.forEach((line, subIdx) => {
            const time = sceneStart + (subIdx * step);
            lrcRows.push(`${formatLrcTimestamp(time)} ${line}`);
          });
        }
      } else {
        const tag = scene.groupName ? `[${scene.groupName}]` : `[Instrumental]`;
        lrcRows.push(`${formatLrcTimestamp(sceneStart)} ${tag}`);
      }
    });

    lrcRows.push(`${formatLrcTimestamp(currentTime)} [Outro / End]`);
  } else if (rawLyrics && rawLyrics.trim()) {
    const lines = rawLyrics.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const sceneDur = 4;
    lines.forEach((line, idx) => {
      lrcRows.push(`${formatLrcTimestamp(idx * sceneDur)} ${line}`);
    });
    lrcRows.push(`${formatLrcTimestamp(lines.length * sceneDur)} [End]`);
  } else {
    lrcRows.push(`[00:00.00] [Music / Instrumental]`);
  }

  return [...headerLines, ...lrcRows].join('\n');
};

const getWunderbarInfoText = () => {
  return `================================================================================
WUNDERBAR! - Free AI Prompt Variations & Slideshow Video Tool
================================================================================

LINKS:
  • Primary: https://perchance.org/aa-wunderbar
  • Mirror:  https://perchance.org/audio-arc

ABOUT WUNDERBAR!:
Wunderbar! is a free, web-based companion AI tool created on Perchance that works
seamlessly with AudioArc prompt exports. It enables you to experiment with
alternative prompt variations and create instant slideshow video animations
without needing API keys, credits, or software installation.

HOW TO USE WITH THIS AUDIOARC EXPORT:
1. Open https://perchance.org/aa-wunderbar (or https://perchance.org/audio-arc).
2. Open any of the exported prompt files included in this zip bundle:
   - 'image_prompts.txt'   -> Scene keyframe image generation prompts
   - 'video_prompts.txt'   -> Subtle, Dynamic, and Stylistic video prompts
   - 'sora_prompts.txt'    -> Cinematic Sora video direction prompts
   - 'master_shotlist.txt' -> Complete chronological scene breakdown
3. Copy and paste your desired prompt list into the large text box on Wunderbar!
4. Try the 4 different style variation generators to explore alternative
   artistic aesthetics, color palettes, and cinematography vibes.
5. Use the built-in slideshow mode to preview sequence pacing and rhythm.

AudioArc + Wunderbar! provides a 100% free creative sandbox
for music video directors, animators, and visual storytellers.
================================================================================
`;
};

const getInfluenceDescriptions = (names: string[], customInfluences: CustomInfluence[]) => {
    const descriptions: string[] = [];
    Object.values(INFLUENCE_CATEGORIES).forEach(category => {
        category.forEach(item => {
            if (names.includes(item.name)) {
                descriptions.push(`${item.name} (${item.desc})`);
            }
        });
    });
    customInfluences.forEach(item => {
        if (names.includes(item.name)) {
            descriptions.push(`${item.name} (${item.desc})`);
        }
    });
    return descriptions.join('; ');
};

const selectAllInfluences = (customInfluences: CustomInfluence[], setSelectedInfluences: React.Dispatch<React.SetStateAction<string[]>>) => {
    const allInfluences: string[] = [];
    Object.values(INFLUENCE_CATEGORIES).forEach(category => {
        category.forEach(item => allInfluences.push(item.name));
    });
    customInfluences.forEach(item => allInfluences.push(item.name));
    setSelectedInfluences(allInfluences);
};

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const exportStoryboardAsPDF = async (filename = 'storyboard.pdf') => {
  const storyboardElement = document.getElementById('storyboard-container');
  if (!storyboardElement) return;

  const canvas = await html2canvas(storyboardElement, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
};

const getBase64Parts = (dataUrl: string) => {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;
    return { mimeType: matches[1], data: matches[2] };
};

const VideoGenerationStatus = ({ state }: { state: any }) => {
    const [elapsed, setElapsed] = useState(0);
    const [message, setMessage] = useState(VIDEO_LOADING_MESSAGES[0]);

    useEffect(() => {
        if (!state || !state.startTime) return;
        const timer = setInterval(() => {
            setElapsed(Math.floor((Date.now() - state.startTime) / 1000));
        }, 1000);

        const messageChanger = setInterval(() => {
            setMessage(VIDEO_LOADING_MESSAGES[Math.floor(Math.random() * VIDEO_LOADING_MESSAGES.length)]);
        }, 3000);

        return () => {
            clearInterval(timer);
            clearInterval(messageChanger);
        };
    }, [state]);

    return (
        <div className="p-4 text-center">
            <Loader2 size={24} className="text-green-400 mx-auto mb-2 animate-spin" />
            <p className="text-xs text-green-300 font-bold">Generating Video...</p>
            <p className="text-[10px] text-gray-400 mt-1 mb-2">{message}</p>
            <p className="text-[10px] mono-font text-gray-500">Elapsed: {formatTime(elapsed)}</p>
        </div>
    );
};


// --- Main Component ---
export const App: React.FC = () => {
  useEffect(() => {
    console.log("App Version: 1.0.2 - Custom Modal Fix");
  }, []);
  // --- State ---
  const [lyrics, setLyrics] = useState<string>('');
  const [narrative, setNarrative] = useState<string>('');
  const [selectedInfluences, setSelectedInfluences] = useState<string[]>([]);
  const [customInfluences, setCustomInfluences] = useState<CustomInfluence[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>(VISUAL_STYLES[0].id);
  const [uiThemeColor, setUiThemeColor] = useState<string>(VISUAL_STYLES[0].color);
  const [visualRefs, setVisualRefs] = useState<VisualReference[]>([]);
  const [hasPaidKey, setHasPaidKey] = useState(false);

  // Audio State
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSlideshowMode, setIsSlideshowMode] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  // App State
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<string>(''); 
  const [storyboard, setStoryboard] = useState<ScenePrompt[] | null>(null);
  const [historyStack, setHistoryStack] = useState<{past: ScenePrompt[][], future: ScenePrompt[][]}>({ past: [], future: [] });
  const snapshotRef = useRef<ScenePrompt[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | {title: string; body: string; action?: () => void} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
  } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Data State
  const [savedScenes, setSavedScenes] = useState<ScenePrompt[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [_remixLoading, setRemixLoading] = useState<Record<string, boolean>>({});
  const [sceneGenerationLoading, setSceneGenerationLoading] = useState<Record<number, boolean>>({});
  const [promptPartLoading, setPromptPartLoading] = useState<Record<string, boolean>>({});
  const [imageGenerationLoading, setImageGenerationLoading] = useState<Record<number, boolean>>({});
  const [aiSmartSuggestions, setAiSmartSuggestions] = useState<Record<number, PromptTag[]>>({});
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState<Record<number, boolean>>({});
  const [videoGenerationState, setVideoGenerationState] = useState<Record<string, { status: string; startTime: number; error?: string }>>({});
  const [batchGenState, setBatchGenState] = useState<BatchGenState>({ generating: false, current: 0, total: 0, success: 0, failures: 0 });
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState<number>(0);
  const playbackInterval = useRef<number | null>(null);

  // Multi-Track Storyboard & Animatic Preview State
  const [storyboardViewMode, setStoryboardViewMode] = useState<'cards' | 'multitrack'>('cards');
  const [multiTrackProject, setMultiTrackProject] = useState<MultiTrackProject | null>(null);
  const [animaticPreviewMode, setAnimaticPreviewMode] = useState<'docked' | 'floating' | 'fullscreen'>('docked');
  const [showFloatingAnimatic, setShowFloatingAnimatic] = useState<boolean>(false);

  // UI Toggles
  const [showScriptModal, setShowScriptModal] = useState<boolean>(false);
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [scriptLoading, setScriptLoading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'config' | 'guide' | 'billing'>('config');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showExport, setShowExport] = useState<boolean>(false);
  const [showSoraBuilder, setShowSoraBuilder] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showSavedScenes, setShowSavedScenes] = useState<boolean>(false);
  const [promptPresets, setPromptPresets] = useState<PromptPreset[]>(() => loadPromptPresets());
  const [showPromptPresetsModal, setShowPromptPresetsModal] = useState<boolean>(false);
  const [presetTargetSceneIndex, setPresetTargetSceneIndex] = useState<number | null>(null);
  const [initialPresetData, setInitialPresetData] = useState<Partial<PromptPreset> | null>(null);
  const [showManual, setShowManual] = useState<boolean>(false);
  const [manualSection, setManualSection] = useState('core');
  const [showSlideshow, setShowSlideshow] = useState<boolean>(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [showResources, setShowResources] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showAnimaticModal, setShowAnimaticModal] = useState<boolean>(false);
  const [showCharacterCreator, setShowCharacterCreator] = useState<boolean>(false);
  const [showQuickSwapModal, setShowQuickSwapModal] = useState<boolean>(false);
  const [quickSwapSourceRefId, setQuickSwapSourceRefId] = useState<string | null>(null);
  const [showBatchCharacterModal, setShowBatchCharacterModal] = useState<boolean>(false);
  const [batchCharacterInitialRefId, setBatchCharacterInitialRefId] = useState<string | null>(null);
  const [showColorGradeModal, setShowColorGradeModal] = useState<boolean>(false);
  const [colorGradeFocusSceneIndex, setColorGradeFocusSceneIndex] = useState<number | null>(null);
  const [showStyleRefinerModal, setShowStyleRefinerModal] = useState<boolean>(false);
  const [showContrastBoosterModal, setShowContrastBoosterModal] = useState<boolean>(false);
  const [contrastBoosterFocusSceneIndex, setContrastBoosterFocusSceneIndex] = useState<number | null>(null);
  const [showAIEditor, setShowAIEditor] = useState<boolean>(false);
  const [showClearDataModal, setShowClearDataModal] = useState<boolean>(false);
  const [audioIntensityData, setAudioIntensityData] = useState<number[] | null>(null);
  const [detectedBeatDrops, setDetectedBeatDrops] = useState<AudioBeatDrop[]>([]);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState<boolean>(false);
  const [showBeatMarkers, setShowBeatMarkers] = useState<boolean>(true);
  const [snapSensitivity, setSnapSensitivity] = useState<number>(55);
  const [snapPacingMode, setSnapPacingMode] = useState<'snap_existing' | 'distribute_drops' | 'dynamic_flow'>('snap_existing');
  const [snapMinSceneDuration, setSnapMinSceneDuration] = useState<number>(1.5);
  const [snapFitAudioDuration, setSnapFitAudioDuration] = useState<boolean>(true);
  const [lastSnapResultStats, setLastSnapResultStats] = useState<SnapResult['stats'] | null>(null);
  const [aiEditorCommand, setAiEditorCommand] = useState('');
  const [aiEditorLoading, setAiEditorLoading] = useState(false);
  const [imageIntegrationLevel, setImageIntegrationLevel] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [sceneSplitThreshold, setSceneSplitThreshold] = useState<number>(50);

  const [influenceSearch, setInfluenceSearch] = useState<string>('');
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [customModalName, setCustomModalName] = useState('');
  const [customModalDesc, setCustomModalDesc] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [characterModalName, setCharacterModalName] = useState('');
  const [characterModalDesc, setCharacterModalDesc] = useState('');
  const [isAutoDescribing, setIsAutoDescribing] = useState(false);
  const [activeRemixMenu, setActiveRemixMenu] = useState<{sceneIdx: number, promptIdx: number} | null>(null);
  const [activeLinkMenu, setActiveLinkMenu] = useState<string | null>(null);
  const [animaticProgress, setAnimaticProgress] = useState({ percent: 0, status: '' });
  const [isGeneratingAnimatic, setIsGeneratingAnimatic] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  
  // Animatic Modal State
  const [animaticResolution, setAnimaticResolution] = useState('1280x720');
  const [animaticTransition, setAnimaticTransition] = useState<'cut' | 'fade'>('cut');
  const [animaticFade, setAnimaticFade] = useState(0.5);

  // Config State
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'ollama' | 'lmstudio' | 'openrouter' | 'pollinations'>('gemini');
  const [apiKeyStatus, setApiKeyStatus] = useState<'detected' | 'not_found'>('not_found');
  // Gemini
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('audioarc_gemini_key');
      if (saved) return saved;
    } catch {}
    try {
      if (typeof process !== 'undefined' && process.env) {
        if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
        if (process.env.API_KEY) return process.env.API_KEY;
      }
    } catch {}
    try {
      if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        if ((import.meta as any).env.VITE_GEMINI_API_KEY) return (import.meta as any).env.VITE_GEMINI_API_KEY;
        if ((import.meta as any).env.GEMINI_API_KEY) return (import.meta as any).env.GEMINI_API_KEY;
      }
    } catch {}
    return '';
  });

  const getEffectiveGeminiKey = useCallback((): string => {
    if (geminiApiKey && geminiApiKey.trim()) return geminiApiKey.trim();
    try {
      if (typeof process !== 'undefined' && process.env) {
        if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
        if (process.env.API_KEY) return process.env.API_KEY;
      }
    } catch {}
    try {
      if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        if ((import.meta as any).env.VITE_GEMINI_API_KEY) return (import.meta as any).env.VITE_GEMINI_API_KEY;
        if ((import.meta as any).env.GEMINI_API_KEY) return (import.meta as any).env.GEMINI_API_KEY;
      }
    } catch {}
    return '';
  }, [geminiApiKey]);

  const [showGeminiKeySecret, setShowGeminiKeySecret] = useState<boolean>(false);

  const handleUpdateGeminiKey = useCallback((newKey: string) => {
    const clean = newKey.trim();
    setGeminiApiKey(clean);
    if (clean) {
      try {
        localStorage.setItem('audioarc_gemini_key', clean);
      } catch {}
      setApiKeyStatus('detected');
    } else {
      try {
        localStorage.removeItem('audioarc_gemini_key');
      } catch {}
      const fallback = (typeof process !== 'undefined' && process.env && (process.env.GEMINI_API_KEY || process.env.API_KEY)) || '';
      setApiKeyStatus(fallback ? 'detected' : 'not_found');
    }
  }, []);
  const [geminiMainModel, setGeminiMainModel] = useState<string>('gemini-3.8-flash');
  const [geminiUtilityModel, setGeminiUtilityModel] = useState<string>('gemini-3.1-flash-lite');
  // Image Generation
  const [imageProvider, setImageProvider] = useState<'google' | 'openrouter'>('google');
  const [geminiImageModel, setGeminiImageModel] = useState<string>('gemini-3.1-flash-image');
  const [imageEngine, setImageEngine] = useState<'gemini' | 'imagen'>('gemini');
  const [imagenModel, setImagenModel] = useState<string>('imagen-4.0-generate-001');
  const [imageFormat, setImageFormat] = useState<'image/png' | 'image/jpeg'>('image/jpeg');
  const [openRouterImageModel, setOpenRouterImageModel] = useState<string>('stabilityai/stable-diffusion-3-medium');
  // Video Generation
  const [videoProvider, setVideoProvider] = useState<'google' | 'runway' | 'ltx'>('runway');
  // OpenAI
  const [openAIKey, setOpenAIKey] = useState<string>(() => localStorage.getItem('audioarc_openai_key') || '');
  const [openAIModel, setOpenAIModel] = useState<string>(() => localStorage.getItem('audioarc_openai_model') || 'gpt-4o');
  const [openAIBaseUrl, setOpenAIBaseUrl] = useState<string>(() => localStorage.getItem('audioarc_openai_url') || 'https://api.openai.com/v1');
  const [availableOpenAIModels, setAvailableOpenAIModels] = useState<string[]>(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini', 'o1']);
  // Ollama
  const [localProvider, setLocalProvider] = useState<string>('ollama');
  const [ollamaUrl, setOllamaUrl] = useState<string>('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState<string>('llama3');
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([]);
  // LM Studio (Local / Offline)
  const [lmStudioUrl, setLmStudioUrl] = useState<string>(() => localStorage.getItem('audioarc_lmstudio_url') || 'http://localhost:1234/v1');
  const [lmStudioModel, setLmStudioModel] = useState<string>(() => localStorage.getItem('audioarc_lmstudio_model') || 'loaded-model');
  const [availableLmStudioModels, setAvailableLmStudioModels] = useState<string[]>([]);
  const [loadingLmStudioModels, setLoadingLmStudioModels] = useState<boolean>(false);
  // OpenRouter
  const [openRouterKey, setOpenRouterKey] = useState<string>('');
  const [openRouterModel, setOpenRouterModel] = useState<string>('meta-llama/llama-3.1-8b-instruct:free');
  const [openRouterUrl, setOpenRouterUrl] = useState<string>('https://openrouter.ai/api/v1');
  // Pollinations
  const [pollinationsUrl, setPollinationsUrl] = useState<string>(() => localStorage.getItem('audioarc_pollinations_url') || 'https://text.pollinations.ai/');
  const [pollinationsModel, setPollinationsModel] = useState<string>(() => localStorage.getItem('audioarc_pollinations_model') || 'openai');
  const [pollinationsApiKey, setPollinationsApiKey] = useState<string>(() => localStorage.getItem('audioarc_pollinations_key') || '');
  const [availablePollinationsModels, setAvailablePollinationsModels] = useState<string[]>([
    'openai', 'openai-fast', 'qwen', 'mistral', 'deepseek', 'llama', 'claude'
  ]);
  const [openRouterModelSearch, setOpenRouterModelSearch] = useState<string>('');
  const [openRouterImageModelSearch, setOpenRouterImageModelSearch] = useState<string>('');
  const [availableOpenRouterModels, setAvailableOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [loadingOpenRouterModels, setLoadingOpenRouterModels] = useState<boolean>(false);
  
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  // Session Token & API Metrics State
  const [totalTokenUsage, setTotalTokenUsage] = useState<number>(0);
  const [sessionApiRequests, setSessionApiRequests] = useState<number>(0);
  const [sessionTokenBudget, setSessionTokenBudget] = useState<number>(100000);

  // Project & Export Naming State
  const [projectName, setProjectName] = useState<string>(() => localStorage.getItem('audioarc_project_name') || '');
  const [exportIncludeDate, setExportIncludeDate] = useState<boolean>(true);
  const [exportIncludeTimeSerial, setExportIncludeTimeSerial] = useState<boolean>(true);

  // Group Renaming State
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null);
  const [renameGroupInput, setRenameGroupInput] = useState<string>('');

  // Scene Summaries & Storyboard Navigation State
  const [generatingSummaryIdx, setGeneratingSummaryIdx] = useState<number | null>(null);
  const [isBatchSummarizing, setIsBatchSummarizing] = useState<boolean>(false);
  const [showSceneNavigator, setShowSceneNavigator] = useState<boolean>(false);
  const [sceneSearchQuery, setSceneSearchQuery] = useState<string>('');
  const [testStatuses, setTestStatuses] = useState<Record<string, 'idle' | 'testing' | 'ok' | 'error'>>({
    gemini: 'idle',
    openai: 'idle',
    ollama: 'idle',
    lmstudio: 'idle',
    openrouter: 'idle',
    pollinations: 'idle',
  });

  const stopRef = useRef<boolean>(false);

  // --- Effects ---
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setHasPaidKey(true);
      }
    };
    checkKey();
    
    const loadLargeData = async () => {
      try {
        const savedStoryboard = await idb.get('audioarc_storyboard') || localStorage.getItem('audioarc_storyboard');
        if (savedStoryboard) {
          const parsed = typeof savedStoryboard === 'string' ? JSON.parse(savedStoryboard) : savedStoryboard;
          setStoryboard(parsed);
        }

        const savedSaved = await idb.get('audioarc_saved_scenes') || localStorage.getItem('audioarc_saved_scenes');
        if (savedSaved) {
          const parsed = typeof savedSaved === 'string' ? JSON.parse(savedSaved) : savedSaved;
          setSavedScenes(parsed.map((s: any) => ({ ...s, id: s.id || generateUUID() })));
        }

        const savedRefs = await idb.get('audioarc_visual_refs') || localStorage.getItem('audioarc_visual_refs');
        if (savedRefs) {
          const parsed = typeof savedRefs === 'string' ? JSON.parse(savedRefs) : savedRefs;
          setVisualRefs(parsed);
        }

        const savedIntensity = await idb.get('audioarc_audio_intensity');
        if (savedIntensity && Array.isArray(savedIntensity) && savedIntensity.length > 0) {
          setAudioIntensityData(savedIntensity);
        }
      } catch (e) {
        console.error("Failed to load large data from IndexedDB", e);
      }
    };
    loadLargeData();
    
    const savedLyrics = localStorage.getItem('audioarc_lyrics'); if (savedLyrics) setLyrics(savedLyrics);
    const savedNarrative = localStorage.getItem('audioarc_narrative'); if (savedNarrative) setNarrative(savedNarrative);
    const savedCustom = localStorage.getItem('audioarc_custom_influences'); if (savedCustom) setCustomInfluences(JSON.parse(savedCustom));
    const savedHistory = localStorage.getItem('audioarc_history'); if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedPresets = localStorage.getItem('audioarc_prompt_presets');
    if (savedPresets) {
      try {
        const custom: PromptPreset[] = JSON.parse(savedPresets);
        setPromptPresets([...BUILTIN_PROMPT_PRESETS, ...custom]);
      } catch (e) {
        console.error("Failed to load prompt presets from localStorage", e);
      }
    }
    
    const savedOllama = localStorage.getItem('audioarc_ollama_config');
    if (savedOllama) { 
        const c = JSON.parse(savedOllama); 
        setOllamaUrl(c.url || 'http://localhost:11434'); 
        setOllamaModel(c.model || 'llama3'); 
        setProvider(c.provider || 'gemini');
        setLocalProvider(c.localProvider || 'ollama');
    }
    
    const savedOpenRouter = localStorage.getItem('audioarc_openrouter_config');
    if (savedOpenRouter) { 
        const c = JSON.parse(savedOpenRouter); 
        const rawKey = c.key || '';
        setOpenRouterKey(rawKey.trim().replace(/^Bearer\s+/i, '')); 
        setOpenRouterModel(c.model || 'meta-llama/llama-3.1-8b-instruct:free'); 
        setOpenRouterUrl((c.url || 'https://openrouter.ai/api/v1').trim().replace(/\/$/, '')); 
    }
    
    const savedGemini = localStorage.getItem('audioarc_gemini_config');
    if (savedGemini) { 
        const c = JSON.parse(savedGemini); 
        const main = c.mainModel;
        setGeminiMainModel(AI_MODELS.main.includes(main) ? main : 'gemini-3.8-flash'); 
        const utility = c.utilityModel;
        setGeminiUtilityModel(AI_MODELS.utility.includes(utility) ? utility : 'gemini-3.1-flash-lite'); 
        setImageProvider(c.imageProvider || 'google');
        const imgModel = c.geminiImageModel;
        setGeminiImageModel(AI_MODELS.image.gemini.includes(imgModel) ? imgModel : 'gemini-3.1-flash-image'); 
        setImageEngine(c.imageEngine || 'gemini'); 
        
        const savedImagenModel = c.imagenModel || 'imagen-4.0-generate-001';
        if (AI_MODELS.image.imagen.includes(savedImagenModel)) {
            setImagenModel(savedImagenModel);
        } else {
            setImagenModel(AI_MODELS.image.imagen[0]);
        }

        setImageFormat(c.imageFormat || 'image/jpeg');
        setOpenRouterImageModel(c.openRouterImageModel || 'stabilityai/stable-diffusion-3-medium');
    }
    const savedVideoConfig = localStorage.getItem('audioarc_video_config');
    if (savedVideoConfig) {
      setVideoProvider(JSON.parse(savedVideoConfig).provider || 'runway');
    }

    const savedOpenAI = localStorage.getItem('audioarc_openai_config');
    if (savedOpenAI) {
      try {
        const c = JSON.parse(savedOpenAI);
        if (c.key) setOpenAIKey(c.key);
        if (c.model) setOpenAIModel(c.model);
        if (c.url) setOpenAIBaseUrl(c.url);
      } catch (e) {}
    }

    const savedLmStudio = localStorage.getItem('audioarc_lmstudio_config');
    if (savedLmStudio) {
      try {
        const c = JSON.parse(savedLmStudio);
        if (c.url) setLmStudioUrl(c.url);
        if (c.model) setLmStudioModel(c.model);
      } catch (e) {}
    }

    const savedPollinations = localStorage.getItem('audioarc_pollinations_config');
    if (savedPollinations) {
      try {
        const c = JSON.parse(savedPollinations);
        if (c.url) setPollinationsUrl(c.url);
        if (c.model) setPollinationsModel(c.model);
        if (c.key) setPollinationsApiKey(c.key);
      } catch (e) {}
    }

    const savedSplitThreshold = localStorage.getItem('audioarc_scene_split_threshold');
    if (savedSplitThreshold) {
        setSceneSplitThreshold(parseInt(savedSplitThreshold));
    }

    const activeKey = getEffectiveGeminiKey();
    if (activeKey) {
        setApiKeyStatus('detected');
    } else {
        setApiKeyStatus('not_found');
        if(provider === 'gemini') {
            setShowSettings(true);
            setSettingsTab('billing');
        }
    }

  }, [getEffectiveGeminiKey]);

  useEffect(() => {
    const key = getEffectiveGeminiKey();
    setApiKeyStatus(key ? 'detected' : 'not_found');
  }, [geminiApiKey, getEffectiveGeminiKey]);

  // --- Local Storage Persistence ---
  const useDebouncedStorage = (key: string, value: any, delay: number = 300, useIdb: boolean = false) => {
    useEffect(() => {
      const handler = setTimeout(async () => {
        try {
          if (useIdb) {
            await idb.set(key, value);
            // Also remove from localStorage to free up space
            localStorage.removeItem(key);
          } else {
            const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, valueToStore);
          }

          if (key === 'audioarc_storyboard' && value !== null) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          }
        } catch (e) {
          console.warn(`Storage quota exceeded for key "${key}". Autosave for this item may be limited.`, e);
          setNotification(`Storage full: Autosave failed for "${key}".`);
          setTimeout(() => setNotification(null), 5000);
          if (key === 'audioarc_storyboard') {
            setErrorMessage("Autosave failed: Your browser's storage is full. Try deleting some saved scenes or visual references.");
          }
        }
      }, delay);
      return () => clearTimeout(handler);
    }, [key, value, delay, useIdb]);
  };

  useDebouncedStorage('audioarc_lyrics', lyrics);
  useDebouncedStorage('audioarc_narrative', narrative);
  useDebouncedStorage('audioarc_custom_influences', customInfluences);
  useDebouncedStorage('audioarc_history', history);
  useDebouncedStorage('audioarc_prompt_presets', promptPresets.filter(p => !p.isBuiltIn));
  useDebouncedStorage('audioarc_saved_scenes', savedScenes, 300, true);
  useDebouncedStorage('audioarc_visual_refs', visualRefs, 300, true);
  useDebouncedStorage('audioarc_storyboard', storyboard, 1000, true); // Save storyboard with longer delay and IDB
  useDebouncedStorage('audioarc_audio_intensity', audioIntensityData, 1000, true);
  useDebouncedStorage('audioarc_scene_split_threshold', sceneSplitThreshold);
  
  const ollamaConfig = { url: ollamaUrl, model: ollamaModel, provider, localProvider };
  useDebouncedStorage('audioarc_ollama_config', ollamaConfig);
  
  const openRouterConfig = { key: openRouterKey, model: openRouterModel, url: openRouterUrl };
  useDebouncedStorage('audioarc_openrouter_config', openRouterConfig);
  
  const geminiConfig = { mainModel: geminiMainModel, utilityModel: geminiUtilityModel, imageProvider, geminiImageModel, imageEngine, imagenModel, imageFormat, openRouterImageModel };
  useDebouncedStorage('audioarc_gemini_config', geminiConfig);

   const videoConfig = { provider: videoProvider };
  useDebouncedStorage('audioarc_video_config', videoConfig);

  const openAIConfig = { key: openAIKey, model: openAIModel, url: openAIBaseUrl };
  useDebouncedStorage('audioarc_openai_config', openAIConfig);

  const lmStudioConfig = { url: lmStudioUrl, model: lmStudioModel };
  useDebouncedStorage('audioarc_lmstudio_config', lmStudioConfig);

  const pollinationsConfig = { url: pollinationsUrl, model: pollinationsModel, key: pollinationsApiKey };
  useDebouncedStorage('audioarc_pollinations_config', pollinationsConfig);

  useEffect(() => {
    if (audioIntensityData && audioIntensityData.length > 0) {
      const peaks = detectAudioPeakDrops(audioIntensityData, audioDuration, {
        sensitivity: snapSensitivity,
        minDistanceSeconds: snapMinSceneDuration
      });
      setDetectedBeatDrops(peaks);
    } else {
      setDetectedBeatDrops([]);
    }
  }, [audioIntensityData, audioDuration, snapSensitivity, snapMinSceneDuration]);

  useEffect(() => {
    if (!isPlaying || !storyboard || storyboard.length === 0) {
        if (playbackInterval.current) clearTimeout(playbackInterval.current);
        return;
    }
    if (audioUrl) return; // Audio playback handles its own timing

    const advanceScene = () => {
        setCurrentPlaybackIndex(prev => {
            const nextIndex = prev + 1;
            if (nextIndex >= storyboard.length) {
                setIsPlaying(false);
                return 0;
            }
            return nextIndex;
        });
    };
    
    playbackInterval.current = window.setTimeout(advanceScene, (storyboard[currentPlaybackIndex]?.duration || 4) * 1000);

    return () => { if (playbackInterval.current) clearTimeout(playbackInterval.current); };
}, [isPlaying, audioUrl, storyboard, currentPlaybackIndex]);

  // Synchronize Multi-Track Project when storyboard, audio, or visual references change
  useEffect(() => {
    if (storyboard && storyboard.length > 0) {
      setMultiTrackProject(prev => {
        return buildMultiTrackFromStoryboard(
          storyboard,
          audioUrl,
          audioDuration,
          visualRefs,
          prev?.clips
        );
      });
    }
  }, [storyboard, audioUrl, audioDuration]);

  useEffect(() => {
    let intervalId: number | null = null;
    if (loading || scriptLoading || batchGenState.generating) {
        const lyricLines = lyrics.split('\n').filter(line => line.trim() !== '' && !line.startsWith('[') && !line.endsWith(']'));
        intervalId = window.setInterval(() => {
            let randomMessage = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
            
            if (batchGenState.generating) {
                randomMessage = `Processing Batch ${batchGenState.current} of ${batchGenState.total}... (${batchGenState.success} Success, ${batchGenState.failures} Failed)`;
            } else if (lyricLines.length > 0 && Math.random() < 0.2) {
                const randomLyric = lyricLines[Math.floor(Math.random() * lyricLines.length)];
                randomMessage = `Thinking about: "${randomLyric.substring(0, 50)}..."`;
            }
            setProgress(randomMessage);
        }, 2000);
    }
    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [loading, scriptLoading, lyrics]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeRemixMenu && !(e.target as HTMLElement).closest('.remix-menu-container')) {
        setActiveRemixMenu(null);
      }
      if (activeLinkMenu && !(e.target as HTMLElement).closest('.link-menu-container')) {
        setActiveLinkMenu(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeRemixMenu, activeLinkMenu]);

  // --- Core Handlers ---
  const handleApiError = (error: any, context: string) => {
      console.error(`${context} Error:`, error);
      let friendlyMessage = error?.message || String(error);

      if (friendlyMessage.toLowerCase().includes('timeout')) {
          friendlyMessage += `\n\nThis can happen if the AI model is slow to respond. You can try again, or select a faster model in Settings.`;
      } else if (error instanceof TypeError && (friendlyMessage.includes('Failed to fetch') || friendlyMessage.includes('NetworkError'))) {
          if (provider === 'ollama') {
              friendlyMessage = `Connection Failed: Could not reach Ollama at ${ollamaUrl}.\n\n1. Ensure Ollama is running.\n2. Ensure Ollama is configured for web access (CORS). Check the Connection Guides in Settings for instructions.`;
          } else if (provider === 'openrouter') {
              friendlyMessage = `Connection Failed: Could not reach OpenRouter. Please check your network connection and the URL in settings.`;
          } else {
              friendlyMessage = `A network error occurred. Please check your internet connection or the API URL.`;
          }
      } else if (friendlyMessage.includes('429') && (friendlyMessage.includes('quota') || friendlyMessage.includes('RESOURCE_EXHAUSTED'))) {
          setErrorMessage({
              title: "API Quota Exceeded",
              body: `This can happen even on paid accounts if billing is not correctly linked to your project.\n\nPlease use the API & Billing Helper to diagnose the issue.`,
              action: () => {
                  setShowSettings(true);
                  setSettingsTab('billing');
              }
          });
          return;
      } else if (friendlyMessage.includes("xhr error")) {
          friendlyMessage = "A network error occurred while contacting the API. Please check your connection and try again.";
      } else if (friendlyMessage.includes('JSON')) {
          friendlyMessage = `The AI returned an invalid response. This can happen with complex prompts. Try simplifying your influences or narrative.\n\nRaw response snippet:\n${friendlyMessage.substring(0, 200)}...`;
      }
      
      setErrorMessage(`${context} Failed:\n\n${friendlyMessage}`);
  };

  const handleManualSave = async () => {
    try {
        setSaveStatus('saving');
        localStorage.setItem('audioarc_project_name', projectName);
        localStorage.setItem('audioarc_lyrics', lyrics);
        localStorage.setItem('audioarc_narrative', narrative);
        localStorage.setItem('audioarc_custom_influences', JSON.stringify(customInfluences));
        
        await idb.set('audioarc_visual_refs', visualRefs);
        localStorage.removeItem('audioarc_visual_refs');

        if (storyboard) {
            await idb.set('audioarc_storyboard', storyboard);
            localStorage.removeItem('audioarc_storyboard');
        }
        
        await idb.set('audioarc_saved_scenes', savedScenes);
        localStorage.removeItem('audioarc_saved_scenes');

        setTimeout(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 300);
    } catch (e) {
        setErrorMessage("Failed to save project. Your browser's storage might be full.");
        setSaveStatus('idle');
    }
  };

  const checkKeysAndShowSettings = () => {
    if (provider === 'gemini' && !getEffectiveGeminiKey()) {
        setErrorMessage("Gemini API Key not found. Please enter your API key in Settings -> Gemini or Settings -> Connection.");
        setShowSettings(true);
        setSettingsTab('config');
        return false;
    }
    if (provider === 'openrouter' && (!openRouterKey.trim() || !openRouterUrl.trim())) {
        setErrorMessage("OpenRouter API Key or URL is missing. Please check your settings.");
        setShowSettings(true);
        setSettingsTab('config');
        return false;
    }
    if (provider === 'openai' && !openAIKey.trim()) {
        setErrorMessage("OpenAI API Key is missing. Please enter your API key in Settings.");
        setShowSettings(true);
        setSettingsTab('config');
        return false;
    }
    return true;
  };

  const executeReset = async () => {
      stopRef.current = true;
      setLoading(false);
      setScriptLoading(false);
      setProgress('');
      setRemixLoading({});
      setSceneGenerationLoading({});
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentPlaybackIndex(0);
      setStoryboard(null);
      setGeneratedScript('');
      setIsSlideshowMode(false);
      
      await idb.del('audioarc_visual_refs');
      await idb.del('audioarc_storyboard');
      await idb.del('audioarc_saved_scenes');
      await idb.del('audioarc_audio_intensity');
      
      localStorage.removeItem('audioarc_visual_refs');
      localStorage.removeItem('audioarc_storyboard');
      localStorage.removeItem('audioarc_saved_scenes');
      localStorage.removeItem('audioarc_audio_intensity');
      
      setVisualRefs([]);
      setAudioIntensityData(null);
      setDetectedBeatDrops([]);
      setLastSnapResultStats(null);
      setHistoryStack({ past: [], future: [] });
      setSelectedInfluences([]);
      if (VISUAL_STYLES.length > 0) {
          setSelectedStyleId(VISUAL_STYLES[0].id);
          setUiThemeColor(VISUAL_STYLES[0].color);
      }
      setShowResetConfirm(false);
      setNotification("Project reset successfully.");
      setTimeout(() => setNotification(null), 3000);
  };

  const performProviderRequest = async (prompt: string, isJson = false, images?: string[]): Promise<string> => {
      if (provider === 'openai') return await performOpenAIRequest(prompt, isJson, images);
      if (provider === 'ollama') return await performOllamaRequest(prompt, isJson, images);
      if (provider === 'lmstudio') return await performLmStudioRequest(prompt, isJson, images);
      if (provider === 'openrouter') return await performOpenRouterRequest(prompt, images, isJson);
      if (provider === 'pollinations') return await performPollinationsRequest(prompt, isJson);
      return '';
  };

  const performOpenAIRequest = async (prompt: string, isJson = false, images?: string[]): Promise<string> => {
      let baseUrl = openAIBaseUrl.trim().replace(/\/$/, '');
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `https://${baseUrl}`;
      }
      const url = `${baseUrl}/chat/completions`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

      try {
          let userContent: any = prompt;
          if (images && images.length > 0) {
              userContent = [
                  { type: 'text', text: prompt },
                  ...images.map(img => ({
                      type: 'image_url',
                      image_url: { url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}` }
                  }))
              ];
          }

          const payload: any = {
              model: openAIModel.trim() || 'gpt-4o',
              messages: [
                  { role: 'system', content: 'You are an expert cinematic music video director and prompt engineer. Strictly adhere to the requested format and output instructions.' },
                  { role: 'user', content: userContent }
              ],
              temperature: 0.7
          };
          if (isJson) {
              payload.response_format = { type: 'json_object' };
          }

          const res = await fetch(url, {
              method: 'POST',
              signal: controller.signal,
              headers: {
                  'Authorization': `Bearer ${openAIKey.trim().replace(/^Bearer\s+/i, '')}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
              let errText = `HTTP ${res.status}: ${res.statusText}`;
              try {
                  const errJson = await res.json();
                  errText = errJson.error?.message || JSON.stringify(errJson);
              } catch {}
              throw new Error(`OpenAI API Error: ${errText}`);
          }

          const data = await res.json();
          const result = data.choices?.[0]?.message?.content || '';
          if (data.usage?.total_tokens) {
              updateUsage(data.usage.total_tokens);
          } else {
              updateUsage(null, prompt, result);
          }
          return result;
      } catch (e: any) {
          clearTimeout(timeoutId);
          if (e.name === 'AbortError') throw new Error("OpenAI request timed out after 3 minutes.");
          if (e.name === 'TypeError' && (e.message === 'Failed to fetch' || e.message === 'NetworkError when attempting to fetch resource.')) {
              throw new Error("Connection Failed: Cannot reach OpenAI API. Check your internet connection or API settings.");
          }
          throw e;
      }
  };

  const performLmStudioRequest = async (prompt: string, isJson = false, images?: string[], retries = 2): Promise<string> => {
      let baseUrl = lmStudioUrl.trim().replace(/\/$/, '');
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `http://${baseUrl}`;
      }
      const url = `${baseUrl}/chat/completions`;

      for (let i = 0; i < retries; i++) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 180000);

          try {
              let userContent: any = prompt;
              if (images && images.length > 0) {
                  userContent = [
                      { type: 'text', text: prompt },
                      ...images.map(img => ({
                          type: 'image_url',
                          image_url: { url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}` }
                      }))
                  ];
              }

              const payload: any = {
                  model: lmStudioModel.trim() || 'loaded-model',
                  messages: [
                      { role: 'system', content: 'You are an elite cinematic music video director and prompt engineer. Strictly follow formatting and output instructions.' },
                      { role: 'user', content: userContent }
                  ],
                  temperature: 0.7,
                  stream: false
              };
              if (isJson) {
                  payload.response_format = { type: 'json_object' };
              }

              const res = await fetch(url, {
                  method: 'POST',
                  signal: controller.signal,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              });
              clearTimeout(timeoutId);

              if (!res.ok) {
                  let errText = `HTTP ${res.status}: ${res.statusText}`;
                  try {
                      const errData = await res.json();
                      errText = errData.error?.message || errData.message || JSON.stringify(errData);
                  } catch {}
                  throw new Error(`LM Studio Error: ${errText}`);
              }

              const data = await res.json();
              const result = data.choices?.[0]?.message?.content || '';
              if (data.usage?.total_tokens) {
                  updateUsage(data.usage.total_tokens);
              } else {
                  updateUsage(null, prompt, result);
              }
              return result;
          } catch (e: any) {
              clearTimeout(timeoutId);
              if (i === retries - 1) {
                  if (e.name === 'AbortError') throw new Error("LM Studio request timed out after 3 minutes. The local model may be overloaded or still compiling.");
                  if (e.name === 'TypeError' && (e.message === 'Failed to fetch' || e.message === 'NetworkError when attempting to fetch resource.')) {
                      throw new Error(
                          `Connection Failed: AudioArc cannot reach LM Studio at ${baseUrl}.\n\n` +
                          `1. Ensure LM Studio Local Server is running (Developer / Local Server tab).\n` +
                          `2. Ensure "Cross-Origin Resource Sharing (CORS)" is enabled in LM Studio.\n` +
                          `3. Check that a model is loaded in LM Studio.`
                      );
                  }
                  throw e;
              }
              console.warn(`LM Studio request attempt ${i + 1} failed, retrying...`);
              await new Promise(r => setTimeout(r, 1500 * (i + 1)));
          }
      }
      return '';
  };

  const performPollinationsRequest = async (prompt: string, isJson = false): Promise<string> => {
      let baseUrl = pollinationsUrl.trim().replace(/\/$/, '');
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `https://${baseUrl}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

      try {
          const headers: Record<string, string> = {
              'Content-Type': 'application/json'
          };
          if (pollinationsApiKey.trim()) {
              headers['Authorization'] = `Bearer ${pollinationsApiKey.trim().replace(/^Bearer\s+/i, '')}`;
          }

          let resultText = '';

          // If user pointed to gen.pollinations.ai or an OpenAI-compatible endpoint
          if (baseUrl.includes('gen.pollinations.ai') || baseUrl.includes('/v1')) {
              const url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
              const payload: any = {
                  model: pollinationsModel || 'openai',
                  messages: [
                      { role: 'system', content: 'You are an elite cinematic music video director and prompt engineer. Strictly adhere to formatting instructions.' },
                      { role: 'user', content: prompt }
                  ],
                  temperature: 0.7
              };
              if (isJson) payload.response_format = { type: 'json_object' };

              const res = await fetch(url, {
                  method: 'POST',
                  signal: controller.signal,
                  headers,
                  body: JSON.stringify(payload)
              });
              clearTimeout(timeoutId);

              if (!res.ok) {
                  let errText = `HTTP ${res.status}: ${res.statusText}`;
                  try {
                      const errData = await res.json();
                      errText = errData.error?.message || errData.message || JSON.stringify(errData);
                  } catch {}
                  throw new Error(`Pollinations Error: ${errText}`);
              }
              const data = await res.json();
              resultText = data.choices?.[0]?.message?.content || '';
          } else {
              // Standard text.pollinations.ai endpoint
              const url = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
              const payload: any = {
                  messages: [
                      { role: 'system', content: 'You are an elite cinematic music video director and prompt engineer. Strictly adhere to formatting instructions.' },
                      { role: 'user', content: prompt }
                  ],
                  model: pollinationsModel || 'openai',
                  jsonMode: isJson,
                  seed: Math.floor(Math.random() * 1000000)
              };

              const res = await fetch(url, {
                  method: 'POST',
                  signal: controller.signal,
                  headers,
                  body: JSON.stringify(payload)
              });
              clearTimeout(timeoutId);

              if (!res.ok) {
                  let errText = `HTTP ${res.status}: ${res.statusText}`;
                  try {
                      const errJson = await res.json();
                      errText = errJson.details?.error?.message || errJson.error || JSON.stringify(errJson);
                  } catch {}
                  throw new Error(`Pollinations Error: ${errText}`);
              }
              resultText = await res.text();
          }

          updateUsage(null, prompt, resultText);
          return resultText;
      } catch (e: any) {
          clearTimeout(timeoutId);
          if (e.name === 'AbortError') throw new Error("Pollinations request timed out after 3 minutes.");
          if (e.name === 'TypeError' && (e.message === 'Failed to fetch' || e.message === 'NetworkError when attempting to fetch resource.')) {
              throw new Error("Connection Failed: Cannot reach Pollinations. Check your internet connection or API settings.");
          }
          throw e;
      }
  };

  const performOllamaRequest = async (prompt: string, isJson = false, images?: string[], retries = 3): Promise<string> => {
    let baseUrl = ollamaUrl.replace(/\/$/, '');
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `http://${baseUrl}`;
    }
    const url = `${baseUrl}/api/generate`;
    
    for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

        try {
            const payload: any = { model: ollamaModel, prompt, stream: false, keep_alive: '5m' };
            if (isJson) payload.format = 'json';
            if (images && images.length > 0) payload.images = images;
            
            const res = await fetch(url, { 
                method: 'POST', 
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });
            clearTimeout(timeoutId);

            if (!res.ok) throw new Error(`Ollama Error ${res.status}: ${res.statusText}`);
            const data = await res.json();
            if (data.prompt_eval_count || data.eval_count) {
                updateUsage((data.prompt_eval_count || 0) + (data.eval_count || 0));
            } else {
                updateUsage(null, prompt, data.response);
            }
            return data.response;
        } catch (e: any) {
            clearTimeout(timeoutId);
            if (i === retries - 1) {
                if (e.name === 'AbortError') {
                    throw new Error("Request to Ollama timed out after 3 minutes. Your local model may be slow to load or process the request. Try a smaller model or restart Ollama.");
                }
                if (e.name === 'TypeError' && (e.message === 'Failed to fetch' || e.message === 'NetworkError when attempting to fetch resource.')) throw new Error("Connection Failed: AudioArc cannot reach Ollama. \n\n1. Ensure Ollama is running.\n2. Ensure OLLAMA_ORIGINS=\"*\" is set.\n3. Check Settings > Connection Guides.");
                throw e;
            }
            console.warn(`Ollama request failed (attempt ${i + 1}), retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Exponential backoff
        }
    }
    return '';
  };
  

  const performOpenRouterRequest = async (prompt: string, images?: string[], isJson = false): Promise<string> => {
      const url = `${openRouterUrl.replace(/\/$/, '')}/chat/completions`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

      try {
          let userContent: any = prompt;
          if (images && images.length > 0) {
              userContent = [
                  { type: 'text', text: prompt },
                  ...images.map(img => ({ type: 'image_url', image_url: { url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}` } }))
              ];
          }

          const messages = [
              { role: 'system', content: isJson ? 'You are a helpful assistant designed to output JSON.' : 'You are a helpful assistant.' },
              { role: 'user', content: userContent }
          ];
          const body: any = { 
              model: openRouterModel, 
              messages: messages,
              max_tokens: 4096
          };
          if (isJson) body.response_format = { type: 'json_object' };

          if (!openRouterKey.trim()) throw new Error("OpenRouter API Key is missing or invalid.");
          
          const res = await fetch(url, {
              method: 'POST',
              signal: controller.signal,
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${openRouterKey.trim().replace(/^Bearer\s+/i, '')}`,
                'HTTP-Referer': 'https://audioarc.ai',
                'X-Title': 'AudioArc'
              },
              body: JSON.stringify(body)
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
              const errorBodyText = await res.text();
              let errorText = `[${res.status}] ${res.statusText}`;
              try {
                  const errorData = JSON.parse(errorBodyText);
                  errorText = errorData.error?.message || JSON.stringify(errorData);
              } catch (e) {
                  errorText = errorBodyText || errorText;
              }
              throw new Error(`OpenRouter Error: ${errorText}`);
          }
          const data = await res.json();
          if (data.usage?.total_tokens) {
              updateUsage(data.usage.total_tokens);
          } else {
              updateUsage(null, prompt, data.choices?.[0]?.message?.content);
          }
          return data.choices[0].message.content;
      } catch (e: any) {
          clearTimeout(timeoutId);
          if (e.name === 'AbortError') {
            throw new Error("Request timed out after 3 minutes. The model may be running slowly or the task is too complex. Please try again.");
          }
          if (e.name === 'TypeError' && (e.message === 'Failed to fetch' || e.message === 'NetworkError when attempting to fetch resource.')) {
              throw new Error("Connection Failed: Cannot reach OpenRouter. Check your internet connection or the API URL in settings.");
          }
          throw e;
      }
  };

  const fetchOpenRouterModels = async () => {
    setLoadingOpenRouterModels(true);
    setConnectionError(null);
    try {
        if (!openRouterKey) throw new Error("Please enter your OpenRouter API Key first.");
      const res = await fetch(`${openRouterUrl.trim().replace(/\/$/, '')}/models`, {
        headers: openRouterKey ? { 'Authorization': `Bearer ${openRouterKey.trim().replace(/^Bearer\s+/i, '')}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch models from OpenRouter. Check your API Key and URL.");
      const data = await res.json();
      
      const models: OpenRouterModel[] = data.data.map((m: any) => ({
        id: m.id,
        name: m.name,
        isFree: (m.pricing?.prompt === "0" && m.pricing?.completion === "0")
      }));

      const sortedModels = models.sort((a, b) => {
        if (a.isFree && !b.isFree) return -1;
        if (!a.isFree && b.isFree) return 1;
        return a.name.localeCompare(b.name);
      });

      setAvailableOpenRouterModels(sortedModels);
    } catch (e: any) {
      console.error("Failed to fetch OpenRouter models:", e);
      setConnectionError(e.message);
      setAvailableOpenRouterModels([]);
    } finally {
      setLoadingOpenRouterModels(false);
    }
  };

  const handleGenerate = async () => {
    if (!lyrics.trim()) {
      setErrorMessage("Please enter lyrics or a script before generating a storyboard.");
      return;
    }
    if (!checkKeysAndShowSettings()) return;
  
    setLoading(true);
    setStoryboard(null);
    stopRef.current = false;
    setProgress('Initializing Director AI...');
  
    try {
      const style = VISUAL_STYLES.find(s => s.id === selectedStyleId) || VISUAL_STYLES[0];
      const influenceList = getInfluenceDescriptions(selectedInfluences, customInfluences);
      const referenceContext = visualRefs.length > 0 ? `${visualRefs.map((r, i) => `CHARACTER ${i + 1}: "${r.name}" - Appearance: ${r.description}`).join('\n')}` : "";
      const durationContext = audioDuration > 0 ? `Total Duration: ${Math.floor(audioDuration)}s.` : "";
      const thresholdContext = `Scene Splitting Sensitivity (0-100, higher means more sensitive to rhythmic changes): ${sceneSplitThreshold}`;
  
      setProgress('Breaking down the script...');
      const beatSheetPrompt = `Analyze these lyrics and narrative to create a simple beat sheet. Break it down into logical scenes.
Lyrics:
${lyrics}
Narrative: ${narrative}
${durationContext}
${thresholdContext}
Output ONLY a valid JSON array of objects with keys: "lyric", "beat" (a one-sentence action), and optional "groupName". Ensure the JSON is clean and complete.`;
  
      let beatSheetJsonText = '';
      if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
        const beatSheetResult = await ai.models.generateContent({
          model: geminiUtilityModel,
          contents: beatSheetPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { lyric: { type: Type.STRING }, beat: { type: Type.STRING }, groupName: { type: Type.STRING } }, required: ["lyric", "beat"] } }
          }
        });
        updateUsage(beatSheetResult);
        beatSheetJsonText = beatSheetResult.text || '[]';
      } else {
        beatSheetJsonText = await performProviderRequest(beatSheetPrompt, true);
      }
  
      if (stopRef.current) return;
      const beats: Beat[] = normalizeKeys(JSON.parse(cleanJSON(beatSheetJsonText)));
      
      if (!beats || beats.length === 0) {
          throw new Error("The AI failed to break down your script into scenes. Try simplifying your lyrics or narrative.");
      }
  
      let fullStoryboard: ScenePrompt[] = [];
      const BATCH_SIZE = 3;
      const totalBatches = Math.ceil(beats.length / BATCH_SIZE);
      
      setBatchGenState({ generating: true, current: 0, total: totalBatches, success: 0, failures: 0 });

      for (let i = 0; i < beats.length; i += BATCH_SIZE) {
        if (stopRef.current) break;
        
        const batchIdx = Math.floor(i / BATCH_SIZE);
        const batch = beats.slice(i, i + BATCH_SIZE);
        setProgress(`Detailing scenes ${i + 1}-${Math.min(i + BATCH_SIZE, beats.length)}...`);
        setBatchGenState(prev => ({ ...prev, current: batchIdx + 1 }));
  
        const batchPrompt = `Act as an expert film director and imaginative creative partner, not just a technical transcriber.

**CREATIVE MANDATE:**
Be imaginative, vivid, and detailed. When influences like 'David Lynch' or 'Surrealist' are provided, embrace the abstract, dream-like logic, and unconventional imagery. Your goal is to be a creative visionary.

**CORE VISUAL DIRECTIVES (MANDATORY):**
1.  **CHARACTER INTEGRITY:** The characters in the 'CASTING' section MUST be depicted exactly as described. Do NOT change their species, appearance, or style.
2.  **SETTING INTEGRITY:** Influences should modify the scene's *mood, lighting, and camera work*, not fundamentally change the setting itself. "Fantasy Island" should feel tropical and mysterious, not become a cartoon.

**CONTEXT:**
Visual Style: ${style.name} (${style.visualDetails})
Influences: ${influenceList}
Narrative: "${narrative}"
CASTING:
${referenceContext ? referenceContext : "No specific character references provided."}

SCENE LENGTH CONSTRAINT: Each scene MUST be between 4 and 10 seconds.

**PROMPT GENERATION RULES:**
1.  **DESCRIPTION:** A concise, one-sentence summary of the visual beat.
2.  **IMAGE PROMPT (MASTER VISUAL):** Be extremely descriptive and cinematic. Specify composition, subject, action, lighting, and atmosphere with precision. CRITICAL: You MUST include specific details for the following:
    *   **Camera Angle:** e.g., 'low angle shot', 'overhead view', 'Dutch angle'.
    *   **Lens Type:** e.g., 'wide-angle lens', 'macro shot', '85mm portrait lens'.
    *   **Film Stock Emulation:** e.g., 'shot on Kodak Vision3 500T', 'grainy 16mm film', 'vintage Kodachrome look'.
3.  **VIDEO PROMPTS (MOTION):** Provide three distinct, highly creative cinematic interpretations for camera movement.
4.  **SORA/VEO/KLING PROMPT (NARRATIVE):** Synthesize the best ideas into a single, rich, evocative paragraph for a high-fidelity video model. It is critical to include specific, subtle animation cues for all characters mentioned (e.g., 'a character subtly averts their gaze,' 'a character's shoulders slump in defeat,' 'a character gestures excitedly with their hands'). These details are essential for creating a lifelike and emotionally resonant scene.

BEATS TO PROCESS:
${JSON.stringify(batch)}

OUTPUT: Return ONLY a valid JSON Array of objects for THIS BATCH.
Keys: "lyric", "description", "imagePrompt", "videoPrompts", "soraPrompt", "duration", "groupName".

IMPORTANT: Respond with ONLY a valid, complete JSON array of scene objects. Do not include any other text, titles, or markdown formatting. The JSON must be perfect.`;
  
        let batchJsonText = '';
        try {
            if (provider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
                const batchResult = await ai.models.generateContent({
                    model: geminiMainModel,
                    contents: batchPrompt,
                    config: {
                    responseMimeType: 'application/json',
                    responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { lyric: { type: Type.STRING }, description: { type: Type.STRING }, imagePrompt: { type: Type.STRING }, videoPrompts: { type: Type.ARRAY, items: { type: Type.STRING } }, soraPrompt: { type: Type.STRING }, duration: { type: Type.NUMBER }, groupName: { type: Type.STRING } }, required: ["lyric", "description", "imagePrompt", "videoPrompts", "soraPrompt", "duration"] } }
                    }
                });
                updateUsage(batchResult);
                batchJsonText = batchResult.text || '[]';
            } else {
                batchJsonText = await performProviderRequest(batchPrompt, true);
            }

            if (stopRef.current) return;

            const cleanedBatchJson = cleanJSON(batchJsonText);
            if (!cleanedBatchJson || cleanedBatchJson === "[]") {
              throw new Error("Invalid JSON returned from model");
            }

            const batchData: any[] = normalizeKeys(JSON.parse(cleanedBatchJson));
            const processedBatch = batchData.map(d => ({ 
                ...d, 
                id: generateUUID(),
                transitionIn: 'none',
                transitionOut: 'none'
            }));
            fullStoryboard.push(...processedBatch);
            setStoryboard(recalcTimeline([...fullStoryboard]));
            setBatchGenState(prev => ({ ...prev, success: prev.success + 1 }));
        } catch (e) {
            console.error(`Failed to process batch ${batchIdx + 1}:`, e);
            setBatchGenState(prev => ({ ...prev, failures: prev.failures + 1 }));
            
            // Push placeholder scenes for the failed batch
            const placeholders = batch.map(b => ({
                id: generateUUID(),
                lyric: b.lyric,
                description: "Failed to generate details. Click the refresh icon to retry this scene.",
                imagePrompt: "Error generating prompt.",
                videoPrompts: ["Error generating prompt."],
                soraPrompt: "Error generating prompt.",
                duration: 4,
                groupName: b.groupName,
                startTime: '00:00',
                endTime: '00:00',
                transitionIn: 'none',
                transitionOut: 'none'
            }));
            fullStoryboard.push(...placeholders);
            setStoryboard(recalcTimeline([...fullStoryboard]));
        }
      }
  
      if (fullStoryboard.length === 0 && !stopRef.current) {
          throw new Error("Failed to generate any scenes. Please check your connection and try again.");
      }

      const finalStoryboard = recalcTimeline(fullStoryboard);
      setStoryboard(finalStoryboard);
      setHistoryStack({ past: [], future: [] });
      setHistory(prev => [{ id: Date.now().toString(), date: new Date().toLocaleString(), lyrics: lyrics.substring(0, 50) + '...', narrative, styleId: selectedStyleId, influences: influenceList, storyboard: finalStoryboard }, ...prev]);
      setNotification("Storyboard generated successfully!");
  
    } catch (err: any) {
      handleApiError(err, "Storyboard Generation");
    } finally {
      setLoading(false);
      setProgress('');
      setBatchGenState(prev => ({ ...prev, generating: false }));
    }
  };


  const handleAudioIntelligence = async () => {
    if (provider !== 'gemini') {
        setErrorMessage({
            title: "Gemini Exclusive Feature",
            body: "Audio Intelligence requires the advanced multimodal capabilities of Gemini. Please switch your provider to 'Gemini' in Settings to use this feature.",
            action: () => {
                setShowSettings(true);
                setSettingsTab('config');
            }
        });
        return;
    }
    
    if (!audioFile || !audioUrl || audioDuration === 0) {
      setErrorMessage("Please upload an audio file and wait for it to load before analyzing.");
      return;
    }

    setLoading(true);
    setStoryboard(null);
    stopRef.current = false;
    setProgress('Listening to the track...');
    
    try {
        const base64 = (await fileToBase64(audioFile)).split(',')[1];
        const style = VISUAL_STYLES.find(s => s.id === selectedStyleId) || VISUAL_STYLES[0];
        const influenceList = getInfluenceDescriptions(selectedInfluences, customInfluences);
        const referenceContext = visualRefs.length > 0 ? `CASTING DIRECTIVE:\nMain Characters:\n${visualRefs.map((r, i) => `CHARACTER ${i+1}: "${r.name}" - Appearance: ${r.description}`).join('\n')}\n` : "";

        const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
        const exactDuration = Math.floor(audioDuration);
        
        // --- STEP 1: Audio Breakdown ---
        setProgress('Analyzing rhythm and timing...');
        const breakdownPrompt = {
            parts: [
                { inlineData: { mimeType: audioFile.type, data: base64 } },
                { text: `Analyze this audio track, which is exactly ${exactDuration} seconds long. Break it down into timed scenes.` }
            ]
        };
        const breakdownSystemInstruction = `You are a music video script supervisor. Listen to this audio and break it down into timed scenes.
        
GOAL: The sum of all 'duration' values MUST equal exactly ${exactDuration} seconds. This is critical.
CONSTRAINT: Individual scene durations must be between 4 and 10 seconds. Break longer lyrical or instrumental passages into multiple shots.

TASKS:
1. Transcribe lyrics for each scene.
2. Identify instrumental sections (Intros, Outros, Breaks).
3. Assign a logical duration to each scene to meet the total duration.
4. Group scenes by musical sections (e.g., Verse 1, Chorus, Bridge).

OUTPUT: Return ONLY a valid JSON Array of objects with keys: "lyric", "duration", and "groupName".`;

        const breakdownResult = await ai.models.generateContent({
            model: geminiUtilityModel,
            contents: breakdownPrompt,
            config: {
                systemInstruction: breakdownSystemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            lyric: { type: Type.STRING },
                            duration: { type: Type.NUMBER },
                            groupName: { type: Type.STRING }
                        },
                        required: ["lyric", "duration"]
                    }
                }
            }
        });
        
        if (stopRef.current) return;
        updateUsage(breakdownResult);
        const beats: Beat[] = normalizeKeys(JSON.parse(cleanJSON(breakdownResult.text || '[]')));
        
        // Normalize durations to match exactDuration
        const currentTotal = beats.reduce((acc, b) => acc + (b.duration || 0), 0);
        if (currentTotal > 0 && Math.abs(currentTotal - exactDuration) > 0.1) {
            const factor = exactDuration / currentTotal;
            beats.forEach(b => {
                b.duration = Math.round((b.duration || 4) * factor * 10) / 10;
            });
            // Final adjustment for rounding errors
            const newTotal = beats.reduce((acc, b) => acc + (b.duration || 0), 0);
            const diff = exactDuration - newTotal;
            const lastBeat = beats[beats.length - 1];
            if (lastBeat) {
                lastBeat.duration = Math.round(((lastBeat.duration || 0) + diff) * 10) / 10;
            }
        }

        const extractedLyrics = beats.map(s => `[${s.groupName || 'Scene'}] ${s.lyric}`).join('\n');
        setLyrics(extractedLyrics);
        
        // --- STEP 2: Creative Detailing in Batches ---
        let fullStoryboard: ScenePrompt[] = [];
        const BATCH_SIZE = 5;
        const totalBatches = Math.ceil(beats.length / BATCH_SIZE);
        setBatchGenState({ generating: true, current: 0, total: totalBatches, success: 0, failures: 0 });

        for (let i = 0; i < beats.length; i += BATCH_SIZE) {
            if (stopRef.current) break;
            
            const batchIdx = Math.floor(i / BATCH_SIZE);
            const batch = beats.slice(i, i + BATCH_SIZE);
            setProgress(`Detailing scenes ${i + 1}-${Math.min(i + BATCH_SIZE, beats.length)}...`);
            setBatchGenState(prev => ({ ...prev, current: batchIdx + 1 }));

            const batchDetailingPrompt = `Act as an expert film director. Your task is to creatively flesh out a pre-timed beat sheet.

**CONTEXT:**
Visual Style: ${style.name} (${style.visualDetails})
Influences: ${influenceList}
Narrative: "${narrative}"
CASTING:
${referenceContext || "No specific character references provided."}

**PROMPT GENERATION RULES:**
1.  **DESCRIPTION:** A concise, one-sentence summary of the visual beat.
2.  **IMAGE PROMPT:** Be extremely descriptive and cinematic. Specify composition, subject, action, lighting, and atmosphere. CRITICAL: You MUST include specific details for:
    *   **Camera Angle:** e.g., 'low angle shot', 'overhead view', 'Dutch angle'.
    *   **Lens Type:** e.g., 'wide-angle lens', 'macro shot', '85mm portrait lens'.
    *   **Film Stock Emulation:** e.g., 'shot on Kodak Vision3 500T', 'grainy 16mm film'.
3.  **VIDEO PROMPTS:** Provide three distinct, highly creative cinematic interpretations for camera movement.
4.  **SORA/VEO/KLING PROMPT:** Synthesize the best ideas into a single, rich, evocative paragraph for a high-fidelity video model.

BEATS TO PROCESS (Use the provided lyrics and group names):
${JSON.stringify(batch)}

OUTPUT: Return ONLY a valid JSON Array of objects for THIS BATCH.
Keys: "lyric", "description", "imagePrompt", "videoPrompts", "soraPrompt", "groupName".`;
            
            try {
                const batchResult = await ai.models.generateContent({
                    model: geminiMainModel,
                    contents: batchDetailingPrompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: Type.ARRAY, items: {
                                type: Type.OBJECT, properties: {
                                    lyric: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    imagePrompt: { type: Type.STRING },
                                    videoPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    soraPrompt: { type: Type.STRING },
                                    groupName: { type: Type.STRING }
                                }, required: ["lyric", "description", "imagePrompt", "videoPrompts", "soraPrompt"]
                            }
                        }
                    }
                });

                if (stopRef.current) return;
                updateUsage(batchResult);
                const batchData: any[] = normalizeKeys(JSON.parse(cleanJSON(batchResult.text || '[]')));
                
                const processedBatch = batchData.map((detail, index) => {
                    const originalBeat = batch[index];
                    return {
                        ...detail,
                        id: generateUUID(),
                        duration: originalBeat.duration || 4,
                        transitionIn: 'none',
                        transitionOut: 'none'
                    };
                });

                fullStoryboard.push(...processedBatch);
                setStoryboard(recalcTimeline([...fullStoryboard]));
                setBatchGenState(prev => ({ ...prev, success: prev.success + 1 }));
            } catch (e) {
                console.error(`Failed to process audio intelligence batch ${batchIdx + 1}:`, e);
                setBatchGenState(prev => ({ ...prev, failures: prev.failures + 1 }));
                
                // Push placeholder scenes for the failed batch
                const placeholders = batch.map(b => ({
                    id: generateUUID(),
                    lyric: b.lyric,
                    description: "Failed to generate details. Click the refresh icon to retry this scene.",
                    imagePrompt: "Error generating prompt.",
                    videoPrompts: ["Error generating prompt."],
                    soraPrompt: "Error generating prompt.",
                    duration: b.duration || 4,
                    groupName: b.groupName,
                    startTime: '00:00',
                    endTime: '00:00',
                    transitionIn: 'none',
                    transitionOut: 'none'
                }));
                fullStoryboard.push(...placeholders);
                setStoryboard(recalcTimeline([...fullStoryboard]));
            }
        }
        
        const finalStoryboard = recalcTimeline(fullStoryboard);
        setStoryboard(finalStoryboard);
        setHistoryStack({ past: [], future: [] }); 
        setHistory(prev => [{ id: Date.now().toString(), date: new Date().toLocaleString(), lyrics: extractedLyrics.substring(0, 50)+'...', narrative, styleId: selectedStyleId, influences: influenceList, storyboard: finalStoryboard }, ...prev]);
        
        setProgress('Analysis Complete.');
        setNotification("Audio intelligence storyboard generated!");
        setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
        handleApiError(err, "Audio Intelligence");
    } finally {
        setLoading(false);
        setBatchGenState(prev => ({ ...prev, generating: false }));
    }
  };

  const visualize = () => {
    if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        setFrequencyData(dataArray);
        animationFrameRef.current = requestAnimationFrame(visualize);
    }
  };

  const togglePlayback = () => {
    if (audioUrl && audioRef.current) {
        if (!audioContextRef.current) {
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContext();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
                sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
                sourceRef.current.connect(analyserRef.current);
                analyserRef.current.connect(audioContextRef.current.destination);
            } catch (e) { console.error("Web Audio API setup failed:", e); }
        }

        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();

        const audio = audioRef.current;
        if (!isPlaying) {
            audio.play();
            visualize();
        } else {
            audio.pause();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
        setIsPlaying(!isPlaying);

    } else if (!audioUrl && storyboard) { // Slideshow logic
        setIsPlaying(!isPlaying);
    }
  };

  const toggleSlideshow = () => {
    const nextState = !isSlideshowMode;
    setIsSlideshowMode(nextState);
    if (nextState && !isPlaying) {
        togglePlayback();
    }
    if (!nextState && !audioUrl) {
        setIsPlaying(false);
    }
  };

  const onAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !storyboard) return;
    
    let accumTime = 0;
    for (let i = 0; i < storyboard.length; i++) {
        const duration = storyboard[i].duration || 4;
        if (audio.currentTime >= accumTime && audio.currentTime < accumTime + duration) {
            if(currentPlaybackIndex !== i) setCurrentPlaybackIndex(i);
            break;
        }
        accumTime += duration;
    }
    setCurrentTime(audio.currentTime);
};
  
  const onAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentPlaybackIndex(0);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
};

  const onAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isPlaying) {
        audioRef.current?.pause();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      }
      
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioDuration(0);
      setAudioIntensityData(null); // Clear intensity data

      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().then(() => {
          audioContextRef.current = null;
          sourceRef.current = null;
          analyserRef.current = null;
        });
      }

      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioFile(file);
      setAudioFileName(file.name);
      
      // Auto-suggest project title from song file if project name is empty
      if (!projectName.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
        setProjectName(cleanName);
        localStorage.setItem('audioarc_project_name', cleanName);
      }
      
      // Analyze audio for intensity peaks
      analyzeAudio(file);
    }
  };

  const analyzeAudio = async (file: File) => {
    try {
        setIsAnalyzingAudio(true);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Extract high-accuracy 100ms intensity data from decoded PCM buffer
        const intensities = extractIntensityFromAudioBuffer(audioBuffer);
        setAudioIntensityData(intensities);
        await idb.set('audioarc_audio_intensity', intensities);

        const duration = audioBuffer.duration;
        if (duration && (audioDuration === 0 || !audioDuration)) {
          setAudioDuration(duration);
        }

        // Detect musical drops and beat peaks
        const peaks = detectAudioPeakDrops(intensities, duration || audioDuration, {
          sensitivity: snapSensitivity,
          minDistanceSeconds: snapMinSceneDuration
        });
        setDetectedBeatDrops(peaks);

        audioContext.close();
    } catch (e) {
        console.error("Audio analysis failed", e);
    } finally {
        setIsAnalyzingAudio(false);
    }
  };

  const handleSnapToBeats = (options?: SnapToBeatsOptions) => {
    if (!storyboard || storyboard.length === 0) {
      setNotification("Add or generate storyboard scenes first to snap them to audio beats.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (!audioIntensityData || audioIntensityData.length === 0) {
      if (audioFile) {
        setNotification("Analyzing audio track for beat drops...");
        analyzeAudio(audioFile).then(() => {
          setNotification("Audio analysis complete! Click 'Snap to Beats' to apply.");
          setTimeout(() => setNotification(null), 3000);
        });
      } else {
        setNotification("Please upload an audio track first to detect beat drops.");
        setTimeout(() => setNotification(null), 3000);
      }
      return;
    }

    // Save previous state to history stack for Undo support
    pushToHistory();

    const mode = options?.mode || snapPacingMode;
    const minDur = options?.minSceneDuration ?? snapMinSceneDuration;
    const fitAudio = options?.fitAudioDuration ?? snapFitAudioDuration;
    const sens = options?.sensitivity ?? snapSensitivity;

    // Use current or newly detected peaks
    const peaksToUse = detectedBeatDrops.length > 0
      ? detectedBeatDrops
      : detectAudioPeakDrops(audioIntensityData, audioDuration, {
          sensitivity: sens,
          minDistanceSeconds: minDur
        });

    const result = snapScenesToBeats(storyboard, peaksToUse, audioDuration, {
      mode,
      minSceneDuration: minDur,
      fitAudioDuration: fitAudio,
      precision: 0.5
    });

    const synchronized = recalcTimeline(result.updatedStoryboard);
    setStoryboard(synchronized);
    setLastSnapResultStats(result.stats);

    const dropImpactText = result.stats.majorDropsMatched > 0
      ? `${result.stats.majorDropsMatched} major drop impacts aligned!`
      : `aligned to rhythm peaks!`;

    setNotification(`⚡ Snapped ${result.stats.totalScenes} scenes to beats (${result.stats.snappedCutsCount} cuts ${dropImpactText}, avg ${result.stats.avgDuration}s)`);
    setTimeout(() => setNotification(null), 4500);
  };

  const generateWav2LipPrompt = (scene: ScenePrompt, characterName?: string) => {
    const charStr = characterName ? characterName : 'performer';
    return `Front-facing medium close-up shot of ${charStr}, centered framing with clear visible lip, mouth, and jaw motion. Performer's mouth accurately articulates the lyrics: "${scene.lyric}". High clarity facial features, stable camera angle, studio lighting, neutral or chroma key background, optimized for Wav2Lip audio alignment and neural facial landmark detection.`;
  };

  const handleToggleLipSync = (idx: number) => {
    if (!storyboard) return;
    const newSb = [...storyboard];
    const scene = newSb[idx];
    const newState = !scene.isLipSyncEnabled;
    scene.isLipSyncEnabled = newState;
    if (newState && !scene.lipSyncPrompt) {
      const linkedRefs = visualRefs.filter(ref => scene.linkedRefIds?.includes(ref.id));
      const charName = linkedRefs.length > 0 ? linkedRefs[0].name : undefined;
      scene.lipSyncPrompt = generateWav2LipPrompt(scene, charName);
    }
    setStoryboard(newSb);
  };

  const handleToggleVoiceover = (idx: number) => {
    if (!storyboard) return;
    const newSb = [...storyboard];
    const scene = newSb[idx];
    const newState = !scene.isVoiceoverEnabled;
    scene.isVoiceoverEnabled = newState;
    if (newState && scene.voiceoverText === undefined) {
      scene.voiceoverText = '';
    }
    setStoryboard(newSb);
  };

  

   const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;

      if (!checkKeysAndShowSettings()) return;
      
      const base64 = await fileToBase64(file);
      const id = generateUUID();
      const newRef: VisualReference = { id, name: `Ref ${visualRefs.length + 1}`, description: "Analyzing...", image: base64, analyzing: true };
      setVisualRefs(prev => [...prev, newRef]);
      
      const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("Analysis timed out")), ms));

      try {
          let description = "";
          const prompt = "Describe the physical appearance of the subject in this image for use in a film casting prompt. Focus on face, hair, body type, and clothing. Be concise. Do not describe the background.";
          const base64Data = base64.split(',')[1];
          
          if (provider === 'gemini') {
              const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
              const analysisPromise = (async () => {
                  const res = await ai.models.generateContent({ 
                      model: geminiUtilityModel, 
                      contents: { parts: [ { inlineData: { mimeType: file.type || 'image/jpeg', data: base64Data } }, { text: prompt } ] } 
                  });
                  updateUsage(res);
                  return res.text || "Analysis failed.";
              })();
              description = await Promise.race([analysisPromise, timeout(60000)]) as string;
          } else if (provider === 'openai' || provider === 'ollama' || provider === 'lmstudio' || provider === 'openrouter') {
              const analysisPromise = performProviderRequest(prompt, false, [base64Data]);
              description = await Promise.race([analysisPromise, timeout(120000)]) as string;
          } else {
               description = "Image analysis not supported by this provider. Please describe manually.";
          }
          setVisualRefs(prev => prev.map(r => r.id === id && r.analyzing ? { ...r, description, analyzing: false } : r));
      } catch (e: any) {
          console.error("Analysis Error:", e);
          let errorMsg = "Analysis failed. Please describe manually.";
          if (e.message?.includes("timed out")) errorMsg = "Analysis timed out. Please describe manually.";
          if (e.message?.includes("Safety") || (e.response?.promptFeedback?.blockReason)) errorMsg = "AI Safety Block. Describe manually.";
          
          if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
              handleApiError(e, 'Reference Image Analysis');
              errorMsg = "Network error.";
          }
          
          setVisualRefs(prev => prev.map(r => r.id === id && r.analyzing ? { ...r, description: errorMsg, analyzing: false } : r));
      }
  };

  const removeVisualRef = (id: string) => { 
    setVisualRefs(prev => prev.filter(r => r.id !== id));
  };

  const jumpToScene = (index: number) => {
      if (!storyboard || index < 0 || index >= storyboard.length) return;
      let startTime = 0;
      for (let i = 0; i < index; i++) startTime += (storyboard[i].duration || 4);
      if (audioRef.current && audioUrl) {
          audioRef.current.currentTime = startTime;
          setCurrentTime(startTime);
          setCurrentPlaybackIndex(index);
          if (!isPlaying) {
              audioRef.current.play();
              setIsPlaying(true);
              if (!animationFrameRef.current) visualize();
          }
      } else {
          setCurrentPlaybackIndex(index);
      }

      const sceneCard = document.getElementById(`scene-card-${index}`);
      if (sceneCard) {
          sceneCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
  };

  const handleTimelineSeek = (timeInSeconds: number) => {
    const clamped = Math.max(0, Math.min(audioDuration || 9999, timeInSeconds));
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = clamped;
    }
    setCurrentTime(clamped);

    if (storyboard && storyboard.length > 0) {
      let accum = 0;
      for (let i = 0; i < storyboard.length; i++) {
        const d = storyboard[i].duration || 4;
        if (clamped >= accum && clamped < accum + d) {
          if (currentPlaybackIndex !== i) setCurrentPlaybackIndex(i);
          break;
        }
        accum += d;
      }
    }
  };

  const handlePrevScene = () => {
      if (!storyboard || storyboard.length === 0) return;
      if (currentPlaybackIndex > 0) {
          jumpToScene(currentPlaybackIndex - 1);
      }
  };

  const handleNextScene = () => {
      if (!storyboard || storyboard.length === 0) return;
      if (currentPlaybackIndex < storyboard.length - 1) {
          jumpToScene(currentPlaybackIndex + 1);
      }
  };

  const handleVisualizerSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || audioDuration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const newTime = percentage * audioDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const pushToHistory = () => { if (storyboard) setHistoryStack(prev => ({ past: [...prev.past, JSON.parse(JSON.stringify(storyboard))], future: [] })); };
  const handleUndo = () => { if (historyStack.past.length === 0) return; const previous = historyStack.past[historyStack.past.length - 1]; const newPast = historyStack.past.slice(0, -1); if (storyboard) setHistoryStack(prev => ({ past: newPast, future: [JSON.parse(JSON.stringify(storyboard)), ...prev.future] })); setStoryboard(previous); };
  const handleRedo = () => { if (historyStack.future.length === 0) return; const next = historyStack.future[0]; const newFuture = historyStack.future.slice(1); if (storyboard) setHistoryStack(prev => ({ past: [...prev.past, JSON.parse(JSON.stringify(storyboard))], future: newFuture })); setStoryboard(next); };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const target = e.target as HTMLElement | null;
          const isInput = target && (
              target.tagName === 'INPUT' ||
              target.tagName === 'TEXTAREA' ||
              target.tagName === 'SELECT' ||
              target.isContentEditable
          );

          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
              if (isInput) return;
              e.preventDefault();
              if (e.shiftKey) handleRedo(); else handleUndo();
              return;
          }
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
              if (isInput) return;
              e.preventDefault();
              handleRedo();
              return;
          }

          if (e.key === 'Escape') {
              if (showSlideshow) {
                  setShowSlideshow(false);
              }
              if (isSlideshowMode) {
                  setIsSlideshowMode(false);
                  if (!audioUrl) setIsPlaying(false);
              }
              return;
          }

          // If the user is currently focused on an editable field, do not hijack typing keys
          if (isInput) return;

          // Slideshow modal navigation
          if (showSlideshow && storyboard && storyboard.length > 0) {
              if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setSlideshowIndex(prev => Math.max(0, prev - 1));
                  return;
              }
              if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  setSlideshowIndex(prev => Math.min(storyboard.length - 1, prev + 1));
                  return;
              }
          }

          // Storyboard view keyboard navigation
          if (storyboard && storyboard.length > 0) {
              if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  handlePrevScene();
                  return;
              }
              if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  handleNextScene();
                  return;
              }
          }

          // Spacebar play / pause trigger
          if (e.code === 'Space') {
              e.preventDefault();
              togglePlayback();
              return;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [storyboard, historyStack, isPlaying, audioUrl, isSlideshowMode, showSlideshow, currentPlaybackIndex, slideshowIndex]);

  const handleInputFocus = () => { if (storyboard) snapshotRef.current = JSON.parse(JSON.stringify(storyboard)); };
  const handleInputBlur = () => { if (snapshotRef.current && storyboard && JSON.stringify(snapshotRef.current) !== JSON.stringify(storyboard)) { setHistoryStack(prev => ({ past: [...prev.past, snapshotRef.current!], future: [] })); } snapshotRef.current = null; };

  const resetSessionTokens = () => {
    setTotalTokenUsage(0);
    setSessionApiRequests(0);
    setNotification("Session token tracker reset to 0.");
    setTimeout(() => setNotification(null), 2500);
  };

  const updateUsage = (response?: any, fallbackPrompt?: string, fallbackResponseText?: string) => { 
    setSessionApiRequests(prev => prev + 1);
    let tokens = 0;
    if (typeof response === 'number') {
      tokens = response;
    } else if (response?.usageMetadata?.totalTokenCount) {
      tokens = response.usageMetadata.totalTokenCount;
    } else if (response?.usage?.total_tokens) {
      tokens = response.usage.total_tokens;
    } else if (response?.prompt_eval_count || response?.eval_count) {
      tokens = (response.prompt_eval_count || 0) + (response.eval_count || 0);
    } else if (fallbackPrompt || fallbackResponseText) {
      const totalChars = (fallbackPrompt?.length || 0) + (fallbackResponseText?.length || 0);
      tokens = Math.max(1, Math.round(totalChars / 4));
    }
    if (tokens > 0) {
      setTotalTokenUsage(prev => prev + tokens); 
    }
  };

  const getExportFilename = (typeTag: string, ext: string) => {
    const rawName = projectName.trim() || (audioFileName ? audioFileName.replace(/\.[^/.]+$/, "") : 'AudioArc_Project');
    const sanitizedTitle = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_{2,}/g, '_').replace(/^_|_$/g, '');
    const parts: string[] = [sanitizedTitle || 'AudioArc_Project'];

    const now = new Date();
    if (exportIncludeDate) {
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      parts.push(`${yyyy}${mm}${dd}`);
    }

    if (exportIncludeTimeSerial) {
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      parts.push(`${hh}${min}`);
    }

    if (typeTag) {
      parts.push(typeTag);
    }

    const cleanExt = ext.replace(/^\./, '');
    return `${parts.join('_')}.${cleanExt}`;
  };

  const startRenameGroup = (groupName: string) => {
    setEditingGroupName(groupName);
    setRenameGroupInput(groupName);
  };

  const cancelRenameGroup = () => {
    setEditingGroupName(null);
    setRenameGroupInput('');
  };

  const confirmRenameGroup = (oldName: string, newNameRaw: string) => {
    const newName = newNameRaw.trim();
    if (!newName || newName === oldName) {
      cancelRenameGroup();
      return;
    }
    if (!storyboard) {
      cancelRenameGroup();
      return;
    }

    pushToHistory();
    let updatedCount = 0;
    const updated = storyboard.map(scene => {
      if ((scene.groupName || 'Default') === oldName) {
        updatedCount++;
        return { ...scene, groupName: newName };
      }
      return scene;
    });

    setStoryboard(updated);
    if (collapsedGroups.has(oldName)) {
      const nextCollapsed = new Set(collapsedGroups);
      nextCollapsed.delete(oldName);
      nextCollapsed.add(newName);
      setCollapsedGroups(nextCollapsed);
    }
    cancelRenameGroup();
    setNotification(`Renamed group "${oldName}" to "${newName}" (${updatedCount} scene${updatedCount === 1 ? '' : 's'})`);
    setTimeout(() => setNotification(null), 3500);
  };

  const generateTextWithActiveAI = async (prompt: string, isJson = false): Promise<string> => {
    if (provider === 'gemini') {
      const apiKey = getEffectiveGeminiKey();
      if (!apiKey) throw new Error("Gemini API key is not configured. Please set your key in Settings.");
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({ model: geminiUtilityModel, contents: prompt });
      updateUsage(res);
      return res.text || '';
    } else {
      return await performProviderRequest(prompt, isJson);
    }
  };

  const handleApplyColorGradeUpdate = async (updatedStoryboard: ScenePrompt[], actionDescription: string) => {
    pushToHistory();
    setStoryboard(updatedStoryboard);
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioarc_storyboard', JSON.stringify(updatedStoryboard));
      await idb.set('audioarc_storyboard', updatedStoryboard);
    }
    setNotification(actionDescription);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApplyStyleRefinerUpdate = async (updatedStoryboard: ScenePrompt[], actionDescription: string) => {
    pushToHistory();
    setStoryboard(updatedStoryboard);
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioarc_storyboard', JSON.stringify(updatedStoryboard));
      await idb.set('audioarc_storyboard', updatedStoryboard);
    }
    setNotification(actionDescription);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApplyContrastBoosterUpdate = async (updatedStoryboard: ScenePrompt[], actionDescription: string) => {
    pushToHistory();
    setStoryboard(updatedStoryboard);
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioarc_storyboard', JSON.stringify(updatedStoryboard));
      await idb.set('audioarc_storyboard', updatedStoryboard);
    }
    setNotification(actionDescription);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleGenerateSceneSummary = async (sceneIdx: number) => {
    if (!storyboard || !storyboard[sceneIdx]) return;
    const scene = storyboard[sceneIdx];
    setGeneratingSummaryIdx(sceneIdx);

    try {
      const prompt = `You are an award-winning film director and visual storyteller. Generate a concise, crystal-clear, single-sentence textual summary (maximum 18 words) capturing the key narrative action and visual emotion of this scene. Output strictly the single sentence summary itself without quotation marks, markdown headings, or explanation.

Scene Details:
- Sequence Group: ${scene.groupName || 'Scene'}
- Lyric / Script: "${scene.lyric || 'Instrumental'}"
- Visual Direction: "${scene.imagePrompt || ''}"
- Motion / Camera: "${scene.cameraMovement || scene.videoPrompts?.[0] || scene.soraPrompt || ''}"
${narrative ? `- Overall Story Theme: "${narrative.substring(0, 250)}"` : ''}

One-sentence scene summary:`;

      const raw = await generateTextWithActiveAI(prompt);
      const summary = raw.trim().replace(/^["']|["']$/g, '').replace(/\n+/g, ' ');
      if (summary) {
        pushToHistory();
        const updated = [...storyboard];
        updated[sceneIdx] = {
          ...updated[sceneIdx],
          description: summary
        };
        setStoryboard(updated);
        setNotification(`Scene ${sceneIdx + 1} summary generated!`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err: any) {
      console.error("Failed to generate scene summary:", err);
      setErrorMessage({ title: "Summary Generation Failed", body: err.message || "Failed to generate summary with AI." });
    } finally {
      setGeneratingSummaryIdx(null);
    }
  };

  const handleGenerateAllSceneSummaries = async () => {
    if (!storyboard || storyboard.length === 0) {
      setNotification("Add or generate storyboard scenes first.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setIsBatchSummarizing(true);
    pushToHistory();
    try {
      let count = 0;
      const updated = [...storyboard];
      for (let i = 0; i < updated.length; i++) {
        setGeneratingSummaryIdx(i);
        const scene = updated[i];
        const prompt = `You are an award-winning film director. Generate a concise, crystal-clear, single-sentence textual summary (maximum 18 words) of this scene. Output strictly the single sentence without quotes or intro.

Scene #${i + 1} [${scene.groupName || 'Scene'}]:
- Lyric: "${scene.lyric || 'Instrumental'}"
- Visual Prompt: "${(scene.imagePrompt || scene.videoPrompts?.[0] || '').substring(0, 200)}"
${narrative ? `- Context: "${narrative.substring(0, 200)}"` : ''}

One-sentence scene summary:`;

        try {
          const raw = await generateTextWithActiveAI(prompt);
          const summary = raw.trim().replace(/^["']|["']$/g, '').replace(/\n+/g, ' ');
          if (summary) {
            updated[i] = { ...updated[i], description: summary };
            count++;
            setStoryboard([...updated]);
          }
        } catch (e) {
          console.warn(`Failed summary for scene ${i + 1}`, e);
        }
      }
      setNotification(`Generated crisp summaries for ${count} scenes!`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error("Error batch generating summaries:", err);
      setErrorMessage({ title: "Batch Summaries Error", body: err.message || "Failed during batch generation." });
    } finally {
      setGeneratingSummaryIdx(null);
      setIsBatchSummarizing(false);
    }
  };
  const updateDuration = (index: number, newDuration: number) => { if (!storyboard) return; const newSb = [...storyboard]; newSb[index].duration = newDuration; setStoryboard(recalcTimeline(newSb)); };
  
  const handleDeleteScene = (e: React.MouseEvent, index: number) => { e.stopPropagation(); e.preventDefault(); if (!storyboard) return; pushToHistory(); const newSb = storyboard.filter((_, i) => i !== index); if (newSb.length === 0) setStoryboard(null); else setStoryboard(recalcTimeline(newSb)); };
  const toggleGroupCollapse = (name: string) => { const newSet = new Set(collapsedGroups); if (newSet.has(name)) newSet.delete(name); else newSet.add(name); setCollapsedGroups(newSet); };

  const verifyConnections = async () => {
    setConnectionStatus('checking');
    setConnectionError(null);
    try {
        if (provider === 'gemini') {
            const activeKey = getEffectiveGeminiKey();
            if (!activeKey) throw new Error("Gemini API Key not found. Please enter your API key in Settings -> Gemini or Settings -> Connection.");
            const ai = new GoogleGenAI({ apiKey: activeKey });
            await ai.models.generateContent({ model: geminiUtilityModel, contents: 'ping' });
        } else if (provider === 'ollama') {
            const res = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/tags`);
            if (!res.ok) throw new Error(`Could not connect to Ollama at ${ollamaUrl}. Ensure it's running and CORS is configured (see Connection Guides).`);
        } else if (provider === 'openrouter') {
            if (!openRouterKey) throw new Error("OpenRouter API Key has not been entered.");
            const res = await fetch(`${openRouterUrl.trim().replace(/\/$/, '')}/models`, {
              headers: { 
                'Authorization': `Bearer ${openRouterKey.trim().replace(/^Bearer\s+/i, '')}`,
                'HTTP-Referer': 'https://audioarc.ai',
                'X-Title': 'AudioArc'
              } 
            });
            if (!res.ok) {
                const errorBodyText = await res.text();
                let errorText = `[${res.status}] ${res.statusText}`;
                try {
                    const errorData = JSON.parse(errorBodyText);
                    errorText = errorData.error?.message || JSON.stringify(errorData);
                } catch(e) { /* use text */ }
                throw new Error(`OpenRouter Error: ${errorText}`);
            }
        } else if (provider === 'openai') {
            if (!openAIKey.trim()) throw new Error("OpenAI API Key has not been entered.");
            let baseUrl = openAIBaseUrl.trim().replace(/\/$/, '');
            if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) baseUrl = `https://${baseUrl}`;
            const res = await fetch(`${baseUrl}/models`, {
                headers: { 'Authorization': `Bearer ${openAIKey.trim().replace(/^Bearer\s+/i, '')}` }
            });
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        } else if (provider === 'lmstudio') {
            let baseUrl = lmStudioUrl.trim().replace(/\/$/, '');
            if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) baseUrl = `http://${baseUrl}`;
            const res = await fetch(`${baseUrl}/models`);
            if (!res.ok) throw new Error(`HTTP error ${res.status}: Cannot reach LM Studio at ${baseUrl}`);
        } else if (provider === 'pollinations') {
            let baseUrl = pollinationsUrl.trim().replace(/\/$/, '');
            const testUrl = baseUrl.includes('gen.pollinations.ai') ? `${baseUrl}/models` : `https://gen.pollinations.ai/v1/models`;
            const headers: Record<string, string> = {};
            if (pollinationsApiKey.trim()) headers['Authorization'] = `Bearer ${pollinationsApiKey.trim().replace(/^Bearer\s+/i, '')}`;
            const res = await fetch(testUrl, { headers });
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        }
        setConnectionStatus('connected');
    } catch (e: any) {
        console.error(e);
        setConnectionError(e.message);
        setConnectionStatus('error');
    }
  };

  const handleTestConnection = async (providerToTest: 'gemini' | 'openai' | 'ollama' | 'lmstudio' | 'openrouter' | 'pollinations') => {
    console.log("process.env keys:", Object.keys(process.env));
    setTestStatuses(prev => ({ ...prev, [providerToTest]: 'testing' }));
    setConnectionError(null);
    try {
      if (providerToTest === 'gemini') {
        const activeKey = getEffectiveGeminiKey();
        if (!activeKey) throw new Error("Gemini API Key not found. Please enter or paste your API key in the field above.");
        const ai = new GoogleGenAI({ apiKey: activeKey });
        await ai.models.generateContent({ 
          model: geminiUtilityModel || geminiMainModel || 'gemini-3.8-flash', 
          contents: 'ping',
          config: { maxOutputTokens: 2 }
        });
        setApiKeyStatus('detected');
      } else if (providerToTest === 'openai') {
        if (!openAIKey.trim()) throw new Error("OpenAI API Key has not been entered.");
        let baseUrl = openAIBaseUrl.trim().replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) baseUrl = `https://${baseUrl}`;
        const res = await fetch(`${baseUrl}/models`, {
            headers: { 'Authorization': `Bearer ${openAIKey.trim().replace(/^Bearer\s+/i, '')}` }
        });
        if (!res.ok) {
            let errText = `HTTP ${res.status}`;
            try {
                const errData = await res.json();
                errText = errData.error?.message || JSON.stringify(errData);
            } catch {}
            throw new Error(errText);
        }
      } else if (providerToTest === 'ollama') {
        let baseUrl = ollamaUrl.replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) baseUrl = `http://${baseUrl}`;
        const res = await fetch(`${baseUrl}/api/tags`);
        if (!res.ok) throw new Error(`Could not connect. Ensure Ollama is running and CORS is configured.`);
      } else if (providerToTest === 'lmstudio') {
        let baseUrl = lmStudioUrl.trim().replace(/\/$/, '');
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) baseUrl = `http://${baseUrl}`;
        const res = await fetch(`${baseUrl}/models`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: Ensure LM Studio local server is running at ${baseUrl} and CORS is enabled.`);
      } else if (providerToTest === 'openrouter') {
        if (!openRouterKey) throw new Error("OpenRouter API Key has not been entered.");
        const res = await fetch(`${openRouterUrl.trim().replace(/\/$/, '')}/models`, { 
            headers: { 'Authorization': `Bearer ${openRouterKey.trim().replace(/^Bearer\s+/i, '')}` } 
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error?.message || `HTTP error ${res.status}`);
        }
      } else if (providerToTest === 'pollinations') {
        let baseUrl = pollinationsUrl.trim().replace(/\/$/, '');
        const testUrl = baseUrl.includes('gen.pollinations.ai') ? `${baseUrl}/models` : `https://gen.pollinations.ai/v1/models`;
        const headers: Record<string, string> = {};
        if (pollinationsApiKey.trim()) headers['Authorization'] = `Bearer ${pollinationsApiKey.trim().replace(/^Bearer\s+/i, '')}`;
        const res = await fetch(testUrl, { headers });
        if (!res.ok) throw new Error(`HTTP error ${res.status}: Could not reach Pollinations endpoint.`);
      }
      setTestStatuses(prev => ({ ...prev, [providerToTest]: 'ok' }));
      setTimeout(() => setTestStatuses(prev => ({ ...prev, [providerToTest]: 'idle' })), 4500);
    } catch (e: any) {
      setTestStatuses(prev => ({ ...prev, [providerToTest]: 'error' }));
      setConnectionError(`[${providerToTest.toUpperCase()}] Test Failed: ${e.message}`);
      setTimeout(() => setTestStatuses(prev => ({ ...prev, [providerToTest]: 'idle' })), 6000);
    }
  };

  const fetchLmStudioModels = async () => {
    setLoadingLmStudioModels(true);
    try {
      let baseUrl = lmStudioUrl.trim().replace(/\/$/, '');
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) baseUrl = `http://${baseUrl}`;
      const res = await fetch(`${baseUrl}/models`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.data)) {
        const ids = data.data.map((m: any) => m.id).filter(Boolean);
        setAvailableLmStudioModels(ids);
        if (ids.length > 0 && (!lmStudioModel || lmStudioModel === 'loaded-model')) {
          setLmStudioModel(ids[0]);
        }
      }
    } catch (e) {
      console.warn("Could not fetch LM Studio models", e);
      setConnectionError('Could not fetch LM Studio models. Ensure LM Studio server is running at ' + lmStudioUrl + ' and CORS is enabled.');
    } finally {
      setLoadingLmStudioModels(false);
    }
  };

  const fetchOpenAIModels = async () => {
    if (!openAIKey.trim()) return;
    try {
      let baseUrl = openAIBaseUrl.trim().replace(/\/$/, '');
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) baseUrl = `https://${baseUrl}`;
      const res = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${openAIKey.trim().replace(/^Bearer\s+/i, '')}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.data)) {
        const ids: string[] = data.data
          .map((m: any) => m.id)
          .filter((id: string) => id.includes('gpt') || id.includes('o1') || id.includes('o3') || id.includes('chat'))
          .sort();
        if (ids.length > 0) setAvailableOpenAIModels(ids);
      }
    } catch (e) {
      console.warn("Could not fetch OpenAI models", e);
    }
  };

  const fetchPollinationsModels = async () => {
    try {
      let baseUrl = pollinationsUrl.trim().replace(/\/$/, '');
      const testUrl = baseUrl.includes('gen.pollinations.ai') ? `${baseUrl}/models` : `https://gen.pollinations.ai/v1/models`;
      const res = await fetch(testUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.data)) {
          const names = data.data.map((m: any) => m.id || m.name).filter(Boolean);
          if (names.length > 0) setAvailablePollinationsModels(names);
        } else if (Array.isArray(data)) {
          const names = data.map((m: any) => m.name || m.id).filter(Boolean);
          if (names.length > 0) setAvailablePollinationsModels(names);
        }
      }
    } catch (e) {
      console.warn("Could not fetch Pollinations models list", e);
    }
  };

  const fetchOllamaModels = async () => {
    try {
      let url = ollamaUrl.replace(/\/$/, '');
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }
      const res = await fetch(`${url}/api/tags`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const models = data.models?.map((m: any) => m.name) || [];
      setAvailableOllamaModels(models);
      if (models.length > 0 && !models.includes(ollamaModel)) {
        setOllamaModel(models[0]);
      }
    } catch (e) {
      console.error("Ollama fetch error:", e);
      setConnectionError('Could not fetch Ollama models. Ensure Ollama is running and CORS is configured (see Connection Guides).');
      setAvailableOllamaModels([]);
    }
  };

  useEffect(() => {
    if (showSettings) {
        setConnectionError(null);
        if (settingsTab === 'config' || settingsTab === 'billing') {
            if (provider === 'openrouter' && !openRouterKey) {
                setConnectionStatus('idle');
            } else if (provider === 'openai' && !openAIKey) {
                setConnectionStatus('idle');
            } else {
                verifyConnections();
            }
            if (provider === 'ollama') {
                fetchOllamaModels();
            } else if (provider === 'lmstudio') {
                fetchLmStudioModels();
            } else if (provider === 'openai') {
                fetchOpenAIModels();
            } else if (provider === 'pollinations') {
                fetchPollinationsModels();
            }
        }
    }
  }, [showSettings, provider, settingsTab, openRouterKey, openAIKey, lmStudioUrl, pollinationsUrl]);
  
  const handleGenerateScript = async () => {
    if (!storyboard) return;
    if (!checkKeysAndShowSettings()) return;

    setShowScriptModal(true);
    setScriptLoading(true);
    setGeneratedScript('');
    stopRef.current = false;
    setProgress('Writing screenplay...');


    try {
        const style = VISUAL_STYLES.find(s => s.id === selectedStyleId) || VISUAL_STYLES[0];
        
        setGeneratedScript('');
        let fullScriptText = '';
        
        // Title Page Generation
        setProgress('Generating Title Page...');
        const titlePrompt = `Act as a professional music video screenwriter. Create a title page for a music video based on these lyrics and narrative.
        Lyrics: ${lyrics.substring(0, 1000)}
        Narrative: ${narrative}
        
        Output:
        - TITLE: [Creative Title]
        - LOGLINE: [One-sentence summary]
        - DIRECTOR'S VISION: [Mood and style paragraph]
        - SYNOPSIS: [Narrative arc summary]`;
        
        let titlePage = '';
        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
            const res = await ai.models.generateContent({ model: geminiUtilityModel, contents: titlePrompt });
            titlePage = res.text || '';
            updateUsage(res);
        } else {
            titlePage = await performProviderRequest(titlePrompt);
        }
        
        fullScriptText = titlePage + "\n\n========================================\n\n";
        setGeneratedScript(fullScriptText);

        // Scene-by-Scene Generation in Batches
        const BATCH_SIZE = 8;
        for (let i = 0; i < storyboard.length; i += BATCH_SIZE) {
            if (stopRef.current) break;
            const batch = storyboard.slice(i, i + BATCH_SIZE);
            setProgress(`Writing scenes ${i + 1}-${Math.min(i + BATCH_SIZE, storyboard.length)}...`);
            
            const simplifiedBatch = batch.map(({ lyric, imagePrompt, duration, groupName, isVoiceoverEnabled, voiceoverText }) => ({
                lyric,
                voiceover: isVoiceoverEnabled && voiceoverText ? voiceoverText : isVoiceoverEnabled ? "(Voiceover active for scene)" : undefined,
                visual_beat: imagePrompt,
                duration,
                sequence: groupName
            }));

            const batchPrompt = `Continue the music video screenplay for the following scenes. 
            Use Industry Standard Screenplay Format. 
            For each scene, write a proper SCENE HEADING followed by a detailed ACTION paragraph (2-3 sentences minimum).
            Describe character actions, environment, and cinematic details.
            
            CRITICAL: You MUST include the LYRICS for each scene in the script. 
            Format the lyrics as centered dialogue or parentheticals so it's clear what is being sung during the action.
            
            CRITICAL FOR VOICEOVER / NARRATION: If a scene has a "voiceover" field specified in the storyboard data, you MUST include it properly formatted in standard screenplay format as VOICEOVER / NARRATION (e.g., "NARRATOR (V.O.)" or "[CHARACTER] (V.O.)" followed by the voiceover dialogue).
            
            STORYBOARD DATA FOR THIS BATCH:
            ${JSON.stringify(simplifiedBatch)}
            
            CONTEXT:
            Style: ${style.name}
            Narrative: ${narrative}
            Lyrics: ${lyrics.substring(0, 2000)}
            
            Output: Read the storyboard data and write the corresponding screenplay scenes. Output ONLY the screenplay text for these specific scenes.`;

            let batchText = '';
            if (provider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
                const streamResponse = await ai.models.generateContentStream({ model: geminiMainModel, contents: batchPrompt });
                for await (const chunk of streamResponse) {
                    if (stopRef.current) break;
                    const text = chunk.text || '';
                    batchText += text;
                    setGeneratedScript(prev => prev + text);
                    updateUsage(chunk);
                }
            } else {
            batchText = await performProviderRequest(batchPrompt);
                setGeneratedScript(prev => prev + batchText);
            }
            fullScriptText += batchText + "\n\n";
        }
    } catch (e: any) {
        handleApiError(e, "Screenplay Generation");
    } finally {
        setScriptLoading(false);
        setProgress('');
    }
  };

  const handleCopyScript = () => {
    if (!generatedScript) return;
    navigator.clipboard.writeText(generatedScript).then(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    }).catch(_err => {
        setErrorMessage("Failed to copy script to clipboard.");
    });
  };

  const handleDownloadScript = () => { if (!generatedScript) return; const a = document.createElement("a"); const file = new Blob([generatedScript], {type: 'text/plain'}); a.href = URL.createObjectURL(file); a.download = "screenplay.txt"; a.click(); };
  const handlePrintScript = () => { if (!generatedScript) return; const p = window.open('', '', 'height=800,width=800'); p?.document.write(`<html><head><title>Screenplay</title><style>body{font-family:"Courier New",monospace;padding:40px;}pre{white-space:pre-wrap;}</style></head><body><pre>${generatedScript}</pre></body></html>`); p?.document.close(); p?.print(); };

  const handleRegenerateScene = async (index: number) => {
    if (!storyboard) return; 
    if (!checkKeysAndShowSettings()) return;
    pushToHistory(); 
    setSceneGenerationLoading(prev => ({...prev, [index]: true}));
    try {
        const style = VISUAL_STYLES.find(s => s.id === selectedStyleId) || VISUAL_STYLES[0];
        const scene = storyboard[index];

        const linkedRefs = visualRefs.filter(ref => scene.linkedRefIds?.includes(ref.id));
        const finalRefs = linkedRefs.length > 0 ? linkedRefs : visualRefs;
        const referenceContext = finalRefs.map(r => `NAME: "${r.name}" - ${r.description}`).join('\n');
        
        let rawResponse = '';
        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
            const systemInstruction = `You are an expert cinematographer. Regenerate prompts for this single scene, making them more vivid and detailed, while STRICTLY following the core directives.
**CORE VISUAL DIRECTIVES (MANDATORY):**
1.  **CHARACTER INTEGRITY:** The characters in the 'CASTING' section MUST be depicted exactly as described.
2.  **SETTING INTEGRITY:** Apply the visual style to the lighting and camera work, not the characters or setting.
**CONTEXT:**
Style: ${style.name}.
CASTING:
${referenceContext ? referenceContext : "No specific character references provided."}
**PROMPT GENERATION RULES:**
1.  **DESCRIPTION:** A concise, one-sentence summary.
2.  **IMAGE PROMPT DETAIL:** Extremely descriptive. Specify subject, action, lighting, and atmosphere. CRITICAL: You MUST include specific details for the following:
    *   **Camera Angle:** e.g., 'low angle shot', 'overhead view'.
    *   **Lens Type:** e.g., 'wide-angle lens', 'macro shot'.
    *   **Film Stock Emulation:** e.g., 'shot on Kodak Vision3 500T', 'grainy 16mm film'.
3.  **VIDEO PROMPT DETAIL:** Provide three distinct cinematic interpretations.
4.  **SORA/VEO/KLING PROMPT DETAIL:** A single, rich paragraph synthesizing the best ideas.
Return ONLY a valid JSON object with keys: "description", "imagePrompt", "videoPrompts" (array of 3 strings), "soraPrompt".`;
            const result = await ai.models.generateContent({
                model: geminiMainModel,
                contents: `Lyric: "${scene.lyric}"`,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, imagePrompt: { type: Type.STRING }, videoPrompts: { type: Type.ARRAY, items: { type: Type.STRING } }, soraPrompt: { type: Type.STRING } }, required: ["description", "imagePrompt", "videoPrompts", "soraPrompt"] }
                }
            });
            rawResponse = result.text || '';
            updateUsage(result);
        } else {
            const prompt = `Reimagine a scene with maximum detail and STRICTLY follow visual directives.
**CORE DIRECTIVES:**
1.  **CHARACTER INTEGRITY:** Depict characters as described in CASTING.
2.  **SETTING INTEGRITY:** Apply style to lighting/camera, not the setting itself.
**PROMPT REQUIREMENTS:**
For the 'imagePrompt', you MUST include specific details for:
*   **Camera Angle:** (e.g., 'low angle shot', 'overhead view')
*   **Lens Type:** (e.g., 'wide-angle lens', 'macro shot')
*   **Film Stock:** (e.g., 'shot on Kodak Vision3 500T')
**Scene Context:**
*   **Lyric:** "${scene.lyric}"
*   **Visual Style:** ${style.name}
*   **CASTING:** ${referenceContext || 'None'}
**Your Output Must Be a Valid JSON Object.**
{ "description": "...", "imagePrompt": "...", "videoPrompts": ["...", "...", "..."], "soraPrompt": "..." }
Output ONLY the JSON data.`;
            rawResponse = await performProviderRequest(prompt, true);
        }
        let data = normalizeKeys(JSON.parse(cleanJSON(rawResponse))); if (Array.isArray(data)) data = data[0]; 
        setStoryboard(prev => { if (!prev) return null; const newSb = [...prev]; newSb[index] = { ...newSb[index], description: data.description, imagePrompt: data.imagePrompt, videoPrompts: data.videoPrompts, soraPrompt: data.soraPrompt }; return newSb; });
    } catch (e: any) {
      handleApiError(e, "Scene Regeneration");
    } finally {
      setSceneGenerationLoading(prev => ({...prev, [index]: false}));
    }
  };
  
  const handleRegeneratePromptPart = async (index: number, part: 'imagePrompt' | 'videoPrompt0' | 'videoPrompt1' | 'videoPrompt2') => {
    if (!storyboard) return;
    if (!checkKeysAndShowSettings()) return;

    pushToHistory();
    const key = `${index}-${part}`;
    setPromptPartLoading(prev => ({ ...prev, [key]: true }));

    try {
        const scene = storyboard[index];
        const style = VISUAL_STYLES.find(s => s.id === selectedStyleId) || VISUAL_STYLES[0];
        const influenceList = getInfluenceDescriptions(selectedInfluences, customInfluences);

        let prompt = '';
        if (part === 'imagePrompt') {
            prompt = `Given the context (Lyric: "${scene.lyric}", Description: "${scene.description}", Style: "${style.name}", Influences: "${influenceList}"), generate a new, highly-descriptive cinematic IMAGE PROMPT. Output ONLY the raw text of the new prompt.`;
        } else {
            const videoTypeMap = { 'videoPrompt0': 'Subtle', 'videoPrompt1': 'Dynamic', 'videoPrompt2': 'Stylistic' };
            const videoType = videoTypeMap[part as keyof typeof videoTypeMap];
            prompt = `Given the master visual (Image Prompt: "${scene.imagePrompt}"), generate a new, creative VIDEO PROMPT for a '${videoType}' camera movement. Output ONLY the raw text of the new prompt.`;
        }

        let newPromptText = '';
        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
            const result = await ai.models.generateContent({ model: geminiUtilityModel, contents: prompt });
            newPromptText = result.text || '';
            updateUsage(result);
        } else if (provider === 'ollama') {
            newPromptText = await performProviderRequest(prompt);
        } else {
            newPromptText = await performOpenRouterRequest(prompt);
        }

        setStoryboard(prev => {
            if (!prev) return null;
            const newSb = [...prev];
            const targetScene = { ...newSb[index] };
            if (part === 'imagePrompt') {
                targetScene.imagePrompt = newPromptText.trim();
            } else {
                const videoIndex = parseInt(part.replace('videoPrompt', ''));
                if (!targetScene.videoPrompts) targetScene.videoPrompts = [];
                targetScene.videoPrompts[videoIndex] = newPromptText.trim();
            }
            newSb[index] = targetScene;
            return newSb;
        });

    } catch (e: any) {
        handleApiError(e, `Prompt part regeneration`);
    } finally {
        setPromptPartLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleGenerateSmartSuggestions = async (index: number) => {
    if (!storyboard || !storyboard[index]) return;
    if (!checkKeysAndShowSettings()) return;

    setAiSuggestionLoading(prev => ({ ...prev, [index]: true }));

    try {
        const scene = storyboard[index];
        const style = VISUAL_STYLES.find(s => s.id === selectedStyleId) || VISUAL_STYLES[0];
        const influenceList = getInfluenceDescriptions(selectedInfluences, customInfluences);

        const prompt = `You are an expert cinematic visual stylist and music video director.
Analyze this music video scene:
- Scene Description: "${scene.description || ''}"
- Lyric: "${scene.lyric || ''}"
- Current Image Prompt: "${scene.imagePrompt || ''}"
- Visual Style: "${style.name}"
- Influences: "${influenceList}"

Generate 8-10 bespoke, creative, high-impact cinematic prompt modifier tags tailored specifically to enhance this scene's imagery, lighting, camera angle, motion, color grading, and atmosphere.
Output ONLY a valid JSON array of objects with the following structure:
[
  {
    "id": "unique-slug-id",
    "label": "Short Tag Name (2-4 words)",
    "category": "lighting",
    "tagText": "the exact descriptive prompt clause to append into the image/video prompt",
    "description": "one sentence explaining the visual look and feeling"
  }
]
Note: "category" must be one of: "lighting", "camera", "color", "motion", "aesthetic".`;

        let rawResponse = '';
        if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
            const result = await ai.models.generateContent({ model: geminiUtilityModel, contents: prompt });
            rawResponse = result.text || '';
            updateUsage(result);
        } else if (provider === 'ollama') {
            rawResponse = await performProviderRequest(prompt);
        } else {
            rawResponse = await performOpenRouterRequest(prompt);
        }

        const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
                const validatedTags: PromptTag[] = parsed.map((item: any, i: number) => ({
                    id: item.id || `ai-tag-${index}-${i}`,
                    label: item.label || `Custom Tag ${i + 1}`,
                    category: ['lighting', 'camera', 'color', 'motion', 'aesthetic'].includes(item.category) ? item.category : 'aesthetic',
                    tagText: item.tagText || item.label || '',
                    description: item.description || 'AI tailored prompt modifier',
                    keywords: []
                }));

                setAiSmartSuggestions(prev => ({
                    ...prev,
                    [index]: validatedTags
                }));
            }
        }
    } catch (e: any) {
        handleApiError(e, `Smart prompt suggestion generation`);
    } finally {
        setAiSuggestionLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleGenerateImage = async (idx: number, prompt: string, options: { noHistory?: boolean, silentError?: boolean } = {}) => {
    if (!storyboard) return;
    if (!options.noHistory) {
      pushToHistory();
    }
    setImageGenerationLoading(prev => ({ ...prev, [idx]: true }));
  
    try {
      let base64Data: string | undefined;
      let mimeType = 'image/png';
  
      if (imageProvider === 'openrouter') {
        if (!openRouterKey) throw new Error("OpenRouter API Key is required for image generation.");
        const response = await fetch(`${openRouterUrl.trim().replace(/\/$/, '')}/images/generations`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${openRouterKey.trim().replace(/^Bearer\s+/i, '')}`, 
            'Content-Type': 'application/json', 
            'HTTP-Referer': 'https://audioarc.ai', 
            'X-Title': 'AudioArc' 
          },
          body: JSON.stringify({ prompt, model: openRouterImageModel })
        });
        if (!response.ok) { 
          const errorBody = await response.json(); 
          throw new Error(`OpenRouter Image Error: ${errorBody.error?.message || response.statusText}`); 
        }
        const data = await response.json();
        base64Data = data.data?.[0]?.b64_json;
        mimeType = 'image/png';
      } else {
        const activeKey = getEffectiveGeminiKey();
        if (!activeKey) throw new Error("Google API Key is required for image generation. Please enter it in Settings.");
        const ai = new GoogleGenAI({ apiKey: activeKey });
  
        if (imageEngine === 'imagen') {
          mimeType = imageFormat;
          const result = await ai.models.generateImages({ model: imagenModel, prompt, config: { numberOfImages: 1, outputMimeType: imageFormat } });
          base64Data = result.generatedImages?.[0]?.image?.imageBytes;
        } else {
          const linkedRefs = visualRefs.filter(ref => storyboard[idx]?.linkedRefIds?.includes(ref.id));
          const finalRefs = linkedRefs.length > 0 ? linkedRefs : visualRefs.filter(r => prompt.toLowerCase().includes(r.name.toLowerCase()));
          
          const imageParts = finalRefs.filter(ref => ref.image).map(ref => getBase64Parts(ref.image)).filter(p => p !== null);
          const textDescriptions = finalRefs.filter(ref => !ref.image).map(ref => `(${ref.name}: ${ref.description})`).join(' ');
  
          let textPrompt = prompt;
          const integrationInstruction = imageIntegrationLevel === 'low' 
            ? "Use the reference image(s) as loose inspiration for the scene, prioritizing the new scene description over strict character fidelity." 
            : imageIntegrationLevel === 'high' 
            ? "Strictly adhere to the character's appearance, features, clothing, and specific details from the reference image, ensuring high fidelity, consistent proportions, and exact character continuity across shots."
            : "Integrate the character naturally into the new environment, ensuring consistent lighting, shadows, and perspective. The character should interact with the new scene's lighting and environment, maintaining consistent character features and proportions while adapting to the new setting's mood and color palette.";

          if (imageParts.length > 0 && textDescriptions) {
            textPrompt = `Use the provided image(s) as a visual reference for the characters described here: ${textDescriptions}. Recreate the described and referenced characters in a new scene: ${prompt}. ${integrationInstruction}`;
          } else if (imageParts.length > 0) {
            textPrompt = `Use the provided image(s) as a strong character/setting reference. Recreate the subject(s) in a new scene based on the following description. Do not simply edit or draw over the reference image. The scene is: ${prompt}. ${integrationInstruction}`;
          } else if (textDescriptions) {
            textPrompt = `A scene featuring the following characters: ${textDescriptions}. The scene is: ${prompt}`;
          }
  
          const contents: { parts: any[] } = { parts: imageParts.map(p => ({ inlineData: p! })) };
          contents.parts.push({ text: textPrompt });
  
          const result = await ai.models.generateContent({ model: geminiImageModel, contents });
          updateUsage(result);
          const imagePart = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          base64Data = imagePart?.inlineData?.data;
          mimeType = imagePart?.inlineData?.mimeType || 'image/png';
        }
      }
  
      if (base64Data) {
        setStoryboard(prev => {
          if (!prev) return null;
          const newSb = [...prev];
          const extension = mimeType.split('/')[1] || 'png';
          const filename = `scene_${idx + 1}_${Date.now()}.${extension}`;
          newSb[idx] = { ...newSb[idx], generatedImage: `data:${mimeType};base64,${base64Data}`, imageFilename: filename };
          return newSb;
        });
      } else {
        throw new Error("No image data returned from API. The prompt may have been blocked by safety filters.");
      }
    } catch (e: any) {
      if (!options.silentError) {
        handleApiError(e, `Image Gen for scene ${idx + 1}`);
      }
      throw e; // re-throw for batch handler
    } finally {
      setImageGenerationLoading(prev => ({ ...prev, [idx]: false }));
    }
  };
  
  const handleBatchGenerateImages = async () => {
    if (!storyboard) return;
    if (!checkKeysAndShowSettings()) return;

    const scenesToGenerate = storyboard
        .map((scene, index) => ({ scene, index }))
        .filter(({ scene }) => !scene.generatedImage);

    if (scenesToGenerate.length === 0) {
        setErrorMessage({ title: "All Set!", body: "All scenes already have a generated image." });
        return;
    }

    setConfirmModal({
      title: "Batch Generate Images",
      message: `This will generate images for all scenes without a preview (${scenesToGenerate.length} total). This may use a significant number of API calls. Continue?`,
      type: 'info',
      onConfirm: async () => {
        pushToHistory();
        stopRef.current = false;
        setBatchGenState({ generating: true, current: 0, total: scenesToGenerate.length, success: 0, failures: 0 });

        for (const { scene, index } of scenesToGenerate) {
            if (stopRef.current) {
                console.log("Batch generation stopped by user.");
                break;
            }

            setBatchGenState(prev => ({ ...prev, current: prev.current + 1 }));
            
            try {
                await handleGenerateImage(index, scene.imagePrompt, { noHistory: true, silentError: true });
                setBatchGenState(prev => ({ ...prev, success: prev.success + 1 }));
            } catch (error) {
                console.error(`Failed to generate image for scene ${index + 1}:`, error);
                setBatchGenState(prev => ({ ...prev, failures: prev.failures + 1 }));
            }
            
            // Wait for 2 seconds to avoid rate limiting
            if (!stopRef.current) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        setBatchGenState(prev => {
            const finalState = { ...prev, generating: false };
            setErrorMessage({
                title: "Batch Generation Complete",
                body: `Finished generating images.\n\nSuccess: ${finalState.success}\nFailed: ${finalState.failures}\nTotal: ${finalState.total}`
            });
            return { generating: false, current: 0, total: 0, success: 0, failures: 0 };
        });
      }
    });
  };

  const handleRemixVideo = async (idx: number, promptIdx: number, instruction: string) => {
    if (!storyboard) return; 
    if (!checkKeysAndShowSettings()) return;
    pushToHistory(); 
    const key = `${idx}-${promptIdx}`; 
    setRemixLoading(prev => ({...prev, [key]: true})); 
    setActiveRemixMenu(null);
    try {
      const originalPrompt = storyboard[idx].videoPrompts[promptIdx] || storyboard[idx].videoPrompts[0];
      const prompt = `Rewrite video prompt: "${originalPrompt}" to embody "${instruction}" technique. Keep it concise. Output raw text.`;
      let newPrompt = '';
      if (provider === 'gemini') { 
        const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() }); 
        const res = await ai.models.generateContent({ model: geminiMainModel, contents: prompt }); 
        newPrompt = res.text || ''; 
        updateUsage(res); 
      } else if (provider === 'ollama') { 
        newPrompt = await performProviderRequest(prompt); 
      } else { 
        newPrompt = await performOpenRouterRequest(prompt); 
      }
      setStoryboard(prev => { if(!prev) return null; const newSb = [...prev]; if (!newSb[idx].variations) newSb[idx].variations = []; newSb[idx].variations!.push(`${instruction}: ${newPrompt.trim()}`); newSb[idx].videoPrompts[promptIdx] = `${instruction}: ${newPrompt.trim()}`; return newSb; });
    } catch (e: any) {
      handleApiError(e, "Video Remix");
    } finally {
      setRemixLoading(prev => ({...prev, [key]: false}));
    }
  };
  
  const handleDuplicateScene = (index: number) => { if (!storyboard) return; pushToHistory(); const newScene = { ...storyboard[index], id: generateUUID() }; const newStoryboard = [...storyboard]; newStoryboard.splice(index + 1, 0, newScene); setStoryboard(recalcTimeline(newStoryboard)); };

  const handleMergeScenes = (index: number) => {
    if (!storyboard || index < 0 || index >= storyboard.length - 1) return;

    const sceneA = storyboard[index];
    const sceneB = storyboard[index + 1];

    pushToHistory();

    // 1. Combine descriptions cleanly
    const descA = (sceneA.description || '').trim();
    const descB = (sceneB.description || '').trim();
    let combinedDescription = '';
    if (descA && descB) {
      const hasEndPunctuation = /[.!?]$/.test(descA);
      combinedDescription = `${descA}${hasEndPunctuation ? '' : '.'} ${descB}`;
    } else {
      combinedDescription = descA || descB;
    }

    // 2. Sum durations
    const durA = typeof sceneA.duration === 'number' && !isNaN(sceneA.duration) ? sceneA.duration : 4;
    const durB = typeof sceneB.duration === 'number' && !isNaN(sceneB.duration) ? sceneB.duration : 4;
    const combinedDuration = Math.round((durA + durB) * 10) / 10;

    // 3. Combine lyrics if both present
    const lyricA = (sceneA.lyric || '').trim();
    const lyricB = (sceneB.lyric || '').trim();
    let combinedLyric = lyricA;
    if (lyricB && lyricB !== lyricA) {
      combinedLyric = lyricA ? `${lyricA} / ${lyricB}` : lyricB;
    }

    // 4. Combine notes if both present
    const notesA = (sceneA.notes || '').trim();
    const notesB = (sceneB.notes || '').trim();
    let combinedNotes = notesA;
    if (notesB && notesB !== notesA) {
      combinedNotes = notesA ? `${notesA}\n---\n${notesB}` : notesB;
    }

    // 5. Combine voiceovers if present
    const voA = (sceneA.voiceoverText || '').trim();
    const voB = (sceneB.voiceoverText || '').trim();
    let combinedVoiceover = voA;
    if (voB && voB !== voA) {
      combinedVoiceover = voA ? `${voA} ${voB}` : voB;
    }

    // 6. Retain Scene A's visual identity while merging cast links and exit transition
    const combinedLinkedRefs = Array.from(new Set([
      ...(sceneA.linkedRefIds || []),
      ...(sceneB.linkedRefIds || [])
    ]));

    const mergedScene: ScenePrompt = {
      ...sceneA,
      id: sceneA.id,
      description: combinedDescription,
      duration: combinedDuration,
      lyric: combinedLyric,
      notes: combinedNotes,
      voiceoverText: combinedVoiceover,
      isVoiceoverEnabled: sceneA.isVoiceoverEnabled || sceneB.isVoiceoverEnabled,
      transitionOut: sceneB.transitionOut || sceneA.transitionOut,
      linkedRefIds: combinedLinkedRefs,
      isSelected: false
    };

    const newStoryboard = [...storyboard];
    newStoryboard.splice(index, 2, mergedScene);

    const updatedTimeline = recalcTimeline(newStoryboard);
    setStoryboard(updatedTimeline);

    setNotification(`Merged Scene ${index + 1} & Scene ${index + 2} into one scene (${combinedDuration}s total). Press Ctrl+Z to undo.`);
    setTimeout(() => setNotification(null), 4000);
  };
  
  const toggleSceneSelection = (idx: number) => {
    if (!storyboard) return;
    const newStoryboard = [...storyboard];
    newStoryboard[idx].isSelected = !newStoryboard[idx].isSelected;
    setStoryboard(newStoryboard);
  };

  const selectAllScenes = () => {
    if (!storyboard) return;
    setStoryboard(storyboard.map(s => ({ ...s, isSelected: true })));
  };

  const deselectAllScenes = () => {
    if (!storyboard) return;
    setStoryboard(storyboard.map(s => ({ ...s, isSelected: false })));
  };

  const deleteSelectedScenes = () => {
    if (!storyboard) return;
    const selectedCount = storyboard.filter(s => s.isSelected).length;
    if (selectedCount === 0) return;

    setConfirmModal({
      title: "Delete Selected Scenes",
      message: `Are you sure you want to delete ${selectedCount} selected scenes?`,
      type: 'danger',
      onConfirm: () => {
        pushToHistory();
        const newStoryboard = storyboard.filter(s => !s.isSelected);
        setStoryboard(recalcTimeline(newStoryboard));
      }
    });
  };

  const handleBatchGenerateSelected = async () => {
    if (!storyboard) return;
    const selectedIndices = storyboard
      .map((s, i) => s.isSelected ? i : -1)
      .filter(i => i !== -1);

    if (selectedIndices.length === 0) return;

    if (!checkKeysAndShowSettings()) return;

    setConfirmModal({
      title: "Generate Selected Images",
      message: `Generate images for the ${selectedIndices.length} selected scenes?`,
      type: 'info',
      onConfirm: async () => {
        pushToHistory();
        stopRef.current = false;
        setBatchGenState({ generating: true, current: 0, total: selectedIndices.length, success: 0, failures: 0 });

        for (const index of selectedIndices) {
          if (stopRef.current) break;
          setBatchGenState(prev => ({ ...prev, current: prev.current + 1 }));
          try {
            await handleGenerateImage(index, storyboard[index].imagePrompt, { noHistory: true, silentError: true });
            setBatchGenState(prev => ({ ...prev, success: prev.success + 1 }));
          } catch (error) {
            setBatchGenState(prev => ({ ...prev, failures: prev.failures + 1 }));
          }
          if (!stopRef.current) await new Promise(r => setTimeout(r, 2000));
        }
        setBatchGenState(prev => ({ ...prev, generating: false }));
      }
    });
  };

  const handleBatchGenerateVideoSelected = async () => {
    if (!storyboard) return;
    const selectedScenes = storyboard.filter(s => s.isSelected);
    if (selectedScenes.length === 0) return;

    if (!checkKeysAndShowSettings()) return;

    setConfirmModal({
      title: "Batch Generate Videos",
      message: `Generate videos for the ${selectedScenes.length} selected scenes? This will take some time and use significant API credits.`,
      type: 'info',
      onConfirm: async () => {
        pushToHistory();
        stopRef.current = false;
        setBatchGenState({ generating: true, current: 0, total: selectedScenes.length, success: 0, failures: 0 });

        for (const scene of selectedScenes) {
          if (stopRef.current) break;
          setBatchGenState(prev => ({ ...prev, current: prev.current + 1 }));
          try {
            await handleGenerateVideo(scene.id, getEffectiveVideoPrompt(scene));
            setBatchGenState(prev => ({ ...prev, success: prev.success + 1 }));
          } catch (error) {
            setBatchGenState(prev => ({ ...prev, failures: prev.failures + 1 }));
          }
        }
        setBatchGenState(prev => ({ ...prev, generating: false }));
      }
    });
  };


  const handleSaveScene = (scene: ScenePrompt) => {
    setSavedScenes(prev => {
      const isSaved = prev.some(s => s.id === scene.id);
      if (isSaved) {
        return prev.filter(s => s.id !== scene.id);
      } else {
        const sceneToSave = { ...scene, isSelected: false };
        return [sceneToSave, ...prev];
      }
    });
  };
  const handleAddSavedScene = (scene: ScenePrompt) => {
    pushToHistory();
    const newScene = { ...scene, id: generateUUID() };
    if (storyboard) {
      setStoryboard(recalcTimeline([...storyboard, newScene]));
    } else {
      setStoryboard(recalcTimeline([newScene]));
    }
  };

  const handleRestoreHistory = (item: HistoryItem) => {
    setConfirmModal({
      title: "Restore Version",
      message: "Restore this version? This will overwrite your current storyboard.",
      onConfirm: () => {
        pushToHistory();
        setStoryboard(item.storyboard);
        setLyrics(item.lyrics);
        setNarrative(item.narrative);
        setSelectedStyleId(item.styleId);
        setShowHistory(false);
      }
    });
  };

  const handleLinkRef = (sceneId: string, refId: string) => {
    if (!storyboard) return;
    pushToHistory();
    const newStoryboard = storyboard.map(scene => {
      if (scene.id === sceneId) {
        const linkedIds = scene.linkedRefIds || [];
        const newLinkedIds = linkedIds.includes(refId)
          ? linkedIds.filter(id => id !== refId)
          : [...linkedIds, refId];
        return { ...scene, linkedRefIds: newLinkedIds };
      }
      return scene;
    });
    setStoryboard(newStoryboard);
  };
  
  const getFilteredCategories = () => {
    const cats: Record<string, any[]> = { ...INFLUENCE_CATEGORIES }; 
    if (customInfluences.length > 0) cats["My Custom Influences"] = customInfluences;
    
    const lower = influenceSearch.toLowerCase();
    const filtered: Record<string, any[]> = {};
    
    Object.entries(cats).forEach(([cat, items]) => { 
      const matches = items.filter(i => 
        i.name.toLowerCase().includes(lower) || i.desc.toLowerCase().includes(lower)
      ); 
      if (matches.length) filtered[cat] = matches; 
    });

    const sortedFiltered: Record<string, any[]> = {};
    const keys = Object.keys(filtered);
    const customKey = "My Custom Influences";
    
    if (filtered[customKey]) {
      sortedFiltered[customKey] = filtered[customKey];
    }
    
    keys
      .filter(k => k !== customKey)
      .sort((a, b) => a.localeCompare(b))
      .forEach(key => {
        sortedFiltered[key] = filtered[key];
      });

    return sortedFiltered;
  };

  const toggleInfluence = (name: string) => setSelectedInfluences(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  
  const removeCustomInfluence = (id: string) => {
    const newInfluences = customInfluences.filter(c => c.id !== id);
    setCustomInfluences(newInfluences);
    localStorage.setItem('audioarc_custom_influences', JSON.stringify(newInfluences));
  };
  
  const moveCustomInfluence = (index: number, direction: -1 | 1) => { if (index + direction < 0 || index + direction >= customInfluences.length) return; const newInfluences = [...customInfluences]; [newInfluences[index], newInfluences[index + direction]] = [newInfluences[index + direction], newInfluences[index]]; setCustomInfluences(newInfluences); };

  const handleSaveCustomInfluence = (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!customModalName) return; 
    const newInfluences = [...customInfluences, { id: generateUUID(), name: customModalName, desc: customModalDesc || "No description." }];
    setCustomInfluences(newInfluences); 
    localStorage.setItem('audioarc_custom_influences', JSON.stringify(newInfluences));
    setCustomModalName(''); 
    setCustomModalDesc(''); 
    setShowCustomModal(false); 
  };
  
  const handleAskCinematographer = async () => {
    if (!customModalName) return; 
    if (!checkKeysAndShowSettings()) return;
    setIsAutoFilling(true);
    try {
        const prompt = `Act as a master cinematographer. Provide a concise description of the style or vibe described by: "${customModalName}". Focus on lighting, color palette, camera movement, and aesthetic mood. This will be used in an influence library for a filmmaker.`;
        let text = '';
        if (provider === 'gemini') { 
          const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() }); 
          const res = await ai.models.generateContent({ model: geminiUtilityModel, contents: prompt }); 
          text = res.text || ''; 
          updateUsage(res); 
        } else { 
          text = await performProviderRequest(prompt); 
        }
        
        const newInfluence = { id: generateUUID(), name: customModalName, desc: text.trim() };
        setCustomInfluences(prev => [...prev, newInfluence]);
        setSelectedInfluences(prev => [...prev, customModalName]);
        setCustomModalName('');
    } catch (e: any) {
      handleApiError(e, "Ask Master Cinematographer");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleAutoFillDescription = async () => {
    if (!customModalName) return; 
    if (!checkKeysAndShowSettings()) return;
    setIsAutoFilling(true);
    try {
        const prompt = `Describe the visual style of "${customModalName}" in one concise paragraph for a film director. Focus on lighting, colors, camera work, and mood.`;
        let text = '';
        if (provider === 'gemini') { 
          const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() }); 
          const res = await ai.models.generateContent({ model: geminiUtilityModel, contents: prompt }); 
          text = res.text || ''; 
          updateUsage(res); 
        } else { 
          text = await performProviderRequest(prompt); 
        }
        setCustomModalDesc(text.trim());
    } catch (e: any) {
      handleApiError(e, "Auto-fill Description");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleAutoDescribeCharacter = async () => {
    if (!characterModalName) return;
    if (!checkKeysAndShowSettings()) return;
    setIsAutoDescribing(true);
    try {
      const prompt = `Create a detailed, specific, and consistent physical description for a character named "${characterModalName}". Focus on concrete visual details like age, face shape, hair style and color, eye color, build, and distinctive features. This description will be used to ensure visual continuity in an AI image generator. Output only the description.`;
      let text = '';
      if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
        const res = await ai.models.generateContent({ model: geminiUtilityModel, contents: prompt });
        text = res.text || '';
        updateUsage(res);
      } else {
        text = await performProviderRequest(prompt);
      }
      setCharacterModalDesc(text.trim());
    } catch (e: any) {
      handleApiError(e, "Auto-describe Character");
    } finally {
      setIsAutoDescribing(false);
    }
  };

  const handleSaveCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!characterModalName || !characterModalDesc) return;
    const newCharacter: VisualReference = {
      id: generateUUID(),
      name: characterModalName,
      description: characterModalDesc,
      image: '', // This signifies a text-only character
      analyzing: false,
    };
    const newRefs = [newCharacter, ...visualRefs];
    setVisualRefs(newRefs);
    localStorage.setItem('audioarc_visual_refs', JSON.stringify(newRefs));
    setShowCharacterCreator(false);
    setCharacterModalName('');
    setCharacterModalDesc('');
  };

  const handleExecuteQuickSwap = async (config: QuickSwapConfig) => {
    if (!visualRefs || visualRefs.length === 0) return;
    pushToHistory();

    const sourceRef = visualRefs.find(r => r.id === config.sourceRefId);
    if (!sourceRef) throw new Error("Source character reference not found.");

    let targetRef: VisualReference;
    let updatedRefs = [...visualRefs];

    if (config.swapMode === 'existing') {
      const found = visualRefs.find(r => r.id === config.targetRefId);
      if (!found) throw new Error("Target character reference not found in library.");
      targetRef = found;
    } else if (config.swapMode === 'new') {
      if (!config.newCharacterData) throw new Error("New character details are missing.");
      targetRef = {
        id: generateUUID(),
        name: config.newCharacterData.name,
        description: config.newCharacterData.description,
        image: config.newCharacterData.image || '',
        analyzing: false
      };
      // Replace sourceRef with targetRef in visualRefs
      updatedRefs = updatedRefs.map(r => r.id === sourceRef.id ? targetRef : r);
      if (!updatedRefs.some(r => r.id === targetRef.id)) {
        updatedRefs = [targetRef, ...updatedRefs.filter(r => r.id !== sourceRef.id)];
      }
    } else { // update_current
      if (!config.newCharacterData) throw new Error("Character update details are missing.");
      targetRef = {
        ...sourceRef,
        name: config.newCharacterData.name,
        description: config.newCharacterData.description,
        image: config.newCharacterData.image !== undefined ? config.newCharacterData.image : sourceRef.image
      };
      updatedRefs = updatedRefs.map(r => r.id === sourceRef.id ? targetRef : r);
    }

    setVisualRefs(updatedRefs);
    localStorage.setItem('audioarc_visual_refs', JSON.stringify(updatedRefs));
    await idb.set('audioarc_visual_refs', updatedRefs);

    let affectedCount = 0;

    if (storyboard && storyboard.length > 0) {
      let newStoryboard = [...storyboard];
      const oldName = sourceRef.name.trim();
      const newName = targetRef.name.trim();
      const oldDesc = sourceRef.description.trim();
      const newDesc = targetRef.description.trim();

      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameRegex = oldName ? new RegExp(`\\b${escapeRegex(oldName)}\\b`, 'gi') : null;

      const updatedIndices: number[] = [];

      newStoryboard = newStoryboard.map((scene, idx) => {
        const isSelectedById = config.selectedSceneIds.includes(scene.id);
        const isLinkedByRef = config.updateLinkedIds && scene.linkedRefIds?.includes(sourceRef.id);
        const isTargetScene = isSelectedById || isLinkedByRef;

        if (!isTargetScene) return scene;

        updatedIndices.push(idx);
        let updatedScene = { ...scene };

        // 1. Update linkedRefIds
        if (config.updateLinkedIds) {
          const currentLinked = scene.linkedRefIds || [];
          const withoutOld = currentLinked.filter(id => id !== sourceRef.id);
          const withNew = withoutOld.includes(targetRef.id) ? withoutOld : [...withoutOld, targetRef.id];
          updatedScene.linkedRefIds = withNew;
        }

        // 2. Update Scene Text and Prompts
        if (config.updateSceneText) {
          if (nameRegex && oldName.toLowerCase() !== newName.toLowerCase()) {
            if (updatedScene.imagePrompt) {
              updatedScene.imagePrompt = updatedScene.imagePrompt.replace(nameRegex, newName);
            }
            if (updatedScene.description) {
              updatedScene.description = updatedScene.description.replace(nameRegex, newName);
            }
            if (updatedScene.soraPrompt) {
              updatedScene.soraPrompt = updatedScene.soraPrompt.replace(nameRegex, newName);
            }
            if (updatedScene.videoPrompts && updatedScene.videoPrompts.length > 0) {
              updatedScene.videoPrompts = updatedScene.videoPrompts.map(p => p.replace(nameRegex, newName));
            }
            if (updatedScene.voiceoverText) {
              updatedScene.voiceoverText = updatedScene.voiceoverText.replace(nameRegex, newName);
            }
            if (updatedScene.lipSyncPrompt) {
              updatedScene.lipSyncPrompt = updatedScene.lipSyncPrompt.replace(nameRegex, newName);
            }
          }
        }

        // 3. Clear generated images if requested
        if (config.clearGeneratedImages) {
          updatedScene.generatedImage = undefined;
          updatedScene.imageFilename = undefined;
        }

        return updatedScene;
      });

      affectedCount = updatedIndices.length;

      // 4. Smart AI Prompt Adaptation
      if (config.smartAiAdaptation && updatedIndices.length > 0 && checkKeysAndShowSettings()) {
        try {
          setProgress(`AI Adapting ${updatedIndices.length} scenes to ${newName}...`);
          for (let i = 0; i < updatedIndices.length; i++) {
            const sceneIdx = updatedIndices[i];
            const sc = newStoryboard[sceneIdx];
            
            const adaptPrompt = `You are a master cinematographer and film director. 
We have swapped character "${oldName}" with new character "${newName}".
New Character Visual Description: "${newDesc}"
(Previous Character: "${oldDesc}")

Update the following storyboard scene prompts to seamlessly portray "${newName}" and their visual traits, while strictly preserving the scene's action, camera angles, lighting, cinematography style, and lyric context.

SCENE CONTEXT:
Lyric: "${sc.lyric}"
Visual Beat: "${sc.description || ''}"
Image Prompt: "${sc.imagePrompt}"
Video Prompts: ${JSON.stringify(sc.videoPrompts || [])}
Sora Prompt: "${sc.soraPrompt || ''}"

Return ONLY a JSON object with keys:
"imagePrompt": (string) Updated image generation prompt featuring ${newName},
"videoPrompts": (array of 3 strings) Updated subtle, dynamic, and stylistic video prompts,
"soraPrompt": (string) Updated Sora video prompt`;

            let rawJson = '';
            if (provider === 'gemini') {
              const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
              const res = await ai.models.generateContent({
                model: geminiUtilityModel,
                contents: adaptPrompt,
                config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      imagePrompt: { type: Type.STRING },
                      videoPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
                      soraPrompt: { type: Type.STRING }
                    },
                    required: ["imagePrompt", "videoPrompts", "soraPrompt"]
                  }
                }
              });
              rawJson = res.text || '';
              updateUsage(res);
            } else {
              rawJson = await performProviderRequest(adaptPrompt, true);
            }

            try {
              const parsed = JSON.parse(cleanJSON(rawJson));
              if (parsed.imagePrompt) newStoryboard[sceneIdx].imagePrompt = parsed.imagePrompt;
              if (Array.isArray(parsed.videoPrompts) && parsed.videoPrompts.length === 3) {
                newStoryboard[sceneIdx].videoPrompts = parsed.videoPrompts;
              }
              if (parsed.soraPrompt) newStoryboard[sceneIdx].soraPrompt = parsed.soraPrompt;
            } catch (jsonErr) {
              console.warn("Could not parse AI adapt response for scene", sceneIdx + 1, jsonErr);
            }
          }
        } catch (aiErr) {
          console.error("AI Scene Adaptation error:", aiErr);
        } finally {
          setProgress('');
        }
      }

      setStoryboard(newStoryboard);
      localStorage.setItem('audioarc_storyboard', JSON.stringify(newStoryboard));
      await idb.set('audioarc_storyboard', newStoryboard);
    }

    setNotification(`Quick Swap complete! Swapped "${sourceRef.name}" with "${targetRef.name}" across ${affectedCount} linked scene(s).`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExecuteBatchCharacterUpdate = async (
    config: BatchCharacterUpdateConfig,
    onProgress: (progress: BatchCharacterProgress) => void,
    shouldStop: () => boolean
  ): Promise<{ success: number; failed: number }> => {
    if (!storyboard || storyboard.length === 0) {
      throw new Error("No storyboard scenes available to adapt.");
    }
    if (!checkKeysAndShowSettings()) {
      throw new Error("AI credentials or model provider are not configured. Please check Settings.");
    }

    // Save previous state to history stack for Undo support
    pushToHistory();

    // 1. Sync character with Visual Reference Library if requested
    let updatedRefs = [...visualRefs];
    let targetRefId = config.sourceRefId;

    if (config.syncWithLibrary) {
      if (config.targetMode === 'existing' && config.sourceRefId) {
        updatedRefs = updatedRefs.map(r => 
          r.id === config.sourceRefId 
            ? { ...r, name: config.characterName, description: config.characterDescription }
            : r
        );
      } else {
        const existingIdx = updatedRefs.findIndex(r => r.name.toLowerCase() === config.characterName.toLowerCase());
        if (existingIdx >= 0) {
          updatedRefs[existingIdx] = {
            ...updatedRefs[existingIdx],
            description: config.characterDescription
          };
          targetRefId = updatedRefs[existingIdx].id;
        } else {
          const newRef: VisualReference = {
            id: generateUUID(),
            name: config.characterName,
            description: config.characterDescription,
            image: '',
            analyzing: false
          };
          updatedRefs = [newRef, ...updatedRefs];
          targetRefId = newRef.id;
        }
      }
      setVisualRefs(updatedRefs);
      localStorage.setItem('audioarc_visual_refs', JSON.stringify(updatedRefs));
      await idb.set('audioarc_visual_refs', updatedRefs);
    }

    // 2. Identify target scenes to update
    const targetIndices = storyboard
      .map((scene, idx) => ({ scene, idx }))
      .filter(({ scene }) => config.selectedSceneIds.includes(scene.id))
      .map(({ idx }) => idx);

    if (targetIndices.length === 0) {
      throw new Error("No matching scenes selected for character adaptation.");
    }

    let newStoryboard = [...storyboard];
    let successCount = 0;
    let failedCount = 0;
    const total = targetIndices.length;

    for (let i = 0; i < targetIndices.length; i++) {
      if (shouldStop()) {
        break;
      }

      const sceneIdx = targetIndices[i];
      const currentScene = newStoryboard[sceneIdx];

      onProgress({
        current: i + 1,
        total,
        currentSceneNumber: sceneIdx + 1,
        currentSceneLyric: currentScene.lyric || 'Instrumental',
        originalImagePrompt: currentScene.imagePrompt,
        adaptedImagePrompt: undefined,
        status: 'processing',
        successCount,
        failedCount
      });

      const preservationDirective = config.preservationStyle === 'strict'
        ? `STRICT CINEMATOGRAPHY LOCK: You must keep the EXACT camera framing (shot scale, lens, angle, movement), lighting atmosphere, environment/backdrop, color grading, and action beat. ONLY adapt the character's facial features, hair, ethnicity/age, wardrobe, accessories, and physical presence to reflect "${config.characterName}".`
        : `CINEMATIC ENVIRONMENTAL HARMONY: Blend "${config.characterName}" and their wardrobe/visual traits naturally into the scene's lighting (reflections, shadows, color temperature) and environmental atmosphere, while preserving camera framing and action beats.`;

      const adaptPrompt = `You are an elite Hollywood cinematographer and storyboard director.
We are updating the character in this storyboard scene to:
CHARACTER NAME: "${config.characterName}"
NEW VISUAL DESCRIPTION: "${config.characterDescription}"
${config.previousDescription ? `(PREVIOUS DESCRIPTION BEING REPLACED: "${config.previousDescription}")` : ''}

DIRECTIVE:
${preservationDirective}

ORIGINAL SCENE CONTEXT:
Scene Number: ${sceneIdx + 1}
Lyric Beat: "${currentScene.lyric}"
Visual Beat Description: "${currentScene.description || ''}"
Current Image Prompt: "${currentScene.imagePrompt}"
Current Video Prompts: ${JSON.stringify(currentScene.videoPrompts || [])}
Current Sora Prompt: "${currentScene.soraPrompt || ''}"

TASK:
Produce an updated JSON object with revised prompts that feature "${config.characterName}" while strictly maintaining the scene structure, camera angles, lighting keys, action, and mood.

Output ONLY valid JSON with keys:
{
  "imagePrompt": "string (Updated image generation prompt for Midjourney / Flux featuring the new character)",
  "videoPrompts": ["string", "string", "string"] (3 subtle, dynamic, and stylistic video prompts with the new character),
  "soraPrompt": "string (Updated Sora prompt featuring new character with full shot composition and camera motion)",
  "description": "string (Updated 1-2 sentence visual beat description)"
}`;

      try {
        let rawJson = '';
        if (provider === 'gemini') {
          const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
          const res = await ai.models.generateContent({
            model: geminiUtilityModel,
            contents: adaptPrompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  imagePrompt: { type: Type.STRING },
                  videoPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  soraPrompt: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["imagePrompt", "videoPrompts", "soraPrompt", "description"]
              }
            }
          });
          rawJson = res.text || '';
          updateUsage(res);
        } else {
          rawJson = await performProviderRequest(adaptPrompt, true);
        }

        const parsed = JSON.parse(cleanJSON(rawJson));
        const updatedScene = { ...newStoryboard[sceneIdx] };

        if (config.adaptImagePrompts && parsed.imagePrompt) {
          updatedScene.imagePrompt = parsed.imagePrompt;
        }
        if (config.adaptVideoPrompts && Array.isArray(parsed.videoPrompts) && parsed.videoPrompts.length > 0) {
          updatedScene.videoPrompts = parsed.videoPrompts;
        }
        if (config.adaptSoraPrompts && parsed.soraPrompt) {
          updatedScene.soraPrompt = parsed.soraPrompt;
        }
        if (config.adaptSceneDescription && parsed.description) {
          updatedScene.description = parsed.description;
        }

        // Link character reference ID if enabled
        if (config.linkRefToScenes && targetRefId) {
          const currentLinked = updatedScene.linkedRefIds || [];
          if (!currentLinked.includes(targetRefId)) {
            updatedScene.linkedRefIds = [...currentLinked, targetRefId];
          }
        }

        // Clear previously generated image if requested
        if (config.clearGeneratedImages) {
          updatedScene.generatedImage = undefined;
          updatedScene.imageFilename = undefined;
        }

        newStoryboard[sceneIdx] = updatedScene;
        successCount++;

        onProgress({
          current: i + 1,
          total,
          currentSceneNumber: sceneIdx + 1,
          currentSceneLyric: currentScene.lyric || 'Instrumental',
          originalImagePrompt: currentScene.imagePrompt,
          adaptedImagePrompt: updatedScene.imagePrompt,
          status: i + 1 === total ? 'completed' : 'processing',
          successCount,
          failedCount
        });
      } catch (err) {
        console.error(`Failed to adapt character in scene #${sceneIdx + 1}:`, err);
        failedCount++;
        onProgress({
          current: i + 1,
          total,
          currentSceneNumber: sceneIdx + 1,
          currentSceneLyric: currentScene.lyric || 'Instrumental',
          originalImagePrompt: currentScene.imagePrompt,
          adaptedImagePrompt: undefined,
          status: 'processing',
          successCount,
          failedCount
        });
      }

      if (i < targetIndices.length - 1 && !shouldStop()) {
        await new Promise(r => setTimeout(r, 120));
      }
    }

    setStoryboard(newStoryboard);
    localStorage.setItem('audioarc_storyboard', JSON.stringify(newStoryboard));
    await idb.set('audioarc_storyboard', newStoryboard);

    setNotification(`✨ Character update complete! Adapted ${successCount} scene(s) to "${config.characterName}".`);
    setTimeout(() => setNotification(null), 4500);

    return { success: successCount, failed: failedCount };
  };

  const handleExportPDF = async () => {
    const filename = getExportFilename('storyboard', 'pdf');
    await exportStoryboardAsPDF(filename);
  };

  const handleExport = async (type: 'json' | 'txt' | 'image_txt' | 'video_txt' | 'image_csv' | 'zip' | 'sora_txt' | 'comfy_image' | 'comfy_video' | 'screenplay' | 'lrc' | 'wunderbar') => {
      if (!storyboard && !['json', 'lrc', 'wunderbar'].includes(type)) return setErrorMessage("No storyboard to export.");
      if (type === 'lrc' && !storyboard && (!lyrics || !lyrics.trim())) return setErrorMessage("Please enter lyrics or create a storyboard first to export an .lrc lyric sheet.");
      
      let content = "", filename = getExportFilename('export', 'txt'), mime = "text/plain";
      switch(type) {
          case 'json': 
              const projectState = { 
                version: '1.2', 
                projectName,
                lyrics, 
                narrative, 
                selectedInfluences, 
                customInfluences, 
                selectedStyleId, 
                visualRefs, 
                storyboard, 
                provider, 
                geminiMainModel, 
                geminiUtilityModel, 
                imageProvider, 
                geminiImageModel, 
                imageEngine, 
                imagenModel, 
                imageFormat, 
                openRouterImageModel, 
                videoProvider, 
                ollamaUrl, 
                ollamaModel, 
                openRouterKey, 
                openRouterModel, 
                openRouterUrl 
              };
              content = JSON.stringify(projectState, null, 2); 
              filename = getExportFilename('project_data', 'json'); 
              mime = "application/json"; 
              break;
          case 'txt': 
              content = storyboard!.map((s, i) => `SCENE ${i+1} (${s.startTime} - ${s.endTime}) [${s.groupName || 'Section'}]\nDURATION: ${s.duration}s\nSUMMARY: ${s.description || 'N/A'}\nLYRIC: "${s.lyric}"\nCAMERA MOVEMENT: ${s.cameraMovement && s.cameraMovement !== 'none' ? s.cameraMovement : 'Auto / Unspecified'}\n\n[IMAGE PROMPT]\n${s.imagePrompt}\n\n[VIDEO PROMPTS]\n1. Subtle: ${s.videoPrompts[0] || 'N/A'}\n2. Dynamic: ${s.videoPrompts[1] || 'N/A'}\n3. Stylistic: ${s.videoPrompts[2] || 'N/A'}\n\n[SORA PROMPT]\n${s.soraPrompt || 'N/A'}\n\n--------------------------------------------------`).join('\n\n'); 
              filename = getExportFilename('master_shotlist', 'txt'); 
              break;
          case 'screenplay':
              content = `TITLE: ${projectName || 'AUDIOARC CINEMATIC PROJECT'}\nNARRATIVE: ${narrative || 'N/A'}\nSTYLE: ${selectedStyle.name}\n\n` + 
                storyboard!.map((s, i) => {
                  const voiceoverBlock = s.isVoiceoverEnabled && s.voiceoverText ? `(VOICEOVER)\nNARRATOR (V.O.)\n${s.voiceoverText}\n\n` : '';
                  const cameraBlock = s.cameraMovement && s.cameraMovement !== 'none' ? `[CAMERA MOVEMENT: ${s.cameraMovement.toUpperCase()}]\n` : '';
                  return `SCENE ${i+1}\n\nINT. ${s.groupName || 'LOCATION'} - ${s.startTime}\n\n${s.description || 'Action description goes here.'}\n\n${s.lyric ? `(LYRIC)\n${s.lyric.toUpperCase()}\n\n` : ''}${voiceoverBlock}${cameraBlock}[VISUAL: ${s.imagePrompt}]\n\n[TRANSITION: ${s.transitionIn?.toUpperCase() || 'CUT'} IN / ${s.transitionOut?.toUpperCase() || 'CUT'} OUT]\n\n--------------------------------------------------`;
                }).join('\n\n');
              filename = getExportFilename('screenplay', 'txt');
              break;
          case 'image_txt': 
              content = storyboard!.map((s, i) => `SCENE ${i+1} [${s.groupName || 'Scene'}]:\n${s.imagePrompt}`).join('\n\n'); 
              filename = getExportFilename('image_prompts', 'txt'); 
              break;
          case 'video_txt': 
              content = storyboard!.map((s, i) => `SCENE ${i+1} [${s.groupName || 'Scene'} | Camera: ${s.cameraMovement || 'Auto'}]:\n[Subtle] ${s.videoPrompts[0]}\n[Dynamic] ${s.videoPrompts[1]}\n[Stylistic] ${s.videoPrompts[2]}\n[Sora] ${s.soraPrompt}`).join('\n\n-------------------\n\n'); 
              filename = getExportFilename('video_prompts', 'txt'); 
              break;
          case 'image_csv': 
              content = "id,group,summary,lyric,camera_movement,image_prompt,video_prompt_subtle,video_prompt_dynamic,video_prompt_stylistic,sora_prompt\n" + storyboard!.map((s, i) => [`${i+1}`, s.groupName || '', s.description || '', s.lyric, s.cameraMovement || 'none', s.imagePrompt, s.videoPrompts[0], s.videoPrompts[1], s.videoPrompts[2], s.soraPrompt].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n'); 
              filename = getExportFilename('prompts', 'csv'); 
              mime = "text/csv"; 
              break;
          case 'sora_txt': 
              content = storyboard!.map((scene, idx) => `SCENE ${idx + 1} (${scene.startTime}-${scene.endTime}) [${scene.groupName || 'Scene'} | ${scene.cameraMovement || 'Auto'}]:\n${getEffectiveVideoPrompt(scene)}`).join('\n\n---\n\n');
              filename = getExportFilename('sora_prompts', 'txt'); 
              break;
          case 'comfy_image':
              content = storyboard!.map((s) => `positive:${s.imagePrompt}\n\nnegative:text, watermark`).join('\n-----------------\n');
              filename = getExportFilename('comfy_image_batch', 'txt');
              break;
          case 'comfy_video':
              content = storyboard!.map((s) => `positive:${s.soraPrompt}\n\nnegative:text, watermark`).join('\n-----------------\n');
              filename = getExportFilename('comfy_video_batch', 'txt');
              break;
          case 'lrc':
              content = generateLrcContent(storyboard, lyrics, projectName, audioDuration);
              filename = getExportFilename('lyrics', 'lrc');
              mime = "text/plain";
              break;
          case 'wunderbar':
              content = getWunderbarInfoText();
              filename = getExportFilename('wunderbar_info', 'txt');
              mime = "text/plain";
              break;
          case 'zip':
                // This case is handled by handleExportProjectZip
                return;
      }
      const blob = new Blob([content], {type: mime}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  const handleExportProjectZip = async () => {
    setSaveStatus('saving');
    try {
        const zip = new JSZip();
        
        // Add project data
        const projectState = {
            version: '1.2-zip', 
            projectName,
            lyrics, narrative, selectedInfluences, customInfluences, selectedStyleId, visualRefs,
            storyboard: storyboard?.map(s => { const { generatedImage, ...rest } = s; return rest; }) || null, // remove base64 from json
            provider, geminiMainModel, geminiUtilityModel, imageProvider, geminiImageModel, imageEngine,
            imagenModel, imageFormat, openRouterImageModel, videoProvider,
            ollamaUrl, ollamaModel,
            openRouterKey, openRouterModel, openRouterUrl
        };
        zip.file('project_data.json', JSON.stringify(projectState, null, 2));

        // Add text files if storyboard exists
        if (storyboard) {
            const shotlistContent = storyboard.map((s, i) => `SCENE ${i+1} (${s.startTime} - ${s.endTime})\nDURATION: ${s.duration}s\nLYRIC: "${s.lyric}"\n\n[IMAGE PROMPT]\n${s.imagePrompt}\n\n[VIDEO PROMPTS]\n1. Subtle: ${s.videoPrompts[0] || 'N/A'}\n2. Dynamic: ${s.videoPrompts[1] || 'N/A'}\n3. Stylistic: ${s.videoPrompts[2] || 'N/A'}\n\n[SORA PROMPT]\n${s.soraPrompt || 'N/A'}\n\n--------------------------------------------------`).join('\n\n');
            zip.file('master_shotlist.txt', shotlistContent);

            const imagePromptsContent = storyboard.map((s, i) => `SCENE ${i+1}:\n${s.imagePrompt}`).join('\n\n');
            zip.file('image_prompts.txt', imagePromptsContent);
            
            const videoPromptsContent = storyboard.map((s, i) => `SCENE ${i+1}:\n[Subtle] ${s.videoPrompts[0]}\n[Dynamic] ${s.videoPrompts[1]}\n[Stylistic] ${s.videoPrompts[2]}\n[Sora] ${s.soraPrompt}`).join('\n\n-------------------\n\n');
            zip.file('video_prompts.txt', videoPromptsContent);

            const soraPromptsContent = storyboard.map((scene, idx) => `SCENE ${idx + 1} (${scene.startTime}-${scene.endTime}) [${scene.groupName || 'Scene'} | ${scene.cameraMovement || 'Auto'}]:\n${getEffectiveVideoPrompt(scene)}`).join('\n\n---\n\n');
            zip.file('sora_prompts.txt', soraPromptsContent);

            const screenplayContent = `TITLE: ${projectName || 'AUDIOARC CINEMATIC PROJECT'}\nNARRATIVE: ${narrative || 'N/A'}\nSTYLE: ${selectedStyle.name}\n\n` + 
                storyboard.map((s, i) => {
                  const voiceoverBlock = s.isVoiceoverEnabled && s.voiceoverText ? `(VOICEOVER)\nNARRATOR (V.O.)\n${s.voiceoverText}\n\n` : '';
                  const cameraBlock = s.cameraMovement && s.cameraMovement !== 'none' ? `[CAMERA MOVEMENT: ${s.cameraMovement.toUpperCase()}]\n` : '';
                  return `SCENE ${i+1}\n\nINT. ${s.groupName || 'LOCATION'} - ${s.startTime}\n\n${s.description || 'Action description goes here.'}\n\n${s.lyric ? `(LYRIC)\n${s.lyric.toUpperCase()}\n\n` : ''}${voiceoverBlock}${cameraBlock}[VISUAL: ${s.imagePrompt}]\n\n[TRANSITION: ${s.transitionIn?.toUpperCase() || 'CUT'} IN / ${s.transitionOut?.toUpperCase() || 'CUT'} OUT]\n\n--------------------------------------------------`;
                }).join('\n\n');
            zip.file('screenplay.txt', screenplayContent);

            const comfyImageBatch = storyboard.map((s) => `positive:${s.imagePrompt}\n\nnegative:text, watermark`).join('\n-----------------\n');
            zip.file('comfy_image_batch.txt', comfyImageBatch);

            const comfyVideoBatch = storyboard.map((s) => `positive:${s.soraPrompt}\n\nnegative:text, watermark`).join('\n-----------------\n');
            zip.file('comfy_video_batch.txt', comfyVideoBatch);

            zip.file('comfy_workflow_instruction.txt', "To use these batch files in ComfyUI:\n1. Install the 'Inspire Pack' node set.\n2. Use the 'Prompt (Inspire)' node or similar batch prompt nodes.\n3. Load the .txt file into the node to iterate through scenes automatically.");
        }

        // Add synchronized .lrc lyric sheet (compatible with lyric visualizers)
        const lrcContent = generateLrcContent(storyboard, lyrics, projectName, audioDuration);
        zip.file('lyrics.lrc', lrcContent);

        // Add Wunderbar! Perchance AI guide and prompt integration info
        const wunderbarInfo = getWunderbarInfoText();
        zip.file('wunderbar_info.txt', wunderbarInfo);

        // Add images
        const imgFolder = zip.folder("images");
        storyboard?.forEach((scene) => {
            if (scene.generatedImage && scene.imageFilename) {
                const parts = getBase64Parts(scene.generatedImage);
                if (parts) {
                    imgFolder?.file(scene.imageFilename, parts.data, { base64: true });
                }
            }
        });

        const content = await zip.generateAsync({ type: "blob" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = getExportFilename('project_bundle', 'zip');
        a.click();
        URL.revokeObjectURL(a.href);
    } catch (e) {
        console.error("Zip export failed", e);
        setErrorMessage("Failed to create project zip file.");
    } finally {
        setSaveStatus('idle');
    }
  };
  
  const handleTriggerImport = () => importFileRef.current?.click();

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setConfirmModal({
      title: "Import Project",
      message: "This will overwrite your current project and settings. Are you sure you want to continue?",
      onConfirm: () => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                if (file.name.endsWith('.zip')) {
                    console.log("Importing ZIP file");
                    const zip = await JSZip.loadAsync(file);
                    const projectFile = zip.file('project_data.json');
                    if (!projectFile) throw new Error("project_data.json not found in zip file.");
                    
                    const text = await projectFile.async('string');
                    console.log("ZIP content:", text);
                    const data = JSON.parse(text);
                    
                    loadProjectData(data);
                    
                    if (data.storyboard && zip.folder('images')) {
                        const imgFolder = zip.folder('images');
                        const updatedStoryboard = await Promise.all(data.storyboard.map(async (scene: ScenePrompt) => {
                            if (scene.imageFilename) {
                                const imageFile = imgFolder?.file(scene.imageFilename);
                                if (imageFile) {
                                    const base64 = await imageFile.async('base64');
                                    const mimeType = `image/${scene.imageFilename.split('.').pop()}`;
                                    return { ...scene, generatedImage: `data:${mimeType};base64,${base64}` };
                                }
                            }
                            return scene;
                        }));
                        setStoryboard(updatedStoryboard);
                    }

                } else { // JSON import
                    console.log("Importing JSON file");
                    const text = reader.result as string;
                    console.log("JSON content:", text);
                    const data = JSON.parse(text);
                    loadProjectData(data);
                }
                
                setErrorMessage({ title: "Success", body: "Project imported successfully." });
            } catch (err) {
                console.error("Import failed:", err);
                setErrorMessage("Failed to import project. The file might be corrupted or in the wrong format.");
            } finally {
                if (importFileRef.current) importFileRef.current.value = "";
            }
        };
        
        if (file.name.endsWith('.zip')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
      }
    });
  };

  const loadProjectData = (data: any) => {
      console.log("Loading project data:", data);
      setLyrics(data.lyrics || '');
      setNarrative(data.narrative || '');
      setSelectedInfluences(data.selectedInfluences || []);
      setCustomInfluences(data.customInfluences || []);
      setSelectedStyleId(data.selectedStyleId || VISUAL_STYLES[0].id);
      setUiThemeColor(VISUAL_STYLES.find(s => s.id === (data.selectedStyleId || VISUAL_STYLES[0].id))?.color || VISUAL_STYLES[0].color);
      setVisualRefs(data.visualRefs || []);
      setStoryboard(data.storyboard || null);
      if (data.projectName || data.projectTitle || data.title) {
        const name = data.projectName || data.projectTitle || data.title;
        setProjectName(name);
        localStorage.setItem('audioarc_project_name', name);
      }
      console.log("Storyboard set:", data.storyboard);

      setProvider(data.provider || 'gemini');
      setGeminiMainModel(AI_MODELS.main.includes(data.geminiMainModel) ? data.geminiMainModel : 'gemini-3.8-flash');
      setGeminiUtilityModel(AI_MODELS.utility.includes(data.geminiUtilityModel) ? data.geminiUtilityModel : 'gemini-3.1-flash-lite');
      setImageProvider(data.imageProvider || 'google');
      setGeminiImageModel(AI_MODELS.image.gemini.includes(data.geminiImageModel) ? data.geminiImageModel : 'gemini-3.1-flash-image');
      setImageEngine(data.imageEngine || 'gemini');
      setImagenModel(data.imagenModel || 'imagen-4.0-generate-001');
      setImageFormat(data.imageFormat || 'image/jpeg');
      setOpenRouterImageModel(data.openRouterImageModel || 'stabilityai/stable-diffusion-3-medium');
      setVideoProvider(data.videoProvider || 'runway');
      setOllamaUrl(data.ollamaUrl || 'http://localhost:11434');
      setOllamaModel(data.ollamaModel || 'llama3');
      setOpenRouterKey(data.openRouterKey || '');
      setOpenRouterModel(data.openRouterModel || 'meta-llama/llama-3.1-8b-instruct:free');
      setOpenRouterUrl(data.openRouterUrl || 'https://openrouter.ai/api/v1');
  };

  const handleExportAnimatic = async () => {
    if (!storyboard || !audioUrl) {
      setErrorMessage({title: "Missing Content", body: "You need a storyboard and an audio track to export an animatic."});
      return;
    }

    const options = {
        resolution: { w: parseInt(animaticResolution.split('x')[0]), h: parseInt(animaticResolution.split('x')[1])},
        transition: animaticTransition,
        fadeDuration: animaticFade
    };

    setIsGeneratingAnimatic(true);
    setShowAnimaticModal(false);
    setAnimaticProgress({ percent: 0, status: 'Initializing...' });
    
    let renderFrameRequest: number;
    let exportAudio: HTMLAudioElement | null = null;
    let audioContext: AudioContext | null = null;

    try {
        const supportedTypes = [ { mime: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', ext: 'mp4' }, { mime: 'video/mp4', ext: 'mp4' }, { mime: 'video/webm; codecs=vp9,opus', ext: 'webm' }, { mime: 'video/webm; codecs=vp8,opus', ext: 'webm' }, { mime: 'video/webm', ext: 'webm' }, { mime: 'video/x-matroska; codecs=avc1', ext: 'mkv' } ];
        const supportedType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type.mime));
        if (!supportedType) { throw new Error("No supported video format found for recording in this browser."); }

        exportAudio = new Audio(audioUrl);
        exportAudio.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          if (exportAudio!.readyState >= 2) { resolve(); } 
          else { exportAudio!.addEventListener('canplay', () => resolve(), { once: true }); exportAudio!.addEventListener('error', () => reject(new Error("Failed to load audio for export.")), { once: true }); }
        });

        const canvas = document.createElement('canvas'); canvas.width = options.resolution.w; canvas.height = options.resolution.h;
        const ctx = canvas.getContext('2d'); if (!ctx) throw new Error("Could not create canvas context");

        setAnimaticProgress({ percent: 2, status: 'Loading images...' });
        const images: (HTMLImageElement | null)[] = await Promise.all(
            storyboard.map(scene => {
                if (!scene.generatedImage) return Promise.resolve(null);
                return new Promise<HTMLImageElement | null>((resolve) => {
                    const img = new Image(); img.crossOrigin = "anonymous";
                    img.onload = () => resolve(img); img.onerror = () => resolve(null);
                    img.src = scene.generatedImage!;
                });
            })
        );

        const drawPlaceholder = (scene: ScenePrompt, index: number) => {
            ctx.fillStyle = '#111'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 48px Orbitron, sans-serif'; ctx.fillText(`SCENE ${index + 1}`, canvas.width / 2, 100);
            ctx.font = 'italic 32px Inter, sans-serif'; ctx.fillStyle = '#aaa'; ctx.fillText(`"${scene.lyric}"`, canvas.width / 2, 180);
            ctx.font = '16px JetBrains Mono, monospace'; ctx.fillStyle = '#888';
            const words = scene.imagePrompt.split(' '); let line = ''; let y = canvas.height / 2 - 50;
            for (let n = 0; n < words.length; n++) { const testLine = line + words[n] + ' '; const metrics = ctx.measureText(testLine); if (metrics.width > canvas.width - 100 && n > 0) { ctx.fillText(line, canvas.width / 2, y); line = words[n] + ' '; y += 24; } else { line = testLine; } }
            ctx.fillText(line, canvas.width / 2, y);
        };
        
        const drawSceneImage = (img: HTMLImageElement) => {
            const canvasAspect = canvas.width / canvas.height; const imageAspect = img.naturalWidth / img.naturalHeight;
            let drawWidth, drawHeight, offsetX, offsetY;
            if (imageAspect > canvasAspect) { drawWidth = canvas.width; drawHeight = canvas.width / imageAspect; offsetX = 0; offsetY = (canvas.height - drawHeight) / 2; } 
            else { drawHeight = canvas.height; drawWidth = canvas.height * imageAspect; offsetX = (canvas.width - drawWidth) / 2; offsetY = 0; }
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        };
        
        setAnimaticProgress({ percent: 5, status: 'Setting up audio/video streams...' });
        const videoStream = canvas.captureStream(30);
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Ensure audio context is running
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const sourceNode = audioContext.createMediaElementSource(exportAudio); 
        const destNode = audioContext.createMediaStreamDestination();
        sourceNode.connect(destNode); 
        
        // Optional: connect to destination if you want to hear it during export, 
        // but we'll keep it silent by NOT connecting to audioContext.destination
        
        const audioTrack = destNode.stream.getAudioTracks()[0];
        if (audioTrack) {
            videoStream.addTrack(audioTrack);
        }
        
        const recorder = new MediaRecorder(videoStream, { 
            mimeType: supportedType.mime,
            videoBitsPerSecond: 5000000, // 5Mbps for better quality
        });
        const chunks: Blob[] = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        
        const cleanup = () => { cancelAnimationFrame(renderFrameRequest); if (exportAudio) { exportAudio.pause(); exportAudio.onended = null; } if (audioContext) { audioContext.close(); } setIsGeneratingAnimatic(false); };

        recorder.onstop = () => { const blob = new Blob(chunks, { type: supportedType.mime }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = getExportFilename('animatic', supportedType.ext); a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); cleanup(); };

        const audio = exportAudio; audio.muted = true; audio.currentTime = 0;
        const totalDuration = audio.duration;

        const renderFrame = () => {
            if (audio.paused || audio.ended) return;
            const currentAudioTime = audio.currentTime; let elapsed = 0;
            for (let i = 0; i < storyboard.length; i++) {
                const scene = storyboard[i]; const sceneStart = elapsed; const sceneEnd = sceneStart + scene.duration;
                if (currentAudioTime >= sceneStart && currentAudioTime < sceneEnd) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height); const sceneImg = images[i];
                    const fadeTime = options.fadeDuration; const nextSceneImg = (i + 1 < images.length) ? images[i+1] : null;
                    if (options.transition === 'fade' && currentAudioTime > sceneEnd - fadeTime && nextSceneImg && sceneImg) { const fadeProgress = (currentAudioTime - (sceneEnd - fadeTime)) / fadeTime; ctx.globalAlpha = 1 - fadeProgress; drawSceneImage(sceneImg); ctx.globalAlpha = fadeProgress; drawSceneImage(nextSceneImg); ctx.globalAlpha = 1; }
                    else { if (sceneImg) drawSceneImage(sceneImg); else drawPlaceholder(scene, i); }
                    break;
                }
                elapsed += scene.duration;
            }
            const progressPercent = (currentAudioTime / totalDuration) * 100;
            setAnimaticProgress({ percent: progressPercent, status: `Rendering... ${formatTime(currentAudioTime)} / ${formatTime(totalDuration)}` });
            renderFrameRequest = requestAnimationFrame(renderFrame);
        };
        
        audio.onended = () => { 
            // Small delay to ensure all audio data is processed
            setTimeout(() => {
                if (recorder.state === "recording") { recorder.stop(); } 
            }, 500);
        };
        recorder.start(1000); // Collect data in 1s chunks to be safer
        await audio.play(); 
        renderFrameRequest = requestAnimationFrame(renderFrame);
    
    } catch (err: unknown) {
        // Fix: Safely handle errors in the catch block by checking if the caught error is an Error instance before accessing its message property.
        const message = err instanceof Error ? err.message : String(err);
        setErrorMessage(`Animatic export failed: ${message}`);
        setIsGeneratingAnimatic(false);
    }
  };

  const updateSoraPrompt = (index: number, val: string) => { if (!storyboard) return; const newSb = [...storyboard]; newSb[index].soraPrompt = val; setStoryboard(newSb); };
  
  const handleCopyAllSoraPrompts = () => {
    if (!storyboard) return;
    const allPrompts = storyboard.map((scene, idx) => `SCENE ${idx + 1} (${scene.startTime}-${scene.endTime}):\n${scene.soraPrompt}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(allPrompts).then(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    }).catch(_err => {
        setErrorMessage("Failed to copy prompts to clipboard.");
    });
  };

  const getEffectiveVideoPrompt = (scene: ScenePrompt): string => {
    let basePrompt = scene.soraPrompt || (scene.videoPrompts && scene.videoPrompts[0]) || scene.imagePrompt || '';
    if (scene.cameraMovement && scene.cameraMovement !== 'none') {
      const movementOpt = CINEMATIC_CAMERA_MOVEMENTS.find(m => m.id === scene.cameraMovement || m.name.toLowerCase() === scene.cameraMovement?.toLowerCase());
      const movementName = movementOpt ? movementOpt.name : scene.cameraMovement;
      const directive = movementOpt?.directive ? ` - ${movementOpt.directive}` : '';
      const movementTag = `[Camera Movement: ${movementName}${directive}]`;
      if (!basePrompt.toLowerCase().includes(movementName.toLowerCase())) {
        return `${movementTag} ${basePrompt}`.trim();
      }
    }
    return basePrompt;
  };

  const handleCameraMovementChange = (idx: number, movementVal: string) => {
    if (!storyboard) return;
    pushToHistory();
    const newSb = [...storyboard];
    const scene = { ...newSb[idx] };
    scene.cameraMovement = movementVal;

    if (movementVal && movementVal !== 'none') {
      const movementOpt = CINEMATIC_CAMERA_MOVEMENTS.find(m => m.id === movementVal || m.name.toLowerCase() === movementVal.toLowerCase());
      const movementLabel = movementOpt ? movementOpt.name : movementVal;
      const movementTag = `[Camera Movement: ${movementLabel}]`;

      if (scene.soraPrompt) {
        const cleanSora = scene.soraPrompt.replace(/\[Camera Movement:[^\]]+\]\s*/gi, '').replace(/^Camera movement:\s*[^.]+\.\s*/i, '').trim();
        scene.soraPrompt = `${movementTag} ${cleanSora}`;
      }
    } else {
      if (scene.soraPrompt) {
        scene.soraPrompt = scene.soraPrompt.replace(/\[Camera Movement:[^\]]+\]\s*/gi, '').replace(/^Camera movement:\s*[^.]+\.\s*/i, '').trim();
      }
    }

    newSb[idx] = scene;
    setStoryboard(newSb);
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setHasPaidKey(true);
    }
  };

  const handleVideoAction = (sceneId: string, prompt: string) => {
    if (videoProvider === 'google') {
        handleGenerateVideo(sceneId, prompt);
    } else {
        const providerUrls = {
            'runway': 'https://runwayml.com/',
            'ltx': 'https://ltx.studio/'
        };
        const providerName = videoProvider.charAt(0).toUpperCase() + videoProvider.slice(1);
        navigator.clipboard.writeText(prompt);
        setNotification(`Prompt copied! Paste it into ${providerName} to generate.`);
        setTimeout(() => setNotification(null), 3000);
        window.open(providerUrls[videoProvider as keyof typeof providerUrls], '_blank');
    }
  };

  const handleGenerateVideo = async (sceneId: string, prompt: string) => {
    if (!hasPaidKey && videoProvider === 'google') {
        setErrorMessage({ 
            title: "Paid API Key Required", 
            body: "Video generation with Google Veo requires an API key from a project with billing enabled. Please select a valid key to proceed.", 
            action: handleSelectKey 
        });
        return;
    }

    setVideoGenerationState(prev => ({ ...prev, [sceneId]: { status: 'Initializing...', startTime: Date.now() } }));
    setStoryboard(prev => prev ? prev.map(s => s.id === sceneId ? { ...s, videoStatus: 'generating' } : s) : null);

    try {
        const gemKey = getEffectiveGeminiKey();
        const ai = new GoogleGenAI({ apiKey: gemKey });
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
            throw new Error(String(operation.error.message));
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was provided.");
        }

        const response = await fetch(downloadLink, {
            method: 'GET',
            headers: {
                'x-goog-api-key': gemKey,
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        setStoryboard(prev => prev ? prev.map(s => s.id === sceneId ? { ...s, videoStatus: 'completed', videoUrl: videoUrl } : s) : null);

    } catch (e: any) {
        console.error("Video Generation Error:", e);
        const errorMessage = e.message || 'An unknown error occurred.';
        setVideoGenerationState(prev => ({ ...prev, [sceneId]: { ...prev[sceneId], status: 'error', error: errorMessage } }));
        setStoryboard(prev => prev ? prev.map(s => s.id === sceneId ? { ...s, videoStatus: 'error' } : s) : null);

        if (errorMessage.includes("Requested entity was not found.")) {
            setHasPaidKey(false);
            setErrorMessage({ title: "Invalid API Key", body: "The selected API key is not valid for video generation. Please select a key from a paid GCP project.", action: handleSelectKey });
        }
    }
  };
  
  const handleAIEditStoryboard = async (command?: string) => {
    if (!storyboard) return;
    const editCommand = command || aiEditorCommand;
    if (!editCommand.trim()) return;

    pushToHistory();
    setAiEditorLoading(true);

    try {
        const style = VISUAL_STYLES.find(s => s.id === selectedStyleId) || VISUAL_STYLES[0];
        const influenceList = getInfluenceDescriptions(selectedInfluences, customInfluences);
        const referenceContext = visualRefs.map(r => `${r.name}: ${r.description}`).join('\n');

        let fullRevisedStoryboard: any[] = [];
        const BATCH_SIZE = 5;

        for (let i = 0; i < storyboard.length; i += BATCH_SIZE) {
            const batch = storyboard.slice(i, i + BATCH_SIZE);
            const simplifiedBatch = batch.map(s => ({
                lyric: s.lyric,
                description: s.description,
                imagePrompt: s.imagePrompt,
                soraPrompt: s.soraPrompt,
                duration: s.duration,
                groupName: s.groupName
            }));

            const prompt = `Act as an expert film editor. Your task is to revise a portion of an existing storyboard based on a high-level creative direction.

**INSTRUCTION:** ${editCommand}

**CONTEXT:**
Visual Style: ${style.name}
Influences: ${influenceList}
Casting: ${referenceContext || "No specific character references."}

**PORTION OF STORYBOARD TO REVISE (JSON):**
${JSON.stringify(simplifiedBatch, null, 2)}

**RULES:**
1.  Apply the change consistently to these scenes.
2.  Rewrite 'description', 'imagePrompt', and 'soraPrompt' for each scene.
3.  Maintain the original number of scenes in this batch.
4.  Keep 'lyric' and 'duration' UNCHANGED.
5.  Output ONLY a valid JSON array for THIS BATCH.`;

            let revisedJsonText = '';
            if (provider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
                const result = await ai.models.generateContent({
                    model: geminiMainModel,
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    lyric: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    imagePrompt: { type: Type.STRING },
                                    soraPrompt: { type: Type.STRING },
                                    duration: { type: Type.NUMBER },
                                    groupName: { type: Type.STRING }
                                },
                                required: ["lyric", "description", "imagePrompt", "soraPrompt"]
                            }
                        }
                    }
                });
                updateUsage(result);
                revisedJsonText = result.text || '[]';
            } else if (provider === 'ollama') {
                revisedJsonText = await performProviderRequest(prompt, true);
            } else { // openrouter
                revisedJsonText = await performOpenRouterRequest(prompt, undefined, true);
            }

            const batchRevisedData = normalizeKeys(JSON.parse(cleanJSON(revisedJsonText)));
            if (Array.isArray(batchRevisedData)) {
                fullRevisedStoryboard.push(...batchRevisedData);
            }
        }

        if (fullRevisedStoryboard.length === storyboard.length) {
            const newStoryboard = storyboard.map((originalScene, index) => ({
                ...originalScene,
                description: fullRevisedStoryboard[index].description || originalScene.description,
                imagePrompt: fullRevisedStoryboard[index].imagePrompt || originalScene.imagePrompt,
                soraPrompt: fullRevisedStoryboard[index].soraPrompt || originalScene.soraPrompt,
                videoPrompts: [], 
            }));
            setStoryboard(recalcTimeline(newStoryboard));
            setShowAIEditor(false);
            setAiEditorCommand('');
        } else {
            throw new Error(`AI Editor returned ${fullRevisedStoryboard.length} scenes, but expected ${storyboard.length}. Revision failed.`);
        }
        
    } catch (e: any) {
        handleApiError(e, "AI Storyboard Revision");
    } finally {
        setAiEditorLoading(false);
    }
  };

  // --- Storyboard Prompt Presets Handlers ---
  const handleSavePreset = (preset: PromptPreset) => {
    setPromptPresets(prev => {
      const exists = prev.some(p => p.id === preset.id);
      let updated: PromptPreset[];
      if (exists) {
        updated = prev.map(p => p.id === preset.id ? preset : p);
      } else {
        updated = [preset, ...prev];
      }
      saveCustomPresetsToStorage(updated);
      return updated;
    });
    setNotification(`Preset "${preset.name}" saved to library!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeletePreset = (presetId: string) => {
    setPromptPresets(prev => {
      const updated = prev.filter(p => p.id !== presetId);
      saveCustomPresetsToStorage(updated);
      return updated;
    });
    setNotification('Preset deleted from library.');
    setTimeout(() => setNotification(null), 2500);
  };

  const handleImportPresets = (imported: PromptPreset[]) => {
    setPromptPresets(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newItems = imported.filter(p => !existingIds.has(p.id));
      const merged = [...prev, ...newItems];
      saveCustomPresetsToStorage(merged);
      return merged;
    });
    setNotification(`Imported ${imported.length} preset(s) into library!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApplyPresetToScene = (
    sceneIndex: number, 
    preset: PromptPreset, 
    applyMode: 'full' | 'imageOnly' | 'videoOnly' = 'full'
  ) => {
    if (!storyboard || sceneIndex < 0 || sceneIndex >= storyboard.length) return;
    pushToHistory();
    const newSb = [...storyboard];
    const currentScene = { ...newSb[sceneIndex] };

    if (applyMode === 'full' || applyMode === 'imageOnly') {
      currentScene.imagePrompt = preset.imagePrompt;
    }

    if (applyMode === 'full' || applyMode === 'videoOnly') {
      currentScene.soraPrompt = preset.soraPrompt || preset.imagePrompt;
      if (preset.videoPrompts && preset.videoPrompts.length > 0) {
        currentScene.videoPrompts = [...preset.videoPrompts];
      }
    }

    if (applyMode === 'full') {
      if (preset.cameraMovement && preset.cameraMovement !== 'none') {
        currentScene.cameraMovement = preset.cameraMovement;
      }
      if (preset.transitionIn && preset.transitionIn !== 'none') {
        currentScene.transitionIn = preset.transitionIn;
      }
      if (preset.transitionOut && preset.transitionOut !== 'none') {
        currentScene.transitionOut = preset.transitionOut;
      }
    }

    newSb[sceneIndex] = currentScene;
    setStoryboard(newSb);
    setNotification(`Applied "${preset.name}" preset to Scene ${sceneIndex + 1}!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApplyPresetToSelected = (
    preset: PromptPreset, 
    applyMode: 'full' | 'imageOnly' | 'videoOnly' = 'full'
  ) => {
    if (!storyboard) return;
    const selectedCount = storyboard.filter(s => s.isSelected).length;
    if (selectedCount === 0) return;
    pushToHistory();

    const newSb = storyboard.map(scene => {
      if (!scene.isSelected) return scene;
      const updated = { ...scene };

      if (applyMode === 'full' || applyMode === 'imageOnly') {
        updated.imagePrompt = preset.imagePrompt;
      }
      if (applyMode === 'full' || applyMode === 'videoOnly') {
        updated.soraPrompt = preset.soraPrompt || preset.imagePrompt;
        if (preset.videoPrompts && preset.videoPrompts.length > 0) {
          updated.videoPrompts = [...preset.videoPrompts];
        }
      }
      if (applyMode === 'full') {
        if (preset.cameraMovement && preset.cameraMovement !== 'none') {
          updated.cameraMovement = preset.cameraMovement;
        }
        if (preset.transitionIn && preset.transitionIn !== 'none') {
          updated.transitionIn = preset.transitionIn;
        }
        if (preset.transitionOut && preset.transitionOut !== 'none') {
          updated.transitionOut = preset.transitionOut;
        }
      }
      return updated;
    });

    setStoryboard(newSb);
    setNotification(`Applied "${preset.name}" preset to ${selectedCount} scene(s)!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInsertPresetAsScene = (preset: PromptPreset) => {
    pushToHistory();
    const newScene: ScenePrompt = {
      id: generateUUID(),
      lyric: preset.description || preset.name,
      description: preset.description || `${preset.name} visual sequence`,
      imagePrompt: preset.imagePrompt,
      videoPrompts: preset.videoPrompts && preset.videoPrompts.length > 0 ? [...preset.videoPrompts] : ['', '', ''],
      soraPrompt: preset.soraPrompt || preset.imagePrompt,
      duration: 4,
      cameraMovement: preset.cameraMovement || 'none',
      transitionIn: preset.transitionIn || 'fade',
      transitionOut: preset.transitionOut || 'dissolve',
      isSelected: false,
    };

    if (storyboard && storyboard.length > 0) {
      setStoryboard(recalcTimeline([...storyboard, newScene]));
    } else {
      setStoryboard(recalcTimeline([newScene]));
    }
    setNotification(`Inserted new scene with "${preset.name}" preset!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveSceneAsPreset = (scene: ScenePrompt, index: number) => {
    setPresetTargetSceneIndex(index);
    setInitialPresetData({
      name: `Scene ${index + 1} Style`,
      category: 'Custom',
      description: scene.description || `Extracted prompt configuration from Scene ${index + 1}`,
      imagePrompt: scene.imagePrompt || '',
      videoPrompts: scene.videoPrompts && scene.videoPrompts.length > 0 ? [...scene.videoPrompts] : ['', '', ''],
      soraPrompt: scene.soraPrompt || scene.imagePrompt || '',
      cameraMovement: scene.cameraMovement || 'none',
      transitionIn: scene.transitionIn || 'fade',
      transitionOut: scene.transitionOut || 'dissolve',
      tags: ['Custom', 'Scene Style']
    });
    setShowPromptPresetsModal(true);
  };

  const totalDurationSeconds = storyboard ? storyboard.reduce((acc, s) => acc + (s.duration || 0), 0) : 0;
  const totalDurationFormatted = formatTime(totalDurationSeconds);
  const selectedStyle = VISUAL_STYLES.find(s => s.id === selectedStyleId) || VISUAL_STYLES[0];
  
  const filteredOpenRouterModels = availableOpenRouterModels.filter(m => m.name.toLowerCase().includes(openRouterModelSearch.toLowerCase()));
  const freeModels = filteredOpenRouterModels.filter(m => m.isFree);
  const paidModels = filteredOpenRouterModels.filter(m => !m.isFree);

  const imageModelKeywords = ['stable-diffusion', 'sdxl', 'dall-e', 'controlnet', 'image', 'playground', 'dream', 'cascade'];
  const filteredOpenRouterImageModels = availableOpenRouterModels.filter(m => 
    m.name.toLowerCase().includes(openRouterImageModelSearch.toLowerCase()) &&
    imageModelKeywords.some(keyword => m.id.toLowerCase().includes(keyword))
  );

  const isErrorObject = typeof errorMessage === 'object' && errorMessage !== null;
  const errorTitle = isErrorObject ? errorMessage.title : "An Error Occurred";
  const errorBody = isErrorObject ? errorMessage.body : (typeof errorMessage === 'string' ? errorMessage : '');

  const activeProviderName = provider === 'gemini' ? `Gemini (${geminiMainModel})` : provider === 'ollama' ? `Ollama (${ollamaModel})` : `OpenRouter (${openRouterModel})`;

  return (
    <div className={`h-screen w-full flex flex-col bg-black text-gray-100 font-sans transition-colors duration-1000 overflow-hidden selection:bg-red-900 selection:text-white`}>
      <div className={`fixed inset-0 bg-gradient-to-br ${uiThemeColor} opacity-20 pointer-events-none z-0`}></div>
      
      {loading && (
        <div className="fixed bottom-8 right-8 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl z-[100] w-80 animate-in slide-in-from-right-8 fade-in duration-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-blue-400"/>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">AI Director Working</p>
              <p className="text-sm font-bold text-white brand-font truncate w-48">{progress || 'Generating...'}</p>
            </div>
            <button onClick={() => setLoading(false)} className="ml-auto p-1.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse" style={{ width: '100%' }}></div>
          </div>
          <p className="text-[10px] text-gray-500 mt-3 italic">You can continue editing while the AI works in the background.</p>
        </div>
      )}

      <header className="flex-none h-16 z-50 bg-[#0a0a0a]/90 backdrop-blur-lg border-b border-white/10 px-6 flex justify-between items-center shadow-lg relative">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-[2px] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-progress-shimmer"></div>
          </div>
        )}
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/50 shrink-0"><Clapperboard size={24} className="text-white"/></div>
            <div>
                <h1 className="text-xl brand-font font-bold text-white tracking-widest leading-tight">AudioArc</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Tag size={10} className="text-gray-500 shrink-0"/>
                  <input 
                    type="text" 
                    value={projectName} 
                    onChange={(e) => {
                      setProjectName(e.target.value);
                      localStorage.setItem('audioarc_project_name', e.target.value);
                    }}
                    placeholder="Untitled Project"
                    className="bg-transparent text-[11px] text-gray-400 focus:text-white focus:bg-white/5 px-1 py-0.2 rounded border border-transparent hover:border-white/10 focus:border-white/20 outline-none w-36 transition-all truncate"
                    title="Project Title (used in exports and shotlists)"
                  />
                </div>
            </div>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/5 rounded-full px-4 py-1.5 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium border-r border-white/10 pr-3"> <Film size={12} className="text-purple-400"/> {selectedStyle.name} </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium border-r border-white/10 pr-3"> <Grid size={12} className="text-blue-400"/> {selectedInfluences.length} Inf. </div>
            <button 
              onClick={() => { setColorGradeFocusSceneIndex(null); setShowColorGradeModal(true); }}
              className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-white font-medium border-r border-white/10 pr-3 transition-colors"
              title="Open Color Grading & Filter Recommendations Studio"
            >
              <Palette size={12} className="text-purple-400"/> Color Grade
            </button>
            {storyboard && storyboard.length > 0 && (
              <button 
                onClick={() => { 
                  setShowFloatingAnimatic(!showFloatingAnimatic); 
                  if (!showFloatingAnimatic) setAnimaticPreviewMode('floating'); 
                }}
                className={`flex items-center gap-1.5 text-xs font-medium border-r border-white/10 pr-3 transition-colors ${showFloatingAnimatic ? 'text-cyan-300 font-bold' : 'text-gray-300 hover:text-white'}`}
                title="Toggle Real-Time Animatic Preview Window"
              >
                <Film size={12} className="text-cyan-400"/> Live Animatic
                {showFloatingAnimatic && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              </button>
            )}
            <div className="flex items-center">
              <HeaderConnectionStatus
                provider={provider}
                connectionStatus={connectionStatus}
                geminiMainModel={geminiMainModel}
                geminiUtilityModel={geminiUtilityModel}
                geminiImageModel={geminiImageModel}
                imageEngine={imageEngine}
                imagenModel={imagenModel}
                imageProvider={imageProvider}
                openAIModel={openAIModel}
                ollamaModel={ollamaModel}
                ollamaUrl={ollamaUrl}
                lmStudioModel={lmStudioModel}
                lmStudioUrl={lmStudioUrl}
                openRouterModel={openRouterModel}
                pollinationsModel={pollinationsModel}
                apiKeyStatus={apiKeyStatus}
                totalTokenUsage={totalTokenUsage}
                onOpenSettings={(tab) => { setShowSettings(true); if (tab) setSettingsTab(tab); }}
                onTestConnection={() => handleTestConnection(provider)}
                isTestingConnection={testStatuses[provider] === 'testing'}
              />
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="md:hidden">
              <HeaderConnectionStatus
                provider={provider}
                connectionStatus={connectionStatus}
                geminiMainModel={geminiMainModel}
                geminiUtilityModel={geminiUtilityModel}
                geminiImageModel={geminiImageModel}
                imageEngine={imageEngine}
                imagenModel={imagenModel}
                imageProvider={imageProvider}
                openAIModel={openAIModel}
                ollamaModel={ollamaModel}
                ollamaUrl={ollamaUrl}
                lmStudioModel={lmStudioModel}
                lmStudioUrl={lmStudioUrl}
                openRouterModel={openRouterModel}
                pollinationsModel={pollinationsModel}
                apiKeyStatus={apiKeyStatus}
                totalTokenUsage={totalTokenUsage}
                onOpenSettings={(tab) => { setShowSettings(true); if (tab) setSettingsTab(tab); }}
                onTestConnection={() => handleTestConnection(provider)}
                isTestingConnection={testStatuses[provider] === 'testing'}
              />
            </div>
            <div className="hidden md:block h-6 w-px bg-white/10"></div>
            <div className="flex items-center gap-1">
                {storyboard && storyboard.length > 0 && (
                  <button onClick={() => setShowSceneNavigator(true)} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-blue-400 hover:text-blue-300" title="Scene Quick Navigator (Jump to any scene)"><Compass size={20}/></button>
                )}
                <input type="file" ref={importFileRef} accept=".json,.zip" onChange={handleImportProject} className="hidden" />
                <button onClick={handleTriggerImport} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all" title="Import Project"><FolderOpen size={20}/></button>
                <button onClick={() => handleExport('json')} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all" title="Download Backup (.json)"><Download size={20}/></button>
                <button onClick={handleExportPDF} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-blue-400 hover:text-blue-300" title="Export PDF"><Printer size={20}/></button>
                <button onClick={handleManualSave} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all" title="Save Project">
                    {saveStatus === 'saved' ? <Check size={20} className="text-green-400"/> : saveStatus === 'saving' ? <Loader2 size={20} className="animate-spin"/> : <Save size={20}/>}
                </button>
                <button onClick={handleUndo} disabled={historyStack.past.length === 0} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent" title="Undo (Ctrl+Z)"><Undo size={18}/></button>
                <button onClick={handleRedo} disabled={historyStack.future.length === 0} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent" title="Redo (Ctrl+Shift+Z)"><Redo size={18}/></button>
                <button onClick={() => setShowHistory(true)} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all" title="History"><History size={20}/></button>
                <button onClick={() => setShowSavedScenes(true)} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all" title="Saved Scenes"><Bookmark size={20}/></button>
                <button onClick={() => setShowResources(true)} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-green-400 hover:text-green-300" title="External Resources"><LinkIcon size={20}/></button>
                <button 
                  onClick={() => { setShowSettings(true); setSettingsTab('billing'); }} 
                  className={`p-2 rounded border transition-all ${
                    apiKeyStatus === 'not_found' && provider === 'gemini'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse' 
                      : 'hover:bg-white/10 border-transparent hover:border-white/10 text-gray-300 hover:text-white'
                  }`} 
                  title={apiKeyStatus === 'not_found' && provider === 'gemini' ? "Google API Key Required — Click to enter key" : "API Keys & Connection Settings"}
                >
                  <Key size={19}/>
                </button>
                <button onClick={() => setShowSettings(true)} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all" title="Settings"><Settings size={20}/></button>
                <button onClick={() => setShowManual(true)} className="p-2 rounded hover:bg-white/10 border border-transparent hover:border-white/10 transition-all" title="User Manual"><HelpCircle size={20}/></button>
            </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        <main className="grid grid-cols-1 md:grid-cols-12 gap-6 px-6 pt-6 pb-6 max-w-[1920px] mx-auto w-full min-h-full">
            
            {/* Quick Setup Banner: Prominently displayed if Gemini API key is missing on Vercel / standalone hosting */}
            {provider === 'gemini' && apiKeyStatus === 'not_found' && (
              <div className="col-span-1 md:col-span-12 bg-gradient-to-r from-blue-950/90 via-indigo-950/80 to-purple-950/80 border border-blue-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-300">
                      <Key size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">
                          Google Gemini API Key Required
                        </h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Vercel / Standalone Deployment
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                        To generate storyboards, scene prompts, and visuals on your Vercel deployment, paste your Google Gemini API key below. It will be saved securely in your browser's local storage and used immediately.
                      </p>
                    </div>
                  </div>

                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="self-start lg:self-center text-xs text-blue-300 hover:text-white bg-blue-500/20 hover:bg-blue-500/30 px-3 py-1.5 rounded-lg border border-blue-400/30 flex items-center gap-1.5 transition-colors shrink-0 font-medium"
                  >
                    <span>Get a free API Key</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Inline Quick Key Input Form */}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <input 
                      type={showGeminiKeySecret ? "text" : "password"}
                      placeholder="Paste your Gemini API key (AIzaSy...) here"
                      value={geminiApiKey}
                      onChange={(e) => handleUpdateGeminiKey(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-gray-500 outline-none focus:border-blue-400/70 focus:ring-1 focus:ring-blue-400 transition-all pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowGeminiKeySecret(!showGeminiKeySecret)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      title={showGeminiKeySecret ? "Hide key" : "Show key"}
                    >
                      {showGeminiKeySecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <button
                    onClick={async () => {
                      if (!geminiApiKey.trim()) {
                        alert("Please paste your Gemini API key first.");
                        return;
                      }
                      handleUpdateGeminiKey(geminiApiKey.trim());
                      await handleTestConnection('gemini');
                    }}
                    disabled={testStatuses.gemini === 'testing'}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {testStatuses.gemini === 'testing' ? (
                      <><Loader2 size={14} className="animate-spin" /> Verifying Key...</>
                    ) : testStatuses.gemini === 'ok' ? (
                      <><Check size={14} className="text-emerald-300" /> Key Connected!</>
                    ) : (
                      <><Sparkles size={14} /> Save & Connect Key</>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setSettingsTab('billing');
                    }}
                    className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0"
                    title="Open Full API Settings"
                  >
                    <Settings size={14} /> Full Settings
                  </button>
                </div>

                {connectionError && (
                  <p className="text-red-400 text-xs mt-3 bg-red-950/40 p-2.5 rounded-lg border border-red-500/30 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{connectionError}</span>
                  </p>
                )}
              </div>
            )}

            <div className="md:col-span-4 flex flex-col gap-4">
                <div className="bg-[#121212] border border-white/10 rounded-xl p-1 flex flex-col shadow-2xl relative group shrink-0">
                    <div className="bg-white/5 px-4 py-3 rounded-t-lg flex justify-between items-center border-b border-white/5">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2"> <FileText size={16} className="text-blue-500"/> Script / Lyrics </label>
                        <button onClick={()=>{const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([lyrics])); a.download='lyrics.txt'; a.click();}} className="text-[10px] text-gray-500 hover:text-white flex gap-1 items-center transition-colors"><Save size={12}/> Save</button>
                    </div>
                    <textarea className="w-full bg-[#0a0a0a] rounded-b-lg p-4 text-sm mono-font outline-none resize-none focus:bg-black transition-colors text-gray-300 placeholder-gray-700 custom-scrollbar leading-relaxed" rows={20} placeholder={`[Intro]
*vinyl crackle*
[Mood: Excitement/Anticipation]
[Instrument: Muted Trumpet]

[SFX: *A distant train horn*]

[Sample, a man speaking softly]
"Le rendez-vous, dans la vieille ville. N'oublie pas, j'y serai."
[SFX: *old metro brake squeal*]

[Verse 1]
[Instrument: Theremin Glissando]
[Vocalist: Male, Vocal Tone: Smoky Baritone]
I've just been wasting time, since I've said my peace
I've fallen behind, but I haven't fallen asleep
I can see that we're still playing strangers here
The old city. The weeping wall. Let's all go and remember.
[SFX: *footsteps on concrete*]

[Instrumental Buildup]
[Instruments: Fender Rhodes, Upright Bass, Viola]

[Sample, a woman talking on the phone]
"N'oublie pas notre heure, la vieille cité. Je t'attends."
[Drop]
[SFX: *digital alarm clock buzz*]`} value={lyrics} onChange={e => setLyrics(e.target.value)} />
                </div>

                <div className="bg-[#121212] border border-white/10 rounded-xl p-1 flex flex-col shadow-lg shrink-0">
                    <div className="bg-white/5 px-4 py-2 rounded-t-lg flex justify-between items-center border-b border-white/5"> <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2"><Pencil size={14} className="text-orange-500"/> Narrative Arc (Optional)</label> </div>
                    <textarea className="w-full bg-[#0a0a0a] rounded-b-lg p-3 text-xs outline-none resize-none focus:bg-black transition-colors text-gray-300 placeholder-gray-700" rows={3} placeholder="Describe the story arc..." value={narrative} onChange={e => setNarrative(e.target.value)} />
                </div>

                <div className="bg-[#121212] border border-white/10 rounded-xl p-1 flex flex-col shadow-lg relative group overflow-hidden shrink-0">
                    <div className="bg-white/5 px-4 py-2 rounded-t-lg flex justify-between items-center border-b border-white/5"> <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2"><Music size={14} className="text-green-500"/> Audio Track</label> {audioUrl && <button onClick={() => { setAudioUrl(null); setAudioFile(null); setAudioFileName(''); setIsPlaying(false); }} className="text-[10px] text-red-400 hover:text-red-300"><Trash2 size={12}/></button>} </div>
                    <div className="p-4">
                        {!audioUrl ? ( <div className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer relative h-36"> <Upload size={24} className="text-gray-500 mb-2"/> <p className="text-xs text-gray-400 font-bold">Upload MP3 / WAV</p> <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="absolute inset-0 opacity-0 cursor-pointer"/> </div> ) : ( 
                        <div className="bg-black/40 rounded-lg p-3 border border-white/5 h-auto flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center text-green-400 border border-green-500/30"> <Volume2 size={14}/> </div>
                                <div className="flex-1 min-w-0"> <div className="text-xs text-white font-medium truncate">{audioFileName}</div> </div>
                            </div>
                            <div className="relative h-16 bg-black/30 rounded-lg overflow-hidden border border-white/10 cursor-pointer select-none" onClick={handleVisualizerSeek}>
                                {/* Waveform visualizer from audioIntensityData */}
                                {audioIntensityData && (
                                    <AudioIntensityWaveform audioIntensityData={audioIntensityData} uiThemeColor={uiThemeColor} />
                                )}

                                {/* Live dynamic playback frequency spectrum */}
                                {frequencyData && (
                                    <div className={`absolute inset-0 flex items-end justify-center gap-[1px] bg-gradient-to-t ${uiThemeColor} opacity-10 pointer-events-none`}>
                                        {Array.from({ length: 128 }).map((_, i) => (
                                            <div key={i} className={`w-full bg-gradient-to-t ${uiThemeColor}`} style={{ height: `${(frequencyData[i] / 255) * 80}%`, opacity: `${0.2 + (frequencyData[i] / 255) * 0.6}` }}/>
                                        ))}
                                    </div>
                                )}

                                {/* Beat & Drop markers overlay */}
                                <BeatMarkersOverlay
                                    detectedPeaks={detectedBeatDrops}
                                    audioDuration={audioDuration}
                                    showMarkers={showBeatMarkers}
                                />

                                {/* Storyboard scene segments */}
                                {storyboard && audioDuration > 0 && (
                                    <div className="absolute inset-0 flex z-10 pointer-events-auto">
                                        {storyboard.map((scene, i) => (
                                            <div
                                                key={scene.id}
                                                className={`h-full border-r border-white/20 transition-colors group ${currentPlaybackIndex === i ? 'bg-white/25' : 'bg-white/5 hover:bg-white/15'}`}
                                                style={{ width: `${((scene.duration || 0) / audioDuration) * 100}%` }}
                                                onClick={(e) => { e.stopPropagation(); jumpToScene(i); }}
                                                title={`Scene ${i+1}: "${scene.lyric}" (${scene.duration || 4}s)`}
                                            >
                                                <div className="text-[9px] text-white/70 p-1 truncate group-hover:text-white transition-colors flex items-center justify-between">
                                                    <span>{`#${i+1}`}</span>
                                                    <span className="text-[8px] opacity-70 group-hover:opacity-100">{scene.duration || 4}s</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none" style={{ left: `${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%` }}/>
                            </div>
                            <div className="flex items-center justify-between mt-1 gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <button onClick={handlePrevScene} disabled={currentPlaybackIndex === 0} className="p-2 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30"> <SkipBack size={14} /> </button>
                                    <button onClick={togglePlayback} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors">
                                        {isPlaying ? <Pause size={14} fill="currentColor"/> : <Play size={14} fill="currentColor" className="ml-0.5"/>}
                                    </button>
                                    <button onClick={handleNextScene} disabled={!storyboard || currentPlaybackIndex >= storyboard.length - 1} className="p-2 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30"> <SkipForward size={14} /> </button>

                                    <div className="text-[10px] text-gray-500 font-mono ml-2"> {formatTime(currentTime)} / {formatTime(audioDuration)} </div>
                                </div>

                                <SnapToBeatsControl
                                    audioIntensityData={audioIntensityData}
                                    audioDuration={audioDuration}
                                    storyboard={storyboard}
                                    detectedPeaks={detectedBeatDrops}
                                    isAnalyzing={isAnalyzingAudio}
                                    onExecuteSnap={handleSnapToBeats}
                                    onReanalyze={() => audioFile && analyzeAudio(audioFile)}
                                    showBeatMarkers={showBeatMarkers}
                                    onToggleBeatMarkers={setShowBeatMarkers}
                                    sensitivity={snapSensitivity}
                                    onSensitivityChange={setSnapSensitivity}
                                    pacingMode={snapPacingMode}
                                    onPacingModeChange={setSnapPacingMode}
                                    minSceneDuration={snapMinSceneDuration}
                                    onMinSceneDurationChange={setSnapMinSceneDuration}
                                    fitAudioDuration={snapFitAudioDuration}
                                    onFitAudioDurationChange={setSnapFitAudioDuration}
                                    lastSnapStats={lastSnapResultStats}
                                />
                            </div>
                            <audio key={audioUrl} ref={audioRef} src={audioUrl || undefined} className="hidden" onTimeUpdate={onAudioTimeUpdate} onLoadedMetadata={onAudioLoadedMetadata} onEnded={onAudioEnded} />
                        </div> 
                        )}
                    </div>
                </div>

                <div className="bg-[#121212] border border-white/10 rounded-xl p-4 shadow-lg shrink-0 flex flex-col justify-center">
                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Film size={14} className="text-purple-500"/> Visual Style</label>
                        <div className="relative">
                        <button onClick={() => setStyleDropdownOpen(!styleDropdownOpen)} className="w-full bg-black border border-white/20 rounded-lg p-3 pl-3 text-sm text-left flex items-center justify-between outline-none focus:border-blue-500">
                            <span className="flex items-center gap-2"> <span className={`w-4 h-4 rounded bg-gradient-to-br ${selectedStyle.color} shrink-0 border border-white/20`}></span> {selectedStyle.name} </span>
                            <ChevronDown size={14} className="text-gray-500"/>
                        </button>
                        {styleDropdownOpen && ( <> <div className="fixed inset-0 z-40" onClick={() => setStyleDropdownOpen(false)}></div> <div className="absolute top-full left-0 w-full z-50 bg-[#1a1a1a] border border-white/10 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-xl custom-scrollbar"> {VISUAL_STYLES.map(s => ( <div key={s.id} onClick={() => { setSelectedStyleId(s.id); setUiThemeColor(s.color); setStyleDropdownOpen(false); }} className={`p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0 ${selectedStyleId === s.id ? 'bg-white/5' : ''}`}> <div className={`w-8 h-8 rounded bg-gradient-to-br ${s.color} shrink-0 shadow-sm border border-white/20`}></div> <div className="text-sm text-gray-200 font-medium">{s.name}</div> </div> ))} </div> </> )}
                        </div>
                </div>
                
                <div className="bg-[#121212] border border-white/10 rounded-xl p-4 shadow-lg shrink-0 flex flex-col justify-center">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2"><Clapperboard size={14} className="text-red-500"/> Director's Console</label>
                    <div className="flex flex-col gap-3 shrink-0">
                        <button onClick={handleAudioIntelligence} disabled={loading || !audioFile} className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-white/10 hover:bg-white/5 text-gray-300 font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2 hover:text-white disabled:opacity-50 relative">
                            <Wand2 size={16} className="text-green-400"/>
                            Audio Intelligence
                            <span className="absolute top-1 right-1 text-[8px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded-full border border-blue-500/30">Gemini Exclusive</span>
                        </button>
                        
                        <button onClick={handleGenerate} disabled={loading} className="w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-3 uppercase tracking-wide disabled:opacity-50">
                            <Zap size={18} className="text-yellow-300 fill-yellow-300"/>
                            Generate Storyboard
                        </button>

                        <div className="text-center text-[10px] text-gray-500">
                          Using: <strong className="text-gray-400">{activeProviderName}</strong>. <button onClick={() => {setShowSettings(true); setSettingsTab('config');}} className="underline hover:text-white">Change</button>
                        </div>
                        <button onClick={() => setShowResetConfirm(true)} className="w-full py-2.5 rounded-xl font-bold text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"><RotateCcw size={12}/> Reset Project</button>
                    </div>
                </div>
            </div>

            <div className="md:col-span-8 flex flex-col gap-6 min-w-0 max-w-full">
                <div className="bg-[#121212] rounded-xl border border-white/10 shadow-xl overflow-hidden flex flex-col min-h-[180px] shrink-0">
                    <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex justify-between items-center shrink-0">
                        <div className="flex flex-col">
                           <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2"><User size={14} className="text-teal-400"/> Cast & Locations</label>
                           {provider !== 'gemini' && <p className="text-[10px] text-gray-500 mt-1">Image analysis is only supported by Gemini or compatible Ollama/OpenRouter vision models.</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {visualRefs.length > 0 && (
                                <button onClick={() => { 
                                  setConfirmModal({
                                    title: "Clear Visual References",
                                    message: "Remove all visual references?",
                                    type: 'danger',
                                    onConfirm: () => setVisualRefs([])
                                  });
                                }} className="flex items-center gap-1 text-red-400 hover:text-red-300 px-3 py-1 rounded text-[10px] font-bold transition-colors uppercase tracking-wide"> <Trash2 size={12}/> Clear All </button>
                            )}
                            {visualRefs.length > 0 && (
                                <button 
                                  onClick={() => {
                                    setBatchCharacterInitialRefId(visualRefs[0].id);
                                    setShowBatchCharacterModal(true);
                                  }} 
                                  className="flex items-center gap-1.5 bg-cyan-900/30 border border-cyan-500/40 hover:bg-cyan-900/50 text-cyan-300 px-3 py-1 rounded-full text-[10px] font-bold transition-colors uppercase tracking-wide h-6 shadow-sm"
                                  title="Update character descriptions across selected scenes with AI"
                                >
                                  <UserCheck size={11}/> Update Character
                                </button>
                            )}
                            {visualRefs.length > 0 && (
                                <button 
                                  onClick={() => {
                                    setQuickSwapSourceRefId(visualRefs[0].id);
                                    setShowQuickSwapModal(true);
                                  }} 
                                  className="flex items-center gap-1.5 bg-teal-900/30 border border-teal-500/40 hover:bg-teal-900/50 text-teal-300 px-3 py-1 rounded-full text-[10px] font-bold transition-colors uppercase tracking-wide h-6 shadow-sm"
                                  title="Quickly swap character reference and update linked scenes"
                                >
                                  <ArrowLeftRight size={11}/> Quick Swap
                                </button>
                            )}
                            <button onClick={() => setShowCharacterCreator(true)} className="flex items-center gap-1.5 bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full text-[10px] font-bold transition-colors uppercase tracking-wide h-6"><UserPlus size={12}/> Create Character</button>
                            <div className="relative group"> <button className="flex items-center gap-1 bg-teal-900/20 border border-teal-500/30 hover:bg-teal-900/40 text-teal-300 px-3 py-1 rounded-full text-[10px] font-bold transition-colors uppercase tracking-wide h-6"> <Plus size={10}/> Upload Reference </button> <input type="file" accept="image/*" onChange={handleReferenceUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/> </div>
                        </div>
                    </div>
                    <div className="flex-1 p-3 overflow-x-auto custom-scrollbar flex gap-3 items-start bg-[#0e0e0e]">
                        {visualRefs.length === 0 ? ( <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 py-4 gap-2"> <div className="p-3 border border-dashed border-white/10 rounded-lg"> <User size={20} className="opacity-50"/> </div> <span className="text-[10px] uppercase tracking-wide opacity-50">Create characters or upload photos for continuity</span> </div> ) : ( visualRefs.map((ref) => {
                          const linkedCount = storyboard ? storyboard.filter(s => s.linkedRefIds?.includes(ref.id)).length : 0;
                          return (
                            <div key={ref.id} className="w-52 shrink-0 bg-[#181818] border border-white/10 rounded-lg overflow-hidden flex flex-col group relative shadow-md"> 
                              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-30">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setBatchCharacterInitialRefId(ref.id);
                                    setShowBatchCharacterModal(true);
                                  }}
                                  className="bg-black/80 hover:bg-cyan-600 text-cyan-300 hover:text-white p-1 rounded-md backdrop-blur-sm border border-cyan-500/30 transition-all shadow-md flex items-center gap-1 text-[9px] font-bold"
                                  title="Adapt character description across storyboard scenes with AI"
                                >
                                  <UserCheck size={10}/>
                                  <span>Adapt</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setQuickSwapSourceRefId(ref.id);
                                    setShowQuickSwapModal(true);
                                  }}
                                  className="bg-black/80 hover:bg-teal-600 text-teal-300 hover:text-white p-1 rounded-md backdrop-blur-sm border border-teal-500/30 transition-all shadow-md flex items-center gap-1 text-[9px] font-bold"
                                  title="Quick Swap this character across scenes"
                                >
                                  <ArrowLeftRight size={10}/>
                                  <span>Swap</span>
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeVisualRef(ref.id); }} 
                                  className="bg-red-600/90 hover:bg-red-500 text-white p-1 rounded-md shadow-md cursor-pointer flex items-center justify-center transition-colors"
                                  title="Delete Reference"
                                > 
                                  <X size={11}/> 
                                </button>
                              </div>
                              <div className="h-24 overflow-hidden relative bg-black/20 flex items-center justify-center"> 
                                {ref.image ? (<img src={ref.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={ref.name}/>) : (<User size={32} className="text-gray-600"/>)} 
                                {ref.analyzing && ( 
                                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 text-[10px] text-white backdrop-blur-sm"> 
                                    <Loader2 size={14} className="animate-spin"/> 
                                    Analyzing... 
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setVisualRefs(prev => prev.map(r => r.id === ref.id ? { ...r, analyzing: false, description: "Analysis stopped." } : r)); }}
                                      className="mt-1 px-2 py-0.5 bg-red-600/50 hover:bg-red-600 rounded text-[8px] uppercase tracking-tighter"
                                    >
                                      Stop
                                    </button>
                                  </div> 
                                )} 
                              </div> 
                              <div className="p-2 space-y-1"> 
                                <input type="text" value={ref.name} onChange={(e) => setVisualRefs(prev => prev.map(r => r.id === ref.id ? {...r, name: e.target.value} : r))} className="bg-transparent text-[10px] font-bold text-white w-full outline-none placeholder-gray-600 border-b border-transparent focus:border-white/20"/> 
                                <textarea value={ref.description} onChange={(e) => setVisualRefs(prev => prev.map(r => r.id === ref.id ? {...r, description: e.target.value} : r))} className="bg-black/30 text-[9px] text-gray-400 w-full h-12 resize-none outline-none rounded p-1 border border-white/5 focus:border-white/20 custom-scrollbar"/> 
                              </div> 
                              <div className="px-2 py-1 bg-black/50 border-t border-white/5 flex items-center justify-between text-[9px]">
                                <span className="text-teal-400/80 font-mono">
                                  {linkedCount} linked {linkedCount === 1 ? 'scene' : 'scenes'}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setQuickSwapSourceRefId(ref.id);
                                    setShowQuickSwapModal(true);
                                  }}
                                  className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 hover:underline"
                                >
                                  <ArrowLeftRight size={9} />
                                  <span>Quick Swap</span>
                                </button>
                              </div>
                            </div>
                          );
                        }))}
                    </div>
                </div>

                <div className="bg-[#121212] rounded-xl border border-white/10 shadow-xl overflow-hidden flex flex-col shrink-0 h-[600px]">
                    <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex flex-col gap-3 shrink-0">                        <div className="flex justify-between items-center"> 
  <div className="flex items-center gap-2 overflow-hidden"> 
    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider truncate">Influence Library</label> 
    {selectedInfluences.length>0 && <span className="text-[9px] bg-blue-900/50 text-blue-200 px-1.5 py-0.5 rounded-full border border-blue-500/30 shrink-0">{selectedInfluences.length}</span>} 
  </div> 
  <div className="flex items-center gap-3">
    <button onClick={()=>selectAllInfluences(customInfluences, setSelectedInfluences)} className="text-[10px] text-blue-400 hover:text-white flex items-center gap-0.5 transition-colors shrink-0">Select All</button>
    <button onClick={()=>setSelectedInfluences([])} disabled={selectedInfluences.length===0} className="text-[10px] text-gray-500 hover:text-white flex items-center gap-0.5 transition-colors shrink-0 disabled:opacity-30"><X size={10}/> Clear</button> 
  </div>
</div>
                        <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2">
                                <Search size={12} className="text-gray-500" />
                                <input type="text" placeholder="Search directors, genres, vibes..." value={influenceSearch} onChange={e=>setInfluenceSearch(e.target.value)} className="bg-black border border-white/10 rounded-lg py-2 px-2 text-xs w-full focus:border-white/30 outline-none transition-all"/>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="text" placeholder="Ask master cinematographer..." value={customModalName} onChange={e => setCustomModalName(e.target.value)} className="bg-black border border-white/10 rounded-lg py-2 px-2 text-xs w-full focus:border-white/30 outline-none transition-all"/>
                                <button onClick={handleAskCinematographer} className="flex items-center gap-1 bg-purple-900/20 border border-purple-500/30 hover:bg-purple-900/40 text-purple-300 px-3 py-2 rounded-lg text-[10px] font-bold transition-colors uppercase tracking-wide shrink-0">Ask</button>
                            </div>
                            <button onClick={()=>setShowCustomModal(true)} className="flex items-center gap-1 bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40 text-blue-300 px-3 py-2 rounded-lg text-[10px] font-bold transition-colors uppercase tracking-wide shrink-0 w-full justify-center"><Plus size={10}/> Add Manual Custom</button>
                        </div>

                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0e0e0e]">
                        <div className="space-y-8">
                            {Object.entries(getFilteredCategories()).map(([cat, items]) => (
                                <div key={cat} className="col-span-full">
                                    <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-3 border-b border-white/5 pb-1 flex items-center gap-2 sticky top-0 bg-[#0e0e0e] z-10 py-1"> {cat.includes("Mood") ? <Smile size={10}/> : cat.includes("Art Style") ? <Palette size={10}/> : <Film size={10}/>} {cat} </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {items.map((i, idx)=>(
                                            <div key={i.id||i.name} className={`p-1.5 rounded border cursor-pointer transition-all relative group flex flex-col h-full ${selectedInfluences.includes(i.name) ? 'bg-blue-900/20 border-blue-500/50' : 'bg-[#181818] border-white/5 hover:bg-[#202020] hover:border-white/20'}`} onClick={()=>toggleInfluence(i.name)}>
                                                <div className="font-bold text-[10px] text-gray-200 mb-0.5 flex justify-between items-start"> <span className="truncate pr-4">{i.name}</span> {selectedInfluences.includes(i.name) && <Check size={12} className="text-blue-400 shrink-0 absolute top-1.5 right-1.5"/>} </div>
                                                <div className="text-[9px] text-gray-500 leading-tight line-clamp-2">{i.desc}</div>
                                                {cat === "My Custom Influences" && !influenceSearch && ( <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"> <button onClick={(e)=>{e.stopPropagation(); moveCustomInfluence(idx, -1)}} className="bg-[#2a2a2a] p-1 rounded disabled:opacity-30" disabled={idx === 0} title="Move Up"> <ArrowUp size={8}/> </button> <button onClick={(e)=>{e.stopPropagation(); moveCustomInfluence(idx, 1)}} className="bg-[#2a2a2a] p-1 rounded disabled:opacity-30" disabled={idx === items.length - 1} title="Move Down"> <ArrowDown size={8}/> </button> </div> )}
                                                {i.id && <button onClick={(e)=>{e.stopPropagation(); removeCustomInfluence(i.id)}} className="absolute top-1 right-1 bg-red-900 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X size={10}/></button>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(getFilteredCategories()).length === 0 && ( <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 py-20"> <Search size={32} className="opacity-20"/> <p className="text-sm">No influences found.</p> </div> )}
                        </div>
                    </div>
                </div>

                {isGeneratingAnimatic && (
                    <div className="fixed inset-0 z-[102] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                        <Loader2 size={48} className="text-blue-400 animate-spin"/>
                        <p className="text-white mt-4 font-bold">{animaticProgress.status}</p>
                        <div className="w-64 bg-white/10 rounded-full h-2.5 mt-2">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{width: `${animaticProgress.percent}%`}}></div>
                        </div>
                    </div>
                )}

                {storyboard && (
                    <div id="storyboard-container" className="w-full max-w-full min-w-0 overflow-hidden space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 box-border">
                        {/* Sticky Storyboard Header & Clean Wrapped Toolbar */}
                        <div className="w-full max-w-full border-b-2 border-white/20 pb-3 mb-4 sticky top-0 bg-black/95 backdrop-blur-md z-20 pt-3 rounded-t-xl px-4 flex flex-col gap-2.5 shadow-xl box-border">
                            {/* Top Tier: Title, View Switchers & Playback Status */}
                            <div className="flex items-center justify-between flex-wrap gap-3 w-full"> 
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-2xl brand-font font-bold flex items-center gap-2.5 text-white">
                                        <Clapperboard className="text-red-600 shrink-0"/> 
                                        <span>Storyboard</span>
                                    </h2> 
                                    
                                    {/* View Mode Switcher: Cards vs Multi-Track Studio */}
                                    <div className="flex items-center bg-black/60 p-0.5 rounded-xl border border-white/15 gap-0.5 shadow-inner">
                                        <button
                                            onClick={() => setStoryboardViewMode('cards')}
                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${storyboardViewMode === 'cards' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                            title="Standard Storyboard Cards View"
                                        >
                                            <LayoutGrid size={13} />
                                            <span>Cards</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setStoryboardViewMode('multitrack');
                                                if (!multiTrackProject && storyboard) {
                                                    setMultiTrackProject(buildMultiTrackFromStoryboard(storyboard, audioUrl, audioDuration, visualRefs));
                                                }
                                            }}
                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${storyboardViewMode === 'multitrack' ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                            title="Multi-Track Timeline & Real-Time Animatic Studio"
                                        >
                                            <Layers size={13} className="text-purple-300" />
                                            <span>Multi-Track Studio</span>
                                            <span className="text-[9px] px-1 py-0.2 bg-purple-400/20 text-purple-300 rounded font-mono uppercase border border-purple-400/30">NLE</span>
                                        </button>
                                    </div>

                                    {/* Live Animatic Preview Floating Window Toggle */}
                                    <button
                                        onClick={() => {
                                            setShowFloatingAnimatic(!showFloatingAnimatic);
                                            if (!showFloatingAnimatic) setAnimaticPreviewMode('floating');
                                        }}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${showFloatingAnimatic ? 'bg-cyan-950/90 border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                        title="Toggle Real-Time Animatic Preview Window"
                                    >
                                        <Film size={13} className="text-cyan-400" />
                                        <span>Live Animatic</span>
                                        <span className={`w-2 h-2 rounded-full ${showFloatingAnimatic ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`} />
                                    </button>
                                </div>

                                {/* Right Side: Duration, Scene Stepper & Quick Play */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                                        <span className="text-white font-bold">{totalDurationFormatted}</span>
                                        <span className="text-gray-600">•</span>
                                        <span>{storyboard.length} Scenes</span>
                                    </div>

                                    <div className="flex items-center bg-black/60 border border-white/15 rounded-lg p-0.5 shadow-sm">
                                        <button onClick={handlePrevScene} disabled={currentPlaybackIndex === 0} className="p-1.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-md disabled:opacity-25 transition-colors" title="Previous Scene (Left Arrow Key)">
                                            <ChevronLeft size={14}/>
                                        </button>
                                        <span className="text-[10px] font-mono px-2 text-gray-300 font-bold whitespace-nowrap">
                                            {currentPlaybackIndex + 1}/{storyboard.length}
                                        </span>
                                        <button onClick={handleNextScene} disabled={currentPlaybackIndex >= storyboard.length - 1} className="p-1.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-md disabled:opacity-25 transition-colors" title="Next Scene (Right Arrow Key)">
                                            <ChevronRight size={14}/>
                                        </button>
                                    </div>

                                    <button 
                                        onClick={togglePlayback} 
                                        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all uppercase whitespace-nowrap ${isPlaying ? 'bg-red-900/30 text-red-400 border-red-500/40 hover:bg-red-900/50 shadow-sm shadow-red-500/10' : 'bg-green-900/30 text-green-400 border-green-500/40 hover:bg-green-900/50 shadow-sm shadow-green-500/10'}`} 
                                        title="Play / Pause Storyboard (Spacebar)"
                                    >
                                        {isPlaying ? <Pause size={12}/> : <Play size={12}/>} 
                                        <span>{isPlaying ? 'Pause' : 'Play'}</span>
                                    </button>

                                    <div className="hidden lg:flex items-center gap-1 text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                        <kbd className="px-1 py-0.2 bg-black/50 rounded text-cyan-300 font-bold border border-cyan-500/30">←</kbd>
                                        <kbd className="px-1 py-0.2 bg-black/50 rounded text-cyan-300 font-bold border border-cyan-500/30">→</kbd>
                                        <kbd className="px-1 py-0.2 bg-black/50 rounded text-emerald-300 font-bold border border-emerald-500/30 ml-0.5">Space</kbd>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Tier: Full-Width Clean Wrapped Action Toolbar */}
                            <div className="w-full max-w-full flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/10 bg-white/[0.02] px-2 py-1.5 rounded-lg box-border">
                                {/* Left & Center Clusters: Selection, Playback, AI & Styling */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {/* Selection & Quick Nav */}
                                    <button onClick={selectAllScenes} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold rounded-md border border-white/10 transition-all uppercase whitespace-nowrap">
                                        Select All
                                    </button>
                                    <button onClick={toggleSlideshow} className={`flex items-center gap-1 px-2.5 py-1 border rounded-md text-[10px] font-bold transition-all uppercase whitespace-nowrap ${isSlideshowMode ? 'bg-blue-600 text-white border-blue-500' : 'bg-blue-900/20 text-blue-400 border-blue-500/30 hover:bg-blue-900/40'}`}>
                                        <Maximize2 size={11}/> 
                                        <span>Slideshow</span>
                                    </button>
                                    <button onClick={() => setShowSceneNavigator(true)} className="flex items-center gap-1 px-2.5 py-1 bg-blue-900/20 text-blue-400 border border-blue-500/30 rounded-md text-[10px] hover:bg-blue-900/40 font-bold transition-all uppercase whitespace-nowrap" title="Scene Quick Navigator">
                                        <Compass size={11}/> 
                                        <span>Navigator</span>
                                    </button>

                                    <div className="h-4 w-px bg-white/15 hidden sm:block shrink-0 mx-0.5" />

                                    {/* AI Generation Cluster */}
                                    {batchGenState.generating ? (
                                        <button onClick={() => { stopRef.current = true; }} className="flex items-center gap-1 px-2.5 py-1 bg-red-900/40 text-red-400 border border-red-500/50 rounded-md text-[10px] hover:bg-red-900/60 font-bold transition-all uppercase whitespace-nowrap">
                                            <StopCircle size={11}/>
                                            <span>Stop ({batchGenState.current}/{batchGenState.total})</span>
                                        </button>
                                    ) : (
                                        <button onClick={handleBatchGenerateImages} className="flex items-center gap-1 px-2.5 py-1 bg-teal-900/20 text-teal-400 border border-teal-500/30 rounded-md text-[10px] hover:bg-teal-900/40 font-bold transition-all uppercase disabled:opacity-50 whitespace-nowrap">
                                            <Layers size={11}/>
                                            <span>Generate All</span>
                                        </button>
                                    )}

                                    <button onClick={handleGenerateAllSceneSummaries} disabled={isBatchSummarizing} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] hover:bg-emerald-900/40 font-bold transition-all uppercase disabled:opacity-50 whitespace-nowrap" title="Generate one-sentence summaries for all scenes with AI">
                                        {isBatchSummarizing ? <Loader2 size={11} className="animate-spin text-emerald-400" /> : <Wand2 size={11}/>} 
                                        <span>{isBatchSummarizing ? `Summarizing (${(generatingSummaryIdx ?? 0) + 1}/${storyboard.length})` : 'AI Summaries'}</span>
                                    </button>

                                    <button onClick={() => { setBatchCharacterInitialRefId(null); setShowBatchCharacterModal(true); }} className="flex items-center gap-1 px-2.5 py-1 bg-cyan-900/20 text-cyan-400 border border-cyan-500/30 rounded-md text-[10px] hover:bg-cyan-900/40 font-bold transition-all uppercase whitespace-nowrap" title="Update character descriptions across selected scenes with AI">
                                        <UserCheck size={11}/> 
                                        <span>Update Cast</span>
                                    </button>

                                    <button onClick={() => setShowAIEditor(true)} className="flex items-center gap-1 px-2.5 py-1 bg-yellow-900/20 text-yellow-400 border border-yellow-500/30 rounded-md text-[10px] hover:bg-yellow-900/40 font-bold transition-all uppercase whitespace-nowrap">
                                        <Pencil size={11}/> 
                                        <span>AI Editor</span>
                                    </button> 

                                    <button onClick={() => setShowSoraBuilder(true)} className="flex items-center gap-1 px-2.5 py-1 bg-orange-900/20 text-orange-400 border border-orange-500/30 rounded-md text-[10px] hover:bg-orange-900/40 font-bold transition-all uppercase whitespace-nowrap" title="Video Prompt Builder">
                                        <MonitorPlay size={11}/> 
                                        <span>Prompts</span>
                                    </button>

                                    <button onClick={handleGenerateScript} className="flex items-center gap-1 px-2.5 py-1 bg-purple-900/20 text-purple-400 border border-purple-500/30 rounded-md text-[10px] hover:bg-purple-900/40 font-bold transition-all uppercase whitespace-nowrap">
                                        <ScrollText size={11}/> 
                                        <span>Script</span>
                                    </button>

                                    <div className="h-4 w-px bg-white/15 hidden sm:block shrink-0 mx-0.5" />

                                    {/* Visual Style & Timing Tools */}
                                    <button onClick={() => { setColorGradeFocusSceneIndex(null); setShowColorGradeModal(true); }} className="flex items-center gap-1 px-2.5 py-1 bg-purple-900/30 text-purple-300 border border-purple-500/40 rounded-md text-[10px] hover:bg-purple-900/50 font-bold transition-all uppercase whitespace-nowrap shadow-sm" title="Analyze visual style and generate color grading filters for image prompts">
                                        <Palette size={11} className="text-purple-400"/> 
                                        <span>Color Grade</span>
                                    </button>

                                    <button onClick={() => setShowStyleRefinerModal(true)} className="flex items-center gap-1 px-2.5 py-1 bg-amber-900/30 text-amber-300 border border-amber-500/40 rounded-md text-[10px] hover:bg-amber-900/50 font-bold transition-all uppercase whitespace-nowrap shadow-sm" title="AI Style Refiner: Apply cohesive cinematic visual filters to scenes">
                                        <Sparkles size={11} className="text-amber-400"/> 
                                        <span>Style Refiner</span>
                                    </button>

                                    <button onClick={() => { setContrastBoosterFocusSceneIndex(null); setShowContrastBoosterModal(true); }} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-900/30 text-indigo-300 border border-indigo-500/40 rounded-md text-[10px] hover:bg-indigo-900/50 font-bold transition-all uppercase whitespace-nowrap shadow-sm" title="AI Contrast Booster: Analyze selected scenes and automatically adjust keywords for dramatic contrast & visual depth">
                                        <Contrast size={11} className="text-indigo-400"/> 
                                        <span>Contrast Booster</span>
                                    </button>

                                    <button onClick={() => { setPresetTargetSceneIndex(null); setInitialPresetData(null); setShowPromptPresetsModal(true); }} className="flex items-center gap-1 px-2.5 py-1 bg-violet-900/20 text-violet-400 border border-violet-500/30 rounded-md text-[10px] hover:bg-violet-900/40 font-bold transition-all uppercase whitespace-nowrap" title="Open Storyboard Prompt Presets Library">
                                        <SlidersHorizontal size={11}/> 
                                        <span>Presets</span>
                                    </button>

                                    {audioIntensityData && (
                                        <button onClick={() => handleSnapToBeats()} className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 rounded-md text-[10px] hover:bg-cyan-900/60 font-bold transition-all uppercase whitespace-nowrap" title="Snap scene durations to audio peak drops">
                                            <Zap size={11} className="text-amber-400 fill-amber-400"/> 
                                            <span>Snap Beats</span>
                                        </button>
                                    )}
                                </div>

                                {/* Right Cluster: Export & Animatic Render */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button onClick={() => setShowAnimaticModal(true)} className="flex items-center gap-1 px-2.5 py-1 bg-cyan-900/20 text-cyan-400 border border-cyan-500/30 rounded-md text-[10px] hover:bg-cyan-900/40 font-bold transition-all uppercase whitespace-nowrap">
                                        <Film size={11}/> 
                                        <span>Animatic</span>
                                    </button>
                                    <button onClick={() => setShowExport(true)} className="flex items-center gap-1 px-2.5 py-1 bg-green-900/20 text-green-400 border border-green-500/30 rounded-md text-[10px] hover:bg-green-900/40 font-bold transition-all uppercase whitespace-nowrap">
                                        <Share2 size={11}/> 
                                        <span>Export</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {storyboardViewMode === 'multitrack' && multiTrackProject ? (
                            <MultiTrackStudioView
                                storyboard={storyboard}
                                onStoryboardChange={(updatedSb) => {
                                    pushToHistory();
                                    setStoryboard(updatedSb);
                                }}
                                project={multiTrackProject}
                                onProjectChange={setMultiTrackProject}
                                audioUrl={audioUrl}
                                audioDuration={audioDuration}
                                currentTime={currentTime}
                                isPlaying={isPlaying}
                                onTogglePlay={togglePlayback}
                                onSeek={handleTimelineSeek}
                                onJumpToScene={jumpToScene}
                                audioIntensityData={audioIntensityData}
                                detectedBeatDrops={detectedBeatDrops}
                                visualRefs={visualRefs}
                                onOpenExportAnimatic={() => setShowAnimaticModal(true)}
                                onNotification={(msg) => setNotification(msg)}
                                previewMode={animaticPreviewMode}
                                onPreviewModeChange={setAnimaticPreviewMode}
                            />
                        ) : (
                            <>
                        {batchGenState.generating && (
                            <div className="text-center text-xs p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg animate-pulse">
                                Generating {batchGenState.current}/{batchGenState.total}... (Success: {batchGenState.success}, Failed: {batchGenState.failures})
                            </div>
                        )}

                        {storyboard.some(s => s.isSelected) && (() => {
                            const selectedIndices = storyboard.map((s, i) => s.isSelected ? i : -1).filter(i => i !== -1);
                            const isTwoAdjacent = selectedIndices.length === 2 && selectedIndices[1] === selectedIndices[0] + 1;
                            return (
                            <div className="w-full max-w-full flex gap-1.5 items-center bg-blue-950/80 p-2 rounded-xl border border-blue-500/40 mb-4 shadow-xl animate-in slide-in-from-top-2 sticky top-[100px] z-30 backdrop-blur-md flex-wrap box-border">
                                <span className="text-[10px] font-bold text-blue-300 uppercase px-2 whitespace-nowrap">{selectedIndices.length} Selected</span>
                                {isTwoAdjacent && (
                                    <button 
                                        onClick={() => handleMergeScenes(selectedIndices[0])} 
                                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-lg uppercase transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap border border-cyan-400/40"
                                        title={`Merge Scene ${selectedIndices[0] + 1} & Scene ${selectedIndices[1] + 1} into one scene`}
                                    >
                                        <Merge size={12}/> Merge 2 Adjacent Scenes
                                    </button>
                                )}
                                <button onClick={async () => {
                                    if (!storyboard) return;
                                    for (const idx of selectedIndices) {
                                        await handleGenerateSceneSummary(idx);
                                    }
                                }} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg uppercase transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap" title="Generate AI summaries for selected scenes"><Wand2 size={11}/> Summarize Selected</button>
                                <button onClick={() => { setBatchCharacterInitialRefId(null); setShowBatchCharacterModal(true); }} className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-lg uppercase transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap" title="Update character descriptions across selected scenes with AI"><UserCheck size={11}/> Update Character</button>
                                <button onClick={() => { setPresetTargetSceneIndex(null); setInitialPresetData(null); setShowPromptPresetsModal(true); }} className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg uppercase transition-colors flex items-center gap-1 whitespace-nowrap"><SlidersHorizontal size={11}/> Apply Preset</button>
                                <button onClick={() => { setColorGradeFocusSceneIndex(null); setShowColorGradeModal(true); }} className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded-lg uppercase transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap" title="Apply color grading filters to selected scenes"><Palette size={11}/> Color Grade</button>
                                <button onClick={() => setShowStyleRefinerModal(true)} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold rounded-lg uppercase transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap" title="Apply cohesive cinematic visual filter to selected scenes with AI Style Refiner"><Sparkles size={11}/> Style Refiner</button>
                                <button onClick={() => { setContrastBoosterFocusSceneIndex(null); setShowContrastBoosterModal(true); }} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg uppercase transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap" title="Boost dramatic contrast and visual depth for selected scenes with AI Contrast Booster"><Contrast size={11}/> Contrast Booster</button>
                                <button onClick={handleBatchGenerateSelected} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg uppercase transition-colors whitespace-nowrap">Generate Images</button>
                                <button onClick={handleBatchGenerateVideoSelected} className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold rounded-lg uppercase transition-colors whitespace-nowrap">Generate Videos</button>
                                <button onClick={deleteSelectedScenes} className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg uppercase transition-colors whitespace-nowrap">Delete Selected</button>
                                <button onClick={deselectAllScenes} className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg uppercase transition-colors whitespace-nowrap">Deselect All</button>
                            </div>
                            );
                        })()}

                        {storyboard.map((scene, idx) => {
                            const isNewGroup = scene.groupName && (idx === 0 || scene.groupName !== storyboard[idx - 1]?.groupName);
                            const isCollapsed = scene.groupName ? collapsedGroups.has(scene.groupName) : false;
                            const isPlayingActive = idx === currentPlaybackIndex && isPlaying;
                            const linkedRefs = visualRefs.filter(ref => scene.linkedRefIds?.includes(ref.id));
                            const isBookmarked = savedScenes.some(s => s.id === scene.id);
                            const videoState = videoGenerationState[scene.id];
                            const groupSceneCount = scene.groupName ? storyboard.filter(s => (s.groupName || 'Default') === scene.groupName).length : 0;

                            return (
                            <React.Fragment key={scene.id || `fallback-${idx}`}>
                            {isNewGroup && (
                              <div className="mt-8 mb-4 flex items-center justify-between bg-white/5 hover:bg-white/[0.07] p-3 rounded-xl border border-white/10 transition-colors group/groupheader">
                                <div className="flex items-center gap-3 cursor-pointer select-none flex-1" onClick={() => toggleGroupCollapse(scene.groupName!)}>
                                  <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${!isCollapsed ? 'rotate-90 text-blue-400' : ''}`} />
                                  
                                  {editingGroupName === scene.groupName ? (
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={renameGroupInput}
                                        onChange={e => setRenameGroupInput(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') confirmRenameGroup(scene.groupName!, renameGroupInput);
                                          if (e.key === 'Escape') cancelRenameGroup();
                                        }}
                                        autoFocus
                                        className="bg-black border border-blue-500 text-sm font-bold text-white px-2.5 py-1 rounded-md outline-none w-56 focus:ring-1 focus:ring-blue-400 shadow-inner"
                                        placeholder="Group Name..."
                                      />
                                      <button 
                                        onClick={() => confirmRenameGroup(scene.groupName!, renameGroupInput)}
                                        className="p-1.5 bg-green-900/40 hover:bg-green-800/60 text-green-300 border border-green-500/40 rounded-md transition-colors"
                                        title="Save Group Name"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button 
                                        onClick={cancelRenameGroup}
                                        className="p-1.5 bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white rounded-md transition-colors"
                                        title="Cancel"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-sm font-bold text-blue-200 uppercase tracking-wider">{scene.groupName}</span>
                                      <span className="text-[10px] text-gray-400 font-mono px-2 py-0.5 bg-white/5 rounded-full border border-white/5">
                                        {groupSceneCount} scene{groupSceneCount === 1 ? '' : 's'}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startRenameGroup(scene.groupName!);
                                        }}
                                        className="opacity-0 group-hover/groupheader:opacity-100 hover:opacity-100 p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-all ml-1"
                                        title="Rename Sequence Group"
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const groupScenes = storyboard.filter(s => (s.groupName || 'Default') === scene.groupName);
                                      const allSelected = groupScenes.every(s => s.isSelected);
                                      setStoryboard(storyboard.map(s => {
                                        if ((s.groupName || 'Default') === scene.groupName) {
                                          return { ...s, isSelected: !allSelected };
                                        }
                                        return s;
                                      }));
                                    }}
                                    className="text-[10px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors uppercase font-bold"
                                    title="Toggle selection for all scenes in this group"
                                  >
                                    Select Group
                                  </button>
                                </div>
                              </div>
                            )}
                            {!isCollapsed && (
                                <div 
                                    id={`scene-card-${idx}`}
                                    className={`p-4 rounded-xl border bg-[#121212] mb-4 relative group transition-all duration-300 ease-out hover:scale-[1.008] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(59,130,246,0.15)] min-w-0 max-w-full overflow-hidden ${
                                        scene.isSelected 
                                            ? 'border-blue-500/60 bg-blue-950/20 shadow-[0_0_25px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/40' 
                                            : 'border-white/10 hover:border-white/25'
                                    } ${isPlayingActive ? 'ring-2 ring-green-500 shadow-[0_0_25px_rgba(34,197,94,0.3)]' : ''}`} 
                                    onClick={(e) => { e.stopPropagation(); toggleSceneSelection(idx); }}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3 w-full max-w-full">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="mt-1 shrink-0">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${scene.isSelected ? 'bg-blue-600 border-blue-500' : 'bg-black/40 border-white/20 group-hover:border-white/40'}`}>
                                                    {scene.isSelected && <Check size={12} className="text-white" />}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                 <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <div className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5 whitespace-nowrap"> {scene.startTime} - {scene.endTime} </div>
                                                    <div className="flex items-center gap-2 flex-1 min-w-[140px] max-w-[200px]" onClick={(e)=>e.stopPropagation()}> <Clock size={12} className="text-gray-600"/> <input type="range" min="1" max="30" step="0.5" value={scene.duration || 4} onChange={(e) => updateDuration(idx, parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" title="Duration"/> <span className="text-xs font-bold text-blue-400 w-12 text-right">{scene.duration}s</span> </div>
                                                    {scene.cameraMovement && scene.cameraMovement !== 'none' && (
                                                        <span className="text-[9px] font-bold bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1 shrink-0">
                                                            <Video size={10} className="text-cyan-400"/> {scene.cameraMovement}
                                                        </span>
                                                    )}
                                                    {scene.isLipSyncEnabled && (
                                                        <span className="text-[9px] font-bold bg-pink-900/40 text-pink-300 px-2 py-0.5 rounded border border-pink-500/30 flex items-center gap-1 shrink-0"><Mic size={10}/> Wav2Lip Active</span>
                                                    )}
                                                    {scene.isVoiceoverEnabled && (
                                                        <span className="text-[9px] font-bold bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 shrink-0"><Volume2 size={10}/> V.O. Active</span>
                                                    )}
                                                 </div>
                                                 <div className="text-sm text-gray-200 italic border-l-2 border-white/10 pl-3 py-1 break-words">"{scene.lyric}"</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 items-center flex-wrap justify-start sm:justify-end shrink-0 max-w-full">
                                            <button onClick={(e)=>{e.stopPropagation(); handleToggleVoiceover(idx)}} className={`px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold border transition-colors ${scene.isVoiceoverEnabled ? 'bg-amber-900/40 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20' : 'bg-black/30 border-white/10 text-gray-400 hover:text-gray-200'}`} title="Toggle Voiceover / Narration (V.O.) for Screenplay">
                                                <Volume2 size={12} className={scene.isVoiceoverEnabled ? 'text-amber-400' : ''}/>
                                                <span className="hidden sm:inline">Voiceover</span>
                                            </button>
                                            <button onClick={(e)=>{e.stopPropagation(); handleToggleLipSync(idx)}} className={`px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold border transition-colors ${scene.isLipSyncEnabled ? 'bg-pink-900/40 text-pink-300 border-pink-500/50 shadow-sm shadow-pink-500/20' : 'bg-black/30 border-white/10 text-gray-400 hover:text-gray-200'}`} title="Toggle Wav2Lip Performance Lip-Sync Mode">
                                                <Mic size={12} className={scene.isLipSyncEnabled ? 'text-pink-400 animate-pulse' : ''}/>
                                                <span className="hidden sm:inline">Lip-Sync</span>
                                            </button>
                                            <button onClick={(e)=>{e.stopPropagation(); setPresetTargetSceneIndex(idx); setInitialPresetData(null); setShowPromptPresetsModal(true);}} className="p-1.5 hover:bg-white/10 rounded text-violet-400 hover:text-violet-300" title="Apply Prompt Preset to Scene"><SlidersHorizontal size={14}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); setColorGradeFocusSceneIndex(idx); setShowColorGradeModal(true);}} className="p-1.5 hover:bg-white/10 rounded text-purple-400 hover:text-purple-300" title="Color Grade & Filter for Scene"><Palette size={14}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); setStoryboard(prev => prev ? prev.map((s, i) => i === idx ? { ...s, isSelected: true } : s) : null); setShowStyleRefinerModal(true);}} className="p-1.5 hover:bg-white/10 rounded text-amber-400 hover:text-amber-300" title="Refine Style with Cinematic Filter"><Sparkles size={14}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); setContrastBoosterFocusSceneIndex(idx); setStoryboard(prev => prev ? prev.map((s, i) => i === idx ? { ...s, isSelected: true } : s) : null); setShowContrastBoosterModal(true);}} className="p-1.5 hover:bg-white/10 rounded text-indigo-400 hover:text-indigo-300" title="Boost Contrast & Visual Depth with AI Contrast Booster"><Contrast size={14}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); handleSaveSceneAsPreset(scene, idx);}} className="p-1.5 hover:bg-white/10 rounded text-emerald-400 hover:text-emerald-300" title="Save Scene as Prompt Preset"><BookmarkPlus size={14}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); handleSaveScene(scene)}} className={`p-1.5 hover:bg-white/10 rounded ${isBookmarked ? 'text-yellow-400' : 'text-gray-400'}`} title="Bookmark Scene"><Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); jumpToScene(idx)}} className="p-1.5 hover:bg-white/10 rounded text-gray-400" title="Play"><Play size={14}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); handleRegenerateScene(idx)}} className="p-1.5 hover:bg-white/10 rounded text-gray-400" title="Regenerate"><RefreshCw size={14} className={sceneGenerationLoading[idx]?'animate-spin':''}/></button>
                                            <button onClick={(e)=>{e.stopPropagation(); handleDuplicateScene(idx)}} className="p-1.5 hover:bg-white/10 rounded text-gray-400" title="Duplicate"><CopyPlus size={14}/></button>
                                            {idx < storyboard.length - 1 && (
                                                <button 
                                                    onClick={(e)=>{e.stopPropagation(); handleMergeScenes(idx);}} 
                                                    className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-cyan-400 transition-colors" 
                                                    title={`Merge with Next Scene (#${idx + 2})`}
                                                >
                                                    <Merge size={14}/>
                                                </button>
                                            )}
                                            <button onClick={(e)=>{handleDeleteScene(e, idx)}} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400" title="Delete"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                     <div className="mb-4 bg-black/30 p-2.5 rounded-lg border border-white/5 group/summary">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5"><List size={12} className="text-blue-400"/> Scene Summary</label>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleGenerateSceneSummary(idx); }}
                                                disabled={generatingSummaryIdx === idx}
                                                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors disabled:opacity-40"
                                                title="Generate 1-sentence narrative and visual summary with AI"
                                            >
                                                {generatingSummaryIdx === idx ? <Loader2 size={10} className="animate-spin text-blue-400" /> : <Sparkles size={10} className="text-yellow-400" />}
                                                <span>{scene.description ? 'Regen Summary' : 'AI Summary'}</span>
                                            </button>
                                        </div>
                                        <textarea 
                                            value={scene.description || ''} 
                                            onChange={(e) => { const newSb = [...storyboard]; newSb[idx].description = e.target.value; setStoryboard(newSb); }} 
                                            onFocus={handleInputFocus} 
                                            onBlur={handleInputBlur} 
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full bg-transparent text-xs text-gray-200 outline-none resize-none placeholder-gray-600 focus:text-white leading-relaxed" 
                                            placeholder="A concise one-sentence visual & narrative beat summary..." 
                                            rows={2} 
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2 flex-wrap"> 
                                                    <label className="text-[10px] uppercase font-bold text-gray-500">Preview</label> 
                                                    {linkedRefs.map(ref => (
                                                        <span key={ref.id} className="flex items-center gap-1 text-[9px] bg-teal-900/30 text-teal-400 px-1.5 py-0.5 rounded border border-teal-500/20"> 
                                                            <Paperclip size={8}/> {ref.name} 
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2 flex-wrap items-center justify-end"> 
                                                    <div className="relative link-menu-container">
                                                        <button onClick={(e)=>{e.stopPropagation(); setActiveLinkMenu(activeLinkMenu === scene.id ? null : scene.id)}} className="text-[10px] text-teal-400 flex items-center gap-1"><LinkIcon size={10}/> Link Cast</button>
                                                        {activeLinkMenu === scene.id && (
                                                        <div className="absolute top-full right-0 mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50 p-2" onClick={e=>e.stopPropagation()}>
                                                            {visualRefs.length > 0 ? visualRefs.map(ref => (
                                                            <label key={ref.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/10 cursor-pointer text-xs">
                                                                <input type="checkbox" checked={scene.linkedRefIds?.includes(ref.id) || false} onChange={() => handleLinkRef(scene.id, ref.id)} className="accent-blue-500"/>
                                                                {ref.name}
                                                            </label>
                                                            )) : <div className="text-xs text-gray-500 p-2 text-center">No references yet.</div>}
                                                        </div>
                                                        )}
                                                    </div>
                                                     <button onClick={(e)=>{e.stopPropagation(); handleGenerateImage(idx, scene.imagePrompt)}} disabled={imageGenerationLoading[idx] || scene.videoStatus === 'generating'} className="text-[10px] text-blue-400 flex items-center gap-1 disabled:opacity-50"> {imageGenerationLoading[idx] ? <Loader2 size={10} className="animate-spin" /> : <ImageIcon size={10}/>} Gen Img</button> 
                                                    <button onClick={(e)=>{e.stopPropagation(); handleVideoAction(scene.id, getEffectiveVideoPrompt(scene))}} disabled={scene.videoStatus === 'generating'} className="text-[10px] text-green-400 flex items-center gap-1 disabled:opacity-50">
                                                      {scene.videoStatus === 'generating' ? <Loader2 size={10} className="animate-spin"/> : videoProvider === 'google' ? <Film size={10}/> : <LinkIcon size={10}/>}
                                                      {videoProvider === 'google' ? 'Gen Vid' : 'Send To'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-1 h-full min-h-[16rem] bg-black/20 border border-white/5 rounded flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                                                {audioIntensityData && (
                                                    <div className="absolute top-0 left-0 right-0 h-16 opacity-30 flex items-end px-1 gap-[1px]">
                                                        {audioIntensityData.slice(
                                                            Math.floor((((scene.startTime || '0').split(':').reduce((acc, time) => 60 * acc + +time, 0))) * 10), 
                                                            Math.floor((((scene.endTime || '0').split(':').reduce((acc, time) => 60 * acc + +time, 0))) * 10)
                                                        ).map((v, i) => (
                                                            <div key={i} style={{ height: `${(v / 255) * 100}%` }} className="flex-1 bg-blue-500" />
                                                        ))}
                                                    </div>
                                                )}
                                                {scene.videoStatus === 'generating' ? (
                                                    <VideoGenerationStatus state={videoState} />
                                                ) : scene.videoStatus === 'completed' && scene.videoUrl ? (
                                                    <div className="w-full h-full relative group/video">
                                                        <video src={scene.videoUrl} className="w-full h-full object-contain" autoPlay loop muted playsInline />
                                                        <a href={scene.videoUrl} download={`scene_${idx+1}.mp4`} className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover/video:opacity-100 transition-opacity"><Download size={16}/></a>
                                                    </div>
                                                ) : scene.videoStatus === 'error' ? (
                                                    <div className="p-4 text-center">
                                                        <AlertTriangle size={24} className="text-red-400 mx-auto mb-2"/>
                                                        <p className="text-xs text-red-300 font-bold">Video Generation Failed</p>
                                                        <p className="text-[10px] text-gray-400 mt-1">{videoGenerationState[scene.id]?.error}</p>
                                                    </div>
                                                ) : imageGenerationLoading[idx] ? (
                                                    <>
                                                        <Loader2 size={24} className="animate-spin text-blue-400" />
                                                        <span className="text-xs text-gray-500">Generating image...</span>
                                                    </>
                                                ) : scene.generatedImage ? (
                                                    <img src={scene.generatedImage} className="w-full h-full object-contain" alt={`Generated preview for scene ${idx + 1}`} />
                                                ) : (
                                                    <>
                                                        <ImageIcon size={24} className="text-gray-600"/>
                                                        <button onClick={(e)=>{e.stopPropagation(); handleGenerateImage(idx, scene.imagePrompt)}} className="px-3 py-1.5 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30 rounded text-[10px] font-bold text-blue-300 transition-colors uppercase">
                                                            Generate Preview Image
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                                <Wand2 size={14} className="text-purple-400" />
                                                <span>Prompt Tuning, Camera & Transitions</span>
                                            </div>
                                            <div className="pl-6 space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                                                                <Video size={10} className="text-cyan-400" /> Camera Movement
                                                            </label>
                                                            {scene.cameraMovement && scene.cameraMovement !== 'none' && (
                                                                <span className="text-[8px] font-mono text-cyan-400 bg-cyan-950/60 px-1 rounded">Active</span>
                                                            )}
                                                        </div>
                                                        <select 
                                                            value={scene.cameraMovement || 'none'} 
                                                            onChange={(e) => handleCameraMovementChange(idx, e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-gray-300 outline-none focus:border-cyan-500/50 hover:border-white/20 transition-colors"
                                                        >
                                                            <option value="none">Auto / Unspecified</option>
                                                            <optgroup label="Dolly & Push">
                                                                <option value="Dolly In">Dolly In (Push In)</option>
                                                                <option value="Dolly Out">Dolly Out (Pull Out)</option>
                                                            </optgroup>
                                                            <optgroup label="Pan & Tilt">
                                                                <option value="Pan Left">Pan Left</option>
                                                                <option value="Pan Right">Pan Right</option>
                                                                <option value="Tilt Up">Tilt Up</option>
                                                                <option value="Tilt Down">Tilt Down</option>
                                                            </optgroup>
                                                            <optgroup label="Crane & Pedestal">
                                                                <option value="Crane Up">Crane Up (Jib Ascend)</option>
                                                                <option value="Crane Down">Crane Down (Jib Descend)</option>
                                                            </optgroup>
                                                            <optgroup label="Tracking & Orbit">
                                                                <option value="Tracking Left">Tracking Shot Left</option>
                                                                <option value="Tracking Right">Tracking Shot Right</option>
                                                                <option value="360-Degree Arc">360° Arc / Orbit</option>
                                                            </optgroup>
                                                            <optgroup label="Dynamic & Lens">
                                                                <option value="Dolly Zoom">Dolly Zoom (Vertigo)</option>
                                                                <option value="Whip Pan">Whip Pan</option>
                                                                <option value="Dynamic Handheld">Dynamic Handheld</option>
                                                                <option value="FPV Drone Flythrough">FPV Drone Flythrough</option>
                                                                <option value="Zoom In">Zoom In</option>
                                                                <option value="Zoom Out">Zoom Out</option>
                                                                <option value="Static Lock-Off">Static Lock-Off</option>
                                                            </optgroup>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Transition In</label>
                                                        <select 
                                                            value={scene.transitionIn || 'none'} 
                                                            onChange={(e) => { const newSb = [...storyboard!]; newSb[idx].transitionIn = e.target.value; setStoryboard(newSb); }}
                                                            className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-gray-300 outline-none focus:border-white/30"
                                                        >
                                                            <option value="none">None</option>
                                                            <option value="fade">Fade</option>
                                                            <option value="slide-left">Slide Left</option>
                                                            <option value="slide-right">Slide Right</option>
                                                            <option value="zoom-in">Zoom In</option>
                                                            <option value="dissolve">Dissolve</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Transition Out</label>
                                                        <select 
                                                            value={scene.transitionOut || 'none'} 
                                                            onChange={(e) => { const newSb = [...storyboard!]; newSb[idx].transitionOut = e.target.value; setStoryboard(newSb); }}
                                                            className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-xs text-gray-300 outline-none focus:border-white/30"
                                                        >
                                                            <option value="none">None</option>
                                                            <option value="fade">Fade</option>
                                                            <option value="slide-left">Slide Left</option>
                                                            <option value="slide-right">Slide Right</option>
                                                            <option value="zoom-out">Zoom Out</option>
                                                            <option value="dissolve">Dissolve</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                      <label className="text-[10px] uppercase font-bold text-gray-500">Image Prompt</label>
                                                      <button onClick={(e) => {e.stopPropagation(); handleRegeneratePromptPart(idx, 'imagePrompt')}} title="Regenerate Image Prompt" className="text-gray-500 hover:text-purple-400">
                                                          {promptPartLoading[`${idx}-imagePrompt`] ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                                                      </button>
                                                      <div className="flex items-center gap-1 ml-auto">
                                                        <button 
                                                          onClick={(e) => { e.stopPropagation(); setColorGradeFocusSceneIndex(idx); setShowColorGradeModal(true); }} 
                                                          title="Analyze & Apply Color Grading / LUT Filter for this Scene"
                                                          className="text-gray-400 hover:text-purple-300 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded hover:bg-purple-950/40 border border-transparent hover:border-purple-500/30 transition-colors font-medium"
                                                        >
                                                          <Palette size={10} className="text-purple-400" />
                                                          <span>Color Grade</span>
                                                        </button>
                                                        <button 
                                                          onClick={(e) => { e.stopPropagation(); setStoryboard(prev => prev ? prev.map((s, i) => i === idx ? { ...s, isSelected: true } : s) : null); setShowStyleRefinerModal(true); }} 
                                                          title="Refine Image Prompt with AI Style Refiner"
                                                          className="text-gray-400 hover:text-amber-300 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded hover:bg-amber-950/40 border border-transparent hover:border-amber-500/30 transition-colors font-medium"
                                                        >
                                                          <Sparkles size={10} className="text-amber-400" />
                                                          <span>Style Refiner</span>
                                                        </button>
                                                        <button 
                                                          onClick={(e) => { e.stopPropagation(); setContrastBoosterFocusSceneIndex(idx); setStoryboard(prev => prev ? prev.map((s, i) => i === idx ? { ...s, isSelected: true } : s) : null); setShowContrastBoosterModal(true); }} 
                                                          title="Boost Contrast & Depth for this Scene with AI Contrast Booster"
                                                          className="text-gray-400 hover:text-indigo-300 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded hover:bg-indigo-950/40 border border-transparent hover:border-indigo-500/30 transition-colors font-medium"
                                                        >
                                                          <Contrast size={10} className="text-indigo-400" />
                                                          <span>Contrast Boost</span>
                                                        </button>
                                                      </div>
                                                    </div>
                                                    <textarea value={scene.imagePrompt} onChange={(e) => { const newSb = [...storyboard]; newSb[idx].imagePrompt = e.target.value; setStoryboard(newSb); }} onFocus={handleInputFocus} onBlur={handleInputBlur} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-gray-300 h-24 resize-y outline-none focus:border-white/30 custom-scrollbar" />
                                                </div>
                                                {['Subtle', 'Dynamic', 'Stylistic'].map((type, vIdx) => (
                                                    <div key={type} className="relative group/input remix-menu-container">
                                                         <div className="flex items-center gap-2 mb-1">
                                                            <label className="text-[10px] uppercase font-bold text-gray-500">{type}</label>
                                                            <button onClick={(e) => {e.stopPropagation(); handleRegeneratePromptPart(idx, `videoPrompt${vIdx}` as any)}} title={`Regenerate ${type} Prompt`} className="text-gray-500 hover:text-purple-400">
                                                                {promptPartLoading[`${idx}-videoPrompt${vIdx}`] ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                                                            </button>
                                                            <button onClick={(e)=>{e.stopPropagation(); setActiveRemixMenu(activeRemixMenu?.sceneIdx === idx && activeRemixMenu?.promptIdx === vIdx ? null : {sceneIdx: idx, promptIdx: vIdx})}} className={`p-1 rounded ${activeRemixMenu?.sceneIdx === idx && activeRemixMenu?.promptIdx === vIdx ? 'text-purple-400' : 'text-gray-600'}`} title="Remix with Technique"> <Wand2 size={10}/> </button>
                                                        </div>
                                                        <textarea value={scene.videoPrompts[vIdx] || ''} onChange={(e)=>{const n=[...storyboard]; if(!n[idx].videoPrompts) n[idx].videoPrompts = []; n[idx].videoPrompts[vIdx]=e.target.value; setStoryboard(n);}} onFocus={handleInputFocus} onBlur={handleInputBlur} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-gray-300 outline-none focus:border-white/30 resize-y min-h-[60px]" rows={2} />
                                                        {activeRemixMenu?.sceneIdx === idx && activeRemixMenu?.promptIdx === vIdx && ( <div className="absolute top-full right-0 mt-1 w-64 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50" onClick={e=>e.stopPropagation()}> <div className="max-h-60 overflow-y-auto custom-scrollbar"> {Object.entries(VARIATION_OPTIONS).map(([category, options]) => ( <div key={category}> <div className="px-3 py-2 bg-black/40 text-[9px] font-bold text-gray-500 uppercase">{category}</div> {(options as string[]).map(opt => ( <button key={opt} onClick={() => handleRemixVideo(idx, vIdx, opt)} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-purple-900/20"> {opt} </button> ))} </div> ))} </div> </div> )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <SmartPromptSuggestions
                                        scene={scene}
                                        sceneIndex={idx}
                                        onUpdateScene={(updatedScene) => {
                                            const newSb = [...storyboard!];
                                            newSb[idx] = updatedScene;
                                            setStoryboard(newSb);
                                        }}
                                        onRequestAISuggestions={handleGenerateSmartSuggestions}
                                        isAiGenerating={aiSuggestionLoading[idx]}
                                        customAiTags={aiSmartSuggestions[idx]}
                                    />
                                    <div className="mt-3 bg-black/20 rounded p-2 border border-white/5"> <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-2"> <Edit3 size={10} /> Notes </label> <textarea value={scene.notes || ''} onChange={(e) => { const newSb = [...storyboard]; newSb[idx].notes = e.target.value; setStoryboard(newSb); }} onFocus={handleInputFocus} onBlur={handleInputBlur} className="w-full bg-transparent text-xs text-gray-300 h-10 resize-y outline-none" placeholder="Add technical notes..." /> </div>
                                     {scene.isVoiceoverEnabled && (
                                         <div className="mt-3 bg-amber-950/20 p-3 rounded-lg border border-amber-500/30 space-y-2 transition-all" onClick={e=>e.stopPropagation()}>
                                             <div className="flex items-center justify-between">
                                                 <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                                                     <Volume2 size={14} className="text-amber-400" />
                                                     <span>Voiceover / Narration (V.O.)</span>
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                     <span className="text-[9px] font-medium text-amber-400/80 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/20">
                                                         Screenplay Script Included
                                                     </span>
                                                     <button 
                                                         onClick={(e) => {
                                                             e.stopPropagation();
                                                             const newSb = [...storyboard!];
                                                             newSb[idx].voiceoverText = `NARRATOR (V.O.): As the music builds, the story unfolds across the scene...`;
                                                             setStoryboard(newSb);
                                                         }}
                                                         className="text-[9px] px-2 py-0.5 bg-amber-900/40 hover:bg-amber-900/70 text-amber-200 border border-amber-500/30 rounded font-medium transition-colors"
                                                         title="Insert Sample Voiceover Format"
                                                     >
                                                         + Template
                                                     </button>
                                                 </div>
                                             </div>
                                             <textarea 
                                                 value={scene.voiceoverText || ''} 
                                                 onChange={(e) => { 
                                                     const newSb = [...storyboard!]; 
                                                     newSb[idx].voiceoverText = e.target.value; 
                                                     setStoryboard(newSb); 
                                                 }} 
                                                 onFocus={handleInputFocus} 
                                                 onBlur={handleInputBlur} 
                                                 className="w-full bg-black/40 border border-amber-500/30 rounded p-2.5 text-xs text-amber-100 placeholder-amber-400/30 outline-none focus:border-amber-400/60 resize-y min-h-[55px] custom-scrollbar" 
                                                 placeholder="Enter spoken narration or voiceover dialogue for this scene (e.g. NARRATOR (V.O.): We never realized the storm was already upon us...)" 
                                                 rows={2}
                                             />
                                             <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                                 <span className="text-gray-400 font-semibold">Quick Tags:</span>
                                                 <button 
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         const newSb = [...storyboard!];
                                                         const current = newSb[idx].voiceoverText || '';
                                                         newSb[idx].voiceoverText = current ? `NARRATOR (V.O.)\n${current}` : `NARRATOR (V.O.)\n`;
                                                         setStoryboard(newSb);
                                                     }} 
                                                     className="px-2 py-0.5 bg-black/40 hover:bg-amber-900/30 border border-amber-500/20 text-amber-300 rounded font-medium"
                                                 >
                                                     + NARRATOR (V.O.)
                                                 </button>
                                                 <button 
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         const newSb = [...storyboard!];
                                                         const current = newSb[idx].voiceoverText || '';
                                                         newSb[idx].voiceoverText = current ? `${current} (whispering)` : `(whispering) `;
                                                         setStoryboard(newSb);
                                                     }} 
                                                     className="px-2 py-0.5 bg-black/40 hover:bg-amber-900/30 border border-amber-500/20 text-amber-300 rounded font-medium"
                                                 >
                                                     + (whispering)
                                                 </button>
                                                 <button 
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         const newSb = [...storyboard!];
                                                         const current = newSb[idx].voiceoverText || '';
                                                         newSb[idx].voiceoverText = current ? `${current} [beat]` : `[beat] `;
                                                         setStoryboard(newSb);
                                                     }} 
                                                     className="px-2 py-0.5 bg-black/40 hover:bg-amber-900/30 border border-amber-500/20 text-amber-300 rounded font-medium"
                                                 >
                                                     + [beat]
                                                 </button>
                                             </div>
                                         </div>
                                     )}
                                     {scene.isLipSyncEnabled && (
                                         <div className="mt-3 bg-pink-950/20 p-3 rounded-lg border border-pink-500/30 space-y-2" onClick={e=>e.stopPropagation()}>
                                             <div className="flex items-center justify-between">
                                                 <div className="flex items-center gap-1.5 text-xs font-bold text-pink-300">
                                                     <Mic size={14} className="text-pink-400" />
                                                     <span>Wav2Lip Performance Prompt</span>
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                     <button 
                                                         onClick={(e) => {
                                                             e.stopPropagation();
                                                             const newSb = [...storyboard!];
                                                             newSb[idx].soraPrompt = newSb[idx].lipSyncPrompt || '';
                                                             setStoryboard(newSb);
                                                         }}
                                                         className="text-[9px] px-2 py-0.5 bg-pink-900/50 hover:bg-pink-900/80 text-pink-200 border border-pink-500/40 rounded font-bold uppercase transition-colors"
                                                         title="Apply Wav2Lip Prompt as Master Sora/Video Prompt"
                                                     >
                                                         Apply to Sora
                                                     </button>
                                                     <button 
                                                         onClick={(e) => {
                                                             e.stopPropagation();
                                                             const linkedRefs = visualRefs.filter(ref => scene.linkedRefIds?.includes(ref.id));
                                                             const charName = linkedRefs.length > 0 ? linkedRefs[0].name : undefined;
                                                             const newSb = [...storyboard!];
                                                             newSb[idx].lipSyncPrompt = generateWav2LipPrompt(scene, charName);
                                                             setStoryboard(newSb);
                                                         }}
                                                         className="text-gray-400 hover:text-pink-300 p-1"
                                                         title="Reset/Regenerate Wav2Lip Prompt"
                                                     >
                                                         <RefreshCw size={12} />
                                                     </button>
                                                 </div>
                                             </div>
                                             <textarea 
                                                 value={scene.lipSyncPrompt || ''} 
                                                 onChange={(e) => { 
                                                     const newSb = [...storyboard!]; 
                                                     newSb[idx].lipSyncPrompt = e.target.value; 
                                                     setStoryboard(newSb); 
                                                 }} 
                                                 onFocus={handleInputFocus} 
                                                 onBlur={handleInputBlur} 
                                                 className="w-full bg-black/50 border border-pink-500/30 rounded p-2 text-xs text-pink-100 resize-y min-h-[65px] outline-none focus:border-pink-400 custom-scrollbar" 
                                                 placeholder="Specialized Wav2Lip model video prompt..." 
                                             />
                                             <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                                 <span className="text-gray-400 font-semibold">Modifiers:</span>
                                                 <button 
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         const newSb = [...storyboard!];
                                                         newSb[idx].lipSyncPrompt = (newSb[idx].lipSyncPrompt || '') + ' Chroma key green screen background, neutral background contrast, clean isolation.';
                                                         setStoryboard(newSb);
                                                     }} 
                                                     className="px-2 py-0.5 bg-black/40 hover:bg-pink-900/30 border border-pink-500/20 text-pink-300 rounded font-medium"
                                                 >
                                                     + Green Screen
                                                 </button>
                                                 <button 
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         const newSb = [...storyboard!];
                                                         newSb[idx].lipSyncPrompt = (newSb[idx].lipSyncPrompt || '') + ' Tight facial close-up, sharp jawline articulation, steady lock-on facial camera.';
                                                         setStoryboard(newSb);
                                                     }} 
                                                     className="px-2 py-0.5 bg-black/40 hover:bg-pink-900/30 border border-pink-500/20 text-pink-300 rounded font-medium"
                                                 >
                                                     + Tight Lip Tracking
                                                 </button>
                                                 <button 
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         const newSb = [...storyboard!];
                                                         newSb[idx].lipSyncPrompt = (newSb[idx].lipSyncPrompt || '') + ' Studio lighting, high contrast keypoints, front-facing 85mm portrait framing.';
                                                         setStoryboard(newSb);
                                                     }} 
                                                     className="px-2 py-0.5 bg-black/40 hover:bg-pink-900/30 border border-pink-500/20 text-pink-300 rounded font-medium"
                                                 >
                                                     + Studio Portrait
                                                 </button>
                                             </div>
                                         </div>
                                     )}
                                </div>
                            )}
                            {idx < storyboard.length - 1 && !isCollapsed && (
                                <div className="flex items-center justify-center -my-2 group/connector relative h-5 z-10">
                                    <div className="w-full h-px bg-white/5 group-hover/connector:bg-cyan-500/40 transition-colors" />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMergeScenes(idx);
                                        }}
                                        className="absolute opacity-0 group-hover/connector:opacity-100 hover:scale-105 bg-black/95 hover:bg-cyan-950/90 border border-white/20 hover:border-cyan-500/60 text-gray-400 hover:text-cyan-300 text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xl transition-all font-mono whitespace-nowrap"
                                        title={`Merge Scene ${idx + 1} & Scene ${idx + 2} into one scene`}
                                    >
                                        <Merge size={11} className="text-cyan-400" />
                                        <span>Merge Scenes {idx + 1} & {idx + 2}</span>
                                    </button>
                                </div>
                            )}
                            </React.Fragment>
                            );
                        })}
                            </>
                        )}
                    </div>
                )}

                {!storyboard && ( <div className="flex-1 flex flex-col items-center justify-center border border-white/10 rounded-xl p-10 bg-[#121212] text-center min-h-[400px]"> <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center mb-6 shadow-2xl border border-white/5"> <Clapperboard size={48} className="text-gray-400"/> </div> <h2 className="text-3xl brand-font font-bold text-white mb-3">Welcome to AudioArc</h2> <p className="text-gray-400 max-w-md mb-8 text-sm"> Start by entering lyrics and a narrative on the left. Use tags like [Intro] or [SFX] to guide the AI Director through complex song structures. </p> <div className="grid grid-cols-3 gap-6 text-xs text-gray-500 font-mono uppercase"> <div className="flex flex-col items-center gap-2"> <div className="p-3 bg-white/5 rounded-full text-green-400"><Music size={16}/></div> Audio Sync </div> <div className="flex flex-col items-center gap-2"> <div className="p-3 bg-white/5 rounded-full text-orange-400"><Video size={16}/></div> Video Prompts </div> <div className="flex flex-col items-center gap-2"> <div className="p-3 bg-white/5 rounded-full text-purple-400"><Sparkles size={16}/></div> AI Vision </div> </div> </div> )}
            </div>

        </main>
        
        {/* FOOTER */}
        <footer className="bg-[#050505] border-t border-white/5 py-16 px-12 mt-20 relative z-10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center"><Clapperboard size={18} className="text-white"/></div>
                        <span className="text-xl font-bold brand-font tracking-widest text-white uppercase">AudioArc</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">The professional AI filmmaking suite for music video directors and cinematic visionaries.</p>
                    <div className="flex gap-4">
                        <a href="#" className="text-gray-600 hover:text-cyan-400 transition-colors"><Share2 size={16}/></a>
                        <a href="#" className="text-gray-600 hover:text-cyan-400 transition-colors"><MonitorPlay size={16}/></a>
                        <a href="#" className="text-gray-600 hover:text-cyan-400 transition-colors"><Sparkles size={16}/></a>
                    </div>
                </div>
                
                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">AI Ecosystem</h4>
                    <ul className="space-y-3 text-xs text-gray-600">
                        <li><a href="https://runwayml.com" target="_blank" className="hover:text-cyan-400 transition-colors">Runway Gen-3 Alpha</a></li>
                        <li><a href="https://lumalabs.ai/dream-machine" target="_blank" className="hover:text-cyan-400 transition-colors">Luma Dream Machine</a></li>
                        <li><a href="https://klingai.com" target="_blank" className="hover:text-cyan-400 transition-colors">Kling AI</a></li>
                        <li><a href="https://openai.com/sora" target="_blank" className="hover:text-cyan-400 transition-colors">OpenAI Sora</a></li>
                        <li><a href="https://perchance.org/aa-wunderbar" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors flex items-center gap-1"><span className="text-cyan-400 font-medium">Wunderbar!</span> (Perchance AI)<ExternalLink size={10} className="text-gray-500 shrink-0"/></a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Resources</h4>
                    <ul className="space-y-3 text-xs text-gray-600">
                        <li><button onClick={() => setShowManual(true)} className="hover:text-cyan-400 transition-colors">User Manual</button></li>
                        <li><button onClick={() => setShowResources(true)} className="hover:text-cyan-400 transition-colors">Free AI Tools</button></li>
                        <li><a href="https://comfyanonymous.github.io/ComfyUI/" target="_blank" className="hover:text-cyan-400 transition-colors">ComfyUI Guide</a></li>
                        <li><a href="https://civitai.com" target="_blank" className="hover:text-cyan-400 transition-colors">Civitai Models</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">System Status</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-600">Gemini API</span>
                            <span className="text-green-500 font-bold uppercase tracking-tighter">Operational</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-600">Video Pipeline</span>
                            <span className="text-green-500 font-bold uppercase tracking-tighter">Operational</span>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                            <p className="text-[9px] text-gray-700 font-mono">v1.2.4-stable • Build 2026.02.24</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/5">
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-[10px] tracking-widest opacity-50">Free Image Generators</h4>
                    <div className="flex flex-col gap-2">
                        <a href="https://perchance.org/ai-text-to-image-generator" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 text-xs transition-colors">Perchance</a>
                        <a href="https://pollinations.ai/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 text-xs transition-colors">Pollinations.ai</a>
                        <a href="https://www.bing.com/images/create" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 text-xs transition-colors">Bing Image Creator</a>
                        <a href="https://deepai.org/machine-learning-model/text2img" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 text-xs transition-colors">DeepAI Text2Img</a>
                        <a href="https://tensor.art/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 text-xs transition-colors">Tensor.art</a>
                    </div>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-[10px] tracking-widest opacity-50">Video AI Tools</h4>
                    <div className="flex flex-col gap-2">
                        <a href="https://grok.x.ai/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-orange-400 text-xs transition-colors flex items-center gap-2">Grok <span className="text-[9px] bg-green-900/40 text-green-400 px-1 rounded">Free Beta</span></a>
                        <a href="https://digen.ai/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-orange-400 text-xs transition-colors">Digen.ai</a>
                        <a href="https://runwayml.com/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-orange-400 text-xs transition-colors">Runway Gen-2/3</a>
                        <a href="https://kling.kuaishou.com/en" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-orange-400 text-xs transition-colors">Kling AI</a>
                        <a href="https://lumalabs.ai/dream-machine" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-orange-400 text-xs transition-colors">Luma Dream Machine</a>
                    </div>
                </div>
                <div>
                     <h4 className="text-white font-bold mb-4 uppercase text-[10px] tracking-widest opacity-50">Editors (FOSS & Free)</h4>
                     <div className="flex flex-col gap-2">
                        <a href="https://kdenlive.org/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-400 text-xs transition-colors">Kdenlive (Open Source)</a>
                        <a href="https://www.openshot.org/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-400 text-xs transition-colors">OpenShot (Open Source)</a>
                        <a href="https://shotcut.org/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-400 text-xs transition-colors">Shotcut (Open Source)</a>
                        <a href="https://www.blackmagicdesign.com/products/davinciresolve" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-400 text-xs transition-colors">DaVinci Resolve</a>
                        <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-purple-400 text-xs transition-colors">Canva (Web)</a>
                     </div>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-[10px] tracking-widest opacity-50">Support & Community</h4>
                     <div className="flex flex-col gap-3">
                        <a 
                          href="https://buymeacoffee.com/magicstatic" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-yellow-500 text-[10px] font-bold transition-all"
                        >
                          <Coffee size={14} />
                          Buy me a coffee
                        </a>
                        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                            <a href="https://fmhy.net/ai" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-400 text-xs transition-colors font-bold">FMHY Master AI List</a>
                            <a href="https://github.com/eudk/awesome-ai-tools" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-400 text-xs transition-colors">Awesome AI Tools (GitHub)</a>
                            <a href="https://www.aixploria.com/en/ultimate-list-ai/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-400 text-xs transition-colors">AIxploria</a>
                            <a href="https://www.futurepedia.io/ai-tools" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-400 text-xs transition-colors">Futurepedia</a>
                            <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 text-xs transition-colors">Google AI Studio</a>
                        </div>
                     </div>
                </div>
            </div>
        </footer>
      </div>
      
      {notification && (
        <div className="fixed bottom-6 right-6 z-[101] bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4">
            {notification}
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 lg:p-12 animate-in fade-in" onClick={() => setShowSettings(false)}>
            <div className="bg-[#121212] border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Settings size={18}/> Settings</h3>
                    <button onClick={() => setShowSettings(false)}><X size={20}/></button>
                </div>
                <div className="flex border-b border-white/10">
                    <button onClick={()=>setSettingsTab('config')} className={`flex-1 p-3 text-sm font-bold flex items-center justify-center gap-1.5 ${settingsTab === 'config' ? 'bg-white/5 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:bg-white/5'}`}>
                      <SlidersHorizontal size={14}/> Configuration
                    </button>
                    <button onClick={()=>setSettingsTab('billing')} className={`flex-1 p-3 text-sm font-bold flex items-center justify-center gap-1.5 ${settingsTab === 'billing' ? 'bg-white/5 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:bg-white/5'}`}>
                      <Key size={14}/> API Keys & Credentials
                      {provider === 'gemini' && apiKeyStatus === 'not_found' && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-1" />
                      )}
                    </button>
                    <button onClick={()=>setSettingsTab('guide')} className={`flex-1 p-3 text-sm font-bold flex items-center justify-center gap-1.5 ${settingsTab === 'guide' ? 'bg-white/5 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:bg-white/5'}`}>
                      <BookOpen size={14}/> Connection Guides
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {settingsTab === 'config' ? (
                        <div className="space-y-6">
                            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10">
                                <h4 className="font-bold text-gray-200 mb-3 text-sm flex items-center gap-2"><Terminal size={14}/> Prompt Generation AI</h4>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                                    <button onClick={()=>setProvider('gemini')} className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${provider === 'gemini' ? 'bg-blue-900/40 border-blue-500/50 text-blue-300' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}><Sparkles size={12}/> Gemini</button>
                                    <button onClick={()=>setProvider('openai')} className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${provider === 'openai' ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}><Bot size={12}/> OpenAI</button>
                                    <button onClick={()=>setProvider('ollama')} className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${provider === 'ollama' ? 'bg-orange-900/40 border-orange-500/50 text-orange-300' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}><MonitorIcon size={12}/> Ollama</button>
                                    <button onClick={()=>setProvider('lmstudio')} className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${provider === 'lmstudio' ? 'bg-purple-900/40 border-purple-500/50 text-purple-300' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}><Cpu size={12}/> LM Studio</button>
                                    <button onClick={()=>setProvider('openrouter')} className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${provider === 'openrouter' ? 'bg-green-900/40 border-green-500/50 text-green-300' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}><Cloud size={12}/> OpenRouter</button>
                                    <button onClick={()=>setProvider('pollinations')} className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${provider === 'pollinations' ? 'bg-pink-900/40 border-pink-500/50 text-pink-300' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}><Zap size={12}/> Pollinations</button>
                                </div>
                                
                                {provider === 'gemini' && (
                                  <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-gray-400">Gemini API Key</label>
                                            <a 
                                                href="https://aistudio.google.com/app/apikey" 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
                                            >
                                                Get free Gemini API Key <ExternalLink size={10}/>
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1 flex items-center">
                                                <input 
                                                    type={showGeminiKeySecret ? "text" : "password"} 
                                                    placeholder="Paste AIzaSy... API key here (persisted in browser)" 
                                                    value={geminiApiKey} 
                                                    onChange={e => handleUpdateGeminiKey(e.target.value)} 
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-white/30 transition-colors pr-10 font-mono text-gray-200"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowGeminiKeySecret(!showGeminiKeySecret)} 
                                                    className="absolute right-2 p-1 text-gray-400 hover:text-gray-200" 
                                                    title={showGeminiKeySecret ? "Hide API Key" : "Show API Key"}
                                                >
                                                    {showGeminiKeySecret ? <EyeOff size={14}/> : <Eye size={14}/>}
                                                </button>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => handleTestConnection('gemini')}
                                                disabled={testStatuses.gemini === 'testing'}
                                                className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
                                                    testStatuses.gemini === 'testing'
                                                        ? 'bg-blue-600/50 text-blue-200 cursor-wait'
                                                        : testStatuses.gemini === 'ok'
                                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                                        : testStatuses.gemini === 'error'
                                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
                                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                                                }`}
                                                title="Perform a small non-destructive API ping to verify this Gemini key"
                                            >
                                                {testStatuses.gemini === 'testing' ? (
                                                    <><Loader2 size={13} className="animate-spin"/> Testing...</>
                                                ) : testStatuses.gemini === 'ok' ? (
                                                    <><Check size={13}/> Valid Key</>
                                                ) : testStatuses.gemini === 'error' ? (
                                                    <><X size={13}/> Test Failed</>
                                                ) : (
                                                    <><Zap size={13}/> Test Key</>
                                                )}
                                            </button>
                                        </div>
                                        {testStatuses.gemini === 'ok' && (
                                            <p className="text-emerald-400 text-xs mt-1.5 flex items-center gap-1 font-medium animate-in fade-in">
                                                <Check size={13} className="shrink-0 text-emerald-400"/> Key verified successfully! Gemini API is responding.
                                            </p>
                                        )}
                                        {testStatuses.gemini === 'error' && connectionError && (
                                            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5 bg-red-900/30 p-2 rounded border border-red-500/30 leading-tight animate-in fade-in">
                                                <AlertTriangle size={13} className="shrink-0 text-red-400"/> {connectionError}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[11px] text-gray-500">
                                                Required when deployed to Vercel, Netlify, or running standalone.
                                            </span>
                                            {geminiApiKey && (
                                                <button 
                                                    onClick={() => handleUpdateGeminiKey('')} 
                                                    className="text-[11px] text-gray-400 hover:text-red-400 transition-colors"
                                                >
                                                    Clear Key
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-gray-400">Main Model (for Storyboard & Script)</label>
                                                <span className="text-[10px] text-blue-400 font-semibold">Gemini 3 Series</span>
                                            </div>
                                            <select value={geminiMainModel} onChange={e=>setGeminiMainModel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors">
                                                {AI_MODELS.main.map(m => (
                                                    <option key={m} value={m}>{AI_MODEL_LABELS[m] || m}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-gray-400">Utility Model (for Analysis & Scene Splitting)</label>
                                            <span className="text-[10px] text-emerald-400 font-semibold">Cost-Effective</span>
                                        </div>
                                        <select value={geminiUtilityModel} onChange={e=>setGeminiUtilityModel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors">
                                            {AI_MODELS.utility.map(m => (
                                                <option key={m} value={m}>{AI_MODEL_LABELS[m] || m}</option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-gray-500 mt-1.5">
                                            💡 Use <strong>gemini-3.1-flash-lite</strong> for rapid, lowest-cost background analysis, or <strong>gemini-3.8-flash</strong> for standard speed.
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-[11px] text-gray-500">Google Gemini API via official SDK.</span>
                                        <button onClick={() => handleTestConnection('gemini')} className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10" disabled={testStatuses.gemini === 'testing'}>
                                            {testStatuses.gemini === 'testing' ? <><Loader2 size={12} className="animate-spin"/> Testing...</> : testStatuses.gemini === 'ok' ? <><Check size={12} className="text-green-400"/> OK</> : testStatuses.gemini === 'error' ? <><X size={12} className="text-red-400"/> Failed</> : 'Test Connection'}
                                        </button>
                                    </div>
                                  </div>
                                )}
                                {provider === 'openai' && (
                                  <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">OpenAI API Key</label>
                                        <input type="password" placeholder="sk-..." value={openAIKey} onChange={e=>setOpenAIKey(e.target.value.trim().replace(/^Bearer\s+/i, ''))} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors"/>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">Base URL</label>
                                            <input type="text" placeholder="https://api.openai.com/v1" value={openAIBaseUrl} onChange={e=>setOpenAIBaseUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors"/>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-gray-400">Model</label>
                                                <button onClick={fetchOpenAIModels} className="text-[10px] text-emerald-400 hover:text-emerald-300">Fetch Models</button>
                                            </div>
                                            <div className="flex gap-2">
                                                <select value={availableOpenAIModels.includes(openAIModel) ? openAIModel : 'custom'} onChange={e => {
                                                    if (e.target.value !== 'custom') setOpenAIModel(e.target.value);
                                                }} className="bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors flex-1">
                                                    {availableOpenAIModels.map(m => <option key={m} value={m}>{m}</option>)}
                                                    <option value="custom">Custom...</option>
                                                </select>
                                                <input type="text" value={openAIModel} onChange={e=>setOpenAIModel(e.target.value)} placeholder="gpt-4o" className="bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors w-28"/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-[11px] text-gray-500">Compatible with OpenAI, Azure, or OpenAI-compatible proxies.</span>
                                        <button onClick={() => handleTestConnection('openai')} className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10" disabled={testStatuses.openai === 'testing' || !openAIKey}>
                                            {testStatuses.openai === 'testing' ? <><Loader2 size={12} className="animate-spin"/> Testing...</> : testStatuses.openai === 'ok' ? <><Check size={12} className="text-green-400"/> OK</> : testStatuses.openai === 'error' ? <><X size={12} className="text-red-400"/> Failed</> : 'Test Connection'}
                                        </button>
                                    </div>
                                  </div>
                                )}
                                {provider === 'ollama' && (
                                  <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Ollama URL</label>
                                        <input type="text" value={ollamaUrl} onChange={e=>setOllamaUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors"/>
                                        <div className="flex gap-3 mt-1">
                                            <button onClick={() => setOllamaUrl('http://localhost:11434')} className="text-[10px] text-teal-400 hover:text-teal-300 underline">localhost:11434</button>
                                            <button onClick={() => setOllamaUrl('http://127.0.0.1:11434')} className="text-[10px] text-teal-400 hover:text-teal-300 underline">127.0.0.1:11434</button>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1"><label className="block text-xs font-bold text-gray-400 mb-1">Ollama Model</label><select value={ollamaModel} onChange={e=>setOllamaModel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors">{availableOllamaModels.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                                        <button onClick={fetchOllamaModels} className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title="Refresh Models"><RefreshCw size={16}/></button>
                                    </div>
                                     <div className="flex justify-end">
                                      <button onClick={() => handleTestConnection('ollama')} className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10" disabled={testStatuses.ollama === 'testing'}>
                                          {testStatuses.ollama === 'testing' ? <><Loader2 size={12} className="animate-spin"/> Testing...</> : testStatuses.ollama === 'ok' ? <><Check size={12} className="text-green-400"/> OK</> : testStatuses.ollama === 'error' ? <><X size={12} className="text-red-400"/> Failed</> : 'Test Connection'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {provider === 'lmstudio' && (
                                  <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-gray-400">LM Studio Server URL</label>
                                            <span className="text-[10px] text-purple-400 font-semibold">Offline / Local AI</span>
                                        </div>
                                        <input type="text" value={lmStudioUrl} onChange={e=>setLmStudioUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors"/>
                                        <div className="flex gap-3 mt-1">
                                            <button onClick={() => setLmStudioUrl('http://localhost:1234/v1')} className="text-[10px] text-purple-400 hover:text-purple-300 underline">localhost:1234/v1</button>
                                            <button onClick={() => setLmStudioUrl('http://127.0.0.1:1234/v1')} className="text-[10px] text-purple-400 hover:text-purple-300 underline">127.0.0.1:1234/v1</button>
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-400 mb-1">Loaded Model</label>
                                            {availableLmStudioModels.length > 0 ? (
                                                <select value={lmStudioModel} onChange={e=>setLmStudioModel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors">
                                                    {availableLmStudioModels.map(m=><option key={m} value={m}>{m}</option>)}
                                                </select>
                                            ) : (
                                                <input type="text" value={lmStudioModel} onChange={e=>setLmStudioModel(e.target.value)} placeholder="loaded-model or model identifier" className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors"/>
                                            )}
                                        </div>
                                        <button onClick={fetchLmStudioModels} disabled={loadingLmStudioModels} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Refresh LM Studio Models">
                                            {loadingLmStudioModels ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                                        </button>
                                    </div>
                                    <div className="bg-purple-950/20 border border-purple-800/30 rounded p-2.5 text-[11px] text-purple-300/80">
                                        💡 In LM Studio, go to the <strong>Developer / Local Server</strong> tab, start the server, and ensure <strong>CORS</strong> is enabled.
                                    </div>
                                    <div className="flex justify-end">
                                      <button onClick={() => handleTestConnection('lmstudio')} className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10" disabled={testStatuses.lmstudio === 'testing'}>
                                          {testStatuses.lmstudio === 'testing' ? <><Loader2 size={12} className="animate-spin"/> Testing...</> : testStatuses.lmstudio === 'ok' ? <><Check size={12} className="text-green-400"/> OK</> : testStatuses.lmstudio === 'error' ? <><X size={12} className="text-red-400"/> Failed</> : 'Test Connection'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {provider === 'pollinations' && (
                                  <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Pollinations URL</label>
                                        <input type="text" value={pollinationsUrl} onChange={e=>setPollinationsUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors"/>
                                        <div className="flex gap-3 mt-1">
                                            <button onClick={() => setPollinationsUrl('https://gen.pollinations.ai/v1')} className="text-[10px] text-pink-400 hover:text-pink-300 underline">gen.pollinations.ai/v1 (New)</button>
                                            <button onClick={() => setPollinationsUrl('https://text.pollinations.ai')} className="text-[10px] text-pink-400 hover:text-pink-300 underline">text.pollinations.ai (Legacy)</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">API Key (Optional)</label>
                                            <input type="password" placeholder="Optional key for higher limits" value={pollinationsApiKey} onChange={e=>setPollinationsApiKey(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors"/>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-bold text-gray-400">Model</label>
                                                <button onClick={fetchPollinationsModels} className="text-[10px] text-pink-400 hover:text-pink-300">Refresh</button>
                                            </div>
                                            <div className="flex gap-2">
                                                <select value={availablePollinationsModels.includes(pollinationsModel) ? pollinationsModel : 'custom'} onChange={e => {
                                                    if (e.target.value !== 'custom') setPollinationsModel(e.target.value);
                                                }} className="bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors flex-1">
                                                    {availablePollinationsModels.map(m => <option key={m} value={m}>{m}</option>)}
                                                    <option value="custom">Custom...</option>
                                                </select>
                                                <input type="text" value={pollinationsModel} onChange={e=>setPollinationsModel(e.target.value)} placeholder="openai" className="bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors w-28"/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-[11px] text-gray-500">Updated to modern Pollinations Gen API with multi-model support.</span>
                                        <button onClick={() => handleTestConnection('pollinations')} className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10" disabled={testStatuses.pollinations === 'testing'}>
                                            {testStatuses.pollinations === 'testing' ? <><Loader2 size={12} className="animate-spin"/> Testing...</> : testStatuses.pollinations === 'ok' ? <><Check size={12} className="text-green-400"/> OK</> : testStatuses.pollinations === 'error' ? <><X size={12} className="text-red-400"/> Failed</> : 'Test Connection'}
                                        </button>
                                    </div>
                                  </div>
                                )}
                                {provider === 'openrouter' && (
                                  <div className="space-y-4">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1"><label className="block text-xs font-bold text-gray-400 mb-1">OpenRouter API Key</label><input type="password" value={openRouterKey} onChange={e=>{
                                            const val = e.target.value.trim();
                                            setOpenRouterKey(val.replace(/^Bearer\s+/i, ''));
                                        }} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors"/></div>
                                        <button onClick={fetchOpenRouterModels} disabled={!openRouterKey || loadingOpenRouterModels} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold disabled:opacity-50">{loadingOpenRouterModels ? <Loader2 size={16} className="animate-spin"/> : "Load Models"}</button>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">OpenRouter Model</label>
                                        <input type="text" placeholder="Search or select a model from the list" value={openRouterModelSearch} onChange={e => setOpenRouterModelSearch(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-t p-2 text-sm outline-none focus:border-white/30 transition-colors" />
                                        <select value={openRouterModel} onChange={e => setOpenRouterModel(e.target.value)} size={6} className="w-full bg-black/40 border border-t-0 border-white/10 rounded-b p-2 text-sm outline-none focus:border-white/30 transition-colors custom-scrollbar">
                                            {filteredOpenRouterModels.length > 0 ? <>
                                            <optgroup label="Free Models">
                                                {freeModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </optgroup>
                                            <optgroup label="Paid Models">
                                                {paidModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </optgroup>
                                            </> : <option disabled>No models found or loaded.</option>}
                                        </select>
                                    </div>
                                     <div className="flex justify-end">
                                      <button onClick={() => handleTestConnection('openrouter')} className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10" disabled={testStatuses.openrouter === 'testing' || !openRouterKey}>
                                          {testStatuses.openrouter === 'testing' ? <><Loader2 size={12} className="animate-spin"/> Testing...</> : testStatuses.openrouter === 'ok' ? <><Check size={12} className="text-green-400"/> OK</> : testStatuses.openrouter === 'error' ? <><X size={12} className="text-red-400"/> Failed</> : 'Test Connection'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                            </div>
                            {connectionError && <p className="text-red-400 text-xs mt-2 text-center bg-red-900/20 p-2 rounded border border-red-500/30">{connectionError}</p>}
                            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10">
                                <h4 className="font-bold text-gray-200 mb-3 text-sm flex items-center gap-2"><ImageIcon size={14}/> Image Generation AI</h4>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <button onClick={()=>setImageProvider('google')} className={`px-4 py-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-2 ${imageProvider === 'google' ? 'bg-blue-900/40 border-blue-500/50 text-blue-300' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}><Sparkles size={14}/> Google AI</button>
                                    <button onClick={()=>setImageProvider('openrouter')} className={`px-4 py-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-2 ${imageProvider === 'openrouter' ? 'bg-green-900/40 border-green-500/50 text-green-300' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}><Cloud size={14}/> OpenRouter</button>
                                </div>
                                {imageProvider === 'google' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-2">Engine</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={()=>setImageEngine('gemini')} className={`px-4 py-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-2 ${imageEngine === 'gemini' ? 'bg-white/10 border-white/20' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}>Gemini</button>
                                                <button onClick={()=>setImageEngine('imagen')} className={`px-4 py-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-2 ${imageEngine === 'imagen' ? 'bg-white/10 border-white/20' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}>Imagen</button>
                                            </div>
                                        </div>
                                        {imageEngine === 'gemini' && (
                                            <div>
                                                <p className="text-xs text-gray-400 mt-1 mb-2">
                                                    Google's native multimodal image models (<strong>Nano Banana 2</strong>, <strong>Nano Banana 2 Lite</strong>, and <strong>Nano Banana Pro</strong>). Supports multimodal visual character continuity from your Cast list.
                                                </p>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-xs font-bold text-gray-400">Gemini Image Model (Nano Banana Series)</label>
                                                    <span className="text-[10px] text-yellow-400 font-semibold">🍌 Nano Banana</span>
                                                </div>
                                                <select value={geminiImageModel} onChange={e=>setGeminiImageModel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors">
                                                    {AI_MODELS.image.gemini.map(m => (
                                                        <option key={m} value={m}>{AI_MODEL_LABELS[m] || m}</option>
                                                    ))}
                                                </select>
                                                <div className="mt-2 text-[11px] text-gray-500 space-y-0.5">
                                                    <div>• <strong>Nano Banana 2</strong> (<code>gemini-3.1-flash-image</code>): High quality standard with 512px, 1K, 2K, 4K rendering.</div>
                                                    <div>• <strong>Nano Banana 2 Lite</strong> (<code>gemini-3.1-flash-lite-image</code>): Ultra-fast and economical image generation.</div>
                                                    <div>• <strong>Nano Banana Pro</strong> (<code>gemini-3-pro-image</code>): Highest visual fidelity & complex character reference alignment.</div>
                                                </div>
                                                
                                                <label className="block text-xs font-bold text-gray-400 mt-4 mb-2">Character Integration Level</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button onClick={()=>setImageIntegrationLevel('low')} className={`px-4 py-2 rounded-lg border text-xs font-bold transition-colors ${imageIntegrationLevel === 'low' ? 'bg-white/10 border-white/20' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}>Low</button>
                                                    <button onClick={()=>setImageIntegrationLevel('balanced')} className={`px-4 py-2 rounded-lg border text-xs font-bold transition-colors ${imageIntegrationLevel === 'balanced' ? 'bg-white/10 border-white/20' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}>Balanced</button>
                                                    <button onClick={()=>setImageIntegrationLevel('high')} className={`px-4 py-2 rounded-lg border text-xs font-bold transition-colors ${imageIntegrationLevel === 'high' ? 'bg-white/10 border-white/20' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}>High</button>
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-2">Controls how strictly the AI adheres to character appearance from reference images.</p>
                                            </div>
                                        )}
                                        {imageEngine === 'imagen' && (
                                            <div className="space-y-4">
                                                 <p className="text-xs text-gray-400 mt-1">Uses Google's dedicated Imagen models for photographic generation.</p>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 mb-1">Imagen Model</label>
                                                    <select value={imagenModel} onChange={e=>setImagenModel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors">
                                                        {AI_MODELS.image.imagen.map(m => (
                                                            <option key={m} value={m}>{AI_MODEL_LABELS[m] || m}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div><label className="block text-xs font-bold text-gray-400 mb-1">Image Format</label><select value={imageFormat} onChange={e=>setImageFormat(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-white/30 transition-colors"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {imageProvider === 'openrouter' && (
                                  <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">OpenRouter Image Model</label>
                                    <input type="text" placeholder="Search image models..." value={openRouterImageModelSearch} onChange={e => setOpenRouterImageModelSearch(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-t p-2 text-sm outline-none focus:border-white/30 transition-colors" />
                                    <select value={openRouterImageModel} onChange={e => setOpenRouterImageModel(e.target.value)} size={6} className="w-full bg-black/40 border border-t-0 border-white/10 rounded-b p-2 text-sm outline-none focus:border-white/30 transition-colors custom-scrollbar">
                                      {filteredOpenRouterImageModels.length > 0 ? filteredOpenRouterImageModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>) : <option disabled>No image models found.</option>}
                                    </select>
                                  </div>
                                )}
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10">
                                <h4 className="font-bold text-gray-200 mb-3 text-sm flex items-center gap-2"><VideoIcon size={14}/> Video Generation AI</h4>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <button onClick={()=>setVideoProvider('google')} className={`px-4 py-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-2 ${videoProvider === 'google' ? 'bg-blue-900/40 border-blue-500/50 text-blue-300' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}>Google Veo</button>
                                    <button onClick={()=>setVideoProvider('runway')} className={`px-4 py-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-2 ${videoProvider === 'runway' ? 'bg-purple-900/40 border-purple-500/50 text-purple-300' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}>Runway</button>
                                    <button onClick={()=>setVideoProvider('ltx')} className={`px-4 py-2 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-2 ${videoProvider === 'ltx' ? 'bg-pink-900/40 border-pink-500/50 text-pink-300' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}>LTX Studio</button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Select your preferred video generation service. 'Google Veo' is integrated directly. Other services will open in a new tab with the prompt copied to your clipboard.</p>
                            </div>

                            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10">
                                <h4 className="font-bold text-gray-200 mb-3 text-sm flex items-center gap-2"><Layers size={14}/> Audio Intelligence</h4>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2">Scene Splitting Sensitivity ({sceneSplitThreshold})</label>
                                    <input type="range" min="0" max="100" value={sceneSplitThreshold} onChange={e=>setSceneSplitThreshold(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                                </div>
                            </div>
                        </div>
                    ) : settingsTab === 'billing' ? (
                       <div className="space-y-6">
                            <h4 className="font-bold text-lg text-white">API Connection & Usage Metrics</h4>
                            
                            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10">
                                <h5 className="font-bold text-gray-200 mb-3 text-sm flex items-center gap-2"><Cpu size={16} className="text-amber-400"/> Session Token & API Usage Tracker</h5>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Session Tokens</p>
                                        <p className="text-2xl font-bold font-mono text-white mt-0.5">{totalTokenUsage.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">Total prompt & response tokens</p>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">API Requests</p>
                                        <p className="text-2xl font-bold font-mono text-blue-400 mt-0.5">{sessionApiRequests}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">Generation & utility calls</p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">Budget Usage</span>
                                        <span className="font-mono font-bold text-gray-300">
                                            {totalTokenUsage.toLocaleString()} / {sessionTokenBudget.toLocaleString()} ({Math.min(100, Math.round((totalTokenUsage / sessionTokenBudget) * 100))}%)
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className={`h-full transition-all duration-500 ${
                                                totalTokenUsage > sessionTokenBudget 
                                                    ? 'bg-red-500' 
                                                    : totalTokenUsage > sessionTokenBudget * 0.8 
                                                    ? 'bg-amber-500' 
                                                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                            }`} 
                                            style={{ width: `${Math.min(100, (totalTokenUsage / sessionTokenBudget) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-400">Budget Limit:</label>
                                        <select 
                                            value={sessionTokenBudget} 
                                            onChange={(e) => setSessionTokenBudget(Number(e.target.value))}
                                            className="bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 outline-none"
                                        >
                                            <option value={25000}>25,000</option>
                                            <option value={50000}>50,000</option>
                                            <option value={100000}>100,000</option>
                                            <option value={250000}>250,000</option>
                                            <option value={500000}>500,000</option>
                                            <option value={1000000}>1,000,000</option>
                                        </select>
                                    </div>
                                    <button 
                                        onClick={resetSessionTokens}
                                        className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-colors flex items-center gap-1.5"
                                        title="Reset current session token counter"
                                    >
                                        <RotateCcw size={12}/> Reset Tracker
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10">
                                <h5 className="font-bold text-gray-200 mb-2 text-sm flex items-center gap-2">1. Google Gemini API Key Configuration</h5>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {apiKeyStatus === 'detected' ? (
                                                <div className="flex items-center gap-2 text-green-400">
                                                    <ShieldCheck size={18} />
                                                    <span className="font-bold">Gemini API Key Active</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-red-400">
                                                    <AlertTriangle size={18} />
                                                    <span className="font-bold">Gemini API Key Not Found</span>
                                                </div>
                                            )}
                                        </div>
                                        {geminiApiKey && (
                                            <button 
                                                onClick={() => handleUpdateGeminiKey('')} 
                                                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                                            >
                                                Clear Saved Key
                                            </button>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-gray-400">Enter / Paste Gemini API Key</label>
                                            <a 
                                                href="https://aistudio.google.com/app/apikey" 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
                                            >
                                                Get a free Gemini API Key <ExternalLink size={11}/>
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1 flex items-center">
                                                <input 
                                                    type={showGeminiKeySecret ? "text" : "password"} 
                                                    placeholder="Paste your AIzaSy... key here" 
                                                    value={geminiApiKey} 
                                                    onChange={e => handleUpdateGeminiKey(e.target.value)} 
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-white/30 transition-colors pr-10 font-mono text-gray-200"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowGeminiKeySecret(!showGeminiKeySecret)} 
                                                    className="absolute right-2 p-1 text-gray-400 hover:text-gray-200" 
                                                    title={showGeminiKeySecret ? "Hide API Key" : "Show API Key"}
                                                >
                                                    {showGeminiKeySecret ? <EyeOff size={14}/> : <Eye size={14}/>}
                                                </button>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => handleTestConnection('gemini')} 
                                                disabled={testStatuses.gemini === 'testing'}
                                                className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
                                                    testStatuses.gemini === 'testing'
                                                        ? 'bg-blue-600/50 text-blue-200 cursor-wait'
                                                        : testStatuses.gemini === 'ok'
                                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                                        : testStatuses.gemini === 'error'
                                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
                                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                                                }`}
                                                title="Perform a small non-destructive API ping to verify this Gemini key"
                                            >
                                                {testStatuses.gemini === 'testing' ? (
                                                    <><Loader2 size={13} className="animate-spin"/> Testing...</>
                                                ) : testStatuses.gemini === 'ok' ? (
                                                    <><Check size={13}/> Valid Key</>
                                                ) : testStatuses.gemini === 'error' ? (
                                                    <><X size={13}/> Test Failed</>
                                                ) : (
                                                    <><Zap size={13}/> Test Key</>
                                                )}
                                            </button>
                                        </div>

                                        {testStatuses.gemini === 'ok' && (
                                            <p className="text-emerald-400 text-xs mt-1.5 flex items-center gap-1 font-medium animate-in fade-in">
                                                <Check size={13} className="shrink-0 text-emerald-400"/> Key verified successfully! Gemini API is responding.
                                            </p>
                                        )}
                                        {testStatuses.gemini === 'error' && connectionError && (
                                            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5 bg-red-900/30 p-2 rounded border border-red-500/30 leading-tight animate-in fade-in">
                                                <AlertTriangle size={13} className="shrink-0 text-red-400"/> {connectionError}
                                            </p>
                                        )}

                                        {typeof window !== 'undefined' && (window as any).aistudio && (
                                            <div className="pt-2">
                                                <button 
                                                    type="button"
                                                    onClick={async () => {
                                                        if ((window as any).aistudio) {
                                                            await (window as any).aistudio.openSelectKey();
                                                            setApiKeyStatus('detected');
                                                            setHasPaidKey(true);
                                                        }
                                                    }}
                                                    className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Key size={14} /> AI Studio Key Selector
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-blue-950/20 border border-blue-800/30 rounded p-3 text-xs text-blue-200/80 space-y-1.5">
                                        <p className="font-semibold text-blue-200">🚀 Using this app on Vercel or standalone hosting:</p>
                                        <p>• <strong>Direct In-App Use:</strong> Paste your Gemini API key above and click <em>Test Key Connection</em>. The key is securely saved in your browser's local storage and used immediately—no rebuild needed!</p>
                                        <p>• <strong>Vercel Environment Variable:</strong> You can also set <code>GEMINI_API_KEY</code> or <code>VITE_GEMINI_API_KEY</code> in your Vercel Project Settings &rarr; Environment Variables. Note that because Vite builds static assets, you must click <strong>Redeploy</strong> in Vercel after adding the variable.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-red-900/30">
                                <h5 className="font-bold text-red-200 mb-2 text-sm flex items-center gap-2">⚠️ Danger Zone</h5>
                                <p className="text-xs text-red-400/70 mb-4">If you are experiencing storage errors, you can clear all automatically saved session data. This will not delete exported files.</p>
                                <button 
                                    onClick={() => setShowClearDataModal(true)}
                                    className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-300 rounded-lg text-xs font-bold transition-colors"
                                >
                                    Clear All Saved Data
                                </button>
                            </div>

                            <div className="bg-[#1a1a1a] p-4 rounded-lg border border-white/10">
                                <h5 className="font-bold text-gray-200 mb-3 text-sm">2. Troubleshooting Common Quota Errors</h5>
                                <div className="space-y-3">
                                    <a href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-black/40 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-900/50 rounded-md text-blue-300"><Zap size={16}/></div>
                                            <div>
                                                <p className="font-semibold text-white">Enable Generative AI API</p>
                                                <p className="text-xs text-gray-400">Ensure the "Generative Language API" is enabled for your Google Cloud project.</p>
                                            </div>
                                        </div>
                                        <ExternalLink size={16} className="text-gray-500"/>
                                    </a>
                                    <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-black/40 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-900/50 rounded-md text-green-300"><CreditCard size={16}/></div>
                                            <div>
                                                <p className="font-semibold text-white">Link Billing Account</p>
                                                <p className="text-xs text-gray-400">Your project must be linked to an active billing account to exceed free tier limits.</p>
                                            </div>
                                        </div>
                                        <ExternalLink size={16} className="text-gray-500"/>
                                    </a>
                                    <a href="https://console.cloud.google.com/apis/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-black/40 rounded-lg hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-900/50 rounded-md text-purple-300"><List size={16}/></div>
                                            <div>
                                                <p className="font-semibold text-white">Check Quotas & Usage</p>
                                                <p className="text-xs text-gray-400">Monitor your current API usage and see model-specific rate limits.</p>
                                            </div>
                                        </div>
                                        <ExternalLink size={16} className="text-gray-500"/>
                                    </a>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-white/10">
                                <button onClick={verifyConnections} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">
                                    {connectionStatus === 'checking' ? <Loader2 size={16} className="animate-spin"/> : <ShieldCheck size={16}/>}
                                    Test Active Connection
                                </button>
                                {connectionError && <p className="text-red-400 text-xs mt-2 text-center">{connectionError}</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="prose prose-sm prose-invert prose-headings:text-white prose-a:text-blue-400 prose-code:text-red-400 prose-code:bg-black/50 prose-code:p-1 prose-code:rounded">
                            <h4 className="text-lg font-bold text-white mb-2">Local AI (Ollama)</h4>
                            <p>Ollama lets you run powerful AI models entirely on your own computer. This is perfect for when you are offline or want to keep your data private.</p>
                            
                            <h5 className="font-bold text-white mt-4 mb-1">How to set it up:</h5>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li><strong>Install:</strong> Download and install Ollama from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer">ollama.com</a>.</li>
                                <li><strong>Get a Model:</strong> Open your terminal and run <code>ollama run llama3</code> (or another model).</li>
                                <li><strong>Configure for Web Access:</strong> For this app to talk to your local Ollama, you must allow "CORS" connections.
                                    <div className="bg-black/40 p-3 rounded mt-2 text-xs">
                                        <p className="font-bold mb-1">Set the OLLAMA_ORIGINS variable:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li><strong>macOS:</strong> Run <code>launchctl setenv OLLAMA_ORIGINS "*"</code> in your terminal, then restart the Ollama app.</li>
                                            <li><strong>Linux:</strong> Add <code>Environment="OLLAMA_ORIGINS=*"</code> to your Ollama systemd service file.</li>
                                            <li><strong>Windows:</strong> Set a system environment variable <code>OLLAMA_ORIGINS</code> to <code>*</code> and restart Ollama.</li>
                                        </ul>
                                    </div>
                                </li>
                                <li><strong>Connect:</strong> In the Configuration tab, ensure the URL is set to <code>http://localhost:11434</code>.</li>
                            </ol>
                            <p className="text-xs text-gray-400 mt-4 italic">Note: Because this app is hosted in the cloud, it cannot "see" your local machine directly. If you are using the cloud-hosted version of this app, you will need to use a tool like <code>ngrok</code> to create a secure tunnel to your local Ollama instance.</p>

                            <h4 className="text-lg font-bold text-white mt-8 mb-2">LM Studio (Offline Local AI)</h4>
                            <p>LM Studio runs LLMs locally on your own machine completely offline with GPU acceleration, zero cost, and total privacy.</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li><strong>Install LM Studio:</strong> Download and install LM Studio from <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer">lmstudio.ai</a>.</li>
                                <li><strong>Download a Model:</strong> Search for and download your preferred model (such as Llama 3.1, Mistral, Gemma 2, or Qwen 2.5).</li>
                                <li><strong>Start Local Server:</strong> Click on the <strong>Developer / Local Server</strong> icon (the double-bracket or terminal icon on the left).</li>
                                <li><strong>Enable CORS:</strong> In the server settings panel, toggle <strong>CORS (Cross-Origin Resource Sharing)</strong> to ON. This allows browser web applications to send generation requests.</li>
                                <li><strong>Load Model & Start:</strong> Load your model into memory and click <strong>Start Server</strong>. The server runs at <code>http://localhost:1234/v1</code>.</li>
                            </ol>

                            <h4 className="text-lg font-bold text-white mt-8 mb-2">OpenAI</h4>
                            <p>Connect directly to OpenAI's flagship models (GPT-4o, GPT-4o-mini, o1, o3-mini) or any OpenAI-compatible API gateway.</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a>.</li>
                                <li>Paste your API key into the OpenAI configuration tab.</li>
                                <li>Select your model or click <strong>Fetch Models</strong> to populate your account's available models.</li>
                            </ol>

                            <h4 className="text-lg font-bold text-white mt-8 mb-2">Pollinations (gen.pollinations.ai)</h4>
                            <p>Pollinations provides free and open access to generative AI with zero complex setup required.</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Default endpoint is now upgraded to <code>https://gen.pollinations.ai/v1</code> for high performance and multi-model support.</li>
                                <li>Select from models like OpenAI, Mistral, or Llama.</li>
                                <li>API key is optional; you can supply one if you have higher quota needs at <a href="https://pollinations.ai" target="_blank" rel="noopener noreferrer">pollinations.ai</a>.</li>
                            </ol>

                            <h4 className="text-lg font-bold text-white mt-8 mb-2">OpenRouter</h4>
                            <p>OpenRouter is a service that gives you access to hundreds of different AI models through a single API key, often cheaper and faster than running them yourself.</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Create an account at <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer">openrouter.ai</a>.</li>
                                <li>Add a small amount of credit to your account.</li>
                                <li>Generate an API key from your <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">Keys page</a>.</li>
                                <li>Paste the key into the "OpenRouter API Key" field in the Configuration tab.</li>
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {isSlideshowMode && storyboard && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in" onClick={() => { setIsSlideshowMode(false); if (!audioUrl) setIsPlaying(false); }}>
            <button onClick={(e) => { e.stopPropagation(); setIsSlideshowMode(false); if (!audioUrl) setIsPlaying(false); }} className="absolute top-6 right-6 text-gray-400 hover:text-white z-10 p-2 bg-black/20 rounded-full"><X size={24}/></button>
            <div className="w-full max-w-6xl aspect-video bg-black rounded-lg border border-white/10 flex items-center justify-center shadow-2xl shadow-black relative overflow-hidden">
                {storyboard[currentPlaybackIndex]?.generatedImage ? (
                    <img 
                        key={storyboard[currentPlaybackIndex].id}
                        src={storyboard[currentPlaybackIndex].generatedImage} 
                        alt={`Scene ${currentPlaybackIndex + 1}`}
                        className="w-full h-full object-contain animate-in fade-in duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-center p-8">
                        <ImageIcon size={64} className="mb-4 opacity-20"/>
                        <p className="text-xl">Image for Scene {currentPlaybackIndex + 1} not generated.</p>
                    </div>
                )}
            </div>
            <div className="mt-6 text-center max-w-4xl">
                <p className="text-gray-300 italic text-lg mb-2 line-clamp-2">"{storyboard[currentPlaybackIndex]?.lyric}"</p>
                <p className="text-gray-400 mono-font text-sm max-h-24 overflow-y-auto custom-scrollbar line-clamp-3">{storyboard[currentPlaybackIndex]?.imagePrompt}</p>
            </div>
            <div className="absolute bottom-8 left-8 right-8 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                    className={`h-full bg-gradient-to-r ${uiThemeColor} transition-all duration-1000 ease-linear`}
                    style={{ 
                      width: audioUrl 
                        ? `${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%`
                        : `${totalDurationSeconds > 0 ? (storyboard.slice(0, currentPlaybackIndex + 1).reduce((acc, s) => acc + (s.duration || 4), 0) / totalDurationSeconds) * 100 : 0}%`
                    }}
                />
            </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed inset-0 z-[101] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setErrorMessage(null)}>
          <div className="bg-[#1a1a1a] border border-red-500/30 rounded-lg shadow-2xl max-w-md w-full p-6 text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4"/>
            <h3 className="text-xl font-bold text-white mb-2">{errorTitle}</h3>
            <pre className="text-xs text-gray-400 mb-6 text-left whitespace-pre-wrap mono-font bg-black/30 p-3 rounded">{errorBody}</pre>
            <div className="flex justify-center gap-4">
              <button onClick={() => setErrorMessage(null)} className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">Close</button>
              {isErrorObject && errorMessage.action && (
                  <button onClick={() => { setErrorMessage(null); errorMessage.action!(); }} className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">
                      Open API & Billing Helper
                  </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-[101] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1a1a1a] border border-red-500/30 rounded-lg shadow-2xl max-w-md w-full p-6 text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4"/>
            <h3 className="text-xl font-bold text-white mb-2">Are you sure?</h3>
            <p className="text-gray-400 mb-6">This will reset your current project, including lyrics, narrative, references, and the storyboard. This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowResetConfirm(false)} className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">Cancel</button>
              <button onClick={executeReset} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors">Reset Project</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[101] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className={`bg-[#1a1a1a] border ${confirmModal.type === 'danger' ? 'border-red-500/30' : 'border-blue-500/30'} rounded-lg shadow-2xl max-w-md w-full p-6 text-center`}>
            {confirmModal.type === 'danger' ? (
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-4"/>
            ) : (
              <HelpCircle size={48} className="text-blue-500 mx-auto mb-4"/>
            )}
            <h3 className="text-xl font-bold text-white mb-2">{confirmModal.title}</h3>
            <p className="text-gray-400 mb-6">{confirmModal.message}</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setConfirmModal(null)} className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors">{confirmModal.cancelText || "Cancel"}</button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }} 
                className={`px-6 py-2 rounded-lg ${confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold transition-colors`}
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-start p-4 lg:p-12 animate-in fade-in" onClick={() => setShowHistory(false)}>
            <div className="bg-[#121212] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2"><History size={18}/> Project History</h3>
                    <button onClick={() => setShowHistory(false)}><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {history.length > 0 ? history.map(item => (
                        <div key={item.id} className="bg-white/5 p-3 rounded-lg flex justify-between items-center hover:bg-white/10 transition-colors">
                            <div>
                                <p className="text-sm font-medium">{item.date}</p>
                                <p className="text-xs text-gray-400">{item.lyrics}</p>
                            </div>
                            <button onClick={() => handleRestoreHistory(item)} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500">Restore</button>
                        </div>
                    )) : <p className="text-center text-gray-500 py-8">No history recorded yet.</p>}
                </div>
            </div>
        </div>
      )}

      {showSavedScenes && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-start p-4 lg:p-12 animate-in fade-in" onClick={() => setShowSavedScenes(false)}>
            <div className="bg-[#121212] border border-white/10 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Bookmark size={18} /> Saved Scenes</h3>
                    <button onClick={() => setShowSavedScenes(false)}><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedScenes.length > 0 ? savedScenes.map(scene => (
                        <div key={scene.id} className="bg-white/5 p-3 rounded-lg flex flex-col gap-2">
                           <p className="text-xs italic text-gray-400">"{scene.lyric}"</p>
                           <p className="text-[10px] mono-font text-gray-500 line-clamp-3">{scene.imagePrompt}</p>
                           <div className="flex gap-2 mt-auto pt-2">
                            <button onClick={() => handleAddSavedScene(scene)} className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-500 flex-1">Add to SB</button>
                            <button onClick={() => handleSaveScene(scene)} className="p-2 bg-red-900/50 text-red-300 text-xs font-bold rounded hover:bg-red-900"><Trash2 size={14}/></button>
                           </div>
                        </div>
                    )) : <p className="text-center text-gray-500 py-8 col-span-full">No scenes bookmarked yet.</p>}
                </div>
            </div>
        </div>
      )}

      <PromptPresetsModal
        isOpen={showPromptPresetsModal}
        onClose={() => {
          setShowPromptPresetsModal(false);
          setPresetTargetSceneIndex(null);
          setInitialPresetData(null);
        }}
        presets={promptPresets}
        onSavePreset={handleSavePreset}
        onDeletePreset={handleDeletePreset}
        onImportPresets={handleImportPresets}
        storyboard={storyboard}
        targetSceneIndex={presetTargetSceneIndex}
        selectedSceneIndices={storyboard ? storyboard.map((s, i) => s.isSelected ? i : -1).filter(i => i !== -1) : []}
        onApplyPresetToScene={handleApplyPresetToScene}
        onApplyPresetToSelected={handleApplyPresetToSelected}
        onInsertPresetAsScene={handleInsertPresetAsScene}
        initialNewPresetData={initialPresetData}
      />

      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 lg:p-12 animate-in fade-in" onClick={() => setShowScriptModal(false)}>
            <div className="bg-[#121212] border border-white/10 rounded-xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2"><FileText size={18}/> Generated Screenplay</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={handleCopyScript} className="p-2 hover:bg-white/10 rounded">{copyStatus === 'copied' ? <Check size={16} className="text-green-400"/> : <Copy size={16}/>}</button>
                        <button onClick={handleDownloadScript} className="p-2 hover:bg-white/10 rounded"><Download size={16}/></button>
                        <button onClick={handlePrintScript} className="p-2 hover:bg-white/10 rounded"><Printer size={16}/></button>
                        <button onClick={() => setShowScriptModal(false)}><X size={20}/></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-black/20">
                    {scriptLoading ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Loader2 size={32} className="animate-spin text-blue-400"/>
                            <p className="text-gray-400 mt-4">{progress}</p>
                            <button onClick={() => { stopRef.current = true; setScriptLoading(false); }} className="mt-4 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold">Cancel</button>
                        </div>
                    ) : (
                        <pre className="text-sm mono-font whitespace-pre-wrap text-gray-300">{generatedScript}</pre>
                    )}
                </div>
            </div>
        </div>
      )}
      
      {showAIEditor && (
        <div className="fixed inset-0 z-[101] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowAIEditor(false)}>
          <div className="bg-[#1a1a1a] border border-yellow-500/30 rounded-xl shadow-2xl max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Pencil size={20} className="text-yellow-400"/> AI Storyboard Editor</h3>
              <button onClick={() => setShowAIEditor(false)}><X size={20}/></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">Give a high-level instruction to revise the entire storyboard. The AI will rewrite descriptions and prompts while keeping your timing and lyrics intact.</p>
            <textarea 
              value={aiEditorCommand} 
              onChange={e => setAiEditorCommand(e.target.value)}
              placeholder="e.g., 'Make the whole video feel more like a dream sequence with heavy fog and slow motion' or 'Change the main character to a robot in every scene'"
              className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-sm mono-font outline-none focus:border-yellow-500/50 transition-colors h-32 mb-6"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAIEditor(false)} className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-colors">Cancel</button>
              <button 
                onClick={() => handleAIEditStoryboard()} 
                disabled={aiEditorLoading || !aiEditorCommand.trim()}
                className="px-6 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {aiEditorLoading ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                Apply Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {showSoraBuilder && (
        <div className="fixed inset-0 z-[101] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowSoraBuilder(false)}>
          <div className="bg-[#1a1a1a] border border-orange-500/30 rounded-xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2"><MonitorPlay size={18} className="text-orange-400"/> Master Video Prompt Builder</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleCopyAllSoraPrompts} className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors">
                  {copyStatus === 'copied' ? <Check size={14}/> : <Copy size={14}/>}
                  {copyStatus === 'copied' ? 'Copied!' : 'Copy All'}
                </button>
                <button onClick={() => setShowSoraBuilder(false)}><X size={20}/></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {storyboard?.map((scene, idx) => (
                <div key={scene.id} className="bg-black/20 border border-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Scene {idx + 1} • {scene.startTime}</span>
                  </div>
                  <p className="text-xs text-gray-500 italic mb-2">"{scene.lyric}"</p>
                  <textarea 
                    value={scene.soraPrompt} 
                    onChange={(e) => updateSoraPrompt(idx, e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded p-3 text-xs text-gray-300 outline-none focus:border-orange-500/30 h-24 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCustomModal && (
        <div className="fixed inset-0 z-[101] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowCustomModal(false)}>
          <form onSubmit={handleSaveCustomInfluence} className="bg-[#1a1a1a] border border-blue-500/30 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Plus size={20} className="text-blue-400"/> Add Custom Influence</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                <input type="text" value={customModalName} onChange={e => setCustomModalName(e.target.value)} placeholder="e.g., 'Blade Runner 2049'" className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-blue-500/50" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">Description <button type="button" onClick={handleAutoFillDescription} disabled={isAutoFilling || !customModalName} className="text-[10px] text-blue-400 hover:text-blue-300 disabled:opacity-50 flex items-center gap-1">{isAutoFilling ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} Auto-Fill</button></label>
                <textarea value={customModalDesc} onChange={e => setCustomModalDesc(e.target.value)} placeholder="Describe the visual style..." className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-blue-500/50 h-24 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setShowCustomModal(false)} className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">Save Influence</button>
            </div>
          </form>
        </div>
      )}

      {showClearDataModal && (
        <div className="fixed inset-0 z-[101] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowClearDataModal(false)}>
          <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Clear All Saved Data</h3>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to clear all automatically saved session data? This will reset your current session and free up browser storage. This will not delete exported files.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearDataModal(false)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold transition-colors">Cancel</button>
              <button onClick={async () => { 
                localStorage.clear(); 
                await idb.clear();
                window.location.reload(); 
              }} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors">Clear Data</button>
            </div>
          </div>
        </div>
      )}

      {showCharacterCreator && (
        <div className="fixed inset-0 z-[101] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowCharacterCreator(false)}>
          <form onSubmit={handleSaveCharacter} className="bg-[#1a1a1a] border border-teal-500/30 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><UserPlus size={20} className="text-teal-400"/> Character Continuity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Character Name</label>
                <input type="text" value={characterModalName} onChange={e => setCharacterModalName(e.target.value)} placeholder="e.g., 'The Protagonist'" className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-teal-500/50" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">Visual Description <button type="button" onClick={handleAutoDescribeCharacter} disabled={isAutoDescribing || !characterModalName} className="text-[10px] text-teal-400 hover:text-teal-300 disabled:opacity-50 flex items-center gap-1">{isAutoDescribing ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} Generate Bio</button></label>
                <textarea value={characterModalDesc} onChange={e => setCharacterModalDesc(e.target.value)} placeholder="Describe their appearance, clothing, and features..." className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none focus:border-teal-500/50 h-32 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setShowCharacterCreator(false)} className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors">Save Character</button>
            </div>
          </form>
        </div>
      )}

      <QuickSwapModal
        isOpen={showQuickSwapModal}
        onClose={() => {
          setShowQuickSwapModal(false);
          setQuickSwapSourceRefId(null);
        }}
        visualRefs={visualRefs}
        storyboard={storyboard}
        initialSourceRefId={quickSwapSourceRefId}
        onExecuteSwap={handleExecuteQuickSwap}
        onAutoDescribeCharacter={async (name: string) => {
          const prompt = `Create a detailed, specific physical description for a character named "${name}". Focus on concrete visual details like age, facial structure, hair style and color, eye color, build, skin tone, clothing style, and distinguishing visual marks. Output only the description in 1 concise paragraph.`;
          if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
            const res = await ai.models.generateContent({ model: geminiUtilityModel, contents: prompt });
            return (res.text || '').trim();
          } else {
            const res = await performProviderRequest(prompt);
            return res.trim();
          }
        }}
        isAiConfigured={Boolean(provider === 'gemini' ? getEffectiveGeminiKey() : true)}
      />

      <BatchCharacterUpdateModal
        isOpen={showBatchCharacterModal}
        onClose={() => {
          setShowBatchCharacterModal(false);
          setBatchCharacterInitialRefId(null);
        }}
        visualRefs={visualRefs}
        storyboard={storyboard}
        initialSelectedRefId={batchCharacterInitialRefId}
        onExecuteBatchUpdate={handleExecuteBatchCharacterUpdate}
        onAutoDescribeCharacter={async (name: string, seed?: string) => {
          const prompt = `Create a detailed, cinema-grade physical description for a character named "${name}". ${seed ? `Incorporate or expand on these existing features: "${seed}".` : ''} Focus on concrete visual details including ethnicity/age, facial features, eyes, hair style/color/texture, distinctive wardrobe, clothing fabric textures, accessories/props, and visual atmosphere. Return only the description in 1 concise paragraph suitable for AI image and video generation prompts.`;
          if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: getEffectiveGeminiKey() });
            const res = await ai.models.generateContent({ model: geminiUtilityModel, contents: prompt });
            return (res.text || '').trim();
          } else {
            const res = await performProviderRequest(prompt);
            return res.trim();
          }
        }}
        isAiConfigured={Boolean(provider === 'gemini' ? getEffectiveGeminiKey() : true)}
      />

      <ColorGradeModal
        isOpen={showColorGradeModal}
        onClose={() => {
          setShowColorGradeModal(false);
          setColorGradeFocusSceneIndex(null);
        }}
        storyboard={storyboard}
        selectedStyle={selectedStyle}
        selectedInfluences={selectedInfluences}
        narrative={narrative}
        initialFocusSceneIndex={colorGradeFocusSceneIndex}
        onApplyPromptUpdate={handleApplyColorGradeUpdate}
        onRequestAIGeneration={async (prompt: string, isJson: boolean) => {
          return await generateTextWithActiveAI(prompt, isJson);
        }}
        isAiConfigured={Boolean(provider === 'gemini' ? getEffectiveGeminiKey() : true)}
      />

      <AIStyleRefinerModal
        isOpen={showStyleRefinerModal}
        onClose={() => setShowStyleRefinerModal(false)}
        storyboard={storyboard}
        onApplyRefinements={handleApplyStyleRefinerUpdate}
        onRequestAIGeneration={async (prompt: string, isJson: boolean) => {
          return await generateTextWithActiveAI(prompt, isJson);
        }}
        isAiConfigured={Boolean(provider === 'gemini' ? getEffectiveGeminiKey() : true)}
      />

      <AIContrastBoosterModal
        isOpen={showContrastBoosterModal}
        onClose={() => {
          setShowContrastBoosterModal(false);
          setContrastBoosterFocusSceneIndex(null);
        }}
        storyboard={storyboard || []}
        onApplyBoost={handleApplyContrastBoosterUpdate}
        onRequestAIGeneration={async (prompt: string, isJson: boolean) => {
          return await generateTextWithActiveAI(prompt, isJson);
        }}
        isAiConfigured={Boolean(provider === 'gemini' ? getEffectiveGeminiKey() : true)}
        initialFocusSceneIndex={contrastBoosterFocusSceneIndex}
      />

      {showAnimaticModal && (
        <div className="fixed inset-0 z-[101] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowAnimaticModal(false)}>
          <div className="bg-[#1a1a1a] border border-cyan-500/30 rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Film size={20} className="text-cyan-400"/> Export Animatic</h3>
            <p className="text-sm text-gray-400 mb-6">Create a video preview of your storyboard synced to your audio track. This will record your screen in real-time.</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Resolution</label>
                <select value={animaticResolution} onChange={e => setAnimaticResolution(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm outline-none">
                  <option value="1280x720">720p (1280x720)</option>
                  <option value="1920x1080">1080p (1920x1080)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Transition</label>
                <div className="flex gap-2">
                  <button onClick={() => setAnimaticTransition('cut')} className={`flex-1 py-2 rounded border text-xs font-bold ${animaticTransition === 'cut' ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-300' : 'border-white/10 bg-black/20'}`}>Hard Cut</button>
                  <button onClick={() => setAnimaticTransition('fade')} className={`flex-1 py-2 rounded border text-xs font-bold ${animaticTransition === 'fade' ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-300' : 'border-white/10 bg-black/20'}`}>Crossfade</button>
                </div>
              </div>
              {animaticTransition === 'fade' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fade Duration ({animaticFade}s)</label>
                  <input type="range" min="0.1" max="2" step="0.1" value={animaticFade} onChange={e => setAnimaticFade(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              <button onClick={() => setShowAnimaticModal(false)} className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-colors flex-1">Cancel</button>
              <button onClick={() => { setShowAnimaticModal(false); handleExportAnimatic(); }} className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition-colors flex-1 flex items-center justify-center gap-2">
                <Download size={18}/> Start Recording
              </button>
            </div>
          </div>
        </div>
      )}

      {showResources && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 lg:p-12 animate-in fade-in" onClick={() => setShowResources(false)}>
          <div className="bg-[#121212] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2"><HelpCircle size={18}/> AI Filmmaking Resources</h3>
              <button onClick={() => setShowResources(false)}><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(RESOURCES).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest border-b border-white/10 pb-2">{category}</h4>
                  <div className="space-y-4">
                    {items.map(item => (
                      <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all group">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-blue-300 group-hover:text-blue-200">{item.name}</span>
                          <ExternalLink size={14} className="text-gray-600 group-hover:text-gray-400"/>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showManual && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-center items-center p-4 lg:p-12 animate-in fade-in" onClick={() => setShowManual(false)}>
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-5xl h-[80vh] flex overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Sidebar */}
            <div className="w-64 bg-black/40 border-r border-white/5 flex flex-col p-6 gap-8">
              <div className="flex items-center gap-3 text-cyan-400 mb-4">
                <BookOpen size={24} />
                <span className="font-bold tracking-widest uppercase text-lg brand-font">Guide</span>
              </div>
              
              <nav className="flex flex-col gap-2">
                <button 
                  onClick={() => setManualSection('core')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${manualSection === 'core' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                  <Zap size={18} /> Core Concepts
                </button>
                <button 
                  onClick={() => setManualSection('audio')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${manualSection === 'audio' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                  <Mic size={18} /> Audio Intelligence
                </button>
                <button 
                  onClick={() => setManualSection('casting')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${manualSection === 'casting' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                  <User size={18} /> Casting & Continuity
                </button>
                <button 
                  onClick={() => setManualSection('editor')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${manualSection === 'editor' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                  <Edit3 size={18} /> AI Editor
                </button>
                <button 
                  onClick={() => setManualSection('export')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${manualSection === 'export' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                  <Share2 size={18} /> Exporting
                </button>
                
                <div className="mt-8 mb-2 px-4 text-[10px] uppercase font-bold text-gray-600 tracking-widest">AI Providers</div>
                
                <button 
                  onClick={() => setManualSection('providers')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${manualSection === 'providers' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                  <Settings size={18} /> Provider Setup
                </button>

                <button 
                  onClick={() => setManualSection('support')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${manualSection === 'support' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                  <Coffee size={18} /> Support the Project
                </button>
              </nav>

              <div className="mt-auto pt-8">
                <a 
                  href="https://buymeacoffee.com/magicstatic" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-xl text-yellow-500 text-sm font-bold transition-all group"
                >
                  <Coffee size={18} className="group-hover:rotate-12 transition-transform" />
                  Buy me a coffee
                </a>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-black/20">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white brand-font tracking-tight">
                  {manualSection === 'core' && 'The Basic Workflow'}
                  {manualSection === 'audio' && 'Audio Intelligence Engine'}
                  {manualSection === 'casting' && 'Casting & Character Continuity'}
                  {manualSection === 'editor' && 'Global AI Storyboard Editor'}
                  {manualSection === 'export' && 'Professional Export Pipelines'}
                  {manualSection === 'providers' && 'AI Provider Configuration'}
                  {manualSection === 'support' && 'Support the Project'}
                </h2>
                <button onClick={() => setShowManual(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {manualSection === 'core' && (
                  <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-4xl font-black text-white/5 group-hover:text-cyan-500/10 transition-colors">01</div>
                        <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">1. Input Lyrics</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Paste your song lyrics or script into the left panel. This forms the backbone of your storyboard.</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-4xl font-black text-white/5 group-hover:text-cyan-500/10 transition-colors">02</div>
                        <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">2. Define Style</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Choose a visual style and add "Influences" (Directors, Cinematographers) to guide the AI's aesthetic.</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-4xl font-black text-white/5 group-hover:text-cyan-500/10 transition-colors">03</div>
                        <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">3. Generate</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Click "Generate Storyboard" to create a scene-by-scene breakdown with detailed prompts and previews.</p>
                      </div>
                    </div>
                    
                    <div className="bg-cyan-500/5 border border-cyan-500/20 p-6 rounded-xl">
                      <h4 className="text-cyan-400 font-bold mb-2 uppercase text-xs tracking-widest">Pro Tip</h4>
                      <p className="text-gray-300 text-sm italic">"The more descriptive your Narrative Summary, the more cohesive the AI's vision will be across the entire project."</p>
                    </div>

                    <div className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-xl">
                      <h4 className="text-purple-400 font-bold mb-2 uppercase text-xs tracking-widest">Structure Tip</h4>
                      <p className="text-gray-300 text-sm italic">"Use tags like [Intro], [SFX: *train horn*], or [Instrument: Trumpet] in your lyrics to help the AI understand instrumental sections and sound design cues."</p>
                    </div>
                  </div>
                )}

                {manualSection === 'audio' && (
                   <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex gap-6 items-start">
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
                          <Mic size={32} />
                        </div>
                        <div>
                          <p className="text-gray-300 leading-relaxed mb-6">The Audio Intelligence engine allows you to sync your storyboard perfectly to a music track. It listens for rhythm, energy, and structural changes.</p>
                          <ul className="space-y-4">
                            <li className="flex gap-3">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                              <span className="text-sm text-gray-400"><strong className="text-gray-200">Automatic Timing:</strong> Scenes are automatically sized based on the song's duration and rhythm.</span>
                            </li>
                            <li className="flex gap-3">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                              <span className="text-sm text-gray-400"><strong className="text-gray-200">Lyric Sync & .LRC Generation:</strong> The engine syncs lyrics to timestamps and generates standard synchronized <code className="text-purple-300 font-mono text-xs">.lrc</code> files for lyric video visualizers.</span>
                            </li>
                            <li className="flex gap-3">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                              <span className="text-sm text-gray-400"><strong className="text-gray-200">Snap to Beats & Peaks:</strong> Real-time transient audio peak detection detects rhythmic drops and snaps scene cut points right to the beat.</span>
                            </li>
                            <li className="flex gap-3">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                              <span className="text-sm text-gray-400"><strong className="text-gray-200">Interactive Visualizer:</strong> Waveform scrubbers and real-time frequency analysis display audio energy as you playback and refine.</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                   </div>
                )}

                {manualSection === 'casting' && (
                   <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-white">Visual References & Casting Continuity</h3>
                          <p className="text-sm text-gray-400 leading-relaxed">Casting allows you to define characters or locations once and have them persist across all generated prompts. This is the key to professional continuity.</p>
                          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                            <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2">How to use</h4>
                            <ol className="text-xs text-gray-400 space-y-2 list-decimal pl-4">
                              <li>Add a new character or location in the Casting panel.</li>
                              <li>Provide a detailed visual description (or upload an image for AI vision analysis).</li>
                              <li>Link the character to specific scenes using the "Link" icon or batch toolbar.</li>
                              <li>Use <strong>Batch Character Lock</strong> to inject character continuity across multiple selected scenes in a single click.</li>
                            </ol>
                          </div>
                        </div>
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                          <User size={48} className="text-blue-400 mb-4 opacity-50" />
                          <p className="text-xs text-gray-500 italic">"The AI automatically injects your character descriptions and visual tags into every prompt where they are linked."</p>
                        </div>
                      </div>
                   </div>
                )}

                {manualSection === 'editor' && (
                   <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <Edit3 size={24} className="text-emerald-400" />
                            <h3 className="text-lg font-bold text-white">Global AI Editor</h3>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed mb-4">Apply sweeping changes to your entire storyboard using natural language prompts.</p>
                          <div className="space-y-2">
                            <div className="p-2.5 bg-black/40 rounded-lg border border-white/5">
                              <p className="text-[10px] text-emerald-400 font-bold uppercase">Prompt Example</p>
                              <p className="text-xs text-gray-300">"Make all scenes take place at night with neon rain reflections."</p>
                            </div>
                            <div className="p-2.5 bg-black/40 rounded-lg border border-white/5">
                              <p className="text-[10px] text-emerald-400 font-bold uppercase">Prompt Example</p>
                              <p className="text-xs text-gray-300">"Adjust camera movements to dynamic drone tracking shots."</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <Merge size={24} className="text-cyan-400" />
                            <h3 className="text-lg font-bold text-white">Scene Merging</h3>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed mb-4">Combine two adjacent scenes into one cohesive shot without breaking the timeline.</p>
                          <ul className="text-xs text-gray-300 space-y-2 list-disc pl-4">
                            <li><strong>Seamless Math:</strong> New duration equals the sum of both scenes; downstream timestamps automatically recalculate.</li>
                            <li><strong>Content Blending:</strong> Merges summaries and lyrics while keeping the primary visual style.</li>
                            <li><strong>Quick Access:</strong> Click the hover pill between cards (<code className="text-cyan-300 font-mono text-[10px]">Merge Scenes X & Y</code>), the card header, or the multi-select batch bar.</li>
                          </ul>
                        </div>

                        <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <Palette size={24} className="text-purple-400" />
                            <h3 className="text-lg font-bold text-white">AI Style Refiner</h3>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed mb-4">Batch-apply curated visual aesthetics (Cyberpunk, 16mm Vintage, Noir, Anime, 8K Hyperreal) with fine intensity tuning across all or selected scenes.</p>
                        </div>

                        <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <Contrast size={24} className="text-indigo-400" />
                            <h3 className="text-lg font-bold text-white">AI Contrast Booster</h3>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed mb-4">Analyze scenes and automatically adjust prompt keywords to eliminate flat, washed-out lighting and maximize dramatic visual contrast, depth, and specular rims.</p>
                          <ul className="text-xs text-gray-300 space-y-1.5 list-disc pl-4">
                            <li><strong>Cinematic Profiles:</strong> Choose between Chiaroscuro Noir, Volumetric Rays, High Dynamic Range, Neo-Cyber Contrast, or Crisp Specular Edge.</li>
                            <li><strong>Depth & Rims:</strong> Automatically strips low-contrast terms and injects 3D plane separation, edge catchlights, and atmospheric depth cues.</li>
                            <li><strong>Batch or Single Scene:</strong> Boost your entire storyboard, selected scenes, or a single frame with live side-by-side diff previews before committing.</li>
                          </ul>
                        </div>

                        <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                          <div className="flex items-center gap-3 mb-4">
                            <Sparkles size={24} className="text-amber-400" />
                            <h3 className="text-lg font-bold text-white">Smart Prompt Suggestions</h3>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed mb-4">Contextual camera angles, lighting cues, and prompt presets ready for instant one-click insertion into any scene's image or video prompt.</p>
                        </div>
                      </div>
                   </div>
                )}

                {manualSection === 'export' && (
                   <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Music size={18} className="text-pink-400"/> Synchronized .LRC Lyric Sheet</h3>
                          <p className="text-xs text-gray-400 leading-relaxed mb-3">Generates standard timestamped <code className="text-pink-300 font-mono text-xs">.lrc</code> files synced to scene intervals. Ideal for lyric video visualizers, karaoke software, and media players.</p>
                          <div className="text-[10px] text-pink-400/80 bg-pink-500/10 border border-pink-500/20 p-2 rounded">Included in Project ZIP & standalone export</div>
                        </div>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Sparkles size={18} className="text-cyan-400"/> Wunderbar! (Perchance AI)</h3>
                          <p className="text-xs text-gray-400 leading-relaxed mb-3">Direct integration with Wunderbar! (<a href="https://perchance.org/aa-wunderbar" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">perchance.org/aa-wunderbar</a>). Simply paste your exported prompt list to explore 4 style variations or build an automated slideshow video.</p>
                          <div className="text-[10px] text-cyan-400/80 bg-cyan-500/10 border border-cyan-500/20 p-2 rounded">Includes wunderbar_info.txt guide in ZIP</div>
                        </div>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><FileArchive size={18} className="text-yellow-400"/> Project ZIP Master Bundle</h3>
                          <p className="text-xs text-gray-400 leading-relaxed mb-3">Comprehensive backup package containing <code className="text-yellow-300 font-mono text-[10px]">project_data.json</code>, master shotlist, image prompts, video prompts, Sora prompts, screenplay, ComfyUI batch files, synchronized .lrc, and Wunderbar guide.</p>
                          <div className="text-[10px] text-gray-500 bg-black/20 p-2 rounded">Complete Portable Project Archive</div>
                        </div>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Cpu size={18} className="text-green-400"/> ComfyUI Pipeline</h3>
                          <p className="text-xs text-gray-400 leading-relaxed mb-3">Export batch files compatible with the 'Inspire Pack' nodes in ComfyUI. This allows for automated high-quality rendering of your entire storyboard.</p>
                          <div className="text-[10px] text-gray-500 bg-black/20 p-2 rounded">Supports Image & Video Batching</div>
                        </div>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><VideoIcon size={18} className="text-purple-400"/> Animatic Export</h3>
                          <p className="text-xs text-gray-400 leading-relaxed mb-3">Generate a high-resolution video preview of your storyboard synced to your audio track, complete with transitions and timing.</p>
                          <div className="text-[10px] text-gray-500 bg-black/20 p-2 rounded">Real-time Browser Recording</div>
                        </div>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><ScrollText size={18} className="text-cyan-400"/> Screenplay</h3>
                          <p className="text-xs text-gray-400 leading-relaxed mb-3">Export an industry-standard screenplay format of your project, including scene headings, action descriptions, and lyrics.</p>
                          <div className="text-[10px] text-gray-500 bg-black/20 p-2 rounded">Professional Script Format</div>
                        </div>
                        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                          <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Monitor size={18} className="text-blue-400"/> Slideshow</h3>
                          <p className="text-xs text-gray-400 leading-relaxed mb-3">Present your storyboard in a full-screen, immersive slideshow mode. Perfect for pitch meetings and reviews.</p>
                          <div className="text-[10px] text-gray-500 bg-black/20 p-2 rounded">Immersive Presentation</div>
                        </div>
                      </div>
                   </div>
                )}

                {manualSection === 'providers' && (
                   <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="space-y-6">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-bold text-white">Google Gemini (Recommended)</h4>
                            <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-bold">Free & Paid Tiers</span>
                          </div>
                          <p className="text-xs text-gray-400 mb-4">The primary engine for narrative analysis and prompt generation. Supports free and paid tiers.</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-2 bg-black/20 rounded border border-white/5">
                                <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Free Tier</p>
                                <p className="text-[10px] text-gray-400">Great for experimentation. Subject to rate limits.</p>
                            </div>
                            <div className="p-2 bg-black/20 rounded border border-white/5">
                                <p className="text-[9px] font-bold text-blue-500 uppercase mb-1">Paid Tier (Pay-as-you-go)</p>
                                <p className="text-[10px] text-gray-400">Higher rate limits and access to advanced models like Gemini 1.5 Pro.</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <h4 className="text-sm font-bold text-white mb-2">Video Pipelines (Veo / Runway / LTX)</h4>
                          <p className="text-xs text-gray-400 mb-4">AudioArc generates optimized prompts for the world's leading video models.</p>
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-[9px] px-2 py-1 bg-white/5 rounded text-gray-400 border border-white/5">Veo (Google)</span>
                            <span className="text-[9px] px-2 py-1 bg-white/5 rounded text-gray-400 border border-white/5">Runway Gen-3</span>
                            <span className="text-[9px] px-2 py-1 bg-white/5 rounded text-gray-400 border border-white/5">Luma Dream Machine</span>
                            <span className="text-[9px] px-2 py-1 bg-white/5 rounded text-gray-400 border border-white/5">Kling AI</span>
                          </div>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <h4 className="text-sm font-bold text-white mb-2">Ollama (Local)</h4>
                          <p className="text-xs text-gray-400">Run models locally on your own hardware for maximum privacy and zero cost. Requires Ollama to be running on your machine.</p>
                        </div>
                      </div>
                   </div>
                )}

                {manualSection === 'support' && (
                   <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                      <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
                        <Coffee size={40} className="text-yellow-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-white brand-font">Enjoying AudioArc?</h3>
                      <p className="text-gray-400 leading-relaxed">
                        This project is a labor of love, built to empower music video directors and cinematic visionaries with the best AI tools available. If you find it useful, consider supporting its continued development!
                      </p>
                      <a 
                        href="https://buymeacoffee.com/magicstatic" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-2xl transition-all transform hover:scale-105 shadow-xl shadow-yellow-500/20"
                      >
                        <Coffee size={20} />
                        Buy me a coffee
                      </a>
                      <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] mt-8">
                        Built with ❤️ by MagicStatic
                      </p>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showExport && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in" onClick={() => setShowExport(false)}>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-white"><Share2 size={18} className="text-green-400"/> Export Suite & Shotlist Manager</h3>
                      <button onClick={() => setShowExport(false)} className="text-gray-400 hover:text-white transition-colors"><X size={20}/></button>
                  </div>
                  
                  {/* Export Filename Configuration */}
                  <div className="p-5 border-b border-white/5 bg-black/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                          <div>
                              <label className="text-xs font-bold text-gray-400 block mb-1.5 flex items-center gap-1.5">
                                  <Tag size={12} className="text-blue-400"/> Project Name / Prefix
                              </label>
                              <input 
                                  type="text" 
                                  value={projectName} 
                                  onChange={(e) => {
                                      setProjectName(e.target.value);
                                      localStorage.setItem('audioarc_project_name', e.target.value);
                                  }}
                                  placeholder="AudioArc_Project"
                                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors"
                              />
                          </div>
                          <div className="flex flex-col justify-end gap-2">
                              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 select-none">
                                  <input 
                                      type="checkbox" 
                                      checked={exportIncludeDate} 
                                      onChange={(e) => setExportIncludeDate(e.target.checked)} 
                                      className="accent-blue-500 rounded"
                                  />
                                  <span>Include Date Tag (YYYYMMDD)</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 select-none">
                                  <input 
                                      type="checkbox" 
                                      checked={exportIncludeTimeSerial} 
                                      onChange={(e) => setExportIncludeTimeSerial(e.target.checked)} 
                                      className="accent-blue-500 rounded"
                                  />
                                  <span>Include Time Stamp (HHMM)</span>
                              </label>
                          </div>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono bg-black/50 px-3 py-1.5 rounded border border-white/5 flex items-center gap-2 overflow-x-auto">
                          <span className="text-gray-500 shrink-0 font-sans font-bold text-[10px] uppercase tracking-wider">Preview Pattern:</span>
                          <span className="text-emerald-400 truncate">{getExportFilename('shotlist', 'json')}</span>
                      </div>
                  </div>

                  <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-[50vh] overflow-y-auto custom-scrollbar">
                      <button onClick={()=>handleExportProjectZip()} className="export-btn"><FileArchive size={24} className="text-yellow-400"/> Project ZIP</button>
                      <button onClick={()=>handleExport('lrc')} className="export-btn" title="Export synchronized .lrc lyric sheet for visualizers"><Music size={24} className="text-pink-400"/> Lyrics (.lrc)</button>
                      <button onClick={()=>handleExport('json')} className="export-btn"><FileJson size={24} className="text-blue-400"/> Project JSON</button>
                      <button onClick={()=>handleExport('txt')} className="export-btn"><FileText size={24} className="text-gray-300"/> Master Shotlist</button>
                      <button onClick={()=>handleExport('screenplay')} className="export-btn"><ScrollText size={24} className="text-cyan-400"/> Screenplay</button>
                      <button onClick={()=>handleExport('sora_txt')} className="export-btn"><MonitorPlay size={24} className="text-orange-400"/> Sora Prompts</button>
                      <button onClick={()=>handleExport('image_txt')} className="export-btn"><ImageIcon size={24} className="text-pink-400"/> Image Prompts</button>
                      <button onClick={()=>handleExport('video_txt')} className="export-btn"><VideoIcon size={24} className="text-purple-400"/> Video Prompts</button>
                      <button onClick={()=>{setShowExport(false); handleExportPDF();}} className="export-btn"><Printer size={24} className="text-blue-400"/> Storyboard PDF</button>
                      <button onClick={()=>handleExport('comfy_image')} className="export-btn"><Cpu size={24} className="text-green-400"/> Comfy Image</button>
                      <button onClick={()=>handleExport('comfy_video')} className="export-btn"><Cpu size={24} className="text-emerald-400"/> Comfy Video</button>
                      <button onClick={()=>handleExport('wunderbar')} className="export-btn" title="Download Wunderbar! Perchance AI prompt variation guide"><Sparkles size={24} className="text-amber-400"/> Wunderbar! Guide</button>
                      <button onClick={()=>{setShowExport(false); setShowSlideshow(true); setSlideshowIndex(0);}} className="export-btn"><Monitor size={24} className="text-blue-500"/> Slideshow</button>
                      <button onClick={()=>{setShowExport(false); setShowAnimaticModal(true);}} className="export-btn"><Film size={24} className="text-red-500"/> Animatic</button>
                  </div>

                  {/* Wunderbar! Companion Showcase Banner */}
                  <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-blue-950/40 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-300 font-bold text-xs">
                              W!
                          </div>
                          <div className="min-w-0">
                              <div className="font-bold text-white flex items-center gap-2">
                                  <span>Wunderbar! Free AI Prompt Variations & Slideshow</span>
                                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono uppercase">Free AI</span>
                              </div>
                              <p className="text-[11px] text-gray-400 truncate">Try 4 prompt styles or generate a slideshow video on Perchance — simply copy and paste your exported prompt list.</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                          <a 
                              href="https://perchance.org/aa-wunderbar" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                              <span>Open Wunderbar!</span>
                              <ExternalLink size={12}/>
                          </a>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showSceneNavigator && storyboard && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in" onClick={() => setShowSceneNavigator(false)}>
              <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                      <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                              <Compass size={18} />
                          </div>
                          <div>
                              <h3 className="text-base font-bold text-white leading-none">Scene Quick Navigator</h3>
                              <p className="text-[11px] text-gray-400 mt-1">Jump directly to any scene beat across your sequence</p>
                          </div>
                      </div>
                      <button onClick={() => setShowSceneNavigator(false)} className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors">
                          <X size={20}/>
                      </button>
                  </div>

                  {/* Search and Filter Bar */}
                  <div className="p-4 border-b border-white/5 bg-black/40 flex items-center gap-3">
                      <div className="relative flex-1">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input 
                              type="text"
                              value={sceneSearchQuery}
                              onChange={(e) => setSceneSearchQuery(e.target.value)}
                              placeholder="Search by scene #, lyric, sequence group, or summary..."
                              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-colors"
                              autoFocus
                          />
                          {sceneSearchQuery && (
                              <button onClick={() => setSceneSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                  <X size={12} />
                              </button>
                          )}
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono shrink-0">
                          {storyboard.filter((scene, idx) => {
                              if (!sceneSearchQuery.trim()) return true;
                              const q = sceneSearchQuery.toLowerCase();
                              return (
                                  `scene ${idx + 1}`.includes(q) ||
                                  (scene.lyric && scene.lyric.toLowerCase().includes(q)) ||
                                  (scene.groupName && scene.groupName.toLowerCase().includes(q)) ||
                                  (scene.description && scene.description.toLowerCase().includes(q))
                              );
                          }).length} / {storyboard.length} Scenes
                      </span>
                  </div>

                  {/* Scenes List */}
                  <div className="p-4 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
                      {storyboard
                          .map((scene, idx) => ({ scene, idx }))
                          .filter(({ scene, idx }) => {
                              if (!sceneSearchQuery.trim()) return true;
                              const q = sceneSearchQuery.toLowerCase();
                              return (
                                  `scene ${idx + 1}`.includes(q) ||
                                  (scene.lyric && scene.lyric.toLowerCase().includes(q)) ||
                                  (scene.groupName && scene.groupName.toLowerCase().includes(q)) ||
                                  (scene.description && scene.description.toLowerCase().includes(q))
                              );
                          })
                          .map(({ scene, idx }) => (
                              <div
                                  key={scene.id || idx}
                                  onClick={() => {
                                      setShowSceneNavigator(false);
                                      const el = document.getElementById(`scene-card-${idx}`);
                                      if (el) {
                                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                          el.classList.add('ring-2', 'ring-blue-400');
                                          setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 2000);
                                      }
                                  }}
                                  className="p-3 bg-[#181818] hover:bg-[#222] border border-white/5 hover:border-blue-500/40 rounded-xl cursor-pointer transition-all flex items-center gap-4 group"
                              >
                                  {/* Thumbnail */}
                                  <div className="w-16 h-12 bg-black/60 rounded-lg overflow-hidden border border-white/10 shrink-0 flex items-center justify-center relative">
                                      {scene.generatedImage ? (
                                          <img src={scene.generatedImage} alt={`Scene ${idx + 1}`} className="w-full h-full object-cover" />
                                      ) : (
                                          <ImageIcon size={18} className="text-gray-600" />
                                      )}
                                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[9px] font-mono px-1 rounded text-gray-300">
                                          {scene.duration || 4}s
                                      </span>
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <span className="text-xs font-bold text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                              Scene {idx + 1}
                                          </span>
                                          {scene.groupName && (
                                              <span className="text-[10px] font-bold text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-500/20 uppercase">
                                                  {scene.groupName}
                                              </span>
                                          )}
                                          <span className="text-[10px] font-mono text-gray-500">
                                              {scene.startTime} - {scene.endTime}
                                          </span>
                                      </div>
                                      <p className="text-xs text-gray-300 italic truncate mb-0.5">
                                          "{scene.lyric || 'Instrumental beat'}"
                                      </p>
                                      {scene.description ? (
                                          <p className="text-[11px] text-gray-400 line-clamp-1">
                                              {scene.description}
                                          </p>
                                      ) : (
                                          <p className="text-[10px] text-gray-600 italic">
                                              No summary yet (click AI Summary on card to generate)
                                          </p>
                                      )}
                                  </div>

                                  {/* Jump Arrow */}
                                  <div className="shrink-0 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                                      <ChevronRight size={18} />
                                  </div>
                              </div>
                          ))}
                  </div>
              </div>
          </div>
      )}
      {showSlideshow && storyboard && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in">
            <div className="flex-none h-16 bg-black/50 backdrop-blur-md border-b border-white/10 px-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Monitor size={20} className="text-blue-400" />
                    <span className="font-bold brand-font text-white uppercase tracking-widest">Slideshow Mode</span>
                    <span className="text-xs text-gray-500 font-mono">Scene {slideshowIndex + 1} / {storyboard.length}</span>
                </div>
                <button onClick={() => setShowSlideshow(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
                <button 
                    onClick={() => setSlideshowIndex(prev => Math.max(0, prev - 1))}
                    disabled={slideshowIndex === 0}
                    className="absolute left-8 z-10 p-4 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all disabled:opacity-0"
                >
                    <ChevronLeft size={32} />
                </button>
                
                <div className="w-full max-w-6xl aspect-video bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative group">
                    {storyboard[slideshowIndex].generatedImage ? (
                        <img src={storyboard[slideshowIndex].generatedImage} className="w-full h-full object-contain animate-in zoom-in-95 duration-500" alt="Slideshow scene" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                            <ImageIcon size={64} className="text-gray-800" />
                            <span className="text-gray-600 font-bold uppercase tracking-widest">No Preview Image</span>
                        </div>
                    )}
                    
                    <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                        <div className="max-w-3xl">
                            <div className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Scene {slideshowIndex + 1} • {storyboard[slideshowIndex].startTime} - {storyboard[slideshowIndex].endTime}</div>
                            <h3 className="text-2xl font-bold text-white mb-3 leading-tight italic">"{storyboard[slideshowIndex].lyric}"</h3>
                            <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{storyboard[slideshowIndex].description}</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setSlideshowIndex(prev => Math.min(storyboard.length - 1, prev + 1))}
                    disabled={slideshowIndex === storyboard.length - 1}
                    className="absolute right-8 z-10 p-4 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all disabled:opacity-0"
                >
                    <ChevronRight size={32} />
                </button>
            </div>
            
            <div className="flex-none h-24 bg-black/50 backdrop-blur-md border-t border-white/10 px-8 flex items-center gap-4 overflow-x-auto custom-scrollbar">
                {storyboard.map((s, idx) => (
                    <button 
                        key={s.id}
                        onClick={() => setSlideshowIndex(idx)}
                        className={`shrink-0 w-32 aspect-video rounded-lg border-2 transition-all overflow-hidden relative group ${slideshowIndex === idx ? 'border-cyan-500 scale-105 shadow-lg shadow-cyan-500/20' : 'border-white/10 hover:border-white/30'}`}
                    >
                        {s.generatedImage ? (
                            <img src={s.generatedImage} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center"><ImageIcon size={16} className="text-gray-700"/></div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-white">{idx + 1}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* Real-Time Animatic Preview Window (Floating or Fullscreen overlay) */}
      {((showFloatingAnimatic && storyboardViewMode === 'cards') || animaticPreviewMode === 'floating' || animaticPreviewMode === 'fullscreen') && storyboard && storyboard.length > 0 && multiTrackProject && (
        <AnimaticPreviewWindow
          storyboard={storyboard}
          tracks={multiTrackProject.tracks}
          clips={multiTrackProject.clips}
          currentTime={currentTime}
          totalDuration={audioDuration || 30}
          isPlaying={isPlaying}
          onTogglePlay={togglePlayback}
          onSeek={handleTimelineSeek}
          onJumpToScene={jumpToScene}
          mode={animaticPreviewMode === 'fullscreen' ? 'fullscreen' : 'floating'}
          onModeChange={setAnimaticPreviewMode}
          onCloseFloating={() => {
            setShowFloatingAnimatic(false);
            if (animaticPreviewMode === 'floating') setAnimaticPreviewMode('docked');
          }}
          onOpenExportAnimatic={() => setShowAnimaticModal(true)}
          aspectRatio={multiTrackProject.aspectRatio}
          onAspectRatioChange={(ratio) => setMultiTrackProject({ ...multiTrackProject, aspectRatio: ratio })}
        />
      )}

    </div>
  );
};

export default App;