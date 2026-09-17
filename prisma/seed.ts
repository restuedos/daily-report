import { PrismaClient, Role, TemplateType } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DAILY_REPORT_CSS,
  DAILY_REPORT_HTML,
  DAILY_REPORT_PLACEHOLDERS,
  DELIVERY_NOTE_CSS,
  DELIVERY_NOTE_HTML,
  DELIVERY_NOTE_PLACEHOLDERS,
} from "../src/lib/template-defaults";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Administrator";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: Role.ADMIN },
    create: { email, name, passwordHash, role: Role.ADMIN },
  });

  const existingDaily = await prisma.documentTemplate.findFirst({
    where: { type: TemplateType.DAILY_REPORT, isActive: true },
  });
  if (!existingDaily) {
    await prisma.documentTemplate.create({
      data: {
        name: "Daily Report Default",
        type: TemplateType.DAILY_REPORT,
        html: DAILY_REPORT_HTML,
        css: DAILY_REPORT_CSS,
        placeholders: DAILY_REPORT_PLACEHOLDERS,
        isActive: true,
        version: 1,
        updatedById: admin.id,
      },
    });
  }

  const existingDn = await prisma.documentTemplate.findFirst({
    where: { type: TemplateType.DELIVERY_NOTE, isActive: true },
  });
  if (!existingDn) {
    await prisma.documentTemplate.create({
      data: {
        name: "Surat Jalan Default",
        type: TemplateType.DELIVERY_NOTE,
        html: DELIVERY_NOTE_HTML,
        css: DELIVERY_NOTE_CSS,
        placeholders: DELIVERY_NOTE_PLACEHOLDERS,
        isActive: true,
        version: 1,
        updatedById: admin.id,
      },
    });
  }

  console.log(`Seeded admin ${email} and default templates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
