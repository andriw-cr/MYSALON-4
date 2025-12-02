const express = require('express');
const router = express.Router();

// Listar todos os agendamentos
router.get('/', (req, res) => {
    const { data, profissional_id, status, cliente_id } = req.query;
    
    let sql = `
        SELECT 
            a.*,
            c.nome_completo as cliente_nome,
            c.telefone as cliente_telefone,
            p.nome as profissional_nome,
            (SELECT COUNT(*) FROM agendamento_servicos WHERE agendamento_id = a.id) as servicos_count
        FROM agendamentos a
        LEFT JOIN clientes c ON a.cliente_id = c.id
        LEFT JOIN profissionais p ON a.profissional_id = p.id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (data) {
        sql += ' AND DATE(a.data_hora) = ?';
        params.push(data);
    }
    
    if (profissional_id) {
        sql += ' AND a.profissional_id = ?';
        params.push(profissional_id);
    }
    
    if (status) {
        sql += ' AND a.status = ?';
        params.push(status);
    }
    
    if (cliente_id) {
        sql += ' AND a.cliente_id = ?';
        params.push(cliente_id);
    }
    
    sql += ' ORDER BY a.data_hora ASC';
    
    req.db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Buscar agendamento por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT 
            a.*,
            c.nome_completo as cliente_nome,
            c.telefone as cliente_telefone,
            p.nome as profissional_nome
        FROM agendamentos a
        LEFT JOIN clientes c ON a.cliente_id = c.id
        LEFT JOIN profissionais p ON a.profissional_id = p.id
        WHERE a.id = ?
    `;
    
    req.db.get(sql, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Agendamento não encontrado' });
        } else {
            res.json(row);
        }
    });
});

// Buscar serviços de um agendamento
router.get('/:id/servicos', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT s.* 
        FROM servicos s
        INNER JOIN agendamento_servicos as_rel ON s.id = as_rel.servico_id
        WHERE as_rel.agendamento_id = ?
    `;
    
    req.db.all(sql, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Criar novo agendamento
router.post('/', (req, res) => {
    const { cliente_id, profissional_id, data_hora, observacoes, valor, status, servicos } = req.body;
    
    const sql = `
        INSERT INTO agendamentos 
        (cliente_id, profissional_id, data_hora, observacoes, valor, status, data_criacao)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `;
    
    const params = [
        cliente_id,
        profissional_id,
        data_hora,
        observacoes || '',
        valor || 0,
        status || 'agendado'
    ];
    
    req.db.run(sql, params, function(err) {
        if (err) {
            console.error('Erro ao criar agendamento:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            const agendamentoId = this.lastID;
            
            // Vincular serviços se fornecidos
            if (servicos && Array.isArray(servicos)) {
                servicos.forEach(servicoId => {
                    req.db.run(
                        'INSERT INTO agendamento_servicos (agendamento_id, servico_id) VALUES (?, ?)',
                        [agendamentoId, servicoId],
                        (err) => {
                            if (err) {
                                console.error('Erro ao vincular serviço:', err.message);
                            }
                        }
                    );
                });
            }
            
            res.status(201).json({ 
                id: agendamentoId,
                message: 'Agendamento criado com sucesso'
            });
        }
    });
});

// Atualizar status do agendamento
router.patch('/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    const sql = 'UPDATE agendamentos SET status = ? WHERE id = ?';
    
    req.db.run(sql, [status, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Agendamento não encontrado' });
        } else {
            res.json({ message: 'Status atualizado com sucesso' });
        }
    });
});

// Buscar estatísticas do dia
router.get('/estatisticas/hoje', (req, res) => {
    const hoje = new Date().toISOString().split('T')[0];
    
    const sql = `
        SELECT 
            COUNT(*) as total_hoje,
            SUM(CASE WHEN status = 'agendado' THEN 1 ELSE 0 END) as agendados,
            SUM(CASE WHEN status = 'confirmado' THEN 1 ELSE 0 END) as confirmados,
            SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as em_andamento,
            SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
            SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados
        FROM agendamentos 
        WHERE DATE(data_hora) = ?
    `;
    
    req.db.get(sql, [hoje], (err, row) => {
        if (err) {
            console.error('Erro ao buscar estatísticas:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.json(row);
        }
    });
});

// Buscar horários disponíveis
router.get('/disponibilidade/horarios', (req, res) => {
    const { profissional_id, data } = req.query;
    
    if (!profissional_id || !data) {
        return res.status(400).json({ error: 'Profissional e data são obrigatórios' });
    }
    
    // Horários de trabalho padrão (8:00 às 18:00)
    const horariosTrabalho = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    // Buscar agendamentos existentes
    const sql = `
        SELECT TIME(data_hora) as hora
        FROM agendamentos 
        WHERE profissional_id = ? 
        AND DATE(data_hora) = ?
        AND status NOT IN ('cancelado', 'concluido')
    `;
    
    req.db.all(sql, [profissional_id, data], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            const horariosOcupados = rows.map(row => row.hora.substring(0, 5));
            
            // Filtrar horários disponíveis
            const horariosDisponiveis = horariosTrabalho
                .filter(hora => !horariosOcupados.includes(hora))
                .map(hora => ({
                    data_hora: `${data}T${hora}:00`,
                    hora: hora,
                    disponivel: true
                }));
            
            res.json(horariosDisponiveis);
        }
    });
});

module.exports = router;