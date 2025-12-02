// Sistema de Gestão de Clientes - VERSÃO COM INATIVAÇÃO (CORRIGIDA)
class ClientesSystem {
    constructor() {
        console.log('🔄 Inicializando sistema de clientes...');
        this.clientes = [];
        this.filtroAtual = 'ativos'; // 'ativos', 'inativos', 'todos'
        this.init();
    }

    async init() {
        try {
            console.log('🔍 Verificando ApiService...');
            
            if (typeof window.ApiService === 'undefined') {
                console.error('❌ ApiService não está disponível');
                setTimeout(() => this.init(), 500);
                return;
            }

            if (typeof window.ApiService.getClientes !== 'function') {
                console.error('❌ Função getClientes não disponível');
                return;
            }

            await this.carregarClientes();
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
            btnNovoCliente.addEventListener('click', (e) => {
                e.preventDefault();
                this.abrirModalCliente();
            });
        }
        
        // 2. Botão Salvar no Modal
        const btnSalvarCliente = document.getElementById('btnSalvarCliente');
        if (btnSalvarCliente) {
            btnSalvarCliente.addEventListener('click', (e) => {
                e.preventDefault();
                this.salvarCliente();
            });
        }
        
        // 3. Botão Cancelar no Modal
        const cancelBtn = document.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.fecharModalCliente();
            });
        }

        // 4. Botões de Filtro
        this.configurarBotoesFiltro();
        
        // 5. Configurar delegação de eventos para a tabela
        this.configurarDelegacaoEventos();
        
        console.log('✅ Event listeners configurados');
    }
    
    configurarBotoesFiltro() {
        // Botão Filtro Ativos
        const btnFiltroAtivos = document.getElementById('btnFiltroAtivos');
        if (btnFiltroAtivos) {
            btnFiltroAtivos.addEventListener('click', () => {
                this.aplicarFiltro('ativos');
            });
        }
        
        // Botão Filtro Inativos
        const btnFiltroInativos = document.getElementById('btnFiltroInativos');
        if (btnFiltroInativos) {
            btnFiltroInativos.addEventListener('click', () => {
                this.aplicarFiltro('inativos');
            });
        }
        
        // Botão Filtro Todos
        const btnFiltroTodos = document.getElementById('btnFiltroTodos');
        if (btnFiltroTodos) {
            btnFiltroTodos.addEventListener('click', () => {
                this.aplicarFiltro('todos');
            });
        }
    }
    
    configurarDelegacaoEventos() {
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
                    this.editarCliente(clienteId);
                }
            }
            
            // Botão Inativar (para clientes ativos)
            if (target.classList.contains('inativar-cliente-btn') || 
                target.closest('.inativar-cliente-btn')) {
                const btn = target.classList.contains('inativar-cliente-btn') 
                    ? target 
                    : target.closest('.inativar-cliente-btn');
                const clienteId = btn.dataset.id;
                const clienteNome = btn.dataset.nome || 'Cliente';
                if (clienteId) {
                    this.confirmarInativacao(clienteId, clienteNome);
                }
            }
            
            // Botão Reativar (para clientes inativos)
            if (target.classList.contains('reativar-cliente-btn') || 
                target.closest('.reativar-cliente-btn')) {
                const btn = target.classList.contains('reativar-cliente-btn') 
                    ? target 
                    : target.closest('.reativar-cliente-btn');
                const clienteId = btn.dataset.id;
                const clienteNome = btn.dataset.nome || 'Cliente';
                if (clienteId) {
                    this.confirmarReativacao(clienteId, clienteNome);
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
                this.aplicarFiltro(this.filtroAtual);
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
    
    aplicarFiltro(filtro) {
        this.filtroAtual = filtro;
        
        // Atualizar botões ativos
        this.atualizarBotoesFiltroAtivos(filtro);
        
        let clientesFiltrados;
        
        switch(filtro) {
            case 'ativos':
                clientesFiltrados = this.clientes.filter(cliente => 
                    cliente.status === 'ativo' || cliente.status === 'fidelidade'
                );
                break;
            case 'inativos':
                clientesFiltrados = this.clientes.filter(cliente => 
                    cliente.status === 'inativo'
                );
                break;
            case 'todos':
                clientesFiltrados = this.clientes;
                break;
            default:
                clientesFiltrados = this.clientes;
        }
        
        this.exibirClientes(clientesFiltrados);
        
        // Atualizar contador no título da tabela
        this.atualizarTituloTabela(filtro, clientesFiltrados.length);
    }
    
    atualizarBotoesFiltroAtivos(filtroAtivo) {
        const botoes = {
            'ativos': document.getElementById('btnFiltroAtivos'),
            'inativos': document.getElementById('btnFiltroInativos'),
            'todos': document.getElementById('btnFiltroTodos')
        };
        
        Object.keys(botoes).forEach(filtro => {
            const botao = botoes[filtro];
            if (botao) {
                if (filtro === filtroAtivo) {
                    botao.classList.remove('bg-gray-100', 'text-gray-700');
                    botao.classList.add('bg-purple-100', 'text-purple-700');
                } else {
                    botao.classList.remove('bg-purple-100', 'text-purple-700');
                    botao.classList.add('bg-gray-100', 'text-gray-700');
                }
            }
        });
    }
    
    atualizarTituloTabela(filtro, quantidade) {
        const tituloElement = document.getElementById('tituloTabelaClientes');
        if (tituloElement) {
            let titulo = 'Clientes';
            
            switch(filtro) {
                case 'ativos':
                    titulo = `Clientes Ativos (${quantidade})`;
                    break;
                case 'inativos':
                    titulo = `Clientes Inativos (${quantidade})`;
                    break;
                case 'todos':
                    titulo = `Todos os Clientes (${quantidade})`;
                    break;
            }
            
            tituloElement.textContent = titulo;
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
                let mensagemVazia = '';
                
                switch(this.filtroAtual) {
                    case 'ativos':
                        mensagemVazia = 'Nenhum cliente ativo encontrado';
                        break;
                    case 'inativos':
                        mensagemVazia = 'Nenhum cliente inativo encontrado';
                        break;
                    case 'todos':
                        mensagemVazia = 'Nenhum cliente cadastrado';
                        break;
                }
                
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-8 text-gray-500">
                            <i class="fas fa-users text-4xl mb-2 text-gray-300"></i>
                            <div>${mensagemVazia}</div>
                            <button id="btnNovoClienteEmpty" class="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                                <i class="fas fa-plus mr-2"></i>Cadastrar Novo Cliente
                            </button>
                        </td>
                    </tr>
                `;

                const btnEmpty = document.getElementById('btnNovoClienteEmpty');
                if (btnEmpty) {
                    btnEmpty.addEventListener('click', () => {
                        this.abrirModalCliente();
                    });
                }
                return;
            }

            tbody.innerHTML = clientes.map(cliente => {
                const isInativo = cliente.status === 'inativo';
                
                return `
                <tr class="border-b border-gray-200 hover:bg-gray-50 ${isInativo ? 'bg-gray-50' : ''}">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10 ${isInativo ? 'bg-gray-200' : 'bg-purple-100'} rounded-full flex items-center justify-center">
                                <i class="fas fa-user ${isInativo ? 'text-gray-500' : 'text-purple-600'}"></i>
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium ${isInativo ? 'text-gray-500' : 'text-gray-900'}">${this.escapeHtml(cliente.nome_completo)}</div>
                                <div class="text-sm ${isInativo ? 'text-gray-400' : 'text-gray-500'}">${cliente.email ? this.escapeHtml(cliente.email) : 'Sem e-mail'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm ${isInativo ? 'text-gray-500' : 'text-gray-900'}">${cliente.telefone ? this.escapeHtml(cliente.telefone) : 'Não informado'}</div>
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
                    <td class="px-6 py-4 whitespace-nowrap text-sm ${isInativo ? 'text-gray-400' : 'text-gray-500'}">
                        ${cliente.data_nascimento ? this.formatarData(cliente.data_nascimento) : 'Não informada'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${cliente.status === 'ativo' ? 'bg-green-100 text-green-800' : 
                              cliente.status === 'inativo' ? 'bg-red-100 text-red-800' : 
                              cliente.status === 'fidelidade' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'}">
                            ${cliente.status === 'ativo' ? 'Ativo' : 
                             cliente.status === 'inativo' ? 'Inativo' : 
                             cliente.status === 'fidelidade' ? 'Fidelidade' : cliente.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm ${isInativo ? 'text-gray-500' : 'text-gray-900'}">
                        ${cliente.pontos_fidelidade || 0} pts
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="editar-cliente-btn ${isInativo ? 'text-gray-400' : 'text-purple-600 hover:text-purple-900'} mr-3 px-3 py-1 rounded hover:bg-purple-50 transition-colors"
                                data-id="${cliente.id}"
                                ${isInativo ? 'disabled' : ''}>
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                        
                        ${isInativo ? 
                            `<button class="reativar-cliente-btn text-green-600 hover:text-green-900 px-3 py-1 rounded hover:bg-green-50 transition-colors"
                                data-id="${cliente.id}"
                                data-nome="${this.escapeHtml(cliente.nome_completo)}">
                                <i class="fas fa-redo mr-1"></i>Reativar
                            </button>` 
                            : 
                            `<button class="inativar-cliente-btn text-red-600 hover:text-red-900 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                data-id="${cliente.id}"
                                data-nome="${this.escapeHtml(cliente.nome_completo)}">
                                <i class="fas fa-ban mr-1"></i>Inativar
                            </button>`
                        }
                    </td>
                </tr>
                `;
            }).join('');

            console.log(`✅ Tabela atualizada com ${clientes.length} clientes (filtro: ${this.filtroAtual})`);
        } catch (error) {
            console.error('❌ Erro ao exibir clientes:', error);
        }
    }
    
    atualizarEstatisticas() {
        try {
            const totalClientes = this.clientes.length;
            const clientesAtivos = this.clientes.filter(cliente => 
                cliente.status === 'ativo' || cliente.status === 'fidelidade'
            ).length;
            const clientesInativos = this.clientes.filter(cliente => 
                cliente.status === 'inativo'
            ).length;
            
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
            this.atualizarElementoTexto('clientesAtivos', clientesAtivos);
            this.atualizarElementoTexto('clientesInativos', clientesInativos);
            this.atualizarElementoTexto('novosClientes', novosEsteMes);
            this.atualizarElementoTexto('aniversariantes', aniversariantes);
            this.atualizarElementoTexto('clientesFidelidade', clientesFidelidade);

            console.log(`📊 Estatísticas: ${totalClientes} total, ${clientesAtivos} ativos, ${clientesInativos} inativos`);
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
            titulo.textContent = 'Editar Cliente';
            this.preencherFormularioCliente(cliente);
        } else {
            titulo.textContent = 'Novo Cliente';
            this.limparFormularioCliente();
        }
        
        modal.classList.remove('hidden');
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
        
        const modalContent = modal.querySelector('.inline-block');
        if (modalContent) {
            modalContent.style.zIndex = '10000';
            modalContent.style.position = 'relative';
        }
        
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            const primeiroCampo = document.getElementById('nome_completo');
            if (primeiroCampo) {
                primeiroCampo.focus();
            }
        }, 100);
        
        console.log('✅ Modal aberto');
    }
    
    fecharModalCliente() {
        const modal = document.getElementById('clientModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal.style.backgroundColor = 'transparent';
            document.body.style.overflow = 'auto';
            this.limparFormularioCliente();
        }
    }
    
    preencherFormularioCliente(cliente) {
        console.log(`📝 Preenchendo formulário para cliente: ${cliente.nome_completo}`);
        
        const campos = {
            'nome_completo': cliente.nome_completo || '',
            'telefone': cliente.telefone || '',
            'email': cliente.email || '',
            'data_nascimento': cliente.data_nascimento || '',
            'genero': cliente.genero || '',
            'status': cliente.status || 'ativo',
            'observacoes': cliente.observacoes || ''
        };
        
        Object.keys(campos).forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                elemento.value = campos[campo];
            }
        });
        
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

    // ==================== CRUD OPERAÇÕES ====================
    
    async salvarCliente() {
        console.log('💾 Salvando cliente...');
        
        const form = document.getElementById('formCliente');
        if (!form) {
            this.mostrarMensagem('Erro: Formulário não encontrado', 'error');
            return;
        }
        
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
        
        if (!clienteData.nome_completo.trim()) {
            this.mostrarMensagem('Nome completo é obrigatório', 'error');
            document.getElementById('nome_completo').focus();
            return;
        }
        
        try {
            const clienteId = form.dataset.clienteId;
            let response;
            
            const btnSalvar = document.getElementById('btnSalvarCliente');
            const textoOriginal = btnSalvar.innerHTML;
            btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
            btnSalvar.disabled = true;
            
            if (clienteId) {
                console.log(`✏️ Atualizando cliente ID: ${clienteId}`);
                response = await window.ApiService.atualizarCliente(clienteId, clienteData);
            } else {
                console.log('🆕 Criando novo cliente');
                response = await window.ApiService.criarCliente(clienteData);
            }
            
            btnSalvar.innerHTML = textoOriginal;
            btnSalvar.disabled = false;
            
            if (response && response.success) {
                const mensagem = clienteId ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!';
                this.mostrarMensagem(mensagem, 'success');
                this.fecharModalCliente();
                await this.carregarClientes();
            } else {
                const erro = response?.error || 'Erro ao salvar cliente';
                this.mostrarMensagem(erro, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao salvar cliente:', error);
            this.mostrarMensagem('Erro ao salvar cliente', 'error');
            
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
    
    confirmarInativacao(id, nome) {
        console.log(`🚫 Confirmando inativação do cliente: ${nome} (ID: ${id})`);
        
        if (confirm(`Tem certeza que deseja INATIVAR o cliente "${nome}"?\n\nO cliente será marcado como inativo, mas os dados serão preservados.`)) {
            this.inativarCliente(id);
        }
    }
    
    async inativarCliente(id) {
        console.log(`🚫 Inativando cliente ID: ${id}`);
        
        try {
            const response = await window.ApiService.excluirCliente(id);
            if (response && response.success) {
                console.log(`✅ Cliente ${id} inativado com sucesso`);
                this.mostrarMensagem('Cliente inativado com sucesso!', 'success');
                await this.carregarClientes();
            } else {
                const erro = response?.error || 'Erro ao inativar cliente';
                console.error(`❌ ${erro}`);
                this.mostrarMensagem(erro, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao inativar cliente:', error);
            this.mostrarMensagem('Erro ao inativar cliente', 'error');
        }
    }
    
    confirmarReativacao(id, nome) {
        console.log(`🔄 Confirmando reativação do cliente: ${nome} (ID: ${id})`);
        
        if (confirm(`Tem certeza que deseja REATIVAR o cliente "${nome}"?\n\nO cliente voltará a aparecer na lista de clientes ativos.`)) {
            this.reativarCliente(id);
        }
    }
    
    async reativarCliente(id) {
        console.log(`🔄 Reativando cliente ID: ${id}`);
        
        try {
            // Primeiro, buscar os dados completos do cliente
            const clienteResponse = await window.ApiService.getCliente(id);
            if (!clienteResponse || !clienteResponse.success) {
                throw new Error('Não foi possível carregar os dados do cliente');
            }
            
            const cliente = clienteResponse.data;
            
            // Preparar dados para atualização com todos os campos obrigatórios
            const dadosAtualizacao = {
                nome_completo: cliente.nome_completo || '',
                telefone: cliente.telefone || '',
                email: cliente.email || '',
                data_nascimento: cliente.data_nascimento || '',
                genero: cliente.genero || '',
                status: 'ativo', // Mudar status para ativo
                observacoes: cliente.observacoes || ''
            };
            
            // Verificar se nome_completo está presente (campo obrigatório)
            if (!dadosAtualizacao.nome_completo.trim()) {
                throw new Error('Nome do cliente não encontrado');
            }
            
            console.log(`📝 Atualizando cliente ${id} com dados:`, dadosAtualizacao);
            
            // Atualizar cliente com todos os dados
            const response = await window.ApiService.atualizarCliente(id, dadosAtualizacao);
            
            if (response && response.success) {
                console.log(`✅ Cliente ${id} reativado com sucesso`);
                this.mostrarMensagem('Cliente reativado com sucesso!', 'success');
                await this.carregarClientes();
            } else {
                const erro = response?.error || 'Erro ao reativar cliente';
                console.error(`❌ ${erro}`);
                this.mostrarMensagem(erro, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao reativar cliente:', error);
            this.mostrarMensagem('Erro ao reativar cliente: ' + error.message, 'error');
        }
    }

    // ==================== FUNÇÕES AUXILIARES ====================
    
    mostrarMensagem(mensagem, tipo = 'info') {
        console.log(`💬 ${tipo.toUpperCase()}: ${mensagem}`);
        
        // Converter "excluído" para "inativado"
        if (mensagem.includes('excluído') || mensagem.includes('Excluído')) {
            mensagem = mensagem.replace('excluído', 'inativado').replace('Excluído', 'Inativado');
        }
        
        const estilos = {
            success: { bg: 'bg-green-500', icon: 'fa-check-circle' },
            error: { bg: 'bg-red-500', icon: 'fa-exclamation-circle' },
            warning: { bg: 'bg-yellow-500', icon: 'fa-exclamation-triangle' },
            info: { bg: 'bg-blue-500', icon: 'fa-info-circle' }
        };
        
        const estilo = estilos[tipo] || estilos.info;
        
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `fixed top-4 right-4 ${estilo.bg} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm flex items-center`;
        mensagemDiv.innerHTML = `
            <i class="fas ${estilo.icon} mr-3"></i>
            <span>${mensagem}</span>
        `;
        
        document.body.appendChild(mensagemDiv);
        
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
    
    setTimeout(() => {
        if (typeof window.ApiService === 'undefined') {
            console.error('❌ ApiService não está disponível. Verifique se api.js foi carregado.');
            return;
        }
        
        window.clientesSystem = new ClientesSystem();
    }, 100);
});

// Função global para teste manual
window.testarClientes = function() {
    console.log('🧪 Testando sistema de clientes...');
    
    if (window.clientesSystem) {
        console.log('✅ Sistema de clientes está inicializado');
        window.clientesSystem.abrirModalCliente();
        window.clientesSystem.carregarClientes();
    } else {
        console.error('❌ Sistema de clientes NÃO inicializado');
    }
};