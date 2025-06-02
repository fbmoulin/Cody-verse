// Middleware básico de autenticação
// Em produção, implementar JWT ou sistema de sessão robusto

function authenticateUser(req, res, next) {
  // Por enquanto, autenticação simplificada para desenvolvimento
  // Em produção, validar token JWT ou sessão
  
  const authHeader = req.headers.authorization;
  const userId = req.headers['x-user-id'];
  
  // Permitir requisições com user-id para desenvolvimento
  if (userId && !isNaN(parseInt(userId))) {
    req.user = { id: parseInt(userId) };
    return next();
  }
  
  // Verificar token de autorização
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Aqui implementar validação de JWT em produção
    const token = authHeader.substring(7);
    
    if (token === 'development-token') {
      req.user = { id: 1 }; // Usuário padrão para desenvolvimento
      return next();
    }
  }
  
  // Para desenvolvimento, permitir acesso sem autenticação
  if (process.env.NODE_ENV === 'development') {
    req.user = { id: 1 };
    return next();
  }
  
  res.status(401).json({
    success: false,
    error: 'Token de autenticação requerido',
    message: 'Acesso negado. Forneça um token válido.'
  });
}

module.exports = authenticateUser;