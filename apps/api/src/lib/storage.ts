import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { prisma } from './prisma.js';

export interface StoredFile {
  url: string;
  key: string;
}

export interface UploadInput {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  folder?: string; // ej. "logos", "covers", "prizes", "proofs"
}

export interface StorageAdapter {
  upload(input: UploadInput): Promise<StoredFile>;
}

function safeName(filename: string): string {
  const ext = extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.bin';
  return `${randomBytes(12).toString('hex')}${ext}`;
}

// ── Local (desarrollo) ──────────────────────────────────────
// Guarda en disco y sirve vía /uploads (ver app.ts @fastify/static).
class LocalStorage implements StorageAdapter {
  async upload(input: UploadInput): Promise<StoredFile> {
    const folder = input.folder ?? 'misc';
    const dir = join(env.storage.localDir, folder);
    await mkdir(dir, { recursive: true });
    const name = safeName(input.filename);
    const filePath = join(dir, name);
    await writeFile(filePath, input.buffer);
    const key = `${folder}/${name}`;
    return { key, url: `/uploads/${key}` };
  }
}

// ── Base de datos (Postgres) ────────────────────────────────
// Guarda el binario en la tabla StoredAsset para que sobreviva a los deploys de
// Railway (el disco del contenedor es efímero). Se sirve vía GET /uploads/<key>
// (ver app.ts). Pensado para los volúmenes pequeños de esta app (logo, banner,
// imágenes de premio y comprobantes).
class DbStorage implements StorageAdapter {
  async upload(input: UploadInput): Promise<StoredFile> {
    const folder = input.folder ?? 'misc';
    const name = safeName(input.filename);
    const key = `${folder}/${name}`;
    await prisma.storedAsset.create({
      data: { key, mime: input.mimetype, bytes: input.buffer, size: input.buffer.byteLength },
    });
    return { key, url: `/uploads/${key}` };
  }
}

// ── Cloudinary (placeholder configurable) ───────────────────
// Para activar: instalar `cloudinary` y completar credenciales en .env.
// Se deja preparado sin acoplar la dependencia al build base.
class CloudinaryStorage implements StorageAdapter {
  async upload(_input: UploadInput): Promise<StoredFile> {
    throw new Error(
      'STORAGE_DRIVER=cloudinary requiere instalar el paquete `cloudinary` y completar ' +
        'CLOUDINARY_* en .env. Implementa la subida en src/lib/storage.ts (CloudinaryStorage).',
    );
  }
}

// ── S3 compatible (placeholder configurable) ────────────────
// Para activar: instalar `@aws-sdk/client-s3` y completar S3_* en .env.
class S3Storage implements StorageAdapter {
  async upload(_input: UploadInput): Promise<StoredFile> {
    throw new Error(
      'STORAGE_DRIVER=s3 requiere instalar `@aws-sdk/client-s3` y completar S3_* en .env. ' +
        'Implementa la subida en src/lib/storage.ts (S3Storage).',
    );
  }
}

function buildStorage(): StorageAdapter {
  switch (env.storage.driver) {
    case 'db':
      return new DbStorage();
    case 'cloudinary':
      return new CloudinaryStorage();
    case 's3':
      return new S3Storage();
    case 'local':
    default:
      return new LocalStorage();
  }
}

export const storage: StorageAdapter = buildStorage();
