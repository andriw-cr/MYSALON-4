// profissionais-service.js
// Gerencia todas as chamadas de API para profissionais

const ProfissionaisService = {
    // Carregar todos os profissionais
    async getProfissionais() {
        try {
            showLoading();
            
            if (!window.ApiService || !window.ApiService.getProfissionais) {
                console.error('ApiService.getProfissionais não disponível');
                throw new Error('API Service não disponível');
            }
            
            const profissionais = await window.ApiService.getProfissionais();
            hideLoading();
            return profissionais;
        } catch (error) {
            console.error('Erro ao carregar profissionais:', error);
            showNotification('Erro ao carregar profissionais', 'error');
            hideLoading();
            
            // Se der erro 404, usar dados estáticos para teste
            if (error.message.includes('404')) {
                console.log('Usando dados estáticos para teste');
                return [
                    {
                        id: 1,
                        nome: 'Carla Silva',
                        especialidade: 'Cabeleireira',
                        funcao: 'Cabeleireira',
                        telefone: '(11) 98765-4321',
                        email: 'carla.silva@email.com',
                        cpf: '123.456.789-00',
                        comissao: '50',
                        status: 'ativo'
                    },
                    {
                        id: 2,
                        nome: 'Rogério Santos',
                        especialidade: 'Barbeiro',
                        funcao: 'Barbeiro',
                        telefone: '(11) 97654-3210',
                        email: 'rogerio.santos@email.com',
                        cpf: '987.654.321-00',
                        comissao: '40',
                        status: 'ativo'
                    },
                    {
                        id: 3,
                        nome: 'Amanda Costa',
                        especialidade: 'Manicure',
                        funcao: 'Manicure',
                        telefone: '(11) 96543-2109',
                        email: 'amanda.costa@email.com',
                        cpf: '456.789.123-00',
                        comissao: '45',
                        status: 'ferias'
                    }
                ];
            }
            
            throw error;
        }
    },

    // Buscar profissional por ID
    async getProfissional(id) {
        try {
            const profissional = await ApiService.getProfissional(id);
            return profissional;
        } catch (error) {
            console.error(`Erro ao carregar profissional ${id}:`, error);
            throw error;
        }
    },

    // Criar novo profissional
    async criarProfissional(data) {
        try {
            const formData = new FormData();
            
            // Adicionar campos básicos
            Object.keys(data).forEach(key => {
                if (key !== 'foto' && key !== 'horarios' && key !== 'servicos') {
                    formData.append(key, data[key]);
                }
            });
            
            // Adicionar foto se existir
            if (data.foto) {
                formData.append('foto', data.foto);
            }
            
            // Adicionar horários como JSON
            if (data.horarios) {
                formData.append('horarios', JSON.stringify(data.horarios));
            }
            
            // Adicionar serviços como JSON
            if (data.servicos) {
                formData.append('servicos', JSON.stringify(data.servicos));
            }
            
            const result = await ApiService.criarProfissional(formData);
            return result;
        } catch (error) {
            console.error('Erro ao criar profissional:', error);
            throw error;
        }
    },

    // Atualizar profissional
    async atualizarProfissional(id, data) {
        try {
            const formData = new FormData();
            
            // Adicionar campos básicos
            Object.keys(data).forEach(key => {
                if (key !== 'foto' && key !== 'horarios' && key !== 'servicos') {
                    formData.append(key, data[key]);
                }
            });
            
            // Adicionar foto se existir
            if (data.foto) {
                formData.append('foto', data.foto);
            }
            
            // Adicionar horários como JSON
            if (data.horarios) {
                formData.append('horarios', JSON.stringify(data.horarios));
            }
            
            // Adicionar serviços como JSON
            if (data.servicos) {
                formData.append('servicos', JSON.stringify(data.servicos));
            }
            
            const result = await ApiService.atualizarProfissional(id, formData);
            return result;
        } catch (error) {
            console.error(`Erro ao atualizar profissional ${id}:`, error);
            throw error;
        }
    },

    // Inativar profissional
    async inativarProfissional(id) {
        try {
            const result = await ApiService.inativarProfissional(id);
            return result;
        } catch (error) {
            console.error(`Erro ao inativar profissional ${id}:`, error);
            throw error;
        }
    },

    // Reativar profissional
    async reativarProfissional(id) {
        try {
            const result = await ApiService.reativarProfissional(id);
            return result;
        } catch (error) {
            console.error(`Erro ao reativar profissional ${id}:`, error);
            throw error;
        }
    },

    // Carregar serviços disponíveis
    async getServicos() {
        try {
            if (window.ApiService && window.ApiService.getServicos) {
                const servicos = await window.ApiService.getServicos();
                return servicos;
            }
            return [];
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            return [];
        }
    },

    // Carregar estatísticas
    async getEstatisticas() {
        try {
            if (window.ApiService && window.ApiService.getProfissionaisEstatisticas) {
                const estatisticas = await window.ApiService.getProfissionaisEstatisticas();
                return estatisticas;
            }
            return null;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            return null;
        }
    },

    // Carregar agendamentos do profissional
    async getAgendamentos(id) {
        try {
            if (window.ApiService && window.ApiService.getProfissionalAgendamentos) {
                const agendamentos = await window.ApiService.getProfissionalAgendamentos(id);
                return agendamentos;
            }
            return [];
        } catch (error) {
            console.error(`Erro ao carregar agendamentos do profissional ${id}:`, error);
            return [];
        }
    },

    // Upload de foto
    async uploadFoto(profissionalId, file) {
        try {
            const formData = new FormData();
            formData.append('foto', file);
            formData.append('profissional_id', profissionalId);
            
            // Chamada específica para upload de foto
            const response = await fetch(`/api/profissionais/${profissionalId}/foto`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Erro no upload');
            return await response.json();
        } catch (error) {
            console.error('Erro no upload de foto:', error);
            throw error;
        }
    },

    // Salvar horários de trabalho
    async salvarHorarios(profissionalId, horarios) {
        try {
            const response = await fetch(`/api/profissionais/${profissionalId}/horarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ horarios })
            });
            
            if (!response.ok) throw new Error('Erro ao salvar horários');
            return await response.json();
        } catch (error) {
            console.error('Erro ao salvar horários:', error);
            throw error;
        }
    },

    // Associar serviços ao profissional
    async associarServicos(profissionalId, servicosIds) {
        try {
            const response = await fetch(`/api/profissionais/${profissionalId}/servicos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ servicos: servicosIds })
            });
            
            if (!response.ok) throw new Error('Erro ao associar serviços');
            return await response.json();
        } catch (error) {
            console.error('Erro ao associar serviços:', error);
            throw error;
        }
    }
};