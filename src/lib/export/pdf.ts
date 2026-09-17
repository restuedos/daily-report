import puppeteer from "puppeteer";

export async function htmlToPdf(html: string) {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    // US Letter @ 96dpi ≈ 816 x 1056 (matches sample DOCX page size)
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load" });
    await new Promise((r) => setTimeout(r, 400));

    const pdf = await page.pdf({
      width: "8.5in",
      height: "11in",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
