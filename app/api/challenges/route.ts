import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { challengesFor } from "@/lib/challenges";
import { todayUTC } from "@/lib/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const day = todayUTC();
    const defs = challengesFor(user.id, day);
    const rows = await prisma.dailyChallenge.findMany({ where: { userId: user.id, day } });
    const byKey = new Map(rows.map((r) => [r.key, r]));

    return NextResponse.json({
      day,
      challenges: defs.map((def) => {
        const row = byKey.get(def.key);
        const progress = Math.min(row?.progress ?? 0, def.target);
        return {
          key: def.key,
          title: def.title,
          icon: def.icon,
          target: def.target,
          gold: def.gold,
          progress,
          complete: progress >= def.target,
        };
      }),
    });
  } catch (err) {
    console.error("challenges fetch failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
