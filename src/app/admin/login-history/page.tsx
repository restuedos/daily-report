export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default async function LoginHistoryPage() {
  const history = await prisma.loginHistory.findMany({
    orderBy: { loggedAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Login History</h1>
        <p className="text-sm text-[var(--muted)]">Hanya terlihat oleh admin.</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--accent-soft)] text-left">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Device / UA</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 whitespace-nowrap">
                  {format(h.loggedAt, "d MMM yyyy HH:mm", { locale: localeId })}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{h.user.name}</div>
                  <div className="text-[var(--muted)]">{h.user.email}</div>
                </td>
                <td className="px-4 py-3">{h.ip || "-"}</td>
                <td className="px-4 py-3 max-w-md truncate">{h.userAgent || h.device || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
