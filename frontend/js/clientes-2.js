// Sistema de Gestão de Clientes - VERSÃO CORRIGIDA
class ClientesSystem {
    constructor() {
        console.log('🔄 Inicializando sistema de clientes...');
        this.clientes = [];
        this.init();
    }

    async init() {
        // Verificar se ApiService está disponível
        if (typeof ApiService === 'undefined') {
            console.error('❌ ApiService não está disponível');
            setTimeout(() => this.init(), 100);
            return;
        }

        // Aguardar um pouco para garantir que todas as funções estejam carregadas
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verificar funções de forma mais tolerante
        if (!this.verificarFuncoesApiTolerante()) {
            console.warn('⚠️ Algumas funções da API não estão disponíveis, usando modo de compatibilidade');
        }

        await this.initializeEventListeners();
        await this.carregarClientes();
        console.log('✅ Sistema de Clientes inicializado');
    }

    verificarFuncoesApiTolerante() {
        const funcoesEssenciais = ['getClientes', 'criarCliente'];
        const funcoesOpcionais = ['getCliente', 'atualizarCliente', 'excluirCliente'];
        
        const essenciaisFaltantes = funcoesEssenciais.filter(funcao => 
            typeof ApiService[funcao] !== 'function'
        );

        if (essenciaisFaltantes.length > 0) {
            console.error('❌ Funções essenciais da API faltantes:', essenciaisFaltantes);
            return false;
        }

        const opcionaisFaltantes = funcoesOpcionais.filter(funcao => 
            typeof ApiService[funcao] !== 'function'
        );

        if (opcionaisFaltantes.length > 0) {
            console.warn('⚠️ Funções opcionais da API faltantes:', opcionaisFaltantes);
            // Criar funções de fallback
            this.criarFallbacks(opcionaisFaltantes);
        }

        console.log('✅ Funções da API verificadas');
        return true;
    }

    criarFallbacks(funcoesFaltantes) {
        const self = this; // Guardar referência para usar dentro das funções
        
        funcoesFaltantes.forEach(funcao => {
            switch(funcao) {
                case 'getCliente':
                    if (typeof ApiService.getCliente === 'undefined') {
                        ApiService.getCliente = async function(id) {
                            console.log(`🔍 [Fallback] Buscando cliente ID: ${id}`);
                            try {
                                const clientesResponse = await ApiService.getClientes();
                                if (clientesResponse && clientesResponse.success) {
                                    const cliente = clientesResponse.data.find(c => c.id == id);
                                    if (cliente) {
                                        return {
                                            success: true,
                                            data: cliente
                                        };
                                    } else {
                                        return {
                                            success: false,
                                            error: 'Cliente não encontrado'
                                        };
                                    }
                                } else {
                                    // Buscar nos dados locais
                                    const clienteLocal = self.clientes.find(c => c.id == id);
                                    if (clienteLocal) {
                                        return {
                                            success: true,
                                            data: clienteLocal
                                        };
                                    }
                                    return {
                                        success: false,
                                        error: 'Erro ao carregar clientes'
                                    };
                                }
                            } catch (error) {
                                console.error('Erro no fallback getCliente:', error);
                                return {
                                    success: false,
                                    error: 'Erro ao buscar cliente'
                                };
                            }
                        };
                        console.log(`✅ Fallback criado para: ${funcao}`);
                    }
                    break;
                    
                case 'atualizarCliente':
                    if (typeof ApiService.atualizarCliente === 'undefined') {
                        ApiService.atualizarCliente = async function(id, clienteData) {
                            console.log(`✏️ [Fallback] Atualizando cliente ID: ${id}`, clienteData);
                            // Simular atualização local
                            const index = self.clientes.findIndex(c => c.id == id);
                            if (index !== -1) {
                                self.clientes[index] = { ...self.clientes[index], ...clienteData };
                                return {
                                    success: true,
                                    data: self.clientes[index]
                                };
                            } else {
                                return {
                                    success: false,
                                    error: 'Cliente não encontrado para atualização'
                                };
                            }
                        };
                        console.log(`✅ Fallback criado para: ${funcao}`);
                    }
                    break;
                    
                case 'excluirCliente':
                    if (typeof ApiService.excluirCliente === 'undefined') {
                        ApiService.excluirCliente = async function(id) {
                            console.log(`🗑️ [Fallback] Excluindo cliente ID: ${id}`);
                            // Simular exclusão local
                            const index = self.clientes.findIndex(c => c.id == id);
                            if (index !== -1) {
                                self.clientes.splice(index, 1);
                                return {
                                    success: true,
                                    message: 'Cliente excluído com sucesso (modo fallback)'
                                };
                            } else {
                                return {
                                    success: false,
                                    error: 'Cliente não encontrado para exclusão'
                                };
                            }
                        };
                        console.log(`✅ Fallback criado para: ${funcao}`);
                    }
                    break;
            }
        });
    }

    async initializeEventListeners() {
        try {
            // Aguardar elementos críticos com timeout
            await this.waitForElement('#btnNovoCliente', 3000);
            
            // Botão de novo cliente
            const btnNovoCliente = document.getElementById('btnNovoCliente');
            if (btnNovoCliente) {
                btnNovoCliente.addEventListener('click', () => {
                    this.abrirModalCliente();
                });
            }

            // Botão salvar no modal
            const btnSalvarCliente = document.getElementById('btnSalvarCliente');
            if (btnSalvarCliente) {
                btnSalvarCliente.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.salvarCliente();
                });
            }

            // Formulário de cliente
            const formCliente = document.getElementById('formCliente');
            if (formCliente) {
                formCliente.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.salvarCliente();
                });
            }

            // Fechar modal com Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.fecharModalCliente();
                }
            });

            console.log('✅ Event listeners inicializados');
        } catch (error) {
            console.error('❌ Erro ao inicializar event listeners:', error);
        }
    }

    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Elemento ${selector} não encontrado após ${timeout}ms`));
            }, timeout);
        });
    }

    async carregarClientes() {
        try {
            console.log('🔄 Carregando clientes da API...');
            const response = await ApiService.getClientes();
            
            if (response && response.success) {
                this.clientes = response.data || [];
                console.log(`✅ ${this.clientes.length} clientes carregados`);
                this.exibirClientes(this.clientes);
                this.atualizarEstatisticas();
            } else {
                console.error('❌ Erro na resposta da API:', response);
                this.mostrarMensagem('Erro ao carregar clientes', 'error');
                this.carregarDadosDemonstracao();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar clientes:', error);
            this.mostrarMensagem('Erro de conexão com o servidor', 'error');
            this.carregarDadosDemonstracao();
        }
    }

    carregarDadosDemonstracao() {
        console.log('🔄 Carregando dados de demonstração...');
        this.clientes = [
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
            }
        ];
        
        this.exibirClientes(this.clientes);
        this.atualizarEstatisticas();
        this.mostrarMensagem('Modo de demonstração ativado', 'info');
    }

    exibirClientes(clientes) {
        const tbody = document.querySelector('#tabelaClientes tbody');
        if (!tbody) {
            console.error('❌ Tabela de clientes não encontrada');
            return;
        }

        if (!clientes || clientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8 text-gray-500">
                        <i class="fas fa-users text-4xl mb-2 text-gray-300"></i>
                        <div>Nenhum cliente cadastrado</div>
                        <button id="btnNovoClienteEmpty" class="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                            <i class="fas fa-plus mr-2"></i>Cadastrar Primeiro Cliente
                        </button>
                    </td>
                </tr>
            `;

            // Adicionar event listener ao botão da tabela vazia
            const btnEmpty = document.getElementById('btnNovoClienteEmpty');
            if (btnEmpty) {
                btnEmpty.addEventListener('click', () => this.abrirModalCliente());
            }
            return;
        }

        tbody.innerHTML = clientes.map(cliente => `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-purple-600"></i>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${this.escapeHtml(cliente.nome_completo)}</div>
                            <div class="text-sm text-gray-500">${cliente.email ? this.escapeHtml(cliente.email) : 'Sem e-mail'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${cliente.telefone ? this.escapeHtml(cliente.telefone) : 'Não informado'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${cliente.genero === 'F' ? 'bg-pink-100 text-pink-800' : 
                          cliente.genero === 'M' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}">
                        ${cliente.genero === 'F' ? 'Feminino' : 
                         cliente.genero === 'M' ? 'Masculino' : 
                         'Outro'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${cliente.data_nascimento ? this.formatarData(cliente.data_nascimento) : 'Não informada'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${cliente.status === 'ativo' ? 'bg-green-100 text-green-800' : 
                          cliente.status === 'inativo' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}">
                        ${cliente.status === 'ativo' ? 'Ativo' : 
                         cliente.status === 'inativo' ? 'Inativo' : 
                         'Fidelidade'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${cliente.pontos_fidelidade || 0} pts
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="window.clientesSystem.editarCliente(${cliente.id})" 
                            class="text-purple-600 hover:text-purple-900 mr-3 px-3 py-1 rounded hover:bg-purple-50 transition-colors">
                        <i class="fas fa-edit mr-1"></i>Editar
                    </button>
                    <button onclick="window.clientesSystem.excluirCliente(${cliente.id})" 
                            class="text-red-600 hover:text-red-900 px-3 py-1 rounded hover:bg-red-50 transition-colors">
                        <i class="fas fa-trash mr-1"></i>Excluir
                    </button>
                </td>
            </tr>
        `).join('');

        console.log('✅ Tabela de clientes atualizada');
    }

    atualizarEstatisticas() {
        const totalClientes = this.clientes.length;
        const novosEsteMes = this.clientes.filter(cliente => {
            const dataCadastro = new Date(cliente.created_at || new Date());
            const hoje = new Date();
            return dataCadastro.getMonth() === hoje.getMonth() && 
                   dataCadastro.getFullYear() === hoje.getFullYear();
        }).length;

        const aniversariantes = this.clientes.filter(cliente => {
            if (!cliente.data_nascimento) return false;
            const nascimento = new Date(cliente.data_nascimento);
            const hoje = new Date();
            return nascimento.getMonth() === hoje.getMonth();
        }).length;

        const clientesFidelidade = this.clientes.filter(cliente => 
            cliente.status === 'fidelidade'
        ).length;

        // Atualizar elementos HTML
        this.atualizarElementoTexto('totalClientes', totalClientes);
        this.atualizarElementoTexto('novosClientes', novosEsteMes);
        this.atualizarElementoTexto('aniversariantes', aniversariantes);
        this.atualizarElementoTexto('clientesFidelidade', clientesFidelidade);
    }

    atualizarElementoTexto(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    }

    abrirModalCliente(cliente = null) {
        const modal = document.getElementById('clientModal');
        const titulo = document.getElementById('modalClienteTitle');
        const form = document.getElementById('formCliente');

        if (!modal || !titulo || !form) {
            console.error('❌ Elementos do modal não encontrados');
            this.mostrarMensagem('Erro ao abrir modal. Elementos não encontrados.', 'error');
            return;
        }

        if (cliente) {
            // Modo edição
            titulo.textContent = 'Editar Cliente';
            this.preencherFormulario(cliente);
        } else {
            // Modo novo
            titulo.textContent = 'Novo Cliente';
            form.reset();
            delete form.dataset.clienteId;
        }

        modal.classList.remove('hidden');
        
        // Focar no primeiro campo
        setTimeout(() => {
            const primeiroCampo = document.getElementById('nome_completo');
            if (primeiroCampo) {
                primeiroCampo.focus();
            }
        }, 100);
    }

    preencherFormulario(cliente) {
        const fields = {
            'nome_completo': cliente.nome_completo || '',
            'telefone': cliente.telefone || '',
            'email': cliente.email || '',
            'data_nascimento': cliente.data_nascimento || '',
            'genero': cliente.genero || '',
            'status': cliente.status || 'ativo',
            'observacoes': cliente.observacoes || ''
        };

        Object.keys(fields).forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.value = fields[field];
            }
        });

        // Guardar o ID do cliente para edição
        document.getElementById('formCliente').dataset.clienteId = cliente.id;
    }

    async salvarCliente() {
        const form = document.getElementById('formCliente');
        if (!form) {
            console.error('❌ Formulário não encontrado');
            this.mostrarMensagem('Erro: Formulário não encontrado', 'error');
            return;
        }

        const formData = new FormData(form);
        
        const clienteData = {
            nome_completo: formData.get('nome_completo')?.trim(),
            telefone: formData.get('telefone')?.trim(),
            email: formData.get('email')?.trim(),
            data_nascimento: formData.get('data_nascimento'),
            genero: formData.get('genero'),
            status: formData.get('status'),
            observacoes: formData.get('observacoes')?.trim()
        };

        // Validações
        if (!clienteData.nome_completo) {
            this.mostrarMensagem('Nome completo é obrigatório', 'error');
            document.getElementById('nome_completo').focus();
            return;
        }

        // Validar email se fornecido
        if (clienteData.email && !this.validarEmail(clienteData.email)) {
            this.mostrarMensagem('E-mail inválido', 'error');
            document.getElementById('email').focus();
            return;
        }

        try {
            let response;
            const clienteId = form.dataset.clienteId;

            console.log('💾 Salvando cliente...', clienteData);

            // Mostrar loading
            const btnSalvar = document.getElementById('btnSalvarCliente');
            const textoOriginal = btnSalvar.innerHTML;
            btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
            btnSalvar.disabled = true;

            if (clienteId) {
                // Editar cliente existente
                response = await ApiService.atualizarCliente(clienteId, clienteData);
            } else {
                // Criar novo cliente
                response = await ApiService.criarCliente(clienteData);
            }

            // Restaurar botão
            btnSalvar.innerHTML = textoOriginal;
            btnSalvar.disabled = false;

            if (response && response.success) {
                this.mostrarMensagem(
                    clienteId ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!', 
                    'success'
                );
                this.fecharModalCliente();
                await this.carregarClientes(); // Recarregar lista
            } else {
                this.mostrarMensagem(response?.error || 'Erro ao salvar cliente', 'error');
            }

        } catch (error) {
            console.error('❌ Erro ao salvar cliente:', error);
            this.mostrarMensagem('Erro de conexão com o servidor', 'error');
            
            // Restaurar botão em caso de erro
            const btnSalvar = document.getElementById('btnSalvarCliente');
            if (btnSalvar) {
                btnSalvar.innerHTML = 'Salvar';
                btnSalvar.disabled = false;
            }
        }
    }

    async editarCliente(id) {
        try {
            console.log('✏️ Editando cliente:', id);
            
            const response = await ApiService.getCliente(id);
            if (response && response.success) {
                this.abrirModalCliente(response.data);
            } else {
                this.mostrarMensagem(response?.error || 'Erro ao carregar cliente', 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar cliente:', error);
            this.mostrarMensagem('Erro ao carregar dados do cliente', 'error');
            
            // Fallback: usar dados locais se disponível
            const clienteLocal = this.clientes.find(c => c.id == id);
            if (clienteLocal) {
                this.abrirModalCliente(clienteLocal);
            }
        }
    }

    async excluirCliente(id) {
        if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            console.log('🗑️ Excluindo cliente:', id);

            const response = await ApiService.excluirCliente(id);
            if (response && response.success) {
                this.mostrarMensagem('Cliente excluído com sucesso!', 'success');
                await this.carregarClientes(); // Recarregar lista
            } else {
                this.mostrarMensagem(response?.error || 'Erro ao excluir cliente', 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao excluir cliente:', error);
            this.mostrarMensagem('Erro ao excluir cliente', 'error');
            
            // Fallback: remover localmente para demonstração
            this.clientes = this.clientes.filter(c => c.id != id);
            this.exibirClientes(this.clientes);
            this.atualizarEstatisticas();
            this.mostrarMensagem('Cliente removido localmente (modo demonstração)', 'info');
        }
    }

    fecharModalCliente() {
        const modal = document.getElementById('clientModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        const form = document.getElementById('formCliente');
        if (form) {
            form.reset();
            delete form.dataset.clienteId;
        }
    }

    mostrarMensagem(mensagem, tipo = 'info') {
        // Implementação melhorada de mensagens
        const cores = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const icones = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        // Remover mensagens existentes
        const mensagensExistentes = document.querySelectorAll('.mensagem-flutuante');
        mensagensExistentes.forEach(msg => msg.remove());

        // Criar nova mensagem
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `mensagem-flutuante fixed top-4 right-4 ${cores[tipo]} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm transform transition-all duration-300 flex items-center`;
        mensagemDiv.innerHTML = `
            <i class="fas ${icones[tipo]} mr-3"></i>
            <span>${mensagem}</span>
        `;

        document.body.appendChild(mensagemDiv);

        // Animação de entrada
        setTimeout(() => {
            mensagemDiv.style.transform = 'translateX(0)';
        }, 10);

        // Remover após 5 segundos
        setTimeout(() => {
            mensagemDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (mensagemDiv.parentNode) {
                    mensagemDiv.parentNode.removeChild(mensagemDiv);
                }
            }, 300);
        }, 5000);
    }

    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Funções auxiliares
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatarData(dataString) {
        try {
            if (!dataString) return 'Não informada';
            return new Date(dataString).toLocaleDateString('pt-BR');
        } catch {
            return dataString;
        }
    }
}

// Inicializar sistema quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página de clientes carregada');
    window.clientesSystem = new ClientesSystem();
});