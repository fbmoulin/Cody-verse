import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Award, Play, Lock, CheckCircle } from 'lucide-react';

interface Module {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  total_xp: number;
}

interface Lesson {
  id: number;
  title: string;
  lesson_type: string;
  duration: string;
  xp_reward: number;
  order_index: number;
  completed?: boolean;
  progress?: number;
}

export function Lessons() {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedModuleTitle, setSelectedModuleTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      
      if (data.success) {
        setModules(data.data);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectModule = async (moduleId: number, moduleTitle: string) => {
    setSelectedModule(moduleId);
    setSelectedModuleTitle(moduleTitle);
    
    try {
      const response = await fetch(`/api/courses/${moduleId}/lessons`);
      const data = await response.json();
      
      if (data.success) {
        setLessons(data.data);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const getLessonTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'theory': 'Teoria',
      'interactive': 'Interativo',
      'lab': 'Laboratório',
      'quiz': 'Quiz'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'theory': return '📖';
      case 'interactive': return '🎮';
      case 'lab': return '🔬';
      case 'quiz': return '❓';
      default: return '📚';
    }
  };

  const startLesson = (lessonId: number) => {
    alert(`Iniciando lição ${lessonId}. Interface de lição será implementada em breve.`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold gradient-text">Lições Interativas</h1>
      </div>

      {/* Module Selection */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Selecionar Módulo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <div
              key={module.id}
              onClick={() => selectModule(module.id, module.title)}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md
                ${selectedModule === module.id 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {module.description}
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${module.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    module.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}
                `}>
                  {module.difficulty}
                </span>
                <span className="flex items-center text-muted-foreground">
                  <Award className="h-4 w-4 mr-1" />
                  {module.total_xp} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lessons Section */}
      {selectedModule && (
        <div className="bg-card rounded-lg border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">{selectedModuleTitle}</h2>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {lessons.filter(l => l.completed).length}/{lessons.length} concluídas
            </div>
          </div>

          {lessons.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma lição encontrada para este módulo.
            </p>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => {
                const isLocked = index > 0 && !lessons[index - 1].completed;
                const progress = lesson.completed ? 100 : lesson.progress || 0;

                return (
                  <div
                    key={lesson.id}
                    onClick={() => !isLocked && startLesson(lesson.id)}
                    className={`
                      relative p-4 rounded-lg border transition-all duration-200
                      ${lesson.completed 
                        ? 'border-green-200 bg-green-50/50' 
                        : isLocked 
                          ? 'border-gray-200 bg-gray-50/50 opacity-60 cursor-not-allowed'
                          : 'border-border hover:border-primary/50 cursor-pointer hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Progress Bar */}
                    <div 
                      className="absolute top-0 left-0 h-1 bg-primary rounded-t-lg transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {lesson.completed ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : isLocked ? (
                            <Lock className="h-6 w-6 text-gray-400" />
                          ) : (
                            <Play className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-lg flex items-center space-x-2">
                            <span>{getTypeIcon(lesson.lesson_type)}</span>
                            <span>{lesson.title}</span>
                          </h3>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {lesson.duration}
                            </span>
                            <span className="flex items-center">
                              <Award className="h-4 w-4 mr-1" />
                              {lesson.xp_reward} XP
                            </span>
                            <span className="px-2 py-1 bg-secondary rounded-full text-xs">
                              {getLessonTypeLabel(lesson.lesson_type)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!isLocked && !lesson.completed && (
                        <div className="text-right">
                          <div className="text-primary font-medium">Iniciar</div>
                          <div className="text-xs text-muted-foreground">
                            {progress > 0 ? `${progress}% concluído` : 'Não iniciado'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedModule && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Selecione um módulo
          </h3>
          <p className="text-muted-foreground">
            Escolha um módulo acima para ver as lições disponíveis
          </p>
        </div>
      )}
    </div>
  );
}