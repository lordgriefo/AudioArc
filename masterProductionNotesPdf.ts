import { jsPDF } from 'jspdf';
import { INFLUENCE_CATEGORIES, VISUAL_STYLES } from './influences';

export interface ProductionNotesScene {
  id: string;
  lyric: string;
  description?: string;
  imagePrompt: string;
  videoPrompts: string[];
  soraPrompt: string;
  duration: number;
  startTime?: string;
  endTime?: string;
  generatedImage?: string;
  notes?: string;
  groupName?: string;
  linkedRefIds?: string[];
  transitionIn?: string;
  transitionOut?: string;
  transitionDuration?: number;
  cameraMovement?: string;
  isLipSyncEnabled?: boolean;
  lipSyncPrompt?: string;
  isVoiceoverEnabled?: boolean;
  voiceoverText?: string;
}

export interface ProductionNotesVisualRef {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface ProductionNotesCustomInfluence {
  id: string;
  name: string;
  desc: string;
}

export interface MasterProductionNotesPayload {
  projectName: string;
  narrative: string;
  lyrics: string;
  audioFileName?: string;
  audioDuration?: number;
  selectedStyleId: string;
  selectedInfluences: string[];
  customInfluences: ProductionNotesCustomInfluence[];
  visualRefs: ProductionNotesVisualRef[];
  storyboard: ProductionNotesScene[] | null;
}

interface PreparedImage {
  dataUrl: string;
  format: 'JPEG' | 'PNG';
  width: number;
  height: number;
}

const sanitizeText = (input: string | undefined | null): string => {
  if (!input) return '';
  return String(input)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '*')
    .replace(/\u00A0/g, ' ')
    // Strip characters outside printable Latin-1 (keeps accents, removes emojis that break built-in jsPDF fonts)
    .replace(/[^\x09\x0A\x20-\x7E\xA1-\xFF]/g, '')
    .trim();
};

const formatDurationMMSS = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
  const totalSec = Math.round(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const prepareImageForPdf = async (dataUrl: string): Promise<PreparedImage | null> => {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width || 640;
        const h = img.naturalHeight || img.height || 360;
        const isPng = dataUrl.startsWith('data:image/png');
        const isJpeg = dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg');

        if (isPng || isJpeg) {
          resolve({
            dataUrl,
            format: isPng ? 'PNG' : 'JPEG',
            width: w,
            height: h,
          });
          return;
        }

        // Convert WebP or other browser-supported formats to JPEG via canvas for jsPDF compatibility
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const jpegUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve({
          dataUrl: jpegUrl,
          format: 'JPEG',
          width: w,
          height: h,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
};

const resolveSelectedInfluences = (
  selectedNames: string[],
  customInfluences: ProductionNotesCustomInfluence[]
): Array<{ category: string; name: string; desc: string }> => {
  const results: Array<{ category: string; name: string; desc: string }> = [];
  const seen = new Set<string>();

  Object.entries(INFLUENCE_CATEGORIES).forEach(([category, items]) => {
    items.forEach((item) => {
      if (selectedNames.includes(item.name) && !seen.has(item.name)) {
        seen.add(item.name);
        results.push({ category, name: item.name, desc: item.desc });
      }
    });
  });

  customInfluences.forEach((item) => {
    if (selectedNames.includes(item.name) && !seen.has(item.name)) {
      seen.add(item.name);
      results.push({ category: 'Custom Influence', name: item.name, desc: item.desc });
    }
  });

  // Include any selected names not found in catalog
  selectedNames.forEach((name) => {
    if (!seen.has(name)) {
      seen.add(name);
      results.push({ category: 'Reference', name, desc: '' });
    }
  });

  return results;
};

export async function buildMasterProductionNotesPDF(
  payload: MasterProductionNotesPayload
): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178mm
  const topMargin = 20;
  const bottomMargin = 18;
  const maxY = pageHeight - bottomMargin;

  // Color Palette (Print-friendly Studio Editorial)
  const C = {
    ink: [17, 24, 39] as const,        // #111827
    inkMuted: [75, 85, 99] as const,   // #4B5563
    inkLight: [107, 114, 128] as const,// #6B7280
    accent: [79, 70, 229] as const,    // #4F46E5 (Indigo)
    accentDark: [30, 27, 75] as const, // #1E1B4B
    teal: [13, 148, 136] as const,     // #0D9488
    amber: [180, 83, 9] as const,      // #B45309
    surface: [248, 250, 252] as const, // #F8FAFC
    surfaceAlt: [241, 245, 249] as const, // #F1F5F9
    border: [203, 213, 225] as const,  // #CBD5E1
    borderLight: [226, 232, 240] as const, // #E2E8F0
    white: [255, 255, 255] as const,
  };

  const projectTitle = sanitizeText(payload.projectName) || 'AudioArc Cinematic Production';
  const selectedStyle =
    VISUAL_STYLES.find((s) => s.id === payload.selectedStyleId) || VISUAL_STYLES[0];
  const resolvedInfluences = resolveSelectedInfluences(
    payload.selectedInfluences || [],
    payload.customInfluences || []
  );
  const scenes = payload.storyboard || [];
  const visualRefs = payload.visualRefs || [];

  const totalSceneDuration = scenes.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
  const effectiveDuration = totalSceneDuration > 0 ? totalSceneDuration : payload.audioDuration || 0;
  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Pre-decode all reference and scene images concurrently
  const refImagesMap = new Map<string, PreparedImage>();
  const sceneImagesMap = new Map<string, PreparedImage>();

  await Promise.all([
    ...visualRefs.map(async (ref) => {
      if (ref.image) {
        const prepared = await prepareImageForPdf(ref.image);
        if (prepared) refImagesMap.set(ref.id, prepared);
      }
    }),
    ...scenes.map(async (scene, idx) => {
      if (scene.generatedImage) {
        const prepared = await prepareImageForPdf(scene.generatedImage);
        if (prepared) sceneImagesMap.set(scene.id || String(idx), prepared);
      }
    }),
  ]);

  let cursorY = topMargin;

  const startNewPage = () => {
    pdf.addPage();
    cursorY = topMargin + 2;
  };

  const ensureSpace = (neededMm: number) => {
    if (cursorY + neededMm > maxY) {
      startNewPage();
    }
  };

  const drawSectionHeader = (sectionNum: string, title: string, subtitle?: string) => {
    ensureSpace(20);
    cursorY += 3;

    // Accent bar on left
    pdf.setFillColor(...C.accent);
    pdf.rect(marginX, cursorY, 2.5, subtitle ? 12 : 8.5, 'F');

    pdf.setFillColor(...C.surfaceAlt);
    pdf.rect(marginX + 2.5, cursorY, contentWidth - 2.5, subtitle ? 12 : 8.5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...C.accent);
    pdf.text(`SECTION ${sectionNum}`, marginX + 6, cursorY + 4);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...C.ink);
    pdf.text(sanitizeText(title), marginX + 28, cursorY + 5.8);

    if (subtitle) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...C.inkMuted);
      pdf.text(sanitizeText(subtitle), marginX + 6, cursorY + 9.8);
    }

    cursorY += (subtitle ? 12 : 8.5) + 5;
  };

  const drawParagraph = (
    text: string,
    options: {
      x?: number;
      width?: number;
      fontSize?: number;
      lineHeight?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      fontFamily?: 'helvetica' | 'courier';
      color?: readonly [number, number, number];
      gapAfter?: number;
    } = {}
  ) => {
    const clean = sanitizeText(text);
    if (!clean) return;
    const x = options.x ?? marginX;
    const width = options.width ?? contentWidth;
    const fontSize = options.fontSize ?? 9.5;
    const lineHeight = options.lineHeight ?? fontSize * 0.45;
    const fontFamily = options.fontFamily ?? 'helvetica';
    const fontStyle = options.fontStyle ?? 'normal';
    const color = options.color ?? C.ink;

    pdf.setFont(fontFamily, fontStyle);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...color);

    const paragraphs = clean.split('\n');
    for (const para of paragraphs) {
      if (para.trim() === '') {
        cursorY += lineHeight * 0.6;
        if (cursorY > maxY) startNewPage();
        continue;
      }
      const lines: string[] = pdf.splitTextToSize(para, width);
      for (const line of lines) {
        if (cursorY + lineHeight > maxY) {
          startNewPage();
          pdf.setFont(fontFamily, fontStyle);
          pdf.setFontSize(fontSize);
          pdf.setTextColor(...color);
        }
        pdf.text(line, x, cursorY);
        cursorY += lineHeight;
      }
    }

    cursorY += options.gapAfter ?? 2;
  };

  // =========================================================================
  // COVER BANNER & EXECUTIVE SUMMARY (PAGE 1)
  // =========================================================================
  const bannerHeight = 46;
  pdf.setFillColor(...C.ink);
  pdf.rect(0, 0, pageWidth, bannerHeight, 'F');

  // Top accent strip
  pdf.setFillColor(...C.accent);
  pdf.rect(0, 0, pageWidth, 3, 'F');

  // Document classification pill text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(165, 180, 252); // soft indigo tint
  pdf.text('AUDIOARC STUDIO  |  MASTER PRODUCTION NOTES', marginX, 13);

  // Project Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(...C.white);
  const titleLines: string[] = pdf.splitTextToSize(projectTitle, contentWidth);
  pdf.text(titleLines.slice(0, 2), marginX, 23);

  // Subtitle line
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(203, 213, 225);
  const subtitleParts = [
    `Visual Style: ${sanitizeText(selectedStyle.name)}`,
    `Scenes: ${scenes.length}`,
    `Cast/Refs: ${visualRefs.length}`,
    effectiveDuration > 0 ? `Runtime: ${formatDurationMMSS(effectiveDuration)}` : null,
  ].filter(Boolean);
  pdf.text(subtitleParts.join('   |   '), marginX, 39);

  cursorY = bannerHeight + 8;

  // Production Metadata Grid (4 cells)
  const metaCards = [
    { label: 'TOTAL SCENES', value: `${scenes.length} Shots` },
    { label: 'EST. RUNTIME', value: effectiveDuration > 0 ? formatDurationMMSS(effectiveDuration) : 'N/A' },
    { label: 'CAST & REFERENCES', value: `${visualRefs.length} Profiles` },
    { label: 'PRIMARY STYLE', value: sanitizeText(selectedStyle.name) },
  ];

  const cardGap = 3.5;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cardHeight = 16;

  metaCards.forEach((card, idx) => {
    const x = marginX + idx * (cardWidth + cardGap);
    pdf.setFillColor(...C.surface);
    pdf.setDrawColor(...C.borderLight);
    pdf.roundedRect(x, cursorY, cardWidth, cardHeight, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(...C.inkLight);
    pdf.text(card.label, x + 3, cursorY + 5.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...C.ink);
    const valLines: string[] = pdf.splitTextToSize(card.value, cardWidth - 6);
    pdf.text(valLines[0] || card.value, x + 3, cursorY + 12);
  });

  cursorY += cardHeight + 5;

  // Optional audio filename & generated date line
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...C.inkLight);
  const metaFooterLine = [
    `Compiled: ${generatedAt}`,
    payload.audioFileName ? `Audio Track: ${sanitizeText(payload.audioFileName)}` : null,
    `Influences Attached: ${resolvedInfluences.length}`,
  ]
    .filter(Boolean)
    .join('   |   ');
  pdf.text(metaFooterLine, marginX, cursorY);
  cursorY += 7;

  // Director's Concept / Narrative Treatment box
  const cleanNarrative = sanitizeText(payload.narrative);
  if (cleanNarrative) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    const narrativeLines: string[] = pdf.splitTextToSize(cleanNarrative, contentWidth - 10);
    const boxHeight = Math.min(80, 12 + narrativeLines.length * 4.4);

    if (12 + narrativeLines.length * 4.4 <= 80) {
      ensureSpace(boxHeight + 4);
      pdf.setFillColor(...C.surface);
      pdf.setDrawColor(...C.accent);
      pdf.setLineWidth(0.35);
      pdf.roundedRect(marginX, cursorY, contentWidth, boxHeight, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...C.accent);
      pdf.text("DIRECTOR'S CONCEPT / NARRATIVE TREATMENT", marginX + 5, cursorY + 6);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(...C.ink);
      pdf.text(narrativeLines, marginX + 5, cursorY + 11.5);
      cursorY += boxHeight + 6;
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C.accent);
      pdf.text("DIRECTOR'S CONCEPT / NARRATIVE TREATMENT", marginX, cursorY);
      cursorY += 4.5;
      drawParagraph(cleanNarrative, { fontSize: 9.5, lineHeight: 4.4, gapAfter: 5 });
    }
  }

  // Document Contents Index Box
  ensureSpace(28);
  pdf.setFillColor(...C.surfaceAlt);
  pdf.setDrawColor(...C.borderLight);
  pdf.setLineWidth(0.25);
  pdf.roundedRect(marginX, cursorY, contentWidth, 23, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...C.inkMuted);
  pdf.text('PRODUCTION BIBLE CONTENTS', marginX + 4, cursorY + 5.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...C.ink);
  pdf.text('01. Visual Style & Creative Influences', marginX + 4, cursorY + 12);
  pdf.text(`02. Cast, Characters & Visual References (${visualRefs.length})`, marginX + 90, cursorY + 12);
  pdf.text('03. Complete Master Script & Lyrics', marginX + 4, cursorY + 18.5);
  pdf.text(`04. Master Scene List & Shot Breakdown (${scenes.length})`, marginX + 90, cursorY + 18.5);

  cursorY += 29;

  // =========================================================================
  // SECTION 01: VISUAL STYLE & AESTHETIC DIRECTION
  // =========================================================================
  drawSectionHeader(
    '01',
    'Visual Style & Creative Influences',
    'Primary lookbook aesthetic, cinematography palette, and directorial reference guides'
  );

  // Primary Style Box
  const styleDetailsClean = sanitizeText(selectedStyle.visualDetails);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const styleDetailLines: string[] = pdf.splitTextToSize(styleDetailsClean, contentWidth - 10);
  const styleBoxH = 14 + styleDetailLines.length * 4.2;
  ensureSpace(styleBoxH + 4);

  pdf.setFillColor(...C.surface);
  pdf.setDrawColor(...C.border);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(marginX, cursorY, contentWidth, styleBoxH, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...C.teal);
  pdf.text('PRIMARY VISUAL STYLE', marginX + 5, cursorY + 5.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...C.ink);
  pdf.text(sanitizeText(selectedStyle.name), marginX + 5, cursorY + 10.8);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...C.inkMuted);
  pdf.text(styleDetailLines, marginX + 5, cursorY + 16);

  cursorY += styleBoxH + 6;

  // Selected Influences List
  ensureSpace(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...C.ink);
  pdf.text(`Selected Visual & Directorial Influences (${resolvedInfluences.length})`, marginX, cursorY);
  cursorY += 5;

  if (resolvedInfluences.length === 0) {
    drawParagraph('No additional directorial or artistic influences selected.', {
      fontSize: 8.5,
      fontStyle: 'italic',
      color: C.inkLight,
      gapAfter: 4,
    });
  } else {
    for (const inf of resolvedInfluences) {
      const descClean = sanitizeText(inf.desc);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      const descLines: string[] = descClean
        ? pdf.splitTextToSize(descClean, contentWidth - 10)
        : [];
      const rowHeight = 9 + descLines.length * 3.8;
      ensureSpace(rowHeight + 2.5);

      pdf.setFillColor(...C.surface);
      pdf.setDrawColor(...C.borderLight);
      pdf.roundedRect(marginX, cursorY, contentWidth, rowHeight, 1.5, 1.5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...C.ink);
      pdf.text(sanitizeText(inf.name), marginX + 4, cursorY + 5.2);

      // Category label right-aligned
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(...C.accent);
      const catText = sanitizeText(inf.category).toUpperCase();
      pdf.text(catText, marginX + contentWidth - 4, cursorY + 5.2, { align: 'right' });

      if (descLines.length > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...C.inkMuted);
        pdf.text(descLines, marginX + 4, cursorY + 9.5);
      }

      cursorY += rowHeight + 2.5;
    }
  }

  // Also list any custom influences defined in the project that weren't actively selected
  const unselectedCustom = (payload.customInfluences || []).filter(
    (ci) => !(payload.selectedInfluences || []).includes(ci.name)
  );
  if (unselectedCustom.length > 0) {
    cursorY += 2;
    ensureSpace(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...C.inkMuted);
    pdf.text(`Additional Custom Project Influences (${unselectedCustom.length})`, marginX, cursorY);
    cursorY += 4.5;
    for (const ci of unselectedCustom) {
      drawParagraph(`${ci.name}: ${ci.desc || 'Custom style reference'}`, {
        x: marginX + 3,
        width: contentWidth - 3,
        fontSize: 8.5,
        color: C.inkMuted,
        gapAfter: 1.5,
      });
    }
  }

  // =========================================================================
  // SECTION 02: CAST, CHARACTERS & VISUAL REFERENCES
  // =========================================================================
  drawSectionHeader(
    '02',
    'Cast, Characters & Visual References',
    'Character continuity bible, visual reference sheets, and scene appearance mapping'
  );

  if (visualRefs.length === 0) {
    drawParagraph(
      'No characters or visual reference images have been added to this project yet. Add characters in the Cast & References panel to include portraits and continuity notes here.',
      { fontSize: 9, fontStyle: 'italic', color: C.inkLight, gapAfter: 6 }
    );
  } else {
    for (let i = 0; i < visualRefs.length; i++) {
      const ref = visualRefs[i];
      const preparedImg = refImagesMap.get(ref.id) || null;
      const cleanName = sanitizeText(ref.name) || `Reference ${i + 1}`;
      const handle = `@${cleanName.replace(/[^a-zA-Z0-9]/g, '') || `Character${i + 1}`}`;
      const cleanDesc =
        sanitizeText(ref.description) || 'No appearance description entered.';

      // Cross-reference which scenes feature this character
      const sceneNumbers: number[] = [];
      scenes.forEach((sc, sIdx) => {
        const linked = Array.isArray(sc.linkedRefIds) && sc.linkedRefIds.includes(ref.id);
        const mentioned =
          cleanName.length >= 2 &&
          `${sc.description || ''} ${sc.imagePrompt || ''} ${sc.soraPrompt || ''}`
            .toLowerCase()
            .includes(cleanName.toLowerCase());
        if (linked || mentioned) {
          sceneNumbers.push(sIdx + 1);
        }
      });

      const hasThumb = Boolean(preparedImg);
      const thumbBoxSize = 30;
      const textStartX = hasThumb ? marginX + thumbBoxSize + 8 : marginX + 5;
      const textWidth = hasThumb ? contentWidth - thumbBoxSize - 12 : contentWidth - 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.8);
      const descLines: string[] = pdf.splitTextToSize(cleanDesc, textWidth);
      const appearanceText =
        sceneNumbers.length > 0
          ? `Appears in Scenes: ${sceneNumbers.map((n) => `#${n}`).join(', ')}`
          : 'Appears in Scenes: General / Unassigned';
      const appLines: string[] = pdf.splitTextToSize(appearanceText, textWidth);

      const textHeight = 11 + descLines.length * 4 + 3 + appLines.length * 3.8 + 4;
      const cardH = Math.max(hasThumb ? thumbBoxSize + 8 : 24, textHeight);

      ensureSpace(cardH + 4);

      pdf.setFillColor(...C.surface);
      pdf.setDrawColor(...C.border);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(marginX, cursorY, contentWidth, cardH, 2, 2, 'FD');

      if (preparedImg) {
        try {
          const boxX = marginX + 4;
          const boxY = cursorY + 4;
          const aspect = preparedImg.width / Math.max(1, preparedImg.height);
          let drawW = thumbBoxSize;
          let drawH = thumbBoxSize / aspect;
          if (drawH > thumbBoxSize) {
            drawH = thumbBoxSize;
            drawW = thumbBoxSize * aspect;
          }
          const imgX = boxX + (thumbBoxSize - drawW) / 2;
          const imgY = boxY + (thumbBoxSize - drawH) / 2;

          pdf.setFillColor(15, 23, 42);
          pdf.roundedRect(boxX, boxY, thumbBoxSize, thumbBoxSize, 1.5, 1.5, 'F');
          pdf.addImage(preparedImg.dataUrl, preparedImg.format, imgX, imgY, drawW, drawH);
        } catch {
          // Skip broken image gracefully
        }
      }

      // Character Name + Handle
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(...C.ink);
      pdf.text(`${i + 1}. ${cleanName}`, textStartX, cursorY + 7);

      pdf.setFont('courier', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...C.accent);
      pdf.text(handle, marginX + contentWidth - 4, cursorY + 7, { align: 'right' });

      // Description
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.8);
      pdf.setTextColor(...C.inkMuted);
      pdf.text(descLines, textStartX, cursorY + 12.5);

      // Scene appearances
      const appY = cursorY + 12.5 + descLines.length * 4 + 2;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.8);
      pdf.setTextColor(...C.teal);
      pdf.text(appLines, textStartX, appY);

      cursorY += cardH + 4;
    }
  }

  // =========================================================================
  // SECTION 03: COMPLETE MASTER SCRIPT & LYRICS
  // =========================================================================
  startNewPage();
  drawSectionHeader(
    '03',
    'Complete Master Script & Lyrics',
    'Full source lyrics/script text followed by the formatted production screenplay'
  );

  // Part A: Raw Lyrics / Script Input
  const cleanLyrics = sanitizeText(payload.lyrics);
  if (cleanLyrics) {
    ensureSpace(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...C.accentDark);
    pdf.text('A. FULL SOURCE LYRICS / MASTER SCRIPT', marginX, cursorY);
    cursorY += 5;

    const rawLines = cleanLyrics.split('\n');
    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        cursorY += 2.6;
        if (cursorY > maxY) startNewPage();
        continue;
      }
      const isSectionHeading = /^\[.*\]$/.test(trimmed);
      if (isSectionHeading) {
        ensureSpace(7);
        cursorY += 1.5;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...C.accent);
        pdf.text(trimmed.toUpperCase(), marginX + 2, cursorY);
        cursorY += 4.5;
      } else {
        drawParagraph(trimmed, {
          x: marginX + 4,
          width: contentWidth - 6,
          fontSize: 9,
          lineHeight: 4.1,
          fontFamily: 'courier',
          color: C.ink,
          gapAfter: 0.4,
        });
      }
    }
    cursorY += 5;
  }

  // Part B: Formatted Production Screenplay
  if (scenes.length > 0) {
    ensureSpace(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...C.accentDark);
    pdf.text('B. FORMATTED PRODUCTION SCREENPLAY', marginX, cursorY);
    cursorY += 6;

    scenes.forEach((scene, idx) => {
      ensureSpace(28);

      // Slugline bar
      const slugTime =
        scene.startTime && scene.endTime
          ? `${scene.startTime} - ${scene.endTime}`
          : `${Number(scene.duration || 4).toFixed(1)}s`;
      const slugGroup = sanitizeText(scene.groupName || 'LOCATION').toUpperCase();

      pdf.setFillColor(...C.surfaceAlt);
      pdf.rect(marginX, cursorY - 3.5, contentWidth, 6.5, 'F');
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...C.ink);
      pdf.text(`SCENE ${String(idx + 1).padStart(2, '0')}  -  INT./EXT. ${slugGroup}`, marginX + 2.5, cursorY + 0.8);
      pdf.setTextColor(...C.inkMuted);
      pdf.text(`[${slugTime}]`, marginX + contentWidth - 2.5, cursorY + 0.8, { align: 'right' });
      cursorY += 6.5;

      // Action / Description
      if (scene.description) {
        drawParagraph(scene.description, {
          x: marginX + 4,
          width: contentWidth - 8,
          fontSize: 9,
          lineHeight: 4.1,
          fontFamily: 'courier',
          color: C.ink,
          gapAfter: 2,
        });
      }

      // Lyric Cue (Centered screenplay dialogue style)
      if (scene.lyric) {
        ensureSpace(10);
        pdf.setFont('courier', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(...C.accent);
        pdf.text('VOCAL / LYRIC CUE', marginX + 26, cursorY);
        cursorY += 3.8;
        drawParagraph(`"${scene.lyric}"`, {
          x: marginX + 20,
          width: contentWidth - 40,
          fontSize: 8.8,
          lineHeight: 4,
          fontFamily: 'courier',
          color: C.ink,
          gapAfter: 2,
        });
      }

      // Voiceover (if enabled)
      if (scene.isVoiceoverEnabled && scene.voiceoverText) {
        ensureSpace(10);
        pdf.setFont('courier', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(...C.teal);
        pdf.text('NARRATOR (V.O.)', marginX + 26, cursorY);
        cursorY += 3.8;
        drawParagraph(scene.voiceoverText, {
          x: marginX + 20,
          width: contentWidth - 40,
          fontSize: 8.8,
          lineHeight: 4,
          fontFamily: 'courier',
          color: C.ink,
          gapAfter: 2,
        });
      }

      // Lip-Sync Directive (if enabled)
      if (scene.isLipSyncEnabled && scene.lipSyncPrompt) {
        drawParagraph(`LIP-SYNC: ${scene.lipSyncPrompt}`, {
          x: marginX + 4,
          width: contentWidth - 8,
          fontSize: 8,
          lineHeight: 3.6,
          fontFamily: 'courier',
          color: C.amber,
          gapAfter: 1.5,
        });
      }

      // Camera & Transition cue
      const camLabel =
        scene.cameraMovement && scene.cameraMovement !== 'none'
          ? scene.cameraMovement.toUpperCase()
          : 'AUTO';
      const trIn = (scene.transitionIn && scene.transitionIn !== 'none' ? scene.transitionIn : 'CUT').toUpperCase();
      const trOut = (scene.transitionOut && scene.transitionOut !== 'none' ? scene.transitionOut : 'CUT').toUpperCase();

      drawParagraph(`[CAMERA: ${camLabel}]   [TRANSITION: ${trIn} IN / ${trOut} OUT]`, {
        x: marginX + 4,
        width: contentWidth - 8,
        fontSize: 7.5,
        lineHeight: 3.5,
        fontFamily: 'courier',
        color: C.inkLight,
        gapAfter: 4,
      });
    });
  } else if (!cleanLyrics) {
    drawParagraph(
      'No lyrics or storyboard script have been entered yet.',
      { fontSize: 9, fontStyle: 'italic', color: C.inkLight, gapAfter: 6 }
    );
  }

  // =========================================================================
  // SECTION 04: MASTER SCENE LIST & SHOT BREAKDOWN
  // =========================================================================
  startNewPage();
  drawSectionHeader(
    '04',
    'Master Scene List & Shot Breakdown',
    'Complete shot schedule index and detailed visual/motion prompts for every scene'
  );

  if (scenes.length === 0) {
    drawParagraph(
      'No scenes have been generated in the storyboard yet. Generate a storyboard to populate the Master Scene List and Shot Breakdown.',
      { fontSize: 9, fontStyle: 'italic', color: C.inkLight, gapAfter: 6 }
    );
  } else {
    // 4A. Compact Master Shot Schedule Table
    ensureSpace(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.accentDark);
    pdf.text('A. MASTER SHOT SCHEDULE OVERVIEW', marginX, cursorY);
    cursorY += 4.5;

    const col = {
      num: { x: marginX, w: 12 },
      time: { x: marginX + 12, w: 24 },
      group: { x: marginX + 36, w: 28 },
      cam: { x: marginX + 64, w: 28 },
      summary: { x: marginX + 92, w: contentWidth - 92 },
    };

    const drawTableHeader = () => {
      pdf.setFillColor(...C.ink);
      pdf.rect(marginX, cursorY, contentWidth, 6.5, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(...C.white);
      pdf.text('#', col.num.x + 2, cursorY + 4.4);
      pdf.text('TIMECODE', col.time.x + 2, cursorY + 4.4);
      pdf.text('SECTION', col.group.x + 2, cursorY + 4.4);
      pdf.text('CAMERA', col.cam.x + 2, cursorY + 4.4);
      pdf.text('ACTION / LYRIC SUMMARY', col.summary.x + 2, cursorY + 4.4);
      cursorY += 6.5;
    };

    drawTableHeader();

    scenes.forEach((scene, idx) => {
      const timeStr =
        scene.startTime && scene.endTime
          ? `${scene.startTime}-${scene.endTime}`
          : `${Number(scene.duration || 4).toFixed(1)}s`;
      const groupStr = sanitizeText(scene.groupName || 'Scene');
      const camStr =
        scene.cameraMovement && scene.cameraMovement !== 'none'
          ? sanitizeText(scene.cameraMovement)
          : 'Auto';
      const summaryStr = sanitizeText(scene.description || scene.lyric || 'Untitled shot');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      const summaryLines: string[] = pdf.splitTextToSize(summaryStr, col.summary.w - 4).slice(0, 2);
      const groupLines: string[] = pdf.splitTextToSize(groupStr, col.group.w - 3).slice(0, 2);
      const camLines: string[] = pdf.splitTextToSize(camStr, col.cam.w - 3).slice(0, 2);
      const maxLines = Math.max(1, summaryLines.length, groupLines.length, camLines.length);
      const rowH = Math.max(6.2, maxLines * 3.4 + 2.4);

      if (cursorY + rowH > maxY) {
        startNewPage();
        drawTableHeader();
      }

      if (idx % 2 === 1) {
        pdf.setFillColor(...C.surface);
        pdf.rect(marginX, cursorY, contentWidth, rowH, 'F');
      }
      pdf.setDrawColor(...C.borderLight);
      pdf.setLineWidth(0.2);
      pdf.line(marginX, cursorY + rowH, marginX + contentWidth, cursorY + rowH);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.accent);
      pdf.text(String(idx + 1).padStart(2, '0'), col.num.x + 2, cursorY + 4.2);

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(7.2);
      pdf.setTextColor(...C.inkMuted);
      pdf.text(timeStr, col.time.x + 2, cursorY + 4.2);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.2);
      pdf.setTextColor(...C.ink);
      pdf.text(groupLines, col.group.x + 2, cursorY + 4.2);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.2);
      pdf.setTextColor(...C.inkMuted);
      pdf.text(camLines, col.cam.x + 2, cursorY + 4.2);

      pdf.setTextColor(...C.ink);
      pdf.text(summaryLines, col.summary.x + 2, cursorY + 4.2);

      cursorY += rowH;
    });

    cursorY += 8;

    // 4B. Detailed Scene-by-Scene Production Cards
    ensureSpace(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...C.accentDark);
    pdf.text('B. DETAILED SCENE PRODUCTION SHEETS', marginX, cursorY);
    cursorY += 5;

    const refById = new Map(visualRefs.map((r) => [r.id, r.name]));

    for (let idx = 0; idx < scenes.length; idx++) {
      const scene = scenes[idx];
      const preparedImg = sceneImagesMap.get(scene.id || String(idx)) || null;
      const linkedNames = (scene.linkedRefIds || [])
        .map((id) => refById.get(id))
        .filter((n): n is string => Boolean(n))
        .map((n) => sanitizeText(n));

      // Keep at least header + top metadata block together on a page
      ensureSpace(preparedImg ? 56 : 36);

      // Scene Card Header Bar
      pdf.setFillColor(...C.ink);
      pdf.roundedRect(marginX, cursorY, contentWidth, 7.5, 1.5, 1.5, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C.white);
      const sceneLabel = `SCENE ${String(idx + 1).padStart(2, '0')}`;
      const groupBadge = scene.groupName ? `  |  ${sanitizeText(scene.groupName).toUpperCase()}` : '';
      pdf.text(`${sceneLabel}${groupBadge}`, marginX + 3.5, cursorY + 5);

      const timingBadge =
        scene.startTime && scene.endTime
          ? `${scene.startTime} - ${scene.endTime} (${Number(scene.duration || 4).toFixed(1)}s)`
          : `${Number(scene.duration || 4).toFixed(1)}s`;
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(199, 210, 254);
      pdf.text(timingBadge, marginX + contentWidth - 3.5, cursorY + 5, { align: 'right' });

      cursorY += 10;

      // Top metadata row (optionally alongside scene thumbnail)
      const thumbW = 48;
      const thumbH = 27; // 16:9 box
      const metaStartX = preparedImg ? marginX + thumbW + 5 : marginX + 2;
      const metaWidth = preparedImg ? contentWidth - thumbW - 7 : contentWidth - 4;
      const topBlockStartY = cursorY;

      if (preparedImg) {
        try {
          const aspect = preparedImg.width / Math.max(1, preparedImg.height);
          let drawW = thumbW;
          let drawH = thumbW / aspect;
          if (drawH > thumbH) {
            drawH = thumbH;
            drawW = thumbH * aspect;
          }
          const imgX = marginX + (thumbW - drawW) / 2;
          const imgY = topBlockStartY + (thumbH - drawH) / 2;
          pdf.setFillColor(15, 23, 42);
          pdf.roundedRect(marginX, topBlockStartY, thumbW, thumbH, 1.5, 1.5, 'F');
          pdf.addImage(preparedImg.dataUrl, preparedImg.format, imgX, imgY, drawW, drawH);
        } catch {
          // Ignore image errors cleanly
        }
      }

      // Technical metadata specs
      const camMove =
        scene.cameraMovement && scene.cameraMovement !== 'none'
          ? sanitizeText(scene.cameraMovement)
          : 'Auto / Unspecified';
      const transIn = scene.transitionIn && scene.transitionIn !== 'none' ? scene.transitionIn : 'Cut';
      const transOut = scene.transitionOut && scene.transitionOut !== 'none' ? scene.transitionOut : 'Cut';

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.inkLight);
      pdf.text(
        `CAMERA: ${camMove.toUpperCase()}   |   TRANSITIONS: ${sanitizeText(transIn).toUpperCase()} -> ${sanitizeText(transOut).toUpperCase()}`,
        metaStartX,
        cursorY + 3.5
      );
      cursorY += 6.5;

      if (linkedNames.length > 0) {
        drawParagraph(`Cast / References: ${linkedNames.join(', ')}`, {
          x: metaStartX,
          width: metaWidth,
          fontSize: 8,
          lineHeight: 3.6,
          fontStyle: 'bold',
          color: C.teal,
          gapAfter: 1.5,
        });
      }

      if (scene.lyric) {
        drawParagraph(`Lyric: "${scene.lyric}"`, {
          x: metaStartX,
          width: metaWidth,
          fontSize: 8.5,
          lineHeight: 3.8,
          fontStyle: 'italic',
          color: C.accentDark,
          gapAfter: 1.5,
        });
      }

      if (scene.description) {
        drawParagraph(`Action: ${scene.description}`, {
          x: metaStartX,
          width: metaWidth,
          fontSize: 8.5,
          lineHeight: 3.8,
          color: C.ink,
          gapAfter: 1.5,
        });
      }

      if (preparedImg) {
        cursorY = Math.max(cursorY, topBlockStartY + thumbH + 3);
      } else {
        cursorY += 1;
      }

      // Voiceover / Lip-sync / Director Notes
      if (scene.isVoiceoverEnabled && scene.voiceoverText) {
        drawParagraph(`Voiceover (V.O.): ${scene.voiceoverText}`, {
          x: marginX + 2,
          width: contentWidth - 4,
          fontSize: 8.2,
          lineHeight: 3.7,
          color: C.teal,
          gapAfter: 1.5,
        });
      }

      if (scene.isLipSyncEnabled && scene.lipSyncPrompt) {
        drawParagraph(`Lip-Sync Prompt: ${scene.lipSyncPrompt}`, {
          x: marginX + 2,
          width: contentWidth - 4,
          fontSize: 8.2,
          lineHeight: 3.7,
          color: C.amber,
          gapAfter: 1.5,
        });
      }

      if (scene.notes) {
        drawParagraph(`Director Notes: ${scene.notes}`, {
          x: marginX + 2,
          width: contentWidth - 4,
          fontSize: 8.2,
          lineHeight: 3.7,
          fontStyle: 'italic',
          color: C.inkMuted,
          gapAfter: 1.5,
        });
      }

      // Image Prompt
      if (scene.imagePrompt) {
        ensureSpace(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...C.accent);
        pdf.text('IMAGE PROMPT', marginX + 2, cursorY + 1);
        cursorY += 4;
        drawParagraph(scene.imagePrompt, {
          x: marginX + 2,
          width: contentWidth - 4,
          fontSize: 8.2,
          lineHeight: 3.7,
          color: C.inkMuted,
          gapAfter: 2,
        });
      }

      // Master Video / Motion Prompt
      if (scene.soraPrompt) {
        ensureSpace(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...C.amber);
        pdf.text('MASTER VIDEO / MOTION PROMPT', marginX + 2, cursorY + 1);
        cursorY += 4;
        drawParagraph(scene.soraPrompt, {
          x: marginX + 2,
          width: contentWidth - 4,
          fontSize: 8.2,
          lineHeight: 3.7,
          color: C.inkMuted,
          gapAfter: 2,
        });
      } else if (Array.isArray(scene.videoPrompts) && scene.videoPrompts.some(Boolean)) {
        const labels = ['Subtle', 'Dynamic', 'Stylistic'];
        ensureSpace(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...C.amber);
        pdf.text('VIDEO MOTION OPTIONS', marginX + 2, cursorY + 1);
        cursorY += 4;
        scene.videoPrompts.forEach((vp, vIdx) => {
          if (!vp) return;
          drawParagraph(`${labels[vIdx] || `Option ${vIdx + 1}`}: ${vp}`, {
            x: marginX + 3,
            width: contentWidth - 5,
            fontSize: 8,
            lineHeight: 3.6,
            color: C.inkMuted,
            gapAfter: 1,
          });
        });
      }

      // Divider between scenes
      pdf.setDrawColor(...C.border);
      pdf.setLineWidth(0.25);
      pdf.line(marginX, cursorY + 1, marginX + contentWidth, cursorY + 1);
      cursorY += 6;
    }
  }

  // =========================================================================
  // RUNNING HEADERS & FOOTERS ON ALL PAGES
  // =========================================================================
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);

    // Running header from Page 2 onward
    if (p > 1) {
      pdf.setDrawColor(...C.borderLight);
      pdf.setLineWidth(0.25);
      pdf.line(marginX, 13, pageWidth - marginX, 13);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.inkMuted);
      pdf.text(projectTitle.substring(0, 65), marginX, 10.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.inkLight);
      pdf.text('MASTER PRODUCTION NOTES', pageWidth - marginX, 10.5, { align: 'right' });
    }

    // Running footer on every page
    pdf.setDrawColor(...C.borderLight);
    pdf.setLineWidth(0.25);
    pdf.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.inkLight);
    pdf.text(`AudioArc Production Bible  |  ${generatedAt}`, marginX, pageHeight - 8.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...C.inkMuted);
    pdf.text(`Page ${p} of ${totalPages}`, pageWidth - marginX, pageHeight - 8.5, {
      align: 'right',
    });
  }

  return pdf;
}

export async function exportMasterProductionNotesPDF(
  payload: MasterProductionNotesPayload,
  filename = 'master_production_notes.pdf'
): Promise<void> {
  const pdf = await buildMasterProductionNotesPDF(payload);
  pdf.save(filename);
}
