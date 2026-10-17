import { getUploadDir, getUploadPath } from '@/lib/storage';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/validation';
import { randomUUID } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs';
import { parseFile } from 'music-metadata';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get('video') as File | null;

		if (!file) {
			return NextResponse.json(
				{ error: 'Файл не загружен. Выберите видеофайл.' },
				{ status: 400 }
			);
		}

		// Проверка размера
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{
					error: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024} МБ.`
				},
				{ status: 413 }
			);
		}

		// Чтение файла в буфер для проверки сигнатуры
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Проверка реального типа файла по magic bytes
		const fileType = await fileTypeFromBuffer(buffer);
		if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
			return NextResponse.json(
				{ error: `Неподдерживаемый формат. Разрешены: MP4, MOV, AVI, WebM.` },
				{ status: 415 }
			);
		}

		// Извлечение метаданных
		let duration = 0;
		let width = 0;
		let height = 0;

		try {
			const metadata = await parseFile(buffer);
			duration = metadata.format.duration || 0;

			if (metadata.common.video) {
				width = metadata.common.video.width || 0;
				height = metadata.common.video.height || 0;
			}
		} catch (metaErr) {
			console.warn('Не удалось извлечь метаданные:', metaErr);
		}

		// Проверка длительности
		const MAX_DURATION = parseInt(process.env.MAX_DURATION || '180', 10);
		if (duration > MAX_DURATION) {
			return NextResponse.json(
				{
					error: `Видео слишком длинное. Максимальная длительность: ${MAX_DURATION} секунд.`
				},
				{ status: 413 }
			);
		}

		// Сохранение файла
		const uploadId = randomUUID();
		const uploadPath = getUploadPath(uploadId);

		// Убедимся, что директория существует
		getUploadDir();
		fs.writeFileSync(uploadPath, buffer);

		return NextResponse.json({
			uploadId,
			fileName: file.name,
			fileSize: file.size,
			duration,
			width,
			height
		});
	} catch (err) {
		console.error('Ошибка загрузки:', err);
		return NextResponse.json(
			{ error: 'Внутренняя ошибка сервера при загрузке файла.' },
			{ status: 500 }
		);
	}
}
