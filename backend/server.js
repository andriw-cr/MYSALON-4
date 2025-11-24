import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ApiServiceClass from '../frontend/js/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do CORS para permitir frontend local
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsing JSON
app.use(express.json());

// Instância da ApiService
const apiService = new ApiServiceClass();

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Endpoints da API Clientes

// GET /api/clientes - Listar todos os clientes
app.get('/api/clientes', async (req, res) => {
    try {
        console.log('Buscando todos os clientes...');
        const result = await apiService.getClientes();
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                count: result.data.length
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar clientes',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao buscar clientes',
            error: error.message
        });
    }
});

// GET /api/clientes/:id - Buscar cliente por ID
app.get('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Buscando cliente com ID: ${id}`);
        
        const result = await apiService.getCliente(parseInt(id));
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.error || 'Cliente não encontrado'
            });
        }
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao buscar cliente',
            error: error.message
        });
    }
});

// POST /api/clientes - Criar novo cliente
app.post('/api/clientes', async (req, res) => {
    try {
        const { 
            nome_completo, 
            telefone, 
            email, 
            data_nascimento, 
            genero, 
            status, 
            observacoes, 
            pontos_fidelidade 
        } = req.body;
        
        console.log('Criando novo cliente:', { nome_completo, telefone, email });
        
        // Validação básica
        if (!nome_completo || !telefone) {
            return res.status(400).json({
                success: false,
                message: 'Nome completo e telefone são obrigatórios'
            });
        }

        const novoCliente = {
            nome_completo,
            telefone,
            email: email || '',
            data_nascimento: data_nascimento || '',
            genero: genero || '',
            status: status || 'ativo',
            observacoes: observacoes || '',
            pontos_fidelidade: pontos_fidelidade || 0
        };

        const result = await apiService.criarCliente(novoCliente);
        
        if (result.success) {
            res.status(201).json({
                success: true,
                message: 'Cliente criado com sucesso',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || 'Erro ao criar cliente'
            });
        }
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao criar cliente',
            error: error.message
        });
    }
});

// PUT /api/clientes/:id - Atualizar cliente
app.put('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nome_completo, 
            telefone, 
            email, 
            data_nascimento, 
            genero, 
            status, 
            observacoes, 
            pontos_fidelidade 
        } = req.body;
        
        console.log(`Atualizando cliente ID: ${id}`, req.body);
        
        // Validação básica
        if (!nome_completo || !telefone) {
            return res.status(400).json({
                success: false,
                message: 'Nome completo e telefone são obrigatórios'
            });
        }

        const clienteAtualizado = {
            nome_completo,
            telefone,
            email: email || '',
            data_nascimento: data_nascimento || '',
            genero: genero || '',
            status: status || 'ativo',
            observacoes: observacoes || '',
            pontos_fidelidade: pontos_fidelidade || 0
        };

        const result = await apiService.atualizarCliente(parseInt(id), clienteAtualizado);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Cliente atualizado com sucesso',
                data: result.data
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.error || 'Cliente não encontrado para atualização'
            });
        }
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao atualizar cliente',
            error: error.message
        });
    }
});

// DELETE /api/clientes/:id - Excluir cliente
app.delete('/api/clientes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Excluindo cliente ID: ${id}`);
        
        const result = await apiService.excluirCliente(parseInt(id));
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Cliente excluído com sucesso',
                data: result.data
            });
        } else {
            res.status(404).json({
                success: false,
                message: result.error || 'Cliente não encontrado para exclusão'
            });
        }
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao excluir cliente',
            error: error.message
        });
    }
});

// GET /api/clientes/buscar - Busca com filtros
app.get('/api/clientes/buscar', async (req, res) => {
    try {
        const { nome, status } = req.query;
        console.log(`Buscando clientes com filtros:`, { nome, status });
        
        const filtros = {};
        if (nome) filtros.nome = nome;
        if (status && status !== 'todos') filtros.status = status;

        const result = await apiService.buscarClientes(filtros);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                count: result.data.length
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro na busca de clientes',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor na busca de clientes',
            error: error.message
        });
    }
});

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API está funcionando',
        timestamp: new Date().toISOString(),
        database: 'SQLite'
    });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// Middleware de tratamento de erros global
app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 API disponível em: http://localhost:${PORT}/api`);
    console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
    console.log(`👥 Clientes: http://localhost:${PORT}/api/clientes`);
});

export default app;