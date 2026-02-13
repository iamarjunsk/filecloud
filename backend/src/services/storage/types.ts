import { Readable } from 'stream';

export interface StorageProvider {
  upload(buffer: Buffer, key: string, contentType: string): Promise<string>;
  download(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  generatePresignedUrl(key: string, expiresIn?: number): Promise<string>;
}

export interface UploadResult {
  key: string;
  url: string;
}
