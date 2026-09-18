import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

function storageRoot() {
  const root = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");
  return path.resolve(/* turbopackIgnore: true */ root);
}

function resolveSafePath(key: string) {
  const normalized = key.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!normalized || normalized.includes("..")) {
    throw new Error("Invalid storage key");
  }
  const full = path.resolve(/* turbopackIgnore: true */ storageRoot(), normalized);
  const root = storageRoot();
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("Invalid storage key");
  }
  return full;
}

export async function ensureStorageRoot() {
  await mkdir(/* turbopackIgnore: true */ storageRoot(), { recursive: true });
}

export async function uploadObject(
  file: Buffer,
  _contentType: string,
  folder = "uploads",
  filename?: string,
) {
  const safeFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "") || "uploads";
  const baseName = (filename || randomUUID()).replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${safeFolder}/${Date.now()}-${baseName}`;
  const full = resolveSafePath(key);
  await mkdir(/* turbopackIgnore: true */ path.dirname(full), { recursive: true });
  await writeFile(/* turbopackIgnore: true */ full, file);
  return key;
}

export async function deleteObject(key: string) {
  const full = resolveSafePath(key);
  try {
    await unlink(/* turbopackIgnore: true */ full);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw err;
  }
}

/** Local storage is served via /api/files/[...key] (auth required). */
export async function getSignedObjectUrl(key: string, _expiresIn = 3600) {
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function publicObjectUrl(key: string) {
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export async function getObjectBuffer(key: string) {
  const full = resolveSafePath(key);
  return readFile(/* turbopackIgnore: true */ full);
}

export function getStorageRoot() {
  return storageRoot();
}
