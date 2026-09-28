import { corsHeaders, isAllowedOrigin } from "./cors.ts";
import { clientIp, consume } from "./rate-limit.ts";

/** An error whose message is friendly Portuguese, safe to show in the app as is. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfter?: number,
  ) {
    super(message);
  }
}

export function rateLimited(retryAfter: number): HttpError {
  return new HttpError(
    429,
    "RATE_LIMITED",
    "Muitas solicitações em pouco tempo. Aguarde um instante e tente de novo.",
    retryAfter,
  );
}

type Method = "GET" | "POST";

interface HandlerOptions {
  name: string;
  methods: readonly Method[];
  /** Request limits per IP, all of which must pass. */
  limits: readonly { requests: number; windowMs: number }[];
}

interface HandlerContext {
  req: Request;
  ip: string;
  body: unknown;
}

const MAX_BODY_CHARS = 64 * 1024;

/**
 * Wraps a function body with the protections every endpoint shares: origin
 * allowlist (CORS), allowed methods, per-IP rate limits, a body size cap, and
 * JSON error responses shaped as { error: { code, message } }.
 */
export function createHandler(
  options: HandlerOptions,
  handle: (ctx: HandlerContext) => Promise<unknown>,
): (req: Request) => Promise<Response> {
  return async (req) => {
    const origin = req.headers.get("Origin");
    const cors = corsHeaders(origin);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: isAllowedOrigin(origin) ? 204 : 403, headers: cors });
    }

    try {
      if (!isAllowedOrigin(origin)) {
        throw new HttpError(403, "ORIGIN_NOT_ALLOWED", "Origem não autorizada.");
      }
      if (!options.methods.includes(req.method as Method)) {
        throw new HttpError(405, "METHOD_NOT_ALLOWED", "Método não permitido.");
      }

      const ip = clientIp(req);
      for (const [index, limit] of options.limits.entries()) {
        const retryAfter = consume(`${options.name}:${index}:${ip}`, 1, limit.requests, limit.windowMs);
        if (retryAfter) throw rateLimited(retryAfter);
      }

      const body = req.method === "POST" ? await readJson(req) : undefined;
      return json(await handle({ req, ip, body }), 200, cors);
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.retryAfter) cors.set("Retry-After", String(error.retryAfter));
        return json({ error: { code: error.code, message: error.message } }, error.status, cors);
      }
      console.error(`[${options.name}]`, error);
      return json(
        { error: { code: "INTERNAL", message: "Algo deu errado do nosso lado. Tente novamente." } },
        500,
        cors,
      );
    }
  };
}

async function readJson(req: Request): Promise<unknown> {
  const tooLarge = () =>
    new HttpError(413, "TEXT_TOO_LONG", "A solicitação é grande demais. Envie um texto menor.");

  if (Number(req.headers.get("Content-Length") ?? 0) > MAX_BODY_CHARS) throw tooLarge();
  const raw = await req.text();
  if (raw.length > MAX_BODY_CHARS) throw tooLarge();

  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "INVALID_INPUT", "Não foi possível ler a solicitação.");
  }
}

function json(body: unknown, status: number, cors: Headers): Response {
  const headers = new Headers(cors);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}
