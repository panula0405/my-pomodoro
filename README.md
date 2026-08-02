# My Pomodoro

A React + FastAPI Pomodoro planner with SQLite persistence and an
OpenAI-compatible AI planner.

## Local development

The defaults work with:

- React at `http://localhost:5173` or `http://localhost:5174`
- FastAPI at `http://localhost:3000`
- LM Studio at `http://127.0.0.1:1234/v1`
- The `google/gemma-4-e4b` model loaded in LM Studio

Optional local environment files can be created from the examples:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

Start the backend:

```bash
cd server
source .venv/bin/activate
uvicorn app.main:app --reload --port 3000
```

Start the frontend in another terminal:

```bash
npm run dev
```

## Deployment configuration

Set this when building the React frontend:

```env
VITE_API_URL=https://your-api.example.com
```

Set these on the FastAPI host:

```env
AI_BASE_URL=https://your-openai-compatible-provider.example.com/v1
AI_API_KEY=your-secret-key
AI_MODEL=your-provider-model-id
CORS_ORIGINS=https://your-frontend.example.com
```

Multiple allowed frontend origins must be comma-separated. Never commit real
API keys or `.env` files. Example environment files are safe to commit.

SQLite is suitable for local development and a single persistent server. A
platform with an ephemeral filesystem requires persistent storage or a hosted
database such as PostgreSQL.
