import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deliveryNoteSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notes = await prisma.deliveryNote.findMany({
    where: { ownerUserId: session.user.id },
    orderBy: { noteDate: "desc" },
  });
  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = deliveryNoteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const note = await prisma.deliveryNote.create({
    data: {
      ownerUserId: session.user.id,
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
  return NextResponse.json({ note }, { status: 201 });
}
