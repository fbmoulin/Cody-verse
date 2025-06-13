import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  TrendingUp, 
  Zap, 
  Coins, 
  Flame, 
  Target,
  Clock,
  BookOpen,
  Trophy,
  ChevronRight,
  Play,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { t } = useLanguage();
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user stats and dashboard data from backend
      const [userResponse, dashResponse] = await Promise.all([
        fetch('/api/users/1'),
        fetch('/api/gamification/dashboard/1')
      ]);

      if (userResponse.ok && dashResponse.ok) {
        const user = await userResponse.json();
        const dashboard = await dashResponse.json();
        
        setUserData(user.data);
        setDashboardData(dashboard.data);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const simulateAction = async () => {
    try {
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
        toast.success(`🎉 +${data.data.xpAwarded} XP ganho!`);
        loadDashboardData();
      }
    } catch (error) {
      toast.error('Erro ao simular ação');
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const stats = [
    {
      label: t('dashboard.level'),
      value: userData?.level || 12,
      icon: Star,
      color: 'var(--accent)',
      change: '+2 esta semana'
    },
    {
      label: t('dashboard.xp'),
      value: userData?.totalXp || 2340,
      icon: Zap,
      color: 'var(--primary)',
      change: '+450 hoje'
    },
    {
      label: t('dashboard.coins'),
      value: dashboardData?.wallet?.coins || 750,
      icon: Coins,
      color: 'var(--accent)',
      change: '+85 hoje'
    },
    {
      label: t('dashboard.streak'),
      value: dashboardData?.streaks?.current || 7,
      icon: Flame,
      color: 'var(--error)',
      change: 'dias consecutivos'
    }
  ];

  return (
    <div className="dashboard">
      {/* Welcome Header */}
      <motion.div
        className="welcome-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="welcome-content">
          <h1 className="welcome-title">{t('dashboard.welcome')}</h1>
          <p className="welcome-subtitle">
            Continue sua jornada de aprendizado e conquiste novos desafios!
          </p>
        </div>
        <motion.button
          className="btn btn-primary"
          onClick={simulateAction}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Play size={16} />
          Simular Lição
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </motion.div>

      <style jsx>{`
        .dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--space-6);
        }

        .welcome-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-8);
          padding: var(--space-6);
          background: var(--gradient-surface);
          border-radius: var(--radius-xl);
          border: 1px solid var(--surface-light);
        }

        .welcome-title {
          font-size: var(--text-3xl);
          font-weight: 700;
          margin-bottom: var(--space-2);
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .welcome-subtitle {
          color: var(--text-secondary);
          font-size: var(--text-lg);
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-6);
          margin-bottom: var(--space-8);
        }

        @media (max-width: 768px) {
          .welcome-header {
            flex-direction: column;
            gap: var(--space-4);
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ stat, index }) => {
  const Icon = stat.icon;

  return (
    <motion.div
      className="stat-card card-interactive"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <div className="stat-icon">
        <Icon size={24} style={{ color: stat.color }} />
      </div>
      <div className="stat-content">
        <div className="stat-value">{stat.value.toLocaleString()}</div>
        <div className="stat-label">{stat.label}</div>
        <div className="stat-change">{stat.change}</div>
      </div>

      <style jsx>{`
        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-6);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-xl);
          transition: all var(--transition-normal);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background: rgba(79, 70, 229, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin-bottom: var(--space-1);
        }

        .stat-change {
          font-size: var(--text-xs);
          color: var(--success);
          font-weight: 500;
        }
      `}</style>
    </motion.div>
  );
};

const DashboardSkeleton = () => (
  <div className="dashboard">
    <div className="skeleton" style={{ height: '120px', marginBottom: 'var(--space-8)' }} />
    <div className="stats-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton" style={{ height: '100px' }} />
      ))}
    </div>
  </div>
);

export default Dashboard;