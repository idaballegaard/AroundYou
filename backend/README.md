# AroundYou Backend 🛠️

Express + TypeScript API for AroundYou. The backend powers authentication, content collections, reviews, admin moderation, image uploads, notifications, geocoding, contact tickets, and content suggestions.

The API is mounted under:

```text
/api
```

Swagger UI is available at:

```text
/api/docs
```

## 📚 Table Of Contents

- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Project Structure](#-project-structure)
- [Request Lifecycle](#-request-lifecycle)
- [How We Write Backend Code](#-how-we-write-backend-code)
- [Auth And Permissions](#-auth-and-permissions)
- [Moderation And Safety](#-moderation-and-safety)
- [Testing](#-testing)
- [Branches And PRs](#-branches-and-prs)
- [Operational Notes](#-operational-notes)

## 🧰 Tech Stack

- **Node.js**
- **Express 5**
- **TypeScript**
- **MongoDB + Mongoose**
- **Joi** for request validation
- **JWT + HttpOnly cookies** for auth/session recovery
- **Multer + GridFS** for image uploads
- **Swagger** for API documentation
- **Playwright API tests**

## 🚀 Getting Started

Install dependencies from this folder:

```sh
cd backend
npm install
```

Start the API in watch mode:

```sh
npm run start-dev
```

The default local API is:

```text
http://localhost:4000/api
```

## 🔐 Environment Variables

Create `.env` from `.env.example`:

```sh
PORT=4000
DBHOST=<mongodb connection string>
TOKEN_SECRET=<jwt signing secret>
ADMIN_EMAIL=<default admin email>
ADMIN_PASSWORD=<default admin password>
ADMIN_USERNAME=<default admin username>
ADMIN_FIRST_NAME=<default admin first name>
ADMIN_LAST_NAME=<default admin last name>
```

Optional local URL settings can live in `.env.development`:

```sh
API_BASE_URL=http://localhost:4000/api
FRONTEND_ORIGIN=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Notes:

- Do not commit real secrets.
- `TOKEN_SECRET` must be stable across restarts or existing sessions become invalid.
- `API_BASE_URL` controls generated public asset/API URLs.
- `CORS_ORIGINS` should include every frontend origin that can call the API.

## 📜 Scripts

```sh
npm run start-dev  # Start nodemon + ts-node in development
npm run build      # Clean dist/ and compile TypeScript
npm run start      # Run compiled dist/index.js
npm test           # Run Playwright API tests
npm run test:e2e   # Same as npm test
```

Use **npm** for this project. The repository has `package-lock.json`; do not use pnpm/yarn lockfiles.

## 🗂️ Project Structure

```text
src/
  app.ts                 Express app setup, CORS, routes, Swagger, bootstrap
  index.ts               Server entrypoint
  constants/             Shared enums and fixed values
  controllers/           HTTP adapters and response shaping
  docs/                  Swagger route annotations
  interfaces/            Mongoose document interfaces
  middleware/            Auth, permissions, admin checks, rate limits
  models/                Mongoose schemas and models
  repository/            Database connection
  routes/                Route registration and middleware ordering
  services/              Business logic and side effects
  types/                 Express/JWT/shared TypeScript types
  utils/                 Reusable helpers and sanitizers
  validators/            Joi request validators

e2e/
  *.spec.ts              Playwright API and helper tests
```

## 🔁 Request Lifecycle

Most requests follow this path:

```text
app.ts
  -> routes/routes.ts
  -> feature route file
  -> middleware
  -> controller
  -> service/helper/model
  -> JSON response
```

Middleware order matters:

```text
verifyToken -> requireAdmin/requirePermission -> rateLimiter -> controller
```

For public routes, controllers still apply visibility filters so hidden content does not leak.

## ✍️ How We Write Backend Code

### Routes 🧭

- Routes should only define URL paths and middleware order.
- Do not put business logic in route files.
- Mount new feature routes through `routes/routes.ts`.

### Controllers 🎛️

- Controllers handle HTTP concerns:
  - request params/query/body
  - status codes
  - response shape
  - request-level validation errors
- Keep controllers thin.
- Delegate reusable work to services or utils.

### Services 🧠

- Services contain domain work and side effects.
- Examples:
  - auth user lookup and password checks
  - contact ticket transitions
  - notification creation
  - review author avatar enrichment
- Services should be easier to test than controllers.

### Validators 🧪

- Use Joi for request payload validation.
- Validators should strip unknown fields when possible.
- Convert Joi failures into normal `ValidationError` objects when controllers branch on `error.name`.

### Models 🗄️

- Mongoose schemas define persistence rules.
- Backend validators still matter because they give cleaner API errors before database writes.
- Keep public response shaping outside models unless the behavior is persistence-specific.

### Comments 💬

Add comments where behavior is:

- security-sensitive
- moderation-related
- surprising from the function name
- dependent on frontend/backend contract
- intentionally different from the obvious implementation

Avoid comments that repeat the next line of code.

## 🔐 Auth And Permissions

Login returns:

- a JWT in the JSON response
- an HttpOnly `aroundyou_auth` cookie

The frontend keeps the token in memory. The cookie lets `/user/me` recover a session after a browser refresh.

Protected endpoints accept either:

```text
Authorization: Bearer <token>
```

or the HttpOnly cookie.

### Restricted Users 🚫

Deleting an account restricts the user instead of removing historical content. Restricted users cannot authenticate. Login returns a Danish error message explaining that the account is restricted.

### Permissions 🧩

Permissions are normalized in `utils/accessControl.ts`.

- Users get baseline user permissions.
- Admins get all permissions.
- Unknown roles are downgraded to `user`.
- Unknown permission strings are ignored.

## 🛡️ Moderation And Safety

The backend includes first-pass moderation for publishable text:

- reviews
- content suggestions/direct content payloads

The moderation helper lives in:

```text
src/utils/textModeration.ts
```

It normalizes text before matching:

- lowercases
- strips diacritics
- maps common leetspeak characters
- tolerates separators between letters

Reports and contact tickets are intentionally not blocked by the same text guard, because users may need to describe abusive language when reporting it.

## 👁️ Visibility And Soft Delete

Most public reads hide records where:

```ts
isHidden === true
```

Admin reads default to active records but can request:

```text
?visibility=hidden
?visibility=all
```

Shared visibility helpers live in:

```text
src/controllers/controllerUtils.ts
src/utils/resourceUtils.ts
```

## 🖼️ Uploads

Image uploads use:

- Multer memory storage
- MIME + extension validation
- MongoDB GridFS
- generated server-side filenames

Allowed image formats:

```text
PNG, JPG/JPEG, WEBP
```

Uploaded images are served from:

```text
/api/images/:id
```

## 📍 Geocoding

Geocoding uses OpenStreetMap Nominatim:

- forward geocoding for address/city or city-only lookup
- reverse geocoding for display names

Coordinate validation happens before external requests.

## ✅ Testing

Compile TypeScript:

```sh
npm run build
```

Run API tests:

```sh
npm test
```

Run a specific Playwright test:

```sh
npx playwright test e2e/upload-controller.spec.ts
```

Notes:

- API tests use `playwright.config.ts`.
- The config can start the backend for tests.
- Tests require a reachable MongoDB connection for endpoint tests.
- Helper-only tests are preferred when no database is needed.

### What To Test 🧪

- Validators and sanitizers
- Access-control helpers
- Upload validation
- Soft-delete visibility behavior
- Auth/session behavior
- Moderation helpers
- Review/report workflows when changed

## 🌿 Branches And PRs

Recommended branch naming:

```text
feature/<short-description>
fix/<short-description>
chore/<short-description>
docs/<short-description>
refactor/<short-description>
```

Examples:

```text
feature/review-author-avatar
fix/restricted-user-login
docs/backend-readme
```

### PR Checklist ✅

Before opening a PR:

- Pull the latest base branch.
- Keep the PR focused.
- Add or update tests for backend behavior changes.
- Run `npm run build`.
- Run relevant Playwright tests when possible.
- Document any tests you could not run.
- Do not commit `.env`, `dist/`, `playwright-report/`, or `test-results/`.
- Avoid mixing formatting-only changes with feature changes.

### Commit Style 📝

Use clear imperative commit messages:

```text
Block restricted users from login
Add review text moderation
Document backend architecture
```

## 🚢 Operational Notes

### Swagger 📖

Swagger UI is served at:

```text
/api/docs
```

The OpenAPI base URL uses `API_BASE_URL`, falling back to:

```text
http://localhost:4000/api
```

### Default Admin User 👑

On startup, the backend can create or repair a default admin user from `ADMIN_*` environment variables. This is idempotent and should be safe across restarts.

### Rate Limiting ⏱️

Rate limiting is currently in-memory per Node process. This is fine for local development and simple deployments. If the backend is horizontally scaled, replace it or wrap it with a shared store such as Redis.

### Production Cookies 🍪

In production, auth cookies use:

```text
SameSite=None
Secure=true
```

That means production must run over HTTPS and CORS must allow the deployed frontend origin.

### Error Handling ⚠️

- Validation errors should return `400`.
- Auth/domain errors should use explicit status codes through `AuthServiceError` or controller checks.
- Unexpected errors should return `500` with generic client-facing messages.
- Do not leak internal stack traces or database errors to clients.
