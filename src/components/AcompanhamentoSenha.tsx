import { useState, useEffect } from 'react';
import { Clock, Users, MapPin, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

interface AcompanhamentoSenhaProps {
  passwordNumber: string | null;
  onBackToEmission: () => void;
}

export function AcompanhamentoSenha({ passwordNumber, onBackToEmission }: AcompanhamentoSenhaProps) {
  const [senhaInfo, setSenhaInfo] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (passwordNumber) {
        const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
        const info = senhas.find((s: any) => s.numero === passwordNumber);
        setSenhaInfo(info);

        // RN03: Calcula tempo restante se estiver chamando
        if (info?.status === 'chamando' && info?.chamadaEm) {
          const chamada = new Date(info.chamadaEm);
          const agora = new Date();
          const passado = Math.floor((agora.getTime() - chamada.getTime()) / 1000);
          const restante = Math.max(0, 180 - passado); // 3 minutos = 180 segundos
          setTempoRestante(restante);
        } else {
          setTempoRestante(null);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [passwordNumber]);

  if (!senhaInfo) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600">Senha não encontrada</p>
          <button
            onClick={onBackToEmission}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const setorNomes: Record<string, string> = {
    secretaria: 'Secretaria Acadêmica',
    ti: 'Tecnologia da Informação',
    biblioteca: 'Biblioteca',
    assistencia: 'Assistência Estudantil',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aguardando': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'chamando': return 'bg-green-100 text-green-800 border-green-300';
      case 'atendendo': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ausente': return 'bg-red-100 text-red-800 border-red-300';
      case 'concluido': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string, tentativas: number) => {
    switch (status) {
      case 'aguardando': return 'Aguardando na fila';
      case 'chamando': return tentativas > 0 ? 'ÚLTIMA CHAMADA! Dirija-se ao atendimento' : 'VOCÊ FOI CHAMADO! Dirija-se ao atendimento';
      case 'atendendo': return 'Em atendimento';
      case 'ausente': return 'Ausente - Senha cancelada';
      case 'concluido': return 'Atendimento concluído';
      default: return status;
    }
  };

  const emissaoTime = new Date(senhaInfo.emissao);
  const waitingTime = Math.floor((currentTime.getTime() - emissaoTime.getTime()) / 1000 / 60);

  const formatTempoRestante = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={onBackToEmission}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Nova Senha
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header com Senha */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 text-center">
          <p className="text-sm font-medium mb-2 opacity-90">Sua Senha</p>
          <h1 className="text-6xl font-bold mb-2">{senhaInfo.numero}</h1>
          <p className="text-sm opacity-90">{setorNomes[senhaInfo.setor]}</p>
        </div>

        {/* Status Atual */}
        <div className="p-6">
          <div className={`p-4 rounded-lg border-2 mb-6 ${getStatusColor(senhaInfo.status)}`}>
            <div className="flex items-center justify-center gap-2">
              {senhaInfo.status === 'chamando' && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
              <p className="font-semibold text-center">{getStatusText(senhaInfo.status, senhaInfo.tentativasChamada || 0)}</p>
            </div>
          </div>

          {/* Informações */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Users className="w-6 h-6 mx-auto text-gray-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{senhaInfo.posicao || 0}</p>
              <p className="text-sm text-gray-600">Posição na Fila</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="w-6 h-6 mx-auto text-gray-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{waitingTime}min</p>
              <p className="text-sm text-gray-600">Tempo de Espera</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-6 h-6 mx-auto text-gray-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{senhaInfo.tipo === 'prioritaria' ? 'P' : 'N'}</p>
              <p className="text-sm text-gray-600">Tipo</p>
            </div>
          </div>

          {/* RN04: Timeout com contador */}
          {senhaInfo.status === 'chamando' && tempoRestante !== null && (
            <div className={`p-4 border-2 rounded-lg mb-6 ${
              tempoRestante <= 60 ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-6 h-6 mt-0.5 ${tempoRestante <= 60 ? 'text-red-600' : 'text-orange-600'}`} />
                <div className="flex-1">
                  <p className={`font-bold mb-1 ${tempoRestante <= 60 ? 'text-red-900' : 'text-orange-900'}`}>
                    {senhaInfo.tentativasChamada > 0 ? '⚠️ ÚLTIMA CHAMADA!' : 'Atenção - Compareça imediatamente!'}
                  </p>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm ${tempoRestante <= 60 ? 'text-red-700' : 'text-orange-700'}`}>
                      Tempo restante para comparecer:
                    </p>
                    <p className={`text-3xl font-bold ${tempoRestante <= 60 ? 'text-red-700 animate-pulse' : 'text-orange-700'}`}>
                      {formatTempoRestante(tempoRestante)}
                    </p>
                  </div>
                  {senhaInfo.tentativasChamada > 0 ? (
                    <p className="text-sm text-red-700 mt-2 font-semibold">
                      ⚠️ Esta é sua última chance! Se não comparecer, sua senha será cancelada.
                    </p>
                  ) : (
                    <p className="text-sm text-orange-700 mt-2">
                      RN04: Se não comparecer em 3 minutos, você irá para o final da fila.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RN04: Mensagem se voltou para a fila */}
          {senhaInfo.tentativasChamada > 0 && senhaInfo.status === 'aguardando' && (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">Você perdeu sua chamada</p>
                  <p className="text-sm text-yellow-700">
                    Sua senha foi movida para o final da fila. Esta é sua última oportunidade de atendimento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-2">Instruções:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Aguarde sua senha ser chamada no painel</li>
                  <li>Você pode acompanhar em tempo real sua posição na fila</li>
                  <li>Mantenha-se próximo ao setor de atendimento</li>
                  <li>Quando chamado, apresente-se em até 3 minutos (RN04)</li>
                  <li>Se perder a primeira chamada, irá para o final da fila</li>
                  <li>Na segunda ausência, sua senha será cancelada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}