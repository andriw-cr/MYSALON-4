// Sistema de Profissionais - Frontend
document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais
    const btnNovoProfissional = document.getElementById('btnNovoProfissional');
    const professionalModal = document.getElementById('professionalModal');
    const viewProfessionalModal = document.getElementById('viewProfessionalModal');
    const cancelProfessional = document.getElementById('cancelProfessional');
    const closeViewProfessional = document.getElementById('closeViewProfessional');
    const saveProfessional = document.getElementById('saveProfessional');
    const editProfessionalFromView = document.getElementById('editProfessionalFromView');
    
    // Dados globais
    let profissionaisData = [];
    let professionalEditingId = null;
    let currentProfessionalId = null;

    // Inicialização
    initProfissionais();

    // Event Listeners
    if (btnNovoProfissional) {
        btnNovoProfissional.addEventListener('click', () => openProfessionalModal());
    }

    if (cancelProfessional) {
        cancelProfessional.addEventListener('click', () => closeProfessionalModal());
    }

    if (closeViewProfessional) {
        closeViewProfessional.addEventListener('click', () => closeViewProfessionalModal());
    }

    if (saveProfessional) {
        saveProfessional.addEventListener('click', () => saveProfessionalHandler());
    }

    if (editProfessionalFromView) {
        editProfessionalFromView.addEventListener('click', () => editProfessionalFromViewHandler());
    }

    // Delegação de eventos para botões dinâmicos
    document.addEventListener('click', function(e) {
        // Botões de editar profissional
        if (e.target.closest('.edit-professional')) {
            const button = e.target.closest('.edit-professional');
            const professionalId = button.getAttribute('data-id');
            openProfessionalModal(professionalId);
        }

        // Botões de visualizar profissional
        if (e.target.closest('.view-professional')) {
            const button = e.target.closest('.view-professional');
            const professionalId = button.getAttribute('data-id');
            openViewProfessionalModal(professionalId);
        }

        // Botões de excluir profissional
        if (e.target.closest('.delete-professional')) {
            const button = e.target.closest('.delete-professional');
            const professionalId = button.getAttribute('data-id');
            deleteProfessional(professionalId);
        }

        // Botões de ver agenda
        if (e.target.closest('[data-action="ver-agenda"]')) {
            const button = e.target.closest('[data-action="ver-agenda"]');
            const professionalId = button.getAttribute('data-id');
            window.location.href = `agenda.html?profissional=${professionalId}`;
        }
    });

    // Funções de inicialização
    async function initProfissionais() {
        try {
            await loadProfissionais();
            updateStats();
            setupEventListeners();
        } catch (error) {
            console.error('Erro ao inicializar profissionais:', error);
            showNotification('Erro ao carregar profissionais', 'error');
        }
    }

    // Carregar profissionais da API
    async function loadProfissionais() {
        try {
            showLoading();
            const profissionais = await ApiService.get('/api/profissionais');
            
            profissionaisData = profissionais;
            renderProfissionaisTable(profissionais);
            renderProfissionaisCards(profissionais);
            
            hideLoading();
            return profissionais;
        } catch (error) {
            console.error('Erro ao carregar profissionais:', error);
            showNotification('Erro ao carregar profissionais', 'error');
            hideLoading();
            throw error;
        }
    }

    // Renderizar tabela de profissionais
    function renderProfissionaisTable(profissionais) {
        const tableBody = document.querySelector('.professional-table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (!profissionais || profissionais.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        Nenhum profissional encontrado
                    </td>
                </tr>
            `;
            return;
        }

        profissionais.forEach(profissional => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-full" 
                                 src="https://ui-avatars.com/api/?name=${encodeURIComponent(profissional.nome)}&background=8b5cf6&color=fff" 
                                 alt="${profissional.nome}">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${profissional.nome}</div>
                            <div class="text-sm text-gray-500">CPF: ${profissional.cpf || 'Não informado'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${profissional.especialidade || 'Não informada'}</div>
                    <div class="text-sm text-gray-500">${profissional.funcao || 'Profissional'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${profissional.telefone || 'Não informado'}</div>
                    <div class="text-sm text-gray-500">${profissional.email || 'Não informado'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${profissional.comissao ? profissional.comissao + '%' : 'Não definida'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(profissional.status)}">
                        ${getStatusText(profissional.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button class="tooltip text-purple-600 hover:text-purple-900 edit-professional" 
                                data-id="${profissional.id}">
                            <i class="fas fa-edit"></i>
                            <span class="tooltip-text">Editar Profissional</span>
                        </button>
                        <button class="tooltip text-blue-600 hover:text-blue-900 view-professional" 
                                data-id="${profissional.id}">
                            <i class="fas fa-eye"></i>
                            <span class="tooltip-text">Visualizar Detalhes</span>
                        </button>
                        <button class="tooltip text-green-600 hover:text-green-900" 
                                data-action="ver-agenda" 
                                data-id="${profissional.id}">
                            <i class="fas fa-calendar-alt"></i>
                            <span class="tooltip-text">Ver Agenda</span>
                        </button>
                        <button class="tooltip ${profissional.status === 'ativo' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} delete-professional" 
                                data-id="${profissional.id}">
                            <i class="fas ${profissional.status === 'ativo' ? 'fa-trash' : 'fa-check'}"></i>
                            <span class="tooltip-text">${profissional.status === 'ativo' ? 'Inativar Profissional' : 'Reativar Profissional'}</span>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Renderizar cards de profissionais (para visão alternativa)
    function renderProfissionaisCards(profissionais) {
        const cardsContainer = document.getElementById('profissionaisCards');
        if (!cardsContainer) return;

        // Se não houver container de cards, não renderizar
        if (!document.querySelector('.profissionais-cards-container')) {
            return;
        }

        cardsContainer.innerHTML = '';

        profissionais.slice(0, 6).forEach(profissional => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow p-6';
            card.innerHTML = `
                <div class="flex items-center mb-4">
                    <img class="h-16 w-16 rounded-full mr-4" 
                         src="https://ui-avatars.com/api/?name=${encodeURIComponent(profissional.nome)}&background=8b5cf6&color=fff" 
                         alt="${profissional.nome}">
                    <div>
                        <h4 class="font-bold text-lg">${profissional.nome}</h4>
                        <p class="text-gray-600 text-sm">${profissional.especialidade}</p>
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(profissional.status)}">
                            ${getStatusText(profissional.status)}
                        </span>
                    </div>
                </div>
                <div class="space-y-2 mb-4">
                    <div class="flex items-center text-sm">
                        <i class="fas fa-phone text-gray-400 mr-2"></i>
                        <span>${profissional.telefone || 'Não informado'}</span>
                    </div>
                    <div class="flex items-center text-sm">
                        <i class="fas fa-percentage text-gray-400 mr-2"></i>
                        <span>Comissão: ${profissional.comissao || '0'}%</span>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button class="flex-1 bg-purple-100 text-purple-700 py-2 rounded text-sm edit-professional" 
                            data-id="${profissional.id}">
                        <i class="fas fa-edit mr-1"></i> Editar
                    </button>
                    <button class="flex-1 bg-blue-100 text-blue-700 py-2 rounded text-sm view-professional" 
                            data-id="${profissional.id}">
                        <i class="fas fa-eye mr-1"></i> Ver
                    </button>
                </div>
            `;
            cardsContainer.appendChild(card);
        });
    }

    // Atualizar estatísticas
    async function updateStats() {
        try {
            const profissionaisAtivos = profissionaisData.filter(p => p.status === 'ativo').length;
            const profissionaisTotal = profissionaisData.length;
            
            // Calcular comissão média
            const comissoes = profissionaisData
                .filter(p => p.comissao)
                .map(p => parseFloat(p.comissao) || 0);
            const comissaoMedia = comissoes.length > 0 
                ? (comissoes.reduce((a, b) => a + b, 0) / comissoes.length).toFixed(0)
                : 0;

            // Atualizar elementos (se existirem)
            const totalEl = document.querySelector('[data-stat="total"]');
            const ativosEl = document.querySelector('[data-stat="ativos"]');
            const comissaoEl = document.querySelector('[data-stat="comissao-media"]');
            
            if (totalEl) totalEl.textContent = profissionaisTotal;
            if (ativosEl) ativosEl.textContent = profissionaisAtivos;
            if (comissaoEl) comissaoEl.textContent = comissaoMedia + '%';
            
        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    }

    // Abrir modal de profissional (criação/edição)
    async function openProfessionalModal(professionalId = null) {
        try {
            professionalEditingId = professionalId;
            const modal = document.getElementById('professionalModal');
            
            if (professionalId) {
                // Modo edição
                document.getElementById('modalTitle').textContent = 'Editar Profissional';
                await loadProfessionalData(professionalId);
            } else {
                // Modo criação
                document.getElementById('modalTitle').textContent = 'Novo Profissional';
                clearProfessionalForm();
            }
            
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Erro ao abrir modal:', error);
            showNotification('Erro ao carregar dados do profissional', 'error');
        }
    }

    // Fechar modal de profissional
    function closeProfessionalModal() {
        const modal = document.getElementById('professionalModal');
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        professionalEditingId = null;
    }

    // Abrir modal de visualização
    async function openViewProfessionalModal(professionalId) {
        try {
            currentProfessionalId = professionalId;
            await loadProfessionalViewData(professionalId);
            
            const modal = document.getElementById('viewProfessionalModal');
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Erro ao abrir modal de visualização:', error);
            showNotification('Erro ao carregar dados do profissional', 'error');
        }
    }

    // Fechar modal de visualização
    function closeViewProfessionalModal() {
        const modal = document.getElementById('viewProfessionalModal');
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        currentProfessionalId = null;
    }

    // Carregar dados do profissional para edição
    async function loadProfessionalData(professionalId) {
        try {
            const profissional = await ApiService.get(`/api/profissionais/${professionalId}`);
            
            // Preencher formulário (adaptar conforme estrutura do formulário)
            const form = document.getElementById('professionalForm');
            if (form) {
                Object.keys(profissional).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = profissional[key] || '';
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao carregar dados do profissional:', error);
            throw error;
        }
    }

    // Carregar dados do profissional para visualização
    async function loadProfessionalViewData(professionalId) {
        try {
            const profissional = await ApiService.get(`/api/profissionais/${professionalId}`);
            
            // Preencher dados básicos
            document.getElementById('viewProfessionalName').textContent = profissional.nome;
            document.getElementById('viewProfessionalInfo').textContent = 
                `${profissional.especialidade || 'Profissional'} • CPF: ${profissional.cpf || 'Não informado'}`;
            
            // Status
            const statusEl = document.getElementById('viewProfessionalStatus');
            statusEl.textContent = getStatusText(profissional.status);
            statusEl.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(profissional.status)}`;
            
            // Informações pessoais
            document.getElementById('viewProfessionalBirthdate').textContent = 
                formatDate(profissional.data_nascimento) || 'Não informada';
            document.getElementById('viewProfessionalGender').textContent = 
                profissional.genero || 'Não informado';
            document.getElementById('viewProfessionalAdmission').textContent = 
                formatDate(profissional.data_admissao) || 'Não informada';
            
            // Contato
            document.getElementById('viewProfessionalPhone').textContent = 
                profissional.telefone || 'Não informado';
            document.getElementById('viewProfessionalEmail').textContent = 
                profissional.email || 'Não informado';
            document.getElementById('viewProfessionalAddress').textContent = 
                profissional.endereco || 'Não informado';
            
            // Informações profissionais
            document.getElementById('viewProfessionalRole').textContent = 
                profissional.funcao || 'Não informada';
            document.getElementById('viewProfessionalSpecialties').textContent = 
                profissional.especialidade || 'Não informada';
            document.getElementById('viewProfessionalContract').textContent = 
                profissional.tipo_contrato || 'Não informado';
            
            // Financeiro
            document.getElementById('viewProfessionalSalary').textContent = 
                profissional.salario ? `R$ ${parseFloat(profissional.salario).toFixed(2)}` : 'Não definido';
            document.getElementById('viewProfessionalCommission').textContent = 
                profissional.comissao ? profissional.comissao + '%' : 'Não definida';
            
            // Carregar estatísticas do profissional
            await loadProfessionalStatistics(professionalId);
            
        } catch (error) {
            console.error('Erro ao carregar dados para visualização:', error);
            throw error;
        }
    }

    // Carregar estatísticas do profissional
    async function loadProfessionalStatistics(professionalId) {
        try {
            const estatisticas = await ApiService.get(`/api/profissionais/${professionalId}/estatisticas`);
            
            if (estatisticas) {
                document.getElementById('viewProfessionalTotalServices').textContent = 
                    estatisticas.total_agendamentos || '0';
                document.getElementById('viewProfessionalRevenue').textContent = 
                    estatisticas.valor_medio ? `R$ ${parseFloat(estatisticas.valor_medio).toFixed(2)}` : 'R$ 0,00';
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    // Salvar profissional (criação/edição)
    async function saveProfessionalHandler() {
        try {
            // Validar formulário
            if (!validateProfessionalForm()) {
                return;
            }

            const formData = getProfessionalFormData();
            
            if (professionalEditingId) {
                // Editar profissional existente
                await ApiService.put(`/api/profissionais/${professionalEditingId}`, formData);
                showNotification('Profissional atualizado com sucesso!', 'success');
            } else {
                // Criar novo profissional
                await ApiService.post('/api/profissionais', formData);
                showNotification('Profissional criado com sucesso!', 'success');
            }

            // Recarregar lista
            await loadProfissionais();
            closeProfessionalModal();
            
        } catch (error) {
            console.error('Erro ao salvar profissional:', error);
            showNotification(error.message || 'Erro ao salvar profissional', 'error');
        }
    }

    // Excluir/Inativar profissional
    async function deleteProfessional(professionalId) {
        try {
            const profissional = profissionaisData.find(p => p.id == professionalId);
            if (!profissional) {
                showNotification('Profissional não encontrado', 'error');
                return;
            }

            const confirmMessage = profissional.status === 'ativo' 
                ? 'Tem certeza que deseja inativar este profissional?'
                : 'Tem certeza que deseja reativar este profissional?';
            
            if (!confirm(confirmMessage)) {
                return;
            }

            if (profissional.status === 'ativo') {
                // Inativar
                await ApiService.delete(`/api/profissionais/${professionalId}`);
                showNotification('Profissional inativado com sucesso!', 'success');
            } else {
                // Reativar
                await ApiService.patch(`/api/profissionais/${professionalId}/reativar`);
                showNotification('Profissional reativado com sucesso!', 'success');
            }

            // Recarregar lista
            await loadProfissionais();
            
        } catch (error) {
            console.error('Erro ao alterar status do profissional:', error);
            showNotification(error.message || 'Erro ao alterar status', 'error');
        }
    }

    // Editar profissional a partir da visualização
    function editProfessionalFromViewHandler() {
        if (currentProfessionalId) {
            closeViewProfessionalModal();
            setTimeout(() => {
                openProfessionalModal(currentProfessionalId);
            }, 300);
        }
    }

    // Funções auxiliares
    function validateProfessionalForm() {
        // Implementar validação conforme campos do formulário
        const nome = document.querySelector('[name="nome"]')?.value;
        if (!nome || nome.trim() === '') {
            showNotification('O nome é obrigatório', 'error');
            return false;
        }
        return true;
    }

    function getProfessionalFormData() {
        // Implementar coleta de dados do formulário
        const form = document.getElementById('professionalForm');
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    function clearProfessionalForm() {
        const form = document.getElementById('professionalForm');
        if (form) {
            form.reset();
        }
    }

    function getStatusClass(status) {
        switch(status) {
            case 'ativo': return 'bg-green-100 text-green-800';
            case 'inativo': return 'bg-red-100 text-red-800';
            case 'ferias': return 'bg-yellow-100 text-yellow-800';
            case 'afastado': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getStatusText(status) {
        switch(status) {
            case 'ativo': return 'Ativo';
            case 'inativo': return 'Inativo';
            case 'ferias': return 'Férias';
            case 'afastado': return 'Afastado';
            default: return status || 'Desconhecido';
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    function showNotification(message, type = 'info') {
        // Usar a função de notificação do app.js
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    function showLoading() {
        // Implementar loading se necessário
        const loadingEl = document.getElementById('loadingProfissionais');
        if (loadingEl) {
            loadingEl.classList.remove('hidden');
        }
    }

    function hideLoading() {
        const loadingEl = document.getElementById('loadingProfissionais');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    }

    function setupEventListeners() {
        // Filtros
        const filterButtons = document.querySelectorAll('[data-filter]');
        filterButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const filter = e.target.getAttribute('data-filter');
                await applyFilter(filter);
            });
        });

        // Busca
        const searchInput = document.querySelector('input[placeholder="Buscar..."]');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(async (e) => {
                const searchTerm = e.target.value.toLowerCase();
                await applySearch(searchTerm);
            }, 300));
        }
    }

    async function applyFilter(filter) {
        try {
            let filteredData = [...profissionaisData];
            
            if (filter === 'ativos') {
                filteredData = filteredData.filter(p => p.status === 'ativo');
            } else if (filter === 'inativos') {
                filteredData = filteredData.filter(p => p.status === 'inativo');
            } else if (filter === 'ferias') {
                filteredData = filteredData.filter(p => p.status === 'ferias');
            }
            
            renderProfissionaisTable(filteredData);
        } catch (error) {
            console.error('Erro ao aplicar filtro:', error);
        }
    }

    async function applySearch(searchTerm) {
        if (!searchTerm) {
            renderProfissionaisTable(profissionaisData);
            return;
        }
        
        const filtered = profissionaisData.filter(profissional => 
            profissional.nome.toLowerCase().includes(searchTerm) ||
            profissional.email?.toLowerCase().includes(searchTerm) ||
            profissional.telefone?.includes(searchTerm) ||
            profissional.especialidade?.toLowerCase().includes(searchTerm)
        );
        
        renderProfissionaisTable(filtered);
    }

    // Debounce para busca
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});