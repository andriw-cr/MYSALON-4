// profissionais-ui.js
// Gerencia toda a interface do usuário para profissionais

const ProfissionaisUI = {
    // Elementos DOM
    elementos: {
        btnNovoProfissional: null,
        professionalModal: null,
        viewProfessionalModal: null,
        cancelProfessional: null,
        closeViewProfessional: null,
        saveProfessional: null,
        editProfessionalFromView: null,
        professionalForm: null,
        profissionaisCards: null,
        professionalTable: null,
        searchInput: null
    },

    // Dados locais
    profissionaisData: [],
    professionalEditingId: null,
    currentProfessionalId: null,

    // Inicializar a UI
    init() {
        this.cacheElements();
        this.bindEvents();
        this.initFormFeatures();
    },

    // Cache de elementos DOM
    cacheElements() {
        this.elementos.btnNovoProfissional = document.getElementById('btnNovoProfissionais');
        this.elementos.professionalModal = document.getElementById('professionalModal');
        this.elementos.viewProfessionalModal = document.getElementById('viewProfessionalModal');
        this.elementos.cancelProfessional = document.getElementById('cancelProfessional');
        this.elementos.closeViewProfessional = document.getElementById('closeViewProfessional');
        this.elementos.saveProfessional = document.getElementById('saveProfessional');
        this.elementos.editProfessionalFromView = document.getElementById('editProfessionalFromView');
        this.elementos.professionalForm = document.getElementById('professionalForm');
        this.elementos.profissionaisCards = document.getElementById('profissionaisCards');
        this.elementos.professionalTable = document.querySelector('.professional-table');
        this.elementos.searchInput = document.querySelector('input[placeholder="Buscar..."]');
    },

    // Vincular eventos
    bindEvents() {
        // Event listeners para botões fixos
        if (this.elementos.btnNovoProfissional) {
            this.elementos.btnNovoProfissional.addEventListener('click', () => this.openProfessionalModal());
        }

        if (this.elementos.cancelProfessional) {
            this.elementos.cancelProfessional.addEventListener('click', () => this.closeProfessionalModal());
        }

        if (this.elementos.closeViewProfessional) {
            this.elementos.closeViewProfessional.addEventListener('click', () => this.closeViewProfessionalModal());
        }

        if (this.elementos.saveProfessional) {
            this.elementos.saveProfessional.addEventListener('click', () => this.saveProfessionalHandler());
        }

        if (this.elementos.editProfessionalFromView) {
            this.elementos.editProfessionalFromView.addEventListener('click', () => this.editProfessionalFromViewHandler());
        }

        // Delegação de eventos para botões dinâmicos
        document.addEventListener('click', (e) => this.handleDynamicEvents(e));
    },

    // Manipular eventos dinâmicos
    handleDynamicEvents(e) {
        // Botões de editar profissional
        if (e.target.closest('.edit-professional')) {
            const button = e.target.closest('.edit-professional');
            const professionalId = button.getAttribute('data-id');
            this.openProfessionalModal(professionalId);
        }

        // Botões de visualizar profissional
        if (e.target.closest('.view-professional')) {
            const button = e.target.closest('.view-professional');
            const professionalId = button.getAttribute('data-id');
            this.openViewProfessionalModal(professionalId);
        }

        // Botões de excluir profissional
        if (e.target.closest('.delete-professional')) {
            const button = e.target.closest('.delete-professional');
            const professionalId = button.getAttribute('data-id');
            this.deleteProfessional(professionalId);
        }
    },

    // Inicializar funcionalidades do formulário
    initFormFeatures() {
        this.initTabs();
        this.initHorariosCheckboxes();
        this.loadServicosForSelect();
        
        // Busca de serviços
        const searchInput = document.getElementById('searchServicos');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterServicos(searchInput.value));
        }
        
        // Foto preview hover effect
        const photoContainer = document.querySelector('.relative.mx-auto.w-32.h-32');
        if (photoContainer) {
            const hoverDiv = photoContainer.querySelector('.absolute');
            photoContainer.addEventListener('mouseenter', () => {
                hoverDiv.classList.remove('opacity-0');
            });
            photoContainer.addEventListener('mouseleave', () => {
                hoverDiv.classList.add('opacity-0');
            });
        }
    },

    // Sistema de tabs
    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => {
                    btn.classList.remove('active', 'border-purple-500', 'text-purple-600');
                    btn.classList.add('border-transparent', 'text-gray-500');
                });
                
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    content.classList.add('hidden');
                });
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active', 'border-purple-500', 'text-purple-600');
                button.classList.remove('border-transparent', 'text-gray-500');
                
                const tabContent = document.getElementById(`tab-${tabId}`);
                if (tabContent) {
                    tabContent.classList.remove('hidden');
                    tabContent.classList.add('active');
                }
            });
        });
    },

    // Inicializar checkboxes de horários
    initHorariosCheckboxes() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][name^="horarios"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const row = this.closest('.grid');
                const timeInputs = row.querySelectorAll('input[type="time"]');
                timeInputs.forEach(input => {
                    input.disabled = !this.checked;
                    if (!this.checked) {
                        input.value = '00:00';
                    }
                });
            });
        });
    },

    // Carregar serviços para seleção
    async loadServicosForSelect() {
        try {
            const servicos = await ProfissionaisService.getServicos();
            const servicosList = document.getElementById('servicosList');
            
            if (servicosList) {
                servicosList.innerHTML = servicos.map(servico => `
                    <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-purple-50">
                        <div class="flex items-center">
                            <input type="checkbox" id="servico-${servico.id}" name="servicos[]" value="${servico.id}" 
                                   class="h-4 w-4 text-purple-600 rounded mr-3">
                            <div>
                                <label for="servico-${servico.id}" class="font-medium text-gray-900">${servico.nome}</label>
                                <p class="text-sm text-gray-500">${servico.descricao || ''}</p>
                            </div>
                        </div>
                        <span class="text-sm font-medium text-purple-600">R$ ${parseFloat(servico.preco).toFixed(2)}</span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
        }
    },

    // Filtrar serviços na busca
    filterServicos(searchTerm) {
        const servicosItems = document.querySelectorAll('#servicosList > div');
        searchTerm = searchTerm.toLowerCase();
        
        servicosItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    },

    // Funções para o formulário avançado
    previewPhoto(event) {
        const input = event.target;
        const preview = document.getElementById('photoPreview');
        
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
            }
            reader.readAsDataURL(input.files[0]);
        }
    },

    formatCPF(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d)/, '$1.$2')
                         .replace(/(\d{3})(\d)/, '$1.$2')
                         .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        
        input.value = value;
    },

    formatPhone(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        
        if (value.length === 11) {
            value = value.replace(/(\d{2})(\d)/, '($1) $2')
                         .replace(/(\d{5})(\d)/, '$1-$2');
        } else if (value.length === 10) {
            value = value.replace(/(\d{2})(\d)/, '($1) $2')
                         .replace(/(\d{4})(\d)/, '$1-$2');
        }
        
        input.value = value;
    },

    formatCEP(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 8) {
            value = value.substring(0, 8);
        }
        
        if (value.length > 5) {
            value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        }
        
        input.value = value;
    },

    // Renderizar tabela de profissionais
    renderProfissionaisTable(profissionais) {
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
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusClass(profissional.status)}">
                        ${this.getStatusText(profissional.status)}
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
                                onclick="window.location.href='agenda.html?profissional=${profissional.id}'">
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
    },

    // Atualizar estatísticas
    updateStats(profissionais) {
        try {
            console.log('📊 Atualizando estatísticas...');
            
            const profissionaisAtivos = profissionais.filter(p => p.status === 'ativo').length;
            const profissionaisTotal = profissionais.length;
            
            // Calcular comissão média
            const comissoes = profissionais
                .filter(p => p.comissao)
                .map(p => parseFloat(p.comissao) || 0);
            const comissaoMedia = comissoes.length > 0 
                ? Math.round(comissoes.reduce((a, b) => a + b, 0) / comissoes.length)
                : 0;

            // Contar férias
            const feriasCount = profissionais.filter(p => p.status === 'ferias').length;

            console.log(`📈 Dados calculados: Total=${profissionaisTotal}, Ativos=${profissionaisAtivos}, Comissão=${comissaoMedia}%, Férias=${feriasCount}`);

            // Atualizar os cards de estatísticas
            const statsCards = document.querySelectorAll('.bg-white.rounded-lg.shadow.p-4');
            
            if (statsCards.length >= 4) {
                // Card 1: Total de Profissionais
                const totalValue = statsCards[0].querySelector('h3.text-xl');
                if (totalValue) totalValue.textContent = profissionaisTotal;
                
                // Card 2: Ativos
                const ativosValue = statsCards[1].querySelector('h3.text-xl');
                if (ativosValue) ativosValue.textContent = profissionaisAtivos;
                
                // Card 3: Comissão Média
                const comissaoValue = statsCards[2].querySelector('h3.text-xl');
                if (comissaoValue) comissaoValue.textContent = comissaoMedia + '%';
                
                // Card 4: Férias Programadas
                const feriasValue = statsCards[3].querySelector('h3.text-xl');
                if (feriasValue) feriasValue.textContent = feriasCount;
            }
            
            console.log(`🎯 Estatísticas atualizadas com sucesso!`);
            
        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error);
        }
    },

    // Abrir modal de profissional
    async openProfessionalModal(professionalId = null) {
        try {
            this.professionalEditingId = professionalId;
            
            if (professionalId) {
                // Modo edição
                document.getElementById('modalTitle').textContent = 'Editar Profissional';
                await this.loadProfessionalData(professionalId);
            } else {
                // Modo criação
                document.getElementById('modalTitle').textContent = 'Novo Profissional';
                this.clearProfessionalForm();
            }
            
            this.elementos.professionalModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Erro ao abrir modal:', error);
            showNotification('Erro ao carregar dados do profissional', 'error');
        }
    },

    // Fechar modal de profissional
    closeProfessionalModal() {
        this.elementos.professionalModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.professionalEditingId = null;
    },

    // Funções auxiliares
    getStatusClass(status) {
        switch(status) {
            case 'ativo': return 'bg-green-100 text-green-800';
            case 'inativo': return 'bg-red-100 text-red-800';
            case 'ferias': return 'bg-yellow-100 text-yellow-800';
            case 'afastado': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    },

    getStatusText(status) {
        switch(status) {
            case 'ativo': return 'Ativo';
            case 'inativo': return 'Inativo';
            case 'ferias': return 'Férias';
            case 'afastado': return 'Afastado';
            default: return status || 'Desconhecido';
        }
    },

    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch {
            return dateString;
        }
    },

    // Validação do formulário
    validateProfessionalForm() {
        const requiredFields = ['nome', 'cpf', 'telefone', 'email', 'funcao', 'especialidade', 'comissao'];
        const form = document.getElementById('professionalForm');
        
        for (const field of requiredFields) {
            const input = form.querySelector(`[name="${field}"]`);
            if (input && !input.value.trim()) {
                showNotification(`O campo ${field.replace('_', ' ')} é obrigatório`, 'error');
                input.focus();
                return false;
            }
        }
        
        // Validação de email
        const emailInput = form.querySelector('[name="email"]');
        if (emailInput.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value)) {
                showNotification('Email inválido', 'error');
                emailInput.focus();
                return false;
            }
        }
        
        return true;
    },

    // Obter dados do formulário
    getProfessionalFormData() {
        const form = document.getElementById('professionalForm');
        const formData = new FormData(form);
        const data = {};
        
        // Campos básicos
        const basicFields = ['nome', 'cpf', 'data_nascimento', 'genero', 'estado_civil', 
                           'rg', 'data_admissao', 'telefone', 'email', 'endereco', 
                           'cidade', 'estado', 'cep', 'funcao', 'especialidade', 
                           'habilidades', 'experiencia', 'tipo_contrato', 'salario_base', 
                           'comissao', 'status', 'observacoes', 'intervalo_inicio', 'intervalo_fim'];
        
        basicFields.forEach(field => {
            const value = formData.get(field);
            if (value !== null && value !== undefined) {
                data[field] = value;
            }
        });
        
        // Horários de trabalho
        const horarios = {};
        ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].forEach(dia => {
            const ativa = formData.get(`horarios[${dia}][ativa]`) === 'on';
            const inicio = formData.get(`horarios[${dia}][inicio]`);
            const fim = formData.get(`horarios[${dia}][fim]`);
            
            horarios[dia] = {
                ativa,
                inicio: ativa ? inicio : null,
                fim: ativa ? fim : null
            };
        });
        
        data.horarios = horarios;
        
        // Serviços associados
        const servicosSelecionados = formData.getAll('servicos[]');
        data.servicos = servicosSelecionados.map(id => parseInt(id));
        
        // Foto (se houver)
        const foto = formData.get('foto');
        if (foto && foto.size > 0) {
            data.foto = foto;
        }
        
        return data;
    },

    // Limpar formulário
    clearProfessionalForm() {
        const form = document.getElementById('professionalForm');
        if (form) {
            form.reset();
            document.getElementById('photoPreview').src = 'https://ui-avatars.com/api/?name=Novo+Profissional&background=8b5cf6&color=fff&size=128';
            
            // Resetar horários
            const timeInputs = form.querySelectorAll('input[type="time"]');
            timeInputs.forEach(input => {
                if (!input.name.includes('domingo')) {
                    input.disabled = false;
                }
            });
        }
    }
};