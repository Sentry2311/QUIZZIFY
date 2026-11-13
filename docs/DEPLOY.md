# Deploying Quizzify

The repository ships a single production image (root `Dockerfile`) that runs nginx with the built SPA and
the Express API in one container:

```
browser ──▶ nginx :$PORT ──▶ /usr/share/nginx/html   (SPA, history fallback)
                     └─────▶ 127.0.0.1:5000/api      (Express + Socket.IO)
                                                   └──▶ MongoDB (hosted)
```

One origin means the client uses its default `baseURL: '/api'` and `io()` connects to the same host —
**no CORS configuration, no `VITE_API_URL`, nothing to hardcode**. The image was built and smoke-tested
locally: `/api/health`, `/`, a deep link (`/dashboard`), a login request and a Socket.IO handshake all
returned 200 on a single port.

`railway.toml` points the platform at that Dockerfile and at `/api/health` as its health check.

---

## Option A — Railway (app + MongoDB in one project)

Railway can build this Dockerfile from a local directory (no GitHub repo needed) and host MongoDB next
to it. Free trial: 30 days / $5 credit, no card; after that the Free plan is $1 of usage per month.

```bash
# 1. Install and sign in (opens your browser)
npm i -g @railway/cli
railway login

# 2. Create the project from this folder and link the service
railway init --name quizzify
railway add --service quizzify          # empty service, linked to this directory

# 3. Add the database (auto-deploys and exposes MONGO_URL on the Mongo service)
railway add --database mongo

# 4. Deploy the image (Dockerfile at the repo root is detected automatically)
railway up
```

Then generate the public URL and finish the variable wiring:

```bash
railway domain --service quizzify        # prints https://<name>.up.railway.app
```

Set the service variables (replace the Mongo service name with whatever `railway status` shows — usually
`MongoDB`; keep the `${{ ... }}` literally so Railway resolves it at runtime):

```bash
railway variables --service quizzify \
  --set 'MONGODB_URI=${{MongoDB.MONGO_URL}}' \
  --set 'JWT_SECRET=<paste a long random string>' \
  --set 'CLIENT_URL=https://<name>.up.railway.app' \
  --set 'JWT_EXPIRES_IN=7d'
railway up                                # redeploy so the new variables apply
```

`CLIENT_URL` must equal the public URL: it is the allowed origin for the Socket.IO handshake. Get the
value from step 4 rather than guessing, because the platform assigns the subdomain.

Seed the production database (runs locally, using the deployed service's variables):

```bash
railway run --service quizzify node server/src/seed.js
```

Generated credentials: `admin@quizzify.dev / admin123`, `player@quizzify.dev / player123`. Change or
delete them for anything beyond a demo.

Verify:

```bash
curl -s https://<name>.up.railway.app/api/health   # {"success":true,"status":"ok","env":"production"}
railway logs                                       # container logs, nginx access lines included
```

## Option B — MongoDB Atlas + any Docker host

### 1. Hosted MongoDB

1. Create a free **M0** cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a user with password auth (this is _not_ your Atlas login).
3. **Network Access** → allow `0.0.0.0/0` (or the egress IPs of your host).
4. **Connect → Drivers** → copy the `mongodb+srv://user:pass@cluster.mongodb.net/` string and add the
   database name: `.../quizzify?retryWrites=true&w=majority`.

That string is `MONGODB_URI`. Do not commit it.

### 2. Container host

Any host that runs a Dockerfile works. With Fly.io:

```bash
fly launch --no-deploy            # keeps the repo Dockerfile
fly secrets set MONGODB_URI='mongodb+srv://...' JWT_SECRET='<random>' CLIENT_URL='https://<app>.fly.dev'
fly deploy
fly open
```

With Render: **New → Web Service → Docker**, root directory = repo root, health check path
`/api/health`, then set `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, and `CLIENT_URL` to the
service URL. On a VPS: `docker build -t quizzify . && docker run -d -p 80:8080 --env-file .env.production quizzify`.

`render.yaml` in the repo describes the older two-service setup (static client + Node API). It still works,
but then the client needs `VITE_API_URL=https://<api>/api` at build time and the API needs
`CLIENT_URL=https://<client>`; the single image avoids both.

---

## Environment variables

| Variable         | Required | Example                                  | Notes                                                |
| ---------------- | -------- | ---------------------------------------- | ---------------------------------------------------- |
| `PORT`           | on PaaS  | `8080`                                   | Public port for nginx; the API stays on 5000         |
| `NODE_ENV`       | yes      | `production`                             | Enables prod CORS allow-list and hides stack traces  |
| `MONGODB_URI`    | yes      | `mongodb+srv://…/quizzify`               | Never commit; use the platform's secret store        |
| `JWT_SECRET`     | yes      | 32+ random chars                         | Rotating it signs every user out (`tokenVersion`)    |
| `JWT_EXPIRES_IN` | no       | `7d`                                     | Token lifetime                                       |
| `CLIENT_URL`     | yes      | `https://quizzify.up.railway.app`        | Comma-separated allowed origins for Socket.IO        |

## Post-deploy checklist

1. `GET /api/health` returns `env: "production"`.
2. The landing page renders and `/quizzes` survives a hard refresh (SPA fallback in nginx).
3. Register a throwaway account, play a quiz, confirm the score appears on the dashboard.
4. Sign in as the seeded admin and open `/admin` — verifies JWT + RBAC against the hosted database.
5. DevTools → Network → WS shows one `socket.io` connection; the bell updates when an attempt is scored.
6. No secret appears in the image: `docker run --rm --entrypoint sh quizzify -c 'env'` shows only runtime vars.

## Free-tier caveats

- Railway Free/Trial caps a service at 0.5–1 GB RAM and sleeps nothing, but the $5 credit runs out.
- Render's free web services sleep after 15 minutes idle; the first request then takes ~30 s.
- Atlas M0 is free indefinitely, ~512 MB storage, shared CPU.
- Free hosts usually provide one region; the app has no region affinity, so any is fine.
