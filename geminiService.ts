/**
 * AudioArc Gemini Service (Client-Side Server Proxy)
 * All calls are executed via server-side endpoints on /api/gemini/*
 * Never imports @google/genai or exposes API keys in the browser bundle.
 */

export const Type = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
} as const;

export interface GeminiResponse {
  text: string;
  candidates?: any[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export interface StreamChunk {
  text: string;
  usageMetadata?: any;
}

export interface GenerateImageResult {
  base64Data: string;
  mimeType: string;
  usageMetadata?: any;
}

/**
 * Generate text or structured content via server-side Gemini endpoint
 */
export async function generateContentServer(params: {
  model: string;
  contents: any;
  config?: any;
}): Promise<GeminiResponse> {
  const response = await fetch('/api/gemini/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorMsg = `Server error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Stream content generation via server-sent events (SSE)
 */
export async function* generateContentStreamServer(params: {
  model: string;
  contents: any;
  config?: any;
}): AsyncGenerator<StreamChunk, void, unknown> {
  const response = await fetch('/api/gemini/generate-content-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorMsg = `Server streaming error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  if (!response.body) {
    throw new Error('Streaming response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') {
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          yield {
            text: parsed.text || '',
            usageMetadata: parsed.usageMetadata,
          };
        } catch (e: any) {
          if (e.message && !e.message.includes('JSON')) {
            throw e;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Generate images using Imagen or Gemini multimodal native image models
 */
export async function generateImageServer(params: {
  engine?: 'gemini' | 'imagen';
  model?: string;
  prompt: string;
  contents?: any;
  config?: any;
}): Promise<GenerateImageResult> {
  const response = await fetch('/api/gemini/generate-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorMsg = `Image generation error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Generate video via server-side Veo/Omni endpoint
 */
export async function generateVideoServer(params: {
  prompt: string;
  model?: string;
  config?: any;
}): Promise<{ videoUrl: string }> {
  const response = await fetch('/api/gemini/generate-videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorMsg = `Video generation error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Ping server Gemini connection to test latency and availability
 */
export async function pingGeminiServer(model: string = 'gemini-3.1-flash-lite'): Promise<{ ok: boolean; message: string }> {
  const response = await fetch('/api/gemini/ping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to connect to Gemini server';
    try {
      const data = await response.json();
      errorMsg = data.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return { ok: true, message: 'Server connection verified' };
}

/**
 * Get server-side Gemini status and capabilities
 */
export async function checkGeminiStatus(): Promise<{ ok: boolean; hasKey: boolean; message: string }> {
  try {
    const response = await fetch('/api/gemini/status');
    if (!response.ok) {
      return { ok: false, hasKey: false, message: 'Server endpoint unreachable' };
    }
    return await response.json();
  } catch (err: any) {
    return { ok: false, hasKey: false, message: err.message || 'Status check failed' };
  }
}
