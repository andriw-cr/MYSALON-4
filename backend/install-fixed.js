import sqlite3 from 'sqlite3';
import { existsSync } from 'fs';
import { DB_PATH, getDatabaseInfo } from './database-config.js';

console.log('=== INSTALADOR DO BEAUTYSYS - CORRIGIDO ===\n');

const dbInfo = getDatabaseInfo();
console.log('📊 Banco de dados:');
console.log('📍 Local:', dbInfo.path);
console.log('✅ Existe:', dbInfo.exists);
console.log('📏 Tamanho:', dbInfo.size);

if (!dbInfo.exists) {
  console.log('\n❌ Banco de dados não encontrado!');
  process.exit(1);
}

// Configurar para tentar várias vezes em caso de lock
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  }
  console.log('\n✅ Conectado ao banco de dados');
});

// Configurar timeout para evitar locks
db.configure("busyTimeout", 5000);

async function setupDatabase() {
  try {
    console.log('\n🔍 Verificando tabelas existentes...');
    
    // Listar tabelas atuais
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`\n📊 Tabelas encontradas (${tables.length}):`);
    tables.forEach(table => console.log('   📁', table.name));

    // Verificar apenas as tabelas essenciais
    const tabelasEssenciais = ['clientes', 'profissionais', 'servicos', 'agendamentos'];
    const tabelasFaltantes = tabelasEssenciais.filter(t => 
      !tables.some(existing => existing.name === t)
    );

    if (tabelasFaltantes.length === 0) {
      console.log('\n✅ Todas as tabelas essenciais já existem!');
      console.log('📥 Verificando dados iniciais...');
      await verificarDadosIniciais();
    } else {
      console.log(`\n❌ Tabelas faltantes: ${tabelasFaltantes.join(', ')}`);
      console.log('💡 Execute o script populate-db.js para adicionar dados.');
    }

    console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA!');
    console.log('🚀 Execute: npm start');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    db.close();
  }
}

async function verificarDadosIniciais() {
  return new Promise((resolve) => {
    // Verificar se existem clientes
    db.get('SELECT COUNT(*) as count FROM clientes', (err, row) => {
      if (err) {
        console.log('   ❌ Erro ao verificar clientes:', err.message);
      } else if (row.count === 0) {
        console.log('   ℹ️  Nenhum cliente encontrado. Execute populate-db.js');
      } else {
        console.log(`   ✅ ${row.count} clientes encontrados`);
      }

      // Verificar serviços
      db.get('SELECT COUNT(*) as count FROM servicos', (err, row) => {
        if (!err) {
          if (row.count === 0) {
            console.log('   ℹ️  Nenhum serviço encontrado. Execute populate-db.js');
          } else {
            console.log(`   ✅ ${row.count} serviços encontrados`);
          }
        }
        resolve();
      });
    });
  });
}

// Executar
setupDatabase();