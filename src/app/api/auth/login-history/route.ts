import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;
  const device = userAgent?.slice(0, 120) || null;

  await prisma.loginHistory.create({
    data: {
      userId: session.user.id,
      ip,
      userAgent,
      device,
    },
  });

  return NextResponse.json({ ok: true });
}
