// backend/routes/agendamentos.js - VERSÃO COMPLETA ATUALIZADA
import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// GET - Listar todos os agendamentos com filtros
router.get('/', (req, res) => {
  const { data, status, cliente_id, profissional_id } = req.query;
  
  let sql = `
    SELECT 
      a.*, 
      c.nome_completo as cliente_nome, 
      c.telefone as cliente_telefone,
      c.email as cliente_email,
      s.nome as servico_nome, 
      s.duracao_minutos,
      s.preco_base,
      p.nome_completo as profissional_nome,
      p.especialidade as profissional_especialidade
    FROM agendamentos a
    LEFT JOIN clientes c ON a.cliente_id = c.id
    LEFT JOIN servicos s ON a.servico_id = s.id
    LEFT JOIN profissionais p ON a.profissional_id = p.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (data) {
    sql += ' AND date(a.data_agendamento) = ?';
    params.push(data);
  }
  
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  
  if (cliente_id) {
    sql += ' AND a.cliente_id = ?';
    params.push(cliente_id);
  }
  
  if (profissional_id) {
    sql += ' AND a.profissional_id = ?';
    params.push(profissional_id);
  }
  
  sql += ' ORDER BY a.data_agendamento DESC';
  
  db.all(sql, params, (err, rows) => {
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
      data: rows,
      total: rows.length
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
      c.email as cliente_email,
      s.nome as servico_nome, 
      s.duracao_minutos,
      s.preco_base,
      p.nome_completo as profissional_nome,
      p.especialidade as profissional_especialidade,
      p.telefone as profissional_telefone
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
      c.telefone as cliente_telefone,
      s.nome as servico_nome, 
      s.duracao_minutos,
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
      c.data_nascimento as cliente_nascimento,
      s.nome as servico_nome, 
      s.descricao as servico_descricao,
      s.duracao_minutos,
      s.preco_base as valor_servico_base,
      s.categoria as servico_categoria,
      p.nome_completo as profissional_nome,
      p.telefone as profissional_telefone,
      p.email as profissional_email,
      p.especialidade as profissional_especialidade
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

// GET - Serviços do agendamento (tabela agendamento_servicos)
router.get('/:id/servicos', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      asr.*,
      s.nome as servico_nome,
      s.descricao as servico_descricao,
      s.preco_base,
      s.duracao_minutos,
      p.nome_completo as profissional_nome
    FROM agendamento_servicos asr
    LEFT JOIN servicos s ON asr.servico_id = s.id
    LEFT JOIN profissionais p ON asr.profissional_id = p.id
    WHERE asr.agendamento_id = ?
    ORDER BY asr.id
  `;
  
  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar serviços do agendamento:', err.message);
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

// POST - Criar novo agendamento (completo)
router.post('/', (req, res) => {
  const {
    cliente_id,
    profissional_id,
    data_agendamento,
    duracao_estimada,
    status = 'agendado',
    valor_servico,
    desconto_aplicado = 0,
    valor_final,
    pontos_utilizados = 0,
    observacoes = '',
    recorrente = false,
    agendamento_pai_id = null,
    notificado_whatsapp = false,
    gorjeta = 0,
    metodo_pagamento,
    pago = false,
    entrada_paga = 0,
    permite_desconto = true,
    permite_pontos_fidelidade = true
  } = req.body;

  // Validações
  if (!cliente_id || !profissional_id || !data_agendamento) {
    return res.status(400).json({ 
      success: false,
      message: 'Cliente, profissional e data são obrigatórios' 
    });
  }

  // Calcular valor final se não fornecido
  const valorFinal = valor_final || (valor_servico - desconto_aplicado);
  
  const sql = `
    INSERT INTO agendamentos 
    (cliente_id, profissional_id, data_agendamento, duracao_estimada, status,
     valor_servico, desconto_aplicado, valor_final, pontos_utilizados, observacoes,
     recorrente, agendamento_pai_id, notificado_whatsapp, gorjeta, metodo_pagamento,
     pago, entrada_paga, permite_desconto, permite_pontos_fidelidade, data_criacao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  db.run(sql, [
    cliente_id,
    profissional_id,
    data_agendamento,
    duracao_estimada,
    status,
    valor_servico,
    desconto_aplicado,
    valorFinal,
    pontos_utilizados,
    observacoes,
    recorrente ? 1 : 0,
    agendamento_pai_id,
    notificado_whatsapp ? 1 : 0,
    gorjeta,
    metodo_pagamento,
    pago ? 1 : 0,
    entrada_paga,
    permite_desconto ? 1 : 0,
    permite_pontos_fidelidade ? 1 : 0
  ], function(err) {
    if (err) {
      console.error('Erro ao criar agendamento:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    const agendamentoId = this.lastID;
    
    // Se houver serviços específicos no body
    if (req.body.servicos && Array.isArray(req.body.servicos)) {
      const servicosPromises = req.body.servicos.map(servico => {
        return new Promise((resolve, reject) => {
          const sqlServico = `
            INSERT INTO agendamento_servicos 
            (agendamento_id, servico_id, profissional_id, preco, duracao_minutos, observacoes)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          db.run(sqlServico, [
            agendamentoId,
            servico.servico_id,
            servico.profissional_id || profissional_id,
            servico.preco,
            servico.duracao_minutos,
            servico.observacoes || ''
          ], function(err) {
            if (err) reject(err);
            else resolve();
          });
        });
      });
      
      Promise.all(servicosPromises)
        .then(() => {
          res.status(201).json({
            success: true,
            message: 'Agendamento criado com sucesso',
            data: { id: agendamentoId }
          });
        })
        .catch(error => {
          console.error('Erro ao adicionar serviços:', error);
          res.status(500).json({
            success: false,
            message: 'Agendamento criado, mas erro ao adicionar serviços',
            error: error.message
          });
        });
    } else {
      res.status(201).json({
        success: true,
        message: 'Agendamento criado com sucesso',
        data: { id: agendamentoId }
      });
    }
  });
});

// PUT - Atualizar agendamento
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { 
    cliente_id,
    profissional_id,
    data_agendamento,
    duracao_estimada,
    status,
    valor_servico,
    desconto_aplicado,
    valor_final,
    pontos_utilizados,
    observacoes,
    recorrente,
    agendamento_pai_id,
    notificado_whatsapp,
    data_notificacao,
    gorjeta,
    metodo_pagamento,
    pago,
    entrada_paga
  } = req.body;
  
  const sql = `
    UPDATE agendamentos 
    SET cliente_id = ?, profissional_id = ?, data_agendamento = ?, 
        duracao_estimada = ?, status = ?, valor_servico = ?, 
        desconto_aplicado = ?, valor_final = ?, pontos_utilizados = ?, 
        observacoes = ?, recorrente = ?, agendamento_pai_id = ?, 
        notificado_whatsapp = ?, data_notificacao = ?, gorjeta = ?, 
        metodo_pagamento = ?, pago = ?, entrada_paga = ?,
        data_criacao = COALESCE(data_criacao, CURRENT_TIMESTAMP)
    WHERE id = ?
  `;
  
  db.run(sql, [
    cliente_id,
    profissional_id,
    data_agendamento,
    duracao_estimada,
    status,
    valor_servico,
    desconto_aplicado,
    valor_final,
    pontos_utilizados,
    observacoes,
    recorrente ? 1 : 0,
    agendamento_pai_id,
    notificado_whatsapp ? 1 : 0,
    data_notificacao,
    gorjeta,
    metodo_pagamento,
    pago ? 1 : 0,
    entrada_paga,
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

// PATCH - Atualizar status do agendamento
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

// DELETE - Cancelar agendamento (soft delete)
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

// GET - Estatísticas de agendamentos do dia
router.get('/estatisticas/hoje', (req, res) => {
  const hoje = new Date().toISOString().split('T')[0];
  
  const sql = `
    SELECT 
      status,
      COUNT(*) as total,
      COALESCE(SUM(valor_final), 0) as faturamento
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
      agendado: { quantidade: 0, faturamento: 0 },
      confirmado: { quantidade: 0, faturamento: 0 },
      em_andamento: { quantidade: 0, faturamento: 0 },
      concluido: { quantidade: 0, faturamento: 0 },
      cancelado: { quantidade: 0, faturamento: 0 },
      faturamento_total: 0
    };
    
    rows.forEach(row => {
      estatisticas[row.status] = { 
        quantidade: row.total, 
        faturamento: row.faturamento 
      };
      estatisticas.total += row.total;
      estatisticas.faturamento_total += row.faturamento;
    });
    
    res.json({ 
      success: true,
      data: estatisticas 
    });
  });
});

// GET - Disponibilidade de horários
router.get('/disponibilidade/horarios', (req, res) => {
  const { profissional_id, data, servico_id } = req.query;
  
  if (!profissional_id || !data) {
    return res.status(400).json({ 
      success: false,
      message: 'Profissional e data são obrigatórios' 
    });
  }

  // Buscar duração do serviço
  let duracaoServico = 60; // default 60 minutos
  if (servico_id) {
    const sqlServico = 'SELECT duracao_minutos FROM servicos WHERE id = ?';
    db.get(sqlServico, [servico_id], (err, servico) => {
      if (!err && servico) {
        duracaoServico = servico.duracao_minutos;
      }
      continuarConsulta();
    });
  } else {
    continuarConsulta();
  }

  function continuarConsulta() {
    // Buscar agendamentos do profissional na data
    const sqlAgendamentos = `
      SELECT 
        data_agendamento,
        strftime('%H:%M', data_agendamento) as hora_inicio,
        s.duracao_minutos
      FROM agendamentos a
      LEFT JOIN servicos s ON a.servico_id = s.id
      WHERE a.profissional_id = ? 
        AND date(a.data_agendamento) = ? 
        AND a.status NOT IN ('cancelado', 'nao_compareceu')
      ORDER BY data_agendamento
    `;
    
    // Buscar bloqueios de horário
    const sqlBloqueios = `
      SELECT hora_inicio, hora_fim, motivo, tipo_bloqueio
      FROM bloqueios_horario
      WHERE profissional_id = ? AND data_bloqueio = ?
    `;
    
    db.all(sqlAgendamentos, [profissional_id, data], (err, agendamentos) => {
      if (err) {
        console.error('Erro ao buscar agendamentos:', err.message);
        return res.status(500).json({ 
          success: false,
          message: 'Erro interno do servidor',
          error: err.message 
        });
      }
      
      db.all(sqlBloqueios, [profissional_id, data], (err, bloqueios) => {
        if (err) {
          console.error('Erro ao buscar bloqueios:', err.message);
          return res.status(500).json({ 
            success: false,
            message: 'Erro interno do servidor',
            error: err.message 
          });
        }
        
        // Gerar horários disponíveis (08:00 às 18:00, intervalos de 30 min)
        const horariosDisponiveis = [];
        const horaInicio = 8; // 08:00
        const horaFim = 18;   // 18:00
        
        for (let hora = horaInicio; hora < horaFim; hora++) {
          for (let minuto = 0; minuto < 60; minuto += 30) {
            const horarioStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
            
            // Verificar se horário está livre
            const conflitoAgendamento = agendamentos.some(ag => {
              const horaAg = ag.hora_inicio;
              const duracaoAg = ag.duracao_minutos || 60;
              const [hAg, mAg] = horaAg.split(':').map(Number);
              const fimAg = hAg * 60 + mAg + duracaoAg;
              const inicioNovo = hora * 60 + minuto;
              const fimNovo = inicioNovo + duracaoServico;
              
              // Verificar sobreposição
              return (inicioNovo < fimAg && fimNovo > hAg * 60 + mAg);
            });
            
            const conflitoBloqueio = bloqueios.some(blq => {
              const [hIni, mIni] = blq.hora_inicio.split(':').map(Number);
              const [hFim, mFim] = blq.hora_fim.split(':').map(Number);
              const inicioNovo = hora * 60 + minuto;
              const fimNovo = inicioNovo + duracaoServico;
              const inicioBloqueio = hIni * 60 + mIni;
              const fimBloqueio = hFim * 60 + mFim;
              
              return (inicioNovo < fimBloqueio && fimNovo > inicioBloqueio);
            });
            
            if (!conflitoAgendamento && !conflitoBloqueio) {
              horariosDisponiveis.push({
                horario: horarioStr,
                disponivel: true,
                duracao_minutos: duracaoServico
              });
            }
          }
        }
        
        res.json({ 
          success: true,
          data: {
            profissional_id,
            data,
            horarios_disponiveis: horariosDisponiveis,
            total_disponivel: horariosDisponiveis.length,
            agendamentos: agendamentos.length,
            bloqueios: bloqueios.length
          }
        });
      });
    });
  }
});

export default router;