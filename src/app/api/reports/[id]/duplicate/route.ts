import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const source = await prisma.dailyReport.findFirst({
    where: { id, ownerUserId: session.user.id },
    include: { manpower: true, equipment: true, photos: true },
  });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const report = await prisma.dailyReport.create({
    data: {
      ownerUserId: session.user.id,
      clientId: source.clientId,
      status: "DRAFT",
      projectNo: source.projectNo,
      projectName: source.projectName,
      reportNo: `${source.reportNo}-COPY`,
      weekNo: source.weekNo,
      reportDate: new Date(),
      companyName: source.companyName,
      companyLogoKey: source.companyLogoKey,
      clientName: source.clientName,
      clientLogoKey: source.clientLogoKey,
      arrivalTime: source.arrivalTime,
      leaveTime: source.leaveTime,
      workDescription: source.workDescription,
      activitiesDone: source.activitiesDone,
      notes: source.notes,
      workEvaluation: source.workEvaluation,
      activitiesNextShift: source.activitiesNextShift,
      signerName: source.signerName,
      signatureObjectKey: source.signatureObjectKey,
      signedDate: null,
      manpower: {
        create: source.manpower.map((m) => ({
          name: m.name,
          qualification: m.qualification,
          workingHours: m.workingHours,
          remarks: m.remarks,
          extraJob: m.extraJob,
          sortOrder: m.sortOrder,
        })),
      },
      equipment: {
        create: source.equipment.map((e) => ({
          name: e.name,
          quantity: e.quantity,
          sortOrder: e.sortOrder,
        })),
      },
      // photos intentionally not copied — re-upload for new day
    },
    include: { manpower: true, equipment: true, photos: true },
  });

  return NextResponse.json({ report }, { status: 201 });
}
