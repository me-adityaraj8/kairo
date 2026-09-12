import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const item = await prisma.item.findUnique({ where: { slug: params.slug } });
    if (!item) return NextResponse.json({ error: "No such item" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

      const existing = await tx.inventory.findUnique({
        where: { userId_itemId: { userId: user.id, itemId: item.id } },
      });
      if (existing) return { error: "You already own that" };
      if (user.gold < item.cost) return { error: "Not enough gold" };

      const updated = await tx.user.update({
        where: { id: user.id },
        data: { gold: user.gold - item.cost },
      });
      await tx.inventory.create({ data: { userId: user.id, itemId: item.id } });

      return { gold: updated.gold };
    }, { timeout: 20000, maxWait: 15000 });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      gold: result.gold,
      item: { slug: item.slug, name: item.name, payload: item.payload },
    });
  } catch (err) {
    console.error("purchase failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
