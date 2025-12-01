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
// ============================================
// MÉTODOS DA AGENDA - ADICIONAR AO ApiService
// ============================================

const ApiService = {
    // ... métodos existentes ...
    
    // ========== AGENDAMENTOS ==========
    /**
     * Listar agendamentos com filtros
     * @param {Object} filtros - { data, profissional_id, status, cliente_id }
     */
    getAgendamentos: async (filtros = {}) => {
        try {
            const params = new URLSearchParams();
            
            // Adicionar filtros como parâmetros de query
            Object.keys(filtros).forEach(key => {
                if (filtros[key] !== null && filtros[key] !== undefined) {
                    params.append(key, filtros[key]);
                }
            });
            
            const url = `/api/agendamentos${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao buscar agendamentos');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.getAgendamentos:', error);
            throw error;
        }
    },
    
    /**
     * Criar novo agendamento
     * @param {Object} dados - Dados do agendamento
     */
    criarAgendamento: async (dados) => {
        try {
            const response = await fetch('/api/agendamentos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao criar agendamento');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.criarAgendamento:', error);
            throw error;
        }
    },
    
    /**
     * Atualizar agendamento
     * @param {Number} id - ID do agendamento
     * @param {Object} dados - Dados atualizados
     */
    atualizarAgendamento: async (id, dados) => {
        try {
            const response = await fetch(`/api/agendamentos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao atualizar agendamento');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.atualizarAgendamento:', error);
            throw error;
        }
    },
    
    /**
     * Atualizar apenas status do agendamento
     * @param {Number} id - ID do agendamento
     * @param {String} status - Novo status
     */
    mudarStatusAgendamento: async (id, status) => {
        try {
            const response = await fetch(`/api/agendamentos/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao mudar status do agendamento');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.mudarStatusAgendamento:', error);
            throw error;
        }
    },
    
    /**
     * Cancelar/excluir agendamento (soft delete)
     * @param {Number} id - ID do agendamento
     */
    excluirAgendamento: async (id) => {
        try {
            const response = await fetch(`/api/agendamentos/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao excluir agendamento');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.excluirAgendamento:', error);
            throw error;
        }
    },
    
    /**
     * Buscar horários livres para um profissional
     * @param {Number} profissionalId - ID do profissional
     * @param {String} data - Data no formato YYYY-MM-DD
     */
    getHorariosLivres: async (profissionalId, data) => {
        try {
            const params = new URLSearchParams({
                profissional_id: profissionalId,
                data: data
            });
            
            const response = await fetch(`/api/agendamentos/disponibilidade/horarios?${params}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao buscar horários livres');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.getHorariosLivres:', error);
            throw error;
        }
    },
    
    /**
     * Verificar disponibilidade específica
     * @param {Number} profissionalId - ID do profissional
     * @param {String} dataHora - Data e hora no formato ISO
     * @param {Number} duracao - Duração em minutos
     */
    verificarDisponibilidade: async (profissionalId, dataHora, duracao) => {
        try {
            const params = new URLSearchParams({
                profissional_id: profissionalId,
                data_hora: dataHora,
                duracao: duracao
            });
            
            const response = await fetch(`/api/agendamentos/disponibilidade/verificar?${params}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao verificar disponibilidade');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.verificarDisponibilidade:', error);
            throw error;
        }
    },
    
    /**
     * Buscar serviços de um agendamento
     * @param {Number} agendamentoId - ID do agendamento
     */
    getServicosAgendamento: async (agendamentoId) => {
        try {
            const response = await fetch(`/api/agendamentos/${agendamentoId}/servicos`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao buscar serviços do agendamento');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.getServicosAgendamento:', error);
            throw error;
        }
    },
    
    /**
     * Buscar estatísticas do dia
     */
    getEstatisticasHoje: async () => {
        try {
            const response = await fetch('/api/agendamentos/estatisticas/hoje');
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao buscar estatísticas');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.getEstatisticasHoje:', error);
            throw error;
        }
    },
    
    // ========== BLOQUEIOS ==========
    /**
     * Listar bloqueios
     * @param {Object} filtros - { profissional_id, data_inicio, data_fim }
     */
    getBloqueios: async (filtros = {}) => {
        try {
            const params = new URLSearchParams();
            
            Object.keys(filtros).forEach(key => {
                if (filtros[key] !== null && filtros[key] !== undefined) {
                    params.append(key, filtros[key]);
                }
            });
            
            const url = `/api/bloqueios${params.toString() ? `?${params.toString()}` : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao buscar bloqueios');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.getBloqueios:', error);
            throw error;
        }
    },
    
    /**
     * Criar novo bloqueio
     * @param {Object} dados - Dados do bloqueio
     */
    criarBloqueio: async (dados) => {
        try {
            const response = await fetch('/api/bloqueios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dados)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao criar bloqueio');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.criarBloqueio:', error);
            throw error;
        }
    },
    
    /**
     * Remover bloqueio
     * @param {Number} id - ID do bloqueio
     */
    excluirBloqueio: async (id) => {
        try {
            const response = await fetch(`/api/bloqueios/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao excluir bloqueio');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.excluirBloqueio:', error);
            throw error;
        }
    },
    
    // ========== MÉTODOS AUXILIARES ==========
    /**
     * Buscar profissionais que realizam um serviço específico
     * @param {Number} servicoId - ID do serviço
     */
    getProfissionaisPorServico: async (servicoId) => {
        try {
            const response = await fetch(`/api/servicos/${servicoId}/profissionais`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao buscar profissionais do serviço');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.getProfissionaisPorServico:', error);
            throw error;
        }
    },
    
    /**
     * Buscar serviços de um profissional
     * @param {Number} profissionalId - ID do profissional
     */
    getServicosPorProfissional: async (profissionalId) => {
        try {
            const response = await fetch(`/api/profissionais/${profissionalId}/servicos`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao buscar serviços do profissional');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.getServicosPorProfissional:', error);
            throw error;
        }
    },
    
    /**
     * Buscar horários de trabalho de um profissional
     * @param {Number} profissionalId - ID do profissional
     */
    getHorariosTrabalho: async (profissionalId) => {
        try {
            const response = await fetch(`/api/profissionais/${profissionalId}/horarios-trabalho`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao buscar horários de trabalho');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.getHorariosTrabalho:', error);
            throw error;
        }
    },
    
    /**
     * Buscar estatísticas de um profissional
     * @param {Number} profissionalId - ID do profissional
     */
    getEstatisticasProfissional: async (profissionalId) => {
        try {
            const response = await fetch(`/api/profissionais/${profissionalId}/estatisticas`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao buscar estatísticas do profissional');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro no ApiService.getEstatisticasProfissional:', error);
            throw error;
        }
    }
};