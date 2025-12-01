// routes/professionals.js - VERSÃO INTEGRADA E CORRIGIDA
import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// GET - Listar todos os profissionais
router.get('/', (req, res) => {
  const { status, especialidade } = req.query;
  
  let sql = 'SELECT * FROM profissionais WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (especialidade) {
    sql += ' AND especialidade LIKE ?';
    params.push(`%${especialidade}%`);
  }

  sql += ' ORDER BY nome_completo';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Erro ao buscar profissionais:', err.message);
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

// GET - Profissional por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'SELECT * FROM profissionais WHERE id = ?';
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar profissional:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (!row) {
      return res.status(404).json({ 
        success: false,
        message: 'Profissional não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      data: row 
    });
  });
});

// POST - Criar novo profissional
router.post('/', (req, res) => {
  const {
    nome_completo,
    telefone,
    email,
    especialidade,
    comissao_padrao = 40.00,
    status = 'ativo',
    observacoes
  } = req.body;

  // Validações
  if (!nome_completo) {
    return res.status(400).json({ 
      success: false,
      message: 'Nome completo é obrigatório' 
    });
  }

  if (comissao_padrao < 0 || comissao_padrao > 100) {
    return res.status(400).json({ 
      success: false,
      message: 'Comissão deve estar entre 0 e 100' 
    });
  }

  const sql = `
    INSERT INTO profissionais 
    (nome_completo, telefone, email, especialidade, comissao_padrao, status, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    nome_completo,
    telefone,
    email,
    especialidade,
    comissao_padrao,
    status,
    observacoes
  ], function(err) {
    if (err) {
      console.error('Erro ao criar profissional:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Profissional criado com sucesso',
      data: {
        id: this.lastID,
        nome_completo,
        especialidade,
        comissao_padrao,
        status
      }
    });
  });
});

// PUT - Atualizar profissional
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    nome_completo,
    telefone,
    email,
    especialidade,
    comissao_padrao,
    status,
    observacoes
  } = req.body;
  
  const sql = `
    UPDATE profissionais 
    SET nome_completo = ?, telefone = ?, email = ?, especialidade = ?, 
        comissao_padrao = ?, status = ?, observacoes = ?
    WHERE id = ?
  `;
  
  db.run(sql, [
    nome_completo,
    telefone,
    email,
    especialidade,
    comissao_padrao,
    status,
    observacoes,
    id
  ], function(err) {
    if (err) {
      console.error('Erro ao atualizar profissional:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Profissional não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Profissional atualizado com sucesso' 
    });
  });
});

// DELETE - Inativar profissional
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'UPDATE profissionais SET status = "inativo" WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Erro ao inativar profissional:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Profissional não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Profissional inativado com sucesso' 
    });
  });
});

// GET - Agendamentos do profissional
router.get('/:id/agendamentos', (req, res) => {
  const { id } = req.params;
  const { data, status } = req.query;
  
  let sql = `
    SELECT 
      a.*,
      c.nome_completo as cliente_nome,
      c.telefone as cliente_telefone,
      s.nome as servico_nome,
      s.duracao_minutos
    FROM agendamentos a
    LEFT JOIN clientes c ON a.cliente_id = c.id
    LEFT JOIN servicos s ON a.servico_id = s.id
    WHERE a.profissional_id = ?
  `;
  const params = [id];

  if (data) {
    sql += ' AND date(a.data_agendamento) = ?';
    params.push(data);
  }

  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY a.data_agendamento';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Erro ao buscar agendamentos do profissional:', err.message);
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

// GET - Estatísticas do profissional
router.get('/:id/estatisticas', (req, res) => {
  const { id } = req.params;
  const { mes, ano } = req.query;
  
  let whereClause = 'WHERE profissional_id = ?';
  const params = [id];

  if (mes && ano) {
    whereClause += ' AND strftime("%m", data_agendamento) = ? AND strftime("%Y", data_agendamento) = ?';
    params.push(mes.padStart(2, '0'), ano);
  }

  const sql = `
    SELECT 
      COUNT(*) as total_agendamentos,
      SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
      SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados,
      COALESCE(SUM(valor_servico), 0) as faturamento_total,
      COALESCE(SUM(valor_servico * comissao_padrao / 100), 0) as comissao_total
    FROM agendamentos a
    LEFT JOIN profissionais p ON a.profissional_id = p.id
    ${whereClause}
  `;
  
  db.get(sql, params, (err, row) => {
    if (err) {
      console.error('Erro ao buscar estatísticas do profissional:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    res.json({ 
      success: true,
      data: row 
    });
  });
});

// GET - Horários disponíveis do profissional
router.get('/:id/horarios-disponiveis', (req, res) => {
  const { id } = req.params;
  const { data } = req.query;
  
  if (!data) {
    return res.status(400).json({ 
      success: false,
      message: 'Data é obrigatória' 
    });
  }

  // Buscar agendamentos do profissional na data específica
  const sql = `
    SELECT 
      data_agendamento,
      strftime('%H:%M', data_agendamento) as hora,
      s.duracao_minutos
    FROM agendamentos a
    LEFT JOIN servicos s ON a.servico_id = s.id
    WHERE profissional_id = ? AND date(data_agendamento) = ? AND status NOT IN ('cancelado', 'nao_compareceu')
    ORDER BY data_agendamento
  `;
  
  db.all(sql, [id, data], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar horários do profissional:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }

    // Gerar horários disponíveis (simplificado)
    const horariosOcupados = rows.map(row => ({
      hora: row.hora,
      duracao: row.duracao_minutos
    }));

    res.json({ 
      success: true,
      data: {
        profissional_id: id,
        data: data,
        horarios_ocupados: horariosOcupados,
        total_agendamentos: rows.length
      }
    });
  });
});

// GET - Lista de especialidades
router.get('/especialidades/list', (req, res) => {
  const sql = `
    SELECT DISTINCT especialidade 
    FROM profissionais 
    WHERE especialidade IS NOT NULL AND especialidade != '' AND status = 'ativo'
    ORDER BY especialidade
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar especialidades:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    const especialidades = rows.map(row => row.especialidade);
    res.json({ 
      success: true,
      data: especialidades 
    });
  });
});

export default router;