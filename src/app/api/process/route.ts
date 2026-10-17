import { runFFmpeg } from '@/lib/ffmpeg';
import { fileExists, getOutputPath, getUploadPath } from '@/lib/storage';
import { validateProcessOptions } from '@/lib/validation';
import { randomUUID } from 'crypto';
import { parseFile } from 'music-metadata';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

// In-memory хранилище статусов (для MVP; в продакшене — Redis/БД)
const processStatuses = new Map<
	string,
	{
		status: 'pending' | 'processing' | 'done' | 'error';
		progress: number;
		error?: string;
	}
>();

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const validation = validateProcessOptions(body);

		if (!validation.success) {
			return NextResponse.json(
				{
					error: 'Некорректные параметры обработки.',
					details: validation.error.flatten()
				},
				{ status: 400 }
			);
		}

		const options = validation.data;
		const uploadPath = getUploadPath(options.uploadId);

		if (!fileExists(uploadPath)) {
			return NextResponse.json(
				{ error: 'Загруженный файл не найден. Повторите загрузку.' },
				{ status: 404 }
			);
		}

		// Проверка порядка времени
		if (options.startTime >= options.endTime) {
			return NextResponse.json(
				{ error: 'Время начала должно быть меньше времени окончания.' },
				{ status: 400 }
			);
		}

		// Получаем размеры видео
		const metadata = await parseFile(uploadPath);
		const video = metadata.common.video;
		const inputWidth = video?.width || 1920;
		const inputHeight = video?.height || 1080;

		const processId = randomUUID();
		const outputPath = getOutputPath(processId);

		// Сохраняем начальный статус
		processStatuses.set(processId, { status: 'pending', progress: 0 });

		// Запускаем обработку асинхронно
		(async () => {
			try {
				processStatuses.set(processId, { status: 'processing', progress: 0 });

				await runFFmpeg(
					uploadPath,
					outputPath,
					options,
					inputWidth,
					inputHeight,
					percent => {
						processStatuses.set(processId, {
							status: 'processing',
							progress: Math.min(percent, 99)
						});
					}
				);

				processStatuses.set(processId, { status: 'done', progress: 100 });
			} catch (err) {
				console.error(`Ошибка обработки ${processId}:`, err);
				processStatuses.set(processId, {
					status: 'error',
					progress: 0,
					error:
						'Ошибка при обработке видео. Проверьте параметры и попробуйте снова.'
				});
			}
		})();

		return NextResponse.json({ processId });
	} catch (err) {
		console.error('Ошибка запуска обработки:', err);
		return NextResponse.json(
			{ error: 'Внутренняя ошибка сервера при запуске обработки.' },
			{ status: 500 }
		);
	}
}
