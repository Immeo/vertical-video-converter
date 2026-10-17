import { getUploadPath } from '@/lib/storage';
import {
	ALLOWED_MIME_TYPES,
	MAX_DURATION,
	MAX_FILE_SIZE
} from '@/lib/validation';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { parseFile } from 'music-metadata';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get('video');

		if (!file || !(file instanceof Blob)) {
			return NextResponse.json({ error: 'Файл не выбран.' }, { status: 400 });
		}

		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			return NextResponse.json(
				{ error: 'Неподдерживаемый тип файла.' },
				{ status: 400 }
			);
		}

		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{
					error: `Файл слишком большой. Максимум ${MAX_FILE_SIZE / 1024 / 1024} МБ.`
				},
				{ status: 400 }
			);
		}

		// Генерируем uploadId с расширением для корректного парсинга music-metadata
		const ext = path.extname(file.name || 'video.mp4') || '.mp4';
		const uploadId = `${randomUUID()}${ext}`;
		const uploadPath = getUploadPath(uploadId);

		// Сохраняем файл на диск
		const bytes = new Uint8Array(await file.arrayBuffer());
		fs.writeFileSync(uploadPath, bytes);

		// Получаем метаданные
		const metadata = await parseFile(uploadPath);
		const videoTrack = metadata.format.trackInfo.find(
			t => t.type === 1 // TrackType.video
		);
		const width =
			videoTrack?.video?.displayWidth || videoTrack?.video?.pixelWidth || 1920;
		const height =
			videoTrack?.video?.displayHeight ||
			videoTrack?.video?.pixelHeight ||
			1080;
		const duration = metadata.format.duration ?? 0;

		// Проверка длительности
		if (duration > MAX_DURATION) {
			fs.unlinkSync(uploadPath);
			return NextResponse.json(
				{ error: `Длина видео превышает ${MAX_DURATION} секунд.` },
				{ status: 400 }
			);
		}

		return NextResponse.json({
			uploadId,
			fileName: file.name || 'video',
			fileSize: file.size,
			duration: Math.round(duration * 10) / 10,
			width,
			height
		});
	} catch (err) {
		console.error('Ошибка загрузки:', err);
		return NextResponse.json(
			{ error: 'Внутренняя ошибка сервера при загрузке.' },
			{ status: 500 }
		);
	}
}
