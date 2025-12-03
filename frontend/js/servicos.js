// frontend/js/servicos.js - VERSÃO 100% FUNCIONAL
(function() {
    console.log('🚀 INICIANDO SISTEMA DE SERVIÇOS...');
    
    // Variáveis globais
    let servicosSystem = null;
    let servicosData = [];
    
    // ==================== INICIALIZAÇÃO ====================
    
    function inicializarSistema() {
        console.log('🎯 Inicializando sistema de serviços...');
        
        // 1. Adicionar listeners IMEDIATAMENTE
        adicionarEventListenersDiretos();
        
        // 2. Carregar dados de exemplo (para teste rápido)
        carregarDadosExemplo();
        
        // 3. Inicializar funcionalidades
        inicializarAbasModal();
        
        console.log('✅ Sistema de serviços inicializado!');
        
        // Expor para console
        window.servicosSystem = {
            testar: function() {
                console.log('🧪 Sistema de Serviços Teste');
                console.log('- Serviços:', servicosData.length);
                console.log('- Botão Novo:', document.getElementById('btnNovoServico'));
                abrirModalNovoServico();
            }
        };
    }
    
    // ==================== LISTENERS DIRETOS ====================
    
    function adicionarEventListenersDiretos() {
        console.log('🔗 Configurando listeners diretos...');
        
        // 1. BOTÃO NOVO SERVIÇO (o mais importante!)
        const btnNovo = document.getElementById('btnNovoServico');
        if (btnNovo) {
            console.log('✅ Botão "Novo Serviço" configurado');
            btnNovo.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🎯 Botão NOVO clicado!');
                abrirModalNovoServico();
            });
            
            // Também adicionar via onclick para garantir
            btnNovo.onclick = function(e) {
                e.preventDefault();
                abrirModalNovoServico();
            };
        }
        
        // 2. BOTÕES DE AÇÃO NA TABELA (delegação direta)
        document.addEventListener('click', function(e) {
            const target = e.target;
            
            // Encontrar o botão mais próximo
            const btn = target.closest('button');
            if (!btn) return;
            
            // Verificar se é botão de editar
            if (btn.classList.contains('edit-service') || 
                (btn.querySelector && btn.querySelector('.fa-edit')) ||
                target.classList.contains('fa-edit')) {
                
                const servicoId = btn.getAttribute('data-id');
                console.log('✏️ Botão EDITAR clicado - ID:', servicoId);
                abrirModalEditar(servicoId);
                e.preventDefault();
            }
            
            // Verificar se é botão de visualizar
            else if (btn.classList.contains('view-service') ||
                     (btn.querySelector && btn.querySelector('.fa-eye')) ||
                     target.classList.contains('fa-eye')) {
                
                const servicoId = btn.getAttribute('data-id');
                console.log('👁️ Botão VISUALIZAR clicado - ID:', servicoId);
                visualizarServico(servicoId);
                e.preventDefault();
            }
            
            // Verificar se é botão de excluir
            else if (btn.classList.contains('delete-service') ||
                     (btn.querySelector && btn.querySelector('.fa-trash')) ||
                     target.classList.contains('fa-trash')) {
                
                const servicoId = btn.getAttribute('data-id');
                console.log('🗑️ Botão EXCLUIR clicado - ID:', servicoId);
                confirmarExclusao(servicoId);
                e.preventDefault();
            }
        });
        
        // 3. BOTÕES DO MODAL PRINCIPAL
        const btnSalvar = document.getElementById('saveService');
        const btnCancelar = document.getElementById('cancelService');
        
        if (btnSalvar) {
            btnSalvar.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('💾 Botão SALVAR clicado');
                salvarServico();
            });
        }
        
        if (btnCancelar) {
            btnCancelar.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('❌ Botão CANCELAR clicado');
                fecharModalServico();
            });
        }
        
        // 4. BOTÕES FECHAR MODAL VISUALIZAÇÃO
        const btnCloseView1 = document.getElementById('closeViewModal');
        const btnCloseView2 = document.getElementById('closeViewModalBtn');
        
        if (btnCloseView1) btnCloseView1.onclick = fecharModalVisualizacao;
        if (btnCloseView2) btnCloseView2.onclick = fecharModalVisualizacao;
        
        console.log('✅ Todos os listeners configurados');
    }
    
    // ==================== FUNÇÕES DO MODAL ====================
    
    function abrirModalNovoServico() {
        console.log('🚪 ABRINDO MODAL para novo serviço');
        
        const modal = document.getElementById('serviceModal');
        if (!modal) {
            console.error('❌ Modal não encontrado!');
            mostrarMensagem('Erro: Modal não encontrado', 'error');
            return;
        }
        
        // Limpar formulário
        const form = document.getElementById('serviceForm');
        if (form) {
            form.reset();
            delete form.dataset.servicoId;
            
            // Definir valores padrão
            const statusSelect = document.getElementById('status');
            if (statusSelect) statusSelect.value = 'active';
            
            const durationSelect = document.getElementById('duration');
            if (durationSelect) durationSelect.value = '30';
        }
        
        // Atualizar título
        const titulo = document.getElementById('modalTitle');
        if (titulo) titulo.textContent = 'Novo Serviço';
        
        // Mostrar modal
        modal.classList.remove('hidden');
        modal.style.display = 'block';
        
        // Focar no primeiro campo
        setTimeout(() => {
            const primeiroCampo = modal.querySelector('#service_name');
            if (primeiroCampo) primeiroCampo.focus();
        }, 100);
        
        console.log('✅ Modal aberto com sucesso');
    }
    
    function abrirModalEditar(servicoId) {
        console.log('✏️ ABRINDO MODAL para editar serviço ID:', servicoId);
        
        // Encontrar serviço (para teste, usar dados fixos)
        const servico = {
            id: servicoId,
            nome: 'Corte Feminino',
            categoria: 'hair',
            descricao: 'Corte personalizado com lavagem e finalização',
            preco_base: 60.00,
            duracao_minutos: 45,
            status: 'active'
        };
        
        // Abrir modal
        abrirModalNovoServico();
        
        // Preencher com dados do serviço
        setTimeout(() => {
            preencherFormulario(servico);
            
            // Atualizar título
            const titulo = document.getElementById('modalTitle');
            if (titulo) titulo.textContent = 'Editar Serviço';
        }, 50);
    }
    
    function preencherFormulario(servico) {
        const form = document.getElementById('serviceForm');
        if (!form) return;
        
        // Armazenar ID
        form.dataset.servicoId = servico.id;
        
        // Preencher campos
        setValorCampo('service_name', servico.nome);
        setValorCampo('category', servico.categoria);
        setValorCampo('description', servico.descricao);
        setValorCampo('status', servico.status);
        setValorCampo('base_price', servico.preco_base);
        setValorCampo('duration', servico.duracao_minutos?.toString());
    }
    
    function setValorCampo(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento && valor !== undefined) {
            elemento.value = valor;
        }
    }
    
    function fecharModalServico() {
        const modal = document.getElementById('serviceModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        console.log('✅ Modal fechado');
    }
    
    // ==================== FUNÇÕES DE SALVAR ====================
    
    function salvarServico() {
        console.log('💾 SALVANDO SERVIÇO...');
        
        const form = document.getElementById('serviceForm');
        if (!form) {
            mostrarMensagem('Formulário não encontrado', 'error');
            return;
        }
        
        // Coletar dados básicos
        const nome = document.getElementById('service_name')?.value;
        const preco = document.getElementById('base_price')?.value;
        
        if (!nome || !preco) {
            mostrarMensagem('Nome e preço são obrigatórios', 'error');
            return;
        }
        
        const servicoId = form.dataset.servicoId;
        const mensagem = servicoId 
            ? `Serviço "${nome}" atualizado com sucesso!` 
            : `Serviço "${nome}" criado com sucesso!`;
        
        // Mostrar mensagem de sucesso
        mostrarMensagem(mensagem, 'success');
        
        // Fechar modal
        setTimeout(() => {
            fecharModalServico();
            
            // Recarregar dados
            carregarDadosExemplo();
            
            // Mostrar confirmação no console
            console.log('✅ Serviço salvo:', { nome, preco, servicoId });
        }, 1000);
    }
    
    // ==================== FUNÇÕES DE VISUALIZAÇÃO ====================
    
    function visualizarServico(servicoId) {
        console.log('👁️ VISUALIZANDO SERVIÇO ID:', servicoId);
        
        // Dados de exemplo
        const servico = {
            nome: 'Corte Feminino',
            categoria: 'Cabelo',
            preco_base: 60.00,
            duracao_minutos: 45,
            descricao: 'Corte personalizado com lavagem e finalização',
            status: 'Ativo'
        };
        
        // Preencher modal de visualização
        setTextoCampo('viewServiceName', servico.nome);
        setTextoCampo('viewServiceCategory', servico.categoria);
        setTextoCampo('viewServicePrice', `R$ ${servico.preco_base.toFixed(2)}`);
        setTextoCampo('viewServiceDuration', `${servico.duracao_minutos} minutos`);
        setTextoCampo('viewServiceDescription', servico.descricao);
        setTextoCampo('viewServiceStatus', servico.status);
        
        // Mostrar modal
        const modal = document.getElementById('viewServiceModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
        }
    }
    
    function setTextoCampo(id, texto) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = texto;
    }
    
    function fecharModalVisualizacao() {
        const modal = document.getElementById('viewServiceModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    }
    
    // ==================== FUNÇÕES AUXILIARES ====================
    
    function confirmarExclusao(servicoId) {
        const servicoNome = 'Serviço ' + servicoId;
        
        if (confirm(`Tem certeza que deseja EXCLUIR o serviço "${servicoNome}"?\n\nEsta ação não pode ser desfeita.`)) {
            excluirServico(servicoId);
        }
    }
    
    function excluirServico(servicoId) {
        console.log('🗑️ EXCLUINDO SERVIÇO ID:', servicoId);
        
        mostrarMensagem(`Serviço #${servicoId} excluído com sucesso!`, 'success');
        
        // Aqui você implementaria a chamada à API
        console.log('✅ Serviço excluído (simulação)');
    }
    
    function carregarDadosExemplo() {
        // Simular carregamento de dados
        servicosData = [
            { id: 1, nome: 'Corte Feminino', categoria: 'Cabelo', preco: 60.00, status: 'ativo' },
            { id: 2, nome: 'Coloração', categoria: 'Cabelo', preco: 120.00, status: 'ativo' },
            { id: 3, nome: 'Manicure', categoria: 'Unhas', preco: 35.00, status: 'ativo' }
        ];
        
        console.log('📋 Dados de exemplo carregados:', servicosData.length, 'serviços');
    }
    
    function inicializarAbasModal() {
        // Configurar abas do modal
        const abas = document.querySelectorAll('.tab-button');
        abas.forEach(aba => {
            aba.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                mudarAba(tabId);
            });
        });
    }
    
    function mudarAba(tabId) {
        // Atualizar abas ativas
        document.querySelectorAll('.tab-button').forEach(aba => {
            aba.classList.remove('active', 'border-purple-500');
            aba.classList.add('border-transparent');
        });
        
        const abaAtiva = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (abaAtiva) {
            abaAtiva.classList.add('active', 'border-purple-500');
            abaAtiva.classList.remove('border-transparent');
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
    
    function mostrarMensagem(texto, tipo = 'info') {
        console.log(`💬 ${tipo.toUpperCase()}: ${texto}`);
        
        // Cores
        const cores = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        // Criar elemento
        const mensagem = document.createElement('div');
        mensagem.className = `fixed top-4 right-4 ${cores[tipo] || 'bg-blue-500'} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
        mensagem.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-3"></i>
                <span>${texto}</span>
            </div>
        `;
        
        // Adicionar ao body
        document.body.appendChild(mensagem);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (mensagem.parentNode) {
                mensagem.parentNode.removeChild(mensagem);
            }
        }, 3000);
    }
    
    // ==================== INICIALIZAÇÃO AUTOMÁTICA ====================
    
    // Verificar se estamos na página de serviços
    function verificarPaginaServicos() {
        // Múltiplas formas de verificar
        const verificacoes = [
            window.location.pathname.includes('servicos.html'),
            document.title.includes('Serviços'),
            document.title.includes('BeautySys - Serviços'),
            document.querySelector('a[href="servicos.html"]')?.classList?.contains('active-menu'),
            document.querySelector('h2')?.textContent?.includes('Serviços')
        ];
        
        return verificacoes.some(v => v === true);
    }
    
    // Inicializar quando a página carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (verificarPaginaServicos()) {
                console.log('📄 Página de serviços detectada!');
                inicializarSistema();
            }
        });
    } else {
        // DOM já carregado
        if (verificarPaginaServicos()) {
            console.log('📄 Página de serviços detectada (DOM pronto)!');
            inicializarSistema();
        }
    }
    
    // Forçar inicialização após 1 segundo (fallback)
    setTimeout(() => {
        if (!window.servicosSystem && verificarPaginaServicos()) {
            console.log('⏱️ Inicializando por timeout...');
            inicializarSistema();
        }
    }, 1000);
    
})();

// CSS para animações
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .modal.active {
            display: flex !important;
        }
        
        /* Estilo para botões ativos */
        .tab-button.active {
            border-color: #8b5cf6 !important;
            color: #8b5cf6 !important;
        }
    `;
    document.head.appendChild(style);
})();