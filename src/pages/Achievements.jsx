import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Trophy, 
  Medal, 
  Star, 
  Crown, 
  Zap, 
  Target, 
  BookOpen,
  Flame,
  Filter,
  Search,
  Lock,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Achievements = () => {
  const { t } = useLanguage();
  const [achievements, setAchievements] = useState([]);
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  useEffect(() => {
    filterAchievements();
  }, [achievements, selectedCategory, selectedRarity, searchTerm]);

  const loadAchievements = async () => {
    try {
      const response = await fetch('/api/gamification/dashboard/1');
      const data = await response.json();
      
      if (data.success) {
        const userBadges = data.data.badges || [];
        const mockAchievements = generateMockAchievements(userBadges);
        setAchievements(mockAchievements);
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
      toast.error('Erro ao carregar conquistas');
    } finally {
      setLoading(false);
    }
  };

  const generateMockAchievements = (userBadges) => {
    const baseAchievements = [
      {
        id: 1,
        title: 'Primeira Lição',
        description: 'Complete sua primeira lição no CodyVerse',
        category: 'learning',
        rarity: 'common',
        icon: BookOpen,
        unlocked: true,
        unlockedAt: '2024-01-15',
        xpReward: 50,
        requirements: 'Completar 1 lição'
      },
      {
        id: 2,
        title: 'Streak Warrior',
        description: 'Mantenha uma sequência de 7 dias consecutivos',
        category: 'streak',
        rarity: 'rare',
        icon: Flame,
        unlocked: true,
        unlockedAt: '2024-01-22',
        xpReward: 200,
        requirements: 'Estudar por 7 dias consecutivos'
      },
      {
        id: 3,
        title: 'Explorador de Conhecimento',
        description: 'Complete 5 cursos diferentes',
        category: 'learning',
        rarity: 'epic',
        icon: Trophy,
        unlocked: false,
        progress: 60,
        xpReward: 500,
        requirements: 'Completar 5 cursos (3/5)'
      },
      {
        id: 4,
        title: 'Mestre da Velocidade',
        description: 'Complete uma lição em menos de 5 minutos',
        category: 'performance',
        rarity: 'uncommon',
        icon: Zap,
        unlocked: true,
        unlockedAt: '2024-02-01',
        xpReward: 100,
        requirements: 'Completar lição em < 5 minutos'
      },
      {
        id: 5,
        title: 'Colecionador de XP',
        description: 'Acumule 10.000 pontos de experiência',
        category: 'progression',
        rarity: 'rare',
        icon: Star,
        unlocked: false,
        progress: 23,
        xpReward: 300,
        requirements: 'Acumular 10.000 XP (2.340/10.000)'
      },
      {
        id: 6,
        title: 'Perfeccionista',
        description: 'Obtenha nota máxima em 10 lições',
        category: 'performance',
        rarity: 'epic',
        icon: Target,
        unlocked: false,
        progress: 70,
        xpReward: 400,
        requirements: 'Nota máxima em 10 lições (7/10)'
      },
      {
        id: 7,
        title: 'Lenda do CodyVerse',
        description: 'Alcance o nível 50 e complete todos os cursos',
        category: 'progression',
        rarity: 'legendary',
        icon: Crown,
        unlocked: false,
        progress: 24,
        xpReward: 1000,
        requirements: 'Nível 50 + todos os cursos (Nível 12/50)'
      },
      {
        id: 8,
        title: 'Maratonista',
        description: 'Estude por 5 horas em um único dia',
        category: 'dedication',
        rarity: 'rare',
        icon: Medal,
        unlocked: false,
        progress: 0,
        xpReward: 250,
        requirements: 'Estudar 5h em 1 dia'
      }
    ];

    return baseAchievements;
  };

  const filterAchievements = () => {
    let filtered = achievements;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(achievement => achievement.category === selectedCategory);
    }

    if (selectedRarity !== 'all') {
      filtered = filtered.filter(achievement => achievement.rarity === selectedRarity);
    }

    if (searchTerm) {
      filtered = filtered.filter(achievement =>
        achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAchievements(filtered);
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#9CA3AF',
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityLabel = (rarity) => {
    const labels = {
      common: 'Comum',
      uncommon: 'Incomum',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Lendário'
    };
    return labels[rarity] || 'Comum';
  };

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'learning', label: 'Aprendizado' },
    { value: 'streak', label: 'Sequência' },
    { value: 'performance', label: 'Performance' },
    { value: 'progression', label: 'Progressão' },
    { value: 'dedication', label: 'Dedicação' }
  ];

  const rarities = [
    { value: 'all', label: 'Todas' },
    { value: 'common', label: 'Comum' },
    { value: 'uncommon', label: 'Incomum' },
    { value: 'rare', label: 'Raro' },
    { value: 'epic', label: 'Épico' },
    { value: 'legendary', label: 'Lendário' }
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
      <div className="achievements-loading">
        <div className="loading-header skeleton" />
        <div className="loading-filters skeleton" />
        <div className="loading-grid">
          {Array(8).fill().map((_, i) => (
            <div key={i} className="skeleton-achievement-card" />
          ))}
        </div>
      </div>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <motion.div 
      className="achievements-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="achievements-header" variants={itemVariants}>
        <div className="header-content">
          <h1 className="page-title">{t('achievements.title')}</h1>
          <p className="page-subtitle">
            Mostre suas conquistas e desbloqueie novos desafios
          </p>
        </div>
        <div className="achievements-stats">
          <div className="stat-card">
            <Trophy className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{unlockedCount}/{totalCount}</span>
              <span className="stat-label">Desbloqueadas</span>
            </div>
          </div>
          <div className="stat-card">
            <Star className="stat-icon" />
            <div className="stat-info">
              <span className="stat-value">{Math.round((unlockedCount / totalCount) * 100)}%</span>
              <span className="stat-label">Completado</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div className="achievements-controls" variants={itemVariants}>
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Buscar conquistas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-container">
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <Medal size={16} />
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="filter-select"
            >
              {rarities.map(rarity => (
                <option key={rarity.value} value={rarity.value}>{rarity.label}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Achievements Grid */}
      <motion.div className="achievements-grid" variants={itemVariants}>
        <AnimatePresence>
          {filteredAchievements.map((achievement, index) => {
            const Icon = achievement.icon;
            const rarityColor = getRarityColor(achievement.rarity);
            
            return (
              <motion.div
                key={achievement.id}
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                style={{ '--rarity-color': rarityColor }}
              >
                {/* Achievement Icon */}
                <div className="achievement-icon-container">
                  <div className="achievement-icon">
                    <Icon size={32} />
                  </div>
                  {achievement.unlocked ? (
                    <div className="unlock-indicator">
                      <CheckCircle size={20} />
                    </div>
                  ) : (
                    <div className="lock-indicator">
                      <Lock size={16} />
                    </div>
                  )}
                </div>

                {/* Achievement Content */}
                <div className="achievement-content">
                  <div className="achievement-header">
                    <h3 className="achievement-title">{achievement.title}</h3>
                    <div 
                      className="rarity-badge"
                      style={{ backgroundColor: rarityColor }}
                    >
                      {getRarityLabel(achievement.rarity)}
                    </div>
                  </div>

                  <p className="achievement-description">
                    {achievement.description}
                  </p>

                  <div className="achievement-requirements">
                    <span className="requirements-label">Requisitos:</span>
                    <span className="requirements-text">{achievement.requirements}</span>
                  </div>

                  {/* Progress Bar for locked achievements */}
                  {!achievement.unlocked && achievement.progress !== undefined && (
                    <div className="achievement-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{achievement.progress}%</span>
                    </div>
                  )}

                  {/* Unlock Date or XP Reward */}
                  <div className="achievement-footer">
                    {achievement.unlocked ? (
                      <div className="unlock-date">
                        <CheckCircle size={14} />
                        <span>Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    ) : (
                      <div className="xp-reward">
                        <Zap size={14} />
                        <span>+{achievement.xpReward} XP</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rarity Glow Effect */}
                {achievement.unlocked && (
                  <div 
                    className="rarity-glow"
                    style={{ boxShadow: `0 0 20px ${rarityColor}40` }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && !loading && (
        <motion.div 
          className="empty-state"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <Trophy size={64} className="empty-icon" />
          <h3>Nenhuma conquista encontrada</h3>
          <p>Tente ajustar seus filtros ou termo de busca</p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedRarity('all');
            }}
          >
            Limpar Filtros
          </button>
        </motion.div>
      )}

      <style jsx>{`
        .achievements-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-6);
        }

        .achievements-header {
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

        .achievements-stats {
          display: flex;
          gap: var(--space-6);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-lg);
        }

        .stat-icon {
          color: var(--accent);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .achievements-controls {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-8);
          align-items: center;
        }

        .search-container {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: var(--space-4);
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: var(--space-3) var(--space-4) var(--space-3) var(--space-10);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-lg);
          color: var(--text-primary);
          font-size: var(--text-base);
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .filters-container {
          display: flex;
          gap: var(--space-4);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-lg);
          color: var(--text-secondary);
        }

        .filter-select {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: var(--text-base);
          cursor: pointer;
        }

        .filter-select:focus {
          outline: none;
        }

        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: var(--space-6);
        }

        .achievement-card {
          display: flex;
          gap: var(--space-4);
          padding: var(--space-6);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-2xl);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .achievement-card.locked {
          opacity: 0.7;
          filter: grayscale(50%);
        }

        .achievement-card:hover {
          box-shadow: var(--shadow-xl);
          border-color: var(--rarity-color);
        }

        .achievement-card.unlocked::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--rarity-color);
        }

        .achievement-icon-container {
          position: relative;
          flex-shrink: 0;
        }

        .achievement-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--surface-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          transition: all var(--transition-normal);
        }

        .achievement-card.unlocked .achievement-icon {
          background: var(--rarity-color);
          color: white;
          box-shadow: 0 0 20px rgba(var(--rarity-color), 0.3);
        }

        .unlock-indicator {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 28px;
          height: 28px;
          background: var(--success);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--surface);
        }

        .lock-indicator {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 24px;
          height: 24px;
          background: var(--surface-light);
          color: var(--text-muted);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--surface);
        }

        .achievement-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .achievement-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-3);
        }

        .achievement-title {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          flex: 1;
        }

        .rarity-badge {
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-lg);
          font-size: var(--text-xs);
          font-weight: 600;
          color: white;
          margin-left: var(--space-3);
        }

        .achievement-description {
          color: var(--text-secondary);
          font-size: var(--text-sm);
          line-height: 1.5;
          margin-bottom: var(--space-4);
        }

        .achievement-requirements {
          margin-bottom: var(--space-4);
        }

        .requirements-label {
          display: block;
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: var(--space-1);
        }

        .requirements-text {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .achievement-progress {
          margin-bottom: var(--space-4);
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: var(--surface-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: var(--space-2);
        }

        .progress-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: var(--radius-lg);
          transition: width 0.8s ease-out;
        }

        .progress-text {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .achievement-footer {
          margin-top: auto;
        }

        .unlock-date,
        .xp-reward {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
        }

        .unlock-date {
          color: var(--success);
        }

        .xp-reward {
          color: var(--accent);
        }

        .rarity-glow {
          position: absolute;
          inset: -2px;
          border-radius: var(--radius-2xl);
          pointer-events: none;
          transition: box-shadow var(--transition-normal);
        }

        .empty-state {
          text-align: center;
          padding: var(--space-16);
          color: var(--text-secondary);
        }

        .empty-icon {
          color: var(--text-muted);
          margin-bottom: var(--space-4);
        }

        .empty-state h3 {
          margin-bottom: var(--space-2);
        }

        .empty-state p {
          margin-bottom: var(--space-6);
        }

        .achievements-loading {
          padding: var(--space-6);
        }

        .loading-header {
          height: 120px;
          margin-bottom: var(--space-8);
          border-radius: var(--radius-2xl);
        }

        .loading-filters {
          height: 48px;
          margin-bottom: var(--space-8);
          border-radius: var(--radius-lg);
        }

        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: var(--space-6);
        }

        .skeleton-achievement-card {
          height: 180px;
          background: var(--surface);
          border-radius: var(--radius-2xl);
          animation: shimmer 1.5s infinite;
        }

        @media (max-width: 768px) {
          .achievements-header {
            flex-direction: column;
            gap: var(--space-4);
          }

          .achievements-stats {
            width: 100%;
            justify-content: space-around;
          }

          .achievements-controls {
            flex-direction: column;
          }

          .filters-container {
            width: 100%;
            justify-content: space-between;
          }

          .achievements-grid {
            grid-template-columns: 1fr;
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

export default Achievements;