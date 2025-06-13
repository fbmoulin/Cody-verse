import React from 'react';

export function Profile() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold gradient-text">Perfil</h1>
      <div className="bg-card p-6 rounded-lg border">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">U</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Usuário</h2>
            <p className="text-muted-foreground">Nível 10 • 9,472 XP</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Estatísticas</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>Lições completadas: 45</li>
              <li>Sequência atual: 7 dias</li>
              <li>Tempo total de estudo: 28 horas</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Preferências</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>Idioma: Português</li>
              <li>Notificações: Ativadas</li>
              <li>Tema: Automático</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}