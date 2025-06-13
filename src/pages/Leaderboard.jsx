import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star, 
  TrendingUp, 
  Users, 
  Calendar,
  Zap,
  Award,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const { t } = useLanguage();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('thisWeek');
  const [category, setCategory] = useState('global');
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboardData();
  }, [timeFrame, category]);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/gamification/dashboard/1');
      const data = await response.json();
      
      if (data.success) {
        const mockLeaderboard = generateLeaderboardData();
        setLeaderboardData(mockLeaderboard);
        setUserRank(findUserRank(mockLeaderboard));
      }
    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
      toast.error('Erro ao carregar ranking');
    } finally {
      setLoading(false);
    }
  };

  const generateLeaderboardData = () => {
    const baseUsers = [
      { id: 1, name: 'Alex Student', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face', isCurrentUser: true },
      { id: 2, name: 'Maria Silva', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b88c4e55?w=64&h=64&fit=crop&crop=face' },
      { id: 3, name: 'João Santos', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face' },
      { id: 4, name: 'Ana Costa', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face' },
      { id: 5, name: 'Pedro Lima', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=face' },
      { id: 6, name: 'Carla Mendes', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=face' },
      { id: 7, name: 'Rafael Oliveira', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f32?w=64&h=64&fit=crop&crop=face' },
      { id: 8, name: 'Juliana Rocha', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop&crop=face' },
      { id: 9, name: 'Bruno Alves', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=64&h=64&fit=crop&crop=face' },
      { id: 10, name: 'Fernanda Cruz', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=face' }
    ];

    return baseUsers.map((user, index) => ({
      ...user,
      rank: index + 1,
      previousRank: index === 0 ? 2 : index === 1 ? 1 : index + Math.floor(Math.random() * 3) - 1,
      score: 5000 - (index * 450) + Math.floor(Math.random() * 200),
      level: 15 - Math.floor(index / 2),
      badges: Math.floor(Math.random() * 20) + 5,
      streak: Math.floor(Math.random() * 30) + 1,
      lessonsCompleted: Math.floor(Math.random() * 50) + 20,
      timeSpent: Math.floor(Math.random() * 1000) + 500 // minutes
    }));
  };

  const findUserRank = (leaderboard) => {
    return leaderboard.find(user => user.isCurrentUser);
  };

  const getRankChange = (current, previous) => {
    if (!previous || current === previous) return 'same';
    return current < previous ? 'up' : 'down';
  };

  const getRankChangeIcon = (change) => {
    switch (change) {
      case 'up': return <ChevronUp size={16} className="rank-up" />;
      case 'down': return <ChevronDown size={16} className="rank-down" />;
      default: return <Minus size={16} className="rank-same" />;
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown size={24} className="rank-crown" />;
      case 2: return <Medal size={24} className="rank-silver" />;
      case 3: return <Medal size={24} className="rank-bronze" />;
      default: return <span className="rank-number">{rank}</span>;
    }
  };

  const timeFrames = [
    { value: 'thisWeek', label: 'Esta Semana' },
    { value: 'thisMonth', label: 'Este Mês' },
    { value: 'allTime', label: 'Todos os Tempos' }
  ];

  const categories = [
    { value: 'global', label: 'Global' },
    { value: 'friends', label: 'Amigos' }
  ];

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

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="loading-header skeleton" />
        <div className="loading-podium skeleton" />
        <div className="loading-list">
          {Array(10).fill().map((_, i) => (
            <div key={i} className="skeleton-rank-item" />
          ))}
        </div>
      </div>
    );
  }

  const topThree = leaderboardData.slice(0, 3);
  const restOfList = leaderboardData.slice(3);

  return (
    <motion.div 
      className="leaderboard-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="leaderboard-header" variants={itemVariants}>
        <div className="header-content">
          <h1 className="page-title">{t('leaderboard.title')}</h1>
          <p className="page-subtitle">
            Compete com outros estudantes e veja sua posição no ranking
          </p>
        </div>
        <div className="leaderboard-controls">
          <div className="control-group">
            <Users size={16} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="control-select"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="control-group">
            <Calendar size={16} />
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              className="control-select"
            >
              {timeFrames.map(frame => (
                <option key={frame.value} value={frame.value}>{frame.label}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* User Rank Card */}
      {userRank && (
        <motion.div className="user-rank-card" variants={itemVariants}>
          <div className="rank-info">
            <div className="rank-position">
              {getRankIcon(userRank.rank)}
            </div>
            <div className="rank-details">
              <span className="rank-text">Sua Posição</span>
              <span className="rank-value">#{userRank.rank} de {leaderboardData.length}</span>
            </div>
          </div>
          <div className="rank-stats">
            <div className="rank-stat">
              <Zap size={16} />
              <span>{userRank.score} XP</span>
            </div>
            <div className="rank-stat">
              <TrendingUp size={16} />
              <span>Nível {userRank.level}</span>
            </div>
            <div className="rank-stat">
              <Award size={16} />
              <span>{userRank.badges} Badges</span>
            </div>
          </div>
          <div className="rank-change">
            {getRankChangeIcon(getRankChange(userRank.rank, userRank.previousRank))}
            <span>
              {getRankChange(userRank.rank, userRank.previousRank) === 'up' && 'Subiu '}
              {getRankChange(userRank.rank, userRank.previousRank) === 'down' && 'Desceu '}
              {getRankChange(userRank.rank, userRank.previousRank) === 'same' && 'Manteve '}
              posição
            </span>
          </div>
        </motion.div>
      )}

      {/* Podium (Top 3) */}
      <motion.div className="podium-container" variants={itemVariants}>
        <h2 className="section-title">Top 3 Estudantes</h2>
        <div className="podium">
          {/* Second Place */}
          {topThree[1] && (
            <motion.div 
              className="podium-position second"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="podium-rank">2</div>
              <div className="podium-user">
                <img src={topThree[1].avatar} alt={topThree[1].name} className="podium-avatar" />
                <span className="podium-name">{topThree[1].name}</span>
                <span className="podium-score">{topThree[1].score} XP</span>
              </div>
            </motion.div>
          )}

          {/* First Place */}
          {topThree[0] && (
            <motion.div 
              className="podium-position first"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="podium-crown">
                <Crown size={32} />
              </div>
              <div className="podium-rank">1</div>
              <div className="podium-user">
                <img src={topThree[0].avatar} alt={topThree[0].name} className="podium-avatar champion" />
                <span className="podium-name">{topThree[0].name}</span>
                <span className="podium-score">{topThree[0].score} XP</span>
              </div>
            </motion.div>
          )}

          {/* Third Place */}
          {topThree[2] && (
            <motion.div 
              className="podium-position third"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="podium-rank">3</div>
              <div className="podium-user">
                <img src={topThree[2].avatar} alt={topThree[2].name} className="podium-avatar" />
                <span className="podium-name">{topThree[2].name}</span>
                <span className="podium-score">{topThree[2].score} XP</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Full Leaderboard */}
      <motion.div className="leaderboard-list" variants={itemVariants}>
        <h2 className="section-title">Ranking Completo</h2>
        <div className="rank-list">
          <AnimatePresence>
            {leaderboardData.map((user, index) => (
              <motion.div
                key={user.id}
                className={`rank-item ${user.isCurrentUser ? 'current-user' : ''}`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4, scale: 1.01 }}
              >
                <div className="rank-position">
                  {getRankIcon(user.rank)}
                </div>

                <div className="user-info">
                  <img src={user.avatar} alt={user.name} className="user-avatar" />
                  <div className="user-details">
                    <span className="user-name">{user.name}</span>
                    <div className="user-stats">
                      <span className="stat">Nível {user.level}</span>
                      <span className="stat">{user.badges} badges</span>
                      <span className="stat">{user.streak} dias</span>
                    </div>
                  </div>
                </div>

                <div className="user-score">
                  <span className="score-value">{user.score}</span>
                  <span className="score-label">XP</span>
                </div>

                <div className="rank-change">
                  {getRankChangeIcon(getRankChange(user.rank, user.previousRank))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      <style jsx>{`
        .leaderboard-page {
          max-width: 1000px;
          margin: 0 auto;
          padding: var(--space-6);
        }

        .leaderboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-8);
          padding: var(--space-8);
          background: var(--gradient-surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--surface-light);
        }

        .header-content h1 {
          font-size: var(--text-4xl);
          font-weight: 800;
          margin-bottom: var(--space-2);
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-subtitle {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          margin: 0;
        }

        .leaderboard-controls {
          display: flex;
          gap: var(--space-4);
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
        }

        .control-select {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: var(--text-base);
          cursor: pointer;
        }

        .control-select:focus {
          outline: none;
        }

        .user-rank-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-6);
          background: var(--surface);
          border: 2px solid var(--primary);
          border-radius: var(--radius-2xl);
          margin-bottom: var(--space-8);
          position: relative;
          overflow: hidden;
        }

        .user-rank-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--gradient-primary);
        }

        .rank-info {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .rank-position {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: var(--gradient-primary);
          border-radius: 50%;
          color: white;
          font-size: var(--text-xl);
          font-weight: 700;
        }

        .rank-details {
          display: flex;
          flex-direction: column;
        }

        .rank-text {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin-bottom: var(--space-1);
        }

        .rank-value {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--text-primary);
        }

        .rank-stats {
          display: flex;
          gap: var(--space-6);
        }

        .rank-stat {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-secondary);
          font-weight: 500;
        }

        .rank-change {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          font-weight: 500;
        }

        .rank-up { color: var(--success); }
        .rank-down { color: var(--error); }
        .rank-same { color: var(--text-muted); }

        .podium-container {
          margin-bottom: var(--space-8);
        }

        .section-title {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-6);
          text-align: center;
        }

        .podium {
          display: flex;
          align-items: end;
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-8);
          background: var(--surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--surface-light);
          position: relative;
          overflow: hidden;
        }

        .podium::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, 
            rgba(79, 70, 229, 0.05) 0%, 
            transparent 70%);
        }

        .podium-position {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .podium-position.first {
          order: 2;
          margin-bottom: var(--space-4);
        }

        .podium-position.second {
          order: 1;
        }

        .podium-position.third {
          order: 3;
        }

        .podium-crown {
          position: absolute;
          top: -40px;
          color: var(--accent);
          filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.5));
          animation: float 3s ease-in-out infinite;
        }

        .podium-rank {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-lg);
          font-weight: 700;
          color: white;
          margin-bottom: var(--space-4);
        }

        .first .podium-rank {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          width: 50px;
          height: 50px;
          font-size: var(--text-xl);
        }

        .second .podium-rank {
          background: linear-gradient(135deg, #C0C0C0, #A8A8A8);
        }

        .third .podium-rank {
          background: linear-gradient(135deg, #CD7F32, #B8860B);
        }

        .podium-user {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .podium-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--surface-light);
          margin-bottom: var(--space-3);
          transition: all var(--transition-normal);
        }

        .podium-avatar.champion {
          width: 80px;
          height: 80px;
          border-color: var(--accent);
          box-shadow: 0 0 20px rgba(250, 204, 21, 0.3);
        }

        .podium-name {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .first .podium-name {
          font-size: var(--text-lg);
        }

        .podium-score {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: 500;
        }

        .rank-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .rank-item {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-xl);
          transition: all var(--transition-normal);
          position: relative;
        }

        .rank-item:hover {
          box-shadow: var(--shadow-lg);
          border-color: var(--primary);
        }

        .rank-item.current-user {
          border-color: var(--primary);
          background: rgba(79, 70, 229, 0.05);
        }

        .rank-item.current-user::before {
          content: 'Você';
          position: absolute;
          top: -8px;
          left: var(--space-4);
          background: var(--primary);
          color: white;
          font-size: var(--text-xs);
          font-weight: 600;
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-lg);
        }

        .rank-item .rank-position {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          flex-shrink: 0;
        }

        .rank-number {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-secondary);
        }

        .rank-crown { color: var(--accent); }
        .rank-silver { color: #C0C0C0; }
        .rank-bronze { color: #CD7F32; }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex: 1;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--surface-light);
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .user-stats {
          display: flex;
          gap: var(--space-3);
        }

        .stat {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .user-score {
          display: flex;
          flex-direction: column;
          align-items: end;
          text-align: right;
        }

        .score-value {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--text-primary);
        }

        .score-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .leaderboard-loading {
          padding: var(--space-6);
        }

        .loading-header {
          height: 120px;
          margin-bottom: var(--space-8);
          border-radius: var(--radius-2xl);
        }

        .loading-podium {
          height: 300px;
          margin-bottom: var(--space-8);
          border-radius: var(--radius-2xl);
        }

        .loading-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .skeleton-rank-item {
          height: 80px;
          background: var(--surface);
          border-radius: var(--radius-xl);
          animation: shimmer 1.5s infinite;
        }

        @media (max-width: 768px) {
          .leaderboard-header {
            flex-direction: column;
            gap: var(--space-4);
          }

          .leaderboard-controls {
            width: 100%;
            justify-content: space-between;
          }

          .user-rank-card {
            flex-direction: column;
            gap: var(--space-4);
            text-align: center;
          }

          .rank-stats {
            justify-content: center;
          }

          .podium {
            padding: var(--space-4);
          }

          .user-stats {
            flex-direction: column;
            gap: var(--space-1);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </motion.div>
  );
};

export default Leaderboard;