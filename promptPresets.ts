// Storyboard Prompt Presets Engine & Storage

export interface PromptPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  imagePrompt: string;
  videoPrompts: string[]; // [Subtle, Dynamic, Stylistic]
  soraPrompt: string;
  cameraMovement?: string;
  transitionIn?: string;
  transitionOut?: string;
  tags: string[];
  isBuiltIn?: boolean;
  createdAt: string;
  author?: string;
}

export const PRESET_CATEGORIES = [
  'All',
  'Cinematic',
  'Sci-Fi & Cyberpunk',
  'Vintage & Retro',
  'Music Video & Hip-Hop',
  'Atmospheric & Moody',
  'Anime & Stylized',
  'Dark Fantasy & Horror',
  'Studio & High-Fashion',
  'Custom'
] as const;

export const BUILTIN_PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'builtin-anamorphic-neo-noir',
    name: 'Anamorphic Neo-Noir Rain',
    category: 'Cinematic',
    description: 'Moody, rain-slicked urban setting with cyan/amber contrast, anamorphic oval bokeh, and high-contrast wet street reflections.',
    imagePrompt: 'Cinematic 35mm film still, neo-noir urban street at midnight drenched in rain, glowing cyan and amber neon signs reflecting on wet asphalt, anamorphic lens flare, shallow depth of field, 8k resolution, atmospheric steam rising from storm drain, Kodak Vision3 color grading.',
    videoPrompts: [
      'Slow cinematic dolly push-in down the rain-slicked neon street, reflections shimmering in puddles, subtle atmospheric steam drifting.',
      'Dynamic low-angle tracking shot gliding over wet pavement, neon reflections warping, raindrops splashing in hyper-slow motion.',
      'Stylized chromatic aberration pulse, neon lighting flickering in rhythmic sync with bass, rain streaks shearing diagonally across the anamorphic frame.'
    ],
    soraPrompt: 'Cinematic continuous camera push-in through a rain-drenched neon metropolis at night. Wet asphalt mirrors vibrant cyan and gold shop signs. Atmospheric mist and steam curl upwards as raindrops fall in crisp cinematic slow-motion.',
    cameraMovement: 'Dolly In',
    transitionIn: 'fade',
    transitionOut: 'dissolve',
    tags: ['Neo-Noir', 'Neon', 'Rain', 'Anamorphic', 'Urban', 'Reflections'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'builtin-vintage-16mm-folk',
    name: 'Vintage 16mm Sun-Drenched Roadtrip',
    category: 'Vintage & Retro',
    description: 'Nostalgic 1970s Kodachrome warmth, organic film grain, golden hour lens flare, and sun-bleached coastal textures.',
    imagePrompt: 'Authentic 16mm vintage film photograph, golden hour sunlight streaming through vintage car window, dust motes dancing in warm sunbeams, Kodachrome 64 film stock, organic halation, soft film grain, sun-faded terracotta and teal palette, tactile nostalgic mood.',
    videoPrompts: [
      'Gentle handheld camera swaying gently inside the vintage car, sun flares periodically bursting through the windscreen.',
      'Smooth tracking shot pacing alongside the moving vehicle on an open coastal highway, golden hour backlight creating warm silhouettes.',
      'Stylized 16mm shutter stutter with subtle film burns and light leaks fluttering across the edges of the frame.'
    ],
    soraPrompt: 'Warm 16mm film footage of a classic road trip at sunset. Golden hour sun flares glance off the windshield, visible fine film grain and subtle halation glowing on sun-kissed textures. Natural handheld camera motion.',
    cameraMovement: 'Dynamic Handheld',
    transitionIn: 'dissolve',
    transitionOut: 'fade',
    tags: ['16mm', 'Kodachrome', 'Golden Hour', 'Vintage', 'Nostalgia', 'Handheld'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'builtin-cyberpunk-hologram-chase',
    name: 'Cyberpunk Megacity Holograms',
    category: 'Sci-Fi & Cyberpunk',
    description: 'Towering dystopian skyscrapers with towering 3D holographic advertisements, volumetric lasers, and high-speed energy.',
    imagePrompt: 'Futuristic cyberpunk metropolis canyon, towering skyscrapers with colossal magenta and electric-blue 3D holographic billboards, flying vehicles streaming light trails in upper atmosphere, volumetric smog, dense neon architecture, Octane Render photorealistic detail.',
    videoPrompts: [
      'High-speed FPV drone flythrough dipping between holographic skyscrapers and descending through neon cloud layers.',
      'Sweeping 360-degree rotational orbit around a rooftop ledge overlooking the infinite luminous city expanse.',
      'Glitchy digital datamosh pulse with chromatic RGB split, holographic advertisements glitching rhythmically.'
    ],
    soraPrompt: 'High-speed cinematic camera flight weaving between colossal cyberpunk skyscrapers. Volumetric magenta and cyan holographic ads flicker through dense atmospheric haze as flying hovercars leave luminous light trails.',
    cameraMovement: 'FPV Drone Flythrough',
    transitionIn: 'zoom-in',
    transitionOut: 'dissolve',
    tags: ['Cyberpunk', 'Hologram', 'Sci-Fi', 'Dystopian', 'FPV Drone', 'Futuristic'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'builtin-hyperkinetic-trap-fisheye',
    name: 'Hyper-Kinetic Trap Fisheye Strobe',
    category: 'Music Video & Hip-Hop',
    description: '90s-inspired ultra-wide 8mm circular fisheye lens, intense strobe flashes, vibrant saturation, and kinetic energy.',
    imagePrompt: 'Dynamic music video still shot on extreme circular 8mm fisheye lens, dramatic barrel distortion, hyper-saturated primary colors, harsh high-contrast strobe lighting, motion blur on extremities, studio warehouse backdrop, high-energy hip-hop aesthetic.',
    videoPrompts: [
      'Snappy whip-pan transition rocking between close-up fisheye expressions and floor-level wide perspectives.',
      'Aggressive forward push-in with rapid zoom stutter matching the driving tempo and 808 bass kick.',
      'High-speed strobe flash effect cycling between red, white, and emerald green backlight gels in rapid succession.'
    ],
    soraPrompt: 'Aggressive ultra-wide fisheye music video camera work. Dynamic snap zooms and kinetic whip pans in an industrial strobe-lit studio with saturated neon edge lighting and intense optical distortion.',
    cameraMovement: 'Whip Pan',
    transitionIn: 'slide-left',
    transitionOut: 'slide-right',
    tags: ['Fisheye', 'Hip-Hop', 'Trap', 'Strobe', 'Kinetic', 'High Energy'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'builtin-dreamy-ethereal-bloom',
    name: 'Dreamy Ethereal Bloom & Mist',
    category: 'Atmospheric & Moody',
    description: 'Surreal, luminous pastel dreamscape with soft diffusion filters, glowing highlights, floating particles, and serene emotion.',
    imagePrompt: 'Dreamlike ethereal fine art film still, soft Pro-Mist diffusion filter, glowing iridescent backlight, pastel lilac and peach color palette, floating luminous dust and flower petals, surreal reflective water mirror on ground, serene cinematic atmosphere.',
    videoPrompts: [
      'Extremely slow floating crane shot descending into the glowing mist, soft particles drifting weightlessly toward the camera.',
      'Gentle circular orbit around the subject while soft pastel light rays shift and refract through morning dew.',
      'Slow-motion shutter dissolve, ethereal glow intensifying into a soft white bloom before settling back.'
    ],
    soraPrompt: 'Slow ethereal camera float through a glowing pastel mist dreamscape. Soft Pro-Mist diffusion produces angelic halos around light sources as iridescent dust particles float in serene zero-gravity slow motion.',
    cameraMovement: 'Crane Down',
    transitionIn: 'fade',
    transitionOut: 'fade',
    tags: ['Ethereal', 'Dreamy', 'Pro-Mist', 'Pastel', 'Atmospheric', 'Bloom'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'builtin-90s-grunge-vhs',
    name: '90s Grunge VHS Analogue Tape',
    category: 'Vintage & Retro',
    description: 'Raw, gritty 1990s MTV alt-rock music video look with magnetic tape scanlines, chromatic shifts, and low-light grit.',
    imagePrompt: 'Authentic 1990s VHS tape capture, analogue CRT scanlines, tracking artifacts along lower border, desaturated olive and rust tones, high grain, direct harsh on-camera flash illumination, underground grunge basement rehearsal space.',
    videoPrompts: [
      'Handheld jittery camera with slight magnetic tape tracking noise wobble, fast jerky zooms.',
      'Rapid cut-and-reframe motion mimicking vintage Hi8 camcorder autofocus hunting and zoom snap.',
      'Analogue color channel glitch with red-blue chromatic separation and intermittent static tape flash.'
    ],
    soraPrompt: 'Authentic 90s camcorder aesthetic with visible magnetic tape tracking lines, scanline noise, and high contrast flash lighting in a dim grunge setting. Kinetic natural handheld wobble.',
    cameraMovement: 'Dynamic Handheld',
    transitionIn: 'dissolve',
    transitionOut: 'fade',
    tags: ['VHS', '90s', 'Grunge', 'Analogue', 'Retro', 'Scanlines'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'builtin-deep-space-odyssey',
    name: 'Cosmic Deep Space Odyssey',
    category: 'Sci-Fi & Cyberpunk',
    description: 'Majestic Interstellar-scale celestial cinematography with nebula dust, ringed planets, and cold cinematic realism.',
    imagePrompt: 'Epic cinematic 70mm IMAX space cinematography, monolithic spacecraft orbiting a colossal gas giant with iridescent golden rings, distant supernova nebula illuminating deep black void, sharp rim light, hyper-detailed mechanical hull plating.',
    videoPrompts: [
      'Monumental slow tracking shot gliding alongside the gargantuan spacecraft hull as the ringed planet rises over the horizon.',
      'Silent rotational arc orbit looking down from planetary orbit toward the swirling atmospheric storms.',
      'Lens flare streak from a blinding solar flare piercing across the frame with deep blue anamorphic horizontal streak.'
    ],
    soraPrompt: 'Grand IMAX cinematic space shot. Camera slowly glides along the detailed hull of a massive spacecraft as a colossal ringed planet rotates majestically against a backdrop of glowing nebula dust and starfields.',
    cameraMovement: 'Tracking Shot Right',
    transitionIn: 'fade',
    transitionOut: 'dissolve',
    tags: ['Space', 'IMAX', 'Sci-Fi', 'Cosmic', 'Nebula', 'Epic'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'builtin-studio-high-fashion',
    name: 'Studio High-Fashion Editorial',
    category: 'Studio & High-Fashion',
    description: 'Pristine, hyper-clean high-fashion editorial lighting with dramatic razor-sharp shadows, avant-garde framing, and luxury elegance.',
    imagePrompt: 'High-fashion editorial cover shot, stark minimalist studio setting, razor-sharp hard key light paired with subtle deep crimson rim lighting, high-contrast monochrome and ruby red palette, sculptural avant-garde silhouette, Vogue cover composition, medium format Hasselblad clarity.',
    videoPrompts: [
      'Smooth automated robotic arm push-in revealing intricate fabric movement and glossy specular highlights.',
      'Sleek lateral pedestal tracking shot moving across architectural shadow lines projected onto the backdrop.',
      'High-speed synchronized strobe pulse freezing silk drapery floating in mid-air in pristine 1000fps clarity.'
    ],
    soraPrompt: 'Luxury high-fashion editorial visual. Ultra-smooth robotic camera motion pushes in against a stark minimalist studio with sculptural hard shadows and rich crimson rim light illuminating dynamic fabric flow.',
    cameraMovement: 'Dolly In',
    transitionIn: 'fade',
    transitionOut: 'dissolve',
    tags: ['Fashion', 'Editorial', 'Studio', 'Luxury', 'Minimalist', 'Hasselblad'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'builtin-anime-shonen-battle',
    name: 'Anime Shonen Climactic Aura',
    category: 'Anime & Stylized',
    description: 'High-octane Japanese anime aesthetic with glowing aura particles, dramatic perspective speed lines, and vibrant cel shading.',
    imagePrompt: 'High-budget Japanese anime climax key visual, dynamic extreme perspective foreshortening, glowing golden ki aura with electrical sparks crackling, cel-shaded vibrant colors, dramatic sky with shattered crystal floating debris, Ufotable studio animation quality.',
    videoPrompts: [
      'Rapid kinetic camera zoom surging through dense speed lines toward the center of the power aura eruption.',
      'Dynamic 360-degree rotational whirlwind following electrical sparks swirling into the sky.',
      'High-impact hit-stop flash frame with sudden inverted color flash before exploding into golden particle rays.'
    ],
    soraPrompt: 'Explosive Japanese anime action scene with intense glowing energy aura and crackling electrical lightning. Dynamic speed lines and fast perspective zooms in high-tier modern anime animation style.',
    cameraMovement: 'Zoom In',
    transitionIn: 'zoom-in',
    transitionOut: 'slide-right',
    tags: ['Anime', 'Shonen', 'Aura', 'Speed Lines', 'Cel Shading', 'Action'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'builtin-dark-fantasy-eldritch',
    name: 'Dark Fantasy Eldritch Woods',
    category: 'Dark Fantasy & Horror',
    description: 'Haunting Guillermo del Toro atmosphere with ancient gnarled trees, bioluminescent moss, and eerie moonlit emerald fog.',
    imagePrompt: 'Dark fantasy gothic cinematography, ancient gnarled primeval forest at witching hour, bioluminescent emerald mushrooms glowing on damp bark, dense creeping ground fog, silver moonlight piercing through twisted canopy, eerie mythological atmosphere, Pan\'s Labyrinth tone.',
    videoPrompts: [
      'Low creeping dolly shot pushing slowly beneath the twisted canopy through rolling green mist.',
      'Slow vertical tilt-up from glowing moss-covered tree roots to the colossal moon glowing through mist.',
      'Subtle shadow warping with atmospheric fog rolling across the lens with ghostly green light shifts.'
    ],
    soraPrompt: 'Cinematic slow creeping camera movement through a haunting primeval forest at night. Bioluminescent moss and fungi cast emerald glows through thick ground fog as silver moonbeams cut through the ancient canopy.',
    cameraMovement: 'Tilt Up',
    transitionIn: 'dissolve',
    transitionOut: 'fade',
    tags: ['Dark Fantasy', 'Horror', 'Eldritch', 'Forest', 'Gothic', 'Bioluminescent'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'builtin-golden-hour-roadtrip',
    name: 'Anamorphic Golden Hour Mirage',
    category: 'Cinematic',
    description: 'Wide 2.39:1 anamorphic horizon with intense warm backlight, heat waves rising from asphalt, and dramatic emotive silhouettes.',
    imagePrompt: 'Cinematic 2.39:1 widescreen anamorphic still, vast desert highway stretching to infinity under a blazing golden sunset, atmospheric heat wave shimmer, intense 2800K warm amber backlight creating sharp subject silhouettes, horizontal warm lens flare, Arri Alexa Mini LF.',
    videoPrompts: [
      'Smooth low-profile tracking shot following the highway centerline toward the setting sun.',
      'Cinematic Hitchcock vertigo dolly-zoom maintaining subject silhouette scale while the horizon expands dramatically.',
      'Warm optical bloom dissolve shifting into soft twilight indigo.'
    ],
    soraPrompt: 'Cinematic 2.39:1 anamorphic shot of an infinite desert highway at sunset. Golden horizon rays cast dramatic horizontal lens flares across the lens with realistic heat shimmer rising off the road.',
    cameraMovement: 'Dolly Zoom',
    transitionIn: 'fade',
    transitionOut: 'dissolve',
    tags: ['Golden Hour', 'Sunset', 'Anamorphic', 'Desert', 'Silhouette', 'Cinematic'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'builtin-club-strobe-rave',
    name: 'Steadicam Club Night Strobe',
    category: 'Music Video & Hip-Hop',
    description: 'Pulsing underground rave scene with dense haze, crimson and sapphire gel lights, laser beams, and immersive crowd motion.',
    imagePrompt: 'Underground electronic rave music video still, dense haze machine fog pierced by sharp green laser beams, deep crimson and sapphire gel backlighting, sweating crowd silhouettes dancing in ecstasy, high contrast cinematic grain, Euphoria style cinematography.',
    videoPrompts: [
      'Fluid Steadicam shot weaving smoothly through the dancing crowd toward the glowing DJ booth.',
      'Dynamic 360-degree rotational arc orbiting around the central subject under pulsing strobe flashes.',
      'Rhythmic shutter blur sync pulsing in time with the kick drum with color temperature flashes.'
    ],
    soraPrompt: 'Immersive Steadicam shot gliding through a packed, atmospheric underground club filled with laser beams and thick haze. Saturated crimson and blue lighting pulses as camera weaves around silhouettes.',
    cameraMovement: '360-Degree Arc',
    transitionIn: 'slide-left',
    transitionOut: 'fade',
    tags: ['Rave', 'Club', 'Strobe', 'Laser', 'Music Video', 'Euphoria'],
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

export const STORAGE_KEY_PRESETS = 'audioarc_prompt_presets';

// Helper to save custom presets
export const saveCustomPresetsToStorage = (presets: PromptPreset[]) => {
  try {
    const customOnly = presets.filter(p => !p.isBuiltIn);
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(customOnly));
  } catch (e) {
    console.error('Failed to save prompt presets to localStorage', e);
  }
};

// Helper to load presets merged with built-ins
export const loadPromptPresets = (): PromptPreset[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PRESETS);
    if (saved) {
      const custom: PromptPreset[] = JSON.parse(saved);
      return [...BUILTIN_PROMPT_PRESETS, ...custom];
    }
  } catch (e) {
    console.error('Failed to load prompt presets from localStorage', e);
  }
  return [...BUILTIN_PROMPT_PRESETS];
};

// Export presets as formatted JSON
export const exportPresetsToJson = (presets: PromptPreset[]): string => {
  return JSON.stringify(presets, null, 2);
};

// Import presets from JSON string
export const importPresetsFromJson = (jsonStr: string): PromptPreset[] => {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error('Presets file must be a JSON array');
    return parsed.map((item: any) => ({
      id: item.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: item.name || 'Untitled Preset',
      category: item.category || 'Custom',
      description: item.description || '',
      imagePrompt: item.imagePrompt || '',
      videoPrompts: Array.isArray(item.videoPrompts) ? item.videoPrompts : ['', '', ''],
      soraPrompt: item.soraPrompt || '',
      cameraMovement: item.cameraMovement || 'none',
      transitionIn: item.transitionIn || 'none',
      transitionOut: item.transitionOut || 'none',
      tags: Array.isArray(item.tags) ? item.tags : [],
      isBuiltIn: false,
      createdAt: item.createdAt || new Date().toISOString()
    }));
  } catch (e: any) {
    throw new Error(`Invalid Presets JSON: ${e.message}`);
  }
};
