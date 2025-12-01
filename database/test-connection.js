const db = require('./db');

// Teste básico
console.log('🔍 Testando conexão com o banco...');

// Listar tabelas para verificar estrutura
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
    if (err) {
        console.error('❌ Erro:', err.message);
    } else {
        console.log(`✅ ${tables.length} tabela(s) encontrada(s):`);
        tables.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table.name}`);
        });
        
        // Se houver tabela de clientes, mostrar alguns registros
        const hasClientes = tables.some(t => t.name === 'clientes');
        if (hasClientes) {
            db.all("SELECT id, nome_completo, telefone, status FROM clientes LIMIT 5", (err, clientes) => {
                if (err) {
                    console.error('❌ Erro ao buscar clientes:', err.message);
                } else {
                    console.log('\n👥 Primeiros clientes:');
                    clientes.forEach(cliente => {
                        console.log(`   ID: ${cliente.id}, Nome: ${cliente.nome_completo}, Tel: ${cliente.telefone}, Status: ${cliente.status}`);
                    });
                }
                db.close(() => console.log('🔒 Conexão fechada'));
            });
        } else {
            console.log('\nao Tabela "clientes" não encontrada. O banco pode estar vazio.');
            db.close(() => console.log('🔒 Conexão fechada'));
        }
    }
});