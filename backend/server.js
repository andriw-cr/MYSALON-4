// backend/server.js - VERSÃO COMMONJS
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ===== MIDDLEWARES =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.url}`);
    next();
});

// ===== CONEXÃO COM BANCO =====
const db = require('../database/db');
console.log('✅ Módulo do banco carregado: ../database/db.js');

// Verificar arquivo do banco
const dbFilePath = path.join(__dirname, '../salao.db');
if (!fs.existsSync(dbFilePath)) {
    console.warn('⚠️  Arquivo salao.db não encontrado');
    console.log('💡 Execute: npm run init-db para criar o banco');
} else {
    console.log('💾 Banco de dados encontrado: salao.db');
}

// ===== ROTAS DA API =====

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API My Salon está funcionando',
        timestamp: new Date().toISOString(),
        database: fs.existsSync(dbFilePath) ? 'connected' : 'file_not_found',
        endpoints: {
            clientes: '/api/clientes',
            health: '/api/health'
        }
    });
});

// GET /api/clientes - Listar todos os clientes
app.get('/api/clientes', (req, res) => {
    const { search, status } = req.query;
    
    let sql = 'SELECT * FROM clientes WHERE 1=1';
    const params = [];
    
    if (search) {
        sql += ' AND (nome_completo LIKE ? OR telefone LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status && status !== 'todos') {
        sql += ' AND status = ?';
        params.push(status);
    }
    
    sql += ' ORDER BY nome_completo';
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Erro ao buscar clientes:', err.message);
            res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        } else {
            res.json({ 
                success: true, 
                data: rows,
                total: rows.length 
            });
        }
    });
});

// GET /api/clientes/:id - Buscar cliente por ID
app.get('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM clientes WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else if (row) {
            res.json({ success: true, data: row });
        } else {
            res.status(404).json({ success: false, error: 'Cliente não encontrado' });
        }
    });
});

// POST /api/clientes - Criar novo cliente
app.post('/api/clientes', (req, res) => {
    const cliente = req.body;
    
    if (!cliente.nome_completo || !cliente.telefone) {
        return res.status(400).json({ 
            success: false, 
            error: 'Nome e telefone são obrigatórios' 
        });
    }
    
    const sql = `INSERT INTO clientes (
        nome_completo, telefone, email, data_nascimento, 
        genero, status, observacoes, pontos_fidelidade, data_cadastro
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`;
    
    const params = [
        cliente.nome_completo,
        cliente.telefone,
        cliente.email || '',
        cliente.data_nascimento || '',
        cliente.genero || '',
        cliente.status || 'ativo',
        cliente.observacoes || '',
        cliente.pontos_fidelidade || 0
    ];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error('Erro ao criar cliente:', err.message);
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.status(201).json({ 
                success: true, 
                message: 'Cliente criado com sucesso',
                id: this.lastID 
            });
        }
    });
});

// PUT /api/clientes/:id - Atualizar cliente
app.put('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    const cliente = req.body;
    
    const sql = `UPDATE clientes SET 
        nome_completo = ?, telefone = ?, email = ?, data_nascimento = ?,
        genero = ?, status = ?, observacoes = ?, pontos_fidelidade = ?,
        data_ultima_visita = datetime('now')
        WHERE id = ?`;
    
    const params = [
        cliente.nome_completo,
        cliente.telefone,
        cliente.email || '',
        cliente.data_nascimento || '',
        cliente.genero || '',
        cliente.status || 'ativo',
        cliente.observacoes || '',
        cliente.pontos_fidelidade || 0,
        id
    ];
    
    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ success: false, error: 'Cliente não encontrado' });
        } else {
            res.json({ 
                success: true, 
                message: 'Cliente atualizado com sucesso' 
            });
        }
    });
});

// DELETE /api/clientes/:id - Inativar cliente
app.delete('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = `UPDATE clientes SET status = 'inativo' WHERE id = ?`;
    
    db.run(sql, [id], function(err) {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ success: false, error: 'Cliente não encontrado' });
        } else {
            res.json({ 
                success: true, 
                message: 'Cliente inativado com sucesso' 
            });
        }
    });
});

// ========== ROTAS DE AGENDA ==========

// ========== ROTAS DE AGENDA ==========
const agendamentosRouter = require('./routes/agendamentos.js');
const bloqueiosRouter = require('./routes/bloqueios.js');
const profissionaisRouter = require('./routes/profissionais.js');
const servicosRouter = require('./routes/servicos.js');

app.use('/api/agendamentos', agendamentosRouter);
app.use('/api/bloqueios', bloqueiosRouter);
app.use('/api/profissionais', profissionaisRouter);
app.use('/api/servicos', servicosRouter);


// ===== SERVIR FRONTEND =====
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));
console.log(`📁 Frontend servido de: ${frontendPath}`);

// CORREÇÃO: Mudar '/*' para '*' (Express 5.x bug)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    
    const requestedPath = req.path === '/' ? 'dashboard.html' : req.path;
    const htmlPath = path.join(__dirname, '../frontend/html', requestedPath);
    
    if (fs.existsSync(htmlPath) && htmlPath.endsWith('.html')) {
        console.log(`📄 Servindo página: ${requestedPath}`);
        res.sendFile(htmlPath);
    } else {
        // Fallback para dashboard
        res.sendFile(path.join(__dirname, '../frontend/html/dashboard.html'));
    }
});

// Adicionar estas linhas:
import agendamentosRouter from './routes/agendamentos.js';
import bloqueiosRouter from './routes/bloqueios.js';

// Registar as rotas:
app.use('/api/agendamentos', agendamentosRouter);
app.use('/api/bloqueios', bloqueiosRouter);

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
    console.log(`
    🚀 MY SALON - SISTEMA INICIADO
    ==============================
    📡 Servidor:       http://localhost:${PORT}
    📊 Dashboard:      http://localhost:${PORT}/html/dashboard.html
    👥 Clientes:       http://localhost:${PORT}/html/clientes.html
    📅 Agenda:         http://localhost:${PORT}/html/agenda.html
    🧪 Health Check:   http://localhost:${PORT}/api/health
    👤 API Clientes:   http://localhost:${PORT}/api/clientes
    📅 API Agenda:     http://localhost:${PORT}/api/agendamentos
    🔒 API Bloqueios:  http://localhost:${PORT}/api/bloqueios
    ==============================
    `);
    console.log('✅ Backend: Node.js + Express + SQLite');
    console.log('✅ Frontend: HTML/CSS/JS Vanilla');
    console.log('✅ Banco: SQLite com 30 tabelas, 7 clientes');
    console.log('💡 Dica: Acesse http://localhost:3000/html/clientes.html para testar');
});