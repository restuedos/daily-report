import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildDeliveryNoteContext, renderTemplate } from "@/lib/render-template";
import { htmlToPdf } from "@/lib/export/pdf";
import { htmlToDocx } from "@/lib/export/docx";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format") || "pdf";

  const note = await prisma.deliveryNote.findFirst({
    where: { id, ownerUserId: session.user.id },
  });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const template = await prisma.documentTemplate.findFirst({
    where: { type: "DELIVERY_NOTE", isActive: true },
  });
  if (!template) {
    return NextResponse.json({ error: "No active template" }, { status: 400 });
  }

  const context = await buildDeliveryNoteContext(note);
  const html = renderTemplate(template, context);

  if (format === "html") {
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (format === "docx") {
    const buf = await htmlToDocx(html);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="surat-jalan-${note.noteNumber}.docx"`,
      },
    });
  }

  const pdf = await htmlToPdf(html);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="surat-jalan-${note.noteNumber}.pdf"`,
    },
  });
}
