# Quizzify — presentation outline

A slide-by-slide outline you can paste into PowerPoint, Google Slides or Keynote. Roughly 12 slides, 8–10
minutes.

---

### 1. Title

**Quizzify — an online quiz platform**
Full-stack MERN project · your name · date

### 2. The problem

- Most quiz tools are either single-player and static, or locked into one vendor.
- People want to build their own quizzes, play them with a timer and learn from their mistakes.
- Goal: a platform where users browse and play quizzes, see detailed results, and track progress over time.

### 3. Demo agenda

1. Browse and search quizzes
2. Play a timed quiz and review answers
3. Dashboard + leaderboards
4. Admin: create and publish a quiz

### 4. Tech stack

| Layer     | Choice                                   |
| --------- | ---------------------------------------- |
| Frontend  | React 18, Vite, Tailwind CSS, React Router |
| State     | Context API + custom hooks               |
| Backend   | Express REST API, Socket.IO (notifications) |
| Data      | MongoDB + Mongoose                       |
| Auth      | JWT + bcrypt + role-based access         |
| Ops       | Docker Compose, GitHub Actions, Render   |

### 5. Architecture

Show the diagram from `README.md` → Architecture.
Talking points: SPA on nginx, API behind `/api`, Socket.IO on the same HTTP server for notifications,
MongoDB persistence.

### 6. Data model

- `User 1—* Quiz` (embedded questions, answers never sent to players)
- `User 1—* Attempt` and `Quiz 1—* Attempt`
- `User 1—* Notification`
- Indexes for browse filtering, leaderboards and attempt history.

### 7. Frontend highlights

- Brown, cream and blue design system with a responsive mobile / tablet / desktop layout.
- Dark/light mode with persisted preference.
- Reusable Tailwind component classes; modals, toasts, skeletons and inline validation.
- Custom hooks: `useApi`, `useDebounce`, `useCountdown`, `useAuth`, `useSocket`.

### 8. Backend & security

- REST endpoints with correct verbs and status codes; Zod validation on every write.
- JWT bearer auth, bcrypt hashing, `tokenVersion` revocation on logout.
- Admin middleware plus ownership checks; correct answers stripped from public payloads.
- Central error handler, helmet, CORS allow-list, rate limiting.

### 9. Real-time notifications

- Socket handshake authenticated with the same JWT; connections join a per-user room.
- Notifications persisted in MongoDB and pushed instantly when an attempt scores 80%+.
- Bell menu shows unread counts and marks notifications as read.

### 10. DevOps

- Multi-stage Dockerfiles (non-root API, nginx-served SPA) + Compose with Mongo health check.
- CI on every push: API tests, client build, Docker image builds.
- Release workflow tags images to GHCR and triggers the Render deploy hook.
- Environment configuration documented in the README.

### 11. Testing and demo walkthrough

- 23 API integration tests (auth, RBAC, scoring, leaderboards, admin).
- Production build verified.
- Screens: landing, browse, player, result review, dashboard, admin analytics.

### 12. Lessons learned & next steps

- Server-side grading is essential once clients control the timer.
- Token revocation needed a dedicated field rather than in-memory blacklists.
- Next: password reset emails, quiz images, profile avatars and E2E tests with Playwright.
- Close with the repository link, live URLs (if deployed) and sample accounts.

---

## Demo script (5 minutes)

1. Sign in as `player@quizzify.dev / player123`.
2. Open **Quizzes**, search "react", filter **Easy**, play **React Fundamentals**.
3. Point out the timer, then the answer review and the notification bell badge.
4. Show **Dashboard** stats and **Leaderboard**.
5. Sign in as `admin@quizzify.dev / admin123` in a second browser.
6. **Admin → Quiz library → New quiz**, add two questions and publish.
7. Back on the player account, find the new quiz under **Quizzes** and play it.
