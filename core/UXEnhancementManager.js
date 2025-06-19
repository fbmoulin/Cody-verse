const BaseService = require('./BaseService');
const logger = require('../server/logger');

/**
 * UX Enhancement Manager - Manages loading states, offline mode, and progress indicators
 */
class UXEnhancementManager extends BaseService {
  constructor() {
    super('UXEnhancementManager');
    this.loadingStates = new Map();
    this.offlineCache = new Map();
    this.progressTrackers = new Map();
    this.skeletonComponents = new Map();
    this.initializeUXComponents();
  }

  initializeUXComponents() {
    this.createSkeletonTemplates();
    this.setupOfflineDetection();
    this.initializeProgressIndicators();
    logger.info('UX Enhancement Manager initialized', { 
      category: 'ux_enhancement',
      components: ['loading_states', 'offline_mode', 'progress_indicators']
    });
  }

  // Loading States Management
  createLoadingState(componentId, type = 'default', options = {}) {
    const loadingState = {
      id: componentId,
      type,
      isLoading: false,
      startTime: null,
      duration: 0,
      message: options.message || 'Carregando...',
      showSkeleton: options.showSkeleton || true,
      timeout: options.timeout || 10000,
      ...options
    };

    this.loadingStates.set(componentId, loadingState);
    return loadingState;
  }

  startLoading(componentId, message = null) {
    const state = this.loadingStates.get(componentId);
    if (state) {
      state.isLoading = true;
      state.startTime = Date.now();
      if (message) state.message = message;
      
      this.broadcastLoadingState(componentId, state);
      logger.info('Loading started', { 
        componentId, 
        message: state.message,
        category: 'ux_loading'
      });
    }
  }

  stopLoading(componentId, success = true) {
    const state = this.loadingStates.get(componentId);
    if (state && state.isLoading) {
      state.isLoading = false;
      state.duration = Date.now() - state.startTime;
      
      this.broadcastLoadingState(componentId, state);
      logger.info('Loading completed', { 
        componentId, 
        duration: state.duration,
        success,
        category: 'ux_loading'
      });
    }
  }

  broadcastLoadingState(componentId, state) {
    // This would integrate with WebSocket in production
    // For now, we'll store the state for API retrieval
    return {
      component: componentId,
      loading: state.isLoading,
      message: state.message,
      duration: state.duration,
      timestamp: new Date().toISOString()
    };
  }

  // Skeleton Screen Components
  createSkeletonTemplates() {
    this.skeletonComponents.set('course-card', {
      template: this.generateSkeletonHTML('course-card'),
      height: '200px',
      animation: 'pulse'
    });

    this.skeletonComponents.set('lesson-list', {
      template: this.generateSkeletonHTML('lesson-list'),
      height: '400px',
      animation: 'shimmer'
    });

    this.skeletonComponents.set('dashboard', {
      template: this.generateSkeletonHTML('dashboard'),
      height: '600px',
      animation: 'pulse'
    });

    this.skeletonComponents.set('progress-chart', {
      template: this.generateSkeletonHTML('progress-chart'),
      height: '300px',
      animation: 'pulse'
    });
  }

  generateSkeletonHTML(type) {
    const skeletons = {
      'course-card': `
        <div class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-text"></div>
            <div class="skeleton-line skeleton-text short"></div>
          </div>
        </div>`,
      
      'lesson-list': `
        <div class="skeleton-list">
          ${Array(5).fill().map(() => `
            <div class="skeleton-list-item">
              <div class="skeleton-circle"></div>
              <div class="skeleton-content">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
              </div>
            </div>
          `).join('')}
        </div>`,
      
      'dashboard': `
        <div class="skeleton-dashboard">
          <div class="skeleton-header">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line short"></div>
          </div>
          <div class="skeleton-stats">
            ${Array(4).fill().map(() => `
              <div class="skeleton-stat-card">
                <div class="skeleton-number"></div>
                <div class="skeleton-line short"></div>
              </div>
            `).join('')}
          </div>
          <div class="skeleton-content">
            <div class="skeleton-chart"></div>
          </div>
        </div>`,
      
      'progress-chart': `
        <div class="skeleton-chart-container">
          <div class="skeleton-chart-header">
            <div class="skeleton-line skeleton-title"></div>
          </div>
          <div class="skeleton-chart-body">
            <div class="skeleton-bars">
              ${Array(7).fill().map((_, i) => `
                <div class="skeleton-bar" style="height: ${20 + (i * 10)}%"></div>
              `).join('')}
            </div>
          </div>
        </div>`
    };

    return skeletons[type] || '<div class="skeleton-placeholder"></div>';
  }

  getSkeletonComponent(type) {
    return this.skeletonComponents.get(type);
  }

  // Offline Mode Management
  setupOfflineDetection() {
    this.isOnline = true;
    this.offlineQueue = [];
    this.lastSyncTime = Date.now();
    
    // Initialize offline cache with essential data
    this.initializeOfflineCache();
  }

  async initializeOfflineCache() {
    try {
      // Cache essential course data
      const essentialData = {
        courses: await this.cacheEssentialCourses(),
        userProgress: await this.cacheUserProgress(),
        gamificationData: await this.cacheGamificationData(),
        timestamp: Date.now()
      };

      this.offlineCache.set('essential_data', essentialData);
      logger.info('Offline cache initialized', { 
        cacheSize: this.offlineCache.size,
        category: 'offline_mode'
      });
    } catch (error) {
      logger.error('Failed to initialize offline cache', { 
        error: error.message,
        category: 'offline_mode'
      });
    }
  }

  async cacheEssentialCourses() {
    // Cache first 10 courses with basic lesson data
    return {
      courses: [
        {
          id: 1,
          title: "Fundamentos de IA",
          description: "Introdução aos conceitos básicos de Inteligência Artificial",
          modules: 7,
          lessons: 21,
          duration: "4-6 semanas",
          level: "Iniciante",
          cached: true
        }
      ],
      lastUpdated: Date.now()
    };
  }

  async cacheUserProgress() {
    return {
      totalXP: 0,
      level: 1,
      completedLessons: 0,
      badges: [],
      streaks: 0,
      cached: true,
      lastUpdated: Date.now()
    };
  }

  async cacheGamificationData() {
    return {
      wallet: { coins: 0, gems: 0 },
      achievements: [],
      notifications: [],
      cached: true,
      lastUpdated: Date.now()
    };
  }

  setOfflineMode(isOffline) {
    this.isOnline = !isOffline;
    logger.info('Offline mode changed', { 
      isOnline: this.isOnline,
      category: 'offline_mode'
    });
  }

  getCachedData(key) {
    const data = this.offlineCache.get(key);
    if (data) {
      logger.info('Data retrieved from offline cache', { 
        key,
        age: Date.now() - data.timestamp,
        category: 'offline_mode'
      });
    }
    return data;
  }

  queueOfflineAction(action) {
    this.offlineQueue.push({
      ...action,
      timestamp: Date.now(),
      id: this.generateActionId()
    });
    
    logger.info('Action queued for online sync', { 
      actionType: action.type,
      queueSize: this.offlineQueue.length,
      category: 'offline_mode'
    });
  }

  async syncOfflineActions() {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    const actions = [...this.offlineQueue];
    this.offlineQueue = [];

    logger.info('Syncing offline actions', { 
      actionCount: actions.length,
      category: 'offline_mode'
    });

    for (const action of actions) {
      try {
        await this.executeOfflineAction(action);
      } catch (error) {
        // Re-queue failed actions
        this.offlineQueue.push(action);
        logger.error('Failed to sync offline action', { 
          actionId: action.id,
          error: error.message,
          category: 'offline_mode'
        });
      }
    }
  }

  async executeOfflineAction(action) {
    // Implementation would depend on action type
    // For now, we'll log the action
    logger.info('Executing offline action', { 
      actionId: action.id,
      type: action.type,
      category: 'offline_mode'
    });
  }

  // Progress Indicators
  initializeProgressIndicators() {
    this.progressTypes = {
      lesson: { steps: 5, labels: ['Início', 'Leitura', 'Exercícios', 'Avaliação', 'Conclusão'] },
      module: { steps: 3, labels: ['Iniciado', 'Em Progresso', 'Concluído'] },
      course: { steps: 4, labels: ['Inscrição', 'Iniciado', 'Meio', 'Concluído'] },
      loading: { steps: 3, labels: ['Conectando', 'Carregando', 'Processando'] }
    };
  }

  createProgressIndicator(id, type, currentStep = 0, options = {}) {
    const progressType = this.progressTypes[type] || this.progressTypes.lesson;
    
    const indicator = {
      id,
      type,
      currentStep,
      totalSteps: progressType.steps,
      labels: progressType.labels,
      percentage: (currentStep / progressType.steps) * 100,
      isComplete: currentStep >= progressType.steps,
      showLabels: options.showLabels !== false,
      showPercentage: options.showPercentage !== false,
      animated: options.animated !== false,
      color: options.color || 'primary',
      size: options.size || 'medium',
      createdAt: Date.now()
    };

    this.progressTrackers.set(id, indicator);
    return indicator;
  }

  updateProgress(id, newStep, message = null) {
    const indicator = this.progressTrackers.get(id);
    if (indicator) {
      indicator.currentStep = Math.min(newStep, indicator.totalSteps);
      indicator.percentage = (indicator.currentStep / indicator.totalSteps) * 100;
      indicator.isComplete = indicator.currentStep >= indicator.totalSteps;
      indicator.lastUpdated = Date.now();
      if (message) indicator.message = message;

      logger.info('Progress updated', { 
        indicatorId: id,
        step: indicator.currentStep,
        percentage: indicator.percentage,
        category: 'progress_indicator'
      });

      return indicator;
    }
    return null;
  }

  getProgressIndicator(id) {
    return this.progressTrackers.get(id);
  }

  generateProgressHTML(id) {
    const indicator = this.progressTrackers.get(id);
    if (!indicator) return '';

    return `
      <div class="progress-indicator ${indicator.type}" data-id="${id}">
        <div class="progress-header">
          ${indicator.showLabels ? `<span class="progress-label">${indicator.labels[indicator.currentStep] || 'Em Progresso'}</span>` : ''}
          ${indicator.showPercentage ? `<span class="progress-percentage">${Math.round(indicator.percentage)}%</span>` : ''}
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${indicator.percentage}%"></div>
        </div>
        <div class="progress-steps">
          ${indicator.labels.map((label, index) => `
            <div class="progress-step ${index <= indicator.currentStep ? 'completed' : ''} ${index === indicator.currentStep ? 'current' : ''}">
              <div class="step-marker">${index + 1}</div>
              ${indicator.showLabels ? `<div class="step-label">${label}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Utility Methods
  generateActionId() {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getUXMetrics() {
    return {
      loadingStates: {
        active: Array.from(this.loadingStates.values()).filter(s => s.isLoading).length,
        total: this.loadingStates.size
      },
      offlineMode: {
        isOnline: this.isOnline,
        cacheSize: this.offlineCache.size,
        queuedActions: this.offlineQueue.length,
        lastSyncTime: this.lastSyncTime
      },
      progressIndicators: {
        active: this.progressTrackers.size,
        completed: Array.from(this.progressTrackers.values()).filter(p => p.isComplete).length
      }
    };
  }

  generateUXCSS() {
    return `
      /* Loading States & Skeleton Screens */
      .skeleton-card, .skeleton-list-item, .skeleton-stat-card {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
      }

      .skeleton-line {
        height: 16px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
        margin: 8px 0;
      }

      .skeleton-line.short { width: 60%; }
      .skeleton-title { height: 20px; width: 80%; }
      .skeleton-circle { width: 40px; height: 40px; border-radius: 50%; }
      .skeleton-image { height: 120px; width: 100%; }

      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* Progress Indicators */
      .progress-indicator {
        width: 100%;
        margin: 20px 0;
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 500;
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background-color: #e5e5e5;
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #4f46e5, #7c3aed);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-steps {
        display: flex;
        justify-content: space-between;
        margin-top: 16px;
      }

      .progress-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
      }

      .step-marker {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #e5e5e5;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .progress-step.completed .step-marker {
        background-color: #4f46e5;
        color: white;
      }

      .progress-step.current .step-marker {
        background-color: #7c3aed;
        color: white;
        animation: pulse 2s infinite;
      }

      .step-label {
        font-size: 12px;
        text-align: center;
        color: #666;
      }

      /* Offline Mode Indicators */
      .offline-indicator {
        background-color: #fbbf24;
        color: #92400e;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        margin: 10px 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #4f46e5;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
  }
}

module.exports = UXEnhancementManager;