import sqlite3 from 'sqlite3';

const DB_PATH = 'C:\\sqlite\\salao.db';
const db = new sqlite3.Database(DB_PATH);

console.log('🔍 VERIFICANDO DADOS DA API\n');

// Verificar dados que serão usados pela API
const queries = [
  { name: '👥 Clientes', sql: 'SELECT id, nome_completo, telefone FROM clientes LIMIT 5' },
  { name: '💼 Profissionais', sql: 'SELECT id, nome_completo, especialidade FROM profissionais LIMIT 5' },
  { name: '✂️ Serviços', sql: 'SELECT id, nome, preco_base FROM servicos LIMIT 5' },
  { name: '📅 Agendamentos', sql: 'SELECT id, data_agendamento, status FROM agendamentos LIMIT 5' }
];

let completed = 0;

queries.forEach(query => {
  db.all(query.sql, (err, rows) => {
    console.log(`\n${query.name}:`);
    if (err) {
      console.log('   ❌ Erro:', err.message);
    } else if (rows.length === 0) {
      console.log('   ℹ️  Nenhum registro');
    } else {
      rows.forEach(row => {
        if (query.name.includes('Clientes')) {
          console.log(`   📞 ${row.nome_completo} - ${row.telefone}`);
        } else if (query.name.includes('Profissionais')) {
          console.log(`   💇 ${row.nome_completo} - ${row.especialidade}`);
        } else if (query.name.includes('Serviços')) {
          console.log(`   💰 ${row.nome} - R$ ${row.preco_base}`);
        } else if (query.name.includes('Agendamentos')) {
          console.log(`   🗓️  ${row.data_agendamento} - ${row.status}`);
        }
      });
    }
    
    completed++;
    if (completed === queries.length) {
      console.log('\n✅ DADOS PRONTOS PARA USO!');
      console.log('🚀 Acesse: http://localhost:3000');
      db.close();
    }
  });
});