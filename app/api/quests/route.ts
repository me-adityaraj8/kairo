import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  attributeId: z.string().min(1),
  difficulty: z.enum(["EASY", "NORMAL", "HARD", "EPIC"]),
});

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const filter = new URL(req.url).searchParams.get("filter") ?? "all";
    const where = {
      userId: user.id,
      ...(filter === "active" ? { done: false } : filter === "done" ? { done: true } : {}),
    };

    const quests = await prisma.quest.findMany({
      where,
      include: { attribute: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      quests: quests.map((q) => ({
        id: q.id,
        title: q.title,
        difficulty: q.difficulty,
        attributeId: q.attributeId,
        attributeName: q.attribute.name,
        done: q.done,
        completedAt: q.completedAt,
      })),
    });
  } catch (err) {
    console.error("quests list failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Quest needs a title, attribute and difficulty" }, { status: 400 });
    }

    const attribute = await prisma.attribute.findUnique({
      where: { id: parsed.data.attributeId },
    });
    if (!attribute) return NextResponse.json({ error: "Attribute not found" }, { status: 404 });
    if (attribute.userId !== user.id) {
      return NextResponse.json({ error: "Not your attribute" }, { status: 403 });
    }

    const quest = await prisma.quest.create({
      data: {
        userId: user.id,
        attributeId: attribute.id,
        title: parsed.data.title,
        difficulty: parsed.data.difficulty,
      },
    });

    return NextResponse.json(
      {
        quest: {
          id: quest.id,
          title: quest.title,
          difficulty: quest.difficulty,
          attributeId: quest.attributeId,
          attributeName: attribute.name,
          done: quest.done,
          completedAt: quest.completedAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("quest create failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
