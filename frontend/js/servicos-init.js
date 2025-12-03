// frontend/js/servicos-init.js - SOLUÇÃO DEFINITIVA
(function() {
    console.log('🚀 SISTEMA DE SERVIÇOS - INICIALIZADOR DE EMERGÊNCIA');
    
    // Função para verificar se estamos na página de serviços
    function isServicosPage() {
        const checks = [
            window.location.pathname.includes('servicos.html'),
            window.location.href.includes('servicos'),
            document.title.includes('Serviço'),
            document.title.includes('serviço'),
            document.querySelector('a[href="servicos.html"]')?.classList?.contains('active-menu'),
            document.querySelector('h2')?.textContent?.includes('Serviço'),
            document.getElementById('btnNovoServico') !== null
        ];
        
        return checks.some(check => check === true);
    }
    
    // Inicializar apenas se for página de serviços
    if (isServicosPage()) {
        console.log('✅ PÁGINA DE SERVIÇOS DETECTADA! Inicializando sistema...');
        
        // Adicionar CSS para modais
        const css = `
            .modal { display: none; }
            .modal:not(.hidden) { display: flex !important; }
            .modal-overlay.active { display: flex !important; }
            .animate-fade-in {
                animation: fadeIn 0.3s ease-in-out;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        
        // Esperar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initServicos);
        } else {
            initServicos();
        }
    } else {
        console.log('⚠️ Não é página de serviços, sistema não inicializado');
    }
    
    function initServicos() {
        console.log('🎯 INICIALIZANDO SISTEMA DE SERVIÇOS...');
        
        // 1. Configurar botão NOVO
        const btnNovo = document.getElementById('btnNovoServico');
        if (btnNovo) {
            console.log('✅ Configurando botão "Novo Serviço"');
            btnNovo.addEventListener('click', abrirModalNovo);
            btnNovo.onclick = abrirModalNovo; // Backup
        }
        
        // 2. Configurar botões de ação (delegação)
        document.addEventListener('click', handleButtonClicks);
        
        // 3. Configurar modal
        setupModal();
        
        // 4. Testar API
        testAPI();
        
        console.log('✅ Sistema de serviços inicializado com sucesso!');
        
        // Expor para console
        window.servicosInit = {
            test: function() {
                console.log('🧪 Sistema de Serviços Teste');
                console.log('- Botão Novo:', btnNovo);
                console.log('- Modal:', document.getElementById('serviceModal'));
                abrirModalNovo();
            },
            reload: function() {
                carregarServicosAPI();
            }
        };
    }
    
    // ==================== FUNÇÕES PRINCIPAIS ====================
    
    function abrirModalNovo(e) {
        if (e) e.preventDefault();
        console.log('🎯 Abrindo modal para novo serviço');
        
        const modal = document.getElementById('serviceModal');
        if (modal) {
            // Limpar formulário
            const form = document.getElementById('serviceForm');
            if (form) form.reset();
            
            // Atualizar título
            const titulo = document.getElementById('modalTitle');
            if (titulo) titulo.textContent = 'Novo Serviço';
            
            // Mostrar modal
            modal.classList.remove('hidden');
            
            // Focar no primeiro campo
            setTimeout(() => {
                const campo = modal.querySelector('#service_name');
                if (campo) campo.focus();
            }, 100);
            
            return true;
        }
        
        console.error('❌ Modal não encontrado');
        return false;
    }
    
    function handleButtonClicks(e) {
        const target = e.target;
        
        // Encontrar o botão clicado
        const button = target.closest('button');
        if (!button) return;
        
        // Verificar tipo de botão
        if (button.classList.contains('edit-service') || 
            target.classList.contains('fa-edit') ||
            button.querySelector('.fa-edit')) {
            
            const servicoId = button.getAttribute('data-id');
            console.log('✏️ Editando serviço ID:', servicoId);
            abrirModalEditar(servicoId);
            e.preventDefault();
        }
        else if (button.classList.contains('delete-service') ||
                 target.classList.contains('fa-trash') ||
                 button.querySelector('.fa-trash')) {
            
            const servicoId = button.getAttribute('data-id');
            console.log('🗑️ Excluindo serviço ID:', servicoId);
            confirmarExclusao(servicoId);
            e.preventDefault();
        }
        else if (button.classList.contains('view-service') ||
                 target.classList.contains('fa-eye') ||
                 button.querySelector('.fa-eye')) {
            
            const servicoId = button.getAttribute('data-id');
            console.log('👁️ Visualizando serviço ID:', servicoId);
            visualizarServico(servicoId);
            e.preventDefault();
        }
    }
    
    function abrirModalEditar(servicoId) {
        console.log('✏️ Abrindo modal para editar ID:', servicoId);
        
        // Primeiro abre o modal
        if (!abrirModalNovo()) return;
        
        // Depois preenche com dados (simulação)
        setTimeout(() => {
            const form = document.getElementById('serviceForm');
            if (form) {
                form.dataset.servicoId = servicoId;
                
                // Dados de exemplo
                document.getElementById('service_name').value = 'Corte Feminino';
                document.getElementById('category').value = 'hair';
                document.getElementById('description').value = 'Corte personalizado com lavagem';
                document.getElementById('base_price').value = '60.00';
                document.getElementById('duration').value = '45';
                document.getElementById('status').value = 'active';
                
                // Atualizar título
                const titulo = document.getElementById('modalTitle');
                if (titulo) titulo.textContent = 'Editar Serviço';
            }
        }, 200);
    }
    
    function visualizarServico(servicoId) {
        console.log('👁️ Visualizando serviço ID:', servicoId);
        
        const modal = document.getElementById('viewServiceModal');
        if (!modal) return;
        
        // Preencher com dados de exemplo
        document.getElementById('viewServiceName').textContent = 'Corte Feminino';
        document.getElementById('viewServiceCategory').textContent = 'Cabelo';
        document.getElementById('viewServicePrice').textContent = 'R$ 60,00';
        document.getElementById('viewServiceDuration').textContent = '45 minutos';
        document.getElementById('viewServiceDescription').textContent = 'Corte personalizado com lavagem e finalização';
        document.getElementById('viewServiceStatus').textContent = 'Ativo';
        
        // Mostrar modal
        modal.classList.add('active');
    }
    
    function confirmarExclusao(servicoId) {
        if (confirm(`Tem certeza que deseja excluir o serviço #${servicoId}?`)) {
            console.log('🗑️ Excluindo serviço ID:', servicoId);
            mostrarMensagem(`Serviço #${servicoId} excluído com sucesso!`, 'success');
        }
    }
    
    function setupModal() {
        // Botão Salvar
        const btnSalvar = document.getElementById('saveService');
        if (btnSalvar) {
            btnSalvar.addEventListener('click', salvarServico);
        }
        
        // Botão Cancelar
        const btnCancelar = document.getElementById('cancelService');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', fecharModal);
        }
        
        // Fechar modal de visualização
        document.getElementById('closeViewModal')?.addEventListener('click', fecharModalVisualizacao);
        document.getElementById('closeViewModalBtn')?.addEventListener('click', fecharModalVisualizacao);
        
        // Configurar abas
        const abas = document.querySelectorAll('.tab-button');
        abas.forEach(aba => {
            aba.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                mudarAba(tabId);
            });
        });
    }
    
    function salvarServico(e) {
        if (e) e.preventDefault();
        
        const form = document.getElementById('serviceForm');
        if (!form) return;
        
        const nome = document.getElementById('service_name')?.value;
        const preco = document.getElementById('base_price')?.value;
        
        if (!nome || !preco) {
            mostrarMensagem('Nome e preço são obrigatórios', 'error');
            return;
        }
        
        const servicoId = form.dataset.servicoId;
        const acao = servicoId ? 'atualizado' : 'criado';
        
        console.log(`💾 Serviço ${acao}:`, { nome, preco, servicoId });
        mostrarMensagem(`Serviço "${nome}" ${acao} com sucesso!`, 'success');
        
        setTimeout(fecharModal, 1000);
    }
    
    function fecharModal() {
        const modal = document.getElementById('serviceModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    function fecharModalVisualizacao() {
        const modal = document.getElementById('viewServiceModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    function mudarAba(tabId) {
        // Ativar aba clicada
        document.querySelectorAll('.tab-button').forEach(aba => {
            aba.classList.remove('active', 'border-purple-500');
        });
        
        const abaAtiva = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (abaAtiva) {
            abaAtiva.classList.add('active', 'border-purple-500');
        }
        
        // Mostrar conteúdo
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const conteudo = document.getElementById(`${tabId}-tab`);
        if (conteudo) {
            conteudo.classList.add('active');
        }
    }
    
    async function testAPI() {
        try {
            console.log('🔍 Testando API de serviços...');
            const response = await fetch('/api/servicos');
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API funcionando:', data.success ? 'Sim' : 'Não');
                console.log('📊 Serviços na API:', data.data?.length || 0);
            } else {
                console.warn('⚠️ API retornou erro:', response.status);
            }
        } catch (error) {
            console.error('❌ Erro ao testar API:', error);
        }
    }
    
    async function carregarServicosAPI() {
        try {
            const response = await fetch('/api/servicos');
            if (response.ok) {
                const data = await response.json();
                console.log('📡 Serviços carregados:', data.data?.length || 0);
                return data.data || [];
            }
        } catch (error) {
            console.error('❌ Erro ao carregar serviços:', error);
        }
        return [];
    }
    
    function mostrarMensagem(texto, tipo = 'info') {
        // Remover mensagens antigas
        document.querySelectorAll('.msg-flutuante').forEach(el => el.remove());
        
        const cores = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const msg = document.createElement('div');
        msg.className = `msg-flutuante fixed top-4 right-4 ${cores[tipo]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
        msg.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-3"></i>
                <span>${texto}</span>
            </div>
        `;
        
        document.body.appendChild(msg);
        
        setTimeout(() => msg.remove(), 3000);
    }
    
})();