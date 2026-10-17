import fs from 'fs';
import os from 'os';
import path from 'path';

const TEMP_DIR =
	process.env.TEMP_DIR || path.join(os.tmpdir(), 'video-processor');

export function getUploadDir(): string {
	const dir = path.join(TEMP_DIR, 'uploads');
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	return dir;
}

export function getOutputDir(): string {
	const dir = path.join(TEMP_DIR, 'outputs');
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	return dir;
}

export function getUploadPath(uploadId: string): string {
	return path.join(getUploadDir(), uploadId);
}

export function getOutputPath(processId: string): string {
	return path.join(getOutputDir(), `${processId}.mp4`);
}

export function fileExists(filePath: string): boolean {
	return fs.existsSync(filePath);
}

export function deleteFile(filePath: string): void {
	try {
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
	} catch (err) {
		console.error(`Ошибка удаления файла ${filePath}:`, err);
	}
}
