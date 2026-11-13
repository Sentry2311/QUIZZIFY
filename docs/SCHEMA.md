# Database schema

MongoDB 7 with Mongoose 8. Database name defaults to `quizzify`.

```
┌──────────────┐          creates          ┌─────────────────────┐
│     User     │ 1 ─────────────────── *   │        Quiz         │
│              │                           │  questions[] embedded│
└──────┬───────┘                           └──────────┬──────────┘
       │ 1                                            │ 1
       │                                              │
       │ *                                            │ *
┌──────┴───────┐                               ┌───────┴─────────┐
│  Attempt     │ * ─────────────────────────── │ quiz (ref)      │
└──────────────┘                               └─────────────────┘

User 1 ──── * Notification
```

---

## User

| Field          | Type   | Constraints                                                    |
| -------------- | ------ | -------------------------------------------------------------- |
| `name`         | String | required, 2–60 chars, trimmed                                  |
| `email`        | String | required, unique index, lowercase, email regex                 |
| `password`     | String | required, ≥ 6 chars, bcrypt hash, `select: false`              |
| `role`         | String | enum `user` / `admin`, default `user`                          |
| `tokenVersion` | Number | default `0`, `select: false`, incremented on logout            |
| `createdAt` / `updatedAt` | Date | automatic via `timestamps: true`                    |

Behaviour: a `pre('save')` hook hashes the password only when the field changed. `toJSON` strips
`password`, `tokenVersion` and `__v`. `comparePassword(candidate)` wraps `bcrypt.compare`.

Indexes: unique `{ email: 1 }` (declared on the field).

---

## Quiz

| Field              | Type     | Constraints                                                     |
| ------------------ | -------- | --------------------------------------------------------------- |
| `title`            | String   | required, 3–120 chars                                            |
| `description`      | String   | ≤ 600 chars, default `""`                                        |
| `category`         | String   | required, ≤ 40 chars, default `General`                          |
| `difficulty`       | String   | enum `easy` / `medium` / `hard`                                  |
| `cover`            | String   | emoji, ≤ 8 chars, default `🧠`                                   |
| `timeLimitSeconds` | Number   | 5–120, default 20                                                |
| `questions`        | Question[] | 1–50 embedded documents                                       |
| `isPublished`      | Boolean  | default `true`                                                   |
| `plays`            | Number   | default `0`, incremented per submitted attempt                   |
| `createdBy`        | ObjectId | ref `User`, required, indexed                                    |

### Question (embedded, own `_id`)

| Field              | Type     | Constraints                                                    |
| ------------------ | -------- | -------------------------------------------------------------- |
| `text`             | String   | required, ≤ 400 chars                                          |
| `options`          | [String] | 2–6 non-empty strings, each ≤ 160 chars                        |
| `correctIndex`     | Number   | required, integer ≥ 0, must be `< options.length`              |
| `explanation`      | String   | ≤ 400 chars, default `""`                                       |
| `points`           | Number   | 1–100, default 10                                               |
| `timeLimitSeconds` | Number   | 5–120, default 20                                               |

Answers are removed by `toPublicJSON()` unless the caller is the owner or an admin.

Indexes:

- `{ isPublished: 1, category: 1, difficulty: 1, createdAt: -1 }` — browse page filtering/sorting.
- text index `{ title: 'text', description: 'text' }`.
- `{ createdBy: 1 }` — "my quizzes" and ownership lookups.

---

## Attempt

| Field            | Type     | Constraints                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `user`           | ObjectId | ref `User`, required, indexed                      |
| `quiz`           | ObjectId | ref `Quiz`, required, indexed                      |
| `answers`        | Answer[] | `{ questionId, selectedIndex, isCorrect, timeMs }`  |
| `correctCount`   | Number   | required, ≥ 0                                      |
| `totalQuestions` | Number   | required, ≥ 1                                      |
| `score`          | Number   | sum of points for correct answers                  |
| `percentage`     | Number   | 0–100, rounded                                     |
| `durationMs`     | Number   | total time spent                                   |
| `createdAt`      | Date     | automatic                                          |

Indexes:

- `{ quiz: 1, percentage: -1, durationMs: 1 }` — per-quiz leaderboard.
- `{ user: 1, createdAt: -1 }` — attempt history.
- `{ user: 1 }` and `{ quiz: 1 }` from field-level `index: true` (covered by the compound indexes above; the
  extra single-field indexes are harmless for this dataset size).

Attempts are deleted when their quiz is deleted.

---

## Notification

| Field       | Type     | Constraints                                              |
| ----------- | -------- | -------------------------------------------------------- |
| `user`      | ObjectId | ref `User`, required, indexed                            |
| `type`      | String   | enum `result`, `achievement`, `quiz`, `system`           |
| `title`     | String   | required, ≤ 120 chars                                    |
| `message`   | String   | ≤ 300 chars                                              |
| `link`      | String   | optional in-app path                                     |
| `read`      | Boolean  | default `false`                                          |
| `createdAt` | Date     | automatic                                                |

Index: `{ user: 1, read: 1, createdAt: -1 }`.

---

## Relationships

- `User 1—* Quiz` through `Quiz.createdBy` (Mongoose `ref`, populated as `name`).
- `User 1—* Attempt` through `Attempt.user`.
- `Quiz 1—* Attempt` through `Attempt.quiz`; deleting a quiz deletes its attempts in the controller.
- `Quiz 1—* Question` embedded subdocuments; deleted with the quiz.
- `User 1—* Notification`; notifications are only readable by their owner.

## Transactions

The app does not require multi-document transactions: attempt scoring reads a single quiz document and
writes one attempt, and quiz deletion removes attempts with a follow-up `deleteMany`. A replica set would be
needed if strict transactional deletion were required.
