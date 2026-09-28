# Readler

*Leia, traduza, aprenda.*

A personal translator for studying French, German and English from Brazilian Portuguese. It translates with DeepL and, under every short translation, shows **Exemplo e contexto**: two natural example sentences, grammar notes when they matter (gender, plural, separable or irregular verbs), and a short context note written by Claude. Tap any word in a translation to see it on its own and save it to your vocabulary. Export the vocabulary to Anki.

Single user by design: no accounts and no database. History and vocabulary live in your browser (localStorage). The DeepL and Anthropic keys stay on the server, inside Supabase Edge Functions.

## Stack

- React 19, Vite 8, TypeScript, Tailwind CSS 4 (theme tokens as CSS variables), lucide-react icons
- Inter and Newsreader, bundled with the app (no external font requests, works offline)
- Supabase Edge Functions (Deno) as thin proxies: `translate` and `usage` (DeepL API), `explain` (Anthropic Messages API, `claude-haiku-4-5-20251001`)
- Installable PWA: `public/manifest.webmanifest` and a small service worker (`public/sw.js`)

## Project structure

```
index.html                  meta tags + inline script that applies the theme before first paint
public/                     manifest, service worker, favicon and app icons
src/
  components/               UI: top bar, language dropdown, segmented controls, buttons…
    translator/             translator card: panels, swap button, tappable words, word popover
    explain/                "Exemplo e contexto"
  hooks/                    useTranslation, useExplain, useSpeech, useTheme, useLocalStorage,
                            useHistory, useVocabulary, useUsage, useHashRoute, useTranslator
  lib/                      typed API client, languages, caches, CSV export, formatting
  pages/                    Traduzir, Vocabulário, Histórico
  index.css                 design tokens (light and dark) and base styles
supabase/
  config.toml               function settings (JWT verification off, see below)
  functions/
    _shared/                CORS allowlist, per-IP rate limits, DeepL client, errors
    translate/  usage/  explain/
                            each with index.ts and its own deno.json (pinned dependencies)
```

## 1. Create the Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. Install the Supabase CLI (`brew install supabase/tap/supabase`, or use `npx supabase` in place of `supabase` below).
3. Log in and link this folder to the project. The project ref is the `xxxx` in `https://xxxx.supabase.co`.

```bash
supabase login
supabase link --project-ref your-project-ref
```

## 2. Set the secrets

The functions read three secrets. They are never sent to the browser and must never be committed.

```bash
supabase secrets set \
  DEEPL_API_KEY="your-deepl-key:fx" \
  ANTHROPIC_API_KEY="sk-ant-..." \
  ALLOWED_ORIGIN="https://readler.example.com"
```

| Secret | What it is |
| --- | --- |
| `DEEPL_API_KEY` | DeepL API key, from [deepl.com/your-account/keys](https://www.deepl.com/your-account/keys). Free keys end in `:fx` and use `api-free.deepl.com`; a Pro key is detected and sent to `api.deepl.com`. |
| `ANTHROPIC_API_KEY` | Anthropic API key, from [console.anthropic.com](https://console.anthropic.com). Set a monthly spend limit in the console as well. |
| `ALLOWED_ORIGIN` | Origin of your deployed frontend: scheme and host, no path, no trailing slash (for example `https://readler.vercel.app`). Separate several with commas. `http://localhost` and `127.0.0.1` on any port are always allowed. |

## 3. Deploy the Edge Functions

```bash
supabase functions deploy translate
supabase functions deploy usage
supabase functions deploy explain
```

`supabase/config.toml` turns off Supabase's JWT check for these three functions. They have no user to authenticate, they do their own gatekeeping (see [Protections](#protections-and-limits)), and it keeps them working with the newer `sb_publishable_…` keys, which are not JWTs. If you deploy without the config file, add `--no-verify-jwt`.

Quick test (the function only answers allowed origins, so send one):

```bash
curl -X POST "https://your-project-ref.supabase.co/functions/v1/translate" \
  -H "Origin: http://localhost:5173" -H "Content-Type: application/json" \
  -d '{"text":"A ponte é muito bonita.","source_lang":null,"target_lang":"FR","formality":"prefer_more"}'
```

Function contracts:

| Function | Input | Output |
| --- | --- | --- |
| `translate` (POST) | `{ text, source_lang, target_lang, formality }`. `source_lang` is `null` to detect; `formality` is `prefer_more` or `prefer_less` and applies to FR and DE | `{ translation, detected_source_lang }` |
| `usage` (GET) | none | `{ character_count, character_limit }` |
| `explain` (POST) | `{ text, translation, source_lang, target_lang }` | `{ kind, grammar, examples: [{ target, pt }], context }` |

Errors always come back as `{ error: { code, message } }`, with `message` in Portuguese and ready to show.

## 4. Run locally

```bash
cp .env.example .env    # then fill in the two values
npm install
npm run dev             # http://localhost:5173
```

`.env` needs the project URL and the public key from **Project Settings → API**. Either the legacy `anon` key or a publishable key works:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

The local app talks to the deployed functions, since localhost is always allowed. To run the functions on your machine instead (Docker required), put the three secrets in `supabase/functions/.env`, run `supabase start` and `supabase functions serve --env-file supabase/functions/.env`, and point `VITE_SUPABASE_URL` at `http://127.0.0.1:54321`.

Other scripts: `npm run build` (type-check and production build into `dist/`), `npm run preview` (serve the build, with the service worker), `npm run lint` (oxlint).

## 5. Deploy the frontend

The build is static (`npm run build` produces `dist/`). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables on the host, because Vite embeds them at build time. After the first deploy, make sure `ALLOWED_ORIGIN` matches the site's origin.

Routes are hash-based (`#/vocabulario`) and asset paths are relative, so no rewrite rules are needed on any host.

**Vercel.** Import the repository, keep the detected Vite settings (build `npm run build`, output `dist`), add the two environment variables and deploy.

**Netlify.** New site from Git, build command `npm run build`, publish directory `dist`, add the two environment variables and deploy.

**GitHub Pages.** Add the two values as repository secrets and use a workflow like this one (`.github/workflows/deploy.yml`), then choose **Settings → Pages → Source: GitHub Actions**:

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

On GitHub Pages the origin is `https://your-user.github.io`, without the repository path. That value is what goes in `ALLOWED_ORIGIN`.

## Protections and limits

With no login, the functions protect the quotas themselves:

- **Origin allowlist.** Requests from origins other than `ALLOWED_ORIGIN` and localhost get `403`, and CORS headers are only sent to allowed origins.
- **Input caps.** `translate` accepts up to 5,000 characters. `explain` accepts 5,000 characters of text and 10,000 of translation. Request bodies are capped at 64 KB.
- **Per-IP rate limits.**
  - `translate`: 60 requests per minute and 60,000 characters per hour.
  - `explain`: 15 requests per minute and 200 per hour.
  - `usage`: 30 requests per minute.

  The values are constants at the top of each function and in `_shared/http.ts`. The counters live in memory, one set per function instance, so they are a best-effort brake, not a global quota.

These measures stop casual abuse, not a determined attacker: outside a browser, the `Origin` header can be forged. As a backstop, the DeepL Free plan stops at 500,000 characters a month instead of charging overage, and the Anthropic console lets you set a hard spend limit.

## How it behaves

- **Exemplo e contexto** appears on its own for short texts (up to about 80 characters or 10 words), after a short pause so words typed in passing aren't looked up. Longer texts show a **Gerar exemplo e contexto** button instead. Results are cached in `readler:explain-cache` by text, language pair and translation, so the same lookup is never paid for twice.
- The examples are always in the language you are studying, which is the side of the pair that isn't Portuguese. Translating FR → PT still gives French examples with Portuguese underneath.
- **Tapping a word** shows its translation into Portuguese. When the translation is itself in Portuguese, it shows the word in the source language instead.
- If the detected language is already the target language, Readler switches the target automatically, as DeepL does (French text with target French switches to Portuguese). A target you pick by hand is kept until you edit the text.
- **History** keeps one entry per piece of text you work on, not one per keystroke, and keeps the last 100 (favorites are dropped last). Reopening an entry reuses the stored translation and costs no DeepL characters.
- **Listen** uses the browser's speech synthesis with an fr-FR, de-DE, en-US/en-GB or pt-BR voice, plus a slower option on the translation. Voice quality depends on the voices installed on your device.
- **Shortcut:** Ctrl/Cmd + Enter translates immediately.

## Your data

Everything is stored in this browser's localStorage, under these keys:

| Key | Contents |
| --- | --- |
| `readler:theme` | Theme choice |
| `readler:languages` | Last language pair |
| `readler:formality` | Formality choice |
| `readler:history` | Translation history |
| `readler:vocabulary` | Saved vocabulary |
| `readler:explain-cache` | Cached explanations |

Clearing site data erases all of it, and nothing syncs between devices. Export your vocabulary now and then.

## Anki import

**Vocabulário → Exportar CSV** downloads `readler-vocabulario.csv`, with the current search and language filter applied. Each line is one note, `front;back`:

- **Front:** the word or phrase in the language you study.
- **Back:** its translation, plus the saved example sentence if there is one.

In Anki, choose **File → Import** and pick the file. Anki 2.1.55 or later reads the header and sets the separator (semicolon) and HTML automatically. On older versions, choose semicolon as the separator and enable **Allow HTML in fields**.

## Troubleshooting

- **"Sem conexão com o servidor"** in the app: check `VITE_SUPABASE_URL`, that the functions are deployed, and that `ALLOWED_ORIGIN` matches the site's origin exactly (scheme, host and port). Browsers hide the response when CORS rejects a request, so a wrong origin looks like a network error.
- **`401 Invalid JWT`**: the function was deployed with JWT verification on. Redeploy with `config.toml` in place, or with `--no-verify-jwt`.
- **"A chave do DeepL foi recusada"** or **"A chave da Anthropic foi recusada"**: check the secret with `supabase secrets list` and set it again.
- **Function logs:** Supabase dashboard → Edge Functions → select the function → Logs.
