/**
 * Audio Beat & Peak Drop Detection Engine
 * Analyzes audioIntensityData (100ms energy segments) to identify:
 * - Musical 'drops' (sudden surges in energy after breakdowns/buildups)
 * - Rhythmic beat peaks (transient onsets and percussive impacts)
 * - Structural transition points
 * 
 * Provides automated scene duration snapping so video cuts land on the beat.
 */

import { ScenePrompt } from './App';

export interface AudioBeatDrop {
  index: number;         // Index in audioIntensityData (each index = 0.1s)
  time: number;          // Timestamp in seconds (index * 0.1s)
  intensity: number;     // Raw/normalized energy value (0-255)
  prominence: number;    // Local prominence above moving baseline (0-1)
  surge: number;         // Rate of energy increase/attack (0-1)
  isDrop: boolean;       // True if this is a major musical drop/impact
  type: 'drop' | 'beat' | 'transient';
  score: number;         // Overall composite peak score (0-1)
}

export interface BeatDetectionOptions {
  sensitivity?: number;           // 0 to 100 (default: 55). Higher = more peaks detected.
  minDistanceSeconds?: number;    // Minimum gap between cuts/peaks (default: 1.5s)
  dropSurgeThreshold?: number;    // Minimum energy surge to qualify as drop (0-1, default: 0.25)
  preferMajorDrops?: boolean;     // Prioritize heavy drops over minor beats
}

export interface SnapToBeatsOptions {
  mode?: 'snap_existing' | 'distribute_drops' | 'dynamic_flow';
  minSceneDuration?: number;      // Minimum allowed scene duration (default: 1.5s)
  maxSceneDuration?: number;      // Maximum allowed scene duration (default: 14.0s)
  precision?: 0.1 | 0.5 | 1.0;    // Step rounding for durations (default: 0.5)
  fitAudioDuration?: boolean;     // Force total storyboard duration to match audioDuration
  preferMajorDrops?: boolean;     // Prioritize drops over subtle beat transients
  sensitivity?: number;           // 0 to 100
}

export interface SnapResult {
  updatedStoryboard: ScenePrompt[];
  stats: {
    totalScenes: number;
    snappedCutsCount: number;
    majorDropsMatched: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    totalDuration: number;
    detectedDropsCount: number;
    detectedPeaksCount: number;
  };
  matchedDrops: AudioBeatDrop[];
}

/**
 * Extracts normalized 0-255 intensity values from a decoded Web Audio AudioBuffer.
 * Samples every 100ms (0.1s) using a hybrid RMS + peak metric.
 */
export function extractIntensityFromAudioBuffer(audioBuffer: AudioBuffer): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const samplesPerSegment = Math.max(1, Math.floor(sampleRate * 0.1)); // 100ms segments
  const intensities: number[] = [];

  let maxRms = 0.0001;
  const rawRmsValues: number[] = [];

  for (let i = 0; i < channelData.length; i += samplesPerSegment) {
    let sumSquares = 0;
    let peak = 0;
    const end = Math.min(i + samplesPerSegment, channelData.length);
    const count = end - i;

    for (let j = i; j < end; j++) {
      const val = channelData[j];
      sumSquares += val * val;
      const absVal = Math.abs(val);
      if (absVal > peak) peak = absVal;
    }

    const rms = Math.sqrt(sumSquares / count);
    const hybrid = rms * 0.7 + peak * 0.3;
    if (hybrid > maxRms) maxRms = hybrid;
    rawRmsValues.push(hybrid);
  }

  // Normalize dynamically across the track
  for (let i = 0; i < rawRmsValues.length; i++) {
    const norm = rawRmsValues[i] / maxRms;
    // Apply slight non-linear expansion to accentuate contrast between drops and quiet parts
    const expanded = Math.pow(norm, 0.85);
    const byteVal = Math.min(255, Math.max(0, Math.round(expanded * 255)));
    intensities.push(byteVal);
  }

  return intensities;
}

/**
 * Detects musical peaks and beat drops from audioIntensityData.
 */
export function detectAudioPeakDrops(
  audioIntensityData: number[],
  audioDuration?: number,
  options: BeatDetectionOptions = {}
): AudioBeatDrop[] {
  if (!audioIntensityData || audioIntensityData.length === 0) return [];

  const {
    sensitivity = 55,
    minDistanceSeconds = 1.5,
    dropSurgeThreshold = 0.22,
    preferMajorDrops = false
  } = options;

  const totalPoints = audioIntensityData.length;
  // Calculate seconds per point (default 0.1s)
  const secondsPerPoint = (audioDuration && audioDuration > 0)
    ? audioDuration / totalPoints
    : 0.1;

  // 1. Calculate track statistical profile (mean, stdDev, max)
  let sum = 0;
  let maxVal = 0;
  for (let i = 0; i < totalPoints; i++) {
    sum += audioIntensityData[i];
    if (audioIntensityData[i] > maxVal) maxVal = audioIntensityData[i];
  }
  const mean = sum / totalPoints;

  let varianceSum = 0;
  for (let i = 0; i < totalPoints; i++) {
    const diff = audioIntensityData[i] - mean;
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / totalPoints);

  // Dynamic threshold scaling with sensitivity (0 to 100)
  // Higher sensitivity lowers threshold, detecting more peaks
  const sensFactor = (100 - sensitivity) / 100; // 0.0 (very sensitive) to 1.0 (strict)
  const baseThreshold = Math.max(25, mean + (sensFactor - 0.5) * stdDev * 1.5);

  // 2. Smooth data slightly (3-point moving average) to prevent micro-fluctuations
  const smoothed: number[] = new Array(totalPoints);
  for (let i = 0; i < totalPoints; i++) {
    const prev = i > 0 ? audioIntensityData[i - 1] : audioIntensityData[i];
    const curr = audioIntensityData[i];
    const next = i < totalPoints - 1 ? audioIntensityData[i + 1] : audioIntensityData[i];
    smoothed[i] = prev * 0.25 + curr * 0.5 + next * 0.25;
  }

  // 3. Find candidate local maxima and compute prominence + onset surge
  const candidates: AudioBeatDrop[] = [];
  const baselineWindow = Math.max(5, Math.round(2.0 / secondsPerPoint)); // ~2 seconds window

  for (let i = 1; i < totalPoints - 1; i++) {
    const val = smoothed[i];
    if (val < baseThreshold) continue;

    // Check local maximum (is higher than immediate neighbors)
    if (val < smoothed[i - 1] || val < smoothed[i + 1]) continue;

    // Compute moving baseline (min/avg in neighborhood)
    const startWindow = Math.max(0, i - baselineWindow);
    const endWindow = Math.min(totalPoints, i + baselineWindow);
    let localMin = val;
    for (let w = startWindow; w < endWindow; w++) {
      if (smoothed[w] < localMin) localMin = smoothed[w];
    }
    const prominence = Math.max(0, (val - localMin) / 255);

    // Compute onset surge: how sharply the energy jumped over the last 3-5 frames (0.3-0.5s)
    const attackLookback = Math.max(0, i - Math.round(0.5 / secondsPerPoint));
    let preAttackMin = val;
    for (let a = attackLookback; a < i; a++) {
      if (smoothed[a] < preAttackMin) preAttackMin = smoothed[a];
    }
    const surge = Math.max(0, (val - preAttackMin) / 255);

    // Classification: Is this a major beat 'Drop'?
    // A drop exhibits both high energy and an explosive surge compared to preceding buildup/breakdown
    const isDrop = (surge >= dropSurgeThreshold && val >= mean + 0.15 * stdDev) || (val >= 215 && surge >= 0.15);
    const type: 'drop' | 'beat' | 'transient' = isDrop
      ? 'drop'
      : (surge >= 0.15 ? 'beat' : 'transient');

    const intensityNorm = val / 255;
    const score = (intensityNorm * 0.35) + (prominence * 0.35) + (surge * 0.30) + (isDrop ? 0.2 : 0);

    candidates.push({
      index: i,
      time: Math.round((i * secondsPerPoint) * 100) / 100,
      intensity: audioIntensityData[i],
      prominence: Math.round(prominence * 100) / 100,
      surge: Math.round(surge * 100) / 100,
      isDrop,
      type,
      score: Math.min(1.0, Math.round(score * 100) / 100)
    });
  }

  // 4. Non-Maximum Suppression (NMS) to avoid double triggers within minDistanceSeconds
  const sortedByScore = [...candidates].sort((a, b) => b.score - a.score);
  const selected: AudioBeatDrop[] = [];
  const minPointsGap = Math.max(2, Math.round(minDistanceSeconds / secondsPerPoint));

  for (const cand of sortedByScore) {
    let tooClose = false;
    for (const sel of selected) {
      if (Math.abs(cand.index - sel.index) < minPointsGap) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      selected.push(cand);
    }
  }

  // Filter if preferMajorDrops is enabled and we have enough drops
  let filtered = selected;
  if (preferMajorDrops) {
    const dropsOnly = selected.filter(p => p.isDrop);
    if (dropsOnly.length >= 3) {
      filtered = dropsOnly;
    }
  }

  // Return in chronological order
  return filtered.sort((a, b) => a.time - b.time);
}

/**
 * Formats seconds to mm:ss timestamp.
 */
function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Rounds a number to specified precision (0.1, 0.5, or 1.0)
 */
function roundToPrecision(val: number, precision: 0.1 | 0.5 | 1.0 = 0.5): number {
  const factor = 1 / precision;
  return Math.round(val * factor) / factor;
}

/**
 * Recalculates start and end timestamps based on scene durations.
 */
export function recalculateSceneTimestamps(scenes: ScenePrompt[]): ScenePrompt[] {
  let currentTime = 0;
  return scenes.map(scene => {
    const start = formatTimecode(currentTime);
    const dur = Math.max(1, scene.duration || 4);
    currentTime += dur;
    const end = formatTimecode(currentTime);
    return {
      ...scene,
      duration: dur,
      startTime: start,
      endTime: end
    };
  });
}

/**
 * Automatically adjusts scene durations so that scene cuts snap cleanly
 * onto detected audio peak drops.
 */
export function snapScenesToBeats(
  storyboard: ScenePrompt[],
  detectedPeaks: AudioBeatDrop[],
  audioDuration: number,
  options: SnapToBeatsOptions = {}
): SnapResult {
  if (!storyboard || storyboard.length === 0) {
    return {
      updatedStoryboard: [],
      stats: {
        totalScenes: 0,
        snappedCutsCount: 0,
        majorDropsMatched: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalDuration: 0,
        detectedDropsCount: 0,
        detectedPeaksCount: 0
      },
      matchedDrops: []
    };
  }

  const {
    mode = 'snap_existing',
    minSceneDuration = 1.5,
    maxSceneDuration = 14.0,
    precision = 0.5,
    fitAudioDuration = (audioDuration > 0)
  } = options;

  const totalScenes = storyboard.length;
  const dropsCount = detectedPeaks.filter(p => p.isDrop).length;

  // If there's only 1 scene, simply adjust its duration
  if (totalScenes === 1) {
    const singleDur = (audioDuration && audioDuration > 0 && fitAudioDuration)
      ? roundToPrecision(audioDuration, precision)
      : Math.max(minSceneDuration, storyboard[0].duration || 4);
    const updated = [{
      ...storyboard[0],
      duration: singleDur,
      startTime: '0:00',
      endTime: formatTimecode(singleDur)
    }];
    return {
      updatedStoryboard: updated,
      stats: {
        totalScenes: 1,
        snappedCutsCount: 0,
        majorDropsMatched: 0,
        avgDuration: singleDur,
        minDuration: singleDur,
        maxDuration: singleDur,
        totalDuration: singleDur,
        detectedDropsCount: dropsCount,
        detectedPeaksCount: detectedPeaks.length
      },
      matchedDrops: []
    };
  }

  // Calculate current cut timestamps: C_0 = 0, C_1 = d_0, C_2 = d_0 + d_1, ...
  const currentCuts: number[] = [0];
  let runningTime = 0;
  for (let i = 0; i < totalScenes; i++) {
    runningTime += (storyboard[i].duration || 4);
    currentCuts.push(runningTime);
  }
  const originalTotalDuration = runningTime;
  const targetEnd = (fitAudioDuration && audioDuration > 0) ? audioDuration : originalTotalDuration;

  // We need to place (totalScenes - 1) internal cut boundaries
  const internalCutsCount = totalScenes - 1;
  const newCuts: number[] = [0];
  const matchedDrops: AudioBeatDrop[] = [];
  let snappedCount = 0;
  let majorDropsMatched = 0;

  if (mode === 'distribute_drops' && detectedPeaks.length >= internalCutsCount) {
    // Mode: Distribute scene cuts across the highest-scoring peaks across the track
    // Select the best peaks that partition targetEnd into balanced segments
    const candidatePeaks = [...detectedPeaks].sort((a, b) => b.score - a.score);
    // Take top peaks within reasonable timeline bounds
    const validPeaks = candidatePeaks
      .filter(p => p.time >= minSceneDuration && p.time <= targetEnd - minSceneDuration)
      .slice(0, Math.max(internalCutsCount * 2, 10))
      .sort((a, b) => a.time - b.time);

    // Greedy forward selection with minimum scene duration guarantee
    let lastCut = 0;
    for (let k = 0; k < internalCutsCount; k++) {
      const remainingCuts = internalCutsCount - k;
      const idealCut = lastCut + (targetEnd - lastCut) / (remainingCuts + 1);
      const minAllowable = lastCut + minSceneDuration;
      const maxAllowable = targetEnd - (remainingCuts * minSceneDuration);

      // Find closest peak to idealCut within [minAllowable, maxAllowable]
      let bestPeak: AudioBeatDrop | null = null;
      let minDistance = Infinity;

      for (const p of validPeaks) {
        if (p.time >= minAllowable && p.time <= maxAllowable) {
          const dist = Math.abs(p.time - idealCut) - (p.isDrop ? 1.0 : 0);
          if (dist < minDistance) {
            minDistance = dist;
            bestPeak = p;
          }
        }
      }

      const chosenTime = bestPeak
        ? bestPeak.time
        : roundToPrecision(Math.max(minAllowable, Math.min(idealCut, maxAllowable)), precision);

      if (bestPeak) {
        matchedDrops.push(bestPeak);
        snappedCount++;
        if (bestPeak.isDrop) majorDropsMatched++;
      }

      newCuts.push(chosenTime);
      lastCut = chosenTime;
    }
  } else {
    // Default Mode: 'snap_existing'
    // Scale or align each cut C_k to nearest detected peak drop within search radius
    const scale = targetEnd / (originalTotalDuration || 1);
    let lastCut = 0;

    for (let k = 1; k <= internalCutsCount; k++) {
      const originalCut = currentCuts[k];
      const scaledTarget = fitAudioDuration ? (originalCut * scale) : originalCut;
      const remainingCuts = internalCutsCount - k + 1;
      const minAllowable = lastCut + minSceneDuration;
      const maxAllowable = targetEnd - (remainingCuts * minSceneDuration);

      // Search window around target (up to 3.0s or half the scene length)
      const windowRadius = Math.max(2.0, Math.min(3.5, (storyboard[k - 1].duration || 4) * 0.45));
      const windowStart = Math.max(minAllowable, scaledTarget - windowRadius);
      const windowEnd = Math.min(maxAllowable, scaledTarget + windowRadius);

      // Find best peak in search window
      let bestPeak: AudioBeatDrop | null = null;
      let bestScore = -Infinity;

      for (const peak of detectedPeaks) {
        if (peak.time >= windowStart && peak.time <= windowEnd) {
          const timeDist = Math.abs(peak.time - scaledTarget);
          // Candidate scoring: High peak score + penalty for distance from current cut
          const distancePenalty = (timeDist / windowRadius) * 0.5;
          const candidateScore = peak.score - distancePenalty + (peak.isDrop ? 0.35 : 0);

          if (candidateScore > bestScore) {
            bestScore = candidateScore;
            bestPeak = peak;
          }
        }
      }

      let chosenTime = scaledTarget;
      if (bestPeak) {
        chosenTime = bestPeak.time;
        matchedDrops.push(bestPeak);
        snappedCount++;
        if (bestPeak.isDrop) majorDropsMatched++;
      }

      // Constrain within allowable bounds and round
      chosenTime = Math.max(minAllowable, Math.min(maxAllowable, chosenTime));
      chosenTime = roundToPrecision(chosenTime, precision);
      newCuts.push(chosenTime);
      lastCut = chosenTime;
    }
  }

  // Final cut is targetEnd
  newCuts.push(roundToPrecision(targetEnd, precision));

  // Compute final scene durations from new cut boundaries
  const updatedStoryboard: ScenePrompt[] = [];
  let totalDur = 0;
  let minDur = Infinity;
  let maxDur = -Infinity;

  for (let i = 0; i < totalScenes; i++) {
    let dur = roundToPrecision(newCuts[i + 1] - newCuts[i], precision);
    dur = Math.max(minSceneDuration, Math.min(maxSceneDuration, dur));

    if (dur < minDur) minDur = dur;
    if (dur > maxDur) maxDur = dur;
    totalDur += dur;

    updatedStoryboard.push({
      ...storyboard[i],
      duration: dur
    });
  }

  // Ensure timestamps are cleanly synchronized
  const synchronizedScenes = recalculateSceneTimestamps(updatedStoryboard);
  const avgDuration = roundToPrecision(totalDur / totalScenes, 0.1);

  return {
    updatedStoryboard: synchronizedScenes,
    stats: {
      totalScenes,
      snappedCutsCount: snappedCount,
      majorDropsMatched,
      avgDuration,
      minDuration: minDur === Infinity ? 4 : minDur,
      maxDuration: maxDur === -Infinity ? 4 : maxDur,
      totalDuration: roundToPrecision(totalDur, 0.1),
      detectedDropsCount: dropsCount,
      detectedPeaksCount: detectedPeaks.length
    },
    matchedDrops
  };
}

// ---------------------------------------------------------------------------
// Beat-Driven Scene Segmentation Engine
// ---------------------------------------------------------------------------

export interface BeatSegmentationOptions {
  minSceneDurationToSplit?: number; // Minimum scene length in seconds to be eligible for split (default: 4.0s)
  minSubClipDuration?: number;      // Minimum length of each resulting subclip in seconds (default: 1.5s)
  sensitivity?: number;              // 0 to 100 (default: 50) - sensitivity to audio intensity shifts and drops
  cameraPacingVariation?: 'dynamic_kinetic' | 'angle_alternation' | 'whip_pan_action' | 'preserve_original';
  maxSplitsPerScene?: number;       // 1 (splits in 2) or 2 (splits in 3), default: 1
  onlySelectedScenes?: boolean;     // If true, only split scenes where isSelected is true
}

export interface IntensityShiftPoint {
  time: number;                  // Timestamp in seconds
  relativeTime: number;          // Offset in seconds from scene start
  intensity: number;             // Raw intensity (0-255)
  shiftMagnitude: number;        // Shift prominence or attack surge (0-1)
  isDrop: boolean;
  type: 'drop' | 'surge' | 'breakdown' | 'peak';
  description: string;
}

export interface SceneSplitPreviewItem {
  originalSceneIndex: number;
  originalSceneId: string;
  originalLyric: string;
  startTime: number;
  endTime: number;
  duration: number;
  willSplit: boolean;
  shiftPoints: IntensityShiftPoint[];
  resultingSubClips: Array<{
    duration: number;
    startTime: string;
    endTime: string;
    label: string;
    cameraMovement?: string;
  }>;
  reason?: string;
}

export interface BeatSegmentationResult {
  updatedStoryboard: ScenePrompt[];
  stats: {
    originalSceneCount: number;
    newSceneCount: number;
    scenesSplitCount: number;
    totalNewClipsAdded: number;
    avgDurationBefore: number;
    avgDurationAfter: number;
    totalDuration: number;
    majorDropsUtilized: number;
  };
  splitDetails: SceneSplitPreviewItem[];
}

function generateLocalUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'seg_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
}

const CAMERA_CHOREOGRAPHY_PRESETS = {
  dynamic_kinetic: [
    'Wide establishing tracking shot',
    'Dynamic rapid push-in crash zoom on the beat drop',
    'Handheld kinetic pan following rhythmic shift'
  ],
  angle_alternation: [
    'Wide panoramic master shot',
    'Dramatic medium close-up shot focused on performer',
    'Low-angle hero perspective shot'
  ],
  whip_pan_action: [
    'Smooth dolly-in track',
    'High-speed whip pan cut syncing to the audio surge',
    'Fast Dutch-angle tilt on the breakdown'
  ],
  preserve_original: []
};

/**
 * Analyzes storyboard scenes and audio data to identify scenes that exceed
 * the duration threshold and contain significant audio intensity shifts.
 */
export function previewBeatSegmentation(
  storyboard: ScenePrompt[],
  audioIntensityData: number[] | null,
  audioDuration: number,
  detectedPeaks: AudioBeatDrop[],
  options: BeatSegmentationOptions = {}
): SceneSplitPreviewItem[] {
  if (!storyboard || storyboard.length === 0) return [];

  const {
    minSceneDurationToSplit = 4.0,
    minSubClipDuration = 1.5,
    sensitivity = 50,
    cameraPacingVariation = 'dynamic_kinetic',
    maxSplitsPerScene = 1,
    onlySelectedScenes = false
  } = options;

  const secondsPerPoint = (audioIntensityData && audioIntensityData.length > 0 && audioDuration > 0)
    ? audioDuration / audioIntensityData.length
    : 0.1;

  // Track statistical profile for thresholding
  let meanIntensity = 100;
  if (audioIntensityData && audioIntensityData.length > 0) {
    let sum = 0;
    for (let i = 0; i < audioIntensityData.length; i++) sum += audioIntensityData[i];
    meanIntensity = sum / audioIntensityData.length;
  }

  // Calculate cumulative scene time boundaries
  let cumulativeTime = 0;
  const previews: SceneSplitPreviewItem[] = [];

  for (let idx = 0; idx < storyboard.length; idx++) {
    const scene = storyboard[idx];
    const dur = Math.max(1, scene.duration || 4);
    const sceneStart = cumulativeTime;
    const sceneEnd = cumulativeTime + dur;
    cumulativeTime = sceneEnd;

    // Check basic eligibility
    if (onlySelectedScenes && !scene.isSelected) {
      previews.push({
        originalSceneIndex: idx,
        originalSceneId: scene.id,
        originalLyric: scene.lyric,
        startTime: sceneStart,
        endTime: sceneEnd,
        duration: dur,
        willSplit: false,
        shiftPoints: [],
        resultingSubClips: [{
          duration: dur,
          startTime: formatTimecode(sceneStart),
          endTime: formatTimecode(sceneEnd),
          label: `Scene #${idx + 1}`
        }],
        reason: 'Scene not selected'
      });
      continue;
    }

    if (dur < minSceneDurationToSplit) {
      previews.push({
        originalSceneIndex: idx,
        originalSceneId: scene.id,
        originalLyric: scene.lyric,
        startTime: sceneStart,
        endTime: sceneEnd,
        duration: dur,
        willSplit: false,
        shiftPoints: [],
        resultingSubClips: [{
          duration: dur,
          startTime: formatTimecode(sceneStart),
          endTime: formatTimecode(sceneEnd),
          label: `Scene #${idx + 1}`
        }],
        reason: `Duration (${dur.toFixed(1)}s) is below split threshold (${minSceneDurationToSplit}s)`
      });
      continue;
    }

    // Search window inside scene that guarantees each sub-clip is at least minSubClipDuration
    const validWindowStart = sceneStart + minSubClipDuration;
    const validWindowEnd = sceneEnd - minSubClipDuration;

    if (validWindowEnd <= validWindowStart) {
      previews.push({
        originalSceneIndex: idx,
        originalSceneId: scene.id,
        originalLyric: scene.lyric,
        startTime: sceneStart,
        endTime: sceneEnd,
        duration: dur,
        willSplit: false,
        shiftPoints: [],
        resultingSubClips: [{
          duration: dur,
          startTime: formatTimecode(sceneStart),
          endTime: formatTimecode(sceneEnd),
          label: `Scene #${idx + 1}`
        }],
        reason: 'Scene duration too short for two minimum clips'
      });
      continue;
    }

    // 1. Check for detected peaks and major drops inside this window
    const candidateShifts: IntensityShiftPoint[] = [];

    if (detectedPeaks && detectedPeaks.length > 0) {
      for (const peak of detectedPeaks) {
        if (peak.time >= validWindowStart && peak.time <= validWindowEnd) {
          const rel = peak.time - sceneStart;
          candidateShifts.push({
            time: peak.time,
            relativeTime: Math.round(rel * 10) / 10,
            intensity: peak.intensity,
            shiftMagnitude: peak.surge > 0 ? peak.surge : (peak.intensity / 255),
            isDrop: peak.isDrop,
            type: peak.isDrop ? 'drop' : (peak.surge >= 0.2 ? 'surge' : 'peak'),
            description: peak.isDrop 
              ? `⚡ Major Drop at ${formatTimecode(peak.time)} (+${Math.round(peak.surge * 100)}% surge)`
              : `• Beat Peak at ${formatTimecode(peak.time)} (Energy: ${peak.intensity})`
          });
        }
      }
    }

    // 2. Also check raw intensity data for steep gradient jumps/drops not flagged as peaks
    if (audioIntensityData && audioIntensityData.length > 0) {
      const startIndex = Math.max(0, Math.floor(validWindowStart / secondsPerPoint));
      const endIndex = Math.min(audioIntensityData.length - 1, Math.ceil(validWindowEnd / secondsPerPoint));

      // Sensitivity factor: 0 (strict, 0.40 shift) to 100 (sensitive, 0.15 shift)
      const shiftThreshold = Math.max(0.12, 0.40 - (sensitivity / 100) * 0.28);

      for (let i = startIndex + 2; i <= endIndex - 2; i += 2) {
        const t = Math.round((i * secondsPerPoint) * 10) / 10;
        if (t < validWindowStart || t > validWindowEnd) continue;

        // Skip if very close to an already identified candidate peak (< 0.8s)
        const closeToExisting = candidateShifts.some(c => Math.abs(c.time - t) < 0.8);
        if (closeToExisting) continue;

        const currentVal = audioIntensityData[i];
        const prevVal = audioIntensityData[Math.max(0, i - 4)]; // 0.4s prior
        const delta = (currentVal - prevVal) / 255;

        if (delta >= shiftThreshold && currentVal >= meanIntensity * 0.7) {
          candidateShifts.push({
            time: t,
            relativeTime: Math.round((t - sceneStart) * 10) / 10,
            intensity: currentVal,
            shiftMagnitude: Math.round(delta * 100) / 100,
            isDrop: delta >= 0.25,
            type: delta >= 0.25 ? 'surge' : 'peak',
            description: `📈 Energy Surge at ${formatTimecode(t)} (+${Math.round(delta * 100)}% shift)`
          });
        }
      }
    }

    // Sort candidate shifts by magnitude and priority (drops first, then largest surge)
    candidateShifts.sort((a, b) => {
      if (a.isDrop !== b.isDrop) return a.isDrop ? -1 : 1;
      return b.shiftMagnitude - a.shiftMagnitude;
    });

    // Enforce minimum distance between multiple split points in the same scene
    const selectedPoints: IntensityShiftPoint[] = [];
    for (const cand of candidateShifts) {
      if (selectedPoints.length >= maxSplitsPerScene) break;
      const tooClose = selectedPoints.some(p => Math.abs(p.time - cand.time) < minSubClipDuration);
      if (!tooClose) {
        selectedPoints.push(cand);
      }
    }

    // If no candidate shifts were detected, check if scene is very long (> 7.0s)
    // and split at midway beat drop or golden ratio
    if (selectedPoints.length === 0 && dur >= 7.0) {
      const midTime = Math.round((sceneStart + dur * 0.5) * 10) / 10;
      selectedPoints.push({
        time: midTime,
        relativeTime: Math.round((midTime - sceneStart) * 10) / 10,
        intensity: Math.round(meanIntensity),
        shiftMagnitude: 0.25,
        isDrop: false,
        type: 'surge',
        description: `Tempo rebalance cut at ${formatTimecode(midTime)}`
      });
    }

    if (selectedPoints.length === 0) {
      previews.push({
        originalSceneIndex: idx,
        originalSceneId: scene.id,
        originalLyric: scene.lyric,
        startTime: sceneStart,
        endTime: sceneEnd,
        duration: dur,
        willSplit: false,
        shiftPoints: [],
        resultingSubClips: [{
          duration: dur,
          startTime: formatTimecode(sceneStart),
          endTime: formatTimecode(sceneEnd),
          label: `Scene #${idx + 1}`
        }],
        reason: 'No significant audio intensity shift found inside scene bounds'
      });
      continue;
    }

    // Sort selected split points chronologically
    selectedPoints.sort((a, b) => a.time - b.time);

    // Build preview sub-clips
    const subClips: Array<{
      duration: number;
      startTime: string;
      endTime: string;
      label: string;
      cameraMovement?: string;
    }> = [];

    const cutTimes = [sceneStart, ...selectedPoints.map(p => p.time), sceneEnd];
    const cameraPresets = CAMERA_CHOREOGRAPHY_PRESETS[cameraPacingVariation] || [];

    for (let c = 0; c < cutTimes.length - 1; c++) {
      const clipStart = cutTimes[c];
      const clipEnd = cutTimes[c + 1];
      const clipDur = Math.round((clipEnd - clipStart) * 10) / 10;
      const subIndex = String.fromCharCode(65 + c); // A, B, C...

      let cameraMovement = scene.cameraMovement;
      if (cameraPresets.length > 0) {
        cameraMovement = cameraPresets[c % cameraPresets.length];
      }

      subClips.push({
        duration: clipDur,
        startTime: formatTimecode(clipStart),
        endTime: formatTimecode(clipEnd),
        label: `Scene #${idx + 1}${subIndex}`,
        cameraMovement
      });
    }

    previews.push({
      originalSceneIndex: idx,
      originalSceneId: scene.id,
      originalLyric: scene.lyric,
      startTime: sceneStart,
      endTime: sceneEnd,
      duration: dur,
      willSplit: true,
      shiftPoints: selectedPoints,
      resultingSubClips: subClips
    });
  }

  return previews;
}

/**
 * Executes beat-driven scene segmentation on a storyboard.
 * Splits scenes when significant intensity shifts or drops are detected.
 */
export function segmentStoryboardByBeats(
  storyboard: ScenePrompt[],
  audioIntensityData: number[] | null,
  audioDuration: number,
  detectedPeaks: AudioBeatDrop[],
  options: BeatSegmentationOptions = {}
): BeatSegmentationResult {
  const previews = previewBeatSegmentation(
    storyboard,
    audioIntensityData,
    audioDuration,
    detectedPeaks,
    options
  );

  const updatedStoryboard: ScenePrompt[] = [];
  let scenesSplitCount = 0;
  let totalNewClipsAdded = 0;
  let majorDropsUtilized = 0;

  for (const item of previews) {
    const original = storyboard[item.originalSceneIndex] || storyboard.find(s => s.id === item.originalSceneId);
    if (!original) continue;

    if (!item.willSplit || item.resultingSubClips.length <= 1) {
      updatedStoryboard.push({ ...original });
      continue;
    }

    scenesSplitCount++;
    totalNewClipsAdded += (item.resultingSubClips.length - 1);

    item.shiftPoints.forEach(sp => {
      if (sp.isDrop) majorDropsUtilized++;
    });

    // Create sub-clips
    for (let c = 0; c < item.resultingSubClips.length; c++) {
      const subInfo = item.resultingSubClips[c];
      const partLetter = String.fromCharCode(65 + c);
      const isFirstClip = c === 0;

      // Retain or adapt prompts
      const partDescription = original.description 
        ? `${original.description} [Clip ${partLetter} - ${subInfo.cameraMovement || 'Dynamic Cut'}]`
        : original.description;

      const subScene: ScenePrompt = {
        ...original,
        id: isFirstClip ? original.id : generateLocalUUID(),
        duration: subInfo.duration,
        startTime: subInfo.startTime,
        endTime: subInfo.endTime,
        cameraMovement: subInfo.cameraMovement || original.cameraMovement,
        description: partDescription,
        // For subclips, append a part tag to lyric if lyric is present
        lyric: original.lyric ? `${original.lyric} (${partLetter})` : original.lyric,
        // Retain generated image on the first clip, let user regenerate for subsequent sub-clips
        generatedImage: isFirstClip ? original.generatedImage : undefined,
        imageFilename: isFirstClip ? original.imageFilename : undefined,
        videoStatus: 'idle',
        videoUrl: undefined
      };

      updatedStoryboard.push(subScene);
    }
  }

  // Recalculate timestamps to ensure exact cumulative alignment
  const synchronized = recalculateSceneTimestamps(updatedStoryboard);

  let totalDurBefore = 0;
  storyboard.forEach(s => totalDurBefore += (s.duration || 4));
  let totalDurAfter = 0;
  synchronized.forEach(s => totalDurAfter += (s.duration || 4));

  return {
    updatedStoryboard: synchronized,
    stats: {
      originalSceneCount: storyboard.length,
      newSceneCount: synchronized.length,
      scenesSplitCount,
      totalNewClipsAdded,
      avgDurationBefore: roundToPrecision(totalDurBefore / storyboard.length, 0.1),
      avgDurationAfter: roundToPrecision(totalDurAfter / synchronized.length, 0.1),
      totalDuration: roundToPrecision(totalDurAfter, 0.1),
      majorDropsUtilized
    },
    splitDetails: previews
  };
}

