const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Importar a conexão diretamente

console.log('✅ Rotas de profissionais carregadas');

// Validação de dados do profissional
const validateProfessional = (data, isUpdate = false) => {
    const errors = [];
    
    if (!isUpdate || data.nome !== undefined) {
        if (!data.nome || data.nome.trim().length < 3) {
            errors.push('Nome deve ter pelo menos 3 caracteres');
        }
    }
    
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
        errors.push('Email inválido');
    }
    
    if (data.comissao !== undefined) {
        const comissao = parseFloat(data.comissao);
        if (isNaN(comissao) || comissao < 0 || comissao > 100) {
            errors.push('Comissão deve ser entre 0 e 100%');
        }
    }
    
    return errors;
};

// LISTAR TODOS OS PROFISSIONAIS
router.get('/', (req, res) => {
    const { status, especialidade } = req.query;
    
    let sql = 'SELECT id, nome, especialidade, telefone, email, status, cpf, funcao, comissao FROM profissionais WHERE 1=1';
    const params = [];
    
    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }
    
    if (especialidade) {
        sql += ' AND especialidade LIKE ?';
        params.push(`%${especialidade}%`);
    }
    
    sql += ' ORDER BY nome ASC';
    
    console.log(`📊 Buscando profissionais: ${sql}`);
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('❌ Erro ao buscar profissionais:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log(`✅ ${rows.length} profissionais encontrados`);
        res.json(rows);
    });
});

// BUSCAR PROFISSIONAL POR ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    console.log(`🔍 Buscando profissional ID: ${id}`);
    
    db.get('SELECT * FROM profissionais WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('❌ Erro ao buscar profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            console.log(`⚠️ Profissional ${id} não encontrado`);
            return res.status(404).json({ error: 'Profissional não encontrado' });
        }
        console.log(`✅ Profissional encontrado: ${row.nome}`);
        res.json(row);
    });
});

// CRIAR NOVO PROFISSIONAL
router.post('/', (req, res) => {
    const profissional = req.body;
    
    console.log('📝 Criando novo profissional:', profissional.nome);
    
    // Validação
    const errors = validateProfessional(profissional);
    if (errors.length > 0) {
        console.log('❌ Erros de validação:', errors);
        return res.status(400).json({ errors });
    }
    
    // Definir valores padrão
    profissional.status = profissional.status || 'ativo';
    const dataAtual = new Date().toISOString();
    
    const sql = `
        INSERT INTO profissionais (
            nome, cpf, rg, data_nascimento, genero, estado_civil,
            telefone, email, endereco, cidade, estado, cep,
            funcao, especialidade, data_admissao, tipo_contrato,
            salario, comissao, banco, agencia, conta, tipo_conta,
            status, observacoes, data_cadastro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        profissional.nome, 
        profissional.cpf || null,
        profissional.rg || null,
        profissional.data_nascimento || null,
        profissional.genero || null,
        profissional.estado_civil || null,
        profissional.telefone || null,
        profissional.email || null,
        profissional.endereco || null,
        profissional.cidade || null,
        profissional.estado || null,
        profissional.cep || null,
        profissional.funcao || null,
        profissional.especialidade || null,
        profissional.data_admissao || null,
        profissional.tipo_contrato || null,
        profissional.salario || null,
        profissional.comissao || null,
        profissional.banco || null,
        profissional.agencia || null,
        profissional.conta || null,
        profissional.tipo_conta || null,
        profissional.status,
        profissional.observacoes || null,
        dataAtual
    ];
    
    console.log('📋 Executando SQL:', sql.substring(0, 100) + '...');
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('❌ Erro ao criar profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        
        console.log(`✅ Profissional criado com ID: ${this.lastID}`);
        
        // Retornar o profissional criado
        db.get('SELECT * FROM profissionais WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json(row);
        });
    });
});

// ATUALIZAR PROFISSIONAL
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const profissional = req.body;
    
    console.log(`✏️ Atualizando profissional ID: ${id}`);
    
    // Validação
    const errors = validateProfessional(profissional, true);
    if (errors.length > 0) {
        console.log('❌ Erros de validação:', errors);
        return res.status(400).json({ errors });
    }
    
    // Verificar se o profissional existe
    db.get('SELECT id FROM profissionais WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('❌ Erro ao verificar profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            console.log(`⚠️ Profissional ${id} não encontrado`);
            return res.status(404).json({ error: 'Profissional não encontrado' });
        }
        
        // Atualizar campos
        const dataAtual = new Date().toISOString();
        
        const fields = [];
        const values = [];
        
        // Mapear campos para atualizar
        const fieldMap = {
            nome: 'nome',
            cpf: 'cpf',
            rg: 'rg',
            data_nascimento: 'data_nascimento',
            genero: 'genero',
            estado_civil: 'estado_civil',
            telefone: 'telefone',
            email: 'email',
            endereco: 'endereco',
            cidade: 'cidade',
            estado: 'estado',
            cep: 'cep',
            funcao: 'funcao',
            especialidade: 'especialidade',
            data_admissao: 'data_admissao',
            tipo_contrato: 'tipo_contrato',
            salario: 'salario',
            comissao: 'comissao',
            banco: 'banco',
            agencia: 'agencia',
            conta: 'conta',
            tipo_conta: 'tipo_conta',
            status: 'status',
            observacoes: 'observacoes'
        };
        
        Object.keys(fieldMap).forEach(key => {
            if (profissional[key] !== undefined) {
                fields.push(`${fieldMap[key]} = ?`);
                values.push(profissional[key]);
            }
        });
        
        // Adicionar data de atualização
        fields.push('data_ultima_atualizacao = ?');
        values.push(dataAtual);
        
        if (fields.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }
        
        values.push(id);
        
        const sql = `UPDATE profissionais SET ${fields.join(', ')} WHERE id = ?`;
        
        console.log('📋 Executando SQL:', sql.substring(0, 100) + '...');
        
        db.run(sql, values, function(err) {
            if (err) {
                console.error('❌ Erro ao atualizar profissional:', err);
                return res.status(500).json({ error: err.message });
            }
            
            console.log(`✅ Profissional ${id} atualizado (${this.changes} alterações)`);
            
            // Retornar o profissional atualizado
            db.get('SELECT * FROM profissionais WHERE id = ?', [id], (err, row) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json(row);
            });
        });
    });
});

// INATIVAR PROFISSIONAL (soft delete)
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    console.log(`🚫 Inativando profissional ID: ${id}`);
    
    const sql = 'UPDATE profissionais SET status = "inativo", data_ultima_atualizacao = ? WHERE id = ?';
    const dataAtual = new Date().toISOString();
    
    db.run(sql, [dataAtual, id], function(err) {
        if (err) {
            console.error('❌ Erro ao inativar profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            console.log(`⚠️ Profissional ${id} não encontrado`);
            return res.status(404).json({ error: 'Profissional não encontrado' });
        }
        
        console.log(`✅ Profissional ${id} inativado com sucesso`);
        
        res.json({ 
            message: 'Profissional inativado com sucesso',
            id: id,
            status: 'inativo'
        });
    });
});

// REATIVAR PROFISSIONAL
router.patch('/:id/reativar', (req, res) => {
    const { id } = req.params;
    
    console.log(`🔄 Reativando profissional ID: ${id}`);
    
    const sql = 'UPDATE profissionais SET status = "ativo", data_ultima_atualizacao = ? WHERE id = ?';
    const dataAtual = new Date().toISOString();
    
    db.run(sql, [dataAtual, id], function(err) {
        if (err) {
            console.error('❌ Erro ao reativar profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            console.log(`⚠️ Profissional ${id} não encontrado`);
            return res.status(404).json({ error: 'Profissional não encontrado' });
        }
        
        console.log(`✅ Profissional ${id} reativado com sucesso`);
        
        res.json({ 
            message: 'Profissional reativado com sucesso',
            id: id,
            status: 'ativo'
        });
    });
});

// LISTAR APENAS PROFISSIONAIS ATIVOS
router.get('/ativos', (req, res) => {
    console.log('👥 Listando profissionais ativos');
    
    db.all('SELECT id, nome, especialidade, telefone, email, funcao, comissao FROM profissionais WHERE status = "ativo" ORDER BY nome ASC', (err, rows) => {
        if (err) {
            console.error('❌ Erro ao buscar profissionais ativos:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log(`✅ ${rows.length} profissionais ativos encontrados`);
        res.json(rows);
    });
});

// BUSCAR AGENDAMENTOS DO PROFISSIONAL
router.get('/:id/agendamentos', (req, res) => {
    const { id } = req.params;
    
    console.log(`📅 Buscando agendamentos do profissional ID: ${id}`);
    
    const sql = `
        SELECT a.*, c.nome_completo as cliente_nome
        FROM agendamentos a
        LEFT JOIN clientes c ON a.cliente_id = c.id
        WHERE a.profissional_id = ?
        ORDER BY a.data_agendamento DESC
        LIMIT 50
    `;
    
    db.all(sql, [id], (err, rows) => {
        if (err) {
            console.error('❌ Erro ao buscar agendamentos:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log(`✅ ${rows.length} agendamentos encontrados`);
        res.json(rows);
    });
});

// BUSCAR SERVIÇOS DO PROFISSIONAL
router.get('/:id/servicos', (req, res) => {
    const { id } = req.params;
    
    console.log(`✂️ Buscando serviços do profissional ID: ${id}`);
    
    const sql = `
        SELECT s.* 
        FROM servicos s
        INNER JOIN servicos_profissionais sp ON s.id = sp.servico_id
        WHERE sp.profissional_id = ?
        AND s.status = 'ativo'
    `;
    
    db.all(sql, [id], (err, rows) => {
        if (err) {
            console.error('❌ Erro ao buscar serviços do profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log(`✅ ${rows.length} serviços encontrados`);
        res.json(rows);
    });
});

// BUSCAR HORÁRIOS DE TRABALHO DO PROFISSIONAL
router.get('/:id/horarios-trabalho', (req, res) => {
    const { id } = req.params;
    
    console.log(`🕐 Buscando horários do profissional ID: ${id}`);
    
    // Buscar da tabela horarios_trabalho se existir
    const sql = `
        SELECT dia_semana, hora_inicio, hora_fim, disponivel
        FROM horarios_trabalho
        WHERE profissional_id = ?
        ORDER BY 
            CASE dia_semana
                WHEN 'segunda' THEN 1
                WHEN 'terca' THEN 2
                WHEN 'quarta' THEN 3
                WHEN 'quinta' THEN 4
                WHEN 'sexta' THEN 5
                WHEN 'sabado' THEN 6
                WHEN 'domingo' THEN 7
            END
    `;
    
    db.all(sql, [id], (err, rows) => {
        if (err) {
            // Se a tabela não existir, retornar horários padrão
            console.log('⚠️ Tabela horarios_trabalho não encontrada, retornando padrão');
            
            const horariosPadrao = {
                segunda: { inicio: '08:00', fim: '18:00', disponivel: true },
                terca: { inicio: '08:00', fim: '18:00', disponivel: true },
                quarta: { inicio: '08:00', fim: '18:00', disponivel: true },
                quinta: { inicio: '08:00', fim: '18:00', disponivel: true },
                sexta: { inicio: '08:00', fim: '18:00', disponivel: true },
                sabado: { inicio: '08:00', fim: '13:00', disponivel: true },
                domingo: { inicio: null, fim: null, disponivel: false }
            };
            
            return res.json(horariosPadrao);
        }
        
        if (rows.length > 0) {
            const horarios = {};
            rows.forEach(row => {
                horarios[row.dia_semana] = {
                    inicio: row.hora_inicio,
                    fim: row.hora_fim,
                    disponivel: row.disponivel === 1
                };
            });
            console.log(`✅ ${rows.length} horários encontrados`);
            res.json(horarios);
        } else {
            // Retornar horários padrão se não houver registros
            const horariosPadrao = {
                segunda: { inicio: '08:00', fim: '18:00', disponivel: true },
                terca: { inicio: '08:00', fim: '18:00', disponivel: true },
                quarta: { inicio: '08:00', fim: '18:00', disponivel: true },
                quinta: { inicio: '08:00', fim: '18:00', disponivel: true },
                sexta: { inicio: '08:00', fim: '18:00', disponivel: true },
                sabado: { inicio: '08:00', fim: '13:00', disponivel: true },
                domingo: { inicio: null, fim: null, disponivel: false }
            };
            console.log('⚠️ Nenhum horário encontrado, retornando padrão');
            res.json(horariosPadrao);
        }
    });
});

// BUSCAR ESTATÍSTICAS DO PROFISSIONAL
router.get('/:id/estatisticas', (req, res) => {
    const { id } = req.params;
    
    console.log(`📊 Buscando estatísticas do profissional ID: ${id}`);
    
    const sql = `
        SELECT 
            COUNT(*) as total_agendamentos,
            SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
            SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
            AVG(valor_final) as valor_medio,
            SUM(CASE WHEN status = 'concluido' THEN valor_final ELSE 0 END) as faturamento_total
        FROM agendamentos 
        WHERE profissional_id = ?
        AND strftime('%Y-%m', data_agendamento) = strftime('%Y-%m', 'now')
    `;
    
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error('❌ Erro ao buscar estatísticas:', err);
            return res.status(500).json({ error: err.message });
        }
        
        const estatisticas = row || {
            total_agendamentos: 0,
            concluidos: 0,
            cancelados: 0,
            valor_medio: 0,
            faturamento_total: 0
        };
        
        console.log(`✅ Estatísticas encontradas: ${estatisticas.total_agendamentos} agendamentos`);
        res.json(estatisticas);
    });
});

// ENDPOINT DE TESTE
router.get('/test/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API Profissionais funcionando',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET    /api/profissionais',
            'GET    /api/profissionais/:id',
            'POST   /api/profissionais',
            'PUT    /api/profissionais/:id',
            'DELETE /api/profissionais/:id',
            'PATCH  /api/profissionais/:id/reativar',
            'GET    /api/profissionais/ativos',
            'GET    /api/profissionais/:id/agendamentos',
            'GET    /api/profissionais/:id/servicos',
            'GET    /api/profissionais/:id/horarios-trabalho',
            'GET    /api/profissionais/:id/estatisticas'
        ]
    });
});

module.exports = router;