import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'Вертикализатор видео',
	description:
		'Преобразование горизонтальных видео в вертикальные для Shorts, Reels и TikTok'
};

export default function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='ru'>
			<body className='min-h-screen bg-gray-50 text-gray-900'>
				<header className='bg-white shadow-sm border-b'>
					<div className='max-w-4xl mx-auto px-4 py-4'>
						<h1 className='text-xl font-bold'>Вертикализатор видео</h1>
						<p className='text-sm text-gray-500'>
							Горизонтальное → 9:16 для Shorts, Reels, TikTok
						</p>
					</div>
				</header>
				<main className='max-w-4xl mx-auto px-4 py-8'>{children}</main>
			</body>
		</html>
	);
}
