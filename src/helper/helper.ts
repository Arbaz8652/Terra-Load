
import { z } from "zod";

export function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}
export function generateCustomKey(key: string | undefined, fileName: string): string {
    const timestamp = Date.now();
    if (key) {
        return `${key}/${timestamp}-${fileName}`;
    }
    return `uploads/${timestamp}-${fileName}`;
}


export function zValidator<T extends z.ZodTypeAny>(
    source: 'json',
    schema: T
): (ctx: any, next: () => Promise<void>) => Promise<void> {
    return async (ctx, next) => {
        let data;
        try {
            if (source === 'json') {
                data = await ctx.req.json();
            } else {
                throw new Error('Unsupported source');
            }
        } catch (err) {
            return ctx.json({ error: 'Invalid JSON' }, 400);
        }

        const result = schema.safeParse(data);
        if (!result.success) {
            return ctx.json({ error: 'Validation failed', details: result.error }, 400);
        }

        // Attach validated data to context for downstream handlers
        ctx.validatedData = result.data;
        await next();
    };
}
