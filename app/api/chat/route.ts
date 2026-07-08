import { NextResponse } from 'next/server';
import { z } from 'zod';
import { env, hasAnthropic } from '@/lib/env';
import { clientKey, rateLimit, tooManyRequests } from '@/lib/rate-limit';
import { listLocations } from '@/lib/db/locations';
import { FEATURE_TYPE_LABELS, type FeatureType, type LocationRecord } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
  locationContext: z
    .object({
      name: z.string(),
      feature_type: z.string(),
      slug: z.string(),
      difficulty_tier: z.string(),
    })
    .optional(),
});

// Keyword -> feature type. Order matters: "hot spring" must win before the bare
// "spring" rule, and "waterfall/falls" before nothing swallows it.
const TYPE_MATCHERS: Array<{ type: FeatureType; test: RegExp }> = [
  { type: 'hot_spring', test: /\bhot\s?springs?\b|\bhotsprings?\b/i },
  { type: 'waterfall', test: /\bwaterfalls?\b|\bfalls\b|\bcascades?\b/i },
  { type: 'cave', test: /\bcaves?\b|\bcaverns?\b|\bcaving\b/i },
  { type: 'spring', test: /\bsprings?\b/i },
];

function detectType(text: string): FeatureType | undefined {
  for (const { type, test } of TYPE_MATCHERS) {
    if (test.test(text)) return type;
  }
  return undefined;
}

// Common query words that appear capitalized only because they start a sentence —
// ignore them so the search term is a real proper-noun place name when present.
const STOPWORDS = new Set([
  'find',
  'what',
  'where',
  'best',
  'how',
  'can',
  'should',
  'tell',
  'give',
  'show',
  'is',
  'are',
  'do',
  'does',
  'the',
  'a',
  'an',
  'when',
  'which',
  'near',
  'me',
  'i',
  'my',
  'good',
  'some',
  'any',
  'looking',
  'want',
  'need',
  'please',
  'help',
  'there',
  'here',
]);

/** Longest capitalized proper-noun phrase in the text, capped to 60 chars. */
function extractTerm(text: string): string | undefined {
  const matches = text.match(/\b[A-Z][a-zA-Z']+(?:\s+[A-Z][a-zA-Z']+)*\b/g) ?? [];
  let best: string | undefined;
  for (const raw of matches) {
    const phrase = raw.trim();
    const words = phrase.split(/\s+/);
    if (words.length === 1 && STOPWORDS.has(words[0].toLowerCase())) continue;
    if (!best || phrase.length > best.length) best = phrase;
  }
  return best ? best.slice(0, 60) : undefined;
}

const SYSTEM_PROMPT =
  'You are Atlas Guide, the warm, expert assistant inside PinnedAtlas — an app for ' +
  'finding caves, waterfalls, hot springs, and springs. Help people decide where to go ' +
  'and how to visit safely and responsibly. Be concise and practical (a few sentences or ' +
  'a short list). Ground any specific spot recommendations ONLY in the CANDIDATE SPOTS ' +
  'provided, and link them as markdown [Name](/location/slug). NEVER invent spots, ' +
  'coordinates, trail lengths, or open/closed status. For real-time conditions (flow, ' +
  'closures, crowds) you don\'t have, say so and point them to the spot\'s report section. ' +
  'Always fold in the key safety and access caution for the relevant feature type (slick ' +
  'rock and currents at waterfalls; scalding/temperature and no head-submersion at hot ' +
  'springs; darkness/loose rock/never-alone at caves; untreated water at springs). Respect ' +
  'Leave No Trace and private property.';

interface AnthropicContentBlock {
  type?: string;
  text?: string;
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(clientKey(req, 'chat'), 20, 60_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    if (!hasAnthropic) {
      return NextResponse.json({ error: 'ai_unconfigured' }, { status: 503 });
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const { locationContext } = parsed.data;

    // Keep only the last 12 turns; the conversation must start (Anthropic) and
    // end with a user message.
    let convo = parsed.data.messages.slice(-12);
    while (convo.length && convo[0].role !== 'user') convo = convo.slice(1);
    if (convo.length === 0 || convo[convo.length - 1].role !== 'user') {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const latestUser = convo[convo.length - 1].content;

    // Grounding retrieval — best-effort; never let a lookup failure break chat.
    let candidates: LocationRecord[] = [];
    try {
      const detectedType = detectType(latestUser);
      const term = extractTerm(latestUser);
      if (term || detectedType) {
        candidates = await listLocations({
          q: term,
          types: detectedType ? [detectedType] : undefined,
          limit: 8,
        });
        if (candidates.length === 0 && detectedType) {
          candidates = await listLocations({ types: [detectedType], limit: 6 });
        }
      }
    } catch (err) {
      console.error('Atlas Guide: grounding retrieval failed', err);
      candidates = [];
    }

    // Compact, clearly delimited grounding block appended to the system prompt.
    const groundingParts: string[] = [];
    if (candidates.length > 0) {
      const lines = candidates.map(
        (c) =>
          `- ${c.name} (${FEATURE_TYPE_LABELS[c.feature_type]}, ${c.difficulty_tier}, ${
            c.state_code || 'US'
          }) -> /location/${c.slug}`,
      );
      groundingParts.push(
        `CANDIDATE SPOTS (the ONLY spots you may name; link each as [Name](/location/slug)):\n${lines.join(
          '\n',
        )}`,
      );
    } else {
      groundingParts.push(
        'CANDIDATE SPOTS: none matched this query. Do not name specific spots — instead help ' +
          'the user refine what they are looking for and share the relevant safety guidance.',
      );
    }
    if (locationContext) {
      groundingParts.push(
        `The user is currently viewing: ${locationContext.name} -> /location/${locationContext.slug}`,
      );
    }

    const system = `${SYSTEM_PROMPT}\n\n---\n${groundingParts.join('\n\n')}`;

    const sanitizedMessages = convo.map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(25000),
      headers: {
        'x-api-key': env.anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: env.anthropicModel,
        max_tokens: 700,
        system,
        messages: sanitizedMessages,
      }),
    });

    if (!res.ok) {
      console.error('Atlas Guide: Anthropic API error', res.status);
      return NextResponse.json({ error: 'ai_error' }, { status: 502 });
    }

    const data = (await res.json()) as { content?: AnthropicContentBlock[] };
    const text = (data.content ?? [])
      .filter((b) => b?.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text)
      .join('')
      .trim();

    return NextResponse.json({
      reply:
        text ||
        "I'm not sure how to help with that just yet — try asking about caves, waterfalls, hot springs, or springs.",
      sources: candidates.map((c) => ({ name: c.name, slug: c.slug })),
    });
  } catch (err) {
    if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
      console.error('Atlas Guide: request timed out');
    } else {
      console.error('Atlas Guide: unexpected error', err);
    }
    return NextResponse.json({ error: 'ai_error' }, { status: 500 });
  }
}
