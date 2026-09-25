import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { findVerifiedDhakaPlaces, GroundedPlaceItem } from '../services/dhakaGroundingKnowledge.ts';
import { getDhakaCopilotFallbackResponse } from '../services/dhakaCopilotKnowledge.ts';

// In-memory query cache to avoid unnecessary repeated API quota consumption
const groundingCache = new Map<string, { answer: string; mapsLinks: GroundedPlaceItem[]; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Rate-limit circuit breaker: when quota (429) is hit, cool down for 5 minutes without attempting API calls
let quotaExhaustedUntil = 0;

// Initialize server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Helper to delay execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper for executing Gemini calls with exponential backoff ONLY on transient 503/UNAVAILABLE (never 429)
async function generateWithRetry(
  ai: GoogleGenAI,
  params: any,
  maxRetries: number = 2
): Promise<any> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);

      // Do NOT retry on 429 / RESOURCE_EXHAUSTED - that burns quota!
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
        quotaExhaustedUntil = Date.now() + 5 * 60 * 1000;
        throw err;
      }

      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE');

      if (isTransient && attempt < maxRetries - 1) {
        attempt++;
        const backoffMs = Math.min(800 * Math.pow(2, attempt) + Math.random() * 300, 3000);
        await sleep(backoffMs);
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}

export async function chatWithGemini(req: Request, res: Response): Promise<void> {
  try {
    const { messages, systemInstruction, model = 'gemini-3.5-flash' } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, error: 'Messages array is required.' });
      return;
    }

    const lastMessage = messages[messages.length - 1]?.content || '';

    // Supported models per specification:
    // gemini-3.5-flash (general tasks), gemini-3.1-flash-lite (fast), gemini-3.1-pro-preview (complex)
    const allowedModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
    const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.5-flash';

    const defaultSystemInstruction =
      'You are the Dhaka Tesla Transit Copilot for "Dhaka Tesla Pool" in Dhaka, Bangladesh. ' +
      'Your role is to assist commuters with corridor pooling (Banani, Gulshan 1 & 2, Mohakhali, Uttara, Mirpur, Dhanmondi, Farmgate), ' +
      'explain the transparent fare formula (passengerFare = baseFare + distanceCharge - 25% poolDiscount), ' +
      'explain strict 3-seat maximum vehicle capacity on Tesla "Bullet", Dhaka rush-hour traffic navigation, ' +
      'and pickup/dropoff points. Always be helpful, concise, courteous, and knowledgeable about Dhaka roads and Tesla electric transit.';

    let reply = '';
    let activeModel = selectedModel;

    // If in rate-limit cooldown, immediately use fallback copilot
    if (quotaExhaustedUntil > Date.now()) {
      reply = getDhakaCopilotFallbackResponse(lastMessage, systemInstruction || defaultSystemInstruction);
      res.json({
        success: true,
        model: 'dhaka-transit-copilot',
        reply,
      });
      return;
    }

    try {
      const ai = getGeminiClient();

      // Map conversation history into Gemini format
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      try {
        const response = await generateWithRetry(ai, {
          model: selectedModel,
          contents,
          config: {
            systemInstruction: systemInstruction || defaultSystemInstruction,
          },
        });
        reply = response?.text || '';
      } catch (firstErr: any) {
        // If 503 or 429 on gemini-3.5-flash or gemini-3.1-pro-preview, try gemini-3.1-flash-lite
        if (selectedModel !== 'gemini-3.1-flash-lite') {
          activeModel = 'gemini-3.1-flash-lite';
          const fbResponse = await generateWithRetry(ai, {
            model: activeModel,
            contents,
            config: {
              systemInstruction: systemInstruction || defaultSystemInstruction,
            },
          });
          reply = fbResponse?.text || '';
        } else {
          throw firstErr;
        }
      }
    } catch (_apiErr: any) {
      quotaExhaustedUntil = Date.now() + 5 * 60 * 1000;
      // Seamless intelligent response so user is never blocked by quota or 503
      reply = getDhakaCopilotFallbackResponse(lastMessage, systemInstruction || defaultSystemInstruction);
      activeModel = 'dhaka-transit-copilot';
    }

    if (!reply) {
      reply = getDhakaCopilotFallbackResponse(lastMessage);
    }

    res.json({
      success: true,
      model: activeModel,
      reply,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.json({
      success: true,
      model: 'dhaka-transit-copilot',
      reply: getDhakaCopilotFallbackResponse(req.body?.messages?.[0]?.content || ''),
    });
  }
}

export async function mapsGroundingSearch(req: Request, res: Response): Promise<void> {
  try {
    const { query, latitude = 23.8103, longitude = 90.4125 } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, error: 'Search query is required.' });
      return;
    }

    const cleanQuery = query.trim().toLowerCase();

    // 1. Check in-memory cache first to avoid consuming API quota for repeated queries
    const cached = groundingCache.get(cleanQuery);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      res.json({
        success: true,
        query,
        answer: cached.answer,
        mapsLinks: cached.mapsLinks,
        groundingChunks: [],
        cached: true,
      });
      return;
    }

    // If in rate-limit cooldown, immediately serve verified Dhaka Maps Grounding data
    if (quotaExhaustedUntil > Date.now()) {
      const verifiedPlaces = findVerifiedDhakaPlaces(query);
      const fallbackLinks = verifiedPlaces.map((p) => ({
        title: p.title,
        uri: p.uri,
        address: p.address,
        snippet: p.snippet,
      }));
      const fallbackText =
        `**Dhaka Transit Corridor Intelligence for "${query}"**\n\n` +
        `Here are verified Dhaka pickup landmarks, commercial hubs, and corridor coordinates with direct Google Maps links. ` +
        `Our Tesla fleet serves these high-frequency hubs with zero surge pricing and priority corridor matching.\n\n` +
        `• **Recommended Boarding:** Use designated dropoff bays outside major landmarks to minimize corridor dwell time.\n` +
        `• **Express Routes:** Mohakhali Flyover and Hatirjheel Link Road provide the fastest transit during peak morning and evening hours.`;

      groundingCache.set(cleanQuery, {
        answer: fallbackText,
        mapsLinks: fallbackLinks as GroundedPlaceItem[],
        timestamp: Date.now(),
      });

      res.json({
        success: true,
        query,
        answer: fallbackText,
        mapsLinks: fallbackLinks,
        groundingChunks: [],
      });
      return;
    }

    let text = '';
    let mapsLinks: Array<{ title: string; uri: string; address?: string; snippet?: string }> = [];
    let groundingChunks: any[] = [];

    try {
      const ai = getGeminiClient();

      // Use gemini-3.5-flash with googleMaps tool as strictly instructed
      const prompt =
        `Provide accurate, up-to-date Dhaka place, venue, landmark, or transit information for: "${query}". ` +
        `Focus on Dhaka city transit corridors, popular pickup/dropoff landmarks, and commute tips.`;

      const response = await generateWithRetry(ai, {
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: Number(latitude) || 23.8103,
                longitude: Number(longitude) || 90.4125,
              },
            },
          },
        },
      });

      text = response.text || '';
      groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      // Extract Google Maps URLs and review snippets
      for (const chunk of groundingChunks as any[]) {
        if (chunk.maps) {
          const title = chunk.maps.title || 'Google Maps Place';
          const uri = chunk.maps.uri || '';
          const address = chunk.maps.formattedAddress || '';
          let snippet = '';

          if (chunk.maps.placeAnswerSources?.reviewSnippets?.length > 0) {
            snippet = chunk.maps.placeAnswerSources.reviewSnippets[0].snippet || '';
          }

          if (uri) {
            mapsLinks.push({ title, uri, address, snippet });
          }
        }
      }
    } catch (_apiError: any) {
      quotaExhaustedUntil = Date.now() + 5 * 60 * 1000;

      // Gracefully fall back to verified Dhaka Google Maps places directory with genuine Google Maps links
      const verifiedPlaces = findVerifiedDhakaPlaces(query);
      mapsLinks = verifiedPlaces.map((p) => ({
        title: p.title,
        uri: p.uri,
        address: p.address,
        snippet: p.snippet,
      }));

      text =
        `**Dhaka Transit Corridor Intelligence for "${query}"**\n\n` +
        `Here are verified Dhaka pickup landmarks, commercial hubs, and corridor coordinates with direct Google Maps links. ` +
        `Our Tesla fleet serves these high-frequency hubs with zero surge pricing and priority corridor matching.\n\n` +
        `• **Recommended Boarding:** Use designated dropoff bays outside major landmarks to minimize corridor dwell time.\n` +
        `• **Express Routes:** Mohakhali Flyover and Hatirjheel Link Road provide the fastest transit during peak morning and evening hours.`;
    }

    // If Gemini returned an answer but no chunks, supplement with verified Dhaka place links
    if (mapsLinks.length === 0) {
      const verifiedPlaces = findVerifiedDhakaPlaces(query);
      mapsLinks = verifiedPlaces.map((p) => ({
        title: p.title,
        uri: p.uri,
        address: p.address,
        snippet: p.snippet,
      }));
    }

    // Cache the result
    groundingCache.set(cleanQuery, {
      answer: text,
      mapsLinks: mapsLinks as GroundedPlaceItem[],
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      query,
      answer: text,
      mapsLinks,
      groundingChunks,
    });
  } catch (error: any) {
    console.error('Maps grounding error:', error);
    // Guarantee fallback even on unexpected exceptions
    const verifiedPlaces = findVerifiedDhakaPlaces(req.body?.query || 'Dhaka');
    res.json({
      success: true,
      query: req.body?.query || 'Dhaka',
      answer: 'Dhaka corridor transit landmarks and pickup locations verified for Tesla Pool.',
      mapsLinks: verifiedPlaces,
      groundingChunks: [],
    });
  }
}
