// routes/services.js - VERSÃO INTEGRADA
import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// GET - Listar todos os serviços (com filtros)
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
      console.error('Erro ao buscar serviços:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
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
      console.error('Erro ao buscar serviço:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (!row) {
      return res.status(404).json({ 
        success: false,
        message: 'Serviço não encontrado' 
      });
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
      message: 'Nome, preço base e duração são obrigatórios' 
    });
  }

  if (preco_base <= 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Preço base deve ser maior que zero' 
    });
  }

  if (duracao_minutos <= 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Duração deve ser maior que zero' 
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
      console.error('Erro ao criar serviço:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    res.status(201).json({
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
      console.error('Erro ao atualizar serviço:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Serviço não encontrado' 
      });
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
      console.error('Erro ao inativar serviço:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Serviço não encontrado' 
      });
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
      console.error('Erro ao buscar serviços por categoria:', err.message);
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
      console.error('Erro ao buscar estatísticas:', err.message);
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
      console.error('Erro ao buscar categorias:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    const categorias = rows.map(row => row.categoria);
    res.json({ 
      success: true,
      data: categorias 
    });
  });
});

// Adicionar estas rotas ao arquivo existente:

// GET - Profissionais que realizam o serviço
router.get('/:id/profissionais', (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT 
      sp.*,
      p.nome_completo,
      p.especialidade,
      p.telefone,
      p.email,
      p.status as profissional_status
    FROM servicos_profissionais sp
    LEFT JOIN profissionais p ON sp.profissional_id = p.id
    WHERE sp.servico_id = ? AND p.status = 'ativo'
    ORDER BY p.nome_completo
  `;
  
  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar profissionais do serviço:', err.message);
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

// GET - Preços e durações personalizadas por profissional
router.get('/:id/precos-personalizados', (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT 
      sp.profissional_id,
      p.nome_completo,
      sp.comissao_personalizada
    FROM servicos_profissionais sp
    LEFT JOIN profissionais p ON sp.profissional_id = p.id
    WHERE sp.servico_id = ?
    ORDER BY p.nome_completo
  `;
  
  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar preços personalizados:', err.message);
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

export default router;