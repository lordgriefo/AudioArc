import React, { useMemo, useState } from 'react';
import {
  Palette,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  RefreshCw,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  SlidersHorizontal,
  UserCheck,
  Film,
  Loader2,
  Check,
  Wand2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ScenePrompt, VisualReference } from './App';
import {
  AppliedColorGradeMeta,
  CINEMATIC_COLOR_PROFILES,
  ColorGradeProfile,
  applyColorGradeToPrompt,
  detectAppliedColorGrade,
  removeColorGradeFromPrompt,
} from './colorGradingEngine';

interface ShotLogViewProps {
  storyboard: ScenePrompt[];
  visualRefs: VisualReference[];
  selectedStyle: { id?: string; name: string; visualDetails?: string };
  projectName?: string;
  generatingImageIndex?: number | null;
  onUpdateStoryboard: (updated: ScenePrompt[], actionLabel: string) => void;
  onOpenColorGradeForScene: (sceneIndex: number | null) => void;
  onGenerateImage?: (sceneIndex: number) => void;
  onJumpToSceneCard?: (sceneIndex: number) => void;
  onNotification?: (message: string) => void;
}

type ShotLogSortBy = 'scene-order' | 'duration' | 'group-name' | 'grade-intensity';
type SortDirection = 'asc' | 'desc';

interface AuditedShot {
  scene: ScenePrompt;
  index: number;
  grade: AppliedColorGradeMeta | null;
  gradeIntensity: number;
  gradeIntensityLabel: string;
  linkedRefs: VisualReference[];
  hasImage: boolean;
  consistency: 'dominant' | 'variant' | 'ungraded';
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return { h: 0, s: 0, l: 0.5 };
  }
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
}

/**
 * Computes a deterministic 0-100 visual intensity score for an applied color grade
 * combining palette chroma/saturation, tonal contrast range, and contrast/stylization directives.
 */
function computeColorGradeIntensity(grade: AppliedColorGradeMeta | null): { score: number; label: string } {
  if (!grade) return { score: 0, label: 'None' };

  const swatches = grade.swatches || [];
  let avgSat = 0.35;
  let maxSat = 0.45;
  let lumRange = 0.6;

  if (swatches.length > 0) {
    const hsls = swatches.map((sw) => hexToHsl(sw.hex));
    avgSat = hsls.reduce((acc, c) => acc + c.s, 0) / hsls.length;
    maxSat = Math.max(...hsls.map((c) => c.s));
    const lums = hsls.map((c) => c.l);
    lumRange = Math.max(...lums) - Math.min(...lums);
  }

  const descriptorText = `${grade.name} ${grade.category} ${grade.contrast || ''} ${grade.clause || ''}`.toLowerCase();

  let stylizationBoost = 0;
  if (/extreme|hyper-vivid|hyper-saturated|blown-out|psychedelic|radioactive/.test(descriptorText)) {
    stylizationBoost += 26;
  } else if (/dramatic|bleach bypass|chiaroscuro|crushed|intense|punchy|high contrast|neon|blockbuster/.test(descriptorText)) {
    stylizationBoost += 18;
  } else if (/high|vivid|saturated|cross-processed|sultry/.test(descriptorText)) {
    stylizationBoost += 12;
  } else if (/soft|pastel|muted|subtle|ethereal|subdued|low-to-medium|low-mid|compressed/.test(descriptorText)) {
    stylizationBoost -= 10;
  }

  const categoryWeight: Record<string, number> = {
    neon: 14,
    arthouse: 10,
    blockbuster: 9,
    noir: 8,
    moody: 5,
    vintage: 3,
    'film-stock': 0,
  };
  const catBoost = categoryWeight[grade.category] ?? 2;

  const rawScore = avgSat * 34 + maxSat * 18 + lumRange * 28 + stylizationBoost + catBoost;
  const score = Math.max(12, Math.min(100, Math.round(rawScore)));

  const label =
    score >= 80 ? 'Extreme' : score >= 65 ? 'High' : score >= 45 ? 'Medium' : 'Subtle';

  return { score, label };
}

export const ShotLogView: React.FC<ShotLogViewProps> = ({
  storyboard,
  visualRefs,
  selectedStyle,
  projectName,
  generatingImageIndex = null,
  onUpdateStoryboard,
  onOpenColorGradeForScene,
  onGenerateImage,
  onJumpToSceneCard,
  onNotification,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'with-images' | 'graded' | 'needs-audit'>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<ShotLogSortBy>('scene-order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'table' | 'contact-sheet'>('table');
  const [highlightedSceneId, setHighlightedSceneId] = useState<string | null>(null);
  const [inspectIndex, setInspectIndex] = useState<number | null>(null);

  const handleSortByChange = (nextSort: ShotLogSortBy) => {
    setSortBy(nextSort);
    if (nextSort === 'duration' || nextSort === 'grade-intensity') {
      setSortDirection('desc');
    } else {
      setSortDirection('asc');
    }
  };

  const refById = useMemo(() => {
    const map = new Map<string, VisualReference>();
    visualRefs.forEach((r) => map.set(r.id, r));
    return map;
  }, [visualRefs]);

  // Compute detected grades, dominant profile, and consistency across all scenes
  const auditSummary = useMemo(() => {
    const gradeCounts = new Map<string, { count: number; grade: AppliedColorGradeMeta }>();
    const detectedBySceneId = new Map<string, AppliedColorGradeMeta | null>();

    let withImagesCount = 0;
    let gradedCount = 0;

    storyboard.forEach((scene) => {
      if (scene.generatedImage) withImagesCount++;
      const detected = detectAppliedColorGrade(scene);
      detectedBySceneId.set(scene.id, detected);
      if (detected) {
        gradedCount++;
        const key = detected.profileId || detected.name;
        const existing = gradeCounts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          gradeCounts.set(key, { count: 1, grade: detected });
        }
      }
    });

    // Find dominant color grade (most frequent applied grade)
    let dominantKey: string | null = null;
    let dominantEntry: { count: number; grade: AppliedColorGradeMeta } | null = null;
    gradeCounts.forEach((entry, key) => {
      if (!dominantEntry || entry.count > dominantEntry.count) {
        dominantEntry = entry;
        dominantKey = key;
      }
    });

    const shots: AuditedShot[] = storyboard.map((scene, index) => {
      const grade = detectedBySceneId.get(scene.id) || null;
      const linkedRefs = (scene.linkedRefIds || [])
        .map((id) => refById.get(id))
        .filter((r): r is VisualReference => Boolean(r));

      let consistency: 'dominant' | 'variant' | 'ungraded' = 'ungraded';
      if (grade) {
        const key = grade.profileId || grade.name;
        consistency = !dominantKey || key === dominantKey ? 'dominant' : 'variant';
      }

      const { score: gradeIntensity, label: gradeIntensityLabel } = computeColorGradeIntensity(grade);

      return {
        scene,
        index,
        grade,
        gradeIntensity,
        gradeIntensityLabel,
        linkedRefs,
        hasImage: Boolean(scene.generatedImage),
        consistency,
      };
    });

    const dominantCount = dominantEntry ? (dominantEntry as { count: number; grade: AppliedColorGradeMeta }).count : 0;
    const dominantGrade = dominantEntry ? (dominantEntry as { count: number; grade: AppliedColorGradeMeta }).grade : null;
    const variantCount = shots.filter((s) => s.consistency === 'variant').length;
    const ungradedCount = shots.length - gradedCount;
    const consistencyPct =
      storyboard.length === 0
        ? 0
        : gradedCount === 0
        ? 0
        : Math.round((dominantCount / storyboard.length) * 100);

    const uniqueGrades = Array.from(gradeCounts.entries()).map(([key, val]) => ({
      key,
      name: val.grade.name,
      count: val.count,
      swatches: val.grade.swatches,
    }));

    return {
      shots,
      withImagesCount,
      gradedCount,
      ungradedCount,
      variantCount,
      dominantKey,
      dominantGrade,
      dominantCount,
      consistencyPct,
      uniqueGrades,
    };
  }, [storyboard, refById]);

  const filteredShots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = auditSummary.shots.filter((item) => {
      if (filterTab === 'with-images' && !item.hasImage) return false;
      if (filterTab === 'graded' && !item.grade) return false;
      if (filterTab === 'needs-audit' && item.consistency === 'dominant') return false;

      if (gradeFilter !== 'all') {
        if (gradeFilter === 'ungraded') {
          if (item.grade !== null) return false;
        } else {
          const itemKey = item.grade ? item.grade.profileId || item.grade.name : '';
          if (itemKey !== gradeFilter) return false;
        }
      }

      if (q) {
        const hay = [
          `scene ${item.index + 1}`,
          `sc ${item.index + 1}`,
          item.scene.groupName || '',
          item.scene.lyric || '',
          item.scene.description || '',
          item.scene.cameraMovement || '',
          item.grade?.name || 'ungraded',
          item.grade?.clause || '',
          ...item.linkedRefs.map((r) => r.name),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });

    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'duration') {
        const durA = Number(a.scene.duration ?? 0);
        const durB = Number(b.scene.duration ?? 0);
        if (durA !== durB) return (durA - durB) * dir;
        return a.index - b.index;
      }
      if (sortBy === 'group-name') {
        const groupA = (a.scene.groupName || '').trim();
        const groupB = (b.scene.groupName || '').trim();
        if (!groupA && groupB) return 1;
        if (groupA && !groupB) return -1;
        const cmp = groupA.localeCompare(groupB, undefined, { numeric: true, sensitivity: 'base' });
        if (cmp !== 0) return cmp * dir;
        return a.index - b.index;
      }
      if (sortBy === 'grade-intensity') {
        if (a.gradeIntensity !== b.gradeIntensity) {
          return (a.gradeIntensity - b.gradeIntensity) * dir;
        }
        return a.index - b.index;
      }
      return (a.index - b.index) * dir;
    });
  }, [auditSummary.shots, filterTab, gradeFilter, searchQuery, sortBy, sortDirection]);

  // Apply a profile directly to a single scene from the Shot Log
  const handleQuickAssignGrade = (sceneId: string, sceneIndex: number, profileId: string) => {
    if (profileId === '__clear__') {
      const updated = storyboard.map((s) => {
        if (s.id !== sceneId) return s;
        const { appliedColorGrade: _removed, ...rest } = s;
        return {
          ...rest,
          imagePrompt: removeColorGradeFromPrompt(s.imagePrompt || ''),
        };
      });
      onUpdateStoryboard(updated, `Cleared color grade on Scene ${sceneIndex + 1}`);
      onNotification?.(`Cleared color grade on Scene ${sceneIndex + 1}`);
      return;
    }

    const profile = CINEMATIC_COLOR_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;

    const updated = storyboard.map((s) => {
      if (s.id !== sceneId) return s;
      return {
        ...s,
        imagePrompt: applyColorGradeToPrompt(s.imagePrompt || '', profile.promptDirective),
        appliedColorGrade: {
          profileId: profile.id,
          name: profile.name,
          category: profile.category,
          badge: profile.badge,
          swatches: profile.swatches,
          colorTemperature: profile.colorTemperature,
          contrast: profile.contrast,
          clause: profile.promptDirective,
          appliedAt: new Date().toISOString(),
          source: 'profile' as const,
        },
      };
    });

    onUpdateStoryboard(updated, `Applied ${profile.name} grade to Scene ${sceneIndex + 1}`);
    onNotification?.(`Applied ${profile.name} to Scene ${sceneIndex + 1}`);
  };

  // Batch-unify all shots (or ungraded shots) to the dominant profile
  const handleUnifyToDominant = (onlyUngraded: boolean) => {
    const dom = auditSummary.dominantGrade;
    if (!dom) return;

    const matchedProfile: ColorGradeProfile | undefined = CINEMATIC_COLOR_PROFILES.find(
      (p) => p.id === dom.profileId
    );
    const directive = matchedProfile?.promptDirective || dom.clause;
    if (!directive) return;

    let changed = 0;
    const updated = storyboard.map((s) => {
      const current = detectAppliedColorGrade(s);
      if (onlyUngraded && current) return s;
      if (!onlyUngraded && current && (current.profileId || current.name) === (dom.profileId || dom.name)) {
        return s;
      }
      changed += 1;
      return {
        ...s,
        imagePrompt: applyColorGradeToPrompt(s.imagePrompt || '', directive),
        appliedColorGrade: {
          profileId: dom.profileId,
          name: dom.name,
          category: dom.category,
          badge: dom.badge || matchedProfile?.badge,
          swatches: dom.swatches,
          colorTemperature: dom.colorTemperature || matchedProfile?.colorTemperature,
          contrast: dom.contrast || matchedProfile?.contrast,
          clause: directive,
          appliedAt: new Date().toISOString(),
          source: 'profile' as const,
        },
      };
    });

    if (changed === 0) return;
    onUpdateStoryboard(
      updated,
      `Unified ${changed} scene(s) to ${dom.name} color grade`
    );
    onNotification?.(`Unified ${changed} scene(s) to "${dom.name}"`);
  };

  // Export dedicated Shot Log & Color Audit CSV
  const handleExportShotLogCsv = () => {
    const headers = [
      'Scene #',
      'Timecode',
      'Duration (s)',
      'Section',
      'Image Status',
      'Image Filename',
      'Linked References',
      'Applied Color Grade',
      'Category',
      'Grade Intensity',
      'Consistency',
      'Color Temperature',
      'Palette Hexes',
      'Color Grading Clause',
      'Camera Movement',
      'Action Summary',
    ];

    const rows = auditSummary.shots.map((item) => {
      const timecode =
        item.scene.startTime && item.scene.endTime
          ? `${item.scene.startTime} - ${item.scene.endTime}`
          : `${Number(item.scene.duration || 4).toFixed(1)}s`;
      const hexes = item.grade ? item.grade.swatches.map((sw) => `${sw.role}:${sw.hex}`).join(' | ') : '';
      const consistencyLabel =
        item.consistency === 'dominant'
          ? 'Matches Master Look'
          : item.consistency === 'variant'
          ? 'Variant Grade'
          : 'Ungraded';

      return [
        String(item.index + 1),
        timecode,
        String(item.scene.duration ?? 4),
        item.scene.groupName || '',
        item.hasImage ? 'Generated' : 'Pending',
        item.scene.imageFilename || (item.hasImage ? `scene_${String(item.index + 1).padStart(2, '0')}.png` : ''),
        item.linkedRefs.map((r) => r.name).join('; '),
        item.grade?.name || 'Ungraded',
        item.grade?.category || '',
        item.grade ? `${item.gradeIntensity}/100 (${item.gradeIntensityLabel})` : '0/100 (None)',
        consistencyLabel,
        item.grade?.colorTemperature || '',
        hexes,
        item.grade?.clause || '',
        item.scene.cameraMovement && item.scene.cameraMovement !== 'none' ? item.scene.cameraMovement : 'Auto',
        item.scene.description || item.scene.lyric || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });

    const csv = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const slug = (projectName || 'audioarc').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    a.download = `${slug}_shot_log_color_audit.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    onNotification?.('Shot Log & Color Audit CSV downloaded!');
  };

  const scrollToShot = (sceneId: string) => {
    setHighlightedSceneId(sceneId);
    const el = document.getElementById(`shotlog-row-${sceneId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedSceneId((curr) => (curr === sceneId ? null : curr));
    }, 2200);
  };

  const inspectedShot = inspectIndex !== null ? auditSummary.shots[inspectIndex] : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Aesthetic Consistency Audit Dashboard */}
      <div className="bg-[#111319] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-300">
              <Palette size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Shot Log &amp; Aesthetic Consistency Audit
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
                  Style: {selectedStyle?.name || 'Cinematic'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Audit every generated frame alongside linked cast references and applied color grades to catch tonal drift before rendering.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {auditSummary.dominantGrade && (auditSummary.ungradedCount > 0 || auditSummary.variantCount > 0) && (
              <button
                type="button"
                onClick={() => handleUnifyToDominant(auditSummary.ungradedCount > 0 && auditSummary.variantCount > 0)}
                className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title={`Apply ${auditSummary.dominantGrade.name} to remaining scenes`}
              >
                <Wand2 size={13} />
                <span>
                  {auditSummary.ungradedCount > 0
                    ? `Grade ${auditSummary.ungradedCount} Ungraded -> ${auditSummary.dominantGrade.name.split(' ')[0]}`
                    : `Unify All to ${auditSummary.dominantGrade.name.split(' ')[0]}`}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenColorGradeForScene(null)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <SlidersHorizontal size={13} />
              <span>Color Grader</span>
            </button>
            <button
              type="button"
              onClick={handleExportShotLogCsv}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Download Shot Log & Color Grade Audit spreadsheet (.csv)"
            >
              <FileSpreadsheet size={13} className="text-emerald-400" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Generated Frames Coverage */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-gray-400">
              <span>Generated Frames</span>
              <ImageIcon size={12} className="text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-white font-mono">
                {auditSummary.withImagesCount}
              </span>
              <span className="text-xs text-gray-500 font-mono">/ {storyboard.length} shots</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{
                  width: `${storyboard.length > 0 ? Math.round((auditSummary.withImagesCount / storyboard.length) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Color Grade Coverage */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-gray-400">
              <span>Graded Coverage</span>
              <Palette size={12} className="text-purple-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-white font-mono">
                {auditSummary.gradedCount}
              </span>
              <span className="text-xs text-gray-500 font-mono">/ {storyboard.length} graded</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{
                  width: `${storyboard.length > 0 ? Math.round((auditSummary.gradedCount / storyboard.length) * 100) : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Dominant Look */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-gray-400">
              <span>Dominant Color Grade</span>
              <Sparkles size={12} className="text-amber-400" />
            </div>
            {auditSummary.dominantGrade ? (
              <>
                <div className="text-xs font-bold text-white truncate" title={auditSummary.dominantGrade.name}>
                  {auditSummary.dominantGrade.name}
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {auditSummary.dominantGrade.swatches.map((sw, i) => (
                    <div
                      key={i}
                      className="h-2.5 flex-1 rounded-sm border border-white/15"
                      style={{ backgroundColor: sw.hex }}
                      title={`${sw.name} (${sw.role}): ${sw.hex}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-500 italic pt-1">No color grades applied yet</div>
            )}
          </div>

          {/* Aesthetic Cohesion Status */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-gray-400">
              <span>Look Consistency</span>
              {auditSummary.consistencyPct >= 80 ? (
                <CheckCircle2 size={12} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={12} className="text-amber-400" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-lg font-bold font-mono ${
                  auditSummary.consistencyPct >= 80
                    ? 'text-emerald-400'
                    : auditSummary.consistencyPct >= 40
                    ? 'text-amber-300'
                    : 'text-gray-400'
                }`}
              >
                {auditSummary.consistencyPct}%
              </span>
              <span className="text-[11px] text-gray-400">
                {auditSummary.uniqueGrades.length === 0
                  ? 'Ungraded'
                  : `${auditSummary.uniqueGrades.length} look${auditSummary.uniqueGrades.length === 1 ? '' : 's'} active`}
              </span>
            </div>
            <div className="text-[10px] text-gray-500 truncate">
              {auditSummary.variantCount > 0 && `${auditSummary.variantCount} variant`}
              {auditSummary.variantCount > 0 && auditSummary.ungradedCount > 0 && ' · '}
              {auditSummary.ungradedCount > 0 && `${auditSummary.ungradedCount} ungraded`}
              {auditSummary.variantCount === 0 && auditSummary.ungradedCount === 0 && 'All shots unified'}
            </div>
          </div>
        </div>

        {/* Project Chromatic Timeline Strip */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase font-bold tracking-wider">
            <span>Timeline Chromatic Continuity Strip (Click any beat to jump)</span>
            <span className="font-mono text-gray-500">SC 01 -&gt; SC {String(storyboard.length).padStart(2, '0')}</span>
          </div>
          <div className="flex items-stretch h-5 rounded-lg overflow-hidden border border-white/15 bg-black/60 gap-[1px]">
            {auditSummary.shots.map((item) => {
              const sw = item.grade?.swatches;
              const bgStyle = sw && sw.length >= 3
                ? {
                    background: `linear-gradient(135deg, ${sw[0].hex} 0%, ${sw[1].hex} 45%, ${sw[2].hex} 80%, ${(sw[3] || sw[2]).hex} 100%)`,
                  }
                : undefined;

              return (
                <button
                  key={item.scene.id}
                  type="button"
                  onClick={() => scrollToShot(item.scene.id)}
                  style={bgStyle}
                  className={`flex-1 min-w-[6px] relative group transition-all hover:opacity-100 ${
                    item.grade ? 'opacity-90' : 'bg-zinc-800/80 hover:bg-zinc-700'
                  } ${
                    item.consistency === 'variant' ? 'ring-1 ring-inset ring-amber-400/80' : ''
                  }`}
                  title={`Scene ${item.index + 1} (${item.scene.startTime || '0:00'}): ${
                    item.grade ? item.grade.name : 'Ungraded'
                  }${item.hasImage ? ' [Image Ready]' : ' [No Image]'}`}
                >
                  {item.hasImage && (
                    <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-white/80 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter & View Density Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#111319] border border-white/10 rounded-xl p-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: `All Shots (${storyboard.length})` },
            { id: 'with-images', label: `Generated Images (${auditSummary.withImagesCount})` },
            { id: 'graded', label: `Graded (${auditSummary.gradedCount})` },
            {
              id: 'needs-audit',
              label: `Audit Queue (${auditSummary.ungradedCount + auditSummary.variantCount})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterTab === tab.id
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Color Grade Profile Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 outline-none focus:border-purple-500"
            title="Filter shots by applied color grade"
          >
            <option value="all">All Color Grades</option>
            {auditSummary.uniqueGrades.map((g) => (
              <option key={g.key} value={g.key}>
                {g.name} ({g.count})
              </option>
            ))}
            {auditSummary.ungradedCount > 0 && (
              <option value="ungraded">Ungraded Only ({auditSummary.ungradedCount})</option>
            )}
          </select>

          {/* Sort Order Dropdown & Direction Toggle */}
          <div className="flex items-center bg-black/60 border border-white/15 rounded-lg overflow-hidden focus-within:border-amber-500">
            <div className="pl-2 pr-1 text-gray-500 flex items-center pointer-events-none">
              <ArrowUpDown size={12} />
            </div>
            <select
              value={sortBy}
              onChange={(e) => handleSortByChange(e.target.value as ShotLogSortBy)}
              className="bg-transparent py-1.5 pr-2 text-xs text-gray-200 outline-none cursor-pointer"
              title="Sort shots by timeline order, duration, group name, or color grade intensity"
              aria-label="Sort shots"
            >
              <option value="scene-order" className="bg-[#111319] text-gray-200">
                Sort: Scene Order
              </option>
              <option value="duration" className="bg-[#111319] text-gray-200">
                Sort: Duration
              </option>
              <option value="group-name" className="bg-[#111319] text-gray-200">
                Sort: Group Name
              </option>
              <option value="grade-intensity" className="bg-[#111319] text-gray-200">
                Sort: Grade Intensity
              </option>
            </select>
            <button
              type="button"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-2 py-1.5 border-l border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex items-center"
              title={
                sortDirection === 'asc'
                  ? 'Ascending order — click to reverse'
                  : 'Descending order — click to reverse'
              }
              aria-label={`Sort direction: ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
            >
              {sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shot, grade, ref..."
              className="bg-black/60 border border-white/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500 w-44 sm:w-52"
            />
          </div>

          {/* Layout Mode Toggle */}
          <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-white/15">
            <button
              type="button"
              onClick={() => setLayoutMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                layoutMode === 'table' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-200'
              }`}
              title="Detailed Shot Log Table"
            >
              <List size={14} />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('contact-sheet')}
              className={`p-1.5 rounded-md transition-colors ${
                layoutMode === 'contact-sheet' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-200'
              }`}
              title="Visual Contact Sheet Grid"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Empty Filter State */}
      {filteredShots.length === 0 ? (
        <div className="bg-[#111319] border border-white/10 rounded-2xl p-10 text-center space-y-2">
          <ImageIcon size={28} className="mx-auto text-gray-600" />
          <p className="text-sm font-bold text-gray-300">No shots match the current audit filter.</p>
          <p className="text-xs text-gray-500">
            {filterTab === 'with-images'
              ? 'Generate images on your storyboard scenes first, or switch back to "All Shots".'
              : 'Try clearing your search or selecting "All Shots".'}
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterTab('all');
              setGradeFilter('all');
              setSearchQuery('');
            }}
            className="mt-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : layoutMode === 'table' ? (
        /* ================= AUDIT LOG TABLE VIEW ================= */
        <div className="space-y-3">
          {filteredShots.map((item) => {
            const { scene, index, grade, gradeIntensity, gradeIntensityLabel, linkedRefs, hasImage, consistency } = item;
            const isHighlighted = highlightedSceneId === scene.id;
            const isGeneratingThis = generatingImageIndex === index;

            return (
              <div
                key={scene.id}
                id={`shotlog-row-${scene.id}`}
                className={`bg-[#12141b] border rounded-xl p-3.5 transition-all grid grid-cols-1 lg:grid-cols-12 gap-4 items-start ${
                  isHighlighted
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                    : consistency === 'variant'
                    ? 'border-amber-500/35 hover:border-amber-500/60'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Col 1: Generated Frame Thumbnail (3 cols) */}
                <div className="lg:col-span-3 space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black/70 border border-white/10 group">
                    {hasImage && scene.generatedImage ? (
                      <>
                        <img
                          src={scene.generatedImage}
                          alt={`Scene ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.03]"
                          onClick={() => setInspectIndex(index)}
                        />
                        <button
                          type="button"
                          onClick={() => setInspectIndex(index)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/15"
                          title="Inspect full-size frame"
                        >
                          <Maximize2 size={13} />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center gap-1.5">
                        <ImageIcon size={20} className="text-gray-600" />
                        <span className="text-[11px] text-gray-500 font-medium">No frame rendered</span>
                        {onGenerateImage && (
                          <button
                            type="button"
                            disabled={isGeneratingThis}
                            onClick={() => onGenerateImage(index)}
                            className="px-2.5 py-1 rounded-md bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {isGeneratingThis ? (
                              <>
                                <Loader2 size={10} className="animate-spin" /> Rendering...
                              </>
                            ) : (
                              <>
                                <Sparkles size={10} /> Generate Frame
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Shot Number Overlay */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/15 text-[10px] font-mono font-bold text-white">
                      <span>SC {String(index + 1).padStart(2, '0')}</span>
                      <span className="text-gray-500">|</span>
                      <span className="text-cyan-300">{scene.startTime || '0:00'}</span>
                    </div>
                  </div>

                  {/* Color Swatch Ribbon directly under thumbnail for direct visual comparison */}
                  {grade ? (
                    <div className="flex items-center gap-1 h-2.5">
                      {grade.swatches.map((sw, i) => (
                        <div
                          key={i}
                          className="flex-1 h-full rounded-sm border border-white/15"
                          style={{ backgroundColor: sw.hex }}
                          title={`${sw.name} (${sw.role}): ${sw.hex}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-2.5 rounded-sm bg-white/5 border border-dashed border-white/10" title="No color grade swatches" />
                  )}
                </div>

                {/* Col 2: Shot Context & Linked Image References (4 cols) */}
                <div className="lg:col-span-4 space-y-2.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onJumpToSceneCard?.(index)}
                      className="text-xs font-bold text-white hover:text-cyan-300 transition-colors"
                      title="Jump to scene in Cards view"
                    >
                      Scene {index + 1}
                    </button>
                    {scene.groupName && (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
                        {scene.groupName}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-gray-500">
                      {scene.startTime || '0:00'} - {scene.endTime || '0:04'} ({Number(scene.duration || 4).toFixed(1)}s)
                    </span>
                    {scene.cameraMovement && scene.cameraMovement !== 'none' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-500/25 font-medium">
                        {scene.cameraMovement}
                      </span>
                    )}
                  </div>

                  {scene.lyric && (
                    <p className="text-xs text-gray-300 italic line-clamp-1">&ldquo;{scene.lyric}&rdquo;</p>
                  )}

                  {scene.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{scene.description}</p>
                  )}

                  {/* Linked Cast / Visual References */}
                  <div className="pt-1 border-t border-white/5 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                      <UserCheck size={11} className="text-teal-400" />
                      <span>Linked Visual References ({linkedRefs.length})</span>
                    </div>
                    {linkedRefs.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {linkedRefs.map((ref) => (
                          <div
                            key={ref.id}
                            className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-lg pr-2 p-0.5"
                            title={ref.description}
                          >
                            {ref.image ? (
                              <img
                                src={ref.image}
                                alt={ref.name}
                                className="w-6 h-6 rounded object-cover border border-white/10"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded bg-teal-950/60 border border-teal-500/30 flex items-center justify-center text-[10px] font-bold text-teal-300">
                                {ref.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-[11px] font-medium text-gray-200 max-w-[100px] truncate">
                              {ref.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-600">No character or visual references linked</span>
                    )}
                  </div>
                </div>

                {/* Col 3: Applied Color Grade & Audit Controls (5 cols) */}
                <div className="lg:col-span-5 bg-black/35 border border-white/5 rounded-xl p-3 space-y-2.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">
                          {grade ? grade.name : 'No Color Grade Applied'}
                        </span>
                        {grade?.badge && (
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-500/30">
                            {grade.badge}
                          </span>
                        )}
                        {grade && (
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                              gradeIntensity >= 80
                                ? 'bg-rose-950/50 text-rose-300 border-rose-500/30'
                                : gradeIntensity >= 65
                                ? 'bg-amber-950/50 text-amber-300 border-amber-500/30'
                                : gradeIntensity >= 45
                                ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/25'
                                : 'bg-white/5 text-gray-300 border-white/15'
                            }`}
                            title={`Color grade intensity score: ${gradeIntensity}/100 (${gradeIntensityLabel})`}
                          >
                            Intensity {gradeIntensity}
                          </span>
                        )}
                      </div>
                      {grade?.colorTemperature && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate" title={grade.colorTemperature}>
                          {grade.colorTemperature}
                        </p>
                      )}
                    </div>

                    {/* Consistency Status Pill */}
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        consistency === 'dominant'
                          ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
                          : consistency === 'variant'
                          ? 'bg-amber-950/50 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-900 text-gray-400 border-white/10'
                      }`}
                    >
                      {consistency === 'dominant' ? (
                        <>
                          <Check size={10} /> Master Look
                        </>
                      ) : consistency === 'variant' ? (
                        <>
                          <AlertTriangle size={10} /> Variant
                        </>
                      ) : (
                        'Ungraded'
                      )}
                    </span>
                  </div>

                  {/* Swatches with hex legend */}
                  {grade && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {grade.swatches.map((sw, i) => (
                        <div
                          key={i}
                          className="bg-black/50 border border-white/10 rounded-md p-1 flex items-center gap-1.5 min-w-0"
                          title={`${sw.name} (${sw.role}): ${sw.hex}`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/20"
                            style={{ backgroundColor: sw.hex }}
                          />
                          <div className="min-w-0 leading-tight">
                            <div className="text-[9px] text-gray-500 uppercase truncate">{sw.role}</div>
                            <div className="text-[9px] font-mono text-gray-300 truncate">{sw.hex}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Applied Prompt Clause */}
                  {grade?.clause && (
                    <p
                      className="text-[11px] font-mono text-gray-400 bg-black/40 border border-white/5 rounded-lg p-2 line-clamp-2 leading-relaxed"
                      title={grade.clause}
                    >
                      {grade.clause}
                    </p>
                  )}

                  {/* Quick Inline Grade Switcher & Actions */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <select
                      value={
                        grade && CINEMATIC_COLOR_PROFILES.some((p) => p.id === grade.profileId)
                          ? grade.profileId
                          : ''
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          handleQuickAssignGrade(scene.id, index, e.target.value);
                        }
                      }}
                      className="flex-1 min-w-[150px] bg-black/70 border border-white/15 rounded-lg px-2 py-1.5 text-[11px] text-gray-200 outline-none focus:border-purple-500"
                      title="Quickly apply or swap a cinematic color grade on this shot"
                    >
                      <option value="">
                        {grade ? 'Switch Color Grade...' : 'Assign Color Grade...'}
                      </option>
                      {CINEMATIC_COLOR_PROFILES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                      {grade && <option value="__clear__">Remove Color Grade</option>}
                    </select>

                    <button
                      type="button"
                      onClick={() => onOpenColorGradeForScene(index)}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 text-purple-200 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      title="Open full DI Color Grader for this scene"
                    >
                      <Palette size={11} />
                      <span>Grade</span>
                    </button>

                    {onGenerateImage && (
                      <button
                        type="button"
                        disabled={isGeneratingThis}
                        onClick={() => onGenerateImage(index)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-200 border border-white/10 text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                        title={hasImage ? 'Re-render frame with current color grade' : 'Generate scene frame'}
                      >
                        {isGeneratingThis ? (
                          <Loader2 size={11} className="animate-spin text-cyan-400" />
                        ) : (
                          <RefreshCw size={11} className="text-cyan-400" />
                        )}
                        <span>{hasImage ? 'Re-render' : 'Render'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= CONTACT SHEET VISUAL GRID ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredShots.map((item) => {
            const { scene, index, grade, gradeIntensity, linkedRefs, hasImage, consistency } = item;
            const isHighlighted = highlightedSceneId === scene.id;

            return (
              <div
                key={scene.id}
                id={`shotlog-row-${scene.id}`}
                className={`bg-[#12141b] border rounded-xl overflow-hidden flex flex-col transition-all ${
                  isHighlighted
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                    : consistency === 'variant'
                    ? 'border-amber-500/40'
                    : 'border-white/10 hover:border-white/25'
                }`}
              >
                {/* Frame */}
                <div className="relative aspect-video bg-black/80 group">
                  {hasImage && scene.generatedImage ? (
                    <img
                      src={scene.generatedImage}
                      alt={`Scene ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setInspectIndex(index)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-1">
                      <Film size={20} />
                      <span className="text-[10px]">No Frame</span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white border border-white/15">
                    SC {String(index + 1).padStart(2, '0')} · {scene.startTime || '0:00'}
                  </div>

                  {hasImage && (
                    <button
                      type="button"
                      onClick={() => setInspectIndex(index)}
                      className="absolute top-2 right-2 p-1 rounded bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Inspect frame"
                    >
                      <Maximize2 size={12} />
                    </button>
                  )}
                </div>

                {/* Full-width Swatch Bar */}
                {grade ? (
                  <div className="flex h-3 w-full">
                    {grade.swatches.map((sw, i) => (
                      <div
                        key={i}
                        className="flex-1 h-full"
                        style={{ backgroundColor: sw.hex }}
                        title={`${sw.name}: ${sw.hex}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-3 w-full bg-zinc-900 border-y border-white/5" />
                )}

                {/* Compact Meta */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-white truncate">
                        {grade ? grade.name : 'Ungraded'}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          consistency === 'dominant'
                            ? 'bg-emerald-400'
                            : consistency === 'variant'
                            ? 'bg-amber-400'
                            : 'bg-gray-600'
                        }`}
                        title={
                          consistency === 'dominant'
                            ? 'Matches Master Look'
                            : consistency === 'variant'
                            ? 'Variant Grade'
                            : 'Ungraded'
                        }
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">
                      {scene.groupName || `Scene ${index + 1}`} · {Number(scene.duration || 4).toFixed(1)}s
                      {grade ? ` · Int ${gradeIntensity}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                      {linkedRefs.slice(0, 4).map((ref) =>
                        ref.image ? (
                          <img
                            key={ref.id}
                            src={ref.image}
                            alt={ref.name}
                            title={ref.name}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-black border border-white/20"
                          />
                        ) : (
                          <div
                            key={ref.id}
                            title={ref.name}
                            className="w-5 h-5 rounded-full bg-teal-950 text-teal-300 text-[9px] font-bold flex items-center justify-center ring-1 ring-black border border-teal-500/30"
                          >
                            {ref.name.charAt(0).toUpperCase()}
                          </div>
                        )
                      )}
                      {linkedRefs.length === 0 && (
                        <span className="text-[10px] text-gray-600">No refs</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenColorGradeForScene(index)}
                      className="text-[10px] font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1"
                    >
                      <Palette size={10} /> Grade
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-Size Frame & Reference Audit Lightbox */}
      {inspectedShot && inspectIndex !== null && (
        <div
          className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setInspectIndex(null)}
        >
          <div
            className="bg-[#12141c] border border-white/15 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 font-mono text-xs font-bold">
                  SCENE {String(inspectIndex + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-bold text-white">
                  {inspectedShot.scene.groupName || 'Visual Audit Inspection'}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {inspectedShot.scene.startTime || '0:00'} - {inspectedShot.scene.endTime || '0:04'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={inspectIndex <= 0}
                  onClick={() => setInspectIndex(Math.max(0, inspectIndex - 1))}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 disabled:opacity-30"
                  title="Previous shot"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-mono text-gray-400">
                  {inspectIndex + 1} / {auditSummary.shots.length}
                </span>
                <button
                  type="button"
                  disabled={inspectIndex >= auditSummary.shots.length - 1}
                  onClick={() => setInspectIndex(Math.min(auditSummary.shots.length - 1, inspectIndex + 1))}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 disabled:opacity-30"
                  title="Next shot"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setInspectIndex(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Lightbox Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto custom-scrollbar flex-1">
              {/* Left: Full Frame */}
              <div className="lg:col-span-8 bg-black flex flex-col items-center justify-center p-4 min-h-[300px]">
                {inspectedShot.scene.generatedImage ? (
                  <img
                    src={inspectedShot.scene.generatedImage}
                    alt={`Scene ${inspectIndex + 1}`}
                    className="max-h-[62vh] w-auto object-contain rounded-lg border border-white/10"
                  />
                ) : (
                  <div className="text-center text-gray-500 space-y-2">
                    <ImageIcon size={36} className="mx-auto text-gray-700" />
                    <p className="text-sm">No image generated for Scene {inspectIndex + 1}</p>
                  </div>
                )}

                {inspectedShot.grade && (
                  <div className="w-full mt-4 flex items-center gap-1.5">
                    {inspectedShot.grade.swatches.map((sw, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full h-4 rounded border border-white/20"
                          style={{ backgroundColor: sw.hex }}
                        />
                        <span className="text-[10px] font-mono text-gray-400">
                          {sw.name} ({sw.hex})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Color Grade & Reference Inspector */}
              <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/10 p-4 space-y-4 bg-[#141720]">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    Applied Color Grade
                  </div>
                  <div className="text-sm font-bold text-white">
                    {inspectedShot.grade ? inspectedShot.grade.name : 'Ungraded'}
                  </div>
                  {inspectedShot.grade?.colorTemperature && (
                    <div className="text-xs text-gray-400">{inspectedShot.grade.colorTemperature}</div>
                  )}
                  {inspectedShot.grade?.contrast && (
                    <div className="text-xs text-gray-500">Contrast: {inspectedShot.grade.contrast}</div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                    Linked Character / Visual References ({inspectedShot.linkedRefs.length})
                  </div>
                  {inspectedShot.linkedRefs.length > 0 ? (
                    <div className="space-y-2">
                      {inspectedShot.linkedRefs.map((ref) => (
                        <div
                          key={ref.id}
                          className="flex items-start gap-2.5 bg-black/40 border border-white/10 rounded-lg p-2"
                        >
                          {ref.image ? (
                            <img
                              src={ref.image}
                              alt={ref.name}
                              className="w-11 h-11 rounded object-cover shrink-0 border border-white/10"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded bg-teal-950/60 flex items-center justify-center text-sm font-bold text-teal-300 shrink-0">
                              {ref.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white">{ref.name}</div>
                            <p className="text-[11px] text-gray-400 line-clamp-2">{ref.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No linked character references</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Full Image Prompt
                  </div>
                  <div className="bg-black/50 border border-white/10 rounded-lg p-2.5 text-[11px] font-mono text-gray-300 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
                    {inspectedShot.scene.imagePrompt || 'No image prompt'}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = inspectIndex;
                      setInspectIndex(null);
                      onOpenColorGradeForScene(target);
                    }}
                    className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Palette size={13} /> Open in Color Grader
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
