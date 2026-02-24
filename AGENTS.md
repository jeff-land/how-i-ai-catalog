# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

This is a Next.js web application ("How I AI — AI Use Case Catalog") with a Python data pipeline. The web app lives in `app/` and data scripts in `scripts/`. There is no database — all data is JSON files on disk.

### Running the web app

- `cd app && npm run dev` starts the dev server on `http://localhost:3000`
- Standard scripts: `npm run lint`, `npm run build`, `npm run start` (see `app/package.json`)

### Data files

- `data/episodes.json`, `data/episodes-analyzed.json`, `data/use-cases.json` are the source data
- `app/data/` is the copy used by Next.js at runtime (created by `scripts/sync_data_to_app.sh`)
- If data files are empty (`[]`), the app still works but shows zero content
- To generate sample data: `python3 scripts/generate_sample_analysis.py && bash scripts/sync_data_to_app.sh`
- For real data, run the collect/analyze pipeline (requires `ANTHROPIC_API_KEY` for analysis)

### Non-obvious caveats

- Use `python3` not `python` — the environment does not have a `python` symlink
- The `/use-cases` route intentionally redirects to `/` (this is by design, not a bug)
- After changing data in `data/`, you must run `bash scripts/sync_data_to_app.sh` to copy it to `app/data/`; the Next.js app reads from `app/data/`, not the root `data/` directory
- Python packages install to `~/.local` (user install); `~/.local/bin` may not be on PATH for CLI tools like `yt-dlp`
