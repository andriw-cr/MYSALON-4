// backend/routes/bloqueios.js - CRIAR NOVO ARQUIVO
import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// GET - Listar bloqueios
router.get('/', (req, res) => {
  const { profissional_id, data, tipo_bloqueio } = req.query;
  
  let sql = 'SELECT * FROM bloqueios_horario WHERE 1=1';
  const params = [];
  
  if (profissional_id) {
    sql += ' AND profissional_id = ?';
    params.push(profissional_id);
  }
  
  if (data) {
    sql += ' AND data_bloqueio = ?';
    params.push(data);
  }
  
  if (tipo_bloqueio) {
    sql += ' AND tipo_bloqueio = ?';
    params.push(tipo_bloqueio);
  }
  
  sql += ' ORDER BY data_bloqueio, hora_inicio';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Erro ao buscar bloqueios:', err.message);
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

// POST - Criar bloqueio
router.post('/', (req, res) => {
  const {
    profissional_id,
    data_bloqueio,
    hora_inicio,
    hora_fim,
    motivo,
    tipo_bloqueio = 'manual',
    recorrente = false,
    dia_semana = null
  } = req.body;
  
  if (!profissional_id || !data_bloqueio || !hora_inicio || !hora_fim) {
    return res.status(400).json({ 
      success: false,
      message: 'Profissional, data e horários são obrigatórios' 
    });
  }
  
  const sql = `
    INSERT INTO bloqueios_horario 
    (profissional_id, data_bloqueio, hora_inicio, hora_fim, motivo, 
     tipo_bloqueio, recorrente, dia_semana, data_criacao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  db.run(sql, [
    profissional_id,
    data_bloqueio,
    hora_inicio,
    hora_fim,
    motivo,
    tipo_bloqueio,
    recorrente ? 1 : 0,
    dia_semana
  ], function(err) {
    if (err) {
      console.error('Erro ao criar bloqueio:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Bloqueio criado com sucesso',
      data: { id: this.lastID }
    });
  });
});

// DELETE - Remover bloqueio
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM bloqueios_horario WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Erro ao remover bloqueio:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Bloqueio não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Bloqueio removido com sucesso' 
    });
  });
});

export default router;