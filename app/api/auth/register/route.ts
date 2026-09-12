import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SPECIES, DEFAULT_SPECIES, speciesOf } from "@/lib/characters";

const ATTRIBUTES = ["Intellect", "Strength", "Discipline", "Vitality"];

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).max(40),
  // an unknown id would render as the default anyway; reject it here so the
  // stored value always means something
  species: z.enum(SPECIES.map((s) => s.id) as [string, ...string[]]).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid registration details" }, { status: 400 });
    }

    const { email, password, displayName, species } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        attributes: { create: ATTRIBUTES.map((name) => ({ name })) },
        companion: {
          create: (() => {
            const pick = speciesOf(species ?? DEFAULT_SPECIES);
            return { species: pick.id, name: pick.name };
          })(),
        },
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("register failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
