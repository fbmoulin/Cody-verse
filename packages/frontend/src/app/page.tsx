/**
 * CodyVerse Frontend - Página Principal
 */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center text-white p-8">
        <h1 className="text-6xl font-bold mb-6">
          CodyVerse
        </h1>
        <p className="text-xl mb-8 opacity-90">
          Plataforma educacional do futuro com IA e gamificação
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">🎓 Aprendizado Adaptativo</h3>
            <p className="opacity-80">
              IA personalizada que se adapta ao seu ritmo de aprendizado
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">🎮 Gamificação</h3>
            <p className="opacity-80">
              Sistema completo de badges, níveis e recompensas
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">🚀 Tecnologia Moderna</h3>
            <p className="opacity-80">
              Arquitetura modular com TypeScript e React
            </p>
          </div>
        </div>
        <div className="mt-12">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Começar Agora
          </button>
        </div>
      </div>
    </div>
  );
}