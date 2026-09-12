import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { BOND, moodFrom, nextStage, stageForBond, stageMeta } from "@/lib/companion";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(20).optional(),
  personality: z.enum(["ENERGETIC", "CALM", "PLAYFUL", "GRUMPY", "CHAOTIC"]).optional(),
  interact: z.boolean().optional(),
});

async function ensureCompanion(userId: string) {
  const existing = await prisma.companion.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.companion.create({ data: { userId } });
}

function shape(c: { name: string; species: string; personality: string; stage: string; bond: number; lastInteracted: Date }, focusActive: boolean) {
  const meta = stageMeta(c.stage);
  const upcoming = nextStage(c.stage);
  return {
    name: c.name,
    species: c.species,
    personality: c.personality,
    stage: c.stage,
    stageTitle: meta.title,
    face: meta.face,
    tint: meta.tint,
    bond: c.bond,
    nextStage: upcoming ? { stage: upcoming.stage, title: upcoming.title, bond: upcoming.bond } : null,
    mood: moodFrom({ lastInteracted: c.lastInteracted, focusActive }),
  };
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const companion = await ensureCompanion(user.id);
    const focusActive = await prisma.focusSession.count({
      where: { userId: user.id, completedAt: null },
    });

    return NextResponse.json({ companion: shape(companion, focusActive > 0) });
  } catch (err) {
    console.error("companion fetch failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid companion update" }, { status: 400 });

    await ensureCompanion(user.id);

    const data: Record<string, unknown> = {};
    if (parsed.data.name) data.name = parsed.data.name;
    if (parsed.data.personality) data.personality = parsed.data.personality;

    if (parsed.data.interact) {
      const current = await prisma.companion.findUniqueOrThrow({ where: { userId: user.id } });
      const bond = current.bond + BOND.interact;
      data.bond = bond;
      data.stage = stageForBond(bond);
      data.lastInteracted = new Date();
    }

    const companion = await prisma.companion.update({ where: { userId: user.id }, data });
    return NextResponse.json({ companion: shape(companion, false) });
  } catch (err) {
    console.error("companion update failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
