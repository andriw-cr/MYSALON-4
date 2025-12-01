// backend/server.js - VERSÃO COMMONJS CORRIGIDA
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleTimeString()} ${req.method} ${req.url}`);
    next();
});

// Servir frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));
console.log(`📁 Servindo frontend de: ${frontendPath}`);

// Conexão com banco
const db = require('../database/db');

// ===== ROTAS DA API =====

// Health check
app.get('/api/health', (req, res) => {
    db.get("SELECT 1 as test", (err) => {
        res.json({
            status: err ? 'database_error' : 'healthy',
            timestamp: new Date().toISOString(),
            database: err ? 'disconnected' : 'connected',
            message: err ? 'Database error' : 'API funcionando'
        });
    });
});

// Listar todos os clientes
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

// Buscar cliente por ID
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

// Criar novo cliente
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
                message: 'Cliente criado',
                id: this.lastID 
            });
        }
    });
});

// Atualizar cliente
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
            res.json({ success: true, message: 'Cliente atualizado' });
        }
    });
});

// ========== ROTAS DE AGENDA ==========

// Importar rotas da agenda CORRETAMENTE
const agendamentosRouter = require('./routes/agendamentos.js');
const bloqueiosRouter = require('./routes/bloqueios.js');

// Registrar rotas
app.use('/api/agendamentos', agendamentosRouter);
app.use('/api/bloqueios', bloqueiosRouter);

// Redirecionar para páginas HTML
app.get('/*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    
    const htmlPath = path.join(__dirname, '../frontend/html', req.path === '/' ? 'dashboard.html' : req.path);
    if (fs.existsSync(htmlPath) && htmlPath.endsWith('.html')) {
        res.sendFile(htmlPath);
    } else {
        // Fallback para dashboard
        res.sendFile(path.join(__dirname, '../frontend/html/dashboard.html'));
    }
});

// Iniciar servidor
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
    console.log('📁 Frontend servido de:', frontendPath);
    console.log('💾 Banco de dados: SQLite (30 tabelas, 7 clientes)');
});