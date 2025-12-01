// database/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho correto para o banco de dados na raiz do projeto
const dbPath = path.join(__dirname, '..', 'salao.db');

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
module.exports = db;