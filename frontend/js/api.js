// frontend/js/api.js - VERSÃO COMPLETA COM MÉTODOS DE PROFISSIONAIS
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

    // ========== PROFISSIONAIS - MÉTODOS COMPLETOS ==========
    
    async getProfissionais(filtros = {}) {
        const params = new URLSearchParams();
        
        Object.keys(filtros).forEach(key => {
            if (filtros[key] !== null && filtros[key] !== undefined) {
                params.append(key, filtros[key]);
            }
        });
        
        const queryString = params.toString();
        const endpoint = `/profissionais${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    async getProfissional(id) {
        try {
            console.log(`👤 Buscando profissional ${id}`);
            const response = await this.request(`/profissionais/${id}`);
            return response;
        } catch (error) {
            console.error('❌ Erro ao buscar profissional:', error);
            throw error;
        }
    }

    async criarProfissional(dadosProfissional) {
        try {
            console.log('📝 Criando profissional:', dadosProfissional);
            const response = await this.request('/profissionais', {
                method: 'POST',
                body: JSON.stringify(dadosProfissional)
            });
            return response;
        } catch (error) {
            console.error('❌ Erro ao criar profissional:', error);
            throw error;
        }
    }

    async atualizarProfissional(id, dadosProfissional) {
        try {
            console.log(`✏️ Atualizando profissional ${id}:`, dadosProfissional);
            const response = await this.request(`/profissionais/${id}`, {
                method: 'PUT',
                body: JSON.stringify(dadosProfissional)
            });
            return response;
        } catch (error) {
            console.error('❌ Erro ao atualizar profissional:', error);
            throw error;
        }
    }

    async inativarProfissional(id) {
        try {
            console.log(`🚫 Inativando profissional ${id}`);
            const response = await this.request(`/profissionais/${id}`, {
                method: 'DELETE'
            });
            return response;
        } catch (error) {
            console.error('❌ Erro ao inativar profissional:', error);
            throw error;
        }
    }

    async reativarProfissional(id) {
        try {
            console.log(`🔄 Reativando profissional ${id}`);
            const response = await this.request(`/profissionais/${id}/reativar`, {
                method: 'PATCH'
            });
            return response;
        } catch (error) {
            console.error('❌ Erro ao reativar profissional:', error);
            throw error;
        }
    }

    async getProfissionaisAtivos() {
        try {
            console.log('👥 Buscando profissionais ativos');
            const response = await this.request('/profissionais/ativos');
            return response;
        } catch (error) {
            console.error('❌ Erro ao buscar profissionais ativos:', error);
            return [];
        }
    }

    async getServicosPorProfissional(profissionalId) {
        try {
            console.log(`✂️ Buscando serviços do profissional ${profissionalId}`);
            const response = await this.request(`/profissionais/${profissionalId}/servicos`);
            return response;
        } catch (error) {
            console.error('❌ Erro ao buscar serviços do profissional:', error);
            return [];
        }
    }

    async getAgendamentosProfissional(profissionalId) {
        try {
            console.log(`📅 Buscando agendamentos do profissional ${profissionalId}`);
            const response = await this.request(`/profissionais/${profissionalId}/agendamentos`);
            return response;
        } catch (error) {
            console.error('❌ Erro ao buscar agendamentos do profissional:', error);
            return [];
        }
    }

    async getHorariosTrabalho(profissionalId) {
        try {
            console.log(`🕐 Buscando horários do profissional ${profissionalId}`);
            const response = await this.request(`/profissionais/${profissionalId}/horarios-trabalho`);
            return response;
        } catch (error) {
            console.error('❌ Erro ao buscar horários do profissional:', error);
            // Retornar horários padrão em caso de erro
            return {
                segunda: { inicio: '08:00', fim: '18:00', disponivel: true },
                terca: { inicio: '08:00', fim: '18:00', disponivel: true },
                quarta: { inicio: '08:00', fim: '18:00', disponivel: true },
                quinta: { inicio: '08:00', fim: '18:00', disponivel: true },
                sexta: { inicio: '08:00', fim: '18:00', disponivel: true },
                sabado: { inicio: '08:00', fim: '13:00', disponivel: true },
                domingo: { inicio: null, fim: null, disponivel: false }
            };
        }
    }

    async getEstatisticasProfissional(profissionalId) {
        try {
            console.log(`📊 Buscando estatísticas do profissional ${profissionalId}`);
            const response = await this.request(`/profissionais/${profissionalId}/estatisticas`);
            return response;
        } catch (error) {
            console.error('❌ Erro ao buscar estatísticas do profissional:', error);
            return {
                total_agendamentos: 0,
                concluidos: 0,
                cancelados: 0,
                valor_medio: 0,
                faturamento_total: 0
            };
        }
    }

    // ========== SERVIÇOS - MÉTODOS COMPLETOS ==========
    
    async getServicos(filtros = {}) {
        const params = new URLSearchParams();
        
        Object.keys(filtros).forEach(key => {
            if (filtros[key] !== null && filtros[key] !== undefined) {
                params.append(key, filtros[key]);
            }
        });
        
        const queryString = params.toString();
        const endpoint = `/servicos${queryString ? `?${queryString}` : ''}`;
        
        return await this.request(endpoint);
    }

    async getServico(id) {
        try {
            console.log(`🔍 Buscando serviço ${id}`);
            const response = await this.request(`/servicos/${id}`);
            return response;
        } catch (error) {
            console.error('❌ Erro ao buscar serviço:', error);
            throw error;
        }
    }

    async getProfissionaisPorServico(servicoId) {
        try {
            console.log(`👥 Buscando profissionais do serviço ${servicoId}`);
            const response = await this.request(`/servicos/${servicoId}/profissionais`);
            return response;
        } catch (error) {
            console.error('❌ Erro ao buscar profissionais do serviço:', error);
            return [];
        }
    }

    async criarServico(dadosServico) {
        try {
            console.log('📝 Criando serviço:', dadosServico);
            const response = await this.request('/servicos', {
                method: 'POST',
                body: JSON.stringify(dadosServico)
            });
            return response;
        } catch (error) {
            console.error('❌ Erro ao criar serviço:', error);
            throw error;
        }
    }

    async atualizarServico(id, dadosServico) {
        try {
            console.log(`✏️ Atualizando serviço ${id}:`, dadosServico);
            const response = await this.request(`/servicos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(dadosServico)
            });
            return response;
        } catch (error) {
            console.error('❌ Erro ao atualizar serviço:', error);
            throw error;
        }
    }

    async inativarServico(id) {
        try {
            console.log(`🚫 Inativando serviço ${id}`);
            const response = await this.request(`/servicos/${id}/inativar`, {
                method: 'PATCH'
            });
            return response;
        } catch (error) {
            console.error('❌ Erro ao inativar serviço:', error);
            throw error;
        }
    }

    async reativarServico(id) {
        try {
            console.log(`🔄 Reativando serviço ${id}`);
            const response = await this.request(`/servicos/${id}/reativar`, {
                method: 'PATCH'
            });
            return response;
        } catch (error) {
            console.error('❌ Erro ao reativar serviço:', error);
            throw error;
        }
    }

    async getCategorias() {
        try {
            console.log('🏷️ Buscando categorias de serviços');
            const response = await this.request('/servicos/categorias');
            return response;
        } catch (error) {
            console.error('❌ Erro ao buscar categorias:', error);
            return { success: false, data: [] };
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

    // ========== CLIENTES ==========
    
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

    // ========== TESTES ESPECÍFICOS ==========
    
    async testProfissionais() {
        try {
            console.log('🧪 Testando endpoints de profissionais...');
            
            // Testar listagem
            const lista = await this.getProfissionais();
            console.log('✅ Lista de profissionais:', lista?.length || 0);
            
            // Testar endpoint de teste do backend
            const teste = await this.request('/profissionais/test/health');
            console.log('✅ Teste de saúde:', teste);
            
            // Verificar métodos disponíveis
            console.log('🔍 Métodos de profissionais disponíveis:');
            console.log('- getProfissionais:', typeof this.getProfissionais);
            console.log('- criarProfissional:', typeof this.criarProfissional);
            console.log('- atualizarProfissional:', typeof this.atualizarProfissional);
            console.log('- inativarProfissional:', typeof this.inativarProfissional);
            console.log('- reativarProfissional:', typeof this.reativarProfissional);
            console.log('- getProfissionaisAtivos:', typeof this.getProfissionaisAtivos);
            
            return {
                success: true,
                listaCount: lista?.length || 0,
                testeBackend: teste
            };
        } catch (error) {
            console.error('❌ Teste de profissionais falhou:', error);
            return {
                success: false,
                error: error.message
            };
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
console.log('👤 Métodos de profissionais disponíveis globalmente:');
console.log('- ApiService.criarProfissional:', typeof window.ApiService.criarProfissional);
console.log('- ApiService.atualizarProfissional:', typeof window.ApiService.atualizarProfissional);
console.log('- ApiService.getProfissionaisAtivos:', typeof window.ApiService.getProfissionaisAtivos);

// Teste automático de conexão ao carregar
setTimeout(async () => {
    console.log('🔌 Testando conexão com backend...');
    
    try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API do backend está respondendo:', data);
            
            // Testar endpoints de profissionais
            try {
                const testeProfissionais = await apiServiceInstance.testProfissionais();
                console.log('🧪 Resultado do teste de profissionais:', testeProfissionais);
                
                if (testeProfissionais.success) {
                    console.log(`✅ Sistema de profissionais: ${testeProfissionais.listaCount} profissionais carregados`);
                } else {
                    console.warn('⚠️ Sistema de profissionais pode não estar totalmente funcional');
                }
            } catch (testError) {
                console.warn('⚠️ Não foi possível testar endpoints de profissionais:', testError.message);
            }
            
        } else {
            console.warn('⚠️ API do backend retornou erro:', response.status);
        }
    } catch (error) {
        console.error('❌ Não foi possível conectar à API:', error.message);
        console.log('💡 Verifique se o backend está rodando em http://localhost:3000');
    }
}, 1000);