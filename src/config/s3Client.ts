import { S3Client } from "@aws-sdk/client-s3";
import 'dotenv/config';

export const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID_1 as string,
        secretAccessKey: process.env.SECRET_ACCESS_KEY_1 as string,
    }
})
