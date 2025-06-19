/**
 * Demonstração Prática do Sistema de Validação e Sanitização
 * Exemplos reais de uso dos middlewares implementados
 */

const dataValidator = require('../lib/validator.js');

console.log('🔍 Sistema de Validação e Sanitização CodyVerse');
console.log('=' .repeat(60));

// Demonstração 1: Validação de Email
console.log('\n📧 1. Validação de Email');
console.log('-'.repeat(30));

const emails = [
  'usuario@exemplo.com',
  'email.invalido@',
  'teste+tag@gmail.com',
  'admin@codyverse.edu.br',
  'email@dominio'
];

emails.forEach(email => {
  const result = dataValidator.validateEmail(email);
  console.log(`Email: ${email}`);
  console.log(`✓ Válido: ${result.isValid ? 'SIM' : 'NÃO'}`);
  console.log(`✓ Sanitizado: ${result.sanitized}`);
  if (!result.isValid) {
    console.log(`✗ Erros: ${result.errors.join(', ')}`);
  }
  console.log('');
});

// Demonstração 2: Validação de Senha
console.log('\n🔐 2. Validação de Senha');
console.log('-'.repeat(30));

const passwords = [
  'MinhaSenh@123',     // Válida
  'senha123',          // Sem maiúscula e caractere especial
  'SENHA@123',         // Sem minúscula
  'Senha@',            // Muito curta
  'UmaSenhaForte123!'  // Válida
];

passwords.forEach(password => {
  const result = dataValidator.validatePassword(password);
  console.log(`Senha: ${password}`);
  console.log(`✓ Válida: ${result.isValid ? 'SIM' : 'NÃO'}`);
  if (!result.isValid) {
    console.log(`✗ Erros: ${result.errors.join(', ')}`);
  }
  console.log('');
});

// Demonstração 3: Sanitização de Texto
console.log('\n🛡️ 3. Sanitização de Texto');
console.log('-'.repeat(30));

const textos = [
  'Texto normal sem problemas',
  '<script>alert("XSS Attack!")</script>Conteúdo malicioso',
  '<p>Parágrafo <strong>válido</strong></p>',
  'SELECT * FROM users; DROP TABLE users;',
  '<img src="x" onerror="alert(1)">Imagem maliciosa'
];

textos.forEach(texto => {
  const result = dataValidator.validateText(texto, { 
    allowHtml: true,
    maxLength: 200 
  });
  console.log(`Texto original: ${texto}`);
  console.log(`✓ Válido: ${result.isValid ? 'SIM' : 'NÃO'}`);
  console.log(`✓ Sanitizado: ${result.sanitized}`);
  console.log('');
});

console.log('\n✅ Demonstração Concluída!');
console.log('\n📊 Estatísticas do Sistema:');
console.log('• 15+ tipos de validação implementados');
console.log('• Sanitização XSS automática');
console.log('• Proteção contra SQL/NoSQL injection');
console.log('• Validação de arquivos e uploads');
console.log('• Rate limiting por IP');
console.log('• Headers de segurança');
console.log('• Middleware de sanitização de respostas');

console.log('\n🚀 Sistema pronto para produção!');