import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  User, 
  Settings, 
  Camera, 
  Edit3, 
  Save, 
  X,
  Calendar,
  Clock,
  Target,
  Award,
  BookOpen,
  TrendingUp,
  Globe,
  Moon,
  Sun
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { t, changeLanguage, currentLanguage, availableLanguages } = useLanguage();
  const { theme, updateTheme, ageGroup, updateAgeGroup } = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/users/1');
      const data = await response.json();
      
      if (data.success) {
        const profile = data.data || generateMockProfile();
        setUserProfile(profile);
        setEditForm(profile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      const mockProfile = generateMockProfile();
      setUserProfile(mockProfile);
      setEditForm(mockProfile);
    } finally {
      setLoading(false);
    }
  };

  const generateMockProfile = () => ({
    id: 1,
    name: 'Alex Student',
    email: 'alex.student@email.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=face',
    bio: 'Passionate about learning and technology. Always seeking new challenges in programming and software development.',
    joinDate: '2024-01-15',
    location: 'São Paulo, Brasil',
    level: 12,
    totalXP: 15240,
    coursesCompleted: 8,
    lessonsCompleted: 156,
    studyStreak: 7,
    totalStudyTime: 4320, // minutes
    badges: 12,
    achievements: 18,
    goals: [
      { id: 1, title: 'Completar 20 cursos', progress: 40, target: 20 },
      { id: 2, title: 'Alcançar nível 15', progress: 80, target: 15 },
      { id: 3, title: 'Estudar 100 horas', progress: 72, target: 100 }
    ],
    recentActivity: [
      { id: 1, type: 'lesson', title: 'React Hooks Avançados', date: '2024-01-20', xp: 85 },
      { id: 2, type: 'badge', title: 'Streak Warrior', date: '2024-01-19', xp: 200 },
      { id: 3, type: 'level', title: 'Nível 12 Alcançado', date: '2024-01-18', xp: 500 }
    ]
  });

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/users/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setUserProfile(editForm);
        setIsEditing(false);
        toast.success('Perfil atualizado com sucesso!');
      } else {
        toast.error('Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}min`;
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
      <div className="profile-loading">
        <div className="loading-header skeleton" />
        <div className="loading-content">
          <div className="skeleton-profile-card" />
          <div className="skeleton-stats-grid" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="profile-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Profile Header */}
      <motion.div className="profile-header" variants={itemVariants}>
        <div className="profile-banner">
          <div className="banner-content">
            <div className="profile-avatar-section">
              <div className="avatar-container">
                <img 
                  src={userProfile.avatar} 
                  alt={userProfile.name}
                  className="profile-avatar"
                />
                <button className="avatar-edit-btn">
                  <Camera size={16} />
                </button>
              </div>
              
              <div className="profile-info">
                {isEditing ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="edit-input name-input"
                      placeholder="Nome"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="edit-input bio-input"
                      placeholder="Bio"
                      rows={3}
                    />
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="edit-input location-input"
                      placeholder="Localização"
                    />
                  </div>
                ) : (
                  <div className="profile-details">
                    <h1 className="profile-name">{userProfile.name}</h1>
                    <p className="profile-bio">{userProfile.bio}</p>
                    <div className="profile-meta">
                      <span className="meta-item">
                        <Calendar size={14} />
                        Membro desde {new Date(userProfile.joinDate).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="meta-item">
                        <Globe size={14} />
                        {userProfile.location}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-actions">
              {isEditing ? (
                <div className="edit-actions">
                  <motion.button
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm(userProfile);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={18} />
                    Cancelar
                  </motion.button>
                  <motion.button
                    className="btn btn-primary"
                    onClick={handleSaveProfile}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Save size={18} />
                    Salvar
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit3 size={18} />
                  Editar Perfil
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div className="stats-overview" variants={itemVariants}>
        <div className="stat-card">
          <div className="stat-icon level">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{userProfile.level}</span>
            <span className="stat-label">Nível</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon xp">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{userProfile.totalXP.toLocaleString()}</span>
            <span className="stat-label">XP Total</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon courses">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{userProfile.coursesCompleted}</span>
            <span className="stat-label">Cursos Concluídos</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon time">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatStudyTime(userProfile.totalStudyTime)}</span>
            <span className="stat-label">Tempo de Estudo</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon badges">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{userProfile.badges}</span>
            <span className="stat-label">Badges</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="profile-grid">
        {/* Personal Goals */}
        <motion.div className="card goals-card" variants={itemVariants}>
          <div className="card-header">
            <h2 className="card-title">
              <Target size={20} />
              Metas Pessoais
            </h2>
          </div>
          
          <div className="goals-list">
            {userProfile.goals.map((goal) => (
              <div key={goal.id} className="goal-item">
                <div className="goal-info">
                  <span className="goal-title">{goal.title}</span>
                  <span className="goal-progress-text">
                    {Math.floor((goal.progress / 100) * goal.target)} / {goal.target}
                  </span>
                </div>
                <div className="goal-progress-container">
                  <div className="goal-progress-bar">
                    <div 
                      className="goal-progress-fill"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <span className="goal-percentage">{goal.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div className="card activity-card" variants={itemVariants}>
          <div className="card-header">
            <h2 className="card-title">Atividade Recente</h2>
          </div>
          
          <div className="activity-list">
            {userProfile.recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'lesson' && <BookOpen size={16} />}
                  {activity.type === 'badge' && <Award size={16} />}
                  {activity.type === 'level' && <TrendingUp size={16} />}
                </div>
                <div className="activity-content">
                  <span className="activity-title">{activity.title}</span>
                  <span className="activity-date">
                    {new Date(activity.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="activity-xp">+{activity.xp} XP</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div className="card settings-card" variants={itemVariants}>
          <div className="card-header">
            <h2 className="card-title">
              <Settings size={20} />
              Configurações
            </h2>
          </div>
          
          <div className="settings-list">
            {/* Language Setting */}
            <div className="setting-item">
              <div className="setting-info">
                <Globe size={16} />
                <span className="setting-label">Idioma</span>
              </div>
              <select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className="setting-select"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Setting */}
            <div className="setting-item">
              <div className="setting-info">
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                <span className="setting-label">Tema</span>
              </div>
              <div className="theme-toggle">
                <button
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => updateTheme('light')}
                >
                  <Sun size={14} />
                  Claro
                </button>
                <button
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => updateTheme('dark')}
                >
                  <Moon size={14} />
                  Escuro
                </button>
              </div>
            </div>

            {/* Age Group Setting */}
            <div className="setting-item">
              <div className="setting-info">
                <User size={16} />
                <span className="setting-label">Faixa Etária</span>
              </div>
              <div className="age-toggle">
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
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .profile-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-6);
        }

        .profile-header {
          margin-bottom: var(--space-8);
        }

        .profile-banner {
          background: var(--gradient-surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--surface-light);
          overflow: hidden;
        }

        .banner-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: var(--space-8);
        }

        .profile-avatar-section {
          display: flex;
          gap: var(--space-6);
          align-items: flex-start;
        }

        .avatar-container {
          position: relative;
        }

        .profile-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid var(--surface-light);
          transition: all var(--transition-normal);
        }

        .avatar-edit-btn {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          border: 2px solid var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .avatar-edit-btn:hover {
          background: var(--primary-light);
          transform: scale(1.1);
        }

        .profile-info {
          flex: 1;
        }

        .profile-details h1 {
          font-size: var(--text-3xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-3);
        }

        .profile-bio {
          font-size: var(--text-base);
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: var(--space-4);
          max-width: 500px;
        }

        .profile-meta {
          display: flex;
          gap: var(--space-4);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--text-muted);
        }

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          max-width: 500px;
        }

        .edit-input {
          padding: var(--space-3);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-lg);
          color: var(--text-primary);
          font-size: var(--text-base);
          transition: all var(--transition-fast);
        }

        .edit-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .name-input {
          font-size: var(--text-xl);
          font-weight: 600;
        }

        .bio-input {
          resize: vertical;
          min-height: 80px;
        }

        .edit-actions {
          display: flex;
          gap: var(--space-3);
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-8);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-5);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-xl);
          transition: all var(--transition-normal);
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          color: white;
        }

        .stat-icon.level { background: var(--gradient-primary); }
        .stat-icon.xp { background: var(--gradient-accent); }
        .stat-icon.courses { background: var(--success); }
        .stat-icon.time { background: var(--info); }
        .stat-icon.badges { background: var(--warning); }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--text-muted);
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
        }

        .settings-card {
          grid-column: span 1;
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

        .goal-title {
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
          background: var(--gradient-primary);
          border-radius: var(--radius-lg);
          transition: width 0.8s ease-out;
        }

        .goal-percentage {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-secondary);
          min-width: 40px;
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
          background: var(--surface-light);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
        }

        .activity-item:hover {
          background: var(--surface-lighter);
        }

        .activity-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
        }

        .activity-icon.lesson { background: rgba(16, 185, 129, 0.2); color: var(--success); }
        .activity-icon.badge { background: rgba(250, 204, 21, 0.2); color: var(--warning); }
        .activity-icon.level { background: rgba(79, 70, 229, 0.2); color: var(--primary); }

        .activity-content {
          flex: 1;
        }

        .activity-title {
          display: block;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .activity-date {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .activity-xp {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--primary);
        }

        .settings-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4);
          background: var(--surface-light);
          border-radius: var(--radius-lg);
        }

        .setting-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .setting-label {
          font-weight: 500;
          color: var(--text-primary);
        }

        .setting-select {
          padding: var(--space-2) var(--space-3);
          background: var(--surface);
          border: 1px solid var(--surface-lighter);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: var(--text-sm);
          cursor: pointer;
        }

        .setting-select:focus {
          outline: none;
          border-color: var(--primary);
        }

        .theme-toggle,
        .age-toggle {
          display: flex;
          gap: var(--space-2);
        }

        .theme-btn,
        .age-btn {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--surface-lighter);
          border-radius: var(--radius-md);
          background: var(--surface);
          color: var(--text-secondary);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .theme-btn:hover,
        .age-btn:hover {
          background: var(--surface-lighter);
          color: var(--text-primary);
        }

        .theme-btn.active,
        .age-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .profile-loading {
          padding: var(--space-6);
        }

        .loading-header {
          height: 200px;
          margin-bottom: var(--space-8);
          border-radius: var(--radius-2xl);
        }

        .loading-content {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-6);
        }

        .skeleton-profile-card,
        .skeleton-stats-grid {
          height: 300px;
          background: var(--surface);
          border-radius: var(--radius-xl);
          animation: shimmer 1.5s infinite;
        }

        @media (max-width: 1024px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
          
          .settings-card {
            grid-column: span 1;
          }
        }

        @media (max-width: 768px) {
          .banner-content {
            flex-direction: column;
            gap: var(--space-4);
          }

          .profile-avatar-section {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .stats-overview {
            grid-template-columns: repeat(2, 1fr);
          }

          .edit-form {
            max-width: none;
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

export default Profile;