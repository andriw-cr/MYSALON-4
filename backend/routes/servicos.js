import express from 'express';
import sqlite3 from 'sqlite3';
import { DB_PATH } from '../database-config.js';

const router = express.Router();
const db = new sqlite3.Database(DB_PATH);

// GET - Listar todos os serviços
router.get('/', (req, res) => {
  const { categoria, status } = req.query;
  
  let sql = 'SELECT * FROM servicos WHERE 1=1';
  const params = [];

  if (categoria) {
    sql += ' AND categoria = ?';
    params.push(categoria);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY nome';
  
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

// GET - Serviço por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'SELECT * FROM servicos WHERE id = ?';
  
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
        error: 'Serviço não encontrado' 
      });
      return;
    }
    res.json({ 
      success: true,
      data: row 
    });
  });
});

// POST - Criar novo serviço
router.post('/', (req, res) => {
  const {
    nome,
    categoria,
    descricao,
    preco_base,
    duracao_minutos,
    status = 'ativo'
  } = req.body;

  // Validações
  if (!nome || !preco_base || !duracao_minutos) {
    return res.status(400).json({ 
      success: false,
      error: 'Nome, preço base e duração são obrigatórios' 
    });
  }

  if (preco_base <= 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Preço base deve ser maior que zero' 
    });
  }

  if (duracao_minutos <= 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Duração deve ser maior que zero' 
    });
  }

  const sql = `
    INSERT INTO servicos 
    (nome, categoria, descricao, preco_base, duracao_minutos, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    nome,
    categoria,
    descricao,
    preco_base,
    duracao_minutos,
    status
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
      message: 'Serviço criado com sucesso',
      data: {
        id: this.lastID,
        nome,
        categoria,
        preco_base,
        duracao_minutos,
        status
      }
    });
  });
});

// PUT - Atualizar serviço
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    nome,
    categoria,
    descricao,
    preco_base,
    duracao_minutos,
    status
  } = req.body;
  
  const sql = `
    UPDATE servicos 
    SET nome = ?, categoria = ?, descricao = ?, preco_base = ?, 
        duracao_minutos = ?, status = ?
    WHERE id = ?
  `;
  
  db.run(sql, [
    nome,
    categoria,
    descricao,
    preco_base,
    duracao_minutos,
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
        error: 'Serviço não encontrado' 
      });
      return;
    }
    res.json({ 
      success: true,
      message: 'Serviço atualizado com sucesso' 
    });
  });
});

// DELETE - Inativar serviço
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'UPDATE servicos SET status = "inativo" WHERE id = ?';
  
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
        error: 'Serviço não encontrado' 
      });
      return;
    }
    res.json({ 
      success: true,
      message: 'Serviço inativado com sucesso' 
    });
  });
});

// GET - Serviços por categoria
router.get('/categoria/:categoria', (req, res) => {
  const { categoria } = req.params;
  
  const sql = 'SELECT * FROM servicos WHERE categoria = ? AND status = "ativo" ORDER BY nome';
  
  db.all(sql, [categoria], (err, rows) => {
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

// GET - Estatísticas de serviços
router.get('/estatisticas/populares', (req, res) => {
  const sql = `
    SELECT 
      s.id,
      s.nome,
      s.categoria,
      s.preco_base,
      COUNT(a.id) as total_agendamentos,
      COALESCE(SUM(a.valor_servico), 0) as faturamento_total
    FROM servicos s
    LEFT JOIN agendamentos a ON s.id = a.servico_id AND a.status = 'concluido'
    WHERE s.status = 'ativo'
    GROUP BY s.id, s.nome, s.categoria, s.preco_base
    ORDER BY total_agendamentos DESC
  `;
  
  db.all(sql, [], (err, rows) => {
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

// GET - Lista de categorias disponíveis
router.get('/categorias/list', (req, res) => {
  const sql = `
    SELECT DISTINCT categoria 
    FROM servicos 
    WHERE categoria IS NOT NULL AND categoria != ''
    ORDER BY categoria
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    const categorias = rows.map(row => row.categoria);
    res.json({ 
      success: true,
      data: categorias 
    });
  });
});

export default router;