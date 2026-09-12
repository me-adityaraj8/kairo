import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const equipSchema = z.object({
  slug: z.string().min(1),
  equipped: z.boolean(),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const rows = await prisma.inventory.findMany({
      where: { userId: user.id },
      include: { item: true },
      orderBy: { item: { cost: "desc" } },
    });

    return NextResponse.json({
      items: rows.map((r) => ({
        slug: r.item.slug,
        name: r.item.name,
        payload: r.item.payload,
        rarity: r.item.rarity,
        slot: r.item.slot,
        cost: r.item.cost,
        equipped: r.equipped,
      })),
    });
  } catch (err) {
    console.error("inventory fetch failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

/** Equip or unequip. One item per slot stays equipped. */
export async function PATCH(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const parsed = equipSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const item = await prisma.item.findUnique({ where: { slug: parsed.data.slug } });
    if (!item) return NextResponse.json({ error: "No such item" }, { status: 404 });

    const owned = await prisma.inventory.findUnique({
      where: { userId_itemId: { userId: sessionUser.id, itemId: item.id } },
    });
    if (!owned) return NextResponse.json({ error: "You do not own that" }, { status: 403 });

    if (parsed.data.equipped) {
      // clear the slot first so only one item occupies it
      await prisma.inventory.updateMany({
        where: { userId: sessionUser.id, item: { slot: item.slot }, equipped: true },
        data: { equipped: false },
      });
    }

    await prisma.inventory.update({
      where: { id: owned.id },
      data: { equipped: parsed.data.equipped },
    });

    const rows = await prisma.inventory.findMany({
      where: { userId: sessionUser.id },
      include: { item: true },
    });

    return NextResponse.json({
      items: rows.map((r) => ({
        slug: r.item.slug,
        name: r.item.name,
        payload: r.item.payload,
        rarity: r.item.rarity,
        slot: r.item.slot,
        cost: r.item.cost,
        equipped: r.equipped,
      })),
    });
  } catch (err) {
    console.error("equip failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
