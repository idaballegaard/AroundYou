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
