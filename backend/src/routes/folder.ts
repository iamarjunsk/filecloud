import { Router } from 'express';
import { folderController } from '../controllers/folderController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', folderController.create);
router.get('/', folderController.getContents);
router.get('/:id', folderController.getById);
router.delete('/:id', folderController.delete);
router.get('/:id/path', folderController.getPath);
router.patch('/:id', folderController.rename);
router.post('/:id/move', folderController.move);

export default router;
