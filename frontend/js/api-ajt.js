// Serviço para comunicação com a API
const API_BASE = 'http://localhost:3000/api';

class ApiService {
  // Agendamentos
  static async getAgendamentos() {
    const response = await fetch(`${API_BASE}/agendamentos`);
    return await response.json();
  }

  static async getAgendamentosPorData(data) {
    const response = await fetch(`${API_BASE}/agendamentos/data/${data}`);
    return await response.json();
  }

  static async criarAgendamento(agendamento) {
    const response = await fetch(`${API_BASE}/agendamentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agendamento)
    });
    return await response.json();
  }

  static async atualizarAgendamento(id, dados) {
    const response = await fetch(`${API_BASE}/agendamentos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados)
    });
    return await response.json();
  }

  static async cancelarAgendamento(id) {
    const response = await fetch(`${API_BASE}/agendamentos/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  }

  // Clientes
  static async getClientes() {
    const response = await fetch(`${API_BASE}/clientes`);
    return await response.json();
  }

  static async criarCliente(cliente) {
    const response = await fetch(`${API_BASE}/clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cliente)
    });
    return await response.json();
  }

  // Serviços
  static async getServicos() {
    const response = await fetch(`${API_BASE}/servicos`);
    return await response.json();
  }

  // Profissionais
  static async getProfissionais() {
    const response = await fetch(`${API_BASE}/profissionais`);
    return await response.json();
  }
}
// Buscar um cliente específico por ID
async function getCliente(id) {
    try {
        console.log(`🔍 Buscando cliente ID: ${id}`);
        const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Cliente carregado:', data);
        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('❌ Erro ao buscar cliente:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Excluir um cliente
async function excluirCliente(id) {
    try {
        console.log(`🗑️ Excluindo cliente ID: ${id}`);
        const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        console.log('✅ Cliente excluído com sucesso');
        return {
            success: true,
            message: 'Cliente excluído com sucesso'
        };
    } catch (error) {
        console.error('❌ Erro ao excluir cliente:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Atualizar um cliente existente
async function atualizarCliente(id, clienteData) {
    try {
        console.log(`✏️ Atualizando cliente ID: ${id}`, clienteData);
        const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(clienteData)
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Cliente atualizado:', data);
        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('❌ Erro ao atualizar cliente:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Criar novo cliente
async function criarCliente(clienteData) {
    try {
        console.log('📝 Criando novo cliente:', clienteData);
        const response = await fetch(`${API_BASE_URL}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(clienteData)
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Cliente criado:', data);
        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('❌ Erro ao criar cliente:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Buscar todos os clientes
async function getClientes() {
    try {
        console.log('🔍 Buscando todos os clientes...');
        const response = await fetch(`${API_BASE_URL}/clientes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ ${data.length} clientes carregados`);
        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('❌ Erro ao buscar clientes:', error);
        return {
            success: false,
            error: error.message,
            data: [] // Retorna array vazio para evitar erros
        };
    }
}