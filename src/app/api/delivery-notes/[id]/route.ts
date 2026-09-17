import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deliveryNoteSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const note = await prisma.deliveryNote.findFirst({
    where: { id, ownerUserId: session.user.id },
  });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ note });
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.deliveryNote.findFirst({
    where: { id, ownerUserId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = deliveryNoteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const note = await prisma.deliveryNote.update({
    where: { id },
    data: {
      noteNumber: data.noteNumber,
      noteDate: new Date(data.noteDate),
      senderName: data.senderName,
      receiverName: data.receiverName,
      driverName: data.driverName,
      vehicleInfo: data.vehicleInfo,
      notes: data.notes,
      signerName: data.signerName,
      signatureKey: data.signatureKey,
      items: data.items,
    },
  });
  return NextResponse.json({ note });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.deliveryNote.findFirst({
    where: { id, ownerUserId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.deliveryNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
