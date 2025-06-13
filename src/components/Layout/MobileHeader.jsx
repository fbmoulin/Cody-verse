import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Home,
  BookOpen,
  TrendingUp,
  Trophy,
  Medal,
  User,
  Menu,
  X,
  Bell,
  Search,
  Zap
} from 'lucide-react';

const MobileHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { theme } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: Home },
    { name: t('nav.courses'), href: '/courses', icon: BookOpen },
    { name: t('nav.progress'), href: '/progress', icon: TrendingUp },
    { name: t('nav.achievements'), href: '/achievements', icon: Trophy },
    { name: t('nav.leaderboard'), href: '/leaderboard', icon: Medal },
    { name: t('nav.profile'), href: '/profile', icon: User }
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const menuVariants = {
    closed: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 }
  };

  return (
    <>
      <header className="mobile-header">
        <div className="header-content">
          {/* Logo */}
          <motion.div 
            className="header-logo"
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="logo-icon" />
            <span className="logo-text">CodyVerse</span>
          </motion.div>

          {/* Actions */}
          <div className="header-actions">
            <motion.button
              className="action-btn"
              whileTap={{ scale: 0.95 }}
            >
              <Search size={20} />
            </motion.button>
            
            <motion.button
              className="action-btn notification-btn"
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </motion.button>

            <motion.button
              className="menu-btn"
              onClick={toggleMenu}
              whileTap={{ scale: 0.95 }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="user-quick-info">
          <div className="user-avatar-small">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
              alt="User"
              className="avatar-image-small"
            />
          </div>
          <div className="user-stats-quick">
            <div className="stat-item-quick">
              <span className="stat-label">Nível</span>
              <span className="stat-value">12</span>
            </div>
            <div className="stat-item-quick">
              <span className="stat-label">XP</span>
              <span className="stat-value">2,340</span>
            </div>
            <div className="stat-item-quick">
              <span className="stat-label">Moedas</span>
              <span className="stat-value">750</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              className="menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
            />
            
            <motion.div
              className="mobile-menu"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <nav className="mobile-nav">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <motion.div
                      key={item.name}
                      variants={itemVariants}
                    >
                      <NavLink
                        to={item.href}
                        className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                        onClick={toggleMenu}
                      >
                        <Icon className="nav-icon" size={20} />
                        <span className="nav-text">{item.name}</span>
                        {isActive && (
                          <motion.div
                            className="active-dot"
                            layoutId="mobileActiveDot"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </NavLink>
                    </motion.div>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .mobile-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: var(--z-sticky);
          background: var(--surface);
          border-bottom: 1px solid var(--surface-light);
          backdrop-filter: blur(10px);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-6);
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .logo-icon {
          color: var(--primary);
          filter: drop-shadow(0 0 8px rgba(79, 70, 229, 0.3));
        }

        .logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: var(--text-lg);
          font-weight: 700;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .action-btn,
        .menu-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: none;
          border-radius: var(--radius-lg);
          background: var(--surface-light);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }

        .action-btn:hover,
        .menu-btn:hover {
          background: var(--surface-lighter);
          color: var(--primary);
        }

        .notification-btn {
          position: relative;
        }

        .notification-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 18px;
          height: 18px;
          background: var(--error);
          color: white;
          font-size: 10px;
          font-weight: 600;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--surface);
        }

        .user-quick-info {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: 0 var(--space-6) var(--space-4);
        }

        .user-avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--gradient-primary);
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-image-small {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-stats-quick {
          display: flex;
          gap: var(--space-6);
          flex: 1;
        }

        .stat-item-quick {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin-bottom: var(--space-1);
        }

        .stat-value {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
        }

        .menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: var(--z-modal);
          backdrop-filter: blur(4px);
        }

        .mobile-menu {
          position: fixed;
          top: 120px;
          left: var(--space-6);
          right: var(--space-6);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          z-index: var(--z-modal);
          overflow: hidden;
        }

        .mobile-nav {
          padding: var(--space-4);
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          text-decoration: none;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
          position: relative;
          margin-bottom: var(--space-2);
        }

        .mobile-nav-link:last-child {
          margin-bottom: 0;
        }

        .mobile-nav-link:hover {
          background: var(--surface-light);
          color: var(--text-primary);
        }

        .mobile-nav-link.active {
          background: rgba(79, 70, 229, 0.1);
          color: var(--primary);
        }

        .nav-icon {
          transition: color var(--transition-fast);
        }

        .mobile-nav-link.active .nav-icon {
          color: var(--primary);
        }

        .nav-text {
          font-weight: 500;
          flex: 1;
        }

        .active-dot {
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
        }

        /* Adjust main content for mobile header */
        @media (max-width: 768px) {
          .main-content {
            padding-top: 120px;
          }
        }
      `}</style>
    </>
  );
};

export default MobileHeader;