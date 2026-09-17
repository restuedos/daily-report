import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reportSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await prisma.dailyReport.findMany({
    where: { ownerUserId: session.user.id },
    orderBy: { reportDate: "desc" },
    include: {
      manpower: true,
      photos: true,
    },
  });

  return NextResponse.json({ reports });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const report = await prisma.dailyReport.create({
    data: {
      ownerUserId: session.user.id,
      projectNo: data.projectNo,
      projectName: data.projectName,
      reportNo: data.reportNo,
      weekNo: data.weekNo,
      reportDate: new Date(data.reportDate),
      companyName: data.companyName,
      companyLogoKey: data.companyLogoKey,
      clientId: data.clientId || null,
      clientName: data.clientName,
      clientLogoKey: data.clientLogoKey,
      arrivalTime: data.arrivalTime,
      leaveTime: data.leaveTime,
      workDescription: data.workDescription,
      activitiesDone: data.activitiesDone,
      notes: data.notes,
      workEvaluation: data.workEvaluation,
      activitiesNextShift: data.activitiesNextShift,
      signerName: data.signerName,
      signatureObjectKey: data.signatureObjectKey,
      signedDate: data.signedDate ? new Date(data.signedDate) : null,
      status: data.status || "DRAFT",
      manpower: {
        create: data.manpower.map((m, i) => ({ ...m, sortOrder: i })),
      },
      equipment: {
        create: data.equipment.map((e, i) => ({ ...e, sortOrder: i })),
      },
      photos: {
        create: data.photoKeys.map((objectKey, i) => ({ objectKey, sortOrder: i })),
      },
    },
    include: { manpower: true, equipment: true, photos: true },
  });

  return NextResponse.json({ report }, { status: 201 });
}
