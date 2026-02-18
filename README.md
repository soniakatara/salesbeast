# Sales Coach MVP

Next.js (TypeScript) app with API routes backend, Prisma + SQLite, auth, roleplay and rate-my-conversation modes.

## Exact commands (run locally)

```bash
npm install
cp .env.example .env
npx prisma generate
npm run db:reset
npm run dev
```

Set `AUTH_SECRET` (and `NEXTAUTH_URL` if needed) in `.env`. Open [http://localhost:3000](http://localhost:3000).

Other commands:

```bash
npm run lint     # ESLint
npm run build    # production build
npm run start    # run production server (after build)
```

## 60-second demo script

1. **0:00** Open [http://localhost:3000](http://localhost:3000). Click **Sign in**.
2. **0:05** Sign in as `demo@example.com` / `demo1234` (or register; new users get default playbooks).
3. **0:15** From the dashboard, click **Roleplay**. Pick a scenario → **Start roleplay**.
4. **0:25** Send a message (e.g. “Hi, I’m reaching out about your current process”). See coach reply and the **Suggested next message** / **One thing to fix** / **Drill** panel.
5. **0:40** Click **Rate my conversation**. Paste a short transcript (or use a sample), click **Rate conversation**. Skim scores and **View in history**.
6. **0:55** Click **Insights** to see average score and top weaknesses (or **History** to open a session).

End: you’ve shown auth, roleplay, rate, and insights in under a minute.

## Demo flow (detailed)

1. **Reset DB and seed (optional):** `npm run db:reset` — applies migrations and seeds scenario presets + demo user (`demo@example.com` / `demo1234`) with 2 playbooks.
2. **Sign in:** Go to [http://localhost:3000](http://localhost:3000) → **Sign in**. Use the demo account or register a new one (new users get 2 default playbooks).
3. **Dashboard:** From the dashboard, open **Roleplay**, **Rate my conversation**, **Playbooks**, **History**, or **Insights**.
4. **Roleplay:** Pick a scenario (or enter a custom one) → **Start roleplay** → send messages (min 2 characters). Coach replies use mock logic and phase tips. Use **New roleplay** to start over; **History** to see past sessions.
5. **Rate:** Paste a transcript (200+ chars recommended; shorter shows a warning but you can still submit) → **Rate conversation** → review scores, strengths, improvements, drills, and **View in history**.
6. **Playbooks:** List, create, edit, delete. Roleplay uses your playbooks for snippet context.
7. **History:** List sessions; open one to see messages and, for rate sessions, full feedback.
8. **Insights:** View average score, top weaknesses, and last 5 rated sessions (from last 20 feedbacks).

## Env

- `DATABASE_URL` – SQLite path (default `file:./dev.db` in prisma/)
- `AUTH_SECRET` – required for NextAuth v5 (e.g. `openssl rand -base64 32`)
- `NEXTAUTH_URL` – app URL (e.g. `http://localhost:3000`)
- `OPENAI_API_KEY` – optional; set to enable **AI mode** for coach and rate (see below).
- `OPENAI_MODEL` – optional; model for OpenAI calls (default: `gpt-4o-mini`).

## Optional: OpenAI (AI mode)

- **Roleplay:** On the roleplay page, use the **Coach** dropdown and choose **AI**. The coach will call OpenAI to generate replies, suggested next message, one thing to fix, drill, and phase rationale. If `OPENAI_API_KEY` is not set or the API errors, the app falls back to mock coaching and shows: *"AI unavailable; used mock coaching."*
- **Rate:** On the Rate my conversation page, set **Mode** to **AI**. The rating (scores, summary, actions, weaknesses, strengths, suggested rewrite, drill) will use OpenAI when the key is set. Same fallback: if the key is missing or the request fails, mock evaluation is used and you’ll see *"AI unavailable; used mock coaching."*
- **Demos:** With no key or with key set, demos work: Mock is always available and is the default; AI is optional and safely falls back to mock.

## Professor-friendly notes: Frontend vs Backend

- **Backend (this app):** Everything that runs only on the server: Prisma (DB access), Next.js API routes under `src/app/api/`, server-side auth checks (`getServerSession`), and the coach logic in `lib/coach.ts` (including calls to OpenAI). API routes are the "backend"; they do not ship as client JS.
- **Frontend:** Everything that runs in the browser: React components under `src/app/**/page.tsx` and `src/components/`, client-side routing (Next.js App Router), forms, `fetch()` calls to `/api/`, and local state (`useState`, `useEffect`). The frontend is the UI and the code that invokes the backend APIs.
- **Boundary:** The "contract" between frontend and backend is the set of API routes and their request/response shapes. The frontend never touches the database or env secrets; the backend never renders React.
