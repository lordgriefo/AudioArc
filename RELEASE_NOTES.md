# AudioArc: AI Filmmaking Assistant — Release v1.3.0

## 🎬 What's New in v1.3.0

### 🎵 Synchronized `.lrc` Lyric Sheet Exports
- **Lyric Visualizer Ready**: Automatically generates standard `.lrc` timestamped lyric sheets (`[mm:ss.xx]`) synced to each scene's start time and duration.
- **Project ZIP Inclusion**: Every Project ZIP download now bundles `lyrics.lrc` alongside your shotlist and prompts.
- **Direct Download**: Export a standalone `.lrc` file anytime from the **Export Suite & Shotlist Manager**.
- **Metadata Support**: Includes title, artist, soundtrack, and length tags, with automatic section and instrumental markers.

### 🪄 Wunderbar! Free AI Prompt Variations & Slideshow (Perchance)
- **Perchance AI Companion**: Direct support for the [Wunderbar! AI Generator](https://perchance.org/aa-wunderbar) (mirror: [perchance.org/audio-arc](https://perchance.org/audio-arc)).
- **Prompt Batching**: Copy-paste your exported `image_prompts.txt`, `video_prompts.txt`, `sora_prompts.txt`, or `master_shotlist.txt` directly into Wunderbar! to test **4 distinct AI style variations** or build a free slideshow video.
- **Built-in Guide**: Project ZIP exports now package `wunderbar_info.txt` with instructions, syntax tips, and quick links.
- **One-Click Launch**: Added a quick-launcher banner and download button directly inside the Export Suite modal, plus links in the footer AI Ecosystem.

### 🔀 Adjacent Scene Merging
- **1-Click Merge**: Join any two adjacent storyboard scenes into a single, cohesive cinematic shot.
- **Preserved Continuity**: Combines scene descriptions, lyrics, and voiceovers while retaining the primary visual identity of the leading scene.
- **Seamless Timing**: Automatically sums both scene durations and recalculates downstream timeline start/end timestamps without drift.
- **Multiple Access Points**:
  - Interactive hover pills between scene cards (`Merge Scenes X & Y`).
  - Scene card header action button.
  - Multi-select batch action toolbar.

### 🎨 AI Style Refiner
- **Batch Aesthetics**: Transform the look and feel of your entire project or selected scenes with cinematic themes (Cyberpunk, 16mm Vintage Grain, Film Noir, Anime Aesthetic, Hyperreal 8K, etc.).
- **Fine-Grained Intensity**: Dial in the blend percentage to subtly color-grade prompts or completely re-imagine the visual tone.

### 🌓 AI Contrast Booster & Visual Depth Enhancer
- **Dramatic Prompt Tuning**: Analyzes scene prompts to detect flat, washed-out lighting terms and automatically rewrites descriptive keywords to inject dramatic contrast and rich specular depth.
- **Cinematic Contrast Profiles**:
  - *Chiaroscuro Noir*: Deep chiaroscuro shadows, high-contrast hard key light, and dramatic Rembrandt falloff.
  - *Volumetric God Rays*: Smoky atmospheric shafts, illuminated haze particles, and backlit silhouettes.
  - *High Dynamic Range (HDR)*: Crushed deep blacks paired with searing specular highlights and wide tonality.
  - *Neo-Cyber High-Contrast*: Piercing neon rim lights cutting against pitch-dark shadow crevices.
  - *Crisp Specular Edge*: Sharp razor edge rim lighting and specular catchlights carving subjects out of the background.
- **Intelligent Keyword Engine**: Choose between instant algorithmic transformation or deep contextual Gemini/LLM rewriting.
- **Batch & Per-Scene Workflows**: Access via the storyboard toolbar, the multi-select batch bar, or direct one-click buttons on individual scene cards and image prompt headers.
- **Live Diff & Preview**: Inspect before-and-after prompt comparisons with flagged terms and added keywords before committing changes.

### 🥁 Audio Beat Detection & Rhythm Snapping
- **Transient Peak Detection**: Analyze uploaded audio tracks with Web Audio API to detect high-energy peaks, drops, and rhythmic accents.
- **Snap to Beats**: Automatically adjust scene cut points to hit key musical beats.

### 👤 Casting & Character Continuity Lock
- **Visual References**: Define characters and locations with custom descriptors or AI-analyzed reference images.
- **Batch Propagation**: Inject character descriptions and visual anchors across multiple selected scenes in a single click.

### 📦 Export & Workflow Suite
- **Complete ZIP Archive**: Backs up `project_data.json`, master shotlists, image prompts, video prompts, Sora prompts, screenplay, ComfyUI batch files, synchronized `.lrc` lyrics, and Wunderbar guide.
- **ComfyUI Pipeline**: Batch prompts optimized for the ComfyUI *Inspire Pack* (`comfy_image_batch.txt`, `comfy_video_batch.txt`).
- **Interactive Animatic Recorder**: Render a live-recorded browser video preview of your storyboard synced with audio.
- **PDF Shotlist**: Generate printable, production-ready PDF storyboards.

---

## 🚀 Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/audioarc.git
   cd audioarc
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API Keys** (Optional, depending on your preferred AI provider):
   - Copy `.env.example` to `.env` or configure your keys in the in-app Settings menu.
   - Works with **Google Gemini**, **OpenAI**, **OpenRouter**, **Ollama** (local), and **Pollinations** (free).

4. **Launch the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production**:
   ```bash
   npm run build
   ```
