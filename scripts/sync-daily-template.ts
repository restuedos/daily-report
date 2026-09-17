import { PrismaClient, TemplateType } from "@prisma/client";
import {
  DAILY_REPORT_CSS,
  DAILY_REPORT_HTML,
  DAILY_REPORT_PLACEHOLDERS,
} from "../src/lib/template-defaults";

const prisma = new PrismaClient();

async function main() {
  const active = await prisma.documentTemplate.findFirst({
    where: { type: TemplateType.DAILY_REPORT, isActive: true },
  });
  if (!active) {
    console.log("No active daily template");
    return;
  }
  const updated = await prisma.documentTemplate.update({
    where: { id: active.id },
    data: {
      html: DAILY_REPORT_HTML,
      css: DAILY_REPORT_CSS,
      placeholders: DAILY_REPORT_PLACEHOLDERS,
      name: "Daily Report Default",
      version: { increment: 1 },
    },
  });
  console.log(`Updated template ${updated.id} -> v${updated.version}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
