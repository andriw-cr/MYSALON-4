const express = require('express');
const router = express.Router();

// Middleware para verificar conexão com banco
router.use((req, res, next) => {
    if (!req.db) {
        return res.status(500).json({ error: 'Database connection not available' });
    }
    next();
});

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
    
    req.db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar profissionais:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// BUSCAR PROFISSIONAL POR ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    req.db.get('SELECT * FROM profissionais WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Erro ao buscar profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Profissional não encontrado' });
        }
        res.json(row);
    });
});

// CRIAR NOVO PROFISSIONAL
router.post('/', (req, res) => {
    const profissional = req.body;
    
    // Validação
    const errors = validateProfessional(profissional);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    
    // Definir valores padrão
    profissional.status = profissional.status || 'ativo';
    profissional.criado_em = new Date().toISOString();
    profissional.atualizado_em = new Date().toISOString();
    
    const sql = `
        INSERT INTO profissionais (
            nome, cpf, rg, data_nascimento, genero, estado_civil,
            telefone, email, endereco, cidade, estado, cep,
            funcao, especialidade, data_admissao, tipo_contrato,
            salario, comissao, banco, agencia, conta, tipo_conta,
            status, observacoes, criado_em, atualizado_em
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        profissional.nome, profissional.cpf, profissional.rg, profissional.data_nascimento,
        profissional.genero, profissional.estado_civil, profissional.telefone, profissional.email,
        profissional.endereco, profissional.cidade, profissional.estado, profissional.cep,
        profissional.funcao, profissional.especialidade, profissional.data_admissao,
        profissional.tipo_contrato, profissional.salario, profissional.comissao,
        profissional.banco, profissional.agencia, profissional.conta, profissional.tipo_conta,
        profissional.status, profissional.observacoes, profissional.criado_em, profissional.atualizado_em
    ];
    
    req.db.run(sql, params, function(err) {
        if (err) {
            console.error('Erro ao criar profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        
        // Retornar o profissional criado
        req.db.get('SELECT * FROM profissionais WHERE id = ?', [this.lastID], (err, row) => {
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
    
    // Validação
    const errors = validateProfessional(profissional, true);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    
    // Verificar se o profissional existe
    req.db.get('SELECT id FROM profissionais WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Profissional não encontrado' });
        }
        
        // Atualizar campos
        profissional.atualizado_em = new Date().toISOString();
        
        const fields = [];
        const values = [];
        
        Object.keys(profissional).forEach(key => {
            if (key !== 'id' && key !== 'criado_em') {
                fields.push(`${key} = ?`);
                values.push(profissional[key]);
            }
        });
        
        values.push(id);
        
        const sql = `UPDATE profissionais SET ${fields.join(', ')} WHERE id = ?`;
        
        req.db.run(sql, values, function(err) {
            if (err) {
                console.error('Erro ao atualizar profissional:', err);
                return res.status(500).json({ error: err.message });
            }
            
            // Retornar o profissional atualizado
            req.db.get('SELECT * FROM profissionais WHERE id = ?', [id], (err, row) => {
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
    
    const sql = 'UPDATE profissionais SET status = "inativo", atualizado_em = ? WHERE id = ?';
    const atualizado_em = new Date().toISOString();
    
    req.db.run(sql, [atualizado_em, id], function(err) {
        if (err) {
            console.error('Erro ao inativar profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Profissional não encontrado' });
        }
        
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
    
    const sql = 'UPDATE profissionais SET status = "ativo", atualizado_em = ? WHERE id = ?';
    const atualizado_em = new Date().toISOString();
    
    req.db.run(sql, [atualizado_em, id], function(err) {
        if (err) {
            console.error('Erro ao reativar profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Profissional não encontrado' });
        }
        
        res.json({ 
            message: 'Profissional reativado com sucesso',
            id: id,
            status: 'ativo'
        });
    });
});

// LISTAR APENAS PROFISSIONAIS ATIVOS
router.get('/ativos', (req, res) => {
    req.db.all('SELECT id, nome, especialidade, telefone, email, funcao, comissao FROM profissionais WHERE status = "ativo" ORDER BY nome ASC', (err, rows) => {
        if (err) {
            console.error('Erro ao buscar profissionais ativos:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// BUSCAR AGENDAMENTOS DO PROFISSIONAL
router.get('/:id/agendamentos', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT a.*, c.nome_completo as cliente_nome
        FROM agendamentos a
        LEFT JOIN clientes c ON a.cliente_id = c.id
        WHERE a.profissional_id = ?
        ORDER BY a.data_hora DESC
        LIMIT 50
    `;
    
    req.db.all(sql, [id], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// BUSCAR SERVIÇOS DO PROFISSIONAL
router.get('/:id/servicos', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT s.* 
        FROM servicos s
        INNER JOIN servicos_profissionais sp ON s.id = sp.servico_id
        WHERE sp.profissional_id = ?
        AND s.status = 'ativo'
    `;
    
    req.db.all(sql, [id], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar serviços do profissional:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// BUSCAR HORÁRIOS DE TRABALHO DO PROFISSIONAL
router.get('/:id/horarios-trabalho', (req, res) => {
    const { id } = req.params;
    
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
    
    req.db.all(sql, [id], (err, rows) => {
        if (err) {
            // Se a tabela não existir, retornar horários padrão
            console.log('Tabela horarios_trabalho não encontrada, retornando padrão');
            
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
            res.json(horariosPadrao);
        }
    });
});

// BUSCAR ESTATÍSTICAS DO PROFISSIONAL
router.get('/:id/estatisticas', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT 
            COUNT(*) as total_agendamentos,
            SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
            SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
            AVG(valor) as valor_medio,
            SUM(CASE WHEN status = 'concluido' THEN valor ELSE 0 END) as faturamento_total
        FROM agendamentos 
        WHERE profissional_id = ?
        AND strftime('%Y-%m', data_hora) = strftime('%Y-%m', 'now')
    `;
    
    req.db.get(sql, [id], (err, row) => {
        if (err) {
            console.error('Erro ao buscar estatísticas:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(row || {
            total_agendamentos: 0,
            concluidos: 0,
            cancelados: 0,
            valor_medio: 0,
            faturamento_total: 0
        });
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