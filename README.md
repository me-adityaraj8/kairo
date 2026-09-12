# Kairo

Turn your real-world tasks into quests. Complete them, earn XP and gold, level up your character and attributes, and keep a daily streak going. Built for Tech Zephyr 4.0.

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

Copy `.env.example` to `.env` first and fill in:

- `DATABASE_URL` - your Neon connection string
- `NEXTAUTH_SECRET` - any random string (`openssl rand -base64 32`)
- `NEXTAUTH_URL` - `http://localhost:3000` for local dev

App runs at `http://localhost:3000`.

## Deploy

Push to Vercel, set the same three env vars in project settings, point `NEXTAUTH_URL` at the deployed domain.

Live URL: TODO
Demo video: TODO
