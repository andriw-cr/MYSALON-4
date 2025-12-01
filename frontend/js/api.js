// frontend/js/api.js - VERSÃO CORRIGIDA E FINAL
// CLIENTE HTTP PARA API DO BACKEND

class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        console.log('✅ ApiService inicializado - Base URL:', this.baseURL);
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
            console.log(`📡 API Request: ${url}`, options.method || 'GET');
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error ${response.status}:`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log(`✅ API Response ${endpoint}:`, data?.length || 'data received');
            return data;
        } catch (error) {
            console.error(`❌ Request Error ${endpoint}:`, error);
            throw error;
        }
    }

    // ========== AGENDAMENTOS ==========
    
    async getAgendamentos(filtros = {}) {
        const params = new URLSearchParams();
        
        Object.keys(filtros).forEach(key => {
            if (filtros[key] !== null && filtros[key] !== undefined) {
                params.append(key, filtros[key]);
            }
        });
        
        const queryString = params.toString();
        const endpoint = `/agendamentos${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    async criarAgendamento(dados) {
        return await this.request('/agendamentos', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    async atualizarAgendamento(id, dados) {
        return await this.request(`/agendamentos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    }

    async mudarStatusAgendamento(id, status) {
        return await this.request(`/agendamentos/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    async excluirAgendamento(id) {
        return await this.request(`/agendamentos/${id}`, {
            method: 'DELETE'
        });
    }

    async getHorariosLivres(profissionalId, data) {
        const params = new URLSearchParams({
            profissional_id: profissionalId,
            data: data
        });
        
        return await this.request(`/agendamentos/disponibilidade/horarios?${params}`);
    }

    async verificarDisponibilidade(profissionalId, dataHora, duracao) {
        const params = new URLSearchParams({
            profissional_id: profissionalId,
            data_hora: dataHora,
            duracao: duracao
        });
        
        return await this.request(`/agendamentos/disponibilidade/verificar?${params}`);
    }

    async getServicosAgendamento(agendamentoId) {
        return await this.request(`/agendamentos/${agendamentoId}/servicos`);
    }

    async getEstatisticasHoje() {
        return await this.request('/agendamentos/estatisticas/hoje');
    }

    // ========== PROFISSIONAIS ==========
    
    async getProfissionais() {
        return await this.request('/profissionais');
    }

    async getProfissional(id) {
        return await this.request(`/profissionais/${id}`);
    }

    async getServicosPorProfissional(profissionalId) {
        return await this.request(`/profissionais/${profissionalId}/servicos`);
    }

    async getHorariosTrabalho(profissionalId) {
        return await this.request(`/profissionais/${profissionalId}/horarios-trabalho`);
    }

    async getEstatisticasProfissional(profissionalId) {
        return await this.request(`/profissionais/${profissionalId}/estatisticas`);
    }

    // ========== SERVIÇOS ==========
    
    async getServicos() {
        return await this.request('/servicos');
    }

    async getServico(id) {
        return await this.request(`/servicos/${id}`);
    }

    async getProfissionaisPorServico(servicoId) {
        return await this.request(`/servicos/${servicoId}/profissionais`);
    }

    // ========== BLOQUEIOS ==========
    
    async getBloqueios(filtros = {}) {
        const params = new URLSearchParams();
        
        Object.keys(filtros).forEach(key => {
            if (filtros[key] !== null && filtros[key] !== undefined) {
                params.append(key, filtros[key]);
            }
        });
        
        const queryString = params.toString();
        const endpoint = `/bloqueios${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    async criarBloqueio(dados) {
        return await this.request('/bloqueios', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    async excluirBloqueio(id) {
        return await this.request(`/bloqueios/${id}`, {
            method: 'DELETE'
        });
    }

    // ========== CLIENTES (mantido para compatibilidade) ==========
    
    async getClientes(filtros = {}) {
        const params = new URLSearchParams();
        if (filtros.search) params.append('search', filtros.search);
        if (filtros.status) params.append('status', filtros.status);
        
        const queryString = params.toString();
        const endpoint = queryString ? `/clientes?${queryString}` : '/clientes';
        
        return await this.request(endpoint);
    }

    async getCliente(id) {
        return await this.request(`/clientes/${id}`);
    }

    async criarCliente(dadosCliente) {
        return await this.request('/clientes', {
            method: 'POST',
            body: JSON.stringify(dadosCliente)
        });
    }

    async atualizarCliente(id, dadosCliente) {
        return await this.request(`/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dadosCliente)
        });
    }

    async excluirCliente(id) {
        return await this.request(`/clientes/${id}`, {
            method: 'DELETE'
        });
    }

    async getAgendamentosCliente(id) {
        return await this.request(`/clientes/${id}/agendamentos`);
    }

    async getEstatisticasCliente(id) {
        return await this.request(`/clientes/${id}/estatisticas`);
    }

    // ========== HEALTH CHECK ==========
    
    async healthCheck() {
        try {
            const result = await this.request('/health');
            return result;
        } catch (error) {
            console.warn('⚠️ API não está respondendo:', error.message);
            return { status: 'error', message: 'API offline' };
        }
    }
}

// ========== EXPORTAÇÃO GLOBAL ==========
// Criar UMA ÚNICA instância global
const apiServiceInstance = new ApiService();

// Disponibilizar a instância globalmente com múltiplas referências
window.ApiService = apiServiceInstance;
window.apiService = apiServiceInstance;
window.api = apiServiceInstance; // Alias para console

console.log('🌐 ApiService global registrado:', typeof window.ApiService);

// Teste automático de conexão ao carregar
setTimeout(async () => {
    console.log('🔌 Testando conexão com backend...');
    
    try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API do backend está respondendo:', data);
            
            // Verificar métodos básicos
            console.log('🔍 Métodos ApiService disponíveis:');
            console.log('- getProfissionais:', typeof window.ApiService.getProfissionais);
            console.log('- getServicos:', typeof window.ApiService.getServicos);
            console.log('- getAgendamentos:', typeof window.ApiService.getAgendamentos);
            
        } else {
            console.warn('⚠️ API do backend retornou erro:', response.status);
        }
    } catch (error) {
        console.error('❌ Não foi possível conectar à API:', error.message);
        console.log('💡 Verifique se o backend está rodando em http://localhost:3000');
    }
}, 1000);