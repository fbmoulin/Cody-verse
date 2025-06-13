import React, { useState, useEffect } from 'react';
import { Trophy, Lock, Star, Calendar, Award, Target } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  requirements: string[];
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    // Simulate API call with real-looking achievement data
    setTimeout(() => {
      setAchievements([
        {
          id: '1',
          name: 'Primeiro Passo',
          description: 'Complete sua primeira lição',
          icon: '🎯',
          category: 'Iniciante',
          rarity: 'common',
          points: 10,
          progress: 1,
          maxProgress: 1,
          unlocked: true,
          unlockedAt: '2024-01-16',
          requirements: ['Completar 1 lição']
        },
        {
          id: '2',
          name: 'Estudante Dedicado',
          description: 'Mantenha uma sequência de 7 dias consecutivos',
          icon: '📚',
          category: 'Sequência',
          rarity: 'rare',
          points: 50,
          progress: 7,
          maxProgress: 7,
          unlocked: true,
          unlockedAt: '2024-02-01',
          requirements: ['Manter sequência de 7 dias']
        },
        {
          id: '3',
          name: 'Mestre da IA',
          description: 'Complete o curso completo de IA Básica',
          icon: '🤖',
          category: 'Curso',
          rarity: 'epic',
          points: 100,
          progress: 1,
          maxProgress: 1,
          unlocked: true,
          unlockedAt: '2024-02-15',
          requirements: ['Completar curso de IA Básica']
        },
        {
          id: '4',
          name: 'Velocista',
          description: 'Complete 10 lições em um único dia',
          icon: '⚡',
          category: 'Velocidade',
          rarity: 'rare',
          points: 75,
          progress: 6,
          maxProgress: 10,
          unlocked: false,
          requirements: ['Completar 10 lições em 1 dia']
        },
        {
          id: '5',
          name: 'Maratonista',
          description: 'Mantenha uma sequência de 30 dias',
          icon: '🏃',
          category: 'Sequência',
          rarity: 'epic',
          points: 200,
          progress: 7,
          maxProgress: 30,
          unlocked: false,
          requirements: ['Manter sequência de 30 dias']
        },
        {
          id: '6',
          name: 'Lenda do Aprendizado',
          description: 'Alcance o nível 50',
          icon: '👑',
          category: 'Nível',
          rarity: 'legendary',
          points: 500,
          progress: 12,
          maxProgress: 50,
          unlocked: false,
          requirements: ['Alcançar nível 50']
        },
        {
          id: '7',
          name: 'Quiz Master',
          description: 'Acerte 100% em 5 quizzes consecutivos',
          icon: '🧠',
          category: 'Quiz',
          rarity: 'rare',
          points: 80,
          progress: 2,
          maxProgress: 5,
          unlocked: false,
          requirements: ['100% de acerto em 5 quizzes seguidos']
        },
        {
          id: '8',
          name: 'Colecionador',
          description: 'Desbloqueie 20 conquistas',
          icon: '🏆',
          category: 'Meta',
          rarity: 'epic',
          points: 150,
          progress: 3,
          maxProgress: 20,
          unlocked: false,
          requirements: ['Desbloquear 20 conquistas']
        }
      ]);
      setLoading(false);
    }, 800);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    return (achievement.progress / achievement.maxProgress) * 100;
  };

  const filteredAchievements = achievements.filter(achievement => {
    const statusMatch = filter === 'all' || 
                       (filter === 'unlocked' && achievement.unlocked) ||
                       (filter === 'locked' && !achievement.unlocked);
    
    const categoryMatch = categoryFilter === 'all' || achievement.category === categoryFilter;
    
    return statusMatch && categoryMatch;
  });

  const categories = ['all', ...Array.from(new Set(achievements.map(a => a.category)))];
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 rounded-lg text-center">
          <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{unlockedCount}</p>
          <p className="text-sm text-muted-foreground">Conquistas Desbloqueadas</p>
        </div>
        
        <div className="card p-6 rounded-lg text-center">
          <Star className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{totalPoints}</p>
          <p className="text-sm text-muted-foreground">Pontos de Conquista</p>
        </div>
        
        <div className="card p-6 rounded-lg text-center">
          <Target className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{Math.round((unlockedCount / achievements.length) * 100)}%</p>
          <p className="text-sm text-muted-foreground">Progresso Total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 rounded-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            <div className="flex rounded-lg border overflow-hidden">
              {(['all', 'unlocked', 'locked'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 text-sm transition-colors ${
                    filter === status 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  {status === 'all' ? 'Todas' : status === 'unlocked' ? 'Desbloqueadas' : 'Bloqueadas'}
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

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`relative p-6 rounded-lg border-2 transition-all hover:shadow-lg ${
              achievement.unlocked 
                ? getRarityColor(achievement.rarity)
                : 'border-gray-200 bg-gray-50 opacity-75'
            }`}
          >
            {/* Rarity Badge */}
            <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getRarityTextColor(achievement.rarity)} bg-white border`}>
              {achievement.rarity}
            </div>

            {/* Icon and Lock Overlay */}
            <div className="relative mb-4">
              <div className="text-4xl mb-2 text-center">
                {achievement.unlocked ? achievement.icon : '🔒'}
              </div>
              {!achievement.unlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Achievement Info */}
            <div className="space-y-3">
              <div>
                <h3 className={`font-semibold text-lg ${!achievement.unlocked ? 'text-gray-500' : ''}`}>
                  {achievement.name}
                </h3>
                <p className={`text-sm ${!achievement.unlocked ? 'text-gray-400' : 'text-muted-foreground'}`}>
                  {achievement.description}
                </p>
              </div>

              {/* Progress Bar */}
              {!achievement.unlocked && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progresso</span>
                    <span>{achievement.progress}/{achievement.maxProgress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(achievement)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Unlock Date */}
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Desbloqueada em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}

              {/* Points */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{achievement.points} pts</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full bg-white border ${getRarityTextColor(achievement.rarity)}`}>
                  {achievement.category}
                </span>
              </div>

              {/* Requirements */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Requisitos:</p>
                <ul className="space-y-1">
                  {achievement.requirements.map((req, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-center space-x-1">
                      <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Achievements */}
      {achievements.some(a => a.unlocked) && (
        <div className="card p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Conquistas Recentes</h2>
          <div className="space-y-3">
            {achievements
              .filter(a => a.unlocked && a.unlockedAt)
              .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
              .slice(0, 3)
              .map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">+{achievement.points} pts</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(achievement.unlockedAt!).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}