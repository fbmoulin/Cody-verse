const BaseService = require('./BaseService');

class VisualOptimizer extends BaseService {
  constructor() {
    super('VisualOptimizer');
    this.themeCache = new Map();
    this.componentCache = new Map();
    this.animationQueue = new Set();
    this.lazyLoadObserver = null;
    
    this.initializeThemes();
    this.setupLazyLoading();
  }

  initializeThemes() {
    this.themeCache.set('default', {
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#f093fb',
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#ef4444',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1f2937',
        textSecondary: '#6b7280'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        headingFont: 'Inter, sans-serif',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem'
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }
    });

    this.themeCache.set('dark', {
      colors: {
        primary: '#8b5cf6',
        secondary: '#06b6d4',
        accent: '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#111827',
        surface: '#1f2937',
        text: '#f9fafb',
        textSecondary: '#d1d5db'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        headingFont: 'Inter, sans-serif',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem'
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
      }
    });
  }

  setupLazyLoading() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadLazyContent(entry.target);
            this.lazyLoadObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });
    }
  }

  generateOptimizedCSS(theme = 'default') {
    const themeData = this.themeCache.get(theme);
    if (!themeData) return '';

    return `
      :root {
        ${Object.entries(themeData.colors).map(([key, value]) => 
          `--color-${key}: ${value};`
        ).join('\n        ')}
        
        ${Object.entries(themeData.typography.sizes).map(([key, value]) => 
          `--text-${key}: ${value};`
        ).join('\n        ')}
        
        ${Object.entries(themeData.spacing).map(([key, value]) => 
          `--spacing-${key}: ${value};`
        ).join('\n        ')}
        
        ${Object.entries(themeData.borderRadius).map(([key, value]) => 
          `--radius-${key}: ${value};`
        ).join('\n        ')}
        
        ${Object.entries(themeData.shadows).map(([key, value]) => 
          `--shadow-${key}: ${value};`
        ).join('\n        ')}
        
        --font-family: ${themeData.typography.fontFamily};
        --heading-font: ${themeData.typography.headingFont};
      }

      /* Performance optimized base styles */
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html {
        line-height: 1.5;
        -webkit-text-size-adjust: 100%;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      body {
        font-family: var(--font-family);
        background-color: var(--color-background);
        color: var(--color-text);
        line-height: 1.6;
        overflow-x: hidden;
      }

      /* Optimized component classes */
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-sm) var(--spacing-lg);
        border: none;
        border-radius: var(--radius-md);
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
        color: white;
        box-shadow: var(--shadow-md);
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .btn-primary:active {
        transform: translateY(0);
      }

      .card {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        overflow: hidden;
        transition: all 0.3s ease;
        position: relative;
      }

      .card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-xl);
      }

      .card-header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }

      .card-body {
        padding: var(--spacing-lg);
      }

      .card-footer {
        padding: var(--spacing-lg);
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        background: rgba(0, 0, 0, 0.02);
      }

      /* Optimized grid system */
      .grid {
        display: grid;
        gap: var(--spacing-lg);
      }

      .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
      .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
      .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

      @media (max-width: 768px) {
        .grid-cols-2, .grid-cols-3, .grid-cols-4 {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 1024px) {
        .grid-cols-3, .grid-cols-4 {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      /* Performance animations */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .animate-fade-in {
        animation: fadeIn 0.5s ease-out;
      }

      .animate-slide-in {
        animation: slideIn 0.5s ease-out;
      }

      .animate-pulse {
        animation: pulse 2s infinite;
      }

      /* Loading states */
      .skeleton {
        background: linear-gradient(90deg, 
          rgba(0, 0, 0, 0.1) 25%, 
          rgba(0, 0, 0, 0.15) 50%, 
          rgba(0, 0, 0, 0.1) 75%
        );
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: var(--radius-md);
      }

      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* Utility classes */
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }

      .font-bold { font-weight: 700; }
      .font-semibold { font-weight: 600; }
      .font-medium { font-weight: 500; }

      .text-xs { font-size: var(--text-xs); }
      .text-sm { font-size: var(--text-sm); }
      .text-base { font-size: var(--text-base); }
      .text-lg { font-size: var(--text-lg); }
      .text-xl { font-size: var(--text-xl); }
      .text-2xl { font-size: var(--text-2xl); }
      .text-3xl { font-size: var(--text-3xl); }

      .mb-2 { margin-bottom: var(--spacing-sm); }
      .mb-4 { margin-bottom: var(--spacing-md); }
      .mb-6 { margin-bottom: var(--spacing-lg); }

      .p-2 { padding: var(--spacing-sm); }
      .p-4 { padding: var(--spacing-md); }
      .p-6 { padding: var(--spacing-lg); }

      /* Performance optimizations */
      .will-animate {
        will-change: transform;
      }

      .gpu-accelerated {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }

      /* Dark theme */
      @media (prefers-color-scheme: dark) {
        :root {
          ${Object.entries(this.themeCache.get('dark').colors).map(([key, value]) => 
            `--color-${key}: ${value};`
          ).join('\n          ')}
        }
      }

      /* Reduced motion preferences */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
  }

  createOptimizedComponent(type, props = {}, children = '') {
    const componentKey = `${type}_${JSON.stringify(props)}`;
    
    if (this.componentCache.has(componentKey)) {
      return this.componentCache.get(componentKey);
    }

    let component = '';

    switch (type) {
      case 'progressBar':
        component = this.createProgressBar(props);
        break;
      case 'card':
        component = this.createCard(props, children);
        break;
      case 'button':
        component = this.createButton(props, children);
        break;
      case 'notification':
        component = this.createNotification(props);
        break;
      case 'skeleton':
        component = this.createSkeleton(props);
        break;
      default:
        component = `<div class="component-${type}">${children}</div>`;
    }

    this.componentCache.set(componentKey, component);
    return component;
  }

  createProgressBar(props) {
    const { progress = 0, theme = 'primary', size = 'md', showLabel = true } = props;
    const progressValue = Math.min(100, Math.max(0, progress));

    return `
      <div class="progress-container progress-${size}">
        ${showLabel ? `<div class="progress-label">${progressValue}%</div>` : ''}
        <div class="progress-track">
          <div class="progress-fill progress-${theme}" 
               style="width: ${progressValue}%"
               role="progressbar" 
               aria-valuenow="${progressValue}" 
               aria-valuemin="0" 
               aria-valuemax="100">
          </div>
        </div>
      </div>
    `;
  }

  createCard(props, children) {
    const { 
      variant = 'default', 
      hover = true, 
      shadow = 'md',
      padding = 'lg',
      className = '' 
    } = props;

    return `
      <div class="card card-${variant} shadow-${shadow} p-${padding} ${hover ? 'card-hover' : ''} ${className}">
        ${children}
      </div>
    `;
  }

  createButton(props, children) {
    const { 
      variant = 'primary', 
      size = 'md', 
      disabled = false,
      loading = false,
      onClick = '',
      className = '' 
    } = props;

    return `
      <button class="btn btn-${variant} btn-${size} ${disabled ? 'btn-disabled' : ''} ${loading ? 'btn-loading' : ''} ${className}"
              ${disabled ? 'disabled' : ''}
              ${onClick ? `onclick="${onClick}"` : ''}>
        ${loading ? '<span class="loading-spinner"></span>' : ''}
        ${children}
      </button>
    `;
  }

  createNotification(props) {
    const { 
      type = 'info', 
      title = '', 
      message = '', 
      duration = 5000,
      closable = true 
    } = props;

    return `
      <div class="notification notification-${type} animate-slide-in" data-duration="${duration}">
        <div class="notification-content">
          ${title ? `<div class="notification-title">${title}</div>` : ''}
          <div class="notification-message">${message}</div>
        </div>
        ${closable ? '<button class="notification-close" onclick="this.parentElement.remove()">&times;</button>' : ''}
      </div>
    `;
  }

  createSkeleton(props) {
    const { width = '100%', height = '20px', className = '' } = props;

    return `
      <div class="skeleton ${className}" 
           style="width: ${width}; height: ${height};">
      </div>
    `;
  }

  enableLazyLoading(element) {
    if (this.lazyLoadObserver && element) {
      element.setAttribute('data-lazy', 'true');
      this.lazyLoadObserver.observe(element);
    }
  }

  loadLazyContent(element) {
    const src = element.getAttribute('data-src');
    const content = element.getAttribute('data-content');

    if (src && element.tagName === 'IMG') {
      element.src = src;
      element.removeAttribute('data-src');
    }

    if (content) {
      element.innerHTML = content;
      element.removeAttribute('data-content');
    }

    element.classList.add('animate-fade-in');
  }

  optimizeImages() {
    if (typeof document === 'undefined') return;

    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add loading attribute for better performance
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Add decode attribute for better rendering
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
    });
  }

  injectOptimizedStyles(theme = 'default') {
    if (typeof document === 'undefined') return;

    const existingStyle = document.getElementById('visual-optimizer-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'visual-optimizer-styles';
    style.textContent = this.generateOptimizedCSS(theme);
    document.head.appendChild(style);
  }

  getPerformanceMetrics() {
    return {
      componentsCached: this.componentCache.size,
      themesLoaded: this.themeCache.size,
      animationsQueued: this.animationQueue.size,
      lazyLoadingEnabled: !!this.lazyLoadObserver
    };
  }
}

module.exports = VisualOptimizer;