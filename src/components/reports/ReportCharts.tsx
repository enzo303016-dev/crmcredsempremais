import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  DollarSign, 
  CheckSquare, 
  MessageSquare, 
  PieChart, 
  Layers, 
  AlertCircle,
  Activity,
  ArrowRight
} from 'lucide-react';

interface FunnelData {
  leads: number | string;
  oportunidades: number | string;
  propostas: number | string;
  contratos: number | string;
  pagos: number | string;
}

interface SellerData {
  nome: string;
  producao_total: number;
  contratos_qtd: number;
}

interface CommissionData {
  previstas: number;
  aprovadas: number;
}

interface FinanceData {
  receita: number;
  despesas: number;
  comissoes: number;
  lucro_liquido: number;
}

interface TaskData {
  pendentes: number;
  concluidas: number;
  atrasadas: number;
}

interface WhatsAppData {
  conversas_abertas: number | string;
  conversas_encerradas: number | string;
  mensagens_total: number | string;
  mensagens_enviadas?: number | string;
  mensagens_recebidas?: number | string;
}

// Empty State helper
export const EmptyChartState: React.FC<{ message?: string }> = ({ 
  message = "Dados disponíveis após conexão com o servidor da API" 
}) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
    <AlertCircle className="w-6 h-6 text-slate-400 mb-2" />
    <span className="text-xs font-semibold text-slate-500">{message}</span>
    <span className="text-[10px] text-slate-400 mt-0.5">Indicador em espera de sincronização</span>
  </div>
);

// GRÁFICO 1 — Funil Comercial
export const CommercialFunnelChart: React.FC<{ data: FunnelData; hasRealData: boolean }> = ({ data, hasRealData }) => {
  const steps = [
    { label: '1. Leads Recebidos', value: data.leads, color: 'bg-[#034AA6]', text: 'text-[#034AA6]' },
    { label: '2. Oportunidades Criadas', value: data.oportunidades, color: 'bg-[#022859]', text: 'text-[#022859]' },
    { label: '3. Propostas em Análise', value: data.propostas, color: 'bg-[#F28907]', text: 'text-[#F28907]' },
    { label: '4. Contratos Emitidos', value: data.contratos, color: 'bg-[#F2B807]', text: 'text-[#F2B807]' },
    { label: '5. Pagos / Concluídos', value: data.pagos, color: 'bg-emerald-600', text: 'text-emerald-600' },
  ];

  const maxVal = Math.max(
    ...steps.map(s => (typeof s.value === 'number' ? s.value : 0)),
    1
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#022859] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#034AA6]" />
          Gráfico 1: Funil Comercial de Vendas
        </h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversão</span>
      </div>

      {!hasRealData ? (
        <EmptyChartState message="Aguardando dados da API de Funil Comercial" />
      ) : (
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const numericVal = typeof step.value === 'number' ? step.value : 0;
            const pct = maxVal > 0 ? Math.max((numericVal / maxVal) * 100, 4) : 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${step.color}`} />
                    {step.label}
                  </span>
                  <span className={`font-mono ${step.text}`}>
                    {step.value !== undefined && step.value !== null ? step.value : '—'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full ${step.color} transition-all duration-500 rounded-full`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// GRÁFICO 2 — Produção por Período
export const ProductionPeriodChart: React.FC<{ 
  periodo: string; 
  totalProducao: number | string; 
  hasRealData: boolean 
}> = ({ periodo, totalProducao, hasRealData }) => {
  const periodLabel = periodo === 'este_mes' ? 'Este Mês' : periodo === 'ultimos_7_dias' ? 'Últimos 7 dias' : 'Mês Anterior';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#022859] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#F2B807]" />
          Gráfico 2: Produção por Período ({periodLabel})
        </h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volume Financeiro</span>
      </div>

      {!hasRealData ? (
        <EmptyChartState message="Aguardando dados da API de Produção por Período" />
      ) : (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Volume Produzido</span>
            <span className="text-base font-extrabold text-[#022859] font-mono">
              {typeof totalProducao === 'number' ? `R$ ${totalProducao.toFixed(2)}` : totalProducao}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div className="bg-[#034AA6] h-full rounded-full w-full transition-all duration-500" />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>Período Ativo: <strong>{periodLabel}</strong></span>
            <span className="text-emerald-600 font-bold">100% Real</span>
          </div>
        </div>
      )}
    </div>
  );
};

// GRÁFICO 3 — Produção por Vendedor
export const ProductionBySellerChart: React.FC<{ 
  sellers: SellerData[]; 
  hasRealData: boolean 
}> = ({ sellers, hasRealData }) => {
  const maxProd = Math.max(...sellers.map(s => s.producao_total || 0), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#022859] flex items-center gap-2">
          <Users className="w-4 h-4 text-[#034AA6]" />
          Gráfico 3: Produção por Vendedor
        </h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ranking</span>
      </div>

      {!hasRealData || sellers.length === 0 ? (
        <EmptyChartState message="Aguardando dados da API de Vendedores" />
      ) : (
        <div className="space-y-3">
          {sellers.map((seller, idx) => {
            const pct = Math.max(((seller.producao_total || 0) / maxProd) * 100, 5);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="truncate max-w-[200px]">{seller.nome || 'Vendedor'}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-500 text-[10px]">{seller.contratos_qtd || 0} ctr</span>
                    <span className="text-emerald-600">R$ {Number(seller.producao_total || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-full bg-[#034AA6] transition-all duration-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// GRÁFICO 4 — Comissões (Previstas vs Aprovadas)
export const CommissionsChart: React.FC<{ 
  data: CommissionData; 
  hasRealData: boolean 
}> = ({ data, hasRealData }) => {
  const total = (data.previstas || 0) + (data.aprovadas || 0);
  const pctPrevistas = total > 0 ? ((data.previstas || 0) / total) * 100 : 0;
  const pctAprovadas = total > 0 ? ((data.aprovadas || 0) / total) * 100 : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#022859] flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#F2B807]" />
          Gráfico 4: Comissões (Previstas vs Aprovadas)
        </h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
      </div>

      {!hasRealData ? (
        <EmptyChartState message="Aguardando dados da API de Comissões" />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3">
              <span className="text-[10px] font-bold text-amber-700 block">Comissões Previstas</span>
              <p className="text-sm font-extrabold text-amber-800 font-mono mt-0.5">
                R$ {Number(data.previstas || 0).toFixed(2)}
              </p>
              <span className="text-[10px] font-semibold text-amber-600 font-mono">{pctPrevistas.toFixed(1)}% do total</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl p-3">
              <span className="text-[10px] font-bold text-emerald-700 block">Comissões Aprovadas</span>
              <p className="text-sm font-extrabold text-emerald-800 font-mono mt-0.5">
                R$ {Number(data.aprovadas || 0).toFixed(2)}
              </p>
              <span className="text-[10px] font-semibold text-emerald-600 font-mono">{pctAprovadas.toFixed(1)}% do total</span>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
            <div 
              className="bg-[#F2B807] h-full transition-all duration-500" 
              style={{ width: `${pctPrevistas}%` }}
              title={`Previstas: ${pctPrevistas.toFixed(1)}%`}
            />
            <div 
              className="bg-emerald-600 h-full transition-all duration-500" 
              style={{ width: `${pctAprovadas}%` }}
              title={`Aprovadas: ${pctAprovadas.toFixed(1)}%`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// GRÁFICO 5 — Financeiro
export const FinancialOverviewChart: React.FC<{ 
  data: FinanceData; 
  hasRealData: boolean 
}> = ({ data, hasRealData }) => {
  const items = [
    { label: 'Receita Estimada', value: data.receita, color: 'bg-[#034AA6]', text: 'text-[#034AA6]' },
    { label: 'Despesas Operacionais', value: data.despesas, color: 'bg-[#F28907]', text: 'text-[#F28907]' },
    { label: 'Comissões', value: data.comissoes, color: 'bg-[#F2B807]', text: 'text-[#F2B807]' },
    { label: 'Lucro Líquido', value: data.lucro_liquido, color: 'bg-emerald-600', text: 'text-emerald-600' },
  ];

  const maxVal = Math.max(...items.map(i => Math.abs(i.value || 0)), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#022859] flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#034AA6]" />
          Gráfico 5: Indicadores Financeiros
        </h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DRE Simplificado</span>
      </div>

      {!hasRealData ? (
        <EmptyChartState message="Aguardando dados da API Financeira" />
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const pct = Math.max((Math.abs(item.value || 0) / maxVal) * 100, 4);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                  <span className={`font-mono ${item.text}`}>
                    R$ {Number(item.value || 0).toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full ${item.color} transition-all duration-500 rounded-full`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// GRÁFICO 6 — Tarefas
export const TasksChart: React.FC<{ 
  data: TaskData; 
  hasRealData: boolean 
}> = ({ data, hasRealData }) => {
  const total = (data.pendentes || 0) + (data.concluidas || 0) + (data.atrasadas || 0);
  const pctPend = total > 0 ? ((data.pendentes || 0) / total) * 100 : 0;
  const pctConc = total > 0 ? ((data.concluidas || 0) / total) * 100 : 0;
  const pctAtra = total > 0 ? ((data.atrasadas || 0) / total) * 100 : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#022859] flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#034AA6]" />
          Gráfico 6: Distribuição de Tarefas
        </h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
      </div>

      {!hasRealData || total === 0 ? (
        <EmptyChartState message="Aguardando dados da API de Tarefas" />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200/50">
              <span className="text-[10px] font-bold text-amber-700 block">Pendentes</span>
              <p className="text-base font-extrabold text-amber-800 font-mono">{data.pendentes}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200/50">
              <span className="text-[10px] font-bold text-emerald-700 block">Concluídas</span>
              <p className="text-base font-extrabold text-emerald-800 font-mono">{data.concluidas}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2.5 border border-red-200/50">
              <span className="text-[10px] font-bold text-red-700 block">Atrasadas</span>
              <p className="text-base font-extrabold text-red-800 font-mono">{data.atrasadas}</p>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
            <div className="bg-[#F2B807] h-full" style={{ width: `${pctPend}%` }} title={`Pendentes: ${pctPend.toFixed(0)}%`} />
            <div className="bg-emerald-600 h-full" style={{ width: `${pctConc}%` }} title={`Concluídas: ${pctConc.toFixed(0)}%`} />
            <div className="bg-red-500 h-full" style={{ width: `${pctAtra}%` }} title={`Atrasadas: ${pctAtra.toFixed(0)}%`} />
          </div>
        </div>
      )}
    </div>
  );
};

// GRÁFICO 7 — WhatsApp
export const WhatsAppChart: React.FC<{ 
  data: WhatsAppData; 
  hasRealData: boolean 
}> = ({ data, hasRealData }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[#022859] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#034AA6]" />
          Gráfico 7: Indicadores de WhatsApp
        </h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atendimento</span>
      </div>

      {!hasRealData ? (
        <EmptyChartState message="Aguardando dados da API de WhatsApp" />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-200/50 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-blue-700 block">Conversas Abertas</span>
            <p className="text-base font-extrabold text-blue-900 font-mono mt-0.5">{data.conversas_abertas}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200/50 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-emerald-700 block">Encerradas</span>
            <p className="text-base font-extrabold text-emerald-900 font-mono mt-0.5">{data.conversas_encerradas}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-700 block">Total Mensagens</span>
            <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{data.mensagens_total}</p>
          </div>
        </div>
      )}
    </div>
  );
};
