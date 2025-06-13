import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Target, TrendingUp, Play, Clock, Award } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  total_xp: number;
  lesson_count: number;
}

interface UserStats {
  totalXp: number;
  level: number;
  streak: number;
  completedLessons: number;
}

export default function ModernHomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalXp: 2450,
    level: 12,
    streak: 7,
    completedLessons: 45
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data.slice(0, 3)); // Show only first 3 courses
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'iniciante':
        return 'text-green-600 bg-green-100';
      case 'intermediário':
        return 'text-yellow-600 bg-yellow-100';
      case 'avançado':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 p-8 border">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Bem-vindo ao CodyVerse!
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Continue sua jornada de aprendizado em IA e tecnologia
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-medium">Nível {userStats.level}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-medium">{userStats.totalXp} XP</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium">{userStats.streak} dias de sequência</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lições Completadas</p>
              <p className="text-2xl font-bold">{userStats.completedLessons}</p>
            </div>
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">XP Total</p>
              <p className="text-2xl font-bold">{userStats.totalXp}</p>
            </div>
            <Award className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="card p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sequência Atual</p>
              <p className="text-2xl font-bold">{userStats.streak} dias</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Featured Courses */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Cursos em Destaque</h2>
          <button className="text-primary hover:text-primary/80 font-medium">
            Ver todos →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="card p-6 rounded-lg hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {course.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                  {course.difficulty}
                </span>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <span className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {course.lesson_count} lições
                  </span>
                  <span className="flex items-center">
                    <Award className="h-4 w-4 mr-1" />
                    {course.total_xp} XP
                  </span>
                </div>
              </div>
              
              <button className="w-full mt-4 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2">
                <Play className="h-4 w-4" />
                <span>Continuar</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Goal */}
      <div className="card p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Meta Diária</h3>
          <Target className="h-6 w-6 text-primary" />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Progresso de hoje</span>
            <span className="font-medium">2/3 lições</span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: '66%' }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Falta apenas 1 lição para completar sua meta diária!
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Atividade Recente</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Lição "Fundamentos de IA" completada</p>
              <p className="text-sm text-muted-foreground">Há 2 horas • +25 XP</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Award className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Nova conquista desbloqueada: "Estudante Dedicado"</p>
              <p className="text-sm text-muted-foreground">Ontem • +50 XP</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Sequência de 7 dias mantida</p>
              <p className="text-sm text-muted-foreground">Hoje • +10 XP bonus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}