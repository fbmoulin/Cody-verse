import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  BookOpen, 
  Zap,
  Calendar,
  BarChart3,
  PieChart,
  Award,
  Flame
} from 'lucide-react';
import toast from 'react-hot-toast';

const Progress = () => {
  const { t } = useLanguage();
  const [progressData, setProgressData] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [timeRange]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      
      const [dashboardResponse, progressResponse] = await Promise.all([
        fetch('/api/gamification/dashboard/1'),
        fetch('/api/progress/user/1')
      ]);

      const dashboardData = await dashboardResponse.json();
      const progressDataResponse = await progressResponse.json();

      if (dashboardData.success) {
        const combinedData = {
          ...dashboardData.data,
          userProgress: progressDataResponse.success ? progressDataResponse.data : {}
        };
        setProgressData(combinedData);
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
      toast.error('Erro ao carregar dados de progresso');
    } finally {
      setLoading(false);
    }
  };

  const getWeeklyGoalProgress = () => {
    return [
      { name: 'Lições', completed: 12, target: 15, percentage: 80 },
      { name: 'Tempo de Estudo', completed: 180, target: 240, percentage: 75, unit: 'min' },
      { name: 'XP Ganho', completed: 850, target: 1000, percentage: 85 },
      { name: 'Cursos Iniciados', completed: 2, target: 3, percentage: 67 }
    ];
  };

  const getSkillsProgress = () => {
    return [
      { skill: 'JavaScript', level: 'Avançado', progress: 85, color: '#F59E0B' },
      { skill: 'React', level: 'Intermediário', progress: 65, color: '#3B82F6' },
      { skill: 'Node.js', level: 'Intermediário', progress: 70, color: '#10B981' },
      { skill: 'CSS', level: 'Avançado', progress: 90, color: '#8B5CF6' },
      { skill: 'Python', level: 'Iniciante', progress: 35, color: '#EF4444' }
    ];
  };

  const getStudyTimeData = () => {
    return {
      thisWeek: [
        { day: 'Seg', minutes: 45 },
        { day: 'Ter', minutes: 30 },
        { day: 'Qua', minutes: 60 },
        { day: 'Qui', minutes: 25 },
        { day: 'Sex', minutes: 40 },
        { day: 'Sáb', minutes: 35 },
        { day: 'Dom', minutes: 20 }
      ],
      total: 255,
      average: 36,
      streak: 7
    };
  };

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
      <div className="progress-loading">
        <div className="loading-header skeleton" />
        <div className="loading-grid">
          {Array(6).fill().map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  const weeklyGoals = getWeeklyGoalProgress();
  const skillsData = getSkillsProgress();
  const studyTimeData = getStudyTimeData();

  return (
    <motion.div 
      className="progress-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="progress-header" variants={itemVariants}>
        <div className="header-content">
          <h1 className="page-title">{t('progress.title')}</h1>
          <p className="page-subtitle">
            Acompanhe sua evolução e veja suas conquistas em tempo real
          </p>
        </div>
        <div className="time-range-selector">
          <button 
            className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Esta Semana
          </button>
          <button 
            className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Este Mês
          </button>
          <button 
            className={`time-btn ${timeRange === 'year' ? 'active' : ''}`}
            onClick={() => setTimeRange('year')}
          >
            Este Ano
          </button>
        </div>
      </motion.div>

      {/* Overall Stats */}
      <motion.div className="overall-stats" variants={itemVariants}>
        <div className="stat-card level-stat">
          <div className="stat-icon">
            <TrendingUp size={28} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{progressData?.level || 12}</span>
            <span className="stat-label">Nível Atual</span>
            <div className="level-progress">
              <div className="level-bar">
                <div 
                  className="level-fill"
                  style={{ width: `${((progressData?.currentLevelXP || 2340) / (progressData?.nextLevelXP || 3500)) * 100}%` }}
                />
              </div>
              <span className="level-text">
                {progressData?.currentLevelXP || 2340} / {progressData?.nextLevelXP || 3500} XP
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card xp-stat">
          <div className="stat-icon">
            <Zap size={28} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{progressData?.totalXP || 15240}</span>
            <span className="stat-label">XP Total</span>
            <span className="stat-subtitle">+850 esta semana</span>
          </div>
        </div>

        <div className="stat-card time-stat">
          <div className="stat-icon">
            <Clock size={28} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{studyTimeData.total}min</span>
            <span className="stat-label">Tempo de Estudo</span>
            <span className="stat-subtitle">Esta semana</span>
          </div>
        </div>

        <div className="stat-card streak-stat">
          <div className="stat-icon">
            <Flame size={28} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{progressData?.streaks?.daily || 7}</span>
            <span className="stat-label">Sequência Diária</span>
            <span className="stat-subtitle">dias consecutivos</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="progress-grid">
        {/* Weekly Goals */}
        <motion.div className="card weekly-goals-card" variants={itemVariants}>
          <div className="card-header">
            <h2 className="card-title">
              <Target size={20} />
              Metas Semanais
            </h2>
            <span className="goals-completion">3/4 Completas</span>
          </div>
          
          <div className="goals-list">
            {weeklyGoals.map((goal, index) => (
              <div key={index} className="goal-item">
                <div className="goal-info">
                  <span className="goal-name">{goal.name}</span>
                  <span className="goal-progress-text">
                    {goal.completed} / {goal.target} {goal.unit || ''}
                  </span>
                </div>
                <div className="goal-progress-container">
                  <div className="goal-progress-bar">
                    <div 
                      className="goal-progress-fill"
                      style={{ 
                        width: `${goal.percentage}%`,
                        backgroundColor: goal.percentage >= 100 ? 'var(--success)' : 'var(--primary)'
                      }}
                    />
                  </div>
                  <span className="goal-percentage">{goal.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Study Time Chart */}
        <motion.div className="card study-time-card" variants={itemVariants}>
          <div className="card-header">
            <h2 className="card-title">
              <BarChart3 size={20} />
              Tempo de Estudo Diário
            </h2>
            <div className="chart-stats">
              <span>Média: {studyTimeData.average}min/dia</span>
            </div>
          </div>
          
          <div className="chart-container">
            <div className="chart">
              {studyTimeData.thisWeek.map((day, index) => (
                <div key={index} className="chart-bar-container">
                  <div 
                    className="chart-bar"
                    style={{ 
                      height: `${(day.minutes / 60) * 100}%`,
                      backgroundColor: day.minutes >= studyTimeData.average ? 'var(--success)' : 'var(--primary)'
                    }}
                  />
                  <span className="chart-label">{day.day}</span>
                  <span className="chart-value">{day.minutes}min</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Skills Progress */}
        <motion.div className="card skills-card" variants={itemVariants}>
          <div className="card-header">
            <h2 className="card-title">
              <PieChart size={20} />
              Progresso das Habilidades
            </h2>
          </div>
          
          <div className="skills-list">
            {skillsData.map((skill, index) => (
              <div key={index} className="skill-item">
                <div className="skill-header">
                  <div className="skill-info">
                    <span className="skill-name">{skill.skill}</span>
                    <span className="skill-level">{skill.level}</span>
                  </div>
                  <span className="skill-percentage">{skill.progress}%</span>
                </div>
                <div className="skill-progress-bar">
                  <div 
                    className="skill-progress-fill"
                    style={{ 
                      width: `${skill.progress}%`,
                      backgroundColor: skill.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Achievements */}
        <motion.div className="card achievements-card" variants={itemVariants}>
          <div className="card-header">
            <h2 className="card-title">
              <Award size={20} />
              Conquistas Recentes
            </h2>
          </div>
          
          <div className="achievements-list">
            <div className="achievement-item">
              <div className="achievement-icon">
                <Flame size={20} />
              </div>
              <div className="achievement-content">
                <span className="achievement-title">Streak Warrior</span>
                <span className="achievement-date">há 1 dia</span>
              </div>
              <div className="achievement-xp">+200 XP</div>
            </div>

            <div className="achievement-item">
              <div className="achievement-icon">
                <BookOpen size={20} />
              </div>
              <div className="achievement-content">
                <span className="achievement-title">Devorador de Livros</span>
                <span className="achievement-date">há 3 dias</span>
              </div>
              <div className="achievement-xp">+150 XP</div>
            </div>

            <div className="achievement-item">
              <div className="achievement-icon">
                <TrendingUp size={20} />
              </div>
              <div className="achievement-content">
                <span className="achievement-title">Subida de Nível</span>
                <span className="achievement-date">há 5 dias</span>
              </div>
              <div className="achievement-xp">+500 XP</div>
            </div>
          </div>
        </motion.div>

        {/* Calendar Heatmap */}
        <motion.div className="card calendar-card" variants={itemVariants}>
          <div className="card-header">
            <h2 className="card-title">
              <Calendar size={20} />
              Atividade dos Últimos 30 Dias
            </h2>
          </div>
          
          <div className="calendar-heatmap">
            {Array(30).fill().map((_, index) => {
              const intensity = Math.random();
              return (
                <div 
                  key={index}
                  className="calendar-day"
                  style={{ 
                    backgroundColor: intensity > 0.7 ? 'var(--success)' :
                                   intensity > 0.4 ? 'var(--primary)' :
                                   intensity > 0.2 ? 'var(--surface-light)' : 'var(--surface)'
                  }}
                  title={`Dia ${index + 1}: ${Math.round(intensity * 100)}% atividade`}
                />
              );
            })}
          </div>
          <div className="calendar-legend">
            <span>Menos</span>
            <div className="legend-colors">
              <div className="legend-color" style={{ backgroundColor: 'var(--surface)' }} />
              <div className="legend-color" style={{ backgroundColor: 'var(--surface-light)' }} />
              <div className="legend-color" style={{ backgroundColor: 'var(--primary)' }} />
              <div className="legend-color" style={{ backgroundColor: 'var(--success)' }} />
            </div>
            <span>Mais</span>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .progress-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-6);
        }

        .progress-header {
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

        .time-range-selector {
          display: flex;
          gap: var(--space-2);
          background: var(--surface);
          padding: var(--space-1);
          border-radius: var(--radius-lg);
          border: 1px solid var(--surface-light);
        }

        .time-btn {
          padding: var(--space-2) var(--space-4);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: var(--text-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .time-btn.active {
          background: var(--primary);
          color: white;
        }

        .time-btn:hover:not(.active) {
          background: var(--surface-light);
          color: var(--text-primary);
        }

        .overall-stats {
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

        .level-stat::before { background: var(--gradient-primary); }
        .xp-stat::before { background: var(--gradient-accent); }
        .time-stat::before { background: var(--success); }
        .streak-stat::before { background: linear-gradient(135deg, #F59E0B, #EF4444); }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: var(--radius-xl);
          background: rgba(79, 70, 229, 0.1);
          color: var(--primary);
        }

        .xp-stat .stat-icon {
          background: var(--gradient-accent);
          color: var(--surface);
        }

        .time-stat .stat-icon {
          background: rgba(16, 185, 129, 0.2);
          color: var(--success);
        }

        .streak-stat .stat-icon {
          background: linear-gradient(135deg, #F59E0B, #EF4444);
          color: white;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          display: block;
          font-size: var(--text-3xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .stat-label {
          display: block;
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin-bottom: var(--space-2);
        }

        .stat-subtitle {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .level-progress {
          margin-top: var(--space-2);
        }

        .level-bar {
          width: 100%;
          height: 8px;
          background: var(--surface-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: var(--space-1);
        }

        .level-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: var(--radius-lg);
          transition: width 1s ease-out;
        }

        .level-text {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .progress-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-6);
        }

        .weekly-goals-card {
          grid-column: span 1;
        }

        .study-time-card {
          grid-column: span 1;
        }

        .skills-card {
          grid-column: span 1;
        }

        .achievements-card {
          grid-column: span 1;
        }

        .calendar-card {
          grid-column: span 2;
        }

        .goals-completion {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--success);
          background: rgba(16, 185, 129, 0.1);
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-lg);
        }

        .goals-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .goal-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .goal-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .goal-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .goal-progress-text {
          font-size: var(--text-sm);
          color: var(--text-muted);
        }

        .goal-progress-container {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .goal-progress-bar {
          flex: 1;
          height: 8px;
          background: var(--surface-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .goal-progress-fill {
          height: 100%;
          border-radius: var(--radius-lg);
          transition: width 0.8s ease-out;
        }

        .goal-percentage {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-secondary);
          min-width: 40px;
        }

        .chart-stats {
          font-size: var(--text-sm);
          color: var(--text-muted);
        }

        .chart-container {
          height: 200px;
          display: flex;
          align-items: end;
          padding: var(--space-4) 0;
        }

        .chart {
          display: flex;
          align-items: end;
          gap: var(--space-2);
          width: 100%;
          height: 100%;
        }

        .chart-bar-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          position: relative;
        }

        .chart-bar {
          width: 100%;
          max-width: 32px;
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          transition: all var(--transition-normal);
          margin-bottom: var(--space-2);
        }

        .chart-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin-bottom: var(--space-1);
        }

        .chart-value {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--text-secondary);
        }

        .skills-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .skill-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .skill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .skill-info {
          display: flex;
          flex-direction: column;
        }

        .skill-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .skill-level {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .skill-percentage {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-secondary);
        }

        .skill-progress-bar {
          height: 8px;
          background: var(--surface-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .skill-progress-fill {
          height: 100%;
          border-radius: var(--radius-lg);
          transition: width 0.8s ease-out;
        }

        .achievements-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .achievement-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--surface-light);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }

        .achievement-item:hover {
          background: var(--surface-lighter);
        }

        .achievement-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: var(--gradient-accent);
          color: var(--surface);
        }

        .achievement-content {
          flex: 1;
        }

        .achievement-title {
          display: block;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .achievement-date {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .achievement-xp {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--accent);
        }

        .calendar-heatmap {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: var(--space-1);
          margin-bottom: var(--space-4);
        }

        .calendar-day {
          aspect-ratio: 1;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .calendar-day:hover {
          transform: scale(1.1);
        }

        .calendar-legend {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .legend-colors {
          display: flex;
          gap: var(--space-1);
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: var(--radius-sm);
        }

        .progress-loading {
          padding: var(--space-6);
        }

        .loading-header {
          height: 120px;
          margin-bottom: var(--space-8);
          border-radius: var(--radius-2xl);
        }

        .loading-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-6);
        }

        .skeleton-card {
          height: 300px;
          background: var(--surface);
          border-radius: var(--radius-xl);
          animation: shimmer 1.5s infinite;
        }

        @media (max-width: 1024px) {
          .progress-grid {
            grid-template-columns: 1fr;
          }
          
          .calendar-card {
            grid-column: span 1;
          }
        }

        @media (max-width: 768px) {
          .progress-header {
            flex-direction: column;
            gap: var(--space-4);
          }

          .time-range-selector {
            width: 100%;
          }

          .overall-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </motion.div>
  );
};

export default Progress;