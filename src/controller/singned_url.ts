import { Hono } from "hono";
import z from 'zod';
import { generateCustomKey, sanitizeFileName, zValidator } from "../helper/helper.js";
import { CompleteMultipartUploadCommand, CreateMultipartUploadCommand, UploadPartCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3Client.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const app = new Hono()

app.post('/create-multipart',
    zValidator('json', z.object({
        fileName: z.string().min(1),
        fileType: z.string(),
        fileSize: z.number().min(1),
        key: z.string().optional(),
    })),
    async (ctx) => {
        const { fileName, fileType, fileSize, key } = await ctx.req.json();
        const sanitizedFileName = sanitizeFileName(fileName);
        const s3Key = key ?? generateCustomKey(key, sanitizedFileName);

        const command = new CreateMultipartUploadCommand({
            Bucket: process.env.AWS_S3_BUCKET as string,
            Key: s3Key,
            ContentType: fileType,
            Metadata: {
                originalFileName: sanitizedFileName,
                fileSize: fileSize.toString(),
                uploadedAt: new Date().toISOString(),
                uploadType: 'multipart',
            },
        });

        try {

            const response = await s3Client.send(command);
            if (!response.UploadId) {
                throw new Error('No UploadId returned from S3');
            }
            return ctx.json({
                uploadId: response.UploadId,
                key: s3Key,
                bucket: process.env.AWS_S3_BUCKET as string,
            });
        } catch (error) {
            console.error('Error creating multipart upload:', error);
            return ctx.json({ error: 'Failed to create multipart upload' }, 500);
        }
    })

app.post('/get-presigned-urls',
    zValidator('json', z.object({
        key: z.string().min(1),
        parts: z.number().min(1),
        uploadId: z.string().min(1),
    })),
    async (ctx) => {
        const { uploadId, key, parts } = await ctx.req.json();

        try {

            const presignedUrls = await Promise.all(
                Array.from({ length: parts }, (_, index) => index + 1).map(async (partNumber) => {
                    const command = new UploadPartCommand({
                        Bucket: process.env.AWS_S3_BUCKET as string,
                        Key: key,
                        PartNumber: partNumber,
                        UploadId: uploadId,
                    });
                    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                    return { partNumber, url };
                })
            );

            return ctx.json({ presignedUrls });
        } catch (error) {
            console.error('Error getting presigned URL:', error);
            return ctx.json({ error: 'Failed to get presigned URL' }, 500);
        }
    })

app.post('/complete-multipart',
    zValidator('json', z.object({
        key: z.string().min(1),
        uploadId: z.string().min(1),
        parts: z.array(z.object({
            ETag: z.string().min(1),
            PartNumber: z.number().min(1),
        })).min(1),
    })),
    async (ctx) => {
        const { uploadId, key, parts } = await ctx.req.json();

        try {
            const response = await s3Client.send(new CompleteMultipartUploadCommand({
                Bucket: process.env.AWS_S3_BUCKET as string,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: parts,
                },
            }));                        
            return ctx.json({ message: 'Multipart upload completed successfully' });
        } catch (error) {
            console.error('Error completing multipart upload:', error);
            return ctx.json({ error: 'Failed to complete multipart upload' }, 500);
        }
    })

export default app
