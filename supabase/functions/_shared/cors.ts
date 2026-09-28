// Origins allowed to call the functions: the deployed frontend (the ALLOWED_ORIGIN
// secret, comma-separated if there is more than one) plus localhost on any port.
const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function configuredOrigins(): string[] {
  return (Deno.env.get("ALLOWED_ORIGIN") ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function isAllowedOrigin(origin: string | null): origin is string {
  if (!origin) return false;
  return LOCALHOST.test(origin) || configuredOrigins().includes(origin);
}

export function corsHeaders(origin: string | null): Headers {
  const headers = new Headers({ Vary: "Origin" });
  if (isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      "authorization, x-client-info, apikey, content-type, x-region",
    );
    headers.set("Access-Control-Max-Age", "86400");
  }
  return headers;
}
