import React from 'react';

export function Achievements() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold gradient-text">Conquistas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">🏆 Primeira Lição</h3>
          <p className="text-muted-foreground">Complete sua primeira lição</p>
        </div>
        <div className="bg-card p-6 rounded-lg border opacity-50">
          <h3 className="font-semibold mb-2">🔒 Maratonista</h3>
          <p className="text-muted-foreground">Complete 10 lições consecutivas</p>
        </div>
      </div>
    </div>
  );
}