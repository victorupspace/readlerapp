// translate: thin proxy to DeepL /v2/translate.
// Input:  { text, source_lang, target_lang, formality }
// Output: { translation, detected_source_lang }
import { deepl } from "../_shared/deepl.ts";
import { createHandler, HttpError, rateLimited } from "../_shared/http.ts";
import { isSourceLang, isTargetLang, type TargetLang } from "../_shared/languages.ts";
import { consume } from "../_shared/rate-limit.ts";

const MAX_CHARS = 5000;

// Besides the request limit, each IP gets a character budget per hour, so a
// script can't drain the monthly DeepL quota in a few minutes.
const HOURLY_CHAR_BUDGET = 60_000;
const HOUR = 60 * 60 * 1000;

// Formal / informal is offered for French (tu/vous) and German (du/Sie).
const FORMALITY_TARGETS: ReadonlySet<TargetLang> = new Set(["FR", "DE"]);

interface DeepLTranslation {
  translations?: { detected_source_language: string; text: string }[];
}

Deno.serve(
  createHandler(
    { name: "translate", methods: ["POST"], limits: [{ requests: 60, windowMs: 60_000 }] },
    async ({ body, ip }) => {
      const input = parseInput(body);

      const retryAfter = consume(`translate:chars:${ip}`, input.text.length, HOURLY_CHAR_BUDGET, HOUR);
      if (retryAfter) throw rateLimited(retryAfter);

      const data = await deepl<DeepLTranslation>("/v2/translate", {
        text: [input.text],
        target_lang: input.targetLang,
        ...(input.sourceLang ? { source_lang: input.sourceLang } : {}),
        ...(input.formality ? { formality: input.formality } : {}),
      });

      const result = data.translations?.[0];
      if (!result) {
        throw new HttpError(502, "UPSTREAM_UNAVAILABLE", "O DeepL não devolveu uma tradução. Tente novamente.");
      }
      return { translation: result.text, detected_source_lang: result.detected_source_language };
    },
  ),
);

function parseInput(body: unknown) {
  const { text, source_lang, target_lang, formality } = (body ?? {}) as Record<string, unknown>;

  if (typeof text !== "string" || !text.trim()) {
    throw new HttpError(400, "INVALID_INPUT", "Escreva um texto para traduzir.");
  }
  if (text.length > MAX_CHARS) {
    throw new HttpError(413, "TEXT_TOO_LONG", "O texto passa de 5.000 caracteres. Divida em partes menores.");
  }
  if (!isTargetLang(target_lang)) {
    throw new HttpError(400, "INVALID_INPUT", "Idioma de destino inválido.");
  }

  const sourceLang = source_lang == null || source_lang === "auto" ? null : source_lang;
  if (sourceLang !== null && !isSourceLang(sourceLang)) {
    throw new HttpError(400, "INVALID_INPUT", "Idioma de origem inválido.");
  }

  const wantsFormality = formality === "prefer_more" || formality === "prefer_less";
  return {
    text,
    sourceLang,
    targetLang: target_lang,
    formality: wantsFormality && FORMALITY_TARGETS.has(target_lang) ? formality : null,
  };
}
