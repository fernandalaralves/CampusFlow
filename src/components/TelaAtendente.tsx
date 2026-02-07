import { useState, useEffect } from 'react';
import { Phone, UserCheck, UserX, Clock, MessageSquare, Save, RotateCcw } from 'lucide-react';

export function TelaAtendente() {
  const [selectedSetor, setSelectedSetor] = useState('secretaria');
  const [senhaAtual, setSenhaAtual] = useState<any>(null);
  const [fila, setFila] = useState<any[]>([]);
  const [desfecho, setDesfecho] = useState('');
  const [observacao, setObservacao] = useState('');
  const [comportamentoAusencia, setComportamentoAusencia] = useState<'fila' | 'cancelar'>('fila');

  const setores = [
    { id: 'secretaria', nome: 'Secretaria' },
    { id: 'ti', nome: 'TI' },
    { id: 'biblioteca', nome: 'Biblioteca' },
    { id: 'assistencia', nome: 'Assistência' },
  ];

  const desfechos = [
    'Atendimento realizado com sucesso',
    'Encaminhado para outro setor',
    'Documentação incompleta',
    'Solicitação não pode ser atendida',
    'Reagendado',
  ];

  useEffect(() => {
    loadFila();
    const interval = setInterval(loadFila, 2000);
    return () => clearInterval(interval);
  }, [selectedSetor]);

  const loadFila = () => {
    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    const filaSetor = senhas.filter((s: any) => 
      s.setor === selectedSetor && 
      (s.status === 'aguardando' || s.status === 'chamando')
    );
    setFila(filaSetor);

    // Atualiza senha atual se ainda estiver ativa
    if (senhaAtual) {
      const atualizada = senhas.find((s: any) => s.numero === senhaAtual.numero);
      if (atualizada) {
        setSenhaAtual(atualizada);
      }
    }
  };

  // RN01: Implementa intercalação 2 prioritárias para 1 normal
  const getNextPassword = () => {
    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    const aguardando = senhas.filter((s: any) => 
      s.setor === selectedSetor && s.status === 'aguardando'
    );

    if (aguardando.length === 0) return null;

    const prioritarias = aguardando.filter((s: any) => s.tipo === 'prioritaria');
    const normais = aguardando.filter((s: any) => s.tipo === 'normal');

    // Conta quantas foram chamadas/atendidas para aplicar regra de intercalação
    const processadas = senhas.filter((s: any) => 
      s.setor === selectedSetor && 
      (s.status === 'concluido' || s.status === 'ausente' || s.status === 'atendendo')
    );
    
    const prioritariasProcessadas = processadas.filter((s: any) => s.tipo === 'prioritaria').length;
    const normaisProcessadas = processadas.filter((s: any) => s.tipo === 'normal').length;

    // RN01: Lógica de intercalação 2:1
    // A cada ciclo de 3 senhas, devem ser 2 prioritárias e 1 normal
    const posicaoNoCiclo = (prioritariasProcessadas + normaisProcessadas) % 3;

    // Posições 0 e 1 do ciclo: chama prioritária (se tiver)
    // Posição 2 do ciclo: chama normal (se tiver)
    if (posicaoNoCiclo < 2) {
      // Deve chamar prioritária
      if (prioritarias.length > 0) {
        return prioritarias[0];
      }
      // Se não tem prioritária, chama normal
      return normais[0] || null;
    } else {
      // Deve chamar normal
      if (normais.length > 0) {
        return normais[0];
      }
      // Se não tem normal, chama prioritária
      return prioritarias[0] || null;
    }
  };

  const chamarProximo = () => {
    const proxima = getNextPassword();
    if (!proxima) return;

    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    const index = senhas.findIndex((s: any) => s.numero === proxima.numero);
    
    if (index !== -1) {
      senhas[index].status = 'chamando';
      senhas[index].chamadaEm = new Date().toISOString();
      localStorage.setItem('senhas', JSON.stringify(senhas));
      setSenhaAtual(senhas[index]);
      loadFila();

      // RN04: Aplica timeout de 3 minutos
      setTimeout(() => {
        const currentSenhas = JSON.parse(localStorage.getItem('senhas') || '[]');
        const currentIndex = currentSenhas.findIndex((s: any) => s.numero === proxima.numero);
        if (currentIndex !== -1 && currentSenhas[currentIndex].status === 'chamando') {
          // RN04: Verifica comportamento configurado para ausência
          const tentativas = currentSenhas[currentIndex].tentativasChamada || 0;
          
          if (comportamentoAusencia === 'fila' && tentativas === 0) {
            // Primeira ausência: volta para o final da fila
            currentSenhas[currentIndex].status = 'aguardando';
            currentSenhas[currentIndex].tentativasChamada = 1;
            currentSenhas[currentIndex].posicao = currentSenhas.filter((s: any) => 
              s.setor === selectedSetor && s.status === 'aguardando'
            ).length + 1;
          } else {
            // Segunda ausência ou configuração para cancelar: marca como ausente
            currentSenhas[currentIndex].status = 'ausente';
          }
          
          localStorage.setItem('senhas', JSON.stringify(currentSenhas));
          if (senhaAtual?.numero === proxima.numero) {
            setSenhaAtual(null);
          }
          loadFila();
        }
      }, 180000); // 3 minutos
    }
  };

  const iniciarAtendimento = () => {
    if (!senhaAtual) return;

    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    const index = senhas.findIndex((s: any) => s.numero === senhaAtual.numero);
    
    if (index !== -1) {
      senhas[index].status = 'atendendo';
      senhas[index].atendimentoEm = new Date().toISOString();
      localStorage.setItem('senhas', JSON.stringify(senhas));
      setSenhaAtual(senhas[index]);
      loadFila();
    }
  };

  const marcarAusente = () => {
    if (!senhaAtual) return;

    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    const index = senhas.findIndex((s: any) => s.numero === senhaAtual.numero);
    
    if (index !== -1) {
      const tentativas = senhas[index].tentativasChamada || 0;
      
      // RN04: Primeira ausência -> volta para fila, Segunda -> cancela
      if (comportamentoAusencia === 'fila' && tentativas === 0) {
        senhas[index].status = 'aguardando';
        senhas[index].tentativasChamada = 1;
        senhas[index].posicao = senhas.filter((s: any) => 
          s.setor === selectedSetor && s.status === 'aguardando'
        ).length + 1;
        alert('Senha movida para o final da fila (primeira ausência)');
      } else {
        senhas[index].status = 'ausente';
        senhas[index].ausenteEm = new Date().toISOString();
        alert('Senha cancelada por ausência');
      }
      
      localStorage.setItem('senhas', JSON.stringify(senhas));
      setSenhaAtual(null);
      loadFila();
    }
  };

  const finalizarAtendimento = () => {
    if (!senhaAtual || !desfecho) return;

    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    const index = senhas.findIndex((s: any) => s.numero === senhaAtual.numero);
    
    if (index !== -1) {
      senhas[index].status = 'concluido';
      senhas[index].desfecho = desfecho;
      senhas[index].observacao = observacao;
      senhas[index].concluidoEm = new Date().toISOString();
      localStorage.setItem('senhas', JSON.stringify(senhas));
      setSenhaAtual(null);
      setDesfecho('');
      setObservacao('');
      loadFila();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seleção de Setor */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Setor de Atendimento</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {setores.map((setor) => (
                <button
                  key={setor.id}
                  onClick={() => setSelectedSetor(setor.id)}
                  className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                    selectedSetor === setor.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {setor.nome}
                </button>
              ))}
            </div>

            {/* RN04: Configuração de Comportamento de Ausência */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">RN04 - Comportamento para Ausência</h4>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="ausencia"
                    checked={comportamentoAusencia === 'fila'}
                    onChange={() => setComportamentoAusencia('fila')}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Mover para final da fila</span>
                    <p className="text-sm text-gray-600">
                      1ª ausência: retorna ao final. 2ª ausência: cancela
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="ausencia"
                    checked={comportamentoAusencia === 'cancelar'}
                    onChange={() => setComportamentoAusencia('cancelar')}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Cancelar imediatamente</span>
                    <p className="text-sm text-gray-600">
                      Qualquer ausência cancela a senha definitivamente
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Senha Atual */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Atendimento Atual</h3>
            
            {!senhaAtual ? (
              <div className="text-center py-12">
                <Phone className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-6">Nenhum atendimento em andamento</p>
                <button
                  onClick={chamarProximo}
                  disabled={fila.length === 0}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Chamar Próximo (RN01)
                </button>
                {fila.length === 0 && (
                  <p className="text-sm text-gray-500 mt-3">Nenhuma senha aguardando</p>
                )}
              </div>
            ) : (
              <div>
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 mb-6">
                  <div className="text-center mb-4">
                    <p className="text-sm opacity-90 mb-2">Senha Atual</p>
                    <h2 className="text-5xl font-bold mb-2">{senhaAtual.numero}</h2>
                    <p className="text-sm opacity-90">
                      Tipo: {senhaAtual.tipo === 'prioritaria' ? '⭐ Prioritária' : 'Normal'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/10 backdrop-blur-sm rounded p-2">
                      <p className="opacity-75">CPF/Matrícula</p>
                      <p className="font-semibold">{senhaAtual.userIdentification || 'N/A'}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded p-2">
                      <p className="opacity-75">Tentativas</p>
                      <p className="font-semibold">{senhaAtual.tentativasChamada || 0} de 1</p>
                    </div>
                  </div>

                  {senhaAtual.tentativasChamada > 0 && (
                    <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-300 rounded-lg">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        ÚLTIMA CHAMADA (voltou da fila)
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {senhaAtual.status === 'chamando' && (
                    <div className="flex gap-3">
                      <button
                        onClick={iniciarAtendimento}
                        className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <UserCheck className="w-5 h-5" />
                        Aluno Presente
                      </button>
                      <button
                        onClick={marcarAusente}
                        className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <UserX className="w-5 h-5" />
                        Ausente (RN04)
                      </button>
                    </div>
                  )}

                  {senhaAtual.status === 'atendendo' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-medium text-gray-900 mb-2">
                          Desfecho do Atendimento
                        </label>
                        <select
                          value={desfecho}
                          onChange={(e) => setDesfecho(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        >
                          <option value="">Selecione...</option>
                          {desfechos.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-medium text-gray-900 mb-2">
                          Observações (opcional)
                        </label>
                        <textarea
                          value={observacao}
                          onChange={(e) => setObservacao(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                          placeholder="Detalhes adicionais..."
                        />
                      </div>

                      <button
                        onClick={finalizarAtendimento}
                        disabled={!desfecho}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        Finalizar Atendimento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fila */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Fila de Espera</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {fila.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma senha aguardando</p>
            ) : (
              fila.map((senha, index) => (
                <div
                  key={senha.numero}
                  className={`p-3 rounded-lg border-2 ${
                    senha.tipo === 'prioritaria'
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{senha.numero}</p>
                      <p className="text-xs text-gray-600">
                        {senha.tipo === 'prioritaria' ? '⭐ Prioritária' : 'Normal'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">#{index + 1}</p>
                      <p className="text-xs text-gray-600">na fila</p>
                    </div>
                  </div>
                  {senha.tentativasChamada > 0 && (
                    <div className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                      <RotateCcw className="w-3 h-3" />
                      <span>Retornou à fila</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Info RN01 */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-gray-700 font-semibold mb-1">
              RN01 - Intercalação Inteligente
            </p>
            <p className="text-xs text-gray-600">
              Sistema chama automaticamente 2 senhas prioritárias para cada 1 normal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}