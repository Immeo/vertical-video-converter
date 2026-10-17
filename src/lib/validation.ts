import { z } from 'zod';

export const processOptionsSchema = z.object({
	uploadId: z.string().min(1),
	startTime: z.number().min(0),
	endTime: z.number().min(0),
	resolution: z.enum(['720p', '1080p']),
	quality: z.enum(['low', 'medium', 'high']),
	crop: z.object({
		mode: z.enum(['center', 'blur', 'manual']),
		manualX: z.number().min(0).max(100).optional(),
		manualY: z.number().min(0).max(100).optional(),
		manualWidth: z.number().min(1).max(100).optional(),
		manualHeight: z.number().min(1).max(100).optional()
	})
});

export function validateProcessOptions(data: unknown) {
	return processOptionsSchema.safeParse(data);
}

export const MAX_FILE_SIZE = parseInt(
	process.env.MAX_FILE_SIZE || '209715200',
	10
);
export const MAX_DURATION = parseInt(process.env.MAX_DURATION || '180', 10);
export const ALLOWED_MIME_TYPES = [
	'video/mp4',
	'video/quicktime',
	'video/x-msvideo',
	'video/webm'
];
