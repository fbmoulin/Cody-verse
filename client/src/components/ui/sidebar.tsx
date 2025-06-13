import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  BookOpen, 
  GraduationCap, 
  Trophy, 
  Settings, 
  User,
  ChevronLeft,
  ChevronRight,
  Palette
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Cursos', href: '/courses', icon: BookOpen },
  { name: 'Lições', href: '/lessons', icon: GraduationCap },
  { name: 'Conquistas', href: '/achievements', icon: Trophy },
  { name: 'Perfil', href: '/profile', icon: User },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

const themes = [
  { name: 'Padrão', value: 'default', preview: 'from-indigo-500 to-cyan-500' },
  { name: 'Cyberpunk', value: 'cyberpunk', preview: 'from-pink-500 to-cyan-400' },
  { name: 'Ocean', value: 'ocean', preview: 'from-blue-500 to-cyan-400' },
  { name: 'Forest', value: 'forest', preview: 'from-green-500 to-lime-400' },
  { name: 'Neon', value: 'neon', preview: 'from-purple-500 to-pink-400' },
];

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  
  const getCurrentTheme = () => {
    return document.body.getAttribute('data-theme') || 'default';
  };

  const switchTheme = (theme: string) => {
    document.body.removeAttribute('data-theme');
    if (theme !== 'default') {
      document.body.setAttribute('data-theme', theme);
    }
    localStorage.setItem('codyverse-theme', theme);
    setShowThemeMenu(false);
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <span className="font-bold text-lg gradient-text">CodyVerse</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-accent transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>

      {/* Theme Switcher */}
      <div className="p-2 border-t border-border">
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={cn(
              "flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Trocar Tema" : undefined}
          >
            <Palette className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && "Temas"}
          </button>

          {showThemeMenu && (
            <div className={cn(
              "absolute bottom-full mb-2 bg-popover border border-border rounded-lg shadow-lg p-2 space-y-1 min-w-[200px]",
              isCollapsed ? "left-full ml-2" : "left-0"
            )}>
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => switchTheme(theme.value)}
                  className={cn(
                    "flex items-center w-full px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent",
                    getCurrentTheme() === theme.value && "bg-accent"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full mr-3 bg-gradient-to-r",
                    theme.preview
                  )} />
                  {theme.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Section */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">Usuário</div>
              <div className="text-xs text-muted-foreground">Nível 10</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}