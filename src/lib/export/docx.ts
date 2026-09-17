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

export async function htmlToDocx(html: string) {
  // Large data-URL images can break html-to-docx; keep full HTML for fidelity.
  const buffer = await HTMLtoDOCX(html, null, {
    table: { row: { cantSplit: true } },
    footer: false,
    pageNumber: false,
  });
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}
