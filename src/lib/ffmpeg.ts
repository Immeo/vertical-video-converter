import { CropMode, ProcessOptions } from '@/types';
import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

// Указываем путь к статическому бинарнику FFmpeg
if (ffmpegStatic) {
	ffmpeg.setFfmpegPath(ffmpegStatic);
}

export function buildCropFilter(
	mode: CropMode,
	inputWidth: number,
	inputHeight: number,
	manualX?: number,
	manualY?: number,
	manualWidth?: number,
	manualHeight?: number
): string {
	const targetAspect = 9 / 16;

	switch (mode) {
		case 'center': {
			// Обрезка по центру: вычисляем ширину кадра 9:16 от исходной высоты
			const cropWidth = Math.min(
				inputWidth,
				Math.floor(inputHeight * targetAspect)
			);
			const x = Math.floor((inputWidth - cropWidth) / 2);
			return `crop=${cropWidth}:${inputHeight}:${x}:0,scale=1080:1920`;
		}

		case 'blur': {
			// Размытие фона: масштабируем до 1080x1920 с обрезкой, размываем, затем накладываем оригинал
			return [
				`[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=40:4,setsar=1[bg]`,
				`[0:v]scale=1080:-1[fg]`,
				`[bg][fg]overlay=(W-w)/2:(H-h)/2[out]`
			].join(';');
		}

		case 'manual': {
			// Ручной выбор области: координаты в процентах
			const w = Math.floor(((manualWidth || 100) * inputWidth) / 100);
			const h = Math.floor(((manualHeight || 100) * inputHeight) / 100);
			const x = Math.floor(((manualX || 0) * inputWidth) / 100);
			const y = Math.floor(((manualY || 0) * inputHeight) / 100);
			return `crop=${w}:${h}:${x}:${y},scale=1080:1920`;
		}

		default:
			throw new Error('Неизвестный режим кадрирования');
	}
}

export function getResolutionParams(resolution: '720p' | '1080p'): {
	width: number;
	height: number;
} {
	return resolution === '1080p'
		? { width: 1080, height: 1920 }
		: { width: 720, height: 1280 };
}

export function getQualityParams(quality: 'low' | 'medium' | 'high'): {
	crf: number;
	preset: string;
} {
	switch (quality) {
		case 'high':
			return { crf: 18, preset: 'slow' };
		case 'medium':
			return { crf: 23, preset: 'medium' };
		case 'low':
			return { crf: 28, preset: 'fast' };
		default:
			return { crf: 23, preset: 'medium' };
	}
}

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

	// Обрезка по времени
	command.setStartTime(options.startTime);
	command.setDuration(options.endTime - options.startTime);

	// Применяем фильтры в зависимости от режима
	if (options.crop.mode === 'blur') {
		command.complexFilter(
			buildCropFilter('blur', inputWidth, inputHeight),
			'out'
		);
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
		command.videoFilters(filter);
	}

	command
		.size(`${width}x${height}`)
		.videoCodec('libx264')
		.outputOptions([
			`-crf ${crf}`,
			`-preset ${preset}`,
			'-profile:v high',
			'-level 4.0',
			'-pix_fmt yuv420p',
			'-movflags +faststart',
			'-c:a aac',
			'-b:a 128k',
			'-ar 44100',
			'-ac 2'
		])
		.on('progress', progress => {
			console.log(`Обработка: ${progress.percent?.toFixed(1)}%`);
		})
		.on('end', () => {
			console.log('Обработка завершена');
		})
		.on('error', err => {
			console.error('Ошибка FFmpeg:', err.message);
		});

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
				onProgress(progress.percent || 0);
			});
		}

		command
			.save(outputPath)
			.on('end', () => resolve())
			.on('error', err => reject(new Error(`Ошибка FFmpeg: ${err.message}`)));
	});
}
