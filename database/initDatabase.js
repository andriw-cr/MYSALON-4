// database/initDatabase.js
const db = require('./db');

function initDatabase() {
    console.log('🔄 Inicializando banco de dados...');

    // Tabela de usuários
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Tabela de clientes
    const createClientsTable = `
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Tabela de profissionais
    const createProfessionalsTable = `
        CREATE TABLE IF NOT EXISTS professionals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialty TEXT,
            phone TEXT,
            email TEXT,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Tabela de serviços
    const createServicesTable = `
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            duration INTEGER NOT NULL,
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Tabela de agendamentos
    const createAppointmentsTable = `
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            professional_id INTEGER NOT NULL,
            service_id INTEGER NOT NULL,
            appointment_date DATETIME NOT NULL,
            status TEXT DEFAULT 'agendado',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients (id),
            FOREIGN KEY (professional_id) REFERENCES professionals (id),
            FOREIGN KEY (service_id) REFERENCES services (id)
        )
    `;

    // Executar todas as queries de criação de tabelas
    const tables = [
        createUsersTable,
        createClientsTable,
        createProfessionalsTable,
        createServicesTable,
        createAppointmentsTable
    ];

    tables.forEach((sql, index) => {
        db.run(sql, (err) => {
            if (err) {
                console.error(`❌ Erro ao criar tabela ${index + 1}:`, err.message);
            } else {
                console.log(`✅ Tabela ${index + 1} criada/verificada com sucesso`);
            }
        });
    });

    console.log('🎉 Inicialização do banco de dados concluída!');
}

module.exports = initDatabase;