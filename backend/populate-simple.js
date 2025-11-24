import sqlite3 from 'sqlite3';

const DB_PATH = 'C:\\sqlite\\salao.db';

console.log('📥 POPULANDO BANCO DE DADOS (SIMPLIFICADO)\n');

// Conectar com configurações para evitar lock
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco');
});

db.configure("busyTimeout", 10000);

// Função para executar SQL com retry
function runSQL(sql, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function attempt() {
      db.run(sql, function(err) {
        if (err) {
          if (err.code === 'SQLITE_BUSY' && attempts < maxRetries) {
            attempts++;
            console.log(`   ⏳ Tentativa ${attempts}/${maxRetries}...`);
            setTimeout(attempt, 500);
          } else {
            if (err.message.includes('UNIQUE constraint')) {
              console.log('   ⚠️  Dado já existe');
              resolve();
            } else {
              console.log('   ❌ Erro:', err.message);
              reject(err);
            }
          }
        } else {
          if (this.changes > 0) {
            console.log('   ✅ Inserido');
          } else {
            console.log('   ⚠️  Nenhuma linha afetada');
          }
          resolve();
        }
      });
    }
    
    attempt();
  });
}

async function popularDados() {
  try {
    console.log('1. Verificando e inserindo serviços...');
    
    // Serviços
    const servicosSQL = `
      INSERT INTO servicos (nome, categoria, descricao, preco_base, duracao_minutos) 
      SELECT 'Corte Feminino', 'cabelo', 'Corte e finalização', 60.00, 45
      WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Corte Feminino')
    `;
    await runSQL(servicosSQL);

    await runSQL(`
      INSERT INTO servicos (nome, categoria, descricao, preco_base, duracao_minutos) 
      SELECT 'Corte Masculino', 'cabelo', 'Corte masculino', 40.00, 30
      WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Corte Masculino')
    `);

    await runSQL(`
      INSERT INTO servicos (nome, categoria, descricao, preco_base, duracao_minutos) 
      SELECT 'Manicure', 'unhas', 'Manicure simples', 35.00, 40
      WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Manicure')
    `);

    console.log('2. Verificando e inserindo profissionais...');
    
    // Profissionais
    await runSQL(`
      INSERT INTO profissionais (nome_completo, telefone, email, especialidade, comissao_padrao) 
      SELECT 'Carla Silva', '(11) 99999-9999', 'carla@beautysys.com', 'Cabelereira', 40.00
      WHERE NOT EXISTS (SELECT 1 FROM profissionais WHERE nome_completo = 'Carla Silva')
    `);

    await runSQL(`
      INSERT INTO profissionais (nome_completo, telefone, email, especialidade, comissao_padrao) 
      SELECT 'Rogério Santos', '(11) 98888-8888', 'rogerio@beautysys.com', 'Barbeiro', 35.00
      WHERE NOT EXISTS (SELECT 1 FROM profissionais WHERE nome_completo = 'Rogério Santos')
    `);

    console.log('3. Verificando e inserindo clientes...');
    
    // Clientes
    await runSQL(`
      INSERT INTO clientes (nome_completo, telefone, email) 
      SELECT 'Maria Silva', '(11) 95555-5555', 'maria@email.com'
      WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome_completo = 'Maria Silva')
    `);

    await runSQL(`
      INSERT INTO clientes (nome_completo, telefone, email) 
      SELECT 'João Santos', '(11) 94444-4444', 'joao@email.com'
      WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE nome_completo = 'João Santos')
    `);

    console.log('4. Verificando dados existentes...');
    
    // Contar dados existentes
    const counts = await new Promise((resolve) => {
      const results = {};
      let completed = 0;
      
      const tables = ['clientes', 'profissionais', 'servicos', 'agendamentos'];
      
      tables.forEach(table => {
        db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
          if (!err) {
            results[table] = row.count;
          }
          completed++;
          if (completed === tables.length) {
            resolve(results);
          }
        });
      });
    });

    console.log('\n📊 RESUMO DOS DADOS:');
    console.log(`   👥 Clientes: ${counts.clientes}`);
    console.log(`   💼 Profissionais: ${counts.profissionais}`);
    console.log(`   ✂️  Serviços: ${counts.servicos}`);
    console.log(`   📅 Agendamentos: ${counts.agendamentos}`);

    if (counts.clientes === 0 || counts.servicos === 0 || counts.profissionais === 0) {
      console.log('\n⚠️  Algumas tabelas estão vazias. Execute novamente se necessário.');
    } else {
      console.log('\n✅ Dados básicos estão presentes!');
    }

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
  } finally {
    db.close(() => {
      console.log('\n🔒 Conexão fechada.');
    });
  }
}

// Executar
popularDados();