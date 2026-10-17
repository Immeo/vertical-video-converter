// src/lib/status-store.ts
export interface ProcessState {
	status: 'pending' | 'processing' | 'done' | 'error';
	progress: number;
	error?: string;
}

// Используем globalThis, чтобы Next.js не сбрасывал Map при горячей перезагрузке (HMR)
const globalForStatus = globalThis as unknown as {
	processStatuses: Map<string, ProcessState> | undefined;
};

export const processStatuses =
	globalForStatus.processStatuses ?? new Map<string, ProcessState>();

if (process.env.NODE_ENV !== 'production') {
	globalForStatus.processStatuses = processStatuses;
}
