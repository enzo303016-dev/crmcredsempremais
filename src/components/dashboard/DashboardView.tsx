import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Users,
  ClipboardList,
  DollarSign,
  TrendingUp,
  BadgePercent,
  Activity,
  UserCheck,
  ShieldAlert,
  ArrowUpRight,
  Database,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const DashboardView: React.FC<{
  onNavigateToUsers: () => void;
  onNavigateToTab?: (tab: string) => void;
}> = ({ onNavigateToUsers, onNavigateToTab }) => {
  const { currentUser } = useAuth();
  const auditLogs = apiService.getAuditLogs().slice(0, 6);
  const users = apiService.getUsers();
  const leads = apiService.getLeads(currentUser);
  const opportunities = apiService.getOpportunities(currentUser);

  const supervisors = users.filter((u) => u.role === 'Supervisor');
  const sellers = users.filter((u) => u.role === 'Vendedor');

  // Real Phase 2 calculations
  const totalLeads = leads.length;
  const newLeadsCount = leads.filter((l) => l.status === 'Novo').length;
  const inContactLeadsCount = leads.filter((l) => l.status === 'Em contato').length;

  const totalOpps = opportunities.length;
  const inProgressOpps = opportunities.filter((o) => o.status === 'Em andamento').length;
  const approvedOpps = opportunities.filter((o) => o.status === 'Aprovado').length;
  const paidOpps = opportunities.filter((o) => o.status === 'Pago').length;

  const totalProduction = opportunities.reduce((sum, o) => sum + (o.valor || 0), 0);

  const opCommissions = apiService.getOperationCommissions(currentUser);
  const approvedCommissionsSum = opCommissions
    .filter((c) => c.status === 'APROVADA')
    .reduce((sum, c) => sum + c.comissao_vendedor_valor, 0);
  const companyResultSum = opCommissions
    .filter((c) => c.status === 'APROVADA')
    .reduce((sum, c) => sum + c.resultado_empresa_valor, 0);

  // Metric cards
  const metrics = [
    {
      title: 'Leads Cadastrados',
      value: String(totalLeads),
      subtitle: `${newLeadsCount} novo(s) • ${inContactLeadsCount} em contato`,
      icon: Users,
      color: 'text-[#034AA6]',
      bgColor: 'bg-[#034AA6]/10 border-[#034AA6]/20',
      tabKey: 'leads',
    },
    {
      title: 'Oportunidades em Esteira',
      value: String(totalOpps),
      subtitle: `${inProgressOpps} em andamento • ${paidOpps} pago(s)`,
      icon: ClipboardList,
      color: 'text-[#F28907]',
      bgColor: 'bg-[#F28907]/10 border-[#F28907]/20',
      tabKey: 'oportunidades',
    },
    {
      title: 'Produção Total (R$)',
      value: formatCurrency(totalProduction),
      subtitle: 'Volume total de propostas',
      icon: DollarSign,
      color: 'text-[#034AA6]',
      bgColor: 'bg-[#034AA6]/10 border-[#034AA6]/20',
      tabKey: 'oportunidades',
    },
    {
      title: 'Comissões Aprovadas',
      value: formatCurrency(approvedCommissionsSum),
      subtitle: 'Comissões de vendedores',
      icon: BadgePercent,
      color: 'text-[#F2B807]',
      bgColor: 'bg-[#F2B807]/20 border-[#F2B807]/40',
      tabKey: 'comissoes',
    },
    {
      title: 'Resultado da Empresa',
      value: formatCurrency(companyResultSum),
      subtitle: 'Resultado previsto de operações',
      icon: TrendingUp,
      color: 'text-[#022859]',
      bgColor: 'bg-[#022859]/10 border-[#022859]/20',
      tabKey: 'comissoes',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Phase Banner */}
      <div className="bg-[#022859] border border-[#034AA6]/40 rounded-2xl p-6 shadow-xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#034AA6]/30 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#034AA6] border border-[#F2B807]/40 text-[#F2B807] text-xs font-bold rounded-full mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CRM Cred Sempre + • Visão Geral</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">
              Olá, {currentUser?.name}!
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-2xl">
              Bem-vindo ao CRM Oficial da Cred Sempre +. Acompanhe a produção de leads, esteira de oportunidades, contratos emitidos e gestão de parceiros em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNavigateToUsers}
              className="px-4 py-2.5 bg-[#034AA6] hover:bg-[#022859] border border-[#F2B807]/50 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-[#F2B807]" />
              <span>Equipe ({users.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateToTab && onNavigateToTab(m.tabKey)}
              className="bg-white border border-slate-200 rounded-2xl p-4 transition-all hover:border-[#034AA6] hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#022859] truncate">{m.title}</span>
                <div className={`p-2 rounded-xl border ${m.bgColor}`}>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
              </div>
              <div className="text-xl font-extrabold text-[#034AA6] tracking-tight font-mono">
                {m.value}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 truncate font-medium">{m.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* KPI Detailed Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-3 bg-[#F2F2F2] rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold text-[#022859] block uppercase">Leads Novos</span>
          <span className="text-sm font-extrabold text-[#034AA6] font-mono">{newLeadsCount}</span>
        </div>
        <div className="p-3 bg-[#F2F2F2] rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold text-[#022859] block uppercase">Em Contato</span>
          <span className="text-sm font-extrabold text-[#F28907] font-mono">{inContactLeadsCount}</span>
        </div>
        <div className="p-3 bg-[#F2F2F2] rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold text-[#022859] block uppercase">Propostas Em Esteira</span>
          <span className="text-sm font-extrabold text-[#034AA6] font-mono">{inProgressOpps}</span>
        </div>
        <div className="p-3 bg-[#F2F2F2] rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold text-[#022859] block uppercase">Propostas Aprovadas</span>
          <span className="text-sm font-extrabold text-[#F28907] font-mono">{approvedOpps}</span>
        </div>
        <div className="p-3 bg-[#F2F2F2] rounded-xl border border-slate-200 text-center">
          <span className="text-[10px] font-bold text-[#022859] block uppercase">Contratos Pagos</span>
          <span className="text-sm font-extrabold text-[#034AA6] font-mono">{paidOpps}</span>
        </div>
      </div>

      {/* Main Content Grid: Recent Activities & Team Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividades Recentes (Audit Logs) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#034AA6]" />
              <h3 className="text-sm font-extrabold text-[#022859]">Atividades Recentes no CRM</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Log de Vendas & Auditoria</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p>Não há dados para exibir.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-[#F2F2F2] border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[#022859] truncate">{log.user_name}</span>
                      <span className="px-1.5 py-0.5 bg-[#034AA6] text-white text-[9px] font-mono font-bold rounded">
                        {log.module}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{log.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-500 block font-semibold">
                      {formatDate(log.created_at)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">{log.ip_address}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo da Equipe */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#034AA6]" />
              <h3 className="text-sm font-extrabold text-[#022859]">Resumo da Equipe</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">{users.length} membros</span>
          </div>

          {supervisors.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs my-auto">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p>Não há dados para exibir.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {supervisors.map((sup) => {
                const teamMembers = sellers.filter((s) => s.supervisor_id === sup.id);
                return (
                  <div key={sup.id} className="p-3.5 bg-[#F2F2F2] border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-extrabold text-[#022859]">{sup.name}</p>
                        <p className="text-[10px] text-[#034AA6] font-bold">Supervisor de Equipe</p>
                      </div>
                      <span className="px-2 py-0.5 bg-[#034AA6]/10 border border-[#034AA6]/30 text-[#034AA6] text-[10px] font-bold rounded-full">
                        {teamMembers.length} vendedore(s)
                      </span>
                    </div>

                    {teamMembers.length > 0 ? (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1.5">
                        {teamMembers.map((seller) => (
                          <div key={seller.id} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-700 font-semibold">{seller.name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                seller.status === 'Ativo'
                                  ? 'text-[#034AA6] bg-[#034AA6]/10'
                                  : 'text-rose-600 bg-rose-100'
                              }`}
                            >
                              {seller.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1 italic">Nenhum vendedor vinculado.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={onNavigateToUsers}
              className="text-xs font-bold text-[#034AA6] hover:text-[#022859] transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos os usuários</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
