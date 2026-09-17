import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reportSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

async function getOwned(id: string, userId: string) {
  return prisma.dailyReport.findFirst({
    where: { id, ownerUserId: userId },
    include: { manpower: true, equipment: true, photos: true },
  });
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const report = await getOwned(id, session.user.id);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ report });
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getOwned(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  await prisma.$transaction([
    prisma.reportManpower.deleteMany({ where: { reportId: id } }),
    prisma.reportEquipment.deleteMany({ where: { reportId: id } }),
    prisma.reportPhoto.deleteMany({ where: { reportId: id } }),
    prisma.dailyReport.update({
      where: { id },
      data: {
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
        status: data.status || existing.status,
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
    }),
  ]);

  const report = await getOwned(id, session.user.id);
  return NextResponse.json({ report });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getOwned(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.dailyReport.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
