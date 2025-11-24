import express from 'express';
import sqlite3 from 'sqlite3';
import { DB_PATH } from '../database-config.js';

const router = express.Router();
const db = new sqlite3.Database(DB_PATH);

// GET - Listar todos os clientes
router.get('/', (req, res) => {
  const { search, status } = req.query;
  
  let sql = `
    SELECT * FROM clientes 
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ` AND (nome_completo LIKE ? OR telefone LIKE ? OR email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY nome_completo`;
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(400).json({ 
        success: false,
        error: err.message 
      });
      return;
    }
    res.json({ 
      success: true,
      data: rows,
      total: rows.length
    });
  });
});

// GET - Cliente por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'SELECT * FROM clientes WHERE id = ?';
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      res.status(400).json({ 
        success: false,
        error: err.message 
      });
      return;
    }
    if (!row) {
      res.status(404).json({ 
        success: false,
        error: 'Cliente não encontrado' 
      });
      return;
    }
    res.json({ 
      success: true,
      data: row 
    });
  });
});

// POST - Criar novo cliente
router.post('/', (req, res) => {
  const {
    nome_completo,
    telefone,
    email,
    data_nascimento,
    genero,
    endereco,
    observacoes
  } = req.body;

  // Validações
  if (!nome_completo) {
    return res.status(400).json({ 
      success: false,
      error: 'Nome completo é obrigatório' 
    });
  }

  const sql = `
    INSERT INTO clientes 
    (nome_completo, telefone, email, data_nascimento, genero, endereco, observacoes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo')
  `;
  
  db.run(sql, [
    nome_completo,
    telefone,
    email,
    data_nascimento,
    genero,
    endereco,
    observacoes
  ], function(err) {
    if (err) {
      res.status(400).json({ 
        success: false,
        error: err.message 
      });
      return;
    }
    res.json({
      success: true,
      message: 'Cliente criado com sucesso',
      data: {
        id: this.lastID,
        nome_completo,
        telefone,
        email,
        status: 'ativo'
      }
    });
  });
});

// PUT - Atualizar cliente
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    nome_completo,
    telefone,
    email,
    data_nascimento,
    genero,
    endereco,
    observacoes,
    status
  } = req.body;
  
  const sql = `
    UPDATE clientes 
    SET nome_completo = ?, telefone = ?, email = ?, data_nascimento = ?, 
        genero = ?, endereco = ?, observacoes = ?, status = ?
    WHERE id = ?
  `;
  
  db.run(sql, [
    nome_completo,
    telefone,
    email,
    data_nascimento,
    genero,
    endereco,
    observacoes,
    status,
    id
  ], function(err) {
    if (err) {
      res.status(400).json({ 
        success: false,
        error: err.message 
      });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ 
        success: false,
        error: 'Cliente não encontrado' 
      });
      return;
    }
    res.json({ 
      success: true,
      message: 'Cliente atualizado com sucesso' 
    });
  });
});

// DELETE - Inativar cliente
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'UPDATE clientes SET status = "inativo" WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      res.status(400).json({ 
        success: false,
        error: err.message 
      });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ 
        success: false,
        error: 'Cliente não encontrado' 
      });
      return;
    }
    res.json({ 
      success: true,
      message: 'Cliente inativado com sucesso' 
    });
  });
});

// GET - Histórico de agendamentos do cliente
router.get('/:id/agendamentos', (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT 
      a.*,
      s.nome as servico_nome,
      p.nome_completo as profissional_nome
    FROM agendamentos a
    LEFT JOIN servicos s ON a.servico_id = s.id
    LEFT JOIN profissionais p ON a.profissional_id = p.id
    WHERE a.cliente_id = ?
    ORDER BY a.data_agendamento DESC
  `;
  
  db.all(sql, [id], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ 
      success: true,
      data: rows 
    });
  });
});

// GET - Estatísticas do cliente
router.get('/:id/estatisticas', (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT 
      COUNT(*) as total_agendamentos,
      SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
      SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
      COALESCE(SUM(valor_servico), 0) as total_gasto
    FROM agendamentos 
    WHERE cliente_id = ?
  `;
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ 
      success: true,
      data: row 
    });
  });
});

// PATCH - Atualizar pontos de fidelidade
router.patch('/:id/pontos', (req, res) => {
  const { id } = req.params;
  const { pontos, operacao = 'adicionar' } = req.body; // operacao: 'adicionar' ou 'remover'
  
  if (!pontos || pontos <= 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Pontos devem ser um número positivo' 
    });
  }

  const sql = operacao === 'adicionar' 
    ? 'UPDATE clientes SET pontos_fidelidade = pontos_fidelidade + ? WHERE id = ?'
    : 'UPDATE clientes SET pontos_fidelidade = pontos_fidelidade - ? WHERE id = ?';
  
  db.run(sql, [pontos, id], function(err) {
    if (err) {
      res.status(400).json({ 
        success: false,
        error: err.message 
      });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ 
        success: false,
        error: 'Cliente não encontrado' 
      });
      return;
    }
    res.json({ 
      success: true,
      message: `Pontos ${operacao === 'adicionar' ? 'adicionados' : 'removidos'} com sucesso` 
    });
  });
});

export default router;