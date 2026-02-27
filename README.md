# HomeSync

Household planning app — shared task calendar with AI-assisted scheduling.

## Stack

| Layer    | Tech                                |
|----------|-------------------------------------|
| Backend  | Python 3.13 + FastAPI, managed with `uv` |
| Frontend | React 19 + TypeScript + Vite, managed with `pnpm` |
| Database | Supabase (Postgres + Auth)          |
| Auth     | Supabase JWT (validated server-side via `python-jose`) |

## Project Structure

```
homesync/
├── backend/          # FastAPI app
├── frontend/         # React/Vite app
├── supabase/
│   └── schema.sql    # Apply to Supabase SQL editor
└── tasks/            # Project planning docs
```

## Getting Started

### 1. Apply the database schema

Paste `supabase/schema.sql` into your Supabase project's SQL editor and run it.

### 2. Backend

```bash
cd backend
cp .env .env   # fill in your Supabase credentials
uv run uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### 3. Frontend

```bash
cd frontend
cp .env .env   # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
pnpm dev
# → http://localhost:5173
```

## API Routes (Phase 1)

| Method | Path                         | Description                        |
|--------|------------------------------|------------------------------------|
| GET    | /health                      | Liveness check                     |
| POST   | /households                  | Create household                   |
| GET    | /households/{id}             | Get household + members            |
| POST   | /households/{id}/members     | Add member by user_id              |
| GET    | /households/{id}/tasks       | List tasks (optional ?week_start=) |
| POST   | /households/{id}/tasks       | Create task                        |
| PATCH  | /tasks/{id}                  | Update state / assignment          |

All routes except `/health` require `Authorization: Bearer <supabase-jwt>`.

## Roadmap

- **Phase 1** (now): Foundation — auth, households, tasks CRUD
- **Phase 2**: Planning loop UI — weekly calendar grid, drag & drop
- **Phase 3**: AI recommendation engine
- **Phase 4**: Meals & shopping integration
