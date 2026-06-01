import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly minioClient: Minio.Client;
  private readonly logger = new Logger(StorageService.name);
  private readonly bucketName =
    process.env.MINIO_BUCKET_NAME || 'workflow-documents';

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'rootadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'rootpassword123',
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'eu-central-1');
        this.logger.log(`✅ Utworzono nowy bucket w MinIO: ${this.bucketName}`);
      } else {
        this.logger.log(
          `✅ Połączono z MinIO. Bucket '${this.bucketName}' jest gotowy.`,
        );
      }
    } catch (error) {
      this.logger.error('❌ Błąd połączenia z MinIO', error);
    }
  }

  async getPresignedUploadUrl(
    objectName: string,
    expiryInSeconds: number = 3600,
  ): Promise<string> {
    try {
      return await this.minioClient.presignedPutObject(
        this.bucketName,
        objectName,
        expiryInSeconds,
      );
    } catch (error) {
      this.logger.error(`Błąd upload url dla: ${objectName}`, error);
      throw error;
    }
  }

  async getPresignedDownloadUrl(
    objectName: string,
    expiryInSeconds: number = 3600,
  ): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(
        this.bucketName,
        objectName,
        expiryInSeconds,
      );
    } catch (error) {
      this.logger.error(`Błąd download url dla: ${objectName}`, error);
      throw error;
    }
  }
}
