# Prompt para Implementação de Melhorias no CodyVerse (Replit)

Este prompt foi projetado para guiar um assistente de IA na implementação de melhorias e correções no projeto CodyVerse hospedado no Replit. As instruções são estruturadas em fases incrementais para garantir estabilidade durante todo o processo de implementação.

## Instruções Gerais

```
Implemente as seguintes melhorias no projeto CodyVerse hospedado no Replit, seguindo uma abordagem escalonada para garantir estabilidade e segurança. Cada fase deve ser testada antes de prosseguir para a próxima. Forneça feedback detalhado após cada etapa concluída.
```

## Fase 1: Correção de Vulnerabilidades e Dependências

```bash
# 1. Atualize as dependências com vulnerabilidades conhecidas
cd /home/runner/CodyVerse
npm audit fix --force

# 2. Se ainda houver vulnerabilidades relacionadas ao esbuild, atualize manualmente
npm install esbuild@latest --save-dev

# 3. Verifique se todas as vulnerabilidades foram corrigidas
npm audit

# 4. Atualize outras dependências críticas
npm update express dotenv helmet compression cors
```

## Fase 2: Implementação de Logging Centralizado

```javascript
// Crie um novo arquivo: /server/logger.js
const winston = require('winston');
const path = require('path');

// Configuração para ambiente Replit
const logDir = path.join(__dirname, '../logs');

// Criar formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'codyverse-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

// Garantir que o diretório de logs exista
const fs = require('fs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Adicionar métodos de conveniência
logger.success = (message, meta) => {
  logger.info(message, { ...meta, success: true });
};

module.exports = logger;
```

```javascript
// Modifique o arquivo /server/middleware.js para incluir logging
const logger = require('./logger');

// Adicione esta função ao objeto de exportação
function setupLogging(app) {
  const morgan = require('morgan');
  
  // Criar stream personalizado para morgan que usa winston
  const stream = {
    write: (message) => logger.http(message.trim())
  };
  
  // Usar morgan com winston
  app.use(morgan('combined', { stream }));
  
  // Logging de requisições
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        logger.warn(`Requisição lenta: ${req.method} ${req.originalUrl} - ${duration}ms`);
      }
      
      if (res.statusCode >= 400) {
        logger.error(`Erro ${res.statusCode}: ${req.method} ${req.originalUrl}`);
      }
    });
    
    next();
  });
}

// Certifique-se de exportar a nova função
module.exports = {
  // Funções existentes...
  setupLogging,
  // Outras funções...
};
```

## Fase 3: Substituição de Dados Mockados por Chamadas Reais à API

```dart
// Modifique o arquivo lib/services/database_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/app_constants.dart';

class DatabaseService {
  static final String baseUrl = AppConstants.apiBaseUrl;
  
  // Fetch learning modules from database
  static Future<List<Map<String, dynamic>>> getLearningModules() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/courses'));
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body)['data'];
        return List<Map<String, dynamic>>.from(data);
      } else {
        throw Exception('Failed to load courses: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching learning modules: $e');
      // Fallback para dados mockados em caso de erro
      return [
        {
          'id': 1,
          'title': 'Introduction to MCP',
          'description': 'Learn the fundamentals of Model Context Protocol',
          'category': 'mcp_basics',
          'difficulty_level': 'beginner',
          'estimated_duration_minutes': 30,
          'xp_reward': 20,
          'is_published': true,
        },
        // Outros dados mockados como fallback...
      ];
    }
  }
  
  // Fetch lessons for a specific module
  static Future<List<Map<String, dynamic>>> getLessonsForModule(int moduleId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/courses/$moduleId/lessons')
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body)['data'];
        return List<Map<String, dynamic>>.from(data);
      } else {
        throw Exception('Failed to load lessons: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching lessons: $e');
      // Fallback para dados mockados em caso de erro
      Map<int, List<Map<String, dynamic>>> lessonsData = {
        // Dados mockados como fallback...
      };
      
      return lessonsData[moduleId] ?? [];
    }
  }
}
```

```dart
// Crie um novo arquivo: lib/core/constants/app_constants.dart
class AppConstants {
  // URL base da API - ajuste conforme o ambiente Replit
  static const String apiBaseUrl = 'https://codyverse.your-replit-username.repl.co';
  
  // Outras constantes da aplicação
  static const String appName = 'CodyVerse';
  static const String appVersion = '1.0.0';
  
  // Timeouts para requisições HTTP
  static const int connectionTimeout = 10000; // 10 segundos
  static const int receiveTimeout = 15000; // 15 segundos
}
```

## Fase 4: Implementação de Camada de Serviço Padronizada

```dart
// Crie um novo arquivo: lib/core/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';
import '../utils/logger.dart';

class ApiService {
  final String baseUrl;
  final Map<String, String> defaultHeaders;
  
  ApiService({
    String? baseUrl,
    Map<String, String>? headers,
  }) : 
    this.baseUrl = baseUrl ?? AppConstants.apiBaseUrl,
    this.defaultHeaders = headers ?? {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  
  Future<Map<String, dynamic>> get(
    String endpoint, {
    Map<String, dynamic>? queryParams,
    Map<String, String>? headers,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/$endpoint').replace(
        queryParameters: queryParams,
      );
      
      final response = await http.get(
        uri,
        headers: {...defaultHeaders, ...?headers},
      ).timeout(Duration(milliseconds: AppConstants.connectionTimeout));
      
      return _handleResponse(response);
    } catch (e) {
      Logger.error('API GET Error: $endpoint', e.toString());
      throw _handleError(e);
    }
  }
  
  Future<Map<String, dynamic>> post(
    String endpoint, {
    dynamic body,
    Map<String, String>? headers,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/$endpoint');
      
      final response = await http.post(
        uri,
        headers: {...defaultHeaders, ...?headers},
        body: body != null ? json.encode(body) : null,
      ).timeout(Duration(milliseconds: AppConstants.connectionTimeout));
      
      return _handleResponse(response);
    } catch (e) {
      Logger.error('API POST Error: $endpoint', e.toString());
      throw _handleError(e);
    }
  }
  
  // Implementar outros métodos (put, delete) seguindo o mesmo padrão
  
  Map<String, dynamic> _handleResponse(http.Response response) {
    final statusCode = response.statusCode;
    final responseBody = json.decode(response.body);
    
    if (statusCode >= 200 && statusCode < 300) {
      return responseBody;
    } else {
      final error = responseBody['error'] ?? 'Unknown error';
      Logger.error('API Error: $statusCode', error);
      throw ApiException(statusCode, error);
    }
  }
  
  Exception _handleError(dynamic error) {
    if (error is ApiException) {
      return error;
    }
    
    if (error is http.ClientException) {
      return ApiException(0, 'Connection error: ${error.message}');
    }
    
    return ApiException(0, 'Unknown error: ${error.toString()}');
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  
  ApiException(this.statusCode, this.message);
  
  @override
  String toString() => 'ApiException: $statusCode - $message';
}
```

```dart
// Crie um novo arquivo: lib/core/utils/logger.dart
class Logger {
  static void info(String message, [String? details]) {
    _log('INFO', message, details);
  }
  
  static void warning(String message, [String? details]) {
    _log('WARNING', message, details);
  }
  
  static void error(String message, [String? details]) {
    _log('ERROR', message, details);
  }
  
  static void _log(String level, String message, [String? details]) {
    final timestamp = DateTime.now().toIso8601String();
    final logMessage = '[$timestamp] $level: $message';
    
    print(logMessage);
    if (details != null) {
      print('  └─ $details');
    }
    
    // Aqui você pode adicionar integração com serviços de logging
  }
}
```

## Fase 5: Implementação de Cache Local e Estratégias de Fallback

```dart
// Crie um novo arquivo: lib/core/services/cache_service.dart
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/logger.dart';

class CacheService {
  static const String _prefix = 'cache_';
  static const int _defaultExpiryMinutes = 60; // 1 hora
  
  // Salvar dados no cache
  static Future<bool> set(
    String key, 
    dynamic data, {
    int expiryMinutes = _defaultExpiryMinutes,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = _prefix + key;
      
      final cacheData = {
        'data': data,
        'expiry': DateTime.now().add(Duration(minutes: expiryMinutes)).millisecondsSinceEpoch,
      };
      
      return await prefs.setString(cacheKey, json.encode(cacheData));
    } catch (e) {
      Logger.error('Cache set error', e.toString());
      return false;
    }
  }
  
  // Obter dados do cache
  static Future<dynamic> get(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = _prefix + key;
      
      final cachedString = prefs.getString(cacheKey);
      if (cachedString == null) {
        return null;
      }
      
      final cachedData = json.decode(cachedString);
      final expiry = cachedData['expiry'];
      
      // Verificar se o cache expirou
      if (expiry < DateTime.now().millisecondsSinceEpoch) {
        await prefs.remove(cacheKey);
        return null;
      }
      
      return cachedData['data'];
    } catch (e) {
      Logger.error('Cache get error', e.toString());
      return null;
    }
  }
  
  // Remover item do cache
  static Future<bool> remove(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.remove(_prefix + key);
    } catch (e) {
      Logger.error('Cache remove error', e.toString());
      return false;
    }
  }
  
  // Limpar todo o cache
  static Future<bool> clear() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      for (final key in keys) {
        if (key.startsWith(_prefix)) {
          await prefs.remove(key);
        }
      }
      
      return true;
    } catch (e) {
      Logger.error('Cache clear error', e.toString());
      return false;
    }
  }
}
```

```dart
// Modifique o arquivo lib/services/database_service.dart para usar cache
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/app_constants.dart';
import '../core/services/api_service.dart';
import '../core/services/cache_service.dart';
import '../core/utils/logger.dart';

class DatabaseService {
  static final ApiService _apiService = ApiService();
  
  // Fetch learning modules from database
  static Future<List<Map<String, dynamic>>> getLearningModules() async {
    const cacheKey = 'learning_modules';
    
    try {
      // Tentar obter do cache primeiro
      final cachedData = await CacheService.get(cacheKey);
      if (cachedData != null) {
        Logger.info('Using cached learning modules');
        return List<Map<String, dynamic>>.from(cachedData);
      }
      
      // Se não estiver em cache, buscar da API
      final response = await _apiService.get('api/courses');
      final List<dynamic> data = response['data'];
      final modules = List<Map<String, dynamic>>.from(data);
      
      // Salvar no cache para uso futuro
      await CacheService.set(cacheKey, modules);
      
      return modules;
    } catch (e) {
      Logger.error('Error fetching learning modules', e.toString());
      
      // Fallback para dados mockados em caso de erro
      return [
        {
          'id': 1,
          'title': 'Introduction to MCP',
          'description': 'Learn the fundamentals of Model Context Protocol',
          'category': 'mcp_basics',
          'difficulty_level': 'beginner',
          'estimated_duration_minutes': 30,
          'xp_reward': 20,
          'is_published': true,
        },
        // Outros dados mockados como fallback...
      ];
    }
  }
  
  // Implementar outros métodos com cache e fallback...
}
```

## Fase 6: Refatoração do Sistema de IA para Arquitetura Baseada em Eventos

```javascript
// Crie um novo arquivo: /services/ai_service.js
const { EventEmitter } = require('events');
const logger = require('../server/logger');
const { db } = require('../server/database');
const { codyInteractions } = require('../shared/schema');
const { eq, desc } = require('drizzle-orm');

class AIService extends EventEmitter {
  constructor() {
    super();
    this.responses = {
      // Respostas existentes...
    };
    
    // Configurar listeners de eventos
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Processar interação do usuário
    this.on('user_interaction', async (data) => {
      try {
        const { userId, interactionType, context, userMessage } = data;
        
        // Gerar resposta
        const response = this.generateResponse(interactionType, context, userMessage);
        
        // Salvar interação no banco de dados
        if (userId) {
          await this.saveInteraction(userId, interactionType, context, userMessage, response);
        }
        
        // Emitir evento de resposta
        this.emit('ai_response', {
          userId,
          response,
          emotion: this.getEmotionForContext(interactionType),
          suggestions: this.getSuggestions(interactionType)
        });
        
        // Analisar padrões para melhorar futuras interações
        this.analyzeInteraction(userId, interactionType, context, userMessage);
      } catch (error) {
        logger.error('Error processing user interaction', error);
        this.emit('ai_error', { error: 'Failed to process interaction' });
      }
    });
    
    // Outros listeners...
  }
  
  // Métodos existentes do CodyController...
  
  // Novo método para salvar interação
  async saveInteraction(userId, interactionType, context, userMessage, codyResponse) {
    try {
      await db.insert(codyInteractions).values({
        userId: parseInt(userId),
        interactionType,
        context: context || null,
        userMessage: userMessage || null,
        codyResponse,
        timestamp: new Date()
      });
      
      logger.info(`Interaction saved for user ${userId}`);
    } catch (error) {
      logger.error('Failed to save interaction', error);
    }
  }
  
  // Novo método para análise de padrões
  analyzeInteraction(userId, interactionType, context, userMessage) {
    // Implementação futura para análise de padrões e aprendizado
    // Este é um ponto de extensão para integração com n8n
  }
}

// Criar instância singleton
const aiService = new AIService();

module.exports = aiService;
```

```javascript
// Modifique o arquivo /controllers/codyController.js
const aiService = require('../services/ai_service');
const logger = require('../server/logger');

class CodyController {
  // Handle user interaction
  async handleInteraction(req, res) {
    try {
      const { userId, interactionType, context, userMessage } = req.body;

      if (!interactionType) {
        return res.status(400).json({
          success: false,
          error: 'interactionType is required'
        });
      }
      
      // Criar promessa para aguardar resposta
      const responsePromise = new Promise((resolve) => {
        // Listener único para este request
        const responseHandler = (data) => {
          if (data.userId === userId) {
            aiService.removeListener('ai_response', responseHandler);
            resolve(data);
          }
        };
        
        // Registrar listener
        aiService.on('ai_response', responseHandler);
        
        // Timeout para evitar espera infinita
        setTimeout(() => {
          aiService.removeListener('ai_response', responseHandler);
          resolve({
            response: "Desculpe, estou demorando para processar sua solicitação.",
            emotion: "thinking",
            suggestions: ["Tente novamente", "Pergunte outra coisa"]
          });
        }, 5000);
      });
      
      // Emitir evento de interação
      aiService.emit('user_interaction', {
        userId, 
        interactionType, 
        context, 
        userMessage
      });
      
      // Aguardar resposta
      const responseData = await responsePromise;
      
      // Simular "pensamento" da IA
      await new Promise(resolve => setTimeout(resolve, 800));
      
      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      logger.error('Error in Cody interaction', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error in Cody interaction'
      });
    }
  }
  
  // Outros métodos simplificados que delegam para o aiService...
}

module.exports = new CodyController();
```

## Fase 7: Implementação de Testes Unitários

```javascript
// Crie um novo arquivo: /test/ai_service.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const aiService = require('../services/ai_service');
const { db } = require('../server/database');

describe('AI Service', () => {
  beforeEach(() => {
    // Stub do banco de dados
    sinon.stub(db, 'insert').resolves();
  });
  
  afterEach(() => {
    // Restaurar stubs
    sinon.restore();
  });
  
  it('should generate appropriate response based on interaction type', () => {
    const response = aiService.generateResponse('course', null, null);
    expect(response).to.be.a('string');
    expect(response.length).to.be.greaterThan(0);
  });
  
  it('should emit ai_response event when receiving user_interaction event', (done) => {
    // Configurar listener para o evento de resposta
    aiService.once('ai_response', (data) => {
      expect(data).to.have.property('response');
      expect(data).to.have.property('emotion');
      expect(data).to.have.property('suggestions');
      done();
    });
    
    // Emitir evento de interação
    aiService.emit('user_interaction', {
      userId: '123',
      interactionType: 'course',
      context: null,
      userMessage: null
    });
  });
  
  // Mais testes...
});
```

```dart
// Crie um novo arquivo: test/api_service_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:your_app_name/core/services/api_service.dart';

void main() {
  group('ApiService', () {
    late ApiService apiService;
    
    setUp(() {
      // Configurar mock client
      final mockClient = MockClient((request) async {
        if (request.url.toString().contains('success')) {
          return http.Response('{"data": {"message": "success"}}', 200);
        } else if (request.url.toString().contains('error')) {
          return http.Response('{"error": "Not found"}', 404);
        }
        return http.Response('{}', 200);
      });
      
      apiService = ApiService(client: mockClient);
    });
    
    test('should handle successful GET request', () async {
      final result = await apiService.get('success');
      expect(result, contains('data'));
      expect(result['data'], contains('message'));
      expect(result['data']['message'], equals('success'));
    });
    
    test('should throw ApiException on error response', () async {
      expect(() => apiService.get('error'), throwsA(isA<ApiException>()));
    });
    
    // Mais testes...
  });
}
```

## Fase 8: Preparação para Automação com n8n

```javascript
// Crie um novo arquivo: /server/webhooks.js
const express = require('express');
const router = express.Router();
const logger = require('./logger');
const aiService = require('../services/ai_service');

// Webhook para receber eventos do n8n
router.post('/webhook/n8n', (req, res) => {
  try {
    const { event, data, secret } = req.body;
    
    // Verificar secret para autenticação
    if (secret !== process.env.WEBHOOK_SECRET) {
      logger.warn('Unauthorized webhook attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    logger.info(`Received n8n webhook: ${event}`);
    
    // Processar diferentes tipos de eventos
    switch (event) {
      case 'user_progress_update':
        aiService.emit('user_progress_update', data);
        break;
      case 'content_update':
        aiService.emit('content_update', data);
        break;
      default:
        logger.warn(`Unknown webhook event: ${event}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error processing webhook', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint para verificação de saúde dos webhooks
router.get('/webhook/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
```

```javascript
// Modifique o arquivo /server.js para incluir os webhooks
// Adicione após a configuração das rotas da API:

// Webhooks para integração com n8n
const webhookRoutes = require('./server/webhooks');
this.app.use('/api', webhookRoutes);
```

## Fase 9: Configuração do Ambiente Replit

```
# Instruções para configuração do ambiente Replit

1. Abra o painel de configuração do seu Replit
2. Vá para a seção "Secrets" (variáveis de ambiente)
3. Adicione as seguintes variáveis:

DATABASE_URL=postgresql://username:password@hostname:port/database
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
WEBHOOK_SECRET=seu_segredo_seguro_aqui

4. Na seção "Packages", certifique-se de que os seguintes pacotes estão instalados:
   - node.js
   - postgresql
   - npm

5. Configure o comando de inicialização:
   - Comando: npm start
   - Diretório de trabalho: /home/runner/CodyVerse

6. Habilite persistência de dados para o PostgreSQL:
   - Isso garantirá que seus dados sejam preservados entre reinicializações
```

## Fase 10: Script Python para Automação de Workflows

```python
# Crie um novo arquivo: /scripts/workflow_automation.py
import requests
import json
import os
import time
from datetime import datetime

# Configuração
API_BASE_URL = os.environ.get('API_BASE_URL', 'https://codyverse.your-replit-username.repl.co')
WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', 'seu_segredo_seguro_aqui')

class WorkflowAutomation:
    def __init__(self):
        self.session = requests.Session()
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    def send_webhook(self, event, data):
        """Envia evento para o webhook do CodyVerse"""
        payload = {
            'event': event,
            'data': data,
            'secret': WEBHOOK_SECRET,
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            response = self.session.post(
                f"{API_BASE_URL}/api/webhook/n8n",
                headers=self.headers,
                json=payload
            )
            
            if response.status_code == 200:
                print(f"Evento {event} enviado com sucesso")
                return response.json()
            else:
                print(f"Erro ao enviar evento: {response.status_code}")
                print(response.text)
                return None
        except Exception as e:
            print(f"Exceção ao enviar webhook: {str(e)}")
            return None
    
    def process_user_progress(self, user_id, lesson_id, progress_data):
        """Processa o progresso do usuário e envia notificações"""
        # Lógica de processamento
        completion = progress_data.get('completion_percentage', 0)
        
        # Enviar atualização via webhook
        return self.send_webhook('user_progress_update', {
            'user_id': user_id,
            'lesson_id': lesson_id,
            'progress': progress_data,
            'processed_at': datetime.now().isoformat(),
            'actions': self._determine_actions(completion)
        })
    
    def _determine_actions(self, completion):
        """Determina ações baseadas no progresso"""
        actions = []
        
        if completion >= 100:
            actions.append({
                'type': 'achievement',
                'message': 'Lição concluída com sucesso!'
            })
        elif completion >= 75:
            actions.append({
                'type': 'encouragement',
                'message': 'Você está quase lá! Continue o bom trabalho.'
            })
        elif completion >= 50:
            actions.append({
                'type': 'tip',
                'message': 'Já na metade do caminho! Que tal revisar o que aprendeu?'
            })
        
        return actions

# Exemplo de uso
if __name__ == "__main__":
    workflow = WorkflowAutomation()
    
    # Simular atualização de progresso
    workflow.process_user_progress(
        user_id="123",
        lesson_id="456",
        progress_data={
            'completion_percentage': 85,
            'time_spent_minutes': 12,
            'correct_answers': 8,
            'total_questions': 10
        }
    )
```

## Instruções Finais

```
Após implementar todas as fases:

1. Teste cada componente individualmente
2. Verifique se não há erros no console
3. Confirme que a aplicação está funcionando corretamente
4. Documente quaisquer problemas encontrados e suas soluções
5. Forneça um relatório final com:
   - Melhorias implementadas
   - Problemas resolvidos
   - Recomendações para próximos passos
```

Este prompt foi projetado para ser compatível com múltiplos modelos de IA, incluindo OpenAI, Google, Microsoft, Replit e Manus. As instruções são detalhadas e incluem exemplos de código completos para facilitar a implementação.
