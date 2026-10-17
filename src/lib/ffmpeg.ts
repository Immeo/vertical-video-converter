import { CropMode, ProcessOptions } from '@/types';
import ffmpeg from 'fluent-ffmpeg';

// ==================== Helper-функции ====================

function getQualityParams(quality: 'low' | 'medium' | 'high') {
	switch (quality) {
		case 'low':
			return { crf: 28, preset: 'ultrafast' };
		case 'medium':
			return { crf: 23, preset: 'medium' };
		case 'high':
			return { crf: 18, preset: 'slow' };
	}
}

function getResolutionParams(resolution: '720p' | '1080p') {
	switch (resolution) {
		case '720p':
			return { width: 720, height: 1280 };
		case '1080p':
			return { width: 1080, height: 1920 };
	}
}

function buildCropFilter(
	mode: CropMode,
	inputWidth: number,
	inputHeight: number,
	manualX?: number,
	manualY?: number,
	manualWidth?: number,
	manualHeight?: number
): string {
	const targetWidth = 1080;
	const targetHeight = 1920;
	const targetAspect = targetWidth / targetHeight;

	if (mode === 'blur') {
		// Масштабируем до цели, затем padding с размытым фоном, затем кроп
		return [
			`scale=${inputWidth}:${inputHeight}:force_original_aspect_ratio=decrease`,
			`pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:color=black`,
			`crop=${targetWidth}:${targetHeight}`
		].join(',');
	}

	if (mode === 'manual' && manualWidth && manualHeight) {
		const x = (manualX! / 100) * inputWidth;
		const y = (manualY! / 100) * inputHeight;
		const w = (manualWidth / 100) * inputWidth;
		const h = (manualHeight / 100) * inputHeight;
		return [
			`scale=${inputWidth}:${inputHeight}`,
			`crop=${w}:${h}:${x}:${y}`
		].join(',');
	}

	// center — кроп по центру до целевого соотношения сторон
	const inputAspect = inputWidth / inputHeight;
	let w: number, h: number;

	if (inputAspect > targetAspect) {
		// шире — кропим по ширине
		w = inputHeight * targetAspect;
		h = inputHeight;
	} else {
		// выше — кропим по высоте
		w = inputWidth;
		h = inputWidth / targetAspect;
	}

	const x = (inputWidth - w) / 2;
	const y = (inputHeight - h) / 2;

	return `crop=${w}:${h}:${x}:${y}`;
}

// ==================== Основные функции ====================

export function createFFmpegCommand(
	inputPath: string,
	outputPath: string,
	options: ProcessOptions,
	inputWidth: number,
	inputHeight: number
): ffmpeg.FfmpegCommand {
	const command = ffmpeg(inputPath);
	const { crf, preset } = getQualityParams(options.quality);
	const { width, height } = getResolutionParams(options.resolution);
	const duration = options.endTime - options.startTime;

	command
		.size(`${width}x${height}`)
		.videoCodec('libx264')
		.audioCodec('aac')
		.outputOptions([
			`-ss ${options.startTime}`,
			`-t ${duration}`,
			`-crf ${crf}`,
			`-preset ${preset}`,
			'-profile:v high',
			'-level 4.0',
			'-pix_fmt yuv420p',
			'-movflags +faststart',
			'-b:a 128k',
			'-ar 44100',
			'-ac 2'
		]);

	if (options.crop.mode === 'blur') {
		command.videoFilter(buildCropFilter('blur', inputWidth, inputHeight));
	} else {
		const filter = buildCropFilter(
			options.crop.mode,
			inputWidth,
			inputHeight,
			options.crop.manualX,
			options.crop.manualY,
			options.crop.manualWidth,
			options.crop.manualHeight
		);
		command.videoFilter(filter);
	}

	return command;
}

export function runFFmpeg(
	inputPath: string,
	outputPath: string,
	options: ProcessOptions,
	inputWidth: number,
	inputHeight: number,
	onProgress?: (percent: number) => void
): Promise<void> {
	return new Promise((resolve, reject) => {
		const command = createFFmpegCommand(
			inputPath,
			outputPath,
			options,
			inputWidth,
			inputHeight
		);

		if (onProgress) {
			command.on('progress', progress => {
				// fluent-ffmpeg progress: { percent?, currentDuration, frames, ... }
				if (progress.percent) {
					onProgress(progress.percent);
				} else if (progress.currentDuration) {
					// fallback: оцениваем по текущей длительности
					const duration = options.endTime - options.startTime;
					const percent = (progress.currentDuration / duration) * 100;
					onProgress(Math.min(percent, 99));
				}
			});
		}

		command
			.on('end', () => resolve())
			.on('error', err => reject(new Error(`Ошибка FFmpeg: ${err.message}`)))
			.save(outputPath);
	});
}
