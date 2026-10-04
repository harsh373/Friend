# Horizon: Look Back. See Forward.

A personal journal with an intelligence layer. Horizon keeps the familiar journaling experience and adds a way to understand your own writing over time: ask questions, see what keeps coming back, track what you said you'd do, and read an evidence-backed reflection on your week.

Built for the **Hacktoberfest Weekend Challenge: Build for a Friend**. The friend is me. This grew out of a private journal I built for myself, and I wanted it to remember what I'd forgotten.

## Try it

**Live demo:** https://horizon-theta-vert.vercel.app

**Demo password: `hackmyfriend@7007`**

The demo is already seeded with five weeks of fictional journal entries written for this challenge. It runs against a separate database from my own journal, and none of my private writing is in it.

A quick tour:
1. Open **Insights** and ask *"What have I been avoiding?"*, then click any date chip to open the entry behind the answer.
2. Open **Memory** to see how often the event-discovery idea came back.
3. Open **Open Loops** to see what the writer said they'd do and never finished.
4. Open **Weekly**, scroll to **Your Week**, write a reflection, and compare an earlier week with the latest one.

## Features

| Feature | What it does |
| --- | --- |
| **Ask My Journal** | Ask a question and get an answer grounded in the most relevant entries, with the supporting dates, a label for how strong the evidence is, and a clear "not enough evidence" when the journal doesn't answer. |
| **Memory** | Recurring ideas, projects, people, goals and interests, with mention counts, first and last mention, and the quotes behind them. |
| **Open Loops** | Unfinished intentions found in your writing. You can mark one resolved, dismiss it, or reopen it. A later entry that says it was done can also mark it finished. Nothing is ever deleted. |
| **Weekly Reflection** | On the existing Weekly page, split into what was **observed** (days written, topics on more than one day, things finished, loops still open) and a model-written **reflection** with linked entries. |

The rest of the journal (daily entries, mood, photos, tracks, side quests, weekly planner, calendar) works as before. Insights sits on top and the journal stays the main experience.

## How it works

```text
Journal entry
     ↓
One model call extracts topics, intentions, completions  +  an embedding is stored
     ↓
MongoDB Atlas (entries, embeddings, memories, open loops, weekly reflections)

Question → embedding → similarity search over stored entry embeddings (server code)
     ↓
Only the closest entries are sent to the model
     ↓
Answer + links to the original entries
```

Analysis is triggered once when you press **Done** on a day, and only if the text changed since the last analysis (a content hash is compared). Saving the entry never waits on the AI, so journaling stays fast if the provider is slow.

### Keeping the AI honest

The checks are in code, not just in the prompt:

- Every extracted topic or intention must include a quote that appears word for word in the entry, otherwise it is dropped.
- Intentions below a confidence threshold are dropped.
- Source entries come from the database. The model only picks entry numbers, and the server maps them back to real dates.
- Observations with no valid source are discarded. Evidence strength (limited, moderate, strong) is computed from how many entries support a claim, never taken from the model.
- A weekly pattern needs at least two entries behind it, and a week needs entries on at least two days before a reflection can be written.
- When the entries don't support an answer, Horizon says so.
- The model is told never to diagnose or comment on mental health, only to describe what is written.

### Models

| Job | Model | Served through |
| --- | --- | --- |
| Reading entries, answering questions, weekly reflection | `openai/gpt-oss-20b` (open-weight) | Groq |
| Embeddings | `BAAI/bge-small-en-v1.5` (open-weight) | Hugging Face Inference |

Both are hosted, because the development laptop can't practically run a large language model. The app talks to a small provider interface (`backend/ai/provider.ts`), and the model name, endpoint and API key are environment variables, so switching to another model or host is a configuration change. The retrieval, memory and evidence layers don't depend on a specific model.

**Privacy trade-off:** inference is hosted, so the entries selected for a task (one entry for analysis, a handful for a question or a reflection) are sent to the inference provider. The whole journal is never sent. A fully private setup needs a self-hosted model, which this architecture allows but doesn't ship.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Mongoose
- **Database:** MongoDB Atlas
- **Images:** Cloudinary
- **AI:** open-weight models over a standard chat-completions API, behind a provider interface

## Project structure

```text
backend/
  ai/            provider interface, hosted provider, extraction, retrieval, ask, weekly
  config/        env, database, Cloudinary
  controller/    request handlers
  models/        Mongoose models (journal entries, memories, open loops, weekly reflections, ...)
  routes/        Express routes
  scripts/       testAI.ts, backfill.ts, seedDemo.ts
  utility/       auth, sessions, validation
frontend/
  src/
    api/         API client
    components/  UI, including components/insights/
    pages/       Journal, Weekly, Insights, Memory, Open Loops, ...
```

## Run it locally

You need Node.js, a MongoDB database (Atlas free tier works), a Cloudinary account, a Groq API key and a Hugging Face token. The Hugging Face token must be a fine-grained token with permission to call Inference Providers.

**1. Install dependencies.** This downloads the packages each half of the app needs.
```bash
cd backend && npm install
cd ../frontend && npm install
```

**2. Configure the backend.** Copy `backend/.env.example` to `backend/.env` and fill in the values (see the table below).
```bash
cp backend/.env.example backend/.env
```

**3. Check that your AI keys work.** This sends one test message to the chat model and one test sentence to the embedding model, and prints only `"ok":true` and the embedding length (384). It never prints journal text.
```bash
cd backend && npx tsx scripts/testAI.ts
```

**4. Start the backend and the frontend** in two terminals.
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

The frontend's `VITE_API_URL` (in `frontend/.env`) should point at the backend, for example `http://localhost:4000`.

### Environment variables (backend)

| Variable | Purpose |
| --- | --- |
| `PORT`, `CLIENT_ORIGIN` | Server port and the frontend origin allowed by CORS |
| `JOURNAL_PASSWORD` | The password that unlocks the journal (at least 8 characters) |
| `SESSION_SECRET` | Secret for signing the session cookie (at least 32 characters) |
| `MONGODB_URI` | MongoDB connection string. The database name goes before the `?`, for example `.../journal?...` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Photo storage |
| `AI_API_KEY`, `AI_BASE_URL` | Chat model key and endpoint (any chat-completions-compatible host) |
| `AI_FAST_MODEL`, `AI_SMART_MODEL` | Model names. Both are `openai/gpt-oss-20b` in this build |
| `AI_REASONING_EFFORT` | Optional. `low` keeps analysis quick |
| `EMBEDDING_API_KEY`, `EMBEDDING_URL` | Embedding provider token and endpoint |

The AI settings are optional. Without them the journal works exactly as before and Insights reports that AI isn't configured.

## Scripts

All scripts run from the `backend` folder with `npx tsx`.

- `scripts/testAI.ts`: checks the chat and embedding connections.
- `scripts/backfill.ts`: analyzes every existing entry once, oldest first, with a pause between calls to respect rate limits. Entries whose text hasn't changed are skipped, so it is safe to run twice.
- `scripts/seedDemo.ts`: wipes the entries, memories and open loops in a **demo** database and fills it with the fictional five weeks, then analyzes them. It refuses to run unless the connected database name contains "demo", so it cannot clear a real journal by accident. `--analyze-only` retries analysis without re-inserting.

## Running your own demo

Deploy a second copy of the app with its own `MONGODB_URI` pointing at a database whose name contains `demo`, set a demo password in `JOURNAL_PASSWORD`, then run `npx tsx scripts/seedDemo.ts` once against it. Two separate deployments with separate databases means the demo can never reach a private journal.

## Privacy and security

- Single-owner journal: one password, checked server-side, with a signed, httpOnly session cookie. There is no signup and no user management.
- Every `/api` route sits behind the auth middleware. AI routes have rate limits.
- Prompts and model replies are never logged. Errors log only a status or message.
- Only the text needed for a task is sent to the model. Photos and locations are not.
- Secrets live in environment variables and `.env` is git-ignored.

## Limitations and next steps

- Similarity search compares stored vectors in server code, which is fine at journal scale. Atlas Vector Search is the natural upgrade for much larger journals.
- A model-written reflection is an interpretation. The UI labels it and links the entries so you can check it.
- Not built yet: a **Then vs Now** comparison between two periods, voice journaling, and a self-hosted model option.

## License

MIT. See the [LICENSE](LICENSE) file.