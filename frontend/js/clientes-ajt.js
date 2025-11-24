// Sistema de Gestão de Clientes
class ClientesSystem {
    constructor() {
        console.log('🔄 Inicializando sistema de clientes...');
        this.init();
    }

    init() {
        // Verificar se ApiService está disponível
        if (typeof ApiService === 'undefined') {
            console.error('❌ ApiService não está disponível');
            setTimeout(() => this.init(), 100); // Tentar novamente
            return;
        }

        this.initializeEventListeners();
        this.carregarClientes();
        console.log('✅ Sistema de Clientes inicializado');
    }

    initializeEventListeners() {
        // Formulário de novo cliente
        const formCliente = document.getElementById('formCliente');
        if (formCliente) {
            // Remover event listeners existentes
            const newForm = formCliente.cloneNode(true);
            formCliente.parentNode.replaceChild(newForm, formCliente);
            
            // Adicionar novo event listener
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarCliente();
            });
        }

        // Botão de novo cliente
        const btnNovoCliente = document.getElementById('btnNovoCliente');
        if (btnNovoCliente) {
            btnNovoCliente.addEventListener('click', () => {
                this.abrirModalCliente();
            });
        }

        // Botões de fechar modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal') || 
                e.target.classList.contains('cancel-btn') ||
                e.target.closest('.close-modal') || 
                e.target.closest('.cancel-btn')) {
                this.fecharModalCliente();
            }
        });
    }

    async carregarClientes() {
        try {
            console.log('🔄 Carregando clientes da API...');
            const response = await ApiService.getClientes();
            
            if (response && response.success) {
                console.log(`✅ ${response.data.length} clientes carregados`);
                this.exibirClientes(response.data);
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
                            class="text-purple-600 hover:text-purple-900 mr-3">
                        <i class="fas fa-edit mr-1"></i>Editar
                    </button>
                    <button onclick="window.clientesSystem.excluirCliente(${cliente.id})" 
                            class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash mr-1"></i>Excluir
                    </button>
                </td>
            </tr>
        `).join('');
    }

    abrirModalCliente(cliente = null) {
        const modal = document.getElementById('clientModal');
        const titulo = document.getElementById('modalClienteTitle');
        const form = document.getElementById('formCliente');

        if (!modal || !titulo || !form) {
            console.error('❌ Elementos do modal não encontrados');
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
            return;
        }

        const formData = new FormData(form);
        
        const clienteData = {
            nome_completo: formData.get('nome_completo'),
            telefone: formData.get('telefone'),
            email: formData.get('email'),
            data_nascimento: formData.get('data_nascimento'),
            genero: formData.get('genero'),
            status: formData.get('status'),
            observacoes: formData.get('observacoes')
        };

        // Validações básicas
        if (!clienteData.nome_completo || clienteData.nome_completo.trim() === '') {
            this.mostrarMensagem('Nome completo é obrigatório', 'error');
            return;
        }

        try {
            let response;
            const clienteId = form.dataset.clienteId;

            console.log('💾 Salvando cliente...', clienteData);

            if (clienteId) {
                // Editar cliente existente
                response = await ApiService.atualizarCliente(clienteId, clienteData);
            } else {
                // Criar novo cliente
                response = await ApiService.criarCliente(clienteData);
            }

            if (response && response.success) {
                this.mostrarMensagem(
                    clienteId ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!', 
                    'success'
                );
                this.fecharModalCliente();
                this.carregarClientes(); // Recarregar lista
            } else {
                this.mostrarMensagem(response?.error || 'Erro ao salvar cliente', 'error');
            }

        } catch (error) {
            console.error('❌ Erro ao salvar cliente:', error);
            this.mostrarMensagem('Erro de conexão com o servidor', 'error');
        }
    }

    async editarCliente(id) {
        try {
            console.log('✏️ Editando cliente:', id);
            const response = await ApiService.getCliente(id);
            if (response && response.success) {
                this.abrirModalCliente(response.data);
            } else {
                this.mostrarMensagem('Erro ao carregar cliente', 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar cliente:', error);
            this.mostrarMensagem('Erro de conexão com o servidor', 'error');
        }
    }

    async excluirCliente(id) {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) {
            return;
        }

        try {
            const response = await ApiService.excluirCliente(id);
            if (response && response.success) {
                this.mostrarMensagem('Cliente excluído com sucesso!', 'success');
                this.carregarClientes(); // Recarregar lista
            } else {
                this.mostrarMensagem(response?.error || 'Erro ao excluir cliente', 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao excluir cliente:', error);
            this.mostrarMensagem('Erro de conexão com o servidor', 'error');
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
        // Usar alert simples por enquanto
        alert(`[${tipo.toUpperCase()}] ${mensagem}`);
    }

    // Funções auxiliares
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatarData(dataString) {
        try {
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