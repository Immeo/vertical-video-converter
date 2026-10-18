'use client';

import type { CropOptions } from '@/types';
import { useEffect, useRef } from 'react';

interface VideoPreviewProps {
	videoUrl: string;
	crop: CropOptions;
}

export default function VideoPreview({ videoUrl, crop }: VideoPreviewProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	const drawPreview = () => {
		const canvas = canvasRef.current;
		const video = videoRef.current;
		if (!canvas || !video || video.readyState < 2) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Целевое разрешение превью (пропорция 9:16, масштабирована для производительности)
		const targetW = canvas.width; // 360
		const targetH = canvas.height; // 640

		ctx.clearRect(0, 0, targetW, targetH);
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, targetW, targetH);

		if (crop.mode === 'blur') {
			// 1. Фон: размытое видео, заполняющее весь кадр (аналог object-cover)
			ctx.filter = 'blur(20px) brightness(0.6)';
			const bgScale = Math.max(
				targetW / video.videoWidth,
				targetH / video.videoHeight
			);
			const bgW = video.videoWidth * bgScale;
			const bgH = video.videoHeight * bgScale;
			ctx.drawImage(video, (targetW - bgW) / 2, (targetH - bgH) / 2, bgW, bgH);

			// 2. Передний план: видео вписано в кадр без обрезки (аналог object-contain)
			ctx.filter = 'none';
			const fgScale = Math.min(
				targetW / video.videoWidth,
				targetH / video.videoHeight
			);
			const fgW = video.videoWidth * fgScale;
			const fgH = video.videoHeight * fgScale;
			ctx.drawImage(video, (targetW - fgW) / 2, (targetH - fgH) / 2, fgW, fgH);
		} else {
			let sx = 0,
				sy = 0,
				sWidth = video.videoWidth,
				sHeight = video.videoHeight;

			if (crop.mode === 'center') {
				// Обрезка по центру (аналог object-cover)
				const scale = Math.max(
					targetW / video.videoWidth,
					targetH / video.videoHeight
				);
				sWidth = targetW / scale;
				sHeight = targetH / scale;
				sx = (video.videoWidth - sWidth) / 2;
				sy = (video.videoHeight - sHeight) / 2;
			} else if (crop.mode === 'manual') {
				// Ручная обрезка: берем указанный процент от оригинала и растягиваем на 9:16
				sx = video.videoWidth * ((crop.manualX ?? 0) / 100);
				sy = video.videoHeight * ((crop.manualY ?? 0) / 100);
				sWidth = video.videoWidth * ((crop.manualWidth ?? 100) / 100);
				sHeight = video.videoHeight * ((crop.manualHeight ?? 100) / 100);
			}

			ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);
		}

		// Визуальная сетка (правило третей) для профессионального вида
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(targetW / 3, 0);
		ctx.lineTo(targetW / 3, targetH);
		ctx.moveTo((targetW / 3) * 2, 0);
		ctx.lineTo((targetW / 3) * 2, targetH);
		ctx.moveTo(0, targetH / 3);
		ctx.lineTo(targetW, targetH / 3);
		ctx.moveTo(0, (targetH / 3) * 2);
		ctx.lineTo(targetW, (targetH / 3) * 2);
		ctx.stroke();
	};

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const handleReady = () => drawPreview();

		if (video.readyState >= 2) {
			drawPreview();
		} else {
			video.addEventListener('loadeddata', handleReady);
			video.addEventListener('seeked', handleReady);
		}

		return () => {
			video.removeEventListener('loadeddata', handleReady);
			video.removeEventListener('seeked', handleReady);
		};
	}, [crop, videoUrl]); // Перерисовка при смене кадрирования или видео

	// Проверка на сильное искажение пропорций в ручном режиме
	const isManualDistorted =
		crop.mode === 'manual' &&
		Math.abs((crop.manualWidth ?? 100) / (crop.manualHeight ?? 100) - 9 / 16) >
			0.15;

	return (
		<div className='bg-white rounded-lg shadow p-6 space-y-4'>
			<h2 className='text-lg font-semibold flex items-center gap-2'>
				<span>👁️</span> Предпросмотр результата (9:16)
			</h2>

			{isManualDistorted && (
				<div className='bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-3 py-2 rounded flex items-start gap-2'>
					<span>⚠️</span>
					<span>
						Выбранная область имеет пропорции, отличные от 9:16. Итоговое видео
						будет растянуто или сжато для соответствия формату.
					</span>
				</div>
			)}

			<div className='flex justify-center bg-gray-100 rounded-lg p-4 border border-gray-200'>
				<canvas
					ref={canvasRef}
					width={360}
					height={640}
					className='max-h-[50vh] w-auto shadow-md rounded bg-black'
				/>
			</div>

			{/* Скрытый видеоэлемент, выступающий источником данных для canvas */}
			<video
				ref={videoRef}
				src={videoUrl}
				crossOrigin='anonymous'
				className='hidden'
				muted
				playsInline
			/>

			<p className='text-xs text-gray-500 text-center'>
				Показан статический кадр. Итоговое видео будет обработано сервером с
				указанными параметрами.
			</p>
		</div>
	);
}
