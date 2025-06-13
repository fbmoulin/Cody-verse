import React, { useState } from 'react';
import { User, Trophy, Target, Calendar, BookOpen, Award, Settings, Edit3 } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
  totalXp: number;
  xpToNextLevel: number;
  joinDate: string;
  streak: number;
  completedLessons: number;
  completedCourses: number;
  badges: Badge[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export default function ProfilePage() {
  const [user] = useState<UserProfile>({
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    avatar: '',
    level: 12,
    totalXp: 2450,
    xpToNextLevel: 550,
    joinDate: '2024-01-15',
    streak: 7,
    completedLessons: 45,
    completedCourses: 3,
    badges: [
      {
        id: '1',
        name: 'Primeiro Passo',
        description: 'Complete sua primeira lição',
        icon: '🎯',
        earnedAt: '2024-01-16',
        rarity: 'common'
      },
      {
        id: '2',
        name: 'Estudante Dedicado',
        description: 'Mantenha uma sequência de 7 dias',
        icon: '📚',
        earnedAt: '2024-02-01',
        rarity: 'rare'
      },
      {
        id: '3',
        name: 'Mestre da IA',
        description: 'Complete o curso de IA Básica',
        icon: '🤖',
        earnedAt: '2024-02-15',
        rarity: 'epic'
      }
    ]
  });

  const [isEditing, setIsEditing] = useState(false);

  const calculateLevelProgress = () => {
    const currentLevelXp = user.totalXp;
    const nextLevelXp = currentLevelXp + user.xpToNextLevel;
    return (currentLevelXp / nextLevelXp) * 100;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="card p-8 rounded-lg">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                {user.level}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">
                Membro desde {formatDate(user.joinDate)}
              </p>
            </div>
          </div>
          
          <button className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
        </div>

        {/* Level Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Nível {user.level}</span>
            <span className="text-sm text-muted-foreground">
              {user.totalXp} / {user.totalXp + user.xpToNextLevel} XP
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500"
              style={{ width: `${calculateLevelProgress()}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Faltam {user.xpToNextLevel} XP para o próximo nível
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 rounded-lg text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{user.completedLessons}</p>
          <p className="text-sm text-muted-foreground">Lições Completadas</p>
        </div>
        
        <div className="card p-6 rounded-lg text-center">
          <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{user.completedCourses}</p>
          <p className="text-sm text-muted-foreground">Cursos Concluídos</p>
        </div>
        
        <div className="card p-6 rounded-lg text-center">
          <Target className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{user.streak}</p>
          <p className="text-sm text-muted-foreground">Dias de Sequência</p>
        </div>
        
        <div className="card p-6 rounded-lg text-center">
          <Award className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-2xl font-bold">{user.totalXp}</p>
          <p className="text-sm text-muted-foreground">XP Total</p>
        </div>
      </div>

      {/* Badges Section */}
      <div className="card p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Conquistas</h2>
          <span className="text-sm text-muted-foreground">
            {user.badges.length} conquistadas
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-lg border-2 ${getRarityColor(badge.rarity)} transition-all hover:shadow-lg`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-3xl">{badge.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{badge.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {badge.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Conquistada em {formatDate(badge.earnedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="card p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-6">Atividade Recente</h2>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Lição "Redes Neurais" completada</p>
              <p className="text-sm text-muted-foreground">Hoje às 14:30 • +30 XP</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Nova conquista: "Mestre da IA"</p>
              <p className="text-sm text-muted-foreground">Ontem às 18:45 • +100 XP</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Sequência de 7 dias mantida</p>
              <p className="text-sm text-muted-foreground">Ontem • +15 XP bonus</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Curso "IA Básica" concluído</p>
              <p className="text-sm text-muted-foreground">2 dias atrás • +200 XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className="card p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-6">Metas Pessoais</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-medium">Meta Diária</h3>
              <p className="text-sm text-muted-foreground">Completar 3 lições por dia</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">2/3</p>
              <p className="text-xs text-muted-foreground">Hoje</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-medium">Meta Semanal</h3>
              <p className="text-sm text-muted-foreground">Manter sequência de 7 dias</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">7/7</p>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-medium">Meta Mensal</h3>
              <p className="text-sm text-muted-foreground">Concluir 1 curso completo</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-yellow-600">0/1</p>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}