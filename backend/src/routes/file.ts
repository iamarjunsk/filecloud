import { Router } from 'express';
import multer from 'multer';
import { fileController } from '../controllers/fileController';
import { chunkedUploadController } from '../controllers/chunkedUploadController';
import { authenticate } from '../middleware/auth';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB
});

router.use(authenticate);

router.post('/upload', upload.single('file'), fileController.upload);
router.get('/chunk-size', chunkedUploadController.getChunkSize);
router.post('/chunked/initialize', chunkedUploadController.initialize);
router.post('/chunked/upload', upload.single('chunk'), chunkedUploadController.uploadChunk);
router.get('/chunked/status/:uploadId', chunkedUploadController.getStatus);
router.post('/chunked/finalize', chunkedUploadController.finalize);
router.delete('/chunked/cancel/:uploadId', chunkedUploadController.cancel);
router.get('/:id', fileController.getMetadata);
router.get('/:id/download', fileController.download);
router.delete('/:id', fileController.delete);
router.get('/:id/url', fileController.getPresignedUrl);
router.patch('/:id', fileController.rename);
router.post('/:id/move', fileController.move);

export default router;
