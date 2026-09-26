import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';
import { Contract } from '../../types/crm';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  FileCheck,
  Search,
  Filter,
  DollarSign,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';

export const ContractsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [detailContract, setDetailContract] = useState<Contract | null>(null);

  const contracts = apiService.getContracts(currentUser);
  const allUsers = apiService.getUsers();
  const sellers = allUsers.filter((u) => u.role === 'Vendedor' && u.status === 'Ativo');

  // Filtered list
  const filteredContracts = contracts.filter((ctr) => {
    const matchesSearch =
      ctr.numero_contrato.toLowerCase().includes(search.toLowerCase()) ||
      ctr.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (ctr.client_cpf && ctr.client_cpf.includes(search)) ||
      ctr.banco_nome.toLowerCase().includes(search.toLowerCase()) ||
      ctr.produto_nome.toLowerCase().includes(search.toLowerCase());

    const matchesSeller = !selectedSeller || ctr.vendedor_id === selectedSeller;
    const matchesStatus = !selectedStatus || ctr.status === selectedStatus;

    return matchesSearch && matchesSeller && matchesStatus;
  });

  // Metrics
  const totalVolume = filteredContracts.reduce((acc, c) => acc + c.valor, 0);
  const avgTicket = filteredContracts.length > 0 ? totalVolume / filteredContracts.length : 0;
  const paidCount = filteredContracts.filter((c) => c.status === 'Pago').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">Contratos Emitidos</h2>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">
              Fase 2 • Operações Efetivadas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestão consolidada de contratos convertidos a partir da esteira de oportunidades.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{contracts.length} Contratos Registrados</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Contratos</span>
            <span className="text-lg font-extrabold text-white">{filteredContracts.length}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Volume Total</span>
            <span className="text-lg font-extrabold text-emerald-400">{formatCurrency(totalVolume)}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ticket Médio</span>
            <span className="text-lg font-extrabold text-white">{formatCurrency(avgTicket)}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contratos Pagos</span>
            <span className="text-lg font-extrabold text-white">{paidCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar contrato, cliente, CPF ou banco..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Vendedor */}
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
            >
              <option value="">Todos Vendedores</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
            >
              <option value="">Todos Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Pago">Pago</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Contrato</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Banco / Produto</th>
                <th className="px-4 py-3">Valor / Prazo</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3">Conversão</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    <FileCheck className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Nenhum contrato encontrado.</p>
                    <p className="text-[11px] text-slate-600">
                      Converta oportunidades aprovadas na esteira Kanban para gerar novos contratos.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((ctr) => (
                  <tr key={ctr.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                      #{ctr.numero_contrato}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-white block">{ctr.client_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{ctr.client_cpf || 'CPF não inf.'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-200 font-semibold block">{ctr.banco_nome}</span>
                      <span className="text-[10px] text-slate-400">{ctr.produto_nome}</span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="text-emerald-400 font-bold block">{formatCurrency(ctr.valor)}</span>
                      <span className="text-[10px] text-slate-400">{ctr.prazo} parcelas</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 font-medium block">{ctr.vendedor_nome}</span>
                      <span className="text-[10px] text-slate-500">{ctr.supervisor_nome || 'Sem sup.'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 block">{formatDate(ctr.converted_at)}</span>
                      <span className="text-[10px] text-slate-500">Por: {ctr.converted_by_user_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ctr.status === 'Pago'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : ctr.status === 'Ativo'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {ctr.status === 'Pago' && <CheckCircle2 className="w-3 h-3" />}
                        {ctr.status === 'Ativo' && <Clock className="w-3 h-3" />}
                        {ctr.status === 'Cancelado' && <XCircle className="w-3 h-3" />}
                        <span>{ctr.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDetailContract(ctr)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Detail Modal */}
      {detailContract && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setDetailContract(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                  Contrato Oficial Efetivado
                </span>
                <h3 className="text-base font-extrabold text-white">#{detailContract.numero_contrato}</h3>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Cliente</span>
                  <span className="font-bold text-white block">{detailContract.client_name}</span>
                  <span className="text-[11px] font-mono text-slate-400">{detailContract.client_cpf || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Valor Total</span>
                  <span className="font-extrabold text-emerald-400 text-sm block">
                    {formatCurrency(detailContract.valor)}
                  </span>
                  <span className="text-[11px] text-slate-400">{detailContract.prazo} parcelas</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Instituição Financeira</span>
                  <span className="font-bold text-slate-200 block">{detailContract.banco_nome}</span>
                  <span className="text-[11px] text-slate-400">{detailContract.produto_nome}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Status do Contrato</span>
                  <span className="font-bold text-slate-200 block">{detailContract.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Vendedor Responsável</span>
                  <span className="text-slate-300 font-medium block">{detailContract.vendedor_nome}</span>
                  <span className="text-[10px] text-slate-500">Sup: {detailContract.supervisor_nome || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Data de Conversão</span>
                  <span className="text-slate-300 block">{formatDate(detailContract.converted_at)}</span>
                  <span className="text-[10px] text-slate-500">Por: {detailContract.converted_by_user_name}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailContract(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
