import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { storageProvider } from '../services/storage';
import { fileService } from '../services/fileService';

const prisma = new PrismaClient();

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const TEMP_DIR = path.join(process.cwd(), 'uploads', 'temp');

export interface ChunkedUploadInput {
  uploadId: string;
  chunk: Buffer;
  index: number;
  totalChunks: number;
  fileName: string;
  mimeType: string;
  totalSize: number;
  folderId?: string | null;
}

export interface UploadStatus {
  uploadId: string;
  chunksReceived: number[];
  totalChunks: number;
  fileName: string;
  totalSize: number;
}

export const chunkedUploadService = {
  async initializeUpload(userId: string, fileName: string, mimeType: string, totalSize: number, totalChunks: number, folderId?: string) {
    const uploadId = uuidv4();
    const tempDir = path.join(TEMP_DIR, uploadId);
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    return { uploadId };
  },

  async uploadChunk(userId: string, input: ChunkedUploadInput) {
    const { uploadId, chunk, index, totalChunks, fileName, mimeType, totalSize, folderId } = input;
    const tempDir = path.join(TEMP_DIR, uploadId);
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const chunkPath = path.join(tempDir, `chunk_${index}`);
    fs.writeFileSync(chunkPath, chunk);

    const status = await this.getStatus(uploadId);
    return status;
  },

  async getStatus(uploadId: string): Promise<UploadStatus | null> {
    const tempDir = path.join(TEMP_DIR, uploadId);
    
    if (!fs.existsSync(tempDir)) {
      return null;
    }

    const files = fs.readdirSync(tempDir);
    const chunksReceived = files
      .filter(f => f.startsWith('chunk_'))
      .map(f => parseInt(f.replace('chunk_', '')))
      .sort((a, b) => a - b);

    const metaPath = path.join(tempDir, 'meta.json');
    let meta = { fileName: '', totalSize: 0, totalChunks: 0 };
    
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }

    return {
      uploadId,
      chunksReceived,
      totalChunks: meta.totalChunks,
      fileName: meta.fileName,
      totalSize: meta.totalSize,
    };
  },

  async finalizeUpload(userId: string, uploadId: string) {
    const tempDir = path.join(TEMP_DIR, uploadId);
    
    if (!fs.existsSync(tempDir)) {
      throw new Error('Upload not found');
    }

    const metaPath = path.join(tempDir, 'meta.json');
    if (!fs.existsSync(metaPath)) {
      throw new Error('Upload metadata not found');
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    const { fileName, mimeType, totalSize, totalChunks, folderId } = meta;

    await fileService.checkQuota(userId, totalSize);

    const allChunks: Buffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(tempDir, `chunk_${i}`);
      if (!fs.existsSync(chunkPath)) {
        throw new Error(`Missing chunk ${i}`);
      }
      allChunks.push(fs.readFileSync(chunkPath));
    }

    const fileBuffer = Buffer.concat(allChunks);
    const storageKey = `${userId}/${uuidv4()}-${fileName}`;

    await storageProvider.upload(fileBuffer, storageKey, mimeType);

    let dbPath = `/${fileName}`;
    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (folder) {
        dbPath = `${folder.path}/${fileName}`;
      }
    }

    const file = await prisma.file.create({
      data: {
        name: fileName,
        mimeType,
        size: BigInt(totalSize),
        path: dbPath,
        storageKey,
        userId,
        folderId: folderId || null,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { usedQuota: { increment: BigInt(totalSize) } },
    });

    fs.rmSync(tempDir, { recursive: true, force: true });

    return file;
  },

  async cancelUpload(uploadId: string) {
    const tempDir = path.join(TEMP_DIR, uploadId);
    
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  },

  getChunkSize() {
    return CHUNK_SIZE;
  },
};
