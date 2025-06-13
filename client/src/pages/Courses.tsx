import React from 'react';

export function Courses() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold gradient-text">Cursos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
          <h3 className="font-semibold mb-2">IA Básica</h3>
          <p className="text-muted-foreground mb-4">Fundamentos de Inteligência Artificial</p>
          <div className="text-sm text-primary">Iniciante • 120 XP</div>
        </div>
        <div className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow">
          <h3 className="font-semibold mb-2">Prompt Engineering</h3>
          <p className="text-muted-foreground mb-4">Técnicas avançadas de prompts</p>
          <div className="text-sm text-primary">Intermediário • 200 XP</div>
        </div>
      </div>
    </div>
  );
}