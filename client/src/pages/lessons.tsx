import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Lock, CheckCircle, Clock, BookOpen, ArrowLeft, Star } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: 'video' | 'quiz' | 'interactive' | 'reading';
  isCompleted: boolean;
  isLocked: boolean;
  progress: number;
  xpReward: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  lessons: Lesson[];
}

export default function LessonsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      loadCourse(courseId);
    }
  }, [courseId]);

  const loadCourse = async (id: string) => {
    try {
      const response = await fetch(`/api/courses/${id}/lessons`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
      } else {
        setCourse(getSampleCourse(id));
      }
    } catch (error) {
      setCourse(getSampleCourse(id));
    } finally {
      setLoading(false);
    }
  };

  const getSampleCourse = (id: string): Course => ({
    id,
    title: 'Fundamentos de Inteligência Artificial',
    description: 'Aprenda os conceitos básicos de IA, machine learning e suas aplicações práticas.',
    instructor: 'Dr. Ana Silva',
    totalLessons: 12,
    completedLessons: 4,
    progress: 33,
    lessons: [
      {
        id: '1',
        title: 'Introdução à Inteligência Artificial',
        description: 'Conceitos fundamentais e história da IA',
        duration: 15,
        type: 'video',
        isCompleted: true,
        isLocked: false,
        progress: 100,
        xpReward: 20
      },
      {
        id: '2',
        title: 'Tipos de IA: Narrow vs General',
        description: 'Diferenças entre IA específica e geral',
        duration: 12,
        type: 'video',
        isCompleted: true,
        isLocked: false,
        progress: 100,
        xpReward: 20
      },
      {
        id: '3',
        title: 'Quiz: Conceitos Básicos',
        description: 'Teste seus conhecimentos sobre os fundamentos',
        duration: 10,
        type: 'quiz',
        isCompleted: true,
        isLocked: false,
        progress: 100,
        xpReward: 30
      },
      {
        id: '4',
        title: 'Machine Learning Basics',
        description: 'Introdução ao aprendizado de máquina',
        duration: 18,
        type: 'video',
        isCompleted: true,
        isLocked: false,
        progress: 100,
        xpReward: 25
      },
      {
        id: '5',
        title: 'Supervised Learning',
        description: 'Aprendizado supervisionado e suas aplicações',
        duration: 20,
        type: 'video',
        isCompleted: false,
        isLocked: false,
        progress: 65,
        xpReward: 25
      },
      {
        id: '6',
        title: 'Exercício Prático: Classificação',
        description: 'Implemente um algoritmo de classificação',
        duration: 25,
        type: 'interactive',
        isCompleted: false,
        isLocked: false,
        progress: 0,
        xpReward: 40
      },
      {
        id: '7',
        title: 'Unsupervised Learning',
        description: 'Aprendizado não supervisionado',
        duration: 15,
        type: 'video',
        isCompleted: false,
        isLocked: true,
        progress: 0,
        xpReward: 25
      },
      {
        id: '8',
        title: 'Neural Networks Introduction',
        description: 'Introdução às redes neurais',
        duration: 22,
        type: 'video',
        isCompleted: false,
        isLocked: true,
        progress: 0,
        xpReward: 30
      },
      {
        id: '9',
        title: 'Deep Learning Fundamentals',
        description: 'Conceitos básicos de deep learning',
        duration: 25,
        type: 'video',
        isCompleted: false,
        isLocked: true,
        progress: 0,
        xpReward: 35
      },
      {
        id: '10',
        title: 'Quiz: Machine Learning',
        description: 'Avalie seu conhecimento em ML',
        duration: 15,
        type: 'quiz',
        isCompleted: false,
        isLocked: true,
        progress: 0,
        xpReward: 30
      },
      {
        id: '11',
        title: 'Projeto Final: Classificador de Imagens',
        description: 'Crie um classificador usando IA',
        duration: 45,
        type: 'interactive',
        isCompleted: false,
        isLocked: true,
        progress: 0,
        xpReward: 60
      },
      {
        id: '12',
        title: 'Conclusão e Próximos Passos',
        description: 'Resumo do curso e direções futuras',
        duration: 10,
        type: 'reading',
        isCompleted: false,
        isLocked: true,
        progress: 0,
        xpReward: 20
      }
    ]
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'quiz': return '📝';
      case 'interactive': return '💻';
      case 'reading': return '📖';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-100 text-blue-800';
      case 'quiz': return 'bg-green-100 text-green-800';
      case 'interactive': return 'bg-purple-100 text-purple-800';
      case 'reading': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Curso não encontrado</h2>
        <Link
          to="/courses"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
        >
          Voltar aos cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/courses"
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos cursos</span>
        </Link>
        
        <div className="card p-6 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <p className="text-muted-foreground mb-4">{course.description}</p>
              <p className="text-sm text-muted-foreground">
                Instrutor: {course.instructor}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{course.progress}%</div>
              <div className="text-sm text-muted-foreground">Concluído</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progresso do curso</span>
              <span>{course.completedLessons} de {course.totalLessons} lições</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 rounded-lg text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{course.totalLessons}</p>
          <p className="text-sm text-muted-foreground">Total de Lições</p>
        </div>
        
        <div className="card p-6 rounded-lg text-center">
          <CheckCircle className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{course.completedLessons}</p>
          <p className="text-sm text-muted-foreground">Lições Concluídas</p>
        </div>
        
        <div className="card p-6 rounded-lg text-center">
          <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">
            {Math.round(course.lessons.reduce((acc, lesson) => acc + lesson.duration, 0) / 60)}h
          </p>
          <p className="text-sm text-muted-foreground">Duração Total</p>
        </div>
        
        <div className="card p-6 rounded-lg text-center">
          <Star className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">
            {course.lessons.filter(l => l.isCompleted).reduce((acc, l) => acc + l.xpReward, 0)}
          </p>
          <p className="text-sm text-muted-foreground">XP Ganho</p>
        </div>
      </div>

      {/* Lessons List */}
      <div className="card p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-6">Lições do Curso</h2>
        
        <div className="space-y-4">
          {course.lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className={`flex items-center p-4 rounded-lg border transition-colors ${
                lesson.isLocked
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : lesson.isCompleted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-background border-border hover:bg-muted cursor-pointer'
              }`}
            >
              {/* Lesson Number */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                lesson.isCompleted
                  ? 'bg-green-600 text-white'
                  : lesson.isLocked
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-primary text-primary-foreground'
              }`}>
                {lesson.isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : lesson.isLocked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>

              {/* Lesson Content */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className={`font-medium ${lesson.isLocked ? 'text-gray-500' : ''}`}>
                    {lesson.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(lesson.type)}`}>
                    {getTypeIcon(lesson.type)} {lesson.type}
                  </span>
                </div>
                
                <p className={`text-sm mb-2 ${lesson.isLocked ? 'text-gray-400' : 'text-muted-foreground'}`}>
                  {lesson.description}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{lesson.duration} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3" />
                    <span>{lesson.xpReward} XP</span>
                  </div>
                </div>

                {/* Progress Bar for Current Lesson */}
                {!lesson.isCompleted && !lesson.isLocked && lesson.progress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-primary h-1 rounded-full transition-all duration-300"
                        style={{ width: `${lesson.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{lesson.progress}% concluído</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="ml-4">
                {lesson.isLocked ? (
                  <div className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm">
                    Bloqueado
                  </div>
                ) : lesson.isCompleted ? (
                  <Link
                    to={`/courses/${course.id}/lessons/${lesson.id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Revisar
                  </Link>
                ) : (
                  <Link
                    to={`/courses/${course.id}/lessons/${lesson.id}`}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                  >
                    <Play className="w-4 h-4" />
                    <span>{lesson.progress > 0 ? 'Continuar' : 'Iniciar'}</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Course Completion */}
      {course.progress === 100 && (
        <div className="card p-6 rounded-lg bg-green-50 border-green-200">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Parabéns! Curso Concluído
            </h3>
            <p className="text-green-700 mb-4">
              Você completou com sucesso o curso "{course.title}"
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Baixar Certificado
              </button>
              <Link
                to="/courses"
                className="border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
              >
                Explorar Mais Cursos
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}