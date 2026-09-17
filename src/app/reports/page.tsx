export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { DuplicateReportButton } from "@/components/DuplicateReportButton";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default async function ReportsPage() {
  const session = await auth();
  const reports = await prisma.dailyReport.findMany({
    where: { ownerUserId: session!.user!.id },
    orderBy: { reportDate: "desc" },
  });

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Daily Reports</h1>
        <Link className="btn btn-primary" href="/reports/new">
          Buat baru
        </Link>
      </div>
      <div className="card divide-y divide-[var(--line)]">
        {reports.length === 0 && <p className="p-6 text-sm text-[var(--muted)]">Belum ada data.</p>}
        {reports.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <Link href={`/reports/${r.id}`} className="font-semibold hover:underline">
                {r.projectName}
              </Link>
              <div className="text-sm text-[var(--muted)]">
                #{r.reportNo} · {r.clientName} ·{" "}
                {format(r.reportDate, "d MMM yyyy", { locale: localeId })}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <DuplicateReportButton id={r.id} />
              <a className="btn btn-ghost" href={`/api/reports/${r.id}/export?format=pdf`}>
                PDF
              </a>
              <Link className="btn btn-ghost" href={`/reports/${r.id}`}>
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
