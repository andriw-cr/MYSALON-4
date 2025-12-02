const express = require('express');
const router = express.Router();

// Listar serviços
router.get('/', (req, res) => {
    req.db.all('SELECT id, nome, valor, duracao, categoria, status FROM servicos WHERE status = "ativo"', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Buscar serviço por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    req.db.get('SELECT * FROM servicos WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Serviço não encontrado' });
        } else {
            res.json(row);
        }
    });
});

// Buscar serviços por categoria
router.get('/categoria/:categoria', (req, res) => {
    const { categoria } = req.params;
    
    req.db.all('SELECT * FROM servicos WHERE categoria = ? AND status = "ativo"', [categoria], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Buscar profissionais que realizam o serviço
router.get('/:id/profissionais', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT p.* 
        FROM profissionais p
        INNER JOIN servicos_profissionais sp ON p.id = sp.profissional_id
        WHERE sp.servico_id = ?
        AND p.status = 'ativo'
    `;
    
    req.db.all(sql, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Buscar preços personalizados por profissional
router.get('/:id/precos-personalizados', (req, res) => {
    const { id } = req.params;
    
    const sql = `
        SELECT p.id, p.nome, sp.valor_personalizado
        FROM profissionais p
        INNER JOIN servicos_profissionais sp ON p.id = sp.profissional_id
        WHERE sp.servico_id = ?
        AND sp.valor_personalizado IS NOT NULL
    `;
    
    req.db.all(sql, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Listar categorias
router.get('/categorias/list', (req, res) => {
    const sql = 'SELECT DISTINCT categoria FROM servicos WHERE categoria IS NOT NULL ORDER BY categoria';
    
    req.db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.map(row => row.categoria));
        }
    });
});

module.exports = router;