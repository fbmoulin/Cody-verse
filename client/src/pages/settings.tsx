import React, { useState } from 'react';
import { User, Bell, Shield, Palette, Globe, Volume2, Moon, Sun, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Profile Settings
    name: 'João Silva',
    email: 'joao.silva@email.com',
    bio: 'Estudante entusiasta de tecnologia',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    achievementAlerts: true,
    
    // Privacy Settings
    profilePublic: false,
    showProgress: true,
    showAchievements: true,
    
    // Appearance Settings
    theme: 'default',
    colorScheme: 'system',
    language: 'pt-BR',
    
    // Audio Settings
    soundEffects: true,
    backgroundMusic: false,
    volume: 70
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const themes = [
    { id: 'default', name: 'Padrão', preview: 'bg-blue-500' },
    { id: 'cyberpunk', name: 'Cyberpunk', preview: 'bg-purple-500' },
    { id: 'ocean', name: 'Oceano', preview: 'bg-cyan-500' },
    { id: 'forest', name: 'Floresta', preview: 'bg-green-500' },
    { id: 'neon', name: 'Neon', preview: 'bg-pink-500' }
  ];

  const languages = [
    { code: 'pt-BR', name: 'Português (Brasil)' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'es-ES', name: 'Español' },
    { code: 'fr-FR', name: 'Français' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          Salvar Alterações
        </button>
      </div>

      {/* Profile Settings */}
      <div className="card p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-6">
          <User className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Perfil</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => handleSettingChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleSettingChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Biografia</label>
            <textarea
              value={settings.bio}
              onChange={(e) => handleSettingChange('bio', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Notificações</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações por email</p>
              <p className="text-sm text-muted-foreground">Receba atualizações importantes por email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações push</p>
              <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Relatório semanal</p>
              <p className="text-sm text-muted-foreground">Resumo do seu progresso semanal</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.weeklyReport}
                onChange={(e) => handleSettingChange('weeklyReport', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="card p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Privacidade</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Perfil público</p>
              <p className="text-sm text-muted-foreground">Permitir que outros usuários vejam seu perfil</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.profilePublic}
                onChange={(e) => handleSettingChange('profilePublic', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mostrar progresso</p>
              <p className="text-sm text-muted-foreground">Exibir seu progresso nos rankings</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showProgress}
                onChange={(e) => handleSettingChange('showProgress', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="card p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-6">
          <Palette className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Aparência</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Tema</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => handleSettingChange('theme', theme.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    settings.theme === theme.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className={`w-full h-8 rounded mb-2 ${theme.preview}`}></div>
                  <p className="text-xs text-center">{theme.name}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">Esquema de cores</label>
            <div className="flex space-x-2">
              {[
                { id: 'light', icon: Sun, label: 'Claro' },
                { id: 'dark', icon: Moon, label: 'Escuro' },
                { id: 'system', icon: Monitor, label: 'Sistema' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => handleSettingChange('colorScheme', id)}
                  className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${
                    settings.colorScheme === id 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="card p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-6">
          <Globe className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Idioma</h2>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Idioma da interface</label>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audio Settings */}
      <div className="card p-6 rounded-lg">
        <div className="flex items-center space-x-3 mb-6">
          <Volume2 className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Áudio</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Efeitos sonoros</p>
              <p className="text-sm text-muted-foreground">Sons para ações e conquistas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">Volume</p>
              <span className="text-sm text-muted-foreground">{settings.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={(e) => handleSettingChange('volume', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 rounded-lg border-red-200">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Zona de Perigo</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Resetar progresso</p>
              <p className="text-sm text-muted-foreground">Remove todo seu progresso e conquistas</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Resetar
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Excluir conta</p>
              <p className="text-sm text-muted-foreground">Remove permanentemente sua conta e dados</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Excluir Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}