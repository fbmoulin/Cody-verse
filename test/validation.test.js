/**
 * Testes para Sistema de Validação e Sanitização
 * Demonstra funcionalidade e casos de uso
 */

const request = require('supertest');
const express = require('express');
const ValidationMiddleware = require('../middleware/validationMiddleware');
const SanitizationMiddleware = require('../middleware/sanitizationMiddleware');
const SecurityMiddleware = require('../middleware/securityMiddleware');
const dataValidator = require('../lib/validator');

// Criar app de teste
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(SanitizationMiddleware.general());
  
  // Rota de teste para validação de curso
  app.post('/test/course',
    ValidationMiddleware.validateCourseCreation(),
    SanitizationMiddleware.sanitizeCourseData(),
    (req, res) => {
      res.json({ success: true, data: req.body });
    }
  );
  
  // Rota de teste para validação de usuário
  app.post('/test/user',
    ValidationMiddleware.validateUserCreation(),
    SanitizationMiddleware.sanitizeUserData(),
    (req, res) => {
      res.json({ success: true, data: req.body });
    }
  );
  
  // Rota de teste para sanitização XSS
  app.post('/test/xss',
    SanitizationMiddleware.sanitizeRichContent(),
    (req, res) => {
      res.json({ success: true, content: req.body.content });
    }
  );
  
  // Rota de teste para proteção SQL Injection
  app.get('/test/sql',
    SecurityMiddleware.sqlInjectionProtection(),
    (req, res) => {
      res.json({ success: true, query: req.query });
    }
  );
  
  return app;
}

// Executar testes de demonstração
async function runValidationTests() {
  console.log('🔍 Executando Testes de Validação e Sanitização...\n');
  
  const app = createTestApp();
  
  // Teste 1: Validação de curso válido
  console.log('✅ Teste 1: Curso válido');
  try {
    const validCourse = {
      title: 'Curso de JavaScript',
      description: 'Aprenda JavaScript do básico ao avançado',
      difficulty: 'Intermediário',
      category: 'Programação',
      duration: 120,
      price: 49.99,
      tags: ['javascript', 'programação', 'web']
    };
    
    const response = await request(app)
      .post('/test/course')
      .send(validCourse);
    
    console.log('Status:', response.status);
    console.log('Dados sanitizados:', JSON.stringify(response.body.data, null, 2));
  } catch (error) {
    console.log('Erro:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Teste 2: Validação de curso inválido
  console.log('❌ Teste 2: Curso inválido');
  try {
    const invalidCourse = {
      title: 'ab', // Muito curto
      description: 'Desc', // Muito curta
      difficulty: 'Impossível', // Valor inválido
      category: '', // Vazio
      duration: -5, // Valor negativo
      price: 10000, // Muito alto
      tags: ['a'.repeat(50)] // Tag muito longa
    };
    
    const response = await request(app)
      .post('/test/course')
      .send(invalidCourse);
    
    console.log('Status:', response.status);
    console.log('Erros de validação:', JSON.stringify(response.body.details, null, 2));
  } catch (error) {
    console.log('Erro:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Teste 3: Sanitização XSS
  console.log('🛡️ Teste 3: Proteção XSS');
  try {
    const xssContent = {
      content: '<p>Conteúdo válido</p><script>alert("XSS Attack!")</script><img src="x" onerror="alert(1)">'
    };
    
    const response = await request(app)
      .post('/test/xss')
      .send(xssContent);
    
    console.log('Status:', response.status);
    console.log('Conteúdo original:', xssContent.content);
    console.log('Conteúdo sanitizado:', response.body.content);
  } catch (error) {
    console.log('Erro:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Teste 4: Proteção SQL Injection
  console.log('🛡️ Teste 4: Proteção SQL Injection');
  try {
    const response = await request(app)
      .get('/test/sql')
      .query({ 
        search: "'; DROP TABLE users; --",
        id: "1 OR 1=1"
      });
    
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(response.body, null, 2));
  } catch (error) {
    console.log('Erro detectado (esperado):', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Teste 5: Validação de email
  console.log('📧 Teste 5: Validação de Email');
  const emails = [
    'usuario@exemplo.com',
    'email.invalido@',
    'outro@dominio.co.uk',
    'email@',
    'valido+tag@gmail.com'
  ];
  
  emails.forEach(email => {
    const validation = dataValidator.validateEmail(email);
    console.log(`Email: ${email}`);
    console.log(`Válido: ${validation.isValid}`);
    console.log(`Sanitizado: ${validation.sanitized}`);
    if (!validation.isValid) {
      console.log(`Erros: ${validation.errors.join(', ')}`);
    }
    console.log('---');
  });
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Teste 6: Validação de senha
  console.log('🔐 Teste 6: Validação de Senha');
  const passwords = [
    'MinhaSenh@123',
    'senha123',
    'SENHA123',
    'Senha@',
    'UmaSenhaForte123!'
  ];
  
  passwords.forEach(password => {
    const validation = dataValidator.validatePassword(password);
    console.log(`Senha: ${password}`);
    console.log(`Válida: ${validation.isValid}`);
    if (!validation.isValid) {
      console.log(`Erros: ${validation.errors.join(', ')}`);
    }
    console.log('---');
  });
  
  console.log('\n✅ Testes de Validação e Sanitização Concluídos!');
  console.log('\n📋 Resumo dos Recursos Implementados:');
  console.log('• Validação de dados com express-validator');
  console.log('• Sanitização XSS com biblioteca xss');
  console.log('• Proteção contra SQL/NoSQL injection');
  console.log('• Validação de tipos de dados (email, senha, URL, etc.)');
  console.log('• Rate limiting por IP');
  console.log('• Headers de segurança');
  console.log('• Sanitização de respostas');
  console.log('• Path traversal protection');
  console.log('• Validação de arquivos');
  console.log('• Sanitização de objetos complexos');
}

// Executar se chamado diretamente
if (require.main === module) {
  runValidationTests().catch(console.error);
}

module.exports = {
  createTestApp,
  runValidationTests
};