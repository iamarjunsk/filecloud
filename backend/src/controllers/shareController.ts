import { Request, Response } from 'express';
import { z } from 'zod';
import { shareService } from '../services/shareService';
import { AuthRequest } from '../middleware/auth';

const createShareSchema = z.object({
  fileId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  expiresIn: z.number().optional(),
  password: z.string().optional(),
}).refine(data => data.fileId || data.folderId, {
  message: 'Either fileId or folderId is required',
});

const validatePasswordSchema = z.object({
  password: z.string(),
});

export const shareController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const input = createShareSchema.parse(req.body);
      const share = await shareService.create(req.user!.id, input);
      res.status(201).json(share);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create share';
      res.status(400).json({ error: message });
    }
  },

  async getByToken(req: AuthRequest, res: Response) {
    try {
      const { token } = req.params;
      const share = await shareService.getByToken(token);
      
      const response: any = {
        id: share.id,
        token: share.token,
        expiresAt: share.expiresAt,
        hasPassword: !!share.password,
        createdAt: share.createdAt,
        user: share.user,
      };

      if (share.file) {
        response.file = {
          id: share.file.id,
          name: share.file.name,
          mimeType: share.file.mimeType,
          size: share.file.size,
        };
      }

      if (share.folder) {
        response.folder = {
          id: share.folder.id,
          name: share.folder.name,
        };
      }

      res.json(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Share not found';
      res.status(404).json({ error: message });
    }
  },

  async validatePassword(req: AuthRequest, res: Response) {
    try {
      const { token } = req.params;
      const { password } = validatePasswordSchema.parse(req.body);
      const isValid = await shareService.validatePassword(token, password);
      res.json({ valid: isValid });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed';
      res.status(400).json({ error: message });
    }
  },

  async getUserShares(req: AuthRequest, res: Response) {
    try {
      const shares = await shareService.getUserShares(req.user!.id);
      res.json(shares);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get shares';
      res.status(400).json({ error: message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      await shareService.delete(req.user!.id, req.params.id);
      res.json({ message: 'Share deleted' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete share';
      res.status(400).json({ error: message });
    }
  },

  async downloadSharedFile(req: AuthRequest, res: Response) {
    try {
      const { token } = req.params;
      const share = await shareService.getByToken(token);

      if (!share.file) {
        return res.status(400).json({ error: 'Not a file share' });
      }

      if (share.password) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: 'Password required' });
        }
        
        const isValid = await shareService.validatePassword(token, authHeader.replace('Bearer ', ''));
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid password' });
        }
      }

      res.redirect(`/api/files/${share.file.id}/download`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed';
      res.status(400).json({ error: message });
    }
  },
};
