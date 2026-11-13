# Quizzify — viva preparation

Everything below is grounded in the code in this repository, not generic MERN notes. Numbers (limits,
test names, defaults) are the values actually in the source, so you can quote them confidently.

How to use this: read Part 1 for the story, Part 2–6 for the technical questions, Part 7 for traps, and
Part 8 the night before. If an examiner asks something you did not build, say what you would do and why —
that reads as judgement, not as a gap.

---

## Part 1 — The 90-second project pitch

> Quizzify is a full-stack quiz platform. Anyone can browse and play timed quizzes, get a per-question
> review with explanations, and track progress on a dashboard and leaderboard. Admins — and quiz owners —
> author quizzes through a form-driven editor.
>
> It's a MERN app: React 18 + Vite + Tailwind on the front end, an Express REST API with Socket.IO for
> notifications on the back end, and MongoDB with Mongoose for storage. Auth is JWT with bcrypt hashing and
> role-based access control. The API is graded server-side — the browser only sends which option the player
> picked, never a score.
>
> It ships as a single production container: nginx serves the built SPA and proxies `/api` and `/socket.io`
> to the Express process beside it, so there is one origin, no CORS in production, and the same Docker image
> runs locally, in CI and on a host. 23 API integration tests cover auth, RBAC, scoring and leaderboards.

Three sentences you must be able to say without hesitating:
1. **Where the score is computed** — server, from `correctIndex` in the database.
2. **How a request is authorised** — bearer JWT → `protect` middleware → `req.user` → `authorize()` / ownership check.
3. **Why the correct answers never leak** — `toPublicJSON({ includeAnswers })` decides per caller.

---

## Part 2 — Architecture

**Q: Walk me through a request from click to database.**
Browser calls `GET /api/quizzes?search=react` with `baseURL: '/api'` → nginx (or Vite's dev proxy) forwards
to Express → global rate limiter (300 req/min) → router → `validate(listQuizzesSchema, 'query')` parses and
coerces the query string → `listQuizzes` builds a Mongo filter, runs `find` + `countDocuments` in parallel →
`quiz.toPublicJSON()` shapes the response → `{ success, data: { quizzes, page, limit, total, pages } }` → React
`useApi` stores it in state → the grid renders.

**Q: Why this folder structure?**
`routes/` declare URLs and middleware, `controllers/` hold the logic, `models/` own schema and data rules,
`validators/` hold Zod schemas, `middleware/` holds cross-cutting concerns (auth, validation, errors),
`services/` holds reusable side effects (`notify`), `utils/` holds `ApiError`, `token`, `asyncHandler`.
A route file is therefore a readable table of endpoints; you can find any endpoint's permissions in one glance.

**Q: Where does business logic live, and why not in the model?**
Rules that need a request (who may edit this quiz, what a leaderboard ranks) live in controllers. Rules that
belong to the data itself (password hashing, option count, index range, the shape sent to clients) live in
Mongoose schemas and methods. That split means validation holds even if a future script writes directly.

**Q: Monolith or microservices — and why?**
A single deployable with clear internal layers. One team, one database, heavy shared logic between HTTP and
Socket.IO (both need the same `User` lookup) — microservices would add network failure modes and deployment
work for no scale benefit here. The boundaries are already drawn so the notifications service *could* be
split out later.

**Q: Is it a SPA? How do deep links work?**
Yes — one `index.html`, React Router owns the URLs. The server's `notFound` middleware would 404 `/quizzes`,
so both the dev setup (Vite's history fallback) and production nginx (`try_files $uri $uri/ /index.html`)
rewrite unknown paths to the SPA. That is why a hard refresh on `/dashboard` works.

**Q: What runs on the client vs the server, and why?**
Client: rendering, routing, form UX, timers (display only), optimistic UI. Server: identity, permissions,
grading, persistence, notifications. Anything a user could cheat by editing DevTools — score, correct answer,
role, ownership — is server-side only.

---

## Part 3 — Authentication and security

**Q: Explain the JWT flow end to end.**
`POST /api/auth/register` or `/login` → bcrypt-compare → `signToken(user)` creates
`jwt.sign({ sub, role, tv }, JWT_SECRET, { expiresIn: '7d' })` → client stores it under `quizzify_token` and
an axios interceptor attaches `Authorization: Bearer <token>` to every request → `protect` extracts it,
`jwt.verify`, loads the user, compares `tv` against the user's `tokenVersion`, and sets `req.user`.

**Q: Why include `role` in the token if you load the user anyway?**
Convenience and defence in depth: `req.user.role` comes from the database record, so a role change takes
effect immediately; the claim is a cross-check, not the source of truth. The same payload is used by the
Socket.IO handshake.

**Q: How does logout work when JWTs are stateless?**
Logout is not "delete the token on the server" — that is impossible with a bearer token. `POST /api/auth/logout`
increments `tokenVersion` (`$inc`), and every request compares the token's `tv` claim with the stored value.
Old tokens now fail with "Session expired". Trade-off: it revokes *all* sessions for that user, which is
acceptable (and arguably desirable) for this app. The alternative — a blacklist — needs storage and TTL
cleanup, and an in-memory blacklist breaks with more than one process.

**Q: Why bcrypt and not SHA-256?**
SHA is fast by design, which is exactly wrong for passwords — GPUs try billions per second. bcrypt is
deliberately slow, salts every hash automatically and has a cost factor (10 here) you can raise as hardware
improves. `password` is also `select: false`, so it never loads unless explicitly asked for, and `toJSON`
deletes it as a second barrier.

**Q: What is the difference between 401 and 403 in your code?**
401 = "I don't know who you are" (`ApiError.unauthorized`): missing/invalid/expired token, wrong credentials.
403 = "I know who you are, you still can't" (`ApiError.forbidden`): a normal user calling `POST /api/quizzes`,
or editing a quiz they did not create.

**Q: How is role-based access enforced?**
Three layers: the route (`router.use(protect, authorize('admin'))` for all of `/api/admin`), the handler
(`updateQuiz`/`deleteQuiz` allow admin *or* owner), and the payload (`toPublicJSON` strips answers unless
`canManage`). Tested: `non-admins cannot create quizzes`.

**Q: What stops someone from submitting a fake score?**
The request body has no score field. `submitAttempt` accepts `answers: [{ questionId, selectedIndex, timeMs }]`
and `durationMs`, then recomputes correctness, count, points and percentage from the quiz document.
`submitAttemptSchema` rejects anything else. `durationMs` is recorded but never used to rank, so it cannot be
inflated for advantage.

**Q: What about someone reading the answers from the network tab?**
`GET /api/quizzes/:id` uses `optionalAuth` and passes `includeAnswers: canManage(user, quiz)` — false for
players, true for the owner/admin. The public listing never includes questions at all
(`includeQuestions: false`). Correct answers only come back *after* grading, inside the review payload.

**Q: Name the other hardening measures and why each exists.**
`helmet` (security headers, hides `x-powered-by`), CORS allow-list from `CLIENT_URL` in production only,
`express.json({ limit: '1mb' })` (payload-flood protection), global 300/min limiter, a stricter 40 requests
per 15 minutes on login/register (brute force), Zod validation on every write, `trust proxy` set so rate
limiting sees real client IPs behind a proxy, and a central error handler that hides stack traces when
`NODE_ENV=production`.

**Q: XSS and CSRF — how does this app fare?**
React escapes interpolated values, so stored XSS through quiz titles is not possible by default (no
`dangerouslySetInnerHTML` anywhere). CSRF is largely moot because the token lives in a header, not a cookie —
a cross-site form post cannot attach it. The real residual risk is that `localStorage` is readable by any
script that *does* get injected; HttpOnly cookies would remove that, at the cost of CSRF tokens.

**Q: Why is the token in localStorage instead of an HttpOnly cookie?**
Simplicity and a clean cross-origin story for the API; the trade-off is XSS exposure. With cookies I would
need `SameSite`, CSRF tokens, and cookie-domain configuration between two hosts.

**Q: What's missing from auth that a real product needs?**
Email verification, password reset, refresh tokens with rotation, account lockout after repeated failures,
and per-user (not per-IP) rate limiting. They were left out deliberately to keep scope focused; the schema
already has `tokenVersion`, which is the hook a refresh-token scheme would use.

---

## Part 4 — Database and data modelling

**Q: Draw the schema.**
```
User 1 ──* Quiz        (createdBy)
User 1 ──* Attempt     (user)
Quiz 1 ──* Attempt     (quiz, cascade-deleted with the quiz)
User 1 ──* Notification
Quiz 1 ──* Question    (embedded, own _id, 1–50 per quiz)
```

**Q: Why are questions embedded instead of a separate collection?**
They are always read with their quiz and never queried alone; the whole quiz is one document, so playing a
quiz is a single read with no join. A separate collection would add a `$lookup` to every play for no benefit.
The 16 MB document limit is not a concern: 50 questions × 6 options is a few KB. Answers inside an attempt
*are* embedded for the same reason — an attempt is a snapshot and must not change when the quiz is edited later.

**Q: When would you split questions out?**
If questions were shared across quizzes (a question bank), searched globally, or edited by different people
concurrently. Then a `Question` collection with references and a join would be correct.

**Q: Explain the indexes and which query each serves.**
- `User.email` unique — login lookup and duplicate prevention (also the source of the 11000 → 409 path).
- `Quiz.createdBy` — "my quizzes" and ownership checks.
- `Quiz { isPublished, category, difficulty, createdAt: -1 }` — the browse page's exact filter + sort.
- `Quiz` text index on title/description — available for `$text` search (the implemented search uses an
  escaped regex for partial matches).
- `Attempt { quiz, percentage: -1, durationMs: 1 }` — per-quiz leaderboard.
- `Attempt { user, createdAt: -1 }` — a player's history.

**Q: Why does search use a regex, and what's the risk?**
Players expect partial, case-insensitive matching ("reac" → React). User input is passed through
`escapeRegex` first, otherwise `.*` would match everything and a malicious pattern could cause catastrophic
backtracking. At scale I would move to Atlas Search or a `$text` index; regex cannot use an index well.

**Q: Explain the leaderboard aggregation.**
Per quiz: `$sort` by percentage desc / duration asc → `$group` by user taking `$first` (best attempt) →
`$sort` → `$limit 20` → `$lookup` users → `$project` a flat row. Global: `$group` per user computing
`$sum`, `$avg`, `$max` → sort by average, then best, then attempts → `$limit 25` → `$lookup`.
Ties break on duration, then on number of attempts — that is a deliberate product decision, and it is why the
sort order appears twice.

**Q: Why is the leaderboard computed on read instead of stored?**
Correctness and simplicity: a stored leaderboard is a cache that must be invalidated on every attempt, edit
and delete. At this size the aggregation is cheap and always right. At scale I would precompute periodically
into a `Leaderboard` collection and serve that.

**Q: What happens when a quiz is deleted?**
`deleteQuiz` runs `deleteOne()` and `Attempt.deleteMany({ quiz })` in parallel. Those are two writes without
a transaction, so a crash between them could leave orphan attempts — a known limitation. MongoDB supports
multi-document transactions on replica sets, so the fix is `session.withTransaction`.

**Q: `plays += 1; save()` — is that safe under concurrency?**
Not strictly: two simultaneous submissions can read the same value and lose one increment. It is a
counter, not money, so the drift is cosmetic. The correct fix is an atomic `$inc` update.

**Q: NoSQL vs SQL for this project — defend your choice.**
The data is document-shaped: a quiz is a tree of questions and options, read as a unit. Referencing quizzes
from attempts is a natural foreign key, and the aggregation pipeline covers the ranking queries. A relational
model would be equally valid — arguably better if reporting or strict integrity mattered more — but it would
need join-heavy reads for the core "load a quiz and play it" path.

**Q: How do you prevent duplicate users?**
Two ways: `findOne({ email })` in the controller returns 409 before hashing, and the unique index on `email`
is the real guarantee. The error handler maps Mongo's 11000 duplicate-key error to 409 too, so a race between
two signups still produces a clean response instead of a 500.

**Q: What are virtuals and where do you use them?**
Computed, non-persisted fields — `questionCount` and `totalPoints` on `Quiz`. They exist so the client never
has to count questions itself, and so the values cannot drift from the stored data.

---

## Part 5 — API design

**Q: How is the API organised and why those URLs?**
Nouns, plural, nested where ownership is real: `/api/quizzes`, `/api/quizzes/:id/attempts`,
`/api/quizzes/:id/leaderboard`, `/api/attempts/mine`, `/api/leaderboard`, `/api/admin/users/:id/role`.
Verbs come from HTTP methods. There are no verbs in paths except `mine`, which reads better than
`/api/attempts?user=me`.

**Q: Which status codes do you return and when?**
200 read/update, 201 create (`register`, quiz create, attempt), 400 validation/bad input (`CastError`,
Zod, unpublished quiz), 401 auth, 403 permission, 404 missing (also used for unpublished quizzes so their
existence is not leaked), 409 duplicate email, 429 rate limit, 500 unexpected.

**Q: Why a uniform envelope?**
`{ success, message?, data? }` on success and `{ success: false, message, details? }` on failure. One shape
means the axios interceptor can extract `message` for toasts without per-endpoint branching, and `details`
carries field-level validation errors straight into form state.

**Q: How does validation work?**
`validate(schema, 'body' | 'query' | 'params')` runs Zod, replaces the request section with the parsed
(trimmed, coerced, defaulted) value, and throws a 400 with `details` on failure. Zod strips unknown keys, so
mass assignment through `Object.assign(quiz, req.body)` in `updateQuiz` cannot inject `createdBy` or `_id`.

**Q: Show a validation rule that protects data integrity.**
`correctIndex` is validated against `this.options.length`, not just "is a number" — a quiz cannot be saved
with the right answer pointing at a non-existent option. Tested by
`rejects a correct index outside the options`.

**Q: How is the API versioned / documented?**
Not versioned (single client, deployed together). `docs/API.md` is the reference with methods, auth
requirements and payloads; `/api/health` is the liveness probe used by Docker and the host.

**Q: How would you paginate a huge result set?**
`listQuizzes` already does offset pagination (`page`, `limit`, `total`, `pages`) with validation caps. For
deep pages I would switch to cursor pagination on `createdAt`/`_id` because `skip` degrades linearly.

---

## Part 6 — Frontend

**Q: Why Context API instead of Redux?**
Five small, mostly independent slices (auth, theme, toast, socket, notifications) with low update frequency.
Context + `useMemo` gives the same read model with zero dependencies. Redux would earn its place with complex
derived state, time-travel debugging or middleware-heavy flows — none of which exist here.

**Q: What's the cost of Context, and how did you mitigate it?**
Every consumer re-renders when the provider value changes. Mitigations: separate providers per concern (theme
changes don't re-render auth consumers), `useMemo` around every context value, and stable callbacks with
`useCallback`.

**Q: Walk through the custom hooks.**
`useApi(url, { params, deps, skip })` — fetch + loading + error + `refetch`, keyed on the serialised params so
a changed filter re-runs the request but an identical one does not, and `skip` lets a page hold off until a
prerequisite exists. It does not abort in-flight requests; React 18 ignores state updates on an unmounted
component, so the cost is a wasted response, not a crash. `useDebounce` — delays search input so typing
"react" sends one request, not five. `useCountdown(endsAt, total)` — ticks every 250 ms off an absolute
timestamp, so it cannot drift if a render is slow. `useAuth`/`useTheme`/`useToast`/`useSocket` — thin wrappers
that throw if used outside their provider, which turns a confusing runtime bug into an immediate error.

**Q: Why is the timer based on an absolute timestamp?**
A decrementing counter accumulates error and freezes when the tab is backgrounded (browsers throttle timers).
Storing `endsAt = Date.now() + limit` and deriving the remainder means the display is correct after a tab
switch or a dropped frame.

**Q: How does the app handle a 401 mid-session?**
The axios response interceptor dispatches `quizzify:unauthorized`; `AuthContext` listens, clears the token and
user, and the protected-route wrapper redirects to login. One central place instead of every page.

**Q: How is routing protected?**
A `ProtectedRoute` wrapper checks `isAuthenticated` (and `isAdmin` where needed) from `AuthContext` and renders
`<Navigate to="/login" state={{ from }} />`, so the user returns to the page they wanted after signing in.

**Q: How does dark mode work without a flash of the wrong theme?**
`ThemeContext` reads `localStorage.quizzify_theme`, falling back to `prefers-color-scheme`, and toggles the
`dark` class on `<html>`. Tailwind's `darkMode: 'class'` then drives every `dark:` utility, and
`root.style.colorScheme` keeps native scrollbars and inputs consistent.

**Q: How did you handle contrast?**
The palette is three colours — espresso `#3B2418`, cream `#F2E8DA`, blue `#8EC5FF`. Text tones were chosen per
surface: muted body text sits at roughly 7:1 on dark surfaces and 4.9:1 on cream (WCAG AA), the primary CTA
inverts to blue on dark because espresso-on-espresso was unreadable, and non-text UI (borders, placeholders)
was raised until it was distinguishable.

**Q: How do forms show validation errors?**
Client-side rules mirror the server's (required, min length, email) for fast feedback; the server stays
authoritative. A 400 with `details` is mapped onto the matching field, so a rule that exists only on the
server still lands in the right place.

**Q: How is the result screen built?**
The attempt response carries `attempt` (score, percentage, duration) and `review` (per question: text,
options, `correctIndex`, `selectedIndex`, `isCorrect`, `explanation`). The UI colours the correct option green,
the chosen-wrong option red, and renders the explanation — all from that one response, no follow-up calls.

---

## Part 7 — Real-time, testing, Docker

### Socket.IO

**Q: What is Socket.IO used for here?**
Notifications only. When an attempt scores 80% or more, `notify()` persists a `Notification` and emits to
`user:<id>`; the bell updates live with an unread count. Everything else is REST.

**Q: How is the socket authenticated?**
The client sends the JWT in the handshake `auth.token`. `io.use` verifies it, loads the user, checks
`tokenVersion`, and attaches `socket.user`; then the connection joins `user:<id>`. Unauthenticated sockets
still connect but receive nothing.

**Q: Why rooms instead of broadcasting to everyone?**
Privacy and cost — a notification is for one user. `io.to('user:<id>').emit(...)` is O(1) per recipient.

**Q: Why did you remove the live-room feature?**
It was scope that the project does not require: the graded deliverable is browse → play → result →
leaderboard. Keeping it meant a second socket protocol, room lifecycle and disconnect handling to test, for a
feature the assignment does not ask for. Removing it simplified the socket layer to one job it does well.

**Q: What happens if the socket disconnects?**
`socket.io-client` retries (8 attempts, 800 ms apart) and the bell also refetches `GET /api/notifications` on
mount, so a missed event degrades to "visible after refresh" rather than "lost".

**Q: Would this scale to multiple API instances?**
Not as-is: the emit happens on the instance that handled the request, so a user connected elsewhere would miss
it. The fix is a Redis adapter for Socket.IO (pub/sub fan-out) plus sticky sessions, or reading notifications
from the database on reconnect — the persistence already makes that possible.

### Testing

**Q: What do the 23 tests cover?**
The suite in `server/tests/api.test.js` — health (`reports ok`), 404 JSON shape, registration and duplicate
email, validation details, login success and wrong password, protected routes without a token, `me` with
stats, RBAC (`non-admins cannot create quizzes`, `admin creates a quiz`, `admin stats requires the admin
role`), answer integrity (`rejects a correct index outside the options`), payload privacy (`public quiz
payload hides correct answers`, `owner sees correct answers`), listing/filtering and categories, server-side
scoring with the 80% notification, both leaderboards, malformed answers, admin user listing, and token
revocation on logout.

**Q: How are the tests isolated?**
Node's built-in test runner (`node --test`) with Supertest against the Express app — no port binding.
`mongodb-memory-server` starts a throwaway MongoDB per run, so tests never touch a real database, and
`--test-concurrency=1` keeps them deterministic.

**Q: Why not Jest/Mocha?**
Node 20+ ships a runner with assertions and watch mode; for 23 HTTP tests the extra dependency and config
buy nothing. Supertest is the only test-only server dependency that matters.

**Q: What's not tested?**
Socket.IO events, browser flows (no E2E), admin UI interactions, and failure injection (DB down mid-request).
The honest answer is: API contract is covered, UI and realtime are not.

### Docker and deployment

**Q: Explain the production images.**
Two flavours. `docker-compose.yml` runs three containers — Mongo, the API (multi-stage, `npm ci --omit=dev`,
runs as the non-root `app` user, health check on `/api/health`) and an nginx container with the built SPA that
proxies `/api` and `/socket.io`. The root `Dockerfile` builds a *single* image for hosting: nginx plus the API
in one container, nginx binding the platform's `$PORT` and proxying to `127.0.0.1:5000`.

**Q: Why multi-stage builds?**
Build tooling (Vite, dev dependencies) stays in discarded stages. The runtime image has no compiler, no source
of the client and no dev packages — smaller and a smaller attack surface.

**Q: Why is the API non-root?**
If the process is compromised, the attacker does not own the container. Files are copied with root ownership
but read-only to the app, which needs no write access.

**Q: What does the health check actually verify?**
Not just "the port is open" — `fetch('/api/health')` runs inside the container, so it proves Express is
serving, the middleware stack loaded and the process is responsive. Docker and the host use it for restart and
routing decisions; Compose gates startup order on it.

**Q: Why is the API on 5000 inside the container but nginx on `$PORT`?**
Platforms inject `$PORT` and expect one listening socket. nginx must own it; the API keeps a private port.
The first attempt had both reading `$PORT` and the API crashed with `EADDRINUSE` — fixed by pinning the API to
5000 in `deploy/start.sh`.

**Q: Why single origin?**
The client uses `baseURL: '/api'` and `io()` with no URL. Served from the same host, there is no CORS
preflight, no `VITE_API_URL` to bake in at build time, and WebSockets work without cross-origin negotiation.
With two services (the `render.yaml` variant) the client needs `VITE_API_URL` and the API needs `CLIENT_URL`
matching exactly, or the socket handshake is rejected.

**Q: What does CI do?**
`.github/workflows/ci.yml` runs the API tests, the client production build, and both Docker image builds on
every push and PR. `deploy.yml` (on tags) pushes versioned images to GHCR and calls a Render deploy hook when
that secret exists — build once, deploy the same artefact.

**Q: What is the deployment path?**
`docs/DEPLOY.md`: Railway (builds the Dockerfile from a local directory, hosts MongoDB in the same project,
`MONGODB_URI=${{MongoDB.MONGO_URL}}`, generate a domain, set `CLIENT_URL` to it, seed with `railway run`), or
MongoDB Atlas plus any Docker host. Secrets come from the platform's variable store, never the image.

---

## Part 8 — Trap questions and honest gaps

**Q: Your JWT has no refresh token. What happens when it expires mid-quiz?**
A 401 triggers the interceptor → session cleared → redirect to login, and the in-progress attempt state is
lost. A refresh token (or a longer-lived token with rotation) would fix it; that is the first auth improvement
I would make.

**Q: Two players submit at the same instant — is anything racy?**
`plays` can lose an increment (read-modify-write; should be `$inc`). Scoring is per-document and safe. Delete
+ cascade delete is not transactional, so a crash between them can orphan attempts.

**Q: Someone replays a request to inflate the leaderboard.**
Each submission creates a new attempt; the leaderboard takes the best per user, so replaying does not help
beyond getting your best score — but it does inflate attempt counts and `plays`. Per-user rate limiting and a
cooldown per quiz would be the fix.

**Q: Why is the leaderboard average-based rather than points-based?**
Points depend on how many questions a quiz has, so a 3-question quiz would never out-rank a 10-question one.
Percentage normalises across quizzes; ties break on best score, then attempt count.

**Q: How would you support 10k concurrent users?**
Stateless API behind a load balancer (already stateless — JWT, no sessions), Redis for the Socket.IO adapter
and rate-limit store, MongoDB replica set with read preference tuning, cached leaderboards, CDN for assets
(nginx already sets immutable caching on hashed files), and cursor pagination.

**Q: What would you do differently if you started again?**
Add refresh tokens and password reset from day one (they change the auth shape), use `$inc` for counters and
transactions for cascades, add Playwright for the auth-and-play flow, and split the API from the client from
the start so deployment does not require a proxy decision.

**Q: You deleted the live-room feature — was that the right call?**
It kept scope honest. A half-tested realtime game mode is worse than a polished single-player flow with
working notifications, and the socket layer that remains is small enough to be correct.

**Q: Name three weaknesses you accept.**
Token in `localStorage` (XSS exposure), no E2E tests (UI regressions rely on manual checks), and no
observability beyond logs and `/api/health` — no metrics or error tracking.

---

## Part 9 — Rapid fire

| Question | Answer |
|---|---|
| PUT vs PATCH here | `PUT /api/quizzes/:id` replaces editable fields wholesale; partial semantics would be PATCH |
| Why `asyncHandler` | Express 4 does not catch rejected promises; it forwards them to the error middleware |
| Why `ApiError` class | Carries `statusCode` and `details` so the handler stays generic and responses stay consistent |
| Validation: Zod or Mongoose? | Both — Zod at the boundary (types, stripping), Mongoose as the last line (data invariants) |
| `populate` vs `$lookup` | `populate` for simple document reads; `$lookup` inside aggregations where the join must happen after grouping |
| Why `select: false` | Password and `tokenVersion` are never needed by ordinary reads; opt-in keeps them out of memory and payloads |
| Password hashing cost | bcrypt, 10 salt rounds |
| Token lifetime | 7 days (`JWT_EXPIRES_IN`) |
| Global rate limit | 300 requests/minute per IP |
| Auth rate limit | 40 requests / 15 minutes |
| Max questions per quiz | 50, options 2–6, points 1–100 |
| Notification threshold | 80% or higher |
| Leaderboard sizes | 25 global, 20 per quiz |
| JSON body limit | 1 MB |
| Why `trust proxy` | Correct client IPs (and therefore rate limits) behind nginx/Render |
| React version / build tool | React 18, Vite 5, Tailwind 3 |
| State management | Five Context providers + custom hooks |
| Test runner | `node --test` + Supertest + `mongodb-memory-server` |
| Container runtime user | `app` (non-root) for the API |

---

## Part 10 — Demo script (rehearse twice)

1. Landing page — mention the design system and dark mode toggle.
2. **Quizzes** → search "react" → filter Easy → open **React Fundamentals**.
3. Start: point at the timer bar and say "display only; the server grades".
4. Answer, finish, show the result: score ring, review with explanations, the "your answer" vs correct chip.
5. Point at the bell — the 80% notification arrived over Socket.IO.
6. **Dashboard** — attempts, best/average, progress bars.
7. **Leaderboard** — global ranking, tie-break by best score.
8. Second browser as `admin@quizzify.dev` — **Admin → Quiz library → New quiz**, publish, then play it as the
   player to prove the loop closes.
9. `docker compose ps` — three healthy containers; mention the single-origin production image and CI.

## Part 11 — The night before

- Rewrite the 90-second pitch from memory.
- Draw the schema and the request lifecycle on paper, twice.
- Be able to explain *why* for: server-side grading, `tokenVersion`, embedded questions, the answer-stripping
  payload, single origin, and the leaderboard aggregation.
- Prepare one honest limitation and one concrete next step; examiners respect a scoped answer more than a
  claimed complete product.
- Know your numbers: 23 tests, 7-day tokens, 300/min, 40/15 min, 80% threshold, 50 questions max, 2–6 options.
- If you don't know: "I didn't implement that; here's how I'd approach it and what it would affect."
