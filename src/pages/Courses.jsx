import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Star, 
  Play, 
  CheckCircle,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const Courses = () => {
  const { t } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedFilter]);

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(course => {
        const progress = calculateProgress(course);
        if (selectedFilter === 'inProgress') return progress > 0 && progress < 100;
        if (selectedFilter === 'completed') return progress === 100;
        if (selectedFilter === 'notStarted') return progress === 0;
        return true;
      });
    }

    setFilteredCourses(filtered);
  };

  const calculateProgress = (course) => {
    if (!course.lessons) return 0;
    const completedLessons = course.lessons.filter(lesson => lesson.completed).length;
    return Math.round((completedLessons / course.lessons.length) * 100);
  };

  const getStatusInfo = (course) => {
    const progress = calculateProgress(course);
    if (progress === 0) {
      return { status: 'notStarted', text: 'Iniciar Curso', color: 'primary' };
    } else if (progress === 100) {
      return { status: 'completed', text: 'Concluído', color: 'success' };
    } else {
      return { status: 'inProgress', text: 'Continuar', color: 'accent' };
    }
  };

  const handleCourseAction = (course) => {
    const { status } = getStatusInfo(course);
    if (status === 'completed') {
      toast.success('Curso já concluído! Parabéns!');
    } else {
      toast.success(`${status === 'notStarted' ? 'Iniciando' : 'Continuando'} curso: ${course.title}`);
    }
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
      <div className="courses-loading">
        <div className="loading-header skeleton" />
        <div className="loading-filters skeleton" />
        <div className="loading-grid">
          {Array(6).fill().map((_, i) => (
            <div key={i} className="skeleton-course-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="courses-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="courses-header" variants={itemVariants}>
        <div className="header-content">
          <h1 className="page-title">{t('courses.title')}</h1>
          <p className="page-subtitle">
            Explore nossa biblioteca de cursos interativos e acelere seu aprendizado
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <BookOpen size={20} />
            <span>{courses.length} Cursos</span>
          </div>
          <div className="stat-item">
            <TrendingUp size={20} />
            <span>{courses.filter(c => calculateProgress(c) > 0).length} Em Progresso</span>
          </div>
          <div className="stat-item">
            <CheckCircle size={20} />
            <span>{courses.filter(c => calculateProgress(c) === 100).length} Concluídos</span>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div className="courses-controls" variants={itemVariants}>
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder={t('courses.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <Filter size={20} />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('courses.filterAll')}</option>
            <option value="notStarted">Não Iniciados</option>
            <option value="inProgress">{t('courses.filterInProgress')}</option>
            <option value="completed">{t('courses.filterCompleted')}</option>
          </select>
        </div>
      </motion.div>

      {/* Courses Grid */}
      <motion.div className="courses-grid" variants={itemVariants}>
        <AnimatePresence>
          {filteredCourses.map((course, index) => {
            const progress = calculateProgress(course);
            const statusInfo = getStatusInfo(course);
            
            return (
              <motion.div
                key={course.id}
                className="course-card"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Course Image */}
                <div className="course-image">
                  <img 
                    src={course.imageUrl || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=240&fit=crop`}
                    alt={course.title}
                    className="course-img"
                  />
                  <div className="course-overlay">
                    <div className="course-level">
                      <Star size={14} />
                      <span>{course.difficulty || 'Intermediário'}</span>
                    </div>
                    <div className="course-duration">
                      <Clock size={14} />
                      <span>{course.estimatedHours || 8}h</span>
                    </div>
                  </div>
                  {progress > 0 && (
                    <div className="progress-indicator">
                      <div 
                        className="progress-circle"
                        style={{
                          background: `conic-gradient(var(--primary) ${progress * 3.6}deg, var(--surface-light) 0deg)`
                        }}
                      >
                        <span>{progress}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <div className="course-content">
                  <div className="course-header">
                    <h3 className="course-title">{course.title}</h3>
                    <div className="course-category">
                      {course.category || 'Programação'}
                    </div>
                  </div>

                  <p className="course-description">
                    {course.description || 'Aprenda conceitos fundamentais e avançados com exercícios práticos e projetos reais.'}
                  </p>

                  <div className="course-stats">
                    <div className="stat">
                      <BookOpen size={16} />
                      <span>{course.lessons?.length || 12} lições</span>
                    </div>
                    <div className="stat">
                      <Users size={16} />
                      <span>{course.enrolledStudents || 234} estudantes</span>
                    </div>
                    <div className="stat">
                      <Award size={16} />
                      <span>{course.certificates ? 'Certificado' : 'Sem certificado'}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {progress > 0 && (
                    <div className="course-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="progress-text">{progress}% concluído</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <motion.button
                    className={`btn btn-${statusInfo.color} course-action-btn`}
                    onClick={() => handleCourseAction(course)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {statusInfo.status === 'completed' ? (
                      <CheckCircle size={18} />
                    ) : (
                      <Play size={18} />
                    )}
                    {statusInfo.text}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredCourses.length === 0 && !loading && (
        <motion.div 
          className="empty-state"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <BookOpen size={64} className="empty-icon" />
          <h3>Nenhum curso encontrado</h3>
          <p>Tente ajustar seus filtros ou termo de busca</p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSearchTerm('');
              setSelectedFilter('all');
            }}
          >
            Limpar Filtros
          </button>
        </motion.div>
      )}

      <style jsx>{`
        .courses-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-6);
        }

        .courses-header {
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

        .header-stats {
          display: flex;
          gap: var(--space-6);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-secondary);
          font-weight: 500;
        }

        .courses-controls {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-8);
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

        .filter-container {
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

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--space-6);
        }

        .course-card {
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-2xl);
          overflow: hidden;
          transition: all var(--transition-normal);
          position: relative;
        }

        .course-card:hover {
          box-shadow: var(--shadow-xl);
          border-color: var(--primary);
        }

        .course-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .course-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .course-card:hover .course-img {
          transform: scale(1.05);
        }

        .course-overlay {
          position: absolute;
          top: var(--space-4);
          left: var(--space-4);
          right: var(--space-4);
          display: flex;
          justify-content: space-between;
        }

        .course-level,
        .course-duration {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-1) var(--space-3);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border-radius: var(--radius-lg);
          font-size: var(--text-xs);
          font-weight: 500;
          backdrop-filter: blur(8px);
        }

        .progress-indicator {
          position: absolute;
          top: var(--space-4);
          right: var(--space-4);
        }

        .progress-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface);
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--primary);
          position: relative;
        }

        .progress-circle::before {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: var(--surface);
        }

        .progress-circle span {
          position: relative;
          z-index: 1;
        }

        .course-content {
          padding: var(--space-6);
        }

        .course-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-3);
        }

        .course-title {
          font-size: var(--text-xl);
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          flex: 1;
        }

        .course-category {
          padding: var(--space-1) var(--space-3);
          background: rgba(79, 70, 229, 0.1);
          color: var(--primary);
          border-radius: var(--radius-lg);
          font-size: var(--text-xs);
          font-weight: 500;
          margin-left: var(--space-3);
        }

        .course-description {
          color: var(--text-secondary);
          font-size: var(--text-sm);
          line-height: 1.5;
          margin-bottom: var(--space-4);
        }

        .course-stats {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          color: var(--text-muted);
          font-size: var(--text-xs);
        }

        .course-progress {
          margin-bottom: var(--space-4);
        }

        .progress-bar {
          width: 100%;
          height: 8px;
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
          position: relative;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: progressShine 2s infinite;
        }

        .progress-text {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .course-action-btn {
          width: 100%;
          justify-content: center;
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

        .courses-loading {
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
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--space-6);
        }

        .skeleton-course-card {
          height: 400px;
          background: var(--surface);
          border-radius: var(--radius-2xl);
          animation: shimmer 1.5s infinite;
        }

        @media (max-width: 768px) {
          .courses-header {
            flex-direction: column;
            gap: var(--space-4);
          }

          .header-stats {
            width: 100%;
            justify-content: space-between;
          }

          .courses-controls {
            flex-direction: column;
          }

          .search-container {
            max-width: none;
          }

          .courses-grid {
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

export default Courses;