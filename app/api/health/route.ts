import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Deployment diagnostics. Reports config shape and connectivity, never secrets. */
export async function GET() {
  const raw = process.env.DATABASE_URL;

  const config = {
    hasDatabaseUrl: !!raw,
    looksLikePostgresUrl: !!raw && /^postgres(ql)?:\/\//.test(raw.trim()),
    containsKeyPrefix: !!raw && /^\s*[A-Z_]+=/.test(raw),
    host: "unknown",
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrlValid: false,
  };

  if (raw) {
    try {
      config.host = new URL(raw.trim()).host;
    } catch {
      config.host = "unparseable";
    }
  }

  try {
    if (process.env.NEXTAUTH_URL) {
      new URL(process.env.NEXTAUTH_URL.trim());
      config.nextAuthUrlValid = true;
    }
  } catch {
    config.nextAuthUrlValid = false;
  }

  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, config, dbLatencyMs: Date.now() - startedAt });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        config,
        dbLatencyMs: Date.now() - startedAt,
        dbError: err instanceof Error ? err.message.split("\n")[0].slice(0, 300) : "unknown",
      },
      { status: 503 }
    );
  }
}
