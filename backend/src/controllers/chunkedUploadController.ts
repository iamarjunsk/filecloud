import { Request, Response } from 'express';
import { z } from 'zod';
import { chunkedUploadService } from '../services/chunkedUploadService';
import { AuthRequest } from '../middleware/auth';

const initializeSchema = z.object({
  fileName: z.string(),
  mimeType: z.string(),
  totalSize: z.number(),
  totalChunks: z.number(),
  folderId: z.string().optional(),
});

const finalizeSchema = z.object({
  uploadId: z.string(),
});

export const chunkedUploadController = {
  async initialize(req: AuthRequest, res: Response) {
    try {
      const input = initializeSchema.parse(req.body);
      const { uploadId } = await chunkedUploadService.initializeUpload(
        req.user!.id,
        input.fileName,
        input.mimeType,
        input.totalSize,
        input.totalChunks,
        input.folderId
      );

      const tempDir = require('path').join(process.cwd(), 'uploads', 'temp', uploadId);
      const metaPath = require('path').join(tempDir, 'meta.json');
      require('fs').writeFileSync(metaPath, JSON.stringify({
        fileName: input.fileName,
        mimeType: input.mimeType,
        totalSize: input.totalSize,
        totalChunks: input.totalChunks,
        folderId: input.folderId,
      }));

      res.json({ uploadId, chunkSize: chunkedUploadService.getChunkSize() });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize upload';
      res.status(400).json({ error: message });
    }
  },

  async uploadChunk(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No chunk uploaded' });
      }

      const { uploadId, index, totalChunks, fileName, mimeType, totalSize, folderId } = req.body;

      const status = await chunkedUploadService.uploadChunk(req.user!.id, {
        uploadId,
        chunk: req.file.buffer,
        index: parseInt(index),
        totalChunks: parseInt(totalChunks),
        fileName,
        mimeType,
        totalSize: parseInt(totalSize),
        folderId,
      });

      res.json(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload chunk';
      res.status(400).json({ error: message });
    }
  },

  async getStatus(req: AuthRequest, res: Response) {
    try {
      const { uploadId } = req.params;
      const status = await chunkedUploadService.getStatus(uploadId);
      
      if (!status) {
        return res.status(404).json({ error: 'Upload not found' });
      }

      res.json(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get status';
      res.status(400).json({ error: message });
    }
  },

  async finalize(req: AuthRequest, res: Response) {
    try {
      const { uploadId } = finalizeSchema.parse(req.body);
      const file = await chunkedUploadService.finalizeUpload(req.user!.id, uploadId);
      res.json(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to finalize upload';
      res.status(400).json({ error: message });
    }
  },

  async cancel(req: AuthRequest, res: Response) {
    try {
      const { uploadId } = req.params;
      await chunkedUploadService.cancelUpload(uploadId);
      res.json({ message: 'Upload cancelled' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel upload';
      res.status(400).json({ error: message });
    }
  },

  getChunkSize(req: AuthRequest, res: Response) {
    res.json({ chunkSize: chunkedUploadService.getChunkSize() });
  },
};
