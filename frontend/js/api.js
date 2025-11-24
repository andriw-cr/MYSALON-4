// api.js - ApiService CONECTADO AO SQLITE REAL - Versão ES Modules
import sqlite3 from 'sqlite3';
import { DB_PATH } from './database-config.js';

class ApiServiceClass {
    constructor() {
        this.dbPath = DB_PATH; // Usa o caminho do database-config.js
        this.initDatabase();
        console.log('✅ ApiServiceClass com SQLite REAL inicializado!');
    }

    initDatabase() {
        this.getDatabase((db) => {
            if (db) {
                db.get("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1", (err, row) => {
                    if (err) {
                        console.error('❌ Erro ao conectar com o banco:', err.message);
                    } else {
                        console.log('✅ Conexão com SQLite estabelecida com sucesso!');
                    }
                    db.close();
                });
            }
        });
    }

    getDatabase(callback) {
        try {
            const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error('❌ Erro ao abrir banco:', err.message);
                    callback(null);
                } else {
                    callback(db);
                }
            });
        } catch (error) {
            console.error('❌ Erro no getDatabase:', error);
            callback(null);
        }
    }

    // ===== CLIENTES =====
    
    async getClientes() {
        return new Promise((resolve) => {
            this.getDatabase((db) => {
                if (!db) {
                    resolve({
                        success: false,
                        error: 'Erro de conexão com o banco',
                        data: []
                    });
                    return;
                }

                const query = `
                    SELECT 
                        id, nome_completo, telefone, email, data_nascimento, 
                        genero, status, observacoes, pontos_fidelidade,
                        data_cadastro as created_at, data_ultima_visita as updated_at
                    FROM clientes 
                    ORDER BY nome_completo
                `;

                db.all(query, [], (err, rows) => {
                    db.close();
                    
                    if (err) {
                        this.logError('ApiService', 'Erro ao buscar clientes', err.message);
                        resolve({
                            success: false,
                            error: 'Erro ao carregar clientes',
                            data: []
                        });
                    } else {
                        this.logInfo('ApiService', `${rows.length} clientes carregados do SQLite`);
                        resolve({
                            success: true,
                            data: rows
                        });
                    }
                });
            });
        });
    }

    async getCliente(id) {
        return new Promise((resolve) => {
            this.getDatabase((db) => {
                if (!db) {
                    resolve({
                        success: false,
                        error: 'Erro de conexão com o banco'
                    });
                    return;
                }

                const query = `
                    SELECT 
                        id, nome_completo, telefone, email, data_nascimento, 
                        genero, status, observacoes, pontos_fidelidade,
                        data_cadastro as created_at, data_ultima_visita as updated_at
                    FROM clientes 
                    WHERE id = ?
                `;

                db.get(query, [id], (err, row) => {
                    db.close();
                    
                    if (err) {
                        this.logError('ApiService', `Erro ao buscar cliente ${id}`, err.message);
                        resolve({
                            success: false,
                            error: 'Erro ao buscar cliente'
                        });
                    } else if (row) {
                        this.logInfo('ApiService', `Cliente ${id} encontrado: ${row.nome_completo}`);
                        resolve({
                            success: true,
                            data: row
                        });
                    } else {
                        this.logWarning('ApiService', `Cliente ${id} não encontrado`);
                        resolve({
                            success: false,
                            error: 'Cliente não encontrado'
                        });
                    }
                });
            });
        });
    }

    async criarCliente(clienteData) {
        return new Promise((resolve) => {
            this.getDatabase((db) => {
                if (!db) {
                    resolve({
                        success: false,
                        error: 'Erro de conexão com o banco'
                    });
                    return;
                }

                const {
                    nome_completo, telefone, email, data_nascimento,
                    genero, status, observacoes, pontos_fidelidade = 0
                } = clienteData;

                const query = `
                    INSERT INTO clientes (
                        nome_completo, telefone, email, data_nascimento,
                        genero, status, observacoes, pontos_fidelidade,
                        data_cadastro, data_ultima_visita
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                `;

                const params = [
                    nome_completo, telefone, email, data_nascimento,
                    genero, status, observacoes, pontos_fidelidade
                ];

                db.run(query, params, function(err) {
                    db.close();
                    
                    if (err) {
                        this.logError('ApiService', 'Erro ao criar cliente', err.message);
                        resolve({
                            success: false,
                            error: 'Erro ao criar cliente'
                        });
                    } else {
                        const novoCliente = {
                            id: this.lastID,
                            nome_completo, telefone, email, data_nascimento,
                            genero, status, observacoes, pontos_fidelidade,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };

                        this.logSuccess('ApiService', `Cliente criado: ${nome_completo} (ID: ${this.lastID})`, novoCliente);
                        resolve({
                            success: true,
                            data: novoCliente,
                            message: 'Cliente criado com sucesso!'
                        });
                    }
                });
            });
        });
    }

    async atualizarCliente(id, clienteData) {
        return new Promise((resolve) => {
            this.getDatabase((db) => {
                if (!db) {
                    resolve({
                        success: false,
                        error: 'Erro de conexão com o banco'
                    });
                    return;
                }

                // Primeiro buscar o cliente atual para log
                this.getCliente(id).then(clienteResponse => {
                    const clienteAntigo = clienteResponse.success ? clienteResponse.data : null;

                    const {
                        nome_completo, telefone, email, data_nascimento,
                        genero, status, observacoes, pontos_fidelidade
                    } = clienteData;

                    const query = `
                        UPDATE clientes SET
                            nome_completo = ?, telefone = ?, email = ?, data_nascimento = ?,
                            genero = ?, status = ?, observacoes = ?, pontos_fidelidade = ?,
                            data_ultima_visita = datetime('now')
                        WHERE id = ?
                    `;

                    const params = [
                        nome_completo, telefone, email, data_nascimento,
                        genero, status, observacoes, pontos_fidelidade, id
                    ];

                    db.run(query, params, function(err) {
                        db.close();
                        
                        if (err) {
                            this.logError('ApiService', `Erro ao atualizar cliente ${id}`, err.message);
                            resolve({
                                success: false,
                                error: 'Erro ao atualizar cliente'
                            });
                        } else if (this.changes > 0) {
                            // Buscar o cliente atualizado
                            this.getCliente(id).then(updatedResponse => {
                                this.logSuccess('ApiService', `Cliente atualizado: ${nome_completo} (ID: ${id})`, {
                                    anterior: clienteAntigo,
                                    atual: updatedResponse.data
                                });
                                
                                resolve({
                                    success: true,
                                    data: updatedResponse.data,
                                    message: 'Cliente atualizado com sucesso!'
                                });
                            });
                        } else {
                            this.logWarning('ApiService', `Tentativa de atualizar cliente não encontrado: ID ${id}`);
                            resolve({
                                success: false,
                                error: 'Cliente não encontrado'
                            });
                        }
                    });
                });
            });
        });
    }

    async excluirCliente(id) {
        return new Promise((resolve) => {
            this.getDatabase((db) => {
                if (!db) {
                    resolve({
                        success: false,
                        error: 'Erro de conexão com o banco'
                    });
                    return;
                }

                // Primeiro buscar o cliente para log
                this.getCliente(id).then(clienteResponse => {
                    if (!clienteResponse.success) {
                        resolve(clienteResponse);
                        return;
                    }

                    const clienteExcluido = clienteResponse.data;

                    const query = 'DELETE FROM clientes WHERE id = ?';
                    
                    db.run(query, [id], function(err) {
                        db.close();
                        
                        if (err) {
                            this.logError('ApiService', `Erro ao excluir cliente ${id}`, err.message);
                            resolve({
                                success: false,
                                error: 'Erro ao excluir cliente'
                            });
                        } else if (this.changes > 0) {
                            this.logSuccess('ApiService', `Cliente excluído: ${clienteExcluido.nome_completo} (ID: ${id})`, clienteExcluido);
                            resolve({
                                success: true,
                                message: 'Cliente excluído com sucesso!',
                                data: clienteExcluido
                            });
                        } else {
                            this.logWarning('ApiService', `Tentativa de excluir cliente não encontrado: ID ${id}`);
                            resolve({
                                success: false,
                                error: 'Cliente não encontrado'
                            });
                        }
                    });
                });
            });
        });
    }

    async buscarClientes(filtro) {
        return new Promise((resolve) => {
            this.getDatabase((db) => {
                if (!db) {
                    resolve({
                        success: false,
                        error: 'Erro de conexão com o banco',
                        data: []
                    });
                    return;
                }

                let query = `
                    SELECT 
                        id, nome_completo, telefone, email, data_nascimento, 
                        genero, status, observacoes, pontos_fidelidade,
                        data_cadastro as created_at, data_ultima_visita as updated_at
                    FROM clientes 
                    WHERE 1=1
                `;
                const params = [];

                if (filtro.nome) {
                    query += ' AND nome_completo LIKE ?';
                    params.push(`%${filtro.nome}%`);
                }

                if (filtro.status && filtro.status !== 'todos') {
                    query += ' AND status = ?';
                    params.push(filtro.status);
                }

                query += ' ORDER BY nome_completo';

                db.all(query, params, (err, rows) => {
                    db.close();
                    
                    if (err) {
                        this.logError('ApiService', 'Erro ao buscar clientes', err.message);
                        resolve({
                            success: false,
                            error: 'Erro ao buscar clientes',
                            data: []
                        });
                    } else {
                        this.logInfo('ApiService', `Busca de clientes: ${rows.length} resultados`, filtro);
                        resolve({
                            success: true,
                            data: rows
                        });
                    }
                });
            });
        });
    }

    // ===== SERVIÇOS =====
    
    async getServicos() {
        return new Promise((resolve) => {
            this.getDatabase((db) => {
                if (!db) {
                    resolve({
                        success: false,
                        error: 'Erro de conexão com o banco',
                        data: []
                    });
                    return;
                }

                const query = `
                    SELECT id, nome, preco_base as preco, duracao_minutos as duracao
                    FROM servicos 
                    WHERE status = 'ativo'
                    ORDER BY nome
                `;

                db.all(query, [], (err, rows) => {
                    db.close();
                    
                    if (err) {
                        this.logError('ApiService', 'Erro ao buscar serviços', err.message);
                        resolve({ 
                            success: false, 
                            error: 'Erro ao buscar serviços',
                            data: []
                        });
                    } else {
                        this.logInfo('ApiService', `${rows.length} serviços carregados do SQLite`);
                        resolve({ 
                            success: true, 
                            data: rows
                        });
                    }
                });
            });
        });
    }

    // ===== PROFISSIONAIS =====
    
    async getProfissionais() {
        return new Promise((resolve) => {
            this.getDatabase((db) => {
                if (!db) {
                    resolve({
                        success: false,
                        error: 'Erro de conexão com o banco',
                        data: []
                    });
                    return;
                }

                const query = `
                    SELECT id, nome_completo as nome, especialidade
                    FROM profissionais 
                    WHERE status = 'ativo'
                    ORDER BY nome_completo
                `;

                db.all(query, [], (err, rows) => {
                    db.close();
                    
                    if (err) {
                        this.logError('ApiService', 'Erro ao buscar profissionais', err.message);
                        resolve({ 
                            success: false, 
                            error: 'Erro ao buscar profissionais',
                            data: []
                        });
                    } else {
                        this.logInfo('ApiService', `${rows.length} profissionais carregados do SQLite`);
                        resolve({ 
                            success: true, 
                            data: rows
                        });
                    }
                });
            });
        });
    }

    // Sistema de logs interno
    logError(module, message, details = null) {
        console.error(`[${module}] ERROR: ${message}`, details);
    }

    logWarning(module, message, details = null) {
        console.warn(`[${module}] WARNING: ${message}`, details);
    }

    logInfo(module, message, details = null) {
        console.info(`[${module}] INFO: ${message}`, details);
    }

    logSuccess(module, message, details = null) {
        console.log(`[${module}] ✅ SUCCESS: ${message}`, details);
    }
}

// Exportar para ES modules
export default ApiServiceClass;