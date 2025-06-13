import React from 'react';

export function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold gradient-text">Configurações</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">Aparência</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tema</label>
              <select className="w-full p-2 border rounded-lg bg-background">
                <option>Padrão</option>
                <option>Cyberpunk</option>
                <option>Ocean</option>
                <option>Floresta</option>
                <option>Neon</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Idioma</label>
              <select className="w-full p-2 border rounded-lg bg-background">
                <option>Português</option>
                <option>English</option>
                <option>Español</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">Notificações</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Lembretes diários</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Conquistas</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded" />
              <span>Atualizações de progresso</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}