import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateFolderInput {
  name: string;
  parentId?: string | null;
}

export interface FolderContents {
  folders: any[];
  files: any[];
}

export const folderService = {
  async create(userId: string, input: CreateFolderInput) {
    let path = `/${input.name}`;

    if (input.parentId) {
      const parent = await prisma.folder.findUnique({
        where: { id: input.parentId },
      });

      if (!parent) {
        throw new Error('Parent folder not found');
      }

      if (parent.userId !== userId) {
        throw new Error('Access denied');
      }

      path = `${parent.path}/${input.name}`;
    }

    const existing = await prisma.folder.findFirst({
      where: {
        name: input.name,
        parentId: input.parentId || null,
        userId,
        isDeleted: false,
      },
    });

    if (existing) {
      throw new Error('Folder already exists in this location');
    }

    const folder = await prisma.folder.create({
      data: {
        name: input.name,
        path,
        parentId: input.parentId || null,
        userId,
      },
    });

    return folder;
  },

  async getContents(userId: string, folderId: string | null): Promise<FolderContents> {
    const query: any = {
      where: {
        userId,
        isDeleted: false,
      },
      include: {
        children: {
          where: { isDeleted: false },
          select: { id: true, name: true, path: true, createdAt: true, updatedAt: true },
        },
        files: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    };

    if (folderId) {
      query.where.parentId = folderId;
    } else {
      query.where.parentId = null;
    }

    const folders = await prisma.folder.findMany(query);
    const files = folderId 
      ? await prisma.file.findMany({
          where: { folderId, userId, isDeleted: false },
          select: { id: true, name: true, mimeType: true, size: true, createdAt: true, updatedAt: true },
        })
      : [];

    return {
      folders,
      files,
    };
  },

  async getById(userId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, isDeleted: false },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    return folder;
  },

  async delete(userId: string, folderId: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, isDeleted: false },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const childFolders = await prisma.folder.findMany({
      where: { parentId: folderId, isDeleted: false },
    });

    for (const child of childFolders) {
      await this.delete(userId, child.id);
    }

    await prisma.file.updateMany({
      where: { folderId, userId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await prisma.folder.update({
      where: { id: folderId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },

  async getPath(userId: string, folderId: string) {
    const path: any[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = await prisma.folder.findFirst({
        where: { id: currentId, userId, isDeleted: false },
      });

      if (!folder) break;

      path.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }

    return path;
  },

  async rename(userId: string, folderId: string, newName: string) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, isDeleted: false },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: { name: newName },
    });

    return updated;
  },

  async move(userId: string, folderId: string, parentId: string | null) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, userId, isDeleted: false },
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: { parentId },
    });

    return updated;
  },
};
