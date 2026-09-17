import fs from "fs/promises";
import path from "path";
import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import type { DailyReportContext } from "@/lib/render-template";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

const SAMPLE_DOCX = path.join(
  process.cwd(),
  "docs",
  "59. Daily Report 18 Agustus 2026.docx",
);

function esc(text: string) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paraXml(
  text: string,
  opts?: { bold?: boolean; center?: boolean; size?: number },
) {
  const bold = opts?.bold ? "<w:b/><w:bCs/>" : "";
  const jc = opts?.center ? `<w:jc w:val="center"/>` : "";
  const size = opts?.size ?? 18;
  return `<w:p>
  <w:pPr>${jc}<w:spacing w:before="0" w:after="0"/></w:pPr>
  <w:r>
    <w:rPr>${bold}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr>
    <w:t xml:space="preserve">${esc(text)}</w:t>
  </w:r>
</w:p>`;
}

function tblRows(doc: any) {
  const tables = doc.getElementsByTagName("w:tbl");
  if (!tables.length) throw new Error("Sample DOCX has no table");
  const tbl = tables[0];
  return Array.from(tbl.childNodes).filter(
    (n: any) => n.nodeType === 1 && n.localName === "tr",
  ) as any[];
}

function cellAt(row: any, index: number) {
  const cells = Array.from(row.childNodes).filter(
    (n: any) => n.nodeType === 1 && n.localName === "tc",
  ) as any[];
  return cells[index];
}

function hasDrawing(el: any) {
  const all = el.getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === "drawing") return true;
  }
  return false;
}

function writeTextKeepDrawings(
  doc: any,
  cell: any,
  paragraphs: Array<{ text: string; bold?: boolean; center?: boolean; size?: number }>,
  opts?: { drawingsFirst?: boolean },
) {
  const drawings: any[] = [];
  for (const child of [...cell.childNodes]) {
    if (child.nodeType !== 1) continue;
    const el = child as any;
    if (el.localName !== "p") continue;
    if (hasDrawing(el)) drawings.push(el.cloneNode(true) as any);
    cell.removeChild(el);
  }

  const appendText = () => {
    const fragXml = `<w:tc xmlns:w="${W_NS}">${paragraphs
      .map((p) => paraXml(p.text, p))
      .join("")}</w:tc>`;
    const parsed = new DOMParser().parseFromString(fragXml, "application/xml");
    const root = parsed.documentElement;
    if (!root) return;
    for (const child of [...Array.from(root.childNodes)]) {
      cell.appendChild(doc.importNode(child, true));
    }
  };

  if (opts?.drawingsFirst) {
    for (const d of drawings) cell.appendChild(d);
    appendText();
  } else {
    appendText();
    for (const d of drawings) cell.appendChild(d);
  }
}

function replaceMedia(
  zip: JSZip,
  name: string,
  buffer: Buffer | null | undefined,
) {
  if (!buffer?.length) return;
  zip.file(`word/media/${name}`, buffer);
}

/**
 * Fill the official sample DOCX so Word output matches the reference 1:1.
 * Only cell text and media binaries change.
 */
export async function fillDailyReportDocx(ctx: DailyReportContext) {
  const sample = await fs.readFile(SAMPLE_DOCX);
  const zip = await JSZip.loadAsync(sample);

  replaceMedia(zip, "image1.jpeg", ctx.clientLogoBuf);
  replaceMedia(zip, "image2.png", ctx.companyLogoBuf);
  const photoBufs = ctx.photos.map((p) => p.buffer).filter(Boolean) as Buffer[];
  // 1x1 pixel JPEG — blanks unused documentation slots so sample photos don't linger
  const blankJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z",
    "base64",
  );
  [
    "image3.jpeg",
    "image4.jpeg",
    "image5.jpeg",
    "image6.jpeg",
    "image7.jpeg",
    "image8.jpeg",
  ].forEach((file, i) => {
    replaceMedia(zip, file, photoBufs[i] || blankJpeg);
  });
  replaceMedia(zip, "image9.png", ctx.signatureBuf);

  const xmlIn = await zip.file("word/document.xml")!.async("string");
  const doc = new DOMParser().parseFromString(xmlIn, "application/xml");
  const rows = tblRows(doc);
  if (rows.length < 34) {
    throw new Error(`Sample DOCX unexpected row count: ${rows.length}`);
  }

  writeTextKeepDrawings(doc, cellAt(rows[0], 1), [
    { text: `PROJECT NO: ${ctx.projectNo}`, bold: true, center: true, size: 20 },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[1], 1), [
    { text: "PROJECT:", bold: true, center: true, size: 20 },
    { text: ctx.projectName, bold: true, center: true, size: 22 },
  ]);

  writeTextKeepDrawings(doc, cellAt(rows[2], 0), [
    { text: ctx.clientName, bold: true, center: true, size: 18 },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[2], 1), [
    { text: `Date: ${ctx.reportDate}`, bold: true, center: true, size: 18 },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[2], 2), [
    { text: `DAILY REPORT No: ${ctx.reportNo}`, bold: true, center: true, size: 18 },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[2], 3), [
    { text: ctx.companyName, bold: true, center: true, size: 18 },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[3], 2), [
    { text: `WEEK No: ${ctx.weekNo}`, bold: true, center: true, size: 18 },
  ]);

  for (let i = 0; i < 7; i++) {
    const row = rows[5 + i];
    const m = ctx.manpower[i];
    const filled = Boolean(m?.name);
    writeTextKeepDrawings(doc, cellAt(row, 0), [
      { text: filled ? `${i + 1}.` : "", center: true, size: 18 },
    ]);
    writeTextKeepDrawings(doc, cellAt(row, 1), [{ text: m?.name || "", size: 18 }]);
    writeTextKeepDrawings(doc, cellAt(row, 2), [
      { text: m?.qualification || "", size: 18 },
    ]);
    writeTextKeepDrawings(doc, cellAt(row, 3), [
      { text: m?.workingHours || "", center: true, size: 18 },
    ]);
    writeTextKeepDrawings(doc, cellAt(row, 4), [{ text: m?.remarks || "", size: 14 }]);
    writeTextKeepDrawings(doc, cellAt(row, 5), [{ text: m?.extraJob || "", size: 14 }]);
  }

  writeTextKeepDrawings(doc, cellAt(rows[12], 0), [
    {
      text: `Total Manpower: ${ctx.totalManpower}`,
      bold: true,
      center: true,
      size: 18,
    },
  ]);

  for (let i = 0; i < 11; i++) {
    const row = rows[14 + i];
    const e = ctx.equipment[i];
    const filled = Boolean(e?.name);
    writeTextKeepDrawings(doc, cellAt(row, 0), [
      { text: filled ? `${i + 1}.` : "", center: true, size: 18 },
    ]);
    writeTextKeepDrawings(doc, cellAt(row, 1), [{ text: e?.name || "", size: 18 }]);
    writeTextKeepDrawings(doc, cellAt(row, 2), [
      { text: e?.quantity || "", center: true, size: 18 },
    ]);
  }

  writeTextKeepDrawings(doc, cellAt(rows[25], 0), [
    { text: "Work Description:", bold: true, size: 18 },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[26], 0), [
    ...(ctx.workDescription
      ? [{ text: ctx.workDescription, bold: true as const, size: 18 }]
      : []),
    {
      text: `${ctx.arrivalTime}: Arrival to the site`,
      bold: true,
      size: 18,
    },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[27], 0), [
    { text: "Activities done this day:", bold: true, size: 18 },
  ]);

  const activityParas: Array<{ text: string; bold?: boolean; size?: number }> = [];
  for (const line of (ctx.activitiesDone || "").split(/\r?\n/)) {
    activityParas.push({ text: line, size: 18 });
  }
  activityParas.push({ text: "", size: 18 });
  activityParas.push({ text: `   Note: ${ctx.notes || ""}`, bold: true, size: 18 });
  activityParas.push({ text: "", size: 18 });
  activityParas.push({
    text: `Work Evaluation: ${ctx.workEvaluation || ""}`,
    bold: true,
    size: 18,
  });
  writeTextKeepDrawings(doc, cellAt(rows[28], 0), activityParas);
  writeTextKeepDrawings(doc, cellAt(rows[28], 1), [
    { text: "Documentation:", bold: true, size: 18 },
  ]);

  writeTextKeepDrawings(doc, cellAt(rows[29], 0), [
    { text: "Activities planned for next Shift:", bold: true, size: 18 },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[30], 0), [
    { text: ctx.activitiesNextShift || "", size: 18 },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[31], 0), [
    { text: `${ctx.leaveTime}: Leave site`, bold: true, size: 18 },
  ]);

  writeTextKeepDrawings(doc, cellAt(rows[32], 0), [
    { text: ctx.companyName, bold: true, center: true, size: 18 },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[32], 1), [
    { text: ctx.clientName, bold: true, center: true, size: 18 },
  ]);

  // R33 = signature image box only (separate from name/date)
  writeTextKeepDrawings(doc, cellAt(rows[33], 0), [{ text: "", size: 18 }], {
    drawingsFirst: true,
  });
  writeTextKeepDrawings(doc, cellAt(rows[33], 1), [{ text: "", size: 18 }]);

  // Insert meta row under the signature pad so name/date are in their own boxes
  const signPadRow = rows[33];
  const metaRow = signPadRow.cloneNode(true) as any;
  // Clear drawings from cloned meta row cells
  for (const cell of [cellAt(metaRow, 0), cellAt(metaRow, 1)]) {
    for (const child of [...Array.from(cell.childNodes)]) {
      if (child.nodeType === 1 && (child as any).localName === "p" && hasDrawing(child as any)) {
        cell.removeChild(child);
      }
    }
  }
  // Shorter row height for meta line
  let trPr = null as any;
  for (const child of Array.from(metaRow.childNodes)) {
    if ((child as any).nodeType === 1 && (child as any).localName === "trPr") {
      trPr = child as any;
      break;
    }
  }
  if (trPr) {
    const heights = trPr.getElementsByTagName("w:trHeight");
    if (heights.length) {
      heights[0].setAttribute("w:val", "320");
    }
  }

  signPadRow.parentNode.insertBefore(metaRow, signPadRow.nextSibling);

  writeTextKeepDrawings(doc, cellAt(metaRow, 0), [
    {
      text: `Signature: ${ctx.signerName}${ctx.signedDate ? ` : ${ctx.signedDate}` : ""}`,
      size: 18,
    },
  ]);
  // Keep client Signature + Date on one horizontal line
  writeTextKeepDrawings(doc, cellAt(metaRow, 1), [
    {
      text: "Signature: ______________    Date: ______________",
      size: 18,
    },
  ]);

  let xml = new XMLSerializer().serializeToString(doc);
  if (!xml.startsWith("<?xml")) {
    xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`;
  }
  zip.file("word/document.xml", xml);

  return Buffer.from(
    await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
  );
}
