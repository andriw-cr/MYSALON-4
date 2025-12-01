// frontend/js/api.js - VERSÃO CORRIGIDA
// CLIENTE HTTP PARA API DO BACKEND

class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        console.log('✅ ApiService inicializado - Conectando ao backend');
    }

    // Método genérico para requisições
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            console.log(`📡 Fazendo requisição: ${url}`);
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`❌ Erro na requisição ${endpoint}:`, error);
            throw error;
        }
    }

    // ========== CLIENTES ==========
    
    // GET - Listar todos os clientes
    async getClientes(filtros = {}) {
        const params = new URLSearchParams();
        if (filtros.search) params.append('search', filtros.search);
        if (filtros.status) params.append('status', filtros.status);
        
        const queryString = params.toString();
        const endpoint = queryString ? `/clientes?${queryString}` : '/clientes';
        
        console.log(`🔍 Buscando clientes: ${endpoint}`);
        return await this.request(endpoint);
    }

    // GET - Buscar cliente por ID
    async getCliente(id) {
        console.log(`🔍 Buscando cliente ID: ${id}`);
        return await this.request(`/clientes/${id}`);
    }

    // POST - Criar novo cliente
    async criarCliente(dadosCliente) {
        console.log(`➕ Criando novo cliente:`, dadosCliente);
        return await this.request('/clientes', {
            method: 'POST',
            body: JSON.stringify(dadosCliente)
        });
    }

    // PUT - Atualizar cliente
    async atualizarCliente(id, dadosCliente) {
        console.log(`✏️ Atualizando cliente ID ${id}:`, dadosCliente);
        return await this.request(`/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dadosCliente)
        });
    }

    // DELETE - Inativar cliente (CORRIGIDO: excluirCliente)
    async excluirCliente(id) {
        console.log(`🗑️ Inativando cliente ID: ${id}`);
        return await this.request(`/clientes/${id}`, {
            method: 'DELETE'
        });
    }

    // GET - Histórico de agendamentos do cliente
    async getAgendamentosCliente(id) {
        console.log(`📅 Buscando agendamentos do cliente ID: ${id}`);
        return await this.request(`/clientes/${id}/agendamentos`);
    }

    // GET - Estatísticas do cliente
    async getEstatisticasCliente(id) {
        console.log(`📊 Buscando estatísticas do cliente ID: ${id}`);
        return await this.request(`/clientes/${id}/estatisticas`);
    }

    // Health check
    async healthCheck() {
        try {
            console.log(`🏥 Verificando saúde da API...`);
            const result = await this.request('/health');
            return result;
        } catch (error) {
            console.warn('⚠️ API não está respondendo');
            return { status: 'error', message: 'API offline' };
        }
    }
}

// ========== PARTE IMPORTANTE ==========
// Criar UMA INSTÂNCIA global com os métodos que clientes.js espera
const apiServiceInstance = new ApiService();

// Disponibilizar a INSTÂNCIA globalmente COM OS MÉTODOS DIRETOS
window.ApiService = apiServiceInstance;  // <- Agora é uma instância com métodos

// Também disponibilizar como api para fácil acesso no console
window.api = apiServiceInstance;

// Teste automático de conexão
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔌 Testando conexão com o backend...');
    
    try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API do backend está respondendo:', data);
            
            // Teste adicional: verificar se as funções estão disponíveis
            console.log('🔍 Verificando funções do ApiService:');
            console.log('- ApiService type:', typeof window.ApiService);
            console.log('- getClientes:', typeof window.ApiService.getClientes);
            console.log('- criarCliente:', typeof window.ApiService.criarCliente);
            console.log('- getCliente:', typeof window.ApiService.getCliente);
            
            // Testar uma função
            try {
                const clientes = await window.ApiService.getClientes();
                console.log('✅ Teste getClientes funcionou:', clientes?.data?.length, 'clientes');
            } catch (testError) {
                console.error('❌ Teste getClientes falhou:', testError);
            }
        } else {
            console.warn('⚠️ API do backend retornou erro:', response.status);
        }
    } catch (error) {
        console.error('❌ Não foi possível conectar à API:', error.message);
    }
});

// Adicionar CSS para mensagens flutuantes
const style = document.createElement('style');
style.textContent = `
.mensagem-flutuante {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
    display: flex;
    align-items: center;
    gap: 8px;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;
document.head.appendChild(style);