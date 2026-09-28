import { HttpError } from "./http.ts";

// DeepL Free keys end in ":fx" and are served by api-free.deepl.com.
function baseUrl(key: string): string {
  return key.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
}

/** Calls the DeepL API with the server-side key. GET without a body, POST (JSON) with one. */
export async function deepl<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const key = Deno.env.get("DEEPL_API_KEY");
  if (!key) {
    throw new HttpError(
      500,
      "NOT_CONFIGURED",
      "O tradutor ainda não foi configurado. Defina o segredo DEEPL_API_KEY no Supabase.",
    );
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl(key)}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error("[deepl] request failed", error);
    throw new HttpError(
      502,
      "UPSTREAM_UNAVAILABLE",
      "Não foi possível falar com o DeepL agora. Tente novamente em instantes.",
    );
  }

  if (res.ok) return (await res.json()) as T;

  const detail = await res.text().catch(() => "");
  console.error(`[deepl] ${res.status} ${detail.slice(0, 300)}`);
  throw deeplError(res.status);
}

function deeplError(status: number): HttpError {
  switch (status) {
    case 456:
      return new HttpError(
        429,
        "QUOTA_EXCEEDED",
        "A cota mensal de caracteres do DeepL acabou. Ela é renovada no início do próximo ciclo.",
      );
    case 429:
      return new HttpError(
        429,
        "UPSTREAM_RATE_LIMITED",
        "O DeepL recebeu muitas solicitações seguidas. Aguarde alguns segundos e tente de novo.",
      );
    case 401:
    case 403:
      return new HttpError(
        502,
        "UPSTREAM_AUTH",
        "A chave do DeepL foi recusada. Confira o segredo DEEPL_API_KEY no Supabase.",
      );
    case 400:
      return new HttpError(400, "INVALID_INPUT", "O DeepL não aceitou este texto. Revise e tente de novo.");
    case 413:
      return new HttpError(413, "TEXT_TOO_LONG", "O texto é longo demais para uma única tradução.");
    default:
      return new HttpError(
        502,
        "UPSTREAM_UNAVAILABLE",
        "O DeepL está instável no momento. Tente novamente em instantes.",
      );
  }
}
