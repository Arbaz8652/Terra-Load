import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: 'Your Bucket name',
    credentials: {
        accessKeyId: 'Your access key',
        secretAccessKey: 'Your secret key',
    }
})