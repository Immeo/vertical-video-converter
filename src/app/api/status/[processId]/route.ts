import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Импортируем хранилище статусов (в реальном проекте — вынести в отдельный модуль)
const processStatuses = new Map<
	string,
	{
		status: 'pending' | 'processing' | 'done' | 'error';
		progress: number;
		error?: string;
	}
>();

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
