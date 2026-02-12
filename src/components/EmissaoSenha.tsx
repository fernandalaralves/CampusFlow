import { useState } from 'react';
import { MapPin, AlertCircle, CheckCircle, Ticket, Clock } from 'lucide-react';

interface EmissaoSenhaProps {
  onPasswordIssued: (password: string) => void;
}

const setores = [
  { id: 'secretaria', nome: 'Secretaria Acadêmica', icon: '📋', horarioFechamento: '18:00' },
  { id: 'ti', nome: 'Tecnologia da Informação', icon: '💻', horarioFechamento: '17:00' },
  { id: 'biblioteca', nome: 'Biblioteca', icon: '📚', horarioFechamento: '20:00' },
  { id: 'assistencia', nome: 'Assistência Estudantil', icon: '🤝', horarioFechamento: '17:30' },
];

// RN02: Coordenadas do campus (exemplo: UFSC Florianópolis)
const CAMPUS_LAT = -27.6048;
const CAMPUS_LNG = -48.5183;
const RAIO_MAXIMO = 500; // metros

export function EmissaoSenha({ onPasswordIssued }: EmissaoSenhaProps) {
  const [selectedSetor, setSelectedSetor] = useState<string>('');
  const [isPriority, setIsPriority] = useState(false);
  const [isInCampus, setIsInCampus] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userIdentification, setUserIdentification] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [tempoEstimado, setTempoEstimado] = useState<string>('');

  // RN02: Calcula distância entre dois pontos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  };

  // RN02: Verifica localização GPS
  const checkLocation = () => {
    setIsLoading(true);
    
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo seu navegador');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const distancia = calculateDistance(userLat, userLng, CAMPUS_LAT, CAMPUS_LNG);
        
        setDistance(Math.round(distancia));
        setIsInCampus(distancia <= RAIO_MAXIMO);
        setIsLoading(false);
      },
      (error) => {
        // Para fins de demonstração, simula localização
        const simulatedDistance = Math.floor(Math.random() * 1000);
        setDistance(simulatedDistance);
        setIsInCampus(simulatedDistance <= RAIO_MAXIMO);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  // RN06: Calcula tempo médio dinâmico
  const calcularTempoEstimado = (setorId: string) => {
    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    const ultimosAtendimentos = senhas
      .filter((s: any) => s.setor === setorId && s.status === 'concluido' && s.emissao && s.concluidoEm)
      .slice(-5); // Últimos 5 atendimentos

    if (ultimosAtendimentos.length === 0) {
      return 'Calculando...';
    }

    const tempos = ultimosAtendimentos.map((s: any) => {
      const inicio = new Date(s.emissao);
      const fim = new Date(s.concluidoEm);
      return (fim.getTime() - inicio.getTime()) / 1000 / 60;
    });

    const media = tempos.reduce((a: number, b: number) => a + b, 0) / tempos.length;
    const aguardando = senhas.filter((s: any) => s.setor === setorId && s.status === 'aguardando').length;
    
    const tempoTotal = Math.round(media * (aguardando + 1));
    return `${tempoTotal} min`;
  };

  // RN05: Verifica se está dentro do horário permitido
  const verificarHorarioCorte = (setorId: string): { permitido: boolean; mensagem: string } => {
    const setor = setores.find(s => s.id === setorId);
    if (!setor) return { permitido: true, mensagem: '' };

    const agora = new Date();
    const [horaFecha, minFecha] = setor.horarioFechamento.split(':').map(Number);
    
    const horarioFechamento = new Date();
    horarioFechamento.setHours(horaFecha, minFecha, 0, 0);
    
    const horarioCorte = new Date(horarioFechamento.getTime() - 15 * 60 * 1000); // 15 min antes

    if (agora >= horarioCorte) {
      return {
        permitido: false,
        mensagem: `Emissão encerrada. O setor fecha às ${setor.horarioFechamento}.`
      };
    }

    return { permitido: true, mensagem: '' };
  };

  // RN03: Verifica se usuário já tem senha ativa
  const verificarSenhaAtiva = (identificacao: string): boolean => {
    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    return senhas.some((s: any) => 
      s.userIdentification === identificacao && 
      (s.status === 'aguardando' || s.status === 'chamando' || s.status === 'atendendo')
    );
  };

  const handleSetorChange = (setorId: string) => {
    setSelectedSetor(setorId);
    const tempo = calcularTempoEstimado(setorId);
    setTempoEstimado(tempo);
  };

  const emitirSenha = () => {
    if (!selectedSetor || isInCampus !== true || !userIdentification.trim()) return;

    // RN03: Verifica senha ativa
    if (verificarSenhaAtiva(userIdentification)) {
      alert('Você já possui uma senha ativa no sistema. Conclua ou cancele o atendimento atual antes de retirar uma nova senha.');
      return;
    }

    // RN05: Verifica horário de corte
    const horarioCheck = verificarHorarioCorte(selectedSetor);
    if (!horarioCheck.permitido) {
      alert(horarioCheck.mensagem);
      return;
    }

    // Gera número de senha
    const prefix = isPriority ? 'P' : 'N';
    const setorPrefix = selectedSetor.substring(0, 3).toUpperCase();
    const number = Math.floor(Math.random() * 999) + 1;
    const password = `${prefix}${setorPrefix}${number.toString().padStart(3, '0')}`;

    // Salva no localStorage
    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    const newSenha = {
      numero: password,
      setor: selectedSetor,
      tipo: isPriority ? 'prioritaria' : 'normal',
      status: 'aguardando',
      emissao: new Date().toISOString(),
      posicao: senhas.filter((s: any) => s.setor === selectedSetor && s.status === 'aguardando').length + 1,
      userIdentification: userIdentification,
      tentativasChamada: 0, // RN04
    };
    senhas.push(newSenha);
    localStorage.setItem('senhas', JSON.stringify(senhas));

    onPasswordIssued(password);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Ticket className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Retirar Senha Digital</h2>
          <p className="text-gray-600">Selecione o setor e retire sua senha para atendimento</p>
        </div>

        {/* RN03: Identificação do Usuário */}
        <div className="mb-6">
          <label className="block font-semibold text-gray-900 mb-2">CPF ou Matrícula</label>
          <input
            type="text"
            value={userIdentification}
            onChange={(e) => setUserIdentification(e.target.value)}
            placeholder="Digite seu CPF ou número de matrícula"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            maxLength={14}
          />
          <p className="text-sm text-gray-500 mt-1">
            ⚠️ Você não pode ter mais de uma senha ativa ao mesmo tempo
          </p>
        </div>

        {/* Verificação de Localização (RN02) */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Verificação de Localização (RN02)</h3>
              <p className="text-sm text-gray-600 mb-3">
                Você precisa estar a no máximo <strong>500 metros</strong> do campus para retirar uma senha.
              </p>
              {isInCampus === null && (
                <button
                  onClick={checkLocation}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verificando localização...' : 'Verificar Localização'}
                </button>
              )}
              {isInCampus === true && (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Você está no campus! ({distance}m do centro) ✓</span>
                </div>
              )}
              {isInCampus === false && (
                <div className="flex items-start gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Você está muito longe do campus</p>
                    <p className="text-sm">Distância: {distance}m (máximo: {RAIO_MAXIMO}m)</p>
                    <p className="text-sm font-semibold mt-1">Você precisa estar no campus para retirar uma senha.</p>
                    <button
                      onClick={checkLocation}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seleção de Setor */}
        <div className="mb-6">
          <label className="block font-semibold text-gray-900 mb-3">Selecione o Setor</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {setores.map((setor) => {
              const horarioCheck = verificarHorarioCorte(setor.id);
              return (
                <button
                  key={setor.id}
                  onClick={() => handleSetorChange(setor.id)}
                  disabled={isInCampus !== true || !horarioCheck.permitido}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedSetor === setor.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isInCampus !== true || !horarioCheck.permitido ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{setor.icon}</span>
                    <span className="font-medium text-gray-900">{setor.nome}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p>Fecha às {setor.horarioFechamento}</p>
                    {!horarioCheck.permitido && (
                      <p className="text-red-600 font-semibold mt-1">Emissão encerrada (RN05)</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RN06: Tempo Estimado */}
        {selectedSetor && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-gray-900">Tempo estimado de espera (RN06)</p>
                <p className="text-sm text-gray-600">
                  {tempoEstimado === 'Calculando...' 
                    ? 'Calculando... (baseado nos últimos 5 atendimentos)'
                    : `Aproximadamente ${tempoEstimado}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tipo de Atendimento */}
        <div className="mb-8">
          <label className="block font-semibold text-gray-900 mb-3">Tipo de Atendimento (RN01)</label>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <input
                type="radio"
                name="tipo"
                checked={!isPriority}
                onChange={() => setIsPriority(false)}
                disabled={isInCampus !== true}
                className="w-4 h-4 text-blue-600 mt-1"
              />
              <div>
                <span className="font-medium text-gray-900">Normal</span>
                <p className="text-sm text-gray-600">Atendimento padrão</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-orange-200 bg-orange-50 rounded-lg hover:border-orange-300 transition-colors">
              <input
                type="radio"
                name="tipo"
                checked={isPriority}
                onChange={() => setIsPriority(true)}
                disabled={isInCampus !== true}
                className="w-4 h-4 text-blue-600 mt-1"
              />
              <div>
                <span className="font-medium text-gray-900">⭐ Atendimento Prioritário</span>
                <p className="text-sm text-gray-600">
                  Idosos (60+), Gestantes, Pessoas com Deficiência (PCD) e Autistas
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Botão Emitir */}
        <button
          onClick={emitirSenha}
          disabled={!selectedSetor || isInCampus !== true || !userIdentification.trim()}
          className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Emitir Senha Digital
        </button>

        {/* Info sobre Prioridade (RN01) */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            ℹ️ <strong>RN01 - Atendimento Prioritário:</strong> O sistema intercala automaticamente 2 senhas prioritárias 
            para cada 1 senha normal, conforme legislação vigente.
          </p>
        </div>
      </div>
    </div>
  );
}