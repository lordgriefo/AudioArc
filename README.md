# 🎬 AudioArc — AI Filmmaking & Music Video Storyboard Studio

> Transform audio tracks, lyrics, and creative visions into fully synchronized, shot-by-shot cinematic storyboards and multi-track animatics.

# AudioArc: AI Filmmaking Assistant — Release v1.3.0

## 🎬 What's New in v1.3.0

### 🎵 Synchronized .lrc Lyric Sheet Exports
- **Lyric Visualizer Ready**: Automatically generates standard `.lrc` timestamped lyric sheets (`[mm:ss.xx]`) synced to scene start times and durations.
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

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-5.0-646cff.svg)

