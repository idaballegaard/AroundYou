# AroundYou 🌍

AroundYou is a full-stack platform for discovering Danish cities, events, and attractions. Users can search experiences, view maps, write reviews, suggest new content, manage their profile, and contact admins. Admins can moderate suggestions, records, reports, and contact tickets.

## 📚 Documentation

- Frontend guide: [`frontend/around-you/README.md`](frontend/around-you/README.md)
- Backend guide: [`backend/README.md`](backend/README.md)

## 🧰 Tech Stack

### Frontend 🎨

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- Tailwind CSS
- Leaflet
- Vitest
- Playwright

### Backend 🛠️

- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- Joi
- JWT + HttpOnly cookies
- Multer + GridFS
- Swagger
- Playwright API tests

## 🗂️ Repository Structure

```text
AroundYou/
  backend/
    src/
      controllers/       HTTP request/response handlers
      services/          Business logic and side effects
      routes/            Express route wiring
      middleware/        Auth, permissions, rate limits
      models/            Mongoose schemas
      validators/        Joi validation
      utils/             Shared backend helpers
      docs/              Swagger annotations
    e2e/                 Backend API/helper tests
    README.md            Backend documentation

  frontend/
    around-you/
      src/
        api/             Frontend API clients
        components/      Vue UI components
        composables/     Feature state and view logic
        views/           Page components
        router/          Routes
        stores/          Pinia stores
        types/           Shared frontend types
        utils/           Small frontend helpers
        __tests__/       Vitest tests
      README.md          Frontend documentation

  readme.md              Project-level guide
```

## 🚀 Local Development

Install dependencies in both apps:

```sh
cd backend
npm install

cd ../frontend/around-you
npm install
```

Start both apps from the frontend folder:

```sh
cd frontend/around-you
npm run dev:all
```

Or start them separately:

```sh
# Backend
cd backend
npm run start-dev

# Frontend
cd frontend/around-you
npm run dev
```

Local URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:4000/api
Swagger:  http://localhost:4000/api/docs
```

## 🔐 Environment Setup

### Frontend

`frontend/around-you/.env.development`:

```sh
VITE_API_BASE_URL=http://localhost:4000/api
```

### Backend

`backend/.env`:

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

`backend/.env.development`:

```sh
API_BASE_URL=http://localhost:4000/api
FRONTEND_ORIGIN=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Never commit real `.env` secrets.

## 📜 Common Commands

### Frontend

```sh
cd frontend/around-you
npm run dev
npm run build
npm run type-check
npm run test
npm run test:e2e
```

### Backend

```sh
cd backend
npm run start-dev
npm run build
npm test
```

Use **npm** everywhere. Both apps use `package-lock.json`; do not add pnpm/yarn lockfiles.

## ✍️ Code Style

### General

- Keep changes focused and easy to review.
- Prefer existing patterns before creating new abstractions.
- Add comments when behavior is security-sensitive, moderation-related, or not obvious from the function name.
- Avoid comments that just repeat the code.
- Keep user-facing copy in Danish.

### Frontend

- Views should mostly compose components and composables.
- Composables own state, async work, mutations, and derived behavior.
- API calls belong in `src/api`.
- Shared response mapping belongs in `src/api/helpers`.
- Components should have typed props/emits/models.

### Backend

- Routes define URL wiring and middleware order.
- Controllers handle HTTP concerns.
- Services own business behavior and side effects.
- Validators sanitize and validate request payloads.
- Models define persistence rules.
- Utils hold small reusable helpers.

## ✅ Testing Expectations

Before opening a PR, run the checks relevant to your change.

Frontend:

```sh
cd frontend/around-you
npm run type-check
npm run test
```

Backend:

```sh
cd backend
npm run build
```

Run targeted tests when changing tested behavior:

```sh
# Frontend example
npm test -- useReviewSection

# Backend example
npx playwright test e2e/upload-controller.spec.ts
```

If a test cannot be run because of local setup, mention that in the PR.

## 🌿 Branches

Use short, descriptive branch names:

```text
feature/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
refactor/<short-description>
```

Examples:

```text
feature/review-author-avatar
fix/restricted-user-login
docs/project-readmes
```

## 🔀 Pull Requests

PRs should be focused and reviewable.

Checklist:

- Pull/rebase from the latest base branch before opening.
- Describe what changed and why.
- Include screenshots for UI changes.
- Mention backend/API contract changes.
- Run relevant checks and list them in the PR.
- Mention checks that were skipped and why.
- Keep generated files and local artifacts out of commits.
- Do not commit `.env`, `dist/`, `playwright-report/`, or `test-results/`.

Suggested PR format:

```md
## What changed
- ...

## Why
- ...

## Testing
- [x] npm run type-check
- [x] npm run build
- [ ] Not run: ...

## Screenshots
...
```

## 🧭 Feature Areas

- **Search and maps**: public discovery of cities, events, and attractions
- **Details**: pages for single city/event/attraction records
- **Reviews**: create, edit, like, report, and moderate reviews
- **Create content**: user suggestions and admin direct content creation
- **Admin panel**: content management, suggestions, reports, contact tickets
- **Profile**: profile editing, avatar upload, account restriction
- **Auth**: JWT plus HttpOnly cookie session recovery
- **Moderation**: text guard for publishable review/content text and admin report workflows

## 🚢 Deployment Notes

Frontend deploy env:

```sh
VITE_API_BASE_URL=<backend-api-url>/api
```

Backend deploy env:

```sh
API_BASE_URL=<backend-api-url>/api
FRONTEND_ORIGIN=<frontend-url>
CORS_ORIGINS=<frontend-url>
```

Production auth cookies require HTTPS because they use secure cross-site cookie settings.

## 🧯 Troubleshooting

### Frontend cannot reach backend

Check:

```sh
VITE_API_BASE_URL=http://localhost:4000/api
```

Confirm backend is running:

```sh
cd backend
npm run start-dev
```

### Backend cannot connect to MongoDB

Check:

```sh
DBHOST=<mongodb connection string>
```

Then restart the backend.

### Playwright tests take too long

Some Playwright configs start a dev server. For helper-only changes, prefer targeted tests where possible. If the server setup is the blocker, document that in the PR and at minimum run TypeScript build/type-check.
