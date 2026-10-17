'use client';

import CropSelector from '@/components/CropSelector';
import ProcessStatus from '@/components/ProcessStatus';
import UploadForm from '@/components/UploadForm';
import type { CropOptions, UploadResult } from '@/types';
import { useState } from 'react';

export default function Home() {
	const [upload, setUpload] = useState<UploadResult | null>(null);
	const [crop, setCrop] = useState<CropOptions>({ mode: 'center' });
	const [processId, setProcessId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleUploadSuccess = (result: UploadResult) => {
		setUpload(result);
		setError(null);
	};

	const handleProcess = async (params: {
		startTime: number;
		endTime: number;
		resolution: '720p' | '1080p';
		quality: 'low' | 'medium' | 'high';
	}) => {
		if (!upload) return;
		setError(null);

		try {
			const res = await fetch('/api/process', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					uploadId: upload.uploadId,
					...params,
					crop
				})
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.error || 'Ошибка запуска обработки');
				return;
			}

			setProcessId(data.processId);
		} catch {
			setError('Не удалось соединиться с сервером.');
		}
	};

	return (
		<div className='space-y-8'>
			{error && (
				<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
					{error}
				</div>
			)}

			{!upload && <UploadForm onSuccess={handleUploadSuccess} />}

			{upload && !processId && (
				<>
					<div className='bg-white rounded-lg shadow p-6'>
						<h2 className='text-lg font-semibold mb-2'>Загруженное видео</h2>
						<p className='text-sm text-gray-600'>
							{upload.fileName} — {(upload.fileSize / 1024 / 1024).toFixed(1)}{' '}
							МБ, {upload.duration.toFixed(1)} сек, {upload.width}×
							{upload.height}
						</p>
					</div>

					<CropSelector value={crop} onChange={setCrop} />

					<div className='bg-white rounded-lg shadow p-6'>
						<h2 className='text-lg font-semibold mb-4'>Параметры обработки</h2>
						<ProcessForm upload={upload} onSubmit={handleProcess} />
					</div>
				</>
			)}

			{processId && (
				<ProcessStatus
					processId={processId}
					onReset={() => {
						setProcessId(null);
						setUpload(null);
					}}
				/>
			)}
		</div>
	);
}

function ProcessForm({
	upload,
	onSubmit
}: {
	upload: UploadResult;
	onSubmit: (params: {
		startTime: number;
		endTime: number;
		resolution: '720p' | '1080p';
		quality: 'low' | 'medium' | 'high';
	}) => void;
}) {
	const [startTime, setStartTime] = useState(0);
	const [endTime, setEndTime] = useState(Math.min(upload.duration, 60));
	const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
	const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');

	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-2 gap-4'>
				<div>
					<label className='block text-sm font-medium mb-1'>Начало (сек)</label>
					<input
						type='number'
						min={0}
						max={upload.duration}
						step={0.1}
						value={startTime}
						onChange={e => setStartTime(parseFloat(e.target.value) || 0)}
						className='w-full border rounded px-3 py-2'
					/>
				</div>
				<div>
					<label className='block text-sm font-medium mb-1'>Конец (сек)</label>
					<input
						type='number'
						min={0}
						max={upload.duration}
						step={0.1}
						value={endTime}
						onChange={e => setEndTime(parseFloat(e.target.value) || 0)}
						className='w-full border rounded px-3 py-2'
					/>
				</div>
			</div>

			<div className='grid grid-cols-2 gap-4'>
				<div>
					<label className='block text-sm font-medium mb-1'>Разрешение</label>
					<select
						value={resolution}
						onChange={e => setResolution(e.target.value as '720p' | '1080p')}
						className='w-full border rounded px-3 py-2'
					>
						<option value='1080p'>1080×1920 (Full HD)</option>
						<option value='720p'>720×1280 (HD)</option>
					</select>
				</div>
				<div>
					<label className='block text-sm font-medium mb-1'>Качество</label>
					<select
						value={quality}
						onChange={e =>
							setQuality(e.target.value as 'low' | 'medium' | 'high')
						}
						className='w-full border rounded px-3 py-2'
					>
						<option value='high'>Высокое</option>
						<option value='medium'>Среднее</option>
						<option value='low'>Низкое</option>
					</select>
				</div>
			</div>

			<button
				onClick={() => onSubmit({ startTime, endTime, resolution, quality })}
				className='w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition'
			>
				Обработать видео
			</button>
		</div>
	);
}
