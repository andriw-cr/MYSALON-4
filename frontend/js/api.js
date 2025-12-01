// frontend/js/api.js - VERSÃO CORRIGIDA E UNIFICADA
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
    
    async getClientes(filtros = {}) {
        const params = new URLSearchParams();
        if (filtros.search) params.append('search', filtros.search);
        if (filtros.status) params.append('status', filtros.status);
        
        const queryString = params.toString();
        const endpoint = queryString ? `/clientes?${queryString}` : '/clientes';
        
        console.log(`🔍 Buscando clientes: ${endpoint}`);
        return await this.request(endpoint);
    }

    async getCliente(id) {
        console.log(`🔍 Buscando cliente ID: ${id}`);
        return await this.request(`/clientes/${id}`);
    }

    async criarCliente(dadosCliente) {
        console.log(`➕ Criando novo cliente:`, dadosCliente);
        return await this.request('/clientes', {
            method: 'POST',
            body: JSON.stringify(dadosCliente)
        });
    }

    async atualizarCliente(id, dadosCliente) {
        console.log(`✏️ Atualizando cliente ID ${id}:`, dadosCliente);
        return await this.request(`/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dadosCliente)
        });
    }

    async excluirCliente(id) {
        console.log(`🗑️ Inativando cliente ID: ${id}`);
        return await this.request(`/clientes/${id}`, {
            method: 'DELETE'
        });
    }

    async getAgendamentosCliente(id) {
        console.log(`📅 Buscando agendamentos do cliente ID: ${id}`);
        return await this.request(`/clientes/${id}/agendamentos`);
    }

    async getEstatisticasCliente(id) {
        console.log(`📊 Buscando estatísticas do cliente ID: ${id}`);
        return await this.request(`/clientes/${id}/estatisticas`);
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
        
        console.log(`📅 Buscando agendamentos: ${endpoint}`);
        return await this.request(endpoint);
    }

    async criarAgendamento(dados) {
        console.log(`➕ Criando novo agendamento:`, dados);
        return await this.request('/agendamentos', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    async atualizarAgendamento(id, dados) {
        console.log(`✏️ Atualizando agendamento ID ${id}:`, dados);
        return await this.request(`/agendamentos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    }

    async mudarStatusAgendamento(id, status) {
        console.log(`🔄 Mudando status do agendamento ${id} para: ${status}`);
        return await this.request(`/agendamentos/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    async excluirAgendamento(id) {
        console.log(`🗑️ Excluindo agendamento ID: ${id}`);
        return await this.request(`/agendamentos/${id}`, {
            method: 'DELETE'
        });
    }

    async getHorariosLivres(profissionalId, data) {
        const params = new URLSearchParams({
            profissional_id: profissionalId,
            data: data
        });
        
        const endpoint = `/agendamentos/disponibilidade/horarios?${params}`;
        console.log(`🕐 Buscando horários livres: ${endpoint}`);
        return await this.request(endpoint);
    }

    async verificarDisponibilidade(profissionalId, dataHora, duracao) {
        const params = new URLSearchParams({
            profissional_id: profissionalId,
            data_hora: dataHora,
            duracao: duracao
        });
        
        const endpoint = `/agendamentos/disponibilidade/verificar?${params}`;
        console.log(`✅ Verificando disponibilidade: ${endpoint}`);
        return await this.request(endpoint);
    }

    async getServicosAgendamento(agendamentoId) {
        console.log(`🔍 Buscando serviços do agendamento ID: ${agendamentoId}`);
        return await this.request(`/agendamentos/${agendamentoId}/servicos`);
    }

    async getEstatisticasHoje() {
        console.log(`📊 Buscando estatísticas do dia`);
        return await this.request('/agendamentos/estatisticas/hoje');
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
        
        console.log(`🚫 Buscando bloqueios: ${endpoint}`);
        return await this.request(endpoint);
    }

    async criarBloqueio(dados) {
        console.log(`➕ Criando novo bloqueio:`, dados);
        return await this.request('/bloqueios', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    async excluirBloqueio(id) {
        console.log(`🗑️ Removendo bloqueio ID: ${id}`);
        return await this.request(`/bloqueios/${id}`, {
            method: 'DELETE'
        });
    }

    // ========== PROFISSIONAIS ==========
    
    async getProfissionais() {
        console.log(`👨‍💼 Buscando profissionais`);
        return await this.request('/profissionais');
    }

    async getProfissional(id) {
        console.log(`🔍 Buscando profissional ID: ${id}`);
        return await this.request(`/profissionais/${id}`);
    }

    async getServicosPorProfissional(profissionalId) {
        console.log(`💇 Buscando serviços do profissional ID: ${profissionalId}`);
        return await this.request(`/profissionais/${profissionalId}/servicos`);
    }

    async getHorariosTrabalho(profissionalId) {
        console.log(`🕐 Buscando horários de trabalho do profissional ID: ${profissionalId}`);
        return await this.request(`/profissionais/${profissionalId}/horarios-trabalho`);
    }

    async getEstatisticasProfissional(profissionalId) {
        console.log(`📊 Buscando estatísticas do profissional ID: ${profissionalId}`);
        return await this.request(`/profissionais/${profissionalId}/estatisticas`);
    }

    // ========== SERVIÇOS ==========
    
    async getServicos() {
        console.log(`💇 Buscando serviços`);
        return await this.request('/servicos');
    }

    async getServico(id) {
        console.log(`🔍 Buscando serviço ID: ${id}`);
        return await this.request(`/servicos/${id}`);
    }

    async getProfissionaisPorServico(servicoId) {
        console.log(`👨‍💼 Buscando profissionais do serviço ID: ${servicoId}`);
        return await this.request(`/servicos/${servicoId}/profissionais`);
    }

    // ========== UTILITÁRIOS ==========
    
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

// ========== EXPORTAÇÃO GLOBAL ==========
// Criar UMA ÚNICA instância
const apiServiceInstance = new ApiService();

// Disponibilizar a instância globalmente
window.ApiService = apiServiceInstance;
window.api = apiServiceInstance;  // Alias para console

// Teste automático de conexão
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔌 Testando conexão com o backend...');
    
    try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API do backend está respondendo:', data);
            
            // Verificar se os métodos estão disponíveis
            console.log('🔍 Verificando funções do ApiService:');
            console.log('- getAgendamentos:', typeof window.ApiService.getAgendamentos);
            console.log('- getProfissionais:', typeof window.ApiService.getProfissionais);
            console.log('- getServicos:', typeof window.ApiService.getServicos);
            
            // Testar rapidamente as APIs da agenda
            try {
                const profissionais = await window.ApiService.getProfissionais();
                console.log('✅ Teste getProfissionais funcionou:', profissionais?.length || '0', 'profissionais');
            } catch (error) {
                console.warn('⚠️ getProfissionais falhou:', error.message);
            }
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