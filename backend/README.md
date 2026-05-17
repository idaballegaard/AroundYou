# AroundYou Backend

Express + TypeScript API for AroundYou. The API is mounted below `/api` and uses MongoDB through Mongoose.

## Local Development

Install dependencies from this folder:

```sh
npm install
```

Create `.env` from `.env.example` and fill in the required values:

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

Optional development-only URL settings live in `.env.development`:

```sh
API_BASE_URL=http://localhost:4000/api
FRONTEND_ORIGIN=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Run the API in watch mode:

```sh
npm run start-dev
```

Run type-checking:

```sh
npx tsc --noEmit
```

The Playwright API tests start the backend through `playwright.config.ts`, so they require a reachable MongoDB connection:

```sh
npm test
```

## Folder Responsibilities

- `src/routes`: URL wiring and middleware ordering only.
- `src/controllers`: HTTP adapters. Controllers validate request-level concerns, call services, and shape HTTP responses.
- `src/services`: business operations and side effects that should not live in controllers.
- `src/validators`: Joi request payload schemas.
- `src/models`: Mongoose schemas and models.
- `src/interfaces` and `src/types`: shared TypeScript shapes.
- `src/middleware`: Express middleware for auth, permissions, rate limits, and admin checks.
- `src/docs`: Swagger route annotations. Keep generated/API documentation here rather than in route files.
- `src/utils`: small shared helpers that are not tied to a single feature.

## Auth Model

Login returns a JWT in the response body and also sets an HttpOnly `aroundyou_auth` cookie. The frontend keeps the token in memory, while the cookie lets `/user/me` restore a session after a browser refresh.

Protected endpoints accept either:

- `Authorization: Bearer <token>`
- the HttpOnly `aroundyou_auth` cookie

The cookie and JWT both expire after seven days. Logout clears the cookie through `POST /api/user/logout`.

In production the auth cookie uses `SameSite=None` and `Secure`, so the backend must be served over HTTPS and CORS must allow the deployed frontend origin.

## Swagger

Swagger UI is served at:

```text
/api/docs
```

The OpenAPI base URL comes from `API_BASE_URL`, falling back to `http://localhost:4000/api`.

## Refactor Guidance

When adding backend features, prefer this flow:

1. Add or update request validation in `src/validators`.
2. Put domain work in `src/services`.
3. Keep controllers thin and HTTP-focused.
4. Wire routes in `src/routes`.
5. Add Swagger annotations in `src/docs` when the endpoint is public API surface.

Avoid adding comments for straightforward code. Add comments only where behavior is security-sensitive, has side effects, or is surprising from the function name.

## Request Lifecycle

Most requests follow this path:

1. `src/app.ts` configures CORS, JSON parsing, routes, Swagger, database connection, and default admin bootstrap.
2. `src/routes/routes.ts` mounts all feature route files below `/api`.
3. Feature routes apply middleware in the order needed for the endpoint, typically auth first, then role/permission/rate-limit checks, then the controller.
4. Controllers validate HTTP input and delegate business work to services.
5. Services call Mongoose models and perform side effects such as notification creation.

## Visibility And Soft Delete

Most public resource reads hide records where `isHidden === true`. Admin reads still default to visible records, but admin endpoints can opt into hidden or all records with `?visibility=hidden` or `?visibility=all`.

The shared visibility behavior lives in `controllers/controllerUtils.ts`. Soft-delete metadata is created by `utils/resourceUtils.ts`.

## Content Payloads

City, event, and attraction payloads are sanitized before writes. The sanitizer strips unknown fields, applies defaults, and validates backend schema requirements that must stay aligned with frontend forms.

Shared content payload validation lives in `utils/contentPayload.ts`.

## Rate Limiting

Rate limiting is currently in-memory per Node process. It is useful for local development and simple deployments, but it is not shared across multiple backend instances. If the backend is scaled horizontally, replace or wrap it with a shared store such as Redis.

## Default Admin User

On startup, the backend can create or repair a default admin user from `ADMIN_*` environment variables. This is intentionally idempotent: existing admin records are updated only when role or permissions are incomplete.

## Error Handling

Controllers currently send their own error responses. Validation errors should become `400`, auth/domain service errors should carry explicit status codes, and unexpected errors should become `500` with a generic response. Avoid leaking internal error details to clients.
