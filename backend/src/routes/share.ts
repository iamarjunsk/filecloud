import { Router } from 'express';
import { shareController } from '../controllers/shareController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', shareController.create);
router.get('/me', shareController.getUserShares);
router.delete('/:id', shareController.delete);

export const publicShareRouter = Router();

publicShareRouter.get('/:token', shareController.getByToken);
publicShareRouter.post('/:token/validate', shareController.validatePassword);
publicShareRouter.get('/:token/download', shareController.downloadSharedFile);

export default router;
