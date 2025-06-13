import React from 'react';

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Progresso Geral</h3>
          <p className="text-muted-foreground">Suas estatísticas de aprendizado</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Metas Diárias</h3>
          <p className="text-muted-foreground">Objetivos para hoje</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Conquistas Recentes</h3>
          <p className="text-muted-foreground">Suas últimas medalhas</p>
        </div>
      </div>
    </div>
  );
}