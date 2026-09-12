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
