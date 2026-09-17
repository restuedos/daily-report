export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [reports, notes] = await Promise.all([
    prisma.dailyReport.count({ where: { ownerUserId: userId } }),
    prisma.deliveryNote.count({ where: { ownerUserId: userId } }),
  ]);

  const latest = await prisma.dailyReport.findMany({
    where: { ownerUserId: userId },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Overview</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">
            Halo, {session?.user?.name}
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Isi formulir daily report atau surat jalan, simpan otomatis, lalu unduh sebagai PDF atau DOCX.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <div className="text-sm text-[var(--muted)]">Daily Reports</div>
            <div className="mt-2 text-3xl font-semibold">{reports}</div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-[var(--muted)]">Surat Jalan</div>
            <div className="mt-2 text-3xl font-semibold">{notes}</div>
          </div>
          <div className="card flex flex-col justify-center gap-2 p-5">
            <Link className="btn btn-primary" href="/reports/new">
              Buat Daily Report
            </Link>
            <Link className="btn btn-ghost" href="/delivery-notes/new">
              Buat Surat Jalan
            </Link>
          </div>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Report terbaru</h2>
            <Link className="text-sm font-semibold text-[var(--accent)]" href="/reports">
              Lihat semua
            </Link>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {latest.length === 0 && (
              <p className="py-6 text-sm text-[var(--muted)]">Belum ada report. Mulai dengan membuat yang baru.</p>
            )}
            {latest.map((r) => (
              <Link key={r.id} href={`/reports/${r.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-white/40">
                <div>
                  <div className="font-semibold">{r.projectName}</div>
                  <div className="text-sm text-[var(--muted)]">
                    #{r.reportNo} · {format(r.reportDate, "d MMM yyyy", { locale: localeId })}
                  </div>
                </div>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                  {r.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
