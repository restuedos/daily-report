export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DeliveryNoteForm } from "@/components/DeliveryNoteForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function EditDeliveryNotePage({ params }: Props) {
  const session = await auth();
  const { id } = await params;
  const note = await prisma.deliveryNote.findFirst({
    where: { id, ownerUserId: session!.user!.id },
  });
  if (!note) notFound();

  const items = Array.isArray(note.items)
    ? (note.items as { name?: string; qty?: string | number; unit?: string; note?: string }[]).map(
        (i) => ({
          name: i.name || "",
          qty: String(i.qty ?? "1"),
          unit: i.unit || "",
          note: i.note || "",
        }),
      )
    : [];

  return (
    <AppShell>
      <DeliveryNoteForm
        noteId={note.id}
        initial={{
          noteNumber: note.noteNumber,
          noteDate: note.noteDate.toISOString().slice(0, 10),
          senderName: note.senderName,
          receiverName: note.receiverName,
          driverName: note.driverName || "",
          vehicleInfo: note.vehicleInfo || "",
          notes: note.notes || "",
          signerName: note.signerName || "",
          signatureKey: note.signatureKey || "",
          items: items.length ? items : [{ name: "", qty: "1", unit: "", note: "" }],
        }}
      />
    </AppShell>
  );
}
