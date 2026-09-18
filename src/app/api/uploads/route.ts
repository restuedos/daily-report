import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteObject, uploadObject } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "uploads");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = await uploadObject(buffer, file.type || "application/octet-stream", folder, file.name);
  return NextResponse.json({ key });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let key = "";
  try {
    const body = (await req.json()) as { key?: string };
    key = String(body.key || "").trim();
  } catch {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  if (!key) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  try {
    await deleteObject(key);
  } catch {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
