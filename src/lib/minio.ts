import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function required(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

export function getMinioClient() {
  return new S3Client({
    region: "us-east-1",
    endpoint: process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    },
  });
}

export function getBucket() {
  return process.env.MINIO_BUCKET || "daily-report";
}

export async function uploadObject(
  file: Buffer,
  contentType: string,
  folder = "uploads",
  filename?: string,
) {
  const key = `${folder}/${filename || randomUUID()}`;
  const client = getMinioClient();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );
  return key;
}

export async function deleteObject(key: string) {
  const client = getMinioClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
}

export async function getSignedObjectUrl(key: string, expiresIn = 3600) {
  const client = getMinioClient();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
    { expiresIn },
  );
}

export function publicObjectUrl(key: string) {
  const base = (process.env.MINIO_PUBLIC_URL || process.env.MINIO_ENDPOINT || "").replace(
    /\/$/,
    "",
  );
  return `${base}/${getBucket()}/${key}`;
}

export async function getObjectBuffer(key: string) {
  const client = getMinioClient();
  const res = await client.send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
  );
  const bytes = await res.Body?.transformToByteArray();
  if (!bytes) throw new Error(`Empty object: ${key}`);
  return Buffer.from(bytes);
}

export { required };
