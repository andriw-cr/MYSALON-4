import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const frontendPath = join('..', 'frontend');
const htmlPath = join(frontendPath, 'html');

console.log('📁 VERIFICANDO PASTA HTML\n');
console.log('📍 Caminho HTML:', htmlPath);
console.log('✅ Existe:', existsSync(htmlPath));

if (existsSync(htmlPath)) {
  console.log('\n📄 Arquivos HTML encontrados:');
  const files = readdirSync(htmlPath);
  const htmlFiles = files.filter(f => f.endsWith('.html'));
  
  htmlFiles.forEach(file => {
    console.log(`   📄 ${file}`);
  });
  
  console.log(`\n📊 Total: ${htmlFiles.length} arquivos HTML`);
} else {
  console.log('\n❌ Pasta html não encontrada!');
}