import express from 'express';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { existsSync, readdirSync } from 'fs';
import { DB_PATH, getDatabaseInfo } from './database-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Caminhos configurados
const PROJECT_ROOT = join(__dirname, '..');
const FRONTEND_ROOT = join(PROJECT_ROOT, 'frontend');
const HTML_PATH = join(FRONTEND_ROOT, 'html');
const JS_PATH = join(FRONTEND_ROOT, 'js');
const CSS_PATH = join(FRONTEND_ROOT, 'style');

console.log('🚀 INICIANDO SERVIDOR BEAUTYSYS\n');

// Verificar se as pastas existem
if (!existsSync(HTML_PATH)) {
  console.log('❌ Pasta HTML não encontrada!');
  process.exit(1);
}

// Listar arquivos disponíveis
const htmlFiles = readdirSync(HTML_PATH).filter(f => f.endsWith('.html'));
console.log('📄 Arquivos HTML encontrados (' + htmlFiles.length + '):');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Servir arquivos estáticos - CORRIGIDO
app.use('/js', express.static(JS_PATH));
app.use('/css', express.static(CSS_PATH));
app.use('/html', express.static(HTML_PATH));
app.use(express.static(FRONTEND_ROOT));

// Informações do banco
const dbInfo = getDatabaseInfo();
console.log('📊 Banco de dados: ✅ Conectado');

// Conexão com o banco
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro no banco:', err.message);
  } else {
    console.log('✅ Banco SQLite conectado');
  }
});

// ===== ROTAS DA API =====

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: '🚀 API BeautySys funcionando!',
    version: '1.0.0'
  });
});

app.get('/api/db-info', (req, res) => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      res.json({ error: err.message });
      return;
    }
    res.json({
      success: true,
      tables: tables.map(t => t.name),
      totalTables: tables.length
    });
  });
});

// ===== ROTAS DO FRONTEND - CORRIGIDAS =====

// Rota principal - Dashboard
app.get('/', (req, res) => {
  res.sendFile(join(HTML_PATH, 'dashboard.html'));
});

// Rota para arquivos HTML com .html na URL
app.get('/:page(.+\.html)', (req, res) => {
  const page = req.params.page;
  const filePath = join(HTML_PATH, page);
  
  if (existsSync(filePath)) {
    console.log(`📄 Servindo: ${page}`);
    res.sendFile(filePath);
  } else {
    res.status(404).send(`Arquivo ${page} não encontrado`);
  }
});

// Rota para páginas sem .html (redireciona para com .html)
app.get('/:page', (req, res) => {
  const page = req.params.page;
  const filePath = join(HTML_PATH, `${page}.html`);
  
  if (existsSync(filePath)) {
    console.log(`📄 Servindo: ${page}.html`);
    res.sendFile(filePath);
  } else {
    // Página de erro melhorada
    const availablePages = htmlFiles.map(f => {
      const name = f.replace('.html', '');
      return { name, url: `/${f}` };
    });
    
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Página Não Encontrada - BeautySys</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #e53e3e; }
          .links { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 20px 0; }
          .links a { display: block; padding: 10px; background: #edf2f7; border-radius: 5px; text-decoration: none; color: #2d3748; text-align: center; }
          .links a:hover { background: #e2e8f0; }
          .note { background: #fffaf0; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📄 Página Não Encontrada</h1>
          <p>A página <strong>"${page}"</strong> não foi encontrada.</p>
          
          <div class="note">
            <strong>💡 Dica:</strong> Use os links abaixo ou acesse diretamente com <code>.html</code> no final da URL.
          </div>
          
          <h2>🚀 Páginas Disponíveis:</h2>
          <div class="links">
            ${availablePages.map(p => `<a href="${p.url}">${p.name}</a>`).join('')}
          </div>
          
          <p><a href="/" style="color: #805ad5;">↩️ Voltar para o Dashboard</a></p>
        </div>
      </body>
      </html>
    `);
  }
});

// ===== ROTAS DA API =====

import agendamentosRoutes from './routes/agendamentos.js';
import clientesRoutes from './routes/clientes.js';
import servicosRoutes from './routes/servicos.js';
import profissionaisRoutes from './routes/profissionais.js';

app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/servicos', servicosRoutes);
app.use('/api/profissionais', profissionaisRoutes);

// ===== INICIAR SERVIDOR =====

app.listen(PORT, () => {
  console.log('\n🎉 SERVIDOR INICIADO COM SUCESSO!');
  console.log('📍 URL: http://localhost:' + PORT);
  
  console.log('\n📊 PRINCIPAIS URLS:');
  console.log('   🏠  Dashboard:      http://localhost:' + PORT + '/');
  console.log('   📅  Agenda:         http://localhost:' + PORT + '/agenda.html');
  console.log('   👥  Clientes:       http://localhost:' + PORT + '/clientes.html');
  console.log('   ✂️   Serviços:       http://localhost:' + PORT + '/servicos.html');
  console.log('   💼  Profissionais:  http://localhost:' + PORT + '/profissionais.html');
  console.log('   📦  Estoque:        http://localhost:' + PORT + '/estoque.html');
  console.log('   💰  Financeiro:     http://localhost:' + PORT + '/financeiro.html');
  console.log('   🎁  Fidelidade:     http://localhost:' + PORT + '/fidelidade.html');
  console.log('   ⚙️   Configurações: http://localhost:' + PORT + '/configuracoes.html');
  
  console.log('\n🔧 URLs da API:');
  console.log('   🔍  http://localhost:' + PORT + '/api/test');
  console.log('   📊  http://localhost:' + PORT + '/api/db-info');
  
  console.log('\n🚀 BeautySys está pronto!');
});