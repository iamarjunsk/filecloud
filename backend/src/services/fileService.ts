import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { storageProvider } from '../services/storage';

const prisma = new PrismaClient();

export interface UploadFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  folderId?: string | null;
}

export const fileService = {
  async checkQuota(userId: string, fileSize: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { quota: true, usedQuota: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.usedQuota + BigInt(fileSize) > user.quota) {
      throw new Error('Quota exceeded');
    }

    return true;
  },

  async upload(userId: string, input: UploadFileInput) {
    await this.checkQuota(userId, input.size);

    const storageKey = `${userId}/${uuidv4()}-${input.originalName}`;
    
    await storageProvider.upload(input.buffer, storageKey, input.mimeType);

    let path = `/${input.originalName}`;
    if (input.folderId) {
      const folder = await prisma.folder.findUnique({
        where: { id: input.folderId },
      });
      if (folder) {
        path = `${folder.path}/${input.originalName}`;
      }
    }

    const file = await prisma.file.create({
      data: {
        name: input.originalName,
        mimeType: input.mimeType,
        size: BigInt(input.size),
        path,
        storageKey,
        userId,
        folderId: input.folderId || null,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        usedQuota: {
          increment: BigInt(input.size),
        },
      },
    });

    return file;
  },

  async getById(userId: string, fileId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      throw new Error('File not found');
    }

    return file;
  },

  async getDownloadStream(fileId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.isDeleted) {
      throw new Error('File not found');
    }

    const stream = await storageProvider.download(file.storageKey);
    return { stream, file };
  },

  async delete(userId: string, fileId: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      throw new Error('File not found');
    }

    await storageProvider.delete(file.storageKey);

    await prisma.file.update({
      where: { id: fileId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        usedQuota: {
          decrement: file.size,
        },
      },
    });
  },

  async getPresignedUrl(userId: string, fileId: string) {
    const file = await this.getById(userId, fileId);
    const url = await storageProvider.generatePresignedUrl(file.storageKey);
    return { url };
  },

  async rename(userId: string, fileId: string, newName: string) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      throw new Error('File not found');
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { name: newName },
    });

    return updated;
  },

  async move(userId: string, fileId: string, folderId: string | null) {
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId, isDeleted: false },
    });

    if (!file) {
      throw new Error('File not found');
    }

    let path = `/${file.name}`;
    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (folder) {
        path = `${folder.path}/${file.name}`;
      }
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { 
        folderId,
        path,
      },
    });

    return updated;
  },
};
