export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ReportForm } from "@/components/ReportForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export default async function EditReportPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;
  const report = await prisma.dailyReport.findFirst({
    where: { id, ownerUserId: session!.user!.id },
    include: { manpower: true, equipment: true, photos: true },
  });
  if (!report) notFound();

  return (
    <AppShell>
      <ReportForm
        reportId={report.id}
        initial={{
          projectNo: report.projectNo,
          projectName: report.projectName,
          reportNo: report.reportNo,
          weekNo: report.weekNo || "",
          reportDate: report.reportDate.toISOString().slice(0, 10),
          companyName: report.companyName,
          companyLogoKey: report.companyLogoKey || "",
          clientId: report.clientId || "",
          clientName: report.clientName,
          clientLogoKey: report.clientLogoKey || "",
          arrivalTime: report.arrivalTime || "",
          leaveTime: report.leaveTime || "",
          workDescription: report.workDescription || "",
          activitiesDone: report.activitiesDone || "",
          notes: report.notes || "",
          workEvaluation: report.workEvaluation || "",
          activitiesNextShift: report.activitiesNextShift || "",
          signerName: report.signerName || "",
          signatureObjectKey: report.signatureObjectKey || "",
          signedDate: (report.signedDate || report.reportDate).toISOString().slice(0, 10),
          status: report.status,
          manpower: report.manpower
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((m) => ({
              name: m.name,
              qualification: m.qualification,
              workingHours: m.workingHours,
              remarks: m.remarks || "",
              extraJob: m.extraJob || "",
            })),
          equipment: report.equipment
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((e) => ({ name: e.name, quantity: e.quantity })),
          photoKeys: report.photos
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((p) => p.objectKey),
        }}
      />
    </AppShell>
  );
}
