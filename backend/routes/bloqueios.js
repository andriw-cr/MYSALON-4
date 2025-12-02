const express = require('express');
const router = express.Router();

// Listar bloqueios
router.get('/', (req, res) => {
    const { profissional_id, data_inicio, data_fim } = req.query;
    
    let sql = 'SELECT * FROM bloqueios_horario WHERE 1=1';
    const params = [];
    
    if (profissional_id) {
        sql += ' AND profissional_id = ?';
        params.push(profissional_id);
    }
    
    if (data_inicio) {
        sql += ' AND data_inicio >= ?';
        params.push(data_inicio);
    }
    
    if (data_fim) {
        sql += ' AND data_fim <= ?';
        params.push(data_fim);
    }
    
    sql += ' ORDER BY data_inicio ASC';
    
    req.db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar bloqueios:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Criar novo bloqueio
router.post('/', (req, res) => {
    const { profissional_id, data_inicio, data_fim, motivo } = req.body;
    
    if (!data_inicio || !data_fim) {
        return res.status(400).json({ error: 'Data início e data fim são obrigatórias' });
    }
    
    const sql = `
        INSERT INTO bloqueios_horario 
        (profissional_id, data_inicio, data_fim, motivo, data_criacao)
        VALUES (?, ?, ?, ?, datetime('now'))
    `;
    
    const params = [
        profissional_id || null, // Pode ser null para bloquear todos
        data_inicio,
        data_fim,
        motivo || 'Horário bloqueado'
    ];
    
    req.db.run(sql, params, function(err) {
        if (err) {
            console.error('Erro ao criar bloqueio:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ 
                id: this.lastID,
                message: 'Bloqueio criado com sucesso'
            });
        }
    });
});

// Remover bloqueio
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    req.db.run('DELETE FROM bloqueios_horario WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Bloqueio não encontrado' });
        } else {
            res.json({ message: 'Bloqueio removido com sucesso' });
        }
    });
});

module.exports = router;