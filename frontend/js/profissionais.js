// profissionais.js - ARQUIVO PRINCIPAL (ORQUESTRAÇÃO)
// Controla o fluxo entre serviços e interface

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar a UI
    ProfissionaisUI.init();
    
    // Carregar profissionais e atualizar a interface
    initProfissionais();
    
    // Configurar eventos de filtro e busca (se houver)
    setupEventListeners();
});

// Função para inicializar profissionais
async function initProfissionais() {
    try {
        // Usar o serviço para carregar profissionais
        const profissionais = await ProfissionaisService.getProfissionais();
        
        // Atualizar os dados na UI
        ProfissionaisUI.profissionaisData = profissionais;
        
        // Renderizar a tabela
        ProfissionaisUI.renderProfissionaisTable(profissionais);
        
        // Atualizar estatísticas
        ProfissionaisUI.updateStats(profissionais);
        
    } catch (error) {
        console.error('Erro ao inicializar profissionais:', error);
        showNotification('Erro ao carregar profissionais', 'error');
    }
}

// Função para configurar event listeners adicionais
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

// Aplicar filtro
async function applyFilter(filter) {
    try {
        let filteredData = [...ProfissionaisUI.profissionaisData];
        
        if (filter === 'ativos') {
            filteredData = filteredData.filter(p => p.status === 'ativo');
        } else if (filter === 'inativos') {
            filteredData = filteredData.filter(p => p.status === 'inativo');
        } else if (filter === 'ferias') {
            filteredData = filteredData.filter(p => p.status === 'ferias');
        }
        
        ProfissionaisUI.renderProfissionaisTable(filteredData);
    } catch (error) {
        console.error('Erro ao aplicar filtro:', error);
    }
}

// Aplicar busca
async function applySearch(searchTerm) {
    if (!searchTerm) {
        ProfissionaisUI.renderProfissionaisTable(ProfissionaisUI.profissionaisData);
        return;
    }
    
    const filtered = ProfissionaisUI.profissionaisData.filter(profissional => 
        profissional.nome.toLowerCase().includes(searchTerm) ||
        profissional.email?.toLowerCase().includes(searchTerm) ||
        profissional.telefone?.includes(searchTerm) ||
        profissional.especialidade?.toLowerCase().includes(searchTerm)
    );
    
    ProfissionaisUI.renderProfissionaisTable(filtered);
}

// Handler para salvar profissional
async function saveProfessionalHandler() {
    try {
        // Validar formulário
        if (!ProfissionaisUI.validateProfessionalForm()) {
            return;
        }

        const formData = ProfissionaisUI.getProfessionalFormData();
        
        if (ProfissionaisUI.professionalEditingId) {
            // Editar profissional existente
            await ProfissionaisService.atualizarProfissional(ProfissionaisUI.professionalEditingId, formData);
            showNotification('Profissional atualizado com sucesso!', 'success');
        } else {
            // Criar novo profissional
            await ProfissionaisService.criarProfissional(formData);
            showNotification('Profissional criado com sucesso!', 'success');
        }

        // Recarregar lista
        await initProfissionais();
        ProfissionaisUI.closeProfessionalModal();
        
    } catch (error) {
        console.error('Erro ao salvar profissional:', error);
        showNotification('Erro ao salvar profissional. Usando modo de demonstração.', 'warning');
        
        // Modo de demonstração: atualizar dados locais
        if (ProfissionaisUI.professionalEditingId) {
            const index = ProfissionaisUI.profissionaisData.findIndex(p => p.id == ProfissionaisUI.professionalEditingId);
            if (index !== -1) {
                Object.assign(ProfissionaisUI.profissionaisData[index], formData);
                ProfissionaisUI.renderProfissionaisTable(ProfissionaisUI.profissionaisData);
                ProfissionaisUI.updateStats(ProfissionaisUI.profissionaisData);
            }
        } else {
            // Adicionar novo profissional com ID simulado
            const novoId = Math.max(...ProfissionaisUI.profissionaisData.map(p => p.id)) + 1;
            const novoProfissional = {
                id: novoId,
                ...formData,
                status: 'ativo'
            };
            ProfissionaisUI.profissionaisData.push(novoProfissional);
            ProfissionaisUI.renderProfissionaisTable(ProfissionaisUI.profissionaisData);
            ProfissionaisUI.updateStats(ProfissionaisUI.profissionaisData);
        }
        
        ProfissionaisUI.closeProfessionalModal();
    }
}

// Handler para excluir/inativar profissional
async function deleteProfessional(professionalId) {
    try {
        const profissional = ProfissionaisUI.profissionaisData.find(p => p.id == professionalId);
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
            await ProfissionaisService.inativarProfissional(professionalId);
            showNotification('Profissional inativado com sucesso!', 'success');
        } else {
            // Reativar
            await ProfissionaisService.reativarProfissional(professionalId);
            showNotification('Profissional reativado com sucesso!', 'success');
        }

        // Recarregar lista
        await initProfissionais();
        
    } catch (error) {
        console.error('Erro ao alterar status do profissional:', error);
        showNotification('Erro ao alterar status. Usando modo de demonstração.', 'warning');
        
        // Modo de demonstração: alternar status localmente
        const profissional = ProfissionaisUI.profissionaisData.find(p => p.id == professionalId);
        if (profissional) {
            profissional.status = profissional.status === 'ativo' ? 'inativo' : 'ativo';
            ProfissionaisUI.renderProfissionaisTable(ProfissionaisUI.profissionaisData);
            ProfissionaisUI.updateStats(ProfissionaisUI.profissionaisData);
            showNotification(`Profissional ${profissional.status === 'ativo' ? 'reativado' : 'inativado'} (modo demo)`, 'success');
        }
    }
}

// Carregar dados do profissional para edição
async function loadProfessionalData(professionalId) {
    try {
        const profissional = await ProfissionaisService.getProfissional(professionalId);
        const form = document.getElementById('professionalForm');
        
        if (!form) return;
        
        // Preencher campos básicos
        Object.keys(profissional).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = Boolean(profissional[key]);
                } else if (input.type === 'date' && profissional[key]) {
                    input.value = new Date(profissional[key]).toISOString().split('T')[0];
                } else {
                    input.value = profissional[key] || '';
                }
            }
        });
        
        // Preencher horários (se disponíveis)
        if (profissional.horarios) {
            Object.keys(profissional.horarios).forEach(dia => {
                const checkbox = form.querySelector(`[name="horarios[${dia}][ativa]"]`);
                const inicioInput = form.querySelector(`[name="horarios[${dia}][inicio]"]`);
                const fimInput = form.querySelector(`[name="horarios[${dia}][fim]"]`);
                
                if (checkbox && inicioInput && fimInput) {
                    checkbox.checked = profissional.horarios[dia].ativa || false;
                    inicioInput.value = profissional.horarios[dia].inicio || '';
                    fimInput.value = profissional.horarios[dia].fim || '';
                    inicioInput.disabled = !checkbox.checked;
                    fimInput.disabled = !checkbox.checked;
                }
            });
        }
        
        // Preencher foto preview (se houver)
        if (profissional.foto_url) {
            document.getElementById('photoPreview').src = profissional.foto_url;
        }
        
    } catch (error) {
        console.error('Erro ao carregar dados do profissional:', error);
        throw error;
    }
}

// Abrir modal de visualização
async function openViewProfessionalModal(professionalId) {
    try {
        ProfissionaisUI.currentProfessionalId = professionalId;
        await loadProfessionalViewData(professionalId);
        
        ProfissionaisUI.elementos.viewProfessionalModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Erro ao abrir modal de visualização:', error);
        showNotification('Erro ao carregar dados do profissional', 'error');
    }
}

// Fechar modal de visualização
function closeViewProfessionalModal() {
    ProfissionaisUI.elementos.viewProfessionalModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    ProfissionaisUI.currentProfessionalId = null;
}

// Carregar dados do profissional para visualização
async function loadProfessionalViewData(professionalId) {
    try {
        const profissional = await ProfissionaisService.getProfissional(professionalId);
        
        // Preencher dados básicos
        document.getElementById('viewProfessionalName').textContent = profissional.nome;
        document.getElementById('viewProfessionalInfo').textContent = 
            `${profissional.especialidade || 'Profissional'} • CPF: ${profissional.cpf || 'Não informado'}`;
        
        // Status
        const statusEl = document.getElementById('viewProfessionalStatus');
        statusEl.textContent = ProfissionaisUI.getStatusText(profissional.status);
        statusEl.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ProfissionaisUI.getStatusClass(profissional.status)}`;
        
        // Informações pessoais
        if (profissional.data_nascimento) {
            document.getElementById('viewProfessionalBirthdate').textContent = 
                ProfissionaisUI.formatDate(profissional.data_nascimento);
        }
        if (profissional.genero) {
            document.getElementById('viewProfessionalGender').textContent = profissional.genero;
        }
        if (profissional.data_admissao) {
            document.getElementById('viewProfessionalAdmission').textContent = 
                ProfissionaisUI.formatDate(profissional.data_admissao);
        }
        
        // Contato
        document.getElementById('viewProfessionalPhone').textContent = 
            profissional.telefone || 'Não informado';
        document.getElementById('viewProfessionalEmail').textContent = 
            profissional.email || 'Não informado';
        
        // Informações profissionais
        document.getElementById('viewProfessionalRole').textContent = 
            profissional.funcao || 'Não informada';
        document.getElementById('viewProfessionalSpecialties').textContent = 
            profissional.especialidade || 'Não informada';
        
        // Financeiro
        document.getElementById('viewProfessionalCommission').textContent = 
            profissional.comissao ? profissional.comissao + '%' : 'Não definida';
        
    } catch (error) {
        console.error('Erro ao carregar dados para visualização:', error);
        throw error;
    }
}

// Editar profissional a partir da visualização
function editProfessionalFromViewHandler() {
    if (ProfissionaisUI.currentProfessionalId) {
        closeViewProfessionalModal();
        setTimeout(() => {
            ProfissionaisUI.openProfessionalModal(ProfissionaisUI.currentProfessionalId);
        }, 300);
    }
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

// Atribuir handlers globais
window.saveProfessionalHandler = saveProfessionalHandler;
window.deleteProfessional = deleteProfessional;
window.loadProfessionalData = loadProfessionalData;
window.openViewProfessionalModal = openViewProfessionalModal;
window.closeViewProfessionalModal = closeViewProfessionalModal;
window.editProfessionalFromViewHandler = editProfessionalFromViewHandler;
window.loadProfessionalViewData = loadProfessionalViewData;