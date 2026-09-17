import Handlebars from "handlebars";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { DailyReport, DeliveryNote, DocumentTemplate } from "@prisma/client";
import { getObjectBuffer } from "@/lib/minio";

Handlebars.registerHelper("eq", (a, b) => a === b);
Handlebars.registerHelper("inc", (v) => Number(v) + 1);

export type ReportWithRelations = DailyReport & {
  manpower: {
    name: string;
    qualification: string;
    workingHours: string;
    remarks: string | null;
    extraJob: string | null;
    sortOrder: number;
  }[];
  equipment: { name: string; quantity: string; sortOrder: number }[];
  photos: { objectKey: string; sortOrder: number; caption: string | null }[];
};

function formatIdDate(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "d MMMM yyyy", { locale: localeId });
}

function contentTypeFromKey(key: string) {
  const lower = key.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}

/** Embed MinIO objects as data URLs so preview/PDF work behind tunnels. */
async function resolveUrl(key?: string | null) {
  if (!key) return "";
  try {
    const buf = await getObjectBuffer(key);
    const ct = contentTypeFromKey(key);
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch (err) {
    console.error("Failed to resolve image", key, err);
    return "";
  }
}

export async function buildDailyReportContext(report: ReportWithRelations) {
  const [companyLogoUrl, clientLogoUrl, signatureUrl, ...photoUrls] =
    await Promise.all([
      resolveUrl(report.companyLogoKey),
      resolveUrl(report.clientLogoKey),
      resolveUrl(report.signatureObjectKey),
      ...report.photos
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((p) => resolveUrl(p.objectKey)),
    ]);

  const manpower = [...report.manpower].sort((a, b) => a.sortOrder - b.sortOrder);
  const equipment = [...report.equipment].sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    projectNo: report.projectNo,
    projectName: report.projectName,
    reportNo: report.reportNo,
    weekNo: report.weekNo || "",
    reportDate: formatIdDate(report.reportDate),
    companyName: report.companyName,
    clientName: report.clientName,
    companyLogoUrl,
    clientLogoUrl,
    arrivalTime: report.arrivalTime || "",
    leaveTime: report.leaveTime || "",
    workDescription: report.workDescription || "",
    activitiesDone: report.activitiesDone || "",
    notes: report.notes || "",
    workEvaluation: report.workEvaluation || "",
    activitiesNextShift: report.activitiesNextShift || "",
    manpower,
    totalManpower: manpower.length,
    equipment,
    photos: photoUrls.filter(Boolean).map((url, i) => ({ url, index: i + 1 })),
    signerName: report.signerName || "",
    signatureUrl,
    signedDate: formatIdDate(report.signedDate || report.reportDate),
  };
}

export async function buildDeliveryNoteContext(note: DeliveryNote) {
  const signatureUrl = await resolveUrl(note.signatureKey);
  const items = Array.isArray(note.items) ? note.items : [];
  return {
    noteNumber: note.noteNumber,
    noteDate: formatIdDate(note.noteDate),
    senderName: note.senderName,
    receiverName: note.receiverName,
    driverName: note.driverName || "",
    vehicleInfo: note.vehicleInfo || "",
    notes: note.notes || "",
    items,
    signerName: note.signerName || "",
    signatureUrl,
  };
}

export function renderTemplate(
  template: Pick<DocumentTemplate, "html" | "css">,
  context: Record<string, unknown>,
) {
  const body = Handlebars.compile(template.html)(context);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
${template.css}
</style>
</head>
<body>
<div class="page-pad">
${body}
</div>
</body>
</html>`;
}

