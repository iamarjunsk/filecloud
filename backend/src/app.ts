import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config';
import authRoutes from './routes/auth';
import folderRoutes from './routes/folder';
import fileRoutes from './routes/file';
import shareRoutes, { publicShareRouter } from './routes/share';
import { authLimiter, apiLimiter, uploadLimiter } from './middleware/rateLimiter';

export const app: Application = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: config.nodeEnv === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : true,
  credentials: true,
}));

app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/folders', apiLimiter, folderRoutes);
app.use('/api/files', uploadLimiter, fileRoutes);
app.use('/api/shares', apiLimiter, shareRoutes);
app.use('/s', publicShareRouter);

app.get('/health', async (req: Request, res: Response) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      minio: 'unknown',
    },
  };

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    healthcheck.services.database = 'healthy';
    await prisma.$disconnect();
  } catch {
    healthcheck.services.database = 'unhealthy';
    healthcheck.status = 'degraded';
  }

  try {
    const { createClient } = await import('redis');
    const redis = createClient({ url: config.redis.url });
    await redis.connect();
    await redis.ping();
    healthcheck.services.redis = 'healthy';
    await redis.disconnect();
  } catch {
    healthcheck.services.redis = 'unhealthy';
    healthcheck.status = 'degraded';
  }

  try {
    const { S3Client } = await import('@aws-sdk/client-s3');
    const s3 = new S3Client({
      endpoint: `http://${config.minio.endpoint}:${config.minio.port}`,
      forcePathStyle: true,
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.minio.accessKey,
        secretAccessKey: config.minio.secretKey,
      },
    });
    healthcheck.services.minio = 'healthy';
  } catch {
    healthcheck.services.minio = 'unhealthy';
    healthcheck.status = 'degraded';
  }

  const statusCode = healthcheck.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});
