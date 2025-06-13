import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Coins, 
  Flame, 
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { t } = useLanguage();
  const [userStats, setUserStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [dailyGoals, setDailyGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user dashboard data
      const statsResponse = await fetch('/api/gamification/dashboard/1');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setUserStats(statsData.data);
        setDailyGoals(statsData.data.dailyGoals || []);
        setRecentActivity(statsData.data.recentActivity || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueStudying = async () => {
    try {
      // Simulate lesson completion for demo
      const response = await fetch('/api/gamification/lesson-complete/1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: Math.floor(Math.random() * 20) + 1,
          timeSpent: Math.floor(Math.random() * 30) + 10,
          score: Math.floor(Math.random() * 20) + 80
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`🎉 +${data.data.xpAwarded} XP ganhos!`);
        setTimeout(() => loadDashboardData(), 1000);
      }
    } catch (error) {
      toast.error('Erro ao completar lição');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-skeleton">
          {Array(6).fill().map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Header */}
      <motion.div className="welcome-header" variants={itemVariants}>
        <div className="welcome-content">
          <h1 className="welcome-title">{t('dashboard.welcome')}</h1>
          <p className="welcome-subtitle">Pronto para continuar sua jornada de aprendizado?</p>
        </div>
        <motion.button 
          className="btn btn-primary btn-lg continue-btn"
          onClick={handleContinueStudying}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Play size={20} />
          {t('dashboard.continueStudying')}
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="stats-grid" variants={itemVariants}>
        <div className="stat-card level-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('dashboard.level')}</span>
            <span className="stat-value">{userStats?.level || 12}</span>
            <span className="stat-subtitle">{userStats?.levelName || 'Explorador Avançado'}</span>
          </div>
        </div>

        <div className="stat-card xp-card">
          <div className="stat-icon">
            <Zap size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('dashboard.xp')}</span>
            <span className="stat-value">{userStats?.totalXP || 2340}</span>
            <div className="xp-progress">
              <div className="xp-bar">
                <div 
                  className="xp-fill" 
                  style={{ width: `${(userStats?.currentLevelXP || 2340) / (userStats?.nextLevelXP || 3500) * 100}%` }}
                />
              </div>
              <span className="xp-text">
                {userStats?.currentLevelXP || 2340} / {userStats?.nextLevelXP || 3500}
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card coins-card">
          <div className="stat-icon">
            <Coins size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('dashboard.coins')}</span>
            <span className="stat-value">{userStats?.wallet?.coins || 750}</span>
            <span className="stat-subtitle">Moedas disponíveis</span>
          </div>
        </div>

        <div className="stat-card streak-card">
          <div className="stat-icon">
            <Flame size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('dashboard.streak')}</span>
            <span className="stat-value">{userStats?.streaks?.daily || 7}</span>
            <span className="stat-subtitle">dias consecutivos</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Daily Goals */}
        <motion.div className="card daily-goals-card" variants={itemVariants}>
          <div className="card-header">
            <h2 className="card-title">
              <Target size={20} />
              {t('dashboard.dailyGoals')}
            </h2>
            <span className="goals-progress">2/3</span>
          </div>
          
          <div className="goals-list">
            <div className="goal-item completed">
              <div className="goal-icon">
                <BookOpen size={16} />
              </div>
              <div className="goal-content">
                <span className="goal-title">Completar 2 lições</span>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '100%' }} />
                  </div>
                  <span className="progress-text">2/2</span>
                </div>
              </div>
              <div className="goal-reward">+50 XP</div>
            </div>

            <div className="goal-item completed">
              <div className="goal-icon">
                <Clock size={16} />
              </div>
              <div className="goal-content">
                <span className="goal-title">Estudar por 30 minutos</span>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '100%' }} />
                  </div>
                  <span className="progress-text">35/30 min</span>
                </div>
              </div>
              <div className="goal-reward">+30 XP</div>
            </div>

            <div className="goal-item">
              <div className="goal-icon">
                <Award size={16} />
              </div>
              <div className="goal-content">
                <span className="goal-title">Conquistar 1 badge</span>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '0%' }} />
                  </div>
                  <span className="progress-text">0/1</span>
                </div>
              </div>
              <div className="goal-reward">+100 XP</div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div className="card recent-activity-card" variants={itemVariants}>
          <div className="card-header">
            <h2 className="card-title">{t('dashboard.recentActivity')}</h2>
            <button className="btn btn-ghost btn-sm">
              {t('dashboard.viewAll')}
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon success">
                <BookOpen size={16} />
              </div>
              <div className="activity-content">
                <span className="activity-title">Lição "React Hooks" completada</span>
                <span className="activity-time">há 2 horas</span>
              </div>
              <div className="activity-reward">+85 XP</div>
            </div>

            <div className="activity-item">
              <div className="activity-icon achievement">
                <Award size={16} />
              </div>
              <div className="activity-content">
                <span className="activity-title">Badge "Streak Warrior" desbloqueado</span>
                <span className="activity-time">há 1 dia</span>
              </div>
              <div className="activity-reward">+200 XP</div>
            </div>

            <div className="activity-item">
              <div className="activity-icon level">
                <TrendingUp size={16} />
              </div>
              <div className="activity-content">
                <span className="activity-title">Subiu para o Nível 12</span>
                <span className="activity-time">há 2 dias</span>
              </div>
              <div className="activity-reward">+500 XP</div>
            </div>

            <div className="activity-item">
              <div className="activity-icon success">
                <BookOpen size={16} />
              </div>
              <div className="activity-content">
                <span className="activity-title">Curso "JavaScript Avançado" iniciado</span>
                <span className="activity-time">há 3 dias</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="card quick-actions-card" variants={itemVariants}>
          <div className="card-header">
            <h2 className="card-title">Ações Rápidas</h2>
          </div>
          
          <div className="quick-actions">
            <motion.button 
              className="quick-action-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BookOpen size={20} />
              <span>Continuar Curso</span>
            </motion.button>

            <motion.button 
              className="quick-action-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Target size={20} />
              <span>Ver Objetivos</span>
            </motion.button>

            <motion.button 
              className="quick-action-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Award size={20} />
              <span>Minhas Conquistas</span>
            </motion.button>

            <motion.button 
              className="quick-action-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <TrendingUp size={20} />
              <span>Ver Progresso</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-6);
        }

        .welcome-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-8);
          padding: var(--space-8);
          background: var(--gradient-surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--surface-light);
        }

        .welcome-title {
          font-size: var(--text-4xl);
          font-weight: 800;
          margin-bottom: var(--space-2);
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .welcome-subtitle {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          margin: 0;
        }

        .continue-btn {
          min-width: 200px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-6);
          margin-bottom: var(--space-8);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-6);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-xl);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--primary);
        }

        .stat-card.xp-card::before {
          background: var(--gradient-primary);
        }

        .stat-card.coins-card::before {
          background: var(--gradient-accent);
        }

        .stat-card.streak-card::before {
          background: linear-gradient(135deg, #F59E0B, #EF4444);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: var(--radius-xl);
          background: rgba(79, 70, 229, 0.1);
          color: var(--primary);
        }

        .xp-card .stat-icon {
          background: var(--gradient-primary);
          color: white;
        }

        .coins-card .stat-icon {
          background: var(--gradient-accent);
          color: var(--surface);
        }

        .streak-card .stat-icon {
          background: linear-gradient(135deg, #F59E0B, #EF4444);
          color: white;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          display: block;
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin-bottom: var(--space-1);
        }

        .stat-value {
          display: block;
          font-size: var(--text-3xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .stat-subtitle {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .xp-progress {
          margin-top: var(--space-2);
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

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
        }

        .daily-goals-card {
          grid-row: span 2;
        }

        .goals-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .goal-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--surface-light);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }

        .goal-item.completed {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid var(--success);
        }

        .goal-item:hover {
          transform: translateY(-2px);
        }

        .goal-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--surface);
          color: var(--text-secondary);
        }

        .goal-item.completed .goal-icon {
          background: var(--success);
          color: white;
        }

        .goal-content {
          flex: 1;
        }

        .goal-title {
          display: block;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .goal-progress {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: var(--surface);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: var(--radius-lg);
          transition: width 0.8s ease-out;
        }

        .goal-item.completed .progress-fill {
          background: var(--success);
        }

        .progress-text {
          font-size: var(--text-xs);
          color: var(--text-muted);
          min-width: 40px;
        }

        .goal-reward {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--accent);
          padding: var(--space-1) var(--space-2);
          background: rgba(250, 204, 21, 0.1);
          border-radius: var(--radius-md);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }

        .activity-item:hover {
          background: var(--surface-light);
        }

        .activity-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
        }

        .activity-icon.success {
          background: rgba(16, 185, 129, 0.2);
          color: var(--success);
        }

        .activity-icon.achievement {
          background: rgba(250, 204, 21, 0.2);
          color: var(--accent);
        }

        .activity-icon.level {
          background: rgba(79, 70, 229, 0.2);
          color: var(--primary);
        }

        .activity-content {
          flex: 1;
        }

        .activity-title {
          display: block;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .activity-time {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .activity-reward {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--primary);
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4);
        }

        .quick-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-6);
          background: var(--surface-light);
          border: 1px solid var(--surface-lighter);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .quick-action-btn:hover {
          background: var(--surface-lighter);
          color: var(--primary);
          transform: translateY(-2px);
        }

        .quick-action-btn span {
          font-size: var(--text-sm);
          font-weight: 500;
        }

        .goals-progress {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--accent);
          background: rgba(250, 204, 21, 0.1);
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-lg);
        }

        .dashboard-loading {
          padding: var(--space-6);
        }

        .loading-skeleton {
          display: grid;
          gap: var(--space-6);
        }

        .skeleton-card {
          height: 120px;
          background: var(--surface);
          border-radius: var(--radius-xl);
          animation: shimmer 1.5s infinite;
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .daily-goals-card {
            grid-row: span 1;
          }
        }

        @media (max-width: 768px) {
          .welcome-header {
            flex-direction: column;
            gap: var(--space-4);
            text-align: center;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .quick-actions {
            grid-template-columns: 1fr;
          }
        }

        @keyframes progressShine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </motion.div>
  );
};

export default Dashboard;