import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DAILY_REPORT_PLACEHOLDERS,
  DELIVERY_NOTE_PLACEHOLDERS,
} from "@/lib/template-defaults";

type Params = { params: Promise<{ id: string }> };

function requireAdmin(role?: string) {
  return role === "ADMIN";
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const template = await prisma.documentTemplate.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    template,
    defaults:
      template.type === "DAILY_REPORT"
        ? DAILY_REPORT_PLACEHOLDERS
        : DELIVERY_NOTE_PLACEHOLDERS,
    placeholders:
      Array.isArray(template.placeholders) && template.placeholders.length
        ? template.placeholders
        : template.type === "DAILY_REPORT"
          ? DAILY_REPORT_PLACEHOLDERS
          : DELIVERY_NOTE_PLACEHOLDERS,
  });
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  html: z.string().min(1).optional(),
  css: z.string().optional(),
  isActive: z.boolean().optional(),
  placeholders: z.array(z.string().min(1)).optional(),
});

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await prisma.documentTemplate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const template = await prisma.$transaction(async (tx) => {
    if (parsed.data.isActive) {
      await tx.documentTemplate.updateMany({
        where: { type: existing.type, NOT: { id } },
        data: { isActive: false },
      });
    }
    return tx.documentTemplate.update({
      where: { id },
      data: {
        name: parsed.data.name,
        html: parsed.data.html,
        css: parsed.data.css,
        isActive: parsed.data.isActive,
        ...(parsed.data.placeholders
          ? { placeholders: parsed.data.placeholders }
          : {}),
        version: { increment: 1 },
        updatedById: session.user.id,
      },
    });
  });

  return NextResponse.json({
    template,
    defaults:
      existing.type === "DAILY_REPORT"
        ? DAILY_REPORT_PLACEHOLDERS
        : DELIVERY_NOTE_PLACEHOLDERS,
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await prisma.documentTemplate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.isActive) {
    return NextResponse.json({ error: "Deactivate before delete" }, { status: 400 });
  }
  await prisma.documentTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
