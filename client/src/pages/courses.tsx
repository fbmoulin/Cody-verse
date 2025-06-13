import { useState, useEffect } from 'react';
import { BookOpen, Clock, Star, Users, Play, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  duration: string;
  lessons: number;
  students: number;
  rating: number;
  thumbnail: string;
  instructor: string;
  progress: number;
  isEnrolled: boolean;
  isCompleted: boolean;
  tags: string[];
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        // Fallback to sample data if API is not available
        setCourses(getSampleCourses());
      }
    } catch (error) {
      setCourses(getSampleCourses());
    } finally {
      setLoading(false);
    }
  };

  const getSampleCourses = (): Course[] => [
    {
      id: '1',
      title: 'Fundamentos de Inteligência Artificial',
      description: 'Aprenda os conceitos básicos de IA, machine learning e suas aplicações práticas.',
      category: 'Inteligência Artificial',
      difficulty: 'Iniciante',
      duration: '8 semanas',
      lessons: 24,
      students: 1250,
      rating: 4.8,
      thumbnail: '/api/placeholder/400/200',
      instructor: 'Dr. Ana Silva',
      progress: 35,
      isEnrolled: true,
      isCompleted: false,
      tags: ['IA', 'Machine Learning', 'Python']
    },
    {
      id: '2',
      title: 'Desenvolvimento Web Full Stack',
      description: 'Crie aplicações web completas usando React, Node.js e bancos de dados.',
      category: 'Desenvolvimento Web',
      difficulty: 'Intermediário',
      duration: '12 semanas',
      lessons: 36,
      students: 890,
      rating: 4.9,
      thumbnail: '/api/placeholder/400/200',
      instructor: 'Carlos Mendes',
      progress: 0,
      isEnrolled: false,
      isCompleted: false,
      tags: ['React', 'Node.js', 'JavaScript']
    },
    {
      id: '3',
      title: 'Ciência de Dados com Python',
      description: 'Analise dados, crie visualizações e construa modelos preditivos.',
      category: 'Ciência de Dados',
      difficulty: 'Intermediário',
      duration: '10 semanas',
      lessons: 30,
      students: 675,
      rating: 4.7,
      thumbnail: '/api/placeholder/400/200',
      instructor: 'Prof. Maria Santos',
      progress: 100,
      isEnrolled: true,
      isCompleted: true,
      tags: ['Python', 'Pandas', 'Matplotlib']
    },
    {
      id: '4',
      title: 'Segurança Cibernética',
      description: 'Proteja sistemas e dados contra ameaças digitais.',
      category: 'Segurança',
      difficulty: 'Avançado',
      duration: '14 semanas',
      lessons: 42,
      students: 520,
      rating: 4.6,
      thumbnail: '/api/placeholder/400/200',
      instructor: 'João Pedro',
      progress: 0,
      isEnrolled: false,
      isCompleted: false,
      tags: ['Segurança', 'Redes', 'Ethical Hacking']
    },
    {
      id: '5',
      title: 'Mobile App Development',
      description: 'Desenvolva aplicativos móveis para iOS e Android.',
      category: 'Desenvolvimento Mobile',
      difficulty: 'Intermediário',
      duration: '16 semanas',
      lessons: 48,
      students: 430,
      rating: 4.5,
      thumbnail: '/api/placeholder/400/200',
      instructor: 'Lucas Oliveira',
      progress: 15,
      isEnrolled: true,
      isCompleted: false,
      tags: ['React Native', 'Flutter', 'Mobile']
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Iniciante': return 'bg-green-100 text-green-800';
      case 'Intermediário': return 'bg-yellow-100 text-yellow-800';
      case 'Avançado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCourses = courses.filter(course => {
    const statusMatch = filter === 'all' || 
                       (filter === 'enrolled' && course.isEnrolled) ||
                       (filter === 'completed' && course.isCompleted) ||
                       (filter === 'available' && !course.isEnrolled);
    
    const categoryMatch = categoryFilter === 'all' || course.category === categoryFilter;
    
    return statusMatch && categoryMatch;
  });

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Cursos</h1>
        <p className="text-muted-foreground">
          Explore nossa biblioteca de cursos e continue sua jornada de aprendizado
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 rounded-lg text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{courses.length}</p>
          <p className="text-sm text-muted-foreground">Cursos Disponíveis</p>
        </div>
        
        <div className="card p-6 rounded-lg text-center">
          <Play className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{courses.filter(c => c.isEnrolled).length}</p>
          <p className="text-sm text-muted-foreground">Cursos Inscritos</p>
        </div>
        
        <div className="card p-6 rounded-lg text-center">
          <CheckCircle className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{courses.filter(c => c.isCompleted).length}</p>
          <p className="text-sm text-muted-foreground">Cursos Concluídos</p>
        </div>
        
        <div className="card p-6 rounded-lg text-center">
          <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">
            {Math.round(courses.filter(c => c.isEnrolled && !c.isCompleted)
              .reduce((acc, c) => acc + c.progress, 0) / 
              courses.filter(c => c.isEnrolled && !c.isCompleted).length) || 0}%
          </p>
          <p className="text-sm text-muted-foreground">Progresso Médio</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 rounded-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            <div className="flex rounded-lg border overflow-hidden">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'enrolled', label: 'Inscritos' },
                { id: 'completed', label: 'Concluídos' },
                { id: 'available', label: 'Disponíveis' }
              ].map((status) => (
                <button
                  key={status.id}
                  onClick={() => setFilter(status.id)}
                  className={`px-3 py-1 text-sm transition-colors ${
                    filter === status.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Categoria:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1 border rounded-lg bg-background text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Todas' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="card rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            {/* Course Thumbnail */}
            <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20">
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-primary/40" />
              </div>
              
              {/* Status Badge */}
              {course.isCompleted && (
                <div className="absolute top-4 right-4 bg-green-600 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Concluído</span>
                </div>
              )}
              
              {course.isEnrolled && !course.isCompleted && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                  Em andamento
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Course Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                    {course.difficulty}
                  </span>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
              </div>

              {/* Course Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span>{course.lessons} lições</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{course.students.toLocaleString()} alunos</span>
                  </div>
                  <span className="text-muted-foreground">por {course.instructor}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {course.isEnrolled && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progresso</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {course.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-muted text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              <Link
                to={course.isEnrolled ? `/courses/${course.id}/lessons` : `/courses/${course.id}`}
                className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                  course.isEnrolled
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                {course.isCompleted ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Revisar</span>
                  </>
                ) : course.isEnrolled ? (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Continuar</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Ver Curso</span>
                  </>
                )}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou explore outras categorias.
          </p>
        </div>
      )}
    </div>
  );
}