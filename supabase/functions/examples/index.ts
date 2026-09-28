// examples: short example sentences for a single word, with their Portuguese
// translations, from Tatoeba (community sentences, CC BY 2.0 FR). Used under
// the translation when the Verbete (Claude) is not configured.
// Input:  { word, lang }   lang: FR, DE or EN (any variant)
// Output: { examples: [{ target, pt }], source: "tatoeba" }
// GET answers { ok: true }: the app pings it on load so the first lookup is warm.
import { createHandler, HttpError } from "../_shared/http.ts";

const MAX_WORD = 40;
const MAX_EXAMPLES = 2;
const MAX_WORDS_PER_SENTENCE = 12;
const TATOEBA_LANGS: Record<string, string> = { FR: "fra", DE: "deu", EN: "eng" };

// Tatoeba searches take one to two seconds; repeats are served from memory
// for as long as this instance lives.
const CACHE_LIMIT = 500;
const CACHE_TTL = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; examples: Example[] }>();

interface Example {
  target: string;
  pt: string;
}

interface TatoebaTranslation {
  lang: string;
  text: string;
}

interface TatoebaSentence {
  text: string;
  // Two groups: direct translations, then indirect ones.
  translations: TatoebaTranslation[][];
}

interface TatoebaSearch {
  results?: TatoebaSentence[];
}

Deno.serve(
  createHandler(
    { name: "examples", methods: ["GET", "POST"], limits: [{ requests: 30, windowMs: 60_000 }] },
    async ({ req, body }) => {
      if (req.method === "GET") return { ok: true };

      const { word, lang } = parseInput(body);
      const cacheKey = `${lang}:${word.toLowerCase()}`;
      const hit = cache.get(cacheKey);
      if (hit && Date.now() - hit.at < CACHE_TTL) return { examples: hit.examples, source: "tatoeba" };

      const examples = pick(await search(word, lang), word);
      cache.set(cacheKey, { at: Date.now(), examples });
      if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
      return { examples, source: "tatoeba" };
    },
  ),
);

function parseInput(body: unknown): { word: string; lang: string } {
  const { word, lang } = (body ?? {}) as Record<string, unknown>;
  if (typeof word !== "string" || !word.trim() || word.length > MAX_WORD || /\s/.test(word.trim())) {
    throw new HttpError(400, "INVALID_INPUT", "Envie uma única palavra para buscar exemplos.");
  }
  const code = typeof lang === "string" ? TATOEBA_LANGS[lang.slice(0, 2).toUpperCase()] : undefined;
  if (!code) throw new HttpError(400, "INVALID_INPUT", "Idioma sem exemplos disponíveis.");
  return { word: word.trim(), lang: code };
}

async function search(word: string, lang: string): Promise<TatoebaSentence[]> {
  const url = new URL("https://tatoeba.org/en/api_v0/search");
  url.search = new URLSearchParams({
    from: lang,
    to: "por",
    query: word,
    sort: "relevance",
    limit: "10",
    trans_filter: "limit",
    trans_to: "por",
  }).toString();

  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    console.error("[examples] request failed", error);
    throw unavailable();
  }
  if (!res.ok) {
    console.error(`[examples] tatoeba ${res.status}`);
    throw unavailable();
  }
  try {
    return ((await res.json()) as TatoebaSearch).results ?? [];
  } catch {
    throw unavailable();
  }
}

function unavailable(): HttpError {
  return new HttpError(502, "UPSTREAM_UNAVAILABLE", "Não foi possível buscar exemplos agora. Tente novamente em instantes.");
}

const clean = (text: string) => text.replace(/\s+/g, " ").trim();
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Up to two short sentences that use the word itself, then ones with inflected forms. */
function pick(results: TatoebaSentence[], word: string): Example[] {
  const exact = new RegExp(`(^|[^\\p{L}\\p{M}])${escapeRegExp(word)}(?=$|[^\\p{L}\\p{M}])`, "iu");
  const loose = new RegExp(escapeRegExp(word), "iu");

  const candidates = results.flatMap((sentence) => {
    const target = clean(sentence.text ?? "");
    const pt = sentence.translations?.flat().find((t) => t.lang === "por" && t.text?.trim())?.text;
    if (!target || !pt || target.split(" ").length > MAX_WORDS_PER_SENTENCE || !loose.test(target)) return [];
    return [{ target, pt: clean(pt), exact: exact.test(target) }];
  });

  const picked: Example[] = [];
  const seen = new Set<string>();
  for (const candidate of [...candidates.filter((c) => c.exact), ...candidates.filter((c) => !c.exact)]) {
    const key = candidate.target.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push({ target: candidate.target, pt: candidate.pt });
    if (picked.length === MAX_EXAMPLES) break;
  }
  return picked;
}
