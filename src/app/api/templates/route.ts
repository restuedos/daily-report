import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DAILY_REPORT_PLACEHOLDERS,
  DELIVERY_NOTE_PLACEHOLDERS,
} from "@/lib/template-defaults";

function requireAdmin(role?: string) {
  return role === "ADMIN";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await prisma.documentTemplate.findMany({
    orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json({
    templates,
    placeholderSets: {
      DAILY_REPORT: DAILY_REPORT_PLACEHOLDERS,
      DELIVERY_NOTE: DELIVERY_NOTE_PLACEHOLDERS,
    },
  });
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["DAILY_REPORT", "DELIVERY_NOTE"]),
  html: z.string().min(1),
  css: z.string().default(""),
  isActive: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const placeholders =
    parsed.data.type === "DAILY_REPORT"
      ? DAILY_REPORT_PLACEHOLDERS
      : DELIVERY_NOTE_PLACEHOLDERS;

  const template = await prisma.$transaction(async (tx) => {
    if (parsed.data.isActive) {
      await tx.documentTemplate.updateMany({
        where: { type: parsed.data.type },
        data: { isActive: false },
      });
    }
    return tx.documentTemplate.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        html: parsed.data.html,
        css: parsed.data.css,
        placeholders,
        isActive: parsed.data.isActive ?? false,
        updatedById: session.user.id,
      },
    });
  });

  return NextResponse.json({ template }, { status: 201 });
}
