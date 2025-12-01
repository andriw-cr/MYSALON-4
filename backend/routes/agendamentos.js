// routes/appointments.js - VERSÃO INTEGRADA E CORRIGIDA
import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// GET - Listar todos os agendamentos
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      a.*, 
      c.nome_completo as cliente_nome, 
      c.telefone as cliente_telefone,
      s.nome as servico_nome, 
      s.duracao_minutos,
      p.nome_completo as profissional_nome
    FROM agendamentos a
    LEFT JOIN clientes c ON a.cliente_id = c.id
    LEFT JOIN servicos s ON a.servico_id = s.id
    LEFT JOIN profissionais p ON a.profissional_id = p.id
    ORDER BY a.data_agendamento DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar agendamentos:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    res.json({ 
      success: true,
      data: rows 
    });
  });
});

// GET - Agendamentos por data específica
router.get('/data/:data', (req, res) => {
  const { data } = req.params;
  const sql = `
    SELECT 
      a.*, 
      c.nome_completo as cliente_nome, 
      c.telefone as cliente_telefone,
      s.nome as servico_nome, 
      s.duracao_minutos,
      s.preco_base as valor_servico_base,
      p.nome_completo as profissional_nome
    FROM agendamentos a
    LEFT JOIN clientes c ON a.cliente_id = c.id
    LEFT JOIN servicos s ON a.servico_id = s.id
    LEFT JOIN profissionais p ON a.profissional_id = p.id
    WHERE date(a.data_agendamento) = ?
    ORDER BY a.data_agendamento
  `;
  
  db.all(sql, [data], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar agendamentos por data:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    res.json({ 
      success: true,
      data: rows 
    });
  });
});

// GET - Agendamentos por período
router.get('/periodo/:inicio/:fim', (req, res) => {
  const { inicio, fim } = req.params;
  const sql = `
    SELECT 
      a.*, 
      c.nome_completo as cliente_nome, 
      s.nome as servico_nome, 
      p.nome_completo as profissional_nome
    FROM agendamentos a
    LEFT JOIN clientes c ON a.cliente_id = c.id
    LEFT JOIN servicos s ON a.servico_id = s.id
    LEFT JOIN profissionais p ON a.profissional_id = p.id
    WHERE date(a.data_agendamento) BETWEEN ? AND ?
    ORDER BY a.data_agendamento
  `;
  
  db.all(sql, [inicio, fim], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar agendamentos por período:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    res.json({ 
      success: true,
      data: rows 
    });
  });
});

// GET - Agendamento por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      a.*, 
      c.nome_completo as cliente_nome, 
      c.telefone as cliente_telefone,
      c.email as cliente_email,
      s.nome as servico_nome, 
      s.descricao as servico_descricao,
      s.duracao_minutos,
      s.preco_base as valor_servico_base,
      p.nome_completo as profissional_nome,
      p.telefone as profissional_telefone
    FROM agendamentos a
    LEFT JOIN clientes c ON a.cliente_id = c.id
    LEFT JOIN servicos s ON a.servico_id = s.id
    LEFT JOIN profissionais p ON a.profissional_id = p.id
    WHERE a.id = ?
  `;
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar agendamento:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (!row) {
      return res.status(404).json({ 
        success: false,
        message: 'Agendamento não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      data: row 
    });
  });
});

// POST - Criar novo agendamento
router.post('/', (req, res) => {
  const {
    cliente_id,
    servico_id, 
    profissional_id,
    data_agendamento,
    observacoes = '',
    valor_servico
  } = req.body;

  // Validações básicas
  if (!cliente_id || !servico_id || !profissional_id || !data_agendamento) {
    return res.status(400).json({ 
      success: false,
      message: 'Dados incompletos. Cliente, serviço, profissional e data são obrigatórios.' 
    });
  }

  const sql = `
    INSERT INTO agendamentos 
    (cliente_id, servico_id, profissional_id, data_agendamento, observacoes, valor_servico, status)
    VALUES (?, ?, ?, ?, ?, ?, 'agendado')
  `;
  
  db.run(sql, [
    cliente_id, 
    servico_id, 
    profissional_id, 
    data_agendamento,
    observacoes,
    valor_servico || 0
  ], function(err) {
    if (err) {
      console.error('Erro ao criar agendamento:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Agendamento criado com sucesso',
      data: {
        id: this.lastID,
        cliente_id,
        servico_id,
        profissional_id,
        data_agendamento,
        status: 'agendado'
      }
    });
  });
});

// PUT - Atualizar agendamento
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    data_agendamento, 
    observacoes,
    valor_servico,
    cliente_id,
    servico_id,
    profissional_id
  } = req.body;
  
  const sql = `
    UPDATE agendamentos 
    SET status = ?, data_agendamento = ?, observacoes = ?, valor_servico = ?,
        cliente_id = ?, servico_id = ?, profissional_id = ?
    WHERE id = ?
  `;
  
  db.run(sql, [
    status, 
    data_agendamento, 
    observacoes,
    valor_servico,
    cliente_id,
    servico_id,
    profissional_id,
    id
  ], function(err) {
    if (err) {
      console.error('Erro ao atualizar agendamento:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Agendamento não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Agendamento atualizado com sucesso' 
    });
  });
});

// PATCH - Atualizar apenas o status
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ 
      success: false,
      message: 'Status é obrigatório' 
    });
  }

  const sql = 'UPDATE agendamentos SET status = ? WHERE id = ?';
  
  db.run(sql, [status, id], function(err) {
    if (err) {
      console.error('Erro ao atualizar status do agendamento:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Agendamento não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      message: `Status do agendamento atualizado para: ${status}` 
    });
  });
});

// DELETE - Cancelar agendamento
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'UPDATE agendamentos SET status = "cancelado" WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Erro ao cancelar agendamento:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Agendamento não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Agendamento cancelado com sucesso' 
    });
  });
});

// GET - Estatísticas de agendamentos
router.get('/estatisticas/hoje', (req, res) => {
  const hoje = new Date().toISOString().split('T')[0];
  
  const sql = `
    SELECT 
      status,
      COUNT(*) as total
    FROM agendamentos 
    WHERE date(data_agendamento) = ?
    GROUP BY status
  `;
  
  db.all(sql, [hoje], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar estatísticas de agendamentos:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    const estatisticas = {
      total: 0,
      agendado: 0,
      confirmado: 0,
      em_andamento: 0,
      concluido: 0,
      cancelado: 0
    };
    
    rows.forEach(row => {
      estatisticas[row.status] = row.total;
      estatisticas.total += row.total;
    });
    
    res.json({ 
      success: true,
      data: estatisticas 
    });
  });
});

export default router;