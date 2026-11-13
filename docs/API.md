# Quizzify API reference

Base URL: `http://localhost:5000/api` (production: your API origin + `/api`).

All responses are JSON:

```json
{ "success": true, "message": "Optional human message", "data": { } }
```

Errors:

```json
{ "success": false, "message": "Validation failed", "details": [{ "field": "email", "message": "Enter a valid email address" }] }
```

Authenticate with `Authorization: Bearer <token>`. Tokens are issued by register/login and expire after
`JWT_EXPIRES_IN` (7 days by default). Logging out revokes every token issued earlier for that account.

Status codes used: `200` OK, `201` created, `400` validation error, `401` unauthenticated/expired,
`403` authenticated but not allowed, `404` not found, `409` conflict, `429` rate limited, `500` server error.

---

## Health

### `GET /health`

```json
{ "success": true, "status": "ok", "uptime": 42, "env": "development" }
```

---

## Authentication

### `POST /auth/register`

Body:

```json
{ "name": "Alex Johnson", "email": "alex@example.com", "password": "secret123" }
```

`201`:

```json
{
  "success": true,
  "message": "Account created",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": "665f...", "name": "Alex Johnson", "email": "alex@example.com", "role": "user" }
  }
}
```

New accounts always get the `user` role. Duplicate email → `409`.

### `POST /auth/login`

```json
{ "email": "alex@example.com", "password": "secret123" }
```

`200` with `{ token, user }`. Wrong credentials → `401` (`Invalid email or password`).

### `GET /auth/me` — auth required

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Alex Johnson", "email": "alex@example.com", "role": "user" },
    "stats": { "attempts": 4, "bestScore": 90, "averageScore": 72 }
  }
}
```

### `PATCH /auth/profile` — auth required

```json
{ "name": "Alex J.", "password": "newsecret123" }
```

Both fields optional, at least one required. Changing the password does not revoke existing tokens.

### `POST /auth/logout` — auth required

Increments the account's token version. `200` `{ "success": true, "message": "Logged out" }`.
Any token issued before this call returns `401` afterwards.

---

## Quizzes

### `GET /quizzes`

Query parameters (all optional):

| Param        | Values                          | Default  |
| ------------ | ------------------------------- | -------- |
| `search`     | free text (title/description/category) | `""` |
| `category`   | category name or `all`          | `all`    |
| `difficulty` | `easy`, `medium`, `hard`, `all` | `all`    |
| `sort`       | `newest`, `popular`, `az`       | `newest` |
| `page`       | integer ≥ 1                     | `1`      |
| `limit`      | integer 1–50                    | `9`      |

```json
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "id": "665f...",
        "title": "React Fundamentals",
        "description": "Hooks, rendering and composition.",
        "category": "Programming",
        "difficulty": "easy",
        "cover": "⚛️",
        "timeLimitSeconds": 20,
        "questionCount": 5,
        "totalPoints": 50,
        "plays": 12,
        "isPublished": true,
        "createdBy": { "id": "665e...", "name": "Ava Admin" },
        "createdAt": "2026-01-05T10:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 9,
    "total": 6,
    "pages": 1
  }
}
```

Questions are omitted from list responses, so answers cannot leak.

### `GET /quizzes/categories`

```json
{ "success": true, "data": { "categories": [{ "name": "Programming", "count": 2 }] } }
```

### `GET /quizzes/mine` — auth required

Returns quizzes created by the caller (all quizzes for admins), including `correctIndex` and
`explanation` on every question.

### `GET /quizzes/:id`

Returns quiz detail with questions but **without** `correctIndex`/`explanation` for normal players.
Owners and admins receive the answers. Unpublished quizzes are `404` for everyone else.

### `GET /quizzes/:id/leaderboard`

Top 20 players, best attempt each:

```json
{
  "success": true,
  "data": {
    "leaderboard": [
      { "userId": "...", "name": "Sam Player", "percentage": 100, "score": 50, "durationMs": 18000, "createdAt": "..." }
    ]
  }
}
```

### `POST /quizzes` — admin only

```json
{
  "title": "World Capitals",
  "description": "Quick geography check.",
  "category": "Geography",
  "difficulty": "easy",
  "cover": "🌍",
  "timeLimitSeconds": 20,
  "isPublished": true,
  "questions": [
    {
      "text": "What is the capital of Japan?",
      "options": ["Osaka", "Kyoto", "Tokyo", "Seoul"],
      "correctIndex": 2,
      "explanation": "Tokyo has been the capital since 1868.",
      "points": 10,
      "timeLimitSeconds": 20
    }
  ]
}
```

Rules: 1–50 questions, 2–6 non-empty options each, `correctIndex` must reference an option, 5–120 seconds
per question. `201` returns the quiz with answers.

### `PUT /quizzes/:id` — admin or quiz owner

Accepts any subset of the create payload. `200` with the updated quiz.

### `DELETE /quizzes/:id` — admin or quiz owner

Removes the quiz and all of its attempts. `200` `{ "success": true, "message": "Quiz deleted" }`.

---

## Attempts

### `POST /quizzes/:id/attempts` — auth required

```json
{
  "answers": [
    { "questionId": "665f00000000000000000001", "selectedIndex": 2, "timeMs": 3400 },
    { "questionId": "665f00000000000000000002", "selectedIndex": null, "timeMs": 20000 }
  ],
  "durationMs": 24000
}
```

The server compares against stored answers — the client cannot submit a score. Unanswered questions may be
omitted or sent with `selectedIndex: null`.

`201`:

```json
{
  "success": true,
  "data": {
    "attempt": {
      "id": "...",
      "quizId": "...",
      "quizTitle": "World Capitals",
      "correctCount": 3,
      "totalQuestions": 4,
      "score": 30,
      "percentage": 75,
      "durationMs": 24000,
      "createdAt": "..."
    },
    "review": [
      {
        "questionId": "...",
        "text": "What is the capital of Japan?",
        "options": ["Osaka", "Kyoto", "Tokyo", "Seoul"],
        "correctIndex": 2,
        "selectedIndex": 2,
        "isCorrect": true,
        "explanation": "Tokyo has been the capital since 1868."
      }
    ]
  }
}
```

Scores ≥ 80% create a persisted notification pushed over the socket.

### `GET /attempts/mine` — auth required

Last 50 attempts, newest first, with the quiz's `title`, `cover`, `category` and `difficulty`.

---

## Leaderboard

### `GET /leaderboard`

```json
{
  "success": true,
  "data": {
    "leaderboard": [
      { "userId": "...", "name": "Sam Player", "attempts": 6, "totalCorrect": 21, "bestScore": 100, "averageScore": 82 }
    ]
  }
}
```

Ranked by average percentage, then best score, then number of attempts. Top 25 players.

---

## Admin

All admin routes require a valid token with `role: "admin"`.

### `GET /admin/stats`

```json
{
  "success": true,
  "data": {
    "stats": { "users": 12, "quizzes": 6, "attempts": 34, "averageScore": 71 },
    "topQuizzes": [{ "id": "...", "title": "World Capitals", "category": "Geography", "cover": "🌍", "plays": 18 }],
    "recentAttempts": [{ "id": "...", "user": "Sam Player", "quiz": "World Capitals", "percentage": 75, "createdAt": "..." }]
  }
}
```

### `GET /admin/users?search=&page=1&limit=10`

Paginated user list (`name`, `email`, `role`, `createdAt`). `search` matches name or email.

### `PATCH /admin/users/:id/role`

```json
{ "role": "admin" }
```

`role` must be `user` or `admin`. Admins cannot change their own role (`400`).

---

## Notifications

### `GET /notifications` — auth required

```json
{
  "success": true,
  "data": {
    "notifications": [
      { "id": "...", "type": "achievement", "title": "Perfect score!", "message": "You scored 100% on \"World Capitals\".", "read": false, "createdAt": "..." }
    ],
    "unread": 1
  }
}
```

### `PATCH /notifications/:id/read` and `PATCH /notifications/read-all`

Marks one or all notifications as read. Only the owner's notifications are affected.

---

## Error examples

| Situation                        | Status | `message`                                      |
| -------------------------------- | ------ | ---------------------------------------------- |
| Missing/invalid token            | 401    | `Authentication required` / `Invalid or expired token` |
| Revoked by logout                | 401    | `Session expired, please log in again`         |
| Player calling an admin route    | 403    | `Requires role: admin`                         |
| Editing someone else's quiz      | 403    | `You can only edit quizzes you created`        |
| Duplicate email                  | 409    | `That email is already taken`                  |
| Zod validation failure           | 400    | `Validation failed` + `details[]`              |
| Too many auth attempts           | 429    | `Too many attempts, please try again later`    |
