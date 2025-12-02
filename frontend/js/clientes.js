// Sistema de Gestão de Clientes - VERSÃO SIMPLIFICADA E FUNCIONAL
class ClientesSystem {
    constructor() {
        console.log('🔄 Inicializando sistema de clientes...');
        this.clientes = [];
        this.init();
    }

    async init() {
        try {
            console.log('🔍 Verificando ApiService...');
            
            // Verificar se ApiService está disponível
            if (typeof window.ApiService === 'undefined') {
                console.error('❌ ApiService não está disponível');
                setTimeout(() => this.init(), 500);
                return;
            }

            // Verificar funções essenciais
            if (typeof window.ApiService.getClientes !== 'function') {
                console.error('❌ Função getClientes não disponível');
                return;
            }

            // Carregar clientes
            await this.carregarClientes();
            
            // Inicializar eventos
            this.inicializarEventListeners();
            
            console.log('✅ Sistema de clientes inicializado');
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
    }

    // ==================== EVENT LISTENERS ====================
    
    inicializarEventListeners() {
        console.log('🎯 Configurando event listeners...');
        
        // 1. Botão Novo Cliente
        const btnNovoCliente = document.getElementById('btnNovoCliente');
        if (btnNovoCliente) {
            console.log('✅ Botão "Novo Cliente" encontrado');
            btnNovoCliente.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🆕 Botão Novo Cliente clicado');
                this.abrirModalCliente();
            });
        } else {
            console.error('❌ Botão "Novo Cliente" NÃO encontrado!');
        }
        
        // 2. Botão Salvar no Modal
        const btnSalvarCliente = document.getElementById('btnSalvarCliente');
        if (btnSalvarCliente) {
            console.log('✅ Botão "Salvar Cliente" encontrado');
            btnSalvarCliente.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('💾 Botão Salvar clicado');
                this.salvarCliente();
            });
        }
        
        // 3. Botão Cancelar no Modal
        const cancelBtn = document.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🚫 Botão Cancelar clicado');
                this.fecharModalCliente();
            });
        }
        
        // 4. Configurar delegação de eventos para a tabela
        this.configurarDelegacaoEventos();
        
        console.log('✅ Event listeners configurados');
    }
    
    configurarDelegacaoEventos() {
        // Usar delegação de eventos para botões dinâmicos na tabela
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Botão Editar
            if (target.classList.contains('editar-cliente-btn') || 
                target.closest('.editar-cliente-btn')) {
                const btn = target.classList.contains('editar-cliente-btn') 
                    ? target 
                    : target.closest('.editar-cliente-btn');
                const clienteId = btn.dataset.id;
                if (clienteId) {
                    console.log(`✏️ Botão Editar clicado para ID: ${clienteId}`);
                    this.editarCliente(clienteId);
                }
            }
            
            // Botão Excluir
            if (target.classList.contains('excluir-cliente-btn') || 
                target.closest('.excluir-cliente-btn')) {
                const btn = target.classList.contains('excluir-cliente-btn') 
                    ? target 
                    : target.closest('.excluir-cliente-btn');
                const clienteId = btn.dataset.id;
                const clienteNome = btn.dataset.nome || 'Cliente';
                if (clienteId) {
                    console.log(`🗑️ Botão Excluir clicado para ID: ${clienteId}`);
                    this.confirmarExclusaoCliente(clienteId, clienteNome);
                }
            }
        });
    }

    // ==================== FUNÇÕES PRINCIPAIS ====================
    
    async carregarClientes() {
        try {
            console.log('🔄 Carregando clientes da API...');
            
            const response = await window.ApiService.getClientes();
            
            if (response && response.success) {
                this.clientes = response.data || [];
                console.log(`✅ ${this.clientes.length} clientes carregados`);
                this.exibirClientes(this.clientes);
                this.atualizarEstatisticas();
            } else {
                console.error('❌ Erro na resposta da API:', response);
                this.mostrarMensagem('Erro ao carregar clientes', 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar clientes:', error);
            this.mostrarMensagem('Erro de conexão com o servidor', 'error');
        }
    }
    
    exibirClientes(clientes) {
        try {
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

                // Configurar botão da tabela vazia
                const btnEmpty = document.getElementById('btnNovoClienteEmpty');
                if (btnEmpty) {
                    btnEmpty.addEventListener('click', () => {
                        console.log('🆕 Botão da tabela vazia clicado');
                        this.abrirModalCliente();
                    });
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
                             cliente.status === 'fidelidade' ? 'Fidelidade' : cliente.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${cliente.pontos_fidelidade || 0} pts
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="editar-cliente-btn text-purple-600 hover:text-purple-900 mr-3 px-3 py-1 rounded hover:bg-purple-50 transition-colors"
                                data-id="${cliente.id}">
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                        <button class="excluir-cliente-btn text-red-600 hover:text-red-900 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                data-id="${cliente.id}"
                                data-nome="${this.escapeHtml(cliente.nome_completo)}">
                            <i class="fas fa-trash mr-1"></i>Excluir
                        </button>
                    </td>
                </tr>
            `).join('');

            console.log('✅ Tabela de clientes atualizada');
        } catch (error) {
            console.error('❌ Erro ao exibir clientes:', error);
        }
    }
    
    atualizarEstatisticas() {
        try {
            const totalClientes = this.clientes.length;
            const novosEsteMes = this.clientes.filter(cliente => {
                const dataCadastro = new Date(cliente.data_cadastro || cliente.created_at || new Date());
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
                cliente.status === 'fidelidade' || cliente.nivel_fidelidade === 'Ouro'
            ).length;

            // Atualizar elementos HTML
            this.atualizarElementoTexto('totalClientes', totalClientes);
            this.atualizarElementoTexto('novosClientes', novosEsteMes);
            this.atualizarElementoTexto('aniversariantes', aniversariantes);
            this.atualizarElementoTexto('clientesFidelidade', clientesFidelidade);

            console.log(`📊 Estatísticas: ${totalClientes} clientes, ${novosEsteMes} novos, ${aniversariantes} aniversariantes`);
        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error);
        }
    }
    
    atualizarElementoTexto(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    }

    // ==================== MODAL DE CLIENTE ====================
    
abrirModalCliente(cliente = null) {
    console.log('🚪 Abrindo modal de cliente...');
    
    const modal = document.getElementById('clientModal');
    const titulo = document.getElementById('modalClienteTitle');
    
    if (!modal || !titulo) {
        console.error('❌ Modal não encontrado');
        this.mostrarMensagem('Erro: Modal não encontrado', 'error');
        return;
    }
    
    if (cliente) {
        // Modo edição
        titulo.textContent = 'Editar Cliente';
        this.preencherFormularioCliente(cliente);
    } else {
        // Modo novo
        titulo.textContent = 'Novo Cliente';
        this.limparFormularioCliente();
    }
    
    // === CORREÇÃO CRÍTICA ===
    // Remover classe hidden
    modal.classList.remove('hidden');
    
    // Forçar estilos importantes
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '9999';
    
    // Garantir que o conteúdo do modal seja visível
    const modalContent = modal.querySelector('.inline-block');
    if (modalContent) {
        modalContent.style.zIndex = '10000';
        modalContent.style.position = 'relative';
    }
    
    // Prevenir scroll do body
    document.body.style.overflow = 'hidden';
    
    // Focar no primeiro campo
    setTimeout(() => {
        const primeiroCampo = document.getElementById('nome_completo');
        if (primeiroCampo) {
            primeiroCampo.focus();
        }
    }, 100);
    
    console.log('✅ Modal aberto com correções aplicadas');
}

// E também atualize a função fecharModalCliente:
fecharModalCliente() {
    const modal = document.getElementById('clientModal');
    if (modal) {
        modal.classList.add('hidden');
        
        // Restaurar estilos
        modal.style.display = 'none';
        modal.style.backgroundColor = 'transparent';
        
        // Restaurar scroll do body
        document.body.style.overflow = 'auto';
        
        this.limparFormularioCliente();
    }
}
    
    preencherFormularioCliente(cliente) {
        console.log(`📝 Preenchendo formulário para cliente: ${cliente.nome_completo}`);
        
        // Mapear campos
        const campos = {
            'nome_completo': cliente.nome_completo || '',
            'telefone': cliente.telefone || '',
            'email': cliente.email || '',
            'data_nascimento': cliente.data_nascimento || '',
            'genero': cliente.genero || '',
            'status': cliente.status || 'ativo',
            'observacoes': cliente.observacoes || ''
        };
        
        // Preencher campos
        Object.keys(campos).forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                elemento.value = campos[campo];
            }
        });
        
        // Guardar ID do cliente no formulário
        const form = document.getElementById('formCliente');
        if (form) {
            form.dataset.clienteId = cliente.id;
        }
    }
    
    limparFormularioCliente() {
        const form = document.getElementById('formCliente');
        if (form) {
            form.reset();
            delete form.dataset.clienteId;
        }
    }
    
    fecharModalCliente() {
        const modal = document.getElementById('clientModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.limparFormularioCliente();
    }

    // ==================== CRUD OPERAÇÕES ====================
    
    async salvarCliente() {
        console.log('💾 Salvando cliente...');
        
        const form = document.getElementById('formCliente');
        if (!form) {
            console.error('❌ Formulário não encontrado');
            this.mostrarMensagem('Erro: Formulário não encontrado', 'error');
            return;
        }
        
        // Coletar dados do formulário
        const formData = new FormData(form);
        const clienteData = {
            nome_completo: formData.get('nome_completo') || '',
            telefone: formData.get('telefone') || '',
            email: formData.get('email') || '',
            data_nascimento: formData.get('data_nascimento') || '',
            genero: formData.get('genero') || '',
            status: formData.get('status') || 'ativo',
            observacoes: formData.get('observacoes') || ''
        };
        
        // Validação básica
        if (!clienteData.nome_completo.trim()) {
            this.mostrarMensagem('Nome completo é obrigatório', 'error');
            document.getElementById('nome_completo').focus();
            return;
        }
        
        try {
            const clienteId = form.dataset.clienteId;
            let response;
            
            // Mostrar loading no botão salvar
            const btnSalvar = document.getElementById('btnSalvarCliente');
            const textoOriginal = btnSalvar.innerHTML;
            btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
            btnSalvar.disabled = true;
            
            if (clienteId) {
                // Editar cliente existente
                console.log(`✏️ Atualizando cliente ID: ${clienteId}`);
                response = await window.ApiService.atualizarCliente(clienteId, clienteData);
            } else {
                // Criar novo cliente
                console.log('🆕 Criando novo cliente');
                response = await window.ApiService.criarCliente(clienteData);
            }
            
            // Restaurar botão
            btnSalvar.innerHTML = textoOriginal;
            btnSalvar.disabled = false;
            
            if (response && response.success) {
                const mensagem = clienteId ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!';
                console.log(`✅ ${mensagem}`);
                this.mostrarMensagem(mensagem, 'success');
                this.fecharModalCliente();
                await this.carregarClientes(); // Recarregar lista
            } else {
                const erro = response?.error || 'Erro ao salvar cliente';
                console.error(`❌ ${erro}`);
                this.mostrarMensagem(erro, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao salvar cliente:', error);
            this.mostrarMensagem('Erro ao salvar cliente', 'error');
            
            // Restaurar botão em caso de erro
            const btnSalvar = document.getElementById('btnSalvarCliente');
            if (btnSalvar) {
                btnSalvar.innerHTML = 'Salvar';
                btnSalvar.disabled = false;
            }
        }
    }
    
    async editarCliente(id) {
        console.log(`✏️ Editando cliente ID: ${id}`);
        
        try {
            const response = await window.ApiService.getCliente(id);
            if (response && response.success) {
                this.abrirModalCliente(response.data);
            } else {
                const erro = response?.error || 'Erro ao carregar cliente';
                this.mostrarMensagem(erro, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar cliente:', error);
            this.mostrarMensagem('Erro ao carregar dados do cliente', 'error');
        }
    }
    
    confirmarExclusaoCliente(id, nome) {
        console.log(`🗑️ Confirmando exclusão do cliente: ${nome} (ID: ${id})`);
        
        // Usar confirm nativo (simples e funciona)
        if (confirm(`Tem certeza que deseja excluir o cliente "${nome}"?`)) {
            this.excluirCliente(id);
        }
    }
    
    async excluirCliente(id) {
        console.log(`🗑️ Excluindo cliente ID: ${id}`);
        
        try {
            const response = await window.ApiService.excluirCliente(id);
            if (response && response.success) {
                console.log(`✅ Cliente ${id} excluído com sucesso`);
                this.mostrarMensagem('Cliente excluído com sucesso!', 'success');
                await this.carregarClientes(); // Recarregar lista
            } else {
                const erro = response?.error || 'Erro ao excluir cliente';
                console.error(`❌ ${erro}`);
                this.mostrarMensagem(erro, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao excluir cliente:', error);
            this.mostrarMensagem('Erro ao excluir cliente', 'error');
        }
    }

    // ==================== FUNÇÕES AUXILIARES ====================
    
    mostrarMensagem(mensagem, tipo = 'info') {
        console.log(`💬 ${tipo.toUpperCase()}: ${mensagem}`);
        
        // Cores e ícones
        const estilos = {
            success: { bg: 'bg-green-500', icon: 'fa-check-circle' },
            error: { bg: 'bg-red-500', icon: 'fa-exclamation-circle' },
            warning: { bg: 'bg-yellow-500', icon: 'fa-exclamation-triangle' },
            info: { bg: 'bg-blue-500', icon: 'fa-info-circle' }
        };
        
        const estilo = estilos[tipo] || estilos.info;
        
        // Criar elemento de mensagem
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `fixed top-4 right-4 ${estilo.bg} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm flex items-center`;
        mensagemDiv.innerHTML = `
            <i class="fas ${estilo.icon} mr-3"></i>
            <span>${mensagem}</span>
        `;
        
        document.body.appendChild(mensagemDiv);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (mensagemDiv.parentNode) {
                mensagemDiv.parentNode.removeChild(mensagemDiv);
            }
        }, 5000);
    }
    
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

// ==================== INICIALIZAÇÃO ====================

// Sistema de Logs Fallback
if (typeof window.logError === 'undefined') {
    window.logError = (module, message) => console.error(`[${module}] ERROR: ${message}`);
    window.logWarning = (module, message) => console.warn(`[${module}] WARNING: ${message}`);
    window.logInfo = (module, message) => console.info(`[${module}] INFO: ${message}`);
    window.logSuccess = (module, message) => console.log(`[${module}] ✅: ${message}`);
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página de clientes carregada');
    
    // Pequeno delay para garantir que todos os scripts carregaram
    setTimeout(() => {
        // Verificar se ApiService está disponível
        if (typeof window.ApiService === 'undefined') {
            console.error('❌ ApiService não está disponível. Verifique se api.js foi carregado.');
            return;
        }
        
        // Inicializar sistema
        window.clientesSystem = new ClientesSystem();
    }, 100);
});

// Função global para teste manual
window.testarClientes = function() {
    console.log('🧪 Testando sistema de clientes...');
    
    if (window.clientesSystem) {
        console.log('✅ Sistema de clientes está inicializado');
        
        // Testar abertura manual do modal
        window.clientesSystem.abrirModalCliente();
        
        // Testar carregamento de clientes
        window.clientesSystem.carregarClientes();
    } else {
        console.error('❌ Sistema de clientes NÃO inicializado');
    }
};