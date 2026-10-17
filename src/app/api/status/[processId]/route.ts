// src/app/api/status/[processId]/route.ts
import { processStatuses } from '@/lib/status-store'; // <-- ИМПОРТ
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
	_req: NextRequest,
	{ params }: { params: { processId: string } }
) {
	const { processId } = params;
	const status = processStatuses.get(processId);

	if (!status) {
		return NextResponse.json({ error: 'Процесс не найден.' }, { status: 404 });
	}

	const response: Record<string, unknown> = {
		processId,
		status: status.status,
		progress: status.progress
	};

	if (status.error) {
		response.error = status.error;
	}

	if (status.status === 'done') {
		response.downloadUrl = `/api/download/${processId}`;
	}

	return NextResponse.json(response);
}
