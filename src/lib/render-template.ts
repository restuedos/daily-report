import Handlebars from "handlebars";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { DailyReport, DeliveryNote, DocumentTemplate } from "@prisma/client";
import { getObjectBuffer } from "@/lib/storage";
import {
  EQUIPMENT_ROW_COUNT,
  MANPOWER_ROW_COUNT,
} from "@/lib/template-defaults";

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

/** Split "1. a 2. b" (or newline-separated) into one item per line for PDF/DOCX. */
export function formatActivityLines(text: string | null | undefined): string {
  const raw = String(text ?? "").trim();
  if (!raw) return "";
  const byNl = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (byNl.length > 1) return byNl.join("\n");
  const parts = raw
    .split(/(?=\d+\.\s+)/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts.join("\n") : raw;
}

/** Plain items without leading `1.` — for HTML `<ol><li>`. */
export function parseActivityItems(text: string | null | undefined): string[] {
  const formatted = formatActivityLines(text);
  if (!formatted) return [];
  return formatted
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

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

async function resolveBuffer(key?: string | null) {
  if (!key) return null;
  try {
    return await getObjectBuffer(key);
  } catch (err) {
    console.error("Failed to load image buffer", key, err);
    return null;
  }
}

function padManpower(rows: ReportWithRelations["manpower"], count: number) {
  const out = rows.slice(0, count).map((r) => ({
    name: r.name || "",
    qualification: r.qualification || "",
    workingHours: r.workingHours || "",
    remarks: r.remarks || "",
    extraJob: r.extraJob || "",
  }));
  while (out.length < count) {
    out.push({
      name: "",
      qualification: "",
      workingHours: "",
      remarks: "",
      extraJob: "",
    });
  }
  return out;
}

function padEquipment(rows: ReportWithRelations["equipment"], count: number) {
  const out = rows.slice(0, count).map((r) => ({
    name: r.name || "",
    quantity: r.quantity || "",
  }));
  while (out.length < count) {
    out.push({ name: "", quantity: "" });
  }
  return out;
}

export async function buildDailyReportContext(report: ReportWithRelations) {
  const photoKeys = [...report.photos].sort((a, b) => a.sortOrder - b.sortOrder);
  const [
    companyLogoUrl,
    clientLogoUrl,
    signatureUrl,
    companyLogoBuf,
    clientLogoBuf,
    signatureBuf,
    ...photoResults
  ] = await Promise.all([
    resolveUrl(report.companyLogoKey),
    resolveUrl(report.clientLogoKey),
    resolveUrl(report.signatureObjectKey),
    resolveBuffer(report.companyLogoKey),
    resolveBuffer(report.clientLogoKey),
    resolveBuffer(report.signatureObjectKey),
    ...photoKeys.map(async (p) => ({
      url: await resolveUrl(p.objectKey),
      buffer: await resolveBuffer(p.objectKey),
      key: p.objectKey,
    })),
  ]);

  const manpowerRaw = [...report.manpower].sort((a, b) => a.sortOrder - b.sortOrder);
  const equipmentRaw = [...report.equipment].sort((a, b) => a.sortOrder - b.sortOrder);

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
    companyLogoBuf,
    clientLogoBuf,
    arrivalTime: report.arrivalTime || "",
    leaveTime: report.leaveTime || "",
    workDescription: report.workDescription || "",
    activitiesDone: formatActivityLines(report.activitiesDone),
    activitiesDoneItems: parseActivityItems(report.activitiesDone),
    notes: report.notes || "",
    workEvaluation: report.workEvaluation || "",
    activitiesNextShift: formatActivityLines(report.activitiesNextShift),
    activitiesNextShiftItems: parseActivityItems(report.activitiesNextShift),
    manpower: padManpower(manpowerRaw, MANPOWER_ROW_COUNT),
    totalManpower: manpowerRaw.length,
    equipment: padEquipment(equipmentRaw, EQUIPMENT_ROW_COUNT),
    photos: photoResults
      .filter((p) => p.url)
      .map((p, i) => ({
        url: p.url,
        index: i + 1,
        buffer: p.buffer,
        key: p.key,
      })),
    signerName: report.signerName || "",
    signatureUrl,
    signatureBuf,
    signedDate: formatIdDate(report.signedDate || report.reportDate),
  };
}

export type DailyReportContext = Awaited<ReturnType<typeof buildDailyReportContext>>;

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
