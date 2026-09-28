// usage: DeepL character usage for the current billing period.
// Output: { character_count, character_limit }
import { deepl } from "../_shared/deepl.ts";
import { createHandler } from "../_shared/http.ts";

interface DeepLUsage {
  character_count: number;
  character_limit: number;
}

Deno.serve(
  createHandler(
    { name: "usage", methods: ["GET", "POST"], limits: [{ requests: 30, windowMs: 60_000 }] },
    async () => {
      const { character_count, character_limit } = await deepl<DeepLUsage>("/v2/usage");
      return { character_count, character_limit };
    },
  ),
);
