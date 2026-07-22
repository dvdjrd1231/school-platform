# Backend Architecture

Reference for the MongoDB / API / auth layer added to the platform.

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Database | MongoDB + Mongoose | Required by the project brief |
| Auth | Auth.js (NextAuth v5), JWT sessions | Handles cookies/CSRF correctly; JWT avoids a session lookup per request |
| API | Next.js Route Handlers | No separate Node server to deploy; runs as Vercel functions |
| Real-time | Pusher | Vercel serverless cannot hold WebSocket connections — see below |
| Validation | Zod | Every request body is validated before it reaches the database |
| Tests | Vitest | Fast, native TS |

### Why Pusher instead of Socket.IO

Socket.IO needs a long-running process holding open TCP connections. Vercel
functions are short-lived and may be frozen between invocations, so a Socket.IO
server cannot survive there. All publishing goes through `publish()` in
[`lib/realtime/pusher.ts`](../lib/realtime/pusher.ts) — that single function is
the seam to replace if the app later moves to a long-running Node host, at which
point Socket.IO becomes viable.

## Layout

```
lib/
  db/connect.ts          Cached Mongoose connection (serverless-safe)
  models/                Schemas; import from models/index.ts
  services/grading.ts    Pure grade/GPA/trend maths — unit tested
  services/performance.ts Report aggregation + CSV export
  auth/config.ts         Edge-safe auth config (no DB) — used by middleware
  auth/index.ts          Node-only auth with the Credentials provider
  api/helpers.ts         requireUser / requireRole / parseBody / error mapping
  realtime/              Pusher server publish + browser client
app/api/                 Route handlers
scripts/seed.ts          Seed data
middleware.ts            Route protection
```

### The auth file split matters

`middleware.ts` runs in the **Edge runtime**, where Mongoose cannot run. So the
config is split: `lib/auth/config.ts` holds only what Edge needs (callbacks,
session strategy), while `lib/auth/index.ts` adds the Credentials provider that
touches MongoDB and runs in Node. Merging them breaks the middleware build.

Every route handler that uses Mongoose sets `export const runtime = "nodejs"`.

## Setup

1. `cp .env.example .env.local` and fill in `MONGODB_URI` and `AUTH_SECRET`
   (`openssl rand -base64 32`).
2. `pnpm install`
3. `pnpm seed` — or `pnpm seed:reset` to wipe and reseed.
4. `pnpm dev`

Seeded accounts all use the password `Password123!`:

| Email | Role |
| --- | --- |
| `admin@maatk12.edu` | admin |
| `sarah.johnson@maatk12.edu` | teacher |
| `john.smith@maatk12.edu` | student | 
| `parent@maatk12.edu` | parent (guardian of John Smith + Alex Chen) |

**Change these before any real deployment.**

## Data model

```
User ──< Enrollment >── Course
 │                        │
 │                        └──< Assignment ──< Submission (holds the grade)
 │
 ├──< Conversation >──< Message
 └──< Notification
```

Design decisions worth knowing:

- **Grades live on `Submission`**, not a separate collection. A grade has no
  meaning without its submission, and one document cannot drift from the other.
- **`Submission.course` is denormalised** from the assignment so gradebook and
  dashboard queries don't need a lookup per row.
- **Course modules and lessons are embedded** in `Course`. They're always read
  with the course and never queried alone.
- **Deletes are soft.** Users deactivate, courses archive. Hard deletes would
  orphan submissions and messages.
- **Unique indexes** on `(student, course)` and `(assignment, student)` are the
  real defence against duplicate enrolments and submissions under concurrency;
  the application-level checks only produce friendlier errors.

## API

All routes require a session except `POST /api/register` and `/api/auth/*`.
Unauthenticated API calls get `401` JSON; unauthenticated page loads redirect to
`/signin`.

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/register` | public — creates students only |
| GET/POST | `/api/users` | admin (POST), admin+teacher (GET) |
| GET/PATCH/DELETE | `/api/users/:id` | self, or admin |
| GET/POST | `/api/courses` | scoped by role |
| GET/PATCH/DELETE | `/api/courses/:id` | enrolled/owner/admin |
| GET/POST/DELETE | `/api/courses/:id/enroll` | self-enroll, or staff |
| GET/POST | `/api/assignments` | students see published only |
| GET/POST | `/api/submissions` | students see their own |
| POST | `/api/submissions/:id/grade` | owning teacher, or admin |
| GET | `/api/performance/:studentId` | self, guardian parent, teacher, admin. `?format=csv` exports |
| GET/POST | `/api/conversations` | participants |
| GET/POST | `/api/conversations/:id/messages` | participants |
| POST | `/api/pusher/auth` | private-channel authorisation |

### Security decisions

- `POST /api/register` ignores any `roles` in the body — otherwise anyone could
  register as an admin. Staff accounts come from `POST /api/users` (admin only).
- `PATCH /api/users/:id` rejects `roles`, `status`, and `children` changes from
  non-admins, so a student cannot promote themselves by editing their profile.
- `POST /api/pusher/auth` verifies channel ownership. Without it any signed-in
  user could subscribe to `private-user-<someone-else>` and read their messages.
- Parents can only read performance for students listed in their `children`, and
  can only open conversations with staff.
- Sign-in failures are deliberately indistinguishable between "no such user" and
  "wrong password" to prevent account enumeration.

## Grading rules

Implemented in [`lib/services/grading.ts`](../lib/services/grading.ts), fully
unit tested.

- **Late penalty**: `latePenaltyPerDay` % of the assignment's total points is
  deducted per day late, floored at 0. `rawScore` keeps what the teacher entered
  so the deduction stays auditable; `score` is the value that counts.
- **Weighted categories**: homework 20%, quiz 15%, exam 35%, project 25%,
  participation 5%. Categories with no graded work are **excluded and the
  remaining weights renormalised** — otherwise a student would show a failing
  grade in week one because the final exam hasn't happened.
- **No graded work returns `null`**, not `0`. Render it as "no grade yet".
- **Trend** compares the mean of the first half of results against the second
  half (more stable than first-vs-last), and treats a swing under 2 points as
  noise.

## Testing

```bash
pnpm test           # run once
pnpm test:watch
pnpm test:coverage
pnpm typecheck
```

Coverage currently targets the grading and performance logic — the code where a
bug silently produces a wrong number on a report card. Route handlers are
covered indirectly; integration tests against `mongodb-memory-server` are the
natural next step.

## Deploying to Vercel

Set in **Settings → Environment Variables**: `MONGODB_URI`, `AUTH_SECRET`, and
the four `PUSHER_*` plus two `NEXT_PUBLIC_PUSHER_*` values.

In MongoDB Atlas, allow network access from `0.0.0.0/0` — Vercel's function IPs
are not static. Restrict it with a VPC peering setup if that's unacceptable.

Note `next.config.mjs` still sets `typescript.ignoreBuildErrors: true`. The
backend code added here type-checks cleanly (`pnpm typecheck` shows zero errors
under `lib/`, `app/api/`, `middleware.ts`, `scripts/`), but ~20 pre-existing
errors remain in the older UI pages. That flag should be turned off once those
are fixed, so type errors block the build again.
