export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default async function DeliveryNotesPage() {
  const session = await auth();
  const notes = await prisma.deliveryNote.findMany({
    where: { ownerUserId: session!.user!.id },
    orderBy: { noteDate: "desc" },
  });

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Surat Jalan</h1>
        <Link className="btn btn-primary" href="/delivery-notes/new">
          Buat baru
        </Link>
      </div>
      <div className="card divide-y divide-[var(--line)]">
        {notes.length === 0 && <p className="p-6 text-sm text-[var(--muted)]">Belum ada data.</p>}
        {notes.map((n) => (
          <div key={n.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/delivery-notes/${n.id}`} className="font-semibold hover:underline">
                {n.noteNumber}
              </Link>
              <div className="text-sm text-[var(--muted)]">
                {n.receiverName} · {format(n.noteDate, "d MMM yyyy", { locale: localeId })}
              </div>
            </div>
            <div className="flex gap-2">
              <a className="btn btn-ghost" href={`/api/delivery-notes/${n.id}/export?format=pdf`}>
                PDF
              </a>
              <Link className="btn btn-ghost" href={`/delivery-notes/${n.id}`}>
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
