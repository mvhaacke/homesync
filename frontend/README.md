# HomeSync Frontend

React 19 + TypeScript + Vite. See the [root README](../README.md) for setup instructions.

## Dev

```bash
pnpm install
pnpm dev       # → http://localhost:5173
pnpm build     # production build
```

## Env vars

| Variable               | Description                          |
|------------------------|--------------------------------------|
| `VITE_SUPABASE_URL`    | Your Supabase project URL            |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key         |

## Deploy

Connect to Vercel, set the root directory to `frontend/`, add the two env vars. The `vercel.json` handles SPA routing.
