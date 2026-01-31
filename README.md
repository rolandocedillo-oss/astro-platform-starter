# Astro on Netlify Platform Starter

[Live Demo](https://astro-platform-starter.netlify.app/)

A modern starter based on Astro.js, Tailwind, and [Netlify Core Primitives](https://docs.netlify.com/core/overview/#develop) (Edge Functions, Image CDN, Blobs).

## Astro Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Deploying to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify-templates/astro-platform-starter)

## Developing Locally

| Prerequisites                                                                |
| :--------------------------------------------------------------------------- |
| [Node.js](https://nodejs.org/) v18.20.8+.                                    |
| (optional) [nvm](https://github.com/nvm-sh/nvm) for Node version management. |

1. Clone this repository, then run `npm install` in its root directory.

2. Recommended: link your local repository to a Netlify project. This will ensure you're using the same runtime version for both local development and your deployed project.

```
netlify link
```

3. Run the Astro.js development server:

```
npm run dev
```

### Netlify Dev (optional)

If you need to test Netlify-only features like Edge Functions locally, use:
```
npx netlify dev
```

The edge rewrite is controlled by `ENABLE_EDGE_REWRITE`:
- `false` (default) keeps it off for normal dev.
- `true` enables the edge rewrite in Netlify dev and on deploy.

## Environment Variables

This project uses a mix of server-only and public environment variables.

- Server-only (never expose to client):
  - `MY_SERVICE_API_KEY`
  - `GOOGLE_TTS_API_KEY`
- Public (safe for client, must be prefixed with `PUBLIC_`):
  - `PUBLIC_FIREBASE_API_KEY`
- Feature flags:
  - `ENABLE_EDGE_REWRITE` (set to `true` to enable the Netlify edge rewrite)

Set values in `.env` (do not commit), and keep `.env.example` updated for reference.

## Audio Clip Generation (Loteria)

Audio clips are generated locally using Piper + ffmpeg.

Prereqs:
- Python 3.10+
- ffmpeg installed

Recommended workflow:
```
python -m venv .venv-piper
source .venv-piper/bin/activate
python -m pip install -U pip
python -m pip install piper-onnx
```

Generate audio clips (mp3 or wav) with:
```
python scripts/generate-loteria-audio.py --help
```

The generated files should land in `public/audio/loteria/` and follow `01.mp3` ... `54.mp3`.
