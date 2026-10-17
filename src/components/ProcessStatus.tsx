'use client';

import type { ProcessStatus as ProcessStatusType } from '@/types';
import { useEffect, useState } from 'react';

export default function ProcessStatus({
	processId,
	onReset
}: {
	processId: string;
	onReset: () => void;
}) {
	const [status, setStatus] = useState<ProcessStatusType | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let interval: NodeJS.Timeout;

		const poll = async () => {
			try {
				const res = await fetch(`/api/status/${processId}`);
				const data = await res.json();

				if (!res.ok) {
					setError(data.error || 'Ошибка получения статуса');
					return;
				}

				setStatus(data);

				if (data.status === 'done' || data.status === 'error') {
					clearInterval(interval);
				}
			} catch {
				setError('Не удалось получить статус обработки.');
			}
		};

		poll();
		interval = setInterval(poll, 2000);

		return () => clearInterval(interval);
	}, [processId]);

	if (error) {
		return (
			<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
				{error}
			</div>
		);
	}

	if (!status) {
		return (
			<div className='bg-white rounded-lg shadow p-6 text-center'>
				<p className='text-gray-500'>Загрузка статуса...</p>
			</div>
		);
	}

	return (
		<div className='bg-white rounded-lg shadow p-6 space-y-4'>
			<h2 className='text-lg font-semibold'>Обработка видео</h2>

			{status.status === 'processing' && (
				<>
					<p className='text-sm text-gray-600'>Идёт обработка...</p>
					<div className='w-full bg-gray-200 rounded-full h-3'>
						<div
							className='bg-blue-600 h-3 rounded-full transition-all'
							style={{ width: `${status.progress}%` }}
						/>
					</div>
					<p className='text-sm text-gray-500 text-right'>{status.progress}%</p>
				</>
			)}

			{status.status === 'done' && (
				<>
					<p className='text-green-600 font-medium'>Обработка завершена!</p>
					<a
						href={status.downloadUrl}
						download
						className='block w-full bg-green-600 text-white py-3 rounded-lg font-medium text-center hover:bg-green-700 transition'
					>
						Скачать вертикальное видео
					</a>
				</>
			)}

			{status.status === 'error' && (
				<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
					{status.error || 'Произошла ошибка при обработке.'}
				</div>
			)}

			<button
				onClick={onReset}
				className='w-full text-gray-500 py-2 text-sm hover:text-gray-700 transition'
			>
				Загрузить другое видео
			</button>
		</div>
	);
}
