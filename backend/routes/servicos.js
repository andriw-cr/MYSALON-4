const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ==================== CONEXÃO COM BANCO ====================
let db = null;

const getDatabase = () => {
    if (db) return db;
    
    console.log('[SERVICOS] Conectando ao banco...');
    
    // Procurar banco - AGORA PROCURANDO salao.db PRIMEIRO
    const possiblePaths = [
        'salao.db',                      // Pasta atual
        'backend/salao.db',              // Pasta backend
        path.join(__dirname, '../salao.db'),  // Uma pasta acima
        path.join(__dirname, '../../salao.db'), // Duas pastas acima
        'database.db',                   // Fallback
        'backend/database.db'            // Fallback
    ];
    
    for (const dbPath of possiblePaths) {
        if (fs.existsSync(dbPath)) {
            console.log(`[SERVICOS] ✅ Banco encontrado: ${dbPath}`);
            db = new sqlite3.Database(dbPath);
            return db;
        }
    }
    
    console.error('[SERVICOS] ❌ Nenhum banco encontrado!');
    // Fallback: criar em memória
    db = new sqlite3.Database(':memory:');
    return db;
};

// Middleware
router.use((req, res, next) => {
    req.db = getDatabase();
    next();
});

// ==================== ENDPOINTS OTIMIZADOS ====================

// GET /api/servicos - Listar todos
router.get('/', (req, res) => {
    console.log('[SERVICOS] GET /api/servicos');
    
    req.db.all(`
        SELECT 
            id, 
            nome, 
            COALESCE(categoria, 'outros') as categoria,
            descricao,
            preco_base,
            duracao_minutos,
            COALESCE(status, 'ativo') as status
        FROM servicos 
        ORDER BY nome
    `, [], (err, rows) => {
        if (err) {
            console.error('[SERVICOS] Erro:', err.message);
            res.status(500).json({ 
                success: false, 
                error: err.message,
                message: 'Erro no banco de dados'
            });
        } else {
            console.log(`[SERVICOS] ✅ ${rows.length} serviços encontrados`);
            res.json({ 
                success: true, 
                data: rows, 
                total: rows.length 
            });
        }
    });
});

// GET /api/servicos/ativos
router.get('/ativos', (req, res) => {
    req.db.all(`
        SELECT * FROM servicos 
        WHERE status = 'ativo' OR status IS NULL 
        ORDER BY nome
    `, [], (err, rows) => {
        if (err) {
            res.json({ success: true, data: [] });
        } else {
            res.json({ success: true, data: rows });
        }
    });
});

// GET /api/servicos/categorias/list
router.get('/categorias/list', (req, res) => {
    req.db.all(`
        SELECT DISTINCT categoria 
        FROM servicos 
        WHERE categoria IS NOT NULL 
        ORDER BY categoria
    `, [], (err, rows) => {
        if (err) {
            // Fallback para categorias conhecidas
            res.json({ 
                success: true, 
                data: ['cabelo', 'unhas', 'estetica', 'barba', 'maquiagem', 'outros']
            });
        } else {
            const categorias = rows.map(r => r.categoria).filter(c => c);
            res.json({ success: true, data: categorias });
        }
    });
});

// POST /api/servicos - Criar
router.post('/', (req, res) => {
    const servico = req.body;
    console.log('[SERVICOS] POST /api/servicos:', servico.nome);
    
    if (!servico.nome) {
        return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }
    
    const sql = `
        INSERT INTO servicos (
            nome, categoria, descricao, preco_base, duracao_minutos, status,
            permite_agendamento_online, permite_desconto, permite_pontos_fidelidade
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    req.db.run(sql, [
        servico.nome,
        servico.categoria || 'outros',
        servico.descricao || '',
        servico.preco_base || 0,
        servico.duracao_minutos || 30,
        'ativo',
        1, // permite_agendamento_online
        1, // permite_desconto
        1  // permite_pontos_fidelidade
    ], function(err) {
        if (err) {
            console.error('[SERVICOS] Erro POST:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } else {
            console.log(`[SERVICOS] ✅ Criado ID: ${this.lastID}`);
            res.json({ 
                success: true, 
                id: this.lastID, 
                message: 'Serviço criado com sucesso' 
            });
        }
    });
});

// GET /api/servicos/:id
router.get('/:id', (req, res) => {
    const id = req.params.id;
    
    req.db.get('SELECT * FROM servicos WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else if (row) {
            res.json({ success: true, data: row });
        } else {
            res.status(404).json({ success: false, error: 'Serviço não encontrado' });
        }
    });
});

// PUT /api/servicos/:id - Atualizar
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const servico = req.body;
    
    if (!servico.nome) {
        return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }
    
    const sql = `
        UPDATE servicos SET 
            nome = ?,
            categoria = ?,
            descricao = ?,
            preco_base = ?,
            duracao_minutos = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    req.db.run(sql, [
        servico.nome,
        servico.categoria || 'outros',
        servico.descricao || '',
        servico.preco_base || 0,
        servico.duracao_minutos || 30,
        id
    ], function(err) {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ success: false, error: 'Serviço não encontrado' });
        } else {
            res.json({ success: true, message: 'Serviço atualizado' });
        }
    });
});

// DELETE /api/servicos/:id - Inativar
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    
    req.db.run(`UPDATE servicos SET status = 'inativo' WHERE id = ?`, [id], function(err) {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ success: false, error: 'Serviço não encontrado' });
        } else {
            res.json({ success: true, message: 'Serviço inativado' });
        }
    });
});

// PATCH /api/servicos/:id/reativar
router.patch('/:id/reativar', (req, res) => {
    const id = req.params.id;
    
    req.db.run(`UPDATE servicos SET status = 'ativo' WHERE id = ?`, [id], function(err) {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ success: false, error: 'Serviço não encontrado' });
        } else {
            res.json({ success: true, message: 'Serviço reativado' });
        }
    });
});

// Health check
router.get('/health/check', (req, res) => {
    req.db.get("SELECT COUNT(*) as total FROM servicos", (err, row) => {
        if (err) {
            res.json({ success: false, error: err.message });
        } else {
            res.json({ 
                success: true, 
                total_servicos: row.total,
                timestamp: new Date().toISOString()
            });
        }
    });
});

module.exports = router;