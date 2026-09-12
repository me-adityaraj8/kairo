# Kairo

Turn your real-world tasks into quests. Complete them, earn XP and gold, level up your character and four attributes, and keep a daily streak going.

Built for Tech Zephyr 4.0.

Live: TODO
Demo video: TODO

## How it works

Post a quest, tag it to an attribute (Intellect, Strength, Discipline, Vitality) and pick a difficulty. Completing it pays out XP and gold based on that difficulty. XP levels both your account and the attribute you tagged, on a curve of `100 * level^1.5`. Completing at least one quest a day builds a streak, which adds 5% XP per day up to 1.5x. Gold is never multiplied. Spend it in the tavern shop.

All progression is computed server-side. The client sends only a quest id to the complete endpoint - never XP, gold, or difficulty - and the whole payout runs in one transaction.

## Stack

- Next.js 14 (App Router, TypeScript)
- Postgres on Neon + Prisma
- NextAuth (credentials, JWT sessions)
- Tailwind CSS, Framer Motion
- Zod for validation, bcryptjs for password hashing

## Running it locally

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Copy `.env.example` to `.env` first:

- `DATABASE_URL` - Neon pooled connection string
- `DIRECT_URL` - Neon direct connection (no `-pooler`), used for schema pushes
- `NEXTAUTH_SECRET` - random string, `openssl rand -base64 32`
- `NEXTAUTH_URL` - `http://localhost:3000` locally

`prisma/reset.ts` clears all adventurers but keeps the shop items, if you need a clean slate.

## Deploy

Import the repo on Vercel and set the same four variables in project settings, with `NEXTAUTH_URL` pointing at the deployed domain. `prisma generate` runs on install and build, so no extra build config is needed.

## Notes

Lighthouse on `/`: 99 performance, 100 accessibility, 100 best practices, 100 SEO.

Neon's free tier suspends the database after inactivity, so the first request after an idle period takes a few seconds to wake it.
