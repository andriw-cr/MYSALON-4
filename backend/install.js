import sqlite3 from 'sqlite3';
import { DB_PATH, databaseExists, getDatabaseInfo } from './database-config.js';

console.log('=== INSTALADOR DO BEAUTYSYS ===\n');

const dbInfo = getDatabaseInfo();
console.log('📊 Banco de dados:');
console.log('📍 Local:', dbInfo.path);
console.log('✅ Existe:', dbInfo.exists);
console.log('📏 Tamanho:', dbInfo.size);

if (!dbInfo.exists) {
  console.log('\n❌ Banco de dados não encontrado!');
  console.log('📝 Certifique-se de que o arquivo existe em: C:\\sqlite\\salao.db');
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  }
  console.log('\n✅ Conectado ao banco de dados');
});

// Função para executar SQL
function runSQL(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, function(err) {
      if (err) {
        if (err.message.includes('already exists')) {
          console.log('   ✅ Já existe');
        } else {
          console.log('   ❌ Erro:', err.message);
          reject(err);
        }
      } else {
        console.log('   ✅ Criada');
      }
      resolve();
    });
  });
}

async function setupDatabase() {
  try {
    console.log('\n🔍 Verificando tabelas existentes...');
    
    // Listar tabelas atuais
    db.all("SELECT name FROM sqlite_master WHERE type='table'", async (err, tables) => {
      if (err) {
        console.error('Erro ao listar tabelas:', err);
        return;
      }

      console.log(`\n📊 Tabelas encontradas (${tables.length}):`);
      tables.forEach(table => console.log('   📁', table.name));

      // Tabelas necessárias para o sistema
      const tabelasNecessarias = [
        'clientes', 'profissionais', 'servicos', 'agendamentos', 
        'categorias_financeiras', 'contas_bancarias', 'operadoras_cartao'
      ];

      const tabelasFaltantes = tabelasNecessarias.filter(t => 
        !tables.some(existing => existing.name === t)
      );

      if (tabelasFaltantes.length > 0) {
        console.log(`\n📝 Criando ${tabelasFaltantes.length} tabelas faltantes...`);
        
        for (const tabela of tabelasFaltantes) {
          console.log(`\n📋 Criando tabela: ${tabela}`);
          await criarTabela(tabela);
        }
      } else {
        console.log('\n✅ Todas as tabelas necessárias já existem!');
      }

      console.log('\n📥 Verificando dados iniciais...');
      await verificarDadosIniciais();

      console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!');
      console.log('🚀 Execute: npm start');
      
      db.close();
    });

  } catch (error) {
    console.error('❌ Erro na configuração:', error);
    db.close();
  }
}

async function criarTabela(nomeTabela) {
  const ddl = {
    clientes: `CREATE TABLE clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_completo TEXT NOT NULL,
      telefone TEXT,
      email TEXT,
      genero TEXT CHECK(genero IN ('F', 'M', 'O')),
      status TEXT CHECK(status IN ('ativo', 'inativo', 'fidelidade')) DEFAULT 'ativo',
      pontos_fidelidade INTEGER DEFAULT 0,
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_ultima_visita DATETIME,
      total_visitas INTEGER DEFAULT 0,
      total_gasto DECIMAL(10,2) DEFAULT 0
    )`,

    profissionais: `CREATE TABLE profissionais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_completo TEXT NOT NULL,
      telefone TEXT,
      email TEXT,
      especialidade TEXT,
      status TEXT CHECK(status IN ('ativo', 'inativo', 'ferias')) DEFAULT 'ativo',
      comissao_padrao DECIMAL(5,2) DEFAULT 40.00,
      data_admissao DATE,
      observacoes TEXT
    )`,

    servicos: `CREATE TABLE servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      categoria TEXT CHECK(categoria IN ('cabelo', 'unhas', 'estetica', 'barba', 'maquiagem', 'outros')),
      descricao TEXT,
      preco_base DECIMAL(10,2) NOT NULL,
      duracao_minutos INTEGER NOT NULL,
      status TEXT CHECK(status IN ('ativo', 'inativo')) DEFAULT 'ativo'
    )`,

    agendamentos: `CREATE TABLE agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      servico_id INTEGER,
      profissional_id INTEGER,
      data_agendamento DATETIME NOT NULL,
      status TEXT CHECK(status IN ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'nao_compareceu')) DEFAULT 'agendado',
      valor_servico DECIMAL(10,2),
      observacoes TEXT,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id),
      FOREIGN KEY (servico_id) REFERENCES servicos(id),
      FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
    )`,

    categorias_financeiras: `CREATE TABLE categorias_financeiras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('receita', 'despesa')) NOT NULL,
      descricao TEXT,
      cor_hex TEXT DEFAULT '#6B7280',
      ativa BOOLEAN DEFAULT 1
    )`,

    contas_bancarias: `CREATE TABLE contas_bancarias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_conta TEXT NOT NULL,
      tipo_conta TEXT CHECK(tipo_conta IN ('caixa', 'corrente', 'poupanca', 'carteira', 'investimento')) NOT NULL,
      banco_nome TEXT,
      saldo_inicial DECIMAL(10,2) DEFAULT 0,
      saldo_atual DECIMAL(10,2) DEFAULT 0,
      ativa BOOLEAN DEFAULT 1,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    operadoras_cartao: `CREATE TABLE operadoras_cartao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tipo TEXT CHECK(tipo IN ('maquininha', 'gateway', 'link')) NOT NULL,
      codigo_interno TEXT UNIQUE,
      status TEXT CHECK(status IN ('ativa', 'inativa')) DEFAULT 'ativa',
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  };

  if (ddl[nomeTabela]) {
    await runSQL(ddl[nomeTabela]);
  }
}

async function verificarDadosIniciais() {
  // Verificar se já existem serviços
  return new Promise((resolve) => {
    db.get('SELECT COUNT(*) as count FROM servicos', (err, row) => {
      if (err || !row || row.count === 0) {
        console.log('   💡 Inserindo dados de exemplo...');
        inserirDadosExemplo().then(resolve);
      } else {
        console.log(`   ✅ Já existem ${row.count} serviços cadastrados`);
        resolve();
      }
    });
  });
}

async function inserirDadosExemplo() {
  const inserts = [
    // Serviços
    `INSERT INTO servicos (nome, categoria, descricao, preco_base, duracao_minutos) VALUES
    ('Corte Feminino', 'cabelo', 'Corte e finalização', 60.00, 45),
    ('Corte Masculino', 'cabelo', 'Corte masculino', 40.00, 30),
    ('Coloração', 'cabelo', 'Coloração completa', 120.00, 120),
    ('Manicure', 'unhas', 'Manicure simples', 35.00, 40),
    ('Pedicure', 'unhas', 'Pedicure simples', 40.00, 45)`,

    // Profissionais
    `INSERT INTO profissionais (nome_completo, telefone, email, especialidade, comissao_padrao) VALUES
    ('Carla Silva', '(11) 99999-9999', 'carla@beautysys.com', 'Cabelereira', 40.00),
    ('Rogério Santos', '(11) 98888-8888', 'rogerio@beautysys.com', 'Barbeiro', 35.00),
    ('Amanda Costa', '(11) 97777-7777', 'amanda@beautysys.com', 'Manicure', 30.00)`,

    // Clientes
    `INSERT INTO clientes (nome_completo, telefone, email) VALUES
    ('Maria Silva', '(11) 95555-5555', 'maria@email.com'),
    ('João Santos', '(11) 94444-4444', 'joao@email.com'),
    ('Ana Costa', '(11) 93333-3333', 'ana@email.com')`,

    // Categorias financeiras
    `INSERT INTO categorias_financeiras (nome, tipo, descricao, cor_hex) VALUES
    ('Servicos Prestados', 'receita', 'Receita de serviços', '#10B981'),
    ('Salários', 'despesa', 'Pagamento de salários', '#EF4444')`,

    // Contas bancárias
    `INSERT INTO contas_bancarias (nome_conta, tipo_conta, banco_nome, saldo_inicial, saldo_atual) VALUES
    ('Caixa Principal', 'caixa', 'Dinheiro em Caixa', 1000.00, 1000.00),
    ('Conta Corrente', 'corrente', 'Banco do Brasil', 5000.00, 5000.00)`,

    // Operadoras de cartão
    `INSERT INTO operadoras_cartao (nome, tipo, codigo_interno) VALUES
    ('Stone', 'maquininha', 'STN001'),
    ('Cielo', 'gateway', 'CLO001')`
  ];

  for (const sql of inserts) {
    await runSQL(sql);
  }
  console.log('   ✅ Dados de exemplo inseridos');
}

// Iniciar configuração
setupDatabase();