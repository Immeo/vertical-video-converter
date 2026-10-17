'use client';

import type { UploadResult } from '@/types';
import { useRef, useState } from 'react';

export default function UploadForm({
	onSuccess
}: {
	onSuccess: (result: UploadResult) => void;
}) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const file = inputRef.current?.files?.[0];
		if (!file) {
			setError('Выберите видеофайл.');
			return;
		}

		setUploading(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append('video', file);

			const res = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.error || 'Ошибка загрузки');
				return;
			}

			onSuccess(data);
		} catch {
			setError('Не удалось загрузить файл. Проверьте соединение.');
		} finally {
			setUploading(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className='bg-white rounded-lg shadow p-6 space-y-4'
		>
			<h2 className='text-lg font-semibold'>Загрузите горизонтальное видео</h2>
			<p className='text-sm text-gray-500'>
				Поддерживаются MP4, MOV, AVI, WebM. Максимум 200 МБ, до 3 минут.
			</p>

			{error && (
				<div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm'>
					{error}
				</div>
			)}

			<input
				ref={inputRef}
				type='file'
				accept='video/mp4,video/quicktime,video/x-msvideo,video/webm'
				className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
			/>

			<button
				type='submit'
				disabled={uploading}
				className='w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50'
			>
				{uploading ? 'Загрузка...' : 'Загрузить видео'}
			</button>
		</form>
	);
}
