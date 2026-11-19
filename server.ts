import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const IRRELEVANT_QUESTION_REPLY =
  'This is not relevant to the application. I am sorry, I can only help with fashion, outfits, and wardrobe styling here.';

function getAiClient(apiVersion?: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      ...(apiVersion ? { apiVersion } : {}),
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface OutfitPieceSpec {
  slot: string;
  itemName: string;
  colorName: string;
  colorHex: string;
  fabric: string;
}

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeHexColor(hex?: string): string {
  if (hex && /^#[0-9a-fA-F]{6}$/.test(hex.trim())) return hex.trim();
  return '#2A4B7C';
}

function buildLookbookSvgDataUrl(params: {
  outfitName: string;
  occasion: string;
  monkScale?: number;
  undertone?: string;
  silhouetteNote: string;
  pieces: OutfitPieceSpec[];
}): string {
  const pieces = params.pieces.slice(0, 4);
  while (pieces.length < 4) {
    const defaults: OutfitPieceSpec[] = [
      { slot: 'Top', itemName: 'Heavyweight Chalk Crewneck', colorName: 'Chalk White', colorHex: '#F3F2EE', fabric: 'Combed Cotton' },
      { slot: 'Outerwear', itemName: 'Unstructured Linen Blazer', colorName: 'Warm Sandstone', colorHex: '#C7B8A1', fabric: 'Linen Blend' },
      { slot: 'Bottom', itemName: 'Tailored Straight Trousers', colorName: 'Deep Navy', colorHex: '#1D293D', fabric: 'Tropical Wool' },
      { slot: 'Footwear', itemName: 'Minimalist Leather Sneakers', colorName: 'Ivory Chalk', colorHex: '#EAE6DF', fabric: 'Full-Grain Leather' },
    ];
    pieces.push(defaults[pieces.length]);
  }

  const monkHexMap: Record<number, string> = {
    1: '#F6EDE4',
    2: '#F3E7DB',
    3: '#F7EAD0',
    4: '#EADABA',
    5: '#D7BD96',
    6: '#A07E56',
    7: '#825C43',
    8: '#604134',
    9: '#3A312A',
    10: '#292420',
  };
  const hasMonk = typeof params.monkScale === 'number' && params.monkScale >= 1 && params.monkScale <= 10;
  const monkHex = hasMonk ? monkHexMap[Math.round(params.monkScale!)] : '';

  const subtitleParts = [params.occasion];
  if (params.undertone) subtitleParts.push(`${params.undertone} undertone`);
  if (hasMonk) subtitleParts.push(`MST ${params.monkScale}`);

  const cardRows = pieces
    .map((p, idx) => {
      const y = 138 + idx * 78;
      const swatch = sanitizeHexColor(p.colorHex);
      return `
        <g transform="translate(36, ${y})">
          <rect x="0" y="0" width="528" height="64" rx="10" fill="#FFFFFF" stroke="#E4E4E7" stroke-width="1"/>
          <rect x="14" y="14" width="36" height="36" rx="8" fill="${swatch}" stroke="#D4D4D8" stroke-width="1"/>
          <text x="64" y="28" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="11" font-weight="600" fill="#71717A">${escapeXml(p.slot.toUpperCase())}</text>
          <text x="64" y="47" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="15" font-weight="600" fill="#18181B">${escapeXml(p.itemName.slice(0, 42))}</text>
          <text x="510" y="29" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="11" fill="#3F3F46">${escapeXml(p.colorName.slice(0, 22))}</text>
          <text x="510" y="47" text-anchor="end" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="11" fill="#71717A">${escapeXml(p.fabric.slice(0, 24))}</text>
        </g>
      `;
    })
    .join('\n');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="500" viewBox="0 0 600 500">
      <rect width="600" height="500" rx="16" fill="#FAF9F6"/>
      <rect x="12" y="12" width="576" height="476" rx="12" fill="none" stroke="#E7E5E4" stroke-width="1"/>
      <text x="36" y="48" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="11" font-weight="600" letter-spacing="1.2" fill="#1D4ED8">FITROOM STUDIO LOOKBOOK SHEET</text>
      <text x="36" y="78" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="22" font-weight="700" fill="#18181B">${escapeXml(params.outfitName.slice(0, 42))}</text>
      <text x="36" y="102" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="12" fill="#52525B">${escapeXml(subtitleParts.join(' · '))}</text>
      ${monkHex ? `<circle cx="546" cy="70" r="18" fill="${monkHex}" stroke="#D4D4D8" stroke-width="1.5"/>` : ''}
      ${cardRows}
      <line x1="36" y1="454" x2="564" y2="454" stroke="#E4E4E7" stroke-width="1"/>
      <text x="36" y="476" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="12" fill="#52525B">Proportion Note: ${escapeXml(params.silhouetteNote.slice(0, 68))}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf-8').toString('base64')}`;
}

const FORMALITY_LABELS: Record<string, string> = {
  casual: 'Casual',
  smart_casual: 'Smart Casual',
  business_casual: 'Business Casual',
  formal_evening: 'Formal',
};

const EXPERT_VOICE_MAP: Record<string, string> = {
  'aria-chen': 'Kore',
  'marcus-vance': 'Fenrir',
  'elena-rostova': 'Zephyr',
  'devon-brooks': 'Puck',
};

function detectDressCodeFromText(message: string, modelDetected?: string): string | null {
  const text = (message || '').trim();
  if (/\bbusiness[\s-]+casual\b/i.test(text)) return 'business_casual';
  if (/\bsmart[\s-]+casual\b/i.test(text)) return 'smart_casual';
  if (/\b(formal|black[\s-]+tie|tuxedo|evening[\s-]+gown|cocktail[\s-]+attire|gala)\b/i.test(text)) {
    return 'formal_evening';
  }
  if (/\b(casual|streetwear|hoodie|sweatpants|loungewear|weekend chill)\b/i.test(text)) {
    return 'casual';
  }
  if (modelDetected && FORMALITY_LABELS[modelDetected]) {
    return modelDetected;
  }
  return null;
}

function parseBase64DataUrl(dataUrl?: string): { mimeType: string; data: string } | null {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([^;,]+)(?:;[^,]*)?;base64,(.+)$/);
  if (match) {
    return { mimeType: match[1].trim(), data: match[2].trim() };
  }
  return null;
}

function stripJsonCodeFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

async function withFastBudget<T>(fn: () => Promise<T>, maxBudgetMs = 15500): Promise<T> {
  const startedAt = Date.now();
  try {
    return await fn();
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    if (elapsed < 3000 && maxBudgetMs - elapsed > 5000) {
      await new Promise((r) => setTimeout(r, 200));
      return await fn();
    }
    throw err;
  }
}

function buildStylistSystemInstruction(ctx: {
  expert?: { name?: string; role?: string; specialty?: string; tone?: string };
  userProfile?: {
    name?: string;
    heightCm?: number;
    skinToneMonk?: number;
    undertone?: string;
    bodyShape?: string;
    colorPreferences?: string;
    clothingPreferences?: string;
  };
  occasion?: string;
  weather?: string;
  formality?: string;
  useClosetOnly?: boolean;
  closetItems?: Array<{
    name: string;
    category: string;
    colorName: string;
    fabric?: string;
    formality?: string;
  }>;
  isLiveVoice?: boolean;
}): string {
  const closetSummary =
    Array.isArray(ctx.closetItems) && ctx.closetItems.length > 0
      ? ctx.closetItems
          .slice(0, 40)
          .map(
            (item) =>
              `- [${item.category}] ${item.name} (${item.colorName}${item.fabric ? `, ${item.fabric}` : ''}, ${item.formality || 'casual'})`
          )
          .join('\n')
      : 'No garments currently saved in digital closet.';

  const selectedLabel = FORMALITY_LABELS[ctx.formality || 'smart_casual'] || ctx.formality || 'Smart Casual';

  const profileLines: string[] = [
    `- Name (from login mail ID): ${ctx.userProfile?.name || 'Guest User'}`,
    `- Height: ${
      typeof ctx.userProfile?.heightCm === 'number'
        ? `${ctx.userProfile.heightCm} cm`
        : 'Not provided (do NOT estimate or assume)'
    }`,
    `- Skin Tone / Undertone: ${
      ctx.userProfile?.skinToneMonk !== undefined || ctx.userProfile?.undertone
        ? `${ctx.userProfile?.skinToneMonk !== undefined ? `MST ${ctx.userProfile.skinToneMonk}/10` : 'MST not provided'}${
            ctx.userProfile?.undertone ? `, ${ctx.userProfile.undertone} undertone` : ''
          }`
        : 'Not provided (do NOT estimate or assume)'
    }`,
    `- Body Shape: ${ctx.userProfile?.bodyShape || 'Not provided (do NOT estimate or assume)'}`,
    `- Color Preferences: ${ctx.userProfile?.colorPreferences || 'Not specified'}`,
    `- Clothing Preferences: ${ctx.userProfile?.clothingPreferences || 'Not specified'}`,
  ];

  const missingDetails: string[] = [];
  if (typeof ctx.userProfile?.heightCm !== 'number') missingDetails.push('height');
  if (ctx.userProfile?.skinToneMonk === undefined && !ctx.userProfile?.undertone) missingDetails.push('skin tone');
  if (!ctx.userProfile?.bodyShape) missingDetails.push('body shape');
  if (!ctx.userProfile?.colorPreferences) missingDetails.push('color preferences');
  if (!ctx.userProfile?.clothingPreferences) missingDetails.push('clothing preferences');

  const lines = [
    `You are ${ctx.expert?.name || 'Aria Chen'}, ${ctx.expert?.role || 'Personal Wardrobe Stylist'} at Fitroom Studio.`,
    `Specialty: ${ctx.expert?.specialty || 'Everyday Style & Proportion'}. Tone: ${ctx.expert?.tone || 'Clear, supportive, practical'}.`,
    `Client Shared Styling Preferences (Privacy-First — no personal data collected):`,
    ...profileLines,
    `Session Context:`,
    `- Occasion: ${ctx.occasion || 'Everyday & Campus'}`,
    `- Weather: ${ctx.weather || 'sunny_warm'}`,
    `- Selected Dress Code Option: ${selectedLabel} (key: ${ctx.formality || 'smart_casual'})`,
    `- Closet-Only Mode: ${
      ctx.useClosetOnly
        ? 'STRICT ON (Only assemble outfits using pieces explicitly listed in the client digital closet below; if a slot is missing, point out the exact gap kindly)'
        : 'OFF (May suggest new pieces or reference closet items if helpful)'
    }`,
    `Client Digital Closet Inventory:\n${closetSummary}`,
    `Strict Privacy & Anti-Assumption Guidelines:`,
    `- NEVER make up, guess, or estimate the user's height, skin tone, undertone, body shape, or clothing/color preferences if they are marked as Not provided.`,
    `- NEVER ask for or collect personal data (such as age, email address, phone number, or full legal name). Refer to the user only by their login name if needed.`,
    missingDetails.length > 0
      ? `- OPTIONAL DETAIL PROMPT: Because ${missingDetails.join(', ')} are not provided yet, politely ask if the user would like to share them (or any of them) to personalize fit and color advice—and explicitly remind them these details are NOT mandatory if they prefer not to share. Still provide useful, adaptable styling advice right away using only what they have shared (or ask briefly before tailoring further if needed), and if they say they prefer not to share, accept it immediately without asking again.`
      : `- Tailor recommendations directly to the optional styling preferences the client chose to share, keeping suggestions practical and wearable.`,
  ];

  if (ctx.isLiveVoice) {
    lines.push(
      `- STRICT DOMAIN SCOPE (FASHION ONLY): You must focus strictly and exclusively on fashion, outfits, clothing, wardrobe styling, color combinations, fabrics, proportions, footwear, accessories, and dress codes.`,
      `- OFF-TOPIC REFUSAL RULE: Never answer, discuss, or help with any topic outside fashion and styling ideas (including general trivia, math, coding, science, news, politics, recipes, sports, or unrelated chitchat).`,
      `- If the user asks anything unrelated to fashion or this styling application, humbly refuse without answering the question by saying: "${IRRELEVANT_QUESTION_REPLY}"`,
      `- Keep spoken fashion replies conversational, natural, and concise (2 to 4 clear sentences per turn).`,
      `- If the client asks for a different dress code than ${selectedLabel}, clearly state that the asked dress code and the currently selected Dress Code option (${selectedLabel}) are different, and suggest switching to that dress code option.`
    );
  } else {
    lines.push(
      `- STRICT DOMAIN RELEVANCE CHECK: Fitroom Studio is strictly a personal fashion, outfit, and wardrobe styling assistant.`,
      `- Relevant topics: clothing, outfits, styling advice, color harmony, skin tone/undertone pairings, body proportions/height/body shape styling, fabrics, footwear, accessories, weather/occasion dressing, sharing/skipping optional styling details, or using Fitroom Studio features.`,
      `- Irrelevant topics: anything outside fashion and wardrobe styling (such as coding, math, general knowledge trivia, geography, history, science, politics, news, recipes, finance, medical advice, or unrelated chitchat).`,
      `- If the client request is irrelevant to this application: set isRelevant to false, set reply to "${IRRELEVANT_QUESTION_REPLY}", set detectedRequestedDressCode to "none", set outfitName to "", set silhouetteNote to "", and set pieces to []. NEVER answer an irrelevant question, not even partially—give only that simple humble rejection.`,
      `- If the client request IS relevant: set isRelevant to true.`,
      `- If the client asks for a different dress code category than the Selected Dress Code Option (e.g. asking for formal when Casual is selected, or casual when Formal is selected), set detectedRequestedDressCode to that requested category key ('casual', 'smart_casual', 'business_casual', or 'formal_evening'), otherwise set it to 'none'.`,
      `- Keep the styling reply clear, practical, and concise (around 80-150 words using crisp bullet points) so guidance stays fast and easy to scan.`,
      `- Always populate the JSON fields accurately: isRelevant, reply, outfitName, silhouetteNote, detectedRequestedDressCode, and 3-4 outfit pieces with accurate hex colors (when relevant).`
    );
  }

  return lines.join('\n');
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioBase64 } = req.body || {};

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
        });
        return;
      }

      const parsedAudio = parseBase64DataUrl(audioBase64);
      if (!parsedAudio || !parsedAudio.data) {
        res.status(400).json({
          success: false,
          error: 'No valid audio recording was received.',
        });
        return;
      }

      let transcript = '';
      try {
        const response = await withFastBudget(() =>
          getAiClient().models.generateContent({
            model: 'gemini-3.5-transcribe',
            contents: {
              parts: [
                { inlineData: parsedAudio },
                { text: 'Transcribe this spoken styling request accurately into plain text.' },
              ],
            },
            config: { abortSignal: AbortSignal.timeout(14000) },
          })
        );
        transcript = (response.text ?? '').trim();
      } catch (primaryErr) {
        console.warn('gemini-3.5-transcribe fallback to gemini-4-hydrogen:', primaryErr);
        const fallbackResp = await getAiClient().models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              { inlineData: parsedAudio },
              { text: 'Return only the exact plain-text transcription of the speech in this audio clip, with no commentary.' },
            ],
          },
          config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
        });
        transcript = (fallbackResp.text ?? '').trim();
      }

      res.json({
        success: true,
        text: transcript,
      });
    } catch (error) {
      console.error('Error in /api/transcribe:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Voice transcription failed.',
      });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const {
        message,
        occasion,
        expert,
        userProfile,
        weather,
        formality,
        useClosetOnly,
        closetItems,
        imageBase64,
        audioBase64,
        generateVisual,
        history,
      } = req.body || {};

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
        });
        return;
      }

      const systemInstruction = buildStylistSystemInstruction({
        expert,
        userProfile,
        occasion,
        weather,
        formality,
        useClosetOnly,
        closetItems,
        isLiveVoice: false,
      });

      const historyText =
        Array.isArray(history) && history.length > 0
          ? history
              .slice(-6)
              .map(
                (h: { role: string; content: string }) =>
                  `${h.role === 'user' ? 'Client' : 'Stylist'}: ${h.content}`
              )
              .join('\n')
          : '';

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      const parsedImg = parseBase64DataUrl(imageBase64);
      if (parsedImg) {
        parts.push({ inlineData: parsedImg });
      }

      const parsedAudio = parseBase64DataUrl(audioBase64);
      if (parsedAudio) {
        parts.push({ inlineData: parsedAudio });
      }

      const userText = [
        historyText ? `Recent conversation:\n${historyText}\n` : '',
        `Client request: ${
          message ||
          (parsedImg
            ? 'Please critique this outfit photo and suggest complementary pieces.'
            : parsedAudio
            ? 'Please listen to my voice styling question and respond.'
            : 'Recommend an outfit for today.')
        }`,
      ]
        .filter(Boolean)
        .join('\n');

      parts.push({ text: userText });

      const schemaProperties: Record<string, unknown> = {
        isRelevant: {
          type: Type.BOOLEAN,
          description:
            'True if the client request is about fashion, outfits, styling, wardrobe, or Fitroom Studio; false if irrelevant.',
        },
        reply: {
          type: Type.STRING,
          description:
            'Markdown-formatted styling advice if relevant, or the humble rejection if irrelevant.',
        },
        outfitName: {
          type: Type.STRING,
          description: 'Short editorial title for the recommended outfit (3-6 words), or empty if irrelevant.',
        },
        detectedRequestedDressCode: {
          type: Type.STRING,
          enum: ['none', 'casual', 'smart_casual', 'business_casual', 'formal_evening'],
          description:
            'The dress code category explicitly asked for in the client message if any, or none.',
        },
      };

      if (generateVisual) {
        schemaProperties.silhouetteNote = {
          type: Type.STRING,
          description: 'Concise 1-line proportion or tailoring note, or empty if irrelevant.',
        };
        schemaProperties.pieces = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              slot: { type: Type.STRING },
              itemName: { type: Type.STRING },
              colorName: { type: Type.STRING },
              colorHex: { type: Type.STRING },
              fabric: { type: Type.STRING },
            },
          },
        };
      }

      const responseSchema = {
        type: Type.OBJECT,
        properties: schemaProperties,
      };

      let response;
      try {
        response = await getAiClient().models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: { parts },
          config: {
            systemInstruction,
            abortSignal: AbortSignal.timeout(10500),
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema,
          },
        });
      } catch (primaryErr) {
        console.warn('/api/chat primary timeout/error, falling back to gemini-3.1-flash-lite:', primaryErr);
        response = await getAiClient().models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: { parts },
          config: {
            systemInstruction,
            abortSignal: AbortSignal.timeout(6500),
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            responseMimeType: 'application/json',
            responseSchema,
          },
        });
      }

      const rawText = stripJsonCodeFence(response.text ?? '{}');
      let parsed: {
        isRelevant?: boolean;
        reply?: string;
        outfitName?: string;
        silhouetteNote?: string;
        detectedRequestedDressCode?: string;
        pieces?: OutfitPieceSpec[];
      } = {};

      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = { isRelevant: true, reply: rawText || 'Here is your tailored outfit recommendation.' };
      }

      if (parsed.isRelevant === false) {
        res.json({
          success: true,
          reply: IRRELEVANT_QUESTION_REPLY,
          isOutOfScope: true,
        });
        return;
      }

      const selectedKey =
        typeof formality === 'string' && FORMALITY_LABELS[formality] ? formality : 'smart_casual';
      const askedKey = detectDressCodeFromText(message || '', parsed.detectedRequestedDressCode);
      const isDressCodeMismatch = Boolean(askedKey && askedKey !== selectedKey);

      let finalReply = parsed.reply || 'Here is a clean outfit direction tailored for your profile.';
      if (isDressCodeMismatch && askedKey) {
        const askedLabel = FORMALITY_LABELS[askedKey];
        const selectedLabel = FORMALITY_LABELS[selectedKey];
        const mismatchBanner = `**Dress Code Mismatch Notice:** The dress code you asked for (**${askedLabel}**) and the currently selected Dress Code option (**${selectedLabel}**) are different. I suggest switching to the **${askedLabel}** dress code option.\n\n`;
        finalReply = `${mismatchBanner}${finalReply}`;
      }

      const outfitName = parsed.outfitName || `${occasion || 'Everyday'} Curated Look`;
      const generatedOutfitImageUrl = generateVisual
        ? buildLookbookSvgDataUrl({
            outfitName,
            occasion: occasion || 'Everyday & Campus',
            monkScale: userProfile?.skinToneMonk,
            undertone: userProfile?.undertone,
            silhouetteNote: parsed.silhouetteNote || 'Balanced shoulder-to-hem proportions',
            pieces: Array.isArray(parsed.pieces) ? parsed.pieces : [],
          })
        : undefined;

      res.json({
        success: true,
        reply: finalReply,
        outfitName,
        generatedOutfitImageUrl,
        suggestedFormality: isDressCodeMismatch ? askedKey : undefined,
        isOutOfScope: false,
      });
    } catch (error) {
      console.error('Error in /api/chat:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Stylist service failed.',
      });
    }
  });

  app.post('/api/generate-outfit-image', async (req, res) => {
    try {
      const { occasion, userProfile, outfitDescription, outfitName } = req.body || {};

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          success: false,
          error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
        });
        return;
      }

      const sharedProfilePrompt = [
        typeof userProfile?.skinToneMonk === 'number' ? `MST ${userProfile.skinToneMonk}` : '',
        userProfile?.undertone ? `${userProfile.undertone} undertone` : '',
        typeof userProfile?.heightCm === 'number' ? `${userProfile.heightCm}cm height` : '',
        userProfile?.bodyShape ? `body shape: ${userProfile.bodyShape}` : '',
        userProfile?.colorPreferences ? `color preferences: ${userProfile.colorPreferences}` : '',
        userProfile?.clothingPreferences ? `clothing preferences: ${userProfile.clothingPreferences}` : '',
      ]
        .filter(Boolean)
        .join(', ');

      const lookbookSchema = {
        type: Type.OBJECT,
        properties: {
          outfitName: { type: Type.STRING },
          silhouetteNote: { type: Type.STRING },
          pieces: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                slot: { type: Type.STRING },
                itemName: { type: Type.STRING },
                colorName: { type: Type.STRING },
                colorHex: { type: Type.STRING },
                fabric: { type: Type.STRING },
              },
            },
          },
        },
      };

      const lookbookPrompt = `Extract or design a 4-piece outfit breakdown (Top, Outerwear, Bottom, Footwear) from this styling recommendation for ${occasion || 'Everyday'}${sharedProfilePrompt ? ` tailored to shared preferences (${sharedProfilePrompt})` : ''}:\n\n${outfitDescription || 'Clean everyday outfit'}`;

      let response;
      try {
        response = await getAiClient().models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: lookbookPrompt,
          config: {
            abortSignal: AbortSignal.timeout(10500),
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: lookbookSchema,
          },
        });
      } catch (primaryErr) {
        console.warn('/api/generate-outfit-image fallback to gemini-3.1-flash-lite:', primaryErr);
        response = await getAiClient().models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: lookbookPrompt,
          config: {
            abortSignal: AbortSignal.timeout(6500),
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            responseMimeType: 'application/json',
            responseSchema: lookbookSchema,
          },
        });
      }

      const raw = stripJsonCodeFence(response.text ?? '{}');
      let parsed: {
        outfitName?: string;
        silhouetteNote?: string;
        pieces?: OutfitPieceSpec[];
      } = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }

      const finalName = outfitName || parsed.outfitName || `${occasion || 'Curated'} Lookbook`;
      const imageUrl = buildLookbookSvgDataUrl({
        outfitName: finalName,
        occasion: occasion || 'Everyday & Campus',
        monkScale: userProfile?.skinToneMonk,
        undertone: userProfile?.undertone,
        silhouetteNote: parsed.silhouetteNote || 'Balanced silhouette proportions',
        pieces: Array.isArray(parsed.pieces) ? parsed.pieces : [],
      });

      res.json({
        success: true,
        imageUrl,
        outfitName: finalName,
      });
    } catch (error) {
      console.error('Error in /api/generate-outfit-image:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Could not render lookbook sheet.',
      });
    }
  });

  // WebSocket server for Gemini Live API (/live) using noServer so Vite HMR upgrades are untouched
  const liveWss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const reqUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      if (reqUrl.pathname === '/live') {
        liveWss.handleUpgrade(request, socket, head, (ws) => {
          liveWss.emit('connection', ws, request);
        });
      }
    } catch {
      socket.destroy();
    }
  });

  liveWss.on('connection', (clientWs: WebSocket) => {
    let liveSession: Awaited<ReturnType<ReturnType<typeof getAiClient>['live']['connect']>> | null = null;
    let isConnecting = false;
    const pendingAudioQueue: string[] = [];

    const safeSend = (payload: unknown) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    const connectLiveSession = async (context?: {
      expert?: { id?: string; name?: string; role?: string; specialty?: string; tone?: string };
      occasion?: string;
      weather?: string;
      formality?: string;
      userProfile?: {
        name?: string;
        heightCm?: number;
        skinToneMonk?: number;
        undertone?: string;
        bodyShape?: string;
        colorPreferences?: string;
        clothingPreferences?: string;
      };
      useClosetOnly?: boolean;
      closetItems?: Array<{
        name: string;
        category: string;
        colorName: string;
        fabric?: string;
        formality?: string;
      }>;
    }) => {
      if (liveSession || isConnecting) return;
      if (!process.env.GEMINI_API_KEY) {
        safeSend({ error: 'GEMINI_API_KEY is not configured in Settings > Secrets.' });
        return;
      }

      isConnecting = true;
      try {
        const voiceName =
          (context?.expert?.id && EXPERT_VOICE_MAP[context.expert.id]) || 'Zephyr';
        const systemInstruction = buildStylistSystemInstruction({
          ...(context || {}),
          isLiveVoice: true,
        });

        const attemptLiveConnect = async (apiVersion: string) => {
          return getAiClient(apiVersion).live.connect({
            model: 'gemini-3.8-live',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction,
            },
            callbacks: {
              onmessage: (message: LiveServerMessage) => {
                const content = message.serverContent;
                if (content?.inputTranscription?.text) {
                  safeSend({ inputTranscript: content.inputTranscription.text });
                }
                if (content?.outputTranscription?.text) {
                  safeSend({ outputTranscript: content.outputTranscription.text });
                }
                for (const part of content?.modelTurn?.parts ?? []) {
                  if (part.inlineData?.data) {
                    safeSend({ audio: part.inlineData.data });
                  }
                }
                if (content?.interrupted) {
                  safeSend({ interrupted: true });
                }
                if (content?.turnComplete) {
                  safeSend({ turnComplete: true });
                }
              },
              onerror: (err: unknown) => {
                console.error('Gemini Live session error:', err);
                safeSend({ error: 'Live voice connection encountered an error.' });
              },
              onclose: () => {
                safeSend({ closed: true });
              },
            },
          });
        };

        let session;
        try {
          session = await attemptLiveConnect('v1beta');
        } catch (v1betaErr) {
          console.warn(
            'Gemini Live v1beta connect failed, retrying v1alpha:',
            v1betaErr instanceof Error ? v1betaErr.message : v1betaErr
          );
          session = await attemptLiveConnect('v1alpha');
        }

        liveSession = session;
        safeSend({ ready: true });

        while (pendingAudioQueue.length > 0) {
          const chunk = pendingAudioQueue.shift();
          if (chunk) {
            liveSession.sendRealtimeInput({
              audio: { data: chunk, mimeType: 'audio/pcm;rate=16000' },
            });
          }
        }
      } catch (err) {
        console.error('Failed to connect Gemini Live:', err);
        safeSend({
          error: err instanceof Error ? err.message : 'Unable to start live voice session.',
        });
      } finally {
        isConnecting = false;
      }
    };

    clientWs.on('message', async (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());
        if (msg.type === 'init') {
          await connectLiveSession(msg.context);
          return;
        }
        if (msg.text && liveSession) {
          liveSession.sendRealtimeInput({ text: String(msg.text) });
          return;
        }
        if (msg.audio) {
          if (liveSession) {
            liveSession.sendRealtimeInput({
              audio: { data: String(msg.audio), mimeType: 'audio/pcm;rate=16000' },
            });
          } else {
            pendingAudioQueue.push(String(msg.audio));
            if (!isConnecting) {
              void connectLiveSession();
            }
          }
        }
      } catch (err) {
        console.error('Live WS message error:', err);
      }
    });

    clientWs.on('close', () => {
      try {
        liveSession?.close();
      } catch {
        // ignore close errors
      }
      liveSession = null;
    });
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Fitroom Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Fitroom Studio server:', err);
  process.exit(1);
});
