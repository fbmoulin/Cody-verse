const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Configuração para ambiente Replit
const logDir = path.join(__dirname, '../logs');

// Garantir que o diretório de logs exista
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

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

// Adicionar métodos de conveniência
logger.success = (message, meta) => {
  logger.info(message, { ...meta, success: true });
};

logger.database = (message, meta) => {
  logger.info(message, { ...meta, category: 'database' });
};

logger.api = (message, meta) => {
  logger.info(message, { ...meta, category: 'api' });
};

module.exports = logger;