import { DB_PATH, getDatabaseInfo } from './database-config.js';

console.log('🧪 TESTANDO CONFIGURAÇÃO DA API\n');

const dbInfo = getDatabaseInfo();
console.log('📊 Informações do banco:');
console.log('📍 Caminho:', dbInfo.path);
console.log('✅ Existe:', dbInfo.exists);
console.log('📏 Tamanho:', dbInfo.size);

if (dbInfo.exists) {
  console.log('\n✅ Banco de dados encontrado!');
  console.log('🚀 Agora execute: npm start');
} else {
  console.log('\n❌ Banco de dados não encontrado!');
  console.log('💡 Verifique se o arquivo existe em: C:\\sqlite\\salao.db');
}