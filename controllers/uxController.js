const BaseController = require('../core/BaseController');
const UXEnhancementManager = require('../core/UXEnhancementManager');

/**
 * UX Controller - Manages user experience enhancements
 */
class UXController extends BaseController {
  constructor() {
    super('UXController');
    this.uxManager = new UXEnhancementManager();
  }

  // Loading States Endpoints
  async getLoadingStates(req, res) {
    await this.handleRequest(req, res, async () => {
      const states = Array.from(this.uxManager.loadingStates.entries()).map(([id, state]) => ({
        id,
        ...state
      }));

      return this.createResponse(states, 'Loading states retrieved successfully');
    });
  }

  async startLoading(req, res) {
    await this.handleRequest(req, res, async () => {
      const { componentId, message } = req.body;
      
      if (!componentId) {
        return res.status(400).json(this.createErrorResponse('Component ID is required', 400));
      }

      // Create loading state if it doesn't exist
      if (!this.uxManager.loadingStates.has(componentId)) {
        this.uxManager.createLoadingState(componentId, 'api', { message });
      }

      this.uxManager.startLoading(componentId, message);
      
      const state = this.uxManager.loadingStates.get(componentId);
      return this.createResponse(state, 'Loading started successfully');
    });
  }

  async stopLoading(req, res) {
    await this.handleRequest(req, res, async () => {
      const { componentId, success = true } = req.body;
      
      if (!componentId) {
        return res.status(400).json(this.createErrorResponse('Component ID is required', 400));
      }

      this.uxManager.stopLoading(componentId, success);
      
      const state = this.uxManager.loadingStates.get(componentId);
      return this.createResponse(state, 'Loading stopped successfully');
    });
  }

  // Skeleton Components
  async getSkeletonComponent(req, res) {
    await this.handleRequest(req, res, async () => {
      const { type } = req.params;
      
      const skeleton = this.uxManager.getSkeletonComponent(type);
      if (!skeleton) {
        return res.status(404).json(this.createErrorResponse('Skeleton component not found', 404));
      }

      return this.createResponse(skeleton, 'Skeleton component retrieved successfully');
    });
  }

  async getSkeletonCSS(req, res) {
    await this.handleRequest(req, res, async () => {
      const css = this.uxManager.generateUXCSS();
      
      res.setHeader('Content-Type', 'text/css');
      res.send(css);
    });
  }

  // Offline Mode Endpoints
  async getOfflineStatus(req, res) {
    await this.handleRequest(req, res, async () => {
      const status = {
        isOnline: this.uxManager.isOnline,
        cacheSize: this.uxManager.offlineCache.size,
        queuedActions: this.uxManager.offlineQueue.length,
        lastSyncTime: this.uxManager.lastSyncTime
      };

      return this.createResponse(status, 'Offline status retrieved successfully');
    });
  }

  async getCachedData(req, res) {
    await this.handleRequest(req, res, async () => {
      const { key } = req.params;
      
      const data = this.uxManager.getCachedData(key);
      if (!data) {
        return res.status(404).json(this.createErrorResponse('Cached data not found', 404));
      }

      return this.createResponse(data, 'Cached data retrieved successfully');
    });
  }

  async setOfflineMode(req, res) {
    await this.handleRequest(req, res, async () => {
      const { isOffline } = req.body;
      
      this.uxManager.setOfflineMode(isOffline);
      
      const status = {
        isOnline: this.uxManager.isOnline,
        message: isOffline ? 'Offline mode enabled' : 'Online mode enabled'
      };

      return this.createResponse(status, 'Offline mode updated successfully');
    });
  }

  async queueOfflineAction(req, res) {
    await this.handleRequest(req, res, async () => {
      const { action } = req.body;
      
      if (!action || !action.type) {
        return res.status(400).json(this.createErrorResponse('Action with type is required', 400));
      }

      this.uxManager.queueOfflineAction(action);
      
      const status = {
        queueSize: this.uxManager.offlineQueue.length,
        actionQueued: true
      };

      return this.createResponse(status, 'Action queued for offline sync');
    });
  }

  async syncOfflineActions(req, res) {
    await this.handleRequest(req, res, async () => {
      await this.uxManager.syncOfflineActions();
      
      const status = {
        synced: true,
        remainingActions: this.uxManager.offlineQueue.length
      };

      return this.createResponse(status, 'Offline actions synced successfully');
    });
  }

  // Progress Indicators
  async createProgressIndicator(req, res) {
    await this.handleRequest(req, res, async () => {
      const { id, type, currentStep = 0, options = {} } = req.body;
      
      if (!id || !type) {
        return res.status(400).json(this.createErrorResponse('ID and type are required', 400));
      }

      const indicator = this.uxManager.createProgressIndicator(id, type, currentStep, options);
      
      return this.createResponse(indicator, 'Progress indicator created successfully');
    });
  }

  async updateProgress(req, res) {
    await this.handleRequest(req, res, async () => {
      const { id } = req.params;
      const { step, message } = req.body;
      
      if (step === undefined) {
        return res.status(400).json(this.createErrorResponse('Step is required', 400));
      }

      const indicator = this.uxManager.updateProgress(id, step, message);
      if (!indicator) {
        return res.status(404).json(this.createErrorResponse('Progress indicator not found', 404));
      }

      return this.createResponse(indicator, 'Progress updated successfully');
    });
  }

  async getProgressIndicator(req, res) {
    await this.handleRequest(req, res, async () => {
      const { id } = req.params;
      
      const indicator = this.uxManager.getProgressIndicator(id);
      if (!indicator) {
        return res.status(404).json(this.createErrorResponse('Progress indicator not found', 404));
      }

      return this.createResponse(indicator, 'Progress indicator retrieved successfully');
    });
  }

  async getProgressHTML(req, res) {
    await this.handleRequest(req, res, async () => {
      const { id } = req.params;
      
      const html = this.uxManager.generateProgressHTML(id);
      if (!html) {
        return res.status(404).json(this.createErrorResponse('Progress indicator not found', 404));
      }

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    });
  }

  // Enhanced Loading with Course Integration
  async loadCourseWithStates(req, res) {
    await this.handleRequest(req, res, async () => {
      const { courseId } = req.params;
      const componentId = `course_${courseId}`;
      
      // Start loading state
      this.uxManager.createLoadingState(componentId, 'course', {
        message: 'Carregando curso...',
        showSkeleton: true
      });
      
      this.uxManager.startLoading(componentId);
      
      try {
        // Simulate course loading with progress updates
        const progressId = `course_load_${courseId}`;
        const progress = this.uxManager.createProgressIndicator(progressId, 'loading', 0);
        
        // Step 1: Connecting
        this.uxManager.updateProgress(progressId, 1, 'Conectando ao servidor...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 2: Loading
        this.uxManager.updateProgress(progressId, 2, 'Carregando dados do curso...');
        
        // Get course data from cache or database
        let courseData = this.uxManager.getCachedData(`course_${courseId}`);
        
        if (!courseData && this.uxManager.isOnline) {
          // In production, this would fetch from the database
          courseData = {
            id: courseId,
            title: "Fundamentos de IA",
            description: "Curso abrangente sobre Inteligência Artificial",
            modules: 7,
            lessons: 21,
            progress: 0,
            cached: false,
            loadedAt: Date.now()
          };
        } else if (!courseData) {
          // Offline mode - return cached essential data
          courseData = this.uxManager.getCachedData('essential_data')?.courses?.[0] || {
            id: courseId,
            title: "Curso Indisponível Offline",
            description: "Este curso não está disponível no modo offline",
            cached: true,
            offline: true
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Step 3: Processing
        this.uxManager.updateProgress(progressId, 3, 'Processando dados...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Complete loading
        this.uxManager.stopLoading(componentId, true);
        
        return this.createResponse({
          course: courseData,
          loadingState: this.uxManager.loadingStates.get(componentId),
          progressIndicator: this.uxManager.getProgressIndicator(progressId),
          isOffline: !this.uxManager.isOnline
        }, 'Course loaded successfully');
        
      } catch (error) {
        this.uxManager.stopLoading(componentId, false);
        throw error;
      }
    });
  }

  // UX Metrics and Analytics
  async getUXMetrics(req, res) {
    await this.handleRequest(req, res, async () => {
      const metrics = this.uxManager.getUXMetrics();
      
      return this.createResponse(metrics, 'UX metrics retrieved successfully');
    });
  }

  // Enhanced Course List with Loading States
  async getEnhancedCourseList(req, res) {
    await this.handleRequest(req, res, async () => {
      const componentId = 'course_list';
      
      // Start loading with skeleton
      this.uxManager.createLoadingState(componentId, 'list', {
        message: 'Carregando lista de cursos...',
        showSkeleton: true
      });
      
      this.uxManager.startLoading(componentId);
      
      try {
        // Check if we have cached data
        let courses = this.uxManager.getCachedData('courses');
        
        if (!courses && this.uxManager.isOnline) {
          // Simulate loading delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          courses = {
            data: [
              {
                id: 1,
                title: "Fundamentos de IA",
                description: "Introdução aos conceitos básicos de Inteligência Artificial",
                modules: 7,
                lessons: 21,
                duration: "4-6 semanas",
                level: "Iniciante",
                progress: 0
              },
              {
                id: 2,
                title: "Machine Learning Prático",
                description: "Aplicações práticas de aprendizado de máquina",
                modules: 5,
                lessons: 15,
                duration: "3-4 semanas",
                level: "Intermediário",
                progress: 0
              }
            ],
            cached: false,
            loadedAt: Date.now()
          };
          
          // Cache the data
          this.uxManager.offlineCache.set('courses', courses);
        } else if (!courses) {
          // Use essential offline data
          courses = this.uxManager.getCachedData('essential_data')?.courses || {
            data: [],
            cached: true,
            offline: true
          };
        }
        
        this.uxManager.stopLoading(componentId, true);
        
        return this.createResponse({
          courses: courses.data || [],
          skeleton: this.uxManager.getSkeletonComponent('course-card'),
          loadingState: this.uxManager.loadingStates.get(componentId),
          isOffline: !this.uxManager.isOnline,
          fromCache: courses.cached || false
        }, 'Enhanced course list retrieved successfully');
        
      } catch (error) {
        this.uxManager.stopLoading(componentId, false);
        throw error;
      }
    });
  }
}

module.exports = UXController;