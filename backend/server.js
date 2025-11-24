import express from 'express';
import cors from 'cors';
import { ApiServiceClass } from './api.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do CORS para permitir frontend local
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
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
        const clientes = await apiService.getAllClientes();
        res.json({
            success: true,
            data: clientes,
            count: clientes.length
        });
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
        
        const cliente = await apiService.getClienteById(parseInt(id));
        
        if (cliente) {
            res.json({
                success: true,
                data: cliente
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
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
        const { nome, telefone, email, data_nascimento, observacoes } = req.body;
        console.log('Criando novo cliente:', { nome, telefone, email });
        
        // Validação básica
        if (!nome || !telefone) {
            return res.status(400).json({
                success: false,
                message: 'Nome e telefone são obrigatórios'
            });
        }

        const novoCliente = {
            nome,
            telefone,
            email: email || '',
            data_nascimento: data_nascimento || '',
            observacoes: observacoes || ''
        };

        const clienteId = await apiService.createCliente(novoCliente);
        
        res.status(201).json({
            success: true,
            message: 'Cliente criado com sucesso',
            data: { id: clienteId, ...novoCliente }
        });
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
        const { nome, telefone, email, data_nascimento, observacoes } = req.body;
        
        console.log(`Atualizando cliente ID: ${id}`, req.body);
        
        // Validação básica
        if (!nome || !telefone) {
            return res.status(400).json({
                success: false,
                message: 'Nome e telefone são obrigatórios'
            });
        }

        const clienteAtualizado = {
            nome,
            telefone,
            email: email || '',
            data_nascimento: data_nascimento || '',
            observacoes: observacoes || ''
        };

        const sucesso = await apiService.updateCliente(parseInt(id), clienteAtualizado);
        
        if (sucesso) {
            res.json({
                success: true,
                message: 'Cliente atualizado com sucesso',
                data: { id: parseInt(id), ...clienteAtualizado }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Cliente não encontrado para atualização'
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
        
        const sucesso = await apiService.deleteCliente(parseInt(id));
        
        if (sucesso) {
            res.json({
                success: true,
                message: 'Cliente excluído com sucesso'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Cliente não encontrado para exclusão'
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
        const { termo } = req.query;
        console.log(`Buscando clientes com termo: ${termo}`);
        
        if (!termo) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetro "termo" é obrigatório para busca'
            });
        }

        const clientes = await apiService.searchClientes(termo);
        
        res.json({
            success: true,
            data: clientes,
            count: clientes.length
        });
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
        timestamp: new Date().toISOString()
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
});

export default app;