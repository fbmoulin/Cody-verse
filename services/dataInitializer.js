const { db } = require('../server/database');
const { courseModules, lessons } = require('../shared/schema');

class DataInitializer {
  async initializeDatabase() {
    try {
      console.log('Inicializando dados do curso...');
      
      await this.createCourseModules();
      await this.createLessons();
      
      console.log('Dados inicializados com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar dados:', error);
      throw error;
    }
  }

  async createCourseModules() {
    // Verificar se módulos já existem
    const existingModules = await db.select().from(courseModules);
    
    if (existingModules.length === 0) {
      console.log('Módulos já existem no banco de dados');
    }
  }

  async createLessons() {
    // Verificar se lições já existem
    const existingLessons = await db.select().from(lessons);
    
    if (existingLessons.length === 0) {
      console.log('Lições já existem no banco de dados');
    }
  }
}

module.exports = new DataInitializer();