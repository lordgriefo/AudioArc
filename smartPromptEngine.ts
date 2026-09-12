// --- Smart Prompt Suggestion Engine & Cinematic Knowledge Base ---

export interface PromptTag {
  id: string;
  label: string;
  category: 'lighting' | 'camera' | 'color' | 'motion' | 'aesthetic';
  tagText: string;
  description: string;
  keywords: string[];
}

export interface SmartSuggestionResult {
  contextualTags: PromptTag[];
  allTags: Record<string, PromptTag[]>;
  categoryCounts: Record<string, number>;
}

export const SMART_PROMPT_TAGS: PromptTag[] = [
  // --- LIGHTING & ATMOSPHERE ---
  {
    id: 'volumetric-god-rays',
    label: 'Volumetric God Rays',
    category: 'lighting',
    tagText: 'volumetric sunbeams slicing through atmospheric haze, dramatic light shafts, suspended dust particles',
    description: 'Striking beams of light breaking through mist or windows',
    keywords: ['sun', 'light', 'morning', 'dawn', 'day', 'forest', 'window', 'church', 'cathedral', 'dust', 'mist', 'haze', 'sky', 'clouds']
  },
  {
    id: 'golden-hour-rim',
    label: 'Golden Hour Rim Light',
    category: 'lighting',
    tagText: 'warm golden hour rim lighting, soft amber edge highlights, low-angle backlight, subtle optical lens flare',
    description: 'Warm, magical edge glow from late afternoon sun',
    keywords: ['sunset', 'golden', 'sun', 'dusk', 'evening', 'warm', 'glow', 'field', 'beach', 'romance', 'love', 'smile', 'nostalgia', 'memory']
  },
  {
    id: 'dramatic-chiaroscuro',
    label: 'Dramatic Chiaroscuro',
    category: 'lighting',
    tagText: 'dramatic chiaroscuro lighting, deep impenetrable shadows, single high-contrast keylight, Caravaggio aesthetic',
    description: 'High-contrast painting-like lighting with intense shadows',
    keywords: ['dark', 'shadow', 'night', 'noir', 'secret', 'mystery', 'face', 'portrait', 'criminal', 'interrogation', 'tension', 'fear', 'alone']
  },
  {
    id: 'neon-noir-glow',
    label: 'Neon Noir Glow',
    category: 'lighting',
    tagText: 'vibrant neon rim lighting, saturated cyan and magenta ambient glow, wet surface light reflections',
    description: 'Electric neon reflections with cool cyberpunk or nightclub vibe',
    keywords: ['neon', 'cyber', 'night', 'city', 'street', 'club', 'party', 'rain', 'puddle', 'tokyo', 'alley', 'bar', 'glow', 'electric']
  },
  {
    id: 'softbox-studio-portrait',
    label: 'Soft Studio Keylight',
    category: 'lighting',
    tagText: 'diffused softbox studio keylight, gentle shadow roll-off, clean circular catchlights in eyes, beauty illumination',
    description: 'Flattering, clean commercial and studio lighting for faces',
    keywords: ['face', 'portrait', 'sing', 'singer', 'look', 'eyes', 'studio', 'clean', 'beauty', 'fashion', 'close', 'lips', 'performance']
  },
  {
    id: 'candlelit-tungsten',
    label: 'Candlelit Warmth',
    category: 'lighting',
    tagText: 'warm 2700K tungsten illumination, flickering candle flame shadows, intimate low-intensity ambient falloff',
    description: 'Intimate, warm candlelight with gentle flame flicker',
    keywords: ['candle', 'fire', 'intimate', 'room', 'table', 'night', 'warm', 'dinner', 'cozy', 'flame', 'dark', 'fireplace', 'antique']
  },
  {
    id: 'strobe-pulse',
    label: 'Strobe Light Pulses',
    category: 'lighting',
    tagText: 'harsh rhythmic strobe light pulses, high-intensity flash illumination, intense contrast silhouettes',
    description: 'High-energy pulsing strobe light for kinetic scenes',
    keywords: ['dance', 'club', 'beat', 'music', 'party', 'strobe', 'flash', 'fast', 'electronic', 'energy', 'crowd', 'rave', 'chaos']
  },
  {
    id: 'anamorphic-blue-flare',
    label: 'Anamorphic Blue Flares',
    category: 'lighting',
    tagText: 'horizontal anamorphic blue streak lens flares, sci-fi optical aberrations, oval highlight bokeh',
    description: 'Cinematic horizontal blue light streaks across frame',
    keywords: ['sci-fi', 'space', 'headlights', 'car', 'future', 'laser', 'star', 'night', 'flare', 'lens', 'cinematic', 'cinema', 'drive']
  },
  {
    id: 'dystopian-smog-haze',
    label: 'Dystopian Smog Haze',
    category: 'lighting',
    tagText: 'thick industrial smog haze, yellow sodium vapor street lamps, murky atmospheric density, humid light diffusion',
    description: 'Moody urban fog and yellow sodium street lamps',
    keywords: ['city', 'industrial', 'factory', 'smog', 'fog', 'smoke', 'steam', 'street', 'night', 'dystopia', 'grimy', 'polluted', 'gloomy']
  },
  {
    id: 'bioluminescent-shimmer',
    label: 'Bioluminescent Shimmer',
    category: 'lighting',
    tagText: 'organic bioluminescent turquoise and indigo glow, pulsing ethereal particles, underwater caustic light reflections',
    description: 'Mystical glowing flora, fauna, or underwater caustics',
    keywords: ['water', 'ocean', 'underwater', 'magic', 'dream', 'sea', 'alien', 'nature', 'night', 'glow', 'fantasy', 'spirit', 'shimmer']
  },
  {
    id: 'eerie-underlighting',
    label: 'Ominous Uplight',
    category: 'lighting',
    tagText: 'eerie theatrical underlighting from low angle, sharp dramatic facial shadows cast upward, sinister mood',
    description: 'Unsettling lighting from underneath creating sinister shadows',
    keywords: ['horror', 'villain', 'monster', 'evil', 'scary', 'spooky', 'fear', 'threat', 'witch', 'creepy', 'shadow', 'gothic']
  },

  // --- CAMERA & COMPOSITION ---
  {
    id: 'low-angle-hero',
    label: 'Low-Angle Hero Shot',
    category: 'camera',
    tagText: 'extreme low-angle hero framing, towering monumental perspective, dynamic low ground-level vantage',
    description: 'Powerful upward angle making the subject look dominant',
    keywords: ['hero', 'power', 'stand', 'strong', 'fight', 'giant', 'sky', 'tower', 'walk', 'conquer', 'rise', 'leader', 'king', 'queen']
  },
  {
    id: 'shallow-bokeh-85mm',
    label: '85mm f/1.4 Portrait Bokeh',
    category: 'camera',
    tagText: '85mm portrait prime lens, wide open f/1.4 aperture, creamy shallow depth of field, melted background bokeh',
    description: 'Ultra-creamy background blur isolating the subject',
    keywords: ['portrait', 'face', 'eyes', 'look', 'girl', 'man', 'character', 'emotion', 'cry', 'smile', 'intimate', 'alone', 'close']
  },
  {
    id: 'macro-100mm-detail',
    label: 'Macro 100mm Extreme Detail',
    category: 'camera',
    tagText: '100mm macro extreme close-up, microscopic textural fidelity, ultra-shallow focal plane, intricate surface details',
    description: 'Hyper-detailed close-up on eyes, drops, or small objects',
    keywords: ['eye', 'drop', 'tear', 'finger', 'ring', 'flower', 'insect', 'skin', 'texture', 'detail', 'lips', 'close', 'touch', 'clock']
  },
  {
    id: 'wide-anamorphic-239',
    label: 'Wide Anamorphic 2.39:1',
    category: 'camera',
    tagText: 'cinemascope 2.39:1 aspect ratio, wide anamorphic cylindrical lens, expansive panoramic horizon, subtle edge distortion',
    description: 'Epic cinematic widescreen vista framing',
    keywords: ['landscape', 'horizon', 'desert', 'mountain', 'city', 'wide', 'vast', 'sky', 'road', 'journey', 'epic', 'cinema', 'ocean']
  },
  {
    id: 'dutch-angle-tension',
    label: 'Dutch Angle Tension',
    category: 'camera',
    tagText: 'canted Dutch angle 20 degrees, off-axis diagonal composition, psychological unease and disorientation',
    description: 'Tilted camera creating suspense, chaos, or unease',
    keywords: ['crazy', 'insane', 'run', 'chase', 'panic', 'drunk', 'dizzy', 'fear', 'tension', 'fall', 'fight', 'danger', 'gun', 'trap']
  },
  {
    id: 'overhead-birds-eye',
    label: "Overhead Bird's Eye View",
    category: 'camera',
    tagText: '90-degree straight top-down overhead perspective, geometric aerial view, symmetrical bird’s eye composition',
    description: 'Direct top-down perspective showing floor patterns & geometry',
    keywords: ['bed', 'floor', 'ground', 'water', 'lie', 'aerial', 'drone', 'pool', 'car', 'intersection', 'maze', 'spiral', 'dance', 'top']
  },
  {
    id: 'symmetrical-center-kubrick',
    label: 'Symmetrical Center Frame',
    category: 'camera',
    tagText: 'meticulous one-point perspective, perfectly centered symmetrical framing, leading lines converging to center point',
    description: 'Precise, hypnotic center-weighted architectural framing',
    keywords: ['hallway', 'corridor', 'room', 'door', 'hotel', 'mirror', 'architecture', 'center', 'symmetry', 'wes anderson', 'kubrick']
  },
  {
    id: 'split-diopter-deep',
    label: 'Split Diopter Deep Focus',
    category: 'camera',
    tagText: 'split diopter shot, razor-sharp extreme foreground subject and equally razor-sharp distant background subject',
    description: 'Simultaneous focus on extreme foreground and background',
    keywords: ['dialogue', 'watch', 'spy', 'behind', 'two', 'look', 'foreground', 'background', 'threat', 'stalk', 'confrontation']
  },
  {
    id: 'first-person-pov',
    label: 'Immersive POV Angle',
    category: 'camera',
    tagText: 'immersive first-person POV shot, subject eye-level vantage point, interactive hands visible in frame',
    description: 'Through the eyes of the character for deep immersion',
    keywords: ['see', 'look', 'hand', 'reach', 'mirror', 'drive', 'run', 'eyes', 'view', 'experience', 'walk', 'door']
  },
  {
    id: 'curvilinear-fisheye-8mm',
    label: '8mm Fisheye Distortion',
    category: 'camera',
    tagText: 'ultra-wide 8mm circular fisheye lens, extreme barrel distortion, curved horizon lines, 90s hip-hop music video aesthetic',
    description: 'Iconic curved barrel distortion and music video punch',
    keywords: ['90s', 'rap', 'hip-hop', 'skate', 'street', 'energy', 'wild', 'fun', 'jump', 'punch', 'party', 'distortion', 'fish']
  },

  // --- COLOR & FILM STOCK ---
  {
    id: 'kodak-vision3-500t',
    label: 'Kodak Vision3 500T 35mm',
    category: 'color',
    tagText: 'shot on Kodak Vision3 500T 35mm film stock, organic chemical grain, rich warm skin tones, authentic red halation on highlights',
    description: 'The golden standard of cinematic movie film stock',
    keywords: ['film', '35mm', 'movie', 'cinematic', 'grain', 'classic', 'hollywood', 'night', 'skin', 'authentic', 'vintage', 'kodak']
  },
  {
    id: 'bleach-bypass-gritty',
    label: 'Bleach Bypass Desaturation',
    category: 'color',
    tagText: 'bleach bypass color grading, high-contrast desaturated palette, silvery metallic midtones, deep crushing shadows',
    description: 'Gritty, desaturated silver look (Seven, Saving Private Ryan)',
    keywords: ['gritty', 'war', 'fight', 'action', 'dirty', 'metal', 'cold', 'harsh', 'dystopia', 'concrete', 'industrial', 'steel']
  },
  {
    id: 'teal-and-amber-cinema',
    label: 'Teal & Amber Blockbuster',
    category: 'color',
    tagText: 'Hollywood teal and warm amber color harmony, rich complementary chromatic separation, glowing skin tones against cool shadows',
    description: 'Blockbuster complementary color grade separating skin & cool background',
    keywords: ['action', 'blockbuster', 'hollywood', 'orange', 'teal', 'blue', 'fire', 'explosion', 'sun', 'sky', 'night', 'cool']
  },
  {
    id: 'high-contrast-monochrome',
    label: 'High-Contrast B&W Film',
    category: 'color',
    tagText: 'pure high-contrast black and white, deep inky blacks, luminous silver highlights, fine Agfa Scala monochrome grain structure',
    description: 'Timeless, dramatic black-and-white fine art photography',
    keywords: ['black and white', 'monochrome', 'b&w', 'noir', 'classic', 'jazz', 'smoke', 'shadow', 'silhouette', 'timeless', 'art']
  },
  {
    id: 'vibrant-technicolor-3strip',
    label: 'Vibrant 3-Strip Technicolor',
    category: 'color',
    tagText: 'vintage 3-strip Technicolor process, hyper-saturated primary crimson reds, emerald greens, and rich cyan blues, 1950s golden age cinema',
    description: 'Rich, vivid vintage color saturation from 1950s cinema',
    keywords: ['retro', 'vintage', 'red', 'dress', 'color', 'bright', 'vibrant', '50s', 'hollywood', 'musical', 'fairy', 'garden', 'magic']
  },
  {
    id: 'muted-nordic-slate',
    label: 'Muted Nordic Earthy',
    category: 'color',
    tagText: 'desaturated Scandinavian color palette, muted slate grays, cold overcast light, moss green accents, subdued melancholic tones',
    description: 'Subtle, overcast, understated Nordic mood and colors',
    keywords: ['cold', 'winter', 'sad', 'melancholy', 'alone', 'snow', 'ice', 'mountain', 'forest', 'gray', 'rain', 'quiet', 'peaceful']
  },
  {
    id: 'grainy-16mm-bolex',
    label: 'Grainy 16mm Vintage Bolex',
    category: 'color',
    tagText: 'grainy 16mm Bolex film look, visible gate weave, soft micro-scratches, warm pastel halation, nostalgic indie film vibe',
    description: 'Warm, textured indie music video and documentary grain',
    keywords: ['vintage', 'indie', 'super 8', '16mm', 'nostalgia', 'summer', 'youth', 'memory', 'friend', 'road trip', 'sun', 'retro']
  },
  {
    id: 'wes-anderson-pastel-palette',
    label: 'Pastel Storybook Palette',
    category: 'color',
    tagText: 'storybook pastel color palette, mustard yellow, dusty rose pink, powder blue, delicate vintage saturation',
    description: 'Quirky pastel colors with whimsical artistic balance',
    keywords: ['pastel', 'yellow', 'pink', 'retro', 'quirky', 'cute', 'whimsical', 'hotel', 'room', 'fashion', 'anderson', 'art']
  },
  {
    id: 'cyberpunk-acid-neon',
    label: 'Acid Neon Ultraviolet',
    category: 'color',
    tagText: 'hyper-saturated ultraviolet color grade, toxic lime green, hot magenta, electric cyan, high-voltage contrast',
    description: 'High-voltage acid neon palette for futuristic and electronic scenes',
    keywords: ['neon', 'rave', 'cyber', 'future', 'laser', 'uv', 'purple', 'green', 'magenta', 'club', 'synthwave', 'alien']
  },

  // --- MOTION & DYNAMICS ---
  {
    id: 'hyper-slow-mo-120fps',
    label: '120fps Hyper Slow-Motion',
    category: 'motion',
    tagText: 'ultra slow-motion 120fps capture, suspended kinetic water droplets and particles, graceful deceleration of movement',
    description: 'Silky smooth slow-motion capturing fleeting particles and motion',
    keywords: ['slow', 'water', 'rain', 'hair', 'jump', 'fall', 'dance', 'glass', 'shatter', 'explosion', 'tear', 'drop', 'graceful', 'fly']
  },
  {
    id: 'vertigo-dolly-zoom',
    label: 'Vertigo Dolly Zoom',
    category: 'motion',
    tagText: 'Hitchcock vertigo dolly zoom (zolly), camera tracks forward while lens zooms out, warping spatial background compression',
    description: 'Perspective-warping push-pull effect conveying shock or epiphany',
    keywords: ['shock', 'realize', 'discover', 'scared', 'revelation', 'mind', 'eyes', 'hallway', 'zoom', 'dolly', 'vertigo', 'epiphany']
  },
  {
    id: 'fast-kinetic-whip-pan',
    label: 'Kinetic Whip Pan',
    category: 'motion',
    tagText: 'fast horizontal whip pan with heavy directional motion blur, high-velocity transition snap, energetic pacing',
    description: 'Rapid camera snap across subjects with dynamic motion blur',
    keywords: ['fast', 'speed', 'energy', 'beat', 'cut', 'switch', 'car', 'action', 'race', 'run', 'turn', 'whip', 'pan']
  },
  {
    id: 'weightless-floating-drift',
    label: 'Weightless Floating Drift',
    category: 'motion',
    tagText: 'zero-gravity floating camera drift, smooth levitating subject, slow ethereal rotation through three-dimensional space',
    description: 'Dreamy zero-g floating motion with continuous graceful drift',
    keywords: ['float', 'fly', 'space', 'dream', 'sky', 'clouds', 'levitate', 'water', 'swim', 'ethereal', 'angel', 'magic', 'sleep']
  },
  {
    id: 'handheld-cinema-verite',
    label: 'Handheld Cinema Verité',
    category: 'motion',
    tagText: 'organic handheld camera sway, subtle human micro-tremors, cinema verité documentary realism, intimate following motion',
    description: 'Intimate, grounded handheld motion for documentary realism',
    keywords: ['documentary', 'real', 'raw', 'intimate', 'street', 'follow', 'walk', 'talk', 'behind', 'crowd', 'natural', 'authentic']
  },
  {
    id: '360-orbital-sweep',
    label: '360° Orbital Camera Sweep',
    category: 'motion',
    tagText: 'continuous 360-degree orbital camera tracking shot revolving around central subject, fluid cinematic arc',
    description: 'Smooth circling camera shot enveloping the character',
    keywords: ['circle', 'orbit', 'dance', 'kiss', 'stand', 'look', 'surround', 'embrace', 'center', 'music', 'stage', 'sing']
  },
  {
    id: 'bullet-time-freeze',
    label: 'Bullet Time 3D Freeze',
    category: 'motion',
    tagText: 'Matrix-style bullet time camera rotation, subject frozen mid-action in mid-air, dynamic orbiting camera angle',
    description: 'Frozen in mid-air with camera revolving around the action',
    keywords: ['freeze', 'matrix', 'jump', 'bullet', 'punch', 'kick', 'explosion', 'stop', 'time', 'action', 'shatter', 'mid-air']
  },
  {
    id: 'speed-ramp-burst',
    label: 'Dynamic Speed Ramp',
    category: 'motion',
    tagText: 'dynamic speed ramp, rapid high-speed acceleration transitioning instantly into extreme fluid slow-motion',
    description: 'Impactful acceleration suddenly snapping into slow motion',
    keywords: ['impact', 'punch', 'strike', 'land', 'race', 'car', 'drift', 'kick', 'beat', 'drop', 'dance', 'action']
  },
  {
    id: 'slow-creeping-push-in',
    label: 'Slow Creeping Push-In',
    category: 'motion',
    tagText: 'imperceptible slow creeping dolly push-in toward subject, mounting psychological tension and emotional focus',
    description: 'Subtle creeping camera movement tightening tension',
    keywords: ['stare', 'think', 'listen', 'wait', 'tension', 'quiet', 'whisper', 'face', 'eyes', 'room', 'dark', 'fear']
  },

  // --- AESTHETIC & GENRE VIBE ---
  {
    id: 'cyberpunk-dystopia',
    label: 'Cyberpunk Rain Dystopia',
    category: 'aesthetic',
    tagText: 'rain-slicked cyberpunk megacity, towering holographic advertisements, neon Kanji signs, steam rising from grates',
    description: 'Futuristic Blade Runner rain, neon reflections & holograms',
    keywords: ['cyberpunk', 'future', 'robot', 'cyborg', 'hologram', 'neon', 'rain', 'blade runner', 'megacity', 'tokyo', 'sci-fi']
  },
  {
    id: 'surrealist-dreamscape',
    label: 'Surrealist Dream Logic',
    category: 'aesthetic',
    tagText: 'surrealist dreamscape logic, floating architectural ruins, metaphysical sky, soft atmospheric gradients, Magritte and Dalí influence',
    description: 'Mind-bending dream imagery with impossible architecture',
    keywords: ['surreal', 'dream', 'magic', 'impossible', 'sky', 'floating', 'cloud', 'mirror', 'mind', 'hallucination', 'strange', 'weird']
  },
  {
    id: 'grindhouse-70s-film',
    label: '70s Grindhouse Exploitation',
    category: 'aesthetic',
    tagText: 'vintage 1970s grindhouse exploitation film, visible cigarette burns, film frame jitter, heavy celluloid grain, warm analog color',
    description: 'Gritty 1970s drive-in cinema grit and vintage distress',
    keywords: ['70s', 'grindhouse', 'retro', 'dirty', 'car', 'chase', 'tarantino', 'vintage', 'rough', 'action', 'desert', 'b-movie']
  },
  {
    id: 'ethereal-high-fantasy',
    label: 'Ethereal High Fantasy',
    category: 'aesthetic',
    tagText: 'high fantasy celestial atmosphere, luminous airborne spores, ancient overgrown stone ruins, sacred golden aura, mystical majesty',
    description: 'Majestic ancient fantasy world with glowing airborne dust and sacred ruins',
    keywords: ['fantasy', 'magic', 'ruins', 'forest', 'castle', 'sword', 'goddess', 'angel', 'elf', 'ancient', 'sacred', 'myth']
  },
  {
    id: 'gothic-noir-decay',
    label: 'Gothic Decadence',
    category: 'aesthetic',
    tagText: 'decaying Victorian gothic mansion, ornate heavy velvet drapes, cracked antique mirrors, cobweb-draped candelabras, brooding atmosphere',
    description: 'Atmospheric, decayed romantic gothic luxury',
    keywords: ['gothic', 'vampire', 'castle', 'mansion', 'velvet', 'mirror', 'candle', 'dark', 'romantic', 'decay', 'victorian', 'antique']
  },
  {
    id: 'modern-minimalist-brutalist',
    label: 'Brutalist Minimalist',
    category: 'aesthetic',
    tagText: 'monumental raw concrete brutalist architecture, stark geometric shadows, vast negative space, clean modernist aesthetics',
    description: 'Stark geometric concrete architecture with bold negative space',
    keywords: ['concrete', 'minimal', 'modern', 'architecture', 'clean', 'lines', 'geometric', 'stark', 'gallery', 'museum', 'monolith']
  },
  {
    id: 'retro-80s-synthwave',
    label: '80s Synthwave Sunset',
    category: 'aesthetic',
    tagText: 'retro 80s synthwave horizon, glowing wireframe grid terrain, chrome sports car reflections, low-poly magenta sun',
    description: 'Retro 80s outrun grid, sunset chrome, and magenta nostalgia',
    keywords: ['80s', 'synthwave', 'retrowave', 'grid', 'sunset', 'palm', 'chrome', 'miami', 'drive', 'neon', 'synth']
  },
  {
    id: 'apocalyptic-solar-eclipse',
    label: 'Apocalyptic Eclipse',
    category: 'aesthetic',
    tagText: 'apocalyptic total solar eclipse, glowing corona ring in pitch twilight sky, scorched desolate terrain, ash floating in air',
    description: 'Dramatic solar eclipse over desolate cinematic landscape',
    keywords: ['apocalypse', 'eclipse', 'sun', 'dark', 'end', 'ash', 'desert', 'ruin', 'fire', 'scorched', 'wasteland', 'doomsday']
  }
];

// --- Engine Helper: Analyze Scene Text & Extract Contextual Tags ---
export function analyzeSceneForSuggestions(
  description: string = '',
  lyric: string = '',
  existingPrompt: string = ''
): SmartSuggestionResult {
  const combinedText = `${description} ${lyric} ${existingPrompt}`.toLowerCase();
  const words = combinedText.split(/[\s,.;:!?()"-]+/).filter(w => w.length > 2);

  // Score each tag based on keyword matches
  const scoredTags = SMART_PROMPT_TAGS.map(tag => {
    let score = 0;
    tag.keywords.forEach(kw => {
      if (combinedText.includes(kw.toLowerCase())) {
        score += 3;
      }
      // Exact word match bonus
      if (words.includes(kw.toLowerCase())) {
        score += 5;
      }
    });

    // Check if tag text or label already in prompt
    const isAlreadyPresent = existingPrompt.toLowerCase().includes(tag.label.toLowerCase()) ||
      existingPrompt.toLowerCase().includes(tag.id.replace(/-/g, ' '));

    return {
      tag,
      score,
      isAlreadyPresent
    };
  });

  // Sort contextual matches with highest score first
  const contextual = scoredTags
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.tag);

  // If few or no matches, provide a balanced top recommendation set
  const contextualTags = contextual.length >= 4 ? contextual.slice(0, 12) : [
    ...contextual,
    ...SMART_PROMPT_TAGS.filter(t => !contextual.some(c => c.id === t.id)).slice(0, 8 - contextual.length)
  ];

  // Group all tags by category
  const allTags: Record<string, PromptTag[]> = {
    lighting: SMART_PROMPT_TAGS.filter(t => t.category === 'lighting'),
    camera: SMART_PROMPT_TAGS.filter(t => t.category === 'camera'),
    color: SMART_PROMPT_TAGS.filter(t => t.category === 'color'),
    motion: SMART_PROMPT_TAGS.filter(t => t.category === 'motion'),
    aesthetic: SMART_PROMPT_TAGS.filter(t => t.category === 'aesthetic'),
  };

  const categoryCounts: Record<string, number> = {
    all: SMART_PROMPT_TAGS.length,
    contextual: contextualTags.length,
    lighting: allTags.lighting.length,
    camera: allTags.camera.length,
    color: allTags.color.length,
    motion: allTags.motion.length,
    aesthetic: allTags.aesthetic.length,
  };

  return {
    contextualTags,
    allTags,
    categoryCounts
  };
}

// --- Helper: Format and Append / Toggle a Tag into a Prompt String ---
export function toggleTagInPrompt(prompt: string, tag: PromptTag | { tagText: string; label: string }): { newPrompt: string; added: boolean } {
  const current = (prompt || '').trim();
  const tagSnippet = tag.tagText;
  
  // Check if tag is already contained
  const hasTag = current.toLowerCase().includes(tag.label.toLowerCase()) || 
                 current.toLowerCase().includes(tagSnippet.toLowerCase().slice(0, 25));

  if (hasTag) {
    // Remove the tag snippet cleanly
    let updated = current;
    // Try removing full tag text
    updated = updated.replace(tagSnippet, '');
    // Try removing tag label
    const labelRegex = new RegExp(`,?\\s*${tag.label}[^,]*`, 'gi');
    updated = updated.replace(labelRegex, '');
    // Clean up residual double commas or trailing commas
    updated = updated
      .replace(/,\s*,+/g, ', ')
      .replace(/^\s*,\s*/, '')
      .replace(/,\s*$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return { newPrompt: updated, added: false };
  } else {
    // Append tag smoothly
    let updated = current;
    if (updated.length > 0) {
      if (!updated.endsWith(',')) {
        updated += ',';
      }
      updated += ` ${tagSnippet}`;
    } else {
      updated = tagSnippet;
    }
    return { newPrompt: updated, added: true };
  }
}

// --- Helper: Auto-Enhance a prompt with a balanced bundle of top suggestions ---
export function autoEnhancePromptBundle(currentPrompt: string, suggestedTags: PromptTag[]): string {
  let prompt = (currentPrompt || '').trim();
  
  // Pick 1 lighting, 1 camera/lens, 1 color/grain, 1 motion/aesthetic from top suggestions
  const selected: PromptTag[] = [];
  const categoriesNeeded: ('lighting' | 'camera' | 'color' | 'motion' | 'aesthetic')[] = ['lighting', 'camera', 'color', 'motion'];

  for (const cat of categoriesNeeded) {
    const match = suggestedTags.find(t => t.category === cat && !prompt.toLowerCase().includes(t.label.toLowerCase()));
    if (match) {
      selected.push(match);
    }
  }

  // If still need more, pick any top contextual tag not in prompt
  if (selected.length < 3) {
    for (const t of suggestedTags) {
      if (!selected.includes(t) && !prompt.toLowerCase().includes(t.label.toLowerCase())) {
        selected.push(t);
        if (selected.length >= 3) break;
      }
    }
  }

  // Apply selected tags
  for (const tag of selected) {
    const res = toggleTagInPrompt(prompt, tag);
    if (res.added) {
      prompt = res.newPrompt;
    }
  }

  return prompt;
}
