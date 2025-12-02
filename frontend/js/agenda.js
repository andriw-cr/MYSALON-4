// frontend/js/agenda.js - VERSÃO COMPLETA CORRIGIDA
/**
 * SISTEMA PRINCIPAL DA AGENDA - Integração com Backend
 */

class AgendaSystem {
    constructor() {
        console.log('🚀 Inicializando AgendaSystem...');
        
        // VERIFICAÇÃO FORTE DO ApiService
        if (typeof window.ApiService === 'undefined') {
            console.error('❌ ApiService não encontrado! Verificando alternativas...');
            
            // Tentar outras referências possíveis
            if (typeof window.apiService !== 'undefined') {
                console.log('✅ Encontrado window.apiService, usando como fallback');
                window.ApiService = window.apiService;
            } else if (typeof window.api !== 'undefined') {
                console.log('✅ Encontrado window.api, usando como fallback');
                window.ApiService = window.api;
            } else {
                console.error('❌ Nenhuma referência de API encontrada!');
                this.showFatalError('Sistema de API não carregado. Recarregue a página ou verifique o console.');
                return; // Impedir inicialização
            }
        }
        
        console.log('✅ ApiService disponível:', window.ApiService);
        
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
        
        // Cache de elementos DOM
        this.cacheElements();
        
        this.init();
    }
    
    /**
     * Cache de elementos DOM
     */
    cacheElements() {
        // Navegação
        this.elements = {
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
            statsHoje: document.querySelectorAll('.bg-white.rounded-lg.shadow.p-4 h3')
        };
        
        // Inicializar arrays de botões dinâmicos
        this.elements.detailBtns = [];
        this.elements.confirmBtns = [];
        this.elements.startBtns = [];
        this.elements.completeBtns = [];
        this.elements.cancelBtns = [];
        this.elements.whatsappBtns = [];
    }
    
    /**
     * Mostrar erro fatal e parar sistema
     */
    showFatalError(message) {
        const container = document.querySelector('.agenda-container') || document.body;
        container.innerHTML = `
            <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                    <div class="text-center">
                        <div class="text-red-500 text-4xl mb-4">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-900 mb-2">Erro de Sistema</h3>
                        <p class="text-gray-600 mb-6">${message}</p>
                        
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p class="text-sm text-red-800">
                                <strong>Solução:</strong><br>
                                1. Verifique se o backend está rodando (localhost:3000)<br>
                                2. Recarregue a página (F5)<br>
                                3. Verifique o console para mais detalhes
                            </p>
                        </div>
                        
                        <div class="flex space-x-4">
                            <button onclick="location.reload()" 
                                    class="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                                <i class="fas fa-redo mr-2"></i> Recarregar
                            </button>
                            <button onclick="this.closest('.fixed').remove()" 
                                    class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Mostrar aviso não fatal
     */
    showWarning(message) {
        const overlay = document.getElementById('warningOverlay') || (() => {
            const div = document.createElement('div');
            div.id = 'warningOverlay';
            div.className = 'fixed top-4 right-4 z-50';
            document.body.appendChild(div);
            return div;
        })();
        
        const warningId = 'warning-' + Date.now();
        overlay.innerHTML += `
            <div id="${warningId}" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg shadow-lg max-w-md">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-yellow-700">${message}</p>
                    </div>
                    <button onclick="document.getElementById('${warningId}').remove()" 
                            class="ml-auto -mx-1.5 -my-1.5 text-yellow-500 hover:text-yellow-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Auto-remover após 10 segundos
        setTimeout(() => {
            const elem = document.getElementById(warningId);
            if (elem) elem.remove();
        }, 10000);
    }
    
    /**
     * Inicializar o sistema
     */
    async init() {
        try {
            console.log('📡 Iniciando AgendaSystem...');
            
            // VERIFICAÇÃO DO ApiService (redundante para segurança)
            if (!window.ApiService || typeof window.ApiService.getProfissionais !== 'function') {
                console.error('❌ ApiService inválido ou métodos não disponíveis');
                this.showFatalError('ApiService não foi carregado corretamente');
                return;
            }
            
            console.log('✅ ApiService validado com sucesso');
            
            // Testar conexão antes de continuar
            try {
                console.log('🏥 Testando conexão com backend...');
                const health = await window.ApiService.healthCheck();
                console.log('Health check:', health);
                
                if (health.status === 'error') {
                    console.warn('⚠️ API pode estar offline, continuando com limitações...');
                    this.showWarning('API do backend pode estar offline. Algumas funcionalidades podem não funcionar.');
                }
            } catch (healthError) {
                console.warn('⚠️ Não foi possível verificar saúde da API:', healthError.message);
            }
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Carregar dados iniciais
            await this.loadInitialData();
            
            // Atualizar interface
            this.updateInterface();
            
            // Atualizar data atual
            this.updateCurrentDate();
            
            console.log('🎉 AgendaSystem inicializado com sucesso!');
            
            // Mostrar notificação de sucesso
            this.showConfirmation('Agenda carregada com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro crítico ao inicializar AgendaSystem:', error);
            this.showFatalError(`Erro de inicialização: ${error.message}`);
        }
    }
    
    /**
     * Configurar listeners de eventos
     */
    setupEventListeners() {
        // Navegação de data
        if (this.elements.prevDate) {
            this.elements.prevDate.addEventListener('click', () => this.navigateDate(-1));
        }
        
        if (this.elements.nextDate) {
            this.elements.nextDate.addEventListener('click', () => this.navigateDate(1));
        }
        
        if (this.elements.openCalendar) {
            this.elements.openCalendar.addEventListener('click', () => this.openCalendar());
        }
        
        // Botões de visualização
        if (this.elements.viewButtons) {
            this.elements.viewButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const view = e.target.dataset.view || e.target.closest('[data-view]').dataset.view;
                    if (view) {
                        this.changeView(view);
                    }
                });
            });
        }
        
        // Filtros
        if (this.elements.filterProfessional) {
            this.elements.filterProfessional.addEventListener('change', (e) => {
                this.state.filtros.profissional_id = e.target.value || null;
                this.applyFilters();
            });
        }
        
        if (this.elements.filterStatus) {
            this.elements.filterStatus.addEventListener('change', (e) => {
                this.state.filtros.status = e.target.value || null;
                this.applyFilters();
            });
        }
        
        // Botões de ação principais
        if (this.elements.btnNovoAgendamento) {
            this.elements.btnNovoAgendamento.addEventListener('click', () => {
                this.openAppointmentModal();
            });
        }
        
        if (this.elements.btnBloquearHorario) {
            this.elements.btnBloquearHorario.addEventListener('click', () => {
                this.openBlockTimeModal();
            });
        }
        
        if (this.elements.btnEncaixeRapido) {
            this.elements.btnEncaixeRapido.addEventListener('click', () => {
                this.openQuickFitModal();
            });
        }
        
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
                const tabId = e.target.dataset.tab || e.target.closest('[data-tab]').dataset.tab;
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });
        
        // Botões dinâmicos serão configurados após carregar dados
    }
    
    /**
     * Configurar eventos nos agendamentos (dinâmico)
     */
    setupAppointmentEventListeners() {
        // Limpar listeners antigos
        this.clearAppointmentListeners();
        
        // Buscar botões dinâmicos
        this.elements.detailBtns = document.querySelectorAll('.detail-btn');
        this.elements.confirmBtns = document.querySelectorAll('.confirm-btn');
        this.elements.startBtns = document.querySelectorAll('.start-btn');
        this.elements.completeBtns = document.querySelectorAll('.complete-btn');
        this.elements.cancelBtns = document.querySelectorAll('.cancel-appointment');
        this.elements.whatsappBtns = document.querySelectorAll('.whatsapp-btn');
        
        // Botões de detalhes
        this.elements.detailBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appointmentId = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                if (appointmentId) {
                    this.openAppointmentDetailById(appointmentId);
                }
            });
        });
        
        // Botões de confirmar
        this.elements.confirmBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                if (id) {
                    await this.confirmAppointment(id);
                }
            });
        });
        
        // Botões de iniciar
        this.elements.startBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                if (id) {
                    await this.startAppointment(id);
                }
            });
        });
        
        // Botões de finalizar
        this.elements.completeBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                const client = e.target.dataset.client || e.target.closest('[data-client]').dataset.client;
                const service = e.target.dataset.service || e.target.closest('[data-service]').dataset.service;
                const professional = e.target.dataset.professional || e.target.closest('[data-professional]').dataset.professional;
                const price = e.target.dataset.price || e.target.closest('[data-price]').dataset.price;
                
                if (id && client && service && professional) {
                    await this.openCheckoutModal(id, client, service, professional, price);
                }
            });
        });
        
        // Botões de cancelar
        this.elements.cancelBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id || e.target.closest('[data-id]').dataset.id;
                const client = e.target.dataset.client || e.target.closest('[data-client]').dataset.client;
                const service = e.target.dataset.service || e.target.closest('[data-service]').dataset.service;
                
                if (id && client && service) {
                    await this.cancelAppointment(id, client, service);
                }
            });
        });
        
        // Botões do WhatsApp
        this.elements.whatsappBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const phone = e.target.dataset.phone || e.target.closest('[data-phone]').dataset.phone;
                const client = e.target.dataset.client || e.target.closest('[data-client]').dataset.client;
                const service = e.target.dataset.service || e.target.closest('[data-service]').dataset.service;
                const date = e.target.dataset.date || e.target.closest('[data-date]').dataset.date;
                const time = e.target.dataset.time || e.target.closest('[data-time]').dataset.time;
                
                if (phone) {
                    this.sendWhatsAppMessage(phone, client, service, date, time);
                }
            });
        });
    }
    
    /**
     * Limpar listeners de agendamentos
     */
    clearAppointmentListeners() {
        // Implementação de limpeza se necessário
        this.elements.detailBtns = [];
        this.elements.confirmBtns = [];
        this.elements.startBtns = [];
        this.elements.completeBtns = [];
        this.elements.cancelBtns = [];
        this.elements.whatsappBtns = [];
    }
    
    /**
     * Carregar dados iniciais do backend
     */
    async loadInitialData() {
        try {
            console.log('📥 Carregando dados do backend...');
            
            // Carregar profissionais
            console.log('👨‍💼 Carregando profissionais...');
            const profissionaisData = await window.ApiService.getProfissionais();
            this.state.profissionais = Array.isArray(profissionaisData) ? profissionaisData : [];
            console.log(`✅ ${this.state.profissionais.length} profissionais carregados`);
            
            // Carregar serviços
            console.log('💇 Carregando serviços...');
            const servicosData = await window.ApiService.getServicos();
            this.state.servicos = Array.isArray(servicosData) ? servicosData : [];
            console.log(`✅ ${this.state.servicos.length} serviços carregados`);
            
            // Carregar agendamentos de hoje
            console.log('📅 Carregando agendamentos...');
            const hoje = this.formatDate(new Date(), 'YYYY-MM-DD');
            const agendamentosData = await window.ApiService.getAgendamentos({ 
                data: hoje 
            });
            this.state.agendamentos = Array.isArray(agendamentosData) ? agendamentosData : [];
            console.log(`✅ ${this.state.agendamentos.length} agendamentos carregados`);
            
            // Tentar carregar estatísticas do dia
            try {
                console.log('📊 Carregando estatísticas...');
                const statsData = await window.ApiService.getEstatisticasHoje();
                if (statsData) {
                    this.updateStatistics(statsData);
                    console.log('✅ Estatísticas carregadas:', statsData);
                }
            } catch (statsError) {
                console.warn('⚠️ Não foi possível carregar estatísticas:', statsError.message);
            }
            
            // Preencher filtros
            this.populateFilters();
            
            console.log('🎯 Dados iniciais carregados com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados iniciais:', error);
            this.showError('Erro ao carregar dados da agenda. Verifique a conexão com o backend.');
            
            // Tentar carregar dados mock para continuar
            await this.loadMockData();
        }
    }
    
    /**
     * Carregar dados mock para desenvolvimento
     */
    async loadMockData() {
        console.log('🛠️ Carregando dados mock para desenvolvimento...');
        
        // Mock de profissionais
        this.state.profissionais = [
            { id: 1, nome: 'Ana Silva', especialidade: 'Cabelereira' },
            { id: 2, nome: 'Carlos Santos', especialidade: 'Barbeiro' },
            { id: 3, nome: 'Mariana Lima', especialidade: 'Esteticista' }
        ];
        
        // Mock de serviços
        this.state.servicos = [
            { id: 1, nome: 'Corte Feminino', valor: 60.00, duracao: 45 },
            { id: 2, nome: 'Corte Masculino', valor: 40.00, duracao: 30 },
            { id: 3, nome: 'Coloração', valor: 120.00, duracao: 120 }
        ];
        
        // Mock de agendamentos
        this.state.agendamentos = [
            {
                id: 1,
                cliente_nome: 'João da Silva',
                profissional_nome: 'Ana Silva',
                servico_nome: 'Corte Feminino',
                data_hora: new Date(new Date().setHours(10, 0, 0, 0)),
                status: 'confirmado',
                valor: 60.00
            },
            {
                id: 2,
                cliente_nome: 'Maria Oliveira',
                profissional_nome: 'Carlos Santos',
                servico_nome: 'Corte Masculino',
                data_hora: new Date(new Date().setHours(14, 30, 0, 0)),
                status: 'agendado',
                valor: 40.00
            }
        ];
        
        // Preencher filtros mesmo com mock
        this.populateFilters();
        
        this.showWarning('Usando dados de demonstração. Conecte-se ao backend para dados reais.');
    }
    
    /**
     * Preencher filtros com dados do backend
     */
    populateFilters() {
        // Filtro de profissionais
        if (this.elements.filterProfessional) {
            this.elements.filterProfessional.innerHTML = '<option value="">Todos os Profissionais</option>';
            
            this.state.profissionais.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = prof.nome || prof.nome_completo || `Profissional ${prof.id}`;
                this.elements.filterProfessional.appendChild(option);
            });
            
            console.log(`📋 Filtro de profissionais preenchido: ${this.state.profissionais.length} opções`);
        }
        
        // Filtro de serviços
        if (this.elements.filterService) {
            this.elements.filterService.innerHTML = '<option value="">Todos os Serviços</option>';
            
            this.state.servicos.forEach(serv => {
                const option = document.createElement('option');
                option.value = serv.id;
                option.textContent = serv.nome || `Serviço ${serv.id}`;
                if (serv.valor) {
                    option.textContent += ` - R$ ${serv.valor}`;
                }
                this.elements.filterService.appendChild(option);
            });
            
            console.log(`📋 Filtro de serviços preenchido: ${this.state.servicos.length} opções`);
        }
        
        // Filtro de status
        if (this.elements.filterStatus) {
            this.elements.filterStatus.innerHTML = `
                <option value="">Todos os Status</option>
                <option value="agendado">Agendado</option>
                <option value="confirmado">Confirmado</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
            `;
        }
    }
    
    /**
     * Atualizar estatísticas na interface
     */
    updateStatistics(stats) {
        if (!this.elements.statsHoje || this.elements.statsHoje.length < 4) {
            console.warn('⚠️ Elementos de estatísticas não encontrados');
            return;
        }
        
        try {
            // Agendamentos Hoje
            if (this.elements.statsHoje[0]) {
                this.elements.statsHoje[0].textContent = stats.total_hoje || this.state.agendamentos.length || '0';
            }
            
            // Confirmados
            if (this.elements.statsHoje[1]) {
                const confirmados = stats.confirmados || 
                    this.state.agendamentos.filter(a => a.status === 'confirmado').length;
                this.elements.statsHoje[1].textContent = confirmados;
            }
            
            // Em Andamento
            if (this.elements.statsHoje[2]) {
                const emAndamento = stats.em_andamento || 
                    this.state.agendamentos.filter(a => a.status === 'em_andamento').length;
                this.elements.statsHoje[2].textContent = emAndamento;
            }
            
            // Horários Livres
            if (this.elements.statsHoje[3]) {
                this.elements.statsHoje[3].textContent = stats.horarios_livres || '--';
            }
            
            console.log('📊 Estatísticas atualizadas:', stats);
        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error);
        }
    }
    
    /**
     * Atualizar interface completa
     */
    updateInterface() {
        this.updateCurrentDate();
        this.updateAgendaView();
        this.updateAppointmentGrid();
        this.setupAppointmentEventListeners(); // Reconfigurar eventos após atualizar
    }
    
    /**
     * Atualizar data atual na interface
     */
    updateCurrentDate() {
        if (!this.elements.currentDate) return;
        
        try {
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
                
            console.log('📅 Data atualizada:', this.elements.currentDate.textContent);
        } catch (error) {
            console.error('❌ Erro ao atualizar data:', error);
        }
    }
    
    /**
     * Atualizar visualização da agenda
     */
    updateAgendaView() {
        // Ocultar todas as visualizações
        if (this.elements.agendaViews) {
            this.elements.agendaViews.forEach(view => {
                view.classList.remove('active');
            });
        }
        
        // Mostrar visualização atual
        const currentView = document.getElementById(`${this.state.visualizacaoAtual}-view`);
        if (currentView) {
            currentView.classList.add('active');
            console.log(`👁️ Visualização ativa: ${this.state.visualizacaoAtual}`);
        }
        
        // Atualizar botões ativos
        if (this.elements.viewButtons) {
            this.elements.viewButtons.forEach(btn => {
                const view = btn.dataset.view || btn.closest('[data-view]').dataset.view;
                if (view === this.state.visualizacaoAtual) {
                    btn.classList.add('bg-purple-600', 'text-white');
                    btn.classList.remove('bg-white', 'text-gray-700');
                } else {
                    btn.classList.remove('bg-purple-600', 'text-white');
                    btn.classList.add('bg-white', 'text-gray-700');
                }
            });
        }
        
        // Se for visualização de lista, carregar lista completa
        if (this.state.visualizacaoAtual === 'list') {
            this.loadAppointmentList();
        }
    }
    
    /**
     * Atualizar grade de agendamentos
     */
    updateAppointmentGrid() {
        console.log('📋 Atualizando grade de agendamentos:', this.state.agendamentos.length);
        
        // Para visualização dia/semana/mês, renderizar na grade existente
        if (this.state.visualizacaoAtual !== 'list') {
            this.renderAgendaGrid();
        }
    }
    
    /**
     * Renderizar grade de agenda
     */
    renderAgendaGrid() {
        // Esta função irá preencher os slots da grade com os agendamentos
        // Por enquanto, apenas log
        console.log('🎨 Renderizando grade para:', this.state.visualizacaoAtual);
        
        // TODO: Implementar renderização dinâmica baseada nos agendamentos
        // Isso depende da estrutura HTML específica da sua grade
    }
    
    /**
     * Carregar lista de agendamentos para visualização de lista
     */
    async loadAppointmentList() {
        try {
            console.log('📋 Carregando lista de agendamentos...');
            const dataFormatada = this.formatDate(this.state.dataAtual, 'YYYY-MM-DD');
            
            const agendamentos = await window.ApiService.getAgendamentos({
                data: dataFormatada,
                profissional_id: this.state.filtros.profissional_id,
                status: this.state.filtros.status
            });
            
            // Atualizar estado
            this.state.agendamentos = agendamentos || [];
            
            // Renderizar lista
            this.renderAppointmentList(this.state.agendamentos);
            
            console.log(`✅ Lista carregada: ${this.state.agendamentos.length} agendamentos`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar lista:', error);
            this.showError('Erro ao carregar agendamentos. Usando dados locais.');
            
            // Renderizar com dados locais
            this.renderAppointmentList(this.state.agendamentos);
        }
    }
    
    /**
     * Renderizar lista de agendamentos
     */
    renderAppointmentList(agendamentos) {
        const listView = document.getElementById('list-view');
        if (!listView) {
            console.warn('⚠️ Elemento list-view não encontrado');
            return;
        }
        
        if (!agendamentos || agendamentos.length === 0) {
            listView.innerHTML = `
                <div class="bg-white rounded-lg shadow p-8 text-center">
                    <i class="fas fa-calendar-times text-gray-300 text-4xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-700">Nenhum agendamento</h3>
                    <p class="text-gray-500 mt-2">Não há agendamentos para esta data</p>
                    <button onclick="window.agendaSystem.openAppointmentModal()" 
                            class="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                        <i class="fas fa-plus mr-2"></i> Criar Primeiro Agendamento
                    </button>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="bg-white rounded-lg shadow">
                <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Agendamentos</h3>
                    <span class="text-sm text-gray-500">${agendamentos.length} itens</span>
                </div>
                <div class="divide-y divide-gray-200">
        `;
        
        agendamentos.forEach(agendamento => {
            const statusColor = this.getStatusColor(agendamento.status);
            const horaInicio = this.formatTime(agendamento.data_hora);
            const clienteNome = agendamento.cliente_nome || agendamento.cliente?.nome || 'Cliente';
            const profissionalNome = agendamento.profissional_nome || agendamento.profissional?.nome || 'Profissional';
            const servicoNome = agendamento.servico_nome || agendamento.servico?.nome || 'Serviço';
            const valor = agendamento.valor ? `R$ ${agendamento.valor}` : '';
            
            html += `
                <div class="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                    <div class="flex items-center space-x-4">
                        <div class="w-3 h-3 ${statusColor} rounded-full flex-shrink-0"></div>
                        <div>
                            <div class="font-medium">${clienteNome}</div>
                            <div class="text-sm text-gray-500">
                                ${horaInicio} • ${profissionalNome} • ${servicoNome} ${valor ? '• ' + valor : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2 flex-shrink-0">
                        <span class="px-2 py-1 ${this.getStatusBadgeClass(agendamento.status)} text-xs rounded-full">
                            ${this.formatStatus(agendamento.status)}
                        </span>
                        <div class="flex space-x-1">
                            ${this.getActionButtons(agendamento)}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
        listView.innerHTML = html;
        
        // Reconfigurar eventos após renderizar
        setTimeout(() => this.setupAppointmentEventListeners(), 100);
    }
    
    /**
     * Obter botões de ação baseado no status
     */
    getActionButtons(agendamento) {
        let buttons = '';
        const id = agendamento.id;
        const clienteNome = agendamento.cliente_nome || 'Cliente';
        const servicoNome = agendamento.servico_nome || 'Serviço';
        const profissionalNome = agendamento.profissional_nome || 'Profissional';
        const valor = agendamento.valor || 0;
        
        // Botão de detalhes (sempre visível)
        buttons += `
            <button class="detail-btn px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                    data-id="${id}"
                    data-client="${clienteNome}"
                    data-service="${servicoNome}"
                    data-time="${this.formatTime(agendamento.data_hora)}"
                    data-professional="${profissionalNome}">
                <i class="fas fa-eye"></i>
            </button>
        `;
        
        // Botões específicos por status
        switch(agendamento.status) {
            case 'agendado':
                buttons += `
                    <button class="confirm-btn px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
                            data-id="${id}">
                        <i class="fas fa-check"></i>
                    </button>
                `;
                break;
            case 'confirmado':
                buttons += `
                    <button class="start-btn px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition"
                            data-id="${id}">
                        <i class="fas fa-play"></i>
                    </button>
                `;
                break;
            case 'em_andamento':
                buttons += `
                    <button class="complete-btn px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition"
                            data-id="${id}"
                            data-client="${clienteNome}"
                            data-service="${servicoNome}"
                            data-professional="${profissionalNome}"
                            data-price="${valor}">
                        <i class="fas fa-stop"></i>
                    </button>
                `;
                break;
        }
        
        // Botão de WhatsApp se tiver telefone
        if (agendamento.cliente_telefone || agendamento.cliente?.telefone) {
            const telefone = agendamento.cliente_telefone || agendamento.cliente?.telefone;
            buttons += `
                <button class="whatsapp-btn px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                        data-phone="${telefone}"
                        data-client="${clienteNome}"
                        data-service="${servicoNome}"
                        data-date="${this.formatDate(agendamento.data_hora, 'DD/MM/YYYY')}"
                        data-time="${this.formatTime(agendamento.data_hora)}">
                    <i class="fab fa-whatsapp"></i>
                </button>
            `;
        }
        
        // Botão de cancelar (sempre visível, exceto se já cancelado)
        if (agendamento.status !== 'cancelado' && agendamento.status !== 'concluido') {
            buttons += `
                <button class="cancel-appointment px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                        data-id="${id}"
                        data-client="${clienteNome}"
                        data-service="${servicoNome}">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }
        
        return buttons;
    }
    
    /**
     * Formatar status para exibição
     */
    formatStatus(status) {
        const statusMap = {
            'agendado': 'Agendado',
            'confirmado': 'Confirmado',
            'em_andamento': 'Em Andamento',
            'concluido': 'Concluído',
            'cancelado': 'Cancelado'
        };
        return statusMap[status] || status;
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
            
            // Atualizar interface baseado na visualização atual
            if (this.state.visualizacaoAtual === 'list') {
                this.renderAppointmentList(this.state.agendamentos);
            } else {
                this.updateAppointmentGrid();
            }
            
            console.log(`✅ Filtros aplicados: ${this.state.agendamentos.length} agendamentos`);
            
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
        
        console.log('📅 Navegando para:', this.formatDate(newDate, 'DD/MM/YYYY'));
    }
    
    /**
     * Mudar visualização
     */
    changeView(view) {
        if (!['day', 'week', 'month', 'list'].includes(view)) {
            console.warn(`⚠️ Visualização inválida: ${view}`);
            return;
        }
        
        this.state.visualizacaoAtual = view;
        console.log(`🔄 Mudando para visualização: ${view}`);
        
        this.updateAgendaView();
        this.applyFilters();
    }
    
    /**
     * Abrir modal de agendamento
     */
    openAppointmentModal() {
        if (!this.elements.appointmentModal) {
            console.error('❌ Modal de agendamento não encontrado');
            return;
        }
        
        this.elements.appointmentModal.classList.remove('hidden');
        this.switchTab('client');
        this.populateAppointmentModal();
        
        console.log('📝 Abrindo modal de novo agendamento');
    }
    
    /**
     * Popular modal de agendamento com dados
     */
    populateAppointmentModal() {
        // Preencher select de profissionais
        const profSelect = document.getElementById('professional');
        if (profSelect && this.state.profissionais.length > 0) {
            profSelect.innerHTML = '<option value="">Selecione um profissional</option>';
            this.state.profissionais.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = prof.nome || prof.nome_completo || `Profissional ${prof.id}`;
                profSelect.appendChild(option);
            });
        }
        
        // Preencher select de serviços
        const servSelect = document.getElementById('service');
        if (servSelect && this.state.servicos.length > 0) {
            servSelect.innerHTML = '<option value="">Selecione um serviço</option>';
            this.state.servicos.forEach(serv => {
                const option = document.createElement('option');
                option.value = serv.id;
                option.textContent = `${serv.nome} - R$ ${serv.valor || '0,00'}`;
                option.dataset.duration = serv.duracao || 60;
                option.dataset.price = serv.valor || 0;
                servSelect.appendChild(option);
            });
            
            // Adicionar evento para calcular duração
            servSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const duration = selectedOption.dataset.duration || 60;
                const price = selectedOption.dataset.price || 0;
                
                const durationElem = document.getElementById('duration');
                const priceElem = document.getElementById('service_price');
                const finalPriceElem = document.getElementById('final_price');
                
                if (durationElem) durationElem.value = `${duration} min`;
                if (priceElem) priceElem.value = `R$ ${price}`;
                if (finalPriceElem) finalPriceElem.value = `R$ ${price}`;
                
                // Calcular horário final
                this.calculateEndTime();
            });
        }
        
        // Definir data atual
        const dateInput = document.getElementById('appointment_date');
        if (dateInput) {
            dateInput.value = this.formatDate(this.state.dataAtual, 'YYYY-MM-DD');
            dateInput.min = this.formatDate(new Date(), 'YYYY-MM-DD'); // Não permitir datas passadas
        }
        
        // Definir horário padrão (próxima hora redonda)
        const timeInput = document.getElementById('start_time');
        if (timeInput) {
            const now = new Date();
            const nextHour = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora
            nextHour.setMinutes(0, 0, 0); // Redondo
            timeInput.value = this.formatTime(nextHour);
            this.calculateEndTime();
        }
        
        // Adicionar evento para calcular horário final
        if (timeInput) {
            timeInput.addEventListener('change', () => this.calculateEndTime());
        }
        
        // Limpar outros campos
        ['client_name', 'client_phone', 'client_email', 'notes'].forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.value = '';
        });
    }
    
    /**
     * Calcular horário final baseado na duração
     */
    calculateEndTime() {
        const startTime = document.getElementById('start_time');
        const duration = document.getElementById('duration');
        
        if (!startTime || !startTime.value || !duration || !duration.value) return;
        
        const durationMatch = duration.value.match(/(\d+)/);
        if (!durationMatch) return;
        
        const durationMinutes = parseInt(durationMatch[1]);
        const [hours, minutes] = startTime.value.split(':').map(Number);
        
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
        const endTimeElem = document.getElementById('end_time');
        if (endTimeElem) {
            endTimeElem.value = endTime;
        }
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
            
            // Atualizar estatísticas
            try {
                const statsData = await window.ApiService.getEstatisticasHoje();
                if (statsData) {
                    this.updateStatistics(statsData);
                }
            } catch (statsError) {
                console.warn('⚠️ Não foi possível atualizar estatísticas:', statsError.message);
            }
            
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
            { id: 'client_name', name: 'Nome do Cliente' },
            { id: 'client_phone', name: 'Telefone' },
            { id: 'professional', name: 'Profissional' },
            { id: 'service', name: 'Serviço' },
            { id: 'appointment_date', name: 'Data' },
            { id: 'start_time', name: 'Horário de Início' }
        ];
        
        for (const field of requiredFields) {
            const fieldElem = document.getElementById(field.id);
            if (!fieldElem || !fieldElem.value.trim()) {
                this.showError(`Por favor, preencha o campo: ${field.name}`);
                fieldElem?.focus();
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Obter dados do formulário de agendamento
     */
    getAppointmentFormData() {
        const date = document.getElementById('appointment_date').value;
        const time = document.getElementById('start_time').value;
        const serviceElem = document.getElementById('service');
        const selectedService = serviceElem.options[serviceElem.selectedIndex];
        
        return {
            cliente_nome: document.getElementById('client_name').value,
            cliente_telefone: document.getElementById('client_phone').value,
            cliente_email: document.getElementById('client_email').value || null,
            profissional_id: document.getElementById('professional').value,
            servico_id: document.getElementById('service').value,
            data_hora: `${date}T${time}:00`,
            duracao: parseInt(selectedService.dataset.duration) || 60,
            observacoes: document.getElementById('notes').value || '',
            valor: parseFloat(selectedService.dataset.price) || 0,
            status: 'agendado'
        };
    }
    
    /**
     * Abrir modal de bloqueio de horário
     */
    openBlockTimeModal() {
        if (!this.elements.blockTimeModal) {
            console.error('❌ Modal de bloqueio não encontrado');
            return;
        }
        
        this.elements.blockTimeModal.classList.remove('hidden');
        
        // Preencher data atual
        const dateInput = document.getElementById('block_date');
        if (dateInput) {
            dateInput.value = this.formatDate(this.state.dataAtual, 'YYYY-MM-DD');
            dateInput.min = this.formatDate(new Date(), 'YYYY-MM-DD');
        }
        
        // Preencher profissionais
        const profSelect = document.getElementById('block_professional');
        if (profSelect && this.state.profissionais.length > 0) {
            profSelect.innerHTML = '<option value="all">Todos os Profissionais</option>';
            this.state.profissionais.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = prof.nome || prof.nome_completo;
                profSelect.appendChild(option);
            });
        }
        
        // Definir horários padrão
        const startTime = document.getElementById('block_start_time');
        const endTime = document.getElementById('block_end_time');
        
        if (startTime) startTime.value = '09:00';
        if (endTime) endTime.value = '10:00';
        
        console.log('🔒 Abrindo modal de bloqueio de horário');
    }
    
    /**
     * Salvar bloqueio de horário
     */
    async saveBlockTime() {
        try {
            const profissionalId = document.getElementById('block_professional').value;
            const data = document.getElementById('block_date').value;
            const startTime = document.getElementById('block_start_time').value;
            const endTime = document.getElementById('block_end_time').value;
            const motivo = document.getElementById('block_reason').value;
            
            if (!data || !startTime || !endTime) {
                this.showError('Preencha data e horários');
                return;
            }
            
            const formData = {
                profissional_id: profissionalId === 'all' ? null : profissionalId,
                data_inicio: `${data}T${startTime}:00`,
                data_fim: `${data}T${endTime}:00`,
                motivo: motivo || 'Horário bloqueado'
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
        if (!this.elements.quickFitModal) {
            console.error('❌ Modal de encaixe rápido não encontrado');
            return;
        }
        
        this.elements.quickFitModal.classList.remove('hidden');
        
        // Preencher profissionais
        const profSelect = document.getElementById('quick_professional');
        if (profSelect && this.state.profissionais.length > 0) {
            profSelect.innerHTML = '<option value="">Selecione um profissional</option>';
            this.state.profissionais.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = prof.nome || prof.nome_completo;
                profSelect.appendChild(option);
            });
        }
        
        // Preencher serviços
        const servSelect = document.getElementById('quick_service');
        if (servSelect && this.state.servicos.length > 0) {
            servSelect.innerHTML = '<option value="">Selecione um serviço</option>';
            this.state.servicos.forEach(serv => {
                const option = document.createElement('option');
                option.value = serv.id;
                option.textContent = serv.nome;
                servSelect.appendChild(option);
            });
        }
        
        // Esconder resultado inicial
        const resultElem = document.getElementById('quickFitResult');
        if (resultElem) {
            resultElem.classList.add('hidden');
        }
        
        console.log('⚡ Abrindo modal de encaixe rápido');
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
            
            // Encontrar duração do serviço
            const servico = this.state.servicos.find(s => s.id == servicoId);
            const duracao = servico?.duracao || 60;
            
            // Buscar horários livres para hoje
            const horarios = await window.ApiService.getHorariosLivres(profissionalId, data);
            
            if (!horarios || horarios.length === 0) {
                const resultElem = document.getElementById('quickFitResult');
                if (resultElem) {
                    resultElem.classList.add('hidden');
                }
                this.showError('Nenhum horário disponível para hoje');
                return;
            }
            
            // Encontrar primeiro horário que acomoda a duração
            let horarioDisponivel = null;
            for (const horario of horarios) {
                // Verificar se o horário acomoda a duração
                // (simplificado - na prática precisaria verificar sobreposição)
                horarioDisponivel = horario;
                break;
            }
            
            if (horarioDisponivel) {
                const availableTime = document.getElementById('availableTime');
                const availableDate = document.getElementById('availableDate');
                const resultElem = document.getElementById('quickFitResult');
                
                if (availableTime && availableDate && resultElem) {
                    availableTime.textContent = this.formatTime(horarioDisponivel.data_hora);
                    availableDate.textContent = this.formatDate(horarioDisponivel.data_hora, 'DD/MM/YYYY');
                    resultElem.classList.remove('hidden');
                    
                    // Botão para criar agendamento
                    const scheduleBtn = resultElem.querySelector('button');
                    if (scheduleBtn) {
                        scheduleBtn.onclick = () => {
                            this.quickScheduleAppointment(profissionalId, servicoId, horarioDisponivel.data_hora, duracao);
                        };
                    }
                }
            } else {
                this.showError('Nenhum horário disponível que acomode este serviço');
            }
            
        } catch (error) {
            console.error('❌ Erro ao buscar horário:', error);
            this.showError('Erro ao buscar horário disponível');
        }
    }
    
    /**
     * Criar agendamento rápido
     */
    async quickScheduleAppointment(profissionalId, servicoId, dataHora, duracao) {
        try {
            // Aqui você implementaria a criação rápida do agendamento
            // Por enquanto, apenas redireciona para o modal completo
            this.closeAllModals();
            this.openAppointmentModal();
            
            // Preencher automaticamente
            setTimeout(() => {
                const profSelect = document.getElementById('professional');
                const servSelect = document.getElementById('service');
                const dateInput = document.getElementById('appointment_date');
                const timeInput = document.getElementById('start_time');
                
                if (profSelect) profSelect.value = profissionalId;
                if (servSelect) servSelect.value = servicoId;
                if (dateInput) dateInput.value = this.formatDate(dataHora, 'YYYY-MM-DD');
                if (timeInput) timeInput.value = this.formatTime(dataHora);
                
                // Disparar eventos de change
                if (servSelect) servSelect.dispatchEvent(new Event('change'));
            }, 100);
            
        } catch (error) {
            console.error('❌ Erro ao agendar rapidamente:', error);
            this.showError('Erro ao criar agendamento rápido');
        }
    }
    
    /**
     * Abrir detalhes do agendamento por ID
     */
    async openAppointmentDetailById(id) {
        try {
            // Buscar detalhes completos do agendamento
            const agendamentos = await window.ApiService.getAgendamentos({ id: id });
            const agendamento = agendamentos && agendamentos.length > 0 ? agendamentos[0] : null;
            
            if (!agendamento) {
                this.showError('Agendamento não encontrado');
                return;
            }
            
            this.openAppointmentDetailModal(
                agendamento.cliente_nome || 'Cliente',
                agendamento.servico_nome || 'Serviço',
                this.formatTime(agendamento.data_hora),
                agendamento.profissional_nome || 'Profissional'
            );
            
        } catch (error) {
            console.error('❌ Erro ao buscar detalhes:', error);
            this.showError('Erro ao carregar detalhes do agendamento');
        }
    }
    
    /**
     * Abrir modal de detalhes do agendamento
     */
    openAppointmentDetailModal(client, service, time, professional) {
        if (!this.elements.appointmentDetailModal) {
            console.error('❌ Modal de detalhes não encontrado');
            return;
        }
        
        this.elements.appointmentDetailModal.classList.remove('hidden');
        
        // Preencher dados
        const detailClient = document.getElementById('detailClient');
        const detailService = document.getElementById('detailService');
        const detailTime = document.getElementById('detailTime');
        const detailProfessional = document.getElementById('detailProfessional');
        
        if (detailClient) detailClient.textContent = client;
        if (detailService) detailService.textContent = service;
        if (detailTime) detailTime.textContent = time;
        if (detailProfessional) detailProfessional.textContent = professional;
        
        // Definir data atual para ajuste
        const adjustDate = document.getElementById('adjustDate');
        if (adjustDate) {
            adjustDate.value = this.formatDate(this.state.dataAtual, 'YYYY-MM-DD');
        }
        
        console.log('🔍 Abrindo detalhes do agendamento:', { client, service, time, professional });
    }
    
    /**
     * Abrir modal de checkout
     */
    async openCheckoutModal(id, client, service, professional, price) {
        if (!this.elements.checkoutModal) {
            console.error('❌ Modal de checkout não encontrado');
            return;
        }
        
        this.elements.checkoutModal.classList.remove('hidden');
        
        // Preencher dados
        const checkoutClient = document.getElementById('checkoutClient');
        const checkoutService = document.getElementById('checkoutService');
        const checkoutProfessional = document.getElementById('checkoutProfessional');
        const checkoutServicePrice = document.getElementById('checkoutServicePrice');
        const checkoutTotal = document.getElementById('checkoutTotal');
        
        if (checkoutClient) checkoutClient.textContent = client;
        if (checkoutService) checkoutService.textContent = service;
        if (checkoutProfessional) checkoutProfessional.textContent = professional;
        if (checkoutServicePrice) checkoutServicePrice.textContent = `R$ ${price || '0,00'}`;
        if (checkoutTotal) checkoutTotal.textContent = `R$ ${price || '0,00'}`;
        
        // Resetar métodos de pagamento
        const paymentMethod = document.getElementById('payment_method');
        if (paymentMethod) paymentMethod.value = '';
        
        document.querySelectorAll('.payment-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Configurar métodos de pagamento
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.payment-option').forEach(o => 
                    o.classList.remove('selected')
                );
                e.target.closest('.payment-option').classList.add('selected');
                const methodElem = document.getElementById('payment_method');
                if (methodElem) {
                    methodElem.value = e.target.closest('.payment-option').dataset.method;
                }
            });
        });
        
        // Atualizar total quando gorjeta for alterada
        const tipAmount = document.getElementById('tip_amount');
        if (tipAmount) {
            tipAmount.value = '0';
            tipAmount.addEventListener('input', (e) => {
                const tip = parseFloat(e.target.value) || 0;
                const servicePrice = parseFloat(price) || 0;
                const total = servicePrice + tip;
                if (checkoutTotal) {
                    checkoutTotal.textContent = 
                        `R$ ${total.toFixed(2).replace('.', ',')}`;
                }
            });
        }
        
        // Configurar botão de finalizar checkout
        const saveCheckoutBtn = document.querySelector('#saveCheckout');
        if (saveCheckoutBtn) {
            saveCheckoutBtn.onclick = () => this.finalizeCheckout(id);
        }
        
        console.log('💰 Abrindo checkout para agendamento:', id);
    }
    
    /**
     * Finalizar checkout
     */
    async finalizeCheckout(id) {
        try {
            const paymentMethod = document.getElementById('payment_method').value;
            const tipAmount = parseFloat(document.getElementById('tip_amount').value) || 0;
            
            if (!paymentMethod) {
                this.showError('Selecione um método de pagamento');
                return;
            }
            
            console.log(`💳 Finalizando checkout ${id}: ${paymentMethod} + R$ ${tipAmount}`);
            
            // Atualizar status para concluído
            await window.ApiService.mudarStatusAgendamento(id, 'concluido');
            
            // TODO: Registrar pagamento
            
            this.closeAllModals();
            await this.applyFilters();
            
            this.showConfirmation('Pagamento realizado com sucesso! Atendimento concluído.');
            
        } catch (error) {
            console.error('❌ Erro ao finalizar checkout:', error);
            this.showError('Erro ao processar pagamento: ' + error.message);
        }
    }
    
    /**
     * Confirmar agendamento
     */
    async confirmAppointment(id) {
        try {
            if (!confirm('Confirmar este agendamento?')) {
                return;
            }
            
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
            if (!confirm('Iniciar atendimento?')) {
                return;
            }
            
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
     * Enviar mensagem no WhatsApp
     */
    sendWhatsAppMessage(phone, client, service, date, time) {
        if (!phone) {
            this.showError('Número de telefone não disponível');
            return;
        }
        
        const message = `Olá ${client}! Lembrete: Seu agendamento para ${service} está marcado para ${date} às ${time}.`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodedMessage}`;
        
        console.log('📱 Enviando WhatsApp:', whatsappUrl);
        window.open(whatsappUrl, '_blank');
    }
    
    /**
     * Alternar entre abas
     */
    switchTab(tabId) {
        if (!['client', 'service', 'payment'].includes(tabId)) {
            console.warn(`⚠️ Tab inválida: ${tabId}`);
            return;
        }
        
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
        
        console.log(`📑 Alternando para aba: ${tabId}`);
    }
    
    /**
     * Fechar todos os modais
     */
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        
        console.log('🚪 Fechando todos os modais');
    }
    
    /**
     * Abrir calendário
     */
    openCalendar() {
        // TODO: Implementar seletor de calendário
        console.log('📅 Abrindo seletor de calendário');
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
        } else {
            // Fallback simples
            alert(`✅ ${message}`);
        }
        
        console.log(`✅ ${message}`);
    }
    
    /**
     * Mostrar mensagem de erro
     */
    showError(message) {
        console.error(`❌ ${message}`);
        
        // Tentar usar overlay de erro, se existir
        const errorOverlay = document.getElementById('errorOverlay');
        const errorPopup = document.getElementById('errorPopup');
        const errorMsg = document.getElementById('errorMessage');
        
        if (errorOverlay && errorPopup && errorMsg) {
            errorMsg.textContent = message;
            errorOverlay.style.display = 'block';
            errorPopup.style.display = 'block';
            
            setTimeout(() => {
                errorOverlay.style.display = 'none';
                errorPopup.style.display = 'none';
            }, 5000);
        } else {
            // Fallback para alert
            alert(`❌ ${message}`);
        }
    }
    
    /**
     * Formatar data
     */
    formatDate(date, format = 'DD/MM/YYYY') {
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                console.warn('⚠️ Data inválida para formatação:', date);
                return '--/--/----';
            }
            
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            
            switch(format) {
                case 'YYYY-MM-DD':
                    return `${year}-${month}-${day}`;
                case 'DD/MM/YYYY':
                    return `${day}/${month}/${year}`;
                case 'MM/DD/YYYY':
                    return `${month}/${day}/${year}`;
                default:
                    return `${day}/${month}/${year}`;
            }
        } catch (error) {
            console.error('❌ Erro ao formatar data:', error);
            return '--/--/----';
        }
    }
    
    /**
     * Formatar hora
     */
    formatTime(dateTime) {
        try {
            const d = new Date(dateTime);
            if (isNaN(d.getTime())) {
                console.warn('⚠️ Hora inválida para formatação:', dateTime);
                return '--:--';
            }
            
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (error) {
            console.error('❌ Erro ao formatar hora:', error);
            return '--:--';
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('📅 DOM pronto, iniciando sistema de agenda...');
    
    // Verificar se ApiService está disponível
    setTimeout(() => {
        if (typeof window.ApiService === 'undefined') {
            console.error('❌ ApiService não carregado após 1 segundo!');
            
            // Tentar carregar novamente
            const apiScript = document.createElement('script');
            apiScript.src = '../js/api.js';
            apiScript.onload = () => {
                console.log('🔄 ApiService carregado dinamicamente');
                setTimeout(() => {
                    window.agendaSystem = new AgendaSystem();
                }, 100);
            };
            apiScript.onerror = () => {
                console.error('❌ Falha ao carregar api.js dinamicamente');
                // Criar sistema mesmo sem API (modo limitado)
                window.agendaSystem = new AgendaSystem();
            };
            document.head.appendChild(apiScript);
        } else {
            console.log('✅ ApiService já carregado, iniciando AgendaSystem');
            window.agendaSystem = new AgendaSystem();
        }
    }, 100);
});

// Disponibilizar funções de debug no console
window.debugAgenda = {
    reloadData: () => {
        if (window.agendaSystem) {
            window.agendaSystem.loadInitialData();
        }
    },
    showState: () => {
        if (window.agendaSystem) {
            console.log('📊 Estado atual:', window.agendaSystem.state);
        }
    },
    testApi: () => {
        if (window.ApiService) {
            console.log('🧪 Testando ApiService...');
            window.ApiService.getProfissionais()
                .then(data => console.log('✅ Profissionais:', data))
                .catch(err => console.error('❌ Erro:', err));
        }
    }
};

console.log('👨‍💻 Funções de debug disponíveis: window.debugAgenda');