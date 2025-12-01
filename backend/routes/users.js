// routes/users.js - NOVA ROTA CRIADA
import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// GET - Listar todos os usuários
router.get('/', (req, res) => {
  const { tipo, status } = req.query;
  
  let sql = 'SELECT id, nome, email, tipo, avatar_url, created_at, updated_at FROM usuarios WHERE 1=1';
  const params = [];

  if (tipo) {
    sql += ' AND tipo = ?';
    params.push(tipo);
  }

  sql += ' ORDER BY nome';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Erro ao buscar usuários:', err.message);
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

// GET - Usuário por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'SELECT id, nome, email, tipo, avatar_url, created_at, updated_at FROM usuarios WHERE id = ?';
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (!row) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      data: row 
    });
  });
});

// POST - Criar novo usuário
router.post('/', (req, res) => {
  const {
    nome,
    email,
    senha,
    tipo = 'funcionario',
    avatar_url
  } = req.body;

  // Validações
  if (!nome || !email || !senha) {
    return res.status(400).json({ 
      success: false,
      message: 'Nome, email e senha são obrigatórios' 
    });
  }

  // Hash da senha (em produção, usar bcrypt)
  const senha_hash = Buffer.from(senha).toString('base64'); // Apenas para exemplo

  const sql = `
    INSERT INTO usuarios 
    (nome, email, senha_hash, tipo, avatar_url)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [
    nome,
    email,
    senha_hash,
    tipo,
    avatar_url || null
  ], function(err) {
    if (err) {
      console.error('Erro ao criar usuário:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        id: this.lastID,
        nome,
        email,
        tipo,
        avatar_url
      }
    });
  });
});

// PUT - Atualizar usuário
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    nome,
    email,
    tipo,
    avatar_url
  } = req.body;
  
  const sql = `
    UPDATE usuarios 
    SET nome = ?, email = ?, tipo = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(sql, [
    nome,
    email,
    tipo,
    avatar_url,
    id
  ], function(err) {
    if (err) {
      console.error('Erro ao atualizar usuário:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Usuário atualizado com sucesso' 
    });
  });
});

// PATCH - Atualizar senha do usuário
router.patch('/:id/senha', (req, res) => {
  const { id } = req.params;
  const { senha_atual, nova_senha } = req.body;
  
  if (!nova_senha) {
    return res.status(400).json({ 
      success: false,
      message: 'Nova senha é obrigatória' 
    });
  }

  // Primeiro verificar a senha atual (em produção, usar bcrypt)
  const checkSql = 'SELECT senha_hash FROM usuarios WHERE id = ?';
  
  db.get(checkSql, [id], (err, row) => {
    if (err) {
      console.error('Erro ao verificar senha:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (!row) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não encontrado' 
      });
    }

    // Verificar senha atual (simplificado - em produção usar bcrypt.compare)
    const senhaAtualHash = Buffer.from(senha_atual || '').toString('base64');
    if (senha_atual && row.senha_hash !== senhaAtualHash) {
      return res.status(400).json({ 
        success: false,
        message: 'Senha atual incorreta' 
      });
    }

    // Atualizar senha
    const novaSenhaHash = Buffer.from(nova_senha).toString('base64');
    const updateSql = 'UPDATE usuarios SET senha_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.run(updateSql, [novaSenhaHash, id], function(err) {
      if (err) {
        console.error('Erro ao atualizar senha:', err.message);
        return res.status(500).json({ 
          success: false,
          message: 'Erro interno do servidor',
          error: err.message 
        });
      }
      
      res.json({ 
        success: true,
        message: 'Senha atualizada com sucesso' 
      });
    });
  });
});

// DELETE - Inativar usuário
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Em vez de deletar, podemos marcar como inativo ou deletar diretamente
  const sql = 'DELETE FROM usuarios WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Erro ao deletar usuário:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Usuário deletado com sucesso' 
    });
  });
});

// POST - Login de usuário
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ 
      success: false,
      message: 'Email e senha são obrigatórios' 
    });
  }

  const senhaHash = Buffer.from(senha).toString('base64');
  
  const sql = 'SELECT id, nome, email, tipo, avatar_url FROM usuarios WHERE email = ? AND senha_hash = ?';
  
  db.get(sql, [email, senhaHash], (err, row) => {
    if (err) {
      console.error('Erro ao fazer login:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (!row) {
      return res.status(401).json({ 
        success: false,
        message: 'Email ou senha incorretos' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Login realizado com sucesso',
      data: row
    });
  });
});

// GET - Perfil do usuário logado
router.get('/perfil/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'SELECT id, nome, email, tipo, avatar_url, created_at, updated_at FROM usuarios WHERE id = ?';
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Erro ao buscar perfil:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    if (!row) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      data: row 
    });
  });
});

// GET - Lista de tipos de usuário
router.get('/tipos/list', (req, res) => {
  const sql = `
    SELECT DISTINCT tipo 
    FROM usuarios 
    WHERE tipo IS NOT NULL AND tipo != ''
    ORDER BY tipo
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar tipos de usuário:', err.message);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor',
        error: err.message 
      });
    }
    
    const tipos = rows.map(row => row.tipo);
    res.json({ 
      success: true,
      data: tipos 
    });
  });
});

export default router;