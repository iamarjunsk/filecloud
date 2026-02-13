import { Request, Response } from 'express';
import { z } from 'zod';
import { folderService } from '../services/folderService';
import { AuthRequest } from '../middleware/auth';

const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().optional(),
});

export const folderController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const input = createFolderSchema.parse(req.body);
      const folder = await folderService.create(req.user!.id, input);
      res.status(201).json(folder);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create folder';
      res.status(400).json({ error: message });
    }
  },

  async getContents(req: AuthRequest, res: Response) {
    try {
      const folderId = req.query.folderId as string | undefined;
      const contents = await folderService.getContents(req.user!.id, folderId || null);
      res.json(contents);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get folder contents';
      res.status(400).json({ error: message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const folder = await folderService.getById(req.user!.id, req.params.id);
      res.json(folder);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Folder not found';
      res.status(404).json({ error: message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await folderService.delete(req.user!.id, req.params.id);
      res.json({ message: 'Folder deleted' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete folder';
      res.status(400).json({ error: message });
    }
  },

  async getPath(req: AuthRequest, res: Response) {
    try {
      const path = await folderService.getPath(req.user!.id, req.params.id);
      res.json(path);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get folder path';
      res.status(400).json({ error: message });
    }
  },

  async rename(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const folder = await folderService.rename(req.user!.id, req.params.id, name);
      res.json(folder);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename folder';
      res.status(400).json({ error: message });
    }
  },

  async move(req: AuthRequest, res: Response) {
    try {
      const { parentId } = req.body;
      const folder = await folderService.move(req.user!.id, req.params.id, parentId);
      res.json(folder);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to move folder';
      res.status(400).json({ error: message });
    }
  },
};
