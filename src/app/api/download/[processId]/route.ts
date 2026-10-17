import { fileExists, getOutputPath } from '@/lib/storage';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
	_req: NextRequest,
	{ params }: { params: { processId: string } }
) {
	const { processId } = params;
	const outputPath = getOutputPath(processId);

	if (!fileExists(outputPath)) {
		return NextResponse.json(
			{ error: 'Файл не найден. Возможно, он был удалён.' },
			{ status: 404 }
		);
	}

	const stat = fs.statSync(outputPath);
	const stream = fs.createReadStream(outputPath);

	return new NextResponse(stream as unknown as ReadableStream, {
		headers: {
			'Content-Type': 'video/mp4',
			'Content-Disposition': `attachment; filename="vertical_${processId}.mp4"`,
			'Content-Length': stat.size.toString()
		}
	});
}
