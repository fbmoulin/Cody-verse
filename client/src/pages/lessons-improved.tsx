import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Lock, CheckCircle, Clock, BookOpen, ArrowLeft, Star, Award, Target } from 'lucide-react';

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

export default function LessonsImprovedPage() {
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
        const lessonsData = await response.json();
        
        const courseResponse = await fetch(`/api/courses/${id}`);
        let courseInfo = { title: 'Course', description: 'Loading...', instructor: 'CodyVerse' };
        
        if (courseResponse.ok) {
          const courseData = await courseResponse.json();
          if (courseData.success && courseData.data) {
            courseInfo = {
              title: courseData.data.title,
              description: courseData.data.description,
              instructor: 'CodyVerse Instructor'
            };
          }
        }
        
        if (lessonsData.success && lessonsData.data) {
          const lessons = lessonsData.data.map((lesson: any, index: number) => ({
            id: lesson.id.toString(),
            title: lesson.title,
            description: lesson.content?.sections?.[0]?.content || lesson.content?.activities?.[0]?.content || 'Interactive lesson content',
            duration: lesson.estimatedDurationMinutes || 15,
            type: lesson.type === 'quiz' ? 'quiz' : lesson.type === 'theory' ? 'reading' : 'interactive',
            isCompleted: index < 2, // First 2 lessons completed for demo
            isLocked: index > 4, // Lock lessons after 5th
            progress: index < 2 ? 100 : index === 2 ? 65 : 0,
            xpReward: lesson.xpReward || 10
          }));
          
          const totalLessons = lessons.length;
          const completedLessons = lessons.filter((l: any) => l.isCompleted).length;
          
          setCourse({
            id,
            title: courseInfo.title,
            description: courseInfo.description,
            instructor: courseInfo.instructor,
            totalLessons,
            completedLessons,
            progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
            lessons
          });
        }
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

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
      case 'video': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'quiz': return 'bg-green-100 text-green-800 border-green-200';
      case 'interactive': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reading': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Curso não encontrado</h2>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar aos cursos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-6 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Voltar aos cursos</span>
          </Link>
        </div>

        {/* Course Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-white/60 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">{course.title}</h1>
                  <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">{course.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-8 text-gray-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">AI</span>
                  </div>
                  <span className="font-medium">{course.instructor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">{course.totalLessons} aulas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">{course.lessons.reduce((sum, l) => sum + l.xpReward, 0)} XP total</span>
                </div>
              </div>
            </div>
            
            {/* Progress Card */}
            <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white min-w-[280px] shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold mb-2">{course.progress}%</div>
                <div className="text-blue-100 text-lg">Progresso do Curso</div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden mb-4">
                <div 
                  className="bg-white h-4 rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <div className="text-center text-blue-100">
                <span className="text-xl font-semibold">{course.completedLessons}</span> de{' '}
                <span className="text-xl font-semibold">{course.totalLessons}</span> concluídas
              </div>
            </div>
          </div>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/60 shadow-lg">
            <Target className="w-10 h-10 text-blue-500 mx-auto mb-4" />
            <p className="text-3xl font-bold text-gray-900">{course.totalLessons}</p>
            <p className="text-gray-600 font-medium">Total de Lições</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/60 shadow-lg">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <p className="text-3xl font-bold text-gray-900">{course.completedLessons}</p>
            <p className="text-gray-600 font-medium">Concluídas</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/60 shadow-lg">
            <Clock className="w-10 h-10 text-purple-500 mx-auto mb-4" />
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(course.lessons.reduce((acc, lesson) => acc + lesson.duration, 0) / 60)}h
            </p>
            <p className="text-gray-600 font-medium">Duração Total</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/60 shadow-lg">
            <Star className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
            <p className="text-3xl font-bold text-gray-900">
              {course.lessons.reduce((acc, lesson) => acc + lesson.xpReward, 0)}
            </p>
            <p className="text-gray-600 font-medium">XP Total</p>
          </div>
        </div>

        {/* Lessons Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Aulas do Curso</h2>
          <p className="text-gray-600 text-lg">Clique em uma aula para começar sua jornada de aprendizado</p>
        </div>
        
        {/* Lessons Grid */}
        <div className="space-y-4">
          {course.lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className={`
                group relative bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-8 
                transition-all duration-300 hover:shadow-2xl hover:bg-white/95
                ${lesson.isLocked 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'cursor-pointer hover:-translate-y-2 hover:scale-[1.02]'
                }
              `}
            >
              <div className="flex items-center gap-8">
                {/* Lesson Number & Status */}
                <div className="flex items-center gap-6">
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg
                    ${lesson.isCompleted 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' 
                      : lesson.isLocked 
                        ? 'bg-gray-200 text-gray-400'
                        : 'bg-gradient-to-br from-blue-400 to-purple-500 text-white'
                    }
                  `}>
                    {lesson.isCompleted ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : lesson.isLocked ? (
                      <Lock className="w-8 h-8" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div className={`
                    w-20 h-20 rounded-3xl flex items-center justify-center text-3xl shadow-lg
                    ${lesson.isLocked 
                      ? 'bg-gray-100 opacity-50' 
                      : getTypeColor(lesson.type).replace('text-', 'bg-').replace('800', '50')
                    }
                  `}>
                    {getTypeIcon(lesson.type)}
                  </div>
                </div>

                {/* Lesson Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="font-bold text-2xl text-gray-900 group-hover:text-blue-600 transition-colors">
                      {lesson.title}
                    </h3>
                    <span className={`
                      px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider border-2
                      ${getTypeColor(lesson.type)}
                    `}>
                      {lesson.type}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                    {lesson.description}
                  </p>
                  
                  <div className="flex items-center gap-8 text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold text-lg">{lesson.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-lg">{lesson.xpReward} XP</span>
                    </div>
                    {lesson.progress > 0 && (
                      <div className="text-blue-600 font-bold text-lg">
                        {lesson.progress}% concluído
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {lesson.progress > 0 && lesson.progress < 100 && (
                    <div className="mt-6">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-700"
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {!lesson.isLocked && (
                  <div className="flex-shrink-0">
                    <button className={`
                      px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center gap-3 shadow-lg
                      ${lesson.isCompleted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-200'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-2xl hover:scale-105'
                      }
                    `}>
                      {lesson.isCompleted ? (
                        <>
                          <CheckCircle className="w-6 h-6" />
                          Revisar
                        </>
                      ) : lesson.progress > 0 ? (
                        <>
                          <Play className="w-6 h-6" />
                          Continuar
                        </>
                      ) : (
                        <>
                          <Play className="w-6 h-6" />
                          Iniciar Aula
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}