// database/initDatabase.js - VERSÃO COMPATÍVEL
import db from './db.js';

function initDatabase() {
    console.log('🔄 Verificando e criando tabelas necessárias...');

    // Tabela de usuários (se não existir)
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            tipo TEXT DEFAULT 'funcionario',
            avatar_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Tabela de clientes (se não existir)
    const createClientsTable = `
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_completo TEXT NOT NULL,
            data_nascimento DATE,
            telefone TEXT,
            email TEXT,
            genero TEXT,
            endereco TEXT,
            observacoes TEXT,
            status TEXT DEFAULT 'ativo',
            pontos_fidelidade INTEGER DEFAULT 0,
            nivel_fidelidade TEXT DEFAULT 'Bronze',
            cashback_disponivel DECIMAL(10,2) DEFAULT 0,
            data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_ultima_visita DATETIME,
            total_visitas INTEGER DEFAULT 0,
            total_gasto DECIMAL(10,2) DEFAULT 0
        )
    `;

    // Tabela de profissionais (se não existir)
    const createProfessionalsTable = `
        CREATE TABLE IF NOT EXISTS profissionais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_completo TEXT NOT NULL,
            telefone TEXT,
            email TEXT,
            especialidade TEXT,
            foto TEXT,
            status TEXT DEFAULT 'ativo',
            comissao_padrao DECIMAL(5,2),
            data_admissao DATE,
            observacoes TEXT,
            cpf TEXT,
            data_nascimento DATE,
            genero TEXT,
            estado_civil TEXT,
            endereco TEXT,
            numero TEXT,
            complemento TEXT,
            bairro TEXT,
            cidade TEXT,
            estado TEXT,
            cep TEXT,
            salario_base DECIMAL(10,2) DEFAULT 0,
            tipo_contrato TEXT,
            banco_nome TEXT,
            banco_agencia TEXT,
            banco_conta TEXT,
            banco_tipo TEXT,
            pix_chave TEXT,
            pix_tipo TEXT,
            horario_segunda TEXT,
            horario_terca TEXT,
            horario_quarta TEXT,
            horario_quinta TEXT,
            horario_sexta TEXT,
            horario_sabado TEXT,
            horario_domingo TEXT,
            data_demissao DATE,
            motivo_demissao TEXT
        )
    `;

    // Tabela de serviços (se não existir)
    const createServicesTable = `
        CREATE TABLE IF NOT EXISTS servicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            categoria TEXT,
            descricao TEXT,
            preco_base DECIMAL(10,2) NOT NULL,
            duracao_minutos INTEGER NOT NULL,
            status TEXT DEFAULT 'ativo',
            permite_agendamento_online BOOLEAN DEFAULT 1,
            permite_desconto BOOLEAN DEFAULT 1,
            permite_pontos_fidelidade BOOLEAN DEFAULT 1,
            descricao_preco TEXT,
            max_clientes_por_horario INTEGER DEFAULT 1,
            intervalo_entre_atendimentos INTEGER DEFAULT 0
        )
    `;

    // Tabela de agendamentos (se não existir)
    const createAppointmentsTable = `
        CREATE TABLE IF NOT EXISTS agendamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente_id INTEGER NOT NULL,
            servico_id INTEGER NOT NULL,
            profissional_id INTEGER NOT NULL,
            data_agendamento DATETIME NOT NULL,
            duracao_estimada INTEGER NOT NULL,
            status TEXT DEFAULT 'agendado',
            valor_servico DECIMAL(10,2) NOT NULL,
            desconto_aplicado DECIMAL(10,2) DEFAULT 0,
            valor_final DECIMAL(10,2) NOT NULL,
            pontos_utilizados INTEGER DEFAULT 0,
            observacoes TEXT,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            recorrente BOOLEAN DEFAULT 0,
            agendamento_pai_id INTEGER,
            notificado_whatsapp BOOLEAN DEFAULT 0,
            data_notificacao DATETIME,
            gorjeta DECIMAL(10,2) DEFAULT 0,
            metodo_pagamento TEXT,
            pago BOOLEAN DEFAULT 0,
            entrada_paga DECIMAL(10,2) DEFAULT 0,
            permite_desconto BOOLEAN DEFAULT 1,
            permite_pontos_fidelidade BOOLEAN DEFAULT 1,
            FOREIGN KEY (cliente_id) REFERENCES clientes (id),
            FOREIGN KEY (servico_id) REFERENCES servicos (id),
            FOREIGN KEY (profissional_id) REFERENCES profissionais (id)
        )
    `;

    // Tabela de relação serviços x profissionais (se não existir)
    const createServicesProfessionalsTable = `
        CREATE TABLE IF NOT EXISTS servicos_profissionais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            servico_id INTEGER NOT NULL,
            profissional_id INTEGER NOT NULL,
            comissao_personalizada DECIMAL(5,2),
            FOREIGN KEY (servico_id) REFERENCES servicos (id),
            FOREIGN KEY (profissional_id) REFERENCES profissionais (id),
            UNIQUE(servico_id, profissional_id)
        )
    `;

    // Tabela de pagamentos (se não existir)
    const createPaymentsTable = `
        CREATE TABLE IF NOT EXISTS pagamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agendamento_id INTEGER NOT NULL,
            valor_pago DECIMAL(10,2) NOT NULL,
            forma_pagamento TEXT NOT NULL,
            gorjeta DECIMAL(10,2) DEFAULT 0,
            data_pagamento DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pago',
            observacoes TEXT,
            FOREIGN KEY (agendamento_id) REFERENCES agendamentos (id)
        )
    `;

    // Executar criação de tabelas apenas se não existirem
    const tables = [
        { sql: createUsersTable, name: 'usuarios' },
        { sql: createClientsTable, name: 'clientes' },
        { sql: createProfessionalsTable, name: 'profissionais' },
        { sql: createServicesTable, name: 'servicos' },
        { sql: createAppointmentsTable, name: 'agendamentos' },
        { sql: createServicesProfessionalsTable, name: 'servicos_profissionais' },
        { sql: createPaymentsTable, name: 'pagamentos' }
    ];

    let createdCount = 0;

    tables.forEach((table) => {
        // Verificar se a tabela já existe
        const checkTableSql = `SELECT name FROM sqlite_master WHERE type='table' AND name='${table.name}'`;
        
        db.get(checkTableSql, [], (err, row) => {
            if (err) {
                console.error(`❌ Erro ao verificar tabela ${table.name}:`, err.message);
                return;
            }

            if (!row) {
                // Tabela não existe, criar
                db.run(table.sql, (err) => {
                    if (err) {
                        console.error(`❌ Erro ao criar tabela ${table.name}:`, err.message);
                    } else {
                        console.log(`✅ Tabela ${table.name} criada com sucesso`);
                        createdCount++;
                    }
                });
            } else {
                console.log(`📋 Tabela ${table.name} já existe`);
            }
        });
    });

    // Aguardar um pouco para verificar resultados
    setTimeout(() => {
        console.log(`🎉 Verificação concluída! ${createdCount} tabelas criadas/verificadas`);
        
        // Criar índices essenciais se não existirem
        createEssentialIndexes();
    }, 1000);
}

function createEssentialIndexes() {
    console.log('🔍 Verificando índices essenciais...');
    
    const indexes = [
        { sql: 'CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON servicos(categoria)', name: 'idx_servicos_categoria' },
        { sql: 'CREATE INDEX IF NOT EXISTS idx_servicos_status ON servicos(status)', name: 'idx_servicos_status' },
        { sql: 'CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome_completo)', name: 'idx_clientes_nome' },
        { sql: 'CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status)', name: 'idx_clientes_status' },
        { sql: 'CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agendamento)', name: 'idx_agendamentos_data' },
        { sql: 'CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status)', name: 'idx_agendamentos_status' },
        { sql: 'CREATE INDEX IF NOT EXISTS idx_profissionais_status ON profissionais(status)', name: 'idx_profissionais_status' }
    ];

    indexes.forEach((index) => {
        db.run(index.sql, (err) => {
            if (err) {
                console.error(`❌ Erro ao criar índice ${index.name}:`, err.message);
            } else {
                console.log(`✅ Índice ${index.name} verificado/criado`);
            }
        });
    });
}

export default initDatabase;