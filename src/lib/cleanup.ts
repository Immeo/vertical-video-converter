import { getUploadDir, getOutputDir, deleteFile } from './storage';
import fs from 'fs';
import path from 'path';

const FILE_TTL = parseInt(process.env.FILE_TTL || '600000', 10);

export function scheduleCleanup(): void {
  setInterval(() => {
    const now = Date.now();
    [getUploadDir(), getOutputDir()].forEach((dir) => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        try {
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > FILE_TTL) {
            deleteFile(filePath);
            console.log(`Удалён просроченный файл: ${filePath}`);
          }
        } catch (err) {
          console.error(`Ошибка при очистке ${filePath}:`, err);
        }
      });
    });
  }, 60_000); // проверка каждую минуту
}