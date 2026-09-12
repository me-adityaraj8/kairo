import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

    const quest = await prisma.quest.findUnique({ where: { id: params.id } });
    if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    if (quest.userId !== user.id) {
      return NextResponse.json({ error: "Not your quest" }, { status: 403 });
    }

    await prisma.quest.delete({ where: { id: quest.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("quest delete failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
