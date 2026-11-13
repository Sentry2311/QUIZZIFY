# Quizzify — presentation outline

A slide-by-slide outline you can paste into PowerPoint, Google Slides or Keynote. Roughly 12 slides, 8–10
minutes.

---

### 1. Title

**Quizzify — a real-time online quiz platform**
Full-stack MERN project · your name · date

### 2. The problem

- Learning tools are either solo and static, or live but locked into one vendor.
- People want to create their own quizzes and play together, with instant feedback.
- Goal: a platform where anyone can build a quiz, play it solo, or host it live with a shared code.

### 3. Demo agenda

1. Browse and search quizzes
2. Play a timed quiz and review answers
3. Dashboard + leaderboards
4. Admin: create a quiz and host a live room

### 4. Tech stack

| Layer     | Choice                                   |
| --------- | ---------------------------------------- |
| Frontend  | React 18, Vite, Tailwind CSS, React Router |
| State     | Context API + custom hooks               |
| Backend   | Express REST API, Socket.IO              |
| Data      | MongoDB + Mongoose                       |
| Auth      | JWT + bcrypt + role-based access         |
| Ops       | Docker Compose, GitHub Actions, Render   |

### 5. Architecture

Show the diagram from `README.md` → Architecture.
Talking points: SPA on nginx, API behind `/api`, Socket.IO on the same HTTP server, MongoDB persistence.

### 6. Data model

- `User 1—* Quiz` (embedded questions, answers never sent to players)
- `User 1—* Attempt` and `Quiz 1—* Attempt`
- `User 1—* Notification`
- Indexes for browse filtering, leaderboards and attempt history.

### 7. Frontend highlights

- Responsive mobile / tablet / desktop layouts, collapsible navigation.
- Dark/light mode with persisted preference.
- Reusable Tailwind component classes; modals, toasts, skeletons and inline validation.
- Custom hooks: `useApi`, `useDebounce`, `useCountdown`, `useAuth`, `useSocket`.

### 8. Backend & security

- REST endpoints with correct verbs and status codes; Zod validation on every write.
- JWT bearer auth, bcrypt hashing, `tokenVersion` revocation on logout.
- Admin middleware plus ownership checks; correct answers stripped from public payloads.
- Central error handler, helmet, CORS allow-list, rate limiting.

### 9. Real-time features

- Socket handshake authenticated with the same JWT (guests can join by name).
- Live room lifecycle: create → lobby → question → reveal → next → final standings.
- Server-authoritative scoring with speed bonus; live scoreboard and chat.
- Notifications pushed to `user:<id>` channels.

### 10. DevOps

- Multi-stage Dockerfiles (non-root API, nginx-served SPA) + Compose with Mongo health check.
- CI on every push: API tests, client build, Docker image builds.
- Release workflow tags images to GHCR and triggers the Render deploy hook.
- Environment configuration documented in the README.

### 11. Testing and demo walkthrough

- 23 API integration tests (auth, RBAC, scoring, leaderboards, admin).
- Production build verified.
- Screens: landing, browse, player, result review, dashboard, live room, admin analytics.

### 12. Lessons learned & next steps

- Server-side grading is essential once clients control the timer.
- Token revocation needed a dedicated field rather than in-memory blacklists.
- Next: Redis adapter for multi-instance rooms, password reset emails, quiz images, E2E tests with Playwright.
- Close with the repository link, live URLs (if deployed) and sample accounts.

---

## Demo script (5 minutes)

1. Sign in as `player@quizzify.dev / player123`.
2. Open **Quizzes**, search "react", filter **Easy**, play **React Fundamentals**.
3. Point out the timer, then the answer review and toast/notification.
4. Show **Dashboard** stats and **Leaderboard**.
5. Sign in as `admin@quizzify.dev / admin123` in a second browser.
6. **Admin → Quiz library → Host live** on a quiz, copy the room code.
7. In the first browser join `/live/<code>` as the player, chat, start the quiz, answer, watch scores update.
