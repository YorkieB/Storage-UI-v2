import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

// Configure S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
  forcePathStyle: false, // Use virtual-hosted-style URLs
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET;
const CDN_ENDPOINT = process.env.DO_SPACES_CDN_ENDPOINT;

/**
 * Upload a file to DigitalOcean Spaces
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Name to save in Spaces
 * @param {string} mimeType - MIME type of file
 * @param {string} userId - User ID for folder structure
 * @returns {Promise<{key: string, url: string}>}
 */
export async function uploadToSpaces(fileBuffer, fileName, mimeType, userId) {
  try {
    // Create a unique key with user folder structure
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `users/${userId}/${timestamp}_${safeFileName}`;

    // Upload using multipart upload for better handling of large files
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: 'public-read', // Make files publicly readable
      },
    });

    upload.on('httpUploadProgress', (progress) => {
      console.log(`Upload progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
    });

    await upload.done();

    // Generate the CDN URL
    const url = CDN_ENDPOINT
      ? `${CDN_ENDPOINT}/${key}`
      : `${process.env.DO_SPACES_ENDPOINT}/${BUCKET_NAME}/${key}`;

    console.log(`✅ File uploaded to Spaces: ${key}`);

    return { key, url };
  } catch (error) {
    console.error('❌ Error uploading to Spaces:', error);
    throw new Error('Failed to upload file to cloud storage');
  }
}

/**
 * Get a file from DigitalOcean Spaces
 * @param {string} key - File key in Spaces
 * @returns {Promise<Buffer>}
 */
export async function getFromSpaces(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error('❌ Error getting file from Spaces:', error);
    throw new Error('Failed to retrieve file from cloud storage');
  }
}

/**
 * Delete a file from DigitalOcean Spaces
 * @param {string} key - File key in Spaces
 * @returns {Promise<void>}
 */
export async function deleteFromSpaces(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`✅ File deleted from Spaces: ${key}`);
  } catch (error) {
    console.error('❌ Error deleting from Spaces:', error);
    throw new Error('Failed to delete file from cloud storage');
  }
}

/**
 * Generate a presigned URL for temporary file access
 * @param {string} key - File key in Spaces
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>}
 */
export async function getPresignedUrl(key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('❌ Error generating presigned URL:', error);
    throw new Error('Failed to generate download link');
  }
}

/**
 * Check if a file exists in Spaces
 * @param {string} key - File key in Spaces
 * @returns {Promise<boolean>}
 */
export async function fileExistsInSpaces(key) {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

export default s3Client;
