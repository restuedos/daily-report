export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/db";

export default async function TemplatesPage() {
  const templates = await prisma.documentTemplate.findMany({
    orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Template Editor</h1>
        <p className="text-sm text-[var(--muted)]">
          Template HTML disimpan di database dan dipakai untuk export PDF/DOCX.
        </p>
      </div>
      <div className="card divide-y divide-[var(--line)]">
        {templates.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-semibold">{t.name}</div>
              <div className="text-sm text-[var(--muted)]">
                {t.type} · v{t.version} {t.isActive ? "· aktif" : ""}
              </div>
            </div>
            <Link className="btn btn-primary" href={`/templates/${t.id}`}>
              Edit
            </Link>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
