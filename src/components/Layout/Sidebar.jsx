import React from 'react';
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
  Settings,
  Menu,
  X,
  Globe,
  Moon,
  Sun,
  Zap
} from 'lucide-react';

const Sidebar = ({ collapsed, onToggle }) => {
  const { t, changeLanguage, currentLanguage, availableLanguages } = useLanguage();
  const { theme, updateTheme, ageGroup, updateAgeGroup } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: Home },
    { name: t('nav.courses'), href: '/courses', icon: BookOpen },
    { name: t('nav.progress'), href: '/progress', icon: TrendingUp },
    { name: t('nav.achievements'), href: '/achievements', icon: Trophy },
    { name: t('nav.leaderboard'), href: '/leaderboard', icon: Medal },
    { name: t('nav.profile'), href: '/profile', icon: User }
  ];

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 }
  };

  const itemVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  return (
    <motion.div
      className="sidebar"
      variants={sidebarVariants}
      animate={collapsed ? "collapsed" : "expanded"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className="sidebar-header">
        <motion.div
          className="logo-container"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="logo">
            <Zap className="logo-icon" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  className="logo-text"
                  variants={itemVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                >
                  CodyVerse
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
        <motion.button
          className="collapse-btn"
          onClick={onToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </motion.button>
      </div>

      {/* User Profile */}
      <div className="user-profile">
        <div className="user-avatar">
          <div className="avatar-ring">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face"
              alt="User"
              className="avatar-image"
            />
            <div className="avatar-status"></div>
          </div>
        </div>
        
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="user-info"
              variants={itemVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
            >
              <h3 className="user-name">Alex Student</h3>
              <div className="user-level">
                <span className="level-badge">Nível 12</span>
                <div className="xp-bar">
                  <div className="xp-fill" style={{ width: '68%' }}></div>
                </div>
                <span className="xp-text">2,340 / 3,500 XP</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name} className="nav-item">
                <NavLink
                  to={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <motion.div
                    className="nav-link-content"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="nav-icon" size={20} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          className="nav-text"
                          variants={itemVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  
                  {isActive && (
                    <motion.div
                      className="active-indicator"
                      layoutId="activeIndicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings Section */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            className="sidebar-settings"
            variants={itemVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
          >
            {/* Language Selector */}
            <div className="setting-group">
              <h4 className="setting-label">
                <Globe size={16} />
                Idioma
              </h4>
              <div className="language-selector">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-btn ${currentLanguage === lang.code ? 'active' : ''}`}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    <span className="flag">{lang.flag}</span>
                    <span className="lang-name">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="setting-group">
              <h4 className="setting-label">
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                Tema
              </h4>
              <div className="theme-selector">
                <button
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => updateTheme('dark')}
                >
                  <Moon size={16} />
                  Escuro
                </button>
                <button
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => updateTheme('light')}
                >
                  <Sun size={16} />
                  Claro
                </button>
              </div>
            </div>

            {/* Age Group Selector */}
            <div className="setting-group">
              <h4 className="setting-label">
                <User size={16} />
                Faixa Etária
              </h4>
              <div className="age-selector">
                <button
                  className={`age-btn ${ageGroup === 'child' ? 'active' : ''}`}
                  onClick={() => updateAgeGroup('child')}
                >
                  7-12
                </button>
                <button
                  className={`age-btn ${ageGroup === 'teen' ? 'active' : ''}`}
                  onClick={() => updateAgeGroup('teen')}
                >
                  13-18
                </button>
                <button
                  className={`age-btn ${ageGroup === 'adult' ? 'active' : ''}`}
                  onClick={() => updateAgeGroup('adult')}
                >
                  19+
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="sidebar-footer">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="footer-content"
              variants={itemVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
            >
              <p className="footer-text">CodyVerse v2.0</p>
              <div className="footer-links">
                <a href="#" className="footer-link">Ajuda</a>
                <a href="#" className="footer-link">Sobre</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          background: var(--surface);
          border-right: 1px solid var(--surface-light);
          display: flex;
          flex-direction: column;
          z-index: var(--z-sticky);
          overflow: hidden;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-6);
          border-bottom: 1px solid var(--surface-light);
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .logo-icon {
          color: var(--primary);
          filter: drop-shadow(0 0 8px rgba(79, 70, 229, 0.3));
        }

        .logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: var(--text-xl);
          font-weight: 700;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .collapse-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: var(--radius-md);
          background: var(--surface-light);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .collapse-btn:hover {
          background: var(--surface-lighter);
          color: var(--primary);
        }

        .user-profile {
          padding: var(--space-6);
          border-bottom: 1px solid var(--surface-light);
        }

        .user-avatar {
          display: flex;
          justify-content: center;
          margin-bottom: var(--space-4);
        }

        .avatar-ring {
          position: relative;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--gradient-primary);
          padding: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-status {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 12px;
          height: 12px;
          background: var(--success);
          border: 2px solid var(--surface);
          border-radius: 50%;
        }

        .user-info {
          text-align: center;
        }

        .user-name {
          font-size: var(--text-lg);
          font-weight: 600;
          margin-bottom: var(--space-2);
        }

        .level-badge {
          display: inline-block;
          padding: var(--space-1) var(--space-3);
          background: var(--gradient-accent);
          color: var(--surface);
          font-size: var(--text-xs);
          font-weight: 600;
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-2);
        }

        .xp-bar {
          width: 100%;
          height: 8px;
          background: var(--surface-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: var(--space-1);
        }

        .xp-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: var(--radius-lg);
          transition: width 1s ease-out;
          position: relative;
        }

        .xp-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: progressShine 2s infinite;
        }

        .xp-text {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-4) 0;
          overflow-y: auto;
        }

        .nav-list {
          list-style: none;
        }

        .nav-item {
          margin-bottom: var(--space-1);
        }

        .nav-link {
          display: block;
          padding: 0 var(--space-6);
          text-decoration: none;
          position: relative;
        }

        .nav-link-content {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
          position: relative;
        }

        .nav-link:hover .nav-link-content {
          background: var(--surface-light);
        }

        .nav-link.active .nav-link-content {
          background: rgba(79, 70, 229, 0.1);
          color: var(--primary);
        }

        .nav-icon {
          color: var(--text-secondary);
          transition: color var(--transition-fast);
        }

        .nav-link.active .nav-icon {
          color: var(--primary);
        }

        .nav-text {
          font-weight: 500;
          color: var(--text-secondary);
          transition: color var(--transition-fast);
        }

        .nav-link.active .nav-text {
          color: var(--primary);
        }

        .active-indicator {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 24px;
          background: var(--primary);
          border-radius: 2px;
        }

        .sidebar-settings {
          padding: var(--space-6);
          border-top: 1px solid var(--surface-light);
        }

        .setting-group {
          margin-bottom: var(--space-6);
        }

        .setting-group:last-child {
          margin-bottom: 0;
        }

        .setting-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: var(--space-3);
        }

        .language-selector,
        .theme-selector {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .language-btn,
        .theme-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-secondary);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .language-btn:hover,
        .theme-btn:hover {
          background: var(--surface-light);
          color: var(--text-primary);
        }

        .language-btn.active,
        .theme-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .age-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-2);
        }

        .age-btn {
          padding: var(--space-2);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-secondary);
          font-size: var(--text-xs);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .age-btn:hover {
          background: var(--surface-light);
          color: var(--text-primary);
        }

        .age-btn.active {
          background: var(--accent);
          color: var(--surface);
          border-color: var(--accent);
        }

        .sidebar-footer {
          padding: var(--space-6);
          border-top: 1px solid var(--surface-light);
        }

        .footer-content {
          text-align: center;
        }

        .footer-text {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin-bottom: var(--space-2);
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: var(--space-4);
        }

        .footer-link {
          font-size: var(--text-xs);
          color: var(--text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .footer-link:hover {
          color: var(--primary);
        }

        @keyframes progressShine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
};

export default Sidebar;