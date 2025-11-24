import sqlite3 from 'sqlite3';

const DB_PATH = 'C:\\sqlite\\salao.db';
const db = new sqlite3.Database(DB_PATH);

console.log('🔍 VERIFICAÇÃO RÁPIDA DOS DADOS\n');

// Verificar tabelas essenciais
const queries = [
  { name: 'Clientes', sql: 'SELECT COUNT(*) as count FROM clientes' },
  { name: 'Profissionais', sql: 'SELECT COUNT(*) as count FROM profissionais' },
  { name: 'Serviços', sql: 'SELECT COUNT(*) as count FROM servicos' },
  { name: 'Agendamentos', sql: 'SELECT COUNT(*) as count FROM agendamentos' }
];

let completed = 0;

queries.forEach(query => {
  db.get(query.sql, (err, row) => {
    if (err) {
      console.log(`❌ ${query.name}: Erro`);
    } else {
      console.log(`✅ ${query.name}: ${row.count} registros`);
    }
    
    completed++;
    if (completed === queries.length) {
      console.log('\n🚀 Pronto para usar! Execute: npm start');
      db.close();
    }
  });
});