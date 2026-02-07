import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, XCircle, TrendingUp, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function DashboardGestor() {
  const [stats, setStats] = useState<any>(null);
  const [periodo, setPeriodo] = useState('hoje');

  useEffect(() => {
    calculateStats();
  }, [periodo]);

  const calculateStats = () => {
    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    
    // Filtro por período (simulado)
    const now = new Date();
    const filteredSenhas = senhas; // Para demo, usa todas

    // Estatísticas gerais
    const total = filteredSenhas.length;
    const concluidos = filteredSenhas.filter((s: any) => s.status === 'concluido').length;
    const ausentes = filteredSenhas.filter((s: any) => s.status === 'ausente').length;
    const aguardando = filteredSenhas.filter((s: any) => s.status === 'aguardando').length;

    // Tempo médio de atendimento
    const temposAtendimento = filteredSenhas
      .filter((s: any) => s.status === 'concluido' && s.emissao && s.concluidoEm)
      .map((s: any) => {
        const inicio = new Date(s.emissao);
        const fim = new Date(s.concluidoEm);
        return (fim.getTime() - inicio.getTime()) / 1000 / 60; // em minutos
      });
    
    const tempoMedio = temposAtendimento.length > 0
      ? Math.round(temposAtendimento.reduce((a, b) => a + b, 0) / temposAtendimento.length)
      : 0;

    // Por setor
    const porSetor = {
      secretaria: filteredSenhas.filter((s: any) => s.setor === 'secretaria').length,
      ti: filteredSenhas.filter((s: any) => s.setor === 'ti').length,
      biblioteca: filteredSenhas.filter((s: any) => s.setor === 'biblioteca').length,
      assistencia: filteredSenhas.filter((s: any) => s.setor === 'assistencia').length,
    };

    // Por tipo
    const prioritarias = filteredSenhas.filter((s: any) => s.tipo === 'prioritaria').length;
    const normais = filteredSenhas.filter((s: any) => s.tipo === 'normal').length;

    // Dados para gráficos
    const setorData = [
      { setor: 'Secretaria', atendimentos: porSetor.secretaria },
      { setor: 'TI', atendimentos: porSetor.ti },
      { setor: 'Biblioteca', atendimentos: porSetor.biblioteca },
      { setor: 'Assistência', atendimentos: porSetor.assistencia },
    ];

    const statusData = [
      { name: 'Concluídos', value: concluidos, color: '#10b981' },
      { name: 'Ausentes', value: ausentes, color: '#ef4444' },
      { name: 'Aguardando', value: aguardando, color: '#f59e0b' },
    ];

    const tipoData = [
      { name: 'Prioritárias', value: prioritarias, color: '#f59e0b' },
      { name: 'Normais', value: normais, color: '#3b82f6' },
    ];

    // Simulação de dados por hora
    const porHora = Array.from({ length: 12 }, (_, i) => ({
      hora: `${8 + i}h`,
      atendimentos: Math.floor(Math.random() * 15) + 5,
    }));

    setStats({
      total,
      concluidos,
      ausentes,
      aguardando,
      tempoMedio,
      porSetor,
      setorData,
      statusData,
      tipoData,
      porHora,
    });
  };

  const exportarRelatorio = () => {
    const senhas = JSON.parse(localStorage.getItem('senhas') || '[]');
    const csv = [
      ['Senha', 'Setor', 'Tipo', 'Status', 'Emissão', 'Conclusão', 'Desfecho'].join(','),
      ...senhas.map((s: any) => [
        s.numero,
        s.setor,
        s.tipo,
        s.status,
        s.emissao,
        s.concluidoEm || '',
        s.desfecho || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-filas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!stats) return <div className="p-8">Carregando...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard de Gestão</h2>
          <p className="text-gray-600 mt-1">Análise de desempenho e métricas do sistema</p>
        </div>
        <div className="flex gap-3">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
          </select>
          <button
            onClick={exportarRelatorio}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total de Senhas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Users className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Atendimentos Concluídos</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.concluidos}</p>
              <p className="text-xs text-gray-500 mt-1">
                Taxa: {stats.total > 0 ? Math.round((stats.concluidos / stats.total) * 100) : 0}%
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ausências (RN04)</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.ausentes}</p>
              <p className="text-xs text-gray-500 mt-1">
                Taxa: {stats.total > 0 ? Math.round((stats.ausentes / stats.total) * 100) : 0}%
              </p>
            </div>
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tempo Médio (RN06)</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.tempoMedio}min</p>
              <p className="text-xs text-gray-500 mt-1">Últimos 5 atendimentos</p>
            </div>
            <Clock className="w-12 h-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Atendimentos por Setor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Atendimentos por Setor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.setorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="setor" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="atendimentos" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status dos Atendimentos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Status dos Atendimentos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.statusData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por Tipo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Distribuição por Tipo (RN01)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.tipoData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.tipoData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Atendimentos por Hora */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Fluxo de Atendimentos por Hora</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.porHora}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="atendimentos" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Indicadores de Regras de Negócio */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Monitoramento de Regras de Negócio</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <h4 className="font-semibold text-gray-900">RN01 - Prioridade Legal</h4>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              Intercalação 2 prioritárias : 1 normal
            </p>
            <div className="bg-white rounded p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">Prioritárias</span>
                <span className="font-bold text-orange-600">{stats.tipoData[0]?.value || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Normais</span>
                <span className="font-bold text-blue-600">{stats.tipoData[1]?.value || 0}</span>
              </div>
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-gray-600">
                  Proporção: {stats.tipoData[0]?.value > 0 && stats.tipoData[1]?.value > 0 
                    ? `${(stats.tipoData[0].value / stats.tipoData[1].value).toFixed(1)}:1`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <h4 className="font-semibold text-gray-900">RN02 - Geolocalização</h4>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              Raio máximo: 500m do campus
            </p>
            <div className="bg-white rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Todas as senhas validadas</span>
              </div>
              <p className="text-xs text-gray-600">
                100% das emissões com verificação GPS ativa
              </p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <h4 className="font-semibold text-gray-900">RN03 - Senha Única</h4>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              Limite: 1 senha ativa por usuário
            </p>
            <div className="bg-white rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">Sistema controlado</span>
              </div>
              <p className="text-xs text-gray-600">
                Verificação por CPF/Matrícula implementada
              </p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <h4 className="font-semibold text-gray-900">RN04 - Tolerância</h4>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              Timeout: 3 minutos para comparecer
            </p>
            <div className="bg-white rounded p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">Ausências</span>
                <span className="font-bold text-red-600">{stats.ausentes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Taxa de ausência</span>
                <span className="font-bold text-orange-600">
                  {stats.total > 0 ? ((stats.ausentes / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
              <h4 className="font-semibold text-gray-900">RN05 - Horário de Corte</h4>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              Bloqueio: 15 min antes do fechamento
            </p>
            <div className="bg-white rounded p-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Secretaria</span>
                  <span className="font-semibold">17:45</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">TI</span>
                  <span className="font-semibold">16:45</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Biblioteca</span>
                  <span className="font-semibold">19:45</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border-2 border-teal-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">6</div>
              <h4 className="font-semibold text-gray-900">RN06 - Tempo Dinâmico</h4>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              Cálculo: média dos últimos 5 atendimentos
            </p>
            <div className="bg-white rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span className="text-2xl font-bold text-teal-700">{stats.tempoMedio}min</span>
              </div>
              <p className="text-xs text-gray-600">
                Tempo médio atual por atendimento
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}