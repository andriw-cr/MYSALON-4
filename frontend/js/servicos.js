// frontend/js/servicos.js - SISTEMA DE SERVIÇOS FUNCIONAL - VERSÃO CORRIGIDA
// Versão otimizada e completamente testada com overlay fixo

class ServicosSystem {
    constructor() {
        console.log('🔄 Inicializando sistema de serviços...');
        this.servicos = [];
        this.categorias = [];
        this.filtroAtual = 'ativos';
        this.categoriaFiltro = 'todos';
        this.initialized = false;
        this.servicoEditando = null;
        this.init();
    }

    // ==================== INICIALIZAÇÃO ====================
    
    async init() {
        try {
            console.log('🔍 Verificando dependências...');
            
            // Verificar se ApiService está disponível
            if (typeof window.ApiService === 'undefined') {
                console.error('❌ ApiService não está disponível');
                this.mostrarMensagem('Sistema de API não carregado. Recarregue a página.', 'error');
                
                // Tentar novamente após 1 segundo
                setTimeout(() => this.init(), 1000);
                return;
            }

            // Verificar métodos da API
            if (typeof window.ApiService.getServicos !== 'function') {
                console.error('❌ Método getServicos não disponível');
                this.mostrarMensagem('API de serviços não configurada corretamente', 'error');
                return;
            }

            // Carregar dados
            await this.carregarServicos();
            await this.carregarCategorias();
            
            // Configurar interface
            this.inicializarEventListeners();
            this.configurarFiltrosCategoria();
            this.atualizarEstatisticas();
            
            // Configurar fechamento com tecla ESC
            this.configurarFechamentoTeclado();
            
            console.log('✅ Sistema de serviços inicializado com sucesso');
            this.initialized = true;
            
        } catch (error) {
            console.error('❌ Erro fatal na inicialização:', error);
            this.mostrarMensagem(`Erro crítico: ${error.message}`, 'error');
        }
    }

    // ==================== CARREGAMENTO DE DADOS ====================
    
    async carregarServicos() {
        try {
            console.log('🔄 Carregando serviços...');
            
            const response = await window.ApiService.getServicos();
            
            if (response && response.success) {
                this.servicos = response.data || [];
                console.log(`✅ ${this.servicos.length} serviços carregados`);
                
                // Atualizar interface
                this.aplicarFiltro(this.filtroAtual);
                this.atualizarCardsServicos();
                this.atualizarEstatisticas();
            } else {
                console.error('❌ Erro na resposta da API:', response);
                this.mostrarMensagem('Erro ao carregar serviços da API', 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar serviços:', error);
            this.mostrarMensagem('Erro de conexão com o servidor', 'error');
        }
    }

    async carregarCategorias() {
        try {
            console.log('🔄 Carregando categorias...');
            
            // Tentar buscar da API
            try {
                const response = await window.ApiService.request('/servicos/categorias/list');
                
                if (response && response.success && response.data) {
                    if (Array.isArray(response.data)) {
                        this.categorias = response.data;
                        console.log(`✅ ${this.categorias.length} categorias carregadas da API`);
                        return;
                    }
                }
            } catch (error) {
                console.log('⚠️ API de categorias não disponível, extraindo dos serviços...');
            }
            
            // Fallback: extrair categorias dos serviços
            this.extrairCategoriasDosServicos();
            
        } catch (error) {
            console.error('❌ Erro ao carregar categorias:', error);
            this.categorias = ['cabelo', 'barba', 'unhas', 'estetica', 'maquiagem', 'outros'];
        }
    }

    extrairCategoriasDosServicos() {
        const categoriasUnicas = new Set();
        this.servicos.forEach(servico => {
            if (servico.categoria) {
                categoriasUnicas.add(servico.categoria);
            }
        });
        
        this.categorias = Array.from(categoriasUnicas);
        
        if (this.categorias.length === 0) {
            this.categorias = ['cabelo', 'barba', 'unhas', 'estetica', 'maquiagem', 'outros'];
        }
        
        console.log(`📊 ${this.categorias.length} categorias extraídas dos serviços`);
    }

    // ==================== CONFIGURAÇÃO DE EVENTOS ====================
    
    inicializarEventListeners() {
        console.log('🎯 Configurando event listeners...');
        
        // Prevenir múltiplas inicializações
        if (this.initialized) {
            console.warn('⚠️ Event listeners já inicializados');
            return;
        }

        // 1. Botão Novo Serviço
        this.configurarBotao('#btnNovoServico', () => {
            this.abrirModalServico();
        });

        // 2. Botão Salvar no Modal
        this.configurarBotao('#saveService', () => {
            this.salvarServico();
        });

        // 3. Botão Cancelar no Modal
        this.configurarBotao('#cancelService', () => {
            this.fecharModalServico();
        });

        // 4. Botões de Filtro (Status)
        this.configurarBotoesFiltro();
        
        // 5. Busca de serviços
        const buscaInput = document.getElementById('buscarServicos');
        if (buscaInput) {
            buscaInput.addEventListener('input', (e) => {
                this.filtrarPorBusca(e.target.value);
            });
        }
        
        // 6. Configurar delegação de eventos
        this.configurarDelegacaoEventos();
        
        // 7. Configurar abas no modal
        this.configurarAbasModal();
        
        // 8. Configurar modal de visualização
        this.configurarModalVisualizacao();
        
        console.log('✅ Event listeners configurados');
    }

    configurarBotao(seletor, callback) {
        const botao = document.querySelector(seletor);
        if (botao) {
            // Remover listeners antigos
            const novoBotao = botao.cloneNode(true);
            botao.parentNode.replaceChild(novoBotao, botao);
            
            novoBotao.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🔘 Botão clicado: ${seletor}`);
                callback();
            });
        } else {
            console.warn(`⚠️ Botão não encontrado: ${seletor}`);
        }
    }

    configurarBotoesFiltro() {
        const filtros = {
            'btnFiltroAtivos': 'ativos',
            'btnFiltroInativos': 'inativos',
            'btnFiltroTodos': 'todos'
        };

        Object.entries(filtros).forEach(([id, filtro]) => {
            this.configurarBotao(`#${id}`, () => {
                this.aplicarFiltro(filtro);
            });
        });
    }

    configurarFiltrosCategoria() {
        const container = document.getElementById('filtrosCategoria');
        if (!container) {
            console.warn('⚠️ Container de filtros de categoria não encontrado');
            return;
        }
        
        container.innerHTML = '';
        
        // Botão "Todos"
        const btnTodos = document.createElement('button');
        btnTodos.className = 'px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm hover:bg-purple-200 mr-2 mb-2';
        btnTodos.textContent = 'Todos';
        btnTodos.addEventListener('click', () => {
            this.aplicarFiltroCategoria('todos');
        });
        container.appendChild(btnTodos);
        
        // Botões para cada categoria
        this.categorias.forEach(categoria => {
            let categoriaTexto = this.extrairTextoDaCategoria(categoria);
            
            if (!categoriaTexto || categoriaTexto.trim() === '') {
                return;
            }
            
            const btn = document.createElement('button');
            btn.className = 'px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 mr-2 mb-2';
            btn.textContent = this.formatarCategoria(categoriaTexto);
            
            btn.addEventListener('click', () => {
                this.aplicarFiltroCategoria(categoriaTexto);
            });
            
            container.appendChild(btn);
        });
        
        console.log(`✅ ${this.categorias.length} filtros de categoria configurados`);
    }

    extrairTextoDaCategoria(categoria) {
        if (typeof categoria === 'object' && categoria !== null) {
            return categoria.categoria || categoria.nome || categoria.value || categoria.text || '';
        }
        return String(categoria || '');
    }

    configurarAbasModal() {
        const abas = document.querySelectorAll('.tab-button');
        abas.forEach(aba => {
            aba.addEventListener('click', () => {
                const tabId = aba.getAttribute('data-tab');
                this.mudarAba(tabId);
            });
        });
    }

    configurarModalVisualizacao() {
        this.configurarBotao('#closeViewModal', () => this.fecharModalVisualizacao());
        this.configurarBotao('#closeViewModalBtn', () => this.fecharModalVisualizacao());
        this.configurarBotao('#editFromView', () => {
            const servicoId = document.getElementById('viewServiceModal')?.dataset.servicoId;
            if (servicoId) {
                this.fecharModalVisualizacao();
                this.editarServico(servicoId);
            }
        });
    }

    configurarFechamentoTeclado() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modalServico = document.getElementById('serviceModal');
                const modalVisualizacao = document.getElementById('viewServiceModal');
                
                if (modalServico && !modalServico.classList.contains('hidden')) {
                    this.fecharModalServico();
                }
                
                if (modalVisualizacao && !modalVisualizacao.classList.contains('hidden')) {
                    this.fecharModalVisualizacao();
                }
            }
        });
    }

    configurarDelegacaoEventos() {
        console.log('🎯 Configurando delegação de eventos...');
        
        // Usar delegação de eventos na tabela
        const tabela = document.getElementById('tabelaServicosBody');
        if (tabela) {
            tabela.addEventListener('click', (e) => {
                this.processarCliqueTabela(e);
            });
        }
        
        // Configurar cards
        setTimeout(() => {
            this.adicionarListenersCards();
        }, 300);
    }

    processarCliqueTabela(e) {
        const botao = e.target.closest('button');
        if (!botao) return;
        
        const servicoId = botao.dataset.id;
        if (!servicoId) return;
        
        if (botao.classList.contains('editar-servico-btn')) {
            e.preventDefault();
            this.editarServico(servicoId);
        } 
        else if (botao.classList.contains('visualizar-servico-btn')) {
            e.preventDefault();
            this.visualizarServico(servicoId);
        } 
        else if (botao.classList.contains('inativar-servico-btn')) {
            e.preventDefault();
            const servicoNome = botao.dataset.nome || 'Serviço';
            this.confirmarInativacao(servicoId, servicoNome);
        } 
        else if (botao.classList.contains('reativar-servico-btn')) {
            e.preventDefault();
            const servicoNome = botao.dataset.nome || 'Serviço';
            this.confirmarReativacao(servicoId, servicoNome);
        }
    }

    adicionarListenersCards() {
        const cards = document.querySelectorAll('.service-card');
        cards.forEach(card => {
            const botoes = card.querySelectorAll('button');
            botoes.forEach(botao => {
                const servicoId = botao.dataset.id;
                if (!servicoId) return;
                
                if (botao.classList.contains('editar-servico-btn')) {
                    botao.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.editarServico(servicoId);
                    });
                } 
                else if (botao.classList.contains('visualizar-servico-btn')) {
                    botao.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.visualizarServico(servicoId);
                    });
                } 
                else if (botao.classList.contains('inativar-servico-btn')) {
                    botao.addEventListener('click', (e) => {
                        e.preventDefault();
                        const servicoNome = botao.dataset.nome || 'Serviço';
                        this.confirmarInativacao(servicoId, servicoNome);
                    });
                }
            });
        });
    }

    // ==================== FILTROS E BUSCA ====================
    
    aplicarFiltro(filtro) {
        this.filtroAtual = filtro;
        
        // Atualizar botões ativos
        this.atualizarBotoesFiltroAtivos(filtro);
        
        let servicosFiltrados = this.servicos;
        
        // Aplicar filtro de status
        switch(filtro) {
            case 'ativos':
                servicosFiltrados = servicosFiltrados.filter(s => s.status === 'ativo');
                break;
            case 'inativos':
                servicosFiltrados = servicosFiltrados.filter(s => s.status === 'inativo');
                break;
            case 'todos':
                // Todos os serviços
                break;
        }
        
        // Aplicar filtro de categoria se não for "todos"
        if (this.categoriaFiltro !== 'todos') {
            servicosFiltrados = servicosFiltrados.filter(s => s.categoria === this.categoriaFiltro);
        }
        
        this.exibirServicos(servicosFiltrados);
        this.atualizarTituloTabela(filtro, servicosFiltrados.length);
    }

    aplicarFiltroCategoria(categoria) {
        this.categoriaFiltro = categoria;
        
        // Atualizar botões de categoria
        const botoes = document.querySelectorAll('#filtrosCategoria button');
        botoes.forEach(botao => {
            const textoBotao = botao.textContent.toLowerCase();
            const categoriaFormatada = categoria === 'todos' ? 'todos' : this.formatarCategoria(categoria).toLowerCase();
            
            if ((categoria === 'todos' && textoBotao === 'todos') ||
                (textoBotao === categoriaFormatada)) {
                botao.className = 'px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm hover:bg-purple-200 mr-2 mb-2';
            } else {
                botao.className = 'px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 mr-2 mb-2';
            }
        });
        
        this.aplicarFiltro(this.filtroAtual);
    }

    filtrarPorBusca(termo) {
        if (!termo.trim()) {
            this.aplicarFiltro(this.filtroAtual);
            return;
        }
        
        const termoLower = termo.toLowerCase();
        let servicosFiltrados = this.servicos;
        
        // Aplicar filtro de status atual
        switch(this.filtroAtual) {
            case 'ativos':
                servicosFiltrados = servicosFiltrados.filter(s => s.status === 'ativo');
                break;
            case 'inativos':
                servicosFiltrados = servicosFiltrados.filter(s => s.status === 'inativo');
                break;
        }
        
        // Aplicar busca
        servicosFiltrados = servicosFiltrados.filter(s => 
            s.nome.toLowerCase().includes(termoLower) ||
            (s.descricao && s.descricao.toLowerCase().includes(termoLower)) ||
            (s.categoria && s.categoria.toLowerCase().includes(termoLower))
        );
        
        this.exibirServicos(servicosFiltrados);
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
                    botao.className = 'px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 mr-2';
                } else {
                    botao.className = 'px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 mr-2';
                }
            }
        });
    }

    // ==================== EXIBIÇÃO DE DADOS ====================
    
    exibirServicos(servicos) {
        try {
            const tbody = document.querySelector('#tabelaServicosBody');
            if (!tbody) {
                console.error('❌ Tabela de serviços não encontrada');
                return;
            }

            if (!servicos || servicos.length === 0) {
                let mensagemVazia = '';
                
                switch(this.filtroAtual) {
                    case 'ativos': mensagemVazia = 'Nenhum serviço ativo encontrado'; break;
                    case 'inativos': mensagemVazia = 'Nenhum serviço inativo encontrado'; break;
                    default: mensagemVazia = 'Nenhum serviço cadastrado';
                }
                
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-8 text-gray-500">
                            <i class="fas fa-cut text-4xl mb-2 text-gray-300"></i>
                            <div>${mensagemVazia}</div>
                            <button id="btnNovoServicoEmpty" class="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                                <i class="fas fa-plus mr-2"></i>Cadastrar Novo Serviço
                            </button>
                        </td>
                    </tr>
                `;

                const btnEmpty = document.getElementById('btnNovoServicoEmpty');
                if (btnEmpty) {
                    btnEmpty.addEventListener('click', () => this.abrirModalServico());
                }
                return;
            }

            tbody.innerHTML = servicos.map(servico => {
                const isInativo = servico.status === 'inativo';
                const iconeCategoria = this.getIconePorCategoria(servico.categoria);
                const corCategoria = this.getCorPorCategoria(servico.categoria);
                
                return `
                <tr class="border-b border-gray-200 hover:bg-gray-50 ${isInativo ? 'bg-gray-50' : ''}">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10 ${isInativo ? 'bg-gray-200' : corCategoria.bg} rounded-lg flex items-center justify-center">
                                <i class="fas ${iconeCategoria} ${isInativo ? 'text-gray-500' : corCategoria.text}"></i>
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium ${isInativo ? 'text-gray-500' : 'text-gray-900'}">${this.escapeHtml(servico.nome)}</div>
                                <div class="text-sm ${isInativo ? 'text-gray-400' : 'text-gray-500'}">${servico.descricao ? this.limitarTexto(this.escapeHtml(servico.descricao), 50) : 'Sem descrição'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm ${isInativo ? 'text-gray-500' : 'text-gray-900'}">${this.formatarCategoria(servico.categoria)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm ${isInativo ? 'text-gray-500' : 'text-gray-900'}">
                        R$ ${parseFloat(servico.preco_base || 0).toFixed(2).replace('.', ',')}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm ${isInativo ? 'text-gray-500' : 'text-gray-900'}">
                        ${servico.duracao_minutos || 0} min
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${servico.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${servico.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="editar-servico-btn ${isInativo ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600 hover:text-purple-900'} mr-3 px-3 py-1 rounded hover:bg-purple-50 transition-colors"
                                data-id="${servico.id}"
                                ${isInativo ? 'disabled' : ''}
                                title="Editar serviço">
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                        
                        <button class="visualizar-servico-btn ${isInativo ? 'text-gray-400' : 'text-blue-600 hover:text-blue-900'} mr-3 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                                data-id="${servico.id}"
                                title="Visualizar detalhes">
                            <i class="fas fa-eye mr-1"></i>Ver
                        </button>
                        
                        ${isInativo ? 
                            `<button class="reativar-servico-btn text-green-600 hover:text-green-900 px-3 py-1 rounded hover:bg-green-50 transition-colors"
                                data-id="${servico.id}"
                                data-nome="${this.escapeHtml(servico.nome)}"
                                title="Reativar serviço">
                                <i class="fas fa-redo mr-1"></i>Reativar
                            </button>` 
                            : 
                            `<button class="inativar-servico-btn text-red-600 hover:text-red-900 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                data-id="${servico.id}"
                                data-nome="${this.escapeHtml(servico.nome)}"
                                title="Inativar serviço">
                                <i class="fas fa-ban mr-1"></i>Inativar
                            </button>`
                        }
                    </td>
                </tr>
                `;
            }).join('');

            console.log(`✅ Tabela atualizada com ${servicos.length} serviços`);
            
        } catch (error) {
            console.error('❌ Erro ao exibir serviços:', error);
        }
    }

    atualizarCardsServicos() {
        try {
            const container = document.getElementById('cardsServicos');
            if (!container) return;
            
            const servicosAtivos = this.servicos.filter(s => s.status === 'ativo');
            
            if (servicosAtivos.length === 0) {
                container.innerHTML = `
                    <div class="col-span-3 text-center py-8 text-gray-500">
                        <i class="fas fa-cut text-4xl mb-4 text-gray-300"></i>
                        <p>Nenhum serviço ativo cadastrado</p>
                    </div>
                `;
                return;
            }
            
            const servicosParaCards = servicosAtivos.slice(0, 6);
            
            container.innerHTML = servicosParaCards.map(servico => {
                const iconeCategoria = this.getIconePorCategoria(servico.categoria);
                const corGradiente = this.getGradientePorCategoria(servico.categoria);
                
                return `
                <div class="service-card bg-white rounded-lg shadow overflow-hidden">
                    <div class="h-40 ${corGradiente} flex items-center justify-center">
                        <i class="fas ${iconeCategoria} text-white text-4xl"></i>
                    </div>
                    <div class="p-4">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-semibold text-lg">${this.escapeHtml(servico.nome)}</h4>
                            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Ativo</span>
                        </div>
                        <p class="text-gray-600 text-sm mb-3">${servico.descricao ? this.limitarTexto(this.escapeHtml(servico.descricao), 80) : 'Sem descrição'}</p>
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-purple-600">R$ ${parseFloat(servico.preco_base || 0).toFixed(2).replace('.', ',')}</span>
                            <span class="text-gray-500 text-sm">${servico.duracao_minutos || 0} min</span>
                        </div>
                        <div class="mt-3 flex justify-between">
                            <button class="editar-servico-btn text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-50"
                                    data-id="${servico.id}"
                                    title="Editar serviço">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="visualizar-servico-btn text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                                    data-id="${servico.id}"
                                    title="Visualizar detalhes">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="inativar-servico-btn text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                                    data-id="${servico.id}"
                                    data-nome="${this.escapeHtml(servico.nome)}"
                                    title="Inativar serviço">
                                <i class="fas fa-ban"></i>
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
            
            console.log(`✅ Cards atualizados com ${servicosParaCards.length} serviços`);
            
        } catch (error) {
            console.error('❌ Erro ao atualizar cards:', error);
        }
    }

    atualizarEstatisticas() {
        try {
            const totalServicos = this.servicos.length;
            const servicosAtivos = this.servicos.filter(s => s.status === 'ativo').length;
            const servicosInativos = this.servicos.filter(s => s.status === 'inativo').length;
            
            const categoriasUnicas = new Set(this.servicos.map(s => s.categoria).filter(Boolean));
            const totalCategorias = categoriasUnicas.size;

            this.atualizarElementoTexto('totalServicos', totalServicos);
            this.atualizarElementoTexto('servicosAtivos', servicosAtivos);
            this.atualizarElementoTexto('servicosInativos', servicosInativos);
            this.atualizarElementoTexto('totalCategorias', totalCategorias);

            console.log(`📊 Estatísticas: Total=${totalServicos}, Ativos=${servicosAtivos}, Inativos=${servicosInativos}, Categorias=${totalCategorias}`);
            
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

    atualizarTituloTabela(filtro, quantidade) {
        const tituloElement = document.getElementById('tituloTabelaServicos');
        if (tituloElement) {
            let titulo = 'Serviços';
            
            switch(filtro) {
                case 'ativos': titulo = `Serviços Ativos (${quantidade})`; break;
                case 'inativos': titulo = `Serviços Inativos (${quantidade})`; break;
                case 'todos': titulo = `Todos os Serviços (${quantidade})`; break;
            }
            
            tituloElement.textContent = titulo;
        }
    }

    // ==================== MODAL DE SERVIÇO ====================
    
    abrirModalServico(servico = null) {
        console.log('🚪 Abrindo modal de serviço...', servico ? 'EDIÇÃO' : 'NOVO');
        
        const modal = document.getElementById('serviceModal');
        const titulo = document.getElementById('modalTitle');
        
        if (!modal || !titulo) {
            console.error('❌ Modal não encontrado');
            this.mostrarMensagem('Erro: Modal não encontrado', 'error');
            return;
        }
        
        // **CORREÇÃO CRÍTICA:** Criar overlay se não existir
        this.criarOverlayModal();
        
        // Remover classe hidden e mostrar modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // **CORREÇÃO:** Adicionar classe para overlay ativo
        document.body.classList.add('modal-open');
        
        if (servico) {
            titulo.textContent = 'Editar Serviço';
            this.preencherFormularioServico(servico);
            this.servicoEditando = servico.id;
        } else {
            titulo.textContent = 'Novo Serviço';
            this.limparFormularioServico();
            this.servicoEditando = null;
        }
        
        // Garantir que estamos na primeira aba
        this.mudarAba('general');
        
        // Focar no primeiro campo
        setTimeout(() => {
            const primeiroCampo = document.getElementById('service_name');
            if (primeiroCampo) {
                primeiroCampo.focus();
            }
        }, 100);
        
        console.log('✅ Modal aberto corretamente');
    }

    // **NOVA FUNÇÃO:** Criar overlay para o modal
    criarOverlayModal() {
        // Verificar se o overlay já existe
        let overlay = document.getElementById('modalOverlay');
        
        if (!overlay) {
            // Criar overlay
            overlay = document.createElement('div');
            overlay.id = 'modalOverlay';
            overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 hidden';
            
            // Adicionar funcionalidade de fechar ao clicar no overlay
            overlay.addEventListener('click', () => {
                this.fecharModalServico();
            });
            
            document.body.appendChild(overlay);
        }
        
        // Mostrar overlay
        overlay.classList.remove('hidden');
    }

    fecharModalServico() {
        const modal = document.getElementById('serviceModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            this.limparFormularioServico();
            this.servicoEditando = null;
        }
        
        // **CORREÇÃO:** Remover overlay
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
        
        // Remover classe do body
        document.body.classList.remove('modal-open');
        
        console.log('✅ Modal fechado');
    }

    mudarAba(tabId) {
        // Atualizar abas ativas
        document.querySelectorAll('.tab-button').forEach(aba => {
            aba.classList.remove('border-purple-500', 'text-purple-600');
            aba.classList.add('border-transparent', 'text-gray-500');
        });
        
        const abaAtiva = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (abaAtiva) {
            abaAtiva.classList.remove('border-transparent', 'text-gray-500');
            abaAtiva.classList.add('border-purple-500', 'text-purple-600');
        }
        
        // Mostrar conteúdo da aba
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const conteudoAtivo = document.getElementById(`${tabId}-tab`);
        if (conteudoAtivo) {
            conteudoAtivo.classList.add('active');
        }
    }

    preencherFormularioServico(servico) {
        console.log(`📝 Preenchendo formulário para: ${servico.nome}`);
        
        const campos = {
            'service_name': servico.nome || '',
            'category': servico.categoria || '',
            'description': servico.descricao || '',
            'status': servico.status || 'ativo',
            'base_price': servico.preco_base || '',
            'duration': servico.duracao_minutos || '30'
        };
        
        Object.keys(campos).forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                elemento.value = campos[campo];
            }
        });
        
        const idInput = document.getElementById('servico_id');
        if (idInput) {
            idInput.value = servico.id;
        }
    }

    limparFormularioServico() {
        const form = document.getElementById('serviceForm');
        if (form) {
            form.reset();
            const idInput = document.getElementById('servico_id');
            if (idInput) {
                idInput.value = '';
            }
        }
    }

    // ==================== MODAL DE VISUALIZAÇÃO ====================
    
    async visualizarServico(id) {
        console.log(`👁️ Visualizando serviço ID: ${id}`);
        
        try {
            const response = await window.ApiService.getServico(id);
            if (response && response.success) {
                this.abrirModalVisualizacao(response.data);
            } else {
                const erro = response?.error || 'Erro ao carregar serviço';
                this.mostrarMensagem(erro, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao visualizar serviço:', error);
            this.mostrarMensagem('Erro ao carregar dados do serviço', 'error');
        }
    }

    abrirModalVisualizacao(servico) {
        const modal = document.getElementById('viewServiceModal');
        if (!modal) return;
        
        modal.dataset.servicoId = servico.id;
        
        const elementos = {
            'viewServiceTitle': `Detalhes: ${this.escapeHtml(servico.nome)}`,
            'viewServiceName': this.escapeHtml(servico.nome),
            'viewServiceCategory': this.formatarCategoria(servico.categoria),
            'viewServicePrice': `R$ ${parseFloat(servico.preco_base || 0).toFixed(2).replace('.', ',')}`,
            'viewServiceDuration': `${servico.duracao_minutos || 0} minutos`,
            'viewServiceDescription': servico.descricao || 'Sem descrição',
            'viewServiceStatus': servico.status === 'ativo' ? 
                '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Ativo</span>' :
                '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Inativo</span>'
        };
        
        Object.keys(elementos).forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                if (id === 'viewServiceStatus') {
                    elemento.innerHTML = elementos[id];
                } else {
                    elemento.textContent = elementos[id];
                }
            }
        });
        
        modal.classList.remove('hidden');
    }

    fecharModalVisualizacao() {
        const modal = document.getElementById('viewServiceModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // ==================== OPERAÇÕES CRUD ====================
    
    async salvarServico() {
        console.log('💾 Salvando serviço...');
        
        const form = document.getElementById('serviceForm');
        if (!form) {
            this.mostrarMensagem('Erro: Formulário não encontrado', 'error');
            return;
        }
        
        // Coletar dados
        const servicoData = {
            nome: document.getElementById('service_name')?.value || '',
            categoria: document.getElementById('category')?.value || '',
            descricao: document.getElementById('description')?.value || '',
            status: document.getElementById('status')?.value || 'ativo',
            preco_base: parseFloat(document.getElementById('base_price')?.value || 0),
            duracao_minutos: parseInt(document.getElementById('duration')?.value || 30)
        };
        
        // Validações
        if (!servicoData.nome.trim()) {
            this.mostrarMensagem('Nome do serviço é obrigatório', 'error');
            document.getElementById('service_name').focus();
            return;
        }
        
        if (!servicoData.categoria) {
            this.mostrarMensagem('Categoria é obrigatória', 'error');
            document.getElementById('category').focus();
            return;
        }
        
        if (servicoData.preco_base <= 0) {
            this.mostrarMensagem('Preço deve ser maior que zero', 'error');
            document.getElementById('base_price').focus();
            return;
        }
        
        if (servicoData.duracao_minutos <= 0) {
            this.mostrarMensagem('Duração deve ser maior que zero', 'error');
            document.getElementById('duration').focus();
            return;
        }
        
        try {
            const servicoId = document.getElementById('servico_id')?.value;
            const btnSalvar = document.getElementById('saveService');
            const textoOriginal = btnSalvar.innerHTML;
            
            // Mostrar estado de carregamento
            btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
            btnSalvar.disabled = true;
            
            let response;
            
            if (servicoId) {
                console.log(`✏️ Atualizando serviço ID: ${servicoId}`);
                
                if (typeof window.ApiService.atualizarServico === 'function') {
                    response = await window.ApiService.atualizarServico(servicoId, servicoData);
                } else {
                    response = await window.ApiService.request(`/servicos/${servicoId}`, {
                        method: 'PUT',
                        body: JSON.stringify(servicoData)
                    });
                }
            } else {
                console.log('🆕 Criando novo serviço');
                
                if (typeof window.ApiService.criarServico === 'function') {
                    response = await window.ApiService.criarServico(servicoData);
                } else {
                    response = await window.ApiService.request('/servicos', {
                        method: 'POST',
                        body: JSON.stringify(servicoData)
                    });
                }
            }
            
            // Restaurar botão
            btnSalvar.innerHTML = textoOriginal;
            btnSalvar.disabled = false;
            
            if (response && response.success) {
                const mensagem = servicoId ? 'Serviço atualizado com sucesso!' : 'Serviço criado com sucesso!';
                this.mostrarMensagem(mensagem, 'success');
                this.fecharModalServico();
                await this.carregarServicos();
            } else {
                const erro = response?.error || response?.message || 'Erro ao salvar serviço';
                this.mostrarMensagem(erro, 'error');
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar serviço:', error);
            this.mostrarMensagem(`Erro: ${error.message}`, 'error');
            
            const btnSalvar = document.getElementById('saveService');
            if (btnSalvar) {
                btnSalvar.innerHTML = 'Salvar';
                btnSalvar.disabled = false;
            }
        }
    }

    async editarServico(id) {
        console.log(`✏️ Editando serviço ID: ${id}`);
        
        try {
            const response = await window.ApiService.getServico(id);
            if (response && response.success) {
                this.abrirModalServico(response.data);
            } else {
                const erro = response?.error || 'Erro ao carregar serviço';
                this.mostrarMensagem(erro, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao editar serviço:', error);
            this.mostrarMensagem('Erro ao carregar dados do serviço', 'error');
        }
    }

    confirmarInativacao(id, nome) {
        console.log(`🚫 Confirmando inativação: ${nome} (ID: ${id})`);
        
        if (confirm(`Tem certeza que deseja INATIVAR o serviço "${nome}"?\n\nO serviço será marcado como inativo, mas os dados serão preservados.`)) {
            this.inativarServico(id);
        }
    }

    async inativarServico(id) {
        console.log(`🚫 Inativando serviço ID: ${id}`);
        
        try {
            const response = await window.ApiService.request(`/servicos/${id}`, {
                method: 'DELETE'
            });
            
            if (response && response.success) {
                this.mostrarMensagem('Serviço inativado com sucesso!', 'success');
                await this.carregarServicos();
            } else {
                const erro = response?.error || 'Erro ao inativar serviço';
                this.mostrarMensagem(erro, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao inativar serviço:', error);
            this.mostrarMensagem('Erro ao inativar serviço', 'error');
        }
    }

    confirmarReativacao(id, nome) {
        console.log(`🔄 Confirmando reativação: ${nome} (ID: ${id})`);
        
        if (confirm(`Tem certeza que deseja REATIVAR o serviço "${nome}"?\n\nO serviço voltará a aparecer na lista de serviços ativos.`)) {
            this.reativarServico(id);
        }
    }

    async reativarServico(id) {
        console.log(`🔄 Reativando serviço ID: ${id}`);
        
        try {
            const response = await window.ApiService.request(`/servicos/${id}/reativar`, {
                method: 'PATCH'
            });
            
            if (response && response.success) {
                this.mostrarMensagem('Serviço reativado com sucesso!', 'success');
                await this.carregarServicos();
            } else {
                const erro = response?.error || 'Erro ao reativar serviço';
                this.mostrarMensagem(erro, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao reativar serviço:', error);
            this.mostrarMensagem(`Erro: ${error.message}`, 'error');
        }
    }

    // ==================== FUNÇÕES AUXILIARES ====================
    
    mostrarMensagem(mensagem, tipo = 'info') {
        console.log(`💬 ${tipo.toUpperCase()}: ${mensagem}`);
        
        // Usar sistema de confirmação do app.js se disponível
        if (typeof window.showConfirmation === 'function') {
            window.showConfirmation(
                tipo === 'success' ? 'Sucesso!' : 
                tipo === 'error' ? 'Erro!' : 
                tipo === 'warning' ? 'Atenção!' : 'Informação',
                mensagem
            );
            return;
        }
        
        // Fallback
        const estilos = {
            success: { bg: 'bg-green-500', icon: 'fa-check-circle' },
            error: { bg: 'bg-red-500', icon: 'fa-exclamation-circle' },
            warning: { bg: 'bg-yellow-500', icon: 'fa-exclamation-triangle' },
            info: { bg: 'bg-blue-500', icon: 'fa-info-circle' }
        };
        
        const estilo = estilos[tipo] || estilos.info;
        
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `fixed top-4 right-4 ${estilo.bg} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm flex items-center animate-fade-in`;
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

    limitarTexto(texto, limite) {
        if (!texto) return '';
        if (texto.length <= limite) return texto;
        return texto.substring(0, limite) + '...';
    }

    formatarCategoria(categoria) {
        try {
            if (!categoria || categoria.trim() === '') {
                return 'Outros';
            }
            
            const categoriaStr = typeof categoria === 'string' ? categoria.trim() : String(categoria).trim();
            
            const formatacoes = {
                'cabelo': 'Cabelo', 'hair': 'Cabelo',
                'barba': 'Barba', 'beard': 'Barba',
                'unhas': 'Unhas', 'nails': 'Unhas',
                'estetica': 'Estética', 'esthetics': 'Estética',
                'maquiagem': 'Maquiagem', 'makeup': 'Maquiagem',
                'outros': 'Outros', 'other': 'Outros'
            };
            
            const categoriaLower = categoriaStr.toLowerCase();
            
            if (formatacoes[categoriaLower]) {
                return formatacoes[categoriaLower];
            }
            
            return categoriaStr.charAt(0).toUpperCase() + categoriaStr.slice(1).toLowerCase();
            
        } catch (error) {
            console.error('❌ Erro em formatarCategoria:', error);
            return 'Outros';
        }
    }

    getIconePorCategoria(categoria) {
        const icones = {
            'cabelo': 'fa-cut',
            'barba': 'fa-user-tie',
            'unhas': 'fa-hand-paper',
            'estetica': 'fa-spa',
            'maquiagem': 'fa-palette',
            'outros': 'fa-star'
        };
        
        const categoriaStr = typeof categoria === 'string' ? categoria.toLowerCase() : '';
        return icones[categoriaStr] || 'fa-cut';
    }

    getCorPorCategoria(categoria) {
        const cores = {
            'cabelo': { bg: 'bg-purple-100', text: 'text-purple-600' },
            'barba': { bg: 'bg-blue-100', text: 'text-blue-600' },
            'unhas': { bg: 'bg-green-100', text: 'text-green-600' },
            'estetica': { bg: 'bg-pink-100', text: 'text-pink-600' },
            'maquiagem': { bg: 'bg-yellow-100', text: 'text-yellow-600' },
            'outros': { bg: 'bg-gray-100', text: 'text-gray-600' }
        };
        
        const categoriaStr = typeof categoria === 'string' ? categoria.toLowerCase() : '';
        return cores[categoriaStr] || { bg: 'bg-gray-100', text: 'text-gray-600' };
    }

    getGradientePorCategoria(categoria) {
        const gradientes = {
            'cabelo': 'bg-gradient-to-r from-purple-400 to-purple-600',
            'barba': 'bg-gradient-to-r from-blue-400 to-blue-600',
            'unhas': 'bg-gradient-to-r from-green-400 to-green-600',
            'estetica': 'bg-gradient-to-r from-pink-400 to-pink-600',
            'maquiagem': 'bg-gradient-to-r from-yellow-400 to-yellow-600',
            'outros': 'bg-gradient-to-r from-gray-400 to-gray-600'
        };
        
        const categoriaStr = typeof categoria === 'string' ? categoria.toLowerCase() : '';
        return gradientes[categoriaStr] || 'bg-gradient-to-r from-gray-400 to-gray-600';
    }

    // ==================== FUNÇÕES DE DIAGNÓSTICO ====================
    
    testarModalManualmente() {
        console.log('🧪 Teste manual do modal');
        
        const modal = document.getElementById('serviceModal');
        if (!modal) {
            console.error('❌ Modal não encontrado no DOM');
            return;
        }
        
        console.log('🔍 Status do modal:');
        console.log('- Classe hidden:', modal.classList.contains('hidden'));
        console.log('- Display:', modal.style.display);
        
        // Forçar abertura
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        console.log('✅ Modal aberto manualmente');
        
        return modal;
    }

    diagnosticarProblemas() {
        console.log('🔍 DIAGNÓSTICO DO SISTEMA DE SERVIÇOS');
        console.log('=====================================');
        
        // 1. Modal
        const modal = document.getElementById('serviceModal');
        console.log('1. Modal:', modal ? '✅ Encontrado' : '❌ Não encontrado');
        
        // 2. Botões
        console.log('2. Botões:');
        console.log('   - Novo Serviço:', document.getElementById('btnNovoServico') ? '✅' : '❌');
        console.log('   - Salvar:', document.getElementById('saveService') ? '✅' : '❌');
        
        // 3. API
        console.log('3. API Service:');
        console.log('   - ApiService global:', typeof window.ApiService !== 'undefined' ? '✅' : '❌');
        
        // 4. Sistema
        console.log('4. Sistema:');
        console.log('   - servicosSystem:', window.servicosSystem ? '✅ Inicializado' : '❌ Não inicializado');
        
        console.log('=====================================');
    }
}

// ==================== INICIALIZAÇÃO GLOBAL ====================

// Adicionar CSS para animações (VERSÃO CORRIGIDA)
(function() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        .service-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .service-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        button[disabled] {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* ===== CORREÇÕES CRÍTICAS DO MODAL ===== */
        #serviceModal {
            z-index: 9999 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background-color: transparent !important;
        }
        
        #serviceModal .bg-white {
            z-index: 10000 !important;
            position: relative !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
            margin: auto !important;
        }
        
        /* Overlay do modal */
        #modalOverlay {
            z-index: 9998 !important;
            transition: opacity 0.3s ease !important;
        }
        
        /* Quando modal está aberto */
        .modal-open {
            overflow: hidden !important;
        }
        
        /* Modal de visualização */
        #viewServiceModal {
            z-index: 10001 !important;
        }
        
        #viewServiceModal .bg-white {
            z-index: 10002 !important;
        }
        
        /* Animações suaves para o modal */
        .modal-enter {
            animation: modalFadeIn 0.3s ease-out;
        }
        
        @keyframes modalFadeIn {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        /* Scrollbar personalizada para o modal */
        #serviceModal ::-webkit-scrollbar {
            width: 6px;
        }
        
        #serviceModal ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        
        #serviceModal ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
        }
        
        #serviceModal ::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
    `;
    document.head.appendChild(style);
})();

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página de serviços carregada');
    
    // Pequeno delay para garantir que ApiService foi carregado
    setTimeout(() => {
        if (typeof window.ApiService === 'undefined') {
            console.error('❌ ApiService não está disponível. Verifique se api.js foi carregado.');
            
            // Tentar novamente após 1 segundo
            setTimeout(() => {
                if (typeof window.ApiService !== 'undefined') {
                    window.servicosSystem = new ServicosSystem();
                } else {
                    console.error('❌ ApiService ainda não disponível após tentativas');
                    
                    // Mostrar erro para o usuário
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'fixed top-0 left-0 right-0 bg-red-600 text-white p-4 text-center z-50';
                    errorDiv.innerHTML = `
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Erro: Sistema de API não carregado. Recarregue a página.
                        <button onclick="location.reload()" class="ml-4 bg-white text-red-600 px-3 py-1 rounded text-sm">
                            <i class="fas fa-redo mr-1"></i>Recarregar
                        </button>
                    `;
                    document.body.appendChild(errorDiv);
                }
            }, 1000);
            return;
        }
        
        // Inicializar sistema de serviços
        window.servicosSystem = new ServicosSystem();
        
        // Adicionar funções auxiliares para console
        window.testarModalServicos = () => {
            if (window.servicosSystem) {
                window.servicosSystem.testarModalManualmente();
            } else {
                console.error('❌ Sistema de serviços não inicializado');
            }
        };
        
        window.diagnosticarServicos = () => {
            if (window.servicosSystem) {
                window.servicosSystem.diagnosticarProblemas();
            } else {
                console.error('❌ Sistema de serviços não inicializado');
            }
        };
        
        window.abrirModalTeste = () => {
            const modal = document.getElementById('serviceModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                console.log('✅ Modal aberto via console');
            } else {
                console.error('❌ Modal não encontrado');
            }
        };
        
        console.log('✅ Sistema de serviços preparado para inicialização');
        
    }, 100);
});

// Exportar para uso global
window.ServicosSystem = ServicosSystem;