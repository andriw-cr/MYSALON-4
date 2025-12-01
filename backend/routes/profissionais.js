const express = require('express');
const router = express.Router();

// Listar profissionais
router.get('/', (req, res) => {
    req.db.all('SELECT id, nome, especialidade, telefone, email, status FROM profissionais WHERE status = "ativo"', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Buscar profissional por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    req.db.get('SELECT * FROM profissionais WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Profissional não encontrado' });
        } else {
            res.json(row);
        }
    });
});

// Buscar agendamentos do profissional
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
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Buscar serviços do profissional
router.get('/:id/servicos', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT s.* 
        FROM servicos s
        INNER JOIN servicos_profissionais sp ON s.id = sp.servico_id
        WHERE sp.profissional_id = ?
    `;
    
    req.db.all(sql, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Buscar horários de trabalho do profissional
router.get('/:id/horarios-trabalho', (req, res) => {
    const { id } = req.params;
    
    // Simulação - na prática isso viria de uma tabela específica
    const horarios = {
        segunda: { inicio: '08:00', fim: '18:00' },
        terca: { inicio: '08:00', fim: '18:00' },
        quarta: { inicio: '08:00', fim: '18:00' },
        quinta: { inicio: '08:00', fim: '18:00' },
        sexta: { inicio: '08:00', fim: '18:00' },
        sabado: { inicio: '08:00', fim: '13:00' },
        domingo: { inicio: null, fim: null } // Fechado
    };
    
    res.json(horarios);
});

// Buscar estatísticas do profissional
router.get('/:id/estatisticas', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT 
            COUNT(*) as total_agendamentos,
            SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
            SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
            AVG(valor) as valor_medio
        FROM agendamentos 
        WHERE profissional_id = ?
    `;
    
    req.db.get(sql, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(row);
        }
    });
});

module.exports = router;