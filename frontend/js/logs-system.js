// logs-system.js - Sistema completo de logs
class LogsSystem {
    constructor() {
        this.logs = [];
        this.filteredLogs = [];
        this.currentPage = 1;
        this.logsPerPage = 20;
        this.autoRefreshInterval = null;
        
        this.init();
    }

    init() {
        this.loadLogs();
        this.initializeEventListeners();
        this.startAutoRefresh();
        this.updateStats();
        this.renderLogs();
    }

    initializeEventListeners() {
        // Filtros
        document.getElementById('filterLevel').addEventListener('change', () => this.filterLogs());
        document.getElementById('searchLogs').addEventListener('input', () => this.filterLogs());
        document.getElementById('filterDate').addEventListener('change', () => this.filterLogs());

        // Controles
        document.getElementById('autoRefresh').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });

        document.getElementById('btnClearLogs').addEventListener('click', () => this.clearLogs());
        document.getElementById('btnExportLogs').addEventListener('click', () => this.exportLogs());

        // Paginação
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());

        // Modal
        document.getElementById('closeDetailModal').addEventListener('click', () => {
            document.getElementById('logDetailModal').classList.add('hidden');
        });

        // Fechar modal clicando fora
        document.getElementById('logDetailModal').addEventListener('click', (e) => {
            if (e.target.id === 'logDetailModal') {
                e.target.classList.add('hidden');
            }
        });
    }

    loadLogs() {
        const savedLogs = localStorage.getItem('beautysys_logs');
        this.logs = savedLogs ? JSON.parse(savedLogs) : [];
        this.filteredLogs = [...this.logs];
    }

    saveLogs() {
        localStorage.setItem('beautysys_logs', JSON.stringify(this.logs));
    }

    addLog(level, module, message, details = null) {
        const logEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            level: level,
            module: module,
            message: message,
            details: details,
            userAgent: navigator.userAgent
        };

        this.logs.unshift(logEntry); // Adiciona no início
        this.saveLogs();
        this.filterLogs();
        this.updateStats();
        
        // Se estiver na página de logs, atualiza a visualização
        if (window.location.pathname.includes('logs.html')) {
            this.renderLogs();
        }
    }

    filterLogs() {
        const levelFilter = document.getElementById('filterLevel').value;
        const searchTerm = document.getElementById('searchLogs').value.toLowerCase();
        const dateFilter = document.getElementById('filterDate').value;

        this.filteredLogs = this.logs.filter(log => {
            // Filtro por nível
            if (levelFilter !== 'all' && log.level !== levelFilter) {
                return false;
            }

            // Filtro por busca
            if (searchTerm && !log.message.toLowerCase().includes(searchTerm) && 
                !log.module.toLowerCase().includes(searchTerm)) {
                return false;
            }

            // Filtro por data
            if (dateFilter) {
                const logDate = log.timestamp.split('T')[0];
                if (logDate !== dateFilter) {
                    return false;
                }
            }

            return true;
        });

        this.currentPage = 1;
        this.renderLogs();
    }

    renderLogs() {
        const tbody = document.getElementById('logsTableBody');
        const startIndex = (this.currentPage - 1) * this.logsPerPage;
        const endIndex = startIndex + this.logsPerPage;
        const currentLogs = this.filteredLogs.slice(startIndex, endIndex);

        tbody.innerHTML = currentLogs.map(log => `
            <tr class="log-${log.level} hover:bg-gray-50 cursor-pointer" onclick="logsSystem.showLogDetail(${log.id})">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${this.formatDateTime(log.timestamp)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${this.getLevelBadgeClass(log.level)}">
                        ${this.getLevelText(log.level)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${log.module}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                    ${log.message}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${log.details ? '<i class="fas fa-info-circle text-blue-500"></i>' : ''}
                </td>
            </tr>
        `).join('');

        this.updatePagination();
    }

    showLogDetail(logId) {
        const log = this.logs.find(l => l.id === logId);
        if (!log) return;

        const detailContent = {
            'ID': log.id,
            'Data/Hora': this.formatDateTime(log.timestamp),
            'Nível': log.level,
            'Módulo': log.module,
            'Mensagem': log.message,
            'Detalhes': log.details,
            'User Agent': log.userAgent
        };

        document.getElementById('logDetailContent').textContent = 
            JSON.stringify(detailContent, null, 2);
        
        document.getElementById('logDetailModal').classList.remove('hidden');
    }

    updateStats() {
        const stats = {
            error: this.logs.filter(log => log.level === 'error').length,
            warning: this.logs.filter(log => log.level === 'warning').length,
            info: this.logs.filter(log => log.level === 'info').length,
            success: this.logs.filter(log => log.level === 'success').length
        };

        document.getElementById('errorCount').textContent = stats.error;
        document.getElementById('warningCount').textContent = stats.warning;
        document.getElementById('infoCount').textContent = stats.info;
        document.getElementById('successCount').textContent = stats.success;
        document.getElementById('totalCount').textContent = this.logs.length;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredLogs.length / this.logsPerPage);
        const startIndex = (this.currentPage - 1) * this.logsPerPage + 1;
        const endIndex = Math.min(startIndex + this.logsPerPage - 1, this.filteredLogs.length);

        document.getElementById('showingStart').textContent = startIndex;
        document.getElementById('showingEnd').textContent = endIndex;
        document.getElementById('totalLogs').textContent = this.filteredLogs.length;

        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderLogs();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredLogs.length / this.logsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderLogs();
        }
    }

    clearLogs() {
        if (confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
            this.logs = [];
            this.filteredLogs = [];
            this.saveLogs();
            this.updateStats();
            this.renderLogs();
        }
    }

    exportLogs() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `beautysys-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.autoRefreshInterval = setInterval(() => {
            this.loadLogs();
            this.filterLogs();
        }, 5000); // Atualiza a cada 5 segundos
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    // Utilitários
    formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('pt-BR');
    }

    getLevelBadgeClass(level) {
        const classes = {
            error: 'bg-red-100 text-red-800',
            warning: 'bg-yellow-100 text-yellow-800',
            info: 'bg-blue-100 text-blue-800',
            success: 'bg-green-100 text-green-800',
            debug: 'bg-gray-100 text-gray-800'
        };
        return classes[level] || classes.info;
    }

    getLevelText(level) {
        const texts = {
            error: 'Erro',
            warning: 'Alerta',
            info: 'Info',
            success: 'Sucesso',
            debug: 'Debug'
        };
        return texts[level] || level;
    }
}

// Inicializar sistema de logs
const logsSystem = new LogsSystem();

// Funções globais para uso em outros módulos
window.logError = (module, message, details = null) => {
    logsSystem.addLog('error', module, message, details);
    console.error(`[${module}] ${message}`, details);
};

window.logWarning = (module, message, details = null) => {
    logsSystem.addLog('warning', module, message, details);
    console.warn(`[${module}] ${message}`, details);
};

window.logInfo = (module, message, details = null) => {
    logsSystem.addLog('info', module, message, details);
    console.info(`[${module}] ${message}`, details);
};

window.logSuccess = (module, message, details = null) => {
    logsSystem.addLog('success', module, message, details);
    console.log(`[${module}] ✅ ${message}`, details);
};

// Exemplo de uso no sistema existente:
// logError('ClientesSystem', 'Erro ao carregar clientes', error.stack);
// logSuccess('ApiService', 'Cliente criado com sucesso', clienteData);