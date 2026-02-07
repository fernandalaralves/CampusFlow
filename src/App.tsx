import { useState } from 'react';
import { EmissaoSenha } from './components/EmissaoSenha';
import { AcompanhamentoSenha } from './components/AcompanhamentoSenha';
import { TelaAtendente } from './components/TelaAtendente';
import { PainelTV } from './components/PainelTV';
import { DashboardGestor } from './components/DashboardGestor';
import { Users, Monitor, UserCog, BarChart3 } from 'lucide-react';

type Screen = 'emissao' | 'acompanhamento' | 'atendente' | 'painel' | 'gestor';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('emissao');
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);

  const handlePasswordIssued = (password: string) => {
    setCurrentPassword(password);
    setCurrentScreen('acompanhamento');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="font-semibold text-xl text-gray-900">Sistema de Filas - Campus</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentScreen('emissao')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentScreen === 'emissao' || currentScreen === 'acompanhamento'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Aluno</span>
              </button>
              <button
                onClick={() => setCurrentScreen('atendente')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentScreen === 'atendente'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <UserCog className="w-4 h-4" />
                <span className="hidden sm:inline">Atendente</span>
              </button>
              <button
                onClick={() => setCurrentScreen('painel')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentScreen === 'painel'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">Painel</span>
              </button>
              <button
                onClick={() => setCurrentScreen('gestor')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentScreen === 'gestor'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Gestor</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Screen Content */}
      <main>
        {currentScreen === 'emissao' && (
          <EmissaoSenha onPasswordIssued={handlePasswordIssued} />
        )}
        {currentScreen === 'acompanhamento' && (
          <AcompanhamentoSenha 
            passwordNumber={currentPassword} 
            onBackToEmission={() => setCurrentScreen('emissao')}
          />
        )}
        {currentScreen === 'atendente' && <TelaAtendente />}
        {currentScreen === 'painel' && <PainelTV />}
        {currentScreen === 'gestor' && <DashboardGestor />}
      </main>
    </div>
  );
}
