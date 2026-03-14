import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup.js';
import { callGeminiAPI, callImagenAPI, GEMINI_API_BASE_URL } from '../../src/services/aiService.js';

const GEMINI_URL = `${GEMINI_API_BASE_URL}/models/gemini-2.5-flash-preview-09-2025:generateContent`;
const IMAGEN_URL = `${GEMINI_API_BASE_URL}/models/imagen-4.0-generate-001:predict`;

describe('callGeminiAPI', () => {
  it('returns text from successful response (text-only prompt)', async () => {
    server.use(
      http.post(GEMINI_URL, () =>
        HttpResponse.json({
          candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] } }],
        })
      )
    );

    const result = await callGeminiAPI('Hello');
    expect(result).toBe('Hello from Gemini');
  });

  it('returns text from successful response with image payload', async () => {
    server.use(
      http.post(GEMINI_URL, async ({ request }) => {
        const body = await request.json();
        const hasInlineData = body.contents[0].parts.some(p => p.inlineData);
        if (!hasInlineData) return HttpResponse.json({ error: { message: 'Missing image' } }, { status: 400 });
        return HttpResponse.json({
          candidates: [{ content: { parts: [{ text: 'Image analyzed' }] } }],
        });
      })
    );

    const result = await callGeminiAPI('Describe this', 'base64data', 'image/jpeg');
    expect(result).toBe('Image analyzed');
  });

  it('returns fallback message when candidates array is empty', async () => {
    server.use(
      http.post(GEMINI_URL, () =>
        HttpResponse.json({ candidates: [] })
      )
    );

    const result = await callGeminiAPI('Test');
    expect(result).toBe('No response generated.');
  });

  it('returns fallback message when response has no candidates key', async () => {
    server.use(
      http.post(GEMINI_URL, () =>
        HttpResponse.json({})
      )
    );

    const result = await callGeminiAPI('Test');
    expect(result).toBe('No response generated.');
  });

  it('returns fallback message on API error response', async () => {
    server.use(
      http.post(GEMINI_URL, () =>
        HttpResponse.json({ error: { message: 'API key invalid' } })
      )
    );

    const result = await callGeminiAPI('Test');
    expect(result).toBe("I couldn't process that request right now. Please try again.");
  });

  it('returns fallback message on network failure', async () => {
    server.use(
      http.post(GEMINI_URL, () => HttpResponse.error())
    );

    const result = await callGeminiAPI('Test');
    expect(result).toBe("I couldn't process that request right now. Please try again.");
  });
});

describe('callImagenAPI', () => {
  it('returns data URL from successful response', async () => {
    server.use(
      http.post(IMAGEN_URL, () =>
        HttpResponse.json({
          predictions: [{ bytesBase64Encoded: 'abc123==' }],
        })
      )
    );

    const result = await callImagenAPI('A sunset');
    expect(result).toBe('data:image/png;base64,abc123==');
  });

  it('throws on API error response', async () => {
    server.use(
      http.post(IMAGEN_URL, () =>
        HttpResponse.json({ error: { message: 'Quota exceeded' } })
      )
    );

    await expect(callImagenAPI('A sunset')).rejects.toThrow('Quota exceeded');
  });

  it('throws when no image is generated (missing bytesBase64Encoded)', async () => {
    server.use(
      http.post(IMAGEN_URL, () =>
        HttpResponse.json({ predictions: [{}] })
      )
    );

    await expect(callImagenAPI('A sunset')).rejects.toThrow('No image generated');
  });

  it('throws when predictions array is empty', async () => {
    server.use(
      http.post(IMAGEN_URL, () =>
        HttpResponse.json({ predictions: [] })
      )
    );

    await expect(callImagenAPI('A sunset')).rejects.toThrow('No image generated');
  });

  it('throws on network failure', async () => {
    server.use(
      http.post(IMAGEN_URL, () => HttpResponse.error())
    );

    await expect(callImagenAPI('A sunset')).rejects.toThrow();
  });
});
