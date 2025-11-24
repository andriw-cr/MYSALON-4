// ===== FUNÇÕES GLOBAIS E COMPARTILHADAS =====

// Toggle Sidebar (Função Global)
function initializeSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('hidden');
            }
        });
    }
}

// Sistema de Abas (Função Global)
function initializeTabSystem(tabButtonsSelector, tabContentsSelector, tabPrefix = '') {
    const tabButtons = document.querySelectorAll(tabButtonsSelector);
    const tabContents = document.querySelectorAll(tabContentsSelector);

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove classe active de todas as abas
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Adiciona classe active à aba clicada
            this.classList.add('active');
            const contentId = tabPrefix ? `${tabId}-${tabPrefix}` : `${tabId}-tab`;
            const contentElement = document.getElementById(contentId);
            if (contentElement) {
                contentElement.classList.add('active');
            }
        });
    });
}

// Sistema de Sub-abas
function initializeSubtabSystem() {
    const subtabButtons = document.querySelectorAll('.subtab-button');
    const subtabContents = document.querySelectorAll('.subtab-content');

    subtabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const subtabId = this.getAttribute('data-subtab');
            
            // Remove classe active de todas as sub-abas
            subtabButtons.forEach(btn => btn.classList.remove('active'));
            subtabContents.forEach(content => content.classList.remove('active'));
            
            // Adiciona classe active à sub-aba clicada
            this.classList.add('active');
            const subtabContent = document.getElementById(`${subtabId}-subtab`);
            if (subtabContent) {
                subtabContent.classList.add('active');
            }
        });
    });
}

// Sistema de Modal Genérico
function initializeModalSystem(modalId, openButtonsSelector, closeButtonsSelector) {
    const modal = document.getElementById(modalId);
    const openButtons = document.querySelectorAll(openButtonsSelector);
    const closeButtons = document.querySelectorAll(closeButtonsSelector);

    if (!modal) return;

    // Abrir modal
    openButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.classList.remove('hidden');
        });
    });

    // Fechar modal
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.classList.add('hidden');
        });
    });

    // Fechar modal ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

// Sistema de Navegação entre Páginas/Subpáginas
function initializePageNavigation() {
    const subpages = document.querySelectorAll('.subpage');
    const pageTitle = document.getElementById('pageTitle');
    const backButtons = document.querySelectorAll('.back-button');

    function showSubpage(pageId, title) {
        subpages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        if (pageTitle) {
            pageTitle.textContent = title;
        }
    }

    // Event listeners para botões de navegação
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-page]') || e.target.closest('[data-page]')) {
            const button = e.target.matches('[data-page]') ? e.target : e.target.closest('[data-page]');
            const pageId = button.getAttribute('data-page');
            const title = button.getAttribute('data-title') || 'Detalhes';
            showSubpage(pageId, title);
        }
    });

    // Event listeners para botões de voltar
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            showSubpage('mainPage', 'Dashboard');
        });
    });
}

// Toggle Switches
function initializeToggleSwitches() {
    document.querySelectorAll('.toggle-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.nextElementSibling;
            if (this.checked) {
                label.style.backgroundColor = '#8b5cf6';
            } else {
                label.style.backgroundColor = '#d1d5db';
            }
        });

        // Initialize toggle states
        if (checkbox.checked) {
            const label = checkbox.nextElementSibling;
            label.style.backgroundColor = '#8b5cf6';
        }
    });
}

// ===== SISTEMA DE WHATSAPP UNIFICADO =====

function initializeWhatsAppSystem() {
    document.addEventListener('click', function(e) {
        // Verifica se o clique foi em qualquer botão do WhatsApp
        if (e.target.matches('.whatsapp-btn, .whatsapp-client') || 
            e.target.closest('.whatsapp-btn, .whatsapp-client')) {
            
            const button = e.target.matches('.whatsapp-btn, .whatsapp-client') ? 
                e.target : e.target.closest('.whatsapp-btn, .whatsapp-client');
            
            const phone = button.getAttribute('data-phone');
            const service = button.getAttribute('data-service');
            const date = button.getAttribute('data-date');
            const time = button.getAttribute('data-time');
            const client = button.getAttribute('data-client');
            
            sendWhatsAppMessage(phone, service, date, time, client);
        }
    });
}

function sendWhatsAppMessage(phone, service, date, time, client = '') {
    if (!phone) return;

    // Formatar o número de telefone
    const formattedPhone = phone.replace(/\D/g, '');
    
    // Criar mensagem personalizada
    let message = '';
    if (client) {
        message = `Olá ${client}! Gostaríamos de confirmar seu agendamento no BeautySys:\n\n`;
    } else {
        message = `Olá! Gostaríamos de confirmar seu agendamento no BeautySys:\n\n`;
    }
    
    message += `📅 *Data:* ${date}\n` +
               `⏰ *Horário:* ${time}\n` +
               `💇 *Serviço:* ${service}\n\n` +
               `Por favor, confirme sua presença respondendo:\n` +
               `✅ *SIM* - Para confirmar o agendamento\n` +
               `❌ *NÃO* - Para cancelar ou reagendar\n\n` +
               `Agradecemos pela preferência! 💜`;
    
    // Codificar a mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Criar URL do WhatsApp
    const whatsappUrl = `https://web.whatsapp.com/send?phone=55${formattedPhone}&text=${encodedMessage}`;
    
    // Abrir WhatsApp em uma nova aba
    window.open(whatsappUrl, '_blank');
}

// ===== SISTEMA DE CONFIRMAÇÃO DE EXCLUSÃO =====

function initializeDeleteConfirmation() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('.delete-product, .delete-service, .delete-client, .delete-professional, .cancel-appointment') || 
            e.target.closest('.delete-product, .delete-service, .delete-client, .delete-professional, .cancel-appointment')) {
            
            const button = e.target.matches('.delete-product, .delete-service, .delete-client, .delete-professional, .cancel-appointment') ? 
                e.target : e.target.closest('.delete-product, .delete-service, .delete-client, .delete-professional, .cancel-appointment');
            
            const itemId = button.getAttribute('data-id');
            const client = button.getAttribute('data-client');
            const service = button.getAttribute('data-service');
            
            let itemType = '';
            let confirmationMessage = '';
            
            if (button.classList.contains('cancel-appointment')) {
                itemType = 'agendamento';
                confirmationMessage = `Tem certeza que deseja cancelar o agendamento de ${service} para ${client}?`;
            } else {
                itemType = button.classList.contains('delete-product') ? 'produto' :
                          button.classList.contains('delete-service') ? 'serviço' :
                          button.classList.contains('delete-client') ? 'cliente' : 'profissional';
                confirmationMessage = `Tem certeza que deseja excluir este ${itemType}?`;
            }
            
            if (confirm(confirmationMessage)) {
                // Aqui você enviaria uma requisição para a API para excluir/cancelar o item
                if (itemType === 'agendamento') {
                    showConfirmation('Agendamento cancelado', `O agendamento de ${service} para ${client} foi cancelado com sucesso.`);
                    
                    // Atualizar interface (em um sistema real, isso viria da resposta da API)
                    const appointmentElement = button.closest('.p-4, .appointment-block');
                    if (appointmentElement) {
                        appointmentElement.remove();
                    }
                } else {
                    alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} excluído com sucesso!`);
                }
            }
        }
    });
}

// ===== SISTEMA DE CONFIRMAÇÃO UNIFICADO =====

function initializeConfirmationSystem() {
    const confirmationPopup = document.getElementById('confirmationPopup');
    const confirmationOverlay = document.getElementById('confirmationOverlay');
    const confirmationTitle = document.getElementById('confirmationTitle');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const closeConfirmation = document.getElementById('closeConfirmation');

    if (closeConfirmation) {
        closeConfirmation.addEventListener('click', function() {
            if (confirmationPopup) confirmationPopup.classList.remove('show');
            if (confirmationOverlay) confirmationOverlay.classList.remove('show');
        });
    }
}

// Função para mostrar popup de confirmação
function showConfirmation(title, message) {
    const confirmationPopup = document.getElementById('confirmationPopup');
    const confirmationOverlay = document.getElementById('confirmationOverlay');
    const confirmationTitle = document.getElementById('confirmationTitle');
    const confirmationMessage = document.getElementById('confirmationMessage');

    if (confirmationTitle && confirmationMessage) {
        confirmationTitle.textContent = title;
        confirmationMessage.textContent = message;
        if (confirmationPopup) confirmationPopup.classList.add('show');
        if (confirmationOverlay) confirmationOverlay.classList.add('show');
        
        // Fechar automaticamente após 3 segundos
        setTimeout(() => {
            if (confirmationPopup) confirmationPopup.classList.remove('show');
            if (confirmationOverlay) confirmationOverlay.classList.remove('show');
        }, 3000);
    } else {
        // Fallback para alert se o popup não existir
        alert(`${title}: ${message}`);
    }
}

// ===== MÓDULO DASHBOARD =====

function initializeDashboard() {
    // Dados para tooltips do gráfico
    const appointmentsData = {
        'Jan': { count: 45, details: 'Corte Feminino: 15, Manicure: 12, Coloração: 8, Outros: 10' },
        'Fev': { count: 52, details: 'Corte Feminino: 18, Manicure: 14, Coloração: 9, Outros: 11' },
        'Mar': { count: 38, details: 'Corte Feminino: 12, Manicure: 10, Coloração: 7, Outros: 9' },
        'Abr': { count: 62, details: 'Corte Feminino: 20, Manicure: 18, Coloração: 12, Outros: 12' },
        'Mai': { count: 58, details: 'Corte Feminino: 19, Manicure: 16, Coloração: 10, Outros: 13' },
        'Jun': { count: 68, details: 'Corte Feminino: 22, Manicure: 20, Coloração: 12, Outros: 14' },
        'Jul': { count: 64, details: 'Corte Feminino: 21, Manicure: 18, Coloração: 11, Outros: 14' },
        'Ago': { count: 72, details: 'Corte Feminino: 24, Manicure: 20, Coloração: 14, Outros: 14' },
        'Set': { count: 66, details: 'Corte Feminino: 22, Manicure: 19, Coloração: 12, Outros: 13' },
        'Out': { count: 74, details: 'Corte Feminino: 25, Manicure: 21, Coloração: 14, Outros: 14' }
    };

    // Gráfico de Faturamento
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'],
                datasets: [{
                    label: 'Faturamento (R$)',
                    data: [8500, 9200, 7800, 11000, 10500, 12000, 11500, 12500, 11800, 12800],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                const month = context.label;
                                const data = appointmentsData[month];
                                return [
                                    `Atendimentos: ${data.count}`,
                                    `Detalhes: ${data.details}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { drawBorder: false },
                        title: { display: true, text: 'Faturamento (R$)' }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Seleção de dias no calendário
    const calendarDays = document.querySelectorAll('.calendar-day:not(.text-gray-400)');
    calendarDays.forEach(day => {
        day.addEventListener('click', function() {
            calendarDays.forEach(d => d.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Botões de ação nos agendamentos
    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-edit') || e.target.closest('.btn-edit')) {
            const button = e.target.matches('.btn-edit') ? e.target : e.target.closest('.btn-edit');
            const appointmentId = button.getAttribute('data-appointment');
            alert(`Editando agendamento ID: ${appointmentId}`);
        }
    });

    // Botão Abrir Agenda
    const openAgendaBtn = document.getElementById('openAgendaBtn');
    if (openAgendaBtn) {
        openAgendaBtn.addEventListener('click', function() {
            window.location.href = './agenda.html';
        });
    }
}

// ===== MÓDULO FIDELIDADE =====

function initializeFidelidade() {
    // Gráfico de Pontuação
    const pointsCtx = document.getElementById('pointsChart');
    if (pointsCtx) {
        new Chart(pointsCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out'],
                datasets: [
                    {
                        label: 'Pontos Gerados',
                        data: [850, 920, 780, 1100, 1050, 1200, 1150, 1250, 1180, 1280],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Pontos Resgatados',
                        data: [420, 580, 450, 720, 680, 850, 780, 920, 850, 950],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: { beginAtZero: true, grid: { drawBorder: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Mostrar/ocultar regras baseadas no tipo de campanha
    const campaignType = document.getElementById('campaign_type');
    if (campaignType) {
        campaignType.addEventListener('change', function() {
            const type = this.value;
            document.querySelectorAll('.campaign-rules').forEach(el => {
                el.classList.add('hidden');
            });
            
            if (type === 'points') {
                const pointsRules = document.getElementById('points_rules');
                if (pointsRules) pointsRules.classList.remove('hidden');
            } else if (type === 'discount' || type === 'voucher') {
                const discountRules = document.getElementById('discount_rules');
                if (discountRules) discountRules.classList.remove('hidden');
            }
        });
    }
}

// ===== MÓDULO ESTOQUE =====

function initializeEstoque() {
    // Calcular custo total automaticamente
    const quantityInput = document.getElementById('quantity');
    const costPriceInput = document.getElementById('cost_price');
    const salePriceInput = document.getElementById('sale_price');

    if (quantityInput && costPriceInput) {
        quantityInput.addEventListener('input', calculateProductCosts);
        costPriceInput.addEventListener('input', calculateProductCosts);
    }

    if (salePriceInput) {
        salePriceInput.addEventListener('input', calculateProductCosts);
    }

    function calculateProductCosts() {
        // Calcular custo total
        const quantity = parseFloat(quantityInput?.value) || 0;
        const costPrice = parseFloat(costPriceInput?.value) || 0;
        const totalCost = quantity * costPrice;
        
        const totalCostElement = document.getElementById('total_cost');
        if (totalCostElement) {
            totalCostElement.value = `R$ ${totalCost.toFixed(2)}`;
        }
        
        // Calcular margem
        calculateMargin();
    }

    function calculateMargin() {
        const costPrice = parseFloat(costPriceInput?.value) || 0;
        const salePrice = parseFloat(salePriceInput?.value) || 0;
        const marginElement = document.getElementById('margin');
        
        if (costPrice > 0 && salePrice > 0 && marginElement) {
            const margin = ((salePrice - costPrice) / costPrice) * 100;
            marginElement.value = `${margin.toFixed(1)}%`;
        } else if (marginElement) {
            marginElement.value = '';
        }
    }
}

// ===== MÓDULO FINANCEIRO =====

function initializeFinanceiro() {
    // Atualização do resumo em tempo real para formulários
    function initializeFormResumo(formId, resumoPrefix) {
        const form = document.getElementById(formId);
        if (!form) return;

        const fields = form.querySelectorAll('input, select');
        
        fields.forEach(field => {
            field.addEventListener('change', () => updateResumo(resumoPrefix));
            field.addEventListener('input', () => updateResumo(resumoPrefix));
        });
    }

    function updateResumo(prefix) {
        const elements = {
            categoria: document.getElementById(`${prefix}_categoria`),
            valor: document.getElementById(`${prefix}_valor`),
            data: document.getElementById(`${prefix}_data`),
            pagamento: document.getElementById(`${prefix}_forma_pagamento`)
        };

        const resumoElements = {
            categoria: document.getElementById(`resumo_${prefix}_categoria`),
            valor: document.getElementById(`resumo_${prefix}_valor`),
            data: document.getElementById(`resumo_${prefix}_data`),
            pagamento: document.getElementById(`resumo_${prefix}_pagamento`)
        };

        if (elements.categoria && resumoElements.categoria) {
            resumoElements.categoria.textContent = 
                elements.categoria.options[elements.categoria.selectedIndex]?.text || '-';
        }

        if (elements.valor && resumoElements.valor) {
            resumoElements.valor.textContent = 
                elements.valor.value ? `R$ ${parseFloat(elements.valor.value).toFixed(2)}` : 'R$ 0,00';
        }

        if (elements.data && resumoElements.data) {
            resumoElements.data.textContent = elements.data.value || '-';
        }

        if (elements.pagamento && resumoElements.pagamento) {
            resumoElements.pagamento.textContent = 
                elements.pagamento.options[elements.pagamento.selectedIndex]?.text || '-';
        }
    }

    // Inicializar resumos para diferentes formulários
    initializeFormResumo('entradaForm', 'entrada');
    initializeFormResumo('saidaForm', 'saida');
    
    // Resumo específico para transferência
    const transferenciaForm = document.getElementById('transferenciaForm');
    if (transferenciaForm) {
        const transferenciaFields = transferenciaForm.querySelectorAll('input, select');
        transferenciaFields.forEach(field => {
            field.addEventListener('change', updateTransferenciaResumo);
            field.addEventListener('input', updateTransferenciaResumo);
        });
    }

    function updateTransferenciaResumo() {
        const elements = {
            origem: document.getElementById('transferencia_origem'),
            destino: document.getElementById('transferencia_destino'),
            valor: document.getElementById('transferencia_valor'),
            taxa: document.getElementById('transferencia_taxa'),
            data: document.getElementById('transferencia_data')
        };

        const resumoElements = {
            origem: document.getElementById('resumo_origem'),
            destino: document.getElementById('resumo_destino'),
            valor: document.getElementById('resumo_transferencia_valor'),
            taxa: document.getElementById('resumo_taxa'),
            data: document.getElementById('resumo_transferencia_data')
        };

        if (elements.origem && resumoElements.origem) {
            resumoElements.origem.textContent = 
                elements.origem.options[elements.origem.selectedIndex]?.text || '-';
        }

        if (elements.destino && resumoElements.destino) {
            resumoElements.destino.textContent = 
                elements.destino.options[elements.destino.selectedIndex]?.text || '-';
        }

        if (elements.valor && resumoElements.valor) {
            resumoElements.valor.textContent = 
                elements.valor.value ? `R$ ${parseFloat(elements.valor.value).toFixed(2)}` : 'R$ 0,00';
        }

        if (elements.taxa && resumoElements.taxa) {
            resumoElements.taxa.textContent = 
                elements.taxa.value ? `R$ ${parseFloat(elements.taxa.value).toFixed(2)}` : 'R$ 0,00';
        }

        if (elements.data && resumoElements.data) {
            resumoElements.data.textContent = elements.data.value || '-';
        }
    }

    // Validação de formulários
    const forms = ['entradaForm', 'saidaForm', 'transferenciaForm'];
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const type = formId.replace('Form', '').replace('entrada', 'Entrada').replace('saida', 'Saída').replace('transferencia', 'Transferência');
                showConfirmation(`${type} registrada`, `${type} registrada com sucesso!`);
                
                // Voltar para página principal
                const mainPage = document.getElementById('mainPage');
                const pageTitle = document.getElementById('pageTitle');
                if (mainPage && pageTitle) {
                    document.querySelectorAll('.subpage').forEach(page => page.classList.remove('active'));
                    mainPage.classList.add('active');
                    pageTitle.textContent = 'Financeiro';
                }
            });
        }
    });
}

// ===== MÓDULO CONFIGURAÇÕES =====

function initializeConfiguracoes() {
    // Navegação entre telas de operadoras
    const operadorasScreens = document.querySelectorAll('.operadoras-screen');
    const btnNovaOperadora = document.getElementById('btnNovaOperadora');
    const btnVoltarLista = document.getElementById('btnVoltarLista');
    const detailTitle = document.getElementById('detail-title');

    if (btnNovaOperadora) {
        btnNovaOperadora.addEventListener('click', function() {
            operadorasScreens.forEach(screen => screen.classList.add('hidden'));
            const operadorasDetail = document.getElementById('operadoras-detail');
            if (operadorasDetail) operadorasDetail.classList.remove('hidden');
            if (detailTitle) detailTitle.textContent = 'Nova Operadora';
            resetForm();
        });
    }

    if (btnVoltarLista) {
        btnVoltarLista.addEventListener('click', function() {
            operadorasScreens.forEach(screen => screen.classList.add('hidden'));
            const operadorasList = document.getElementById('operadoras-list');
            if (operadorasList) operadorasList.classList.remove('hidden');
        });
    }

    // Editar Operadora
    document.querySelectorAll('.btn-editar').forEach(button => {
        button.addEventListener('click', function() {
            const operadoraId = this.getAttribute('data-id');
            operadorasScreens.forEach(screen => screen.classList.add('hidden'));
            const operadorasDetail = document.getElementById('operadoras-detail');
            if (operadorasDetail) operadorasDetail.classList.remove('hidden');
            if (detailTitle) detailTitle.textContent = 'Editar Operadora';
            loadOperadoraData(operadoraId);
        });
    });

    // Salvar operadora
    const btnSalvarOperadora = document.getElementById('btnSalvarOperadora');
    if (btnSalvarOperadora) {
        btnSalvarOperadora.addEventListener('click', function() {
            showConfirmation('Operadora salva', 'Operadora salva com sucesso!');
            operadorasScreens.forEach(screen => screen.classList.add('hidden'));
            const operadorasList = document.getElementById('operadoras-list');
            if (operadorasList) operadorasList.classList.remove('hidden');
        });
    }
}

// Funções auxiliares para Configurações
function resetForm() {
    const fields = ['operadora_nome', 'operadora_tipo', 'operadora_codigo', 'operadora_descricao', 'operadora_token'];
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.value = '';
    });
    
    const status = document.getElementById('operadora_status');
    if (status) status.value = 'ativa';
    
    const api = document.getElementById('operadora_api');
    if (api) api.checked = false;
}

function loadOperadoraData(id) {
    // Simulação de carregamento de dados
    const operadoras = {
        '1': {
            nome: 'Stone', tipo: 'maquininha', codigo: 'STN001', status: 'ativa',
            descricao: 'Maquininha Stone modelo M3', api: true, token: 'token_stone_123'
        },
        '2': {
            nome: 'Cielo', tipo: 'gateway', codigo: 'CLO001', status: 'ativa',
            descricao: 'Gateway Cielo e-commerce', api: true, token: 'token_cielo_456'
        }
    };

    const operadora = operadoras[id];
    if (operadora) {
        const fields = {
            'operadora_nome': operadora.nome,
            'operadora_tipo': operadora.tipo,
            'operadora_codigo': operadora.codigo,
            'operadora_status': operadora.status,
            'operadora_descricao': operadora.descricao,
            'operadora_token': operadora.token
        };

        Object.keys(fields).forEach(field => {
            const element = document.getElementById(field);
            if (element) element.value = fields[field];
        });

        const api = document.getElementById('operadora_api');
        if (api) api.checked = operadora.api;
    }
}

// ===== MÓDULO AGENDA =====

function initializeAgenda() {
    // Declarar todas as variáveis no escopo da função
    let appointmentModal, btnNovoAgendamento, btnSaveAppointment, btnCancelAppointment;
    let closeAppointmentModal, modalTitle, appointmentForm, addServiceBtn;
    let additionalServicesContainer, blockTimeModal, btnBloquearHorario;
    let btnSaveBlockTime, btnCancelBlockTime, blockTimeForm, quickFitModal;
    let btnEncaixeRapido, btnFindQuickFit, btnCancelQuickFit, quickFitForm;
    let quickFitResult, availableTime, availableDate, checkoutModal;
    let checkoutForm, btnSaveCheckout, btnCancelCheckout, checkoutClient;
    let checkoutService, checkoutProfessional, checkoutServicePrice;
    let checkoutTotal, tipAmount, paymentMethod, appointmentDetailModal;
    let closeAppointmentDetailModal, cancelAppointmentDetail, saveTimeAdjustment;
    let adjustTimeForm, viewButtons, agendaViews, confirmButtons;
    let startButtons, completeButtons;

    // Contador para serviços adicionais
    let additionalServiceCount = 0;

    // Inicializar elementos do DOM
    function initializeDOMElements() {
        // Modal de Agendamento
        appointmentModal = document.getElementById('appointmentModal');
        btnNovoAgendamento = document.getElementById('btnNovoAgendamento');
        btnSaveAppointment = document.getElementById('saveAppointment');
        btnCancelAppointment = document.getElementById('cancelAppointment');
        closeAppointmentModal = document.getElementById('closeAppointmentModal');
        modalTitle = document.getElementById('modalTitle');
        appointmentForm = document.getElementById('appointmentForm');
        addServiceBtn = document.getElementById('add-service-btn');
        additionalServicesContainer = document.getElementById('additional-services-container');

        // Modal de Bloqueio de Horário
        blockTimeModal = document.getElementById('blockTimeModal');
        btnBloquearHorario = document.getElementById('btnBloquearHorario');
        btnSaveBlockTime = document.getElementById('saveBlockTime');
        btnCancelBlockTime = document.getElementById('cancelBlockTime');
        blockTimeForm = document.getElementById('blockTimeForm');

        // Modal de Encaixe Rápido
        quickFitModal = document.getElementById('quickFitModal');
        btnEncaixeRapido = document.getElementById('btnEncaixeRapido');
        btnFindQuickFit = document.getElementById('findQuickFit');
        btnCancelQuickFit = document.getElementById('cancelQuickFit');
        quickFitForm = document.getElementById('quickFitForm');
        quickFitResult = document.getElementById('quickFitResult');
        availableTime = document.getElementById('availableTime');
        availableDate = document.getElementById('availableDate');

        // Modal de Checkout
        checkoutModal = document.getElementById('checkoutModal');
        checkoutForm = document.getElementById('checkoutForm');
        btnSaveCheckout = document.getElementById('saveCheckout');
        btnCancelCheckout = document.getElementById('cancelCheckout');
        checkoutClient = document.getElementById('checkoutClient');
        checkoutService = document.getElementById('checkoutService');
        checkoutProfessional = document.getElementById('checkoutProfessional');
        checkoutServicePrice = document.getElementById('checkoutServicePrice');
        checkoutTotal = document.getElementById('checkoutTotal');
        tipAmount = document.getElementById('tip_amount');
        paymentMethod = document.getElementById('payment_method');

        // Modal de Detalhes do Agendamento
        appointmentDetailModal = document.getElementById('appointmentDetailModal');
        closeAppointmentDetailModal = document.getElementById('closeAppointmentDetailModal');
        cancelAppointmentDetail = document.getElementById('cancelAppointmentDetail');
        saveTimeAdjustment = document.getElementById('saveTimeAdjustment');
        adjustTimeForm = document.getElementById('adjustTimeForm');

        // Visualizações
        viewButtons = document.querySelectorAll('.view-button');
        agendaViews = document.querySelectorAll('.agenda-view');

        // Botões de ação na lista de agendamentos
        confirmButtons = document.querySelectorAll('.confirm-btn');
        startButtons = document.querySelectorAll('.start-btn');
        completeButtons = document.querySelectorAll('.complete-btn');
    }

    // Abrir modal para novo agendamento
    function initializeNovoAgendamento() {
        if (btnNovoAgendamento) {
            btnNovoAgendamento.addEventListener('click', function() {
                if (modalTitle) modalTitle.textContent = 'Novo Agendamento';
                if (appointmentForm) appointmentForm.reset();
                if (additionalServicesContainer) additionalServicesContainer.innerHTML = '';
                additionalServiceCount = 0;
                if (appointmentModal) appointmentModal.classList.remove('hidden');
                
                // Reset para a primeira aba
                const tabButtons = document.querySelectorAll('.tab-button');
                const tabContents = document.querySelectorAll('.tab-content');
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                const clientTab = document.querySelector('[data-tab="client"]');
                const clientContent = document.getElementById('client-tab');
                if (clientTab) clientTab.classList.add('active');
                if (clientContent) clientContent.classList.add('active');
            });
        }
    }

    // Fechar modal de agendamento
    function initializeFecharModal() {
        if (closeAppointmentModal) {
            closeAppointmentModal.addEventListener('click', function() {
                if (appointmentModal) appointmentModal.classList.add('hidden');
            });
        }

        if (btnCancelAppointment) {
            btnCancelAppointment.addEventListener('click', function() {
                if (appointmentModal) appointmentModal.classList.add('hidden');
            });
        }
    }

    // Adicionar serviço adicional
    function initializeServicosAdicionais() {
        if (addServiceBtn) {
            addServiceBtn.addEventListener('click', function() {
                additionalServiceCount++;
                const serviceHtml = `
                    <div class="additional-service" id="additional-service-${additionalServiceCount}">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="text-sm font-medium text-gray-700">Serviço Adicional ${additionalServiceCount}</h4>
                            <button type="button" class="remove-service-btn" data-service-id="${additionalServiceCount}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label for="additional_professional_${additionalServiceCount}" class="block text-sm font-medium text-gray-700">Profissional</label>
                                <select id="additional_professional_${additionalServiceCount}" name="additional_professional_${additionalServiceCount}" class="additional-professional mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" data-service-id="${additionalServiceCount}">
                                    <option value="">Selecione</option>
                                    <option value="1">Carla Silva</option>
                                    <option value="2">Rogério Santos</option>
                                    <option value="3">Amanda Costa</option>
                                    <option value="4">Marcos Alves</option>
                                </select>
                            </div>
                            <div>
                                <label for="additional_service_${additionalServiceCount}" class="block text-sm font-medium text-gray-700">Serviço</label>
                                <select id="additional_service_${additionalServiceCount}" name="additional_service_${additionalServiceCount}" class="additional-service-select mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" data-service-id="${additionalServiceCount}">
                                    <option value="">Selecione</option>
                                    <option value="1">Corte Feminino</option>
                                    <option value="2">Corte Masculino</option>
                                    <option value="3">Coloração</option>
                                    <option value="4">Manicure</option>
                                    <option value="5">Pedicure</option>
                                    <option value="6">Progressiva</option>
                                </select>
                            </div>
                            <div>
                                <label for="additional_start_time_${additionalServiceCount}" class="block text-sm font-medium text-gray-700">Horário de Início</label>
                                <input type="time" id="additional_start_time_${additionalServiceCount}" name="additional_start_time_${additionalServiceCount}" class="additional-start-time mt-1 focus:ring-purple-500 focus:border-purple-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" data-service-id="${additionalServiceCount}">
                            </div>
                            <div>
                                <label for="additional_duration_${additionalServiceCount}" class="block text-sm font-medium text-gray-700">Duração</label>
                                <input type="text" id="additional_duration_${additionalServiceCount}" name="additional_duration_${additionalServiceCount}" readonly class="additional-duration mt-1 bg-gray-100 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                            </div>
                        </div>
                        <div id="time-validation-${additionalServiceCount}" class="time-validation mt-2 hidden"></div>
                    </div>
                `;
                
                if (additionalServicesContainer) {
                    additionalServicesContainer.insertAdjacentHTML('beforeend', serviceHtml);
                    
                    // Adicionar event listeners para o novo serviço
                    const newServiceSelect = document.getElementById(`additional_service_${additionalServiceCount}`);
                    const newProfessionalSelect = document.getElementById(`additional_professional_${additionalServiceCount}`);
                    const newStartTime = document.getElementById(`additional_start_time_${additionalServiceCount}`);
                    
                    if (newServiceSelect) {
                        newServiceSelect.addEventListener('change', function() {
                            updateAdditionalServiceDuration(this);
                        });
                    }
                    
                    if (newProfessionalSelect) {
                        newProfessionalSelect.addEventListener('change', function() {
                            validateAdditionalServiceTime(this);
                        });
                    }
                    
                    if (newStartTime) {
                        newStartTime.addEventListener('change', function() {
                            validateAdditionalServiceTime(this);
                        });
                    }
                }
            });
        }
    }

    // Remover serviço adicional
    function initializeRemoverServicos() {
        document.addEventListener('click', function(e) {
            if (e.target.closest('.remove-service-btn')) {
                const button = e.target.closest('.remove-service-btn');
                const serviceId = button.getAttribute('data-service-id');
                const serviceElement = document.getElementById(`additional-service-${serviceId}`);
                if (serviceElement) {
                    serviceElement.remove();
                }
            }
        });
    }

    // Atualizar duração do serviço adicional
    function updateAdditionalServiceDuration(selectElement) {
        const serviceId = selectElement.getAttribute('data-service-id');
        const durationField = document.getElementById(`additional_duration_${serviceId}`);
        
        if (!durationField) return;
        
        const serviceDuration = {
            '1': '45', // Corte Feminino - 45 min
            '2': '30', // Corte Masculino - 30 min
            '3': '120', // Coloração - 2 horas
            '4': '40', // Manicure - 40 min
            '5': '45', // Pedicure - 45 min
            '6': '180' // Progressiva - 3 horas
        };
        
        const duration = serviceDuration[selectElement.value] || '0';
        durationField.value = `${duration} minutos`;
        
        // Validar horário após atualizar a duração
        validateAdditionalServiceTime(selectElement);
    }

    // Validar horário do serviço adicional
    function validateAdditionalServiceTime(element) {
        const serviceId = element.getAttribute('data-service-id');
        const professionalSelect = document.getElementById(`additional_professional_${serviceId}`);
        const startTimeInput = document.getElementById(`additional_start_time_${serviceId}`);
        const serviceSelect = document.getElementById(`additional_service_${serviceId}`);
        const validationDiv = document.getElementById(`time-validation-${serviceId}`);
        
        if (!professionalSelect || !startTimeInput || !serviceSelect || !validationDiv) return;
        
        if (!professionalSelect.value || !startTimeInput.value || !serviceSelect.value) {
            validationDiv.classList.add('hidden');
            return;
        }
        
        // Simulação de validação de horário disponível
        const professional = professionalSelect.value;
        const startTime = startTimeInput.value;
        const serviceDuration = {
            '1': '45', // Corte Feminino - 45 min
            '2': '30', // Corte Masculino - 30 min
            '3': '120', // Coloração - 2 horas
            '4': '40', // Manicure - 40 min
            '5': '45', // Pedicure - 45 min
            '6': '180' // Progressiva - 3 horas
        };
        
        const duration = serviceDuration[serviceSelect.value] || '30';
        
        // Simulação: horários das 14:00 às 16:00 estão ocupados
        const busyTimes = ['14:00', '14:30', '15:00', '15:30'];
        
        if (busyTimes.includes(startTime)) {
            validationDiv.textContent = 'Horário indisponível para este profissional';
            validationDiv.className = 'time-validation unavailable';
            validationDiv.classList.remove('hidden');
        } else {
            validationDiv.textContent = 'Horário disponível';
            validationDiv.className = 'time-validation available';
            validationDiv.classList.remove('hidden');
        }
    }

    // Salvar agendamento
    function initializeSalvarAgendamento() {
        if (btnSaveAppointment) {
            btnSaveAppointment.addEventListener('click', function() {
                // Aqui você enviaria os dados do formulário para a API
                showConfirmation('Agendamento realizado', 'O agendamento foi salvo com sucesso!');
                if (appointmentModal) appointmentModal.classList.add('hidden');
            });
        }
    }

    // Inicializar outros componentes da agenda
    function initializeOutrosComponentes() {
        // Abrir modal para bloquear horário
        if (btnBloquearHorario) {
            btnBloquearHorario.addEventListener('click', function() {
                // Preencher data atual como padrão
                const today = new Date().toISOString().split('T')[0];
                const blockDate = document.getElementById('block_date');
                if (blockDate) blockDate.value = today;
                
                if (blockTimeModal) blockTimeModal.classList.remove('hidden');
            });
        }

        // Abrir modal para encaixe rápido
        if (btnEncaixeRapido) {
            btnEncaixeRapido.addEventListener('click', function() {
                if (quickFitForm) quickFitForm.reset();
                if (quickFitResult) quickFitResult.classList.add('hidden');
                if (quickFitModal) quickFitModal.classList.remove('hidden');
            });
        }

        // Abrir modal de checkout ao clicar em finalizar
        document.addEventListener('click', function(e) {
            if (e.target.closest('.complete-btn')) {
                const button = e.target.closest('.complete-btn');
                const client = button.getAttribute('data-client');
                const service = button.getAttribute('data-service');
                const professional = button.getAttribute('data-professional');
                const price = button.getAttribute('data-price');
                
                // Preencher dados no modal de checkout
                if (checkoutClient) checkoutClient.textContent = client;
                if (checkoutService) checkoutService.textContent = service;
                if (checkoutProfessional) checkoutProfessional.textContent = professional;
                if (checkoutServicePrice) checkoutServicePrice.textContent = `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
                if (checkoutTotal) checkoutTotal.textContent = `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
                
                // Resetar formulário
                if (checkoutForm) checkoutForm.reset();
                document.querySelectorAll('.payment-option').forEach(option => {
                    option.classList.remove('selected');
                });
                
                if (checkoutModal) checkoutModal.classList.remove('hidden');
            }
        });

        // Abrir modal de detalhes ao clicar no botão de detalhes
        document.addEventListener('click', function(e) {
            if (e.target.closest('.detail-btn')) {
                const button = e.target.closest('.detail-btn');
                const client = button.getAttribute('data-client');
                const service = button.getAttribute('data-service');
                const time = button.getAttribute('data-time');
                const professional = button.getAttribute('data-professional');
                
                // Preencher dados no modal de detalhes
                const detailClient = document.getElementById('detailClient');
                const detailService = document.getElementById('detailService');
                const detailTime = document.getElementById('detailTime');
                const detailProfessional = document.getElementById('detailProfessional');
                
                if (detailClient) detailClient.textContent = client;
                if (detailService) detailService.textContent = service;
                if (detailTime) detailTime.textContent = time;
                if (detailProfessional) detailProfessional.textContent = professional;
                
                // Simular dados adicionais (em um sistema real, isso viria da API)
                const detailPhone = document.getElementById('detailPhone');
                const detailDate = document.getElementById('detailDate');
                const detailStatus = document.getElementById('detailStatus');
                const detailNotes = document.getElementById('detailNotes');
                
                if (detailPhone) detailPhone.textContent = '(11) 99999-9999';
                if (detailDate) detailDate.textContent = '16/10/2023';
                if (detailStatus) detailStatus.textContent = 'Agendado';
                if (detailNotes) detailNotes.textContent = 'Cliente prefere produtos para cabelos cacheados';
                
                // Preencher formulário de ajuste com dados atuais
                const adjustDate = document.getElementById('adjustDate');
                const adjustTime = document.getElementById('adjustTime');
                
                if (adjustDate) adjustDate.value = '2023-10-16';
                if (adjustTime) adjustTime.value = time.split(' - ')[0]; // Pega apenas o horário de início
                
                if (appointmentDetailModal) appointmentDetailModal.classList.remove('hidden');
            }
        });

        // Fechar modal de detalhes
        if (closeAppointmentDetailModal) {
            closeAppointmentDetailModal.addEventListener('click', function() {
                if (appointmentDetailModal) appointmentDetailModal.classList.add('hidden');
            });
        }

        if (cancelAppointmentDetail) {
            cancelAppointmentDetail.addEventListener('click', function() {
                if (appointmentDetailModal) appointmentDetailModal.classList.add('hidden');
            });
        }

        // Salvar ajuste de horário
        if (saveTimeAdjustment) {
            saveTimeAdjustment.addEventListener('click', function() {
                const adjustDate = document.getElementById('adjustDate');
                const adjustTime = document.getElementById('adjustTime');
                
                if (!adjustDate || !adjustTime || !adjustDate.value || !adjustTime.value) {
                    alert('Por favor, preencha a data e o horário.');
                    return;
                }
                
                const newDate = adjustDate.value;
                const newTime = adjustTime.value;
                
                // Aqui você enviaria os dados para a API
                showConfirmation('Horário ajustado', 'O horário do agendamento foi ajustado com sucesso!');
                if (appointmentDetailModal) appointmentDetailModal.classList.add('hidden');
            });
        }

        // Navegação entre visualizações
        if (viewButtons.length > 0) {
            viewButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const viewId = this.getAttribute('data-view');
                    
                    // Remove classe active de todos os botões e visualizações
                    viewButtons.forEach(btn => {
                        btn.classList.remove('bg-purple-600', 'text-white');
                        btn.classList.add('bg-white', 'text-gray-700');
                    });
                    agendaViews.forEach(view => view.classList.remove('active'));
                    
                    // Adiciona classe active à visualização clicada
                    this.classList.remove('bg-white', 'text-gray-700');
                    this.classList.add('bg-purple-600', 'text-white');
                    const targetView = document.getElementById(`${viewId}-view`);
                    if (targetView) targetView.classList.add('active');
                });
            });
        }

        // Seleção de método de pagamento
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.payment-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                if (paymentMethod) paymentMethod.value = this.getAttribute('data-method');
            });
        });

        // Calcular total com gorjeta
        if (tipAmount) {
            tipAmount.addEventListener('input', function() {
                if (!checkoutServicePrice || !checkoutTotal) return;
                
                const servicePriceText = checkoutServicePrice.textContent.replace('R$ ', '').replace(',', '.');
                const servicePrice = parseFloat(servicePriceText) || 0;
                const tip = parseFloat(this.value) || 0;
                const total = servicePrice + tip;
                checkoutTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
            });
        }

        // Fechar outros modais
        if (btnCancelBlockTime) {
            btnCancelBlockTime.addEventListener('click', function() {
                if (blockTimeModal) blockTimeModal.classList.add('hidden');
            });
        }

        if (btnCancelQuickFit) {
            btnCancelQuickFit.addEventListener('click', function() {
                if (quickFitModal) quickFitModal.classList.add('hidden');
            });
        }

        if (btnCancelCheckout) {
            btnCancelCheckout.addEventListener('click', function() {
                if (checkoutModal) checkoutModal.classList.add('hidden');
            });
        }

        // Salvar bloqueio de horário
        if (btnSaveBlockTime) {
            btnSaveBlockTime.addEventListener('click', function() {
                // Aqui você enviaria os dados para a API
                showConfirmation('Horário bloqueado', 'O horário foi bloqueado com sucesso!');
                if (blockTimeModal) blockTimeModal.classList.add('hidden');
            });
        }

        // Buscar encaixe rápido
        if (btnFindQuickFit) {
            btnFindQuickFit.addEventListener('click', function() {
                const quickClient = document.getElementById('quick_client');
                const quickProfessional = document.getElementById('quick_professional');
                const quickService = document.getElementById('quick_service');
                
                if (!quickClient || !quickProfessional || !quickService || 
                    !quickClient.value || !quickProfessional.value || !quickService.value) {
                    alert('Por favor, preencha todos os campos.');
                    return;
                }
                
                const client = quickClient.value;
                const professional = quickProfessional.value;
                const service = quickService.value;
                
                // Simulação de busca do próximo horário disponível
                const serviceDuration = {
                    '1': '45', // Corte Feminino - 45 min
                    '2': '30', // Corte Masculino - 30 min
                    '3': '120', // Coloração - 2 horas
                    '4': '40', // Manicure - 40 min
                    '5': '45', // Pedicure - 45 min
                    '6': '180' // Progressiva - 3 horas
                };
                
                const duration = serviceDuration[service] || '30';
                
                // Simulação de horário disponível
                const now = new Date();
                const nextAvailable = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora a partir de agora
                
                const hours = nextAvailable.getHours().toString().padStart(2, '0');
                const minutes = nextAvailable.getMinutes().toString().padStart(2, '0');
                
                if (availableTime) availableTime.textContent = `${hours}:${minutes}`;
                if (availableDate) availableDate.textContent = nextAvailable.toLocaleDateString('pt-BR');
                
                if (quickFitResult) quickFitResult.classList.remove('hidden');
            });
        }

        // Finalizar checkout
        if (btnSaveCheckout) {
            btnSaveCheckout.addEventListener('click', function() {
                if (!paymentMethod || !paymentMethod.value) {
                    alert('Por favor, selecione uma forma de pagamento.');
                    return;
                }
                
                const client = checkoutClient ? checkoutClient.textContent : '';
                const service = checkoutService ? checkoutService.textContent : '';
                const professional = checkoutProfessional ? checkoutProfessional.textContent : '';
                const total = checkoutTotal ? checkoutTotal.textContent : '';
                const tip = tipAmount ? tipAmount.value || '0' : '0';
                
                const selectedPayment = document.querySelector('.payment-option.selected span');
                const paymentMethodName = selectedPayment ? selectedPayment.textContent : 'Desconhecido';
                
                // Aqui você enviaria os dados para a API
                showConfirmation('Atendimento finalizado', `Pagamento de ${total} realizado com sucesso via ${paymentMethodName}.`);
                if (checkoutModal) checkoutModal.classList.add('hidden');
                
                // Atualizar status do agendamento na interface
                // Em um sistema real, isso seria feito via API
                const appointmentBlock = document.querySelector(`.complete-btn[data-client="${client}"]`)?.closest('.appointment-block');
                if (appointmentBlock) {
                    appointmentBlock.classList.remove('status-in-progress');
                    appointmentBlock.classList.add('status-completed');
                    
                    // Remover botão de finalizar
                    const completeButton = appointmentBlock.querySelector('.complete-btn');
                    if (completeButton) {
                        completeButton.remove();
                    }
                }
            });
        }

        // Ações nos agendamentos
        if (confirmButtons.length > 0) {
            confirmButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Aqui você enviaria a confirmação para a API
                    showConfirmation('Agendamento confirmado', 'O agendamento foi confirmado com sucesso!');
                });
            });
        }

        if (startButtons.length > 0) {
            startButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Aqui você enviaria o início do serviço para a API
                    showConfirmation('Serviço iniciado', 'O serviço foi iniciado com sucesso!');
                });
            });
        }

        // Atualizar horário final baseado na duração do serviço
        const serviceSelect = document.getElementById('service');
        if (serviceSelect) {
            serviceSelect.addEventListener('change', function() {
                const serviceDuration = {
                    '1': '45', // Corte Feminino - 45 min
                    '2': '30', // Corte Masculino - 30 min
                    '3': '120', // Coloração - 2 horas
                    '4': '40', // Manicure - 40 min
                    '5': '45', // Pedicure - 45 min
                    '6': '180' // Progressiva - 3 horas
                };
                
                const duration = serviceDuration[this.value] || '0';
                const durationField = document.getElementById('duration');
                if (durationField) durationField.value = `${duration} minutos`;
                
                // Calcular horário final
                const startTime = document.getElementById('start_time');
                const endTime = document.getElementById('end_time');
                
                if (startTime && startTime.value && endTime) {
                    const [hours, minutes] = startTime.value.split(':').map(Number);
                    const endTimeDate = new Date();
                    endTimeDate.setHours(hours, minutes + parseInt(duration), 0, 0);
                    
                    const endHours = endTimeDate.getHours().toString().padStart(2, '0');
                    const endMinutes = endTimeDate.getMinutes().toString().padStart(2, '0');
                    endTime.value = `${endHours}:${endMinutes}`;
                }
            });
        }

        // Atualizar preço do serviço
        if (serviceSelect) {
            serviceSelect.addEventListener('change', function() {
                const servicePrices = {
                    '1': '60.00', // Corte Feminino
                    '2': '40.00', // Corte Masculino
                    '3': '120.00', // Coloração
                    '4': '35.00', // Manicure
                    '5': '40.00', // Pedicure
                    '6': '180.00' // Progressiva
                };
                
                const price = servicePrices[this.value] || '0.00';
                const servicePrice = document.getElementById('service_price');
                const finalPrice = document.getElementById('final_price');
                
                if (servicePrice) servicePrice.value = `R$ ${price}`;
                if (finalPrice) finalPrice.value = `R$ ${price}`;
            });
        }

        // Calcular desconto
        const discountInput = document.getElementById('discount');
        if (discountInput) {
            discountInput.addEventListener('input', function() {
                const servicePrice = document.getElementById('service_price');
                const finalPrice = document.getElementById('final_price');
                
                if (!servicePrice || !finalPrice) return;
                
                const servicePriceValue = servicePrice.value.replace('R$ ', '') || '0';
                const discount = this.value || '0';
                const finalPriceValue = (parseFloat(servicePriceValue) - parseFloat(discount)).toFixed(2);
                finalPrice.value = `R$ ${finalPriceValue}`;
            });
        }

        // Simular linha do tempo atual
        function updateCurrentTimeLine() {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            // Calcular posição baseada no horário atual (das 8h às 18h)
            const totalMinutes = (currentHour - 8) * 60 + currentMinute;
            const position = (totalMinutes / 60) * 60; // 60px por hora
            
            const timeLine = document.querySelector('.current-time-line');
            if (timeLine) {
                timeLine.style.top = `${position}px`;
            }
        }

        // Atualizar a cada minuto
        updateCurrentTimeLine();
        setInterval(updateCurrentTimeLine, 60000);

        // Atualizar data atual
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            currentDateElement.textContent = now.toLocaleDateString('pt-BR', options);
        }
    }

    // Inicializar todos os componentes
    function initializeAll() {
        initializeDOMElements();
        initializeNovoAgendamento();
        initializeFecharModal();
        initializeServicosAdicionais();
        initializeRemoverServicos();
        initializeSalvarAgendamento();
        initializeOutrosComponentes();
    }

    // Iniciar tudo
    initializeAll();
}

// ===== FUNÇÕES DE UTILIDADE =====

// Função para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para formatar data
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

// Função para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Função para validar telefone
function isValidPhone(phone) {
    const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;
    return phoneRegex.test(phone);
}

// ===== FUNÇÕES AUXILIARES DE VERIFICAÇÃO =====

// Função para verificar se elemento existe antes de usar
function safeQuerySelector(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`⚠️ Elemento não encontrado: ${selector}`);
    }
    return element;
}

function safeGetElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`⚠️ Elemento não encontrado: #${id}`);
    }
    return element;
}

// Função para inicializar eventos com segurança
function safeAddEventListener(element, event, handler) {
    if (element && typeof handler === 'function') {
        element.addEventListener(event, handler);
    } else {
        console.warn(`⚠️ Não foi possível adicionar event listener para:`, element);
    }
}

// ===== INICIALIZAÇÃO GERAL DA APLICAÇÃO =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando BeautySys...');
    
    // Verificar se estamos em uma página que requer inicialização específica
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    // Inicializar sistemas globais (apenas se os elementos existirem)
    try {
        initializeSidebarToggle();
        initializeTabSystem('.tab-button', '.tab-content');
        initializeSubtabSystem();
        initializePageNavigation();
        initializeToggleSwitches();
        initializeDeleteConfirmation();
        initializeWhatsAppSystem();
        initializeConfirmationSystem();

        // Inicializar modais genéricos apenas se existirem na página
        initializeModalSystem('productModal', '#btnNovoProduto', '#cancelProduct');
        initializeModalSystem('serviceModal', '#btnNovoServico', '#cancelService');
        initializeModalSystem('clientModal', '#btnNovoCliente', '#cancelClient');
        initializeModalSystem('professionalModal', '#btnNovoProfissional', '#cancelProfessional');
        initializeModalSystem('campaignModal', '#btnNovaCampanha', '#cancelCampaign');

        console.log('✅ Sistemas globais inicializados');
    } catch (error) {
        console.warn('⚠️ Alguns sistemas globais não puderam ser inicializados:', error.message);
    }

    // Inicializar módulos específicos baseados na página atual
    try {
        switch(currentPage) {
            case 'dashboard.html':
                initializeDashboard();
                console.log('✅ Módulo Dashboard inicializado');
                break;
            case 'fidelidade.html':
                initializeFidelidade();
                console.log('✅ Módulo Fidelidade inicializado');
                break;
            case 'estoque.html':
                initializeEstoque();
                console.log('✅ Módulo Estoque inicializado');
                break;
            case 'financeiro.html':
                initializeFinanceiro();
                console.log('✅ Módulo Financeiro inicializado');
                break;
            case 'configuracoes.html':
                initializeConfiguracoes();
                console.log('✅ Módulo Configurações inicializado');
                break;
            case 'agenda.html':
                initializeAgenda();
                console.log('✅ Módulo Agenda inicializado');
                break;
            case 'clientes.html':
                // Clientes é inicializado pelo próprio clientes.js
                console.log('📋 Página de Clientes - Sistema inicializado pelo clientes.js');
                break;
            default:
                console.log('🔍 Página não identificada, inicializando sistemas básicos');
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo específico:', error);
    }

    console.log('🎉 Sistema BeautySys inicializado com sucesso!');
});