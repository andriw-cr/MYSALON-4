import { existsSync, statSync } from 'fs';
import { join } from 'path';

// Caminho absoluto para o banco de dados
export const DB_PATH = 'C:\\sqlite\\salao.db';
export const DB_NAME = 'salao.db';

// Verificar se o banco existe
export function databaseExists() {
  return existsSync(DB_PATH);
}

export function getDatabaseInfo() {
  const exists = databaseExists();
  const stats = exists ? statSync(DB_PATH) : null;
  
  return {
    path: DB_PATH,
    exists: exists,
    size: exists ? `${(stats.size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
    modified: exists ? stats.mtime : 'N/A'
  };
}