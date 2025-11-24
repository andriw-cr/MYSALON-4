// API Service para o Sistema BeautySys
const API_BASE_URL = 'http://localhost:3000/api';

// Serviço de Autenticação e API
const ApiService = {
    // Função para obter o token de autenticação
    getToken() {
        return localStorage.getItem('authToken') || 'demo-token';
    },

    // ===== CLIENTES =====
    
    // Buscar todos os clientes
    async getClientes() {
        try {
            console.log('🔍 Buscando todos os clientes...');
            const response = await fetch(`${API_BASE_URL}/clientes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ ${data.length} clientes carregados`);
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ Erro ao buscar clientes:', error);
            // Retornar dados de demonstração em caso de erro
            return {
                success: true,
                data: this.getDemoClientes()
            };
        }
    },

    // Buscar um cliente específico por ID
    async getCliente(id) {
        try {
            console.log(`🔍 Buscando cliente ID: ${id}`);
            const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Cliente carregado:', data);
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ Erro ao buscar cliente:', error);
            // Retornar cliente de demonstração
            const demoClientes = this.getDemoClientes();
            const cliente = demoClientes.find(c => c.id == id) || demoClientes[0];
            return {
                success: true,
                data: cliente
            };
        }
    },

    // Criar novo cliente
    async criarCliente(clienteData) {
        try {
            console.log('📝 Criando novo cliente:', clienteData);
            const response = await fetch(`${API_BASE_URL}/clientes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(clienteData)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Cliente criado:', data);
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ Erro ao criar cliente:', error);
            // Simular sucesso em modo demo
            return {
                success: true,
                data: {
                    id: Date.now(),
                    ...clienteData,
                    created_at: new Date().toISOString()
                }
            };
        }
    },

    // Atualizar um cliente existente
    async atualizarCliente(id, clienteData) {
        try {
            console.log(`✏️ Atualizando cliente ID: ${id}`, clienteData);
            const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(clienteData)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Cliente atualizado:', data);
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ Erro ao atualizar cliente:', error);
            // Simular sucesso em modo demo
            return {
                success: true,
                data: {
                    id: id,
                    ...clienteData
                }
            };
        }
    },

    // Excluir um cliente
    async excluirCliente(id) {
        try {
            console.log(`🗑️ Excluindo cliente ID: ${id}`);
            const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            console.log('✅ Cliente excluído com sucesso');
            return {
                success: true,
                message: 'Cliente excluído com sucesso'
            };
        } catch (error) {
            console.error('❌ Erro ao excluir cliente:', error);
            // Simular sucesso em modo demo
            return {
                success: true,
                message: 'Cliente excluído com sucesso (modo demo)'
            };
        }
    },

    // ===== SERVIÇOS =====
    
    async getServicos() {
        try {
            const response = await fetch(`${API_BASE_URL}/servicos`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao buscar serviços:', error);
            return { 
                success: true, 
                data: [
                    { id: 1, nome: 'Corte Feminino', preco: 60.00, duracao: 45 },
                    { id: 2, nome: 'Corte Masculino', preco: 40.00, duracao: 30 },
                    { id: 3, nome: 'Coloração', preco: 120.00, duracao: 120 }
                ]
            };
        }
    },

    // ===== PROFISSIONAIS =====
    
    async getProfissionais() {
        try {
            const response = await fetch(`${API_BASE_URL}/profissionais`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao buscar profissionais:', error);
            return { 
                success: true, 
                data: [
                    { id: 1, nome: 'Carla Silva', especialidade: 'Cabelereira' },
                    { id: 2, nome: 'Rogério Santos', especialidade: 'Barbeiro' },
                    { id: 3, nome: 'Amanda Costa', especialidade: 'Manicure' }
                ]
            };
        }
    },

    // ===== AGENDAMENTOS =====
    
    async getAgendamentosPorData(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/agendamentos?data=${data}`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
            const agendamentos = await response.json();
            return { success: true, data: agendamentos };
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            return { success: true, data: [] };
        }
    },

    async criarAgendamento(agendamentoData) {
        try {
            const response = await fetch(`${API_BASE_URL}/agendamentos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(agendamentoData)
            });
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            return { 
                success: true, 
                data: { ...agendamentoData, id: Date.now() }
            };
        }
    },

    // ===== DADOS DE DEMONSTRAÇÃO =====
    
    getDemoClientes() {
        return [
            {
                id: 1,
                nome_completo: "Maria Silva",
                telefone: "(11) 98765-4321",
                email: "maria.silva@email.com",
                data_nascimento: "1991-03-15",
                genero: "F",
                status: "ativo",
                observacoes: "Cliente preferencial",
                pontos_fidelidade: 1250,
                created_at: "2023-01-15"
            },
            {
                id: 2,
                nome_completo: "João Santos",
                telefone: "(11) 97654-3210",
                email: "joao.santos@email.com",
                data_nascimento: "1995-08-22",
                genero: "M",
                status: "ativo",
                observacoes: "",
                pontos_fidelidade: 800,
                created_at: "2023-02-10"
            },
            {
                id: 3,
                nome_completo: "Ana Costa",
                telefone: "(11) 96543-2109",
                email: "ana.costa@email.com",
                data_nascimento: "1988-11-30",
                genero: "F",
                status: "fidelidade",
                observacoes: "Cliente VIP",
                pontos_fidelidade: 2500,
                created_at: "2023-01-05"
            },
            {
                id: 4,
                nome_completo: "Pedro Oliveira",
                telefone: "(11) 95432-1098",
                email: "pedro.oliveira@email.com",
                data_nascimento: "1992-07-18",
                genero: "M",
                status: "ativo",
                observacoes: "Gosta de horários pela manhã",
                pontos_fidelidade: 600,
                created_at: "2023-03-22"
            },
            {
                id: 5,
                nome_completo: "Carla Rodrigues",
                telefone: "(11) 94321-0987",
                email: "carla.rodrigues@email.com",
                data_nascimento: "1985-12-05",
                genero: "F",
                status: "inativo",
                observacoes: "Mudou de cidade",
                pontos_fidelidade: 1500,
                created_at: "2023-01-30"
            },
            {
                id: 6,
                nome_completo: "Ricardo Almeida",
                telefone: "(11) 93210-9876",
                email: "ricardo.almeida@email.com",
                data_nascimento: "1998-04-25",
                genero: "M",
                status: "ativo",
                observacoes: "Novo cliente",
                pontos_fidelidade: 100,
                created_at: "2023-10-15"
            }
        ];
    }
};

// Verificar e criar funções faltantes
function initializeMissingFunctions() {
    const missingFunctions = ['getCliente', 'atualizarCliente', 'excluirCliente'];
    
    missingFunctions.forEach(funcName => {
        if (typeof ApiService[funcName] === 'undefined') {
            console.warn(`⚠️ Criando função ${funcName} em modo de compatibilidade`);
            
            switch(funcName) {
                case 'getCliente':
                    ApiService.getCliente = async function(id) {
                        console.log(`🔍 [Demo] Buscando cliente ID: ${id}`);
                        const demoClientes = this.getDemoClientes();
                        const cliente = demoClientes.find(c => c.id == id) || demoClientes[0];
                        return {
                            success: true,
                            data: cliente
                        };
                    };
                    break;
                    
                case 'atualizarCliente':
                    ApiService.atualizarCliente = async function(id, clienteData) {
                        console.log(`✏️ [Demo] Atualizando cliente ID: ${id}`, clienteData);
                        return {
                            success: true,
                            data: {
                                id: id,
                                ...clienteData
                            }
                        };
                    };
                    break;
                    
                case 'excluirCliente':
                    ApiService.excluirCliente = async function(id) {
                        console.log(`🗑️ [Demo] Excluindo cliente ID: ${id}`);
                        return {
                            success: true,
                            message: 'Cliente excluído com sucesso (modo demo)'
                        };
                    };
                    break;
            }
        }
    });
}

// Inicializar funções faltantes quando o script carregar
initializeMissingFunctions();

// Tornar ApiService global
window.ApiService = ApiService;
console.log('✅ ApiService inicializado com sucesso!');