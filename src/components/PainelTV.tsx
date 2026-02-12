import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';

export function PainelTV() {
  const [senhasChamadas, setSenhasChamadas] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadSenhas();
    const interval = setInterval(loadSenhas, 2000); // Atualiza a cada 2 segundos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadSenhas = () => {
    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    const chamadas = senhas.filter((s: any) => 
      s.status === 'chamando' || s.status === 'atendendo'
    ).slice(-6); // Últimas 6 senhas
    setSenhasChamadas(chamadas.reverse());
  };

  const setorNomes: Record<string, string> = {
    secretaria: 'Secretaria Acadêmica',
    ti: 'Tecnologia da Informação',
    biblioteca: 'Biblioteca',
    assistencia: 'Assistência Estudantil',
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">CampusFlow</h1>
        <div className="text-2xl opacity-90">
          <p>{formatDate(currentTime)}</p>
          <p className="text-4xl font-bold mt-2">{formatTime(currentTime)}</p>
        </div>
      </div>

      {/* Senhas Chamadas */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {senhasChamadas.length === 0 ? (
            <div className="lg:col-span-2 text-center py-20">
              <Volume2 className="w-24 h-24 mx-auto mb-6 opacity-50" />
              <p className="text-3xl opacity-75">Aguardando próximo atendimento...</p>
            </div>
          ) : (
            senhasChamadas.map((senha, index) => (
              <div
                key={senha.numero}
                className={`rounded-xl shadow-2xl overflow-hidden transform transition-all ${
                  index === 0 && senha.status === 'chamando'
                    ? 'ring-8 ring-yellow-400 animate-pulse scale-105'
                    : 'opacity-75'
                }`}
              >
                <div className={`p-8 ${
                  senha.status === 'chamando'
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {senha.status === 'chamando' && (
                        <Volume2 className="w-8 h-8 animate-pulse" />
                      )}
                      <span className="text-xl font-medium">
                        {senha.status === 'chamando' ? 'CHAMANDO AGORA' : 'Em Atendimento'}
                      </span>
                    </div>
                    {senha.tipo === 'prioritaria' && (
                      <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                        PRIORITÁRIA
                      </span>
                    )}
                  </div>

                  <div className="text-center my-8">
                    <p className="text-xl mb-2 opacity-90">Senha</p>
                    <p className="text-8xl font-bold tracking-wider">{senha.numero}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-medium">{setorNomes[senha.setor]}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Instruções */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
          <p className="text-2xl font-medium mb-3">Instruções</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
            <div>
              <p className="font-bold mb-2">1️⃣ Aguarde sua senha</p>
              <p className="opacity-90">Acompanhe o painel e seu celular</p>
            </div>
            <div>
              <p className="font-bold mb-2">2️⃣ Fique atento ao chamado</p>
              <p className="opacity-90">Sua senha aparecerá destacada</p>
            </div>
            <div>
              <p className="font-bold mb-2">3️⃣ Apresente-se em 3 minutos</p>
              <p className="opacity-90">Evite perder sua vez</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
