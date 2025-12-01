// database/db.js
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho correto para o banco de dados na raiz do projeto
const dbPath = path.join(__dirname, '..', 'salao.bd');

// Criar conexão com o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar com o banco de dados:', err.message);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite:', dbPath);
    }
});

// Configurações do banco
db.configure('busyTimeout', 3000);

// Exportar a conexão para uso em outras partes do projeto
export default db;