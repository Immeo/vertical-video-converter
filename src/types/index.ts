export type CropMode = 'center' | 'blur' | 'manual';

export interface CropOptions {
	mode: CropMode;
	manualX?: number; // 0-100, процент от левого края
	manualY?: number; // 0-100, процент от верхнего края
	manualWidth?: number; // 0-100, процент от ширины
	manualHeight?: number; // 0-100, процент от высоты
}

export interface ProcessOptions {
	uploadId: string;
	startTime: number; // секунды
	endTime: number; // секунды
	resolution: '720p' | '1080p';
	quality: 'low' | 'medium' | 'high';
	crop: CropOptions;
}

export interface ProcessStatus {
	processId: string;
	status: 'pending' | 'processing' | 'done' | 'error';
	progress: number; // 0-100
	error?: string;
	downloadUrl?: string;
}

export interface UploadResult {
	uploadId: string;
	fileName: string;
	fileSize: number;
	duration: number;
	width: number;
	height: number;
}
