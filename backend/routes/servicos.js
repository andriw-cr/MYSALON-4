const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ==================== CONEXÃO SIMPLES E EFETIVA ====================
let db = null;

const getDatabase = () => {
    if (db) return db;
    
    console.log('[SERVICOS] Conectando ao banco...');
    
    const dbPath = path.join(__dirname, '../../salao.db');
    
    if (!fs.existsSync(dbPath)) {
        console.error('[SERVICOS] ❌ Banco não encontrado em:', dbPath);
        db = new sqlite3.Database(':memory:');
        return db;
    }
    
    console.log(`[SERVICOS] ✅ Banco encontrado: ${dbPath}`);
    
    // Conexão SIMPLES sem complicações
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('[SERVICOS] ❌ Erro na conexão:', err.message);
        } else {
            console.log('[SERVICOS] ✅ Conexão estabelecida');
            // Configurações mínimas necessárias
            db.run('PRAGMA journal_mode = WAL;');
            db.run('PRAGMA busy_timeout = 3000;');
        }
    });
    
    return db;
};

// Middleware simples
router.use((req, res, next) => {
    req.db = getDatabase();
    next();
});

// ==================== ENDPOINTS SIMPLES E FUNCIONAIS ====================

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
            COALESCE(status, 'ativo') as status,
            permite_agendamento_online,
            permite_desconto,
            permite_pontos_fidelidade,
            max_clientes_por_horario,
            intervalo_entre_atendimentos
        FROM servicos 
        ORDER BY nome
    `, [], (err, rows) => {
        if (err) {
            console.error('[SERVICOS] Erro:', err.message);
            res.status(500).json({ 
                success: false, 
                error: 'Erro no banco de dados'
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

// POST /api/servicos - Criar novo
router.post('/', (req, res) => {
    const servico = req.body;
    console.log('[SERVICOS] POST /api/servicos:', servico.nome);
    
    if (!servico.nome) {
        return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }
    
    const sql = `
        INSERT INTO servicos (
            nome, categoria, descricao, preco_base, duracao_minutos, status,
            permite_agendamento_online, permite_desconto, permite_pontos_fidelidade,
            max_clientes_por_horario, intervalo_entre_atendimentos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    req.db.run(sql, [
        servico.nome,
        servico.categoria || 'outros',
        servico.descricao || '',
        servico.preco_base || 0,
        servico.duracao_minutos || 30,
        'ativo',
        1, 1, 1, 1, 0
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

// PUT /api/servicos/:id - Atualizar
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const servico = req.body;
    
    console.log(`[SERVICOS] PUT /api/servicos/${id}:`, servico.nome);
    
    if (!servico.nome) {
        return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }
    
    const sql = `
        UPDATE servicos SET 
            nome = ?,
            categoria = ?,
            descricao = ?,
            preco_base = ?,
            duracao_minutos = ?
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
            console.error('[SERVICOS] ❌ Erro PUT:', err.message);
            res.status(500).json({ 
                success: false, 
                error: err.message
            });
        } else if (this.changes === 0) {
            res.status(404).json({ success: false, error: 'Serviço não encontrado' });
        } else {
            console.log(`[SERVICOS] ✅ Atualizado ID: ${id}`);
            res.json({ 
                success: true, 
                message: 'Serviço atualizado com sucesso',
                changes: this.changes 
            });
        }
    });
});

// DELETE /api/servicos/:id - Inativar
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    console.log(`[SERVICOS] DELETE /api/servicos/${id}`);
    
    req.db.run(
        `UPDATE servicos SET status = 'inativo' WHERE id = ?`, 
        [id], 
        function(err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ success: false, error: 'Serviço não encontrado' });
            } else {
                res.json({ success: true, message: 'Serviço inativado' });
            }
        }
    );
});

// PATCH /api/servicos/:id/reativar
router.patch('/:id/reativar', (req, res) => {
    const id = req.params.id;
    console.log(`[SERVICOS] PATCH /api/servicos/${id}/reativar`);
    
    req.db.run(
        `UPDATE servicos SET status = 'ativo' WHERE id = ?`, 
        [id], 
        function(err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
            } else if (this.changes === 0) {
                res.status(404).json({ success: false, error: 'Serviço não encontrado' });
            } else {
                res.json({ success: true, message: 'Serviço reativado' });
            }
        }
    );
});

// GET /api/servicos/ativos
router.get('/ativos', (req, res) => {
    console.log('[SERVICOS] GET /api/servicos/ativos');
    
    req.db.all(`
        SELECT 
            id, 
            nome, 
            COALESCE(categoria, 'outros') as categoria,
            descricao,
            preco_base,
            duracao_minutos
        FROM servicos 
        WHERE status = 'ativo'
        ORDER BY nome
    `, [], (err, rows) => {
        if (err) {
            console.error('[SERVICOS] Erro:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } else {
            console.log(`[SERVICOS] ✅ ${rows.length} serviços ativos encontrados`);
            res.json({ success: true, data: rows });
        }
    });
});

// ADICIONE ESTES ENDPOINTS AO ARQUIVO servicos.js (após o endpoint GET /ativos)

// GET /api/servicos/categorias/list - Listar categorias únicas
router.get('/categorias/list', (req, res) => {
    console.log('[SERVICOS] GET /api/servicos/categorias/list');
    
    req.db.all(`
        SELECT DISTINCT COALESCE(categoria, 'outros') as categoria,
        COUNT(*) as total_servicos,
        COUNT(CASE WHEN status = 'ativo' THEN 1 END) as ativos
        FROM servicos
        WHERE status IN ('ativo', 'inativo')
        GROUP BY COALESCE(categoria, 'outros')
        ORDER BY categoria
    `, [], (err, rows) => {
        if (err) {
            console.error('[SERVICOS] Erro ao buscar categorias:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } else {
            console.log(`[SERVICOS] ✅ ${rows.length} categorias encontradas`);
            res.json({ success: true, data: rows });
        }
    });
});

// GET /api/servicos/:id - Buscar serviço específico
router.get('/:id', (req, res) => {
    const id = req.params.id;
    console.log(`[SERVICOS] GET /api/servicos/${id}`);
    
    req.db.get(`
        SELECT 
            id, 
            nome, 
            COALESCE(categoria, 'outros') as categoria,
            descricao,
            preco_base,
            duracao_minutos,
            COALESCE(status, 'ativo') as status,
            permite_agendamento_online,
            permite_desconto,
            permite_pontos_fidelidade,
            max_clientes_por_horario,
            intervalo_entre_atendimentos
        FROM servicos 
        WHERE id = ?
    `, [id], (err, row) => {
        if (err) {
            console.error('[SERVICOS] Erro ao buscar serviço:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } else if (!row) {
            res.status(404).json({ success: false, error: 'Serviço não encontrado' });
        } else {
            console.log(`[SERVICOS] ✅ Serviço ${id} encontrado`);
            res.json({ success: true, data: row });
        }
    });
});

// ADICIONE TAMBÉM ESTE ENDPOINT PARA TESTE:
// GET /api/servicos/test/health - Teste rápido
router.get('/test/health', (req, res) => {
    console.log('[SERVICOS] Test health endpoint');
    res.json({
        success: true,
        message: 'Serviços API funcionando',
        timestamp: new Date().toISOString(),
        endpoints: {
            list: 'GET /api/servicos',
            byId: 'GET /api/servicos/:id',
            create: 'POST /api/servicos',
            update: 'PUT /api/servicos/:id',
            delete: 'DELETE /api/servicos/:id',
            categories: 'GET /api/servicos/categorias/list',
            active: 'GET /api/servicos/ativos'
        }
    });
});

// Health check
router.get('/health/check', (req, res) => {
    console.log('[SERVICOS] Health check');
    
    req.db.get('SELECT COUNT(*) as total FROM servicos', [], (err, row) => {
        if (err) {
            res.status(500).json({
                success: false,
                service: 'servicos',
                status: 'offline',
                error: err.message,
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({
                success: true,
                service: 'servicos',
                status: 'online',
                total_servicos: row.total,
                timestamp: new Date().toISOString()
            });
        }
    });
});

module.exports = router;