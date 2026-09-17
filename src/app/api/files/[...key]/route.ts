import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getObjectBuffer } from "@/lib/storage";

type Params = { params: Promise<{ key: string[] }> };

function contentTypeFromKey(key: string) {
  const lower = key.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key: parts } = await params;
  const key = parts.map((p) => decodeURIComponent(p)).join("/");
  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const buf = await getObjectBuffer(key);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": contentTypeFromKey(key),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
