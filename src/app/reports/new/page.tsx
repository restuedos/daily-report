export const dynamic = "force-dynamic";

import { AppShell } from "@/components/AppShell";
import { ReportForm } from "@/components/ReportForm";

export default function NewReportPage() {
  return (
    <AppShell>
      <ReportForm />
    </AppShell>
  );
}
