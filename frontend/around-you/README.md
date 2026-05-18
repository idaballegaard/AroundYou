# AroundYou Frontend 🌍

Vue 3 + Vite frontend for AroundYou. The app lets users discover Danish cities, events, and attractions, submit reviews, suggest new content, manage profiles, and gives admins moderation tools.

## 📚 Table Of Contents

- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Project Structure](#-project-structure)
- [How We Write Frontend Code](#-how-we-write-frontend-code)
- [Testing](#-testing)
- [Branches And PRs](#-branches-and-prs)
- [Troubleshooting](#-troubleshooting)

## 🧰 Tech Stack

- **Vue 3** with `<script setup>` and Composition API
- **Vite** for local development and production builds
- **TypeScript** for typed API contracts, composables, and props
- **Vue Router** for page routing
- **Pinia** for store-like shared state where needed
- **Tailwind CSS** through the Vite plugin
- **Leaflet** for maps
- **Vitest** for unit/composable tests
- **Playwright** for browser tests

## 🚀 Getting Started

Install dependencies from this folder:

```sh
cd frontend/around-you
npm install
```

Start the frontend only:

```sh
npm run dev
```

Start frontend and backend together:

```sh
npm run dev:all
```

The local app runs on:

```text
http://localhost:5173
```

## 🔐 Environment Variables

Create or update `.env.development`:

```sh
VITE_API_BASE_URL=http://localhost:4000/api
```

Notes:

- In development, Vite also proxies `/api` to `http://localhost:4000`.
- In production, `VITE_API_BASE_URL` is required by `vite.config.ts`.
- Do not commit real secrets. Frontend env variables are public after build.

## 📜 Scripts

```sh
npm run dev          # Start Vite dev server
npm run dev:all      # Start frontend and backend together
npm run build        # Type-check and build production assets
npm run type-check   # Run vue-tsc
npm run test         # Run Vitest once
npm run test:unit    # Run Vitest in watch mode
npm run test:e2e     # Run Playwright browser tests
npm run lint         # Run ESLint
npm run format       # Format src/ with Prettier
npm run preview      # Preview the production build
```

Use **npm** for this project. The repository has `package-lock.json`; do not use pnpm/yarn lockfiles.

## 🗂️ Project Structure

```text
src/
  admin/                  Admin collection configuration
  api/                    HTTP wrappers and backend API modules
    helpers/              API response mappers and payload normalizers
  assets/                 Static frontend assets imported by Vue
  components/             Reusable UI components
    admin/                Admin panel components
    contact/              Contact ticket UI
    create-content/       Create/suggest content form pieces
    detail/               City/event/attraction detail sections
    map/                  Leaflet map component and helpers
    navbar/               Navigation components
    profile/              User profile components
    reviews/              Review form/list/report UI
    search-filter/        Search filter controls
  composables/            Feature state and business logic for views
    admin/                Admin data lifecycle and form helpers
    auth/                 Login/register view logic
    contact/              Contact ticket form logic
    detail/               Detail page loading and derived state
    profile/              Profile update/avatar/delete flow
    reviews/              Review create/edit/report/like flow
    search/               Search result loading and map coordination
    search-filter/        Filter draft/dropdown/calendar state
    useCreateContent/     Create-content form/image/submit flow
  constants/              App constants and URL helpers
  router/                 Route definitions and guards
  stores/                 Pinia stores
  types/                  Shared TypeScript types
  utils/                  Small pure helpers
  views/                  Page-level Vue components
  __tests__/              Vitest tests
```

## ✍️ How We Write Frontend Code

### Components 🧩

- Keep view files focused on layout and wiring.
- Put non-trivial state transitions in composables.
- Use typed props, emits, and models.
- Prefer existing components and local patterns before adding new abstractions.
- Use Danish for user-facing text.
- Use custom file input labels when browser-native text would appear in English.

### Composables 🧠

- Composables own feature behavior: loading, errors, mutations, derived state, and view callbacks.
- Keep API calls inside `api/` modules, not directly in components.
- Keep comments focused on why a flow exists, not what each line does.
- If a composable grows, split it by responsibility, like `useCreateContentForm`, `useCreateContentImages`, and `useCreateContentSubmit`.

### API Layer 🔌

- `api/http.ts` is the central API wrapper.
- Use `apiRequest` for backend calls.
- Use `jsonHeaders()` for JSON requests.
- Use `apiGetCached()` for short-lived public GET caching.
- Call mutation APIs through modules that clear shared cache when public data may be stale.
- Keep response mapping in `api/helpers` when backend payloads need normalization.

### Styling 🎨

- Styling is utility-first with Tailwind classes.
- Match the existing AroundYou visual language.
- Avoid large unrelated redesigns inside feature PRs.
- Keep responsive behavior explicit in templates.

## ✅ Testing

Run type-checking before opening a PR:

```sh
npm run type-check
```

Run unit/composable tests:

```sh
npm run test
```

Run a specific Vitest file or pattern:

```sh
npm test -- useReviewSection
```

Run browser tests:

```sh
npm run test:e2e
```

Playwright starts the frontend server based on `playwright.config.ts`.

### What To Test 🧪

- Composables with branching behavior
- API mapping helpers
- Validation helpers
- Permission-sensitive UI paths
- Review, profile, admin, and create-content flows when changed

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
docs/frontend-readme
```

### PR Checklist ✅

Before opening a PR:

- Pull the latest base branch.
- Keep the PR focused on one feature/fix.
- Include screenshots for UI changes.
- Run `npm run type-check`.
- Run relevant tests.
- Mention any test you could not run and why.
- Do not commit `.env` files or generated reports.
- Do not mix large refactors with product changes unless needed.

### Commit Style 📝

Use clear imperative commits:

```text
Add review avatar display
Fix restricted user login
Document frontend API layer
```

## 🛠️ Troubleshooting

### API calls go to the wrong backend

Check:

```sh
VITE_API_BASE_URL=http://localhost:4000/api
```

Also confirm the backend is running:

```sh
cd ../../backend
npm run start-dev
```

### TypeScript cannot resolve Vue imports

Run:

```sh
npm install
npm run type-check
```

Use the official Vue language tooling in your editor.

### ESLint command not found

Run `npm install` in `frontend/around-you`. The lint script depends on local dev dependencies.

### Playwright browser missing

Install browsers:

```sh
npx playwright install
```
