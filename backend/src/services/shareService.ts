import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export interface CreateShareInput {
  fileId?: string;
  folderId?: string;
  expiresIn?: number;
  password?: string;
}

export const shareService = {
  async create(userId: string, input: CreateShareInput) {
    if (!input.fileId && !input.folderId) {
      throw new Error('Either fileId or folderId is required');
    }

    if (input.fileId) {
      const file = await prisma.file.findFirst({
        where: { id: input.fileId, userId },
      });

      if (!file) {
        throw new Error('File not found');
      }
    }

    if (input.folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: input.folderId, userId },
      });

      if (!folder) {
        throw new Error('Folder not found');
      }
    }

    let hashedPassword: string | null = null;
    if (input.password) {
      hashedPassword = await bcrypt.hash(input.password, 10);
    }

    const expiresAt = input.expiresIn 
      ? new Date(Date.now() + input.expiresIn * 1000)
      : null;

    const share = await prisma.share.create({
      data: {
        userId,
        fileId: input.fileId || null,
        folderId: input.folderId || null,
        expiresAt,
        password: hashedPassword,
      },
    });

    return {
      id: share.id,
      token: share.token,
      expiresAt: share.expiresAt,
      hasPassword: !!hashedPassword,
    };
  },

  async getByToken(token: string) {
    const share = await prisma.share.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        file: true,
        folder: true,
      },
    });

    if (!share) {
      throw new Error('Share not found');
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new Error('Share link has expired');
    }

    return share;
  },

  async validatePassword(token: string, password: string) {
    const share = await prisma.share.findUnique({
      where: { token },
    });

    if (!share) {
      throw new Error('Share not found');
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new Error('Share link has expired');
    }

    if (!share.password) {
      return true;
    }

    return bcrypt.compare(password, share.password);
  },

  async getUserShares(userId: string) {
    const shares = await prisma.share.findMany({
      where: { userId },
      include: {
        file: {
          select: { id: true, name: true, mimeType: true, size: true },
        },
        folder: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shares;
  },

  async delete(userId: string, shareId: string) {
    const share = await prisma.share.findFirst({
      where: { id: shareId, userId },
    });

    if (!share) {
      throw new Error('Share not found');
    }

    await prisma.share.delete({
      where: { id: shareId },
    });
  },
};
