// frontend/js/agenda.js
/**
 * SISTEMA PRINCIPAL DA AGENDA - Integração com Backend
 */

class AgendaSystem {
    constructor() {
        console.log('🚀 Inicializando AgendaSystem...');
        
        // Estado do sistema
        this.state = {
            agendamentos: [],
            profissionais: [],
            servicos: [],
            clientes: [],
            bloqueios: [],
            filtros: {
                data: new Date(),
                profissional_id: null,
                status: null,
                cliente_id: null
            },
            visualizacaoAtual: 'day', // day, week, month, list
            dataAtual: new Date()
        };
        
        // Referências DOM
        this.elements = {
            // Navegação
            currentDate: document.getElementById('currentDate'),
            prevDate: document.getElementById('prevDate'),
            nextDate: document.getElementById('nextDate'),
            openCalendar: document.getElementById('openCalendar'),
            
            // Filtros
            filterProfessional: document.getElementById('filterProfessional'),
            filterService: document.getElementById('filterService'),
            filterStatus: document.getElementById('filterStatus'),
            
            // Botões de ação
            btnNovoAgendamento: document.getElementById('btnNovoAgendamento'),
            btnBloquearHorario: document.getElementById('btnBloquearHorario'),
            btnEncaixeRapido: document.getElementById('btnEncaixeRapido'),
            
            // Visualizações
            viewButtons: document.querySelectorAll('.view-button'),
            agendaViews: document.querySelectorAll('.agenda-view'),
            
            // Modais
            appointmentModal: document.getElementById('appointmentModal'),
            blockTimeModal: document.getElementById('blockTimeModal'),
            quickFitModal: document.getElementById('quickFitModal'),
            checkoutModal: document.getElementById('checkoutModal'),
            appointmentDetailModal: document.getElementById('appointmentDetailModal'),
            
            // Estatísticas
            statsHoje: document.querySelectorAll('.bg-white.rounded-lg.shadow.p-4 h3'),
            
            // Agendamentos na grade
            appointmentBlocks: document.querySelectorAll('.appointment-block'),
            detailBtns: document.querySelectorAll('.detail-btn'),
            actionBtns: document.querySelectorAll('.action-btn'),
            confirmBtns: document.querySelectorAll('.confirm-btn'),
            startBtns: document.querySelectorAll('.start-btn'),
            completeBtns: document.querySelectorAll('.complete-btn'),
            cancelBtns: document.querySelectorAll('.cancel-appointment'),
            whatsappBtns: document.querySelectorAll('.whatsapp-btn')
        };
        
        this.init();
    }
    
    /**
     * Inicializar o sistema
     */
    async init() {
        try {
            console.log('📡 Conectando com backend...');
            
            // Verificar se ApiService está disponível
            if (typeof window.ApiService === 'undefined') {
                console.error('❌ ApiService não encontrado!');
                this.showError('Erro: Sistema de API não carregado');
                return;
            }
            
            console.log('✅ ApiService disponível:', window.ApiService);
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Carregar dados iniciais
            await this.loadInitialData();
            
            // Atualizar interface
            this.updateInterface();
            
            // Atualizar data atual
            this.updateCurrentDate();
            
            console.log('🎉 AgendaSystem inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar AgendaSystem:', error);
            this.showError('Erro ao carregar sistema da agenda');
        }
    }
    
    /**
     * Configurar listeners de eventos
     */
    setupEventListeners() {
        // Navegação de data
        this.elements.prevDate.addEventListener('click', () => this.navigateDate(-1));
        this.elements.nextDate.addEventListener('click', () => this.navigateDate(1));
        this.elements.openCalendar.addEventListener('click', () => this.openCalendar());
        
        // Botões de visualização
        this.elements.viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.changeView(view);
            });
        });
        
        // Filtros
        this.elements.filterProfessional.addEventListener('change', (e) => {
            this.state.filtros.profissional_id = e.target.value || null;
            this.applyFilters();
        });
        
        this.elements.filterStatus.addEventListener('change', (e) => {
            this.state.filtros.status = e.target.value || null;
            this.applyFilters();
        });
        
        // Botões de ação principais
        this.elements.btnNovoAgendamento.addEventListener('click', () => {
            this.openAppointmentModal();
        });
        
        this.elements.btnBloquearHorario.addEventListener('click', () => {
            this.openBlockTimeModal();
        });
        
        this.elements.btnEncaixeRapido.addEventListener('click', () => {
            this.openQuickFitModal();
        });
        
        // Botões de ação nos agendamentos
        this.setupAppointmentEventListeners();
        
        // Modais - Fechar
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        document.querySelectorAll('#cancelAppointment, #cancelBlockTime, #cancelQuickFit, #cancelCheckout, #cancelAppointmentDetail').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Modal de agendamento - Salvar
        if (this.elements.appointmentModal) {
            const saveBtn = this.elements.appointmentModal.querySelector('#saveAppointment');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveAppointment());
            }
        }
        
        // Modal de bloqueio - Salvar
        if (this.elements.blockTimeModal) {
            const saveBtn = this.elements.blockTimeModal.querySelector('#saveBlockTime');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveBlockTime());
            }
        }
        
        // Modal de encaixe rápido - Buscar
        if (this.elements.quickFitModal) {
            const findBtn = this.elements.quickFitModal.querySelector('#findQuickFit');
            if (findBtn) {
                findBtn.addEventListener('click', () => this.findQuickFit());
            }
        }
        
        // Abas do modal de agendamento
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }
    
    /**
     * Configurar eventos nos agendamentos
     */
    setupAppointmentEventListeners() {
        // Botões de detalhes
        this.elements.detailBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const client = e.target.dataset.client;
                const service = e.target.dataset.service;
                const time = e.target.dataset.time;
                const professional = e.target.dataset.professional;
                this.openAppointmentDetailModal(client, service, time, professional);
            });
        });
        
        // Botões de confirmar
        this.elements.confirmBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (id) {
                    await this.confirmAppointment(id);
                }
            });
        });
        
        // Botões de iniciar
        this.elements.startBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (id) {
                    await this.startAppointment(id);
                }
            });
        });
        
        // Botões de finalizar
        this.elements.completeBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const client = e.target.dataset.client;
                const service = e.target.dataset.service;
                const professional = e.target.dataset.professional;
                const price = e.target.dataset.price;
                
                if (id && client && service && professional) {
                    await this.openCheckoutModal(id, client, service, professional, price);
                }
            });
        });
        
        // Botões de cancelar
        this.elements.cancelBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const client = e.target.dataset.client;
                const service = e.target.dataset.service;
                
                if (id && client && service) {
                    await this.cancelAppointment(id, client, service);
                }
            });
        });
        
        // Botões do WhatsApp
        this.elements.whatsappBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const phone = e.target.dataset.phone;
                const client = e.target.dataset.client;
                const service = e.target.dataset.service;
                const date = e.target.dataset.date;
                const time = e.target.dataset.time;
                
                if (phone) {
                    this.sendWhatsAppMessage(phone, client, service, date, time);
                }
            });
        });
    }
    
    /**
     * Carregar dados iniciais do backend
     */
    async loadInitialData() {
        try {
            console.log('📥 Carregando dados do backend...');
            
            // Carregar profissionais
            const profissionaisData = await window.ApiService.getProfissionais();
            this.state.profissionais = Array.isArray(profissionaisData) ? profissionaisData : [];
            
            // Carregar serviços
            const servicosData = await window.ApiService.getServicos();
            this.state.servicos = Array.isArray(servicosData) ? servicosData : [];
            
            // Carregar agendamentos de hoje
            const hoje = this.formatDate(new Date(), 'YYYY-MM-DD');
            const agendamentosData = await window.ApiService.getAgendamentos({ 
                data: hoje 
            });
            this.state.agendamentos = Array.isArray(agendamentosData) ? agendamentosData : [];
            
            // Carregar estatísticas do dia
            const statsData = await window.ApiService.getEstatisticasHoje();
            if (statsData) {
                this.updateStatistics(statsData);
            }
            
            // Preencher filtros
            this.populateFilters();
            
            console.log('✅ Dados carregados:', {
                profissionais: this.state.profissionais.length,
                servicos: this.state.servicos.length,
                agendamentos: this.state.agendamentos.length
            });
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados da agenda');
        }
    }
    
    /**
     * Preencher filtros com dados do backend
     */
    populateFilters() {
        // Filtro de profissionais
        const profSelect = this.elements.filterProfessional;
        profSelect.innerHTML = '<option value="">Todos os Profissionais</option>';
        
        this.state.profissionais.forEach(prof => {
            const option = document.createElement('option');
            option.value = prof.id;
            option.textContent = prof.nome || prof.nome_completo || `Profissional ${prof.id}`;
            profSelect.appendChild(option);
        });
        
        // Filtro de serviços
        const servSelect = this.elements.filterService;
        servSelect.innerHTML = '<option value="">Todos os Serviços</option>';
        
        this.state.servicos.forEach(serv => {
            const option = document.createElement('option');
            option.value = serv.id;
            option.textContent = serv.nome;
            servSelect.appendChild(option);
        });
    }
    
    /**
     * Atualizar estatísticas na interface
     */
    updateStatistics(stats) {
        if (!this.elements.statsHoje || this.elements.statsHoje.length < 4) return;
        
        // Agendamentos Hoje
        this.elements.statsHoje[0].textContent = stats.total_hoje || 0;
        
        // Confirmados
        this.elements.statsHoje[1].textContent = stats.confirmados || 0;
        
        // Em Andamento
        this.elements.statsHoje[2].textContent = stats.em_andamento || 0;
        
        // Horários Livres
        this.elements.statsHoje[3].textContent = stats.horarios_livres || 0;
    }
    
    /**
     * Atualizar interface completa
     */
    updateInterface() {
        this.updateCurrentDate();
        this.updateAgendaView();
        this.updateAppointmentList();
    }
    
    /**
     * Atualizar data atual na interface
     */
    updateCurrentDate() {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateStr = this.state.dataAtual.toLocaleDateString('pt-BR', options);
        
        // Capitalizar primeira letra
        this.elements.currentDate.textContent = 
            dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }
    
    /**
     * Atualizar visualização da agenda
     */
    updateAgendaView() {
        // Ocultar todas as visualizações
        this.elements.agendaViews.forEach(view => {
            view.classList.remove('active');
        });
        
        // Mostrar visualização atual
        const currentView = document.getElementById(`${this.state.visualizacaoAtual}-view`);
        if (currentView) {
            currentView.classList.add('active');
        }
        
        // Atualizar botões ativos
        this.elements.viewButtons.forEach(btn => {
            if (btn.dataset.view === this.state.visualizacaoAtual) {
                btn.classList.add('bg-purple-600', 'text-white');
                btn.classList.remove('bg-white', 'text-gray-700');
            } else {
                btn.classList.remove('bg-purple-600', 'text-white');
                btn.classList.add('bg-white', 'text-gray-700');
            }
        });
        
        // Se for visualização de lista, carregar lista completa
        if (this.state.visualizacaoAtual === 'list') {
            this.loadAppointmentList();
        }
    }
    
    /**
     * Atualizar lista de agendamentos na grade
     */
    updateAppointmentList() {
        // Aqui você implementaria a atualização da grade
        // Baseado nos agendamentos carregados
        console.log('📋 Atualizando lista de agendamentos:', this.state.agendamentos.length);
        
        // TODO: Implementar renderização dinâmica dos agendamentos na grade
        // Isso envolveria criar elementos DOM dinamicamente baseado nos dados do backend
    }
    
    /**
     * Carregar lista de agendamentos para visualização de lista
     */
    async loadAppointmentList() {
        try {
            const dataFormatada = this.formatDate(this.state.dataAtual, 'YYYY-MM-DD');
            const agendamentos = await window.ApiService.getAgendamentos({
                data: dataFormatada,
                profissional_id: this.state.filtros.profissional_id,
                status: this.state.filtros.status
            });
            
            // Atualizar lista
            this.renderAppointmentList(agendamentos);
            
        } catch (error) {
            console.error('❌ Erro ao carregar lista:', error);
            this.showError('Erro ao carregar agendamentos');
        }
    }
    
    /**
     * Renderizar lista de agendamentos
     */
    renderAppointmentList(agendamentos) {
        const listView = document.getElementById('list-view');
        if (!listView) return;
        
        if (!agendamentos || agendamentos.length === 0) {
            listView.innerHTML = `
                <div class="bg-white rounded-lg shadow p-8 text-center">
                    <i class="fas fa-calendar-times text-gray-300 text-4xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-700">Nenhum agendamento</h3>
                    <p class="text-gray-500 mt-2">Não há agendamentos para esta data</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="bg-white rounded-lg shadow">
                <div class="p-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold">Agendamentos</h3>
                </div>
                <div class="divide-y divide-gray-200">
        `;
        
        agendamentos.forEach(agendamento => {
            const statusColor = this.getStatusColor(agendamento.status);
            const horaInicio = this.formatTime(agendamento.data_hora);
            const clienteNome = agendamento.cliente_nome || 'Cliente';
            const profissionalNome = agendamento.profissional_nome || 'Profissional';
            
            html += `
                <div class="p-4 flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-3 h-3 ${statusColor} rounded-full"></div>
                        <div>
                            <div class="font-medium">${clienteNome}</div>
                            <div class="text-sm text-gray-500">${horaInicio} • ${profissionalNome}</div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-1 ${this.getStatusBadgeClass(agendamento.status)} text-xs rounded-full">
                            ${agendamento.status}
                        </span>
                        <button class="action-btn bg-blue-500 text-white hover:bg-blue-600" onclick="agendaSystem.openAppointmentDetailModal('${clienteNome}', 'Serviço', '${horaInicio}', '${profissionalNome}')">
                            <i class="fas fa-eye mr-1"></i> Ver
                        </button>
                        ${this.getActionButtons(agendamento)}
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
        listView.innerHTML = html;
    }
    
    /**
     * Obter botões de ação baseado no status
     */
    getActionButtons(agendamento) {
        let buttons = '';
        
        switch(agendamento.status) {
            case 'agendado':
                buttons = `
                    <button class="action-btn bg-green-500 text-white hover:bg-green-600 confirm-btn" data-id="${agendamento.id}">
                        <i class="fas fa-check mr-1"></i> Confirmar
                    </button>
                `;
                break;
            case 'confirmado':
                buttons = `
                    <button class="action-btn bg-yellow-500 text-white hover:bg-yellow-600 start-btn" data-id="${agendamento.id}">
                        <i class="fas fa-play mr-1"></i> Iniciar
                    </button>
                `;
                break;
            case 'em_andamento':
                buttons = `
                    <button class="action-btn bg-gray-500 text-white hover:bg-gray-600 complete-btn" data-id="${agendamento.id}">
                        <i class="fas fa-stop mr-1"></i> Finalizar
                    </button>
                `;
                break;
        }
        
        buttons += `
            <button class="action-btn cancel-btn hover:bg-red-700 cancel-appointment" data-id="${agendamento.id}">
                <i class="fas fa-times mr-1"></i> Cancelar
            </button>
        `;
        
        return buttons;
    }
    
    /**
     * Obter classe CSS para badge de status
     */
    getStatusBadgeClass(status) {
        switch(status) {
            case 'agendado': return 'bg-blue-100 text-blue-800';
            case 'confirmado': return 'bg-green-100 text-green-800';
            case 'em_andamento': return 'bg-yellow-100 text-yellow-800';
            case 'concluido': return 'bg-purple-100 text-purple-800';
            case 'cancelado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    /**
     * Obter cor para indicador de status
     */
    getStatusColor(status) {
        switch(status) {
            case 'agendado': return 'bg-blue-500';
            case 'confirmado': return 'bg-green-500';
            case 'em_andamento': return 'bg-yellow-500';
            case 'concluido': return 'bg-purple-500';
            case 'cancelado': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    }
    
    /**
     * Aplicar filtros e recarregar dados
     */
    async applyFilters() {
        try {
            console.log('🔍 Aplicando filtros:', this.state.filtros);
            
            const dataFormatada = this.formatDate(this.state.dataAtual, 'YYYY-MM-DD');
            
            const agendamentos = await window.ApiService.getAgendamentos({
                data: dataFormatada,
                profissional_id: this.state.filtros.profissional_id,
                status: this.state.filtros.status
            });
            
            this.state.agendamentos = agendamentos || [];
            this.updateAppointmentList();
            
        } catch (error) {
            console.error('❌ Erro ao aplicar filtros:', error);
            this.showError('Erro ao filtrar agendamentos');
        }
    }
    
    /**
     * Navegar entre datas
     */
    navigateDate(direction) {
        const newDate = new Date(this.state.dataAtual);
        
        switch(this.state.visualizacaoAtual) {
            case 'day':
                newDate.setDate(newDate.getDate() + direction);
                break;
            case 'week':
                newDate.setDate(newDate.getDate() + (direction * 7));
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + direction);
                break;
        }
        
        this.state.dataAtual = newDate;
        this.state.filtros.data = newDate;
        this.updateCurrentDate();
        this.applyFilters();
    }
    
    /**
     * Mudar visualização
     */
    changeView(view) {
        this.state.visualizacaoAtual = view;
        this.updateAgendaView();
        this.applyFilters();
    }
    
    /**
     * Abrir modal de agendamento
     */
    openAppointmentModal() {
        this.elements.appointmentModal.classList.remove('hidden');
        this.switchTab('client');
        this.populateAppointmentModal();
    }
    
    /**
     * Popular modal de agendamento com dados
     */
    populateAppointmentModal() {
        // Preencher select de profissionais
        const profSelect = document.getElementById('professional');
        if (profSelect) {
            profSelect.innerHTML = '<option value="">Selecione</option>';
            this.state.profissionais.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = prof.nome || prof.nome_completo;
                profSelect.appendChild(option);
            });
        }
        
        // Preencher select de serviços
        const servSelect = document.getElementById('service');
        if (servSelect) {
            servSelect.innerHTML = '<option value="">Selecione</option>';
            this.state.servicos.forEach(serv => {
                const option = document.createElement('option');
                option.value = serv.id;
                option.textContent = `${serv.nome} - R$ ${serv.valor}`;
                option.dataset.duration = serv.duracao || 60;
                option.dataset.price = serv.valor;
                servSelect.appendChild(option);
            });
            
            // Adicionar evento para calcular duração
            servSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const duration = selectedOption.dataset.duration || 60;
                const price = selectedOption.dataset.price || 0;
                
                document.getElementById('duration').value = `${duration} min`;
                document.getElementById('service_price').value = `R$ ${price}`;
                document.getElementById('final_price').value = `R$ ${price}`;
                
                // Calcular horário final
                this.calculateEndTime();
            });
        }
        
        // Definir data atual
        const dateInput = document.getElementById('appointment_date');
        if (dateInput) {
            dateInput.value = this.formatDate(this.state.dataAtual, 'YYYY-MM-DD');
        }
        
        // Definir horário atual + 1 hora (próximo horário disponível)
        const timeInput = document.getElementById('start_time');
        if (timeInput) {
            const now = new Date();
            now.setHours(now.getHours() + 1);
            timeInput.value = this.formatTime(now);
            this.calculateEndTime();
        }
        
        // Adicionar evento para calcular horário final
        if (timeInput) {
            timeInput.addEventListener('change', () => this.calculateEndTime());
        }
    }
    
    /**
     * Calcular horário final baseado na duração
     */
    calculateEndTime() {
        const startTime = document.getElementById('start_time').value;
        const duration = document.getElementById('duration').value;
        
        if (!startTime || !duration) return;
        
        const durationMatch = duration.match(/(\d+)/);
        if (!durationMatch) return;
        
        const durationMinutes = parseInt(durationMatch[1]);
        const [hours, minutes] = startTime.split(':').map(Number);
        
        let endHours = hours;
        let endMinutes = minutes + durationMinutes;
        
        while (endMinutes >= 60) {
            endHours++;
            endMinutes -= 60;
        }
        
        if (endHours >= 24) {
            endHours -= 24;
        }
        
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
        document.getElementById('end_time').value = endTime;
    }
    
    /**
     * Salvar novo agendamento
     */
    async saveAppointment() {
        try {
            // Validar formulário
            if (!this.validateAppointmentForm()) {
                return;
            }
            
            // Obter dados do formulário
            const formData = this.getAppointmentFormData();
            
            console.log('💾 Salvando agendamento:', formData);
            
            // Criar agendamento no backend
            const resultado = await window.ApiService.criarAgendamento(formData);
            
            console.log('✅ Agendamento criado:', resultado);
            
            // Fechar modal
            this.closeAllModals();
            
            // Recarregar dados
            await this.applyFilters();
            
            // Mostrar confirmação
            this.showConfirmation('Agendamento criado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao salvar agendamento:', error);
            this.showError('Erro ao criar agendamento: ' + error.message);
        }
    }
    
    /**
     * Validar formulário de agendamento
     */
    validateAppointmentForm() {
        const requiredFields = [
            'client_name',
            'client_phone',
            'professional',
            'service',
            'appointment_date',
            'start_time'
        ];
        
        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                this.showError(`Por favor, preencha o campo: ${fieldId.replace('_', ' ')}`);
                field?.focus();
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Obter dados do formulário de agendamento
     */
    getAppointmentFormData() {
        // TODO: Implementar lógica para capturar todos os dados do formulário
        return {
            cliente_id: null, // Será buscado ou criado
            cliente_nome: document.getElementById('client_name').value,
            cliente_telefone: document.getElementById('client_phone').value,
            cliente_email: document.getElementById('client_email').value,
            profissional_id: document.getElementById('professional').value,
            servico_id: document.getElementById('service').value,
            data_hora: `${document.getElementById('appointment_date').value}T${document.getElementById('start_time').value}:00`,
            duracao: parseInt(document.getElementById('duration').value) || 60,
            observacoes: document.getElementById('notes').value,
            valor: parseFloat(document.getElementById('final_price').value.replace('R$ ', '').replace(',', '.')),
            status: 'agendado'
        };
    }
    
    /**
     * Abrir modal de bloqueio de horário
     */
    openBlockTimeModal() {
        this.elements.blockTimeModal.classList.remove('hidden');
        
        // Preencher data atual
        const dateInput = document.getElementById('block_date');
        if (dateInput) {
            dateInput.value = this.formatDate(this.state.dataAtual, 'YYYY-MM-DD');
        }
        
        // Preencher profissionais
        const profSelect = document.getElementById('block_professional');
        if (profSelect) {
            profSelect.innerHTML = '<option value="all">Todos os Profissionais</option>';
            this.state.profissionais.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = prof.nome || prof.nome_completo;
                profSelect.appendChild(option);
            });
        }
    }
    
    /**
     * Salvar bloqueio de horário
     */
    async saveBlockTime() {
        try {
            const formData = {
                profissional_id: document.getElementById('block_professional').value === 'all' ? null : document.getElementById('block_professional').value,
                data_inicio: `${document.getElementById('block_date').value}T${document.getElementById('block_start_time').value}:00`,
                data_fim: `${document.getElementById('block_date').value}T${document.getElementById('block_end_time').value}:00`,
                motivo: document.getElementById('block_reason').value || 'Horário bloqueado'
            };
            
            console.log('🔒 Salvando bloqueio:', formData);
            
            await window.ApiService.criarBloqueio(formData);
            
            this.closeAllModals();
            await this.applyFilters();
            this.showConfirmation('Horário bloqueado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao salvar bloqueio:', error);
            this.showError('Erro ao bloquear horário: ' + error.message);
        }
    }
    
    /**
     * Abrir modal de encaixe rápido
     */
    openQuickFitModal() {
        this.elements.quickFitModal.classList.remove('hidden');
        
        // Preencher profissionais
        const profSelect = document.getElementById('quick_professional');
        if (profSelect) {
            profSelect.innerHTML = '<option value="">Selecione</option>';
            this.state.profissionais.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = prof.nome || prof.nome_completo;
                profSelect.appendChild(option);
            });
        }
        
        // Preencher serviços
        const servSelect = document.getElementById('quick_service');
        if (servSelect) {
            servSelect.innerHTML = '<option value="">Selecione</option>';
            this.state.servicos.forEach(serv => {
                const option = document.createElement('option');
                option.value = serv.id;
                option.textContent = serv.nome;
                servSelect.appendChild(option);
            });
        }
    }
    
    /**
     * Buscar horário disponível para encaixe rápido
     */
    async findQuickFit() {
        try {
            const profissionalId = document.getElementById('quick_professional').value;
            const servicoId = document.getElementById('quick_service').value;
            const data = this.formatDate(new Date(), 'YYYY-MM-DD');
            
            if (!profissionalId || !servicoId) {
                this.showError('Selecione profissional e serviço');
                return;
            }
            
            // Buscar horários livres
            const horarios = await window.ApiService.getHorariosLivres(profissionalId, data);
            
            if (!horarios || horarios.length === 0) {
                document.getElementById('quickFitResult').classList.add('hidden');
                this.showError('Nenhum horário disponível para hoje');
                return;
            }
            
            // Mostrar próximo horário disponível
            const primeiroHorario = horarios[0];
            document.getElementById('availableTime').textContent = 
                this.formatTime(primeiroHorario.data_hora);
            document.getElementById('availableDate').textContent = 
                this.formatDate(primeiroHorario.data_hora, 'DD/MM/YYYY');
            document.getElementById('quickFitResult').classList.remove('hidden');
            
        } catch (error) {
            console.error('❌ Erro ao buscar horário:', error);
            this.showError('Erro ao buscar horário disponível');
        }
    }
    
    /**
     * Abrir modal de detalhes do agendamento
     */
    openAppointmentDetailModal(client, service, time, professional) {
        this.elements.appointmentDetailModal.classList.remove('hidden');
        
        // Preencher dados
        document.getElementById('detailClient').textContent = client;
        document.getElementById('detailService').textContent = service;
        document.getElementById('detailTime').textContent = time;
        document.getElementById('detailProfessional').textContent = professional;
        
        // Definir data atual para ajuste
        document.getElementById('adjustDate').value = this.formatDate(this.state.dataAtual, 'YYYY-MM-DD');
    }
    
    /**
     * Abrir modal de checkout
     */
    async openCheckoutModal(id, client, service, professional, price) {
        this.elements.checkoutModal.classList.remove('hidden');
        
        // Preencher dados
        document.getElementById('checkoutClient').textContent = client;
        document.getElementById('checkoutService').textContent = service;
        document.getElementById('checkoutProfessional').textContent = professional;
        document.getElementById('checkoutServicePrice').textContent = `R$ ${price || '0,00'}`;
        document.getElementById('checkoutTotal').textContent = `R$ ${price || '0,00'}`;
        
        // Configurar métodos de pagamento
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.payment-option').forEach(o => 
                    o.classList.remove('selected')
                );
                e.target.closest('.payment-option').classList.add('selected');
                document.getElementById('payment_method').value = 
                    e.target.closest('.payment-option').dataset.method;
            });
        });
        
        // Atualizar total quando gorjeta for alterada
        document.getElementById('tip_amount').addEventListener('input', (e) => {
            const tip = parseFloat(e.target.value) || 0;
            const servicePrice = parseFloat(price) || 0;
            const total = servicePrice + tip;
            document.getElementById('checkoutTotal').textContent = 
                `R$ ${total.toFixed(2).replace('.', ',')}`;
        });
    }
    
    /**
     * Confirmar agendamento
     */
    async confirmAppointment(id) {
        try {
            await window.ApiService.mudarStatusAgendamento(id, 'confirmado');
            await this.applyFilters();
            this.showConfirmation('Agendamento confirmado!');
        } catch (error) {
            console.error('❌ Erro ao confirmar:', error);
            this.showError('Erro ao confirmar agendamento');
        }
    }
    
    /**
     * Iniciar agendamento
     */
    async startAppointment(id) {
        try {
            await window.ApiService.mudarStatusAgendamento(id, 'em_andamento');
            await this.applyFilters();
            this.showConfirmation('Atendimento iniciado!');
        } catch (error) {
            console.error('❌ Erro ao iniciar:', error);
            this.showError('Erro ao iniciar atendimento');
        }
    }
    
    /**
     * Cancelar agendamento
     */
    async cancelAppointment(id, client, service) {
        if (!confirm(`Cancelar agendamento de ${client} - ${service}?`)) {
            return;
        }
        
        try {
            await window.ApiService.mudarStatusAgendamento(id, 'cancelado');
            await this.applyFilters();
            this.showConfirmation('Agendamento cancelado!');
        } catch (error) {
            console.error('❌ Erro ao cancelar:', error);
            this.showError('Erro ao cancelar agendamento');
        }
    }
    
    /**
     * Finalizar checkout
     */
    async saveCheckout() {
        // TODO: Implementar lógica de checkout
        this.closeAllModals();
        this.showConfirmation('Pagamento realizado com sucesso!');
    }
    
    /**
     * Enviar mensagem no WhatsApp
     */
    sendWhatsAppMessage(phone, client, service, date, time) {
        const message = `Olá ${client}! Lembrete: Seu agendamento para ${service} está marcado para ${date} às ${time}.`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    }
    
    /**
     * Alternar entre abas
     */
    switchTab(tabId) {
        // Remover classes ativas
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('border-b-2', 'border-purple-500', 'text-purple-600');
            tab.classList.add('border-transparent', 'text-gray-500');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Adicionar classes ativas
        const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
        const activeContent = document.getElementById(`${tabId}-tab`);
        
        if (activeTab) {
            activeTab.classList.add('border-b-2', 'border-purple-500', 'text-purple-600');
            activeTab.classList.remove('border-transparent', 'text-gray-500');
        }
        
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }
    
    /**
     * Fechar todos os modais
     */
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
    
    /**
     * Abrir calendário
     */
    openCalendar() {
        // TODO: Implementar seletor de calendário
        alert('Seletor de calendário em desenvolvimento');
    }
    
    /**
     * Mostrar mensagem de confirmação
     */
    showConfirmation(message) {
        const overlay = document.getElementById('confirmationOverlay');
        const popup = document.getElementById('confirmationPopup');
        const title = document.getElementById('confirmationTitle');
        const msg = document.getElementById('confirmationMessage');
        
        if (overlay && popup && title && msg) {
            title.textContent = 'Sucesso!';
            msg.textContent = message;
            overlay.style.display = 'block';
            popup.style.display = 'block';
            
            // Fechar automaticamente após 3 segundos
            setTimeout(() => {
                overlay.style.display = 'none';
                popup.style.display = 'none';
            }, 3000);
        }
    }
    
    /**
     * Mostrar mensagem de erro
     */
    showError(message) {
        alert(`Erro: ${message}`);
    }
    
    /**
     * Formatar data
     */
    formatDate(date, format = 'DD/MM/YYYY') {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        
        switch(format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            default:
                return `${day}/${month}/${year}`;
        }
    }
    
    /**
     * Formatar hora
     */
    formatTime(dateTime) {
        const d = new Date(dateTime);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('📅 Iniciando sistema de agenda...');
    window.agendaSystem = new AgendaSystem();
});