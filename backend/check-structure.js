import { existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📁 VERIFICANDO ESTRUTURA DE PASTAS\n');

const projectRoot = join(__dirname, '..');
const frontendPath = join(projectRoot, 'frontend');
const backendPath = join(projectRoot, 'backend');

console.log('📍 Caminho raiz:', projectRoot);
console.log('📍 Frontend:', frontendPath);
console.log('📍 Backend:', backendPath);

// Verificar se as pastas existem
console.log('\n✅ Pastas existentes:');
console.log('   📁 Raiz:', existsSync(projectRoot));
console.log('   📁 Frontend:', existsSync(frontendPath));
console.log('   📁 Backend:', existsSync(backendPath));

// Listar arquivos do frontend
if (existsSync(frontendPath)) {
  console.log('\n📄 Arquivos no frontend:');
  try {
    const files = readdirSync(frontendPath);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    const otherFiles = files.filter(f => !f.endsWith('.html'));
    
    if (htmlFiles.length > 0) {
      console.log('   🏷️  HTML:', htmlFiles.join(', '));
    }
    if (otherFiles.length > 0) {
      console.log('   📁 Outros:', otherFiles.join(', '));
    }
    
    if (files.length === 0) {
      console.log('   ℹ️  Pasta vazia');
    }
  } catch (error) {
    console.log('   ❌ Erro ao ler pasta:', error.message);
  }
} else {
  console.log('\n❌ Pasta frontend não encontrada!');
  console.log('💡 Crie a pasta frontend com os arquivos HTML');
}

// Listar arquivos do backend
if (existsSync(backendPath)) {
  console.log('\n⚙️  Arquivos no backend:');
  try {
    const files = readdirSync(backendPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    console.log('   📝 JS:', jsFiles.slice(0, 10).join(', '));
    if (jsFiles.length > 10) console.log('   ... e mais', jsFiles.length - 10, 'arquivos');
  } catch (error) {
    console.log('   ❌ Erro ao ler pasta:', error.message);
  }
}

console.log('\n🎯 PRÓXIMOS PASSOS:');
if (!existsSync(frontendPath)) {
  console.log('   1. Crie a pasta "frontend" na raiz do projeto');
  console.log('   2. Coloque os arquivos HTML (dashboard.html, agenda.html, etc)');
} else {
  console.log('   1. Verifique se os arquivos HTML estão na pasta frontend');
  console.log('   2. Execute: npm start');
}