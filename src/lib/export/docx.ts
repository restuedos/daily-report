import JSZip from "jszip";

type HtmlToDocxFn = (
  html: string,
  headerHTML?: string | null,
  options?: Record<string, unknown>,
) => Promise<ArrayBuffer | Buffer>;

function loadHtmlToDocx(): HtmlToDocxFn {
  // html-to-docx is CJS; bundlers may wrap it as { default: fn }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("html-to-docx") as HtmlToDocxFn | { default: HtmlToDocxFn };
  if (typeof mod === "function") return mod;
  if (mod && typeof mod.default === "function") return mod.default;
  throw new Error("html-to-docx module did not export a function");
}

const HTMLtoDOCX = loadHtmlToDocx();

/** A4 in TWIP (1 inch = 1440 TWIP). */
const A4 = { width: 11906, height: 16838 };
/** ~8mm margins — closer to the sample sheet */
const MARGIN = 454;
const CONTENT_WIDTH = A4.width - MARGIN * 2; // 10998

/**
 * 9-column widths scaled from the sample Word daily report grid.
 * Sample twips: 1128,1426,825,1018,1143,173,1518,1705,2267 (sum 11203)
 */
const SAMPLE_COLS = [1128, 1426, 825, 1018, 1143, 173, 1518, 1705, 2267];

function buildColWidths(total: number, sample: number[]) {
  const sum = sample.reduce((a, b) => a + b, 0);
  const widths = sample.map((w) => Math.floor((total * w) / sum));
  widths[widths.length - 1] += total - widths.reduce((a, b) => a + b, 0);
  return widths;
}

function cellPlainText(cellXml: string) {
  return (cellXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
    .map((t) => t.replace(/<[^>]+>/g, ""))
    .join("")
    .trim();
}

function ensurePprJc(pXml: string, align: "center" | "left" | "both") {
  if (/<w:pPr[\s\S]*?<\/w:pPr>/.test(pXml)) {
    return pXml.replace(/<w:pPr[\s\S]*?<\/w:pPr>/, (ppr) => {
      if (/<w:jc\b/.test(ppr)) {
        return ppr.replace(/<w:jc\b[^/]*\/>/, `<w:jc w:val="${align}"/>`);
      }
      return ppr.replace(/<w:pPr([^>]*)>/, `<w:pPr$1><w:jc w:val="${align}"/>`);
    });
  }
  return pXml.replace(/<w:p\b([^>]*)>/, `<w:p$1><w:pPr><w:jc w:val="${align}"/></w:pPr>`);
}

function setCellVAlign(cellXml: string, align: "center" | "bottom" | "top") {
  if (/<w:tcPr[\s\S]*?<\/w:tcPr>/.test(cellXml)) {
    return cellXml.replace(/<w:tcPr[\s\S]*?<\/w:tcPr>/, (tcPr) => {
      if (/<w:vAlign\b/.test(tcPr)) {
        return tcPr.replace(/<w:vAlign\b[^/]*\/>/, `<w:vAlign w:val="${align}"/>`);
      }
      return tcPr.replace(/<\/w:tcPr>/, `<w:vAlign w:val="${align}"/></w:tcPr>`);
    });
  }
  return cellXml.replace(/<w:tc\b([^>]*)>/, `<w:tc$1><w:tcPr><w:vAlign w:val="${align}"/></w:tcPr>`);
}

function setRowHeight(rowXml: string, twips: number, rule: "atLeast" | "exact" = "atLeast") {
  const trHeight = `<w:trHeight w:val="${twips}" w:hRule="${rule}"/>`;
  if (/<w:trPr[\s\S]*?<\/w:trPr>/.test(rowXml)) {
    return rowXml.replace(/<w:trPr[\s\S]*?<\/w:trPr>/, (trPr) => {
      if (/<w:trHeight\b/.test(trPr)) {
        return trPr.replace(/<w:trHeight\b[^/]*\/>/, trHeight);
      }
      return trPr.replace(/<\/w:trPr>/, `${trHeight}</w:trPr>`);
    });
  }
  return rowXml.replace(/<w:tr\b([^>]*)>/, `<w:tr$1><w:trPr>${trHeight}</w:trPr>`);
}

function fitDrawingsToCell(cellXml: string, cellWidthTwips: number) {
  // 1 twip = 635 EMUs; leave padding so logo doesn't touch borders
  const maxWidth = Math.max(200000, Math.min(Math.floor(cellWidthTwips * 635 * 0.72), 1000000));
  const maxHeight = 480000; // ~0.52"

  const scaleExt = (cx: number, cy: number) => {
    const scale = Math.min(1, maxWidth / cx, maxHeight / cy);
    return {
      cx: Math.max(1, Math.floor(cx * scale)),
      cy: Math.max(1, Math.floor(cy * scale)),
    };
  };

  // wp:extent is the displayed size LibreOffice/Word honor
  let out = cellXml.replace(
    /<wp:extent\b([^>]*)\bcx="(\d+)"([^>]*)\bcy="(\d+)"([^>]*)\/>/g,
    (full, pre, cxStr, mid, cyStr, post) => {
      const { cx, cy } = scaleExt(Number(cxStr), Number(cyStr));
      return `<wp:extent${pre}cx="${cx}"${mid}cy="${cy}"${post}/>`;
    },
  );

  out = out.replace(
    /<a:ext\b([^>]*)\bcx="(\d+)"([^>]*)\bcy="(\d+)"([^>]*)\/>/g,
    (full, pre, cxStr, mid, cyStr, post) => {
      const { cx, cy } = scaleExt(Number(cxStr), Number(cyStr));
      return `<a:ext${pre}cx="${cx}"${mid}cy="${cy}"${post}/>`;
    },
  );

  return out;
}

/**
 * html-to-docx emits weak grid/alignment. Normalize to the sample 9-col layout.
 */
async function normalizeDocxTable(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const docFile = zip.file("word/document.xml");
  if (!docFile) return buffer;

  let xml = await docFile.async("string");
  const colWidths = buildColWidths(CONTENT_WIDTH, SAMPLE_COLS);

  const gridXml = `<w:tblGrid>${colWidths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
  if (/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/.test(xml)) {
    xml = xml.replace(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/g, gridXml);
  } else if (/<w:tblPr>[\s\S]*?<\/w:tblPr>/.test(xml)) {
    xml = xml.replace(/<\/w:tblPr>/, `</w:tblPr>${gridXml}`);
  }

  xml = xml.replace(
    /<w:tblW[^/]*\/>/g,
    `<w:tblW w:w="${CONTENT_WIDTH}" w:type="dxa"/>`,
  );

  xml = xml.replace(/<w:tr\b[\s\S]*?<\/w:tr>/g, (rowXml) => {
    const rowText = cellPlainText(rowXml);
    const isSignRow = /Signature:/i.test(rowText);
    const isProjectHeader = /PROJECT\s*NO/i.test(rowText);
    const isActivityBody =
      (/Note:/i.test(rowText) || /Work Evaluation:/i.test(rowText)) &&
      rowXml.includes("<w:drawing");

    let cursor = 0;
    let next = rowXml.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cellXml) => {
      const spanMatch = cellXml.match(/<w:gridSpan[^>]*w:val="(\d+)"[^/]*\/>/);
      const span = spanMatch ? Number(spanMatch[1]) : 1;
      const width = colWidths.slice(cursor, cursor + span).reduce((a, b) => a + b, 0);
      cursor = Math.min(cursor + span, colWidths.length);

      const tcW = `<w:tcW w:w="${width}" w:type="dxa"/>`;
      let cell = cellXml;
      if (/<w:tcW\b[^/]*\/>/.test(cell)) {
        cell = cell.replace(/<w:tcW\b[^/]*\/>/, tcW);
      } else if (/<w:tcPr\b[^>]*>/.test(cell)) {
        cell = cell.replace(/<w:tcPr\b[^>]*>/, (m) => `${m}${tcW}`);
      } else {
        cell = cell.replace(/<w:tc\b[^>]*>/, (m) => `${m}<w:tcPr>${tcW}</w:tcPr>`);
      }

      const text = cellPlainText(cell);
      const isNoteBlock = /Note:/i.test(text) || /Work Evaluation:/i.test(text);
      const isLongBody =
        span >= 9 &&
        text.length > 20 &&
        !/PROJECT/i.test(text) &&
        !/Total Manpower/i.test(text) &&
        !/Work Description/i.test(text) &&
        !/Activities planned/i.test(text) &&
        !/Arrival to the site/i.test(text) &&
        !/Leave site/i.test(text);

      // Project header + logos + table chrome stay centered (matches sample)
      const align: "center" | "left" =
        isNoteBlock || isLongBody ? "left" : "center";

      cell = cell.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (p) => ensurePprJc(p, align));

      if (isSignRow) cell = setCellVAlign(cell, "bottom");
      else if (isNoteBlock || isLongBody) cell = setCellVAlign(cell, "top");
      else cell = setCellVAlign(cell, "center");

      // Shrink oversized logos to fit the cell (client logo was blowing past borders)
      if (cell.includes("<w:drawing") && !isNoteBlock && span <= 2) {
        cell = fitDrawingsToCell(cell, width);
      }

      return cell;
    });

    if (isSignRow) next = setRowHeight(next, 1600, "atLeast");
    else if (isActivityBody) next = setRowHeight(next, 2200, "atLeast");
    else if (/^No\./i.test(rowText) || /MAIN EQUIPMENT/i.test(rowText)) {
      next = setRowHeight(next, 350, "atLeast");
    } else if (isProjectHeader || /DAILY REPORT No/i.test(rowText)) {
      next = setRowHeight(next, 700, "atLeast");
    }

    return next;
  });

  zip.file("word/document.xml", xml);
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

function prepareHtmlForDocx(fullHtml: string) {
  let inner = fullHtml;
  const pad = fullHtml.match(/<div class="page-pad">([\s\S]*?)<\/div>\s*<\/body>/i);
  if (pad) inner = pad[1].trim();

  inner = inner.replace(/<table\b[^>]*class="main"[^>]*>/i, () => {
    return `<table class="main" border="1" cellspacing="0" cellpadding="5" width="700" style="width:700px;border-collapse:collapse;table-layout:fixed;">`;
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${inner}</body></html>`;
}

export async function htmlToDocx(html: string) {
  const prepared = prepareHtmlForDocx(html);
  const buffer = await HTMLtoDOCX(prepared, null, {
    orientation: "portrait",
    pageSize: A4,
    margins: {
      top: MARGIN,
      right: MARGIN,
      bottom: MARGIN,
      left: MARGIN,
    },
    font: "Arial",
    fontSize: 20, // 10pt
    complexScriptFontSize: 20,
    table: { row: { cantSplit: true } },
    footer: false,
    pageNumber: false,
    lang: "id-ID",
  });
  const raw = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return normalizeDocxTable(raw);
}
