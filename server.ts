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

// Generate Content endpoint (handles text, structured JSON, multimodal inputs)
app.post('/api/gemini/generate-content', async (req, res) => {
  try {
    const { model = 'gemini-3.8-flash', contents, config } = req.body;
    if (!contents) {
      return res.status(400).json({ error: 'Missing required "contents" in request body' });
    }

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    res.json({
      text: response.text || '',
      candidates: response.candidates || [],
      usageMetadata: response.usageMetadata,
    });
  } catch (err: any) {
    console.error('Gemini generateContent error:', err);
    res.status(500).json({
      error: err.message || 'Gemini generate content failed',
      details: err.toString(),
    });
  }
});

// Streaming Content endpoint using Server-Sent Events (SSE)
app.post('/api/gemini/generate-content-stream', async (req, res) => {
  try {
    const { model = 'gemini-3.8-flash', contents, config } = req.body;
    if (!contents) {
      return res.status(400).json({ error: 'Missing required "contents" in request body' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const ai = getGenAI();
    const stream = await ai.models.generateContentStream({
      model,
      contents,
      config,
    });

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
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Gemini streaming failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message || 'Stream encountered error' })}\n\n`);
      res.end();
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

// Video Generation endpoint
app.post('/api/gemini/generate-videos', async (req, res) => {
  try {
    const { prompt, model = 'veo-3.1-fast-generate-preview', config } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for video generation' });
    }

    const ai = getGenAI();
    let operation = await ai.models.generateVideos({
      model,
      prompt,
      config: config || {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9',
      },
    });

    // Poll until operation is complete
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (operation.error) {
      throw new Error(String(operation.error.message));
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error('Video generation completed, but no download link was provided.');
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    const videoResponse = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
    });

    if (!videoResponse.ok) {
      throw new Error(`Failed to download video stream: ${videoResponse.statusText}`);
    }

    const arrayBuffer = await videoResponse.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const videoUrl = `data:video/mp4;base64,${base64Data}`;

    res.json({ videoUrl });
  } catch (err: any) {
    console.error('Gemini video generation error:', err);
    res.status(500).json({
      error: err.message || 'Video generation failed',
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
