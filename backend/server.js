// backend/server.js - VERSÃO CORRIGIDA
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ==================== ROTAS DE AGENDAMENTOS ====================
app.get('/api/agendamentos/estatisticas/hoje', (req, res) => {
    console.log('[API] Recebida requisição para /api/agendamentos/estatisticas/hoje');
    
    try {
        const db = require('../database/db');
        const hoje = new Date().toISOString().split('T')[0];
        
        console.log(`[API] Buscando agendamentos para hoje: ${hoje}`);
        
        // CONSULTA 1: Estatísticas gerais do dia
        const sqlEstatisticas = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'confirmado' THEN 1 ELSE 0 END) as confirmados,
                SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
                SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
                SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
                SUM(CASE WHEN pago = 1 THEN valor_final ELSE 0 END) as receita_confirmada,
                SUM(valor_final) as receita_estimada_total,
                SUM(gorjeta) as gorjeta_total
            FROM agendamentos 
            WHERE DATE(data_agendamento) = ?
        `;
        
        db.get(sqlEstatisticas, [hoje], (err, estatisticas) => {
            if (err) {
                console.error('[API] Erro na consulta de estatísticas:', err);
                return res.status(500).json({ 
                    error: 'Erro no banco de dados',
                    detalhes: err.message 
                });
            }
            
            // Se não encontrou agendamentos hoje
            if (!estatisticas.total) {
                estatisticas = {
                    total: 0,
                    confirmados: 0,
                    pendentes: 0,
                    cancelados: 0,
                    concluidos: 0,
                    receita_confirmada: 0,
                    receita_estimada_total: 0,
                    gorjeta_total: 0
                };
            }
            
            // CONSULTA 2: Agendamentos detalhados do dia
            const sqlAgendamentos = `
                SELECT 
                    a.id,
                    a.data_agendamento,
                    a.status,
                    a.valor_final,
                    a.valor_servico,
                    a.desconto_aplicado,
                    a.gorjeta,
                    a.pago,
                    a.observacoes,
                    c.nome_completo as cliente_nome,
                    c.telefone as cliente_telefone,
                    s.nome as servico_nome,
                    p.nome_completo as profissional_nome,
                    p.especialidade as profissional_especialidade
                FROM agendamentos a
                LEFT JOIN clientes c ON a.cliente_id = c.id
                LEFT JOIN servicos s ON a.servico_id = s.id
                LEFT JOIN profissionais p ON a.profissional_id = p.id
                WHERE DATE(a.data_agendamento) = ?
                ORDER BY a.data_agendamento ASC
                LIMIT 20
            `;
            
            db.all(sqlAgendamentos, [hoje], (err2, agendamentosDetalhados) => {
                if (err2) {
                    console.error('[API] Erro na consulta de detalhes:', err2);
                    // Retornar só as estatísticas se der erro nos detalhes
                    return res.json({
                        ...estatisticas,
                        agendamentos: [],
                        mensagem: 'Estatísticas carregadas, detalhes com erro'
                    });
                }
                
                // CONSULTA 3: Distribuição por profissional
                const sqlProfissionais = `
                    SELECT 
                        p.nome_completo,
                        p.especialidade,
                        COUNT(a.id) as total_agendamentos,
                        SUM(a.valor_final) as valor_total
                    FROM agendamentos a
                    LEFT JOIN profissionais p ON a.profissional_id = p.id
                    WHERE DATE(a.data_agendamento) = ?
                    GROUP BY p.id, p.nome_completo
                    ORDER BY total_agendamentos DESC
                `;
                
                db.all(sqlProfissionais, [hoje], (err3, porProfissional) => {
                    if (err3) {
                        console.error('[API] Erro na consulta por profissional:', err3);
                        porProfissional = [];
                    }
                    
                    // CONSULTA 4: Distribuição por horário
                    const sqlHorarios = `
                        SELECT 
                            strftime('%H:00', a.data_agendamento) as hora,
                            COUNT(*) as quantidade,
                            SUM(a.valor_final) as valor_total
                        FROM agendamentos a
                        WHERE DATE(a.data_agendamento) = ?
                        GROUP BY strftime('%H', a.data_agendamento)
                        ORDER BY hora
                    `;
                    
                    db.all(sqlHorarios, [hoje], (err4, porHorario) => {
                        if (err4) {
                            console.error('[API] Erro na consulta por horário:', err4);
                            porHorario = [];
                        }
                        
                        // Formatar resposta final
                        const resposta = {
                            ...estatisticas,
                            data_consulta: hoje,
                            agendamentos: agendamentosDetalhados || [],
                            distribuicao_profissionais: porProfissional || [],
                            distribuicao_horarios: porHorario || [],
                            proximos_agendamentos: agendamentosDetalhados
                                .filter(a => a.status === 'confirmado' || a.status === 'pendente')
                                .slice(0, 5)
                        };
                        
                        console.log(`[API] Estatísticas encontradas: ${estatisticas.total} agendamentos para hoje`);
                        console.log(`[API] Receita estimada: R$ ${estatisticas.receita_estimada_total || 0}`);
                        
                        res.json(resposta);
                    });
                });
            });
        });
    } catch (error) {
        console.error('[API] Erro geral no endpoint:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            detalhes: error.message,
            mensagem: 'Por favor, tente novamente mais tarde'
        });
    }
});

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

// ===== ROTAS DE SERVIÇOS =====
const servicosRouter = require('./routes/servicos');
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
        const dashboardPath = path.join(__dirname, '../frontend/html/dashboard.html');
        if (fs.existsSync(dashboardPath)) {
            console.log(`📄 Fallback para dashboard: ${requestedPath} → dashboard.html`);
            res.sendFile(dashboardPath);
        } else {
            console.log(`❌ Página não encontrada: ${requestedPath}`);
            res.status(404).send(`
                <h1>Página não encontrada</h1>
                <p>A página solicitada não existe.</p>
                <a href="/">Voltar ao início</a>
            `);
        }
    }
});

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
    ==============================
    `);
    console.log('✅ Backend: Node.js + Express + SQLite');
    console.log('✅ Frontend: HTML/CSS/JS Vanilla');
    console.log('✅ Banco: SQLite com 30 tabelas, 7 clientes');
    console.log('💡 Dica: Acesse http://localhost:3000/html/clientes.html para testar');
});