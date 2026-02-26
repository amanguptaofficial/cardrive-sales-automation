import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client } from '../config/r2.js';
import { env } from '../config/env.js';

export const getPresignedUploadUrl = async (key, contentType) => {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ContentType: contentType
  });
  return getSignedUrl(r2Client, command, { expiresIn: 300 });
};

export const getPresignedDownloadUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key
  });
  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
};
