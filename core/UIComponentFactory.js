const BaseService = require('./BaseService');

class UIComponentFactory extends BaseService {
  constructor() {
    super('UIComponentFactory');
    this.themes = {
      child: {
        colors: {
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          accent: '#ffe66d',
          background: '#f8f9fa',
          text: '#2c3e50'
        },
        fonts: {
          primary: '"Comic Sans MS", cursive',
          size: '18px',
          weight: '600'
        },
        spacing: {
          padding: '20px',
          margin: '15px',
          borderRadius: '25px'
        }
      },
      teen: {
        colors: {
          primary: '#667eea',
          secondary: '#764ba2',
          accent: '#f093fb',
          background: '#ffffff',
          text: '#2c3e50'
        },
        fonts: {
          primary: '"Inter", sans-serif',
          size: '16px',
          weight: '500'
        },
        spacing: {
          padding: '15px',
          margin: '12px',
          borderRadius: '15px'
        }
      },
      adult: {
        colors: {
          primary: '#2c3e50',
          secondary: '#34495e',
          accent: '#3498db',
          background: '#ffffff',
          text: '#2c3e50'
        },
        fonts: {
          primary: '"Roboto", sans-serif',
          size: '14px',
          weight: '400'
        },
        spacing: {
          padding: '12px',
          margin: '10px',
          borderRadius: '8px'
        }
      }
    };
  }

  createProgressBar(progress, theme = 'teen', options = {}) {
    const themeConfig = this.themes[theme];
    const {
      showPercentage = true,
      animated = true,
      height = '20px',
      gradient = true
    } = options;

    return {
      container: {
        width: '100%',
        height,
        backgroundColor: '#ecf0f1',
        borderRadius: themeConfig.spacing.borderRadius,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
      },
      fill: {
        height: '100%',
        width: `${progress}%`,
        background: gradient 
          ? `linear-gradient(90deg, ${themeConfig.colors.primary}, ${themeConfig.colors.accent})`
          : themeConfig.colors.primary,
        borderRadius: themeConfig.spacing.borderRadius,
        transition: animated ? 'width 1s ease-in-out' : 'none',
        position: 'relative',
        overflow: 'hidden'
      },
      shimmer: animated ? {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
        animation: 'shimmer 2s infinite'
      } : null,
      text: showPercentage ? {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontFamily: themeConfig.fonts.primary,
        fontSize: '0.9rem',
        fontWeight: themeConfig.fonts.weight,
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
      } : null
    };
  }

  createNotificationCard(notification, theme = 'teen') {
    const themeConfig = this.themes[theme];
    
    return {
      container: {
        background: 'white',
        borderRadius: themeConfig.spacing.borderRadius,
        padding: themeConfig.spacing.padding,
        marginBottom: '15px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        borderLeft: `5px solid ${themeConfig.colors.primary}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '280px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      },
      progressBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${themeConfig.colors.primary}, ${themeConfig.colors.accent})`,
        animation: 'progress-countdown 3s ease-out forwards'
      },
      icon: {
        fontSize: theme === 'child' ? '2rem' : '1.8rem',
        filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1))'
      },
      content: {
        flex: 1
      },
      title: {
        fontWeight: '700',
        color: themeConfig.colors.text,
        marginBottom: '2px',
        fontSize: theme === 'child' ? '1.2rem' : '1rem',
        fontFamily: themeConfig.fonts.primary
      },
      message: {
        color: '#7f8c8d',
        fontSize: theme === 'child' ? '1rem' : '0.9rem',
        fontFamily: themeConfig.fonts.primary
      }
    };
  }

  createLevelDisplay(levelData, theme = 'teen') {
    const themeConfig = this.themes[theme];
    
    return {
      container: {
        background: 'white',
        borderRadius: themeConfig.spacing.borderRadius,
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      },
      header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px'
      },
      levelInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      },
      icon: {
        fontSize: theme === 'child' ? '4rem' : '3rem',
        filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2))'
      },
      details: {
        h2: {
          fontSize: theme === 'child' ? '2rem' : '1.8rem',
          color: themeConfig.colors.text,
          marginBottom: '5px',
          fontFamily: themeConfig.fonts.primary
        },
        p: {
          color: '#7f8c8d',
          fontSize: theme === 'child' ? '1.2rem' : '1.1rem',
          fontFamily: themeConfig.fonts.primary
        }
      },
      levelNumber: {
        background: `linear-gradient(135deg, ${themeConfig.colors.primary}, ${themeConfig.colors.secondary})`,
        color: 'white',
        width: theme === 'child' ? '70px' : '60px',
        height: theme === 'child' ? '70px' : '60px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: theme === 'child' ? '1.8rem' : '1.5rem',
        fontWeight: 'bold',
        boxShadow: `0 5px 15px ${themeConfig.colors.primary}30`
      }
    };
  }

  createBadge(badgeData, theme = 'teen', isLocked = false) {
    const themeConfig = this.themes[theme];
    
    return {
      container: {
        background: isLocked 
          ? 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)'
          : `linear-gradient(135deg, ${themeConfig.colors.accent}40 0%, ${themeConfig.colors.primary}20 100%)`,
        borderRadius: themeConfig.spacing.borderRadius,
        padding: themeConfig.spacing.padding,
        textAlign: 'center',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: `0 5px 15px ${themeConfig.colors.primary}20`,
        opacity: isLocked ? 0.6 : 1
      },
      icon: {
        fontSize: theme === 'child' ? '3rem' : '2.5rem',
        marginBottom: '12px',
        display: 'block'
      },
      name: {
        fontWeight: '600',
        color: themeConfig.colors.text,
        marginBottom: '5px',
        fontSize: theme === 'child' ? '1.1rem' : '0.9rem',
        fontFamily: themeConfig.fonts.primary
      },
      description: {
        fontSize: theme === 'child' ? '1rem' : '0.8rem',
        color: '#7f8c8d',
        lineHeight: 1.3,
        fontFamily: themeConfig.fonts.primary
      }
    };
  }

  createStatCard(statData, theme = 'teen') {
    const themeConfig = this.themes[theme];
    
    return {
      container: {
        background: 'white',
        borderRadius: themeConfig.spacing.borderRadius,
        padding: '25px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        borderTop: `4px solid ${themeConfig.colors.primary}`,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
      },
      icon: {
        fontSize: theme === 'child' ? '3rem' : '2.5rem',
        marginBottom: '15px',
        filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.1))'
      },
      number: {
        fontSize: theme === 'child' ? '2.5rem' : '2.2rem',
        fontWeight: '700',
        color: themeConfig.colors.text,
        marginBottom: '8px',
        fontFamily: themeConfig.fonts.primary
      },
      label: {
        color: '#7f8c8d',
        fontWeight: '500',
        fontSize: theme === 'child' ? '1.1rem' : '1rem',
        fontFamily: themeConfig.fonts.primary
      }
    };
  }

  createAnimationKeyframes() {
    return `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      @keyframes progress-countdown {
        from { width: 100%; }
        to { width: 0%; }
      }
      
      @keyframes float-up {
        0% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        50% {
          opacity: 1;
          transform: translateY(-50px) scale(1.2);
        }
        100% {
          opacity: 0;
          transform: translateY(-100px) scale(1);
        }
      }
      
      @keyframes confetti-fall {
        0% {
          transform: translateY(-100vh) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-20px);
        }
        60% {
          transform: translateY(-10px);
        }
      }
    `;
  }

  generateCSS(theme = 'teen') {
    const themeConfig = this.themes[theme];
    
    return `
      :root {
        --primary-color: ${themeConfig.colors.primary};
        --secondary-color: ${themeConfig.colors.secondary};
        --accent-color: ${themeConfig.colors.accent};
        --background-color: ${themeConfig.colors.background};
        --text-color: ${themeConfig.colors.text};
        --font-family: ${themeConfig.fonts.primary};
        --font-size: ${themeConfig.fonts.size};
        --font-weight: ${themeConfig.fonts.weight};
        --padding: ${themeConfig.spacing.padding};
        --margin: ${themeConfig.spacing.margin};
        --border-radius: ${themeConfig.spacing.borderRadius};
      }
      
      ${this.createAnimationKeyframes()}
      
      .theme-${theme} {
        font-family: var(--font-family);
        font-size: var(--font-size);
        font-weight: var(--font-weight);
        color: var(--text-color);
      }
    `;
  }
}

module.exports = UIComponentFactory;