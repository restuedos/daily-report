import fs from "fs/promises";
import path from "path";
import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import type { DailyReportContext } from "@/lib/render-template";
import { formatActivityLines } from "@/lib/render-template";

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

/** Split activity text into numbered lines (same style as "Activities done this day"). */
function splitActivityLines(text: string): string[] {
  const formatted = formatActivityLines(text);
  if (!formatted) return [""];
  return formatted.split("\n");
}

function paraXml(
  text: string,
  opts?: {
    bold?: boolean;
    center?: boolean;
    size?: number;
    /** Paragraph left indent in twips (1440 = 1"). */
    indentTwips?: number;
    /** Hanging indent in twips (wrap lines stay indented; first line pulls back). */
    hangingTwips?: number;
  },
) {
  const bold = opts?.bold ? "<w:b/><w:bCs/>" : "";
  const jc = opts?.center ? `<w:jc w:val="center"/>` : "";
  let ind = "";
  if (opts?.indentTwips != null || opts?.hangingTwips != null) {
    const left = opts?.indentTwips ?? opts?.hangingTwips ?? 0;
    const hang =
      opts?.hangingTwips != null ? ` w:hanging="${opts.hangingTwips}"` : "";
    ind = `<w:ind w:left="${left}"${hang}/>`;
  }
  const size = opts?.size ?? 18;
  // rPr on both pPr (paragraph mark — what LibreOffice shows for empty cells)
  // and the run so filled/empty cells share Arial 9pt.
  const rPr = `${bold}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>`;
  return `<w:p>
  <w:pPr>${jc}${ind}<w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:rPr>${rPr}</w:rPr></w:pPr>
  <w:r>
    <w:rPr>${rPr}</w:rPr>
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
  paragraphs: Array<{
    text: string;
    bold?: boolean;
    center?: boolean;
    size?: number;
    indentTwips?: number;
    hangingTwips?: number;
  }>,
  opts?: {
    drawingsFirst?: boolean;
    keepDrawings?: boolean;
    vAlign?: "center" | "top" | "bottom";
    /** Override specific cell borders (nil hides; single restores a thin line). */
    borders?: {
      top?: "nil" | "single";
      bottom?: "nil" | "single";
      left?: "nil" | "single";
      right?: "nil" | "single";
    };
  },
) {
  const keepDrawings = opts?.keepDrawings !== false;
  const drawings: any[] = [];
  for (const child of [...cell.childNodes]) {
    if (child.nodeType !== 1) continue;
    const el = child as any;
    if (el.localName !== "p") continue;
    if (keepDrawings && hasDrawing(el)) drawings.push(el.cloneNode(true) as any);
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

  if (opts?.vAlign) setCellVAlign(doc, cell, opts.vAlign);
  if (opts?.borders) setCellBorders(doc, cell, opts.borders);
}

function setCellBorders(
  doc: any,
  cell: any,
  borders: {
    top?: "nil" | "single";
    bottom?: "nil" | "single";
    left?: "nil" | "single";
    right?: "nil" | "single";
  },
) {
  let tcPr: any = null;
  for (const child of Array.from(cell.childNodes)) {
    if ((child as any).nodeType === 1 && (child as any).localName === "tcPr") {
      tcPr = child as any;
      break;
    }
  }
  if (!tcPr) {
    const frag = new DOMParser().parseFromString(
      `<w:tc xmlns:w="${W_NS}"><w:tcPr/></w:tc>`,
      "application/xml",
    );
    const root = frag.documentElement;
    if (!root) return;
    tcPr = doc.importNode(root.getElementsByTagName("w:tcPr")[0], true);
    cell.insertBefore(tcPr, cell.firstChild);
  }

  let tcBorders: any = null;
  const existing = tcPr.getElementsByTagName("w:tcBorders");
  if (existing.length) {
    tcBorders = existing[0];
  } else {
    const frag = new DOMParser().parseFromString(
      `<w:tcPr xmlns:w="${W_NS}"><w:tcBorders/></w:tcPr>`,
      "application/xml",
    );
    const root = frag.documentElement;
    if (!root) return;
    tcBorders = doc.importNode(root.getElementsByTagName("w:tcBorders")[0], true);
    tcPr.appendChild(tcBorders);
  }

  for (const side of ["top", "left", "bottom", "right"] as const) {
    const style = borders[side];
    if (!style) continue;
    const found = tcBorders.getElementsByTagName(`w:${side}`);
    const borderXml =
      style === "nil"
        ? `<w:tcBorders xmlns:w="${W_NS}"><w:${side} w:val="nil" w:sz="0" w:space="0" w:color="auto"/></w:tcBorders>`
        : `<w:tcBorders xmlns:w="${W_NS}"><w:${side} w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tcBorders>`;
    const frag = new DOMParser().parseFromString(borderXml, "application/xml");
    const root = frag.documentElement;
    if (!root) continue;
    const node = doc.importNode(root.getElementsByTagName(`w:${side}`)[0], true);
    if (found.length) tcBorders.replaceChild(node, found[0]);
    else tcBorders.appendChild(node);
  }
}

function setCellVAlign(
  doc: any,
  cell: any,
  val: "center" | "top" | "bottom",
) {
  let tcPr: any = null;
  for (const child of Array.from(cell.childNodes)) {
    if ((child as any).nodeType === 1 && (child as any).localName === "tcPr") {
      tcPr = child as any;
      break;
    }
  }
  if (!tcPr) {
    const frag = new DOMParser().parseFromString(
      `<w:tc xmlns:w="${W_NS}"><w:tcPr/></w:tc>`,
      "application/xml",
    );
    const root = frag.documentElement;
    if (!root) return;
    tcPr = doc.importNode(root.getElementsByTagName("w:tcPr")[0], true);
    cell.insertBefore(tcPr, cell.firstChild);
  }
  const existing = tcPr.getElementsByTagName("w:vAlign");
  if (existing.length) {
    existing[0].setAttribute("w:val", val);
  } else {
    const frag = new DOMParser().parseFromString(
      `<w:tcPr xmlns:w="${W_NS}"><w:vAlign w:val="${val}"/></w:tcPr>`,
      "application/xml",
    );
    const root = frag.documentElement;
    if (!root) return;
    tcPr.appendChild(
      doc.importNode(root.getElementsByTagName("w:vAlign")[0], true),
    );
  }
}

function detectImageExt(buffer: Buffer): "jpeg" | "png" | "gif" | "webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46
  ) {
    return "gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

/**
 * Replace a media part. If the buffer format differs from the sample filename
 * extension (e.g. PNG written into image1.jpeg), rename the part and update
 * document relationships + content types so Word/LibreOffice can render it.
 */
async function replaceMedia(
  zip: JSZip,
  name: string,
  buffer: Buffer | null | undefined,
) {
  if (!buffer?.length) return;

  const currentExt = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1).toLowerCase() : "";
  const detected = detectImageExt(buffer);
  const finalExt =
    detected ?? (currentExt === "jpg" ? "jpeg" : currentExt || "jpeg");
  const base = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;
  const finalName = `${base}.${finalExt === "jpg" ? "jpeg" : finalExt}`;

  if (finalName !== name) {
    zip.remove(`word/media/${name}`);
  }
  zip.file(`word/media/${finalName}`, buffer);

  if (finalName === name) return;

  const relsPath = "word/_rels/document.xml.rels";
  const relsFile = zip.file(relsPath);
  if (relsFile) {
    let rels = await relsFile.async("string");
    rels = rels.replaceAll(`media/${name}`, `media/${finalName}`);
    zip.file(relsPath, rels);
  }

  const typesPath = "[Content_Types].xml";
  const typesFile = zip.file(typesPath);
  if (typesFile) {
    let types = await typesFile.async("string");
    const extAttr = finalExt === "jpg" ? "jpeg" : finalExt;
    const contentType = CONTENT_TYPE_BY_EXT[extAttr] ?? `image/${extAttr}`;
    if (!types.includes(`Extension="${extAttr}"`)) {
      types = types.replace(
        /<Types([^>]*)>/,
        `<Types$1><Default Extension="${extAttr}" ContentType="${contentType}"/>`,
      );
    }
    zip.file(typesPath, types);
  }
}

/**
 * Fill the official sample DOCX so Word output matches the reference 1:1.
 * Only cell text and media binaries change.
 */
export async function fillDailyReportDocx(ctx: DailyReportContext) {
  const sample = await fs.readFile(SAMPLE_DOCX);
  const zip = await JSZip.loadAsync(sample);

  const photoBufs = ctx.photos.map((p) => p.buffer).filter(Boolean) as Buffer[];
  // Tiny placeholders — wipe sample media when the report has no upload
  const blankJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z",
    "base64",
  );
  const blankPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const hasClientLogo = Boolean(ctx.clientLogoBuf?.length);
  const hasCompanyLogo = Boolean(ctx.companyLogoBuf?.length);
  const hasSignature = Boolean(ctx.signatureBuf?.length);

  await replaceMedia(
    zip,
    "image1.jpeg",
    hasClientLogo ? ctx.clientLogoBuf : blankJpeg,
  );
  await replaceMedia(
    zip,
    "image2.png",
    hasCompanyLogo ? ctx.companyLogoBuf : blankPng,
  );
  for (const [i, file] of [
    "image3.jpeg",
    "image4.jpeg",
    "image5.jpeg",
    "image6.jpeg",
    "image7.jpeg",
    "image8.jpeg",
  ].entries()) {
    await replaceMedia(zip, file, photoBufs[i] || blankJpeg);
  }
  await replaceMedia(
    zip,
    "image9.png",
    hasSignature ? ctx.signatureBuf : blankPng,
  );

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

  // Logo cells (row 0) — drop sample drawings when nothing was uploaded
  if (!hasClientLogo) {
    writeTextKeepDrawings(doc, cellAt(rows[0], 0), [{ text: "", size: 18 }], {
      keepDrawings: false,
    });
  }
  if (!hasCompanyLogo) {
    writeTextKeepDrawings(doc, cellAt(rows[0], 2), [{ text: "", size: 18 }], {
      keepDrawings: false,
    });
  }

  writeTextKeepDrawings(
    doc,
    cellAt(rows[2], 0),
    [{ text: ctx.clientName, bold: true, center: true, size: 18 }],
    { vAlign: "center" },
  );
  writeTextKeepDrawings(doc, cellAt(rows[2], 1), [
    { text: `Date: ${ctx.reportDate}`, bold: true, center: true, size: 18 },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[2], 2), [
    { text: `DAILY REPORT No: ${ctx.reportNo}`, bold: true, center: true, size: 18 },
  ]);
  writeTextKeepDrawings(
    doc,
    cellAt(rows[2], 3),
    [{ text: ctx.companyName, bold: true, center: true, size: 18 }],
    { vAlign: "center" },
  );
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
    writeTextKeepDrawings(doc, cellAt(row, 1), [
      { text: m?.name ? ` ${m.name}` : "", size: 18 },
    ]);
    writeTextKeepDrawings(doc, cellAt(row, 2), [
      { text: m?.qualification ? ` ${m.qualification}` : "", size: 18 },
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
    writeTextKeepDrawings(doc, cellAt(row, 1), [
      { text: e?.name ? ` ${e.name}` : "", size: 18 },
    ]);
    writeTextKeepDrawings(doc, cellAt(row, 2), [
      { text: e?.quantity || "", center: true, size: 18 },
    ]);
  }

  writeTextKeepDrawings(doc, cellAt(rows[25], 0), [
    {
      text: ctx.workDescription?.trim()
        ? `Work Description: ${ctx.workDescription.trim()}`
        : "Work Description:",
      bold: true,
      size: 18,
    },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[26], 0), [
    {
      text: `${ctx.arrivalTime}: Arrival to the site`,
      bold: true,
      size: 18,
    },
  ]);
  writeTextKeepDrawings(doc, cellAt(rows[27], 0), [
    { text: "Activities done this day:", bold: true, size: 18 },
  ]);

  const activityParas: Array<{
    text: string;
    bold?: boolean;
    size?: number;
    indentTwips?: number;
    hangingTwips?: number;
  }> = [];
  for (const line of splitActivityLines(ctx.activitiesDone || "")) {
    if (!line.trim()) {
      activityParas.push({ text: "", size: 18 });
      continue;
    }
    // Hanging indent (~0.25"): wrapped lines sit under the text, not under "1."
    activityParas.push({
      text: line,
      size: 18,
      indentTwips: 360,
      hangingTwips: 200,
    });
  }
  activityParas.push({ text: "", size: 18 });
  activityParas.push({
    text: `Note: ${ctx.notes || ""}`,
    bold: true,
    size: 18,
    indentTwips: 200,
  });
  activityParas.push({ text: "", size: 18 });
  activityParas.push({
    text: `Work Evaluation: ${ctx.workEvaluation || ""}`,
    bold: true,
    size: 18,
    indentTwips: 200,
  });
  writeTextKeepDrawings(doc, cellAt(rows[28], 0), activityParas);
  writeTextKeepDrawings(doc, cellAt(rows[28], 1), [
    { text: "Documentation:", bold: true, size: 18 },
  ]);

  writeTextKeepDrawings(doc, cellAt(rows[29], 0), [
    { text: "Activities planned for next Shift:", bold: true, size: 18 },
  ]);
  const nextShiftParas = splitActivityLines(ctx.activitiesNextShift || "").map(
    (line) => ({
      text: line.trim() ? line : "",
      size: 18,
      // 0.25" left + hanging so wrap lines sit under the text
      indentTwips: 560,
      hangingTwips: 200,
    }),
  );
  writeTextKeepDrawings(
    doc,
    cellAt(rows[30], 0),
    nextShiftParas.length
      ? nextShiftParas
      : [{ text: "", size: 18, indentTwips: 560, hangingTwips: 200 }],
    { vAlign: "center" },
  );
  writeTextKeepDrawings(doc, cellAt(rows[31], 0), [
    { text: `${ctx.leaveTime}: Leave site`, bold: true, size: 18 },
  ]);

  writeTextKeepDrawings(
    doc,
    cellAt(rows[32], 0),
    [{ text: ctx.companyName, bold: true, center: true, size: 18 }],
    { vAlign: "center" },
  );
  writeTextKeepDrawings(
    doc,
    cellAt(rows[32], 1),
    [{ text: ctx.clientName, bold: true, center: true, size: 18 }],
    { vAlign: "center" },
  );

  // R33 = signature image box only (separate from name/date)
  writeTextKeepDrawings(doc, cellAt(rows[33], 0), [{ text: "", size: 18 }], {
    drawingsFirst: true,
    keepDrawings: hasSignature,
    borders: { bottom: "nil" },
  });
  writeTextKeepDrawings(doc, cellAt(rows[33], 1), [{ text: "", size: 18 }], {
    borders: { bottom: "nil" },
  });

  // Insert meta row under the signature pad so name/date are in their own boxes
  const signPadRow = rows[33];
  const metaRow = signPadRow.cloneNode(true) as any;
  // Clear drawings from cloned meta row cells
  for (const cell of [cellAt(metaRow, 0), cellAt(metaRow, 1)]) {
    for (const child of [...Array.from(cell.childNodes)] as any[]) {
      if (child.nodeType === 1 && child.localName === "p" && hasDrawing(child)) {
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

  writeTextKeepDrawings(
    doc,
    cellAt(metaRow, 0),
    [
      {
        text: `Signature: ${ctx.signerName}${ctx.signedDate ? ` : ${ctx.signedDate}` : ""}`,
        size: 18,
        center: true,
      },
    ],
    // Clone inherits pad's bottom:nil — restore bottom so the table closes under name/date
    { vAlign: "center", borders: { top: "nil", bottom: "single" } },
  );
  writeTextKeepDrawings(
    doc,
    cellAt(metaRow, 1),
    [
      {
        text: "Signature: ______________    Date: ______________",
        size: 18,
        center: true,
      },
    ],
    { vAlign: "center", borders: { top: "nil", bottom: "single" } },
  );

  let xml = new XMLSerializer().serializeToString(doc);
  if (!xml.startsWith("<?xml")) {
    xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${xml}`;
  }
  zip.file("word/document.xml", xml);

  // Document defaults → Arial 9pt so untouched / empty paragraph marks match filled cells
  const stylesPath = "word/styles.xml";
  const stylesFile = zip.file(stylesPath);
  if (stylesFile) {
    let styles = await stylesFile.async("string");
    const defaultRPr = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>`;
    if (/<w:rPrDefault>\s*<w:rPr>[\s\S]*?<\/w:rPr>\s*<\/w:rPrDefault>/.test(styles)) {
      styles = styles.replace(
        /<w:rPrDefault>\s*<w:rPr>[\s\S]*?<\/w:rPr>\s*<\/w:rPrDefault>/,
        `<w:rPrDefault>${defaultRPr}</w:rPrDefault>`,
      );
    } else if (styles.includes("<w:docDefaults>")) {
      styles = styles.replace(
        "<w:docDefaults>",
        `<w:docDefaults><w:rPrDefault>${defaultRPr}</w:rPrDefault>`,
      );
    } else {
      styles = styles.replace(
        /<w:styles([^>]*)>/,
        `<w:styles$1><w:docDefaults><w:rPrDefault>${defaultRPr}</w:rPrDefault></w:docDefaults>`,
      );
    }
    zip.file(stylesPath, styles);
  }

  return Buffer.from(
    await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
  );
}
