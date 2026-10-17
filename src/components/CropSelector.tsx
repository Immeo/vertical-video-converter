'use client';

import type { CropMode, CropOptions } from '@/types';

const modes: { value: CropMode; label: string; description: string }[] = [
	{
		value: 'center',
		label: 'Обрезка по центру',
		description: 'Вырезает центральную часть кадра в формате 9:16.'
	},
	{
		value: 'blur',
		label: 'Размытие фона',
		description: 'Исходное видео вписывается поверх размытой копии.'
	},
	{
		value: 'manual',
		label: 'Ручной выбор области',
		description: 'Укажите координаты и размеры области в процентах.'
	}
];

export default function CropSelector({
	value,
	onChange
}: {
	value: CropOptions;
	onChange: (value: CropOptions) => void;
}) {
	return (
		<div className='bg-white rounded-lg shadow p-6 space-y-4'>
			<h2 className='text-lg font-semibold'>Способ кадрирования</h2>

			<div className='space-y-2'>
				{modes.map(mode => (
					<label
						key={mode.value}
						className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
							value.mode === mode.value
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:border-gray-300'
						}`}
					>
						<input
							type='radio'
							name='cropMode'
							value={mode.value}
							checked={value.mode === mode.value}
							onChange={() => onChange({ mode: mode.value })}
							className='mt-1'
						/>
						<div>
							<div className='font-medium'>{mode.label}</div>
							<div className='text-sm text-gray-500'>{mode.description}</div>
						</div>
					</label>
				))}
			</div>

			{value.mode === 'manual' && (
				<div className='grid grid-cols-2 gap-4 pt-2'>
					<div>
						<label className='block text-sm font-medium mb-1'>X (%)</label>
						<input
							type='number'
							min={0}
							max={100}
							value={value.manualX ?? 0}
							onChange={e =>
								onChange({ ...value, manualX: parseFloat(e.target.value) || 0 })
							}
							className='w-full border rounded px-3 py-2'
						/>
					</div>
					<div>
						<label className='block text-sm font-medium mb-1'>Y (%)</label>
						<input
							type='number'
							min={0}
							max={100}
							value={value.manualY ?? 0}
							onChange={e =>
								onChange({ ...value, manualY: parseFloat(e.target.value) || 0 })
							}
							className='w-full border rounded px-3 py-2'
						/>
					</div>
					<div>
						<label className='block text-sm font-medium mb-1'>Ширина (%)</label>
						<input
							type='number'
							min={1}
							max={100}
							value={value.manualWidth ?? 100}
							onChange={e =>
								onChange({
									...value,
									manualWidth: parseFloat(e.target.value) || 100
								})
							}
							className='w-full border rounded px-3 py-2'
						/>
					</div>
					<div>
						<label className='block text-sm font-medium mb-1'>Высота (%)</label>
						<input
							type='number'
							min={1}
							max={100}
							value={value.manualHeight ?? 100}
							onChange={e =>
								onChange({
									...value,
									manualHeight: parseFloat(e.target.value) || 100
								})
							}
							className='w-full border rounded px-3 py-2'
						/>
					</div>
				</div>
			)}
		</div>
	);
}
