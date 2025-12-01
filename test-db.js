// test-db.js
const db = require('./database/db');

console.log('🔍 Testando conexão com o banco de dados...');

// Teste simples de conexão
db.get("SELECT 1 as test", (err, row) => {
    if (err) {
        console.error('❌ Erro na conexão:', err.message);
        console.log('\n🔧 Possíveis soluções:');
        console.log('1. Verifique se o arquivo salao.db existe na raiz');
        console.log('2. Verifique se o SQLite está instalado: npm install sqlite3');
    } else {
        console.log('✅ Conexão com banco de dados OK');
        
        // Listar tabelas
        db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
            if (err) {
                console.error('❌ Erro ao listar tabelas:', err.message);
            } else {
                console.log(`\n📊 ${tables.length} tabela(s) encontrada(s):`);
                if (tables.length === 0) {
                    console.log('   (nenhuma tabela encontrada)');
                    console.log('\n💡 O banco está vazio. Você precisa criar as tabelas.');
                    console.log('   Execute: node backend/initDatabase.js');
                } else {
                    tables.forEach((table, index) => {
                        console.log(`   ${index + 1}. ${table.name}`);
                    });
                    
                    // Verificar se a tabela clientes existe
                    const hasClientes = tables.some(t => t.name === 'clientes');
                    if (hasClientes) {
                        console.log('\n👥 Verificando tabela clientes...');
                        db.all("SELECT COUNT(*) as total FROM clientes", (err, result) => {
                            if (err) {
                                console.error('   ❌ Erro:', err.message);
                            } else {
                                console.log(`   ✅ ${result[0].total} cliente(s) cadastrado(s)`);
                            }
                            db.close(() => console.log('\n🔒 Conexão fechada'));
                        });
                    } else {
                        db.close(() => console.log('\n🔒 Conexão fechada'));
                    }
                }
            }
        });
    }
});