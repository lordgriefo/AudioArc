import { ScenePrompt } from './App';

export interface ColorPaletteSwatch {
  hex: string;
  name: string;
  role: 'shadows' | 'midtones' | 'highlights' | 'accent';
}

export interface ColorGradeProfile {
  id: string;
  name: string;
  category: 'film-stock' | 'blockbuster' | 'vintage' | 'noir' | 'neon' | 'moody' | 'arthouse';
  badge: string;
  swatches: ColorPaletteSwatch[];
  colorTemperature: string;
  contrast: string;
  grain: string;
  lightingNote: string;
  promptDirective: string;
  description: string;
  bestForKeywords: string[];
}

export interface ColorGradingRecommendation {
  sceneId: string;
  sceneIndex: number;
  sceneLyric: string;
  filterId: string;
  filterName: string;
  category: string;
  swatches: ColorPaletteSwatch[];
  lightingSetup: string;
  colorTemperature: string;
  contrastProfile: string;
  rationale: string;
  colorGradingClause: string;
  originalImagePrompt: string;
  recommendedImagePrompt: string;
  isApplied: boolean;
}

export interface ProjectStyleAnalysis {
  overallStyleName: string;
  dominantMood: string;
  globalPalette: ColorPaletteSwatch[];
  primaryEmulation: string;
  lightingPhilosophy: string;
  aestheticAdvice: string;
  analyzedAt: string;
}

export const CINEMATIC_COLOR_PROFILES: ColorGradeProfile[] = [
  {
    id: 'kodak-vision3-500t',
    name: 'Kodak Vision3 500T (5219)',
    category: 'film-stock',
    badge: '35mm Film Stock',
    swatches: [
      { hex: '#141c24', name: 'Cyan Shadow', role: 'shadows' },
      { hex: '#5c483a', name: 'Warm Midtone', role: 'midtones' },
      { hex: '#f0caa3', name: 'Golden Skin', role: 'highlights' },
      { hex: '#ff9442', name: 'Amber Halation', role: 'accent' },
    ],
    colorTemperature: '3200K Tungsten Key with 5600K Cyan Ambience',
    contrast: 'Organic Film Contrast with Smooth Shadow Roll-off',
    grain: 'Fine, Organic 35mm Analog Grain',
    lightingNote: 'Soft tungsten key with deep, natural shadow falloff and glowing specular edges',
    promptDirective: 'Color grading: Kodak Vision3 500T 35mm film stock emulation, warm golden highlight roll-off, desaturated teal shadows, soft organic halation around light sources, gentle analog film grain, cinematic depth',
    description: 'The golden standard of modern cinema (Interstellar, Her, Once Upon a Time in Hollywood). Rich amber glow and balanced shadow density.',
    bestForKeywords: ['warm', 'indoor', 'sunset', 'drama', 'cinematic', 'nostalgia', 'intimate', 'night', 'bar', 'acoustic', 'love']
  },
  {
    id: 'teal-orange-blockbuster',
    name: 'Teal & Orange Blockbuster',
    category: 'blockbuster',
    badge: 'High Contrast LUT',
    swatches: [
      { hex: '#0a1d24', name: 'Deep Teal Shadow', role: 'shadows' },
      { hex: '#1d515e', name: 'Cyan Ambient', role: 'midtones' },
      { hex: '#e89148', name: 'Vibrant Amber Skin', role: 'highlights' },
      { hex: '#ff5e1a', name: 'Tangerine Accent', role: 'accent' },
    ],
    colorTemperature: 'Dual-Tone Cool Shadows / Warm Highlights',
    contrast: 'High Dynamic Range Punchy Contrast',
    grain: 'Subtle Digital Clean Sharpness',
    lightingNote: 'Cool cyan rim or fill light cutting across warm direct key lighting',
    promptDirective: 'Color grading: Cinematic Teal and Orange blockbuster color grade, punchy complementary color contrast, rich cyan-teal deep shadows, radiant warm amber highlights, crisp specular details',
    description: 'The iconic blockbuster color contrast (Blade Runner 2049, Transformers, Mad Max). Maximizes subject separation and visual impact.',
    bestForKeywords: ['action', 'energetic', 'drive', 'heroic', 'blockbuster', 'city', 'dance', 'power', 'chase', 'fire', 'sky']
  },
  {
    id: 'bleach-bypass-enr',
    name: 'Bleach Bypass (ENR Process)',
    category: 'moody',
    badge: 'Silver Retention',
    swatches: [
      { hex: '#121415', name: 'Crushed Carbon', role: 'shadows' },
      { hex: '#42484a', name: 'Steel Slate', role: 'midtones' },
      { hex: '#a6abae', name: 'Cold Silver Highlight', role: 'highlights' },
      { hex: '#63705e', name: 'Desaturated Olive', role: 'accent' },
    ],
    colorTemperature: 'Cold Industrial Daylight (6000K-7000K)',
    contrast: 'Extreme High Contrast, Crushed Blacks, Blown Speculars',
    grain: 'Pronounced Industrial Silver Halide Grain',
    lightingNote: 'Hard directional key with steep shadows and minimal fill illumination',
    promptDirective: 'Color grading: Bleach bypass silver retention ENR film process, gritty muted color palette, intense high contrast, harsh crushed black shadows, industrial metallic silver highlights, raw gritty texture',
    description: 'Gritty, intense, and visceral aesthetic (David Fincher\'s Seven, Fight Club, Saving Private Ryan). Strips pastel tones for raw emotion.',
    bestForKeywords: ['dark', 'gritty', 'fight', 'anger', 'tension', 'rain', 'industrial', 'sorrow', 'intense', 'underground', 'mystery']
  },
  {
    id: 'technicolor-3-strip',
    name: 'Technicolor 3-Strip (Vintage 1950s)',
    category: 'vintage',
    badge: 'Vintage 3-Strip',
    swatches: [
      { hex: '#16131c', name: 'Velvet Plum Shadow', role: 'shadows' },
      { hex: '#1b8a5a', name: 'Emerald Green', role: 'midtones' },
      { hex: '#e62438', name: 'Vibrant Crimson Red', role: 'highlights' },
      { hex: '#ffd23f', name: 'Canary Yellow', role: 'accent' },
    ],
    colorTemperature: 'Hyper-Saturated Studio Arc-Light Balance (4800K)',
    contrast: 'Medium High, Luscious Velvety Shadows',
    grain: 'Fine Vintage Technicolor Dye Transfer Texture',
    lightingNote: 'Even, bright classic three-point studio lighting with saturated color accents',
    promptDirective: 'Color grading: Vintage Technicolor 3-strip color process, hyper-vivid saturated primary reds and lush emerald greens, rich velvet black shadows, dreamlike retro 1950s Hollywood cinematography',
    description: 'Lush, hyper-vivid dreamlike primary color palette (The Wizard of Oz, Singin\' in the Rain, Suspiria, The Aviator).',
    bestForKeywords: ['retro', 'vintage', 'dream', 'psychedelic', 'surreal', 'glamour', 'theatrical', 'magic', 'vibrant', 'fantasy']
  },
  {
    id: 'kodak-kodachrome-64',
    name: 'Kodak Kodachrome 64',
    category: 'vintage',
    badge: 'Color Reversal',
    swatches: [
      { hex: '#1c1b18', name: 'Espresso Shadow', role: 'shadows' },
      { hex: '#8a4b2d', name: 'Terracotta Earth', role: 'midtones' },
      { hex: '#f2dfb6', name: 'Warm Cream Highlight', role: 'highlights' },
      { hex: '#bf311a', name: 'Vintage Scarlet', role: 'accent' },
    ],
    colorTemperature: 'Warm Natural Sunlit Daylight (5200K)',
    contrast: 'Punchy Vintage Contrast, Deep Warm D-Max',
    grain: 'Crisp Acutance, Micro-Contrast Analog Grain',
    lightingNote: 'Direct natural sunlight, golden reflector fills, and warm ambient light',
    promptDirective: 'Color grading: Authentic 1970s Kodak Kodachrome 64 slide film emulation, warm earthy terracotta and crimson tones, deep rich blacks, warm creamy highlight glow, vintage National Geographic documentary aesthetic',
    description: 'Iconic nostalgic 1970s magazine and documentary look. Famous for deep reds, warm sky blues, and earthy skin tones.',
    bestForKeywords: ['roadtrip', 'summer', 'nostalgia', 'folk', 'documentary', 'warm', 'memory', 'vintage', 'indie', 'nature']
  },
  {
    id: 'fuji-pro-400h',
    name: 'Fuji Pro 400H (Pastel Bloom)',
    category: 'film-stock',
    badge: 'Pastel Film Stock',
    swatches: [
      { hex: '#1c2423', name: 'Muted Pine Shadow', role: 'shadows' },
      { hex: '#6b9e8a', name: 'Mint Jade Midtone', role: 'midtones' },
      { hex: '#fcf3e8', name: 'Soft Alabaster Highlight', role: 'highlights' },
      { hex: '#e8a598', name: 'Pastel Blush Accent', role: 'accent' },
    ],
    colorTemperature: 'Cool Ethereal Daylight with Mint Tint (5600K)',
    contrast: 'Low-to-Medium Soft Contrast with Lifted Milly Shadows',
    grain: 'Ultra-Fine Airy Pastel Grain',
    lightingNote: 'Diffused open shade, backlit golden hour flare, gentle oversized silk diffusion',
    promptDirective: 'Color grading: Fuji Pro 400H color negative film emulation, soft airy pastel palette, gentle mint green shadow wash, creamy luminous skin tones, lifted milk shadows, ethereal highlight glow',
    description: 'Airy, soft, dreamy look popular in fashion and indie romance (Sofia Coppola\'s The Virgin Suicides, Marie Antoinette). Gentle greens and blush highlights.',
    bestForKeywords: ['gentle', 'ethereal', 'dreamy', 'soft', 'romance', 'fashion', 'spring', 'acoustic', 'morning', 'haze', 'peaceful']
  },
  {
    id: 'cyberpunk-neon-wash',
    name: 'Cyberpunk Neon Wash',
    category: 'neon',
    badge: 'Electric Neon LUT',
    swatches: [
      { hex: '#0a0512', name: 'Abyssal Violet Shadow', role: 'shadows' },
      { hex: '#1a3875', name: 'Cobalt Blue Ambient', role: 'midtones' },
      { hex: '#ff007f', name: 'Hot Neon Magenta', role: 'highlights' },
      { hex: '#00f0ff', name: 'Electric Cyan Rim', role: 'accent' },
    ],
    colorTemperature: 'High-Saturation Artificial LED / Neon Mix',
    contrast: 'Extreme Contrast with Pure Deep Inky Blacks',
    grain: 'Clean Anamorphic Digital with Subtle Atmospheric Mist',
    lightingNote: 'Prismatic neon tube reflections, wet ground specular bounces, harsh cobalt backlighting',
    promptDirective: 'Color grading: Cyberpunk neon color grade, deep abyssal black shadows, saturated electric magenta highlights and radioactive cyan rim lighting, wet asphalt reflections, anamorphic blue horizontal streaks',
    description: 'Ultra-stylized futuristic night palette (Blade Runner, John Wick, Cyberpunk 2077, Drive). Electric colors popping off midnight blacks.',
    bestForKeywords: ['neon', 'future', 'cyberpunk', 'synthwave', 'club', 'city', 'night', 'rain', 'car', 'electronic', 'beat']
  },
  {
    id: 'midnight-cyan-sodium',
    name: 'Midnight Cyan & Sodium Amber',
    category: 'moody',
    badge: 'Urban Nocturne',
    swatches: [
      { hex: '#071219', name: 'Midnight Pitch Shadow', role: 'shadows' },
      { hex: '#12394a', name: 'Cold Cyan Haze', role: 'midtones' },
      { hex: '#ffaa33', name: 'Sodium Vapor Amber', role: 'highlights' },
      { hex: '#ffcc66', name: 'Warm Tungsten Glare', role: 'accent' },
    ],
    colorTemperature: 'Split: 2200K Sodium Vapor / 7500K Cyan Night Sky',
    contrast: 'Moody Low-Key Film Contrast',
    grain: 'High-ISO 35mm Gritty Night Grain',
    lightingNote: 'Low-key lighting with single sodium street lamps puncturing dark urban shadows',
    promptDirective: 'Color grading: Low-key urban noir color grading, dense midnight cyan shadows, glowing warm sodium-vapor amber streetlights, wet pavement specular highlights, moody cinematic atmospheric haze',
    description: 'Classic gritty urban nighttime cinematography (Michael Mann\'s Heat and Collateral, The Batman). Dark cyan ambience with piercing amber streetlamps.',
    bestForKeywords: ['night', 'dark', 'alone', 'street', 'drive', 'rain', 'lonely', 'crime', 'mystery', 'shadow', 'city']
  },
  {
    id: 'kodak-tri-x-400',
    name: 'Kodak Tri-X 400 (Silver Gelatin Noir)',
    category: 'noir',
    badge: 'Monochrome B&W',
    swatches: [
      { hex: '#080808', name: 'Pure Ink Shadow', role: 'shadows' },
      { hex: '#484848', name: 'Neutral Gray Midtone', role: 'midtones' },
      { hex: '#d4d4d4', name: 'Silver Gray Highlight', role: 'highlights' },
      { hex: '#f5f5f5', name: 'Brilliant Specular White', role: 'accent' },
    ],
    colorTemperature: 'Pure Silver Gelatin Black and White (No Color Cast)',
    contrast: 'Dramatic High-Contrast Chiaroscuro',
    grain: 'Rich, Pushed 400-ISO Analog Silver Halide Grain',
    lightingNote: 'Hard Venetian blind slashes, rim lights, and silhouette chiaroscuro',
    promptDirective: 'Color grading: High-contrast black and white cinematic photography, Kodak Tri-X 400 silver gelatin film emulation, deep velvety black shadows, crisp luminous silver highlights, dramatic chiaroscuro lighting, tactile analog grain',
    description: 'Timeless dramatic monochrome (Mank, The Lighthouse, Roma, classic Film Noir). Pure tonal drama where lighting sculpts every form.',
    bestForKeywords: ['black and white', 'noir', 'classic', 'dramatic', 'gothic', 'shadow', 'memory', 'monochrome', 'vintage', 'dark']
  },
  {
    id: 'solarized-golden-hour',
    name: 'Solarized Golden Hour',
    category: 'vintage',
    badge: 'Magic Hour Flare',
    swatches: [
      { hex: '#24140b', name: 'Espresso Bronze Shadow', role: 'shadows' },
      { hex: '#8a4b18', name: 'Caramel Midtone', role: 'midtones' },
      { hex: '#f7bd59', name: 'Liquid Gold Highlight', role: 'highlights' },
      { hex: '#ffe6a3', name: 'Blinding Sunburst Flare', role: 'accent' },
    ],
    colorTemperature: '2800K-3000K Ultra-Warm Golden Magic Hour',
    contrast: 'Warm Low-Mid Contrast with Flared Foggy Shadows',
    grain: 'Warm Shimmering 16mm Sunlit Grain',
    lightingNote: 'Direct low-angle backlight straight into the vintage lens, producing organic honeyed flares',
    promptDirective: 'Color grading: Golden hour magic hour cinematography, warm honeyed golden light, intense low-angle sun flare, bronze shadow tones, soft glowing highlight bloom, warm luminous atmospheric dust',
    description: 'Dreamy magic hour sunburst (Terrence Malick\'s Tree of Life, Days of Heaven, Nomadland). Envelops the scene in liquid gold and memory.',
    bestForKeywords: ['sun', 'golden', 'sunset', 'field', 'freedom', 'hope', 'peace', 'love', 'summer', 'warm', 'glow']
  },
  {
    id: 'wong-kar-wai-emerald',
    name: 'Wong Kar-wai Emerald & Scarlet',
    category: 'arthouse',
    badge: 'Arthouse Hong Kong',
    swatches: [
      { hex: '#071712', name: 'Dark Jade Shadow', role: 'shadows' },
      { hex: '#16614a', name: 'Fluorescent Green Midtone', role: 'midtones' },
      { hex: '#b31e32', name: 'Sultry Scarlet Red', role: 'highlights' },
      { hex: '#e89e3a', name: 'Smoky Amber Lantern', role: 'accent' },
    ],
    colorTemperature: 'Unbalanced Fluorescent Green / Scarlet Neon (Christopher Doyle style)',
    contrast: 'Moody High Contrast with Crushed Colored Blacks',
    grain: 'Dense Step-Printed 35mm Motion Blur Grain',
    lightingNote: 'Flickering overhead green fluorescent tubes paired with warm incandescent desk lamps or red neon',
    promptDirective: 'Color grading: Wong Kar-wai style cinematography, moody jade-emerald fluorescent shadow wash, sultry saturated scarlet red accents, warm amber lantern glow, melancholic atmospheric haze, Christopher Doyle lighting',
    description: 'Intoxicating, sultry mood of 90s Hong Kong arthouse cinema (In the Mood for Love, Chungking Express, Fallen Angels).',
    bestForKeywords: ['melancholy', 'romantic', 'rain', 'night', 'smoking', 'hallway', 'neon', 'intimate', 'sorrow', 'slow', 'moody']
  },
  {
    id: 'cross-processed-e6',
    name: 'Cross-Processed E-6',
    category: 'arthouse',
    badge: 'Experimental C-41',
    swatches: [
      { hex: '#1f0d2b', name: 'Deep Violet Shadow', role: 'shadows' },
      { hex: '#226b52', name: 'Toxic Teal Midtone', role: 'midtones' },
      { hex: '#d9e021', name: 'Chartreuse Lime Highlight', role: 'highlights' },
      { hex: '#ff0077', name: 'Surreal Magenta Accent', role: 'accent' },
    ],
    colorTemperature: 'Uncalibrated Cross-Development Color Shift',
    contrast: 'Extreme High Contrast, Blown-Out Dynamic Curves',
    grain: 'Coarse Chemical Grain with High Edge Contrast',
    lightingNote: 'Surreal, oversaturated key lighting with erratic color temperature shadows',
    promptDirective: 'Color grading: Cross-processed E-6 slide film developed in C-41 chemicals, surreal psychedelic color shifts, deep purple-violet shadows, electric chartreuse lime highlights, high contrast grunge fashion aesthetic',
    description: 'Unapologetically bold 90s music video and fashion look (U2, MTV era, Harmony Korine). Unpredictable color shifts and high attitude.',
    bestForKeywords: ['grunge', 'wild', 'party', 'trippy', 'drugs', 'rock', 'rebel', 'chaos', 'energy', 'madness', 'distorted']
  },
  {
    id: 'nordic-noir-steel',
    name: 'Nordic Noir (Overcast Steel)',
    category: 'moody',
    badge: 'Muted Scandinavian',
    swatches: [
      { hex: '#10171d', name: 'Abyssal Steel Shadow', role: 'shadows' },
      { hex: '#405664', name: 'Overcast Slate Blue', role: 'midtones' },
      { hex: '#9fb1bc', name: 'Chilly Fog Highlight', role: 'highlights' },
      { hex: '#876045', name: 'Muted Pine Bark', role: 'accent' },
    ],
    colorTemperature: '6500K-7200K Freezing Overcast Ambient Light',
    contrast: 'Mid-to-High Controlled Scandinavian Contrast',
    grain: 'Subtle, Precise Nordic Digital Film Grain',
    lightingNote: 'Soft overcast Arctic sky, diffuse window light, subdued indoor practicals',
    promptDirective: 'Color grading: Nordic Noir Scandinavian cinematography, desaturated cold steel-blue color grade, gloomy overcast natural lighting, chilly slate shadows, muted subdued earth tones, stark realistic atmosphere',
    description: 'Subdued, chilly, atmospheric Nordic thriller aesthetic (The Girl with the Dragon Tattoo, Broadchurch, Chernobyl). Restrained and atmospheric.',
    bestForKeywords: ['cold', 'winter', 'snow', 'forest', 'police', 'sad', 'ice', 'mountain', 'lonely', 'grey', 'quiet']
  },
  {
    id: 'vintage-16mm-indie',
    name: '16mm Vintage Indie Sepia',
    category: 'vintage',
    badge: '16mm Analog Print',
    swatches: [
      { hex: '#1f1a14', name: 'Bistre Shadow', role: 'shadows' },
      { hex: '#634f3c', name: 'Sepia Tobacco Midtone', role: 'midtones' },
      { hex: '#dfcaa8', name: 'Parchment Highlight', role: 'highlights' },
      { hex: '#b34728', name: 'Rust Red Accent', role: 'accent' },
    ],
    colorTemperature: '3800K Aged Warm Analog Tone',
    contrast: 'Soft Compressed Range with Visible Vignetting',
    grain: 'Heavy, Organic 16mm Bolex Film Grain',
    lightingNote: 'Naturalistic indie lighting, practical warm bulbs, soft lens falloff at edges',
    promptDirective: 'Color grading: 16mm Bolex film stock emulation, warm sepia-tinted nostalgic color palette, heavy organic 16mm film grain, gentle optical vignetting, soft edge focus, indie arthouse music video aesthetic',
    description: 'Warm, textured analog indie look (Wes Anderson, indie rock music videos, A24 coming-of-age). Tangible texture and warmth.',
    bestForKeywords: ['indie', 'guitar', 'garage', 'friendship', 'memory', 'youth', 'suburb', 'summer', 'childhood', 'school', 'home']
  }
];

/**
 * Intelligently updates or inserts the color grading clause into an existing image prompt.
 * Replaces any existing "Color grading:" or "Color palette:" directives so they don't pile up.
 */
export function applyColorGradeToPrompt(originalPrompt: string, gradeDirective: string): string {
  if (!originalPrompt) return gradeDirective;

  // Regex patterns to detect previous color grading additions
  const colorGradingRegex = /(?:,\s*)?(?:Color grading|Color grade|Color palette|Colour grading|LUT):[^,.]+(?:,[^,.]+)*[.]?/gi;

  const cleaned = originalPrompt.replace(colorGradingRegex, '').trim().replace(/,\s*$/, '').replace(/\.\s*$/, '');
  
  if (cleaned.length === 0) {
    return gradeDirective;
  }

  // Seamlessly join with standard cinematic prompt syntax
  return `${cleaned}. ${gradeDirective}.`;
}

/**
 * Algorithmic recommendation engine based on visual styles, cinematography theory,
 * and individual scene characteristics. Works instantaneously offline.
 */
export function recommendColorGradeForScene(
  scene: ScenePrompt,
  visualStyleName: string,
  influences: any[],
  sceneIndex: number,
  totalScenes: number
): ColorGradingRecommendation {
  const textContext = `${visualStyleName} ${scene.lyric || ''} ${scene.imagePrompt || ''} ${scene.description || ''} ${scene.notes || ''} ${influences.map(i => i.name || i).join(' ')}`.toLowerCase();

  let matchedProfile = CINEMATIC_COLOR_PROFILES[0];
  let highestScore = -1;

  for (const profile of CINEMATIC_COLOR_PROFILES) {
    let score = 0;
    for (const kw of profile.bestForKeywords) {
      if (textContext.includes(kw)) {
        score += 2;
      }
    }
    // Boost matching category with visual style
    const styleLower = visualStyleName.toLowerCase();
    if (profile.id.includes('noir') && (styleLower.includes('noir') || textContext.includes('black and white'))) score += 10;
    if (profile.id.includes('cyberpunk') && (styleLower.includes('cyberpunk') || styleLower.includes('sci-fi') || textContext.includes('neon'))) score += 10;
    if (profile.id.includes('vintage') && (styleLower.includes('vintage') || styleLower.includes('retro') || styleLower.includes('1970'))) score += 8;
    if (profile.id.includes('pastel') && (styleLower.includes('pastel') || styleLower.includes('ethereal') || styleLower.includes('anime'))) score += 8;
    if (profile.id.includes('bleach') && (styleLower.includes('gritty') || styleLower.includes('industrial') || styleLower.includes('horror'))) score += 8;
    if (profile.id.includes('technicolor') && (styleLower.includes('technicolor') || styleLower.includes('surreal') || styleLower.includes('psychedelic'))) score += 10;

    if (score > highestScore) {
      highestScore = score;
      matchedProfile = profile;
    }
  }

  // If no strong keyword match, use cinematic standards based on scene position
  if (highestScore <= 0) {
    if (sceneIndex === 0) {
      matchedProfile = CINEMATIC_COLOR_PROFILES[0]; // Kodak 500T
    } else if (sceneIndex === totalScenes - 1) {
      matchedProfile = CINEMATIC_COLOR_PROFILES[9]; // Golden hour for finale
    } else {
      matchedProfile = CINEMATIC_COLOR_PROFILES[1]; // Teal & orange
    }
  }

  const rationale = `Complements the ${matchedProfile.category} tone of "${visualStyleName || 'Cinematic'}" with ${matchedProfile.name}. Provides ${matchedProfile.contrast.toLowerCase()} and ${matchedProfile.colorTemperature.toLowerCase()} to elevate the scene's emotional resonance.`;

  const updatedPrompt = applyColorGradeToPrompt(scene.imagePrompt, matchedProfile.promptDirective);

  return {
    sceneId: scene.id,
    sceneIndex,
    sceneLyric: scene.lyric || 'Instrumental Sequence',
    filterId: matchedProfile.id,
    filterName: matchedProfile.name,
    category: matchedProfile.category,
    swatches: matchedProfile.swatches,
    lightingSetup: matchedProfile.lightingNote,
    colorTemperature: matchedProfile.colorTemperature,
    contrastProfile: matchedProfile.contrast,
    rationale,
    colorGradingClause: matchedProfile.promptDirective,
    originalImagePrompt: scene.imagePrompt,
    recommendedImagePrompt: updatedPrompt,
    isApplied: scene.imagePrompt.includes(matchedProfile.promptDirective) || scene.imagePrompt.toLowerCase().includes('color grading')
  };
}

/**
 * Builds the AI prompt for generating deep contextual color grading analysis across the storyboard.
 */
export function buildAIColorGradingPrompt(
  visualStyleName: string,
  narrative: string,
  influences: string[],
  storyboard: ScenePrompt[]
): string {
  const sceneListText = storyboard.map((s, idx) => `
SCENE ${idx + 1} (ID: ${s.id}):
- Duration: ${s.duration}s (${s.startTime || '0:00'} - ${s.endTime || '0:04'})
- Lyric/Audio: "${s.lyric || 'Instrumental'}"
- Visual Prompt: "${s.imagePrompt || ''}"
- Description/Action: "${s.description || 'N/A'}"
- Motion: "${s.cameraMovement || 'N/A'}"
`).join('\n');

  return `You are a legendary Master Colorist (DI Colorist) and Director of Photography for high-end cinematic music videos.
Analyze the project's visual style and each storyboard scene, then generate customized professional color grading recommendations to elevate the aesthetic cohesion and emotional storytelling.

PROJECT CONTEXT:
- Visual Style: "${visualStyleName}"
- Cinematic Influences: ${influences.length > 0 ? influences.join(', ') : 'Contemporary Cinematic'}
- Narrative Arc: "${narrative || 'Visual music video journey'}"

STORYBOARD SCENES:
${sceneListText}

AVAILABLE INDUSTRY CINEMATIC COLOR LOOKS:
- "Kodak Vision3 500T (5219)" (Warm tungsten, golden skin, rich cyan shadows, organic 35mm halation)
- "Teal & Orange Blockbuster" (Complementary high-contrast modern punch, deep cyan shadows, luminous amber highlights)
- "Bleach Bypass (ENR Process)" (Gritty, desaturated silver retention, high contrast, industrial metallic tones)
- "Technicolor 3-Strip" (Hyper-vivid 1950s primary reds and emerald greens, dreamlike vintage richness)
- "Kodak Kodachrome 64" (1970s warm earthy tones, terracotta, deep blacks, editorial magazine print)
- "Fuji Pro 400H Pastel Bloom" (Airy soft pastel, mint shadow wash, creamy luminous highlights)
- "Cyberpunk Neon Wash" (Electric magenta and radioactive cyan rim lights against abyssal deep blacks)
- "Midnight Cyan & Sodium Amber" (Urban nocturne, cold cyan ambient haze, warm sodium street lamps)
- "Kodak Tri-X 400 Noir" (High-contrast dramatic monochrome, silver gelatin, deep velvety chiaroscuro)
- "Solarized Golden Hour" (Liquid gold low-angle sun flare, honeyed warm backlight, atmospheric haze)
- "Wong Kar-wai Emerald & Scarlet" (Moody fluorescent green shadows, sultry scarlet accents, Hong Kong arthouse)
- "Cross-Processed E-6" (Surreal violet shadows, toxic lime chartreuse highlights, experimental fashion grunge)
- "Nordic Noir Overcast Steel" (Chilly desaturated slate-blue, overcast Arctic diffuse light, stark realism)
- "16mm Vintage Indie Sepia" (Warm sepia-tobacco palette, tactile organic 16mm grain, soft vignetting)

REQUIRED OUTPUT FORMAT (Return strictly valid JSON without markdown wrapping or commentary):
{
  "projectAnalysis": {
    "overallStyleName": "${visualStyleName}",
    "dominantMood": "One concise phrase describing the emotional color journey",
    "primaryEmulation": "Primary recommended film stock or LUT base",
    "lightingPhilosophy": "1-2 sentences explaining how lighting and color temperature should guide the visual narrative",
    "globalPalette": [
      {"hex": "#HEX1", "name": "Color Name", "role": "shadows"},
      {"hex": "#HEX2", "name": "Color Name", "role": "midtones"},
      {"hex": "#HEX3", "name": "Color Name", "role": "highlights"},
      {"hex": "#HEX4", "name": "Color Name", "role": "accent"}
    ],
    "aestheticAdvice": "1-2 sentences of specific artistic direction for Midjourney/Gemini prompt crafting"
  },
  "recommendations": [
    {
      "sceneIndex": 0,
      "sceneId": "scene id from input",
      "filterName": "Exact name of recommended look from the list",
      "category": "film-stock or blockbuster or vintage or noir or neon or moody or arthouse",
      "lightingSetup": "Brief description of lighting key, fill, and color temperature (e.g. 3200K Tungsten Key, 5600K Rim Light)",
      "colorTemperature": "e.g. Warm Golden (3200K) or Cool Cyan (6500K)",
      "contrastProfile": "e.g. High Dynamic Contrast or Soft Low Contrast",
      "rationale": "1-2 sentences explaining why this specific color grade and temperature enhances this scene's lyric and emotional beat",
      "colorGradingClause": "An exact, concise prompt clause starting with 'Color grading: ...' formulated for generative image models",
      "swatches": [
        {"hex": "#HEX1", "name": "Shadow", "role": "shadows"},
        {"hex": "#HEX2", "name": "Midtone", "role": "midtones"},
        {"hex": "#HEX3", "name": "Highlight", "role": "highlights"},
        {"hex": "#HEX4", "name": "Accent", "role": "accent"}
      ]
    }
  ]
}`;
}
