import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  pt: {
    translation: {
      // Navigation
      nav: {
        dashboard: 'Dashboard',
        courses: 'Cursos',
        progress: 'Progresso',
        achievements: 'Conquistas',
        leaderboard: 'Ranking',
        profile: 'Perfil'
      },
      // Dashboard
      dashboard: {
        welcome: 'Bem-vindo de volta!',
        level: 'Nível',
        xp: 'XP',
        coins: 'Moedas',
        streak: 'Sequência',
        dailyGoals: 'Objetivos Diários',
        recentActivity: 'Atividade Recente',
        continueStudying: 'Continuar Estudando',
        viewAll: 'Ver Todos'
      },
      // Courses
      courses: {
        title: 'Seus Cursos',
        searchPlaceholder: 'Pesquisar cursos...',
        filterAll: 'Todos',
        filterInProgress: 'Em Andamento',
        filterCompleted: 'Concluídos',
        startCourse: 'Iniciar Curso',
        continueCourse: 'Continuar',
        completedCourse: 'Concluído',
        progress: 'Progresso',
        lessons: 'lições'
      },
      // Progress
      progress: {
        title: 'Seu Progresso',
        overallProgress: 'Progresso Geral',
        weeklyGoals: 'Metas Semanais',
        studyStreak: 'Sequência de Estudos',
        timeSpent: 'Tempo Gasto',
        lessonCompleted: 'Lições Concluídas',
        skillsProgress: 'Progresso das Habilidades'
      },
      // Achievements
      achievements: {
        title: 'Conquistas',
        unlocked: 'Desbloqueadas',
        locked: 'Bloqueadas',
        recent: 'Recentes',
        rare: 'Raras',
        common: 'Comuns',
        epic: 'Épicas',
        legendary: 'Lendárias'
      },
      // Leaderboard
      leaderboard: {
        title: 'Ranking',
        global: 'Global',
        friends: 'Amigos',
        thisWeek: 'Esta Semana',
        thisMonth: 'Este Mês',
        allTime: 'Todos os Tempos',
        rank: 'Posição',
        player: 'Jogador',
        score: 'Pontuação'
      },
      // Common
      common: {
        loading: 'Carregando...',
        error: 'Erro',
        success: 'Sucesso',
        save: 'Salvar',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        edit: 'Editar',
        delete: 'Excluir',
        close: 'Fechar',
        next: 'Próximo',
        previous: 'Anterior',
        retry: 'Tentar Novamente'
      },
      // Notifications
      notifications: {
        levelUp: 'Parabéns! Você subiu para o nível {{level}}!',
        xpGained: 'Você ganhou {{amount}} XP!',
        achievementUnlocked: 'Nova conquista desbloqueada: {{name}}!',
        streakMaintained: 'Sequência mantida por {{days}} dias!',
        goalCompleted: 'Meta diária completada!'
      }
    }
  },
  en: {
    translation: {
      // Navigation
      nav: {
        dashboard: 'Dashboard',
        courses: 'Courses',
        progress: 'Progress',
        achievements: 'Achievements',
        leaderboard: 'Leaderboard',
        profile: 'Profile'
      },
      // Dashboard
      dashboard: {
        welcome: 'Welcome back!',
        level: 'Level',
        xp: 'XP',
        coins: 'Coins',
        streak: 'Streak',
        dailyGoals: 'Daily Goals',
        recentActivity: 'Recent Activity',
        continueStudying: 'Continue Studying',
        viewAll: 'View All'
      },
      // Courses
      courses: {
        title: 'Your Courses',
        searchPlaceholder: 'Search courses...',
        filterAll: 'All',
        filterInProgress: 'In Progress',
        filterCompleted: 'Completed',
        startCourse: 'Start Course',
        continueCourse: 'Continue',
        completedCourse: 'Completed',
        progress: 'Progress',
        lessons: 'lessons'
      },
      // Progress
      progress: {
        title: 'Your Progress',
        overallProgress: 'Overall Progress',
        weeklyGoals: 'Weekly Goals',
        studyStreak: 'Study Streak',
        timeSpent: 'Time Spent',
        lessonCompleted: 'Lessons Completed',
        skillsProgress: 'Skills Progress'
      },
      // Achievements
      achievements: {
        title: 'Achievements',
        unlocked: 'Unlocked',
        locked: 'Locked',
        recent: 'Recent',
        rare: 'Rare',
        common: 'Common',
        epic: 'Epic',
        legendary: 'Legendary'
      },
      // Leaderboard
      leaderboard: {
        title: 'Leaderboard',
        global: 'Global',
        friends: 'Friends',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        allTime: 'All Time',
        rank: 'Rank',
        player: 'Player',
        score: 'Score'
      },
      // Common
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        edit: 'Edit',
        delete: 'Delete',
        close: 'Close',
        next: 'Next',
        previous: 'Previous',
        retry: 'Retry'
      },
      // Notifications
      notifications: {
        levelUp: 'Congratulations! You reached level {{level}}!',
        xpGained: 'You gained {{amount}} XP!',
        achievementUnlocked: 'New achievement unlocked: {{name}}!',
        streakMaintained: 'Streak maintained for {{days}} days!',
        goalCompleted: 'Daily goal completed!'
      }
    }
  }
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t: i18n.t,
    availableLanguages: [
      { code: 'pt', name: 'Português', flag: '🇧🇷' },
      { code: 'en', name: 'English', flag: '🇺🇸' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};