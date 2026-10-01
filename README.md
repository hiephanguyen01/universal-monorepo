# Universal Monorepo

Production-oriented foundation for **Web + Mobile + API** without assuming Booking, Marketplace, SaaS, or any other business domain.

## Stack

- pnpm workspace + Turborepo
- Web: Next.js 16.3.8, React 19.2, Tailwind CSS 4, TanStack Query
- Mobile: Expo SDK 57, React Native 0.86, Expo Router, SecureStore
- API: NestJS 12, PostgreSQL, Prisma ORM 7
- Shared: types, Zod schemas, fetch-based API client

## Architecture

```text
apps/web      UI -> feature/query hooks -> @repo/api-client
apps/mobile   UI -> feature/query hooks -> @repo/api-client
apps/api      presentation -> application -> domain
                         infrastructure implements ports
packages/*    contracts and cross-platform utilities
```

Backend domain code has no NestJS or Prisma dependency. Prisma adapters implement repository ports. The first vertical slice is Authentication + Current User.

## Folder structure

```text
apps/
  api/
  mobile/
  web/
packages/
  api-client/
  constants/
  schemas/
  types/
  typescript-config/
  utils/
```

## Start locally

```bash
cp .env.example .env
corepack enable
pnpm install
pnpm docker:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Web: <http://localhost:3000>
API: <http://localhost:3001/api/v1>
Swagger: <http://localhost:3001/api/docs>

For a physical phone, set `EXPO_PUBLIC_API_URL` to your computer's LAN IP instead of `localhost`.

## Commands

```bash
pnpm dev
pnpm dev:web
pnpm dev:api
pnpm dev:mobile
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
pnpm docker:up
pnpm docker:down
```

## Auth flow

```text
Web/Mobile -> shared ApiClient -> Nest Controller -> UseCase
                                      -> UserRepository port -> PrismaUserRepository
                                      -> PasswordHasher port -> Argon2
                                      -> TokenService port -> JWT
```

Refresh tokens are rotated. The database stores only an Argon2 hash of each refresh token. Mobile stores tokens in SecureStore.

### Web token note

The included Web adapter uses `localStorage` so the starter is easy to understand and run. For an internet-facing production app, move the refresh token to a `Secure`, `HttpOnly`, `SameSite` cookie via a Next.js BFF/session endpoint; the `TokenStorage` abstraction is intentionally designed so that storage strategy can be replaced without changing the shared API client.

## Current business scope

There is intentionally no Booking, Marketplace, subscription, multi-tenancy, CQRS, Kafka, Redis, or microservices logic. Add business modules only when requirements need them.
