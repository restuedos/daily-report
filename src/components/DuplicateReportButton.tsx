"use client";

import { useRouter } from "next/navigation";

export function DuplicateReportButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="btn btn-ghost"
      type="button"
      onClick={async () => {
        const res = await fetch(`/api/reports/${id}/duplicate`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.report?.id) router.push(`/reports/${data.report.id}`);
      }}
    >
      Duplikat
    </button>
  );
}
