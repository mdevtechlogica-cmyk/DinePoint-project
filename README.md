# DinePoint

Restaurant reservations, floor management, and kitchen display.

```
DinePoint/
├── apps/
│   ├── api/                        # NestJS backend
│   ├── web/                        # Owner console + diner booking web
│   └── mobile/                     # Flutter workspace
│       ├── host_stand/             # Reception and floor management
│       ├── captain/                # Waiter and order management
│       └── kitchen/                # Kitchen display
├── packages/
│   ├── design-tokens/              # Shared colours, spacing, typography
│   ├── api-types/                  # Generated API contract/types
│   └── ui-web/                     # Reusable web components
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── docs/
│   ├── architecture/
│   ├── api/
│   └── product/
└── .github/workflows/              # CI checks
```

JavaScript packages are a [pnpm](https://pnpm.io) workspace. Flutter apps live under `apps/mobile` and are not part of that workspace.

## Setup

```bash
pnpm install
cp .env.example apps/api/.env
```

Fill in `apps/api/.env`. The API still installs from `apps/api/package-lock.json` until the root lockfile is generated.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev:api` | Start the NestJS API in watch mode |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:migrate` | Apply a development migration |
| `pnpm db:seed` | Run `prisma/seed.ts` |
| `pnpm test` | Run tests in every workspace package that defines them |

Prisma commands run inside `apps/api`. The schema and migrations live at the repo root, and `apps/api/prisma.config.ts` points at them.
