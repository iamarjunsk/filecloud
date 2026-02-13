import { Request, Response } from 'express';
import { fileService } from '../services/fileService';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const metadataSchema = z.object({
  fileId: z.string().uuid(),
});

export const fileController = {
  async upload(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const folderId = req.body.folderId || null;

      const file = await fileService.upload(req.user!.id, {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        folderId,
      });

      res.status(201).json(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      res.status(400).json({ error: message });
    }
  },

  async getMetadata(req: AuthRequest, res: Response) {
    try {
      const file = await fileService.getById(req.user!.id, req.params.id);
      res.json(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File not found';
      res.status(404).json({ error: message });
    }
  },

  async download(req: AuthRequest, res: Response) {
    try {
      const { stream, file } = await fileService.getDownloadStream(req.params.id);
      
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.setHeader('Content-Length', file.size);

      stream.pipe(res);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed';
      res.status(404).json({ error: message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await fileService.delete(req.user!.id, req.params.id);
      res.json({ message: 'File deleted' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete failed';
      res.status(400).json({ error: message });
    }
  },

  async getPresignedUrl(req: AuthRequest, res: Response) {
    try {
      const { url } = await fileService.getPresignedUrl(req.user!.id, req.params.id);
      res.json({ url });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get URL';
      res.status(400).json({ error: message });
    }
  },

  async rename(req: AuthRequest, res: Response) {
    try {
      const { name } = req.body;
      const file = await fileService.rename(req.user!.id, req.params.id, name);
      res.json(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rename failed';
      res.status(400).json({ error: message });
    }
  },

  async move(req: AuthRequest, res: Response) {
    try {
      const { folderId } = req.body;
      const file = await fileService.move(req.user!.id, req.params.id, folderId);
      res.json(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Move failed';
      res.status(400).json({ error: message });
    }
  },
};
