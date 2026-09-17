import { NextResponse } from "next/server";
import Handlebars from "handlebars";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderTemplate } from "@/lib/render-template";

type Params = { params: Promise<{ id: string }> };

const sampleDaily = {
  projectNo: "AATPO-2604071",
  projectName: "REINFORCEMENT SCADA AETRA AIR TANGERANG",
  reportNo: "059",
  weekNo: "14",
  reportDate: "18 Agustus 2026",
  companyName: "PT. REKAYASA TEKNOLOGI UTAMA",
  clientName: "PT. AETRA AIR TANGERANG",
  companyLogoUrl: "",
  clientLogoUrl: "",
  arrivalTime: "08:00 Am",
  leaveTime: "17:00 Pm",
  workDescription: "",
  activitiesDone: "Toolbox Meeting\nTroubleshooting penarikan data modbus",
  notes: "Sample note",
  workEvaluation: "",
  activitiesNextShift: "",
  manpower: [
    { name: "Sample Engineer", qualification: "Engineer", workingHours: "8", remarks: "", extraJob: "" },
  ],
  totalManpower: 1,
  equipment: [{ name: "Mini bus", quantity: "1" }],
  photos: [],
  signerName: "Sample Signer",
  signatureUrl: "",
  signedDate: "18 Agustus 2026",
};

const sampleDelivery = {
  noteNumber: "SJ-001",
  noteDate: "18 Agustus 2026",
  senderName: "PT. Contoh",
  receiverName: "PT. Penerima",
  driverName: "Budi",
  vehicleInfo: "B 1234 XX",
  notes: "",
  items: [{ name: "Kabel", qty: 10, unit: "roll", note: "" }],
  signerName: "Admin",
  signatureUrl: "",
};

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const template = await prisma.documentTemplate.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const htmlOverride = typeof body.html === "string" ? body.html : template.html;
  const cssOverride = typeof body.css === "string" ? body.css : template.css;
  const context =
    body.context ||
    (template.type === "DAILY_REPORT" ? sampleDaily : sampleDelivery);

  Handlebars.registerHelper("inc", (v: number) => Number(v) + 1);
  const html = renderTemplate({ html: htmlOverride, css: cssOverride }, context);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
