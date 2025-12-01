// database/db.js - VERSÃO FINAL COMMONJS
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho correto para o banco de dados (baseado na sua descoberta)
const dbPath = path.join(__dirname, '..', 'salao.db');

console.log(`🔍 Buscando banco de dados em: ${dbPath}`);

// Criar conexão com o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar com o banco de dados:', err.message);
        console.error('📁 Caminho tentado:', dbPath);
        console.log('\n🔧 Solução: Certifique-se de que o arquivo salao.db está na raiz do projeto');
    } else {
        console.log('✅ Conectado ao banco de dados SQLite:', dbPath);
        
        // Listar tabelas para confirmar estrutura
        db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
            if (err) {
                console.error('⚠️ Erro ao listar tabelas:', err.message);
            } else {
                console.log(`📊 ${tables.length} tabela(s) encontrada(s):`);
                tables.forEach((table, index) => {
                    console.log(`  ${index + 1}. ${table.name}`);
                });
                
                // Se não tiver tabelas, sugerir inicialização
                if (tables.length === 0) {
                    console.log('\n💡 O banco está vazio. Execute:');
                    console.log('   node backend/initDatabase.js');
                }
            }
        });
    }
});

// Configurações do banco
db.configure('busyTimeout', 3000);

// Função auxiliar para executar queries
db.runQuery = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
};

// Função auxiliar para buscar múltiplas linhas
db.fetchAll = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Função auxiliar para buscar uma linha
db.fetchOne = function(sql, params = []) {
    return new Promise((resolve, reject) => {
        this.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Exportar a conexão para uso em outras partes do projeto
module.exports = db;