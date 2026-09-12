
// --- Constants & Data ---

export const AI_MODELS = {
  main: [
    'gemini-3.8-flash',           // Latest default Flash model (fast, high quality)
    'gemini-3.1-flash-lite',       // Flash-Lite: ultra-fast, less expensive option
    'gemini-3.1-pro-preview',      // Pro: advanced reasoning & complex scripting
    'gemini-flash-latest',         // Latest production Flash alias
  ],
  utility: [
    'gemini-3.1-flash-lite',       // Flash-Lite: lowest cost, high speed for analysis
    'gemini-3.8-flash',           // Default Flash: balanced utility analysis
    'gemini-flash-latest',
  ],
  image: {
      gemini: [
        'gemini-3.1-flash-image',       // Nano Banana 2 (High Quality 512px, 1K, 2K, 4K)
        'gemini-3.1-flash-lite-image',  // Nano Banana 2 Lite (Fast & Cost-Effective)
        'gemini-3-pro-image',           // Nano Banana Pro (Highest Quality & Visual Reasoning)
      ],
      imagen: [
        'imagen-4.0-generate-001',      // Latest Imagen 4 model
        'imagen-3.0-generate-002',      // Imagen 3 high-detail standard
      ]
  }
};

export const AI_MODEL_LABELS: Record<string, string> = {
  // Main & Utility Models
  'gemini-3.8-flash': 'gemini-3.8-flash (Recommended · Fast & Balanced)',
  'gemini-3.1-flash-lite': 'gemini-3.1-flash-lite (Flash-Lite · Lowest Cost / High Speed)',
  'gemini-3.1-pro-preview': 'gemini-3.1-pro-preview (Pro · Deep Reasoning & Complexity)',
  'gemini-flash-latest': 'gemini-flash-latest (Latest Flash Alias)',
  // Gemini Image Models ("Nano Banana" series)
  'gemini-3.1-flash-image': 'gemini-3.1-flash-image (Nano Banana 2 · High Quality 1K-4K)',
  'gemini-3.1-flash-lite-image': 'gemini-3.1-flash-lite-image (Nano Banana 2 Lite · Fast & Economical)',
  'gemini-3-pro-image': 'gemini-3-pro-image (Nano Banana Pro · Pro Fidelity)',
  // Imagen Models
  'imagen-4.0-generate-001': 'imagen-4.0-generate-001 (Imagen 4 · Photorealistic)',
  'imagen-3.0-generate-002': 'imagen-3.0-generate-002 (Imagen 3 · High Detail)',
};

export const CINEMATIC_CAMERA_MOVEMENTS = [
  { id: 'none', name: 'Auto / Unspecified', category: 'General', directive: '' },
  // Dolly & Push
  { id: 'dolly-in', name: 'Dolly In', category: 'Dolly & Push', directive: 'Smooth cinematic dolly push-in toward the subject' },
  { id: 'dolly-out', name: 'Dolly Out', category: 'Dolly & Push', directive: 'Smooth cinematic dolly pull-out revealing the broader setting' },
  // Pan & Tilt
  { id: 'pan-left', name: 'Pan Left', category: 'Pan & Tilt', directive: 'Smooth horizontal camera pan from right to left' },
  { id: 'pan-right', name: 'Pan Right', category: 'Pan & Tilt', directive: 'Smooth horizontal camera pan from left to right' },
  { id: 'tilt-up', name: 'Tilt Up', category: 'Pan & Tilt', directive: 'Cinematic vertical camera tilt upward from base to zenith' },
  { id: 'tilt-down', name: 'Tilt Down', category: 'Pan & Tilt', directive: 'Cinematic vertical camera tilt downward toward the subject' },
  // Crane & Pedestal
  { id: 'crane-up', name: 'Crane Up', category: 'Crane & Pedestal', directive: 'Majestic sweeping crane shot ascending vertically upward' },
  { id: 'crane-down', name: 'Crane Down', category: 'Crane & Pedestal', directive: 'Sweeping crane shot descending vertically toward the action' },
  // Tracking & Orbit
  { id: 'tracking-left', name: 'Tracking Shot Left', category: 'Tracking & Orbit', directive: 'Lateral tracking shot trucking smoothly to the left alongside the subject' },
  { id: 'tracking-right', name: 'Tracking Shot Right', category: 'Tracking & Orbit', directive: 'Lateral tracking shot trucking smoothly to the right alongside the subject' },
  { id: 'orbit-360', name: '360° Arc / Orbit', category: 'Tracking & Orbit', directive: 'Dynamic 360-degree rotational arc shot orbiting smoothly around the subject' },
  // Dynamic & Lens
  { id: 'dolly-zoom', name: 'Dolly Zoom (Vertigo)', category: 'Dynamic & Lens', directive: 'Cinematic Hitchcock vertigo dolly-zoom with optical background warping' },
  { id: 'whip-pan', name: 'Whip Pan', category: 'Dynamic & Lens', directive: 'High-speed kinetic whip pan transition with fast motion blur' },
  { id: 'dynamic-handheld', name: 'Dynamic Handheld', category: 'Dynamic & Lens', directive: 'Immersive handheld camera movement with natural organic kinetic motion' },
  { id: 'fpv-drone', name: 'FPV Drone Flythrough', category: 'Dynamic & Lens', directive: 'High-speed kinetic FPV drone sweep weaving through the environment' },
  { id: 'zoom-in', name: 'Zoom In', category: 'Dynamic & Lens', directive: 'Rapid optical lens zoom pushing in on the central subject' },
  { id: 'zoom-out', name: 'Zoom Out', category: 'Dynamic & Lens', directive: 'Gradual optical lens zoom pulling back to reveal the scene' },
  { id: 'static-lock', name: 'Static Lock-Off', category: 'Dynamic & Lens', directive: 'Locked-off static tripod camera shot emphasizing internal scene motion' }
];

export const VARIATION_OPTIONS: Record<string, string[]> = {
  "Composition": [
    "Symmetrical Framing",
    "Rule of Thirds",
    "Leading Lines",
    "Frame within a Frame",
    "Extreme Negative Space"
  ],
  "Atmosphere & Mood": [
    "Golden Hour",
    "Blue Hour",
    "Silhouette",
    "Chiaroscuro",
    "Neon-Soaked",
    "Strobe",
    "Double Exposure",
    "Infrared",
    "Foggy",
    "Rainstorm",
    "Underwater",
    "Dust Storm",
    "Apocalyptic",
    "Dreamscape",
    "Ethereal Glow",
    "Hazy Memory",
    "Heat Haze"
  ],
  "Creative Reinterpretation": [
    "Style Transfer: Claymation",
    "Style Transfer: Van Gogh",
    "Style Transfer: Cyberpunk",
    "Style Transfer: Sketch",
    "Style Transfer: Watercolor",
    "Style Transfer: 16mm Film",
    "Style Transfer: Boschian",
    "Style Transfer: 80s Anime",
    "Genre Swap: Horror",
    "Genre Swap: Western",
    "Genre Swap: Sci-Fi",
    "Genre Swap: Fantasy",
    "Atmosphere Shift: Dark & Gritty",
    "Atmosphere Shift: Euphoric",
    "Atmosphere Shift: Surreal",
    "Atmosphere Shift: Cold & Sterile"
  ],
  "Transitions": [
    "Match Cut",
    "Invisible Cut",
    "Cross Dissolve",
    "Fade to Black",
    "J-Cut",
    "Iris Out",
    "Morphing",
    "Flash Frame",
    "Datamosh",
    "Swipe",
    "Light Leak Transition",
    "Zoom Transition"
  ],
  "Camera Angle": [
    "Extreme Low Angle",
    "Extreme High Angle (Bird's Eye)",
    "Dutch Angle",
    "Point of View (POV)",
    "Over the Shoulder"
  ],
  "Camera Movement": [
    "Slow Dolly In (Creeping)",
    "Fast Tracking Shot (Action)",
    "Dolly Zoom (Vertigo Effect)",
    "Whip Pan Transition",
    "360-Degree Arc Shot",
    "Jib / Crane Shot",
    "Erratic Handheld"
  ],
  "Lens & Focus": [
    "Extreme Wide-Angle (Fisheye)",
    "Extreme Telephoto (Compressed)",
    "Macro (Intense Detail)",
    "Shallow Depth of Field (Bokeh)",
    "Deep Focus (Everything Sharp)",
    "Rack Focus (Shift Attention)",
    "Split Diopter"
  ],
  "Lighting Style": [
    "High-Key (Bright, Shadowless)",
    "Low-Key (Dark, High Contrast)",
    "Chiaroscuro (Dramatic Shadows)",
    "Silhouette (Backlit)",
    "Golden Hour (Warm, Soft)",
    "Neon Noir (Pinks & Blues)",
    "Volumetric Light (Beams, Haze)"
  ],
  "Color & Grading": [
      "Bleach Bypass (Desaturated, High Contrast)",
      "Vibrant Technicolor",
      "Muted / Desaturated Palette",
      "Monochromatic (Single Color Wash)",
      "Sepia Tone (Nostalgic)",
      "Black & White",
      "Color Splash",
      "Pastel Palette",
      "High Contrast",
      "Vintage Kodachrome",
      "Teal and Orange",
      "Cross-Process",
      "Monochrome Red",
      "Color Palette Morph",
      "Dichromatic"
  ],
  "Editing & Effects": [
    "Slow Motion (Dramatic)",
    "Hyperlapse / Timelapse",
    "Smash Cut (Abrupt Transition)",
    "Match Cut (Visual Rhyme)",
    "Freeze Frame",
    "VHS Glitch Effect",
    "Light Leaks / Film Burn",
    "Reverse Action",
    "Bullet Time",
    "Stop Motion",
    "Glitch",
    "Looping",
    "Freeze Frame",
    "Speed Ramp",
    "Chaos Mode"
  ],
};

export const VISUAL_STYLES = [
  { id: 'pure_influences', name: 'Pure Influences', color: 'from-gray-700 to-gray-900', visualDetails: 'Direct translation of selected influences with no additional style filter.' },
  { id: 'noir', name: 'Gritty Noir', color: 'from-gray-900 to-black', visualDetails: 'Black & White, high contrast, dramatic shadows, chiaroscuro lighting, venetian blinds, rain-slicked streets, smoke, isolation, German Expressionism influence.' },
  { id: 'neo_noir', name: 'Neo-Noir', color: 'from-cyan-900 to-slate-900', visualDetails: 'High contrast color, neon lights reflecting on wet pavement, cool blues and teals, deep shadows, moral ambiguity, tech-noir aesthetic.' },
  { id: 'cyberpunk', name: 'Cyberpunk', color: 'from-purple-900 to-blue-900', visualDetails: 'High-tech low-life, neon signs, rain, holograms, vibrant purple/pink/blue palette, chrome reflections, gritty urban textures, Blade Runner aesthetic.' },
  { id: 'wes_anderson', name: 'Wes Anderson', color: 'from-yellow-200 to-pink-300', visualDetails: 'Symmetrical composition, pastel color palette (pinks, yellows), flat lighting, whip pans, centered subjects, quirky props, nostalgic feel.' },
  { id: 'cinematic', name: 'Cinematic Realism', color: 'from-slate-700 to-slate-900', visualDetails: 'Natural lighting, shallow depth of field (bokeh), anamorphic lens flares, muted earthy tones, handheld camera, 35mm film grain, Arri Alexa look.' },
  { id: 'gothic_horror', name: 'Gothic Horror', color: 'from-red-900 to-black', visualDetails: 'Deep shadows, candlelight, cool moonlight, fog, decaying architecture, cobwebs, velvet textures, desaturated colors with deep reds.' },
  { id: 'synthwave', name: 'Synthwave', color: 'from-pink-600 to-purple-800', visualDetails: 'Retro-futuristic 80s aesthetic, neon grids, sunsets, palm trees, vector graphics, VHS glitch effects, vibrant magenta and cyan gradients.' },
  { id: 'surrealist', name: 'Surrealist', color: 'from-indigo-400 to-purple-500', visualDetails: 'Dream-like logic, juxtaposition of unrelated objects, floating elements, distorted perspective, Man Ray influence, subconscious imagery, uncanny valley.' },
  { id: 'steampunk', name: 'Steampunk', color: 'from-amber-700 to-stone-800', visualDetails: 'Brass gears, steam-powered machinery, Victorian fashion, sepia tones, industrial fog, clockwork mechanisms, copper textures, warm tungsten lighting.' },
  { id: 'stop_motion_studio', name: 'Stop Motion Studio', color: 'from-amber-700 to-orange-900', visualDetails: 'Tactile textures, clay, felt, wood, visible fingerprints, shallow depth of field, stuttered animation frame rate (12fps), studio lighting, Laika style.' },
  { id: 'vaporwave', name: 'Vaporwave', color: 'from-teal-300 to-pink-300', visualDetails: 'Surreal 90s internet imagery, Greek statues, glitch art, pastel gradients, low-poly 3D models, nostalgic melancholy, Windows 95 aesthetic.' },
  { id: 'documentary', name: 'Cinema Verité', color: 'from-stone-600 to-stone-800', visualDetails: 'Handheld shaky cam, natural lighting, grainy 16mm stock, raw unpolished look, zoom lens snaps, realistic textures, newsreel style.' },
  { id: 'psychedelic', name: 'Psychedelic', color: 'from-indigo-500 to-purple-500', visualDetails: 'Kaleidoscopic visuals, melting colors, liquid light shows, distorted lenses, vibrant saturation, dream-like transitions, 60s counter-culture style.' },
  { id: 'grindhouse', name: 'Grindhouse / B-Movie', color: 'from-yellow-700 to-red-900', visualDetails: 'Film scratches, cigarette burns, saturated Technicolor, exploitation aesthetic, zoom lenses, harsh lighting, vintage 70s cinema.' },
  { id: 'melies_carcosa', name: 'Méliès Carcosa', color: 'from-amber-800 to-yellow-400', visualDetails: '1902 Trip to the Moon spirit, colorized sepia tone, bright hand-painted over colors, Carcosa/King in Yellow vibe, surreal theater sets, theatrical lighting, vintage film grain, eerie, dream-like.' }
];

export const RESOURCES = {
  "AI Video Generators": [
    { name: "Luma Dream Machine", url: "https://lumalabs.ai/dream-machine", desc: "High quality realistic video generation (Free tier available)." },
    { name: "Runway Gen-2/Gen-3", url: "https://runwayml.com/", desc: "Industry standard text-to-video, image-to-video, and inpainting." },
    { name: "Kling AI", url: "https://kling.kuaishou.com/en", desc: "Advanced motion physics, capable of longer clips (Sora competitor)." },
    { name: "Pika Labs", url: "https://pika.art/", desc: "Great for animation, lip-sync, and specific item modification." },
    { name: "Haiper", url: "https://haiper.ai/", desc: "Short form creative video generation." },
    { name: "Digen.ai", url: "https://digen.ai/", desc: "Generative AI video platform for various applications." },
    { name: "Grok", url: "https://grok.x.ai/", desc: "X's official AI, with video capabilities in beta." }
  ],
  "AI Image Generators": [
    { name: "Midjourney", url: "https://www.midjourney.com/", desc: "The gold standard for artistic, high-detail image generation." },
    { name: "Adobe Firefly", url: "https://firefly.adobe.com/", desc: "Commercially safe, photorealistic images tailored for creatives." },
    { name: "Leonardo.ai", url: "https://leonardo.ai/", desc: "Fine-tuned models for game assets, concept art, and textures." },
    { name: "Ideogram", url: "https://ideogram.ai/", desc: "Superior text rendering capability within images." },
    { name: "Perchance", url: "https://perchance.org/perlist", desc: "A simple and powerful free text-to-image generator." },
    { name: "Pollinations.ai", url: "https://pollinations.ai/", desc: "Offers a wide variety of models and artistic styles for free." },
    { name: "Bing Image Creator", url: "https://www.bing.com/images/create", desc: "Microsoft's free DALL-E 3 powered image creator." },
    { name: "DeepAI Text2Img", url: "https://deepai.org/machine-learning-model/text2img", desc: "A straightforward free tool for generating AI images." },
    { name: "Tensor.art", url: "https://tensor.art/", desc: "Community-driven platform with numerous Stable Diffusion models." },
  ],
   "Editors & Post-Production": [
    { name: "CapCut", url: "https://www.capcut.com/", desc: "User-friendly video editing with built-in AI features." },
    { name: "DaVinci Resolve", url: "https://www.blackmagicdesign.com/products/davinciresolve", desc: "Professional grade editing, color grading, and VFX (Free version is powerful)." },
    { name: "Topaz Video AI", url: "https://www.topazlabs.com/topaz-video-ai", desc: "Industry leader for video upscaling, sharpening, and frame interpolation." },
    { name: "Kdenlive (FOSS)", url: "https://kdenlive.org/", desc: "Powerful, free and open-source video editor for professionals." },
    { name: "OpenShot (FOSS)", url: "https://www.openshot.org/", desc: "Easy-to-use, free and open-source video editor." },
    { name: "Shotcut (FOSS)", url: "https://shotcut.org/", desc: "Free, open source, cross-platform video editor." },
    { name: "Canva", url: "https://www.canva.com/", desc: "Web-based design tool with integrated video editing features." },
    { name: "Photopea", url: "https://www.photopea.com/", desc: "A powerful, free online photo editor that runs in your browser." },
  ],
"Audio & Music Tools": [
  { name: "ElevenLabs", url: "https://elevenlabs.io/", desc: "Ultra-realistic AI Voice generation and sound effects." },
  { name: "Suno", url: "https://suno.com/", desc: "Full song generation from text prompts." },
  { name: "Udio", url: "https://www.udio.com/", desc: "High fidelity AI music generation." },
  { name: "One Step 1.5", url: "https://github.com/ace-step/ACE-Step-1.5/", desc: "An open source music model that can be ran locally and trained via loras." }
],
"AI Resource Hubs": [
    { name: "FMHY Master AI List", url: "https://fmhy.net/ai", desc: "A massive, curated list of AI tools and resources." },
    { name: "Awesome AI Tools (GitHub)", url: "https://github.com/eudk/awesome-ai-tools", desc: "A GitHub repository listing a wide range of AI tools." },
    { name: "AIxploria", url: "https://www.aixploria.com/en/ultimate-list-ai/", desc: "A comprehensive directory of AI applications." },
    { name: "Futurepedia", url: "https://www.futurepedia.io/ai-tools", desc: "The largest AI tools directory, updated daily." },
    { name: "Google AI Studio", url: "https://aistudio.google.com/", desc: "A web-based tool for prototyping with Gemini models." }
  ],
};
export const INFLUENCE_CATEGORIES = {
  "Forces Of Nature": [
    { name: "Tornado", desc: "Vortex/Green sky. Audio: Freight Train." },
    { name: "Earthquake", desc: "Cracks/Swaying. Audio: 20Hz Rumble." },
    { name: "Tsunami", desc: "Receding ocean/Wall. Audio: White Noise Wash." },
    { name: "Volcano", desc: "Lava/Ash lightning. Audio: Explosive Thuds." },
    { name: "Blizzard", desc: "Whiteout/Blue light. Audio: Wind Howl." },
    { name: "Flash Flood", desc: "Brown surge/Trees snapping. Audio: Thumping Churn." },
    { name: "Wildfire", desc: "Fire skeletons/Smoke. Audio: Wood Pops." },
    { name: "Sandstorm", desc: "Wall of sand/Sepia. Audio: Sand Hiss." },
    { name: "Solar Flare", desc: "Purple skies/Glitches. Audio: Electrical Zaps." },
    { name: "Hurricane", desc: "Bending palms/Bullet rain. Audio: Pulsing Pressure." }
],
  "The Paranormal": [
    { name: "Shadow People", desc: "Humanoid voids, static edges. Audio: Low-frequency humming." },
    { name: "Archons", desc: "Geometric light beings, crystalline eyes. Audio: Shimmering glass synth." },
    { name: "Poltergeists", desc: "Objects floating, blurred motion. Audio: Random knocks and dragging." },
    { name: "EVP", desc: "Visualized sound waves, ghostly static. Audio: Distorted whispers/White noise." },
    { name: "Skinwalkers", desc: "Distorted animal shapes, uncanny eyes. Audio: Mimicked human screaming." },
    { name: "Orb Entities", desc: "Floating light spheres, dust trails. Audio: High-pitched 'pinging' pulses." },
    { name: "The Veil", desc: "Translucent layering, ripple effects. Audio: Muffled world sounds." },
    { name: "Apparitions", desc: "Semi-transparent figures, period clothing. Audio: Faint footsteps/Hissing." },
    { name: "Possession", desc: "Contorted limbs, blacked-out eyes. Audio: Multi-tonal growling." },
    { name: "Time Slips", desc: "Overlapping eras, sepia vs neon colors. Audio: Mechanical ticking/Warbling." }
],
  "Biblical Events": [
    { name: "The Flood", desc: "Endless dark water, a lone wooden hull, torrential rain. Audio: Deep underwater pressure, thunderous rain wash." },
    { name: "Sodom and Gamorrah", desc: "Sulfur fire falling from a purple sky, salt-pillar silhouettes. Audio: Hissing chemical fire, distant screams." },
    { name: "Eden", desc: "Oversized bioluminescent flora, mist, impossible colors. Audio: Lush forest textures, ultra-clear bird calls." },
    { name: "Exodus", desc: "High walls of frozen water, dry seabed, torches in the distance. Audio: Massive hollow wind, dripping cavernous echoes." },
    { name: "Jericho", desc: "Crumbling ancient stone, dust clouds, golden trumpets. Audio: Earth-shaking horn blast, falling masonry." },
    { name: "The Covenant", desc: "A rainbow in a storm, glowing mountain peaks. Audio: Ethereal 'choir' hum, distant wind-chimes." },
    { name: "Babel", desc: "An endless spiral tower reaching into the clouds. Audio: Multilingual chatter, wind at high altitudes." },
    { name: "The Wilderness", desc: "Harsh white sun, shimmering heat waves, infinite sand. Audio: Dry wind whistling, absolute silence." },
    { name: "The Garden (Gethsemane)", desc: "Twisted olive trees, silver moonlight, deep shadows. Audio: Night crickets, heavy breathing." },
    { name: "Apocalypse", desc: "Four horsemen silhouettes, a red moon, burning horizons. Audio: Rhythmic hoofbeats, a low cinematic drone." }
],
  "Comic Book Legends": [
    { name: "Vintage Archie (60s-80s)", desc: "Bright primary colors, clean 'everything is okay' line work, suburban fashion, and iconic character silhouettes." },
    { name: "Harvey: Richie Rich", desc: "Soft rounded shapes, high-society mansion aesthetic, 'money' patterns, mid-century luxury." },
    { name: "Daniel Clowes", desc: "Uncomfortable suburban realism, deadpan expressions, desaturated 90s indie film palette, awkward Americana." },
    { name: "Charles Burns", desc: "High-contrast black and white, heavy ink, 'biological horror' textures, and 70s teenage angst." },
    { name: "Hernandez Brothers", desc: "Punk rock grit mixed with 'magical realism.' Bold character designs and deep black shadows." },
    { name: "Chris Ware", desc: "Precise architectural layouts, isometric perspectives, sense of mechanical melancholy." },
    { name: "Jim Woodring", desc: "Surreal 'rubber hose' style, psychedelic wordless logic, strange geometric flora and fauna." },
    { name: "Robert Crumb", desc: "Densely hatched lines, exaggerated anatomy, 60s counter-culture sketchbook feel, urban decay." },
    { name: "Art Spiegelman", desc: "Experimental textures, avant-garde framing, intense historical weight and serious narrative tone." },
    { name: "Vaughan Bodē", desc: "Psychedelic graffiti-adjacent characters, bubble lettering, and 'underground' fantasy vibes." },
    { name: "Bernie Wrightson", desc: "Master of the 'fine line' horror. Intricate textures, rotting wood, and heavy atmospheric fog." },
    { name: "EC Comics (Horror)", desc: "Vibrant unnatural 'shock' colors, dramatic framing, classic 50s morality-play aesthetic." },
    { name: "Alan Moore (Visuals)", desc: "Deeply literary and dark. Watchmen-style deconstruction, political dystopia, gritty detail." },
    { name: "Frank Miller", desc: "Heavy shadows, high contrast Noir, gritty street-level violence, Sin City aesthetic." },
    { name: "Grant Morrison (Surreal)", desc: "Mind-bending, metafictional psychedelic logic, Arkham Asylum fever dreams." },
    { name: "Garth Ennis (Grit)", desc: "Ultra-violent, dark humor, cynical tone. Think The Boys or Preacher." },
    { name: "Neil Gaiman (Dream)", desc: "Dreamlike, mythological, introspective. Sandman aesthetic of ethereal fantasy and gothic beauty." },
    { name: "Jack Kirby", desc: "The 'King.' Dynamic, explosive cosmic energy, bold lines, and 'Kirby Krackle' visual effects." },
    { name: "Stan Lee (Charm)", desc: "High-energy, character-focused, Silver Age charm, foundational foundational superhero vibe." },
    { name: "Jonathan Hickman", desc: "High-concept, data-heavy, grand world-building, complex architectural sci-fi structures." },
    { name: "Brian K. Vaughan", desc: "Character-driven scenarios (Saga/Y:TLM). Blends sci-fi with very human emotions." },
    { name: "Jeff Lemire", desc: "Melancholic, intimate, deals with isolation. Sweet Tooth indie-film feel with rough textures." },
    { name: "Mike Mignola", desc: "Heavy use of black (Chiaroscuro), angular character designs, folkloric and supernatural atmosphere." },
    { name: "Junji Ito", desc: "Visceral, grotesque, cosmic horror. Uzumaki style spiraling madness and body horror." },
    { name: "Alejandro Jodorowsky", desc: "The Incal vibes—psychedelic, spiritual, and absolutely insane sci-fi imagery." }
 ],
  "The Pantheon of Cinema Classics": [
    { name: "The Godfather", desc: "Opulent mahogany darkness, window-filtered slats of light, sepia-toned power, slow-burn tension, shadows of orange peels." },
    { name: "It's a Wonderful Life", desc: "Snowy small-town charm, classic black & white glow, nostalgic 1940s Americana, high-contrast emotional peaks." },
    { name: "Citizen Kane", desc: "Deep focus cinematography, low-angle power shots, overlapping dialogue, cavernous architecture, symbolic snow-globes." },
    { name: "Casablanca", desc: "Foggy airfields, high-contrast film noir romance, stark shadows, white tuxedo elegance, atmospheric night-club lighting." },
    { name: "12 Angry Men", desc: "Extreme claustrophobia, sweat-drenched close-ups, changing camera heights to increase tension, single-room focus." },
    { name: "The Shawshank Redemption", desc: "Cold prison greys vs warm golden freedom, torrential rain baptism, sweeping crane shots of isolation." },
    { name: "Goodfellas", desc: "Kinetic steadicam tracking, vibrant red sauce lighting, freeze frames, rapid voiceover pace, intense cocaine-era jitters." },
    { name: "Forrest Gump", desc: "Americana warmth, historic grainy footage integration, pastoral southern landscapes, iconic bench-side framing." },
    { name: "Saving Private Ryan", desc: "Desaturated 'shaky cam' realism, bleached-out colors, handheld war chaos, high-speed shutter 'staccato' motion." },
    { name: "Vertigo", desc: "Spiral motifs, obsessive green lighting, dolly-zoom dizzying effects, lush Technicolor San Francisco." },
    { name: "Singin' in the Rain", desc: "Vibrant primary colors, studio backlot magic, high-key joyous lighting, fluid athletic camera movement." },
    { name: "Psycho", desc: "Harsh shower-scene editing, bird-like character framing, menacing basement shadows, sharp orchestral visual rhythm." },
    { name: "Gone with the Wind", desc: "Technicolor fire-orange horizons, silhouetted oak trees, epic scale, opulent southern decay." },
    { name: "Lawrence of Arabia", desc: "70mm desert vistas, mirage heat-haze, blinding white sun, tiny figures in massive landscapes." },
    { name: "7 Samurai", desc: "Dynamic rain-soaked battle, telephoto lens movement, deep focus group blocking, muddy grit and honor." }
  ],
  "Modern Masterpieces & Crowd-Pleasers": [
    { name: "The Matrix", desc: "Green digital tint, bullet-time slow motion, leather and latex textures, industrial cyberpunk cityscapes." },
    { name: "Inception", desc: "Gravity-defying architecture, folding cities, sterile corporate minimalism, dream-layer transitions." },
    { name: "Fight Club", desc: "Grimy urban decay, greenish basement lighting, subliminal glitch frames, consumerist satire aesthetic." },
    { name: "The Dark Knight", desc: "IMAX-scale cityscapes, clinical blue/grey palette, chaotic Joker-purple accents, high-tech surveillance feel." },
    { name: "Interstellar", desc: "Volumetric space light, massive planetary scale, dust-bowl sepia, cinematic silence." },
    { name: "Parasite", desc: "Sleek modern architecture vs grimy semi-basement textures, meticulous vertical blocking, sunlight vs flooding rain." },
    { name: "Everything Everywhere All At Once", desc: "Multiverse jump-cuts, chaotic aspect ratio shifts, vibrant maximalist color, googly-eye surrealism." },
    { name: "Gladiator", desc: "Golden wheat-field dreamscapes, desaturated roman grit, hand-held combat, epic ancient scale." },
    { name: "Titanic", desc: "Blue moonlight ocean, opulent wood-and-gold interiors, cinematic destruction, sweeping crane shots of scale." },
    { name: "Jurassic Park", desc: "Volumetric jungle lighting, rain-soaked animatronics, ripples in water, sense of primordial awe." },
    { name: "Back to the Future", desc: "Golden 1950s Americana vs neon 1980s, flux-capacitor light trails, suburban skate-park aesthetic." },
    { name: "Indiana Jones", desc: "Golden idol glow, dusty ancient ruins, silhouette whip action, map-overlay travel sequences." },
    { name: "Avatar", desc: "Bioluminescent flora, floating mountains, vibrant neon-blue skin, ultra-detailed alien ecology." },
    { name: "Star Wars", desc: "Used-universe grit, laser-bolt light, massive starships, binary sunset silhouettes." },
    { name: "The Lord of the Rings", desc: "New Zealand's epic scale, painterly fantasy lighting, gritty detailed armor, massive army vistas." },
    { name: "Harry Potter", desc: "Gothic candle-lit castles, floating candles, dark magical woods, moving portraits, emerald green magic." },
    { name: "Top Gun: Maverick", desc: "High-G aerial photography, golden hour runways, sweat-glistening skin, saturated cockpit realism." },
    { name: "Die Hard", desc: "Industrial glass and concrete, red emergency lighting, sweat and blood grit, 80s office building aesthetic." },
    { name: "Ghostbusters", desc: "Proton pack neon-lightning, slime textures, 80s NYC grit, purple-sky apocalyptic clouds." },
    { name: "E.T.", desc: "Blue-tinted suburban night, flashlight beams, silhouettes against the moon, child-eye-level camera." }
  ],
  "Genre: Epic Crime & Sagas": [
    { name: "Goodfellas", desc: "Steadicam tracking, red-sauce interiors, kinetic energy, freeze-frame narration style." },
    { name: "The Godfather", desc: "Low-key Rembrandt lighting, dark mahogany rooms, intense psychological stillness." },
    { name: "Pulp Fiction", desc: "Diner-lighting cool, dance sequence symmetry, syringe-closeups, stylized violence, 90s LA grit." },
    { name: "The Departed", desc: "Irish-Boston grit, fast-paced aggressive cutting, CCTV-style observation, blood-spattered office windows." },
    { name: "Heat", desc: "Sprawling LA neon, blue-lit highways, clinical precision heist, high-contrast concrete battles." },
    { name: "City of God", desc: "Hyper-saturated Brazil, yellow-dust sun, rapid editing, handheld chaos, coming-of-age violence." },
    { name: "Scarface", desc: "Cocaine-white sets, vibrant Miami sunsets, gold-plated decadence, chainsaw-noir shadows." },
    { name: "No Country for Old Men", desc: "Silent desert vistas, harsh sun, practical light shadows, cinematic stillness, bolt-gun tension." }
  ],
  "Animation & Visual Wonders": [
    { name: "Spirited Away", desc: "Lush hand-drawn Japanese bathhouses, ghost-entity silhouettes, vibrant traditional colors, flying dragon scale." },
    { name: "Spider-Man: Into the Spider-Verse", desc: "Ben-day dots, 3D halftone textures, chromatic aberration, split-screen comic panels, neon street art." },
    { name: "Wall-E", desc: "Rusty trash-can textures, lens flares, cosmic silence, dusty Earth sepia vs clean sterile space-ship white." },
    { name: "The Lion King", desc: "African sunrise silhouettes, grand migration scale, vibrant Pride Rock vistas, dark green elephant graveyard." },
    { name: "Toy Story", desc: "Childhood bedroom nostalgia, low-angle perspective, primary colors, plastic and fabric textures." },
    { name: "Princess Mononoke", desc: "Deep forest greens, dark biological decay, majestic animal silhouettes, hand-drawn blood and iron." }
  ],
  "50s/60s Drive-In & Delinquents": [
    { name: "The Blob", desc: "Small town panic, gelatinous monster, movie theater." },
    { name: "Creature from the Black Lagoon", desc: "Underwater photography, rubber suit, universal horror, black & white." },
    { name: "Attack of the 50 Foot Woman", desc: "Giant projection, slow movement, screaming crowds, black & white." },
    { name: "Plan 9 From Outer Space", desc: "Cardboard sets, visible strings, day-for-night, black & white." },
    { name: "The Day The Earth Stood Still", desc: "UFOs, Cold War Paranoia,“Klaatu barada nikto”." },
    { name: "The Wild One", desc: "Biker gangs, leather jackets, rebellion, jukeboxes, black & white." },
    { name: "Blackboard Jungle", desc: "School rebellion, rock and roll, switchblades, black & white." },
    { name: "Switchblade Sisters", desc: "Girl gangs, prison exploitation, tough attitude." }
  ],
  "Classic Television": [
     { name: "Fantasy Island", desc: "Tropical paradise, white suits, mysterious fog, wish fulfillment aesthetic." },
     { name: "BJ and the Bear", desc: "Trucker culture, 70s Americana, highways, chimpanzee sidekick." },
     { name: "ChiPs", desc: "California highways, golden sunshine, motorcycle chases, disco era uniforms." },
     { name: "The Love Boat", desc: "Cruise ship luxury, bright decks, laugh track sitcom style, 70s fashion." },
     { name: "Seinfeld", desc: "New York apartment, bass guitar transitions, observational humor, diner booths." },
     { name: "Twin Peaks", desc: "Pacific northwest, moody lodge interiors, surreal characters, cherry pie." },
     { name: "The Twilight Zone", desc: "High contrast B&W, dutch angles, surreal twist endings, Rod Serling." },
     { name: "I Love Lucy", desc: "Multi-camera sitcom, high key lighting, physical comedy, B&W." },
     { name: "The Electric Company", desc: "70s educational funk, kinetic typography, silhouettes, spider-man sketches." },
     { name: "3-2-1 Contact", desc: "80s science, synth soundtrack, documentary style, early computer graphics." },
     { name: "Adult Animation (Style)", desc: "Rotoscoping, heavy outlines, limited animation, satirical tone. (Heavy Metal)" }
  ],
  "Sid & Marty Krofft & Psychedelic TV": [
    { name: "H.R. Pufnstuf", desc: "Oversized mascot costumes, colorful sets, talking trees, low budget magic." },
    { name: "Land of the Lost", desc: "Sleestaks, dinosaurs, primitive green screen, cave sets, crystals." },
    { name: "Lidsville", desc: "Giant hats, colorful villains, theatrical staging." },
    { name: "The Bugaloos", desc: "Bug costumes, flying sequences, enchanted forest." },
    { name: "The Prisoner", desc: "Surreal village, giant white balls, pop art aesthetics." }
  ],
  "Experimental & Visual Art": [
    { name: "Maya Deren", desc: "Meshes of the Afternoon, dream logic, mirrors, clones." },
    { name: "Stan Brakhage", desc: "Painted film, abstract textures, mothlight." },
    { name: "Kenneth Anger", desc: "Occult imagery, vivid colors, leather and chrome." },
    { name: "Alejandro Jodorowsky", desc: "The Holy Mountain, religious surrealism, tarot symbolism." },
    { name: "Baraka / Samsara", desc: "70mm visual poetry, time-lapses, global scale." },
    { name: "Koyaanisqatsi", desc: "Time-lapse of cities, technology vs nature, Phillip Glass score." }
  ],
  "Visual Art & Surrealism": [
    { name: "Salvador Dali", desc: "Melting clocks, stilt-legged elephants, surreal deserts." },
    { name: "H.R. Giger", desc: "Biomechanical, monochromatic, sexualized machinery." },
    { name: "M.C. Escher", desc: "Impossible geometry, tessellations, endless staircases." },
    { name: "Hieronymus Bosch", desc: "Garden of Earthly Delights, chaotic details, hellscapes." },
    { name: "Man Ray", desc: "Rayographs, surrealist photography, solarization." },
    { name: "Marcel Duchamp", desc: "Readymades, kinetic sculpture, dadaist absurdity, conceptual focus." },
    { name: "Richard Kern", desc: "Transgressive photography, raw punk aesthetic, confronting gaze." },
    { name: "Rene Magritte", desc: "Surrealism, bowler hats, green apples, floating rocks, visual puns." }
  ],
  "Music Video Legends": [
    { name: "Spike Jonze", desc: "Practical stunts, dancing, lo-fi energy. (Weapon of Choice)" },
    { name: "Michel Gondry", desc: "In-camera effects, loop perspective, LEGO animation. (Fell in Love with a Girl)" },
    { name: "Chris Cunningham", desc: "Distorted bodies, Aphex Twin, cold blue lighting, syncing to beat." },
    { name: "Hype Williams", desc: "Fisheye lens, shiny suits, vibrant colors, futuristic sets." },
    { name: "Mark Romanek", desc: "High production value, pristine sets, dark undertones. (Closer)" },
    { name: "Floria Sigismondi", desc: "Industrial decay, jittery motion, gothic textures." }
  ],
  "Video Game Aesthetics": [
    { name: "Grand Theft Auto: Vice City", desc: "80s Miami, neon, palm trees, pastel suits, sunsets." },
    { name: "Bioshock", desc: "Art deco underwater, rusting brass, leaking water, splicers." },
    { name: "Limbo / Inside", desc: "Silhouettes, atmospheric haze, monochrome, glowing eyes." },
    { name: "Minecraft", desc: "Voxels, blocky terrain, pixellated textures." },
    { name: "Red Dead Redemption 2", desc: "Vast western landscapes, dynamic weather, volumetric lighting." },
    { name: "Elden Ring", desc: "Erdtree gold light, dark fantasy, gothic castles, massive scale." },
    { name: "Doom", desc: "Hellish landscapes, fast movement, demons, mars base, heavy metal." },
    { name: "Pac-Man", desc: "Neon maze, ghosts, pills, pixel art minimalism." },
    { name: "Donkey Kong", desc: "Construction girders, barrels, 8-bit industrial." },
    { name: "The Last of Us", desc: "Post-apocalyptic overgrown nature reclaiming cities, beautiful but dangerous, dusty interiors, spore particles in the air." },
    { name: "Cyberpunk 2077", desc: "Mega-city neon chaos, cybernetic implants, gritty street life, holographic ads, vibrant and dense." },
    { name: "Final Fantasy VII", desc: "Industrial 'Mako' reactor grunge vs. lush natural landscapes, oversized swords, magical materia glow." },
    { name: "Bloodborne", desc: "Gothic Victorian horror, Lovecraftian monsters, dark cobblestone streets, torchlight, intricate and oppressive architecture." },
    { name: "Journey", desc: "Minimalist desert landscapes, flowing cloth physics, warm glowing sand, ancient silent ruins." },
    { name: "Control", desc: "Brutalist architecture, shifting impossible geometry, red emergency lighting, floating debris, new weird aesthetic." },
  ],
  "Cinematic Lenses": [
    { name: "Anamorphic", desc: "Wide aspect ratio, oval bokeh, lens flares." },
    { name: "Fisheye", desc: "Ultra-wide 180 degree view, heavy distortion." },
    { name: "Macro", desc: "Extreme close-up, revealing microscopic textures." },
    { name: "VHS / Hi8", desc: "Magnetic tape glitches, color bleeding, scanlines." },
    { name: "Tilt-Shift", desc: "Miniature effect, selective focus planes." },
    { name: "Night Vision", desc: "Green phosphor, grainy, glowing eyes." },
    { name: "Thermal", desc: "Heat map colors, predator vision, high contrast." },
    { name: "Periscope Lens", desc: "Low-to-ground perspective, bug's eye view, skimming surfaces." }
  ],
  "Auteurs: David Lynch": [
    { name: "David Lynch", desc: "Surrealism, dream logic, industrial noise, velvet curtains, electrical humming." },
    { name: "Twin Peaks", desc: "Small town secrets, red room, zig-zag floors, coffee, logs." },
    { name: "Eraserhead", desc: "Industrial wasteland, high contrast B&W, body horror, radiator lady." },
    { name: "Blue Velvet", desc: "Suburban dark side, manicured lawns, voyeurism, gas masks." },
    { name: "Wild at Heart", desc: "Road movie chaos, Elvis-inspired energy, snakeskin jackets, surreal violence, magical realism." },
    { name: "The Elephant Man", desc: "Stark industrial black & white, Victorian London, medical curiosities, profound human empathy." },
    { name: "Inland Empire", desc: "Shot on low-resolution digital video, fragmented identity horror, non-linear nightmare logic, rabbits." },
    { name: "Mulholland Drive", desc: "Hollywood nightmare, shifting identities, blue box, nonlinear." }
   ],
  "Auteurs: Stanley Kubrick": [
    { name: "Stanley Kubrick", desc: "Symmetry, one-point perspective, detached clinical tone, slow zooms. (The Shining, 2001)" },
    { name: "The Shining", desc: "Steadicam tracking, uncanny symmetry, blood elevators, hedge maze." },
    { name: "2001: A Space Odyssey", desc: "Sterile white sets, realistic physics, star gates, slit-scan photography." },
    { name: "A Clockwork Orange", desc: "Wide angle distortion, synthesized Beethoven, violence, pop art decor." },
    { name: "Full Metal Jacket", desc: "Two-act structure, cold lighting, geometric barracks, war journalism style." },
    { name: "Eyes Wide Shut", desc: "Christmas lights, ritualistic masks, soft focus, dream-like tension." }
  ],
  "Auteurs: Alfred Hitchcock": [
    { name: "Alfred Hitchcock", desc: "Master of suspense, voyeurism, 'Vertigo' effect, icy blondes, shadow play." },
    { name: "Psycho", desc: "High contrast black and white, rapid editing cuts (shower scene), ominous shadows." },
    { name: "Vertigo", desc: "Dolly zoom, spiral motifs, haunting green fog, obsessive tracking shots." },
    { name: "Rear Window", desc: "Voyeuristic telephoto lens, confined single-room setting, courtyard framing." },
    { name: "The Birds", desc: "Natural lighting turning ominous, chaotic editing, lack of music score." },
    { name: "North by Northwest", desc: "Wide open vistas, kinetic crop duster sequences, modernist architecture." }
  ],
  "Auteurs: Quentin Tarantino": [
    { name: "Quentin Tarantino", desc: "Non-linear storytelling, pop culture dialogue, trunk shots, feet shots, violence." },
    { name: "Pulp Fiction", desc: "Saturated colors, diner lighting, nonlinear structure, casual violence." },
    { name: "Kill Bill", desc: "Yellow jumpsuit, anime sequences, high contrast gore, snap zooms, samurai aesthetic." },
    { name: "Inglourious Basterds", desc: "Tension in dialogue, red text overlays, theater lighting, mexican standoffs." },
    { name: "Django Unchained", desc: "Spaghetti western zooms, exaggerated blood squibs, vibrant plantations." },
    { name: "Reservoir Dogs", desc: "Warehouse minimalism, slow pans, matching suits, ear torture." }
  ],
  "Auteurs: Steven Spielberg": [
    { name: "Steven Spielberg", desc: "The 'Spielberg Face', shafts of light, sweeping crane shots, wonder and awe." },
    { name: "Jaws", desc: "Water level camera, mechanical tension, beach crowds, yellow barrels." },
    { name: "Jurassic Park", desc: "Rain-soaked animatronics, ripples in water cups, massive scale composition." },
    { name: "Raiders of the Lost Ark", desc: "Golden idols, dramatic shadows, practical stunts, map travel overlays." },
    { name: "E.T. the Extra-Terrestrial", desc: "Silhouettes against the moon, suburban blue nights, flashlight beams." },
    { name: "Schindler's List", desc: "High contrast black and white, red coat isolation, handheld realism." },
    { name: "Close Encounters", desc: "Blinding lights, lens flares, devils tower, communication through color." }
  ],
  "Auteurs: Coen Brothers": [
    { name: "Coen Brothers", desc: "Wide angles, pitch-black humor, bleak landscapes, eccentric characters." },
    { name: "Fargo", desc: "Stark white snow, bright red blood, static wide shots, parka textures." },
    { name: "No Country for Old Men", desc: "Desolate desert landscapes, silence, violent bursts, shadow play." },
    { name: "The Big Lebowski", desc: "Bowling alleys, dream sequences, noir pastiche, surreal carpets." },
    { name: "O Brother, Where Art Thou?", desc: "Digital sepia color grading, period costumes, southern heat." },
    { name: "Barton Fink", desc: "Claustrophobic peeling wallpaper, surreal heat, noir shadows, hotel dread." },
    { name: "Miller's Crossing (1995)", desc: "Prohibition intrigue, sharp suits, chiaroscuro shadows, cunning dialogue, tense score." },
 ],
  "Auteurs: John Ford": [
    { name: "John Ford", desc: "Monument Valley vistas, framing characters through doorways, community rituals." },
    { name: "The Searchers", desc: "Vast desert landscapes, deep focus, isolation, framing through porches." },
    { name: "Stagecoach", desc: "Deep focus cinematography, kinetic chases, wide open plains, stagecoach interiors." },
    { name: "The Grapes of Wrath", desc: "Expressionist lighting, dusty realism, faces in shadow, candlelit interiors." },
    { name: "The Man Who Shot Liberty Valance", desc: "Studio lighting, deep shadows, noir-western aesthetic." },
    { name: "How Green Was My Valley", desc: "High contrast black and white, sentimental framing, mining town grit." }
  ],
  "Auteurs: Todd Haynes": [
    { name: "Todd Haynes", desc: "Meticulous period detail, Sirkian melodrama, reflections, shifting identities, emotional restraint." },
    { name: "Carol", desc: "Shot on grainy 16mm film, muted 1950s color palette, longing gazes through rain-streaked windows, reflections." },
    { name: "Far from Heaven", desc: "Lush Technicolor pastiche, autumnal oranges and deep blues, immaculate 50s suburbia, dramatic lighting." },
    { name: "Velvet Goldmine", desc: "70s glam rock chaos, glitter and androgyny, non-linear structure, vibrant stage lighting, fluid identity." },
    { name: "I'm Not There", desc: "Fractured biopic, shifting film stocks (grainy B&W, saturated color), multiple personas, experimental form." },
    { name: "Safe", desc: "Clinical suburban horror, sterile wide shots of isolation, unsettling calm, muted pastel tones, psychological detachment." }
  ],
  "Auteurs: Modern Visionaries": [
    { name: "David Fincher", desc: "Precision, low-key lighting, green/yellow tint, fluid camera, control." },
    { name: "Denis Villeneuve", desc: "Brutalist scale, atmospheric dread, industrial soundscapes, minimalism." },
    { name: "Christopher Nolan", desc: "IMAX scale, practical effects, cross-cutting time, muted tones." },
    { name: "Greta Gerwig", desc: "Theatrical staging, warm distinct color palettes, emotional intimacy." },
    { name: "Safdie Brothers", desc: "Chaos, anxiety, neon lights, extreme close-ups, overlapping dialogue." },
    { name: "Robert Eggers", desc: "Historical accuracy, natural light/candles, square aspect ratio, folklore." },
    { name: "Jordan Peele", desc: "Social thriller, uncanny imagery, symbolism, tension in daylight." },
    { name: "Alfonso Cuarón", desc: "Long continuous takes, floating camera, deep focus, environmental storytelling." },
    { name: "Yorgos Lanthimos", desc: "Deadpan, wide angle distortion, uncomfortable framing, surrealism." },
    { name: "Gaspar Noé", desc: "Disorienting camera, strobe lights, neon reds, overhead spinning shots." },
    { name: "Nicolas Winding Refn", desc: "Neon-soaked noir, silence, slow pans, synth-pop aesthetic." }
  ],
  "Auteurs: Horror Masters": [
    { name: "John Carpenter", desc: "Anamorphic widescreen, deep blue lighting, minimalism, synth scores." },
    { name: "David Cronenberg", desc: "Body horror, sterile environments, flesh vs technology, clinical detachment." },
    { name: "Dario Argento", desc: "Giallo aesthetic, vibrant unnatural gel lighting, gloved killers, prog rock." },
    { name: "Wes Craven", desc: "Dream logic, suburban nightmares, meta-commentary, slasher tropes." },
    { name: "Sam Raimi", desc: "Hyper-kinetic camera, dutch angles, slapstick gore, POV rushing shots." },
    { name: "George A. Romero", desc: "Docu-style horror, social commentary, stark black and white, hordes." },
    { name: "Tobe Hooper", desc: "Gritty realism, sun-baked heat, chaotic noise, documentary feel." },
    { name: "James Wan", desc: "Creeping cameras, jump scare timing, gothic puppetry, foggy sets." },
    { name: "Guillermo del Toro", desc: "Dark fairy tales, amber lighting, clockwork mechanisms, sympathetic monsters." },
    { name: "Ari Aster", desc: "Daylight horror, pagan rituals, grief, hidden background details." }
  ],
  "Auteurs: Animation Giants": [
    { name: "Hayao Miyazaki", desc: "Lush painted backgrounds, flying sequences, reverence for nature, steam." },
    { name: "Satoshi Kon", desc: "Psychological editing, matching cuts between reality and dreams, reflections." },
    { name: "Phil Tippett", desc: "Stop-motion grotesque, gritty textures, industrial nightmare." },
    { name: "Makoto Shinkai", desc: "Hyper-realistic light, lens flares, clouds, trains, longing." },
    { name: "Ralph Bakshi", desc: "Rotoscoping, urban grit, fantasy blending with reality, psychedelic." },
    { name: "Mamoru Oshii", desc: "Stillness, philosophy, tanks, wet city streets, basset hounds." }
  ],
  "Auteurs: French New Wave": [
    { name: "Jean-Luc Godard", desc: "Jump cuts, breaking fourth wall, typography, handheld." },
    { name: "Breathless", desc: "Guerrilla filmmaking, natural light, jump cuts, Paris streets, black & white." },
    { name: "François Truffaut", desc: "Freeze frames, lyrical camera, tracking shots, humanist." },
    { name: "Agnès Varda", desc: "Documentary realism mixed with fiction, feminist perspective, vibrant." }
  ],
"Legendary Photographers": [
    { name: "Ansel Adams", desc: "High-contrast black & white landscapes, epic scale, deep focus (f/64), majestic American West." },
    { name: "Annie Leibovitz", desc: "Dramatic, conceptual celebrity portraits, often with elaborate staging and rich color palettes." },
    { name: "Gregory Crewdson", desc: "Hyper-cinematic, large-scale suburban scenes, surreal and melancholic mood, elaborate lighting." },
    { name: "Cindy Sherman", desc: "Chameleonic self-portraits exploring identity and stereotypes, often mimicking film stills or historical paintings." },
    { name: "Henri Cartier-Bresson", desc: "The 'decisive moment', candid street photography, geometric compositions, black & white." },
    { name: "Diane Arbus", desc: "Unflinching portraits of outsiders and marginalized people, square format, confrontational and intimate." },
    { name: "Richard Avedon", desc: "Minimalist, high-contrast studio portraits against a stark white background, revealing character and emotion." },
    { name: "Sebastião Salgado", desc: "Epic black & white photojournalism, focusing on humanity and nature with a grand, painterly quality." },
    { name: "Helmut Newton", desc: "Provocative, erotic, and statuesque fashion photography, often in black & white with a sharp, voyeuristic edge." },
    { name: "William Eggleston", desc: "Pioneer of color photography, finding beauty and strangeness in the mundane American suburban landscape." }
  ],
  "Auteurs: Masters of Cinema": [
    { name: "Stanley Kubrick", desc: "Symmetry, one-point perspective, detached clinical tone, slow zooms. (The Shining, 2001)" },
    { name: "Alfred Hitchcock", desc: "Master of suspense, voyeurism, 'Vertigo' effect, icy blondes, shadow play." },
    { name: "Quentin Tarantino", desc: "Non-linear storytelling, pop culture dialogue, trunk shots, feet shots, violence." },
    { name: "Steven Spielberg", desc: "The 'Spielberg Face', shafts of light, sweeping crane shots, wonder and awe." },
    { name: "Coen Brothers", desc: "Wide angles, pitch-black humor, bleak landscapes, eccentric characters." },
    { name: "Terrence Malick", desc: "Magic hour, floating steadicam, whispered voiceovers, nature motifs." },
    { name: "Hayao Miyazaki", desc: "Hand-drawn animation, lush landscapes, flying motifs, strong female protagonists." },
    { name: "Akira Kurosawa", desc: "Dynamic weather, telephoto lenses, masterful composition, samurai action." },
    { name: "Wong Kar-wai", desc: "Step-printing, saturated colors, neon-lit Hong Kong, themes of longing and memory." },
    { name: "Andrei Tarkovsky", desc: "Long takes, slow pacing, dream imagery, elemental motifs (water, fire, milk)." },
    { name: "Paul Thomas Anderson", desc: "Long tracking shots, ensemble casts, period detail, complex characters." },
    { name: "David Fincher", desc: "Low-key lighting, cool color palettes (greens and blues), smooth camera movement, urban decay." },
    { name: "The Wachowskis", desc: "'Bullet time' slow motion, green tint, cyberpunk aesthetic, complex action choreography." },
    { name: "Martin Scorsese", desc: "Dynamic camera movement, use of popular music, fast-paced editing, gritty realism." },
    { name: "Ridley Scott", desc: "Atmospheric lighting, smoke, shafts of light, textured sets. (Blade Runner)" },
    { name: "Bong Joon-ho", desc: "Genre-bending, precise blocking, social satire. (Parasite)" },
    { name: "Ingmar Bergman", desc: "Close-ups on faces, stark B&W, existential angst, clocks without hands." },
    { name: "Federico Fellini", desc: "Carnivalesque, surreal imagery, grotesques, breaking the fourth wall." },
    { name: "Terry Gilliam", desc: "Wide angles, clutter, bureaucratic dystopia, fantasy vs reality." },
    { name: "Tim Burton", desc: "Gothic whimsy, spirals, stripes, expressionist sets." },
    { name: "Spike Lee", desc: "Double dolly shot, vibrant colors, breaking the fourth wall, dutch angles." },
    { name: "Sergio Leone", desc: "Extreme close-ups on eyes, vast landscapes, tense standoffs." }
  ],
  "Genre: Fantasy & Folklore": [
    { name: "Lord of the Rings", desc: "Epic scale, New Zealand landscapes, forced perspective, gritty armor." },
    { name: "Pan's Labyrinth", desc: "Dark fairy tale, amber and blue contrast, practical creatures." },
    { name: "The Dark Crystal", desc: "Puppetry, alien ecology, purple suns, organic textures." },
    { name: "Labyrinth", desc: "Escher stairs, masquerade balls, glitter, practical goblins." },
    { name: "The Princess Bride", desc: "Storybook aesthetic, soft focus, fencing, pastoral landscapes." },
    { name: "The NeverEnding Story", desc: "Clouds, crumbling nothingness, practical flying creatures." },
    { name: "Wizard of Oz", desc: "Technicolor transition, painted sets, yellow brick road." },
    { name: "Excalibur", desc: "Shiny chrome armor, green light, wagnerian scale, blood and mud." }
  ],
  "Genre: Cult & Indie Favorites": [
    { name: "Donnie Darko", desc: "Suburban gloom, time travel fluid, bunny suit, 80s nostalgia." },
    { name: "Fight Club", desc: "Grimy filters, subliminal frames, sweating nitroglycerin, ikea catalogs." },
    { name: "Trainspotting", desc: "Surreal withdrawal sequences, scottish grit, freeze frames, britpop." },
    { name: "Fear and Loathing in Las Vegas", desc: "Wide angle distortion, hallucinogenic reptilians, neon glare." },
    { name: "The Big Lebowski", desc: "Bowling alleys, dream sequences, noir pastiche, surreal carpets." },
    { name: "Napoleon Dynamite", desc: "Static shots, awkward framing, beige aesthetic, awkward dancing." },
    { name: "Office Space", desc: "Fluorescent hell, printer destruction, mundane beige." },
    { name: "Eternal Sunshine", desc: "Crumbling memories, spotlight transitions, muted winter beach." },
    { name: "Amélie", desc: "Green/red palette, fast motion, whimsical narration, photobooth." },
    { name: "Dazed and Confused", desc: "Hazy 70s amber, drifting smoke, endless suburban night." },
    { name: "Drugstore Cowboy", desc: "Junkie-neon signage, lyrical downbeat pacing, Pacific Northwest rain." },
    { name: "Idiocracy", desc: "Blaring commercial dystopia, garish future-slob aesthetics, corporate wasteland." },
    { name: "Being John Malkovich (1999)", desc: "Psycho‑portal office, surreal humor, fractured identity, muted palette." },
  ],
  "Genre: Action & Thriller": [
    { name: "Mad Max: Fury Road", desc: "High contrast, saturated orange/teal, fast cutting, practical stunts." },
    { name: "Die Hard", desc: "Lens flares, industrial setting, sweat/grime, claustrophobia." },
    { name: "John Wick", desc: "Neon noir, clean gun-fu blocking, wide shots during action, rain." },
    { name: "Heat", desc: "Urban sprawling LA, cool blues, realistic gunfights, master shots." },
    { name: "The Raid", desc: "Gritty, handheld chaos, kinetic fighting, brutal choreography." },
    { name: "Seven", desc: "Bleach bypass, constant rain, dark interiors, flashlight beams." },
    { name: "Terminator 2", desc: "Cold blue steel, liquid metal effects, chases in canals." },
    { name: "Drive", desc: "Neon LA nights, synth-pop, slow motion, violent bursts, scorpion jacket." },
    { name: "Uncut Gems", desc: "Claustrophobic close-ups, diamond sparkle, chaotic overlapping audio." }
  ],
  "Genre: Sci-Fi & Cyberpunk": [
    { name: "Blade Runner", desc: "Neon noir, rain, smoke, crowded asian markets, massive architecture." },
    { name: "Alien", desc: "Claustrophobic industrial spaceship, Giger biomechanical horror." },
    { name: "The Matrix", desc: "Green tint, bullet time, leather trenchcoats, digital rain." },
    { name: "Brazil", desc: "Retro-futurism, ductwork everywhere, bureaucratic dystopia." },
    { name: "Fifth Element", desc: "Vibrant colors (orange/white), Gaultier costumes, flying taxis." },
    { name: "A Scanner Darkly", desc: "Rotoscoped animation, shifting reality, paranoia." },
    { name: "The Cell", desc: "Surreal mindscapes, Tarsem Singh visuals, opulent costumes." },
    { name: "Repo Man", desc: "Punk rock sci-fi, glowing trunks, generic products." },
    { name: "Dark City", desc: "German expressionist sci-fi, spiraling architecture, noir lighting." },
    { name: "Metropolis", desc: "Art deco skyscrapers, industrial machinery, robot maria, black & white silent film aesthetic." },
    { name: "Arrival", desc: "Minimalist ships, fog, muted palette, linguistic circularity." },
    { name: "Ex Machina", desc: "Glass, nature vs tech, reflections, cold precision." },
    { name: "Children of Men", desc: "Long continuous takes, gritty war zones, handheld documentary style." },
    { name: "Akira", desc: "Neo-Tokyo light trails, bike slides, massive destruction, body horror." },
    { name: "Ghost in the Shell", desc: "Urban isolation, reflections in glass, thermoptic camouflage." },
    { name: "Gattaca", desc: "Retro-modernism, amber filters, genetic perfection, clean lines." },
    { name: "Inception", desc: "Folding cities, zero gravity hallways, spinning tops." },
    { name: "Minority Report", desc: "Bleach bypass, gesture interface, grain, fluid motion." }
  ],
  "Genre: Mockumentary & Slow Cinema": [
     { name: "This Is Spinal Tap", desc: "Handheld interviews, awkward pauses, rockumentary aesthetic." },
     { name: "District 9", desc: "Found footage, shaky cam, alien integration, news reels." },
     { name: "Bela Tarr", desc: "Extremely long takes, black and white, rain, despair. (Satantango)" },
     { name: "What We Do in the Shadows", desc: "Vampire reality show, flying wire work, mundane settings." }
  ],
  "Genre: Body Horror": [
     { name: "The Fly (1986)", desc: "Gooey prosthetics, gradual transformation, tragic romance, pod design." },
     { name: "Titane", desc: "Metallic coldness, oil, fire, physical transformation, neon lights." },
     { name: "Videodrome", desc: "Biomechanical TV sets, breathing cassettes, flesh gun." },
     { name: "The Thing", desc: "Paranoia, arctic whiteout, grotesque shapeshifting." }
  ],
  "Genre: Grindhouse / B-Movie": [
    { name: "Faster, Pussycat! Kill! Kill!", desc: "Desert exploits, fast cars, tough women, dramatic angles, exploitation cool, B&W." },
    { name: "Beyond the Valley of the Dolls", desc: "Psychedelic pop art, rapid editing, party scenes, groovy fashion, vibrant color." },
    { name: "I Drink Your Blood", desc: "Rabid hippies, satanic rituals, chaotic gore, psychedelic horror." },
    { name: "Freaks (1932)", desc: "High contrast B&W, circus sideshow, raw humanity." },
    { name: "ILSA: She Wolf of the SS", desc: "Exploitation camp, harsh lighting, brutality, pulp aesthetic." },
    { name: "Cannibal Holocaust", desc: "Found footage prototype, grainy 16mm, jungle texture, extreme realism." },
    { name: "The Last House on the Left", desc: "Grainy 16mm, guerrilla filmmaking, natural light, raw." },
    { name: "Reefer Madness", desc: "Hysterical melodrama, shadowy jazz-dens, frantic zooms." },
    { name: "Dirty Mary Crazy Larry", desc: "Muscle car chases, sun-baked asphalt, wide open highways, 70s nihilism." },
    { name: "Blue Sunshine", desc: "Balding acid casualties, paranoid 70s textures, pulsing synth-score terror." },
    { name: "Super Vixens", desc: "Russ Meyer style, desert heat, rapid editing, exaggerated violence." },
    { name: "Poor Pretty Eddie", desc: "Southern gothic, dusty isolation, faded film stock, grit." },
    { name: "The Strange Vice of Mrs. Wardh", desc: "Giallo style, razor blades, stylish interiors, erotic tension, mystery." },
    { name: "Mad Doctor of Blood Island", desc: "Green blood, jungle humidity, zoom lenses, monster makeup." },
    { name: "Pets (1973)", desc: "Captivity, psychological tension, raw acting, exploitation drama." },
    { name: "Don't Go in the House", desc: "Flamethrowers, disco era interiors, burning flesh, dark shadows." },
    { name: "Absurd (1981)", desc: "Italian slasher, gut gore, biological horror, unstoppable killer." },
    { name: "Pieces", desc: "Chainsaw violence, jigsaw puzzles, college campus, bright red fake blood." },
    { name: "Rolling Thunder", desc: "PTSD revenge, hook hand, sunglasses, neo-noir western vibe." },
    { name: "Death Race 2000", desc: "Dystopian cars, matte paintings, campy costumes, vehicular manslaughter." },
    { name: "The Big Bird Cage", desc: "Women in prison, jungle heat, sweat, revolution, exploitation tropes." },
    { name: "Bloodsucking Freaks", desc: "Grand Guignol, theatrical torture, dark humor, grimy aesthetic." },
    { name: "Vampyros Lesbos", desc: "Psychedelic kitsch, red lighting, surrealism, dream logic, cabaret." },
    { name: "The Burning", desc: "Summer camp slasher, hedge clippers, raft massacre, Tom Savini effects." },
    { name: "Black Devil Doll From Hell", desc: "Shot-on-video sleaze, pulsating synth, blasphemous puppet horror.." },
    { name: "The Funhouse", desc: "Carnival lights, animatronics, stalking shadows, sleazy atmosphere." },
    { name: "Cannibal Ferox", desc: "Jungle exploitation, cruelty, primitive traps, raw documentary feel." },
    { name: "Salo, or the 120 Days of Sodom", desc: "Cold, fascist architecture, brutal detachment, symmetry." }
  ],
  "Cult: Punk & Rebellion": [
    { name: "Repo Man", desc: "Glowing trunks, generic food labels, punk attitude, LA wasteland, green sci-fi light, plate of shrimp." },
    { name: "Return of the Living Dead", desc: "Graffiti, punk fashion, chemical rain, brain-eating, slapstick horror, cemeteries." },
    { name: "Sid and Nancy", desc: "Gritty realism, garbage bags, hotel room destruction, tragic romance, grey London." },
    { name: "Liquid Sky", desc: "Neon makeup, invisible aliens, new wave fashion, rooftop synth, primitive CGI." },
    { name: "Ladies and Gentlemen, The Fabulous Stains", desc: "Skunk hair, berets, media satire, garage band aesthetic, red & black." },
    { name: "Suburbia (1983)", desc: "Abandoned housing tracts, wild dogs, mohawks, raw documentary feel." },
    { name: "Class of 1984", desc: "Dystopian high school, graffiti, leather, neon decay, Alice Cooper." }
  ],
  "Director: William Castle (The Gimmick King)": [
    { name: "House on Haunted Hill (1959)", desc: "Emergo skeleton, floating heads, noir lighting, campy atmosphere, Vincent Price." },
    { name: "The Tingler", desc: "Percepto, spine-chilling fear, breaking the fourth wall, hallucinogenic sequences, bathtub blood." },
    { name: "13 Ghosts (1960)", desc: "Illusion-O, spectral viewers, haunted house aesthetic, blue/red tint ghosts." },
    { name: "Strait-Jacket", desc: "Joan Crawford, axe murders, psychological tension, high contrast black & white, wallpapers." },
    { name: "Macabre", desc: "Clock motif, cemetery chase, gothic thriller, gimmick endings, fog." },
    { name: "Homicidal", desc: "Fright break, blonde wig, split personality, Hitchcockian pastiche, stark lighting." },
    { name: "Mr. Sardonicus", desc: "Frozen smile, gothic castle, audience vote, masks, fog machines." }
 ],
  "Moods & Atmospheres": [
    { name: "Ethereal & Dreamy", desc: "Soft focus, pastel hazes, floating particles, slow motion, angelic lighting." },
    { name: "Dark & Gritty", desc: "High contrast, dirt/grime textures, harsh shadows, desaturated, intense." },
    { name: "Melancholic", desc: "Blue/grey tones, rain, isolation, negative space, slow pacing, loneliness." },
    { name: "Euphoric", desc: "Bright warm flares, fast motion, vibrant saturation, wide angles, celebration." },
    { name: "Tense & Claustrophobic", desc: "Tight framing, dutch angles, shadows closing in, unease, sweat." },
    { name: "Nostalgic", desc: "Sepia or warm coating, film grain, soft edges, golden hour, childhood memories." },
    { name: "Chaotic", desc: "Rapid cuts, shaking camera, sensory overload, clashing colors, disorientation." },
    { name: "Romantic", desc: "Soft backlight, close-ups on eyes, shallow depth of field, warm candlelight." },
    { name: "Cold & Clinical", desc: "Fluorescent lights, symmetry, white/blue palette, detachment, sterility." },
    { name: "Mysterious", desc: "Fog/mist, silhouettes, obscuring shadows, backlighting, hidden details." }
  ],
  "Art Styles & Movements": [
    { name: "Baroque", desc: "Caravaggio lighting (chiaroscuro), dramatic intensity, ornate details, deep reds/golds." },
    { name: "Impressionism", desc: "Visible brush strokes (texture), focus on light quality, movement, Monet/Renoir." },
    { name: "Surrealism", desc: "Dali/Magritte, dream logic, melting objects, juxtaposition, uncanny valley." },
    { name: "Art Deco", desc: "Geometric shapes, gold and black, symmetry, luxury, Great Gatsby aesthetic." },
    { name: "Pop Art", desc: "Warhol/Lichtenstein, benday dots, vibrant primary colors, commercial imagery." },
    { name: "Ukiyo-e", desc: "Japanese woodblock style, flat perspective, outlines, Hokusai waves." },
    { name: "Cubism", desc: "Picasso/Braque, fragmented objects, multiple viewpoints, geometric abstraction." },
    { name: "Renaissance", desc: "Symmetry, triangular composition, heavenly lighting, soft skin tones." },
    { name: "Expressionism", desc: "Distorted shapes to express emotion, Munch/Van Gogh, swirling lines." },
    { name: "Brutalism", desc: "Concrete textures, massive scale, geometric blocky shapes, totalitarian feel." }
  ],
  "Genre: Neo-Noir": [
    { name: "Blade Runner 2049", desc: "Orange hazes, brutalist architecture, holograms, rain, isolation." },
    { name: "Nightcrawler", desc: "LA streetlights, gloss video texture, headlights, unethical detachment." },
    { name: "Sin City", desc: "High contrast digital black and white, selective color (red/yellow), comic book frames." },
    { name: "John Wick", desc: "Neon teals and purples, wet streets, tactical gun-fu, reflections." },
    { name: "Drive", desc: "Synth-pop cool, scorpion jacket, elevator lighting, slow motion violence." },
    { name: "Se7en", desc: "Bleach bypass, constant rain, flashlight beams, grime, moral decay." }
  ],
  "Aesthetic: Synthwave & Vaporwave": [
    { name: "Tron: Legacy", desc: "Glowing neon lines, glass surfaces, dark void backgrounds, daft punk aesthetic." },
    { name: "Kung Fury", desc: "VHS tracking artifacts, 80s arcade, over-the-top action, laser raptors." },
    { name: "Miami Vice", desc: "Pastel suits, speedboats, sunset gradients, ferrari testarossa." },
    { name: "San Junipero", desc: "Nostalgic 80s club lighting, rain-slicked fictional streets, neon signs." },
    { name: "Vaporwave Art", desc: "Greek busts, windows 95 UI, tropical plants, pink/teal gradients, glitch." }
  ],
  "Aesthetic: Steampunk": [
    { name: "Mortal Engines", desc: "Moving cities, industrial smoke, brass gears, leather aviator caps." },
    { name: "Wild Wild West", desc: "Mechanical spiders, western desert, steam powered tech, goggles." },
    { name: "The City of Lost Children", desc: "Greenish tint, grotesque characters, brass optical devices, wet textures." },
    { name: "Hugo", desc: "Clockwork mechanisms, train station steam, warm golden lighting, automatons." },
    { name: "Arcane", desc: "Piltover art deco gold vs Zaun neon green toxic grunge, painterly textures." }
  ],
  "Art: Abstract Expressionism": [
    { name: "Jackson Pollock", desc: "Chaotic drip painting, complex webs of color, lack of focal point, energy." },
    { name: "Mark Rothko", desc: "Large rectangular fields of color, soft edges, emotional intensity, minimalism." },
    { name: "Wassily Kandinsky", desc: "Geometric shapes, intersecting lines, synesthetic visual music." },
    { name: "Stan Brakhage", desc: "Mothlight, painted celluloid, scratches, texture over narrative." }
  ],
  "Technique: Stop Motion": [
    { name: "Coraline", desc: "Tiny knit sweaters, button eyes, glowing garden, tunnel vortex." },
    { name: "Fantastic Mr. Fox", desc: "Autumnal color palette, symmetry, fur texture, jerky movement." },
    { name: "Mad God", desc: "Gritty industrial nightmare, flesh textures, biological decay, practical effects." },
    { name: "Wallace & Gromit", desc: "Clay fingerprints, rounded shapes, cheese moon, mechanical trousers." },
    { name: "Jan Švankmajer", desc: "Alice, raw meat, taxidermy, household objects coming to life, unsettling." }
  ],
  "Technique: Cinema Verité": [
    { name: "The Blair Witch Project", desc: "Shaky handheld camcorder, night vision, forest panic, stick figures." },
    { name: "Cloverfield", desc: "Found footage, chaotic movement, dust settling on lens, giant monster glimpses." },
    { name: "Tangerine", desc: "Shot on iPhone, oversaturated orange sun, LA streets, raw energy." },
    { name: "American Honey", desc: "4:3 aspect ratio, natural light, lens flares, magazine crew travel." },
    { name: "The Office (Style)", desc: "Zooms on reaction, breaking fourth wall, fluorescent lighting, awkward silence." }
  ],
  "Genre: Psychedelic": [
    { name: "Enter the Void", desc: "POV floating camera, neon Tokyo, strobe lights, fractal visuals." },
    { name: "Mandy", desc: "Deep red lighting, fog, heavy metal aesthetic, dissolving faces." },
    { name: "Fear and Loathing in Las Vegas", desc: "Wide angle distortion, hallucinogenic reptilians, desert glare." },
    { name: "Paprika", desc: "Dream parade, melting reality, exploding dolls, vibrant chaos." },
    { name: "Yellow Submarine", desc: "Pop art animation, blue meanies, sea of holes, surreal transitions." },
    { name: "The Trip", desc: "Psychedelic color collage, projector-light faces, manic pop-art." },
    { name: "Naked Lunch", desc: "Insect-typewriters, paranoid Interzone, muted grotesquerie." },
    { name: "Altered States", desc: " Primal hallucinations, biological horror, sensory-deprivation visuals." },
    { name: "Waking Life", desc: "Rotoscoped dream-drift, philosophical dialogue, liquid reality." },
    { name: "The Holy Mountain", desc: "Esoteric symbolism, tarot, surreal set pieces, vivid colors." }, 
  ],
  "Genre: Horror": [
    { name: "The Exorcist", desc: "Atmospheric dread, chilling cold breath, demonic possession." },
    { name: "Texas Chainsaw Massacre", desc: "Gritty 16mm, sun-baked heat, raw intensity, bone furniture." },
    { name: "Return of the Living Dead", desc: "Punk rock aesthetic, gooey practical effects, graffiti, brains." },
    { name: "Dawn of the Dead (1978)", desc: "Shopping mall consumerism, blue-skinned zombies, comic gore." },
    { name: "Creepshow", desc: "EC Comics style, vibrant comic panel lighting, bordered frames." },
    { name: "Evil Dead 2", desc: "Hyper-kinetic camera, slapstick gore, dutch angles, cabin in woods." },
    { name: "Suspiria (1977)", desc: "Technicolor nightmare, intense primary colors, art deco sets." },
    { name: "Poltergeist", desc: "Suburban normality disrupted, tv static, spectral lights." },
    { name: "I Spit on Your Grave", desc: "Raw, brutal, unpolished revenge, forest isolation." },
    { name: "Hostel", desc: "Grimy industrial textures, torture dungeon, desaturated." },
    { name: "Rosemary's Baby", desc: "Occult Horror, Paranoia, Antichrist, Pregnancy." },
    { name: "Nosferatu", desc: "Vampire, German Expressionism, Count Orloc, B&W shadows." },
    { name: "Re-Animator", desc: "Neon green reagents, medical horror, black comedy." },
    { name: "The Wicker Man", desc: "Folk horror, daylight dread, pagan masks." },
    { name: "Sinister", desc: "Super 8 snuff films, pitch-black attic, lurking shadow figure." },
    { name: "Motel Hell", desc: "Rural gothic, ironic folksiness, chainsaw dark comedy." },
    { name: "The Thing", desc: "Paranoia, snow isolation, grotesque practical effects, flame throwers." },
    { name: "Get Out", desc: "Uncomfortable close-ups, sunken place void, suburban uncanny." },
    { name: "Midsommar", desc: "Bright daylight horror, flowers, runes, disorienting drugs." },
    { name: "The Witch", desc: "Natural light, grey palette, historical purity, isolation." },
    { name: "The Lighthouse", desc: "1.19:1 aspect ratio, orthochromatic B&W, foghorns, madness." },
    { name: "Hereditary", desc: "Dollhouse aesthetic, miniatures, dark corners, grief." }
 ],
  "Auteurs: Terrence Malick": [
    { name: "Terrence Malick", desc: "Magic hour, floating steadicam, whispered voiceovers, nature motifs." },
    { name: "The Tree of Life", desc: "Cosmic scale, intimate family moments, wide angle lenses, natural light." },
    { name: "Days of Heaven", desc: "Painterly landscapes, golden hour lighting, silhouette figures." },
    { name: "The Thin Red Line", desc: "Philosophical voiceover, jungle warfare, nature's indifference." }
  ],
  "Auteurs: Wes Anderson": [
    { name: "Wes Anderson", desc: "Symmetry, pastel color palettes, flat space composition, miniatures, whip pans." },
    { name: "The Grand Budapest Hotel", desc: "Vibrant pinks and purples, meticulous set design, changing aspect ratios." },
    { name: "The Royal Tenenbaums", desc: "Nostalgic color scheme, ensemble cast, tracking shots, quirky costumes." },
    { name: "Isle of Dogs", desc: "Stop-motion animation, Japanese aesthetic, symmetrical framing." }
  ],
  "Auteurs: Hayao Miyazaki": [
    { name: "Hayao Miyazaki", desc: "Hand-drawn animation, lush landscapes, flying motifs, strong female protagonists." },
    { name: "Spirited Away", desc: "Japanese mythology, vibrant spirit world, detailed backgrounds." },
    { name: "My Neighbor Totoro", desc: "Pastoral countryside, gentle creatures, childhood wonder." },
    { name: "Princess Mononoke", desc: "Epic scale, environmental themes, detailed forest spirits." }
  ],
  "Auteurs: Akira Kurosawa": [
    { name: "Akira Kurosawa", desc: "Dynamic weather, telephoto lenses, masterful composition, samurai action." },
    { name: "Seven Samurai", desc: "Rain-soaked battles, deep focus, long takes, village defense." },
    { name: "Rashomon", desc: "Dappled sunlight through leaves, conflicting perspectives, minimalist sets." },
    { name: "Yojimbo", desc: "Wide-screen compositions, lone anti-hero, dusty town, sudden violence." }
  ],
  "Auteurs: Denis Villeneuve": [
    { name: "Denis Villeneuve", desc: "Atmospheric tension, brutalist architecture, muted color palettes, epic scale." },
    { name: "Blade Runner 2049", desc: "Orange haze, neon reflections, snow, holographic advertising." },
    { name: "Dune", desc: "Monolithic scale, desert landscapes, desaturated colors, precise compositions." },
    { name: "Arrival", desc: "Misty landscapes, minimalist alien design, soft, cool lighting." }
  ],
  "Auteurs: Wong Kar-wai": [
    { name: "Wong Kar-wai", desc: "Step-printing, saturated colors, neon-lit Hong Kong, themes of longing and memory." },
    { name: "In the Mood for Love", desc: "Rich reds and greens, tight framing, slow motion, elegant costumes." },
    { name: "Chungking Express", desc: "Handheld camera, kinetic energy, pop music, blurred motion." }
  ],
  "Auteurs: Andrei Tarkovsky": [
    { name: "Andrei Tarkovsky", desc: "Long takes, slow pacing, dream imagery, elemental motifs (water, fire, milk)." },
    { name: "Stalker", desc: "Desaturated 'real world' vs. lush 'Zone', metaphysical journey, industrial decay." },
    { name: "Solaris", desc: "Psychological sci-fi, memory, long tracking shots, water imagery." }
  ],
  "Auteurs: Paul Thomas Anderson": [
    { name: "Paul Thomas Anderson", desc: "Long tracking shots, ensemble casts, period detail, complex characters." },
    { name: "Boogie Nights", desc: "Saturated 70s colors, energetic camera movement, neon signs." },
    { name: "There Will Be Blood", desc: "Epic landscapes, stark compositions, oil derricks, intense close-ups." },
    { name: "Punch Drunk Love", desc: "vibrant colors, emotional states, social anxiety, rage, into love." },
    { name: "Magnolia", desc: "Interwoven lives, rain-soaked confession, melancholic piano, suburban yearning." },
  ],
  "Auteurs: David Fincher": [
    { name: "David Fincher", desc: "Low-key lighting, cool color palettes (greens and blues), smooth camera movement, urban decay." },
    { name: "Fight Club", desc: "Gritty, desaturated look, subliminal frames, dark, industrial locations." },
    { name: "Se7en", desc: "Bleach bypass processing, constant rain, dark interiors, high-contrast shadows." }
  ],
  "Auteurs: The Wachowskis": [
    { name: "The Wachowskis", desc: "'Bullet time' slow motion, green tint, cyberpunk aesthetic, complex action choreography." },
    { name: "The Matrix", desc: "Green and black color scheme, kung fu, reflective surfaces, dystopian future." },
    { name: "Speed Racer", desc: "Hyper-saturated colors, psychedelic race tracks, anime-style editing." }
  ],
  "Auteurs: Guillermo del Toro": [
    { name: "Guillermo del Toro", desc: "Dark fairy tales, practical creature effects, amber and blue color palette, intricate production design." },
    { name: "Pan's Labyrinth", desc: "Warm fantasy world vs. cold, blue reality, grotesque creatures, Gothic horror." },
    { name: "The Shape of Water", desc: "Lush greens and teals, romantic fantasy, period detail, underwater scenes." }
  ],
  "Auteurs: Christopher Nolan": [
    { name: "Christopher Nolan", desc: "Practical effects, non-linear narratives, IMAX scale, cool, metallic color palettes." },
    { name: "Inception", desc: "Mind-bending architecture, slow-motion water, corporate espionage." },
    { name: "The Dark Knight", desc: "Urban grit, practical explosions, surveillance themes, anamorphic widescreen." }
  ],
  "Auteurs: Martin Scorsese": [
    { name: "Martin Scorsese", desc: "Dynamic camera movement, use of popular music, fast-paced editing, gritty realism." },
    { name: "Goodfellas", desc: "Long tracking shots (Copacabana), freeze frames, voiceover narration." },
    { name: "Taxi Driver", desc: "Neon-lit, rain-slicked New York streets, slow motion, POV shots." }
  ],
  "The Silent Era": [
    { name: "The Wind (1928)", desc: "Swirling desert, dust‑laden vistas, expressionist shadows, isolated drifter." },
    { name: "The Kid (1921)", desc: "Tramp's compassion, child's innocence, slapstick chaos, sepia warmth." },
    { name: "Intolerance (1916)", desc: "Cross‑era saga, monumental sets, interwoven tragedies, sweeping tableau." },
    { name: "The Crowd (1928)", desc: "Urban anonymity, bustling streets, subtle melancholy, stark realism." },
    { name: "City Lights (1931)", desc: "Silent romance, lamp‑lit shadows, comedic pathos, heartfelt longing." },
    { name: "Pandora's Box (1929)", desc: "Flapper decadence, fatal allure, art‑deco opulence, tragic downfall." },
    { name: "The King of Kings (1927)", desc: "Biblical grandeur, radiant halos, sweeping deserts, reverent drama." },
    { name: "The Passion of Joan of Arc (1928)", desc: "Intense close‑ups, stark lighting, raw anguish, spiritual fervor." },
    { name: "Ben‑Hur: A Tale of the Christ (1925)", desc: "Chariot maelstrom, epic desert, dramatic crucifixion, expansive scale." },
    { name: "The Big Parade (1925)", desc: "Trench warfare, mud‑soaked realism, mournful camaraderie, sober heroism." },
    { name: "The Phantom of the Opera (1925)", desc: "Gothic masks, shadowed corridors, operatic terror, haunting melody." },
    { name: "He Who Gets Slapped (1924)", desc: "Circus melancholy, stark spotlights, emotional submission, pastel palette." },
    { name: "Sherlock Jr. (1924)", desc: "Meta‑cinematic romp, kinetic chase, inventive framing, playful nostalgia." },
    { name: "The General (1926)", desc: "Locomotive chase, meticulous period detail, slapstick heroics, southern charm." },
    { name: "Flesh and the Devil (1926)", desc: "Romantic tragedy, lush lighting, luxurious gowns, yearning silence." },
    { name: "Show People (1928)", desc: "Hollywood satire, bright stages, breezy humor, star‑studded spectacle." },
    { name: "The White Sister (1923)", desc: "Cloistered vows, soft lighting, spiritual yearning, delicate romance." },
    { name: "Diary of a Lost Girl (1929)", desc: "Moral descent, expressionist shadows, tragic innocence, somber silence." },
  ],
  "In Glorious Technicolor!": [
    { name: "The African Queen (1951)", desc: "Swampy river, grizzled romance, gritty adventure, smoky horizons." },
    { name: "All That Heaven Allows (1955)", desc: "Suburban longing, pastel gardens, quiet yearning, muted domesticity." },
    { name: "An American in Paris (1951)", desc: "Vibrant choreography, impressionist canvases, lively Parisian streets, romantic exuberance." },
    { name: "Ben‑Hur (1959)", desc: "Colossal chariot race, golden deserts, epic drama, sweeping orchestration." },
    { name: "Black Narcissus (1947)", desc: "Saturated reds, Himalayan mystique, stark contrasts, repressed desire." },
    { name: "The Caine Mutiny (1954)", desc: "Naval mutiny, claustrophobic decks, moral tension, stark uniforms." },
    { name: "Cat on a Hot Tin Roof (1958)", desc: "Southern heat, smoking tension, familial secrets, sultry dialogue ." },
    { name: "East of Eden (1955)", desc: "California valleys, moral conflict, generational strife, sunlit intensity." },
    { name: "The Fly (1958)", desc: "Lab chaos, grotesque transformation, cold clinical lighting, suspenseful dread." },
    { name: "Forbidden Planet (1956)", desc: "Futuristic chrome, vibrant color, cosmic dread, sleek set pieces." },
    { name: "Giant (1956)", desc: "Texan expanses, pastel sky, sprawling saga, intimate family drama." },
    { name: "Gone With the Wind (1939)", desc: "Technicolor grandeur, sweeping plantations, epic romance, turbulent war." },
    { name: "Gunfight at the O.K. Corral (1957)", desc: "Dusty street, tense standoff, sepia tones, stoic heroism." },
    { name: "Imitation of Life (1959)", desc: "Melodramatic glamour, soft focus, intertwined destinies, emotional depth." },
    { name: "Johnny Guitar (1954)", desc: "Western showdown, saturated reds, strong heroine, brooding scores." },
    { name: "The Ladykillers (1955)", desc: "British absurdity, monochrome wit, cramped flat, mischievous crooks." },
    { name: "The Life and Death of Colonel Blimp (1943)", desc: "Painterly battlefields, dignified uniforms, poignant nostalgia, sweeping panoramas." },
    { name: "The Man Who Knew Too Much (1956)", desc: "Thrilling chase, vibrant locales, tense orchestration, looming danger." },
    { name: "A Matter of Life and Death (1946)", desc: "Celestial sepia, surreal afterlife, romantic metaphysics, luminous contrasts." },
    { name: "Moby Dick (1956)", desc: "Washed‑out color, obsessed mariner, white whale, churning sea." },
    { name: "North by Northwest (1959)", desc: "Modernist architecture, crop duster chase, Mount Rushmore, cool blues." },
    { name: "The Quiet Man (1952)", desc: "Lush Irish greens, stone cottages, romantic comedy, vibrant community." },
    { name: "Rear Window (1954)", desc: "Voyeuristic tension, apartment courtyard, sweltering heat, single-room perspective." },
    { name: "The Red Shoes (1948)", desc: "Ballet fantasy, vibrant costumes, psychological drama, surreal performance." },
    { name: "Rebel Without a Cause (1955)", desc: "Teenage angst, saturated reds, knife fight, planetarium." },
    { name: "Rio Bravo (1959)", desc: "Western siege, dusty jail, saloon songs, camaraderie." },
    { name: "The Robe (1953)", desc: "Biblical epic, Cinemascope grandeur, Roman armor, spiritual conversion." },
    { name: "Scaramouche (1952)", desc: "Swashbuckling adventure, theatrical sets, sword fights, vibrant costumes." },
    { name: "The Searchers (1956)", desc: "Monument Valley, VistaVision landscapes, doorway framing, obsessive quest." },
    { name: "Singin' in the Rain (1952)", desc: "Joyous choreography, studio backlots, primary colors, transition to sound." },
    { name: "A Star Is Born (1954)", desc: "Hollywood melodrama, musical numbers, Cinemascope, emotional close-ups." },
    { name: "The Ten Commandments (1956)", desc: "Parting the Red Sea, epic scale, Egyptian grandeur, divine light." },
    { name: "The Thief of Bagdad (1940)", desc: "Arabian nights fantasy, magical effects, vibrant sets, flying carpet." },
    { name: "To Catch a Thief (1955)", desc: "French Riviera glamour, VistaVision, cool elegance, fireworks." },
    { name: "Vertigo (1958)", desc: "Dolly zoom, spiral motifs, haunting green, obsessive love." },
    { name: "The War of the Worlds (1953)", desc: "Tripod war machines, heat rays, mass destruction, Cold War paranoia." },
    { name: "The Wizard of Oz (1939)", desc: "B&W to color transition, yellow brick road, emerald city, fantasy sets." },
    { name: "Written on the Wind (1956)", desc: "Sirkian melodrama, lurid colors, wealthy decay, emotional turmoil." }
  ]
};
