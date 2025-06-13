import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, Filter, Play, CheckCircle, Clock, BookOpen, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const Courses = () => {
  const { t } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.data || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'inProgress' && course.progress > 0 && course.progress < 100) ||
      (filterStatus === 'completed' && course.progress === 100) ||
      (filterStatus === 'notStarted' && course.progress === 0);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="courses-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="page-title">{t('courses.title')}</h1>
        
        <div className="controls">
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder={t('courses.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('courses.filterAll')}</option>
            <option value="inProgress">{t('courses.filterInProgress')}</option>
            <option value="completed">{t('courses.filterCompleted')}</option>
            <option value="notStarted">Não Iniciados</option>
          </select>
        </div>
      </motion.div>

      {loading ? (
        <CoursesGridSkeleton />
      ) : (
        <motion.div
          className="courses-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filteredCourses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </motion.div>
      )}

      <style jsx>{`
        .courses-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--space-6);
        }

        .page-header {
          margin-bottom: var(--space-8);
        }

        .page-title {
          font-size: var(--text-3xl);
          font-weight: 700;
          margin-bottom: var(--space-6);
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .controls {
          display: flex;
          gap: var(--space-4);
          align-items: center;
          flex-wrap: wrap;
        }

        .search-container {
          position: relative;
          flex: 1;
          min-width: 300px;
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
          padding: var(--space-3) var(--space-4) var(--space-3) var(--space-12);
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

        .filter-select {
          padding: var(--space-3) var(--space-4);
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-lg);
          color: var(--text-primary);
          font-size: var(--text-base);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--primary);
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--space-6);
        }

        @media (max-width: 768px) {
          .controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-container {
            min-width: auto;
          }

          .courses-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

const CourseCard = ({ course, index }) => {
  const progress = Math.floor(Math.random() * 100);
  const lessonsCompleted = Math.floor((progress / 100) * (course.lessons?.length || 10));
  const totalLessons = course.lessons?.length || 10;

  const getStatusInfo = () => {
    if (progress === 0) return { status: 'start', text: 'Iniciar Curso', icon: Play };
    if (progress === 100) return { status: 'completed', text: 'Concluído', icon: CheckCircle };
    return { status: 'continue', text: 'Continuar', icon: BookOpen };
  };

  const { status, text, icon: StatusIcon } = getStatusInfo();

  return (
    <motion.div
      className="course-card card-interactive"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6 }}
    >
      <div className="course-image">
        <img 
          src={`https://images.unsplash.com/photo-${1550439062}-6e7c42a15e31?w=400&h=200&fit=crop`}
          alt={course.title}
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=${course.title.charAt(0)}`;
          }}
        />
        <div className="course-overlay">
          <div className="difficulty-badge">
            {course.difficulty || 'Intermediário'}
          </div>
        </div>
      </div>

      <div className="course-content">
        <h3 className="course-title">{course.title}</h3>
        <p className="course-description">
          {course.description || `Aprenda ${course.title} de forma prática e divertida com exercícios interativos.`}
        </p>

        <div className="course-stats">
          <div className="stat-item">
            <BookOpen size={16} />
            <span>{totalLessons} lições</span>
          </div>
          <div className="stat-item">
            <Clock size={16} />
            <span>{Math.floor(Math.random() * 8) + 2}h</span>
          </div>
          <div className="stat-item">
            <Star size={16} />
            <span>4.{Math.floor(Math.random() * 5) + 5}</span>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-text">
              {lessonsCompleted}/{totalLessons} lições
            </span>
            <span className="progress-percentage">{progress}%</span>
          </div>
          <div className="progress-container">
            <div 
              className="progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <motion.button
          className={`btn ${status === 'completed' ? 'btn-secondary' : 'btn-primary'} course-action`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <StatusIcon size={16} />
          {text}
        </motion.button>
      </div>

      <style jsx>{`
        .course-card {
          background: var(--surface);
          border: 1px solid var(--surface-light);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: all var(--transition-normal);
        }

        .course-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .course-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .course-card:hover .course-image img {
          transform: scale(1.05);
        }

        .course-overlay {
          position: absolute;
          top: var(--space-4);
          right: var(--space-4);
        }

        .difficulty-badge {
          padding: var(--space-2) var(--space-3);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: var(--text-xs);
          font-weight: 500;
          border-radius: var(--radius-lg);
          backdrop-filter: blur(4px);
        }

        .course-content {
          padding: var(--space-6);
        }

        .course-title {
          font-size: var(--text-xl);
          font-weight: 600;
          margin-bottom: var(--space-3);
          color: var(--text-primary);
          line-height: 1.3;
        }

        .course-description {
          color: var(--text-secondary);
          font-size: var(--text-sm);
          line-height: 1.5;
          margin-bottom: var(--space-4);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .course-stats {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-5);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--text-muted);
        }

        .progress-section {
          margin-bottom: var(--space-5);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .progress-text {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .progress-percentage {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--primary);
        }

        .progress-container {
          height: 8px;
          background: var(--surface-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: var(--radius-lg);
          transition: width 1s ease-out;
        }

        .course-action {
          width: 100%;
          justify-content: center;
        }
      `}</style>
    </motion.div>
  );
};

const CoursesGridSkeleton = () => (
  <div className="courses-grid">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-xl)' }} />
    ))}
  </div>
);

export default Courses;