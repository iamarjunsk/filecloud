import sharp from 'sharp';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

const THUMBNAIL_WIDTH = 256;
const THUMBNAIL_HEIGHT = 256;

export class ThumbnailService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      endpoint: `http://${config.minio.endpoint}:${config.minio.port}`,
      forcePathStyle: true,
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.minio.accessKey,
        secretAccessKey: config.minio.secretKey,
      },
    });
    this.bucket = config.minio.thumbnailBucket;
  }

  async generateThumbnail(fileBuffer: Buffer, contentType: string): Promise<Buffer> {
    if (!contentType.startsWith('image/')) {
      throw new Error('Not an image file');
    }

    const thumbnail = await sharp(fileBuffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return thumbnail;
  }

  async uploadThumbnail(storageKey: string, thumbnailBuffer: Buffer): Promise<string> {
    const thumbnailKey = `thumbnails/${storageKey}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
    });

    await this.client.send(command);
    return thumbnailKey;
  }

  async getThumbnail(storageKey: string): Promise<Buffer | null> {
    const thumbnailKey = `thumbnails/${storageKey}`;

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: thumbnailKey,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        return null;
      }

      const chunks: Buffer[] = [];
      for await (const chunk of response.Body as AsyncIterable<Buffer>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }

  async processAndUpload(fileBuffer: Buffer, storageKey: string, contentType: string): Promise<string | null> {
    try {
      const thumbnail = await this.generateThumbnail(fileBuffer, contentType);
      const thumbnailKey = await this.uploadThumbnail(storageKey, thumbnail);
      return thumbnailKey;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return null;
    }
  }
}

export const thumbnailService = new ThumbnailService();
