import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Enable CORS and generous JSON limit for multimodal data / base64 images
app.use(cors());
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Helper to instantiate GoogleGenAI server-side with required User-Agent
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// Gemini API Server Endpoints
// -------------------------------------------------------------

// Status check endpoint
app.get('/api/gemini/status', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY);
  res.json({
    ok: true,
    hasKey,
    provider: 'gemini',
    message: hasKey 
      ? 'Gemini API is active and ready on server' 
      : 'API key is configured via server environment (Settings > Secrets)',
  });
});

// Ping / Connection Test endpoint
app.post('/api/gemini/ping', async (req, res) => {
  try {
    const ai = getGenAI();
    const model = req.body.model || 'gemini-3.1-flash-lite';
    const result = await ai.models.generateContent({
      model,
      contents: 'Respond with "pong" to verify connection.',
    });
    res.json({
      ok: true,
      text: result.text || 'pong',
      usageMetadata: result.usageMetadata,
    });
  } catch (err: any) {
    console.error('Gemini ping error:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Failed to ping Gemini API',
    });
  }
});

// Helper: extract clean, readable error text from SDK errors
function formatGeminiError(err: any, fallbackMsg: string): string {
  const raw = String(err?.message || err || fallbackMsg);
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      return `${parsed.error.message}${parsed.error.status ? ` (${parsed.error.status})` : ''}`;
    }
  } catch {}
  return raw;
}

// Helper: if inlineData exceeds ~10MB base64, upload via Gemini Files API to avoid 20MB inline payload limits
async function normalizeContentsForGemini(ai: GoogleGenAI, contents: any): Promise<{ contents: any; uploadedFileNames: string[] }> {
  const uploadedFileNames: string[] = [];
  if (!contents || !Array.isArray(contents.parts)) {
    return { contents, uploadedFileNames };
  }

  const INLINE_THRESHOLD = 10 * 1024 * 1024; // ~7.5MB binary / ~10MB base64
  const nextParts = [];

  for (const part of contents.parts) {
    if (part?.inlineData?.data && typeof part.inlineData.data === 'string' && part.inlineData.data.length > INLINE_THRESHOLD) {
      const mimeType = part.inlineData.mimeType || 'audio/mpeg';
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      const blob = new Blob([buffer], { type: mimeType });
      const uploaded = await ai.files.upload({
        file: blob,
        config: { mimeType },
      });
      if (uploaded?.name) {
        uploadedFileNames.push(uploaded.name);
      }
      if (uploaded?.uri) {
        nextParts.push({
          fileData: {
            fileUri: uploaded.uri,
            mimeType: uploaded.mimeType || mimeType,
          },
        });
        continue;
      }
    }
    nextParts.push(part);
  }

  return {
    contents: { ...contents, parts: nextParts },
    uploadedFileNames,
  };
}

function shouldFallbackModel(err: any): boolean {
  const errMsg = String(err?.message || err || '');
  return (
    errMsg.includes('503') ||
    errMsg.includes('high demand') ||
    errMsg.includes('UNAVAILABLE') ||
    errMsg.includes('429') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('404') ||
    errMsg.includes('NOT_FOUND')
  );
}

// Generate Content endpoint (handles text, structured JSON, multimodal inputs)
app.post('/api/gemini/generate-content', async (req, res) => {
  const ai = getGenAI();
  let uploadedFileNames: string[] = [];

  try {
    const { model = 'gemini-3.1-flash-lite', contents, config } = req.body;
    if (!contents) {
      return res.status(400).json({ error: 'Missing required "contents" in request body' });
    }

    const normalized = await normalizeContentsForGemini(ai, contents);
    const preparedContents = normalized.contents;
    uploadedFileNames = normalized.uploadedFileNames;

    let response;
    try {
      response = await ai.models.generateContent({
        model,
        contents: preparedContents,
        config,
      });
    } catch (modelErr: any) {
      if (shouldFallbackModel(modelErr)) {
        const fallbackModel = model !== 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';
        console.warn(`[Gemini Server] ${model} failed (${formatGeminiError(modelErr, '').substring(0, 100)}). Auto-falling back to ${fallbackModel}...`);
        response = await ai.models.generateContent({
          model: fallbackModel,
          contents: preparedContents,
          config,
        });
      } else {
        throw modelErr;
      }
    }

    res.json({
      text: response.text || '',
      candidates: response.candidates || [],
      usageMetadata: response.usageMetadata,
    });
  } catch (err: any) {
    console.error('Gemini generateContent error:', err);
    res.status(500).json({
      error: formatGeminiError(err, 'Gemini generate content failed'),
      details: err.toString(),
    });
  } finally {
    for (const fileName of uploadedFileNames) {
      ai.files.delete({ name: fileName }).catch(() => {});
    }
  }
});

// Streaming Content endpoint using Server-Sent Events (SSE)
app.post('/api/gemini/generate-content-stream', async (req, res) => {
  const ai = getGenAI();
  let uploadedFileNames: string[] = [];

  try {
    const { model = 'gemini-3.1-flash-lite', contents, config } = req.body;
    if (!contents) {
      return res.status(400).json({ error: 'Missing required "contents" in request body' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const normalized = await normalizeContentsForGemini(ai, contents);
    const preparedContents = normalized.contents;
    uploadedFileNames = normalized.uploadedFileNames;

    let stream;
    try {
      stream = await ai.models.generateContentStream({
        model,
        contents: preparedContents,
        config,
      });
    } catch (modelErr: any) {
      if (shouldFallbackModel(modelErr)) {
        const fallbackModel = model !== 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';
        console.warn(`[Gemini Server Stream] ${model} unavailable. Auto-falling back to ${fallbackModel}...`);
        stream = await ai.models.generateContentStream({
          model: fallbackModel,
          contents: preparedContents,
          config,
        });
      } else {
        throw modelErr;
      }
    }

    for await (const chunk of stream) {
      const dataPayload = {
        text: chunk.text || '',
        usageMetadata: chunk.usageMetadata,
      };
      res.write(`data: ${JSON.stringify(dataPayload)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Gemini streaming error:', err);
    const readableError = formatGeminiError(err, 'Gemini streaming failed');
    if (!res.headersSent) {
      res.status(500).json({ error: readableError });
    } else {
      res.write(`data: ${JSON.stringify({ error: readableError })}\n\n`);
      res.end();
    }
  } finally {
    for (const fileName of uploadedFileNames) {
      ai.files.delete({ name: fileName }).catch(() => {});
    }
  }
});

// Image Generation endpoint (handles both Imagen and Gemini multimodal image models)
app.post('/api/gemini/generate-images', async (req, res) => {
  try {
    const { 
      engine = 'gemini', 
      model = 'gemini-3.1-flash-lite-image', 
      prompt, 
      contents, 
      config 
    } = req.body;

    const ai = getGenAI();

    if (engine === 'imagen' || model.startsWith('imagen-')) {
      const imagenModel = model.startsWith('imagen-') ? model : 'imagen-3.0-generate-002';
      const outputMimeType = config?.outputMimeType || 'image/png';
      const result = await ai.models.generateImages({
        model: imagenModel,
        prompt: prompt || '',
        config: {
          numberOfImages: 1,
          outputMimeType,
          ...(config || {}),
        },
      });

      const base64Data = result.generatedImages?.[0]?.image?.imageBytes;
      if (!base64Data) {
        throw new Error('No image bytes returned from Imagen model');
      }

      return res.json({
        base64Data,
        mimeType: outputMimeType,
      });
    }

    // Gemini Multimodal Native Image Generation (nano-banana series)
    const effectiveContents = contents || { parts: [{ text: prompt }] };
    const response = await ai.models.generateContent({
      model,
      contents: effectiveContents,
      config,
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return res.json({
          base64Data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
          usageMetadata: response.usageMetadata,
        });
      }
    }

    // Fallback if no inlineData image part found
    res.status(404).json({
      error: 'No image data returned from model. Prompt may have triggered safety filters.',
      text: response.text,
      usageMetadata: response.usageMetadata,
    });
  } catch (err: any) {
    console.error('Gemini image generation error:', err);
    res.status(500).json({
      error: err.message || 'Image generation failed',
    });
  }
});

// Video Generation endpoint (uses Gemini Interactions API with gemini-omni-1.2-flash)
app.post('/api/gemini/generate-videos', async (req, res) => {
  try {
    const { prompt, imageBase64, model = 'gemini-omni-1.2-flash', config = {} } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for video generation' });
    }

    const ai = getGenAI();

    // Support resolution tiers: 360p (Cheapest Economy - 8 credits/10s), 720p (Standard - 16 credits), 1080p (Cinematic - 32 credits)
    const targetResolution = config.resolution || '360p';
    const targetDuration = config.duration || '10s';
    const targetAspectRatio = config.aspectRatio || '16:9';

    // Prepare inputs: text motion prompt, optionally with starting image frame
    const inputParts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      inputParts.push({
        type: 'image',
        mime_type: 'image/png',
        data: cleanBase64,
      });
    }
    inputParts.push({
      type: 'text',
      text: prompt,
    });

    const interaction = await ai.interactions.create({
      model,
      input: inputParts.length === 1 ? prompt : inputParts,
      background: false,
      store: false,
      stream: false,
      response_format: {
        type: 'video',
        aspect_ratio: targetAspectRatio,
        duration: targetDuration,
        resolution: targetResolution,
      },
    }, { timeout: 300000 });

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      const mime = videoPart.mime_type || 'video/mp4';
      const videoUrl = `data:${mime};base64,${videoPart.data}`;
      const creditsCost = targetResolution === '360p' ? 8 : (targetResolution === '1080p' ? 32 : 16);
      return res.json({ videoUrl, prompt, resolution: targetResolution, duration: targetDuration, creditsCost });
    }

    throw new Error('Video generation completed, but no video output stream was returned.');
  } catch (err: any) {
    console.error('Gemini video generation error:', err);
    const errMsg = String(err?.message || err);
    const isPaidKeyRequired = errMsg.includes('403') || errMsg.includes('paid') || errMsg.includes('permission');
    
    res.status(isPaidKeyRequired ? 403 : 500).json({
      error: isPaidKeyRequired 
        ? 'Direct video rendering with Gemini Omni Flash requires a paid API key. You can copy the generated video prompt and use it directly with Runway Gen-3, Sora, Kling, or LTX Studio!'
        : (err.message || 'Video generation failed'),
      prompt: req.body?.prompt || '',
      requiresPaidKey: isPaidKeyRequired,
    });
  }
});

// -------------------------------------------------------------
// Live API WebSocket Server Bridge
// -------------------------------------------------------------
const wss = new WebSocketServer({ server, path: '/api/gemini/live-ws' });

wss.on('connection', async (clientWs) => {
  console.log('[Live API WS] Client connected to Gemini Live bridge');
  let session: any = null;

  try {
    const ai = getGenAI();
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: 'You are AudioArc AI Filmmaking creative director assistant.',
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          for (const part of message.serverContent?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            }
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          clientWs.send(JSON.stringify({ closed: true }));
        },
      },
    });

    clientWs.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio && session) {
          session.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (payload.text && session) {
          session.sendRealtimeInput({
            text: payload.text,
          });
        }
      } catch (err) {
        console.error('[Live API WS] Error processing message:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[Live API WS] Client disconnected');
      try {
        if (session && typeof session.close === 'function') {
          session.close();
        }
      } catch {}
    });
  } catch (err: any) {
    console.error('[Live API WS] Bridge connection error:', err);
    clientWs.send(JSON.stringify({ error: err.message || 'Live API connection error' }));
    clientWs.close();
  }
});

// -------------------------------------------------------------
// Vite Middlewares in Dev / Static Files in Prod
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AudioArc server ready at http://0.0.0.0:${PORT} [Full-Stack Gemini API Mode]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
